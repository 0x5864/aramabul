#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DEFAULT_SOURCE = path.join(DATA_DIR, "google-maps-kadikoy-akaryakit.example.json");
const TARGET_PATH = path.join(DATA_DIR, "akaryakit.json");
const BACKUP_PATH = path.join(DATA_DIR, "akaryakit.google-maps.backup.json");

function parseArgs(argv) {
  const args = {
    city: "",
    district: "",
    source: DEFAULT_SOURCE,
    replaceDistrict: true,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = String(argv[index] || "");
    const next = argv[index + 1];

    if (token === "--city" && next) {
      args.city = String(next).trim();
      index += 1;
      continue;
    }

    if (token === "--district" && next) {
      args.district = String(next).trim();
      index += 1;
      continue;
    }

    if (token === "--source" && next) {
      args.source = path.resolve(String(next));
      index += 1;
      continue;
    }

    if (token === "--merge-only") {
      args.replaceDistrict = false;
    }
  }

  return args;
}

function readJson(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallbackValue;
  }
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

function normalizeNameKey(value) {
  return normalizeForCompare(value).replace(/[^a-z0-9]/gu, "");
}

function parseGoogleRating(value) {
  const source = toPlainString(value).replace(",", ".");
  const parsed = Number.parseFloat(source);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePhone(value) {
  const source = toPlainString(value);
  if (!source) {
    return "";
  }

  const cleaned = source
    .replace(/[^\d+]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return cleaned;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractAddress(rawText, name, district, city) {
  const fallback = [district, city].filter(Boolean).join(", ");
  const text = toPlainString(rawText)
    .replace(/\s*\|\s*/gu, " | ")
    .replace(/\s+/gu, " ")
    .trim();

  if (!text) {
    return fallback;
  }

  let working = text;
  const escapedName = escapeRegExp(name);
  if (escapedName) {
    const namePattern = new RegExp(escapedName, "igu");
    working = working.replace(namePattern, " ");
  }

  const servicePattern =
    /(?:Benzin İstasyonu|Akaryakıt İstasyonu|Gas Station|Yakıt İstasyonu)\s*·?\s*(.+)$/iu;
  const serviceMatch = working.match(servicePattern);
  if (serviceMatch) {
    working = serviceMatch[1];
  }

  working = working
    .replace(/[]+/gu, " ")
    .replace(/\b(?:24 saat açık|Açık|Kapalı|Geçici olarak kapalı)\b.*$/iu, " ")
    .replace(/\bWeb sitesi\b.*$/iu, " ")
    .replace(/\bYol tarifi\b.*$/iu, " ")
    .replace(/(?:\+?90\s*)?(?:\(?0?\d{3,4}\)?[\s-]?\d{2,4}[\s-]?\d{2,4}(?:[\s-]?\d{2,4})?).*$/u, " ")
    .replace(/\s*\|\s*.*/u, " ")
    .replace(/^[·,.\-\s]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  if (!working) {
    return fallback;
  }

  if (working.length > 140) {
    return fallback || working.slice(0, 140).trim();
  }

  return working;
}

function normalizeMapsUrl(value) {
  const source = toPlainString(value);
  if (!source) {
    return "";
  }

  try {
    const url = new URL(source);
    url.searchParams.delete("authuser");
    url.searchParams.delete("hl");
    url.searchParams.delete("rclk");
    return url.toString();
  } catch (_error) {
    return source;
  }
}

function normalizeGoogleMapsRecord(record, city, district) {
  const name = toPlainString(record?.name);
  if (!name) {
    return null;
  }

  return {
    city,
    district,
    name,
    address: extractAddress(record?.text, name, district, city),
    placeId: "",
    mapsUrl: normalizeMapsUrl(record?.url),
    website: "",
    phone: normalizePhone(record?.phone),
    googleRating: parseGoogleRating(record?.rating),
  };
}

function mergeRecord(baseRecord, incomingRecord) {
  const base = { ...baseRecord };
  const incoming = { ...incomingRecord };

  if (!toPlainString(base.address) || toPlainString(incoming.address).length > toPlainString(base.address).length) {
    base.address = toPlainString(incoming.address) || toPlainString(base.address);
  }

  if (!toPlainString(base.mapsUrl) && toPlainString(incoming.mapsUrl)) {
    base.mapsUrl = toPlainString(incoming.mapsUrl);
  }

  if (!toPlainString(base.website) && toPlainString(incoming.website)) {
    base.website = toPlainString(incoming.website);
  }

  if (!toPlainString(base.phone) && toPlainString(incoming.phone)) {
    base.phone = toPlainString(incoming.phone);
  }

  if ((base.googleRating === null || base.googleRating === undefined || base.googleRating === "") && incoming.googleRating !== undefined) {
    base.googleRating = incoming.googleRating;
  }

  return {
    city: toPlainString(base.city || incoming.city),
    district: toPlainString(base.district || incoming.district),
    name: toPlainString(base.name || incoming.name),
    address: toPlainString(base.address),
    placeId: toPlainString(base.placeId || incoming.placeId),
    mapsUrl: toPlainString(base.mapsUrl),
    website: toPlainString(base.website),
    phone: toPlainString(base.phone),
    googleRating: base.googleRating ?? null,
  };
}

function recordKey(record) {
  const nameKey = normalizeNameKey(record.name);
  const phoneKey = normalizeNameKey(record.phone);
  const addressKey = normalizeNameKey(record.address);

  if (nameKey && addressKey) {
    return `name:${nameKey}|addr:${addressKey}`;
  }

  if (nameKey && phoneKey) {
    return `name:${nameKey}|phone:${phoneKey}`;
  }

  if (toPlainString(record.mapsUrl)) {
    return `url:${toPlainString(record.mapsUrl)}`;
  }

  return `name:${nameKey}`;
}

function sortRecords(leftRecord, rightRecord) {
  const leftCity = toPlainString(leftRecord.city);
  const rightCity = toPlainString(rightRecord.city);
  const cityDiff = leftCity.localeCompare(rightCity, "tr");
  if (cityDiff !== 0) {
    return cityDiff;
  }

  const leftDistrict = toPlainString(leftRecord.district);
  const rightDistrict = toPlainString(rightRecord.district);
  const districtDiff = leftDistrict.localeCompare(rightDistrict, "tr");
  if (districtDiff !== 0) {
    return districtDiff;
  }

  return toPlainString(leftRecord.name).localeCompare(toPlainString(rightRecord.name), "tr");
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.city || !args.district) {
    throw new Error("--city ve --district zorunludur.");
  }

  const sourcePayload = readJson(args.source, null);
  if (!sourcePayload || !Array.isArray(sourcePayload.results)) {
    throw new Error("Google Maps örnek JSON dosyası okunamadı veya sonuç listesi yok.");
  }

  const normalizedDistrictRecords = sourcePayload.results
    .map((record) => normalizeGoogleMapsRecord(record, args.city, args.district))
    .filter((record) => record !== null);

  const districtStore = new Map();
  for (const record of normalizedDistrictRecords) {
    const key = recordKey(record);
    const current = districtStore.get(key);
    districtStore.set(key, current ? mergeRecord(current, record) : record);
  }

  const replacementRows = [...districtStore.values()].sort(sortRecords);
  const allRows = readJson(TARGET_PATH, []);
  fs.copyFileSync(TARGET_PATH, BACKUP_PATH);

  const districtCityKey = normalizeForCompare(args.city);
  const districtNameKey = normalizeForCompare(args.district);

  const keptRows = args.replaceDistrict
    ? allRows.filter((record) => {
        return !(
          normalizeForCompare(record.city) === districtCityKey
          && normalizeForCompare(record.district) === districtNameKey
        );
      })
    : allRows.slice();

  const mergedRows = [...keptRows, ...replacementRows].sort(sortRecords);
  writeJson(TARGET_PATH, mergedRows);

  console.log(
    JSON.stringify(
      {
        source: path.relative(ROOT_DIR, args.source),
        city: args.city,
        district: args.district,
        replacedDistrictRows: args.replaceDistrict,
        previousDistrictCount: allRows.filter((record) => {
          return (
            normalizeForCompare(record.city) === districtCityKey
            && normalizeForCompare(record.district) === districtNameKey
          );
        }).length,
        importedRawCount: sourcePayload.results.length,
        importedUniqueCount: replacementRows.length,
        finalTotalCount: mergedRows.length,
        backup: path.relative(ROOT_DIR, BACKUP_PATH),
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
