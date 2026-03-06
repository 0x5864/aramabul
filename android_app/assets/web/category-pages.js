const ASSET_VERSION = "20260305-03";
const CATEGORY_VENUES_JSON_PATH = "data/venues.json";
const DISTRICTS_JSON_PATH = "data/districts.json";
const DISTRICT_INLINE_AD_INSERT_AFTER = 6;
const DISTRICT_INLINE_AD_SCRIPT_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const DISTRICT_INLINE_AD_CONFIG_SCRIPT_PATH = "ads-config.js";
const LEGACY_SEYAHAT_HOTEL_DATA_FILES = Object.freeze([
  "data/gezi-oteller-5-yildiz.json",
  "data/gezi-oteller-4-yildiz.json",
  "data/gezi-oteller-3-yildiz.json",
  "data/gezi-oteller-diger.json",
]);

function withVersion(path) {
  const source = String(path || "").trim();
  if (!source) {
    return source;
  }

  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${ASSET_VERSION}`;
}

function stripQuery(path) {
  const source = String(path || "").trim();
  if (!source) {
    return source;
  }

  const queryIndex = source.indexOf("?");
  return queryIndex >= 0 ? source.slice(0, queryIndex) : source;
}

function candidateAssetPaths(path) {
  const source = String(path || "").trim();
  if (!source) {
    return [];
  }

  const result = [];
  const pushUnique = (value) => {
    const next = String(value || "").trim();
    if (!next || result.includes(next)) {
      return;
    }
    result.push(next);
  };

  pushUnique(withVersion(source));
  pushUnique(source);
  pushUnique(stripQuery(source));
  return result;
}

async function fetchJsonWithFallback(path, fallbackValue) {
  const candidates = candidateAssetPaths(path);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      return await response.json();
    } catch (_error) {
      // Keep trying fallback candidates.
    }
  }

  return fallbackValue;
}

let districtInlineAdScriptPromise = null;
let districtInlineAdConfigPromise = null;

function hasDistrictInlineAdRuntimeConfig() {
  return Boolean(window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object");
}

function isAdsConfigScriptPath(path) {
  const normalized = stripQuery(path).toLocaleLowerCase("en-US");
  return normalized.endsWith("/ads-config.js") || normalized.endsWith("ads-config.js");
}

function appendScriptTag(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed_to_load_script:${src}`));
    document.head.appendChild(script);
  });
}

async function ensureDistrictInlineAdConfigLoaded() {
  if (hasDistrictInlineAdRuntimeConfig()) {
    return window.ARAMABUL_ADS_CONFIG;
  }

  if (districtInlineAdConfigPromise) {
    return districtInlineAdConfigPromise;
  }

  districtInlineAdConfigPromise = (async () => {
    const existingScript = [...document.scripts].find((script) => {
      const source = script.getAttribute("src") || script.src || "";
      return isAdsConfigScriptPath(source);
    });
    if (existingScript) {
      return hasDistrictInlineAdRuntimeConfig() ? window.ARAMABUL_ADS_CONFIG : null;
    }

    const candidates = candidateAssetPaths(DISTRICT_INLINE_AD_CONFIG_SCRIPT_PATH);
    for (const candidate of candidates) {
      try {
        await appendScriptTag(candidate);
        if (hasDistrictInlineAdRuntimeConfig()) {
          return window.ARAMABUL_ADS_CONFIG;
        }
      } catch (_error) {
        // Keep trying fallback candidates.
      }
    }

    return null;
  })();

  return districtInlineAdConfigPromise;
}

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function resolveDistrictInlineAdConfig() {
  const body = document.body;
  const runtimeConfig = window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object"
    ? window.ARAMABUL_ADS_CONFIG
    : {};
  const enabledFromBody = String(body?.dataset?.districtAdEnabled || "").trim().toLowerCase();
  const enabledFromRuntime = String(runtimeConfig.districtInlineEnabled || "").trim().toLowerCase();
  const enabled = enabledFromBody !== "off" && enabledFromRuntime !== "off" && enabledFromRuntime !== "false";
  if (!enabled) {
    return null;
  }

  const client = String(body?.dataset?.adsenseClient || runtimeConfig.adsenseClient || "").trim();
  const slot = String(body?.dataset?.districtInlineAdSlot || runtimeConfig.districtInlineAdSlot || "").trim();
  if (!client || !slot) {
    return null;
  }

  return {
    client,
    slot,
    insertAfter: parsePositiveInteger(body?.dataset?.districtInlineAdAfter || runtimeConfig.districtInlineAdAfter, DISTRICT_INLINE_AD_INSERT_AFTER),
  };
}

function resolveCategoryRootAdConfig() {
  const body = document.body;
  const runtimeConfig = window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object"
    ? window.ARAMABUL_ADS_CONFIG
    : {};
  const enabledFromBody = String(body?.dataset?.categoryRootAdEnabled || "").trim().toLowerCase();
  const enabledFromRuntime = String(runtimeConfig.categoryRootAdEnabled || "").trim().toLowerCase();
  const enabled = enabledFromBody !== "off" && enabledFromRuntime !== "off" && enabledFromRuntime !== "false";
  if (!enabled) {
    return null;
  }

  const client = String(body?.dataset?.adsenseClient || runtimeConfig.adsenseClient || "").trim();
  const slot = String(body?.dataset?.categoryRootAdSlot || runtimeConfig.categoryRootAdSlot || runtimeConfig.districtInlineAdSlot || "").trim();
  if (!client || !slot) {
    return null;
  }

  return { client, slot };
}

function ensureDistrictInlineAdScript(client) {
  if (districtInlineAdScriptPromise) {
    return districtInlineAdScriptPromise;
  }

  const scriptSource = `${DISTRICT_INLINE_AD_SCRIPT_SRC}?client=${encodeURIComponent(client)}`;
  const existing = [...document.scripts].find((script) => String(script.src || "").includes(DISTRICT_INLINE_AD_SCRIPT_SRC));
  if (existing) {
    districtInlineAdScriptPromise = Promise.resolve();
    return districtInlineAdScriptPromise;
  }

  districtInlineAdScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = scriptSource;
    script.onload = () => resolve();
    script.onerror = () => {
      districtInlineAdScriptPromise = null;
      reject(new Error("failed_to_load_adsense_script"));
    };
    document.head.appendChild(script);
  });

  return districtInlineAdScriptPromise;
}

function requestDistrictInlineAdFill(adElement, config) {
  if (!adElement || !config) {
    return;
  }

  ensureDistrictInlineAdScript(config.client)
    .then(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (_error) {
        // Ignore ad rendering failures so list rendering never breaks.
      }
    })
    .catch(() => {
      // Ignore script load failures so list rendering never breaks.
    });
}

function renderDistrictInlineAdCard(config) {
  if (!config) {
    return null;
  }

  const card = document.createElement("aside");
  card.className = "province-ad-slot";
  card.setAttribute("aria-label", "Reklam");

  const label = document.createElement("span");
  label.className = "province-ad-label";
  label.textContent = "Reklam";

  const body = document.createElement("div");
  body.className = "province-ad-slot-body";

  const adElement = document.createElement("ins");
  adElement.className = "adsbygoogle province-adsense-unit";
  adElement.style.display = "block";
  adElement.dataset.adClient = config.client;
  adElement.dataset.adSlot = config.slot;
  adElement.dataset.adFormat = "auto";
  adElement.dataset.fullWidthResponsive = "true";

  body.append(adElement);
  card.append(label, body);
  requestDistrictInlineAdFill(adElement, config);
  return card;
}

function renderCategoryRootInlineAdCard(config) {
  if (!config) {
    return null;
  }

  const card = document.createElement("aside");
  card.className = "province-ad-slot category-root-ad-slot";
  card.setAttribute("aria-label", "Reklam");
  card.style.width = "100%";
  card.style.maxWidth = "220px";

  const label = document.createElement("span");
  label.className = "province-ad-label";
  label.textContent = "Reklam";

  const body = document.createElement("div");
  body.className = "province-ad-slot-body";
  body.style.minHeight = "0";
  body.style.aspectRatio = "1 / 1";

  const adElement = document.createElement("ins");
  adElement.className = "adsbygoogle province-adsense-unit category-root-adsense-unit";
  adElement.style.display = "block";
  adElement.style.width = "100%";
  adElement.style.height = "100%";
  adElement.style.minHeight = "0";
  adElement.dataset.adClient = config.client;
  adElement.dataset.adSlot = config.slot;
  adElement.dataset.adFormat = "auto";

  body.append(adElement);
  card.append(label, body);
  requestDistrictInlineAdFill(adElement, config);
  return card;
}

const CATEGORY_DEFINITIONS = {
  kuafor: {
    name: "Kuaför",
    pageBase: "kuafor",
    titleUnit: "kuaför salonu",
    dataFile: "data/kuafor.json",
    useDistrictCatalog: true,
    matcherKeywords: ["kuafor", "kuaför", "berber", "sac", "saç", "guzellik", "güzellik"],
  },
  veteriner: {
    name: "Veteriner",
    pageBase: "veteriner",
    titleUnit: "veteriner kliniği",
    dataFile: "data/veteriner.json",
    useDistrictCatalog: true,
    matcherKeywords: ["veteriner", "vet", "hayvan", "veterinary", "pet clinic"],
  },
  hizmetler: {
    name: "Hizmetler",
    pageBase: "hizmetler",
    titleUnit: "hizmet noktası",
    primaryRowTitle: "Kuaförler",
    dataFile: "data/kuafor.json",
    secondaryDataFile: "data/veteriner.json",
    secondaryRowTitle: "Veterinerler",
    secondaryCountLabel: "veteriner",
    tertiaryDataFile: "data/akaryakit.json",
    tertiaryRowTitle: "Akaryakıt İstasyonları",
    tertiaryCountLabel: "akaryakıt istasyonu",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Hizmet alt kategorileri",
    subcategoryVenuePagePath: "hizmetler-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Kuaförler",
        countLabel: "kuaför",
      },
      {
        source: "secondary",
        title: "Veterinerler",
        countLabel: "veteriner",
      },
      {
        source: "tertiary",
        title: "Akaryakıt İstasyonları",
        countLabel: "akaryakıt istasyonu",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "hizmetler",
      "service",
      "kuafor",
      "kuaför",
      "veteriner",
      "vet",
      "akaryakit",
      "akaryakıt",
      "benzin",
      "petrol",
      "istasyon",
      "fuel",
      "gas station",
    ],
  },
  kultur: {
    name: "Kültür",
    pageBase: "kultur",
    titleUnit: "müze",
    primaryRowTitle: "Müzeler",
    dataFile: "data/kultur-muzeler.json",
    secondaryDataFile: "data/kultur-oren-yerleri.json",
    secondaryRowTitle: "Ören yerleri",
    secondaryCountLabel: "ören yeri",
    tertiaryDataFile: "data/kultur-camiler.json",
    tertiaryRowTitle: "Tarihi Camiler",
    tertiaryCountLabel: "cami",
    quaternaryDataFile: "data/kultur-magaralar.json",
    quaternaryRowTitle: "Mağaralar",
    quaternaryCountLabel: "mağara",
    quinaryDataFile: "data/kultur-selaleler.json",
    quinaryRowTitle: "Şelaleler",
    quinaryCountLabel: "şelale",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Kültür alt kategorileri",
    subcategoryVenuePagePath: "kultur-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Müzeler",
        countLabel: "müze",
      },
      {
        source: "secondary",
        title: "Ören yerleri",
        countLabel: "ören yeri",
      },
      {
        source: "tertiary",
        title: "Tarihi Camiler",
        countLabel: "cami",
      },
      {
        source: "quaternary",
        title: "Mağaralar",
        countLabel: "mağara",
      },
      {
        source: "quinary",
        title: "Şelaleler",
        countLabel: "şelale",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "kultur",
      "kültür",
      "müze",
      "müzeler",
      "muze",
      "muzeler",
      "ören yeri",
      "ören yerleri",
      "oren yeri",
      "oren yerleri",
      "örenyeri",
      "orenyeri",
      "antik kent",
      "höyük",
      "hoyuk",
      "cami",
      "camii",
      "camiler",
      "tarihi cami",
      "tarihi camiler",
      "mescit",
      "mosque",
      "mağara",
      "mağaralar",
      "magara",
      "magaralar",
      "cave",
      "caves",
      "şelale",
      "selale",
      "şelaleler",
      "selaleler",
      "waterfall",
      "falls",
    ],
  },
  sanat: {
    name: "Sanat",
    pageBase: "sanat",
    titleUnit: "sanat mekanı",
    primaryRowTitle: "Opera ve Bale",
    dataFile: "data/kultur-opera-bale.json",
    secondaryDataFile: "data/kultur-devlet-tiyatrolari.json",
    secondaryRowTitle: "Devlet Tiyatroları",
    secondaryCountLabel: "devlet tiyatrosu",
    tertiaryDataFile: "data/kultur-sehir-tiyatrolari.json",
    tertiaryRowTitle: "Şehir Tiyatroları",
    tertiaryCountLabel: "şehir tiyatrosu",
    quaternaryDataFile: "data/kultur-ozel-tiyatrolar.json",
    quaternaryRowTitle: "Özel Tiyatrolar",
    quaternaryCountLabel: "özel tiyatro",
    quinaryDataFile: "data/sanat-galeriler.json",
    quinaryRowTitle: "Galeriler",
    quinaryCountLabel: "galeri",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Sanat alt kategorileri",
    subcategoryVenuePagePath: "sanat-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Opera ve Bale",
        countLabel: "opera ve bale mekanı",
      },
      {
        source: "secondary",
        title: "Devlet Tiyatroları",
        countLabel: "devlet tiyatrosu",
      },
      {
        source: "tertiary",
        title: "Şehir Tiyatroları",
        countLabel: "şehir tiyatrosu",
      },
      {
        source: "quinary",
        title: "Galeriler",
        countLabel: "galeri",
      },
      {
        source: "quaternary",
        title: "Özel Tiyatrolar",
        countLabel: "özel tiyatro",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "sanat",
      "art",
      "sahne sanatlari",
      "sahne sanatları",
      "performans",
      "opera",
      "bale",
      "tiyatro",
      "devlet tiyatrosu",
      "şehir tiyatrosu",
      "özel tiyatro",
      "galeri",
      "galeriler",
      "gallery",
      "kultur",
      "kültür",
    ],
  },
  eczane: {
    name: "Sağlık",
    pageBase: "eczane",
    rootPagePath: "saglik.html",
    titleUnit: "eczane",
    primaryRowTitle: "Eczaneler",
    dataFile: "data/eczane.json",
    secondaryDataFile: "data/nobetci-eczane.json",
    secondaryRowTitle: "Nöbetçi Eczaneler",
    tertiaryDataFile: "data/health-hospitals.json",
    quaternaryDataFile: "data/health-family-centers.json",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Sağlık alt kategorileri",
    subcategoryVenuePagePath: "saglik-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Eczaneler",
        countLabel: "eczane",
      },
      {
        source: "secondary",
        title: "Nöbetçi Eczaneler",
        countLabel: "nöbetçi eczane",
      },
      {
        source: "tertiary",
        title: "Hastaneler",
        countLabel: "hastane",
      },
      {
        source: "quaternary",
        title: "Aile Sağlığı Merkezleri",
        countLabel: "aile sağlığı merkezi",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: ["eczane", "pharmacy", "apteka", "saglik", "sağlık", "health", "klinik", "clinic"],
  },
  atm: {
    name: "ATM / Bankamatik",
    pageBase: "atm",
    titleUnit: "ATM noktası",
    dataFile: "data/atm.json",
    useDistrictCatalog: true,
    matcherKeywords: ["atm", "bankamatik", "cash", "cashpoint"],
  },
  kargo: {
    name: "Kargo Şubeleri",
    pageBase: "kargo",
    titleUnit: "kargo şubesi",
    dataFile: "data/kargo.json",
    useDistrictCatalog: true,
    matcherKeywords: ["kargo", "ptt", "yurtici", "aras", "mng", "surat", "ups", "dhl", "courier"],
  },
  noter: {
    name: "Noter",
    pageBase: "noter",
    titleUnit: "noter",
    dataFile: "data/noter.json",
    useDistrictCatalog: true,
    matcherKeywords: ["noter", "notary"],
  },
  asm: {
    name: "Aile Sağlığı Merkezi",
    pageBase: "asm",
    titleUnit: "aile sağlığı merkezi",
    dataFile: "data/asm.json",
    useDistrictCatalog: true,
    matcherKeywords: ["aile sagligi merkezi", "asm", "family health center", "saglik ocagi"],
  },
  "dis-klinikleri": {
    name: "Diş Klinikleri",
    pageBase: "dis-klinikleri",
    titleUnit: "diş kliniği",
    dataFile: "data/dis-klinikleri.json",
    useDistrictCatalog: true,
    matcherKeywords: ["dis klinigi", "dis", "dentist", "dental", "agiz dis sagligi"],
  },
  duraklar: {
    name: "Otobüs / Metro / Tramvay Durakları",
    pageBase: "duraklar",
    titleUnit: "durak",
    dataFile: "data/duraklar.json",
    useDistrictCatalog: true,
    matcherKeywords: ["durak", "bus stop", "metro", "tramvay", "tram", "istasyon", "station"],
  },
  seyahat: {
    name: "Gezi",
    pageBase: "gezi",
    titleUnit: "kamp alanı",
    dynamicTypeDataFile: "data/ktb-tesis-turleri-gezi.json",
    dynamicTypeVenueDataFile: "data/ktb-tesis-kayitlari-gezi.json",
    primaryRowTitle: "Kamp Alanları",
    dataFile: "data/gezi-kamp-alanlari.json",
    useDistrictCatalog: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Gezi alt kategorileri",
    subcategoryVenuePagePath: "gezi-mekanlar.html",
    districtLinkPages: [],
    matcherKeywords: [
      "gezi",
      "seyahat",
      "ulasim",
      "ulaşım",
      "kamp",
      "kamp alani",
      "kamp alanı",
      "camping",
      "kamping",
      "karavan",
      "butik otel",
      "bungalov",
      "pansiyon",
      "konaklama",
      "5 yildizli otel",
      "4 yildizli otel",
      "3 yildizli otel",
      "diger oteller",
      "otel",
      "hotel",
    ],
  },
  otopark: {
    name: "Otopark",
    pageBase: "otopark",
    titleUnit: "otopark",
    dataFile: "data/otopark.json",
    useDistrictCatalog: true,
    matcherKeywords: ["otopark", "parking", "car park"],
  },
  otel: {
    name: "Otel",
    pageBase: "otel",
    titleUnit: "otel",
    useDistrictCatalog: true,
    matcherKeywords: ["otel", "hotel", "resort", "pansiyon", "hostel", "bungalov", "apart"],
  },
  akaryakit: {
    name: "Keyif",
    pageBase: "keyif",
    titleUnit: "meyhane",
    dynamicTypeDataFile: "data/ktb-tesis-turleri-keyif.json",
    dynamicTypeVenueDataFile: "data/ktb-tesis-kayitlari-keyif.json",
    primaryRowTitle: "Meyhaneler",
    dataFile: "data/keyif.json",
    secondaryDataFile: "data/keyif-restoran.json",
    secondaryRowTitle: "Restoranlar",
    secondaryCountLabel: "restoran",
    tertiaryDataFile: "data/keyif-kahvalti.json",
    quaternaryDataFile: "data/keyif-kebap.json",
    quinaryDataFile: "data/keyif-kafe.json",
    senaryDataFile: "data/keyif-doner.json",
    septenaryDataFile: "data/keyif-pide.json",
    octonaryDataFile: "data/keyif-cigkofte.json",
    nonaryDataFile: "data/keyif-michelin-guide.json",
    denaryDataFile: "data/keyif-pub-bar.json",
    includeSecondaryInNavigation: true,
    preferVenueBackedDistricts: true,
    rootSubcategoryFirst: true,
    districtLinkHeading: "Keyif alt kategorileri",
    subcategoryVenuePagePath: "keyif-mekanlar.html",
    districtLinkPages: [
      {
        source: "primary",
        title: "Meyhaneler",
        countLabel: "meyhane",
      },
      {
        source: "secondary",
        title: "Restoranlar",
        countLabel: "restoran",
      },
      {
        source: "tertiary",
        title: "Kahvaltı Mekanları",
        countLabel: "kahvaltı mekanı",
      },
      {
        source: "quaternary",
        title: "Kebapçılar",
        countLabel: "kebapçı",
      },
      {
        source: "quinary",
        title: "Kafeler",
        countLabel: "kafe",
      },
      {
        source: "senary",
        title: "Dönerciler",
        countLabel: "dönerci",
      },
      {
        source: "septenary",
        title: "Pide ve Lahmacun",
        countLabel: "pide ve lahmacun",
      },
      {
        source: "octonary",
        title: "Çiğ Köfteciler",
        countLabel: "çiğ köfteci",
      },
      {
        source: "nonary",
        title: "Michelin Guide",
        countLabel: "michelin guide mekanı",
      },
      {
        source: "denary",
        title: "Pub&Bar",
        countLabel: "pub&bar mekanı",
      },
    ],
    useDistrictCatalog: true,
    matcherKeywords: [
      "keyif",
      "meyhane",
      "meyhaneler",
      "kafe",
      "cafe",
      "kahve",
      "coffee",
      "espresso",
      "taverna",
      "pub",
      "bar",
      "cocktail",
      "kokteyl",
      "lokanta",
      "lokantalar",
      "esnaf lokantasi",
      "esnaf lokantası",
      "fasil",
      "rakı",
      "raki",
      "michelin",
      "michelin guide",
    ],
  },
};

const RAW_REGION_GROUPS = [
  {
    title: "Marmara Bölgesi",
    provinces: [
      "Balıkesir",
      "Bilecik",
      "Bursa",
      "Çanakkale",
      "Edirne",
      "İstanbul",
      "Kırklareli",
      "Kocaeli",
      "Sakarya",
      "Tekirdağ",
      "Yalova",
    ],
  },
  {
    title: "Ege Bölgesi",
    provinces: ["Afyonkarahisar", "Aydın", "Denizli", "İzmir", "Kütahya", "Manisa", "Muğla", "Uşak"],
  },
  {
    title: "Akdeniz Bölgesi",
    provinces: ["Adana", "Antalya", "Burdur", "Hatay", "Isparta", "Mersin", "Kahramanmaraş", "Osmaniye"],
  },
  {
    title: "İç Anadolu Bölgesi",
    provinces: [
      "Aksaray",
      "Ankara",
      "Çankırı",
      "Eskişehir",
      "Karaman",
      "Kayseri",
      "Kırıkkale",
      "Kırşehir",
      "Konya",
      "Nevşehir",
      "Niğde",
      "Sivas",
      "Yozgat",
    ],
  },
  {
    title: "Karadeniz Bölgesi",
    provinces: [
      "Amasya",
      "Artvin",
      "Bartın",
      "Bayburt",
      "Bolu",
      "Çorum",
      "Düzce",
      "Giresun",
      "Gümüşhane",
      "Karabük",
      "Kastamonu",
      "Ordu",
      "Rize",
      "Samsun",
      "Sinop",
      "Tokat",
      "Trabzon",
      "Zonguldak",
    ],
  },
  {
    title: "Doğu Anadolu Bölgesi",
    provinces: [
      "Ağrı",
      "Ardahan",
      "Bingöl",
      "Bitlis",
      "Elazığ",
      "Erzincan",
      "Erzurum",
      "Hakkari",
      "Iğdır",
      "Kars",
      "Malatya",
      "Muş",
      "Tunceli",
      "Van",
    ],
  },
  {
    title: "Güneydoğu Anadolu Bölgesi",
    provinces: ["Adıyaman", "Batman", "Diyarbakır", "Gaziantep", "Kilis", "Mardin", "Siirt", "Şanlıurfa", "Şırnak"],
  },
];

const ALL_PROVINCES = RAW_REGION_GROUPS.flatMap((group) => group.provinces);

let allVenuesPromise = null;
const categoryDataPromiseCache = new Map();
const rawArrayDataPromiseCache = new Map();
let districtMapPromise = null;

function readFallbackData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.NEREDEYENIR_FALLBACK_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function translateCategoryUiLabel(value) {
  return String(value || "").trim();
}

function readFallbackFoodData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.NEREDEYENIR_FALLBACK_FOOD_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function fallbackFoodVenues() {
  const payload = readFallbackFoodData();
  if (!payload || !Array.isArray(payload.yemek)) {
    return [];
  }

  return payload.yemek;
}

function matchesFallbackFoodKeywords(item, keywords) {
  if (!item || !Array.isArray(keywords) || keywords.length === 0) {
    return false;
  }

  const haystack = normalizeSearchText([
    item.cuisine,
    item.name,
    item.address,
  ].filter(Boolean).join(" "));

  return keywords.some((keyword) => haystack.includes(normalizeSearchText(keyword)));
}

function readFallbackCategoryData() {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.NEREDEYENIR_FALLBACK_CATEGORY_DATA;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

function fallbackPayloadForDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return null;
  }

  const fallback = readFallbackData();
  const fallbackFood = readFallbackFoodData();
  const fallbackCategory = readFallbackCategoryData();

  if (cacheKey.includes("akaryakit") && fallback && Array.isArray(fallback.akaryakit)) {
    return fallback.akaryakit;
  }

  if (cacheKey.includes("kafe") && fallbackFood && Array.isArray(fallbackFood.kafe)) {
    return fallbackFood.kafe;
  }

  if (cacheKey.includes("keyif-restoran")) {
    const foodVenues = fallbackFoodVenues();
    return foodVenues.length > 0 ? foodVenues : null;
  }

  if (cacheKey.includes("keyif-kahvalti")) {
    return fallbackFoodVenues().filter((item) => matchesFallbackFoodKeywords(item, [
      "kahvalti",
      "kahvaltı",
      "brunch",
      "serpme",
    ]));
  }

  if (cacheKey.includes("keyif-kebap")) {
    return fallbackFoodVenues().filter((item) => matchesFallbackFoodKeywords(item, [
      "kebap",
      "ocakbasi",
      "ocakbaşı",
      "ciger",
      "ciğer",
      "izgara",
    ]));
  }

  if (cacheKey.includes("keyif-doner")) {
    return fallbackFoodVenues().filter((item) => matchesFallbackFoodKeywords(item, [
      "doner",
      "döner",
      "iskender",
    ]));
  }

  if (cacheKey.includes("keyif-pide")) {
    return fallbackFoodVenues().filter((item) => matchesFallbackFoodKeywords(item, [
      "pide",
      "lahmacun",
    ]));
  }

  if (cacheKey.includes("keyif-cigkofte")) {
    return fallbackFoodVenues().filter((item) => matchesFallbackFoodKeywords(item, [
      "cig kofte",
      "çiğ köfte",
      "cigkofte",
      "çiğköfte",
      "komagene",
      "oses",
    ]));
  }

  if (cacheKey.includes("keyif")) {
    const foodVenues = fallbackFoodVenues().filter((item) => matchesFallbackFoodKeywords(item, [
      "meyhane",
      "taverna",
      "meze",
      "fasil",
      "fasıl",
    ]));
    return foodVenues.length > 0 ? foodVenues : fallbackFoodVenues();
  }

  const isNobetciEczaneFile = /(?:^|\/)nobetci-eczane\.json(?:$|\?)/u.test(cacheKey);
  const isEczaneFile = /(?:^|\/)eczane\.json(?:$|\?)/u.test(cacheKey);

  if (
    isNobetciEczaneFile &&
    fallbackCategory &&
    Array.isArray(fallbackCategory.nobetciEczane)
  ) {
    return fallbackCategory.nobetciEczane;
  }

  if (isEczaneFile && fallbackCategory && Array.isArray(fallbackCategory.eczane)) {
    return fallbackCategory.eczane;
  }

  if (cacheKey.includes("kuafor") && fallback && Array.isArray(fallback.kuafor)) {
    return fallback.kuafor;
  }

  if (cacheKey.includes("veteriner") && fallbackCategory && Array.isArray(fallbackCategory.veteriner)) {
    return fallbackCategory.veteriner;
  }

  return null;
}

function normalizeName(value) {
  return String(value || "")
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

function normalizeSearchText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function queryParams() {
  const url = new URL(window.location.href);
  return {
    city: (url.searchParams.get("sehir") || url.searchParams.get("city") || "").trim(),
    district: (url.searchParams.get("ilce") || url.searchParams.get("district") || "").trim(),
    subcategorySource: (url.searchParams.get("tur") || url.searchParams.get("type") || "").trim(),
    facilityType: (url.searchParams.get("tt") || url.searchParams.get("tesis") || url.searchParams.get("facilityType") || "").trim(),
    venueName: (url.searchParams.get("mekan") || url.searchParams.get("venue") || "").trim(),
    sourcePlaceId: (url.searchParams.get("pid") || "").trim(),
  };
}

function normalizeFacilityType(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function resolveVenueFacilityType(venue) {
  return pickFirstText(venue?.sourceTesisTuru, venue?.type, venue?.cuisine);
}

function isCampingFacilityType(value) {
  const normalized = normalizeFacilityType(value);
  return normalized === "camping" || normalized === "kamping" || normalized === "kamp alani";
}

function isHotelFacilityType(value) {
  const normalized = normalizeFacilityType(value);
  return normalized === "otel" || normalized === "hotel";
}

function mapLegacyCampingVenueToDynamicVenue(venue) {
  return {
    ...venue,
    cuisine: "Camping",
    sourceTesisTuru: "Camping",
    source: pickFirstText(venue?.source, "legacy-camping"),
  };
}

function mapLegacyHotelVenueToDynamicVenue(venue) {
  return {
    ...venue,
    cuisine: "Otel",
    sourceTesisTuru: "Otel",
    source: pickFirstText(venue?.source, "legacy-hotel"),
  };
}

function stripDynamicNameNumericSuffix(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const compact = raw
    .replace(/(?:[\s-]+)\d{3,6}$/u, "")
    .replace(/([A-Za-zÇĞİIÖŞÜçğıöşü])\d{3,6}$/u, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return compact || raw;
}

function dynamicVenueLocalityKey(venue) {
  const cityKey = normalizeName(venue?.city);
  const districtKey = normalizeName(venue?.district);
  if (cityKey && districtKey) {
    return `${cityKey}:${districtKey}`;
  }
  return cityKey || districtKey || "_";
}

function buildDynamicVenueNameSetByLocality(venues) {
  const namesByLocality = new Map();

  venues.forEach((venue) => {
    const localityKey = dynamicVenueLocalityKey(venue);
    const rawNameKey = normalizeName(venue?.name);
    if (!rawNameKey) {
      return;
    }

    const existing = namesByLocality.get(localityKey);
    if (existing) {
      existing.add(rawNameKey);
      return;
    }

    namesByLocality.set(localityKey, new Set([rawNameKey]));
  });

  return namesByLocality;
}

function resolveDynamicVenueNameKey(venue, namesByLocality) {
  const rawNameKey = normalizeName(venue?.name);
  if (!rawNameKey) {
    return "";
  }

  const strippedNameKey = normalizeName(stripDynamicNameNumericSuffix(venue?.name));
  if (!strippedNameKey || strippedNameKey === rawNameKey) {
    return rawNameKey;
  }

  const localityKey = dynamicVenueLocalityKey(venue);
  const localityNames = namesByLocality.get(localityKey);
  if (localityNames && localityNames.has(strippedNameKey)) {
    return strippedNameKey;
  }

  return rawNameKey;
}

function scoreDynamicVenueForDedupe(venue, canonicalNameKey) {
  const rawNameKey = normalizeName(venue?.name);
  let score = venueInfoRichnessScore(venue);

  if (rawNameKey && rawNameKey === canonicalNameKey) {
    score += 100;
  }

  if (!/\d{3,6}\s*$/u.test(String(venue?.name || "").trim())) {
    score += 2;
  }

  return score;
}

function dedupeDynamicTypeVenues(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return [];
  }

  const namesByLocality = buildDynamicVenueNameSetByLocality(venues);
  const bestByKey = new Map();

  venues.forEach((venue) => {
    const canonicalNameKey = resolveDynamicVenueNameKey(venue, namesByLocality);
    if (!canonicalNameKey) {
      return;
    }

    const localityKey = dynamicVenueLocalityKey(venue);
    const identityKey = `${localityKey}:${canonicalNameKey}`;
    const existing = bestByKey.get(identityKey);

    if (!existing) {
      bestByKey.set(identityKey, venue);
      return;
    }

    const existingScore = scoreDynamicVenueForDedupe(existing, canonicalNameKey);
    const candidateScore = scoreDynamicVenueForDedupe(venue, canonicalNameKey);
    if (candidateScore > existingScore) {
      bestByKey.set(identityKey, venue);
    }
  });

  return [...bestByKey.values()];
}

function filterDynamicTypeVenues(venues, requestedType) {
  const typeText = String(requestedType || "").trim();
  if (!typeText) {
    return [];
  }

  const normalizedRequestedType = normalizeFacilityType(typeText);
  if (!normalizedRequestedType) {
    return [];
  }

  const filtered = venues.filter((venue) => {
    const venueType = normalizeFacilityType(resolveVenueFacilityType(venue));
    return venueType === normalizedRequestedType;
  });

  return dedupeDynamicTypeVenues(filtered);
}

function findNameMatch(queryValue, values) {
  if (!queryValue) {
    return "";
  }

  const normalizedQuery = normalizeName(queryValue);
  if (!normalizedQuery) {
    return "";
  }

  const exact = values.find((value) => value === queryValue);

  if (exact) {
    return exact;
  }

  const normalizedExact = values.find((value) => normalizeName(value) === normalizedQuery);
  if (normalizedExact) {
    return normalizedExact;
  }

  if (normalizedQuery.length < 3) {
    return "";
  }

  return values.find((value) => {
    const normalizedValue = normalizeName(value);
    return normalizedValue.includes(normalizedQuery) || normalizedQuery.includes(normalizedValue);
  }) || "";
}

function isCoordinateQuery(queryText) {
  const compact = String(queryText || "").trim().replace(/\s+/g, "");
  return /^-?\d{1,3}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/.test(compact);
}

function buildVenueQueryText(venue) {
  const seen = new Set();
  const parts = [];

  [venue?.name, venue?.address, venue?.neighborhood, venue?.postalCode, venue?.district, venue?.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = normalizeName(value);
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      parts.push(value);
    });

  return parts.join(" ");
}

function buildMapsSearchUrl(venue) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", buildVenueQueryText(venue));

  if (typeof venue.sourcePlaceId === "string" && venue.sourcePlaceId.trim()) {
    mapsUrl.searchParams.set("query_place_id", venue.sourcePlaceId.trim());
  }

  return mapsUrl.toString();
}

function buildMapsEmbedUrl(venue) {
  const query = buildVenueQueryText(venue);
  const mapsEmbed = new URL("https://www.google.com/maps");
  mapsEmbed.searchParams.set("q", query);
  mapsEmbed.searchParams.set("output", "embed");
  return mapsEmbed.toString();
}

function sanitizeUrl(rawUrl) {
  const raw = String(rawUrl || "").trim();
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return "";
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function resolvePhoneText(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const direct = pickFirstText(
    payload.phone,
    payload.phoneNumber,
    payload.telephone,
    payload.tel,
    payload.telefon,
    payload.mobile,
    payload.gsm,
    payload.contactPhone,
    payload.contact_number,
    payload.internationalPhoneNumber,
    payload.nationalPhoneNumber,
  );
  if (direct) {
    return direct;
  }

  if (payload.contact && typeof payload.contact === "object") {
    const contactPhone = pickFirstText(
      payload.contact.phone,
      payload.contact.mobile,
      payload.contact.tel,
      payload.contact.telefon,
    );
    if (contactPhone) {
      return contactPhone;
    }
  }

  if (Array.isArray(payload.phones)) {
    const firstFromList = payload.phones
      .map((value) => String(value || "").trim())
      .find(Boolean);
    if (firstFromList) {
      return firstFromList;
    }
  }

  return "";
}

function mapsPlaceUrl(venue) {
  if (typeof venue.mapsUrl === "string" && venue.mapsUrl.trim()) {
    const raw = venue.mapsUrl.trim();

    try {
      const parsed = new URL(raw);
      const query = parsed.searchParams.get("query") || "";
      const placeId = parsed.searchParams.get("query_place_id") || "";

      if (isCoordinateQuery(query) && !placeId) {
        return buildMapsSearchUrl(venue);
      }

      return raw;
    } catch (_error) {
      return buildMapsSearchUrl(venue);
    }
  }

  return buildMapsSearchUrl(venue);
}

let mapFocusModalApi = null;

function ensureMapFocusModal() {
  if (mapFocusModalApi) {
    return mapFocusModalApi;
  }

  if (!document.body) {
    return null;
  }

  const modal = document.createElement("section");
  modal.className = "map-focus-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <button class="map-focus-backdrop" type="button" aria-label="Harita penceresini kapat"></button>
    <article class="map-focus-panel" role="dialog" aria-modal="true" aria-labelledby="mapFocusTitle">
      <header class="map-focus-head">
        <div class="map-focus-head-text">
          <p class="map-focus-eyebrow">Harita Odağı</p>
          <h3 id="mapFocusTitle" class="map-focus-title">Mekan</h3>
        </div>
        <button class="map-focus-close" type="button" aria-label="Kapat">Kapat</button>
      </header>
      <div class="map-focus-body">
        <aside class="map-focus-info-card" aria-label="Mekan bilgileri">
          <h4 class="map-focus-info-title">Mekan Bilgisi</h4>
          <dl class="map-focus-info-list">
            <div class="map-focus-info-row" data-info-row="phone-primary">
              <dt>Telefon No</dt>
              <dd data-info-field="phone-primary">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="location">
              <dt>Konum</dt>
              <dd data-info-field="location">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="address">
              <dt>Adres</dt>
              <dd data-info-field="address">-</dd>
            </div>
            <div class="map-focus-info-row" data-info-row="website">
              <dt>Website</dt>
              <dd>
                <img class="map-focus-info-photo" data-info-field="photo" alt="Mekan görseli" loading="lazy" hidden />
                <a data-info-field="website" href="#" target="_blank" rel="noopener noreferrer">Siteye git</a>
              </dd>
            </div>
          </dl>
        </aside>
        <div class="map-focus-frame-wrap">
          <iframe
            class="map-focus-frame"
            title="Google Maps mekan görünümü"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      <footer class="map-focus-foot">
        <p class="map-focus-subtitle"></p>
        <a class="map-focus-external" href="#" target="_blank" rel="noopener noreferrer">Google Maps'te aç</a>
      </footer>
    </article>
  `;

  const titleNode = modal.querySelector(".map-focus-title");
  const subtitleNode = modal.querySelector(".map-focus-subtitle");
  const iframeNode = modal.querySelector(".map-focus-frame");
  const externalNode = modal.querySelector(".map-focus-external");
  const closeNode = modal.querySelector(".map-focus-close");
  const backdropNode = modal.querySelector(".map-focus-backdrop");
  const infoPhonePrimaryNode = modal.querySelector('[data-info-field="phone-primary"]');
  const infoLocationNode = modal.querySelector('[data-info-field="location"]');
  const infoAddressNode = modal.querySelector('[data-info-field="address"]');
  const infoWebsiteNode = modal.querySelector('[data-info-field="website"]');
  const infoPhotoNode = modal.querySelector('[data-info-field="photo"]');
  const infoPhonePrimaryRow = modal.querySelector('[data-info-row="phone-primary"]');
  const infoLocationRow = modal.querySelector('[data-info-row="location"]');
  const infoAddressRow = modal.querySelector('[data-info-row="address"]');
  const infoWebsiteRow = modal.querySelector('[data-info-row="website"]');

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("map-focus-open");
    if (iframeNode instanceof HTMLIFrameElement) {
      iframeNode.src = "about:blank";
    }
  };

  const open = (payload) => {
    const title = String(payload?.title || "").trim() || "Mekan";
    const subtitle = String(payload?.subtitle || "").trim();
    const embedUrl = String(payload?.embedUrl || "").trim();
    const externalUrl = String(payload?.externalUrl || "").trim() || embedUrl;

    if (!embedUrl || !(iframeNode instanceof HTMLIFrameElement)) {
      if (externalUrl) {
        window.open(externalUrl, "_blank", "noopener");
      }
      return;
    }

    if (titleNode) {
      titleNode.textContent = title;
    }
    if (subtitleNode) {
      subtitleNode.textContent = subtitle;
      subtitleNode.hidden = !subtitle;
    }
    if (externalNode instanceof HTMLAnchorElement) {
      externalNode.href = externalUrl;
    }

    const info = payload?.info && typeof payload.info === "object" ? payload.info : {};
    const infoLocation = String(info.location || subtitle || "").trim();
    const infoAddress = String(info.address || "").trim();
    const infoPhone = String(info.phone || "").trim();
    const infoWebsite = sanitizeUrl(info.website);
    const infoPhoto = sanitizeUrl(
      info.photoUrl || info.photoUri || info.imageUrl || info.image || info.coverImageUrl,
    );

    if (infoPhonePrimaryNode) {
      infoPhonePrimaryNode.textContent = infoPhone || "Bilgi yok";
    }
    if (infoLocationNode) {
      infoLocationNode.textContent = infoLocation || "-";
    }
    if (infoAddressNode) {
      infoAddressNode.textContent = infoAddress || "-";
    }
    if (infoWebsiteNode instanceof HTMLAnchorElement) {
      if (infoWebsite) {
        infoWebsiteNode.href = infoWebsite;
        infoWebsiteNode.textContent = infoWebsite;
      } else {
        infoWebsiteNode.removeAttribute("href");
        infoWebsiteNode.textContent = "";
      }
    }
    if (infoPhotoNode instanceof HTMLImageElement) {
      if (infoPhoto) {
        infoPhotoNode.src = infoPhoto;
        infoPhotoNode.hidden = false;
      } else {
        infoPhotoNode.removeAttribute("src");
        infoPhotoNode.hidden = true;
      }
    }

    if (infoPhonePrimaryRow instanceof HTMLElement) {
      infoPhonePrimaryRow.hidden = false;
    }
    if (infoLocationRow instanceof HTMLElement) {
      infoLocationRow.hidden = !infoLocation;
    }
    if (infoAddressRow instanceof HTMLElement) {
      infoAddressRow.hidden = !infoAddress;
    }
    if (infoWebsiteRow instanceof HTMLElement) {
      infoWebsiteRow.hidden = false;
    }

    iframeNode.src = embedUrl;
    modal.hidden = false;
    document.body.classList.add("map-focus-open");
  };

  closeNode?.addEventListener("click", close);
  backdropNode?.addEventListener("click", close);
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  document.body.append(modal);
  mapFocusModalApi = { open, close };
  return mapFocusModalApi;
}

function openVenueMapFocus(venue) {
  const api = ensureMapFocusModal();
  const externalUrl = mapsPlaceUrl(venue);
  const embedUrl = buildMapsEmbedUrl(venue);
  const subtitle = [venue.district, venue.city].map((value) => String(value || "").trim()).filter(Boolean).join(" / ");

  if (!api) {
    window.open(externalUrl, "_blank", "noopener");
    return;
  }

  api.open({
    title: String(venue.name || "").trim() || "Mekan",
    subtitle,
    embedUrl,
    externalUrl,
    info: {
      location: subtitle,
      address: String(venue.address || "").trim(),
      phone: String(venue.phone || "").trim(),
      website: String(venue.website || "").trim(),
      photoUrl: String(venue.photoUrl || "").trim(),
    },
  });
}

let autoOpenedVenueKey = "";

function findRequestedVenue(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return null;
  }

  const { venueName, sourcePlaceId } = queryParams();
  const normalizedVenueName = normalizeName(venueName);
  const normalizedPlaceId = String(sourcePlaceId || "").trim();

  if (normalizedPlaceId) {
    const placeIdMatch = venues.find((venue) => {
      return String(venue?.sourcePlaceId || "").trim() === normalizedPlaceId;
    });
    if (placeIdMatch) {
      return placeIdMatch;
    }
  }

  if (!normalizedVenueName) {
    return null;
  }

  return venues.find((venue) => normalizeName(venue?.name) === normalizedVenueName) || null;
}

function autoOpenRequestedVenue(venues) {
  const targetVenue = findRequestedVenue(venues);
  if (!targetVenue) {
    return;
  }

  const nextKey = String(targetVenue.sourcePlaceId || "").trim()
    || `${normalizeName(targetVenue.city)}:${normalizeName(targetVenue.district)}:${normalizeName(targetVenue.name)}`;
  if (!nextKey || autoOpenedVenueKey === nextKey) {
    return;
  }

  autoOpenedVenueKey = nextKey;
  window.requestAnimationFrame(() => {
    openVenueMapFocus(targetVenue);
  });
}

function redirectRequestedVenueFromDistrictLinks(definition, matchedCity, matchedDistrict, venueGroups) {
  if (!definition || !matchedCity || !matchedDistrict || !Array.isArray(venueGroups) || venueGroups.length === 0) {
    return false;
  }

  const { venueName, sourcePlaceId } = queryParams();
  if (!String(venueName || "").trim() && !String(sourcePlaceId || "").trim()) {
    return false;
  }

  for (const group of venueGroups) {
    const pagePath = String(group?.pagePath || "").trim();
    const sourceVenues = Array.isArray(group?.venues) ? group.venues : [];
    if (!pagePath || sourceVenues.length === 0) {
      continue;
    }

    const targetVenue = findRequestedVenue(sourceVenues);
    if (!targetVenue) {
      continue;
    }

    const targetUrl = new URL(pagePath, window.location.href);
    targetUrl.searchParams.set("sehir", matchedCity);
    targetUrl.searchParams.set("ilce", matchedDistrict);
    targetUrl.searchParams.set("mekan", String(targetVenue.name || "").trim() || String(venueName || "").trim());

    const nextPlaceId = String(targetVenue.sourcePlaceId || sourcePlaceId || "").trim();
    if (nextPlaceId) {
      targetUrl.searchParams.set("pid", nextPlaceId);
    }

    const nextHref = `${targetUrl.pathname}${targetUrl.search}`;
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (nextHref !== currentHref) {
      window.location.replace(nextHref);
      return true;
    }
  }

  return false;
}

function venueSearchText(venue) {
  return normalizeSearchText(
    [venue.name, venue.cuisine, venue.address, venue.website, venue.editorialSummary, venue.instagram]
      .filter(Boolean)
      .join(" "),
  );
}

function matchCategory(venue, definition) {
  const searchable = venueSearchText(venue);

  return definition.matcherKeywords.some((keyword) => {
    if (keyword.length <= 2) {
      return searchable.split(/\s+/).includes(keyword);
    }

    return searchable.includes(keyword);
  });
}

function dedupeVenues(venues) {
  const seen = new Set();

  return venues.filter((venue) => {
    const key = venue.sourcePlaceId || `${normalizeName(venue.city)}:${normalizeName(venue.district)}:${normalizeName(venue.name)}`;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeByName(venues) {
  const seen = new Set();

  return venues
    .filter((venue) => {
      const key = venue.sourcePlaceId
        ? `pid:${venue.sourcePlaceId}`
        : `${normalizeName(venue.name)}:${normalizeName(venue.address || venue.mapsUrl || "")}`;

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "tr"));
}

function venueIdentityKeyForCount(venue) {
  if (!venue || typeof venue !== "object") {
    return "";
  }

  const placeId = String(venue.sourcePlaceId || "").trim();
  if (placeId) {
    return `pid:${placeId}`;
  }

  const cityKey = normalizeName(venue.city);
  const districtKey = normalizeName(venue.district);
  const nameKey = normalizeName(venue.name);
  if (!cityKey || !districtKey || !nameKey) {
    return "";
  }

  return `${cityKey}:${districtKey}:${nameKey}`;
}

function buildCityVenueCountMap(venues) {
  const counts = new Map();
  const seen = new Set();

  venues.forEach((venue) => {
    const identityKey = venueIdentityKeyForCount(venue);
    if (!identityKey || seen.has(identityKey)) {
      return;
    }
    seen.add(identityKey);

    const cityKey = normalizeName(venue.city);
    if (!cityKey) {
      return;
    }

    counts.set(cityKey, (counts.get(cityKey) || 0) + 1);
  });

  return counts;
}

function buildDistrictVenueCountMap(venues, cityName) {
  const counts = new Map();
  const seen = new Set();
  const cityKey = normalizeName(cityName);
  if (!cityKey) {
    return counts;
  }

  venues.forEach((venue) => {
    if (normalizeName(venue.city) !== cityKey) {
      return;
    }

    const identityKey = venueIdentityKeyForCount(venue);
    if (!identityKey || seen.has(identityKey)) {
      return;
    }
    seen.add(identityKey);

    const districtKey = normalizeName(venue.district);
    if (!districtKey) {
      return;
    }

    counts.set(districtKey, (counts.get(districtKey) || 0) + 1);
  });

  return counts;
}

function simplifyVenueBrandLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  let label = raw.split(" - ")[0].trim();
  label = label.replace(/\s*\([^)]*\)\s*/gu, " ").replace(/\s+/g, " ").trim();

  const removableTail = [
    " cafe",
    " kafe",
    " coffee",
    " coffe",
    " restaurant",
    " restoran",
    " bistro",
    " bakery",
    " pasta",
    " şubesi",
    " subesi",
    " şube",
    " sube",
    " avm",
    " outlet",
    " park",
  ];

  let normalized = label;
  let changed = true;
  while (changed && normalized) {
    changed = false;
    const lower = normalized.toLocaleLowerCase("tr");

    for (const suffix of removableTail) {
      if (!lower.endsWith(suffix)) {
        continue;
      }

      normalized = normalized.slice(0, Math.max(0, normalized.length - suffix.length)).trim();
      changed = true;
      break;
    }
  }

  return normalized || label;
}

function buildVenueBrandKey(venue) {
  const simplified = simplifyVenueBrandLabel(venue?.name);
  const cityKey = normalizeSearchText(String(venue?.city || ""));
  const districtKey = normalizeSearchText(String(venue?.district || ""));

  const genericTokens = new Set([
    "cafe",
    "kafe",
    "coffee",
    "coffe",
    "restaurant",
    "restoran",
    "bistro",
    "bakery",
    "pasta",
    "subesi",
    "sube",
    "şubesi",
    "şube",
    "avm",
    "outlet",
    "park",
  ]);

  const tokens = normalizeSearchText(simplified)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== cityKey && item !== districtKey)
    .filter((item) => !genericTokens.has(item));

  const signature = tokens.join(" ").trim();
  return normalizeName(signature || simplified || String(venue?.name || ""));
}

function venueInfoRichnessScore(venue) {
  let score = 0;

  if (String(venue?.sourcePlaceId || "").trim()) {
    score += 50;
  }
  if (String(venue?.placeId || "").trim()) {
    score += 50;
  }
  if (String(venue?.phone || "").trim()) {
    score += 10;
  }
  if (String(venue?.website || "").trim()) {
    score += 10;
  }
  if (String(venue?.mapsUrl || "").trim()) {
    score += 8;
  }
  if (String(venue?.photoUrl || "").trim()) {
    score += 6;
  }
  if (String(venue?.editorialSummary || "").trim()) {
    score += 4;
  }
  if (String(venue?.instagram || "").trim()) {
    score += 3;
  }

  score += readNumericVenueRating(venue) * 5;
  score += Math.min(20, readNumericVenueReviewCount(venue) / 100);

  return score;
}

function mergeVenueGroupForDisplay(venues) {
  if (!Array.isArray(venues) || venues.length === 0) {
    return [];
  }

  const groups = new Map();

  venues.forEach((venue) => {
    const groupKey = buildVenueBrandKey(venue);
    const existing = groups.get(groupKey);

    if (!existing) {
      groups.set(groupKey, [venue]);
      return;
    }

    existing.push(venue);
  });

  return [...groups.values()].map((group) => {
    if (group.length === 1) {
      return group[0];
    }

    const bestBase = [...group].sort((left, right) => {
      const scoreDiff = venueInfoRichnessScore(right) - venueInfoRichnessScore(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return String(left.name || "").length - String(right.name || "").length;
    })[0];

    const merged = { ...bestBase };
    const preferredLabel = [...group]
      .map((venue) => simplifyVenueBrandLabel(venue.name))
      .filter(Boolean)
      .sort((left, right) => left.length - right.length || left.localeCompare(right, "tr"))[0];

    if (preferredLabel) {
      merged.name = preferredLabel;
    }

    group.forEach((venue) => {
      [
        "address",
        "neighborhood",
        "postalCode",
        "mapsUrl",
        "website",
        "phone",
        "photoUrl",
        "editorialSummary",
        "instagram",
        "sourcePlaceId",
        "placeId",
        "googleRating",
        "googleReviewCount",
      ].forEach((field) => {
        if (!String(merged[field] || "").trim() && String(venue[field] || "").trim()) {
          merged[field] = venue[field];
        }
      });
    });

    return merged;
  });
}

function shouldMergeDisplayVenueGroups(definition) {
  const categoryKey = String(definition?.key || "").trim();
  return categoryKey === "akaryakit" || categoryKey === "hizmetler";
}

function classifyTransitVenueGroup(venue) {
  const searchBlob = [
    venue?.name,
    venue?.address,
    venue?.website,
  ]
    .map((value) => normalizeName(value))
    .filter(Boolean)
    .join(" ");

  if (!searchBlob) {
    return "fuel";
  }

  if (
    searchBlob.includes("sarj")
    || searchBlob.includes("şarj")
    || searchBlob.includes("charging")
    || searchBlob.includes("charger")
    || searchBlob.includes("supercharger")
    || searchBlob.includes("trugo")
    || searchBlob.includes("zes")
    || searchBlob.includes("esarj")
    || searchBlob.includes("eşarj")
    || searchBlob.includes("voltrun")
    || searchBlob.includes("charge")
  ) {
    return "charge";
  }

  if (
    searchBlob.includes("otopark")
    || searchBlob.includes("parking")
    || searchBlob.includes("ispark")
    || searchBlob.includes("vale")
  ) {
    return "parking";
  }

  if (
    searchBlob.includes("rent a car")
    || searchBlob.includes("araba kiralama")
    || searchBlob.includes("kiralama")
    || searchBlob.includes("oto yikama")
    || searchBlob.includes("otoyikama")
    || searchBlob.includes("otokuafo")
    || searchBlob.includes("otokuafor")
  ) {
    return "other";
  }

  return "fuel";
}

function splitTransitVenueGroups(venues) {
  const groups = {
    fuel: [],
    charge: [],
    parking: [],
    other: [],
  };

  venues.forEach((venue) => {
    const key = classifyTransitVenueGroup(venue);
    if (!groups[key]) {
      groups.fuel.push(venue);
      return;
    }
    groups[key].push(venue);
  });

  return groups;
}

function readNumericVenueRating(venue) {
  const candidates = [
    venue?.googleRating,
    venue?.rating,
    venue?.score,
    venue?.stars,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string") {
      const normalized = candidate.replace(",", ".").trim();
      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function readNumericVenueReviewCount(venue) {
  const candidates = [
    venue?.googleReviewCount,
    venue?.reviewCount,
    venue?.reviews,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string") {
      const digits = candidate.replace(/[^\d]/g, "");
      const parsed = Number.parseInt(digits, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function sortVenuesByGoogleRating(venues) {
  return [...venues].sort((left, right) => {
    const ratingDiff = readNumericVenueRating(right) - readNumericVenueRating(left);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    const reviewDiff = readNumericVenueReviewCount(right) - readNumericVenueReviewCount(left);
    if (reviewDiff !== 0) {
      return reviewDiff;
    }

    return String(left.name || "").localeCompare(String(right.name || ""), "tr");
  });
}

function parseDutyDateText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const match = text.match(/^(\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)/u);
  return match ? String(match[1] || "").trim() : "";
}

function resolveDutyDateLabel(venues) {
  const today = new Date();
  const todayLabel = `${today.getDate()} ${today.toLocaleDateString("tr-TR", { month: "long" })} ${today.toLocaleDateString("tr-TR", { weekday: "long" })}`;

  const labels = [...new Set(
    venues
      .map((venue) => String(venue.dutyDate || parseDutyDateText(venue.dutyInfo)).trim())
      .filter(Boolean),
  )];

  if (labels.includes(todayLabel)) {
    return todayLabel;
  }

  // Nöbetçi eczane başlığında her gün o günün tarihini göster.
  return todayLabel;
}

function groupedDistrictHospitals(venues, city, district) {
  const normalizedCity = normalizeName(city);
  const normalizedDistrict = normalizeName(district);
  const groups = new Map();

  venues.forEach((venue) => {
    const venueCity = normalizeName(venue.city);
    const venueDistrict = normalizeName(venue.district);
    const matchesCity = venueCity === normalizedCity;
    const matchesDistrict = venueDistrict === normalizedDistrict;
    const isCityWideHospital = matchesCity && !venueDistrict;

    if (!matchesCity || (!matchesDistrict && !isCityWideHospital)) {
      return;
    }

    const name = String(venue.name || "").trim();
    if (!name) {
      return;
    }

    const rawGroup = String(venue.hospitalGroup || "Hastaneler").trim() || "Hastaneler";
    const listed = groups.get(rawGroup) || [];
    listed.push(venue);
    groups.set(rawGroup, listed);
  });

  const result = [];
  groups.forEach((groupVenues, rawTitle) => {
    const deduped = dedupeByName(groupVenues);
    if (deduped.length === 0) {
      return;
    }

    const title = normalizeName(rawTitle) === normalizeName("Şehir Hastaneleri")
      ? "Şehir Hastanesi"
      : rawTitle;

    result.push({ title, venues: deduped });
  });

  return result.sort((left, right) => left.title.localeCompare(right.title, "tr"));
}

function groupedDistrictFamilyCenters(venues, city, district) {
  const normalizedCity = normalizeName(city);
  const normalizedDistrict = normalizeName(district);

  return dedupeByName(
    venues.filter((venue) => {
      return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
    }),
  );
}

function shouldDedupeDistrictNameSlices(definition) {
  const categoryKey = String(definition?.key || "").trim();
  return categoryKey !== "seyahat";
}

function filterDistrictVenueSlice(definition, venues, city, district) {
  const normalizedCity = normalizeName(city);
  const normalizedDistrict = normalizeName(district);
  const filtered = venues.filter((venue) => {
    return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
  });

  return shouldDedupeDistrictNameSlices(definition) ? dedupeByName(filtered) : filtered;
}

function renderVenueRow(title, venues, subtitle = "", options = {}) {
  const adContext = options && typeof options === "object" ? options.adContext : null;
  const adConfig = options && typeof options === "object" ? options.adConfig : null;
  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  const mainTitle = document.createElement("span");
  mainTitle.className = "province-region-title";
  mainTitle.textContent = title;
  rowTitle.append(mainTitle);

  if (subtitle) {
    const meta = document.createElement("span");
    meta.className = "province-region-meta";
    meta.textContent = subtitle;
    rowTitle.append(meta);
  }

  const chips = document.createElement("div");
  chips.className = "province-cities";

  venues.forEach((venue, index) => {
    const chip = document.createElement("button");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.type = "button";
    chip.textContent = venue.name;
    chip.setAttribute("aria-label", `${venue.name} kaydını harita penceresinde aç`);
    chip.addEventListener("click", () => {
      openVenueMapFocus(venue);
    });
    chips.append(chip);

    const shouldInsertAd = Boolean(
      adContext
      && adConfig
      && adContext.inserted !== true
      && venues.length > adConfig.insertAfter
      && index + 1 === adConfig.insertAfter,
    );
    if (shouldInsertAd) {
      const adCard = renderDistrictInlineAdCard(adConfig);
      if (adCard) {
        chips.append(adCard);
        adContext.inserted = true;
      }
    }
  });

  row.append(rowTitle, chips);
  return row;
}

function resolveDistrictMatches(
  venues,
  districtMap,
  useDistrictCatalog,
  navigationVenues = venues,
  preferVenueBackedDistricts = false,
) {
  const { city, district } = queryParams();
  const cityNames = (
    useDistrictCatalog
      ? Object.keys(districtMap).map((value) => String(value || "").trim()).filter(Boolean)
      : [...new Set(navigationVenues.map((venue) => venue.city).filter(Boolean))]
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(city, cityNames);

  let matchedDistrict = "";

  if (matchedCity) {
    const districtNames = resolveDistrictList(
      matchedCity,
      navigationVenues,
      districtMap || {},
      useDistrictCatalog,
      preferVenueBackedDistricts,
    );
    matchedDistrict = findNameMatch(district, districtNames);
  }

  return { matchedCity, matchedDistrict };
}

async function loadDistrictMap() {
  if (!districtMapPromise) {
    const normalizeDistrictMap = (payload) => {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return {};
      }

      const normalized = {};

      Object.entries(payload).forEach(([rawCity, rawDistricts]) => {
        const city = String(rawCity || "").trim();

        if (!city) {
          return;
        }

        const districts = Array.isArray(rawDistricts)
          ? [...new Set(rawDistricts.map((value) => String(value || "").trim()).filter(Boolean))]
          : [];

        normalized[city] = districts;
      });

      return normalized;
    };

    districtMapPromise = fetchJsonWithFallback(DISTRICTS_JSON_PATH, {})
      .then((payload) => {
        const normalized = normalizeDistrictMap(payload);
        if (Object.keys(normalized).length > 0) {
          return normalized;
        }

        const fallback = readFallbackData();
        return normalizeDistrictMap(fallback?.districts || {});
      })
      .catch(() => {
        const fallback = readFallbackData();
        return normalizeDistrictMap(fallback?.districts || {});
      });
  }

  return districtMapPromise;
}

async function loadAllVenues() {
  if (!allVenuesPromise) {
    allVenuesPromise = fetchJsonWithFallback(CATEGORY_VENUES_JSON_PATH, [])
      .then((payload) => {
        if (!Array.isArray(payload)) {
          return [];
        }

        return payload.map((item) => ({
          city: String(item.city || "").trim(),
          district: String(item.district || "").trim(),
          name: String(item.name || "").trim(),
          cuisine: String(item.cuisine || "").trim(),
          address: String(item.address || "").trim(),
          neighborhood: String(item.neighborhood || item.mahalle || "").trim(),
          postalCode: String(item.postalCode || item.postcode || "").trim(),
          website: String(item.website || "").trim(),
          phone: resolvePhoneText(item),
          photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
          editorialSummary: String(item.editorialSummary || "").trim(),
          instagram: String(item.instagram || "").trim(),
          sourcePlaceId: typeof item.sourcePlaceId === "string" ? item.sourcePlaceId.trim() : "",
        }));
      })
      .catch((error) => {
        console.error(error);
        return [];
      });
  }

  return allVenuesPromise;
}

async function loadCategoryDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return [];
  }

  if (!categoryDataPromiseCache.has(cacheKey)) {
    const fallbackPayload = fallbackPayloadForDataFile(cacheKey);
    if (Array.isArray(fallbackPayload)) {
      categoryDataPromiseCache.set(cacheKey, Promise.resolve(fallbackPayload));
      return categoryDataPromiseCache.get(cacheKey);
    }

    const promise = fetchJsonWithFallback(cacheKey, [])
      .then((payload) => {
        if (!Array.isArray(payload)) {
          return [];
        }

        return payload.map((item) => ({
          city: String(item.city || "").trim(),
          district: String(item.district || "").trim(),
          name: String(item.name || "").trim(),
          cuisine: String(item.cuisine || item.category || "").trim(),
          hospitalGroup: String(item.hospitalGroup || item.group || "").trim(),
          address: String(item.address || "").trim(),
          neighborhood: String(item.neighborhood || item.mahalle || "").trim(),
          postalCode: String(item.postalCode || item.postcode || "").trim(),
          mapsUrl: String(item.mapsUrl || "").trim(),
          website: String(item.website || "").trim(),
          phone: resolvePhoneText(item),
          photoUrl: String(item.photoUrl || item.photoUri || item.imageUrl || item.image || item.coverImageUrl || "").trim(),
          editorialSummary: String(item.editorialSummary || "").trim(),
          instagram: String(item.instagram || "").trim(),
          dutyInfo: String(item.dutyInfo || "").trim(),
          dutyDate: String(item.dutyDate || "").trim(),
          googleRating: String(item.googleRating || item.rating || item.score || item.stars || "").trim(),
          googleReviewCount: String(item.googleReviewCount || item.reviewCount || item.reviews || "").trim(),
          sourcePlaceId: String(item.sourcePlaceId || item.placeId || "").trim(),
        }));
      })
      .catch(() => []);

    categoryDataPromiseCache.set(cacheKey, promise);
  }

  return categoryDataPromiseCache.get(cacheKey);
}

async function loadRawArrayDataFile(dataFilePath) {
  const cacheKey = String(dataFilePath || "").trim();
  if (!cacheKey) {
    return [];
  }

  if (!rawArrayDataPromiseCache.has(cacheKey)) {
    const fallbackPayload = fallbackPayloadForDataFile(cacheKey);
    if (Array.isArray(fallbackPayload)) {
      rawArrayDataPromiseCache.set(cacheKey, Promise.resolve(fallbackPayload));
      return rawArrayDataPromiseCache.get(cacheKey);
    }

    const promise = fetchJsonWithFallback(cacheKey, [])
      .then((payload) => {
        return Array.isArray(payload) ? payload : [];
      })
      .catch(() => []);

    rawArrayDataPromiseCache.set(cacheKey, promise);
  }

  return rawArrayDataPromiseCache.get(cacheKey);
}

async function loadCategoryVenues(categoryKey) {
  const baseDefinition = CATEGORY_DEFINITIONS[categoryKey];
  const definition = baseDefinition ? { key: categoryKey, ...baseDefinition } : null;

  if (!definition) {
    return [];
  }

  if (definition.dataFile) {
    const fileVenues = await loadCategoryDataFile(definition.dataFile);
    return dedupeVenues(
      fileVenues.filter((venue) => {
        return venue.city && venue.district && venue.name;
      }),
    );
  }

  const venues = await loadAllVenues();

  return dedupeVenues(
    venues.filter((venue) => {
      return venue.city && venue.district && venue.name && matchCategory(venue, definition);
    }),
  );
}

function regionGroupsForCities(citySet) {
  return RAW_REGION_GROUPS
    .map((group) => ({
      title: group.title,
      provinces: group.provinces.filter((provinceName) => citySet.has(provinceName)),
    }))
    .filter((group) => group.provinces.length > 0);
}

function hasUsableDistrictCatalog(districtMap) {
  if (!districtMap || typeof districtMap !== "object" || Array.isArray(districtMap)) {
    return false;
  }

  return Object.keys(districtMap).length > 0;
}

function venueDistrictsForCity(venues, cityName) {
  return [...new Set(
    venues
      .filter((venue) => normalizeName(venue.city) === normalizeName(cityName))
      .map((venue) => venue.district)
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));
}

function resolveDistrictList(
  matchedCity,
  venues,
  districtMap,
  useDistrictCatalog,
  preferVenueBackedDistricts = false,
) {
  const venueDistricts = venueDistrictsForCity(venues, matchedCity);
  const mergeUniqueDistricts = (primaryList, extraList = []) => {
    const seen = new Set();
    return [...primaryList, ...extraList]
      .map((value) => String(value || "").trim())
      .filter((value) => {
        const key = normalizeName(value);
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((left, right) => left.localeCompare(right, "tr"));
  };

  if (!useDistrictCatalog) {
    return venueDistricts;
  }

  const catalogDistricts = [...new Set(
    (districtMap[matchedCity] || [])
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "tr"));

  if (catalogDistricts.length > 0) {
    const catalogDistrictSet = new Set(catalogDistricts.map((value) => normalizeName(value)));
    const venueOnlyDistricts = venueDistricts.filter((value) => {
      return !catalogDistrictSet.has(normalizeName(value));
    });

    if (preferVenueBackedDistricts && venueDistricts.length > 0) {
      const venueDistrictSet = new Set(venueDistricts.map((value) => normalizeName(value)));
      const matchedCatalogDistricts = catalogDistricts.filter((value) => {
        return venueDistrictSet.has(normalizeName(value));
      });

      if (matchedCatalogDistricts.length > 0) {
        return mergeUniqueDistricts(matchedCatalogDistricts, venueOnlyDistricts);
      }

      return venueDistricts;
    }

    return mergeUniqueDistricts(catalogDistricts, venueOnlyDistricts);
  }

  return venueDistricts;
}

function renderRootPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeItems = [],
) {
  const groupGrid = document.querySelector("#categoryGroupGrid");

  if (!groupGrid) {
    return;
  }

  groupGrid.innerHTML = "";

  if (definition.rootSubcategoryFirst) {
    const row = document.createElement("article");
    row.className = "province-row";
    const staticDistrictLinkPages = Array.isArray(definition.districtLinkPages)
      ? definition.districtLinkPages
      : [];

    const headingStack = document.createElement("div");
    headingStack.className = "province-heading-stack";
    headingStack.style.minWidth = "0";
    headingStack.style.display = "grid";
    headingStack.style.alignContent = "start";
    headingStack.style.gap = "0.45rem";

    const rowHeadingText =
      translateCategoryUiLabel(String(definition.districtLinkHeading || `${definition.name} Türleri`).trim() || "Türler");
    const pageHeading = document.querySelector(".section-head.province-head h3");
    const pageHeadingText = pageHeading ? String(pageHeading.textContent || "").trim() : "";
    const shouldRenderRowTitle = staticDistrictLinkPages.length > 0
      && normalizeName(pageHeadingText) !== normalizeName(rowHeadingText);
    if (shouldRenderRowTitle) {
      const rowTitle = document.createElement("h4");
      rowTitle.className = "province-region";
      rowTitle.textContent = rowHeadingText;
      headingStack.append(rowTitle);
    }

    const chips = document.createElement("div");
    chips.className = "province-cities";

    staticDistrictLinkPages.forEach((item) => {
      const sourceVenues = item.source === "secondary"
        ? secondaryVenues
        : item.source === "tertiary"
          ? tertiaryVenues
          : item.source === "quaternary"
            ? quaternaryVenues
            : item.source === "quinary"
              ? quinaryVenues
              : item.source === "senary"
                ? senaryVenues
                : item.source === "septenary"
                  ? septenaryVenues
                  : item.source === "octonary"
                    ? octonaryVenues
                    : item.source === "nonary"
                      ? nonaryVenues
                    : item.source === "denary"
                      ? denaryVenues
                    : item.source === "undenary"
                      ? undenaryVenues
                    : venues;
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      chip.href = `${definition.pageBase}-city.html?tur=${encodeURIComponent(item.source)}`;
      chip.textContent = `${translateCategoryUiLabel(item.title)} (${sourceVenues.length})`;
      chip.setAttribute("aria-label", `${item.title} listesini aç`);
      chips.append(chip);
    });

    if (Array.isArray(dynamicTypeItems) && dynamicTypeItems.length > 0) {
      const dynamicRow = document.createElement("article");
      dynamicRow.className = "province-row";
      dynamicRow.style.gridTemplateColumns = "1fr";

      const dynamicChips = document.createElement("div");
      dynamicChips.className = "province-cities";

      const sortedDynamicTypeItems = [...dynamicTypeItems].sort((left, right) => {
        return String(left?.type || "").localeCompare(String(right?.type || ""), "tr");
      });

      sortedDynamicTypeItems.forEach((item) => {
        const typeLabel = String(item?.type || "").trim();
        const typeCount = Number(item?.count) || 0;
        if (!typeLabel || typeCount <= 0) {
          return;
        }

        const chip = document.createElement("a");
        chip.className = "province-pill yemek-pill yemek-pill-link";
        chip.href = `${definition.pageBase}-city.html?tur=dynamic&tt=${encodeURIComponent(typeLabel)}`;
        chip.textContent = `${translateCategoryUiLabel(typeLabel)} (${typeCount})`;
        chip.setAttribute("aria-label", `${typeLabel} için il listesini aç`);
        dynamicChips.append(chip);
      });

      if (dynamicChips.childElementCount > 0) {
        dynamicRow.append(dynamicChips);
        groupGrid.append(dynamicRow);
      }
    }

    const categoryRootAdConfig = resolveCategoryRootAdConfig();
    const categoryRootAdCard = renderCategoryRootInlineAdCard(categoryRootAdConfig);
    if (categoryRootAdCard) {
      headingStack.append(categoryRootAdCard);
    }

    const hasStaticRowContent = headingStack.childElementCount > 0 || chips.childElementCount > 0;
    if (hasStaticRowContent) {
      if (headingStack.childElementCount > 0) {
        row.append(headingStack, chips);
      } else {
        row.style.gridTemplateColumns = "1fr";
        row.append(chips);
      }
      groupGrid.append(row);
    }
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const citySet = useDistrictCatalog
    ? new Set(Object.keys(districtMap))
    : new Set(venues.map((venue) => venue.city));
  let groups = regionGroupsForCities(citySet);

  if (groups.length === 0) {
    groups = regionGroupsForCities(new Set(ALL_PROVINCES));
  }

  if (groups.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = `${definition.name} için il verisi bulunamadı.`;
    groupGrid.append(empty);
    return;
  }

  const cityVenueCounts = buildCityVenueCountMap(venues);

  groups.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = group.title;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.provinces.forEach((provinceName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      chip.href = `${definition.pageBase}-city.html?sehir=${encodeURIComponent(provinceName)}`;
      const cityCount = cityVenueCounts.get(normalizeName(provinceName)) || 0;
      chip.textContent = `${provinceName} (${cityCount})`;
      chip.setAttribute("aria-label", `${provinceName} ilinin ilçelerini aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    groupGrid.append(row);
  });
}

function renderCityPage(
  definition,
  venues,
  districtMap = null,
  navigationVenues = venues,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeVenues = [],
) {
  const cityTitle = document.querySelector("#categoryCityTitle");
  const cityBreadcrumb = document.querySelector("#categoryCityBreadcrumb");
  const districtGrid = document.querySelector("#categoryDistrictGrid");
  const { city, subcategorySource: requestedSubcategorySource, facilityType } = queryParams();

  if (!districtGrid) {
    return;
  }

  const subcategorySource = requestedSubcategorySource || "primary";
  const dynamicTypeTitle = String(facilityType || "").trim() || "Resmi Tesis Türleri";
  const filteredDynamicTypeVenues = filterDynamicTypeVenues(dynamicTypeVenues, facilityType);
  const subcategoryDefinition = (definition.districtLinkPages || []).find((item) => item.source === subcategorySource)
    || (subcategorySource === "dynamic"
      ? { title: dynamicTypeTitle }
      : null)
    || { title: definition.primaryRowTitle || "Mekanlar" };
  const citySourceVenues = definition.rootSubcategoryFirst
    ? subcategorySource === "secondary"
      ? secondaryVenues
      : subcategorySource === "tertiary"
        ? tertiaryVenues
        : subcategorySource === "quaternary"
          ? quaternaryVenues
          : subcategorySource === "quinary"
            ? quinaryVenues
            : subcategorySource === "senary"
              ? senaryVenues
                : subcategorySource === "septenary"
                  ? septenaryVenues
                : subcategorySource === "octonary"
                  ? octonaryVenues
                : subcategorySource === "nonary"
                  ? nonaryVenues
                : subcategorySource === "denary"
                  ? denaryVenues
                : subcategorySource === "undenary"
                  ? undenaryVenues
                  : subcategorySource === "dynamic"
                    ? filteredDynamicTypeVenues
                  : venues
    : venues;

  if (definition.rootSubcategoryFirst) {
    districtGrid.innerHTML = "";

    const cityNames = [...new Set(citySourceVenues.map((venue) => String(venue.city || "").trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, "tr"));

    if (cityTitle) {
      cityTitle.textContent = translateCategoryUiLabel("İller");
    }

    if (cityBreadcrumb) {
      cityBreadcrumb.textContent = translateCategoryUiLabel(subcategoryDefinition.title);
    }

    document.title = `arama bul | ${translateCategoryUiLabel(subcategoryDefinition.title)} ${translateCategoryUiLabel("İller")}`;

    if (cityNames.length === 0) {
      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "Bu kategori için il verisi bulunamadı.";
      districtGrid.append(empty);
      return;
    }

    const row = document.createElement("article");
    row.className = "province-row";

    const rowTitle = document.createElement("h4");
    rowTitle.className = "province-region";
    rowTitle.textContent = translateCategoryUiLabel("İller");

    const chips = document.createElement("div");
    chips.className = "province-cities";
    const cityVenueCounts = buildCityVenueCountMap(citySourceVenues);

    cityNames.forEach((cityName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
        ? `&tt=${encodeURIComponent(facilityType)}`
        : "";
      chip.href = `${definition.pageBase}-district.html?tur=${encodeURIComponent(subcategorySource)}&sehir=${encodeURIComponent(cityName)}${facilityTypeQuery}`;
      const cityCount = cityVenueCounts.get(normalizeName(cityName)) || 0;
      chip.textContent = `${cityName} (${cityCount})`;
      chip.setAttribute("aria-label", `${cityName} ili ${subcategoryDefinition.title.toLocaleLowerCase("tr")} ilçelerini aç`);
      chips.append(chip);
    });

    row.append(rowTitle, chips);
    districtGrid.append(row);
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const cityNames = (
    useDistrictCatalog
      ? Object.keys(districtMap).map((value) => String(value || "").trim()).filter(Boolean)
      : [...new Set(navigationVenues.map((venue) => venue.city).filter(Boolean))]
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedCity = findNameMatch(city, cityNames);

  districtGrid.innerHTML = "";

  if (!matchedCity) {
    if (cityTitle) {
      cityTitle.textContent = "İlçeler";
    }

    if (cityBreadcrumb) {
      cityBreadcrumb.textContent = "İl";
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için ilçe verisi bulunamadı.";
    districtGrid.append(empty);
    return;
  }

  const districts = resolveDistrictList(
    matchedCity,
    navigationVenues,
    districtMap || {},
    useDistrictCatalog,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (cityTitle) {
    cityTitle.textContent = `${matchedCity} İli`;
  }

  if (cityBreadcrumb) {
    cityBreadcrumb.textContent = matchedCity;
  }

  document.title = `arama bul | ${matchedCity} İli`;

  if (districts.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu il için ilçe verisi bulunamadı.";
    districtGrid.append(empty);
    return;
  }

  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = "İlçeler";

  const chips = document.createElement("div");
  chips.className = "province-cities";
  const districtVenueCounts = buildDistrictVenueCountMap(navigationVenues, matchedCity);

  districts.forEach((districtName) => {
    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = `${definition.pageBase}-district.html?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(districtName)}`;
    const districtCount = districtVenueCounts.get(normalizeName(districtName)) || 0;
    chip.textContent = `${districtName} (${districtCount})`;
    chip.setAttribute("aria-label", `${districtName} ilçesindeki mekanları aç`);
    chips.append(chip);
  });

  row.append(rowTitle, chips);
  districtGrid.append(row);
}

function renderDistrictPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeVenues = [],
  navigationVenues = venues,
) {
  const districtTitle = document.querySelector("#categoryDistrictTitle");
  const districtBreadcrumb = document.querySelector("#categoryDistrictBreadcrumb");
  const districtCityLink = document.querySelector("#categoryDistrictCityLink");
  const venueGrid = document.querySelector("#categoryVenueGrid");
  const { subcategorySource: requestedSubcategorySource, facilityType } = queryParams();
  if (!venueGrid) {
    return;
  }

  const subcategorySource = requestedSubcategorySource || "primary";
  const dynamicTypeTitle = String(facilityType || "").trim() || "Resmi Tesis Türleri";
  const filteredDynamicTypeVenues = filterDynamicTypeVenues(dynamicTypeVenues, facilityType);
  const subcategoryDefinition = (definition.districtLinkPages || []).find((item) => item.source === subcategorySource)
    || (subcategorySource === "dynamic"
      ? { title: dynamicTypeTitle }
      : null)
    || { title: definition.primaryRowTitle || "Mekanlar" };

  if (definition.rootSubcategoryFirst) {
    const sourceVenues = subcategorySource === "secondary"
      ? secondaryVenues
      : subcategorySource === "tertiary"
        ? tertiaryVenues
        : subcategorySource === "quaternary"
          ? quaternaryVenues
          : subcategorySource === "quinary"
            ? quinaryVenues
            : subcategorySource === "senary"
              ? senaryVenues
                : subcategorySource === "septenary"
                  ? septenaryVenues
                : subcategorySource === "octonary"
                  ? octonaryVenues
                : subcategorySource === "nonary"
                  ? nonaryVenues
                : subcategorySource === "denary"
                  ? denaryVenues
                : subcategorySource === "undenary"
                  ? undenaryVenues
                  : subcategorySource === "dynamic"
                    ? filteredDynamicTypeVenues
          : venues;
    const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
    const { matchedCity } = resolveDistrictMatches(
      sourceVenues,
      districtMap || {},
      useDistrictCatalog,
      sourceVenues,
      Boolean(definition.preferVenueBackedDistricts),
    );

    if (districtCityLink) {
      districtCityLink.textContent = translateCategoryUiLabel(subcategoryDefinition.title);
      const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
        ? `&tt=${encodeURIComponent(facilityType)}`
        : "";
      districtCityLink.href = `${definition.pageBase}-city.html?tur=${encodeURIComponent(subcategorySource)}${facilityTypeQuery}`;
    }

    if (districtBreadcrumb) {
      districtBreadcrumb.textContent = matchedCity || translateCategoryUiLabel("İl");
    }

    venueGrid.innerHTML = "";

    if (!matchedCity) {
      if (districtTitle) {
        districtTitle.textContent = translateCategoryUiLabel("İlçeler");
      }

      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "Bu il için ilçe verisi bulunamadı.";
      venueGrid.append(empty);
      return;
    }

    const districts = resolveDistrictList(
      matchedCity,
      sourceVenues,
      districtMap || {},
      useDistrictCatalog,
      Boolean(definition.preferVenueBackedDistricts),
    );

    if (districtTitle) {
      districtTitle.textContent = `${matchedCity} ${translateCategoryUiLabel("İli")}`;
    }

    document.title = `arama bul | ${matchedCity} ${translateCategoryUiLabel("İli")}`;

    if (districts.length === 0) {
      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "Bu il için ilçe verisi bulunamadı.";
      venueGrid.append(empty);
      return;
    }

    const row = document.createElement("article");
    row.className = "province-row";

    const rowTitle = document.createElement("h4");
    rowTitle.className = "province-region";
    rowTitle.textContent = translateCategoryUiLabel("İlçeler");

    const chips = document.createElement("div");
    chips.className = "province-cities";
    const districtVenueCounts = buildDistrictVenueCountMap(sourceVenues, matchedCity);

    const venuePagePath = String(definition.subcategoryVenuePagePath || `${definition.pageBase}-mekanlar.html`).trim();

    districts.forEach((districtName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill yemek-pill yemek-pill-link";
      const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
        ? `&tt=${encodeURIComponent(facilityType)}`
        : "";
      chip.href =
        `${venuePagePath}?tur=${encodeURIComponent(subcategorySource)}&sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(districtName)}${facilityTypeQuery}`;
      const districtCount = districtVenueCounts.get(normalizeName(districtName)) || 0;
      chip.textContent = `${districtName} (${districtCount})`;
      chip.setAttribute("aria-label", `${districtName} ilçesindeki ${subcategoryDefinition.title.toLocaleLowerCase("tr")} listesini aç`);
      chips.append(chip);
    });

    row.append(rowTitle, chips);
    venueGrid.append(row);
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const { matchedCity, matchedDistrict } = resolveDistrictMatches(
    venues,
    districtMap || {},
    useDistrictCatalog,
    navigationVenues,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (districtCityLink) {
    districtCityLink.textContent = matchedCity || "İl";
    districtCityLink.href = matchedCity
      ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
      : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
  }

  if (districtBreadcrumb) {
    districtBreadcrumb.textContent = matchedDistrict || "İlçe";
  }

  venueGrid.innerHTML = "";

  if (!matchedCity || !matchedDistrict) {
    if (districtTitle) {
      districtTitle.textContent = "İlçe Mekanları";
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const districtVenues = filterDistrictVenueSlice(definition, venues, matchedCity, matchedDistrict);
  const districtSecondaryVenues = filterDistrictVenueSlice(definition, secondaryVenues, matchedCity, matchedDistrict);
  const hospitalGroups = groupedDistrictHospitals(tertiaryVenues, matchedCity, matchedDistrict);
  const districtFamilyCenters = groupedDistrictFamilyCenters(quaternaryVenues, matchedCity, matchedDistrict);
  const districtHospitalCount = hospitalGroups.reduce((sum, group) => sum + group.venues.length, 0);
  const dutyDateLabel = resolveDutyDateLabel(districtSecondaryVenues);
  const mergedPrimaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtVenues)
    : districtVenues;
  const mergedSecondaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSecondaryVenues)
    : districtSecondaryVenues;
  const isTransitCategory = String(definition?.key || "").trim() === "seyahat";
  const isHealthCategory = String(definition?.key || "").trim() === "eczane";
  const transitGroups = isTransitCategory
    ? splitTransitVenueGroups(mergedPrimaryVenues)
    : null;

  if (districtTitle) {
    const stats = [];
    if (isTransitCategory && transitGroups) {
      if (transitGroups.fuel.length > 0) {
        stats.push(`${transitGroups.fuel.length} adet akaryakıt istasyonu`);
      }
      if (transitGroups.charge.length > 0) {
        stats.push(`${transitGroups.charge.length} adet şarj istasyonu`);
      }
      if (transitGroups.parking.length > 0) {
        stats.push(`${transitGroups.parking.length} adet otopark`);
      }
      if (transitGroups.other.length > 0) {
        stats.push(`${transitGroups.other.length} adet diğer ulaşım noktası`);
      }
    } else {
      stats.push(`${mergedPrimaryVenues.length} adet ${definition.titleUnit}`);
    }
    if (mergedSecondaryVenues.length > 0) {
      const secondaryCountLabel =
        String(definition.secondaryCountLabel || definition.secondaryRowTitle || "ek mekan").trim() || "ek mekan";
      stats.push(`${mergedSecondaryVenues.length} adet ${secondaryCountLabel}`);
    }
    if (districtHospitalCount > 0) {
      stats.push(`${districtHospitalCount} adet hastane`);
    }
    if (districtFamilyCenters.length > 0) {
      stats.push(`${districtFamilyCenters.length} adet aile sağlığı merkezi`);
    }
    districtTitle.textContent = `${matchedDistrict} İlçesi (${stats.join(", ")})`;
  }

  document.title = `arama bul | ${matchedCity} İli / ${matchedDistrict} İlçesi ${definition.name}`;

  if (
    mergedPrimaryVenues.length === 0
    && mergedSecondaryVenues.length === 0
    && districtHospitalCount === 0
    && districtFamilyCenters.length === 0
  ) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const districtInlineAdConfig = resolveDistrictInlineAdConfig();
  const districtInlineAdContext = { inserted: false };
  const districtRowRenderOptions = districtInlineAdConfig
    ? {
      adConfig: districtInlineAdConfig,
      adContext: districtInlineAdContext,
    }
    : null;

  const appendPrimaryVenues = () => {
    if (mergedPrimaryVenues.length === 0) {
      return;
    }

    if (isTransitCategory && transitGroups) {
      if (transitGroups.fuel.length > 0) {
        venueGrid.append(renderVenueRow("Akaryakıt İstasyonları", transitGroups.fuel, "", districtRowRenderOptions));
      }
      if (transitGroups.charge.length > 0) {
        venueGrid.append(renderVenueRow("Şarj İstasyonları", transitGroups.charge, "", districtRowRenderOptions));
      }
      if (transitGroups.parking.length > 0) {
        venueGrid.append(renderVenueRow("Otoparklar", transitGroups.parking, "", districtRowRenderOptions));
      }
      if (transitGroups.other.length > 0) {
        venueGrid.append(renderVenueRow("Diğer Ulaşım Noktaları", transitGroups.other, "", districtRowRenderOptions));
      }
      return;
    }

    const primaryTitle = String(definition.primaryRowTitle || "Mekanlar").trim() || "Mekanlar";
    venueGrid.append(renderVenueRow(primaryTitle, mergedPrimaryVenues, "", districtRowRenderOptions));
  };

  const appendSecondaryVenues = () => {
    if (mergedSecondaryVenues.length === 0) {
      return;
    }

    const baseSecondaryTitle = String(definition.secondaryRowTitle || "Nöbetçi Eczaneler").trim() || "Nöbetçi Eczaneler";
    venueGrid.append(renderVenueRow(baseSecondaryTitle, mergedSecondaryVenues, dutyDateLabel, districtRowRenderOptions));
  };

  const appendHealthSupportRows = () => {
    hospitalGroups.forEach((group) => {
      venueGrid.append(renderVenueRow(group.title, group.venues, "", districtRowRenderOptions));
    });

    if (districtFamilyCenters.length > 0) {
      venueGrid.append(renderVenueRow("Aile Sağlığı Merkezleri", districtFamilyCenters, "", districtRowRenderOptions));
    }
  };

  if (isHealthCategory) {
    appendHealthSupportRows();
    appendPrimaryVenues();
    appendSecondaryVenues();
    autoOpenRequestedVenue([
      ...hospitalGroups.flatMap((group) => group.venues),
      ...districtFamilyCenters,
      ...mergedPrimaryVenues,
      ...mergedSecondaryVenues,
    ]);
    return;
  }

  appendPrimaryVenues();
  appendSecondaryVenues();
  appendHealthSupportRows();
  autoOpenRequestedVenue([
    ...mergedPrimaryVenues,
    ...mergedSecondaryVenues,
    ...hospitalGroups.flatMap((group) => group.venues),
    ...districtFamilyCenters,
  ]);
}

function renderDistrictLinkPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  navigationVenues = venues,
) {
  const districtTitle = document.querySelector("#categoryDistrictTitle");
  const districtBreadcrumb = document.querySelector("#categoryDistrictBreadcrumb");
  const districtCityLink = document.querySelector("#categoryDistrictCityLink");
  const venueGrid = document.querySelector("#categoryVenueGrid");

  if (!venueGrid) {
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const { matchedCity, matchedDistrict } = resolveDistrictMatches(
    venues,
    districtMap || {},
    useDistrictCatalog,
    navigationVenues,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (districtCityLink) {
    districtCityLink.textContent = matchedCity || "İl";
    districtCityLink.href = matchedCity
      ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
      : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
  }

  if (districtBreadcrumb) {
    districtBreadcrumb.textContent = matchedDistrict || "İlçe";
  }

  venueGrid.innerHTML = "";

  if (!matchedCity || !matchedDistrict) {
    if (districtTitle) {
      districtTitle.textContent = `İlçe ${definition.name} Türleri`;
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const districtVenues = filterDistrictVenueSlice(definition, venues, matchedCity, matchedDistrict);
  const districtSecondaryVenues = filterDistrictVenueSlice(definition, secondaryVenues, matchedCity, matchedDistrict);
  const districtTertiaryVenues = filterDistrictVenueSlice(definition, tertiaryVenues, matchedCity, matchedDistrict);
  const districtQuaternaryVenues = filterDistrictVenueSlice(definition, quaternaryVenues, matchedCity, matchedDistrict);
  const districtQuinaryVenues = filterDistrictVenueSlice(definition, quinaryVenues, matchedCity, matchedDistrict);
  const districtSenaryVenues = filterDistrictVenueSlice(definition, senaryVenues, matchedCity, matchedDistrict);
  const districtSeptenaryVenues = filterDistrictVenueSlice(definition, septenaryVenues, matchedCity, matchedDistrict);
  const districtOctonaryVenues = filterDistrictVenueSlice(definition, octonaryVenues, matchedCity, matchedDistrict);
  const districtNonaryVenues = filterDistrictVenueSlice(definition, nonaryVenues, matchedCity, matchedDistrict);
  const districtDenaryVenues = filterDistrictVenueSlice(definition, denaryVenues, matchedCity, matchedDistrict);
  const districtUndenaryVenues = filterDistrictVenueSlice(definition, undenaryVenues, matchedCity, matchedDistrict);
  const preparedDistrictVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtVenues)
    : districtVenues;
  const preparedDistrictSecondaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSecondaryVenues)
    : districtSecondaryVenues;
  const preparedDistrictTertiaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtTertiaryVenues)
    : districtTertiaryVenues;
  const preparedDistrictQuaternaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtQuaternaryVenues)
    : districtQuaternaryVenues;
  const preparedDistrictQuinaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtQuinaryVenues)
    : districtQuinaryVenues;
  const preparedDistrictSenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSenaryVenues)
    : districtSenaryVenues;
  const preparedDistrictSeptenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtSeptenaryVenues)
    : districtSeptenaryVenues;
  const preparedDistrictOctonaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtOctonaryVenues)
    : districtOctonaryVenues;
  const preparedDistrictNonaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtNonaryVenues)
    : districtNonaryVenues;
  const preparedDistrictDenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtDenaryVenues)
    : districtDenaryVenues;
  const preparedDistrictUndenaryVenues = shouldMergeDisplayVenueGroups(definition)
    ? mergeVenueGroupForDisplay(districtUndenaryVenues)
    : districtUndenaryVenues;

  const linkDefinitions = Array.isArray(definition.districtLinkPages)
    ? definition.districtLinkPages
    : [];
  const groupedVenueSources = [
    { source: "primary", venues: preparedDistrictVenues },
    { source: "secondary", venues: preparedDistrictSecondaryVenues },
    { source: "tertiary", venues: preparedDistrictTertiaryVenues },
    { source: "quaternary", venues: preparedDistrictQuaternaryVenues },
    { source: "quinary", venues: preparedDistrictQuinaryVenues },
    { source: "senary", venues: preparedDistrictSenaryVenues },
    { source: "septenary", venues: preparedDistrictSeptenaryVenues },
    { source: "octonary", venues: preparedDistrictOctonaryVenues },
    { source: "nonary", venues: preparedDistrictNonaryVenues },
    { source: "denary", venues: preparedDistrictDenaryVenues },
    { source: "undenary", venues: preparedDistrictUndenaryVenues },
  ];

  const requestedVenueRedirect = redirectRequestedVenueFromDistrictLinks(
    definition,
    matchedCity,
    matchedDistrict,
    linkDefinitions.map((item) => {
      const matchedGroup = groupedVenueSources.find((group) => group.source === item.source)
        || groupedVenueSources[0];
      return {
        pagePath: item.pagePath,
        venues: matchedGroup ? matchedGroup.venues : [],
      };
    }),
  );
  if (requestedVenueRedirect) {
    return;
  }

  if (districtTitle) {
    districtTitle.textContent = `${matchedCity} İli / ${matchedDistrict} İlçesi`;
  }

  document.title = `arama bul | ${matchedCity} İli / ${matchedDistrict} İlçesi ${definition.name}`;
  const row = document.createElement("article");
  row.className = "province-row";

  const rowTitle = document.createElement("h4");
  rowTitle.className = "province-region";
  rowTitle.textContent = String(definition.districtLinkHeading || `${definition.name} Türleri`).trim() || "Türler";

  const chips = document.createElement("div");
  chips.className = "province-cities";

  linkDefinitions.forEach((item) => {
    const sourceVenues = item.source === "secondary"
      ? preparedDistrictSecondaryVenues
      : item.source === "tertiary"
        ? preparedDistrictTertiaryVenues
        : item.source === "quaternary"
          ? preparedDistrictQuaternaryVenues
        : item.source === "quinary"
          ? preparedDistrictQuinaryVenues
        : item.source === "senary"
          ? preparedDistrictSenaryVenues
        : item.source === "septenary"
          ? preparedDistrictSeptenaryVenues
        : item.source === "octonary"
          ? preparedDistrictOctonaryVenues
        : item.source === "nonary"
          ? preparedDistrictNonaryVenues
        : item.source === "denary"
          ? preparedDistrictDenaryVenues
        : item.source === "undenary"
          ? preparedDistrictUndenaryVenues
        : preparedDistrictVenues;
    if (sourceVenues.length === 0) {
      return;
    }

    const chip = document.createElement("a");
    chip.className = "province-pill yemek-pill yemek-pill-link";
    chip.href = `${item.pagePath}?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(matchedDistrict)}`;
    chip.textContent = `${item.title} (${sourceVenues.length})`;
    chip.setAttribute("aria-label", `${matchedDistrict} ilçesi ${item.title.toLocaleLowerCase("tr")} listesini aç`);
    chips.append(chip);
  });

  if (chips.children.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  row.append(rowTitle, chips);
  venueGrid.append(row);
}

function renderDistrictSubcategoryPage(
  definition,
  venues,
  districtMap = null,
  secondaryVenues = [],
  tertiaryVenues = [],
  quaternaryVenues = [],
  quinaryVenues = [],
  senaryVenues = [],
  septenaryVenues = [],
  octonaryVenues = [],
  nonaryVenues = [],
  denaryVenues = [],
  undenaryVenues = [],
  dynamicTypeVenues = [],
  navigationVenues = venues,
) {
  const body = document.body;
  const { subcategorySource: requestedSubcategorySource, facilityType } = queryParams();
  const subcategorySource = String(requestedSubcategorySource || body?.dataset?.subcategorySource || "primary").trim();
  const facilityTypeQuery = subcategorySource === "dynamic" && facilityType
    ? `&tt=${encodeURIComponent(facilityType)}`
    : "";
  const dynamicTypeTitle = String(facilityType || "").trim() || "Resmi Tesis Türleri";
  const filteredDynamicTypeVenues = filterDynamicTypeVenues(dynamicTypeVenues, facilityType);
  const subcategoryDefinition = (definition.districtLinkPages || []).find((item) => item.source === subcategorySource)
    || (subcategorySource === "dynamic"
      ? { title: dynamicTypeTitle }
      : null)
    || (subcategorySource === "secondary"
      ? { title: definition.secondaryRowTitle || "Mekanlar" }
      : { title: definition.primaryRowTitle || "Mekanlar" });
  const pageTitle = document.querySelector("#categorySubcategoryTitle");
  const cityLink = document.querySelector("#categorySubcategoryCityLink");
  const districtLink = document.querySelector("#categorySubcategoryDistrictLink");
  const breadcrumb = document.querySelector("#categorySubcategoryBreadcrumb");
  const venueGrid = document.querySelector("#categorySubcategoryVenueGrid");

  if (!venueGrid) {
    return;
  }

  const useDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const { matchedCity, matchedDistrict } = resolveDistrictMatches(
    venues,
    districtMap || {},
    useDistrictCatalog,
    navigationVenues,
    Boolean(definition.preferVenueBackedDistricts),
  );

  if (cityLink) {
    if (definition.rootSubcategoryFirst) {
      cityLink.textContent = translateCategoryUiLabel(subcategoryDefinition.title);
      cityLink.href = `${definition.pageBase}-city.html?tur=${encodeURIComponent(subcategorySource)}${facilityTypeQuery}`;
    } else {
      cityLink.textContent = matchedCity || "İl";
      cityLink.href = matchedCity
        ? `${definition.pageBase}-city.html?sehir=${encodeURIComponent(matchedCity)}`
        : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
    }
  }

  if (districtLink) {
    if (definition.rootSubcategoryFirst) {
      districtLink.textContent = matchedCity || translateCategoryUiLabel("İl");
      districtLink.href = matchedCity
        ? `${definition.pageBase}-district.html?tur=${encodeURIComponent(subcategorySource)}&sehir=${encodeURIComponent(matchedCity)}${facilityTypeQuery}`
        : `${definition.pageBase}-city.html?tur=${encodeURIComponent(subcategorySource)}${facilityTypeQuery}`;
    } else {
      districtLink.textContent = matchedDistrict || "İlçe";
      districtLink.href = matchedCity && matchedDistrict
        ? `${definition.pageBase}-district.html?sehir=${encodeURIComponent(matchedCity)}&ilce=${encodeURIComponent(matchedDistrict)}`
        : String(definition.rootPagePath || `${definition.pageBase}.html`).trim();
    }
  }

  venueGrid.innerHTML = "";

  if (!matchedCity || !matchedDistrict) {
    if (pageTitle) {
      pageTitle.textContent = "İlçe Mekanları";
    }
    if (breadcrumb) {
      breadcrumb.textContent = definition.rootSubcategoryFirst
        ? translateCategoryUiLabel("İlçe")
        : "Mekanlar";
    }

    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const normalizedCity = normalizeName(matchedCity);
  const normalizedDistrict = normalizeName(matchedDistrict);
  const sourceVenues = subcategorySource === "secondary"
    ? secondaryVenues
    : subcategorySource === "tertiary"
      ? tertiaryVenues
      : subcategorySource === "quaternary"
        ? quaternaryVenues
      : subcategorySource === "quinary"
        ? quinaryVenues
      : subcategorySource === "senary"
        ? senaryVenues
      : subcategorySource === "septenary"
        ? septenaryVenues
      : subcategorySource === "octonary"
        ? octonaryVenues
      : subcategorySource === "nonary"
        ? nonaryVenues
      : subcategorySource === "denary"
        ? denaryVenues
      : subcategorySource === "undenary"
        ? undenaryVenues
      : subcategorySource === "dynamic"
        ? filteredDynamicTypeVenues
      : venues;
  const districtVenues = dedupeByName(
    sourceVenues.filter((venue) => {
      return normalizeName(venue.city) === normalizedCity && normalizeName(venue.district) === normalizedDistrict;
    }),
  );
  if (breadcrumb) {
    breadcrumb.textContent = definition.rootSubcategoryFirst
      ? matchedDistrict
      : subcategoryDefinition.title;
  }

  if (pageTitle) {
    pageTitle.textContent = `${matchedCity} İli / ${matchedDistrict} İlçesi ${subcategoryDefinition.title}`;
  }

  document.title = `arama bul | ${matchedCity} İli / ${matchedDistrict} İlçesi ${subcategoryDefinition.title}`;

  if (districtVenues.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = "Bu ilçe için mekan verisi bulunamadı.";
    venueGrid.append(empty);
    return;
  }

  const displayDistrictVenues =
    shouldMergeDisplayVenueGroups(definition)
      ? mergeVenueGroupForDisplay(districtVenues)
      : districtVenues;
  const orderedDistrictVenues =
    definition.key === "akaryakit"
      ? sortVenuesByGoogleRating(displayDistrictVenues)
      : districtVenues;

  const districtInlineAdConfig = resolveDistrictInlineAdConfig();
  const districtInlineAdOptions = districtInlineAdConfig
    ? {
      adConfig: districtInlineAdConfig,
      adContext: { inserted: false },
    }
    : null;
  venueGrid.append(renderVenueRow(subcategoryDefinition.title, orderedDistrictVenues, "", districtInlineAdOptions));
  autoOpenRequestedVenue(orderedDistrictVenues);
}

async function initCategoryPage() {
  const body = document.body;

  if (!body) {
    return;
  }

  const categoryKey = String(body.dataset.categoryKey || "").trim();
  const pageType = String(body.dataset.categoryPage || "").trim();
  await ensureDistrictInlineAdConfigLoaded();
  const params = queryParams();
  const requestedSubcategorySource = params.subcategorySource;
  const requestedFacilityType = params.facilityType;
  const subcategorySource = String(requestedSubcategorySource || body.dataset.subcategorySource || "primary").trim();
  const baseDefinition = CATEGORY_DEFINITIONS[categoryKey];
  const definition = baseDefinition ? { key: categoryKey, ...baseDefinition } : null;

  if (!definition) {
    return;
  }

  const districtMap = definition.useDistrictCatalog ? await loadDistrictMap() : null;
  const canUseDistrictCatalog = definition.useDistrictCatalog && hasUsableDistrictCatalog(districtMap);
  const requiresVenueBackedNavigation = Boolean(definition.preferVenueBackedDistricts)
    && (pageType === "city" || pageType === "district-links");

  const loadPrimaryVenues =
    pageType === "district"
    || pageType === "city"
    || pageType === "district-links"
    || (requiresVenueBackedNavigation && Boolean(definition.dataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.dataFile))
    || (!canUseDistrictCatalog && pageType === "root")
    || (pageType === "district-subcategory" && (subcategorySource === "primary" || !canUseDistrictCatalog));

  const loadSecondaryVenues =
    (pageType === "district" && Boolean(definition.secondaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.secondaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.secondaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "secondary");

  const loadTertiaryVenues =
    (pageType === "district" && Boolean(definition.tertiaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.tertiaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.tertiaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "tertiary");

  const loadQuaternaryVenues =
    (pageType === "district" && Boolean(definition.quaternaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.quaternaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.quaternaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "quaternary");

  const loadQuinaryVenues =
    (pageType === "district" && Boolean(definition.quinaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.quinaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.quinaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "quinary");
  const loadSenaryVenues =
    (pageType === "district" && Boolean(definition.senaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.senaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.senaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "senary");
  const loadSeptenaryVenues =
    (pageType === "district" && Boolean(definition.septenaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.septenaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.septenaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "septenary");
  const loadOctonaryVenues =
    (pageType === "district" && Boolean(definition.octonaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.octonaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.octonaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "octonary");
  const loadNonaryVenues =
    (pageType === "district" && Boolean(definition.nonaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.nonaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.nonaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "nonary");
  const loadDenaryVenues =
    (pageType === "district" && Boolean(definition.denaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.denaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.denaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "denary");
  const loadUndenaryVenues =
    (pageType === "district" && Boolean(definition.undenaryDataFile))
    || (pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.undenaryDataFile))
    || (requiresVenueBackedNavigation && Boolean(definition.undenaryDataFile) && Boolean(definition.includeSecondaryInNavigation))
    || (pageType === "district-subcategory" && subcategorySource === "undenary");
  const loadDynamicTypeItems =
    pageType === "root" && Boolean(definition.rootSubcategoryFirst) && Boolean(definition.dynamicTypeDataFile);
  const loadDynamicTypeVenues =
    Boolean(definition.dynamicTypeVenueDataFile)
    && (pageType === "city" || pageType === "district" || pageType === "district-subcategory")
    && subcategorySource === "dynamic";
  const venues = loadPrimaryVenues ? await loadCategoryVenues(categoryKey) : [];
  const secondaryVenues = loadSecondaryVenues && definition.secondaryDataFile
    ? await loadCategoryDataFile(definition.secondaryDataFile)
    : [];
  const tertiaryVenues = loadTertiaryVenues && definition.tertiaryDataFile
    ? await loadCategoryDataFile(definition.tertiaryDataFile)
    : [];
  const quaternaryVenues = loadQuaternaryVenues && definition.quaternaryDataFile
    ? await loadCategoryDataFile(definition.quaternaryDataFile)
    : [];
  const quinaryVenues = loadQuinaryVenues && definition.quinaryDataFile
    ? await loadCategoryDataFile(definition.quinaryDataFile)
    : [];
  const senaryVenues = loadSenaryVenues && definition.senaryDataFile
    ? await loadCategoryDataFile(definition.senaryDataFile)
    : [];
  const septenaryVenues = loadSeptenaryVenues && definition.septenaryDataFile
    ? await loadCategoryDataFile(definition.septenaryDataFile)
    : [];
  const octonaryVenues = loadOctonaryVenues && definition.octonaryDataFile
    ? await loadCategoryDataFile(definition.octonaryDataFile)
    : [];
  const nonaryVenues = loadNonaryVenues && definition.nonaryDataFile
    ? await loadCategoryDataFile(definition.nonaryDataFile)
    : [];
  const denaryVenues = loadDenaryVenues && definition.denaryDataFile
    ? await loadCategoryDataFile(definition.denaryDataFile)
    : [];
  const undenaryVenues = loadUndenaryVenues && definition.undenaryDataFile
    ? await loadCategoryDataFile(definition.undenaryDataFile)
    : [];
  const dynamicTypeItems = loadDynamicTypeItems && definition.dynamicTypeDataFile
    ? (await loadRawArrayDataFile(definition.dynamicTypeDataFile))
      .map((item) => ({
        type: String(item?.type || "").trim(),
        count: Number(item?.count) || 0,
      }))
      .filter((item) => item.type && item.count > 0)
    : [];
  const rawDynamicTypeVenues = loadDynamicTypeVenues && definition.dynamicTypeVenueDataFile
    ? await loadCategoryDataFile(definition.dynamicTypeVenueDataFile)
    : [];
  let dynamicTypeVenues = rawDynamicTypeVenues;

  if (definition.key === "seyahat" && subcategorySource === "dynamic") {
    const mergedLegacyVenues = [];

    if (isCampingFacilityType(requestedFacilityType)) {
      const legacyCampingVenues = venues.length > 0
        ? venues
        : await loadCategoryVenues(categoryKey);
      mergedLegacyVenues.push(...legacyCampingVenues.map((venue) => mapLegacyCampingVenueToDynamicVenue(venue)));
    }

    if (isHotelFacilityType(requestedFacilityType)) {
      const legacyHotelVenueGroups = await Promise.all(
        LEGACY_SEYAHAT_HOTEL_DATA_FILES.map((path) => loadCategoryDataFile(path)),
      );
      mergedLegacyVenues.push(
        ...legacyHotelVenueGroups
          .flat()
          .map((venue) => mapLegacyHotelVenueToDynamicVenue(venue)),
      );
    }

    if (mergedLegacyVenues.length > 0) {
      dynamicTypeVenues = dedupeDynamicTypeVenues([
        ...rawDynamicTypeVenues,
        ...mergedLegacyVenues,
      ]);
    }
  }

  const navigationVenues = definition.includeSecondaryInNavigation
    ? dedupeVenues([
      ...venues,
      ...secondaryVenues,
      ...tertiaryVenues,
      ...quaternaryVenues,
      ...quinaryVenues,
      ...senaryVenues,
      ...septenaryVenues,
      ...octonaryVenues,
      ...nonaryVenues,
      ...denaryVenues,
      ...undenaryVenues,
    ])
    : venues;

  if (pageType === "root") {
    renderRootPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeItems,
    );
    return;
  }

  if (pageType === "city") {
    renderCityPage(
      definition,
      venues,
      districtMap,
      navigationVenues,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeVenues,
    );
    return;
  }

  if (pageType === "district") {
    renderDistrictPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeVenues,
      navigationVenues,
    );
    return;
  }

  if (pageType === "district-links") {
    renderDistrictLinkPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      navigationVenues,
    );
    return;
  }

  if (pageType === "district-subcategory") {
    renderDistrictSubcategoryPage(
      definition,
      venues,
      districtMap,
      secondaryVenues,
      tertiaryVenues,
      quaternaryVenues,
      quinaryVenues,
      senaryVenues,
      septenaryVenues,
      octonaryVenues,
      nonaryVenues,
      denaryVenues,
      undenaryVenues,
      dynamicTypeVenues,
      navigationVenues,
    );
  }
}

void initCategoryPage();
