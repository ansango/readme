---
title: "Imágenes avanzadas y registries"
description: "Storing images en registries (Docker Hub, Quay.io, Distribution, Harbor, Red Hat Quay), autenticación con docker login, push y pull, multistage builds, optimización de imágenes, layer caching"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, images, registries, docker-hub, multistage-build, layer-cache, optimization]
---

# Imágenes avanzadas y registries

> [!abstract] Resumen
> Esta nota cubre dos temas clave: dónde almacenar las imágenes (registries públicos como Docker Hub y Quay.io, privados como Docker Distribution, Harbor y Red Hat Quay) con su autenticación, push y pull; y cómo optimizar las imágenes (multistage builds, layer cache, orden de instrucciones, técnicas para mantener imágenes pequeñas). Termina con BuildKit, directory caching y `docker buildx`.

## Storing images: registries

Una vez tienes una imagen que te gusta, **quieres almacenarla en un sitio accesible** desde cualquier Docker host. No construyes imágenes en producción y luego las corres; eso es lo contrario del workflow. El handoff típico: **construir imágenes localmente, subirlas a un registry, deployarlas en producción**.

### Public registries

Hay varios registries públicos donde compartir imágenes:

- **Docker Hub**: el original y el más grande. Tiene imágenes oficiales (de las comunidades detrás de cada proyecto) y miles de imágenes contribuidas por la comunidad. Soporta tanto público como privado.
- **Quay.io** (de Red Hat): alternativa más antigua, con buena UI y separación de permisos. Tiene opciones comerciales para hosting privado en su cloud.
- **GitHub Container Registry**, **Google Container Registry** y otros: cada cloud vendor tiene su propio offering.

> [!warning] Latencia y outages
> Los registries públicos **no están en tu red local**. Cada layer de cada deploy viaja por internet. Latencias y outages impactan tus deploys. Mitigación: imágenes delgadas, registry mirrors o pull-through caches.

```bash
# Buscar imágenes en Docker Hub
docker search node
NAME                     DESCRIPTION                 STARS OFFICIAL AUTOMATED
node                     Node.js is a JavaScript-ba… 12267 [OK]
mongo-express            Web-based MongoDB admin    1274  [OK]
…
```

`OFFICIAL` significa que la imagen es mantenida por la comunidad o empresa del proyecto. `AUTOMATED` significa que se construye y sube vía CI/CD desde el código fuente.

### Private registries

Para empresas que necesitan control total sobre dónde viven las imágenes, hay opciones private:

- **Docker Distribution** (open source): la base sobre la que Docker Hub se construye. Registry mínimo, sin UI. Bueno para empezar.
- **Harbor** (CNCF): extiende Distribution con muchas features de seguridad y reliability (image verification, replication, RBAC, scanning).
- **Red Hat Quay**: similar a Harbor, con foco en enterprise security y compliance.

### Authenticating to a registry

```bash
docker login
# Username: <hub_username>
# Password: <hub_password/token>
# Login Succeeded
```

Docker almacena las credenciales en `~/.docker/config.json` con permisos 0600. **El valor `auth` está solo base64-encoded, no encriptado** — en sistemas Linux multiusuario, otros usuarios con root pueden leerlo. Considera `gpg` o `pass` para encriptarlo.

```bash
# Logout
docker logout

# Login a un registry custom
docker login someregistry.example.com
```

> [!tip] Personal access tokens
> Para mejor seguridad, crea un **personal access token** en Docker Hub en vez de usar tu password. Limita el blast radius si el token se ve comprometido.

### Configurar un private registry local

El setup mínimo con SSL y HTTP basic auth (para dev/test, no producción):

```bash
# Clona el repo con archivos de ejemplo
git clone https://github.com/spkane/basic-registry \
  --config core.autocrlf=input
cd basic-registry
ls
# Dockerfile  config.yaml.sample  htpasswd.sample  registry.crt.sample  registry.key.sample

# Copia y configura
cp config.yaml.sample config.yaml
cp registry.key.sample registry.key
cp registry.crt.sample registry.crt
cp htpasswd.sample htpasswd

# Si el Docker server tiene una IP diferente a 127.0.0.1, edita config.yaml
# y reemplaza la IP. También regenera el cert con la IP correcta:
openssl req -x509 -nodes -sha256 -newkey rsa:4096 \
  -keyout registry.key -out registry.crt \
  -days 14 -subj '/CN=172.17.42.10'

# Opcional: crea tu propio htpasswd en lugar de usar el de ejemplo
docker container run --rm --entrypoint htpasswd g \
  -Bbn <username> <password> > htpasswd

# Build y run
docker image build -t my-registry .
docker container run --rm -d -p 5000:5000 --name registry my-registry
docker container logs registry
```

> [!warning] Secrets en el container
> El container de registry tiene un SSL key embebido. Si lo borras, pierdes las imágenes. Para producción, usa secretos externos y storage redundante. Para mantener imágenes entre runs en dev, monta un volumen:
> ```bash
> docker container run -d -p 5000:5000 --name registry \
>   --mount type=bind,source=/tmp/registry-data,target=/var/lib/registry \
>   my-registry
> ```

### Login y push a un private registry

```bash
docker login 127.0.0.1:5000
# Username: <registry_username>
# Password: <registry_password>
# Login Succeeded

# Tag la imagen con el registry hostname
docker image tag my-registry 127.0.0.1:5000/my-registry
docker image push 127.0.0.1:5000/my-registry
# The push refers to repository [127.0.0.1:5000/my-registry]
# f09a0346302c: Pushed
# …

# Pull desde otro host
docker image pull 127.0.0.1:5000/my-registry
```

> [!tip] Harbor para producción
> Cuando te sientas cómodo con Docker Distribution, échale un ojo a **Harbor**. Es un proyecto CNCF que extiende Distribution con muchas features de seguridad y reliability.

## Optimización de imágenes

Mantener imágenes pequeñas y builds rápidos es **crítico** a medida que escalas. Imagen grande = deploys lentos. Build lento = feedback loop largo. Ambos se acumulan.

### Mantener imágenes pequeñas

Una imagen de Go estáticamente compilada puede ser **3.4 MB** (solo el binario). Una imagen Fedora con Apache, sin limpieza, puede ser **436 MB** (Fedora base 163 MB + httpd con cache 273 MB).

```bash
# Inspecciona qué hay en una imagen corriendo
docker container run -d -p 8080:8080 spkane/scratch-helloworld
docker container ls -l
docker container export <container_id> -o web-app.tar
tar -tvf web-app.tar
# Verás que la imagen scratch solo tiene helloworld y archivos zero-byte
# que el kernel bind-mounta desde el host
```

> [!tip] dive
> Si exploras imágenes mucho, la herramienta **dive** da una UI CLI para entender qué contiene cada layer de una imagen.

### El truco de `dnf clean` y `apt-get clean`

Los package managers (`dnf`, `apt`, `apk`) mantienen **caches grandes** con metadata de packages. Después de instalar packages, el cache es inútil. Pero **borrarlo en un layer separado no reduce el tamaño**:

```dockerfile
# ❌ Mal: el cache queda en el layer anterior (aditivo)
FROM docker.io/fedora
RUN dnf install -y httpd
RUN dnf clean all
CMD ["/usr/sbin/httpd", "-DFOREGROUND"]
# El layer de install sigue siendo 273 MB
```

```dockerfile
# ✓ Bien: clean en el mismo layer
FROM docker.io/fedora
RUN dnf install -y httpd && \
    dnf clean all
CMD ["/usr/sbin/httpd", "-DFOREGROUND"]
# El layer de install es 44.8 MB (273 MB - cache limpiado)
```

> [!tip] Layers son aditivos
> Una vez que un layer se crea, **nada se puede borrar de él**. Borrar archivos en layers posteriores simplemente los enmascara. Por eso la limpieza debe ocurrir en el mismo RUN.

### Multistage builds

La mejor forma de mantener imágenes de producción mínimas es **multistage builds**: usas una imagen con todas las herramientas de build para compilar, y luego copias solo el binario a una imagen final limpia.

```dockerfile
# Build container
FROM docker.io/golang:alpine as builder
RUN apk update && \
    apk add git && \
    CGO_ENABLED=0 go install -a -ldflags '-s' \
    github.com/spkane/scratch-helloworld@latest

# Production container
FROM scratch
COPY --from=builder /go/bin/scratch-helloworld /helloworld
EXPOSE 8080
CMD ["/helloworld"]
```

> [!tip] Stages no necesitan estar relacionados
> Puedes tener un stage con Go para compilar el backend, otro con Node para compilar el frontend, y un stage final que copia artefactos de ambos. **No hay límite en el número de stages**.

```bash
docker image build .
# [+] Building 9.7s (7/7) FINISHED
#   => [builder 2/2] RUN apk update && apk add git && CGO_ENABLED=0 go install ...
#   => [stage-1 1/1] COPY --from=builder /go/bin/scratch-helloworld /helloworld
```

### Utilizar el layer cache

Docker cachea layers entre builds. El **orden** de los comandos impacta dramáticamente el tiempo de build promedio. Idea clave: **lo más estable y costoso primero, lo más cambiante al final**.

```dockerfile
# ❌ Mal: index.html cambia frecuente, invalida el cache antes de httpd
FROM docker.io/fedora
RUN mkdir -p /var/www && mkdir -p /var/www/html
ADD index.html /var/www/html
RUN dnf install -y httpd && dnf clean all
CMD ["/usr/sbin/httpd", "-DFOREGROUND"]
# Build con cambio en index.html: ~43 segundos (rebuild todo httpd)

# ✓ Bien: httpd install (lento, estable) primero; código al final
FROM docker.io/fedora
RUN dnf install -y httpd && dnf clean all
RUN mkdir -p /var/www && mkdir -p /var/www/html
ADD index.html /var/www/html
CMD ["/usr/sbin/httpd", "-DFOREGROUND"]
# Build con cambio en index.html: ~0.5 segundos (cache hit en httpd)
```

> [!warning] Orden importa para el cache
> El test con `--no-cache` da ~52 segundos en ambos casos. La diferencia aparece con cache: **0.5s vs 43s** según el orden. Para feedback loops rápidos, ordena por estabilidad.

## BuildKit: el builder moderno

**BuildKit** es la implementación moderna de builder de Docker, habilitada por defecto en versiones recientes. Ofrece:

- Mejor performance (paralelismo, cache mejorado).
- **Directory caching**: cachea directorios (como `node_modules` o cache de `apt`) en layers especiales bind-mounted en build time.
- Mejor output.
- Mejor gestión de secrets en build.

Para forzar BuildKit:

```bash
export DOCKER_BUILDKIT=1
docker image build -t example/myapp .
```

### Directory caching

BuildKit permite cachear el contenido de un directorio (donde herramientas como `apt`, `apk`, `dnf`, `npm`, `pip` descargan sus archivos) en un layer especial bind-mounted durante el build:

```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.9.15-slim-bullseye
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
COPY . /app
WORKDIR /app
CMD ["python", "main.py"]
```

El cache de pip queda bind-mounted, se usa durante el build, y se desmonta antes del snapshot final. **El cache no entra en la imagen final**, pero los builds consecutivos son mucho más rápidos.

> [!tip] `--mount=type=cache` es tu amigo
> Úsalo para `apt`, `apk`, `dnf`, `npm`, `pip`, `bundler`, `go build cache`, etc. Acelera builds sin agrandar la imagen.

### docker buildx: builds multiplataforma

El plug-in `docker buildx` extiende BuildKit con:

- **Multi-plataforma**: build para `linux/amd64`, `linux/arm64`, etc. simultáneamente.
- **Múltiples build contexts**: útil para casos avanzados donde partes del build vienen de otros repos o URLs.
- Builds remotos, caché distribuido, etc.

```bash
# Build para múltiples arquitecturas
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myuser/myapp:latest \
  --push .
```

## Próximos pasos

- [[06-trabajar-con-contenedores]]: historia de containers, qué son (y qué no), `docker container create` vs `run`, configuración (nombre, labels, hostname, DNS, MAC), volumes, resource quotas (CPU shares, memory), y buenas prácticas stateless.
