(() => {
  const headerState = window.ARAMABUL_HEADER_STATE;
  const headerI18n = window.ARAMABUL_HEADER_I18N;
  const headerNav = window.ARAMABUL_HEADER_NAV;
  const headerShell = window.ARAMABUL_HEADER_SHELL || { hideTopLayerForCategoryPages: () => {} };
  const headerSearchUi = window.ARAMABUL_HEADER_SEARCH_UI || {
    applySearchUiLanguage: () => {},
    setLoadingState: () => {},
  };
  const headerSearchData = window.ARAMABUL_HEADER_SEARCH_DATA;

  function readStoredLanguage() {
    return headerState.readStoredLanguage();
  }

  function readStoredTheme() {
    return headerState.readStoredTheme();
  }

  function applyTheme(theme, persist = true) {
    return headerState.applyTheme(theme, persist);
  }

  function initializeLanguageSwitcher() {
    return headerState.initializeLanguageSwitcher();
  }

  function applyStaticPageTranslations() {
    return headerI18n.applyStaticPageTranslations();
  }

  function normalizeFooterUi() {
    return headerI18n.normalizeFooterUi();
  }

  function markMobileChromeBrowser() {
    if (!(document.body instanceof HTMLElement) || typeof navigator === "undefined") {
      return;
    }

    const ua = String(navigator.userAgent || "");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const isChromeFamily = /Chrome|CriOS/i.test(ua);
    const isWebView = /\bwv\b|; wv\)|Version\/\d+(\.\d+)?[^)]*Chrome/i.test(ua);
    const isOtherBrowser = /EdgA|EdgiOS|OPR|SamsungBrowser|YaBrowser/i.test(ua);
    const isMobileChrome = isMobile && isChromeFamily && !isWebView && !isOtherBrowser;

    document.body.classList.toggle("mobile-chrome-browser", isMobileChrome);
  }

  applyTheme(readStoredTheme(), false);
  markMobileChromeBrowser();
  applyStaticPageTranslations();
  normalizeFooterUi();
  window.addEventListener("load", () => {
    applyStaticPageTranslations();
    normalizeFooterUi();
  });

  function initializeFooterComingSoonNotice() {
    const footer = document.querySelector(".yr-footer");
    if (!(footer instanceof HTMLElement)) {
      return;
    }

    const links = footer.querySelectorAll(".store-badge, .yr-footer-social a");
    if (!links.length) {
      return;
    }

    let toastNode = document.querySelector(".yr-coming-soon-toast");
    const ensureToast = () => {
      if (toastNode instanceof HTMLElement) {
        return toastNode;
      }

      toastNode = document.createElement("div");
      toastNode.className = "yr-coming-soon-toast";
      toastNode.textContent = "Yakında hizmete girecektir.";
      toastNode.setAttribute("role", "status");
      toastNode.setAttribute("aria-live", "polite");
      toastNode.style.position = "fixed";
      toastNode.style.left = "50%";
      toastNode.style.bottom = "24px";
      toastNode.style.transform = "translateX(-50%) translateY(12px)";
      toastNode.style.opacity = "0";
      toastNode.style.pointerEvents = "none";
      toastNode.style.zIndex = "9999";
      toastNode.style.padding = "10px 14px";
      toastNode.style.borderRadius = "10px";
      toastNode.style.background = "#ffffff";
      toastNode.style.color = "#3f3f3f";
      toastNode.style.fontSize = "12px";
      toastNode.style.fontWeight = "600";
      toastNode.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.28)";
      toastNode.style.transition = "opacity 180ms ease, transform 180ms ease";
      document.body.append(toastNode);
      return toastNode;
    };

    const showNotice = () => {
      const node = ensureToast();
      node.style.opacity = "1";
      node.style.transform = "translateX(-50%) translateY(0)";
      const activeTimer = Number.parseInt(String(node.dataset.timerId || ""), 10);
      if (Number.isFinite(activeTimer)) {
        window.clearTimeout(activeTimer);
      }
      const timerId = window.setTimeout(() => {
        node.style.opacity = "0";
        node.style.transform = "translateX(-50%) translateY(12px)";
        node.dataset.timerId = "";
      }, 1800);
      node.dataset.timerId = String(timerId);
    };

    links.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || link.dataset.comingSoonBound === "1") {
        return;
      }
      link.dataset.comingSoonBound = "1";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showNotice();
      });
    });
  }

  initializeFooterComingSoonNotice();

  const form = document.querySelector(".header-search");
  if (!form) {
    return;
  }

  const input = form.querySelector(".header-search-input");
  const submitButton = form.querySelector(".header-search-btn");
  if (!input || !submitButton) {
    return;
  }

  function setSubmitButtonLabel(label) {
    const labelNode = submitButton.querySelector(".header-search-btn-text");
    if (labelNode) {
      labelNode.textContent = label;
      return;
    }
    submitButton.textContent = label;
  }

  const inputLabel = form.querySelector('label[for="headerSearchInput"]');
  function currentPageName() {
    const raw = window.location.pathname.split("/").pop() || "index.html";
    return raw.toLocaleLowerCase("tr");
  }

  function hideTopLayerForCategoryPages() {
    return headerShell.hideTopLayerForCategoryPages({ currentPageName });
  }

  function getNavLabels() {
    return headerI18n.getBottomNavLabels();
  }

  function getDesktopAuthLabels() {
    return headerI18n.getDesktopAuthLabels();
  }

  function createDesktopAuthLinks() {
    return headerNav.createDesktopAuthLinks({ currentPageName, getDesktopAuthLabels });
  }

  function createMobileBottomNav() {
    return headerNav.createMobileBottomNav({ currentPageName, getNavLabels, input });
  }

  function applySearchUiLanguage() {
    return headerSearchUi.applySearchUiLanguage({
      currentPageName,
      form,
      input,
      inputLabel,
      setSubmitButtonLabel,
      readStoredLanguage,
    });
  }

  createDesktopAuthLinks();
  initializeLanguageSwitcher();
  applySearchUiLanguage();
  hideTopLayerForCategoryPages();
  createMobileBottomNav();
  document.addEventListener("aramabul:languagechange", () => {
    applySearchUiLanguage();
    applyStaticPageTranslations();
    window.requestAnimationFrame(() => {
      normalizeFooterUi();
    });
  });

  function setLoadingState(isLoading) {
    return headerSearchUi.setLoadingState({
      currentPageName,
      input,
      submitButton,
      setSubmitButtonLabel,
      readStoredLanguage,
      isLoading,
    });
  }

  const SEARCH_CHOICE_COPY = {
    TR: {
      title: "Birden fazla mekan bulundu",
      text: "Lutfen acmak istedigin yeri sec.",
      close: "Kapat",
      note: "En yakin kaydi secmek icin sehir ve ilce de yazabilirsin.",
    },
    EN: {
      title: "Multiple venues found",
      text: "Choose the venue you want to open.",
      close: "Close",
      note: "Add the city and district to narrow the result.",
    },
    RU: {
      title: "Naydeno neskolko mest",
      text: "Vyberite mesto dlya otkrytiya.",
      close: "Zakryt",
      note: "Dobavte gorod i rayon, chtoby suzit rezultat.",
    },
    DE: {
      title: "Mehrere Orte gefunden",
      text: "Wahle den Ort, den du offnen mochtest.",
      close: "Schliessen",
      note: "Mit Stadt und Bezirk wird das Ergebnis genauer.",
    },
    ZH: {
      title: "Found multiple places",
      text: "Choose the place you want to open.",
      close: "Close",
      note: "Add city and district for a more exact result.",
    },
  };

  const SEARCH_NOT_FOUND_COPY = {
    TR: "Kayıt bulunamamıştır.",
    EN: "No records found.",
    RU: "Запись не найдена.",
    DE: "Kein Eintrag gefunden.",
    ZH: "未找到记录。",
  };

  let searchChoiceModalApi = null;

  function currentLanguageCode() {
    if (typeof window.ARAMABUL_GET_LANGUAGE === "function") {
      return window.ARAMABUL_GET_LANGUAGE();
    }

    return readStoredLanguage();
  }

  function searchNotFoundMessage() {
    const lang = currentLanguageCode();
    return SEARCH_NOT_FOUND_COPY[lang] || SEARCH_NOT_FOUND_COPY.TR;
  }

  function searchChoiceCopy() {
    const lang = currentLanguageCode();
    return SEARCH_CHOICE_COPY[lang] || SEARCH_CHOICE_COPY.TR;
  }

  let searchNotFoundToastApi = null;

  function ensureSearchNotFoundToast() {
    if (searchNotFoundToastApi) {
      return searchNotFoundToastApi;
    }

    if (!document.body) {
      return null;
    }

    const toast = document.createElement("div");
    toast.className = "yr-search-not-found-toast";
    toast.textContent = "Aradığınız kayda ulaşılamamıştır.";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.top = "96px";
    toast.style.bottom = "auto";
    toast.style.transform = "translateX(-50%) translateY(10px)";
    toast.style.opacity = "0";
    toast.style.pointerEvents = "none";
    toast.style.zIndex = "10000";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "10px";
    toast.style.background = "#ffffff";
    toast.style.color = "#3f3f3f";
    toast.style.fontSize = "12px";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.22)";
    toast.style.transition = "opacity 180ms ease, transform 180ms ease";
    document.body.append(toast);

    const show = () => {
      const rect = form.getBoundingClientRect();
      toast.style.left = `${Math.round(rect.left + (rect.width / 2))}px`;
      toast.style.top = `${Math.round(rect.bottom + 10)}px`;
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
      const activeTimer = Number.parseInt(String(toast.dataset.timerId || ""), 10);
      if (Number.isFinite(activeTimer)) {
        window.clearTimeout(activeTimer);
      }
      const timerId = window.setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(10px)";
        toast.dataset.timerId = "";
      }, 1800);
      toast.dataset.timerId = String(timerId);
    };

    searchNotFoundToastApi = { show };
    return searchNotFoundToastApi;
  }

  function ensureSearchChoiceModal() {
    if (searchChoiceModalApi) {
      return searchChoiceModalApi;
    }

    if (!document.body) {
      return null;
    }

    const modal = document.createElement("section");
    modal.className = "search-choice-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <button class="search-choice-backdrop" type="button" aria-label="Close"></button>
      <article class="search-choice-panel" role="dialog" aria-modal="true" aria-labelledby="searchChoiceTitle">
        <header class="search-choice-head">
          <div class="search-choice-head-text">
            <h3 id="searchChoiceTitle" class="search-choice-title">Birden fazla mekan bulundu</h3>
            <p class="search-choice-text">Lutfen acmak istedigin yeri sec.</p>
          </div>
          <button class="search-choice-close" type="button">Kapat</button>
        </header>
        <div class="search-choice-list" role="list"></div>
        <p class="search-choice-note">En yakin kaydi secmek icin sehir ve ilce de yazabilirsin.</p>
      </article>
    `;

    const titleNode = modal.querySelector(".search-choice-title");
    const textNode = modal.querySelector(".search-choice-text");
    const listNode = modal.querySelector(".search-choice-list");
    const noteNode = modal.querySelector(".search-choice-note");
    const closeNode = modal.querySelector(".search-choice-close");
    const backdropNode = modal.querySelector(".search-choice-backdrop");

    const close = () => {
      modal.hidden = true;
      document.body.classList.remove("search-choice-open");
      if (listNode instanceof HTMLElement) {
        listNode.innerHTML = "";
      }
    };

    const open = (payload) => {
      const choices = Array.isArray(payload?.choices) ? payload.choices : [];
      if (!(listNode instanceof HTMLElement) || choices.length === 0) {
        return;
      }

      const copy = searchChoiceCopy();
      if (titleNode instanceof HTMLElement) {
        titleNode.textContent = copy.title;
      }
      if (textNode instanceof HTMLElement) {
        textNode.textContent = copy.text;
      }
      if (noteNode instanceof HTMLElement) {
        noteNode.textContent = copy.note;
      }
      if (closeNode instanceof HTMLButtonElement) {
        closeNode.textContent = copy.close;
        closeNode.setAttribute("aria-label", copy.close);
      }
      if (backdropNode instanceof HTMLButtonElement) {
        backdropNode.setAttribute("aria-label", copy.close);
      }

      listNode.innerHTML = "";
      choices.forEach((choice) => {
        const href = String(choice?.href || "").trim();
        if (!href) {
          return;
        }

        const option = document.createElement("button");
        option.type = "button";
        option.className = "search-choice-option";

        const title = document.createElement("span");
        title.className = "search-choice-option-title";
        title.textContent = String(choice?.title || "Mekan").trim() || "Mekan";

        const subtitle = document.createElement("span");
        subtitle.className = "search-choice-option-meta";
        subtitle.textContent = String(choice?.subtitle || "").trim();
        subtitle.hidden = !subtitle.textContent;

        option.append(title, subtitle);
        option.addEventListener("click", () => {
          close();
          window.location.assign(href);
        });
        listNode.append(option);
      });
      listNode.scrollTop = 0;

      if (!listNode.children.length) {
        return;
      }

      modal.hidden = false;
      document.body.classList.add("search-choice-open");
    };

    closeNode?.addEventListener("click", close);
    backdropNode?.addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        close();
      }
    });

    document.body.append(modal);
    searchChoiceModalApi = { open, close };
    return searchChoiceModalApi;
  }

  input.addEventListener("input", () => {
    input.setCustomValidity("");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    setLoadingState(true);

    try {
      const result = await headerSearchData.resolveQuery(query);
      if (result && typeof result === "object" && result.type === "choices") {
        ensureSearchChoiceModal()?.open(result);
        return;
      }

      if (result && typeof result === "object" && result.type === "not_found") {
        ensureSearchNotFoundToast()?.show();
        input.focus();
        return;
      }

      const targetUrl =
        typeof result === "string"
          ? result
          : result && typeof result === "object"
            ? String(result.href || "").trim()
            : "";
      if (targetUrl) {
        window.location.assign(targetUrl);
      }
    } finally {
      setLoadingState(false);
    }
  });
})();
