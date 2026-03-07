const ASSET_VERSION = "20260226-05";
const VETERINER_JSON_PATH = "data/veteriner.json";

const veterinerDistrictTitle = document.querySelector("#veterinerDistrictTitle");
const veterinerDistrictBreadcrumb = document.querySelector("#veterinerDistrictBreadcrumb");
const veterinerDistrictCityLink = document.querySelector("#veterinerDistrictCityLink");
const veterinerBusinessGrid = document.querySelector("#veterinerBusinessGrid");

const state = {
  city: "",
  district: "",
  places: [],
  errorMessage: "",
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

function parseMapsQuery(mapsUrl) {
  if (typeof mapsUrl !== "string" || mapsUrl.trim().length === 0) {
    return "";
  }

  try {
    const parsed = new URL(mapsUrl.trim());
    return String(parsed.searchParams.get("query") || "").trim();
  } catch (_error) {
    return "";
  }
}

function placeSearchQuery(place) {
  const mapsQuery = parseMapsQuery(place.mapsUrl);

  if (mapsQuery) {
    return `${mapsQuery} veteriner hekim`;
  }

  const address = String(place.address || "").trim();
  const name = String(place.name || "").trim();
  const locationText = [state.district, state.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

  if (name && address) {
    return `"${name}" ${address} ${locationText} veteriner hekim`;
  }

  if (name) {
    return `"${name}" ${locationText} veteriner hekim`;
  }

  if (address) {
    return `${address} ${locationText} veteriner hekim`;
  }

  return `${locationText} veteriner hekim`;
}

function mapsPlaceUrl(place) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", placeSearchQuery(place));

  if (typeof place.placeId === "string" && place.placeId.trim()) {
    mapsUrl.searchParams.set("query_place_id", place.placeId.trim());
  }

  return mapsUrl.toString();
}

function uniquePlaces(places) {
  const seen = new Set();

  return places
    .filter((place) => {
      const key = normalizeName(place.placeId || `${place.name}-${place.address}`);

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

  if (veterinerDistrictTitle) {
    veterinerDistrictTitle.textContent = hasLocation
      ? `${state.city} İli / ${state.district} İlçesi Veteriner Klinikleri`
      : "İlçe Veteriner Klinikleri";
  }

  if (veterinerDistrictBreadcrumb) {
    veterinerDistrictBreadcrumb.textContent = state.district || "İlçe";
  }

  if (veterinerDistrictCityLink) {
    veterinerDistrictCityLink.textContent = state.city || "İl";
    veterinerDistrictCityLink.href = state.city
      ? `veteriner-city.html?sehir=${encodeURIComponent(state.city)}`
      : "veteriner.html";
  }

  document.title = hasLocation
    ? `aramabul | ${state.city} İli / ${state.district} İlçesi Veteriner Klinikleri`
    : "aramabul | İlçe Veterinerleri";
}

function renderPlaces() {
  if (!veterinerBusinessGrid) {
    return;
  }

  veterinerBusinessGrid.innerHTML = "";

  if (!state.city || !state.district || state.places.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = state.errorMessage || "Bu ilçe için veteriner verisi bulunamadı.";
    veterinerBusinessGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "Veteriner klinikleri";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  state.places.forEach((place) => {
    const chip = document.createElement("a");
    chip.className = "province-pill veteriner-pill veteriner-pill-link";
    chip.href = mapsPlaceUrl(place);
    chip.target = "_self";
    chip.rel = "noopener noreferrer";
    chip.textContent = place.name;
    chip.setAttribute("aria-label", `${place.name} veteriner kartını Google Maps'te aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  veterinerBusinessGrid.append(row);
}

async function loadVeterinerPlaces() {
  const fallbackCategoryData = window.ARAMABUL_FALLBACK_CATEGORY_DATA;
  if (
    fallbackCategoryData &&
    typeof fallbackCategoryData === "object" &&
    Array.isArray(fallbackCategoryData.veteriner) &&
    fallbackCategoryData.veteriner.length > 0
  ) {
    return fallbackCategoryData.veteriner
      .map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
        name: String(item.name || "").trim(),
        address: String(item.address || "").trim(),
        placeId: String(item.placeId || "").trim(),
        mapsUrl: String(item.mapsUrl || "").trim(),
      }))
      .filter((item) => item.city && item.district && item.name);
  }

  const fallbackData = window.ARAMABUL_FALLBACK_DATA;
  if (
    fallbackData &&
    typeof fallbackData === "object" &&
    Array.isArray(fallbackData.veteriner) &&
    fallbackData.veteriner.length > 0
  ) {
    return fallbackData.veteriner
      .map((item) => ({
        city: String(item.city || "").trim(),
        district: String(item.district || "").trim(),
        name: String(item.name || "").trim(),
        address: String(item.address || "").trim(),
        placeId: String(item.placeId || "").trim(),
        mapsUrl: String(item.mapsUrl || "").trim(),
      }))
      .filter((item) => item.city && item.district && item.name);
  }

  const payload = await fetchJsonWithFallback(VETERINER_JSON_PATH, []);
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => ({
      city: String(item.city || "").trim(),
      district: String(item.district || "").trim(),
      name: String(item.name || "").trim(),
      address: String(item.address || "").trim(),
      placeId: String(item.placeId || "").trim(),
      mapsUrl: String(item.mapsUrl || "").trim(),
    }))
    .filter((item) => item.city && item.district && item.name);
}

async function initVeterinerDistrictPage() {
  const params = queryParams();

  let records = [];

  try {
    records = await loadVeterinerPlaces();
  } catch (error) {
    console.error(error);
  }

  if (records.length === 0) {
    state.city = params.city;
    state.district = params.district;
    state.places = [];
    state.errorMessage = "Veteriner verisi yüklenemedi. Lütfen daha sonra tekrar deneyin.";
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
    state.errorMessage = "Bu il için veteriner verisi bulunamadı.";
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
    state.errorMessage = "Bu ilçe için veteriner verisi bulunamadı.";
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

initVeterinerDistrictPage();
