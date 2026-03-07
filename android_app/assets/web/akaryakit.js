const ASSET_VERSION = "20260224-10";
const AKARYAKIT_JSON_PATH = `data/akaryakit.json?v=${ASSET_VERSION}`;

const RAW_AKARYAKIT_GROUPS = [
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
    provinces: ["Ağrı", "Ardahan", "Bingöl", "Bitlis", "Elazığ", "Erzincan", "Erzurum", "Hakkari", "Iğdır", "Kars", "Malatya", "Muş", "Tunceli", "Van"],
  },
  {
    title: "Güneydoğu Anadolu Bölgesi",
    provinces: ["Adıyaman", "Batman", "Diyarbakır", "Gaziantep", "Kilis", "Mardin", "Siirt", "Şanlıurfa", "Şırnak"],
  },
];

const akaryakitGroupGrid = document.querySelector("#categoryGroupGrid");

function normalizeAkaryakitName(value) {
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

function dedupeGroups(groups) {
  const seen = new Set();

  return groups
    .map((group) => {
      const uniqueProvinces = [];

      group.provinces.forEach((provinceName) => {
        const key = normalizeAkaryakitName(provinceName);
        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        uniqueProvinces.push(provinceName);
      });

      return {
        title: group.title,
        provinces: uniqueProvinces,
      };
    })
    .filter((group) => group.provinces.length > 0);
}

function cityUrl(provinceName) {
  return `keyif-city.html?sehir=${encodeURIComponent(provinceName)}`;
}

function renderEmptyState(messageText) {
  if (!akaryakitGroupGrid) {
    return;
  }

  akaryakitGroupGrid.innerHTML = "";
  const empty = document.createElement("article");
  empty.className = "empty-state";
  empty.textContent = messageText;
  akaryakitGroupGrid.append(empty);
}

function renderGroupGrid(citySet) {
  if (!akaryakitGroupGrid) {
    return;
  }

  akaryakitGroupGrid.innerHTML = "";
  const groups = dedupeGroups(RAW_AKARYAKIT_GROUPS);
  const hasKnownDataSet = citySet instanceof Set && citySet.size > 0;

  groups.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = group.title;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.provinces.forEach((provinceName) => {
      const hasData = !hasKnownDataSet || citySet.has(provinceName);

      if (hasData) {
        const chip = document.createElement("a");
        chip.className = "province-pill yemek-pill yemek-pill-link";
        chip.href = cityUrl(provinceName);
        chip.textContent = provinceName;
        chip.setAttribute("aria-label", `${provinceName} ilinin ilçelerini aç`);
        chips.append(chip);
        return;
      }

      const chip = document.createElement("span");
      chip.className = "province-pill yemek-pill";
      chip.textContent = `${provinceName} (yakında)`;
      chip.setAttribute("aria-label", `${provinceName} için henüz akaryakıt verisi yok`);
      chip.setAttribute("title", "Bu il için veri henüz eklenmedi");
      chip.style.opacity = "0.65";
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    akaryakitGroupGrid.append(row);
  });
}

async function loadAkaryakitCitySet() {
  const fallback = window.ARAMABUL_FALLBACK_DATA;
  if (fallback && Array.isArray(fallback.akaryakit)) {
    return new Set(
      fallback.akaryakit
        .map((item) => String(item.city || "").trim())
        .filter(Boolean),
    );
  }

  const response = await fetch(AKARYAKIT_JSON_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Akaryakıt verisi alınamadı: ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    return new Set();
  }

  return new Set(
    payload
      .map((item) => String(item.city || "").trim())
      .filter(Boolean),
  );
}

async function initAkaryakitRootPage() {
  renderGroupGrid(null);

  try {
    const citySet = await loadAkaryakitCitySet();
    renderGroupGrid(citySet);
  } catch (error) {
    console.error(error);
    renderGroupGrid(null);
  }
}

initAkaryakitRootPage();
