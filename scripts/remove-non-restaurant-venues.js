#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.pre-non-restaurant-cleanup.backup.json');
const DRY_RUN = process.argv.includes('--dry-run');

const charMap = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  Ç: 'c',
  Ğ: 'g',
  İ: 'i',
  I: 'i',
  Ö: 'o',
  Ş: 's',
  Ü: 'u',
  ǧ: 'g',
  Ǧ: 'g',
};

const organizationTokens = new Set([
  'dernek',
  'dernegi',
  'dernergi',
  'dernekler',
  'federasyon',
  'konfederasyon',
  'sendika',
  'birligi',
]);

const foodTokens = new Set([
  'restoran',
  'restaurant',
  'lokanta',
  'kebap',
  'doner',
  'pide',
  'lahmacun',
  'kofte',
  'cafe',
  'kafe',
  'kahve',
  'kahvalti',
  'tatli',
  'baklava',
  'kunefe',
  'balik',
  'izgara',
  'corba',
  'mangal',
  'sofra',
  'mutfak',
  'ocakbasi',
  'meyhane',
  'yemek',
  'pastane',
  'tantuni',
  'pizza',
  'burger',
  'firin',
  'ekmek',
]);

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeForMatch(value) {
  return String(value || '')
    .replace(/[ÇĞİIÖŞÜçğıöşüǧǦ]/g, (char) => charMap[char] || char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase('tr');
}

function tokenize(value) {
  return normalizeForMatch(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function looksNonRestaurant(venueName) {
  const tokens = tokenize(venueName);
  if (!tokens.length) {
    return false;
  }

  const hasOrganizationSignal = tokens.some((token) => organizationTokens.has(token));
  if (!hasOrganizationSignal) {
    return false;
  }

  const hasFoodSignal = tokens.some((token) => foodTokens.has(token));
  return !hasFoodSignal;
}

function run() {
  const raw = fs.readFileSync(VENUES_PATH, 'utf8');
  const venues = JSON.parse(raw);

  if (!Array.isArray(venues)) {
    console.error('venues.json array formatinda degil.');
    process.exitCode = 1;
    return;
  }

  const kept = [];
  const removed = [];

  for (const venue of venues) {
    if (!venue || typeof venue !== 'object') {
      kept.push(venue);
      continue;
    }

    if (looksNonRestaurant(venue.name)) {
      removed.push(venue);
      continue;
    }

    kept.push(venue);
  }

  console.log(`Toplam kayit: ${venues.length}`);
  console.log(`Silinecek kayit: ${removed.length}`);
  console.log(`Kalan kayit: ${kept.length}`);

  removed.slice(0, 40).forEach((venue) => {
    console.log(`- ${normalizeText(venue.name)} | ${normalizeText(venue.city)} | ${normalizeText(venue.district)}`);
  });

  if (DRY_RUN) {
    console.log('Dry-run modunda calisti. Dosya yazilmadi.');
    return;
  }

  fs.writeFileSync(BACKUP_PATH, `${JSON.stringify(venues, null, 2)}\n`, 'utf8');
  fs.writeFileSync(VENUES_PATH, `${JSON.stringify(kept, null, 2)}\n`, 'utf8');

  console.log(`Yedek dosya: ${BACKUP_PATH}`);
  console.log(`Guncel dosya: ${VENUES_PATH}`);
}

run();
