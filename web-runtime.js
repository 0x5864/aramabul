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
  const structuredDataScriptIds = Object.freeze({
    organization: "aramabul-seo-organization",
    website: "aramabul-seo-website",
    breadcrumb: "aramabul-seo-breadcrumb",
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

  function toAbsoluteSeoUrl(rawHref) {
    const href = String(rawHref || "").trim();
    if (!href) {
      return "";
    }
    try {
      const baseUrl = `${canonicalOrigin()}${normalizePathname(window.location.pathname)}`;
      const resolved = new URL(href, baseUrl);
      if (resolved.pathname === "/index.html") {
        resolved.pathname = "/";
      }
      resolved.hash = "";
      return resolved.toString();
    } catch (_error) {
      return "";
    }
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

  function hasDynamicSeoContext(pathname) {
    return (
      pathname === "/city.html"
      || pathname === "/footer-page.html"
      || pathname.endsWith("-city.html")
      || pathname.endsWith("-district.html")
      || pathname.endsWith("-mekanlar.html")
    );
  }

  function readPageTitleLabel() {
    return String(document.title || "")
      .replace(/^aramabul\s*\|\s*/i, "")
      .trim();
  }

  function buildDynamicDescription(pathname) {
    const titleLabel = readPageTitleLabel();
    if (!titleLabel) {
      return "";
    }
    if (pathname.endsWith("-mekanlar.html")) {
      return `${titleLabel} için güncel mekan listesi, adres bilgileri ve konum bağlantılarını aramabul'da inceleyin.`;
    }
    if (pathname.endsWith("-district.html")) {
      return `${titleLabel} için ilçe bazlı alt kategori sayfaları ve mekan geçişlerini aramabul'da görüntüleyin.`;
    }
    if (pathname.endsWith("-city.html") || pathname === "/city.html") {
      return `${titleLabel} için il ve ilçe bazlı kategori listelerini aramabul'da keşfedin.`;
    }
    if (pathname === "/footer-page.html") {
      return `${titleLabel} sayfasındaki güncel bilgileri aramabul üzerinden okuyun.`;
    }
    return `${titleLabel} için güncel kategori ve mekan bilgilerini aramabul'da inceleyin.`;
  }

  function applyDynamicDescription(pathname) {
    const currentDescriptionNode = document.head.querySelector('meta[name="description"]');
    const currentDescription = currentDescriptionNode instanceof HTMLMetaElement
      ? String(currentDescriptionNode.getAttribute("content") || "").trim()
      : "";
    const nextDescription = buildDynamicDescription(pathname);
    if (!nextDescription) {
      return;
    }
    if (!currentDescription || hasDynamicSeoContext(pathname)) {
      upsertMetaByName("description", nextDescription);
    }
  }

  function upsertStructuredDataScript(scriptId, payload) {
    if (!scriptId) {
      return;
    }
    let node = document.getElementById(scriptId);
    if (!(node instanceof HTMLScriptElement)) {
      node = document.createElement("script");
      node.type = "application/ld+json";
      node.id = scriptId;
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(payload);
  }

  function removeStructuredDataScript(scriptId) {
    const node = document.getElementById(scriptId);
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  function applyOrganizationStructuredData() {
    upsertStructuredDataScript(structuredDataScriptIds.organization, {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "aramabul",
      url: `${canonicalOrigin()}/`,
      logo: toAbsoluteSeoUrl("/assets/fav.png?v=20260227"),
    });
  }

  function applyWebsiteStructuredData(pathname) {
    if (pathname !== "/") {
      removeStructuredDataScript(structuredDataScriptIds.website);
      return;
    }
    upsertStructuredDataScript(structuredDataScriptIds.website, {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "aramabul",
      url: `${canonicalOrigin()}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${canonicalOrigin()}/search.html?mekan={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }

  function collectBreadcrumbItems() {
    const container = document.querySelector(".global-topline-inner, .city-topline-inner");
    if (!(container instanceof HTMLElement)) {
      return [];
    }
    const rawNodes = [...container.querySelectorAll("a, span")];
    const canonicalCurrentUrl = buildCanonicalHref();
    const items = [];

    rawNodes.forEach((node) => {
      const name = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (!name || name === "/") {
        return;
      }
      let itemUrl = "";
      if (node.tagName === "A") {
        itemUrl = toAbsoluteSeoUrl(node.getAttribute("href"));
      } else {
        itemUrl = canonicalCurrentUrl;
      }
      if (items.length > 0 && items[items.length - 1].name === name) {
        return;
      }
      items.push({ name, item: itemUrl });
    });

    return items;
  }

  function applyBreadcrumbStructuredData(pathname) {
    if (pathname === "/") {
      removeStructuredDataScript(structuredDataScriptIds.breadcrumb);
      return;
    }
    const items = collectBreadcrumbItems();
    if (items.length < 2) {
      removeStructuredDataScript(structuredDataScriptIds.breadcrumb);
      return;
    }
    const itemListElement = items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item || buildCanonicalHref(),
    }));
    upsertStructuredDataScript(structuredDataScriptIds.breadcrumb, {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement,
    });
  }

  function applyStructuredData(pathname) {
    if (seoNoindexPaths.has(pathname)) {
      removeStructuredDataScript(structuredDataScriptIds.website);
      removeStructuredDataScript(structuredDataScriptIds.breadcrumb);
      return;
    }
    applyOrganizationStructuredData();
    applyWebsiteStructuredData(pathname);
    applyBreadcrumbStructuredData(pathname);
  }

  function applySeoDefaults() {
    if (!document.head) {
      return;
    }

    const pathname = normalizePathname(window.location.pathname);
    upsertCanonicalLink(buildCanonicalHref());

    const robotsValue = seoNoindexPaths.has(pathname) ? "noindex,nofollow" : "index,follow";
    upsertMetaByName("robots", robotsValue);
    applyDynamicDescription(pathname);
    applyStructuredData(pathname);
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
  window.addEventListener("pageshow", applySeoDefaults, { passive: true });
  const titleNode = document.head ? document.head.querySelector("title") : null;
  if (titleNode) {
    const titleObserver = new MutationObserver(() => {
      window.requestAnimationFrame(applySeoDefaults);
    });
    titleObserver.observe(titleNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
})();
