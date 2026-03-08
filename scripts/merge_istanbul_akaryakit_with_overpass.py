#!/usr/bin/env python3
"""Merge Istanbul fuel data with multi-pass OpenStreetMap Overpass results.

This script does four things:
1. Loads legacy Istanbul fuel records from backup.
2. Pulls fresh OSM records from multiple Overpass endpoints and query passes.
3. Merges legacy + OSM records and deduplicates overlap.
4. Rewrites akaryakit data files for web and Android.

It also stores pre-merge Istanbul snapshots and a merge report.
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT_DIR: Path = Path(__file__).resolve().parents[1]
WEB_DATA_PATH: Path = ROOT_DIR / "data" / "akaryakit.json"
ANDROID_DATA_PATH: Path = ROOT_DIR / "android_app" / "assets" / "web" / "data" / "akaryakit.json"
DISTRICTS_PATH: Path = ROOT_DIR / "data" / "districts.json"

LEGACY_BACKUP_WEB_PATH: Path = ROOT_DIR / "data" / "akaryakit-istanbul-legacy-20260308.json"
LEGACY_BACKUP_ANDROID_PATH: Path = ROOT_DIR / "android_app" / "assets" / "web" / "data" / "akaryakit-istanbul-legacy-20260308.json"

PREMERGE_BACKUP_WEB_PATH: Path = ROOT_DIR / "data" / "akaryakit-istanbul-pre-merge-20260308.json"
PREMERGE_BACKUP_ANDROID_PATH: Path = ROOT_DIR / "android_app" / "assets" / "web" / "data" / "akaryakit-istanbul-pre-merge-20260308.json"

MERGE_REPORT_PATH: Path = ROOT_DIR / "tmp" / "istanbul-akaryakit-merge-report-20260308.json"
OSM_RAW_DUMP_PATH: Path = ROOT_DIR / "tmp" / "istanbul-akaryakit-overpass-raw-20260308.json"

CITY_NAME: str = "İstanbul"

OVERPASS_ENDPOINTS: tuple[str, ...] = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

OVERPASS_QUERIES: dict[str, str] = {
    "amenity_fuel": """
[out:json][timeout:240];
area["name"~"^(Istanbul|İstanbul)$"]["boundary"="administrative"]["admin_level"="4"]->.searchArea;
(
  node["amenity"="fuel"](area.searchArea);
  way["amenity"="fuel"](area.searchArea);
  relation["amenity"="fuel"](area.searchArea);
);
out center tags;
""".strip(),
    "shop_fuel": """
[out:json][timeout:240];
area["name"~"^(Istanbul|İstanbul)$"]["boundary"="administrative"]["admin_level"="4"]->.searchArea;
(
  node["shop"="fuel"](area.searchArea);
  way["shop"="fuel"](area.searchArea);
  relation["shop"="fuel"](area.searchArea);
);
out center tags;
""".strip(),
    "fuel_key_regex": """
[out:json][timeout:240];
area["name"~"^(Istanbul|İstanbul)$"]["boundary"="administrative"]["admin_level"="4"]->.searchArea;
(
  node[~"^fuel(:|$)"~"."](area.searchArea);
  way[~"^fuel(:|$)"~"."](area.searchArea);
  relation[~"^fuel(:|$)"~"."](area.searchArea);
);
out center tags;
""".strip(),
}


def read_json(path: Path) -> Any:
    """Read a JSON file."""
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, payload: Any) -> None:
    """Write JSON with UTF-8 and pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def normalize_text(value: Any) -> str:
    """Collapse extra spaces and trim."""
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_key(value: Any) -> str:
    """Normalize Turkish text for comparison."""
    text: str = normalize_text(value).lower()
    replace_map: dict[int, str] = str.maketrans("çğıöşüâîû", "cgiosuaiu")
    text = text.translate(replace_map)
    return re.sub(r"[^a-z0-9]", "", text)


def is_istanbul_city(value: Any) -> bool:
    """Return True if city value means Istanbul."""
    return normalize_key(value) in {"istanbul", "iistanbul"}


def parse_postcode(address: str) -> str:
    """Extract 5-digit postcode from address."""
    match: re.Match[str] | None = re.search(r"\b\d{5}\b", normalize_text(address))
    return match.group(0) if match else ""


def parse_neighborhood(address: str) -> str:
    """Extract neighborhood text from address if available."""
    source: str = normalize_text(address)
    if not source:
        return ""
    match: re.Match[str] | None = re.search(r"([^,]{2,70}\b(?:Mah\.|Mahallesi))", source, re.IGNORECASE)
    return normalize_text(match.group(1)) if match else ""


def resolve_district(raw_district: str, address: str, district_list: list[str]) -> str:
    """Resolve district from explicit district or address text."""
    district_text: str = normalize_text(raw_district)
    if district_text:
        return district_text

    address_key: str = normalize_key(address)
    if address_key:
        for district in district_list:
            if normalize_key(district) and normalize_key(district) in address_key:
                return district

    return "Merkez"


def build_google_maps_url(name: str, address: str, district: str, city: str) -> str:
    """Build a Google Maps search URL from venue fields."""
    parts: list[str] = []
    for value in (name, address, district, city):
        clean: str = normalize_text(value)
        if clean and clean not in parts:
            parts.append(clean)
    query: str = " ".join(parts)
    return f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(query)}"


def fetch_overpass_json(endpoint: str, query: str, timeout_seconds: int = 240, retries: int = 2) -> dict[str, Any]:
    """Fetch one Overpass response JSON with retry."""
    body: bytes = urllib.parse.urlencode({"data": query}).encode("utf-8")
    headers: dict[str, str] = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "aramabul-overpass-merge/1.0",
    }

    last_error: Exception | None = None
    for attempt in range(1, retries + 2):
        try:
            request = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                content: bytes = response.read()
            payload: dict[str, Any] = json.loads(content.decode("utf-8"))
            return payload
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < retries + 1:
                time.sleep(1.5 * attempt)

    raise RuntimeError(f"Overpass request failed for {endpoint}") from last_error


def collect_overpass_elements() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Collect and merge raw OSM elements from all endpoints and passes."""
    raw_runs: list[dict[str, Any]] = []
    element_map: dict[str, dict[str, Any]] = {}

    for query_name, query in OVERPASS_QUERIES.items():
        query_success: bool = False
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                payload: dict[str, Any] = fetch_overpass_json(endpoint=endpoint, query=query)
                elements: list[dict[str, Any]] = payload.get("elements", []) if isinstance(payload, dict) else []
                raw_runs.append(
                    {
                        "query": query_name,
                        "endpoint": endpoint,
                        "ok": True,
                        "count": len(elements),
                    }
                )
                for element in elements:
                    osm_type: str = normalize_text(element.get("type"))
                    osm_id: str = normalize_text(element.get("id"))
                    if not osm_type or not osm_id:
                        continue
                    key: str = f"{osm_type}/{osm_id}"
                    if key not in element_map:
                        element_map[key] = element
                query_success = True
                break
            except Exception as error:  # noqa: BLE001
                raw_runs.append(
                    {
                        "query": query_name,
                        "endpoint": endpoint,
                        "ok": False,
                        "error": normalize_text(error),
                    }
                )
                continue
        if not query_success:
            continue

    return list(element_map.values()), raw_runs


def map_osm_element_to_record(element: dict[str, Any], district_list: list[str]) -> dict[str, Any]:
    """Map one OSM element to akaryakit record schema."""
    tags: dict[str, Any] = element.get("tags", {}) if isinstance(element.get("tags"), dict) else {}

    lat: Any = element.get("lat")
    lon: Any = element.get("lon")
    if lat is None or lon is None:
        center: dict[str, Any] = element.get("center", {}) if isinstance(element.get("center"), dict) else {}
        lat = center.get("lat")
        lon = center.get("lon")

    raw_name: str = normalize_text(tags.get("name"))
    raw_brand: str = normalize_text(tags.get("brand"))
    raw_operator: str = normalize_text(tags.get("operator"))
    name: str = raw_name or raw_brand or raw_operator
    osm_type: str = normalize_text(element.get("type"))
    osm_id: str = normalize_text(element.get("id"))
    if not name:
        name = f"Akaryakıt İstasyonu {osm_type}/{osm_id}"

    address_parts: list[str] = []
    for key in ("addr:street", "addr:housenumber", "addr:suburb", "addr:district", "addr:city", "addr:postcode"):
        value: str = normalize_text(tags.get(key))
        if value:
            address_parts.append(value)
    address: str = ", ".join(address_parts)

    amenity: str = normalize_key(tags.get("amenity"))
    shop: str = normalize_key(tags.get("shop"))
    has_fuel_key: bool = any(
        str(key).startswith("fuel:") or str(key) == "fuel" for key in tags.keys()
    )
    has_primary_fuel_tag: bool = amenity == "fuel" or shop == "fuel"
    has_identity: bool = bool(raw_name or raw_brand or raw_operator or address)

    # Keep only records that are likely real fuel points.
    if not has_primary_fuel_tag and not (has_fuel_key and has_identity):
        return {}
    if not has_identity and not address:
        return {}

    district: str = resolve_district(
        raw_district=normalize_text(tags.get("addr:district") or tags.get("addr:suburb")),
        address=address,
        district_list=district_list,
    )
    postcode: str = normalize_text(tags.get("addr:postcode")) or parse_postcode(address)
    neighborhood: str = parse_neighborhood(address)
    website: str = normalize_text(tags.get("website"))
    phone: str = normalize_text(tags.get("phone"))
    place_id: str = f"osm:{osm_type}/{osm_id}" if osm_type and osm_id else ""

    record: dict[str, Any] = {
        "city": CITY_NAME,
        "district": district,
        "name": name,
        "address": address,
        "placeId": place_id,
        "mapsUrl": build_google_maps_url(name=name, address=address, district=district, city=CITY_NAME),
        "website": website,
    }
    if phone:
        record["phone"] = phone
    if neighborhood:
        record["neighborhood"] = neighborhood
    if postcode:
        record["postalCode"] = postcode
    if isinstance(lat, (float, int)):
        record["latitude"] = float(lat)
    if isinstance(lon, (float, int)):
        record["longitude"] = float(lon)
    return record


def score_record(record: dict[str, Any], source: str) -> int:
    """Score richness for duplicate resolution."""
    score: int = 0
    for field in ("name", "address", "district", "website", "phone", "neighborhood", "postalCode", "mapsUrl"):
        if normalize_text(record.get(field)):
            score += 1
    if normalize_text(record.get("placeId")).startswith("osm:"):
        score += 1
    if source == "osm":
        score += 1
    return score


def dedupe_records(records: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Deduplicate merged Istanbul records while keeping richer record."""
    best_by_key: dict[str, tuple[dict[str, Any], int, str]] = {}
    dropped: int = 0

    for row in records:
        source: str = normalize_text(row.get("_source")) or "legacy"
        place_id: str = normalize_text(row.get("placeId"))
        name_key: str = normalize_key(row.get("name"))
        district_key: str = normalize_key(row.get("district"))
        address_key: str = normalize_key(row.get("address"))

        # Use text signature first to dedupe cross-source overlaps.
        if name_key and district_key and address_key:
            key = f"sig:{name_key}:{district_key}:{address_key}"
        elif name_key and district_key:
            key = f"sig2:{name_key}:{district_key}"
        elif place_id:
            key = f"pid:{normalize_key(place_id)}"
        else:
            key = f"misc:{name_key}:{district_key}:{address_key}"

        candidate_score: int = score_record(row, source)
        existing: tuple[dict[str, Any], int, str] | None = best_by_key.get(key)
        if existing is None:
            best_by_key[key] = (row, candidate_score, source)
            continue

        existing_row, existing_score, _existing_source = existing
        if candidate_score > existing_score:
            best_by_key[key] = (row, candidate_score, source)
            dropped += 1
            continue

        if candidate_score == existing_score:
            existing_len: int = len(normalize_text(existing_row.get("address")))
            candidate_len: int = len(normalize_text(row.get("address")))
            if candidate_len > existing_len:
                best_by_key[key] = (row, candidate_score, source)
                dropped += 1
                continue

        dropped += 1

    cleaned: list[dict[str, Any]] = []
    for row, _score, _source in best_by_key.values():
        item: dict[str, Any] = dict(row)
        item.pop("_source", None)
        cleaned.append(item)

    cleaned.sort(
        key=lambda row: (
            normalize_key(row.get("district")),
            normalize_key(row.get("name")),
            normalize_key(row.get("address")),
        )
    )
    return cleaned, dropped


def merge() -> dict[str, Any]:
    """Run full merge flow and write files."""
    base_rows: list[dict[str, Any]] = read_json(WEB_DATA_PATH)
    district_payload: dict[str, Any] = read_json(DISTRICTS_PATH)
    district_list: list[str] = district_payload.get("İstanbul", []) or district_payload.get("Istanbul", [])

    non_istanbul_rows: list[dict[str, Any]] = [row for row in base_rows if not is_istanbul_city(row.get("city"))]
    premerge_istanbul_rows: list[dict[str, Any]] = [row for row in base_rows if is_istanbul_city(row.get("city"))]

    write_json(
        PREMERGE_BACKUP_WEB_PATH,
        {
            "meta": {
                "source": "pre_merge_snapshot",
                "city": CITY_NAME,
                "backupDate": "2026-03-08",
                "count": len(premerge_istanbul_rows),
            },
            "records": premerge_istanbul_rows,
        },
    )
    write_json(
        PREMERGE_BACKUP_ANDROID_PATH,
        {
            "meta": {
                "source": "pre_merge_snapshot",
                "city": CITY_NAME,
                "backupDate": "2026-03-08",
                "count": len(premerge_istanbul_rows),
            },
            "records": premerge_istanbul_rows,
        },
    )

    if LEGACY_BACKUP_WEB_PATH.exists():
        legacy_payload: dict[str, Any] = read_json(LEGACY_BACKUP_WEB_PATH)
        legacy_rows: list[dict[str, Any]] = legacy_payload.get("records", [])
    else:
        legacy_rows = premerge_istanbul_rows

    osm_elements, raw_runs = collect_overpass_elements()
    write_json(
        OSM_RAW_DUMP_PATH,
        {
            "meta": {"date": "2026-03-08", "city": CITY_NAME, "runCount": len(raw_runs)},
            "runs": raw_runs,
            "elementCount": len(osm_elements),
            "elements": osm_elements,
        },
    )

    osm_rows: list[dict[str, Any]] = []
    for element in osm_elements:
        mapped: dict[str, Any] = map_osm_element_to_record(element=element, district_list=district_list)
        if not mapped:
            continue
        mapped["_source"] = "osm"
        osm_rows.append(mapped)

    normalized_legacy_rows: list[dict[str, Any]] = []
    for row in legacy_rows:
        fixed: dict[str, Any] = dict(row)
        fixed["city"] = CITY_NAME
        fixed["district"] = resolve_district(
            raw_district=normalize_text(fixed.get("district")),
            address=normalize_text(fixed.get("address")),
            district_list=district_list,
        )
        fixed["name"] = normalize_text(fixed.get("name")) or "Akaryakıt İstasyonu"
        fixed["address"] = normalize_text(fixed.get("address"))
        fixed["mapsUrl"] = normalize_text(fixed.get("mapsUrl")) or build_google_maps_url(
            name=fixed["name"],
            address=fixed["address"],
            district=fixed["district"],
            city=CITY_NAME,
        )
        fixed["website"] = normalize_text(fixed.get("website"))
        fixed["_source"] = "legacy"
        normalized_legacy_rows.append(fixed)

    merged_raw_rows: list[dict[str, Any]] = normalized_legacy_rows + osm_rows
    merged_clean_rows, dropped_count = dedupe_records(merged_raw_rows)

    updated_rows: list[dict[str, Any]] = non_istanbul_rows + merged_clean_rows
    write_json(WEB_DATA_PATH, updated_rows)
    write_json(ANDROID_DATA_PATH, updated_rows)

    report: dict[str, Any] = {
        "meta": {
            "city": CITY_NAME,
            "date": "2026-03-08",
            "strategy": "legacy + multi-overpass passes, dedupe overlap",
        },
        "counts": {
            "legacyBackupIstanbul": len(legacy_rows),
            "premergeIstanbul": len(premerge_istanbul_rows),
            "osmCollectedElements": len(osm_elements),
            "osmMappedRows": len(osm_rows),
            "mergedRawRows": len(merged_raw_rows),
            "dedupeDroppedRows": dropped_count,
            "mergedIstanbulRows": len(merged_clean_rows),
            "nonIstanbulRows": len(non_istanbul_rows),
            "finalTotalRows": len(updated_rows),
        },
        "runs": raw_runs,
        "files": {
            "webData": str(WEB_DATA_PATH),
            "androidData": str(ANDROID_DATA_PATH),
            "legacyBackupWeb": str(LEGACY_BACKUP_WEB_PATH),
            "legacyBackupAndroid": str(LEGACY_BACKUP_ANDROID_PATH),
            "premergeBackupWeb": str(PREMERGE_BACKUP_WEB_PATH),
            "premergeBackupAndroid": str(PREMERGE_BACKUP_ANDROID_PATH),
            "rawOsmDump": str(OSM_RAW_DUMP_PATH),
        },
    }
    write_json(MERGE_REPORT_PATH, report)
    return report


def main() -> None:
    """Entrypoint."""
    report: dict[str, Any] = merge()
    counts: dict[str, Any] = report.get("counts", {})
    print(f"legacy_backup_istanbul={counts.get('legacyBackupIstanbul', 0)}")
    print(f"premerge_istanbul={counts.get('premergeIstanbul', 0)}")
    print(f"osm_elements={counts.get('osmCollectedElements', 0)}")
    print(f"osm_rows={counts.get('osmMappedRows', 0)}")
    print(f"merged_istanbul={counts.get('mergedIstanbulRows', 0)}")
    print(f"final_total={counts.get('finalTotalRows', 0)}")
    print(f"report={MERGE_REPORT_PATH}")


if __name__ == "__main__":
    main()
