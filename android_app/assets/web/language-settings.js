(() => {
  const LANG_STORAGE_KEY = "neredeyenir.selectedLanguage.v1";
  const THEME_STORAGE_KEY = "neredeyenir.theme.v1";
  const LANGUAGE_META = {
    TR: { htmlLang: "tr" },
    EN: { htmlLang: "en" },
    DE: { htmlLang: "de" },
    RU: { htmlLang: "ru" },
  };
  const LANGUAGE_SAVE_MESSAGES = {
    TR: "{code} seçildi.",
    EN: "{code} selected.",
    DE: "{code} ausgewählt.",
    RU: "Выбран язык {code}.",
  };

  const languageButtons = [...document.querySelectorAll("[data-language-choice]")];
  const backButton = document.querySelector("#languageBackBtn");
  const headingLink = document.querySelector(".settings-home-link");
  const saveMessage = document.querySelector("#languageSaveMessage");

  function readLanguage() {
    try {
      const raw = String(window.localStorage.getItem(LANG_STORAGE_KEY) || "").trim().toUpperCase();
      return LANGUAGE_META[raw] ? raw : "TR";
    } catch (_error) {
      return "TR";
    }
  }

  function readTheme() {
    try {
      const raw = String(window.localStorage.getItem(THEME_STORAGE_KEY) || "").trim().toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function goBackToSettings() {
    window.location.assign("profile.html?action=profile");
  }

  function setMessage(text) {
    if (!saveMessage) {
      return;
    }
    saveMessage.textContent = text;
  }

  function saveMessageText(code) {
    const selectedCode = LANGUAGE_META[code] ? code : "TR";
    const template = LANGUAGE_SAVE_MESSAGES[selectedCode] || LANGUAGE_SAVE_MESSAGES.TR;
    return template.replace("{code}", selectedCode);
  }

  function applyLanguage(code, persist = true) {
    const selectedCode = LANGUAGE_META[code] ? code : "TR";
    document.documentElement.lang = LANGUAGE_META[selectedCode].htmlLang;
    window.NEREDEYENIR_CURRENT_LANGUAGE = selectedCode;

    if (persist) {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, selectedCode);
      } catch (_error) {
        // Ignore storage errors.
      }
    }

    languageButtons.forEach((button) => {
      const optionCode = String(button.dataset.languageChoice || "").toUpperCase();
      const isActive = optionCode === selectedCode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    document.dispatchEvent(
      new CustomEvent("neredeyenir:languagechange", {
        detail: { language: selectedCode },
      }),
    );
  }

  if (backButton) {
    backButton.addEventListener("click", goBackToSettings);
  }

  if (headingLink) {
    headingLink.addEventListener("click", (event) => {
      event.preventDefault();
      goBackToSettings();
    });
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCode = String(button.dataset.languageChoice || "").toUpperCase();
      applyLanguage(selectedCode, true);
      setMessage(saveMessageText(selectedCode));
    });
  });

  if (typeof window.NEREDEYENIR_SET_THEME === "function") {
    window.NEREDEYENIR_SET_THEME(readTheme());
  } else {
    const theme = readTheme();
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");
    document.documentElement.setAttribute("data-theme", theme);
  }

  applyLanguage(readLanguage(), false);
})();
