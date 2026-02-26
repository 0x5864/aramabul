const ASSET_VERSION = "20260226-04";
const DISTRICTS_JSON_PATH = "data/districts.json";
const YEMEK_JSON_PATH = "data/yemek.json";

const yemekCityTitle = document.querySelector("#yemekCityTitle");
const yemekCityBreadcrumb = document.querySelector("#yemekCityBreadcrumb");
const yemekDistrictGrid = document.querySelector("#yemekDistrictGrid");

const CAFE_KEYWORDS = ["kafe", "cafe", "kahve", "coffee", "espresso"];

const state = {
  city: "",
  districts: [],
};

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

  const candidates = [];
  const pushUnique = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized || candidates.includes(normalized)) {
      return;
    }
    candidates.push(normalized);
  };

  pushUnique(withVersion(source));
  pushUnique(source);
  pushUnique(stripQuery(source));
  return candidates;
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

function isCafeVenue(venue) {
  const searchable = normalizeSearchText(`${venue.name} ${venue.cuisine}`);
  return CAFE_KEYWORDS.some((keyword) => searchable.includes(keyword));
}

function cityFromQuery() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("sehir") || url.searchParams.get("city") || "").trim();
}

function findCityName(queryCity, cityNames) {
  if (!queryCity) {
    return "";
  }

  const normalizedQuery = normalizeName(queryCity);
  const exact = cityNames.find((name) => name === queryCity);

  if (exact) {
    return exact;
  }

  return cityNames.find((name) => normalizeName(name) === normalizedQuery) || "";
}

function districtPageUrl(cityName, districtName) {
  return `yemek-district.html?sehir=${encodeURIComponent(cityName)}&ilce=${encodeURIComponent(districtName)}`;
}

function renderDistrictGrid() {
  if (!yemekDistrictGrid) {
    return;
  }

  yemekDistrictGrid.innerHTML = "";

  if (!state.city || state.districts.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için ilçe verisi bulunamadı.";
    yemekDistrictGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "İlçeler";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  state.districts.forEach((districtName) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = districtPageUrl(state.city, districtName);
    chip.textContent = districtName;
    chip.setAttribute("aria-label", `${districtName} ilçesindeki restoranları aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  yemekDistrictGrid.append(row);
}

function renderCityHeader() {
  if (yemekCityTitle) {
    yemekCityTitle.textContent = `${state.city} İli`;
  }

  if (yemekCityBreadcrumb) {
    yemekCityBreadcrumb.textContent = state.city || "İl";
  }

  document.title = state.city
    ? `arama bul | ${state.city} İli`
    : "arama bul | Yemek İl Sayfası";
}

function readFallbackDistrictMap() {
  const fallback = window.NEREDEYENIR_FALLBACK_DATA;
  if (fallback && fallback.districts && typeof fallback.districts === "object" && !Array.isArray(fallback.districts)) {
    return fallback.districts;
  }

  return null;
}

async function loadDistricts() {
  const fallbackDistricts = readFallbackDistrictMap();
  if (fallbackDistricts) {
    return fallbackDistricts;
  }

  const payload = await fetchJsonWithFallback(DISTRICTS_JSON_PATH, {});
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return payload;
}

async function loadYemekRecords() {
  const fallbackPayload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
  if (
    fallbackPayload &&
    typeof fallbackPayload === "object" &&
    Array.isArray(fallbackPayload.yemek) &&
    fallbackPayload.yemek.length > 0
  ) {
    return fallbackPayload.yemek
      .map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
        name: String(item.name || "").trim(),
        cuisine: String(item.cuisine || "").trim(),
      }))
      .filter((item) => item.city && item.district && item.name && !isCafeVenue(item));
  }

  const payload = await fetchJsonWithFallback(YEMEK_JSON_PATH, []);
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => ({
      city: String(item.city || "").trim(),
      district: String(item.district || "").trim(),
      name: String(item.name || "").trim(),
      cuisine: String(item.cuisine || "").trim(),
    }))
    .filter((item) => item.city && item.district && item.name && !isCafeVenue(item));
}

function resolveDistrictList(matchedCity, districtMap, records) {
  const catalogDistricts = [...new Set(
    (districtMap[matchedCity] || [])
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));

  const recordDistricts = [...new Set(
    records
      .filter((item) => normalizeName(item.city) === normalizeName(matchedCity))
      .map((item) => item.district)
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));

  if (recordDistricts.length === 0) {
    return catalogDistricts;
  }

  const recordDistrictKeys = new Set(recordDistricts.map((value) => normalizeName(value)));
  const matchedCatalogDistricts = catalogDistricts.filter((value) => recordDistrictKeys.has(normalizeName(value)));

  if (matchedCatalogDistricts.length > 0) {
    return matchedCatalogDistricts;
  }

  return recordDistricts;
}

async function initYemekCityPage() {
  const [districtMap, records] = await Promise.all([
    loadDistricts().catch(() => ({})),
    loadYemekRecords().catch(() => []),
  ]);

  const cityNames = Object.keys(districtMap).sort((left, right) => left.localeCompare(right, "tr"));
  const queryCity = cityFromQuery();
  const matchedCity = findCityName(queryCity, cityNames);

  if (!matchedCity) {
    state.city = "";
    state.districts = [];
    renderCityHeader();
    renderDistrictGrid();
    return;
  }

  state.city = matchedCity;
  state.districts = resolveDistrictList(matchedCity, districtMap, records);

  renderCityHeader();
  renderDistrictGrid();
}

void initYemekCityPage();
