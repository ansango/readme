---
title: Volúmenes y redes en Docker
description: "Volúmenes Docker para persistencia de datos y redes para comunicación entre contenedores"
date: 2026-07-10
mod: 2026-07-10
published: true
tags: [docker, sysadmin, volumes, networking]
---

# Volúmenes y redes en Docker

> [!abstract] Resumen
> Dos conceptos clave para crear aplicaciones Docker robustas: **volúmenes** para persistir datos y **redes** para que los contenedores se comuniquen entre sí por nombre.

## Volúmenes

Un **volumen** es un mecanismo para almacenar datos fuera del contenedor. Sin volúmenes, cuando borras un contenedor, pierdes todos sus datos. Con volúmenes, los datos persisten.

### Tipos de volúmenes

#### 1. **Named volumes** (volúmenes nombrados)

Almacenados en una ubicación gestionada por Docker (típicamente `/var/lib/docker/volumes/`). Son portátiles y fáciles de gestionar.

```bash
docker volume create mi-volumen
docker run -v mi-volumen:/data imagen
```

El directorio `/data` dentro del contenedor está vinculado al volumen `mi-volumen`.

#### 2. **Bind mounts** (montajes vinculados)

Vinculan una ruta específica del host al contenedor. Útiles en desarrollo.

```bash
docker run -v /ruta/del/host:/ruta/contenedor imagen
docker run -v $(pwd):/app imagen  # Directorio actual
```

> [!warning]
> Los bind mounts dependen de la estructura del host. No son portátiles entre máquinas. Para producción, usa volúmenes nombrados.

#### 3. **tmpfs mounts**

Volúmenes en memoria. Se pierden cuando el contenedor se detiene.

```bash
docker run --tmpfs /cache imagen
```

> [!note]
> Los tmpfs mounts son ideales para datos temporales o caché que no necesitas persistir.

### Comandos de volumen

```bash
# Listar volúmenes
docker volume ls

# Crear un volumen
docker volume create mi-volumen

# Inspeccionar un volumen
docker volume inspect mi-volumen

# Eliminar un volumen
docker volume rm mi-volumen

# Eliminar volúmenes sin usar
docker volume prune
```

> [!example] Base de datos con persistencia
> ```bash
> docker volume create postgres-data
> docker run -d \
>   --name postgres \
>   -e POSTGRES_PASSWORD=password \
>   -v postgres-data:/var/lib/postgresql/data \
>   postgres:15
> ```
> Aunque elimines el contenedor, los datos persisten en `postgres-data`:
> ```bash
> docker rm postgres
> docker run -d --name postgres -v postgres-data:/var/lib/postgresql/data postgres:15
> # Los datos siguen ahí
> ```

## Redes

Una **red** Docker permite que los contenedores se comuniquen entre sí por nombre de contenedor (DNS interno).

### Tipos de redes

#### 1. **bridge** (por defecto)

Red aislada donde los contenedores pueden comunicarse por nombre.

```bash
docker network create mi-red
docker run -d --name app1 --network mi-red imagen1
docker run -d --name app2 --network mi-red imagen2

# Dentro de app1, ping app2 funciona:
docker exec app1 ping app2
```

#### 2. **host**

El contenedor comparte la red del host (sin aislamiento).

```bash
docker run --network host imagen
```

> [!warning]
> Los contenedores con `--network host` pierden el aislamiento de red. Usa solo si realmente necesitas rendimiento de red máximo, y ten cuidado con conflictos de puertos.

#### 3. **none**

Sin red. El contenedor está aislado.

```bash
docker run --network none imagen
```

### Comandos de red

```bash
# Listar redes
docker network ls

# Crear una red
docker network create mi-red

# Inspeccionar una red
docker network inspect mi-red

# Conectar un contenedor a una red existente
docker network connect mi-red contenedor-existente

# Desconectar
docker network disconnect mi-red contenedor-existente

# Eliminar una red
docker network rm mi-red
```

> [!example] Aplicación + Base de datos
> ```bash
> # Crear red aislada
> docker network create app-network
>
> # Iniciar base de datos
> docker run -d \
>   --name db \
>   --network app-network \
>   -e POSTGRES_PASSWORD=password \
>   postgres:15
>
> # Iniciar aplicación (puede acceder a "db" por nombre)
> docker run -d \
>   --name app \
>   --network app-network \
>   -p 3000:3000 \
>   -e DATABASE_URL=postgresql://user:password@db:5432/mydb \
>   mi-app:1.0
> ```
> Desde dentro de `app`, puedes conectar a la base de datos usando el hostname `db`.

### Alias DNS

Puedes dar alias a un contenedor en la red:

```bash
docker network connect --alias database app-network db
```

Ahora dentro de `app`, puedes usar `database` como hostname.

## Volúmenes y redes en Docker Compose

En Docker Compose, volúmenes y redes se declaran en `docker-compose.yml`:

```yaml
version: '3.9'
services:
  app:
    image: mi-app:1.0
    volumes:
      - app-data:/data  # Volumen nombrado
      - ./local:/app/local  # Bind mount
    networks:
      - app-network

  db:
    image: postgres:15
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  app-data:
  db-data:

networks:
  app-network:
    driver: bridge
```

> [!success] Buenas prácticas
> 1. **Usa volúmenes para datos persistentes**, no directorios en el contenedor.
> 2. **Usa bind mounts solo en desarrollo** (permite editar código en el host en tiempo real).
> 3. **Crea redes explícitamente** para aislar aplicaciones diferentes.
> 4. **Usa nombres de servicios** como hostnames en Docker Compose (automático).
> 5. **Limpia volúmenes huérfanos** regularmente: `docker volume prune`.

## Próximos pasos

- [[03-comandos-basicos|Comandos básicos]]: `docker volume` y `docker network`
- [[06-docker-compose|Docker Compose]]: Declara volúmenes y redes en YAML
- [[04-dockerfile|Dockerfile]]: Incluye `VOLUME` y `EXPOSE` en tus imágenes

## Referencias

- [Docker Volumes](https://docs.docker.com/storage/volumes/)
- [Docker Networks](https://docs.docker.com/network/)
