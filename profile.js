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
  const accountEmailVerificationStatus = document.querySelector("#accountEmailVerificationStatus");
  const accountEmailVerifyBtn = document.querySelector("#accountEmailVerifyBtn");
  const accountSettingsMessage = document.querySelector("#accountSettingsMessage");
  const accountSaveBtn = document.querySelector("#accountSaveBtn");
  const accountSignupBtn = document.querySelector("#accountSignupBtn");
  const accountPasswordForm = document.querySelector("#accountPasswordForm");
  const accountCurrentPasswordInput = document.querySelector("#accountCurrentPasswordInput");
  const accountNewPasswordInput = document.querySelector("#accountNewPasswordInput");
  const accountNewPasswordRepeatInput = document.querySelector("#accountNewPasswordRepeatInput");
  const accountPasswordMessage = document.querySelector("#accountPasswordMessage");
  const accountPasswordSaveBtn = document.querySelector("#accountPasswordSaveBtn");
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
  const emailVerificationState = {
    email: "",
    verified: false,
    loading: false,
    sending: false,
    messageText: "",
    messageIsError: false,
  };
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

  async function hashPassword(password) {
    if (!window.crypto?.subtle) {
      return null;
    }

    const encoded = new TextEncoder().encode(String(password || ""));
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

  function setPasswordMessage(text, isError = false) {
    if (!accountPasswordMessage) {
      return;
    }
    accountPasswordMessage.textContent = text;
    accountPasswordMessage.classList.toggle("is-ok", !isError && Boolean(text));
  }

  function setVerificationMessage(text, isError = false) {
    if (!accountEmailVerificationStatus) {
      return;
    }
    accountEmailVerificationStatus.textContent = text;
    accountEmailVerificationStatus.classList.toggle("is-ok", !isError && Boolean(text));
  }

  function renderEmailVerification(session) {
    if (!(accountEmailVerifyBtn instanceof HTMLButtonElement)) {
      return;
    }

    if (!session?.email) {
      accountEmailVerifyBtn.disabled = true;
      accountEmailVerifyBtn.hidden = true;
      setVerificationMessage("");
      return;
    }

    accountEmailVerifyBtn.hidden = false;
    const inputEmail = normalizeEmail(accountEmailInput instanceof HTMLInputElement ? accountEmailInput.value : "");
    const sessionEmail = normalizeEmail(session.email);
    const hasUnsavedEmail = Boolean(inputEmail && inputEmail !== sessionEmail);

    if (hasUnsavedEmail) {
      accountEmailVerifyBtn.disabled = true;
      accountEmailVerifyBtn.textContent = translateUi("Önce kaydet");
      setVerificationMessage(translateUi("E-posta değişikliği için önce Kaydet'e bas."), false);
      return;
    }

    if (emailVerificationState.sending) {
      accountEmailVerifyBtn.disabled = true;
      accountEmailVerifyBtn.textContent = translateUi("Gönderiliyor...");
      setVerificationMessage(translateUi("Doğrulama e-postası gönderiliyor..."), false);
      return;
    }

    if (emailVerificationState.loading) {
      accountEmailVerifyBtn.disabled = true;
      accountEmailVerifyBtn.textContent = translateUi("Kontrol ediliyor...");
      setVerificationMessage(translateUi("Doğrulama durumu kontrol ediliyor..."), false);
      return;
    }

    if (emailVerificationState.verified && emailVerificationState.email === sessionEmail) {
      accountEmailVerifyBtn.disabled = true;
      accountEmailVerifyBtn.textContent = translateUi("Doğrulandı");
      setVerificationMessage(translateUi("E-posta adresin doğrulandı."), false);
      return;
    }

    if (emailVerificationState.messageText) {
      accountEmailVerifyBtn.disabled = false;
      accountEmailVerifyBtn.textContent = translateUi("Doğrulama e-postası gönder");
      setVerificationMessage(emailVerificationState.messageText, emailVerificationState.messageIsError);
      return;
    }

    accountEmailVerifyBtn.disabled = false;
    accountEmailVerifyBtn.textContent = translateUi("Doğrulama e-postası gönder");
    setVerificationMessage(translateUi("E-posta adresin henüz doğrulanmadı."), false);
  }

  function resolveSessionUser(users, session) {
    if (!Array.isArray(users) || !session) {
      return null;
    }

    const currentEmail = normalizeEmail(session.email);
    const currentName = String(session.name || "").trim();
    const exactUser = users.find((user) => normalizeEmail(user.email) === currentEmail) || null;
    const byNameCandidates = users.filter((user) => String(user.name || "").trim() === currentName);
    const fallbackUser = !exactUser && byNameCandidates.length === 1 ? byNameCandidates[0] : null;
    const sourceUser = exactUser || fallbackUser;
    const sourceEmail = sourceUser ? normalizeEmail(sourceUser.email) : currentEmail;

    if (!sourceUser) {
      return null;
    }

    return {
      sourceUser,
      sourceEmail,
      currentEmail,
      currentName,
    };
  }

  async function refreshEmailVerificationStatus(email, force = false) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      emailVerificationState.email = "";
      emailVerificationState.verified = false;
      emailVerificationState.loading = false;
      emailVerificationState.sending = false;
      emailVerificationState.messageText = "";
      emailVerificationState.messageIsError = false;
      renderEmailVerification(readSession());
      return;
    }

    if (
      !force
      && emailVerificationState.email === normalizedEmail
      && !emailVerificationState.loading
      && !emailVerificationState.sending
    ) {
      renderEmailVerification(readSession());
      return;
    }

    emailVerificationState.email = normalizedEmail;
    emailVerificationState.loading = true;
    emailVerificationState.messageText = "";
    emailVerificationState.messageIsError = false;
    renderEmailVerification(readSession());

    try {
      const response = await fetch(`/api/auth/email-verification/status?email=${encodeURIComponent(normalizedEmail)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("status_failed");
      }

      const payload = await response.json();
      emailVerificationState.verified = Boolean(payload?.ok && payload.verified);
      emailVerificationState.messageText = "";
      emailVerificationState.messageIsError = false;
    } catch (_error) {
      emailVerificationState.verified = false;
      emailVerificationState.messageText = translateUi("Doğrulama durumu alınamadı. Tekrar dene.");
      emailVerificationState.messageIsError = true;
    } finally {
      emailVerificationState.loading = false;
      renderEmailVerification(readSession());
    }
  }

  async function sendVerificationEmail() {
    const session = readSession();
    if (!session?.email) {
      openSignup();
      return;
    }

    const inputEmail = normalizeEmail(accountEmailInput instanceof HTMLInputElement ? accountEmailInput.value : "");
    const sessionEmail = normalizeEmail(session.email);
    if (inputEmail && inputEmail !== sessionEmail) {
      setVerificationMessage(translateUi("Önce e-posta değişikliğini kaydet."), true);
      return;
    }

    emailVerificationState.sending = true;
    emailVerificationState.messageText = "";
    emailVerificationState.messageIsError = false;
    renderEmailVerification(session);

    try {
      const response = await fetch("/api/auth/email-verification/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: sessionEmail }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        if (response.status === 429) {
          throw new Error("Doğrulama e-postası sınırına ulaşıldı. Biraz sonra tekrar dene.");
        }
        if (response.status === 503) {
          throw new Error("E-posta servisi şu an kullanılamıyor.");
        }
        throw new Error("Doğrulama e-postası gönderilemedi.");
      }

      if (payload.alreadyVerified) {
        emailVerificationState.verified = true;
        emailVerificationState.messageText = "";
        emailVerificationState.messageIsError = false;
      } else {
        emailVerificationState.messageText = translateUi("Doğrulama bağlantısı e-posta adresine gönderildi.");
        emailVerificationState.messageIsError = false;
      }
    } catch (error) {
      const text = String(error?.message || "Doğrulama e-postası gönderilemedi.");
      emailVerificationState.messageText = translateUi(text);
      emailVerificationState.messageIsError = true;
    } finally {
      emailVerificationState.sending = false;
      renderEmailVerification(readSession());
    }
  }

  function openSignup() {
    if (window.ARAMABUL_AUTH_MODAL?.open) {
      window.ARAMABUL_AUTH_MODAL.open("signup", accountSignupBtn instanceof HTMLElement ? accountSignupBtn : null);
      return;
    }

    setAccountMessage(translateUi("Kayıt ol penceresi yakında burada açılacak."), true);
  }

  function normalizeLegacySignupRoute() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "signup") {
      return;
    }

    window.history.replaceState({}, "", "profile.html?action=profile");
    openSignup();
  }

  function initialPanelFromRoute() {
    const params = new URLSearchParams(window.location.search);
    const action = String(params.get("action") || "").trim().toLocaleLowerCase("tr");
    if (action === "feedback" || action === "help" || action === "about" || action === "password") {
      return action;
    }
    return "account";
  }

  function setFeedbackStatus(text, isError = false) {
    if (feedbackStatus) {
      feedbackStatus.textContent = text;
      feedbackStatus.classList.toggle("is-ok", !isError && Boolean(text));
    }
  }

  function activatePanel(panelKey) {
    const nextPanel = panelKey === "feedback" || panelKey === "help" || panelKey === "about" || panelKey === "password"
      ? panelKey
      : "account";

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

  function shouldUseInlinePanels() {
    if (!panels.length) {
      return false;
    }
    const desktopViewport = window.matchMedia("(min-width: 700px)").matches;
    return desktopViewport && !shouldForceMobileLayout();
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
    if (accountCurrentPasswordInput instanceof HTMLInputElement) {
      accountCurrentPasswordInput.disabled = !session;
      if (!session) {
        accountCurrentPasswordInput.value = "";
      }
    }
    if (accountNewPasswordInput instanceof HTMLInputElement) {
      accountNewPasswordInput.disabled = !session;
      if (!session) {
        accountNewPasswordInput.value = "";
      }
    }
    if (accountNewPasswordRepeatInput instanceof HTMLInputElement) {
      accountNewPasswordRepeatInput.disabled = !session;
      if (!session) {
        accountNewPasswordRepeatInput.value = "";
      }
    }
    if (accountPasswordSaveBtn instanceof HTMLButtonElement) {
      accountPasswordSaveBtn.disabled = !session;
    }
    if (accountSignupBtn instanceof HTMLButtonElement) {
      accountSignupBtn.hidden = Boolean(session);
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

    if (!session) {
      setAccountMessage(translateUi("Kayıtlı oturum yok. Önce kayıt ol."));
      setPasswordMessage(translateUi("Şifre değiştirmek için önce giriş yap."), true);
      renderEmailVerification(null);
      return;
    }

    setAccountMessage("");
    setPasswordMessage("");
    renderEmailVerification(session);
    void refreshEmailVerificationStatus(session.email);
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

  if (accountEmailInput instanceof HTMLInputElement) {
    accountEmailInput.addEventListener("input", () => {
      renderEmailVerification(readSession());
    });
  }

  if (accountEmailVerifyBtn instanceof HTMLButtonElement) {
    accountEmailVerifyBtn.addEventListener("click", () => {
      void sendVerificationEmail();
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
        setAccountMessage(translateUi("Ad soyad en az 2 karakter olmalı."), true);
        return;
      }

      if (!email.includes("@") || email.length < 6) {
        setAccountMessage(translateUi("Geçerli bir e-posta gir."), true);
        return;
      }

      const users = readUsers();
      const resolvedUser = resolveSessionUser(users, currentSession);
      if (!resolvedUser) {
        setAccountMessage(translateUi("Hesap güvenliği doğrulanamadı. Lütfen çıkış yapıp yeniden giriş yap."), true);
        return;
      }
      const { sourceUser, sourceEmail } = resolvedUser;

      const duplicate = users.some((user) => {
        const userEmail = normalizeEmail(user.email);
        return userEmail === email && userEmail !== sourceEmail;
      });

      if (duplicate) {
        setAccountMessage(translateUi("Bu e-posta başka bir hesapta kayıtlı."), true);
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
      emailVerificationState.email = "";
      emailVerificationState.verified = false;
      emailVerificationState.messageText = "";
      emailVerificationState.messageIsError = false;
      renderAccount();
      setAccountMessage(translateUi("Hesap bilgileri kaydedildi."));
    });
  }

  if (accountPasswordForm) {
    accountPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const currentSession = readSession();
      if (!currentSession) {
        openSignup();
        return;
      }

      const currentPassword = String(
        accountCurrentPasswordInput instanceof HTMLInputElement ? accountCurrentPasswordInput.value : "",
      );
      const nextPassword = String(accountNewPasswordInput instanceof HTMLInputElement ? accountNewPasswordInput.value : "");
      const repeatPassword = String(
        accountNewPasswordRepeatInput instanceof HTMLInputElement ? accountNewPasswordRepeatInput.value : "",
      );

      if (!currentPassword) {
        setPasswordMessage(translateUi("Mevcut şifreni gir."), true);
        return;
      }

      if (nextPassword.length < 6) {
        setPasswordMessage(translateUi("Yeni şifre en az 6 karakter olmalı."), true);
        return;
      }

      if (nextPassword !== repeatPassword) {
        setPasswordMessage(translateUi("Yeni şifreler eşleşmiyor."), true);
        return;
      }

      const users = readUsers();
      const resolvedUser = resolveSessionUser(users, currentSession);
      if (!resolvedUser) {
        setPasswordMessage(translateUi("Hesap güvenliği doğrulanamadı. Lütfen çıkış yapıp yeniden giriş yap."), true);
        return;
      }

      const { sourceUser, sourceEmail } = resolvedUser;
      const currentPasswordHash = await hashPassword(currentPassword);
      if (!currentPasswordHash) {
        setPasswordMessage(translateUi("Tarayıcı güvenlik desteği bulunamadı."), true);
        return;
      }

      if (currentPasswordHash !== sourceUser.passwordHash) {
        setPasswordMessage(translateUi("Mevcut şifre hatalı."), true);
        return;
      }

      const nextPasswordHash = await hashPassword(nextPassword);
      if (!nextPasswordHash) {
        setPasswordMessage(translateUi("Tarayıcı güvenlik desteği bulunamadı."), true);
        return;
      }

      if (nextPasswordHash === sourceUser.passwordHash) {
        setPasswordMessage(translateUi("Yeni şifre mevcut şifre ile aynı olamaz."), true);
        return;
      }

      const nextUsers = users.map((user) => {
        const userEmail = normalizeEmail(user.email);
        if (userEmail !== sourceEmail) {
          return user;
        }
        return {
          ...user,
          passwordHash: nextPasswordHash,
        };
      });

      writeUsers(nextUsers);

      if (accountPasswordForm instanceof HTMLFormElement) {
        accountPasswordForm.reset();
      }

      setPasswordMessage(translateUi("Şifren güncellendi."));
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
    button.addEventListener("click", (event) => {
      const key = String(button.dataset.settingsPanelTrigger || "");
      if (!key) {
        return;
      }

      if (button instanceof HTMLAnchorElement) {
        if (!shouldUseInlinePanels()) {
          return;
        }
        event.preventDefault();
      }

      activatePanel(key);
    });
  });

  applyTheme(readTheme(), false);
  applyForcedMobileLayoutClass();
  renderAccount();
  normalizeLegacySignupRoute();
  activatePanel(initialPanelFromRoute());

  window.addEventListener("resize", applyForcedMobileLayoutClass, { passive: true });
  window.addEventListener("orientationchange", applyForcedMobileLayoutClass);

  document.addEventListener("aramabul:authchange", () => {
    renderAccount();
  });
  window.addEventListener("focus", () => {
    const session = readSession();
    if (session?.email) {
      void refreshEmailVerificationStatus(session.email, true);
    }
  });
})();
