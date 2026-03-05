#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const ANDROID_DATA_DIR = path.join(ROOT, "android_app", "assets", "web", "data");

const SOURCE_URL = "https://www.ktb.gov.tr/genel/searchhotelgenel.aspx?lang=tr";

const STAR_FILES = [
  { stars: 5, file: "gezi-oteller-5-yildiz.json", title: "5 Yildizli Oteller" },
  { stars: 4, file: "gezi-oteller-4-yildiz.json", title: "4 Yildizli Oteller" },
  { stars: 3, file: "gezi-oteller-3-yildiz.json", title: "3 Yildizli Oteller" },
  { stars: 2, file: "gezi-oteller-2-yildiz.json", title: "2 Yildizli Oteller" },
  { stars: 1, file: "gezi-oteller-1-yildiz.json", title: "1 Yildizli Oteller" },
];

const MERGED_OTHER_FILE = "gezi-oteller-diger.json";
const KTB_OUTPUT_FILE = "ktb-oteller-yildizli.json";
const REPORT_FILE = "ktb-oteller-yildiz-senkron-raporu.json";

const TURKISH_ASCII_MAP = {
  C: "C",
  G: "G",
  I: "I",
  O: "O",
  S: "S",
  U: "U",
  c: "c",
  g: "g",
  i: "i",
  o: "o",
  s: "s",
  u: "u",
  "Ç": "C",
  "Ğ": "G",
  "İ": "I",
  "I": "I",
  "Ö": "O",
  "Ş": "S",
  "Ü": "U",
  "ç": "c",
  "ğ": "g",
  "ı": "i",
  "ö": "o",
  "ş": "s",
  "ü": "u",
};

const LODGING_TYPE_TOKENS = [
  "OTEL",
  "HOTEL",
  "TATIL KOYU",
  "MOTEL",
  "PANSIYON",
  "APART OTEL",
  "APART",
  "KONAKLAMA",
  "TERMAL TESIS",
  "SAGLIKLI YASAM TESISI",
  "TURIZM KOMPLEKSI",
];

const NAME_IGNORED_TOKENS = new Set([
  "OTEL",
  "OTELI",
  "HOTEL",
  "HOTELS",
  "RESORT",
  "RESORTS",
  "SPA",
  "THE",
  "BY",
  "VE",
  "AND",
  "SUITE",
  "SUITES",
  "TATIL",
  "KOYU",
  "PANSIYON",
  "MOTEL",
  "APART",
  "KONAKLAMA",
  "TESISI",
  "TESISI",
]);

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, payload) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForMatch(value) {
  return normalizeText(value)
    .replace(/[ÇĞİIÖŞÜçğıiöşü]/g, (char) => TURKISH_ASCII_MAP[char] || char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function toTitleCaseTr(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  return text
    .toLocaleLowerCase("tr")
    .split(" ")
    .map((token) => token.charAt(0).toLocaleUpperCase("tr") + token.slice(1))
    .join(" ");
}

function extractJsonDataArray(html) {
  const marker = "var jsondata";
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error("KTB jsondata dizisi bulunamadi");
  }

  const arrayStart = html.indexOf("[", markerIndex);
  if (arrayStart < 0) {
    throw new Error("KTB jsondata baslangici bulunamadi");
  }

  let inString = false;
  let escaped = false;
  let depth = 0;
  let arrayEnd = -1;

  for (let i = arrayStart; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "[") {
      depth += 1;
      continue;
    }

    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd < 0) {
    throw new Error("KTB jsondata bitisi bulunamadi");
  }

  return JSON.parse(html.slice(arrayStart, arrayEnd + 1));
}

function extractStarsFromClass(tesisSinifi) {
  const normalized = normalizeForMatch(tesisSinifi);
  if (!normalized) {
    return [];
  }

  const stars = [];
  const matcher = normalized.matchAll(/([1-5])\s*YILDIZLI/g);
  for (const match of matcher) {
    const star = Number.parseInt(match[1], 10);
    if (!Number.isNaN(star) && !stars.includes(star)) {
      stars.push(star);
    }
  }

  return stars.sort((a, b) => b - a);
}

function isLodgingType(record) {
  const type = normalizeForMatch(record.tesisTuru);
  if (!type) {
    return false;
  }
  return LODGING_TYPE_TOKENS.some((token) => type.includes(token));
}

function buildNameSignature(name) {
  const tokens = normalizeForMatch(name).split(" ").filter(Boolean);
  const filtered = tokens.filter((token) => !NAME_IGNORED_TOKENS.has(token));
  const effective = filtered.length ? filtered : tokens;
  const uniqueSorted = [...new Set(effective)].sort();
  return uniqueSorted.join(" ");
}

function buildMatchKeys(venue) {
  const city = normalizeForMatch(venue.city);
  const district = normalizeForMatch(venue.district || "Merkez");
  const signature = buildNameSignature(venue.name) || normalizeForMatch(venue.name);
  const strict = `${city}|${district}|${signature}`;
  const loose = `${city}|${signature}`;
  return { strict, loose };
}

function buildVenueScore(venue) {
  let score = 0;
  if (String(venue.phone || "").trim()) score += 3;
  if (String(venue.website || "").trim()) score += 3;
  if (String(venue.mapsUrl || "").trim()) score += 2;
  if (String(venue.neighborhood || "").trim()) score += 1;
  if (String(venue.postalCode || "").trim()) score += 1;
  const address = String(venue.address || "").trim();
  if (address && !address.endsWith(", Türkiye")) score += 2;
  if (String(venue.source || "").trim().toLowerCase() === "turob") score += 1;
  return score;
}

function compareByLocationAndName(left, right) {
  const cityCompare = String(left.city || "").localeCompare(String(right.city || ""), "tr");
  if (cityCompare !== 0) return cityCompare;
  const districtCompare = String(left.district || "").localeCompare(String(right.district || ""), "tr");
  if (districtCompare !== 0) return districtCompare;
  return String(left.name || "").localeCompare(String(right.name || ""), "tr");
}

function dedupeAndSort(records) {
  const unique = new Map();

  records.forEach((record) => {
    const keys = buildMatchKeys(record);
    const mapKey = keys.strict;
    const current = unique.get(mapKey);
    if (!current) {
      unique.set(mapKey, record);
      return;
    }
    const currentScore = buildVenueScore(current);
    const nextScore = buildVenueScore(record);
    if (nextScore > currentScore) {
      unique.set(mapKey, record);
    }
  });

  return [...unique.values()].sort(compareByLocationAndName);
}

function mapKtbRecordToVenue(record, stars) {
  const city = toTitleCaseTr(record.sehir);
  const district = toTitleCaseTr(record.ilce) || "Merkez";
  const name = normalizeText(record.tesisAdi);
  if (!city || !name) {
    return null;
  }

  return {
    city,
    district,
    name,
    cuisine: "Otel",
    address: [city, district, "Türkiye"].filter(Boolean).join(", "),
    neighborhood: "",
    postalCode: "",
    mapsUrl: "",
    website: "",
    phone: "",
    photoUrl: "",
    editorialSummary: "KTB resmi tesis kaydından (searchhotelgenel) eklendi.",
    sourcePlaceId: "",
    source: "ktb",
    stars,
    sourceBelgeNo: normalizeText(record.belgeNo),
    sourceBelgeTuru: normalizeText(record.belgeTuru),
    sourceBelgeDurumu: normalizeText(record.belgeDurumu),
    sourceTesisTuru: normalizeText(record.tesisTuru),
    sourceTesisSinifi: normalizeText(record.tesisSinifi),
  };
}

function toCategoryVenue(venue) {
  return {
    city: venue.city,
    district: venue.district,
    name: venue.name,
    cuisine: venue.cuisine,
    address: venue.address,
    neighborhood: venue.neighborhood,
    postalCode: venue.postalCode,
    mapsUrl: venue.mapsUrl,
    website: venue.website,
    phone: venue.phone,
    photoUrl: venue.photoUrl,
    editorialSummary: venue.editorialSummary,
    sourcePlaceId: venue.sourcePlaceId,
    source: venue.source,
    stars: venue.stars,
  };
}

function toKtbOutputVenue(venue) {
  return {
    ...toCategoryVenue(venue),
    sourceBelgeNo: venue.sourceBelgeNo,
    sourceBelgeTuru: venue.sourceBelgeTuru,
    sourceBelgeDurumu: venue.sourceBelgeDurumu,
    sourceTesisTuru: venue.sourceTesisTuru,
    sourceTesisSinifi: venue.sourceTesisSinifi,
  };
}

function pushToMapList(map, key, value) {
  const current = map.get(key) || [];
  current.push(value);
  map.set(key, current);
}

function addVenueToIndex(index, star, venue) {
  const keys = buildMatchKeys(venue);
  const payload = { star, venue };
  pushToMapList(index.strict, keys.strict, payload);
  pushToMapList(index.loose, keys.loose, payload);
}

function buildIndex(starBuckets) {
  const index = {
    strict: new Map(),
    loose: new Map(),
  };

  STAR_FILES.forEach((config) => {
    const records = starBuckets.get(config.stars) || [];
    records.forEach((record) => {
      addVenueToIndex(index, config.stars, record);
    });
  });

  return index;
}

function findExistingMatch(index, venue) {
  const keys = buildMatchKeys(venue);
  const strictMatches = index.strict.get(keys.strict) || [];
  const looseMatches = index.loose.get(keys.loose) || [];

  const sameStarStrict = strictMatches.find((item) => item.star === venue.stars);
  if (sameStarStrict) {
    return { ...sameStarStrict, matchLevel: "strict" };
  }

  const sameStarLoose = looseMatches.find((item) => item.star === venue.stars);
  if (sameStarLoose) {
    return { ...sameStarLoose, matchLevel: "loose" };
  }

  if (strictMatches.length) {
    return { ...strictMatches[0], matchLevel: "strict" };
  }

  if (looseMatches.length) {
    return { ...looseMatches[0], matchLevel: "loose" };
  }

  return null;
}

function loadStarBuckets() {
  const buckets = new Map();
  STAR_FILES.forEach((config) => {
    const filePath = path.join(DATA_DIR, config.file);
    const records = readJson(filePath);
    buckets.set(config.stars, dedupeAndSort(records));
  });
  return buckets;
}

function mergeOtherCategory(starBuckets) {
  const oneStar = starBuckets.get(1) || [];
  const twoStar = starBuckets.get(2) || [];
  return dedupeAndSort([...twoStar, ...oneStar]);
}

async function fetchSourceHtml() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      pragma: "no-cache",
      "cache-control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function main() {
  const startedAt = new Date().toISOString();
  process.stdout.write(`[ktb-sync] basladi: ${startedAt}\n`);
  process.stdout.write(`[ktb-sync] kaynak: ${SOURCE_URL}\n`);

  const starBuckets = loadStarBuckets();
  const sourceHtml = await fetchSourceHtml();
  const sourceRecords = extractJsonDataArray(sourceHtml);
  process.stdout.write(`[ktb-sync] ham kayit: ${sourceRecords.length}\n`);

  let nonLodgingSkipped = 0;
  let noStarSkipped = 0;
  let multiStarRecords = 0;
  const rawCandidates = [];

  sourceRecords.forEach((record) => {
    if (!isLodgingType(record)) {
      nonLodgingSkipped += 1;
      return;
    }

    const stars = extractStarsFromClass(record.tesisSinifi);
    if (!stars.length) {
      noStarSkipped += 1;
      return;
    }

    if (stars.length > 1) {
      multiStarRecords += 1;
    }

    const primaryStar = stars[0];
    const mapped = mapKtbRecordToVenue(record, primaryStar);
    if (mapped) {
      rawCandidates.push(mapped);
    }
  });

  const uniqueCandidateMap = new Map();
  rawCandidates.forEach((candidate) => {
    const keys = buildMatchKeys(candidate);
    const key = `${candidate.stars}|${keys.strict}`;
    const current = uniqueCandidateMap.get(key);
    if (!current) {
      uniqueCandidateMap.set(key, candidate);
      return;
    }

    const currentNameLength = normalizeText(current.name).length;
    const nextNameLength = normalizeText(candidate.name).length;
    if (nextNameLength < currentNameLength) {
      uniqueCandidateMap.set(key, candidate);
    }
  });

  const candidates = [...uniqueCandidateMap.values()].sort(compareByLocationAndName);
  process.stdout.write(`[ktb-sync] aday (tekil): ${candidates.length}\n`);

  const index = buildIndex(starBuckets);
  const overlapSameStar = [];
  const overlapDifferentStar = [];
  const addedFromKtb = [];

  candidates.forEach((candidate) => {
    const matched = findExistingMatch(index, candidate);
    if (matched) {
      if (matched.star === candidate.stars) {
        overlapSameStar.push(candidate);
      } else {
        overlapDifferentStar.push({
          candidate: toKtbOutputVenue(candidate),
          matchedStar: matched.star,
          matchedVenue: {
            city: matched.venue.city,
            district: matched.venue.district,
            name: matched.venue.name,
          },
          matchLevel: matched.matchLevel,
        });
      }
      return;
    }

    const categoryVenue = toCategoryVenue(candidate);
    const currentBucket = starBuckets.get(candidate.stars) || [];
    currentBucket.push(categoryVenue);
    starBuckets.set(candidate.stars, currentBucket);
    addVenueToIndex(index, candidate.stars, categoryVenue);
    addedFromKtb.push(candidate);
  });

  const categoryReport = [];
  STAR_FILES.forEach((config) => {
    const records = dedupeAndSort(starBuckets.get(config.stars) || []);
    starBuckets.set(config.stars, records);

    const outputFile = path.join(DATA_DIR, config.file);
    const outputAndroidFile = path.join(ANDROID_DATA_DIR, config.file);
    writeJson(outputFile, records);
    writeJson(outputAndroidFile, records);

    categoryReport.push({
      stars: config.stars,
      title: config.title,
      count: records.length,
      file: config.file,
    });
  });

  const mergedOther = mergeOtherCategory(starBuckets);
  writeJson(path.join(DATA_DIR, MERGED_OTHER_FILE), mergedOther);
  writeJson(path.join(ANDROID_DATA_DIR, MERGED_OTHER_FILE), mergedOther);

  const cleanedKtbRecords = addedFromKtb.map(toKtbOutputVenue).sort(compareByLocationAndName);
  writeJson(path.join(DATA_DIR, KTB_OUTPUT_FILE), cleanedKtbRecords);
  writeJson(path.join(ANDROID_DATA_DIR, KTB_OUTPUT_FILE), cleanedKtbRecords);

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    sourceTotalCount: sourceRecords.length,
    nonLodgingSkipped,
    noStarSkipped,
    multiStarRecords,
    candidateCountBeforeDedupe: rawCandidates.length,
    candidateCountAfterDedupe: candidates.length,
    overlapSameStarCount: overlapSameStar.length,
    overlapDifferentStarCount: overlapDifferentStar.length,
    addedToCategoriesCount: addedFromKtb.length,
    mergedOtherCount: mergedOther.length,
    cleanedKtbCount: cleanedKtbRecords.length,
    categories: categoryReport,
    sample: {
      overlapSameStar: overlapSameStar.slice(0, 25).map(toKtbOutputVenue),
      overlapDifferentStar: overlapDifferentStar.slice(0, 25),
      addedToCategories: cleanedKtbRecords.slice(0, 25),
    },
    outputFiles: [
      path.join(DATA_DIR, KTB_OUTPUT_FILE),
      path.join(ANDROID_DATA_DIR, KTB_OUTPUT_FILE),
      path.join(DATA_DIR, MERGED_OTHER_FILE),
      path.join(ANDROID_DATA_DIR, MERGED_OTHER_FILE),
      ...STAR_FILES.flatMap((config) => [
        path.join(DATA_DIR, config.file),
        path.join(ANDROID_DATA_DIR, config.file),
      ]),
    ],
  };

  writeJson(path.join(DATA_DIR, REPORT_FILE), report);

  process.stdout.write(`[ktb-sync] cakisma (ayni yildiz): ${overlapSameStar.length}\n`);
  process.stdout.write(`[ktb-sync] cakisma (farkli yildiz): ${overlapDifferentStar.length}\n`);
  process.stdout.write(`[ktb-sync] kategoriye eklenen: ${addedFromKtb.length}\n`);
  process.stdout.write(`[ktb-sync] 1+2 yildiz birlesik: ${mergedOther.length}\n`);
  process.stdout.write(`[ktb-sync] ktb temiz veri: ${cleanedKtbRecords.length}\n`);
  process.stdout.write(`[ktb-sync] rapor: ${path.join(DATA_DIR, REPORT_FILE)}\n`);
}

main().catch((error) => {
  process.stderr.write(`[ktb-sync] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
