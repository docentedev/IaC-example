# ------------------------------------------------------------
# Dockerfile estandar
# Patron: multi-stage build (builder -> runner)
# Objetivo:
# - builder: instalar dependencias y generar artefactos
# - runner: ejecutar con la imagen mas liviana posible
# ------------------------------------------------------------

# Stage builder: instala dependencias y artefactos de build.
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /workspace

COPY gradlew gradlew.bat build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN chmod +x gradlew
RUN ./gradlew clean bootJar --no-daemon

# Stage runner: contiene solo lo necesario para ejecutar el servicio.
FROM eclipse-temurin:25-jre-alpine AS runner
WORKDIR /app

COPY --from=builder /workspace/build/libs/product-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 4020
ENTRYPOINT ["java", "-jar", "app.jar"]
