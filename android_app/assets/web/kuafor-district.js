const ASSET_VERSION = "20260226-02";
const KUAFOR_JSON_PATH = "data/kuafor.json";

const kuaforDistrictTitle = document.querySelector("#kuaforDistrictTitle");
const kuaforDistrictBreadcrumb = document.querySelector("#kuaforDistrictBreadcrumb");
const kuaforDistrictCityLink = document.querySelector("#kuaforDistrictCityLink");
const kuaforBusinessGrid = document.querySelector("#kuaforBusinessGrid");

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

  if (kuaforDistrictTitle) {
    kuaforDistrictTitle.textContent = hasLocation
      ? `${state.city} İli / ${state.district} İlçesi Kuaför Salonları`
      : "İlçe Kuaför Salonları";
  }

  if (kuaforDistrictBreadcrumb) {
    kuaforDistrictBreadcrumb.textContent = state.district || "İlçe";
  }

  if (kuaforDistrictCityLink) {
    kuaforDistrictCityLink.textContent = state.city || "İl";
    kuaforDistrictCityLink.href = state.city
      ? `kuafor-city.html?sehir=${encodeURIComponent(state.city)}`
      : "kuafor.html";
  }

  document.title = hasLocation
    ? `arama bul | ${state.city} İli / ${state.district} İlçesi Kuaför Salonları`
    : "arama bul | İlçe Kuaförleri";
}

function renderPlaces() {
  if (!kuaforBusinessGrid) {
    return;
  }

  kuaforBusinessGrid.innerHTML = "";

  if (!state.city || !state.district || state.places.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = state.errorMessage || "Bu ilçe için kuaför verisi bulunamadı.";
    kuaforBusinessGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "Kuaför salonları";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  state.places.forEach((place) => {
    const chip = document.createElement("a");
    chip.className = "province-pill kuafor-pill kuafor-pill-link";
    chip.href = mapsPlaceUrl(place);
    chip.target = "_blank";
    chip.rel = "noopener noreferrer";
    chip.textContent = place.name;
    chip.setAttribute("aria-label", `${place.name} kuaför kartını Google Maps'te aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  kuaforBusinessGrid.append(row);
}

async function loadKuaforPlaces() {
  const fallback = window.NEREDEYENIR_FALLBACK_DATA;
  if (fallback && Array.isArray(fallback.kuafor)) {
    return fallback.kuafor
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

  const payload = await fetchJsonWithFallback(KUAFOR_JSON_PATH, []);
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

async function initKuaforDistrictPage() {
  const params = queryParams();

  let records = [];

  try {
    records = await loadKuaforPlaces();
  } catch (error) {
    console.error(error);
  }

  if (records.length === 0) {
    state.city = params.city;
    state.district = params.district;
    state.places = [];
    state.errorMessage = "Kuaför veri dosyası boş. Önce gerçek veriyi data/kuafor.json dosyasına aktar.";
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
    state.errorMessage = "Bu il için kuaför verisi bulunamadı.";
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
    state.errorMessage = "Bu ilçe için kuaför verisi bulunamadı.";
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

initKuaforDistrictPage();
