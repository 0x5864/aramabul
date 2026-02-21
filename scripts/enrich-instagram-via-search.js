#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.instagram-search.backup.json');

const MAX_GROUPS = Number.parseInt(process.env.MAX_GROUPS || '0', 10);
const START_INDEX = Number.parseInt(process.env.START_INDEX || '0', 10);
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || '8', 10));
const REQUEST_DELAY_MS = Math.max(0, Number.parseInt(process.env.REQUEST_DELAY_MS || '120', 10));
const REQUEST_TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '7000', 10));
const SAVE_EVERY = Math.max(50, Number.parseInt(process.env.SAVE_EVERY || '300', 10));
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || '2', 10));
const USE_DDG_FALLBACK = process.env.USE_DDG_FALLBACK !== '0';

const GENERIC_TOKENS = new Set([
  'restaurant',
  'restoran',
  'lokanta',
  'cafe',
  'kafe',
  'caffe',
  'bistro',
  'pide',
  'kebap',
  'kebab',
  'doner',
  'döner',
  'izgara',
  'et',
  'balik',
  'balık',
  'mangal',
  'sushi',
  'kahvalti',
  'kahvaltı',
  'mutfak',
  'food',
  'kitchen',
  'cuisine',
]);

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

function foldTr(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => {
      const map = {
        ç: 'c',
        ğ: 'g',
        ı: 'i',
        ö: 'o',
        ş: 's',
        ü: 'u',
      };
      return map[char] || char;
    })
    .normalize('NFC');
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

  const segment = normalizeText(parsed.pathname.split('/').filter(Boolean)[0]);
  const blockedSegments = new Set([
    '',
    'p',
    'reel',
    'reels',
    'explore',
    'accounts',
    'stories',
    'tv',
    'direct',
    'about',
    'developer',
    'directory',
    'legal',
    'challenge',
  ]);

  if (blockedSegments.has(segment.toLowerCase())) {
    return '';
  }

  parsed.search = '';
  parsed.hash = '';
  parsed.pathname = `/${segment}/`;
  return parsed.toString();
}

function tokenizeName(name) {
  return [...new Set(foldTr(name).split(/[^a-z0-9]+/g).filter(Boolean))]
    .filter((token) => token.length >= 4 && !GENERIC_TOKENS.has(token))
    .slice(0, 6);
}

function shouldProcessVenue(venue) {
  if (!venue || typeof venue !== 'object') {
    return false;
  }

  const name = normalizeText(venue.name);
  const instagram = normalizeInstagramUrl(venue.instagram);
  return Boolean(name) && !instagram;
}

function buildGroupKey(venue) {
  const name = foldTr(venue.name);
  const city = foldTr(venue.city);
  return `${name}|${city}`;
}

function buildGroups(venues) {
  const groups = new Map();

  venues.forEach((venue, index) => {
    if (!shouldProcessVenue(venue)) {
      return;
    }

    const key = buildGroupKey(venue);
    const record = groups.get(key) || { key, indexes: [], venue };
    record.indexes.push(index);
    groups.set(key, record);
  });

  return [...groups.values()];
}

function extractFromGoogleHtml(html) {
  const text = String(html || '');
  const links = new Set();

  const redirectRegex = /\/url\?q=([^&"'>]+)/g;
  let redirectMatch = redirectRegex.exec(text);
  while (redirectMatch) {
    try {
      links.add(decodeURIComponent(redirectMatch[1]));
    } catch (_error) {
      // Skip.
    }
    redirectMatch = redirectRegex.exec(text);
  }

  const directRegex = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[A-Za-z0-9._\-/?=&%]+/gi;
  let directMatch = directRegex.exec(text);
  while (directMatch) {
    links.add(directMatch[0]);
    directMatch = directRegex.exec(text);
  }

  return [...links];
}

function extractFromDdgHtml(html) {
  const text = String(html || '');
  const links = new Set();

  const uddgRegex = /uddg=([^&"'>]+)/g;
  let uddgMatch = uddgRegex.exec(text);
  while (uddgMatch) {
    try {
      links.add(decodeURIComponent(uddgMatch[1]));
    } catch (_error) {
      // Skip.
    }
    uddgMatch = uddgRegex.exec(text);
  }

  const directRegex = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[A-Za-z0-9._\-/?=&%]+/gi;
  let directMatch = directRegex.exec(text);
  while (directMatch) {
    links.add(directMatch[0]);
    directMatch = directRegex.exec(text);
  }

  return [...links];
}

function scoreCandidate(candidateUrl, tokens, venue) {
  const normalized = normalizeInstagramUrl(candidateUrl);
  if (!normalized) {
    return -1;
  }

  const lowerUrl = foldTr(normalized);
  let handle = '';
  try {
    handle = foldTr(new URL(normalized).pathname.split('/').filter(Boolean)[0] || '');
  } catch (_error) {
    handle = '';
  }

  let score = 0;
  tokens.forEach((token) => {
    if (handle.includes(token)) {
      score += 8;
    } else if (lowerUrl.includes(token)) {
      score += 4;
    }
  });

  const city = foldTr(venue.city);
  if (city && lowerUrl.includes(city)) {
    score += 1;
  }

  const district = foldTr(venue.district);
  if (district && district !== 'merkez' && lowerUrl.includes(district)) {
    score += 1;
  }

  return score;
}

function bestInstagramCandidate(candidates, venue) {
  const tokens = tokenizeName(venue.name);
  const normalizedCandidates = candidates
    .map((url) => normalizeInstagramUrl(url))
    .filter(Boolean);

  if (normalizedCandidates.length === 0) {
    return '';
  }

  if (tokens.length === 0) {
    return normalizedCandidates[0];
  }

  let best = '';
  let bestScore = -1;
  normalizedCandidates.forEach((candidate) => {
    const score = scoreCandidate(candidate, tokens, venue);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });

  return bestScore >= 4 ? best : '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function searchGoogle(query) {
  const endpoint = `https://www.google.com/search?hl=tr&gl=tr&num=10&q=${encodeURIComponent(query)}`;
  let attempt = 0;

  while (attempt < RETRY_LIMIT) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) {
        if (attempt >= RETRY_LIMIT) {
          return [];
        }
        await sleep(350 * attempt);
        continue;
      }

      const html = await response.text();
      return extractFromGoogleHtml(html);
    } catch (_error) {
      if (attempt >= RETRY_LIMIT) {
        return [];
      }
      await sleep(350 * attempt);
    }
  }

  return [];
}

async function searchDdg(query) {
  const endpoint = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  let attempt = 0;

  while (attempt < RETRY_LIMIT) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) {
        if (attempt >= RETRY_LIMIT) {
          return [];
        }
        await sleep(350 * attempt);
        continue;
      }

      const html = await response.text();
      return extractFromDdgHtml(html);
    } catch (_error) {
      if (attempt >= RETRY_LIMIT) {
        return [];
      }
      await sleep(350 * attempt);
    }
  }

  return [];
}

async function findInstagramForVenue(venue) {
  const baseName = normalizeText(venue.name);
  const city = normalizeText(venue.city);
  const district = normalizeText(venue.district);

  const queries = [
    `site:instagram.com "${baseName}" "${city}"`,
    `${baseName} ${district} ${city} instagram`,
  ];

  for (const query of queries) {
    const googleCandidates = await searchGoogle(query);
    const bestFromGoogle = bestInstagramCandidate(googleCandidates, venue);
    if (bestFromGoogle) {
      return bestFromGoogle;
    }

    if (USE_DDG_FALLBACK) {
      const ddgCandidates = await searchDdg(query);
      const bestFromDdg = bestInstagramCandidate(ddgCandidates, venue);
      if (bestFromDdg) {
        return bestFromDdg;
      }
    }
  }

  return '';
}

async function run() {
  const venues = readJson(VENUES_PATH, []);
  if (!Array.isArray(venues) || venues.length === 0) {
    console.error('venues.json okunamadı veya boş.');
    process.exitCode = 1;
    return;
  }

  const groupsAll = buildGroups(venues);
  const sliced = groupsAll.slice(Math.max(0, START_INDEX));
  const groups = Number.isFinite(MAX_GROUPS) && MAX_GROUPS > 0 ? sliced.slice(0, MAX_GROUPS) : sliced;

  console.log(`Toplam venue: ${venues.length}`);
  console.log(`Instagram boş grup (name+city): ${groupsAll.length}`);
  console.log(`Çalışacak grup: ${groups.length}`);

  if (groups.length === 0) {
    console.log('İşlenecek grup bulunamadı.');
    return;
  }

  writeJson(BACKUP_PATH, venues);
  console.log(`Yedek dosya yazıldı: ${BACKUP_PATH}`);

  let processedCount = 0;
  let foundCount = 0;
  let updatedRows = 0;
  let noResultCount = 0;
  let lastSavedProcessed = 0;
  let cursor = 0;
  const fetchedAtStamp = new Date().toISOString();

  function maybeSave(force = false) {
    const shouldSave =
      force ||
      processedCount - lastSavedProcessed >= SAVE_EVERY ||
      processedCount === groups.length;

    if (!shouldSave) {
      return;
    }

    writeJson(VENUES_PATH, venues);
    lastSavedProcessed = processedCount;
    console.log(
      `İlerleme: ${processedCount}/${groups.length} | Bulunan: ${foundCount} | Boş: ${noResultCount} | Güncellenen satır: ${updatedRows}`,
    );
  }

  async function processGroup(group, index) {
    const instagramUrl = await findInstagramForVenue(group.venue);

    if (!instagramUrl) {
      noResultCount += 1;
    } else {
      foundCount += 1;
      group.indexes.forEach((venueIndex) => {
        const venue = venues[venueIndex];
        if (!venue || typeof venue !== 'object') {
          return;
        }
        venue.instagram = instagramUrl;
        venue.instagramFetchedAt = fetchedAtStamp;
        venue.instagramSource = 'search_google';
        updatedRows += 1;
      });
    }

    processedCount += 1;
    maybeSave();

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  async function workerLoop() {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= groups.length) {
        return;
      }

      await processGroup(groups[index], index);
    }
  }

  const workerCount = Math.min(CONCURRENCY, groups.length);
  console.log(`Worker sayısı: ${workerCount}`);
  await Promise.all(Array.from({ length: workerCount }, () => workerLoop()));
  maybeSave(true);

  console.log('Tamamlandı.');
  console.log(`Bulunan Instagram grup: ${foundCount}`);
  console.log(`Instagram bulunamayan grup: ${noResultCount}`);
  console.log(`Güncellenen kayıt satırı: ${updatedRows}`);
}

run();

