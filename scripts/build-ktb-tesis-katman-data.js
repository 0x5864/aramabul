#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const ANDROID_DATA_DIR = path.join(ROOT, "android_app", "assets", "web", "data");
const SOURCE_URL = "https://www.ktb.gov.tr/genel/searchhotelgenel.aspx?lang=tr";

const OUTPUT_FILES = {
  geziVenues: "ktb-tesis-kayitlari-gezi.json",
  keyifVenues: "ktb-tesis-kayitlari-keyif.json",
  geziTypes: "ktb-tesis-turleri-gezi.json",
  keyifTypes: "ktb-tesis-turleri-keyif.json",
  allTypes: "ktb-tesis-turleri.json",
  report: "ktb-tesis-katman-raporu.json",
};

const MIN_TYPE_COUNT = Number.parseInt(process.env.KTB_MIN_DYNAMIC_TYPE_COUNT || "5", 10);
const DRY_RUN = process.argv.includes("--dry-run");

const TURKISH_ASCII_MAP = {
  "Ç": "C",
  "Ğ": "G",
  "İ": "I",
  I: "I",
  "Ö": "O",
  "Ş": "S",
  "Ü": "U",
  "ç": "c",
  "ğ": "g",
  "ı": "i",
  i: "i",
  "ö": "o",
  "ş": "s",
  "ü": "u",
};

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function normalizeTypeName(value) {
  const raw = normalizeText(value);
  const normalized = normalizeForMatch(raw);
  if (!raw || !normalized) {
    return "";
  }

  const compact = normalized.replace(/\s+/g, " ");
  if (compact === "OTEL" || compact === "HOTEL") return "Otel";
  if (compact === "PANSIYON") return "Pansiyon";
  if (compact === "APART OTEL") return "Apart Otel";
  if (compact === "BUTIK OTEL") return "Butik Otel";
  if (compact === "OZEL KONAKLAMA TESISI") return "Özel Konaklama Tesisi";
  if (compact === "GASTRONOMI TESISI") return "Gastronomi Tesisi";
  if (compact === "TATIL KOYU") return "Tatil Köyü";
  if (compact === "CAMPING" || compact === "KAMPING") return "Camping";
  if (compact === "MOTEL") return "Motel";
  if (compact === "PLAJ") return "Plaj";
  if (compact === "LOKANTA") return "Lokanta";
  if (compact === "OZEL TESIS") return "Özel Tesis";
  if (compact === "GUNUBIRLIK TESIS") return "Günübirlik Tesis";
  return toTitleCaseTr(raw);
}

function normalizeTypeForRule(value) {
  return normalizeForMatch(value).replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function isKeyifType(typeName) {
  const normalized = normalizeTypeForRule(typeName);
  if (!normalized) return false;
  if (/\bBAR\b/.test(normalized)) return true;
  if (/\bEGLENCE\b/.test(normalized)) return true;
  if (/\bLOKANTA\b/.test(normalized)) return true;
  if (/\bOBERJ\b/.test(normalized) && /\bKAFETERYA\b/.test(normalized)) return true;
  if (normalized.includes("OZEL KAHVEHANE")) return true;
  if (normalized.includes("OZEL YEME ICME TESISI")) return true;
  return false;
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

  for (let index = arrayStart; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }
    if (character === "[") {
      depth += 1;
      continue;
    }
    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = index;
        break;
      }
    }
  }

  if (arrayEnd < 0) {
    throw new Error("KTB jsondata bitisi bulunamadi");
  }

  return JSON.parse(html.slice(arrayStart, arrayEnd + 1));
}

function buildVenueFromRecord(record) {
  const city = toTitleCaseTr(record.sehir);
  const district = toTitleCaseTr(record.ilce) || "Merkez";
  const name = normalizeText(record.tesisAdi);
  const type = normalizeTypeName(record.tesisTuru);

  if (!city || !district || !name || !type) {
    return null;
  }

  const addressParts = [district, city, "Türkiye"].filter(Boolean);

  return {
    city,
    district,
    name,
    cuisine: type,
    address: addressParts.join(", "),
    neighborhood: "",
    postalCode: "",
    mapsUrl: "",
    website: "",
    phone: "",
    photoUrl: "",
    editorialSummary: "KTB resmi tesis kaydından (searchhotelgenel) eklendi.",
    sourcePlaceId: "",
    source: "ktb",
    sourceTesisTuru: type,
    sourceBelgeNo: normalizeText(record.belgeNo),
    sourceBelgeTuru: normalizeText(record.belgeTuru),
    sourceBelgeDurumu: normalizeText(record.belgeDurumu),
    sourceTesisSinifi: normalizeText(record.tesisSinifi),
  };
}

function dedupeVenues(venues) {
  const map = new Map();
  venues.forEach((venue) => {
    const key = [
      normalizeForMatch(venue.city),
      normalizeForMatch(venue.district),
      normalizeForMatch(venue.name),
      normalizeForMatch(venue.sourceTesisTuru),
    ].join("|");
    if (!map.has(key)) {
      map.set(key, venue);
    }
  });

  return [...map.values()].sort((left, right) => {
    const cityCompare = left.city.localeCompare(right.city, "tr");
    if (cityCompare !== 0) return cityCompare;
    const districtCompare = left.district.localeCompare(right.district, "tr");
    if (districtCompare !== 0) return districtCompare;
    return left.name.localeCompare(right.name, "tr");
  });
}

function buildTypeSummary(venues) {
  const map = new Map();
  venues.forEach((venue) => {
    const type = normalizeText(venue.sourceTesisTuru);
    if (!type) {
      return;
    }
    const key = normalizeForMatch(type);
    const current = map.get(key) || { type, count: 0 };
    current.count += 1;
    map.set(key, current);
  });

  return [...map.values()]
    .filter((item) => item.count >= MIN_TYPE_COUNT)
    .sort((left, right) => left.type.localeCompare(right.type, "tr"));
}

function writeJson(baseDir, fileName, payload) {
  const filePath = path.join(baseDir, fileName);
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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
  process.stdout.write(`[ktb-katman] basladi: ${startedAt}\n`);
  const html = await fetchSourceHtml();
  const records = extractJsonDataArray(html);
  process.stdout.write(`[ktb-katman] ham kayit: ${records.length}\n`);

  const mappedVenues = records
    .map((record) => buildVenueFromRecord(record))
    .filter(Boolean);
  const dedupedAllVenues = dedupeVenues(mappedVenues);

  const geziVenues = dedupedAllVenues.filter((venue) => !isKeyifType(venue.sourceTesisTuru));
  const keyifVenues = dedupedAllVenues.filter((venue) => isKeyifType(venue.sourceTesisTuru));

  const geziTypes = buildTypeSummary(geziVenues);
  const keyifTypes = buildTypeSummary(keyifVenues);
  const allTypes = buildTypeSummary(dedupedAllVenues);

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    minTypeCount: MIN_TYPE_COUNT,
    sourceCount: records.length,
    mappedCount: mappedVenues.length,
    dedupedAllCount: dedupedAllVenues.length,
    geziCount: geziVenues.length,
    keyifCount: keyifVenues.length,
    geziTypeCount: geziTypes.length,
    keyifTypeCount: keyifTypes.length,
    allTypeCount: allTypes.length,
  };

  process.stdout.write(`[ktb-katman] gezi: ${geziVenues.length}, keyif: ${keyifVenues.length}\n`);
  process.stdout.write(`[ktb-katman] gezi tur: ${geziTypes.length}, keyif tur: ${keyifTypes.length}\n`);

  if (DRY_RUN) {
    process.stdout.write("[ktb-katman] dry-run tamamlandi, dosya yazilmadi.\n");
    return;
  }

  writeJson(DATA_DIR, OUTPUT_FILES.geziVenues, geziVenues);
  writeJson(ANDROID_DATA_DIR, OUTPUT_FILES.geziVenues, geziVenues);
  writeJson(DATA_DIR, OUTPUT_FILES.keyifVenues, keyifVenues);
  writeJson(ANDROID_DATA_DIR, OUTPUT_FILES.keyifVenues, keyifVenues);

  writeJson(DATA_DIR, OUTPUT_FILES.geziTypes, geziTypes);
  writeJson(ANDROID_DATA_DIR, OUTPUT_FILES.geziTypes, geziTypes);
  writeJson(DATA_DIR, OUTPUT_FILES.keyifTypes, keyifTypes);
  writeJson(ANDROID_DATA_DIR, OUTPUT_FILES.keyifTypes, keyifTypes);
  writeJson(DATA_DIR, OUTPUT_FILES.allTypes, allTypes);
  writeJson(ANDROID_DATA_DIR, OUTPUT_FILES.allTypes, allTypes);

  writeJson(DATA_DIR, OUTPUT_FILES.report, report);
  process.stdout.write(`[ktb-katman] rapor: ${path.join(DATA_DIR, OUTPUT_FILES.report)}\n`);
}

main().catch((error) => {
  process.stderr.write(`[ktb-katman] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
