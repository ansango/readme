---
title: Comandos básicos de Docker
description: "Referencia rápida de comandos Docker esenciales: gestión de imágenes, contenedores, inspección y limpieza"
date: 2026-07-10
mod: 2026-07-10
published: true
tags: [docker, sysadmin, cheatsheet]
---

# Comandos básicos de Docker

> [!abstract] Resumen
> Cheatsheet de los comandos más comunes para trabajar con Docker en el día a día: imágenes, contenedores, inspección y limpieza. Para más detalles, consulta la [documentación oficial](https://docs.docker.com/engine/reference/commandline/).

## Gestión de imágenes

### Ver imágenes descargadas

```bash
docker images
docker images --all  # Incluyendo imágenes intermedias
```

> [!note]
> Las imágenes se almacenan localmente en tu máquina. Usa `docker images` para verlas todas.

### Descargar una imagen

```bash
docker pull nombre-imagen
docker pull nombre-imagen:tag  # Versión específica
```

### Crear una imagen desde un Dockerfile

```bash
docker build -t nombre-imagen:tag .
docker build -t nombre-imagen:tag -f Dockerfile.custom .  # Dockerfile personalizado
```

### Eliminar una imagen

```bash
docker rmi nombre-imagen
docker rmi nombre-imagen:tag
docker rmi -f nombre-imagen  # Fuerza eliminación
```

## Gestión de contenedores

### Crear y ejecutar un contenedor

```bash
docker run nombre-imagen
docker run -d nombre-imagen  # Ejecutar en background (detached)
docker run --name mi-contenedor nombre-imagen  # Nombrar el contenedor
docker run -p 8080:80 nombre-imagen  # Mapear puertos (host:contenedor)
docker run -v /ruta/host:/ruta/contenedor nombre-imagen  # Montar volumen
docker run -e VAR=valor nombre-imagen  # Variable de entorno
docker run -it nombre-imagen /bin/bash  # Terminal interactiva
```

> [!tip]
> `-d` (detached) ejecuta el contenedor en background. Sin este flag, verás los logs en tu terminal y deberás presionar Ctrl+C para salir.

> [!example] Combinado (caso común)
> ```bash
> docker run -d --name mi-app -p 3000:3000 -v $(pwd):/app -e NODE_ENV=production mi-imagen:1.0
> ```
> Ejecuta en background, nombra el contenedor, mapea el puerto 3000, monta el directorio actual como volumen y define una variable de entorno.

### Listar contenedores

```bash
docker ps  # Solo contenedores en ejecución
docker ps -a  # Todos los contenedores
docker ps -l  # Último contenedor
```

### Ejecutar comandos en un contenedor en ejecución

```bash
docker exec -it mi-contenedor /bin/bash  # Acceder a la shell
docker exec mi-contenedor comando  # Ejecutar comando específico
```

### Ver logs de un contenedor

```bash
docker logs mi-contenedor
docker logs -f mi-contenedor  # Mostrar logs en vivo (follow)
docker logs --tail 50 mi-contenedor  # Últimas 50 líneas
```

### Detener / Iniciar / Reiniciar contenedor

```bash
docker stop mi-contenedor  # Detener
docker start mi-contenedor  # Iniciar
docker restart mi-contenedor  # Reiniciar
```

### Eliminar un contenedor

```bash
docker rm mi-contenedor
docker rm -f mi-contenedor  # Fuerza eliminación (incluso si está en ejecución)
```

> [!warning]
> `docker rm` elimina el contenedor y sus datos locales. Si necesitas persistencia, usa volúmenes.

## Inspección y depuración

### Inspeccionar contenedor o imagen

```bash
docker inspect mi-contenedor  # JSON con detalles completos
docker inspect --format='{{.NetworkSettings.IPAddress}}' mi-contenedor  # Campo específico
```

### Ver estadísticas en vivo

```bash
docker stats  # CPU, memoria, red de todos los contenedores
docker stats mi-contenedor  # Solo uno
```

### Ver historial de cambios en un contenedor

```bash
docker diff mi-contenedor
```

## Limpieza y mantenimiento

### Eliminar contenedores detenidos

```bash
docker container prune  # Elimina todos los contenedores detenidos
docker container prune -f  # Sin confirmar
```

### Ver uso de disco

```bash
docker system df  # Resumen de imágenes, contenedores, volúmenes
```

### Limpiar todo (cuidado)

```bash
docker system prune  # Elimina contenedores, redes y imágenes sin usar
docker system prune -a  # También elimina imágenes con etiqueta
docker system prune --volumes  # También elimina volúmenes sin usar
```

> [!danger]
> `docker system prune` elimina datos permanentemente. Asegúrate de que no necesitas esos recursos antes de ejecutarlo.

## Red y volúmenes

### Listar volúmenes

```bash
docker volume ls
```

### Crear un volumen

```bash
docker volume create mi-volumen
```

### Listar redes

```bash
docker network ls
```

### Crear una red

```bash
docker network create mi-red
docker run --network mi-red --name contenedor1 imagen1
```

## Próximos pasos

- [[04-dockerfile|Dockerfile]]: Crea tus propias imágenes
- [[05-volumenes-y-redes|Volúmenes y redes]]: Persistencia y comunicación entre contenedores
- [[06-docker-compose|Docker Compose]]: Orquesta múltiples contenedores
