#!/usr/bin/env python3
"""Fetch Shell station data from Shell Retail Locator API.

This script crawls Turkey-wide Shell station data by:
1. Starting from a large Turkey bounding box.
2. Calling the `within_bounds` endpoint.
3. Expanding returned clusters recursively.
4. Deduplicating stations.
5. Normalizing stations to aramabul akaryakit schema.

Outputs:
- Raw API station list.
- Normalized station list.
- Crawl report with counters.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT_DIR: Path = Path(__file__).resolve().parents[1]
DISTRICTS_PATH: Path = ROOT_DIR / "data" / "districts.json"

SHELL_API_BASE: str = "https://shellretaillocator.geoapp.me/api/v2/locations"
DEFAULT_LOCALE: str = "tr_TR"

# Rough Turkey bbox in (south, west, north, east)
DEFAULT_TURKEY_BOUNDS: tuple[float, float, float, float] = (35.70, 25.30, 42.60, 45.20)


@dataclass(frozen=True)
class Bounds:
    """Axis-aligned geographic bounds."""

    south: float
    west: float
    north: float
    east: float

    def key(self, precision: int = 6) -> tuple[float, float, float, float]:
        """Return a rounded tuple key used for visited tracking."""
        return (
            round(self.south, precision),
            round(self.west, precision),
            round(self.north, precision),
            round(self.east, precision),
        )

    def lat_span(self) -> float:
        """Return latitude span."""
        return max(0.0, self.north - self.south)

    def lng_span(self) -> float:
        """Return longitude span."""
        return max(0.0, self.east - self.west)

    def split_quadrants(self) -> list["Bounds"]:
        """Split bounds into 4 quadrants."""
        mid_lat: float = (self.south + self.north) / 2.0
        mid_lng: float = (self.west + self.east) / 2.0
        return [
            Bounds(self.south, self.west, mid_lat, mid_lng),
            Bounds(mid_lat, self.west, self.north, mid_lng),
            Bounds(self.south, mid_lng, mid_lat, self.east),
            Bounds(mid_lat, mid_lng, self.north, self.east),
        ]


def read_json(path: Path) -> Any:
    """Read JSON file from disk."""
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    """Write JSON file with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def normalize_text(value: Any) -> str:
    """Normalize text by trimming and collapsing whitespace."""
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_key(value: Any) -> str:
    """Normalize text to a comparable key."""
    text: str = normalize_text(value).lower()
    translate_map: dict[int, str] = str.maketrans("çğıöşüâîû", "cgiosuaiu")
    text = text.translate(translate_map)
    return re.sub(r"[^a-z0-9]", "", text)


def build_city_index(district_map: dict[str, list[str]]) -> dict[str, str]:
    """Map normalized city token to canonical city name."""
    index: dict[str, str] = {}
    for city in district_map.keys():
        key: str = normalize_key(city)
        if key:
            index[key] = city
    return index


def build_district_index(district_map: dict[str, list[str]]) -> dict[str, dict[str, str]]:
    """Map normalized district token to canonical district by city."""
    index: dict[str, dict[str, str]] = {}
    for city, districts in district_map.items():
        city_key: str = normalize_key(city)
        city_district_index: dict[str, str] = {}
        for district in districts:
            district_key: str = normalize_key(district)
            if district_key:
                city_district_index[district_key] = district
        index[city_key] = city_district_index
    return index


def request_json(url: str, timeout_seconds: int, retries: int, delay_seconds: float) -> Any:
    """Fetch JSON from URL with retries."""
    headers: dict[str, str] = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (aramabul-shell-fetcher/1.0)",
    }
    last_error: Exception | None = None
    for attempt in range(1, retries + 2):
        try:
            request = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                body: bytes = response.read()
            return json.loads(body.decode("utf-8"))
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < retries + 1:
                time.sleep(delay_seconds * attempt)
    raise RuntimeError(f"Request failed after retries: {url}") from last_error


def build_within_bounds_url(bounds: Bounds, locale: str) -> str:
    """Build Shell within_bounds URL."""
    query: str = urllib.parse.urlencode(
        [
            ("sw[]", f"{bounds.south:.6f}"),
            ("sw[]", f"{bounds.west:.6f}"),
            ("ne[]", f"{bounds.north:.6f}"),
            ("ne[]", f"{bounds.east:.6f}"),
            ("locale", locale),
            ("format", "json"),
        ]
    )
    return f"{SHELL_API_BASE}/within_bounds?{query}"


def parse_cluster_bounds(cluster: dict[str, Any]) -> Bounds | None:
    """Convert cluster bounds payload to Bounds."""
    raw_bounds: dict[str, Any] = cluster.get("bounds", {}) if isinstance(cluster, dict) else {}
    sw: Any = raw_bounds.get("sw")
    ne: Any = raw_bounds.get("ne")
    if not (isinstance(sw, list) and isinstance(ne, list) and len(sw) >= 2 and len(ne) >= 2):
        return None
    try:
        south: float = float(sw[0])
        west: float = float(sw[1])
        north: float = float(ne[0])
        east: float = float(ne[1])
    except (TypeError, ValueError):
        return None
    if north <= south or east <= west:
        return None
    return Bounds(south=south, west=west, north=north, east=east)


def is_bounds_shrunk(current: Bounds, child: Bounds, epsilon: float = 1e-6) -> bool:
    """Return True when child bounds are meaningfully smaller than current."""
    return (
        child.lat_span() < current.lat_span() - epsilon
        or child.lng_span() < current.lng_span() - epsilon
        or child.key() != current.key()
    )


def collect_shell_locations(
    root_bounds: Bounds,
    locale: str,
    timeout_seconds: int,
    retries: int,
    request_pause_seconds: float,
    max_depth: int,
    min_span: float,
    max_requests: int,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Collect raw shell locations by recursive cluster expansion."""
    queue: deque[tuple[Bounds, int, str]] = deque([(root_bounds, 0, "root")])
    visited: set[tuple[float, float, float, float]] = set()
    locations_by_id: dict[str, dict[str, Any]] = {}

    requests_made: int = 0
    unresolved_boxes: list[dict[str, Any]] = []
    cluster_boxes_seen: int = 0
    responses_with_clusters: int = 0

    while queue:
        bounds, depth, reason = queue.popleft()
        if depth > max_depth:
            unresolved_boxes.append(
                {
                    "reason": "max_depth",
                    "depth": depth,
                    "source": reason,
                    "bounds": bounds.key(),
                }
            )
            continue

        if bounds.lat_span() < min_span or bounds.lng_span() < min_span:
            unresolved_boxes.append(
                {
                    "reason": "min_span",
                    "depth": depth,
                    "source": reason,
                    "bounds": bounds.key(),
                }
            )
            continue

        bounds_key: tuple[float, float, float, float] = bounds.key()
        if bounds_key in visited:
            continue
        visited.add(bounds_key)

        if requests_made >= max_requests:
            unresolved_boxes.append(
                {
                    "reason": "max_requests",
                    "depth": depth,
                    "source": reason,
                    "bounds": bounds.key(),
                }
            )
            break

        url: str = build_within_bounds_url(bounds=bounds, locale=locale)
        try:
            payload: Any = request_json(
                url=url,
                timeout_seconds=timeout_seconds,
                retries=retries,
                delay_seconds=request_pause_seconds,
            )
        except RuntimeError as error:
            unresolved_boxes.append(
                {
                    "reason": "request_failed",
                    "depth": depth,
                    "source": reason,
                    "bounds": bounds.key(),
                    "error": normalize_text(error),
                }
            )
            continue

        requests_made += 1
        time.sleep(request_pause_seconds)

        locations: list[dict[str, Any]] = payload.get("locations", []) if isinstance(payload, dict) else []
        clusters: list[dict[str, Any]] = payload.get("clusters", []) if isinstance(payload, dict) else []

        for location in locations:
            location_id: str = normalize_text(location.get("id"))
            if not location_id:
                lat: str = normalize_text(location.get("lat"))
                lng: str = normalize_text(location.get("lng"))
                name: str = normalize_key(location.get("name"))
                location_id = f"anon:{lat}:{lng}:{name}"
            if location_id not in locations_by_id:
                locations_by_id[location_id] = location

        if clusters:
            responses_with_clusters += 1

        for cluster in clusters:
            child_bounds: Bounds | None = parse_cluster_bounds(cluster)
            if child_bounds is None:
                continue
            cluster_boxes_seen += 1
            if is_bounds_shrunk(bounds, child_bounds):
                queue.append((child_bounds, depth + 1, "cluster"))
                continue
            for split_bounds in bounds.split_quadrants():
                queue.append((split_bounds, depth + 1, "split"))

    report: dict[str, Any] = {
        "requests_made": requests_made,
        "visited_boxes": len(visited),
        "cluster_boxes_seen": cluster_boxes_seen,
        "responses_with_clusters": responses_with_clusters,
        "raw_unique_locations": len(locations_by_id),
        "queue_remaining": len(queue),
        "unresolved_boxes": unresolved_boxes,
    }
    return list(locations_by_id.values()), report


def find_city_name(
    location: dict[str, Any],
    city_index: dict[str, str],
) -> str:
    """Resolve canonical city from location fields."""
    state_text: str = normalize_text(location.get("state"))
    state_key: str = normalize_key(state_text)
    if state_key in city_index:
        return city_index[state_key]

    city_text: str = normalize_text(location.get("city"))
    city_key: str = normalize_key(city_text)
    if city_key in city_index:
        return city_index[city_key]

    for key, canonical_city in city_index.items():
        if city_key.endswith(key) and key:
            return canonical_city

    return state_text or city_text or "Merkez"


def resolve_district_name(
    location: dict[str, Any],
    city_name: str,
    district_index: dict[str, dict[str, str]],
) -> str:
    """Resolve district name from city field and address text."""
    city_key: str = normalize_key(city_name)
    city_districts: dict[str, str] = district_index.get(city_key, {})
    if not city_districts:
        return "Merkez"

    city_text: str = normalize_text(location.get("city"))
    city_text_key: str = normalize_key(city_text)

    # Pattern like "ÇANKAYA ANKARA": remove city suffix.
    city_name_key: str = normalize_key(city_name)
    district_candidate_key: str = city_text_key
    if city_name_key and city_text_key.endswith(city_name_key):
        district_candidate_key = city_text_key[: -len(city_name_key)]
    district_candidate_key = normalize_key(district_candidate_key)
    if district_candidate_key in city_districts:
        return city_districts[district_candidate_key]

    address_text: str = normalize_text(location.get("address"))
    address_key: str = normalize_key(address_text)
    for district_key, district_name in city_districts.items():
        if district_key and district_key in address_key:
            return district_name

    # Fallback: token search in city_text.
    for district_key, district_name in city_districts.items():
        if district_key and district_key in city_text_key:
            return district_name

    return "Merkez"


def build_maps_url(name: str, address: str, district: str, city: str) -> str:
    """Build Google Maps search URL."""
    parts: list[str] = []
    for value in (name, address, district, city):
        clean: str = normalize_text(value)
        if clean and clean not in parts:
            parts.append(clean)
    query: str = " ".join(parts)
    return f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(query)}"


def normalize_shell_location(
    location: dict[str, Any],
    city_index: dict[str, str],
    district_index: dict[str, dict[str, str]],
) -> dict[str, Any]:
    """Convert Shell location record to aramabul akaryakit schema."""
    city_name: str = find_city_name(location=location, city_index=city_index)
    district_name: str = resolve_district_name(
        location=location,
        city_name=city_name,
        district_index=district_index,
    )

    name: str = normalize_text(location.get("name"))
    if not name:
        location_id: str = normalize_text(location.get("id"))
        name = f"Shell İstasyonu {location_id or 'Bilinmiyor'}"

    address: str = normalize_text(location.get("address"))
    postcode: str = normalize_text(location.get("postcode"))
    if postcode and postcode not in address:
        address = normalize_text(f"{address}, {postcode}")

    website: str = normalize_text(location.get("website_url"))
    maps_url: str = build_maps_url(name=name, address=address, district=district_name, city=city_name)

    return {
        "city": city_name,
        "district": district_name,
        "name": name,
        "address": address,
        "placeId": normalize_text(location.get("id")),
        "mapsUrl": maps_url,
        "website": website,
        "source": "shell_api",
    }


def dedupe_normalized_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deduplicate normalized records by place id and fallback key."""
    by_key: dict[str, dict[str, Any]] = {}
    ordered_keys: list[str] = []

    for record in records:
        place_id: str = normalize_text(record.get("placeId"))
        if place_id:
            key: str = f"id:{place_id}"
        else:
            key = "|".join(
                [
                    normalize_key(record.get("city")),
                    normalize_key(record.get("district")),
                    normalize_key(record.get("name")),
                    normalize_key(record.get("address")),
                ]
            )

        if key not in by_key:
            by_key[key] = record
            ordered_keys.append(key)
            continue

        existing: dict[str, Any] = by_key[key]
        existing_score: int = len(normalize_text(existing.get("address"))) + len(
            normalize_text(existing.get("website"))
        )
        new_score: int = len(normalize_text(record.get("address"))) + len(normalize_text(record.get("website")))
        if new_score > existing_score:
            by_key[key] = record

    return [by_key[key] for key in ordered_keys]


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Fetch Shell akaryakit records.")
    parser.add_argument("--locale", default=DEFAULT_LOCALE, help="API locale. Default: tr_TR")
    parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    parser.add_argument("--retries", type=int, default=2, help="HTTP retry count.")
    parser.add_argument("--pause-ms", type=int, default=120, help="Pause between requests in milliseconds.")
    parser.add_argument("--max-depth", type=int, default=12, help="Cluster expansion max depth.")
    parser.add_argument("--min-span", type=float, default=0.0005, help="Minimum bbox span before stopping.")
    parser.add_argument("--max-requests", type=int, default=5000, help="Safety cap on HTTP request count.")
    parser.add_argument(
        "--raw-output",
        default="tmp/shell-akaryakit-raw.json",
        help="Raw output path relative to repo root.",
    )
    parser.add_argument(
        "--output",
        default="tmp/shell-akaryakit-normalized.json",
        help="Normalized output path relative to repo root.",
    )
    parser.add_argument(
        "--report-output",
        default="tmp/shell-akaryakit-report.json",
        help="Report output path relative to repo root.",
    )
    return parser.parse_args()


def append_date_suffix(path: Path, date_suffix: str) -> Path:
    """Append date suffix before extension."""
    stem: str = path.stem
    suffix: str = path.suffix
    return path.with_name(f"{stem}-{date_suffix}{suffix}")


def main() -> None:
    """Run Shell fetch pipeline."""
    args: argparse.Namespace = parse_args()
    district_map: dict[str, list[str]] = read_json(DISTRICTS_PATH)
    city_index: dict[str, str] = build_city_index(district_map=district_map)
    district_index: dict[str, dict[str, str]] = build_district_index(district_map=district_map)

    date_suffix: str = datetime.now().strftime("%Y%m%d")
    raw_output_path: Path = append_date_suffix(ROOT_DIR / args.raw_output, date_suffix)
    output_path: Path = append_date_suffix(ROOT_DIR / args.output, date_suffix)
    report_output_path: Path = append_date_suffix(ROOT_DIR / args.report_output, date_suffix)

    root_bounds: Bounds = Bounds(*DEFAULT_TURKEY_BOUNDS)
    raw_locations, crawl_report = collect_shell_locations(
        root_bounds=root_bounds,
        locale=args.locale,
        timeout_seconds=args.timeout,
        retries=args.retries,
        request_pause_seconds=max(0.0, args.pause_ms / 1000.0),
        max_depth=max(0, args.max_depth),
        min_span=max(0.0, args.min_span),
        max_requests=max(1, args.max_requests),
    )

    normalized_records: list[dict[str, Any]] = [
        normalize_shell_location(
            location=location,
            city_index=city_index,
            district_index=district_index,
        )
        for location in raw_locations
    ]
    deduped_records: list[dict[str, Any]] = dedupe_normalized_records(normalized_records)

    write_json(raw_output_path, raw_locations)
    write_json(output_path, deduped_records)

    report_payload: dict[str, Any] = {
        "meta": {
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "locale": args.locale,
            "source": SHELL_API_BASE,
            "bounds": {
                "south": root_bounds.south,
                "west": root_bounds.west,
                "north": root_bounds.north,
                "east": root_bounds.east,
            },
        },
        "counts": {
            "raw_locations": len(raw_locations),
            "normalized_records": len(normalized_records),
            "deduped_records": len(deduped_records),
        },
        "crawl": crawl_report,
        "files": {
            "raw_output": str(raw_output_path),
            "normalized_output": str(output_path),
            "report_output": str(report_output_path),
        },
    }
    write_json(report_output_path, report_payload)

    print(f"raw_locations={len(raw_locations)}")
    print(f"deduped_records={len(deduped_records)}")
    print(f"raw_output={raw_output_path}")
    print(f"normalized_output={output_path}")
    print(f"report_output={report_output_path}")


if __name__ == "__main__":
    main()
