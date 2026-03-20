# Quick Start — Comandos para copiar y pegar

> Guía sin explicaciones. Leer `README.md` primero si es tu primera vez.

---

## 0) Pre-flight check

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

## 0.1) Agregar micro.local al archivo hosts

**macOS / Linux:**
```bash
echo "127.0.0.1 micro.local" | sudo tee -a /etc/hosts
```

**Windows (PowerShell como Administrador):**
```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 micro.local"
```

---

## Fase 4 — Kubernetes (solo microservicios)

### Build de imágenes
```bash
docker build -t products-java:1.0 ./products-java
docker build -t users-nodejs:1.0 ./users-nodejs
```

### Despliegue
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f users-nodejs/k8s/pvc.yaml
kubectl apply -f products-java/k8s/deployment.yaml
kubectl apply -f users-nodejs/k8s/deployment.yaml
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

## Fase 5 — API Gateway (KrakenD) + Frontend React

### Build de imágenes
```bash
docker build -t frontend-react:1.0 ./frontend-react
```
> KrakenD usa imagen oficial, no necesita build local.

### Despliegue
```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl apply -f krakend/k8s/deployment.yaml
kubectl apply -f frontend-react/k8s/deployment.yaml
kubectl apply -f k8s/ingress-traefik-v2-gateway.yaml
```

### Verificar
```bash
kubectl get pods -n microservicios
```
Deben aparecer 4 pods en `Running`: `frontend-react`, `krakend`, `products-java`, `users-nodejs`.

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

---

## Actualizar config de KrakenD (después de editar krakend-config.yaml)

```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl rollout restart deployment/krakend -n microservicios
kubectl rollout status deployment/krakend -n microservicios
```

---

## Rollback: volver de Fase 5 → Fase 4

```bash
kubectl apply -f k8s/ingress-traefik.yaml
kubectl delete -f frontend-react/k8s/deployment.yaml --ignore-not-found
kubectl delete -f krakend/k8s/deployment.yaml --ignore-not-found
kubectl delete -f krakend/k8s/krakend-config.yaml --ignore-not-found
```

---

## Limpieza total (desde cero)

```bash
kubectl delete -f k8s/ingress-traefik-v2-gateway.yaml --ignore-not-found
kubectl delete -f k8s/ingress-traefik.yaml --ignore-not-found
kubectl delete -f frontend-react/k8s/deployment.yaml --ignore-not-found
kubectl delete -f krakend/k8s/deployment.yaml --ignore-not-found
kubectl delete -f krakend/k8s/krakend-config.yaml --ignore-not-found
kubectl delete -f users-nodejs/k8s/deployment.yaml --ignore-not-found
kubectl delete -f products-java/k8s/deployment.yaml --ignore-not-found
kubectl delete -f users-nodejs/k8s/pvc.yaml --ignore-not-found
kubectl delete -f k8s/namespace.yaml --ignore-not-found
docker rmi -f products-java:1.0 users-nodejs:1.0 frontend-react:1.0 2>/dev/null || true
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

## Comandos de diagnóstico útiles

```bash
kubectl get all -n microservicios
kubectl get pods -n microservicios
kubectl logs -f deployment/krakend -n microservicios
kubectl logs -f deployment/frontend-react -n microservicios
kubectl logs -f deployment/products-java -n microservicios
kubectl logs -f deployment/users-nodejs -n microservicios
kubectl describe pod -n microservicios <nombre-pod>
kubectl get events -n microservicios --sort-by=.metadata.creationTimestamp
```
