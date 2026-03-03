const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");

const YEMEK_FILE = path.join(DATA_DIR, "yemek.json");
const VENUES_FILE = path.join(DATA_DIR, "venues.json");

const TARGETS = {
  meyhane: {
    file: path.join(DATA_DIR, "keyif.json"),
    label: "Meyhaneler",
  },
  restoran: {
    file: path.join(DATA_DIR, "keyif-restoran.json"),
    label: "Restoranlar",
  },
  kahvalti: {
    file: path.join(DATA_DIR, "keyif-kahvalti.json"),
    label: "Kahvaltı Mekanları",
  },
  kebap: {
    file: path.join(DATA_DIR, "keyif-kebap.json"),
    label: "Kebapçılar",
  },
  kafe: {
    file: path.join(DATA_DIR, "keyif-kafe.json"),
    label: "Kafeler",
  },
  doner: {
    file: path.join(DATA_DIR, "keyif-doner.json"),
    label: "Dönerciler",
  },
  pide: {
    file: path.join(DATA_DIR, "keyif-pide.json"),
    label: "Pide ve Lahmacun",
  },
  cigkofte: {
    file: path.join(DATA_DIR, "keyif-cigkofte.json"),
    label: "Çiğ Köfteciler",
  },
};

const CUISINE_TO_TARGET = new Map([
  ["meyhane", "meyhane"],
  ["bar", "meyhane"],
  ["kahvaltı", "kahvalti"],
  ["kahvalti", "kahvalti"],
  ["kebap", "kebap"],
  ["tantuni", "kebap"],
  ["kokoreç", "kebap"],
  ["kokorec", "kebap"],
  ["döner", "doner"],
  ["doner", "doner"],
  ["pide", "pide"],
  ["lahmacun", "pide"],
  ["çiğ köfte", "cigkofte"],
  ["cig kofte", "cigkofte"],
  ["çiğköfte", "cigkofte"],
  ["cigkofte", "cigkofte"],
  ["kafe", "kafe"],
]);

const TURKISH_MAP = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeBackup(filePath) {
  const backupPath = filePath.replace(/\.json$/u, ".merge-yemek.backup.json");
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function toPlainString(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  const source = toPlainString(value)
    .replace(/[çÇğĞıIİiöÖşŞüÜ]/gu, (char) => TURKISH_MAP[char] || char)
    .toLowerCase();

  return source
    .replace(/\([^)]*\)/gu, " ")
    .replace(/[&/.,:;+'"`´’‘“”()\[\]{}!?-]+/gu, " ")
    .replace(/\b(ltd|lti|lti\.?|ltd\.?|sti|şti|san|tic|turizm|gida|gıda|insaat|inşaat|ve|anonim|as|a\.?s\.?|subesi|şubesi)\b/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeName(value) {
  return normalizeText(value);
}

function normalizeAddress(value) {
  return normalizeText(value);
}

function buildMapsUrl(name, address, placeId) {
  const query = [toPlainString(name), toPlainString(address)].filter(Boolean).join(" ");
  if (!query) {
    return "";
  }

  const params = new URLSearchParams({
    api: "1",
    query,
  });

  if (placeId) {
    params.set("query_place_id", placeId);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function getPlaceId(record) {
  return toPlainString(record.placeId || record.sourcePlaceId);
}

function getStrictKey(record) {
  const city = normalizeText(record.city);
  const district = normalizeText(record.district);
  const name = normalizeName(record.name);
  if (!city || !district || !name) {
    return "";
  }
  return `${city}|${district}|${name}`;
}

function getAddressKey(record) {
  const strictKey = getStrictKey(record);
  const address = normalizeAddress(record.address);
  if (!strictKey || !address) {
    return "";
  }
  return `${strictKey}|${address}`;
}

function countRichFields(record) {
  let score = 0;
  const fields = [
    "address",
    "cuisine",
    "placeId",
    "sourcePlaceId",
    "mapsUrl",
    "website",
    "phone",
    "googleRating",
    "googleReviewCount",
    "rating",
    "photoUrl",
    "editorialSummary",
    "instagram",
  ];

  for (const field of fields) {
    const value = record[field];
    if (value === null || value === undefined || value === "") {
      continue;
    }
    score += 1;
  }

  return score;
}

function pickPreferredName(currentName, incomingName) {
  const current = toPlainString(currentName);
  const incoming = toPlainString(incomingName);

  if (!current) {
    return incoming;
  }
  if (!incoming) {
    return current;
  }

  const currentRichness = countRichFields({ name: current, value: current });
  const incomingRichness = countRichFields({ name: incoming, value: incoming });

  const currentNormalized = normalizeName(current);
  const incomingNormalized = normalizeName(incoming);

  if (currentNormalized === incomingNormalized) {
    if (incoming.length < current.length) {
      return incoming;
    }
    return current;
  }

  if (currentNormalized && incomingNormalized) {
    if (currentNormalized.includes(incomingNormalized) && incoming.length <= current.length) {
      return incoming;
    }
    if (incomingNormalized.includes(currentNormalized) && current.length <= incoming.length) {
      return current;
    }
  }

  if (incomingRichness > currentRichness && incoming.length <= current.length + 20) {
    return incoming;
  }

  return current;
}

function mergeRecord(baseRecord, incomingRecord) {
  const base = { ...baseRecord };
  const incoming = { ...incomingRecord };

  base.city = toPlainString(base.city || incoming.city);
  base.district = toPlainString(base.district || incoming.district);
  base.name = pickPreferredName(base.name, incoming.name);

  const baseAddress = toPlainString(base.address);
  const incomingAddress = toPlainString(incoming.address);
  if (!baseAddress || incomingAddress.length > baseAddress.length) {
    base.address = incomingAddress || baseAddress;
  }

  const baseCuisine = toPlainString(base.cuisine);
  const incomingCuisine = toPlainString(incoming.cuisine);
  if (!baseCuisine) {
    base.cuisine = incomingCuisine;
  }

  const placeId = getPlaceId(base) || getPlaceId(incoming);
  base.placeId = placeId;
  delete base.sourcePlaceId;

  if (!toPlainString(base.mapsUrl)) {
    base.mapsUrl = toPlainString(incoming.mapsUrl) || buildMapsUrl(base.name, base.address, placeId);
  }
  if (!toPlainString(base.website) && toPlainString(incoming.website)) {
    base.website = toPlainString(incoming.website);
  }
  if (!toPlainString(base.phone) && toPlainString(incoming.phone)) {
    base.phone = toPlainString(incoming.phone);
  }
  if (!toPlainString(base.photoUrl) && toPlainString(incoming.photoUrl)) {
    base.photoUrl = toPlainString(incoming.photoUrl);
  }
  if (!toPlainString(base.editorialSummary) && toPlainString(incoming.editorialSummary)) {
    base.editorialSummary = toPlainString(incoming.editorialSummary);
  }
  if (!toPlainString(base.instagram) && toPlainString(incoming.instagram)) {
    base.instagram = toPlainString(incoming.instagram);
  }

  if ((base.googleRating === null || base.googleRating === undefined || base.googleRating === "") && incoming.googleRating !== undefined) {
    base.googleRating = incoming.googleRating;
  }
  if ((base.googleReviewCount === null || base.googleReviewCount === undefined || base.googleReviewCount === "") && incoming.googleReviewCount !== undefined) {
    base.googleReviewCount = incoming.googleReviewCount;
  }
  if ((base.rating === null || base.rating === undefined || base.rating === "") && incoming.rating !== undefined) {
    base.rating = incoming.rating;
  }
  if (!toPlainString(base.budget) && toPlainString(incoming.budget)) {
    base.budget = toPlainString(incoming.budget);
  }

  if (!toPlainString(base.mapsUrl)) {
    base.mapsUrl = buildMapsUrl(base.name, base.address, placeId);
  }

  if (!Object.prototype.hasOwnProperty.call(base, "website")) {
    base.website = "";
  }
  if (!Object.prototype.hasOwnProperty.call(base, "phone")) {
    base.phone = "";
  }

  return base;
}

function compareRecords(leftRecord, rightRecord) {
  const leftCity = toPlainString(leftRecord.city);
  const rightCity = toPlainString(rightRecord.city);
  const cityComparison = leftCity.localeCompare(rightCity, "tr");
  if (cityComparison !== 0) {
    return cityComparison;
  }

  const leftDistrict = toPlainString(leftRecord.district);
  const rightDistrict = toPlainString(rightRecord.district);
  const districtComparison = leftDistrict.localeCompare(rightDistrict, "tr");
  if (districtComparison !== 0) {
    return districtComparison;
  }

  return toPlainString(leftRecord.name).localeCompare(toPlainString(rightRecord.name), "tr");
}

function createDedupeStore() {
  const records = new Map();
  const aliases = new Map();
  let nextId = 1;

  function attachAliases(recordId, record) {
    const aliasKeys = [
      getPlaceId(record) ? `pid:${getPlaceId(record)}` : "",
      getAddressKey(record) ? `addr:${getAddressKey(record)}` : "",
      getStrictKey(record) ? `name:${getStrictKey(record)}` : "",
    ].filter(Boolean);

    for (const aliasKey of aliasKeys) {
      aliases.set(aliasKey, recordId);
    }
  }

  function mergeIntoExisting(recordId, incomingRecord) {
    const existingRecord = records.get(recordId);
    const mergedRecord = mergeRecord(existingRecord, incomingRecord);
    records.set(recordId, mergedRecord);
    attachAliases(recordId, mergedRecord);
    return mergedRecord;
  }

  function upsert(incomingRecord) {
    const record = { ...incomingRecord };
    const candidateRecordIds = [];
    const aliasKeys = [
      getPlaceId(record) ? `pid:${getPlaceId(record)}` : "",
      getAddressKey(record) ? `addr:${getAddressKey(record)}` : "",
      getStrictKey(record) ? `name:${getStrictKey(record)}` : "",
    ].filter(Boolean);

    for (const aliasKey of aliasKeys) {
      const recordId = aliases.get(aliasKey);
      if (recordId && !candidateRecordIds.includes(recordId)) {
        candidateRecordIds.push(recordId);
      }
    }

    if (candidateRecordIds.length === 0) {
      const recordId = `record-${nextId}`;
      nextId += 1;
      const normalizedRecord = mergeRecord({}, record);
      records.set(recordId, normalizedRecord);
      attachAliases(recordId, normalizedRecord);
      return { inserted: true, updated: false, record: normalizedRecord };
    }

    const primaryId = candidateRecordIds[0];
    for (let index = 1; index < candidateRecordIds.length; index += 1) {
      const duplicateId = candidateRecordIds[index];
      const duplicateRecord = records.get(duplicateId);
      if (!duplicateRecord) {
        continue;
      }

      mergeIntoExisting(primaryId, duplicateRecord);
      records.delete(duplicateId);
      for (const [aliasKey, aliasId] of aliases.entries()) {
        if (aliasId === duplicateId) {
          aliases.set(aliasKey, primaryId);
        }
      }
    }

    const before = JSON.stringify(records.get(primaryId));
    const afterRecord = mergeIntoExisting(primaryId, record);
    const after = JSON.stringify(afterRecord);

    return { inserted: false, updated: before !== after, record: afterRecord };
  }

  function toArray() {
    return [...records.values()].sort(compareRecords);
  }

  return {
    upsert,
    toArray,
  };
}

function classifyCuisine(rawCuisine) {
  const cuisine = normalizeText(rawCuisine);
  for (const [needle, targetKey] of CUISINE_TO_TARGET.entries()) {
    if (cuisine.includes(needle)) {
      return targetKey;
    }
  }
  return "restoran";
}

function createVenueIndexes(venues) {
  const byPlaceId = new Map();
  const byStrictKey = new Map();

  for (const venue of venues) {
    const placeId = getPlaceId(venue);
    if (placeId && !byPlaceId.has(placeId)) {
      byPlaceId.set(placeId, venue);
    }

    const strictKey = getStrictKey(venue);
    if (strictKey && !byStrictKey.has(strictKey)) {
      byStrictKey.set(strictKey, venue);
    }
  }

  return { byPlaceId, byStrictKey };
}

function createKeyifRecordFromYemek(yemekRecord, referenceRecord) {
  const placeId = getPlaceId(referenceRecord || {}) || getPlaceId(yemekRecord);
  const mapsUrl =
    toPlainString(referenceRecord && referenceRecord.mapsUrl) ||
    buildMapsUrl(yemekRecord.name, yemekRecord.address, placeId);

  return {
    city: toPlainString(yemekRecord.city),
    district: toPlainString(yemekRecord.district),
    name: toPlainString(yemekRecord.name),
    address: toPlainString((referenceRecord && referenceRecord.address) || yemekRecord.address),
    cuisine: toPlainString(yemekRecord.cuisine),
    placeId,
    mapsUrl,
    website: toPlainString(referenceRecord && referenceRecord.website),
    phone: toPlainString(referenceRecord && referenceRecord.phone),
    googleRating:
      referenceRecord && referenceRecord.rating !== undefined ? referenceRecord.rating : null,
    rating: referenceRecord && referenceRecord.rating !== undefined ? referenceRecord.rating : null,
    budget: toPlainString(referenceRecord && referenceRecord.budget),
    photoUrl: "",
    editorialSummary: "",
    instagram: toPlainString(referenceRecord && referenceRecord.instagram),
  };
}

function mergeCategoryData(targetKey, existingRecords, additions) {
  const store = createDedupeStore();
  for (const record of existingRecords) {
    store.upsert(record);
  }

  let insertedCount = 0;
  let updatedCount = 0;
  for (const record of additions) {
    const result = store.upsert(record);
    if (result.inserted) {
      insertedCount += 1;
    } else if (result.updated) {
      updatedCount += 1;
    }
  }

  const finalRecords = store.toArray();
  return {
    targetKey,
    records: finalRecords,
    insertedCount,
    updatedCount,
  };
}

function main() {
  const yemekRecords = readJson(YEMEK_FILE);
  const venueRecords = readJson(VENUES_FILE);
  const venueIndexes = createVenueIndexes(venueRecords);

  const additionsByTarget = new Map();
  for (const targetKey of Object.keys(TARGETS)) {
    additionsByTarget.set(targetKey, []);
  }

  for (const yemekRecord of yemekRecords) {
    const strictKey = getStrictKey(yemekRecord);
    const referenceRecord =
      venueIndexes.byPlaceId.get(getPlaceId(yemekRecord)) ||
      (strictKey ? venueIndexes.byStrictKey.get(strictKey) : null) ||
      null;

    const targetKey = classifyCuisine(yemekRecord.cuisine);
    additionsByTarget.get(targetKey).push(createKeyifRecordFromYemek(yemekRecord, referenceRecord));
  }

  const report = [];

  for (const [targetKey, targetDefinition] of Object.entries(TARGETS)) {
    const existingRecords = readJson(targetDefinition.file);
    const backupPath = writeBackup(targetDefinition.file);
    const mergeResult = mergeCategoryData(targetKey, existingRecords, additionsByTarget.get(targetKey) || []);
    writeJson(targetDefinition.file, mergeResult.records);

    report.push({
      targetKey,
      label: targetDefinition.label,
      backupPath: path.relative(ROOT_DIR, backupPath),
      beforeCount: existingRecords.length,
      additionsCount: (additionsByTarget.get(targetKey) || []).length,
      afterCount: mergeResult.records.length,
      insertedCount: mergeResult.insertedCount,
      updatedCount: mergeResult.updatedCount,
    });
  }

  console.log(JSON.stringify({
    yemekCount: yemekRecords.length,
    report,
  }, null, 2));
}

main();
