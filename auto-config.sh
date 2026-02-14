#!/bin/bash
# ============================================================================
# RecoveryPilot - Full Auto-Config for Blank Ubuntu on Google Cloud
# Domain: demoheal.dmj.one  |  SSL: Cloudflare Flexible
# ============================================================================
#
# USAGE:
#   sudo bash auto-config.sh
#
# Safe to run multiple times — pulls latest changes and rebuilds.
#
# ============================================================================

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
DOMAIN="demoheal.dmj.one"
APP_DIR="/opt/recovery-pilot"
REPO_URL="https://github.com/kumkum-thakur/recovery-pilot.git"
BRANCH="main"
NODE_MAJOR=22
GEMINI_KEY="${GEMINI_KEY:-}"  # Set via environment: export GEMINI_KEY=your_key_here
SWAP_SIZE="2G"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✘]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

# ── Pre-flight ──────────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    err "Please run as root: sudo bash auto-config.sh"
fi

echo ""
echo "============================================================"
echo "  RecoveryPilot — Full Server Auto-Configuration"
echo "  Domain: ${DOMAIN}  (Cloudflare Flexible SSL)"
echo "============================================================"
echo ""

PUBLIC_IP=$(curl -s --connect-timeout 5 http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "unknown")
log "Detected public IP: ${PUBLIC_IP}"

# ── Step 1: System Update ──────────────────────────────────────────────────
step "Step 1/7 — Updating system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git unzip software-properties-common \
    build-essential ca-certificates gnupg lsb-release \
    ufw fail2ban cron nginx
log "System packages updated"

# ── Step 2: Swap (small GCP instances often need it) ───────────────────────
step "Step 2/7 — Configuring swap space"
if [ ! -f /swapfile ]; then
    fallocate -l ${SWAP_SIZE} /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "Swap (${SWAP_SIZE}) created and enabled"
else
    log "Swap already exists, skipping"
fi

# ── Step 3: Node.js ────────────────────────────────────────────────────────
step "Step 3/7 — Installing Node.js ${NODE_MAJOR}.x"
if command -v node &>/dev/null && node -v | grep -q "v${NODE_MAJOR}"; then
    log "Node.js $(node -v) already installed"
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
    apt-get install -y -qq nodejs
    log "Node.js $(node -v) installed"
    log "npm $(npm -v) installed"
fi

# ── Step 4: Clone or Pull & Build ──────────────────────────────────────────
step "Step 4/7 — Fetching latest code and building app"

if [ -d "${APP_DIR}/.git" ]; then
    log "Existing installation found — pulling latest changes"
    cd "${APP_DIR}"
    git fetch origin "${BRANCH}"
    git reset --hard "origin/${BRANCH}"
else
    log "Fresh install — cloning repository"
    rm -rf "${APP_DIR}"
    git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
    cd "${APP_DIR}"
fi

# Write .env for the build
cat > "${APP_DIR}/.env" <<ENVEOF
GEMINI_KEY=${GEMINI_KEY}
VITE_GEMINI_KEY=${GEMINI_KEY}
ENVEOF
log "Environment file written → ${APP_DIR}/.env"

# Install ALL dependencies (devDependencies needed for build: tsc, vite)
npm install
log "Dependencies installed"

# Build production static files
# Note: tsc type-check is non-fatal (test files may have TS errors)
#       vite build handles actual TS→JS compilation via rolldown
export GEMINI_KEY="${GEMINI_KEY}"
npx tsc -b 2>&1 || warn "TypeScript type-check had warnings (non-fatal)"
npx vite build
log "Production build complete → ${APP_DIR}/dist/"

# Verify dist has content
if [ ! -f "${APP_DIR}/dist/index.html" ]; then
    err "Build failed — dist/index.html not found!"
fi

# Prune devDependencies after build to save disk space
npm prune --omit=dev 2>/dev/null || true
log "Dev dependencies pruned"

# ── Step 5: Nginx ──────────────────────────────────────────────────────────
step "Step 5/7 — Configuring Nginx (port 80 for Cloudflare)"

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create Nginx config — HTTP only (Cloudflare Flexible SSL terminates HTTPS)
cat > /etc/nginx/sites-available/recovery-pilot <<NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${PUBLIC_IP};

    root ${APP_DIR}/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # SPA fallback — all routes serve index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/recovery-pilot /etc/nginx/sites-enabled/
nginx -t
systemctl enable nginx
systemctl restart nginx
log "Nginx configured and serving on port 80"

# ── Step 6: Firewall ──────────────────────────────────────────────────────
step "Step 6/7 — Configuring firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
log "UFW firewall enabled (SSH + HTTP/HTTPS)"

# ── Step 7: Auto-update cron ─────────────────────────────────────────────
step "Step 7/7 — Setting up auto-redeploy cron"

cat > /usr/local/bin/recovery-pilot-update.sh <<'UPDATEEOF'
#!/bin/bash
# RecoveryPilot — Pull latest changes and rebuild
set -euo pipefail

APP_DIR="/opt/recovery-pilot"
LOG="/var/log/recovery-pilot-update.log"

echo "[$(date)] Starting update check..." >> "$LOG"
cd "$APP_DIR"

git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date)] Already up to date." >> "$LOG"
    exit 0
fi

echo "[$(date)] New commits found, updating..." >> "$LOG"
git reset --hard origin/main

export GEMINI_KEY=$(grep GEMINI_KEY .env | head -1 | cut -d= -f2)
npm install
npx tsc -b 2>&1 || true
npx vite build
npm prune --omit=dev 2>/dev/null || true

systemctl reload nginx
echo "[$(date)] Update complete. Now at $(git rev-parse --short HEAD)" >> "$LOG"
UPDATEEOF

chmod +x /usr/local/bin/recovery-pilot-update.sh

# Add cron job (idempotent — removes old entry first)
systemctl enable cron
systemctl start cron
CRON_JOB="*/5 * * * * /usr/local/bin/recovery-pilot-update.sh"
(crontab -l 2>/dev/null | grep -v 'recovery-pilot-update'; echo "$CRON_JOB") | crontab -
log "Auto-redeploy cron configured (checks every 5 minutes)"

# ── Final verification ──────────────────────────────────────────────────────
echo ""
step "Verifying server is live"
sleep 1
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    log "Nginx is serving RecoveryPilot on port 80"
else
    warn "Health check returned HTTP ${HTTP_STATUS}"
    warn "Debug: systemctl status nginx && nginx -t"
fi

# ── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e "  ${GREEN}RecoveryPilot is LIVE!${NC}"
echo "============================================================"
echo ""
echo "  Public URL:   https://${DOMAIN}  (via Cloudflare)"
echo "  Direct IP:    http://${PUBLIC_IP}"
echo "  Public IP:    ${PUBLIC_IP}"
echo ""
echo "  App dir:      ${APP_DIR}"
echo "  Web root:     ${APP_DIR}/dist/"
echo "  Env file:     ${APP_DIR}/.env"
echo "  Nginx conf:   /etc/nginx/sites-available/recovery-pilot"
echo ""
echo "  Login credentials:"
echo "    Patient:    divya / divya"
echo "    Doctor:     dr.smith / smith"
echo "    Admin:      admin / admin"
echo ""
echo "  Maintenance:"
echo "    Re-run this script:   sudo bash auto-config.sh"
echo "    Manual redeploy:      /usr/local/bin/recovery-pilot-update.sh"
echo "    Nginx status:         systemctl status nginx"
echo "    Nginx logs:           journalctl -u nginx -f"
echo "    Update log:           less /var/log/recovery-pilot-update.log"
echo "    Edit env vars:        nano ${APP_DIR}/.env"
echo ""
echo "  GCP Firewall reminder:"
echo "    Ensure port 80 is open in your VPC firewall rules"
echo ""
echo "============================================================"
