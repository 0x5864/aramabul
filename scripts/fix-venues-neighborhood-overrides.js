#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TARGETS = [
  path.resolve(__dirname, '../data/venues.json'),
  path.resolve(__dirname, '../android_app/assets/web/data/venues.json'),
];

const OVERRIDES = [
  {
    city: 'Amasya',
    district: 'Merkez',
    name: 'Ali Kaya Restaurant',
    neighborhood: 'Çakallar Mah.',
  },
  {
    city: 'Elazığ',
    district: 'Merkez',
    name: 'İbrahim Ethem İşkembe Paça Izgara Salonu',
    neighborhood: 'İcadiye Mah.',
  },
  {
    city: 'Denizli',
    district: 'Merkezefendi',
    name: 'Kontes Burger',
    neighborhood: 'Yenişafak Mah.',
  },
  {
    city: 'Gaziantep',
    district: 'Oğuzeli',
    name: 'Oğuzeli seyir terası',
    neighborhood: 'Fatih Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Arnavutköy',
    name: "McDonald's",
    currentNeighborhood: '، Arnavutköy/istanbul Mah.',
    neighborhood: 'Taşoluk Mah.',
  },
  {
    city: 'Yalova',
    district: 'Termal',
    name: 'Alaaddin Restaurant Cafe / مطعم وكافيه علاءالدين /',
    neighborhood: 'Gökçedere Mah.',
  },
  {
    city: 'Ağrı',
    district: 'Patnos',
    name: 'سفره کباب',
    neighborhood: 'Yeni Mah.',
  },
  {
    city: 'Amasya',
    district: 'Merkez',
    name: 'Çağlayan Kepap',
    neighborhood: 'Yüzevler Mah.',
  },
  {
    city: 'Denizli',
    district: 'Çameli',
    name: 'Doğa restaurant kirazliyayla',
    neighborhood: 'Kirazliyayla Mah.',
  },
  {
    city: 'Hatay',
    district: 'Altınözü',
    name: 'Karadenız Döner & Kebap Salonu',
    neighborhood: 'Yenişehir Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Gaziosmanpaşa',
    name: 'Venezia Mega Outlet',
    neighborhood: 'Karadeniz Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Küçükçekmece',
    name: 'Sultan Restaurant',
    neighborhood: 'Mehmet Akif Mah.',
  },
  {
    city: 'Rize',
    district: 'Ardeşen',
    name: 'Firtina Cafe Restaurant',
    neighborhood: 'Orta Mah.',
  },
  {
    city: 'Şanlıurfa',
    district: 'Akçakale',
    name: 'مطعم الباشا',
    neighborhood: 'Fevzi Çakmak Mah.',
  },
  {
    city: 'Tekirdağ',
    district: 'Şarköy',
    name: 'Megali Balık',
    neighborhood: 'Hoşköy Mah.',
  },
  {
    city: 'Trabzon',
    district: 'Arsin',
    name: 'Ahsen Hatay Sofrası Trabzon',
    neighborhood: 'Yeşilce Mah.',
  },
  {
    city: 'Trabzon',
    district: 'Ortahisar',
    name: 'Pi Cafe & Restaurant',
    neighborhood: 'Kemerkaya Mah.',
  },
  {
    city: 'Osmaniye',
    district: 'Kadirli',
    name: 'Kadirli Fast Döner Sipariş',
    neighborhood: 'Savrun Mah.',
  },
  {
    city: 'Trabzon',
    district: 'Çaykara',
    name: 'Çaykara Park Cafe Restaurant',
    neighborhood: 'Işıklı Mah.',
  },
  {
    city: 'Zonguldak',
    district: 'Kilimli',
    name: 'Battalbey Çiğ Köfte',
    neighborhood: 'Merkez Mah.',
  },
  {
    city: 'Adıyaman',
    district: 'Besni',
    name: 'Gel Gör Döner',
    neighborhood: '15 Temmuz Mah.',
  },
  {
    city: 'Amasya',
    district: 'Suluova',
    name: 'Suluova Yenimahalle Adıyörem Çiğköfte',
    neighborhood: 'Yeni Mahalle Mah.',
  },
  {
    city: 'Artvin',
    district: 'Borçka',
    name: 'Meroli Ev Pansiyon & Yöresel Tatlar',
    neighborhood: 'Aralık Köyü Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Çağdaş Tava Ciğer Salonu',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Garaj Lokantası',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Köfteci Aydın',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Köprü restorant',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Park Lokantasi',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Puka Et Süt Şarküteri',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Ustaeller',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'Edirne',
    district: 'Uzunköprü',
    name: 'Uzunköprü Köftecisi',
    neighborhood: 'Muradiye Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Sarıyer',
    name: 'Dolphın Balık Restaurant ( Sarıyer Balık Restaurant)',
    neighborhood: 'Yeni Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Sarıyer',
    name: 'Hacıufukdöner',
    neighborhood: 'Yeni Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Sarıyer',
    name: 'Tarihi Sarıyer Börekçisi',
    neighborhood: 'Yeni Mah.',
  },
  {
    city: 'İstanbul',
    district: 'Sarıyer',
    name: 'Tarihi Sarıyer Muhallebicisi Ve Börek',
    neighborhood: 'Yeni Mah.',
  },
  {
    city: 'İzmir',
    district: 'Çiğli',
    name: 'Babacan Yeni Nesil Çiğköfte Yeni Mahalle Şb.',
    neighborhood: 'Yeni Mahalle Mah.',
  },
  {
    city: 'Nevşehir',
    district: 'Avanos',
    name: 'Zenita Cafe Restorant',
    neighborhood: 'Yukarı Mahalle Mah.',
  },
  {
    city: 'Samsun',
    district: 'Tekkeköy',
    name: 'çalıkuşu kirazlık',
    neighborhood: 'Şabanoğlu Mah.',
  },
  {
    city: 'Şanlıurfa',
    district: 'Hilvan',
    name: 'Fıstıkxane',
    neighborhood: 'Bağlar Mah.',
  },
  {
    city: 'Van',
    district: 'Gevaş',
    name: 'Yaprak döner çorba paça metin usta Gevaş van',
    neighborhood: 'Orta Mah.',
  },
];

function fold(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9\u00c0-\u024f\u0400-\u04ff\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesOverride(record, override) {
  if (fold(record.city) !== fold(override.city)) {
    return false;
  }

  if (fold(record.district) !== fold(override.district)) {
    return false;
  }

  if (fold(record.name) !== fold(override.name)) {
    return false;
  }

  if (
    override.currentNeighborhood &&
    fold(record.neighborhood) !== fold(override.currentNeighborhood)
  ) {
    return false;
  }

  return true;
}

function applyOverrides(targetPath) {
  const records = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  let changed = 0;

  for (const record of records) {
    const override = OVERRIDES.find((candidate) => matchesOverride(record, candidate));
    if (!override || record.neighborhood === override.neighborhood) {
      continue;
    }

    record.neighborhood = override.neighborhood;
    changed += 1;
  }

  if (changed > 0) {
    fs.writeFileSync(targetPath, `${JSON.stringify(records, null, 2)}\n`);
  }

  return changed;
}

function main() {
  const targets = process.argv.slice(2);
  const resolvedTargets = targets.length > 0 ? targets.map((item) => path.resolve(item)) : DEFAULT_TARGETS;
  const results = resolvedTargets.map((targetPath) => ({
    targetPath,
    changed: applyOverrides(targetPath),
  }));

  for (const result of results) {
    console.log(`${path.relative(process.cwd(), result.targetPath)}: ${result.changed} updated`);
  }
}

main();
