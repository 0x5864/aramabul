#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TARGETS = [
  path.resolve(__dirname, '../data/eczane.json'),
  path.resolve(__dirname, '../android_app/assets/web/data/eczane.json'),
];

const LOCALITY_CANDIDATE_TARGETS = new Map(
  [
    ['Adana', 'Çukurova', '100.yıl', 'Yüzüncüyıl Mah.'],
    ['Antalya', 'Manavgat', 'A.pazarcı', 'Aşağı Pazarcı Mah.'],
    ['Balıkesir', 'Merkez', '1.sakarya', 'Sakarya Mah.'],
    ['Balıkesir', 'Merkez', '2.gündoğan', 'Gündoğan Mah.'],
    ['Bursa', 'Nilüfer', '100.yıl', 'Yüzüncüyıl Mah.'],
    ['Edirne', 'Merkez', '1.murat', 'Birinci Murat Mah.'],
    ['Gaziantep', 'Şahinbey', '75.yıl', 'Yıl Mah.'],
    ['İstanbul', 'Sultangazi', '50.yıl', 'Ellinci Yıl Mah.'],
    ['Manisa', 'Merkez', '2.anafartalar', 'Anafartalar Mah.'],
    ['Tekirdağ', 'Süleymanpaşa', '100.yıl', 'Yıl Mah.'],
    ['Tokat', 'Niksar', 'G.o.p', 'Gaziosmanpaşa Mah.'],
  ].map(([city, district, candidate, target]) => [
    `${fold(city)}|${fold(district)}|${fold(normalizeCore(candidate))}`,
    target,
  ]),
);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fold(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9\u00c0-\u024f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCore(value) {
  return String(value || '')
    .replace(/\b(Mahallesi|Mah\.?|Mh\.?)\b/giu, '')
    .replace(/[.]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function localityKey(record) {
  return `${fold(record.city)}|${fold(record.district)}`;
}

function initialAliasVariants(text) {
  const words = fold(text).split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return [];
  }

  const variants = [];
  const initials = words.map((word) => word.charAt(0)).join(' ');
  variants.push(initials);

  if (words.length === 2) {
    variants.push(`${words[0].charAt(0)} ${words[1]}`);
  }

  if (words.length >= 3) {
    const headInitials = words.slice(0, -1).map((word) => word.charAt(0)).join(' ');
    variants.push(`${headInitials} ${words[words.length - 1]}`);
  }

  return variants;
}

function aliasVariants(value) {
  const core = normalizeCore(value);
  const base = fold(core);
  if (!base) {
    return [];
  }

  const compact = base.replace(/\s+/g, '');
  const variants = new Set([base, compact]);

  for (const variant of initialAliasVariants(core)) {
    if (!variant) {
      continue;
    }

    variants.add(variant);
    variants.add(variant.replace(/\s+/g, ''));
  }

  return [...variants];
}

function buildKnownNeighborhoods(records) {
  const lookup = new Map();

  for (const record of records) {
    if (!hasText(record.neighborhood)) {
      continue;
    }

    const key = localityKey(record);
    const label = String(record.neighborhood).trim();

    if (!lookup.has(key)) {
      lookup.set(key, new Map());
    }

    const localAliases = lookup.get(key);
    for (const alias of aliasVariants(label)) {
      const labels = localAliases.get(alias) || new Map();
      labels.set(label, (labels.get(label) || 0) + 1);
      localAliases.set(alias, labels);
    }
  }

  return lookup;
}

function buildKnownLabelLookup(records) {
  const lookup = new Map();

  for (const record of records) {
    if (!hasText(record.neighborhood)) {
      continue;
    }

    const key = localityKey(record);
    const foldedCore = fold(normalizeCore(record.neighborhood));
    if (!foldedCore) {
      continue;
    }

    if (!lookup.has(key)) {
      lookup.set(key, new Map());
    }

    const local = lookup.get(key);
    const labels = local.get(foldedCore) || new Map();
    const label = String(record.neighborhood).trim();
    labels.set(label, (labels.get(label) || 0) + 1);
    local.set(foldedCore, labels);
  }

  return lookup;
}

function resolveFromLocalityAlias(localLabels, locality, candidate) {
  if (!localLabels || !locality || !candidate) {
    return '';
  }

  const target = LOCALITY_CANDIDATE_TARGETS.get(`${locality}|${fold(candidate)}`);
  if (!target) {
    return '';
  }

  const labels = localLabels.get(fold(normalizeCore(target)));
  if (!labels || labels.size === 0) {
    return '';
  }

  return [...labels.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function resolveUniqueLabel(localAliases, localLabels, locality, candidate) {
  if (!localAliases || !candidate) {
    return '';
  }

  const matches = new Map();
  for (const alias of aliasVariants(candidate)) {
    const labels = localAliases.get(alias);
    if (!labels) {
      continue;
    }

    for (const [label, count] of labels.entries()) {
      matches.set(label, (matches.get(label) || 0) + count);
    }
  }

  if (matches.size !== 1) {
    return resolveFromLocalityAlias(localLabels, locality, candidate);
  }

  return [...matches.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function extractCandidate(address) {
  if (!hasText(address)) {
    return '';
  }

  const lead = String(address)
    .split('-')[0]
    .split(',')[0]
    .trim();
  const match = lead.match(/(.+?)\s+(Mahallesi|Mah\.?|Mh\.?)\b/iu);
  if (!match) {
    return '';
  }

  return normalizeCore(match[1]);
}

function applyFixes(targetPath, dryRun) {
  const records = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const knownNeighborhoods = buildKnownNeighborhoods(records);
  const knownLabels = buildKnownLabelLookup(records);
  let changed = 0;

  for (const record of records) {
    if (hasText(record.neighborhood)) {
      continue;
    }

    const candidate = extractCandidate(record.address);
    if (!candidate) {
      continue;
    }

    const locality = localityKey(record);
    const label = resolveUniqueLabel(
      knownNeighborhoods.get(locality),
      knownLabels.get(locality),
      locality,
      candidate,
    );
    if (!label) {
      continue;
    }

    record.neighborhood = label;
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
  const targets = args.filter((item) => item !== '--dry-run');
  const resolvedTargets = targets.length > 0 ? targets.map((item) => path.resolve(item)) : DEFAULT_TARGETS;

  for (const targetPath of resolvedTargets) {
    const changed = applyFixes(targetPath, dryRun);
    console.log(`${path.relative(process.cwd(), targetPath)}: ${changed} ${dryRun ? 'matched' : 'updated'}`);
  }
}

main();
