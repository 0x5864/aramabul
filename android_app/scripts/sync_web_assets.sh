#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$APP_DIR/assets/web"
TARGET_DATA_DIR="$TARGET_DIR/data"

echo "Sync web files to: $TARGET_DIR"
mkdir -p "$TARGET_DIR" "$TARGET_DATA_DIR"

cp -f "$ROOT_DIR"/*.html "$TARGET_DIR"/
cp -f "$ROOT_DIR"/*.js "$TARGET_DIR"/
cp -f "$ROOT_DIR"/*.css "$TARGET_DIR"/
rsync -a --delete "$ROOT_DIR/assets/" "$TARGET_DIR/assets/"

RUNTIME_DATA_FILES=(
  "akaryakit.json"
  "asm.json"
  "atm.json"
  "dis-klinikleri.json"
  "districts.json"
  "duraklar.json"
  "eczane.json"
  "nobetci-eczane.json"
  "kargo.json"
  "kuafor.json"
  "noter.json"
  "otopark.json"
  "venues.json"
  "veteriner.json"
  "fallback-data.js"
)

for file_name in "${RUNTIME_DATA_FILES[@]}"; do
  cp -f "$ROOT_DIR/data/$file_name" "$TARGET_DATA_DIR/$file_name"
done

find "$TARGET_DATA_DIR" -type f \( -name "*.backup.json" -o -name "*.xls" -o -name "*.csv" \) -delete

echo "Sync done."
