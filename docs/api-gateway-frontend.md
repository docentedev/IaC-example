# Fase 5: API Gateway (KrakenD) + Frontend React estático

Esta fase amplía la arquitectura del laboratorio con dos piezas nuevas:
- **KrakenD** como API Gateway centralizado
- **frontend-react** como cliente web estático servido por nginx

---

## Arquitectura e2e completa

```
Browser (http://micro.local)
        │
        ▼
┌─────────────────────────────┐
│   Traefik Ingress Controller │  ← único punto de entrada al cluster
│        micro.local           │
└────────────┬────────────────┘
             │
    ┌────────┴──────────┐
    │                   │
    ▼                   ▼
┌──────────┐     ┌─────────────────────────┐
│  nginx   │     │        KrakenD          │
│  (pod)   │     │    API Gateway (pod)    │
│  /       │     │    /api/**  /health     │
└──────────┘     └────────────┬────────────┘
    │                         │
Sirve archivos          ┌─────┴──────┐
estáticos de React      │            │
(dist/ de Vite)         ▼            ▼
                 products-java   users-nodejs
                  Spring Boot    Express.js
                   :4020           :4021
```

### Rutas del Ingress (Traefik)

| Path         | Destino         | Descripción                            |
|--------------|-----------------|----------------------------------------|
| `/api/**`    | krakend:8080    | Todo el tráfico de API pasa por aquí   |
| `/health`    | krakend:8080    | Health check (KrakenD lo proxea)       |
| `/`          | frontend-react:80 | App React (nginx estático)           |

---

## Piezas nuevas

### KrakenD (API Gateway)

**Por qué existe:** Traefik ya enruta tráfico, pero KrakenD agrega la
capa de *API management* que Traefik no cubre:

- Rate limiting por consumidor o endpoint
- Transformación de requests/responses
- Agregación: un solo endpoint que combina datos de varios microservicios
- Validación de JWT y API Keys centralizada

**Cómo funciona en este cluster:**

```
krakend/
└── k8s/
    ├── krakend-config.yaml   ← ConfigMap con krakend.json (rutas y config)
    └── deployment.yaml       ← Deployment + Service del pod KrakenD
```

KrakenD es **stateless**: no tiene base de datos. Toda su configuración
vive en `krakend.json`, que se versiona en git y se monta en el pod
como un volumen de tipo ConfigMap.

Para actualizar la configuración:
```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl rollout restart deployment/krakend -n microservicios
```

### Frontend React (nginx estático)

**Por qué nginx y no Node.js:** El build de Vite produce HTML + JS + CSS
puros — no necesita un runtime de Node en producción. nginx sirve esos
archivos mucho más eficientemente (menos memoria, sin GC, caché HTTP nativo).

**El Dockerfile usa multi-stage build:**

```
Stage 1: node:20-alpine         Stage 2: nginx:alpine
├── npm ci                      ├── COPY --from=builder /app/dist
├── npm run build               │     /usr/share/nginx/html
└── genera /app/dist/           └── imagen final ~25MB (sin node_modules)
```

Esto significa que `node_modules` (~200MB) **nunca entra a la imagen final**.

```
frontend-react/
├── Dockerfile           ← multi-stage build
├── nginx.conf           ← fallback a index.html para React Router
├── package.json
├── vite.config.js       ← proxy /api → krakend en desarrollo local
├── index.html
├── src/
│   ├── main.jsx
│   └── App.jsx          ← consume /api/products y /api/users
└── k8s/
    └── deployment.yaml  ← Deployment nginx + Service ClusterIP
```

---

## Comandos para levantar la fase 5

### 1. Construir la imagen del frontend

```bash
cd frontend-react
docker build -t frontend-react:1.0 .
```

### 2. Aplicar los manifiestos de KrakenD

```bash
kubectl apply -f krakend/k8s/krakend-config.yaml
kubectl apply -f krakend/k8s/deployment.yaml
```

### 3. Aplicar el manifesto del frontend

```bash
kubectl apply -f frontend-react/k8s/deployment.yaml
```

### 4. Actualizar el Ingress (ya modificado en k8s/ingress-traefik.yaml)

```bash
kubectl apply -f k8s/ingress-traefik.yaml
```

### 5. Verificar que todos los pods estén Running

```bash
kubectl get pods -n microservicios
```

Deberías ver:

```
NAME                              READY   STATUS    RESTARTS
frontend-react-xxxxx              1/1     Running   0
krakend-xxxxx                     1/1     Running   0
products-java-xxxxx               1/1     Running   0
users-nodejs-xxxxx                1/1     Running   0
```

### 6. Abrir el navegador

```
http://micro.local
```

---

## Desarrollo local del frontend (sin cluster)

Para iterar rápido en el frontend sin necesitar Kubernetes:

```bash
# Levantar los microservicios con Docker Compose
docker compose up -d

# En otra terminal, levantar KrakenD local (opcional)
docker run -p 8080:8080 \
  -v $(pwd)/krakend/k8s/krakend.json:/etc/krakend/krakend.json \
  devopsfaith/krakend:2.7 run -c /etc/krakend/krakend.json

# En otra terminal, levantar el frontend
cd frontend-react
npm install
npm run dev
# → http://localhost:3000
```

El `vite.config.js` ya tiene configurado el proxy para que `/api` apunte
a `http://localhost:8080` (KrakenD local) durante el desarrollo.

---

## Script de build completo (actualizar build-images.sh)

Agregar al script `scripts/build-images.sh` la línea del frontend:

```bash
docker build -t frontend-react:1.0 ./frontend-react
```
