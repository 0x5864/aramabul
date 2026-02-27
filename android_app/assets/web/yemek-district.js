const ASSET_VERSION = "20260226-04";
const YEMEK_JSON_PATH = "data/yemek.json";

const yemekDistrictTitle = document.querySelector("#yemekDistrictTitle");
const yemekDistrictBreadcrumb = document.querySelector("#yemekDistrictBreadcrumb");
const yemekDistrictCityLink = document.querySelector("#yemekDistrictCityLink");
const yemekRestaurantGrid = document.querySelector("#yemekRestaurantGrid");

const state = {
  city: "",
  district: "",
  venues: [],
};

const CAFE_KEYWORDS = ["kafe", "cafe", "kahve", "coffee", "espresso"];

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

function mapsPlaceUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", `${venue.name} ${venue.district} ${venue.city}`);

  if (typeof venue.sourcePlaceId === "string" && venue.sourcePlaceId.trim()) {
    mapsUrl.searchParams.set("query_place_id", venue.sourcePlaceId.trim());
  }

  return mapsUrl.toString();
}

function uniqueDistrictVenues(venues) {
  const seen = new Set();

  return venues
    .filter((venue) => {
      const key = normalizeName(venue.name);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "tr"));
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

function renderDistrictHeader() {
  const hasLocation = Boolean(state.city && state.district);
  const venueCount = state.venues.length;

  if (yemekDistrictTitle) {
    yemekDistrictTitle.textContent = hasLocation
      ? `${state.district} İlçesi (${venueCount} adet yeme mekanı)`
      : "İlçe Restoranları";
  }

  if (yemekDistrictBreadcrumb) {
    yemekDistrictBreadcrumb.textContent = state.district || "İlçe";
  }

  if (yemekDistrictCityLink) {
    yemekDistrictCityLink.textContent = state.city || "İl";
    yemekDistrictCityLink.href = state.city
      ? `yemek-city.html?sehir=${encodeURIComponent(state.city)}`
      : "yemek.html";
  }

  document.title = state.city && state.district
    ? `arama bul | ${state.city} İli / ${state.district} İlçesi Restoranları`
    : "arama bul | İlçe Restoranları";
}

function renderVenueGrid() {
  if (!yemekRestaurantGrid) {
    return;
  }

  yemekRestaurantGrid.innerHTML = "";

  if (!state.city || !state.district || state.venues.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için restoran verisi bulunamadı.";
    yemekRestaurantGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "Restoranlar";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  state.venues.forEach((venue) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = mapsPlaceUrl(venue);
    chip.target = "_self";
    chip.rel = "noopener noreferrer";
    chip.textContent = venue.name;
    chip.setAttribute("aria-label", `${venue.name} restoranını Google Maps'te aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  yemekRestaurantGrid.append(row);
}

async function loadVenues() {
  const fallbackPayload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
  if (
    fallbackPayload &&
    typeof fallbackPayload === "object" &&
    Array.isArray(fallbackPayload.yemek) &&
    fallbackPayload.yemek.length > 0
  ) {
    return fallbackPayload.yemek.map((item) => ({
      city: String(item.city || "").trim(),
      district: String(item.district || "").trim(),
      name: String(item.name || "").trim(),
      cuisine: String(item.cuisine || "").trim(),
      sourcePlaceId: typeof item.sourcePlaceId === "string" ? item.sourcePlaceId : "",
    }));
  }

  const candidates = [
    `${YEMEK_JSON_PATH}?v=${ASSET_VERSION}`,
    YEMEK_JSON_PATH,
  ];
  let payload = [];

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      payload = await response.json();
      break;
    } catch (_error) {
      // Try the next candidate path.
    }
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => ({
    city: String(item.city || "").trim(),
    district: String(item.district || "").trim(),
    name: String(item.name || "").trim(),
    cuisine: String(item.cuisine || "").trim(),
    sourcePlaceId: typeof item.sourcePlaceId === "string" ? item.sourcePlaceId : "",
  }));
}

async function initYemekDistrictPage() {
  const params = queryParams();

  let venues = [];

  try {
    venues = await loadVenues();
  } catch (error) {
    console.error(error);
  }

  const cityNames = [...new Set(venues.map((venue) => venue.city).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(params.city, cityNames);

  if (!matchedCity) {
    state.city = "";
    state.district = "";
    state.venues = [];
    renderDistrictHeader();
    renderVenueGrid();
    return;
  }

  const districtNames = [...new Set(venues
    .filter((venue) => venue.city === matchedCity)
    .map((venue) => venue.district)
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "tr"));
  const matchedDistrict = findNameMatch(params.district, districtNames);

  state.city = matchedCity;
  state.district = matchedDistrict;

  if (!matchedDistrict) {
    state.venues = [];
    renderDistrictHeader();
    renderVenueGrid();
    return;
  }

  const districtVenues = venues.filter(
    (venue) =>
      venue.city === matchedCity &&
      venue.district === matchedDistrict &&
      venue.name &&
      !isCafeVenue(venue),
  );

  state.venues = uniqueDistrictVenues(districtVenues);

  renderDistrictHeader();
  renderVenueGrid();
}

initYemekDistrictPage();
