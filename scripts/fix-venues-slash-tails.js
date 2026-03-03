#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

function parseArgs(argv) {
  const args = {
    file: path.join(ROOT, "data", "venues.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--file") {
      const rawValue = String(argv[index + 1] || "").trim();
      if (rawValue) {
        args.file = path.resolve(ROOT, rawValue);
      }
      index += 1;
    }
  }

  return args;
}

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

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSafePunctuation(value) {
  return String(value || "")
    .replace(/:\s*\u060C/gu, ": ")
    .replace(/\u060C/gu, ",")
    .replace(/\s*,\s*,+/gu, ", ")
    .replace(/,\s*,/gu, ", ")
    .replace(/,\s+/gu, ", ");
}

function foldForCompare(value) {
  return normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function cityAliases(cityName) {
  const canonical = normalizeText(cityName);
  const folded = foldForCompare(canonical);
  const aliases = new Set([folded]);

  if (folded === "afyonkarahisar") {
    aliases.add("afyon");
  }

  return aliases;
}

function districtTargetAliases(districtName) {
  const folded = foldForCompare(districtName);
  const aliases = new Set([folded]);

  if (folded === "19 mayis") {
    aliases.add("19mayis");
    aliases.add("ondokuzmayis");
    aliases.add("ondokuz mayis");
  }

  return aliases;
}

function stripPostalCodePrefix(value) {
  return normalizeText(normalizeText(value).replace(/^\d{5}\s+/u, ""));
}

function districtTailChunk(rawSegment) {
  const cleaned = normalizeText(rawSegment);
  if (!cleaned) {
    return "";
  }

  const chunks = cleaned.split(/[,\u060C]/u).map((chunk) => normalizeText(chunk)).filter(Boolean);
  return chunks.length > 0 ? chunks[chunks.length - 1] : "";
}

function tailMatch(address) {
  const rawAddress = String(address || "");
  const match = rawAddress.match(/([^,/\u060C]+)\/([^,/\u060C]+)$/u);
  if (!match) {
    return null;
  }

  const rawDistrictFull = normalizeText(match[1]);
  const postalCodeMatch = rawDistrictFull.match(/^(\d{5}\s+)/u);
  const currentTail = `${match[1]}/${match[2]}`;
  const tailIndex = rawAddress.lastIndexOf(currentTail);

  return {
    beforeTail: tailIndex >= 0 ? rawAddress.slice(0, tailIndex) : "",
    postalPrefix: postalCodeMatch ? postalCodeMatch[1] : "",
    rawDistrict: stripPostalCodePrefix(rawDistrictFull),
    rawDistrictFull,
    rawCity: normalizeText(match[2]),
  };
}

function tripleTailMatch(address) {
  const rawAddress = String(address || "");
  const match = rawAddress.match(/([^,/\u060C]+)\/([^,/\u060C]+)\/([^,/\u060C]+)$/u);
  if (!match) {
    return null;
  }

  const seg1 = normalizeText(match[1]);
  const postalCodeMatch = seg1.match(/^(\d{5}\s+)/u);
  const currentTail = `${match[1]}/${match[2]}/${match[3]}`;

  return {
    currentTail,
    leadingWhitespace: (match[1].match(/^\s*/u) || [""])[0],
    postalPrefix: postalCodeMatch ? postalCodeMatch[1] : "",
    seg1,
    seg2: normalizeText(match[2]),
    seg3: normalizeText(match[3]),
  };
}

function districtCandidates(rawDistrict, city) {
  const candidates = new Set();
  const cleaned = stripPostalCodePrefix(rawDistrict);

  if (!cleaned) {
    return candidates;
  }

  const addCandidate = (value) => {
    const normalized = normalizeText(value);
    if (normalized) {
      candidates.add(foldForCompare(normalized));
    }
  };

  addCandidate(cleaned);

  const parenthetical = cleaned.match(/^(.*?)\s*\(([^)]+)\)\s*$/u);
  if (parenthetical) {
    addCandidate(parenthetical[1]);
    addCandidate(parenthetical[2]);
  }

  const withoutMunicipality = cleaned.replace(/\s+belediyesi$/iu, "");
  if (withoutMunicipality !== cleaned) {
    addCandidate(withoutMunicipality);
  }

  const englishDistrict = cleaned.match(/^(.*?)\s+district$/iu);
  if (englishDistrict && cityAliases(city).has(foldForCompare(englishDistrict[1]))) {
    addCandidate("Merkez");
  }

  return candidates;
}

function levenshteinDistance(left, right) {
  const source = String(left || "");
  const target = String(right || "");

  if (!source.length) {
    return target.length;
  }

  if (!target.length) {
    return source.length;
  }

  const previous = Array.from({ length: target.length + 1 }, (_item, index) => index);
  const current = new Array(target.length + 1).fill(0);

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    current[0] = sourceIndex;

    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;
      current[targetIndex] = Math.min(
        previous[targetIndex] + 1,
        current[targetIndex - 1] + 1,
        previous[targetIndex - 1] + substitutionCost,
      );
    }

    for (let targetIndex = 0; targetIndex <= target.length; targetIndex += 1) {
      previous[targetIndex] = current[targetIndex];
    }
  }

  return previous[target.length];
}

function canonicalTailForRecord(address, record) {
  const tail = tailMatch(address);
  if (!tail) {
    return null;
  }

  const cityOk = cityAliases(record.city).has(foldForCompare(tail.rawCity));
  if (!cityOk) {
    return null;
  }

  const districtWithoutPostal = stripPostalCodePrefix(tail.rawDistrict);
  if (!districtWithoutPostal) {
    return null;
  }

  const targetDistrictAliases = districtTargetAliases(record.district);
  const districtMatches = Array.from(districtCandidates(districtWithoutPostal, record.city)).some(
    (candidate) => Array.from(targetDistrictAliases).some(
      (targetDistrict) => candidate === targetDistrict || candidate.replace(/\s+merkez$/u, "") === targetDistrict.replace(/\s+merkez$/u, ""),
    ),
  );

  if (!districtMatches) {
    return null;
  }

  const beforeTailTrimmed = tail.beforeTail.replace(/\/+$/u, "");
  const previousSegmentMatch = beforeTailTrimmed.match(/\/([^/]+)$/u);
  if (previousSegmentMatch) {
    const previousDistrictTail = stripPostalCodePrefix(districtTailChunk(previousSegmentMatch[1]));
    if (previousDistrictTail && foldForCompare(previousDistrictTail) === foldForCompare(record.district)) {
      return null;
    }
  }

  const currentTail = `${tail.rawDistrictFull}/${tail.rawCity}`;
  const desiredTail = `${tail.postalPrefix}${normalizeText(record.district)}/${normalizeText(record.city)}`;

  if (!currentTail || currentTail === desiredTail) {
    return null;
  }

  return {
    currentTail,
    desiredTail,
  };
}

function regionLabelTripleTailForRecord(address, record) {
  const tail = tripleTailMatch(address);
  if (!tail) {
    return null;
  }

  const regionLabels = new Set(["black sea region"]);
  if (!regionLabels.has(foldForCompare(tail.seg3))) {
    return null;
  }

  if (!districtTargetAliases(record.district).has(foldForCompare(tail.seg2))) {
    return null;
  }

  const firstSegmentWithoutPostal = stripPostalCodePrefix(tail.seg1);
  if (!cityAliases(record.city).has(foldForCompare(firstSegmentWithoutPostal))) {
    return null;
  }

  const desiredTail = `${tail.leadingWhitespace}${tail.postalPrefix}${normalizeText(record.district)}/${normalizeText(record.city)}`;
  if (tail.currentTail === desiredTail) {
    return null;
  }

  return {
    currentTail: tail.currentTail,
    desiredTail,
  };
}

function cityCenterTripleTailForRecord(address, record) {
  const tail = tripleTailMatch(address);
  if (!tail) {
    return null;
  }

  if (!cityAliases(record.city).has(foldForCompare(tail.seg3))) {
    return null;
  }

  const secondSegment = foldForCompare(tail.seg2);
  const cityCenterAliases = new Set([
    `${foldForCompare(record.city)} merkez`,
    `${foldForCompare(record.city)}merkez`,
  ]);
  if (!cityCenterAliases.has(secondSegment)) {
    return null;
  }

  const firstSegmentMatches = Array.from(districtCandidates(tail.seg1, record.city)).some(
    (candidate) => Array.from(districtTargetAliases(record.district)).some(
      (targetDistrict) => candidate === targetDistrict || candidate.replace(/\s+merkez$/u, "") === targetDistrict.replace(/\s+merkez$/u, ""),
    ),
  );
  if (!firstSegmentMatches) {
    return null;
  }

  const desiredTail = `${tail.leadingWhitespace}${tail.seg1}/${normalizeText(record.city)}`;
  if (tail.currentTail === desiredTail) {
    return null;
  }

  return {
    currentTail: tail.currentTail,
    desiredTail,
  };
}

function typoTailForRecord(address, record) {
  const tail = tailMatch(address);
  if (!tail) {
    return null;
  }

  const cityOk = cityAliases(record.city).has(foldForCompare(tail.rawCity));
  if (!cityOk) {
    return null;
  }

  const rawDistrict = stripPostalCodePrefix(tail.rawDistrict);
  if (!rawDistrict) {
    return null;
  }

  const source = foldForCompare(rawDistrict);
  const target = foldForCompare(record.district);
  if (!source || !target || source === target) {
    return null;
  }

  const distance = levenshteinDistance(source, target);
  if (distance < 1 || distance > 2) {
    return null;
  }

  const currentTail = `${tail.rawDistrictFull}/${tail.rawCity}`;
  const desiredTail = `${tail.postalPrefix}${normalizeText(record.district)}/${normalizeText(record.city)}`;
  if (currentTail === desiredTail) {
    return null;
  }

  return {
    currentTail,
    desiredTail,
  };
}

function citySuffixTailForRecord(address, record) {
  const tail = tailMatch(address);
  if (!tail) {
    return null;
  }

  const rawCityFolded = foldForCompare(tail.rawCity);
  const cityFolded = foldForCompare(record.city);
  if (!rawCityFolded.startsWith(cityFolded) || rawCityFolded === cityFolded) {
    return null;
  }

  const suffix = rawCityFolded.slice(cityFolded.length);
  if (!/^[\s\-()/]+/u.test(suffix)) {
    return null;
  }

  const rawDistrict = normalizeText(tail.rawDistrictFull.replace(/^\d+\s+/u, ""));
  if (!rawDistrict || foldForCompare(rawDistrict) !== foldForCompare(record.district)) {
    return null;
  }

  const currentTail = `${tail.rawDistrictFull}/${tail.rawCity}`;
  const desiredTail = `${normalizeText(tail.rawDistrictFull)}/${normalizeText(record.city)}`;
  if (currentTail === desiredTail) {
    return null;
  }

  return {
    currentTail,
    desiredTail,
  };
}

function numericPrefixTailForRecord(address, record) {
  const tail = tailMatch(address);
  if (!tail) {
    return null;
  }

  const cityOk = cityAliases(record.city).has(foldForCompare(tail.rawCity));
  if (!cityOk) {
    return null;
  }

  const numericPrefixMatch = tail.rawDistrictFull.match(/^(\d+)\s+/u);
  if (!numericPrefixMatch) {
    return null;
  }

  if (numericPrefixMatch[1].length < 6) {
    return null;
  }

  const strippedDistrict = normalizeText(tail.rawDistrictFull.replace(/^\d+\s+/u, ""));
  if (!strippedDistrict || foldForCompare(strippedDistrict) !== foldForCompare(record.district)) {
    return null;
  }

  const currentTail = `${tail.rawDistrictFull}/${tail.rawCity}`;
  const desiredTail = `${normalizeText(record.district)}/${normalizeText(record.city)}`;
  if (currentTail === desiredTail) {
    return null;
  }

  return {
    currentTail,
    desiredTail,
  };
}

function fixSlashTailForRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const city = normalizeText(record.city);
  const district = normalizeText(record.district);
  const address = normalizeText(record.address);
  const punctuationFixedAddress = normalizeText(normalizeSafePunctuation(address));

  if (!city || !district || !address) {
    return null;
  }

  let nextAddress = punctuationFixedAddress;
  const tail = nextAddress.includes("/") ? canonicalTailForRecord(nextAddress, { city, district }) : null;
  const typoTail = !tail && nextAddress.includes("/") ? typoTailForRecord(nextAddress, { city, district }) : null;
  const citySuffixTail = !tail && !typoTail && nextAddress.includes("/")
    ? citySuffixTailForRecord(nextAddress, { city, district })
    : null;
  const numericPrefixTail = !tail && !typoTail && !citySuffixTail && nextAddress.includes("/")
    ? numericPrefixTailForRecord(nextAddress, { city, district })
    : null;
  const regionTripleTail = !tail && !typoTail && !citySuffixTail && !numericPrefixTail && nextAddress.includes("/")
    ? regionLabelTripleTailForRecord(nextAddress, { city, district })
    : null;
  const cityCenterTripleTail = !tail && !typoTail && !citySuffixTail && !numericPrefixTail && !regionTripleTail && nextAddress.includes("/")
    ? cityCenterTripleTailForRecord(nextAddress, { city, district })
    : null;

  if (tail) {
    nextAddress = normalizeText(
      nextAddress.replace(
        new RegExp(`${tail.currentTail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "u"),
        tail.desiredTail,
      ),
    );
  } else if (typoTail) {
    nextAddress = normalizeText(
      nextAddress.replace(
        new RegExp(`${typoTail.currentTail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "u"),
        typoTail.desiredTail,
      ),
    );
  } else if (citySuffixTail) {
    nextAddress = normalizeText(
      nextAddress.replace(
        new RegExp(`${citySuffixTail.currentTail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "u"),
        citySuffixTail.desiredTail,
      ),
    );
  } else if (numericPrefixTail) {
    nextAddress = normalizeText(
      nextAddress.replace(
        new RegExp(`${numericPrefixTail.currentTail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "u"),
        numericPrefixTail.desiredTail,
      ),
    );
  } else if (regionTripleTail) {
    nextAddress = normalizeText(
      nextAddress.replace(
        new RegExp(`${regionTripleTail.currentTail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "u"),
        regionTripleTail.desiredTail,
      ),
    );
  } else if (cityCenterTripleTail) {
    nextAddress = normalizeText(
      nextAddress.replace(
        new RegExp(`${cityCenterTripleTail.currentTail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "u"),
        cityCenterTripleTail.desiredTail,
      ),
    );
  }

  if (!nextAddress || nextAddress === address) {
    return null;
  }

  record.address = nextAddress;
  return {
    before: address,
    after: nextAddress,
    currentTail: tail
      ? tail.currentTail
      : typoTail
        ? typoTail.currentTail
        : citySuffixTail
          ? citySuffixTail.currentTail
          : numericPrefixTail
            ? numericPrefixTail.currentTail
            : regionTripleTail
              ? regionTripleTail.currentTail
              : cityCenterTripleTail
                ? cityCenterTripleTail.currentTail
            : "",
    desiredTail: tail
      ? tail.desiredTail
      : typoTail
        ? typoTail.desiredTail
        : citySuffixTail
          ? citySuffixTail.desiredTail
          : numericPrefixTail
            ? numericPrefixTail.desiredTail
            : regionTripleTail
              ? regionTripleTail.desiredTail
              : cityCenterTripleTail
                ? cityCenterTripleTail.desiredTail
            : "",
  };
}

function backupPathFor(filePath) {
  if (filePath.endsWith(".json")) {
    return filePath.replace(/\.json$/u, ".pre-venues-slash-tail-fix.backup.json");
  }

  return `${filePath}.pre-venues-slash-tail-fix.backup.json`;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const payload = readJson(args.file, null);

  if (!Array.isArray(payload) || payload.length === 0) {
    console.error("Hedef dosya okunamadi veya bos.");
    process.exitCode = 1;
    return;
  }

  const originalPayload = JSON.parse(JSON.stringify(payload));
  let changedCount = 0;
  const examples = [];

  payload.forEach((record) => {
    const result = fixSlashTailForRecord(record);
    if (!result) {
      return;
    }

    changedCount += 1;
    if (examples.length < 20) {
      examples.push({
        name: normalizeText(record.name),
        city: normalizeText(record.city),
        district: normalizeText(record.district),
        currentTail: result.currentTail,
        desiredTail: result.desiredTail,
        before: result.before,
        after: result.after,
      });
    }
  });

  console.log(`Dosya: ${path.relative(ROOT, args.file)}`);
  console.log(`Degisen kayit: ${changedCount}`);
  examples.forEach((item) => {
    console.log(`- ${item.city}/${item.district} | ${item.name}`);
    if (item.currentTail && item.desiredTail) {
      console.log(`  kuyruk: ${item.currentTail} -> ${item.desiredTail}`);
    } else {
      console.log("  guvenli adres normalizasyonu uygulandi");
    }
    console.log(`  once: ${item.before}`);
    console.log(`  sonra: ${item.after}`);
  });

  if (DRY_RUN || changedCount === 0) {
    if (DRY_RUN) {
      console.log("Dry-run modunda calisti. Dosya yazilmadi.");
    }
    return;
  }

  writeJson(backupPathFor(args.file), originalPayload);
  writeJson(args.file, payload);
}

run();
