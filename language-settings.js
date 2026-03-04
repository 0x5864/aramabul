(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const AUTH_SESSION_KEY = runtime.storageKeys.authSession;
  const LANG_STORAGE_KEY = runtime.storageKeys.language;
  const THEME_STORAGE_KEY = runtime.storageKeys.theme;
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

  const settingsAvatar = document.querySelector("#settingsAvatar");
  const settingsName = document.querySelector("#settingsName");
  const settingsHandle = document.querySelector("#settingsHandle");
  const settingsSignOutBtn = document.querySelector("#settingsSignOutBtn");
  const languageButtons = [...document.querySelectorAll("[data-language-choice]")];
  const headingLink = document.querySelector(".settings-home-link");
  const saveMessage = document.querySelector("#languageSaveMessage");

  function readStorageValue(key) {
    return runtime.readStorageValue(key);
  }

  function writeStorageValue(key, value) {
    runtime.writeStorageValue(key, value);
  }

  function removeStorageValue(key) {
    runtime.removeStorageValue(key);
  }

  function dispatchCompatEvent(name, detail = {}) {
    runtime.dispatch(name, detail);
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLocaleLowerCase("en-US");
  }

  function readLanguage() {
    try {
      const raw = String(readStorageValue(LANG_STORAGE_KEY) || "").trim().toUpperCase();
      return LANGUAGE_META[raw] ? raw : "TR";
    } catch (_error) {
      return "TR";
    }
  }

  function readTheme() {
    try {
      const raw = String(readStorageValue(THEME_STORAGE_KEY) || "").trim().toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function readSession() {
    try {
      const raw = readStorageValue(AUTH_SESSION_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const name = String(parsed.name || "").trim();
      const email = normalizeEmail(parsed.email);
      if (!name || !email) {
        return null;
      }

      return { name, email };
    } catch (_error) {
      return null;
    }
  }

  function toHandleText(session) {
    if (!session?.email) {
      return "@giris-yapilmadi";
    }

    const raw = session.email.split("@")[0] || session.email;
    const slug = raw
      .toLocaleLowerCase("tr")
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `@${slug || "kullanici"}.aramabul`;
  }

  function renderSessionSummary() {
    const session = readSession();
    const userName = session?.name || "Misafir";
    const initial = userName.charAt(0).toLocaleUpperCase("tr") || "M";

    if (settingsAvatar) {
      settingsAvatar.textContent = initial;
    }
    if (settingsName) {
      settingsName.textContent = userName;
    }
    if (settingsHandle) {
      settingsHandle.textContent = toHandleText(session);
    }
    if (settingsSignOutBtn instanceof HTMLButtonElement) {
      settingsSignOutBtn.disabled = !session;
      settingsSignOutBtn.textContent = session ? "Çıkış yap" : "Çıkış için giriş yap";
    }
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
    window.ARAMABUL_CURRENT_LANGUAGE = selectedCode;

    if (persist) {
      writeStorageValue(LANG_STORAGE_KEY, selectedCode);
    }

    languageButtons.forEach((button) => {
      const optionCode = String(button.dataset.languageChoice || "").toUpperCase();
      const isActive = optionCode === selectedCode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    dispatchCompatEvent("aramabul:languagechange", { language: selectedCode });
  }

  if (headingLink) {
    headingLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.assign("index.html");
    });
  }

  if (settingsSignOutBtn) {
    settingsSignOutBtn.addEventListener("click", () => {
      const session = readSession();
      if (!session) {
        window.location.assign("index.html");
        return;
      }

      removeStorageValue(AUTH_SESSION_KEY);
      dispatchCompatEvent("aramabul:authchange");
      renderSessionSummary();
    });
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCode = String(button.dataset.languageChoice || "").toUpperCase();
      applyLanguage(selectedCode, true);
      setMessage(saveMessageText(selectedCode));
    });
  });

  if (typeof window.ARAMABUL_SET_THEME === "function") {
    window.ARAMABUL_SET_THEME(readTheme());
  } else {
    const theme = readTheme();
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");
    document.documentElement.setAttribute("data-theme", theme);
  }

  applyLanguage(readLanguage(), false);
  renderSessionSummary();

  document.addEventListener("aramabul:authchange", () => {
    renderSessionSummary();
  });
})();
