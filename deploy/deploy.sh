#!/usr/bin/env bash
# Builds the app and rsyncs the static output to the Lightsail instance's
# nginx document root. Run from the repo root.
#
# Requires the production amplify_outputs.json (see README.md — generated
# via `npx ampx generate outputs`, NOT the sandbox one) to already be in
# place before this script runs; it does not fetch it for you.
#
# Configurable via environment variables so the host/key/path aren't
# hardcoded for anyone else who clones this repo:
#   LIGHTSAIL_HOST      default: ubuntu@52.199.161.97
#   LIGHTSAIL_SSH_KEY   default: ~/.ssh/LightsailDefaultKey-ap-northeast-1.pem
#   LIGHTSAIL_REMOTE_DIR default: /var/www/golf-app
#
# Example: LIGHTSAIL_HOST=ubuntu@1.2.3.4 ./deploy/deploy.sh

set -euo pipefail

LIGHTSAIL_HOST="${LIGHTSAIL_HOST:-ubuntu@52.199.161.97}"
LIGHTSAIL_SSH_KEY="${LIGHTSAIL_SSH_KEY:-$HOME/.ssh/LightsailDefaultKey-ap-northeast-1.pem}"
LIGHTSAIL_REMOTE_DIR="${LIGHTSAIL_REMOTE_DIR:-/var/www/golf-app}"

if [ ! -f amplify_outputs.json ]; then
  echo "amplify_outputs.json not found. Generate the production one first:" >&2
  echo "  npx ampx generate outputs --branch <production-branch> --app-id <app-id>" >&2
  exit 1
fi

echo "Building..."
npm run build

echo "Syncing dist/ to ${LIGHTSAIL_HOST}:${LIGHTSAIL_REMOTE_DIR} ..."
rsync -avz --delete -e "ssh -i ${LIGHTSAIL_SSH_KEY}" dist/ "${LIGHTSAIL_HOST}:${LIGHTSAIL_REMOTE_DIR}/"

echo "Done. Check http://${LIGHTSAIL_HOST#*@}/"
