#!/bin/bash
# ByPass Frontend - Git-based deploy script for Hostinger
# Usage: ./deploy.sh
#
# Prerequisites:
#   - SSH access configured to Hostinger
#   - Git repo initialized on server with remote pointing to GitHub
#   - Deploy key added to GitHub repo
#   - Set environment variables or edit default values below

set -e

# === CONFIGURATION ===
HOST="${HOSTINGER_HOST:-nl-srv-web1323.main-hosting.eu}"
USER="${HOSTINGER_USER:-u566067487}"
PORT="${HOSTINGER_SSH_PORT:-65002}"
REMOTE_PATH="${HOSTINGER_FRONTEND_PATH:-/home/u566067487/domains/bypass.jobs-conseil.host/public_html}"
BRANCH="${BRANCH:-main}"

echo "=== ByPass Frontend Deploy ==="
echo "Target: ${USER}@${HOST}:${PORT}"
echo "Path:   ${REMOTE_PATH}"
echo ""

# 1. Pull latest from GitHub on server
echo "[1/3] Pulling latest build from GitHub..."
ssh -p "${PORT}" "${USER}@${HOST}" "cd ${REMOTE_PATH} && git pull origin ${BRANCH}"

# 2. Copy dist/ contents to public_html root
echo "[2/3] Copying dist/ to document root..."
ssh -p "${PORT}" "${USER}@${HOST}" "cp -r ${REMOTE_PATH}/dist/* ${REMOTE_PATH}/ && cp -r ${REMOTE_PATH}/dist/.* ${REMOTE_PATH}/ 2>/dev/null; true"

# 3. Ensure .htaccess for SPA routing
echo "[3/3] Checking .htaccess..."
ssh -p "${PORT}" "${USER}@${HOST}" "test -f ${REMOTE_PATH}/.htaccess && echo '.htaccess OK' || cp ${REMOTE_PATH}/.htaccess.production ${REMOTE_PATH}/.htaccess 2>/dev/null || echo 'WARNING: .htaccess missing — create it manually'"

echo ""
echo "Deploy complete!"
echo "Verify: https://bypass.jobs-conseil.host"
