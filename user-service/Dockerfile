# ------------------------------------------------------------
# Dockerfile estandar
# Patron: multi-stage build (builder -> runner)
# Objetivo:
# - builder: instalar dependencias y generar artefactos
# - runner: ejecutar con la imagen mas liviana posible
# ------------------------------------------------------------

# Stage builder: instala dependencias y artefactos de build.
FROM node:20-alpine AS builder
WORKDIR /workspace

COPY package*.json ./
RUN npm install --omit=dev

# Stage runner: contiene solo lo necesario para ejecutar el servicio.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /workspace/node_modules ./node_modules

COPY src ./src
COPY data ./data
COPY package*.json ./

EXPOSE 4021
CMD ["npm", "start"]
