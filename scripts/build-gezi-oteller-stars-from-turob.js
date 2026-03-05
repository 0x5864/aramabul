#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "data");
const OUTPUT_ANDROID_DIR = path.join(ROOT, "android_app", "assets", "web", "data");
const REPORT_FILE = path.join(OUTPUT_DIR, "turob-oteller-yildiz-kategori-raporu.json");

const TUROB_BASE_URL = "https://www.turob.com";
const PAGE_SIZE = 12;
const MAX_PAGES = 70;
const DRY_RUN = process.argv.includes("--dry-run");

const STAR_CATEGORIES = [
  { slug: "5-yildizli-oteller", stars: 5, outputFile: "gezi-oteller-5-yildiz.json", title: "5 Yıldızlı Oteller" },
  { slug: "4-yildizli-oteller", stars: 4, outputFile: "gezi-oteller-4-yildiz.json", title: "4 Yıldızlı Oteller" },
  { slug: "3-yildizli-oteller", stars: 3, outputFile: "gezi-oteller-3-yildiz.json", title: "3 Yıldızlı Oteller" },
  { slug: "2-yildizli-oteller", stars: 2, outputFile: "gezi-oteller-2-yildiz.json", title: "2 Yıldızlı Oteller" },
  { slug: "1-yildizli-oteller", stars: 1, outputFile: "gezi-oteller-1-yildiz.json", title: "1 Yıldızlı Oteller" },
];

const PLATE_TO_CITY = {
  "01": "Adana",
  "02": "Adıyaman",
  "03": "Afyonkarahisar",
  "04": "Ağrı",
  "05": "Amasya",
  "06": "Ankara",
  "07": "Antalya",
  "08": "Artvin",
  "09": "Aydın",
  "10": "Balıkesir",
  "11": "Bilecik",
  "12": "Bingöl",
  "13": "Bitlis",
  "14": "Bolu",
  "15": "Burdur",
  "16": "Bursa",
  "17": "Çanakkale",
  "18": "Çankırı",
  "19": "Çorum",
  "20": "Denizli",
  "21": "Diyarbakır",
  "22": "Edirne",
  "23": "Elazığ",
  "24": "Erzincan",
  "25": "Erzurum",
  "26": "Eskişehir",
  "27": "Gaziantep",
  "28": "Giresun",
  "29": "Gümüşhane",
  "30": "Hakkari",
  "31": "Hatay",
  "32": "Isparta",
  "33": "Mersin",
  "34": "İstanbul",
  "35": "İzmir",
  "36": "Kars",
  "37": "Kastamonu",
  "38": "Kayseri",
  "39": "Kırklareli",
  "40": "Kırşehir",
  "41": "Kocaeli",
  "42": "Konya",
  "43": "Kütahya",
  "44": "Malatya",
  "45": "Manisa",
  "46": "Kahramanmaraş",
  "47": "Mardin",
  "48": "Muğla",
  "49": "Muş",
  "50": "Nevşehir",
  "51": "Niğde",
  "52": "Ordu",
  "53": "Rize",
  "54": "Sakarya",
  "55": "Samsun",
  "56": "Siirt",
  "57": "Sinop",
  "58": "Sivas",
  "59": "Tekirdağ",
  "60": "Tokat",
  "61": "Trabzon",
  "62": "Tunceli",
  "63": "Şanlıurfa",
  "64": "Uşak",
  "65": "Van",
  "66": "Yozgat",
  "67": "Zonguldak",
  "68": "Aksaray",
  "69": "Bayburt",
  "70": "Karaman",
  "71": "Kırıkkale",
  "72": "Batman",
  "73": "Şırnak",
  "74": "Bartın",
  "75": "Ardahan",
  "76": "Iğdır",
  "77": "Yalova",
  "78": "Karabük",
  "79": "Kilis",
  "80": "Osmaniye",
  "81": "Düzce",
};

const TURKISH_CHAR_MAP = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  I: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

function normalizeForMatch(input) {
  return String(input || "")
    .replace(/[ÇĞİIÖŞÜçğıöşü]/g, (char) => TURKISH_CHAR_MAP[char] || char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(input) {
  if (!input) return "";
  const namedEntities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    raquo: "»",
    laquo: "«",
  };

  return String(input)
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, body) => {
      if (body.startsWith("#")) {
        const isHex = body[1]?.toLowerCase() === "x";
        const num = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
        return Number.isNaN(num) ? full : String.fromCodePoint(num);
      }
      const mapped = namedEntities[body.toLowerCase()];
      return mapped ?? full;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeText(input) {
  return decodeHtmlEntities(String(input || "").replace(/<[^>]*>/g, " ")).trim();
}

function extractCityFromPlate(plateCode) {
  return PLATE_TO_CITY[String(plateCode || "").padStart(2, "0")] || "";
}

function extractDistrict(addressText, cityName) {
  const parts = String(addressText || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "Merkez";
  }

  let candidate = parts[parts.length - 1];
  if (cityName && normalizeForMatch(candidate) === normalizeForMatch(cityName) && parts.length >= 2) {
    candidate = parts[parts.length - 2];
  }

  candidate = candidate.replace(/[.,;:]+$/g, "").trim();
  return candidate || "Merkez";
}

function parsePostalCode(addressText) {
  const match = String(addressText || "").match(/(?:^|\D)(\d{5})(?:\D|$)/);
  return match ? match[1] : "";
}

function parseNeighborhood(addressText) {
  const normalized = String(addressText || "").replace(/\s+/g, " ").trim();
  const match = normalized.match(
    /([A-Za-zÇĞİÖŞÜçğıöşü0-9.'\-\s]+(?:Mahallesi|Mah\.|Mah))/i,
  );
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function extractModalHtmlById(pageHtml, modalId) {
  const marker = `<div class="modal fade" id="${modalId}"`;
  const startIndex = pageHtml.indexOf(marker);
  if (startIndex < 0) {
    return "";
  }

  const nextIndex = pageHtml.indexOf('<div class="modal fade" id="', startIndex + marker.length);
  const endIndex = nextIndex > startIndex ? nextIndex : pageHtml.length;
  return pageHtml.slice(startIndex, endIndex);
}

function extractFromModal(modalHtml) {
  const titleMatch = modalHtml.match(/<h2[^>]*class="modal-title"[^>]*>([\s\S]*?)<\/h2>/i);
  const locationMatch = modalHtml.match(/LocationIcon\.png[^>]*>\s*([\s\S]*?)<\/p>/i);
  const phoneMatch = modalHtml.match(/PhoneIcon\.png[^>]*>\s*(?:<a[^>]*>)?([^<]+)(?:<\/a>)?/i);
  const webMatch = modalHtml.match(/WebIcon\.png[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/i);
  const mapMatch = modalHtml.match(/<iframe[^>]*src="([^"]+)"/i);

  return {
    name: titleMatch ? sanitizeText(titleMatch[1]) : "",
    address: locationMatch ? sanitizeText(locationMatch[1]) : "",
    phone: phoneMatch ? sanitizeText(phoneMatch[1]) : "",
    website: webMatch ? sanitizeText(webMatch[1]) : "",
    mapsUrl: mapMatch ? sanitizeText(mapMatch[1]) : "",
  };
}

function parseHotelCards(html) {
  const cards = [];
  const cardRegex =
    /<li[^>]*class="[^"]*\bcountry-(\d{2})\b[^"]*"[\s\S]*?<a[^>]*data-target="#([^"]+)"[\s\S]*?<div class="Title">\s*<p>([\s\S]*?)<\/p>/gi;
  let match = cardRegex.exec(html);

  while (match) {
    const plateCode = match[1];
    const modalId = sanitizeText(match[2]);
    const cardName = sanitizeText(match[3]);
    if (modalId) {
      cards.push({ plateCode, modalId, cardName });
    }
    match = cardRegex.exec(html);
  }

  return cards;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
      referer: TUROB_BASE_URL,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function dedupeRecords(records) {
  const map = new Map();
  for (const record of records) {
    const key = `${normalizeForMatch(record.name)}|${normalizeForMatch(record.city)}|${normalizeForMatch(record.district)}`;
    if (!key || key === "||") {
      continue;
    }
    const current = map.get(key);
    if (!current) {
      map.set(key, record);
      continue;
    }
    const currentScore = Number(Boolean(current.phone)) + Number(Boolean(current.website)) + Number(Boolean(current.address));
    const nextScore = Number(Boolean(record.phone)) + Number(Boolean(record.website)) + Number(Boolean(record.address));
    if (nextScore > currentScore) {
      map.set(key, record);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

async function buildCategoryHotels(category) {
  const all = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const start = page * PAGE_SIZE;
    const url =
      start === 0
        ? `${TUROB_BASE_URL}/tr/uyelerimiz/category/${category.slug}`
        : `${TUROB_BASE_URL}/tr/uyelerimiz/category/${category.slug}?start=${start}`;

    const html = await fetchHtml(url);
    const cards = parseHotelCards(html);

    if (!cards.length) {
      break;
    }

    for (const card of cards) {
      const modal = extractFromModal(extractModalHtmlById(html, card.modalId));

      const city = extractCityFromPlate(card.plateCode);
      const address = modal.address || "";
      const district = extractDistrict(address, city);
      const postalCode = parsePostalCode(address);
      const neighborhood = parseNeighborhood(address);

      all.push({
        city: city || "İstanbul",
        district: district || "Merkez",
        name: modal.name || card.cardName,
        cuisine: "Otel",
        address,
        neighborhood,
        postalCode,
        mapsUrl: modal.mapsUrl,
        website: modal.website,
        phone: modal.phone,
        photoUrl: "",
        editorialSummary: "",
        sourcePlaceId: "",
        source: "turob",
        stars: category.stars,
      });
    }
  }

  return dedupeRecords(all);
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function run() {
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    categories: [],
  };

  for (const category of STAR_CATEGORIES) {
    console.log(`${category.title} cekiliyor...`);
    const hotels = await buildCategoryHotels(category);
    report.categories.push({
      slug: category.slug,
      stars: category.stars,
      count: hotels.length,
      outputFile: category.outputFile,
    });
    console.log(`- ${category.title}: ${hotels.length} kayit`);

    if (!DRY_RUN) {
      writeJson(path.join(OUTPUT_DIR, category.outputFile), hotels);
      writeJson(path.join(OUTPUT_ANDROID_DIR, category.outputFile), hotels);
    }
  }

  if (!DRY_RUN) {
    writeJson(REPORT_FILE, report);
  }

  console.log("Tamamlandi.");
  if (!DRY_RUN) {
    console.log(`Rapor: ${REPORT_FILE}`);
  }
}

run().catch((error) => {
  console.error(`Hata: ${error.message}`);
  process.exitCode = 1;
});
