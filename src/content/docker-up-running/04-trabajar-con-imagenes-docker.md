---
title: "Trabajar con imágenes Docker"
description: "Anatomía de un Dockerfile (FROM, RUN, COPY, ENV, ARG, LABEL, USER, WORKDIR, CMD), build de imágenes, ejecutar imágenes, build args, env vars como configuración, custom base images"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, images, dockerfile, build, buildkit, layers, base-images]
---

# Trabajar con imágenes Docker

> [!abstract] Resumen
> Esta nota cubre el corazón del trabajo con Docker: las imágenes. Empieza con la anatomía de un Dockerfile (instrucciones clave, layers, multi-stage builds), continúa con cómo build-ear imágenes, ejecutarlas, pasar build args y env vars en runtime, y termina con cómo construir custom base images. La base para todo lo demás: registries, push, y la separación entre dev y producción.

## Qué son las imágenes

Cada Linux container está basado en una **imagen**. Las imágenes son la definición subyacente de lo que se reconstituye en un container corriendo, similar a cómo un disco virtual se convierte en una VM cuando arranca. Las imágenes Docker o OCI son la **base de todo lo que deployarás con Docker**.

Una imagen consiste en uno o más **filesystem layers** enlazados, generalmente con un mapping uno-a-uno con cada paso de build del Dockerfile. Los layers se almacenan en un **storage backend** (OverlayFS, B-Tree File System / Btrfs, o Device Mapper) que provee copy-on-write rápido.

> [!tip] Layers son la clave de la eficiencia
> Cuando rebuildeas, **solo se reconstruyen los layers que cambiaron**. Los anteriores se reutilizan del cache. Esto es lo que hace que Docker sea eficiente en tiempo y bandwidth para deploys.

## Anatomía de un Dockerfile

Un Dockerfile describe todos los pasos para crear una imagen. Vive en el root del repo de la app. Ejemplo típico para una app Node.js:

```dockerfile
FROM node:18.13.0
ARG email="anna@example.com"
LABEL "maintainer"=$email
LABEL "rating"="Five Stars" "class"="First Class"
USER root
ENV AP /data/app
ENV SCPATH /etc/supervisor/conf.d
RUN apt-get -y update
# The daemons
RUN apt-get -y install supervisor
RUN mkdir -p /var/log/supervisor
# Supervisor Configuration
COPY ./supervisord/conf.d/* $SCPATH/
# Application Code
COPY *.js* $AP/
WORKDIR $AP
RUN npm install
CMD ["supervisord", "-n"]
```

### Instrucciones clave

#### FROM

Define la imagen base. Es el primer comando (obligatorio) y de él cuelga todo lo demás.

```dockerfile
FROM docker.io/node:18.13.0
```

> [!tip] Fija versiones específicas
> Apunta a una versión point release (`node:18.13.0`) en lugar de `latest`. `latest` puede cambiar y romper tu build. Busca en Docker Hub la imagen oficial y elige una tag estable.

#### ARG

Variables disponibles **solo durante el build**. Útiles para parámetros que cambian entre builds pero no en runtime.

```dockerfile
ARG email="anna@example.com"
```

#### LABEL

Metadata en formato key/value. Útil para buscar imágenes después.

```dockerfile
LABEL "maintainer"=$email
LABEL "rating"="Five Stars" "class"="First Class"
```

#### ENV

Variables de entorno disponibles durante el build **y en runtime** cuando el container corre. La app las lee con `process.env.MI_VAR`.

```dockerfile
ENV AP /data/app
ENV SCPATH /etc/supervisor/conf.d
```

> [!note] ENV vs ARG
> ENV y ARG se usan juntos para DRY el Dockerfile. ARG se pasa en build (`--build-arg`) y ENV se pasa en runtime (`-e` o `--env`).

#### USER

Cambia el usuario que corre los procesos. **Por defecto es root**, lo cual es un riesgo de seguridad.

```dockerfile
USER root
```

> [!warning] Nunca root en producción
> Aunque los containers tienen algo de aislamiento, corren en el kernel del host. **En producción, los containers deben correr como unprivileged user**.

#### RUN

Ejecuta comandos durante el build. Cada RUN crea un nuevo layer.

```dockerfile
RUN apt-get -y update
RUN apt-get -y install supervisor
```

> [!tip] Combina RUNs relacionados
> Combinar varios comandos en un solo RUN con `&&` reduce layers. Ejemplo: `RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*`

> [!warning] apt-get update en builds no es ideal
> `apt-get update` hace crawling del repo index en cada build, **lo que significa que el build no es repeatable** (versiones pueden cambiar). Mejor basar la imagen en otra imagen que ya tenga las updates aplicadas.

#### COPY

Copia archivos del filesystem local a la imagen. Lo más común: código de la app y archivos de soporte.

```dockerfile
COPY ./supervisord/conf.d/* $SCPATH/
COPY *.js* $AP/
```

> [!tip] COPY + RUN combinados
> Puedes copiar un script complejo con COPY y luego ejecutarlo con RUN: solo dos líneas en el Dockerfile para lógica compleja.

#### WORKDIR

Cambia el directorio de trabajo para las instrucciones siguientes y el proceso por defecto del container.

```dockerfile
WORKDIR $AP
```

#### CMD

Define el comando por defecto que arranca cuando se lanza el container. Solo puede haber un CMD (el último).

```dockerfile
CMD ["supervisord", "-n"]
```

> [!note] Un proceso por container
> Es best practice correr **un solo proceso por container**. La idea es que cada container cumple una función y se escala horizontalmente. Si necesitas más control, usa supervisord o `--init` con `docker container run`.

### Orden importa para el cache

> [!warning] Ordena por estabilidad
> El orden de los comandos en un Dockerfile impacta los tiempos de build. Ordena de **menos a más cambiante**: las cosas que cambian entre builds van al final. Cada layer después del primer cambio se reconstruye.

Por ejemplo, `apt-get install` cambia rara vez → ponlo arriba. Tu `COPY *.js*` cambia cada commit → ponlo abajo. Así, builds de cambios de código no rebuildan las dependencias.

## Build de una imagen

Para build-ear tu primera imagen, clona un repo de ejemplo con un Dockerfile funcional:

```bash
git clone https://github.com/spkane/docker-node-hello.git \
  --config core.autocrlf=input
cd docker-node-hello
ls -a -I .git
# .dockerignore, .gitignore, Dockerfile, index.js, package.json, supervisord/
```

### .dockerignore

Define archivos y directorios que **no** quieres subir al Docker host durante el build. En el ejemplo:

```
.git
```

El directorio `.git` puede ser enorme y no es necesario para el build. Sin `.dockerignore`, perderías tiempo subiéndolo en cada build.

### BuildKit: el builder moderno

Las versiones recientes de Docker incluyen **BuildKit**, el builder moderno. Habilítalo con la variable de entorno:

```bash
export DOCKER_BUILDKIT=1
docker image build -t example/docker-node-hello:latest .
```

El output muestra cada paso del Dockerfile mapeando a un layer:

```text
=> [internal] load build definition from Dockerfile
=> => transferring dockerfile: 37B
=> [internal] load .dockerignore
=> => transferring context: 34B
=> [internal] load metadata for docker.io/library/node:18.13.0
=> CACHED [1/8] FROM docker.io/library/node:18.13.0@19a9713dbaf3...
=> [internal] load build context
=> => transferring context: 233B
=> [2/8] RUN apt-get -y update
=> [3/8] RUN apt-get -y install supervisor
=> [4/8] RUN mkdir -p /var/log/supervisor
=> [5/8] COPY ./supervisord/conf.d/* /etc/supervisor/conf.d/
=> [6/8] COPY *.js* /data/app/
=> [7/8] WORKDIR /data/app
=> [8/8] RUN npm install
=> exporting to image
```

El `.` al final es el **build context**: le dice a Docker qué archivos subir al server. El `.dockerignore` filtra qué se incluye.

> [!tip] Cache
> Docker usa cache local. Si ves `CACHED [2/8]` en lugar de `[2/8]`, Docker reusó el layer del build anterior. Para forzar rebuild sin cache, usa `--no-cache`.

> [!tip] Otros flags útiles
> - `-f <path>`: si el Dockerfile no está en el directorio actual.
> - `--build-arg NAME=VALUE`: pasa un ARG custom.
> - `--no-cache`: fuerza rebuild sin usar cache.
> - `--quiet` / `-q`: solo muestra el ID de la imagen final.

## Ejecutar la imagen

Una vez construida, lánzala en un container en background con port mapping:

```bash
docker container run --rm -d -p 8080:8080 example/docker-node-hello:latest
```

`--rm` borra el container cuando termine. `-d` lo corre detached (en background). `-p 8080:8080` mapea el puerto 8080 del container al 8080 del host.

Para verificar que está corriendo, abre `http://127.0.0.1:8080/` en el browser. Deberías ver:

```text
Hello World. Wish you were here.
```

## Build args

Los **ARG** del Dockerfile se pueden sobreescribir en build time con `--build-arg`:

```dockerfile
ARG email="anna@example.com"
LABEL "maintainer"=$email
```

```bash
docker image build --build-arg email=me@example.com \
  -t example/docker-node-hello:latest .
docker image inspect example/docker-node-hello:latest | grep maintainer
# "maintainer": "me@example.com"
```

## Env vars como configuración

Las **ENV** del Dockerfile se pasan al container en runtime con `-e` o `--env`. Ejemplo: la app lee `process.env.WHO`:

```javascript
var DEFAULT_WHO = "World";
var WHO = process.env.WHO || DEFAULT_WHO;
app.get('/', function (req, res) {
  res.send('Hello ' + WHO + '. Wish you were here.\n');
});
```

```bash
docker container run --rm -d \
  --env WHO="Sean and Karl" \
  -p 8080:8080 example/docker-node-hello:latest
# Refresca el browser y verás:
# "Hello Sean and Karl. Wish you were here."
```

Forma corta: `-e WHO="..."` en lugar de `--env WHO="..."`.

> [!note] Externalizar config
> Los containers stateless funcionan mejor con **config externalizada** vía env vars. La misma imagen puede correr en dev, staging o producción simplemente cambiando las env vars en runtime.

## Custom base images

Las **base images** son las imágenes de más bajo nivel sobre las que se construyen otras. La mayoría son Linux distros mínimas (Ubuntu, Fedora, Alpine) o imágenes con un solo binario estáticamente compilado.

> [!tip] Cuándo custom base images
> - **Mantener consistencia de OS** entre deployments (hardware, VMs, containers).
> - **Reducir tamaño** drásticamente (no necesitas una distro entera para un binario Go).
> - **Aplicar políticas de seguridad** comunes en todas las imágenes derivadas.

### Alpine Linux como middle ground

**Alpine Linux** es muy popular como base image. Está diseñado para ser muy pequeño, basado en musl libc en lugar de glibc. Esto puede tener impacto en:

- Aplicaciones Java (que a menudo esperan glibc).
- DNS resolution (algunos paquetes asumen glibc).

A cambio, las imágenes son **enormemente más pequeñas**. Alpine también reemplaza bash con sh (`/bin/sh` en lugar de `/bin/bash`); puedes instalar glibc y bash si los necesitas.

## Próximos pasos

- [[05-imagenes-avanzadas-registries]]: storing images en registries (públicos como Docker Hub y Quay.io, privados como Distribution, Harbor, Red Hat Quay), autenticación (`docker login`), `docker image push` y `docker image pull`, exploración con `docker search`.
