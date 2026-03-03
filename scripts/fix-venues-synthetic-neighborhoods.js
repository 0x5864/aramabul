#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TARGETS = [
  path.resolve(__dirname, '../data/venues.json'),
  path.resolve(__dirname, '../android_app/assets/web/data/venues.json'),
];

const GENERIC_PARTS = [
  'cad',
  'cadd',
  'cd',
  'sok',
  'sk',
  'blv',
  'bulvar',
  'bulv',
  'yol',
  'yolu',
  'otoyol',
  'otel',
  'apt',
  'apart',
  'apartman',
  'avm',
  'terminal',
  'park',
  'kat',
  'mevki',
  'mevkii',
  'karsisi',
  'karsısi',
  'karşısı',
  'karsi',
  'merkezi',
  'site',
  'sitesi',
  'küme',
  'kume',
  'köy',
  'koy',
  'köyü',
  'koyu',
  'kasabasi',
  'kasabası',
  'beldesi',
  'belediyesi',
  'osb',
  'organize',
  'yani',
  'yanı',
  'alti',
  'altı',
  'blok',
  'is merkezi',
  'iş merkezi',
  'mahalle',
  'mahallesi',
  'merkez',
];

const BUSINESS_PARTS = [
  'restaurant',
  'restoran',
  'lokanta',
  'kebap',
  'kofte',
  'köfte',
  'cafe',
  'kahvalti',
  'kahvaltı',
  'pide',
  'doner',
  'döner',
  'cigkofte',
  'çiğköfte',
  'salon',
  'salonu',
  'bistro',
  'pastane',
  'pansiyon',
  'otel',
  'tesisi',
  'tesisleri',
];

function fold(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9\u00c0-\u024f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCase(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^\d+[./-]?$/.test(word)) {
        return word;
      }

      return `${word.charAt(0).toLocaleUpperCase('tr')}${word.slice(1)}`;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSyntheticNeighborhood(value) {
  const text = String(value || '').trim();
  return /\/.+\s+Mah\.?$/u.test(text);
}

function localityKey(record) {
  return `${fold(record.city)}|${fold(record.district)}`;
}

function stripLeadingLabels(value) {
  return String(value || '')
    .replace(/^[\s:./-]+/u, '')
    .replace(/^(?:no|d)(?:\s*[:.]|\s+)\s*/iu, '')
    .trim();
}

function normalizeCandidateCore(value) {
  return stripLeadingLabels(value)
    .replace(/\b(mahalle(si)?|mah\.?|mh\.?)$/iu, '')
    .replace(/[.]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericPart(value) {
  const text = fold(value);
  if (!text) {
    return true;
  }

  const tokens = text.split(/\s+/).filter(Boolean);

  return GENERIC_PARTS.some((part) => {
    const partTokens = part.split(/\s+/).filter(Boolean);
    if (partTokens.length === 0) {
      return false;
    }

    if (partTokens.length === 1) {
      return tokens.includes(partTokens[0]);
    }

    for (let index = 0; index <= tokens.length - partTokens.length; index += 1) {
      if (partTokens.every((token, offset) => tokens[index + offset] === token)) {
        return true;
      }
    }

    return false;
  });
}

function isBusinessPart(value) {
  const text = fold(value);
  if (!text) {
    return false;
  }

  const tokens = text.split(/\s+/).filter(Boolean);

  return BUSINESS_PARTS.some((part) => {
    const partTokens = part.split(/\s+/).filter(Boolean);
    if (partTokens.length === 0) {
      return false;
    }

    if (partTokens.length === 1) {
      return tokens.includes(partTokens[0]);
    }

    for (let index = 0; index <= tokens.length - partTokens.length; index += 1) {
      if (partTokens.every((token, offset) => tokens[index + offset] === token)) {
        return true;
      }
    }

    return false;
  });
}

function matchesLocationName(candidate, record) {
  const text = fold(candidate);
  const city = fold(record.city);
  const district = fold(record.district);

  if (!text) {
    return true;
  }

  return (
    text === city ||
    text === district ||
    text === `${city} merkez` ||
    text === `${district} ${city}` ||
    text === `${city} ${district}`
  );
}

function looksLikeCandidate(value, record) {
  const text = normalizeCandidateCore(value);
  if (!text) {
    return false;
  }

  if (text.length < 2 || text.length > 42) {
    return false;
  }

  if (/[/:]/u.test(text)) {
    return false;
  }

  if (/[+]/u.test(text)) {
    return false;
  }

  if (/^\d+$/u.test(text)) {
    return false;
  }

  if (/^(?:[a-zçğıöşü]+\d+|\d+[a-zçğıöşü]+)$/iu.test(text)) {
    return false;
  }

  if (!/[\p{L}]/u.test(text)) {
    return false;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount > 3) {
    return false;
  }

  if (isGenericPart(text)) {
    return false;
  }

  if (isBusinessPart(text)) {
    return false;
  }

  if (matchesLocationName(text, record)) {
    return false;
  }

  return true;
}

function buildKnownNeighborhoodLookup(records) {
  const lookup = new Map();

  for (const record of records) {
    if (!record.neighborhood || isSyntheticNeighborhood(record.neighborhood)) {
      continue;
    }

    const key = localityKey(record);
    const core = normalizeCandidateCore(record.neighborhood);
    const foldedCore = fold(core);
    if (!foldedCore) {
      continue;
    }

    if (!lookup.has(key)) {
      lookup.set(key, new Map());
    }

    const options = lookup.get(key);
    const current = options.get(foldedCore) || { label: `${toTitleCase(core)} Mah.`, count: 0 };
    current.count += 1;
    options.set(foldedCore, current);
  }

  return lookup;
}

function knownNeighborhoodFromAddress(record, knownNeighborhoods) {
  const parts = String(record.address || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const localKnown = knownNeighborhoods.get(localityKey(record));
  if (!localKnown) {
    return '';
  }

  for (const part of parts.slice(0, 2)) {
    if (!looksLikeCandidate(part, record)) {
      continue;
    }

    const core = normalizeCandidateCore(part);
    const known = localKnown.get(fold(core));
    if (!known) {
      continue;
    }

    return known.label;
  }

  return '';
}

function knownNeighborhoodFromAddressAliases(record, knownNeighborhoods) {
  const localKnown = knownNeighborhoods.get(localityKey(record));
  if (!localKnown) {
    return '';
  }

  const parts = String(record.address || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts.slice(0, 3)) {
    for (const text of trimmedPartVariants(part)) {
      const folded = fold(text);
      if (!folded) {
        continue;
      }

      const special = specialAddressAlias(record, folded, localKnown);
      if (special) {
        return special.label;
      }

      const direct = lookupKnownNeighborhood(localKnown, text);
      const directWordCount = text.split(/\s+/).filter(Boolean).length;
      if (direct && directWordCount >= 2 && looksLikeKnownPhrase(text, record)) {
        return direct.label;
      }

      if (/\b(?:bahcesehir|başakşehir)\s+\d+\s+k[ıi]s[ıi]m\b/u.test(folded)) {
        const kisim = localKnown.get('kısım') || localKnown.get('kisim');
        if (kisim) {
          return kisim.label;
        }
      }

      if (/\bbasaksehir\s+\d+\s+etap\b/u.test(folded) || /\bbaşakşehir\s+\d+\s+etap\b/u.test(folded)) {
        const etap = localKnown.get('etap');
        if (etap) {
          return etap.label;
        }
      }
    }
  }

  return '';
}

function phraseCandidates(value) {
  const words = normalizeCandidateCore(value)
    .split(/\s+/)
    .filter(Boolean);
  const results = [];

  for (let size = Math.min(3, words.length); size >= 1; size -= 1) {
    for (let start = 0; start <= words.length - size; start += 1) {
      results.push(words.slice(start, start + size).join(' '));
    }
  }

  return results;
}

function lookupKnownNeighborhood(localKnown, phrase) {
  const direct = localKnown.get(fold(phrase));
  if (direct) {
    return direct;
  }

  const compact = localKnown.get(fold(String(phrase || '').replace(/\s+/g, '')));
  if (compact) {
    return compact;
  }

  return null;
}

function trimmedPartVariants(value) {
  const base = normalizeCandidateCore(value);
  const variants = new Set([base]);
  const noTail = base
    .replace(/\b(?:no|numara)\b.*$/iu, '')
    .replace(/\b(?:blok|bina|dükkan|dukkan)\b.*$/iu, '')
    .replace(/[.:/-]+\s*$/u, '')
    .trim();

  if (noTail) {
    variants.add(noTail);
  }

  return Array.from(variants).filter(Boolean);
}

function specialAddressAlias(record, foldedText, localKnown) {
  const key = localityKey(record);

  if (key === 'izmir|cesme' || key === 'ızmir|cesme') {
    if (/^16\s+eyl[üu]l$/u.test(foldedText)) {
      return { label: '16 Eylül Mah.' };
    }
  }

  if (key === 'istanbul|basaksehir' || key === 'ıstanbul|basaksehir') {
    if (/\bbahcesehir\s+\d+\s+k[ıi]s[ıi]m\b/u.test(foldedText)) {
      return localKnown.get('kısım') || localKnown.get('kisim') || { label: 'Kısım Mah.' };
    }

    if (/\bbasaksehir\s+\d+\s+etap\b/u.test(foldedText)) {
      return localKnown.get('etap') || { label: 'Etap Mah.' };
    }
  }

  return null;
}

function looksLikeKnownPhrase(phrase, record) {
  const text = normalizeCandidateCore(phrase);
  if (!text) {
    return false;
  }

  if (!/[\p{L}]/u.test(text)) {
    return false;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount > 3) {
    return false;
  }

  if (matchesLocationName(text, record)) {
    return false;
  }

  if (wordCount === 1 && isGenericPart(text)) {
    return false;
  }

  return true;
}

function knownNeighborhoodFromSynthetic(record, knownNeighborhoods) {
  const localKnown = knownNeighborhoods.get(localityKey(record));
  if (!localKnown) {
    return '';
  }

  const rawCore = String(record.neighborhood || '')
    .replace(/\b(mahalle(si)?|mah\.?|mh\.?)$/iu, '')
    .trim();

  const segments = rawCore
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    for (const phrase of phraseCandidates(segment)) {
      if (!looksLikeCandidate(phrase, record)) {
        continue;
      }

      const known = localKnown.get(fold(phrase));
      if (known) {
        return known.label;
      }
    }
  }

  return '';
}

function findNeighborhoodCandidate(record, knownNeighborhoods) {
  const fromSynthetic = knownNeighborhoodFromSynthetic(record, knownNeighborhoods);
  if (fromSynthetic) {
    return fromSynthetic;
  }

  const fromAddress = knownNeighborhoodFromAddress(record, knownNeighborhoods);
  if (fromAddress) {
    return fromAddress;
  }

  return knownNeighborhoodFromAddressAliases(record, knownNeighborhoods);
}

function applyFixes(targetPath, dryRun) {
  const records = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const knownNeighborhoods = buildKnownNeighborhoodLookup(records);
  let changed = 0;

  for (const record of records) {
    if (!isSyntheticNeighborhood(record.neighborhood)) {
      continue;
    }

    const candidate = findNeighborhoodCandidate(record, knownNeighborhoods);
    if (!candidate || candidate === record.neighborhood) {
      continue;
    }

    record.neighborhood = candidate;
    changed += 1;
  }

  if (!dryRun && changed > 0) {
    fs.writeFileSync(targetPath, `${JSON.stringify(records, null, 2)}\n`);
  }

  return changed;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targets = args.filter((arg) => arg !== '--dry-run');
  const resolvedTargets = targets.length > 0 ? targets.map((item) => path.resolve(item)) : DEFAULT_TARGETS;

  for (const targetPath of resolvedTargets) {
    const changed = applyFixes(targetPath, dryRun);
    console.log(`${path.relative(process.cwd(), targetPath)}: ${changed} ${dryRun ? 'matched' : 'updated'}`);
  }
}

main();
