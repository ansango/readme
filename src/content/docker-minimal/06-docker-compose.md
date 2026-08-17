---
title: Docker Compose
description: "Docker Compose v2: orquestación de aplicaciones multicontenedor con archivos YAML"
date: 2025-07-30
mod: 2026-07-10
published: true
tags: [docker, sysadmin, compose, orchestration]
---

# Docker Compose

**Docker Compose** es una herramienta que permite definir y ejecutar aplicaciones con múltiples contenedores usando un archivo `docker-compose.yml`. En lugar de lanzar cada contenedor por separado, Compose los gestiona como una unidad.

## Instalación

Docker Compose v2 viene **integrado** en Docker Desktop (Windows, Mac) y como plugin oficial en Linux.

### Verificar instalación

```bash
docker compose version
```

Deberías ver una versión v2.x.x (sin guion, no `docker-compose`).

> [!danger]
> Ya no se recomienda el binario antiguo `docker-compose` v1.29.2 (descontinuado). Usa siempre la versión v2 (plugin oficial).

### En Linux (si no viene preinstalado)

Consulta [[01-instalar-docker-en-linux|Instalar Docker en Linux]] para instalar el plugin `docker-compose-plugin`.

## Estructura básica de `docker-compose.yml`

```yaml
version: '3.9'

services:
  app:
    image: mi-app:1.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - app-data:/data

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  app-data:
  db-data:
```

## Conceptos clave

### `services`

Define los contenedores que forman tu aplicación. Cada servicio se convierte en un contenedor con nombre.

### `image`

La imagen Docker a usar. Puede ser:
- Desde Docker Hub: `postgres:15`
- Local: `mi-app:1.0`
- Construida durante el build: `build: .`

### `ports`

Mapea puertos del host al contenedor (igual que `-p` en `docker run`).

```yaml
ports:
  - "8080:80"  # host:contenedor
  - "3000"  # Asigna un puerto aleatorio del host
```

### `environment` / `env_file`

Variables de entorno del contenedor.

```yaml
environment:
  - NODE_ENV=production
  - DB_HOST=db

# O desde archivo:
env_file:
  - .env
```

### `volumes`

Monta volúmenes o directorios locales.

```yaml
volumes:
  - app-data:/app/data  # Volumen nombrado
  - ./local:/app/local  # Bind mount
```

### `networks`

Conecta servicios a una red compartida. Por defecto, Compose crea una red para todos los servicios.

```yaml
services:
  app:
    networks:
      - app-net
  db:
    networks:
      - app-net

networks:
  app-net:
    driver: bridge
```

### `build`

Construye una imagen desde un Dockerfile en lugar de descargarla.

```yaml
services:
  app:
    build: .  # Busca ./Dockerfile
    # O personalizado:
    build:
      context: .
      dockerfile: Dockerfile.prod
```

> [!example]+ Ejemplo completo
> ```yaml
> version: '3.9'
>
> services:
>   web:
>     build: .
>     container_name: mi-app
>     ports:
>       - "3000:3000"
>     environment:
>       NODE_ENV: production
>       DATABASE_URL: postgresql://postgres:password@db:5432/myapp
>     volumes:
>       - app-logs:/app/logs
>     depends_on:
>       - db
>     networks:
>       - app-net
>     restart: unless-stopped
>
>   db:
>     image: postgres:15
>     container_name: mi-db
>     environment:
>       POSTGRES_USER: postgres
>       POSTGRES_PASSWORD: password
>       POSTGRES_DB: myapp
>     volumes:
>       - db-data:/var/lib/postgresql/data
>     networks:
>       - app-net
>     restart: unless-stopped
>
>   cache:
>     image: redis:7-alpine
>     container_name: mi-cache
>     networks:
>       - app-net
>     restart: unless-stopped
>
> volumes:
>   app-logs:
>   db-data:
>
> networks:
>   app-net:
>     driver: bridge
> ```

### Detalles adicionales

- **`container_name`**: Nombre personalizado del contenedor (por defecto es `<carpeta>_<servicio>_1`).
- **`depends_on`**: Indica que `web` depende de `db` (inicia `db` primero).
- **`restart`**: Política de reinicio (`no`, `always`, `unless-stopped`).

> [!note]
> Usa `restart: unless-stopped` en producción para que los servicios se reinicien automáticamente si la máquina se reinicia (excepto si los detuviste manualmente).

## Comandos de Docker Compose

### Iniciar la aplicación

```bash
docker compose up  # Modo foreground (logs en consola)
docker compose up -d  # Background (detached)
docker compose up --build  # Reconstruir imágenes si han cambiado
```

> [!tip]
> En desarrollo usa `docker compose up` (sin `-d`) para ver los logs en tiempo real. En producción usa `-d` para que se ejecute en background.

### Ver logs

```bash
docker compose logs  # Todos los servicios
docker compose logs -f web  # Logs en vivo del servicio "web"
docker compose logs --tail 50 db  # Últimas 50 líneas del servicio "db"
```

### Ver estado de los servicios

```bash
docker compose ps  # Servicios en ejecución
docker compose ps -a  # Todos (incluyendo detenidos)
```

### Ejecutar comandos en un servicio

```bash
docker compose exec web sh  # Shell interactiva
docker compose exec db psql -U postgres -d myapp  # Comando específico
```

### Reconstruir imágenes

```bash
docker compose build  # Reconstruir todas
docker compose build web  # Solo "web"
```

### Detener la aplicación

```bash
docker compose stop  # Detiene los contenedores (no los elimina)
docker compose restart  # Reinicia
```

### Eliminar la aplicación

```bash
docker compose down  # Elimina contenedores y redes
docker compose down -v  # También elimina volúmenes
docker compose down --rmi all  # También elimina imágenes
```

> [!danger]
> `docker compose down -v` elimina volúmenes, incluyendo datos persistentes. Haz backup antes de ejecutar si necesitas los datos.

## Variables de entorno (.env)

Crea un archivo `.env` en el mismo directorio que `docker-compose.yml`:

```
# .env
NODE_ENV=production
DB_PASSWORD=mi-contraseña-segura
DOCKER_PORT=3000
```

Luego referenciarlas en `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=${NODE_ENV}
  - DB_PASSWORD=${DB_PASSWORD}

ports:
  - "${DOCKER_PORT}:3000"
```

Compose reemplaza las variables automáticamente.

## Overrides (docker-compose.override.yml)

Crea un archivo `docker-compose.override.yml` para sobrescribir valores sin editar el archivo principal:

```yaml
# docker-compose.override.yml
services:
  web:
    environment:
      DEBUG: "true"
      LOG_LEVEL: debug
    volumes:
      - ./src:/app/src  # Hot reload en desarrollo
```

Compose automáticamente carga `docker-compose.yml` + `docker-compose.override.yml`.

> [!question] ¿Cuándo usar override en vez de `-f`?
> Usa `docker-compose.override.yml` para ajustes locales automáticos (por ejemplo, en desarrollo) que no quieres versionar o que se cargan siempre sin flags extra. Usa `-f archivo.yml` cuando quieras elegir explícitamente qué configuración aplicar (por ejemplo, alternar entre desarrollo y producción).

## Ejemplo: Desarrollo vs Producción

**docker-compose.yml** (base):

```yaml
version: '3.9'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-development}
```

**docker-compose.prod.yml** (producción):

```yaml
version: '3.9'
services:
  web:
    restart: always
    environment:
      NODE_ENV: production
```

Ejecutar:

```bash
docker compose -f docker-compose.yml up  # Desarrollo
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d  # Producción
```

> [!success] Buenas prácticas
> 1. **Versiona** `docker-compose.yml` pero **no** `.env` (contiene secretos).
>
> > [!warning] Nunca commitees `.env` a git
> > Añádelo a `.gitignore`:
> > ```
> > .env
> > .env.local
> > ```
>
> 2. **Usa volúmenes nombrados** para datos persistentes, no bind mounts en producción.
> 3. **Establece `restart`** para que los servicios se reinicien automáticamente.
> 4. **Usa `depends_on`** para indicar dependencias.
> 5. **Crea redes explícitas** para aislar aplicaciones.
> 6. **Limpia regularmente**: `docker compose down -v` elimina recursos huérfanos.

## Conversión desde `docker run`

Si tienes un comando `docker run` y quieres convertirlo a `docker-compose.yml`, usa [[07-composerize|Composerize]].

## Próximos pasos

- [[03-comandos-basicos|Comandos básicos]]: Comandos `docker` individuales
- [[04-dockerfile|Dockerfile]]: Define imágenes personalizadas
- [[05-volumenes-y-redes|Volúmenes y redes]]: Cómo funcionan en Compose

## Referencias

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Compose Best Practices](https://docs.docker.com/compose/production/)
