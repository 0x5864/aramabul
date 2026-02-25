#!/usr/bin/env node

"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.resolve(ROOT, "data/nobetci-eczane.json");
const BACKUP_PATH = path.resolve(ROOT, "data/nobetci-eczane.backup.json");

const ROOT_URL = "https://www.nbtecz.com.tr/";
const BASE_URL = "https://www.nbtecz.com.tr";
const REQUEST_TIMEOUT_MS = 30000;
const REQUEST_DELAY_MS = Math.max(0, Number.parseInt(process.env.NBTECZ_DELAY_MS || "120", 10));

function decodeHtml(text) {
  return String(text || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&uuml;", "ü")
    .replaceAll("&Uuml;", "Ü")
    .replaceAll("&ouml;", "ö")
    .replaceAll("&Ouml;", "Ö")
    .replaceAll("&ccedil;", "ç")
    .replaceAll("&Ccedil;", "Ç")
    .replaceAll("&scedil;", "ş")
    .replaceAll("&Scedil;", "Ş")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&ldquo;", "\"")
    .replaceAll("&rdquo;", "\"")
    .replaceAll("&ndash;", "-")
    .replaceAll("&mdash;", "-");
}

function cleanText(value, maxLength = 300) {
  const text = decodeHtml(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxLength);
}

function normalizeKey(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "arama-bul/1.0 (+https://www.nbtecz.com.tr/)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractCityUrls(rootHtml) {
  const set = new Set();
  const regex = /href="(\/nobetci-eczane-[a-z0-9-]+)"/gi;

  for (const match of rootHtml.matchAll(regex)) {
    const relative = String(match[1] || "").trim();
    if (!relative) {
      continue;
    }
    set.add(`${BASE_URL}${relative}`);
  }

  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

function extractCategoryItems(blockHtml) {
  const categoryMatch = blockHtml.match(/<ul class="category">([\s\S]*?)<\/ul>/i);
  if (!categoryMatch) {
    return [];
  }

  const items = [];
  const liRegex = /<li>\s*(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?\s*<\/li>/gi;
  for (const match of categoryMatch[1].matchAll(liRegex)) {
    const text = cleanText(match[1], 120);
    if (text) {
      items.push(text);
    }
  }

  return items;
}

function buildMapsSearchUrl(name, district, city, address) {
  const maps = new URL("https://www.google.com/maps/search/");
  maps.searchParams.set("api", "1");
  maps.searchParams.set(
    "query",
    [name, address, district, city]
      .map((value) => cleanText(value, 120))
      .filter(Boolean)
      .join(" "),
  );
  return maps.toString();
}

function parseDutyDate(value) {
  const text = cleanText(value, 140);
  if (!text) {
    return "";
  }

  const match = text.match(/^(\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)/u);
  return match ? cleanText(match[1], 40) : "";
}

function extractRecords(cityHtml) {
  const blocks = cityHtml.split('<div class="company-card">').slice(1);
  const records = [];

  blocks.forEach((block) => {
    const nameMatch = block.match(/<h1 class="title">([\s\S]*?)<\/h1>/i);
    const addressMatch = block.match(/<p><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/p>/i);
    const phoneMatch = block.match(/href="tel:([^"]*)"/i);
    const categoryItems = extractCategoryItems(block);

    const city = cleanText(categoryItems[0] || "", 80);
    const district = cleanText(categoryItems[1] || "", 80);
    const dutyInfo = cleanText(categoryItems[2] || "", 140);
    const dutyDate = parseDutyDate(dutyInfo);
    const name = cleanText(nameMatch && nameMatch[1], 200);
    const address = cleanText(addressMatch && addressMatch[2], 300);
    const phone = cleanText(phoneMatch && phoneMatch[1], 60);

    if (!city || !district || !name) {
      return;
    }

    let mapsUrl = cleanText(addressMatch && addressMatch[1], 500);
    if (!mapsUrl || mapsUrl.endsWith("q=")) {
      mapsUrl = buildMapsSearchUrl(name, district, city, address);
    }

    records.push({
      city,
      district,
      name,
      address,
      phone,
      website: "",
      placeId: "",
      mapsUrl,
      dutyInfo,
      dutyDate,
      source: "nbtecz_nobetci",
    });
  });

  return records;
}

function dedupeRecords(records) {
  const seen = new Set();
  const result = [];

  records.forEach((record) => {
    const key = [
      normalizeKey(record.city),
      normalizeKey(record.district),
      normalizeKey(record.name),
      normalizeKey(record.address),
    ].join("|");

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(record);
  });

  return result.sort((left, right) => {
    const cityOrder = left.city.localeCompare(right.city, "tr");
    if (cityOrder !== 0) {
      return cityOrder;
    }

    const districtOrder = left.district.localeCompare(right.district, "tr");
    if (districtOrder !== 0) {
      return districtOrder;
    }

    return left.name.localeCompare(right.name, "tr");
  });
}

async function backupIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (cleanText(raw, 10).length > 0) {
      await fs.writeFile(BACKUP_PATH, raw, "utf8");
    }
  } catch (_error) {
    // ignore
  }
}

async function main() {
  const rootHtml = await fetchText(ROOT_URL);
  const cityUrls = extractCityUrls(rootHtml);

  if (cityUrls.length === 0) {
    throw new Error("Nobetci sehir URL listesi bulunamadi.");
  }

  const allRecords = [];
  let failed = 0;

  process.stdout.write(`Nobetci sehir sayfasi: ${cityUrls.length}\n`);

  for (let i = 0; i < cityUrls.length; i += 1) {
    const cityUrl = cityUrls[i];
    process.stdout.write(`[${i + 1}/${cityUrls.length}] ${cityUrl}\n`);

    try {
      const html = await fetchText(cityUrl);
      const records = extractRecords(html);
      allRecords.push(...records);
      process.stdout.write(`  + ${records.length} kayit\n`);
    } catch (error) {
      failed += 1;
      process.stderr.write(`  ! ${error.message}\n`);
    }

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const finalRecords = dedupeRecords(allRecords);
  if (finalRecords.length === 0) {
    throw new Error("Hic nobetci eczane kaydi cikmadi.");
  }

  await backupIfExists(OUTPUT_PATH);
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(finalRecords, null, 2)}\n`, "utf8");

  process.stdout.write(`\nToplam ham kayit: ${allRecords.length}\n`);
  process.stdout.write(`Tekil kayit: ${finalRecords.length}\n`);
  process.stdout.write(`Basarisiz sehir: ${failed}\n`);
  process.stdout.write(`Dosya: ${OUTPUT_PATH}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
