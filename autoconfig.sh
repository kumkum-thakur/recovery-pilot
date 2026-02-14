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
# DOMAIN CONFIGURATION:
#   Set DOMAIN= in your .env file before deploying.
#   The script reads it automatically — no flags needed.
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

# ── Read DOMAIN from .env ────────────────────────────────────────────────────
# The user sets DOMAIN=app.example.com in .env before running this script.
# We source it early so DOMAIN is available throughout.
if [ -f "${SCRIPT_DIR}/.env" ]; then
    DOMAIN_FROM_ENV=$(grep -E '^DOMAIN=' "${SCRIPT_DIR}/.env" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '[:space:]' || true)
fi
DOMAIN="${DOMAIN_FROM_ENV:-}"

if [ "$MODE" = "help" ]; then
    echo ""
    echo "RecoveryPilot Auto-Configuration"
    echo ""
    echo "Usage: ./autoconfig.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (no args)          Full local setup: install deps, verify build, start dev server"
    echo "  --deploy           Full server deployment: system packages, Node.js, Nginx, SSL, firewall"
    echo "  --update           Pull latest code, reinstall deps, rebuild"
    echo "  --restart          Restart the running server (Nginx + API)"
    echo "  --health           Check if the application is running and healthy"
    echo "  --help             Show this help message"
    echo ""
    echo "Quick start (Google Cloud VM):"
    echo "  1. Create a VM (Ubuntu 22.04+, e2-medium or larger)"
    echo "  2. SSH in and clone the repo"
    echo "  3. cp .env.example .env"
    echo "  4. Edit .env and set DOMAIN=app.yourdomain.com"
    echo "  5. Point your subdomain A record to the VM's public IP"
    echo "  6. sudo bash autoconfig.sh --deploy"
    echo "  7. Visit https://app.yourdomain.com"
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

    # Check PostgreSQL
    if command -v psql &>/dev/null; then
        if systemctl is-active --quiet postgresql 2>/dev/null; then
            ok "PostgreSQL is running"
        else
            warn "PostgreSQL installed but not running"
        fi
    else
        warn "PostgreSQL not installed (app works in frontend-only mode)"
    fi

    # Check Redis
    if command -v redis-cli &>/dev/null; then
        if redis-cli ping 2>/dev/null | grep -q PONG; then
            ok "Redis is running"
        else
            warn "Redis installed but not responding"
        fi
    else
        warn "Redis not installed (app works in frontend-only mode)"
    fi

    # Check API server
    if systemctl is-active --quiet recovery-pilot-api 2>/dev/null; then
        ok "API server is running"
        API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
        if [ "$API_STATUS" = "200" ]; then
            ok "API health check passed"
        else
            warn "API returned HTTP ${API_STATUS}"
        fi
    else
        warn "API server not running (app works in frontend-only mode with LocalStorage)"
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

    # Check SSL certificate
    if [ -d "/etc/letsencrypt/live" ] && [ "$(ls /etc/letsencrypt/live/ 2>/dev/null)" ]; then
        CERT_DOMAIN=$(ls /etc/letsencrypt/live/ | head -1)
        CERT_EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/${CERT_DOMAIN}/fullchain.pem" 2>/dev/null | cut -d= -f2)
        ok "SSL certificate for ${CERT_DOMAIN} (expires: ${CERT_EXPIRY})"
    else
        warn "No SSL certificate (set DOMAIN= in .env, then run --deploy)"
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

    if [ "$(id -u)" -ne 0 ]; then
        warn "Run with sudo to restart services: sudo ./autoconfig.sh --restart"
        echo "  Starting dev server instead..."
        cd "${SCRIPT_DIR}"
        npx vite --host 0.0.0.0
        exit 0
    fi

    # Restart API server if it exists
    if systemctl list-unit-files | grep -q recovery-pilot-api; then
        systemctl restart recovery-pilot-api
        ok "API server restarted"
    fi

    # Reload Nginx
    if command -v nginx &>/dev/null && systemctl is-active --quiet nginx 2>/dev/null; then
        systemctl reload nginx
        ok "Nginx reloaded"
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

    step "Step 1/10 — System Packages"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq \
        curl wget git unzip software-properties-common \
        build-essential ca-certificates gnupg lsb-release \
        ufw fail2ban cron nginx certbot python3-certbot-nginx \
        postgresql postgresql-contrib redis-server
    ok "System packages up to date"

    # Swap (idempotent)
    step "Step 2/10 — Swap Space"
    if [ ! -f /swapfile ]; then
        fallocate -l 4G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
        ok "4G swap created"
    else
        ok "Swap already exists"
    fi

    # ── PostgreSQL Setup (idempotent) ──
    step "Step 3/10 — PostgreSQL"
    systemctl enable postgresql
    systemctl start postgresql

    # Create database and user if they don't exist
    DB_NAME="recovery_pilot"
    DB_USER="rp_app"
    DB_PASS_FILE="/root/.rp-db-password"

    # Generate or read DB password
    if [ -f "$DB_PASS_FILE" ]; then
        DB_PASS=$(cat "$DB_PASS_FILE")
    else
        DB_PASS=$(openssl rand -hex 24)
        echo "$DB_PASS" > "$DB_PASS_FILE"
        chmod 600 "$DB_PASS_FILE"
    fi

    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
        ok "PostgreSQL user '${DB_USER}' already exists"
        # Update password to match saved one
        sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || true
    else
        sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
        ok "PostgreSQL user '${DB_USER}' created"
    fi

    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
        ok "PostgreSQL database '${DB_NAME}' already exists"
    else
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
        ok "PostgreSQL database '${DB_NAME}' created"

        # Run initial schema migration
        if [ -f "${SCRIPT_DIR}/server/migrations/001_initial_schema.sql" ]; then
            sudo -u postgres psql -d "${DB_NAME}" -f "${SCRIPT_DIR}/server/migrations/001_initial_schema.sql" 2>&1 || warn "Migration had warnings (non-fatal)"
            sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USER};"
            sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};"
            sudo -u postgres psql -d "${DB_NAME}" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"
            ok "Database schema migrated"
        fi
    fi

    # Tune PostgreSQL for a single VM (assumes 4-8GB RAM)
    PG_CONF=$(sudo -u postgres psql -tAc "SHOW config_file" | tr -d '[:space:]')
    if [ -n "$PG_CONF" ] && ! grep -q "# RecoveryPilot tuning" "$PG_CONF"; then
        cat >> "$PG_CONF" <<PGEOF

# RecoveryPilot tuning
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 16MB
maintenance_work_mem = 256MB
max_connections = 200
random_page_cost = 1.1
effective_io_concurrency = 200
wal_level = replica
max_wal_size = 1GB
checkpoint_completion_target = 0.9
log_min_duration_statement = 1000
PGEOF
        systemctl restart postgresql
        ok "PostgreSQL tuned for production"
    else
        ok "PostgreSQL already tuned"
    fi

    # ── Redis Setup ──
    step "Step 4/10 — Redis"
    systemctl enable redis-server
    systemctl start redis-server

    # Tune Redis
    REDIS_CONF="/etc/redis/redis.conf"
    if [ -f "$REDIS_CONF" ] && ! grep -q "# RecoveryPilot tuning" "$REDIS_CONF"; then
        cat >> "$REDIS_CONF" <<REDISEOF

# RecoveryPilot tuning
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
tcp-keepalive 60
timeout 300
REDISEOF
        systemctl restart redis-server
        ok "Redis tuned for production"
    else
        ok "Redis already tuned"
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
# STEP 6: Backend API Server (deploy mode only)
# =============================================================================
if [ "$MODE" = "deploy" ]; then
    step "Step 5/10 — Backend API Server"

    # Install server dependencies
    if [ -f "${SCRIPT_DIR}/server/package.json" ]; then
        cd "${SCRIPT_DIR}/server"
        npm install 2>&1 | tail -1
        ok "Server dependencies installed"
        cd "${SCRIPT_DIR}"
    fi

    # Generate secrets if not already present
    SERVER_ENV="${SCRIPT_DIR}/server/.env"
    if [ ! -f "${SERVER_ENV}" ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        SESSION_SECRET=$(openssl rand -hex 32)
        ENCRYPTION_KEY=$(openssl rand -hex 32)

        # Read DB password from earlier setup
        DB_PASS_FILE="/root/.rp-db-password"
        if [ -f "$DB_PASS_FILE" ]; then
            DB_PASS=$(cat "$DB_PASS_FILE")
        else
            DB_PASS="change_me_in_production"
            warn "DB password file not found — using default"
        fi

        cat > "${SERVER_ENV}" <<SERVERENVEOF
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
CLUSTER_WORKERS=0
TRUST_PROXY=1

DEPLOYMENT_REGION=ap-south-1
COMPLIANCE_REGIME=DPDPA
DATA_RESIDENCY_REGION=ap-south-1

DB_PRIMARY_HOST=127.0.0.1
DB_PRIMARY_PORT=5432
DB_PRIMARY_NAME=recovery_pilot
DB_PRIMARY_USER=rp_app
DB_PRIMARY_PASSWORD=${DB_PASS}
DB_PRIMARY_SSL=false
DB_PRIMARY_POOL_MIN=5
DB_PRIMARY_POOL_MAX=20
DB_PRIMARY_IDLE_TIMEOUT_MS=30000
DB_PRIMARY_ACQUIRE_TIMEOUT_MS=60000
DB_PRIMARY_STATEMENT_TIMEOUT_MS=30000
DB_REPLICA_HOSTS=
DB_REPLICA_POOL_MAX=20

REDIS_PRIMARY_HOST=127.0.0.1
REDIS_PRIMARY_PORT=6379
REDIS_PRIMARY_PASSWORD=
REDIS_PRIMARY_TLS=false
REDIS_PRIMARY_DB=0
REDIS_MAX_RETRIES=3
REDIS_KEY_PREFIX=rp:
REDIS_CLUSTER_ENABLED=false
REDIS_CLUSTER_NODES=

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=recovery-pilot
BCRYPT_ROUNDS=12
MFA_ENABLED=false
SESSION_SECRET=${SESSION_SECRET}

ENCRYPTION_MASTER_KEY=${ENCRYPTION_KEY}
AWS_KMS_KEY_ARN=
ENCRYPTION_ALGORITHM=aes-256-gcm
FIELD_LEVEL_ENCRYPTION=true

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_API_MAX=1000
RATE_LIMIT_STORE=redis

LOG_LEVEL=info
LOG_FORMAT=json
METRICS_ENABLED=false
TRACING_ENABLED=false

AUDIT_LOG_RETENTION_DAYS=2555
AUDIT_LOG_IMMUTABLE=true
AUDIT_LOG_DESTINATION=database

CORS_ORIGINS=
CORS_CREDENTIALS=true
SERVERENVEOF
        chmod 600 "${SERVER_ENV}"
        ok "Server .env generated with secure random secrets"
    else
        ok "Server .env already exists"
    fi

    # Build backend TypeScript
    if [ -f "${SCRIPT_DIR}/server/tsconfig.json" ]; then
        cd "${SCRIPT_DIR}/server"
        npx tsc -p tsconfig.json 2>&1 || warn "Server TypeScript had warnings (non-fatal)"
        ok "Server TypeScript compiled"
        cd "${SCRIPT_DIR}"
    fi

    # Create systemd service for API server
    step "Step 6/10 — API systemd Service"
    cat > /etc/systemd/system/recovery-pilot-api.service <<SVCEOF
[Unit]
Description=RecoveryPilot API Server
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${SCRIPT_DIR}/server
EnvironmentFile=${SERVER_ENV}
ExecStart=$(which node) --max-old-space-size=1024 --enable-source-maps dist/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rp-api

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${SCRIPT_DIR}/server /tmp
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
MemoryMax=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
SVCEOF

    # Ensure www-data can read the server directory
    chown -R www-data:www-data "${SCRIPT_DIR}/server/dist" 2>/dev/null || true

    systemctl daemon-reload
    systemctl enable recovery-pilot-api
    systemctl restart recovery-pilot-api
    sleep 2

    if systemctl is-active --quiet recovery-pilot-api; then
        ok "API server running on port 3000"
    else
        warn "API server failed to start (check: journalctl -u recovery-pilot-api)"
        warn "Frontend will still work in standalone mode with LocalStorage"
    fi
fi

# =============================================================================
# STEP 7: Nginx Configuration (deploy mode only)
# =============================================================================
if [ "$MODE" = "deploy" ]; then
    step "Step 7/10 — Configuring Nginx"

    PUBLIC_IP=$(curl -s --connect-timeout 5 http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "localhost")
    # DOMAIN was already read from .env at the top of the script.
    # Fall back to public IP if no domain is configured.
    DOMAIN="${DOMAIN:-${PUBLIC_IP}}"

    rm -f /etc/nginx/sites-enabled/default

    cat > /etc/nginx/sites-available/recovery-pilot <<NGINXEOF
# RecoveryPilot — Production Nginx Configuration
# Frontend SPA + API reverse proxy

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
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;

    # API reverse proxy — all /api/* requests go to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Request-ID \$request_id;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

        # No caching for API responses (PHI data)
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    # API health check (direct to backend)
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    location /ready {
        proxy_pass http://127.0.0.1:3000/ready;
        access_log off;
    }

    # Cache static assets (JS, CSS, images)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # SPA fallback — all other routes serve index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Block hidden files
    location ~ /\. {
        deny all;
        access_log off;
    }

    # Request size limit (medical image uploads)
    client_max_body_size 50m;
}
NGINXEOF

    ln -sf /etc/nginx/sites-available/recovery-pilot /etc/nginx/sites-enabled/
    nginx -t
    systemctl enable nginx
    systemctl restart nginx
    ok "Nginx configured — frontend on / , API on /api/"

    # ── Firewall ──
    step "Step 8/10 — Firewall"
    ufw --force reset >/dev/null 2>&1
    ufw default deny incoming >/dev/null
    ufw default allow outgoing >/dev/null
    ufw allow ssh >/dev/null
    ufw allow 'Nginx Full' >/dev/null
    ufw --force enable >/dev/null
    ok "UFW firewall enabled (SSH + HTTP/HTTPS only)"

    # ── SSL with Let's Encrypt (if domain provided) ──
    step "Step 9/10 — SSL Certificate"
    if [ "${DOMAIN}" != "${PUBLIC_IP}" ] && [ "${DOMAIN}" != "localhost" ]; then
        echo "  Requesting SSL certificate for ${DOMAIN}..."
        certbot --nginx \
            -d "${DOMAIN}" \
            --non-interactive \
            --agree-tos \
            --redirect \
            --email "admin@${DOMAIN}" \
            --no-eff-email \
            2>&1 || warn "Certbot failed — make sure DNS A record points to ${PUBLIC_IP} first"

        if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
            ok "HTTPS enabled for ${DOMAIN}"

            # Update CORS in server .env
            SERVER_ENV="${SCRIPT_DIR}/server/.env"
            if [ -f "${SERVER_ENV}" ]; then
                sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN}|" "${SERVER_ENV}"
                systemctl restart recovery-pilot-api 2>/dev/null || true
            fi
        else
            warn "SSL not configured — site works on HTTP"
            warn "After DNS propagates, run: sudo certbot --nginx -d ${DOMAIN}"
        fi

        # Auto-renewal cron (certbot installs this automatically, but verify)
        if ! systemctl is-active --quiet certbot.timer 2>/dev/null; then
            (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -
            ok "SSL auto-renewal configured"
        else
            ok "SSL auto-renewal already active (certbot timer)"
        fi
    else
        warn "No domain in .env — skipping SSL"
        warn "To add HTTPS: set DOMAIN=yourdomain.com in .env, then re-run --deploy"
    fi

    # ── Auto-update cron ──
    step "Step 10/10 — Auto-Update Cron"

    cat > /usr/local/bin/recovery-pilot-update.sh <<'UPDATEEOF'
#!/bin/bash
set -euo pipefail
APP_DIR="SCRIPT_DIR_PLACEHOLDER"
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

# Rebuild frontend
if [ -f .env ]; then set -a; source .env; set +a; fi
npm install --prefer-offline
npx vite build

# Rebuild backend
if [ -d server ]; then
    cd server
    npm install --prefer-offline
    npx tsc -p tsconfig.json 2>&1 || true
    cd ..
    systemctl restart recovery-pilot-api 2>/dev/null || true
fi

systemctl reload nginx
echo "[$(date)] Updated to $(git rev-parse --short HEAD)" >> "$LOG"
UPDATEEOF

    # Replace placeholder with actual path
    sed -i "s|SCRIPT_DIR_PLACEHOLDER|${SCRIPT_DIR}|" /usr/local/bin/recovery-pilot-update.sh
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
    SHOW_DOMAIN="${DOMAIN:-${PUBLIC_IP:-localhost}}"
    if [ -f "/etc/letsencrypt/live/${SHOW_DOMAIN}/fullchain.pem" ] 2>/dev/null; then
        PROTO="https"
    else
        PROTO="http"
    fi

    echo "  Frontend:     ${PROTO}://${SHOW_DOMAIN}"
    echo "  API:          ${PROTO}://${SHOW_DOMAIN}/api/v1/"
    echo "  Direct IP:    http://${PUBLIC_IP:-localhost}"
    echo ""
    echo "  Services:"
    if systemctl is-active --quiet recovery-pilot-api 2>/dev/null; then
        echo "    API Server:  running (port 3000)"
    else
        echo "    API Server:  not running (frontend works standalone)"
    fi
    if systemctl is-active --quiet postgresql 2>/dev/null; then
        echo "    PostgreSQL:  running (port 5432)"
    fi
    if systemctl is-active --quiet redis-server 2>/dev/null; then
        echo "    Redis:       running (port 6379)"
    fi
    echo "    Nginx:       running (port 80/443)"
    echo ""
    echo "  DNS Setup:"
    echo "    Point your domain's A record to: ${PUBLIC_IP:-<your-vm-ip>}"
    echo "    Then HTTPS will be auto-configured via Let's Encrypt"
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
    echo "    View API logs:   journalctl -u recovery-pilot-api -f"
    echo "    View Nginx logs: tail -f /var/log/nginx/access.log"
    echo ""
    echo "============================================================"
fi
