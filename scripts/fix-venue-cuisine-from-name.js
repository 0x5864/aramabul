#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.pre-cuisine-name-fix.backup.json');
const DRY_RUN = process.argv.includes('--dry-run');

const charMap = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
  é: 'e',
};

const patternCuisineList = [
  { cuisine: 'Çiğ Köfte', patterns: [/cig\s*kofte/u, /cigkofte/u] },
  { cuisine: 'Lahmacun', patterns: [/lahmacun/u] },
  { cuisine: 'Pide', patterns: [/pide/u] },
  { cuisine: 'Döner', patterns: [/doner/u] },
  { cuisine: 'Kebap', patterns: [/kebap/u, /ocakbasi/u] },
  { cuisine: 'Köfte', patterns: [/kofte/u] },
  { cuisine: 'Mantı', patterns: [/manti/u] },
  { cuisine: 'Börek', patterns: [/borek/u] },
  { cuisine: 'Kokoreç', patterns: [/kokorec/u] },
  { cuisine: 'Tantuni', patterns: [/tantuni/u] },
  { cuisine: 'Çorba', patterns: [/corba/u] },
  { cuisine: 'Balık', patterns: [/balik/u, /seafood/u] },
  { cuisine: 'Sushi', patterns: [/sushi/u] },
  { cuisine: 'Asya Mutfağı', patterns: [/wok/u, /noodle/u, /ramen/u, /chinese/u, /kore/u] },
  { cuisine: 'Pizza', patterns: [/pizza/u, /pizzeria/u] },
  { cuisine: 'Burger', patterns: [/burger/u] },
  { cuisine: 'Meyhane', patterns: [/meyhane/u, /taverna/u] },
  { cuisine: 'Tatlı', patterns: [/baklava/u, /tatli/u, /kunefe/u, /dondurma/u, /pastane/u] },
  { cuisine: 'Kahvaltı', patterns: [/kahvalti/u, /serpme/u] },
  { cuisine: 'Kafe', patterns: [/kafe/u, /cafe/u, /kahve/u, /coffee/u] },
  { cuisine: 'Vegan', patterns: [/vegan/u] },
  { cuisine: 'Vejetaryen', patterns: [/vejetaryen/u, /vegetarian/u] },
];

function normalizeText(value) {
  return String(value || '').trim();
}

function foldText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîûé]/g, (char) => charMap[char] || char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function inferCuisineFromName(name) {
  const foldedName = foldText(name);
  if (!foldedName) {
    return '';
  }

  for (const item of patternCuisineList) {
    for (const pattern of item.patterns) {
      if (pattern.test(foldedName)) {
        return item.cuisine;
      }
    }
  }

  return '';
}

function run() {
  const raw = fs.readFileSync(VENUES_PATH, 'utf8');
  const venues = JSON.parse(raw);

  if (!Array.isArray(venues)) {
    console.error('venues.json array formatinda degil.');
    process.exitCode = 1;
    return;
  }

  let changedCount = 0;
  const changedSamples = [];

  for (const venue of venues) {
    if (!venue || typeof venue !== 'object') {
      continue;
    }

    const currentCuisine = normalizeText(venue.cuisine || 'Restoran');
    const inferredCuisine = inferCuisineFromName(venue.name);

    if (!inferredCuisine || currentCuisine === inferredCuisine) {
      continue;
    }

    venue.cuisine = inferredCuisine;
    changedCount += 1;

    if (changedSamples.length < 60) {
      changedSamples.push({
        city: normalizeText(venue.city),
        district: normalizeText(venue.district),
        name: normalizeText(venue.name),
        before: currentCuisine,
        after: inferredCuisine,
      });
    }
  }

  const cuisineCount = new Map();
  for (const venue of venues) {
    const cuisine = normalizeText(venue && venue.cuisine ? venue.cuisine : 'Restoran');
    cuisineCount.set(cuisine, (cuisineCount.get(cuisine) || 0) + 1);
  }
  const topCuisine = [...cuisineCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);

  console.log(`Toplam kayit: ${venues.length}`);
  console.log(`Degisen kayit: ${changedCount}`);

  changedSamples.forEach((item) => {
    console.log(`- ${item.city}/${item.district} | ${item.name} | ${item.before} -> ${item.after}`);
  });

  console.log('--- En yaygin mutfak dagilimi (ilk 25) ---');
  topCuisine.forEach(([cuisine, count]) => {
    console.log(`${cuisine}: ${count}`);
  });

  if (DRY_RUN) {
    console.log('Dry-run modunda calisti. Dosya yazilmadi.');
    return;
  }

  fs.writeFileSync(BACKUP_PATH, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
  fs.writeFileSync(VENUES_PATH, `${JSON.stringify(venues, null, 2)}\n`, 'utf8');

  console.log(`Yedek dosya: ${BACKUP_PATH}`);
  console.log(`Guncel dosya: ${VENUES_PATH}`);
}

run();
