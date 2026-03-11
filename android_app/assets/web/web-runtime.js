(() => {
  const storageKeys = Object.freeze({
    language: "aramabul.selectedLanguage.v1",
    theme: "aramabul.theme.v1",
    authUsers: "aramabul.auth.users.v1",
    authSession: "aramabul.auth.session.v1",
    userCityCache: "aramabul.user.city.cache.v1",
  });
  const supportedLanguages = new Set(["TR", "EN", "RU", "DE", "ZH"]);
  const scriptLoadPromises = new Map();
  const languageHtmlMap = Object.freeze({
    TR: "tr",
    EN: "en",
    RU: "ru",
    DE: "de",
    ZH: "zh",
  });
  const seoNoindexPaths = new Set([
    "/ads-test.html",
    "/search.html",
    "/profile.html",
    "/account-settings.html",
    "/language-settings.html",
    "/feedback-settings.html",
    "/help-settings.html",
    "/about-settings.html",
    "/restaurant.html",
    "/verify-email.html",
  ]);
  const canonicalParamSources = Object.freeze({
    sayfa: ["sayfa", "page", "key"],
    tur: ["tur", "type"],
    sehir: ["sehir", "city"],
    ilce: ["ilce", "district"],
    tt: ["tt", "tesis", "facilityType"],
    il: ["il"],
    kategori: ["kategori"],
  });

  function normalizePathname(pathname) {
    const value = String(pathname || "/").trim() || "/";
    if (value === "/index.html") {
      return "/";
    }
    return value;
  }

  function canonicalOrigin() {
    const host = String(window.location.hostname || "").toLowerCase();
    if (host === "aramabul.com" || host === "www.aramabul.com") {
      return "https://aramabul.com";
    }
    return window.location.origin;
  }

  function canonicalParamKeysForPath(pathname) {
    const fileName = pathname.split("/").pop() || "";
    if (fileName === "footer-page.html") {
      return ["sayfa"];
    }
    if (fileName === "city.html") {
      return ["il", "ilce", "kategori"];
    }
    if (fileName.endsWith("-city.html")) {
      return ["tur", "sehir"];
    }
    if (fileName.endsWith("-district.html")) {
      return ["tur", "sehir", "ilce"];
    }
    if (fileName.endsWith("-mekanlar.html")) {
      return ["tur", "sehir", "ilce", "tt"];
    }
    return [];
  }

  function pickQueryValue(searchParams, canonicalKey) {
    const aliases = canonicalParamSources[canonicalKey] || [canonicalKey];
    for (const key of aliases) {
      const value = String(searchParams.get(key) || "").trim();
      if (value) {
        return value;
      }
    }
    return "";
  }

  function upsertMetaByName(name, content) {
    if (!name) {
      return;
    }
    let node = document.head.querySelector(`meta[name="${name}"]`);
    if (!(node instanceof HTMLMetaElement)) {
      node = document.createElement("meta");
      node.setAttribute("name", name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
  }

  function upsertCanonicalLink(href) {
    if (!href) {
      return;
    }
    let node = document.head.querySelector('link[rel="canonical"]');
    if (!(node instanceof HTMLLinkElement)) {
      node = document.createElement("link");
      node.setAttribute("rel", "canonical");
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
  }

  function buildCanonicalHref() {
    const pathname = normalizePathname(window.location.pathname);
    const searchParams = new URLSearchParams(window.location.search);
    const canonicalParams = new URLSearchParams();
    const allowedKeys = canonicalParamKeysForPath(pathname);

    allowedKeys.forEach((key) => {
      let value = pickQueryValue(searchParams, key);
      if (!value && pathname.endsWith("/footer-page.html") && key === "sayfa") {
        value = "hakkimizda";
      }
      if (value) {
        canonicalParams.set(key, value);
      }
    });

    const query = canonicalParams.toString();
    return `${canonicalOrigin()}${pathname}${query ? `?${query}` : ""}`;
  }

  function applySeoDefaults() {
    if (!document.head) {
      return;
    }

    const pathname = normalizePathname(window.location.pathname);
    upsertCanonicalLink(buildCanonicalHref());

    const robotsValue = seoNoindexPaths.has(pathname) ? "noindex,nofollow" : "index,follow";
    upsertMetaByName("robots", robotsValue);
  }

  function readStorageValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function writeStorageValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Ignore storage errors.
    }
  }

  function removeStorageValue(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_error) {
      // Ignore storage errors.
    }
  }

  function readJson(key, fallback = null) {
    try {
      const raw = readStorageValue(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    writeStorageValue(key, JSON.stringify(value));
  }

  function loadScriptOnce(src) {
    const normalizedSrc = String(src || "").trim();
    if (!normalizedSrc) {
      return Promise.reject(new Error("Script source is required."));
    }

    if (scriptLoadPromises.has(normalizedSrc)) {
      return scriptLoadPromises.get(normalizedSrc);
    }

    const existingScript = [...document.scripts].find((script) => {
      return script.getAttribute("src") === normalizedSrc;
    });

    if (existingScript) {
      const existingPromise = Promise.resolve(existingScript);
      scriptLoadPromises.set(normalizedSrc, existingPromise);
      return existingPromise;
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = normalizedSrc;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = () => {
        scriptLoadPromises.delete(normalizedSrc);
        reject(new Error("Failed to load script: " + normalizedSrc));
      };
      document.head.appendChild(script);
    });

    scriptLoadPromises.set(normalizedSrc, promise);
    return promise;
  }
  function dispatch(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function normalizeTheme(value) {
    const lowered = String(value || "").trim().toLowerCase();
    return lowered === "light" ? "light" : "dark";
  }

  function normalizeLanguage(value) {
    const code = String(value || "").trim().toUpperCase();
    return supportedLanguages.has(code) ? code : "TR";
  }

  function getStoredTheme() {
    return normalizeTheme(readStorageValue(storageKeys.theme));
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
      writeStorageValue(storageKeys.theme, normalized);
    }
    return normalized;
  }

  function getStoredLanguage() {
    return normalizeLanguage(readStorageValue(storageKeys.language));
  }

  function setStoredLanguage(code, persist = true) {
    const selected = normalizeLanguage(code);
    document.documentElement.lang = languageHtmlMap[selected] || "tr";
    window.ARAMABUL_CURRENT_LANGUAGE = selected;
    if (persist) {
      writeStorageValue(storageKeys.language, selected);
    }
    return selected;
  }

  function readAuthSession() {
    const payload = readJson(storageKeys.authSession, null);
    if (!payload || typeof payload !== "object") {
      return null;
    }
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    if (!name || !email) {
      return null;
    }
    return { name, email };
  }

  function writeAuthSession(session, emitEvent = true) {
    if (!session || typeof session !== "object") {
      return;
    }
    writeJson(storageKeys.authSession, {
      name: String(session.name || "").trim(),
      email: String(session.email || "").trim(),
    });
    if (emitEvent) {
      dispatch("aramabul:authchange");
    }
  }

  function clearAuthSession(emitEvent = true) {
    removeStorageValue(storageKeys.authSession);
    if (emitEvent) {
      dispatch("aramabul:authchange");
    }
  }

  function readAuthUsers() {
    const payload = readJson(storageKeys.authUsers, []);
    return Array.isArray(payload) ? payload : [];
  }

  function writeAuthUsers(users) {
    writeJson(storageKeys.authUsers, Array.isArray(users) ? users : []);
  }

  window.ARAMABUL_RUNTIME = {
    storageKeys,
    readStorageValue,
    writeStorageValue,
    removeStorageValue,
    readJson,
    writeJson,
    loadScriptOnce,
    dispatch,
    normalizeTheme,
    normalizeLanguage,
    getStoredTheme,
    applyTheme,
    getStoredLanguage,
    setStoredLanguage,
    readAuthSession,
    writeAuthSession,
    clearAuthSession,
    readAuthUsers,
    writeAuthUsers,
    applySeoDefaults,
  };

  applySeoDefaults();
})();
