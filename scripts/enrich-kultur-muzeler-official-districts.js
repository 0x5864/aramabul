#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WEB_DATA_FILE = path.join(ROOT, "data", "kultur-muzeler.json");
const ANDROID_DATA_FILE = path.join(ROOT, "android_app", "assets", "web", "data", "kultur-muzeler.json");
const DISTRICTS_FILE = path.join(ROOT, "data", "districts.json");

const DOSIM_LIST_URL = "https://dosim.ktb.gov.tr/TR-218067/muzeler-ve-orenyerleri.html";
const DOSIM_BASE = "https://dosim.ktb.gov.tr";
const MUZE_BASE = "https://muze.gov.tr";
const MUZE_SITEMAP_URL = "https://muze.gov.tr/sitemap.xml";
const NOMINATIM_REVERSE_API = "https://nominatim.openstreetmap.org/reverse";

const REQUEST_DELAY_MS = 130;
const NOMINATIM_DELAY_MS = 1100;
const RETRY_COUNT = 3;
const MAX_EXTERNAL_PAGES_PER_CITY = 8;
const MAX_EXTERNAL_DEPTH = 2;
const SITEMAP_ONLY = process.argv.includes("--sitemap-only");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isNaN(parsed) ? "" : String.fromCharCode(parsed);
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isNaN(parsed) ? "" : String.fromCharCode(parsed);
    })
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return normalizeText(decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " ")));
}

function normalizeForKey(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function isMerkez(value) {
  return normalizeText(value).toLocaleLowerCase("tr") === "merkez";
}

async function fetchTextWithRetry(url, headers = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "aramabul-kultur-official-enricher/1.0 (contact: info@aramabul.com)",
          "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
          ...headers,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_COUNT) {
        await sleep(250 * attempt);
      }
    }
  }
  throw lastError || new Error("fetchTextWithRetry bilinmeyen hata");
}

async function fetchJsonWithRetry(url, headers = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "aramabul-kultur-official-enricher/1.0 (contact: info@aramabul.com)",
          "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
          ...headers,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_COUNT) {
        await sleep(250 * attempt);
      }
    }
  }
  throw lastError || new Error("fetchJsonWithRetry bilinmeyen hata");
}

function extractDosimCityUrls(html) {
  const urls = new Set();
  const regex = /href="(\/TR-\d+\/[a-z0-9-]+\.html)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = normalizeText(match[1]);
    if (href) {
      urls.add(`${DOSIM_BASE}${href}`);
    }
  }
  return [...urls];
}

function resolveUrl(baseUrl, href) {
  const raw = normalizeText(decodeHtmlEntities(href));
  if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return "";
  }

  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return "";
  }
}

function isOfficialKtbHtmlPageUrl(url) {
  try {
    const parsed = new URL(url);
    const host = normalizeText(parsed.hostname).toLocaleLowerCase("tr");
    if (!(host === "ktb.gov.tr" || host.endsWith(".ktb.gov.tr"))) {
      return false;
    }
    const pathname = normalizeText(parsed.pathname).toLocaleLowerCase("tr");
    if (!/\/tr-\d+\//i.test(pathname)) {
      return false;
    }
    return pathname.endsWith(".html") || pathname.endsWith(".htm");
  } catch {
    return false;
  }
}

function extractOfficialKtbPageLinks(html, baseUrl) {
  const links = new Set();
  const regex = /<a[^>]+href="([^"]+)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const absolute = resolveUrl(baseUrl, match[1]);
    if (absolute && isOfficialKtbHtmlPageUrl(absolute)) {
      links.add(absolute);
    }
  }
  return [...links];
}

function extractCityNameFromDosimPage(html) {
  const titleMatch = html.match(/<h3[^>]*class="[^"]*font-weight-bold[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
  if (!titleMatch) {
    return "";
  }
  return stripTags(titleMatch[1]);
}

function normalizeMuzeDetailUrl(rawUrl) {
  const value = normalizeText(decodeHtmlEntities(rawUrl));
  if (!value) {
    return "";
  }

  let resolved = value;
  if (value.startsWith("/")) {
    resolved = `${MUZE_BASE}${value}`;
  } else if (value.startsWith("?")) {
    resolved = `${MUZE_BASE}/muze-detay${value}`;
  }

  try {
    const parsed = new URL(resolved);
    const sectionId = normalizeText(parsed.searchParams.get("SectionId") || parsed.searchParams.get("sectionId"));
    const distId = normalizeText(parsed.searchParams.get("DistId") || parsed.searchParams.get("distId"));
    if (!sectionId || !distId) {
      return "";
    }
    return `${MUZE_BASE}/muze-detay?SectionId=${encodeURIComponent(sectionId)}&DistId=${encodeURIComponent(distId)}`;
  } catch {
    return "";
  }
}

function extractMuzeLinksFromDosimCityPage(html, cityName) {
  const items = [];
  const regex = /<a[^>]+href="([^"]*muze-detay[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const detailUrl = normalizeMuzeDetailUrl(match[1]);
    const name = stripTags(match[2]);
    if (!detailUrl || !name) {
      continue;
    }
    items.push({
      city: cityName,
      name,
      detailUrl,
    });
  }
  return items;
}

function extractInlineVenueAddressRows(html, cityName) {
  const rows = [];
  const addressRegex = /<strong[^>]*>[^<]*Adres[^<]*<\/strong>\s*(?:<span[^>]*>)?\s*([^<]{3,240})/gi;
  let match;

  while ((match = addressRegex.exec(html)) !== null) {
    const address = normalizeText(decodeHtmlEntities(match[1]).replace(/&nbsp;/gi, " "));
    if (!address) {
      continue;
    }

    const lookbackStart = Math.max(0, match.index - 3000);
    const priorChunk = html.slice(lookbackStart, match.index);
    const nameCandidates = [...priorChunk.matchAll(/<strong[^>]*>\s*([^<]{2,160})\s*<\/strong>/gi)]
      .map((row) => normalizeText(decodeHtmlEntities(row[1]).replace(/&nbsp;/gi, " ")))
      .filter(Boolean);

    let name = "";
    for (let i = nameCandidates.length - 1; i >= 0; i -= 1) {
      const candidate = nameCandidates[i];
      const key = normalizeForKey(candidate);
      if (
        !key
        || key.includes("adres")
        || key.includes("muzekart")
        || key.includes("muze kart")
        || key.includes("mudurlugu")
        || key.includes("aciklama")
        || key.includes("iletisim")
        || key.includes("tel")
        || key.includes("telefon")
      ) {
        continue;
      }
      name = candidate;
      break;
    }

    if (!name || name.length < 3) {
      continue;
    }

    rows.push({
      city: cityName,
      name,
      address,
    });
  }

  return rows;
}

function extractAddressFromMuzeDetail(html) {
  const match = html.match(/<strong>\s*Adres:\s*<\/strong>\s*([\s\S]*?)<br>/i);
  if (!match) {
    return "";
  }
  return stripTags(match[1]);
}

function extractDetailTitleFromMuzeDetail(html) {
  const match = html.match(/<span[^>]*class="[^"]*h1-responsive[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  if (!match) {
    return "";
  }
  return stripTags(match[1]);
}

function extractCoordinatesFromMuzeDetail(html) {
  const mapMatch = html.match(/maps\.google\.com\/maps\?[^"]*q=([\-0-9.]+),([\-0-9.]+)/i);
  if (!mapMatch) {
    return null;
  }

  const latitude = Number(mapMatch[1]);
  const longitude = Number(mapMatch[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function buildCityDistrictMatchers(districtMap) {
  const cache = new Map();
  Object.entries(districtMap).forEach(([city, districts]) => {
    const normalizedCity = normalizeText(city);
    const list = Array.isArray(districts)
      ? [...new Set(districts.map((value) => normalizeText(value)).filter(Boolean))]
      : [];
    const sorted = list.sort((left, right) => right.length - left.length);
    cache.set(normalizedCity, sorted.map((district) => {
      const token = normalizeForKey(district);
      return token.length >= 2 ? { district, token } : null;
    }).filter(Boolean));
  });
  return cache;
}

function inferDistrictFromAddress(city, address, cityMatcherCache) {
  const matchers = cityMatcherCache.get(normalizeText(city)) || [];
  if (!matchers.length) {
    return "Merkez";
  }

  const haystack = normalizeForKey(address);
  if (!haystack) {
    return "Merkez";
  }

  for (const row of matchers) {
    const pattern = new RegExp(`(^|[^a-z0-9])${row.token}(?=$|[^a-z0-9])`, "i");
    if (pattern.test(haystack)) {
      return row.district;
    }
  }

  return "Merkez";
}

function buildCityNameMatchers(districtMap) {
  return Object.keys(districtMap)
    .map((city) => normalizeText(city))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map((city) => ({ city, token: normalizeForKey(city) }))
    .filter((row) => row.token.length >= 2);
}

function inferCityFromAddress(address, cityNameMatchers) {
  const haystack = normalizeForKey(address);
  if (!haystack) {
    return "";
  }

  for (const row of cityNameMatchers) {
    const pattern = new RegExp(`(^|[^a-z0-9])${row.token}(?=$|[^a-z0-9])`, "i");
    if (pattern.test(haystack)) {
      return row.city;
    }
  }

  return "";
}

async function inferDistrictFromCoordinates(city, coordinates, cityMatcherCache) {
  if (!coordinates) {
    return "Merkez";
  }

  const url = new URL(NOMINATIM_REVERSE_API);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(coordinates.latitude));
  url.searchParams.set("lon", String(coordinates.longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "tr");

  const json = await fetchJsonWithRetry(url, {
    referer: "https://aramabul.com",
  });

  const address = json?.address && typeof json.address === "object" ? json.address : {};
  const candidateText = [
    json?.display_name,
    address.city_district,
    address.town,
    address.municipality,
    address.county,
    address.suburb,
    address.village,
    address.neighbourhood,
    address.state_district,
  ].map((value) => normalizeText(value)).filter(Boolean).join(" ");

  return inferDistrictFromAddress(city, candidateText, cityMatcherCache);
}

function normalizeMuseumNameForMatch(name) {
  const tokenMap = {
    museum: "muze",
    museums: "muze",
    turkish: "turk",
    islamic: "islam",
    islam: "islam",
    arts: "eser",
    art: "sanat",
    archaeological: "arkeoloji",
    archeological: "arkeoloji",
    history: "tarih",
    science: "bilim",
    technology: "teknoloji",
    mosaic: "mozaik",
    mosaics: "mozaik",
    tower: "kule",
    fortress: "hisar",
    castle: "kale",
    underground: "yeralti",
    city: "sehir",
    valley: "vadi",
  };

  const normalized = normalizeForKey(name)
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((token) => tokenMap[token] || token)
    .join(" ")
    .replace(/\b(muzesi|muze|orenyeri|oren|yeri|site|ve|the|of|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(name) {
  const normalized = normalizeMuseumNameForMatch(name);
  if (!normalized) {
    return new Set();
  }
  return new Set(normalized.split(" ").filter((token) => token.length >= 3));
}

function similarityScore(leftName, rightName) {
  const left = normalizeMuseumNameForMatch(leftName);
  const right = normalizeMuseumNameForMatch(rightName);
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  if (left.length >= 6 && right.includes(left)) {
    return 0.95;
  }
  if (right.length >= 6 && left.includes(right)) {
    return 0.95;
  }

  const leftSet = tokenSet(left);
  const rightSet = tokenSet(right);
  if (!leftSet.size || !rightSet.size) {
    return 0;
  }

  let intersection = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  });

  if (!intersection) {
    return 0;
  }

  return (2 * intersection) / (leftSet.size + rightSet.size);
}

function dedupeOfficialRecords(records) {
  const map = new Map();
  records.forEach((row) => {
    const key = [
      normalizeForKey(row.city),
      normalizeForKey(row.name),
      normalizeForKey(row.detailUrl),
    ].join("|");
    if (!map.has(key)) {
      map.set(key, row);
    }
  });
  return [...map.values()];
}

async function collectOfficialMuseumRecords(districtMap, targetCitySet) {
  const listHtml = await fetchTextWithRetry(DOSIM_LIST_URL);
  const cityUrls = extractDosimCityUrls(listHtml);

  const cityLinkRows = [];
  const inlineRows = [];
  for (let i = 0; i < cityUrls.length; i += 1) {
    const cityUrl = cityUrls[i];
    let html = "";
    try {
      html = await fetchTextWithRetry(cityUrl);
    } catch {
      if (i < cityUrls.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
      continue;
    }

    const cityName = extractCityNameFromDosimPage(html);
    if (!cityName || !districtMap[cityName] || (targetCitySet && !targetCitySet.has(cityName))) {
      if (i < cityUrls.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
      continue;
    }

    const rows = extractMuzeLinksFromDosimCityPage(html, cityName);
    cityLinkRows.push(...rows);
    inlineRows.push(...extractInlineVenueAddressRows(html, cityName));

    const queue = extractOfficialKtbPageLinks(html, cityUrl).map((url) => ({ url, depth: 1 }));
    const visited = new Set([cityUrl]);
    let fetchedCount = 0;

    while (queue.length > 0 && fetchedCount < MAX_EXTERNAL_PAGES_PER_CITY) {
      const current = queue.shift();
      if (!current || !current.url || visited.has(current.url)) {
        continue;
      }
      visited.add(current.url);

      let externalHtml = "";
      try {
        externalHtml = await fetchTextWithRetry(current.url);
      } catch {
        if (queue.length > 0 || i < cityUrls.length - 1) {
          await sleep(REQUEST_DELAY_MS);
        }
        continue;
      }

      fetchedCount += 1;
      cityLinkRows.push(...extractMuzeLinksFromDosimCityPage(externalHtml, cityName));
      inlineRows.push(...extractInlineVenueAddressRows(externalHtml, cityName));

      if (current.depth < MAX_EXTERNAL_DEPTH) {
        const children = extractOfficialKtbPageLinks(externalHtml, current.url);
        children.forEach((childUrl) => {
          if (!visited.has(childUrl)) {
            queue.push({ url: childUrl, depth: current.depth + 1 });
          }
        });
      }

      if (queue.length > 0 || i < cityUrls.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    if (i < cityUrls.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const byDetailUrl = new Map();
  cityLinkRows.forEach((row) => {
    if (!byDetailUrl.has(row.detailUrl)) {
      byDetailUrl.set(row.detailUrl, {
        detailUrl: row.detailUrl,
        city: row.city,
        names: new Set([row.name]),
      });
    } else {
      const existing = byDetailUrl.get(row.detailUrl);
      existing.names.add(row.name);
      if (!existing.city && row.city) {
        existing.city = row.city;
      }
    }
  });

  const cityMatchers = buildCityDistrictMatchers(districtMap);
  const officialRecords = [];
  const detailRows = [...byDetailUrl.values()];
  const coordinateCache = new Map();

  inlineRows.forEach((row) => {
    const district = inferDistrictFromAddress(row.city, row.address, cityMatchers);
    if (!isMerkez(district)) {
      officialRecords.push({
        city: row.city,
        district,
        address: row.address,
        name: row.name,
        detailUrl: "",
      });
    }
  });

  for (let i = 0; i < detailRows.length; i += 1) {
    const row = detailRows[i];
    let detailHtml = "";
    try {
      detailHtml = await fetchTextWithRetry(row.detailUrl);
    } catch {
      if (i < detailRows.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
      continue;
    }

    const detailTitle = extractDetailTitleFromMuzeDetail(detailHtml);
    if (detailTitle) {
      row.names.add(detailTitle);
    }

    const address = extractAddressFromMuzeDetail(detailHtml);
    const coordinates = extractCoordinatesFromMuzeDetail(detailHtml);
    let district = inferDistrictFromAddress(row.city, address, cityMatchers);

    if (isMerkez(district) && coordinates) {
      const cacheKey = `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`;
      if (coordinateCache.has(cacheKey)) {
        district = coordinateCache.get(cacheKey);
      } else {
        try {
          district = await inferDistrictFromCoordinates(row.city, coordinates, cityMatchers);
        } catch {
          district = "Merkez";
        }
        coordinateCache.set(cacheKey, district);
        if (i < detailRows.length - 1) {
          await sleep(NOMINATIM_DELAY_MS);
        }
      }
    }

    if (!isMerkez(district)) {
      row.names.forEach((name) => {
        officialRecords.push({
          city: row.city,
          district,
          address,
          name,
          detailUrl: row.detailUrl,
        });
      });
    }

    if (i < detailRows.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const cityNameMatchers = buildCityNameMatchers(districtMap);
  const sitemapRecords = await collectMuzeSitemapRecords(cityMatchers, cityNameMatchers);
  officialRecords.push(...sitemapRecords);

  return dedupeOfficialRecords(officialRecords);
}

async function collectMuzeSitemapRecords(cityMatchers, cityNameMatchers) {
  let sitemapXml = "";
  try {
    sitemapXml = await fetchTextWithRetry(MUZE_SITEMAP_URL);
  } catch {
    return [];
  }

  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]*muze-detay[^<]*)<\/loc>/gi)]
    .map((row) => normalizeText(decodeHtmlEntities(row[1]).replace(/&amp;/g, "&")))
    .filter(Boolean);

  const detailUrlMap = new Map();
  sitemapUrls.forEach((url) => {
    try {
      const parsed = new URL(url);
      const sectionId = normalizeText(parsed.searchParams.get("SectionId") || parsed.searchParams.get("sectionId"));
      const distId = normalizeText(parsed.searchParams.get("DistId") || parsed.searchParams.get("distId"));
      if (!sectionId || !distId) {
        return;
      }
      const key = `${sectionId}|${distId}`.toUpperCase();
      detailUrlMap.set(key, `${MUZE_BASE}/muze-detay?SectionId=${encodeURIComponent(sectionId)}&DistId=${encodeURIComponent(distId)}`);
    } catch {
      // noop
    }
  });

  const detailUrls = [...detailUrlMap.values()];
  const records = [];
  const coordinateCache = new Map();

  for (let i = 0; i < detailUrls.length; i += 1) {
    const detailUrl = detailUrls[i];
    let detailHtml = "";
    try {
      detailHtml = await fetchTextWithRetry(detailUrl);
    } catch {
      if (i < detailUrls.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
      continue;
    }

    const name = extractDetailTitleFromMuzeDetail(detailHtml);
    const address = extractAddressFromMuzeDetail(detailHtml);
    const coordinates = extractCoordinatesFromMuzeDetail(detailHtml);

    const city = inferCityFromAddress(address, cityNameMatchers);
    if (!city) {
      if (i < detailUrls.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
      continue;
    }

    let district = inferDistrictFromAddress(city, address, cityMatchers);
    if (isMerkez(district) && coordinates) {
      const cacheKey = `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`;
      if (coordinateCache.has(cacheKey)) {
        district = coordinateCache.get(cacheKey);
      } else {
        try {
          district = await inferDistrictFromCoordinates(city, coordinates, cityMatchers);
        } catch {
          district = "Merkez";
        }
        coordinateCache.set(cacheKey, district);
      }
    }

    if (!isMerkez(district)) {
      records.push({
        city,
        district,
        address,
        name,
        detailUrl,
      });
    }

    if (i < detailUrls.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }

    if ((i + 1) % 15 === 0 || i === detailUrls.length - 1) {
      process.stdout.write(`[official-kultur-muzeler] sitemap ilerleme: ${i + 1}/${detailUrls.length}\n`);
    }
  }

  return records;
}

function buildOfficialByCity(records) {
  const map = new Map();
  records.forEach((row) => {
    const city = normalizeText(row.city);
    if (!map.has(city)) {
      map.set(city, []);
    }
    map.get(city).push(row);
  });
  return map;
}

function findBestOfficialMatch(museumRow, officialRows) {
  let best = null;
  let bestScore = 0;

  for (const official of officialRows) {
    const score = similarityScore(museumRow.name, official.name);
    if (score > bestScore) {
      bestScore = score;
      best = official;
    }
  }

  if (!best || bestScore < 0.72) {
    return null;
  }

  return { row: best, score: bestScore };
}

function mainSummary(museums) {
  const nonMerkez = museums.filter((item) => !isMerkez(item.district)).length;
  return {
    total: museums.length,
    nonMerkez,
    merkez: museums.length - nonMerkez,
  };
}

function buildTargetCitySet(museums) {
  const merkezByCity = new Map();
  museums.forEach((row) => {
    if (isMerkez(row.district)) {
      const city = normalizeText(row.city);
      merkezByCity.set(city, (merkezByCity.get(city) || 0) + 1);
    }
  });

  const entries = [...merkezByCity.entries()]
    .filter(([, count]) => count >= 5)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 28);

  return new Set(entries.map(([city]) => city));
}

async function main() {
  if (!fs.existsSync(WEB_DATA_FILE) || !fs.existsSync(DISTRICTS_FILE)) {
    throw new Error("Gerekli veri dosyaları bulunamadı.");
  }

  const museums = readJson(WEB_DATA_FILE);
  const districtMap = readJson(DISTRICTS_FILE);
  const before = mainSummary(museums);
  const targetCitySet = buildTargetCitySet(museums);
  const cityMatchers = buildCityDistrictMatchers(districtMap);
  const cityNameMatchers = buildCityNameMatchers(districtMap);
  const officialRecords = SITEMAP_ONLY
    ? dedupeOfficialRecords(await collectMuzeSitemapRecords(cityMatchers, cityNameMatchers))
    : await collectOfficialMuseumRecords(districtMap, targetCitySet);
  const officialByCity = buildOfficialByCity(officialRecords);

  let updated = 0;
  let matched = 0;

  const next = museums.map((item) => {
    if (!isMerkez(item.district)) {
      return item;
    }

    const city = normalizeText(item.city);
    const candidates = officialByCity.get(city) || [];
    if (!candidates.length) {
      return item;
    }

    const best = findBestOfficialMatch(item, candidates);
    if (!best || !best.row || isMerkez(best.row.district)) {
      return item;
    }

    matched += 1;
    updated += 1;
    return {
      ...item,
      district: best.row.district,
      address: normalizeText(best.row.address) || `${best.row.district}, ${city}, Türkiye`,
      editorialSummary: "Kaynak: KTB DOSİM/muze.gov.tr resmi müze adres kaydı ile ilçe eşleştirmesi yapıldı.",
      mapsUrl: item.mapsUrl || `${MUZE_BASE}/muze-detay`,
    };
  });

  writeJson(WEB_DATA_FILE, next);
  writeJson(ANDROID_DATA_FILE, next);

  const after = mainSummary(next);

  process.stdout.write(`[official-kultur-muzeler] dosim il sayfasi: ${DOSIM_LIST_URL}\n`);
  process.stdout.write(`[official-kultur-muzeler] mod: ${SITEMAP_ONLY ? "sitemap-only" : "full"}\n`);
  process.stdout.write(`[official-kultur-muzeler] hedef il sayisi: ${targetCitySet.size}\n`);
  process.stdout.write(`[official-kultur-muzeler] resmi aday kayit: ${officialRecords.length}\n`);
  process.stdout.write(`[official-kultur-muzeler] eslesen: ${matched}\n`);
  process.stdout.write(`[official-kultur-muzeler] guncellenen: ${updated}\n`);
  process.stdout.write(`[official-kultur-muzeler] once merkez: ${before.merkez}, sonra merkez: ${after.merkez}\n`);
}

main().catch((error) => {
  process.stderr.write(`[official-kultur-muzeler] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
