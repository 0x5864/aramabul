"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];
const DEFAULT_SLEEP_MS = 1200;
const REQUEST_TIMEOUT_MS = 45000;

function cleanText(value, maxLength = 240) {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return "";
  }

  return cleaned.slice(0, maxLength);
}

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

function includesNormalized(haystack, needle) {
  const left = normalizeText(haystack);
  const right = normalizeText(needle);
  return Boolean(left && right && left.includes(right));
}

function parseArgs(argv) {
  const args = {
    category: "",
    districtLimit: 0,
    city: "",
    district: "",
    fromCity: "",
    resume: false,
    checkpointEvery: 25,
    sleepMs: DEFAULT_SLEEP_MS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--category") {
      args.category = cleanText(argv[i + 1] || "", 40).toLocaleLowerCase("tr");
      i += 1;
      continue;
    }

    if (token === "--district-limit") {
      const value = Number(argv[i + 1]);
      args.districtLimit = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      i += 1;
      continue;
    }

    if (token === "--city") {
      args.city = cleanText(argv[i + 1] || "", 80);
      i += 1;
      continue;
    }

    if (token === "--district") {
      args.district = cleanText(argv[i + 1] || "", 80);
      i += 1;
      continue;
    }

    if (token === "--from-city") {
      args.fromCity = cleanText(argv[i + 1] || "", 80);
      i += 1;
      continue;
    }

    if (token === "--resume") {
      args.resume = true;
      continue;
    }

    if (token === "--checkpoint-every") {
      const value = Number(argv[i + 1]);
      args.checkpointEvery = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 25;
      i += 1;
      continue;
    }

    if (token === "--sleep-ms") {
      const value = Number(argv[i + 1]);
      args.sleepMs = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : DEFAULT_SLEEP_MS;
      i += 1;
    }
  }

  return args;
}

function categorySelectors(category) {
  if (category === "kuafor") {
    return [
      ["shop", "hairdresser"],
      ["craft", "hairdresser"],
      ["shop", "barber"],
      ["craft", "barber"],
    ];
  }

  if (category === "veteriner") {
    return [
      ["amenity", "veterinary"],
      ["healthcare", "veterinary"],
    ];
  }

  if (category === "akaryakit") {
    return [
      ["amenity", "fuel"],
    ];
  }

  if (category === "eczane") {
    return [
      ["amenity", "pharmacy"],
      ["healthcare", "pharmacy"],
      ["shop", "chemist"],
    ];
  }

  if (category === "atm") {
    return [
      ["amenity", "atm"],
    ];
  }

  if (category === "kargo") {
    return [
      ["amenity", "post_office"],
      ["office", "courier"],
    ];
  }

  if (category === "noter") {
    return [
      ["office", "notary"],
    ];
  }

  if (category === "asm") {
    return [
      ["amenity", "clinic"],
      ["healthcare", "clinic"],
      ["healthcare", "centre"],
      ["healthcare", "doctor"],
    ];
  }

  if (category === "dis-klinikleri") {
    return [
      ["amenity", "dentist"],
      ["healthcare", "dentist"],
    ];
  }

  if (category === "duraklar") {
    return [
      ["highway", "bus_stop"],
      ["public_transport", "platform"],
      ["railway", "tram_stop"],
      ["railway", "station"],
    ];
  }

  if (category === "otopark") {
    return [
      ["amenity", "parking"],
      ["amenity", "parking_entrance"],
      ["amenity", "parking_space"],
    ];
  }

  return [];
}

function outputPathForCategory(category) {
  return path.resolve(__dirname, `../data/${category}.json`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(headerValue) {
  const raw = cleanText(headerValue || "", 60);
  if (!raw) {
    return 0;
  }

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber >= 0) {
    return Math.floor(asNumber * 1000);
  }

  const asDate = Date.parse(raw);
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - Date.now());
  }

  return 0;
}

function isRetryableStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function loadDistrictMap() {
  const raw = await fs.readFile(path.resolve(__dirname, "../data/districts.json"), "utf8");
  const payload = JSON.parse(raw);

  if (!payload || typeof payload !== "object") {
    return {};
  }

  return payload;
}

function selectBestGeocodeCandidate(items, city, district) {
  const cityKey = normalizeText(city);
  const districtKey = normalizeText(district);

  const scored = items
    .map((item) => {
      const display = cleanText(item.display_name || "", 400);
      const itemType = cleanText(item.type || "", 80);
      const address = item.address && typeof item.address === "object" ? item.address : {};
      const bag = [
        display,
        cleanText(address.city || "", 120),
        cleanText(address.town || "", 120),
        cleanText(address.county || "", 120),
        cleanText(address.state || "", 120),
        cleanText(address.state_district || "", 120),
        cleanText(address.suburb || "", 120),
      ]
        .filter(Boolean)
        .join(" ");

      let score = 0;
      if (includesNormalized(bag, districtKey)) {
        score += 3;
      }
      if (includesNormalized(bag, cityKey)) {
        score += 2;
      }

      const normalizedType = normalizeText(itemType);
      if (normalizedType === "administrative") {
        score += 6;
      } else if (normalizedType === "county" || normalizedType === "district" || normalizedType === "municipality") {
        score += 4;
      } else if (normalizedType === "park" || normalizedType === "attraction") {
        score -= 4;
      }

      const bbox = Array.isArray(item.boundingbox) && item.boundingbox.length === 4
        ? item.boundingbox.map((value) => Number(value))
        : [];
      const bboxArea = bbox.every(Number.isFinite)
        ? Math.abs((bbox[1] - bbox[0]) * (bbox[3] - bbox[2]))
        : 0;

      return {
        item,
        score,
        bboxArea,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.bboxArea - a.bboxArea;
    });

  return scored.length > 0 ? scored[0].item : null;
}

async function geocodeDistrictBounds(city, district) {
  const searchQueries = [
    `${district} ilçesi, ${city}, Turkiye`,
    `${district}, ${city}, Turkiye`,
  ];
  const candidates = [];

  for (const searchQuery of searchQueries) {
    const url = new URL(NOMINATIM_ENDPOINT);
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "10");

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "arama-bul/1.0",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`nominatim_error_${response.status}: ${detail.slice(0, 120)}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload) && payload.length > 0) {
      payload.forEach((item) => candidates.push(item));
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const best = selectBestGeocodeCandidate(candidates, city, district);
  if (!best || !Array.isArray(best.boundingbox) || best.boundingbox.length !== 4) {
    return null;
  }

  const south = Number(best.boundingbox[0]);
  const north = Number(best.boundingbox[1]);
  const west = Number(best.boundingbox[2]);
  const east = Number(best.boundingbox[3]);

  if (![south, north, west, east].every(Number.isFinite)) {
    return null;
  }

  return { south, north, west, east };
}

function buildOverpassQuery(bounds, selectors, category) {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const parts = [];

  selectors.forEach(([key, value]) => {
    const selector = `["${key}"="${value}"]`;
    parts.push(`node${selector}(${bbox});`);
    parts.push(`way${selector}(${bbox});`);
    parts.push(`relation${selector}(${bbox});`);
  });

  if (category === "kuafor") {
    const freeTextRegex = "(kuaf[oö]r|berber|hair|barber)";
    const freeTextKeys = ["name", "brand", "operator"];

    freeTextKeys.forEach((key) => {
      const selector = `["${key}"~"${freeTextRegex}",i]`;
      parts.push(`node${selector}(${bbox});`);
      parts.push(`way${selector}(${bbox});`);
      parts.push(`relation${selector}(${bbox});`);
    });
  }

  return [
    "[out:json][timeout:45];",
    "(",
    ...parts,
    ");",
    "out center tags;",
  ].join("\n");
}

async function fetchOverpassElements(query) {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let response;
        try {
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              Accept: "application/json",
              "User-Agent": "arama-bul/1.0",
            },
            body: query,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutHandle);
        }

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          if (isRetryableStatus(response.status)) {
            const retryHeader = parseRetryAfterMs(response.headers.get("Retry-After"));
            const backoffMs = Math.min(15000, 1000 * 2 ** attempt);
            const waitMs = Math.max(retryHeader, backoffMs);
            await delay(waitMs);
            lastError = new Error(`overpass_error_${response.status}: ${detail.slice(0, 120)}`);
            continue;
          }

          throw new Error(`overpass_error_${response.status}: ${detail.slice(0, 120)}`);
        }

        const payload = await response.json();
        return Array.isArray(payload.elements) ? payload.elements : [];
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === 4;
        if (!isLastAttempt) {
          const waitMs = Math.min(15000, 1000 * 2 ** attempt);
          await delay(waitMs);
          continue;
        }
      }
    }
  }

  throw lastError || new Error("overpass_fetch_failed");
}

function formatAddressFromTags(tags) {
  if (!tags || typeof tags !== "object") {
    return "";
  }

  const chunks = [
    cleanText(tags["addr:street"] || "", 120),
    cleanText(tags["addr:housenumber"] || "", 30),
    cleanText(tags["addr:suburb"] || tags["addr:quarter"] || "", 80),
    cleanText(tags["addr:city"] || tags["addr:town"] || "", 80),
  ].filter(Boolean);

  return chunks.join(", ");
}

function mapOverpassElement(element, city, district, options = {}) {
  const requireDistrictTextMatch = options.requireDistrictTextMatch !== false;
  const tags = element && element.tags && typeof element.tags === "object" ? element.tags : {};
  const name = cleanText(tags.name || "", 200);
  if (!name) {
    return null;
  }

  const lat = Number.isFinite(element.lat)
    ? element.lat
    : element.center && Number.isFinite(element.center.lat)
      ? element.center.lat
      : null;
  const lon = Number.isFinite(element.lon)
    ? element.lon
    : element.center && Number.isFinite(element.center.lon)
      ? element.center.lon
      : null;

  const tagAddress = formatAddressFromTags(tags);
  const address = tagAddress || cleanText(`${district}, ${city}`, 240);

  const locationBag = `${name} ${address} ${cleanText(tags["addr:district"] || "", 120)} ${cleanText(tags["addr:city"] || "", 120)}`;
  if (requireDistrictTextMatch && !includesNormalized(locationBag, district)) {
    return null;
  }

  let mapsUrl = "";
  if (lat !== null && lon !== null) {
    const maps = new URL("https://www.google.com/maps/search/");
    maps.searchParams.set("api", "1");
    maps.searchParams.set("query", `${lat},${lon}`);
    mapsUrl = maps.toString();
  } else {
    const maps = new URL("https://www.google.com/maps/search/");
    maps.searchParams.set("api", "1");
    maps.searchParams.set("query", `${name} ${district} ${city}`);
    mapsUrl = maps.toString();
  }

  return {
    city,
    district,
    name,
    address,
    placeId: "",
    mapsUrl,
    source: "osm",
  };
}

function sortRecords(records) {
  return [...records].sort((left, right) => {
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

function targetKey(city, district) {
  return `${normalizeText(city)}|${normalizeText(district)}`;
}

async function loadExistingRecords(outputPath) {
  try {
    const raw = await fs.readFile(outputPath, "utf8");
    const payload = JSON.parse(raw);
    return Array.isArray(payload) ? payload : [];
  } catch (_error) {
    return [];
  }
}

async function writeSnapshot(outputPath, records) {
  const sorted = sortRecords(records);
  await fs.writeFile(outputPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted.length;
}

function filterTargets(targets, args) {
  let result = [...targets];

  if (args.city) {
    const cityKey = normalizeText(args.city);
    result = result.filter((target) => normalizeText(target.city) === cityKey);
  }

  if (args.district) {
    const districtKey = normalizeText(args.district);
    result = result.filter((target) => normalizeText(target.district) === districtKey);
  }

  if (args.fromCity) {
    result = result.filter(
      (target) => target.city.localeCompare(args.fromCity, "tr") >= 0,
    );
  }

  if (args.districtLimit > 0) {
    result = result.slice(0, args.districtLimit);
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const category = args.category;
  const selectors = categorySelectors(category);

  if (!category || selectors.length === 0) {
    throw new Error("Kullanim: node scripts/build-category-data.js --category kuafor|veteriner|akaryakit [--city Balikesir] [--district Altieylul] [--from-city Sirnak] [--resume]");
  }

  const districtMap = await loadDistrictMap();
  const cityNames = Object.keys(districtMap).sort((left, right) => left.localeCompare(right, "tr"));

  const allTargets = [];
  for (const city of cityNames) {
    const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
    districts.forEach((district) => {
      const cityText = cleanText(city, 80);
      const districtText = cleanText(district, 80);
      if (cityText && districtText) {
        allTargets.push({ city: cityText, district: districtText });
      }
    });
  }

  let targets = filterTargets(allTargets, args);
  if (targets.length === 0) {
    throw new Error("Hedef il/ilce bulunamadi.");
  }

  const outputPath = outputPathForCategory(category);
  const existingRecords = args.resume ? await loadExistingRecords(outputPath) : [];
  const records = [...existingRecords];
  const seen = new Set(
    records.map((record) =>
      normalizeText(`${record.city || ""}|${record.district || ""}|${record.name || ""}|${record.address || ""}`),
    ),
  );
  const completedTargets = new Set(
    records.map((record) => targetKey(record.city || "", record.district || "")),
  );

  if (args.resume) {
    targets = targets.filter((target) => !completedTargets.has(targetKey(target.city, target.district)));
  }

  if (targets.length === 0) {
    throw new Error("Islenecek yeni ilce kalmadi.");
  }

  let succeeded = 0;
  let failed = 0;
  let processed = 0;
  let stopRequested = false;

  process.on("SIGINT", () => {
    stopRequested = true;
  });
  process.on("SIGTERM", () => {
    stopRequested = true;
  });

  for (let i = 0; i < targets.length; i += 1) {
    if (stopRequested) {
      process.stdout.write("\nDurdurma sinyali alindi, checkpoint yaziliyor...\n");
      break;
    }

    const target = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${target.city} / ${target.district}\n`);

    try {
      const bounds = await geocodeDistrictBounds(target.city, target.district);
      await delay(args.sleepMs);

      if (!bounds) {
        failed += 1;
        process.stderr.write("  ! district_bounds_not_found\n");
        continue;
      }

      const query = buildOverpassQuery(bounds, selectors, category);
      const elements = await fetchOverpassElements(query);
      await delay(args.sleepMs);

      let added = 0;
      elements.forEach((element) => {
        const mapped = mapOverpassElement(element, target.city, target.district, {
          requireDistrictTextMatch: category !== "kuafor",
        });
        if (!mapped) {
          return;
        }

        const key = normalizeText(`${target.city}|${target.district}|${mapped.name}|${mapped.address}`);
        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        records.push(mapped);
        added += 1;
      });

      succeeded += 1;
      process.stdout.write(`  + ${added} kayit\n`);
    } catch (error) {
      failed += 1;
      process.stderr.write(`  ! ${error.message}\n`);
    }

    processed += 1;
    if (processed % args.checkpointEvery === 0) {
      const count = await writeSnapshot(outputPath, records);
      process.stdout.write(`  ~ checkpoint: ${count} kayit\n`);
    }
  }

  if (succeeded === 0) {
    throw new Error(`Hicbir ilce icin veri alinamadi (basarisiz: ${failed}).`);
  }

  const finalCount = await writeSnapshot(outputPath, records);

  process.stdout.write(`\n${finalCount} kayit yazildi: ${outputPath}\n`);
  process.stdout.write(`Basarili ilce: ${succeeded}, basarisiz ilce: ${failed}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
