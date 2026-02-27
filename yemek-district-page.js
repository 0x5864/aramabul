const ASSET_VERSION = "20260227-13";
const YEMEK_JSON_PATH = "data/yemek.json";
const CATEGORY_VENUES_JSON_PATH = "data/venues.json";

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
let venueMetaLookupPromise = null;

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

function venueKey(venue) {
  const city = normalizeName(venue.city);
  const district = normalizeName(venue.district);
  const name = normalizeName(venue.name);
  return `${city}:${district}:${name}`;
}

async function loadVenueMetaLookup() {
  if (venueMetaLookupPromise) {
    return venueMetaLookupPromise;
  }

  venueMetaLookupPromise = (async () => {
    const byPlaceId = new Map();
    const byName = new Map();
    const candidates = [
      `${CATEGORY_VENUES_JSON_PATH}?v=${ASSET_VERSION}`,
      CATEGORY_VENUES_JSON_PATH,
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
      return { byPlaceId, byName };
    }

    payload.forEach((item) => {
      const meta = {
        phone: String(item.phone || "").trim(),
        photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
        website: String(item.website || "").trim(),
        address: String(item.address || "").trim(),
      };
      const hasAnyMeta = Boolean(meta.phone || meta.photoUrl || meta.website || meta.address);
      if (!hasAnyMeta) {
        return;
      }

      const placeId = String(item.sourcePlaceId || item.placeId || "").trim();
      if (placeId && !byPlaceId.has(placeId)) {
        byPlaceId.set(placeId, meta);
      }

      const key = venueKey({
        city: item.city,
        district: item.district,
        name: item.name,
      });
      if (key !== "::" && !byName.has(key)) {
        byName.set(key, meta);
      }
    });

    return { byPlaceId, byName };
  })();

  return venueMetaLookupPromise;
}

function resolveVenueMeta(venue, metaLookup) {
  const resolved = {
    phone: String(venue.phone || "").trim(),
    photoUrl: String(venue.photoUrl || "").trim(),
    website: String(venue.website || "").trim(),
    address: String(venue.address || "").trim(),
  };

  if (
    resolved.phone &&
    resolved.photoUrl &&
    resolved.website &&
    resolved.address
  ) {
    return resolved;
  }

  if (!metaLookup || typeof metaLookup !== "object") {
    return resolved;
  }

  let sourceMeta = null;
  const placeId = String(venue.sourcePlaceId || "").trim();
  if (placeId && metaLookup.byPlaceId instanceof Map && metaLookup.byPlaceId.has(placeId)) {
    sourceMeta = metaLookup.byPlaceId.get(placeId);
  }

  if (!sourceMeta) {
    const key = venueKey(venue);
    if (key !== "::" && metaLookup.byName instanceof Map && metaLookup.byName.has(key)) {
      sourceMeta = metaLookup.byName.get(key);
    }
  }

  if (!sourceMeta || typeof sourceMeta !== "object") {
    return resolved;
  }

  if (!resolved.phone) {
    resolved.phone = String(sourceMeta.phone || "").trim();
  }
  if (!resolved.photoUrl) {
    resolved.photoUrl = String(sourceMeta.photoUrl || "").trim();
  }
  if (!resolved.website) {
    resolved.website = String(sourceMeta.website || "").trim();
  }
  if (!resolved.address) {
    resolved.address = String(sourceMeta.address || "").trim();
  }

  return resolved;
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

function mapsEmbedUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps");
  mapsUrl.searchParams.set("q", `${venue.name} ${venue.district} ${venue.city}`);
  mapsUrl.searchParams.set("output", "embed");
  return mapsUrl.toString();
}

function sanitizeUrl(rawUrl) {
  const raw = String(rawUrl || "").trim();
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return "";
}

let mapFocusModalApi = null;

function ensureMapFocusModal() {
  if (mapFocusModalApi) {
    return mapFocusModalApi;
  }

  if (!document.body) {
    return null;
  }

  const modal = document.createElement("section");
  modal.className = "map-focus-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <button class="map-focus-backdrop" type="button" aria-label="Harita penceresini kapat"></button>
    <article class="map-focus-panel" role="dialog" aria-modal="true" aria-labelledby="mapFocusTitle">
      <header class="map-focus-head">
        <div class="map-focus-head-text">
          <p class="map-focus-eyebrow">Restoran Odağı</p>
          <h3 id="mapFocusTitle" class="map-focus-title">Restoran</h3>
        </div>
        <button class="map-focus-close" type="button" aria-label="Kapat">Kapat</button>
      </header>
      <div class="map-focus-body">
        <aside class="map-focus-info-card" aria-label="Restoran bilgileri">
          <h4 class="map-focus-info-title">Restoran Bilgisi</h4>
          <dl class="map-focus-info-list">
            <div class="map-focus-info-row" data-info-row="phone-primary">
              <dt>Telefon No</dt>
              <dd data-info-field="phone-primary">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="location">
              <dt>Konum</dt>
              <dd data-info-field="location">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="address">
              <dt>Adres</dt>
              <dd data-info-field="address">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="website">
              <dt>Website</dt>
              <dd>
                <a data-info-field="website" href="#" target="_blank" rel="noopener noreferrer">Siteye git</a>
              </dd>
            </div>
          </dl>
        </aside>
        <div class="map-focus-frame-wrap">
          <iframe
            class="map-focus-frame"
            title="Google Maps restoran görünümü"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      <footer class="map-focus-foot">
        <p class="map-focus-subtitle"></p>
        <a class="map-focus-external" href="#" target="_blank" rel="noopener noreferrer">Google Maps'te aç</a>
      </footer>
    </article>
  `;

  const titleNode = modal.querySelector(".map-focus-title");
  const subtitleNode = modal.querySelector(".map-focus-subtitle");
  const iframeNode = modal.querySelector(".map-focus-frame");
  const externalNode = modal.querySelector(".map-focus-external");
  const closeNode = modal.querySelector(".map-focus-close");
  const backdropNode = modal.querySelector(".map-focus-backdrop");
  const infoPhonePrimaryNode = modal.querySelector('[data-info-field="phone-primary"]');
  const infoLocationNode = modal.querySelector('[data-info-field="location"]');
  const infoAddressNode = modal.querySelector('[data-info-field="address"]');
  const infoWebsiteNode = modal.querySelector('[data-info-field="website"]');
  const infoPhonePrimaryRow = modal.querySelector('[data-info-row="phone-primary"]');
  const infoLocationRow = modal.querySelector('[data-info-row="location"]');
  const infoAddressRow = modal.querySelector('[data-info-row="address"]');
  const infoWebsiteRow = modal.querySelector('[data-info-row="website"]');

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("map-focus-open");
    if (iframeNode instanceof HTMLIFrameElement) {
      iframeNode.src = "about:blank";
    }
  };

  const open = (venue) => {
    if (!(iframeNode instanceof HTMLIFrameElement)) {
      window.open(mapsPlaceUrl(venue), "_blank", "noopener");
      return;
    }

    if (titleNode) {
      titleNode.textContent = String(venue.name || "").trim() || "Restoran";
    }

    if (subtitleNode) {
      const subtitle = [venue.district, venue.city]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" / ");
      subtitleNode.textContent = subtitle;
      subtitleNode.hidden = !subtitle;
    }

    const externalUrl = mapsPlaceUrl(venue);
    if (externalNode instanceof HTMLAnchorElement) {
      externalNode.href = externalUrl;
    }

    const infoLocation = [venue.district, venue.city]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" / ");
    const infoAddress = String(venue.address || "").trim();
    const infoPhone = String(venue.phone || "").trim();
    const infoWebsite = sanitizeUrl(venue.website);

    if (infoPhonePrimaryNode) {
      infoPhonePrimaryNode.textContent = infoPhone || "Bilgi yok";
    }
    if (infoLocationNode) {
      infoLocationNode.textContent = infoLocation || "-";
    }
    if (infoAddressNode) {
      infoAddressNode.textContent = infoAddress || "-";
    }
    if (infoWebsiteNode instanceof HTMLAnchorElement) {
      if (infoWebsite) {
        infoWebsiteNode.href = infoWebsite;
        infoWebsiteNode.textContent = infoWebsite;
        infoWebsiteNode.hidden = false;
      } else {
        infoWebsiteNode.removeAttribute("href");
        infoWebsiteNode.textContent = "";
        infoWebsiteNode.hidden = true;
      }
    }

    if (infoPhonePrimaryRow instanceof HTMLElement) {
      infoPhonePrimaryRow.hidden = false;
    }
    if (infoLocationRow instanceof HTMLElement) {
      infoLocationRow.hidden = !infoLocation;
    }
    if (infoAddressRow instanceof HTMLElement) {
      infoAddressRow.hidden = !infoAddress;
    }
    if (infoWebsiteRow instanceof HTMLElement) {
      infoWebsiteRow.hidden = !infoWebsite;
    }

    iframeNode.src = mapsEmbedUrl(venue);
    modal.hidden = false;
    document.body.classList.add("map-focus-open");
  };

  closeNode?.addEventListener("click", close);
  backdropNode?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  document.body.append(modal);
  mapFocusModalApi = { open, close };
  return mapFocusModalApi;
}

function openRestaurantMapFocus(venue) {
  const api = ensureMapFocusModal();
  if (!api) {
    window.open(mapsPlaceUrl(venue), "_blank", "noopener");
    return;
  }
  api.open(venue);
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
    const chip = document.createElement("button");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.type = "button";
    chip.textContent = venue.name;
    chip.setAttribute("aria-label", `${venue.name} restoranını harita penceresinde aç`);
    chip.addEventListener("click", () => {
      openRestaurantMapFocus(venue);
    });
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  yemekRestaurantGrid.append(row);
}

async function loadVenues() {
  const metaLookup = await loadVenueMetaLookup();
  const fallbackPayload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
  if (
    fallbackPayload &&
    typeof fallbackPayload === "object" &&
    Array.isArray(fallbackPayload.yemek) &&
    fallbackPayload.yemek.length > 0
  ) {
    return fallbackPayload.yemek.map((item) => {
      const mapped = {
      city: String(item.city || "").trim(),
      district: String(item.district || "").trim(),
      name: String(item.name || "").trim(),
      cuisine: String(item.cuisine || "").trim(),
      address: String(item.address || "").trim(),
      website: String(item.website || "").trim(),
      phone: String(item.phone || "").trim(),
      photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
      sourcePlaceId: typeof item.sourcePlaceId === "string" ? item.sourcePlaceId : "",
      };
      const resolvedMeta = resolveVenueMeta(mapped, metaLookup);
      mapped.phone = resolvedMeta.phone;
      mapped.photoUrl = resolvedMeta.photoUrl;
      mapped.website = resolvedMeta.website;
      mapped.address = resolvedMeta.address;
      return mapped;
    });
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

  return payload.map((item) => {
    const mapped = {
    city: String(item.city || "").trim(),
    district: String(item.district || "").trim(),
    name: String(item.name || "").trim(),
    cuisine: String(item.cuisine || "").trim(),
    address: String(item.address || "").trim(),
    website: String(item.website || "").trim(),
    phone: String(item.phone || "").trim(),
    photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
    sourcePlaceId: typeof item.sourcePlaceId === "string" ? item.sourcePlaceId : "",
    };
    const resolvedMeta = resolveVenueMeta(mapped, metaLookup);
    mapped.phone = resolvedMeta.phone;
    mapped.photoUrl = resolvedMeta.photoUrl;
    mapped.website = resolvedMeta.website;
    mapped.address = resolvedMeta.address;
    return mapped;
  });
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
