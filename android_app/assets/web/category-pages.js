const ASSET_VERSION = "20260226-02";
const CATEGORY_VENUES_JSON_PATH = "data/venues.json";
const DISTRICTS_JSON_PATH = "data/districts.json";

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
      const response = await fetch(candidate, { cache: "no-store" });
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

const CATEGORY_DEFINITIONS = {
  eczane: {
    name: "Eczane",
    pageBase: "eczane",
    titleUnit: "eczane",
    primaryRowTitle: "Eczaneler",
    dataFile: "data/eczane.json",
    secondaryDataFile: "data/nobetci-eczane.json",
    secondaryRowTitle: "Nöbetçi Eczaneler",
    useDistrictCatalog: true,
    matcherKeywords: ["eczane", "pharmacy", "apteka"],
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
  otopark: {
    name: "Otopark",
    pageBase: "otopark",
    titleUnit: "otopark",
    dataFile: "data/otopark.json",
    useDistrictCatalog: true,
    matcherKeywords: ["otopark", "parking", "car park"],
  },
  kafe: {
    name: "Kafe",
    pageBase: "kafe",
    titleUnit: "kafe mekanı",
    dataFile: "data/kafe.json",
    useDistrictCatalog: true,
    matcherKeywords: ["kafe", "cafe", "kahve", "coffee", "espresso"],
  },
  otel: {
    name: "Otel",
    pageBase: "otel",
    titleUnit: "otel",
    matcherKeywords: ["otel", "hotel", "resort", "pansiyon", "hostel", "bungalov", "apart"],
  },
  akaryakit: {
    name: "Akaryakıt",
    pageBase: "akaryakit",
    titleUnit: "akaryakıt noktası",
    dataFile: "data/akaryakit.json",
    useDistrictCatalog: true,
    matcherKeywords: [
      "akaryakit",
      "benzin",
      "petrol",
      "istasyon",
      "shell",
      "opet",
      "total",
      "bp",
      "po",
      "kadoil",
      "moil",
      "lukoil",
      "turkiye petrolleri",
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

let allVenuesPromise = null;
const categoryDataPromiseCache = new Map();
let districtMapPromise = null;

function readFallbackData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.NEREDEYENIR_FALLBACK_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function readFallbackFoodData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function readFallbackCategoryData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.NEREDEYENIR_FALLBACK_CATEGORY_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function fallbackPayloadForDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return null;
  }

  const fallback = readFallbackData();
  const fallbackFood = readFallbackFoodData();
  const fallbackCategory = readFallbackCategoryData();

  if (cacheKey.includes("akaryakit") && fallback && Array.isArray(fallback.akaryakit)) {
    return fallback.akaryakit;
  }

  if (cacheKey.includes("kafe") && fallbackFood && Array.isArray(fallbackFood.kafe)) {
    return fallbackFood.kafe;
  }

  const isNobetciEczaneFile = /(?:^|\/)nobetci-eczane\.json(?:$|\?)/u.test(cacheKey);
  const isEczaneFile = /(?:^|\/)eczane\.json(?:$|\?)/u.test(cacheKey);

  if (
    isNobetciEczaneFile &&
    fallbackCategory &&
    Array.isArray(fallbackCategory.nobetciEczane)
  ) {
    return fallbackCategory.nobetciEczane;
  }

  if (isEczaneFile && fallbackCategory && Array.isArray(fallbackCategory.eczane)) {
    return fallbackCategory.eczane;
  }

  if (cacheKey.includes("kuafor") && fallback && Array.isArray(fallback.kuafor)) {
    return fallback.kuafor;
  }

  return null;
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

function queryParams() {
  const url = new URL(window.location.href);
  return {
    city: (url.searchParams.get("sehir") || url.searchParams.get("city") || "").trim(),
    district: (url.searchParams.get("ilce") || url.searchParams.get("district") || "").trim(),
  };
}

function findNameMatch(queryValue, values) {
  if (!queryValue) {
    return "";
  }

  const normalizedQuery = normalizeName(queryValue);
  const exact = values.find((value) => value === queryValue);

  if (exact) {
    return exact;
  }

  return values.find((value) => normalizeName(value) === normalizedQuery) || "";
}

function isCoordinateQuery(queryText) {
  const compact = String(queryText || "").trim().replace(/\s+/g, "");
  return /^-?\d{1,3}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/.test(compact);
}

function buildMapsSearchUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set(
    "query",
    [venue.name, venue.address, venue.district, venue.city]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" "),
  );

  if (typeof venue.sourcePlaceId === "string" && venue.sourcePlaceId.trim()) {
    mapsUrl.searchParams.set("query_place_id", venue.sourcePlaceId.trim());
  }

  return mapsUrl.toString();
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

function renderVenueRow(title, venues, subtitle = "") {
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

  venues.forEach((venue) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = mapsPlaceUrl(venue);
    chip.target = "_blank";
    chip.rel = "noopener noreferrer";
    chip.textContent = venue.name;
    chip.setAttribute("aria-label", `${venue.name} kaydını Google Maps'te aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  return row;
}

async function loadDistrictMap() {
  if (!districtMapPromise) {
    const fallback = readFallbackData();
    if (fallback && fallback.districts && typeof fallback.districts === "object" && !Array.isArray(fallback.districts)) {
      districtMapPromise = Promise.resolve(fallback.districts);
      return districtMapPromise;
    }

    districtMapPromise = fetchJsonWithFallback(DISTRICTS_JSON_PATH, {})
      .then((payload) => {
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
      })
      .catch(() => ({}));
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
          website: String(item.website || "").trim(),
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
    const fallbackPayload = fallbackPayloadForDataFile(cacheKey);
    if (Array.isArray(fallbackPayload)) {
      categoryDataPromiseCache.set(cacheKey, Promise.resolve(fallbackPayload));
      return categoryDataPromiseCache.get(cacheKey);
    }

    const promise = fetchJsonWithFallback(cacheKey, [])
      .then((payload) => {
        if (!Array.isArray(payload)) {
          return [];
        }

        return payload.map((item) => ({
          city: String(item.city || "").trim(),
          district: String(item.district || "").trim(),
          name: String(item.name || "").trim(),
          cuisine: String(item.cuisine || item.category || "").trim(),
          address: String(item.address || "").trim(),
          mapsUrl: String(item.mapsUrl || "").trim(),
          website: String(item.website || "").trim(),
          editorialSummary: String(item.editorialSummary || "").trim(),
          instagram: String(item.instagram || "").trim(),
          dutyInfo: String(item.dutyInfo || "").trim(),
          dutyDate: String(item.dutyDate || "").trim(),
          sourcePlaceId: String(item.sourcePlaceId || item.placeId || "").trim(),
        }));
      })
      .catch(() => []);

    categoryDataPromiseCache.set(cacheKey, promise);
  }

  return categoryDataPromiseCache.get(cacheKey);
}

async function loadCategoryVenues(categoryKey) {
  const definition = CATEGORY_DEFINITIONS[categoryKey];

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

function resolveDistrictList(matchedCity, venues, districtMap, useDistrictCatalog) {
  const venueDistricts = venueDistrictsForCity(venues, matchedCity);

  if (!useDistrictCatalog) {
    return venueDistricts;
  }

  const catalogDistricts = [...new Set(
    (districtMap[matchedCity] || [])
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));

  if (venueDistricts.length === 0) {
    return catalogDistricts;
  }

  const venueDistrictKeys = new Set(venueDistricts.map((value) => normalizeName(value)));
  const matchedCatalogDistricts = catalogDistricts.filter((value) => venueDistrictKeys.has(normalizeName(value)));

  if (matchedCatalogDistricts.length > 0) {
    return matchedCatalogDistricts;
  }

  return venueDistricts;
}

function renderRootPage(definition, venues, districtMap = null) {
  const groupGrid = document.querySelector("#categoryGroupGrid");

  if (!groupGrid) {
    return;
  }

  groupGrid.innerHTML = "";

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
      chip.textContent = provinceName;
      chip.setAttribute("aria-label", `${provinceName} ilinin ilçelerini aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    groupGrid.append(row);
  });
}

function renderCityPage(definition, venues, districtMap = null) {
  const cityTitle = document.querySelector("#categoryCityTitle");
  const cityBreadcrumb = document.querySelector("#categoryCityBreadcrumb");
  const districtGrid = document.querySelector("#categoryDistrictGrid");
  const { city } = queryParams();

  if (!districtGrid) {
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const cityNames = (
    useDistrictCatalog
      ? Object.keys(districtMap).map((value) => String(value || "").trim()).filter(Boolean)
      : [...new Set(venues.map((venue) => venue.city).filter(Boolean))]
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(city, cityNames);

  districtGrid.innerHTML = "";

  if (!matchedCity) {
    if (cityTitle) {
      cityTitle.textContent = "İlçeler";
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

  const districts = resolveDistrictList(matchedCity, venues, districtMap || {}, useDistrictCatalog);

  if (cityTitle) {
    cityTitle.textContent = `${matchedCity} İli`;
  }

  if (cityBreadcrumb) {
    cityBreadcrumb.textContent = matchedCity;
  }

  document.title = `arama bul | ${matchedCity} İli`;

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
  rowTitle.textContent = "İlçeler";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  districts.forEach((districtName) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = `${definition.pageBase}-district.html?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(districtName)}`;
    chip.textContent = districtName;
    chip.setAttribute("aria-label", `${districtName} ilçesindeki mekanları aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  districtGrid.append(row);
}

function renderDistrictPage(definition, venues, districtMap = null, secondaryVenues = []) {
  const districtTitle = document.querySelector("#categoryDistrictTitle");
  const districtBreadcrumb = document.querySelector("#categoryDistrictBreadcrumb");
  const districtCityLink = document.querySelector("#categoryDistrictCityLink");
  const venueGrid = document.querySelector("#categoryVenueGrid");
  const { city, district } = queryParams();

  if (!venueGrid) {
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const cityNames = (
    useDistrictCatalog
      ? Object.keys(districtMap).map((value) => String(value || "").trim()).filter(Boolean)
      : [...new Set(venues.map((venue) => venue.city).filter(Boolean))]
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(city, cityNames);

  let matchedDistrict = "";

  if (matchedCity) {
    const districtNames = resolveDistrictList(matchedCity, venues, districtMap || {}, useDistrictCatalog);

    matchedDistrict = findNameMatch(district, districtNames);
  }

  if (districtCityLink) {
    districtCityLink.textContent = matchedCity || "İl";
    districtCityLink.href = matchedCity
      ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
      : `${definition.pageBase}.html`;
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

  const normalizedCity = normalizeName(matchedCity);
  const normalizedDistrict = normalizeName(matchedDistrict);
  const districtVenues = dedupeByName(
    venues.filter((venue) => {
      return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
    }),
  );
  const districtSecondaryVenues = dedupeByName(
    secondaryVenues.filter((venue) => {
      return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
    }),
  );
  const dutyDateLabel = resolveDutyDateLabel(districtSecondaryVenues);

  if (districtTitle) {
    if (districtSecondaryVenues.length > 0) {
      districtTitle.textContent = `${matchedDistrict} İlçesi (${districtVenues.length} adet ${definition.titleUnit}, ${districtSecondaryVenues.length} adet nöbetçi eczane)`;
    } else {
      districtTitle.textContent = `${matchedDistrict} İlçesi (${districtVenues.length} adet ${definition.titleUnit})`;
    }
  }

  document.title = `arama bul | ${matchedCity} İli / ${matchedDistrict} İlçesi ${definition.name}`;

  if (districtVenues.length === 0 && districtSecondaryVenues.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  if (districtVenues.length > 0) {
    const primaryTitle = String(definition.primaryRowTitle || "Mekanlar").trim() || "Mekanlar";
    venueGrid.append(renderVenueRow(primaryTitle, districtVenues));
  }

  if (districtSecondaryVenues.length > 0) {
    const baseSecondaryTitle = String(definition.secondaryRowTitle || "Nöbetçi Eczaneler").trim() || "Nöbetçi Eczaneler";
    venueGrid.append(renderVenueRow(baseSecondaryTitle, districtSecondaryVenues, dutyDateLabel));
  }
}

async function initCategoryPage() {
  const body = document.body;

  if (!body) {
    return;
  }

  const categoryKey = String(body.dataset.categoryKey || "").trim();
  const pageType = String(body.dataset.categoryPage || "").trim();
  const definition = CATEGORY_DEFINITIONS[categoryKey];

  if (!definition) {
    return;
  }

  const venues = await loadCategoryVenues(categoryKey);
  const secondaryVenues = definition.secondaryDataFile
    ? await loadCategoryDataFile(definition.secondaryDataFile)
    : [];
  const districtMap = definition.useDistrictCatalog ? await loadDistrictMap() : null;

  if (pageType === "root") {
    renderRootPage(definition, venues, districtMap);
    return;
  }

  if (pageType === "city") {
    renderCityPage(definition, venues, districtMap);
    return;
  }

  if (pageType === "district") {
    renderDistrictPage(definition, venues, districtMap, secondaryVenues);
  }
}

void initCategoryPage();
