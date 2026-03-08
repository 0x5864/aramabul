#!/usr/bin/env python3
"""Fetch OPET station data and merge it into akaryakit datasets.

This script:
1. Fetches province and station data from OPET public API.
2. Normalizes records to aramabul `akaryakit.json` schema.
3. Merges normalized OPET rows with existing akaryakit rows.
4. Writes timestamped full backups before any write.
5. Syncs both web and android dataset copies.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT_DIR: Path = Path(__file__).resolve().parents[1]
WEB_DATA_PATH: Path = ROOT_DIR / "data" / "akaryakit.json"
ANDROID_DATA_PATH: Path = ROOT_DIR / "android_app" / "assets" / "web" / "data" / "akaryakit.json"
DISTRICTS_PATH: Path = ROOT_DIR / "data" / "districts.json"
REPORT_PATH: Path = ROOT_DIR / "data" / "akaryakit-opet-import-report.json"

OPET_API_BASE: str = "https://api.opet.com.tr/api"
DEFAULT_USER_AGENT: str = "Mozilla/5.0 (aramabul-opet-import/1.0)"
TURKISH_TRANSLATE: dict[int, str] = str.maketrans("çğıöşüâîû", "cgiosuaiu")


def read_json(path: Path) -> Any:
    """Read and parse JSON from disk."""
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    """Write JSON payload with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def normalize_text(value: Any) -> str:
    """Normalize text by trimming and collapsing spaces."""
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_key(value: Any) -> str:
    """Normalize text to a compact compare key."""
    lowered: str = normalize_text(value).lower().translate(TURKISH_TRANSLATE)
    return re.sub(r"[^a-z0-9]", "", lowered)


def to_title_case_tr(value: Any) -> str:
    """Convert mostly uppercase text to Turkish title case."""
    text: str = normalize_text(value)
    if not text:
        return ""
    return (
        text.lower()
        .replace("i̇", "i")
        .title()
        .replace("Ii", "Iı")
        .replace("İ", "İ")
    )


def build_city_index(district_map: dict[str, list[str]]) -> dict[str, str]:
    """Build normalized city to canonical city name mapping."""
    index: dict[str, str] = {}
    for city in district_map:
        city_key: str = normalize_key(city)
        if city_key:
            index[city_key] = city
    return index


def build_district_index(district_map: dict[str, list[str]]) -> dict[str, dict[str, str]]:
    """Build per-city district normalization index."""
    index: dict[str, dict[str, str]] = {}
    for city, districts in district_map.items():
        city_key: str = normalize_key(city)
        row: dict[str, str] = {}
        for district in districts:
            district_key: str = normalize_key(district)
            if district_key:
                row[district_key] = district
        index[city_key] = row
    return index


def canonical_city(province: Any, city_index: dict[str, str]) -> str:
    """Return canonical city name from OPET province value."""
    province_text: str = normalize_text(province)
    province_key: str = normalize_key(province_text)
    if province_key and province_key in city_index:
        return city_index[province_key]
    return to_title_case_tr(province_text)


def canonical_district(
    city: str,
    district: Any,
    district_index: dict[str, dict[str, str]],
) -> str:
    """Return canonical district for a city, fallback to title case."""
    district_text: str = normalize_text(district)
    district_key: str = normalize_key(district_text)
    city_key: str = normalize_key(city)
    city_districts: dict[str, str] = district_index.get(city_key, {})
    if district_key and district_key in city_districts:
        return city_districts[district_key]
    if district_key == "merkez":
        return "Merkez"
    return to_title_case_tr(district_text) or "Merkez"


def request_json(
    url: str,
    *,
    payload: dict[str, Any] | None = None,
    timeout_seconds: int = 45,
) -> Any:
    """Perform an HTTP request and parse JSON response."""
    body: bytes | None = None
    method: str = "GET"
    headers: dict[str, str] = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "tr-TR,tr;q=0.9",
        "Channel": "Web",
        "User-Agent": DEFAULT_USER_AGENT,
    }
    if payload is not None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        method = "POST"
        headers["Content-Type"] = "application/json"

    request: urllib.request.Request = urllib.request.Request(
        url=url,
        data=body,
        method=method,
        headers=headers,
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        raw: bytes = response.read()
    return json.loads(raw.decode("utf-8"))


def fetch_provinces() -> list[dict[str, Any]]:
    """Fetch OPET province list."""
    url: str = f"{OPET_API_BASE}/locations/provinces"
    payload: Any = request_json(url)
    if not isinstance(payload, list):
        return []
    return [row for row in payload if isinstance(row, dict)]


def fetch_stations_by_province(province_name: str) -> list[dict[str, Any]]:
    """Fetch OPET stations for one province name."""
    url: str = f"{OPET_API_BASE}/stations/v2"
    payload: Any = request_json(url, payload={"province": province_name})
    if not isinstance(payload, list):
        return []
    return [row for row in payload if isinstance(row, dict)]


def build_maps_url(name: str, address: str, city: str, district: str, latitude: Any, longitude: Any) -> str:
    """Build Google Maps URL using coordinates when available."""
    try:
        lat_value: float = float(latitude)
        lng_value: float = float(longitude)
        query: str = f"{lat_value:.6f},{lng_value:.6f}"
    except (TypeError, ValueError):
        query = " ".join(part for part in [name, address, district, city] if normalize_text(part))
    encoded_query: str = urllib.parse.quote_plus(query)
    return f"https://www.google.com/maps/search/?api=1&query={encoded_query}"


def normalize_opet_record(
    station: dict[str, Any],
    city_index: dict[str, str],
    district_index: dict[str, dict[str, str]],
) -> dict[str, Any] | None:
    """Normalize raw OPET station to aramabul akaryakit schema."""
    station_id: str = normalize_text(station.get("id"))
    if not station_id:
        return None

    name: str = normalize_text(station.get("name"))
    address: str = normalize_text(station.get("address"))
    city: str = canonical_city(station.get("province"), city_index)
    district: str = canonical_district(city, station.get("district"), district_index)
    maps_url: str = build_maps_url(
        name=name,
        address=address,
        city=city,
        district=district,
        latitude=station.get("latitude"),
        longitude=station.get("longitude"),
    )
    website: str = ""

    return {
        "city": city,
        "district": district,
        "name": name or f"OPET İstasyonu {station_id}",
        "address": address,
        "placeId": f"opet-{station_id}",
        "mapsUrl": maps_url,
        "website": website,
        "source": "opet_api",
    }


def sort_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return records sorted by city, district, then station name."""
    return sorted(
        records,
        key=lambda row: (
            normalize_text(row.get("city")).lower(),
            normalize_text(row.get("district")).lower(),
            normalize_text(row.get("name")).lower(),
        ),
    )


def merge_records(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Merge incoming records into existing rows with duplicate guard."""
    merged: list[dict[str, Any]] = [row for row in existing if isinstance(row, dict)]
    known_keys: set[str] = set()

    def row_key(row: dict[str, Any]) -> str:
        place_id: str = normalize_text(row.get("placeId"))
        if place_id:
            return f"place:{place_id.lower()}"
        return (
            "fallback:"
            f"{normalize_key(row.get('city'))}|"
            f"{normalize_key(row.get('district'))}|"
            f"{normalize_key(row.get('name'))}|"
            f"{normalize_key(row.get('address'))}"
        )

    for row in merged:
        known_keys.add(row_key(row))

    added_count: int = 0
    for row in incoming:
        key: str = row_key(row)
        if key in known_keys:
            continue
        known_keys.add(key)
        merged.append(row)
        added_count += 1

    return sort_records(merged), added_count


def backup_file(path: Path, timestamp: str) -> Path:
    """Create timestamped full backup next to target file."""
    backup_name: str = f"{path.stem}-full-backup-{timestamp}{path.suffix}"
    backup_path: Path = path.parent / backup_name
    raw: str = path.read_text(encoding="utf-8")
    backup_path.write_text(raw if raw.endswith("\n") else f"{raw}\n", encoding="utf-8")
    return backup_path


def collect_opet_records(
    city_index: dict[str, str],
    district_index: dict[str, dict[str, str]],
    request_pause_seconds: float,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Fetch and normalize all OPET stations province by province."""
    provinces: list[dict[str, Any]] = fetch_provinces()
    normalized: list[dict[str, Any]] = []
    per_city_counts: Counter[str] = Counter()
    seen_place_ids: set[str] = set()

    for province in provinces:
        province_name: str = normalize_text(province.get("name"))
        if not province_name:
            continue
        rows: list[dict[str, Any]] = fetch_stations_by_province(province_name)
        for station in rows:
            normalized_row: dict[str, Any] | None = normalize_opet_record(
                station=station,
                city_index=city_index,
                district_index=district_index,
            )
            if normalized_row is None:
                continue
            place_id: str = normalize_text(normalized_row.get("placeId"))
            if place_id in seen_place_ids:
                continue
            seen_place_ids.add(place_id)
            normalized.append(normalized_row)
            per_city_counts[normalize_text(normalized_row.get("city"))] += 1
        if request_pause_seconds > 0:
            time.sleep(request_pause_seconds)

    return sort_records(normalized), dict(sorted(per_city_counts.items(), key=lambda item: item[0].lower()))


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Fetch OPET stations and merge into akaryakit.json")
    parser.add_argument("--dry-run", action="store_true", help="Do not write files")
    parser.add_argument(
        "--request-pause-seconds",
        type=float,
        default=0.05,
        help="Pause between province requests",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=REPORT_PATH,
        help="Path to write import report JSON",
    )
    return parser.parse_args()


def main() -> None:
    """Run OPET data fetch and merge pipeline."""
    args: argparse.Namespace = parse_args()
    timestamp: str = datetime.now().strftime("%Y%m%d-%H%M%S")

    district_map: dict[str, list[str]] = read_json(DISTRICTS_PATH)
    city_index: dict[str, str] = build_city_index(district_map)
    district_index: dict[str, dict[str, str]] = build_district_index(district_map)

    existing_web: list[dict[str, Any]] = read_json(WEB_DATA_PATH)
    existing_android: list[dict[str, Any]] = read_json(ANDROID_DATA_PATH)

    normalized_opet, per_city_counts = collect_opet_records(
        city_index=city_index,
        district_index=district_index,
        request_pause_seconds=max(0.0, args.request_pause_seconds),
    )

    merged_rows, added_count = merge_records(existing_web, normalized_opet)
    report: dict[str, Any] = {
        "timestamp": timestamp,
        "opetFetched": len(normalized_opet),
        "existingWebBefore": len(existing_web),
        "existingAndroidBefore": len(existing_android),
        "mergedAfter": len(merged_rows),
        "added": added_count,
        "source": OPET_API_BASE,
        "cityCounts": per_city_counts,
    }

    if args.dry_run:
        print(json.dumps({**report, "dryRun": True}, ensure_ascii=False, indent=2))
        return

    web_backup: Path = backup_file(WEB_DATA_PATH, timestamp)
    android_backup: Path = backup_file(ANDROID_DATA_PATH, timestamp)
    write_json(WEB_DATA_PATH, merged_rows)
    write_json(ANDROID_DATA_PATH, merged_rows)
    write_json(args.report_path, report)

    print(
        json.dumps(
            {
                **report,
                "webBackup": str(web_backup),
                "androidBackup": str(android_backup),
                "reportPath": str(args.report_path),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
