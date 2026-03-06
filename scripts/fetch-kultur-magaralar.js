#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "data", "kultur-magaralar.json");
const ANDROID_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "kultur-magaralar.json",
);
const DISTRICTS_FILE = path.join(ROOT, "data", "districts.json");

const BASE_URL = "https://www.kulturportali.gov.tr";
const DEFAULT_PAGE_URL = `${BASE_URL}/harita/default.aspx`;
const GET_ALT_KATEGORILER_URL = `${DEFAULT_PAGE_URL}/GetirAltKategoriler`;
const GET_SEHIR_REHBERI_URL = `${DEFAULT_PAGE_URL}/GetirSehirSehberi`;

const LISTE_ADI = "GEZILECEK_YER_TURLERI-5";
const FALLBACK_MAGARA_TUR_KOD = "11";
const REQUEST_TIMEOUT_MS = 45000;
const REQUEST_RETRY_COUNT = 3;
const REQUEST_RETRY_DELAY_MS = 450;
const CITY_CONCURRENCY = 6;
const SOURCE_LABEL = "Kaynak: kulturportali.gov.tr harita API (Gezilecek Yerler > Mağara)";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value) {
  const source = String(value || "");
  if (!source) {
    return "";
  }

  return source
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10) || 0))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16) || 0));
}

function stripHtml(value) {
  return normalizeText(decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, " ")));
}

function normalizeForLookup(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function parsePostalCode(address) {
  const match = normalizeText(address).match(/\b\d{5}\b/);
  return match ? match[0] : "";
}

function toAbsoluteUrl(rawUrl) {
  const value = normalizeText(decodeHtmlEntities(rawUrl));
  if (!value) {
    return "";
  }
  try {
    return new URL(value, BASE_URL).toString();
  } catch (_error) {
    return "";
  }
}

async function fetchJsonWithRetry(url, options = {}, retryLabel = "") {
  let lastError = null;
  for (let attempt = 1; attempt <= REQUEST_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "aramabul-kultur-magara-fetcher/1.0 (+https://aramabul.com)",
          "Accept": "application/json, text/plain, */*",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`request_failed:${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRY_COUNT) {
        await sleep(REQUEST_RETRY_DELAY_MS * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  const prefix = retryLabel ? `${retryLabel}:` : "";
  throw new Error(`${prefix}${String(lastError && lastError.message ? lastError.message : lastError)}`);
}

async function fetchTextWithRetry(url, options = {}, retryLabel = "") {
  let lastError = null;
  for (let attempt = 1; attempt <= REQUEST_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "aramabul-kultur-magara-fetcher/1.0 (+https://aramabul.com)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`request_failed:${response.status}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRY_COUNT) {
        await sleep(REQUEST_RETRY_DELAY_MS * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  const prefix = retryLabel ? `${retryLabel}:` : "";
  throw new Error(`${prefix}${String(lastError && lastError.message ? lastError.message : lastError)}`);
}

function parseCityOptionsFromPage(html) {
  const selectMatch = String(html || "").match(/<select[^>]*id="ddlIller"[^>]*>([\s\S]*?)<\/select>/i);
  const block = selectMatch ? selectMatch[1] : "";
  const optionRegex = /<option[^>]*value="([^"]+)"[^>]*>([\s\S]*?)<\/option>/gi;
  const cities = [];
  let match;
  while ((match = optionRegex.exec(block)) !== null) {
    const slug = normalizeText(decodeHtmlEntities(match[1]));
    const city = normalizeText(decodeHtmlEntities(match[2]));
    if (!slug || !city) {
      continue;
    }
    cities.push({ slug, city });
  }
  return cities;
}

function parseCityIdFromPage(html) {
  const match = String(html || "").match(/var\s+ilgenelbilgiid\s*=\s*"(\d+)"/i);
  return match ? String(match[1]) : "";
}

function parseServicePayloadArray(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const raw = payload.d;
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

async function fetchMagaraTurKodu() {
  const payload = await fetchJsonWithRetry(
    GET_ALT_KATEGORILER_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ listeAdi: LISTE_ADI }),
    },
    "GetirAltKategoriler",
  );

  const categories = parseServicePayloadArray(payload);
  const found = categories.find((item) => normalizeForLookup(item && item.Ad).includes("magara"));
  return normalizeText(found && found.Kod) || FALLBACK_MAGARA_TUR_KOD;
}

async function fetchCityId(citySlug) {
  const url = `${DEFAULT_PAGE_URL}?il=${encodeURIComponent(citySlug)}`;
  const html = await fetchTextWithRetry(url, {}, `city_page_${citySlug}`);
  return parseCityIdFromPage(html);
}

async function fetchMagaraRowsForCity(cityId, turKod) {
  const payload = await fetchJsonWithRetry(
    GET_SEHIR_REHBERI_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        ilGenelBilgiId: String(cityId),
        listeAdi: LISTE_ADI,
        turKod: String(turKod),
        kelime: "",
      }),
    },
    `GetirSehirSehberi:${cityId}`,
  );

  return parseServicePayloadArray(payload);
}

function buildDistrictLookup() {
  const raw = JSON.parse(fs.readFileSync(DISTRICTS_FILE, "utf8"));
  const lookup = new Map();
  Object.entries(raw || {}).forEach(([city, districts]) => {
    const cityKey = normalizeForLookup(city);
    const normalizedDistricts = Array.isArray(districts)
      ? [...districts]
        .filter(Boolean)
        .map((district) => normalizeText(district))
        .sort((left, right) => right.length - left.length)
      : [];
    lookup.set(cityKey, normalizedDistricts);
  });
  return lookup;
}

function detectDistrict(address, city, districtLookup) {
  const normalizedAddress = normalizeForLookup(address);
  if (!normalizedAddress) {
    return "Merkez";
  }

  const cityKey = normalizeForLookup(city);
  const districts = districtLookup.get(cityKey) || [];
  const district = districts.find((candidate) => {
    const key = normalizeForLookup(candidate);
    return key && normalizedAddress.includes(key);
  });

  if (district) {
    return district;
  }
  return "Merkez";
}

function dedupeRecords(records) {
  const seen = new Set();
  const unique = [];
  records.forEach((record) => {
    const key = normalizeForLookup(
      `${record.sourcePlaceId}|${record.city}|${record.name}|${record.address || ""}`,
    );
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(record);
  });
  return unique;
}

function mapRowToVenue(row, city, districtLookup) {
  const name = stripHtml(row && row.title);
  if (!name) {
    return null;
  }

  const address = stripHtml(row && row.address);
  const district = detectDistrict(address, city, districtLookup);
  const latitude = Number.parseFloat(row && row.latitude);
  const longitude = Number.parseFloat(row && row.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const website = toAbsoluteUrl(row && row.url);

  const markerImage = toAbsoluteUrl(row && row.marker_image);
  const galleryImage = Array.isArray(row && row.gallery) ? toAbsoluteUrl(row.gallery[0]) : "";
  const photoUrl = markerImage || galleryImage || "";

  return {
    city,
    district,
    name,
    cuisine: "Mağaralar",
    address,
    neighborhood: "",
    postalCode: parsePostalCode(address),
    mapsUrl: hasCoordinates
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : `https://maps.google.com/?q=${encodeURIComponent(`${name} ${city}`)}`,
    website,
    phone: stripHtml(row && row.phone),
    photoUrl,
    editorialSummary: SOURCE_LABEL,
    sourcePlaceId: normalizeText(row && row.id),
  };
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { __error: error };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(workers);
  return results;
}

function writeOutput(records) {
  const payload = `${JSON.stringify(records, null, 2)}\n`;
  [OUTPUT_FILE, ANDROID_OUTPUT_FILE].forEach((filePath) => {
    ensureParentDir(filePath);
    fs.writeFileSync(filePath, payload, "utf8");
  });
}

async function main() {
  const landingHtml = await fetchTextWithRetry(`${DEFAULT_PAGE_URL}?il=ankara`, {}, "landing_page");
  const cities = parseCityOptionsFromPage(landingHtml);
  if (cities.length === 0) {
    throw new Error("şehir listesi bulunamadı");
  }

  const turKod = await fetchMagaraTurKodu();
  console.log(`==> İl sayısı: ${cities.length}`);
  console.log(`==> Mağara tur kodu: ${turKod}`);

  const cityWithIdResults = await mapWithConcurrency(
    cities,
    async (city) => {
      const cityId = await fetchCityId(city.slug);
      if (!cityId) {
        throw new Error(`ilgenelbilgiid bulunamadı: ${city.slug}`);
      }
      return { ...city, cityId };
    },
    CITY_CONCURRENCY,
  );

  const cityErrors = cityWithIdResults.filter((row) => row && row.__error);
  if (cityErrors.length > 0) {
    throw new Error(`şehir id çözümleme hatası: ${cityErrors.length}`);
  }

  const citiesWithIds = cityWithIdResults.filter(Boolean);
  const districtLookup = buildDistrictLookup();

  const dataResults = await mapWithConcurrency(
    citiesWithIds,
    async (city) => {
      const rows = await fetchMagaraRowsForCity(city.cityId, turKod);
      return { city, rows };
    },
    CITY_CONCURRENCY,
  );

  const dataErrors = dataResults.filter((row) => row && row.__error);
  if (dataErrors.length > 0) {
    throw new Error(`şehir veri çekme hatası: ${dataErrors.length}`);
  }

  const mapped = [];
  dataResults.forEach((entry) => {
    const cityName = entry.city.city;
    const rows = Array.isArray(entry.rows) ? entry.rows : [];
    rows.forEach((row) => {
      const venue = mapRowToVenue(row, cityName, districtLookup);
      if (venue) {
        mapped.push(venue);
      }
    });
  });

  const unique = dedupeRecords(mapped)
    .sort(
      (left, right) => left.city.localeCompare(right.city, "tr") || left.name.localeCompare(right.name, "tr"),
    );

  writeOutput(unique);
  console.log(`==> Toplam mağara kaydı: ${unique.length}`);
  console.log(`==> Yazıldı: ${OUTPUT_FILE}`);
  console.log(`==> Yazıldı: ${ANDROID_OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("fetch-kultur-magaralar hata:", error && error.message ? error.message : error);
  process.exitCode = 1;
});
