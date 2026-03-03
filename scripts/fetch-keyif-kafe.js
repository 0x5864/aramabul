#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DISTRICTS_PATH = path.join(DATA_DIR, "districts.json");
const OUTPUT_PATH = path.join(DATA_DIR, "keyif-kafe.json");
const BACKUP_PATH = path.join(DATA_DIR, "keyif-kafe.backup.json");
const SOURCE_URL = "https://www.bulurum.com/search/Kafeler-ve-Kahve-D%C3%BCkkanlar%C4%B1/";

const argSet = new Set(process.argv.slice(2));
const DRY_RUN = argSet.has("--dry-run");
const REPLACE_MODE = !argSet.has("--merge");

const START_PAGE = Math.max(0, Number.parseInt(process.env.START_PAGE || "0", 10));
const MAX_PAGES = Math.max(0, Number.parseInt(process.env.MAX_PAGES || "0", 10));
const REQUEST_DELAY_MS = Math.max(0, Number.parseInt(process.env.REQUEST_DELAY_MS || "120", 10));
const RETRY_LIMIT = Math.max(1, Number.parseInt(process.env.RETRY_LIMIT || "4", 10));
const SAVE_EVERY = Math.max(0, Number.parseInt(process.env.SAVE_EVERY || "50", 10));
const CAPTCHA_RETRY_LIMIT = Math.max(0, Number.parseInt(process.env.CAPTCHA_RETRY_LIMIT || "3", 10));
const CAPTCHA_WAIT_MS = Math.max(1000, Number.parseInt(process.env.CAPTCHA_WAIT_MS || "12000", 10));

const turkishCharMap = {
  c: "c",
  g: "g",
  i: "i",
  o: "o",
  s: "s",
  u: "u",
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

const CITY_FILTERS = String(process.env.CITY_FILTER || "")
  .split(",")
  .map((item) => normalizeForCompare(item))
  .filter(Boolean);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function readJson(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function decodeHtml(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }

  const named = {
    amp: "&",
    quot: "\"",
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return text
    .replace(/&#x([0-9a-f]+);/giu, (_match, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#([0-9]+);/gu, (_match, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-z]+);/giu, (_match, name) => named[name.toLowerCase()] || _match);
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<br\s*\/?>/giu, " ").replace(/<[^>]+>/gu, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractPageTitle(html) {
  return stripTags((html.match(/<title>([\s\S]*?)<\/title>/iu) || [])[1]);
}

function normalizeForCompare(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replace(/[çğıiöşü]/g, (char) => turkishCharMap[char] || char)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return normalizeForCompare(value).replace(/[^a-z0-9]/g, "");
}

function toTitleCaseTr(value) {
  return String(value || "")
    .split(/([\s\-\/()&,."']+)/)
    .map((segment) => {
      if (!/[A-Za-zÇĞİIÖŞÜçğıöşü]/.test(segment)) {
        return segment;
      }

      const lower = segment.toLocaleLowerCase("tr");
      const firstLetterMatch = lower.match(/[a-zçğıöşü]/iu);
      if (!firstLetterMatch || typeof firstLetterMatch.index !== "number") {
        return lower;
      }

      const index = firstLetterMatch.index;
      const head = lower[index].toLocaleUpperCase("tr");
      return `${lower.slice(0, index)}${head}${lower.slice(index + 1)}`;
    })
    .join("")
    .trim();
}

function sanitizeName(value) {
  const cleaned = normalizeText(value).replace(/\s+/g, " ");
  if (!cleaned) {
    return "";
  }

  const lettersOnly = cleaned.replace(/[^A-Za-zÇĞİIÖŞÜçğıöşü]+/g, "");
  if (!lettersOnly) {
    return cleaned;
  }

  const isAllUpper = lettersOnly === lettersOnly.toLocaleUpperCase("tr");
  return isAllUpper ? toTitleCaseTr(cleaned) : cleaned;
}

function buildMapsUrl(result, preferredQuery = "") {
  const preferred = normalizeText(preferredQuery);
  if (preferred) {
    const mapsUrl = new URL("https://www.google.com/maps/search/");
    mapsUrl.searchParams.set("api", "1");
    mapsUrl.searchParams.set("query", preferred);
    return mapsUrl.toString();
  }

  const lat = Number(result?.Point?.DecLatitude ?? result?.Point?.Latitude);
  const lng = Number(result?.Point?.DecLongitude ?? result?.Point?.Longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const mapsUrl = new URL("https://www.google.com/maps/search/");
    mapsUrl.searchParams.set("api", "1");
    mapsUrl.searchParams.set("query", `${lat},${lng}`);
    return mapsUrl.toString();
  }

  const detailUrl = normalizeText(result?.DetailUrl);
  if (detailUrl) {
    return detailUrl.startsWith("http") ? detailUrl : `https://www.bulurum.com${detailUrl}`;
  }

  const fallbackQuery = [result?.CompanyName, result?.Address].map((value) => normalizeText(value)).filter(Boolean).join(" ");
  if (!fallbackQuery) {
    return "";
  }

  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", fallbackQuery);
  return mapsUrl.toString();
}

function normalizeDetailUrl(value) {
  const detailUrl = normalizeText(value);
  if (!detailUrl) {
    return "";
  }
  return detailUrl.startsWith("http") ? detailUrl : `https://www.bulurum.com${detailUrl}`;
}

function parseTotalCount(html) {
  const totalMatch = html.match(/([0-9.,]+)\s*sonu[çc]\s*bulundu/iu);
  if (!totalMatch) {
    return 0;
  }
  const numeric = Number.parseInt(String(totalMatch[1]).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseListingCards(html) {
  const startToken = '<div class="FreeListingItemBox"';
  const rows = [];
  let cursor = 0;

  while (true) {
    const startIndex = html.indexOf(startToken, cursor);
    if (startIndex < 0) {
      break;
    }

    let endIndex = html.indexOf(startToken, startIndex + startToken.length);
    if (endIndex < 0) {
      const pagingIndex = html.indexOf('<div class="PagingArea"', startIndex);
      endIndex = pagingIndex >= 0 ? pagingIndex : html.length;
    }

    const block = html.slice(startIndex, endIndex);
    cursor = endIndex;

    const nameMatch = block.match(
      /<h2 class="CompanyName"[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/iu,
    );
    const addressMatch = block.match(/<div class="FreeListingAddress">([\s\S]*?)<\/div>/iu);

    if (!nameMatch || !addressMatch) {
      continue;
    }

    const cityMeta = stripTags(
      (block.match(/<meta itemprop="addressRegion" content="([^"]*)" \/>/iu) || [])[1],
    );
    const districtMeta = stripTags(
      (block.match(/<meta itemprop="addressLocality" content="([^"]*)" \/>/iu) || [])[1],
    );
    const latitude = Number.parseFloat(
      (block.match(/<meta itemprop="latitude" content="([^"]*)" \/>/iu) || [])[1] || "",
    );
    const longitude = Number.parseFloat(
      (block.match(/<meta itemprop="longitude" content="([^"]*)" \/>/iu) || [])[1] || "",
    );
    const website =
      stripTags((block.match(/<meta itemprop="url" content="([^"]*)" \/>/iu) || [])[1]) ||
      stripTags((block.match(/itemprop="url"[^>]*href="([^"]+)"/iu) || [])[1]);
    const phone =
      stripTags((block.match(/<div class="DetailsText" itemprop="telephone">([\s\S]*?)<\/div>/iu) || [])[1]) ||
      stripTags((block.match(/<div id="phoneDetails_[^"]*" class="PhonesBox">\s*<label>([\s\S]*?)<\/label>/iu) || [])[1]);

    rows.push({
      CompanyName: stripTags(nameMatch[2]),
      Address: stripTags(addressMatch[1]),
      CompanyWebsite: website,
      CompanyPhone: phone,
      Point: {
        DecLatitude: Number.isFinite(latitude) ? latitude : null,
        DecLongitude: Number.isFinite(longitude) ? longitude : null,
      },
      _metaCity: cityMeta,
      _metaDistrict: districtMeta,
    });
  }

  return rows;
}

function parseResultsArray(html) {
  const marker = "mapInfo.results =";
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    return [];
  }

  const startIndex = html.indexOf("[", markerIndex);
  if (startIndex < 0) {
    return [];
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIndex = -1;

  for (let i = startIndex; i < html.length; i += 1) {
    const char = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex < 0) {
    return [];
  }

  const jsonText = html.slice(startIndex, endIndex + 1);
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function isCaptchaPage(html) {
  const hasResults =
    html.includes("mainCountResultsTitle") ||
    html.includes("mapInfo.results =") ||
    html.includes("FreeListingItemBox") ||
    /sonu[çc]\s*bulundu/iu.test(html);
  if (hasResults) {
    return false;
  }

  const text = normalizeForCompare(html);
  return text.includes("captchapagecomp.css") || text.includes("captcha");
}

function isCitySpecificPage(html, cityName) {
  const title = normalizeForCompare(extractPageTitle(html));
  const cityNorm = normalizeForCompare(cityName);
  if (!title || !cityNorm) {
    return false;
  }

  if (title.startsWith("turkiye ")) {
    return false;
  }

  return title.includes(cityNorm);
}

function districtIndexFromMap(districtMap) {
  const cities = Object.keys(districtMap || {})
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  const cityRows = cities.map((city) => {
    const districts = (districtMap[city] || [])
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .sort((left, right) => right.length - left.length);

    return {
      city,
      cityNorm: normalizeForCompare(city),
      districts: districts.map((district) => ({ district, districtNorm: normalizeForCompare(district) })),
    };
  });

  return { cities, cityRows };
}

function findCityFromSegments(segmentRows, cityRows) {
  for (let i = segmentRows.length - 1; i >= 0; i -= 1) {
    const segment = segmentRows[i];
    if (!segment.norm) {
      continue;
    }

    for (const cityRow of cityRows) {
      if (
        segment.norm === cityRow.cityNorm ||
        segment.norm.endsWith(` ${cityRow.cityNorm}`) ||
        segment.norm.startsWith(`${cityRow.cityNorm} `)
      ) {
        return { city: cityRow.city, index: i };
      }
    }
  }

  return { city: "", index: -1 };
}

function findCityFromAddressText(addressNorm, cityRows) {
  let bestCity = "";
  let bestIndex = -1;
  let bestLength = -1;

  for (const cityRow of cityRows) {
    const idx = addressNorm.lastIndexOf(cityRow.cityNorm);
    if (idx < 0) {
      continue;
    }

    if (idx > bestIndex || (idx === bestIndex && cityRow.cityNorm.length > bestLength)) {
      bestCity = cityRow.city;
      bestIndex = idx;
      bestLength = cityRow.cityNorm.length;
    }
  }

  return bestCity;
}

function findDistrictForCity(city, segmentRows, citySegmentIndex, addressNorm, districtMap) {
  const districtList = Array.isArray(districtMap[city]) ? districtMap[city] : [];
  if (!districtList.length) {
    return "";
  }

  const districtRows = districtList
    .map((district) => normalizeText(district))
    .filter(Boolean)
    .map((district) => ({ district, districtNorm: normalizeForCompare(district) }))
    .sort((left, right) => right.districtNorm.length - left.districtNorm.length);

  const candidateIndexes = [];
  if (citySegmentIndex >= 0) {
    candidateIndexes.push(citySegmentIndex - 1, citySegmentIndex);
  }
  candidateIndexes.push(segmentRows.length - 1, segmentRows.length - 2);

  const uniqueIndexes = [...new Set(candidateIndexes)].filter(
    (index) => index >= 0 && index < segmentRows.length,
  );

  for (const index of uniqueIndexes) {
    const segmentNorm = segmentRows[index].norm;
    if (!segmentNorm) {
      continue;
    }

    for (const districtRow of districtRows) {
      if (!districtRow.districtNorm) {
        continue;
      }

      if (
        segmentNorm === districtRow.districtNorm ||
        segmentNorm.includes(` ${districtRow.districtNorm}`) ||
        segmentNorm.includes(`${districtRow.districtNorm} `)
      ) {
        return districtRow.district;
      }
    }
  }

  let bestDistrict = "";
  let bestIndex = -1;
  let bestLength = -1;

  for (const districtRow of districtRows) {
    const idx = addressNorm.lastIndexOf(districtRow.districtNorm);
    if (idx < 0) {
      continue;
    }

    if (idx > bestIndex || (idx === bestIndex && districtRow.districtNorm.length > bestLength)) {
      bestDistrict = districtRow.district;
      bestIndex = idx;
      bestLength = districtRow.districtNorm.length;
    }
  }

  if (bestDistrict) {
    return bestDistrict;
  }

  if (districtList.includes("Merkez")) {
    return "Merkez";
  }

  return "";
}

function extractCityDistrict(address, districtMap, districtIndex) {
  const addressText = normalizeText(address);
  const segments = addressText
    .split(",")
    .map((value) => normalizeText(value))
    .filter(Boolean);
  const segmentRows = segments.map((segment) => ({ raw: segment, norm: normalizeForCompare(segment) }));
  const addressNorm = normalizeForCompare(addressText);

  let { city, index: citySegmentIndex } = findCityFromSegments(segmentRows, districtIndex.cityRows);
  if (!city) {
    city = findCityFromAddressText(addressNorm, districtIndex.cityRows);
    citySegmentIndex = -1;
  }

  if (!city && segments.length > 0) {
    city = toTitleCaseTr(segments[segments.length - 1]);
  }

  let district = "";
  if (city) {
    district = findDistrictForCity(city, segmentRows, citySegmentIndex, addressNorm, districtMap);
  }

  if (!district && segments.length > 1) {
    district = toTitleCaseTr(segments[segments.length - 2]);
  }

  if (!district) {
    district = "Merkez";
  }

  return { city: city || "Bilinmiyor", district };
}

async function fetchPageHtml(url, retryLimit) {
  const statusMarker = "__HTTP_STATUS__:";

  for (let attempt = 1; attempt <= retryLimit; attempt += 1) {
    try {
      const result = spawnSync(
        "curl",
        [
          "-L",
          "--silent",
          "--show-error",
          "--max-time",
          "40",
          "-A",
          USER_AGENT,
          "-H",
          "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "-H",
          "Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.7,en;q=0.6",
          "-w",
          `\\n${statusMarker}%{http_code}`,
          url,
        ],
        {
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
        },
      );

      if (result.status !== 0) {
        throw new Error((result.stderr || "").trim() || `curl failed (${result.status})`);
      }

      const output = String(result.stdout || "");
      const markerIndex = output.lastIndexOf(`\n${statusMarker}`);
      const html = markerIndex >= 0 ? output.slice(0, markerIndex) : output;
      const httpCodeRaw = markerIndex >= 0 ? output.slice(markerIndex + statusMarker.length + 1).trim() : "0";
      const statusCode = Number.parseInt(httpCodeRaw, 10) || 0;

      if (statusCode >= 400) {
        if (statusCode >= 500 || statusCode === 429) {
          throw new Error(`HTTP ${statusCode}`);
        }
        return { ok: false, status: statusCode, html: "", captcha: false };
      }

      if (isCaptchaPage(html)) {
        return { ok: false, status: statusCode, html, captcha: true };
      }

      return { ok: true, status: statusCode, html, captcha: false };
    } catch (error) {
      if (attempt >= retryLimit) {
        return { ok: false, status: 0, html: "", captcha: false, error: String(error && error.message ? error.message : error) };
      }
      await sleep(Math.min(4000, 600 * attempt));
    }
  }

  return { ok: false, status: 0, html: "", captcha: false };
}

function citySlug(cityName) {
  return normalizeForCompare(cityName).replace(/\s+/g, "-");
}

function cityBaseUrl(cityName) {
  return `${SOURCE_URL}${citySlug(cityName)}/`;
}

function cityPageUrl(cityName, pageIndex) {
  const baseUrl = cityBaseUrl(cityName);
  if (pageIndex <= 0) {
    return baseUrl;
  }
  return `${baseUrl}?page=${pageIndex}`;
}

function globalPageUrl(pageIndex) {
  if (pageIndex <= 0) {
    return SOURCE_URL;
  }
  return `${SOURCE_URL}?page=${pageIndex}`;
}

function districtNormSetForCity(cityName, districtMap) {
  const districts = Array.isArray(districtMap[cityName]) ? districtMap[cityName] : [];
  const set = new Set();
  for (const district of districts) {
    const districtNorm = normalizeForCompare(district);
    if (districtNorm) {
      set.add(districtNorm);
    }
  }
  return set;
}

function mapResultToVenue(result, districtMap, districtIndex, expectedCity = "") {
  const name = sanitizeName(result?.CompanyName);
  const address = normalizeText(result?.Address);

  if (!name || !address) {
    return null;
  }

  const parsed = extractCityDistrict(address, districtMap, districtIndex);
  const metaCity = normalizeText(result?._metaCity);
  const metaDistrict = normalizeText(result?._metaDistrict);
  let city = metaCity || parsed.city;
  let district = metaDistrict || parsed.district;

  if (expectedCity) {
    const expectedCityNorm = normalizeForCompare(expectedCity);
    const parsedCityNorm = normalizeForCompare(parsed.city);
    const addressNorm = normalizeForCompare(address);

    const districtNorms = districtNormSetForCity(expectedCity, districtMap);
    const matchesExpectedCityByName = addressNorm.includes(expectedCityNorm);
    const matchesExpectedCityByDistrict = [...districtNorms].some((districtNorm) => addressNorm.includes(districtNorm));

    if (parsedCityNorm !== expectedCityNorm && !matchesExpectedCityByName && !matchesExpectedCityByDistrict) {
      return null;
    }

    city = expectedCity;
    district = findDistrictForCity(
      expectedCity,
      address
        .split(",")
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .map((segment) => ({ raw: segment, norm: normalizeForCompare(segment) })),
      -1,
      addressNorm,
      districtMap,
    ) || district || "Merkez";
  } else if (metaCity && Object.prototype.hasOwnProperty.call(districtMap, metaCity)) {
    city = metaCity;
    district = findDistrictForCity(
      city,
      address
        .split(",")
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .map((segment) => ({ raw: segment, norm: normalizeForCompare(segment) })),
      -1,
      normalizeForCompare(address),
      districtMap,
    ) || metaDistrict || district || "Merkez";
  }

  const mapsUrl = buildMapsUrl(result, `${name} ${address}`.trim());

  return {
    city,
    district,
    name,
    address,
    placeId: "",
    mapsUrl,
    website: normalizeText(result?.CompanyWebsite),
    phone: normalizeText(result?.CompanyPhone),
  };
}

function dedupeVenues(venues) {
  const seen = new Set();
  const unique = [];

  for (const venue of venues) {
    const key = normalizeKey(
      `${venue.city}|${venue.district}|${venue.name}|${venue.address}|${venue.phone}|${venue.website}|${venue.mapsUrl}`,
    );
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(venue);
  }

  return unique.sort((left, right) => {
    const cityCompare = left.city.localeCompare(right.city, "tr");
    if (cityCompare !== 0) {
      return cityCompare;
    }

    const districtCompare = left.district.localeCompare(right.district, "tr");
    if (districtCompare !== 0) {
      return districtCompare;
    }

    return left.name.localeCompare(right.name, "tr");
  });
}

function persistOutput(nextRows) {
  writeJson(BACKUP_PATH, readJson(OUTPUT_PATH, []));
  writeJson(OUTPUT_PATH, nextRows);
}

async function main() {
  const districtMap = readJson(DISTRICTS_PATH, {});
  const districtIndex = districtIndexFromMap(districtMap);
  const existingRows = readJson(OUTPUT_PATH, []);
  const collected = [];
  let failedPages = 0;
  let scannedPages = 0;
  let captchaHitCount = 0;
  const allCities = Object.keys(districtMap || {})
    .map((city) => normalizeText(city))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "tr"));
  const targetCities = CITY_FILTERS.length
    ? allCities.filter((city) => CITY_FILTERS.includes(normalizeForCompare(city)))
    : allCities;
  const fallbackCities = new Set();

  if (targetCities.length === 0) {
    console.error("Filtreye uygun il bulunamadi.");
    process.exitCode = 1;
    return;
  }

  for (let cityIndex = 0; cityIndex < targetCities.length; cityIndex += 1) {
    const cityName = targetCities[cityIndex];
    let cityFirstResponse = null;

    for (let captchaRetry = 0; captchaRetry <= CAPTCHA_RETRY_LIMIT; captchaRetry += 1) {
      const response = await fetchPageHtml(cityPageUrl(cityName, 0), RETRY_LIMIT);
      if (response.ok) {
        cityFirstResponse = response;
        break;
      }

      if (response.captcha && captchaRetry < CAPTCHA_RETRY_LIMIT) {
        captchaHitCount += 1;
        const waitMs = CAPTCHA_WAIT_MS * (captchaRetry + 1);
        console.error(`Captcha [${cityName}] bekleniyor (${Math.round(waitMs / 1000)} sn)...`);
        await sleep(waitMs);
        continue;
      }

      failedPages += 1;
      if (response.captcha) {
        captchaHitCount += 1;
      }
      console.error(
        `Il sayfasi hatasi [${cityName}]: ${response.status || response.error || "bilinmeyen hata"}`,
      );
      break;
    }

    if (!cityFirstResponse || !cityFirstResponse.ok) {
      continue;
    }

    if (!isCitySpecificPage(cityFirstResponse.html, cityName)) {
      fallbackCities.add(cityName);
      console.log(`[${cityIndex + 1}/${targetCities.length}] ${cityName} | sehir sayfasi yok, genel taramaya birakildi`);
      continue;
    }

    const firstRows = parseListingCards(cityFirstResponse.html);
    const totalCount = parseTotalCount(cityFirstResponse.html);
    const pageSize = firstRows.length > 0 ? firstRows.length : 20;
    const discoveredPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;
    const cityPageLimit = MAX_PAGES > 0 ? Math.min(discoveredPages, START_PAGE + MAX_PAGES) : discoveredPages;
    let cityEmptyStreak = 0;

    for (let pageIndex = START_PAGE; pageIndex < cityPageLimit; pageIndex += 1) {
      let html = "";

      if (pageIndex === 0 && START_PAGE === 0) {
        html = cityFirstResponse.html;
      } else {
        let pageResponse = null;
        for (let captchaRetry = 0; captchaRetry <= CAPTCHA_RETRY_LIMIT; captchaRetry += 1) {
          const response = await fetchPageHtml(cityPageUrl(cityName, pageIndex), RETRY_LIMIT);
          if (response.ok) {
            pageResponse = response;
            break;
          }

          if (response.captcha && captchaRetry < CAPTCHA_RETRY_LIMIT) {
            captchaHitCount += 1;
            const waitMs = CAPTCHA_WAIT_MS * (captchaRetry + 1);
            console.error(
              `Captcha [${cityName} ${pageIndex + 1}/${cityPageLimit}] bekleniyor (${Math.round(waitMs / 1000)} sn)...`,
            );
            await sleep(waitMs);
            continue;
          }

          failedPages += 1;
          if (response.captcha) {
            captchaHitCount += 1;
          }
          console.error(
            `Sayfa hatasi [${cityName} ${pageIndex + 1}/${cityPageLimit}]: ${response.status || response.error || "bilinmeyen hata"}`,
          );
          break;
        }

        if (!pageResponse || !pageResponse.ok) {
          continue;
        }

        html = pageResponse.html;
      }

      const rawRows = parseListingCards(html);
      const mappedRows = rawRows
        .map((row) => mapResultToVenue(row, districtMap, districtIndex, cityName))
        .filter(Boolean)
        .filter((row) => Object.prototype.hasOwnProperty.call(districtMap, row.city));

      scannedPages += 1;

      if (mappedRows.length === 0) {
        cityEmptyStreak += 1;
      } else {
        cityEmptyStreak = 0;
      }

      collected.push(...mappedRows);

      const uniqueCount = dedupeVenues(collected).length;
      console.log(
        `[${cityIndex + 1}/${targetCities.length}] ${cityName} | [${pageIndex + 1}/${cityPageLimit}] Ham: ${rawRows.length} | Eslesen: ${mappedRows.length} | Toplam esiz: ${uniqueCount}`,
      );

      if (!DRY_RUN && SAVE_EVERY > 0 && scannedPages % SAVE_EVERY === 0) {
        const snapshot = dedupeVenues(REPLACE_MODE ? collected : [...existingRows, ...collected]);
        persistOutput(snapshot);
        console.log(`Ara kayit yazildi: ${OUTPUT_PATH} (${snapshot.length})`);
      }

      if (cityEmptyStreak >= 3) {
        break;
      }

      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  }

  if (fallbackCities.size > 0) {
    let globalFirstResponse = null;
    for (let captchaRetry = 0; captchaRetry <= CAPTCHA_RETRY_LIMIT; captchaRetry += 1) {
      const response = await fetchPageHtml(globalPageUrl(0), RETRY_LIMIT);
      if (response.ok) {
        globalFirstResponse = response;
        break;
      }

      if (response.captcha && captchaRetry < CAPTCHA_RETRY_LIMIT) {
        captchaHitCount += 1;
        const waitMs = CAPTCHA_WAIT_MS * (captchaRetry + 1);
        console.error(`Captcha [genel fallback] bekleniyor (${Math.round(waitMs / 1000)} sn)...`);
        await sleep(waitMs);
        continue;
      }

      failedPages += 1;
      if (response.captcha) {
        captchaHitCount += 1;
      }
      console.error(
        `Genel fallback hatasi: ${response.status || response.error || "bilinmeyen hata"}`,
      );
      break;
    }

    if (globalFirstResponse && globalFirstResponse.ok) {
      const firstRows = parseListingCards(globalFirstResponse.html);
      const totalCount = parseTotalCount(globalFirstResponse.html);
      const pageSize = firstRows.length > 0 ? firstRows.length : 20;
      const discoveredPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;
      const globalPageLimit = Math.min(MAX_PAGES > 0 ? START_PAGE + MAX_PAGES : discoveredPages, 10);
      for (let pageIndex = START_PAGE; pageIndex < globalPageLimit; pageIndex += 1) {
        let html = "";

        if (pageIndex === 0 && START_PAGE === 0) {
          html = globalFirstResponse.html;
        } else {
          let pageResponse = null;
          for (let captchaRetry = 0; captchaRetry <= CAPTCHA_RETRY_LIMIT; captchaRetry += 1) {
            const response = await fetchPageHtml(globalPageUrl(pageIndex), RETRY_LIMIT);
            if (response.ok) {
              pageResponse = response;
              break;
            }

            if (response.captcha && captchaRetry < CAPTCHA_RETRY_LIMIT) {
              captchaHitCount += 1;
              const waitMs = CAPTCHA_WAIT_MS * (captchaRetry + 1);
              console.error(
                `Captcha [genel ${pageIndex + 1}/${globalPageLimit}] bekleniyor (${Math.round(waitMs / 1000)} sn)...`,
              );
              await sleep(waitMs);
              continue;
            }

            failedPages += 1;
            if (response.captcha) {
              captchaHitCount += 1;
            }
            console.error(
              `Genel sayfa hatasi [${pageIndex + 1}/${globalPageLimit}]: ${response.status || response.error || "bilinmeyen hata"}`,
            );
            break;
          }

          if (!pageResponse || !pageResponse.ok) {
            continue;
          }

          html = pageResponse.html;
        }

        const rawRows = parseListingCards(html);
        const mappedRows = rawRows
          .map((row) => mapResultToVenue(row, districtMap, districtIndex))
          .filter(Boolean)
          .filter((row) => fallbackCities.has(row.city));

        scannedPages += 1;

        collected.push(...mappedRows);

        const uniqueCount = dedupeVenues(collected).length;
        console.log(
          `[genel fallback] [${pageIndex + 1}/${globalPageLimit}] Ham: ${rawRows.length} | Eslesen: ${mappedRows.length} | Toplam esiz: ${uniqueCount}`,
        );

        if (!DRY_RUN && SAVE_EVERY > 0 && scannedPages % SAVE_EVERY === 0) {
          const snapshot = dedupeVenues(REPLACE_MODE ? collected : [...existingRows, ...collected]);
          persistOutput(snapshot);
          console.log(`Ara kayit yazildi: ${OUTPUT_PATH} (${snapshot.length})`);
        }

        if (REQUEST_DELAY_MS > 0) {
          await sleep(REQUEST_DELAY_MS);
        }
      }
    }
  }

  const finalRows = dedupeVenues(REPLACE_MODE ? collected : [...existingRows, ...collected]);

  console.log(`Toplam bulunan ham kayit: ${collected.length}`);
  console.log(`Toplam benzersiz kayit: ${finalRows.length}`);
  console.log(`Basarisiz sayfa: ${failedPages}`);
  if (captchaHitCount > 0) {
    console.log(`Captcha engeli gorulen sayfa denemesi: ${captchaHitCount}`);
    console.log("Uyari: Bulurum anti-bot (captcha) nedeniyle bazi sayfalar eksik kalmis olabilir.");
  }

  if (DRY_RUN) {
    console.log("Dry run tamamlandi, dosya yazilmadi.");
    return;
  }

  persistOutput(finalRows);
  console.log(`Yazildi: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Beklenmeyen hata:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
