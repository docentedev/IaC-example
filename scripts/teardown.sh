#!/usr/bin/env bash
# teardown.sh — Elimina TODOS los recursos del laboratorio.
# Deja el entorno como si nunca se hubiera desplegado nada.
# Seguro de ejecutar varias veces (--ignore-not-found evita errores si no existen).
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

echo ""
echo "=== TEARDOWN: Eliminando recursos de Kubernetes ==="
echo ""

# Ingress (todas las fases)
kubectl delete -f "$ROOT/k8s/ingress-traefik-v3-gateway-auth.yaml" --ignore-not-found
kubectl delete -f "$ROOT/k8s/ingress-traefik-v2-gateway.yaml"       --ignore-not-found
kubectl delete -f "$ROOT/k8s/ingress-traefik.yaml"                  --ignore-not-found

# Fase 6 — Auth Service
kubectl delete -f "$ROOT/auth-service/k8s/deployment.yaml" --ignore-not-found
kubectl delete -f "$ROOT/auth-service/k8s/postgres.yaml"   --ignore-not-found
kubectl delete -f "$ROOT/auth-service/k8s/secrets.yaml"    --ignore-not-found

# Fase 5 — Frontend + KrakenD
kubectl delete -f "$ROOT/frontend-react/k8s/deployment.yaml"   --ignore-not-found
kubectl delete -f "$ROOT/krakend/k8s/deployment.yaml"          --ignore-not-found
kubectl delete -f "$ROOT/krakend/k8s/krakend-config.yaml"      --ignore-not-found

# Fase 4 — Microservicios
kubectl delete -f "$ROOT/users-nodejs/k8s/deployment.yaml"  --ignore-not-found
kubectl delete -f "$ROOT/products-java/k8s/deployment.yaml" --ignore-not-found
kubectl delete -f "$ROOT/users-nodejs/k8s/pvc.yaml"         --ignore-not-found

# Namespace (elimina todo lo que quede dentro)
kubectl delete -f "$ROOT/k8s/namespace.yaml" --ignore-not-found

echo ""
echo "=== Eliminando imágenes Docker locales ==="
echo ""

docker rmi -f \
  products-java:1.0 \
  users-nodejs:1.0 \
  frontend-react:1.0 \
  auth-service:1.0 \
  2>/dev/null || true

echo ""
echo "=== Limpiando capas Docker sin usar ==="
echo ""

docker image prune -f

echo ""
echo "✅ Teardown completo. El entorno está limpio."
echo ""
echo "Para eliminar también la entrada 'micro.local' del archivo hosts:"
echo "  macOS/Linux:  sudo sed -i '' '/micro\\.local/d' /etc/hosts"
echo "  Windows:      eliminar '127.0.0.1 micro.local' de C:\\Windows\\System32\\drivers\\etc\\hosts"
echo ""
