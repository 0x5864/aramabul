const VENUES_JSON_PATH = "data/venues.json";

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
const restaurantEmailFields = [...document.querySelectorAll('[data-info-field="email"]')];
const restaurantWebsiteFields = [...document.querySelectorAll('[data-info-field="website"]')];
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

let leafletMap = null;
let leafletMarker = null;
let latestMapToken = "";
let activeCommentsKey = "";
let activeComments = [];

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

function sanitizeCommentText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 500) : fallback;
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
    return 4;
  }

  return Math.min(5, Math.max(0, numeric));
}

function normalizeVenueRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const city = sanitizeText(record.city);
  const district = sanitizeText(record.district, "Merkez");
  const name = sanitizeVenueName(record.name);
  const cuisine = sanitizeText(record.cuisine, "Restoran");

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
    address: sanitizeText(record.address, ""),
    phone: sanitizeText(record.phone, ""),
    email: sanitizeText(record.email, ""),
    website: sanitizeText(record.website || record.web || record.url, ""),
    sourcePlaceId: sanitizeText(record.sourcePlaceId, ""),
  };
}

function normalizeVenueCollection(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map(normalizeVenueRecord).filter((record) => record !== null);
}

async function loadVenues() {
  try {
    const response = await fetch(VENUES_JSON_PATH, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
    });

    if (!response.ok) {
      return [fallbackVenue];
    }

    const payload = await response.json();
    const records = normalizeVenueCollection(payload);
    return records.length > 0 ? records : [fallbackVenue];
  } catch (_error) {
    return [fallbackVenue];
  }
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

function starText(rating) {
  const full = Math.max(1, Math.min(5, Math.round(rating)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

function scoreLabel(rating) {
  if (rating >= 4.6) {
    return "Mükemmel";
  }

  if (rating >= 4.2) {
    return "Çok iyi";
  }

  if (rating >= 3.8) {
    return "İyi";
  }

  return "Orta";
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
    return "İlçe";
  }

  return districtText.toLocaleLowerCase("tr").endsWith("ilçesi")
    ? districtText
    : `${districtText} İlçesi`;
}

function buildMapQuery(venue) {
  if (venue.address) {
    return venue.address;
  }

  return `${venue.name}, ${venue.district}, ${venue.city}, Türkiye`;
}

function buildMapUrls(venue) {
  const query = buildMapQuery(venue);
  const encodedQuery = encodeURIComponent(query);

  return {
    iframeUrl: `https://www.google.com/maps?q=${encodedQuery}&output=embed`,
    externalUrl: `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
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

        const author = sanitizeText(entry.author, "Misafir");
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

  return date.toLocaleDateString("tr-TR", {
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
    author.textContent = entry.author || "Misafir";

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
      showCommentMessage("Yorum metni boş olamaz.");
      return;
    }

    const author = sanitizeText(restaurantCommentAuthor ? restaurantCommentAuthor.value : "", "Misafir");
    const entry = {
      author,
      comment,
      createdAt: new Date().toISOString(),
    };

    activeComments = [entry, ...activeComments];
    saveComments(activeCommentsKey, activeComments);
    renderComments();
    showCommentMessage("Yorumun kaydedildi.");

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
  const endpoint =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=tr&q=${encodeURIComponent(
      query,
    )}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

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

function ensureLeafletMap(center, venueName) {
  if (!restaurantMapCanvas || typeof window.L === "undefined") {
    return false;
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

  if (typeof window.L === "undefined") {
    setMapStatus("Harita yüklenemedi. Lütfen tekrar dene.");
    return;
  }

  setMapStatus("Konum yükleniyor...");

  const primaryQuery = buildMapQuery(venue);
  let center = await geocodeWithNominatim(primaryQuery);

  if (!center) {
    const fallbackQuery = `${venue.name}, ${venue.city}, Türkiye`;
    center = await geocodeWithNominatim(fallbackQuery);
  }

  if (latestMapToken !== token) {
    return;
  }

  if (!center) {
    setMapStatus("Konum bulunamadı. Alttaki bağlantıdan Google Haritalar'ı açabilirsin.");
    return;
  }

  const ready = ensureLeafletMap(center, venue.name);
  if (!ready) {
    setMapStatus("Harita yüklenemedi. Lütfen tekrar dene.");
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

  restaurantBreadcrumb.innerHTML = "";

  const homeLink = document.createElement("a");
  homeLink.href = "index.html";
  homeLink.textContent = "Anasayfa";

  const dividerOne = document.createElement("span");
  dividerOne.textContent = "/";

  const cityLink = document.createElement("a");
  cityLink.href = cityUrl.toString();
  cityLink.textContent = `${venue.city} restoranları`;

  const dividerTwo = document.createElement("span");
  dividerTwo.textContent = "/";

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

  restaurantBreadcrumb.append(homeLink, dividerOne, cityLink, dividerTwo, current);
}

function renderVenue(venue) {
  const seed = hashSeed(`${venue.city}-${venue.district}-${venue.name}`);
  const reviewCount = 120 + (seed % 1400);
  const priceMap = {
    "₺": "₺100 - ₺299",
    "₺₺": "₺300 - ₺699",
    "₺₺₺": "₺700 - ₺1499",
    "₺₺₺₺": "₺1500+",
  };

  document.title = `NeredeYenir | ${venue.name}`;

  buildBreadcrumb(venue);

  restaurantLead.textContent = `${venue.city} / ${formatDistrictLabel(venue.district)}`;
  restaurantName.textContent = venue.name;
  restaurantStars.textContent = starText(venue.rating);
  restaurantScore.textContent = venue.rating.toFixed(1);
  restaurantScoreLabel.textContent = scoreLabel(venue.rating);
  restaurantReviews.textContent = `${reviewCount} değerlendirme`;
  const addressText = venue.address || `${venue.district}, ${venue.city}`;
  restaurantMeta.textContent = `Kategori: ${venue.cuisine} · Ortalama bütçe: ${priceMap[venue.budget] || venue.budget}`;

  const overview = `${venue.name}, ${venue.city} şehrinde özellikle ${venue.cuisine.toLocaleLowerCase(
    "tr",
  )} sevenler için tercih edilen bir durak. Bu sayfa ilk sürüm detay düzenidir; menü, yorum ve fotoğraf bölümleri sonraki iterasyonda daha kapsamlı olacak.`;
  restaurantOverviewText.textContent = overview;

  restaurantMainImage.src = buildImageUrl(venue, "main");
  restaurantThumbs.forEach((image, index) => {
    image.src = buildImageUrl(venue, `thumb-${index + 1}`);
  });

  const formattedPhone = formatTurkishPhone(venue.phone);
  restaurantAddressFields.forEach((field) => {
    field.textContent = addressText;
  });
  restaurantPhoneFields.forEach((field) => {
    field.classList.toggle("is-missing", !formattedPhone);
    field.textContent = formattedPhone || "Telefon bilgisi bulunamadı";
  });

  const emailText = sanitizeText(venue.email || "", "");
  restaurantEmailFields.forEach((field) => {
    field.classList.toggle("is-missing", !emailText);
    field.textContent = emailText || "Bilgi bulunamamıştır";
  });

  const websiteText = sanitizeText(venue.website || venue.web || venue.url, "");
  restaurantWebsiteFields.forEach((field) => {
    field.classList.toggle("is-missing", !websiteText);
    field.textContent = websiteText || "Bilgi bulunamamıştır";
  });

  const mapUrls = buildMapUrls(venue);
  if (restaurantMapLink) {
    restaurantMapLink.href = mapUrls.externalUrl;
  }
  loadCommentsForVenue(venue);
  void renderLocationMap(venue);
}

async function initializeRestaurantPage() {
  initializeTabInteractions();
  initializeCommentWriter();
  const venues = await loadVenues();
  const venue = findVenue(venues);

  renderVenue(venue);
}

initializeRestaurantPage();
