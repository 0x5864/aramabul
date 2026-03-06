#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "data", "kultur-selaleler.json");
const ANDROID_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "kultur-selaleler.json",
);
const DISTRICTS_FILE = path.join(ROOT, "data", "districts.json");

const BASE_URL = "https://www.kulturportali.gov.tr";
const LIST_ENDPOINT = `${BASE_URL}/Moduller/GezilecekYerler.aspx/GezilecekYerleriFilitreliGetir`;
const SOURCE_LABEL = "Kaynak: kulturportali.gov.tr (Gezilecek Yerler > Şelale, tur=65)";

const TUR_KOD = 65;
const PAGE_SIZE = 12;
const REQUEST_TIMEOUT_MS = 45000;
const REQUEST_RETRY_COUNT = 3;
const REQUEST_RETRY_DELAY_MS = 450;
const DETAIL_CONCURRENCY = 5;

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

function normalizeSlug(value) {
  return normalizeForLookup(value).replace(/[^a-z0-9]/g, "");
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
          "User-Agent": "aramabul-kultur-selale-fetcher/1.0 (+https://aramabul.com)",
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
          "User-Agent": "aramabul-kultur-selale-fetcher/1.0 (+https://aramabul.com)",
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

async function fetchWaterfallPage(pageNumber) {
  const payload = await fetchJsonWithRetry(
    LIST_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        sira: Number(pageNumber),
        sayi: PAGE_SIZE,
        TurKod: TUR_KOD,
        TurizmTurKod: 0,
        ilID: 0,
        gorsel: false,
        nearest: false,
        aramaText: "",
        etiket: "",
        HariciEtiket: "",
        lat: "0",
        lang: "0",
      }),
    },
    `GezilecekYerleriFilitreliGetir:${pageNumber}`,
  );

  return parseServicePayloadArray(payload);
}

function buildDistrictLookup() {
  const raw = JSON.parse(fs.readFileSync(DISTRICTS_FILE, "utf8"));
  const districtLookup = new Map();
  const citySlugLookup = new Map();

  Object.entries(raw || {}).forEach(([city, districts]) => {
    const cityKey = normalizeForLookup(city);
    const citySlugKey = normalizeSlug(city);
    const normalizedDistricts = Array.isArray(districts)
      ? [...districts]
        .filter(Boolean)
        .map((district) => normalizeText(district))
        .sort((left, right) => right.length - left.length)
      : [];

    districtLookup.set(cityKey, normalizedDistricts);
    citySlugLookup.set(citySlugKey, city);
  });

  return { districtLookup, citySlugLookup };
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

  return district || "Merkez";
}

function resolveCityFromUrl(detailUrl, citySlugLookup) {
  const value = normalizeText(detailUrl);
  if (!value) {
    return "";
  }

  let url;
  try {
    url = new URL(value, BASE_URL);
  } catch (_error) {
    return "";
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const citySlug = parts.length >= 2 ? parts[1] : "";
  const city = citySlugLookup.get(normalizeSlug(citySlug));
  if (city) {
    return city;
  }

  return normalizeText(decodeURIComponent(citySlug).replaceAll("-", " "));
}

function extractFieldHtml(html, labelText) {
  const labelPattern = labelText
    .replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll(" ", "\\s*");
  const regex = new RegExp(
    `<label>\\s*${labelPattern}\\s*:\\s*<\\/label>\\s*<span>([\\s\\S]*?)<\\/span>`,
    "i",
  );
  const match = String(html || "").match(regex);
  return match ? match[1] : "";
}

function extractCoordinates(html) {
  const match = String(html || "").match(/center:\s*\[\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\]/i);
  if (!match) {
    return { latitude: null, longitude: null };
  }
  const latitude = Number.parseFloat(match[1]);
  const longitude = Number.parseFloat(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude: null, longitude: null };
  }
  return { latitude, longitude };
}

function buildMapsUrl(latitude, longitude, name, city) {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }
  return `https://maps.google.com/?q=${encodeURIComponent(`${name} ${city}`)}`;
}

function dedupeListItems(items) {
  const seen = new Set();
  const unique = [];
  items.forEach((item) => {
    const absoluteUrl = toAbsoluteUrl(item && item.Url);
    const title = stripHtml(item && item.Baslik);
    const key = normalizeForLookup(`${absoluteUrl}|${title}`);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(item);
  });
  return unique;
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

async function fetchAllWaterfallListItems() {
  const firstPage = await fetchWaterfallPage(1);
  const totalCount = Number(firstPage[0] && firstPage[0].KayitSayisi) || firstPage.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const all = [...firstPage];
  for (let page = 2; page <= totalPages; page += 1) {
    const rows = await fetchWaterfallPage(page);
    all.push(...rows);
  }

  const unique = dedupeListItems(all);
  return { totalCount, totalPages, items: unique };
}

async function main() {
  const { districtLookup, citySlugLookup } = buildDistrictLookup();
  const { totalCount, totalPages, items } = await fetchAllWaterfallListItems();

  console.log(`==> Şelale listesi (tur=65) toplam kayıt: ${totalCount}`);
  console.log(`==> Sayfa sayısı: ${totalPages}`);
  console.log(`==> Tekil liste kaydı: ${items.length}`);

  const detailResults = await mapWithConcurrency(
    items,
    async (item) => {
      const name = stripHtml(item && item.Baslik);
      const detailUrl = toAbsoluteUrl(item && item.Url);
      const city = resolveCityFromUrl(detailUrl, citySlugLookup);
      if (!name || !detailUrl || !city) {
        return null;
      }

      const html = await fetchTextWithRetry(detailUrl, {}, `detail:${detailUrl}`);
      const address = stripHtml(extractFieldHtml(html, "Adres"));
      const phone = stripHtml(extractFieldHtml(html, "Telefon"));
      const websiteField = extractFieldHtml(html, "İnternet Adresi");
      const websiteHrefMatch = String(websiteField || "").match(/href="([^"]+)"/i);
      const website = websiteHrefMatch ? toAbsoluteUrl(websiteHrefMatch[1]) : stripHtml(websiteField);
      const { latitude, longitude } = extractCoordinates(html);
      const district = detectDistrict(address, city, districtLookup);

      return {
        city,
        district,
        name,
        cuisine: "Şelaleler",
        address,
        neighborhood: "",
        postalCode: parsePostalCode(address),
        mapsUrl: buildMapsUrl(latitude, longitude, name, city),
        website,
        phone,
        photoUrl: toAbsoluteUrl(item && item.Resim),
        editorialSummary: SOURCE_LABEL,
        sourcePlaceId: normalizeText(detailUrl),
      };
    },
    DETAIL_CONCURRENCY,
  );

  const detailErrors = detailResults.filter((entry) => entry && entry.__error);
  if (detailErrors.length > 0) {
    throw new Error(`detay sayfası çekim hatası: ${detailErrors.length}`);
  }

  const mapped = detailResults.filter(Boolean);
  const unique = dedupeRecords(mapped)
    .sort(
      (left, right) => left.city.localeCompare(right.city, "tr") || left.name.localeCompare(right.name, "tr"),
    );

  writeOutput(unique);
  console.log(`==> Toplam şelale kaydı: ${unique.length}`);
  console.log(`==> Yazıldı: ${OUTPUT_FILE}`);
  console.log(`==> Yazıldı: ${ANDROID_OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("fetch-kultur-selaleler hata:", error && error.message ? error.message : error);
  process.exitCode = 1;
});
