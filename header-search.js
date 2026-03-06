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

  initializeLanguageSwitcher();
  applyTheme(readStoredTheme(), false);
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

    let noticeNode = footer.querySelector(".yr-footer-coming-soon");
    const ensureNotice = () => {
      if (noticeNode instanceof HTMLElement) {
        return noticeNode;
      }

      noticeNode = document.createElement("p");
      noticeNode.className = "yr-footer-coming-soon";
      noticeNode.hidden = true;
      noticeNode.textContent = "Yakında hizmete girecektir.";
      noticeNode.style.margin = "8px 0 0";
      noticeNode.style.fontSize = "12px";
      noticeNode.style.color = "#d7e3ff";

      const footerBottom = footer.querySelector(".yr-footer-bottom");
      if (footerBottom instanceof HTMLElement) {
        footerBottom.append(noticeNode);
      } else {
        footer.append(noticeNode);
      }
      return noticeNode;
    };

    const showNotice = () => {
      const node = ensureNotice();
      node.hidden = false;
      const activeTimer = Number.parseInt(String(node.dataset.timerId || ""), 10);
      if (Number.isFinite(activeTimer)) {
        window.clearTimeout(activeTimer);
      }
      const timerId = window.setTimeout(() => {
        node.hidden = true;
        node.dataset.timerId = "";
      }, 2800);
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
        window.alert("Aradığınız kayda ulaşılamamıştır.");
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
