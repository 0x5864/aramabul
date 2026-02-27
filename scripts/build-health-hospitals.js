"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HASTANE_JS_PATH = path.join(ROOT, "hastane.js");
const DISTRICTS_PATH = path.join(ROOT, "data", "districts.json");
const OUTPUT_PATH = path.join(ROOT, "data", "health-hospitals.json");
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 30000;
const REQUEST_DELAY_MS = 350;
const NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

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
 * Extract a constant payload from hastane.js.
 * @param {string} source
 * @param {string} marker
 * @param {string} endToken
 * @returns {unknown}
 */
function extractConstPayload(source, marker, endToken) {
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Marker not found: ${marker}`);
  }

  const eqIndex = source.indexOf("=", start);
  if (eqIndex < 0) {
    throw new Error(`Assignment not found for: ${marker}`);
  }

  const endIndex = source.indexOf(endToken, eqIndex);
  if (endIndex < 0) {
    throw new Error(`End token not found for: ${marker}`);
  }

  const literal = source.slice(eqIndex + 1, endIndex + 1).trim();
  return new Function(`return (${literal});`)();
}

/**
 * Find candidate city hints from hospital name.
 * @param {string} hospitalName
 * @param {Array<{city:string,key:string}>} cityKeys
 * @returns {string[]}
 */
function cityHintsFromName(hospitalName, cityKeys) {
  const normalizedName = normalizeText(hospitalName);
  const hints = cityKeys
    .filter((item) => item.key && normalizedName.includes(item.key))
    .map((item) => item.city);
  return [...new Set(hints)];
}

/**
 * Build additional geocode query variants for chain/group names.
 * @param {string} hospitalName
 * @returns {string[]}
 */
function buildNameVariants(hospitalName) {
  const base = String(hospitalName || "").trim();
  if (!base) {
    return [];
  }

  const variants = new Set([base]);

  variants.add(base.replace(/Hastaneleri/giu, "Hastanesi"));
  variants.add(base.replace(/Sağlık Grubu/giu, "Hastanesi"));
  variants.add(base.replace(/Hospital Group/giu, "Hospital"));
  variants.add(base.replace(/Grubu/giu, "").trim());
  variants.add(base.replace(/Şehir Eğitim ve Araştırma Hastanesi/giu, "Şehir Hastanesi"));

  const cleaned = base
    .replace(/Özel/giu, "")
    .replace(/Grubu/giu, "")
    .replace(/Group/giu, "")
    .replace(/\s+/gu, " ")
    .trim();
  if (cleaned) {
    variants.add(cleaned);
  }

  return [...variants].filter((item) => String(item || "").trim().length >= 3);
}

/**
 * Fetch nominatim candidates for a query.
 * @param {string} textQuery
 * @returns {Promise<any[]>}
 */
async function fetchNominatim(textQuery) {
  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", textQuery);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "arama-bul/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch (_error) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Reverse geocode by coordinates.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<any|null>}
 */
async function fetchReverse(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const url = new URL(NOMINATIM_REVERSE_ENDPOINT);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "arama-bul/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve the best nominatim candidate.
 * @param {any[]} candidates
 * @param {string} hospitalName
 * @param {string[]} cityHints
 * @returns {any|null}
 */
function pickBestCandidate(candidates, hospitalName, cityHints) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const normalizedName = normalizeText(hospitalName);
  const hintKeys = cityHints.map((value) => normalizeText(value)).filter(Boolean);

  const scored = candidates
    .map((item) => {
      const address = item && typeof item.address === "object" ? item.address : {};
      const bag = [
        String(item.display_name || ""),
        String(item.type || ""),
        String(item.class || ""),
        String(address.city || ""),
        String(address.town || ""),
        String(address.county || ""),
        String(address.state || ""),
        String(address.province || ""),
        String(address.municipality || ""),
        String(address.suburb || ""),
        String(address.city_district || ""),
      ].join(" ");
      const normalizedBag = normalizeText(bag);

      let score = 0;
      if (String(item.country_code || "").toLowerCase() === "tr") {
        score += 4;
      }

      if (normalizedBag.includes(normalizedName)) {
        score += 5;
      }

      if (/hospital|hastane|clinic|klinik/i.test(String(item.display_name || ""))) {
        score += 3;
      }

      if (/hospital|clinic|healthcare/i.test(String(item.type || ""))) {
        score += 3;
      }

      if (/amenity|healthcare/i.test(String(item.class || ""))) {
        score += 2;
      }

      if (/administrative/i.test(String(item.type || ""))) {
        score -= 3;
      }

      hintKeys.forEach((hint) => {
        if (hint && normalizedBag.includes(hint)) {
          score += 2;
        }
      });

      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].item : null;
}

/**
 * Match a city name from free text/address.
 * @param {string} text
 * @param {Array<{city:string,key:string}>} cityKeys
 * @returns {string}
 */
function resolveCity(text, cityKeys) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return "";
  }

  const byLength = [...cityKeys].sort((a, b) => b.key.length - a.key.length);
  const found = byLength.find((item) => item.key && normalizedText.includes(item.key));
  return found ? found.city : "";
}

/**
 * Try to infer city from hospital website hostname.
 * @param {string} website
 * @param {Array<{city:string,key:string}>} cityKeys
 * @returns {string}
 */
function inferCityFromWebsite(website, cityKeys) {
  const raw = String(website || "").trim();
  if (!raw) {
    return "";
  }

  let hostname = "";
  try {
    const parsed = new URL(raw);
    hostname = String(parsed.hostname || "");
  } catch (_error) {
    return "";
  }

  const normalizedHost = normalizeText(hostname);
  if (!normalizedHost) {
    return "";
  }

  const candidates = [...cityKeys].sort((a, b) => b.key.length - a.key.length);
  const found = candidates.find((item) => item.key && normalizedHost.includes(item.key));
  return found ? found.city : "";
}

/**
 * Resolve district from city + address text.
 * @param {string} city
 * @param {string} text
 * @param {Record<string,string[]>} districtMap
 * @returns {string}
 */
function resolveDistrict(city, text, districtMap) {
  if (!city) {
    return "";
  }

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
 * Build district-aware hospital dataset.
 * @returns {Promise<void>}
 */
async function main() {
  const [hastaneSource, districtRaw] = await Promise.all([
    fs.readFile(HASTANE_JS_PATH, "utf8"),
    fs.readFile(DISTRICTS_PATH, "utf8"),
  ]);

  const rawGroups = extractConstPayload(hastaneSource, "const RAW_HOSPITAL_GROUPS =", "];");
  const websites = extractConstPayload(hastaneSource, "const HOSPITAL_WEBSITES =", "};");
  const districtMap = JSON.parse(districtRaw);

  if (!Array.isArray(rawGroups) || !districtMap || typeof districtMap !== "object") {
    throw new Error("Kaynak veriler okunamadı.");
  }

  const cityKeys = Object.keys(districtMap).map((city) => ({ city, key: normalizeText(city) }));
  const rows = [];

  for (const group of rawGroups) {
    const groupTitle = String(group?.title || "").trim();
    const hospitals = Array.isArray(group?.hospitals) ? group.hospitals : [];

    for (const hospitalNameRaw of hospitals) {
      const hospitalName = String(hospitalNameRaw || "").trim();
      if (!hospitalName) {
        continue;
      }

      const website = String(websites[hospitalName] || "").trim();
      const hints = [...new Set([
        ...cityHintsFromName(hospitalName, cityKeys),
        inferCityFromWebsite(website, cityKeys),
      ])].filter(Boolean);
      const nameVariants = buildNameVariants(hospitalName);
      const queries = [];

      nameVariants.forEach((variant) => {
        hints.forEach((city) => {
          queries.push(`${variant}, ${city}, Türkiye`);
        });
        queries.push(`${variant}, Türkiye`);
      });

      const allCandidates = [];
      for (const query of queries) {
        const candidates = await fetchNominatim(query);
        allCandidates.push(...candidates);
        await delay(REQUEST_DELAY_MS);
      }

      const best = pickBestCandidate(allCandidates, hospitalName, hints);
      const displayName = String(best?.display_name || "").trim();
      const addressObj = best && typeof best.address === "object" ? best.address : {};
      const addressBag = [
        displayName,
        String(addressObj.city || ""),
        String(addressObj.town || ""),
        String(addressObj.county || ""),
        String(addressObj.state || ""),
        String(addressObj.province || ""),
        String(addressObj.city_district || ""),
        String(addressObj.municipality || ""),
        String(addressObj.suburb || ""),
      ].join(" ");

      let city = resolveCity(addressBag, cityKeys) || hints[0] || "";
      let district = resolveDistrict(city, addressBag, districtMap);

      if ((!city || !district) && best && Number.isFinite(Number(best.lat)) && Number.isFinite(Number(best.lon))) {
        const reversed = await fetchReverse(Number(best.lat), Number(best.lon));
        await delay(REQUEST_DELAY_MS);
        const reverseAddress = reversed && typeof reversed.address === "object" ? reversed.address : {};
        const reverseBag = [
          String(reversed?.display_name || ""),
          String(reverseAddress.city || ""),
          String(reverseAddress.town || ""),
          String(reverseAddress.county || ""),
          String(reverseAddress.state || ""),
          String(reverseAddress.province || ""),
          String(reverseAddress.city_district || ""),
          String(reverseAddress.municipality || ""),
          String(reverseAddress.suburb || ""),
        ].join(" ");
        if (!city) {
          city = resolveCity(reverseBag, cityKeys) || hints[0] || "";
        }
        if (!district) {
          district = resolveDistrict(city, reverseBag, districtMap);
        }
      }

      const queryText = [
        hospitalName,
        district,
        city,
        "Türkiye",
      ]
        .filter(Boolean)
        .join(" ");
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;

      rows.push({
        city,
        district,
        name: hospitalName,
        address: displayName || [district, city].filter(Boolean).join("/"),
        placeId: "",
        mapsUrl,
        website,
        source: "hospital-catalog",
        hospitalGroup: groupTitle,
      });
    }
  }

  const seen = new Set();
  const unique = rows.filter((row) => {
    const key = normalizeText([row.hospitalGroup, row.name, row.city, row.district].join("|"));
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => {
    const byCity = String(a.city || "").localeCompare(String(b.city || ""), "tr");
    if (byCity !== 0) {
      return byCity;
    }
    const byDistrict = String(a.district || "").localeCompare(String(b.district || ""), "tr");
    if (byDistrict !== 0) {
      return byDistrict;
    }
    const byGroup = String(a.hospitalGroup || "").localeCompare(String(b.hospitalGroup || ""), "tr");
    if (byGroup !== 0) {
      return byGroup;
    }
    return String(a.name || "").localeCompare(String(b.name || ""), "tr");
  });

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(unique, null, 2)}\n`, "utf8");

  const districtTagged = unique.filter((row) => String(row.district || "").trim()).length;
  const cityTagged = unique.filter((row) => String(row.city || "").trim()).length;
  process.stdout.write(
    `Yazildi: ${OUTPUT_PATH}\nToplam: ${unique.length}\nIl etiketli: ${cityTagged}\nIlce etiketli: ${districtTagged}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
