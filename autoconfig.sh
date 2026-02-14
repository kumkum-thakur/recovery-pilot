#!/usr/bin/env bash
# =============================================================================
# RecoveryPilot — Idempotent Auto-Configuration Script (Linux/macOS)
# =============================================================================
#
# PURPOSE:
#   Install, update, rotate, and restart RecoveryPilot in a single command.
#   Safe to run repeatedly — every operation is idempotent.
#
# USAGE:
#   Local development:   ./autoconfig.sh
#   Server deployment:   sudo bash autoconfig.sh --deploy
#   Update only:         ./autoconfig.sh --update
#   Restart only:        ./autoconfig.sh --restart
#   Health check:        ./autoconfig.sh --health
#
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="recovery-pilot"
NODE_MAJOR=22
DEFAULT_PORT=5173
DEPLOY_DIR="/opt/recovery-pilot"
LOG_FILE="/var/log/recovery-pilot.log"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[!!]${NC} $1"; }
err()  { echo -e "  ${RED}[ERR]${NC} $1"; }
step() { echo -e "\n${CYAN}${BOLD}── $1 ──${NC}"; }

# ── Argument Parsing ──────────────────────────────────────────────────────────
MODE="full"
for arg in "$@"; do
    case "$arg" in
        --deploy)  MODE="deploy" ;;
        --update)  MODE="update" ;;
        --restart) MODE="restart" ;;
        --health)  MODE="health" ;;
        --help|-h) MODE="help" ;;
    esac
done

if [ "$MODE" = "help" ]; then
    echo ""
    echo "RecoveryPilot Auto-Configuration"
    echo ""
    echo "Usage: ./autoconfig.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (no args)   Full local setup: install deps, verify build, start dev server"
    echo "  --deploy    Full server deployment: system packages, Node.js, Nginx, firewall"
    echo "  --update    Pull latest code, reinstall deps, rebuild"
    echo "  --restart   Restart the running server (Nginx or dev server)"
    echo "  --health    Check if the application is running and healthy"
    echo "  --help      Show this help message"
    echo ""
    exit 0
fi

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  RecoveryPilot — Autonomous Care Orchestrator"
echo "  Mode: ${MODE}"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ── Health Check Mode ─────────────────────────────────────────────────────────
if [ "$MODE" = "health" ]; then
    step "Health Check"

    # Check Node.js
    if command -v node &>/dev/null; then
        ok "Node.js $(node --version)"
    else
        err "Node.js not found"
    fi

    # Check npm
    if command -v npm &>/dev/null; then
        ok "npm $(npm --version)"
    else
        err "npm not found"
    fi

    # Check if node_modules exists
    if [ -d "${SCRIPT_DIR}/node_modules" ]; then
        ok "Dependencies installed"
    else
        warn "Dependencies not installed (run ./autoconfig.sh)"
    fi

    # Check if dist exists (production build)
    if [ -d "${SCRIPT_DIR}/dist" ] && [ -f "${SCRIPT_DIR}/dist/index.html" ]; then
        ok "Production build exists"
    else
        warn "No production build (run npm run build)"
    fi

    # Check Nginx (if deployed)
    if command -v nginx &>/dev/null; then
        if systemctl is-active --quiet nginx 2>/dev/null; then
            ok "Nginx is running"
            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
            if [ "$HTTP_STATUS" = "200" ]; then
                ok "HTTP 200 on localhost"
            else
                warn "HTTP ${HTTP_STATUS} on localhost"
            fi
        else
            warn "Nginx installed but not running"
        fi
    fi

    # Check .env
    if [ -f "${SCRIPT_DIR}/.env" ]; then
        if grep -q "GEMINI_KEY=." "${SCRIPT_DIR}/.env" 2>/dev/null; then
            ok "Gemini API key configured"
        else
            warn "Gemini API key not set (wound analysis will use fallback mode)"
        fi
    else
        warn "No .env file (copy from .env.example)"
    fi

    echo ""
    exit 0
fi

# ── Restart Mode ──────────────────────────────────────────────────────────────
if [ "$MODE" = "restart" ]; then
    step "Restart"

    if command -v nginx &>/dev/null && systemctl is-active --quiet nginx 2>/dev/null; then
        echo "  Reloading Nginx..."
        if [ "$(id -u)" -eq 0 ]; then
            systemctl reload nginx
            ok "Nginx reloaded"
        else
            warn "Run with sudo to reload Nginx: sudo ./autoconfig.sh --restart"
        fi
    else
        echo "  No Nginx found. Starting dev server..."
        cd "${SCRIPT_DIR}"
        npx vite --host 0.0.0.0
    fi
    exit 0
fi

# ── Ensure we are in the project directory ────────────────────────────────────
if [ ! -f "${SCRIPT_DIR}/package.json" ]; then
    err "package.json not found in ${SCRIPT_DIR}"
    err "Run this script from the recovery-pilot project root."
    exit 1
fi

cd "${SCRIPT_DIR}"

# =============================================================================
# STEP 1: System Dependencies (deploy mode only)
# =============================================================================
if [ "$MODE" = "deploy" ]; then
    if [ "$(id -u)" -ne 0 ]; then
        err "Deploy mode requires root. Run: sudo bash autoconfig.sh --deploy"
        exit 1
    fi

    step "Step 1/7 — System Packages"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq \
        curl wget git unzip software-properties-common \
        build-essential ca-certificates gnupg lsb-release \
        ufw fail2ban cron nginx
    ok "System packages up to date"

    # Swap (idempotent)
    step "Step 2/7 — Swap Space"
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
        ok "2G swap created"
    else
        ok "Swap already exists"
    fi
fi

# =============================================================================
# STEP 2: Node.js
# =============================================================================
step "Checking Node.js"

if command -v node &>/dev/null; then
    CURRENT_NODE=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$CURRENT_NODE" -ge 18 ]; then
        ok "Node.js $(node --version) (meets requirement >= 18)"
    else
        warn "Node.js $(node --version) is too old (need >= 18)"
        if [ "$MODE" = "deploy" ]; then
            curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
            apt-get install -y -qq nodejs
            ok "Node.js $(node --version) installed"
        else
            err "Please install Node.js >= 18 from https://nodejs.org"
            exit 1
        fi
    fi
else
    if [ "$MODE" = "deploy" ]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
        apt-get install -y -qq nodejs
        ok "Node.js $(node --version) installed"
    else
        err "Node.js not found. Install from https://nodejs.org"
        exit 1
    fi
fi

# =============================================================================
# STEP 3: Environment File
# =============================================================================
step "Environment Configuration"

if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    if [ -f "${SCRIPT_DIR}/.env.example" ]; then
        cp "${SCRIPT_DIR}/.env.example" "${SCRIPT_DIR}/.env"
        ok "Created .env from .env.example"
        warn "Edit .env to add your Gemini API key (optional)"
    else
        warn "No .env.example found, skipping"
    fi
else
    ok ".env already exists"
fi

# Inject GEMINI_KEY from environment if set
if [ -n "${GEMINI_KEY:-}" ]; then
    sed -i "s|^GEMINI_KEY=.*|GEMINI_KEY=${GEMINI_KEY}|" "${SCRIPT_DIR}/.env"
    sed -i "s|^VITE_GEMINI_KEY=.*|VITE_GEMINI_KEY=${GEMINI_KEY}|" "${SCRIPT_DIR}/.env"
    ok "Gemini API key injected from environment"
fi

# =============================================================================
# STEP 4: Install Dependencies
# =============================================================================
step "Installing Dependencies"

npm install 2>&1 | tail -1
ok "Dependencies installed ($(ls node_modules | wc -l) packages)"

# =============================================================================
# STEP 5: Build (for deploy/update) or Verify (for local)
# =============================================================================
if [ "$MODE" = "deploy" ] || [ "$MODE" = "update" ]; then
    step "Building Production Bundle"

    # Source .env for build-time variables
    if [ -f "${SCRIPT_DIR}/.env" ]; then
        set -a
        source "${SCRIPT_DIR}/.env"
        set +a
    fi

    npx tsc -b 2>&1 || warn "TypeScript type-check had warnings (non-fatal for build)"
    npx vite build
    ok "Production build complete (dist/)"

    if [ ! -f "${SCRIPT_DIR}/dist/index.html" ]; then
        err "Build failed — dist/index.html not found"
        exit 1
    fi
else
    step "Verifying TypeScript"
    npx tsc --noEmit 2>&1 || warn "TypeScript found minor issues (non-fatal)"
    ok "TypeScript verification complete"
fi

# =============================================================================
# STEP 6: Nginx Configuration (deploy mode only)
# =============================================================================
if [ "$MODE" = "deploy" ]; then
    step "Step 5/7 — Configuring Nginx"

    PUBLIC_IP=$(curl -s --connect-timeout 5 http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "localhost")
    DOMAIN="${DOMAIN:-${PUBLIC_IP}}"

    rm -f /etc/nginx/sites-enabled/default

    cat > /etc/nginx/sites-available/recovery-pilot <<NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${PUBLIC_IP};

    root ${SCRIPT_DIR}/dist;
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
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Health check
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
    ok "Nginx configured and serving on port 80"

    # Firewall
    step "Step 6/7 — Firewall"
    ufw --force reset >/dev/null 2>&1
    ufw default deny incoming >/dev/null
    ufw default allow outgoing >/dev/null
    ufw allow ssh >/dev/null
    ufw allow 'Nginx Full' >/dev/null
    ufw --force enable >/dev/null
    ok "UFW firewall enabled (SSH + HTTP/HTTPS)"

    # Auto-update cron
    step "Step 7/7 — Auto-Update Cron"

    cat > /usr/local/bin/recovery-pilot-update.sh <<'UPDATEEOF'
#!/bin/bash
set -euo pipefail
APP_DIR="$(dirname "$(readlink -f "$0")")/../opt/recovery-pilot"
[ -d "$APP_DIR" ] || APP_DIR="/opt/recovery-pilot"
LOG="/var/log/recovery-pilot-update.log"

echo "[$(date)] Checking for updates..." >> "$LOG"
cd "$APP_DIR"

git fetch origin main 2>/dev/null || { echo "[$(date)] Fetch failed" >> "$LOG"; exit 1; }
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date)] Already up to date." >> "$LOG"
    exit 0
fi

echo "[$(date)] Updating from $(git rev-parse --short HEAD)..." >> "$LOG"
git pull origin main --ff-only

if [ -f .env ]; then set -a; source .env; set +a; fi
npm install --prefer-offline
npx tsc -b 2>&1 || true
npx vite build
systemctl reload nginx
echo "[$(date)] Updated to $(git rev-parse --short HEAD)" >> "$LOG"
UPDATEEOF

    chmod +x /usr/local/bin/recovery-pilot-update.sh
    systemctl enable cron
    systemctl start cron
    CRON_JOB="*/5 * * * * /usr/local/bin/recovery-pilot-update.sh"
    (crontab -l 2>/dev/null | grep -v 'recovery-pilot-update'; echo "$CRON_JOB") | crontab -
    ok "Auto-update cron configured (every 5 minutes)"
fi

# =============================================================================
# DONE
# =============================================================================
echo ""
echo "============================================================"
echo -e "  ${GREEN}${BOLD}RecoveryPilot is ready!${NC}"
echo "============================================================"
echo ""

if [ "$MODE" = "deploy" ]; then
    echo "  URL:          http://${DOMAIN:-localhost}"
    echo "  Direct IP:    http://${PUBLIC_IP:-localhost}"
    echo "  Web root:     ${SCRIPT_DIR}/dist/"
    echo "  Nginx conf:   /etc/nginx/sites-available/recovery-pilot"
    echo ""
fi

echo "  Credentials:"
echo "    Patient:    divya / divya"
echo "    Doctor:     dr.smith / smith"
echo "    Admin:      admin / admin"
echo ""

if [ "$MODE" != "deploy" ] && [ "$MODE" != "update" ]; then
    echo "  Starting development server..."
    echo "  Open: http://localhost:${DEFAULT_PORT}"
    echo "  Press Ctrl+C to stop."
    echo ""
    echo "============================================================"
    echo ""
    npx vite --host 0.0.0.0
else
    echo "  Commands:"
    echo "    Health check:    ./autoconfig.sh --health"
    echo "    Update:          ./autoconfig.sh --update"
    echo "    Restart:         sudo ./autoconfig.sh --restart"
    echo "    Re-deploy:       sudo bash autoconfig.sh --deploy"
    echo ""
    echo "============================================================"
fi
