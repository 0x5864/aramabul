#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.backup.json');

const DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places/';
const FIELD_MASK = [
  'id',
  'formattedAddress',
  'shortFormattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'editorialSummary',
  'reviews',
  'photos',
  'dineIn',
  'takeout',
  'delivery',
  'reservable',
  'outdoorSeating',
  'goodForGroups',
  'goodForChildren',
  'liveMusic',
  'menuForChildren',
  'servesBreakfast',
  'servesBrunch',
  'servesLunch',
  'servesDinner',
  'servesDessert',
  'servesCoffee',
  'servesVegetarianFood',
  'rating',
  'userRatingCount',
].join(',');

const MAX_DETAILS = Number.parseInt(process.env.MAX_DETAILS || '0', 10);
const START_INDEX = Number.parseInt(process.env.START_INDEX || '0', 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.REQUEST_DELAY_MS || '120', 10);
const SAVE_EVERY = Number.parseInt(process.env.SAVE_EVERY || '250', 10);
const RETRY_LIMIT = Number.parseInt(process.env.RETRY_LIMIT || '3', 10);
const ONLY_MISSING = process.env.ONLY_MISSING !== '0';
const OVERWRITE_EXISTING = process.env.OVERWRITE_EXISTING === '1';
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || '6', 10));
const PHOTO_REFERENCE_LIMIT = Math.max(1, Number.parseInt(process.env.PHOTO_REFERENCE_LIMIT || '8', 10));
const SYNC_RATING_FIELDS = process.env.SYNC_RATING_FIELDS !== '0';

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

function needsEnrichment(venue) {
  if (!venue || typeof venue !== 'object') {
    return false;
  }

  const placeId = normalizeText(venue.sourcePlaceId);
  if (!placeId) {
    return false;
  }

  if (!ONLY_MISSING) {
    return true;
  }

  const alreadyFetchedAt = normalizeText(venue.googleDetailsFetchedAt);
  if (alreadyFetchedAt) {
    return false;
  }

  const address = normalizeText(venue.address);
  const phone = normalizeText(venue.phone);
  const website = normalizeText(venue.website);
  const menuCapabilities = Array.isArray(venue.menuCapabilities) ? venue.menuCapabilities : [];
  const serviceCapabilities = Array.isArray(venue.serviceCapabilities) ? venue.serviceCapabilities : [];
  const atmosphereCapabilities = Array.isArray(venue.atmosphereCapabilities)
    ? venue.atmosphereCapabilities
    : [];
  const photoReferences = Array.isArray(venue.photoReferences) ? venue.photoReferences : [];
  const editorialSummary = normalizeText(venue.editorialSummary);

  return (
    !address ||
    !phone ||
    !website ||
    menuCapabilities.length === 0 ||
    serviceCapabilities.length === 0 ||
    atmosphereCapabilities.length === 0 ||
    photoReferences.length === 0 ||
    !editorialSummary
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

async function fetchPlaceDetails(placeId) {
  const encodedId = encodeURIComponent(placeId);
  const endpoint = `${DETAILS_BASE_URL}${encodedId}`;
  let attempt = 0;

  while (attempt < RETRY_LIMIT) {
    attempt += 1;

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': FIELD_MASK,
        },
      });
    } catch (error) {
      if (attempt >= RETRY_LIMIT) {
        return {
          ok: false,
          status: 599,
          error: normalizeText(error && error.message, 'Ağ hatası'),
        };
      }

      const backoffMs = 700 * attempt;
      await sleep(backoffMs);
      continue;
    }

    if (response.ok) {
      const payload = await response.json();
      return {
        ok: true,
        payload,
      };
    }

    let errorMessage = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload && payload.error && payload.error.message) {
        errorMessage = payload.error.message;
      }
    } catch (_error) {
      // Keep HTTP status.
    }

    if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
      return {
        ok: false,
        status: response.status,
        error: errorMessage,
      };
    }

    const backoffMs = 500 * attempt;
    await sleep(backoffMs);
  }

  return {
    ok: false,
    status: 500,
    error: 'Retry limiti asildi.',
  };
}

function normalizeDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      address: '',
      phone: '',
      website: '',
      email: '',
      mapsUrl: '',
      editorialSummary: '',
      rating: null,
      userRatingCount: null,
      reviewSnippets: [],
      photoReferences: [],
      menuCapabilities: [],
      serviceCapabilities: [],
      atmosphereCapabilities: [],
    };
  }

  const menuCapabilities = [];
  if (payload.servesBreakfast === true) menuCapabilities.push('Kahvaltı');
  if (payload.servesBrunch === true) menuCapabilities.push('Brunch');
  if (payload.servesLunch === true) menuCapabilities.push('Öğle yemeği');
  if (payload.servesDinner === true) menuCapabilities.push('Akşam yemeği');
  if (payload.servesDessert === true) menuCapabilities.push('Tatlı');
  if (payload.servesCoffee === true) menuCapabilities.push('Kahve');
  if (payload.servesVegetarianFood === true) menuCapabilities.push('Vejetaryen seçenek');
  if (payload.menuForChildren === true) menuCapabilities.push('Çocuk menüsü');

  const serviceCapabilities = [];
  if (payload.dineIn === true) serviceCapabilities.push('İç mekan servis');
  if (payload.takeout === true) serviceCapabilities.push('Paket servis');
  if (payload.delivery === true) serviceCapabilities.push('Teslimat');
  if (payload.reservable === true) serviceCapabilities.push('Rezervasyon');

  const atmosphereCapabilities = [];
  if (payload.outdoorSeating === true) atmosphereCapabilities.push('Dış mekan oturma');
  if (payload.goodForGroups === true) atmosphereCapabilities.push('Gruplar için uygun');
  if (payload.goodForChildren === true) atmosphereCapabilities.push('Çocuklar için uygun');
  if (payload.liveMusic === true) atmosphereCapabilities.push('Canlı müzik');

  const reviewSnippets = Array.isArray(payload.reviews)
    ? payload.reviews
        .map((review) =>
          normalizeText(
            (review && review.text && review.text.text) ||
              (review && review.originalText && review.originalText.text) ||
              '',
          ),
        )
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const photoReferences = Array.isArray(payload.photos)
    ? payload.photos
        .map((photo) => normalizeText(photo && photo.name))
        .filter(Boolean)
        .slice(0, PHOTO_REFERENCE_LIMIT)
    : [];

  return {
    address: normalizeText(payload.formattedAddress || payload.shortFormattedAddress),
    phone: normalizeText(payload.nationalPhoneNumber || payload.internationalPhoneNumber),
    website: normalizeText(payload.websiteUri),
    email: normalizeText(payload.email || payload.emailAddress || payload.contact?.email),
    mapsUrl: normalizeText(payload.googleMapsUri),
    editorialSummary: normalizeText(payload.editorialSummary && payload.editorialSummary.text),
    rating: Number.isFinite(Number(payload.rating)) ? Math.min(5, Math.max(0, Number(payload.rating))) : null,
    userRatingCount: Number.isFinite(Number(payload.userRatingCount))
      ? Math.max(0, Math.round(Number(payload.userRatingCount)))
      : null,
    reviewSnippets,
    photoReferences,
    menuCapabilities,
    serviceCapabilities,
    atmosphereCapabilities,
  };
}

function shouldWriteField(existingValue, nextValue) {
  const existing = normalizeText(existingValue);
  const next = normalizeText(nextValue);

  if (!next) {
    return false;
  }

  if (OVERWRITE_EXISTING) {
    return true;
  }

  return existing.length === 0;
}

function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => normalizeText(value)).filter(Boolean);
}

function shouldWriteArray(existingValue, nextValue) {
  const existing = normalizeArray(existingValue);
  const next = normalizeArray(nextValue);

  if (next.length === 0) {
    return false;
  }

  if (OVERWRITE_EXISTING) {
    return true;
  }

  return existing.length === 0;
}

function numericChanged(existingValue, nextValue) {
  const current = Number(existingValue);
  const hasCurrent = Number.isFinite(current);
  const hasNext = Number.isFinite(nextValue);

  if (!hasNext && !hasCurrent) {
    return false;
  }

  if (!hasNext && hasCurrent) {
    return true;
  }

  if (hasNext && !hasCurrent) {
    return true;
  }

  return current !== nextValue;
}

function buildPlaceIndex(venues) {
  const map = new Map();

  venues.forEach((venue, index) => {
    const placeId = normalizeText(venue && venue.sourcePlaceId);
    if (!placeId) {
      return;
    }

    if (!map.has(placeId)) {
      map.set(placeId, []);
    }

    map.get(placeId).push(index);
  });

  return map;
}

async function run() {
  if (!API_KEY) {
    console.error('PLACES_API_KEY bulunamadi. Ornek: PLACES_API_KEY=... node scripts/enrich-google-place-details.js');
    process.exitCode = 1;
    return;
  }

  const venues = readJson(VENUES_PATH, []);
  if (!Array.isArray(venues) || venues.length === 0) {
    console.error('venues.json okunamadi veya bos.');
    process.exitCode = 1;
    return;
  }

  const placeIndex = buildPlaceIndex(venues);
  const allTargetPlaceIds = [...placeIndex.keys()].filter((placeId) => {
    const indices = placeIndex.get(placeId);
    if (!indices || indices.length === 0) {
      return false;
    }

    return indices.some((index) => needsEnrichment(venues[index]));
  });

  const sliced = allTargetPlaceIds.slice(Math.max(0, START_INDEX));
  const activePlaceIds =
    Number.isFinite(MAX_DETAILS) && MAX_DETAILS > 0 ? sliced.slice(0, MAX_DETAILS) : sliced;

  console.log(`Toplam venue: ${venues.length}`);
  console.log(`Toplam placeId: ${placeIndex.size}`);
  console.log(`Zenginlestirilecek placeId: ${allTargetPlaceIds.length}`);
  console.log(`Calisacak placeId: ${activePlaceIds.length}`);

  if (activePlaceIds.length === 0) {
    console.log('Islenecek kayit bulunmadi.');
    return;
  }

  writeJson(BACKUP_PATH, venues);
  console.log(`Yedek dosya yazildi: ${BACKUP_PATH}`);

  let successCount = 0;
  let failureCount = 0;
  let updatedRows = 0;
  let processedCount = 0;
  let lastSavedProcessed = 0;
  let cursor = 0;
  const fetchedAtStamp = new Date().toISOString();

  function maybeSaveProgress(force = false) {
    const shouldSave =
      force ||
      processedCount - lastSavedProcessed >= SAVE_EVERY ||
      processedCount === activePlaceIds.length;

    if (!shouldSave) {
      return;
    }

    writeJson(VENUES_PATH, venues);
    lastSavedProcessed = processedCount;
    console.log(
      `Ilerleme: ${processedCount}/${activePlaceIds.length} | Basarili: ${successCount} | Hatali: ${failureCount} | Guncellenen satir: ${updatedRows}`,
    );
  }

  async function processPlace(placeId, index) {
    const result = await fetchPlaceDetails(placeId);

    if (!result.ok) {
      failureCount += 1;
      console.warn(
        `Hata [${index + 1}/${activePlaceIds.length}] ${placeId}: ${result.error} (status=${result.status})`,
      );
      processedCount += 1;
      maybeSaveProgress();
      return;
    }

    successCount += 1;

    const details = normalizeDetails(result.payload);
    const indices = placeIndex.get(placeId) || [];

    indices.forEach((venueIndex) => {
      const venue = venues[venueIndex];
      if (!venue || typeof venue !== 'object') {
        return;
      }

      let changed = false;

      if (shouldWriteField(venue.address, details.address)) {
        venue.address = details.address;
        changed = true;
      }

      if (shouldWriteField(venue.phone, details.phone)) {
        venue.phone = details.phone;
        changed = true;
      }

      if (shouldWriteField(venue.website, details.website)) {
        venue.website = details.website;
        changed = true;
      }

      if (shouldWriteField(venue.email, details.email)) {
        venue.email = details.email;
        changed = true;
      }

      if (shouldWriteField(venue.mapsUrl, details.mapsUrl)) {
        venue.mapsUrl = details.mapsUrl;
        changed = true;
      }

      if (shouldWriteField(venue.editorialSummary, details.editorialSummary)) {
        venue.editorialSummary = details.editorialSummary;
        changed = true;
      }

      if (SYNC_RATING_FIELDS && numericChanged(venue.rating, details.rating)) {
        venue.rating = Number.isFinite(details.rating) ? details.rating : null;
        changed = true;
      }

      if (SYNC_RATING_FIELDS && numericChanged(venue.userRatingCount, details.userRatingCount)) {
        venue.userRatingCount = Number.isFinite(details.userRatingCount) ? details.userRatingCount : null;
        changed = true;
      }

      if (shouldWriteArray(venue.reviewSnippets, details.reviewSnippets)) {
        venue.reviewSnippets = normalizeArray(details.reviewSnippets);
        changed = true;
      }

      if (shouldWriteArray(venue.photoReferences, details.photoReferences)) {
        venue.photoReferences = normalizeArray(details.photoReferences);
        changed = true;
      }

      if (shouldWriteArray(venue.menuCapabilities, details.menuCapabilities)) {
        venue.menuCapabilities = normalizeArray(details.menuCapabilities);
        changed = true;
      }

      if (shouldWriteArray(venue.serviceCapabilities, details.serviceCapabilities)) {
        venue.serviceCapabilities = normalizeArray(details.serviceCapabilities);
        changed = true;
      }

      if (shouldWriteArray(venue.atmosphereCapabilities, details.atmosphereCapabilities)) {
        venue.atmosphereCapabilities = normalizeArray(details.atmosphereCapabilities);
        changed = true;
      }

      if (normalizeText(venue.googleDetailsFetchedAt) !== fetchedAtStamp) {
        venue.googleDetailsFetchedAt = fetchedAtStamp;
        changed = true;
      }

      if (changed) {
        updatedRows += 1;
      }
    });

    processedCount += 1;
    maybeSaveProgress();
  }

  async function workerLoop() {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= activePlaceIds.length) {
        return;
      }

      await processPlace(activePlaceIds[index], index);

      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  }

  const workerCount = Math.min(CONCURRENCY, activePlaceIds.length);
  console.log(`Worker sayisi: ${workerCount}`);
  await Promise.all(Array.from({ length: workerCount }, () => workerLoop()));
  maybeSaveProgress(true);

  console.log('Tamamlandi.');
  console.log(`Basarili detay cagri: ${successCount}`);
  console.log(`Hatali detay cagri: ${failureCount}`);
  console.log(`Guncellenen satir sayisi: ${updatedRows}`);
  console.log(`Dosya: ${VENUES_PATH}`);
}

run();
