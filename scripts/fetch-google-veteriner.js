#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DISTRICTS_PATH = path.join(DATA_DIR, "districts.json");
const OUTPUT_PATH = path.join(DATA_DIR, "veteriner.json");
const BACKUP_PATH = path.join(DATA_DIR, "veteriner.backup.json");
const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

function parseCliArgs(argv) {
  const args = {
    replace: false,
    dryRun: false,
    city: "",
    district: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--replace") {
      args.replace = true;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--city") {
      args.city = String(argv[i + 1] || "").trim();
      i += 1;
      continue;
    }

    if (token === "--district") {
      args.district = String(argv[i + 1] || "").trim();
      i += 1;
    }
  }

  return args;
}

const CLI_ARGS = parseCliArgs(process.argv.slice(2));
const REPLACE_MODE = CLI_ARGS.replace;
const DRY_RUN = CLI_ARGS.dryRun;
const CITY_ARG_FILTER = CLI_ARGS.city;
const DISTRICT_ARG_FILTER = CLI_ARGS.district;

const MAX_QUERIES = Number.parseInt(process.env.MAX_QUERIES || "0", 10);
const START_INDEX = Math.max(0, Number.parseInt(process.env.START_INDEX || "0", 10));
const QUERY_DELAY_MS = Number.parseInt(process.env.QUERY_DELAY_MS || "120", 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PAGE_DELAY_MS || "2100", 10);
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || "4", 10));
const MAX_PAGES = Math.max(1, Number.parseInt(process.env.MAX_PAGES || "3", 10));
const PAGE_SIZE = Math.max(1, Math.min(20, Number.parseInt(process.env.PAGE_SIZE || "20", 10)));
const SAVE_EVERY = Math.max(0, Number.parseInt(process.env.SAVE_EVERY || "25", 10));

const SEARCH_TERMS = String(
  process.env.SEARCH_TERMS ||
    "veteriner kliniği,veteriner,hayvan hastanesi,veteriner hekim,veterinary clinic,pet clinic",
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const CITY_FILTERS = String(process.env.CITY_FILTER || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => normalizeForCompare(item));

const turkishCharMap = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function readDotEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const entries = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    const map = {};

    entries.forEach((entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex <= 0) {
        return;
      }

      const key = entry.slice(0, separatorIndex).trim();
      let value = entry.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      map[key] = value;
    });

    return map;
  } catch (_error) {
    return {};
  }
}

function resolveApiKey() {
  if (process.env.PLACES_API_KEY) {
    return process.env.PLACES_API_KEY;
  }

  const dotenvPaths = [path.join(ROOT, ".env.local"), path.join(ROOT, ".env")];
  for (const dotenvPath of dotenvPaths) {
    const values = readDotEnvFile(dotenvPath);
    if (values.PLACES_API_KEY) {
      return values.PLACES_API_KEY;
    }
  }

  return "";
}

const API_KEY = resolveApiKey();

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

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeForCompare(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
    .replace(/\s+/g, " ")
    .trim();
}

function foldForPath(value) {
  return normalizeForCompare(value).replace(/\s+/g, "").replace(/[^a-z0-9/]/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function getPlaceName(place) {
  if (place && place.displayName && typeof place.displayName.text === "string") {
    return normalizeText(place.displayName.text);
  }
  return normalizeText(place && place.name);
}

function getPlaceId(place) {
  return normalizeText((place && place.id) || (place && place.place_id));
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
}

function resolveDistrictFromAddress(city, fallbackDistrict, address, districtMap) {
  const cityName = normalizeText(city);
  const fallback = normalizeText(fallbackDistrict || "Merkez");
  const districtList =
    cityName && districtMap && Array.isArray(districtMap[cityName]) ? districtMap[cityName] : [];
  const addressText = normalizeText(address);

  if (!districtList.length || !addressText) {
    return fallback;
  }

  const foldedAddress = foldForPath(addressText);
  const foldedCity = foldForPath(cityName);

  if (!foldedAddress || !foldedCity) {
    return fallback;
  }

  const sortedDistricts = [...districtList].sort((left, right) => right.length - left.length);
  for (const districtName of sortedDistricts) {
    const cleanDistrict = normalizeText(districtName);
    const foldedDistrict = foldForPath(cleanDistrict);
    if (!foldedDistrict) {
      continue;
    }
    if (foldedAddress.includes(`${foldedDistrict}/${foldedCity}`)) {
      return cleanDistrict;
    }
  }

  return fallback;
}

function looksLikeVeterinaryPlace(place) {
  const types = Array.isArray(place && place.types) ? place.types.map((value) => normalizeText(value)) : [];
  if (types.includes("veterinary_care")) {
    return true;
  }

  const searchText = normalizeForCompare(
    [
      getPlaceName(place),
      place && (place.formattedAddress || place.shortFormattedAddress),
      types.join(" "),
    ].join(" "),
  );

  if (!searchText) {
    return false;
  }

  return [
    "veteriner",
    "veterinary",
    "pet clinic",
    "hayvan hastanesi",
    "veteriner hekim",
    "pet vet",
  ].some((needle) => searchText.includes(needle));
}

function mapPlaceToVeteriner(place, queryMeta, districts) {
  const placeId = getPlaceId(place);
  const name = normalizeText(getPlaceName(place));
  const address = normalizeText(place && (place.formattedAddress || place.shortFormattedAddress));
  const mapsUrl = normalizeText((place && place.googleMapsUri) || "");

  if (!name) {
    return null;
  }

  const district = resolveDistrictFromAddress(queryMeta.city, queryMeta.district, address, districts);

  return {
    city: queryMeta.city,
    district,
    name,
    address,
    placeId,
    mapsUrl,
    source: "google_places",
  };
}

function buildQueryList(districtMap, terms) {
  const list = [];
  const cityFilterNormalized = normalizeForCompare(CITY_ARG_FILTER);
  const districtFilterNormalized = normalizeForCompare(DISTRICT_ARG_FILTER);

  Object.entries(districtMap).forEach(([city, districts]) => {
    const cityNormalized = normalizeForCompare(city);
    if (cityFilterNormalized && cityNormalized !== cityFilterNormalized) {
      return;
    }

    if (CITY_FILTERS.length > 0 && !CITY_FILTERS.includes(normalizeForCompare(city))) {
      return;
    }

    const districtList = Array.isArray(districts) && districts.length > 0 ? districts : ["Merkez"];
    districtList.forEach((district) => {
      const districtNormalized = normalizeForCompare(district);
      if (districtFilterNormalized && districtNormalized !== districtFilterNormalized) {
        return;
      }

      terms.forEach((term) => {
        list.push({
          city,
          district: normalizeText(district) || "Merkez",
          term,
          query: `${district} ${city} ${term}`,
        });
      });
    });
  });

  return list;
}

async function fetchTextSearch(query, pageToken = "") {
  const payload = {
    textQuery: query,
    languageCode: "tr",
    regionCode: "TR",
    pageSize: PAGE_SIZE,
  };
  if (pageToken) {
    payload.pageToken = pageToken;
  }

  let attempt = 0;
  while (attempt < RETRY_LIMIT) {
    attempt += 1;

    let response;
    try {
      response = await fetch(TEXT_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.googleMapsUri,places.types,nextPageToken",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (attempt >= RETRY_LIMIT) {
        throw new Error(normalizeText(error && error.message) || "Ağ hatası");
      }
      await sleep(500 * attempt);
      continue;
    }

    if (response.ok) {
      return response.json();
    }

    let message = `HTTP ${response.status}`;
    try {
      const errorPayload = await response.json();
      if (errorPayload && errorPayload.error && errorPayload.error.message) {
        message = errorPayload.error.message;
      }
    } catch (_error) {
      // no-op
    }

    if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
      throw new Error(message);
    }

    await sleep(700 * attempt);
  }

  throw new Error("Bilinmeyen hata");
}

function venueKey(venue) {
  const placeId = normalizeText(venue && venue.placeId);
  if (placeId) {
    return `pid:${placeId}`;
  }

  const city = normalizeName(venue && venue.city);
  const district = normalizeName(venue && venue.district);
  const name = normalizeName(venue && venue.name);
  const address = normalizeName(venue && venue.address);
  return `na:${city}|${district}|${name}|${address}`;
}

function mergeInitialData(existingList) {
  const map = new Map();
  existingList.forEach((item) => {
    const key = venueKey(item);
    if (!key) {
      return;
    }
    map.set(key, item);
  });
  return map;
}

function upsertVeteriner(venueMap, venue) {
  if (!venue || typeof venue !== "object") {
    return;
  }

  const key = venueKey(venue);
  if (!key) {
    return;
  }

  const previous = venueMap.get(key);
  if (previous && typeof previous === "object") {
    venueMap.set(key, { ...previous, ...venue });
    return;
  }
  venueMap.set(key, venue);
}

function sortVeterinerList(list) {
  return [...list].sort((left, right) => {
    const cityOrder = normalizeText(left && left.city).localeCompare(normalizeText(right && right.city), "tr");
    if (cityOrder !== 0) {
      return cityOrder;
    }

    const districtOrder = normalizeText(left && left.district).localeCompare(
      normalizeText(right && right.district),
      "tr",
    );
    if (districtOrder !== 0) {
      return districtOrder;
    }

    return normalizeText(left && left.name).localeCompare(normalizeText(right && right.name), "tr");
  });
}

function saveSnapshot(venueMap) {
  if (DRY_RUN) {
    return false;
  }

  const snapshot = sortVeterinerList(venueMap.values());
  if (snapshot.length === 0) {
    return false;
  }

  writeJson(OUTPUT_PATH, snapshot);
  return true;
}

function saveDataset(existingList, finalList) {
  if (DRY_RUN) {
    console.log("Dry-run: veteriner.json yazilmadi.");
    console.log(`Yazilacak kayit: ${finalList.length}`);
    return;
  }

  if (existingList.length > 0) {
    writeJson(BACKUP_PATH, existingList);
    console.log(`Yedek dosya yazildi: ${BACKUP_PATH}`);
  }

  writeJson(OUTPUT_PATH, finalList);
  console.log("Tamamlandi.");
  console.log(`Yazilan kayit: ${finalList.length}`);
  console.log(`Dosya: ${OUTPUT_PATH}`);
}

async function run() {
  if (!API_KEY) {
    console.error(
      "PLACES_API_KEY bulunamadi. Ornek: PLACES_API_KEY=... node scripts/fetch-google-veteriner.js",
    );
    process.exitCode = 1;
    return;
  }

  if (SEARCH_TERMS.length === 0) {
    console.error("SEARCH_TERMS bos olamaz.");
    process.exitCode = 1;
    return;
  }

  const districts = readJson(DISTRICTS_PATH, {});
  if (!districts || typeof districts !== "object" || Array.isArray(districts)) {
    console.error("districts.json okunamadi veya format hatali.");
    process.exitCode = 1;
    return;
  }

  const existing = readJson(OUTPUT_PATH, []);
  const existingList = Array.isArray(existing) ? existing : [];
  const venueMap = mergeInitialData(REPLACE_MODE ? [] : existingList);

  const queryList = buildQueryList(districts, SEARCH_TERMS);
  const safeStart = Math.min(START_INDEX, queryList.length);
  const queryLimit = Number.isFinite(MAX_QUERIES) && MAX_QUERIES > 0 ? MAX_QUERIES : queryList.length;
  const safeEnd = Math.min(queryList.length, safeStart + queryLimit);
  const activeQueries = queryList.slice(safeStart, safeEnd);

  console.log(`Toplam sorgu: ${queryList.length}`);
  console.log(`Baslangic indeksi: ${safeStart}`);
  console.log(`Calisacak sorgu: ${activeQueries.length}`);
  console.log(`Arama terimleri: ${SEARCH_TERMS.join(", ")}`);
  if (CITY_ARG_FILTER) {
    console.log(`Sehir filtresi: ${CITY_ARG_FILTER}`);
  }
  if (DISTRICT_ARG_FILTER) {
    console.log(`Ilce filtresi: ${DISTRICT_ARG_FILTER}`);
  }
  console.log(`Mod: ${REPLACE_MODE ? "replace" : "merge"}${DRY_RUN ? " + dry-run" : ""}`);

  let requestCount = 0;
  let rawResultCount = 0;
  let acceptedCount = 0;
  let errorQueryCount = 0;
  let successQueryCount = 0;
  const initialSize = venueMap.size;
  const recentErrors = [];

  for (let index = 0; index < activeQueries.length; index += 1) {
    const item = activeQueries[index];
    let pageToken = "";
    let pageNo = 0;

    do {
      pageNo += 1;
      requestCount += 1;

      let payload;
      try {
        payload = await fetchTextSearch(item.query, pageToken);
        successQueryCount += 1;
      } catch (error) {
        errorQueryCount += 1;
        console.warn(`Sorgu hatasi [${index + 1}/${activeQueries.length}] ${item.query}: ${error.message}`);
        if (recentErrors.length < 10) {
          recentErrors.push(`${item.query}: ${error.message}`);
        }
        break;
      }

      const places = Array.isArray(payload && payload.places)
        ? payload.places
        : Array.isArray(payload && payload.results)
          ? payload.results
          : [];

      rawResultCount += places.length;

      places.forEach((place) => {
        if (!looksLikeVeterinaryPlace(place)) {
          return;
        }

        const mapped = mapPlaceToVeteriner(place, item, districts);
        if (!mapped) {
          return;
        }

        acceptedCount += 1;
        upsertVeteriner(venueMap, mapped);
      });

      pageToken = normalizeText((payload && payload.nextPageToken) || (payload && payload.next_page_token));
      if (pageToken && pageNo < MAX_PAGES) {
        await sleep(PAGE_DELAY_MS);
      }
    } while (pageToken && pageNo < MAX_PAGES);

    if ((index + 1) % 20 === 0 || index === activeQueries.length - 1) {
      console.log(
        `Ilerleme: ${index + 1}/${activeQueries.length} (global=${safeStart + index + 1}/${queryList.length}) | Ham: ${rawResultCount} | Eslesen: ${acceptedCount} | Esiz veteriner: ${venueMap.size} | Istek: ${requestCount}`,
      );
    }

    if (SAVE_EVERY > 0 && !DRY_RUN && (index + 1) % SAVE_EVERY === 0) {
      const snapshotSaved = saveSnapshot(venueMap);
      if (snapshotSaved) {
        console.log(`Ara kayit yazildi: ${OUTPUT_PATH} (islenen sorgu: ${index + 1})`);
      }
    }

    if (QUERY_DELAY_MS > 0) {
      await sleep(QUERY_DELAY_MS);
    }
  }

  const finalList = sortVeterinerList(venueMap.values());
  const addedCount = Math.max(0, venueMap.size - initialSize);

  console.log(`Basarili sorgu: ${successQueryCount}`);
  console.log(`Hatali sorgu: ${errorQueryCount}`);
  console.log(`Yeni eklenen benzersiz kayit: ${addedCount}`);

  if (successQueryCount === 0 && activeQueries.length > 0) {
    console.error("Google Places sorgulari basarisiz oldu. API anahtari, faturalandirma veya kota ayarlarini kontrol edin.");
    if (recentErrors.length > 0) {
      console.error("Ornek hatalar:");
      recentErrors.forEach((item) => console.error(`- ${item}`));
    }
    process.exitCode = 1;
    return;
  }

  if (finalList.length === 0) {
    console.error("Kayit bulunamadi. veteriner.json guncellenmedi.");
    process.exitCode = 1;
    return;
  }

  saveDataset(existingList, finalList);
}

run();
