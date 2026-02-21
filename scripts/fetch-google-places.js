#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const argSet = new Set(process.argv.slice(2));
const REPLACE_MODE = argSet.has('--replace');
const MAX_QUERIES = Number.parseInt(process.env.MAX_QUERIES || '0', 10);
const QUERY_DELAY_MS = Number.parseInt(process.env.QUERY_DELAY_MS || '250', 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PAGE_DELAY_MS || '2100', 10);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || '').trim();
}

function toTitleCaseTr(value) {
  return String(value || '')
    .split(/([\s\-\/()&,."]+)/)
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
      const letter = lower[letterIndex];
      const upperFirst = letter.toLocaleUpperCase('tr');

      return `${lower.slice(0, letterIndex)}${upperFirst}${lower.slice(letterIndex + 1)}`;
    })
    .join('');
}

function sanitizeVenueName(value) {
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

function normalizeForCompare(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char);
}

function foldForPath(value) {
  return normalizeForCompare(value).replace(/\s+/g, '').replace(/[^a-z0-9/]/g, '');
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

function inferCuisine(name, types) {
  const lowerName = normalizeText(name).toLocaleLowerCase('tr');
  const typeSet = new Set(Array.isArray(types) ? types : []);

  const keywordMap = [
    ['kebap', 'Kebap'],
    ['doner', 'Döner'],
    ['döner', 'Döner'],
    ['lahmacun', 'Lahmacun'],
    ['pide', 'Pide'],
    ['balik', 'Deniz Ürünleri'],
    ['balık', 'Deniz Ürünleri'],
    ['kahve', 'Kafe'],
    ['cafe', 'Kafe'],
    ['baklava', 'Tatlı'],
    ['tatli', 'Tatlı'],
    ['tatlı', 'Tatlı'],
    ['pizza', 'Pizza'],
    ['burger', 'Burger'],
    ['vegan', 'Vegan'],
  ];

  for (const [needle, cuisine] of keywordMap) {
    if (lowerName.includes(needle)) {
      return cuisine;
    }
  }

  if (typeSet.has('cafe')) return 'Kafe';
  if (typeSet.has('bakery')) return 'Fırın';
  if (typeSet.has('bar')) return 'Bar';
  return 'Restoran';
}

function normalizeRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 4;
  }
  return Math.min(5, Math.max(0, numeric));
}

function sanitizeVenue(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const city = normalizeText(candidate.city);
  const district = normalizeText(candidate.district || 'Merkez');
  const name = sanitizeVenueName(candidate.name);
  const cuisine = normalizeText(candidate.cuisine || 'Restoran');

  if (!city || !name) {
    return null;
  }

  return {
    city,
    district,
    name,
    cuisine,
    rating: normalizeRating(candidate.rating),
    userRatingCount: Number.isFinite(Number(candidate.userRatingCount))
      ? Math.max(0, Math.round(Number(candidate.userRatingCount)))
      : null,
    budget: budgetFromPriceLevel(candidate.priceLevel ?? candidate.price_level),
    address: normalizeText(candidate.formattedAddress || candidate.shortFormattedAddress),
    phone: normalizeText(candidate.nationalPhoneNumber || candidate.internationalPhoneNumber),
    website: normalizeText(candidate.websiteUri || candidate.website),
    email: normalizeText(candidate.email || candidate.emailAddress || candidate.contact?.email),
    source: 'google_places',
    sourcePlaceId: normalizeText(candidate.place_id || candidate.id),
  };
}

function venueKey(venue) {
  if (venue.sourcePlaceId) {
    return `place:${venue.sourcePlaceId}`;
  }
  return `name:${venue.city.toLocaleLowerCase('tr')}|${venue.district.toLocaleLowerCase('tr')}|${venue.name.toLocaleLowerCase('tr')}`;
}

async function fetchTextSearch(query, pageToken = '') {
  const payload = {
    textQuery: query,
    languageCode: 'tr',
    regionCode: 'TR',
    pageSize: 20,
  };

  if (pageToken) {
    payload.pageToken = pageToken;
  }

  const response = await fetch(TEXT_SEARCH_URL, {
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

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const errorPayload = await response.json();
      if (errorPayload && errorPayload.error && errorPayload.error.message) {
        message = errorPayload.error.message;
      }
    } catch (_error) {
      // Keep HTTP status message.
    }

    throw new Error(message);
  }

  return response.json();
}

function buildQueryList(districtMap) {
  const list = [];

  Object.entries(districtMap).forEach(([city, districts]) => {
    if (!Array.isArray(districts) || districts.length === 0) {
      list.push({ city, district: 'Merkez', query: `${city} restoran` });
      return;
    }

    districts.forEach((district) => {
      const districtName = normalizeText(district);
      if (!districtName) {
        return;
      }

      list.push({
        city,
        district: districtName,
        query: `${districtName} ${city} restoran`,
      });
    });
  });

  return list;
}

function mergeInitialData(existingVenues) {
  const map = new Map();

  existingVenues.forEach((item) => {
    const normalized = sanitizeVenue(item);
    if (!normalized) {
      return;
    }
    map.set(venueKey(normalized), normalized);
  });

  return map;
}

async function run() {
  if (!API_KEY) {
    console.error('PLACES_API_KEY bulunamadı. Ornek: PLACES_API_KEY=... node scripts/fetch-google-places.js');
    process.exitCode = 1;
    return;
  }

  const districts = readJson(DISTRICTS_PATH, {});
  if (!districts || typeof districts !== 'object' || Array.isArray(districts)) {
    console.error('districts.json okunamadı veya format hatalı.');
    process.exitCode = 1;
    return;
  }

  const existing = readJson(VENUES_PATH, []);
  const existingList = Array.isArray(existing) ? existing : [];
  const venueMap = mergeInitialData(REPLACE_MODE ? [] : existingList);

  const queryList = buildQueryList(districts);
  const queryLimit = Number.isFinite(MAX_QUERIES) && MAX_QUERIES > 0 ? MAX_QUERIES : queryList.length;
  const activeQueries = queryList.slice(0, queryLimit);

  console.log(`Toplam sorgu: ${queryList.length}`);
  console.log(`Calisacak sorgu: ${activeQueries.length}`);
  console.log(`Mod: ${REPLACE_MODE ? 'replace' : 'merge'}`);

  let requestCount = 0;
  let resultCount = 0;

  for (let index = 0; index < activeQueries.length; index += 1) {
    const item = activeQueries[index];
    let pageToken = '';
    let pageSafety = 0;

    do {
      pageSafety += 1;
      requestCount += 1;

      let payload;
      try {
        payload = await fetchTextSearch(item.query, pageToken);
      } catch (error) {
        console.warn(`Sorgu hatasi [${index + 1}/${activeQueries.length}] ${item.query}: ${error.message}`);
        break;
      }

      const results = Array.isArray(payload.places)
        ? payload.places
        : Array.isArray(payload.results)
          ? payload.results
          : [];

      results.forEach((place) => {
        const placeAddress = normalizeText(place.formattedAddress || place.shortFormattedAddress);
        const resolvedDistrict = resolveDistrictFromAddress(
          item.city,
          item.district,
          placeAddress,
          districts,
        );

        const normalized = sanitizeVenue({
          city: item.city,
          district: resolvedDistrict,
          name:
            (place.displayName && typeof place.displayName.text === 'string'
              ? place.displayName.text
              : place.name) || '',
          cuisine: inferCuisine(
            (place.displayName && typeof place.displayName.text === 'string'
              ? place.displayName.text
              : place.name) || '',
            place.types,
          ),
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          price_level: place.price_level,
          priceLevel: place.priceLevel,
          formattedAddress: placeAddress,
          shortFormattedAddress: place.shortFormattedAddress,
          nationalPhoneNumber: place.nationalPhoneNumber,
          internationalPhoneNumber: place.internationalPhoneNumber,
          place_id: place.place_id,
          id: place.id,
        });

        if (!normalized) {
          return;
        }

        venueMap.set(venueKey(normalized), normalized);
      });

      resultCount += results.length;
      pageToken = normalizeText(payload.nextPageToken || payload.next_page_token);

      if (pageToken) {
        await sleep(PAGE_DELAY_MS);
      }
    } while (pageToken && pageSafety < 3);

    if ((index + 1) % 20 === 0 || index === activeQueries.length - 1) {
      console.log(
        `Ilerleme: ${index + 1}/${activeQueries.length} | Toplam islenen sonuc: ${resultCount} | Esiz restoran: ${venueMap.size} | Istek: ${requestCount}`,
      );
    }

    if (QUERY_DELAY_MS > 0) {
      await sleep(QUERY_DELAY_MS);
    }
  }

  const finalVenues = [...venueMap.values()].sort((left, right) => {
    const cityOrder = left.city.localeCompare(right.city, 'tr');
    if (cityOrder !== 0) return cityOrder;

    const districtOrder = left.district.localeCompare(right.district, 'tr');
    if (districtOrder !== 0) return districtOrder;

    return left.name.localeCompare(right.name, 'tr');
  });

  if (resultCount === 0) {
    console.error('Google API hic sonuc donmedi. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  if (finalVenues.length === 0) {
    console.error('Toplanan kayit bos. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  if (existingList.length > 0) {
    const backupPath = path.join(DATA_DIR, 'venues.backup.json');
    writeJson(backupPath, existingList);
    console.log(`Yedek dosya yazildi: ${backupPath}`);
  }

  writeJson(VENUES_PATH, finalVenues);

  console.log('Tamamlandi.');
  console.log(`Yazilan kayit: ${finalVenues.length}`);
  console.log(`Dosya: ${VENUES_PATH}`);
}

run();
