#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DATA_FILES = [
  "data/keyif.json",
  "data/keyif-restoran.json",
  "data/keyif-kahvalti.json",
  "data/keyif-kebap.json",
  "data/keyif-kafe.json",
  "data/keyif-doner.json",
  "data/keyif-pide.json",
  "data/keyif-cigkofte.json",
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
].join(",");

const PLACE_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "googleMapsUri",
  "websiteUri",
  "nationalPhoneNumber",
].join(",");

const REQUEST_DELAY_MS = Math.max(0, Number.parseInt(process.env.REQUEST_DELAY_MS || "150", 10));
const SAVE_EVERY = Math.max(1, Number.parseInt(process.env.SAVE_EVERY || "25", 10));
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || "3", 10));
const START_INDEX = Math.max(0, Number.parseInt(process.env.START_INDEX || "0", 10));
const LIMIT = Math.max(0, Number.parseInt(process.env.LIMIT || "0", 10));
const MIN_MATCH_SCORE = Number.parseFloat(process.env.MIN_MATCH_SCORE || "6");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REFRESH = args.includes("--refresh");
const TARGET_FILES = collectTargetFiles(args);
const PLACES_API_KEY = String(process.env.PLACES_API_KEY || "").trim();

const turkishCharMap = {
  c: "c",
  g: "g",
  i: "i",
  o: "o",
  s: "s",
  u: "u",
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function collectTargetFiles(rawArgs) {
  const targets = [];

  for (let index = 0; index < rawArgs.length; index += 1) {
    if (rawArgs[index] !== "--file") {
      continue;
    }

    const nextValue = String(rawArgs[index + 1] || "").trim();
    if (!nextValue) {
      continue;
    }

    targets.push(nextValue);
    index += 1;
  }

  return targets;
}

function resolveTargetFiles() {
  if (TARGET_FILES.length > 0) {
    return TARGET_FILES.map((item) => path.resolve(ROOT, item));
  }

  return DEFAULT_DATA_FILES.map((item) => path.resolve(ROOT, item));
}

function readJson(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function backupPathFor(filePath) {
  const extension = path.extname(filePath);
  if (!extension) {
    return `${filePath}.ratings.backup`;
  }

  return `${filePath.slice(0, -extension.length)}.ratings.backup${extension}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .replace(/[çğıiöşü]/g, (char) => turkishCharMap[char] || char)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQuery(record) {
  return [
    normalizeText(record.name),
    normalizeText(record.address),
    [normalizeText(record.district), normalizeText(record.city)].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function requestJson(method, pathname, payload, headers = {}) {
  const body = payload ? JSON.stringify(payload) : "";

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method,
        hostname: "places.googleapis.com",
        path: pathname,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "X-Goog-Api-Key": PLACES_API_KEY,
          ...headers,
        },
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          const parsed = raw ? safeJsonParse(raw) : null;

          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed || {});
            return;
          }

          const message =
            parsed?.error?.message
            || parsed?.message
            || `HTTP ${response.statusCode || 0}`;
          reject(new Error(message));
        });
      },
    );

    request.on("error", (error) => {
      reject(error);
    });

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

async function getPlaceById(placeId) {
  const cleanedPlaceId = normalizeText(placeId);
  if (!cleanedPlaceId) {
    return null;
  }

  const pathname = `/v1/places/${encodeURIComponent(cleanedPlaceId)}`;
  return requestJson("GET", pathname, null, {
    "X-Goog-FieldMask": PLACE_FIELD_MASK,
  });
}

async function searchPlaces(query) {
  const textQuery = normalizeText(query);
  if (!textQuery) {
    return [];
  }

  const payload = {
    textQuery,
    languageCode: "tr",
    regionCode: "TR",
    maxResultCount: 5,
  };

  const response = await requestJson("POST", "/v1/places:searchText", payload, {
    "X-Goog-FieldMask": FIELD_MASK,
  });

  return Array.isArray(response?.places) ? response.places : [];
}

function chooseBestPlace(record, places) {
  const wantedName = normalizeForCompare(record.name);
  const wantedCity = normalizeForCompare(record.city);
  const wantedDistrict = normalizeForCompare(record.district);
  const wantedAddress = normalizeForCompare(record.address);

  let bestMatch = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const place of places) {
    const placeName = normalizeForCompare(place?.displayName?.text || "");
    const placeAddress = normalizeForCompare(place?.formattedAddress || "");
    let score = 0;

    if (placeName && wantedName) {
      if (placeName === wantedName) {
        score += 12;
      } else if (placeName.includes(wantedName) || wantedName.includes(placeName)) {
        score += 8;
      }

      const wantedTokens = wantedName.split(" ").filter(Boolean);
      const matchingTokens = wantedTokens.filter((token) => placeName.includes(token));
      score += matchingTokens.length * 1.5;
    }

    if (wantedDistrict && placeAddress.includes(wantedDistrict)) {
      score += 4;
    }

    if (wantedCity && placeAddress.includes(wantedCity)) {
      score += 3;
    }

    if (wantedAddress) {
      const addressTokens = wantedAddress.split(" ").filter((token) => token.length >= 4);
      const matchingAddressTokens = addressTokens.filter((token) => placeAddress.includes(token));
      score += matchingAddressTokens.length * 0.75;
    }

    if (typeof place?.rating === "number" && Number.isFinite(place.rating)) {
      score += place.rating / 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = place;
    }
  }

  if (bestScore < MIN_MATCH_SCORE) {
    return null;
  }

  return bestMatch;
}

function applyPlaceDetails(record, place) {
  const nextRecord = { ...record };
  let changed = false;

  const nextPlaceId = normalizeText(place?.id || record.placeId || record.sourcePlaceId);
  if (nextPlaceId && nextPlaceId !== normalizeText(record.placeId || record.sourcePlaceId)) {
    nextRecord.placeId = nextPlaceId;
    changed = true;
  }

  const nextRating =
    typeof place?.rating === "number" && Number.isFinite(place.rating)
      ? Number(place.rating.toFixed(1))
      : normalizeText(record.googleRating);
  if (String(nextRating) !== normalizeText(record.googleRating) && nextRating !== "") {
    nextRecord.googleRating = nextRating;
    changed = true;
  }

  const nextReviewCount =
    typeof place?.userRatingCount === "number" && Number.isFinite(place.userRatingCount)
      ? Math.max(0, Math.trunc(place.userRatingCount))
      : normalizeText(record.googleReviewCount);
  if (String(nextReviewCount) !== normalizeText(record.googleReviewCount) && nextReviewCount !== "") {
    nextRecord.googleReviewCount = nextReviewCount;
    changed = true;
  }

  const nextMapsUrl = normalizeText(place?.googleMapsUri);
  if (!normalizeText(record.mapsUrl) && nextMapsUrl) {
    nextRecord.mapsUrl = nextMapsUrl;
    changed = true;
  }

  const nextWebsite = normalizeText(place?.websiteUri);
  if (!normalizeText(record.website) && nextWebsite) {
    nextRecord.website = nextWebsite;
    changed = true;
  }

  const nextPhone = normalizeText(place?.nationalPhoneNumber);
  if (!normalizeText(record.phone) && nextPhone) {
    nextRecord.phone = nextPhone;
    changed = true;
  }

  return { changed, record: nextRecord };
}

function shouldSkipRecord(record) {
  if (REFRESH) {
    return false;
  }

  const hasRating = normalizeText(record.googleRating);
  const hasReviewCount = normalizeText(record.googleReviewCount);
  return Boolean(hasRating && hasReviewCount);
}

async function requestWithRetry(work) {
  let lastError = null;

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_LIMIT) {
        await sleep(REQUEST_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

async function enrichRecord(record) {
  const existingPlaceId = normalizeText(record.placeId || record.sourcePlaceId);

  if (existingPlaceId) {
    const place = await requestWithRetry(() => getPlaceById(existingPlaceId));
    return applyPlaceDetails(record, place);
  }

  const query = buildSearchQuery(record);
  const places = await requestWithRetry(() => searchPlaces(query));
  const bestPlace = chooseBestPlace(record, places);

  if (!bestPlace) {
    return { changed: false, record, unmatched: true };
  }

  return applyPlaceDetails(record, bestPlace);
}

async function enrichFile(filePath) {
  const existing = readJson(filePath, []);
  if (!Array.isArray(existing)) {
    throw new Error(`Geçersiz JSON dizi: ${filePath}`);
  }

  if (!DRY_RUN) {
    writeJson(backupPathFor(filePath), existing);
  }

  const stats = {
    file: path.relative(ROOT, filePath),
    total: existing.length,
    processed: 0,
    updated: 0,
    skipped: 0,
    unmatched: 0,
    failed: 0,
  };

  const output = existing.map((item) => ({ ...item }));
  const effectiveEnd = LIMIT > 0 ? Math.min(output.length, START_INDEX + LIMIT) : output.length;

  for (let index = START_INDEX; index < effectiveEnd; index += 1) {
    const current = output[index];
    if (!current || typeof current !== "object") {
      continue;
    }

    if (shouldSkipRecord(current)) {
      stats.skipped += 1;
      continue;
    }

    try {
      const result = await enrichRecord(current);
      output[index] = result.record;
      stats.processed += 1;

      if (result.changed) {
        stats.updated += 1;
      }

      if (result.unmatched) {
        stats.unmatched += 1;
      }
    } catch (error) {
      stats.processed += 1;
      stats.failed += 1;
      console.error(`Kayit hatasi [${stats.file} #${index + 1}] ${normalizeText(current.name)}: ${error.message}`);
    }

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    const processedCount = index - START_INDEX + 1;
    if (!DRY_RUN && processedCount % SAVE_EVERY === 0) {
      writeJson(filePath, output);
    }
  }

  if (!DRY_RUN) {
    writeJson(filePath, output);
  }

  return stats;
}

async function main() {
  if (!PLACES_API_KEY) {
    console.error("PLACES_API_KEY tanımlı değil. Geçerli bir Google Places API anahtarı verin.");
    process.exitCode = 1;
    return;
  }

  const files = resolveTargetFiles().filter((filePath) => fs.existsSync(filePath));
  if (files.length === 0) {
    console.error("İşlenecek Keyif veri dosyası bulunamadı.");
    process.exitCode = 1;
    return;
  }

  const summaries = [];

  for (const filePath of files) {
    const summary = await enrichFile(filePath);
    summaries.push(summary);
    console.log(
      [
        `${summary.file}:`,
        `toplam=${summary.total}`,
        `islenen=${summary.processed}`,
        `guncellenen=${summary.updated}`,
        `atlanan=${summary.skipped}`,
        `eslesmeyen=${summary.unmatched}`,
        `hatali=${summary.failed}`,
        DRY_RUN ? "mod=dry-run" : "mod=yazildi",
      ].join(" "),
    );
  }

  const totals = summaries.reduce(
    (accumulator, item) => ({
      total: accumulator.total + item.total,
      processed: accumulator.processed + item.processed,
      updated: accumulator.updated + item.updated,
      skipped: accumulator.skipped + item.skipped,
      unmatched: accumulator.unmatched + item.unmatched,
      failed: accumulator.failed + item.failed,
    }),
    { total: 0, processed: 0, updated: 0, skipped: 0, unmatched: 0, failed: 0 },
  );

  console.log(
    [
      "Genel toplam:",
      `dosya=${summaries.length}`,
      `toplam=${totals.total}`,
      `islenen=${totals.processed}`,
      `guncellenen=${totals.updated}`,
      `atlanan=${totals.skipped}`,
      `eslesmeyen=${totals.unmatched}`,
      `hatali=${totals.failed}`,
    ].join(" "),
  );
}

void main();
