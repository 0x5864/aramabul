#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ANDROID_DATA_DIR = path.join(ROOT, 'android_app', 'assets', 'web', 'data');

const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const RESTAURANT_DATA_PATH = path.join(DATA_DIR, 'keyif-restoran.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'keyif-pub-bar.json');
const ANDROID_OUTPUT_PATH = path.join(ANDROID_DATA_DIR, 'keyif-pub-bar.json');
const BACKUP_PATH = path.join(DATA_DIR, 'keyif-pub-bar.backup.json');

const MAP_REGION_PATH = process.env.MAP_REGION_PATH || '983/turkey';
const MAP_LL = process.env.MAP_LL || '35.2433,38.9637';
const MAP_ZOOM = process.env.MAP_ZOOM || '5.5';

const START_INDEX = Math.max(0, Number.parseInt(process.env.START_INDEX || '0', 10));
const MAX_QUERIES = Math.max(0, Number.parseInt(process.env.MAX_QUERIES || '0', 10));
const QUERY_DELAY_MS = Math.max(0, Number.parseInt(process.env.QUERY_DELAY_MS || '120', 10));
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || '3', 10));
const RETRY_DELAY_MS = Math.max(100, Number.parseInt(process.env.RETRY_DELAY_MS || '500', 10));

const SEARCH_TERMS = String(process.env.SEARCH_TERMS || 'bar pub,pub,bar')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const CITY_FILTERS = String(process.env.CITY_FILTER || '')
  .split(',')
  .map((value) => normalizeForCompare(value))
  .filter(Boolean);

const DISTRICT_FILTERS = String(process.env.DISTRICT_FILTER || '')
  .split(',')
  .map((value) => normalizeForCompare(value))
  .filter(Boolean);

const EXCLUDE_RESTAURANT_CATEGORY = String(process.env.EXCLUDE_RESTAURANT_CATEGORY || '1') !== '0';
const EXCLUDE_RESTAURANT_OVERLAP = String(process.env.EXCLUDE_RESTAURANT_OVERLAP || '1') !== '0';

const TR_REPLACE_MAP = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

function readJson(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => TR_REPLACE_MAP[char] || char);
}

function normalizeKeyPart(value) {
  return normalizeForCompare(value).replace(/[^a-z0-9]/g, '');
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10) || 0))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16) || 0));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePostalCode(address) {
  const match = normalizeText(address).match(/\b\d{5}\b/);
  return match ? match[0] : '';
}

function parseNeighborhood(address) {
  const source = normalizeText(address);
  if (!source) {
    return '';
  }

  const match = source.match(/([^,]{2,60}\b(?:Mah\.|Mahallesi))/i);
  return match ? normalizeText(match[1]) : '';
}

function buildCityDistrictLookup(districtMap) {
  const entries = Object.entries(districtMap || {});
  const lookup = new Map();

  entries.forEach(([city, districts]) => {
    const districtList = Array.isArray(districts)
      ? [...districts].map((district) => normalizeText(district)).filter(Boolean)
      : [];

    lookup.set(normalizeForCompare(city), {
      city: normalizeText(city),
      districts: districtList,
      normalizedDistricts: districtList.map((district) => normalizeForCompare(district)),
    });
  });

  return lookup;
}

function buildQueryList(districtMap) {
  const list = [];

  Object.keys(districtMap).forEach((city) => {
    const cityName = normalizeText(city);
    const cityKey = normalizeForCompare(cityName);
    if (CITY_FILTERS.length > 0 && !CITY_FILTERS.includes(cityKey)) {
      return;
    }

    const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
    districts.forEach((district) => {
      const districtName = normalizeText(district);
      const districtKey = normalizeForCompare(districtName);
      if (DISTRICT_FILTERS.length > 0 && !DISTRICT_FILTERS.includes(districtKey)) {
        return;
      }

      SEARCH_TERMS.forEach((term) => {
        list.push({
          city: cityName,
          district: districtName,
          term,
          query: `${districtName} ${cityName} ${term}`,
        });
      });
    });
  });

  return list;
}

function buildSearchUrl(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://yandex.com.tr/maps/${MAP_REGION_PATH}/search/${encodedQuery}/?ll=${encodeURIComponent(MAP_LL)}&z=${encodeURIComponent(MAP_ZOOM)}`;
}

async function fetchSearchHtml(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_LIMIT) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError || new Error('Yandex sayfasi alinamadi');
}

function parseStateFromHtml(html) {
  const match = String(html || '').match(/<script type="application\/json" class="state-view">([\s\S]*?)<\/script>/i);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (_error) {
    return null;
  }
}

function extractResultItems(state) {
  const results = state && state.stack && state.stack[0] && state.stack[0].results;
  if (!results || typeof results !== 'object') {
    return { items: [], totalResultCount: 0, pageCount: 0, resultsCount: 0 };
  }

  return {
    items: Array.isArray(results.items) ? results.items : [],
    totalResultCount: Number(results.totalResultCount) || 0,
    pageCount: Number(results.pageCount) || 0,
    resultsCount: Number(results.resultsCount) || 0,
  };
}

function toCategoryMeta(item) {
  const categories = Array.isArray(item && item.categories) ? item.categories : [];
  return categories.map((category) => ({
    name: normalizeText(category && category.name),
    className: normalizeForCompare(category && category.class),
    seoname: normalizeForCompare(category && category.seoname),
  }));
}

function hasBarOrPubCategory(categoryMeta) {
  return categoryMeta.some((category) => {
    const name = normalizeForCompare(category.name);
    return (
      category.className === 'bars'
      || category.seoname.includes('bar')
      || category.seoname.includes('pub')
      || name.includes('bar')
      || name.includes('pub')
    );
  });
}

function hasRestaurantCategory(categoryMeta) {
  return categoryMeta.some((category) => {
    const name = normalizeForCompare(category.name);
    return (
      category.className === 'restaurants'
      || category.seoname.includes('restaurant')
      || name.includes('restoran')
      || name.includes('restaurant')
      || name.includes('lokanta')
    );
  });
}

function buildYandexOrgUrl(item, lon, lat) {
  const id = normalizeText(item && item.id);
  const seoname = normalizeText(item && item.seoname);
  if (id && seoname) {
    return `https://yandex.com.tr/maps/org/${encodeURIComponent(seoname)}/${encodeURIComponent(id)}/`;
  }
  if (id) {
    return `https://yandex.com.tr/maps/?oid=${encodeURIComponent(id)}`;
  }
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return `https://yandex.com.tr/maps/?ll=${encodeURIComponent(`${lon},${lat}`)}&z=17`;
  }
  return '';
}

function detectCity(item, queryCity, cityDistrictLookup) {
  const regionCity = normalizeText(item && item.region && item.region.names && item.region.names.nominative);
  if (regionCity) {
    const regionKey = normalizeForCompare(regionCity);
    if (cityDistrictLookup.has(regionKey)) {
      return cityDistrictLookup.get(regionKey).city;
    }
  }

  return queryCity;
}

function detectDistrict(item, fallbackDistrict, city, cityDistrictLookup) {
  const cityEntry = cityDistrictLookup.get(normalizeForCompare(city));
  const cityDistricts = cityEntry ? cityEntry.districts : [];
  const normalizedCityDistricts = cityEntry ? cityEntry.normalizedDistricts : [];

  const area = normalizeText(item && item.compositeAddress && item.compositeAddress.area);
  if (area) {
    const areaKey = normalizeForCompare(area);
    const exactIndex = normalizedCityDistricts.indexOf(areaKey);
    if (exactIndex >= 0) {
      return cityDistricts[exactIndex];
    }
  }

  const address = normalizeForCompare(item && (item.address || item.fullAddress));
  if (address && cityDistricts.length > 0) {
    for (let index = 0; index < cityDistricts.length; index += 1) {
      if (address.includes(normalizedCityDistricts[index])) {
        return cityDistricts[index];
      }
    }
  }

  return fallbackDistrict || area || 'Merkez';
}

function mapItemToVenue(item, queryMeta, cityDistrictLookup) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const title = normalizeText(decodeHtmlEntities(item.title));
  if (!title) {
    return null;
  }

  const categoryMeta = toCategoryMeta(item);
  const hasBarPub = hasBarOrPubCategory(categoryMeta);
  const hasRestaurant = hasRestaurantCategory(categoryMeta);
  if (!hasBarPub) {
    return null;
  }
  if (EXCLUDE_RESTAURANT_CATEGORY && hasRestaurant) {
    return null;
  }

  const city = detectCity(item, queryMeta.city, cityDistrictLookup);
  const district = detectDistrict(item, queryMeta.district, city, cityDistrictLookup);

  const coordinates = Array.isArray(item.coordinates) ? item.coordinates : [];
  const lon = Number(coordinates[0]);
  const lat = Number(coordinates[1]);

  const address = normalizeText(decodeHtmlEntities(item.fullAddress || item.address));
  const sourcePlaceId = normalizeText(item.id || item.uri);
  const website = Array.isArray(item.urls) ? normalizeText(item.urls[0]) : '';
  const phone = Array.isArray(item.phones) ? normalizeText(item.phones[0] && item.phones[0].number) : '';
  const rating = Number(item.ratingData && item.ratingData.ratingValue);
  const userRatingCount = Number(item.ratingData && item.ratingData.ratingCount);

  return {
    city,
    district,
    name: title,
    cuisine: 'Pub&Bar',
    rating: Number.isFinite(rating) ? Math.round(rating * 10) / 10 : null,
    userRatingCount: Number.isFinite(userRatingCount) ? userRatingCount : null,
    budget: '₺₺',
    address,
    phone,
    source: 'yandex_maps',
    sourcePlaceId,
    placeId: sourcePlaceId,
    website,
    mapsUrl: buildYandexOrgUrl(item, lon, lat),
    postalCode: parsePostalCode(address),
    neighborhood: parseNeighborhood(address),
    sourceTypes: categoryMeta.map((category) => category.name).filter(Boolean),
    sourceCategoryClasses: categoryMeta.map((category) => category.className).filter(Boolean),
    searchQuery: queryMeta.query,
  };
}

function venueIdentityKey(venue) {
  const placeId = normalizeText(venue.sourcePlaceId || venue.placeId);
  if (placeId) {
    return `pid:${placeId}`;
  }

  const city = normalizeKeyPart(venue.city);
  const district = normalizeKeyPart(venue.district);
  const name = normalizeKeyPart(venue.name);
  const address = normalizeKeyPart(venue.address);
  return `sig:${city}:${district}:${name}:${address}`;
}

function buildRestaurantOverlapSet() {
  if (!EXCLUDE_RESTAURANT_OVERLAP) {
    return new Set();
  }

  const restaurantData = readJson(RESTAURANT_DATA_PATH, []);
  const list = Array.isArray(restaurantData) ? restaurantData : [];
  const set = new Set();

  list.forEach((item) => {
    const key = `${normalizeKeyPart(item.city)}:${normalizeKeyPart(item.district)}:${normalizeKeyPart(item.name)}`;
    if (key.endsWith('::')) {
      return;
    }
    set.add(key);
  });

  return set;
}

function isRestaurantOverlap(venue, restaurantSet) {
  if (!restaurantSet || restaurantSet.size === 0) {
    return false;
  }

  const key = `${normalizeKeyPart(venue.city)}:${normalizeKeyPart(venue.district)}:${normalizeKeyPart(venue.name)}`;
  return restaurantSet.has(key);
}

function sortVenues(list) {
  return [...list].sort((left, right) => {
    const cityOrder = normalizeText(left.city).localeCompare(normalizeText(right.city), 'tr');
    if (cityOrder !== 0) return cityOrder;

    const districtOrder = normalizeText(left.district).localeCompare(normalizeText(right.district), 'tr');
    if (districtOrder !== 0) return districtOrder;

    return normalizeText(left.name).localeCompare(normalizeText(right.name), 'tr');
  });
}

async function run() {
  const districtMap = readJson(DISTRICTS_PATH, {});
  if (!districtMap || typeof districtMap !== 'object' || Array.isArray(districtMap)) {
    console.error('districts.json okunamadi veya format hatali.');
    process.exitCode = 1;
    return;
  }

  const cityDistrictLookup = buildCityDistrictLookup(districtMap);
  const queryList = buildQueryList(districtMap);
  if (queryList.length === 0) {
    console.error('Sorgu listesi bos. CITY_FILTER veya DISTRICT_FILTER kontrol edin.');
    process.exitCode = 1;
    return;
  }

  const safeStart = Math.min(START_INDEX, queryList.length);
  const queryLimit = MAX_QUERIES > 0 ? MAX_QUERIES : queryList.length;
  const safeEnd = Math.min(queryList.length, safeStart + queryLimit);
  const activeQueries = queryList.slice(safeStart, safeEnd);

  const previousData = readJson(OUTPUT_PATH, []);
  const previousList = Array.isArray(previousData) ? previousData : [];
  const restaurantOverlapSet = buildRestaurantOverlapSet();
  const venueMap = new Map();

  let rawItemCount = 0;
  let acceptedCount = 0;
  let filteredRestaurantCategoryCount = 0;
  let filteredRestaurantOverlapCount = 0;
  let parseErrorCount = 0;
  let requestErrorCount = 0;

  console.log(`Toplam sorgu: ${queryList.length}`);
  console.log(`Baslangic indeksi: ${safeStart}`);
  console.log(`Calisacak sorgu: ${activeQueries.length}`);
  console.log(`Arama terimleri: ${SEARCH_TERMS.join(', ')}`);
  console.log(`Restoran kategori filtresi: ${EXCLUDE_RESTAURANT_CATEGORY ? 'acik' : 'kapali'}`);
  console.log(`Restoran dataset overlap filtresi: ${EXCLUDE_RESTAURANT_OVERLAP ? 'acik' : 'kapali'}`);

  for (let index = 0; index < activeQueries.length; index += 1) {
    const queryMeta = activeQueries[index];
    const url = buildSearchUrl(queryMeta.query);

    let html;
    try {
      html = await fetchSearchHtml(url);
    } catch (error) {
      requestErrorCount += 1;
      console.warn(`Sorgu hatasi [${index + 1}/${activeQueries.length}] ${queryMeta.query}: ${error.message}`);
      continue;
    }

    const state = parseStateFromHtml(html);
    if (!state) {
      parseErrorCount += 1;
      console.warn(`State parse hatasi [${index + 1}/${activeQueries.length}] ${queryMeta.query}`);
      continue;
    }

    const { items } = extractResultItems(state);
    rawItemCount += items.length;

    items.forEach((item) => {
      const categoryMeta = toCategoryMeta(item);
      const hasBarPub = hasBarOrPubCategory(categoryMeta);
      const hasRestaurant = hasRestaurantCategory(categoryMeta);
      if (!hasBarPub) {
        return;
      }
      if (EXCLUDE_RESTAURANT_CATEGORY && hasRestaurant) {
        filteredRestaurantCategoryCount += 1;
        return;
      }

      const mapped = mapItemToVenue(item, queryMeta, cityDistrictLookup);
      if (!mapped) {
        return;
      }

      if (isRestaurantOverlap(mapped, restaurantOverlapSet)) {
        filteredRestaurantOverlapCount += 1;
        return;
      }

      acceptedCount += 1;
      const key = venueIdentityKey(mapped);
      const previous = venueMap.get(key);
      if (previous) {
        venueMap.set(key, { ...previous, ...mapped });
      } else {
        venueMap.set(key, mapped);
      }
    });

    if ((index + 1) % 50 === 0 || index === activeQueries.length - 1) {
      console.log(
        `Ilerleme: ${index + 1}/${activeQueries.length} | Ham: ${rawItemCount} | Kabul: ${acceptedCount} | Esiz: ${venueMap.size}`,
      );
    }

    if (QUERY_DELAY_MS > 0) {
      await sleep(QUERY_DELAY_MS);
    }
  }

  const finalList = sortVenues(venueMap.values());
  if (finalList.length === 0) {
    console.error('Uygun kayit bulunamadi. Dosya guncellenmedi.');
    process.exitCode = 1;
    return;
  }

  if (previousList.length > 0) {
    writeJson(BACKUP_PATH, previousList);
    console.log(`Yedek dosya yazildi: ${BACKUP_PATH}`);
  }

  writeJson(OUTPUT_PATH, finalList);
  writeJson(ANDROID_OUTPUT_PATH, finalList);

  console.log(`Ham sonuc: ${rawItemCount}`);
  console.log(`Kabul edilen (filtre oncesi): ${acceptedCount}`);
  console.log(`Restoran kategori filtresi ile elenen: ${filteredRestaurantCategoryCount}`);
  console.log(`Restoran dataset overlap filtresi ile elenen: ${filteredRestaurantOverlapCount}`);
  console.log(`Parse hatasi: ${parseErrorCount}`);
  console.log(`Istek hatasi: ${requestErrorCount}`);
  console.log(`Yazilan kayit (esiz): ${finalList.length}`);
  console.log(`Dosya: ${OUTPUT_PATH}`);
  console.log(`Dosya: ${ANDROID_OUTPUT_PATH}`);
}

run().catch((error) => {
  console.error(`fetch-keyif-pub-bar-yandex-turkiye hata: ${error.message}`);
  process.exitCode = 1;
});
