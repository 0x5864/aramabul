(() => {
  const DEFAULT_KEY = "hakkimizda";
  const FOOTER_PAGE_TEXT = Object.freeze({
    EN: {
      "İş ortaklığı": "Partnership",
      "Mobil uygulama": "Mobile app",
      "Destek": "Support",
      "Yardım": "Help",
      "Yasal": "Legal",
      "Sosyal": "Social",
      "Kısa not": "Quick note",
      "Yeni bir işletme veya hizmet noktası eklemek için aşağıdaki formu doldurup gönder tuşuna basınız.":
        "Fill in the form below and press submit to add a new business or service location.",
      "Bilgiler alındı. Adres alanlarını PTT kaynağıyla eşleştirdiysen inceleme daha hızlı ilerler.":
        "Details were received. If you matched the address fields with the PTT source, review will move faster.",
      "Aramabul, kullanıcının bir yeri ararken, en kısa yoldan ve net bilgi bulmasını amaçlayan sade tasarımlı bir yardımcıdır.":
        "Aramabul is a simple guide designed to help users find a place through the shortest path with clear information.",
      "İnsanlar çoğu zaman bir yerin adını değil, ihtiyacını bilir. Biz de aramayı ihtiyaçtan başlatıyoruz.":
        "People often know their need, not the name of the place. So we start the search from the need.",
      "Amaç, gereksiz kalabalığı ve çabayı azaltarak, ihtiyaç duyduğunuz hizmet ve ürüne daha hızlı ulaşmanızı sağlamak.":
        "The goal is to reduce clutter and effort so you can reach the service or product you need faster.",
      "Kategori, şehir ve ilçe katmanları sırasıyla, önce alt kategoriler, son olarak da hizmet mekanları seçenekleri ile sizi buluşturuyoruz.":
        "Category, city and district layers bring you first to subcategories and then to venue options.",
      "Bilgiyi kutu yapısında sunarak, kullanıcıyı uzun sayfalarda dolaştırmadan net karar alanına ulaştırıyoruz. İhtiyaç duyduğunuz hizmeti alacağınız mekanı, tüm ulaşım ve iletişim bilgileri ile, en kullanıcı dostu biçimde görmenizi sağlıyoruz.":
        "We present information in boxed sections so users reach a clear decision area without wandering through long pages. We help you view the place you need, with transport and contact details, in the most user-friendly way.",
      "Basit arayüz": "Simple interface",
      "Açık bilgi": "Clear information",
      "Hızlı ve ayrıntılı yönlendirme": "Fast and detailed guidance",
      "Soru, öneri ve iş talepleriniz için aşağıdaki formu doldurunuz.":
        "Fill in the form below for your questions, suggestions and business requests.",
      "Mesajın hazırlandı. İlgili ekibe en kısa sürede yönlendireceğiz.":
        "Your message is ready. We will route it to the relevant team as soon as possible.",
      "Mesajını konu ve kısa bağlamla gönderirsen doğru ekibe daha hızlı yönlendirebiliriz.":
        "If you send your message with a topic and short context, we can route it faster to the right team.",
      "En çok sorulan temel konuları kısa ve kolay anlaşılır cevaplarla bir araya getirdik.":
        "We gathered the most common core questions with short and clear answers.",
      "Nasıl arama yaparım?": "How do I search?",
      "Üst arama alanından doğrudan mekan adı yazabilir ya da anasayfadan kategori seçebilirsin.":
        "You can type a venue name directly in the top search field or choose a category from the home page.",
      "Kategori sayfalarında şehir ve ilçe adımı ile sonuçları daraltabilirsin.":
        "On category pages, you can narrow results with the city and district steps.",
      "Bilgi yanlışsa ne yapmalıyım?": "What should I do if the information is wrong?",
      "Bize sayfa bağlantısı ile birlikte doğru bilgiyi gönder.": "Send us the correct information together with the page link.",
      "İnceleme sonrası içerik güncellenir.": "The content is updated after review.",
      "Hesap şart mı?": "Is an account required?",
      "Temel gezinme için hesap gerekmez.": "An account is not needed for basic browsing.",
      "Favori, kayıt ve kişisel tercih akışları için hesap alanı sonraki adımlarda daha görünür hale gelecek.":
        "The account area will become more visible in later steps for favorites, saved items and personal preferences.",
      "Bu metin, kullanıcı verisine nasıl yaklaştığımızı sade dil ile anlatan ilk çerçevedir.":
        "This text is the first simple outline of how we approach user data.",
      "Hangi veriler olabilir?": "What data may be involved?",
      "Neden işlenir?": "Why is it processed?",
      "Kullanıcı hakları": "User rights",
      "Ad ve e-posta gibi temel hesap bilgileri": "Basic account details such as name and email",
      "Tercih ve dil ayarları": "Preference and language settings",
      "Hata ve kullanım kayıtları": "Error and usage records",
      "Hesabı çalıştırmak, tercihleri korumak ve hizmeti iyileştirmek için sınırlı veri kullanılır.":
        "Limited data is used to run the account, keep preferences and improve the service.",
      "İhtiyaç dışı veri toplamak ana yaklaşımımız değildir.": "Collecting unnecessary data is not our main approach.",
      "Bilgi isteme, düzeltme talep etme ve silme isteği gönderme hakkın vardır.":
        "You have the right to request information, ask for corrections and request deletion.",
      "Gizlilik yaklaşımımız, gereksiz veri toplamadan temel hizmeti açık biçimde sunmaktır.":
        "Our privacy approach is to provide the core service clearly without collecting unnecessary data.",
      "Topladığımız veriler": "Data we collect",
      "Toplamadığımız şeyler": "What we do not collect",
      "Paylaşım ilkesi": "Sharing policy",
      "Hesap alanı kullanılırsa temel profil bilgileri tutulabilir.": "If the account area is used, basic profile details may be stored.",
      "Yerel ayarlar ve dil tercihi gibi küçük bilgiler cihaz tarafında saklanabilir.":
        "Small details such as local settings and language preference may be stored on the device.",
      "Gereksiz kişisel profil verisi, ilgisiz belge veya kapsam dışı hassas bilgi istemeyiz.":
        "We do not ask for unnecessary personal profile data, irrelevant documents or unrelated sensitive information.",
      "Yasal zorunluluk olmadıkça kullanıcı verisini açık ve sınırsız biçimde üçüncü taraflara açmayız.":
        "Unless legally required, we do not openly and broadly share user data with third parties.",
      "Kullanım sınırları": "Usage limits",
      "Yanıltıcı bilgi göndermeme": "Do not send misleading information",
      "Sistemi bozacak yoğun kötü kullanım yapmama": "Do not abuse the system in a disruptive way",
      "Başkalarına ait içeriği izinsiz kopyalamama": "Do not copy other people's content without permission",
      "İçerik güncellemeleri": "Content updates",
      "Sayfadaki içerikler zaman içinde güncellenebilir, taşınabilir veya yeniden düzenlenebilir.":
        "The content on this page may be updated, moved or reorganized over time.",
      "Bu sayfa, sitemizde kullanılan çerezlerin ne işe yaradığını, ne kadar süre kaldığını ve tercihlerini nasıl yönetebileceğini sade dille açıklar.":
        "This page explains in simple language what the cookies on our site do, how long they stay and how you can manage your preferences.",
      "Çerez nedir?": "What is a cookie?",
      "Kullandığımız başlıca türler": "Main types we use",
      "Hangi amaçlarla kullanılır?": "What are they used for?",
      "Saklama süresi ve üçüncü taraflar": "Storage period and third parties",
      "Kontrol sende": "You are in control",
      "Çerezler, ziyaret sırasında tarayıcına bırakılan küçük veri dosyalarıdır.":
        "Cookies are small data files placed in your browser during a visit.",
      "Bazı ayarlar ise çerez yerine tarayıcının yerel kayıt alanında tutulabilir. Amaç, siteyi her seferinde baştan kurmadan daha düzenli çalıştırmaktır.":
        "Some settings may be stored in the browser's local storage instead of cookies. The aim is to keep the site running smoothly without setting everything up again each time.",
      "Zorunlu çerezler: oturum, güvenlik ve temel sayfa akışı için":
        "Required cookies: for session, security and the basic page flow",
      "Tercih çerezleri: dil, tema ve benzer seçimleri hatırlamak için":
        "Preference cookies: to remember language, theme and similar choices",
      "Ölçüm çerezleri: hangi alanların daha çok kullanıldığını anlamak için":
        "Measurement cookies: to understand which areas are used more",
      "Üçüncü taraf çerezleri: harici bir araç kullanılırsa o hizmetin teknik kaydı için":
        "Third-party cookies: for the technical records of an external service if one is used",
      "Dil tercihini hatırlamak": "Remember language preference",
      "Tema seçimini korumak": "Keep theme selection",
      "Oturum akışını yönetmek": "Manage the session flow",
      "Sayfa hatalarını ve performans sorunlarını görmek": "See page errors and performance issues",
      "Kötüye kullanımı sınırlamaya yardımcı olmak": "Help limit abuse",
      "Bazı çerezler sadece oturum açıkken kalır, bazıları ise belirli bir süre cihazında tutulur. Süre, çerezin amacına göre değişir.":
        "Some cookies remain only while the session is open, while others stay on your device for a set time. The period depends on the purpose of the cookie.",
      "Harici bir analiz, giriş veya medya aracı kullanılırsa ilgili hizmet kendi çerezini oluşturabilir. Bu durumda o hizmetin kendi politikası da devreye girer.":
        "If an external analytics, login or media tool is used, that service may create its own cookies. In that case, that service's own policy also applies.",
      "Tarayıcı ayarlarından çerezleri silebilir, engelleyebilir veya sadece belirli siteler için izin verebilirsin.":
        "You can delete, block or allow cookies only for certain sites from your browser settings.",
      "Çerezleri kapatman halinde bazı tercih alanları sıfırlanabilir ve bazı sayfa işlevleri beklenen gibi çalışmayabilir.":
        "If you disable cookies, some preference fields may reset and some page functions may not work as expected.",
      "Zorunlu olmayan yeni çerezler eklenirse bu metni ve varsa tercih ekranını aynı anda güncelleriz.":
        "If new non-essential cookies are added, we update this text and the preference screen at the same time, if available.",
      "Gönder": "Submit",
      "Ad Soyad": "Full name",
      "E-posta": "Email",
      "Konu": "Subject",
      "Genel Konular": "General Topics",
      "İş Birliği": "Partnership",
      "İçerik Düzeltmeleri": "Content Corrections",
      "Alan kodu": "Area code",
      "Telefon numarası": "Phone number",
      "Mesaj": "Message",
      "Telefon bilgisi": "Phone details",
      "İşletme adı": "Business name",
      "İl": "Province",
      "İlçe": "District",
      "Mahalle": "Neighborhood",
      "Sokak / Cadde / Bulvar": "Street / Avenue / Boulevard",
      "Bina no / Kapı no": "Building no / Door no",
      "Sokak / Cadde": "Street / Avenue",
      "Bina / Kapı no": "Building / Door no",
      "Posta kodu": "Postal code",
      "Web sitesi (varsa)": "Website (optional)",
      "Lütfen ad, e-posta, konu ve mesaj alanlarını doldur.": "Please fill in the name, email, subject and message fields.",
      "Lütfen konu seçimini tamamla.": "Please complete the subject selection.",
      "İl, ilçe ve mahalle için veri kaynağı tanımlanmadı.": "No data source is defined for province, district and neighborhood.",
      "İl, ilçe veya mahalle verisi yüklenemedi. Adresi PTT kaynağından kontrol ederek elle tamamlamalısın.":
        "Province, district or neighborhood data could not be loaded. You should check the address from the PTT source and complete it manually.",
      "Lütfen zorunlu alanları eksiksiz doldur, adres seçimlerini tamamla ve posta kodu otomatik gelmezse 5 hane olarak gir.":
        "Please fill in the required fields, complete the address selections and enter the postal code as 5 digits if it does not fill automatically."
    },
    RU: {
      "İş ortaklığı": "Партнерство",
      "Destek": "Поддержка",
      "Yardım": "Помощь",
      "Yasal": "Правовая информация",
      "Sosyal": "Соцсети",
      "Kısa not": "Короткая заметка",
      "Yeni bir işletme veya hizmet noktası eklemek için aşağıdaki formu doldurup gönder tuşuna basınız.":
        "Заполните форму ниже и нажмите отправить, чтобы добавить новый бизнес или точку услуги.",
      "Aramabul, kullanıcının bir yeri ararken, en kısa yoldan ve net bilgi bulmasını amaçlayan sade tasarımlı bir yardımcıdır.":
        "Aramabul — это простой помощник, который помогает быстро находить место и получать понятную информацию.",
      "İnsanlar çoğu zaman bir yerin adını değil, ihtiyacını bilir. Biz de aramayı ihtiyaçtan başlatıyoruz.":
        "Люди чаще знают свою потребность, а не название места. Поэтому мы начинаем поиск с потребности.",
      "Amaç, gereksiz kalabalığı ve çabayı azaltarak, ihtiyaç duyduğunuz hizmet ve ürüne daha hızlı ulaşmanızı sağlamak.":
        "Наша цель — уменьшить лишнюю нагрузку и помочь быстрее добраться до нужной услуги или товара.",
      "Kategori, şehir ve ilçe katmanları sırasıyla, önce alt kategoriler, son olarak da hizmet mekanları seçenekleri ile sizi buluşturuyoruz.":
        "Слои категории, города и района последовательно приводят вас сначала к подкатегориям, а затем к вариантам мест.",
      "Bilgiyi kutu yapısında sunarak, kullanıcıyı uzun sayfalarda dolaştırmadan net karar alanına ulaştırıyoruz. İhtiyaç duyduğunuz hizmeti alacağınız mekanı, tüm ulaşım ve iletişim bilgileri ile, en kullanıcı dostu biçimde görmenizi sağlıyoruz.":
        "Мы показываем информацию в карточках, чтобы пользователь быстро дошел до решения без долгого просмотра страниц. Так вы видите нужное место со всей транспортной и контактной информацией в удобной форме.",
      "Basit arayüz": "Простой интерфейс",
      "Açık bilgi": "Понятная информация",
      "Hızlı ve ayrıntılı yönlendirme": "Быстрое и подробное направление",
      "Soru, öneri ve iş talepleriniz için aşağıdaki formu doldurunuz.":
        "Заполните форму ниже для вопросов, предложений и деловых запросов.",
      "En çok sorulan temel konuları kısa ve kolay anlaşılır cevaplarla bir araya getirdik.":
        "Мы собрали самые частые основные вопросы с короткими и понятными ответами.",
      "Nasıl arama yaparım?": "Как выполнить поиск?",
      "Üst arama alanından doğrudan mekan adı yazabilir ya da anasayfadan kategori seçebilirsin.":
        "Вы можете сразу ввести название места в верхней строке поиска или выбрать категорию на главной странице.",
      "Kategori sayfalarında şehir ve ilçe adımı ile sonuçları daraltabilirsin.":
        "На страницах категорий можно сузить результаты, выбрав город и район.",
      "Bilgi yanlışsa ne yapmalıyım?": "Что делать, если информация неверная?",
      "Bize sayfa bağlantısı ile birlikte doğru bilgiyi gönder.":
        "Отправьте нам правильную информацию вместе со ссылкой на страницу.",
      "İnceleme sonrası içerik güncellenir.": "После проверки содержимое обновляется.",
      "Hesap şart mı?": "Нужен ли аккаунт?",
      "Temel gezinme için hesap gerekmez.": "Для обычного просмотра аккаунт не нужен.",
      "Favori, kayıt ve kişisel tercih akışları için hesap alanı sonraki adımlarda daha görünür hale gelecek.":
        "Раздел аккаунта станет заметнее на следующих этапах для избранного, сохраненных элементов и личных настроек.",
      "Bu metin, kullanıcı verisine nasıl yaklaştığımızı sade dil ile anlatan ilk çerçevedir.":
        "Этот текст — простое первое объяснение того, как мы подходим к данным пользователя.",
      "Hangi veriler olabilir?": "Какие данные могут быть?",
      "Ad ve e-posta gibi temel hesap bilgileri": "Базовые данные аккаунта, такие как имя и электронная почта",
      "Tercih ve dil ayarları": "Настройки предпочтений и языка",
      "Hata ve kullanım kayıtları": "Записи об ошибках и использовании",
      "Neden işlenir?": "Зачем обрабатываются данные?",
      "Hesabı çalıştırmak, tercihleri korumak ve hizmeti iyileştirmek için sınırlı veri kullanılır.":
        "Ограниченный объем данных используется для работы аккаунта, сохранения предпочтений и улучшения сервиса.",
      "İhtiyaç dışı veri toplamak ana yaklaşımımız değildir.":
        "Сбор лишних данных не является нашим основным подходом.",
      "Kullanıcı hakları": "Права пользователя",
      "Bilgi isteme, düzeltme talep etme ve silme isteği gönderme hakkın vardır.":
        "Вы имеете право запрашивать информацию, просить исправления и отправлять запрос на удаление.",
      "Gizlilik yaklaşımımız, gereksiz veri toplamadan temel hizmeti açık biçimde sunmaktır.":
        "Наш подход к конфиденциальности — предоставлять основной сервис понятно, не собирая лишние данные.",
      "Topladığımız veriler": "Какие данные мы собираем",
      "Hesap alanı kullanılırsa temel profil bilgileri tutulabilir.":
        "При использовании раздела аккаунта могут храниться базовые данные профиля.",
      "Yerel ayarlar ve dil tercihi gibi küçük bilgiler cihaz tarafında saklanabilir.":
        "Небольшие данные, такие как локальные настройки и выбор языка, могут храниться на устройстве.",
      "Toplamadığımız şeyler": "Что мы не собираем",
      "Gereksiz kişisel profil verisi, ilgisiz belge veya kapsam dışı hassas bilgi istemeyiz.":
        "Мы не запрашиваем лишние персональные данные профиля, несвязанные документы или чувствительную информацию вне области сервиса.",
      "Paylaşım ilkesi": "Принцип передачи данных",
      "Yasal zorunluluk olmadıkça kullanıcı verisini açık ve sınırsız biçimde üçüncü taraflara açmayız.":
        "Если этого не требует закон, мы не передаем пользовательские данные третьим лицам открыто и без ограничений.",
      "Kullanım sınırları": "Ограничения использования",
      "Yanıltıcı bilgi göndermeme": "Не отправлять вводящую в заблуждение информацию",
      "Sistemi bozacak yoğun kötü kullanım yapmama": "Не злоупотреблять сервисом так, чтобы нарушать его работу",
      "Başkalarına ait içeriği izinsiz kopyalamama": "Не копировать чужой контент без разрешения",
      "İçerik güncellemeleri": "Обновления контента",
      "Sayfadaki içerikler zaman içinde güncellenebilir, taşınabilir veya yeniden düzenlenebilir.":
        "Содержимое страницы со временем может обновляться, переноситься или перестраиваться.",
      "Bu sayfa, sitemizde kullanılan çerezlerin ne işe yaradığını, ne kadar süre kaldığını ve tercihlerini nasıl yönetebileceğini sade dille açıklar.":
        "На этой странице простым языком объясняется, для чего нужны cookie на нашем сайте, как долго они хранятся и как вы можете управлять своими настройками.",
      "Çerez nedir?": "Что такое cookie?",
      "Çerezler, ziyaret sırasında tarayıcına bırakılan küçük veri dosyalarıdır.":
        "Cookie — это небольшие файлы данных, которые сохраняются в вашем браузере во время посещения сайта.",
      "Bazı ayarlar ise çerez yerine tarayıcının yerel kayıt alanında tutulabilir. Amaç, siteyi her seferinde baştan kurmadan daha düzenli çalıştırmaktır.":
        "Некоторые настройки могут храниться не в cookie, а в локальном хранилище браузера. Это нужно, чтобы сайт работал стабильнее без повторной настройки при каждом визите.",
      "Kullandığımız başlıca türler": "Основные типы, которые мы используем",
      "Zorunlu çerezler: oturum, güvenlik ve temel sayfa akışı için":
        "Обязательные cookie: для сессии, безопасности и базовой работы страниц",
      "Tercih çerezleri: dil, tema ve benzer seçimleri hatırlamak için":
        "Cookie предпочтений: чтобы запоминать язык, тему и похожие выборы",
      "Ölçüm çerezleri: hangi alanların daha çok kullanıldığını anlamak için":
        "Измерительные cookie: чтобы понимать, какие разделы используются чаще",
      "Üçüncü taraf çerezleri: harici bir araç kullanılırsa o hizmetin teknik kaydı için":
        "Cookie третьих сторон: для технической работы внешнего сервиса, если он используется",
      "Hangi amaçlarla kullanılır?": "Для чего они используются?",
      "Dil tercihini hatırlamak": "Запомнить выбор языка",
      "Tema seçimini korumak": "Сохранить выбор темы",
      "Oturum akışını yönetmek": "Управлять ходом сессии",
      "Sayfa hatalarını ve performans sorunlarını görmek": "Видеть ошибки страниц и проблемы с производительностью",
      "Kötüye kullanımı sınırlamaya yardımcı olmak": "Помогать ограничивать злоупотребления",
      "Saklama süresi ve üçüncü taraflar": "Срок хранения и третьи стороны",
      "Bazı çerezler sadece oturum açıkken kalır, bazıları ise belirli bir süre cihazında tutulur. Süre, çerezin amacına göre değişir.":
        "Некоторые cookie хранятся только во время открытой сессии, а другие остаются на устройстве определенное время. Срок зависит от назначения cookie.",
      "Harici bir analiz, giriş veya medya aracı kullanılırsa ilgili hizmet kendi çerezini oluşturabilir. Bu durumda o hizmetin kendi politikası da devreye girer.":
        "Если используется внешний сервис аналитики, входа или медиа, он может создавать свои cookie. В этом случае также действует политика самого сервиса.",
      "Kontrol sende": "Контроль у вас",
      "Tarayıcı ayarlarından çerezleri silebilir, engelleyebilir veya sadece belirli siteler için izin verebilirsin.":
        "В настройках браузера вы можете удалить cookie, заблокировать их или разрешить только для определенных сайтов.",
      "Çerezleri kapatman halinde bazı tercih alanları sıfırlanabilir ve bazı sayfa işlevleri beklenen gibi çalışmayabilir.":
        "Если отключить cookie, часть настроек может сброситься, а некоторые функции сайта могут работать не так, как ожидается.",
      "Zorunlu olmayan yeni çerezler eklenirse bu metni ve varsa tercih ekranını aynı anda güncelleriz.":
        "Если будут добавлены новые необязательные cookie, мы одновременно обновим этот текст и, если есть, экран настроек.",
      "Gönder": "Отправить",
      "Ad Soyad": "Имя и фамилия",
      "E-posta": "Эл. почта",
      "Konu": "Тема",
      "Genel Konular": "Общие вопросы",
      "İş Birliği": "Сотрудничество",
      "İçerik Düzeltmeleri": "Исправление контента",
      "Alan kodu": "Код",
      "Telefon numarası": "Номер телефона",
      "Mesaj": "Сообщение",
      "Telefon bilgisi": "Телефон",
      "İşletme adı": "Название бизнеса",
      "İl": "Область",
      "İlçe": "Район",
      "Mahalle": "Квартал",
      "Posta kodu": "Почтовый индекс"
    },
    DE: {
      "İş ortaklığı": "Partnerschaft",
      "Destek": "Support",
      "Yardım": "Hilfe",
      "Yasal": "Rechtliches",
      "Sosyal": "Sozial",
      "Kısa not": "Kurze Notiz",
      "Yeni bir işletme veya hizmet noktası eklemek için aşağıdaki formu doldurup gönder tuşuna basınız.":
        "Füllen Sie das Formular unten aus und klicken Sie auf Senden, um ein neues Unternehmen oder einen Servicepunkt hinzuzufügen.",
      "Aramabul, kullanıcının bir yeri ararken, en kısa yoldan ve net bilgi bulmasını amaçlayan sade tasarımlı bir yardımcıdır.":
        "Aramabul ist ein schlicht gestalteter Helfer, der Nutzern dabei hilft, einen Ort auf dem kürzesten Weg mit klaren Informationen zu finden.",
      "İnsanlar çoğu zaman bir yerin adını değil, ihtiyacını bilir. Biz de aramayı ihtiyaçtan başlatıyoruz.":
        "Menschen kennen oft nicht den Namen eines Ortes, sondern ihr Bedürfnis. Deshalb starten wir die Suche beim Bedarf.",
      "Amaç, gereksiz kalabalığı ve çabayı azaltarak, ihtiyaç duyduğunuz hizmet ve ürüne daha hızlı ulaşmanızı sağlamak.":
        "Das Ziel ist, unnötige Komplexität und Aufwand zu reduzieren, damit Sie schneller den gewünschten Service oder das gewünschte Produkt erreichen.",
      "Kategori, şehir ve ilçe katmanları sırasıyla, önce alt kategoriler, son olarak da hizmet mekanları seçenekleri ile sizi buluşturuyoruz.":
        "Die Ebenen Kategorie, Stadt und Bezirk führen Sie zuerst zu Unterkategorien und dann zu passenden Orten.",
      "Bilgiyi kutu yapısında sunarak, kullanıcıyı uzun sayfalarda dolaştırmadan net karar alanına ulaştırıyoruz. İhtiyaç duyduğunuz hizmeti alacağınız mekanı, tüm ulaşım ve iletişim bilgileri ile, en kullanıcı dostu biçimde görmenizi sağlıyoruz.":
        "Wir zeigen Informationen in klaren Boxen, damit Nutzer ohne lange Seiten direkt zu einer klaren Entscheidung gelangen. So sehen Sie den passenden Ort mit allen Kontakt- und Anfahrtsinfos in benutzerfreundlicher Form.",
      "Basit arayüz": "Einfache Oberfläche",
      "Açık bilgi": "Klare Informationen",
      "Hızlı ve ayrıntılı yönlendirme": "Schnelle und detaillierte Orientierung",
      "Soru, öneri ve iş talepleriniz için aşağıdaki formu doldurunuz.":
        "Füllen Sie das Formular unten für Fragen, Vorschläge und geschäftliche Anfragen aus.",
      "En çok sorulan temel konuları kısa ve kolay anlaşılır cevaplarla bir araya getirdik.":
        "Wir haben die häufigsten Grundfragen mit kurzen und leicht verständlichen Antworten gesammelt.",
      "Nasıl arama yaparım?": "Wie suche ich?",
      "Üst arama alanından doğrudan mekan adı yazabilir ya da anasayfadan kategori seçebilirsin.":
        "Sie können direkt oben nach einem Ort suchen oder auf der Startseite eine Kategorie auswählen.",
      "Kategori sayfalarında şehir ve ilçe adımı ile sonuçları daraltabilirsin.":
        "Auf Kategorieseiten können Sie die Ergebnisse über Stadt und Bezirk eingrenzen.",
      "Bilgi yanlışsa ne yapmalıyım?": "Was soll ich tun, wenn die Information falsch ist?",
      "Bize sayfa bağlantısı ile birlikte doğru bilgiyi gönder.":
        "Senden Sie uns die korrekte Information zusammen mit dem Seitenlink.",
      "İnceleme sonrası içerik güncellenir.": "Nach der Prüfung wird der Inhalt aktualisiert.",
      "Hesap şart mı?": "Ist ein Konto erforderlich?",
      "Temel gezinme için hesap gerekmez.": "Für die grundlegende Nutzung ist kein Konto nötig.",
      "Favori, kayıt ve kişisel tercih akışları için hesap alanı sonraki adımlarda daha görünür hale gelecek.":
        "Der Kontobereich wird in den nächsten Schritten für Favoriten, gespeicherte Elemente und persönliche Einstellungen sichtbarer.",
      "Bu metin, kullanıcı verisine nasıl yaklaştığımızı sade dil ile anlatan ilk çerçevedir.":
        "Dieser Text ist der erste einfache Rahmen dafür, wie wir mit Nutzerdaten umgehen.",
      "Hangi veriler olabilir?": "Welche Daten können anfallen?",
      "Ad ve e-posta gibi temel hesap bilgileri": "Grundlegende Kontodaten wie Name und E-Mail",
      "Tercih ve dil ayarları": "Präferenz- und Spracheinstellungen",
      "Hata ve kullanım kayıtları": "Fehler- und Nutzungsprotokolle",
      "Neden işlenir?": "Warum wird sie verarbeitet?",
      "Hesabı çalıştırmak, tercihleri korumak ve hizmeti iyileştirmek için sınırlı veri kullanılır.":
        "Es werden nur begrenzte Daten verwendet, um das Konto zu betreiben, Einstellungen zu erhalten und den Dienst zu verbessern.",
      "İhtiyaç dışı veri toplamak ana yaklaşımımız değildir.":
        "Das Sammeln unnötiger Daten ist nicht unser Hauptansatz.",
      "Kullanıcı hakları": "Rechte der Nutzer",
      "Bilgi isteme, düzeltme talep etme ve silme isteği gönderme hakkın vardır.":
        "Sie haben das Recht, Auskunft zu verlangen, Korrekturen anzufordern und eine Löschung zu verlangen.",
      "Gizlilik yaklaşımımız, gereksiz veri toplamadan temel hizmeti açık biçimde sunmaktır.":
        "Unser Datenschutzansatz ist, den Kerndienst klar bereitzustellen, ohne unnötige Daten zu sammeln.",
      "Topladığımız veriler": "Welche Daten wir erfassen",
      "Hesap alanı kullanılırsa temel profil bilgileri tutulabilir.":
        "Wenn der Kontobereich genutzt wird, können grundlegende Profildaten gespeichert werden.",
      "Yerel ayarlar ve dil tercihi gibi küçük bilgiler cihaz tarafında saklanabilir.":
        "Kleine Angaben wie lokale Einstellungen und die Sprachwahl können auf dem Gerät gespeichert werden.",
      "Toplamadığımız şeyler": "Was wir nicht erfassen",
      "Gereksiz kişisel profil verisi, ilgisiz belge veya kapsam dışı hassas bilgi istemeyiz.":
        "Wir verlangen keine unnötigen persönlichen Profildaten, keine irrelevanten Dokumente und keine sensiblen Informationen außerhalb des nötigen Rahmens.",
      "Paylaşım ilkesi": "Grundsatz der Weitergabe",
      "Yasal zorunluluk olmadıkça kullanıcı verisini açık ve sınırsız biçimde üçüncü taraflara açmayız.":
        "Sofern keine gesetzliche Pflicht besteht, geben wir Nutzerdaten nicht offen und unbegrenzt an Dritte weiter.",
      "Kullanım sınırları": "Nutzungsgrenzen",
      "Yanıltıcı bilgi göndermeme": "Keine irreführenden Informationen senden",
      "Sistemi bozacak yoğun kötü kullanım yapmama": "Den Dienst nicht durch intensiven Missbrauch stören",
      "Başkalarına ait içeriği izinsiz kopyalamama": "Keine Inhalte anderer ohne Erlaubnis kopieren",
      "İçerik güncellemeleri": "Inhaltsaktualisierungen",
      "Sayfadaki içerikler zaman içinde güncellenebilir, taşınabilir veya yeniden düzenlenebilir.":
        "Die Inhalte auf dieser Seite können im Laufe der Zeit aktualisiert, verschoben oder neu geordnet werden.",
      "Bu sayfa, sitemizde kullanılan çerezlerin ne işe yaradığını, ne kadar süre kaldığını ve tercihlerini nasıl yönetebileceğini sade dille açıklar.":
        "Diese Seite erklärt in einfacher Sprache, wofür die Cookies auf unserer Website genutzt werden, wie lange sie bleiben und wie Sie Ihre Einstellungen verwalten können.",
      "Çerez nedir?": "Was ist ein Cookie?",
      "Çerezler, ziyaret sırasında tarayıcına bırakılan küçük veri dosyalarıdır.":
        "Cookies sind kleine Datendateien, die während eines Besuchs in Ihrem Browser gespeichert werden.",
      "Bazı ayarlar ise çerez yerine tarayıcının yerel kayıt alanında tutulabilir. Amaç, siteyi her seferinde baştan kurmadan daha düzenli çalıştırmaktır.":
        "Einige Einstellungen können statt in Cookies im lokalen Speicher des Browsers abgelegt werden. Ziel ist es, die Website stabiler zu betreiben, ohne alles bei jedem Besuch neu einzurichten.",
      "Kullandığımız başlıca türler": "Die wichtigsten Arten, die wir nutzen",
      "Zorunlu çerezler: oturum, güvenlik ve temel sayfa akışı için":
        "Erforderliche Cookies: für Sitzung, Sicherheit und den grundlegenden Seitenablauf",
      "Tercih çerezleri: dil, tema ve benzer seçimleri hatırlamak için":
        "Präferenz-Cookies: um Sprache, Design und ähnliche Auswahl zu merken",
      "Ölçüm çerezleri: hangi alanların daha çok kullanıldığını anlamak için":
        "Mess-Cookies: um zu verstehen, welche Bereiche häufiger genutzt werden",
      "Üçüncü taraf çerezleri: harici bir araç kullanılırsa o hizmetin teknik kaydı için":
        "Cookies von Drittanbietern: für die technische Funktion eines externen Dienstes, falls ein solcher genutzt wird",
      "Hangi amaçlarla kullanılır?": "Wofür werden sie verwendet?",
      "Dil tercihini hatırlamak": "Die Sprachwahl merken",
      "Tema seçimini korumak": "Die Designwahl beibehalten",
      "Oturum akışını yönetmek": "Den Sitzungsablauf steuern",
      "Sayfa hatalarını ve performans sorunlarını görmek": "Seitenfehler und Leistungsprobleme erkennen",
      "Kötüye kullanımı sınırlamaya yardımcı olmak": "Dabei helfen, Missbrauch zu begrenzen",
      "Saklama süresi ve üçüncü taraflar": "Speicherdauer und Dritte",
      "Bazı çerezler sadece oturum açıkken kalır, bazıları ise belirli bir süre cihazında tutulur. Süre, çerezin amacına göre değişir.":
        "Einige Cookies bleiben nur während der offenen Sitzung bestehen, andere werden für einen bestimmten Zeitraum auf dem Gerät gespeichert. Die Dauer hängt vom Zweck des Cookies ab.",
      "Harici bir analiz, giriş veya medya aracı kullanılırsa ilgili hizmet kendi çerezini oluşturabilir. Bu durumda o hizmetin kendi politikası da devreye girer.":
        "Wenn ein externer Analyse-, Login- oder Mediendienst genutzt wird, kann dieser eigene Cookies setzen. Dann gilt zusätzlich die Richtlinie dieses Dienstes.",
      "Kontrol sende": "Sie behalten die Kontrolle",
      "Tarayıcı ayarlarından çerezleri silebilir, engelleyebilir veya sadece belirli siteler için izin verebilirsin.":
        "In den Browsereinstellungen können Sie Cookies löschen, blockieren oder nur für bestimmte Websites erlauben.",
      "Çerezleri kapatman halinde bazı tercih alanları sıfırlanabilir ve bazı sayfa işlevleri beklenen gibi çalışmayabilir.":
        "Wenn Sie Cookies deaktivieren, können einige Einstellungen zurückgesetzt werden und manche Seitenfunktionen arbeiten möglicherweise nicht wie erwartet.",
      "Zorunlu olmayan yeni çerezler eklenirse bu metni ve varsa tercih ekranını aynı anda güncelleriz.":
        "Wenn neue nicht notwendige Cookies hinzukommen, aktualisieren wir diesen Text und, falls vorhanden, gleichzeitig auch den Einstellungsbildschirm.",
      "Gönder": "Senden",
      "Ad Soyad": "Vollständiger Name",
      "E-posta": "E-Mail",
      "Konu": "Betreff",
      "Genel Konular": "Allgemeine Themen",
      "İş Birliği": "Zusammenarbeit",
      "İçerik Düzeltmeleri": "Inhaltskorrekturen",
      "Alan kodu": "Vorwahl",
      "Telefon numarası": "Telefonnummer",
      "Mesaj": "Nachricht",
      "Telefon bilgisi": "Telefonangaben",
      "İşletme adı": "Name des Unternehmens",
      "İl": "Provinz",
      "İlçe": "Bezirk",
      "Mahalle": "Viertel",
      "Posta kodu": "Postleitzahl"
    },
  });

  function footerPageLanguage() {
    return typeof window.ARAMABUL_GET_LANGUAGE === "function"
      ? String(window.ARAMABUL_GET_LANGUAGE() || "TR").trim().toUpperCase()
      : "TR";
  }

  function footerT(value) {
    const source = String(value || "");
    if (!source) {
      return source;
    }

    const lang = footerPageLanguage();
    const localPack = FOOTER_PAGE_TEXT[lang];
    if (localPack && typeof localPack[source] === "string") {
      return localPack[source];
    }

    const headerI18n = window.ARAMABUL_HEADER_I18N;
    if (headerI18n && typeof headerI18n.getStaticUiTranslation === "function") {
      return headerI18n.getStaticUiTranslation(source, lang) || source;
    }

    return source;
  }
  const PLACE_SUBMISSION_CONTENT = {
    hideHero: true,
    eyebrow: "İş ortaklığı",
    title: "Yer ekle",
    lead: "Yeni bir işletme veya hizmet noktası eklemek için aşağıdaki formu doldurup gönder tuşuna basınız.",
    cards: [],
    form: {
      title: "Yer ekle",
      description: "Yeni bir işletme veya hizmet noktası eklemek için aşağıdaki formu doldurup gönder tuşuna basınız.",
      submitLabel: "Gönder",
      successText:
        "Bilgiler alındı. Adres alanlarını PTT kaynağıyla eşleştirdiysen inceleme daha hızlı ilerler.",
      districtsUrl: "data/districts.json",
      neighborhoodsUrl: "data/location-neighborhoods.json",
      postcodesUrl: "data/location-postcodes.json",
    },
  };
  const PAGE_CONTENT = Object.freeze({
    "app-store": {
      eyebrow: "Mobil uygulama",
      title: "App Store sayfası",
      lead: "iPhone ve iPad için hazırladığımız uygulama akışını burada önden anlatıyoruz.",
      cards: [
        {
          title: "Neleri hedefliyoruz?",
          paragraphs: [
            "App Store sürümünde arama, kategori takibi ve favori kaydetme akışını tek ekranda toplamak istiyoruz.",
            "İlk sürümde hızlı arama, konuma yakın sonuç ve sade profil alanı ana odak olacak.",
          ],
        },
        {
          title: "Yayın planı",
          bullets: [
            "Kapalı test ile küçük bir kullanıcı grubunda başlayacağız.",
            "Geri bildirimleri topladıktan sonra açık yayına geçeceğiz.",
            "Sürüm notlarını bu sayfada sade biçimde paylaşacağız.",
          ],
        },
      ],
      strip: {
        title: "İlk not",
        text: "iOS sürümü hazırlıkta. Yayın tarihi netleşince bu alanı güncelleyeceğiz.",
      },
    },
    "google-play": {
      eyebrow: "Mobil uygulama",
      title: "Google Play sayfası",
      lead: "Android kullanıcıları için hafif, hızlı ve kolay gezinilen bir deneyim planlıyoruz.",
      cards: [
        {
          title: "Android öncelikleri",
          paragraphs: [
            "Düşük donanımlı cihazlarda da akıcı çalışan bir yapı kuruyoruz.",
            "Kategori geçişleri, harita açılışı ve profil ayarları kısa adımlarla kullanılacak.",
          ],
        },
        {
          title: "Erken sürümde olacaklar",
          bullets: [
            "Temel kategori arama",
            "Kayıt ve giriş akışı",
            "Kaydedilen içerikler için basit takip alanı",
          ],
        },
      ],
      strip: {
        title: "Güncel durum",
        text: "Android dağıtımı için temel yapı hazır. İlk beta yayımlandığında bu sayfadan duyuracağız.",
      },
    },
    hakkimizda: {
      eyebrow: "",
      title: "Hakkımızda",
      lead: "Aramabul, kullanıcının bir yeri ararken, en kısa yoldan ve net bilgi bulmasını amaçlayan sade tasarımlı bir yardımcıdır.",
      cards: [
        {
          title: "Neden var?",
          paragraphs: [
            "İnsanlar çoğu zaman bir yerin adını değil, ihtiyacını bilir. Biz de aramayı ihtiyaçtan başlatıyoruz.",
            "Amaç, gereksiz kalabalığı ve çabayı azaltarak, ihtiyaç duyduğunuz hizmet ve ürüne daha hızlı ulaşmanızı sağlamak.",
          ],
        },
        {
          title: "Nasıl çalışır?",
          paragraphs: [
            "Kategori, şehir ve ilçe katmanları sırasıyla, önce alt kategoriler, son olarak da hizmet mekanları seçenekleri ile sizi buluşturuyoruz.",
            "Bilgiyi kutu yapısında sunarak, kullanıcıyı uzun sayfalarda dolaştırmadan net karar alanına ulaştırıyoruz. İhtiyaç duyduğunuz hizmeti alacağınız mekanı, tüm ulaşım ve iletişim bilgileri ile, en kullanıcı dostu biçimde görmenizi sağlıyoruz.",
          ],
        },
        {
          title: "Temel yaklaşımımız",
          bullets: [
            "Basit arayüz",
            "Açık bilgi",
            "Hızlı ve ayrıntılı yönlendirme",
          ],
        },
      ],
    },
    iletisim: {
      eyebrow: "Destek",
      title: "İletişim",
      lead: "Soru, öneri ve iş talepleriniz için aşağıdaki formu doldurunuz.",
      form: {
        kind: "contact",
        title: "",
        description: "",
        submitLabel: "Gönder",
        successText: "Mesajın hazırlandı. İlgili ekibe en kısa sürede yönlendireceğiz.",
      },
      cards: [],
    },
    sss: {
      eyebrow: "Yardım",
      title: "Sıkça Sorulan Sorular",
      lead: "En çok sorulan temel konuları kısa ve kolay anlaşılır cevaplarla bir araya getirdik.",
      cards: [
        {
          title: "Nasıl arama yaparım?",
          paragraphs: [
            "Üst arama alanından doğrudan mekan adı yazabilir ya da anasayfadan kategori seçebilirsin.",
            "Kategori sayfalarında şehir ve ilçe adımı ile sonuçları daraltabilirsin.",
          ],
        },
        {
          title: "Bilgi yanlışsa ne yapmalıyım?",
          paragraphs: [
            "Bize sayfa bağlantısı ile birlikte doğru bilgiyi gönder.",
            "İnceleme sonrası içerik güncellenir.",
          ],
        },
        {
          title: "Hesap şart mı?",
          paragraphs: [
            "Temel gezinme için hesap gerekmez.",
            "Favori, kayıt ve kişisel tercih akışları için hesap alanı sonraki adımlarda daha görünür hale gelecek.",
          ],
        },
      ],
    },
    kvkk: {
      eyebrow: "Yasal",
      title: "Kişisel Verilerin Korunması",
      lead: "Bu metin, kullanıcı verisine nasıl yaklaştığımızı sade dil ile anlatan ilk çerçevedir.",
      cards: [
        {
          title: "Hangi veriler olabilir?",
          bullets: [
            "Ad ve e-posta gibi temel hesap bilgileri",
            "Tercih ve dil ayarları",
            "Hata ve kullanım kayıtları",
          ],
        },
        {
          title: "Neden işlenir?",
          paragraphs: [
            "Hesabı çalıştırmak, tercihleri korumak ve hizmeti iyileştirmek için sınırlı veri kullanılır.",
            "İhtiyaç dışı veri toplamak ana yaklaşımımız değildir.",
          ],
        },
        {
          title: "Kullanıcı hakları",
          paragraphs: [
            "Bilgi isteme, düzeltme talep etme ve silme isteği gönderme hakkın vardır.",
          ],
        },
      ],
    },
    gizlilik: {
      eyebrow: "Yasal",
      title: "Gizlilik Politikası",
      lead: "Gizlilik yaklaşımımız, gereksiz veri toplamadan temel hizmeti açık biçimde sunmaktır.",
      cards: [
        {
          title: "Topladığımız veriler",
          paragraphs: [
            "Hesap alanı kullanılırsa temel profil bilgileri tutulabilir.",
            "Yerel ayarlar ve dil tercihi gibi küçük bilgiler cihaz tarafında saklanabilir.",
          ],
        },
        {
          title: "Toplamadığımız şeyler",
          paragraphs: [
            "Gereksiz kişisel profil verisi, ilgisiz belge veya kapsam dışı hassas bilgi istemeyiz.",
          ],
        },
        {
          title: "Paylaşım ilkesi",
          paragraphs: [
            "Yasal zorunluluk olmadıkça kullanıcı verisini açık ve sınırsız biçimde üçüncü taraflara açmayız.",
          ],
        },
      ],
    },
    kosullar: {
      eyebrow: "Yasal",
      title: "Kullanım Koşulları",
      lead: "",
      cards: [
        {
          title: "Kullanım sınırları",
          bullets: [
            "Yanıltıcı bilgi göndermeme",
            "Sistemi bozacak yoğun kötü kullanım yapmama",
            "Başkalarına ait içeriği izinsiz kopyalamama",
          ],
        },
        {
          title: "İçerik güncellemeleri",
          paragraphs: [
            "Sayfadaki içerikler zaman içinde güncellenebilir, taşınabilir veya yeniden düzenlenebilir.",
          ],
        },
      ],
    },
    cerez: {
      eyebrow: "Yasal",
      title: "Çerez Politikası",
      lead: "Bu sayfa, sitemizde kullanılan çerezlerin ne işe yaradığını, ne kadar süre kaldığını ve tercihlerini nasıl yönetebileceğini sade dille açıklar.",
      cards: [
        {
          title: "Çerez nedir?",
          paragraphs: [
            "Çerezler, ziyaret sırasında tarayıcına bırakılan küçük veri dosyalarıdır.",
            "Bazı ayarlar ise çerez yerine tarayıcının yerel kayıt alanında tutulabilir. Amaç, siteyi her seferinde baştan kurmadan daha düzenli çalıştırmaktır.",
          ],
        },
        {
          title: "Kullandığımız başlıca türler",
          bullets: [
            "Zorunlu çerezler: oturum, güvenlik ve temel sayfa akışı için",
            "Tercih çerezleri: dil, tema ve benzer seçimleri hatırlamak için",
            "Ölçüm çerezleri: hangi alanların daha çok kullanıldığını anlamak için",
            "Üçüncü taraf çerezleri: harici bir araç kullanılırsa o hizmetin teknik kaydı için",
          ],
        },
        {
          title: "Hangi amaçlarla kullanılır?",
          bullets: [
            "Dil tercihini hatırlamak",
            "Tema seçimini korumak",
            "Oturum akışını yönetmek",
            "Sayfa hatalarını ve performans sorunlarını görmek",
            "Kötüye kullanımı sınırlamaya yardımcı olmak",
          ],
        },
        {
          title: "Saklama süresi ve üçüncü taraflar",
          paragraphs: [
            "Bazı çerezler sadece oturum açıkken kalır, bazıları ise belirli bir süre cihazında tutulur. Süre, çerezin amacına göre değişir.",
            "Harici bir analiz, giriş veya medya aracı kullanılırsa ilgili hizmet kendi çerezini oluşturabilir. Bu durumda o hizmetin kendi politikası da devreye girer.",
          ],
        },
        {
          title: "Kontrol sende",
          paragraphs: [
            "Tarayıcı ayarlarından çerezleri silebilir, engelleyebilir veya sadece belirli siteler için izin verebilirsin.",
            "Çerezleri kapatman halinde bazı tercih alanları sıfırlanabilir ve bazı sayfa işlevleri beklenen gibi çalışmayabilir.",
          ],
        },
      ],
    },
    "yer-ekle": PLACE_SUBMISSION_CONTENT,
    "fiyat-ekle": PLACE_SUBMISSION_CONTENT,
    instagram: {
      eyebrow: "Sosyal",
      title: "Instagram",
      lead: "Instagram tarafında daha çok görsel anlatım, kısa keşif listeleri ve yeni özellik duyuruları paylaşmayı hedefliyoruz.",
      cards: [
        {
          title: "Burada ne olur?",
          bullets: [
            "Yeni kategori duyuruları",
            "Kısa içerik kartları",
            "Arayüz yenilikleri",
          ],
        },
        {
          title: "Takip edenler ne beklemeli?",
          paragraphs: [
            "Daha sık ama kısa paylaşımlar. Hızlı özet ve net görsel öncelikli olur.",
          ],
        },
      ],
    },
    x: {
      eyebrow: "Sosyal",
      title: "X",
      lead: "X sayfası, kısa ürün güncellemeleri, hata notları ve hızlı duyurular için düşünülür.",
      cards: [
        {
          title: "Kullanım amacı",
          paragraphs: [
            "Kısa güncellemeler, bakım notları ve topluluk geri bildirimlerine hızlı dönüş için bu kanal daha uygun olur.",
          ],
        },
        {
          title: "Paylaşım tipi",
          bullets: [
            "Sürüm notları",
            "Kısa yol haritası notları",
            "Anlık bilgilendirme",
          ],
        },
      ],
    },
    facebook: {
      eyebrow: "Sosyal",
      title: "Facebook",
      lead: "Facebook tarafında daha açıklayıcı gönderiler, topluluk güncellemeleri ve duyuru arşivi yer alabilir.",
      cards: [
        {
          title: "İçerik tipi",
          paragraphs: [
            "Biraz daha uzun açıklamalı duyurular ve topluluk odaklı gönderiler bu alan için daha uygundur.",
          ],
        },
        {
          title: "Topluluk kuralı",
          bullets: [
            "Saygılı dil",
            "Açık geri bildirim",
            "Kısa ve konuya uygun yorum",
          ],
        },
      ],
    },
  });

  function currentKey() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get("sayfa") || params.get("page") || DEFAULT_KEY).trim();
  }

  function pageContent() {
    return PAGE_CONTENT[currentKey()] || PAGE_CONTENT[DEFAULT_KEY];
  }

  function setText(id, value) {
    const node = document.querySelector(id);
    if (node) {
      node.textContent = footerT(value);
    }
  }

  function renderCards(cards) {
    const grid = document.querySelector("#contentPageGrid");
    if (!(grid instanceof HTMLElement)) {
      return;
    }

    grid.innerHTML = "";
    grid.hidden = !Array.isArray(cards) || cards.length === 0;

    if (grid.hidden) {
      return;
    }

    cards.forEach((cardData) => {
      const card = document.createElement("article");
      card.className = "content-page-card";

      const title = document.createElement("h2");
      title.textContent = footerT(cardData.title);
      card.append(title);

      const paragraphs = Array.isArray(cardData.paragraphs) ? cardData.paragraphs : [];
      paragraphs.forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = footerT(text);
        card.append(paragraph);
      });

      const bullets = Array.isArray(cardData.bullets) ? cardData.bullets : [];
      if (bullets.length > 0) {
        const list = document.createElement("ul");
        list.className = "content-page-list";
        bullets.forEach((text) => {
          const item = document.createElement("li");
          item.textContent = footerT(text);
          list.append(item);
        });
        card.append(list);
      }

      grid.append(card);
    });
  }

  function renderSubmissionForm(formConfig) {
    const wrap = document.querySelector("#contentPageFormSection");
    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    wrap.innerHTML = "";
    wrap.hidden = true;

    if (!formConfig || typeof formConfig !== "object") {
      return;
    }

    const title = footerT(String(formConfig.title || "").trim());
    const description = footerT(String(formConfig.description || "").trim());
    const formKind = String(formConfig.kind || "place").trim();
    const submitLabel = footerT(String(formConfig.submitLabel || "Gönder").trim());
    const note = footerT(String(formConfig.note || "").trim());
    const successText = footerT(String(formConfig.successText || "Bilgiler hazırlandı.").trim());
    const districtsUrl = String(formConfig.districtsUrl || "").trim();
    const neighborhoodsUrl = String(formConfig.neighborhoodsUrl || "").trim();
    const postcodesUrl = String(formConfig.postcodesUrl || "").trim();
    const districtsByCity = {};
    const neighborhoodsByLocation = {};
    let postalCodeByLocation = {};

    const card = document.createElement("section");
    card.className = "content-page-form-card";

    if (title) {
      const heading = document.createElement("h2");
      heading.textContent = title;
      card.append(heading);
    }

    if (description) {
      const text = document.createElement("p");
      text.textContent = description;
      card.append(text);
    }

    const form = document.createElement("form");
    form.className = "content-page-form";
    form.noValidate = true;

    const grid = document.createElement("div");
    grid.className = "content-page-form-grid";

    function buildField(labelText, control, span = "half") {
      const label = document.createElement("label");
      label.className = "content-page-field";
      label.dataset.span = span;
      label.append(control);
      return label;
    }

    function buildInput(type, name, placeholder, required, autocomplete = "") {
      const input = document.createElement("input");
      input.type = type;
      input.name = name;
      input.placeholder = footerT(placeholder);
      input.required = required;
      if (autocomplete) {
        input.autocomplete = autocomplete;
      }
      return input;
    }

    function lockPlaceholderTranslation(control) {
      control.setAttribute("data-no-static-translate", "true");
      return control;
    }

    function finalizeForm(actionsNode, statusNode) {
      form.append(grid);
      form.append(actionsNode);
      form.append(statusNode);
      card.append(form);
      wrap.append(card);
      wrap.hidden = false;
    }

    if (formKind === "contact") {
      const contactTargets = Object.freeze({
        destek: {
          label: footerT("Genel Konular"),
          address: "destek@aramabul.com",
          subject: footerT("Genel Konular"),
        },
        ortaklik: {
          label: footerT("İş Birliği"),
          address: "ortaklik@aramabul.com",
          subject: footerT("İş Birliği"),
        },
        icerik: {
          label: footerT("İçerik Düzeltmeleri"),
          address: "icerik@aramabul.com",
          subject: footerT("İçerik Düzeltmeleri"),
        },
      });
      const fullName = lockPlaceholderTranslation(buildInput("text", "fullName", "Ad Soyad", true, "name"));
      const email = buildInput("email", "email", "E-posta", true, "email");
      const subjectSelect = document.createElement("select");
      const phoneAreaCode = buildInput("text", "phoneAreaCode", "Alan kodu", false, "tel-area-code");
      const phoneNumber = buildInput("tel", "phoneNumber", "Telefon numarası", false, "tel-local");
      const message = lockPlaceholderTranslation(document.createElement("textarea"));

      subjectSelect.name = "topic";
      subjectSelect.required = true;

      message.name = "message";
      message.placeholder = footerT("Mesaj");
      message.required = true;

      phoneAreaCode.inputMode = "numeric";
      phoneAreaCode.maxLength = 3;
      phoneAreaCode.pattern = "\\d{3}";
      phoneNumber.inputMode = "numeric";
      phoneNumber.maxLength = 7;
      phoneNumber.pattern = "\\d{7}";

      fillSelect(
        subjectSelect,
        footerT("Konu"),
        Object.entries(contactTargets).map(([key, target]) => ({
          value: key,
          label: target.label,
        }))
      );

      const phoneGroup = document.createElement("div");
      phoneGroup.className = "content-page-phone-group";

      const countryCode = document.createElement("span");
      countryCode.className = "content-page-phone-prefix";
      countryCode.textContent = "+90";

      phoneGroup.append(countryCode, phoneAreaCode, phoneNumber);

      grid.append(buildField(footerT("Ad Soyad"), fullName, "full"));
      grid.append(buildField(footerT("E-posta"), email, "full"));
      grid.append(buildField(footerT("Konu"), subjectSelect, "full"));
      grid.append(buildField(footerT("Telefon bilgisi"), phoneGroup, "full"));
      grid.append(buildField(footerT("Mesaj"), message, "full"));

      const actions = document.createElement("div");
      actions.className = "content-page-form-actions";

      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.className = "content-page-form-button";
      submitButton.textContent = submitLabel;
      actions.append(submitButton);

      if (note) {
        const noteNode = document.createElement("p");
        noteNode.className = "content-page-form-note";
        noteNode.textContent = note;
        actions.append(noteNode);
      }

      const status = document.createElement("p");
      status.className = "content-page-form-status";
      status.setAttribute("aria-live", "polite");

      subjectSelect.addEventListener("change", () => {
        syncSelectState(subjectSelect);
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          status.dataset.state = "error";
          status.textContent = footerT("Lütfen ad, e-posta, konu ve mesaj alanlarını doldur.");
          return;
        }

        const selectedTarget = contactTargets[subjectSelect.value];
        if (!selectedTarget) {
          status.dataset.state = "error";
          status.textContent = footerT("Lütfen konu seçimini tamamla.");
          return;
        }

        const messageLines = [
          `Ad Soyad: ${fullName.value.trim()}`,
          `E-posta: ${email.value.trim()}`,
        ];
        const areaCode = phoneAreaCode.value.trim();
        const localNumber = phoneNumber.value.trim();
        if (areaCode || localNumber) {
          messageLines.push(`Telefon: +90 ${areaCode} ${localNumber}`.trim());
        }
        messageLines.push("", message.value.trim());

        const mailtoHref =
          `mailto:${selectedTarget.address}`
          + `?subject=${encodeURIComponent(selectedTarget.subject)}`
          + `&body=${encodeURIComponent(messageLines.join("\n"))}`;

        status.dataset.state = "success";
        status.textContent = `${successText} ${selectedTarget.address}`;
        window.location.href = mailtoHref;
      });

      finalizeForm(actions, status);
      return;
    }

    function normalizeLocationToken(value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/\bmah(allesi)?\b/gi, "mah")
        .replace(/\bkoy(u)?\b/gi, "koy")
        .replace(/\bköy(ü)?\b/gi, "köy")
        .replace(/[^a-z0-9çğıöşü]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function formatNeighborhoodName(value) {
      return String(value || "")
        .replace(/Mah\.\.+/gi, "Mah.")
        .replace(/\.\.+/g, ".")
        .replace(/\s+/g, " ")
        .trim();
    }

    function locationKey(...parts) {
      return parts.map((part) => normalizeLocationToken(part)).join("|");
    }

    function syncSelectState(selectNode) {
      selectNode.dataset.empty = selectNode.value ? "false" : "true";
    }

    function fillSelect(selectNode, placeholder, values) {
      selectNode.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = footerT(placeholder);
      selectNode.append(defaultOption);

      values.forEach((value) => {
        const option = document.createElement("option");
        if (value && typeof value === "object") {
          option.value = String(value.value || "");
          option.textContent = footerT(String(value.label || value.value || ""));
        } else {
          option.value = value;
          option.textContent = footerT(value);
        }
        selectNode.append(option);
      });

      selectNode.value = "";
      syncSelectState(selectNode);
    }

    const businessName = buildInput("text", "businessName", "İşletme adı", true, "organization");
    const citySelect = document.createElement("select");
    const districtSelect = document.createElement("select");
    const neighborhoodSelect = document.createElement("select");
    const street = buildInput("text", "street", "Sokak / Cadde / Bulvar", true, "street-address");
    const doorNumber = buildInput("text", "doorNumber", "Bina no / Kapı no", true, "address-line2");
    const postalCode = buildInput("text", "postalCode", "Posta kodu", true, "postal-code");
    const phoneAreaCode = buildInput("text", "phoneAreaCode", "Alan kodu", true, "tel-area-code");
    const phoneNumber = buildInput("tel", "phoneNumber", "Telefon numarası", true, "tel-local");
    const website = buildInput("url", "website", "https://ornek.com", false, "url");

    postalCode.inputMode = "numeric";
    postalCode.maxLength = 5;
    postalCode.pattern = "\\d{5}";
    phoneAreaCode.inputMode = "numeric";
    phoneAreaCode.maxLength = 3;
    phoneAreaCode.pattern = "\\d{3}";
    phoneNumber.inputMode = "numeric";
    phoneNumber.maxLength = 7;
    phoneNumber.pattern = "\\d{7}";

    citySelect.name = "city";
    citySelect.required = true;
    districtSelect.name = "district";
    districtSelect.required = true;
    neighborhoodSelect.name = "neighborhood";
    neighborhoodSelect.required = true;
    districtSelect.disabled = true;
    neighborhoodSelect.disabled = true;
    citySelect.disabled = true;

    postalCode.readOnly = true;

    fillSelect(citySelect, "İl", []);
    fillSelect(districtSelect, "İlçe", []);
    fillSelect(neighborhoodSelect, "Mahalle", []);

    function syncPostalCode() {
      const selectedCity = citySelect.value;
      const selectedDistrict = districtSelect.value;
      const selectedNeighborhood = neighborhoodSelect.value;
      const hasFullSelection = Boolean(selectedCity && selectedDistrict && selectedNeighborhood);
      const key = hasFullSelection ? locationKey(selectedCity, selectedDistrict, selectedNeighborhood) : "";
      const matchedPostalCode = key ? String(postalCodeByLocation[key] || "").trim() : "";

      postalCode.value = matchedPostalCode;
      postalCode.readOnly = !hasFullSelection || Boolean(matchedPostalCode);
      postalCode.placeholder = !hasFullSelection
        ? footerT("Posta kodu")
        : matchedPostalCode
          ? footerT("Posta kodu")
          : footerT("Posta kodu");
    }

    function updateNeighborhoods() {
      const selectedCity = citySelect.value;
      const selectedDistrict = districtSelect.value;
      const key = selectedCity && selectedDistrict ? locationKey(selectedCity, selectedDistrict) : "";
      const neighborhoods = key ? neighborhoodsByLocation[key] || [] : [];

      fillSelect(neighborhoodSelect, "Mahalle", neighborhoods);
      neighborhoodSelect.disabled = neighborhoods.length === 0;
      syncSelectState(neighborhoodSelect);
      syncPostalCode();
    }

    function updateDistricts() {
      const selectedCity = citySelect.value;
      const districts = selectedCity ? districtsByCity[selectedCity] || [] : [];

      fillSelect(districtSelect, "İlçe", districts);
      districtSelect.disabled = districts.length === 0;
      fillSelect(neighborhoodSelect, "Mahalle", []);
      neighborhoodSelect.disabled = true;
      syncSelectState(districtSelect);
      syncSelectState(neighborhoodSelect);
      syncPostalCode();
    }

    citySelect.addEventListener("change", () => {
      syncSelectState(citySelect);
      updateDistricts();
    });
    districtSelect.addEventListener("change", () => {
      syncSelectState(districtSelect);
      updateNeighborhoods();
    });
    neighborhoodSelect.addEventListener("change", () => {
      syncSelectState(neighborhoodSelect);
      syncPostalCode();
    });

    grid.append(buildField(footerT("İşletme adı"), businessName, "full"));
    grid.append(buildField(footerT("İl"), citySelect, "full"));
    grid.append(buildField(footerT("İlçe"), districtSelect, "full"));
    grid.append(buildField(footerT("Mahalle"), neighborhoodSelect, "full"));
    grid.append(buildField(footerT("Sokak / Cadde"), street));
    grid.append(buildField(footerT("Bina / Kapı no"), doorNumber));
    const phoneGroup = document.createElement("div");
    phoneGroup.className = "content-page-phone-group";

    const countryCode = document.createElement("span");
    countryCode.className = "content-page-phone-prefix";
    countryCode.textContent = "+90";

    phoneGroup.append(countryCode, phoneAreaCode, phoneNumber);

    grid.append(buildField(footerT("Posta kodu"), postalCode));
    grid.append(buildField(footerT("Telefon bilgisi"), phoneGroup, "full"));
    grid.append(buildField(footerT("Web sitesi (varsa)"), website, "full"));
    const actions = document.createElement("div");
    actions.className = "content-page-form-actions";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "content-page-form-button";
    submitButton.textContent = submitLabel;
    actions.append(submitButton);

    if (note) {
      const noteNode = document.createElement("p");
      noteNode.className = "content-page-form-note";
      noteNode.textContent = note;
      actions.append(noteNode);
    }

    const status = document.createElement("p");
    status.className = "content-page-form-status";
    status.setAttribute("aria-live", "polite");

    async function loadDistricts() {
      if (!districtsUrl || !neighborhoodsUrl) {
        fillSelect(citySelect, "İl", []);
        fillSelect(districtSelect, "İlçe", []);
        fillSelect(neighborhoodSelect, "Mahalle", []);
        status.dataset.state = "error";
        status.textContent = footerT("İl, ilçe ve mahalle için veri kaynağı tanımlanmadı.");
        return;
      }

      try {
        const [districtResponse, neighborhoodResponse, postcodeResponse] = await Promise.all([
          fetch(districtsUrl, { cache: "no-store" }),
          fetch(neighborhoodsUrl, { cache: "no-store" }),
          postcodesUrl ? fetch(postcodesUrl, { cache: "no-store" }) : null,
        ]);

        if (!districtResponse.ok || !neighborhoodResponse.ok) {
          throw new Error("location fetch failed");
        }

        const [districtPayload, neighborhoodPayload, postcodePayload] = await Promise.all([
          districtResponse.json(),
          neighborhoodResponse.json(),
          postcodeResponse && postcodeResponse.ok ? postcodeResponse.json() : {},
        ]);

        if (!districtPayload || typeof districtPayload !== "object" || Array.isArray(districtPayload)) {
          throw new Error("invalid payload");
        }

        if (!neighborhoodPayload || typeof neighborhoodPayload !== "object" || Array.isArray(neighborhoodPayload)) {
          throw new Error("invalid neighborhood payload");
        }

        if (postcodePayload && typeof postcodePayload === "object" && !Array.isArray(postcodePayload)) {
          postalCodeByLocation = postcodePayload;
        }

        const cities = Object.keys(districtPayload).sort((left, right) => left.localeCompare(right, "tr"));
        cities.forEach((city) => {
          const districts = Array.isArray(districtPayload[city]) ? districtPayload[city] : [];
          districtsByCity[city] = [...districts].sort((left, right) => left.localeCompare(right, "tr"));
        });

        Object.keys(neighborhoodPayload).forEach((city) => {
          const districtMap = neighborhoodPayload[city];
          if (!districtMap || typeof districtMap !== "object" || Array.isArray(districtMap)) {
            return;
          }

          Object.keys(districtMap).forEach((district) => {
            const rawNeighborhoods = Array.isArray(districtMap[district]) ? districtMap[district] : [];
            const cleaned = rawNeighborhoods
              .map((item) => formatNeighborhoodName(item))
              .filter(Boolean)
              .filter((item, index, source) => source.indexOf(item) === index)
              .sort((left, right) => left.localeCompare(right, "tr"));

            neighborhoodsByLocation[locationKey(city, district)] = cleaned;
          });
        });

        fillSelect(citySelect, "İl", cities);
        citySelect.disabled = cities.length === 0;
        fillSelect(districtSelect, "İlçe", []);
        districtSelect.disabled = true;
        fillSelect(neighborhoodSelect, "Mahalle", []);
        neighborhoodSelect.disabled = true;
        syncSelectState(citySelect);
        syncSelectState(districtSelect);
        syncSelectState(neighborhoodSelect);
        status.dataset.state = "";
        status.textContent = "";
      } catch (_error) {
        fillSelect(citySelect, "İl", []);
        fillSelect(districtSelect, "İlçe", []);
        fillSelect(neighborhoodSelect, "Mahalle", []);
        citySelect.disabled = true;
        districtSelect.disabled = true;
        neighborhoodSelect.disabled = true;
        status.dataset.state = "error";
        status.textContent =
          footerT("İl, ilçe veya mahalle verisi yüklenemedi. Adresi PTT kaynağından kontrol ederek elle tamamlamalısın.");
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        status.dataset.state = "error";
        status.textContent =
          footerT("Lütfen zorunlu alanları eksiksiz doldur, adres seçimlerini tamamla ve posta kodu otomatik gelmezse 5 hane olarak gir.");
        return;
      }

      status.dataset.state = "success";
      status.textContent = successText;
    });

    finalizeForm(actions, status);
    loadDistricts();
  }

  function renderStrip(strip) {
    const wrap = document.querySelector("#contentPageStrip");
    const titleNode = document.querySelector("#contentPageStripTitle");
    const textNode = document.querySelector("#contentPageStripText");

    if (!(wrap instanceof HTMLElement) || !(titleNode instanceof HTMLElement) || !(textNode instanceof HTMLElement)) {
      return;
    }

    titleNode.textContent = strip && strip.title ? footerT(strip.title) : "";
    textNode.textContent = strip && strip.text ? footerT(strip.text) : "";
    wrap.hidden = !(strip && (strip.title || strip.text));
  }

  function applyFooterPageTranslations() {
    const headerI18n = window.ARAMABUL_HEADER_I18N;
    if (!headerI18n || typeof headerI18n !== "object") {
      return;
    }

    if (typeof headerI18n.applyStaticPageTranslations === "function") {
      headerI18n.applyStaticPageTranslations();
    }

    if (typeof headerI18n.normalizeFooterUi === "function") {
      headerI18n.normalizeFooterUi();
    }
  }

  function applyPageContent() {
    const rawKey = currentKey();
    const key = PAGE_CONTENT[rawKey] ? rawKey : DEFAULT_KEY;
    const content = PAGE_CONTENT[key];
    const title = String(content.title || "Bilgi Sayfası").trim();
    const lead = String(content.lead || "").trim();
    const shell = document.querySelector(".content-page-shell");
    const eyebrowNode = document.querySelector("#contentPageEyebrow");
    const heroNode = document.querySelector(".content-page-hero");

    if (shell instanceof HTMLElement) {
      shell.dataset.pageKey = key;
    }

    if (heroNode instanceof HTMLElement) {
      heroNode.hidden = Boolean(content.hideHero);
    }

    if (eyebrowNode instanceof HTMLElement) {
      eyebrowNode.textContent = "";
      eyebrowNode.hidden = true;
    }
    setText("#contentPageTitle", title);
    setText("#contentPageLead", lead);
    setText("#contentPageBreadcrumb", title);

    document.title = `aramabul | ${footerT(title)}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription instanceof HTMLMetaElement) {
      metaDescription.setAttribute("content", footerT(lead || `${title} bilgi sayfası.`));
    }

    renderCards(Array.isArray(content.cards) ? content.cards : []);
    renderSubmissionForm(content.form);
    renderStrip(content.strip);
    applyFooterPageTranslations();
  }

  applyPageContent();
  document.addEventListener("aramabul:languagechange", () => {
    applyPageContent();
  });
})();
