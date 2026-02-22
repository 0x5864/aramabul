(() => {
  const form = document.querySelector(".header-search");
  if (!form) {
    return;
  }

  const input = form.querySelector(".header-search-input");
  const submitButton = form.querySelector(".header-search-btn");
  if (!input || !submitButton) {
    return;
  }

  const VENUES_JSON_PATH = "data/venues.json";
  const API_BASE_URL = (() => {
    if (typeof window.NEREDEYENIR_API_BASE === "string" && window.NEREDEYENIR_API_BASE.trim()) {
      return window.NEREDEYENIR_API_BASE.trim().replace(/\/+$/u, "");
    }

    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
      return `${window.location.protocol}//${window.location.hostname}:8787`;
    }

    return window.location.origin;
  })();
  const VENUES_API_ENDPOINT =
    typeof window.NEREDEYENIR_VENUES_API === "string" && window.NEREDEYENIR_VENUES_API.trim()
      ? window.NEREDEYENIR_VENUES_API.trim()
      : API_BASE_URL
        ? `${API_BASE_URL}/api/venues?limit=50000`
        : "";
  const turkishCharMap = {
    ç: "c",
    ğ: "g",
    ı: "i",
    i: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };

  let venuesPromise = null;

  function normalizeForSearch(value) {
    return String(value || "")
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
      .normalize("NFC");
  }

  function canonicalize(value) {
    return normalizeForSearch(value)
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toSlug(value) {
    return normalizeForSearch(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function sanitizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function normalizeVenueRecord(record) {
    if (!record || typeof record !== "object") {
      return null;
    }

    const name = sanitizeText(record.name);
    const city = sanitizeText(record.city);
    const district = sanitizeText(record.district);
    const sourcePlaceId = sanitizeText(record.sourcePlaceId);

    if (!name || !city) {
      return null;
    }

    return {
      name,
      city,
      district,
      sourcePlaceId,
      canonicalName: canonicalize(name),
    };
  }

  function normalizeVenueCollection(payload) {
    if (Array.isArray(payload)) {
      return payload.map(normalizeVenueRecord).filter((venue) => venue !== null);
    }

    if (payload && typeof payload === "object") {
      const collection = Array.isArray(payload.venues)
        ? payload.venues
        : Array.isArray(payload.data)
          ? payload.data
          : null;

      if (collection) {
        return collection.map(normalizeVenueRecord).filter((venue) => venue !== null);
      }
    }

    return [];
  }

  async function loadVenues() {
    if (venuesPromise) {
      return venuesPromise;
    }

    venuesPromise = fetch(VENUES_API_ENDPOINT || VENUES_JSON_PATH, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
    })
      .then((response) => {
        if (!response.ok) {
          return [];
        }

        return response.json();
      })
      .then((payload) => normalizeVenueCollection(payload))
      .catch(() => [])
      .then((records) => {
        if (records.length > 0 || !VENUES_API_ENDPOINT) {
          return records;
        }

        return fetch(VENUES_JSON_PATH, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit",
        })
          .then((response) => {
            if (!response.ok) {
              return [];
            }

            return response.json();
          })
          .then((payload) => normalizeVenueCollection(payload))
          .catch(() => []);
      });

    return venuesPromise;
  }

  function findMatchingVenue(venues, query) {
    const canonicalQuery = canonicalize(query);
    if (!canonicalQuery) {
      return null;
    }

    const exactMatch = venues.find((venue) => venue.canonicalName === canonicalQuery);
    if (exactMatch) {
      return exactMatch;
    }

    const prefixMatch = venues.find((venue) => venue.canonicalName.startsWith(canonicalQuery));
    if (prefixMatch) {
      return prefixMatch;
    }

    if (canonicalQuery.length >= 3) {
      return venues.find((venue) => venue.canonicalName.includes(canonicalQuery)) || null;
    }

    return null;
  }

  function restaurantUrlFor(venue) {
    const targetUrl = new URL("restaurant.html", window.location.href);
    targetUrl.searchParams.set("il", toSlug(venue.city));
    targetUrl.searchParams.set("ilce", toSlug(venue.district || ""));
    targetUrl.searchParams.set("mekan", toSlug(venue.name));

    if (venue.sourcePlaceId) {
      targetUrl.searchParams.set("pid", venue.sourcePlaceId);
    }

    return `${targetUrl.pathname}${targetUrl.search}`;
  }

  function cityUrlFor(rawQuery) {
    const targetUrl = new URL("city.html", window.location.href);
    targetUrl.searchParams.set("il", toSlug(rawQuery));
    return `${targetUrl.pathname}${targetUrl.search}`;
  }

  function setLoadingState(isLoading) {
    input.disabled = isLoading;
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Aranıyor..." : "Ara";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    setLoadingState(true);

    try {
      const venues = await loadVenues();
      const matchedVenue = findMatchingVenue(venues, query);

      if (matchedVenue) {
        window.location.assign(restaurantUrlFor(matchedVenue));
        return;
      }

      window.location.assign(cityUrlFor(query));
    } finally {
      setLoadingState(false);
    }
  });
})();
