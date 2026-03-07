const ASSET_VERSION = "20260226-02";
const DISTRICTS_JSON_PATH = "data/districts.json";
const KUAFOR_JSON_PATH = "data/kuafor.json";

const kuaforCityTitle = document.querySelector("#kuaforCityTitle");
const kuaforCityBreadcrumb = document.querySelector("#kuaforCityBreadcrumb");
const kuaforDistrictGrid = document.querySelector("#kuaforDistrictGrid");

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
  return `kuafor-district.html?sehir=${encodeURIComponent(cityName)}&ilce=${encodeURIComponent(districtName)}`;
}

function renderDistrictGrid() {
  if (!kuaforDistrictGrid) {
    return;
  }

  const districts = state.districts;
  kuaforDistrictGrid.innerHTML = "";

  if (!state.city || districts.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için ilçe verisi bulunamadı.";
    kuaforDistrictGrid.append(empty);
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
    chip.className = "province-pill kuafor-pill kuafor-pill-link";
    chip.href = districtPageUrl(state.city, districtName);
    chip.textContent = districtName;
    chip.setAttribute("aria-label", `${districtName} ilçesindeki kuaförleri aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  kuaforDistrictGrid.append(row);
}

function renderCityHeader() {
  if (kuaforCityTitle) {
    kuaforCityTitle.textContent = `${state.city} İli`;
  }

  if (kuaforCityBreadcrumb) {
    kuaforCityBreadcrumb.textContent = state.city || "İl";
  }

  document.title = state.city
    ? `aramabul | ${state.city} İli`
    : "aramabul | Kuaför İl Sayfası";
}

async function loadDistricts() {
  const fallback = window.ARAMABUL_FALLBACK_DATA;
  if (fallback && fallback.districts && typeof fallback.districts === "object" && !Array.isArray(fallback.districts)) {
    return fallback.districts;
  }

  const payload = await fetchJsonWithFallback(DISTRICTS_JSON_PATH, {});
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return payload;
}

async function loadKuaforRecords() {
  const fallback = window.ARAMABUL_FALLBACK_DATA;
  if (fallback && Array.isArray(fallback.kuafor)) {
    return fallback.kuafor
      .map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
        name: String(item.name || "").trim(),
      }))
      .filter((item) => item.city && item.district && item.name);
  }

  const payload = await fetchJsonWithFallback(KUAFOR_JSON_PATH, []);
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => ({
      city: String(item.city || "").trim(),
      district: String(item.district || "").trim(),
      name: String(item.name || "").trim(),
    }))
    .filter((item) => item.city && item.district && item.name);
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

async function initKuaforCityPage() {
  let districtMap = {};
  let records = [];

  try {
    districtMap = await loadDistricts();
  } catch (error) {
    console.error(error);
  }

  try {
    records = await loadKuaforRecords();
  } catch (error) {
    console.error(error);
  }

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

initKuaforCityPage();
