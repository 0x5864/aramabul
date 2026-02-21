#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.websites.backup.json');
const DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places/';
const FIELD_MASK = 'id,websiteUri';

const MAX_DETAILS = Number.parseInt(process.env.MAX_DETAILS || '0', 10);
const START_INDEX = Number.parseInt(process.env.START_INDEX || '0', 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.REQUEST_DELAY_MS || '220', 10);
const SAVE_EVERY = Number.parseInt(process.env.SAVE_EVERY || '400', 10);
const RETRY_LIMIT = Number.parseInt(process.env.RETRY_LIMIT || '5', 10);
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || '4', 10));
const OVERWRITE_EXISTING = process.env.OVERWRITE_EXISTING === '1';

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
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

function shouldFetchWebsite(venue) {
  if (!venue || typeof venue !== 'object') {
    return false;
  }

  const placeId = normalizeText(venue.sourcePlaceId);
  if (!placeId) {
    return false;
  }

  const website = normalizeText(venue.website);
  if (!OVERWRITE_EXISTING && website) {
    return false;
  }

  return true;
}

async function fetchWebsite(placeId) {
  const endpoint = `${DETAILS_BASE_URL}${encodeURIComponent(placeId)}`;
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

      await sleep(500 * attempt);
      continue;
    }

    if (response.ok) {
      const payload = await response.json();
      return {
        ok: true,
        website: normalizeText(payload && payload.websiteUri),
      };
    }

    let errorMessage = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload && payload.error && payload.error.message) {
        errorMessage = payload.error.message;
      }
    } catch (_error) {
      // Keep status.
    }

    if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
      return {
        ok: false,
        status: response.status,
        error: errorMessage,
      };
    }

    await sleep(550 * attempt);
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

  const placeIndex = buildPlaceIndex(venues);
  const targetPlaceIdsAll = [...placeIndex.keys()].filter((placeId) => {
    const indices = placeIndex.get(placeId) || [];
    return indices.some((index) => shouldFetchWebsite(venues[index]));
  });

  const sliced = targetPlaceIdsAll.slice(Math.max(0, START_INDEX));
  const targetPlaceIds =
    Number.isFinite(MAX_DETAILS) && MAX_DETAILS > 0 ? sliced.slice(0, MAX_DETAILS) : sliced;

  console.log(`Toplam venue: ${venues.length}`);
  console.log(`Toplam placeId: ${placeIndex.size}`);
  console.log(`Web sitesi yenilenecek placeId: ${targetPlaceIdsAll.length}`);
  console.log(`Çalışacak placeId: ${targetPlaceIds.length}`);

  if (targetPlaceIds.length === 0) {
    console.log('İşlenecek kayıt bulunamadı.');
    return;
  }

  writeJson(BACKUP_PATH, venues);
  console.log(`Yedek dosya yazıldı: ${BACKUP_PATH}`);

  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;
  let updatedRows = 0;
  let foundWebsiteCount = 0;
  let lastSavedProcessed = 0;
  let cursor = 0;

  function maybeSaveProgress(force = false) {
    const shouldSave =
      force ||
      processedCount - lastSavedProcessed >= SAVE_EVERY ||
      processedCount === targetPlaceIds.length;

    if (!shouldSave) {
      return;
    }

    writeJson(VENUES_PATH, venues);
    lastSavedProcessed = processedCount;
    console.log(
      `İlerleme: ${processedCount}/${targetPlaceIds.length} | Başarılı: ${successCount} | Hatalı: ${failureCount} | Web bulunan: ${foundWebsiteCount} | Güncellenen satır: ${updatedRows}`,
    );
  }

  async function processPlace(placeId, index) {
    const result = await fetchWebsite(placeId);

    if (!result.ok) {
      failureCount += 1;
      console.warn(
        `Hata [${index + 1}/${targetPlaceIds.length}] ${placeId}: ${result.error} (status=${result.status})`,
      );
      processedCount += 1;
      maybeSaveProgress();
      return;
    }

    successCount += 1;
    const website = normalizeText(result.website);

    if (website) {
      foundWebsiteCount += 1;
    }

    const indices = placeIndex.get(placeId) || [];
    indices.forEach((venueIndex) => {
      const venue = venues[venueIndex];
      if (!venue || typeof venue !== 'object') {
        return;
      }

      const existing = normalizeText(venue.website);
      const shouldUpdate = website && (OVERWRITE_EXISTING || !existing);
      if (shouldUpdate) {
        venue.website = website;
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

      if (index >= targetPlaceIds.length) {
        return;
      }

      await processPlace(targetPlaceIds[index], index);

      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  }

  const workerCount = Math.min(CONCURRENCY, targetPlaceIds.length);
  console.log(`Worker sayısı: ${workerCount}`);
  await Promise.all(Array.from({ length: workerCount }, () => workerLoop()));
  maybeSaveProgress(true);

  console.log('Tamamlandı.');
  console.log(`Başarılı detay çağrısı: ${successCount}`);
  console.log(`Hatalı detay çağrısı: ${failureCount}`);
  console.log(`Web sitesi dönen kayıt: ${foundWebsiteCount}`);
  console.log(`Güncellenen satır: ${updatedRows}`);
}

run();

