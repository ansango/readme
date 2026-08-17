---
title: "Path to production"
description: "El camino a producción con Docker: workflow de build/test/deploy, concerns de producción (job control, resource limits, networking, configuration, logging, monitoring, scheduling, service discovery)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, production, ci-cd, deployment, monitoring, service-discovery, scheduling]
---

# Path to production

> [!abstract] Resumen
> Esta nota cubre el camino de una imagen Docker local a producción: el workflow de build/test/push/deploy, los concerns de producción que Docker y la plataforma deben cubrir (job control, resource limits, networking, configuration, logging, monitoring, scheduling, service discovery), y dónde Docker se queda corto (típicamente scheduling y service discovery, que se delegan a la plataforma: Kubernetes, Swarm, ECS). Es la nota que conecta todo lo anterior con la realidad operacional.

## El workflow básico

El camino a producción pasa por estos pasos:

1. **Build local** de la imagen en tu máquina de desarrollo.
2. **Build oficial** desde CI o build system.
3. **Push** de la imagen al registry.
4. **Deploy** al server, configurar, arrancar el container.

A medida que el workflow madura, todos estos pasos colapsan en **un pipeline automatizado** que orquesta build, test, storage y deploy.

Una historia de producción debe cubrir tres cosas:

- **Repeatable**: cada invocación hace lo mismo.
- **Maneja configuration**: puedes definir la config por entorno y garantiza que se aplique.
- **Entrega un artefacto ejecutable**.

## Docker's role en producción

Docker provee la **base** de la aplicación containerized, pero la **plataforma** (Kubernetes, Swarm, ECS, etc.) maneja la mayoría de las decisiones de producción. La plataforma suele ser un sistema que envuelve un cluster de servers con una interfaz común para gestión de containers.

| Concern | Lo provee | Lo reemplaza |
|---|---|---|
| **Job control** (start/stop/restart) | Docker engine (start/stop/run/kill) | Init systems (systemd, runit) |
| **Resource limits** | Docker (cgroups) | ulimit, runtime-level controls |
| **Networking** | Docker networks | Network config manual |
| **Configuration** | Environment variables | Chef, Puppet, Ansible (a nivel OS) |
| **Packaging & delivery** | Imágenes + registry | Tarballs, paquetes custom |
| **Logging** | Docker log drivers (json-file, syslog, fluentd) | Syslog local, logfiles |
| **Monitoring** | Health checks + tools externos (cAdvisor, Prometheus) | Nagios, Zabbix |
| **Scheduling** | La plataforma | Runbooks manuales, scripts |
| **Service discovery** | La plataforma (DNS, service mesh) | Load balancers manuales |

> [!tip] Containerize primero, schedule después
> No necesitas un scheduler distribuido el día uno. **Empieza containerizando** tus apps en el mismo server donde corren hoy. Una vez estable, **introduce el scheduler** gradualmente.

## Job control y resource limits

Docker provee primitivas de job control (`docker container start`, `stop`, `run`, `kill`) que se mapean a las fases del lifecycle de una aplicación. **Todas las plataformas** (Kubernetes, Swarm, ECS) respetan este lifecycle.

Para resource limits, usa las flags de `docker container run` (`--memory`, `--cpu-shares`, `--cpuset-cpus`, etc.) o, mejor, **configúralas en tu plataforma** (en Kubernetes, los Pod specs; en ECS, los task definitions).

> [!tip] Production = no root
> Configura tu aplicación para correr como **unprivileged user** (USER en Dockerfile o `--user` en runtime). Root en el container es un riesgo de seguridad aunque tenga algo de aislamiento.

## Networking

Docker provee muchas opciones de networking, pero **en producción, deja que la plataforma decida**. Tu app solo debe:

- Confiar en el DNS que Docker/plataforma provee.
- Aceptar puertos vía env vars (no hardcoded).
- Evitar protocolos con puertos dinámicos (FTP, RTSP).

```yaml
# Ejemplo de service discovery automático
environment:
  DATABASE_URL: "postgresql://postgres-db:5432/myapp"
  # 'postgres-db' es el nombre del service, no un IP
```

> [!note] Service discovery en Compose
> En `docker-compose`, otros services se acceden por su **nombre de service**, no por IP. Compose configura DNS automáticamente. Es la misma idea en Kubernetes (Services) y Swarm.

## Configuration

Docker's native mechanism es **environment variables**. Esto funciona en todas las plataformas modernas.

```bash
docker container run -d \
  -e DATABASE_URL="postgresql://..." \
  -e LOG_LEVEL=info \
  -e FEATURE_FLAGS="new_ui,beta_export" \
  myapp:1.2.3
```

> [!warning] No archivos de config tradicionales
> Algunos sistemas (como Kubernetes) hacen fácil usar archivos de config. **Recomendamos evitarlos** porque reduce la observabilidad de tu app y te ata a mecanismos específicos de la plataforma. **ENV vars funcionan en todos lados**.

Para secrets, usa el mecanismo de la plataforma:

- **Docker Swarm**: Docker secrets.
- **Kubernetes**: Secret resources, montados como env vars o volumes.
- **AWS**: SSM Parameter Store, Secrets Manager.
- **Vault**, **Consul**, etc. para setups más complejos.

## Logging

Docker captura todo lo que el container escribe a stdout/stderr y lo streamea a un backend de logging configurable. **Tu app solo necesita escribir a stdout/stderr**. La plataforma se encarga del resto.

```bash
# json-file (default, hasta que configures log rotation)
# syslog (UDP, recomendado para producción)
# fluentd, awslogs, gcplogs, splunk
# journald (Linux con systemd)
```

> [!tip] Configura log rotation SIEMPRE
> ```json
> // /etc/docker/daemon.json
> {
>   "log-driver": "json-file",
>   "log-opts": { "max-size": "10m", "max-file": "3" }
> }
> ```
> Sin esto, el log file crece sin límite y eventualmente llena el disco.

## Monitoring

### Health checks

Define `HEALTHCHECK` en tu Dockerfile o en el spec de tu plataforma. Es la forma **estándar** de preguntar "¿está esta app funcionando?":

```dockerfile
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
```

El status aparece en `docker container ls`, en Kubernetes (readiness probes), en ECS, etc. **Todos los orquestadores lo respetan**.

### Métricas y APM

- **Métricas básicas**: `docker container stats`, `docker system events`, métricas para Prometheus (`metrics-addr`).
- **APM externos**: New Relic, Datadog, Honeycomb, etc. Todos tienen soporte first-class para containers.
- **Auto-healing**: muchos schedulers (Kubernetes, ECS) re-arrancan containers que fallan sus health checks automáticamente.

> [!tip] Pager a humanos solo cuando la plataforma no pueda
> En sistemas tradicionales, los engineers se pagen y deciden qué hacer. En sistemas dinámicos, **el scheduler re-arranca el container, lo mueve a otro nodo, o escala**. **Los humans solo se pagen cuando la plataforma no puede intervenir**.

## Scheduling y service discovery

**Scheduling** es la decisión de qué corre en qué servidor. **Service discovery** es cómo las apps se encuentran unas a otras en la red. **Ambos los maneja la plataforma**, no Docker directamente.

| Plataforma | Scheduling | Service discovery |
|---|---|---|
| Docker Compose | Manual (todo en un host) | DNS por nombre de service |
| Docker Swarm mode | Built-in, simple | Built-in |
| Kubernetes | Muy sofisticado, dominio del líder | Services + DNS, Ingress |
| AWS ECS | Tasks en clusters | Service discovery, ALB |
| HashiCorp Nomad | Flexible, multi-runtime | Consul integration |

> [!quote] Kelsey Hightower
> El scheduler es el sistema que **juega Tetris por ti**, colocando services en servers para el mejor fit, on the fly.

### Service discovery patterns

- **Load balancers** con addresses bien conocidos.
- **Round-robin DNS**.
- **DNS SRV records**.
- **Multicast DNS** (mDNS).
- **Service mesh**: Linkerd, Istio + Envoy.
- **Kubernetes Ingress**: Traefik, Contour, etc.

> [!warning] Cuidado con service discovery bidireccional
> En sistemas blended (legacy + containers), **entrar al sistema nuevo es más fácil que salir**. Load balancers dinámicos que apuntan a tu sistema nuevo son un buen primer paso. Salir del sistema nuevo al legacy suele requerir configuración manual.

## Testing en CI con Docker

El workflow típico de testing:

1. Build trigger (webhook desde Git, manual, schedule).
2. Build server kickea un container image build.
3. La imagen se crea en el Docker server.
4. La imagen se taggea con un build number o commit hash.
5. Se crea un nuevo container con la imagen, corriendo el test suite.
6. Los resultados se capturan (exit code es la señal principal).
7. Build pasa/falla según los resultados.
8. Builds pasados se pushean al registry.

```bash
# Build de la imagen
docker image build -t myapp:commit-abc123 .

# Tag con el commit hash
docker image tag myapp:commit-abc123 myapp:build-42

# Run tests
docker container run --rm -e ENVIRONMENT=testing -e API_KEY=12345 \
  myapp:build-42 /opt/myapp/test.sh

# Si exit code es 0, push
docker image push myapp:build-42
```

> [!caution] Construye la imagen EXACTA que va a producción
> El container que testeas debe ser **idéntico al que se deploya**. No hagas imágenes separadas para test y producción. Si necesitas diferencias, usa env vars o command-line args al container.

> [!caution] No uses `latest` en CI
> Si el tag `latest` cambia (porque otro build se pushea), **puedes testear la imagen equivocada**. Usa siempre tags específicos (commit hash, build number, semantic version).

### External dependencies con Docker Compose

Para tests con DBs, cache, etc., **Docker Compose** es ideal:

```yaml
# docker-compose.test.yml
services:
  app:
    build: .
    command: /opt/myapp/test.sh
    environment:
      DATABASE_URL: "postgresql://test-db:5432/myapp_test"
    depends_on:
      test-db:
        condition: service_healthy
  test-db:
    image: postgres:14
    environment:
      POSTGRES_DB: myapp_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 2s
```

> [!note] Jenkins, CircleCI, GitHub Actions
> Todos tienen integraciones con Docker, Mesos, Kubernetes. Muchas plataformas de CI modernas (incluyendo hosted) proveen **environments containerizados** listos para tus tests.

## Próximos pasos

- [[11-containers-at-scale]]: orchestration a escala. Docker Swarm mode (built-in), introducción a Kubernetes y Minikube, qué es un pod, services, deployments, kubectl básico.
