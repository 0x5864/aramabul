#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "akaryakit.json");
const BACKUP_PATH = path.join(ROOT_DIR, "data", "akaryakit.dedupe.backup.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function toPlainString(value) {
  return String(value || "").trim();
}

function normalizeForCompare(value) {
  return toPlainString(value)
    .toLocaleLowerCase("tr")
    .replace(/[çğıiöşü]/gu, (char) => ({ ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u" }[char] || char))
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeCompact(value) {
  return normalizeForCompare(value).replace(/[^a-z0-9]/gu, "");
}

function containsDistrictHint(record) {
  const district = normalizeForCompare(record.district);
  const address = normalizeForCompare(record.address);
  if (!district || !address) {
    return false;
  }
  return address.includes(district);
}

function scoreRecord(record) {
  let score = 0;
  if (containsDistrictHint(record)) {
    score += 100;
  }
  if (toPlainString(record.phone)) {
    score += 10;
  }
  if (toPlainString(record.website)) {
    score += 6;
  }
  if (Number.isFinite(Number(record.googleRating))) {
    score += 4;
  }
  score += Math.min(toPlainString(record.address).length, 80) / 100;
  score += Math.min(toPlainString(record.name).length, 60) / 1000;
  return score;
}

function mergeRecord(preferredRecord, secondaryRecord) {
  const preferred = { ...preferredRecord };
  const secondary = { ...secondaryRecord };

  if (!toPlainString(preferred.address) || toPlainString(secondary.address).length > toPlainString(preferred.address).length) {
    preferred.address = toPlainString(secondary.address) || toPlainString(preferred.address);
  }
  if (!toPlainString(preferred.phone) && toPlainString(secondary.phone)) {
    preferred.phone = toPlainString(secondary.phone);
  }
  if (!toPlainString(preferred.website) && toPlainString(secondary.website)) {
    preferred.website = toPlainString(secondary.website);
  }
  if (!toPlainString(preferred.mapsUrl) && toPlainString(secondary.mapsUrl)) {
    preferred.mapsUrl = toPlainString(secondary.mapsUrl);
  }
  if (!toPlainString(preferred.placeId) && toPlainString(secondary.placeId)) {
    preferred.placeId = toPlainString(secondary.placeId);
  }
  if ((preferred.googleRating === null || preferred.googleRating === undefined || preferred.googleRating === "") && secondary.googleRating !== undefined) {
    preferred.googleRating = secondary.googleRating;
  }

  return preferred;
}

function buildKey(record) {
  const mapsUrl = toPlainString(record.mapsUrl);
  if (mapsUrl) {
    return `url:${mapsUrl}`;
  }

  const city = normalizeCompact(record.city);
  const name = normalizeCompact(record.name);
  const address = normalizeCompact(record.address);
  return `fallback:${city}|${name}|${address}`;
}

function sortRecords(leftRecord, rightRecord) {
  const cityDiff = toPlainString(leftRecord.city).localeCompare(toPlainString(rightRecord.city), "tr");
  if (cityDiff !== 0) {
    return cityDiff;
  }

  const districtDiff = toPlainString(leftRecord.district).localeCompare(toPlainString(rightRecord.district), "tr");
  if (districtDiff !== 0) {
    return districtDiff;
  }

  return toPlainString(leftRecord.name).localeCompare(toPlainString(rightRecord.name), "tr");
}

function main() {
  const rows = readJson(DATA_PATH);
  fs.copyFileSync(DATA_PATH, BACKUP_PATH);

  const grouped = new Map();
  for (const row of rows) {
    const key = buildKey(row);
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  const output = [];
  let removed = 0;

  for (const group of grouped.values()) {
    if (group.length === 1) {
      output.push(group[0]);
      continue;
    }

    removed += group.length - 1;

    const ranked = [...group].sort((leftRecord, rightRecord) => {
      const scoreDiff = scoreRecord(rightRecord) - scoreRecord(leftRecord);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return sortRecords(leftRecord, rightRecord);
    });

    let winner = ranked[0];
    for (let index = 1; index < ranked.length; index += 1) {
      winner = mergeRecord(winner, ranked[index]);
    }
    output.push(winner);
  }

  output.sort(sortRecords);
  writeJson(DATA_PATH, output);

  console.log(
    JSON.stringify(
      {
        before: rows.length,
        after: output.length,
        removed,
        backup: path.relative(ROOT_DIR, BACKUP_PATH),
      },
      null,
      2,
    ),
  );
}

main();
