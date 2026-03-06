(() => {
  const runtime = window.ARAMABUL_RUNTIME;
  const FOOTER_HEADINGS = {
    TR: { discover: "Keşfet", help: "Yardım", partners: "Kurumsal" },
    EN: { discover: "Discover", help: "Help", partners: "Corporate" },
    RU: { discover: "Обзор", help: "Помощь", partners: "Корпоративное" },
    DE: { discover: "Entdecken", help: "Hilfe", partners: "Unternehmen" },
    ZH: { discover: "探索", help: "帮助", partners: "企业" },
  };
  const FOOTER_PAGE_GROUPS = [
    ["footer-page.html?sayfa=app-store", "footer-page.html?sayfa=google-play"],
    [
      "footer-page.html?sayfa=hakkimizda",
      "footer-page.html?sayfa=yer-ekle",
      "footer-page.html?sayfa=iletisim",
    ],
    [
      "footer-page.html?sayfa=kosullar",
      "footer-page.html?sayfa=kvkk",
      "footer-page.html?sayfa=gizlilik",
    ],
    [
      "footer-page.html?sayfa=sss",
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
      "Keyif": "Leisure",
      "Gezi": "Travel",
      "Hizmetler": "Services",
      "Sağlık": "Health",
      "Kültür": "Culture",
      "Sanat": "Art",
      "Opera ve Bale": "Opera and Ballet",
      "Devlet Tiyatroları": "State Theaters",
      "Şehir Tiyatroları": "City Theaters",
      "Özel Tiyatrolar": "Private Theaters",
      "Müzeler": "Museums",
      "Mağaralar": "Caves",
      "Ören yerleri": "Archaeological Sites",
      "Camiler": "Mosques",
      "Tarihi Camiler": "Historic Mosques",
      "Şelaleler": "Waterfalls",
      "Galeriler": "Galleries",
      "Kültür alt kategorileri": "Culture subcategories",
      "Kültür Mekanları": "Culture venues",
      "Sanat alt kategorileri": "Art subcategories",
      "Sanat Mekanları": "Art venues",
      "Meyhane": "Tavern",
      "Meyhaneler": "Taverns",
      "Ocakbaşı": "Grill House",
      "Ev Yemekleri": "Home Cooking",
      "Çorba": "Soup",
      "Lahmacun": "Lahmacun",
      "Pide": "Pide",
      "Köfte": "Meatballs",
      "Çiğ Köfte": "Cig Kofte",
      "Mantı": "Manti",
      "Deniz Ürünleri": "Seafood",
      "Sokak Lezzetleri": "Street Food",
      "Dondurma": "Ice Cream",
      "Tatlı": "Desserts",
      "Kahvaltı": "Breakfast",
      "Vegan": "Vegan",
      "Vejetaryen": "Vegetarian",
      "Glutensiz": "Gluten Free",
      "Asya Mutfağı": "Asian Cuisine",
      "İtalyan": "Italian",
      "Mangal": "Barbecue",
      "Noodle": "Noodles",
      "Tost": "Toast",
      "Döner": "Doner",
      "Kebap": "Kebab",
      "Börek": "Borek",
      "Restoranlar": "Restaurants",
      "Lokantalar": "Eateries",
      "Kahvaltı Mekanları": "Breakfast Places",
      "Kebapçılar": "Kebab Restaurants",
      "Kafeler": "Cafes",
      "Dönerciler": "Doner Restaurants",
      "Pide ve Lahmacun": "Pide and Lahmacun",
      "Çiğ Köfteciler": "Cig Kofte Shops",
      "Pub&Bar": "Pub & Bar",
      "Kuaförler": "Hairdressers",
      "Veterinerler": "Veterinarians",
      "Eczaneler": "Pharmacies",
      "Nöbetçi Eczaneler": "On-duty Pharmacies",
      "Akaryakıt İstasyonları": "Fuel Stations",
      "Kamp Alanları": "Camp Sites",
      "Pansiyonlar": "Guesthouses",
      "Mekan Türleri": "Place Types",
      "Hizmet Türleri": "Service Types",
      "Sağlık Türleri": "Health Types",
      "Gezi Türleri": "Travel Types",
      "ATM / Bankamatik": "ATM / Cash Machine",
      "Otobüs / Metro / Tramvay Durakları": "Bus / Metro / Tram Stops",
      "Yer ekle": "Add place",
      "İletişim": "Contact",
      "Çerez Politikası": "Cookie Policy",
      "Kullanım Koşulları": "Terms of Use",
      "Kişisel Verilerin Korunması": "Personal Data Protection",
      "Gizlilik Politikası": "Privacy Policy",
      "Kurumsal": "Corporate",
      "Keşfet": "Discover",
      "Yardım mı lazım?": "Need help?",
      "İl": "Province",
      "İli": "Province",
      "İlçe": "District",
      "İlçesi": "District",
      "İlçeler": "Districts",
      "İller": "Provinces",
      "Mekanlar": "Places",
      "İlçe Mekanları": "District Places",
      "Türler": "Types",
      "Şarj İstasyonları": "Charging Stations",
      "Otoparklar": "Parking Areas",
      "Diğer Ulaşım Noktaları": "Other Transport Points",
      "Aile Sağlığı Merkezleri": "Family Health Centers",
      "Hastaneler": "Hospitals",
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
      "Keyif": "Досуг",
      "Gezi": "Путешествия",
      "Hizmetler": "Услуги",
      "Sağlık": "Здоровье",
      "Kültür": "Культура",
      "Sanat": "Искусство",
      "Opera ve Bale": "Опера и балет",
      "Devlet Tiyatroları": "Государственные театры",
      "Şehir Tiyatroları": "Городские театры",
      "Özel Tiyatrolar": "Частные театры",
      "Müzeler": "Музеи",
      "Mağaralar": "Пещеры",
      "Ören yerleri": "Археологические памятники",
      "Camiler": "Мечети",
      "Tarihi Camiler": "Исторические мечети",
      "Şelaleler": "Водопады",
      "Galeriler": "Галереи",
      "Kültür alt kategorileri": "Подкатегории культуры",
      "Kültür Mekanları": "Культурные площадки",
      "Sanat alt kategorileri": "Подкатегории искусства",
      "Sanat Mekanları": "Площадки искусства",
      "Meyhane": "Таверна",
      "Meyhaneler": "Таверны",
      "Ocakbaşı": "Гриль",
      "Ev Yemekleri": "Домашняя кухня",
      "Çorba": "Суп",
      "Lahmacun": "Лахмаджун",
      "Pide": "Пиде",
      "Köfte": "Кёфте",
      "Çiğ Köfte": "Чиг кёфте",
      "Mantı": "Манты",
      "Deniz Ürünleri": "Морепродукты",
      "Sokak Lezzetleri": "Уличная еда",
      "Dondurma": "Мороженое",
      "Tatlı": "Десерты",
      "Kahvaltı": "Завтрак",
      "Vegan": "Веган",
      "Vejetaryen": "Вегетарианское",
      "Glutensiz": "Без глютена",
      "Asya Mutfağı": "Азиатская кухня",
      "İtalyan": "Итальянская кухня",
      "Mangal": "Барбекю",
      "Noodle": "Лапша",
      "Tost": "Тост",
      "Döner": "Донер",
      "Kebap": "Кебаб",
      "Börek": "Бёрек",
      "Restoranlar": "Рестораны",
      "Lokantalar": "Локанты",
      "Kahvaltı Mekanları": "Места для завтрака",
      "Kebapçılar": "Кебабные",
      "Kafeler": "Кафе",
      "Dönerciler": "Донерные",
      "Pide ve Lahmacun": "Пиде и лахмаджун",
      "Çiğ Köfteciler": "Заведения чиг кёфте",
      "Pub&Bar": "Пабы и бары",
      "Kuaförler": "Парикмахерские",
      "Veterinerler": "Ветеринары",
      "Eczaneler": "Аптеки",
      "Nöbetçi Eczaneler": "Дежурные аптеки",
      "Akaryakıt İstasyonları": "АЗС",
      "Kamp Alanları": "Кемпинги",
      "Pansiyonlar": "Гостевые дома",
      "Mekan Türleri": "Типы мест",
      "Hizmet Türleri": "Типы услуг",
      "Sağlık Türleri": "Типы здоровья",
      "Gezi Türleri": "Типы поездок",
      "ATM / Bankamatik": "Банкоматы",
      "Otobüs / Metro / Tramvay Durakları": "Остановки автобуса / метро / трамвая",
      "Yer ekle": "Добавить место",
      "İletişim": "Контакты",
      "Çerez Politikası": "Политика cookies",
      "Kullanım Koşulları": "Условия использования",
      "Kişisel Verilerin Korunması": "Защита персональных данных",
      "Gizlilik Politikası": "Политика конфиденциальности",
      "Kurumsal": "Корпоративное",
      "Keşfet": "Обзор",
      "Yardım mı lazım?": "Нужна помощь?",
      "İl": "Область",
      "İli": "Область",
      "İlçe": "Район",
      "İlçesi": "Район",
      "İlçeler": "Районы",
      "İller": "Области",
      "Mekanlar": "Места",
      "İlçe Mekanları": "Места района",
      "Türler": "Типы",
      "Şarj İstasyonları": "Зарядные станции",
      "Otoparklar": "Парковки",
      "Diğer Ulaşım Noktaları": "Другие точки транспорта",
      "Aile Sağlığı Merkezleri": "Центры семейного здоровья",
      "Hastaneler": "Больницы",
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
      "Keyif": "Genuss",
      "Gezi": "Reise",
      "Hizmetler": "Dienstleistungen",
      "Sağlık": "Gesundheit",
      "Kültür": "Kultur",
      "Sanat": "Kunst",
      "Opera ve Bale": "Oper und Ballett",
      "Devlet Tiyatroları": "Staatstheater",
      "Şehir Tiyatroları": "Stadttheater",
      "Özel Tiyatrolar": "Private Theater",
      "Müzeler": "Museen",
      "Mağaralar": "Höhlen",
      "Ören yerleri": "Ausgrabungsstätten",
      "Camiler": "Moscheen",
      "Tarihi Camiler": "Historische Moscheen",
      "Şelaleler": "Wasserfälle",
      "Galeriler": "Galerien",
      "Kültür alt kategorileri": "Kultur-Unterkategorien",
      "Kültür Mekanları": "Kulturorte",
      "Sanat alt kategorileri": "Kunst-Unterkategorien",
      "Sanat Mekanları": "Kunstorte",
      "Meyhane": "Taverne",
      "Meyhaneler": "Tavernen",
      "Ocakbaşı": "Grillhaus",
      "Ev Yemekleri": "Hausmannskost",
      "Çorba": "Suppe",
      "Lahmacun": "Lahmacun",
      "Pide": "Pide",
      "Köfte": "Köfte",
      "Çiğ Köfte": "Cig Köfte",
      "Mantı": "Manti",
      "Deniz Ürünleri": "Meeresfrüchte",
      "Sokak Lezzetleri": "Streetfood",
      "Dondurma": "Eis",
      "Tatlı": "Desserts",
      "Kahvaltı": "Frühstück",
      "Vegan": "Vegan",
      "Vejetaryen": "Vegetarisch",
      "Glutensiz": "Glutenfrei",
      "Asya Mutfağı": "Asiatische Küche",
      "İtalyan": "Italienisch",
      "Mangal": "Grill",
      "Noodle": "Nudeln",
      "Tost": "Toast",
      "Döner": "Döner",
      "Kebap": "Kebab",
      "Börek": "Börek",
      "Restoranlar": "Restaurants",
      "Lokantalar": "Lokale",
      "Kahvaltı Mekanları": "Frühstücksorte",
      "Kebapçılar": "Kebab-Restaurants",
      "Kafeler": "Cafés",
      "Dönerciler": "Döner-Läden",
      "Pide ve Lahmacun": "Pide und Lahmacun",
      "Çiğ Köfteciler": "Cig-Köfte-Läden",
      "Pub&Bar": "Pubs und Bars",
      "Kuaförler": "Friseure",
      "Veterinerler": "Tierärzte",
      "Eczaneler": "Apotheken",
      "Nöbetçi Eczaneler": "Notdienst-Apotheken",
      "Akaryakıt İstasyonları": "Tankstellen",
      "Kamp Alanları": "Campingplätze",
      "Pansiyonlar": "Pensionen",
      "Mekan Türleri": "Ortstypen",
      "Hizmet Türleri": "Dienstleistungstypen",
      "Sağlık Türleri": "Gesundheitstypen",
      "Gezi Türleri": "Reisetypen",
      "ATM / Bankamatik": "Geldautomat",
      "Otobüs / Metro / Tramvay Durakları": "Bus- / Metro- / Tramhaltestellen",
      "Yer ekle": "Ort hinzufügen",
      "İletişim": "Kontakt",
      "Çerez Politikası": "Cookie-Richtlinie",
      "Kullanım Koşulları": "Nutzungsbedingungen",
      "Kişisel Verilerin Korunması": "Datenschutz personenbezogener Daten",
      "Gizlilik Politikası": "Datenschutzrichtlinie",
      "Kurumsal": "Unternehmen",
      "Keşfet": "Entdecken",
      "Yardım mı lazım?": "Brauchst du Hilfe?",
      "İl": "Provinz",
      "İli": "Provinz",
      "İlçe": "Bezirk",
      "İlçesi": "Bezirk",
      "İlçeler": "Bezirke",
      "İller": "Provinzen",
      "Mekanlar": "Orte",
      "İlçe Mekanları": "Orte im Bezirk",
      "Türler": "Typen",
      "Şarj İstasyonları": "Ladestationen",
      "Otoparklar": "Parkplätze",
      "Diğer Ulaşım Noktaları": "Weitere Verkehrspunkte",
      "Aile Sağlığı Merkezleri": "Familiengesundheitszentren",
      "Hastaneler": "Krankenhäuser",
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
      "Keyif": "休闲",
      "Gezi": "出行",
      "Hizmetler": "服务",
      "Sağlık": "健康",
      "Kültür": "文化",
      "Sanat": "艺术",
      "Opera ve Bale": "歌剧与芭蕾",
      "Devlet Tiyatroları": "国家剧院",
      "Şehir Tiyatroları": "城市剧院",
      "Özel Tiyatrolar": "私营剧院",
      "Müzeler": "博物馆",
      "Mağaralar": "洞穴",
      "Ören yerleri": "考古遗址",
      "Camiler": "清真寺",
      "Tarihi Camiler": "历史清真寺",
      "Şelaleler": "瀑布",
      "Galeriler": "画廊",
      "Kültür alt kategorileri": "文化子分类",
      "Kültür Mekanları": "文化场馆",
      "Sanat alt kategorileri": "艺术子分类",
      "Sanat Mekanları": "艺术场馆",
      "Meyhane": "小酒馆",
      "Meyhaneler": "小酒馆",
      "Ocakbaşı": "炭火餐馆",
      "Ev Yemekleri": "家常菜",
      "Çorba": "汤品",
      "Lahmacun": "土耳其薄饼",
      "Pide": "皮德饼",
      "Köfte": "肉丸",
      "Çiğ Köfte": "生科夫特",
      "Mantı": "土耳其饺子",
      "Deniz Ürünleri": "海鲜",
      "Sokak Lezzetleri": "街头美食",
      "Dondurma": "冰淇淋",
      "Tatlı": "甜点",
      "Kahvaltı": "早餐",
      "Vegan": "纯素",
      "Vejetaryen": "素食",
      "Glutensiz": "无麸质",
      "Asya Mutfağı": "亚洲料理",
      "İtalyan": "意大利菜",
      "Mangal": "烧烤",
      "Noodle": "面食",
      "Tost": "吐司",
      "Döner": "旋转烤肉",
      "Kebap": "烤肉",
      "Börek": "博雷克",
      "Restoranlar": "餐厅",
      "Lokantalar": "食堂",
      "Kahvaltı Mekanları": "早餐店",
      "Kebapçılar": "烤肉店",
      "Kafeler": "咖啡馆",
      "Dönerciler": "旋转烤肉店",
      "Pide ve Lahmacun": "皮德和土耳其薄饼",
      "Çiğ Köfteciler": "生科夫特店",
      "Pub&Bar": "酒吧",
      "Kuaförler": "理发店",
      "Veterinerler": "兽医",
      "Eczaneler": "药房",
      "Nöbetçi Eczaneler": "值班药房",
      "Akaryakıt İstasyonları": "加油站",
      "Kamp Alanları": "露营地",
      "Pansiyonlar": "旅馆民宿",
      "Mekan Türleri": "地点类型",
      "Hizmet Türleri": "服务类型",
      "Sağlık Türleri": "健康类型",
      "Gezi Türleri": "出行类型",
      "ATM / Bankamatik": "自动取款机",
      "Otobüs / Metro / Tramvay Durakları": "公交 / 地铁 / 电车站",
      "Yer ekle": "添加地点",
      "İletişim": "联系",
      "Çerez Politikası": "Cookie 政策",
      "Kullanım Koşulları": "使用条款",
      "Kişisel Verilerin Korunması": "个人数据保护",
      "Gizlilik Politikası": "隐私政策",
      "Kurumsal": "企业",
      "Keşfet": "探索",
      "Yardım mı lazım?": "需要帮助吗？",
      "İl": "省",
      "İli": "省",
      "İlçe": "区",
      "İlçesi": "区",
      "İlçeler": "区列表",
      "İller": "省列表",
      "Mekanlar": "地点",
      "İlçe Mekanları": "区内地点",
      "Türler": "类型",
      "Şarj İstasyonları": "充电站",
      "Otoparklar": "停车场",
      "Diğer Ulaşım Noktaları": "其他出行点",
      "Aile Sağlığı Merkezleri": "家庭健康中心",
      "Hastaneler": "医院",
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
      if (element.hasAttribute("data-no-static-translate")) {
        return;
      }

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
