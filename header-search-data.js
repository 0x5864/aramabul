(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const CATEGORY_SEARCH_ROUTES = [
    { href: "keyif.html", keywords: ["yemek", "food", "restoran", "restaurant", "lokanta"] },
    { href: "hizmetler.html", keywords: ["hizmetler", "service", "services", "akaryakit", "akaryakıt", "benzin", "petrol", "fuel"] },
    { href: "kuafor.html", keywords: ["kuafor", "kuaför", "berber", "sac", "saç", "guzellik", "güzellik"] },
    { href: "veteriner.html", keywords: ["veteriner", "vet", "hayvan"] },
    { href: "saglik.html", keywords: ["eczane", "pharmacy", "saglik", "sağlık", "health", "klinik", "clinic"] },
    { href: "market.html", keywords: ["market", "supermarket", "süpermarket", "bakkal"] },
    { href: "keyif.html", keywords: ["keyif", "meyhane", "meyhaneler", "rakı", "raki", "kafe", "cafe", "kahve", "kahvaltı", "kahvalti", "kebap", "doner", "döner", "pide", "lahmacun", "cigkofte", "çiğ köfte"] },
    { href: "hastane.html", keywords: ["hastane", "hospital"] },
    { href: "banka.html", keywords: ["banka", "bank"] },
    { href: "otel.html", keywords: ["otel", "hotel", "konaklama"] },
    { href: "gezi.html", keywords: ["gezi", "seyahat", "travel", "transport", "kamp", "kamp alani", "kamp alanı", "camping", "kamping", "karavan", "bungalov", "pansiyon", "konaklama", "otel"] },
    { href: "atm.html", keywords: ["atm"] },
    { href: "kargo.html", keywords: ["kargo", "cargo"] },
    { href: "noter.html", keywords: ["noter", "notary"] },
    { href: "asm.html", keywords: ["asm", "aile sagligi", "aile sağlığı", "aile hekimi"] },
    { href: "dis-klinikleri.html", keywords: ["dis", "diş", "dis klinigi", "diş kliniği", "dentist"] },
    { href: "duraklar.html", keywords: ["durak", "duraklar", "otobus", "otobüs", "metro", "tramvay"] },
    { href: "otopark.html", keywords: ["otopark", "park"] },
  ];
  const FALLBACK_SCRIPTS = Object.freeze({
    ARAMABUL_FALLBACK_DATA: "data/fallback-data.js?v=20260302-01",
    ARAMABUL_FALLBACK_FOOD_DATA: "data/fallback-food-data.js?v=20260302-01",
    ARAMABUL_FALLBACK_CATEGORY_DATA: "data/fallback-category-data.js?v=20260302-01",
  });
  const VENUES_JSON_PATH = "data/venues.json";
  const FOOD_JSON_PATH = "data/keyif-food.json";
  const DISTRICTS_JSON_PATH = "data/districts.json";
  const CATEGORY_DATASET_SOURCES = [
    {
      pageBase: "kuafor",
      dataPath: "data/kuafor.json",
      fallbacks: [{ globalKey: "ARAMABUL_FALLBACK_DATA", property: "kuafor" }],
    },
    {
      pageBase: "veteriner",
      dataPath: "data/veteriner.json",
      fallbacks: [{ globalKey: "ARAMABUL_FALLBACK_CATEGORY_DATA", property: "veteriner" }],
    },
    {
      pageBase: "eczane",
      dataPath: "data/eczane.json",
      fallbacks: [{ globalKey: "ARAMABUL_FALLBACK_CATEGORY_DATA", property: "eczane" }],
    },
    { pageBase: "eczane", dataPath: "data/nobetci-eczane.json", fallbacks: [] },
    {
      pageBase: "keyif",
      dataPath: "data/keyif.json",
      fallbacks: [],
    },
    { pageBase: "keyif", dataPath: "data/keyif-restoran.json", fallbacks: [] },
    { pageBase: "atm", dataPath: "data/atm.json", fallbacks: [] },
    { pageBase: "kargo", dataPath: "data/kargo.json", fallbacks: [] },
    { pageBase: "noter", dataPath: "data/noter.json", fallbacks: [] },
    { pageBase: "asm", dataPath: "data/asm.json", fallbacks: [] },
    { pageBase: "dis-klinikleri", dataPath: "data/dis-klinikleri.json", fallbacks: [] },
    { pageBase: "duraklar", dataPath: "data/duraklar.json", fallbacks: [] },
    { pageBase: "otopark", dataPath: "data/otopark.json", fallbacks: [] },
  ];
  const DISTRICT_ROUTE_PAGE_BASES = new Set([
    "yemek",
    "hizmetler",
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const CITY_ROUTE_PAGE_BASES = new Set([
    "yemek",
    "hizmetler",
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const API_BASE_URL = (() => {
    if (typeof window.ARAMABUL_API_BASE === "string" && window.ARAMABUL_API_BASE.trim()) {
      return window.ARAMABUL_API_BASE.trim().replace(/\/+$/u, "");
    }

    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
      return `${window.location.protocol}//${window.location.hostname}:8787`;
    }

    return window.location.origin;
  })();
  const VENUES_API_ENDPOINT =
    typeof window.ARAMABUL_VENUES_API === "string" && window.ARAMABUL_VENUES_API.trim()
      ? window.ARAMABUL_VENUES_API.trim()
      : API_BASE_URL
        ? `${API_BASE_URL}/api/venues?limit=50000`
        : "";
  const turkishCharMap = {
    ç: "c",
    ğ: "g",
    ı: "i",
    i: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };

  let venuesPromise = null;
  let searchRecordsPromise = null;
  let cityNamesPromise = null;

  async function ensureFallbackGlobal(globalKey) {
    if (window[globalKey]) {
      return true;
    }

    const scriptSrc = FALLBACK_SCRIPTS[globalKey];
    if (!scriptSrc || !runtime || typeof runtime.loadScriptOnce !== "function") {
      return false;
    }

    try {
      await runtime.loadScriptOnce(scriptSrc);
    } catch (_error) {
      return false;
    }

    return Boolean(window[globalKey]);
  }
  function normalizeForSearch(value) {
    return String(value || "")
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
      .normalize("NFC");
  }

  function canonicalize(value) {
    return normalizeForSearch(value)
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toSlug(value) {
    return normalizeForSearch(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function sanitizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function normalizeVenueRecord(record, options = {}) {
    if (!record || typeof record !== "object") {
      return null;
    }

    const name = sanitizeText(record.name);
    const city = sanitizeText(record.city);
    const district = sanitizeText(record.district);
    const neighborhood = sanitizeText(record.neighborhood || record.mahalle);
    const postalCode = sanitizeText(record.postalCode || record.postcode);
    const address = sanitizeText(record.address);
    const sourcePlaceId = sanitizeText(record.sourcePlaceId || record.placeId);
    const pageBase = sanitizeText(options.pageBase || "yemek");

    if (!name) {
      return null;
    }

    return {
      name,
      city,
      district,
      neighborhood,
      postalCode,
      address,
      sourcePlaceId,
      pageBase,
      openAsRestaurant: Boolean(options.openAsRestaurant),
      canonicalName: canonicalize(name),
      canonicalSearchBlob: canonicalize(
        [name, city, district, neighborhood, postalCode, address, pageBase].join(" "),
      ),
    };
  }

  function normalizeVenueCollection(payload, options = {}) {
    if (Array.isArray(payload)) {
      return payload.map((record) => normalizeVenueRecord(record, options)).filter((venue) => venue !== null);
    }

    if (payload && typeof payload === "object") {
      const collection = Array.isArray(payload.venues)
        ? payload.venues
        : Array.isArray(payload.data)
          ? payload.data
          : null;

      if (collection) {
        return collection.map((record) => normalizeVenueRecord(record, options)).filter((venue) => venue !== null);
      }
    }

    return [];
  }

  function dedupeVenueRecords(records) {
    const buckets = new Map();

    records.forEach((venue) => {
      if (!venue || typeof venue !== "object") {
        return;
      }

      const pageBase = sanitizeText(venue.pageBase);
      const locationKey = `${pageBase}|${canonicalize(venue.city)}|${canonicalize(venue.district)}|${venue.canonicalName}`;
      const bucket = buckets.get(locationKey) || [];
      bucket.push(venue);
      buckets.set(locationKey, bucket);
    });

    return Array.from(buckets.values()).flatMap((bucket) => {
      const withPlaceId = new Map();
      const withoutPlaceId = [];

      bucket.forEach((venue) => {
        const placeKey = sanitizeText(venue.sourcePlaceId);
        if (!placeKey) {
          withoutPlaceId.push(venue);
          return;
        }

        if (!withPlaceId.has(placeKey)) {
          withPlaceId.set(placeKey, venue);
          return;
        }

        const existing = withPlaceId.get(placeKey);
        if (recordQualityScore(venue) > recordQualityScore(existing)) {
          withPlaceId.set(placeKey, venue);
        }
      });

      if (withPlaceId.size > 0) {
        return Array.from(withPlaceId.values());
      }

      const bestWeakRecord = withoutPlaceId.reduce((best, venue) => {
        if (!best) {
          return venue;
        }

        return recordQualityScore(venue) > recordQualityScore(best) ? venue : best;
      }, null);

      return bestWeakRecord ? [bestWeakRecord] : [];
    });
  }

  function recordQualityScore(record) {
    if (!record || typeof record !== "object") {
      return 0;
    }

    let score = 0;
    if (sanitizeText(record.sourcePlaceId)) {
      score += 1000;
    }

    score += Math.min(sanitizeText(record.address).length, 240);
    score += Math.min(sanitizeText(record.city).length, 40);
    score += Math.min(sanitizeText(record.district).length, 40);
    return score;
  }

  async function readFallbackFoodRecords() {
    await ensureFallbackGlobal("ARAMABUL_FALLBACK_FOOD_DATA");
    const payload = window.ARAMABUL_FALLBACK_FOOD_DATA;
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const yemekRecords = normalizeVenueCollection(payload.yemek, {
      pageBase: "yemek",
      openAsRestaurant: true,
    });
    const kafeRecords = normalizeVenueCollection(payload.kafe, {
      pageBase: "keyif",
      openAsRestaurant: true,
    });
    return dedupeVenueRecords([...yemekRecords, ...kafeRecords]);
  }

  async function readFallbackCollection(globalKey, property) {
    await ensureFallbackGlobal(globalKey);
    const payload = window[globalKey];
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const collection = payload[property];
    return Array.isArray(collection) ? collection : [];
  }

  async function fetchVenuePayload(path) {
    try {
      const response = await fetch(path, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  async function loadVenues() {
    if (venuesPromise) {
      return venuesPromise;
    }

    venuesPromise = (async () => {
      const foodPayload = await fetchVenuePayload(FOOD_JSON_PATH);
      const bundledRecords = dedupeVenueRecords(
        normalizeVenueCollection(foodPayload, { pageBase: "keyif", openAsRestaurant: true }),
      );

      if (VENUES_API_ENDPOINT) {
        const apiPayload = await fetchVenuePayload(VENUES_API_ENDPOINT);
        const apiRecords = normalizeVenueCollection(apiPayload, {
          pageBase: "keyif",
          openAsRestaurant: true,
        });
        if (apiRecords.length > 0) {
          if (bundledRecords.length > 0) {
            return dedupeVenueRecords([...bundledRecords, ...apiRecords]);
          }
          return apiRecords;
        }
      }

      if (bundledRecords.length > 0) {
        return bundledRecords;
      }

      const fallbackRecords = await readFallbackFoodRecords();
      if (fallbackRecords.length > 0) {
        return fallbackRecords;
      }

      const venuesPayload = await fetchVenuePayload(VENUES_JSON_PATH);
      return normalizeVenueCollection(venuesPayload, {
        pageBase: "keyif",
        openAsRestaurant: true,
      });
    })();

    return venuesPromise;
  }

  async function loadCategoryDataset(source) {
    const payload = await fetchVenuePayload(source.dataPath);
    const records = normalizeVenueCollection(payload, { pageBase: source.pageBase });
    if (records.length > 0) {
      return records;
    }

    const fallbackCollections = await Promise.all(
      source.fallbacks.map(async (fallback) => {
        const fallbackRecords = await readFallbackCollection(fallback.globalKey, fallback.property);
        return normalizeVenueCollection(fallbackRecords, { pageBase: source.pageBase });
      }),
    );

    return dedupeVenueRecords(fallbackCollections.flat());
  }

  async function loadSearchRecords() {
    if (searchRecordsPromise) {
      return searchRecordsPromise;
    }

    searchRecordsPromise = (async () => {
      const [foodRecords, categoryCollections] = await Promise.all([
        loadVenues(),
        Promise.all(CATEGORY_DATASET_SOURCES.map((source) => loadCategoryDataset(source))),
      ]);

      return dedupeVenueRecords([...foodRecords, ...categoryCollections.flat()]);
    })();

    return searchRecordsPromise;
  }

  async function fallbackDistrictMap() {
    await ensureFallbackGlobal("ARAMABUL_FALLBACK_DATA");
    const payload = window.ARAMABUL_FALLBACK_DATA;
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const districts = payload.districts;
    if (!districts || typeof districts !== "object" || Array.isArray(districts)) {
      return null;
    }

    return districts;
  }

  async function loadCityNames() {
    if (cityNamesPromise) {
      return cityNamesPromise;
    }

    cityNamesPromise = (async () => {
      const fallbackMap = await fallbackDistrictMap();
      if (fallbackMap) {
        return Object.keys(fallbackMap);
      }

      const payload = await fetchVenuePayload(DISTRICTS_JSON_PATH);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return [];
      }

      return Object.keys(payload);
    })();

    return cityNamesPromise;
  }

  async function findMatchingCityName(rawQuery, options = {}) {
    const { exactOnly = false } = options;
    const canonicalQuery = canonicalize(rawQuery);
    if (!canonicalQuery) {
      return "";
    }

    const cityNames = await loadCityNames();
    if (cityNames.length === 0) {
      return "";
    }

    const exact = cityNames.find((city) => canonicalize(city) === canonicalQuery);
    if (exact) {
      return exact;
    }

    if (exactOnly) {
      return "";
    }

    if (canonicalQuery.length < 3) {
      return "";
    }

    return cityNames.find((city) => {
      const canonicalCity = canonicalize(city);
      return canonicalCity.startsWith(canonicalQuery) || canonicalQuery.startsWith(canonicalCity);
    }) || "";
  }

  function findMatchingRecord(records, query) {
    const canonicalQuery = canonicalize(query);
    if (!canonicalQuery) {
      return null;
    }

    const exactMatch = records.find((record) => record.canonicalName === canonicalQuery);
    if (exactMatch) {
      return exactMatch;
    }

    const prefixMatch = records.find((record) => record.canonicalName.startsWith(canonicalQuery));
    if (prefixMatch) {
      return prefixMatch;
    }

    if (canonicalQuery.length >= 3) {
      const containsMatch = records.find((record) => record.canonicalName.includes(canonicalQuery));
      if (containsMatch) {
        return containsMatch;
      }

      const queryTokens = canonicalQuery.split(" ").filter((token) => token.length >= 2);
      if (queryTokens.length >= 2) {
        return records.find((record) => {
          return queryTokens.every((token) => record.canonicalSearchBlob.includes(token));
        }) || null;
      }
    }

    return null;
  }

  function findExactMatchingRecords(records, query) {
    const canonicalQuery = canonicalize(query);
    if (!canonicalQuery) {
      return [];
    }

    return records.filter((record) => record.canonicalName === canonicalQuery);
  }

  function findMatchingCategoryPage(rawQuery, options = {}) {
    const { exactOnly = false } = options;
    const canonicalQuery = canonicalize(rawQuery);
    if (!canonicalQuery) {
      return null;
    }

    for (const route of CATEGORY_SEARCH_ROUTES) {
      for (const keyword of route.keywords) {
        if (canonicalize(keyword) === canonicalQuery) {
          return route.href;
        }
      }
    }

    if (exactOnly) {
      return null;
    }

    if (canonicalQuery.length < 2) {
      return null;
    }

    for (const route of CATEGORY_SEARCH_ROUTES) {
      for (const keyword of route.keywords) {
        const canonicalKeyword = canonicalize(keyword);
        if (canonicalQuery.includes(canonicalKeyword) || canonicalKeyword.includes(canonicalQuery)) {
          return route.href;
        }
      }
    }

    return null;
  }

  function routeResult(href) {
    return {
      type: "navigate",
      href: String(href || "").trim(),
    };
  }

  function choiceLabelFor(record) {
    const city = sanitizeText(record.city);
    const district = sanitizeText(record.district);
    const neighborhood = sanitizeText(record.neighborhood);
    const address = sanitizeText(record.address);
    const location = [city, district, neighborhood].filter(Boolean).join(" / ");
    if (location && address) {
      return `${location} - ${address}`;
    }
    return location || address;
  }

  function choiceResult(records) {
    const orderedRecords = [...records].sort((left, right) => {
      return choiceLabelFor(left).localeCompare(choiceLabelFor(right), "tr");
    });

    return {
      type: "choices",
      choices: orderedRecords.map((record) => ({
        title: record.name,
        subtitle: choiceLabelFor(record),
        href: categoryUrlFor(record),
      })),
    };
  }

  function applyVenueParams(targetUrl, record) {
    if (!(targetUrl instanceof URL) || !record || typeof record !== "object") {
      return;
    }

    if (record.name) {
      targetUrl.searchParams.set("mekan", String(record.name).trim());
    }

    if (record.sourcePlaceId) {
      targetUrl.searchParams.set("pid", String(record.sourcePlaceId).trim());
    }
  }

  function categoryUrlFor(record) {
    const pageBase = sanitizeText(record.pageBase);
    if (!pageBase) {
      return cityUrlFor(record.city || record.name || "");
    }

    if (record.city && record.district && DISTRICT_ROUTE_PAGE_BASES.has(pageBase)) {
      const targetUrl = new URL(`${pageBase}-district.html`, window.location.href);
      targetUrl.searchParams.set("sehir", toSlug(record.city));
      targetUrl.searchParams.set("ilce", toSlug(record.district));
      applyVenueParams(targetUrl, record);
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    if (record.city && CITY_ROUTE_PAGE_BASES.has(pageBase)) {
      const targetUrl = new URL(`${pageBase}-city.html`, window.location.href);
      targetUrl.searchParams.set("sehir", toSlug(record.city));
      applyVenueParams(targetUrl, record);
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    return `${pageBase}.html`;
  }

  function cityUrlFor(rawQuery) {
    const targetUrl = new URL("city.html", window.location.href);
    targetUrl.searchParams.set("il", toSlug(rawQuery));
    return `${targetUrl.pathname}${targetUrl.search}`;
  }

  async function resolveQuery(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) {
      return "";
    }

    const exactCategoryPage = findMatchingCategoryPage(query, { exactOnly: true });
    if (exactCategoryPage) {
      return routeResult(exactCategoryPage);
    }

    const exactCity = await findMatchingCityName(query, { exactOnly: true });
    if (exactCity) {
      return routeResult(cityUrlFor(exactCity));
    }

    const records = await loadSearchRecords();
    const exactRecords = findExactMatchingRecords(records, query);
    if (exactRecords.length > 1) {
      return choiceResult(exactRecords);
    }

    if (exactRecords.length === 1) {
      return routeResult(categoryUrlFor(exactRecords[0]));
    }

    const matchedRecord = findMatchingRecord(records, query);
    if (matchedRecord) {
      return routeResult(categoryUrlFor(matchedRecord));
    }

    const matchedCategoryPage = findMatchingCategoryPage(query);
    if (matchedCategoryPage) {
      return routeResult(matchedCategoryPage);
    }

    const matchedCity = await findMatchingCityName(query);
    if (matchedCity) {
      return routeResult(cityUrlFor(matchedCity));
    }

    return routeResult(cityUrlFor(query));
  }

  window.ARAMABUL_HEADER_SEARCH_DATA = {
    resolveQuery,
  };
})();
