# TESTING.md

Guía de pruebas para el microservicio Java `products-java`, incluyendo reporte de cobertura.

## Objetivo

- Ejecutar tests automáticos de la API Java.
- Generar informe de cobertura con JaCoCo.
- Entender qué partes del código están cubiertas y cuáles no.

## Qué se agregó

- **Tests unitarios de servicio**: `products-java/src/test/java/com/duoc/products/service/ProductServiceTest.java`
  - Caso con datos en repositorio.
  - Caso fallback a mock cuando repositorio está vacío.
  - Búsqueda por ID existente/no existente.

- **Tests web del controlador**: `products-java/src/test/java/com/duoc/products/controller/ProductControllerTest.java`
  - `GET /api/products` retorna 200 y listado.
  - `GET /api/products/{id}` retorna 200 cuando existe.
  - `GET /api/products/{id}` retorna 404 cuando no existe.

- **Cobertura JaCoCo en Gradle**: configurada en `products-java/build.gradle`.

Nota técnica (Java 25):
- Se mantiene Java 25.
- Se usa **JaCoCo 0.8.14**, versión con soporte oficial para Java 25.

## Librerías de testing usadas (Spring Boot)

Esta sección explica qué librerías están activas en este proyecto, cómo se configuran en Gradle y para qué se usan en los tests actuales.

### 1) `spring-boot-starter-test`

Configuración en Gradle:

```gradle
dependencies {
  testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

Para qué sirve:
- Es el paquete principal de testing en Spring Boot.
- Agrupa dependencias típicas de prueba en un solo starter.
- En la práctica incluye JUnit 5, Mockito y Spring Test (entre otras utilidades).

### 2) JUnit 5 (motor de ejecución de tests)

Configuración en Gradle:

```gradle
tasks.named('test') {
  useJUnitPlatform()
}
```

Para qué sirve:
- Ejecuta métodos anotados con `@Test`.
- Permite estructurar suites de pruebas modernas en Java.

### 3) Mockito (mocks de dependencias)

Configuración:
- Se incluye automáticamente a través de `spring-boot-starter-test`.

Para qué sirve:
- Simular dependencias para aislar unidades de código.
- En este proyecto se usa para mockear `ProductRepository` y `ProductService`.
- Permite definir comportamientos con `when(...).thenReturn(...)`.

### 4) Spring Test + MockMvc (pruebas HTTP sin servidor real)

Configuración:
- También viene dentro de `spring-boot-starter-test`.

Para qué sirve:
- Probar endpoints del controlador sin levantar Tomcat/Netty real.
- En este proyecto se usa con `@WebMvcTest(ProductController.class)` y `MockMvc`.

### 5) JaCoCo (reporte de cobertura)

Configuración en Gradle:

```gradle
plugins {
  id 'jacoco'
}

jacoco {
  toolVersion = '0.8.14'
}

tasks.named('test') {
  useJUnitPlatform()
  finalizedBy tasks.named('jacocoTestReport')
}

tasks.named('jacocoTestReport') {
  dependsOn tasks.named('test')
  reports {
    xml.required = true
    html.required = true
    csv.required = false
  }
}
```

Para qué sirve:
- Calcula cobertura de código después de ejecutar tests.
- Genera reporte HTML (visual) y XML (CI/automatización).

### 6) Lombok en tests (apoyo a código de prueba)

Configuración en Gradle:

```gradle
compileOnly 'org.projectlombok:lombok:1.18.40'
annotationProcessor 'org.projectlombok:lombok:1.18.40'

testCompileOnly 'org.projectlombok:lombok:1.18.40'
testAnnotationProcessor 'org.projectlombok:lombok:1.18.40'
```

Para qué sirve:
- Habilita `builder`, getters y otros atajos también dentro del código de test.
- En este proyecto simplifica la creación de DTOs de prueba (`ProductDto.builder(...)`).

### Bloque mínimo recomendado para testing en Spring Boot

Si quieres empezar desde cero en otro proyecto, este es el mínimo:

```gradle
dependencies {
  testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
  useJUnitPlatform()
}
```

Si además quieres cobertura, agrega JaCoCo como en la sección 5.

## Comandos para ejecutar

Desde la raíz del repo:

```bash
cd products-java
./gradlew clean test jacocoTestReport
```

En Windows (PowerShell/CMD):

```powershell
cd products-java
.\\gradlew.bat clean test jacocoTestReport
```

## Dónde ver el reporte de coverage

Reporte HTML (abrir en navegador):

```text
products-java/build/reports/jacoco/test/html/index.html
```

Reporte XML (útil para CI o integración con herramientas):

```text
products-java/build/reports/jacoco/test/jacocoTestReport.xml
```

## Ver coverage directamente en terminal

Después de ejecutar:

```bash
cd products-java
./gradlew clean test jacocoTestReport
```

puedes mostrar los porcentajes en consola con:

```bash
python3 - <<'PY'
import xml.etree.ElementTree as ET
root = ET.parse('build/reports/jacoco/test/jacocoTestReport.xml').getroot()
counters = {c.attrib['type']: c for c in root.findall('counter')}
for t in ('LINE','BRANCH','METHOD','CLASS'):
  c = counters.get(t)
  if c is None:
    continue
  covered = int(c.attrib['covered'])
  missed = int(c.attrib['missed'])
  total = covered + missed
  pct = (covered * 100.0 / total) if total else 0.0
  print(f'{t:7}: {pct:6.2f}% ({covered}/{total})')
PY
```

Importante:
- Ese comando asume que estás posicionado en `products-java`.
- Si estás en la raíz del repo (`microservicios`), usa esta ruta:

```bash
python3 - <<'PY'
import xml.etree.ElementTree as ET
root = ET.parse('products-java/build/reports/jacoco/test/jacocoTestReport.xml').getroot()
counters = {c.attrib['type']: c for c in root.findall('counter')}
for t in ('LINE','BRANCH','METHOD','CLASS'):
  c = counters.get(t)
  if c is None:
    continue
  covered = int(c.attrib['covered'])
  missed = int(c.attrib['missed'])
  total = covered + missed
  pct = (covered * 100.0 / total) if total else 0.0
  print(f'{t:7}: {pct:6.2f}% ({covered}/{total})')
PY
```

Salida esperada (ejemplo):

```text
LINE   :  96.15% (50/52)
BRANCH : 100.00% (4/4)
METHOD :  91.67% (11/12)
CLASS  : 100.00% (3/3)
```

## Cómo interpretar rápidamente la cobertura

- **Line coverage**: porcentaje de líneas ejecutadas por los tests.
- **Branch coverage**: porcentaje de caminos lógicos (if/else, optional presente/ausente) ejecutados.
- Si un endpoint o caso de error no está probado, aparecerá con cobertura baja.

## Alcance actual

Cubre la lógica principal expuesta de `ProductService` y `ProductController`:

- flujo normal (datos existentes)
- flujo fallback a mocks
- respuestas HTTP 200 y 404

## Siguiente mejora recomendada

- Agregar pruebas de integración completas con contexto Spring + H2 para validar capa repository en conjunto.
- Integrar este comando en un pipeline CI (GitHub Actions) para asegurar calidad en cada push.
