#!/usr/bin/env bash
# deploy-all.sh — Despliega el laboratorio completo, fase por fase.
# Incluye: build de imágenes, namespace, microservicios, API Gateway,
#          frontend React y auth-service JWT.
#
# Uso: bash scripts/deploy-all.sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
NAMESPACE="microservicios"
cd "$ROOT"

print_section() {
  echo ""
  echo "$1"
}

wait_pods() {
  echo "  Esperando que todos los pods estén Running..."
  kubectl wait --for=condition=Ready pods --all -n "$NAMESPACE" \
    --timeout=120s 2>/dev/null || true
  kubectl get pods -n "$NAMESPACE"
}

build_image() {
  local label="$1"
  local image="$2"
  local context_dir="$3"

  print_section ">>> ${label}"
  docker build -t "$image" "$context_dir"
}

apply_manifests() {
  for manifest in "$@"; do
    kubectl apply -f "$manifest"
  done
}

print_hosts_notice() {
  # ── Hosts ────────────────────────────────────────────────────────────────
  if grep -q "micro.local" /etc/hosts 2>/dev/null; then
    echo "  ✅ micro.local ya está en /etc/hosts"
  else
    echo "  ⚠️  micro.local NO está en /etc/hosts."
    echo "     Ejecuta el siguiente comando y luego vuelve a probar en el navegador:"
    echo ""
    echo "       macOS/Linux:  echo '127.0.0.1 micro.local' | sudo tee -a /etc/hosts"
    echo "       Windows:      Add-Content -Path C:\\Windows\\System32\\drivers\\etc\\hosts -Value '127.0.0.1 micro.local'"
    echo ""
  fi
}

complete_phase() {
  local message="$1"
  wait_pods
  echo "  ✅ ${message}"
  echo ""
}

print_section "╔══════════════════════════════════════════╗"
echo "║  DEPLOY COMPLETO — Laboratorio DUOC      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Pre-flight ──────────────────────────────────────────────────────────
echo ">>> Pre-flight: verificando cluster..."
kubectl cluster-info --request-timeout=5s > /dev/null || {
  echo "❌ Cluster no disponible. Abre Docker Desktop o Rancher Desktop."; exit 1
}
kubectl get ingressclass traefik > /dev/null 2>&1 || {
  echo "⚠️  Traefik no encontrado. Verifica que Kubernetes esté habilitado."; exit 1
}
echo "  ✅ Cluster OK — Traefik disponible"
echo ""

# ── Fase 4: Namespace + Microservicios ──────────────────────────────────
build_image "FASE 4: Build de imagen product-service..." "product-service:1.0" "./product-service"
build_image "FASE 4: Build de imagen user-service..." "user-service:1.0" "./user-service"
echo "  ✅ Imágenes de microservicios construidas"
echo ""

print_section ">>> FASE 4: Desplegando namespace y microservicios..."
apply_manifests \
  k8s/namespace.yaml \
  user-service/k8s/pvc.yaml \
  product-service/k8s/deployment.yaml \
  user-service/k8s/deployment.yaml \
  k8s/ingress-traefik.yaml
complete_phase "Fase 4 completa — http://micro.local/api/products"

# ── Fase 5: API Gateway + Frontend ──────────────────────────────────────
build_image "FASE 5: Build de imagen frontend..." "frontend-service:1.0" "./frontend-service"
echo "  ✅ Imagen frontend construida"
echo ""

print_section ">>> FASE 5: Desplegando KrakenD y frontend..."
apply_manifests \
  krakend/k8s/krakend-config.yaml \
  krakend/k8s/deployment.yaml \
  frontend-service/k8s/deployment.yaml \
  k8s/ingress-traefik-v2-gateway.yaml
complete_phase "Fase 5 completa — http://micro.local"

# ── Fase 6: Auth Service ─────────────────────────────────────────────────
build_image "FASE 6: Build de imagen auth-service..." "auth-service:1.0" "./auth-service"
echo "  ✅ Imagen auth-service construida"
echo ""

print_section ">>> FASE 6: Desplegando auth-service + PostgreSQL..."
apply_manifests \
  auth-service/k8s/secrets.yaml \
  auth-service/k8s/postgres.yaml \
  auth-service/k8s/deployment.yaml \
  k8s/ingress-traefik-v3-gateway-auth.yaml
complete_phase "Fase 6 completa — endpoints auth disponibles en /auth/register, /auth/login y /auth/me"

# ── Fase 7: Cart Service ─────────────────────────────────────────────────
build_image "FASE 7: Build de imagen cart-service..." "cart-service:1.0" "./cart-service"
echo "  ✅ Imagen cart-service construida"
echo ""

print_section ">>> FASE 7: Desplegando cart-service + PostgreSQL..."
apply_manifests \
  cart-service/k8s/secrets.yaml \
  cart-service/k8s/postgres.yaml \
  cart-service/k8s/deployment.yaml
# Aplica la nueva config de KrakenD que incluye los endpoints /api/cart/*
kubectl apply -f krakend/k8s/krakend-config-v2.yaml
kubectl rollout restart deployment krakend -n "$NAMESPACE"
complete_phase "Fase 7 completa — http://micro.local/api/cart/health"

# ── Resumen ──────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ DEPLOY COMPLETO                      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Endpoints disponibles:"
echo "  Frontend:   http://micro.local"
echo "  Products:   http://micro.local/api/products"
echo "  Users:      http://micro.local/api/users"
echo "  KrakenD:    http://micro.local/health"
echo "  Register:   POST http://micro.local/auth/register"
echo "  Login:      POST http://micro.local/auth/login"
echo "  Perfil:     GET  http://micro.local/auth/me      (JWT requerido)"
echo "  Cart:       GET  http://micro.local/api/cart         (JWT requerido)"
echo "  Cart:       POST http://micro.local/api/cart/items   (JWT requerido)"
echo ""

print_hosts_notice
