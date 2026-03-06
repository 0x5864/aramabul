#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_HTML = process.argv[2] || "/tmp/tr_muzeler_listesi.html";
const SOURCE_URL = "https://tr.wikipedia.org/wiki/T%C3%BCrkiye%27deki_m%C3%BCzeler_listesi";
const DISTRICTS_FILE = path.join(ROOT, "data", "districts.json");
const OUTPUT_WEB = path.join(ROOT, "data", "kultur-muzeler.json");
const OUTPUT_ANDROID = path.join(ROOT, "android_app", "assets", "web", "data", "kultur-muzeler.json");

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

function normalizeText(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
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

function loadDistrictMap() {
  if (!fs.existsSync(DISTRICTS_FILE)) {
    return {};
  }

  try {
    const payload = JSON.parse(fs.readFileSync(DISTRICTS_FILE, "utf8"));
    return payload && typeof payload === "object" ? payload : {};
  } catch {
    return {};
  }
}

function inferDistrict(city, museumName, museumWebsite, districtMap) {
  const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
  if (districts.length === 0) {
    return "Merkez";
  }

  const haystack = normalizeForKey(`${museumName} ${museumWebsite}`);
  if (!haystack) {
    return "Merkez";
  }

  const orderedDistricts = [...new Set(
    districts
      .map((value) => normalizeText(value))
      .filter(Boolean)
  )].sort((left, right) => right.length - left.length);

  for (const district of orderedDistricts) {
    const token = normalizeForKey(district);
    if (!token || token.length < 2) {
      continue;
    }
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i");
    if (pattern.test(haystack)) {
      return district;
    }
  }

  return "Merkez";
}

function extractMuseumSection(html) {
  const start = html.indexOf('id="İllere_göre_müzeler"');
  if (start < 0) {
    throw new Error("İllere_göre_müzeler bölümü bulunamadı.");
  }

  const endCandidates = [
    html.indexOf('<div class="mw-heading mw-heading2"><h2 id="Ayrıca_bakınız"', start),
    html.indexOf('<div class="mw-heading mw-heading2"><h2 id="Kaynakça"', start),
    html.indexOf('<div class="mw-heading mw-heading2"><h2 id="Notlar"', start),
  ].filter((index) => index > start);

  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : html.length;
  return html.slice(start, end);
}

function extractCityBlocks(sectionHtml) {
  const blocks = [];
  const headingRegex = /<div class="mw-heading mw-heading3"><h3 id="[^"]+">([\s\S]*?)<\/h3>[\s\S]*?(?=<div class="mw-heading mw-heading3"><h3 id="[^"]+"|$)/g;

  let match;
  while ((match = headingRegex.exec(sectionHtml)) !== null) {
    const city = normalizeText(
      String(match[1] || "")
        .replace(/<[^>]+>/g, " ")
    );
    const html = match[0];
    if (!city) {
      continue;
    }
    blocks.push({ city, html });
  }

  return blocks;
}

function parseMuseumsFromBlock(blockHtml) {
  const items = [];
  const liRegex = /<li>([\s\S]*?)<\/li>/g;

  let match;
  while ((match = liRegex.exec(blockHtml)) !== null) {
    const liHtml = match[1];
    const firstLink = liHtml.match(/<a [^>]*href="([^"]+)"[^>]*>/);
    const cleaned = normalizeText(
      liHtml
        .replace(/<sup[\s\S]*?<\/sup>/g, " ")
        .replace(/<style[\s\S]*?<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\[\d+\]/g, " ")
    );

    if (!cleaned) {
      continue;
    }

    let website = "";
    if (firstLink && firstLink[1]) {
      website = firstLink[1].startsWith("/")
        ? `https://tr.wikipedia.org${firstLink[1]}`
        : firstLink[1];
    }

    items.push({
      name: cleaned,
      website: normalizeText(website),
    });
  }

  return items;
}

function buildMuseumsDataset(html) {
  const section = extractMuseumSection(html);
  const cityBlocks = extractCityBlocks(section);
  const districtMap = loadDistrictMap();
  const rows = [];
  const dedupe = new Set();

  cityBlocks.forEach(({ city, html: cityHtml }) => {
    const museums = parseMuseumsFromBlock(cityHtml);
    museums.forEach((museum) => {
      const key = `${normalizeForKey(city)}|${normalizeForKey(museum.name)}`;
      if (!museum.name || dedupe.has(key)) {
        return;
      }
      dedupe.add(key);

      rows.push({
        city,
        district: inferDistrict(city, museum.name, museum.website, districtMap),
        name: museum.name,
        cuisine: "Müzeler",
        address: "",
        neighborhood: "",
        postalCode: "",
        mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${museum.name} ${city}`)}`,
        website: museum.website,
        phone: "",
        photoUrl: "",
        editorialSummary: "Kaynak: Türkiye'deki müzeler listesi (Vikipedi).",
        sourcePlaceId: "",
      });
    });
  });

  const withAddress = rows.map((item) => ({
    ...item,
    address: item.district && item.district !== "Merkez"
      ? `${item.district}, ${item.city}, Türkiye`
      : `${item.city}, Türkiye`,
  }));

  return withAddress.sort((left, right) => {
    const cityCompare = left.city.localeCompare(right.city, "tr");
    if (cityCompare !== 0) return cityCompare;
    return left.name.localeCompare(right.name, "tr");
  });
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function main() {
  if (!fs.existsSync(SOURCE_HTML)) {
    throw new Error(`Kaynak HTML bulunamadı: ${SOURCE_HTML}`);
  }

  const html = fs.readFileSync(SOURCE_HTML, "utf8");
  const rows = buildMuseumsDataset(html);
  writeJson(OUTPUT_WEB, rows);
  writeJson(OUTPUT_ANDROID, rows);

  const cityCount = new Set(rows.map((row) => row.city)).size;
  process.stdout.write(`[import-kultur-muzeler] kaynak: ${SOURCE_URL}\n`);
  process.stdout.write(`[import-kultur-muzeler] satır: ${rows.length}, il: ${cityCount}\n`);
  process.stdout.write(`[import-kultur-muzeler] çıktı: ${OUTPUT_WEB}\n`);
  process.stdout.write(`[import-kultur-muzeler] android: ${OUTPUT_ANDROID}\n`);
}

main();
