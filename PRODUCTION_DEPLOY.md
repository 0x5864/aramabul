# Production Deploy Rehberi

Bu rehber ile siteyi canlıya alırsın.

Canlıda artık iki servis yok.
Tek Node uygulaması hem web sayfalarını hem API'yi sunar.

## 1) Repo güncel olsun

"""bash
git push origin main
"""

## 2) Canlı PostgreSQL aç

Bir managed PostgreSQL aç.

Örnek sağlayıcılar:
- Render PostgreSQL
- Neon
- Supabase Postgres

Veritabanı açılınca `DATABASE_URL` değerini kaydet.

## 3) Render web servisini oluştur

Repo'yu Render'a bağla.

`render.yaml` dosyası otomatik ayarları taşır.

Gerekli env değerleri:
- `DATABASE_URL` (zorunlu)
- `DB_SSL=true`
- `NODE_ENV=production`
- `API_HOST=0.0.0.0`
- `API_PORT=10000`
- `CORS_ALLOWED_ORIGINS=https://senin-domainin.com`

## 4) Şema ve veri taşıma

İlk açılışta bir kere şu komutlar çalışmalı:

"""bash
npm run db:migrate
npm run db:import:venues
"""

Not: `db:import:venues` ilk seferde uzun sürebilir.

## 5) Health ve endpoint kontrolü

Canlı URL üzerinden kontrol et:

"""bash
curl https://senin-domainin.com/api/health
curl "https://senin-domainin.com/api/venues?limit=3"
curl "https://senin-domainin.com/api/districts"
"""

Beklenen durum:
- HTTP 200
- JSON yanıt

## 6) Frontend doğrulama

Tarayıcıda ana sayfayı aç:
- restoran listesi gelmeli
- şehir ve ilçe filtreleri dolmalı
- restoran detay sayfası açılmalı

## 7) Domain bağla

Kendi domainini bağla.

Örnek:
- `www.alanadiniz.com`

SSL sertifikası aktif olmalı.

## Güvenlik notu

- `PLACES_API_KEY` gibi anahtarları frontend'e koyma.
- Sadece sunucu ortam değişkeninde tut.
- `DATABASE_URL` değerini Git'e yazma.
