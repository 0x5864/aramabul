# arama bul Android App

Bu klasör, `arama bul` için Flutter tabanlı Android uygulamadır.

Uygulama, siteyi WebView içinde açar.
Varsayılan adres:

`http://10.0.2.2:5500/index.html`

Bu adres Android emulator içinde, bilgisayarındaki local sunucuya gider.

## Çalıştırma

1. Ana proje klasöründe local server aç:

```bash
cd /Users/metintuncgenc/Documents/neredeyenir
python3 -m http.server 5500
```

2. Ayrı terminalde app'i çalıştır:

```bash
cd /Users/metintuncgenc/Documents/neredeyenir/android_app
flutter run
```

## Farklı başlangıç adresi verme

İstersen app'i başka bir URL ile açabilirsin:

```bash
cd /Users/metintuncgenc/Documents/neredeyenir/android_app
flutter run --dart-define=APP_START_URL=https://ornek-site.com
```

## Notlar

- Android manifest içinde internet izni açık.
- Local geliştirme için `cleartext traffic` açık bırakıldı.
