#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WEB_DATA_FILE = path.join(ROOT, "data", "kultur-muzeler.json");
const ANDROID_DATA_FILE = path.join(ROOT, "android_app", "assets", "web", "data", "kultur-muzeler.json");
const DISTRICTS_FILE = path.join(ROOT, "data", "districts.json");

const WIKIPEDIA_API = "https://tr.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const NOMINATIM_REVERSE_API = "https://nominatim.openstreetmap.org/reverse";

const WIKIPEDIA_BATCH_SIZE = 20;
const WIKIDATA_BATCH_SIZE = 40;
const REQUEST_DELAY_MS = 80;
const NOMINATIM_DELAY_MS = 1100;
const MAX_WIKIDATA_DEPTH = 6;
const RETRY_COUNT = 3;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function wikiTitleFromUrl(url) {
  const value = normalizeText(url);
  if (!value.includes("tr.wikipedia.org/wiki/")) {
    return "";
  }

  try {
    const parsed = new URL(value);
    const prefix = "/wiki/";
    if (!parsed.pathname.startsWith(prefix)) {
      return "";
    }
    const title = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return normalizeText(title.replace(/_/g, " "));
  } catch {
    return "";
  }
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out;
}

function uniqueNonEmpty(values) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

async function fetchJsonWithRetry(url, options, label) {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`${label} HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_COUNT) {
        await sleep(300 * attempt);
      }
    }
  }
  throw lastError;
}

async function fetchWikipediaDetailsBatch(titles) {
  if (!titles.length) {
    return new Map();
  }

  const url = new URL(WIKIPEDIA_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts|revisions|pageprops");
  url.searchParams.set("ppprop", "wikibase_item");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("rvprop", "content");
  url.searchParams.set("rvslots", "main");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("titles", titles.join("|"));

  const json = await fetchJsonWithRetry(url, {
    headers: {
      "user-agent": "aramabul-district-enricher/1.1 (contact: info@aramabul.com)",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
  }, "Wikipedia API");

  const pages = Array.isArray(json?.query?.pages) ? json.query.pages : [];
  const redirects = Array.isArray(json?.query?.redirects) ? json.query.redirects : [];

  const map = new Map();

  pages.forEach((page) => {
    const title = normalizeText(page?.title);
    if (!title || page?.missing) {
      return;
    }

    const revisions = Array.isArray(page?.revisions) ? page.revisions : [];
    const firstRevision = revisions[0] || {};
    const slots = firstRevision?.slots || {};
    const wikitext = normalizeText(slots?.main?.content || "");

    map.set(normalizeForKey(title), {
      title,
      extract: normalizeText(page?.extract || ""),
      wikitext,
      qid: normalizeText(page?.pageprops?.wikibase_item || ""),
    });
  });

  redirects.forEach((entry) => {
    const from = normalizeText(entry?.from);
    const to = normalizeText(entry?.to);
    const toKey = normalizeForKey(to);
    const fromKey = normalizeForKey(from);
    if (fromKey && map.has(toKey) && !map.has(fromKey)) {
      map.set(fromKey, map.get(toKey));
    }
  });

  return map;
}

async function loadWikipediaDetails(titles) {
  const allMap = new Map();
  const groups = chunk(titles, WIKIPEDIA_BATCH_SIZE);

  for (let i = 0; i < groups.length; i += 1) {
    const batch = groups[i];
    const map = await fetchWikipediaDetailsBatch(batch);
    map.forEach((value, key) => allMap.set(key, value));
    if (i < groups.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return allMap;
}

async function fetchWikidataEntitiesBatch(ids) {
  if (!ids.length) {
    return new Map();
  }

  const url = new URL(WIKIDATA_API);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("languages", "tr|en");
  url.searchParams.set("props", "labels|claims");

  const json = await fetchJsonWithRetry(url, {
    headers: {
      "user-agent": "aramabul-district-enricher/1.1 (contact: info@aramabul.com)",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
  }, "Wikidata API");

  const entities = json?.entities && typeof json.entities === "object" ? json.entities : {};
  const map = new Map();
  Object.entries(entities).forEach(([id, entity]) => {
    if (id && entity && !entity.missing) {
      map.set(id, entity);
    }
  });
  return map;
}

function extractEntityIdsFromClaims(entity, propertyIds) {
  const claims = entity?.claims && typeof entity.claims === "object" ? entity.claims : {};
  const ids = [];

  propertyIds.forEach((propertyId) => {
    const rows = Array.isArray(claims[propertyId]) ? claims[propertyId] : [];
    rows.forEach((claim) => {
      const mainsnak = claim?.mainsnak || {};
      if (mainsnak?.snaktype !== "value") {
        return;
      }
      const datavalue = mainsnak?.datavalue || {};
      const value = datavalue?.value || {};
      const id = normalizeText(value?.id || "");
      if (/^Q\d+$/i.test(id)) {
        ids.push(id.toUpperCase());
      }
    });
  });

  return uniqueNonEmpty(ids);
}

function extractCoordinatesFromEntity(entity) {
  const claims = entity?.claims && typeof entity.claims === "object" ? entity.claims : {};
  const rows = Array.isArray(claims.P625) ? claims.P625 : [];
  for (const claim of rows) {
    const mainsnak = claim?.mainsnak || {};
    if (mainsnak?.snaktype !== "value") {
      continue;
    }
    const datavalue = mainsnak?.datavalue || {};
    const value = datavalue?.value || {};
    const latitude = Number(value?.latitude);
    const longitude = Number(value?.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }
  return null;
}

async function loadWikidataEntitiesWithParents(seedIds) {
  const entityMap = new Map();
  let frontier = uniqueNonEmpty(seedIds)
    .map((value) => value.toUpperCase())
    .filter((value) => /^Q\d+$/i.test(value));

  let depth = 0;
  while (frontier.length > 0 && depth < MAX_WIKIDATA_DEPTH) {
    const toFetch = frontier.filter((id) => !entityMap.has(id));
    if (!toFetch.length) {
      break;
    }

    const groups = chunk(toFetch, WIKIDATA_BATCH_SIZE);
    for (let i = 0; i < groups.length; i += 1) {
      const map = await fetchWikidataEntitiesBatch(groups[i]);
      map.forEach((entity, id) => entityMap.set(id, entity));
      if (i < groups.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    const next = [];
    toFetch.forEach((id) => {
      const entity = entityMap.get(id);
      if (!entity) {
        return;
      }
      const parents = extractEntityIdsFromClaims(entity, ["P131", "P276"]);
      parents.forEach((parentId) => {
        if (!entityMap.has(parentId)) {
          next.push(parentId);
        }
      });
    });

    frontier = uniqueNonEmpty(next);
    depth += 1;
  }

  return entityMap;
}

function getEntityLabels(entity) {
  const labels = entity?.labels && typeof entity.labels === "object" ? entity.labels : {};
  const result = [];
  if (labels.tr?.value) {
    result.push(labels.tr.value);
  }
  if (labels.en?.value) {
    result.push(labels.en.value);
  }
  return uniqueNonEmpty(result);
}

function buildCityDistrictMatcher(city, districtMap) {
  const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
  const ordered = uniqueNonEmpty(districts).sort((left, right) => right.length - left.length);

  return ordered
    .map((district) => {
      const token = normalizeForKey(district);
      if (!token || token.length < 2) {
        return null;
      }
      return {
        district,
        pattern: new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}(?=$|[^a-z0-9]|'[a-z]+)`, "i"),
      };
    })
    .filter(Boolean);
}

function matchDistrictFromText(city, text, districtMap, cityMatcherCache) {
  const haystack = normalizeForKey(text);
  if (!haystack) {
    return "Merkez";
  }

  if (!cityMatcherCache.has(city)) {
    cityMatcherCache.set(city, buildCityDistrictMatcher(city, districtMap));
  }

  const matchers = cityMatcherCache.get(city) || [];
  for (const row of matchers) {
    if (row.pattern.test(haystack)) {
      return row.district;
    }
  }
  return "Merkez";
}

function inferDistrictFromPageData(city, museumName, wikiTitle, details, districtMap, cityMatcherCache) {
  const haystack = `${museumName} ${wikiTitle} ${details?.extract || ""} ${details?.wikitext || ""}`;
  return matchDistrictFromText(city, haystack, districtMap, cityMatcherCache);
}

function inferDistrictFromWikidataChain(city, rootQid, entityMap, districtMap, cityMatcherCache) {
  if (!rootQid || !entityMap.has(rootQid)) {
    return "Merkez";
  }

  const queue = [{ id: rootQid, depth: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.id) || current.depth > MAX_WIKIDATA_DEPTH) {
      continue;
    }

    visited.add(current.id);
    const entity = entityMap.get(current.id);
    if (!entity) {
      continue;
    }

    const labels = getEntityLabels(entity);
    for (const label of labels) {
      const district = matchDistrictFromText(city, label, districtMap, cityMatcherCache);
      if (!isMerkez(district)) {
        return district;
      }
    }

    const parents = extractEntityIdsFromClaims(entity, ["P131", "P276"]);
    parents.forEach((id) => {
      if (!visited.has(id)) {
        queue.push({ id, depth: current.depth + 1 });
      }
    });
  }

  return "Merkez";
}

async function reverseGeocodeDistrict(city, coordinates, districtMap, cityMatcherCache) {
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
    headers: {
      "user-agent": "aramabul-district-enricher/1.1 (contact: info@aramabul.com)",
      referer: "https://aramabul.com",
    },
  }, "Nominatim reverse");

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

  return matchDistrictFromText(city, candidateText, districtMap, cityMatcherCache);
}

function applyDistrict(item, district, editorialSummary) {
  return {
    ...item,
    district,
    address: `${district}, ${item.city}, Türkiye`,
    editorialSummary,
  };
}

async function main() {
  if (!fs.existsSync(WEB_DATA_FILE) || !fs.existsSync(DISTRICTS_FILE)) {
    throw new Error("Gerekli veri dosyaları bulunamadı.");
  }

  const museums = readJson(WEB_DATA_FILE);
  const districtMap = readJson(DISTRICTS_FILE);
  const cityMatcherCache = new Map();

  const targetIndexes = museums
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isMerkez(item.district) && wikiTitleFromUrl(item.website));

  const uniqueTitles = uniqueNonEmpty(targetIndexes.map(({ item }) => wikiTitleFromUrl(item.website)));
  process.stdout.write(`[enrich-kultur-muzeler] hedef kayıt: ${targetIndexes.length}, eşsiz sayfa: ${uniqueTitles.length}\n`);

  const wikiDetailsMap = await loadWikipediaDetails(uniqueTitles);
  const qids = uniqueNonEmpty(
    uniqueTitles.map((title) => wikiDetailsMap.get(normalizeForKey(title))?.qid || "")
  ).filter((value) => /^Q\d+$/i.test(value));

  process.stdout.write(`[enrich-kultur-muzeler] wikidata kök öğe: ${qids.length}\n`);
  const wikidataEntityMap = await loadWikidataEntitiesWithParents(qids);
  process.stdout.write(`[enrich-kultur-muzeler] yüklenen wikidata öğe: ${wikidataEntityMap.size}\n`);

  const next = [...museums];
  const coordinateCandidates = [];

  let fromPageData = 0;
  let fromP131 = 0;

  targetIndexes.forEach(({ item, index }) => {
    const wikiTitle = wikiTitleFromUrl(item.website);
    const details = wikiDetailsMap.get(normalizeForKey(wikiTitle)) || null;

    const pageDistrict = inferDistrictFromPageData(item.city, item.name, wikiTitle, details, districtMap, cityMatcherCache);
    if (!isMerkez(pageDistrict)) {
      fromPageData += 1;
      next[index] = applyDistrict(
        item,
        pageDistrict,
        "Kaynak: Vikipedi müze sayfası metni ile ilçe eşleştirmesi yapıldı."
      );
      return;
    }

    const qid = normalizeText(details?.qid || "").toUpperCase();
    if (!/^Q\d+$/i.test(qid)) {
      return;
    }

    const p131District = inferDistrictFromWikidataChain(item.city, qid, wikidataEntityMap, districtMap, cityMatcherCache);
    if (!isMerkez(p131District)) {
      fromP131 += 1;
      next[index] = applyDistrict(
        item,
        p131District,
        "Kaynak: Wikidata idari birim zinciri (P131/P276) ile ilçe eşleştirmesi yapıldı."
      );
      return;
    }

    const coords = extractCoordinatesFromEntity(wikidataEntityMap.get(qid));
    if (coords) {
      coordinateCandidates.push({ index, city: item.city, coords });
    }
  });

  process.stdout.write(`[enrich-kultur-muzeler] metin/P131 ile güncellenen: ${fromPageData + fromP131}\n`);
  process.stdout.write(`[enrich-kultur-muzeler] koordinat adayı: ${coordinateCandidates.length}\n`);

  const coordCache = new Map();
  let fromCoordinates = 0;

  for (let i = 0; i < coordinateCandidates.length; i += 1) {
    const candidate = coordinateCandidates[i];
    const cacheKey = `${candidate.coords.latitude.toFixed(6)},${candidate.coords.longitude.toFixed(6)}`;

    let district = coordCache.get(cacheKey);
    if (!district) {
      try {
        district = await reverseGeocodeDistrict(candidate.city, candidate.coords, districtMap, cityMatcherCache);
      } catch {
        district = "Merkez";
      }
      coordCache.set(cacheKey, district);
      if (i < coordinateCandidates.length - 1) {
        await sleep(NOMINATIM_DELAY_MS);
      }
    }

    if (!isMerkez(district) && isMerkez(next[candidate.index].district)) {
      fromCoordinates += 1;
      next[candidate.index] = applyDistrict(
        next[candidate.index],
        district,
        "Kaynak: Wikidata koordinatı + ters geocode ile ilçe eşleştirmesi yapıldı."
      );
    }

    if ((i + 1) % 25 === 0 || i === coordinateCandidates.length - 1) {
      process.stdout.write(`[enrich-kultur-muzeler] koordinat ilerleme: ${i + 1}/${coordinateCandidates.length}\n`);
    }
  }

  writeJson(WEB_DATA_FILE, next);
  writeJson(ANDROID_DATA_FILE, next);

  const remainingMerkez = next.filter((item) => isMerkez(item.district)).length;
  const updatedTotal = fromPageData + fromP131 + fromCoordinates;

  process.stdout.write(`[enrich-kultur-muzeler] sayfa metni güncelleme: ${fromPageData}\n`);
  process.stdout.write(`[enrich-kultur-muzeler] P131/P276 güncelleme: ${fromP131}\n`);
  process.stdout.write(`[enrich-kultur-muzeler] koordinat güncelleme: ${fromCoordinates}\n`);
  process.stdout.write(`[enrich-kultur-muzeler] toplam güncelleme: ${updatedTotal}\n`);
  process.stdout.write(`[enrich-kultur-muzeler] merkez kalan: ${remainingMerkez}\n`);
}

main().catch((error) => {
  process.stderr.write(`[enrich-kultur-muzeler] hata: ${String(error.stack || error)}\n`);
  process.exit(1);
});
