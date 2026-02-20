#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.pre-namecase-fix.backup.json');
const DRY_RUN = process.argv.includes('--dry-run');

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

function formatVenueName(value) {
  const cleaned = normalizeText(value);

  if (!cleaned) {
    return cleaned;
  }

  const lettersOnly = cleaned.replace(/[^A-Za-zÇĞİIÖŞÜçğıöşü]+/g, '');
  if (!lettersOnly) {
    return cleaned;
  }

  const isAllUpper = lettersOnly === lettersOnly.toLocaleUpperCase('tr');
  return isAllUpper ? toTitleCaseTr(cleaned) : cleaned;
}

function run() {
  const venues = readJson(VENUES_PATH, []);
  if (!Array.isArray(venues) || venues.length === 0) {
    console.error('venues.json okunamadi veya bos.');
    process.exitCode = 1;
    return;
  }

  const originalVenues = JSON.parse(JSON.stringify(venues));
  let changedCount = 0;
  const examples = [];

  venues.forEach((venue) => {
    if (!venue || typeof venue !== 'object') {
      return;
    }

    const before = normalizeText(venue.name);
    const after = formatVenueName(before);

    if (!before || before === after) {
      return;
    }

    venue.name = after;
    changedCount += 1;

    if (examples.length < 15) {
      examples.push({
        city: normalizeText(venue.city),
        district: normalizeText(venue.district),
        before,
        after,
      });
    }
  });

  console.log(`Toplam kayit: ${venues.length}`);
  console.log(`Donusturulen isim sayisi: ${changedCount}`);
  examples.forEach((item) => {
    console.log(`- ${item.city}/${item.district}: ${item.before} -> ${item.after}`);
  });

  if (DRY_RUN) {
    console.log('Dry-run modunda calisti. Dosya yazilmadi.');
    return;
  }

  if (changedCount === 0) {
    console.log('Degisiklik yok. Dosya yazilmadi.');
    return;
  }

  writeJson(BACKUP_PATH, originalVenues);
  writeJson(VENUES_PATH, venues);
  console.log(`Yedek: ${BACKUP_PATH}`);
  console.log(`Guncel dosya: ${VENUES_PATH}`);
}

run();
