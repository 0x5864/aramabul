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

  return GENERIC_PARTS.some((part) => text.includes(part));
}

function isBusinessPart(value) {
  const text = fold(value);
  if (!text) {
    return false;
  }

  return BUSINESS_PARTS.some((part) => text.includes(part));
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

function findNeighborhoodCandidate(record) {
  const parts = String(record.address || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts.slice(0, 2)) {
    if (!looksLikeCandidate(part, record)) {
      continue;
    }

    return `${toTitleCase(normalizeCandidateCore(part))} Mah.`;
  }

  return '';
}

function applyFixes(targetPath, dryRun) {
  const records = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  let changed = 0;

  for (const record of records) {
    if (!isSyntheticNeighborhood(record.neighborhood)) {
      continue;
    }

    const candidate = findNeighborhoodCandidate(record);
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
