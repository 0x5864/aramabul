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

## 5) API'yi başlat

"""bash
npm run api
"""

API varsayılan olarak `http://127.0.0.1:8787` adresinde açılır.

## 6) Siteyi aç

Statik siteyi eskisi gibi açabilirsin.

"""bash
cd /Users/metintuncgenc/Documents/neredeyenir
python3 -m http.server 5500 --bind 127.0.0.1
"""

Tarayıcı: `http://127.0.0.1:5500`

Frontend, yerelde otomatik olarak `http://127.0.0.1:8787/api` endpointlerini dener.
API çalışmazsa eski `data/*.json` dosyalarına geri düşer.

## Notlar

- API sağlık kontrolü: `http://127.0.0.1:8787/api/health`
- İl ve ilçe listesi: `http://127.0.0.1:8787/api/districts`
- Restoran listesi örneği: `http://127.0.0.1:8787/api/venues?limit=100`

