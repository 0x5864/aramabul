#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "gezi-oteller.json");
const ANDROID_DATA_FILE = path.join(
  ROOT,
  "android_app",
  "assets",
  "web",
  "data",
  "gezi-oteller.json",
);
const TUROB_CACHE_FILE = path.join(ROOT, "data", "turob-oteller-yildizli.json");
const REPORT_FILE = path.join(ROOT, "data", "gezi-oteller-temizlik-raporu.json");

const TUROB_BASE_URL = "https://www.turob.com";
const TUROB_PAGE_SIZE = 12;
const MAX_PAGES_PER_CATEGORY = 60;
const DRY_RUN = process.argv.includes("--dry-run");

const TUROB_STAR_CATEGORIES = [
  { slug: "5-yildizli-oteller", stars: 5 },
  { slug: "4-yildizli-oteller", stars: 4 },
  { slug: "3-yildizli-oteller", stars: 3 },
  { slug: "2-yildizli-oteller", stars: 2 },
  { slug: "1-yildizli-oteller", stars: 1 },
];

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

const HOTEL_NAME_SIGNAL_TOKENS = new Set([
  "otel",
  "hotel",
  "resort",
  "motel",
  "hostel",
  "pansiyon",
  "pension",
  "konukevi",
  "guesthouse",
  "guest",
  "inn",
  "apart",
  "aparthotel",
  "apartotel",
  "suite",
  "suites",
  "residence",
  "residences",
  "living",
  "bungalov",
  "bungalow",
  "glamping",
  "termal",
  "tatilkoyu",
  "cavehotel",
  "konaklama",
]);

const NON_HOTEL_NAME_TOKENS = new Set([
  "pub",
  "bar",
  "meyhane",
  "cafe",
  "kafe",
  "restaurant",
  "restoran",
  "lokanta",
  "kebap",
  "doner",
  "donerci",
  "pide",
  "lahmacun",
  "kokorec",
  "balikci",
  "pastane",
  "firin",
  "kahve",
  "kahvalti",
  "bistro",
  "nargile",
  "taverna",
  "ocakbasi",
  "steakhouse",
  "gecekulubu",
  "kulup",
  "club",
]);

const NON_HOTEL_NAME_PREFIXES = [
  "restoran",
  "restaurant",
  "lokanta",
  "kafe",
  "cafe",
  "kebap",
  "doner",
  "pide",
  "lahmacun",
  "pastane",
  "bufe",
  "tekel",
  "bayi",
  "bayii",
  "barbecue",
  "bbq",
  "public",
  "taverna",
];

const STRONG_NON_HOTEL_CUISINE_TOKENS = new Set([
  "pub",
  "bar",
  "meyhane",
  "kafe",
  "cafe",
  "bistro",
  "gecekulubu",
  "kulup",
  "club",
  "kebap",
  "pide",
  "doner",
  "lokanta",
  "pastane",
]);

const TUROB_SIGNATURE_IGNORED_TOKENS = new Set([
  "the",
  "by",
  "hotel",
  "otel",
  "hotels",
  "otelleri",
  "resort",
  "residence",
  "residences",
  "suite",
  "suites",
  "spa",
  "and",
  "otelcilik",
  "turizm",
]);

function decodeHtmlEntities(input) {
  if (!input) {
    return "";
  }

  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return input
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entityBody) => {
      if (entityBody[0] === "#") {
        const isHex = entityBody[1]?.toLowerCase() === "x";
        const numberText = isHex ? entityBody.slice(2) : entityBody.slice(1);
        const radix = isHex ? 16 : 10;
        const codePoint = Number.parseInt(numberText, radix);
        if (!Number.isNaN(codePoint)) {
          return String.fromCodePoint(codePoint);
        }
        return match;
      }
      const lowered = entityBody.toLowerCase();
      return Object.prototype.hasOwnProperty.call(named, lowered) ? named[lowered] : match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

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

function tokenize(input) {
  return normalizeForMatch(input).split(" ").filter(Boolean);
}

function hasHotelKeywordPattern(input) {
  const normalized = normalizeForMatch(input);
  if (!normalized) {
    return false;
  }
  return /\b(otel\w*|hotel\w*|resort\w*|hostel\w*|pansiyon\w*|motel\w*|aparthotel\w*|apartotel\w*|bungalov\w*|bungalow\w*|konukevi\w*|konaklama\w*|residence\w*|suite\w*|living\w*|termal\w*)\b/.test(
    normalized,
  );
}

function hasAnyToken(tokens, tokenSet) {
  return tokens.some((token) => tokenSet.has(token));
}

function hasAnyPrefixToken(tokens, prefixes) {
  return tokens.some((token) => prefixes.some((prefix) => token.startsWith(prefix)));
}

function buildNameSignature(input) {
  const tokens = tokenize(input).filter((token) => !TUROB_SIGNATURE_IGNORED_TOKENS.has(token));
  if (!tokens.length) {
    return "";
  }
  const uniqueSorted = [...new Set(tokens)].sort();
  return uniqueSorted.join(" ");
}

function buildVenueScore(venue) {
  let score = 0;
  if (String(venue.sourcePlaceId || "").trim()) score += 4;
  if (String(venue.phone || "").trim()) score += 3;
  if (String(venue.website || "").trim()) score += 3;
  if (String(venue.postalCode || "").trim()) score += 2;
  if (String(venue.neighborhood || "").trim()) score += 1;
  score += Math.min(String(venue.address || "").trim().length / 50, 3);
  return score;
}

function parseTurobHotelNames(html) {
  const nameSet = new Set();
  const modalTitleRegex = /<h2[^>]*class="modal-title"[^>]*>([\s\S]*?)<\/h2>/gi;
  let match = modalTitleRegex.exec(html);
  while (match) {
    const rawName = decodeHtmlEntities(match[1].replace(/<[^>]+>/g, " "));
    if (rawName) {
      nameSet.add(rawName);
    }
    match = modalTitleRegex.exec(html);
  }
  return [...nameSet];
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
    throw new Error(`HTTP ${response.status} on ${url}`);
  }
  return response.text();
}

async function fetchTurobStarHotels() {
  const records = [];
  const recordKeySet = new Set();
  const categoryStats = [];

  for (const category of TUROB_STAR_CATEGORIES) {
    let pageCount = 0;
    let fetchedInCategory = 0;

    for (let page = 0; page < MAX_PAGES_PER_CATEGORY; page += 1) {
      const start = page * TUROB_PAGE_SIZE;
      const url =
        start === 0
          ? `${TUROB_BASE_URL}/tr/uyelerimiz/category/${category.slug}`
          : `${TUROB_BASE_URL}/tr/uyelerimiz/category/${category.slug}?start=${start}`;

      const html = await fetchHtml(url);
      const pageNames = parseTurobHotelNames(html);
      pageCount += 1;

      if (!pageNames.length) {
        break;
      }

      fetchedInCategory += pageNames.length;
      for (const name of pageNames) {
        const normalizedName = normalizeForMatch(name);
        const key = `${category.stars}|${normalizedName}`;
        if (recordKeySet.has(key)) {
          continue;
        }
        recordKeySet.add(key);
        records.push({
          name,
          stars: category.stars,
          categorySlug: category.slug,
          sourceUrl: url,
        });
      }
    }

    categoryStats.push({
      categorySlug: category.slug,
      stars: category.stars,
      pagesFetched: pageCount,
      rawItems: fetchedInCategory,
    });
  }

  return { records, categoryStats };
}

function buildTurobMatchSets(turobRecords) {
  const exactSet = new Set();
  const signatureSet = new Set();

  for (const record of turobRecords) {
    const exact = normalizeForMatch(record.name);
    if (exact) {
      exactSet.add(exact);
    }
    const signature = buildNameSignature(record.name);
    if (signature && signature.split(" ").length >= 2) {
      signatureSet.add(signature);
    }
  }

  return { exactSet, signatureSet };
}

function isTurobMatched(venueName, turobSets) {
  const exact = normalizeForMatch(venueName);
  if (exact && turobSets.exactSet.has(exact)) {
    return true;
  }

  const signature = buildNameSignature(venueName);
  return Boolean(signature && signature.split(" ").length >= 2 && turobSets.signatureSet.has(signature));
}

function shouldRemoveAsNonHotel(venue, matchedTurob) {
  if (!venue || typeof venue !== "object") {
    return false;
  }
  if (matchedTurob) {
    return false;
  }

  const name = String(venue.name || "");
  const address = String(venue.address || "");
  const website = String(venue.website || "");
  const summary = String(venue.editorialSummary || "");
  const cuisine = String(venue.cuisine || "");

  const nameTokens = tokenize(name);
  const allContextTokens = tokenize([name, address, website, summary].join(" "));
  const cuisineTokens = tokenize(cuisine);

  const hasNameHotelSignal =
    hasAnyToken(nameTokens, HOTEL_NAME_SIGNAL_TOKENS) || hasHotelKeywordPattern(name);
  if (hasNameHotelSignal) {
    return false;
  }

  const hasContextHotelSignal =
    hasAnyToken(allContextTokens, HOTEL_NAME_SIGNAL_TOKENS) ||
    hasHotelKeywordPattern([name, address, website, summary].join(" "));
  const hasNonHotelNameSignal =
    hasAnyToken(nameTokens, NON_HOTEL_NAME_TOKENS) ||
    hasAnyPrefixToken(nameTokens, NON_HOTEL_NAME_PREFIXES);
  const hasStrongNonHotelCuisineSignal = hasAnyToken(cuisineTokens, STRONG_NON_HOTEL_CUISINE_TOKENS);

  if (hasNonHotelNameSignal) {
    return true;
  }

  if (hasStrongNonHotelCuisineSignal && !hasContextHotelSignal) {
    return true;
  }

  return false;
}

function dedupeVenues(venues) {
  const byPlaceId = new Map();
  const byLocationName = new Map();

  function keepBetter(map, key, candidate) {
    if (!key) {
      return;
    }
    const current = map.get(key);
    if (!current) {
      map.set(key, candidate);
      return;
    }

    const currentScore = buildVenueScore(current);
    const candidateScore = buildVenueScore(candidate);
    if (candidateScore > currentScore) {
      map.set(key, candidate);
    }
  }

  for (const venue of venues) {
    const placeIdKey = normalizeForMatch(venue?.sourcePlaceId || "");
    if (placeIdKey) {
      keepBetter(byPlaceId, placeIdKey, venue);
      continue;
    }

    const fallbackKey = [
      normalizeForMatch(venue?.name || ""),
      normalizeForMatch(venue?.city || ""),
      normalizeForMatch(venue?.district || ""),
    ]
      .filter(Boolean)
      .join("|");
    keepBetter(byLocationName, fallbackKey, venue);
  }

  return [...byPlaceId.values(), ...byLocationName.values()];
}

function readJsonArray(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} dizi formatinda degil.`);
  }
  return parsed;
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function run() {
  console.log("TUROB yildizli otel listeleri cekiliyor...");
  const { records: turobRecords, categoryStats } = await fetchTurobStarHotels();
  const turobSets = buildTurobMatchSets(turobRecords);

  console.log(`TUROB toplam kayit: ${turobRecords.length}`);
  for (const stat of categoryStats) {
    console.log(
      `- ${stat.stars} yildiz (${stat.categorySlug}): ${stat.rawItems} kayit, ${stat.pagesFetched} sayfa`,
    );
  }

  const sourceVenues = readJsonArray(DATA_FILE);
  const beforeTotal = sourceVenues.length;
  const removedNonHotel = [];
  let turobOverlapCount = 0;

  const filtered = sourceVenues.filter((venue) => {
    const matchedTurob = isTurobMatched(String(venue?.name || ""), turobSets);
    if (matchedTurob) {
      turobOverlapCount += 1;
    }
    const remove = shouldRemoveAsNonHotel(venue, matchedTurob);
    if (remove) {
      removedNonHotel.push({
        name: String(venue?.name || ""),
        city: String(venue?.city || ""),
        district: String(venue?.district || ""),
        cuisine: String(venue?.cuisine || ""),
      });
      return false;
    }
    return true;
  });

  const afterFilterTotal = filtered.length;
  const deduped = dedupeVenues(filtered);
  const finalTotal = deduped.length;
  const duplicateRemoved = afterFilterTotal - finalTotal;

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    turob: {
      totalRecords: turobRecords.length,
      categoryStats,
    },
    geziOteller: {
      beforeTotal,
      removedNonHotelCount: removedNonHotel.length,
      removedDuplicateCount: duplicateRemoved,
      afterTotal: finalTotal,
      matchedWithTurobCount: turobOverlapCount,
      removedNonHotelSamples: removedNonHotel.slice(0, 150),
    },
  };

  console.log(`Mevcut kayit: ${beforeTotal}`);
  console.log(`Otel-disi temizlenen: ${removedNonHotel.length}`);
  console.log(`Mukerrer temizlenen: ${duplicateRemoved}`);
  console.log(`Kalan kayit: ${finalTotal}`);
  console.log(`TUROB ad eslesen kayit: ${turobOverlapCount}`);

  if (DRY_RUN) {
    console.log("Dry-run tamamlandi. Dosya yazilmadi.");
    return;
  }

  writeJsonFile(TUROB_CACHE_FILE, turobRecords);
  writeJsonFile(DATA_FILE, deduped);
  writeJsonFile(ANDROID_DATA_FILE, deduped);
  writeJsonFile(REPORT_FILE, report);

  console.log(`Yazildi: ${TUROB_CACHE_FILE}`);
  console.log(`Yazildi: ${DATA_FILE}`);
  console.log(`Yazildi: ${ANDROID_DATA_FILE}`);
  console.log(`Yazildi: ${REPORT_FILE}`);
}

run().catch((error) => {
  console.error(`Hata: ${error.message}`);
  process.exitCode = 1;
});
