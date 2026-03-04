#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git gnupg ufw nginx postgresql postgresql-contrib certbot python3-certbot-nginx

install -d -m 0755 /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list

apt-get update
apt-get install -y nodejs
npm install -g pm2

systemctl enable nginx
systemctl enable postgresql
systemctl restart nginx
systemctl restart postgresql

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "Base server setup is complete."
echo "Next: create the app user, clone the repo, create .env, set up PostgreSQL, copy nginx config, and run certbot."
