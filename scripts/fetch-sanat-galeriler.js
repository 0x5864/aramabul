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

function readAttr(html, attrName) {
  const match = html.match(new RegExp(`${attrName}="([^"]+)"`, "i"));
  return match ? cleanText(match[1]) : "";
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
  const venues = await fetchAllGalleryCards();
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
