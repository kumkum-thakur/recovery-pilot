# Multi-stage production Dockerfile for RecoveryPilot
# Stage 1: Build frontend (React SPA)
# Stage 2: Build backend (Node.js API)
# Stage 3: Production frontend (Nginx)
# Stage 4: Production backend (Node.js)
#
# Security:
# - Non-root user
# - Read-only filesystem
# - No shell in production image
# - Minimal attack surface (distroless-inspired)

# ============================================================
# Stage 1: Frontend Build
# ============================================================
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts tailwind.config.js postcss.config.js ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

# ============================================================
# Stage 2: Backend Build
# ============================================================
FROM node:22-alpine AS backend-build

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci --ignore-scripts

COPY server/tsconfig.json ./
COPY server/src/ ./src/

RUN npx tsc -p tsconfig.json

# Production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# ============================================================
# Stage 3: Production Frontend (Nginx)
# ============================================================
FROM nginx:1.27-alpine AS frontend

# Security: Remove default configs
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Custom nginx config optimized for SPA
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/nginx/security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Copy built static files
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# Stage 4: Production Backend (Node.js)
# ============================================================
FROM node:22-alpine AS backend

# Security updates
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy production dependencies
COPY --from=backend-build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=backend-build --chown=appuser:appgroup /app/dist ./dist
COPY --from=backend-build --chown=appuser:appgroup /app/package.json ./

# Copy migrations
COPY --chown=appuser:appgroup server/migrations ./migrations

USER appuser

EXPOSE 3000 9090

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-old-space-size=1536", "--enable-source-maps", "dist/index.js"]
