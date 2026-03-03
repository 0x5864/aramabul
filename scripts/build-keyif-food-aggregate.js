const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const OUTPUT_FILE = path.join(DATA_DIR, "keyif-food.json");
const SOURCE_FILES = [
  "keyif.json",
  "keyif-restoran.json",
  "keyif-kahvalti.json",
  "keyif-kebap.json",
  "keyif-kafe.json",
  "keyif-doner.json",
  "keyif-pide.json",
  "keyif-cigkofte.json",
].map((fileName) => path.join(DATA_DIR, fileName));

const TURKISH_MAP = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toPlainString(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return toPlainString(value)
    .replace(/[çÇğĞıIİiöÖşŞüÜ]/gu, (char) => TURKISH_MAP[char] || char)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function getPlaceId(record) {
  return toPlainString(record.placeId || record.sourcePlaceId);
}

function getNameKey(record) {
  const city = normalizeText(record.city);
  const district = normalizeText(record.district);
  const name = normalizeText(record.name);
  if (!city || !district || !name) {
    return "";
  }
  return `${city}|${district}|${name}`;
}

function buildMapsUrl(record) {
  const query = [toPlainString(record.name), toPlainString(record.address)].filter(Boolean).join(" ");
  if (!query) {
    return "";
  }
  const params = new URLSearchParams({ api: "1", query });
  const placeId = getPlaceId(record);
  if (placeId) {
    params.set("query_place_id", placeId);
  }
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function mergeRecord(baseRecord, incomingRecord) {
  const base = { ...baseRecord };
  const incoming = { ...incomingRecord };
  const placeId = getPlaceId(base) || getPlaceId(incoming);

  base.city = toPlainString(base.city || incoming.city);
  base.district = toPlainString(base.district || incoming.district);
  base.name = toPlainString(base.name || incoming.name);

  const baseAddress = toPlainString(base.address);
  const incomingAddress = toPlainString(incoming.address);
  if (!baseAddress || incomingAddress.length > baseAddress.length) {
    base.address = incomingAddress || baseAddress;
  }

  if (!toPlainString(base.cuisine) && toPlainString(incoming.cuisine)) {
    base.cuisine = toPlainString(incoming.cuisine);
  }

  base.placeId = placeId;
  base.sourcePlaceId = placeId;

  if (!toPlainString(base.mapsUrl)) {
    base.mapsUrl = toPlainString(incoming.mapsUrl) || buildMapsUrl({ ...base, ...incoming, placeId });
  }
  if (!toPlainString(base.website) && toPlainString(incoming.website)) {
    base.website = toPlainString(incoming.website);
  }
  if (!toPlainString(base.phone) && toPlainString(incoming.phone)) {
    base.phone = toPlainString(incoming.phone);
  }
  if (!toPlainString(base.photoUrl) && toPlainString(incoming.photoUrl)) {
    base.photoUrl = toPlainString(incoming.photoUrl);
  }
  if (!toPlainString(base.editorialSummary) && toPlainString(incoming.editorialSummary)) {
    base.editorialSummary = toPlainString(incoming.editorialSummary);
  }
  if (!toPlainString(base.instagram) && toPlainString(incoming.instagram)) {
    base.instagram = toPlainString(incoming.instagram);
  }
  if ((base.googleRating === null || base.googleRating === undefined || base.googleRating === "") && incoming.googleRating !== undefined) {
    base.googleRating = incoming.googleRating;
  }
  if ((base.googleReviewCount === null || base.googleReviewCount === undefined || base.googleReviewCount === "") && incoming.googleReviewCount !== undefined) {
    base.googleReviewCount = incoming.googleReviewCount;
  }
  if ((base.rating === null || base.rating === undefined || base.rating === "") && incoming.rating !== undefined) {
    base.rating = incoming.rating;
  }
  if (!toPlainString(base.budget) && toPlainString(incoming.budget)) {
    base.budget = toPlainString(incoming.budget);
  }

  if (!Object.prototype.hasOwnProperty.call(base, "website")) {
    base.website = "";
  }
  if (!Object.prototype.hasOwnProperty.call(base, "phone")) {
    base.phone = "";
  }

  return base;
}

function compareRecords(leftRecord, rightRecord) {
  const cityComparison = toPlainString(leftRecord.city).localeCompare(toPlainString(rightRecord.city), "tr");
  if (cityComparison !== 0) {
    return cityComparison;
  }

  const districtComparison = toPlainString(leftRecord.district).localeCompare(toPlainString(rightRecord.district), "tr");
  if (districtComparison !== 0) {
    return districtComparison;
  }

  return toPlainString(leftRecord.name).localeCompare(toPlainString(rightRecord.name), "tr");
}

function main() {
  const records = new Map();
  const aliases = new Map();

  function upsert(record) {
    const keys = [];
    const placeId = getPlaceId(record);
    const nameKey = getNameKey(record);

    if (placeId) {
      keys.push(`pid:${placeId}`);
    }
    if (nameKey) {
      keys.push(`name:${nameKey}`);
    }

    let recordId = "";
    for (const key of keys) {
      if (aliases.has(key)) {
        recordId = aliases.get(key);
        break;
      }
    }

    if (!recordId) {
      recordId = `record-${records.size + 1}`;
      records.set(recordId, mergeRecord({}, record));
    } else {
      records.set(recordId, mergeRecord(records.get(recordId), record));
    }

    const mergedRecord = records.get(recordId);
    const mergedPlaceId = getPlaceId(mergedRecord);
    const mergedNameKey = getNameKey(mergedRecord);
    if (mergedPlaceId) {
      aliases.set(`pid:${mergedPlaceId}`, recordId);
    }
    if (mergedNameKey) {
      aliases.set(`name:${mergedNameKey}`, recordId);
    }
  }

  for (const filePath of SOURCE_FILES) {
    const payload = readJson(filePath);
    for (const record of payload) {
      upsert(record);
    }
  }

  if (fs.existsSync(OUTPUT_FILE)) {
    fs.copyFileSync(OUTPUT_FILE, OUTPUT_FILE.replace(/\.json$/u, ".backup.json"));
  }

  const output = [...records.values()].sort(compareRecords);
  writeJson(OUTPUT_FILE, output);
  console.log(JSON.stringify({ output: path.relative(ROOT_DIR, OUTPUT_FILE), count: output.length }, null, 2));
}

main();
