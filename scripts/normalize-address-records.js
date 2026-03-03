#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DATA_DIR = path.join(ROOT, "data");
const DISTRICTS_PATH = path.join(DEFAULT_DATA_DIR, "districts.json");

const DRY_RUN = process.argv.includes("--dry-run");

const STREET_TOKEN_PATTERN =
  /\b(caddesi|cadde|cad\.?|cd\.?|bulvari|bulvarı|bulvar|blv\.?|sokagi|sokağı|sokak|sok\.?|sk\.?|yolu|yol|küme evler|kume evler|kümeevler|mevkii|mevki)\b/iu;
const NEIGHBORHOOD_TOKEN_PATTERN = /\b(mahallesi|mahellesi|mah\.?|mh\.?)\b/iu;
const HOUSE_NUMBER_PATTERN = /\b(no|numara)\s*[:.]?\s*[0-9a-zçğıöşüA-ZÇĞİÖŞÜ/-]+\b/iu;
const DETAIL_NUMBER_PATTERN =
  /\b(d:|daire|daire no|kat)\s*[:.]?\s*[0-9a-zçğıöşüA-ZÇĞİÖŞÜ/-]+\b/giu;
const POSTAL_CODE_PATTERN = /\b\d{5}\b/g;
const COUNTRY_PATTERN = /\b(turkiye|türkiye)\b/giu;
const LANDMARK_TOKEN_PATTERN =
  /\b(apt|apartmani|apartmanı|sitesi|parki|parkı|köprüsü|koprusu|belediyesi|otel|restoran|restaurant|lokantasi|lokantası|cafe|kafe|kahvehanesi|camii|cami|okulu|koleji|hastanesi|eczanesi|tesisi|tesisleri)\b/iu;

function readJson(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const args = {
    dataDir: DEFAULT_DATA_DIR,
    file: "",
    limit: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--data-dir") {
      const rawValue = String(argv[index + 1] || "").trim();
      if (rawValue) {
        args.dataDir = path.resolve(ROOT, rawValue);
      }
      index += 1;
      continue;
    }

    if (token === "--file") {
      const rawValue = String(argv[index + 1] || "").trim();
      if (rawValue) {
        args.file = path.resolve(ROOT, rawValue);
      }
      index += 1;
      continue;
    }

    if (token === "--limit") {
      const value = Number(argv[index + 1]);
      args.limit = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      index += 1;
    }
  }

  return args;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function foldForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
}

function toTitleCaseTr(value) {
  return normalizeText(value)
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLocaleLowerCase("tr");
      if (!lower) {
        return "";
      }
      return `${lower.charAt(0).toLocaleUpperCase("tr")}${lower.slice(1)}`;
    })
    .join(" ");
}

function buildCityIndex(districtMap) {
  const index = new Map();

  Object.keys(districtMap || {}).forEach((cityName) => {
    const foldedCity = foldForCompare(cityName);
    if (foldedCity) {
      index.set(foldedCity, cityName);
    }
  });

  return index;
}

function buildDistrictIndex(districtMap) {
  const cityIndex = new Map();

  Object.entries(districtMap || {}).forEach(([cityName, districtList]) => {
    const bucket = new Map();
    const ordered = Array.isArray(districtList)
      ? [...districtList].sort((left, right) => String(right).length - String(left).length)
      : [];

    ordered.forEach((districtName) => {
      const foldedDistrict = foldForCompare(districtName);
      if (foldedDistrict) {
        bucket.set(foldedDistrict, districtName);
      }
    });

    cityIndex.set(cityName, bucket);
  });

  return cityIndex;
}

function canonicalizeCity(rawCity, cityIndex) {
  const folded = foldForCompare(rawCity);
  if (!folded) {
    return "";
  }

  if (cityIndex.has(folded)) {
    return cityIndex.get(folded);
  }

  return toTitleCaseTr(rawCity);
}

function findKnownCity(rawCity, cityIndex) {
  const folded = foldForCompare(rawCity);
  if (!folded || !cityIndex.has(folded)) {
    return "";
  }

  return cityIndex.get(folded);
}

function canonicalizeDistrict(rawDistrict, cityName, districtIndex) {
  const folded = foldForCompare(rawDistrict);
  if (!folded) {
    return "";
  }

  if (cityName && districtIndex.has(cityName)) {
    const cityDistricts = districtIndex.get(cityName);
    if (cityDistricts.has(folded)) {
      return cityDistricts.get(folded);
    }
  }

  return toTitleCaseTr(rawDistrict);
}

function findKnownDistrict(rawDistrict, cityName, districtIndex) {
  const folded = foldForCompare(rawDistrict);
  if (!folded || !cityName || !districtIndex.has(cityName)) {
    return "";
  }

  const cityDistricts = districtIndex.get(cityName);
  if (!cityDistricts.has(folded)) {
    return "";
  }

  return cityDistricts.get(folded);
}

function listCandidateFiles(args) {
  if (args.file) {
    return fs.existsSync(args.file) ? [args.file] : [];
  }

  if (!fs.existsSync(args.dataDir)) {
    return [];
  }

  return fs
    .readdirSync(args.dataDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .filter((fileName) => !fileName.includes(".backup."))
    .filter((fileName) => !fileName.endsWith(".backup.json"))
    .filter((fileName) => fileName !== "districts.json")
    .filter((fileName) => !fileName.includes("progress"))
    .filter((fileName) => !fileName.includes("review"))
    .filter((fileName) => !fileName.includes(".example."))
    .map((fileName) => path.join(args.dataDir, fileName))
    .sort();
}

function splitAddressParts(rawAddress) {
  const rawParts = normalizeText(rawAddress)
    .replace(COUNTRY_PATTERN, " ")
    .split(",")
    .flatMap((part) => String(part || "").split(/\s+-\s+/u))
    .map((part) => normalizeText(part))
    .filter(Boolean);

  return rawParts.flatMap((part) => {
    const explicitMatch = part.match(
      /^(.*?(?:\bmahallesi\b|\bmahellesi\b|\bmah\.?\b|\bmh\.?\b))(?:\s+(.+))$/iu,
    );

    if (!explicitMatch) {
      return [part];
    }

    const basePart = normalizeText(explicitMatch[1]);
    const tailPart = normalizeText(explicitMatch[2]);
    return [basePart, tailPart].filter(Boolean);
  });
}

function extractPostalCode(rawAddress, record) {
  const fromAddress = [...String(rawAddress || "").matchAll(POSTAL_CODE_PATTERN)];
  if (fromAddress.length > 0) {
    return fromAddress[fromAddress.length - 1][0];
  }

  const fromRecord = normalizeText(record.postalCode || record.postcode || "");
  return /^\d{5}$/.test(fromRecord) ? fromRecord : "";
}

function extractLocationFromSlash(parts, fallbackCity, cityIndex, districtIndex) {
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (!part.includes("/")) {
      continue;
    }

    const slashSegments = part
      .split("/")
      .map((segment) => normalizeText(segment.replace(POSTAL_CODE_PATTERN, " ")))
      .filter(Boolean);

    if (slashSegments.length < 2) {
      continue;
    }

    const rawCity = slashSegments[slashSegments.length - 1];
    const city = findKnownCity(rawCity, cityIndex);
    const leftText = normalizeText(slashSegments.slice(0, -1).join(" "));
    const district = findDistrictInText(leftText, city, districtIndex);

    if (city) {
      return {
        city,
        district,
        index,
      };
    }
  }

  return {
    city: "",
    district: "",
    index: -1,
  };
}

function extractLocationFromCommaTail(parts, cityIndex, districtIndex) {
  if (parts.length < 2) {
    return {
      city: "",
      district: "",
      explicit: false,
    };
  }

  const city = findKnownCity(parts[parts.length - 1], cityIndex);
  if (!city) {
    return {
      city: "",
      district: "",
      explicit: false,
    };
  }

  const district = findKnownDistrict(parts[parts.length - 2], city, districtIndex);
  return {
    city,
    district,
    explicit: Boolean(district),
  };
}

function extractLocationFromParts(parts, fallbackCity, cityIndex, districtIndex) {
  const slashLocation = extractLocationFromSlash(parts, fallbackCity, cityIndex, districtIndex);
  if (slashLocation.city) {
    return {
      city: slashLocation.city,
      district: slashLocation.district,
      explicit: true,
    };
  }

  const commaLocation = extractLocationFromCommaTail(parts, cityIndex, districtIndex);
  if (commaLocation.city) {
    return commaLocation;
  }

  return {
    city: "",
    district: "",
    explicit: false,
  };
}

function findDistrictInText(rawText, cityName, districtIndex) {
  const text = foldForCompare(rawText);
  if (!text || !cityName || !districtIndex.has(cityName)) {
    return "";
  }

  const cityDistricts = districtIndex.get(cityName);
  for (const [foldedDistrict, districtName] of cityDistricts.entries()) {
    if (text.includes(foldedDistrict)) {
      return districtName;
    }
  }

  return "";
}

function stripLocationTail(part) {
  return normalizeText(
    String(part || "")
      .replace(COUNTRY_PATTERN, " ")
      .replace(POSTAL_CODE_PATTERN, " ")
      .replace(/\s+/g, " "),
  );
}

function normalizeAddressSegment(segment) {
  return normalizeText(
    String(segment || "")
      .replace(COUNTRY_PATTERN, " ")
      .replace(DETAIL_NUMBER_PATTERN, " ")
      .replace(/caddesi|cadde|cad\.?|cd\.?/giu, "Cad.")
      .replace(/bulvari|bulvarı|bulvar|blv\.?/giu, "Blv.")
      .replace(/sokagi|sokağı|sokak|sok\.?|sk\.?/giu, "Sok.")
      .replace(/\byolu\b/giu, "Yolu")
      .replace(/\bmahallesi\b|\bmahellesi\b/giu, "Mah.")
      .replace(/\bmh\.?\b/giu, "Mah.")
      .replace(/\bmah\b/giu, "Mah.")
      .replace(/\bno\s*[:.]?\s*/giu, "No:")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s+/g, " ")
      .replace(/\s+,/g, ",")
      .replace(/[;]+/g, " ")
      .replace(/\s+\./g, ".")
      .replace(/\.{2,}/g, ".")
      .trim(),
  );
}

function isLikelyNamePart(part, venueName) {
  const foldedPart = foldForCompare(part);
  const foldedName = foldForCompare(venueName);

  if (!foldedPart || !foldedName) {
    return false;
  }

  if (foldedPart === foldedName) {
    return true;
  }

  if (foldedPart.length < 8) {
    return false;
  }

  return foldedName.includes(foldedPart) || foldedPart.includes(foldedName);
}

function normalizeNeighborhood(segment) {
  const source = String(segment || "");
  const explicitMatch = source.match(/^(.*?)(?:\bmahallesi\b|\bmahellesi\b|\bmah\.?\b|\bmh\.?\b)/iu);
  const baseSource = explicitMatch ? explicitMatch[1] : source;
  const stripped = normalizeText(
    String(baseSource || "")
      .replace(NEIGHBORHOOD_TOKEN_PATTERN, " ")
      .replace(/[.,;:]+/g, " ")
      .replace(/\s+/g, " "),
  );

  if (!stripped) {
    return "";
  }

  return `${toTitleCaseTr(stripped)} Mah.`;
}

function extractExplicitNeighborhood(rawAddress) {
  const matches = String(rawAddress || "").matchAll(
    /(?:^|[,\-\/\s])([A-Za-zÇĞİÖŞÜçğıöşü0-9]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü0-9]+){0,2})\s*(?:mahallesi|mahellesi|mah\.?|mh\.?)\b/giu,
  );

  let best = "";
  for (const match of matches) {
    const candidate = normalizeNeighborhood(match[1]);
    if (candidate) {
      best = candidate;
    }
  }

  return best;
}

function pickNeighborhood(parts, streetIndices, recordName, cityName, districtName) {
  const cityFolded = foldForCompare(cityName);
  const districtFolded = foldForCompare(districtName);

  let best = null;

  parts.forEach((part, index) => {
    const cleaned = normalizeText(part);
    const folded = foldForCompare(cleaned);

    if (!cleaned || !folded) {
      return;
    }

    if (folded === cityFolded || folded === districtFolded) {
      return;
    }

    if (isLikelyNamePart(cleaned, recordName)) {
      return;
    }

    let score = 0;

    if (NEIGHBORHOOD_TOKEN_PATTERN.test(cleaned)) {
      score += 10;
    }

    if (!/\d/.test(cleaned)) {
      score += 2;
    }

    if (LANDMARK_TOKEN_PATTERN.test(cleaned)) {
      score -= 5;
    }

    if (STREET_TOKEN_PATTERN.test(cleaned) || HOUSE_NUMBER_PATTERN.test(cleaned)) {
      score -= 6;
    }

    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 1 && wordCount <= 3) {
      score += 2;
    } else if (wordCount > 5) {
      score -= 3;
    }

    const nextToStreet = streetIndices.some((streetIndex) => Math.abs(streetIndex - index) === 1);
    if (nextToStreet) {
      score += 3;
    }

    if (!best || score > best.score) {
      best = { index, score };
    }
  });

  if (!best || best.score < 4) {
    return { value: "", index: -1 };
  }

  return {
    value: normalizeNeighborhood(parts[best.index]),
    index: best.index,
  };
}

function inferNeighborhoodFromParts(parts, recordName, cityName, districtName) {
  if (!Array.isArray(parts) || parts.length < 2) {
    return "";
  }

  const normalizedParts = parts
    .map((part) => stripLocationTail(part))
    .map((part) => normalizeAddressSegment(part))
    .filter(Boolean);

  if (normalizedParts.length < 2) {
    return "";
  }

  const streetIndices = normalizedParts
    .map((part, index) => ({
      part,
      index,
    }))
    .filter(({ part }) => STREET_TOKEN_PATTERN.test(part) || HOUSE_NUMBER_PATTERN.test(part))
    .map(({ index }) => index);

  return pickNeighborhood(normalizedParts, streetIndices, recordName, cityName, districtName).value;
}

function pickStreetParts(parts, excludeIndex, recordName, cityName, districtName) {
  const cleaned = [];
  const cityFolded = foldForCompare(cityName);
  const districtFolded = foldForCompare(districtName);

  parts.forEach((part, index) => {
    if (index === excludeIndex) {
      return;
    }

    const segment = normalizeAddressSegment(part);
    if (!segment) {
      return;
    }

    const foldedSegment = foldForCompare(segment);
    if (!foldedSegment || foldedSegment === cityFolded || foldedSegment === districtFolded) {
      return;
    }

    if (isLikelyNamePart(segment, recordName)) {
      return;
    }

    cleaned.push({ raw: segment, index });
  });

  if (cleaned.length === 0) {
    return "";
  }

  const streetLike = cleaned.filter(({ raw }) => {
    return STREET_TOKEN_PATTERN.test(raw) || HOUSE_NUMBER_PATTERN.test(raw) || /\d/.test(raw);
  });

  const selected = streetLike.length > 0 ? streetLike : cleaned.slice(0, 2);
  const unique = [];
  const seen = new Set();

  selected.forEach(({ raw }) => {
    const folded = foldForCompare(raw);
    if (!folded || seen.has(folded)) {
      return;
    }

    seen.add(folded);
    unique.push(raw);
  });

  return unique.join(", ");
}

function buildAddress(rawParts, locationIndex, record) {
  const normalizedParts = rawParts
    .map((part, index) => {
      if (index === locationIndex) {
        return "";
      }
      return stripLocationTail(part);
    })
    .map((part) => normalizeAddressSegment(part))
    .filter(Boolean);

  const streetIndices = normalizedParts
    .map((part, index) => ({
      part,
      index,
    }))
    .filter(({ part }) => STREET_TOKEN_PATTERN.test(part) || HOUSE_NUMBER_PATTERN.test(part))
    .map(({ index }) => index);

  const neighborhood = pickNeighborhood(
    normalizedParts,
    streetIndices,
    record.name,
    record.city,
    record.district,
  );

  const streetLine = pickStreetParts(
    normalizedParts,
    neighborhood.index,
    record.name,
    record.city,
    record.district,
  );
  const tailParts = [];

  if (record.postalCode) {
    tailParts.push(record.postalCode);
  }

  const locationTail = [record.district, record.city].filter(Boolean).join("/");
  if (locationTail) {
    tailParts.push(locationTail);
  }

  const composed = [];
  if (neighborhood.value) {
    composed.push(neighborhood.value);
  }
  if (streetLine) {
    composed.push(streetLine);
  }
  if (tailParts.length > 0) {
    composed.push(tailParts.join(" "));
  }

  return {
    neighborhood: neighborhood.value,
    address: composed.join(", "),
  };
}

function normalizeAddressRecord(record, cityIndex, districtIndex) {
  if (!record || typeof record !== "object") {
    return { changed: false };
  }

  const rawAddress = normalizeText(record.address);
  const rawParts = splitAddressParts(rawAddress);
  const locationInfo = extractLocationFromParts(rawParts, record.city, cityIndex, districtIndex);
  const city =
    locationInfo.city
    || canonicalizeCity(record.city, cityIndex)
    || canonicalizeCity(record.il, cityIndex)
    || toTitleCaseTr(record.city || record.il || "");
  const currentDistrict = findKnownDistrict(record.district || record.ilce, city, districtIndex)
    || normalizeText(record.district || record.ilce || "");
  let district = currentDistrict;

  if (locationInfo.district) {
    district = locationInfo.district;
  } else if (!district) {
    district = findDistrictInText(rawAddress, city, districtIndex) || "";
  }

  const postalCode = extractPostalCode(rawAddress, record);
  const explicitNeighborhood = extractExplicitNeighborhood(rawAddress);
  const neighborhood =
    explicitNeighborhood
    || (locationInfo.explicit
      ? inferNeighborhoodFromParts(rawParts, normalizeText(record.name), city, district)
      : "");

  let changed = false;

  if (city && normalizeText(record.city) !== city) {
    record.city = city;
    changed = true;
  }

  if (district && normalizeText(record.district) !== district) {
    record.district = district;
    changed = true;
  }

  if (postalCode) {
    if (normalizeText(record.postalCode) !== postalCode) {
      record.postalCode = postalCode;
      changed = true;
    }
  } else if ("postalCode" in record && record.postalCode) {
    delete record.postalCode;
    changed = true;
  }

  if (neighborhood) {
    if (normalizeText(record.neighborhood) !== neighborhood) {
      record.neighborhood = neighborhood;
      changed = true;
    }
  } else if ("neighborhood" in record && record.neighborhood) {
    delete record.neighborhood;
    changed = true;
  }

  return {
      changed,
      after: {
        city: record.city,
        district: record.district,
        address: record.address,
        postalCode: record.postalCode || "",
        neighborhood: record.neighborhood || "",
    },
  };
}

function shouldProcessPayload(payload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return false;
  }

  return payload.some((item) => {
    return item && typeof item === "object" && ("address" in item || "city" in item || "district" in item);
  });
}

function backupPathFor(filePath) {
  if (!filePath.endsWith(".json")) {
    return `${filePath}.pre-address-layer-cleanup.backup.json`;
  }

  return filePath.replace(/\.json$/u, ".pre-address-layer-cleanup.backup.json");
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const districtsPath = fs.existsSync(path.join(args.dataDir, "districts.json"))
    ? path.join(args.dataDir, "districts.json")
    : DISTRICTS_PATH;
  const districtMap = readJson(districtsPath, {});

  if (!districtMap || typeof districtMap !== "object" || Array.isArray(districtMap)) {
    console.error("districts.json okunamadi veya hatali.");
    process.exitCode = 1;
    return;
  }

  const cityIndex = buildCityIndex(districtMap);
  const districtIndex = buildDistrictIndex(districtMap);
  const files = listCandidateFiles(args);

  if (files.length === 0) {
    console.error("Islenecek veri dosyasi bulunamadi.");
    process.exitCode = 1;
    return;
  }

  let totalFilesChanged = 0;
  let totalRecordsChanged = 0;

  files.forEach((filePath) => {
    const payload = readJson(filePath, null);
    if (!shouldProcessPayload(payload)) {
      return;
    }

    const originalPayload = JSON.parse(JSON.stringify(payload));
    let fileChangedCount = 0;
    const examples = [];

    payload.forEach((record, index) => {
      if (args.limit > 0 && index >= args.limit) {
        return;
      }

      const before = record && typeof record === "object"
        ? {
            city: normalizeText(record.city),
            district: normalizeText(record.district),
            address: normalizeText(record.address),
            postalCode: normalizeText(record.postalCode || ""),
            neighborhood: normalizeText(record.neighborhood || ""),
          }
        : null;

      const result = normalizeAddressRecord(record, cityIndex, districtIndex);
      if (!result.changed) {
        return;
      }

      fileChangedCount += 1;
      totalRecordsChanged += 1;

      if (examples.length < 8 && before) {
        examples.push({
          name: normalizeText(record.name),
          before,
          after: result.after,
        });
      }
    });

    if (fileChangedCount === 0) {
      return;
    }

    totalFilesChanged += 1;
    console.log(`${path.relative(ROOT, filePath)} -> ${fileChangedCount} kayit`);
    examples.forEach((item) => {
      console.log(`- ${item.name || "Kayit"}`);
      console.log(`  once: ${item.before.city} / ${item.before.district} | ${item.before.address}`);
      console.log(`  sonra: ${item.after.city} / ${item.after.district} | ${item.after.address}`);
    });

    if (DRY_RUN) {
      return;
    }

    writeJson(backupPathFor(filePath), originalPayload);
    writeJson(filePath, payload);
  });

  console.log(`Toplam degisen dosya: ${totalFilesChanged}`);
  console.log(`Toplam degisen kayit: ${totalRecordsChanged}`);

  if (DRY_RUN) {
    console.log("Dry-run modunda calisti. Dosyalar yazilmadi.");
  }
}

run();
