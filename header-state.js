(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const LANG_STORAGE_KEY = runtime.storageKeys.language;
  const THEME_STORAGE_KEY = runtime.storageKeys.theme;
  const LANGUAGE_OPTIONS = {
    TR: { htmlLang: "tr" },
    EN: { htmlLang: "en" },
    RU: { htmlLang: "ru" },
    DE: { htmlLang: "de" },
    ZH: { htmlLang: "zh" },
  };
  const DEFAULT_THEME = "dark";
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

  function isKnownLanguage(code) {
    return Boolean(code && Object.prototype.hasOwnProperty.call(LANGUAGE_OPTIONS, code));
  }

  function readStoredLanguage() {
    try {
      const raw = runtime.readStorageValue(LANG_STORAGE_KEY);
      const code = String(raw || "").trim().toUpperCase();
      return isKnownLanguage(code) ? code : "TR";
    } catch (_error) {
      return "TR";
    }
  }

  function normalizeTheme(value) {
    return runtime.normalizeTheme(value);
  }

  function readStoredTheme() {
    try {
      const raw = runtime.readStorageValue(THEME_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_THEME;
      }
      return normalizeTheme(raw);
    } catch (_error) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(theme, persist = true) {
    const normalized = normalizeTheme(theme);

    if (document.body) {
      document.body.classList.toggle("theme-dark", normalized === "dark");
      document.body.classList.toggle("theme-light", normalized === "light");
    }
    document.documentElement.setAttribute("data-theme", normalized);
    window.ARAMABUL_CURRENT_THEME = normalized;

    if (persist) {
      runtime.writeStorageValue(THEME_STORAGE_KEY, normalized);
    }

    runtime.dispatch("aramabul:themechange", { theme: normalized });
    return normalized;
  }

  function persistLanguage(code) {
    runtime.writeStorageValue(LANG_STORAGE_KEY, code);
  }

  function applyLanguage(code, persist = true) {
    const selectedCode = isKnownLanguage(code) ? code : "TR";
    document.documentElement.lang = LANGUAGE_OPTIONS[selectedCode].htmlLang;
    window.ARAMABUL_CURRENT_LANGUAGE = selectedCode;

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

    runtime.dispatch("aramabul:languagechange", { language: selectedCode });
    return selectedCode;
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

  window.ARAMABUL_GET_LANGUAGE = () => {
    const code = String(window.ARAMABUL_CURRENT_LANGUAGE || "").toUpperCase();
    if (isKnownLanguage(code)) {
      return code;
    }

    return readStoredLanguage();
  };

  window.ARAMABUL_GET_THEME = () => {
    return normalizeTheme(window.ARAMABUL_CURRENT_THEME || readStoredTheme());
  };

  window.ARAMABUL_SET_THEME = (theme) => {
    applyTheme(theme, true);
  };

  window.ARAMABUL_HEADER_STATE = {
    readStoredLanguage,
    readStoredTheme,
    normalizeTheme,
    applyTheme,
    initializeLanguageSwitcher,
  };
})();
