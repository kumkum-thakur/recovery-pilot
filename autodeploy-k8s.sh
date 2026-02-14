#!/usr/bin/env bash
# =============================================================================
# RecoveryPilot — One-Click Kubernetes Deployment
# =============================================================================
#
# PURPOSE:
#   Build images, push to registry, and deploy to Kubernetes — all in one command.
#   Reads configuration from .env (DOMAIN, registry, region, etc.)
#
# USAGE:
#   Deploy to India:    sudo bash autodeploy-k8s.sh --region=india
#   Deploy to US:       sudo bash autodeploy-k8s.sh --region=us
#   Deploy to UK:       sudo bash autodeploy-k8s.sh --region=uk
#   Deploy all regions: sudo bash autodeploy-k8s.sh --region=all
#   Destroy deployment: sudo bash autodeploy-k8s.sh --destroy --region=india
#   Status check:       sudo bash autodeploy-k8s.sh --status
#
# PREREQUISITES:
#   - kubectl configured with cluster access
#   - docker (for building images)
#   - A container registry (set REGISTRY= in .env)
#   - .env file with DOMAIN= and REGISTRY= set
#
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="${SCRIPT_DIR}/infrastructure/kubernetes"

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

# ── Argument Parsing (before .env so --help works without .env) ───────────────
MODE="deploy"
REGION=""
SKIP_BUILD="false"

for arg in "$@"; do
    case "$arg" in
        --region=*)   REGION="${arg#--region=}" ;;
        --destroy)    MODE="destroy" ;;
        --status)     MODE="status" ;;
        --help|-h)    MODE="help" ;;
        --skip-build) SKIP_BUILD="true" ;;
    esac
done

# ── Help ──────────────────────────────────────────────────────────────────────
if [ "$MODE" = "help" ]; then
    echo ""
    echo "RecoveryPilot — Kubernetes Deployment"
    echo ""
    echo "Usage: sudo bash autodeploy-k8s.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --region=india|us|uk|all   Target region (required for deploy/destroy)"
    echo "  --destroy                  Tear down the deployment for a region"
    echo "  --status                   Show status of all deployments"
    echo "  --skip-build               Skip Docker image build (use existing images)"
    echo "  --help                     Show this help message"
    echo ""
    echo "Quick start:"
    echo "  1. cp .env.example .env"
    echo "  2. Edit .env: set DOMAIN, REGISTRY, and other values"
    echo "  3. sudo bash autodeploy-k8s.sh --region=india"
    echo ""
    echo "Required .env variables:"
    echo "  DOMAIN=app.recoverypilot.health     Your application domain"
    echo "  REGISTRY=gcr.io/your-project        Container registry URL"
    echo ""
    echo "Optional .env variables:"
    echo "  IMAGE_TAG=v1.0.0                    Image tag (default: latest)"
    echo "  K8S_CONTEXT=gke_project_zone_cluster  kubectl context to use"
    echo ""
    exit 0
fi

# ── Read .env ─────────────────────────────────────────────────────────────────
if [ -f "${SCRIPT_DIR}/.env" ]; then
    set -a
    source "${SCRIPT_DIR}/.env"
    set +a
else
    err "No .env file found. Copy .env.example to .env and configure it."
    err "  cp .env.example .env"
    exit 1
fi

DOMAIN="${DOMAIN:-}"
REGISTRY="${REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  RecoveryPilot — Kubernetes Deployment"
echo "  Mode: ${MODE}"
echo "  Region: ${REGION:-all}"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ── Status Mode ───────────────────────────────────────────────────────────────
if [ "$MODE" = "status" ]; then
    step "Cluster Info"
    kubectl cluster-info 2>/dev/null || { err "kubectl not configured or cluster unreachable"; exit 1; }

    for ns in recovery-pilot recovery-pilot-india recovery-pilot-us recovery-pilot-uk; do
        if kubectl get namespace "$ns" &>/dev/null; then
            step "Namespace: ${ns}"
            echo ""
            echo "  Pods:"
            kubectl get pods -n "$ns" -o wide 2>/dev/null || warn "No pods in ${ns}"
            echo ""
            echo "  Services:"
            kubectl get svc -n "$ns" 2>/dev/null || true
            echo ""
            echo "  HPA:"
            kubectl get hpa -n "$ns" 2>/dev/null || true
            echo ""
            echo "  Ingress:"
            kubectl get ingress -n "$ns" 2>/dev/null || true
            echo ""
        fi
    done
    exit 0
fi

# ── Validate Prerequisites ────────────────────────────────────────────────────
step "Validating Prerequisites"

if ! command -v kubectl &>/dev/null; then
    err "kubectl not found. Install: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi
ok "kubectl found"

if ! kubectl cluster-info &>/dev/null; then
    err "Cannot connect to Kubernetes cluster. Configure kubectl first."
    exit 1
fi
ok "Cluster reachable"

# Switch context if specified
if [ -n "${K8S_CONTEXT:-}" ]; then
    kubectl config use-context "${K8S_CONTEXT}"
    ok "Using context: ${K8S_CONTEXT}"
fi

if [ -z "$REGION" ]; then
    err "Region is required. Use --region=india|us|uk|all"
    exit 1
fi

if [ "$MODE" = "deploy" ] && [ "$SKIP_BUILD" = "false" ]; then
    if ! command -v docker &>/dev/null; then
        err "docker not found. Install Docker to build images."
        err "Or use --skip-build if images are already pushed."
        exit 1
    fi
    ok "Docker found"

    if [ -z "$REGISTRY" ]; then
        err "REGISTRY not set in .env. Set it to your container registry URL."
        err "  Example: REGISTRY=gcr.io/your-project"
        err "  Example: REGISTRY=your-account.dkr.ecr.ap-south-1.amazonaws.com"
        exit 1
    fi
    ok "Registry: ${REGISTRY}"
fi

if [ -n "$DOMAIN" ]; then
    ok "Domain: ${DOMAIN}"
else
    warn "No DOMAIN in .env — ingress will use default host"
fi

# ── Destroy Mode ──────────────────────────────────────────────────────────────
if [ "$MODE" = "destroy" ]; then
    step "Destroying Deployment"

    destroy_region() {
        local region="$1"
        local ns="recovery-pilot-${region}"

        if kubectl get namespace "$ns" &>/dev/null; then
            echo "  Deleting namespace ${ns}..."
            kubectl delete namespace "$ns" --timeout=120s
            ok "Namespace ${ns} deleted"
        else
            warn "Namespace ${ns} does not exist"
        fi
    }

    if [ "$REGION" = "all" ]; then
        for r in india us uk; do
            destroy_region "$r"
        done
        # Also destroy base namespace if it exists
        if kubectl get namespace recovery-pilot &>/dev/null; then
            kubectl delete namespace recovery-pilot --timeout=120s
            ok "Base namespace deleted"
        fi
    else
        destroy_region "$REGION"
    fi

    ok "Destroy complete"
    exit 0
fi

# =============================================================================
# DEPLOY MODE
# =============================================================================

# ── Step 1: Build & Push Docker Images ────────────────────────────────────────
if [ "$SKIP_BUILD" = "false" ]; then
    step "Step 1/5 — Building Docker Images"

    API_IMAGE="${REGISTRY}/recovery-pilot-api:${IMAGE_TAG}"
    FRONTEND_IMAGE="${REGISTRY}/recovery-pilot-frontend:${IMAGE_TAG}"

    echo "  Building API image..."
    docker build \
        --target backend \
        --tag "${API_IMAGE}" \
        --file "${SCRIPT_DIR}/Dockerfile" \
        "${SCRIPT_DIR}"
    ok "API image built: ${API_IMAGE}"

    echo "  Building Frontend image..."
    docker build \
        --target frontend \
        --tag "${FRONTEND_IMAGE}" \
        --file "${SCRIPT_DIR}/Dockerfile" \
        "${SCRIPT_DIR}"
    ok "Frontend image built: ${FRONTEND_IMAGE}"

    step "Step 2/5 — Pushing Images to Registry"
    docker push "${API_IMAGE}"
    ok "Pushed ${API_IMAGE}"
    docker push "${FRONTEND_IMAGE}"
    ok "Pushed ${FRONTEND_IMAGE}"
else
    step "Step 1/5 — Skipping Image Build (--skip-build)"
    API_IMAGE="${REGISTRY}/recovery-pilot-api:${IMAGE_TAG}"
    FRONTEND_IMAGE="${REGISTRY}/recovery-pilot-frontend:${IMAGE_TAG}"
    ok "Using existing images: ${IMAGE_TAG}"
fi

# ── Step 2: Install Prerequisites (cert-manager, ingress-nginx) ──────────────
step "Step 3/5 — Cluster Prerequisites"

# Install ingress-nginx if not present
if ! kubectl get namespace ingress-nginx &>/dev/null; then
    echo "  Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/cloud/deploy.yaml
    echo "  Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=120s 2>/dev/null || warn "Ingress controller still starting"
    ok "NGINX Ingress Controller installed"
else
    ok "NGINX Ingress Controller already installed"
fi

# Install cert-manager if not present
if ! kubectl get namespace cert-manager &>/dev/null; then
    echo "  Installing cert-manager for auto-TLS..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.1/cert-manager.yaml
    echo "  Waiting for cert-manager..."
    kubectl wait --namespace cert-manager \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/instance=cert-manager \
        --timeout=120s 2>/dev/null || warn "cert-manager still starting"
    ok "cert-manager installed"
else
    ok "cert-manager already installed"
fi

# Create Let's Encrypt ClusterIssuer
kubectl apply -f - <<ISSUEREOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@${DOMAIN:-recoverypilot.health}
    privateKeySecretRef:
      name: letsencrypt-prod-account
    solvers:
      - http01:
          ingress:
            class: nginx
ISSUEREOF
ok "Let's Encrypt ClusterIssuer configured"

# ── Step 3: Deploy Region(s) ─────────────────────────────────────────────────
step "Step 4/5 — Deploying Application"

deploy_region() {
    local region="$1"
    local overlay_dir="${K8S_DIR}/overlays/${region}"

    if [ ! -d "$overlay_dir" ]; then
        err "Overlay not found: ${overlay_dir}"
        return 1
    fi

    local ns="recovery-pilot-${region}"
    echo ""
    echo "  Deploying to ${ns}..."

    # Create namespace if it doesn't exist
    kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -

    # Generate secrets for this region
    local jwt_secret
    local session_secret
    local encryption_key
    jwt_secret=$(openssl rand -hex 32)
    session_secret=$(openssl rand -hex 32)
    encryption_key=$(openssl rand -hex 32)

    # Create secrets (only if they don't exist — don't overwrite)
    if ! kubectl get secret recovery-pilot-secrets -n "$ns" &>/dev/null; then
        kubectl create secret generic recovery-pilot-secrets -n "$ns" \
            --from-literal=DB_PRIMARY_HOST="${DB_PRIMARY_HOST:-postgres-primary.${ns}.svc.cluster.local}" \
            --from-literal=DB_PRIMARY_PORT="${DB_PRIMARY_PORT:-5432}" \
            --from-literal=DB_PRIMARY_USER="${DB_PRIMARY_USER:-rp_app}" \
            --from-literal=DB_PRIMARY_PASSWORD="${DB_PRIMARY_PASSWORD:-change_in_production}" \
            --from-literal=REDIS_PRIMARY_PASSWORD="${REDIS_PRIMARY_PASSWORD:-}" \
            --from-literal=JWT_SECRET="${jwt_secret}" \
            --from-literal=SESSION_SECRET="${session_secret}" \
            --from-literal=ENCRYPTION_MASTER_KEY="${encryption_key}" \
            --from-literal=AWS_KMS_KEY_ARN="${AWS_KMS_KEY_ARN:-}" \
            --from-literal=GEMINI_API_KEY="${GEMINI_KEY:-}" \
            --from-literal=SENTRY_DSN="${SENTRY_DSN:-}"
        ok "Secrets created for ${ns}"
    else
        ok "Secrets already exist for ${ns} (not overwritten)"
    fi

    # Apply kustomize overlay with image overrides
    kubectl apply -k "$overlay_dir"

    # Patch deployments with correct image references
    kubectl set image deployment/recovery-pilot-api \
        recovery-pilot-api="${API_IMAGE}" \
        -n "$ns" 2>/dev/null || true

    kubectl set image deployment/recovery-pilot-frontend \
        recovery-pilot-frontend="${FRONTEND_IMAGE}" \
        -n "$ns" 2>/dev/null || true

    # Patch ingress with the actual domain
    if [ -n "$DOMAIN" ]; then
        local region_domain
        case "$region" in
            india) region_domain="${DOMAIN}" ;;
            us)    region_domain="us.${DOMAIN}" ;;
            uk)    region_domain="uk.${DOMAIN}" ;;
        esac

        kubectl patch ingress recovery-pilot-ingress -n "$ns" \
            --type='json' \
            -p="[
                {\"op\": \"replace\", \"path\": \"/spec/tls/0/hosts/0\", \"value\": \"${region_domain}\"},
                {\"op\": \"replace\", \"path\": \"/spec/rules/0/host\", \"value\": \"${region_domain}\"}
            ]" 2>/dev/null || warn "Ingress patch skipped (may need manual host config)"
    fi

    # Wait for rollout
    echo "  Waiting for API deployment rollout..."
    kubectl rollout status deployment/recovery-pilot-api -n "$ns" --timeout=180s 2>/dev/null || warn "Rollout still in progress"

    echo "  Waiting for Frontend deployment rollout..."
    kubectl rollout status deployment/recovery-pilot-frontend -n "$ns" --timeout=120s 2>/dev/null || warn "Rollout still in progress"

    ok "Region ${region} deployed to namespace ${ns}"
}

if [ "$REGION" = "all" ]; then
    for r in india us uk; do
        deploy_region "$r"
    done
else
    deploy_region "$REGION"
fi

# ── Step 4: Verify Deployment ─────────────────────────────────────────────────
step "Step 5/5 — Verification"

verify_region() {
    local region="$1"
    local ns="recovery-pilot-${region}"

    echo ""
    echo "  ${BOLD}${region}${NC} (namespace: ${ns}):"

    # Pod status
    local ready_pods
    ready_pods=$(kubectl get pods -n "$ns" --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    local total_pods
    total_pods=$(kubectl get pods -n "$ns" --no-headers 2>/dev/null | wc -l)
    echo "    Pods: ${ready_pods}/${total_pods} running"

    # HPA status
    local hpa_info
    hpa_info=$(kubectl get hpa -n "$ns" --no-headers 2>/dev/null | head -1)
    if [ -n "$hpa_info" ]; then
        echo "    HPA:  $(echo "$hpa_info" | awk '{print $6 "/" $5 " (min/max: " $4 "/" $5 ")"}')"
    fi

    # Ingress
    local ingress_ip
    ingress_ip=$(kubectl get ingress recovery-pilot-ingress -n "$ns" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    echo "    Ingress IP: ${ingress_ip:-pending}"
}

if [ "$REGION" = "all" ]; then
    for r in india us uk; do
        if kubectl get namespace "recovery-pilot-${r}" &>/dev/null; then
            verify_region "$r"
        fi
    done
else
    verify_region "$REGION"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e "  ${GREEN}${BOLD}RecoveryPilot Kubernetes Deployment Complete!${NC}"
echo "============================================================"
echo ""

if [ -n "$DOMAIN" ]; then
    echo "  Endpoints:"
    if [ "$REGION" = "all" ] || [ "$REGION" = "india" ]; then
        echo "    India:  https://${DOMAIN}"
    fi
    if [ "$REGION" = "all" ] || [ "$REGION" = "us" ]; then
        echo "    US:     https://us.${DOMAIN}"
    fi
    if [ "$REGION" = "all" ] || [ "$REGION" = "uk" ]; then
        echo "    UK:     https://uk.${DOMAIN}"
    fi
    echo ""
fi

echo "  Commands:"
echo "    Status:     bash autodeploy-k8s.sh --status"
echo "    Redeploy:   bash autodeploy-k8s.sh --region=${REGION}"
echo "    Destroy:    bash autodeploy-k8s.sh --destroy --region=${REGION}"
echo "    Pod logs:   kubectl logs -n recovery-pilot-${REGION} -l app=recovery-pilot-api -f"
echo "    Pod shell:  kubectl exec -it -n recovery-pilot-${REGION} deploy/recovery-pilot-api -- sh"
echo ""
echo "============================================================"
