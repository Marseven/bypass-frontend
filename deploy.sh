#!/bin/bash
# ByPass Frontend - Manual deploy script for Hostinger
# Usage: ./deploy.sh
#
# Prerequisites:
#   - SSH access configured to Hostinger
#   - Node.js 20+ installed locally
#   - Set environment variables or edit default values below

set -e

# === CONFIGURATION ===
HOST="${HOSTINGER_HOST:-nl-srv-web1323.main-hosting.eu}"
USER="${HOSTINGER_USER:-u566067487}"
PORT="${HOSTINGER_SSH_PORT:-65002}"
REMOTE_PATH="${HOSTINGER_FRONTEND_PATH:-/home/u566067487/domains/bypass.jobs-conseil.host/public_html}"

echo "=== ByPass Frontend Deploy ==="
echo "Target: ${USER}@${HOST}:${PORT}"
echo "Path:   ${REMOTE_PATH}"
echo ""

# 1. Install and build
echo "[1/4] Installing dependencies..."
npm ci

echo "[2/4] Building for production..."
npm run build

# 3. Rsync dist/ to server (--delete but exclude .htaccess)
echo "[3/4] Syncing build to server..."
rsync -avz --delete \
    --exclude='.htaccess' \
    -e "ssh -p ${PORT}" \
    dist/ "${USER}@${HOST}:${REMOTE_PATH}/"

# 4. Ensure .htaccess exists
echo "[4/4] Checking .htaccess..."
ssh -p "${PORT}" "${USER}@${HOST}" "test -f ${REMOTE_PATH}/.htaccess && echo '.htaccess OK' || echo 'WARNING: .htaccess missing — create it manually'"

echo ""
echo "Deploy complete!"
echo "Verify: https://bypass.jobs-conseil.host"
