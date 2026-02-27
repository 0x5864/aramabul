const RAW_HOSPITAL_GROUPS = [
  {
    title: "Şehir Hastaneleri",
    hospitals: [
      "Adana Şehir Eğitim ve Araştırma Hastanesi",
      "Ankara Bilkent Şehir Hastanesi",
      "Ankara Etlik Şehir Hastanesi",
      "Antalya Şehir Hastanesi",
      "Balıkesir Atatürk Şehir Hastanesi",
      "Başakşehir Çam ve Sakura Şehir Hastanesi",
      "Bursa Şehir Hastanesi",
      "Elazığ Fethi Sekin Şehir Hastanesi",
      "Eskişehir Şehir Hastanesi",
      "Gaziantep Şehir Hastanesi",
      "Isparta Şehir Hastanesi",
      "İzmir Bayraklı Şehir Hastanesi",
      "Kahramanmaraş Şehir Hastanesi",
      "Kayseri Şehir Hastanesi",
      "Kocaeli Şehir Hastanesi",
      "Konya Karatay Şehir Hastanesi",
      "Kütahya Şehir Hastanesi",
      "Manisa Şehir Hastanesi",
      "Mersin Şehir Hastanesi",
      "Tekirdağ Dr. İsmail Fehmi Cumalıoğlu Şehir Hastanesi",
      "Yozgat Şehir Hastanesi",
    ],
  },
  {
    title: "Eğitim ve Araştırma Hastaneleri",
    hospitals: [
      "Ankara Atatürk Sanatoryum Eğitim ve Araştırma Hastanesi",
      "Ankara Dışkapı Yıldırım Beyazıt Eğitim ve Araştırma Hastanesi",
      "Ankara Eğitim ve Araştırma Hastanesi",
      "Ankara Gülhane Eğitim ve Araştırma Hastanesi",
      "Ankara Keçiören Eğitim ve Araştırma Hastanesi",
      "Ankara Numune Eğitim ve Araştırma Hastanesi",
      "Ankara Onkoloji Eğitim ve Araştırma Hastanesi",
      "Ankara Şehir Hastanesi Kalp Damar Hastanesi",
      "Bursa Yüksek İhtisas Eğitim ve Araştırma Hastanesi",
      "Dr. Lütfi Kırdar Kartal Eğitim ve Araştırma Hastanesi",
      "Erenköy Ruh ve Sinir Hastalıkları Eğitim ve Araştırma Hastanesi",
      "Haseki Eğitim ve Araştırma Hastanesi",
      "İstanbul Eğitim ve Araştırma Hastanesi",
      "İzmir Atatürk Eğitim ve Araştırma Hastanesi",
      "İzmir Tepecik Eğitim ve Araştırma Hastanesi",
      "Kanuni Sultan Süleyman Eğitim ve Araştırma Hastanesi",
      "Samsun Eğitim ve Araştırma Hastanesi",
      "Şişli Hamidiye Etfal Eğitim ve Araştırma Hastanesi",
      "Trabzon Kanuni Eğitim ve Araştırma Hastanesi",
      "Ümraniye Eğitim ve Araştırma Hastanesi",
      "Yedikule Göğüs Hastalıkları ve Göğüs Cerrahisi Eğitim ve Araştırma Hastanesi",
    ],
  },
  {
    title: "Üniversite Hastaneleri",
    hospitals: [
      "Akdeniz Üniversitesi Hastanesi",
      "Ankara Üniversitesi İbn-i Sina Hastanesi",
      "Atatürk Üniversitesi Araştırma Hastanesi",
      "Çukurova Üniversitesi Balcalı Hastanesi",
      "Dokuz Eylül Üniversitesi Hastanesi",
      "Ege Üniversitesi Hastanesi",
      "Erciyes Üniversitesi Tıp Fakültesi Hastanesi",
      "Eskişehir Osmangazi Üniversitesi Hastanesi",
      "Gazi Üniversitesi Hastanesi",
      "Hacettepe Üniversitesi Erişkin Hastanesi",
      "Hacettepe Üniversitesi İhsan Doğramacı Çocuk Hastanesi",
      "İnönü Üniversitesi Turgut Özal Tıp Merkezi",
      "İstanbul Üniversitesi İstanbul Tıp Fakültesi Hastanesi",
      "İstanbul Üniversitesi Cerrahpaşa Tıp Fakültesi Hastanesi",
      "Kocaeli Üniversitesi Hastanesi",
      "Marmara Üniversitesi Pendik Eğitim ve Araştırma Hastanesi",
      "Ondokuz Mayıs Üniversitesi Hastanesi",
      "Selçuk Üniversitesi Tıp Fakültesi Hastanesi",
      "Trakya Üniversitesi Hastanesi",
      "Uludağ Üniversitesi Tıp Fakültesi Hastanesi",
    ],
  },
  {
    title: "Özel Hastane Grupları",
    hospitals: [
      "Acıbadem Hastaneleri",
      "Memorial Hastaneleri",
      "Medical Park Hastaneleri",
      "Liv Hospital",
      "Medipol Hastaneleri",
      "Florence Nightingale Hastaneleri",
      "Medicana Sağlık Grubu",
      "VM Medical Park",
      "Biruni Hastanesi",
      "Kolan Hospital Group",
      "Özel Erdem Hastanesi",
      "Ethica Hastaneleri",
      "Bayındır Sağlık Grubu",
      "Dünyagöz Hastaneleri",
      "Batıgöz Sağlık Grubu",
      "Hisar Hospital Intercontinental",
      "Atlas Üniversitesi Medicine Hospital",
      "BHT Clinic İstanbul Tema Hastanesi",
      "Özel Avrasya Hastanesi",
      "Lokman Hekim Hastaneleri",
      "Koru Hastanesi",
      "Özel Amerikan Hastanesi",
      "Özel Alman Hastanesi",
      "Özel Fransız Lape Hastanesi",
    ],
  },
  {
    title: "Özel Dal Hastaneleri ve Merkezler",
    hospitals: [
      "Türkiye Gazetesi Hastanesi",
      "Özel Gaziosmanpaşa Hastanesi",
      "Özel Ortadoğu Hastanesi",
      "Özel Medline Adana Hastanesi",
      "Özel Mersin Ortadoğu Hastanesi",
      "Özel İmperial Hastanesi",
      "Özel Karataş Hastanesi",
      "Özel Göztepe Hastanesi",
      "Özel Kızılay Hastanesi",
      "Özel Ekol Hastanesi",
      "Özel Pendik Bölge Hastanesi",
      "Özel Kaşkaloğlu Göz Hastanesi",
      "Özel Veni Vidi Göz Hastanesi",
      "Özel Dünyam Hastanesi",
      "Özel Koru Ankara Hastanesi",
      "Özel Medstar Antalya Hastanesi",
      "Özel Ankara Güven Hastanesi",
      "Özel Ankara Bayındır Hastanesi",
      "Özel İstanbul Cerrahi Hastanesi",
      "Özel Başkent Hastanesi Konya",
    ],
  },
];

const HOSPITAL_WEBSITES = {
  "Adana Şehir Eğitim ve Araştırma Hastanesi": "https://adanasehir.saglik.gov.tr/",
  "Ankara Bilkent Şehir Hastanesi": "https://ankarasehir.saglik.gov.tr/",
  "Ankara Etlik Şehir Hastanesi": "https://etliksehir.saglik.gov.tr/",
  "Antalya Şehir Hastanesi": "https://antalyasehir.saglik.gov.tr/",
  "Balıkesir Atatürk Şehir Hastanesi": "https://balikesirataturksehir.saglik.gov.tr/",
  "Başakşehir Çam ve Sakura Şehir Hastanesi": "https://camsakurasehir.saglik.gov.tr/",
  "Bursa Şehir Hastanesi": "https://bursasehir.saglik.gov.tr/",
  "Elazığ Fethi Sekin Şehir Hastanesi": "https://elazigsehir.saglik.gov.tr/",
  "Eskişehir Şehir Hastanesi": "https://eskisehirsehir.saglik.gov.tr/",
  "Gaziantep Şehir Hastanesi": "https://gaziantepsehir.saglik.gov.tr/",
  "Isparta Şehir Hastanesi": "https://ispartasehir.saglik.gov.tr/",
  "İzmir Bayraklı Şehir Hastanesi": "https://izmirsehir.saglik.gov.tr/",
  "Kahramanmaraş Şehir Hastanesi": "https://necipfazildh.saglik.gov.tr/",
  "Kayseri Şehir Hastanesi": "https://kayserisehir.saglik.gov.tr/",
  "Kocaeli Şehir Hastanesi": "https://kocaelisehir.saglik.gov.tr/",
  "Konya Karatay Şehir Hastanesi": "https://konyasehir.saglik.gov.tr/",
  "Kütahya Şehir Hastanesi": "https://kutahyasehir.saglik.gov.tr/",
  "Manisa Şehir Hastanesi": "https://manisasehir.saglik.gov.tr/",
  "Mersin Şehir Hastanesi": "https://mersinsehir.saglik.gov.tr/",
  "Tekirdağ Dr. İsmail Fehmi Cumalıoğlu Şehir Hastanesi": "https://tekirdagsehir.saglik.gov.tr/",
  "Yozgat Şehir Hastanesi": "https://yozgatsehir.saglik.gov.tr/",
  "Ankara Şehir Hastanesi Kalp Damar Hastanesi": "https://ankarasehir.saglik.gov.tr/",
  "Ankara Atatürk Sanatoryum Eğitim ve Araştırma Hastanesi": "https://sanatoryumdh.saglik.gov.tr/",
  "Ankara Dışkapı Yıldırım Beyazıt Eğitim ve Araştırma Hastanesi": "https://diskapieah.saglik.gov.tr/",
  "Ankara Eğitim ve Araştırma Hastanesi": "https://ankaraeah.saglik.gov.tr/",
  "Ankara Gülhane Eğitim ve Araştırma Hastanesi": "https://gulhaneeah.saglik.gov.tr/",
  "Ankara Keçiören Eğitim ve Araştırma Hastanesi": "https://akeah.saglik.gov.tr/",
  "Ankara Numune Eğitim ve Araştırma Hastanesi": "https://numuneeah.saglik.gov.tr/",
  "Ankara Onkoloji Eğitim ve Araştırma Hastanesi": "https://ankaraonkolojieah.saglik.gov.tr/",
  "Bursa Yüksek İhtisas Eğitim ve Araştırma Hastanesi": "https://bursayuksekihtisaseah.saglik.gov.tr/",
  "Dr. Lütfi Kırdar Kartal Eğitim ve Araştırma Hastanesi": "https://lutfikirdareah.saglik.gov.tr/",
  "Erenköy Ruh ve Sinir Hastalıkları Eğitim ve Araştırma Hastanesi": "https://erenkoyruhsinireah.saglik.gov.tr/",
  "Haseki Eğitim ve Araştırma Hastanesi": "https://hasekieah.saglik.gov.tr/",
  "İstanbul Eğitim ve Araştırma Hastanesi": "https://istanbuleah.saglik.gov.tr/",
  "İzmir Atatürk Eğitim ve Araştırma Hastanesi": "https://izmirataturkeah.saglik.gov.tr/",
  "İzmir Tepecik Eğitim ve Araştırma Hastanesi": "https://tepecikeah.saglik.gov.tr/",
  "Kanuni Sultan Süleyman Eğitim ve Araştırma Hastanesi": "https://kanunieah.saglik.gov.tr/",
  "Samsun Eğitim ve Araştırma Hastanesi": "https://samsunsehir.saglik.gov.tr/",
  "Şişli Hamidiye Etfal Eğitim ve Araştırma Hastanesi": "https://sislietfaleah.saglik.gov.tr/",
  "Trabzon Kanuni Eğitim ve Araştırma Hastanesi": "https://trabzonkanunieah.saglik.gov.tr/",
  "Ümraniye Eğitim ve Araştırma Hastanesi": "https://umraniyeah.saglik.gov.tr/",
  "Yedikule Göğüs Hastalıkları ve Göğüs Cerrahisi Eğitim ve Araştırma Hastanesi": "https://yedikulegoguseah.saglik.gov.tr/",
  "Akdeniz Üniversitesi Hastanesi": "https://hastane.akdeniz.edu.tr/",
  "Ankara Üniversitesi İbn-i Sina Hastanesi": "https://hastane.ankara.edu.tr/",
  "Atatürk Üniversitesi Araştırma Hastanesi": "https://atauni.edu.tr/tr/saglik/arastirma-hastanesi",
  "Çukurova Üniversitesi Balcalı Hastanesi": "https://balcali.cu.edu.tr/",
  "Dokuz Eylül Üniversitesi Hastanesi": "https://hastane.deu.edu.tr/",
  "Ege Üniversitesi Hastanesi": "https://hastane.ege.edu.tr/",
  "Erciyes Üniversitesi Tıp Fakültesi Hastanesi": "https://hastaneler.erciyes.edu.tr/",
  "Eskişehir Osmangazi Üniversitesi Hastanesi": "https://hastane.ogu.edu.tr/",
  "Gazi Üniversitesi Hastanesi": "https://hastane.gazi.edu.tr/",
  "Hacettepe Üniversitesi Erişkin Hastanesi": "https://hastane.hacettepe.edu.tr/",
  "Hacettepe Üniversitesi İhsan Doğramacı Çocuk Hastanesi": "https://hastane.hacettepe.edu.tr/",
  "İnönü Üniversitesi Turgut Özal Tıp Merkezi": "https://totm.inonu.edu.tr/",
  "İstanbul Üniversitesi İstanbul Tıp Fakültesi Hastanesi": "https://istanbultip.istanbul.edu.tr/",
  "İstanbul Üniversitesi Cerrahpaşa Tıp Fakültesi Hastanesi": "https://ctf.istanbul.edu.tr/",
  "Kocaeli Üniversitesi Hastanesi": "https://hastane.kocaeli.edu.tr/",
  "Marmara Üniversitesi Pendik Eğitim ve Araştırma Hastanesi": "https://marmaraeah.saglik.gov.tr/",
  "Ondokuz Mayıs Üniversitesi Hastanesi": "https://hastane.omu.edu.tr/",
  "Selçuk Üniversitesi Tıp Fakültesi Hastanesi": "https://hastane.selcuk.edu.tr/",
  "Trakya Üniversitesi Hastanesi": "https://tuh.trakya.edu.tr/",
  "Uludağ Üniversitesi Tıp Fakültesi Hastanesi": "https://hastane.uludag.edu.tr/",
  "Acıbadem Hastaneleri": "https://www.acibadem.com.tr",
  "Memorial Hastaneleri": "https://www.memorial.com.tr",
  "Medical Park Hastaneleri": "https://www.medicalpark.com.tr",
  "Liv Hospital": "https://www.livhospital.com",
  "Medipol Hastaneleri": "https://www.medipol.com.tr",
  "Florence Nightingale Hastaneleri": "https://www.florence.com.tr",
  "Medicana Sağlık Grubu": "https://www.medicana.com.tr",
  "VM Medical Park": "https://www.medicalpark.com.tr",
  "Biruni Hastanesi": "https://www.birunihastanesi.com",
  "Kolan Hospital Group": "https://www.kolanhospital.com.tr",
  "Özel Erdem Hastanesi": "https://www.erdemhastahanesi.com.tr",
  "Ethica Hastaneleri": "https://www.ethicahospital.com",
  "Bayındır Sağlık Grubu": "https://www.bayindirhastanesi.com.tr",
  "Dünyagöz Hastaneleri": "https://www.dunyagoz.com",
  "Batıgöz Sağlık Grubu": "https://www.batigoz.com",
  "Hisar Hospital Intercontinental": "https://www.hisarhospital.com",
  "BHT Clinic İstanbul Tema Hastanesi": "https://www.bhtclinic.com.tr",
  "Lokman Hekim Hastaneleri": "https://www.lokmanhekim.com.tr",
  "Koru Hastanesi": "https://www.koruhastanesi.com",
  "Özel Amerikan Hastanesi": "https://www.amerikanhastanesi.org",
  "Özel Alman Hastanesi": "https://www.almanhastanesi.com.tr",
  "Özel Fransız Lape Hastanesi": "https://www.lapehastanesi.com",
  "Özel Gaziosmanpaşa Hastanesi": "https://www.gophastanesi.com.tr",
  "Özel Ortadoğu Hastanesi": "https://www.ortadoguhastaneleri.com.tr/",
  "Özel Medline Adana Hastanesi": "https://www.medlineadana.com.tr",
  "Özel Mersin Ortadoğu Hastanesi": "https://www.ortadoguhastanesi.com.tr",
  "Özel İmperial Hastanesi": "https://www.imperialhastanesi.com/",
  "Özel Karataş Hastanesi": "https://www.karatashastanesi.com/",
  "Özel Göztepe Hastanesi": "https://aksugoztepehastanesi.com.tr/",
  "Özel Kızılay Hastanesi": "https://www.kizilaysaglik.com.tr/",
  "Özel Ekol Hastanesi": "https://www.ekolhastanesi.com.tr/",
  "Özel Pendik Bölge Hastanesi": "https://www.bolgehastanesi.com/",
  "Özel Kaşkaloğlu Göz Hastanesi": "https://www.kaskaloglu.com",
  "Özel Veni Vidi Göz Hastanesi": "https://www.venividigoz.com",
  "Özel Dünyam Hastanesi": "https://www.dunyamhastanesi.com/",
  "Özel Koru Ankara Hastanesi": "https://www.koruhastanesi.com/",
  "Özel Medstar Antalya Hastanesi": "https://www.medstar.com.tr/",
  "Özel Ankara Güven Hastanesi": "https://www.guven.com.tr",
  "Özel Ankara Bayındır Hastanesi": "https://www.bayindirhastanesi.com.tr",
  "Özel İstanbul Cerrahi Hastanesi": "https://www.istanbulcerrahi.com.tr/",
  "Özel Başkent Hastanesi Konya": "https://konya.baskenthastaneleri.com/",
  "Türkiye Gazetesi Hastanesi": "https://www.turkiyegazetesihastanesi.com.tr",
};

const hospitalGroupGrid = document.querySelector("#hospitalGroupGrid");

function normalizeHospitalKey(name) {
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

function dedupeHospitalGroups(groups) {
  const seen = new Set();

  return groups
    .map((group) => {
      const uniqueHospitals = [];

      group.hospitals.forEach((hospitalName) => {
        const key = normalizeHospitalKey(hospitalName);

        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        uniqueHospitals.push(hospitalName);
      });

      return {
        title: group.title,
        hospitals: uniqueHospitals,
      };
    })
    .filter((group) => group.hospitals.length > 0);
}

const HOSPITAL_GROUPS = dedupeHospitalGroups(RAW_HOSPITAL_GROUPS);

function hospitalWebsiteUrl(hospitalName) {
  const directUrl = HOSPITAL_WEBSITES[hospitalName];

  if (directUrl) {
    return directUrl;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${hospitalName} resmi web sitesi`)}`;
}

function renderHospitalGroups() {
  if (!hospitalGroupGrid) {
    return;
  }

  hospitalGroupGrid.innerHTML = "";

  HOSPITAL_GROUPS.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = `${group.title} (${group.hospitals.length})`;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.hospitals.forEach((hospitalName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill hospital-pill hospital-pill-link";
      chip.href = hospitalWebsiteUrl(hospitalName);
      chip.target = "_self";
      chip.rel = "noopener noreferrer";
      chip.textContent = hospitalName;
      chip.setAttribute("aria-label", `${hospitalName} web sitesini yeni sekmede aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    hospitalGroupGrid.append(row);
  });
}

renderHospitalGroups();
