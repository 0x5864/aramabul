const BANK_GROUPS = [
  {
    title: "Mevduat Bankaları",
    banks: [
      "AKBANK T.A.S.",
      "ALTERNATIFBANK A.S.",
      "ANADOLUBANK A.S.",
      "ARAP TURK BANKASI A.S.",
      "BANK MELLAT",
      "BANK OF CHINA TURKEY A.S.",
      "BURGAN BANK A.S.",
      "CITIBANK A.S.",
      "COLENDI BANK A.S.",
      "DENIZBANK A.S.",
      "DEUTSCHE BANK A.S.",
      "ENPARA BANK A.S.",
      "FIBABANKA A.S.",
      "FUPS BANK A.S.",
      "HSBC BANK A.S.",
      "ICBC TURKEY BANK A.S.",
      "ING BANK A.S.",
      "INTESA SANPAOLO S.P.A. ITALYA ISTANBUL MERKEZ SUBESI",
      "JP MORGAN CHASE BANK NATIONAL ASSOCIATION",
      "MUFG BANK TURKEY A.S.",
      "ODEA BANK A.S.",
      "QNB BANK A.S.",
      "RABOBANK A.S.",
      "SOCIETE GENERALE S.A.",
      "SEKERBANK T.A.S.",
      "T.C. ZIRAAT BANKASI A.S.",
      "TURKISH BANK A.S.",
      "TURKLAND BANK A.S.",
      "TURK EKONOMI BANKASI A.S.",
      "TURK TICARET BANKASI A.S.",
      "TURKIYE GARANTI BANKASI A.S.",
      "TURKIYE HALK BANKASI A.S.",
      "TURKIYE IS BANKASI A.S.",
      "TURKIYE VAKIFLAR BANKASI T.A.O.",
      "YAPI VE KREDI BANKASI A.S.",
      "ZIRAAT DINAMIK BANKA A.S.",
    ],
  },
  {
    title: "Kalkınma ve Yatırım Bankaları",
    banks: [
      "AKTIF YATIRIM BANKASI A.S.",
      "AYTEMIZ YATIRIM BANKASI A.S.",
      "BANK OF AMERICA YATIRIM BANK A.S.",
      "BANKPOZITIF KREDI VE KALKINMA BANKASI A.S.",
      "D YATIRIM BANKASI A.S.",
      "DESTEK YATIRIM BANKASI A.S.",
      "DILER YATIRIM BANKASI A.S.",
      "GOLDEN GLOBAL YATIRIM BANKASI A.S.",
      "GSD YATIRIM BANKASI A.S.",
      "HEDEF YATIRIM BANKASI A.S.",
      "ILLER BANKASI A.S.",
      "ISTANBUL TAKAS VE SAKLAMA BANKASI A.S.",
      "MISYON YATIRIM BANKASI A.S.",
      "NUROL YATIRIM BANKASI A.S.",
      "PASHA YATIRIM BANKASI A.S.",
      "Q YATIRIM BANKASI A.S.",
      "STANDARD CHARTERED YATIRIM BANKASI TURK A.S.",
      "TERA YATIRIM BANKASI A.S.",
      "TURKIYE IHRACAT KREDI BANKASI A.S.",
      "TURKIYE KALKINMA VE YATIRIM BANKASI A.S.",
      "TURKIYE SINAI KALKINMA BANKASI A.S.",
    ],
  },
  {
    title: "Katılım Bankaları",
    banks: [
      "ALBARAKA TURK KATILIM BANKASI A.S.",
      "DUNYA KATILIM BANKASI A.S.",
      "HAYAT FINANS KATILIM BANKASI A.S.",
      "KUVEYT TURK KATILIM BANKASI A.S.",
      "T.O.M. KATILIM BANKASI A.S.",
      "TURKIYE EMLAK KATILIM BANKASI A.S.",
      "TURKIYE FINANS KATILIM BANKASI A.S.",
      "VAKIF KATILIM BANKASI A.S.",
      "ZIRAAT KATILIM BANKASI A.S.",
    ],
  },
  {
    title: "TMSF Bünyesindeki Bankalar",
    banks: ["BIRLESIK FON BANKASI A.S."],
  },
];

const BANK_WEBSITES = {
  "AKBANK T.A.S.": "http://www.akbank.com",
  "ALTERNATIFBANK A.S.": "https://www.alternatifbank.com.tr",
  "ANADOLUBANK A.S.": "http://www.anadolubank.com.tr",
  "ARAP TURK BANKASI A.S.": "http://www.atbank.com.tr",
  "BANK MELLAT": "http://www.mellatbank.com",
  "BANK OF CHINA TURKEY A.S.": "http://www.bankofchina.com.tr/",
  "BURGAN BANK A.S.": "http://www.burgan.com.tr",
  "CITIBANK A.S.": "http://www.citibank.com.tr",
  "COLENDI BANK A.S.": "https://www.colendibank.com/",
  "DENIZBANK A.S.": "http://www.denizbank.com",
  "DEUTSCHE BANK A.S.": "http://www.deutschebank.com.tr",
  "ENPARA BANK A.S.": "https://www.enpara.com/",
  "FIBABANKA A.S.": "http://www.fibabanka.com.tr/",
  "FUPS BANK A.S.": "http://www.fupsbank.com",
  "HSBC BANK A.S.": "http://www.hsbc.com.tr",
  "ICBC TURKEY BANK A.S.": "https://www.icbc.com.tr/tr/",
  "ING BANK A.S.": "http://www.ingbank.com.tr",
  "INTESA SANPAOLO S.P.A. ITALYA ISTANBUL MERKEZ SUBESI": "http://www.intesasanpaolo.com",
  "JP MORGAN CHASE BANK NATIONAL ASSOCIATION": "http://www.jpmorganchase.com",
  "MUFG BANK TURKEY A.S.": "http://www.tu.bk.mufg.jp/",
  "ODEA BANK A.S.": "http://www.odeabank.com.tr",
  "QNB BANK A.S.": "https://www.qnb.com.tr/",
  "RABOBANK A.S.": "http://www.rabobank.com.tr/",
  "SOCIETE GENERALE S.A.": "http://www.societegenerale.com.tr",
  "SEKERBANK T.A.S.": "http://www.sekerbank.com.tr",
  "T.C. ZIRAAT BANKASI A.S.": "http://www.ziraat.com.tr/",
  "TURKISH BANK A.S.": "http://www.turkishbank.com",
  "TURKLAND BANK A.S.": "http://www.turklandbank.com",
  "TURK EKONOMI BANKASI A.S.": "http://www.teb.com.tr",
  "TURK TICARET BANKASI A.S.": "https://www.turkticaretbankasi.com.tr",
  "TURKIYE GARANTI BANKASI A.S.": "https://www.garantibbva.com.tr",
  "TURKIYE HALK BANKASI A.S.": "http://www.halkbank.com.tr/",
  "TURKIYE IS BANKASI A.S.": "http://www.isbank.com.tr",
  "TURKIYE VAKIFLAR BANKASI T.A.O.": "http://www.vakifbank.com.tr",
  "YAPI VE KREDI BANKASI A.S.": "https://www.yapikredi.com.tr",
  "ZIRAAT DINAMIK BANKA A.S.": "https://www.ziraatdinamik.com.tr",
  "AKTIF YATIRIM BANKASI A.S.": "http://www.aktifbank.com.tr/",
  "AYTEMIZ YATIRIM BANKASI A.S.": "https://www.aytemizbank.com.tr",
  "BANK OF AMERICA YATIRIM BANK A.S.": "http://www.ml.com.tr",
  "BANKPOZITIF KREDI VE KALKINMA BANKASI A.S.": "http://www.bankpozitif.com.tr/",
  "D YATIRIM BANKASI A.S.": "https://www.dybank.com.tr",
  "DESTEK YATIRIM BANKASI A.S.": "https://www.destekbank.com",
  "DILER YATIRIM BANKASI A.S.": "http://www.dilerbank.com.tr/",
  "GOLDEN GLOBAL YATIRIM BANKASI A.S.": "https://goldenglobalbank.com.tr",
  "GSD YATIRIM BANKASI A.S.": "http://www.gsdbank.com.tr",
  "HEDEF YATIRIM BANKASI A.S.": "https://www.hedefyatirimbankasi.com.tr",
  "ILLER BANKASI A.S.": "http://www.ilbank.gov.tr",
  "ISTANBUL TAKAS VE SAKLAMA BANKASI A.S.": "http://www.takasbank.com.tr",
  "MISYON YATIRIM BANKASI A.S.": "https://www.misyon.com/",
  "NUROL YATIRIM BANKASI A.S.": "http://www.nurolbank.com.tr",
  "PASHA YATIRIM BANKASI A.S.": "https://www.pashabank.com.tr/",
  "Q YATIRIM BANKASI A.S.": "https://www.qyatirimbankasi.com.tr",
  "STANDARD CHARTERED YATIRIM BANKASI TURK A.S.": "http://www.standardchartered.com.tr",
  "TERA YATIRIM BANKASI A.S.": "https://www.terabank.com.tr",
  "TURKIYE IHRACAT KREDI BANKASI A.S.": "http://www.eximbank.gov.tr",
  "TURKIYE KALKINMA VE YATIRIM BANKASI A.S.": "http://www.kalkinma.com.tr",
  "TURKIYE SINAI KALKINMA BANKASI A.S.": "http://www.tskb.com.tr",
  "ALBARAKA TURK KATILIM BANKASI A.S.": "http://www.albarakaturk.com.tr",
  "DUNYA KATILIM BANKASI A.S.": "https://www.dunyakatilim.com.tr",
  "HAYAT FINANS KATILIM BANKASI A.S.": "https://www.hayatfinans.com.tr",
  "KUVEYT TURK KATILIM BANKASI A.S.": "http://www.kuveytturk.com.tr",
  "T.O.M. KATILIM BANKASI A.S.": "https://www.tombank.com.tr/",
  "TURKIYE EMLAK KATILIM BANKASI A.S.": "http://www.emlakbank.com.tr/",
  "TURKIYE FINANS KATILIM BANKASI A.S.": "http://www.turkiyefinans.com.tr",
  "VAKIF KATILIM BANKASI A.S.": "http://www.vakifkatilim.com.tr",
  "ZIRAAT KATILIM BANKASI A.S.": "http://www.ziraatkatilim.com.tr",
  "BIRLESIK FON BANKASI A.S.": "http://www.fonbank.com.tr",
};

const bankGroupGrid = document.querySelector("#bankGroupGrid");

function formatBankDisplayName(bankName) {
  return String(bankName || "")
    .replaceAll("A.S.", "A.Ş.")
    .replaceAll("T.A.S.", "T.A.Ş.")
    .replaceAll("TURKIYE", "TÜRKİYE")
    .replaceAll("TURK ", "TÜRK ")
    .replaceAll("T.C.", "T.C.")
    .replaceAll("ISTANBUL", "İSTANBUL")
    .replaceAll("ILLER", "İLLER")
    .replaceAll("IHRACAT", "İHRACAT")
    .replaceAll("SINAI", "SINAİ")
    .replaceAll("IS BANKASI", "İŞ BANKASI")
    .replaceAll("EKONOMI", "EKONOMİ")
    .replaceAll("TICARET", "TİCARET")
    .replaceAll("DINAMIK", "DİNAMİK")
    .replaceAll("SUBESI", "ŞUBESİ")
    .replaceAll("BIRLESIK", "BİRLEŞİK");
}

function renderBankGroups() {
  if (!bankGroupGrid) {
    return;
  }

  bankGroupGrid.innerHTML = "";

  BANK_GROUPS.forEach((group) => {
    const row = document.createElement("article");
    row.className = "province-row";

    const groupTitle = document.createElement("h4");
    groupTitle.className = "province-region";
    groupTitle.textContent = `${group.title} (${group.banks.length})`;

    const chips = document.createElement("div");
    chips.className = "province-cities";

    group.banks.forEach((bankName) => {
      const chip = document.createElement("a");
      chip.className = "province-pill bank-pill bank-pill-link";
      chip.href = BANK_WEBSITES[bankName] || "#";
      chip.target = "_self";
      chip.rel = "noopener noreferrer";
      chip.textContent = formatBankDisplayName(bankName);
      chip.setAttribute("aria-label", `${formatBankDisplayName(bankName)} web sitesini yeni sekmede aç`);
      chips.append(chip);
    });

    row.append(groupTitle, chips);
    bankGroupGrid.append(row);
  });
}

renderBankGroups();
