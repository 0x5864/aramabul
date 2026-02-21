#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.pre-istanbul-city-fix.backup.json');
const DRY_RUN = process.argv.includes('--dry-run');

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCaseTr(value) {
  return normalizeText(value)
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return word;
      }

      const lower = word.toLocaleLowerCase('tr');
      const first = lower.charAt(0).toLocaleUpperCase('tr');
      return `${first}${lower.slice(1)}`;
    })
    .join(' ');
}

function normalizeForCompare(value) {
  return normalizeText(value).toLocaleLowerCase('tr').normalize('NFC');
}

function isIstanbulSuffixAddress(address) {
  return /\/\s*(İstanbul|Istanbul)\.?\s*$/iu.test(String(address || ''));
}

function extractDistrictFromAddress(address) {
  const raw = normalizeText(address);
  const suffixMatch = raw.match(/(.+)\/\s*(?:İstanbul|Istanbul)\.?\s*$/iu);
  if (!suffixMatch) {
    return '';
  }

  let district = normalizeText(suffixMatch[1]);

  if (district.includes(',')) {
    district = normalizeText(district.split(',').pop());
  }

  if (district.includes('/')) {
    district = normalizeText(district.split('/').pop());
  }

  district = normalizeText(district.replace(/\b\d{5}\b/g, ' '));
  district = district.replace(/^[\s,./-]+|[\s,./-]+$/g, '');

  if (!district) {
    return '';
  }

  return toTitleCaseTr(district);
}

function readVenues() {
  const raw = fs.readFileSync(VENUES_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('venues.json array degil');
  }

  return parsed;
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function run() {
  const venues = readVenues();
  const before = JSON.parse(JSON.stringify(venues));

  let cityFixCount = 0;
  let districtFixCount = 0;
  const examples = [];

  for (const venue of venues) {
    if (!venue || typeof venue !== 'object') {
      continue;
    }

    const address = normalizeText(venue.address);
    if (!isIstanbulSuffixAddress(address)) {
      continue;
    }

    const city = normalizeText(venue.city);
    const cityIsIstanbul = normalizeForCompare(city) === 'istanbul' || normalizeForCompare(city) === 'i̇stanbul';

    const cityWasFixed = !cityIsIstanbul;
    if (cityWasFixed) {
      venue.city = 'İstanbul';
      cityFixCount += 1;
    }

    if (!cityWasFixed) {
      continue;
    }

    const parsedDistrict = extractDistrictFromAddress(address);
    if (!parsedDistrict) {
      continue;
    }

    if (normalizeForCompare(venue.district) !== normalizeForCompare(parsedDistrict)) {
      venue.district = parsedDistrict;
      districtFixCount += 1;
    }

    if (examples.length < 20) {
      examples.push({
        name: normalizeText(venue.name),
        cityBefore: city || '(bos)',
        cityAfter: venue.city,
        districtAfter: venue.district,
        address,
      });
    }
  }

  console.log(`Toplam kayit: ${venues.length}`);
  console.log(`Sehir duzeltmesi: ${cityFixCount}`);
  console.log(`Ilce duzeltmesi: ${districtFixCount}`);
  for (const item of examples) {
    console.log(`- ${item.name}`);
    console.log(`  sehir: ${item.cityBefore} -> ${item.cityAfter}`);
    console.log(`  ilce: ${item.districtAfter}`);
    console.log(`  adres: ${item.address}`);
  }

  if (DRY_RUN) {
    console.log('Dry-run modunda calisti. Dosya yazilmadi.');
    return;
  }

  if (cityFixCount === 0 && districtFixCount === 0) {
    console.log('Degisiklik yok. Dosya yazilmadi.');
    return;
  }

  writeJson(BACKUP_PATH, before);
  writeJson(VENUES_PATH, venues);
  console.log(`Yedek: ${BACKUP_PATH}`);
  console.log(`Guncel dosya: ${VENUES_PATH}`);
}

run();
