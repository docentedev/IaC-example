# Circuit Breaker en KrakenD (Guia incremental)

Este documento explica que hace el Circuit Breaker, sus beneficios, parametros configurables y como aplicarlo en este laboratorio sin romper los ejercicios actuales.

## 1) Que es un Circuit Breaker

Un Circuit Breaker es un mecanismo de resiliencia en el gateway que protege al sistema cuando un backend empieza a fallar.

Estados:
- `CLOSED`: flujo normal.
- `OPEN`: KrakenD deja de enviar trafico al backend por un tiempo.
- `HALF-OPEN`: deja pasar una solicitud de prueba para verificar recuperacion.

Comportamiento:
1. Si hay demasiados errores consecutivos, el circuito pasa a `OPEN`.
2. Durante `timeout`, se corta trafico hacia ese backend.
3. Luego prueba una llamada (`HALF-OPEN`).
4. Si funciona, vuelve a `CLOSED`; si falla, regresa a `OPEN`.

## 2) Beneficios

- Evita fallos en cascada.
- Reduce latencia percibida cuando un backend esta inestable.
- Protege servicios caidos de recibir mas carga.
- Mejora estabilidad general del gateway bajo errores de red/timeout.

## 3) Parametros configurables en KrakenD

Se configura en cada `backend`, dentro de `extra_config` usando el namespace `qos/circuit-breaker`.

Parametros principales:
- `interval` (segundos): ventana de observacion de errores.
- `max_errors`: cantidad de errores consecutivos tolerados antes de abrir el circuito.
- `timeout` (segundos): tiempo que permanece abierto antes del reintento.
- `name` (opcional): nombre del breaker para trazabilidad en logs.
- `log_status_change` (opcional): registra cambios de estado en logs.

Ejemplo minimo:

```json
"extra_config": {
  "qos/circuit-breaker": {
    "interval": 30,
    "timeout": 10,
    "max_errors": 3,
    "name": "cb-products",
    "log_status_change": true
  }
}
```

## 4) Nota importante sobre no-op

En este laboratorio hay endpoints con `encoding`/`output_encoding` en `no-op`.

En esos casos, el Circuit Breaker no evalua fallos por codigos HTTP de respuesta de negocio (como 4xx/5xx) de la misma forma que con `json`; se enfoca en fallos de conectividad, timeouts y errores de componentes.

Por eso, usar Circuit Breaker sigue siendo util, pero debes interpretar su activacion principalmente como problemas de red/disponibilidad.

## 5) Aplicacion incremental en este proyecto

Para no romper ejercicios previos, se creo una nueva configuracion versionada:

- `krakend/k8s/krakend-config-v2.yaml`: flujo actual (sin Circuit Breaker explicito)
- `krakend/k8s/krakend-config-v3-circuit-breaker.yaml`: misma base + Circuit Breaker por backend

### Recomendacion de uso

1. Ejecuta fases normales hasta cart-service (seccion 6 de QUICKSTART).
2. Aplica v3 solo como extension opcional de resiliencia.

### Comandos

Aplicar v3:

```bash
kubectl apply -f krakend/k8s/krakend-config-v3-circuit-breaker.yaml
kubectl rollout restart deployment krakend -n microservicios
```

Ver logs de cambios de estado:

```bash
kubectl logs -f deployment/krakend -n microservicios | grep cb-
```

Rollback a v2:

```bash
kubectl apply -f krakend/k8s/krakend-config-v2.yaml
kubectl rollout restart deployment krakend -n microservicios
```

## 6) Parametros sugeridos para laboratorio

Perfil recomendado (ya aplicado en v3):
- `interval: 30`
- `max_errors: 3`
- `timeout: 10`
- `log_status_change: true`

Motivo:
- Sensible para demos (se activa con facilidad en pruebas de fallo)
- Evita bloqueos excesivamente largos
- Permite observar transiciones de estado en clase

## 7) Prueba rapida en clases

1. Aplicar v3.
2. Simular falla de un backend (por ejemplo, detener temporalmente un deployment).
3. Ejecutar llamadas repetidas al endpoint correspondiente.
4. Observar en logs la transicion `CLOSED -> OPEN -> HALF-OPEN -> CLOSED`.

Comandos utiles:

```bash
kubectl scale deployment product-service -n microservicios --replicas=0
curl -i http://micro.local/api/products
kubectl logs deployment/krakend -n microservicios | grep cb-products
kubectl scale deployment product-service -n microservicios --replicas=1
```

## 8) Resumen

- Si, KrakenD permite Circuit Breaker en Community Edition.
- Es una mejora de resiliencia, no un reemplazo de retries, timeouts ni observabilidad.
- En este repo se implementa de forma incremental con una configuracion v3 opcional para no afectar las fases del laboratorio.
