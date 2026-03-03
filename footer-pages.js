(() => {
  const DEFAULT_KEY = "hakkimizda";
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
      lead: "aramabul, insanın bir yeri ararken en kısa yoldan net bilgi bulmasını amaçlayan sade bir keşif ürünüdür.",
      cards: [
        {
          title: "Neden varız?",
          paragraphs: [
            "İnsanlar çoğu zaman bir yerin adını değil, ihtiyacını bilir. Biz de aramayı ihtiyaçtan başlatıyoruz.",
            "Amaç, gereksiz kalabalığı azaltmak ve doğru kategoriye daha hızlı ulaşmak.",
          ],
        },
        {
          title: "Nasıl çalışıyoruz?",
          paragraphs: [
            "Kategori, şehir ve ilçe katmanlarını sade tutuyoruz.",
            "Bilgiyi kutu yapısında sunuyor, kullanıcıyı uzun sayfalar yerine net karar alanına taşıyoruz.",
          ],
        },
        {
          title: "Temel yaklaşımımız",
          bullets: [
            "Basit arayüz",
            "Açık bilgi",
            "Hızlı yönlendirme",
            "Kolay güncelleme",
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
      lead: "Soru, öneri ve iş taleplerini düzenli ve hızlı biçimde toplamak için temel iletişim akışını burada anlatıyoruz.",
      cards: [
        {
          title: "Bize nasıl yazabilirsin?",
          bullets: [
            "Genel sorular için: destek@aramabul.com",
            "İş birliği için: ortaklik@aramabul.com",
            "İçerik düzeltmeleri için: icerik@aramabul.com",
          ],
        },
        {
          title: "Mesaj gönderirken ekle",
          paragraphs: [
            "Şehir, ilçe, kategori ve ilgili bağlantıyı eklersen daha hızlı dönebiliriz.",
            "Sorun ekran görüntüsü veya kısa açıklama ile gelirse çözüm süresi kısalır.",
          ],
        },
        {
          title: "Yanıt süresi",
          paragraphs: [
            "Genel hedefimiz, çalışma günlerinde 24 ila 48 saat içinde ilk dönüşü yapmak.",
          ],
        },
      ],
      strip: {
        title: "Kısa not",
        text: "İletişim bilgileri ilk taslaktır. İstersen ikinci turda gerçek kanal ve form yapısına çevirebiliriz.",
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
    "restoran-ekle": {
      eyebrow: "İş ortaklığı",
      title: "Restoran ekle",
      lead: "Yeni bir işletmeyi sisteme almak için ilk başta hangi bilgilere ihtiyaç duyduğumuzu burada topladık.",
      cards: [
        {
          title: "Gönderilecek temel bilgiler",
          bullets: [
            "İşletme adı",
            "Şehir ve ilçe",
            "Açık adres",
            "Telefon ve varsa web sitesi",
          ],
        },
        {
          title: "İnceleme adımı",
          paragraphs: [
            "Gönderilen bilgi önce temel doğruluk kontrolünden geçer.",
            "Eksik alan varsa ek bilgi istenir, netse yayına alınır.",
          ],
        },
        {
          title: "İlk sürüm yaklaşımı",
          paragraphs: [
            "İlk etapta sade listeleme hedeflenir. Sonraki turda fotoğraf, menü ve özel içerik alanı eklenebilir.",
          ],
        },
      ],
    },
    "fiyat-ekle": {
      eyebrow: "İş ortaklığı",
      title: "Fiyat ekle",
      lead: "Fiyat bilgisi ekleme sayfası, kullanıcıya net ve güvenilir karşılaştırma sağlamak için tasarlanır.",
      cards: [
        {
          title: "Fiyat gönderirken",
          bullets: [
            "Ürün veya hizmet adı",
            "Net fiyat",
            "Tarih bilgisi",
            "Varsa kampanya notu",
          ],
        },
        {
          title: "Kalite kuralı",
          paragraphs: [
            "Belirsiz, tarih vermeyen veya kaynağı karışık fiyatlar doğrudan yayınlanmaz.",
          ],
        },
        {
          title: "Yayın mantığı",
          paragraphs: [
            "Amaç, kullanıcıyı yanıltmadan en sade fiyat bilgisini göstermek.",
          ],
        },
      ],
    },
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

    if (shell instanceof HTMLElement) {
      shell.dataset.pageKey = key;
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
    renderStrip(content.strip);
  }

  applyPageContent();
})();
