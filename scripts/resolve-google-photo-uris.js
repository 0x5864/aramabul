#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.photos.backup.json');
const PHOTO_API_BASE = 'https://places.googleapis.com/v1/';

const MAX_VENUES = Number.parseInt(process.env.MAX_VENUES || '0', 10);
const START_INDEX = Number.parseInt(process.env.START_INDEX || '0', 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.REQUEST_DELAY_MS || '180', 10);
const SAVE_EVERY = Number.parseInt(process.env.SAVE_EVERY || '250', 10);
const RETRY_LIMIT = Number.parseInt(process.env.RETRY_LIMIT || '5', 10);
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || '4', 10));
const ONLY_MISSING = process.env.ONLY_MISSING !== '0';
const OVERWRITE_EXISTING = process.env.OVERWRITE_EXISTING === '1';
const MAX_PHOTOS_PER_VENUE = Math.max(1, Number.parseInt(process.env.MAX_PHOTOS_PER_VENUE || '1', 10));
const PHOTO_WIDTH_PX = Math.max(320, Number.parseInt(process.env.PHOTO_WIDTH_PX || '1080', 10));
const TOP_PER_CITY = Math.max(0, Number.parseInt(process.env.TOP_PER_CITY || '0', 10));
const CITY_FILTER = new Set(
  String(process.env.CITY_FILTER || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

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

function normalizeUrl(value) {
  const text = normalizeText(value);
  if (!text || text.length > 3000) {
    return '';
  }

  if (!/^https?:\/\//i.test(text)) {
    return '';
  }

  return text;
}

function normalizeUrlArray(values, limit = 6) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => normalizeUrl(value)).filter(Boolean).slice(0, limit);
}

function normalizePhotoReferences(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function shouldWriteField(existingValue, nextValue) {
  const existing = normalizeUrl(existingValue);
  const next = normalizeUrl(nextValue);

  if (!next) {
    return false;
  }

  if (OVERWRITE_EXISTING) {
    return true;
  }

  return existing.length === 0;
}

function shouldWriteArray(existingValue, nextValue) {
  const existing = normalizeUrlArray(existingValue, MAX_PHOTOS_PER_VENUE);
  const next = normalizeUrlArray(nextValue, MAX_PHOTOS_PER_VENUE);

  if (next.length === 0) {
    return false;
  }

  if (OVERWRITE_EXISTING) {
    return true;
  }

  return existing.length < next.length;
}

function needsPhotoEnrichment(venue) {
  if (!venue || typeof venue !== 'object') {
    return false;
  }

  const references = normalizePhotoReferences(venue.photoReferences);
  if (references.length === 0) {
    return false;
  }

  if (!ONLY_MISSING) {
    return true;
  }

  const hasMainPhoto = normalizeUrl(venue.photoUri).length > 0;
  const gallery = normalizeUrlArray(venue.galleryPhotoUris, MAX_PHOTOS_PER_VENUE);
  const targetCount = Math.min(MAX_PHOTOS_PER_VENUE, references.length);

  if (!hasMainPhoto) {
    return true;
  }

  return gallery.length < targetCount;
}

function toCityGroups(indices, venues) {
  const grouped = new Map();

  indices.forEach((index) => {
    const venue = venues[index];
    const city = normalizeText(venue && venue.city) || 'Diğer';
    const list = grouped.get(city) || [];
    list.push(index);
    grouped.set(city, list);
  });

  return grouped;
}

function pickTargetIndices(venues) {
  const baseIndices = venues
    .map((venue, index) => ({ venue, index }))
    .filter(({ venue }) => needsPhotoEnrichment(venue))
    .filter(({ venue }) => CITY_FILTER.size === 0 || CITY_FILTER.has(normalizeText(venue.city)))
    .map(({ index }) => index);

  if (baseIndices.length === 0) {
    return [];
  }

  if (TOP_PER_CITY <= 0) {
    const sliced = baseIndices.slice(Math.max(0, START_INDEX));
    if (Number.isFinite(MAX_VENUES) && MAX_VENUES > 0) {
      return sliced.slice(0, MAX_VENUES);
    }
    return sliced;
  }

  const groups = toCityGroups(baseIndices, venues);
  const ranked = [];

  [...groups.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], 'tr'))
    .forEach(([, indices]) => {
      const topIndices = indices
        .slice()
        .sort((left, right) => {
          const leftRating = Number(venues[left] && venues[left].rating) || 0;
          const rightRating = Number(venues[right] && venues[right].rating) || 0;
          if (rightRating !== leftRating) {
            return rightRating - leftRating;
          }
          const leftName = normalizeText(venues[left] && venues[left].name);
          const rightName = normalizeText(venues[right] && venues[right].name);
          return leftName.localeCompare(rightName, 'tr');
        })
        .slice(0, TOP_PER_CITY);

      ranked.push(...topIndices);
    });

  const startFrom = Math.max(0, START_INDEX);
  const sliced = ranked.slice(startFrom);
  if (Number.isFinite(MAX_VENUES) && MAX_VENUES > 0) {
    return sliced.slice(0, MAX_VENUES);
  }

  return sliced;
}

async function fetchPhotoUri(photoName) {
  const endpoint = `${PHOTO_API_BASE}${photoName}/media?maxWidthPx=${PHOTO_WIDTH_PX}&skipHttpRedirect=true`;
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

      await sleep(600 * attempt);
      continue;
    }

    if (response.ok) {
      const payload = await response.json();
      const photoUri = normalizeUrl(payload && payload.photoUri);

      if (!photoUri) {
        return {
          ok: false,
          status: 204,
          error: 'photoUri bulunamadı.',
        };
      }

      return {
        ok: true,
        photoUri,
      };
    }

    let errorMessage = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload && payload.error && payload.error.message) {
        errorMessage = payload.error.message;
      }
    } catch (_error) {
      // Keep status message.
    }

    if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
      return {
        ok: false,
        status: response.status,
        error: errorMessage,
      };
    }

    await sleep(700 * attempt);
  }

  return {
    ok: false,
    status: 500,
    error: 'Retry limiti aşıldı.',
  };
}

async function run() {
  if (!API_KEY) {
    console.error('PLACES_API_KEY bulunamadı.');
    process.exitCode = 1;
    return;
  }

  const venues = readJson(VENUES_PATH, []);
  if (!Array.isArray(venues) || venues.length === 0) {
    console.error('venues.json okunamadı veya boş.');
    process.exitCode = 1;
    return;
  }

  const targetIndices = pickTargetIndices(venues);
  console.log(`Toplam venue: ${venues.length}`);
  console.log(`Foto işlenecek venue: ${targetIndices.length}`);

  if (targetIndices.length === 0) {
    console.log('İşlenecek foto kaydı bulunamadı.');
    return;
  }

  writeJson(BACKUP_PATH, venues);
  console.log(`Yedek yazıldı: ${BACKUP_PATH}`);

  const photoCache = new Map();
  const fetchedAtStamp = new Date().toISOString();

  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;
  let updatedRows = 0;
  let lastSavedProcessed = 0;
  let cursor = 0;

  function maybeSaveProgress(force = false) {
    const shouldSave =
      force ||
      processedCount - lastSavedProcessed >= SAVE_EVERY ||
      processedCount === targetIndices.length;

    if (!shouldSave) {
      return;
    }

    writeJson(VENUES_PATH, venues);
    lastSavedProcessed = processedCount;
    console.log(
      `İlerleme: ${processedCount}/${targetIndices.length} | Başarılı: ${successCount} | Hatalı: ${failureCount} | Güncellenen: ${updatedRows}`,
    );
  }

  async function resolveWithCache(photoReference) {
    const cacheKey = normalizeText(photoReference);
    if (!cacheKey) {
      return '';
    }

    if (photoCache.has(cacheKey)) {
      return photoCache.get(cacheKey);
    }

    const result = await fetchPhotoUri(cacheKey);
    if (!result.ok) {
      return '';
    }

    photoCache.set(cacheKey, result.photoUri);
    return result.photoUri;
  }

  async function processVenue(targetPosition) {
    const venueIndex = targetIndices[targetPosition];
    const venue = venues[venueIndex];

    if (!venue || typeof venue !== 'object') {
      processedCount += 1;
      maybeSaveProgress();
      return;
    }

    const references = normalizePhotoReferences(venue.photoReferences).slice(0, MAX_PHOTOS_PER_VENUE);
    if (references.length === 0) {
      processedCount += 1;
      maybeSaveProgress();
      return;
    }

    const resolvedUris = [];
    for (const reference of references) {
      const uri = await resolveWithCache(reference);
      if (uri) {
        resolvedUris.push(uri);
      }

      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    let changed = false;
    if (resolvedUris.length > 0) {
      successCount += 1;

      if (shouldWriteField(venue.photoUri, resolvedUris[0])) {
        venue.photoUri = resolvedUris[0];
        changed = true;
      }

      if (shouldWriteArray(venue.galleryPhotoUris, resolvedUris)) {
        venue.galleryPhotoUris = normalizeUrlArray(resolvedUris, MAX_PHOTOS_PER_VENUE);
        changed = true;
      }
    } else {
      failureCount += 1;
    }

    if (changed) {
      venue.googlePhotoFetchedAt = fetchedAtStamp;
      updatedRows += 1;
    }

    processedCount += 1;
    maybeSaveProgress();
  }

  async function workerLoop() {
    while (true) {
      const targetPosition = cursor;
      cursor += 1;

      if (targetPosition >= targetIndices.length) {
        return;
      }

      await processVenue(targetPosition);
    }
  }

  const workerCount = Math.min(CONCURRENCY, targetIndices.length);
  console.log(`Worker: ${workerCount}`);

  await Promise.all(Array.from({ length: workerCount }, () => workerLoop()));
  maybeSaveProgress(true);

  console.log('Tamamlandı.');
  console.log(`Başarılı foto: ${successCount}`);
  console.log(`Hatalı foto: ${failureCount}`);
  console.log(`Güncellenen venue: ${updatedRows}`);
}

run();

