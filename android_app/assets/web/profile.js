(() => {
  const AUTH_USERS_KEY = "neredeyenir.auth.users.v1";
  const AUTH_SESSION_KEY = "neredeyenir.auth.session.v1";
  const THEME_STORAGE_KEY = "neredeyenir.theme.v1";

  const settingsAvatar = document.querySelector("#settingsAvatar");
  const settingsName = document.querySelector("#settingsName");
  const settingsHandle = document.querySelector("#settingsHandle");
  const settingsBackBtn = document.querySelector("#settingsBackBtn");
  const settingsHomeLink = document.querySelector(".settings-home-link");
  const settingsAddAccountBtn = document.querySelector("#settingsAddAccountBtn");
  const settingsSignOutBtn = document.querySelector("#settingsSignOutBtn");
  const settingsSignupCard = document.querySelector("#settingsSignupCard");
  const settingsSignupForm = document.querySelector("#settingsSignupForm");
  const settingsSignupName = document.querySelector("#settingsSignupName");
  const settingsSignupEmail = document.querySelector("#settingsSignupEmail");
  const settingsSignupPassword = document.querySelector("#settingsSignupPassword");
  const settingsSignupPasswordRepeat = document.querySelector("#settingsSignupPasswordRepeat");
  const settingsSignupMessage = document.querySelector("#settingsSignupMessage");
  const settingsStubLinks = [...document.querySelectorAll('.settings-menu-card a[href="#"]')];

  function normalizeEmail(value) {
    return String(value || "").trim().toLocaleLowerCase("en-US");
  }

  function currentPageMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") === "signup" ? "signup" : "profile";
  }

  function applyPageMode() {
    const signupMode = currentPageMode() === "signup";
    document.body.classList.toggle("signup-mode", signupMode);
    if (settingsSignupCard) {
      settingsSignupCard.classList.toggle("is-hidden", !signupMode);
    }
  }

  function goToMode(mode) {
    const target = mode === "signup" ? "signup" : "profile";
    window.location.assign(`profile.html?action=${target}`);
  }

  function goHome() {
    window.location.assign("index.html");
  }

  function showSettingsMessage(text) {
    const toast = document.createElement("div");
    toast.className = "settings-inline-toast";
    toast.textContent = text;
    document.body.appendChild(toast);
    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.remove();
      }, 200);
    }, 1400);
  }

  function setSignupMessage(text, isError = true) {
    if (!settingsSignupMessage) {
      return;
    }
    settingsSignupMessage.textContent = text;
    settingsSignupMessage.classList.toggle("is-ok", !isError);
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

      const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
      const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
      if (!name || !email) {
        return null;
      }

      return { name, email };
    } catch (_error) {
      return null;
    }
  }

  function readTheme() {
    try {
      const raw = String(window.localStorage.getItem(THEME_STORAGE_KEY) || "").toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function applyTheme(theme, persist = true) {
    const nextTheme = theme === "light" ? "light" : "dark";
    if (typeof window.NEREDEYENIR_SET_THEME === "function") {
      window.NEREDEYENIR_SET_THEME(nextTheme);
    } else {
      document.body.classList.toggle("theme-dark", nextTheme === "dark");
      document.body.classList.toggle("theme-light", nextTheme === "light");
      document.documentElement.setAttribute("data-theme", nextTheme);
      if (persist) {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }
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
    return `@${slug || "kullanici"}.neredeyenir`;
  }

  function renderSettings() {
    const session = readSession();
    const userName = session?.name || "Misafir";
    const initial = userName.charAt(0).toLocaleUpperCase("tr");

    if (settingsAvatar) settingsAvatar.textContent = initial;
    if (settingsName) settingsName.textContent = userName;
    if (settingsHandle) settingsHandle.textContent = toHandleText(session);
    if (settingsSignOutBtn) {
      settingsSignOutBtn.disabled = !session;
      settingsSignOutBtn.textContent = session ? "Çıkış yap" : "Çıkış için giriş yap";
    }
  }

  if (settingsBackBtn) {
    settingsBackBtn.addEventListener("click", () => {
      if (currentPageMode() === "signup") {
        goToMode("profile");
        return;
      }
      goHome();
    });
  }

  if (settingsHomeLink) {
    settingsHomeLink.addEventListener("click", (event) => {
      event.preventDefault();
      goHome();
    });
  }

  if (settingsAddAccountBtn) {
    settingsAddAccountBtn.addEventListener("click", () => {
      goToMode("signup");
    });
  }

  if (settingsSignOutBtn) {
    settingsSignOutBtn.addEventListener("click", () => {
      const session = readSession();
      if (!session) {
        window.location.assign("index.html");
        return;
      }
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      document.dispatchEvent(new CustomEvent("neredeyenir:authchange"));
      renderSettings();
    });
  }

  settingsStubLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const label = (link.querySelector(".settings-row-label")?.textContent || "Bu bölüm").trim();
      showSettingsMessage(`${label} yakında aktif olacak.`);
    });
  });

  if (settingsSignupForm) {
    settingsSignupForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!settingsSignupName || !settingsSignupEmail || !settingsSignupPassword || !settingsSignupPasswordRepeat) {
        return;
      }

      const name = String(settingsSignupName.value || "").trim().slice(0, 40);
      const email = normalizeEmail(settingsSignupEmail.value);
      const password = String(settingsSignupPassword.value || "");
      const repeat = String(settingsSignupPasswordRepeat.value || "");

      if (name.length < 2) {
        setSignupMessage("Ad soyad en az 2 karakter olmalı.");
        return;
      }
      if (!email.includes("@") || email.length < 6) {
        setSignupMessage("Geçerli bir e-posta gir.");
        return;
      }
      if (password.length < 6) {
        setSignupMessage("Şifre en az 6 karakter olmalı.");
        return;
      }
      if (password !== repeat) {
        setSignupMessage("Şifreler eşleşmiyor.");
        return;
      }

      try {
        const rawUsers = window.localStorage.getItem(AUTH_USERS_KEY);
        const users = Array.isArray(JSON.parse(rawUsers || "[]")) ? JSON.parse(rawUsers || "[]") : [];
        const hasEmail = users.some((user) => user && normalizeEmail(user.email) === email);
        if (hasEmail) {
          setSignupMessage("Bu e-posta zaten kayıtlı.");
          return;
        }
        users.push({ name, email });
        window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
      } catch (_error) {
        // Keep flow alive even if user list cannot be stored.
      }

      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ name, email }));
      document.dispatchEvent(new CustomEvent("neredeyenir:authchange"));
      setSignupMessage("Kayıt tamamlandı.", false);
      window.setTimeout(() => {
        goToMode("profile");
      }, 350);
    });
  }

  renderSettings();
  applyPageMode();
  applyTheme(readTheme(), false);

  document.addEventListener("neredeyenir:authchange", () => {
    renderSettings();
  });
})();
