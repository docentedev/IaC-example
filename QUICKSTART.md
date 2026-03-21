# Quick Start — Comandos para copiar y pegar

> Guía sin explicaciones. Leer `README.md` primero si es tu primera vez.

> Nota pedagógica: para este curso se mantienen separadas las configuraciones de KrakenD
> (`krakend-config.yaml`, `krakend-config-v2.yaml`, `krakend-config-v3-circuit-breaker.yaml`)
> para trabajar por etapas incrementales sin romper ejercicios previos.

---

## 0) Docker (sin Compose)

### Build de imágenes
```bash
docker build -t product-service:1.0 ./product-service
docker build -t user-service:1.0 ./user-service
```

### Levantar contenedores
```bash
docker run -d --name product-service -p 4020:4020 product-service:1.0

docker run -d --name user-service -p 4021:4021 \
  -v $(pwd)/user-service/data/data.json:/app/data/data.json \
  user-service:1.0
```

Windows (Git Bash):
```bash
MSYS_NO_PATHCONV=1 docker run -d --name user-service -p 4021:4021 \
  -v $(pwd)/user-service/data/data.json:/app/data/data.json \
  user-service:1.0
```

### Probar
```bash
curl http://localhost:4020/api/products
curl http://localhost:4021/api/users
```

### Bajar
```bash
docker rm -f product-service user-service
```

---

## 1) Docker Compose

### Levantar
```bash
docker compose up --build -d
```

### Probar
```bash
curl http://localhost:4020/api/products
curl http://localhost:4021/api/users
```

Frontend (compose):
```bash
open http://localhost:8081
```

### Bajar
```bash
docker compose down
```

### Limpieza Compose

Parcial (solo bajar contenedores y red del compose actual):
```bash
docker compose down --remove-orphans
```

Total del proyecto compose (borra contenedores, red, volúmenes e imágenes locales construidas por compose):
```bash
docker compose down --volumes --remove-orphans --rmi local
```

Reset global Docker (agresivo: afecta todos tus proyectos):
```bash
docker system prune -af --volumes
```

Verificación después de limpiar compose:
```bash
docker compose ps
docker volume ls | grep microservicios || true
docker images | grep microservicios || true
```

---

## 2) Pre-flight Kubernetes

### Verificar que el cluster está corriendo
```bash
kubectl cluster-info
kubectl get nodes
```
Si ves `connection refused`, abrí Docker Desktop o Rancher Desktop y esperá que Kubernetes esté en verde antes de continuar.

### Verificar contexto activo
```bash
kubectl config current-context        # docker-desktop o rancher-desktop
```

### Verificar que Traefik está instalado
```bash
kubectl get ingressclass
```
Debe aparecer `traefik`. 

> **Docker Desktop y Rancher Desktop** incluyen Traefik pre-instalado — siempre aparece, no hay que hacer nada.  
> Si usás `minikube` o `kind` y no aparece, consultá la sección 4.1.5 del README.

---

## 2.1) Agregar micro.local al archivo hosts

**macOS / Linux:**
```bash
echo "127.0.0.1 micro.local" | sudo tee -a /etc/hosts
```

**Windows (PowerShell como Administrador):**
```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 micro.local"
```

---

## 3) Kubernetes base (solo microservicios)

### Build de imágenes
```bash
docker build -t product-service:1.0 ./product-service
docker build -t user-service:1.0 ./user-service
```

### Despliegue
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f user-service/k8s/pvc.yaml
kubectl apply -f product-service/k8s/deployment.yaml
kubectl apply -f user-service/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik.yaml
```

### Verificar
```bash
kubectl get pods -n microservicios
```
Esperar que todos estén `Running`.

### Probar
```bash
curl http://micro.local/api/products
curl http://micro.local/api/users
curl http://micro.local/api/users/1
curl http://micro.local/health
```

---

## 4) API Gateway (KrakenD) + Frontend React

### Build de imágenes
```bash
docker build -t frontend-service:1.0 ./frontend-service
```
> KrakenD usa imagen oficial, no necesita build local.

### Despliegue
```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl apply -f krakend/k8s/deployment.yaml
kubectl apply -f frontend-service/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik-v2-gateway.yaml
```

### Verificar
```bash
kubectl get pods -n microservicios
```
Deben aparecer 4 pods en `Running`: `frontend-service`, `krakend`, `product-service`, `user-service`.

### Probar
```bash
curl http://micro.local/api/products
curl http://micro.local/api/users
curl http://micro.local/health
```
```
# Abrir en el navegador:
http://micro.local
```

Nota: en la sección 4 ya verás los formularios de login y registro en el frontend,
pero el backend de auth aún no está desplegado; se activa en la sección 5.

---

## 5) Auth Service (JWT + PostgreSQL)

### Build de imagen
```bash
docker build -t auth-service:1.0 ./auth-service
```

### Despliegue
```bash
kubectl apply -f auth-service/k8s/secrets.yaml
kubectl apply -f auth-service/k8s/postgres.yaml
kubectl apply -f auth-service/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik-v3-gateway-auth.yaml
```

### Verificar
```bash
kubectl get pods -n microservicios
```
Deben aparecer en `Running`:
- `auth-postgres`
- `auth-service`

### Probar
```bash
# Registrar usuario
curl -X POST http://micro.local/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana","lastName":"Gomez","email":"ana@duoc.cl","username":"ana","password":"123456"}'

# Login
curl -X POST http://micro.local/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ana","password":"123456"}'

# Perfil autenticado vía gateway
TOKEN=$(curl -s -X POST http://micro.local/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ana","password":"123456"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

curl -H "Authorization: Bearer $TOKEN" http://micro.local/auth/me
```
```
# Abrir en el navegador (formularios integrados en el frontend):
http://micro.local
```

---

## 6) Cart Service (FastAPI/Python + comunicación inter-microservicio)

> El cart-service demuestra comunicación inter-microservicio: cuando pedís `GET /api/cart`,
> el cart-service llama internamente a `product-service:4020` para enriquecer cada ítem con
> nombre y precio real. Todo dentro del cluster de Kubernetes, sin pasar por el API Gateway.

### Build de imagen
```bash
docker build -t cart-service:1.0 ./cart-service
```

### Despliegue
```bash
kubectl apply -f cart-service/k8s/secrets.yaml
kubectl apply -f cart-service/k8s/postgres.yaml
kubectl apply -f cart-service/k8s/deployment.yaml
# Aplica la config KrakenD v2 (agrega endpoints /api/cart/*)
kubectl apply -f krakend/k8s/krakend-config-v2.yaml
kubectl rollout restart deployment krakend -n microservicios
```

### Verificar
```bash
kubectl get pods -n microservicios
```
Deben aparecer en `Running`:
- `cart-postgres`
- `cart-service`

### Probar con curl
```bash
# Health (sin JWT)
curl http://micro.local/api/cart/health

# Obtener token primero (login)
TOKEN=$(curl -s -X POST http://micro.local/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ana","password":"123456"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

# Ver carrito (vacío al inicio)
curl -H "Authorization: Bearer $TOKEN" http://micro.local/api/cart

# Agregar producto al carrito
curl -X POST http://micro.local/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"product_id": 1, "quantity": 2}'

# Ver carrito con productos enriquecidos
curl -H "Authorization: Bearer $TOKEN" http://micro.local/api/cart

# Vaciar carrito
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://micro.local/api/cart
```

```
# En el navegador, después de iniciar sesión, los botones "🛒 Agregar" de cada producto
# quedan habilitados y el panel de carrito aparece en tiempo real:
http://micro.local
```

---

## 6.1) Opcional — KrakenD con Circuit Breaker (incremental)

> Esta etapa es opcional y no reemplaza las fases anteriores.
> Se recomienda aplicarla después de la sección 6 para no alterar ejercicios previos.

### Aplicar configuración v3 (con Circuit Breaker)
```bash
kubectl apply -f krakend/k8s/krakend-config-v3-circuit-breaker.yaml
kubectl rollout restart deployment krakend -n microservicios
```

### Verificar cambios de estado del Circuit Breaker
```bash
kubectl logs -f deployment/krakend -n microservicios | grep cb-
```

### Volver a la configuración anterior (sin Circuit Breaker)
```bash
kubectl apply -f krakend/k8s/krakend-config-v2.yaml
kubectl rollout restart deployment krakend -n microservicios
```

---

## Rollback

### 6 → 5 (remover cart-service)
```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl rollout restart deployment krakend -n microservicios
kubectl delete -f cart-service/k8s/deployment.yaml --ignore-not-found
kubectl delete -f cart-service/k8s/postgres.yaml   --ignore-not-found
kubectl delete -f cart-service/k8s/secrets.yaml    --ignore-not-found
```

### 5 → 4 (remover auth-service)
```bash
kubectl apply -f k8s/ingress-traefik-v2-gateway.yaml
kubectl delete -f auth-service/k8s/deployment.yaml --ignore-not-found
kubectl delete -f auth-service/k8s/postgres.yaml   --ignore-not-found
kubectl delete -f auth-service/k8s/secrets.yaml    --ignore-not-found
```

### 4 → 3 (remover API Gateway + Frontend)
```bash
kubectl apply -f k8s/ingress-traefik.yaml
kubectl delete -f frontend-service/k8s/deployment.yaml  --ignore-not-found
kubectl delete -f krakend/k8s/deployment.yaml         --ignore-not-found
kubectl delete -f krakend/k8s/krakend-config.yaml     --ignore-not-found
```

---

## Limpieza total (desde cero)

### Limpieza Kubernetes (desde cero)

Atajo recomendado:
```bash
bash scripts/teardown.sh
```

Comportamiento por defecto del script:
- Elimina despliegues/ingress del laboratorio.
- Conserva datos de Kubernetes (PVC y namespace) para redeploy rapido.
- Conserva imagenes Docker y volumenes para redeploy rapido.

Limpieza profunda opcional (solo si se indica por parametro):
```bash
bash scripts/teardown.sh --delete-images    # borra imagenes locales del laboratorio
bash scripts/teardown.sh --delete-volumes   # borra volumenes Docker del laboratorio
bash scripts/teardown.sh --delete-k8s-data  # borra datos persistentes en Kubernetes (PVC/namespace)
bash scripts/teardown.sh --full-clean       # borra TODO: k8s data + imagenes + volumenes
```

O manualmente:
```bash
kubectl delete -f k8s/ingress-traefik-v3-gateway-auth.yaml --ignore-not-found
kubectl delete -f k8s/ingress-traefik-v2-gateway.yaml       --ignore-not-found
kubectl delete -f k8s/ingress-traefik.yaml                  --ignore-not-found
kubectl delete -f cart-service/k8s/deployment.yaml --ignore-not-found
kubectl delete -f cart-service/k8s/postgres.yaml   --ignore-not-found
kubectl delete -f cart-service/k8s/secrets.yaml    --ignore-not-found
kubectl delete -f auth-service/k8s/deployment.yaml --ignore-not-found
kubectl delete -f auth-service/k8s/postgres.yaml   --ignore-not-found
kubectl delete -f auth-service/k8s/secrets.yaml    --ignore-not-found
kubectl delete -f frontend-service/k8s/deployment.yaml   --ignore-not-found
kubectl delete -f krakend/k8s/deployment.yaml          --ignore-not-found
kubectl delete -f krakend/k8s/krakend-config-v2.yaml   --ignore-not-found
kubectl delete -f krakend/k8s/krakend-config.yaml      --ignore-not-found
kubectl delete -f user-service/k8s/deployment.yaml  --ignore-not-found
kubectl delete -f product-service/k8s/deployment.yaml --ignore-not-found
kubectl delete -f user-service/k8s/pvc.yaml         --ignore-not-found
kubectl delete -f k8s/namespace.yaml --ignore-not-found
docker rmi -f product-service:1.0 user-service:1.0 frontend-service:1.0 auth-service:1.0 cart-service:1.0 2>/dev/null || true
```

**Eliminar micro.local del archivo hosts:**

macOS / Linux:
```bash
sudo sed -i '' '/micro\.local/d' /etc/hosts
```

Windows (PowerShell como Administrador):
```powershell
(Get-Content "C:\Windows\System32\drivers\etc\hosts") |
  Where-Object { $_ -notmatch 'micro\.local' } |
  Set-Content "C:\Windows\System32\drivers\etc\hosts"
```

---

## Scripts disponibles

```bash
bash scripts/deploy-all.sh   # Despliega todo (k8s: 3 → 4 → 5 → 6)
bash scripts/teardown.sh     # Baja servicios y conserva datos/imagenes para redeploy rapido
bash scripts/teardown.sh --full-clean  # Limpieza total: Kubernetes (incluye PVC/namespace) + imagenes + volumenes
```

---

## Comandos de diagnóstico útiles

```bash
kubectl get all -n microservicios
kubectl get pods -n microservicios
kubectl logs -f deployment/krakend        -n microservicios
kubectl logs -f deployment/frontend-service -n microservicios
kubectl logs -f deployment/product-service  -n microservicios
kubectl logs -f deployment/user-service   -n microservicios
kubectl logs -f deployment/auth-service   -n microservicios
kubectl logs -f deployment/auth-postgres  -n microservicios
kubectl logs -f deployment/cart-service   -n microservicios
kubectl logs -f deployment/cart-postgres  -n microservicios
kubectl describe pod -n microservicios <nombre-pod>
kubectl get events -n microservicios --sort-by=.metadata.creationTimestamp
```

**Si modificaste krakend-config.yaml (después de despliegue):**

```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl rollout restart deployment/krakend -n microservicios
```
