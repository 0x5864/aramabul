#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "data", "sanat-galeriler.json");
const ANDROID_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "sanat-galeriler.json",
);

const SOURCE_URL = "https://tiyatrolar.com.tr/galeriler";
const LOAD_MORE_URL = "https://tiyatrolar.com.tr/frontend/load_more_location_via_ajax/?type_enum=galeri";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_PAGES = 600;
const DETAIL_CONCURRENCY = 6;
const DETAIL_MAX_RETRY = 2;
const SOURCE_LABEL = "Kaynak: tiyatrolar.com.tr/galeriler";

const CITY_NORMALIZATION = Object.freeze({
  istanbul: "İstanbul",
  izmir: "İzmir",
  mugla: "Muğla",
  canakkale: "Çanakkale",
  eskisehir: "Eskişehir",
  aydin: "Aydın",
});

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function decodeHtmlEntities(value) {
  const source = String(value || "");
  if (!source) {
    return "";
  }

  const namedDecoded = source
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");

  return namedDecoded
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10) || 0))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16) || 0));
}

function cleanText(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCity(value) {
  const raw = cleanText(value);
  if (!raw) {
    return "";
  }

  const key = raw
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");

  if (CITY_NORMALIZATION[key]) {
    return CITY_NORMALIZATION[key];
  }

  return raw;
}

function toAbsoluteUrl(href) {
  const raw = cleanText(href);
  if (!raw) {
    return "";
  }

  try {
    return new URL(raw, SOURCE_URL).toString();
  } catch (_error) {
    return "";
  }
}

function extractInitialCardsHtml(pageHtml) {
  const match = pageHtml.match(
    /id="area_location"[^>]*>([\s\S]*?)<\/div>\s*<div class="text-center">\s*<a[^>]*class="btn_load_more_item/i,
  );
  return match ? match[1] : "";
}

function parseCards(html) {
  const blocks = String(html || "").match(/<div class="theater-item columns">[\s\S]*?<\/article><\/div>/gi) || [];
  return blocks.map((block) => {
    const nameMatch = block.match(/<h3>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i);
    const linkMatch = block.match(/<h3>\s*<a[^>]*href="([^"]+)"/i);
    const cityMatch = block.match(/<aside class="post-meta[^"]*">\s*([\s\S]*?)\s*<\/aside>/i);
    const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);

    const name = cleanText(nameMatch ? nameMatch[1] : "");
    const city = normalizeCity(cityMatch ? cityMatch[1] : "");
    const website = toAbsoluteUrl(linkMatch ? linkMatch[1] : "");
    const photoUrl = toAbsoluteUrl(imgMatch ? imgMatch[1] : "");
    const hasNoImage = photoUrl.includes("/no-img/");

    if (!name || !city) {
      return null;
    }

    return {
      city,
      district: "Merkez",
      name,
      cuisine: "Galeriler",
      address: `${city}, Türkiye`,
      neighborhood: "",
      postalCode: "",
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${name} ${city}`)}`,
      website,
      phone: "",
      photoUrl: hasNoImage ? "" : photoUrl,
      editorialSummary: SOURCE_LABEL,
      sourcePlaceId: "",
    };
  }).filter(Boolean);
}

function dedupeVenues(venues) {
  const seen = new Set();
  const unique = [];
  venues.forEach((venue) => {
    const key = (venue.website || `${venue.name}|${venue.city}`).toLocaleLowerCase("tr");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(venue);
  });
  return unique;
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "aramabul-bot/1.0 (+https://aramabul.com)",
        "Accept": "*/*",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`request_failed:${response.status}:${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeForLookup(value) {
  return cleanText(value)
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function parsePostalCode(address) {
  const match = cleanText(address).match(/\b\d{5}\b/);
  return match ? match[0] : "";
}

function parseDistrictFromAddress(address, city) {
  const normalizedCity = normalizeForLookup(city);
  const source = cleanText(address);
  if (!source || !normalizedCity) {
    return "";
  }

  const slashMatch = source.match(/([^,/]+)\s*\/\s*([^,/]+)\s*$/);
  if (!slashMatch) {
    return "";
  }

  const districtCandidate = cleanText(slashMatch[1]);
  const cityCandidate = normalizeForLookup(slashMatch[2]);
  if (cityCandidate !== normalizedCity) {
    return "";
  }

  return districtCandidate || "";
}

function extractDetailBlock(html) {
  const match = String(html || "").match(
    /<div class="oyun-location no-border">([\s\S]*?)<\/div><div class="border-section">/i,
  );
  return match ? match[1] : "";
}

function extractDetailAddress(detailBlock) {
  const match = detailBlock.match(/<p class="full">([\s\S]*?)<\/p>/i);
  if (!match) {
    return "";
  }
  return cleanText(match[1]);
}

function extractDetailPhone(detailBlock) {
  const telMatch = detailBlock.match(/<span class="tel">([\s\S]*?)<\/span>/i);
  if (telMatch) {
    return cleanText(telMatch[1]);
  }

  const pTelMatch = detailBlock.match(/<p[^>]*>\s*<i class="ico-tel"><\/i>\s*([\s\S]*?)<\/p>/i);
  return pTelMatch ? cleanText(pTelMatch[1]) : "";
}

function extractDetailEmail(detailBlock) {
  const mailtoMatch = detailBlock.match(/href="mailto:([^"]+)"/i);
  if (mailtoMatch) {
    return cleanText(mailtoMatch[1]);
  }

  const textMatch = detailBlock.match(/<i class="ico-email"><\/i>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
  return textMatch ? cleanText(textMatch[1]) : "";
}

function extractDetailExternalWebsite(detailBlock) {
  const webMatch = detailBlock.match(
    /<i class="ico-web"><\/i>\s*<a[^>]*href="([^"]+)"[^>]*>/i,
  );
  if (!webMatch) {
    return "";
  }
  return toAbsoluteUrl(webMatch[1]);
}

function extractDetailMapsUrl(detailBlock, fallbackName, fallbackCity) {
  const iframeMatch = detailBlock.match(/<iframe[^>]*src="([^"]+)"/i);
  if (iframeMatch) {
    return toAbsoluteUrl(iframeMatch[1]);
  }

  return `https://maps.google.com/?q=${encodeURIComponent(`${fallbackName} ${fallbackCity}`)}`;
}

function extractDetailPrimaryPhoto(html) {
  const firstImageMatch = String(html || "").match(/<img class="first-image"[^>]*src="([^"]+)"/i);
  if (firstImageMatch) {
    const image = toAbsoluteUrl(firstImageMatch[1]);
    if (image && !image.includes("/no-img/")) {
      return image;
    }
  }

  return "";
}

function extractBreadcrumbCityAndDistrict(html) {
  const cityMatch = String(html || "").match(/\/galeriler\?il=\d+">([^<]+)<\/a>/i);
  const districtMatch = String(html || "").match(/\/galeriler\?il=\d+(?:&|&amp;)ilce=\d+">([^<]+)<\/a>/i);

  return {
    city: normalizeCity(cityMatch ? cityMatch[1] : ""),
    district: cleanText(districtMatch ? districtMatch[1] : ""),
  };
}

async function fetchTextWithRetry(url, options = {}, maxRetry = DETAIL_MAX_RETRY) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
    try {
      return await fetchText(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetry) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 500));
      }
    }
  }
  throw lastError || new Error("request_failed");
}

function applyDetailToVenue(venue, detailHtml) {
  const detailBlock = extractDetailBlock(detailHtml);
  if (!detailBlock) {
    return venue;
  }

  const breadcrumb = extractBreadcrumbCityAndDistrict(detailHtml);
  const parsedAddress = extractDetailAddress(detailBlock);
  const address = parsedAddress || venue.address;
  const city = breadcrumb.city || venue.city;
  const district = breadcrumb.district || parseDistrictFromAddress(address, city) || venue.district || "Merkez";
  const phone = extractDetailPhone(detailBlock) || venue.phone || "";
  const email = extractDetailEmail(detailBlock) || "";
  const mapsUrl = extractDetailMapsUrl(detailBlock, venue.name, city);
  const postalCode = parsePostalCode(address);
  const externalWebsite = extractDetailExternalWebsite(detailBlock);
  const photoUrl = extractDetailPrimaryPhoto(detailHtml) || venue.photoUrl || "";

  return {
    ...venue,
    city,
    district,
    address,
    phone,
    email,
    postalCode,
    mapsUrl,
    photoUrl,
    website: externalWebsite || venue.website,
    sourceDetailUrl: venue.website,
    editorialSummary: `${SOURCE_LABEL} ve galeri detay sayfasından alındı.`,
  };
}

async function enrichVenueWithDetails(venue) {
  const detailUrl = toAbsoluteUrl(venue.website);
  if (!detailUrl) {
    return venue;
  }

  try {
    const html = await fetchTextWithRetry(detailUrl);
    return applyDetailToVenue(venue, html);
  } catch (_error) {
    return venue;
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const total = items.length;
  const output = new Array(total);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= total) {
        return;
      }
      nextIndex += 1;

      output[currentIndex] = await mapper(items[currentIndex], currentIndex);
      completed += 1;
      if (completed % 25 === 0 || completed === total) {
        console.log(`[sanat-galeriler] Detay alindi: ${completed}/${total}`);
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, total));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return output;
}

async function enrichAllGalleryDetails(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return [];
  }

  return await mapWithConcurrency(venues, DETAIL_CONCURRENCY, enrichVenueWithDetails);
}

function readInitialOffset(pageHtml) {
  const buttonMatch = pageHtml.match(/class="btn_load_more_item[^"]*"[^>]*\soffset="(\d+)"/i);
  const value = buttonMatch ? Number.parseInt(buttonMatch[1], 10) : 21;
  return Number.isFinite(value) && value > 0 ? value : 21;
}

async function fetchAllGalleryCards() {
  const pageHtml = await fetchText(SOURCE_URL);
  const venues = [];

  const initialCards = parseCards(extractInitialCardsHtml(pageHtml));
  venues.push(...initialCards);

  let offset = readInitialOffset(pageHtml);
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const body = new URLSearchParams({ offset: String(offset) }).toString();
    const payloadText = await fetchText(LOAD_MORE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body,
    });

    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch (_error) {
      throw new Error("invalid_load_more_payload");
    }

    if (!payload || payload.sta !== 1) {
      break;
    }

    const nextCards = parseCards(payload.html || "");
    venues.push(...nextCards);
    pageCount += 1;

    const nextOffset = Number.parseInt(String(payload.new_offset || ""), 10);
    const hasMore = Boolean(payload.html_btn);
    if (!hasMore || !Number.isFinite(nextOffset) || nextOffset <= offset || nextCards.length === 0) {
      break;
    }

    offset = nextOffset;
  }

  return dedupeVenues(venues);
}

function writeJson(filePath, value) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function main() {
  const baseVenues = await fetchAllGalleryCards();
  console.log(`[sanat-galeriler] Liste kaydi: ${baseVenues.length}`);
  const detailedVenues = await enrichAllGalleryDetails(baseVenues);
  const venues = dedupeVenues(detailedVenues);
  writeJson(OUTPUT_FILE, venues);

  if (fs.existsSync(path.dirname(ANDROID_OUTPUT_FILE))) {
    writeJson(ANDROID_OUTPUT_FILE, venues);
  }

  console.log(`[sanat-galeriler] Kayit sayisi: ${venues.length}`);
  console.log(`[sanat-galeriler] Yazildi: ${OUTPUT_FILE}`);
  if (fs.existsSync(path.dirname(ANDROID_OUTPUT_FILE))) {
    console.log(`[sanat-galeriler] Yazildi: ${ANDROID_OUTPUT_FILE}`);
  }
}

main().catch((error) => {
  console.error("[sanat-galeriler] Hata:", error?.message || error);
  process.exitCode = 1;
});
