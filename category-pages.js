const ASSET_VERSION = "20260305-03";
const CATEGORY_VENUES_JSON_PATH = "data/venues.json";
const DISTRICTS_JSON_PATH = "data/districts.json";
const ROOT_MARQUEE_IMAGES = Object.freeze([
  { src: "assets/yemek.png", alt: "Keyif görseli" },
  { src: "assets/gezi.png", alt: "Gezi görseli" },
  { src: "assets/sac.png", alt: "Hizmetler görseli" },
  { src: "assets/saglik.png", alt: "Sağlık görseli" },
  { src: "assets/kultur.png", alt: "Kültür görseli" },
  { src: "assets/sanat.png", alt: "Sanat görseli" },
]);
const DISTRICT_INLINE_AD_INSERT_AFTER = 6;
const DISTRICT_INLINE_AD_SCRIPT_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const DISTRICT_INLINE_AD_CONFIG_SCRIPT_PATH = "ads-config.js";
const LEGACY_SEYAHAT_HOTEL_DATA_FILES = Object.freeze([
  "data/gezi-oteller-5-yildiz.json",
  "data/gezi-oteller-4-yildiz.json",
  "data/gezi-oteller-3-yildiz.json",
  "data/gezi-oteller-diger.json",
]);
const runtime = window.ARAMABUL_RUNTIME;
const FALLBACK_SCRIPTS = Object.freeze({
  data: "data/fallback-data.js?v=20260302-01",
  food: "data/fallback-food-data.js?v=20260302-01",
  category: "data/fallback-category-data.js?v=20260302-01",
});
const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const JSON_FETCH_CACHE_MODE = LOCAL_DEV_HOSTNAMES.has(String(window.location.hostname || "").trim())
  ? "no-store"
  : "force-cache";
const NEARBY_VENUE_RESULT_LIMIT = 10;
const NEARBY_LOCATION_LOOKUP_TIMEOUT = 9000;

function withVersion(path) {
  const source = String(path || "").trim();
  if (!source) {
    return source;
  }

  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${ASSET_VERSION}`;
}

function stripQuery(path) {
  const source = String(path || "").trim();
  if (!source) {
    return source;
  }

  const queryIndex = source.indexOf("?");
  return queryIndex >= 0 ? source.slice(0, queryIndex) : source;
}

function candidateAssetPaths(path) {
  const source = String(path || "").trim();
  if (!source) {
    return [];
  }

  const result = [];
  const pushUnique = (value) => {
    const next = String(value || "").trim();
    if (!next || result.includes(next)) {
      return;
    }
    result.push(next);
  };

  pushUnique(withVersion(source));
  pushUnique(source);
  pushUnique(stripQuery(source));
  return result;
}

async function fetchJsonWithFallback(path, fallbackValue) {
  const candidates = candidateAssetPaths(path);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: JSON_FETCH_CACHE_MODE });
      if (!response.ok) {
        continue;
      }
      return await response.json();
    } catch (_error) {
      // Keep trying fallback candidates.
    }
  }

  return fallbackValue;
}

let districtInlineAdScriptPromise = null;
let districtInlineAdConfigPromise = null;

function hasDistrictInlineAdRuntimeConfig() {
  return Boolean(window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object");
}

function isAdsConfigScriptPath(path) {
  const normalized = stripQuery(path).toLocaleLowerCase("en-US");
  return normalized.endsWith("/ads-config.js") || normalized.endsWith("ads-config.js");
}

function appendScriptTag(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed_to_load_script:${src}`));
    document.head.appendChild(script);
  });
}

async function ensureDistrictInlineAdConfigLoaded() {
  if (hasDistrictInlineAdRuntimeConfig()) {
    return window.ARAMABUL_ADS_CONFIG;
  }

  if (districtInlineAdConfigPromise) {
    return districtInlineAdConfigPromise;
  }

  districtInlineAdConfigPromise = (async () => {
    const existingScript = [...document.scripts].find((script) => {
      const source = script.getAttribute("src") || script.src || "";
      return isAdsConfigScriptPath(source);
    });
    if (existingScript) {
      return hasDistrictInlineAdRuntimeConfig() ? window.ARAMABUL_ADS_CONFIG : null;
    }

    const candidates = candidateAssetPaths(DISTRICT_INLINE_AD_CONFIG_SCRIPT_PATH);
    for (const candidate of candidates) {
      try {
        if (runtime && typeof runtime.loadScriptOnce === "function") {
          await runtime.loadScriptOnce(candidate);
        } else {
          await appendScriptTag(candidate);
        }
        if (hasDistrictInlineAdRuntimeConfig()) {
          return window.ARAMABUL_ADS_CONFIG;
        }
      } catch (_error) {
        // Keep trying fallback candidates.
      }
    }

    return null;
  })();

  return districtInlineAdConfigPromise;
}

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function isAdToggleDisabled(value) {
  if (value === false) {
    return true;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "off" || normalized === "false" || normalized === "0" || normalized === "no";
}

function resolveDistrictInlineAdConfig() {
  const body = document.body;
  const runtimeConfig = window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object"
    ? window.ARAMABUL_ADS_CONFIG
    : {};
  const enabled = !isAdToggleDisabled(body?.dataset?.districtAdEnabled)
    && !isAdToggleDisabled(runtimeConfig.districtInlineEnabled);
  if (!enabled) {
    return null;
  }

  const client = String(body?.dataset?.adsenseClient || runtimeConfig.adsenseClient || "").trim();
  const slot = String(body?.dataset?.districtInlineAdSlot || runtimeConfig.districtInlineAdSlot || "").trim();
  if (!client || !slot) {
    return null;
  }

  return {
    client,
    slot,
    insertAfter: parsePositiveInteger(body?.dataset?.districtInlineAdAfter || runtimeConfig.districtInlineAdAfter, DISTRICT_INLINE_AD_INSERT_AFTER),
  };
}

function resolveCategoryRootAdConfig() {
  const body = document.body;
  const runtimeConfig = window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object"
    ? window.ARAMABUL_ADS_CONFIG
    : {};
  const enabled = !isAdToggleDisabled(body?.dataset?.categoryRootAdEnabled)
    && !isAdToggleDisabled(runtimeConfig.categoryRootAdEnabled);
  if (!enabled) {
    return null;
  }

  const client = String(body?.dataset?.adsenseClient || runtimeConfig.adsenseClient || "").trim();
  const slot = String(body?.dataset?.categoryRootAdSlot || runtimeConfig.categoryRootAdSlot || runtimeConfig.districtInlineAdSlot || "").trim();
  if (!client || !slot) {
    return null;
  }

  return { client, slot };
}

function ensureDistrictInlineAdScript(client) {
  if (districtInlineAdScriptPromise) {
    return districtInlineAdScriptPromise;
  }

  const scriptSource = `${DISTRICT_INLINE_AD_SCRIPT_SRC}?client=${encodeURIComponent(client)}`;
  const existing = [...document.scripts].find((script) => String(script.src || "").includes(DISTRICT_INLINE_AD_SCRIPT_SRC));
  if (existing) {
    districtInlineAdScriptPromise = Promise.resolve();
    return districtInlineAdScriptPromise;
  }

  districtInlineAdScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = scriptSource;
    script.onload = () => resolve();
    script.onerror = () => {
      districtInlineAdScriptPromise = null;
      reject(new Error("failed_to_load_adsense_script"));
    };
    document.head.appendChild(script);
  });

  return districtInlineAdScriptPromise;
}

function requestDistrictInlineAdFill(adElement, config) {
  if (!adElement || !config) {
    return;
  }

  ensureDistrictInlineAdScript(config.client)
    .then(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (_error) {
        // Ignore ad rendering failures so list rendering never breaks.
      }
    })
    .catch(() => {
      // Ignore script load failures so list rendering never breaks.
    });
}

function renderDistrictInlineAdCard(config) {
  if (!config) {
    return null;
  }

  const card = document.createElement("aside");
  card.className = "province-ad-slot";
  card.setAttribute("aria-label", "Reklam");

  const label = document.createElement("span");
  label.className = "province-ad-label";
  label.textContent = "Reklam";

  const body = document.createElement("div");
  body.className = "province-ad-slot-body";

  const adElement = document.createElement("ins");
  adElement.className = "adsbygoogle province-adsense-unit";
  adElement.style.display = "block";
  adElement.dataset.adClient = config.client;
  adElement.dataset.adSlot = config.slot;
  adElement.dataset.adFormat = "auto";
  adElement.dataset.fullWidthResponsive = "true";

  body.append(adElement);
  card.append(label, body);
  requestDistrictInlineAdFill(adElement, config);
  return card;
}

function renderCategoryRootInlineAdCard(config) {
  if (!config) {
    return null;
  }

  const card = document.createElement("aside");
  card.className = "province-ad-slot category-root-ad-slot";
  card.setAttribute("aria-label", "Reklam");
  card.style.width = "100%";
  card.style.maxWidth = "220px";

  const label = document.createElement("span");
  label.className = "province-ad-label";
  label.textContent = "Reklam";

  const body = document.createElement("div");
  body.className = "province-ad-slot-body";
  body.style.minHeight = "0";
  body.style.aspectRatio = "1 / 1";

  const adElement = document.createElement("ins");
  adElement.className = "adsbygoogle province-adsense-unit category-root-adsense-unit";
  adElement.style.display = "block";
  adElement.style.width = "100%";
  adElement.style.height = "100%";
  adElement.style.minHeight = "0";
  adElement.dataset.adClient = config.client;
  adElement.dataset.adSlot = config.slot;
  adElement.dataset.adFormat = "auto";

  body.append(adElement);
  card.append(label, body);
  requestDistrictInlineAdFill(adElement, config);
  return card;
}

function renderRootCategoryMarqueeSection() {
  const section = document.createElement("section");
  section.className = "home-image-marquee";
  section.setAttribute("aria-label", "Kategori görsel bandı");

  const track = document.createElement("div");
  track.className = "home-image-marquee-track";

  const createStrip = (hideFromAssistiveTech) => {
    const strip = document.createElement("div");
    strip.className = "home-image-marquee-strip";
    if (hideFromAssistiveTech) {
      strip.setAttribute("aria-hidden", "true");
    }

    ROOT_MARQUEE_IMAGES.forEach((item) => {
      const image = document.createElement("img");
      image.className = "home-image-marquee-item";
      image.src = item.src;
      image.alt = hideFromAssistiveTech ? "" : item.alt;
      image.loading = "eager";
      image.decoding = "async";
      if (hideFromAssistiveTech) {
        image.fetchPriority = "low";
      }
      strip.append(image);
    });

    return strip;
  };

  track.append(createStrip(false), createStrip(true), createStrip(true));
  section.append(track);
  return section;
}

function ensureRootCategoryMarquee() {
  const pageType = String(document.body?.dataset?.categoryPage || "").trim();
  if (pageType !== "root") {
    return;
  }

  const groupGrid = document.querySelector("#categoryGroupGrid");
  if (!groupGrid || !groupGrid.parentElement) {
    return;
  }

  const existing = groupGrid.parentElement.querySelector(".home-image-marquee");
  if (existing) {
    return;
  }

  const marqueeSection = renderRootCategoryMarqueeSection();
  groupGrid.parentElement.insertBefore(marqueeSection, groupGrid);
}

function queryParams() {
  const url = new URL(window.location.href);
  return {
    city: (url.searchParams.get("sehir") || url.searchParams.get("city") || "").trim(),
    district: (url.searchParams.get("ilce") || url.searchParams.get("district") || "").trim(),
    subcategorySource: (url.searchParams.get("tur") || url.searchParams.get("type") || "").trim(),
    facilityType: (url.searchParams.get("tt") || url.searchParams.get("tesis") || url.searchParams.get("facilityType") || "").trim(),
    venueName: (url.searchParams.get("mekan") || url.searchParams.get("venue") || "").trim(),
    sourcePlaceId: (url.searchParams.get("pid") || "").trim(),
  };
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function normalizeName(value) {
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

function normalizeSearchText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function normalizeFacilityType(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function resolveVenueFacilityType(venue) {
  return pickFirstText(venue?.sourceTesisTuru, venue?.type, venue?.cuisine);
}

function isCampingFacilityType(value) {
  const normalized = normalizeFacilityType(value);
  return normalized === "camping" || normalized === "kamping" || normalized === "kamp alani";
}

function isHotelFacilityType(value) {
  const normalized = normalizeFacilityType(value);
  return normalized === "otel" || normalized === "hotel";
}

function mapLegacyCampingVenueToDynamicVenue(venue) {
  return {
    ...venue,
    cuisine: "Camping",
    sourceTesisTuru: "Camping",
    source: pickFirstText(venue?.source, "legacy-camping"),
  };
}

function mapLegacyHotelVenueToDynamicVenue(venue) {
  return {
    ...venue,
    cuisine: "Otel",
    sourceTesisTuru: "Otel",
    source: pickFirstText(venue?.source, "legacy-hotel"),
  };
}

function stripDynamicNameNumericSuffix(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const compact = raw
    .replace(/(?:[\s-]+)\d{3,6}$/u, "")
    .replace(/([A-Za-zÇĞİIÖŞÜçğıöşü])\d{3,6}$/u, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return compact || raw;
}

function dynamicVenueLocalityKey(venue) {
  const cityKey = normalizeName(venue?.city);
  const districtKey = normalizeName(venue?.district);
  if (cityKey && districtKey) {
    return `${cityKey}:${districtKey}`;
  }
  return cityKey || districtKey || "_";
}

function buildDynamicVenueNameSetByLocality(venues) {
  const namesByLocality = new Map();

  venues.forEach((venue) => {
    const localityKey = dynamicVenueLocalityKey(venue);
    const rawNameKey = normalizeName(venue?.name);
    if (!rawNameKey) {
      return;
    }

    const existing = namesByLocality.get(localityKey);
    if (existing) {
      existing.add(rawNameKey);
      return;
    }

    namesByLocality.set(localityKey, new Set([rawNameKey]));
  });

  return namesByLocality;
}

function resolveDynamicVenueNameKey(venue, namesByLocality) {
  const rawNameKey = normalizeName(venue?.name);
  if (!rawNameKey) {
    return "";
  }

  const strippedNameKey = normalizeName(stripDynamicNameNumericSuffix(venue?.name));
  if (!strippedNameKey || strippedNameKey === rawNameKey) {
    return rawNameKey;
  }

  const localityKey = dynamicVenueLocalityKey(venue);
  const localityNames = namesByLocality.get(localityKey);
  if (localityNames && localityNames.has(strippedNameKey)) {
    return strippedNameKey;
  }

  return rawNameKey;
}

function scoreDynamicVenueForDedupe(venue, canonicalNameKey) {
  const rawNameKey = normalizeName(venue?.name);
  let score = venueInfoRichnessScore(venue);

  if (rawNameKey && rawNameKey === canonicalNameKey) {
    score += 100;
  }

  if (!/\d{3,6}\s*$/u.test(String(venue?.name || "").trim())) {
    score += 2;
  }

  return score;
}

function dedupeDynamicTypeVenues(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return [];
  }

  const namesByLocality = buildDynamicVenueNameSetByLocality(venues);
  const bestByKey = new Map();

  venues.forEach((venue) => {
    const canonicalNameKey = resolveDynamicVenueNameKey(venue, namesByLocality);
    if (!canonicalNameKey) {
      return;
    }

    const localityKey = dynamicVenueLocalityKey(venue);
    const identityKey = `${localityKey}:${canonicalNameKey}`;
    const existing = bestByKey.get(identityKey);

    if (!existing) {
      bestByKey.set(identityKey, venue);
      return;
    }

    const existingScore = scoreDynamicVenueForDedupe(existing, canonicalNameKey);
    const candidateScore = scoreDynamicVenueForDedupe(venue, canonicalNameKey);
    if (candidateScore > existingScore) {
      bestByKey.set(identityKey, venue);
    }
  });

  return [...bestByKey.values()];
}

function filterDynamicTypeVenues(venues, requestedType) {
  const typeText = String(requestedType || "").trim();
  if (!typeText) {
    return [];
  }

  const normalizedRequestedType = normalizeFacilityType(typeText);
  if (!normalizedRequestedType) {
    return [];
  }

  const filtered = venues.filter((venue) => {
    const venueType = normalizeFacilityType(resolveVenueFacilityType(venue));
    return venueType === normalizedRequestedType;
  });

  return dedupeDynamicTypeVenues(filtered);
}

function findNameMatch(queryValue, values) {
  if (!queryValue) {
    return "";
  }

  const normalizedQuery = normalizeName(queryValue);
  if (!normalizedQuery) {
    return "";
  }

  const exact = values.find((value) => value === queryValue);
  if (exact) {
    return exact;
  }

  const normalizedExact = values.find((value) => normalizeName(value) === normalizedQuery);
  if (normalizedExact) {
    return normalizedExact;
  }

  if (normalizedQuery.length < 3) {
    return "";
  }

  return values.find((value) => {
    const normalizedValue = normalizeName(value);
    return normalizedValue.includes(normalizedQuery) || normalizedQuery.includes(normalizedValue);
  }) || "";
}

function dedupeVenueListInOrder(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return [];
  }

  const seen = new Set();
  const result = [];

  venues.forEach((venue) => {
    const key = String(venue?.sourcePlaceId || "").trim()
      || `${normalizeName(venue?.city)}:${normalizeName(venue?.district)}:${normalizeName(venue?.name)}:${normalizeName(venue?.address || "")}`;
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(venue);
  });

  return result;
}

function requestNearbyCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (
      typeof navigator === "undefined"
      || !navigator.geolocation
      || typeof navigator.geolocation.getCurrentPosition !== "function"
    ) {
      reject(new Error("Tarayıcı konum özelliği desteklenmiyor."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        if (error && error.code === 1) {
          reject(new Error("Konum izni kapalı. Tarayıcıdan izin verip tekrar dene."));
          return;
        }

        if (error && error.code === 3) {
          reject(new Error("Konum alınamadı. Bağlantını kontrol edip tekrar dene."));
          return;
        }

        reject(new Error("Konum bilgisi alınamadı."));
      },
      {
        enableHighAccuracy: false,
        timeout: NEARBY_LOCATION_LOOKUP_TIMEOUT,
        maximumAge: 1000 * 60 * 8,
      },
    );
  });
}

function parseReverseLocationPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      city: "",
      district: "",
      neighborhood: "",
    };
  }

  const address = payload.address && typeof payload.address === "object" ? payload.address : {};
  const city = pickFirstText(
    payload.city,
    payload.cityName,
    payload.principalSubdivision,
    address.city,
    address.province,
    address.state,
    address.town,
    address.county,
    address.municipality,
  );
  const district = pickFirstText(
    payload.locality,
    address.city_district,
    address.district,
    address.county,
    address.town,
    address.municipality,
    address.borough,
  );
  const neighborhood = pickFirstText(
    address.neighbourhood,
    address.neighborhood,
    address.suburb,
    address.quarter,
    address.hamlet,
  );

  return {
    city,
    district,
    neighborhood,
  };
}

async function resolveNearbyLocationByCoordinates(latitude, longitude) {
  const providers = [
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=tr`,
    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=json&accept-language=tr`,
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      const resolved = parseReverseLocationPayload(payload);
      if (resolved.city || resolved.district || resolved.neighborhood) {
        return resolved;
      }
    } catch (_error) {
      // Try the next provider.
    }
  }

  return {
    city: "",
    district: "",
    neighborhood: "",
  };
}

function rankNearbyVenues(venues, cityName, districtName, neighborhoodName) {
  const normalizedCity = normalizeName(cityName);
  const normalizedDistrict = normalizeName(districtName);
  const normalizedNeighborhood = normalizeSearchText(neighborhoodName);

  return [...venues].sort((left, right) => {
    const scoreVenue = (venue) => {
      let score = 5;
      const venueCity = normalizeName(venue?.city);
      const venueDistrict = normalizeName(venue?.district);
      const venueNeighborhoodSource = [venue?.neighborhood, venue?.address].filter(Boolean).join(" ");
      const venueNeighborhood = normalizeSearchText(venueNeighborhoodSource);

      if (normalizedCity && venueCity === normalizedCity) {
        score = 2;
      }

      if (normalizedDistrict && venueDistrict === normalizedDistrict && (!normalizedCity || venueCity === normalizedCity)) {
        score = 1;
      }

      if (
        normalizedNeighborhood
        && venueNeighborhood
        && venueNeighborhood.includes(normalizedNeighborhood)
        && score <= 2
      ) {
        score -= 0.4;
      }

      return score;
    };

    const scoreDiff = scoreVenue(left) - scoreVenue(right);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const ratingDiff = readNumericVenueRating(right) - readNumericVenueRating(left);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    const reviewDiff = readNumericVenueReviewCount(right) - readNumericVenueReviewCount(left);
    if (reviewDiff !== 0) {
      return reviewDiff;
    }

    return String(left?.name || "").localeCompare(String(right?.name || ""), "tr");
  });
}

async function resolveNearbyVenuesForCurrentLocation(venues, limit = NEARBY_VENUE_RESULT_LIMIT) {
  const dedupedVenues = dedupeVenueListInOrder(Array.isArray(venues) ? venues : []);
  if (dedupedVenues.length === 0) {
    throw new Error("Bu tür için mekan verisi bulunamadı.");
  }

  const position = await requestNearbyCurrentPosition();
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Konum bilgisi okunamadı.");
  }

  const resolvedLocation = await resolveNearbyLocationByCoordinates(latitude, longitude);
  const cityNames = [...new Set(dedupedVenues.map((venue) => String(venue?.city || "").trim()).filter(Boolean))];
  const matchedCity = findNameMatch(resolvedLocation.city, cityNames) || findNameMatch(resolvedLocation.district, cityNames);
  const cityMatchedVenues = matchedCity
    ? dedupedVenues.filter((venue) => normalizeName(venue.city) === normalizeName(matchedCity))
    : dedupedVenues;
  const districtNames = [...new Set(cityMatchedVenues.map((venue) => String(venue?.district || "").trim()).filter(Boolean))];
  const matchedDistrict = findNameMatch(resolvedLocation.district, districtNames)
    || findNameMatch(resolvedLocation.neighborhood, districtNames);
  const ranked = rankNearbyVenues(
    cityMatchedVenues,
    matchedCity,
    matchedDistrict || resolvedLocation.district,
    resolvedLocation.neighborhood,
  ).slice(0, Math.max(1, Number.parseInt(String(limit), 10) || NEARBY_VENUE_RESULT_LIMIT));

  return {
    venues: ranked,
    matchedCity,
    matchedDistrict,
    resolvedLocation,
  };
}

const CATEGORY_DEFINITIONS = {
  kuafor: {
    name: "Kuaför",
    pageBase: "kuafor",
    titleUnit: "kuaför salonu",
    dataFile: "data/kuafor.json",
    useDistrictCatalog: true,
    matcherKeywords: ["kuafor", "kuaför", "berber", "sac", "saç", "guzellik", "güzellik"],
  },
  veteriner: {
    name: "Veteriner",
    pageBase: "veteriner",
    titleUnit: "veteriner kliniği",
    dataFile: "data/veteriner.json",
    useDistrictCatalog: true,
    matcherKeywords: ["veteriner", "vet", "hayvan", "veterinary", "pet clinic"],
  },
  hizmetler: {
    name: "Hizmetler",
    pageBase: "hizmetler",
    titleUnit: "hizmet noktası",
    primaryRowTitle: "Kuaförler",
    dataFile: "data/kuafor.json",
    secondaryDataFile: "data/veteriner.json",
    secondaryRowTitle: "Veterinerler",
    secondaryCountLabel: "veteriner",
    tertiaryDataFile: "data/akaryakit.json",
    tertiaryRowTitle: "Akaryakıt İstasyonları",
    tertiaryCountLabel: "akaryakıt istasyonu",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Hizmet alt kategorileri",
    subcategoryVenuePagePath: "hizmetler-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Kuaförler",
        countLabel: "kuaför",
      },
      {
        source: "secondary",
        title: "Veterinerler",
        countLabel: "veteriner",
      },
      {
        source: "tertiary",
        title: "Akaryakıt İstasyonları",
        countLabel: "akaryakıt istasyonu",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "hizmetler",
      "service",
      "kuafor",
      "kuaför",
      "veteriner",
      "vet",
      "akaryakit",
      "akaryakıt",
      "benzin",
      "petrol",
      "istasyon",
      "fuel",
      "gas station",
    ],
  },
  kultur: {
    name: "Kültür",
    pageBase: "kultur",
    titleUnit: "müze",
    primaryRowTitle: "Müzeler",
    dataFile: "data/kultur-muzeler.json",
    secondaryDataFile: "data/kultur-oren-yerleri.json",
    secondaryRowTitle: "Ören yerleri",
    secondaryCountLabel: "ören yeri",
    tertiaryDataFile: "data/kultur-camiler.json",
    tertiaryRowTitle: "Tarihi Camiler",
    tertiaryCountLabel: "cami",
    quaternaryDataFile: "data/kultur-magaralar.json",
    quaternaryRowTitle: "Mağaralar",
    quaternaryCountLabel: "mağara",
    quinaryDataFile: "data/kultur-selaleler.json",
    quinaryRowTitle: "Şelaleler",
    quinaryCountLabel: "şelale",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Kültür alt kategorileri",
    subcategoryVenuePagePath: "kultur-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Müzeler",
        countLabel: "müze",
      },
      {
        source: "secondary",
        title: "Ören yerleri",
        countLabel: "ören yeri",
      },
      {
        source: "tertiary",
        title: "Tarihi Camiler",
        countLabel: "cami",
      },
      {
        source: "quaternary",
        title: "Mağaralar",
        countLabel: "mağara",
      },
      {
        source: "quinary",
        title: "Şelaleler",
        countLabel: "şelale",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "kultur",
      "kültür",
      "müze",
      "müzeler",
      "muze",
      "muzeler",
      "ören yeri",
      "ören yerleri",
      "oren yeri",
      "oren yerleri",
      "örenyeri",
      "orenyeri",
      "antik kent",
      "höyük",
      "hoyuk",
      "cami",
      "camii",
      "camiler",
      "tarihi cami",
      "tarihi camiler",
      "mescit",
      "mosque",
      "mağara",
      "mağaralar",
      "magara",
      "magaralar",
      "cave",
      "caves",
      "şelale",
      "selale",
      "şelaleler",
      "selaleler",
      "waterfall",
      "falls",
    ],
  },
  sanat: {
    name: "Sanat",
    pageBase: "sanat",
    titleUnit: "sanat mekanı",
    primaryRowTitle: "Opera ve Bale",
    dataFile: "data/kultur-opera-bale.json",
    secondaryDataFile: "data/kultur-devlet-tiyatrolari.json",
    secondaryRowTitle: "Devlet Tiyatroları",
    secondaryCountLabel: "devlet tiyatrosu",
    tertiaryDataFile: "data/kultur-sehir-tiyatrolari.json",
    tertiaryRowTitle: "Şehir Tiyatroları",
    tertiaryCountLabel: "şehir tiyatrosu",
    quaternaryDataFile: "data/kultur-ozel-tiyatrolar.json",
    quaternaryRowTitle: "Özel Tiyatrolar",
    quaternaryCountLabel: "özel tiyatro",
    quinaryDataFile: "data/sanat-galeriler.json",
    quinaryRowTitle: "Galeriler",
    quinaryCountLabel: "galeri",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Sanat alt kategorileri",
    subcategoryVenuePagePath: "sanat-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Opera ve Bale",
        countLabel: "opera ve bale mekanı",
      },
      {
        source: "secondary",
        title: "Devlet Tiyatroları",
        countLabel: "devlet tiyatrosu",
      },
      {
        source: "tertiary",
        title: "Şehir Tiyatroları",
        countLabel: "şehir tiyatrosu",
      },
      {
        source: "quinary",
        title: "Galeriler",
        countLabel: "galeri",
      },
      {
        source: "quaternary",
        title: "Özel Tiyatrolar",
        countLabel: "özel tiyatro",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "sanat",
      "art",
      "sahne sanatlari",
      "sahne sanatları",
      "performans",
      "opera",
      "bale",
      "tiyatro",
      "devlet tiyatrosu",
      "şehir tiyatrosu",
      "özel tiyatro",
      "galeri",
      "galeriler",
      "gallery",
      "kultur",
      "kültür",
    ],
  },
  eczane: {
    name: "Sağlık",
    pageBase: "eczane",
    rootPagePath: "saglik.html",
    titleUnit: "eczane",
    primaryRowTitle: "Eczaneler",
    dataFile: "data/eczane.json",
    secondaryDataFile: "data/nobetci-eczane.json",
    secondaryRowTitle: "Nöbetçi Eczaneler",
    tertiaryDataFile: "data/health-hospitals.json",
    quaternaryDataFile: "data/health-family-centers.json",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Sağlık alt kategorileri",
    subcategoryVenuePagePath: "saglik-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Eczaneler",
        countLabel: "eczane",
      },
      {
        source: "secondary",
        title: "Nöbetçi Eczaneler",
        countLabel: "nöbetçi eczane",
      },
      {
        source: "tertiary",
        title: "Hastaneler",
        countLabel: "hastane",
      },
      {
        source: "quaternary",
        title: "Aile Sağlığı Merkezleri",
        countLabel: "aile sağlığı merkezi",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: ["eczane", "pharmacy", "apteka", "saglik", "sağlık", "health", "klinik", "clinic"],
  },
  atm: {
    name: "ATM / Bankamatik",
    pageBase: "atm",
    titleUnit: "ATM noktası",
    dataFile: "data/atm.json",
    useDistrictCatalog: true,
    matcherKeywords: ["atm", "bankamatik", "cash", "cashpoint"],
  },
  kargo: {
    name: "Kargo Şubeleri",
    pageBase: "kargo",
    titleUnit: "kargo şubesi",
    dataFile: "data/kargo.json",
    useDistrictCatalog: true,
    matcherKeywords: ["kargo", "ptt", "yurtici", "aras", "mng", "surat", "ups", "dhl", "courier"],
  },
  noter: {
    name: "Noter",
    pageBase: "noter",
    titleUnit: "noter",
    dataFile: "data/noter.json",
    useDistrictCatalog: true,
    matcherKeywords: ["noter", "notary"],
  },
  asm: {
    name: "Aile Sağlığı Merkezi",
    pageBase: "asm",
    titleUnit: "aile sağlığı merkezi",
    dataFile: "data/asm.json",
    useDistrictCatalog: true,
    matcherKeywords: ["aile sagligi merkezi", "asm", "family health center", "saglik ocagi"],
  },
  "dis-klinikleri": {
    name: "Diş Klinikleri",
    pageBase: "dis-klinikleri",
    titleUnit: "diş kliniği",
    dataFile: "data/dis-klinikleri.json",
    useDistrictCatalog: true,
    matcherKeywords: ["dis klinigi", "dis", "dentist", "dental", "agiz dis sagligi"],
  },
  duraklar: {
    name: "Otobüs / Metro / Tramvay Durakları",
    pageBase: "duraklar",
    titleUnit: "durak",
    dataFile: "data/duraklar.json",
    useDistrictCatalog: true,
    matcherKeywords: ["durak", "bus stop", "metro", "tramvay", "tram", "istasyon", "station"],
  },
  seyahat: {
    name: "Gezi",
    pageBase: "gezi",
    titleUnit: "kamp alanı",
    dynamicTypeDataFile: "data/ktb-tesis-turleri-gezi.json",
    dynamicTypeVenueDataFile: "data/ktb-tesis-kayitlari-gezi.json",
    primaryRowTitle: "Kamp Alanları",
    dataFile: "data/gezi-kamp-alanlari.json",
    useDistrictCatalog: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Gezi alt kategorileri",
    subcategoryVenuePagePath: "gezi-mekanlar.html",
    districtLinkPages: [],
    matcherKeywords: [
      "gezi",
      "seyahat",
      "ulasim",
      "ulaşım",
      "kamp",
      "kamp alani",
      "kamp alanı",
      "camping",
      "kamping",
      "karavan",
      "butik otel",
      "bungalov",
      "pansiyon",
      "konaklama",
      "5 yildizli otel",
      "4 yildizli otel",
      "3 yildizli otel",
      "diger oteller",
      "otel",
      "hotel",
    ],
  },
  otopark: {
    name: "Otopark",
    pageBase: "otopark",
    titleUnit: "otopark",
    dataFile: "data/otopark.json",
    useDistrictCatalog: true,
    matcherKeywords: ["otopark", "parking", "car park"],
  },
  otel: {
    name: "Otel",
    pageBase: "otel",
    titleUnit: "otel",
    useDistrictCatalog: true,
    matcherKeywords: ["otel", "hotel", "resort", "pansiyon", "hostel", "bungalov", "apart"],
  },
  akaryakit: {
    name: "Keyif",
    pageBase: "keyif",
    titleUnit: "meyhane",
    dynamicTypeDataFile: "data/ktb-tesis-turleri-keyif.json",
    dynamicTypeVenueDataFile: "data/ktb-tesis-kayitlari-keyif.json",
    primaryRowTitle: "Meyhaneler",
    dataFile: "data/keyif.json",
    secondaryDataFile: "data/keyif-restoran.json",
    secondaryRowTitle: "Restoranlar",
    secondaryCountLabel: "restoran",
    tertiaryDataFile: "data/keyif-kahvalti.json",
    quaternaryDataFile: "data/keyif-kebap.json",
    quinaryDataFile: "data/keyif-kafe.json",
    senaryDataFile: "data/keyif-doner.json",
    septenaryDataFile: "data/keyif-pide.json",
    octonaryDataFile: "data/keyif-cigkofte.json",
    nonaryDataFile: "data/keyif-michelin-guide.json",
    denaryDataFile: "data/keyif-pub-bar.json",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Keyif alt kategorileri",
    subcategoryVenuePagePath: "keyif-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Meyhaneler",
        countLabel: "meyhane",
      },
      {
        source: "secondary",
        title: "Restoranlar",
        countLabel: "restoran",
      },
      {
        source: "tertiary",
        title: "Kahvaltı Mekanları",
        countLabel: "kahvaltı mekanı",
      },
      {
        source: "quaternary",
        title: "Kebapçılar",
        countLabel: "kebapçı",
      },
      {
        source: "quinary",
        title: "Kafeler",
        countLabel: "kafe",
      },
      {
        source: "senary",
        title: "Dönerciler",
        countLabel: "dönerci",
      },
      {
        source: "septenary",
        title: "Pide ve Lahmacun",
        countLabel: "pide ve lahmacun",
      },
      {
        source: "octonary",
        title: "Çiğ Köfteciler",
        countLabel: "çiğ köfteci",
      },
      {
        source: "nonary",
        title: "Michelin Guide",
        countLabel: "michelin guide mekanı",
      },
      {
        source: "denary",
        title: "Pub&Bar",
        countLabel: "pub&bar mekanı",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "keyif",
      "meyhane",
      "meyhaneler",
      "kafe",
      "cafe",
      "kahve",
      "coffee",
      "espresso",
      "taverna",
      "pub",
      "bar",
      "cocktail",
      "kokteyl",
      "lokanta",
      "lokantalar",
      "esnaf lokantasi",
      "esnaf lokantası",
      "fasil",
      "rakı",
      "raki",
      "michelin",
      "michelin guide",
    ],
  },
};

const RAW_REGION_GROUPS = [
  {
    title: "Marmara Bölgesi",
    provinces: [
      "Balıkesir",
      "Bilecik",
      "Bursa",
      "Çanakkale",
      "Edirne",
      "İstanbul",
      "Kırklareli",
      "Kocaeli",
      "Sakarya",
      "Tekirdağ",
      "Yalova",
    ],
  },
  {
    title: "Ege Bölgesi",
    provinces: ["Afyonkarahisar", "Aydın", "Denizli", "İzmir", "Kütahya", "Manisa", "Muğla", "Uşak"],
  },
  {
    title: "Akdeniz Bölgesi",
    provinces: ["Adana", "Antalya", "Burdur", "Hatay", "Isparta", "Mersin", "Kahramanmaraş", "Osmaniye"],
  },
  {
    title: "İç Anadolu Bölgesi",
    provinces: [
      "Aksaray",
      "Ankara",
      "Çankırı",
      "Eskişehir",
      "Karaman",
      "Kayseri",
      "Kırıkkale",
      "Kırşehir",
      "Konya",
      "Nevşehir",
      "Niğde",
      "Sivas",
      "Yozgat",
    ],
  },
  {
    title: "Karadeniz Bölgesi",
    provinces: [
      "Amasya",
      "Artvin",
      "Bartın",
      "Bayburt",
      "Bolu",
      "Çorum",
      "Düzce",
      "Giresun",
      "Gümüşhane",
      "Karabük",
      "Kastamonu",
      "Ordu",
      "Rize",
      "Samsun",
      "Sinop",
      "Tokat",
      "Trabzon",
      "Zonguldak",
    ],
  },
  {
    title: "Doğu Anadolu Bölgesi",
    provinces: [
      "Ağrı",
      "Ardahan",
      "Bingöl",
      "Bitlis",
      "Elazığ",
      "Erzincan",
      "Erzurum",
      "Hakkari",
      "Iğdır",
      "Kars",
      "Malatya",
      "Muş",
      "Tunceli",
      "Van",
    ],
  },
  {
    title: "Güneydoğu Anadolu Bölgesi",
    provinces: ["Adıyaman", "Batman", "Diyarbakır", "Gaziantep", "Kilis", "Mardin", "Siirt", "Şanlıurfa", "Şırnak"],
  },
];

const ALL_PROVINCES = RAW_REGION_GROUPS.flatMap((group) => group.provinces);
const ALL_PROVINCE_NAME_SET = new Set(ALL_PROVINCES.map((provinceName) => normalizeName(provinceName)));

let allVenuesPromise = null;
const categoryDataPromiseCache = new Map();
const rawArrayDataPromiseCache = new Map();
let districtMapPromise = null;

async function ensureFallbackScript(type) {
  const scriptSrc = FALLBACK_SCRIPTS[type];
  if (!scriptSrc || !runtime || typeof runtime.loadScriptOnce !== "function") {
    return false;
  }

  try {
    await runtime.loadScriptOnce(scriptSrc);
  } catch (_error) {
    return false;
  }

  return true;
}

async function ensureFallbackDataLoaded() {
  if (typeof window !== "undefined" && window.ARAMABUL_FALLBACK_DATA) {
    return true;
  }
  return ensureFallbackScript("data");
}

async function ensureFallbackFoodDataLoaded() {
  if (typeof window !== "undefined" && window.ARAMABUL_FALLBACK_FOOD_DATA) {
    return true;
  }
  return ensureFallbackScript("food");
}

async function ensureFallbackCategoryDataLoaded() {
  if (typeof window !== "undefined" && window.ARAMABUL_FALLBACK_CATEGORY_DATA) {
    return true;
  }
  return ensureFallbackScript("category");
}
function readFallbackData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.ARAMABUL_FALLBACK_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function applyCategoryPageTranslations() {
  const headerI18n = window.ARAMABUL_HEADER_I18N;
  if (!headerI18n || typeof headerI18n !== "object") {
    return;
  }

  if (typeof headerI18n.applyStaticPageTranslations === "function") {
    headerI18n.applyStaticPageTranslations();
  }

  if (typeof headerI18n.normalizeFooterUi === "function") {
    headerI18n.normalizeFooterUi();
  }
}

const DYNAMIC_CATEGORY_LABEL_TRANSLATIONS = {
  EN: {
    "Resmi Tesis Türleri": "Official Facility Types",
    "Apart Otel": "Aparthotel",
    "Butik Otel": "Boutique Hotel",
    "Camping": "Camping",
    "Kamping": "Camping",
    "Çiftlik Evi-köy Evi": "Farmhouse - Village House",
    "Çiftlik Evi-Köy Evi": "Farmhouse - Village House",
    "Dağ Evi": "Mountain House",
    "Gastronomi Tesisi": "Gastronomy Facility",
    "Günübirlik Tesis": "Day-use Facility",
    "Kırsal Turizm Tesisi": "Rural Tourism Facility",
    "Kış Sporları Mekanik Tesisi": "Winter Sports Mechanical Facility",
    "Konaklama Amaçlı Mesire Yeri": "Lodging Recreation Area",
    "Konaklamalı Orman Parkı": "Forest Park with Lodging",
    "Kongre Ve Sergi Merkezi": "Congress and Exhibition Center",
    "Mola Noktası": "Rest Stop",
    "Motel": "Motel",
    "Otel": "Hotel",
    "Otel, Golf Tesisi": "Hotel, Golf Facility",
    "Özel Konaklama Tesisi": "Private Accommodation Facility",
    "Özel Tesis": "Private Facility",
    "Pansiyon": "Guesthouse",
    "Plaj": "Beach",
    "Rıhtım Ve İskele": "Pier and Dock",
    "Rıhtım ve İskele": "Pier and Dock",
    "Tatil Köyü": "Holiday Village",
    "Tatil Köyü, Otel": "Holiday Village, Hotel",
    "Otel, Tatil Köyü": "Hotel, Holiday Village",
    "Termal Tesis": "Thermal Facility",
    "Yat Çekek Yeri": "Boatyard",
    "Yat Limanı": "Marina",
    "Yat Yanaşma Yeri": "Yacht Berthing Area",
    "Deniz Turizmi Araçları": "Marine Tourism Vehicles",
  },
  RU: {
    "Resmi Tesis Türleri": "Официальные типы объектов",
    "Apart Otel": "Апарт-отель",
    "Butik Otel": "Бутик-отель",
    "Camping": "Кемпинг",
    "Kamping": "Кемпинг",
    "Çiftlik Evi-köy Evi": "Фермерский дом - деревенский дом",
    "Çiftlik Evi-Köy Evi": "Фермерский дом - деревенский дом",
    "Dağ Evi": "Горный дом",
    "Gastronomi Tesisi": "Гастрономический объект",
    "Günübirlik Tesis": "Объект дневного пребывания",
    "Kırsal Turizm Tesisi": "Объект сельского туризма",
    "Kış Sporları Mekanik Tesisi": "Механический объект зимних видов спорта",
    "Konaklama Amaçlı Mesire Yeri": "Зона отдыха с размещением",
    "Konaklamalı Orman Parkı": "Лесной парк с размещением",
    "Kongre Ve Sergi Merkezi": "Конгрессно-выставочный центр",
    "Mola Noktası": "Пункт отдыха",
    "Motel": "Мотель",
    "Otel": "Отель",
    "Otel, Golf Tesisi": "Отель, гольф-объект",
    "Özel Konaklama Tesisi": "Частный объект размещения",
    "Özel Tesis": "Частный объект",
    "Pansiyon": "Пансион",
    "Plaj": "Пляж",
    "Rıhtım Ve İskele": "Причал и пирс",
    "Rıhtım ve İskele": "Причал и пирс",
    "Tatil Köyü": "Курортный поселок",
    "Tatil Köyü, Otel": "Курортный поселок, отель",
    "Otel, Tatil Köyü": "Отель, курортный поселок",
    "Termal Tesis": "Термальный объект",
    "Yat Çekek Yeri": "Яхт-верфь",
    "Yat Limanı": "Марина",
    "Yat Yanaşma Yeri": "Место швартовки яхт",
    "Deniz Turizmi Araçları": "Средства морского туризма",
  },
  DE: {
    "Resmi Tesis Türleri": "Offizielle Anlagetypen",
    "Apart Otel": "Apartmenthotel",
    "Butik Otel": "Boutique-Hotel",
    "Camping": "Camping",
    "Kamping": "Camping",
    "Çiftlik Evi-köy Evi": "Bauernhaus - Dorfhaus",
    "Çiftlik Evi-Köy Evi": "Bauernhaus - Dorfhaus",
    "Dağ Evi": "Berghaus",
    "Gastronomi Tesisi": "Gastronomiebetrieb",
    "Günübirlik Tesis": "Tagesanlage",
    "Kırsal Turizm Tesisi": "Ländliche Tourismusanlage",
    "Kış Sporları Mekanik Tesisi": "Mechanische Wintersportanlage",
    "Konaklama Amaçlı Mesire Yeri": "Erholungsgebiet mit Übernachtung",
    "Konaklamalı Orman Parkı": "Waldpark mit Übernachtung",
    "Kongre Ve Sergi Merkezi": "Kongress- und Messezentrum",
    "Mola Noktası": "Rastpunkt",
    "Motel": "Motel",
    "Otel": "Hotel",
    "Otel, Golf Tesisi": "Hotel, Golfanlage",
    "Özel Konaklama Tesisi": "Private Unterkunftsanlage",
    "Özel Tesis": "Private Anlage",
    "Pansiyon": "Pension",
    "Plaj": "Strand",
    "Rıhtım Ve İskele": "Kai und Pier",
    "Rıhtım ve İskele": "Kai und Pier",
    "Tatil Köyü": "Ferienresort",
    "Tatil Köyü, Otel": "Ferienresort, Hotel",
    "Otel, Tatil Köyü": "Hotel, Ferienresort",
    "Termal Tesis": "Thermalanlage",
    "Yat Çekek Yeri": "Bootswerft",
    "Yat Limanı": "Yachthafen",
    "Yat Yanaşma Yeri": "Yacht-Anlegestelle",
    "Deniz Turizmi Araçları": "Fahrzeuge für Meerestourismus",
  },
  ZH: {
    "Resmi Tesis Türleri": "官方设施类型",
    "Apart Otel": "公寓酒店",
    "Butik Otel": "精品酒店",
    "Camping": "露营地",
    "Kamping": "露营地",
    "Çiftlik Evi-köy Evi": "农庄/乡村民宿",
    "Çiftlik Evi-Köy Evi": "农庄/乡村民宿",
    "Dağ Evi": "山间小屋",
    "Gastronomi Tesisi": "美食设施",
    "Günübirlik Tesis": "一日游设施",
    "Kırsal Turizm Tesisi": "乡村旅游设施",
    "Kış Sporları Mekanik Tesisi": "冬季运动机械设施",
    "Konaklama Amaçlı Mesire Yeri": "可住宿休闲区",
    "Konaklamalı Orman Parkı": "可住宿森林公园",
    "Kongre Ve Sergi Merkezi": "会议与展览中心",
    "Mola Noktası": "休息点",
    "Motel": "汽车旅馆",
    "Otel": "酒店",
    "Otel, Golf Tesisi": "酒店/高尔夫设施",
    "Özel Konaklama Tesisi": "私人住宿设施",
    "Özel Tesis": "私人设施",
    "Pansiyon": "民宿",
    "Plaj": "海滩",
    "Rıhtım Ve İskele": "码头与栈桥",
    "Rıhtım ve İskele": "码头与栈桥",
    "Tatil Köyü": "度假村",
    "Tatil Köyü, Otel": "度假村/酒店",
    "Otel, Tatil Köyü": "酒店/度假村",
    "Termal Tesis": "温泉设施",
    "Yat Çekek Yeri": "游艇上排区",
    "Yat Limanı": "游艇码头",
    "Yat Yanaşma Yeri": "游艇靠泊点",
    "Deniz Turizmi Araçları": "海上旅游载具",
  },
};

function translateCategoryUiLabel(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const lang =
    typeof window.ARAMABUL_GET_LANGUAGE === "function"
      ? String(window.ARAMABUL_GET_LANGUAGE() || "TR").toUpperCase()
      : "TR";
  const headerI18n = window.ARAMABUL_HEADER_I18N;
  if (headerI18n && typeof headerI18n.getStaticUiTranslation === "function") {
    const translated = headerI18n.getStaticUiTranslation(text, lang) || text;
    if (translated !== text) {
      return translated;
    }
  }

  const fallbackMap = DYNAMIC_CATEGORY_LABEL_TRANSLATIONS[lang] || null;
  return (fallbackMap && fallbackMap[text]) || text;
}

function formatProvinceDistrictHeading(cityName, districtName, suffixText = "") {
  const city = String(cityName || "").trim();
  const district = String(districtName || "").trim();
  const suffix = String(suffixText || "").trim();
  const parts = [];

  if (city) {
    parts.push(`${city} ${translateCategoryUiLabel("İli")}`);
  }

  if (district) {
    parts.push(`${district} ${translateCategoryUiLabel("İlçesi")}`);
  }

  if (suffix) {
    const translatedSuffix = translateCategoryUiLabel(suffix);
    if (parts.length === 0) {
      parts.push(translatedSuffix);
    } else {
      parts[parts.length - 1] = `${parts[parts.length - 1]} ${translatedSuffix}`;
    }
  }

  return parts.join(" / ");
}

function readFallbackFoodData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.ARAMABUL_FALLBACK_FOOD_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

async function fallbackFoodVenues() {
  await ensureFallbackFoodDataLoaded();
  const payload = readFallbackFoodData();
  if (!payload || !Array.isArray(payload.yemek)) {
    return [];
  }

  return payload.yemek;
}

function matchesFallbackFoodKeywords(item, keywords) {
  if (!item || !Array.isArray(keywords) || keywords.length === 0) {
    return false;
  }

  const haystack = normalizeSearchText([
    item.cuisine,
    item.name,
    item.address,
  ].filter(Boolean).join(" "));

  return keywords.some((keyword) => haystack.includes(normalizeSearchText(keyword)));
}

function readFallbackCategoryData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.ARAMABUL_FALLBACK_CATEGORY_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

async function fallbackPayloadForDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return null;
  }

  if (cacheKey.includes("nobetci-eczane")) {
    await ensureFallbackCategoryDataLoaded();
    const fallbackCategory = readFallbackCategoryData();
    if (fallbackCategory && Array.isArray(fallbackCategory.nobetciEczane)) {
      return fallbackCategory.nobetciEczane;
    }
    return null;
  }

  if (cacheKey.includes("akaryakit")) {
    await ensureFallbackDataLoaded();
    const fallback = readFallbackData();
    if (fallback && Array.isArray(fallback.akaryakit)) {
      return fallback.akaryakit;
    }
  }

  if (cacheKey.includes("kuafor")) {
    await ensureFallbackDataLoaded();
    const fallback = readFallbackData();
    if (fallback && Array.isArray(fallback.kuafor)) {
      return fallback.kuafor;
    }
  }

  if (cacheKey.includes("veteriner")) {
    await ensureFallbackCategoryDataLoaded();
    const fallbackCategory = readFallbackCategoryData();
    if (fallbackCategory && Array.isArray(fallbackCategory.veteriner)) {
      return fallbackCategory.veteriner;
    }
  }

  if (cacheKey.includes("eczane")) {
    await ensureFallbackCategoryDataLoaded();
    const fallbackCategory = readFallbackCategoryData();
    if (fallbackCategory && Array.isArray(fallbackCategory.eczane)) {
      return fallbackCategory.eczane;
    }
  }

  if (cacheKey.includes("yemek") || cacheKey.includes("keyif") || cacheKey.includes("restoran") || cacheKey.includes("kafe")) {
    await ensureFallbackFoodDataLoaded();
    const foodVenues = await fallbackFoodVenues();
    if (foodVenues.length > 0) {
      return foodVenues;
    }
  }

  if (cacheKey.includes("kahvalti")) {
    await ensureFallbackFoodDataLoaded();
    return (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "kahvaltı",
      "kahvalti",
      "breakfast",
    ]));
  }

  if (cacheKey.includes("kebap")) {
    await ensureFallbackFoodDataLoaded();
    return (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "kebap",
      "ocakbaşı",
      "ocakbasi",
      "adana",
      "urfa",
    ]));
  }

  if (cacheKey.includes("doner")) {
    await ensureFallbackFoodDataLoaded();
    return (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "döner",
      "doner",
      "iskender",
    ]));
  }

  if (cacheKey.includes("pide")) {
    await ensureFallbackFoodDataLoaded();
    return (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "pide",
      "lahmacun",
      "kiymali",
      "kıymalı",
    ]));
  }

  if (cacheKey.includes("cigkofte")) {
    await ensureFallbackFoodDataLoaded();
    return (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "çiğ köfte",
      "cig kofte",
      "cigkofte",
    ]));
  }

  if (cacheKey.includes("meyhane")) {
    await ensureFallbackFoodDataLoaded();
    return (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "meyhane",
      "rakı",
      "raki",
      "meze",
    ]));
  }

  if (cacheKey.includes("otel") || cacheKey.includes("hotel")) {
    await ensureFallbackFoodDataLoaded();
    const foodVenues = (await fallbackFoodVenues()).filter((item) => matchesFallbackFoodKeywords(item, [
      "otel",
      "hotel",
      "konaklama",
      "pansiyon",
    ]));

    return foodVenues.length > 0 ? foodVenues : await fallbackFoodVenues();
  }

  return null;
}

function resolvePhoneText(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const direct = pickFirstText(
    payload.phone,
    payload.phoneNumber,
    payload.telephone,
    payload.tel,
    payload.telefon,
    payload.mobile,
    payload.gsm,
    payload.contactPhone,
    payload.contact_number,
    payload.internationalPhoneNumber,
    payload.nationalPhoneNumber,
  );
  if (direct) {
    return direct;
  }

  if (payload.contact && typeof payload.contact === "object") {
    const contactPhone = pickFirstText(
      payload.contact.phone,
      payload.contact.mobile,
      payload.contact.tel,
      payload.contact.telefon,
    );
    if (contactPhone) {
      return contactPhone;
    }
  }

  if (Array.isArray(payload.phones)) {
    const firstFromList = payload.phones
      .map((value) => String(value || "").trim())
      .find(Boolean);
    if (firstFromList) {
      return firstFromList;
    }
  }

  return "";
}

function isCoordinateQuery(queryText) {
  const compact = String(queryText || "").trim().replace(/\s+/g, "");
  return /^-?\d{1,3}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/.test(compact);
}

function buildVenueQueryText(venue) {
  const seen = new Set();
  const parts = [];

  [venue?.name, venue?.address, venue?.neighborhood, venue?.postalCode, venue?.district, venue?.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = normalizeName(value);
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      parts.push(value);
    });

  return parts.join(" ");
}

function buildMapsSearchUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", buildVenueQueryText(venue));

  if (typeof venue.sourcePlaceId === "string" && venue.sourcePlaceId.trim()) {
    mapsUrl.searchParams.set("query_place_id", venue.sourcePlaceId.trim());
  }

  return mapsUrl.toString();
}

function buildMapsEmbedUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps");
  mapsUrl.searchParams.set("q", buildVenueQueryText(venue));
  mapsUrl.searchParams.set("output", "embed");
  return mapsUrl.toString();
}

function sanitizeUrl(rawUrl) {
  const raw = String(rawUrl || "").trim();
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return "";
}

function mapsPlaceUrl(venue) {
  if (typeof venue.mapsUrl === "string" && venue.mapsUrl.trim()) {
    const raw = venue.mapsUrl.trim();

    try {
      const parsed = new URL(raw);
      const query = parsed.searchParams.get("query") || "";
      const placeId = parsed.searchParams.get("query_place_id") || "";

      if (isCoordinateQuery(query) && !placeId) {
        return buildMapsSearchUrl(venue);
      }

      return raw;
    } catch (_error) {
      return buildMapsSearchUrl(venue);
    }
  }

  return buildMapsSearchUrl(venue);
}

let mapFocusModalApi = null;

function ensureMapFocusModal() {
  if (mapFocusModalApi) {
    return mapFocusModalApi;
  }

  if (!document.body) {
    return null;
  }

  const modal = document.createElement("section");
  modal.className = "map-focus-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <button class="map-focus-backdrop" type="button" aria-label="Harita penceresini kapat"></button>
    <article class="map-focus-panel" role="dialog" aria-modal="true" aria-labelledby="mapFocusTitle">
      <header class="map-focus-head">
        <div class="map-focus-head-text">
          <p class="map-focus-eyebrow">Harita Odağı</p>
          <h3 id="mapFocusTitle" class="map-focus-title">Mekan</h3>
        </div>
        <button class="map-focus-close" type="button" aria-label="Kapat">Kapat</button>
      </header>
      <div class="map-focus-body">
        <aside class="map-focus-info-card" aria-label="Mekan bilgileri">
          <h4 class="map-focus-info-title">Mekan Bilgisi</h4>
          <dl class="map-focus-info-list">
            <div class="map-focus-info-row" data-info-row="phone-primary">
              <dt>Telefon No</dt>
              <dd data-info-field="phone-primary">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="location">
              <dt>Konum</dt>
              <dd data-info-field="location">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="address">
              <dt>Adres</dt>
              <dd data-info-field="address">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="website">
              <dt>Website</dt>
              <dd>
                <img class="map-focus-info-photo" data-info-field="photo" alt="Mekan görseli" loading="lazy" hidden />
                <a data-info-field="website" href="#" target="_blank" rel="noopener noreferrer">Siteye git</a>
              </dd>
            </div>
          </dl>
        </aside>
        <div class="map-focus-frame-wrap">
          <iframe
            class="map-focus-frame"
            title="Google Maps mekan görünümü"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      <footer class="map-focus-foot">
        <p class="map-focus-subtitle"></p>
        <a class="map-focus-external" href="#" target="_blank" rel="noopener noreferrer">Google Maps'te aç</a>
      </footer>
    </article>
  `;

  const titleNode = modal.querySelector(".map-focus-title");
  const subtitleNode = modal.querySelector(".map-focus-subtitle");
  const iframeNode = modal.querySelector(".map-focus-frame");
  const externalNode = modal.querySelector(".map-focus-external");
  const closeNode = modal.querySelector(".map-focus-close");
  const backdropNode = modal.querySelector(".map-focus-backdrop");
  const infoPhonePrimaryNode = modal.querySelector('[data-info-field="phone-primary"]');
  const infoLocationNode = modal.querySelector('[data-info-field="location"]');
  const infoAddressNode = modal.querySelector('[data-info-field="address"]');
  const infoWebsiteNode = modal.querySelector('[data-info-field="website"]');
  const infoPhotoNode = modal.querySelector('[data-info-field="photo"]');
  const infoPhonePrimaryRow = modal.querySelector('[data-info-row="phone-primary"]');
  const infoLocationRow = modal.querySelector('[data-info-row="location"]');
  const infoAddressRow = modal.querySelector('[data-info-row="address"]');
  const infoWebsiteRow = modal.querySelector('[data-info-row="website"]');

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("map-focus-open");
    if (iframeNode instanceof HTMLIFrameElement) {
      iframeNode.src = "about:blank";
    }
  };

  const open = (payload) => {
    const title = String(payload?.title || "").trim() || "Mekan";
    const subtitle = String(payload?.subtitle || "").trim();
    const embedUrl = String(payload?.embedUrl || "").trim();
    const externalUrl = String(payload?.externalUrl || "").trim() || embedUrl;

    if (!embedUrl || !(iframeNode instanceof HTMLIFrameElement)) {
      if (externalUrl) {
        window.open(externalUrl, "_blank", "noopener");
      }
      return;
    }

    if (titleNode) {
      titleNode.textContent = title;
    }
    if (subtitleNode) {
      subtitleNode.textContent = subtitle;
      subtitleNode.hidden = !subtitle;
    }
    if (externalNode instanceof HTMLAnchorElement) {
      externalNode.href = externalUrl;
    }

    const info = payload?.info && typeof payload.info === "object" ? payload.info : {};
    const infoLocation = String(info.location || subtitle || "").trim();
    const infoAddress = String(info.address || "").trim();
    const infoPhone = String(info.phone || "").trim();
    const infoWebsite = sanitizeUrl(info.website);
    const infoPhoto = sanitizeUrl(
      info.photoUrl || info.photoUri || info.imageUrl || info.image || info.coverImageUrl,
    );

    if (infoPhonePrimaryNode) {
      infoPhonePrimaryNode.textContent = infoPhone || "Bilgi yok";
    }
    if (infoLocationNode) {
      infoLocationNode.textContent = infoLocation || "-";
    }
    if (infoAddressNode) {
      infoAddressNode.textContent = infoAddress || "-";
    }
    if (infoWebsiteNode instanceof HTMLAnchorElement) {
      if (infoWebsite) {
        infoWebsiteNode.href = infoWebsite;
        infoWebsiteNode.textContent = infoWebsite;
      } else {
        infoWebsiteNode.removeAttribute("href");
        infoWebsiteNode.textContent = "";
      }
    }
    if (infoPhotoNode instanceof HTMLImageElement) {
      if (infoPhoto) {
        infoPhotoNode.src = infoPhoto;
        infoPhotoNode.hidden = false;
      } else {
        infoPhotoNode.removeAttribute("src");
        infoPhotoNode.hidden = true;
      }
    }

    if (infoPhonePrimaryRow instanceof HTMLElement) {
      infoPhonePrimaryRow.hidden = false;
    }
    if (infoLocationRow instanceof HTMLElement) {
      infoLocationRow.hidden = !infoLocation;
    }
    if (infoAddressRow instanceof HTMLElement) {
      infoAddressRow.hidden = !infoAddress;
    }
    if (infoWebsiteRow instanceof HTMLElement) {
      infoWebsiteRow.hidden = false;
    }

    iframeNode.src = embedUrl;
    modal.hidden = false;
    document.body.classList.add("map-focus-open");
  };

  closeNode?.addEventListener("click", close);
  backdropNode?.addEventListener("click", close);
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  document.body.append(modal);
  mapFocusModalApi = { open, close };
  return mapFocusModalApi;
}

function openVenueMapFocus(venue) {
  const api = ensureMapFocusModal();
  const externalUrl = mapsPlaceUrl(venue);
  const embedUrl = buildMapsEmbedUrl(venue);
  const subtitle = [venue.district, venue.city].map((value) => String(value || "").trim()).filter(Boolean).join(" / ");

  if (!api) {
    window.open(externalUrl, "_blank", "noopener");
    return;
  }

  api.open({
    title: String(venue.name || "").trim() || "Mekan",
    subtitle,
    embedUrl,
    externalUrl,
    info: {
      location: subtitle,
      address: String(venue.address || "").trim(),
      phone: String(venue.phone || "").trim(),
      website: String(venue.website || "").trim(),
      photoUrl: String(venue.photoUrl || "").trim(),
    },
  });
}

let nearbyVenuesModalApi = null;

function ensureNearbyVenuesModal() {
  if (nearbyVenuesModalApi) {
    return nearbyVenuesModalApi;
  }

  if (!document.body) {
    return null;
  }

  const modal = document.createElement("section");
  modal.className = "nearby-venues-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <button class="nearby-venues-backdrop" type="button" aria-label="Yakındaki mekanlar penceresini kapat"></button>
    <article class="nearby-venues-panel" role="dialog" aria-modal="true" aria-labelledby="nearbyVenuesTitle">
      <header class="nearby-venues-head">
        <div class="nearby-venues-head-copy">
          <p class="nearby-venues-eyebrow">Yakındaki Öneriler</p>
          <h3 id="nearbyVenuesTitle" class="nearby-venues-title">Yakındaki Mekanlar</h3>
          <p class="nearby-venues-subtitle"></p>
        </div>
        <button class="nearby-venues-close" type="button" aria-label="Kapat">Kapat</button>
      </header>
      <div class="nearby-venues-body">
        <ol class="nearby-venues-list"></ol>
      </div>
    </article>
  `;

  const titleNode = modal.querySelector(".nearby-venues-title");
  const subtitleNode = modal.querySelector(".nearby-venues-subtitle");
  const listNode = modal.querySelector(".nearby-venues-list");
  const closeNode = modal.querySelector(".nearby-venues-close");
  const backdropNode = modal.querySelector(".nearby-venues-backdrop");

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("nearby-venues-open");
    if (listNode instanceof HTMLOListElement) {
      listNode.innerHTML = "";
    }
  };

  const open = (payload) => {
    const title = String(payload?.title || "").trim() || "Yakındaki Mekanlar";
    const subtitle = String(payload?.subtitle || "").trim();
    const venues = Array.isArray(payload?.venues) ? payload.venues : [];

    if (!(listNode instanceof HTMLOListElement)) {
      return;
    }

    if (titleNode) {
      titleNode.textContent = title;
    }

    if (subtitleNode) {
      subtitleNode.textContent = subtitle;
      subtitleNode.hidden = !subtitle;
    }

    listNode.innerHTML = "";

    venues.forEach((venue, index) => {
      const item = document.createElement("li");
      item.className = "nearby-venues-item";

      const rank = document.createElement("span");
      rank.className = "nearby-venues-rank";
      rank.textContent = `${index + 1}`;

      const body = document.createElement("div");
      body.className = "nearby-venues-item-body";

      const titleLine = document.createElement("h4");
      titleLine.className = "nearby-venues-item-title";
      titleLine.textContent = String(venue?.name || "").trim() || "Mekan";

      const metaLine = document.createElement("p");
      metaLine.className = "nearby-venues-item-meta";
      const cityDistrict = [venue?.district, venue?.city].map((value) => String(value || "").trim()).filter(Boolean).join(" / ");
      const ratingValue = readNumericVenueRating(venue);
      const ratingText = ratingValue > 0 ? `⭐ ${ratingValue.toFixed(1)}` : "";
      metaLine.textContent = [cityDistrict, ratingText].filter(Boolean).join(" · ");

      const actions = document.createElement("div");
      actions.className = "nearby-venues-item-actions";

      const previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "nearby-venues-preview-btn";
      previewButton.textContent = "Haritada Önizle";
      previewButton.addEventListener("click", () => {
        openVenueMapFocus(venue);
      });

      const mapsLink = document.createElement("a");
      mapsLink.className = "nearby-venues-maps-link";
      mapsLink.href = mapsPlaceUrl(venue);
      mapsLink.target = "_blank";
      mapsLink.rel = "noopener noreferrer";
      mapsLink.textContent = "Google Maps";

      actions.append(previewButton, mapsLink);
      body.append(titleLine, metaLine, actions);
      item.append(rank, body);
      listNode.append(item);
    });

    modal.hidden = false;
    document.body.classList.add("nearby-venues-open");
  };

  closeNode?.addEventListener("click", close);
  backdropNode?.addEventListener("click", close);
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  document.body.append(modal);
  nearbyVenuesModalApi = { open, close };
  return nearbyVenuesModalApi;
}

function renderNearbyQuickAction(districtGrid, subcategoryTitle, citySourceVenues) {
  if (!districtGrid || !Array.isArray(citySourceVenues) || citySourceVenues.length === 0) {
    return;
  }

  const normalizedTitle = translateCategoryUiLabel(subcategoryTitle).toLocaleLowerCase("tr");
  const panel = document.createElement("article");
  panel.className = "nearby-action-card";

  const heading = document.createElement("h4");
  heading.className = "nearby-action-title";
  heading.textContent = `Yakınında ${normalizedTitle}`;

  const description = document.createElement("p");
  description.className = "nearby-action-description";
  description.textContent = "Konumunu kullanmama izin ver, sana en yakın restoranları listeleyeyim.";

  const actionRow = document.createElement("div");
  actionRow.className = "nearby-action-row";

  const triggerButton = document.createElement("button");
  triggerButton.type = "button";
  triggerButton.className = "nearby-action-btn";
  triggerButton.textContent = "Listele";

  const status = document.createElement("p");
  status.className = "nearby-action-status";
  status.setAttribute("aria-live", "polite");

  triggerButton.addEventListener("click", async () => {
    triggerButton.disabled = true;
    status.textContent = "Konum alınıyor...";

    try {
      const nearbyResult = await resolveNearbyVenuesForCurrentLocation(citySourceVenues, NEARBY_VENUE_RESULT_LIMIT);
      if (!Array.isArray(nearbyResult.venues) || nearbyResult.venues.length === 0) {
        status.textContent = "Konumuna yakın sonuç bulunamadı.";
        return;
      }

      const modalApi = ensureNearbyVenuesModal();
      if (!modalApi) {
        status.textContent = "Liste penceresi açılamadı.";
        return;
      }

      const locationLabel = [
        nearbyResult.matchedDistrict || nearbyResult.resolvedLocation.district,
        nearbyResult.matchedCity || nearbyResult.resolvedLocation.city,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" / ");

      modalApi.open({
        title: `Yakınındaki ${normalizedTitle}`,
        subtitle: locationLabel ? `${locationLabel} çevresine göre sıralandı` : "Konumuna göre sıralandı",
        venues: nearbyResult.venues,
      });

      status.textContent = `${nearbyResult.venues.length} işletme listelendi.`;
    } catch (error) {
      status.textContent = String(error?.message || "Konum bulunamadı.");
    } finally {
      triggerButton.disabled = false;
    }
  });

  actionRow.append(triggerButton);
  panel.append(heading, description, actionRow, status);
  districtGrid.append(panel);
}

let autoOpenedVenueKey = "";

function findRequestedVenue(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return null;
  }

  const { venueName, sourcePlaceId } = queryParams();
  const normalizedVenueName = normalizeName(venueName);
  const normalizedPlaceId = String(sourcePlaceId || "").trim();

  if (normalizedPlaceId) {
    const placeIdMatch = venues.find((venue) => {
      return String(venue?.sourcePlaceId || "").trim() === normalizedPlaceId;
    });
    if (placeIdMatch) {
      return placeIdMatch;
    }
  }

  if (!normalizedVenueName) {
    return null;
  }

  return venues.find((venue) => normalizeName(venue?.name) === normalizedVenueName) || null;
}

function autoOpenRequestedVenue(venues) {
  const targetVenue = findRequestedVenue(venues);
  if (!targetVenue) {
    return;
  }

  const nextKey = String(targetVenue.sourcePlaceId || "").trim()
    || `${normalizeName(targetVenue.city)}:${normalizeName(targetVenue.district)}:${normalizeName(targetVenue.name)}`;
  if (!nextKey || autoOpenedVenueKey === nextKey) {
    return;
  }

  autoOpenedVenueKey = nextKey;
  window.requestAnimationFrame(() => {
    openVenueMapFocus(targetVenue);
  });
}

function redirectRequestedVenueFromDistrictLinks(definition, matchedCity, matchedDistrict, venueGroups) {
  if (!definition || !matchedCity || !matchedDistrict || !Array.isArray(venueGroups) || venueGroups.length === 0) {
    return false;
  }

  const { venueName, sourcePlaceId } = queryParams();
  if (!String(venueName || "").trim() && !String(sourcePlaceId || "").trim()) {
    return false;
  }

  for (const group of venueGroups) {
    const pagePath = String(group?.pagePath || "").trim();
    const sourceVenues = Array.isArray(group?.venues) ? group.venues : [];
    if (!pagePath || sourceVenues.length === 0) {
      continue;
    }

    const targetVenue = findRequestedVenue(sourceVenues);
    if (!targetVenue) {
      continue;
    }

    const targetUrl = new URL(pagePath, window.location.href);
    targetUrl.searchParams.set("sehir", matchedCity);
    targetUrl.searchParams.set("ilce", matchedDistrict);
    targetUrl.searchParams.set("mekan", String(targetVenue.name || "").trim() || String(venueName || "").trim());

    const nextPlaceId = String(targetVenue.sourcePlaceId || sourcePlaceId || "").trim();
    if (nextPlaceId) {
      targetUrl.searchParams.set("pid", nextPlaceId);
    }

    const nextHref = `${targetUrl.pathname}${targetUrl.search}`;
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (nextHref !== currentHref) {
      window.location.replace(nextHref);
      return true;
    }
  }

  return false;
}

function venueSearchText(venue) {
  return normalizeSearchText(
    [venue.name, venue.cuisine, venue.address, venue.website, venue.editorialSummary, venue.instagram]
      .filter(Boolean)
      .join(" "),
  );
}

function matchCategory(venue, definition) {
  const searchable = venueSearchText(venue);

  return definition.matcherKeywords.some((keyword) => {
    if (keyword.length <= 2) {
      return searchable.split(/\s+/).includes(keyword);
    }

    return searchable.includes(keyword);
  });
}

function dedupeVenues(venues) {
  const seen = new Set();

  return venues.filter((venue) => {
    const key = venue.sourcePlaceId || `${normalizeName(venue.city)}:${normalizeName(venue.district)}:${normalizeName(venue.name)}`;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeByName(venues) {
  const seen = new Set();

  return venues
    .filter((venue) => {
      const key = venue.sourcePlaceId
        ? `pid:${venue.sourcePlaceId}`
        : `${normalizeName(venue.name)}:${normalizeName(venue.address || venue.mapsUrl || "")}`;

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "tr"));
}

function venueIdentityKeyForCount(venue) {
  if (!venue || typeof venue !== "object") {
    return "";
  }

  const placeId = String(venue.sourcePlaceId || "").trim();
  if (placeId) {
    return `pid:${placeId}`;
  }

  const cityKey = normalizeName(venue.city);
  const districtKey = normalizeName(venue.district);
  const nameKey = normalizeName(venue.name);
  if (!cityKey || !districtKey || !nameKey) {
    return "";
  }

  return `${cityKey}:${districtKey}:${nameKey}`;
}

function buildCityVenueCountMap(venues) {
  const counts = new Map();
  const seen = new Set();

  venues.forEach((venue) => {
    const identityKey = venueIdentityKeyForCount(venue);
    if (!identityKey || seen.has(identityKey)) {
      return;
    }
    seen.add(identityKey);

    const cityKey = normalizeName(venue.city);
    if (!cityKey) {
      return;
    }

    counts.set(cityKey, (counts.get(cityKey) || 0) + 1);
  });

  return counts;
}

function buildDistrictVenueCountMap(venues, cityName) {
  const counts = new Map();
  const seen = new Set();
  const cityKey = normalizeName(cityName);
  if (!cityKey) {
    return counts;
  }

  venues.forEach((venue) => {
    if (normalizeName(venue.city) !== cityKey) {
      return;
    }

    const identityKey = venueIdentityKeyForCount(venue);
    if (!identityKey || seen.has(identityKey)) {
      return;
    }
    seen.add(identityKey);

    const districtKey = normalizeName(venue.district);
    if (!districtKey) {
      return;
    }

    counts.set(districtKey, (counts.get(districtKey) || 0) + 1);
  });

  return counts;
}

function simplifyVenueBrandLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  let label = raw.split(" - ")[0].trim();
  label = label.replace(/\s*\([^)]*\)\s*/gu, " ").replace(/\s+/g, " ").trim();

  const removableTail = [
    " cafe",
    " kafe",
    " coffee",
    " coffe",
    " restaurant",
    " restoran",
    " bistro",
    " bakery",
    " pasta",
    " şubesi",
    " subesi",
    " şube",
    " sube",
    " avm",
    " outlet",
    " park",
  ];

  let normalized = label;
  let changed = true;
  while (changed && normalized) {
    changed = false;
    const lower = normalized.toLocaleLowerCase("tr");

    for (const suffix of removableTail) {
      if (!lower.endsWith(suffix)) {
        continue;
      }

      normalized = normalized.slice(0, Math.max(0, normalized.length - suffix.length)).trim();
      changed = true;
      break;
    }
  }

  return normalized || label;
}

function buildVenueBrandKey(venue) {
  const simplified = simplifyVenueBrandLabel(venue?.name);
  const cityKey = normalizeSearchText(String(venue?.city || ""));
  const districtKey = normalizeSearchText(String(venue?.district || ""));

  const genericTokens = new Set([
    "cafe",
    "kafe",
    "coffee",
    "coffe",
    "restaurant",
    "restoran",
    "bistro",
    "bakery",
    "pasta",
    "subesi",
    "sube",
    "şubesi",
    "şube",
    "avm",
    "outlet",
    "park",
  ]);

  const tokens = normalizeSearchText(simplified)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== cityKey && item !== districtKey)
    .filter((item) => !genericTokens.has(item));

  const signature = tokens.join(" ").trim();
  return normalizeName(signature || simplified || String(venue?.name || ""));
}

function venueInfoRichnessScore(venue) {
  let score = 0;

  if (String(venue?.sourcePlaceId || "").trim()) {
    score += 50;
  }
  if (String(venue?.placeId || "").trim()) {
    score += 50;
  }
  if (String(venue?.phone || "").trim()) {
    score += 10;
  }
  if (String(venue?.website || "").trim()) {
    score += 10;
  }
  if (String(venue?.mapsUrl || "").trim()) {
    score += 8;
  }
  if (String(venue?.photoUrl || "").trim()) {
    score += 6;
  }
  if (String(venue?.editorialSummary || "").trim()) {
    score += 4;
  }
  if (String(venue?.instagram || "").trim()) {
    score += 3;
  }

  score += readNumericVenueRating(venue) * 5;
  score += Math.min(20, readNumericVenueReviewCount(venue) / 100);

  return score;
}

function mergeVenueGroupForDisplay(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return [];
  }

  const groups = new Map();

  venues.forEach((venue) => {
    const groupKey = buildVenueBrandKey(venue);
    const existing = groups.get(groupKey);

    if (!existing) {
      groups.set(groupKey, [venue]);
      return;
    }

    existing.push(venue);
  });

  return [...groups.values()].map((group) => {
    if (group.length === 1) {
      return group[0];
    }

    const bestBase = [...group].sort((left, right) => {
      const scoreDiff = venueInfoRichnessScore(right) - venueInfoRichnessScore(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return String(left.name || "").length - String(right.name || "").length;
    })[0];

    const merged = { ...bestBase };
    const preferredLabel = [...group]
      .map((venue) => simplifyVenueBrandLabel(venue.name))
      .filter(Boolean)
      .sort((left, right) => left.length - right.length || left.localeCompare(right, "tr"))[0];

    if (preferredLabel) {
      merged.name = preferredLabel;
    }

    group.forEach((venue) => {
      [
        "address",
        "neighborhood",
        "postalCode",
        "mapsUrl",
        "website",
        "phone",
        "photoUrl",
        "editorialSummary",
        "instagram",
        "sourcePlaceId",
        "placeId",
        "googleRating",
        "googleReviewCount",
      ].forEach((field) => {
        if (!String(merged[field] || "").trim() && String(venue[field] || "").trim()) {
          merged[field] = venue[field];
        }
      });
    });

    return merged;
  });
}

function shouldMergeDisplayVenueGroups(definition) {
  const categoryKey = String(definition?.key || "").trim();
  return categoryKey === "akaryakit" || categoryKey === "hizmetler";
}

function classifyTransitVenueGroup(venue) {
  const searchBlob = [
    venue?.name,
    venue?.address,
    venue?.website,
  ]
    .map((value) => normalizeName(value))
    .filter(Boolean)
    .join(" ");

  if (!searchBlob) {
    return "fuel";
  }

  if (
    searchBlob.includes("sarj")
    || searchBlob.includes("şarj")
    || searchBlob.includes("charging")
    || searchBlob.includes("charger")
    || searchBlob.includes("supercharger")
    || searchBlob.includes("trugo")
    || searchBlob.includes("zes")
    || searchBlob.includes("esarj")
    || searchBlob.includes("eşarj")
    || searchBlob.includes("voltrun")
    || searchBlob.includes("charge")
  ) {
    return "charge";
  }

  if (
    searchBlob.includes("otopark")
    || searchBlob.includes("parking")
    || searchBlob.includes("ispark")
    || searchBlob.includes("vale")
  ) {
    return "parking";
  }

  if (
    searchBlob.includes("rent a car")
    || searchBlob.includes("araba kiralama")
    || searchBlob.includes("kiralama")
    || searchBlob.includes("oto yikama")
    || searchBlob.includes("otoyikama")
    || searchBlob.includes("otokuafo")
    || searchBlob.includes("otokuafor")
  ) {
    return "other";
  }

  return "fuel";
}

function splitTransitVenueGroups(venues) {
  const groups = {
    fuel: [],
    charge: [],
    parking: [],
    other: [],
  };

  venues.forEach((venue) => {
    const key = classifyTransitVenueGroup(venue);
    if (!groups[key]) {
      groups.fuel.push(venue);
      return;
    }
    groups[key].push(venue);
  });

  return groups;
}

function readNumericVenueRating(venue) {
  const candidates = [
    venue?.googleRating,
    venue?.rating,
    venue?.score,
    venue?.stars,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string") {
      const normalized = candidate.replace(",", ".").trim();
      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function readNumericVenueReviewCount(venue) {
  const candidates = [
    venue?.googleReviewCount,
    venue?.reviewCount,
    venue?.reviews,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string") {
      const digits = candidate.replace(/[^\d]/g, "");
      const parsed = Number.parseInt(digits, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function sortVenuesByGoogleRating(venues) {
  return [...venues].sort((left, right) => {
    const ratingDiff = readNumericVenueRating(right) - readNumericVenueRating(left);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    const reviewDiff = readNumericVenueReviewCount(right) - readNumericVenueReviewCount(left);
    if (reviewDiff !== 0) {
      return reviewDiff;
    }

    return String(left.name || "").localeCompare(String(right.name || ""), "tr");
  });
}

function parseDutyDateText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const match = text.match(/^(\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)/u);
  return match ? String(match[1] || "").trim() : "";
}

function resolveDutyDateLabel(venues) {
  const today = new Date();
  const todayLabel = `${today.getDate()} ${today.toLocaleDateString("tr-TR", { month: "long" })} ${today.toLocaleDateString("tr-TR", { weekday: "long" })}`;

  const labels = [...new Set(
    venues
      .map((venue) => String(venue.dutyDate || parseDutyDateText(venue.dutyInfo)).trim())
      .filter(Boolean),
  )];

  if (labels.includes(todayLabel)) {
    return todayLabel;
  }

  // Nöbetçi eczane başlığında her gün o günün tarihini göster.
  return todayLabel;
}

function groupedDistrictHospitals(venues, city, district) {
  const normalizedCity = normalizeName(city);
  const normalizedDistrict = normalizeName(district);
  const groups = new Map();

  venues.forEach((venue) => {
    const venueCity = normalizeName(venue.city);
    const venueDistrict = normalizeName(venue.district);
    const matchesCity = venueCity === normalizedCity;
    const matchesDistrict = venueDistrict === normalizedDistrict;
    const isCityWideHospital = matchesCity && !venueDistrict;

    if (!matchesCity || (!matchesDistrict && !isCityWideHospital)) {
      return;
    }

    const name = String(venue.name || "").trim();
    if (!name) {
      return;
    }

    const rawGroup = String(venue.hospitalGroup || "Hastaneler").trim() || "Hastaneler";
    const listed = groups.get(rawGroup) || [];
    listed.push(venue);
    groups.set(rawGroup, listed);
  });

  const result = [];
  groups.forEach((groupVenues, rawTitle) => {
    const deduped = dedupeByName(groupVenues);
    if (deduped.length === 0) {
      return;
    }

    const title = normalizeName(rawTitle) === normalizeName("Şehir Hastaneleri")
      ? "Şehir Hastanesi"
      : rawTitle;

    result.push({ title, venues: deduped });
  });

  return result.sort((left, right) => left.title.localeCompare(right.title, "tr"));
}

function groupedDistrictFamilyCenters(venues, city, district) {
  const normalizedCity = normalizeName(city);
  const normalizedDistrict = normalizeName(district);

  return dedupeByName(
    venues.filter((venue) => {
      return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
    }),
  );
}

function shouldDedupeDistrictNameSlices(definition) {
  const categoryKey = String(definition?.key || "").trim();
  return categoryKey !== "seyahat";
}

function filterDistrictVenueSlice(definition, venues, city, district) {
  const normalizedCity = normalizeName(city);
  const normalizedDistrict = normalizeName(district);
  const filtered = venues.filter((venue) => {
    return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
  });

  return shouldDedupeDistrictNameSlices(definition) ? dedupeByName(filtered) : filtered;
}

function renderVenueRow(title, venues, subtitle = "", options = {}) {
  const adContext = options && typeof options === "object" ? options.adContext : null;
  const adConfig = options && typeof options === "object" ? options.adConfig : null;
  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  const mainTitle = document.createElement("span");
  mainTitle.className = "province-region-title";
  mainTitle.textContent = title;
  rowTitle.append(mainTitle);

  if (subtitle) {
    const meta = document.createElement("span");
    meta.className = "province-region-meta";
    meta.textContent = subtitle;
    rowTitle.append(meta);
  }

  const chips = document.createElement("div");
  chips.className = "province-cities";

  venues.forEach((venue, index) => {
    const chip = document.createElement("button");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.type = "button";
    chip.textContent = venue.name;
    chip.setAttribute("aria-label", `${venue.name} kaydını harita penceresinde aç`);
    chip.addEventListener("click", () => {
      openVenueMapFocus(venue);
    });
    chips.append(chip);

    const shouldInsertAd = Boolean(
      adContext
      && adConfig
      && adContext.inserted !== true
      && venues.length > adConfig.insertAfter
      && index + 1 === adConfig.insertAfter,
    );
    if (shouldInsertAd) {
      const adCard = renderDistrictInlineAdCard(adConfig);
      if (adCard) {
        chips.append(adCard);
        adContext.inserted = true;
      }
    }
  });

  row.append(rowTitle, chips);
  return row;
}

function resolveDistrictMatches(
  venues,
  districtMap,
  useDistrictCatalog,
  navigationVenues = venues,
  preferVenueBackedDistricts = false,
) {
  const { city, district } = queryParams();
  const cityNames = (
    useDistrictCatalog
      ? Object.keys(districtMap).map((value) => String(value || "").trim()).filter(Boolean)
      : [...new Set(navigationVenues.map((venue) => venue.city).filter(Boolean))]
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(city, cityNames);

  let matchedDistrict = "";

  if (matchedCity) {
    const districtNames = resolveDistrictList(
      matchedCity,
      navigationVenues,
      districtMap || {},
      useDistrictCatalog,
      preferVenueBackedDistricts,
    );
    matchedDistrict = findNameMatch(district, districtNames);
  }

  return { matchedCity, matchedDistrict };
}

async function loadDistrictMap() {
  if (!districtMapPromise) {
    const normalizeDistrictMap = (payload) => {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return {};
      }

      const normalized = {};

      Object.entries(payload).forEach(([rawCity, rawDistricts]) => {
        const city = String(rawCity || "").trim();

        if (!city) {
          return;
        }

        const districts = Array.isArray(rawDistricts)
          ? [...new Set(rawDistricts.map((value) => String(value || "").trim()).filter(Boolean))]
          : [];

        normalized[city] = districts;
      });

      return normalized;
    };

    districtMapPromise = (async () => {
      try {
        const payload = await fetchJsonWithFallback(DISTRICTS_JSON_PATH, {});
        const normalized = normalizeDistrictMap(payload);
        if (Object.keys(normalized).length > 0) {
          return normalized;
        }
      } catch (_error) {
        // Use fallback below.
      }

      await ensureFallbackDataLoaded();
      const fallback = readFallbackData();
      return normalizeDistrictMap(fallback?.districts || {});
    })();
  }

  return districtMapPromise;
}

async function loadAllVenues() {
  if (!allVenuesPromise) {
    allVenuesPromise = fetchJsonWithFallback(CATEGORY_VENUES_JSON_PATH, [])
      .then((payload) => {
        if (!Array.isArray(payload)) {
          return [];
        }

        return payload.map((item) => ({
          city: String(item.city || "").trim(),
          district: String(item.district || "").trim(),
          name: String(item.name || "").trim(),
          cuisine: String(item.cuisine || "").trim(),
          address: String(item.address || "").trim(),
          neighborhood: String(item.neighborhood || item.mahalle || "").trim(),
          postalCode: String(item.postalCode || item.postcode || "").trim(),
          website: String(item.website || "").trim(),
          phone: resolvePhoneText(item),
          photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
          editorialSummary: String(item.editorialSummary || "").trim(),
          instagram: String(item.instagram || "").trim(),
          sourcePlaceId: typeof item.sourcePlaceId === "string" ? item.sourcePlaceId.trim() : "",
        }));
      })
      .catch((error) => {
        console.error(error);
        return [];
      });
  }

  return allVenuesPromise;
}

async function loadCategoryDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return [];
  }

  if (!categoryDataPromiseCache.has(cacheKey)) {
    const mapPayload = (payload) => {
      if (!Array.isArray(payload)) {
        return [];
      }

      const mappedVenues = payload.map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
        name: String(item.name || "").trim(),
        cuisine: String(item.cuisine || item.category || "").trim(),
        hospitalGroup: String(item.hospitalGroup || item.group || "").trim(),
        address: String(item.address || "").trim(),
        neighborhood: String(item.neighborhood || item.mahalle || "").trim(),
        postalCode: String(item.postalCode || item.postcode || "").trim(),
        mapsUrl: String(item.mapsUrl || "").trim(),
        website: String(item.website || "").trim(),
        phone: resolvePhoneText(item),
        photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
        editorialSummary: String(item.editorialSummary || "").trim(),
        instagram: String(item.instagram || "").trim(),
        dutyInfo: String(item.dutyInfo || "").trim(),
        dutyDate: String(item.dutyDate || "").trim(),
        googleRating: String(item.googleRating || item.rating || item.score || item.stars || "").trim(),
        googleReviewCount: String(item.googleReviewCount || item.reviewCount || item.reviews || "").trim(),
        sourcePlaceId: String(item.sourcePlaceId || item.placeId || "").trim(),
      }));

      if (!cacheKey.includes("akaryakit")) {
        return mappedVenues;
      }

      return mappedVenues.filter((venue) => {
        return ALL_PROVINCE_NAME_SET.has(normalizeName(venue.city));
      });
    };

    const promise = (async () => {
      const payload = await fetchJsonWithFallback(cacheKey, null);
      if (Array.isArray(payload)) {
        return mapPayload(payload);
      }

      const fallbackPayload = await fallbackPayloadForDataFile(cacheKey);
      return mapPayload(fallbackPayload);
    })().catch(() => []);

    categoryDataPromiseCache.set(cacheKey, promise);
  }

  return categoryDataPromiseCache.get(cacheKey);
}

async function loadRawArrayDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return [];
  }

  if (!rawArrayDataPromiseCache.has(cacheKey)) {
    const promise = (async () => {
      const payload = await fetchJsonWithFallback(cacheKey, null);
      if (Array.isArray(payload)) {
        return payload;
      }

      const fallbackPayload = await fallbackPayloadForDataFile(cacheKey);
      return Array.isArray(fallbackPayload) ? fallbackPayload : [];
    })().catch(() => []);

    rawArrayDataPromiseCache.set(cacheKey, promise);
  }

  return rawArrayDataPromiseCache.get(cacheKey);
}

async function loadCategoryVenues(categoryKey) {
  const baseDefinition = CATEGORY_DEFINITIONS[categoryKey];
  const definition = baseDefinition ? { key: categoryKey, ...baseDefinition } : null;

  if (!definition) {
    return [];
  }

  if (definition.dataFile) {
    const fileVenues = await loadCategoryDataFile(definition.dataFile);
    return dedupeVenues(
      fileVenues.filter((venue) => {
        return venue.city && venue.district && venue.name;
      }),
    );
  }

  const venues = await loadAllVenues();

  return dedupeVenues(
    venues.filter((venue) => {
      return venue.city && venue.district && venue.name && matchCategory(venue, definition);
    }),
  );
}

function regionGroupsForCities(citySet) {
  return RAW_REGION_GROUPS
    .map((group) => ({
      title: group.title,
      provinces: group.provinces.filter((provinceName) => citySet.has(provinceName)),
    }))
    .filter((group) => group.provinces.length > 0);
}

function hasUsableDistrictCatalog(districtMap) {
  if (!districtMap || typeof districtMap !== "object" || Array.isArray(districtMap)) {
    return false;
  }

  return Object.keys(districtMap).length > 0;
}

function venueDistrictsForCity(venues, cityName) {
  return [...new Set(
    venues
      .filter((venue) => normalizeName(venue.city) === normalizeName(cityName))
      .map((venue) => venue.district)
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));
}

function resolveDistrictList(
  matchedCity,
  venues,
  districtMap,
  useDistrictCatalog,
  preferVenueBackedDistricts = false,
) {
  const venueDistricts = venueDistrictsForCity(venues, matchedCity);
  const mergeUniqueDistricts = (primaryList, extraList = []) => {
    const seen = new Set();
    return [...primaryList, ...extraList]
      .map((value) => String(value || "").trim())
      .filter((value) => {
        const key = normalizeName(value);
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((left, right) => left.localeCompare(right, "tr"));
  };

  if (!useDistrictCatalog) {
    return venueDistricts;
  }

  const catalogDistricts = [...new Set(
    (districtMap[matchedCity] || [])
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));

  if (catalogDistricts.length > 0) {
    const catalogDistrictSet = new Set(catalogDistricts.map((value) => normalizeName(value)));
    const venueOnlyDistricts = venueDistricts.filter((value) => {
      return !catalogDistrictSet.has(normalizeName(value));
    });

    if (preferVenueBackedDistricts && venueDistricts.length > 0) {
      const venueDistrictSet = new Set(venueDistricts.map((value) => normalizeName(value)));
      const matchedCatalogDistricts = catalogDistricts.filter((value) => {
        return venueDistrictSet.has(normalizeName(value));
      });

      if (matchedCatalogDistricts.length > 0) {
        return mergeUniqueDistricts(matchedCatalogDistricts, venueOnlyDistricts);
      }

      return venueDistricts;
    }

    return mergeUniqueDistricts(catalogDistricts, venueOnlyDistricts);
  }

  return venueDistricts;
}

function renderRootPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeItems = [],
) {
  const groupGrid = document.querySelector("#categoryGroupGrid");

  if (!groupGrid) {
    return;
  }

  ensureRootCategoryMarquee();
  groupGrid.innerHTML = "";

  if (definition.rootSubcategoryFirst) {
    const row = document.createElement("article");
    row.className = "province-row";
    const staticDistrictLinkPages = Array.isArray(definition.districtLinkPages)
      ? definition.districtLinkPages
      : [];

    const headingStack = document.createElement("div");
    headingStack.className = "province-heading-stack";
    headingStack.style.minWidth = "0";
    headingStack.style.display = "grid";
    headingStack.style.alignContent = "start";
    headingStack.style.gap = "0.45rem";

    const rowHeadingText =
      translateCategoryUiLabel(String(definition.districtLinkHeading || `${definition.name} Türleri`).trim() || "Türler");
    const pageHeading = document.querySelector(".section-head.province-head h3");
    const pageHeadingText = pageHeading ? String(pageHeading.textContent || "").trim() : "";
    const shouldRenderRowTitle = staticDistrictLinkPages.length > 0
      && normalizeName(pageHeadingText) !== normalizeName(rowHeadingText);
    if (shouldRenderRowTitle) {
      const rowTitle = document.createElement("h4");
      rowTitle.className = "province-region";
      rowTitle.textContent = rowHeadingText;
      headingStack.append(rowTitle);
    }

    const chips = document.createElement("div");
    chips.className = "province-cities";

    staticDistrictLinkPages.forEach((item) => {
      const sourceVenues = item.source === "secondary"
        ? secondaryVenues
        : item.source === "tertiary"
          ? tertiaryVenues
          : item.source === "quaternary"
            ? quaternaryVenues
            : item.source === "quinary"
              ? quinaryVenues
              : item.source === "senary"
                ? senaryVenues
                : item.source === "septenary"
                  ? septenaryVenues
                  : item.source === "octonary"
                    ? octonaryVenues
                    : item.source === "nonary"
                      ? nonaryVenues
                    : item.source === "denary"
                      ? denaryVenues
                    : item.source === "undenary"
                      ? undenaryVenues
                    : venues;
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      chip.href = `${definition.pageBase}-city.html?tur=${encodeURIComponent(item.source)}`;
      chip.textContent = `${translateCategoryUiLabel(item.title)} (${sourceVenues.length})`;
      chip.setAttribute("aria-label", `${item.title} listesini aç`);
      chips.append(chip);
    });

    const shouldAppendDynamicToMainRow = staticDistrictLinkPages.length === 0;
    if (Array.isArray(dynamicTypeItems) && dynamicTypeItems.length > 0) {
      const dynamicChips = document.createElement("div");
      dynamicChips.className = "province-cities";

      const sortedDynamicTypeItems = [...dynamicTypeItems].sort((left, right) => {
        return String(left?.type || "").localeCompare(String(right?.type || ""), "tr");
      });

      sortedDynamicTypeItems.forEach((item) => {
        const typeLabel = String(item?.type || "").trim();
        const typeCount = Number(item?.count) || 0;
        if (!typeLabel || typeCount <= 0) {
          return;
        }

        const chip = document.createElement("a");
        chip.className = "province-pill yemek-pill yemek-pill-link";
        chip.href = `${definition.pageBase}-city.html?tur=dynamic&tt=${encodeURIComponent(typeLabel)}`;
        chip.textContent = `${translateCategoryUiLabel(typeLabel)} (${typeCount})`;
        chip.setAttribute("aria-label", `${typeLabel} için il listesini aç`);
        dynamicChips.append(chip);
      });

      if (dynamicChips.childElementCount > 0) {
        if (shouldAppendDynamicToMainRow) {
          chips.append(...Array.from(dynamicChips.children));
        } else {
          const dynamicRow = document.createElement("article");
          dynamicRow.className = "province-row";
          dynamicRow.style.gridTemplateColumns = "1fr";
          dynamicRow.append(dynamicChips);
          groupGrid.append(dynamicRow);
        }
      }
    }

    const categoryRootAdConfig = resolveCategoryRootAdConfig();
    const categoryRootAdCard = renderCategoryRootInlineAdCard(categoryRootAdConfig);
    if (categoryRootAdCard) {
      headingStack.append(categoryRootAdCard);
    }

    const hasStaticRowContent = headingStack.childElementCount > 0 || chips.childElementCount > 0;
    if (hasStaticRowContent) {
      if (headingStack.childElementCount > 0) {
        row.append(headingStack, chips);
      } else {
        row.style.gridTemplateColumns = "1fr";
        row.append(chips);
      }
      groupGrid.append(row);
    }
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const citySet = useDistrictCatalog
    ? new Set(Object.keys(districtMap))
    : new Set(venues.map((venue) => venue.city));
  let groups = regionGroupsForCities(citySet);

  if (groups.length === 0) {
    groups = regionGroupsForCities(new Set(ALL_PROVINCES));
  }

  if (groups.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = `${definition.name} için il verisi bulunamadı.`;
    groupGrid.append(empty);
    return;
  }

  const cityVenueCounts = buildCityVenueCountMap(venues);

  groups.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = group.title;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.provinces.forEach((provinceName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      chip.href = `${definition.pageBase}-city.html?sehir=${encodeURIComponent(provinceName)}`;
      const cityCount = cityVenueCounts.get(normalizeName(provinceName)) || 0;
      chip.textContent = `${provinceName} (${cityCount})`;
      chip.setAttribute("aria-label", `${provinceName} ilinin ilçelerini aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    groupGrid.append(row);
  });
}

function renderCityPage(
  definition,
  venues,
  districtMap = null,
  navigationVenues = venues,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeVenues = [],
) {
  const cityTitle = document.querySelector("#categoryCityTitle");
  const cityBreadcrumb = document.querySelector("#categoryCityBreadcrumb");
  const districtGrid = document.querySelector("#categoryDistrictGrid");
  const { city, subcategorySource: requestedSubcategorySource, facilityType } = queryParams();

  if (!districtGrid) {
    return;
  }

  const subcategorySource = requestedSubcategorySource || "primary";
  const dynamicTypeTitle = String(facilityType || "").trim() || "Resmi Tesis Türleri";
  const filteredDynamicTypeVenues = filterDynamicTypeVenues(dynamicTypeVenues, facilityType);
  const subcategoryDefinition = (definition.districtLinkPages || []).find((item) => item.source === subcategorySource)
    || (subcategorySource === "dynamic"
      ? { title: dynamicTypeTitle }
      : null)
    || { title: definition.primaryRowTitle || "Mekanlar" };
  const citySourceVenues = definition.rootSubcategoryFirst
    ? subcategorySource === "secondary"
      ? secondaryVenues
      : subcategorySource === "tertiary"
        ? tertiaryVenues
        : subcategorySource === "quaternary"
          ? quaternaryVenues
          : subcategorySource === "quinary"
            ? quinaryVenues
            : subcategorySource === "senary"
              ? senaryVenues
                : subcategorySource === "septenary"
                  ? septenaryVenues
                : subcategorySource === "octonary"
                  ? octonaryVenues
                : subcategorySource === "nonary"
                  ? nonaryVenues
                : subcategorySource === "denary"
                  ? denaryVenues
                : subcategorySource === "undenary"
                  ? undenaryVenues
                  : subcategorySource === "dynamic"
                    ? filteredDynamicTypeVenues
                  : venues
    : venues;

  if (definition.rootSubcategoryFirst) {
    districtGrid.innerHTML = "";

    const cityNames = [...new Set(citySourceVenues.map((venue) => String(venue.city || "").trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, "tr"));

    if (cityTitle) {
      cityTitle.textContent = translateCategoryUiLabel("İller");
    }

    if (cityBreadcrumb) {
      cityBreadcrumb.textContent = translateCategoryUiLabel(subcategoryDefinition.title);
    }

    document.title = `aramabul | ${translateCategoryUiLabel(subcategoryDefinition.title)} ${translateCategoryUiLabel("İller")}`;

    if (cityNames.length === 0) {
      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "Bu kategori için il verisi bulunamadı.";
      districtGrid.append(empty);
      return;
    }

    renderNearbyQuickAction(districtGrid, subcategoryDefinition.title, citySourceVenues);

    const row = document.createElement("article");
    row.className = "province-row";

    const rowTitle = document.createElement("h4");
    rowTitle.className = "province-region";
    rowTitle.textContent = translateCategoryUiLabel("İller");

    const chips = document.createElement("div");
    chips.className = "province-cities";
    const cityVenueCounts = buildCityVenueCountMap(citySourceVenues);

    cityNames.forEach((cityName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
        ? `&tt=${encodeURIComponent(facilityType)}`
        : "";
      chip.href = `${definition.pageBase}-district.html?tur=${encodeURIComponent(subcategorySource)}&sehir=${encodeURIComponent(cityName)}${facilityTypeQuery}`;
      const cityCount = cityVenueCounts.get(normalizeName(cityName)) || 0;
      chip.textContent = `${cityName} (${cityCount})`;
      chip.setAttribute("aria-label", `${cityName} ili ${subcategoryDefinition.title.toLocaleLowerCase("tr")} ilçelerini aç`);
      chips.append(chip);
    });

    row.append(rowTitle, chips);
    districtGrid.append(row);
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const cityNames = (
    useDistrictCatalog
      ? Object.keys(districtMap).map((value) => String(value || "").trim()).filter(Boolean)
      : [...new Set(navigationVenues.map((venue) => venue.city).filter(Boolean))]
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(city, cityNames);

  districtGrid.innerHTML = "";

  if (!matchedCity) {
    if (cityTitle) {
      cityTitle.textContent = translateCategoryUiLabel("İlçeler");
    }

    if (cityBreadcrumb) {
      cityBreadcrumb.textContent = "İl";
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için ilçe verisi bulunamadı.";
    districtGrid.append(empty);
    return;
  }

  const districts = resolveDistrictList(
    matchedCity,
    navigationVenues,
    districtMap || {},
    useDistrictCatalog,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (cityTitle) {
    cityTitle.textContent = `${matchedCity} ${translateCategoryUiLabel("İli")}`;
  }

  if (cityBreadcrumb) {
    cityBreadcrumb.textContent = matchedCity;
  }

  document.title = `aramabul | ${matchedCity} ${translateCategoryUiLabel("İli")}`;

  if (districts.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için ilçe verisi bulunamadı.";
    districtGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = translateCategoryUiLabel("İlçeler");

  const chips = document.createElement("div");
  chips.className = "province-cities";
  const districtVenueCounts = buildDistrictVenueCountMap(navigationVenues, matchedCity);

  districts.forEach((districtName) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = `${definition.pageBase}-district.html?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(districtName)}`;
    const districtCount = districtVenueCounts.get(normalizeName(districtName)) || 0;
    chip.textContent = `${districtName} (${districtCount})`;
    chip.setAttribute("aria-label", `${districtName} ilçesindeki mekanları aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  districtGrid.append(row);
}

function renderDistrictPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeVenues = [],
  navigationVenues = venues,
) {
  const districtTitle = document.querySelector("#categoryDistrictTitle");
  const districtBreadcrumb = document.querySelector("#categoryDistrictBreadcrumb");
  const districtCityLink = document.querySelector("#categoryDistrictCityLink");
  const venueGrid = document.querySelector("#categoryVenueGrid");
  const { subcategorySource: requestedSubcategorySource, facilityType } = queryParams();
  if (!venueGrid) {
    return;
  }

  const subcategorySource = requestedSubcategorySource || "primary";
  const dynamicTypeTitle = String(facilityType || "").trim() || "Resmi Tesis Türleri";
  const filteredDynamicTypeVenues = filterDynamicTypeVenues(dynamicTypeVenues, facilityType);
  const subcategoryDefinition = (definition.districtLinkPages || []).find((item) => item.source === subcategorySource)
    || (subcategorySource === "dynamic"
      ? { title: dynamicTypeTitle }
      : null)
    || { title: definition.primaryRowTitle || "Mekanlar" };

  if (definition.rootSubcategoryFirst) {
    const sourceVenues = subcategorySource === "secondary"
      ? secondaryVenues
      : subcategorySource === "tertiary"
        ? tertiaryVenues
        : subcategorySource === "quaternary"
          ? quaternaryVenues
          : subcategorySource === "quinary"
            ? quinaryVenues
            : subcategorySource === "senary"
              ? senaryVenues
                : subcategorySource === "septenary"
                  ? septenaryVenues
                : subcategorySource === "octonary"
                  ? octonaryVenues
                : subcategorySource === "nonary"
                  ? nonaryVenues
                : subcategorySource === "denary"
                  ? denaryVenues
                : subcategorySource === "undenary"
                  ? undenaryVenues
                  : subcategorySource === "dynamic"
                    ? filteredDynamicTypeVenues
          : venues;
    const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
    const { matchedCity } = resolveDistrictMatches(
      sourceVenues,
      districtMap || {},
      useDistrictCatalog,
      sourceVenues,
      Boolean(definition.preferVenueBackedDistricts),
    );

    if (districtCityLink) {
      districtCityLink.textContent = translateCategoryUiLabel(subcategoryDefinition.title);
      const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
        ? `&tt=${encodeURIComponent(facilityType)}`
        : "";
      districtCityLink.href = `${definition.pageBase}-city.html?tur=${encodeURIComponent(subcategorySource)}${facilityTypeQuery}`;
    }

    if (districtBreadcrumb) {
      districtBreadcrumb.textContent = matchedCity || translateCategoryUiLabel("İl");
    }

    venueGrid.innerHTML = "";

    if (!matchedCity) {
      if (districtTitle) {
        districtTitle.textContent = translateCategoryUiLabel("İlçeler");
      }

      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "Bu il için ilçe verisi bulunamadı.";
      venueGrid.append(empty);
      return;
    }

    const districts = resolveDistrictList(
      matchedCity,
      sourceVenues,
      districtMap || {},
      useDistrictCatalog,
      Boolean(definition.preferVenueBackedDistricts),
    );

    if (districtTitle) {
      districtTitle.textContent = `${matchedCity} ${translateCategoryUiLabel("İli")}`;
    }

    document.title = `aramabul | ${matchedCity} ${translateCategoryUiLabel("İli")}`;

    if (districts.length === 0) {
      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "Bu il için ilçe verisi bulunamadı.";
      venueGrid.append(empty);
      return;
    }

    const row = document.createElement("article");
    row.className = "province-row";

    const rowTitle = document.createElement("h4");
    rowTitle.className = "province-region";
    rowTitle.textContent = translateCategoryUiLabel("İlçeler");

    const chips = document.createElement("div");
    chips.className = "province-cities";
    const districtVenueCounts = buildDistrictVenueCountMap(sourceVenues, matchedCity);

    const venuePagePath = String(definition.subcategoryVenuePagePath || `${definition.pageBase}-mekanlar.html`).trim();

    districts.forEach((districtName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
        ? `&tt=${encodeURIComponent(facilityType)}`
        : "";
      chip.href =
        `${venuePagePath}?tur=${encodeURIComponent(subcategorySource)}&sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(districtName)}${facilityTypeQuery}`;
      const districtCount = districtVenueCounts.get(normalizeName(districtName)) || 0;
      chip.textContent = `${districtName} (${districtCount})`;
      chip.setAttribute("aria-label", `${districtName} ilçesindeki ${subcategoryDefinition.title.toLocaleLowerCase("tr")} listesini aç`);
      chips.append(chip);
    });

    row.append(rowTitle, chips);
    venueGrid.append(row);
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const { matchedCity, matchedDistrict } = resolveDistrictMatches(
    venues,
    districtMap || {},
    useDistrictCatalog,
    navigationVenues,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (districtCityLink) {
    districtCityLink.textContent = matchedCity || "İl";
    districtCityLink.href = matchedCity
      ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
      : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
  }

  if (districtBreadcrumb) {
    districtBreadcrumb.textContent = matchedDistrict || "İlçe";
  }

  venueGrid.innerHTML = "";

  if (!matchedCity || !matchedDistrict) {
    if (districtTitle) {
      districtTitle.textContent = "İlçe Mekanları";
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const districtVenues = filterDistrictVenueSlice(definition, venues, matchedCity, matchedDistrict);
  const districtSecondaryVenues = filterDistrictVenueSlice(definition, secondaryVenues, matchedCity, matchedDistrict);
  const hospitalGroups = groupedDistrictHospitals(tertiaryVenues, matchedCity, matchedDistrict);
  const districtFamilyCenters = groupedDistrictFamilyCenters(quaternaryVenues, matchedCity, matchedDistrict);
  const districtHospitalCount = hospitalGroups.reduce((sum, group) => sum + group.venues.length, 0);
  const dutyDateLabel = resolveDutyDateLabel(districtSecondaryVenues);
  const mergedPrimaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtVenues)
    : districtVenues;
  const mergedSecondaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSecondaryVenues)
    : districtSecondaryVenues;
  const isTransitCategory = String(definition?.key || "").trim() === "seyahat";
  const isHealthCategory = String(definition?.key || "").trim() === "eczane";
  const transitGroups = isTransitCategory
    ? splitTransitVenueGroups(mergedPrimaryVenues)
    : null;

  if (districtTitle) {
    const stats = [];
    if (isTransitCategory && transitGroups) {
      if (transitGroups.fuel.length > 0) {
        stats.push(`${transitGroups.fuel.length} adet akaryakıt istasyonu`);
      }
      if (transitGroups.charge.length > 0) {
        stats.push(`${transitGroups.charge.length} adet şarj istasyonu`);
      }
      if (transitGroups.parking.length > 0) {
        stats.push(`${transitGroups.parking.length} adet otopark`);
      }
      if (transitGroups.other.length > 0) {
        stats.push(`${transitGroups.other.length} adet diğer ulaşım noktası`);
      }
    } else {
      stats.push(`${mergedPrimaryVenues.length} adet ${definition.titleUnit}`);
    }
    if (mergedSecondaryVenues.length > 0) {
      const secondaryCountLabel =
        String(definition.secondaryCountLabel || definition.secondaryRowTitle || "ek mekan").trim() || "ek mekan";
      stats.push(`${mergedSecondaryVenues.length} adet ${secondaryCountLabel}`);
    }
    if (districtHospitalCount > 0) {
      stats.push(`${districtHospitalCount} adet hastane`);
    }
    if (districtFamilyCenters.length > 0) {
      stats.push(`${districtFamilyCenters.length} adet aile sağlığı merkezi`);
    }
    districtTitle.textContent = `${matchedDistrict} ${translateCategoryUiLabel("İlçesi")} (${stats.join(", ")})`;
  }

  document.title = `aramabul | ${formatProvinceDistrictHeading(matchedCity, matchedDistrict, definition.name)}`;

  if (
    mergedPrimaryVenues.length === 0
    && mergedSecondaryVenues.length === 0
    && districtHospitalCount === 0
    && districtFamilyCenters.length === 0
  ) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const districtInlineAdConfig = resolveDistrictInlineAdConfig();
  const districtInlineAdContext = { inserted: false };
  const districtRowRenderOptions = districtInlineAdConfig
    ? {
      adConfig: districtInlineAdConfig,
      adContext: districtInlineAdContext,
    }
    : null;

  const appendPrimaryVenues = () => {
    if (mergedPrimaryVenues.length === 0) {
      return;
    }

    if (isTransitCategory && transitGroups) {
      if (transitGroups.fuel.length > 0) {
        venueGrid.append(
          renderVenueRow(translateCategoryUiLabel("Akaryakıt İstasyonları"), transitGroups.fuel, "", districtRowRenderOptions),
        );
      }
      if (transitGroups.charge.length > 0) {
        venueGrid.append(
          renderVenueRow(translateCategoryUiLabel("Şarj İstasyonları"), transitGroups.charge, "", districtRowRenderOptions),
        );
      }
      if (transitGroups.parking.length > 0) {
        venueGrid.append(renderVenueRow(translateCategoryUiLabel("Otoparklar"), transitGroups.parking, "", districtRowRenderOptions));
      }
      if (transitGroups.other.length > 0) {
        venueGrid.append(
          renderVenueRow(translateCategoryUiLabel("Diğer Ulaşım Noktaları"), transitGroups.other, "", districtRowRenderOptions),
        );
      }
      return;
    }

    const primaryTitle = translateCategoryUiLabel(String(definition.primaryRowTitle || "Mekanlar").trim() || "Mekanlar");
    venueGrid.append(renderVenueRow(primaryTitle, mergedPrimaryVenues, "", districtRowRenderOptions));
  };

  const appendSecondaryVenues = () => {
    if (mergedSecondaryVenues.length === 0) {
      return;
    }

    const baseSecondaryTitle =
      translateCategoryUiLabel(String(definition.secondaryRowTitle || "Nöbetçi Eczaneler").trim() || "Nöbetçi Eczaneler");
    venueGrid.append(renderVenueRow(baseSecondaryTitle, mergedSecondaryVenues, dutyDateLabel, districtRowRenderOptions));
  };

  const appendHealthSupportRows = () => {
    hospitalGroups.forEach((group) => {
      venueGrid.append(renderVenueRow(group.title, group.venues, "", districtRowRenderOptions));
    });

    if (districtFamilyCenters.length > 0) {
      venueGrid.append(
        renderVenueRow(translateCategoryUiLabel("Aile Sağlığı Merkezleri"), districtFamilyCenters, "", districtRowRenderOptions),
      );
    }
  };

  if (isHealthCategory) {
    appendHealthSupportRows();
    appendPrimaryVenues();
    appendSecondaryVenues();
    autoOpenRequestedVenue([
      ...hospitalGroups.flatMap((group) => group.venues),
      ...districtFamilyCenters,
      ...mergedPrimaryVenues,
      ...mergedSecondaryVenues,
    ]);
    return;
  }

  appendPrimaryVenues();
  appendSecondaryVenues();
  appendHealthSupportRows();
  autoOpenRequestedVenue([
    ...mergedPrimaryVenues,
    ...mergedSecondaryVenues,
    ...hospitalGroups.flatMap((group) => group.venues),
    ...districtFamilyCenters,
  ]);
}

function renderDistrictLinkPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  navigationVenues = venues,
) {
  const districtTitle = document.querySelector("#categoryDistrictTitle");
  const districtBreadcrumb = document.querySelector("#categoryDistrictBreadcrumb");
  const districtCityLink = document.querySelector("#categoryDistrictCityLink");
  const venueGrid = document.querySelector("#categoryVenueGrid");

  if (!venueGrid) {
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const { matchedCity, matchedDistrict } = resolveDistrictMatches(
    venues,
    districtMap || {},
    useDistrictCatalog,
    navigationVenues,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (districtCityLink) {
    districtCityLink.textContent = matchedCity || "İl";
    districtCityLink.href = matchedCity
      ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
      : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
  }

  if (districtBreadcrumb) {
    districtBreadcrumb.textContent = matchedDistrict || "İlçe";
  }

  venueGrid.innerHTML = "";

  if (!matchedCity || !matchedDistrict) {
    if (districtTitle) {
      districtTitle.textContent = `${translateCategoryUiLabel("İlçe")} ${translateCategoryUiLabel(definition.name)} ${translateCategoryUiLabel("Türler")}`;
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const districtVenues = filterDistrictVenueSlice(definition, venues, matchedCity, matchedDistrict);
  const districtSecondaryVenues = filterDistrictVenueSlice(definition, secondaryVenues, matchedCity, matchedDistrict);
  const districtTertiaryVenues = filterDistrictVenueSlice(definition, tertiaryVenues, matchedCity, matchedDistrict);
  const districtQuaternaryVenues = filterDistrictVenueSlice(definition, quaternaryVenues, matchedCity, matchedDistrict);
  const districtQuinaryVenues = filterDistrictVenueSlice(definition, quinaryVenues, matchedCity, matchedDistrict);
  const districtSenaryVenues = filterDistrictVenueSlice(definition, senaryVenues, matchedCity, matchedDistrict);
  const districtSeptenaryVenues = filterDistrictVenueSlice(definition, septenaryVenues, matchedCity, matchedDistrict);
  const districtOctonaryVenues = filterDistrictVenueSlice(definition, octonaryVenues, matchedCity, matchedDistrict);
  const districtNonaryVenues = filterDistrictVenueSlice(definition, nonaryVenues, matchedCity, matchedDistrict);
  const districtDenaryVenues = filterDistrictVenueSlice(definition, denaryVenues, matchedCity, matchedDistrict);
  const districtUndenaryVenues = filterDistrictVenueSlice(definition, undenaryVenues, matchedCity, matchedDistrict);
  const preparedDistrictVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtVenues)
    : districtVenues;
  const preparedDistrictSecondaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSecondaryVenues)
    : districtSecondaryVenues;
  const preparedDistrictTertiaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtTertiaryVenues)
    : districtTertiaryVenues;
  const preparedDistrictQuaternaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtQuaternaryVenues)
    : districtQuaternaryVenues;
  const preparedDistrictQuinaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtQuinaryVenues)
    : districtQuinaryVenues;
  const preparedDistrictSenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSenaryVenues)
    : districtSenaryVenues;
  const preparedDistrictSeptenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSeptenaryVenues)
    : districtSeptenaryVenues;
  const preparedDistrictOctonaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtOctonaryVenues)
    : districtOctonaryVenues;
  const preparedDistrictNonaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtNonaryVenues)
    : districtNonaryVenues;
  const preparedDistrictDenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtDenaryVenues)
    : districtDenaryVenues;
  const preparedDistrictUndenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtUndenaryVenues)
    : districtUndenaryVenues;

  const linkDefinitions = Array.isArray(definition.districtLinkPages)
    ? definition.districtLinkPages
    : [];
  const groupedVenueSources = [
    { source: "primary", venues: preparedDistrictVenues },
    { source: "secondary", venues: preparedDistrictSecondaryVenues },
    { source: "tertiary", venues: preparedDistrictTertiaryVenues },
    { source: "quaternary", venues: preparedDistrictQuaternaryVenues },
    { source: "quinary", venues: preparedDistrictQuinaryVenues },
    { source: "senary", venues: preparedDistrictSenaryVenues },
    { source: "septenary", venues: preparedDistrictSeptenaryVenues },
    { source: "octonary", venues: preparedDistrictOctonaryVenues },
    { source: "nonary", venues: preparedDistrictNonaryVenues },
    { source: "denary", venues: preparedDistrictDenaryVenues },
    { source: "undenary", venues: preparedDistrictUndenaryVenues },
  ];

  const requestedVenueRedirect = redirectRequestedVenueFromDistrictLinks(
    definition,
    matchedCity,
    matchedDistrict,
    linkDefinitions.map((item) => {
      const matchedGroup = groupedVenueSources.find((group) => group.source === item.source)
        || groupedVenueSources[0];
      return {
        pagePath: item.pagePath,
        venues: matchedGroup ? matchedGroup.venues : [],
      };
    }),
  );
  if (requestedVenueRedirect) {
    return;
  }

  if (districtTitle) {
    districtTitle.textContent = formatProvinceDistrictHeading(matchedCity, matchedDistrict);
  }

  document.title = `aramabul | ${formatProvinceDistrictHeading(matchedCity, matchedDistrict, definition.name)}`;
  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent =
    translateCategoryUiLabel(String(definition.districtLinkHeading || `${definition.name} Türleri`).trim() || "Türler");

  const chips = document.createElement("div");
  chips.className = "province-cities";

  linkDefinitions.forEach((item) => {
    const sourceVenues = item.source === "secondary"
      ? preparedDistrictSecondaryVenues
      : item.source === "tertiary"
        ? preparedDistrictTertiaryVenues
        : item.source === "quaternary"
          ? preparedDistrictQuaternaryVenues
        : item.source === "quinary"
          ? preparedDistrictQuinaryVenues
        : item.source === "senary"
          ? preparedDistrictSenaryVenues
        : item.source === "septenary"
          ? preparedDistrictSeptenaryVenues
        : item.source === "octonary"
          ? preparedDistrictOctonaryVenues
        : item.source === "nonary"
          ? preparedDistrictNonaryVenues
        : item.source === "denary"
          ? preparedDistrictDenaryVenues
        : item.source === "undenary"
          ? preparedDistrictUndenaryVenues
        : preparedDistrictVenues;
    if (sourceVenues.length === 0) {
      return;
    }

    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = `${item.pagePath}?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(matchedDistrict)}`;
    chip.textContent = `${translateCategoryUiLabel(item.title)} (${sourceVenues.length})`;
    chip.setAttribute("aria-label", `${matchedDistrict} ilçesi ${item.title.toLocaleLowerCase("tr")} listesini aç`);
    chips.append(chip);
  });

  if (chips.children.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  row.append(rowTitle, chips);
  venueGrid.append(row);
}

function renderDistrictSubcategoryPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeVenues = [],
  navigationVenues = venues,
) {
  const body = document.body;
  const { subcategorySource: requestedSubcategorySource, facilityType } = queryParams();
  const subcategorySource = String(requestedSubcategorySource || body?.dataset?.subcategorySource || "primary").trim();
  const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
    ? `&tt=${encodeURIComponent(facilityType)}`
    : "";
  const dynamicTypeTitle = String(facilityType || "").trim() || "Resmi Tesis Türleri";
  const filteredDynamicTypeVenues = filterDynamicTypeVenues(dynamicTypeVenues, facilityType);
  const subcategoryDefinition = (definition.districtLinkPages || []).find((item) => item.source === subcategorySource)
    || (subcategorySource === "dynamic"
      ? { title: dynamicTypeTitle }
      : null)
    || (subcategorySource === "secondary"
      ? { title: definition.secondaryRowTitle || "Mekanlar" }
      : { title: definition.primaryRowTitle || "Mekanlar" });
  const pageTitle = document.querySelector("#categorySubcategoryTitle");
  const cityLink = document.querySelector("#categorySubcategoryCityLink");
  const districtLink = document.querySelector("#categorySubcategoryDistrictLink");
  const breadcrumb = document.querySelector("#categorySubcategoryBreadcrumb");
  const venueGrid = document.querySelector("#categorySubcategoryVenueGrid");

  if (!venueGrid) {
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const { matchedCity, matchedDistrict } = resolveDistrictMatches(
    venues,
    districtMap || {},
    useDistrictCatalog,
    navigationVenues,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (cityLink) {
    if (definition.rootSubcategoryFirst) {
      cityLink.textContent = translateCategoryUiLabel(subcategoryDefinition.title);
      cityLink.href = `${definition.pageBase}-city.html?tur=${encodeURIComponent(subcategorySource)}${facilityTypeQuery}`;
    } else {
      cityLink.textContent = matchedCity || "İl";
      cityLink.href = matchedCity
        ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
        : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
    }
  }

  if (districtLink) {
    if (definition.rootSubcategoryFirst) {
      districtLink.textContent = matchedCity || translateCategoryUiLabel("İl");
      districtLink.href = matchedCity
        ? `${definition.pageBase}-district.html?tur=${encodeURIComponent(subcategorySource)}&sehir=${encodeURIComponent(matchedCity)}${facilityTypeQuery}`
        : `${definition.pageBase}-city.html?tur=${encodeURIComponent(subcategorySource)}${facilityTypeQuery}`;
    } else {
      districtLink.textContent = matchedDistrict || "İlçe";
      districtLink.href = matchedCity && matchedDistrict
        ? `${definition.pageBase}-district.html?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(matchedDistrict)}`
        : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
    }
  }

  venueGrid.innerHTML = "";

  if (!matchedCity || !matchedDistrict) {
    if (pageTitle) {
      pageTitle.textContent = translateCategoryUiLabel("İlçe Mekanları");
    }
    if (breadcrumb) {
      breadcrumb.textContent = definition.rootSubcategoryFirst
        ? translateCategoryUiLabel("İlçe")
        : translateCategoryUiLabel("Mekanlar");
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const normalizedCity = normalizeName(matchedCity);
  const normalizedDistrict = normalizeName(matchedDistrict);
  const sourceVenues = subcategorySource === "secondary"
    ? secondaryVenues
    : subcategorySource === "tertiary"
      ? tertiaryVenues
      : subcategorySource === "quaternary"
        ? quaternaryVenues
      : subcategorySource === "quinary"
        ? quinaryVenues
      : subcategorySource === "senary"
        ? senaryVenues
      : subcategorySource === "septenary"
        ? septenaryVenues
      : subcategorySource === "octonary"
        ? octonaryVenues
      : subcategorySource === "nonary"
        ? nonaryVenues
      : subcategorySource === "denary"
        ? denaryVenues
      : subcategorySource === "undenary"
        ? undenaryVenues
      : subcategorySource === "dynamic"
        ? filteredDynamicTypeVenues
      : venues;
  const districtVenues = dedupeByName(
    sourceVenues.filter((venue) => {
      return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
    }),
  );

  if (breadcrumb) {
    breadcrumb.textContent = definition.rootSubcategoryFirst
      ? matchedDistrict
      : translateCategoryUiLabel(subcategoryDefinition.title);
  }

  if (pageTitle) {
    pageTitle.textContent = formatProvinceDistrictHeading(matchedCity, matchedDistrict, subcategoryDefinition.title);
  }

  document.title = `aramabul | ${formatProvinceDistrictHeading(matchedCity, matchedDistrict, subcategoryDefinition.title)}`;

  if (districtVenues.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const displayDistrictVenues =
    shouldMergeDisplayVenueGroups(definition)
      ? mergeVenueGroupForDisplay(districtVenues)
      : districtVenues;
  const orderedDistrictVenues =
    definition.key === "akaryakit"
      ? sortVenuesByGoogleRating(displayDistrictVenues)
      : districtVenues;

  const districtInlineAdConfig = resolveDistrictInlineAdConfig();
  const districtInlineAdOptions = districtInlineAdConfig
    ? {
      adConfig: districtInlineAdConfig,
      adContext: { inserted: false },
    }
    : null;
  venueGrid.append(
    renderVenueRow(
      translateCategoryUiLabel(subcategoryDefinition.title),
      orderedDistrictVenues,
      "",
      districtInlineAdOptions,
    ),
  );
  autoOpenRequestedVenue(orderedDistrictVenues);
}

async function initCategoryPage() {
  const body = document.body;

  if (!body) {
    return;
  }

  const categoryKey = String(body.dataset.categoryKey || "").trim();
  const pageType = String(body.dataset.categoryPage || "").trim();
  const params = queryParams();
  const requestedSubcategorySource = params.subcategorySource;
  const requestedFacilityType = params.facilityType;
  const subcategorySource = String(requestedSubcategorySource || body.dataset.subcategorySource || "primary").trim();
  const baseDefinition = CATEGORY_DEFINITIONS[categoryKey];
  const definition = baseDefinition ? { key: categoryKey, ...baseDefinition } : null;

  if (!definition) {
    return;
  }

  const adConfigPromise = ensureDistrictInlineAdConfigLoaded();
  const districtMapPromise = definition.useDistrictCatalog ? loadDistrictMap() : Promise.resolve(null);
  const districtMap = await districtMapPromise;
  const canUseDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const requiresVenueBackedNavigation = Boolean(definition.preferVenueBackedDistricts)
    && (pageType === "city" || pageType === "district-links");

  const loadPrimaryVenues =
    pageType === "district"
    || pageType === "city"
    || pageType === "district-links"
    || (requiresVenueBackedNavigation && Boolean(definition.dataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.dataFile))
    || (!canUseDistrictCatalog && pageType === "root")
    || (pageType === "district-subcategory" && (subcategorySource === "primary" || !canUseDistrictCatalog));

  const loadSecondaryVenues =
    (pageType === "district" && Boolean(definition.secondaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.secondaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.secondaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "secondary");

  const loadTertiaryVenues =
    (pageType === "district" && Boolean(definition.tertiaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.tertiaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.tertiaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "tertiary");

  const loadQuaternaryVenues =
    (pageType === "district" && Boolean(definition.quaternaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.quaternaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.quaternaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "quaternary");

  const loadQuinaryVenues =
    (pageType === "district" && Boolean(definition.quinaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.quinaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.quinaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "quinary");
  const loadSenaryVenues =
    (pageType === "district" && Boolean(definition.senaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.senaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.senaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "senary");
  const loadSeptenaryVenues =
    (pageType === "district" && Boolean(definition.septenaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.septenaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.septenaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "septenary");
  const loadOctonaryVenues =
    (pageType === "district" && Boolean(definition.octonaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.octonaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.octonaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "octonary");
  const loadNonaryVenues =
    (pageType === "district" && Boolean(definition.nonaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.nonaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.nonaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "nonary");
  const loadDenaryVenues =
    (pageType === "district" && Boolean(definition.denaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.denaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.denaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "denary");
  const loadUndenaryVenues =
    (pageType === "district" && Boolean(definition.undenaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.undenaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.undenaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "undenary");
  const loadDynamicTypeItems =
    pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.dynamicTypeDataFile);
  const loadDynamicTypeVenues =
    Boolean(definition.dynamicTypeVenueDataFile)
    && (pageType === "city" || pageType === "district" || pageType === "district-subcategory")
    && subcategorySource === "dynamic";
  const [
    venues,
    secondaryVenues,
    tertiaryVenues,
    quaternaryVenues,
    quinaryVenues,
    senaryVenues,
    septenaryVenues,
    octonaryVenues,
    nonaryVenues,
    denaryVenues,
    undenaryVenues,
    rawDynamicTypeItems,
    rawDynamicTypeVenues,
  ] = await Promise.all([
    loadPrimaryVenues ? loadCategoryVenues(categoryKey) : Promise.resolve([]),
    loadSecondaryVenues && definition.secondaryDataFile
      ? loadCategoryDataFile(definition.secondaryDataFile)
      : Promise.resolve([]),
    loadTertiaryVenues && definition.tertiaryDataFile
      ? loadCategoryDataFile(definition.tertiaryDataFile)
      : Promise.resolve([]),
    loadQuaternaryVenues && definition.quaternaryDataFile
      ? loadCategoryDataFile(definition.quaternaryDataFile)
      : Promise.resolve([]),
    loadQuinaryVenues && definition.quinaryDataFile
      ? loadCategoryDataFile(definition.quinaryDataFile)
      : Promise.resolve([]),
    loadSenaryVenues && definition.senaryDataFile
      ? loadCategoryDataFile(definition.senaryDataFile)
      : Promise.resolve([]),
    loadSeptenaryVenues && definition.septenaryDataFile
      ? loadCategoryDataFile(definition.septenaryDataFile)
      : Promise.resolve([]),
    loadOctonaryVenues && definition.octonaryDataFile
      ? loadCategoryDataFile(definition.octonaryDataFile)
      : Promise.resolve([]),
    loadNonaryVenues && definition.nonaryDataFile
      ? loadCategoryDataFile(definition.nonaryDataFile)
      : Promise.resolve([]),
    loadDenaryVenues && definition.denaryDataFile
      ? loadCategoryDataFile(definition.denaryDataFile)
      : Promise.resolve([]),
    loadUndenaryVenues && definition.undenaryDataFile
      ? loadCategoryDataFile(definition.undenaryDataFile)
      : Promise.resolve([]),
    loadDynamicTypeItems && definition.dynamicTypeDataFile
      ? loadRawArrayDataFile(definition.dynamicTypeDataFile)
      : Promise.resolve([]),
    loadDynamicTypeVenues && definition.dynamicTypeVenueDataFile
      ? loadCategoryDataFile(definition.dynamicTypeVenueDataFile)
      : Promise.resolve([]),
  ]);
  const dynamicTypeItems = rawDynamicTypeItems
    .map((item) => ({
      type: String(item?.type || "").trim(),
      count: Number(item?.count) || 0,
    }))
    .filter((item) => item.type && item.count > 0);
  let dynamicTypeVenues = rawDynamicTypeVenues;

  if (definition.key === "seyahat" && subcategorySource === "dynamic") {
    const mergedLegacyVenues = [];

    if (isCampingFacilityType(requestedFacilityType)) {
      const legacyCampingVenues = venues.length > 0
        ? venues
        : await loadCategoryVenues(categoryKey);
      mergedLegacyVenues.push(...legacyCampingVenues.map((venue) => mapLegacyCampingVenueToDynamicVenue(venue)));
    }

    if (isHotelFacilityType(requestedFacilityType)) {
      const legacyHotelVenueGroups = await Promise.all(
        LEGACY_SEYAHAT_HOTEL_DATA_FILES.map((path) => loadCategoryDataFile(path)),
      );
      mergedLegacyVenues.push(
        ...legacyHotelVenueGroups
          .flat()
          .map((venue) => mapLegacyHotelVenueToDynamicVenue(venue)),
      );
    }

    if (mergedLegacyVenues.length > 0) {
      dynamicTypeVenues = dedupeDynamicTypeVenues([
        ...rawDynamicTypeVenues,
        ...mergedLegacyVenues,
      ]);
    }
  }

  const navigationVenues = definition.includeSecondaryInNavigation
    ? dedupeVenues([
      ...venues,
      ...secondaryVenues,
      ...tertiaryVenues,
      ...quaternaryVenues,
      ...quinaryVenues,
      ...senaryVenues,
      ...septenaryVenues,
      ...octonaryVenues,
      ...nonaryVenues,
      ...denaryVenues,
      ...undenaryVenues,
    ])
    : venues;

  await adConfigPromise;

  if (pageType === "root") {
    renderRootPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeItems,
    );
    applyCategoryPageTranslations();
    return;
  }

  if (pageType === "city") {
    renderCityPage(
      definition,
      venues,
      districtMap,
      navigationVenues,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeVenues,
    );
    applyCategoryPageTranslations();
    return;
  }

  if (pageType === "district") {
    renderDistrictPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeVenues,
      navigationVenues,
    );
    applyCategoryPageTranslations();
    return;
  }

  if (pageType === "district-links") {
    renderDistrictLinkPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      navigationVenues,
    );
    applyCategoryPageTranslations();
    return;
  }

  if (pageType === "district-subcategory") {
    renderDistrictSubcategoryPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeVenues,
      navigationVenues,
    );
    applyCategoryPageTranslations();
  }
}

void initCategoryPage();
