#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const ANDROID_DATA_DIR = path.join(ROOT, "android_app", "assets", "web", "data");
const SOURCE_URL = "https://www.ktb.gov.tr/genel/searchhotelgenel.aspx?lang=tr";
const REPORT_FILE = path.join(DATA_DIR, "ktb-mevcut-alt-kategori-ekleme-raporu.json");

const TARGET_FILES = {
  geziKamp: "gezi-kamp-alanlari.json",
  geziPansiyon: "ktb-pansiyon-ek-kayitlari.json",
  gezi5: "gezi-oteller-5-yildiz.json",
  gezi4: "gezi-oteller-4-yildiz.json",
  gezi3: "gezi-oteller-3-yildiz.json",
  geziDiger: "gezi-oteller-diger.json",
  geziButik: "gezi-butik-oteller.json",
  keyifMeyhane: "keyif.json",
  keyifRestoran: "keyif-restoran.json",
};

const TURKISH_ASCII_MAP = {
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
  "i": "i",
  "ö": "o",
  "ş": "s",
  "ü": "u",
};

const CAMPING_TYPE_TOKENS = [
  "CAMPING",
  "KAMPING",
  "KONAKLAMALI ORMAN PARKI",
  "KONAKLAMA AMACLI MESIRE YERI",
  "DAG EVI",
  "CIFTLIK EVI KOY EVI",
  "KIRSAL TURIZM TESISI",
  "KIS SPORLARI MEKANIK TESISI",
  "MOLA NOKTASI",
  "PLAJ",
  "YAT LIMANI",
  "YAT YANASMA YERI",
  "YAT CEKEK YERI",
  "RIHTIM VE ISKELE",
  "GUNUBIRLIK TESIS",
  "GASTRONOMI TESISI",
  "OZEL TESIS",
  "KONGRE VE SERGI MERKEZI",
];

const LODGING_TYPE_TOKENS = [
  "OTEL",
  "HOTEL",
  "APART OTEL",
  "MOTEL",
  "TATIL KOYU",
  "OZEL KONAKLAMA TESISI",
  "TERMAL TESIS",
  "SAGLIKLI YASAM TESISI",
  "TURIZM KOMPLEKSI",
  "PERSONEL EGITIM TESISI",
  "GOLF TESISI",
];

const KEYIF_MEYHANE_TOKENS = [
  "EGLENCE YERI",
  "BAR",
  "KAHVEHANE",
  "YEME ICME TESISI",
  "KAFETERYA",
];

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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

function extractStars(tesisSinifi) {
  const normalized = normalizeForMatch(tesisSinifi);
  if (!normalized) {
    return [];
  }
  const stars = [];
  const matches = normalized.matchAll(/([1-5])\s*YILDIZLI/g);
  for (const match of matches) {
    const star = Number.parseInt(match[1], 10);
    if (!Number.isNaN(star) && !stars.includes(star)) {
      stars.push(star);
    }
  }
  return stars.sort((a, b) => b - a);
}

function includesAny(normalizedType, tokenList) {
  return tokenList.some((token) => normalizedType.includes(token));
}

function classifyRecord(record) {
  const type = normalizeForMatch(record.tesisTuru);
  const stars = extractStars(record.tesisSinifi);

  if (!type) {
    return null;
  }

  if (type.includes("LOKANTA")) {
    return "keyifRestoran";
  }

  if (includesAny(type, KEYIF_MEYHANE_TOKENS)) {
    return "keyifMeyhane";
  }

  if (type.includes("BUTIK OTEL")) {
    return "geziButik";
  }

  if (type.includes("PANSIYON")) {
    return "geziPansiyon";
  }

  if (includesAny(type, CAMPING_TYPE_TOKENS)) {
    return "geziKamp";
  }

  if (stars.includes(5)) {
    return "gezi5";
  }
  if (stars.includes(4)) {
    return "gezi4";
  }
  if (stars.includes(3)) {
    return "gezi3";
  }
  if (stars.includes(2) || stars.includes(1)) {
    return "geziDiger";
  }

  if (includesAny(type, LODGING_TYPE_TOKENS)) {
    return "geziDiger";
  }

  return "geziKamp";
}

function buildDedupKey(venue) {
  const city = normalizeForMatch(venue.city);
  const district = normalizeForMatch(venue.district);
  const name = normalizeForMatch(venue.name);
  return `${city}|${district}|${name}`;
}

function compareByLocationAndName(left, right) {
  const cityCompare = String(left.city || "").localeCompare(String(right.city || ""), "tr");
  if (cityCompare !== 0) return cityCompare;
  const districtCompare = String(left.district || "").localeCompare(String(right.district || ""), "tr");
  if (districtCompare !== 0) return districtCompare;
  return String(left.name || "").localeCompare(String(right.name || ""), "tr");
}

function toGeziVenue(record, cuisine, stars = null) {
  const city = toTitleCaseTr(record.sehir);
  const district = toTitleCaseTr(record.ilce) || "Merkez";
  const name = normalizeText(record.tesisAdi);
  if (!city || !name) {
    return null;
  }

  const payload = {
    city,
    district,
    name,
    cuisine,
    address: [city, district, "Türkiye"].join(", "),
    neighborhood: "",
    postalCode: "",
    mapsUrl: "",
    website: "",
    phone: "",
    photoUrl: "",
    editorialSummary: "KTB resmi tesis kaydından (searchhotelgenel) eklendi.",
    sourcePlaceId: "",
    source: "ktb",
  };

  if (stars && Number.isFinite(stars)) {
    payload.stars = stars;
  }

  return payload;
}

function toKeyifRestoranVenue(record) {
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
    address: [city, district, "Türkiye"].join(", "),
    cuisine: "Lokanta",
    placeId: "",
    mapsUrl: "",
    instagram: "",
    googleRating: null,
    rating: null,
    budget: "",
    website: "",
    phone: "",
    neighborhood: "",
    editorialSummary: "KTB resmi tesis kaydından (searchhotelgenel) eklendi.",
    source: "ktb",
  };
}

function toKeyifMeyhaneVenue(record) {
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
    address: [city, district, "Türkiye"].join(", "),
    cuisine: "Meyhane",
    placeId: "",
    mapsUrl: "",
    phone: "",
    website: "",
    neighborhood: "",
    editorialSummary: "KTB resmi tesis kaydından (searchhotelgenel) eklendi.",
    source: "ktb",
  };
}

function loadTargetBuckets() {
  const buckets = {};
  Object.entries(TARGET_FILES).forEach(([bucketKey, fileName]) => {
    const records = readJson(path.join(DATA_DIR, fileName));
    const keys = new Set(records.map((venue) => buildDedupKey(venue)));
    buckets[bucketKey] = {
      records: [...records],
      keys,
      additions: 0,
    };
  });
  return buckets;
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
  process.stdout.write(`[ktb-merge] basladi: ${startedAt}\n`);
  process.stdout.write(`[ktb-merge] kaynak: ${SOURCE_URL}\n`);

  const buckets = loadTargetBuckets();
  const sourceHtml = await fetchSourceHtml();
  const records = extractJsonDataArray(sourceHtml);
  process.stdout.write(`[ktb-merge] ham kayit: ${records.length}\n`);

  let skippedUnclassified = 0;
  let skippedInvalid = 0;

  records.forEach((record) => {
    const bucketKey = classifyRecord(record);
    if (!bucketKey || !buckets[bucketKey]) {
      skippedUnclassified += 1;
      return;
    }

    const stars = extractStars(record.tesisSinifi);
    const targetStar = stars.length ? stars[0] : null;
    const venue = bucketKey === "keyifRestoran"
      ? toKeyifRestoranVenue(record)
      : bucketKey === "keyifMeyhane"
        ? toKeyifMeyhaneVenue(record)
        : bucketKey === "gezi5" || bucketKey === "gezi4" || bucketKey === "gezi3" || bucketKey === "geziDiger"
          ? toGeziVenue(record, "Otel", targetStar)
          : bucketKey === "geziPansiyon"
            ? toGeziVenue(record, "Pansiyon")
            : bucketKey === "geziButik"
              ? toGeziVenue(record, "Butik Otel")
              : toGeziVenue(record, "Kamp Alanı");

    if (!venue) {
      skippedInvalid += 1;
      return;
    }

    const dedupKey = buildDedupKey(venue);
    if (buckets[bucketKey].keys.has(dedupKey)) {
      return;
    }

    buckets[bucketKey].keys.add(dedupKey);
    buckets[bucketKey].records.push(venue);
    buckets[bucketKey].additions += 1;
  });

  Object.entries(TARGET_FILES).forEach(([bucketKey, fileName]) => {
    const sorted = [...buckets[bucketKey].records].sort(compareByLocationAndName);
    writeJson(path.join(DATA_DIR, fileName), sorted);
    writeJson(path.join(ANDROID_DATA_DIR, fileName), sorted);
    buckets[bucketKey].records = sorted;
  });

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    sourceTotalCount: records.length,
    skippedUnclassified,
    skippedInvalid,
    additions: Object.fromEntries(
      Object.keys(TARGET_FILES).map((bucketKey) => [bucketKey, buckets[bucketKey].additions]),
    ),
    totals: Object.fromEntries(
      Object.keys(TARGET_FILES).map((bucketKey) => [bucketKey, buckets[bucketKey].records.length]),
    ),
    outputFiles: Object.fromEntries(
      Object.entries(TARGET_FILES).map(([bucketKey, fileName]) => [
        bucketKey,
        {
          web: path.join(DATA_DIR, fileName),
          android: path.join(ANDROID_DATA_DIR, fileName),
        },
      ]),
    ),
  };

  writeJson(REPORT_FILE, report);

  process.stdout.write(`[ktb-merge] eklendi: ${JSON.stringify(report.additions)}\n`);
  process.stdout.write(`[ktb-merge] toplam: ${JSON.stringify(report.totals)}\n`);
  process.stdout.write(`[ktb-merge] rapor: ${REPORT_FILE}\n`);
}

main().catch((error) => {
  process.stderr.write(`[ktb-merge] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
