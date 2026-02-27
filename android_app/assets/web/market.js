const RAW_MARKET_GROUPS = [
  {
    title: "Ulusal İndirim Zincirleri",
    markets: [
      "A101",
      "BİM",
      "ŞOK",
      "FİLE",
      "Hakmar",
      "Hakmar Express",
      "Tarım Kredi Kooperatif Market",
      "Seç Market",
      "Ekomini",
    ],
  },
  {
    title: "Ulusal Süpermarket ve Hipermarket Zincirleri",
    markets: [
      "Migros",
      "Macrocenter",
      "CarrefourSA",
      "Metro Türkiye",
      "Bizim Toptan",
      "Kipa Extra",
    ],
  },
  {
    title: "Marmara Bölgesi Zincirleri",
    markets: [
      "Onur Market",
      "Happy Center",
      "Kim Market",
      "Mopaş",
      "Özkuruşlar",
      "Çağrı Market",
      "Biçen Market",
      "Anpa Gross",
      "Rammar",
      "Uyum Market",
    ],
  },
  {
    title: "İç Anadolu Bölgesi Zincirleri",
    markets: [
      "Altunbilekler",
      "Gimsa",
      "Çağdaş Marketler",
      "Beğendik",
      "Gross 06",
      "Metromall",
    ],
  },
  {
    title: "Ege ve Akdeniz Bölgesi Zincirleri",
    markets: [
      "Gürmar",
      "Pehlivanoğlu",
      "Meydan AVM Market",
      "Sarıyer Market",
      "Kiler Market",
      "İsmar",
    ],
  },
  {
    title: "Karadeniz ve Diğer Bölgesel Zincirler",
    markets: [
      "Seyhanlar",
      "Özdilek Hipermarket",
      "Makro Market",
      "Yimpaş Market",
      "Yöre Market",
      "Mopaş Gross",
    ],
  },
];

const MARKET_WEBSITES = {
  A101: "https://www.a101.com.tr",
  "BİM": "https://www.bim.com.tr",
  "ŞOK": "https://www.sokmarket.com.tr",
  "FİLE": "https://www.file.com.tr",
  Hakmar: "https://www.hakmar.com.tr",
  "Hakmar Express": "https://www.hakmarexpress.com.tr",
  "Tarım Kredi Kooperatif Market": "https://www.tarimkredi.com.tr",
  "Seç Market": "https://www.secmarket.com.tr",
  Ekomini: "https://www.ekomini.com.tr",
  Migros: "https://www.migros.com.tr",
  Macrocenter: "https://www.macrocenter.com.tr",
  CarrefourSA: "https://www.carrefoursa.com",
  "Metro Türkiye": "https://www.metro-tr.com",
  "Bizim Toptan": "https://www.bizimtoptan.com.tr",
  "Kipa Extra": "https://www.migros.com.tr",
  "Onur Market": "https://www.onurmarket.com",
  "Happy Center": "https://www.happycenter.com.tr",
  "Kim Market": "https://www.kimmarket.com",
  "Mopaş": "https://www.mopas.com.tr",
  "Özkuruşlar": "https://www.ozkuruslar.com.tr",
  "Çağrı Market": "https://www.cagrimarket.com.tr",
  "Biçen Market": "https://www.bicenmarket.com.tr",
  "Anpa Gross": "https://www.anpagross.com",
  Rammar: "https://www.rammar.com.tr",
  "Uyum Market": "https://www.uyummarket.com.tr",
  Altunbilekler: "https://www.altunbilekler.com.tr",
  Gimsa: "https://www.gimsa.com.tr",
  "Çağdaş Marketler": "https://www.cagdasmarket.com.tr",
  "Beğendik": "https://www.begendik.com.tr",
  "Gross 06": "https://www.gross06.com.tr",
  Metromall: "https://www.metromall.com.tr",
  "Gürmar": "https://www.gurmar.com.tr",
  "Pehlivanoğlu": "https://www.pehlivanoglu.com.tr",
  "Meydan AVM Market": "https://www.google.com/search?q=Meydan+AVM+Market+resmi+web+sitesi",
  "Sarıyer Market": "https://www.google.com/search?q=Sar%C4%B1yer+Market+resmi+web+sitesi",
  "Kiler Market": "https://www.kiler.com.tr",
  "İsmar": "https://www.ismar.com.tr",
  Seyhanlar: "https://www.seyhanlar.com.tr",
  "Özdilek Hipermarket": "https://www.ozdilekteyim.com",
  "Makro Market": "https://www.makromarket.com.tr",
  "Yimpaş Market": "https://www.yimpas.com.tr",
  "Yöre Market": "https://www.google.com/search?q=Y%C3%B6re+Market+resmi+web+sitesi",
  "Mopaş Gross": "https://www.mopas.com.tr",
};

const marketGroupGrid = document.querySelector("#marketGroupGrid");

function normalizeMarketKey(name) {
  return String(name || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
}

function dedupeMarketGroups(groups) {
  const seen = new Set();

  return groups
    .map((group) => {
      const uniqueMarkets = [];

      group.markets.forEach((marketName) => {
        const key = normalizeMarketKey(marketName);

        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        uniqueMarkets.push(marketName);
      });

      return {
        title: group.title,
        markets: uniqueMarkets,
      };
    })
    .filter((group) => group.markets.length > 0);
}

const MARKET_GROUPS = dedupeMarketGroups(RAW_MARKET_GROUPS);

function marketWebsiteUrl(marketName) {
  const directUrl = MARKET_WEBSITES[marketName];

  if (directUrl) {
    return directUrl;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${marketName} resmi web sitesi`)}`;
}

function renderMarketGroups() {
  if (!marketGroupGrid) {
    return;
  }

  marketGroupGrid.innerHTML = "";

  MARKET_GROUPS.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = `${group.title} (${group.markets.length})`;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.markets.forEach((marketName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill market-pill market-pill-link";
      chip.href = marketWebsiteUrl(marketName);
      chip.target = "_self";
      chip.rel = "noopener noreferrer";
      chip.textContent = marketName;
      chip.setAttribute("aria-label", `${marketName} web sitesini yeni sekmede aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    marketGroupGrid.append(row);
  });
}

renderMarketGroups();
