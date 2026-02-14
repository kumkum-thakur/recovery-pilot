# Deployment Guide

## Overview

RecoveryPilot is a static SPA (single-page application). After building, the `dist/` directory contains pure HTML, CSS, and JS files that can be served by any static file server.

## Build

```bash
npm run build
```

This runs:
1. `tsc -b` -- TypeScript type checking
2. `vite build` -- Rolldown bundler producing optimized static assets in `dist/`

Verify the build:
```bash
ls dist/index.html   # Must exist
npm run preview       # Preview locally at http://localhost:4173
```

## Deployment Options

### Option 1: Automated Server Setup (Ubuntu/Debian)

The `autoconfig.sh` script handles full provisioning:

```bash
sudo bash autoconfig.sh
```

What it does (idempotently):
1. Updates system packages, installs build tools
2. Installs Node.js 22 via NodeSource
3. Configures swap space (2GB, for small cloud instances)
4. Clones the repo (or pulls latest if already present)
5. Creates `.env` from environment variables
6. Runs `npm install` and `npm run build`
7. Configures Nginx to serve `dist/` on port 80
8. Enables UFW firewall (SSH + HTTP/HTTPS)
9. Sets up auto-update cron job (every 5 minutes)

### Option 2: Static Hosting

Since the build output is static files, deploy to any static host:

**Vercel:**
```bash
npx vercel --prod
```

**Netlify:**
```bash
npx netlify deploy --prod --dir=dist
```

**GitHub Pages:**
```bash
npm run build
# Push dist/ to gh-pages branch
```

**AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket-name
```

### Option 3: Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 4: Windows Development Server

```cmd
autoconfig.bat
```

This installs dependencies, verifies TypeScript, and starts a development server.

## Environment Variables

Set before building:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_KEY` | No | Google Gemini API key for AI wound analysis |
| `VITE_GEMINI_KEY` | No | Same key (Vite client-side access) |

Without the key, wound analysis operates in simulation/fallback mode.

## Nginx Configuration

The `autoconfig.sh` generates this Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/recovery-pilot/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/javascript
               application/javascript application/json
               application/xml image/svg+xml;

    # Cache static assets (1 year, immutable hashes)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

Key points:
- SPA fallback ensures client-side routing works for all paths
- Static assets get 1-year cache with immutable content hashes
- Security headers protect against common web attacks
- Gzip compression reduces transfer sizes

## SSL/TLS

### With Cloudflare (Recommended)

1. Point your domain's DNS to your server IP via Cloudflare
2. Enable Cloudflare's Flexible SSL
3. Nginx listens on port 80; Cloudflare terminates HTTPS

### With Let's Encrypt

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Auto-Update

The `autoconfig.sh` sets up a cron job that checks for new commits every 5 minutes:

```bash
# Check update log
less /var/log/recovery-pilot-update.log

# Manual update trigger
/usr/local/bin/recovery-pilot-update.sh

# Disable auto-update
crontab -e  # Remove the recovery-pilot-update line
```

## Health Monitoring

```bash
# Check Nginx status
systemctl status nginx

# Check if app is serving
curl -s http://localhost/health

# View Nginx error logs
journalctl -u nginx -f

# View auto-update logs
tail -f /var/log/recovery-pilot-update.log
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with TS errors | Run `npx tsc -b` separately to see errors; build continues if only type warnings |
| Blank page after deploy | Check that SPA fallback is configured (all routes serve index.html) |
| Gemini API not working | Verify `VITE_GEMINI_KEY` was set **before** building (it's compiled in at build time) |
| Nginx 502/504 | N/A -- RecoveryPilot is static files, no backend process needed |
| Stale content after update | Clear browser cache or check that Nginx was reloaded |
