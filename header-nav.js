(() => {
  const AUTH_COPY = Object.freeze({
    TR: Object.freeze({
      brand: "aramabul",
      profile: "Profil",
      close: "Kapat",
      signupTitle: "Kayıt ol",
      signupText: "",
      loginTitle: "Giriş yap",
      loginText: "Kayıtlı hesabınla devam et.",
      loginNeedsSignup: "Kayıtlı değilseniz, giriş yapmak için önce kayıt olun.",
      firstName: "Ad",
      lastName: "Soyad",
      email: "E-posta",
      password: "Şifre",
      passwordRepeat: "Şifre tekrar",
      signupSubmit: "Kayıt ol",
      signupLegalNote:
        "Kişisel verileriniz, Kişisel Verilerin Korunması Metni kapsamında işlenmektedir. “Kayıt ol” butonuna basarak Gizlilik Politikası’nı okuduğunuzu ve kabul ettiğinizi onaylıyorsunuz.",
      loginSubmit: "Giriş yap",
      forgotPassword: "Şifremi unuttum",
      rememberEmail: "E-postamı hatırla",
      passwordToggleShow: "Göster",
      passwordToggleHide: "Gizle",
      passwordToggleShowLabel: "Şifreyi göster",
      passwordToggleHideLabel: "Şifreyi gizle",
      resetTitle: "Şifreyi sıfırla",
      resetText: "E-posta adresini doğrulayarak yeni şifreni belirle.",
      resetSubmit: "Şifreyi sıfırla",
      resetBackToLogin: "Girişe dön",
      forgotPasswordSending: "Bağlantı gönderiliyor...",
      forgotPasswordSent: "Şifre değişikliği bağlantısı e-posta adresine gönderildi.",
      forgotPasswordLogAt: "Zaman",
      forgotPasswordLogIp: "IP",
      forgotPasswordRateLimited: "Çok fazla istek gönderildi. Biraz sonra tekrar dene.",
      forgotPasswordServiceUnavailable: "E-posta servisi şu an kullanılamıyor.",
      forgotPasswordFailed: "Şifre değişikliği bağlantısı gönderilemedi.",
      errorNameMin: "Ad ve soyad en az 2 karakter olmalı.",
      errorInvalidEmail: "Geçerli bir e-posta gir.",
      errorPasswordMin: "Şifre en az 6 karakter olmalı.",
      errorPasswordRepeat: "Şifreler eşleşmiyor.",
      errorEmailExists: "Bu e-posta zaten kayıtlı.",
      errorInvalidCredentials: "E-posta veya şifre hatalı.",
      errorResetUserNotFound: "Bu e-posta ile kayıtlı hesap bulunamadı.",
      errorSecurity: "Tarayıcı güvenlik desteği bulunamadı.",
      resetSuccess: "Şifre güncellendi. Yeni şifrenle giriş yapabilirsin.",
      alreadyRegisteredUser: "Kayıtlı kullanıcı",
    }),
    EN: Object.freeze({
      brand: "aramabul",
      profile: "Profile",
      close: "Close",
      signupTitle: "Sign up",
      signupText: "",
      loginTitle: "Sign in",
      loginText: "Continue with your saved account.",
      loginNeedsSignup: "Not registered yet? Sign up first to sign in.",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      password: "Password",
      passwordRepeat: "Repeat password",
      signupSubmit: "Sign up",
      signupLegalNote:
        "Your personal data is processed under the Personal Data Protection notice. By pressing “Sign up”, you confirm that you read and accepted the Privacy Policy.",
      loginSubmit: "Sign in",
      forgotPassword: "Forgot password",
      rememberEmail: "Remember my email",
      passwordToggleShow: "Show",
      passwordToggleHide: "Hide",
      passwordToggleShowLabel: "Show password",
      passwordToggleHideLabel: "Hide password",
      resetTitle: "Reset password",
      resetText: "Confirm your email and set a new password.",
      resetSubmit: "Reset password",
      resetBackToLogin: "Back to sign in",
      forgotPasswordSending: "Sending reset link...",
      forgotPasswordSent: "Password change link has been sent to your email.",
      forgotPasswordLogAt: "Time",
      forgotPasswordLogIp: "IP",
      forgotPasswordRateLimited: "Too many requests. Please try again later.",
      forgotPasswordServiceUnavailable: "Email service is currently unavailable.",
      forgotPasswordFailed: "Failed to send password change link.",
      errorNameMin: "First name and last name must be at least 2 characters.",
      errorInvalidEmail: "Enter a valid email.",
      errorPasswordMin: "Password must be at least 6 characters.",
      errorPasswordRepeat: "Passwords do not match.",
      errorEmailExists: "This email is already registered.",
      errorInvalidCredentials: "Email or password is incorrect.",
      errorResetUserNotFound: "No account is registered with this email.",
      errorSecurity: "Security support is not available in this browser.",
      resetSuccess: "Password updated. You can sign in with your new password.",
      alreadyRegisteredUser: "Registered user",
    }),
    RU: Object.freeze({
      brand: "aramabul",
      profile: "Профиль",
      close: "Закрыть",
      signupTitle: "Регистрация",
      signupText: "",
      loginTitle: "Войти",
      loginText: "Продолжите с вашим аккаунтом.",
      loginNeedsSignup: "Если вы не зарегистрированы, сначала зарегистрируйтесь.",
      firstName: "Имя",
      lastName: "Фамилия",
      email: "Эл. почта",
      password: "Пароль",
      passwordRepeat: "Повторите пароль",
      signupSubmit: "Регистрация",
      signupLegalNote:
        "Ваши персональные данные обрабатываются в рамках уведомления о защите персональных данных. Нажимая «Регистрация», вы подтверждаете, что прочитали и приняли Политику конфиденциальности.",
      loginSubmit: "Войти",
      forgotPassword: "Забыли пароль",
      rememberEmail: "Запомнить мой e-mail",
      passwordToggleShow: "Показать",
      passwordToggleHide: "Скрыть",
      passwordToggleShowLabel: "Показать пароль",
      passwordToggleHideLabel: "Скрыть пароль",
      resetTitle: "Сбросить пароль",
      resetText: "Подтвердите e-mail и задайте новый пароль.",
      resetSubmit: "Сбросить пароль",
      resetBackToLogin: "Назад ко входу",
      forgotPasswordSending: "Отправка ссылки...",
      forgotPasswordSent: "Ссылка для смены пароля отправлена на ваш e-mail.",
      forgotPasswordLogAt: "Время",
      forgotPasswordLogIp: "IP",
      forgotPasswordRateLimited: "Слишком много запросов. Попробуйте позже.",
      forgotPasswordServiceUnavailable: "Почтовый сервис временно недоступен.",
      forgotPasswordFailed: "Не удалось отправить ссылку для смены пароля.",
      errorNameMin: "Имя и фамилия должны быть не короче 2 символов.",
      errorInvalidEmail: "Введите корректный email.",
      errorPasswordMin: "Пароль должен быть не короче 6 символов.",
      errorPasswordRepeat: "Пароли не совпадают.",
      errorEmailExists: "Этот email уже зарегистрирован.",
      errorInvalidCredentials: "Неверный email или пароль.",
      errorResetUserNotFound: "Аккаунт с таким e-mail не найден.",
      errorSecurity: "В браузере нет нужной защиты.",
      resetSuccess: "Пароль обновлен. Теперь вы можете войти с новым паролем.",
      alreadyRegisteredUser: "Зарегистрированный пользователь",
    }),
    DE: Object.freeze({
      brand: "aramabul",
      profile: "Profil",
      close: "Schließen",
      signupTitle: "Registrieren",
      signupText: "",
      loginTitle: "Anmelden",
      loginText: "Mit deinem Konto weitermachen.",
      loginNeedsSignup: "Noch nicht registriert? Bitte zuerst registrieren.",
      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      password: "Passwort",
      passwordRepeat: "Passwort wiederholen",
      signupSubmit: "Registrieren",
      signupLegalNote:
        "Deine personenbezogenen Daten werden im Rahmen des Hinweises zum Schutz personenbezogener Daten verarbeitet. Mit Klick auf „Registrieren“ bestaetigst du, dass du die Datenschutzerklaerung gelesen und akzeptiert hast.",
      loginSubmit: "Anmelden",
      forgotPassword: "Passwort vergessen",
      rememberEmail: "Meine E-Mail merken",
      passwordToggleShow: "Anzeigen",
      passwordToggleHide: "Verbergen",
      passwordToggleShowLabel: "Passwort anzeigen",
      passwordToggleHideLabel: "Passwort verbergen",
      resetTitle: "Passwort zurücksetzen",
      resetText: "Bestätige deine E-Mail und lege ein neues Passwort fest.",
      resetSubmit: "Passwort zurücksetzen",
      resetBackToLogin: "Zurück zur Anmeldung",
      forgotPasswordSending: "Link wird gesendet...",
      forgotPasswordSent: "Der Link zur Passwortaenderung wurde an deine E-Mail gesendet.",
      forgotPasswordLogAt: "Zeit",
      forgotPasswordLogIp: "IP",
      forgotPasswordRateLimited: "Zu viele Anfragen. Bitte spaeter erneut versuchen.",
      forgotPasswordServiceUnavailable: "E-Mail-Dienst ist derzeit nicht verfuegbar.",
      forgotPasswordFailed: "Link zur Passwortaenderung konnte nicht gesendet werden.",
      errorNameMin: "Vorname und Nachname muessen mindestens 2 Zeichen lang sein.",
      errorInvalidEmail: "Gib eine gueltige E-Mail ein.",
      errorPasswordMin: "Das Passwort muss mindestens 6 Zeichen lang sein.",
      errorPasswordRepeat: "Die Passwoerter stimmen nicht ueberein.",
      errorEmailExists: "Diese E-Mail ist schon registriert.",
      errorInvalidCredentials: "E-Mail oder Passwort ist falsch.",
      errorResetUserNotFound: "Kein Konto mit dieser E-Mail gefunden.",
      errorSecurity: "Sicherheitsunterstuetzung ist nicht verfuegbar.",
      resetSuccess: "Passwort aktualisiert. Du kannst dich jetzt mit dem neuen Passwort anmelden.",
      alreadyRegisteredUser: "Registrierter Benutzer",
    }),
    ZH: Object.freeze({
      brand: "aramabul",
      profile: "个人资料",
      close: "关闭",
      signupTitle: "注册",
      signupText: "",
      loginTitle: "登录",
      loginText: "使用已有账号继续。",
      loginNeedsSignup: "如果你还未注册，请先注册再登录。",
      firstName: "名字",
      lastName: "姓氏",
      email: "邮箱",
      password: "密码",
      passwordRepeat: "重复密码",
      signupSubmit: "注册",
      signupLegalNote:
        "你的个人数据将根据个人数据保护说明进行处理。点击“注册”即表示你已阅读并接受隐私政策。",
      loginSubmit: "登录",
      forgotPassword: "忘记密码",
      rememberEmail: "记住我的邮箱",
      passwordToggleShow: "显示",
      passwordToggleHide: "隐藏",
      passwordToggleShowLabel: "显示密码",
      passwordToggleHideLabel: "隐藏密码",
      resetTitle: "重置密码",
      resetText: "确认邮箱后设置新密码。",
      resetSubmit: "重置密码",
      resetBackToLogin: "返回登录",
      forgotPasswordSending: "正在发送链接...",
      forgotPasswordSent: "密码修改链接已发送到你的邮箱。",
      forgotPasswordLogAt: "时间",
      forgotPasswordLogIp: "IP",
      forgotPasswordRateLimited: "请求过多，请稍后再试。",
      forgotPasswordServiceUnavailable: "邮件服务暂时不可用。",
      forgotPasswordFailed: "发送密码修改链接失败。",
      errorNameMin: "名字和姓氏都至少需要 2 个字符。",
      errorInvalidEmail: "请输入有效邮箱。",
      errorPasswordMin: "密码至少需要 6 个字符。",
      errorPasswordRepeat: "两次密码不一致。",
      errorEmailExists: "该邮箱已被注册。",
      errorInvalidCredentials: "邮箱或密码错误。",
      errorResetUserNotFound: "未找到该邮箱对应的账号。",
      errorSecurity: "当前浏览器缺少安全支持。",
      resetSuccess: "密码已更新。你现在可以使用新密码登录。",
      alreadyRegisteredUser: "已注册用户",
    }),
  });

  let authController = null;
  const REMEMBERED_LOGIN_EMAIL_KEY = "aramabul.auth.login.rememberedEmail.v1";

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

  function authLocale() {
    const language = currentLanguage();
    if (language === "EN") {
      return "en-US";
    }
    if (language === "RU") {
      return "ru-RU";
    }
    if (language === "DE") {
      return "de-DE";
    }
    if (language === "ZH") {
      return "zh-CN";
    }
    return "tr-TR";
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

  function readRememberedLoginEmail() {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.readStorageValue !== "function") {
      return "";
    }
    return normalizeEmail(appRuntime.readStorageValue(REMEMBERED_LOGIN_EMAIL_KEY) || "");
  }

  function writeRememberedLoginEmail(email) {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.writeStorageValue !== "function") {
      return;
    }
    appRuntime.writeStorageValue(REMEMBERED_LOGIN_EMAIL_KEY, normalizeEmail(email));
  }

  function clearRememberedLoginEmail() {
    const appRuntime = runtime();
    if (!appRuntime || typeof appRuntime.removeStorageValue !== "function") {
      return;
    }
    appRuntime.removeStorageValue(REMEMBERED_LOGIN_EMAIL_KEY);
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLocaleLowerCase("en-US");
  }

  function passwordEyeIconMarkup(isVisible) {
    if (isVisible) {
      return `
        <svg class="auth-password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6"></path>
          <circle cx="12" cy="12" r="2.8"></circle>
        </svg>
      `;
    }

    return `
      <svg class="auth-password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6"></path>
        <path d="M4 4l16 16"></path>
      </svg>
    `;
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
      <div class="auth-modal-panel" role="dialog" aria-modal="true" aria-label="${copy.brand}">
        <button id="globalAuthModalClose" class="auth-modal-close" type="button" aria-label="${copy.close}">×</button>
        <div id="globalAuthModeTabs" class="auth-mode-tabs" role="tablist" aria-label="${copy.brand}">
          <button id="globalAuthTabLogin" class="auth-mode-tab" type="button" role="tab">${copy.loginTitle}</button>
          <button id="globalAuthTabSignup" class="auth-mode-tab" type="button" role="tab">${copy.signupTitle}</button>
        </div>
        <form id="globalLoginForm" class="auth-form is-hidden" novalidate>
          <label>
            <span id="globalLoginEmailLabel">${copy.email}</span>
            <input id="globalLoginEmail" type="email" autocomplete="email" required />
          </label>
          <label>
            <span id="globalLoginPasswordLabel">${copy.password}</span>
            <div class="auth-password-field">
              <input id="globalLoginPassword" type="password" autocomplete="current-password" required />
              <button
                id="globalLoginPasswordToggle"
                class="auth-password-toggle"
                type="button"
                aria-pressed="false"
                aria-label="${copy.passwordToggleShowLabel}"
              >${passwordEyeIconMarkup(false)}</button>
            </div>
          </label>
          <div class="auth-form-inline-row">
            <label class="auth-checkbox-label" for="globalLoginRememberEmail">
              <input id="globalLoginRememberEmail" type="checkbox" />
              <span id="globalLoginRememberEmailLabel">${copy.rememberEmail}</span>
            </label>
            <button id="globalForgotPasswordBtn" class="auth-inline-link auth-inline-link-compact" type="button">
              ${copy.forgotPassword}
            </button>
          </div>
          <button id="globalLoginSubmit" class="auth-submit" type="submit">${copy.loginSubmit}</button>
        </form>
        <form id="globalResetForm" class="auth-form is-hidden" novalidate>
          <label>
            <span id="globalResetEmailLabel">${copy.email}</span>
            <input id="globalResetEmail" type="email" autocomplete="email" required />
          </label>
          <label>
            <span id="globalResetPasswordLabel">${copy.password}</span>
            <input id="globalResetPassword" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <label>
            <span id="globalResetPasswordRepeatLabel">${copy.passwordRepeat}</span>
            <input id="globalResetPasswordRepeat" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <button id="globalResetSubmit" class="auth-submit" type="submit">${copy.resetSubmit}</button>
          <button id="globalResetBackToLogin" class="auth-inline-link" type="button">
            ${copy.resetBackToLogin}
          </button>
        </form>
        <button id="globalLoginSignupHint" class="auth-inline-link is-hidden" type="button">
          ${copy.loginNeedsSignup}
        </button>
        <form id="globalSignupForm" class="auth-form" novalidate>
          <label>
            <span id="globalSignupFirstNameLabel">${copy.firstName}</span>
            <input id="globalSignupFirstName" type="text" autocomplete="given-name" required />
          </label>
          <label>
            <span id="globalSignupLastNameLabel">${copy.lastName}</span>
            <input id="globalSignupLastName" type="text" autocomplete="family-name" required />
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
          <p id="globalSignupLegalNote" class="auth-signup-legal-note">${copy.signupLegalNote}</p>
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
    const authModeTabs = modal.querySelector("#globalAuthModeTabs");
    const authTabLogin = modal.querySelector("#globalAuthTabLogin");
    const authTabSignup = modal.querySelector("#globalAuthTabSignup");
    const loginForm = modal.querySelector("#globalLoginForm");
    const resetForm = modal.querySelector("#globalResetForm");
    const signupForm = modal.querySelector("#globalSignupForm");
    const loginEmail = modal.querySelector("#globalLoginEmail");
    const loginPassword = modal.querySelector("#globalLoginPassword");
    const loginPasswordToggle = modal.querySelector("#globalLoginPasswordToggle");
    const loginRememberEmail = modal.querySelector("#globalLoginRememberEmail");
    const forgotPasswordButton = modal.querySelector("#globalForgotPasswordBtn");
    const resetEmail = modal.querySelector("#globalResetEmail");
    const resetPassword = modal.querySelector("#globalResetPassword");
    const resetPasswordRepeat = modal.querySelector("#globalResetPasswordRepeat");
    const resetSubmit = modal.querySelector("#globalResetSubmit");
    const resetBackToLogin = modal.querySelector("#globalResetBackToLogin");
    const signupFirstName = modal.querySelector("#globalSignupFirstName");
    const signupLastName = modal.querySelector("#globalSignupLastName");
    const signupEmail = modal.querySelector("#globalSignupEmail");
    const signupPassword = modal.querySelector("#globalSignupPassword");
    const signupPasswordRepeat = modal.querySelector("#globalSignupPasswordRepeat");
    const signupLegalNote = modal.querySelector("#globalSignupLegalNote");
    const loginSubmit = modal.querySelector("#globalLoginSubmit");
    const loginSignupHint = modal.querySelector("#globalLoginSignupHint");
    const signupSubmit = modal.querySelector("#globalSignupSubmit");
    const labelNodes = {
      close: closeButton,
      loginEmail: modal.querySelector("#globalLoginEmailLabel"),
      loginPassword: modal.querySelector("#globalLoginPasswordLabel"),
      loginRememberEmail: modal.querySelector("#globalLoginRememberEmailLabel"),
      forgotPassword: forgotPasswordButton,
      resetEmail: modal.querySelector("#globalResetEmailLabel"),
      resetPassword: modal.querySelector("#globalResetPasswordLabel"),
      resetPasswordRepeat: modal.querySelector("#globalResetPasswordRepeatLabel"),
      signupFirstName: modal.querySelector("#globalSignupFirstNameLabel"),
      signupLastName: modal.querySelector("#globalSignupLastNameLabel"),
      signupEmail: modal.querySelector("#globalSignupEmailLabel"),
      signupPassword: modal.querySelector("#globalSignupPasswordLabel"),
      signupPasswordRepeat: modal.querySelector("#globalSignupPasswordRepeatLabel"),
      resetBackToLogin,
    };
    const state = {
      mode: "signup",
      lastTrigger: null,
      loginPasswordVisible: false,
    };

    function setMessage(value, isError = false) {
      if (!(message instanceof HTMLElement)) {
        return;
      }

      message.textContent = value;
      message.classList.toggle("auth-message-error", isError);
    }

    function setLoginPasswordVisibility(isVisible, copyOverride = null) {
      if (!(loginPassword instanceof HTMLInputElement) || !(loginPasswordToggle instanceof HTMLButtonElement)) {
        return;
      }

      const copy = copyOverride || authText();
      const nextVisible = Boolean(isVisible);
      state.loginPasswordVisible = nextVisible;
      loginPassword.type = nextVisible ? "text" : "password";
      loginPasswordToggle.innerHTML = passwordEyeIconMarkup(nextVisible);
      loginPasswordToggle.setAttribute(
        "aria-label",
        nextVisible ? copy.passwordToggleHideLabel : copy.passwordToggleShowLabel,
      );
      loginPasswordToggle.setAttribute("aria-pressed", nextVisible ? "true" : "false");
    }

    function setMode(mode) {
      const copy = authText();
      const normalizedMode = mode === "login" || mode === "reset" ? mode : "signup";
      const isLoginMode = normalizedMode === "login";
      const isResetMode = normalizedMode === "reset";
      const isSignupMode = normalizedMode === "signup";
      state.mode = normalizedMode;

      if (loginForm instanceof HTMLElement) {
        loginForm.classList.toggle("is-hidden", !isLoginMode);
      }
      if (resetForm instanceof HTMLElement) {
        resetForm.classList.toggle("is-hidden", !isResetMode);
      }
      if (signupForm instanceof HTMLElement) {
        signupForm.classList.toggle("is-hidden", !isSignupMode);
      }
      if (title instanceof HTMLElement) {
        title.textContent = isLoginMode
          ? copy.loginTitle
          : (isResetMode ? copy.resetTitle : copy.signupTitle);
      }
      if (text instanceof HTMLElement) {
        const nextText = isLoginMode
          ? copy.loginText
          : (isResetMode ? copy.resetText : copy.signupText);
        text.textContent = nextText;
        text.classList.toggle("is-hidden", nextText.length === 0);
      }
      if (loginSignupHint instanceof HTMLElement) {
        loginSignupHint.classList.add("is-hidden");
      }

      if (authModeTabs instanceof HTMLElement) {
        authModeTabs.classList.toggle("is-hidden", isResetMode);
      }
      if (authTabLogin instanceof HTMLButtonElement) {
        authTabLogin.classList.toggle("is-active", isLoginMode);
        authTabLogin.setAttribute("aria-selected", isLoginMode ? "true" : "false");
        authTabLogin.setAttribute("tabindex", isLoginMode ? "0" : "-1");
      }
      if (authTabSignup instanceof HTMLButtonElement) {
        authTabSignup.classList.toggle("is-active", isSignupMode);
        authTabSignup.setAttribute("aria-selected", isSignupMode ? "true" : "false");
        authTabSignup.setAttribute("tabindex", isSignupMode ? "0" : "-1");
      }

      setLoginPasswordVisibility(false, copy);
      setMessage("");
    }

    function syncCopy() {
      const copy = authText();

      if (labelNodes.close instanceof HTMLElement) {
        labelNodes.close.setAttribute("aria-label", copy.close || "Close");
      }
      if (labelNodes.loginEmail instanceof HTMLElement) {
        labelNodes.loginEmail.textContent = copy.email;
      }
      if (labelNodes.loginPassword instanceof HTMLElement) {
        labelNodes.loginPassword.textContent = copy.password;
      }
      if (labelNodes.loginRememberEmail instanceof HTMLElement) {
        labelNodes.loginRememberEmail.textContent = copy.rememberEmail;
      }
      if (labelNodes.forgotPassword instanceof HTMLElement) {
        labelNodes.forgotPassword.textContent = copy.forgotPassword;
      }
      if (labelNodes.resetEmail instanceof HTMLElement) {
        labelNodes.resetEmail.textContent = copy.email;
      }
      if (labelNodes.resetPassword instanceof HTMLElement) {
        labelNodes.resetPassword.textContent = copy.password;
      }
      if (labelNodes.resetPasswordRepeat instanceof HTMLElement) {
        labelNodes.resetPasswordRepeat.textContent = copy.passwordRepeat;
      }
      if (labelNodes.signupFirstName instanceof HTMLElement) {
        labelNodes.signupFirstName.textContent = copy.firstName;
      }
      if (labelNodes.signupLastName instanceof HTMLElement) {
        labelNodes.signupLastName.textContent = copy.lastName;
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
      if (resetSubmit instanceof HTMLElement) {
        resetSubmit.textContent = copy.resetSubmit;
      }
      if (labelNodes.resetBackToLogin instanceof HTMLElement) {
        labelNodes.resetBackToLogin.textContent = copy.resetBackToLogin;
      }
      if (loginSignupHint instanceof HTMLElement) {
        loginSignupHint.textContent = copy.loginNeedsSignup;
      }
      if (signupSubmit instanceof HTMLElement) {
        signupSubmit.textContent = copy.signupSubmit;
      }
      if (signupLegalNote instanceof HTMLElement) {
        signupLegalNote.textContent = copy.signupLegalNote;
      }
      if (authTabLogin instanceof HTMLElement) {
        authTabLogin.textContent = copy.loginTitle;
      }
      if (authTabSignup instanceof HTMLElement) {
        authTabSignup.textContent = copy.signupTitle;
      }

      setMode(state.mode);
    }

    function focusCurrentField() {
      if (state.mode === "login" && loginEmail instanceof HTMLInputElement) {
        loginEmail.focus();
        return;
      }

      if (state.mode === "reset" && resetEmail instanceof HTMLInputElement) {
        resetEmail.focus();
        return;
      }

      if (signupFirstName instanceof HTMLInputElement) {
        signupFirstName.focus();
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

      if (state.mode === "login") {
        const rememberedEmail = readRememberedLoginEmail();
        if (loginEmail instanceof HTMLInputElement) {
          loginEmail.value = rememberedEmail || "";
        }
        if (loginRememberEmail instanceof HTMLInputElement) {
          loginRememberEmail.checked = Boolean(rememberedEmail);
        }
        if (loginPassword instanceof HTMLInputElement) {
          loginPassword.value = "";
        }
      }

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
      if (!email.includes("@") || email.length < 6) {
        setMessage(copy.errorInvalidEmail, true);
        return;
      }
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

      if (loginRememberEmail instanceof HTMLInputElement && loginRememberEmail.checked) {
        writeRememberedLoginEmail(email);
      } else {
        clearRememberedLoginEmail();
      }

      writeSession({
        name: matchedUser.name.trim().slice(0, 40),
        email: normalizeEmail(matchedUser.email),
      });
      close();
    }

    async function handleResetSubmit(event) {
      event.preventDefault();

      if (
        !(resetEmail instanceof HTMLInputElement) ||
        !(resetPassword instanceof HTMLInputElement) ||
        !(resetPasswordRepeat instanceof HTMLInputElement)
      ) {
        return;
      }

      const copy = authText();
      const email = normalizeEmail(resetEmail.value);
      const password = String(resetPassword.value || "");
      const repeated = String(resetPasswordRepeat.value || "");

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
      const index = users.findIndex((user) => normalizeEmail(user.email) === email);
      if (index < 0) {
        setMessage(copy.errorResetUserNotFound, true);
        return;
      }

      const passwordHash = await hashPassword(password);
      if (!passwordHash) {
        setMessage(copy.errorSecurity, true);
        return;
      }

      users[index] = {
        ...users[index],
        passwordHash,
      };
      writeUsers(users);

      setMode("login");
      if (loginEmail instanceof HTMLInputElement) {
        loginEmail.value = email;
      }
      if (loginPassword instanceof HTMLInputElement) {
        loginPassword.value = "";
      }
      if (loginRememberEmail instanceof HTMLInputElement) {
        loginRememberEmail.checked = Boolean(readRememberedLoginEmail());
      }

      setMessage(copy.resetSuccess);
    }

    async function requestPasswordChangeByEmail() {
      if (!(loginEmail instanceof HTMLInputElement) || !(forgotPasswordButton instanceof HTMLButtonElement)) {
        return;
      }

      const copy = authText();
      const email = normalizeEmail(loginEmail.value);
      if (!email.includes("@") || email.length < 6) {
        setMessage(copy.errorInvalidEmail, true);
        loginEmail.focus();
        return;
      }

      forgotPasswordButton.disabled = true;
      setMessage(copy.forgotPasswordSending, false);

      try {
        const response = await fetch("/api/auth/password-change/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload?.ok) {
          if (response.status === 429) {
            setMessage(copy.forgotPasswordRateLimited, true);
            return;
          }
          if (response.status === 503) {
            setMessage(copy.forgotPasswordServiceUnavailable, true);
            return;
          }
          setMessage(copy.forgotPasswordFailed, true);
          return;
        }

        const requestedAtRaw = String(payload?.requestMeta?.requestedAt || "").trim();
        const requestIpRaw = String(payload?.requestMeta?.requestIp || "").trim();
        let requestedAtText = "-";
        if (requestedAtRaw) {
          const timestamp = new Date(requestedAtRaw);
          if (!Number.isNaN(timestamp.getTime())) {
            requestedAtText = new Intl.DateTimeFormat(authLocale(), {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(timestamp);
          }
        }
        const requestIpText = requestIpRaw || "-";
        setMessage(
          `${copy.forgotPasswordSent} ${copy.forgotPasswordLogAt}: ${requestedAtText} | ${copy.forgotPasswordLogIp}: ${requestIpText}`,
          false,
        );
      } catch (_error) {
        setMessage(copy.forgotPasswordFailed, true);
      } finally {
        forgotPasswordButton.disabled = false;
      }
    }

    async function handleSignupSubmit(event) {
      event.preventDefault();

      if (
        !(signupFirstName instanceof HTMLInputElement) ||
        !(signupLastName instanceof HTMLInputElement) ||
        !(signupEmail instanceof HTMLInputElement) ||
        !(signupPassword instanceof HTMLInputElement) ||
        !(signupPasswordRepeat instanceof HTMLInputElement)
      ) {
        return;
      }

      const copy = authText();
      const firstName = signupFirstName.value.trim().slice(0, 20);
      const lastName = signupLastName.value.trim().slice(0, 20);
      const name = `${firstName} ${lastName}`.trim();
      const email = normalizeEmail(signupEmail.value);
      const password = String(signupPassword.value || "");
      const repeated = String(signupPasswordRepeat.value || "");

      if (firstName.length < 2 || lastName.length < 2) {
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
    if (loginPasswordToggle instanceof HTMLButtonElement) {
      loginPasswordToggle.addEventListener("click", (event) => {
        event.preventDefault();
        setLoginPasswordVisibility(!state.loginPasswordVisible);
        if (loginPassword instanceof HTMLInputElement) {
          loginPassword.focus({ preventScroll: true });
        }
      });
    }
    if (authTabLogin instanceof HTMLButtonElement) {
      authTabLogin.addEventListener("click", () => {
        setMode("login");
        window.requestAnimationFrame(focusCurrentField);
      });
    }
    if (authTabSignup instanceof HTMLButtonElement) {
      authTabSignup.addEventListener("click", () => {
        setMode("signup");
        window.requestAnimationFrame(focusCurrentField);
      });
    }
    if (resetForm instanceof HTMLFormElement) {
      resetForm.addEventListener("submit", handleResetSubmit);
    }
    if (signupForm instanceof HTMLFormElement) {
      signupForm.addEventListener("submit", handleSignupSubmit);
    }
    if (forgotPasswordButton instanceof HTMLButtonElement) {
      forgotPasswordButton.addEventListener("click", () => {
        void requestPasswordChangeByEmail();
      });
    }
    if (resetBackToLogin instanceof HTMLButtonElement) {
      resetBackToLogin.addEventListener("click", () => {
        if (resetEmail instanceof HTMLInputElement && loginEmail instanceof HTMLInputElement) {
          loginEmail.value = normalizeEmail(resetEmail.value);
        }
        setMode("login");
        window.requestAnimationFrame(focusCurrentField);
      });
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
    const settingsLink = authNav.querySelector('[data-desktop-auth="settings"]');

    function updateDesktopAuthLabels() {
      const labels = getDesktopAuthLabels();
      const copy = authText();
      const hasSession = Boolean(readSession());

      authNav.setAttribute("aria-label", labels.nav);
      const settingsLabel = labels.settings || labels.profile || copy.profile;
      setDesktopLinkLabel(signinLink, labels.signin);
      setDesktopLinkLabel(settingsLink, settingsLabel);

      if (signinLink instanceof HTMLElement) {
        signinLink.classList.toggle("is-hidden", hasSession);
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
    let navToastNode = null;

    function showBottomNavToast(text) {
      const message = String(text || "").trim();
      if (!message) {
        return;
      }

      if (!(navToastNode instanceof HTMLElement)) {
        navToastNode = document.createElement("div");
        navToastNode.className = "yr-mobile-nav-toast";
        navToastNode.setAttribute("role", "status");
        navToastNode.setAttribute("aria-live", "polite");
        navToastNode.style.position = "fixed";
        navToastNode.style.left = "50%";
        navToastNode.style.bottom = "88px";
        navToastNode.style.transform = "translateX(-50%) translateY(8px)";
        navToastNode.style.opacity = "0";
        navToastNode.style.pointerEvents = "none";
        navToastNode.style.zIndex = "1500";
        navToastNode.style.padding = "8px 12px";
        navToastNode.style.borderRadius = "10px";
        navToastNode.style.background = "#ffffff";
        navToastNode.style.color = "#3f3f3f";
        navToastNode.style.fontSize = "12px";
        navToastNode.style.fontWeight = "600";
        navToastNode.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.22)";
        navToastNode.style.transition = "opacity 180ms ease, transform 180ms ease";
        document.body.appendChild(navToastNode);
      }

      navToastNode.textContent = message;
      navToastNode.style.opacity = "1";
      navToastNode.style.transform = "translateX(-50%) translateY(0)";
      const activeTimer = Number.parseInt(String(navToastNode.dataset.timerId || ""), 10);
      if (Number.isFinite(activeTimer)) {
        window.clearTimeout(activeTimer);
      }
      const timerId = window.setTimeout(() => {
        if (!(navToastNode instanceof HTMLElement)) {
          return;
        }
        navToastNode.style.opacity = "0";
        navToastNode.style.transform = "translateX(-50%) translateY(8px)";
        navToastNode.dataset.timerId = "";
      }, 1300);
      navToastNode.dataset.timerId = String(timerId);
    }

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
          if (readSession()) {
            showBottomNavToast(authText().alreadyRegisteredUser);
            return;
          }
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
