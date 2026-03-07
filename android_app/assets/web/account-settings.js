(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const AUTH_USERS_KEY = runtime.storageKeys.authUsers;
  const AUTH_SESSION_KEY = runtime.storageKeys.authSession;
  const THEME_STORAGE_KEY = runtime.storageKeys.theme;

  const accountAvatar = document.querySelector("#accountAvatar");
  const accountDisplayName = document.querySelector("#accountDisplayName");
  const accountDisplayHandle = document.querySelector("#accountDisplayHandle");
  const accountNameInput = document.querySelector("#accountNameInput");
  const accountEmailInput = document.querySelector("#accountEmailInput");
  const accountSettingsForm = document.querySelector("#accountSettingsForm");
  const accountSettingsMessage = document.querySelector("#accountSettingsMessage");
  const accountSaveBtn = document.querySelector("#accountSaveBtn");
  const accountSignupBtn = document.querySelector("#accountSignupBtn");
  const accountBackBtn = document.querySelector("#accountBackBtn");
  const accountHomeLink = document.querySelector(".settings-home-link");

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

  function readStorageValue(key) {
    return runtime.readStorageValue(key);
  }

  function writeStorageValue(key, value) {
    runtime.writeStorageValue(key, value);
  }

  function dispatchCompatEvent(name, detail = {}) {
    runtime.dispatch(name, detail);
  }

  function readTheme() {
    try {
      const raw = String(readStorageValue(THEME_STORAGE_KEY) || "").trim().toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    if (typeof window.ARAMABUL_SET_THEME === "function") {
      window.ARAMABUL_SET_THEME(nextTheme);
      return;
    }

    document.body.classList.toggle("theme-dark", nextTheme === "dark");
    document.body.classList.toggle("theme-light", nextTheme === "light");
    document.documentElement.setAttribute("data-theme", nextTheme);
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
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (user) =>
          user &&
          typeof user === "object" &&
          typeof user.name === "string" &&
          typeof user.email === "string" &&
          typeof user.passwordHash === "string",
      );
    } catch (_error) {
      return [];
    }
  }

  function writeUsers(users) {
    const safeUsers = Array.isArray(users)
      ? users.filter(
          (user) =>
            user &&
            typeof user === "object" &&
            typeof user.name === "string" &&
            typeof user.email === "string" &&
            typeof user.passwordHash === "string",
        )
      : [];
    writeStorageValue(AUTH_USERS_KEY, JSON.stringify(safeUsers));
  }

  function writeSession(session) {
    writeStorageValue(AUTH_SESSION_KEY, JSON.stringify(session));
    dispatchCompatEvent("aramabul:authchange");
  }

  function toHandleText(session) {
    if (!session?.email) {
      return "@giriş-yapılmadı";
    }

    const raw = session.email.split("@")[0] || session.email;
    const slug = raw
      .toLocaleLowerCase("tr")
      .replace(/[^a-z0-9._-çğıöşü]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `@${slug || "kullanıcı"}.aramabul`;
  }

  function goToSettings() {
    window.location.assign("profile.html?action=profile");
  }

  function goToSignup() {
    window.location.assign("profile.html?action=signup");
  }

  function setMessage(text, isError = false) {
    if (!accountSettingsMessage) {
      return;
    }
    accountSettingsMessage.textContent = text;
    accountSettingsMessage.classList.toggle("is-ok", !isError);
  }

  function renderAccount() {
    const session = readSession();
    const userName = session?.name || "Misafir";
    const userEmail = session?.email || "";
    const initial = userName.charAt(0).toLocaleUpperCase("tr") || "M";

    if (accountAvatar) {
      accountAvatar.textContent = initial;
    }
    if (accountDisplayName) {
      accountDisplayName.textContent = userName;
    }
    if (accountDisplayHandle) {
      accountDisplayHandle.textContent = toHandleText(session);
    }
    if (accountNameInput) {
      accountNameInput.value = userName === "Misafir" ? "" : userName;
      accountNameInput.disabled = !session;
    }
    if (accountEmailInput) {
      accountEmailInput.value = userEmail;
      accountEmailInput.disabled = !session;
    }
    if (accountSaveBtn instanceof HTMLButtonElement) {
      accountSaveBtn.disabled = !session;
    }
    if (accountSignupBtn instanceof HTMLButtonElement) {
      accountSignupBtn.hidden = Boolean(session);
    }
    if (!session) {
      setMessage(translateUi("Kayıtlı oturum yok. Önce kayıt ol."));
      return;
    }

    setMessage("");
  }

  if (accountBackBtn) {
    accountBackBtn.addEventListener("click", goToSettings);
  }

  if (accountHomeLink) {
    accountHomeLink.addEventListener("click", (event) => {
      event.preventDefault();
      goToSettings();
    });
  }

  if (accountSignupBtn) {
    accountSignupBtn.addEventListener("click", goToSignup);
  }

  if (accountSettingsForm) {
    accountSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const currentSession = readSession();
      if (!currentSession) {
        goToSignup();
        return;
      }

      const name = String(accountNameInput instanceof HTMLInputElement ? accountNameInput.value : "").trim().slice(0, 40);
      const email = normalizeEmail(accountEmailInput instanceof HTMLInputElement ? accountEmailInput.value : "");

      if (name.length < 2) {
        setMessage(translateUi("Ad soyad en az 2 karakter olmalı."), true);
        return;
      }

      if (!email.includes("@") || email.length < 6) {
        setMessage(translateUi("Geçerli bir e-posta gir."), true);
        return;
      }

      const users = readUsers();
      const currentEmail = normalizeEmail(currentSession.email);
      const currentName = String(currentSession.name || "").trim();
      const exactUser = users.find((user) => normalizeEmail(user.email) === currentEmail) || null;
      const byNameCandidates = users.filter((user) => String(user.name || "").trim() === currentName);
      const fallbackUser = !exactUser && byNameCandidates.length === 1 ? byNameCandidates[0] : null;
      const sourceUser = exactUser || fallbackUser;
      const sourceEmail = sourceUser ? normalizeEmail(sourceUser.email) : currentEmail;

      if (!sourceUser) {
        setMessage(translateUi("Hesap güvenliği doğrulanamadı. Lütfen çıkış yapıp yeniden giriş yap."), true);
        return;
      }

      const duplicate = users.some((user) => {
        const userEmail = normalizeEmail(user.email);
        return userEmail === email && userEmail !== sourceEmail;
      });

      if (duplicate) {
        setMessage(translateUi("Bu e-posta başka bir hesapta kayıtlı."), true);
        return;
      }

      const nextUsers = users.map((user) => {
        const userEmail = normalizeEmail(user.email);
        if (userEmail !== sourceEmail) {
          return user;
        }

        return {
          ...user,
          name,
          email,
          passwordHash: sourceUser.passwordHash,
        };
      });

      if (!nextUsers.some((user) => normalizeEmail(user.email) === email)) {
        nextUsers.push({ name, email, passwordHash: sourceUser.passwordHash });
      }

      writeUsers(nextUsers);
      writeSession({ name, email });
      renderAccount();
      setMessage(translateUi("Hesap bilgileri kaydedildi."));
    });
  }

  applyTheme(readTheme());
  renderAccount();

  const syncAccount = () => {
    renderAccount();
  };
  document.addEventListener("aramabul:authchange", syncAccount);
})();
