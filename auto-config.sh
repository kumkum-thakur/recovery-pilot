#!/bin/bash
# ============================================================================
# RecoveryPilot - Full Auto-Config for Blank Ubuntu on Google Cloud
# Domain: demoheal.dmj.one
# ============================================================================
#
# USAGE:
#   1. Create a fresh Ubuntu 22.04/24.04 instance on Google Cloud
#   2. Point DNS A record for demoheal.dmj.one → instance's public IP
#   3. Open firewall ports 80, 443 in GCP console (or this script handles UFW)
#   4. SSH into the instance and run:
#
#        curl -fsSL https://raw.githubusercontent.com/kumkum-thakur/recovery-pilot/main/auto-config.sh | sudo bash
#
#      OR copy this file to the server and run:
#
#        chmod +x auto-config.sh && sudo ./auto-config.sh
#
# ============================================================================

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
DOMAIN="demoheal.dmj.one"
APP_DIR="/opt/recovery-pilot"
REPO_URL="https://github.com/kumkum-thakur/recovery-pilot.git"
BRANCH="main"
NODE_MAJOR=22
GEMINI_KEY="AIzaSyC2mz4ibtvSSL-_TluJS9WOdm1qZXt_740"
ADMIN_EMAIL="admin@dmj.one"
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
    err "Please run as root: sudo ./auto-config.sh"
fi

echo ""
echo "============================================================"
echo "  RecoveryPilot — Full Server Auto-Configuration"
echo "  Domain: ${DOMAIN}"
echo "============================================================"
echo ""

PUBLIC_IP=$(curl -s --connect-timeout 5 http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "unknown")
log "Detected public IP: ${PUBLIC_IP}"

# ── Step 1: System Update ──────────────────────────────────────────────────
step "Step 1/8 — Updating system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git unzip software-properties-common \
    build-essential ca-certificates gnupg lsb-release \
    ufw fail2ban
log "System packages updated"

# ── Step 2: Swap (small GCP instances often need it) ───────────────────────
step "Step 2/8 — Configuring swap space"
if [ ! -f /swapfile ]; then
    fallocate -l ${SWAP_SIZE} /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "Swap (${SWAP_SIZE}) created and enabled"
else
    log "Swap already exists, skipping"
fi

# ── Step 3: Node.js ────────────────────────────────────────────────────────
step "Step 3/8 — Installing Node.js ${NODE_MAJOR}.x"
if command -v node &>/dev/null && node -v | grep -q "v${NODE_MAJOR}"; then
    log "Node.js $(node -v) already installed"
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
    apt-get install -y -qq nodejs
    log "Node.js $(node -v) installed"
    log "npm $(npm -v) installed"
fi

# ── Step 4: Clone & Build ──────────────────────────────────────────────────
step "Step 4/8 — Cloning repository and building app"

# Clean previous install if exists
if [ -d "${APP_DIR}" ]; then
    warn "Previous installation found, backing up..."
    mv "${APP_DIR}" "${APP_DIR}.bak.$(date +%s)"
fi

git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
cd "${APP_DIR}"

# Write .env for the build
cat > .env <<ENVEOF
GEMINI_KEY=${GEMINI_KEY}
VITE_GEMINI_KEY=${GEMINI_KEY}
ENVEOF
log "Environment file written"

# Install ALL dependencies (devDependencies needed for build: tsc, vite)
npm install
log "Dependencies installed"

# Build production static files
export GEMINI_KEY="${GEMINI_KEY}"
npx tsc -b && npx vite build
log "Production build complete → ${APP_DIR}/dist/"

# Prune devDependencies after build to save disk space
npm prune --omit=dev 2>/dev/null || true
log "Dev dependencies pruned"

# ── Step 5: Nginx ──────────────────────────────────────────────────────────
step "Step 5/8 — Installing and configuring Nginx"
apt-get install -y -qq nginx

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create Nginx config — HTTP first (Certbot will add HTTPS)
cat > /etc/nginx/sites-available/recovery-pilot <<NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

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
log "Nginx configured and running"

# ── Step 6: SSL with Certbot ──────────────────────────────────────────────
step "Step 6/8 — Setting up SSL with Let's Encrypt"
apt-get install -y -qq certbot python3-certbot-nginx

# Check if DNS is pointing to this server before requesting cert
RESOLVED_IP=$(dig +short "${DOMAIN}" 2>/dev/null | tail -1)
if [ "${RESOLVED_IP}" = "${PUBLIC_IP}" ]; then
    certbot --nginx \
        -d "${DOMAIN}" \
        --non-interactive \
        --agree-tos \
        --email "${ADMIN_EMAIL}" \
        --redirect
    log "SSL certificate obtained and configured"

    # Auto-renewal cron
    systemctl enable certbot.timer 2>/dev/null || true
    log "Certificate auto-renewal enabled"
else
    warn "DNS for ${DOMAIN} resolves to '${RESOLVED_IP}' but this server is '${PUBLIC_IP}'"
    warn "SSL setup skipped — make sure the A record points to ${PUBLIC_IP}"
    warn "After fixing DNS, run: sudo certbot --nginx -d ${DOMAIN} --redirect"
fi

# ── Step 7: Firewall ──────────────────────────────────────────────────────
step "Step 7/8 — Configuring firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
log "UFW firewall enabled (SSH + HTTP/HTTPS)"

# ── Step 8: Auto-update deploy hook ───────────────────────────────────────
step "Step 8/8 — Setting up auto-redeploy script and cron"

cat > /usr/local/bin/recovery-pilot-update.sh <<'UPDATEEOF'
#!/bin/bash
# RecoveryPilot — Pull latest changes and rebuild
set -euo pipefail

APP_DIR="/opt/recovery-pilot"
LOG="/var/log/recovery-pilot-update.log"

echo "[$(date)] Starting update..." >> "$LOG"

cd "$APP_DIR"

# Fetch and check for changes
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
npx tsc -b && npx vite build
npm prune --omit=dev 2>/dev/null || true

systemctl reload nginx
echo "[$(date)] Update complete. Now at $(git rev-parse --short HEAD)" >> "$LOG"
UPDATEEOF

chmod +x /usr/local/bin/recovery-pilot-update.sh

# Run auto-update every 5 minutes
CRON_JOB="*/5 * * * * /usr/local/bin/recovery-pilot-update.sh"
(crontab -l 2>/dev/null | grep -v 'recovery-pilot-update' ; echo "$CRON_JOB") | crontab -
log "Auto-redeploy configured (checks every 5 minutes)"

# ── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e "  ${GREEN}RecoveryPilot is LIVE!${NC}"
echo "============================================================"
echo ""
echo "  URL:          https://${DOMAIN}"
echo "  Public IP:    ${PUBLIC_IP}"
echo "  App dir:      ${APP_DIR}"
echo "  Web root:     ${APP_DIR}/dist/"
echo "  Nginx conf:   /etc/nginx/sites-available/recovery-pilot"
echo ""
echo "  Login credentials:"
echo "    Patient:    divya / divya"
echo "    Doctor:     dr.smith / smith"
echo "    Admin:      admin / admin"
echo ""
echo "  Maintenance commands:"
echo "    Manual redeploy:  /usr/local/bin/recovery-pilot-update.sh"
echo "    Nginx status:     systemctl status nginx"
echo "    Nginx logs:       journalctl -u nginx -f"
echo "    Renew SSL:        sudo certbot renew --dry-run"
echo "    App build log:    less /var/log/recovery-pilot-update.log"
echo ""
echo "  GCP Firewall reminder:"
echo "    Ensure ports 80 and 443 are open in your GCP VPC"
echo "    firewall rules (Network > Firewall > Create Rule)"
echo ""
echo "============================================================"
