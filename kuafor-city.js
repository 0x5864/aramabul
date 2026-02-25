const ASSET_VERSION = "20260224-7";
const DISTRICTS_JSON_PATH = `data/districts.json?v=${ASSET_VERSION}`;

const kuaforCityTitle = document.querySelector("#kuaforCityTitle");
const kuaforCityBreadcrumb = document.querySelector("#kuaforCityBreadcrumb");
const kuaforDistrictGrid = document.querySelector("#kuaforDistrictGrid");

const state = {
  city: "",
  districts: [],
};

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
    ? `arama bul | ${state.city} İli`
    : "arama bul | Kuaför İl Sayfası";
}

async function loadDistricts() {
  const fallback = window.NEREDEYENIR_FALLBACK_DATA;
  if (fallback && fallback.districts && typeof fallback.districts === "object" && !Array.isArray(fallback.districts)) {
    return fallback.districts;
  }

  const response = await fetch(DISTRICTS_JSON_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`İlçe verisi alınamadı: ${response.status}`);
  }

  return response.json();
}

async function initKuaforCityPage() {
  let districtMap = {};

  try {
    districtMap = await loadDistricts();
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
  state.districts = [...new Set((districtMap[matchedCity] || []).map((name) => String(name || "").trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "tr"));

  renderCityHeader();
  renderDistrictGrid();
}

initKuaforCityPage();
