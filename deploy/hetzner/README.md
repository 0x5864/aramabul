# Hetzner CPX22 Quick Start

This is the fastest safe setup for this project on a Hetzner VPS.

## Server choice

- Plan: `CPX22`
- OS: `Ubuntu 24.04`
- App stack: `Nginx + Node.js + PM2 + PostgreSQL`

## 1. Create the server

- Create a new Hetzner server.
- Add your SSH key.
- Point your domain to the server IP.

## 2. Create the app user

```bash
adduser --disabled-password --gecos "" aramabul
mkdir -p /var/www
chown -R aramabul:aramabul /var/www
```

## 3. Put the app in place

```bash
apt-get update && apt-get install -y git
cd /var/www
sudo -u aramabul -H git clone YOUR_REPO_URL /var/www/aramabul
```

## 4. Run the base setup

SSH into the server as `root` and run:

```bash
cd /var/www/aramabul
chmod +x deploy/hetzner/first-boot.sh
./deploy/hetzner/first-boot.sh
```

Then install app packages:

```bash
sudo -u aramabul -H bash -lc "cd /var/www/aramabul && npm ci --omit=dev"
```

## 5. Create the production .env

- Copy `deploy/hetzner/.env.production.example` to `.env`
- Fill the real database password
- Fill the real domain in `CORS_ALLOWED_ORIGINS`

## 6. Create PostgreSQL database

```bash
sudo -u postgres psql
```

Inside PostgreSQL:

```sql
CREATE USER aramabul WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE aramabul OWNER aramabul;
\q
```

Then run:

```bash
npm run db:migrate
```

If needed, import venue data:

```bash
npm run db:import:venues
```

## 7. Start the app with PM2

```bash
sudo -u aramabul -H bash -lc "cd /var/www/aramabul && pm2 start deploy/hetzner/ecosystem.config.cjs && pm2 save && pm2 startup"
```

Run the printed `pm2 startup` command as root.

## 8. Enable Nginx

- Copy `deploy/hetzner/nginx-aramabul.conf` to `/etc/nginx/sites-available/aramabul`
- Replace `example.com` with your real domain

Then run:

```bash
ln -s /etc/nginx/sites-available/aramabul /etc/nginx/sites-enabled/aramabul
nginx -t
systemctl reload nginx
```

## 9. Add SSL

```bash
certbot --nginx -d example.com -d www.example.com
```

Replace the domains with your real domain.

## 10. Quick checks

Run these after deploy:

```bash
pm2 status
pm2 logs aramabul --lines 100
systemctl status nginx
ss -ltnp | grep 8787
```

## 11. One-command deploy (after each push)

After you commit and push from your local machine, SSH to the server and run:

```bash
bash /var/www/aramabul/deploy/hetzner/deploy.sh
```

This script does:

- `git pull --ff-only origin main`
- `npm ci --omit=dev` (only when needed)
- `pm2 restart aramabul`
- `pm2 save`

## Security notes

- Keep Node bound to `127.0.0.1`
- Only expose ports `22`, `80`, and `443`
- Do not store the real `.env` in git
- Use a long database password
