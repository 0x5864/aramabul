#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const GRID_REVIEW_PATH = path.join(DATA_DIR, 'istanbul-grid-review.json');
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const argSet = new Set(process.argv.slice(2));
const REPLACE_MODE = argSet.has('--replace');
const USE_ISTANBUL_GRID = argSet.has('--istanbul-grid');
const DRY_RUN = argSet.has('--dry-run');

const MAX_QUERIES = Number.parseInt(process.env.MAX_QUERIES || '0', 10);
const QUERY_DELAY_MS = Number.parseInt(process.env.QUERY_DELAY_MS || '250', 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PAGE_DELAY_MS || '2100', 10);

const GRID_ROWS = Math.max(1, Number.parseInt(process.env.GRID_ROWS || '13', 10));
const GRID_COLS = Math.max(1, Number.parseInt(process.env.GRID_COLS || '13', 10));
const GRID_DELAY_MS = Math.max(0, Number.parseInt(process.env.GRID_DELAY_MS || '650', 10));
const GRID_MAX_CELLS = Math.max(0, Number.parseInt(process.env.GRID_MAX_CELLS || '0', 10));
const GRID_MAX_RESULT_COUNT = Math.max(
  1,
  Math.min(20, Number.parseInt(process.env.GRID_MAX_RESULT_COUNT || '20', 10)),
);
const GRID_RADIUS_SCALE = Math.max(1, Number.parseFloat(process.env.GRID_RADIUS_SCALE || '1.28'));

const turkishCharMap = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

const ISTANBUL_POLYGON = [
  { latitude: 41.605, longitude: 27.93 },
  { latitude: 41.61, longitude: 28.18 },
  { latitude: 41.6, longitude: 28.58 },
  { latitude: 41.56, longitude: 28.83 },
  { latitude: 41.47, longitude: 29.01 },
  { latitude: 41.42, longitude: 29.2 },
  { latitude: 41.36, longitude: 29.46 },
  { latitude: 41.34, longitude: 29.83 },
  { latitude: 41.24, longitude: 29.97 },
  { latitude: 41.02, longitude: 30.03 },
  { latitude: 40.85, longitude: 29.84 },
  { latitude: 40.82, longitude: 29.46 },
  { latitude: 40.82, longitude: 29.15 },
  { latitude: 40.86, longitude: 28.89 },
  { latitude: 40.95, longitude: 28.58 },
  { latitude: 41.04, longitude: 28.32 },
  { latitude: 41.14, longitude: 28.11 },
  { latitude: 41.28, longitude: 27.96 },
];

const RESTAURANT_TYPES = new Set([
  'restaurant',
  'meal_takeaway',
  'meal_delivery',
  'food_court',
  'cafe',
  'bakery',
]);

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

function normalizeForCompare(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
    .replace(/\s+/g, ' ')
    .trim();
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

function venueKeyFromAny(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return '';
  }

  const sourcePlaceId = normalizeText(candidate.sourcePlaceId || candidate.place_id || candidate.id);
  if (sourcePlaceId) {
    return `place:${sourcePlaceId}`;
  }

  const city = normalizeText(candidate.city);
  const district = normalizeText(candidate.district || 'Merkez');
  const name = normalizeText(candidate.name || candidate.displayName?.text);

  if (!city || !name) {
    return '';
  }

  return `name:${city.toLocaleLowerCase('tr')}|${district.toLocaleLowerCase('tr')}|${name.toLocaleLowerCase('tr')}`;
}

function getPlaceName(place) {
  if (place?.displayName && typeof place.displayName.text === 'string') {
    return normalizeText(place.displayName.text);
  }

  return normalizeText(place?.name);
}

function getPlaceId(place) {
  return normalizeText(place?.id || place?.place_id);
}

function hasRestaurantSignal(types) {
  if (!Array.isArray(types) || types.length === 0) {
    return false;
  }

  for (const type of types) {
    const normalized = normalizeText(type);
    if (!normalized) {
      continue;
    }

    if (RESTAURANT_TYPES.has(normalized)) {
      return true;
    }

    if (normalized.endsWith('_restaurant')) {
      return true;
    }
  }

  return false;
}

function getPlaceCoordinates(place) {
  const latitude = Number(place?.location?.latitude);
  const longitude = Number(place?.location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function pointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const yi = polygon[i].latitude;
    const yj = polygon[j].latitude;
    const xi = polygon[i].longitude;
    const xj = polygon[j].longitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function looksLikeIstanbulAddress(address) {
  const text = normalizeText(address);
  if (!text) {
    return false;
  }

  return (
    /\/\s*(?:İstanbul|Istanbul)\.?\s*$/iu.test(text) ||
    /(?:,|\s)(?:İstanbul|Istanbul)\.?\s*$/iu.test(text)
  );
}

function hasIstanbulAddressComponent(place) {
  const components = Array.isArray(place?.addressComponents) ? place.addressComponents : [];

  for (const component of components) {
    const types = Array.isArray(component?.types) ? component.types : [];
    if (!types.length) {
      continue;
    }

    const hasCityType =
      types.includes('locality') ||
      types.includes('postal_town') ||
      types.includes('administrative_area_level_2') ||
      types.includes('administrative_area_level_1');

    if (!hasCityType) {
      continue;
    }

    const longText = normalizeForCompare(component?.longText);
    const shortText = normalizeForCompare(component?.shortText);

    if (longText === 'istanbul' || shortText === 'istanbul') {
      return true;
    }
  }

  return false;
}

function validateIstanbulGridPlace(place) {
  const reasons = [];

  const placeId = getPlaceId(place);
  if (!placeId) {
    reasons.push('missing_place_id');
  }

  if (!hasRestaurantSignal(place?.types)) {
    reasons.push('non_restaurant_type');
  }

  const coordinates = getPlaceCoordinates(place);
  if (!coordinates) {
    reasons.push('missing_location');
  } else if (!pointInPolygon(coordinates, ISTANBUL_POLYGON)) {
    reasons.push('outside_istanbul_polygon');
  }

  const cityIsIstanbul =
    hasIstanbulAddressComponent(place) ||
    looksLikeIstanbulAddress(place?.formattedAddress) ||
    looksLikeIstanbulAddress(place?.shortFormattedAddress);
  if (!cityIsIstanbul) {
    reasons.push('city_not_istanbul');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    coordinates,
    placeId,
  };
}

function getBoundsFromPolygon(polygon) {
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  polygon.forEach((point) => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  });

  return { minLat, maxLat, minLng, maxLng };
}

function metersPerDegreeLongitude(latitude) {
  const latRadians = (latitude * Math.PI) / 180;
  return 111320 * Math.cos(latRadians);
}

function buildGridCells(rows, cols, polygon) {
  const bounds = getBoundsFromPolygon(polygon);
  const latStep = (bounds.maxLat - bounds.minLat) / rows;
  const lngStep = (bounds.maxLng - bounds.minLng) / cols;
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const centerLat = bounds.minLat + latStep * (row + 0.5);
      const centerLng = bounds.minLng + lngStep * (col + 0.5);

      const cellPoint = { latitude: centerLat, longitude: centerLng };
      if (!pointInPolygon(cellPoint, polygon)) {
        continue;
      }

      const latMeters = latStep * 111320;
      const lngMeters = lngStep * metersPerDegreeLongitude(centerLat);
      const radius = Math.max(300, Math.round((Math.max(latMeters, lngMeters) / 2) * GRID_RADIUS_SCALE));

      cells.push({
        id: `${row + 1}-${col + 1}`,
        centerLat,
        centerLng,
        radius,
      });
    }
  }

  return cells;
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

async function fetchNearbyRestaurants(cell) {
  const payload = {
    includedTypes: ['restaurant'],
    maxResultCount: GRID_MAX_RESULT_COUNT,
    languageCode: 'tr',
    regionCode: 'TR',
    locationRestriction: {
      circle: {
        center: {
          latitude: cell.centerLat,
          longitude: cell.centerLng,
        },
        radius: cell.radius,
      },
    },
    rankPreference: 'POPULARITY',
  };

  const response = await fetch(NEARBY_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.types,places.location,places.formattedAddress,places.shortFormattedAddress,places.addressComponents,places.rating,places.userRatingCount,places.priceLevel,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri',
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
    const key = venueKeyFromAny(item);
    if (!key) {
      return;
    }

    map.set(key, item);
  });

  return map;
}

function upsertVenue(venueMap, normalizedVenue) {
  if (!normalizedVenue || typeof normalizedVenue !== 'object') {
    return;
  }

  const key = venueKey(normalizedVenue);
  const previous = venueMap.get(key);

  if (previous && typeof previous === 'object') {
    venueMap.set(key, { ...previous, ...normalizedVenue });
    return;
  }

  venueMap.set(key, normalizedVenue);
}

function sortVenues(venues) {
  return [...venues].sort((left, right) => {
    const leftCity = normalizeText(left?.city);
    const rightCity = normalizeText(right?.city);
    const cityOrder = leftCity.localeCompare(rightCity, 'tr');
    if (cityOrder !== 0) return cityOrder;

    const leftDistrict = normalizeText(left?.district);
    const rightDistrict = normalizeText(right?.district);
    const districtOrder = leftDistrict.localeCompare(rightDistrict, 'tr');
    if (districtOrder !== 0) return districtOrder;

    return normalizeText(left?.name).localeCompare(normalizeText(right?.name), 'tr');
  });
}

function saveFinalDataset(existingList, finalVenues) {
  if (DRY_RUN) {
    console.log('Dry-run: venues.json dosyasina yazilmadi.');
    console.log(`Yazilacak kayit: ${finalVenues.length}`);
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

function mapPlaceToVenue(place, city, district, districts) {
  const placeAddress = normalizeText(place.formattedAddress || place.shortFormattedAddress);
  const resolvedDistrict = resolveDistrictFromAddress(city, district, placeAddress, districts);

  return sanitizeVenue({
    city,
    district: resolvedDistrict,
    name: getPlaceName(place),
    cuisine: inferCuisine(getPlaceName(place), place.types),
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    price_level: place.price_level,
    priceLevel: place.priceLevel,
    formattedAddress: placeAddress,
    shortFormattedAddress: place.shortFormattedAddress,
    nationalPhoneNumber: place.nationalPhoneNumber,
    internationalPhoneNumber: place.internationalPhoneNumber,
    websiteUri: place.websiteUri,
    place_id: place.place_id,
    id: place.id,
  });
}

async function runDistrictTextSearchMode(districts, existingList, venueMap) {
  const queryList = buildQueryList(districts);
  const queryLimit = Number.isFinite(MAX_QUERIES) && MAX_QUERIES > 0 ? MAX_QUERIES : queryList.length;
  const activeQueries = queryList.slice(0, queryLimit);

  console.log(`Toplam sorgu: ${queryList.length}`);
  console.log(`Calisacak sorgu: ${activeQueries.length}`);
  console.log(`Mod: ${REPLACE_MODE ? 'replace' : 'merge'}${DRY_RUN ? ' + dry-run' : ''}`);

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
        const normalized = mapPlaceToVenue(place, item.city, item.district, districts);
        if (!normalized) {
          return;
        }

        upsertVenue(venueMap, normalized);
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

  if (resultCount === 0) {
    console.error('Google API hic sonuc donmedi. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  const finalVenues = sortVenues(venueMap.values());

  if (finalVenues.length === 0) {
    console.error('Toplanan kayit bos. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  saveFinalDataset(existingList, finalVenues);
}

async function runIstanbulGridMode(districts, existingList, venueMap) {
  const cells = buildGridCells(GRID_ROWS, GRID_COLS, ISTANBUL_POLYGON);
  const activeCells = GRID_MAX_CELLS > 0 ? cells.slice(0, GRID_MAX_CELLS) : cells;

  if (activeCells.length === 0) {
    console.error('Grid hucreleri olusturulamadi. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  console.log(`Grid modu: Istanbul`);
  console.log(`Grid hucre: ${activeCells.length} (rows=${GRID_ROWS}, cols=${GRID_COLS})`);
  console.log(`Mod: ${REPLACE_MODE ? 'replace' : 'merge'}${DRY_RUN ? ' + dry-run' : ''}`);

  let requestCount = 0;
  let resultCount = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;
  const rejectionReasonCount = {};
  const reviewQueue = [];

  for (let index = 0; index < activeCells.length; index += 1) {
    const cell = activeCells[index];
    requestCount += 1;

    let payload;
    try {
      payload = await fetchNearbyRestaurants(cell);
    } catch (error) {
      console.warn(`Grid sorgu hatasi [${index + 1}/${activeCells.length}] hucre=${cell.id}: ${error.message}`);
      if (GRID_DELAY_MS > 0) {
        await sleep(GRID_DELAY_MS);
      }
      continue;
    }

    const places = Array.isArray(payload.places) ? payload.places : [];
    resultCount += places.length;

    places.forEach((place) => {
      const validation = validateIstanbulGridPlace(place);
      if (!validation.ok) {
        rejectedCount += 1;

        validation.reasons.forEach((reason) => {
          rejectionReasonCount[reason] = (rejectionReasonCount[reason] || 0) + 1;
        });

        reviewQueue.push({
          reasons: validation.reasons,
          placeId: validation.placeId,
          name: getPlaceName(place),
          formattedAddress: normalizeText(place.formattedAddress || place.shortFormattedAddress),
          types: Array.isArray(place.types) ? place.types : [],
          location: validation.coordinates,
          cellId: cell.id,
        });

        return;
      }

      const normalized = mapPlaceToVenue(place, 'İstanbul', 'Merkez', districts);
      if (!normalized) {
        return;
      }

      acceptedCount += 1;
      upsertVenue(venueMap, normalized);
    });

    if ((index + 1) % 10 === 0 || index === activeCells.length - 1) {
      console.log(
        `Ilerleme: ${index + 1}/${activeCells.length} | Ham sonuc: ${resultCount} | Kabul: ${acceptedCount} | Red: ${rejectedCount} | Esiz restoran: ${venueMap.size} | Istek: ${requestCount}`,
      );
    }

    if (GRID_DELAY_MS > 0) {
      await sleep(GRID_DELAY_MS);
    }
  }

  if (resultCount === 0) {
    console.error('Grid sorgularindan sonuc gelmedi. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  const finalVenues = sortVenues(venueMap.values());
  if (finalVenues.length === 0) {
    console.error('Toplanan kayit bos. venues.json guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  saveFinalDataset(existingList, finalVenues);

  const reviewPayload = {
    generatedAt: new Date().toISOString(),
    mode: 'istanbul-grid',
    grid: {
      rows: GRID_ROWS,
      cols: GRID_COLS,
      usedCells: activeCells.length,
      radiusScale: GRID_RADIUS_SCALE,
      maxResultCount: GRID_MAX_RESULT_COUNT,
    },
    stats: {
      requests: requestCount,
      rawResults: resultCount,
      accepted: acceptedCount,
      rejected: rejectedCount,
      uniqueVenues: finalVenues.length,
      rejectionReasonCount,
    },
    reviewQueue,
  };

  if (!DRY_RUN) {
    writeJson(GRID_REVIEW_PATH, reviewPayload);
    console.log(`Inceleme kuyruğu yazildi: ${GRID_REVIEW_PATH}`);
  } else {
    console.log('Dry-run: inceleme kuyrugu dosyasi yazilmadi.');
    console.log(`Inceleme kuyruğu kayit sayisi: ${reviewQueue.length}`);
  }
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

  if (USE_ISTANBUL_GRID) {
    await runIstanbulGridMode(districts, existingList, venueMap);
    return;
  }

  await runDistrictTextSearchMode(districts, existingList, venueMap);
}

run();
