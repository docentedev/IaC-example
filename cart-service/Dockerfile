# ------------------------------------------------------------
# Dockerfile estandar
# Patron: multi-stage build (builder -> runner)
# Objetivo:
# - builder: instalar dependencias y generar artefactos
# - runner: ejecutar con la imagen mas liviana posible
# ------------------------------------------------------------

# Stage builder: instala dependencias y artefactos de build.
FROM python:3.12-slim AS builder
WORKDIR /workspace

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage runner: contiene solo lo necesario para ejecutar el servicio.
FROM python:3.12-slim AS runner
WORKDIR /app

COPY --from=builder /usr/local /usr/local
COPY src/ ./src/

EXPOSE 4022
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "4022"]
