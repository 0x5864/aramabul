const ASSET_VERSION = "20260224-10";
const AKARYAKIT_JSON_PATH = `data/akaryakit.json?v=${ASSET_VERSION}`;

const akaryakitDistrictTitle = document.querySelector("#categoryDistrictTitle");
const akaryakitDistrictBreadcrumb = document.querySelector("#categoryDistrictBreadcrumb");
const akaryakitDistrictCityLink = document.querySelector("#categoryDistrictCityLink");
const akaryakitBusinessGrid = document.querySelector("#categoryVenueGrid");

const state = {
  city: "",
  district: "",
  places: [],
  errorMessage: "",
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

function buildMapsSearchUrl(place) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set(
    "query",
    [place.name, place.address, state.district, state.city]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" "),
  );

  if (typeof place.placeId === "string" && place.placeId.trim()) {
    mapsUrl.searchParams.set("query_place_id", place.placeId.trim());
  }

  return mapsUrl.toString();
}

function mapsPlaceUrl(place) {
  if (typeof place.mapsUrl === "string" && place.mapsUrl.trim()) {
    const raw = place.mapsUrl.trim();

    try {
      const parsed = new URL(raw);
      const query = parsed.searchParams.get("query") || "";
      const placeId = parsed.searchParams.get("query_place_id") || "";

      if (isCoordinateQuery(query) && !placeId) {
        return buildMapsSearchUrl(place);
      }

      return raw;
    } catch (_error) {
      return buildMapsSearchUrl(place);
    }
  }

  return buildMapsSearchUrl(place);
}

function uniquePlaces(places) {
  const seen = new Set();

  return places
    .filter((place) => {
      const key = normalizeName(place.placeId || `${place.name}-${place.address || place.mapsUrl}`);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "tr"));
}

function renderHeader() {
  const hasLocation = Boolean(state.city && state.district);

  if (akaryakitDistrictTitle) {
    akaryakitDistrictTitle.textContent = hasLocation
      ? `${state.city} İli / ${state.district} İlçesi Akaryakıt İstasyonları`
      : "İlçe Akaryakıt İstasyonları";
  }

  if (akaryakitDistrictBreadcrumb) {
    akaryakitDistrictBreadcrumb.textContent = state.district || "İlçe";
  }

  if (akaryakitDistrictCityLink) {
    akaryakitDistrictCityLink.textContent = state.city || "İl";
    akaryakitDistrictCityLink.href = state.city
      ? `akaryakit-city.html?sehir=${encodeURIComponent(state.city)}`
      : "akaryakit.html";
  }

  document.title = hasLocation
    ? `arama bul | ${state.city} İli / ${state.district} İlçesi Akaryakıt İstasyonları`
    : "arama bul | İlçe Akaryakıt İstasyonları";
}

function renderPlaces() {
  if (!akaryakitBusinessGrid) {
    return;
  }

  akaryakitBusinessGrid.innerHTML = "";

  if (!state.city || !state.district || state.places.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = state.errorMessage || "Bu ilçe için akaryakıt verisi bulunamadı.";
    akaryakitBusinessGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "Akaryakıt istasyonları";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  state.places.forEach((place) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = mapsPlaceUrl(place);
    chip.target = "_self";
    chip.rel = "noopener noreferrer";
    chip.textContent = place.name;
    chip.setAttribute("aria-label", `${place.name} akaryakıt istasyonunu Google Maps'te aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  akaryakitBusinessGrid.append(row);
}

async function loadAkaryakitPlaces() {
  const fallback = window.NEREDEYENIR_FALLBACK_DATA;
  if (fallback && Array.isArray(fallback.akaryakit)) {
    return fallback.akaryakit
      .map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
        name: String(item.name || "").trim(),
        address: String(item.address || "").trim(),
        placeId: String(item.placeId || item.sourcePlaceId || "").trim(),
        mapsUrl: String(item.mapsUrl || "").trim(),
      }))
      .filter((item) => item.city && item.district && item.name);
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
      name: String(item.name || "").trim(),
      address: String(item.address || "").trim(),
      placeId: String(item.placeId || item.sourcePlaceId || "").trim(),
      mapsUrl: String(item.mapsUrl || "").trim(),
    }))
    .filter((item) => item.city && item.district && item.name);
}

async function initAkaryakitDistrictPage() {
  const params = queryParams();
  let records = [];

  try {
    records = await loadAkaryakitPlaces();
  } catch (error) {
    console.error(error);
  }

  if (records.length === 0) {
    state.city = params.city;
    state.district = params.district;
    state.places = [];
    state.errorMessage = "Akaryakıt veri dosyası boş.";
    renderHeader();
    renderPlaces();
    return;
  }

  const cityNames = [...new Set(records.map((record) => record.city))]
    .sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(params.city, cityNames);

  if (!matchedCity) {
    state.city = "";
    state.district = "";
    state.places = [];
    state.errorMessage = "Bu il için akaryakıt verisi bulunamadı.";
    renderHeader();
    renderPlaces();
    return;
  }

  const districtNames = [...new Set(records
    .filter((record) => record.city === matchedCity)
    .map((record) => record.district))]
    .sort((left, right) => left.localeCompare(right, "tr"));
  const matchedDistrict = findNameMatch(params.district, districtNames);

  state.city = matchedCity;
  state.district = matchedDistrict;

  if (!matchedDistrict) {
    state.places = [];
    state.errorMessage = "Bu ilçe için akaryakıt verisi bulunamadı.";
    renderHeader();
    renderPlaces();
    return;
  }

  state.places = uniquePlaces(
    records.filter((record) => record.city === matchedCity && record.district === matchedDistrict),
  );
  state.errorMessage = "";

  renderHeader();
  renderPlaces();
}

initAkaryakitDistrictPage();
