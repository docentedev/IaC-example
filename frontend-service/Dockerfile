# ─────────────────────────────────────────────
# Stage 1: Build del proyecto React con Vite
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar solo los archivos de dependencias primero para aprovechar
# la cache de Docker. Las dependencias solo se reinstalan si
# package.json o package-lock.json cambian.
COPY package*.json ./
RUN npm install

# Copiar el resto del codigo fuente y ejecutar el build.
# Vite genera los archivos estaticos en /app/dist
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Servir los archivos estaticos con nginx
# ─────────────────────────────────────────────
FROM nginx:alpine

# Copiar el resultado del build desde el stage anterior.
# Solo se copia el directorio dist, el resto (node_modules, src, etc.)
# queda fuera de la imagen final.
COPY --from=builder /app/dist /usr/share/nginx/html

# Reemplazar la configuracion por defecto de nginx con la custom
# que soporta React Router (fallback a index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
