#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const ANDROID_DATA_DIR = path.join(ROOT, "android_app", "assets", "web", "data");

const DISTRICTS_PATH = path.join(DATA_DIR, "districts.json");
const OUTPUT_PATH = path.join(DATA_DIR, "keyif-kafe-bos.json");
const ANDROID_OUTPUT_PATH = path.join(ANDROID_DATA_DIR, "keyif-kafe-bos.json");
const BACKUP_PATH = path.join(DATA_DIR, "keyif-kafe-bos.backup.json");

const SOURCE_URL = String(
  process.env.SOURCE_URL
    || "https://yandex.com.tr/maps/11508/istanbul/search/istanbul%20cafeleri/?from=api-maps&ll=28.995928%2C41.029231&origin=jsapi_2_1_79&sll=29.076216%2C41.044426&sspn=0.464463%2C0.233564&utm_source=jsapi&z=13.47",
).trim();

const CITY = "Istanbul";
const CITY_TR = "İstanbul";

const REQ_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
};

const TR_REPLACE_MAP = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function readJson(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (char) => TR_REPLACE_MAP[char] || char);
}

function normalizeKeyPart(value) {
  return normalizeForCompare(value).replace(/[^a-z0-9]/g, "");
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    });
}

function parseStateFromHtml(html) {
  const match = String(html || "").match(/<script type="application\/json" class="state-view">([\s\S]*?)<\/script>/i);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (_error) {
    return null;
  }
}

function extractResultItems(state) {
  const results = state && state.stack && state.stack[0] && state.stack[0].results;
  if (!results || typeof results !== "object") {
    return { items: [], totalResultCount: 0, pageCount: 0, resultsCount: 0 };
  }

  return {
    items: Array.isArray(results.items) ? results.items : [],
    totalResultCount: Number(results.totalResultCount) || 0,
    pageCount: Number(results.pageCount) || 0,
    resultsCount: Number(results.resultsCount) || 0,
  };
}

function toCategoryMeta(item) {
  const categories = Array.isArray(item && item.categories) ? item.categories : [];
  return categories.map((category) => ({
    name: normalizeText(category && category.name),
    className: normalizeForCompare(category && category.class),
    seoname: normalizeForCompare(category && category.seoname),
  }));
}

function hasCafeCategory(categoryMeta) {
  return categoryMeta.some((category) => {
    const name = normalizeForCompare(category.name);
    return (
      category.className === "cafe"
      || category.className === "coffee_shop"
      || category.seoname.includes("cafe")
      || category.seoname.includes("coffee")
      || name.includes("kafe")
      || name.includes("cafe")
      || name.includes("kahve")
    );
  });
}

function parsePostalCode(address) {
  const match = normalizeText(address).match(/\b\d{5}\b/);
  return match ? match[0] : "";
}

function parseNeighborhood(address) {
  const source = normalizeText(address);
  if (!source) {
    return "";
  }
  const match = source.match(/([^,]{2,60}\b(?:Mah\.|Mahallesi))/i);
  return match ? normalizeText(match[1]) : "";
}

function buildYandexOrgUrl(item, lon, lat) {
  const id = normalizeText(item && item.id);
  const seoname = normalizeText(item && item.seoname);
  if (id && seoname) {
    return `https://yandex.com.tr/maps/org/${encodeURIComponent(seoname)}/${encodeURIComponent(id)}/`;
  }
  if (id) {
    return `https://yandex.com.tr/maps/?oid=${encodeURIComponent(id)}`;
  }
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return `https://yandex.com.tr/maps/?ll=${encodeURIComponent(`${lon},${lat}`)}&z=17`;
  }
  return "";
}

function detectDistrict(item, istanbulDistricts) {
  const area = normalizeText(item && item.compositeAddress && item.compositeAddress.area);
  if (area) {
    return area;
  }

  const address = normalizeForCompare(item && (item.fullAddress || item.address));
  if (address) {
    const matched = istanbulDistricts.find((district) => address.includes(normalizeForCompare(district)));
    if (matched) {
      return matched;
    }
  }

  return "Merkez";
}

function venueIdentityKey(venue) {
  const placeId = normalizeText(venue.placeId || venue.sourcePlaceId);
  if (placeId) {
    return `pid:${placeId}`;
  }
  return `sig:${normalizeKeyPart(venue.city)}:${normalizeKeyPart(venue.district)}:${normalizeKeyPart(venue.name)}:${normalizeKeyPart(venue.address)}`;
}

function mapItemToVenue(item, istanbulDistricts) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = normalizeText(decodeHtmlEntities(item.title));
  if (!name) {
    return null;
  }

  const categoryMeta = toCategoryMeta(item);
  if (!hasCafeCategory(categoryMeta)) {
    return null;
  }

  const coordinates = Array.isArray(item.coordinates) ? item.coordinates : [];
  const lon = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  const address = normalizeText(decodeHtmlEntities(item.fullAddress || item.address));
  const district = detectDistrict(item, istanbulDistricts);
  const sourcePlaceId = normalizeText(item.id || item.uri);
  const website = Array.isArray(item.urls) ? normalizeText(item.urls[0]) : "";
  const phone = Array.isArray(item.phones) ? normalizeText(item.phones[0] && item.phones[0].number) : "";

  return {
    city: CITY_TR,
    district,
    name,
    cuisine: "Kafe",
    address,
    phone,
    website,
    mapsUrl: buildYandexOrgUrl(item, lon, lat),
    placeId: sourcePlaceId,
    sourcePlaceId,
    source: "yandex_maps",
    postalCode: parsePostalCode(address),
    neighborhood: parseNeighborhood(address),
  };
}

function sortVenues(list) {
  return [...list].sort((left, right) => {
    const districtOrder = normalizeText(left.district).localeCompare(normalizeText(right.district), "tr");
    if (districtOrder !== 0) {
      return districtOrder;
    }
    return normalizeText(left.name).localeCompare(normalizeText(right.name), "tr");
  });
}

async function run() {
  const districtMap = readJson(DISTRICTS_PATH, {});
  const istanbulDistricts = Array.isArray(districtMap[CITY_TR]) ? districtMap[CITY_TR] : [];
  if (istanbulDistricts.length === 0) {
    console.error("Istanbul ilce listesi bulunamadi: data/districts.json");
    process.exitCode = 1;
    return;
  }

  const response = await fetch(SOURCE_URL, { headers: REQ_HEADERS });
  if (!response.ok) {
    throw new Error(`Yandex istek hatasi: HTTP ${response.status}`);
  }

  const html = await response.text();
  const state = parseStateFromHtml(html);
  if (!state) {
    throw new Error("Yandex state-view parse edilemedi.");
  }

  const { items, totalResultCount, pageCount, resultsCount } = extractResultItems(state);
  const venueMap = new Map();

  let cafeMatched = 0;
  items.forEach((item) => {
    const mapped = mapItemToVenue(item, istanbulDistricts);
    if (!mapped) {
      return;
    }
    cafeMatched += 1;
    venueMap.set(venueIdentityKey(mapped), mapped);
  });

  const finalList = sortVenues(venueMap.values());
  const previousData = readJson(OUTPUT_PATH, []);
  const previousList = Array.isArray(previousData) ? previousData : [];
  if (previousList.length > 0) {
    writeJson(BACKUP_PATH, previousList);
  }

  writeJson(OUTPUT_PATH, finalList);
  writeJson(ANDROID_OUTPUT_PATH, finalList);

  console.log(`Kaynak URL: ${SOURCE_URL}`);
  console.log(`Yandex sonuc toplam: ${totalResultCount}`);
  console.log(`Yandex pageCount: ${pageCount}`);
  console.log(`Yandex listelenen: ${resultsCount}`);
  console.log(`Islenen ham item: ${items.length}`);
  console.log(`Kafe kategorisi eslesen: ${cafeMatched}`);
  console.log(`Yazilan kayit (esiz): ${finalList.length}`);
  console.log(`Dosya: ${OUTPUT_PATH}`);
  console.log(`Dosya: ${ANDROID_OUTPUT_PATH}`);
}

run().catch((error) => {
  console.error(`fetch-keyif-kafe-yandex-istanbul hata: ${error.message}`);
  process.exitCode = 1;
});

