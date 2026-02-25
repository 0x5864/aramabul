#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'akaryakit.json');
const BACKUP_PATH = path.join(DATA_DIR, 'akaryakit.backup.json');

const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const argSet = new Set(process.argv.slice(2));
const REPLACE_MODE = argSet.has('--replace');
const DRY_RUN = argSet.has('--dry-run');

const MAX_QUERIES = Number.parseInt(process.env.MAX_QUERIES || '0', 10);
const START_INDEX = Math.max(0, Number.parseInt(process.env.START_INDEX || '0', 10));
const QUERY_DELAY_MS = Number.parseInt(process.env.QUERY_DELAY_MS || '120', 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PAGE_DELAY_MS || '2100', 10);
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || '4', 10));
const MAX_PAGES = Math.max(1, Number.parseInt(process.env.MAX_PAGES || '3', 10));
const PAGE_SIZE = Math.max(1, Math.min(20, Number.parseInt(process.env.PAGE_SIZE || '20', 10)));
const SAVE_EVERY = Math.max(0, Number.parseInt(process.env.SAVE_EVERY || '25', 10));

const SEARCH_TERMS = String(
  process.env.SEARCH_TERMS || 'akaryakit istasyonu,akaryakıt istasyonu,benzin istasyonu,petrol istasyonu,shell,opet,total,bp,kadoil,moil',
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const CITY_FILTERS = String(process.env.CITY_FILTER || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => normalizeForCompare(item));

const turkishCharMap = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

function readDotEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
    const map = {};

    entries.forEach((entry) => {
      const separatorIndex = entry.indexOf('=');
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

  const dotenvPaths = [path.join(ROOT, '.env.local'), path.join(ROOT, '.env')];

  for (const dotenvPath of dotenvPaths) {
    const values = readDotEnvFile(dotenvPath);
    if (values.PLACES_API_KEY) {
      return values.PLACES_API_KEY;
    }
  }

  return '';
}

const API_KEY = resolveApiKey();

function readJson(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeForCompare(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
    .replace(/\s+/g, ' ')
    .trim();
}

const FUEL_BRAND_KEYWORDS = [
  'shell',
  'opet',
  'total',
  'bp',
  'kadoil',
  'moil',
  'lukoil',
  'po',
  'turkiye petrolleri',
];

const FUEL_NAME_KEYWORDS = ['akaryakit', 'akaryakıt', 'benzin', 'petrol', 'istasyon'];
const NON_FUEL_TYPES = new Set([
  'restaurant',
  'cafe',
  'bakery',
  'meal_takeaway',
  'meal_delivery',
  'bar',
  'lodging',
]);

function foldForPath(value) {
  return normalizeForCompare(value).replace(/\s+/g, '').replace(/[^a-z0-9/]/g, '');
}

function toTitleCaseTr(value) {
  return String(value || '')
    .split(/([\s\-\/()&,."']+)/)
    .map((segment) => {
      if (!/[A-Za-zÇĞİIÖŞÜçğıöşü]/.test(segment)) {
        return segment;
      }

      const lower = segment.toLocaleLowerCase('tr');
      const firstLetterMatch = lower.match(/[a-zçğıöşü]/iu);

      if (!firstLetterMatch || typeof firstLetterMatch.index !== 'number') {
        return lower;
      }

      const letterIndex = firstLetterMatch.index;
      const upperFirst = lower[letterIndex].toLocaleUpperCase('tr');
      return `${lower.slice(0, letterIndex)}${upperFirst}${lower.slice(letterIndex + 1)}`;
    })
    .join('');
}

function sanitizeName(value) {
  const cleaned = normalizeText(value);

  if (!cleaned) {
    return '';
  }

  const lettersOnly = cleaned.replace(/[^A-Za-zÇĞİIÖŞÜçğıöşü]+/g, '');
  if (!lettersOnly) {
    return cleaned;
  }

  const isAllUpper = lettersOnly === lettersOnly.toLocaleUpperCase('tr');
  return isAllUpper ? toTitleCaseTr(cleaned) : cleaned;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function resolveDistrictFromAddress(city, fallbackDistrict, address, districtMap) {
  const cityName = normalizeText(city);
  const fallback = normalizeText(fallbackDistrict || 'Merkez');
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

function getPlaceName(place) {
  if (place && place.displayName && typeof place.displayName.text === 'string') {
    return normalizeText(place.displayName.text);
  }

  return normalizeText(place && place.name);
}

function getPlaceId(place) {
  return normalizeText((place && place.id) || (place && place.place_id));
}

function budgetFromPriceLevel(priceLevel) {
  if (typeof priceLevel === 'string') {
    if (priceLevel === 'PRICE_LEVEL_INEXPENSIVE') return '₺';
    if (priceLevel === 'PRICE_LEVEL_MODERATE') return '₺₺';
    if (priceLevel === 'PRICE_LEVEL_EXPENSIVE') return '₺₺₺';
    if (priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') return '₺₺₺₺';
  }

  const level = Number(priceLevel);
  if (level === 1) return '₺';
  if (level === 2) return '₺₺';
  if (level === 3) return '₺₺₺';
  if (level === 4) return '₺₺₺₺';
  return '₺₺';
}

function looksLikeFuelStation(place) {
  const types = Array.isArray(place && place.types) ? place.types.map((type) => normalizeText(type)) : [];
  const typeSet = new Set(types);

  if (typeSet.has('gas_station')) {
    return true;
  }

  if ([...typeSet].some((type) => NON_FUEL_TYPES.has(type))) {
    return false;
  }

  const name = normalizeForCompare(getPlaceName(place));
  const website = normalizeForCompare((place && place.websiteUri) || (place && place.website));
  const address = normalizeForCompare(place && (place.formattedAddress || place.shortFormattedAddress));
  const searchable = `${name} ${website} ${address}`.trim();

  if (!searchable) {
    return false;
  }

  if (FUEL_NAME_KEYWORDS.some((keyword) => searchable.includes(keyword))) {
    return true;
  }

  return FUEL_BRAND_KEYWORDS.some((keyword) => {
    if (keyword.length <= 2) {
      return searchable.split(/\s+/).includes(keyword);
    }

    return searchable.includes(keyword);
  });
}

function normalizeRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(5, Math.max(0, numeric));
}

function mapPlaceToVenue(place, queryMeta, districts) {
  const placeId = getPlaceId(place);
  const name = sanitizeName(getPlaceName(place));
  const formattedAddress = normalizeText(place && (place.formattedAddress || place.shortFormattedAddress));

  if (!placeId || !name) {
    return null;
  }

  const district = resolveDistrictFromAddress(
    queryMeta.city,
    queryMeta.district,
    formattedAddress,
    districts,
  );

  return {
    city: queryMeta.city,
    district,
    name,
    category: 'Akaryakıt',
    rating: normalizeRating(place && place.rating),
    userRatingCount: Number.isFinite(Number(place && place.userRatingCount))
      ? Math.max(0, Math.round(Number(place.userRatingCount)))
      : null,
    budget: budgetFromPriceLevel((place && place.priceLevel) || (place && place.price_level)),
    address: formattedAddress,
    phone: normalizeText(
      (place && place.nationalPhoneNumber) || (place && place.internationalPhoneNumber),
    ),
    website: normalizeText((place && place.websiteUri) || (place && place.website)),
    source: 'google_places',
    sourcePlaceId: placeId,
    sourceTypes: Array.isArray(place && place.types) ? place.types : [],
  };
}

function buildQueryList(districtMap, terms) {
  const list = [];

  Object.keys(districtMap).forEach((city) => {
    if (CITY_FILTERS.length > 0 && !CITY_FILTERS.includes(normalizeForCompare(city))) {
      return;
    }

    terms.forEach((term) => {
      list.push({
        city,
        district: 'Merkez',
        term,
        query: `${city} ${term}`,
      });
    });
  });

  return list;
}

async function fetchTextSearch(query, pageToken = '') {
  const payload = {
    textQuery: query,
    languageCode: 'tr',
    regionCode: 'TR',
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.types,places.formattedAddress,places.shortFormattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,nextPageToken',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (attempt >= RETRY_LIMIT) {
        throw new Error(normalizeText(error && error.message) || 'Ağ hatası');
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
      // Keep status message.
    }

    if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
      throw new Error(message);
    }

    await sleep(700 * attempt);
  }

  throw new Error('Bilinmeyen hata');
}

function mergeInitialData(existingList) {
  const map = new Map();

  existingList.forEach((item) => {
    const placeId = normalizeText(item && item.sourcePlaceId);
    if (!placeId) {
      return;
    }

    map.set(placeId, item);
  });

  return map;
}

function upsertVenue(venueMap, venue) {
  if (!venue || typeof venue !== 'object') {
    return;
  }

  const key = normalizeText(venue.sourcePlaceId);
  if (!key) {
    return;
  }

  const previous = venueMap.get(key);
  if (previous && typeof previous === 'object') {
    venueMap.set(key, { ...previous, ...venue });
    return;
  }

  venueMap.set(key, venue);
}

function sortAkaryakit(list) {
  return [...list].sort((left, right) => {
    const cityOrder = normalizeText(left && left.city).localeCompare(normalizeText(right && right.city), 'tr');
    if (cityOrder !== 0) return cityOrder;

    const districtOrder = normalizeText(left && left.district).localeCompare(
      normalizeText(right && right.district),
      'tr',
    );
    if (districtOrder !== 0) return districtOrder;

    return normalizeText(left && left.name).localeCompare(normalizeText(right && right.name), 'tr');
  });
}

function saveDataset(existingList, finalList) {
  if (DRY_RUN) {
    console.log('Dry-run: akaryakit.json yazilmadi.');
    console.log(`Yazilacak kayit: ${finalList.length}`);
    return;
  }

  if (existingList.length > 0) {
    writeJson(BACKUP_PATH, existingList);
    console.log(`Yedek dosya yazildi: ${BACKUP_PATH}`);
  }

  writeJson(OUTPUT_PATH, finalList);
  console.log('Tamamlandi.');
  console.log(`Yazilan kayit: ${finalList.length}`);
  console.log(`Dosya: ${OUTPUT_PATH}`);
}

function saveSnapshot(venueMap) {
  if (DRY_RUN) {
    return false;
  }

  const snapshot = sortAkaryakit(venueMap.values());
  if (snapshot.length === 0) {
    return false;
  }

  writeJson(OUTPUT_PATH, snapshot);
  return true;
}

async function run() {
  if (!API_KEY) {
    console.error('PLACES_API_KEY bulunamadi. Ornek: PLACES_API_KEY=... node scripts/fetch-google-akaryakit.js');
    process.exitCode = 1;
    return;
  }

  if (SEARCH_TERMS.length === 0) {
    console.error('SEARCH_TERMS bos olamaz. Ornek: SEARCH_TERMS=akaryakit istasyonu,shell');
    process.exitCode = 1;
    return;
  }

  const districts = readJson(DISTRICTS_PATH, {});
  if (!districts || typeof districts !== 'object' || Array.isArray(districts)) {
    console.error('districts.json okunamadi veya format hatali.');
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
  console.log(`Arama terimleri: ${SEARCH_TERMS.join(', ')}`);
  console.log(`Mod: ${REPLACE_MODE ? 'replace' : 'merge'}${DRY_RUN ? ' + dry-run' : ''}`);

  let requestCount = 0;
  let rawResultCount = 0;
  let acceptedCount = 0;

  for (let index = 0; index < activeQueries.length; index += 1) {
    const item = activeQueries[index];
    let pageToken = '';
    let pageNo = 0;

    do {
      pageNo += 1;
      requestCount += 1;

      let payload;
      try {
        payload = await fetchTextSearch(item.query, pageToken);
      } catch (error) {
        console.warn(`Sorgu hatasi [${index + 1}/${activeQueries.length}] ${item.query}: ${error.message}`);
        break;
      }

      const places = Array.isArray(payload && payload.places)
        ? payload.places
        : Array.isArray(payload && payload.results)
          ? payload.results
          : [];

      rawResultCount += places.length;

      places.forEach((place) => {
        if (!looksLikeFuelStation(place)) {
          return;
        }

        const mapped = mapPlaceToVenue(place, item, districts);
        if (!mapped) {
          return;
        }

        acceptedCount += 1;
        upsertVenue(venueMap, mapped);
      });

      pageToken = normalizeText((payload && payload.nextPageToken) || (payload && payload.next_page_token));

      if (pageToken && pageNo < MAX_PAGES) {
        await sleep(PAGE_DELAY_MS);
      }
    } while (pageToken && pageNo < MAX_PAGES);

    if ((index + 1) % 20 === 0 || index === activeQueries.length - 1) {
      console.log(
        `Ilerleme: ${index + 1}/${activeQueries.length} (global=${safeStart + index + 1}/${queryList.length}) | Ham sonuc: ${rawResultCount} | Eslesen: ${acceptedCount} | Esiz akaryakit: ${venueMap.size} | Istek: ${requestCount}`,
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

  const finalList = sortAkaryakit(venueMap.values());

  if (finalList.length === 0) {
    console.error('Kayit bulunamadi. akaryakit.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  saveDataset(existingList, finalList);
}

run();
