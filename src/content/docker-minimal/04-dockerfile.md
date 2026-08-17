---
title: Dockerfile
description: "Dockerfile: cómo crear tus propias imágenes Docker con instrucciones paso a paso"
date: 2026-07-10
mod: 2026-07-10
published: true
tags: [docker, sysadmin, images]
---

# Dockerfile

> [!abstract] Resumen
> Un Dockerfile es un archivo de texto con instrucciones para construir una imagen Docker paso a paso. Esta nota cubre las instrucciones principales (`FROM`, `COPY`, `RUN`, `CMD`...), `.dockerignore` y multi-stage builds.

Un **Dockerfile** es un archivo de texto que contiene una serie de instrucciones para construir una imagen Docker. Cada instrucción crea una capa en la imagen final. Cuando ejecutas `docker build`, Docker lee el Dockerfile y crea la imagen automáticamente.

## Estructura básica

```dockerfile
FROM base-image:tag
WORKDIR /app
COPY . .
RUN npm install
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

## Instrucciones principales

### `FROM`

Especifica la imagen base sobre la que se construye tu imagen. Debe ser la primera instrucción (excepto comentarios).

```dockerfile
FROM ubuntu:22.04
FROM node:18-alpine
FROM python:3.11-slim
```

> [!tip]
> Usar imágenes base pequeñas (como `alpine` o `slim`) reduce el tamaño final de tu imagen, lo que hace más rápidos los despliegues.

### `WORKDIR`

Establece el directorio de trabajo dentro del contenedor. Las instrucciones siguientes se ejecutan en este directorio.

```dockerfile
WORKDIR /app
```

### `COPY` y `ADD`

Copian archivos desde el host al contenedor.

```dockerfile
COPY . .  # Copia todo el directorio actual a /app
COPY package.json .  # Copia un archivo específico
COPY src/ ./src/  # Copia un directorio
```

> [!warning]
> Usa `COPY` preferentemente. `ADD` es más antiguo, soporta URLs, y puede ser confuso. Solo usa `ADD` si realmente necesitas descargar archivos desde URLs.

### `RUN`

Ejecuta un comando durante la construcción de la imagen. Típicamente se usa para instalar dependencias.

```dockerfile
RUN apt-get update && apt-get install -y curl
RUN npm install
```

> [!tip]
> Combina múltiples comandos con `&&` en una sola instrucción `RUN` para reducir capas. Menos capas = imagen más pequeña y compilación más rápida.

### `ENV`

Define variables de entorno dentro de la imagen.

```dockerfile
ENV NODE_ENV=production
ENV APP_PORT=3000
```

### `EXPOSE`

Documentación del puerto que escucha el contenedor. **No abre el puerto automáticamente** — es solo información.

```dockerfile
EXPOSE 3000
EXPOSE 5432
```

> [!danger]
> `EXPOSE` no abre realmente el puerto. Para hacerlo, usa `-p` en `docker run`:

```bash
docker run -p 3000:3000 mi-app
```

### `CMD` vs `ENTRYPOINT`

Ambos definen el comando por defecto al iniciar el contenedor.

#### `CMD`

Puede ser sobrescrito en `docker run`:

```dockerfile
CMD ["npm", "start"]
```

```bash
docker run mi-app  # Ejecuta: npm start
docker run mi-app npm test  # Ejecuta: npm test (sobrescribe CMD)
```

#### `ENTRYPOINT`

Define el comando que siempre se ejecuta. Los argumentos de `docker run` se pasan como parámetros:

```dockerfile
ENTRYPOINT ["./start.sh"]
CMD ["--production"]
```

```bash
docker run mi-app  # Ejecuta: ./start.sh --production
docker run mi-app --debug  # Ejecuta: ./start.sh --debug
```

> [!tip]
> Usa `ENTRYPOINT` para crear contenedores tipo "herramienta" que siempre ejecutan lo mismo. Usa `CMD` para aplicaciones que podrían ejecutar comandos diferentes.

### `USER`

Define el usuario que ejecuta los comandos siguientes (por defecto es `root`).

```dockerfile
USER appuser
```

> [!danger]
> Ejecutar contenedores como `root` es un riesgo de seguridad. Siempre que sea posible, crea un usuario sin privilegios y usa `USER`.

### `LABEL`

Añade metadatos a la imagen.

```dockerfile
LABEL version="1.0"
LABEL author="tu-nombre"
LABEL description="Mi aplicación Docker"
```

## .dockerignore

Archivo (similar a `.gitignore`) que especifica qué archivos no incluir en la construcción.

```
# .dockerignore
node_modules
.git
.env
.vscode
*.log
```

Esto acelera la construcción al no copiar archivos innecesarios.

> [!example] Ejemplo completo: Aplicación Node.js
> ```dockerfile
> FROM node:18-alpine
>
> WORKDIR /app
>
> COPY package.json package-lock.json .
>
> RUN npm ci --only=production
>
> COPY . .
>
> ENV NODE_ENV=production
> EXPOSE 3000
>
> USER node
>
> CMD ["node", "index.js"]
> ```

## Construir una imagen

```bash
docker build -t mi-app:1.0 .
docker build -t mi-app:latest .
docker build -f Dockerfile.prod -t mi-app:prod .
```

## Multi-stage builds (Avanzado)

Para reducir el tamaño de la imagen final, puedes usar múltiples etapas:

> [!example]+ Ejemplo multi-stage
> ```dockerfile
> # Etapa 1: Build
> FROM node:18 AS builder
> WORKDIR /app
> COPY package*.json .
> RUN npm install
> COPY . .
> RUN npm run build
>
> # Etapa 2: Runtime (pequeña)
> FROM node:18-alpine
> WORKDIR /app
> COPY --from=builder /app/dist ./dist
> COPY --from=builder /app/node_modules ./node_modules
> COPY --from=builder /app/package*.json .
> CMD ["node", "dist/index.js"]
> ```
> Solo la etapa final (`alpine` pequeña) se incluye en la imagen. El resto (`builder`) se descarta.

## Próximos pasos

- [[03-comandos-basicos|Comandos básicos]]: Usa `docker build` y `docker run`
- [[05-volumenes-y-redes|Volúmenes y redes]]: Persiste datos desde tus contenedores
- [[06-docker-compose|Docker Compose]]: Define Dockerfiles e imágenes en `docker-compose.yml`

## Referencias

- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
