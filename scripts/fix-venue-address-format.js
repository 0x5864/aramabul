#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const VENUES_PATH = path.join(DATA_DIR, 'venues.json');
const BACKUP_PATH = path.join(DATA_DIR, 'venues.pre-address-format-fix.backup.json');
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

const mahalleTokenPattern = /\b(mahallesi|mah\.?|mh\.?)\b/iu;
const caddeTokenPattern = /(caddesi|cadde|cad\.?|cd\.?|bulvarı|bulvari|bulvar|blv\.?|yolu|yol)/iu;
const sokakTokenPattern = /(sokağı|sokagi|sokak|sok\.?|sk\.?)/iu;
const noPattern = /\bno\s*[:;.,]?\s*([0-9a-zçğıöşüA-ZÇĞİÖŞÜ\/-]+)/iu;
const postCodePattern = /\b\d{5}\b/g;
const streetSuffixPattern = /(?:Cad\.|Sok\.|Blv\.|Yolu)/u;
const strictFormatPattern = new RegExp(
  `^[^,]+ Mah\\., .+ ${streetSuffixPattern.source}(?: \\(.+ ${streetSuffixPattern.source}\\))? No:[^ ]+ [0-9]{5} [^/]+\\/[^.]+\\.$`,
  'u',
);

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
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char);
}

function toTitleCaseTr(value) {
  return normalizeText(value)
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return word;
      }

      const lower = word.toLocaleLowerCase('tr');
      const firstLetter = lower.charAt(0).toLocaleUpperCase('tr');
      return `${firstLetter}${lower.slice(1)}`;
    })
    .join(' ');
}

function splitAddressParts(address) {
  return normalizeText(address)
    .split(',')
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .filter((part) => normalizeForCompare(part) !== 'turkiye' && normalizeForCompare(part) !== 'türkiye');
}

function extractPostCode(parts, rawAddress) {
  const fromRaw = [...String(rawAddress || '').matchAll(/\b\d{5}\b/g)];
  const postalCode = fromRaw.length ? fromRaw[fromRaw.length - 1][0] : '00000';

  const cleanedParts = parts
    .map((part) => normalizeText(part.replace(postCodePattern, ' ')))
    .filter(Boolean);

  return {
    postalCode,
    parts: cleanedParts,
  };
}

function normalizeMahalleName(rawName) {
  const cleaned = normalizeText(rawName);
  if (!cleaned) {
    return 'Merkez Mah.';
  }

  const match = cleaned.match(/^(.*?)(?:\bmahallesi\b|\bmah\.?\b|\bmh\.?\b)/iu);
  const base = match && normalizeText(match[1]) ? normalizeText(match[1]) : cleaned;
  const stripped = normalizeText(base.replace(/^[\s,.-]+|[\s,.-]+$/g, ''));

  if (!stripped) {
    return 'Merkez Mah.';
  }

  return `${toTitleCaseTr(stripped)} Mah.`;
}

function isLikelyMahalleCandidate(segment, cityCanonical, districtCanonical) {
  const cleaned = normalizeText(segment);
  if (!cleaned) {
    return false;
  }

  if (mahalleTokenPattern.test(cleaned)) {
    return true;
  }

  if (/\d/.test(cleaned)) {
    return false;
  }

  if (caddeTokenPattern.test(cleaned) || sokakTokenPattern.test(cleaned)) {
    return false;
  }

  if (/[/:]/.test(cleaned)) {
    return false;
  }

  const canonical = normalizeForCompare(cleaned);
  if (!canonical || canonical === cityCanonical || canonical === districtCanonical) {
    return false;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 3;
}

function pickMahalle(parts, venue) {
  const addressText = normalizeText(venue.address);
  const city = normalizeForCompare(venue.city);
  const district = normalizeForCompare(venue.district);
  const cityCanonical = normalizeForCompare(venue.city);
  const districtCanonical = normalizeForCompare(venue.district);

  if (/silah[şs][oö]r/iu.test(addressText) && city === 'istanbul' && district === 'sisli') {
    const merkezIndex = parts.findIndex((part) => normalizeForCompare(part) === 'merkez');
    if (merkezIndex >= 0) {
      return {
        mahalle: 'Cumhuriyet Mah.',
        index: merkezIndex,
      };
    }

    const cumhuriyetIndex = parts.findIndex((part) => normalizeForCompare(part) === 'cumhuriyet');
    if (cumhuriyetIndex >= 0) {
      return {
        mahalle: 'Cumhuriyet Mah.',
        index: cumhuriyetIndex,
      };
    }

    return {
      mahalle: 'Cumhuriyet Mah.',
      index: -1,
    };
  }

  for (let index = 0; index < parts.length; index += 1) {
    if (mahalleTokenPattern.test(parts[index])) {
      return { mahalle: normalizeMahalleName(parts[index]), index };
    }
  }

  for (let index = 0; index < parts.length; index += 1) {
    const canonical = normalizeForCompare(parts[index]);
    if (canonical === 'cumhuriyet' || canonical === 'merkez') {
      return { mahalle: normalizeMahalleName(parts[index]), index };
    }
  }

  const likelyIndices = [];
  for (let index = 0; index < parts.length; index += 1) {
    if (isLikelyMahalleCandidate(parts[index], cityCanonical, districtCanonical)) {
      likelyIndices.push(index);
    }
  }

  if (likelyIndices.length) {
    const pickIndex = likelyIndices[likelyIndices.length - 1];
    return { mahalle: normalizeMahalleName(parts[pickIndex]), index: pickIndex };
  }

  return {
    mahalle: 'Merkez Mah.',
    index: -1,
  };
}

function removePartAt(parts, index) {
  if (index < 0 || index >= parts.length) {
    return [...parts];
  }

  return parts.filter((_, currentIndex) => currentIndex !== index);
}

function extractNo(parts) {
  let number = '';

  const cleanedParts = parts
    .map((part) => {
      const match = part.match(noPattern);
      if (match && !number) {
        number = normalizeText(match[1]).toUpperCase('tr');
      }

      const withoutNo = normalizeText(
        part
          .replace(noPattern, ' ')
          .replace(/\b(d|daire|kat)\s*[:;.]?\s*[0-9a-zçğıöşüA-ZÇĞİÖŞÜ/-]+\b/giu, ' ')
          .replace(/[;,:]+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\s+\.$/g, '')
          .replace(/\.+$/g, ''),
      );
      return withoutNo;
    })
    .filter(Boolean);

  return {
    number,
    parts: cleanedParts,
  };
}

function ensureStreetSuffix(value, fallbackSuffix) {
  let cleaned = normalizeText(value)
    .replace(/caddesi|cadde|cad\.?|cd\.?/giu, 'Cad.')
    .replace(/bulvarı|bulvari|bulvar|blv\.?/giu, 'Blv.')
    .replace(/sokağı|sokagi|sokak|sok\.?|sk\.?/giu, 'Sok.')
    .replace(/\byolu\b/giu, 'Yolu')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned = cleaned.replace(/[.,;:]+$/gu, '').trim();
  cleaned = cleaned.replace(/\b(Blv|Cad|Sok)\.[ıi]/giu, '$1.');
  cleaned = cleaned.replace(/(\d+)\.\s*(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1 $2');
  cleaned = cleaned.replace(/(Cad\.|Sok\.|Blv\.|Yolu)(\d)/gu, '$1 $2');
  cleaned = cleaned.replace(/([A-Za-zÇĞİÖŞÜçğıöşü])\.(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1 $2');
  cleaned = cleaned.replace(/([A-Za-zÇĞİÖŞÜçğıöşü0-9)])(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1 $2');
  cleaned = cleaned.replace(/(^|\s)\.(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1Adres $2');
  cleaned = cleaned.replace(/\bYolu\./giu, 'Yolu');

  if (/\b(Cad|Sok|Blv)$/u.test(cleaned)) {
    cleaned = `${cleaned}.`;
  }

  if (/^(Cad\.|Sok\.|Blv\.|Yolu)$/u.test(cleaned)) {
    cleaned = `Adres ${cleaned}`;
  }

  if (!/\b(Cad\.|Sok\.|Blv\.|Yolu)$/u.test(cleaned)) {
    return `${cleaned || 'Adres'} ${fallbackSuffix}`.trim();
  }

  return cleaned;
}

function normalizeStreetToken(value, fallbackSuffix = 'Cad.') {
  const cleaned = normalizeText(value)
    .replace(/caddesi|cadde|cad\.?|cd\.?/giu, 'Cad.')
    .replace(/bulvarı|bulvari|bulvar|blv\.?/giu, 'Blv.')
    .replace(/sokağı|sokagi|sokak|sok\.?|sk\.?/giu, 'Sok.')
    .replace(/\byolu\b/giu, 'Yolu')
    .replace(/\b(d|daire|kat)\s*[:;.]?\s*[0-9a-zçğıöşüA-ZÇĞİÖŞÜ/-]+\b/giu, ' ')
    .replace(/\s*\.\s*\./g, '.')
    .replace(/\.\s+\./g, '.')
    .replace(/\s*\.\s*,/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/\.\s*\./g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])\.\.+/gu, '$1.')
    .replace(/\b(Cad|Sok|Blv)\.\./gu, '$1.')
    .replace(/\b(Blv|Cad|Sok)\.[ıi]/giu, '$1.')
    .replace(/(\d+)\.\s*(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1 $2')
    .replace(/(Cad\.|Sok\.|Blv\.|Yolu)(\d)/gu, '$1 $2')
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])\.(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1 $2')
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü0-9)])(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1 $2')
    .replace(/(^|\s)\.(Cad\.|Sok\.|Blv\.|Yolu)/gu, '$1Adres $2')
    .replace(/\bYolu\./giu, 'Yolu')
    .replace(/\s+/g, ' ')
    .trim();

  return ensureStreetSuffix(cleaned, fallbackSuffix);
}

function extractTrailingNumber(street) {
  const cleaned = normalizeText(street);
  const match = cleaned.match(/^(.*?)(?:\s+)(\d+[a-zA-Z]?\/?[0-9a-zA-Z-]*)$/u);
  if (!match) {
    return { street: cleaned, number: '' };
  }

  const streetPart = normalizeText(match[1]);
  const number = normalizeText(match[2]).toUpperCase('tr');
  if (!streetPart || !number) {
    return { street: cleaned, number: '' };
  }

  return {
    street: streetPart,
    number,
  };
}

function pickStreets(parts, venue) {
  const mainCandidates = [];
  const sokCandidates = [];
  const fallbackCandidates = [];
  const cityCanonical = normalizeForCompare(venue.city);
  const districtCanonical = normalizeForCompare(venue.district);

  parts.forEach((part) => {
    const cleaned = normalizeText(part);
    if (!cleaned) {
      return;
    }

    const canonical = normalizeForCompare(cleaned);
    if (canonical === cityCanonical || canonical === districtCanonical) {
      return;
    }

    if (cleaned.includes('/')) {
      return;
    }

    if (caddeTokenPattern.test(cleaned)) {
      mainCandidates.push(cleaned);
      return;
    }

    if (sokakTokenPattern.test(cleaned)) {
      sokCandidates.push(cleaned);
      return;
    }

    fallbackCandidates.push(cleaned);
  });

  let mainStreet = mainCandidates[0] || sokCandidates[0] || fallbackCandidates[0] || 'Adres';
  let secondaryStreet = '';

  if (mainCandidates.length && sokCandidates.length) {
    secondaryStreet = sokCandidates[0];
  }

  if (secondaryStreet && normalizeForCompare(secondaryStreet) === normalizeForCompare(mainStreet)) {
    secondaryStreet = '';
  }

  mainStreet = normalizeStreetToken(mainStreet, 'Cad.');
  secondaryStreet = secondaryStreet ? normalizeStreetToken(secondaryStreet, 'Sok.') : '';
  if (/^Adres (Cad\.|Sok\.|Blv\.|Yolu)$/u.test(secondaryStreet)) {
    secondaryStreet = '';
  }

  return {
    mainStreet,
    secondaryStreet,
  };
}

function districtCityFromVenue(venue) {
  const district = toTitleCaseTr(normalizeText(venue.district || 'Merkez')) || 'Merkez';
  const city = toTitleCaseTr(normalizeText(venue.city || 'Türkiye')) || 'Türkiye';
  return `${district}/${city}`;
}

function normalizeAddressToStrictFormat(venue) {
  const rawAddress = normalizeText(venue.address);
  if (!rawAddress) {
    return `${normalizeMahalleName('Merkez')}, Adres Cad. No:00 00000 ${districtCityFromVenue(venue)}.`;
  }

  if (strictFormatPattern.test(rawAddress)) {
    return rawAddress;
  }

  const originalParts = splitAddressParts(rawAddress);
  const { postalCode, parts: partsWithoutPostCode } = extractPostCode(originalParts, rawAddress);

  const mahallePick = pickMahalle(partsWithoutPostCode, venue);
  const partsAfterMahalle = removePartAt(partsWithoutPostCode, mahallePick.index);

  const { number: extractedNo, parts: partsAfterNo } = extractNo(partsAfterMahalle);
  const { mainStreet: rawMainStreet, secondaryStreet } = pickStreets(partsAfterNo, venue);

  const mainStreetNoSplit = extractTrailingNumber(rawMainStreet);
  const mainStreet = normalizeStreetToken(mainStreetNoSplit.street || rawMainStreet || 'Adres', 'Cad.');

  let houseNumber = extractedNo || mainStreetNoSplit.number || '00';
  houseNumber = normalizeText(houseNumber).replace(/^NO\s*:?\s*/iu, '').trim();
  if (!houseNumber) {
    houseNumber = '00';
  }
  houseNumber = houseNumber.replace(/^(\d+)\s+([A-Za-zÇĞİÖŞÜçğıöşü])$/u, '$1/$2');
  houseNumber = houseNumber
    .toLocaleUpperCase('tr')
    .replace(/\s+/g, '')
    .replace(/[^0-9A-ZÇĞİÖŞÜ\/-]/gu, '');
  houseNumber = houseNumber.replace(/^\/+|\/+$/g, '');
  if (!houseNumber) {
    houseNumber = '00';
  }

  const districtCity = districtCityFromVenue(venue);
  let mahalle = mahallePick.mahalle || 'Merkez Mah.';
  let normalizedPostalCode = postalCode;

  if (
    /silah[şs][oö]r/iu.test(rawAddress) &&
    normalizeForCompare(venue.city) === 'istanbul' &&
    normalizeForCompare(venue.district) === 'sisli'
  ) {
    mahalle = 'Cumhuriyet Mah.';
    houseNumber = houseNumber || '00';
    normalizedPostalCode = '34380';
  }

  const streetWithOptionalSok = secondaryStreet
    ? `${mainStreet} (${secondaryStreet})`
    : mainStreet;

  return `${mahalle}, ${streetWithOptionalSok} No:${houseNumber} ${normalizedPostalCode} ${districtCity}.`
    .replace(/\b(Cad|Sok|Blv)\.\./gu, '$1.')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
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

    const before = normalizeText(venue.address);
    const after = normalizeAddressToStrictFormat({
      city: normalizeText(venue.city),
      district: normalizeText(venue.district),
      address: before,
    });

    if (!after || after === before) {
      return;
    }

    venue.address = after;
    changedCount += 1;

    if (examples.length < 25) {
      examples.push({
        city: normalizeText(venue.city),
        district: normalizeText(venue.district),
        name: normalizeText(venue.name),
        before,
        after,
      });
    }
  });

  console.log(`Toplam kayit: ${venues.length}`);
  console.log(`Donusen adres sayisi: ${changedCount}`);
  examples.forEach((item) => {
    console.log(`- ${item.city}/${item.district} | ${item.name}`);
    console.log(`  once: ${item.before}`);
    console.log(`  sonra: ${item.after}`);
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
