const VENUES_JSON_PATH = "data/venues.json";
const DISTRICTS_JSON_PATH = "data/districts.json";
const AUTH_USERS_KEY = "neredeyenir.auth.users.v1";
const AUTH_SESSION_KEY = "neredeyenir.auth.session.v1";
const VENUES_PER_PAGE = 50;

const fallbackVenues = [
  {
    city: "İstanbul",
    district: "Beyoğlu",
    name: "Galata Sofrası",
    cuisine: "Türk Mutfağı",
    rating: 4.6,
    budget: "₺₺",
  },
  {
    city: "Ankara",
    district: "Çankaya",
    name: "Anadolu Tabağı",
    cuisine: "Anadolu",
    rating: 4.5,
    budget: "₺₺",
  },
  {
    city: "İzmir",
    district: "Konak",
    name: "Kordon Balıkçısı",
    cuisine: "Deniz Ürünleri",
    rating: 4.4,
    budget: "₺₺₺",
  },
  {
    city: "Bursa",
    district: "Osmangazi",
    name: "İskender Konağı",
    cuisine: "Kebap",
    rating: 4.7,
    budget: "₺₺",
  },
  {
    city: "Antalya",
    district: "Muratpaşa",
    name: "Kaleiçi Mutfak",
    cuisine: "Akdeniz",
    rating: 4.3,
    budget: "₺₺₺",
  },
  {
    city: "Adana",
    district: "Seyhan",
    name: "Ocakbaşı Seyhan",
    cuisine: "Adana Kebap",
    rating: 4.6,
    budget: "₺₺",
  },
];

const mainPageCategoryTags = [
  "Meyhane",
  "Ocakbaşı",
  "Ev Yemekleri",
  "Çorba",
  "Lahmacun",
  "Pide",
  "Burger",
  "Pizza",
  "Köfte",
  "Çiğ Köfte",
  "Mantı",
  "Deniz Ürünleri",
  "Sokak Lezzetleri",
  "Dondurma",
  "Baklava",
  "Tatlı",
  "Künefe",
  "Kahvaltı",
  "Vegan",
  "Vejetaryen",
  "Glutensiz",
  "Asya Mutfağı",
  "İtalyan",
  "Mangal",
  "Kafe",
  "Noodle",
  "Tost",
  "Döner",
  "Kebap",
  "Börek",
];

const cityTitle = document.querySelector("#cityTitle");
const cityToplineName = document.querySelector("#cityToplineName");
const cityBreadcrumbName = document.querySelector("#cityBreadcrumbName");
const cityResultMeta = document.querySelector("#cityResultMeta");
const cityVenueList = document.querySelector("#cityVenueList");
const cityPaginationTop = document.querySelector("#cityPaginationTop");
const cityPaginationBottom = document.querySelector("#cityPaginationBottom");
const cityVenueTemplate = document.querySelector("#cityVenueTemplate");
const districtPicker = document.querySelector("#districtPicker");
const districtPickerTrigger = document.querySelector("#districtPickerTrigger");
const districtCurrent = document.querySelector("#districtCurrent");
const districtFlyoutCity = document.querySelector("#districtFlyoutCity");
const districtFlyoutList = document.querySelector("#districtFlyoutList");
const categoryPicker = document.querySelector("#categoryPicker");
const categoryPickerTrigger = document.querySelector("#categoryPickerTrigger");
const categoryCurrent = document.querySelector("#categoryCurrent");
const categoryFlyoutCity = document.querySelector("#categoryFlyoutCity");
const categoryFlyoutList = document.querySelector("#categoryFlyoutList");
const budgetSelect = document.querySelector("#budgetSelect");
const sortTabs = [...document.querySelectorAll(".city-sort-tab")];

const loginBtn = document.querySelector("#loginBtn");
const signupBtn = document.querySelector("#signupBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const authWelcome = document.querySelector("#authWelcome");
const authModal = document.querySelector("#authModal");
const authModalClose = document.querySelector("#authModalClose");
const authModalTitle = document.querySelector("#authModalTitle");
const authModalText = document.querySelector("#authModalText");
const authMessage = document.querySelector("#authMessage");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const signupName = document.querySelector("#signupName");
const signupEmail = document.querySelector("#signupEmail");
const signupPassword = document.querySelector("#signupPassword");
const signupPasswordRepeat = document.querySelector("#signupPasswordRepeat");

const turkishCharMap = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

const state = {
  city: "",
  district: "all",
  category: "all",
  budget: "all",
  sort: "traveler",
  page: 1,
};

const authState = {
  user: null,
  mode: "login",
};

let venues = [];
let districtsByCity = {};
let venuesByCity = new Map();
let venuesByCityDistrict = new Map();

function normalizeForSearch(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
    .normalize("NFC");
}

function toSlug(value) {
  return normalizeForSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 80) : fallback;
}

function toTitleCaseTr(value) {
  return String(value || "")
    .split(/([\s\-\/()&,."]+)/)
    .map((segment) => {
      if (!/[A-Za-zÇĞİIÖŞÜçğıöşü]/.test(segment)) {
        return segment;
      }

      const lower = segment.toLocaleLowerCase("tr");

      const firstLetterMatch = lower.match(/[a-zçğıöşü]/iu);
      if (!firstLetterMatch || typeof firstLetterMatch.index !== "number") {
        return lower;
      }

      const letterIndex = firstLetterMatch.index;
      const letter = lower[letterIndex];
      const upperFirst = letter.toLocaleUpperCase("tr");

      return `${lower.slice(0, letterIndex)}${upperFirst}${lower.slice(letterIndex + 1)}`;
    })
    .join("");
}

function sanitizeVenueName(value, fallback = "") {
  const cleaned = sanitizeText(value, fallback);

  if (!cleaned) {
    return cleaned;
  }

  const lettersOnly = cleaned.replace(/[^A-Za-zÇĞİIÖŞÜçğıöşü]+/g, "");

  if (!lettersOnly) {
    return cleaned;
  }

  const isAllUpper = lettersOnly === lettersOnly.toLocaleUpperCase("tr");
  return isAllUpper ? toTitleCaseTr(cleaned) : cleaned;
}

function sanitizeAddress(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 180) : fallback;
}

function sanitizeRating(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 4.0;
  }

  return Math.min(5, Math.max(0, numeric));
}

function sanitizeBudget(value) {
  const cleaned = sanitizeText(value, "₺₺");
  return /^₺{1,4}$/.test(cleaned) ? cleaned : "₺₺";
}

function normalizeVenueRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const city = sanitizeText(record.city);
  const district = sanitizeText(record.district, "Merkez");
  const name = sanitizeVenueName(record.name);
  const cuisine = sanitizeText(record.cuisine, "Yerel");

  if (!city || !name) {
    return null;
  }

  return {
    city,
    district,
    name,
    cuisine,
    rating: sanitizeRating(record.rating),
    budget: sanitizeBudget(record.budget),
    address: sanitizeAddress(record.address, ""),
    sourcePlaceId: sanitizeText(record.sourcePlaceId, ""),
    cuisineIndex: normalizeForSearch(cuisine),
    searchIndex: normalizeForSearch(`${name} ${cuisine} ${city} ${district}`),
  };
}

function buildVenueIndexes(records) {
  venuesByCity = new Map();
  venuesByCityDistrict = new Map();

  records.forEach((venue) => {
    const cityList = venuesByCity.get(venue.city) || [];
    cityList.push(venue);
    venuesByCity.set(venue.city, cityList);

    const districtMap = venuesByCityDistrict.get(venue.city) || new Map();
    const districtList = districtMap.get(venue.district) || [];
    districtList.push(venue);
    districtMap.set(venue.district, districtList);
    venuesByCityDistrict.set(venue.city, districtMap);
  });
}

function normalizeVenueCollection(payload) {
  if (Array.isArray(payload)) {
    return payload
      .map(normalizeVenueRecord)
      .filter((record) => record !== null);
  }

  if (payload && typeof payload === "object") {
    const collection = Array.isArray(payload.venues)
      ? payload.venues
      : Array.isArray(payload.data)
        ? payload.data
        : null;

    if (collection) {
      return collection
        .map(normalizeVenueRecord)
        .filter((record) => record !== null);
    }
  }

  return [];
}

function normalizeDistrictCollection(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const normalized = {};

  Object.entries(payload).forEach(([cityName, districts]) => {
    const city = sanitizeText(cityName);

    if (!city || !Array.isArray(districts)) {
      return;
    }

    const cleanDistricts = [...new Set(districts.map((item) => sanitizeText(item)).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, "tr"));

    if (cleanDistricts.length > 0) {
      normalized[city] = cleanDistricts;
    }
  });

  return normalized;
}

function fallbackDistrictCollection(records) {
  const grouped = {};

  records.forEach((record) => {
    const city = sanitizeText(record.city);
    const district = sanitizeText(record.district);

    if (!city || !district) {
      return;
    }

    if (!grouped[city]) {
      grouped[city] = [];
    }

    grouped[city].push(district);
  });

  return normalizeDistrictCollection(grouped);
}

function isSafeHttpUrl(value) {
  if (!value || typeof window === "undefined") {
    return false;
  }

  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

async function fetchJson(url) {
  if (!isSafeHttpUrl(url)) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
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
  const payload = await fetchJson(VENUES_JSON_PATH);
  const records = normalizeVenueCollection(payload);

  if (records.length > 0) {
    return records;
  }

  return fallbackVenues;
}

async function loadDistricts(records) {
  const payload = await fetchJson(DISTRICTS_JSON_PATH);
  const normalized = normalizeDistrictCollection(payload);

  if (Object.keys(normalized).length > 0) {
    return normalized;
  }

  return fallbackDistrictCollection(records);
}

function allCities() {
  const fromDistricts = Object.keys(districtsByCity);
  const fromVenues = [...new Set(venues.map((venue) => venue.city))];
  return [...new Set([...fromDistricts, ...fromVenues])].sort((left, right) =>
    left.localeCompare(right, "tr"),
  );
}

function resolveCityFromUrl(cities) {
  const url = new URL(window.location.href);
  let citySlug = url.searchParams.get("il");

  if (!citySlug) {
    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";

    if (lastSegment && lastSegment !== "city.html" && lastSegment !== "index.html") {
      citySlug = lastSegment.replace(/\.html$/, "");
    }
  }

  if (citySlug) {
    const matched = cities.find((city) => toSlug(city) === toSlug(citySlug));

    if (matched) {
      return matched;
    }
  }

  if (cities.includes("İstanbul")) {
    return "İstanbul";
  }

  return cities[0] || "";
}

function districtsForCity(city) {
  const fromDistrictData = districtsByCity[city];

  if (Array.isArray(fromDistrictData) && fromDistrictData.length > 0) {
    return fromDistrictData;
  }

  const districtMap = venuesByCityDistrict.get(city);
  if (!districtMap) {
    return [];
  }

  return [...districtMap.keys()].sort((left, right) => left.localeCompare(right, "tr"));
}

function cuisinesForCity(city) {
  return [...new Set((venuesByCity.get(city) || []).map((venue) => venue.cuisine))].sort(
    (left, right) => left.localeCompare(right, "tr"),
  );
}

function scoreFromSeed(seed) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function viewsForVenue(venue) {
  return 120 + (scoreFromSeed(`${venue.city}-${venue.name}-${venue.district}`) % 1800);
}

function travelerScore(venue) {
  return venue.rating * 100 + viewsForVenue(venue) / 12;
}

function starText(rating) {
  const full = Math.max(1, Math.min(5, Math.round(rating)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

function venueImageUrl(venue, suffix) {
  const seed = toSlug(`${state.city}-${venue.name}-${suffix}`);
  return `https://picsum.photos/seed/${seed}/900/600`;
}

function restaurantDetailUrl(venue) {
  const targetUrl = new URL("restaurant.html", window.location.href);
  targetUrl.searchParams.set("il", toSlug(venue.city));
  targetUrl.searchParams.set("ilce", toSlug(venue.district));
  targetUrl.searchParams.set("mekan", toSlug(venue.name));

  if (venue.sourcePlaceId) {
    targetUrl.searchParams.set("pid", venue.sourcePlaceId);
  }

  return targetUrl.toString();
}

function selectedCityVenues() {
  return venuesByCity.get(state.city) || [];
}

function selectedCityDistrictVenues() {
  const districtMap = venuesByCityDistrict.get(state.city);
  if (!districtMap) {
    return [];
  }

  return districtMap.get(state.district) || [];
}

function districtVenueCount(city, district) {
  const districtMap = venuesByCityDistrict.get(city);

  if (!districtMap || !district) {
    return 0;
  }

  return (districtMap.get(district) || []).length;
}

function filteredVenues() {
  const source =
    state.district === "all" ? selectedCityVenues() : selectedCityDistrictVenues();
  const categoryQuery = normalizeForSearch(state.category);

  let filtered = source.filter((venue) => {
    const matchesCategory =
      state.category === "all" ||
      venue.cuisineIndex.includes(categoryQuery);
    const matchesBudget = state.budget === "all" || venue.budget === state.budget;

    return matchesCategory && matchesBudget;
  });

  switch (state.sort) {
    case "locals":
      filtered = filtered.sort((left, right) => {
        const districtOrder = left.district.localeCompare(right.district, "tr");
        if (districtOrder !== 0) {
          return districtOrder;
        }
        return right.rating - left.rating;
      });
      break;
    case "viewed":
      filtered = filtered.sort((left, right) => viewsForVenue(right) - viewsForVenue(left));
      break;
    case "rated":
      filtered = filtered.sort((left, right) => {
        if (right.rating !== left.rating) {
          return right.rating - left.rating;
        }
        return viewsForVenue(right) - viewsForVenue(left);
      });
      break;
    case "traveler":
    default:
      filtered = filtered.sort((left, right) => travelerScore(right) - travelerScore(left));
      break;
  }

  return filtered;
}

function updateSortTabs() {
  sortTabs.forEach((button) => {
    const isActive = button.dataset.sort === state.sort;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function updateUrl() {
  const url = new URL(window.location.href);

  if (state.city) {
    url.searchParams.set("il", toSlug(state.city));
  }

  if (state.district === "all") {
    url.searchParams.delete("ilce");
  } else {
    url.searchParams.set("ilce", toSlug(state.district));
  }

  if (state.category === "all") {
    url.searchParams.delete("kategori");
  } else {
    url.searchParams.set("kategori", toSlug(state.category));
  }

  if (state.budget === "all") {
    url.searchParams.delete("butce");
  } else {
    url.searchParams.set("butce", state.budget);
  }

  if (state.sort === "traveler") {
    url.searchParams.delete("sirala");
  } else {
    url.searchParams.set("sirala", state.sort);
  }

  if (state.page <= 1) {
    url.searchParams.delete("sayfa");
  } else {
    url.searchParams.set("sayfa", String(state.page));
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function applyExtraUrlState() {
  const url = new URL(window.location.href);
  const districtSlug = url.searchParams.get("ilce");
  const categorySlug = url.searchParams.get("kategori");
  const budget = url.searchParams.get("butce");
  const sort = url.searchParams.get("sirala");
  const pageValue = Number.parseInt(url.searchParams.get("sayfa") || "1", 10);

  const districts = districtsForCity(state.city);
  const categories = mainPageCategoryTags;

  if (districtSlug) {
    const matchedDistrict = districts.find((district) => toSlug(district) === toSlug(districtSlug));
    state.district = matchedDistrict || "all";
  }

  if (categorySlug) {
    const matchedCategory = categories.find((category) => toSlug(category) === toSlug(categorySlug));
    state.category = matchedCategory || "all";
  }

  if (budget && /^₺{1,4}$/.test(budget)) {
    state.budget = budget;
  }

  if (["traveler", "locals", "viewed", "rated"].includes(sort || "")) {
    state.sort = sort;
  }

  if (Number.isInteger(pageValue) && pageValue > 0) {
    state.page = pageValue;
  }
}

function renderPageHeader() {
  const titleText = `${state.city} Restoranları`;
  document.title = `NeredeYenir | ${state.city} Restoranları`;
  cityTitle.textContent = titleText;
  cityToplineName.textContent = state.city;
  if (cityBreadcrumbName) {
    cityBreadcrumbName.textContent = titleText;
  }
}

function renderDistrictOptions() {
  if (
    !districtFlyoutList ||
    !districtCurrent ||
    !districtFlyoutCity ||
    !districtPicker ||
    !districtPickerTrigger
  ) {
    return;
  }

  const districts = districtsForCity(state.city);
  districtFlyoutList.innerHTML = "";

  if (!districts.includes(state.district)) {
    state.district = "all";
  }

  districtCurrent.textContent = state.district === "all" ? "Tüm ilçeler" : state.district;
  districtFlyoutCity.textContent = state.city;

  const allDistricts = ["all", ...districts];
  allDistricts.forEach((district) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "district-option";
    optionButton.dataset.value = district;
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("aria-selected", district === state.district ? "true" : "false");
    optionButton.textContent = district === "all" ? "Tüm ilçeler" : district;

    if (district === state.district) {
      optionButton.classList.add("active");
    }

    if (district === "all") {
      optionButton.classList.add("district-option-all");
    }

    optionButton.addEventListener("click", () => {
      state.district = district;
      state.page = 1;
      renderDistrictOptions();
      renderVenues();
      updateUrl();
      districtPicker.classList.remove("is-open");
      districtPickerTrigger.setAttribute("aria-expanded", "false");
    });

    districtFlyoutList.append(optionButton);
  });
}

function renderSidebarCategories() {
  if (!categoryFlyoutList || !categoryCurrent || !categoryFlyoutCity) {
    return;
  }

  const categories = mainPageCategoryTags;
  categoryFlyoutList.innerHTML = "";

  if (state.category !== "all" && !categories.includes(state.category)) {
    state.category = "all";
  }

  categoryCurrent.textContent = state.category === "all" ? "Tüm kategoriler" : state.category;
  categoryFlyoutCity.textContent = state.city;

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "category-option category-option-all";
  allButton.textContent = "Tüm kategoriler";
  allButton.dataset.value = "all";
  allButton.setAttribute("role", "option");
  allButton.setAttribute("aria-selected", state.category === "all" ? "true" : "false");
  allButton.classList.toggle("active", state.category === "all");
  allButton.addEventListener("click", () => {
    state.category = "all";
    state.page = 1;
    renderSidebarCategories();
    renderVenues();
    updateUrl();
    if (categoryPicker && categoryPickerTrigger) {
      categoryPicker.classList.remove("is-open");
      categoryPickerTrigger.setAttribute("aria-expanded", "false");
    }
  });
  categoryFlyoutList.append(allButton);

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-option";
    button.textContent = category;
    button.dataset.value = category;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", state.category === category ? "true" : "false");
    button.classList.toggle("active", state.category === category);

    button.addEventListener("click", () => {
      state.category = category;
      state.page = 1;
      renderSidebarCategories();
      renderVenues();
      updateUrl();
      if (categoryPicker && categoryPickerTrigger) {
        categoryPicker.classList.remove("is-open");
        categoryPickerTrigger.setAttribute("aria-expanded", "false");
      }
    });

    categoryFlyoutList.append(button);
  });
}

function renderEmptyState() {
  const empty = document.createElement("article");
  empty.className = "city-empty";
  empty.textContent = "Bu filtrelerle eşleşen restoran bulunamadı. Filtreleri genişleterek tekrar dene.";
  cityVenueList.append(empty);
}

function renderVenueCard(venue) {
  const card = cityVenueTemplate.content.firstElementChild.cloneNode(true);
  const thumbs = [...card.querySelectorAll(".city-venue-thumb")];
  const titleLink = card.querySelector(".city-venue-title-link");

  if (titleLink) {
    titleLink.textContent = venue.name;
    titleLink.href = restaurantDetailUrl(venue);
    titleLink.setAttribute("aria-label", `${venue.name} sayfasını aç`);
  }
  card.querySelector(".city-venue-subtitle").textContent = `${venue.district} / ${venue.cuisine}`;
  card.querySelector(".city-venue-description").textContent =
    venue.address || `${venue.district}, ${venue.city}`;
  card.querySelector(".city-venue-stars").textContent = starText(venue.rating);
  card.querySelector(".city-venue-rating").textContent = venue.rating.toFixed(1);
  card.querySelector(".city-venue-views").textContent = `${viewsForVenue(venue)} görüntüleme`;

  const chips = [...card.querySelectorAll(".city-venue-chip")];
  chips[0].textContent = venue.budget;
  chips[1].textContent = venue.cuisine;
  chips[2].textContent = venue.district;

  card.querySelector(".city-venue-main-image").src = venueImageUrl(venue, "main");
  thumbs[0].src = venueImageUrl(venue, "thumb-a");
  thumbs[1].src = venueImageUrl(venue, "thumb-b");
  thumbs[2].src = venueImageUrl(venue, "thumb-c");

  return card;
}

function buildPaginationButton(label, page, active = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "city-pagination-btn";
  button.textContent = label;
  button.dataset.page = String(page);
  button.classList.toggle("active", active);
  button.setAttribute("aria-label", `Sayfa ${page}`);

  if (active) {
    button.setAttribute("aria-current", "page");
  }

  return button;
}

function appendPaginationButtons(container, totalPages) {
  container.innerHTML = "";

  if (totalPages <= 1) {
    container.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "city-pagination-btn";
  previousButton.textContent = "Önceki";
  previousButton.dataset.page = String(state.page - 1);
  previousButton.disabled = state.page <= 1;
  container.append(previousButton);

  const pages = new Set([1, totalPages, state.page - 1, state.page, state.page + 1]);
  const pageList = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  let previousPage = 0;
  pageList.forEach((page) => {
    if (previousPage && page - previousPage > 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "city-pagination-ellipsis";
      ellipsis.textContent = "...";
      container.append(ellipsis);
    }

    container.append(buildPaginationButton(String(page), page, page === state.page));
    previousPage = page;
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "city-pagination-btn";
  nextButton.textContent = "Sonraki";
  nextButton.dataset.page = String(state.page + 1);
  nextButton.disabled = state.page >= totalPages;
  container.append(nextButton);

  [...container.querySelectorAll("button[data-page]")].forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number.parseInt(button.dataset.page || "1", 10);

      if (!Number.isInteger(nextPage)) {
        return;
      }

      state.page = Math.min(totalPages, Math.max(1, nextPage));
      renderVenues();
      updateUrl();
    });
  });
}

function renderPagination(totalPages) {
  if (cityPaginationTop) {
    appendPaginationButtons(cityPaginationTop, totalPages);
  }

  if (cityPaginationBottom) {
    appendPaginationButtons(cityPaginationBottom, totalPages);
  }
}

function renderVenues() {
  const cityVenues = selectedCityVenues();
  const filtered = filteredVenues();
  const totalPages = Math.max(1, Math.ceil(filtered.length / VENUES_PER_PAGE));
  state.page = Math.min(totalPages, Math.max(1, state.page));
  const startIndex = (state.page - 1) * VENUES_PER_PAGE;
  const visible = filtered.slice(startIndex, startIndex + VENUES_PER_PAGE);

  cityVenueList.innerHTML = "";
  let districtForMeta = "";

  if (state.district !== "all") {
    districtForMeta = state.district;
  } else if (state.city === "İstanbul") {
    const istanbulDistricts = districtsForCity(state.city);
    districtForMeta = istanbulDistricts.includes("Adalar") ? "Adalar" : istanbulDistricts[0] || "";
  } else {
    districtForMeta = districtsForCity(state.city)[0] || "";
  }

  cityResultMeta.textContent = districtForMeta
    ? `${state.city} ilinde toplam ${cityVenues.length} restoran bulunmaktadır. ${districtForMeta} İlçesinde de ${districtVenueCount(
        state.city,
        districtForMeta,
      )} restoran vardır.`
    : `${state.city} ilinde toplam ${cityVenues.length} restoran bulunmaktadır.`;

  renderPagination(totalPages);

  if (visible.length === 0) {
    renderEmptyState();
    return;
  }

  visible.forEach((venue) => {
    cityVenueList.append(renderVenueCard(venue));
  });
}

function parseStorageJson(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch (_error) {
    return fallbackValue;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLocaleLowerCase("tr");
}

async function hashPassword(value) {
  const password = String(value || "");

  if (
    typeof window === "undefined" ||
    !window.crypto ||
    !window.crypto.subtle ||
    typeof TextEncoder === "undefined"
  ) {
    return password;
  }

  const encoded = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  const bytes = Array.from(new Uint8Array(digest));

  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function loadAuthUsers() {
  const users = parseStorageJson(AUTH_USERS_KEY, []);

  if (!Array.isArray(users)) {
    return [];
  }

  return users.filter(
    (user) =>
      user &&
      typeof user === "object" &&
      typeof user.name === "string" &&
      typeof user.email === "string" &&
      typeof user.passwordHash === "string",
  );
}

function saveAuthUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  const session = parseStorageJson(AUTH_SESSION_KEY, null);

  if (
    session &&
    typeof session === "object" &&
    typeof session.name === "string" &&
    typeof session.email === "string"
  ) {
    return {
      name: session.name,
      email: normalizeEmail(session.email),
    };
  }

  return null;
}

function saveSession(user) {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      name: user.name,
      email: normalizeEmail(user.email),
    }),
  );
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function setAuthMessage(message, isError = false) {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = message;
  authMessage.classList.toggle("auth-message-error", isError);
}

function switchAuthMode(mode) {
  authState.mode = mode === "signup" ? "signup" : "login";
  const loginMode = authState.mode === "login";

  loginForm.classList.toggle("is-hidden", !loginMode);
  signupForm.classList.toggle("is-hidden", loginMode);
  authModalTitle.textContent = loginMode ? "Giriş yap" : "Kaydol";
  authModalText.textContent = loginMode
    ? "Hesabına girerek favori mekanlarını kaydet."
    : "Yeni hesabını oluştur, şehir rotalarını kaydetmeye başla.";
  setAuthMessage("");
}

function closeAuthModal() {
  authModal.classList.add("is-hidden");
}

function openAuthModal(mode) {
  switchAuthMode(mode);
  authModal.classList.remove("is-hidden");
}

function renderAuthState() {
  const hasUser = Boolean(authState.user);

  loginBtn.classList.toggle("is-hidden", hasUser);
  signupBtn.classList.toggle("is-hidden", hasUser);
  logoutBtn.classList.toggle("is-hidden", !hasUser);
  authWelcome.classList.toggle("is-hidden", !hasUser);

  if (hasUser) {
    authWelcome.textContent = `Merhaba, ${authState.user.name}`;
  } else {
    authWelcome.textContent = "";
  }
}

function attachAuthEvents() {
  loginBtn.addEventListener("click", () => {
    openAuthModal("login");
  });

  signupBtn.addEventListener("click", () => {
    openAuthModal("signup");
  });

  logoutBtn.addEventListener("click", () => {
    authState.user = null;
    clearSession();
    renderAuthState();
  });

  authModalClose.addEventListener("click", () => {
    closeAuthModal();
  });

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = normalizeEmail(loginEmail.value);
    const password = String(loginPassword.value || "");

    if (!email || !password) {
      setAuthMessage("E-posta ve şifre girmen gerekiyor.", true);
      return;
    }

    const users = loadAuthUsers();
    const user = users.find((item) => normalizeEmail(item.email) === email);

    if (!user) {
      setAuthMessage("Bu e-posta ile kayıt bulunamadı.", true);
      return;
    }

    const passwordHash = await hashPassword(password);

    if (user.passwordHash !== passwordHash) {
      setAuthMessage("Şifre hatalı görünüyor.", true);
      return;
    }

    authState.user = {
      name: user.name,
      email: user.email,
    };

    saveSession(authState.user);
    renderAuthState();
    closeAuthModal();
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = sanitizeText(signupName.value);
    const email = normalizeEmail(signupEmail.value);
    const password = String(signupPassword.value || "");
    const passwordRepeat = String(signupPasswordRepeat.value || "");

    if (!name || !email || !password) {
      setAuthMessage("Tüm alanları doldurman gerekiyor.", true);
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Şifre en az 6 karakter olmalı.", true);
      return;
    }

    if (password !== passwordRepeat) {
      setAuthMessage("Şifre tekrarı uyuşmuyor.", true);
      return;
    }

    const users = loadAuthUsers();
    const emailExists = users.some((item) => normalizeEmail(item.email) === email);

    if (emailExists) {
      setAuthMessage("Bu e-posta zaten kayıtlı.", true);
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      name,
      email,
      passwordHash,
    };

    users.push(newUser);
    saveAuthUsers(users);

    authState.user = {
      name: newUser.name,
      email: newUser.email,
    };

    saveSession(authState.user);
    renderAuthState();
    closeAuthModal();
  });
}

function initializeAuth() {
  authState.user = loadSession();
  renderAuthState();
  attachAuthEvents();
}

function attachFilterEvents() {
  if (districtPicker && districtPickerTrigger) {
    districtPicker.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        districtPickerTrigger.setAttribute("aria-expanded", "true");
      }
    });

    districtPickerTrigger.addEventListener("click", () => {
      const nextOpenState = !districtPicker.classList.contains("is-open");
      districtPicker.classList.toggle("is-open", nextOpenState);
      districtPickerTrigger.setAttribute("aria-expanded", nextOpenState ? "true" : "false");
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!districtPicker.contains(event.target)) {
        districtPicker.classList.remove("is-open");
        districtPickerTrigger.setAttribute("aria-expanded", "false");
      }
    });

    districtPicker.addEventListener("mouseleave", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        districtPicker.classList.remove("is-open");
        districtPickerTrigger.setAttribute("aria-expanded", "false");
      }
    });

    districtPicker.addEventListener("focusin", () => {
      districtPickerTrigger.setAttribute("aria-expanded", "true");
    });

    districtPicker.addEventListener("focusout", () => {
      districtPicker.classList.remove("is-open");
      districtPickerTrigger.setAttribute("aria-expanded", "false");
    });
  }

  if (categoryPicker && categoryPickerTrigger) {
    categoryPicker.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        categoryPickerTrigger.setAttribute("aria-expanded", "true");
      }
    });

    categoryPickerTrigger.addEventListener("click", () => {
      const nextOpenState = !categoryPicker.classList.contains("is-open");
      categoryPicker.classList.toggle("is-open", nextOpenState);
      categoryPickerTrigger.setAttribute("aria-expanded", nextOpenState ? "true" : "false");
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!categoryPicker.contains(event.target)) {
        categoryPicker.classList.remove("is-open");
        categoryPickerTrigger.setAttribute("aria-expanded", "false");
      }
    });

    categoryPicker.addEventListener("mouseleave", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        categoryPicker.classList.remove("is-open");
        categoryPickerTrigger.setAttribute("aria-expanded", "false");
      }
    });

    categoryPicker.addEventListener("focusin", () => {
      categoryPickerTrigger.setAttribute("aria-expanded", "true");
    });

    categoryPicker.addEventListener("focusout", () => {
      categoryPicker.classList.remove("is-open");
      categoryPickerTrigger.setAttribute("aria-expanded", "false");
    });
  }

  budgetSelect.addEventListener("change", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    state.budget = target.value;
    state.page = 1;
    renderVenues();
    updateUrl();
  });

  sortTabs.forEach((button) => {
    button.addEventListener("click", () => {
      const nextSort = button.dataset.sort || "traveler";
      state.sort = nextSort;
      state.page = 1;
      updateSortTabs();
      renderVenues();
      updateUrl();
    });
  });
}

async function initializeCityPage() {
  initializeAuth();

  venues = await loadVenues();
  buildVenueIndexes(venues);
  districtsByCity = await loadDistricts(venues);

  const cities = allCities();

  state.city = resolveCityFromUrl(cities);
  state.district = "all";
  state.category = "all";
  state.budget = "all";
  state.sort = "traveler";
  state.page = 1;

  if (!state.city) {
    cityTitle.textContent = "Şehir verisi bulunamadı";
    cityResultMeta.textContent = "Gösterilecek restoran verisi yok.";
    return;
  }

  applyExtraUrlState();

  renderPageHeader();
  renderDistrictOptions();
  renderSidebarCategories();

  budgetSelect.value = state.budget;
  updateSortTabs();
  renderVenues();
  updateUrl();
  attachFilterEvents();
}

initializeCityPage();
