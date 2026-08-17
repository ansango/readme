---
title: Docker Compose
description: "Configurar docker-compose.yml con múltiples servicios, networks, volumes, depends_on con health checks, profiles, override, escalar servicios, comandos principales"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, docker-compose, multi-container, services, networks, volumes, profiles]
---

# Docker Compose

> [!abstract] Resumen
> Esta nota cubre **Docker Compose**, la herramienta para describir stacks multi-container en un archivo YAML declarativo. Repasa la anatomía de un `docker-compose.yml` (services, networks, volumes), las directivas clave (build, image, environment, ports, volumes, depends_on, healthchecks, profiles), los comandos principales (`up`, `down`, `ps`, `logs`, `exec`, `scale`), y los patrones de uso típicos (dev environment, testing local, single-host deploys). Compose es ideal para dev, pero limitado a un solo host.

## Por qué Docker Compose

Cuando un proyecto necesita **varios containers** que cooperan (web + DB + cache + worker), correr cada uno con `docker container run` se vuelve tedioso y propenso a errores. La gente solía escribir shell scripts que se volvían inmanejables.

**Docker Compose** resuelve esto con **un solo archivo YAML declarativo** (`docker-compose.yml`) que describe todos los servicios, sus dependencias, redes, volumes y variables de entorno. **Un comando y todo el stack está up**.

> [!note] Compose v1 vs v2
> Compose v1 era un binario Python separado (`docker-compose`). Compose v2 está **completamente reescrito en Go** como un plug-in del Docker client (`docker compose`). Si `docker compose version` funciona, lo tienes. Si no, instala el plug-in.

## Anatomía de un docker-compose.yml

```yaml
version: '3'
services:
  mongo:
    build:
      context: ../../mongodb/docker
    image: spkane/mongo:4.4
    restart: unless-stopped
    environment:
      MONGODB_REPLICA_SET_MODE: primary
      MONGODB_REPLICA_SET_NAME: rs0
      MONGO_PORT_NUMBER: 27017
    networks:
      - botnet

  rocketchat:
    image: rocketchat/rocket.chat:5.0.4
    restart: unless-stopped
    labels:
      traefik.enable: "true"
    volumes:
      - "../rocketchat/data/uploads:/app/uploads"
    environment:
      ROOT_URL: http://127.0.0.1:3000
      MONGO_URL: "mongodb://mongo:27017/rocketchat?replicaSet=rs0"
    depends_on:
      mongo:
        condition: service_healthy
    ports:
      - "3000:3000"
    networks:
      - botnet

  zmachine:
    image: spkane/zmachine-api:latest
    expose:
      - "80"
    depends_on:
      - rocketchat
    networks:
      - botnet

  hubot:
    image: rocketchat/hubot-rocketchat:latest
    volumes:
      - "../hubot/scripts:/home/hubot/scripts"
    environment:
      ROCKETCHAT_URL: "rocketchat:3000"
    depends_on:
      - zmachine
    ports:
      - "3001:8080"
    networks:
      - botnet

networks:
  botnet:
    driver: bridge
```

## Directivas clave

### `services` (la sección más importante)

Define cada container del stack. Cada service tiene nombre único y configuración.

#### `build`

Indica a Compose que **construya la imagen** desde un Dockerfile:

```yaml
build:
  context: ../../mongodb/docker
```

También puedes pasar build args:

```yaml
build:
  context: ./my-app
  args:
    - VERSION=1.2.3
    - ENVIRONMENT=production
```

#### `image`

Tag que se aplica al build o, si no hay `build`, la imagen a pull:

```yaml
image: spkane/mongo:4.4
```

#### `restart`

Política de restart automática:

| Valor | Comportamiento |
|---|---|
| `no` | Nunca reinicia (default) |
| `always` | Siempre, incluido en startup del daemon |
| `on-failure` | Solo si el container sale con código no-cero |
| `unless-stopped` | Siempre, excepto si fue detenido manualmente |

> [!tip] `unless-stopped` en producción
> Es el más usado en producción. Reinicia en crashes pero respeta los stops manuales.

#### `environment`

Variables de entorno que recibe el container:

```yaml
environment:
  ROOT_URL: http://127.0.0.1:3000
  MONGO_URL: "mongodb://mongo:27017/rocketchat?replicaSet=rs0"
```

> [!tip] Variables de entorno desde shell o .env
> ```yaml
> environment:
>   - DEBUG=${DEBUG}
> ```
> Si `DEBUG` no está en el shell, puedes usar `.env` file en el mismo directorio del compose. Útil para secrets que no quieres commitear.

#### `ports`

Mapeo de puertos del container al host:

```yaml
ports:
  - "3000:3000"     # formato corto: host:container
  - "8080:80"       # 8080 en host, 80 en container
  - "127.0.0.1:8080:80"  # bind a IP específica
```

> [!warning] `ports` vs `expose`
> - `ports`: publica el puerto al **host**. Accesible desde fuera.
> - `expose`: solo accesible para **otros containers en la red**. No al host.
> ```yaml
> zmachine:
>   expose:
>     - "80"   # otros servicios pueden llamar a zmachine:80
>   # pero el host NO puede acceder a zmachine
> ```

#### `volumes`

Bind mounts o named volumes:

```yaml
volumes:
  - "../rocketchat/data/uploads:/app/uploads"   # bind mount
  - "db-data:/var/lib/mysql"                    # named volume
```

Los named volumes se declaran abajo en la sección `volumes:`.

> [!warning] Bind mounts en producción
> **No uses bind mounts en producción**. Atan el container a un host específico. Para state, usa volumes remotos (NFS, EBS, etc.) o servicios gestionados (RDS, etc.).

#### `depends_on`

Orden de arranque entre servicios:

```yaml
depends_on:
  mongo:
    condition: service_healthy
```

> [!tip] Healthcheck + condition
> Por default, `depends_on` solo espera que el container esté **corriendo**, no que esté healthy. Usa `condition: service_healthy` para esperar al health check. **Importante**: solo impacta al startup; no reinicia services que se vuelvan unhealthy después.

#### `networks`

Networks a los que se conecta el service:

```yaml
networks:
  - botnet
```

Los networks se declaran abajo en la sección `networks:`.

> [!tip] Service discovery automático
> Compose hace que cada service sea accesible por su **nombre** en la red compartida. Si tu service se llama `mongo`, otros services pueden hacer `mongodb://mongo:27017/...` sin necesidad de IP. Las URLs se vuelven legibles y self-documenting.

#### `healthcheck`

Cómo Docker determina si el container está healthy:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

#### `profiles`

Activar el service solo bajo ciertos profiles:

```yaml
services:
  debug-tools:
    image: spkane/train-os
    profiles: ["debug"]
```

```bash
docker compose --profile debug up
```

> [!tip] Profiles para dev vs prod
> Pon servicios de debug, seed data, admin tools detrás de profiles. En CI o producción, no se incluyen a menos que se pida explícitamente.

### `networks` (sección de nivel superior)

```yaml
networks:
  botnet:
    driver: bridge
```

### `volumes` (sección de nivel superior)

```yaml
volumes:
  db-data:    # named volume, gestionado por Docker
```

## Comandos principales

```bash
# Validar el archivo
docker compose config

# Build de imágenes
docker compose build

# Levantar el stack (-d detached, --build para build primero)
docker compose up -d --build

# Estado de los services
docker compose ps

# Logs (todos los services o uno específico)
docker compose logs -f
docker compose logs -f rocketchat

# Ejecutar comando en un service
docker compose exec rocketchat /bin/bash

# Escalar (solo funciona sin ports fijos en ese service)
docker compose up -d --scale worker=3

# Apagar
docker compose down         # containers + networks
docker compose down -v      # también borra volumes
```

> [!tip] Comandos one-off
> ```bash
> docker compose run --rm rocketchat /bin/bash
> # Crea un container nuevo, no reutiliza el de up
> ```

## Casos de uso típicos

- **Dev environment local**: el caso estrella. `git clone`, `docker compose up`, tienes un stack completo en minutos.
- **Testing de integración local**: el archivo es el mismo para todos los devs (con un override para valores que cambian).
- **CI/CD**: tests e2e contra el stack en el CI.
- **Single-host deploys**: un servidor pequeño con varios containers coordinados. Para escala, **usa Kubernetes** u otro orquestador.

> [!warning] Compose NO es para producción a escala
> Compose es para un **solo host**. No hace auto-scaling, no se recupera de fallos de host, no balancea carga entre nodos. Para producción real, usa **Kubernetes**, **Nomad**, o **ECS**.

## Override para entornos distintos

`docker-compose.override.yml` se aplica automáticamente encima del principal. Útil para tener un base común y overrides por entorno:

```yaml
# docker-compose.yml (base, commiteado)
services:
  web:
    image: my-app
    ports: ["8080:8080"]
```

```yaml
# docker-compose.override.yml (local, no commiteado)
services:
  web:
    build: .
    environment:
      DEBUG: "true"
    volumes:
      - ./src:/app/src   # live reload en dev
```

O usa `-f` para apuntar a archivos específicos:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Próximos pasos

- [[10-path-to-production]]: el camino a producción, testing, CI/CD, registry workflows, deployment patterns y health checks en producción.
