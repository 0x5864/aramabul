(() => {
  const LANG_STORAGE_KEY = "neredeyenir.selectedLanguage.v1";
  const LANGUAGE_OPTIONS = {
    TR: { htmlLang: "tr" },
    EN: { htmlLang: "en" },
    RU: { htmlLang: "ru" },
    DE: { htmlLang: "de" },
    ZH: { htmlLang: "zh" },
  };
  const SEARCH_BUTTON_TEXT = {
    TR: { idle: "Ara", loading: "Aranıyor..." },
    EN: { idle: "Search", loading: "Searching..." },
    RU: { idle: "Поиск", loading: "Поиск..." },
    DE: { idle: "Suchen", loading: "Suche..." },
    ZH: { idle: "搜索", loading: "搜索中..." },
  };
  const SEARCH_PLACEHOLDER_TEXT = {
    TR: "Restoran ara",
    EN: "Search restaurant",
    RU: "Найти ресторан",
    DE: "Restaurant suchen",
    ZH: "搜索餐厅",
  };
  const SEARCH_FORM_ARIA_TEXT = {
    TR: "Restoran arama",
    EN: "Restaurant search",
    RU: "Поиск ресторана",
    DE: "Restaurantsuche",
    ZH: "餐厅搜索",
  };
  const SEARCH_INPUT_LABEL_TEXT = {
    TR: "Restoran adı",
    EN: "Restaurant name",
    RU: "Название ресторана",
    DE: "Restaurantname",
    ZH: "餐厅名称",
  };
  const HOVER_CLOSE_DELAY_MS = 180;
  const hoverCloseTimers = new WeakMap();

  function clearHoverCloseTimer(container) {
    if (!container) {
      return;
    }

    const activeTimer = hoverCloseTimers.get(container);
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      hoverCloseTimers.delete(container);
    }
  }

  function scheduleHoverClose(container) {
    if (!container) {
      return;
    }

    clearHoverCloseTimer(container);
    const timerId = window.setTimeout(() => {
      closeLanguageMenu(container);
      hoverCloseTimers.delete(container);
    }, HOVER_CLOSE_DELAY_MS);
    hoverCloseTimers.set(container, timerId);
  }

  function isKnownLanguage(code) {
    return Boolean(code && Object.prototype.hasOwnProperty.call(LANGUAGE_OPTIONS, code));
  }

  function readStoredLanguage() {
    try {
      const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
      const code = String(raw || "").trim().toUpperCase();
      return isKnownLanguage(code) ? code : "TR";
    } catch (_error) {
      return "TR";
    }
  }

  function persistLanguage(code) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch (_error) {
      // Ignore.
    }
  }

  function closeLanguageMenu(container) {
    if (!container) {
      return;
    }

    clearHoverCloseTimer(container);

    const menu = container.querySelector("[data-lang-menu]");
    const trigger = container.querySelector("[data-lang-trigger]");
    if (menu) {
      menu.hidden = true;
    }
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
    }
    container.classList.remove("is-open");
  }

  function closeAllLanguageMenus() {
    const containers = [...document.querySelectorAll("[data-lang-switch]")];
    containers.forEach((container) => {
      closeLanguageMenu(container);
    });
  }

  function openLanguageMenu(container) {
    if (!container) {
      return;
    }

    clearHoverCloseTimer(container);

    const menu = container.querySelector("[data-lang-menu]");
    const trigger = container.querySelector("[data-lang-trigger]");
    if (!menu || !trigger) {
      return;
    }

    closeAllLanguageMenus();
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    container.classList.add("is-open");
  }

  function applyLanguage(code, persist = true) {
    const selectedCode = isKnownLanguage(code) ? code : "TR";
    document.documentElement.lang = LANGUAGE_OPTIONS[selectedCode].htmlLang;
    window.NEREDEYENIR_CURRENT_LANGUAGE = selectedCode;

    const switches = [...document.querySelectorAll("[data-lang-switch]")];
    switches.forEach((container) => {
      const current = container.querySelector("[data-lang-current]");
      if (current) {
        current.textContent = selectedCode;
      }

      const options = [...container.querySelectorAll("[data-lang-option]")];
      options.forEach((option) => {
        const optionCode = String(option.dataset.langOption || "").toUpperCase();
        const isActive = optionCode === selectedCode;
        option.classList.toggle("active", isActive);
        option.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });

    if (persist) {
      persistLanguage(selectedCode);
    }

    document.dispatchEvent(
      new CustomEvent("neredeyenir:languagechange", {
        detail: { language: selectedCode },
      }),
    );
  }

  function initializeLanguageSwitcher() {
    const switches = [...document.querySelectorAll("[data-lang-switch]")];
    applyLanguage(readStoredLanguage(), false);

    if (switches.length === 0) {
      return;
    }

    switches.forEach((container) => {
      const trigger = container.querySelector("[data-lang-trigger]");
      const menu = container.querySelector("[data-lang-menu]");
      const options = [...container.querySelectorAll("[data-lang-option]")];

      if (!trigger || !menu || options.length === 0) {
        return;
      }

      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (menu.hidden) {
          openLanguageMenu(container);
          return;
        }

        closeLanguageMenu(container);
      });

      container.addEventListener("mouseenter", () => {
        clearHoverCloseTimer(container);
        openLanguageMenu(container);
      });

      container.addEventListener("mouseleave", () => {
        scheduleHoverClose(container);
      });

      menu.addEventListener("mouseenter", () => {
        clearHoverCloseTimer(container);
      });

      trigger.addEventListener("focus", () => {
        openLanguageMenu(container);
      });

      container.addEventListener("focusout", (event) => {
        const nextFocus = event.relatedTarget;
        if (nextFocus && container.contains(nextFocus)) {
          return;
        }

        closeLanguageMenu(container);
      });

      options.forEach((option) => {
        option.addEventListener("click", () => {
          const selected = String(option.dataset.langOption || "").toUpperCase();
          applyLanguage(selected, true);
          closeLanguageMenu(container);
        });
      });
    });

    document.addEventListener("click", (event) => {
      if (event.target && event.target.closest("[data-lang-switch]")) {
        return;
      }
      closeAllLanguageMenus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllLanguageMenus();
      }
    });
  }

  window.NEREDEYENIR_GET_LANGUAGE = () => {
    const code = String(window.NEREDEYENIR_CURRENT_LANGUAGE || "").toUpperCase();
    if (isKnownLanguage(code)) {
      return code;
    }

    return readStoredLanguage();
  };

  initializeLanguageSwitcher();

  const form = document.querySelector(".header-search");
  if (!form) {
    return;
  }

  const input = form.querySelector(".header-search-input");
  const submitButton = form.querySelector(".header-search-btn");
  if (!input || !submitButton) {
    return;
  }

  const inputLabel = form.querySelector('label[for="headerSearchInput"]');

  function applySearchUiLanguage() {
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();

    const buttonText = SEARCH_BUTTON_TEXT[lang] || SEARCH_BUTTON_TEXT.TR;
    const placeholderText = SEARCH_PLACEHOLDER_TEXT[lang] || SEARCH_PLACEHOLDER_TEXT.TR;
    const formAriaText = SEARCH_FORM_ARIA_TEXT[lang] || SEARCH_FORM_ARIA_TEXT.TR;
    const inputLabelText = SEARCH_INPUT_LABEL_TEXT[lang] || SEARCH_INPUT_LABEL_TEXT.TR;

    form.setAttribute("aria-label", formAriaText);
    input.setAttribute("placeholder", placeholderText);
    submitButton.textContent = buttonText.idle;

    if (inputLabel) {
      inputLabel.textContent = inputLabelText;
    }
  }

  applySearchUiLanguage();
  document.addEventListener("neredeyenir:languagechange", () => {
    applySearchUiLanguage();
  });

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
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();
    const labels = SEARCH_BUTTON_TEXT[lang] || SEARCH_BUTTON_TEXT.TR;
    input.disabled = isLoading;
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? labels.loading : labels.idle;
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
