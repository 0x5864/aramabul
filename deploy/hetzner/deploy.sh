#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-aramabul}"
APP_DIR="${APP_DIR:-/var/www/aramabul}"
APP_NAME="${APP_NAME:-aramabul}"
BRANCH="${BRANCH:-main}"

as_app() {
  sudo -u "${APP_USER}" -H bash -lc "$*"
}

if [[ ! -d "${APP_DIR}" ]]; then
  echo "App directory not found: ${APP_DIR}"
  exit 1
fi

if ! id "${APP_USER}" >/dev/null 2>&1; then
  echo "App user not found: ${APP_USER}"
  exit 1
fi

echo "==> Deploy started"
echo "==> App dir: ${APP_DIR}"
echo "==> Branch: ${BRANCH}"

before_commit="$(as_app "cd '${APP_DIR}' && git rev-parse --short HEAD")"
echo "==> Current commit: ${before_commit}"

as_app "cd '${APP_DIR}' && git fetch origin '${BRANCH}'"

if ! as_app "cd '${APP_DIR}' && git merge-base --is-ancestor HEAD origin/'${BRANCH}'"; then
  echo "Deploy stopped: local branch is not a fast-forward to origin/${BRANCH}."
  echo "Run a manual git check in ${APP_DIR}."
  exit 1
fi

as_app "cd '${APP_DIR}' && git pull --ff-only origin '${BRANCH}'"
after_commit="$(as_app "cd '${APP_DIR}' && git rev-parse --short HEAD")"
echo "==> New commit: ${after_commit}"

if [[ "${before_commit}" != "${after_commit}" ]] || [[ ! -d "${APP_DIR}/node_modules" ]]; then
  echo "==> Installing dependencies"
  as_app "cd '${APP_DIR}' && npm ci --omit=dev"
else
  echo "==> Dependencies unchanged, skipping npm ci"
fi

echo "==> Restarting PM2 app: ${APP_NAME}"
as_app "pm2 restart '${APP_NAME}'"
as_app "pm2 save"

echo "==> PM2 status"
as_app "pm2 status"
echo "==> Deploy completed"
