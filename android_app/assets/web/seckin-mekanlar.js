function createFeaturedVenue(name, cityLabel, sourceLabel, options = {}) {
  const mergedOptions = {
    ...(FEATURED_VENUE_OVERRIDES[name] || {}),
    ...options,
  };
  const exactAddress = String(mergedOptions.address || "").trim();
  const addressMatch = `${name}, ${cityLabel}`;
  return {
    name,
    location: cityLabel,
    address: exactAddress || addressMatch,
    addressMatch,
    hasExactAddress: Boolean(exactAddress),
    addressNote: exactAddress ? "" : `${sourceLabel} listesi icin adrese gore eslestirme yapildi.`,
    phone: String(mergedOptions.phone || "").trim(),
    stars: Number(mergedOptions.stars || 0),
  };
}

const FEATURED_VENUE_OVERRIDES = {
  "Ahmet Ustam Ocakbaşı": {
    address: "Maslak Mahallesi, Dereboyu 2 Caddesi No:8/1, Sarıyer, İstanbul, 34485, Türkiye",
    phone: "+90 530 175 61 14",
  },
  "Ali Ocakbaşı Karaköy": {
    address: "Arap Camii Mahallesi, Tersane Caddesi, Kardeşim Sokak No:45 Kat 4, Beyoğlu, İstanbul, 34421, Türkiye",
    phone: "+90 212 293 10 11",
  },
  "Cuma": {
    address: "Firuzağa Mahallesi, Çukur Cuma Caddesi No:53/A, Beyoğlu, İstanbul, 34425, Türkiye",
    phone: "+90 212 293 20 62",
  },
  "Karaköy Lokantası": {
    address: "Kemankeş Mahallesi, Kemankeş Caddesi No:57, Karaköy, Beyoğlu, İstanbul, 34425, Türkiye",
    phone: "+90 212 292 44 55",
  },
  "Pandeli": {
    address: "Rüstempaşa Mahallesi, Balık Pazarı Kapısı Sokağı No:1/2, Mısır Çarşısı İçi 1 D:2, Eminönü, Fatih, İstanbul, 34116, Türkiye",
    phone: "+90 212 527 39 09",
  },
  "Tershane": {
    address: "Arap Cami Mahallesi, Tersane Caddesi No:24, Hotel Momento 8. Kat, Karaköy, Beyoğlu, İstanbul, 34420, Türkiye",
    phone: "+90 212 292 30 10",
  },
};

const FEATURED_VENUE_GROUPS = [
  {
    title: "İstanbul Michelin Yıldızlı",
    venues: [
      createFeaturedVenue("Araka", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Kapalı Bakkal Sokak No:8, Yeniköy, Sarıyer, İstanbul, 34464, Türkiye",
        phone: "+90 533 392 72 23",
      }),
      createFeaturedVenue("Arkestra", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Etiler, Dilhayat Sokak No:28, Beşiktaş, İstanbul, 34337, Türkiye",
        phone: "+90 212 970 72 73",
      }),
      createFeaturedVenue("Casa Lavanda", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Ulupelit Köyü, Seçilmiş Sokak No:2, Şile, İstanbul, 34980, Türkiye",
        phone: "+90 216 736 56 40",
      }),
      createFeaturedVenue("Mikla", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Meşrutiyet Caddesi No:15, 18. Kat, Tepebaşı, Beyoğlu, İstanbul, 34430, Türkiye",
        phone: "+90 212 293 56 56",
      }),
      createFeaturedVenue("Neolokal", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Arap Camii Mahallesi, Bankalar Caddesi No:11/1, Beyoğlu, İstanbul, 34420, Türkiye",
        phone: "+90 551 447 45 45",
      }),
      createFeaturedVenue("Nicole", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Tomtom Kaptan Sokak No:18, Beyoğlu, İstanbul, 34433, Türkiye",
        phone: "+90 212 292 44 67",
      }),
      createFeaturedVenue("Sankai by Nagaya", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 1,
        address: "Bebek, Cevdet Paşa Caddesi No:34, Beşiktaş, İstanbul, 34342, Türkiye",
        phone: "+90 532 379 19 97",
      }),
      createFeaturedVenue("TURK Fatih Tutak", "İstanbul", "İstanbul Michelin yıldızlı", {
        stars: 2,
        address: "Bomonti, Cumhuriyet Hacıahmet Silahşör Caddesi, Yeniyol Sokak No:2, Şişli, İstanbul, 34440, Türkiye",
        phone: "+90 530 051 83 04",
      }),
    ],
  },
  {
    title: "İstanbul Tavsiye",
    venues: [
      "29",
      "1924 İstanbul",
      "Aheste",
      "Aida - vino e cucina",
      "Aila",
      "Akira Back İstanbul",
      "Alaf",
      "Apartıman Yeniköy",
      "AQUA",
      "AŞEKA",
      "Avlu Restaurant",
      "AZUR",
      "Balıkçı Kahraman",
      "Basta Neo Bistro",
      "Beyti",
      "BİZ İstanbul",
      "Borsa Restaurant",
      "Calipso Fish",
      "Deraliye",
      "Eleos Yeşilköy",
      "Ernest's Bar by Çok Çok Pera",
      "Fauna",
      "GALLADA",
      "Giritli",
      "Gün Lokantası",
      "Hakkasan İstanbul",
      "Havuş Lokantası",
      "Herise İstanbul",
      "Itsumi",
      "Khorasani",
      "Kıyı Restaurant",
      "Liman İstanbul",
      "Lokanta 1741",
      "Lokanta by Divan",
      "Lokanta Feriye",
      "Lokanta Limu",
      "Maromi İstanbul",
      "Monteverdi Ristorante",
      "Muutto Anatolian Tapas Bar",
      "Mürver",
      "Nobu İstanbul",
      "OCAK",
      "Okra İstanbul",
      "Park Fora Balık ve Deniz Ürünleri Restoranı",
      "ROKA",
      "Ruby",
      "Rumelihisarı İskele",
      "Sapa İstanbul",
      "Seraf Mahmutbey",
      "Seraf Vadi",
      "Sıralı Kebap",
      "Spago Istanbul by Wolfgang Puck",
      "St. Regis Brasserie",
      "Sunset Grill & Bar",
      "Şans Restaurant",
      "telezzüz",
      "Terrazza Italia",
      "The BARN",
      "The Red Balloon",
      "Topaz",
      "Tuğra Restaurant",
      "Yeni Lokanta",
      "Zuma İstanbul",
    ].map((name) => createFeaturedVenue(name, "İstanbul", "İstanbul tavsiye")),
  },
  {
    title: "İstanbul Bib Gourmand",
    venues: [
      "Ahmet Ustam Ocakbaşı",
      "Ali Ocakbaşı Karaköy",
      "Casius Antioch Kitchen",
      "Cuma",
      "EFENDY",
      "Foxy Nişantaşı",
      "Karaköy Lokantası",
      "Mahir Lokantası",
      "mutfakkoz",
      "Nazende Cadde",
      "Pandeli",
      "Parvus Kalamış",
      "SADE \"Beş Denizler Mutfağı\"",
      "Tatbak",
      "Tavacı Recep Usta Bostancı",
      "Tershane",
      "Yanyalı Fehmi Lokantası",
    ].map((name) => {
      if (name === "Foxy Nişantaşı") {
        return createFeaturedVenue(name, "İstanbul", "İstanbul Bib Gourmand", {
          address: "Harbiye, Mim Kemal Öke Caddesi No:1/D, Şişli, İstanbul, 34365, Türkiye",
          phone: "+90 531 484 38 91",
        });
      }
      return createFeaturedVenue(name, "İstanbul", "İstanbul Bib Gourmand");
    }),
  },
  {
    title: "Bodrum Michelin Yıldızlı",
    venues: [
      createFeaturedVenue("Kitchen", "Bodrum", "Bodrum Michelin yıldızlı", {
        stars: 1,
        address: "Dirmil Mahallesi, Balyek Caddesi No:5A, Yalıkavak, Bodrum, 48400, Türkiye",
        phone: "+90 252 311 31 35",
      }),
      createFeaturedVenue("Maça Kızı", "Bodrum", "Bodrum Michelin yıldızlı", {
        stars: 1,
        address: "Göltürkbükü Mahallesi, Keleşharim Caddesi No:70, Bodrum, 48400, Türkiye",
        phone: "+90 252 311 24 00",
      }),
      createFeaturedVenue("Mezra Yalıkavak", "Bodrum", "Bodrum Michelin yıldızlı", {
        stars: 1,
        address: "Dirmil Mahallesi, 6885. Sokak No:3, Bodrum, 48990, Türkiye",
        phone: "+90 532 490 72 74",
      }),
    ],
  },
  {
    title: "Bodrum Tavsiye",
    venues: [
      "ADA Restaurant",
      "Barbarossa",
      "Dereköy Lokantası",
      "Hakkasan Bodrum",
      "Hodan Yalıkavak",
      "Karnas Vineyards",
      "Kısmet Lokantası",
      "Kornél",
      "Kurul Bitez",
      "Loft Elia",
      "Lucca by the Sea",
      "Malva",
      "Mori",
      "ONNO Grill & Bar",
      "Orfoz",
      "Orkide Balık",
      "Sait",
      "Sia Eli",
      "Tuti",
      "Yakamengen III",
      "Zuma Bodrum",
    ].map((name) => createFeaturedVenue(name, "Bodrum", "Bodrum tavsiye")),
  },
  {
    title: "Bodrum Bib Gourmand",
    venues: [
      "Agora Pansiyon",
      "Arka Ristorante Pizzeria",
      "Bağarası",
      "Beynel",
      "İki Sandal",
      "Mandalya",
      "Mezegi",
      "Otantik Ocakbaşı",
    ].map((name) => createFeaturedVenue(name, "Bodrum", "Bodrum Bib Gourmand")),
  },
  {
    title: "İzmir Michelin Yıldızlı",
    venues: [
      createFeaturedVenue("OD Urla", "İzmir", "İzmir Michelin yıldızlı", {
        stars: 1,
        address: "Rüstem Mahallesi, 2018/9 Sokak No:28, Sütpınarı Mevkii, Urla, İzmir, 35430, Türkiye",
        phone: "+90 539 775 12 21",
      }),
      createFeaturedVenue("Teruar Urla", "İzmir", "İzmir Michelin yıldızlı", {
        stars: 1,
        address: "Kuşçular Mahallesi, 8028. Sokak No:16, Urla, İzmir, 35437, Türkiye",
        phone: "+90 532 659 20 90",
      }),
      createFeaturedVenue("Narımor", "İzmir", "İzmir Michelin yıldızlı", {
        stars: 1,
        address: "Sıra Mahallesi, Eren Sokak, Urla, İzmir, 35320, Türkiye",
        phone: "+90 554 190 12 02",
      }),
      createFeaturedVenue("Vino Locale", "İzmir", "İzmir Michelin yıldızlı", {
        stars: 2,
        address: "Kuşçular Mahallesi, 8037. Sokak No:3, Urla, İzmir, 35430, Türkiye",
        phone: "+90 533 321 84 66",
      }),
    ],
  },
  {
    title: "İzmir Tavsiye",
    venues: [
      "Amavi",
      "Balmumu Dükkan Lokanta",
      "Birinci Kordon Balık Restoran",
      "ÇARK balık Çeşme",
      "Emektar Kebap",
      "Esca",
      "Gula Urla",
      "Hiç Lokanta",
      "Hus Şarapçılık",
      "İsabey Bağevi",
      "Kasap Fuat Alsancak",
      "Kasap Fuat Çeşme",
      "Levan",
      "Ritüel",
      "Roka Bahçe",
      "Scappi",
      "Seyhan Et",
      "SOTA ALAÇATI",
      "Terakki",
    ].map((name) => createFeaturedVenue(name, "İzmir", "İzmir tavsiye")),
  },
  {
    title: "İzmir Bib Gourmand",
    venues: [
      "Adil Müftüoğlu",
      "Aslında Meyhane",
      "Asma Yaprağı",
      "Ayşa Boşnak Börekçisi",
      "Beğendik Abi",
      "Kemal’in Yeri Mülkiyeliler Birliği",
      "LA Mahzen",
      "Partal Kardeşler Balık Restorant",
      "Tavacı Recep Usta Alsancak",
    ].map((name) => createFeaturedVenue(name, "İzmir", "İzmir Bib Gourmand")),
  },
  {
    title: "Kapadokya Michelin Yıldızlı",
    venues: [
      createFeaturedVenue("Revithia", "Kapadokya", "Kapadokya Michelin yıldızlı", {
        stars: 1,
        address: "Temenni Mahallesi, Eski Kayakapı Mahallesi, Davut Ağa Sokak No:1, Ürgüp, 50400, Türkiye",
        phone: "+90 384 341 88 77",
      }),
    ],
  },
  {
    title: "Kapadokya Tavsiye",
    venues: [
      "Gorgoli",
      "Lil’a Restaurant",
      "Moniq Restaurant",
      "Nahita Cappadocia",
      "Reserved Restaurant",
      "Saklı Konak Cappadocia",
      "Seki Restaurant",
      "Seten",
      "Tık Tık Kadın Emeği",
      "Uzundere Kapadokya Mutfağı",
    ].map((name) => createFeaturedVenue(name, "Kapadokya", "Kapadokya tavsiye")),
  },
  {
    title: "Kapadokya Bib Gourmand",
    venues: [
      "Aravan Evi",
      "Babayan Evi Restaurant",
      "Happena",
      "Old Greek House",
    ].map((name) => createFeaturedVenue(name, "Kapadokya", "Kapadokya Bib Gourmand")),
  },
];

const featuredVenueGrid = document.querySelector("#featuredVenueGrid");
let featuredVenueModalApi = null;

function createMapUrls(venue) {
  const queryText = String(venue.addressMatch || `${venue.name}, ${venue.location || ""}`).trim();
  const query = encodeURIComponent(queryText);
  return {
    embedUrl: `https://www.google.com/maps?q=${query}&output=embed`,
    externalUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
  };
}

function ensureFeaturedVenueModal() {
  if (featuredVenueModalApi) {
    return featuredVenueModalApi;
  }

  const modal = document.createElement("section");
  modal.className = "map-focus-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <button class="map-focus-backdrop" type="button" aria-label="Pencereyi kapat"></button>
    <article class="map-focus-panel" role="dialog" aria-modal="true" aria-labelledby="featuredVenueTitle">
      <header class="map-focus-head">
        <div class="map-focus-head-text">
          <p class="map-focus-eyebrow">Seçkin Mekan</p>
          <h3 id="featuredVenueTitle" class="map-focus-title">Mekan</h3>
        </div>
        <button class="map-focus-close" type="button" aria-label="Kapat">Kapat</button>
      </header>
      <div class="map-focus-body">
        <aside class="map-focus-info-card" aria-label="Mekan bilgileri">
          <h4 class="map-focus-info-title">Adres Bilgisi</h4>
          <dl class="map-focus-info-list">
            <div class="map-focus-info-row">
              <dt>Konum</dt>
              <dd data-info-field="location">-</dd>
            </div>
            <div class="map-focus-info-row">
              <dt>Adres</dt>
              <dd data-info-field="address">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="phone">
              <dt>Telefon</dt>
              <dd data-info-field="phone">-</dd>
            </div>
          </dl>
        </aside>
        <div class="map-focus-frame-wrap">
          <iframe
            class="map-focus-frame"
            title="Mekan harita görünümü"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      <footer class="map-focus-foot">
        <p class="map-focus-subtitle"></p>
        <a class="map-focus-external" href="#" target="_blank" rel="noopener noreferrer">Haritada aç</a>
      </footer>
    </article>
  `;

  const titleNode = modal.querySelector(".map-focus-title");
  const subtitleNode = modal.querySelector(".map-focus-subtitle");
  const iframeNode = modal.querySelector(".map-focus-frame");
  const externalNode = modal.querySelector(".map-focus-external");
  const closeNode = modal.querySelector(".map-focus-close");
  const backdropNode = modal.querySelector(".map-focus-backdrop");
  const locationNode = modal.querySelector('[data-info-field="location"]');
  const addressNode = modal.querySelector('[data-info-field="address"]');
  const phoneNode = modal.querySelector('[data-info-field="phone"]');
  const phoneRow = modal.querySelector('[data-info-row="phone"]');

  function close() {
    modal.hidden = true;
    document.body.classList.remove("map-focus-open");
    if (iframeNode instanceof HTMLIFrameElement) {
      iframeNode.src = "about:blank";
    }
  }

  function open(venue) {
    if (!(iframeNode instanceof HTMLIFrameElement)) {
      return;
    }

    const maps = createMapUrls(venue);
    if (titleNode) {
      titleNode.textContent = venue.name;
    }
    if (locationNode) {
      locationNode.textContent = venue.location || "-";
    }
    if (addressNode) {
      addressNode.textContent = venue.address || "-";
    }
    if (phoneNode) {
      phoneNode.textContent = venue.phone || "Bilgi yok";
    }
    if (phoneRow instanceof HTMLElement) {
      phoneRow.hidden = !venue.phone;
    }
    if (subtitleNode) {
      const note = String(venue.addressNote || "").trim();
      subtitleNode.textContent = note || venue.location;
      subtitleNode.hidden = !(note || venue.location);
    }
    if (externalNode instanceof HTMLAnchorElement) {
      externalNode.href = maps.externalUrl;
    }

    iframeNode.src = maps.embedUrl;
    modal.hidden = false;
    document.body.classList.add("map-focus-open");
  }

  closeNode?.addEventListener("click", close);
  backdropNode?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  document.body.append(modal);
  featuredVenueModalApi = { open, close };
  return featuredVenueModalApi;
}

function renderFeaturedVenueGroups() {
  if (!featuredVenueGrid) {
    return;
  }

  const modalApi = ensureFeaturedVenueModal();
  featuredVenueGrid.innerHTML = "";

  FEATURED_VENUE_GROUPS.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const title = document.createElement("h4");
    title.className = "province-region";
    title.textContent = `${group.title} (${group.venues.length})`;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.venues.forEach((venue) => {
      const chip = document.createElement("button");
      chip.className = "province-pill market-pill featured-venue-pill";
      if (venue.stars === 2) {
        chip.classList.add("is-two-star");
      } else if (venue.stars === 1) {
        chip.classList.add("is-one-star");
      }
      chip.type = "button";
      chip.textContent = venue.name;
      chip.setAttribute("aria-label", `${venue.name} adres bilgisini aç`);
      chip.addEventListener("click", () => {
        modalApi.open(venue);
      });
      chips.append(chip);
    });

    row.append(title, chips);
    featuredVenueGrid.append(row);
  });
}

renderFeaturedVenueGroups();
