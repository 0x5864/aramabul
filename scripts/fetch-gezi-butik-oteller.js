#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "data", "gezi-butik-oteller.json");
const ANDROID_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "gezi-butik-oteller.json",
);
const REPORT_FILE = path.join(ROOT, "data", "gezi-butik-oteller-cekim-raporu.json");
const TYPE_OUTPUT_FILE = path.join(ROOT, "data", "ktb-tesis-turleri.json");
const ANDROID_TYPE_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "ktb-tesis-turleri.json",
);
const KEYIF_TYPE_OUTPUT_FILE = path.join(ROOT, "data", "ktb-tesis-turleri-keyif.json");
const GEZI_TYPE_OUTPUT_FILE = path.join(ROOT, "data", "ktb-tesis-turleri-gezi.json");
const ANDROID_KEYIF_TYPE_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "ktb-tesis-turleri-keyif.json",
);
const ANDROID_GEZI_TYPE_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "ktb-tesis-turleri-gezi.json",
);

const SOURCE_URL = "https://www.ktb.gov.tr/genel/searchhotelgenel.aspx?lang=tr";
const MIN_DYNAMIC_TYPE_COUNT = Number.parseInt(process.env.KTB_MIN_DYNAMIC_TYPE_COUNT || "5", 10);

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

const LODGING_TYPE_TOKENS = new Set([
  "OTEL",
  "HOTEL",
  "PANSIYON",
  "APART OTEL",
  "APART",
  "MOTEL",
  "OZEL KONAKLAMA TESISI",
  "CAMPING",
  "KAMPING",
  "TATIL KOYU",
]);

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForMatch(value) {
  return normalizeText(value)
    .replace(/[ÇĞİIÖŞÜçğıiöşü]/g, (ch) => TURKISH_ASCII_MAP[ch] || ch)
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

function isButikRecord(record) {
  const tesisTuru = normalizeForMatch(record.tesisTuru);
  const tesisAdi = normalizeForMatch(record.tesisAdi);

  if (tesisTuru.includes("BUTIK OTEL")) {
    return { matchReason: "tesisTuru:butik-otel" };
  }

  if (!tesisAdi.includes("BUTIK")) {
    return { matchReason: "" };
  }

  if (LODGING_TYPE_TOKENS.has(tesisTuru) || [...LODGING_TYPE_TOKENS].some((token) => tesisTuru.includes(token))) {
    return { matchReason: "tesisAdi:butik + konaklama-turu" };
  }

  return { matchReason: "" };
}

function mapRecordToVenue(record, matchReason) {
  const city = toTitleCaseTr(record.sehir);
  const district = toTitleCaseTr(record.ilce);
  const name = normalizeText(record.tesisAdi);

  return {
    city,
    district,
    name,
    cuisine: "Butik Otel",
    address: [city, district, "Türkiye"].filter(Boolean).join(", "),
    neighborhood: "",
    postalCode: "",
    mapsUrl: "",
    website: "",
    phone: "",
    photoUrl: "",
    editorialSummary: "KTB resmi tesis kaydından (searchhotelgenel) eklendi.",
    sourcePlaceId: "",
    sourceBelgeNo: normalizeText(record.belgeNo),
    sourceBelgeTuru: normalizeText(record.belgeTuru),
    sourceBelgeDurumu: normalizeText(record.belgeDurumu),
    sourceTesisTuru: normalizeText(record.tesisTuru),
    sourceTesisSinifi: normalizeText(record.tesisSinifi),
    matchReason,
  };
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasNumericNameSuffix(normalizedName) {
  return /\s\d{2,6}$/.test(normalizedName);
}

function stripNumericNameSuffix(normalizedName) {
  return String(normalizedName || "").replace(/\s\d{2,6}$/, "").trim();
}

function compactNameKey(normalizedName) {
  return String(normalizedName || "").replace(/\s+/g, "");
}

function pickBestVenue(group) {
  const ranked = [...group].sort((left, right) => {
    const leftName = normalizeForMatch(left.name);
    const rightName = normalizeForMatch(right.name);
    const leftHasNumeric = hasNumericNameSuffix(leftName);
    const rightHasNumeric = hasNumericNameSuffix(rightName);
    if (leftHasNumeric !== rightHasNumeric) {
      return leftHasNumeric ? 1 : -1;
    }
    const leftLen = normalizeText(left.name).length;
    const rightLen = normalizeText(right.name).length;
    if (leftLen !== rightLen) {
      return leftLen - rightLen;
    }
    return String(left.sourceBelgeNo || "").localeCompare(String(right.sourceBelgeNo || ""), "tr");
  });
  return ranked[0];
}

function dedupeVenues(venues) {
  const unique = new Map();
  venues.forEach((venue) => {
    const key = [
      venue.sourceBelgeNo,
      normalizeForMatch(venue.name),
      normalizeForMatch(venue.city),
      normalizeForMatch(venue.district),
    ].join("|");
    if (!unique.has(key)) {
      unique.set(key, venue);
    }
  });

  const firstPass = Array.from(unique.values());
  const groupedByBaseName = new Map();
  firstPass.forEach((venue) => {
    const cityKey = normalizeForMatch(venue.city);
    const districtKey = normalizeForMatch(venue.district);
    const normalizedName = normalizeForMatch(venue.name);
    const baseName = stripNumericNameSuffix(normalizedName);
    const compactBaseName = compactNameKey(baseName);
    const key = `${cityKey}|${districtKey}|${compactBaseName}`;
    const current = groupedByBaseName.get(key) || [];
    current.push(venue);
    groupedByBaseName.set(key, current);
  });

  const merged = [];
  let numericVariantCollapsedGroups = 0;
  let numericVariantRemovedCount = 0;

  groupedByBaseName.forEach((group) => {
    if (group.length <= 1) {
      merged.push(...group);
      return;
    }

    const normalizedNames = group.map((venue) => normalizeForMatch(venue.name));
    const baseName = stripNumericNameSuffix(normalizedNames[0]);
    const compactBase = compactNameKey(baseName);
    const allSameFamily = normalizedNames.every((name) => {
      return compactNameKey(stripNumericNameSuffix(name)) === compactBase;
    });
    const hasExactBase = normalizedNames.some((name) => {
      return compactNameKey(name) === compactBase && !hasNumericNameSuffix(name);
    });

    if (!allSameFamily || (!hasExactBase && group.length < 3)) {
      merged.push(...group);
      return;
    }

    numericVariantCollapsedGroups += 1;
    numericVariantRemovedCount += group.length - 1;
    merged.push(pickBestVenue(group));
  });

  return {
    stats: {
      firstPassCount: firstPass.length,
      mergedCount: merged.length,
      numericVariantCollapsedGroups,
      numericVariantRemovedCount,
    },
    venues: merged.map((venue) => {
      const {
        sourceBelgeNo,
        sourceBelgeTuru,
        sourceBelgeDurumu,
        sourceTesisTuru,
        sourceTesisSinifi,
        matchReason,
        ...publicVenue
      } = venue;
      return publicVenue;
    }),
  };
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

function buildTypeSummary(records) {
  const typeMap = new Map();

  records.forEach((record) => {
    const typeName = normalizeTypeName(record.tesisTuru);
    if (!typeName) {
      return;
    }
    const key = normalizeForMatch(typeName);
    const existing = typeMap.get(key) || { type: typeName, count: 0 };
    existing.count += 1;
    typeMap.set(key, existing);
  });

  return [...typeMap.values()].sort((a, b) => a.type.localeCompare(b.type, "tr"));
}

function sortVenues(venues) {
  return [...venues].sort((a, b) => {
    const cityCompare = a.city.localeCompare(b.city, "tr");
    if (cityCompare !== 0) return cityCompare;
    const districtCompare = a.district.localeCompare(b.district, "tr");
    if (districtCompare !== 0) return districtCompare;
    return a.name.localeCompare(b.name, "tr");
  });
}

function normalizeTypeForRule(value) {
  return normalizeForMatch(value).replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function isKeyifType(typeName) {
  const normalized = normalizeTypeForRule(typeName);
  if (!normalized) {
    return false;
  }

  if (/\bBAR\b/.test(normalized)) {
    return true;
  }

  if (/\bEGLENCE\b/.test(normalized)) {
    return true;
  }

  if (/\bLOKANTA\b/.test(normalized)) {
    return true;
  }

  if (/\bOBERJ\b/.test(normalized) && /\bKAFETERYA\b/.test(normalized)) {
    return true;
  }

  if (normalized.includes("OZEL KAHVEHANE")) {
    return true;
  }

  if (normalized.includes("OZEL YEME ICME TESISI")) {
    return true;
  }

  return false;
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
  process.stdout.write(`[butik-oteller] basladi: ${startedAt}\n`);
  process.stdout.write(`[butik-oteller] kaynak: ${SOURCE_URL}\n`);

  const html = await fetchSourceHtml();
  const records = extractJsonDataArray(html);
  process.stdout.write(`[butik-oteller] ham kayit: ${records.length}\n`);
  const typeSummary = buildTypeSummary(records).filter((item) => item.count >= MIN_DYNAMIC_TYPE_COUNT);
  process.stdout.write(`[butik-oteller] tesis turu: ${typeSummary.length}\n`);
  const keyifTypeSummary = typeSummary.filter((item) => isKeyifType(item.type));
  const geziTypeSummary = typeSummary.filter((item) => !isKeyifType(item.type));
  process.stdout.write(`[butik-oteller] keyif turu: ${keyifTypeSummary.length}, gezi turu: ${geziTypeSummary.length}\n`);

  const selected = [];
  let selectedByType = 0;
  let selectedByNamePlusType = 0;

  records.forEach((record) => {
    const { matchReason } = isButikRecord(record);
    if (!matchReason) {
      return;
    }
    if (matchReason === "tesisTuru:butik-otel") {
      selectedByType += 1;
    } else if (matchReason === "tesisAdi:butik + konaklama-turu") {
      selectedByNamePlusType += 1;
    }
    selected.push(mapRecordToVenue(record, matchReason));
  });

  const dedupeResult = dedupeVenues(selected);
  const sortedVenues = sortVenues(dedupeResult.venues);

  ensureParentDir(OUTPUT_FILE);
  ensureParentDir(ANDROID_OUTPUT_FILE);
  ensureParentDir(REPORT_FILE);
  ensureParentDir(TYPE_OUTPUT_FILE);
  ensureParentDir(ANDROID_TYPE_OUTPUT_FILE);
  ensureParentDir(KEYIF_TYPE_OUTPUT_FILE);
  ensureParentDir(GEZI_TYPE_OUTPUT_FILE);
  ensureParentDir(ANDROID_KEYIF_TYPE_OUTPUT_FILE);
  ensureParentDir(ANDROID_GEZI_TYPE_OUTPUT_FILE);

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(sortedVenues, null, 2)}\n`, "utf8");
  fs.writeFileSync(ANDROID_OUTPUT_FILE, `${JSON.stringify(sortedVenues, null, 2)}\n`, "utf8");
  fs.writeFileSync(TYPE_OUTPUT_FILE, `${JSON.stringify(typeSummary, null, 2)}\n`, "utf8");
  fs.writeFileSync(ANDROID_TYPE_OUTPUT_FILE, `${JSON.stringify(typeSummary, null, 2)}\n`, "utf8");
  fs.writeFileSync(KEYIF_TYPE_OUTPUT_FILE, `${JSON.stringify(keyifTypeSummary, null, 2)}\n`, "utf8");
  fs.writeFileSync(GEZI_TYPE_OUTPUT_FILE, `${JSON.stringify(geziTypeSummary, null, 2)}\n`, "utf8");
  fs.writeFileSync(ANDROID_KEYIF_TYPE_OUTPUT_FILE, `${JSON.stringify(keyifTypeSummary, null, 2)}\n`, "utf8");
  fs.writeFileSync(ANDROID_GEZI_TYPE_OUTPUT_FILE, `${JSON.stringify(geziTypeSummary, null, 2)}\n`, "utf8");

  const citySet = new Set(sortedVenues.map((venue) => venue.city).filter(Boolean));
  const cityDistrictSet = new Set(sortedVenues.map((venue) => `${venue.city}|${venue.district}`));
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    sourceTotalCount: records.length,
    selectedBeforeDedupe: selected.length,
    firstPassDedupeCount: dedupeResult.stats.firstPassCount,
    numericVariantCollapsedGroups: dedupeResult.stats.numericVariantCollapsedGroups,
    numericVariantRemovedCount: dedupeResult.stats.numericVariantRemovedCount,
    selectedByType,
    selectedByNamePlusType,
    uniqueCount: sortedVenues.length,
    typeCount: typeSummary.length,
    minDynamicTypeCount: MIN_DYNAMIC_TYPE_COUNT,
    keyifTypeCount: keyifTypeSummary.length,
    geziTypeCount: geziTypeSummary.length,
    keyifTypeSample: keyifTypeSummary.slice(0, 20),
    geziTypeSample: geziTypeSummary.slice(0, 20),
    cityCount: citySet.size,
    cityDistrictCount: cityDistrictSet.size,
    outputFiles: [
      OUTPUT_FILE,
      ANDROID_OUTPUT_FILE,
      TYPE_OUTPUT_FILE,
      ANDROID_TYPE_OUTPUT_FILE,
      KEYIF_TYPE_OUTPUT_FILE,
      GEZI_TYPE_OUTPUT_FILE,
      ANDROID_KEYIF_TYPE_OUTPUT_FILE,
      ANDROID_GEZI_TYPE_OUTPUT_FILE,
    ],
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  process.stdout.write(
    `[butik-oteller] secilen: ${selected.length}, tekil: ${sortedVenues.length}, sehir: ${citySet.size}\n`,
  );
  process.stdout.write(`[butik-oteller] cikti: ${OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] android cikti: ${ANDROID_OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] tesis turu cikti: ${TYPE_OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] android tesis turu cikti: ${ANDROID_TYPE_OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] keyif tesis turu cikti: ${KEYIF_TYPE_OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] gezi tesis turu cikti: ${GEZI_TYPE_OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] rapor: ${REPORT_FILE}\n`);
}

main().catch((error) => {
  process.stderr.write(`[butik-oteller] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
