# PostgreSQL Kurulum Rehberi

Bu rehber, siteyi Firebase yerine PostgreSQL ile çalıştırır.

## 1) Veritabanını başlat

"""bash
docker compose -f docker-compose.postgres.yml up -d
"""

## 2) Ortam değişkenini hazırla

"""bash
cp .env.example .env
"""

`.env` içinde eski anahtarların kalabilir. Sadece `DATABASE_URL` doğru olmalı.

## 3) Paketleri yükle

"""bash
npm install
"""

## 4) Şemayı ve veriyi yükle

"""bash
npm run db:setup
"""

Bu adım, `data/venues.json` içindeki kayıtları PostgreSQL'e taşır.

## 5) Uygulamayı başlat

"""bash
npm run start
"""

Uygulama varsayılan olarak `http://127.0.0.1:8787` adresinde açılır.
Bu sunucu hem web sayfalarını hem API'yi sunar.

## 6) Siteyi aç

Tarayıcı: `http://127.0.0.1:8787`

Opsiyonel: İstersen statik dosyayı eski yöntemle de açabilirsin (`python3 -m http.server`).
Bu durumda frontend yine API için `127.0.0.1:8787` adresini dener.

## Notlar

- Sağlık kontrolü: `http://127.0.0.1:8787/api/health`
- İl ve ilçe listesi: `http://127.0.0.1:8787/api/districts`
- Restoran listesi örneği: `http://127.0.0.1:8787/api/venues?limit=100`
