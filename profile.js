(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const AUTH_USERS_KEY = runtime.storageKeys.authUsers;
  const AUTH_SESSION_KEY = runtime.storageKeys.authSession;
  const THEME_STORAGE_KEY = runtime.storageKeys.theme;

  const settingsAvatar = document.querySelector("#settingsAvatar");
  const settingsName = document.querySelector("#settingsName");
  const settingsHandle = document.querySelector("#settingsHandle");
  const settingsHomeLink = document.querySelector(".settings-home-link");
  const settingsSignOutBtn = document.querySelector("#settingsSignOutBtn");
  const accountSettingsForm = document.querySelector("#accountSettingsForm");
  const accountNameInput = document.querySelector("#accountNameInput");
  const accountEmailInput = document.querySelector("#accountEmailInput");
  const accountSettingsMessage = document.querySelector("#accountSettingsMessage");
  const accountSaveBtn = document.querySelector("#accountSaveBtn");
  const accountSignupBtn = document.querySelector("#accountSignupBtn");
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

  function readTheme() {
    try {
      const raw = String(readStorageValue(THEME_STORAGE_KEY) || "").trim().toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function applyTheme(theme, persist = true) {
    const nextTheme = theme === "light" ? "light" : "dark";
    if (typeof window.ARAMABUL_SET_THEME === "function") {
      window.ARAMABUL_SET_THEME(nextTheme);
      return;
    }

    document.body.classList.toggle("theme-dark", nextTheme === "dark");
    document.body.classList.toggle("theme-light", nextTheme === "light");
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (persist) {
      writeStorageValue(THEME_STORAGE_KEY, nextTheme);
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

  function readUsers() {
    try {
      const raw = readStorageValue(AUTH_USERS_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeUsers(users) {
    writeStorageValue(AUTH_USERS_KEY, JSON.stringify(users));
  }

  function writeSession(session) {
    writeStorageValue(AUTH_SESSION_KEY, JSON.stringify(session));
    dispatchCompatEvent("aramabul:authchange");
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

  function setAccountMessage(text, isError = false) {
    if (!accountSettingsMessage) {
      return;
    }
    accountSettingsMessage.textContent = text;
    accountSettingsMessage.classList.toggle("is-ok", !isError);
  }

  function openSignup() {
    if (window.ARAMABUL_AUTH_MODAL?.open) {
      window.ARAMABUL_AUTH_MODAL.open("signup", accountSignupBtn instanceof HTMLElement ? accountSignupBtn : null);
      return;
    }

    setAccountMessage("Kayıt ol penceresi yakında burada açılacak.", true);
  }

  function normalizeLegacySignupRoute() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "signup") {
      return;
    }

    window.history.replaceState({}, "", "profile.html?action=profile");
    openSignup();
  }

  function setFeedbackStatus(text) {
    if (feedbackStatus) {
      feedbackStatus.textContent = text;
      feedbackStatus.classList.toggle("is-ok", !text || text.startsWith("Mesajın "));
    }
  }

  function activatePanel(panelKey) {
    const nextPanel = panelKey === "feedback" || panelKey === "help" || panelKey === "about" ? panelKey : "account";

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

  function renderAccount() {
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
    if (accountNameInput instanceof HTMLInputElement) {
      accountNameInput.value = session ? userName : "";
      accountNameInput.disabled = !session;
    }
    if (accountEmailInput instanceof HTMLInputElement) {
      accountEmailInput.value = userEmail;
      accountEmailInput.disabled = !session;
    }
    if (accountSaveBtn instanceof HTMLButtonElement) {
      accountSaveBtn.disabled = !session;
    }
    if (accountSignupBtn instanceof HTMLButtonElement) {
      accountSignupBtn.hidden = Boolean(session);
    }
    if (settingsSignOutBtn instanceof HTMLButtonElement) {
      settingsSignOutBtn.disabled = !session;
      settingsSignOutBtn.textContent = session ? "Çıkış yap" : "Çıkış için giriş yap";
    }
    if (feedbackName instanceof HTMLInputElement && !feedbackName.value.trim()) {
      feedbackName.value = session ? userName : "";
    }
    if (feedbackEmail instanceof HTMLInputElement && !feedbackEmail.value.trim()) {
      feedbackEmail.value = userEmail;
    }

    if (!session) {
      setAccountMessage("Kayıtlı oturum yok. Önce kayıt ol.");
      return;
    }

    setAccountMessage("");
  }

  if (settingsHomeLink) {
    settingsHomeLink.addEventListener("click", (event) => {
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
      renderAccount();
    });
  }

  if (accountSignupBtn) {
    accountSignupBtn.addEventListener("click", () => {
      openSignup();
    });
  }

  if (accountSettingsForm) {
    accountSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const currentSession = readSession();
      if (!currentSession) {
        openSignup();
        return;
      }

      const name = String(accountNameInput instanceof HTMLInputElement ? accountNameInput.value : "").trim().slice(0, 40);
      const email = normalizeEmail(accountEmailInput instanceof HTMLInputElement ? accountEmailInput.value : "");

      if (name.length < 2) {
        setAccountMessage("Ad soyad en az 2 karakter olmalı.", true);
        return;
      }

      if (!email.includes("@") || email.length < 6) {
        setAccountMessage("Geçerli bir e-posta gir.", true);
        return;
      }

      const users = readUsers();
      const currentEmail = normalizeEmail(currentSession.email);
      const duplicate = users.some((user) => {
        if (!user || typeof user !== "object") {
          return false;
        }

        const userEmail = normalizeEmail(user.email);
        return userEmail === email && userEmail !== currentEmail;
      });

      if (duplicate) {
        setAccountMessage("Bu e-posta başka bir hesapta kayıtlı.", true);
        return;
      }

      const nextUsers = users.map((user) => {
        if (!user || typeof user !== "object") {
          return user;
        }

        const userEmail = normalizeEmail(user.email);
        if (userEmail !== currentEmail) {
          return user;
        }

        return {
          ...user,
          name,
          email,
        };
      });

      if (!nextUsers.some((user) => user && typeof user === "object" && normalizeEmail(user.email) === email)) {
        nextUsers.push({ name, email });
      }

      writeUsers(nextUsers);
      writeSession({ name, email });
      renderAccount();
      setAccountMessage("Hesap bilgileri kaydedildi.");
    });
  }

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
        setFeedbackStatus("Lütfen ad, e-posta, konu ve mesaj alanlarını doldur.");
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
        + `?subject=${encodeURIComponent(selectedTarget.subject)}`
        + `&body=${encodeURIComponent(messageLines.join("\n"))}`;

      setFeedbackStatus("Mesajın seçilen konuya göre hazırlandı.");
      window.location.href = mailtoHref;
    });
  }

  panelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = String(button.dataset.settingsPanelTrigger || "");
      activatePanel(key);
    });
  });

  applyTheme(readTheme(), false);
  renderAccount();
  normalizeLegacySignupRoute();
  activatePanel("account");

  document.addEventListener("aramabul:authchange", () => {
    renderAccount();
  });
})();
