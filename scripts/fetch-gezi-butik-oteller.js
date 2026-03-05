#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "data", "gezi-butik-oteller.json");
const ANDROID_OUTPUT_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "gezi-butik-oteller.json",
);
const REPORT_FILE = path.join(ROOT, "data", "gezi-butik-oteller-cekim-raporu.json");

const BASE_URL = "https://www.neredekal.com/tema/butik-oteller/";
const MAX_PAGES = Number.parseInt(process.env.NEREDEKAL_MAX_PAGES || "200", 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.NEREDEKAL_DELAY_MS || "100", 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLocationTree(locationTree) {
  const parts = String(locationTree || "")
    .split(">")
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .filter((part) => !/^t[üu]rkiye$/i.test(part));

  const city = parts[0] || "";
  const district = parts[1] || "";
  const neighborhood = parts.slice(2).join(", ");

  return { city, district, neighborhood };
}

function buildAddress(city, district, neighborhood) {
  const chunks = [city, district, neighborhood].map((chunk) => normalizeText(chunk)).filter(Boolean);
  if (chunks.length === 0) {
    return "Türkiye";
  }
  if (chunks[chunks.length - 1] !== "Türkiye") {
    chunks.push("Türkiye");
  }
  return chunks.join(", ");
}

function buildListingUrl(slug) {
  const cleanSlug = String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!cleanSlug) {
    return "";
  }
  const suffix = cleanSlug.endsWith("-fiyatlari") ? cleanSlug : `${cleanSlug}-fiyatlari`;
  return `https://www.neredekal.com/${suffix}/`;
}

function extractPhotoUrl(item) {
  const image = Array.isArray(item?.images) ? item.images.find((entry) => entry?.image) : null;
  if (!image || !image.image) {
    return "";
  }
  return `https://cdn.neredekal.com/hotel/${image.image}/`;
}

function buildMapsUrl(item) {
  const lat = Number(item?.latitude);
  const lng = Number(item?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function parseNextData(html) {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nextDataMatch) {
    throw new Error("__NEXT_DATA__ bulunamadi");
  }
  return JSON.parse(nextDataMatch[1]);
}

function mapItemToVenue(item) {
  const { city, district, neighborhood } = parseLocationTree(item.locationTree);
  return {
    city,
    district,
    name: normalizeText(item.name),
    cuisine: "Butik Otel",
    address: buildAddress(city, district, neighborhood),
    neighborhood,
    postalCode: "",
    mapsUrl: buildMapsUrl(item),
    website: buildListingUrl(item.slug),
    phone: normalizeText(item.phoneNumber),
    photoUrl: extractPhotoUrl(item),
    editorialSummary: "Neredekal butik oteller tema listesinden eklendi.",
    sourcePlaceId: "",
    sourceId: item.objectId || "",
    sourceSlug: normalizeText(item.slug),
  };
}

function dedupeVenues(venues) {
  const unique = new Map();
  venues.forEach((venue) => {
    const key = `${venue.sourceId || ""}|${venue.sourceSlug || ""}|${venue.name}|${venue.city}|${venue.district}`;
    if (!unique.has(key)) {
      unique.set(key, venue);
    }
  });
  return Array.from(unique.values()).map((venue) => {
    const { sourceId, sourceSlug, ...publicVenue } = venue;
    return publicVenue;
  });
}

function sortVenues(venues) {
  return [...venues].sort((a, b) => {
    const cityCompare = a.city.localeCompare(b.city, "tr");
    if (cityCompare !== 0) return cityCompare;
    const districtCompare = a.district.localeCompare(b.district, "tr");
    if (districtCompare !== 0) return districtCompare;
    return a.name.localeCompare(b.name, "tr");
  });
}

async function fetchPage(page) {
  const url = page <= 1 ? BASE_URL : `${BASE_URL}?p=${page}`;
  const response = await fetch(url, {
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

  const html = await response.text();
  const nextData = parseNextData(html);
  const pageProps = nextData?.props?.pageProps || {};
  const facilityList = Array.isArray(pageProps.facilityList) ? pageProps.facilityList : [];
  const totalCount = Number(pageProps.totalCount) || 0;
  const maxPageLimit = Number(pageProps.maxPageLimit) || 0;
  return { totalCount, maxPageLimit, facilityList };
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function main() {
  const startedAt = new Date().toISOString();
  process.stdout.write(`[butik-oteller] basladi: ${startedAt}\n`);

  const firstPage = await fetchPage(1);
  const perPage = firstPage.facilityList.length || 25;
  const estimatedTotalPages = firstPage.totalCount > 0 ? Math.ceil(firstPage.totalCount / perPage) : 1;
  const platformPageLimit = firstPage.maxPageLimit > 0 ? firstPage.maxPageLimit : estimatedTotalPages;
  const plannedPages = Math.min(MAX_PAGES, Math.max(1, Math.min(estimatedTotalPages, platformPageLimit)));

  process.stdout.write(
    `[butik-oteller] toplam kayit: ${firstPage.totalCount}, sayfa basi: ${perPage}, planlanan sayfa: ${plannedPages}\n`,
  );

  const rawVenues = [];
  let fetchedPages = 0;
  let emptyPages = 0;
  let failedPages = 0;

  for (let page = 1; page <= plannedPages; page += 1) {
    try {
      const currentPage = page === 1 ? firstPage : await fetchPage(page);
      const currentItems = currentPage.facilityList.map(mapItemToVenue).filter((venue) => venue.name && venue.city);

      fetchedPages += 1;
      if (currentItems.length === 0) {
        emptyPages += 1;
      } else {
        emptyPages = 0;
      }

      rawVenues.push(...currentItems);
      process.stdout.write(
        `[butik-oteller] sayfa ${page}/${plannedPages}: ${currentItems.length} kayit (toplam ham ${rawVenues.length})\n`,
      );

      if (page >= plannedPages && currentItems.length === 0 && emptyPages >= 2) {
        process.stdout.write(`[butik-oteller] bos sayfa serisi goruldu, dongu sonlandirildi (sayfa ${page}).\n`);
        break;
      }

      if (page < plannedPages && REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    } catch (error) {
      failedPages += 1;
      process.stdout.write(`[butik-oteller] sayfa ${page} hatasi: ${String(error.message || error)}\n`);
      if (failedPages >= 3) {
        process.stdout.write("[butik-oteller] ard arda hatalar nedeniyle durduruldu.\n");
        break;
      }
    }
  }

  const dedupedVenues = dedupeVenues(rawVenues);
  const sortedVenues = sortVenues(dedupedVenues);

  ensureParentDir(OUTPUT_FILE);
  ensureParentDir(ANDROID_OUTPUT_FILE);
  ensureParentDir(REPORT_FILE);

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(sortedVenues, null, 2)}\n`, "utf8");
  fs.writeFileSync(ANDROID_OUTPUT_FILE, `${JSON.stringify(sortedVenues, null, 2)}\n`, "utf8");

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    requestedMaxPages: MAX_PAGES,
    plannedPages,
    fetchedPages,
    failedPages,
    rawCount: rawVenues.length,
    uniqueCount: sortedVenues.length,
    estimatedTotalPages,
    platformPageLimit,
    firstPageTotalCount: firstPage.totalCount,
    firstPageMaxPageLimit: firstPage.maxPageLimit,
    outputFiles: [OUTPUT_FILE, ANDROID_OUTPUT_FILE],
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  process.stdout.write(`[butik-oteller] tamamlandi. tekil kayit: ${sortedVenues.length}\n`);
  process.stdout.write(`[butik-oteller] cikti: ${OUTPUT_FILE}\n`);
  process.stdout.write(`[butik-oteller] android cikti: ${ANDROID_OUTPUT_FILE}\n`);
}

main().catch((error) => {
  process.stderr.write(`[butik-oteller] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
