"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DISTRICTS_PATH = path.join(ROOT, "data", "districts.json");
const HOSPITALS_OUTPUT_PATH = path.join(ROOT, "data", "health-hospitals.json");
const FAMILY_OUTPUT_PATH = path.join(ROOT, "data", "health-family-centers.json");
const ASM_OUTPUT_PATH = path.join(ROOT, "data", "asm.json");
const BASE_URL = "https://www.saglikkurumlari.net";
const REQUEST_TIMEOUT_MS = 25000;
const REQUEST_DELAY_MS = 120;
const REQUEST_RETRY_COUNT = 2;

/**
 * Sleep helper for pacing.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalize Turkish text for matching.
 * @param {string} value
 * @returns {string}
 */
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Convert city/district text to URL slug.
 * @param {string} value
 * @returns {string}
 */
function slugifyTr(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Decode limited HTML entities.
 * @param {string} value
 * @returns {string}
 */
function decodeHtml(value) {
  const raw = String(value || "");
  if (!raw) {
    return "";
  }

  const named = raw
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

  return named.replace(/&#(\d+);/g, (_m, dec) => {
    const code = Number(dec);
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  }).replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
    const code = Number.parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  });
}

/**
 * Strip HTML tags/comments and collapse spaces.
 * @param {string} value
 * @returns {string}
 */
function cleanHtmlText(value) {
  return decodeHtml(String(value || ""))
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch a URL as text with timeout + retry.
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchText(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= REQUEST_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "arama-bul/1.0 (+health-data-builder)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRY_COUNT) {
        await delay(350 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Istek basarisiz: ${url} (${String(lastError && lastError.message ? lastError.message : "bilinmeyen hata")})`);
}

/**
 * Keep only server-rendered body before Next payload scripts.
 * @param {string} html
 * @returns {string}
 */
function extractRenderableHtml(html) {
  const raw = String(html || "");
  const marker = "<script>self.__next_f.push";
  const markerIndex = raw.indexOf(marker);
  return markerIndex >= 0 ? raw.slice(0, markerIndex) : raw;
}

/**
 * Parse district links from a city page.
 * @param {string} html
 * @param {string} citySlug
 * @returns {string[]}
 */
function parseDistrictSlugs(html, citySlug) {
  const prefix = `/saglik-kurumlari/${citySlug}/`;
  const regex = new RegExp(`href="${prefix}([^"?#/]+)"`, "g");
  const links = [];
  let match = null;

  while ((match = regex.exec(html)) !== null) {
    const slug = String(match[1] || "").trim();
    if (!slug || slug.endsWith("-turunde")) {
      continue;
    }
    links.push(slug);
  }

  return [...new Set(links)];
}

/**
 * Parse all record cards from a rendered page.
 * @param {string} html
 * @returns {Array<{name:string,type:string,address:string,phone:string,email:string}>}
 */
function parseCards(html) {
  const cardRegex = /<div class="border-primary flex h-full flex-col overflow-hidden rounded-md border-2"><div class="bg-primary[^>]*>([\s\S]*?)<\/div><div class="flex flex-auto flex-col gap-3 p-3">([\s\S]*?)<\/div><\/div>/g;
  const cards = [];
  let cardMatch = null;

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const itemRegex = /<div class="perItem">[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/div>/g;
    const name = cleanHtmlText(cardMatch[1]);
    if (!name) {
      continue;
    }

    const items = [];
    let itemMatch = null;
    while ((itemMatch = itemRegex.exec(cardMatch[2])) !== null) {
      const text = cleanHtmlText(itemMatch[1]);
      if (text) {
        items.push(text);
      }
    }

    const type = String(items[0] || "").trim();
    let address = "";
    let phone = "";
    let email = "";

    for (const item of items.slice(1)) {
      const cleaned = String(item || "").trim();
      if (!cleaned) {
        continue;
      }

      if (!email && cleaned.includes("@")) {
        email = cleaned;
        continue;
      }

      const compact = cleaned.replace(/\s+/g, " ").trim();
      const onlyPhoneChars = /^[+()0-9\s-]{7,24}$/.test(compact);
      const digitCount = compact.replace(/\D/g, "").length;
      if (!phone && onlyPhoneChars && digitCount >= 7 && digitCount <= 12) {
        phone = cleaned;
        continue;
      }

      if (!address && normalizeText(cleaned) !== normalizeText(name)) {
        address = cleaned;
      }
    }

    cards.push({ name, type, address, phone, email });
  }

  return cards;
}

/**
 * Build a stable key for matching a card across city/district pages.
 * @param {{name:string,type:string,address:string,phone:string}} card
 * @returns {string}
 */
function buildCardKey(card) {
  return normalizeText([
    String(card?.name || ""),
    String(card?.type || ""),
    String(card?.address || ""),
    String(card?.phone || ""),
  ].join("|"));
}

/**
 * Resolve district from free text.
 * @param {string} city
 * @param {string} text
 * @param {Record<string,string[]>} districtMap
 * @returns {string}
 */
function resolveDistrict(city, text, districtMap) {
  const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
  if (districts.length === 0) {
    return "";
  }

  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return "";
  }

  const ordered = [...districts].sort((a, b) => normalizeText(b).length - normalizeText(a).length);
  const found = ordered.find((district) => {
    const key = normalizeText(district);
    return key && normalizedText.includes(key);
  });

  return found || "";
}

/**
 * Match district by slug to official district name.
 * @param {string} city
 * @param {string} districtSlug
 * @param {Record<string,string[]>} districtMap
 * @returns {string}
 */
function districtFromSlug(city, districtSlug, districtMap) {
  const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
  const match = districts.find((district) => slugifyTr(district) === districtSlug);
  return match || "";
}

/**
 * Resolve a district name from page h1 text.
 * @param {string} headingText
 * @param {string} city
 * @param {Record<string,string[]>} districtMap
 * @returns {string}
 */
function districtFromHeading(headingText, city, districtMap) {
  const raw = cleanHtmlText(headingText);
  if (!raw) {
    return "";
  }

  let candidate = raw
    .replace(new RegExp(`^${city}\\s+`, "i"), "")
    .replace(/\s+Sağlık Kurumları$/i, "")
    .trim();

  if (!candidate || normalizeText(candidate) === normalizeText(city)) {
    return "";
  }

  const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
  const found = districts.find((district) => normalizeText(district) === normalizeText(candidate));
  if (found) {
    return found;
  }

  candidate = candidate.replace(/\s+Merkez( İlçe(si)?)?$/i, "").trim();
  const foundLoose = districts.find((district) => normalizeText(district) === normalizeText(candidate));
  return foundLoose || "";
}

/**
 * Classify card type.
 * @param {string} typeText
 * @param {string} nameText
 * @returns {"hospital"|"asm"|"other"}
 */
function classifyType(typeText, nameText = "") {
  const key = normalizeText(typeText);
  const nameKey = normalizeText(nameText);

  if (key.includes("ailesagligimerkez")) {
    return "asm";
  }
  if (key.includes("hastane")) {
    return "hospital";
  }

  if (nameKey.includes("ailesagligimerkez") || nameKey.endsWith("asm") || nameKey.includes("asm")) {
    return "asm";
  }
  if (nameKey.includes("hastane") || nameKey.includes("tipfak") || nameKey.includes("universite")) {
    return "hospital";
  }

  return "other";
}

/**
 * Normalize hospital group title.
 * @param {string} typeText
 * @param {string} nameText
 * @returns {string}
 */
function resolveHospitalGroup(typeText, nameText = "") {
  const raw = String(typeText || "").trim();
  const key = normalizeText(raw);
  const nameKey = normalizeText(nameText);

  if (nameKey.includes("universite") || nameKey.includes("univ") || nameKey.includes("tipfak")) {
    return "Üniversite Hastaneleri";
  }

  if (key.includes("sehirhastane")) {
    return "Şehir Hastaneleri";
  }
  if (key.includes("ozelhastane")) {
    return "Özel Hastaneler";
  }
  if (key.includes("devlethastane")) {
    return "Devlet Hastaneleri";
  }
  if (key.includes("universitehastane")) {
    return "Üniversite Hastaneleri";
  }
  if (raw) {
    return raw;
  }
  return "Hastaneler";
}

/**
 * Build Google Maps search URL.
 * @param {string} name
 * @param {string} district
 * @param {string} city
 * @param {string} address
 * @returns {string}
 */
function buildMapsUrl(name, district, city, address) {
  const query = [name, address, district, city, "Türkiye"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Parse CLI args.
 * @returns {{city:string,limit:number}}
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const getValue = (key) => {
    const index = args.indexOf(key);
    if (index < 0 || index + 1 >= args.length) {
      return "";
    }
    return String(args[index + 1] || "").trim();
  };

  const city = getValue("--city");
  const limitRaw = getValue("--limit");
  const limit = limitRaw ? Number(limitRaw) : 0;
  return { city, limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0 };
}

/**
 * Read source-supported city list from /tum-iller.
 * @param {Record<string,string[]>} districtMap
 * @returns {Promise<string[]>}
 */
async function fetchSourceCityList(districtMap) {
  const page = await fetchText(`${BASE_URL}/tum-iller`);
  const rendered = extractRenderableHtml(page);
  const districtCities = Object.keys(districtMap);
  const mapByKey = new Map(districtCities.map((city) => [normalizeText(city), city]));

  const cityListMatch = page.match(/"cityList":\[(.*?)\]/s);
  if (cityListMatch) {
    const literal = `[${cityListMatch[1]}]`;
    try {
      const parsed = JSON.parse(literal);
      if (Array.isArray(parsed)) {
        const mapped = parsed
          .map((value) => mapByKey.get(normalizeText(value)))
          .filter(Boolean);
        if (mapped.length > 0) {
          return [...new Set(mapped)];
        }
      }
    } catch (_error) {
      // Fallback below.
    }
  }

  const fallbackMatches = [...rendered.matchAll(/href="\/saglik-kurumlari\/([^"?#/]+)"/g)]
    .map((item) => String(item[1] || "").trim())
    .filter(Boolean);
  const fallbackCities = districtCities.filter((city) => fallbackMatches.includes(slugifyTr(city)));
  return [...new Set(fallbackCities)];
}

/**
 * Build data from saglikkurumlari pages.
 * @returns {Promise<void>}
 */
async function main() {
  const { city: cityFilter, limit } = parseArgs();
  const districtMap = JSON.parse(await fs.readFile(DISTRICTS_PATH, "utf8"));
  const sourceCities = await fetchSourceCityList(districtMap);
  const cityNames = sourceCities.sort((a, b) => a.localeCompare(b, "tr"));
  const filteredCityNames = cityFilter
    ? cityNames.filter((city) => normalizeText(city) === normalizeText(cityFilter))
    : cityNames;
  const cities = limit > 0 ? filteredCityNames.slice(0, limit) : filteredCityNames;

  const hospitals = [];
  const familyCenters = [];
  let failedCities = 0;

  for (let index = 0; index < cities.length; index += 1) {
    const city = cities[index];
    const citySlug = slugifyTr(city);
    const cityUrl = `${BASE_URL}/saglik-kurumlari/${citySlug}`;
    process.stdout.write(`[${index + 1}/${cities.length}] ${city}\n`);

    let cityPage = "";
    try {
      cityPage = await fetchText(cityUrl);
    } catch (error) {
      failedCities += 1;
      process.stdout.write(`  - Atlandi (sehir sayfasi acilmadi): ${String(error.message || error)}\n`);
      await delay(REQUEST_DELAY_MS);
      continue;
    }

    const renderedCityPage = extractRenderableHtml(cityPage);
    const cards = parseCards(renderedCityPage);
    const cityDistricts = Array.isArray(districtMap[city]) ? districtMap[city] : [];

    cards.forEach((card) => {
      const kind = classifyType(card.type, card.name);
      if (kind === "other") {
        return;
      }

      const district = resolveDistrict(city, `${card.name} ${card.address}`, districtMap);

      if (kind === "hospital") {
        hospitals.push({
          city,
          district,
          name: card.name,
          address: card.address,
          mapsUrl: buildMapsUrl(card.name, district, city, card.address),
          website: "",
          phone: card.phone,
          source: "saglikkurumlari.net",
          sourceUrl: cityUrl,
          hospitalGroup: resolveHospitalGroup(card.type, card.name),
        });
        return;
      }

      familyCenters.push({
        city,
        district,
        name: card.name,
        address: card.address,
        mapsUrl: buildMapsUrl(card.name, district, city, card.address),
        website: "",
        phone: card.phone,
        source: "saglikkurumlari.net",
        sourceUrl: cityUrl,
      });
    });

    const districtSlugs = parseDistrictSlugs(renderedCityPage, citySlug);
    if (districtSlugs.length > 0) {
      for (const districtSlug of districtSlugs) {
        const districtUrl = `${BASE_URL}/saglik-kurumlari/${citySlug}/${districtSlug}`;
        let districtPage = "";

        try {
          districtPage = await fetchText(districtUrl);
        } catch (_error) {
          await delay(REQUEST_DELAY_MS);
          continue;
        }

        const renderedDistrictPage = extractRenderableHtml(districtPage);
        const headingMatch = renderedDistrictPage.match(/<h1>([\s\S]*?)<\/h1>/i);
        const bySlug = districtFromSlug(city, districtSlug, districtMap);
        const byHeading = districtFromHeading(headingMatch ? headingMatch[1] : "", city, districtMap);
        const pageDistrict = bySlug || byHeading;
        if (!pageDistrict || !cityDistricts.includes(pageDistrict)) {
          await delay(REQUEST_DELAY_MS);
          continue;
        }

        const districtCards = parseCards(renderedDistrictPage);
        districtCards.forEach((card) => {
          const kind = classifyType(card.type, card.name);
          if (kind === "other") {
            return;
          }

          const district = pageDistrict || resolveDistrict(city, `${card.name} ${card.address}`, districtMap);

          if (kind === "hospital") {
            hospitals.push({
              city,
              district,
              name: card.name,
              address: card.address,
              mapsUrl: buildMapsUrl(card.name, district, city, card.address),
              website: "",
              phone: card.phone,
              source: "saglikkurumlari.net",
              sourceUrl: districtUrl,
              hospitalGroup: resolveHospitalGroup(card.type, card.name),
            });
            return;
          }

          familyCenters.push({
            city,
            district,
            name: card.name,
            address: card.address,
            mapsUrl: buildMapsUrl(card.name, district, city, card.address),
            website: "",
            phone: card.phone,
            source: "saglikkurumlari.net",
            sourceUrl: districtUrl,
          });
        });

        await delay(REQUEST_DELAY_MS);
      }
    }

    await delay(REQUEST_DELAY_MS);
  }

  const dropBlankDistrictRowsWhenDetailedExists = (rows, withGroup) => {
    const detailedKeySet = new Set(
      rows
        .filter((row) => String(row.district || "").trim())
        .map((row) => {
          const parts = [row.city, row.name, row.address];
          if (withGroup) {
            parts.push(row.hospitalGroup || "");
          }
          return normalizeText(parts.join("|"));
        }),
    );

    return rows.filter((row) => {
      if (String(row.district || "").trim()) {
        return true;
      }
      const parts = [row.city, row.name, row.address];
      if (withGroup) {
        parts.push(row.hospitalGroup || "");
      }
      const key = normalizeText(parts.join("|"));
      return !detailedKeySet.has(key);
    });
  };

  const dedupe = (rows, withGroup) => {
    const seen = new Set();
    return rows
      .filter((row) => {
        if (!row.city || !row.name) {
          return false;
        }
        const parts = [row.city, row.district, row.name];
        if (withGroup) {
          parts.push(row.hospitalGroup || "");
        }
        const key = normalizeText(parts.join("|"));
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const byCity = String(a.city || "").localeCompare(String(b.city || ""), "tr");
        if (byCity !== 0) {
          return byCity;
        }
        const byDistrict = String(a.district || "").localeCompare(String(b.district || ""), "tr");
        if (byDistrict !== 0) {
          return byDistrict;
        }
        if (withGroup) {
          const byGroup = String(a.hospitalGroup || "").localeCompare(String(b.hospitalGroup || ""), "tr");
          if (byGroup !== 0) {
            return byGroup;
          }
        }
        return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
  };

  const uniqueHospitals = dedupe(dropBlankDistrictRowsWhenDetailedExists(hospitals, true), true);
  const uniqueFamilyCenters = dedupe(dropBlankDistrictRowsWhenDetailedExists(familyCenters, false), false);
  const districtTaggedHospitals = uniqueHospitals.filter((row) => String(row.district || "").trim()).length;
  const districtTaggedFamily = uniqueFamilyCenters.filter((row) => String(row.district || "").trim()).length;

  await fs.writeFile(HOSPITALS_OUTPUT_PATH, `${JSON.stringify(uniqueHospitals, null, 2)}\n`, "utf8");
  await fs.writeFile(FAMILY_OUTPUT_PATH, `${JSON.stringify(uniqueFamilyCenters, null, 2)}\n`, "utf8");
  await fs.writeFile(ASM_OUTPUT_PATH, `${JSON.stringify(uniqueFamilyCenters, null, 2)}\n`, "utf8");

  process.stdout.write(
    `Yazildi: ${HOSPITALS_OUTPUT_PATH}\n` +
      `Yazildi: ${FAMILY_OUTPUT_PATH}\n` +
      `Yazildi: ${ASM_OUTPUT_PATH}\n` +
      `Hastane: ${uniqueHospitals.length} (ilce etiketli: ${districtTaggedHospitals})\n` +
      `ASM: ${uniqueFamilyCenters.length} (ilce etiketli: ${districtTaggedFamily})\n` +
      `Acilamayan sehir sayfasi: ${failedCities}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${String(error && error.message ? error.message : error)}\n`);
  process.exitCode = 1;
});
