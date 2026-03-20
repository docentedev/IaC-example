#!/usr/bin/env bash
# deploy-all.sh — Despliega el laboratorio completo, fase por fase.
# Incluye: build de imágenes, namespace, microservicios, API Gateway,
#          frontend React y auth-service JWT.
#
# Uso: bash scripts/deploy-all.sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

# ─────────────────────────────────────────────
wait_pods() {
  echo "  Esperando que todos los pods estén Running..."
  kubectl wait --for=condition=Ready pods --all -n microservicios \
    --timeout=120s 2>/dev/null || true
  kubectl get pods -n microservicios
}
# ─────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
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
echo ">>> FASE 4: Build de imágenes de microservicios..."
docker build -t products-java:1.0 ./products-java
docker build -t users-nodejs:1.0  ./users-nodejs
echo "  ✅ Imágenes de microservicios construidas"
echo ""

echo ">>> FASE 4: Desplegando namespace y microservicios..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f users-nodejs/k8s/pvc.yaml
kubectl apply -f products-java/k8s/deployment.yaml
kubectl apply -f users-nodejs/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik.yaml
wait_pods
echo "  ✅ Fase 4 completa — http://micro.local/api/products"
echo ""

# ── Fase 5: API Gateway + Frontend ──────────────────────────────────────
echo ">>> FASE 5: Build de imagen frontend..."
docker build -t frontend-react:1.0 ./frontend-react
echo "  ✅ Imagen frontend construida"
echo ""

echo ">>> FASE 5: Desplegando KrakenD y frontend..."
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl apply -f krakend/k8s/deployment.yaml
kubectl apply -f frontend-react/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik-v2-gateway.yaml
wait_pods
echo "  ✅ Fase 5 completa — http://micro.local"
echo ""

# ── Fase 6: Auth Service ─────────────────────────────────────────────────
echo ">>> FASE 6: Build de imagen auth-service..."
docker build -t auth-service:1.0 ./auth-service
echo "  ✅ Imagen auth-service construida"
echo ""

echo ">>> FASE 6: Desplegando auth-service + PostgreSQL..."
kubectl apply -f auth-service/k8s/secrets.yaml
kubectl apply -f auth-service/k8s/postgres.yaml
kubectl apply -f auth-service/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik-v3-gateway-auth.yaml
wait_pods
echo "  ✅ Fase 6 completa — http://micro.local/auth/health"
echo ""

# ── Fase 7: Cart Service ─────────────────────────────────────────────────
echo ">>> FASE 7: Build de imagen cart-service..."
docker build -t cart-service:1.0 ./cart-service
echo "  ✅ Imagen cart-service construida"
echo ""

echo ">>> FASE 7: Desplegando cart-service + PostgreSQL..."
kubectl apply -f cart-service/k8s/secrets.yaml
kubectl apply -f cart-service/k8s/postgres.yaml
kubectl apply -f cart-service/k8s/deployment.yaml
# Aplica la nueva config de KrakenD que incluye los endpoints /api/cart/*
kubectl apply -f krakend/k8s/krakend-config-v2.yaml
kubectl rollout restart deployment krakend -n microservicios
wait_pods
echo "  ✅ Fase 7 completa — http://micro.local/api/cart/health"
echo ""

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
echo "  Auth:       http://micro.local/auth/health"
echo "  Register:   POST http://micro.local/auth/register"
echo "  Login:      POST http://micro.local/auth/login"
echo "  Cart:       GET  http://micro.local/api/cart         (JWT requerido)"
echo "  Cart:       POST http://micro.local/api/cart/items   (JWT requerido)"
echo ""
