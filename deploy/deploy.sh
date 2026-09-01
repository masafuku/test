#!/usr/bin/env bash
# Redeploy script — run on the Lightsail instance, inside the golf-app
# checkout directory (e.g. ~/apps/golf-app). Builds VITE_BASE_PATH=/golf/
# so the client's asset URLs match the nginx /golf/ location (see
# deploy/nginx.conf.example) that reverse-proxies to this app's Express
# server (port 4002 by default).
#
# Usage: ./deploy/deploy.sh
set -euo pipefail

echo "==> git pull"
git pull

echo "==> install deps"
npm install

echo "==> build client (VITE_BASE_PATH=/golf/) + server"
VITE_BASE_PATH=/golf/ npm run build

echo "==> push DB schema (safe to re-run, never touches existing rows)"
npm run db:push

echo "==> restart via pm2"
pm2 restart golf-app || pm2 start server/dist/index.js --name golf-app

echo "Done. Check http://<host>/golf/"
