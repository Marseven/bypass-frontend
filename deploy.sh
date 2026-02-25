#!/bin/bash
# ByPass Frontend - Git-based deploy script (run on server)
# Usage: bash deploy.sh
#
# Prerequisites:
#   - Run directly on the Hostinger server via SSH
#   - Git repo initialized with HTTPS remote (public repo, no auth needed)

set -e

# === CONFIGURATION ===
REMOTE_PATH="/home/u566067487/domains/bypass.jobs-conseil.host/public_html"
BRANCH="${BRANCH:-main}"

echo "=== ByPass Frontend Deploy ==="
echo "Path:   ${REMOTE_PATH}"
echo ""

cd "${REMOTE_PATH}"

# 1. Pull latest build from GitHub (HTTPS, no auth needed for public repo)
echo "[1/3] Pulling latest build from GitHub..."
git pull origin "${BRANCH}"

# 2. Copy dist/ contents to document root
echo "[2/3] Copying dist/ to document root..."
cp -r dist/* . && cp -r dist/.* . 2>/dev/null; true

# 3. Ensure .htaccess for SPA routing
echo "[3/3] Checking .htaccess..."
if [ -f .htaccess ]; then
    echo ".htaccess OK"
elif [ -f .htaccess.production ]; then
    cp .htaccess.production .htaccess
    echo ".htaccess copied from .htaccess.production"
else
    echo "WARNING: .htaccess missing — create it manually"
fi

echo ""
echo "Deploy complete!"
echo "Verify: https://bypass.jobs-conseil.host"
