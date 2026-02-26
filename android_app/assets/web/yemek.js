const RAW_YEMEK_GROUPS = [
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

const yemekGroupGrid = document.querySelector("#yemekGroupGrid");

function normalizeYemekKey(name) {
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

function dedupeYemekGroups(groups) {
  const seen = new Set();

  return groups
    .map((group) => {
      const uniqueProvinces = [];

      group.provinces.forEach((provinceName) => {
        const key = normalizeYemekKey(provinceName);

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

const YEMEK_GROUPS = dedupeYemekGroups(RAW_YEMEK_GROUPS);

function yemekCityUrl(provinceName) {
  return `yemek-city.html?sehir=${encodeURIComponent(provinceName)}`;
}

function renderYemekGroups() {
  if (!yemekGroupGrid) {
    return;
  }

  yemekGroupGrid.innerHTML = "";

  YEMEK_GROUPS.forEach((group) => {
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
      chip.href = yemekCityUrl(provinceName);
      chip.textContent = provinceName;
      chip.setAttribute("aria-label", `${provinceName} ilinin ilçelerini aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    yemekGroupGrid.append(row);
  });
}

renderYemekGroups();
