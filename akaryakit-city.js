const ASSET_VERSION = "20260224-10";
const DISTRICTS_JSON_PATH = `data/districts.json?v=${ASSET_VERSION}`;
const AKARYAKIT_JSON_PATH = `data/akaryakit.json?v=${ASSET_VERSION}`;

const akaryakitCityTitle = document.querySelector("#categoryCityTitle");
const akaryakitCityBreadcrumb = document.querySelector("#categoryCityBreadcrumb");
const akaryakitDistrictGrid = document.querySelector("#categoryDistrictGrid");

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
  return `keyif-district.html?sehir=${encodeURIComponent(cityName)}&ilce=${encodeURIComponent(districtName)}`;
}

function renderDistrictGrid() {
  if (!akaryakitDistrictGrid) {
    return;
  }

  const districts = state.districts;
  akaryakitDistrictGrid.innerHTML = "";

  if (!state.city || districts.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için akaryakıt istasyonu verisi bulunamadı.";
    akaryakitDistrictGrid.append(empty);
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
    chip.href = districtPageUrl(state.city, districtName);
    chip.textContent = districtName;
    chip.setAttribute("aria-label", `${districtName} ilçesindeki akaryakıt noktalarını aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  akaryakitDistrictGrid.append(row);
}

function renderCityHeader() {
  if (akaryakitCityTitle) {
    akaryakitCityTitle.textContent = `${state.city} İli`;
  }

  if (akaryakitCityBreadcrumb) {
    akaryakitCityBreadcrumb.textContent = state.city || "İl";
  }

  document.title = state.city
    ? `aramabul | ${state.city} İli`
    : "aramabul | Akaryakıt İl Sayfası";
}

async function loadDistricts() {
  const fallback = window.ARAMABUL_FALLBACK_DATA;
  if (fallback && fallback.districts && typeof fallback.districts === "object" && !Array.isArray(fallback.districts)) {
    return fallback.districts;
  }

  const response = await fetch(DISTRICTS_JSON_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`İlçe verisi alınamadı: ${response.status}`);
  }

  return response.json();
}

async function loadAkaryakitRecords() {
  const fallback = window.ARAMABUL_FALLBACK_DATA;
  if (fallback && Array.isArray(fallback.akaryakit)) {
    return fallback.akaryakit
      .map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
      }))
      .filter((item) => item.city && item.district);
  }

  const response = await fetch(AKARYAKIT_JSON_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Akaryakıt verisi alınamadı: ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => ({
      city: String(item.city || "").trim(),
      district: String(item.district || "").trim(),
    }))
    .filter((item) => item.city && item.district);
}

async function initAkaryakitCityPage() {
  let districtMap = {};
  let records = [];

  try {
    districtMap = await loadDistricts();
  } catch (error) {
    console.error(error);
  }

  try {
    records = await loadAkaryakitRecords();
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
  state.districts = [...new Set(records
    .filter((item) => item.city === matchedCity)
    .map((item) => item.district)
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "tr"));

  renderCityHeader();
  renderDistrictGrid();
}

initAkaryakitCityPage();
