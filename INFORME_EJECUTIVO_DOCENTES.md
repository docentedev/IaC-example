# Informe Ejecutivo para Docentes

## Proyecto
Laboratorio de microservicios para la especialidad Fullstack 3 (DUOC), diseñado para enseñar de forma progresiva desde ejecución local hasta orquestación en Kubernetes con seguridad y comunicación entre servicios.

## Objetivo académico
Entregar una base práctica y reutilizable para cursos de:
- Arquitectura de microservicios
- DevOps aplicado al desarrollo backend
- Integración de servicios y API Gateway
- Testing y cobertura de código en Java

## Qué contiene el proyecto
- `product-service`: Spring Boot (Java 25), API de productos.
- `user-service`: Express (Node.js), API de usuarios.
- `auth-service`: autenticación con JWT y PostgreSQL.
- `cart-service`: FastAPI (Python), carrito con PostgreSQL y llamada interna a products.
- `frontend-service`: cliente web para flujo end-to-end.
- `krakend`: API Gateway para enrutamiento centralizado de APIs.
- `traefik` por Ingress en Kubernetes para exposición HTTP local con `micro.local`.

## Ruta pedagógica por fases
1. Ejecución manual local (sin Docker).
2. Dockerfiles por servicio.
3. Docker Compose.
4. Kubernetes base (Deployments, Services, PVC, Ingress).
5. API Gateway + Frontend React.
6. Auth Service con JWT.
7. Cart Service con comunicación inter-microservicio.

## Aprendizajes clave que habilita
- Diseño de APIs en stack heterogéneo (Java, Node.js, Python).
- Contenerización y ciclo de vida de imágenes.
- Orquestación en Kubernetes con recursos reales de trabajo.
- Seguridad básica moderna con JWT.
- Resiliencia de gateway con Circuit Breaker en KrakenD (opcional e incremental).
- Persistencia y conceptos de almacenamiento en contenedores.
- Testing backend en Java con JUnit + Mockito + MockMvc + JaCoCo.

## Estado actual (estable)
- Release/tag disponible: `v2.0.1`.
- Pruebas automáticas en `product-service` agregadas y ejecutables con Java 25.
- Cobertura de código con JaCoCo 0.8.14.
- Documentación de testing consolidada en `TESTING.md`.
- Scripts para despliegue y limpieza integral del laboratorio.
- Configuración incremental disponible para KrakenD con Circuit Breaker (v3 opcional).

## Valor para otros docentes
- Material listo para usar en clases prácticas y ayudantías.
- Permite modular dificultad por nivel de curso (intro/intermedio).
- Facilita evaluación por hitos (fase a fase) con evidencias técnicas.
- Sirve como base para extender hacia CI/CD, observabilidad y seguridad avanzada.

## Recomendación de uso en docencia
- Usar las fases 1 a 4 en unidades introductorias de contenedores y Kubernetes.
- Usar fases 5 a 7 para integración completa, seguridad y arquitectura distribuida.
- Incorporar `TESTING.md` en evaluaciones de calidad de software (tests + coverage).

## Limitaciones actuales (esperables en contexto formativo)
- No pretende ser una plataforma productiva enterprise completa.
- RBAC, observabilidad avanzada y pipeline CI/CD completo quedan como evolución natural del curso.
- El foco está en claridad didáctica y aprendizaje incremental.

## Conclusión
Sí, este proyecto es apto para adopción docente compartida: combina arquitectura actual, progresión pedagógica clara y artefactos técnicos ejecutables por estudiantes con resultados verificables.
