#!/usr/bin/env python3
"""Fetch Lukoil station data and merge into akaryakit datasets.

This script:
1. Downloads station JSON from Lukoil endpoint.
2. Normalizes rows to aramabul akaryakit schema.
3. Prefixes names with `LUKOIL `.
4. Replaces previous `lukoil_web` rows.
5. Writes both web and android files with timestamped backups.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT_DIR: Path = Path(__file__).resolve().parents[1]
WEB_DATA_PATH: Path = ROOT_DIR / "data" / "akaryakit.json"
ANDROID_DATA_PATH: Path = ROOT_DIR / "android_app" / "assets" / "web" / "data" / "akaryakit.json"
REPORT_PATH: Path = ROOT_DIR / "data" / "akaryakit-lukoil-import-report.json"

LUKOIL_STATIONS_URL: str = "https://www.lukoil.com.tr/Station/GetAllStationsAjax"
LUKOIL_SITE_URL: str = "https://www.lukoil.com.tr/istasyonlar"
LUKOIL_SOURCE: str = "lukoil_web"


def read_json(path: Path) -> Any:
    """Read JSON file from disk."""
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    """Write JSON payload to disk with formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def backup_file(path: Path, timestamp: str) -> Path:
    """Create timestamped full backup copy."""
    backup_path: Path = path.parent / f"{path.stem}-full-backup-{timestamp}{path.suffix}"
    raw: str = path.read_text(encoding="utf-8")
    backup_path.write_text(raw if raw.endswith("\n") else f"{raw}\n", encoding="utf-8")
    return backup_path


def normalize_text(value: Any) -> str:
    """Normalize text by trimming and collapsing whitespace."""
    return re.sub(r"\s+", " ", str(value or "")).strip()


def to_title_case_tr(value: Any) -> str:
    """Convert uppercase-like Turkish text to title case."""
    clean: str = normalize_text(value)
    if not clean:
        return ""
    return (
        clean.lower()
        .replace("i̇", "i")
        .title()
        .replace("Ii", "Iı")
        .replace("İ", "İ")
    )


def strip_prefix(name: str, prefix: str) -> str:
    """Strip known prefix from a name."""
    clean: str = normalize_text(name)
    token: str = f"{prefix} "
    if clean.upper().startswith(token.upper()):
        return clean[len(token) :].strip()
    return clean


def build_maps_url(latitude: Any, longitude: Any, fallback_query: str) -> str:
    """Build Google Maps URL from coordinates, fallback to text query."""
    try:
        lat: float = float(str(latitude).replace(",", "."))
        lng: float = float(str(longitude).replace(",", "."))
        query: str = f"{lat:.6f},{lng:.6f}"
    except (TypeError, ValueError):
        query = normalize_text(fallback_query)
    return f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(query)}"


def fetch_lukoil_rows(timeout_seconds: int) -> list[dict[str, Any]]:
    """Fetch raw Lukoil stations from JSON endpoint."""
    request: urllib.request.Request = urllib.request.Request(
        LUKOIL_STATIONS_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (aramabul-lukoil-import/1.0)",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "tr-TR,tr;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        payload: Any = json.loads(response.read().decode("utf-8", errors="ignore"))

    if not isinstance(payload, dict):
        return []
    rows: Any = payload.get("data", [])
    if not isinstance(rows, list):
        return []
    return [row for row in rows if isinstance(row, dict)]


def build_place_id(row: dict[str, Any]) -> str:
    """Build deterministic place id for one row."""
    raw_key: str = "|".join(
        [
            normalize_text(row.get("trCode")),
            normalize_text(row.get("stationName")),
            normalize_text(row.get("city")),
            normalize_text(row.get("district")),
            normalize_text(row.get("address")),
            normalize_text(row.get("latitude")),
            normalize_text(row.get("longitude")),
        ]
    )
    digest: str = hashlib.sha1(raw_key.encode("utf-8"), usedforsecurity=False).hexdigest()[:16]
    return f"lukoil-{digest}"


def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    """Normalize one Lukoil row to akaryakit schema."""
    city: str = to_title_case_tr(row.get("city"))
    district: str = to_title_case_tr(row.get("district")) or "Merkez"
    base_name: str = strip_prefix(normalize_text(row.get("stationName")), "LUKOIL")
    name: str = f"LUKOIL {base_name or 'İstasyonu'}"
    address: str = normalize_text(row.get("address"))
    maps_query: str = " ".join(part for part in [name, address, district, city] if part)
    maps_url: str = build_maps_url(row.get("latitude"), row.get("longitude"), maps_query)

    return {
        "city": city,
        "district": district,
        "name": name,
        "address": address,
        "placeId": build_place_id(row),
        "mapsUrl": maps_url,
        "website": LUKOIL_SITE_URL,
        "source": LUKOIL_SOURCE,
    }


def dedupe_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Dedupe rows by placeId."""
    output: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        place_id: str = normalize_text(row.get("placeId"))
        if not place_id or place_id in seen:
            continue
        seen.add(place_id)
        output.append(row)
    return output


def sort_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sort by city, district, then name."""
    return sorted(
        rows,
        key=lambda row: (
            normalize_text(row.get("city")).lower(),
            normalize_text(row.get("district")).lower(),
            normalize_text(row.get("name")).lower(),
        ),
    )


def parse_args() -> argparse.Namespace:
    """Parse command line options."""
    parser: argparse.ArgumentParser = argparse.ArgumentParser(description="Fetch Lukoil records into akaryakit.json")
    parser.add_argument("--dry-run", action="store_true", help="Do not write files.")
    parser.add_argument("--timeout", type=int, default=45, help="Request timeout in seconds.")
    return parser.parse_args()


def main() -> None:
    """Run Lukoil import."""
    args: argparse.Namespace = parse_args()
    timestamp: str = datetime.now().strftime("%Y%m%d-%H%M%S")

    raw_rows: list[dict[str, Any]] = fetch_lukoil_rows(timeout_seconds=max(5, args.timeout))
    active_rows: list[dict[str, Any]] = [row for row in raw_rows if bool(row.get("isActive", True))]
    normalized_lukoil: list[dict[str, Any]] = dedupe_rows([normalize_row(row) for row in active_rows])
    normalized_lukoil = sort_rows(normalized_lukoil)

    web_existing: list[dict[str, Any]] = read_json(WEB_DATA_PATH)
    android_existing: list[dict[str, Any]] = read_json(ANDROID_DATA_PATH)
    if not isinstance(web_existing, list) or not isinstance(android_existing, list):
        raise RuntimeError("akaryakit dataset must be a list")

    web_without_lukoil: list[dict[str, Any]] = [
        row for row in web_existing if normalize_text(row.get("source")).lower() != LUKOIL_SOURCE
    ]
    merged_rows: list[dict[str, Any]] = sort_rows(web_without_lukoil + normalized_lukoil)

    report: dict[str, Any] = {
        "timestamp": timestamp,
        "sourceUrl": LUKOIL_STATIONS_URL,
        "rawRowsFetched": len(raw_rows),
        "activeRowsFetched": len(active_rows),
        "normalizedLukoilRows": len(normalized_lukoil),
        "existingWebBefore": len(web_existing),
        "existingAndroidBefore": len(android_existing),
        "webWithoutLukoil": len(web_without_lukoil),
        "mergedAfter": len(merged_rows),
    }

    if args.dry_run:
        print(json.dumps({**report, "dryRun": True}, ensure_ascii=False, indent=2))
        return

    web_backup: Path = backup_file(WEB_DATA_PATH, timestamp)
    android_backup: Path = backup_file(ANDROID_DATA_PATH, timestamp)
    write_json(WEB_DATA_PATH, merged_rows)
    write_json(ANDROID_DATA_PATH, merged_rows)
    write_json(REPORT_PATH, report)

    print(
        json.dumps(
            {
                **report,
                "webBackup": str(web_backup),
                "androidBackup": str(android_backup),
                "reportPath": str(REPORT_PATH),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
