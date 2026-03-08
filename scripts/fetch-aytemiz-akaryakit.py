#!/usr/bin/env python3
"""Fetch Aytemiz station data from web page and merge into akaryakit datasets.

This script:
1. Downloads Aytemiz station locator page.
2. Extracts `var markers = [...]` data block.
3. Normalizes rows to aramabul akaryakit schema.
4. Replaces previous `aytemiz_web` rows with fresh records.
5. Writes both web and android akaryakit files with timestamped backups.
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
REPORT_PATH: Path = ROOT_DIR / "data" / "akaryakit-aytemiz-import-report.json"

AYTEMIZ_URL: str = "https://www.aytemiz.com.tr/haritalar/en-yakin-aytemiz"
AYTEMIZ_SOURCE: str = "aytemiz_web"
AYTEMIZ_SITE_URL: str = "https://www.aytemiz.com.tr/haritalar/en-yakin-aytemiz"


def read_json(path: Path) -> Any:
    """Read JSON from disk."""
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    """Write JSON to disk with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def backup_file(path: Path, timestamp: str) -> Path:
    """Create timestamped full backup file."""
    backup_path: Path = path.parent / f"{path.stem}-full-backup-{timestamp}{path.suffix}"
    raw: str = path.read_text(encoding="utf-8")
    backup_path.write_text(raw if raw.endswith("\n") else f"{raw}\n", encoding="utf-8")
    return backup_path


def normalize_text(value: Any) -> str:
    """Normalize text by trimming and collapsing spaces."""
    return re.sub(r"\s+", " ", str(value or "")).strip()


def to_title_case_tr(value: str) -> str:
    """Convert mostly uppercase text to Turkish title case."""
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
    """Strip existing prefix from station name."""
    clean: str = normalize_text(name)
    pref: str = f"{prefix} "
    if clean.upper().startswith(pref.upper()):
        return clean[len(pref) :].strip()
    return clean


def build_maps_url(latitude: Any, longitude: Any, fallback_query: str) -> str:
    """Build maps URL using coordinates when available."""
    try:
        lat: float = float(str(latitude).replace(",", "."))
        lng: float = float(str(longitude).replace(",", "."))
        query: str = f"{lat:.6f},{lng:.6f}"
    except (TypeError, ValueError):
        query = normalize_text(fallback_query)
    return f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(query)}"


def fetch_locator_html(timeout_seconds: int) -> str:
    """Download Aytemiz locator HTML."""
    request: urllib.request.Request = urllib.request.Request(
        AYTEMIZ_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (aramabul-aytemiz-import/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return response.read().decode("utf-8", errors="ignore")


def extract_markers(html: str) -> list[dict[str, Any]]:
    """Extract `markers` array from page HTML."""
    match: re.Match[str] | None = re.search(r"var\s+markers\s*=\s*(\[\s*.*?\s*\]);", html, flags=re.S)
    if not match:
        return []
    payload: Any = json.loads(match.group(1))
    if not isinstance(payload, list):
        return []
    return [row for row in payload if isinstance(row, dict)]


def build_aytemiz_place_id(marker: dict[str, Any]) -> str:
    """Build stable Aytemiz place id from key fields."""
    raw_key: str = "|".join(
        [
            normalize_text(marker.get("City")),
            normalize_text(marker.get("County")),
            normalize_text(marker.get("Title")),
            normalize_text(marker.get("Address")),
            normalize_text(marker.get("Lat")),
            normalize_text(marker.get("Lon")),
        ]
    )
    digest: str = hashlib.sha1(raw_key.encode("utf-8"), usedforsecurity=False).hexdigest()[:16]
    return f"aytemiz-{digest}"


def normalize_marker(marker: dict[str, Any]) -> dict[str, Any]:
    """Normalize one Aytemiz marker to akaryakit row schema."""
    city: str = to_title_case_tr(str(marker.get("City", "")))
    district: str = to_title_case_tr(str(marker.get("County", ""))) or "Merkez"
    title: str = strip_prefix(str(marker.get("Title", "")), "AYTEMİZ")
    name: str = f"AYTEMİZ {title}".strip()
    address: str = normalize_text(marker.get("Address"))
    maps_query: str = " ".join(part for part in [name, address, district, city] if part)
    maps_url: str = build_maps_url(marker.get("Lat"), marker.get("Lon"), maps_query)
    place_id: str = build_aytemiz_place_id(marker)

    return {
        "city": city,
        "district": district,
        "name": name,
        "address": address,
        "placeId": place_id,
        "mapsUrl": maps_url,
        "website": AYTEMIZ_SITE_URL,
        "source": AYTEMIZ_SOURCE,
    }


def dedupe_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deduplicate rows by placeId."""
    seen: set[str] = set()
    output: list[dict[str, Any]] = []
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
    """Parse CLI options."""
    parser: argparse.ArgumentParser = argparse.ArgumentParser(description="Fetch Aytemiz records into akaryakit.json")
    parser.add_argument("--dry-run", action="store_true", help="Print report and do not write files.")
    parser.add_argument("--timeout", type=int, default=45, help="HTTP timeout in seconds.")
    return parser.parse_args()


def main() -> None:
    """Run Aytemiz import pipeline."""
    args: argparse.Namespace = parse_args()
    timestamp: str = datetime.now().strftime("%Y%m%d-%H%M%S")

    html: str = fetch_locator_html(timeout_seconds=max(5, args.timeout))
    markers: list[dict[str, Any]] = extract_markers(html=html)
    normalized_rows: list[dict[str, Any]] = dedupe_rows([normalize_marker(marker) for marker in markers])
    normalized_rows = sort_rows(normalized_rows)

    web_existing: list[dict[str, Any]] = read_json(WEB_DATA_PATH)
    android_existing: list[dict[str, Any]] = read_json(ANDROID_DATA_PATH)
    if not isinstance(web_existing, list) or not isinstance(android_existing, list):
        raise RuntimeError("akaryakit dataset must be a list")

    web_without_aytemiz: list[dict[str, Any]] = [
        row for row in web_existing if normalize_text(row.get("source")).lower() != AYTEMIZ_SOURCE
    ]
    merged_rows: list[dict[str, Any]] = sort_rows(web_without_aytemiz + normalized_rows)

    report: dict[str, Any] = {
        "timestamp": timestamp,
        "sourceUrl": AYTEMIZ_URL,
        "markersFetched": len(markers),
        "normalizedAytemizRows": len(normalized_rows),
        "existingWebBefore": len(web_existing),
        "existingAndroidBefore": len(android_existing),
        "webWithoutAytemiz": len(web_without_aytemiz),
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
