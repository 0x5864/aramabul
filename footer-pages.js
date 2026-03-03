(() => {
  const DEFAULT_KEY = "hakkimizda";
  const PLACE_SUBMISSION_CONTENT = {
    hideHero: true,
    eyebrow: "İş ortaklığı",
    title: "Yer ekle",
    lead: "Yeni bir işletme veya hizmet noktası eklemek için aşağıdaki formu doldurup gönder tuşuna basınız.",
    cards: [],
    form: {
      title: "Bilgi gönderme",
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
    teknoloji: {
      eyebrow: "Altyapı",
      title: "Teknoloji",
      lead: "Bu alanda veri akışı, sayfa mantığı ve içerik güncelleme biçimi için kısa bir çerçeve sunuyoruz.",
      cards: [
        {
          title: "Veri düzeni",
          paragraphs: [
            "Kategori verileri ayrı dosyalarda tutulur. Böylece her alan kendi güncelleme hızında ilerler.",
            "Bu yaklaşım, kategori bazlı bakım ve hızlı düzeltme işini kolaylaştırır.",
          ],
        },
        {
          title: "Ön yüz yaklaşımı",
          paragraphs: [
            "Statik sayfalar ve hafif istemci kodu ile hızlı açılan bir yapı hedeflenir.",
            "Kritik akışlarda az adım, düşük yük ve kolay gezinme önceliklidir.",
          ],
        },
        {
          title: "Sıradaki teknik adımlar",
          bullets: [
            "Daha iyi veri doğrulama",
            "Senkron içerik güncelleme",
            "Daha net hata geri bildirimi",
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
      strip: {
        title: "Kısa not",
        text: "Mesajını konu ve kısa bağlamla gönderirsen doğru ekibe daha hızlı yönlendirebiliriz.",
      },
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
      lead: "Bu alan, sitenin adil ve güvenli kullanım çerçevesini basit dille özetler.",
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
        {
          title: "Hizmet durumu",
          paragraphs: [
            "Bazı bölümler test aşamasında olabilir. Bu yüzden zaman zaman tasarım veya akış değişebilir.",
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
      strip: {
        title: "Kısa not",
        text: "Zorunlu olmayan yeni çerezler eklenirse bu metni ve varsa tercih ekranını aynı anda güncelleriz.",
      },
    },
    "yer-ekle": PLACE_SUBMISSION_CONTENT,
    "fiyat-ekle": PLACE_SUBMISSION_CONTENT,
    "is-birligi": {
      eyebrow: "İş ortaklığı",
      title: "İş birliği",
      lead: "Markalar, yerel işletmeler ve içerik ortakları ile çalışmak için ilk iş birliği çerçevesini burada topladık.",
      cards: [
        {
          title: "Kimlerle çalışıyoruz?",
          bullets: [
            "Yerel işletmeler",
            "Kategori bazlı veri sağlayıcılar",
            "Şehir odaklı içerik ortakları",
          ],
        },
        {
          title: "Nasıl ilerler?",
          paragraphs: [
            "İhtiyaç, kapsam ve teslim şekli kısa bir görüşme ile netleşir.",
            "Ardından örnek akış ve yayın planı paylaşılır.",
          ],
        },
        {
          title: "Önem verdiğimiz şey",
          paragraphs: [
            "Kısa, net ve kullanıcıya gerçek fayda sağlayan ortaklıklar kurmak.",
          ],
        },
      ],
      strip: {
        title: "Bir sonraki adım",
        text: "İstersen bu alanı daha sonra gerçek başvuru formu ve teklif akışına çevirebiliriz.",
      },
    },
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
      node.textContent = value;
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
      title.textContent = cardData.title;
      card.append(title);

      const paragraphs = Array.isArray(cardData.paragraphs) ? cardData.paragraphs : [];
      paragraphs.forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        card.append(paragraph);
      });

      const bullets = Array.isArray(cardData.bullets) ? cardData.bullets : [];
      if (bullets.length > 0) {
        const list = document.createElement("ul");
        list.className = "content-page-list";
        bullets.forEach((text) => {
          const item = document.createElement("li");
          item.textContent = text;
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

    const title = String(formConfig.title || "").trim();
    const description = String(formConfig.description || "").trim();
    const formKind = String(formConfig.kind || "place").trim();
    const submitLabel = String(formConfig.submitLabel || "Gönder").trim();
    const note = String(formConfig.note || "").trim();
    const successText = String(formConfig.successText || "Bilgiler hazırlandı.").trim();
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
      input.placeholder = placeholder;
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
          label: "Genel sorular",
          address: "destek@aramabul.com",
          subject: "Genel sorular",
        },
        ortaklik: {
          label: "İş birliği",
          address: "ortaklik@aramabul.com",
          subject: "İş birliği talebi",
        },
        icerik: {
          label: "İçerik düzeltmeleri",
          address: "icerik@aramabul.com",
          subject: "İçerik düzeltmeleri",
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
      message.placeholder = "Mesaj";
      message.required = true;

      phoneAreaCode.inputMode = "numeric";
      phoneAreaCode.maxLength = 3;
      phoneAreaCode.pattern = "\\d{3}";
      phoneNumber.inputMode = "numeric";
      phoneNumber.maxLength = 7;
      phoneNumber.pattern = "\\d{7}";

      fillSelect(
        subjectSelect,
        "Konu",
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

      grid.append(buildField("Ad Soyad", fullName, "full"));
      grid.append(buildField("E-posta", email, "full"));
      grid.append(buildField("Konu", subjectSelect, "full"));
      grid.append(buildField("Telefon bilgisi", phoneGroup, "full"));
      grid.append(buildField("Mesaj", message, "full"));

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
          status.textContent = "Lütfen ad, e-posta, konu ve mesaj alanlarını doldur.";
          return;
        }

        const selectedTarget = contactTargets[subjectSelect.value];
        if (!selectedTarget) {
          status.dataset.state = "error";
          status.textContent = "Lütfen konu seçimini tamamla.";
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
        status.textContent = `${successText} ${selectedTarget.address} adresi hazırlandı.`;
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
      defaultOption.textContent = placeholder;
      selectNode.append(defaultOption);

      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
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
        ? "Posta kodu"
        : matchedPostalCode
          ? "Posta kodu"
          : "Posta kodu (manuel)";
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

    grid.append(buildField("İşletme adı", businessName, "full"));
    grid.append(buildField("İl", citySelect, "full"));
    grid.append(buildField("İlçe", districtSelect, "full"));
    grid.append(buildField("Mahalle", neighborhoodSelect, "full"));
    grid.append(buildField("Sokak / Cadde", street));
    grid.append(buildField("Bina / Kapı no", doorNumber));
    const phoneGroup = document.createElement("div");
    phoneGroup.className = "content-page-phone-group";

    const countryCode = document.createElement("span");
    countryCode.className = "content-page-phone-prefix";
    countryCode.textContent = "+90";

    phoneGroup.append(countryCode, phoneAreaCode, phoneNumber);

    grid.append(buildField("Posta kodu", postalCode));
    grid.append(buildField("Telefon bilgisi", phoneGroup, "full"));
    grid.append(buildField("Web sitesi (varsa)", website, "full"));
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
        status.textContent = "İl, ilçe ve mahalle için veri kaynağı tanımlanmadı.";
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
          "İl, ilçe veya mahalle verisi yüklenemedi. Adresi PTT kaynağından kontrol ederek elle tamamlamalısın.";
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        status.dataset.state = "error";
        status.textContent =
          "Lütfen zorunlu alanları eksiksiz doldur, adres seçimlerini tamamla ve posta kodu otomatik gelmezse 5 hane olarak gir.";
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

    titleNode.textContent = "";
    textNode.textContent = "";
    wrap.hidden = true;
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

    document.title = `aramabul | ${title}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription instanceof HTMLMetaElement) {
      metaDescription.setAttribute("content", lead || `${title} bilgi sayfası.`);
    }

    renderCards(Array.isArray(content.cards) ? content.cards : []);
    renderSubmissionForm(content.form);
    renderStrip(content.strip);
  }

  applyPageContent();
})();
