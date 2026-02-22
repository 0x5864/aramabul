const provinces = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Amasya",
  "Ankara",
  "Antalya",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Isparta",
  "Mersin",
  "İstanbul",
  "İzmir",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Kahramanmaraş",
  "Mardin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Şanlıurfa",
  "Uşak",
  "Van",
  "Yozgat",
  "Zonguldak",
  "Aksaray",
  "Bayburt",
  "Karaman",
  "Kırıkkale",
  "Batman",
  "Şırnak",
  "Bartın",
  "Ardahan",
  "Iğdır",
  "Yalova",
  "Karabük",
  "Kilis",
  "Osmaniye",
  "Düzce",
];

const fallbackVenues = [
  {
    city: "İstanbul",
    district: "Karaköy",
    name: "Fırın Arası",
    cuisine: "Anadolu Modern",
    rating: 4.8,
    budget: "₺₺₺",
  },
  {
    city: "Ankara",
    district: "Çankaya",
    name: "Sofra 1923",
    cuisine: "Ocakbaşı",
    rating: 4.6,
    budget: "₺₺",
  },
  {
    city: "İzmir",
    district: "Alsancak",
    name: "Kordon Lokması",
    cuisine: "Ege Mutfağı",
    rating: 4.7,
    budget: "₺₺",
  },
  {
    city: "Adana",
    district: "Seyhan",
    name: "Köz Ustası",
    cuisine: "Kebap",
    rating: 4.8,
    budget: "₺₺",
  },
  {
    city: "Gaziantep",
    district: "Şahinbey",
    name: "Bakır Han Sofrası",
    cuisine: "Güneydoğu",
    rating: 4.9,
    budget: "₺₺₺",
  },
  {
    city: "Bursa",
    district: "Osmangazi",
    name: "İpek Et",
    cuisine: "Bursa Klasikleri",
    rating: 4.5,
    budget: "₺₺",
  },
  {
    city: "Konya",
    district: "Selçuklu",
    name: "Fırın Miras",
    cuisine: "Etli Ekmek",
    rating: 4.6,
    budget: "₺₺",
  },
  {
    city: "Kayseri",
    district: "Melikgazi",
    name: "Mantı Fabrikası",
    cuisine: "Kayseri Mutfağı",
    rating: 4.4,
    budget: "₺₺",
  },
  {
    city: "Hatay",
    district: "Antakya",
    name: "Lezzet Uzun Çarşı",
    cuisine: "Hatay Sofrası",
    rating: 4.8,
    budget: "₺₺",
  },
  {
    city: "Mersin",
    district: "Yenişehir",
    name: "Narenciye Masa",
    cuisine: "Akdeniz",
    rating: 4.5,
    budget: "₺₺",
  },
  {
    city: "Trabzon",
    district: "Ortahisar",
    name: "Laz Evi",
    cuisine: "Karadeniz",
    rating: 4.6,
    budget: "₺₺",
  },
  {
    city: "Samsun",
    district: "Atakum",
    name: "Sahil Pidesi",
    cuisine: "Pide",
    rating: 4.5,
    budget: "₺₺",
  },
  {
    city: "Eskişehir",
    district: "Odunpazarı",
    name: "Taş Fırın Odun",
    cuisine: "Anadolu",
    rating: 4.4,
    budget: "₺",
  },
  {
    city: "Antalya",
    district: "Muratpaşa",
    name: "Likya Tabak",
    cuisine: "Akdeniz Modern",
    rating: 4.6,
    budget: "₺₺₺",
  },
  {
    city: "Muğla",
    district: "Bodrum",
    name: "Yalı Meyhane",
    cuisine: "Deniz Ürünleri",
    rating: 4.7,
    budget: "₺₺₺",
  },
  {
    city: "Kocaeli",
    district: "İzmit",
    name: "İskele Taş Mutfak",
    cuisine: "Mangal",
    rating: 4.3,
    budget: "₺₺",
  },
  {
    city: "Diyarbakır",
    district: "Sur",
    name: "Surlar Sofrası",
    cuisine: "Doğu Kebap",
    rating: 4.8,
    budget: "₺₺",
  },
  {
    city: "Rize",
    district: "Merkez",
    name: "Çay Bahçe",
    cuisine: "Karadeniz Kahvaltı",
    rating: 4.4,
    budget: "₺",
  },
  {
    city: "Balıkesir",
    district: "Ayvalık",
    name: "Taş Kahvaltı",
    cuisine: "Ege Kahvaltı",
    rating: 4.5,
    budget: "₺₺",
  },
  {
    city: "Şanlıurfa",
    district: "Haliliye",
    name: "Sıra Gecesi Ocak",
    cuisine: "Urfa Mutfağı",
    rating: 4.7,
    budget: "₺₺",
  },
  {
    city: "Van",
    district: "İpekyolu",
    name: "Van Sabah Evi",
    cuisine: "Kahvaltı",
    rating: 4.8,
    budget: "₺₺",
  },
  {
    city: "Çanakkale",
    district: "Bozcaada",
    name: "Rüzgar Mezesi",
    cuisine: "Ada Mutfağı",
    rating: 4.6,
    budget: "₺₺₺",
  },
  {
    city: "Edirne",
    district: "Merkez",
    name: "Ciğer Durağı",
    cuisine: "Ciğer",
    rating: 4.6,
    budget: "₺",
  },
  {
    city: "Sakarya",
    district: "Sapanca",
    name: "Göl Kenarı Mutfak",
    cuisine: "Doğa Menüsü",
    rating: 4.3,
    budget: "₺₺",
  },
  {
    city: "Nevşehir",
    district: "Ürgüp",
    name: "Peri Sofra",
    cuisine: "Kapadokya",
    rating: 4.7,
    budget: "₺₺₺",
  },
  {
    city: "Mardin",
    district: "Artuklu",
    name: "Taş Teras",
    cuisine: "Mezopotamya",
    rating: 4.9,
    budget: "₺₺₺",
  },
  {
    city: "Denizli",
    district: "Pamukkale",
    name: "Bağ Tat",
    cuisine: "Ege-Anadolu",
    rating: 4.4,
    budget: "₺₺",
  },
  {
    city: "Kahramanmaraş",
    district: "Dulkadiroğlu",
    name: "Maraş Dondurma Konağı",
    cuisine: "Tatlı",
    rating: 4.5,
    budget: "₺",
  },
  {
    city: "Tekirdağ",
    district: "Süleymanpaşa",
    name: "Köfte Ocağı",
    cuisine: "Tekirdağ Köftesi",
    rating: 4.5,
    budget: "₺₺",
  },
  {
    city: "Erzurum",
    district: "Yakutiye",
    name: "Çağ Kardeşler",
    cuisine: "Çağ Kebabı",
    rating: 4.8,
    budget: "₺₺",
  },
];

let venues = [];
let districtsByCity = {};
let venuesByCity = new Map();
let venuesByCityDistrict = new Map();
let cityVenueCountByName = new Map();
let cuisineCountByCity = new Map();

const cityProfiles = {
  İstanbul: {
    summary: "Sokak lezzeti ile yeni nesil mutfak aynı mahallede buluşuyor.",
    tags: ["Boğaz", "Sokak Lezzeti", "Yeni Nesil"],
  },
  Ankara: {
    summary: "Ocakbaşı, esnaf lokantası ve modern mutfak dengeli ilerliyor.",
    tags: ["Ocakbaşı", "Klasik Lokanta", "Gece Servisi"],
  },
  İzmir: {
    summary: "Ege otları, deniz ürünleri ve rahat semt sofraları öne çıkıyor.",
    tags: ["Ege", "Deniz Ürünü", "Kahvaltı"],
  },
  Gaziantep: {
    summary: "Bakır tabaklar, güçlü baharat ve köklü ustalık bu şehirde belirleyici.",
    tags: ["Baklava", "Kebap", "Katmer"],
  },
  Hatay: {
    summary: "Meze ve künefe hattı güçlü. Akşam servisleri canlı ve kalabalık.",
    tags: ["Meze", "Künefe", "Antakya"],
  },
};

const featuredCategories = [
  {
    name: "Kebap",
    count: 48291,
    image:
      "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Kahvaltı",
    count: 36420,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Döner",
    count: 28114,
    image:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pide",
    count: 24753,
    image:
      "https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Balık",
    count: 19675,
    image:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Tatlı",
    count: 33218,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
  },
];

const categoryTags = [
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
  "Tatlı",
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

const allCategoryNames = [...new Set([...featuredCategories.map((item) => item.name), ...categoryTags])];

const cityFilter = document.querySelector("#cityFilter");
const searchInput = document.querySelector("#searchInput");
const clearFilters = document.querySelector("#clearFilters");
const categorySearch = document.querySelector("#categorySearch");
const categoryCardGrid = document.querySelector("#categoryCardGrid");
const categoryChipGrid = document.querySelector("#categoryChipGrid");
const venueGrid = document.querySelector("#venueGrid");
const topCityGrid = document.querySelector("#topCityGrid");
const provinceGrid = document.querySelector("#provinceGrid");
const districtFilterWrap = document.querySelector("#districtFilterWrap");
const districtFilter = document.querySelector("#districtFilter");
const venueTemplate = document.querySelector("#venueTemplate");
const resultCount = document.querySelector("#resultCount");
const cityDetail = document.querySelector("#cityDetail");
const cityTitle = document.querySelector("#cityTitle");
const citySummary = document.querySelector("#citySummary");
const cityVenueCount = document.querySelector("#cityVenueCount");
const cityCuisineCount = document.querySelector("#cityCuisineCount");
const cityRegion = document.querySelector("#cityRegion");
const cityTags = document.querySelector("#cityTags");
const cityShareLink = document.querySelector("#cityShareLink");
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

const VENUES_JSON_PATH = "data/venues.json";
const DISTRICTS_JSON_PATH = "data/districts.json";
const API_BASE_URL = (() => {
  if (typeof window === "undefined") {
    return "";
  }

  if (typeof window.NEREDEYENIR_API_BASE === "string" && window.NEREDEYENIR_API_BASE.trim()) {
    return window.NEREDEYENIR_API_BASE.trim().replace(/\/+$/u, "");
  }

  if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }

  return window.location.origin;
})();
const VENUES_API_ENDPOINT =
  typeof window !== "undefined" && typeof window.NEREDEYENIR_VENUES_API === "string"
    ? window.NEREDEYENIR_VENUES_API.trim()
    : API_BASE_URL
      ? `${API_BASE_URL}/api/venues?limit=50000`
      : "";
const DISTRICTS_API_ENDPOINT =
  typeof window !== "undefined" && typeof window.NEREDEYENIR_DISTRICTS_API === "string"
    ? window.NEREDEYENIR_DISTRICTS_API.trim()
    : API_BASE_URL
      ? `${API_BASE_URL}/api/districts`
      : "";
const AUTH_USERS_KEY = "neredeyenir.auth.users.v1";
const AUTH_SESSION_KEY = "neredeyenir.auth.session.v1";
const USER_CITY_CACHE_KEY = "neredeyenir.user.city.cache.v1";
const USER_CITY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30;

const state = {
  query: "",
  city: "all",
  district: "all",
  categoryQuery: "",
  activeCategory: "",
};

const authState = {
  user: null,
};

const regionOrder = [
  "Marmara",
  "İç Anadolu",
  "Ege",
  "Akdeniz",
  "Karadeniz",
  "Doğu Anadolu",
  "Güneydoğu Anadolu",
];

const regionCityData = {
  Marmara: [
    { name: "İstanbul", population: 15655924 },
    { name: "Bursa", population: 3217873 },
    { name: "Kocaeli", population: 2102826 },
    { name: "Balıkesir", population: 1273996 },
    { name: "Tekirdağ", population: 1167221 },
    { name: "Sakarya", population: 1098244 },
    { name: "Çanakkale", population: 570499 },
    { name: "Edirne", population: 419913 },
    { name: "Kırklareli", population: 379031 },
    { name: "Yalova", population: 304780 },
    { name: "Bilecik", population: 228334 },
  ],
  "İç Anadolu": [
    { name: "Ankara", population: 5803482 },
    { name: "Konya", population: 2320241 },
    { name: "Kayseri", population: 1445683 },
    { name: "Eskişehir", population: 915418 },
    { name: "Sivas", population: 650401 },
    { name: "Aksaray", population: 438504 },
    { name: "Yozgat", population: 420699 },
    { name: "Niğde", population: 377080 },
    { name: "Nevşehir", population: 317952 },
    { name: "Kırıkkale", population: 285744 },
    { name: "Karaman", population: 263960 },
    { name: "Kırşehir", population: 247179 },
    { name: "Çankırı", population: 205501 },
  ],
  Ege: [
    { name: "İzmir", population: 4479355 },
    { name: "Manisa", population: 1475040 },
    { name: "Aydın", population: 1161702 },
    { name: "Muğla", population: 1066758 },
    { name: "Denizli", population: 1059082 },
    { name: "Afyonkarahisar", population: 751344 },
    { name: "Kütahya", population: 575674 },
    { name: "Uşak", population: 377001 },
  ],
  Akdeniz: [
    { name: "Antalya", population: 2696967 },
    { name: "Adana", population: 2274106 },
    { name: "Mersin", population: 1938389 },
    { name: "Hatay", population: 1544218 },
    { name: "Kahramanmaraş", population: 1116188 },
    { name: "Osmaniye", population: 561061 },
    { name: "Isparta", population: 450778 },
    { name: "Burdur", population: 278036 },
  ],
  Karadeniz: [
    { name: "Samsun", population: 1379884 },
    { name: "Trabzon", population: 824352 },
    { name: "Ordu", population: 775800 },
    { name: "Tokat", population: 606934 },
    { name: "Zonguldak", population: 591492 },
    { name: "Çorum", population: 530126 },
    { name: "Giresun", population: 461712 },
    { name: "Düzce", population: 409865 },
    { name: "Kastamonu", population: 388990 },
    { name: "Rize", population: 350506 },
    { name: "Amasya", population: 342378 },
    { name: "Bolu", population: 324789 },
    { name: "Karabük", population: 255242 },
    { name: "Sinop", population: 229716 },
    { name: "Bartın", population: 207238 },
    { name: "Artvin", population: 169501 },
    { name: "Gümüşhane", population: 148539 },
    { name: "Bayburt", population: 86317 },
  ],
  "Doğu Anadolu": [
    { name: "Van", population: 1127612 },
    { name: "Erzurum", population: 749754 },
    { name: "Malatya", population: 742725 },
    { name: "Elazığ", population: 604411 },
    { name: "Ağrı", population: 499801 },
    { name: "Muş", population: 392301 },
    { name: "Bitlis", population: 359808 },
    { name: "Hakkari", population: 287625 },
    { name: "Bingöl", population: 285655 },
    { name: "Kars", population: 278335 },
    { name: "Erzincan", population: 243399 },
    { name: "Iğdır", population: 209738 },
    { name: "Ardahan", population: 91854 },
    { name: "Tunceli", population: 89898 },
  ],
  "Güneydoğu Anadolu": [
    { name: "Şanlıurfa", population: 2213964 },
    { name: "Gaziantep", population: 2164134 },
    { name: "Diyarbakır", population: 1819595 },
    { name: "Mardin", population: 895911 },
    { name: "Batman", population: 654528 },
    { name: "Adıyaman", population: 604978 },
    { name: "Şırnak", population: 570826 },
    { name: "Siirt", population: 347412 },
    { name: "Kilis", population: 155179 },
  ],
};

const topCityFallbackImages = {
  İstanbul: "assets/istanbul.webp",
  Ankara: "assets/ankara.webp",
  İzmir: "assets/izmir.webp",
  Bursa: "assets/bursa.webp",
  Antalya: "assets/antalya.webp",
  Konya: "assets/konya.jpg",
  Adana: "https://picsum.photos/seed/adana-city/220/140",
};

const topCityLandmarkPages = {
  Adana: "Taşköprü, Adana",
};

const topCityImageCache = new Map();

const topPopulationCities = regionOrder
  .flatMap((regionName) => regionCityData[regionName])
  .slice()
  .sort((left, right) => right.population - left.population)
  .slice(0, 6);

const cityMetaByName = new Map(
  regionOrder.flatMap((regionName) =>
    regionCityData[regionName].map((cityData) => [
      cityData.name,
      { region: regionName, population: cityData.population },
    ]),
  ),
);

const turkishCharMap = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

const cityBySlug = new Map(
  provinces.map((province) => [toSlug(province), province]),
);

function normalizeForSearch(value) {
  return value
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

function normalizeCuisineLabel(value, fallback = "Yerel") {
  const cleaned = sanitizeText(value, fallback);
  const normalized = normalizeForSearch(cleaned);

  if (normalized === "baklava" || normalized === "kunefe") {
    return "Tatlı";
  }

  return cleaned;
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
  const cuisine = normalizeCuisineLabel(record.cuisine, "Yerel");

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
    sourcePlaceId: sanitizeText(record.sourcePlaceId, ""),
    cuisineIndex: normalizeForSearch(cuisine),
    searchIndex: normalizeForSearch(`${name} ${cuisine} ${city} ${district}`),
  };
}

function buildVenueIndexes(records) {
  venuesByCity = new Map();
  venuesByCityDistrict = new Map();
  cityVenueCountByName = new Map();
  cuisineCountByCity = new Map();

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

  venuesByCity.forEach((cityVenues, city) => {
    cityVenueCountByName.set(city, cityVenues.length);
    cuisineCountByCity.set(
      city,
      new Set(cityVenues.map((venue) => venue.cuisine)).size,
    );
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

function isSafeHttpUrl(value) {
  if (!value) {
    return false;
  }

  if (typeof window === "undefined") {
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

async function fetchVenueCollection(url) {
  const payload = await fetchJson(url);

  if (!payload) {
    return [];
  }

  return normalizeVenueCollection(payload);
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

    const cleanDistricts = [
      ...new Set(districts.map((district) => sanitizeText(district)).filter(Boolean)),
    ].sort((left, right) => left.localeCompare(right, "tr"));

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

async function loadVenuesData() {
  if (VENUES_API_ENDPOINT) {
    const apiRecords = await fetchVenueCollection(VENUES_API_ENDPOINT);

    if (apiRecords.length > 0) {
      return apiRecords;
    }
  }

  const localRecords = await fetchVenueCollection(VENUES_JSON_PATH);

  if (localRecords.length > 0) {
    return localRecords;
  }

  return fallbackVenues
    .map(normalizeVenueRecord)
    .filter((record) => record !== null);
}

async function loadDistrictData(records) {
  if (DISTRICTS_API_ENDPOINT) {
    const apiPayload = await fetchJson(DISTRICTS_API_ENDPOINT);
    const apiDistricts = normalizeDistrictCollection(apiPayload);

    if (Object.keys(apiDistricts).length > 0) {
      return apiDistricts;
    }
  }

  const payload = await fetchJson(DISTRICTS_JSON_PATH);
  const localDistricts = normalizeDistrictCollection(payload);

  if (Object.keys(localDistricts).length > 0) {
    return localDistricts;
  }

  return fallbackDistrictCollection(records);
}

function parseJsonStorage(key, fallbackValue) {
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

function normalizeLocationCandidate(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\(.*?\)/g, " ")
    .replace(
      /\b(ili|ilcesi|ilçesi|province|state|county|district|belediyesi|municipality)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function matchKnownCityName(rawName) {
  const cleaned = normalizeLocationCandidate(rawName);

  if (!cleaned) {
    return null;
  }

  const normalized = normalizeForSearch(cleaned);
  const exactMatch =
    provinces.find((cityName) => normalizeForSearch(cityName) === normalized) || null;

  if (exactMatch) {
    return exactMatch;
  }

  return (
    provinces.find((cityName) =>
      normalized.includes(normalizeForSearch(cityName)),
    ) || null
  );
}

function loadCachedUserCity() {
  const cached = parseJsonStorage(USER_CITY_CACHE_KEY, null);

  if (
    !cached ||
    typeof cached !== "object" ||
    typeof cached.city !== "string" ||
    typeof cached.savedAt !== "number"
  ) {
    return null;
  }

  if (Date.now() - cached.savedAt > USER_CITY_CACHE_MAX_AGE) {
    return null;
  }

  return matchKnownCityName(cached.city);
}

function saveCachedUserCity(city) {
  localStorage.setItem(
    USER_CITY_CACHE_KEY,
    JSON.stringify({
      city,
      savedAt: Date.now(),
    }),
  );
}

function resolveCityFromReversePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const address =
    payload.address && typeof payload.address === "object" ? payload.address : {};
  const candidates = [
    payload.city,
    payload.locality,
    payload.cityName,
    payload.principalSubdivision,
    address.city,
    address.town,
    address.state,
    address.province,
    address.county,
    address.municipality,
    address.city_district,
  ];

  for (const candidate of candidates) {
    const cityName = matchKnownCityName(candidate);

    if (cityName) {
      return cityName;
    }
  }

  return null;
}

async function resolveCityByCoordinates(latitude, longitude) {
  const providers = [
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=tr`,
    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=json&accept-language=tr`,
  ];

  for (const url of providers) {
    const payload = await fetchJson(url);
    const cityName = resolveCityFromReversePayload(payload);

    if (cityName) {
      return cityName;
    }
  }

  return null;
}

function requestCurrentPosition() {
  return new Promise((resolve) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      typeof navigator.geolocation.getCurrentPosition !== "function"
    ) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 1000 * 60 * 10,
      },
    );
  });
}

async function detectAndApplyUserCityFromBrowser() {
  if (state.city !== "all") {
    return;
  }

  const cachedCity = loadCachedUserCity();

  if (cachedCity) {
    selectCity(cachedCity, { scroll: false });
    return;
  }

  const position = await requestCurrentPosition();

  if (!position || state.city !== "all") {
    return;
  }

  const latitude = Number(position.coords.latitude);
  const longitude = Number(position.coords.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }

  const detectedCity = await resolveCityByCoordinates(latitude, longitude);

  if (!detectedCity || state.city !== "all") {
    return;
  }

  saveCachedUserCity(detectedCity);
  selectCity(detectedCity, { scroll: false });
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
  const users = parseJsonStorage(AUTH_USERS_KEY, []);

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

function loadSessionUser() {
  const session = parseJsonStorage(AUTH_SESSION_KEY, null);

  if (
    !session ||
    typeof session !== "object" ||
    typeof session.name !== "string" ||
    typeof session.email !== "string"
  ) {
    return null;
  }

  return {
    name: session.name.trim().slice(0, 40),
    email: normalizeEmail(session.email),
  };
}

function saveSessionUser(user) {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ name: user.name, email: user.email }),
  );
}

function clearSessionUser() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function setAuthMessage(text, isError = false) {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = text;
  authMessage.classList.toggle("auth-message-error", isError);
}

function toggleAuthForms(mode) {
  if (!loginForm || !signupForm || !authModalTitle || !authModalText) {
    return;
  }

  const isLoginMode = mode === "login";
  loginForm.classList.toggle("is-hidden", !isLoginMode);
  signupForm.classList.toggle("is-hidden", isLoginMode);
  authModalTitle.textContent = isLoginMode ? "Giriş yap" : "Kaydol";
  authModalText.textContent = isLoginMode
    ? "Hesabına girerek favori mekanlarını kaydet."
    : "Yeni hesabını oluştur, şehir rotalarını kaydetmeye başla.";
  setAuthMessage("");
}

function openAuthModal(mode) {
  if (!authModal) {
    return;
  }

  toggleAuthForms(mode);
  authModal.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";

  if (mode === "login" && loginEmail) {
    loginEmail.focus();
    return;
  }

  if (signupName) {
    signupName.focus();
  }
}

function closeAuthModal() {
  if (!authModal) {
    return;
  }

  authModal.classList.add("is-hidden");
  document.body.style.overflow = "";
}

function renderAuthBar() {
  const hasUser = Boolean(authState.user);

  if (authWelcome) {
    authWelcome.classList.toggle("is-hidden", !hasUser);
    authWelcome.textContent = hasUser ? `Merhaba, ${authState.user.name}` : "";
  }

  if (loginBtn) {
    loginBtn.classList.toggle("is-hidden", hasUser);
  }

  if (signupBtn) {
    signupBtn.classList.toggle("is-hidden", hasUser);
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle("is-hidden", !hasUser);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  if (!loginEmail || !loginPassword) {
    return;
  }

  const email = normalizeEmail(loginEmail.value);
  const password = String(loginPassword.value || "");
  const passwordHash = await hashPassword(password);
  const users = loadAuthUsers();
  const matchingUser = users.find(
    (user) => normalizeEmail(user.email) === email && user.passwordHash === passwordHash,
  );

  if (!matchingUser) {
    setAuthMessage("E-posta veya şifre hatalı.", true);
    return;
  }

  authState.user = {
    name: matchingUser.name.trim().slice(0, 40),
    email: normalizeEmail(matchingUser.email),
  };
  saveSessionUser(authState.user);
  renderAuthBar();
  closeAuthModal();
}

async function handleSignupSubmit(event) {
  event.preventDefault();

  if (!signupName || !signupEmail || !signupPassword || !signupPasswordRepeat) {
    return;
  }

  const name = signupName.value.trim().slice(0, 40);
  const email = normalizeEmail(signupEmail.value);
  const password = String(signupPassword.value || "");
  const repeated = String(signupPasswordRepeat.value || "");

  if (name.length < 2) {
    setAuthMessage("Ad soyad en az 2 karakter olmalı.", true);
    return;
  }

  if (!email.includes("@") || email.length < 6) {
    setAuthMessage("Geçerli bir e-posta gir.", true);
    return;
  }

  if (password.length < 6) {
    setAuthMessage("Şifre en az 6 karakter olmalı.", true);
    return;
  }

  if (password !== repeated) {
    setAuthMessage("Şifreler aynı değil.", true);
    return;
  }

  const users = loadAuthUsers();
  const emailExists = users.some((user) => normalizeEmail(user.email) === email);

  if (emailExists) {
    setAuthMessage("Bu e-posta ile kayıtlı bir hesap zaten var.", true);
    return;
  }

  const passwordHash = await hashPassword(password);
  users.push({ name, email, passwordHash });
  saveAuthUsers(users);

  authState.user = { name, email };
  saveSessionUser(authState.user);
  renderAuthBar();
  closeAuthModal();
}

function initializeAuth() {
  authState.user = loadSessionUser();
  renderAuthBar();

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      openAuthModal("login");
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      openAuthModal("signup");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      authState.user = null;
      clearSessionUser();
      renderAuthBar();
    });
  }

  if (authModalClose) {
    authModalClose.addEventListener("click", () => {
      closeAuthModal();
    });
  }

  if (authModal) {
    authModal.addEventListener("click", (event) => {
      if (event.target === authModal) {
        closeAuthModal();
      }
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && authModal && !authModal.classList.contains("is-hidden")) {
      closeAuthModal();
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }
}

function formatCount(value) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function normalizedCategoryQuery() {
  return normalizeForSearch(state.categoryQuery.trim());
}

function filteredFeaturedCategories() {
  const query = normalizedCategoryQuery();

  if (query.length === 0) {
    return featuredCategories;
  }

  return featuredCategories.filter((category) =>
    normalizeForSearch(category.name).includes(query),
  );
}

function filteredCategoryTags() {
  const query = normalizedCategoryQuery();

  if (query.length === 0) {
    return categoryTags;
  }

  return categoryTags.filter((tagName) =>
    normalizeForSearch(tagName).includes(query),
  );
}

function applyCategoryToSearch(categoryName) {
  state.query = categoryName;
  state.activeCategory = categoryName;

  if (searchInput) {
    searchInput.value = categoryName;
  }

  renderCategoryExplorer();
  renderVenues();
  if (venueGrid) {
    venueGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderCategoryCards(cards) {
  if (!categoryCardGrid) {
    return;
  }

  categoryCardGrid.innerHTML = "";

  if (cards.length === 0) {
    const emptyCards = document.createElement("p");
    emptyCards.className = "category-empty";
    emptyCards.textContent = "Kart bulunamadı. Farklı bir kategori dene.";
    categoryCardGrid.append(emptyCards);
    return;
  }

  cards.forEach((category) => {
    const card = document.createElement("button");
    const content = document.createElement("div");
    const title = document.createElement("h4");
    const count = document.createElement("p");

    card.type = "button";
    card.className = "category-card";
    card.style.backgroundImage = `url("${category.image}")`;
    card.setAttribute(
      "aria-label",
      `${category.name} kategorisini ara. ${formatCount(category.count)} mekan`,
    );

    content.className = "category-card-content";
    title.textContent = category.name;
    count.textContent = `${formatCount(category.count)} mekan`;

    content.append(title, count);
    card.append(content);
    card.addEventListener("click", () => {
      applyCategoryToSearch(category.name);
    });

    categoryCardGrid.append(card);
  });
}

function renderCategoryChips(chips) {
  if (!categoryChipGrid) {
    return;
  }

  categoryChipGrid.innerHTML = "";

  if (chips.length === 0) {
    const emptyChips = document.createElement("p");
    emptyChips.className = "category-empty";
    emptyChips.textContent = "Kutucuk bulunamadı. Aramayı temizleyebilirsin.";
    categoryChipGrid.append(emptyChips);
    return;
  }

  chips.forEach((chipLabel) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "category-chip";
    chip.textContent = chipLabel;

    if (state.activeCategory === chipLabel) {
      chip.classList.add("active");
    }

    chip.addEventListener("click", () => {
      applyCategoryToSearch(chipLabel);
    });

    categoryChipGrid.append(chip);
  });
}

function renderCategoryExplorer() {
  if (!categoryCardGrid && !categoryChipGrid) {
    return;
  }

  renderCategoryCards(filteredFeaturedCategories());
  renderCategoryChips(filteredCategoryTags());
}

function getRegion(province) {
  return cityMetaByName.get(province)?.region || "Bilinmiyor";
}

function populateCityFilter() {
  if (!cityFilter) {
    return;
  }

  regionOrder.forEach((regionName) => {
    const group = document.createElement("optgroup");
    group.label = regionName;

    regionCityData[regionName].forEach((cityData) => {
      const option = document.createElement("option");
      option.value = cityData.name;
      option.textContent = cityData.name;
      group.append(option);
    });

    cityFilter.append(group);
  });
}

function venuesForCity(city) {
  return venuesByCity.get(city) || [];
}

function venuesForCityDistrict(city, district) {
  const districtMap = venuesByCityDistrict.get(city);

  if (!districtMap) {
    return [];
  }

  return districtMap.get(district) || [];
}

function districtsForCity(city) {
  if (city === "all") {
    return [];
  }

  const knownDistricts = districtsByCity[city];

  if (Array.isArray(knownDistricts) && knownDistricts.length > 0) {
    return knownDistricts;
  }

  const districts = venuesForCity(city)
    .map((venue) => venue.district)
    .filter(Boolean);

  return [...new Set(districts)].sort((left, right) => left.localeCompare(right, "tr"));
}

function buildSharePath() {
  const url = new URL(window.location.href);

  if (state.city === "all") {
    url.searchParams.delete("il");
    url.searchParams.delete("ilce");
    return `${url.pathname}${url.search}`;
  }

  url.searchParams.set("il", toSlug(state.city));

  if (state.district === "all") {
    url.searchParams.delete("ilce");
  } else {
    url.searchParams.set("ilce", toSlug(state.district));
  }

  return `${url.pathname}${url.search}`;
}

function openCityPage(city) {
  if (!city) {
    return;
  }

  const targetUrl = new URL("city.html", window.location.href);
  targetUrl.searchParams.set("il", toSlug(city));
  window.location.href = targetUrl.toString();
}

function restaurantPageUrl(venue) {
  if (!venue || !venue.city || !venue.name) {
    return "#";
  }

  const targetUrl = new URL("restaurant.html", window.location.href);
  targetUrl.searchParams.set("il", toSlug(venue.city));
  targetUrl.searchParams.set("ilce", toSlug(venue.district || ""));
  targetUrl.searchParams.set("mekan", toSlug(venue.name));

  if (venue.sourcePlaceId) {
    targetUrl.searchParams.set("pid", venue.sourcePlaceId);
  }

  return targetUrl.toString();
}

function openRestaurantPage(venue) {
  window.location.href = restaurantPageUrl(venue);
}

function resolveCitySummary(city, cityVenueCountValue, region) {
  const profile = cityProfiles[city];

  if (profile) {
    return profile.summary;
  }

  if (cityVenueCountValue === 0) {
    return `${city} için ilk mekanları ekleme aşamasındayız. Bölgesel rota bu ilde de açılıyor.`;
  }

  return `${city} için başlangıç listesi hazır. ${region} bölgesine ait tatları genişletmeye devam ediyoruz.`;
}

function resolveCityTags(city, cityVenues, region) {
  const profileTags = cityProfiles[city]?.tags || [];
  const cuisineTags = cityVenues.map((venue) => venue.cuisine);
  const mergedTags = [...profileTags, ...cuisineTags, `${region} rotası`];

  return [...new Set(mergedTags)].slice(0, 6);
}

function updateUrl() {
  window.history.replaceState({}, "", buildSharePath());
}

function applyUrlState() {
  const url = new URL(window.location.href);
  const citySlug = url.searchParams.get("il");
  const districtSlug = url.searchParams.get("ilce");

  if (!citySlug) {
    state.district = "all";
    return false;
  }

  const mappedCity = cityBySlug.get(toSlug(citySlug));

  if (mappedCity) {
    state.city = mappedCity;
    state.district = "all";

    if (districtSlug) {
      const mappedDistrict =
        districtsForCity(mappedCity).find(
          (districtName) => toSlug(districtName) === toSlug(districtSlug),
        ) || "all";
      state.district = mappedDistrict;
    }

    return true;
  }

  return false;
}

function cardDelay(index) {
  return `${Math.min(0.35, index * 0.04)}s`;
}

async function resolveTopCityImage(cityName) {
  if (topCityImageCache.has(cityName)) {
    return topCityImageCache.get(cityName);
  }

  const fallbackImage =
    topCityFallbackImages[cityName] || topCityFallbackImages.İstanbul;
  const landmarkPage = topCityLandmarkPages[cityName];

  if (!landmarkPage || typeof fetch !== "function") {
    topCityImageCache.set(cityName, fallbackImage);
    return fallbackImage;
  }

  try {
    const response = await fetch(
      `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(landmarkPage)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "omit",
      },
    );

    if (response.ok) {
      const payload = await response.json();
      const imageUrl =
        payload &&
        payload.thumbnail &&
        typeof payload.thumbnail.source === "string"
          ? payload.thumbnail.source
          : fallbackImage;
      topCityImageCache.set(cityName, imageUrl);
      return imageUrl;
    }
  } catch (_error) {
    // Ignore and use fallback image.
  }

  topCityImageCache.set(cityName, fallbackImage);
  return fallbackImage;
}

function renderTopPopulationCities() {
  if (!topCityGrid) {
    return;
  }

  topCityGrid.innerHTML = "";

  topPopulationCities.forEach((cityData) => {
    const card = document.createElement("button");
    const thumb = document.createElement("span");
    const content = document.createElement("span");
    const name = document.createElement("span");
    const venueCount = cityVenueCountByName.get(cityData.name) || 0;
    const stat = document.createElement("span");

    card.type = "button";
    card.className = "top-city-card";
    card.dataset.city = cityData.name;
    card.title = `${cityData.name} şehrini seç`;

    if (state.city === cityData.name) {
      card.classList.add("active");
    }

    thumb.className = "top-city-thumb";
    thumb.style.backgroundImage = `url('${topCityFallbackImages[cityData.name] || topCityFallbackImages.İstanbul}')`;
    thumb.setAttribute("aria-hidden", "true");
    void resolveTopCityImage(cityData.name).then((imageUrl) => {
      if (thumb.isConnected) {
        thumb.style.backgroundImage = `url('${imageUrl}')`;
      }
    });

    content.className = "top-city-content";
    name.className = "top-city-name";
    name.textContent = cityData.name;
    stat.className = "top-city-population";
    stat.textContent = `${venueCount.toLocaleString("tr-TR")} restoran`;

    content.append(name, stat);
    card.append(thumb, content);
    card.addEventListener("click", () => {
      openCityPage(cityData.name);
    });

    topCityGrid.append(card);
  });
}

function renderProvinces() {
  provinceGrid.innerHTML = "";
  renderTopPopulationCities();

  regionOrder.forEach((regionName) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const regionTitle = document.createElement("h4");
    regionTitle.className = "province-region";
    regionTitle.textContent = regionName;

    const citiesWrap = document.createElement("div");
    citiesWrap.className = "province-cities";

    regionCityData[regionName].forEach((cityData) => {
      const button = document.createElement("button");
      const cityName = document.createElement("span");

      button.type = "button";
      button.className = "province-pill";
      button.dataset.city = cityData.name;
      button.title = `${regionName} bölgesi`;
      cityName.className = "province-city";
      cityName.textContent = cityData.name;

      if (state.city === cityData.name) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        openCityPage(cityData.name);
      });

      button.append(cityName);
      citiesWrap.append(button);
    });

    row.append(regionTitle, citiesWrap);
    provinceGrid.append(row);
  });
}

function renderDistrictFilter() {
  if (!districtFilterWrap || !districtFilter) {
    return;
  }

  if (state.city === "all") {
    districtFilterWrap.classList.add("is-hidden");
    districtFilter.innerHTML = '<option value="all">Tüm ilçeler</option>';
    districtFilter.value = "all";
    return;
  }

  const districts = districtsForCity(state.city);
  districtFilter.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = `Tüm ${state.city} ilçeleri`;
  districtFilter.append(allOption);

  districts.forEach((districtName) => {
    const option = document.createElement("option");
    option.value = districtName;
    option.textContent = districtName;
    districtFilter.append(option);
  });

  if (!districts.includes(state.district)) {
    state.district = "all";
  }

  districtFilter.value = state.district;
  districtFilterWrap.classList.remove("is-hidden");
}

function selectCity(
  city,
  options = { scroll: false, keepDistrict: false },
) {
  state.city = city;

  if (!options.keepDistrict) {
    state.district = "all";
  }

  if (cityFilter) {
    cityFilter.value = city;
  }

  renderProvinces();
  renderDistrictFilter();
  renderVenues();
  renderCityDetail();
  updateUrl();

  if (options.scroll && state.city !== "all") {
    const scrollTarget =
      districtFilterWrap && !districtFilterWrap.classList.contains("is-hidden")
        ? districtFilterWrap
        : provinceGrid;
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectDistrict(district) {
  state.district = district;

  if (districtFilter) {
    districtFilter.value = district;
  }

  renderVenues();
  renderCityDetail();
  updateUrl();
}

function createVenueCard(venue, index) {
  if (!venueTemplate || !venueTemplate.content || !venueTemplate.content.firstElementChild) {
    return document.createElement("article");
  }

  const card = venueTemplate.content.firstElementChild.cloneNode(true);
  const nameLink = card.querySelector(".venue-name-link");

  card.style.animationDelay = cardDelay(index);
  card.querySelector(".chip").textContent = venue.cuisine;
  card.querySelector(".city").textContent = `${venue.city} / ${venue.district}`;
  if (nameLink) {
    nameLink.textContent = venue.name;
    nameLink.href = restaurantPageUrl(venue);
    nameLink.setAttribute("aria-label", `${venue.name} sayfasını aç`);
  }
  card.querySelector(".meta").textContent =
    "Yerel yorumlarla öne çıktı. Akşam saatlerinde yoğun olabilir.";
  card.querySelector(".rating").textContent = `⭐ ${venue.rating.toFixed(1)}`;
  card.querySelector(".budget").textContent = venue.budget;

  return card;
}

function filteredVenues() {
  const query = normalizeForSearch(state.query.trim());
  const scopedVenues =
    state.city === "all"
      ? venues
      : state.district === "all"
        ? venuesForCity(state.city)
        : venuesForCityDistrict(state.city, state.district);

  if (query.length === 0) {
    return scopedVenues;
  }

  return scopedVenues.filter((venue) => venue.searchIndex.includes(query));
}

function renderEmptyState() {
  if (!venueGrid) {
    return;
  }

  const emptyState = document.createElement("article");
  emptyState.className = "empty-state";
  if (state.city !== "all" && state.district !== "all") {
    emptyState.textContent = `${state.city} / ${state.district} için eşleşen mekan bulunamadı.`;
  } else {
    emptyState.textContent =
      "Bu şehir için henüz mekan eklenmedi. Sonraki adımda bu ile özel veri seti hazırlayabiliriz.";
  }
  venueGrid.append(emptyState);
}

function topRatedVenues(venuesToRank) {
  return venuesToRank
    .slice()
    .sort((left, right) => {
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }

      return left.name.localeCompare(right.name, "tr");
    })
    .slice(0, 10);
}

function renderVenues() {
  if (!venueGrid || !venueTemplate) {
    return;
  }

  const matching = topRatedVenues(filteredVenues());
  venueGrid.innerHTML = "";

  if (resultCount) {
    resultCount.textContent = matching.length.toString();
  }

  if (matching.length === 0) {
    renderEmptyState();
    return;
  }

  matching.forEach((venue, index) => {
    venueGrid.append(createVenueCard(venue, index));
  });
}

function renderCityDetail() {
  if (
    !cityDetail ||
    !cityTitle ||
    !citySummary ||
    !cityVenueCount ||
    !cityCuisineCount ||
    !cityRegion ||
    !cityTags ||
    !cityShareLink
  ) {
    return;
  }

  if (state.city === "all") {
    cityDetail.classList.add("is-hidden");
    return;
  }

  const city = state.city;
  const region = getRegion(city);
  const cityVenues = venuesForCity(city);
  const shareUrl = buildSharePath();

  cityTitle.textContent = `${city} lezzet rotası`;
  citySummary.textContent = resolveCitySummary(city, cityVenues.length, region);
  cityVenueCount.textContent = cityVenues.length.toString();
  cityCuisineCount.textContent = (cuisineCountByCity.get(city) || 0).toString();
  cityRegion.textContent = region;

  cityTags.innerHTML = "";
  resolveCityTags(city, cityVenues, region).forEach((tagText) => {
    const tag = document.createElement("span");
    tag.className = "city-tag";
    tag.textContent = tagText;
    cityTags.append(tag);
  });

  cityShareLink.href = shareUrl;
  cityShareLink.textContent =
    state.district === "all"
      ? `${city} linkini paylaş`
      : `${city} / ${state.district} linkini paylaş`;

  cityDetail.classList.remove("is-hidden");
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    state.query = target.value;
    const normalizedQuery = normalizeForSearch(target.value.trim());
    const matchingCategory =
      allCategoryNames.find(
        (categoryName) => normalizeForSearch(categoryName) === normalizedQuery,
      ) || "";
    state.activeCategory = matchingCategory;
    renderCategoryExplorer();
    renderVenues();
  });
}

if (categorySearch) {
  categorySearch.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    state.categoryQuery = target.value;
    renderCategoryExplorer();
  });
}

if (cityFilter) {
  cityFilter.addEventListener("change", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    selectCity(target.value, { scroll: false });
  });
}

if (districtFilter) {
  districtFilter.addEventListener("change", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    selectDistrict(target.value);
  });
}

if (clearFilters) {
  clearFilters.addEventListener("click", () => {
    state.query = "";
    state.city = "all";
    state.district = "all";
    state.categoryQuery = "";
    state.activeCategory = "";

    if (cityFilter) {
      cityFilter.value = "all";
    }

    if (searchInput) {
      searchInput.value = "";
    }

    if (categorySearch) {
      categorySearch.value = "";
    }

    renderCategoryExplorer();
    renderProvinces();
    renderDistrictFilter();
    renderVenues();
    renderCityDetail();
    updateUrl();
  });
}

if (cityShareLink) {
  cityShareLink.addEventListener("click", (event) => {
    if (state.city === "all") {
      return;
    }

    event.preventDefault();

    const shareTarget = `${window.location.origin}${buildSharePath()}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareTarget)
        .then(() => {
          cityShareLink.textContent = "Link kopyalandı";
          window.setTimeout(() => {
            cityShareLink.textContent =
              state.district === "all"
                ? `${state.city} linkini paylaş`
                : `${state.city} / ${state.district} linkini paylaş`;
          }, 1400);
        })
        .catch(() => {
          window.location.href = shareTarget;
        });
      return;
    }

    window.location.href = shareTarget;
  });
}

window.addEventListener("popstate", () => {
  state.city = "all";
  state.district = "all";
  applyUrlState();

  if (cityFilter) {
    cityFilter.value = state.city;
  }

  renderProvinces();
  renderDistrictFilter();
  renderVenues();
  renderCityDetail();
});

async function initializeApp() {
  initializeAuth();
  venues = await loadVenuesData();
  buildVenueIndexes(venues);
  districtsByCity = await loadDistrictData(venues);
  populateCityFilter();
  const hasUrlCity = applyUrlState();

  if (!hasUrlCity && state.city === "all") {
    const cachedCity = loadCachedUserCity();

    if (cachedCity) {
      state.city = cachedCity;
      state.district = "all";
    }
  }

  if (cityFilter) {
    cityFilter.value = state.city;
  }

  renderCategoryExplorer();
  renderProvinces();
  renderDistrictFilter();
  renderVenues();
  renderCityDetail();

  if (!hasUrlCity && state.city === "all") {
    void detectAndApplyUserCityFromBrowser();
  }
}

initializeApp();
