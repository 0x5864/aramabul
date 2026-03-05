#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const ANDROID_DATA_DIR = path.join(ROOT, "android_app", "assets", "web", "data");
const SOURCE_URL = "https://www.ktb.gov.tr/genel/searchhotelgenel.aspx?lang=tr";
const LEGACY_PANSIYON_FILE = "ktb-pansiyon-ek-kayitlari.json";

const OUTPUT_FILES = {
  geziVenues: "ktb-tesis-kayitlari-gezi.json",
  keyifVenues: "ktb-tesis-kayitlari-keyif.json",
  geziTypes: "ktb-tesis-turleri-gezi.json",
  keyifTypes: "ktb-tesis-turleri-keyif.json",
  allTypes: "ktb-tesis-turleri.json",
  report: "ktb-tesis-katman-raporu.json",
};

const MIN_TYPE_COUNT = Number.parseInt(process.env.KTB_MIN_DYNAMIC_TYPE_COUNT || "5", 10);
const MIN_NUMERIC_CLUSTER_SIZE = Number.parseInt(process.env.KTB_MIN_NUMERIC_CLUSTER_SIZE || "3", 10);
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
  const normalizedRule = normalizeTypeForRule(raw);
  if (!raw || !normalized) {
    return "";
  }

  const compact = normalized.replace(/\s+/g, " ");
  if (compact === "OTEL" || compact === "HOTEL") return "Otel";
  if (compact === "OTEL, OTEL" || normalizedRule === "OTEL OTEL") return "Otel";
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

function stripTypeWordsFromName(value) {
  return normalizeForMatch(value)
    .replace(
      /\b(PANSIYON|OTEL|HOTEL|APART|APART OTEL|KONAK|RESIDENCE|RESIDANCE|BUNGALOV|CAMPING|KAMPING)\b/g,
      " "
    )
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getVenueCompletenessScore(venue) {
  const fields = ["address", "phone", "website", "mapsUrl", "postalCode", "neighborhood", "photoUrl"];
  return fields.reduce((score, field) => {
    return score + (normalizeText(venue[field]).length > 0 ? 1 : 0);
  }, 0);
}

function choosePreferredVenue(left, right) {
  const leftIsKtb = normalizeText(left.source).toLowerCase() === "ktb";
  const rightIsKtb = normalizeText(right.source).toLowerCase() === "ktb";
  if (leftIsKtb !== rightIsKtb) {
    return leftIsKtb ? left : right;
  }

  const leftScore = getVenueCompletenessScore(left);
  const rightScore = getVenueCompletenessScore(right);
  if (leftScore !== rightScore) {
    return leftScore > rightScore ? left : right;
  }

  const leftNameLength = normalizeText(left.name).length;
  const rightNameLength = normalizeText(right.name).length;
  return leftNameLength >= rightNameLength ? left : right;
}

function dedupePansiyonConflicts(venues) {
  const nonPansiyon = [];
  const pansiyonGroups = new Map();

  venues.forEach((venue) => {
    const type = normalizeForMatch(venue.sourceTesisTuru || venue.cuisine);
    if (type !== "PANSIYON") {
      nonPansiyon.push(venue);
      return;
    }

    const key = [
      normalizeForMatch(venue.city),
      normalizeForMatch(venue.district),
      stripTypeWordsFromName(venue.name),
    ].join("|");
    const finalKey = key.endsWith("|") ? `${key}${normalizeForMatch(venue.name)}` : key;
    const current = pansiyonGroups.get(finalKey);
    if (!current) {
      pansiyonGroups.set(finalKey, venue);
      return;
    }
    pansiyonGroups.set(finalKey, choosePreferredVenue(current, venue));
  });

  return dedupeVenues([...nonPansiyon, ...pansiyonGroups.values()]);
}

function stripCampingWordsFromName(value) {
  return normalizeForMatch(value)
    .replace(/\b(CAMPING|KAMPING|KAMPINGI|KAMP ALANI|CAMP)\b/g, " ")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeCampingConflicts(venues) {
  const nonCamping = [];
  const campingGroups = new Map();
  const campingGroupCounts = new Map();

  venues.forEach((venue) => {
    const type = normalizeForMatch(venue.sourceTesisTuru || venue.cuisine);
    if (type !== "CAMPING") {
      nonCamping.push(venue);
      return;
    }

    const keyCore = stripCampingWordsFromName(venue.name);
    const key = [
      normalizeForMatch(venue.city),
      normalizeForMatch(venue.district),
      keyCore || normalizeForMatch(venue.name),
    ].join("|");
    campingGroupCounts.set(key, (campingGroupCounts.get(key) || 0) + 1);

    const current = campingGroups.get(key);
    if (!current) {
      campingGroups.set(key, venue);
      return;
    }
    campingGroups.set(key, choosePreferredVenue(current, venue));
  });

  let clusterCount = 0;
  let removedCount = 0;
  campingGroupCounts.forEach((count) => {
    if (count > 1) {
      clusterCount += 1;
      removedCount += count - 1;
    }
  });
  const deduped = dedupeVenues([...nonCamping, ...campingGroups.values()]);

  return {
    venues: deduped,
    clusterCount,
    removedCount,
  };
}

function stripTrailingUnitNumber(value) {
  return normalizeText(value).replace(/\s*[-–]?\s*\d+[A-Za-zÇĞİIÖŞÜçğıöşü]?\s*$/u, "").trim();
}

function hasNumericSuffix(value) {
  const text = normalizeText(value);
  return stripTrailingUnitNumber(text) !== text;
}

function hasContactDetail(venue) {
  const fields = ["phone", "website", "mapsUrl", "postalCode", "neighborhood", "photoUrl"];
  return fields.some((field) => normalizeText(venue[field]).length > 0);
}

function dedupeNumericSuffixClusters(venues) {
  const groups = new Map();
  const passthrough = [];
  let removedCount = 0;

  venues.forEach((venue) => {
    const type = normalizeText(venue.sourceTesisTuru || venue.cuisine);
    const baseName = stripTrailingUnitNumber(venue.name);
    if (!type || !baseName || !hasNumericSuffix(venue.name)) {
      passthrough.push(venue);
      return;
    }

    const key = [
      normalizeForMatch(venue.city),
      normalizeForMatch(venue.district),
      normalizeForMatch(type),
      normalizeForMatch(baseName),
    ].join("|");
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({ venue });
  });

  const merged = [];
  groups.forEach((entries) => {
    const eligible = entries.length >= MIN_NUMERIC_CLUSTER_SIZE
      && entries.every(({ venue }) => normalizeText(venue.source).toLowerCase() === "ktb")
      && entries.every(({ venue }) => !hasContactDetail(venue));

    if (!eligible) {
      entries.forEach(({ venue }) => {
        passthrough.push(venue);
      });
      return;
    }
    removedCount += entries.length - 1;

    const chosen = entries
      .map((item) => item.venue)
      .sort((left, right) => {
        const scoreDiff = getVenueCompletenessScore(right) - getVenueCompletenessScore(left);
        if (scoreDiff !== 0) return scoreDiff;
        const nameDiff = normalizeText(left.name).length - normalizeText(right.name).length;
        if (nameDiff !== 0) return nameDiff;
        return normalizeText(left.name).localeCompare(normalizeText(right.name), "tr");
      })[0];

    const mergedBelgeNos = entries
      .map(({ venue }) => normalizeText(venue.sourceBelgeNo))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "tr"));
    const baseName = stripTrailingUnitNumber(chosen.name) || chosen.name;
    merged.push({
      ...chosen,
      name: baseName,
      sourceBelgeNo: mergedBelgeNos[0] || chosen.sourceBelgeNo,
      editorialSummary: `KTB resmi tesis kaydından (searchhotelgenel) eklendi. ${entries.length} adet numaralı alt kayıt tekilleştirildi.`,
    });
  });

  return {
    venues: dedupeVenues([...passthrough, ...merged]),
    clusterCount: merged.length,
    removedCount,
  };
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

function loadLegacyPansiyonVenues(filePath) {
  if (!fs.existsSync(filePath)) {
    process.stdout.write(`[ktb-katman] legacy pansiyon dosyasi bulunamadi: ${filePath}\n`);
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    process.stdout.write(`[ktb-katman] legacy pansiyon dosyasi okunamadi: ${String(error.message || error)}\n`);
    return [];
  }

  if (!Array.isArray(parsed)) {
    process.stdout.write("[ktb-katman] legacy pansiyon dosya formati gecersiz, dizi bekleniyordu.\n");
    return [];
  }

  return parsed
    .map((item) => {
      const city = toTitleCaseTr(item.city);
      const district = toTitleCaseTr(item.district) || "Merkez";
      const name = normalizeText(item.name);
      if (!city || !district || !name) {
        return null;
      }

      const address = normalizeText(item.address) || [district, city, "Türkiye"].join(", ");
      return {
        city,
        district,
        name,
        cuisine: "Pansiyon",
        address,
        neighborhood: normalizeText(item.neighborhood),
        postalCode: normalizeText(item.postalCode),
        mapsUrl: normalizeText(item.mapsUrl),
        website: normalizeText(item.website),
        phone: normalizeText(item.phone),
        photoUrl: normalizeText(item.photoUrl),
        editorialSummary:
          normalizeText(item.editorialSummary) || "Legacy pansiyon kaydindan resmi Pansiyon turune aktarildi.",
        sourcePlaceId: normalizeText(item.sourcePlaceId),
        source: "legacy-pansiyon",
        sourceTesisTuru: "Pansiyon",
        sourceBelgeNo: "",
        sourceBelgeTuru: "",
        sourceBelgeDurumu: "",
        sourceTesisSinifi: "",
      };
    })
    .filter(Boolean);
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
  const legacyPansiyonVenues = loadLegacyPansiyonVenues(path.join(DATA_DIR, LEGACY_PANSIYON_FILE));

  const geziVenuesFromKtb = dedupedAllVenues.filter((venue) => !isKeyifType(venue.sourceTesisTuru));
  const keyifVenues = dedupedAllVenues.filter((venue) => isKeyifType(venue.sourceTesisTuru));
  const geziVenuesWithLegacy = dedupeVenues([...geziVenuesFromKtb, ...legacyPansiyonVenues]);
  const geziVenuesAfterPansiyon = dedupePansiyonConflicts(geziVenuesWithLegacy);
  const campingDedupe = dedupeCampingConflicts(geziVenuesAfterPansiyon);
  const numericSuffixDedupe = dedupeNumericSuffixClusters(campingDedupe.venues);
  const geziVenues = numericSuffixDedupe.venues;
  const allVenuesWithLegacy = dedupeVenues([...geziVenues, ...keyifVenues]);

  const geziTypes = buildTypeSummary(geziVenues);
  const keyifTypes = buildTypeSummary(keyifVenues);
  const allTypes = buildTypeSummary(allVenuesWithLegacy);

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    minTypeCount: MIN_TYPE_COUNT,
    sourceCount: records.length,
    mappedCount: mappedVenues.length,
    dedupedAllCount: dedupedAllVenues.length,
    legacyPansiyonCount: legacyPansiyonVenues.length,
    campingClusterCount: campingDedupe.clusterCount,
    campingClusterRemovedCount: campingDedupe.removedCount,
    numericClusterCount: numericSuffixDedupe.clusterCount,
    numericClusterRemovedCount: numericSuffixDedupe.removedCount,
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
