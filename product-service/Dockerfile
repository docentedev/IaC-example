FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /workspace

COPY gradlew gradlew.bat build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN chmod +x gradlew
RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:25-jre-alpine AS runner
WORKDIR /app

COPY --from=builder /workspace/build/libs/product-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 4020
ENTRYPOINT ["java", "-jar", "app.jar"]
