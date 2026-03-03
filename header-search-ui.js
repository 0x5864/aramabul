(() => {
  const SEARCH_BUTTON_TEXT = {
    TR: { idle: "Bul", loading: "Bulunuyor..." },
    EN: { idle: "Find", loading: "Finding..." },
    RU: { idle: "Найти", loading: "Поиск..." },
    DE: { idle: "Finden", loading: "Suche..." },
    ZH: { idle: "查找", loading: "查找中..." },
  };
  const SEARCH_PAGE_BUTTON_TEXT = {
    TR: { idle: "Bul", loading: "Bulunuyor..." },
    EN: { idle: "Find", loading: "Finding..." },
    RU: { idle: "Найти", loading: "Поиск..." },
    DE: { idle: "Finden", loading: "Suche..." },
    ZH: { idle: "查找", loading: "查找中..." },
  };
  const SEARCH_PLACEHOLDER_TEXT = {
    TR: "Ne bulmamı istersin?",
    EN: "What should I find?",
    RU: "Что мне найти?",
    DE: "Was soll ich finden?",
    ZH: "你想让我找什么？",
  };
  const SEARCH_PAGE_PLACEHOLDER_TEXT = {
    TR: "Ne bulmamı istersin?",
    EN: "What should I find?",
    RU: "Что мне найти?",
    DE: "Was soll ich finden?",
    ZH: "你想让我找什么？",
  };
  const SEARCH_FORM_ARIA_TEXT = {
    TR: "Genel arama",
    EN: "General search",
    RU: "Общий поиск",
    DE: "Allgemeine Suche",
    ZH: "通用搜索",
  };
  const SEARCH_INPUT_LABEL_TEXT = {
    TR: "Arama ifadesi",
    EN: "Search query",
    RU: "Поисковый запрос",
    DE: "Suchbegriff",
    ZH: "搜索关键词",
  };
  const SEARCH_PAGE_INPUT_LABEL_TEXT = {
    TR: "Arama ifadesi",
    EN: "Search query",
    RU: "Поисковый запрос",
    DE: "Suchbegriff",
    ZH: "搜索关键词",
  };

  function resolveLanguage(readStoredLanguage) {
    if (typeof window.ARAMABUL_GET_LANGUAGE === "function") {
      return window.ARAMABUL_GET_LANGUAGE();
    }

    if (typeof readStoredLanguage === "function") {
      return readStoredLanguage();
    }

    return "TR";
  }

  function resolveLabels(options = {}) {
    const { currentPageName, readStoredLanguage } = options;
    const lang = resolveLanguage(readStoredLanguage);
    const isSearchPage = typeof currentPageName === "function" && currentPageName() === "search.html";

    return {
      buttonText: isSearchPage
        ? SEARCH_PAGE_BUTTON_TEXT[lang] || SEARCH_PAGE_BUTTON_TEXT.TR
        : SEARCH_BUTTON_TEXT[lang] || SEARCH_BUTTON_TEXT.TR,
      placeholderText: isSearchPage
        ? SEARCH_PAGE_PLACEHOLDER_TEXT[lang] || SEARCH_PAGE_PLACEHOLDER_TEXT.TR
        : SEARCH_PLACEHOLDER_TEXT[lang] || SEARCH_PLACEHOLDER_TEXT.TR,
      formAriaText: SEARCH_FORM_ARIA_TEXT[lang] || SEARCH_FORM_ARIA_TEXT.TR,
      inputLabelText: isSearchPage
        ? SEARCH_PAGE_INPUT_LABEL_TEXT[lang] || SEARCH_PAGE_INPUT_LABEL_TEXT.TR
        : SEARCH_INPUT_LABEL_TEXT[lang] || SEARCH_INPUT_LABEL_TEXT.TR,
    };
  }

  function applySearchUiLanguage(options = {}) {
    const {
      currentPageName,
      form,
      input,
      inputLabel,
      setSubmitButtonLabel,
      readStoredLanguage,
    } = options;

    if (
      typeof currentPageName !== "function" ||
      !(form instanceof HTMLElement) ||
      !(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) ||
      typeof setSubmitButtonLabel !== "function"
    ) {
      return;
    }

    const labels = resolveLabels({ currentPageName, readStoredLanguage });
    form.setAttribute("aria-label", labels.formAriaText);
    input.setAttribute("placeholder", labels.placeholderText);
    setSubmitButtonLabel(labels.buttonText.idle);

    if (inputLabel instanceof HTMLElement) {
      inputLabel.textContent = labels.inputLabelText;
    }
  }

  function setLoadingState(options = {}) {
    const {
      currentPageName,
      input,
      submitButton,
      setSubmitButtonLabel,
      readStoredLanguage,
      isLoading,
    } = options;

    if (
      typeof currentPageName !== "function" ||
      !(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) ||
      !(submitButton instanceof HTMLButtonElement) ||
      typeof setSubmitButtonLabel !== "function"
    ) {
      return;
    }

    const labels = resolveLabels({ currentPageName, readStoredLanguage });
    input.disabled = Boolean(isLoading);
    submitButton.disabled = Boolean(isLoading);
    setSubmitButtonLabel(isLoading ? labels.buttonText.loading : labels.buttonText.idle);
  }

  window.ARAMABUL_HEADER_SEARCH_UI = {
    applySearchUiLanguage,
    setLoadingState,
  };
})();
