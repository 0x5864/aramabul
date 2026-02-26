# arama bul Android App

Bu klasör, `arama bul` için Flutter tabanlı Android uygulamadır.

Uygulama, siteyi WebView içinde açar.
Varsayılan olarak web dosyaları app içine gömülü gelir:

`assets/web/index.html`

Bu yüzden app sunucu olmadan da açılır.

## Çalıştırma

1. App'i çalıştır:

```bash
cd /Users/metintuncgenc/Documents/neredeyenir/android_app
flutter run
```

## Farklı başlangıç adresi verme

İstersen app'i bir URL ile başlatabilirsin:

```bash
cd /Users/metintuncgenc/Documents/neredeyenir/android_app
flutter run --dart-define=APP_START_URL=https://ornek-site.com
```

## Notlar

- Android manifest içinde internet izni açık.
- İstersen local HTTP test için `cleartext traffic` açık bırakıldı.

## Web dosyalarını yeniden paketleme

Ana web dosyalarında değişiklik yaptıysan app içine tekrar kopyala:

```bash
cd /Users/metintuncgenc/Documents/neredeyenir/android_app
./scripts/sync_web_assets.sh
```
