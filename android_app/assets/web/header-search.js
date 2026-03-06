(() => {
  const LANG_STORAGE_KEY = "neredeyenir.selectedLanguage.v1";
  const LANGUAGE_OPTIONS = {
    TR: { htmlLang: "tr" },
    EN: { htmlLang: "en" },
    RU: { htmlLang: "ru" },
    DE: { htmlLang: "de" },
    ZH: { htmlLang: "zh" },
  };
  const SEARCH_BUTTON_TEXT = {
    TR: { idle: "Ara", loading: "Aranıyor..." },
    EN: { idle: "Search", loading: "Searching..." },
    RU: { idle: "Поиск", loading: "Поиск..." },
    DE: { idle: "Suchen", loading: "Suche..." },
    ZH: { idle: "搜索", loading: "搜索中..." },
  };
  const SEARCH_PAGE_BUTTON_TEXT = {
    TR: { idle: "Bul", loading: "Bulunuyor..." },
    EN: { idle: "Find", loading: "Finding..." },
    RU: { idle: "Найти", loading: "Поиск..." },
    DE: { idle: "Finden", loading: "Suche..." },
    ZH: { idle: "查找", loading: "查找中..." },
  };
  const SEARCH_PLACEHOLDER_TEXT = {
    TR: "Ne bulmamı istersin?",
    EN: "What should I find?",
    RU: "Что мне найти?",
    DE: "Was soll ich finden?",
    ZH: "你想让我找什么？",
  };
  const SEARCH_PAGE_PLACEHOLDER_TEXT = {
    TR: "Ne bulmamı istersin?",
    EN: "What should I find?",
    RU: "Что мне найти?",
    DE: "Was soll ich finden?",
    ZH: "你想让我找什么？",
  };
  const SEARCH_FORM_ARIA_TEXT = {
    TR: "Genel arama",
    EN: "General search",
    RU: "Общий поиск",
    DE: "Allgemeine Suche",
    ZH: "通用搜索",
  };
  const SEARCH_INPUT_LABEL_TEXT = {
    TR: "Arama ifadesi",
    EN: "Search query",
    RU: "Поисковый запрос",
    DE: "Suchbegriff",
    ZH: "搜索关键词",
  };
  const SEARCH_PAGE_INPUT_LABEL_TEXT = {
    TR: "Arama ifadesi",
    EN: "Search query",
    RU: "Поисковый запрос",
    DE: "Suchbegriff",
    ZH: "搜索关键词",
  };
  const FOOTER_HEADINGS = {
    TR: { discover: "Keşfet", help: "Yardım" },
    EN: { discover: "Discover", help: "Help" },
    RU: { discover: "Обзор", help: "Помощь" },
    DE: { discover: "Entdecken", help: "Hilfe" },
    ZH: { discover: "探索", help: "帮助" },
  };
  const STATIC_UI_TRANSLATIONS = {
    TR: {},
    EN: {
      "Anasayfa": "Home",
      "Ayarlar": "Settings",
      "Dil Ayarları": "Language Settings",
      "Dil seçenekleri": "Language options",
      "Dil seç": "Choose language",
      "Uygulama metinleri bu seçime göre güncellenir.": "App text updates based on this selection.",
      "Hesap": "Account",
      "Diller": "Languages",
      "Geribildirim": "Feedback",
      "Yardım": "Help",
      "Hakkında": "About",
      "Çıkış yap": "Sign out",
      "Misafir": "Guest",
      "Kayıt ol": "Sign up",
      "Hesabını oluştur ve ayarlarını kaydet.": "Create your account and save your settings.",
      "Ad Soyad": "Full name",
      "E-posta": "Email",
      "Şifre": "Password",
      "Şifre tekrar": "Repeat password",
      "Hesap bilgileri": "Account details",
      "Adını ve e-postanı burada güncelleyebilirsin.": "You can update your name and email here.",
      "Kaydet": "Save",
      "Ne Nerede?": "What and where?",
      "Sen aradığın başlığı seç! Onunla ilgili tüm bilgileri ve yerini bulman için sana yardım edeyim.":
        "Choose the topic you need. I will help you find the details and location.",
      "Yemek": "Food",
      "Kafe": "Cafe",
      "Kuaför": "Hairdresser",
      "Veteriner": "Veterinarian",
      "Eczane": "Pharmacy",
      "Market": "Market",
      "Akaryakıt": "Fuel",
      "Hastane": "Hospital",
      "Banka": "Bank",
      "Otel": "Hotel",
      "Kargo Şubeleri": "Cargo Branches",
      "Noter": "Notary",
      "Aile Sağlığı Merkezi": "Family Health Center",
      "Diş Klinikleri": "Dental Clinics",
      "Duraklar": "Stops",
      "Otopark": "Parking",
      "Hakkımızda": "About us",
      "Sıkça Sorulan Sorular": "FAQ",
    },
    RU: {
      "Anasayfa": "Главная",
      "Ayarlar": "Настройки",
      "Dil Ayarları": "Настройки языка",
      "Dil seçenekleri": "Языковые настройки",
      "Dil seç": "Выберите язык",
      "Uygulama metinleri bu seçime göre güncellenir.": "Тексты приложения обновляются по этому выбору.",
      "Hesap": "Аккаунт",
      "Diller": "Языки",
      "Geribildirim": "Обратная связь",
      "Yardım": "Помощь",
      "Hakkında": "О приложении",
      "Çıkış yap": "Выйти",
      "Misafir": "Гость",
      "Kayıt ol": "Регистрация",
      "Hesabını oluştur ve ayarlarını kaydet.": "Создайте аккаунт и сохраните настройки.",
      "Ad Soyad": "Имя и фамилия",
      "E-posta": "Эл. почта",
      "Şifre": "Пароль",
      "Şifre tekrar": "Повторите пароль",
      "Hesap bilgileri": "Данные аккаунта",
      "Adını ve e-postanı burada güncelleyebilirsin.": "Здесь можно обновить имя и почту.",
      "Kaydet": "Сохранить",
      "Ne Nerede?": "Что и где?",
      "Sen aradığın başlığı seç! Onunla ilgili tüm bilgileri ve yerini bulman için sana yardım edeyim.":
        "Выберите нужную тему. Я помогу найти детали и место.",
      "Yemek": "Еда",
      "Kafe": "Кафе",
      "Kuaför": "Парикмахер",
      "Veteriner": "Ветеринар",
      "Eczane": "Аптека",
      "Market": "Маркет",
      "Akaryakıt": "Топливо",
      "Hastane": "Больница",
      "Banka": "Банк",
      "Otel": "Отель",
      "Kargo Şubeleri": "Отделения доставки",
      "Noter": "Нотариус",
      "Aile Sağlığı Merkezi": "Семейный медцентр",
      "Diş Klinikleri": "Стоматологии",
      "Duraklar": "Остановки",
      "Otopark": "Парковка",
      "Hakkımızda": "О нас",
      "Sıkça Sorulan Sorular": "Частые вопросы",
    },
    DE: {
      "Anasayfa": "Startseite",
      "Ayarlar": "Einstellungen",
      "Dil Ayarları": "Spracheinstellungen",
      "Dil seçenekleri": "Sprachoptionen",
      "Dil seç": "Sprache wählen",
      "Uygulama metinleri bu seçime göre güncellenir.": "Die App-Texte werden nach dieser Auswahl aktualisiert.",
      "Hesap": "Konto",
      "Diller": "Sprachen",
      "Geribildirim": "Feedback",
      "Yardım": "Hilfe",
      "Hakkında": "Info",
      "Çıkış yap": "Abmelden",
      "Misafir": "Gast",
      "Kayıt ol": "Registrieren",
      "Hesabını oluştur ve ayarlarını kaydet.": "Erstelle dein Konto und speichere deine Einstellungen.",
      "Ad Soyad": "Vollständiger Name",
      "E-posta": "E-Mail",
      "Şifre": "Passwort",
      "Şifre tekrar": "Passwort wiederholen",
      "Hesap bilgileri": "Kontodaten",
      "Adını ve e-postanı burada güncelleyebilirsin.": "Hier kannst du deinen Namen und deine E-Mail aktualisieren.",
      "Kaydet": "Speichern",
      "Ne Nerede?": "Was und wo?",
      "Sen aradığın başlığı seç! Onunla ilgili tüm bilgileri ve yerini bulman için sana yardım edeyim.":
        "Wähle das passende Thema. Ich helfe dir, Details und Ort zu finden.",
      "Yemek": "Essen",
      "Kafe": "Café",
      "Kuaför": "Friseur",
      "Veteriner": "Tierarzt",
      "Eczane": "Apotheke",
      "Market": "Markt",
      "Akaryakıt": "Kraftstoff",
      "Hastane": "Krankenhaus",
      "Banka": "Bank",
      "Otel": "Hotel",
      "Kargo Şubeleri": "Filialen",
      "Noter": "Notar",
      "Aile Sağlığı Merkezi": "Familiengesundheitszentrum",
      "Diş Klinikleri": "Zahnkliniken",
      "Duraklar": "Haltestellen",
      "Otopark": "Parkplatz",
      "Hakkımızda": "Über uns",
      "Sıkça Sorulan Sorular": "FAQ",
    },
    ZH: {
      "Anasayfa": "首页",
      "Ayarlar": "设置",
      "Dil Ayarları": "语言设置",
      "Dil seçenekleri": "语言选项",
      "Dil seç": "选择语言",
      "Uygulama metinleri bu seçime göre güncellenir.": "应用文本会根据该选择更新。",
      "Hesap": "账户",
      "Diller": "语言",
      "Geribildirim": "反馈",
      "Yardım": "帮助",
      "Hakkında": "关于",
      "Çıkış yap": "退出",
      "Misafir": "访客",
      "Kayıt ol": "注册",
      "Hesabını oluştur ve ayarlarını kaydet.": "创建账户并保存设置。",
      "Ad Soyad": "姓名",
      "E-posta": "电子邮件",
      "Şifre": "密码",
      "Şifre tekrar": "再次输入密码",
      "Hesap bilgileri": "账户信息",
      "Adını ve e-postanı burada güncelleyebilirsin.": "你可以在这里更新姓名和邮箱。",
      "Kaydet": "保存",
      "Ne Nerede?": "找什么？在哪里？",
      "Sen aradığın başlığı seç! Onunla ilgili tüm bilgileri ve yerini bulman için sana yardım edeyim.":
        "选择你要找的主题。我会帮你找到相关信息和位置。",
      "Yemek": "美食",
      "Kafe": "咖啡馆",
      "Kuaför": "理发店",
      "Veteriner": "兽医",
      "Eczane": "药房",
      "Market": "超市",
      "Akaryakıt": "加油站",
      "Hastane": "医院",
      "Banka": "银行",
      "Otel": "酒店",
      "Kargo Şubeleri": "快递网点",
      "Noter": "公证处",
      "Aile Sağlığı Merkezi": "家庭健康中心",
      "Diş Klinikleri": "牙科诊所",
      "Duraklar": "站点",
      "Otopark": "停车场",
      "Hakkımızda": "关于我们",
      "Sıkça Sorulan Sorular": "常见问题",
    },
  };
  const STATIC_TEXT_NODE_ORIGINALS = new WeakMap();
  const STATIC_ATTRIBUTE_ORIGINALS = new WeakMap();
  const CATEGORY_SEARCH_ROUTES = [
    { href: "keyif.html", keywords: ["yemek", "food", "restoran", "restaurant", "lokanta"] },
    { href: "hizmetler.html", keywords: ["hizmetler", "service", "services"] },
    { href: "kuafor.html", keywords: ["kuafor", "kuaför", "berber", "sac", "saç", "guzellik", "güzellik"] },
    { href: "veteriner.html", keywords: ["veteriner", "vet", "hayvan"] },
    { href: "saglik.html", keywords: ["eczane", "pharmacy", "saglik", "sağlık", "health", "klinik", "clinic"] },
    { href: "market.html", keywords: ["market", "supermarket", "süpermarket", "bakkal"] },
    {
      href: "keyif.html",
      keywords: [
        "keyif",
        "meyhane",
        "meyhaneler",
        "rakı",
        "raki",
        "kafe",
        "cafe",
        "kahve",
        "coffee",
        "espresso",
        "kahvalti",
        "kahvaltı",
        "kebap",
        "doner",
        "döner",
        "pide",
        "lahmacun",
        "cigkofte",
        "çiğ köfte",
      ],
    },
    { href: "hastane.html", keywords: ["hastane", "hospital"] },
    { href: "banka.html", keywords: ["banka", "bank"] },
    { href: "otel.html", keywords: ["otel", "hotel", "konaklama"] },
    { href: "gezi.html", keywords: ["gezi", "seyahat", "ulasim", "ulaşım", "travel", "transport"] },
    { href: "atm.html", keywords: ["atm"] },
    { href: "kargo.html", keywords: ["kargo", "cargo"] },
    { href: "noter.html", keywords: ["noter", "notary"] },
    { href: "asm.html", keywords: ["asm", "aile sagligi", "aile sağlığı", "aile hekimi"] },
    { href: "dis-klinikleri.html", keywords: ["dis", "diş", "dis klinigi", "diş kliniği", "dentist"] },
    { href: "duraklar.html", keywords: ["durak", "duraklar", "otobus", "otobüs", "metro", "tramvay"] },
    { href: "otopark.html", keywords: ["otopark", "park"] },
  ];
  const BOTTOM_NAV_TEXT = {
    TR: {
      nav: "Alt menü",
      home: "Anasayfa",
      search: "Ara",
      signup: "Kayıt",
      profile: "Ayarlar",
      searchPlaceholder: "Ne bulmamı istersin?",
    },
    EN: {
      nav: "Bottom menu",
      home: "Home",
      search: "Search",
      signup: "Sign up",
      profile: "Settings",
      searchPlaceholder: "What should I find?",
    },
    RU: {
      nav: "Нижнее меню",
      home: "Главная",
      search: "Поиск",
      signup: "Регистрация",
      profile: "Настройки",
      searchPlaceholder: "Что мне найти?",
    },
    DE: {
      nav: "Unteres Menü",
      home: "Start",
      search: "Suche",
      signup: "Registrieren",
      profile: "Einstellungen",
      searchPlaceholder: "Was soll ich finden?",
    },
    ZH: {
      nav: "底部菜单",
      home: "首页",
      search: "搜索",
      signup: "注册",
      profile: "设置",
      searchPlaceholder: "你想让我找什么？",
    },
  };
  const THEME_STORAGE_KEY = "neredeyenir.theme.v1";
  const DEFAULT_THEME = "dark";
  const HOVER_CLOSE_DELAY_MS = 180;
  const hoverCloseTimers = new WeakMap();

  function clearHoverCloseTimer(container) {
    if (!container) {
      return;
    }

    const activeTimer = hoverCloseTimers.get(container);
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      hoverCloseTimers.delete(container);
    }
  }

  function scheduleHoverClose(container) {
    if (!container) {
      return;
    }

    clearHoverCloseTimer(container);
    const timerId = window.setTimeout(() => {
      closeLanguageMenu(container);
      hoverCloseTimers.delete(container);
    }, HOVER_CLOSE_DELAY_MS);
    hoverCloseTimers.set(container, timerId);
  }

  function isKnownLanguage(code) {
    return Boolean(code && Object.prototype.hasOwnProperty.call(LANGUAGE_OPTIONS, code));
  }

  function readStoredLanguage() {
    try {
      const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
      const code = String(raw || "").trim().toUpperCase();
      return isKnownLanguage(code) ? code : "TR";
    } catch (_error) {
      return "TR";
    }
  }

  function normalizeTheme(value) {
    const lowered = String(value || "").trim().toLowerCase();
    return lowered === "light" ? "light" : "dark";
  }

  function readStoredTheme() {
    try {
      const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_THEME;
      }
      return normalizeTheme(raw);
    } catch (_error) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(theme, persist = true) {
    const normalized = normalizeTheme(theme);

    if (document.body) {
      document.body.classList.toggle("theme-dark", normalized === "dark");
      document.body.classList.toggle("theme-light", normalized === "light");
    }
    document.documentElement.setAttribute("data-theme", normalized);
    window.NEREDEYENIR_CURRENT_THEME = normalized;

    if (persist) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
      } catch (_error) {
        // Ignore.
      }
    }

    document.dispatchEvent(
      new CustomEvent("neredeyenir:themechange", {
        detail: { theme: normalized },
      }),
    );
  }

  function persistLanguage(code) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch (_error) {
      // Ignore.
    }
  }

  function closeLanguageMenu(container) {
    if (!container) {
      return;
    }

    clearHoverCloseTimer(container);

    const menu = container.querySelector("[data-lang-menu]");
    const trigger = container.querySelector("[data-lang-trigger]");
    if (menu) {
      menu.hidden = true;
    }
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
    }
    container.classList.remove("is-open");
  }

  function closeAllLanguageMenus() {
    const containers = [...document.querySelectorAll("[data-lang-switch]")];
    containers.forEach((container) => {
      closeLanguageMenu(container);
    });
  }

  function openLanguageMenu(container) {
    if (!container) {
      return;
    }

    clearHoverCloseTimer(container);

    const menu = container.querySelector("[data-lang-menu]");
    const trigger = container.querySelector("[data-lang-trigger]");
    if (!menu || !trigger) {
      return;
    }

    closeAllLanguageMenus();
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    container.classList.add("is-open");
  }

  function applyLanguage(code, persist = true) {
    const selectedCode = isKnownLanguage(code) ? code : "TR";
    document.documentElement.lang = LANGUAGE_OPTIONS[selectedCode].htmlLang;
    window.NEREDEYENIR_CURRENT_LANGUAGE = selectedCode;

    const switches = [...document.querySelectorAll("[data-lang-switch]")];
    switches.forEach((container) => {
      const current = container.querySelector("[data-lang-current]");
      if (current) {
        current.textContent = selectedCode;
      }

      const options = [...container.querySelectorAll("[data-lang-option]")];
      options.forEach((option) => {
        const optionCode = String(option.dataset.langOption || "").toUpperCase();
        const isActive = optionCode === selectedCode;
        option.classList.toggle("active", isActive);
        option.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });

    if (persist) {
      persistLanguage(selectedCode);
    }

    document.dispatchEvent(
      new CustomEvent("neredeyenir:languagechange", {
        detail: { language: selectedCode },
      }),
    );
  }

  function initializeLanguageSwitcher() {
    const switches = [...document.querySelectorAll("[data-lang-switch]")];
    applyLanguage(readStoredLanguage(), false);

    if (switches.length === 0) {
      return;
    }

    switches.forEach((container) => {
      const trigger = container.querySelector("[data-lang-trigger]");
      const menu = container.querySelector("[data-lang-menu]");
      const options = [...container.querySelectorAll("[data-lang-option]")];

      if (!trigger || !menu || options.length === 0) {
        return;
      }

      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (menu.hidden) {
          openLanguageMenu(container);
          return;
        }

        closeLanguageMenu(container);
      });

      container.addEventListener("mouseenter", () => {
        clearHoverCloseTimer(container);
        openLanguageMenu(container);
      });

      container.addEventListener("mouseleave", () => {
        scheduleHoverClose(container);
      });

      menu.addEventListener("mouseenter", () => {
        clearHoverCloseTimer(container);
      });

      trigger.addEventListener("focus", () => {
        openLanguageMenu(container);
      });

      container.addEventListener("focusout", (event) => {
        const nextFocus = event.relatedTarget;
        if (nextFocus && container.contains(nextFocus)) {
          return;
        }

        closeLanguageMenu(container);
      });

      options.forEach((option) => {
        option.addEventListener("click", () => {
          const selected = String(option.dataset.langOption || "").toUpperCase();
          applyLanguage(selected, true);
          closeLanguageMenu(container);
        });
      });
    });

    document.addEventListener("click", (event) => {
      if (event.target && event.target.closest("[data-lang-switch]")) {
        return;
      }
      closeAllLanguageMenus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllLanguageMenus();
      }
    });
  }

  window.NEREDEYENIR_GET_LANGUAGE = () => {
    const code = String(window.NEREDEYENIR_CURRENT_LANGUAGE || "").toUpperCase();
    if (isKnownLanguage(code)) {
      return code;
    }

    return readStoredLanguage();
  };
  window.NEREDEYENIR_GET_THEME = () => {
    return normalizeTheme(window.NEREDEYENIR_CURRENT_THEME || readStoredTheme());
  };
  window.NEREDEYENIR_SET_THEME = (theme) => {
    applyTheme(theme, true);
  };

  function getStaticUiTranslation(sourceText, lang) {
    const normalizedText = String(sourceText || "").trim();
    if (!normalizedText || lang === "TR") {
      return normalizedText;
    }

    const translations = STATIC_UI_TRANSLATIONS[lang] || STATIC_UI_TRANSLATIONS.TR;
    return translations[normalizedText] || normalizedText;
  }

  function translatePreservingWhitespace(sourceText, lang) {
    const rawText = String(sourceText || "");
    const leadingWhitespace = rawText.match(/^\s*/u)?.[0] || "";
    const trailingWhitespace = rawText.match(/\s*$/u)?.[0] || "";
    const coreText = rawText.trim();
    if (!coreText) {
      return rawText;
    }

    const translatedCore = getStaticUiTranslation(coreText, lang);
    return `${leadingWhitespace}${translatedCore}${trailingWhitespace}`;
  }

  function shouldSkipStaticTextNode(node) {
    const parent = node.parentElement;
    if (!parent) {
      return true;
    }

    const tagName = parent.tagName;
    if (tagName === "SCRIPT" || tagName === "STYLE" || tagName === "NOSCRIPT" || tagName === "TEXTAREA") {
      return true;
    }

    if (
      parent.closest(
        ".yr-logo, .brand-wordmark, .header-search, .language-option-code, script, style, noscript, textarea",
      )
    ) {
      return true;
    }

    return false;
  }

  function applyStaticPageTranslations() {
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();

    if (!document.body) {
      return;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !String(node.nodeValue || "").trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return shouldSkipStaticTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      const originalText = STATIC_TEXT_NODE_ORIGINALS.get(currentNode) || currentNode.nodeValue;
      STATIC_TEXT_NODE_ORIGINALS.set(currentNode, originalText);
      const translatedText = translatePreservingWhitespace(originalText, lang);
      if (currentNode.nodeValue !== translatedText) {
        currentNode.nodeValue = translatedText;
      }
      currentNode = walker.nextNode();
    }

    const attributeTargets = [...document.querySelectorAll("[placeholder], [aria-label], [title]")];
    attributeTargets.forEach((element) => {
      const originalValues = STATIC_ATTRIBUTE_ORIGINALS.get(element) || {};

      ["placeholder", "aria-label", "title"].forEach((attributeName) => {
        if (!element.hasAttribute(attributeName)) {
          return;
        }

        const sourceValue =
          typeof originalValues[attributeName] === "string"
            ? originalValues[attributeName]
            : element.getAttribute(attributeName) || "";

        originalValues[attributeName] = sourceValue;
        const translatedValue = translatePreservingWhitespace(sourceValue, lang);
        if (translatedValue !== sourceValue || lang === "TR") {
          element.setAttribute(attributeName, translatedValue);
        }
      });

      STATIC_ATTRIBUTE_ORIGINALS.set(element, originalValues);
    });

    if (!document.documentElement.dataset.originalTitle) {
      document.documentElement.dataset.originalTitle = document.title;
    }

    const originalTitle = document.documentElement.dataset.originalTitle || "";
    if (originalTitle) {
      const [brandPrefix, rawSuffix] = originalTitle.split("|").map((part) => part.trim());
      if (brandPrefix && rawSuffix) {
        document.title = `${brandPrefix} | ${getStaticUiTranslation(rawSuffix, lang)}`;
      }
    }
  }

  function normalizeFooterUi() {
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();
    const headings = FOOTER_HEADINGS[lang] || FOOTER_HEADINGS.TR;
    const footerGrids = [...document.querySelectorAll(".yr-footer-grid")];

    footerGrids.forEach((grid) => {
      const columns = [...grid.querySelectorAll(":scope > .yr-footer-col")];
      if (columns.length > 3) {
        columns.slice(3).forEach((column) => {
          column.remove();
        });
      }

      const visibleColumns = [...grid.querySelectorAll(":scope > .yr-footer-col")];

      const firstTitle = visibleColumns[0]?.querySelector("h4");
      if (firstTitle) {
        firstTitle.remove();
      }

      const discoverTitle = visibleColumns[1]?.querySelector("h4");
      if (discoverTitle) {
        discoverTitle.textContent = headings.discover;
      }

      const helpTitle = visibleColumns[2]?.querySelector("h4");
      if (helpTitle) {
        helpTitle.textContent = headings.help;
      }
    });
  }

  initializeLanguageSwitcher();
  applyTheme(readStoredTheme(), false);
  applyStaticPageTranslations();
  normalizeFooterUi();
  window.addEventListener("load", () => {
    applyStaticPageTranslations();
    normalizeFooterUi();
  });

  function initializeFooterComingSoonNotice() {
    const footer = document.querySelector(".yr-footer");
    if (!(footer instanceof HTMLElement)) {
      return;
    }

    const links = footer.querySelectorAll(".store-badge, .yr-footer-social a");
    if (!links.length) {
      return;
    }

    let toastNode = document.querySelector(".yr-coming-soon-toast");
    const ensureToast = () => {
      if (toastNode instanceof HTMLElement) {
        return toastNode;
      }

      toastNode = document.createElement("div");
      toastNode.className = "yr-coming-soon-toast";
      toastNode.textContent = "Yakında hizmete girecektir.";
      toastNode.setAttribute("role", "status");
      toastNode.setAttribute("aria-live", "polite");
      toastNode.style.position = "fixed";
      toastNode.style.left = "50%";
      toastNode.style.bottom = "24px";
      toastNode.style.transform = "translateX(-50%) translateY(12px)";
      toastNode.style.opacity = "0";
      toastNode.style.pointerEvents = "none";
      toastNode.style.zIndex = "9999";
      toastNode.style.padding = "10px 14px";
      toastNode.style.borderRadius = "10px";
      toastNode.style.background = "#ffffff";
      toastNode.style.color = "#3f3f3f";
      toastNode.style.fontSize = "12px";
      toastNode.style.fontWeight = "600";
      toastNode.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.28)";
      toastNode.style.transition = "opacity 180ms ease, transform 180ms ease";
      document.body.append(toastNode);
      return toastNode;
    };

    const showNotice = () => {
      const node = ensureToast();
      node.style.opacity = "1";
      node.style.transform = "translateX(-50%) translateY(0)";
      const activeTimer = Number.parseInt(String(node.dataset.timerId || ""), 10);
      if (Number.isFinite(activeTimer)) {
        window.clearTimeout(activeTimer);
      }
      const timerId = window.setTimeout(() => {
        node.style.opacity = "0";
        node.style.transform = "translateX(-50%) translateY(12px)";
        node.dataset.timerId = "";
      }, 1800);
      node.dataset.timerId = String(timerId);
    };

    links.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || link.dataset.comingSoonBound === "1") {
        return;
      }
      link.dataset.comingSoonBound = "1";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showNotice();
      });
    });
  }

  initializeFooterComingSoonNotice();

  const form = document.querySelector(".header-search");
  if (!form) {
    return;
  }

  const input = form.querySelector(".header-search-input");
  const submitButton = form.querySelector(".header-search-btn");
  if (!input || !submitButton) {
    return;
  }

  function setSubmitButtonLabel(label) {
    const labelNode = submitButton.querySelector(".header-search-btn-text");
    if (labelNode) {
      labelNode.textContent = label;
      return;
    }
    submitButton.textContent = label;
  }

  const inputLabel = form.querySelector('label[for="headerSearchInput"]');
  function currentPageName() {
    const raw = window.location.pathname.split("/").pop() || "index.html";
    return raw.toLocaleLowerCase("tr");
  }

  function hideTopLayerForCategoryPages() {
    const categoryPage = String(document.body?.dataset?.categoryPage || "").toLocaleLowerCase("tr");
    const pageName = currentPageName();
    const categoryRootPages = new Set([
      "hizmetler.html",
      "kuafor.html",
      "veteriner.html",
      "saglik.html",
      "market.html",
      "keyif.html",
      "hastane.html",
      "banka.html",
      "otel.html",
      "gezi.html",
      "atm.html",
      "kargo.html",
      "noter.html",
      "asm.html",
      "dis-klinikleri.html",
      "duraklar.html",
      "otopark.html",
    ]);
    const shouldHideHeader =
      categoryPage === "city" ||
      categoryPage === "district" ||
      pageName === "city.html" ||
      pageName.endsWith("-city.html") ||
      pageName.endsWith("-district.html") ||
      categoryRootPages.has(pageName);

    if (!shouldHideHeader) {
      return;
    }

    const headers = document.querySelectorAll(".city-header");
    headers.forEach((headerElement) => {
      if (!(headerElement instanceof HTMLElement)) {
        return;
      }
      headerElement.style.display = "none";
      headerElement.hidden = true;
    });
  }

  function isHomePage() {
    return currentPageName() === "index.html" || currentPageName() === "";
  }

  function syncHomeAltbarVisibility() {
    const homeAltbar = document.querySelector(".home-altbar-inline");
    if (!(homeAltbar instanceof HTMLElement)) {
      return;
    }

    const shouldShow = isHomePage() && window.matchMedia("(max-width: 1200px)").matches;
    homeAltbar.style.display = shouldShow ? "flex" : "none";
  }

  function getNavLabels() {
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();
    return BOTTOM_NAV_TEXT[lang] || BOTTOM_NAV_TEXT.TR;
  }

  function createMobileBottomNav() {
    if (isHomePage()) {
      return;
    }

    const existing = document.querySelector(".mobile-bottom-nav");
    if (existing) {
      return;
    }

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
      const params = new URLSearchParams(window.location.search);
      const signupMode = currentPageName() === "profile.html" && params.get("action") === "signup";
      buttons.forEach((button) => {
        const type = button.dataset.mobileNav;
        const active =
          (type === "home" && isHomePage()) ||
          (type === "search" && currentPageName() === "search.html") ||
          (type === "signup" && signupMode) ||
          (type === "profile" && currentPageName() === "profile.html" && !signupMode) ||
          false;
        button.classList.toggle("active", active);
      });
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.mobileNav;
        const params = new URLSearchParams(window.location.search);
        const isProfilePage = currentPageName() === "profile.html";
        const actionMode = params.get("action");

        if (type === "home") {
          window.location.assign("index.html");
          return;
        }

        if (type === "search") {
          if (currentPageName() !== "search.html") {
            window.location.assign("search.html");
            return;
          }
          input.focus();
          input.select();
          updateActiveNav();
          return;
        }

        if (type === "signup") {
          if (!isProfilePage || actionMode !== "signup") {
            window.location.assign("profile.html?action=signup");
          }
          return;
        }

        if (type === "profile") {
          if (!isProfilePage || actionMode === "signup") {
            window.location.assign("profile.html?action=profile");
          }
          return;
        }
      });
    });

    document.addEventListener("neredeyenir:languagechange", () => {
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

  function applySearchUiLanguage() {
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();

    const isSearchPage = currentPageName() === "search.html";
    const buttonText = isSearchPage
      ? SEARCH_PAGE_BUTTON_TEXT[lang] || SEARCH_PAGE_BUTTON_TEXT.TR
      : SEARCH_BUTTON_TEXT[lang] || SEARCH_BUTTON_TEXT.TR;
    const placeholderText = isSearchPage
      ? SEARCH_PAGE_PLACEHOLDER_TEXT[lang] || SEARCH_PAGE_PLACEHOLDER_TEXT.TR
      : SEARCH_PLACEHOLDER_TEXT[lang] || SEARCH_PLACEHOLDER_TEXT.TR;
    const formAriaText = SEARCH_FORM_ARIA_TEXT[lang] || SEARCH_FORM_ARIA_TEXT.TR;
    const inputLabelText = isSearchPage
      ? SEARCH_PAGE_INPUT_LABEL_TEXT[lang] || SEARCH_PAGE_INPUT_LABEL_TEXT.TR
      : SEARCH_INPUT_LABEL_TEXT[lang] || SEARCH_INPUT_LABEL_TEXT.TR;

    form.setAttribute("aria-label", formAriaText);
    input.setAttribute("placeholder", placeholderText);
    setSubmitButtonLabel(buttonText.idle);

    if (inputLabel) {
      inputLabel.textContent = inputLabelText;
    }
  }

  applySearchUiLanguage();
  hideTopLayerForCategoryPages();
  syncHomeAltbarVisibility();
  window.addEventListener("resize", syncHomeAltbarVisibility);
  createMobileBottomNav();
  document.addEventListener("neredeyenir:languagechange", () => {
    applySearchUiLanguage();
    applyStaticPageTranslations();
    window.requestAnimationFrame(() => {
      normalizeFooterUi();
    });
  });

  const VENUES_JSON_PATH = "data/venues.json";
  const FOOD_JSON_PATH = "data/keyif-food.json";
  const DISTRICTS_JSON_PATH = "data/districts.json";
  const CATEGORY_DATASET_SOURCES = [
    {
      pageBase: "kuafor",
      dataPath: "data/kuafor.json",
      fallbacks: [{ globalKey: "NEREDEYENIR_FALLBACK_DATA", property: "kuafor" }],
    },
    {
      pageBase: "veteriner",
      dataPath: "data/veteriner.json",
      fallbacks: [{ globalKey: "NEREDEYENIR_FALLBACK_CATEGORY_DATA", property: "veteriner" }],
    },
    {
      pageBase: "eczane",
      dataPath: "data/eczane.json",
      fallbacks: [{ globalKey: "NEREDEYENIR_FALLBACK_CATEGORY_DATA", property: "eczane" }],
    },
    { pageBase: "eczane", dataPath: "data/nobetci-eczane.json", fallbacks: [] },
    {
      pageBase: "keyif",
      dataPath: "data/keyif.json",
      fallbacks: [],
    },
    { pageBase: "keyif", dataPath: "data/keyif-restoran.json", fallbacks: [] },
    { pageBase: "atm", dataPath: "data/atm.json", fallbacks: [] },
    { pageBase: "kargo", dataPath: "data/kargo.json", fallbacks: [] },
    { pageBase: "noter", dataPath: "data/noter.json", fallbacks: [] },
    { pageBase: "asm", dataPath: "data/asm.json", fallbacks: [] },
    { pageBase: "dis-klinikleri", dataPath: "data/dis-klinikleri.json", fallbacks: [] },
    { pageBase: "duraklar", dataPath: "data/duraklar.json", fallbacks: [] },
    { pageBase: "otopark", dataPath: "data/otopark.json", fallbacks: [] },
  ];
  const DISTRICT_ROUTE_PAGE_BASES = new Set([
    "yemek",
    "hizmetler",
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const CITY_ROUTE_PAGE_BASES = new Set([
    "yemek",
    "hizmetler",
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const API_BASE_URL = (() => {
    if (typeof window.NEREDEYENIR_API_BASE === "string" && window.NEREDEYENIR_API_BASE.trim()) {
      return window.NEREDEYENIR_API_BASE.trim().replace(/\/+$/u, "");
    }

    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
      return `${window.location.protocol}//${window.location.hostname}:8787`;
    }

    return window.location.origin;
  })();
  const VENUES_API_ENDPOINT =
    typeof window.NEREDEYENIR_VENUES_API === "string" && window.NEREDEYENIR_VENUES_API.trim()
      ? window.NEREDEYENIR_VENUES_API.trim()
      : API_BASE_URL
        ? `${API_BASE_URL}/api/venues?limit=50000`
        : "";
  const turkishCharMap = {
    ç: "c",
    ğ: "g",
    ı: "i",
    i: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };

  let venuesPromise = null;
  let searchRecordsPromise = null;
  let cityNamesPromise = null;

  function normalizeForSearch(value) {
    return String(value || "")
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
      .normalize("NFC");
  }

  function canonicalize(value) {
    return normalizeForSearch(value)
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toSlug(value) {
    return normalizeForSearch(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function sanitizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function normalizeVenueRecord(record, options = {}) {
    if (!record || typeof record !== "object") {
      return null;
    }

    const name = sanitizeText(record.name);
    const city = sanitizeText(record.city);
    const district = sanitizeText(record.district);
    const address = sanitizeText(record.address);
    const sourcePlaceId = sanitizeText(record.sourcePlaceId || record.placeId);
    const pageBase = sanitizeText(options.pageBase || "yemek");

    if (!name) {
      return null;
    }

    return {
      name,
      city,
      district,
      address,
      sourcePlaceId,
      pageBase,
      openAsRestaurant: Boolean(options.openAsRestaurant),
      canonicalName: canonicalize(name),
      canonicalSearchBlob: canonicalize([name, city, district, address, pageBase].join(" ")),
    };
  }

  function normalizeVenueCollection(payload, options = {}) {
    if (Array.isArray(payload)) {
      return payload.map((record) => normalizeVenueRecord(record, options)).filter((venue) => venue !== null);
    }

    if (payload && typeof payload === "object") {
      const collection = Array.isArray(payload.venues)
        ? payload.venues
        : Array.isArray(payload.data)
          ? payload.data
          : null;

      if (collection) {
        return collection.map((record) => normalizeVenueRecord(record, options)).filter((venue) => venue !== null);
      }
    }

    return [];
  }

  function dedupeVenueRecords(records) {
    const seen = new Set();

    return records.filter((venue) => {
      const pageBase = sanitizeText(venue.pageBase);
      const key = String(venue.sourcePlaceId || "")
        || `${pageBase}|${canonicalize(venue.city)}|${canonicalize(venue.district)}|${venue.canonicalName}`;

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function readFallbackFoodRecords() {
    const payload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const yemekRecords = normalizeVenueCollection(payload.yemek, {
      pageBase: "yemek",
      openAsRestaurant: true,
    });
    const kafeRecords = normalizeVenueCollection(payload.kafe, {
      pageBase: "keyif",
      openAsRestaurant: true,
    });
    return dedupeVenueRecords([...yemekRecords, ...kafeRecords]);
  }

  function readFallbackCollection(globalKey, property) {
    const payload = window[globalKey];
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const collection = payload[property];
    return Array.isArray(collection) ? collection : [];
  }

  async function fetchVenuePayload(path) {
    try {
      const response = await fetch(path, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  async function loadVenues() {
    if (venuesPromise) {
      return venuesPromise;
    }

    venuesPromise = (async () => {
      const foodPayload = await fetchVenuePayload(FOOD_JSON_PATH);
      const bundledRecords = dedupeVenueRecords(
        normalizeVenueCollection(foodPayload, { pageBase: "keyif", openAsRestaurant: true }),
      );

      if (VENUES_API_ENDPOINT) {
        const apiPayload = await fetchVenuePayload(VENUES_API_ENDPOINT);
        const apiRecords = normalizeVenueCollection(apiPayload, {
          pageBase: "keyif",
          openAsRestaurant: true,
        });
        if (apiRecords.length > 0) {
          if (bundledRecords.length > 0) {
            return dedupeVenueRecords([...bundledRecords, ...apiRecords]);
          }
          return apiRecords;
        }
      }

      if (bundledRecords.length > 0) {
        return bundledRecords;
      }

      const fallbackRecords = readFallbackFoodRecords();
      if (fallbackRecords.length > 0) {
        return fallbackRecords;
      }

      const venuesPayload = await fetchVenuePayload(VENUES_JSON_PATH);
      return normalizeVenueCollection(venuesPayload, {
        pageBase: "keyif",
        openAsRestaurant: true,
      });
    })();

    return venuesPromise;
  }

  async function loadCategoryDataset(source) {
    const payload = await fetchVenuePayload(source.dataPath);
    const records = normalizeVenueCollection(payload, { pageBase: source.pageBase });
    if (records.length > 0) {
      return records;
    }

    const fallbackRecords = source.fallbacks.flatMap((fallback) => {
      return normalizeVenueCollection(readFallbackCollection(fallback.globalKey, fallback.property), {
        pageBase: source.pageBase,
      });
    });
    return dedupeVenueRecords(fallbackRecords);
  }

  async function loadSearchRecords() {
    if (searchRecordsPromise) {
      return searchRecordsPromise;
    }

    searchRecordsPromise = (async () => {
      const [foodRecords, categoryCollections] = await Promise.all([
        loadVenues(),
        Promise.all(CATEGORY_DATASET_SOURCES.map((source) => loadCategoryDataset(source))),
      ]);

      return dedupeVenueRecords([...foodRecords, ...categoryCollections.flat()]);
    })();

    return searchRecordsPromise;
  }

  function fallbackDistrictMap() {
    const payload = window.NEREDEYENIR_FALLBACK_DATA;
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const districts = payload.districts;
    if (!districts || typeof districts !== "object" || Array.isArray(districts)) {
      return null;
    }

    return districts;
  }

  async function loadCityNames() {
    if (cityNamesPromise) {
      return cityNamesPromise;
    }

    cityNamesPromise = (async () => {
      const fallbackMap = fallbackDistrictMap();
      if (fallbackMap) {
        return Object.keys(fallbackMap);
      }

      const payload = await fetchVenuePayload(DISTRICTS_JSON_PATH);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return [];
      }

      return Object.keys(payload);
    })();

    return cityNamesPromise;
  }

  async function findMatchingCityName(rawQuery) {
    const canonicalQuery = canonicalize(rawQuery);
    if (!canonicalQuery) {
      return "";
    }

    const cityNames = await loadCityNames();
    if (cityNames.length === 0) {
      return "";
    }

    const exact = cityNames.find((city) => canonicalize(city) === canonicalQuery);
    if (exact) {
      return exact;
    }

    if (canonicalQuery.length < 3) {
      return "";
    }

    return cityNames.find((city) => {
      const canonicalCity = canonicalize(city);
      return canonicalCity.startsWith(canonicalQuery) || canonicalQuery.startsWith(canonicalCity);
    }) || "";
  }

  function findMatchingRecord(records, query) {
    const canonicalQuery = canonicalize(query);
    if (!canonicalQuery) {
      return null;
    }

    const exactMatch = records.find((record) => record.canonicalName === canonicalQuery);
    if (exactMatch) {
      return exactMatch;
    }

    const prefixMatch = records.find((record) => record.canonicalName.startsWith(canonicalQuery));
    if (prefixMatch) {
      return prefixMatch;
    }

    if (canonicalQuery.length >= 3) {
      const containsMatch = records.find((record) => record.canonicalName.includes(canonicalQuery));
      if (containsMatch) {
        return containsMatch;
      }

      const queryTokens = canonicalQuery.split(" ").filter((token) => token.length >= 2);
      if (queryTokens.length >= 2) {
        return records.find((record) => {
          return queryTokens.every((token) => record.canonicalSearchBlob.includes(token));
        }) || null;
      }
    }

    return null;
  }

  function findMatchingCategoryPage(rawQuery) {
    const canonicalQuery = canonicalize(rawQuery);
    if (!canonicalQuery) {
      return null;
    }

    for (const route of CATEGORY_SEARCH_ROUTES) {
      for (const keyword of route.keywords) {
        if (canonicalize(keyword) === canonicalQuery) {
          return route.href;
        }
      }
    }

    if (canonicalQuery.length < 2) {
      return null;
    }

    for (const route of CATEGORY_SEARCH_ROUTES) {
      for (const keyword of route.keywords) {
        const canonicalKeyword = canonicalize(keyword);
        if (canonicalQuery.includes(canonicalKeyword) || canonicalKeyword.includes(canonicalQuery)) {
          return route.href;
        }
      }
    }

    return null;
  }

  function applyVenueParams(targetUrl, record) {
    if (!(targetUrl instanceof URL) || !record || typeof record !== "object") {
      return;
    }

    if (record.name) {
      targetUrl.searchParams.set("mekan", String(record.name).trim());
    }

    if (record.sourcePlaceId) {
      targetUrl.searchParams.set("pid", String(record.sourcePlaceId).trim());
    }
  }

  function categoryUrlFor(record) {
    const pageBase = sanitizeText(record.pageBase);
    if (!pageBase) {
      return cityUrlFor(record.city || record.name || "");
    }

    if (record.city && record.district && DISTRICT_ROUTE_PAGE_BASES.has(pageBase)) {
      const targetUrl = new URL(`${pageBase}-district.html`, window.location.href);
      targetUrl.searchParams.set("sehir", toSlug(record.city));
      targetUrl.searchParams.set("ilce", toSlug(record.district));
      applyVenueParams(targetUrl, record);
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    if (record.city && CITY_ROUTE_PAGE_BASES.has(pageBase)) {
      const targetUrl = new URL(`${pageBase}-city.html`, window.location.href);
      targetUrl.searchParams.set("sehir", toSlug(record.city));
      applyVenueParams(targetUrl, record);
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    return `${pageBase}.html`;
  }

  function cityUrlFor(rawQuery) {
    const targetUrl = new URL("city.html", window.location.href);
    targetUrl.searchParams.set("il", toSlug(rawQuery));
    return `${targetUrl.pathname}${targetUrl.search}`;
  }

  function setLoadingState(isLoading) {
    const lang =
      typeof window.NEREDEYENIR_GET_LANGUAGE === "function"
        ? window.NEREDEYENIR_GET_LANGUAGE()
        : readStoredLanguage();
    const isSearchPage = currentPageName() === "search.html";
    const labels = isSearchPage
      ? SEARCH_PAGE_BUTTON_TEXT[lang] || SEARCH_PAGE_BUTTON_TEXT.TR
      : SEARCH_BUTTON_TEXT[lang] || SEARCH_BUTTON_TEXT.TR;
    input.disabled = isLoading;
    submitButton.disabled = isLoading;
    setSubmitButtonLabel(isLoading ? labels.loading : labels.idle);
  }

  let searchNotFoundToastApi = null;

  function ensureSearchNotFoundToast() {
    if (searchNotFoundToastApi) {
      return searchNotFoundToastApi;
    }

    if (!document.body) {
      return null;
    }

    const toast = document.createElement("div");
    toast.className = "yr-search-not-found-toast";
    toast.textContent = "Aradığınız kayda ulaşılamamıştır.";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.top = "96px";
    toast.style.bottom = "auto";
    toast.style.transform = "translateX(-50%) translateY(10px)";
    toast.style.opacity = "0";
    toast.style.pointerEvents = "none";
    toast.style.zIndex = "10000";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "10px";
    toast.style.background = "#ffffff";
    toast.style.color = "#3f3f3f";
    toast.style.fontSize = "12px";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.22)";
    toast.style.transition = "opacity 180ms ease, transform 180ms ease";
    document.body.append(toast);

    const show = () => {
      const rect = form.getBoundingClientRect();
      toast.style.left = `${Math.round(rect.left + (rect.width / 2))}px`;
      toast.style.top = `${Math.round(rect.bottom + 10)}px`;
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
      const activeTimer = Number.parseInt(String(toast.dataset.timerId || ""), 10);
      if (Number.isFinite(activeTimer)) {
        window.clearTimeout(activeTimer);
      }
      const timerId = window.setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(10px)";
        toast.dataset.timerId = "";
      }, 1800);
      toast.dataset.timerId = String(timerId);
    };

    searchNotFoundToastApi = { show };
    return searchNotFoundToastApi;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    const matchedCategoryPage = findMatchingCategoryPage(query);
    if (matchedCategoryPage) {
      window.location.assign(matchedCategoryPage);
      return;
    }

    setLoadingState(true);

    try {
      const matchedCity = await findMatchingCityName(query);
      if (matchedCity) {
        window.location.assign(cityUrlFor(matchedCity));
        return;
      }

      const records = await loadSearchRecords();
      const matchedRecord = findMatchingRecord(records, query);

      if (matchedRecord) {
        window.location.assign(categoryUrlFor(matchedRecord));
        return;
      }

      ensureSearchNotFoundToast()?.show();
      input.focus();
    } finally {
      setLoadingState(false);
    }
  });
})();
