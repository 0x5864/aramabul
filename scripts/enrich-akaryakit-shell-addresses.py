#!/usr/bin/env python3
"""Enrich fuel station names and Shell neighborhood addresses.

This script updates both web and android akaryakit datasets.

Changes:
1. Shell rows:
   - Detects cadastral-style addresses (`ada`, `pafta`, `parsel`).
   - Resolves neighborhood and replaces cadastral address text with neighborhood label.
   - Prefixes station names with `SHELL `.
   - Rewrites long firm names to `SHELL Firma <Mahalle>`.
   - Rebuilds mapsUrl with coordinates for better map routing.
2. Petrol Ofisi rows:
   - Prefixes station names with `PO ` when missing.
3. OPET rows:
   - Prefixes station names with `OPET ` when missing.
   - Rewrites long firm names to `OPET Firma <Mahalle>`.
3. Writes timestamped full backups before modifications.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT_DIR: Path = Path(__file__).resolve().parents[1]
WEB_DATA_PATH: Path = ROOT_DIR / "data" / "akaryakit.json"
ANDROID_DATA_PATH: Path = ROOT_DIR / "android_app" / "assets" / "web" / "data" / "akaryakit.json"
NEIGHBORHOODS_PATH: Path = ROOT_DIR / "data" / "location-neighborhoods.json"
CACHE_PATH: Path = ROOT_DIR / "data" / "shell-geocode-cache.json"
REPORT_PATH: Path = ROOT_DIR / "data" / "akaryakit-shell-mahalle-report.json"

SHELL_DETAIL_BASE: str = "https://shellretaillocator.geoapp.me/api/v2/locations"
NOMINATIM_BASE: str = "https://nominatim.openstreetmap.org/reverse"
TURKISH_TRANSLATE: dict[int, str] = str.maketrans("çğıöşüâîû", "cgiosuaiu")


def read_json(path: Path, fallback: Any) -> Any:
    """Read JSON from path or return fallback when missing."""
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    """Write JSON payload with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def backup_file(path: Path, timestamp: str) -> Path:
    """Create timestamped full backup copy for a file."""
    backup_name: str = f"{path.stem}-full-backup-{timestamp}{path.suffix}"
    backup_path: Path = path.parent / backup_name
    raw: str = path.read_text(encoding="utf-8")
    backup_path.write_text(raw if raw.endswith("\n") else f"{raw}\n", encoding="utf-8")
    return backup_path


def normalize_text(value: Any) -> str:
    """Normalize text by trimming and collapsing whitespace."""
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_key(value: Any) -> str:
    """Normalize text for key comparison."""
    lowered: str = normalize_text(value).lower().translate(TURKISH_TRANSLATE)
    return re.sub(r"[^a-z0-9]", "", lowered)


def has_mahalle_hint(address: str) -> bool:
    """Return True when address already includes neighborhood marker."""
    normalized: str = f" {normalize_text(address).lower()} "
    tokens: tuple[str, ...] = (" mah.", " mah ", " mahallesi", " mh.", " mh ")
    return any(token in normalized for token in tokens)


def has_cadastral_hint(address: str) -> bool:
    """Return True when address looks like cadastral parcel text."""
    pattern: re.Pattern[str] = re.compile(
        r"\b(ada|pafta|paf\.?|parsel|pars\.?|kümeev|kumeev)\b",
        flags=re.IGNORECASE,
    )
    return bool(pattern.search(normalize_text(address)))


def normalize_neighborhood_label(name: str) -> str:
    """Normalize neighborhood to display form ending with `Mah.`."""
    clean: str = normalize_text(name)
    if not clean:
        return ""
    low: str = clean.lower()
    for suffix in (" mahallesi", " mah.", " mah"):
        if low.endswith(suffix):
            clean = clean[: -len(suffix)].strip()
            break
    titled: str = (
        clean.lower()
        .replace("i̇", "i")
        .title()
        .replace("Ii", "Iı")
        .replace("İ", "İ")
    )
    return f"{titled} Mah."


def maps_url_from_coords(latitude: Any, longitude: Any) -> str:
    """Build Google Maps URL from coordinates."""
    lat: float = float(latitude)
    lng: float = float(longitude)
    query: str = urllib.parse.quote_plus(f"{lat:.6f},{lng:.6f}")
    return f"https://www.google.com/maps/search/?api=1&query={query}"


def needs_geocode(address: str) -> bool:
    """Return True when address is likely cadastral/unfriendly."""
    if has_mahalle_hint(address):
        return False
    return has_cadastral_hint(address)


def extract_neighborhood_from_address(address: str) -> str:
    """Extract neighborhood from free text address if present."""
    clean: str = normalize_text(address)
    if not clean:
        return ""

    pattern: re.Pattern[str] = re.compile(
        r"([A-Za-zÇĞİIÖŞÜçğıöşü0-9\-\s]+?)\s*(Mahallesi|Mah\.|Mah)\b",
        flags=re.IGNORECASE,
    )
    match: re.Match[str] | None = pattern.search(clean)
    if not match:
        return ""
    return normalize_neighborhood_label(match.group(1))


def is_long_firm_name(name: str) -> bool:
    """Return True for long legal/commercial station names."""
    clean: str = normalize_text(name)
    if not clean:
        return False
    if len(clean) >= 30:
        return True
    legal_pattern: re.Pattern[str] = re.compile(
        r"\b(limited|ltd|anonim|a\.ş|aş|şirket|ticaret|sanayi|taşımac|pazarlama|ürünleri)\b",
        flags=re.IGNORECASE,
    )
    return len(clean) >= 20 and bool(legal_pattern.search(clean))


def strip_prefix(name: str, prefix: str) -> str:
    """Strip a prefix from name when present."""
    clean: str = normalize_text(name)
    prefix_with_space: str = f"{prefix} "
    if clean.upper().startswith(prefix_with_space.upper()):
        return clean[len(prefix_with_space) :].strip()
    return clean


def load_neighborhood_index() -> dict[str, set[str]]:
    """Load city|district neighborhood index from local dataset."""
    raw: dict[str, dict[str, list[str]]] = read_json(NEIGHBORHOODS_PATH, {})
    index: dict[str, set[str]] = {}
    for city, districts in raw.items():
        if not isinstance(districts, dict):
            continue
        for district, neighborhoods in districts.items():
            if not isinstance(neighborhoods, list):
                continue
            key: str = f"{normalize_key(city)}|{normalize_key(district)}"
            existing: set[str] = index.get(key, set())
            for neighborhood in neighborhoods:
                label: str = normalize_neighborhood_label(str(neighborhood))
                if label:
                    existing.add(label)
            index[key] = existing
    return index


def parse_shell_station_id(place_id: str) -> str | None:
    """Extract numeric Shell station id from placeId."""
    raw: str = normalize_text(place_id)
    if raw.startswith("shell-"):
        raw = raw[6:]
    return raw if raw.isdigit() else None


def shell_detail(station_id: str, timeout_seconds: int) -> dict[str, Any] | None:
    """Fetch Shell station detail payload."""
    url: str = f"{SHELL_DETAIL_BASE}/{station_id}?locale=tr_TR&format=json"
    request: urllib.request.Request = urllib.request.Request(
        url=url,
        headers={
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (aramabul-shell-enricher/1.0)",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            payload: Any = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None
    return payload if isinstance(payload, dict) else None


def reverse_neighborhood(
    latitude: float,
    longitude: float,
    timeout_seconds: int,
) -> dict[str, Any] | None:
    """Reverse geocode coordinates and return address components."""
    query: str = urllib.parse.urlencode(
        {
            "format": "jsonv2",
            "addressdetails": "1",
            "zoom": "18",
            "lat": f"{latitude:.7f}",
            "lon": f"{longitude:.7f}",
            "accept-language": "tr",
        }
    )
    url: str = f"{NOMINATIM_BASE}?{query}"
    request: urllib.request.Request = urllib.request.Request(
        url=url,
        headers={
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "aramabul/1.0 (fuel-data-enrichment)",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            payload: Any = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None
    return payload if isinstance(payload, dict) else None


def extract_neighborhood(payload: dict[str, Any]) -> str:
    """Extract best neighborhood-like label from reverse geocode payload."""
    address: dict[str, Any] = payload.get("address", {}) if isinstance(payload, dict) else {}
    if not isinstance(address, dict):
        return ""
    for key in ("neighbourhood", "quarter", "suburb"):
        value: str = normalize_text(address.get(key))
        if value:
            return normalize_neighborhood_label(value)
    return ""


def main() -> None:
    """Run enrichment pipeline."""
    parser: argparse.ArgumentParser = argparse.ArgumentParser(description="Enrich Shell addresses and prefix PO names.")
    parser.add_argument("--dry-run", action="store_true", help="Do not write dataset files.")
    parser.add_argument("--detail-timeout", type=int, default=20, help="Shell detail timeout seconds.")
    parser.add_argument("--reverse-timeout", type=int, default=20, help="Nominatim timeout seconds.")
    parser.add_argument("--reverse-delay-seconds", type=float, default=1.05, help="Delay between reverse calls.")
    args: argparse.Namespace = parser.parse_args()

    timestamp: str = datetime.now().strftime("%Y%m%d-%H%M%S")
    rows: list[dict[str, Any]] = read_json(WEB_DATA_PATH, [])
    if not isinstance(rows, list):
        raise RuntimeError("data/akaryakit.json is not a list")

    cache: dict[str, dict[str, Any]] = read_json(CACHE_PATH, {})
    if not isinstance(cache, dict):
        cache = {}

    neighborhood_index: dict[str, set[str]] = load_neighborhood_index()

    shell_total: int = 0
    shell_problem_total: int = 0
    shell_mapsurl_updated: int = 0
    shell_mahalle_added: int = 0
    shell_cadastral_replaced: int = 0
    shell_prefixed: int = 0
    shell_long_firma_renamed: int = 0
    shell_reverse_calls: int = 0
    shell_reverse_failures: int = 0
    po_prefixed: int = 0
    opet_prefixed: int = 0
    opet_long_firma_renamed: int = 0

    for row in rows:
        if not isinstance(row, dict):
            continue

        source: str = normalize_text(row.get("source")).lower()
        name: str = normalize_text(row.get("name"))

        if source == "petrol_ofisi":
            if name and not name.startswith("PO "):
                row["name"] = f"PO {name}"
                po_prefixed += 1
            continue

        if source == "opet_api":
            neighborhood: str = extract_neighborhood_from_address(normalize_text(row.get("address")))
            base_name: str = strip_prefix(name, "OPET")
            if is_long_firm_name(base_name):
                base_name = f"Firma {neighborhood}" if neighborhood else "Firma"
                opet_long_firma_renamed += 1
            if not base_name:
                base_name = "İstasyon"
            new_opet_name: str = f"OPET {base_name}"
            if normalize_text(row.get("name")) != new_opet_name:
                row["name"] = new_opet_name
                opet_prefixed += 1
            continue

        if source != "shell_api":
            continue

        shell_total += 1
        address: str = normalize_text(row.get("address"))
        original_name: str = normalize_text(row.get("name"))
        place_id: str = normalize_text(row.get("placeId"))
        station_id: str | None = parse_shell_station_id(place_id)
        if not station_id:
            continue

        detail_cache_key: str = f"detail:{station_id}"
        detail: dict[str, Any] | None = cache.get(detail_cache_key)
        if not isinstance(detail, dict):
            detail = shell_detail(station_id=station_id, timeout_seconds=max(1, args.detail_timeout))
            if detail is not None:
                cache[detail_cache_key] = detail

        if isinstance(detail, dict):
            try:
                row["mapsUrl"] = maps_url_from_coords(detail.get("lat"), detail.get("lng"))
                shell_mapsurl_updated += 1
            except (TypeError, ValueError):
                pass

        cadastral: bool = has_cadastral_hint(address)
        if cadastral:
            shell_problem_total += 1

        neighborhood: str = extract_neighborhood_from_address(address)
        needs_reverse: bool = (cadastral or is_long_firm_name(strip_prefix(original_name, "SHELL"))) and not neighborhood
        reverse_payload: dict[str, Any] | None = None
        if needs_reverse and isinstance(detail, dict):
            try:
                lat = float(detail.get("lat"))
                lng = float(detail.get("lng"))
            except (TypeError, ValueError):
                lat = 0.0
                lng = 0.0

            if lat and lng:
                reverse_key: str = f"reverse:{station_id}"
                reverse_payload = cache.get(reverse_key)
                if not isinstance(reverse_payload, dict):
                    reverse_payload = reverse_neighborhood(
                        latitude=lat,
                        longitude=lng,
                        timeout_seconds=max(1, args.reverse_timeout),
                    )
                    shell_reverse_calls += 1
                    if reverse_payload is None:
                        shell_reverse_failures += 1
                    else:
                        cache[reverse_key] = reverse_payload
                    time.sleep(max(0.0, args.reverse_delay_seconds))

        if not neighborhood and isinstance(reverse_payload, dict):
            neighborhood = extract_neighborhood(reverse_payload)

        if neighborhood:
            city_key: str = normalize_key(row.get("city"))
            district_key: str = normalize_key(row.get("district"))
            valid_set: set[str] = neighborhood_index.get(f"{city_key}|{district_key}", set())
            if valid_set:
                neighborhood_key: str = normalize_key(neighborhood.replace(" Mah.", ""))
                canonical: str | None = None
                for candidate in valid_set:
                    candidate_key: str = normalize_key(candidate.replace(" Mah.", ""))
                    if candidate_key == neighborhood_key:
                        canonical = candidate
                        break
                if canonical is not None:
                    neighborhood = canonical

        if cadastral and neighborhood:
            if normalize_text(row.get("address")) != neighborhood:
                row["address"] = neighborhood
                shell_cadastral_replaced += 1

        if not has_mahalle_hint(normalize_text(row.get("address"))) and neighborhood:
            row["address"] = f"{neighborhood}, {normalize_text(row.get('address'))}" if normalize_text(row.get("address")) else neighborhood
            shell_mahalle_added += 1

        base_name: str = strip_prefix(original_name, "SHELL")
        if is_long_firm_name(base_name):
            base_name = f"Firma {neighborhood}" if neighborhood else "Firma"
            shell_long_firma_renamed += 1
        if not base_name:
            base_name = "İstasyon"
        new_shell_name: str = f"SHELL {base_name}"
        if normalize_text(row.get("name")) != new_shell_name:
            row["name"] = new_shell_name
            shell_prefixed += 1

    report: dict[str, Any] = {
        "timestamp": timestamp,
        "shellTotal": shell_total,
        "shellProblemTotal": shell_problem_total,
        "shellMahalleAdded": shell_mahalle_added,
        "shellCadastralReplaced": shell_cadastral_replaced,
        "shellPrefixed": shell_prefixed,
        "shellLongFirmaRenamed": shell_long_firma_renamed,
        "shellMapsUrlUpdated": shell_mapsurl_updated,
        "shellReverseCalls": shell_reverse_calls,
        "shellReverseFailures": shell_reverse_failures,
        "poPrefixed": po_prefixed,
        "opetPrefixed": opet_prefixed,
        "opetLongFirmaRenamed": opet_long_firma_renamed,
        "cachePath": str(CACHE_PATH),
    }

    if args.dry_run:
        print(json.dumps({**report, "dryRun": True}, ensure_ascii=False, indent=2))
        return

    web_backup: Path = backup_file(WEB_DATA_PATH, timestamp)
    android_backup: Path = backup_file(ANDROID_DATA_PATH, timestamp)
    write_json(WEB_DATA_PATH, rows)
    write_json(ANDROID_DATA_PATH, rows)
    write_json(CACHE_PATH, cache)
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
