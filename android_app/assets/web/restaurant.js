const VENUES_JSON_PATH = "data/venues.json";
const YEMEK_JSON_PATH = "data/yemek.json";
const KAFE_JSON_PATH = "data/kafe.json";
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

const fallbackVenue = {
  city: "İstanbul",
  district: "Beyoğlu",
  name: "Galata Sofrası",
  cuisine: "Türk Mutfağı",
  rating: 4.6,
  budget: "₺₺",
  address: "Beyoğlu / İstanbul",
  phone: "0212 000 00 00",
  sourcePlaceId: "",
};

const turkishCharMap = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

const restaurantBreadcrumb = document.querySelector("#restaurantBreadcrumb");
const restaurantLead = document.querySelector("#restaurantLead");
const restaurantName = document.querySelector("#restaurantName");
const restaurantStars = document.querySelector("#restaurantStars");
const restaurantScore = document.querySelector("#restaurantScore");
const restaurantScoreLabel = document.querySelector("#restaurantScoreLabel");
const restaurantReviews = document.querySelector("#restaurantReviews");
const restaurantMeta = document.querySelector("#restaurantMeta");
const restaurantMainImage = document.querySelector("#restaurantMainImage");
const restaurantThumbs = [...document.querySelectorAll(".restaurant-thumb")];
const restaurantOverviewText = document.querySelector("#restaurantOverviewText");
const restaurantAddressFields = [...document.querySelectorAll('[data-info-field="address"]')];
const restaurantPhoneFields = [...document.querySelectorAll('[data-info-field="phone"]')];
const restaurantInstagramFields = [...document.querySelectorAll('[data-info-field="instagram"]')];
const restaurantWebsiteFields = [...document.querySelectorAll('[data-info-field="website"]')];
const restaurantTabsNav = document.querySelector(".restaurant-tabs");
const restaurantTabs = [...document.querySelectorAll(".restaurant-tab")];
const restaurantPanels = [...document.querySelectorAll(".restaurant-panel")];
const restaurantMapCanvas = document.querySelector("#restaurantMapCanvas");
const restaurantMapStatus = document.querySelector("#restaurantMapStatus");
const restaurantMapLink = document.querySelector("#restaurantMapLink");
const restaurantCommentsEmpty = document.querySelector("#restaurantCommentsEmpty");
const restaurantCommentsList = document.querySelector("#restaurantCommentsList");
const restaurantCommentForm = document.querySelector("#restaurantCommentForm");
const restaurantCommentAuthor = document.querySelector("#commentAuthor");
const restaurantCommentText = document.querySelector("#commentText");
const restaurantCommentMessage = document.querySelector("#restaurantCommentMessage");
const restaurantOverviewHeading = document.querySelector(".restaurant-overview h2");
const restaurantAddressLabels = [...document.querySelectorAll(".restaurant-address-label")];
const restaurantPhoneLabels = [...document.querySelectorAll(".restaurant-phone-label")];
const restaurantInstagramLabels = [...document.querySelectorAll(".restaurant-instagram-label")];
const restaurantWebsiteLabels = [...document.querySelectorAll(".restaurant-website-label")];
const restaurantCommentsTitle = document.querySelector(".restaurant-comments-title");
const restaurantCommentAuthorLabel = document.querySelector('label[for="commentAuthor"]');
const restaurantCommentTextLabel = document.querySelector('label[for="commentText"]');
const restaurantCommentSubmit = document.querySelector(".restaurant-comment-submit");
const restaurantMapTitle = document.querySelector(".restaurant-map-title");
const footerColumns = [...document.querySelectorAll(".yr-footer-col")];
const footerBottomText = document.querySelector(".yr-footer-bottom p");
const footerSocial = document.querySelector(".yr-footer-social");
const footerSocialLinks = [...document.querySelectorAll(".yr-footer-social a")];

let leafletMap = null;
let leafletMarker = null;
let latestMapToken = "";
let activeCommentsKey = "";
let activeComments = [];
let activeVenue = null;
let activeLanguage = "TR";

const LANGUAGE_STORAGE_KEY = "neredeyenir.selectedLanguage.v1";
const SUPPORTED_LANGUAGES = new Set(["TR", "EN", "RU", "DE", "ZH"]);
const LANGUAGE_LOCALES = {
  TR: "tr-TR",
  EN: "en-US",
  RU: "ru-RU",
  DE: "de-DE",
  ZH: "zh-CN",
};

const RESTAURANT_I18N = {
  TR: {
    title: "arama bul | {name}",
    home: "Anasayfa",
    food: "Yemek",
    breadcrumbAria: "Gezinme yolu",
    cityLink: "{city} İli",
    districtFallback: "İlçe",
    districtLabel: "{district} İlçesi",
    scoreExcellent: "Mükemmel",
    scoreVeryGood: "Çok iyi",
    scoreGood: "İyi",
    scoreAverage: "Orta",
    reviewCount: "{count} değerlendirme",
    reviewMissing: "Değerlendirme bilgisi bulunamamıştır",
    cuisineFallback: "Restoran",
    dessertCuisine: "Tatlı",
    categoryMeta: "Kategori: {cuisine}",
    overviewFallback: "{name}, {city} şehrinde özellikle {cuisine} sevenler için tercih edilen bir durak.",
    atmospherePrefix: "Mekan özellikleri: {items}.",
    menuPrefix: "Menü/servis: {items}.",
    countryName: "Türkiye",
    phoneMissing: "Telefon bilgisi bulunamadı",
    infoMissing: "Bilgi bulunamamıştır",
    instagramOpenAria: "Instagram profilini yeni sekmede aç",
    websiteOpenAria: "Web sitesini yeni sekmede aç",
    mapAria: "Restoran konum haritası",
    mapOpen: "Google Haritalar'da aç",
    mapLoading: "Konum yükleniyor...",
    mapNotFound: "Konum bulunamadı. Alttaki bağlantıdan Google Haritalar'ı açabilirsin.",
    mapLoadFailed: "Harita yüklenemedi. Lütfen tekrar dene.",
    commentsEmpty: "İlk yorumu sen yaz.",
    commentsAuthorLabel: "Adın",
    commentsAuthorPlaceholder: "Adını yaz",
    commentsTextLabel: "Yorumun",
    commentsTextPlaceholder: "Deneyimini paylaş",
    commentsSubmit: "Yorumu Gönder",
    commentsEmptyError: "Yorum metni boş olamaz.",
    commentsSaved: "Yorumun kaydedildi.",
    guest: "Misafir",
    tabsAria: "Detay sekmeleri",
    tabOverview: "Genel Bilgi",
    tabLocation: "Konum",
    tabComments: "Yorumlar",
    tabPhotos: "Fotoğraflar",
    mainImageAlt: "Restoran ana görseli",
    thumbImageAlt: "Restoran detay görseli",
    overviewHeading: "Özet",
    addressLabel: "Adres",
    phoneLabel: "Telefon",
    instagramLabel: "Instagram",
    websiteLabel: "Web Sitesi",
    mapTitle: "Konum",
    commentsTitle: "Yorumlar",
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
    footerAddPrice: "Fiyat ekle",
    footerCollab: "İş birliği",
    footerCopyright: "© 2026 arama bul",
    footerSocial: "Sosyal",
    footerSearchAria: "Ara",
    footerWorldAria: "Dünya",
  },
  EN: {
    title: "arama bul | {name}",
    home: "Home",
    food: "Food",
    breadcrumbAria: "Breadcrumb",
    cityLink: "{city} City",
    districtFallback: "District",
    districtLabel: "{district} District",
    scoreExcellent: "Excellent",
    scoreVeryGood: "Very good",
    scoreGood: "Good",
    scoreAverage: "Average",
    reviewCount: "{count} reviews",
    reviewMissing: "Rating information is unavailable",
    cuisineFallback: "Restaurant",
    dessertCuisine: "Dessert",
    categoryMeta: "Category: {cuisine}",
    overviewFallback: "{name} is a popular stop in {city} for people who enjoy {cuisine}.",
    atmospherePrefix: "Venue features: {items}.",
    menuPrefix: "Menu/service: {items}.",
    countryName: "Turkey",
    phoneMissing: "Phone information is unavailable",
    infoMissing: "Information not available",
    instagramOpenAria: "Open Instagram profile in a new tab",
    websiteOpenAria: "Open website in a new tab",
    mapAria: "Restaurant location map",
    mapOpen: "Open in Google Maps",
    mapLoading: "Loading location...",
    mapNotFound: "Location not found. You can open Google Maps using the link below.",
    mapLoadFailed: "Map could not be loaded. Please try again.",
    commentsEmpty: "Write the first comment.",
    commentsAuthorLabel: "Your name",
    commentsAuthorPlaceholder: "Enter your name",
    commentsTextLabel: "Your comment",
    commentsTextPlaceholder: "Share your experience",
    commentsSubmit: "Submit Comment",
    commentsEmptyError: "Comment text cannot be empty.",
    commentsSaved: "Your comment has been saved.",
    guest: "Guest",
    tabsAria: "Detail tabs",
    tabOverview: "Overview",
    tabLocation: "Location",
    tabComments: "Comments",
    tabPhotos: "Photos",
    mainImageAlt: "Restaurant main photo",
    thumbImageAlt: "Restaurant photo",
    overviewHeading: "Summary",
    addressLabel: "Address",
    phoneLabel: "Phone",
    instagramLabel: "Instagram",
    websiteLabel: "Website",
    mapTitle: "Location",
    commentsTitle: "Comments",
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
    footerAddPrice: "Add price",
    footerCollab: "Collaboration",
    footerCopyright: "© 2026 arama bul",
    footerSocial: "Social",
    footerSearchAria: "Search",
    footerWorldAria: "World",
  },
  RU: {
    title: "arama bul | {name}",
    home: "Главная",
    food: "Еда",
    breadcrumbAria: "Хлебные крошки",
    cityLink: "Город {city}",
    districtFallback: "Район",
    districtLabel: "Район {district}",
    scoreExcellent: "Отлично",
    scoreVeryGood: "Очень хорошо",
    scoreGood: "Хорошо",
    scoreAverage: "Средне",
    reviewCount: "{count} отзывов",
    reviewMissing: "Информация об оценках недоступна",
    cuisineFallback: "Ресторан",
    dessertCuisine: "Десерты",
    categoryMeta: "Категория: {cuisine}",
    overviewFallback: "{name} — популярное место в {city} для тех, кто любит {cuisine}.",
    atmospherePrefix: "Особенности места: {items}.",
    menuPrefix: "Меню/сервис: {items}.",
    countryName: "Turkey",
    phoneMissing: "Информация о телефоне недоступна",
    infoMissing: "Информация недоступна",
    instagramOpenAria: "Открыть профиль Instagram в новой вкладке",
    websiteOpenAria: "Открыть сайт в новой вкладке",
    mapAria: "Карта расположения ресторана",
    mapOpen: "Открыть в Google Картах",
    mapLoading: "Загрузка локации...",
    mapNotFound: "Локация не найдена. Вы можете открыть Google Карты по ссылке ниже.",
    mapLoadFailed: "Не удалось загрузить карту. Попробуйте еще раз.",
    commentsEmpty: "Напишите первый отзыв.",
    commentsAuthorLabel: "Ваше имя",
    commentsAuthorPlaceholder: "Введите ваше имя",
    commentsTextLabel: "Ваш отзыв",
    commentsTextPlaceholder: "Поделитесь впечатлением",
    commentsSubmit: "Отправить отзыв",
    commentsEmptyError: "Текст отзыва не может быть пустым.",
    commentsSaved: "Ваш отзыв сохранен.",
    guest: "Гость",
    tabsAria: "Вкладки деталей",
    tabOverview: "Общая информация",
    tabLocation: "Локация",
    tabComments: "Отзывы",
    tabPhotos: "Фото",
    mainImageAlt: "Основное фото ресторана",
    thumbImageAlt: "Фото ресторана",
    overviewHeading: "Кратко",
    addressLabel: "Адрес",
    phoneLabel: "Телефон",
    instagramLabel: "Instagram",
    websiteLabel: "Веб-сайт",
    mapTitle: "Локация",
    commentsTitle: "Отзывы",
    footerDownloadTitle: "Скачать",
    footerDownloadNow: "Скачать",
    footerDiscoverTitle: "Обзор",
    footerAbout: "О нас",
    footerCareer: "Карьера",
    footerTech: "Технологии",
    footerContact: "Контакты",
    footerHelpTitle: "Помощь",
    footerFaq: "Часто задаваемые вопросы",
    footerKvkk: "Защита персональных данных",
    footerPrivacy: "Политика конфиденциальности",
    footerTerms: "Условия использования",
    footerCookies: "Политика cookie",
    footerPartnerTitle: "Партнерство",
    footerAddRestaurant: "Добавить ресторан",
    footerAddPrice: "Добавить цену",
    footerCollab: "Сотрудничество",
    footerCopyright: "© 2026 arama bul",
    footerSocial: "Соцсети",
    footerSearchAria: "Поиск",
    footerWorldAria: "Мир",
  },
  DE: {
    title: "arama bul | {name}",
    home: "Startseite",
    food: "Essen",
    breadcrumbAria: "Brotkrumen",
    cityLink: "Stadt {city}",
    districtFallback: "Bezirk",
    districtLabel: "{district} Bezirk",
    scoreExcellent: "Ausgezeichnet",
    scoreVeryGood: "Sehr gut",
    scoreGood: "Gut",
    scoreAverage: "Durchschnittlich",
    reviewCount: "{count} Bewertungen",
    reviewMissing: "Bewertungsinformationen sind nicht verfügbar",
    cuisineFallback: "Restaurant",
    dessertCuisine: "Dessert",
    categoryMeta: "Kategorie: {cuisine}",
    overviewFallback: "{name} ist in {city} ein beliebter Ort für alle, die {cuisine} mögen.",
    atmospherePrefix: "Merkmale des Lokals: {items}.",
    menuPrefix: "Menü/Service: {items}.",
    countryName: "Turkey",
    phoneMissing: "Telefoninformationen sind nicht verfügbar",
    infoMissing: "Information nicht verfügbar",
    instagramOpenAria: "Instagram-Profil in neuem Tab öffnen",
    websiteOpenAria: "Webseite in neuem Tab öffnen",
    mapAria: "Standortkarte des Restaurants",
    mapOpen: "In Google Maps öffnen",
    mapLoading: "Standort wird geladen...",
    mapNotFound: "Standort wurde nicht gefunden. Du kannst Google Maps über den Link unten öffnen.",
    mapLoadFailed: "Die Karte konnte nicht geladen werden. Bitte versuche es erneut.",
    commentsEmpty: "Schreibe den ersten Kommentar.",
    commentsAuthorLabel: "Dein Name",
    commentsAuthorPlaceholder: "Gib deinen Namen ein",
    commentsTextLabel: "Dein Kommentar",
    commentsTextPlaceholder: "Teile deine Erfahrung",
    commentsSubmit: "Kommentar senden",
    commentsEmptyError: "Der Kommentartext darf nicht leer sein.",
    commentsSaved: "Dein Kommentar wurde gespeichert.",
    guest: "Gast",
    tabsAria: "Detail-Tabs",
    tabOverview: "Allgemeine Infos",
    tabLocation: "Standort",
    tabComments: "Kommentare",
    tabPhotos: "Fotos",
    mainImageAlt: "Hauptfoto des Restaurants",
    thumbImageAlt: "Restaurantfoto",
    overviewHeading: "Zusammenfassung",
    addressLabel: "Adresse",
    phoneLabel: "Telefon",
    instagramLabel: "Instagram",
    websiteLabel: "Webseite",
    mapTitle: "Standort",
    commentsTitle: "Kommentare",
    footerDownloadTitle: "Download",
    footerDownloadNow: "Jetzt laden",
    footerDiscoverTitle: "Entdecken",
    footerAbout: "Über uns",
    footerCareer: "Karriere",
    footerTech: "Technologie",
    footerContact: "Kontakt",
    footerHelpTitle: "Hilfe",
    footerFaq: "Häufige Fragen",
    footerKvkk: "Schutz personenbezogener Daten",
    footerPrivacy: "Datenschutzrichtlinie",
    footerTerms: "Nutzungsbedingungen",
    footerCookies: "Cookie-Richtlinie",
    footerPartnerTitle: "Partnerschaft",
    footerAddRestaurant: "Restaurant hinzufügen",
    footerAddPrice: "Preis hinzufügen",
    footerCollab: "Zusammenarbeit",
    footerCopyright: "© 2026 arama bul",
    footerSocial: "Soziale Medien",
    footerSearchAria: "Suche",
    footerWorldAria: "Welt",
  },
  ZH: {
    title: "arama bul | {name}",
    home: "首页",
    food: "美食",
    breadcrumbAria: "面包屑导航",
    cityLink: "{city} 市",
    districtFallback: "区",
    districtLabel: "{district} 区",
    scoreExcellent: "极佳",
    scoreVeryGood: "很好",
    scoreGood: "不错",
    scoreAverage: "一般",
    reviewCount: "{count} 条评价",
    reviewMissing: "暂无评分信息",
    cuisineFallback: "餐厅",
    dessertCuisine: "甜品",
    categoryMeta: "类别：{cuisine}",
    overviewFallback: "{name} 是 {city} 备受欢迎的餐厅，适合喜欢 {cuisine} 的人。",
    atmospherePrefix: "场所特色：{items}。",
    menuPrefix: "菜单/服务：{items}。",
    countryName: "Turkey",
    phoneMissing: "暂无电话信息",
    infoMissing: "暂无信息",
    instagramOpenAria: "在新标签页打开 Instagram 主页",
    websiteOpenAria: "在新标签页打开网站",
    mapAria: "餐厅位置地图",
    mapOpen: "在 Google 地图中打开",
    mapLoading: "正在加载位置...",
    mapNotFound: "未找到位置。你可以通过下方链接打开 Google 地图。",
    mapLoadFailed: "地图加载失败，请重试。",
    commentsEmpty: "来写第一条评论吧。",
    commentsAuthorLabel: "你的名字",
    commentsAuthorPlaceholder: "输入你的名字",
    commentsTextLabel: "你的评论",
    commentsTextPlaceholder: "分享你的体验",
    commentsSubmit: "提交评论",
    commentsEmptyError: "评论内容不能为空。",
    commentsSaved: "评论已保存。",
    guest: "访客",
    tabsAria: "详情标签",
    tabOverview: "基本信息",
    tabLocation: "位置",
    tabComments: "评论",
    tabPhotos: "照片",
    mainImageAlt: "餐厅主图",
    thumbImageAlt: "餐厅图片",
    overviewHeading: "简介",
    addressLabel: "地址",
    phoneLabel: "电话",
    instagramLabel: "Instagram",
    websiteLabel: "网站",
    mapTitle: "位置",
    commentsTitle: "评论",
    footerDownloadTitle: "下载",
    footerDownloadNow: "立即下载",
    footerDiscoverTitle: "探索",
    footerAbout: "关于我们",
    footerCareer: "招聘",
    footerTech: "技术",
    footerContact: "联系我们",
    footerHelpTitle: "帮助",
    footerFaq: "常见问题",
    footerKvkk: "个人数据保护",
    footerPrivacy: "隐私政策",
    footerTerms: "使用条款",
    footerCookies: "Cookie 政策",
    footerPartnerTitle: "合作伙伴",
    footerAddRestaurant: "添加餐厅",
    footerAddPrice: "添加价格",
    footerCollab: "合作",
    footerCopyright: "© 2026 arama bul",
    footerSocial: "社交",
    footerSearchAria: "搜索",
    footerWorldAria: "全球",
  },
};

function normalizeLanguageCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "TR";
}

function readLanguageFromStorage() {
  try {
    return normalizeLanguageCode(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch (_error) {
    return "TR";
  }
}

function getCurrentLanguage() {
  if (typeof window.NEREDEYENIR_GET_LANGUAGE === "function") {
    return normalizeLanguageCode(window.NEREDEYENIR_GET_LANGUAGE());
  }

  return activeLanguage;
}

function currentLocale() {
  return LANGUAGE_LOCALES[getCurrentLanguage()] || LANGUAGE_LOCALES.TR;
}

function restaurantT(key, replacements = {}) {
  const lang = getCurrentLanguage();
  const languagePack = RESTAURANT_I18N[lang] || RESTAURANT_I18N.TR;
  const template = languagePack[key] || RESTAURANT_I18N.TR[key] || "";

  return Object.entries(replacements).reduce((output, [token, value]) => {
    return output.replaceAll(`{${token}}`, String(value));
  }, template);
}

function applyRestaurantStaticTranslations() {
  if (restaurantBreadcrumb) {
    restaurantBreadcrumb.setAttribute("aria-label", restaurantT("breadcrumbAria"));
  }
  if (restaurantTabsNav) {
    restaurantTabsNav.setAttribute("aria-label", restaurantT("tabsAria"));
  }
  if (restaurantTabs[0]) {
    restaurantTabs[0].textContent = restaurantT("tabOverview");
  }
  if (restaurantTabs[1]) {
    restaurantTabs[1].textContent = restaurantT("tabLocation");
  }
  if (restaurantTabs[2]) {
    restaurantTabs[2].textContent = restaurantT("tabComments");
  }
  if (restaurantTabs[3]) {
    restaurantTabs[3].textContent = restaurantT("tabPhotos");
  }

  if (restaurantOverviewHeading) {
    restaurantOverviewHeading.textContent = restaurantT("overviewHeading");
  }
  if (restaurantMainImage) {
    restaurantMainImage.alt = restaurantT("mainImageAlt");
  }
  restaurantThumbs.forEach((image) => {
    image.alt = restaurantT("thumbImageAlt");
  });

  restaurantAddressLabels.forEach((element) => {
    element.textContent = restaurantT("addressLabel");
  });
  restaurantPhoneLabels.forEach((element) => {
    element.textContent = restaurantT("phoneLabel");
  });
  restaurantInstagramLabels.forEach((element) => {
    element.textContent = restaurantT("instagramLabel");
  });
  restaurantWebsiteLabels.forEach((element) => {
    element.textContent = restaurantT("websiteLabel");
  });

  if (restaurantMapTitle) {
    restaurantMapTitle.textContent = restaurantT("mapTitle");
  }
  if (restaurantMapCanvas) {
    restaurantMapCanvas.setAttribute("aria-label", restaurantT("mapAria"));
  }
  if (restaurantMapLink) {
    restaurantMapLink.textContent = restaurantT("mapOpen");
    restaurantMapLink.setAttribute("aria-label", restaurantT("mapOpen"));
  }
  if (restaurantCommentsTitle) {
    restaurantCommentsTitle.textContent = restaurantT("commentsTitle");
  }
  if (restaurantCommentsEmpty) {
    restaurantCommentsEmpty.textContent = restaurantT("commentsEmpty");
  }
  if (restaurantCommentAuthorLabel) {
    restaurantCommentAuthorLabel.textContent = restaurantT("commentsAuthorLabel");
  }
  if (restaurantCommentTextLabel) {
    restaurantCommentTextLabel.textContent = restaurantT("commentsTextLabel");
  }
  if (restaurantCommentAuthor) {
    restaurantCommentAuthor.setAttribute("placeholder", restaurantT("commentsAuthorPlaceholder"));
  }
  if (restaurantCommentText) {
    restaurantCommentText.setAttribute("placeholder", restaurantT("commentsTextPlaceholder"));
  }
  if (restaurantCommentSubmit) {
    restaurantCommentSubmit.textContent = restaurantT("commentsSubmit");
  }

  if (footerColumns[0]) {
    const links = footerColumns[0].querySelectorAll("a");
    const title = footerColumns[0].querySelector("h4");
    const badges = footerColumns[0].querySelectorAll(".store-badge-top");
    if (title) {
      title.textContent = restaurantT("footerDownloadTitle");
    }
    badges.forEach((badge) => {
      badge.textContent = restaurantT("footerDownloadNow");
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
      title.textContent = restaurantT("footerDiscoverTitle");
    }
    if (items[0]) {
      items[0].textContent = restaurantT("footerAbout");
    }
    if (items[1]) {
      items[1].textContent = restaurantT("footerCareer");
    }
    if (items[2]) {
      items[2].textContent = restaurantT("footerTech");
    }
    if (items[3]) {
      items[3].textContent = restaurantT("footerContact");
    }
  }

  if (footerColumns[2]) {
    const items = footerColumns[2].querySelectorAll("a");
    const title = footerColumns[2].querySelector("h4");
    if (title) {
      title.textContent = restaurantT("footerHelpTitle");
    }
    if (items[0]) {
      items[0].textContent = restaurantT("footerFaq");
    }
    if (items[1]) {
      items[1].textContent = restaurantT("footerKvkk");
    }
    if (items[2]) {
      items[2].textContent = restaurantT("footerPrivacy");
    }
    if (items[3]) {
      items[3].textContent = restaurantT("footerTerms");
    }
    if (items[4]) {
      items[4].textContent = restaurantT("footerCookies");
    }
  }

  if (footerColumns[3]) {
    const items = footerColumns[3].querySelectorAll("a");
    const title = footerColumns[3].querySelector("h4");
    if (title) {
      title.textContent = restaurantT("footerPartnerTitle");
    }
    if (items[0]) {
      items[0].textContent = restaurantT("footerAddRestaurant");
    }
    if (items[1]) {
      items[1].textContent = restaurantT("footerAddPrice");
    }
    if (items[2]) {
      items[2].textContent = restaurantT("footerCollab");
    }
  }

  if (footerBottomText) {
    footerBottomText.textContent = restaurantT("footerCopyright");
  }

  if (footerSocial) {
    footerSocial.setAttribute("aria-label", restaurantT("footerSocial"));
  }

  if (footerSocialLinks[1]) {
    footerSocialLinks[1].setAttribute("aria-label", restaurantT("footerSearchAria"));
  }

  if (footerSocialLinks[2]) {
    footerSocialLinks[2].setAttribute("aria-label", restaurantT("footerWorldAria"));
  }
}

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
  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}

function normalizeCuisineLabel(value, fallback = "") {
  const cleaned = sanitizeText(value, fallback);
  return cleaned;
}

function localizeCuisineLabel(cuisineValue) {
  const cleaned = sanitizeText(cuisineValue || "", "");
  if (!cleaned) {
    return restaurantT("cuisineFallback");
  }

  const normalized = normalizeForSearch(cleaned);
  if (normalized === "baklava" || normalized === "kunefe" || normalized === "tatli") {
    return restaurantT("dessertCuisine");
  }

  return cleaned;
}

function sanitizeCommentText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 500) : fallback;
}

function sanitizeAddress(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 220) : fallback;
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

function sanitizeUrlArray(value, limit = 8) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeUrl(String(item || ""), ""))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeStringArray(value, limit = 8) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(String(item || ""), ""))
    .filter(Boolean)
    .slice(0, limit);
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
    return null;
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

function normalizeVenueRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const city = sanitizeText(record.city);
  const district = sanitizeText(record.district, "");
  const name = sanitizeVenueName(record.name);
  const cuisine = normalizeCuisineLabel(record.cuisine, "");

  if (!city || !name) {
    return null;
  }

  return {
    city,
    district,
    name,
    cuisine,
    budget: sanitizeText(record.budget, "₺₺"),
    rating: sanitizeRating(record.rating),
    userRatingCount: sanitizeRatingCount(record.userRatingCount),
    address: sanitizeAddress(record.address, ""),
    phone: sanitizeText(record.phone, ""),
    website: sanitizeUrl(record.website || record.web || record.url, ""),
    instagram: sanitizeUrl(
      record.instagram ||
        (sanitizeUrl(record.website || record.web || record.url, "").includes("instagram.com")
          ? record.website || record.web || record.url
          : ""),
      "",
    ),
    photoUri: sanitizeUrl(record.photoUri || "", ""),
    galleryPhotoUris: sanitizeUrlArray(record.galleryPhotoUris, 6),
    mapsUrl: sanitizeUrl(record.mapsUrl || record.googleMapsUri || "", ""),
    editorialSummary: sanitizeText(record.editorialSummary, ""),
    menuCapabilities: sanitizeStringArray(record.menuCapabilities, 12),
    serviceCapabilities: sanitizeStringArray(record.serviceCapabilities, 12),
    atmosphereCapabilities: sanitizeStringArray(record.atmosphereCapabilities, 12),
    reviewSnippets: sanitizeStringArray(record.reviewSnippets, 3),
    photoReferences: sanitizeStringArray(record.photoReferences, 10),
    sourcePlaceId: sanitizeText(record.sourcePlaceId, ""),
  };
}

function normalizeVenueCollection(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeVenueRecord).filter((record) => record !== null);
  }

  if (payload && typeof payload === "object") {
    const collection = Array.isArray(payload.venues)
      ? payload.venues
      : Array.isArray(payload.data)
        ? payload.data
        : null;

    if (collection) {
      return collection.map(normalizeVenueRecord).filter((record) => record !== null);
    }
  }

  return [];
}

function dedupeVenueRecords(records) {
  const seen = new Set();

  return records.filter((record) => {
    const key = String(record.sourcePlaceId || "")
      || `${toSlug(record.city)}|${toSlug(record.district)}|${toSlug(record.name)}`;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function readFallbackFoodRecords() {
  const payload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const yemekRecords = normalizeVenueCollection(payload.yemek);
  const kafeRecords = normalizeVenueCollection(payload.kafe);
  return dedupeVenueRecords([...yemekRecords, ...kafeRecords]);
}

async function fetchVenuePayload(path) {
  try {
    const response = await fetch(path, {
      method: "GET",
      headers: { Accept: "application/json" },
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

async function loadBundledVenueCollections() {
  const fallbackRecords = readFallbackFoodRecords();
  if (fallbackRecords.length > 0) {
    return fallbackRecords;
  }

  const [yemekPayload, kafePayload] = await Promise.all([
    fetchVenuePayload(YEMEK_JSON_PATH),
    fetchVenuePayload(KAFE_JSON_PATH),
  ]);

  const yemekRecords = normalizeVenueCollection(yemekPayload);
  const kafeRecords = normalizeVenueCollection(kafePayload);
  return dedupeVenueRecords([...yemekRecords, ...kafeRecords]);
}

async function loadVenues() {
  if (VENUES_API_ENDPOINT) {
    try {
      const apiResponse = await fetch(VENUES_API_ENDPOINT, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
      });

      if (apiResponse.ok) {
        const apiPayload = await apiResponse.json();
        const apiRecords = normalizeVenueCollection(apiPayload);

        if (apiRecords.length > 0) {
          return apiRecords;
        }
      }
    } catch (_error) {
      // Local JSON fallback below keeps the detail page usable.
    }
  }

  const bundledRecords = await loadBundledVenueCollections();
  if (bundledRecords.length > 0) {
    return bundledRecords;
  }

  const payload = await fetchVenuePayload(VENUES_JSON_PATH);
  const records = normalizeVenueCollection(payload);
  return records.length > 0 ? records : [fallbackVenue];
}

function queryParams() {
  return new URL(window.location.href).searchParams;
}

function findVenue(venues) {
  const params = queryParams();
  const citySlug = toSlug(params.get("il") || "");
  const districtSlug = toSlug(params.get("ilce") || "");
  const venueSlug = toSlug(params.get("mekan") || "");
  const placeId = sanitizeText(params.get("pid") || "");

  if (placeId) {
    const byPlaceId = venues.find((venue) => venue.sourcePlaceId === placeId);
    if (byPlaceId) {
      return byPlaceId;
    }
  }

  if (citySlug && venueSlug) {
    const byCityAndName = venues.find(
      (venue) => toSlug(venue.city) === citySlug && toSlug(venue.name) === venueSlug,
    );
    if (byCityAndName) {
      return byCityAndName;
    }
  }

  if (citySlug && districtSlug && venueSlug) {
    const byFullSlug = venues.find(
      (venue) =>
        toSlug(venue.city) === citySlug &&
        toSlug(venue.district) === districtSlug &&
        toSlug(venue.name) === venueSlug,
    );
    if (byFullSlug) {
      return byFullSlug;
    }
  }

  return venues[0] || fallbackVenue;
}

function hashSeed(seed) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function buildImageUrl(venue, suffix) {
  const seed = toSlug(`${venue.city}-${venue.name}-${suffix}-${venue.sourcePlaceId || "npid"}`);
  return `https://picsum.photos/seed/${seed}/1400/900`;
}

function resolveVenuePhotoUrl(venue, preferredIndex, suffix) {
  const gallery = Array.isArray(venue.galleryPhotoUris) ? venue.galleryPhotoUris : [];

  if (gallery.length > 0) {
    return gallery[Math.min(Math.max(preferredIndex, 0), gallery.length - 1)];
  }

  if (venue.photoUri) {
    return venue.photoUri;
  }

  return buildImageUrl(venue, suffix);
}

function starText(rating) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

function scoreLabel(rating) {
  if (rating >= 4.6) {
    return restaurantT("scoreExcellent");
  }

  if (rating >= 4.2) {
    return restaurantT("scoreVeryGood");
  }

  if (rating >= 3.8) {
    return restaurantT("scoreGood");
  }

  return restaurantT("scoreAverage");
}

function formatTurkishPhone(phoneValue) {
  const digits = String(phoneValue || "").replace(/\D+/g, "");

  if (!digits) {
    return "";
  }

  let normalized = digits;

  if (normalized.startsWith("00")) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith("90") && normalized.length >= 12) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith("0") && normalized.length === 11) {
    normalized = normalized.slice(1);
  }

  if (normalized.length > 10) {
    normalized = normalized.slice(-10);
  }

  if (normalized.length !== 10) {
    return `+90 ${normalized}`;
  }

  return `+90 ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(
    6,
    8,
  )} ${normalized.slice(8, 10)}`;
}

function formatDistrictLabel(district) {
  const districtText = sanitizeText(district, "");
  if (!districtText) {
    return restaurantT("districtFallback");
  }

  return restaurantT("districtLabel", { district: districtText });
}

function buildMapQuery(venue) {
  if (venue.address) {
    return venue.address;
  }

  const parts = [venue.name, venue.district, venue.city, restaurantT("countryName")]
    .map((segment) => sanitizeText(String(segment || ""), ""))
    .filter(Boolean);
  return parts.join(", ");
}

function buildMapUrls(venue) {
  const query = buildMapQuery(venue);
  const encodedQuery = encodeURIComponent(query);
  const mapsUrl = sanitizeUrl(venue.mapsUrl || "", "");

  return {
    iframeUrl: `https://www.google.com/maps?q=${encodedQuery}&output=embed`,
    externalUrl: mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
  };
}

function buildCommentsStorageKey(venue) {
  const venueKey = sanitizeText(venue.sourcePlaceId, "")
    || `${toSlug(venue.city)}-${toSlug(venue.district)}-${toSlug(venue.name)}`;
  return `neredeyenir.comments.v1.${venueKey}`;
}

function readComments(storageKey) {
  if (!storageKey) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const payload = JSON.parse(raw);
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const author = sanitizeText(entry.author, restaurantT("guest"));
        const comment = sanitizeCommentText(entry.comment, "");
        const createdAt = sanitizeText(entry.createdAt, "");

        if (!comment) {
          return null;
        }

        return { author, comment, createdAt };
      })
      .filter((entry) => entry !== null);
  } catch (_error) {
    return [];
  }
}

function saveComments(storageKey, comments) {
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(comments.slice(0, 250)));
  } catch (_error) {
    // Storage write failed; skip silently.
  }
}

function formatCommentDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(currentLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function renderComments() {
  if (!restaurantCommentsList || !restaurantCommentsEmpty) {
    return;
  }

  restaurantCommentsList.innerHTML = "";
  const hasComments = activeComments.length > 0;
  restaurantCommentsEmpty.hidden = hasComments;

  if (!hasComments) {
    return;
  }

  activeComments.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "restaurant-comment-item";

    const meta = document.createElement("div");
    meta.className = "restaurant-comment-meta";

    const author = document.createElement("strong");
    author.className = "restaurant-comment-author";
    author.textContent = entry.author || restaurantT("guest");

    const date = document.createElement("span");
    date.className = "restaurant-comment-date";
    date.textContent = formatCommentDate(entry.createdAt);

    meta.append(author, date);

    const body = document.createElement("p");
    body.className = "restaurant-comment-body";
    body.textContent = entry.comment;

    item.append(meta, body);
    restaurantCommentsList.append(item);
  });
}

function showCommentMessage(text) {
  if (!restaurantCommentMessage) {
    return;
  }

  restaurantCommentMessage.textContent = text;
}

function initializeCommentWriter() {
  if (!restaurantCommentForm || !restaurantCommentText) {
    return;
  }

  restaurantCommentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const comment = sanitizeCommentText(restaurantCommentText.value, "");
    if (!comment) {
      showCommentMessage(restaurantT("commentsEmptyError"));
      return;
    }

    const author = sanitizeText(
      restaurantCommentAuthor ? restaurantCommentAuthor.value : "",
      restaurantT("guest"),
    );
    const entry = {
      author,
      comment,
      createdAt: new Date().toISOString(),
    };

    activeComments = [entry, ...activeComments];
    saveComments(activeCommentsKey, activeComments);
    renderComments();
    showCommentMessage(restaurantT("commentsSaved"));

    restaurantCommentForm.reset();
  });
}

function loadCommentsForVenue(venue) {
  activeCommentsKey = buildCommentsStorageKey(venue);
  activeComments = readComments(activeCommentsKey);
  renderComments();
  showCommentMessage("");
}

function setMapStatus(text = "") {
  if (!restaurantMapStatus) {
    return;
  }

  if (!text) {
    restaurantMapStatus.hidden = true;
    restaurantMapStatus.textContent = "";
    return;
  }

  restaurantMapStatus.hidden = false;
  restaurantMapStatus.textContent = text;
}

async function geocodeWithNominatim(query) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 6000);
  const languageCode = currentLocale().split("-")[0] || "tr";
  const endpoint =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=${languageCode}&q=${encodeURIComponent(
      query,
    )}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (_error) {
    clearTimeout(timeoutHandle);
    return null;
  }
  clearTimeout(timeoutHandle);

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const first = Array.isArray(payload) ? payload[0] : null;
  if (!first) {
    return null;
  }

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function parseCoordinatePair(textValue) {
  const text = sanitizeText(String(textValue || ""), "");
  if (!text) {
    return null;
  }

  const match = text.match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

function extractCoordinatesFromMapsUrl(mapsUrl) {
  const normalizedUrl = sanitizeUrl(mapsUrl || "", "");
  if (!normalizedUrl) {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch (_error) {
    return null;
  }

  const fromParams = [
    parsedUrl.searchParams.get("q"),
    parsedUrl.searchParams.get("query"),
    parsedUrl.searchParams.get("destination"),
  ];

  for (const candidate of fromParams) {
    const parsed = parseCoordinatePair(candidate || "");
    if (parsed) {
      return parsed;
    }
  }

  const rawUrl = parsedUrl.toString();
  const atMatch = rawUrl.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (atMatch) {
    return parseCoordinatePair(`${atMatch[1]},${atMatch[2]}`);
  }

  const dMatch = rawUrl.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  if (dMatch) {
    return parseCoordinatePair(`${dMatch[1]},${dMatch[2]}`);
  }

  return null;
}

function disposeLeafletMap() {
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    leafletMarker = null;
  }
}

function renderMapIframe(mapUrls) {
  if (!restaurantMapCanvas || !mapUrls || !mapUrls.iframeUrl) {
    return false;
  }

  disposeLeafletMap();
  restaurantMapCanvas.innerHTML = "";

  const iframe = document.createElement("iframe");
  iframe.className = "restaurant-map-iframe";
  iframe.src = mapUrls.iframeUrl;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.title = restaurantT("mapAria");
  iframe.setAttribute("aria-label", restaurantT("mapAria"));

  restaurantMapCanvas.append(iframe);
  return true;
}

function ensureLeafletMap(center, venueName) {
  if (!restaurantMapCanvas || typeof window.L === "undefined") {
    return false;
  }

  if (restaurantMapCanvas.querySelector("iframe")) {
    restaurantMapCanvas.innerHTML = "";
  }

  if (!leafletMap) {
    leafletMap = window.L.map(restaurantMapCanvas, { zoomControl: true });
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap);
  }

  leafletMap.setView([center.lat, center.lng], 17);

  if (leafletMarker) {
    leafletMarker.remove();
  }

  const markerIcon = window.L.divIcon({
    className: "restaurant-map-pin-icon",
    html: '<span class="restaurant-map-pin"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    tooltipAnchor: [0, -20],
  });

  leafletMarker = window.L.marker([center.lat, center.lng], { icon: markerIcon }).addTo(leafletMap);
  leafletMarker.bindTooltip(venueName, {
    direction: "top",
    offset: [0, -16],
    opacity: 1,
  });
  leafletMarker.on("mouseover", () => leafletMarker.openTooltip());
  leafletMarker.on("mouseout", () => leafletMarker.closeTooltip());

  setTimeout(() => {
    if (!leafletMap) {
      return;
    }
    leafletMap.invalidateSize();
  }, 80);

  return true;
}

async function renderLocationMap(venue) {
  const token = `${venue.sourcePlaceId || "noid"}:${venue.name}`;
  latestMapToken = token;

  if (!restaurantMapCanvas) {
    return;
  }

  const mapUrls = buildMapUrls(venue);
  const iframeRendered = renderMapIframe(mapUrls);
  setMapStatus(iframeRendered ? "" : restaurantT("mapLoading"));

  let center = extractCoordinatesFromMapsUrl(venue.mapsUrl);

  try {
    if (!center) {
      const primaryQuery = buildMapQuery(venue);
      center = await geocodeWithNominatim(primaryQuery);
    }

    if (!center) {
      const fallbackQuery = `${venue.name}, ${venue.city}, ${restaurantT("countryName")}`;
      center = await geocodeWithNominatim(fallbackQuery);
    }
  } catch (_error) {
    center = null;
  }

  if (latestMapToken !== token) {
    return;
  }

  if (!center && renderMapIframe(mapUrls)) {
    setMapStatus("");
    return;
  }

  if (!center) {
    setMapStatus(restaurantT("mapNotFound"));
    return;
  }

  const ready = ensureLeafletMap(center, venue.name);
  if (!ready) {
    if (renderMapIframe(mapUrls)) {
      setMapStatus("");
      return;
    }
    setMapStatus(restaurantT("mapLoadFailed"));
    return;
  }

  setMapStatus("");
}

function setActivePanel(panelName, activeButton = null) {
  restaurantPanels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== panelName;
  });

  restaurantTabs.forEach((button) => {
    const shouldActivate = activeButton ? button === activeButton : button.dataset.panel === panelName;
    button.classList.toggle("active", shouldActivate);
  });

  if (panelName === "location" && leafletMap) {
    setTimeout(() => {
      leafletMap?.invalidateSize();
    }, 80);
  }

  if (panelName === "location" && activeVenue) {
    void renderLocationMap(activeVenue);
  }
}

function initializeTabInteractions() {
  if (restaurantTabs.length === 0 || restaurantPanels.length === 0) {
    return;
  }

  restaurantTabs.forEach((button) => {
    button.addEventListener("click", () => {
      const panelName = button.dataset.panel || "overview";
      setActivePanel(panelName, button);
    });
  });

  if (restaurantReviews) {
    restaurantReviews.addEventListener("click", (event) => {
      event.preventDefault();
      const commentsTab = restaurantTabs.find((tab) => tab.dataset.panel === "comments") || null;
      setActivePanel("comments", commentsTab);
    });
  }

  setActivePanel("overview", restaurantTabs[0]);
}

function buildBreadcrumb(venue) {
  const cityUrl = new URL("city.html", window.location.href);
  cityUrl.searchParams.set("il", toSlug(venue.city));
  const foodUrl = "yemek.html";

  restaurantBreadcrumb.innerHTML = "";

  const homeLink = document.createElement("a");
  homeLink.href = "index.html";
  homeLink.textContent = restaurantT("home");

  const dividerOne = document.createElement("span");
  dividerOne.textContent = "/";

  const foodLink = document.createElement("a");
  foodLink.href = foodUrl;
  foodLink.textContent = restaurantT("food");

  const dividerTwo = document.createElement("span");
  dividerTwo.textContent = "/";

  const cityLink = document.createElement("a");
  cityLink.href = cityUrl.toString();
  cityLink.textContent = restaurantT("cityLink", { city: venue.city });

  const dividerThree = document.createElement("span");
  dividerThree.textContent = "/";

  const districtText = formatDistrictLabel(venue.district);

  let current;
  if (venue.district) {
    const districtUrl = new URL("city.html", window.location.href);
    districtUrl.searchParams.set("il", toSlug(venue.city));
    districtUrl.searchParams.set("ilce", toSlug(venue.district));

    current = document.createElement("a");
    current.href = districtUrl.toString();
    current.textContent = districtText;
  } else {
    current = document.createElement("strong");
    current.textContent = districtText;
  }

  restaurantBreadcrumb.append(
    homeLink,
    dividerOne,
    foodLink,
    dividerTwo,
    cityLink,
    dividerThree,
    current,
  );
}

function renderVenue(venue) {
  activeVenue = venue;
  const hasRating = Number.isFinite(venue.rating);
  const hasReviewCount = Number.isFinite(venue.userRatingCount) && venue.userRatingCount > 0;
  const displayRating = hasRating && hasReviewCount ? venue.rating : 0;
  const localizedCuisine = localizeCuisineLabel(venue.cuisine);

  document.title = restaurantT("title", { name: venue.name });

  buildBreadcrumb(venue);

  restaurantLead.textContent = "";
  restaurantLead.hidden = true;
  restaurantName.textContent = venue.name;
  restaurantStars.textContent = starText(displayRating);
  restaurantScore.textContent = displayRating.toFixed(1);
  restaurantScore.hidden = false;
  restaurantScoreLabel.textContent = hasReviewCount ? scoreLabel(displayRating) : "";
  restaurantScoreLabel.hidden = !hasReviewCount;
  restaurantReviews.textContent = hasReviewCount
    ? restaurantT("reviewCount", { count: venue.userRatingCount.toLocaleString(currentLocale()) })
    : restaurantT("reviewMissing");
  const addressText = venue.address || [sanitizeText(venue.district, ""), venue.city].filter(Boolean).join(", ");
  restaurantMeta.textContent = restaurantT("categoryMeta", { cuisine: localizedCuisine });

  let localizedCuisineLower = localizedCuisine;
  try {
    localizedCuisineLower = localizedCuisine.toLocaleLowerCase(currentLocale());
  } catch (_error) {
    localizedCuisineLower = localizedCuisine.toLowerCase();
  }

  const summaryBase =
    sanitizeText(venue.editorialSummary || "", "") ||
    restaurantT("overviewFallback", {
      name: venue.name,
      city: venue.city,
      cuisine: localizedCuisineLower,
    });
  const atmosphereText = Array.isArray(venue.atmosphereCapabilities) && venue.atmosphereCapabilities.length > 0
    ? restaurantT("atmospherePrefix", { items: venue.atmosphereCapabilities.join(", ") })
    : "";
  const menuText = Array.isArray(venue.menuCapabilities) && venue.menuCapabilities.length > 0
    ? restaurantT("menuPrefix", { items: venue.menuCapabilities.join(", ") })
    : "";
  const overview = [summaryBase, atmosphereText, menuText].filter(Boolean).join(" ");
  restaurantOverviewText.textContent = overview;

  restaurantMainImage.src = resolveVenuePhotoUrl(venue, 0, "main");
  restaurantThumbs.forEach((image, index) => {
    image.src = resolveVenuePhotoUrl(venue, index + 1, `thumb-${index + 1}`);
  });

  const formattedPhone = formatTurkishPhone(venue.phone);
  restaurantAddressFields.forEach((field) => {
    field.textContent = addressText;
  });
  restaurantPhoneFields.forEach((field) => {
    field.classList.toggle("is-missing", !formattedPhone);
    field.textContent = formattedPhone || restaurantT("phoneMissing");
  });

  const instagramText = sanitizeUrl(venue.instagram || "", "");
  restaurantInstagramFields.forEach((field) => {
    field.classList.toggle("is-missing", !instagramText);
    field.innerHTML = "";

    if (!instagramText) {
      field.textContent = restaurantT("infoMissing");
      return;
    }

    const instagramLink = document.createElement("a");
    instagramLink.className = "restaurant-instagram-link";
    instagramLink.href = instagramText;
    instagramLink.target = "_blank";
    instagramLink.rel = "noopener noreferrer";
    instagramLink.textContent = instagramText;
    instagramLink.setAttribute("aria-label", restaurantT("instagramOpenAria"));
    field.append(instagramLink);
  });

  const websiteText = sanitizeUrl(venue.website || venue.web || venue.url, "");
  restaurantWebsiteFields.forEach((field) => {
    field.classList.toggle("is-missing", !websiteText);
    field.innerHTML = "";

    if (!websiteText) {
      field.textContent = restaurantT("infoMissing");
      return;
    }

    const websiteLink = document.createElement("a");
    websiteLink.className = "restaurant-website-link";
    websiteLink.href = websiteText;
    websiteLink.target = "_blank";
    websiteLink.rel = "noopener noreferrer";
    websiteLink.textContent = websiteText;
    websiteLink.setAttribute("aria-label", restaurantT("websiteOpenAria"));
    field.append(websiteLink);
  });

  const mapUrls = buildMapUrls(venue);
  if (restaurantMapLink) {
    restaurantMapLink.href = mapUrls.externalUrl;
  }
  loadCommentsForVenue(venue);
  void renderLocationMap(venue);
}

function applyRestaurantLanguage() {
  applyRestaurantStaticTranslations();
  if (activeVenue) {
    renderVenue(activeVenue);
  }
}

async function initializeRestaurantPage() {
  activeLanguage = getCurrentLanguage() || readLanguageFromStorage();
  applyRestaurantStaticTranslations();
  initializeTabInteractions();
  initializeCommentWriter();
  const venues = await loadVenues();
  const venue = findVenue(venues);

  renderVenue(venue);
}

document.addEventListener("neredeyenir:languagechange", (event) => {
  const requestedLanguage =
    event && event.detail && typeof event.detail.language === "string"
      ? event.detail.language
      : "TR";
  activeLanguage = normalizeLanguageCode(requestedLanguage);
  applyRestaurantLanguage();
});

initializeRestaurantPage();
