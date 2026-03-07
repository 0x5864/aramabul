(() => {
  const AUTH_COPY = Object.freeze({
    TR: Object.freeze({
      brand: "aramabul",
      profile: "Profil",
      signupTitle: "Kayıt ol",
      signupText: "",
      loginTitle: "Giriş yap",
      loginText: "Kayıtlı hesabınla devam et.",
      loginNeedsSignup: "Kayıtlı değilseniz, giriş yapmak için önce kayıt olun.",
      name: "Ad Soyad",
      email: "E-posta",
      password: "Şifre",
      passwordRepeat: "Şifre tekrar",
      signupSubmit: "Kayıt ol",
      loginSubmit: "Giriş yap",
      errorNameMin: "Ad soyad en az 2 karakter olmalı.",
      errorInvalidEmail: "Geçerli bir e-posta gir.",
      errorPasswordMin: "Şifre en az 6 karakter olmalı.",
      errorPasswordRepeat: "Şifreler eşleşmiyor.",
      errorEmailExists: "Bu e-posta zaten kayıtlı.",
      errorInvalidCredentials: "E-posta veya şifre hatalı.",
      errorSecurity: "Tarayıcı güvenlik desteği bulunamadı.",
    }),
    EN: Object.freeze({
      brand: "aramabul",
      profile: "Profile",
      signupTitle: "Sign up",
      signupText: "",
      loginTitle: "Sign in",
      loginText: "Continue with your saved account.",
      loginNeedsSignup: "Not registered yet? Sign up first to sign in.",
      name: "Full name",
      email: "Email",
      password: "Password",
      passwordRepeat: "Repeat password",
      signupSubmit: "Sign up",
      loginSubmit: "Sign in",
      errorNameMin: "Your name must be at least 2 characters.",
      errorInvalidEmail: "Enter a valid email.",
      errorPasswordMin: "Password must be at least 6 characters.",
      errorPasswordRepeat: "Passwords do not match.",
      errorEmailExists: "This email is already registered.",
      errorInvalidCredentials: "Email or password is incorrect.",
      errorSecurity: "Security support is not available in this browser.",
    }),
    RU: Object.freeze({
      brand: "aramabul",
      profile: "Профиль",
      signupTitle: "Регистрация",
      signupText: "",
      loginTitle: "Войти",
      loginText: "Продолжите с вашим аккаунтом.",
      loginNeedsSignup: "Если вы не зарегистрированы, сначала зарегистрируйтесь.",
      name: "Имя и фамилия",
      email: "Эл. почта",
      password: "Пароль",
      passwordRepeat: "Повторите пароль",
      signupSubmit: "Регистрация",
      loginSubmit: "Войти",
      errorNameMin: "Имя должно быть не короче 2 символов.",
      errorInvalidEmail: "Введите корректный email.",
      errorPasswordMin: "Пароль должен быть не короче 6 символов.",
      errorPasswordRepeat: "Пароли не совпадают.",
      errorEmailExists: "Этот email уже зарегистрирован.",
      errorInvalidCredentials: "Неверный email или пароль.",
      errorSecurity: "В браузере нет нужной защиты.",
    }),
    DE: Object.freeze({
      brand: "aramabul",
      profile: "Profil",
      signupTitle: "Registrieren",
      signupText: "",
      loginTitle: "Anmelden",
      loginText: "Mit deinem Konto weitermachen.",
      loginNeedsSignup: "Noch nicht registriert? Bitte zuerst registrieren.",
      name: "Vor- und Nachname",
      email: "E-Mail",
      password: "Passwort",
      passwordRepeat: "Passwort wiederholen",
      signupSubmit: "Registrieren",
      loginSubmit: "Anmelden",
      errorNameMin: "Der Name muss mindestens 2 Zeichen lang sein.",
      errorInvalidEmail: "Gib eine gueltige E-Mail ein.",
      errorPasswordMin: "Das Passwort muss mindestens 6 Zeichen lang sein.",
      errorPasswordRepeat: "Die Passwoerter stimmen nicht ueberein.",
      errorEmailExists: "Diese E-Mail ist schon registriert.",
      errorInvalidCredentials: "E-Mail oder Passwort ist falsch.",
      errorSecurity: "Sicherheitsunterstuetzung ist nicht verfuegbar.",
    }),
    ZH: Object.freeze({
      brand: "aramabul",
      profile: "个人资料",
      signupTitle: "注册",
      signupText: "",
      loginTitle: "登录",
      loginText: "使用已有账号继续。",
      loginNeedsSignup: "如果你还未注册，请先注册再登录。",
      name: "姓名",
      email: "邮箱",
      password: "密码",
      passwordRepeat: "重复密码",
      signupSubmit: "注册",
      loginSubmit: "登录",
      errorNameMin: "姓名至少需要 2 个字符。",
      errorInvalidEmail: "请输入有效邮箱。",
      errorPasswordMin: "密码至少需要 6 个字符。",
      errorPasswordRepeat: "两次密码不一致。",
      errorEmailExists: "该邮箱已被注册。",
      errorInvalidCredentials: "邮箱或密码错误。",
      errorSecurity: "当前浏览器缺少安全支持。",
    }),
  });

  let authController = null;

  function runtime() {
    return window.ARAMABUL_RUNTIME || null;
  }

  function currentLanguage() {
    if (typeof window.ARAMABUL_GET_LANGUAGE === "function") {
      const code = String(window.ARAMABUL_GET_LANGUAGE() || "").toUpperCase();
      if (AUTH_COPY[code]) {
        return code;
      }
    }

    const code = String(window.ARAMABUL_CURRENT_LANGUAGE || "TR").toUpperCase();
    return AUTH_COPY[code] ? code : "TR";
  }

  function authText() {
    return AUTH_COPY[currentLanguage()] || AUTH_COPY.TR;
  }

  function readUsers() {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.readAuthUsers !== "function") {
      return [];
    }

    return appRuntime
      .readAuthUsers()
      .filter(
        (user) =>
          user &&
          typeof user === "object" &&
          typeof user.name === "string" &&
          typeof user.email === "string" &&
          typeof user.passwordHash === "string",
      );
  }

  function writeUsers(users) {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.writeAuthUsers !== "function") {
      return;
    }

    appRuntime.writeAuthUsers(users);
  }

  function readSession() {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.readAuthSession !== "function") {
      return null;
    }

    return appRuntime.readAuthSession();
  }

  function writeSession(session) {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.writeAuthSession !== "function") {
      return;
    }

    appRuntime.writeAuthSession(session, true);
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

  function createAuthModalMarkup() {
    const copy = authText();
    const modal = document.createElement("div");
    modal.id = "globalAuthModal";
    modal.className = "auth-modal is-hidden";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="auth-modal-panel" role="dialog" aria-modal="true" aria-labelledby="globalAuthModalTitle">
        <button id="globalAuthModalClose" class="auth-modal-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow auth-modal-brand">${copy.brand}</p>
        <h2 id="globalAuthModalTitle" class="auth-modal-title">${copy.signupTitle}</h2>
        <p id="globalAuthModalText" class="auth-modal-text">${copy.signupText}</p>
        <form id="globalLoginForm" class="auth-form is-hidden" novalidate>
          <label>
            <span id="globalLoginEmailLabel">${copy.email}</span>
            <input id="globalLoginEmail" type="email" autocomplete="email" required />
          </label>
          <label>
            <span id="globalLoginPasswordLabel">${copy.password}</span>
            <input id="globalLoginPassword" type="password" autocomplete="current-password" required />
          </label>
          <button id="globalLoginSubmit" class="auth-submit" type="submit">${copy.loginSubmit}</button>
        </form>
        <button id="globalLoginSignupHint" class="auth-inline-link is-hidden" type="button">
          ${copy.loginNeedsSignup}
        </button>
        <form id="globalSignupForm" class="auth-form" novalidate>
          <label>
            <span id="globalSignupNameLabel">${copy.name}</span>
            <input id="globalSignupName" type="text" autocomplete="name" required />
          </label>
          <label>
            <span id="globalSignupEmailLabel">${copy.email}</span>
            <input id="globalSignupEmail" type="email" autocomplete="email" required />
          </label>
          <label>
            <span id="globalSignupPasswordLabel">${copy.password}</span>
            <input id="globalSignupPassword" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <label>
            <span id="globalSignupPasswordRepeatLabel">${copy.passwordRepeat}</span>
            <input id="globalSignupPasswordRepeat" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <button id="globalSignupSubmit" class="auth-submit" type="submit">${copy.signupSubmit}</button>
        </form>
        <p id="globalAuthMessage" class="auth-message" aria-live="polite"></p>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function ensureAuthModal() {
    if (authController) {
      return authController;
    }

    const modal = document.querySelector("#globalAuthModal") || createAuthModalMarkup();
    const closeButton = modal.querySelector("#globalAuthModalClose");
    const title = modal.querySelector("#globalAuthModalTitle");
    const text = modal.querySelector("#globalAuthModalText");
    const message = modal.querySelector("#globalAuthMessage");
    const loginForm = modal.querySelector("#globalLoginForm");
    const signupForm = modal.querySelector("#globalSignupForm");
    const loginEmail = modal.querySelector("#globalLoginEmail");
    const loginPassword = modal.querySelector("#globalLoginPassword");
    const signupName = modal.querySelector("#globalSignupName");
    const signupEmail = modal.querySelector("#globalSignupEmail");
    const signupPassword = modal.querySelector("#globalSignupPassword");
    const signupPasswordRepeat = modal.querySelector("#globalSignupPasswordRepeat");
    const loginSubmit = modal.querySelector("#globalLoginSubmit");
    const loginSignupHint = modal.querySelector("#globalLoginSignupHint");
    const signupSubmit = modal.querySelector("#globalSignupSubmit");
    const labelNodes = {
      close: closeButton,
      loginEmail: modal.querySelector("#globalLoginEmailLabel"),
      loginPassword: modal.querySelector("#globalLoginPasswordLabel"),
      signupName: modal.querySelector("#globalSignupNameLabel"),
      signupEmail: modal.querySelector("#globalSignupEmailLabel"),
      signupPassword: modal.querySelector("#globalSignupPasswordLabel"),
      signupPasswordRepeat: modal.querySelector("#globalSignupPasswordRepeatLabel"),
    };
    const state = {
      mode: "signup",
      lastTrigger: null,
    };

    function setMessage(value, isError = false) {
      if (!(message instanceof HTMLElement)) {
        return;
      }

      message.textContent = value;
      message.classList.toggle("auth-message-error", isError);
    }

    function setMode(mode) {
      const copy = authText();
      const isLoginMode = mode === "login";
      state.mode = isLoginMode ? "login" : "signup";

      if (loginForm instanceof HTMLElement) {
        loginForm.classList.toggle("is-hidden", !isLoginMode);
      }
      if (signupForm instanceof HTMLElement) {
        signupForm.classList.toggle("is-hidden", isLoginMode);
      }
      if (title instanceof HTMLElement) {
        title.textContent = isLoginMode ? copy.loginTitle : copy.signupTitle;
      }
      if (text instanceof HTMLElement) {
        const nextText = isLoginMode ? copy.loginText : copy.signupText;
        text.textContent = nextText;
        text.classList.toggle("is-hidden", nextText.length === 0);
      }
      if (loginSignupHint instanceof HTMLElement) {
        loginSignupHint.classList.toggle("is-hidden", !isLoginMode);
      }

      setMessage("");
    }

    function syncCopy() {
      const copy = authText();

      if (labelNodes.close instanceof HTMLElement) {
        labelNodes.close.setAttribute("aria-label", "Close");
      }
      if (labelNodes.loginEmail instanceof HTMLElement) {
        labelNodes.loginEmail.textContent = copy.email;
      }
      if (labelNodes.loginPassword instanceof HTMLElement) {
        labelNodes.loginPassword.textContent = copy.password;
      }
      if (labelNodes.signupName instanceof HTMLElement) {
        labelNodes.signupName.textContent = copy.name;
      }
      if (labelNodes.signupEmail instanceof HTMLElement) {
        labelNodes.signupEmail.textContent = copy.email;
      }
      if (labelNodes.signupPassword instanceof HTMLElement) {
        labelNodes.signupPassword.textContent = copy.password;
      }
      if (labelNodes.signupPasswordRepeat instanceof HTMLElement) {
        labelNodes.signupPasswordRepeat.textContent = copy.passwordRepeat;
      }
      if (loginSubmit instanceof HTMLElement) {
        loginSubmit.textContent = copy.loginSubmit;
      }
      if (loginSignupHint instanceof HTMLElement) {
        loginSignupHint.textContent = copy.loginNeedsSignup;
      }
      if (signupSubmit instanceof HTMLElement) {
        signupSubmit.textContent = copy.signupSubmit;
      }

      setMode(state.mode);
    }

    function focusCurrentField() {
      if (state.mode === "login" && loginEmail instanceof HTMLInputElement) {
        loginEmail.focus();
        return;
      }

      if (signupName instanceof HTMLInputElement) {
        signupName.focus();
      }
    }

    function close() {
      if (!(modal instanceof HTMLElement)) {
        return;
      }

      modal.classList.add("is-hidden");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      setMessage("");

      if (state.lastTrigger instanceof HTMLElement) {
        state.lastTrigger.focus();
      }
    }

    function open(mode = "signup", trigger = null) {
      if (!(modal instanceof HTMLElement)) {
        return;
      }

      state.lastTrigger = trigger instanceof HTMLElement ? trigger : document.activeElement;
      setMode(mode);
      modal.classList.remove("is-hidden");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(focusCurrentField);
    }

    async function handleLoginSubmit(event) {
      event.preventDefault();

      if (!(loginEmail instanceof HTMLInputElement) || !(loginPassword instanceof HTMLInputElement)) {
        return;
      }

      const copy = authText();
      const email = normalizeEmail(loginEmail.value);
      const passwordHash = await hashPassword(loginPassword.value);
      if (!passwordHash) {
        setMessage(copy.errorSecurity, true);
        return;
      }

      const matchedUser = readUsers().find(
        (user) => normalizeEmail(user.email) === email && user.passwordHash === passwordHash,
      );
      if (!matchedUser) {
        setMessage(copy.errorInvalidCredentials, true);
        return;
      }

      writeSession({
        name: matchedUser.name.trim().slice(0, 40),
        email: normalizeEmail(matchedUser.email),
      });
      close();
    }

    async function handleSignupSubmit(event) {
      event.preventDefault();

      if (
        !(signupName instanceof HTMLInputElement) ||
        !(signupEmail instanceof HTMLInputElement) ||
        !(signupPassword instanceof HTMLInputElement) ||
        !(signupPasswordRepeat instanceof HTMLInputElement)
      ) {
        return;
      }

      const copy = authText();
      const name = signupName.value.trim().slice(0, 40);
      const email = normalizeEmail(signupEmail.value);
      const password = String(signupPassword.value || "");
      const repeated = String(signupPasswordRepeat.value || "");

      if (name.length < 2) {
        setMessage(copy.errorNameMin, true);
        return;
      }
      if (!email.includes("@") || email.length < 6) {
        setMessage(copy.errorInvalidEmail, true);
        return;
      }
      if (password.length < 6) {
        setMessage(copy.errorPasswordMin, true);
        return;
      }
      if (password !== repeated) {
        setMessage(copy.errorPasswordRepeat, true);
        return;
      }

      const users = readUsers();
      const hasEmail = users.some((user) => normalizeEmail(user.email) === email);
      if (hasEmail) {
        setMessage(copy.errorEmailExists, true);
        return;
      }

      const passwordHash = await hashPassword(password);
      if (!passwordHash) {
        setMessage(copy.errorSecurity, true);
        return;
      }

      users.push({ name, email, passwordHash });
      writeUsers(users);
      writeSession({ name, email });
      close();
    }

    if (closeButton instanceof HTMLElement) {
      closeButton.addEventListener("click", () => {
        close();
      });
    }

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("is-hidden")) {
        close();
      }
    });

    if (loginForm instanceof HTMLFormElement) {
      loginForm.addEventListener("submit", handleLoginSubmit);
    }
    if (signupForm instanceof HTMLFormElement) {
      signupForm.addEventListener("submit", handleSignupSubmit);
    }
    if (loginSignupHint instanceof HTMLButtonElement) {
      loginSignupHint.addEventListener("click", () => {
        setMode("signup");
        window.requestAnimationFrame(focusCurrentField);
      });
    }

    document.addEventListener("aramabul:languagechange", syncCopy);

    authController = {
      open,
      close,
      isOpen() {
        return !modal.classList.contains("is-hidden");
      },
    };

    syncCopy();
    return authController;
  }

  function openAuthModal(mode = "signup", trigger = null) {
    ensureAuthModal().open(mode, trigger);
  }

  function setDesktopLinkLabel(link, label) {
    if (!(link instanceof HTMLElement)) {
      return;
    }

    link.setAttribute("aria-label", label);
    link.setAttribute("title", label);
    const textNode = link.querySelector(".desktop-auth-link-text");
    if (textNode instanceof HTMLElement) {
      textNode.textContent = label;
    }
  }

  function createDesktopAuthLinks(options = {}) {
    const { currentPageName, getDesktopAuthLabels } = options;
    if (typeof currentPageName !== "function" || typeof getDesktopAuthLabels !== "function") {
      return;
    }

    const topbar = document.querySelector(".global-topbar, .search-topbar, .topbar");
    if (!(topbar instanceof HTMLElement)) {
      return;
    }

    const profileMode = currentPageName() === "profile.html";
    let authNav = topbar.querySelector(".desktop-auth-links");

    if (!(authNav instanceof HTMLElement)) {
      const labels = getDesktopAuthLabels();
      authNav = document.createElement("nav");
      authNav.className = "desktop-auth-links";
      authNav.setAttribute("aria-label", labels.nav);
      authNav.innerHTML = `
        <a
          class="desktop-auth-link desktop-auth-link-signin"
          data-desktop-auth="signin"
          href="#login"
          aria-label="${labels.signin}"
          title="${labels.signin}"
        >
          <span class="desktop-auth-link-icon-wrap" aria-hidden="true">
            <svg class="desktop-auth-link-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="8.2" r="3.2"></circle>
              <path d="M4.8 18.2c.7-2.7 2.8-4.5 5.2-4.5s4.5 1.8 5.2 4.5"></path>
              <path d="M17 12h4"></path>
              <path d="m19 10 2 2-2 2"></path>
            </svg>
          </span>
          <span class="visually-hidden desktop-auth-link-text">${labels.signin}</span>
        </a>
        <a
          class="desktop-auth-link desktop-auth-link-signup"
          data-desktop-auth="signup"
          href="#signup"
          aria-label="${labels.signup}"
          title="${labels.signup}"
        >
          <span class="desktop-auth-link-icon-wrap" aria-hidden="true">
            <svg class="desktop-auth-link-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="8.3" r="3.2"></circle>
              <path d="M4.8 18.3c.7-2.8 2.8-4.6 5.2-4.6s4.5 1.8 5.2 4.6"></path>
              <path d="M18 7.5v5"></path>
              <path d="M15.5 10h5"></path>
            </svg>
          </span>
          <span class="visually-hidden desktop-auth-link-text">${labels.signup}</span>
        </a>
        <div class="lang-switch desktop-lang-switch" data-lang-switch>
          <button
            class="lang-switch-btn"
            type="button"
            data-lang-trigger
            aria-haspopup="true"
            aria-expanded="false"
            aria-label="Dil seç"
            title="Dil seç"
          >
            <span class="lang-switch-code" data-lang-current>TR</span>
          </button>
          <div class="lang-switch-menu" data-lang-menu hidden>
            <button class="lang-switch-option active" data-lang-option="TR" type="button" aria-pressed="true">TR</button>
            <button class="lang-switch-option" data-lang-option="EN" type="button" aria-pressed="false">EN</button>
            <button class="lang-switch-option" data-lang-option="DE" type="button" aria-pressed="false">DE</button>
            <button class="lang-switch-option" data-lang-option="RU" type="button" aria-pressed="false">RU</button>
            <button class="lang-switch-option" data-lang-option="ZH" type="button" aria-pressed="false">ZH</button>
          </div>
        </div>
        <a
          class="desktop-auth-link desktop-auth-link-settings${profileMode ? " is-active" : ""}"
          data-desktop-auth="settings"
          href="profile.html?action=profile"
          aria-label="${labels.settings || labels.profile || labels.signin}"
          title="${labels.settings || labels.profile || labels.signin}"
        >
          <span class="desktop-auth-link-icon-wrap" aria-hidden="true">
            <img class="desktop-auth-link-image" src="assets/ayar1.png?v=20260226-2" alt="" />
          </span>
          <span class="visually-hidden desktop-auth-link-text">${labels.settings || labels.profile || labels.signin}</span>
        </a>
      `;
      topbar.appendChild(authNav);
    }

    const signinLink = authNav.querySelector('[data-desktop-auth="signin"]');
    const signupLink = authNav.querySelector('[data-desktop-auth="signup"]');
    const settingsLink = authNav.querySelector('[data-desktop-auth="settings"]');

    function updateDesktopAuthLabels() {
      const labels = getDesktopAuthLabels();
      const copy = authText();
      const hasSession = Boolean(readSession());

      authNav.setAttribute("aria-label", labels.nav);
      const settingsLabel = labels.settings || labels.profile || copy.profile;
      setDesktopLinkLabel(signinLink, labels.signin);
      setDesktopLinkLabel(signupLink, labels.signup);
      setDesktopLinkLabel(settingsLink, settingsLabel);

      if (signinLink instanceof HTMLElement) {
        signinLink.classList.toggle("is-hidden", hasSession);
      }

      if (signupLink instanceof HTMLElement) {
        signupLink.classList.toggle("is-hidden", hasSession);
      }

      if (settingsLink instanceof HTMLAnchorElement) {
        settingsLink.href = "profile.html?action=profile";
      }
    }

    if (signinLink instanceof HTMLAnchorElement) {
      signinLink.addEventListener("click", (event) => {
        event.preventDefault();
        openAuthModal("login", signinLink);
      });
    }

    if (signupLink instanceof HTMLAnchorElement) {
      signupLink.addEventListener("click", (event) => {
        event.preventDefault();
        openAuthModal("signup", signupLink);
      });
    }

    document.addEventListener("aramabul:languagechange", updateDesktopAuthLabels);
    document.addEventListener("aramabul:authchange", updateDesktopAuthLabels);
    updateDesktopAuthLabels();
  }

  function createMobileBottomNav(options = {}) {
    const { currentPageName, getNavLabels, input } = options;
    if (typeof currentPageName !== "function" || typeof getNavLabels !== "function") {
      return;
    }

    const existing = document.querySelector(".mobile-bottom-nav");
    if (existing) {
      return;
    }

    const isHomePage = () => currentPageName() === "index.html" || currentPageName() === "";
    const labels = getNavLabels();
    const wrapper = document.createElement("div");
    wrapper.className = "mobile-bottom-nav";
    wrapper.innerHTML = `
      <nav class="mobile-bottom-nav-actions" aria-label="${labels.nav}">
        <button class="mobile-bottom-nav-btn" data-mobile-nav="home" type="button" aria-label="${labels.home}" title="${labels.home}">
          <span class="mobile-bottom-nav-chip" aria-hidden="true">
            <svg class="mobile-bottom-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m3 11 9-7 9 7"></path>
              <path d="M7 10v9h10v-9"></path>
            </svg>
          </span>
        </button>
        <button class="mobile-bottom-nav-btn" data-mobile-nav="search" type="button" aria-label="${labels.search}" title="${labels.search}">
          <span class="mobile-bottom-nav-chip" aria-hidden="true">
            <svg class="mobile-bottom-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.8"></circle>
              <path d="m20 20-3.7-3.7"></path>
            </svg>
          </span>
        </button>
        <button class="mobile-bottom-nav-btn" data-mobile-nav="signup" type="button" aria-label="${labels.signup}" title="${labels.signup}">
          <span class="mobile-bottom-nav-chip" aria-hidden="true">
            <svg class="mobile-bottom-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="8.2" r="3.4"></circle>
              <path d="M4.5 18.5c.8-2.9 2.9-4.8 5.5-4.8s4.7 1.9 5.5 4.8"></path>
              <path d="M17.5 8v5"></path>
              <path d="M15 10.5h5"></path>
            </svg>
          </span>
        </button>
        <button class="mobile-bottom-nav-btn" data-mobile-nav="profile" type="button" aria-label="${labels.profile}" title="${labels.profile}">
          <span class="mobile-bottom-nav-chip" aria-hidden="true">
            <img class="mobile-bottom-nav-icon-img" src="assets/ayar1.png?v=20260226-2" alt="" />
            <svg class="mobile-bottom-nav-icon-svg mobile-bottom-nav-icon-svg-fallback" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 3.8v2.2"></path>
              <path d="M12 18v2.2"></path>
              <path d="m5.6 5.6 1.5 1.5"></path>
              <path d="m16.9 16.9 1.5 1.5"></path>
              <path d="M3.8 12H6"></path>
              <path d="M18 12h2.2"></path>
              <path d="m5.6 18.4 1.5-1.5"></path>
              <path d="m16.9 7.1 1.5-1.5"></path>
            </svg>
          </span>
        </button>
      </nav>
    `;

    document.body.appendChild(wrapper);

    const settingsIconImage = wrapper.querySelector('[data-mobile-nav="profile"] .mobile-bottom-nav-icon-img');
    if (settingsIconImage instanceof HTMLImageElement) {
      const chip = settingsIconImage.closest(".mobile-bottom-nav-chip");
      const syncIconState = () => {
        if (!chip) {
          return;
        }
        if (settingsIconImage.complete && settingsIconImage.naturalWidth > 0) {
          chip.classList.remove("icon-load-failed");
          return;
        }
        if (settingsIconImage.complete && settingsIconImage.naturalWidth === 0) {
          chip.classList.add("icon-load-failed");
        }
      };
      settingsIconImage.addEventListener("error", () => {
        if (chip) {
          chip.classList.add("icon-load-failed");
        }
      });
      settingsIconImage.addEventListener("load", () => {
        if (chip) {
          chip.classList.remove("icon-load-failed");
        }
      });
      syncIconState();
    }

    const buttons = [...wrapper.querySelectorAll(".mobile-bottom-nav-btn")];

    function updateActiveNav() {
      buttons.forEach((button) => {
        const type = button.dataset.mobileNav;
        const active =
          (type === "home" && isHomePage()) ||
          (type === "search" && currentPageName() === "search.html") ||
          (type === "profile" && currentPageName() === "profile.html") ||
          false;
        button.classList.toggle("active", active);
      });
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.mobileNav;
        const isProfilePage = currentPageName() === "profile.html";

        if (type === "home") {
          window.location.assign("index.html");
          return;
        }

        if (type === "search") {
          if (currentPageName() !== "search.html") {
            window.location.assign("search.html");
            return;
          }
          if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
            input.focus();
            input.select();
          }
          updateActiveNav();
          return;
        }

        if (type === "signup") {
          openAuthModal("signup", button);
          return;
        }

        if (type === "profile" && !isProfilePage) {
          window.location.assign("profile.html?action=profile");
        }
      });
    });

    document.addEventListener("aramabul:languagechange", () => {
      const nextLabels = getNavLabels();
      const navWrap = wrapper.querySelector(".mobile-bottom-nav-actions");
      const homeBtn = wrapper.querySelector('[data-mobile-nav="home"]');
      const searchBtn = wrapper.querySelector('[data-mobile-nav="search"]');
      const signupBtn = wrapper.querySelector('[data-mobile-nav="signup"]');
      const profileBtn = wrapper.querySelector('[data-mobile-nav="profile"]');

      if (navWrap) navWrap.setAttribute("aria-label", nextLabels.nav);
      if (homeBtn) {
        homeBtn.setAttribute("aria-label", nextLabels.home);
        homeBtn.setAttribute("title", nextLabels.home);
      }
      if (searchBtn) {
        searchBtn.setAttribute("aria-label", nextLabels.search);
        searchBtn.setAttribute("title", nextLabels.search);
      }
      if (signupBtn) {
        signupBtn.setAttribute("aria-label", nextLabels.signup);
        signupBtn.setAttribute("title", nextLabels.signup);
      }
      if (profileBtn) {
        profileBtn.setAttribute("aria-label", nextLabels.profile);
        profileBtn.setAttribute("title", nextLabels.profile);
      }
    });

    updateActiveNav();
  }

  window.ARAMABUL_AUTH_MODAL = {
    open(mode = "signup", trigger = null) {
      openAuthModal(mode, trigger);
    },
    close() {
      if (authController) {
        authController.close();
      }
    },
    isOpen() {
      return authController ? authController.isOpen() : false;
    },
  };

  window.ARAMABUL_HEADER_NAV = {
    createDesktopAuthLinks,
    createMobileBottomNav,
  };
})();
