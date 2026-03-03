"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HASTANE_JS_PATH = path.join(ROOT, "hastane.js");
const DISTRICTS_PATH = path.join(ROOT, "data", "districts.json");
const OUTPUT_PATH = path.join(ROOT, "data", "health-hospitals.json");
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 25000;

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
 * Extract JS constant literal from source.
 * @param {string} source
 * @param {string} marker
 * @param {string} endToken
 * @returns {unknown}
 */
function extractConstPayload(source, marker, endToken) {
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Marker bulunamadi: ${marker}`);
  }

  const eqIndex = source.indexOf("=", start);
  const endIndex = source.indexOf(endToken, eqIndex);
  if (eqIndex < 0 || endIndex < 0) {
    throw new Error(`Sabit ayrismasi basarisiz: ${marker}`);
  }

  const literal = source.slice(eqIndex + 1, endIndex + 1).trim();
  return new Function(`return (${literal});`)();
}

/**
 * Resolve city name by free text.
 * @param {string} text
 * @param {Array<{city:string,key:string}>} cityKeys
 * @returns {string}
 */
function resolveCity(text, cityKeys) {
  const t = normalizeText(text);
  if (!t) {
    return "";
  }

  const byLength = [...cityKeys].sort((a, b) => b.key.length - a.key.length);
  const found = byLength.find((item) => item.key && t.includes(item.key));
  return found ? found.city : "";
}

/**
 * Resolve district in a city by free text.
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

  const t = normalizeText(text);
  if (!t) {
    return "";
  }

  const ordered = [...districts].sort((a, b) => normalizeText(b).length - normalizeText(a).length);
  const found = ordered.find((district) => {
    const key = normalizeText(district);
    return key && t.includes(key);
  });
  return found || "";
}

/**
 * Pick likely best nominatim candidate.
 * @param {any[]} candidates
 * @returns {any|null}
 */
function pickBestCandidate(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const scored = candidates
    .map((item) => {
      const displayName = String(item?.display_name || "");
      const type = String(item?.type || "");
      const className = String(item?.class || "");
      let score = 0;
      if (String(item?.country_code || "").toLowerCase() === "tr") {
        score += 4;
      }
      if (/hastane|hospital|medical|tip/i.test(displayName)) {
        score += 4;
      }
      if (/hospital|clinic|healthcare/i.test(type)) {
        score += 3;
      }
      if (/amenity|healthcare/i.test(className)) {
        score += 2;
      }
      if (/administrative/i.test(type)) {
        score -= 2;
      }
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.item || null;
}

/**
 * Fetch nominatim candidates by query.
 * @param {string} query
 * @returns {Promise<any[]>}
 */
async function fetchNominatim(query) {
  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "arama-bul/1.0 (+eah-merge)",
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
 * Infer likely city hints from hospital name.
 * @param {string} hospitalName
 * @param {Array<{city:string,key:string}>} cityKeys
 * @returns {string[]}
 */
function cityHintsFromName(hospitalName, cityKeys) {
  const nameKey = normalizeText(hospitalName);
  return [...new Set(
    cityKeys
      .filter((item) => item.key && nameKey.includes(item.key))
      .map((item) => item.city),
  )];
}

/**
 * Build a Google Maps search URL.
 * @param {string} name
 * @param {string} city
 * @param {string} district
 * @param {string} address
 * @returns {string}
 */
function mapsUrl(name, city, district, address) {
  const query = [name, address, district, city, "Türkiye"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Main flow.
 * @returns {Promise<void>}
 */
async function main() {
  const [hastaneSource, districtRaw, existingRaw] = await Promise.all([
    fs.readFile(HASTANE_JS_PATH, "utf8"),
    fs.readFile(DISTRICTS_PATH, "utf8"),
    fs.readFile(OUTPUT_PATH, "utf8"),
  ]);

  const groups = extractConstPayload(hastaneSource, "const RAW_HOSPITAL_GROUPS =", "];");
  const districtMap = JSON.parse(districtRaw);
  const existingRows = JSON.parse(existingRaw);

  if (!Array.isArray(groups) || !Array.isArray(existingRows)) {
    throw new Error("Kaynak veriler okunamadi.");
  }

  const eahGroup = groups.find((group) => normalizeText(group?.title || "") === normalizeText("Eğitim ve Araştırma Hastaneleri"));
  const eahHospitals = Array.isArray(eahGroup?.hospitals) ? eahGroup.hospitals : [];
  const cityKeys = Object.keys(districtMap).map((city) => ({ city, key: normalizeText(city) }));

  const resolvedRows = [];
  for (let i = 0; i < eahHospitals.length; i += 1) {
    const hospitalName = String(eahHospitals[i] || "").trim();
    if (!hospitalName) {
      continue;
    }
    process.stdout.write(`[${i + 1}/${eahHospitals.length}] ${hospitalName}\n`);

    const hints = cityHintsFromName(hospitalName, cityKeys);
    const queries = [
      `${hospitalName}, Türkiye`,
      ...hints.map((city) => `${hospitalName}, ${city}, Türkiye`),
    ];

    const candidates = [];
    for (const query of queries) {
      const result = await fetchNominatim(query);
      candidates.push(...result);
      await delay(REQUEST_DELAY_MS);
    }

    const best = pickBestCandidate(candidates);
    const addressObj = best && typeof best.address === "object" ? best.address : {};
    const displayName = String(best?.display_name || "").trim();
    const addressBag = [
      displayName,
      String(addressObj.city || ""),
      String(addressObj.town || ""),
      String(addressObj.county || ""),
      String(addressObj.state || ""),
      String(addressObj.province || ""),
      String(addressObj.city_district || ""),
      String(addressObj.suburb || ""),
    ].join(" ");

    let city = resolveCity(addressBag, cityKeys) || hints[0] || "";
    let district = resolveDistrict(city, addressBag, districtMap);
    if (!district && city) {
      const cityDistricts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
      if (cityDistricts.includes("Merkez")) {
        district = "Merkez";
      }
    }

    resolvedRows.push({
      city,
      district,
      name: hospitalName,
      address: displayName || [district, city].filter(Boolean).join("/"),
      mapsUrl: mapsUrl(hospitalName, city, district, displayName),
      website: "",
      phone: "",
      source: "hastane.js",
      hospitalGroup: "Eğitim ve Araştırma Hastaneleri",
    });
  }

  const existingByName = new Map(
    existingRows.map((row) => [normalizeText(String(row?.name || "")), row]),
  );
  let updatedExisting = 0;
  let appended = 0;

  for (const row of resolvedRows) {
    const key = normalizeText(row.name);
    const hit = existingByName.get(key);
    if (hit) {
      hit.hospitalGroup = "Eğitim ve Araştırma Hastaneleri";
      if (!hit.city && row.city) {
        hit.city = row.city;
      }
      if (!hit.district && row.district) {
        hit.district = row.district;
      }
      if ((!hit.address || normalizeText(hit.address) === normalizeText(hit.name)) && row.address) {
        hit.address = row.address;
      }
      if (!hit.mapsUrl && row.mapsUrl) {
        hit.mapsUrl = row.mapsUrl;
      }
      updatedExisting += 1;
      continue;
    }
    existingRows.push(row);
    appended += 1;
  }

  const seen = new Set();
  const unique = existingRows
    .filter((row) => {
      const key = normalizeText([row.hospitalGroup, row.name, row.city, row.district].join("|"));
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
      const byGroup = String(a.hospitalGroup || "").localeCompare(String(b.hospitalGroup || ""), "tr");
      if (byGroup !== 0) {
        return byGroup;
      }
      return String(a.name || "").localeCompare(String(b.name || ""), "tr");
    });

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(unique, null, 2)}\n`, "utf8");

  const eahCount = unique.filter((row) => row.hospitalGroup === "Eğitim ve Araştırma Hastaneleri").length;
  const eahDistrict = unique.filter((row) => row.hospitalGroup === "Eğitim ve Araştırma Hastaneleri" && row.district).length;
  process.stdout.write(
    `Yazildi: ${OUTPUT_PATH}\n` +
      `EAH guncellenen: ${updatedExisting}\n` +
      `EAH yeni eklenen: ${appended}\n` +
      `EAH toplam: ${eahCount} (ilce etiketli: ${eahDistrict})\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${String(error?.message || error)}\n`);
  process.exitCode = 1;
});
