#!/usr/bin/env bash
# teardown.sh — Limpia recursos del laboratorio.
# Modo por defecto: conserva datos (Kubernetes/Docker) e imagenes para redeploy rapido.
# Usa flags para limpieza profunda cuando se requiera.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

DELETE_IMAGES=0
DELETE_VOLUMES=0
DELETE_K8S_DATA=0
NAMESPACE="microservicios"

print_section() {
  echo ""
  echo "=== $1 ==="
  echo ""
}

delete_manifest() {
  kubectl delete -f "$1" --ignore-not-found
}

delete_resource() {
  local kind="$1"
  local name="$2"
  kubectl delete "$kind" "$name" -n "$NAMESPACE" --ignore-not-found
}

delete_postgres_stack() {
  local postgres_manifest="$1"
  local postgres_deployment="$2"
  local postgres_service="$3"

  if [ "$DELETE_K8S_DATA" -eq 1 ]; then
    delete_manifest "$postgres_manifest"
  else
    delete_resource deployment "$postgres_deployment"
    delete_resource service "$postgres_service"
  fi
}

cleanup_images() {
  if [ "$DELETE_IMAGES" -eq 1 ]; then
    print_section "Eliminando imagenes Docker locales del laboratorio"

    docker rmi -f \
      product-service:1.0 \
      user-service:1.0 \
      frontend-service:1.0 \
      auth-service:1.0 \
      cart-service:1.0 \
      2>/dev/null || true

    print_section "Limpiando cache de imagenes sin uso"
    docker image prune -f
  else
    print_section "Imagenes conservadas (modo rapido)"
    echo "Usa --delete-images o --full-clean para eliminarlas."
  fi
}

cleanup_volumes() {
  if [ "$DELETE_VOLUMES" -eq 1 ]; then
    print_section "Eliminando volumenes Docker del laboratorio"

    docker volume rm -f auth-postgres-data cart-postgres-data 2>/dev/null || true
    docker volume prune -f
  else
    print_section "Volumenes conservados (modo rapido)"
    echo "Usa --delete-volumes o --full-clean para eliminarlos."
  fi
}

cleanup_k8s_data_notice() {
  if [ "$DELETE_K8S_DATA" -eq 1 ]; then
    delete_manifest "$ROOT/user-service/k8s/pvc.yaml"
    delete_manifest "$ROOT/k8s/namespace.yaml"
  else
    print_section "Datos de Kubernetes conservados (modo rapido)"
    echo "Se preservan PVC y namespace. Usa --delete-k8s-data o --full-clean para eliminarlos."
  fi
}

print_usage() {
  echo "Uso: ./scripts/teardown.sh [opciones]"
  echo ""
  echo "Opciones:"
  echo "  --delete-images   Elimina imagenes locales del laboratorio y limpia cache de imagenes."
  echo "  --delete-volumes  Elimina volumenes Docker del laboratorio y hace prune de volumenes sin uso."
  echo "  --delete-k8s-data Elimina datos persistentes de Kubernetes (PVC/namespace)."
  echo "  --full-clean      Equivale a --delete-images --delete-volumes --delete-k8s-data."
  echo "  -h, --help        Muestra esta ayuda."
}

for arg in "$@"; do
  case "$arg" in
    --delete-images)
      DELETE_IMAGES=1
      ;;
    --delete-volumes)
      DELETE_VOLUMES=1
      ;;
    --delete-k8s-data)
      DELETE_K8S_DATA=1
      ;;
    --full-clean)
      DELETE_IMAGES=1
      DELETE_VOLUMES=1
      DELETE_K8S_DATA=1
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Error: parametro no reconocido: $arg"
      echo ""
      print_usage
      exit 1
      ;;
  esac
done

print_section "TEARDOWN: Eliminando recursos de Kubernetes"

# Ingress (todas las fases)
for ingress in \
  "$ROOT/k8s/ingress-traefik-v3-gateway-auth.yaml" \
  "$ROOT/k8s/ingress-traefik-v2-gateway.yaml" \
  "$ROOT/k8s/ingress-traefik.yaml"
do
  delete_manifest "$ingress"
done

# Fase 7 — Cart Service
delete_manifest "$ROOT/cart-service/k8s/deployment.yaml"
delete_manifest "$ROOT/cart-service/k8s/secrets.yaml"
delete_postgres_stack "$ROOT/cart-service/k8s/postgres.yaml" "cart-postgres" "cart-postgres"

# Fase 6 — Auth Service
delete_manifest "$ROOT/auth-service/k8s/deployment.yaml"
delete_manifest "$ROOT/auth-service/k8s/secrets.yaml"
delete_postgres_stack "$ROOT/auth-service/k8s/postgres.yaml" "auth-postgres" "auth-postgres"

# Fase 5 — Frontend + KrakenD
for manifest in \
  "$ROOT/frontend-service/k8s/deployment.yaml" \
  "$ROOT/krakend/k8s/deployment.yaml" \
  "$ROOT/krakend/k8s/krakend-config-v2.yaml" \
  "$ROOT/krakend/k8s/krakend-config.yaml"
do
  delete_manifest "$manifest"
done

# Fase 4 — Microservicios
for manifest in \
  "$ROOT/user-service/k8s/deployment.yaml" \
  "$ROOT/product-service/k8s/deployment.yaml"
do
  delete_manifest "$manifest"
done

cleanup_k8s_data_notice
cleanup_images
cleanup_volumes

echo ""
echo "✅ Teardown completo."
echo ""
echo "Para eliminar también la entrada 'micro.local' del archivo hosts:"
echo "  macOS/Linux:  sudo sed -i '' '/micro\\.local/d' /etc/hosts"
echo "  Windows:      eliminar '127.0.0.1 micro.local' de C:\\Windows\\System32\\drivers\\etc\\hosts"
echo ""
