"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DISTRICTS_PATH = path.join(ROOT, "data", "districts.json");
const ASM_PATH = path.join(ROOT, "data", "asm.json");
const FAMILY_PATH = path.join(ROOT, "data", "health-family-centers.json");
const BASE_URL = "https://apps.istanbulsaglik.gov.tr/AileSagligiMerkezleri/";
const REQUEST_TIMEOUT_MS = 25000;
const REQUEST_DELAY_MS = 120;
const REQUEST_RETRY_COUNT = 2;

/**
 * Sleep helper.
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

  return named
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });
}

/**
 * Strip HTML tags/comments and collapse whitespace.
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
 * Fetch URL as text with retries.
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
          "User-Agent": "arama-bul/1.0 (+istanbul-asm-merge)",
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
 * Resolve canonical district name for Istanbul.
 * @param {string} rawDistrict
 * @param {string} fallbackTown
 * @param {Map<string,string>} districtLookup
 * @returns {string}
 */
function resolveDistrict(rawDistrict, fallbackTown, districtLookup) {
  const candidates = [rawDistrict, fallbackTown];
  for (const candidate of candidates) {
    const key = normalizeText(candidate);
    if (!key) {
      continue;
    }
    const found = districtLookup.get(key);
    if (found) {
      return found;
    }
  }
  return cleanHtmlText(rawDistrict || fallbackTown);
}

/**
 * Parse district list from root page.
 * @param {string} html
 * @returns {Array<{townId:string,townName:string}>}
 */
function parseTownList(html) {
  const regex = /AileSagligiMerkezleri\.aspx\?town=(\d+)['"][^>]*>([^<]+)</g;
  const rows = [];
  let match = null;

  while ((match = regex.exec(html)) !== null) {
    const townId = String(match[1] || "").trim();
    const townName = cleanHtmlText(match[2] || "");
    if (!townId || !townName) {
      continue;
    }
    rows.push({ townId, townName });
  }

  const seen = new Set();
  return rows.filter((row) => {
    if (seen.has(row.townId)) {
      return false;
    }
    seen.add(row.townId);
    return true;
  });
}

/**
 * Parse ASM tables from a town page.
 * @param {string} html
 * @param {string} townName
 * @param {Map<string,string>} districtLookup
 * @returns {Array<{city:string,district:string,name:string,address:string,mapsUrl:string,phone:string,website:string,source:string,sourceUrl:string}>}
 */
function parseTownAsmRecords(html, townName, districtLookup) {
  const tableRegex = /<table class="institutionalList[\s\S]*?<\/table>/g;
  const rowRegex = /<tr>[\s\S]*?<\/tr>/g;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
  const mapHrefRegex = /<a[^>]+href=['"]([^'"]+)['"][^>]*>/i;
  const records = [];
  let tableMatch = null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[0];
    const fieldMap = new Map();
    let rowMatch = null;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[0];
      const cells = [];
      let tdMatch = null;
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        cells.push(tdMatch[1]);
      }
      if (cells.length < 2) {
        continue;
      }

      const label = cleanHtmlText(cells[0]);
      const value = cleanHtmlText(cells[1]);
      if (!label) {
        continue;
      }

      const key = normalizeText(label);
      if (!key) {
        continue;
      }
      fieldMap.set(key, value);

      if (key.includes("harita")) {
        const linkMatch = rowHtml.match(mapHrefRegex);
        if (linkMatch && linkMatch[1]) {
          fieldMap.set("haritalink", decodeHtml(linkMatch[1]));
        }
      }
    }

    const name = String(fieldMap.get(normalizeText("Birim")) || "").trim();
    if (!name) {
      continue;
    }

    const districtRaw = String(fieldMap.get(normalizeText("İlçe")) || townName).trim();
    const district = resolveDistrict(districtRaw, townName, districtLookup);
    const phoneRaw = String(fieldMap.get(normalizeText("Telefon")) || "").trim();
    const phone = /^[-\s]*$/u.test(phoneRaw) ? "" : phoneRaw;
    const address = String(fieldMap.get(normalizeText("Adres")) || "").trim();
    const mapsUrl = String(fieldMap.get("haritalink") || "").trim();

    records.push({
      city: "İstanbul",
      district,
      name,
      address,
      mapsUrl,
      website: "",
      phone,
      source: "apps.istanbulsaglik.gov.tr",
      sourceUrl: `${BASE_URL}AileSagligiMerkezleri.aspx?town=${encodeURIComponent(String(fieldMap.get("townid") || ""))}`,
    });
  }

  return records;
}

/**
 * Dedupe rows and sort.
 * @param {Array<any>} rows
 * @returns {Array<any>}
 */
function dedupeAndSort(rows) {
  const seen = new Set();
  const unique = [];

  for (const row of rows) {
    const key = normalizeText([row.city, row.district, row.name, row.address].join("|"));
    if (!row.city || !row.name || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(row);
  }

  unique.sort((a, b) => {
    const byCity = String(a.city || "").localeCompare(String(b.city || ""), "tr");
    if (byCity !== 0) {
      return byCity;
    }
    const byDistrict = String(a.district || "").localeCompare(String(b.district || ""), "tr");
    if (byDistrict !== 0) {
      return byDistrict;
    }
    return String(a.name || "").localeCompare(String(b.name || ""), "tr");
  });

  return unique;
}

/**
 * Main flow.
 * @returns {Promise<void>}
 */
async function main() {
  const districts = JSON.parse(await fs.readFile(DISTRICTS_PATH, "utf8"));
  const istanbulDistricts = Array.isArray(districts["İstanbul"]) ? districts["İstanbul"] : [];
  const districtLookup = new Map(istanbulDistricts.map((district) => [normalizeText(district), district]));

  const rootHtml = await fetchText(BASE_URL);
  const towns = parseTownList(rootHtml);
  if (towns.length === 0) {
    throw new Error("Ilce listesi parse edilemedi.");
  }

  const scraped = [];
  for (let index = 0; index < towns.length; index += 1) {
    const town = towns[index];
    const townUrl = `${BASE_URL}AileSagligiMerkezleri.aspx?town=${encodeURIComponent(town.townId)}`;
    process.stdout.write(`[${index + 1}/${towns.length}] ${town.townName}\n`);
    let html = "";
    try {
      html = await fetchText(townUrl);
    } catch (error) {
      process.stdout.write(`  - Atlandi: ${String(error.message || error)}\n`);
      await delay(REQUEST_DELAY_MS);
      continue;
    }

    const rows = parseTownAsmRecords(html, town.townName, districtLookup).map((row) => ({
      ...row,
      sourceUrl: townUrl,
    }));
    scraped.push(...rows);
    await delay(REQUEST_DELAY_MS);
  }

  const asmExisting = JSON.parse(await fs.readFile(ASM_PATH, "utf8"));
  const familyExisting = JSON.parse(await fs.readFile(FAMILY_PATH, "utf8"));

  const asmMerged = dedupeAndSort([
    ...asmExisting.filter((row) => String(row.city || "").trim() !== "İstanbul"),
    ...scraped,
  ]);
  const familyMerged = dedupeAndSort([
    ...familyExisting.filter((row) => String(row.city || "").trim() !== "İstanbul"),
    ...scraped,
  ]);

  await fs.writeFile(ASM_PATH, `${JSON.stringify(asmMerged, null, 2)}\n`, "utf8");
  await fs.writeFile(FAMILY_PATH, `${JSON.stringify(familyMerged, null, 2)}\n`, "utf8");

  const istanbulCount = scraped.length;
  const istanbulDistrictTagged = scraped.filter((row) => String(row.district || "").trim()).length;
  process.stdout.write(
    `Yazildi: ${ASM_PATH}\n` +
      `Yazildi: ${FAMILY_PATH}\n` +
      `Istanbul ASM kaydi: ${istanbulCount} (ilce etiketli: ${istanbulDistrictTagged})\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${String(error && error.message ? error.message : error)}\n`);
  process.exitCode = 1;
});
