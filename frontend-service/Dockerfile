# ------------------------------------------------------------
# Dockerfile estandar
# Patron: multi-stage build (builder -> runner)
# Objetivo:
# - builder: instalar dependencias y generar artefactos
# - runner: ejecutar con la imagen mas liviana posible
# ------------------------------------------------------------

# Stage builder: instala dependencias y artefactos de build.
FROM node:20-alpine AS builder

WORKDIR /app

# Copia primero manifiestos para aprovechar cache de capas.
COPY package*.json ./
RUN npm ci

# Copia el codigo fuente y genera los estaticos en /app/dist.
COPY . .
RUN npm run build

# Stage runner: contiene solo lo necesario para ejecutar el servicio.
FROM nginx:alpine AS runner

# Copia solo los estaticos construidos y configuracion de nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
