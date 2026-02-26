const RAW_KUAFOR_GROUPS = [
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

const kuaforGroupGrid = document.querySelector("#kuaforGroupGrid");

function normalizeKuaforKey(name) {
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

function dedupeKuaforGroups(groups) {
  const seen = new Set();

  return groups
    .map((group) => {
      const uniqueProvinces = [];

      group.provinces.forEach((provinceName) => {
        const key = normalizeKuaforKey(provinceName);

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

const KUAFOR_GROUPS = dedupeKuaforGroups(RAW_KUAFOR_GROUPS);

function kuaforCityUrl(provinceName) {
  return `kuafor-city.html?sehir=${encodeURIComponent(provinceName)}`;
}

function renderKuaforGroups() {
  if (!kuaforGroupGrid) {
    return;
  }

  kuaforGroupGrid.innerHTML = "";

  KUAFOR_GROUPS.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = group.title;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.provinces.forEach((provinceName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill kuafor-pill kuafor-pill-link";
      chip.href = kuaforCityUrl(provinceName);
      chip.textContent = provinceName;
      chip.setAttribute("aria-label", `${provinceName} il sayfasını aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    kuaforGroupGrid.append(row);
  });
}

renderKuaforGroups();
