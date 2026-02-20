#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.pre-district-fix.backup.json');
const DRY_RUN = process.argv.includes('--dry-run');

const turkishCharMap = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

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

function normalizeForCompare(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char);
}

function foldForPath(value) {
  return normalizeForCompare(value).replace(/\s+/g, '').replace(/[^a-z0-9/]/g, '');
}

function resolveDistrictFromAddress(city, fallbackDistrict, address, districtMap) {
  const cityName = normalizeText(city);
  const fallback = normalizeText(fallbackDistrict || 'Merkez');
  const districtList =
    cityName && districtMap && Array.isArray(districtMap[cityName]) ? districtMap[cityName] : [];
  const addressText = normalizeText(address);

  if (!districtList.length || !addressText) {
    return fallback;
  }

  const foldedAddress = foldForPath(addressText);
  const foldedCity = foldForPath(cityName);

  if (!foldedAddress || !foldedCity) {
    return fallback;
  }

  const sortedDistricts = [...districtList].sort((left, right) => right.length - left.length);

  for (const districtName of sortedDistricts) {
    const cleanDistrict = normalizeText(districtName);
    const foldedDistrict = foldForPath(cleanDistrict);

    if (!foldedDistrict) {
      continue;
    }

    if (foldedAddress.includes(`${foldedDistrict}/${foldedCity}`)) {
      return cleanDistrict;
    }
  }

  return fallback;
}

function run() {
  const districts = readJson(DISTRICTS_PATH, {});
  const venues = readJson(VENUES_PATH, []);
  const originalVenues = JSON.parse(JSON.stringify(venues));

  if (!districts || typeof districts !== 'object' || Array.isArray(districts)) {
    console.error('districts.json okunamadi veya format hatali.');
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(venues) || venues.length === 0) {
    console.error('venues.json okunamadi veya bos.');
    process.exitCode = 1;
    return;
  }

  let changedCount = 0;
  const changesByCity = new Map();
  const examples = [];

  venues.forEach((venue) => {
    if (!venue || typeof venue !== 'object') {
      return;
    }

    const city = normalizeText(venue.city);
    const currentDistrict = normalizeText(venue.district || 'Merkez');
    const address = normalizeText(venue.address);
    const resolvedDistrict = resolveDistrictFromAddress(city, currentDistrict, address, districts);

    if (!resolvedDistrict || resolvedDistrict === currentDistrict) {
      return;
    }

    venue.district = resolvedDistrict;
    changedCount += 1;
    changesByCity.set(city, (changesByCity.get(city) || 0) + 1);

    if (examples.length < 12) {
      examples.push({
        city,
        name: normalizeText(venue.name),
        from: currentDistrict,
        to: resolvedDistrict,
        address,
      });
    }
  });

  const cityBreakdown = [...changesByCity.entries()].sort((left, right) => right[1] - left[1]);

  console.log(`Toplam kayit: ${venues.length}`);
  console.log(`Duzeltilen ilce sayisi: ${changedCount}`);
  console.log('Sehir bazli ilk 20:');
  cityBreakdown.slice(0, 20).forEach(([city, count]) => {
    console.log(`- ${city}: ${count}`);
  });

  if (examples.length > 0) {
    console.log('Ornek duzeltmeler:');
    examples.forEach((item) => {
      console.log(`- ${item.city} | ${item.name} | ${item.from} -> ${item.to} | ${item.address}`);
    });
  }

  if (DRY_RUN) {
    console.log('Dry-run modunda calisti. Dosya yazilmadi.');
    return;
  }

  if (changedCount > 0) {
    writeJson(BACKUP_PATH, originalVenues);
    writeJson(VENUES_PATH, venues);
    console.log(`Yedek: ${BACKUP_PATH}`);
    console.log(`Guncel dosya: ${VENUES_PATH}`);
  } else {
    console.log('Degisiklik yok. Dosya yazilmadi.');
  }
}

run();
