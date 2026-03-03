"""Build address lookup data from the official PTT postcode workbook."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterator
from zipfile import ZipFile
from xml.etree import ElementTree as ET


XLSX_NS: dict[str, str] = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
WORD_PATTERN = re.compile(r"[A-Za-zÇĞİIÖŞÜçğıöşü]+")
CELL_REF_PATTERN = re.compile(r"[A-Z]+")
LOWER_MAP = str.maketrans({"I": "ı", "İ": "i"})


def load_shared_strings(archive: ZipFile) -> list[str]:
    """Return the shared string table from an xlsx archive."""
    shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values: list[str] = []

    for item in shared_root.findall("x:si", XLSX_NS):
        text_parts = [node.text or "" for node in item.findall(".//x:t", XLSX_NS)]
        values.append("".join(text_parts))

    return values


def decode_cell_text(cell: ET.Element, shared_strings: list[str]) -> str:
    """Return the text value for a worksheet cell."""
    value_node = cell.find("x:v", XLSX_NS)
    if value_node is None or value_node.text is None:
        return ""

    raw_value = value_node.text
    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw_value)]

    return raw_value


def iter_sheet_rows(workbook_path: Path) -> Iterator[tuple[str, str, str, str, str]]:
    """Yield raw worksheet rows as five-column tuples."""
    with ZipFile(workbook_path) as archive:
        shared_strings = load_shared_strings(archive)
        sheet_root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        sheet_data = sheet_root.find("x:sheetData", XLSX_NS)
        if sheet_data is None:
            return

        for row in sheet_data.findall("x:row", XLSX_NS)[1:]:
            values: dict[str, str] = {column: "" for column in ("A", "B", "C", "D", "E")}
            for cell in row.findall("x:c", XLSX_NS):
                match = CELL_REF_PATTERN.match(cell.attrib.get("r", ""))
                if not match:
                    continue

                column = match.group(0)
                if column in values:
                    values[column] = decode_cell_text(cell, shared_strings)

            yield values["A"], values["B"], values["C"], values["D"], values["E"]


def trim_text(value: str) -> str:
    """Collapse repeated whitespace and trim the string."""
    return " ".join(value.split())


def title_word(word: str) -> str:
    """Title-case a word with Turkish I handling."""
    lowered = word.translate(LOWER_MAP).lower()
    if not lowered:
        return ""

    first = lowered[0]
    if first == "i":
        first = "İ"
    elif first == "ı":
        first = "I"
    else:
        first = first.upper()

    return first + lowered[1:]


def turkish_title(value: str) -> str:
    """Convert an uppercase source string into a readable Turkish title."""
    compact = trim_text(value)
    return WORD_PATTERN.sub(lambda match: title_word(match.group(0)), compact)


def tidy_label(value: str) -> str:
    """Normalize the display label used in dropdowns."""
    label = turkish_title(value)
    label = re.sub(r"\bMahallesi\b", "Mah.", label, flags=re.IGNORECASE)
    label = re.sub(r"\bMah\b\.?", "Mah.", label, flags=re.IGNORECASE)
    label = re.sub(r"\bKöyü\b", "Köy", label, flags=re.IGNORECASE)
    label = re.sub(r"\s+", " ", label)
    return label.strip(" -")


def normalize_key(value: str) -> str:
    """Normalize a string for stable postcode lookup keys."""
    lowered = value.translate(LOWER_MAP).lower()
    lowered = re.sub(r"\bmah(allesi)?\b", "mah", lowered)
    lowered = re.sub(r"\bkoy(u|ü)?\b", "koy", lowered)
    lowered = re.sub(r"[^a-z0-9çğıöşü]+", " ", lowered, flags=re.IGNORECASE)
    return " ".join(lowered.split())


def build_data(workbook_path: Path) -> tuple[dict[str, list[str]], dict[str, dict[str, list[str]]], dict[str, str]]:
    """Build districts, neighborhood lists, and postcode mappings from the workbook."""
    raw_rows: list[tuple[str, str, str, str, str, str]] = []
    district_order: dict[str, list[str]] = defaultdict(list)
    district_seen: dict[str, set[str]] = defaultdict(set)
    base_counts: dict[tuple[str, str], Counter[str]] = defaultdict(Counter)

    for city_raw, district_raw, area_raw, neighborhood_raw, postcode_raw in iter_sheet_rows(workbook_path):
        city = tidy_label(city_raw)
        district = tidy_label(district_raw)
        area = tidy_label(area_raw)
        neighborhood = tidy_label(neighborhood_raw)
        postcode = trim_text(postcode_raw)
        if not city or not district or not postcode:
            continue

        if district not in district_seen[city]:
            district_seen[city].add(district)
            district_order[city].append(district)

        base_name = neighborhood or area or district
        group_key = (city, district)
        base_counts[group_key][normalize_key(base_name)] += 1
        raw_rows.append((city, district, area, neighborhood, base_name, postcode))

    labels_by_district: dict[tuple[str, str], list[str]] = defaultdict(list)
    labels_seen: dict[tuple[str, str], set[str]] = defaultdict(set)
    postcodes: dict[str, str] = {}

    for city, district, area, neighborhood, base_name, postcode in raw_rows:
        group_key = (city, district)
        base_key = normalize_key(base_name)
        area_key = normalize_key(area)
        district_key = normalize_key(district)

        label = base_name
        if area and area_key not in {base_key, district_key} and base_counts[group_key][base_key] > 1:
            label = f"{area} - {base_name}"

        if label in labels_seen[group_key]:
            label = f"{label} ({postcode})"

        labels_seen[group_key].add(label)
        labels_by_district[group_key].append(label)
        postcodes[f"{normalize_key(city)}|{normalize_key(district)}|{normalize_key(label)}"] = postcode

    districts = {city: names for city, names in district_order.items()}
    neighborhoods: dict[str, dict[str, list[str]]] = {}

    for city, district_names in districts.items():
        city_map: dict[str, list[str]] = {}
        for district in district_names:
            city_map[district] = labels_by_district[(city, district)]
        neighborhoods[city] = city_map

    return districts, neighborhoods, postcodes


def write_json(path: Path, payload: object) -> None:
    """Write compact UTF-8 JSON to disk."""
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    """Build official address data files from the downloaded PTT workbook."""
    root = Path(__file__).resolve().parent.parent
    workbook_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/pk_20220810.xlsx")
    districts, neighborhoods, postcodes = build_data(workbook_path)

    write_json(root / "data" / "districts.json", districts)
    write_json(root / "data" / "location-neighborhoods.json", neighborhoods)
    write_json(root / "data" / "location-postcodes.json", postcodes)

    print(
        json.dumps(
            {
                "cities": len(districts),
                "districts": sum(len(items) for items in districts.values()),
                "postcodes": len(postcodes),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
