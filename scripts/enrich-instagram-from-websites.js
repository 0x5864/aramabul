#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.instagram.backup.json');

const MAX_VENUES = Number.parseInt(process.env.MAX_VENUES || '0', 10);
const START_INDEX = Number.parseInt(process.env.START_INDEX || '0', 10);
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || '8', 10));
const REQUEST_TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '7000', 10));
const REQUEST_DELAY_MS = Math.max(0, Number.parseInt(process.env.REQUEST_DELAY_MS || '80', 10));
const SAVE_EVERY = Math.max(50, Number.parseInt(process.env.SAVE_EVERY || '250', 10));
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || '2', 10));
const OVERWRITE_EXISTING = process.env.OVERWRITE_EXISTING === '1';
const ONLY_MISSING = process.env.ONLY_MISSING !== '0';

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

function normalizeWebsite(value) {
  const text = normalizeText(value);
  if (!text || text.length > 3000) {
    return '';
  }

  if (!/^https?:\/\//i.test(text)) {
    return '';
  }

  try {
    return new URL(text).toString();
  } catch (_error) {
    return '';
  }
}

function normalizeInstagramUrl(value) {
  const text = normalizeText(value);
  if (!text || text.length > 3000) {
    return '';
  }

  let candidate = text;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, '')}`;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (_error) {
    return '';
  }

  const host = parsed.hostname.toLowerCase();
  const isInstagramHost =
    host === 'instagram.com' ||
    host === 'www.instagram.com' ||
    host === 'm.instagram.com' ||
    host === 'instagr.am' ||
    host === 'www.instagr.am' ||
    host.endsWith('.instagram.com');

  if (!isInstagramHost) {
    return '';
  }

  parsed.hash = '';
  if (parsed.pathname === '/') {
    return 'https://www.instagram.com/';
  }

  return parsed.toString();
}

function normalizeViaLInstagram(urlValue) {
  const text = normalizeText(urlValue);
  if (!text) {
    return '';
  }

  let parsed;
  try {
    parsed = new URL(text);
  } catch (_error) {
    return '';
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== 'l.instagram.com' && host !== 'www.l.instagram.com') {
    return '';
  }

  const encoded = parsed.searchParams.get('u');
  if (!encoded) {
    return '';
  }

  return normalizeInstagramUrl(decodeURIComponent(encoded));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function shouldProcessVenue(venue) {
  if (!venue || typeof venue !== 'object') {
    return false;
  }

  const website = normalizeWebsite(venue.website);
  if (!website) {
    return false;
  }

  const existingInstagram = normalizeInstagramUrl(venue.instagram);

  if (!OVERWRITE_EXISTING && existingInstagram) {
    return false;
  }

  if (ONLY_MISSING) {
    return !existingInstagram;
  }

  return true;
}

function extractInstagramFromHtml(htmlText, pageUrl) {
  const html = String(htmlText || '');
  if (!html) {
    return '';
  }

  const hrefRegex = /href\s*=\s*(['"])(.*?)\1/gi;
  const hits = [];
  let match = hrefRegex.exec(html);

  while (match) {
    const hrefRaw = normalizeText(match[2]);
    if (hrefRaw) {
      hits.push(hrefRaw);
    }
    match = hrefRegex.exec(html);
  }

  for (const href of hits) {
    let resolved = href;
    if (href.startsWith('//')) {
      resolved = `https:${href}`;
    } else if (href.startsWith('/')) {
      try {
        resolved = new URL(href, pageUrl).toString();
      } catch (_error) {
        continue;
      }
    }

    const normalizedDirect = normalizeInstagramUrl(resolved);
    if (normalizedDirect) {
      return normalizedDirect;
    }

    const normalizedRedirect = normalizeViaLInstagram(resolved);
    if (normalizedRedirect) {
      return normalizedRedirect;
    }
  }

  return '';
}

async function fetchInstagramFromWebsite(websiteUrl) {
  const directInstagram = normalizeInstagramUrl(websiteUrl);
  if (directInstagram) {
    return { ok: true, instagram: directInstagram };
  }

  let attempt = 0;

  while (attempt < RETRY_LIMIT) {
    attempt += 1;

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(websiteUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'aramabulBot/1.0 (+https://aramabul.local)',
        },
        redirect: 'follow',
        signal: abortController.signal,
      });
      clearTimeout(timeoutHandle);

      if (!response.ok) {
        if (!shouldRetryStatus(response.status) || attempt >= RETRY_LIMIT) {
          return {
            ok: false,
            error: `HTTP ${response.status}`,
          };
        }

        await sleep(450 * attempt);
        continue;
      }

      const finalUrl = normalizeWebsite(response.url) || websiteUrl;
      const contentType = normalizeText(response.headers.get('content-type')).toLowerCase();

      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return { ok: true, instagram: '' };
      }

      const body = await response.text();
      const instagramUrl = extractInstagramFromHtml(body, finalUrl);
      return {
        ok: true,
        instagram: instagramUrl,
      };
    } catch (error) {
      clearTimeout(timeoutHandle);

      const message = normalizeText(error && error.message, 'Ağ hatası');
      if (attempt >= RETRY_LIMIT) {
        return {
          ok: false,
          error: message,
        };
      }

      await sleep(450 * attempt);
    }
  }

  return {
    ok: false,
    error: 'Retry limiti aşıldı.',
  };
}

async function run() {
  const venues = readJson(VENUES_PATH, []);
  if (!Array.isArray(venues) || venues.length === 0) {
    console.error('venues.json okunamadı veya boş.');
    process.exitCode = 1;
    return;
  }

  const targetIndicesAll = venues
    .map((venue, index) => ({ venue, index }))
    .filter(({ venue }) => shouldProcessVenue(venue))
    .map(({ index }) => index);

  const sliced = targetIndicesAll.slice(Math.max(0, START_INDEX));
  const targetIndices =
    Number.isFinite(MAX_VENUES) && MAX_VENUES > 0 ? sliced.slice(0, MAX_VENUES) : sliced;

  console.log(`Toplam venue: ${venues.length}`);
  console.log(`Instagram için işlenecek venue: ${targetIndices.length}`);

  if (targetIndices.length === 0) {
    console.log('İşlenecek kayıt bulunamadı.');
    return;
  }

  writeJson(BACKUP_PATH, venues);
  console.log(`Yedek dosya yazıldı: ${BACKUP_PATH}`);

  let processedCount = 0;
  let successCount = 0;
  let failCount = 0;
  let updatedCount = 0;
  let foundCount = 0;
  let lastSavedProcessed = 0;
  let cursor = 0;
  const fetchedAtStamp = new Date().toISOString();

  function maybeSave(force = false) {
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
      `İlerleme: ${processedCount}/${targetIndices.length} | Başarılı: ${successCount} | Hatalı: ${failCount} | Instagram bulunan: ${foundCount} | Güncellenen: ${updatedCount}`,
    );
  }

  async function processVenue(targetPos) {
    const venueIndex = targetIndices[targetPos];
    const venue = venues[venueIndex];
    if (!venue || typeof venue !== 'object') {
      processedCount += 1;
      maybeSave();
      return;
    }

    const website = normalizeWebsite(venue.website);
    if (!website) {
      processedCount += 1;
      maybeSave();
      return;
    }

    const result = await fetchInstagramFromWebsite(website);
    if (!result.ok) {
      failCount += 1;
      processedCount += 1;
      maybeSave();
      return;
    }

    successCount += 1;
    const instagram = normalizeInstagramUrl(result.instagram);
    let changed = false;

    if (instagram) {
      const existing = normalizeInstagramUrl(venue.instagram);
      if (OVERWRITE_EXISTING || !existing || existing !== instagram) {
        venue.instagram = instagram;
        changed = true;
      }
      foundCount += 1;
    }

    if (changed) {
      venue.instagramFetchedAt = fetchedAtStamp;
      updatedCount += 1;
    }

    processedCount += 1;
    maybeSave();

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  async function workerLoop() {
    while (true) {
      const targetPos = cursor;
      cursor += 1;

      if (targetPos >= targetIndices.length) {
        return;
      }

      await processVenue(targetPos);
    }
  }

  const workerCount = Math.min(CONCURRENCY, targetIndices.length);
  console.log(`Worker sayısı: ${workerCount}`);
  await Promise.all(Array.from({ length: workerCount }, () => workerLoop()));
  maybeSave(true);

  console.log('Tamamlandı.');
  console.log(`Başarılı web isteği: ${successCount}`);
  console.log(`Hatalı web isteği: ${failCount}`);
  console.log(`Instagram bulunan: ${foundCount}`);
  console.log(`Güncellenen kayıt: ${updatedCount}`);
}

run();
