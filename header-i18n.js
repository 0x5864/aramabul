(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const FOOTER_HEADINGS = {
    TR: { discover: "Keşfet", help: "Yardım", partners: "İş Ortaklığı" },
    EN: { discover: "Discover", help: "Help", partners: "Partnerships" },
    RU: { discover: "Обзор", help: "Помощь", partners: "Партнерство" },
    DE: { discover: "Entdecken", help: "Hilfe", partners: "Partnerschaft" },
    ZH: { discover: "探索", help: "帮助", partners: "合作" },
  };
  const FOOTER_PAGE_GROUPS = [
    ["footer-page.html?sayfa=app-store", "footer-page.html?sayfa=google-play"],
    [
      "footer-page.html?sayfa=hakkimizda",
      "footer-page.html?sayfa=teknoloji",
      "footer-page.html?sayfa=iletisim",
    ],
    [
      "footer-page.html?sayfa=restoran-ekle",
      "footer-page.html?sayfa=fiyat-ekle",
      "footer-page.html?sayfa=is-birligi",
    ],
    [
      "footer-page.html?sayfa=sss",
      "footer-page.html?sayfa=kvkk",
      "footer-page.html?sayfa=gizlilik",
      "footer-page.html?sayfa=kosullar",
      "footer-page.html?sayfa=cerez",
    ],
  ];
  const FOOTER_SOCIAL_PAGES = [
    "footer-page.html?sayfa=instagram",
    "footer-page.html?sayfa=x",
    "footer-page.html?sayfa=facebook",
  ];
  const FOOTER_SOCIAL_LABELS = ["Instagram", "X", "Facebook"];
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
  const DESKTOP_AUTH_TEXT = {
    TR: {
      nav: "Hesap bağlantıları",
      signup: "Sign up",
      signin: "Sign in",
    },
    EN: {
      nav: "Account links",
      signup: "Sign up",
      signin: "Sign in",
    },
    RU: {
      nav: "Ссылки аккаунта",
      signup: "Sign up",
      signin: "Sign in",
    },
    DE: {
      nav: "Kontolinks",
      signup: "Sign up",
      signin: "Sign in",
    },
    ZH: {
      nav: "账户链接",
      signup: "Sign up",
      signin: "Sign in",
    },
  };

  function currentLanguage() {
    return typeof window.ARAMABUL_GET_LANGUAGE === "function"
      ? window.ARAMABUL_GET_LANGUAGE()
      : runtime.getStoredLanguage();
  }

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
      typeof window.ARAMABUL_GET_LANGUAGE === "function"
        ? window.ARAMABUL_GET_LANGUAGE()
        : runtime.getStoredLanguage();

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
      typeof window.ARAMABUL_GET_LANGUAGE === "function"
        ? window.ARAMABUL_GET_LANGUAGE()
        : runtime.getStoredLanguage();
    const headings = FOOTER_HEADINGS[lang] || FOOTER_HEADINGS.TR;
    const footerGrids = [...document.querySelectorAll(".yr-footer-grid")];

    footerGrids.forEach((grid) => {
      const columns = [...grid.querySelectorAll(":scope > .yr-footer-col")];
      if (columns.length > 4) {
        columns.slice(4).forEach((column) => {
          column.remove();
        });
      }

      if (
        !grid.dataset.footerColumnsReordered &&
        columns[2] &&
        columns[3] &&
        columns[2].parentNode === grid
      ) {
        grid.insertBefore(columns[3], columns[2]);
        grid.dataset.footerColumnsReordered = "true";
      }

      const visibleColumns = [...grid.querySelectorAll(":scope > .yr-footer-col")];
      FOOTER_PAGE_GROUPS.forEach((group, columnIndex) => {
        const links = [...(visibleColumns[columnIndex]?.querySelectorAll("a") || [])];
        links.forEach((link, linkIndex) => {
          const nextHref = group[linkIndex];
          if (nextHref) {
            link.setAttribute("href", nextHref);
          }
        });
      });

      const footerInner = grid.closest(".yr-footer-inner");
      const socialLinks = footerInner
        ? [...footerInner.querySelectorAll(".yr-footer-social a")]
        : [];
      socialLinks.forEach((link, index) => {
        const nextHref = FOOTER_SOCIAL_PAGES[index];
        if (nextHref) {
          link.setAttribute("href", nextHref);
        }
        const nextLabel = FOOTER_SOCIAL_LABELS[index];
        if (nextLabel) {
          link.setAttribute("aria-label", nextLabel);
        }
      });

      const firstTitle = visibleColumns[0]?.querySelector("h4");
      if (firstTitle) {
        firstTitle.remove();
      }

      const discoverTitle = visibleColumns[1]?.querySelector("h4");
      if (discoverTitle) {
        discoverTitle.textContent = headings.discover;
      }

      const partnersTitle = visibleColumns[2]?.querySelector("h4");
      if (partnersTitle) {
        partnersTitle.textContent = headings.partners;
      }

      const helpTitle = visibleColumns[3]?.querySelector("h4");
      if (helpTitle) {
        helpTitle.textContent = headings.help;
      }
    });
  }

  function getBottomNavLabels() {
    const lang = currentLanguage();
    return BOTTOM_NAV_TEXT[lang] || BOTTOM_NAV_TEXT.TR;
  }

  function getDesktopAuthLabels() {
    const lang = currentLanguage();
    return DESKTOP_AUTH_TEXT[lang] || DESKTOP_AUTH_TEXT.TR;
  }

  window.ARAMABUL_HEADER_I18N = {
    getStaticUiTranslation,
    translatePreservingWhitespace,
    applyStaticPageTranslations,
    normalizeFooterUi,
    getBottomNavLabels,
    getDesktopAuthLabels,
  };
})();
