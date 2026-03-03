const VENUES_JSON_PATH = "data/venues.json";
const FOOD_JSON_PATH = "data/keyif-food.json";
const DISTRICTS_JSON_PATH = "data/districts.json";
const API_BASE_URL = (() => {
  if (typeof window === "undefined") {
    return "";
  }

  if (typeof window.ARAMABUL_API_BASE === "string" && window.ARAMABUL_API_BASE.trim()) {
    return window.ARAMABUL_API_BASE.trim().replace(/\/+$/u, "");
  }

  if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }

  return window.location.origin;
})();
const VENUES_API_ENDPOINT =
  typeof window !== "undefined" && typeof window.ARAMABUL_VENUES_API === "string"
    ? window.ARAMABUL_VENUES_API.trim()
    : API_BASE_URL
      ? `${API_BASE_URL}/api/venues?limit=50000`
      : "";
const DISTRICTS_API_ENDPOINT =
  typeof window !== "undefined" && typeof window.ARAMABUL_DISTRICTS_API === "string"
    ? window.ARAMABUL_DISTRICTS_API.trim()
    : API_BASE_URL
      ? `${API_BASE_URL}/api/districts`
      : "";
const runtime = window.ARAMABUL_RUNTIME;
const FALLBACK_FOOD_SCRIPT = "data/fallback-food-data.js?v=20260302-01";
const AUTH_USERS_KEY = runtime.storageKeys.authUsers;
const AUTH_SESSION_KEY = runtime.storageKeys.authSession;
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

const sortedMainPageCategoryTags = [...mainPageCategoryTags].sort((left, right) =>
  left.localeCompare(right, "tr"),
);

const cityTitle = document.querySelector("#cityTitle");
const cityToplineHomeLink = document.querySelector("#cityToplineHomeLink");
const cityToplineFoodLink = document.querySelector("#cityToplineFoodLink");
const cityToplineCityLink = document.querySelector("#cityToplineCityLink");
const cityToplineDistrictDivider = document.querySelector("#cityToplineDistrictDivider");
const cityToplineDistrict = document.querySelector("#cityToplineDistrict");
const cityResultMeta = document.querySelector("#cityResultMeta");
const cityVenueList = document.querySelector("#cityVenueList");
const cityLayout = document.querySelector(".city-layout");
const citySidebar = document.querySelector(".city-sidebar");
const citySortTabsWrap = document.querySelector(".city-sort-tabs");
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
const sortTabs = [...document.querySelectorAll(".city-sort-tab")];
const districtHeading = document.querySelector(".filter-card-district .filter-card-head h3");
const categoryHeading = document.querySelector(".filter-card-category .filter-card-head h3");
const districtFlyoutTitle = document.querySelector(".district-flyout-head strong");
const categoryFlyoutTitle = document.querySelector(".category-flyout-head strong");
const footerColumns = [...document.querySelectorAll(".yr-footer-col")];
const footerBottomText = document.querySelector(".yr-footer-bottom p");
const footerSocial = document.querySelector(".yr-footer-social");
const footerSocialLinks = [...document.querySelectorAll(".yr-footer-social a")];

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
  sort: "traveler",
  page: 1,
};

const authState = {
  user: null,
  mode: "login",
};

const ORHANELI_DEMO_CITY = "Bursa";
const ORHANELI_DEMO_DISTRICT = "Orhaneli";

const LANGUAGE_STORAGE_KEY = runtime.storageKeys.language;
const SUPPORTED_LANGUAGES = new Set(["TR", "EN", "RU", "DE", "ZH"]);
const LANGUAGE_LOCALES = {
  TR: "tr-TR",
  EN: "en-US",
  RU: "ru-RU",
  DE: "de-DE",
  ZH: "zh-CN",
};

function readStorageValue(key) {
  return runtime.readStorageValue(key);
}

function writeStorageValue(key, value) {
  runtime.writeStorageValue(key, value);
}

function removeStorageValue(key) {
  runtime.removeStorageValue(key);
}

const CITY_I18N = {
  TR: {
    title: "aramabul | {city} Restoranları",
    cityTitle: "{city} Restoranları",
    toplineHome: "Anasayfa",
    toplineFood: "Keyif",
    cityLink: "{city} İli",
    districtFallback: "İlçe",
    districtLabel: "{district} İlçesi",
    districtSearch: "İlçeye göre ara",
    categorySearch: "Kategoriye göre ara",
    districtPickerAria: "İlçe seçimini aç",
    categoryPickerAria: "Kategori seçimini aç",
    districtListAria: "İlçe listesi",
    districtOptionsAria: "İlçe seçenekleri",
    categoryListAria: "Kategori listesi",
    categoryOptionsAria: "Kategori seçenekleri",
    allDistricts: "Tüm ilçeler",
    allCategories: "Tüm kategoriler",
    districtListTitle: "İlçeler",
    categoryListTitle: "Kategoriler",
    sortTraveler: "En çok tercih edilen",
    sortLocals: "Yerel favoriler",
    sortViewed: "En çok görüntülenen",
    sortRated: "En yüksek puan",
    paginationPrev: "Önceki",
    paginationNext: "Sonraki",
    paginationAria: "Sayfa {page}",
    emptyFiltered: "Bu filtrelerle eşleşen restoran bulunamadı. Filtreleri genişleterek tekrar dene.",
    openVenueAria: "{name} sayfasını aç",
    resultWithDistrict:
      "{city} ilinde toplam {cityTotal} restoran bulunmaktadır. {district} İlçesinde de {districtTotal} restoran vardır.",
    resultWithoutDistrict: "{city} ilinde toplam {cityTotal} restoran bulunmaktadır.",
    cityDataMissingTitle: "Şehir verisi bulunamadı",
    cityDataMissingText: "Gösterilecek restoran verisi yok.",
    footerLabel: "Alt Bant",
    footerDownloadTitle: "İndir.",
    footerDownloadNow: "Hemen indirin",
    footerDiscoverTitle: "Keşfet",
    footerAbout: "Hakkımızda",
    footerCareer: "Kariyer",
    footerTech: "Teknoloji",
    footerContact: "İletişim",
    footerHelpTitle: "Yardım",
    footerFaq: "Sıkça Sorulan Sorular",
    footerKvkk: "Kişisel Verilerin Korunması",
    footerPrivacy: "Gizlilik Politikası",
    footerTerms: "Kullanım Koşulları",
    footerCookies: "Çerez Politikası",
    footerPartnerTitle: "İş ortaklığımız",
    footerAddRestaurant: "Restoran ekle",
    footerAddPrice: "Yer ekle",
    footerCollab: "İş birliği",
    footerCopyright: "© 2026 aramabul",
    footerSocial: "Sosyal",
    footerSearchAria: "Ara",
    footerWorldAria: "Dünya",
  },
  EN: {
    title: "aramabul | {city} Restaurants",
    cityTitle: "{city} Restaurants",
    toplineHome: "Home",
    toplineFood: "Keyif",
    cityLink: "{city} City",
    districtFallback: "District",
    districtLabel: "{district} District",
    districtSearch: "Search by district",
    categorySearch: "Search by category",
    districtPickerAria: "Open district selector",
    categoryPickerAria: "Open category selector",
    districtListAria: "District list",
    districtOptionsAria: "District options",
    categoryListAria: "Category list",
    categoryOptionsAria: "Category options",
    allDistricts: "All districts",
    allCategories: "All categories",
    districtListTitle: "Districts",
    categoryListTitle: "Categories",
    sortTraveler: "Most preferred",
    sortLocals: "Local favorites",
    sortViewed: "Most viewed",
    sortRated: "Highest rated",
    paginationPrev: "Previous",
    paginationNext: "Next",
    paginationAria: "Page {page}",
    emptyFiltered: "No restaurants match these filters. Try widening your filters.",
    openVenueAria: "Open {name} page",
    resultWithDistrict:
      "There are {cityTotal} restaurants in {city}. There are {districtTotal} restaurants in {district} district.",
    resultWithoutDistrict: "There are {cityTotal} restaurants in {city}.",
    cityDataMissingTitle: "City data not found",
    cityDataMissingText: "No restaurant data to display.",
    footerLabel: "Footer",
    footerDownloadTitle: "Download",
    footerDownloadNow: "Download now",
    footerDiscoverTitle: "Discover",
    footerAbout: "About us",
    footerCareer: "Careers",
    footerTech: "Technology",
    footerContact: "Contact",
    footerHelpTitle: "Help",
    footerFaq: "Frequently Asked Questions",
    footerKvkk: "Personal Data Protection",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Use",
    footerCookies: "Cookie Policy",
    footerPartnerTitle: "Partnership",
    footerAddRestaurant: "Add restaurant",
    footerAddPrice: "Add place",
    footerCollab: "Collaboration",
    footerCopyright: "© 2026 aramabul",
    footerSocial: "Social",
    footerSearchAria: "Search",
    footerWorldAria: "World",
  },
  RU: {
    title: "aramabul | Рестораны {city}",
    cityTitle: "Рестораны {city}",
    toplineHome: "Главная",
    toplineFood: "Keyif",
    cityLink: "Город {city}",
    districtFallback: "Район",
    districtLabel: "Район {district}",
    districtSearch: "Поиск по району",
    categorySearch: "Поиск по категории",
    districtPickerAria: "Открыть выбор района",
    categoryPickerAria: "Открыть выбор категории",
    districtListAria: "Список районов",
    districtOptionsAria: "Пункты районов",
    categoryListAria: "Список категорий",
    categoryOptionsAria: "Пункты категорий",
    allDistricts: "Все районы",
    allCategories: "Все категории",
    districtListTitle: "Районы",
    categoryListTitle: "Категории",
    sortTraveler: "Самые популярные",
    sortLocals: "Выбор местных",
    sortViewed: "Самые просматриваемые",
    sortRated: "Самый высокий рейтинг",
    paginationPrev: "Назад",
    paginationNext: "Далее",
    paginationAria: "Страница {page}",
    emptyFiltered: "По этим фильтрам ресторанов не найдено. Расширьте фильтры и попробуйте снова.",
    openVenueAria: "Открыть страницу {name}",
    resultWithDistrict:
      "В городе {city} всего {cityTotal} ресторанов. В районе {district} есть {districtTotal} ресторанов.",
    resultWithoutDistrict: "В городе {city} всего {cityTotal} ресторанов.",
    cityDataMissingTitle: "Данные города не найдены",
    cityDataMissingText: "Нет данных ресторанов для показа.",
    footerLabel: "Нижняя панель",
    footerDownloadTitle: "Скачать",
    footerDownloadNow: "Скачать",
    footerDiscoverTitle: "Обзор",
    footerAbout: "О нас",
    footerCareer: "Карьера",
    footerTech: "Технологии",
    footerContact: "Контакты",
    footerHelpTitle: "Помощь",
    footerFaq: "Частые вопросы",
    footerKvkk: "Защита персональных данных",
    footerPrivacy: "Политика конфиденциальности",
    footerTerms: "Условия использования",
    footerCookies: "Политика cookies",
    footerPartnerTitle: "Партнерство",
    footerAddRestaurant: "Добавить ресторан",
    footerAddPrice: "Добавить место",
    footerCollab: "Сотрудничество",
    footerCopyright: "© 2026 aramabul",
    footerSocial: "Соцсети",
    footerSearchAria: "Поиск",
    footerWorldAria: "Мир",
  },
  DE: {
    title: "aramabul | Restaurants in {city}",
    cityTitle: "{city} Restaurants",
    toplineHome: "Startseite",
    toplineFood: "Keyif",
    cityLink: "Stadt {city}",
    districtFallback: "Bezirk",
    districtLabel: "{district} Bezirk",
    districtSearch: "Nach Bezirk suchen",
    categorySearch: "Nach Kategorie suchen",
    districtPickerAria: "Bezirksauswahl öffnen",
    categoryPickerAria: "Kategorieauswahl öffnen",
    districtListAria: "Bezirksliste",
    districtOptionsAria: "Bezirksoptionen",
    categoryListAria: "Kategorieliste",
    categoryOptionsAria: "Kategorieoptionen",
    allDistricts: "Alle Bezirke",
    allCategories: "Alle Kategorien",
    districtListTitle: "Bezirke",
    categoryListTitle: "Kategorien",
    sortTraveler: "Am meisten bevorzugt",
    sortLocals: "Lokale Favoriten",
    sortViewed: "Am meisten angesehen",
    sortRated: "Höchste Bewertung",
    paginationPrev: "Zurück",
    paginationNext: "Weiter",
    paginationAria: "Seite {page}",
    emptyFiltered: "Keine Restaurants für diese Filter gefunden. Bitte Filter erweitern und erneut versuchen.",
    openVenueAria: "Seite {name} öffnen",
    resultWithDistrict:
      "In {city} gibt es insgesamt {cityTotal} Restaurants. Im Bezirk {district} gibt es {districtTotal} Restaurants.",
    resultWithoutDistrict: "In {city} gibt es insgesamt {cityTotal} Restaurants.",
    cityDataMissingTitle: "Stadtdaten nicht gefunden",
    cityDataMissingText: "Keine Restaurantdaten zum Anzeigen.",
    footerLabel: "Fußbereich",
    footerDownloadTitle: "Download",
    footerDownloadNow: "Jetzt herunterladen",
    footerDiscoverTitle: "Entdecken",
    footerAbout: "Über uns",
    footerCareer: "Karriere",
    footerTech: "Technologie",
    footerContact: "Kontakt",
    footerHelpTitle: "Hilfe",
    footerFaq: "Häufige Fragen",
    footerKvkk: "Datenschutz personenbezogener Daten",
    footerPrivacy: "Datenschutzrichtlinie",
    footerTerms: "Nutzungsbedingungen",
    footerCookies: "Cookie-Richtlinie",
    footerPartnerTitle: "Partnerschaft",
    footerAddRestaurant: "Restaurant hinzufügen",
    footerAddPrice: "Ort hinzufügen",
    footerCollab: "Zusammenarbeit",
    footerCopyright: "© 2026 aramabul",
    footerSocial: "Sozial",
    footerSearchAria: "Suche",
    footerWorldAria: "Welt",
  },
  ZH: {
    title: "aramabul | {city} 餐厅",
    cityTitle: "{city} 餐厅",
    toplineHome: "首页",
    toplineFood: "Keyif",
    cityLink: "{city} 市",
    districtFallback: "区",
    districtLabel: "{district} 区",
    districtSearch: "按区搜索",
    categorySearch: "按分类搜索",
    districtPickerAria: "打开区选择器",
    categoryPickerAria: "打开分类选择器",
    districtListAria: "区列表",
    districtOptionsAria: "区选项",
    categoryListAria: "分类列表",
    categoryOptionsAria: "分类选项",
    allDistricts: "全部区",
    allCategories: "全部分类",
    districtListTitle: "区",
    categoryListTitle: "分类",
    sortTraveler: "最受欢迎",
    sortLocals: "本地推荐",
    sortViewed: "浏览最多",
    sortRated: "评分最高",
    paginationPrev: "上一页",
    paginationNext: "下一页",
    paginationAria: "第 {page} 页",
    emptyFiltered: "没有符合这些筛选条件的餐厅。请放宽筛选后重试。",
    openVenueAria: "打开 {name} 页面",
    resultWithDistrict: "{city} 共有 {cityTotal} 家餐厅。{district} 区有 {districtTotal} 家餐厅。",
    resultWithoutDistrict: "{city} 共有 {cityTotal} 家餐厅。",
    cityDataMissingTitle: "未找到城市数据",
    cityDataMissingText: "没有可显示的餐厅数据。",
    footerLabel: "页脚",
    footerDownloadTitle: "下载",
    footerDownloadNow: "立即下载",
    footerDiscoverTitle: "探索",
    footerAbout: "关于我们",
    footerCareer: "招聘",
    footerTech: "技术",
    footerContact: "联系",
    footerHelpTitle: "帮助",
    footerFaq: "常见问题",
    footerKvkk: "个人数据保护",
    footerPrivacy: "隐私政策",
    footerTerms: "使用条款",
    footerCookies: "Cookie 政策",
    footerPartnerTitle: "合作伙伴",
    footerAddRestaurant: "添加餐厅",
    footerAddPrice: "添加地点",
    footerCollab: "合作",
    footerCopyright: "© 2026 aramabul",
    footerSocial: "社交",
    footerSearchAria: "搜索",
    footerWorldAria: "世界",
  },
};

let activeLanguage = "TR";

function normalizeLanguageCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "TR";
}

function readLanguageFromStorage() {
  try {
    return normalizeLanguageCode(readStorageValue(LANGUAGE_STORAGE_KEY));
  } catch (_error) {
    return "TR";
  }
}

function getCurrentLanguage() {
  if (typeof window.ARAMABUL_GET_LANGUAGE === "function") {
    return normalizeLanguageCode(window.ARAMABUL_GET_LANGUAGE());
  }

  return activeLanguage;
}

function currentLocale() {
  return LANGUAGE_LOCALES[getCurrentLanguage()] || LANGUAGE_LOCALES.TR;
}

function cityT(key, replacements = {}) {
  const lang = getCurrentLanguage();
  const languagePack = CITY_I18N[lang] || CITY_I18N.TR;
  const template = languagePack[key] || CITY_I18N.TR[key] || "";

  return Object.entries(replacements).reduce((output, [token, value]) => {
    return output.replaceAll(`{${token}}`, String(value));
  }, template);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(currentLocale());
}

function applyCityStaticTranslations() {
  if (cityToplineHomeLink) {
    cityToplineHomeLink.href = "index.html";
    cityToplineHomeLink.textContent = cityT("toplineHome");
  }

  if (cityToplineFoodLink) {
    cityToplineFoodLink.href = "keyif.html";
    cityToplineFoodLink.textContent = cityT("toplineFood");
  }

  if (districtHeading) {
    districtHeading.textContent = cityT("districtSearch");
  }

  if (categoryHeading) {
    categoryHeading.textContent = cityT("categorySearch");
  }

  if (districtPickerTrigger) {
    districtPickerTrigger.setAttribute("aria-label", cityT("districtPickerAria"));
  }

  if (categoryPickerTrigger) {
    categoryPickerTrigger.setAttribute("aria-label", cityT("categoryPickerAria"));
  }

  const districtFlyout = document.querySelector("#districtFlyout");
  if (districtFlyout) {
    districtFlyout.setAttribute("aria-label", cityT("districtListAria"));
  }

  if (districtFlyoutList) {
    districtFlyoutList.setAttribute("aria-label", cityT("districtOptionsAria"));
  }

  if (categoryFlyoutTitle) {
    categoryFlyoutTitle.textContent = cityT("categoryListTitle");
  }

  const categoryFlyout = document.querySelector("#categoryFlyout");
  if (categoryFlyout) {
    categoryFlyout.setAttribute("aria-label", cityT("categoryListAria"));
  }

  if (categoryFlyoutList) {
    categoryFlyoutList.setAttribute("aria-label", cityT("categoryOptionsAria"));
  }

  if (districtFlyoutTitle) {
    districtFlyoutTitle.textContent = cityT("districtListTitle");
  }

  sortTabs.forEach((button) => {
    switch (button.dataset.sort) {
      case "locals":
        button.textContent = cityT("sortLocals");
        break;
      case "viewed":
        button.textContent = cityT("sortViewed");
        break;
      case "rated":
        button.textContent = cityT("sortRated");
        break;
      case "traveler":
      default:
        button.textContent = cityT("sortTraveler");
        break;
    }
  });

  if (footerColumns[0]) {
    const links = footerColumns[0].querySelectorAll("a");
    const title = footerColumns[0].querySelector("h4");
    const badges = footerColumns[0].querySelectorAll(".store-badge-top");
    if (title) {
      title.textContent = cityT("footerDownloadTitle");
    }
    badges.forEach((badge) => {
      badge.textContent = cityT("footerDownloadNow");
    });
    if (links[0]) {
      links[0].setAttribute("aria-label", "App Store");
    }
    if (links[1]) {
      links[1].setAttribute("aria-label", "Google Play");
    }
  }

  if (footerColumns[1]) {
    const items = footerColumns[1].querySelectorAll("a");
    const title = footerColumns[1].querySelector("h4");
    if (title) {
      title.textContent = cityT("footerDiscoverTitle");
    }
    if (items[0]) {
      items[0].textContent = cityT("footerAbout");
    }
    if (items[1]) {
      items[1].textContent = cityT("footerTech");
    }
    if (items[2]) {
      items[2].textContent = cityT("footerContact");
    }
  }

  if (footerColumns[2]) {
    const items = footerColumns[2].querySelectorAll("a");
    const title = footerColumns[2].querySelector("h4");
    if (title) {
      title.textContent = cityT("footerHelpTitle");
    }
    if (items[0]) {
      items[0].textContent = cityT("footerFaq");
    }
    if (items[1]) {
      items[1].textContent = cityT("footerKvkk");
    }
    if (items[2]) {
      items[2].textContent = cityT("footerPrivacy");
    }
    if (items[3]) {
      items[3].textContent = cityT("footerTerms");
    }
    if (items[4]) {
      items[4].textContent = cityT("footerCookies");
    }
  }

  if (footerColumns[3]) {
    const items = footerColumns[3].querySelectorAll("a");
    const title = footerColumns[3].querySelector("h4");
    if (title) {
      title.textContent = cityT("footerPartnerTitle");
    }
    if (items[0]) {
      items[0].textContent = cityT("footerAddRestaurant");
    }
    if (items[1]) {
      items[1].textContent = cityT("footerAddPrice");
    }
    if (items[2]) {
      items[2].textContent = cityT("footerCollab");
    }
  }

  if (footerBottomText) {
    footerBottomText.textContent = cityT("footerCopyright");
  }

  if (footerSocial) {
    footerSocial.setAttribute("aria-label", cityT("footerSocial"));
  }

  if (footerSocialLinks[1]) {
    footerSocialLinks[1].setAttribute("aria-label", cityT("footerSearchAria"));
  }

  if (footerSocialLinks[2]) {
    footerSocialLinks[2].setAttribute("aria-label", cityT("footerWorldAria"));
  }
}

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

function inferVenuePageBase(venue) {
  const searchable = normalizeForSearch(
    [sanitizeText(venue?.cuisine), sanitizeText(venue?.name)].filter(Boolean).join(" "),
  );

  if (!searchable) {
    return "keyif";
  }

  if (searchable.includes("eczane")) {
    return "eczane";
  }
  if (searchable.includes("veteriner") || searchable.includes("vet")) {
    return "veteriner";
  }
  if (searchable.includes("kuafor") || searchable.includes("berber") || searchable.includes("guzellik")) {
    return "kuafor";
  }
  if (searchable.includes("atm")) {
    return "atm";
  }
  if (searchable.includes("kargo")) {
    return "kargo";
  }
  if (searchable.includes("noter")) {
    return "noter";
  }
  if (searchable.includes("aile sagligi") || searchable.includes("aile hekimi") || searchable.includes("asm")) {
    return "asm";
  }
  if (searchable.includes("dis klinigi") || searchable.includes("dentist") || searchable.includes("dental")) {
    return "dis-klinikleri";
  }
  if (searchable.includes("otopark") || searchable.includes("parking")) {
    return "otopark";
  }
  if (
    searchable.includes("otel")
    || searchable.includes("hotel")
    || searchable.includes("hostel")
    || searchable.includes("resort")
    || searchable.includes("pansiyon")
  ) {
    return "otel";
  }
  if (
    searchable.includes("akaryakit")
    || searchable.includes("petrol")
    || searchable.includes("benzin")
    || searchable.includes("istasyon")
  ) {
    return "gezi";
  }
  if (
    searchable.includes("durak")
    || searchable.includes("metro")
    || searchable.includes("tramvay")
    || searchable.includes("otobus")
  ) {
    return "duraklar";
  }
  if (searchable.includes("market") || searchable.includes("supermarket") || searchable.includes("bakkal")) {
    return "market";
  }
  if (searchable.includes("banka") || searchable.includes("bank")) {
    return "banka";
  }
  if (searchable.includes("hastane") || searchable.includes("hospital")) {
    return "hastane";
  }

  return "keyif";
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

function sanitizeAddress(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 180) : fallback;
}

function sanitizeUrl(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  if (cleaned.length === 0 || cleaned.length > 3000) {
    return fallback;
  }

  if (!/^https?:\/\//i.test(cleaned)) {
    return fallback;
  }

  return cleaned;
}

function sanitizeUrlArray(values, limit = 6) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => sanitizeUrl(String(value || ""), ""))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeRating(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 4.0;
  }

  return Math.min(5, Math.max(0, numeric));
}

function sanitizeRatingCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return Math.round(numeric);
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
    userRatingCount: sanitizeRatingCount(record.userRatingCount),
    budget: sanitizeBudget(record.budget),
    address: sanitizeAddress(record.address, ""),
    neighborhood: sanitizeText(record.neighborhood || record.mahalle, ""),
    postalCode: sanitizeText(record.postalCode || record.postcode, ""),
    sourcePlaceId: sanitizeText(record.sourcePlaceId || record.placeId, ""),
    photoUri: sanitizeUrl(record.photoUri || "", ""),
    galleryPhotoUris: sanitizeUrlArray(record.galleryPhotoUris, 4),
    cuisineIndex: normalizeForSearch(cuisine),
    searchIndex: normalizeForSearch(
      `${name} ${cuisine} ${city} ${district} ${record.neighborhood || record.mahalle || ""} ${record.postalCode || record.postcode || ""} ${record.address || ""}`,
    ),
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
  const targetUrl = String(url || "").trim();
  if (!targetUrl) {
    return null;
  }

  // Absolute non-http URLs are rejected. Relative and file-based URLs are allowed.
  if (/^[a-z][a-z0-9+.-]*:/i.test(targetUrl) && !isSafeHttpUrl(targetUrl)) {
    return null;
  }

  try {
    const response = await fetch(targetUrl, {
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

async function ensureFallbackFoodData() {
  if (window.ARAMABUL_FALLBACK_FOOD_DATA) {
    return true;
  }

  if (!runtime || typeof runtime.loadScriptOnce !== "function") {
    return false;
  }

  try {
    await runtime.loadScriptOnce(FALLBACK_FOOD_SCRIPT);
  } catch (_error) {
    return false;
  }

  return Boolean(window.ARAMABUL_FALLBACK_FOOD_DATA);
}
function dedupeVenueRecords(records) {
  const seen = new Set();

  return records.filter((record) => {
    const key = String(record.sourcePlaceId || "")
      || `${normalizeForSearch(record.city)}|${normalizeForSearch(record.district)}|${normalizeForSearch(record.name)}`;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function readFallbackFoodRecords() {
  await ensureFallbackFoodData();
  const payload = window.ARAMABUL_FALLBACK_FOOD_DATA;
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const yemekRecords = normalizeVenueCollection(payload.yemek);
  const kafeRecords = normalizeVenueCollection(payload.kafe);
  return dedupeVenueRecords([...yemekRecords, ...kafeRecords]);
}

async function loadBundledVenueCollections() {
  const foodPayload = await fetchJson(FOOD_JSON_PATH);
  const foodRecords = dedupeVenueRecords(normalizeVenueCollection(foodPayload));
  if (foodRecords.length > 0) {
    return foodRecords;
  }

  const fallbackRecords = await readFallbackFoodRecords();
  if (fallbackRecords.length > 0) {
    return fallbackRecords;
  }

  return [];
}

async function loadVenues() {
  if (VENUES_API_ENDPOINT) {
    const apiPayload = await fetchJson(VENUES_API_ENDPOINT);
    const apiRecords = normalizeVenueCollection(apiPayload);

    if (apiRecords.length > 0) {
      const bundledRecords = await loadBundledVenueCollections();
      if (bundledRecords.length > 0) {
        return dedupeVenueRecords([...bundledRecords, ...apiRecords]);
      }
      return apiRecords;
    }
  }

  const bundledRecords = await loadBundledVenueCollections();
  if (bundledRecords.length > 0) {
    return bundledRecords;
  }

  const payload = await fetchJson(VENUES_JSON_PATH);
  const records = normalizeVenueCollection(payload);

  if (records.length > 0) {
    return records;
  }

  return fallbackVenues;
}

async function loadDistricts(records) {
  if (DISTRICTS_API_ENDPOINT) {
    const apiPayload = await fetchJson(DISTRICTS_API_ENDPOINT);
    const apiDistricts = normalizeDistrictCollection(apiPayload);

    if (Object.keys(apiDistricts).length > 0) {
      return apiDistricts;
    }
  }

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

function reviewCountForSort(venue) {
  const count = Number(venue && venue.userRatingCount);
  return Number.isFinite(count) && count > 1 ? count : 0;
}

function hasVenuePhotoData(venue) {
  if (!venue || typeof venue !== "object") {
    return false;
  }

  if (typeof venue.photoUri === "string" && venue.photoUri.trim()) {
    return true;
  }

  return Array.isArray(venue.galleryPhotoUris) && venue.galleryPhotoUris.length > 0;
}

function compareTravelerPriority(left, right) {
  const rightHasPhoto = hasVenuePhotoData(right) ? 1 : 0;
  const leftHasPhoto = hasVenuePhotoData(left) ? 1 : 0;
  if (rightHasPhoto !== leftHasPhoto) {
    return rightHasPhoto - leftHasPhoto;
  }

  const rightReviewCount = reviewCountForSort(right);
  const leftReviewCount = reviewCountForSort(left);
  if (rightReviewCount !== leftReviewCount) {
    return rightReviewCount - leftReviewCount;
  }

  if (right.rating !== left.rating) {
    return right.rating - left.rating;
  }

  const travelerOrder = travelerScore(right) - travelerScore(left);
  if (travelerOrder !== 0) {
    return travelerOrder;
  }

  return left.name.localeCompare(right.name, "tr");
}

function starText(rating) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

function venueImageUrls(venue) {
  if (!venue || typeof venue !== "object") {
    return [];
  }

  const gallery = Array.isArray(venue.galleryPhotoUris) ? venue.galleryPhotoUris : [];
  const urls = gallery
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  const photoUri = typeof venue.photoUri === "string" ? venue.photoUri.trim() : "";
  if (photoUri) {
    urls.push(photoUri);
  }

  return [...new Set(urls)];
}

function setVenueImage(imageElement, imageUrl) {
  if (!imageElement) {
    return false;
  }

  if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    imageElement.src = imageUrl;
    imageElement.classList.remove("is-empty");
    return true;
  }

  imageElement.removeAttribute("src");
  imageElement.classList.add("is-empty");
  return false;
}

function restaurantDetailUrl(venue) {
  const pageBase = inferVenuePageBase(venue);
  const hasDistrict = Boolean(sanitizeText(venue.district));
  const districtRouteBases = new Set([
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const cityRouteBases = new Set([
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const targetUrl = hasDistrict && districtRouteBases.has(pageBase)
    ? new URL(`${pageBase}-district.html`, window.location.href)
    : cityRouteBases.has(pageBase)
      ? new URL(`${pageBase}-city.html`, window.location.href)
      : new URL(`${pageBase}.html`, window.location.href);

  if (hasDistrict && districtRouteBases.has(pageBase)) {
    targetUrl.searchParams.set("sehir", toSlug(venue.city));
    targetUrl.searchParams.set("ilce", toSlug(venue.district));
  } else if (cityRouteBases.has(pageBase)) {
    targetUrl.searchParams.set("sehir", toSlug(venue.city));
  }

  targetUrl.searchParams.set("mekan", sanitizeText(venue.name, "mekan"));

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
    return matchesCategory;
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
      filtered = filtered.sort(compareTravelerPriority);
      break;
  }

  return filtered;
}

function isOrhaneliRestaurantDemoMode() {
  return state.city === ORHANELI_DEMO_CITY && state.district === ORHANELI_DEMO_DISTRICT;
}

function applyOrhaneliDemoLayout(enabled) {
  if (cityLayout) {
    cityLayout.style.gridTemplateColumns = enabled ? "1fr" : "";
  }

  if (citySidebar) {
    citySidebar.classList.toggle("is-hidden", enabled);
  }

  if (citySortTabsWrap) {
    citySortTabsWrap.classList.toggle("is-hidden", enabled);
  }

  if (cityResultMeta) {
    cityResultMeta.classList.toggle("is-hidden", enabled);
  }
}

function googleRestaurantSearchUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  const seen = new Set();
  const queryParts = [];

  [venue?.name, venue?.address, venue?.neighborhood, venue?.postalCode, venue?.district, venue?.city]
    .map((value) => sanitizeText(value, ""))
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLocaleLowerCase("tr");
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      queryParts.push(value);
    });

  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", queryParts.join(" "));

  if (typeof venue.sourcePlaceId === "string" && venue.sourcePlaceId.trim()) {
    mapsUrl.searchParams.set("query_place_id", venue.sourcePlaceId.trim());
  }

  return mapsUrl.toString();
}

function renderOrhaneliDemoList(venues) {
  if (!cityVenueList) {
    return;
  }

  cityVenueList.innerHTML = "";

  const uniqueByName = [];
  const seen = new Set();

  venues.forEach((venue) => {
    const nameKey = normalizeForSearch(venue.name);

    if (!nameKey || seen.has(nameKey)) {
      return;
    }

    seen.add(nameKey);
    uniqueByName.push(venue);
  });

  uniqueByName.sort((left, right) => left.name.localeCompare(right.name, "tr"));

  if (uniqueByName.length === 0) {
    renderEmptyState();
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "Orhaneli restoranları";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  uniqueByName.forEach((venue) => {
    const chip = document.createElement("a");
    chip.className = "province-pill";
    chip.href = googleRestaurantSearchUrl(venue);
    chip.target = "_self";
    chip.rel = "noopener noreferrer";
    chip.textContent = venue.name;
    chip.setAttribute("aria-label", `${venue.name} sayfasını Google'da yeni sekmede aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  cityVenueList.append(row);
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
  url.searchParams.delete("butce");

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
  const sort = url.searchParams.get("sirala");
  const pageValue = Number.parseInt(url.searchParams.get("sayfa") || "1", 10);

  const districts = districtsForCity(state.city);
  const categories = sortedMainPageCategoryTags;

  if (districtSlug) {
    const matchedDistrict = districts.find((district) => toSlug(district) === toSlug(districtSlug));
    state.district = matchedDistrict || "all";
  }

  if (categorySlug) {
    const matchedCategory = categories.find((category) => toSlug(category) === toSlug(categorySlug));
    state.category = matchedCategory || "all";
  }

  if (["traveler", "locals", "viewed", "rated"].includes(sort || "")) {
    state.sort = sort;
  }

  if (Number.isInteger(pageValue) && pageValue > 0) {
    state.page = pageValue;
  }
}

function renderPageHeader() {
  const titleText = cityT("cityTitle", { city: state.city });
  document.title = cityT("title", { city: state.city });
  cityTitle.textContent = titleText;

  if (cityToplineCityLink) {
    const cityUrl = new URL("city.html", window.location.href);
    cityUrl.searchParams.set("il", toSlug(state.city));
    cityToplineCityLink.href = cityUrl.toString();
    cityToplineCityLink.textContent = cityT("cityLink", { city: state.city });
  }

  if (cityToplineDistrict && cityToplineDistrictDivider) {
    if (state.district && state.district !== "all") {
      cityToplineDistrict.textContent = cityT("districtLabel", { district: state.district });
      cityToplineDistrict.hidden = false;
      cityToplineDistrictDivider.hidden = false;
    } else {
      cityToplineDistrict.hidden = true;
      cityToplineDistrictDivider.hidden = true;
    }
  }
}

function districtFlyoutColumnCount() {
  if (window.matchMedia("(max-width: 620px)").matches) {
    return 1;
  }

  if (window.matchMedia("(max-width: 980px)").matches) {
    return 2;
  }

  return 3;
}

function reorderForVerticalAlphabetical(items, columnCount) {
  const safeItems = Array.isArray(items) ? items.slice() : [];
  const columns = Math.max(1, Number(columnCount) || 1);

  if (columns <= 1 || safeItems.length <= 1) {
    return safeItems;
  }

  const total = safeItems.length;
  const baseRowsPerColumn = Math.floor(total / columns);
  const extraRows = total % columns;
  const maxRows = baseRowsPerColumn + (extraRows > 0 ? 1 : 0);
  const columnSlices = [];
  let cursor = 0;

  for (let column = 0; column < columns; column += 1) {
    const columnSize = baseRowsPerColumn + (column < extraRows ? 1 : 0);
    columnSlices.push(safeItems.slice(cursor, cursor + columnSize));
    cursor += columnSize;
  }

  const ordered = [];

  for (let row = 0; row < maxRows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const item = columnSlices[column][row];
      if (typeof item !== "undefined") {
        ordered.push(item);
      }
    }
  }

  return ordered;
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
    renderPageHeader();
  }

  districtCurrent.textContent = state.district === "all" ? cityT("allDistricts") : state.district;
  districtFlyoutCity.textContent = state.city;

  const allDistricts = ["all", ...districts];
  const orderedDistricts = reorderForVerticalAlphabetical(
    allDistricts,
    districtFlyoutColumnCount(),
  );

  orderedDistricts.forEach((district) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "district-option";
    optionButton.dataset.value = district;
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("aria-selected", district === state.district ? "true" : "false");
    optionButton.textContent = district === "all" ? cityT("allDistricts") : district;

    if (district === state.district) {
      optionButton.classList.add("active");
    }

    if (district === "all") {
      optionButton.classList.add("district-option-all");
    }

    optionButton.addEventListener("click", () => {
      state.district = district;
      state.page = 1;
      renderPageHeader();
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

  const categories = sortedMainPageCategoryTags;
  categoryFlyoutList.innerHTML = "";

  if (state.category !== "all" && !categories.includes(state.category)) {
    state.category = "all";
  }

  categoryCurrent.textContent = state.category === "all" ? cityT("allCategories") : state.category;
  categoryFlyoutCity.textContent = state.city;

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "category-option category-option-all";
  allButton.textContent = cityT("allCategories");
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
  empty.textContent = cityT("emptyFiltered");
  cityVenueList.append(empty);
}

function renderVenueCard(venue) {
  const card = cityVenueTemplate.content.firstElementChild.cloneNode(true);
  const thumbs = [...card.querySelectorAll(".city-venue-thumb")];
  const titleLink = card.querySelector(".city-venue-title-link");
  const emptyImageNote = card.querySelector(".city-venue-image-empty");
  const thumbRow = card.querySelector(".city-venue-thumb-row");
  const imageUrls = venueImageUrls(venue);
  const hasReviewCount = Number.isFinite(venue.userRatingCount) && venue.userRatingCount > 1;
  const displayRating = hasReviewCount ? venue.rating : 0;

  if (titleLink) {
    titleLink.textContent = venue.name;
    titleLink.href = restaurantDetailUrl(venue);
    titleLink.setAttribute("aria-label", cityT("openVenueAria", { name: venue.name }));
  }
  card.querySelector(".city-venue-subtitle").textContent = venue.district;
  card.querySelector(".city-venue-description").textContent =
    venue.address || `${venue.district}, ${venue.city}`;
  card.querySelector(".city-venue-stars").textContent = starText(displayRating);
  card.querySelector(".city-venue-rating").textContent = displayRating.toFixed(1);

  const cuisineChip = card.querySelector(".city-venue-chip");
  if (cuisineChip) {
    cuisineChip.textContent = venue.cuisine;
  }

  const hasMainImage = setVenueImage(card.querySelector(".city-venue-main-image"), imageUrls[0] || "");
  setVenueImage(thumbs[0], imageUrls[1] || "");
  setVenueImage(thumbs[1], imageUrls[2] || "");
  setVenueImage(thumbs[2], imageUrls[3] || "");

  if (emptyImageNote) {
    emptyImageNote.classList.toggle("is-hidden", hasMainImage);
  }

  if (thumbRow) {
    thumbRow.classList.toggle("is-hidden", imageUrls.length <= 1);
  }

  return card;
}

function buildPaginationButton(label, page, active = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "city-pagination-btn";
  button.textContent = label;
  button.dataset.page = String(page);
  button.classList.toggle("active", active);
  button.setAttribute("aria-label", cityT("paginationAria", { page }));

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
  previousButton.textContent = cityT("paginationPrev");
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
  nextButton.textContent = cityT("paginationNext");
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
  const demoMode = isOrhaneliRestaurantDemoMode();
  const totalPages = Math.max(1, Math.ceil(filtered.length / VENUES_PER_PAGE));
  state.page = Math.min(totalPages, Math.max(1, state.page));
  const startIndex = (state.page - 1) * VENUES_PER_PAGE;
  const visible = filtered.slice(startIndex, startIndex + VENUES_PER_PAGE);

  applyOrhaneliDemoLayout(demoMode);

  cityVenueList.innerHTML = "";
  const districtForMeta = state.district !== "all" ? state.district : "";

  if (demoMode) {
    renderPagination(1);
    renderOrhaneliDemoList(filtered);
    return;
  }

  if (cityResultMeta) {
    cityResultMeta.classList.remove("is-hidden");
  }

  cityResultMeta.textContent = districtForMeta
    ? cityT("resultWithDistrict", {
        city: state.city,
        cityTotal: formatNumber(cityVenues.length),
        district: districtForMeta,
        districtTotal: formatNumber(districtVenueCount(state.city, districtForMeta)),
      })
    : cityT("resultWithoutDistrict", {
        city: state.city,
        cityTotal: formatNumber(cityVenues.length),
      });

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
    const rawValue = readStorageValue(key);

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
  writeStorageValue(AUTH_USERS_KEY, JSON.stringify(users));
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
  writeStorageValue(
    AUTH_SESSION_KEY,
    JSON.stringify({
      name: user.name,
      email: normalizeEmail(user.email),
    }),
  );
}

function clearSession() {
  removeStorageValue(AUTH_SESSION_KEY);
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
  if (!loginBtn || !signupBtn || !logoutBtn || !authWelcome) {
    return;
  }

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
  if (
    !loginBtn ||
    !signupBtn ||
    !logoutBtn ||
    !authModal ||
    !authModalClose ||
    !loginForm ||
    !signupForm ||
    !loginEmail ||
    !loginPassword ||
    !signupName ||
    !signupEmail ||
    !signupPassword ||
    !signupPasswordRepeat
  ) {
    return;
  }

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
  if (
    !loginBtn ||
    !signupBtn ||
    !logoutBtn ||
    !authWelcome ||
    !authModal ||
    !authModalClose ||
    !loginForm ||
    !signupForm
  ) {
    return;
  }

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

  window.addEventListener("resize", () => {
    renderDistrictOptions();
  });
}

function applyCityLanguage() {
  applyCityStaticTranslations();

  if (!state.city) {
    return;
  }

  renderPageHeader();
  renderDistrictOptions();
  renderSidebarCategories();
  updateSortTabs();
  renderVenues();
}

async function initializeCityPage() {
  activeLanguage = getCurrentLanguage() || readLanguageFromStorage();
  applyCityStaticTranslations();
  initializeAuth();

  venues = await loadVenues();
  buildVenueIndexes(venues);
  districtsByCity = await loadDistricts(venues);

  const cities = allCities();

  state.city = resolveCityFromUrl(cities);
  state.district = "all";
  state.category = "all";
  state.sort = "traveler";
  state.page = 1;

  if (!state.city) {
    document.title = cityT("cityDataMissingTitle");
    cityTitle.textContent = cityT("cityDataMissingTitle");
    cityResultMeta.textContent = cityT("cityDataMissingText");
    return;
  }

  applyExtraUrlState();

  renderPageHeader();
  renderDistrictOptions();
  renderSidebarCategories();

  updateSortTabs();
  renderVenues();
  updateUrl();
  attachFilterEvents();
}

const handleCityLanguageChange = (event) => {
  const requestedLanguage =
    event && event.detail && typeof event.detail.language === "string"
      ? event.detail.language
      : "TR";
  activeLanguage = normalizeLanguageCode(requestedLanguage);
  applyCityLanguage();
};
document.addEventListener("aramabul:languagechange", handleCityLanguageChange);

initializeCityPage();
