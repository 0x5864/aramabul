#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'akaryakit.json');
const BACKUP_PATH = path.join(DATA_DIR, 'akaryakit.backup.json');

const SEARCH_URL = 'https://search-maps.yandex.ru/v1/';

const argSet = new Set(process.argv.slice(2));
const REPLACE_MODE = argSet.has('--replace');
const DRY_RUN = argSet.has('--dry-run');

const MAX_QUERIES = Number.parseInt(process.env.MAX_QUERIES || '0', 10);
const START_INDEX = Math.max(0, Number.parseInt(process.env.START_INDEX || '0', 10));
const QUERY_DELAY_MS = Number.parseInt(process.env.QUERY_DELAY_MS || '120', 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PAGE_DELAY_MS || '450', 10);
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || '4', 10));
const MAX_PAGES = Math.max(1, Number.parseInt(process.env.MAX_PAGES || '3', 10));
const PAGE_SIZE = Math.max(1, Math.min(50, Number.parseInt(process.env.PAGE_SIZE || '50', 10)));
const SAVE_EVERY = Math.max(0, Number.parseInt(process.env.SAVE_EVERY || '25', 10));

const SEARCH_TERMS = String(
  process.env.SEARCH_TERMS || 'akaryakit istasyonu,benzin istasyonu,petrol istasyonu,shell,opet,total,bp,lukoil',
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const CITY_FILTERS = String(process.env.CITY_FILTER || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => normalizeForCompare(item));

const DISTRICT_FILTERS = String(process.env.DISTRICT_FILTER || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => normalizeForCompare(item));

const turkishCharMap = {
  c: 'c',
  g: 'g',
  i: 'i',
  o: 'o',
  s: 's',
  u: 'u',
  ç: 'c',
  ğ: 'g',
  ı: 'i',
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
  if (process.env.YANDEX_MAPS_API_KEY) {
    return process.env.YANDEX_MAPS_API_KEY;
  }

  if (process.env.YANDEX_API_KEY) {
    return process.env.YANDEX_API_KEY;
  }

  const dotenvPaths = [path.join(ROOT, '.env.local'), path.join(ROOT, '.env')];
  for (const dotenvPath of dotenvPaths) {
    const values = readDotEnvFile(dotenvPath);
    if (values.YANDEX_MAPS_API_KEY) {
      return values.YANDEX_MAPS_API_KEY;
    }
    if (values.YANDEX_API_KEY) {
      return values.YANDEX_API_KEY;
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
    .replace(/[çğıiöşü]/g, (char) => turkishCharMap[char] || char)
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKeyPart(value) {
  return normalizeForCompare(value).replace(/[^a-z0-9]/g, '');
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
  if (!isAllUpper) {
    return cleaned;
  }

  return cleaned
    .split(/\s+/)
    .map((part) => {
      const lower = part.toLocaleLowerCase('tr');
      const head = lower.charAt(0).toLocaleUpperCase('tr');
      return `${head}${lower.slice(1)}`;
    })
    .join(' ');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

const FUEL_BRAND_KEYWORDS = [
  'shell',
  'opet',
  'total',
  'bp',
  'kadoil',
  'moil',
  'lukoil',
  'petrol ofisi',
  'turkiye petrolleri',
  'tp',
];

const FUEL_NAME_KEYWORDS = ['akaryakit', 'benzin', 'petrol', 'istasyon', 'gas station', 'fuel'];

function buildMapsSearchUrl(venue) {
  const mapsUrl = new URL('https://www.google.com/maps/search/');
  mapsUrl.searchParams.set('api', '1');
  mapsUrl.searchParams.set(
    'query',
    [venue.name, venue.address, venue.district, venue.city]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(' '),
  );
  return mapsUrl.toString();
}

function extractCompanyMeta(feature) {
  const properties = feature && typeof feature === 'object' ? feature.properties : {};
  const company = properties && typeof properties === 'object' ? properties.CompanyMetaData : {};
  return company && typeof company === 'object' ? company : {};
}

function looksLikeFuelStation(feature) {
  const properties = feature && typeof feature === 'object' ? feature.properties : {};
  const company = extractCompanyMeta(feature);

  const categories = Array.isArray(company.Categories)
    ? company.Categories
        .map((item) => normalizeForCompare((item && item.name) || item))
        .filter(Boolean)
    : [];

  const searchable = normalizeForCompare(
    [
      properties.name,
      properties.description,
      company.name,
      company.address,
      company.url,
      categories.join(' '),
    ]
      .map((value) => normalizeText(value))
      .join(' '),
  );

  if (!searchable) {
    return false;
  }

  if (FUEL_NAME_KEYWORDS.some((keyword) => searchable.includes(keyword))) {
    return true;
  }

  return FUEL_BRAND_KEYWORDS.some((keyword) => searchable.includes(keyword));
}

function getFeatureId(feature) {
  const company = extractCompanyMeta(feature);
  const featureId = normalizeText(company.id || company.oid || company.uuid);

  if (featureId) {
    return featureId;
  }

  const geometry = feature && feature.geometry && Array.isArray(feature.geometry.coordinates)
    ? feature.geometry.coordinates
    : [];
  const lon = Number(geometry[0]);
  const lat = Number(geometry[1]);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return `geo:${lat.toFixed(6)},${lon.toFixed(6)}`;
  }

  return '';
}

function mapFeatureToVenue(feature, queryMeta) {
  const properties = feature && typeof feature === 'object' ? feature.properties : {};
  const company = extractCompanyMeta(feature);

  const name = sanitizeName(normalizeText(company.name || properties.name));
  const address = normalizeText(company.address || properties.description);
  const sourcePlaceId = getFeatureId(feature);

  if (!name) {
    return null;
  }

  const venue = {
    city: queryMeta.city,
    district: queryMeta.district,
    name,
    category: 'Akaryakit',
    rating: null,
    userRatingCount: null,
    budget: '₺₺',
    address,
    phone: Array.isArray(company.Phones) ? normalizeText((company.Phones[0] && company.Phones[0].formatted) || '') : '',
    website: normalizeText(company.url),
    source: 'yandex_maps',
    sourcePlaceId,
    sourceTypes: Array.isArray(company.Categories)
      ? company.Categories.map((item) => normalizeText((item && item.name) || item)).filter(Boolean)
      : [],
  };

  venue.mapsUrl = buildMapsSearchUrl(venue);
  return venue;
}

function buildQueryList(districtMap, terms) {
  const list = [];

  Object.keys(districtMap).forEach((city) => {
    if (CITY_FILTERS.length > 0 && !CITY_FILTERS.includes(normalizeForCompare(city))) {
      return;
    }

    const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
    districts.forEach((district) => {
      if (DISTRICT_FILTERS.length > 0 && !DISTRICT_FILTERS.includes(normalizeForCompare(district))) {
        return;
      }

      terms.forEach((term) => {
        list.push({
          city,
          district,
          term,
          query: `${district} ${city} ${term}`,
        });
      });
    });
  });

  return list;
}

async function fetchYandexSearch(query, skip) {
  let attempt = 0;

  while (attempt < RETRY_LIMIT) {
    attempt += 1;

    const url = new URL(SEARCH_URL);
    url.searchParams.set('apikey', API_KEY);
    url.searchParams.set('text', query);
    url.searchParams.set('lang', 'tr_TR');
    url.searchParams.set('type', 'biz');
    url.searchParams.set('results', String(PAGE_SIZE));
    url.searchParams.set('skip', String(skip));

    let response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      if (attempt >= RETRY_LIMIT) {
        throw new Error(normalizeText(error && error.message) || 'Ag hatasi');
      }

      await sleep(500 * attempt);
      continue;
    }

    if (response.ok) {
      return response.json();
    }

    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload && payload.message) {
        message = normalizeText(payload.message);
      }
      if (payload && payload.error && payload.error.message) {
        message = normalizeText(payload.error.message);
      }
    } catch (_error) {
      // Keep status-based message.
    }

    if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
      throw new Error(message);
    }

    await sleep(700 * attempt);
  }

  throw new Error('Bilinmeyen hata');
}

function venueIdentityKey(venue) {
  if (!venue || typeof venue !== 'object') {
    return '';
  }

  const placeId = normalizeText(venue.sourcePlaceId);
  if (placeId) {
    return `pid:${placeId}`;
  }

  const city = normalizeKeyPart(venue.city);
  const district = normalizeKeyPart(venue.district);
  const name = normalizeKeyPart(venue.name);
  const address = normalizeKeyPart(venue.address);

  if (!city || !district || !name) {
    return '';
  }

  return `sig:${city}:${district}:${name}:${address}`;
}

function mergeInitialData(existingList) {
  const map = new Map();

  existingList.forEach((item) => {
    const key = venueIdentityKey(item);
    if (!key) {
      return;
    }

    map.set(key, item);
  });

  return map;
}

function upsertVenue(venueMap, venue) {
  const key = venueIdentityKey(venue);
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
    console.error('YANDEX_MAPS_API_KEY bulunamadi. Ornek: YANDEX_MAPS_API_KEY=... npm run fetch:akaryakit:yandex');
    process.exitCode = 1;
    return;
  }

  if (SEARCH_TERMS.length === 0) {
    console.error('SEARCH_TERMS bos olamaz.');
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
  if (CITY_FILTERS.length > 0) {
    console.log(`Sehir filtresi: ${CITY_FILTERS.join(', ')}`);
  }
  if (DISTRICT_FILTERS.length > 0) {
    console.log(`Ilce filtresi: ${DISTRICT_FILTERS.join(', ')}`);
  }
  console.log(`Mod: ${REPLACE_MODE ? 'replace' : 'merge'}${DRY_RUN ? ' + dry-run' : ''}`);

  let requestCount = 0;
  let rawResultCount = 0;
  let acceptedCount = 0;
  let failedCount = 0;

  for (let index = 0; index < activeQueries.length; index += 1) {
    const item = activeQueries[index];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      requestCount += 1;
      const skip = page * PAGE_SIZE;

      let payload;
      try {
        payload = await fetchYandexSearch(item.query, skip);
      } catch (error) {
        failedCount += 1;
        console.warn(`Sorgu hatasi [${index + 1}/${activeQueries.length}] ${item.query}: ${error.message}`);
        break;
      }

      const features = Array.isArray(payload && payload.features) ? payload.features : [];
      rawResultCount += features.length;

      features.forEach((feature) => {
        if (!looksLikeFuelStation(feature)) {
          return;
        }

        const mapped = mapFeatureToVenue(feature, item);
        if (!mapped) {
          return;
        }

        acceptedCount += 1;
        upsertVenue(venueMap, mapped);
      });

      if (features.length < PAGE_SIZE) {
        break;
      }

      if (page + 1 < MAX_PAGES && PAGE_DELAY_MS > 0) {
        await sleep(PAGE_DELAY_MS);
      }
    }

    if ((index + 1) % 20 === 0 || index === activeQueries.length - 1) {
      console.log(
        `Ilerleme: ${index + 1}/${activeQueries.length} (global=${safeStart + index + 1}/${queryList.length}) | Ham sonuc: ${rawResultCount} | Eslesen: ${acceptedCount} | Esiz akaryakit: ${venueMap.size} | Istek: ${requestCount} | Hata: ${failedCount}`,
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
