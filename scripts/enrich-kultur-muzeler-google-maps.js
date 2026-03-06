#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const WEB_DATA_FILE = path.join(ROOT, "data", "kultur-muzeler.json");
const ANDROID_DATA_FILE = path.join(ROOT, "android_app", "assets", "web", "data", "kultur-muzeler.json");
const DISTRICTS_FILE = path.join(ROOT, "data", "districts.json");
const ENV_FILE = path.join(ROOT, ".env");

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.addressComponents",
  "places.location",
].join(",");

const DETAIL_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "googleMapsUri",
  "websiteUri",
  "nationalPhoneNumber",
  "addressComponents",
  "location",
].join(",");

const REQUEST_DELAY_MS = Math.max(0, Number.parseInt(process.env.REQUEST_DELAY_MS || "130", 10));
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || "3", 10));
const SAVE_EVERY = Math.max(1, Number.parseInt(process.env.SAVE_EVERY || "20", 10));
const START_INDEX = Math.max(0, Number.parseInt(process.env.START_INDEX || "0", 10));
const LIMIT = Math.max(0, Number.parseInt(process.env.LIMIT || "0", 10));
const MAX_RESULTS = Math.max(1, Math.min(10, Number.parseInt(process.env.MAX_RESULTS || "6", 10)));
const MIN_SCORE = Number.parseFloat(process.env.MIN_SCORE || "8.5");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveApiKey() {
  const fromEnv = normalizeText(process.env.PLACES_API_KEY);
  if (fromEnv) {
    return fromEnv;
  }

  if (!fs.existsSync(ENV_FILE)) {
    return "";
  }

  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    if (key !== "PLACES_API_KEY") {
      continue;
    }
    return normalizeText(trimmed.slice(separator + 1));
  }

  return "";
}

function requestJson(method, pathname, payload, apiKey, extraHeaders = {}) {
  const body = payload ? JSON.stringify(payload) : "";
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method,
        hostname: "places.googleapis.com",
        path: pathname,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "X-Goog-Api-Key": apiKey,
          ...extraHeaders,
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            parsed = null;
          }

          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed || {});
            return;
          }

          const message =
            parsed?.error?.message
            || parsed?.message
            || `HTTP ${response.statusCode || 0}`;
          reject(new Error(message));
        });
      },
    );

    request.on("error", (error) => reject(error));
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

async function requestWithRetry(work) {
  let lastError = null;
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_LIMIT) {
        await sleep(REQUEST_DELAY_MS * attempt);
      }
    }
  }
  throw lastError;
}

async function searchPlaces(apiKey, query) {
  const payload = {
    textQuery: query,
    languageCode: "tr",
    regionCode: "TR",
    maxResultCount: MAX_RESULTS,
  };

  const response = await requestJson("POST", "/v1/places:searchText", payload, apiKey, {
    "X-Goog-FieldMask": SEARCH_FIELD_MASK,
  });
  return Array.isArray(response?.places) ? response.places : [];
}

async function getPlaceById(apiKey, placeId) {
  const cleaned = normalizeText(placeId);
  if (!cleaned) {
    return null;
  }

  const pathname = `/v1/places/${encodeURIComponent(cleaned)}`;
  return requestJson("GET", pathname, null, apiKey, {
    "X-Goog-FieldMask": DETAIL_FIELD_MASK,
  });
}

function buildCityResolver(districtMap) {
  const keys = Object.keys(districtMap).map((cityKey) => ({
    key: cityKey,
    normalized: normalizeForCompare(cityKey),
  }));

  return (cityName) => {
    const direct = normalizeText(cityName);
    if (districtMap[direct]) {
      return direct;
    }

    const wanted = normalizeForCompare(cityName);
    if (!wanted) {
      return "";
    }

    let best = "";
    let bestScore = -1;
    for (const row of keys) {
      let score = 0;
      if (row.normalized === wanted) {
        score = 100;
      } else if (row.normalized.includes(wanted) || wanted.includes(row.normalized)) {
        score = Math.min(row.normalized.length, wanted.length);
      }
      if (score > bestScore) {
        bestScore = score;
        best = row.key;
      }
    }
    return bestScore > 0 ? best : "";
  };
}

function buildDistrictMatchers(districtMap) {
  const output = new Map();
  Object.entries(districtMap).forEach(([city, districts]) => {
    const rows = (Array.isArray(districts) ? districts : [])
      .map((district) => normalizeText(district))
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)
      .map((district) => ({
        district,
        token: normalizeForCompare(district),
      }))
      .filter((row) => row.token.length >= 2);
    output.set(city, rows);
  });
  return output;
}

function isMerkez(value) {
  return normalizeForCompare(value) === "merkez";
}

function districtFromAddressText(cityKey, text, districtMatchers) {
  const rows = districtMatchers.get(cityKey) || [];
  const haystack = normalizeForCompare(text);
  if (!haystack) {
    return "Merkez";
  }

  for (const row of rows) {
    const pattern = new RegExp(`(^|[^a-z0-9])${row.token}($|[^a-z0-9])`, "i");
    if (pattern.test(haystack)) {
      return row.district;
    }
  }
  return "Merkez";
}

function districtFromAddressComponents(cityKey, components, districtMatchers) {
  const rows = districtMatchers.get(cityKey) || [];
  if (!rows.length || !Array.isArray(components)) {
    return "Merkez";
  }

  for (const component of components) {
    const longText = normalizeText(component?.longText);
    const shortText = normalizeText(component?.shortText);
    const types = Array.isArray(component?.types) ? component.types : [];
    if (!types.length) {
      continue;
    }

    if (
      types.includes("administrative_area_level_2")
      || types.includes("locality")
      || types.includes("sublocality_level_1")
      || types.includes("administrative_area_level_3")
    ) {
      const candidate = districtFromAddressText(cityKey, `${longText} ${shortText}`, districtMatchers);
      if (!isMerkez(candidate)) {
        return candidate;
      }
    }
  }

  return "Merkez";
}

function buildSearchQuery(record, cityKey) {
  return [
    normalizeText(record.name),
    normalizeText(cityKey || record.city),
    "Türkiye",
  ].filter(Boolean).join(" ");
}

function tokenize(value) {
  return normalizeForCompare(value).split(" ").filter((token) => token.length >= 2);
}

function placeNameValue(place) {
  return normalizeText(place?.displayName?.text || place?.displayName || "");
}

function scorePlace(record, cityKey, place) {
  const recordName = normalizeForCompare(record.name);
  const placeName = normalizeForCompare(placeNameValue(place));
  const address = normalizeForCompare(place?.formattedAddress || "");
  const cityToken = normalizeForCompare(cityKey || record.city);

  if (!recordName || !placeName) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  if (recordName === placeName) {
    score += 13;
  } else if (recordName.includes(placeName) || placeName.includes(recordName)) {
    score += 9;
  }

  const wantedTokens = tokenize(recordName);
  const hitTokens = wantedTokens.filter((token) => placeName.includes(token));
  score += hitTokens.length * 1.3;

  if (cityToken && address.includes(cityToken)) {
    score += 4.5;
  } else {
    score -= 2.5;
  }

  if (address.includes("turkiye") || address.includes("türkiye")) {
    score += 0.5;
  }

  if (placeName.includes("muze") || placeName.includes("museum")) {
    score += 0.8;
  }

  return score;
}

function rankPlaces(record, cityKey, places) {
  return places
    .map((place) => ({ place, score: scorePlace(record, cityKey, place) }))
    .sort((left, right) => right.score - left.score);
}

function inferDistrict(cityKey, place, districtMatchers) {
  const byComponents = districtFromAddressComponents(cityKey, place?.addressComponents, districtMatchers);
  if (!isMerkez(byComponents)) {
    return byComponents;
  }

  return districtFromAddressText(
    cityKey,
    [
      place?.formattedAddress,
      placeNameValue(place),
      normalizeText((place?.addressComponents || []).map((x) => x?.longText || "").join(" ")),
    ].filter(Boolean).join(" "),
    districtMatchers,
  );
}

function enrichFromPlace(record, district, place) {
  const next = { ...record };
  next.district = district;
  next.address = normalizeText(place?.formattedAddress || record.address || `${district}, ${record.city}, Türkiye`);

  const mapsUrl = normalizeText(place?.googleMapsUri);
  if (mapsUrl) {
    next.mapsUrl = mapsUrl;
  }

  const website = normalizeText(place?.websiteUri);
  if (website && !normalizeText(record.website)) {
    next.website = website;
  }

  const phone = normalizeText(place?.nationalPhoneNumber);
  if (phone && !normalizeText(record.phone)) {
    next.phone = phone;
  }

  const placeId = normalizeText(place?.id);
  if (placeId) {
    next.sourcePlaceId = placeId;
  }

  next.editorialSummary = "Kaynak: Google Maps/Places eşleştirmesi ile ilçe güncellendi.";
  return next;
}

function copyToAndroid(payload) {
  writeJson(ANDROID_DATA_FILE, payload);
}

async function main() {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error("PLACES_API_KEY bulunamadı.");
  }

  if (!fs.existsSync(WEB_DATA_FILE) || !fs.existsSync(DISTRICTS_FILE)) {
    throw new Error("Gerekli veri dosyaları bulunamadı.");
  }

  const districts = readJson(DISTRICTS_FILE);
  const cityResolver = buildCityResolver(districts);
  const districtMatchers = buildDistrictMatchers(districts);
  const data = readJson(WEB_DATA_FILE);

  if (!Array.isArray(data)) {
    throw new Error("kultur-muzeler.json dizi değil.");
  }

  const targetIndexes = data
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => isMerkez(row.district))
    .map(({ index }) => index);

  const end = LIMIT > 0 ? Math.min(targetIndexes.length, START_INDEX + LIMIT) : targetIndexes.length;
  const selected = targetIndexes.slice(START_INDEX, end);

  let scanned = 0;
  let updated = 0;
  let unmatched = 0;
  let failed = 0;
  const errorCounts = new Map();

  for (let i = 0; i < selected.length; i += 1) {
    const index = selected[i];
    const record = data[index];
    const cityKey = cityResolver(record.city);
    scanned += 1;

    if (!cityKey || !(districtMatchers.get(cityKey) || []).length) {
      unmatched += 1;
      continue;
    }

    try {
      const query = buildSearchQuery(record, cityKey);
      const places = await requestWithRetry(() => searchPlaces(apiKey, query));
      const ranked = rankPlaces(record, cityKey, places);

      let chosen = null;
      let chosenDistrict = "Merkez";

      for (const candidate of ranked) {
        if (!candidate?.place || candidate.score < MIN_SCORE) {
          continue;
        }
        let place = candidate.place;
        if (normalizeText(place?.id)) {
          try {
            const full = await requestWithRetry(() => getPlaceById(apiKey, place.id));
            place = full || place;
          } catch {
            // Keep search payload if detail fails.
          }
        }

        const district = inferDistrict(cityKey, place, districtMatchers);
        if (!isMerkez(district)) {
          chosen = place;
          chosenDistrict = district;
          break;
        }
      }

      if (chosen && !isMerkez(chosenDistrict)) {
        data[index] = enrichFromPlace(record, chosenDistrict, chosen);
        updated += 1;
      } else {
        unmatched += 1;
      }
    } catch (error) {
      failed += 1;
      const message = normalizeText(error?.message) || "Bilinmeyen hata";
      errorCounts.set(message, (errorCounts.get(message) || 0) + 1);
      if (failed <= 3) {
        process.stdout.write(`[kultur-google] hata ornek ${failed}: ${record?.name || "-"} / ${record?.city || "-"} -> ${message}\n`);
      }
    }

    if ((i + 1) % SAVE_EVERY === 0) {
      writeJson(WEB_DATA_FILE, data);
      copyToAndroid(data);
      process.stdout.write(`[kultur-google] ilerleme ${i + 1}/${selected.length}, guncellenen=${updated}\n`);
    }

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  writeJson(WEB_DATA_FILE, data);
  copyToAndroid(data);

  const merkezLeft = data.filter((row) => isMerkez(row.district)).length;
  process.stdout.write(`[kultur-google] hedef=${selected.length} taranan=${scanned}\n`);
  process.stdout.write(`[kultur-google] guncellenen=${updated} eslesmeyen=${unmatched} hatali=${failed}\n`);
  if (errorCounts.size > 0) {
    const sorted = Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [message, count] of sorted) {
      process.stdout.write(`[kultur-google] hata-ozet (${count}): ${message}\n`);
    }
  }
  process.stdout.write(`[kultur-google] merkez kalan=${merkezLeft}\n`);
}

main().catch((error) => {
  process.stderr.write(`[kultur-google] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
