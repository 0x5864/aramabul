#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.backup.json');
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

const MAX_CITIES = Number.parseInt(process.env.MAX_CITIES || '0', 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.REQUEST_DELAY_MS || '350', 10);
const RETRY_DELAY_MS = Number.parseInt(process.env.RETRY_DELAY_MS || '1800', 10);
const MAX_RETRIES = Number.parseInt(process.env.MAX_RETRIES || '3', 10);

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

function normalizeCuisine(value) {
  const cleaned = normalizeText(value);

  if (!cleaned) {
    return 'Restoran';
  }

  const first = cleaned.split(/[;,]/)[0].trim();
  if (!first) {
    return 'Restoran';
  }

  const normalized = first
    .replace(/_/g, ' ')
    .toLocaleLowerCase('tr')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toLocaleUpperCase('tr') + word.slice(1))
    .join(' ');
}

function normalizeBudget(priceLevel) {
  const cleaned = normalizeText(priceLevel).toLocaleLowerCase('tr');

  if (!cleaned) {
    return '₺₺';
  }

  if (['1', 'low', 'cheap'].includes(cleaned)) return '₺';
  if (['2', 'medium', 'moderate'].includes(cleaned)) return '₺₺';
  if (['3', 'high', 'expensive'].includes(cleaned)) return '₺₺₺';
  if (['4', 'very_high', 'very expensive'].includes(cleaned)) return '₺₺₺₺';

  return '₺₺';
}

function normalizeRating(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 4;
  }

  return Math.min(5, Math.max(0, numeric));
}

function inferDistrict(tags) {
  const candidates = [
    tags['addr:district'],
    tags['addr:suburb'],
    tags['is_in:district'],
    tags['addr:quarter'],
    tags['addr:neighbourhood'],
  ];

  for (const candidate of candidates) {
    const text = normalizeText(candidate);
    if (text) {
      return text;
    }
  }

  return 'Merkez';
}

function venueKey(venue) {
  if (venue.sourceRef) {
    return `${venue.sourceType}:${venue.sourceRef}`;
  }

  return `${venue.city.toLocaleLowerCase('tr')}|${venue.district.toLocaleLowerCase('tr')}|${venue.name.toLocaleLowerCase('tr')}`;
}

function toVenue(city, element) {
  if (!element || typeof element !== 'object') {
    return null;
  }

  const tags = element.tags && typeof element.tags === 'object' ? element.tags : {};
  const name = normalizeText(tags.name);

  if (!name) {
    return null;
  }

  return {
    city,
    district: inferDistrict(tags),
    name,
    cuisine: normalizeCuisine(tags.cuisine),
    rating: normalizeRating(tags.rating || tags['stars']),
    budget: normalizeBudget(tags['price:level']),
    source: 'openstreetmap',
    sourceType: element.type || '',
    sourceRef: String(element.id || ''),
  };
}

function buildQuery(cityName) {
  return [
    '[out:json][timeout:220];',
    `area["name"="${cityName}"]["boundary"="administrative"]["admin_level"="4"]->.a;`,
    '(',
    '  node["amenity"="restaurant"](area.a);',
    '  way["amenity"="restaurant"](area.a);',
    '  relation["amenity"="restaurant"](area.a);',
    ');',
    'out center tags;',
  ].join('\n');
}

async function fetchCityRestaurants(cityName) {
  const query = buildQuery(cityName);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[(attempt - 1) % OVERPASS_ENDPOINTS.length];

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json',
        },
        body: query,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const elements = Array.isArray(payload.elements) ? payload.elements : [];
      return elements;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.warn(`${cityName}: sorgu basarisiz (${error.message})`);
        return [];
      }

      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return [];
}

async function run() {
  const districtMap = readJson(DISTRICTS_PATH, {});

  if (!districtMap || typeof districtMap !== 'object' || Array.isArray(districtMap)) {
    console.error('districts.json okunamadi.');
    process.exitCode = 1;
    return;
  }

  const cities = Object.keys(districtMap).sort((left, right) => left.localeCompare(right, 'tr'));
  const selectedCities = Number.isFinite(MAX_CITIES) && MAX_CITIES > 0 ? cities.slice(0, MAX_CITIES) : cities;

  const existing = readJson(VENUES_PATH, []);
  if (Array.isArray(existing) && existing.length > 0) {
    writeJson(BACKUP_PATH, existing);
    console.log(`Yedek alindi: ${BACKUP_PATH}`);
  }

  const venueMap = new Map();
  let totalRaw = 0;

  console.log(`Il sayisi: ${selectedCities.length}`);

  for (let index = 0; index < selectedCities.length; index += 1) {
    const city = selectedCities[index];
    const elements = await fetchCityRestaurants(city);
    totalRaw += elements.length;

    elements.forEach((element) => {
      const venue = toVenue(city, element);
      if (!venue) {
        return;
      }

      venueMap.set(venueKey(venue), venue);
    });

    console.log(
      `[${index + 1}/${selectedCities.length}] ${city}: ham=${elements.length}, birikimli_esiz=${venueMap.size}`,
    );

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const finalVenues = [...venueMap.values()].sort((left, right) => {
    const cityOrder = left.city.localeCompare(right.city, 'tr');
    if (cityOrder !== 0) return cityOrder;

    const districtOrder = left.district.localeCompare(right.district, 'tr');
    if (districtOrder !== 0) return districtOrder;

    return left.name.localeCompare(right.name, 'tr');
  });

  if (finalVenues.length === 0) {
    console.error('Hic restoran bulunamadi. venues.json degistirilmedi.');
    process.exitCode = 1;
    return;
  }

  writeJson(VENUES_PATH, finalVenues);

  console.log('Tamamlandi.');
  console.log(`Ham toplam oge: ${totalRaw}`);
  console.log(`Esiz restoran: ${finalVenues.length}`);
  console.log(`Yazildi: ${VENUES_PATH}`);
}

run();
