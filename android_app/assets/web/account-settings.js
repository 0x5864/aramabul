(() => {
  const AUTH_USERS_KEY = "neredeyenir.auth.users.v1";
  const AUTH_SESSION_KEY = "neredeyenir.auth.session.v1";
  const THEME_STORAGE_KEY = "neredeyenir.theme.v1";

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

  function readTheme() {
    try {
      const raw = String(window.localStorage.getItem(THEME_STORAGE_KEY) || "").trim().toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    if (typeof window.NEREDEYENIR_SET_THEME === "function") {
      window.NEREDEYENIR_SET_THEME(nextTheme);
      return;
    }

    document.body.classList.toggle("theme-dark", nextTheme === "dark");
    document.body.classList.toggle("theme-light", nextTheme === "light");
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  function readSession() {
    try {
      const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
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
      const raw = window.localStorage.getItem(AUTH_USERS_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeUsers(users) {
    window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  }

  function writeSession(session) {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    document.dispatchEvent(new CustomEvent("neredeyenir:authchange"));
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
    return `@${slug || "kullanici"}.neredeyenir`;
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
      setMessage("Kayıtlı oturum yok. Önce kayıt ol.");
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
        setMessage("Ad soyad en az 2 karakter olmalı.", true);
        return;
      }

      if (!email.includes("@") || email.length < 6) {
        setMessage("Geçerli bir e-posta gir.", true);
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
        setMessage("Bu e-posta başka bir hesapta kayıtlı.", true);
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
      setMessage("Hesap bilgileri kaydedildi.");
    });
  }

  applyTheme(readTheme());
  renderAccount();

  document.addEventListener("neredeyenir:authchange", () => {
    renderAccount();
  });
})();
