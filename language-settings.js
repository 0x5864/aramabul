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
    ZH: { htmlLang: "zh" },
  };
  const LANGUAGE_SAVE_MESSAGES = {
    TR: "{code} seçildi.",
    EN: "{code} selected.",
    DE: "{code} ausgewählt.",
    RU: "Выбран язык {code}.",
    ZH: "已选择 {code}。",
  };

  const settingsAvatar = document.querySelector("#settingsAvatar");
  const settingsName = document.querySelector("#settingsName");
  const settingsHandle = document.querySelector("#settingsHandle");
  const settingsSignOutBtn = document.querySelector("#settingsSignOutBtn");
  const languageButtons = [...document.querySelectorAll("[data-language-choice]")];
  const headingLink = document.querySelector(".settings-home-link");
  const saveMessage = document.querySelector("#languageSaveMessage");
  const feedbackForm = document.querySelector("#settingsFeedbackForm");
  const feedbackName = document.querySelector("#settingsFeedbackName");
  const feedbackEmail = document.querySelector("#settingsFeedbackEmail");
  const feedbackSubject = document.querySelector("#settingsFeedbackSubject");
  const feedbackPhoneAreaCode = document.querySelector("#settingsFeedbackPhoneAreaCode");
  const feedbackPhoneNumber = document.querySelector("#settingsFeedbackPhoneNumber");
  const feedbackMessage = document.querySelector("#settingsFeedbackMessage");
  const feedbackStatus = document.querySelector("#settingsFeedbackStatus");
  const panelButtons = [...document.querySelectorAll("[data-settings-panel-trigger]")];
  const panels = [...document.querySelectorAll("[data-settings-panel]")];
  const settingsSidebarCard = document.querySelector(".settings-sidebar-card");
  const settingsPanelStack = document.querySelector(".settings-panel-stack");
  const FEEDBACK_TARGETS = Object.freeze({
    destek: {
      address: "destek@aramabul.com",
      subject: "Genel Konular",
    },
    ortaklik: {
      address: "ortaklik@aramabul.com",
      subject: "İş Birliği Talebi",
    },
    icerik: {
      address: "icerik@aramabul.com",
      subject: "İçerik Düzeltmeleri",
    },
  });

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

  function translateUi(text) {
    const i18n = window.ARAMABUL_HEADER_I18N;
    const source = String(text || "");
    if (i18n && typeof i18n.getStaticUiTranslation === "function") {
      const lang = typeof window.ARAMABUL_GET_LANGUAGE === "function" ? window.ARAMABUL_GET_LANGUAGE() : "TR";
      return i18n.getStaticUiTranslation(source, lang);
    }
    return source;
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
    const userEmail = session?.email || "";
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
      settingsSignOutBtn.textContent = session ? translateUi("Çıkış yap") : translateUi("Çıkış için giriş yap");
    }
    if (feedbackName instanceof HTMLInputElement && !feedbackName.value.trim()) {
      feedbackName.value = session ? userName : "";
    }
    if (feedbackEmail instanceof HTMLInputElement && !feedbackEmail.value.trim()) {
      feedbackEmail.value = userEmail;
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

  function setFeedbackStatus(text, isError = false) {
    if (feedbackStatus) {
      feedbackStatus.textContent = text;
      feedbackStatus.classList.toggle("is-ok", !isError && Boolean(text));
    }
  }

  function activatePanel(panelKey) {
    const nextPanel = panelKey === "feedback" || panelKey === "help" || panelKey === "about" ? panelKey : "language";

    panelButtons.forEach((button) => {
      const key = String(button.dataset.settingsPanelTrigger || "");
      const isActive = key === nextPanel;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    panels.forEach((panel) => {
      panel.hidden = String(panel.dataset.settingsPanel || "") !== nextPanel;
    });
  }

  function shouldForceMobileLayout() {
    const screenWidth = Number(window.screen?.width || 0);
    const screenHeight = Number(window.screen?.height || 0);
    const screenMin = Math.min(screenWidth, screenHeight);
    const viewportWidth = Number(window.innerWidth || document.documentElement.clientWidth || 0);
    const isLikelyPhone = screenMin > 0 && screenMin <= 540;
    const isDesktopScaledViewport = viewportWidth >= 700;
    return isLikelyPhone && isDesktopScaledViewport;
  }

  function applyForcedMobileLayoutClass() {
    if (!(settingsSidebarCard || settingsPanelStack)) {
      return;
    }
    document.body.classList.toggle("settings-force-mobile", shouldForceMobileLayout());
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

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = String(feedbackName instanceof HTMLInputElement ? feedbackName.value : "").trim();
      const email = normalizeEmail(feedbackEmail instanceof HTMLInputElement ? feedbackEmail.value : "");
      const subject = String(feedbackSubject instanceof HTMLSelectElement ? feedbackSubject.value : "").trim();
      const areaCode = String(feedbackPhoneAreaCode instanceof HTMLInputElement ? feedbackPhoneAreaCode.value : "").trim();
      const phoneNumber = String(feedbackPhoneNumber instanceof HTMLInputElement ? feedbackPhoneNumber.value : "").trim();
      const message = String(feedbackMessage instanceof HTMLTextAreaElement ? feedbackMessage.value : "").trim();
      const selectedTarget = FEEDBACK_TARGETS[subject];

      if (!name || !email || !selectedTarget || !message) {
        if (feedbackForm instanceof HTMLFormElement) {
          feedbackForm.reportValidity();
        }
        setFeedbackStatus(translateUi("Lütfen ad, e-posta, konu ve mesaj alanlarını doldur."), true);
        return;
      }

      const messageLines = [
        `Ad Soyad: ${name}`,
        `E-posta: ${email}`,
      ];

      if (areaCode || phoneNumber) {
        messageLines.push(`Telefon: +90 ${areaCode} ${phoneNumber}`.trim());
      }

      messageLines.push("", message);

      const mailtoHref =
        `mailto:${selectedTarget.address}`
        + `?subject=${encodeURIComponent(translateUi(selectedTarget.subject))}`
        + `&body=${encodeURIComponent(messageLines.join("\n"))}`;

      setFeedbackStatus(translateUi("Mesajın seçilen konuya göre hazırlandı."));
      window.location.href = mailtoHref;
    });
  }

  panelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = String(button.dataset.settingsPanelTrigger || "");
      activatePanel(key);
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
  applyForcedMobileLayoutClass();
  renderSessionSummary();
  activatePanel("language");

  window.addEventListener("resize", applyForcedMobileLayoutClass, { passive: true });
  window.addEventListener("orientationchange", applyForcedMobileLayoutClass);

  document.addEventListener("aramabul:authchange", () => {
    renderSessionSummary();
  });
})();
