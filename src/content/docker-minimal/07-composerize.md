---
title: Composerize
description: "Composerize: herramienta para convertir comandos docker run a docker-compose.yml automáticamente"
date: 2024-12-17
mod: 2026-07-10
published: true
tags: [development, docker, tool]
---

# Composerize

Composerize es una herramienta que convierte comandos `docker run` en archivos `docker-compose.yml`. Simplifica el proceso de migración de un contenedor independiente a una configuración de Docker Compose, permitiendo una gestión más sencilla de aplicaciones multicontenedor.

> [!quote] Descripción oficial del repositorio
> "Composerize: Redo docker run commands in Docker Compose format" — [magicmark/composerize](https://github.com/magicmark/composerize)

## Funcionalidades clave

- **Conversión automática**: Transforma la sintaxis y las opciones de un comando `docker run` a la estructura de un servicio de Docker Compose.
- **Interfaz web y CLI**: Disponible como una herramienta en línea en `composerize.com` y como un paquete de `npm` para su uso en la línea de comandos.
- **Soporte para la mayoría de las opciones de `docker run`**: Reconoce y convierte volúmenes, puertos, variables de entorno, y otras opciones comunes.
- **Decomposerize**: Incluye una herramienta inversa, `decomposerize`, que convierte un archivo `docker-compose.yml` de nuevo a comandos `docker run`.

> [!note]
> La conversión es automática pero puede necesitar ajustes manuales, especialmente para configuraciones complejas.

## Ventajas

- **Ahorro de tiempo**: Automatiza la creación de archivos `docker-compose.yml`, reduciendo el esfuerzo manual.
- **Facilita el aprendizaje**: Ayuda a los usuarios a entender la sintaxis de Docker Compose al mostrar la correspondencia directa con los comandos `docker run`.
- **Mejora la gestión de contenedores**: Facilita la transición a Docker Compose para una mejor organización y reproducibilidad de los entornos.
- **Flexibilidad**: Se puede utilizar tanto en un navegador web como localmente en un entorno de desarrollo.

## Uso

### Interfaz web

1. Visita [composerize.com](https://www.composerize.com/).
2. Pega tu comando `docker run` en el campo de entrada.
3. La herramienta generará automáticamente el contenido del archivo `docker-compose.yml` correspondiente.

Ejemplo: Si pegas:

```bash
docker run -d -p 8080:80 -v /datos:/app/data -e DEBUG=true --name mi-app mi-imagen:1.0
```

Obtendrás:

```yaml
version: '3.3'
services:
  mi-app:
    image: mi-imagen:1.0
    container_name: mi-app
    ports:
      - "8080:80"
    volumes:
      - /datos:/app/data
    environment:
      - DEBUG=true
```

### Línea de comandos

1. Instala Composerize globalmente usando `npm`:

    ```bash
    npm install -g composerize
    ```

2. Ejecuta Composerize con un comando `docker run` entre comillas:

    ```bash
    composerize "docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --name mi-container mi-imagen"
    ```

Esto imprimirá el `docker-compose.yml` resultante en la salida estándar.

> [!example] Ejemplo práctico
> Supongamos que tienes un contenedor ejecutándose con:
> ```bash
> docker run -d \
>   --name myapp \
>   -p 3000:3000 \
>   -e NODE_ENV=production \
>   -e DB_HOST=db \
>   -e DB_PASSWORD=secret \
>   -v app-logs:/app/logs \
>   myapp:1.0
> ```
> Pégalo en [composerize.com](https://www.composerize.com/) y obtendrás:
> ```yaml
> version: '3.3'
> services:
>   myapp:
>     image: myapp:1.0
>     container_name: myapp
>     ports:
>       - "3000:3000"
>     environment:
>       - NODE_ENV=production
>       - DB_HOST=db
>       - DB_PASSWORD=secret
>     volumes:
>       - app-logs:/app/logs
> ```
> Luego puedes:
> - Mejorar manualmente (agregar versión más reciente, servicios adicionales, redes, etc.)
> - Guardar como `docker-compose.yml`
> - Usar con `docker compose up -d`

## Decomposerize (inversa)

La herramienta inversa, `decomposerize`, convierte un `docker-compose.yml` de vuelta a comandos `docker run`:

```bash
npm install -g decomposerize
decomposerize docker-compose.yml
```

Útil si necesitas extraer un servicio específico como comando.

## Limitaciones

> [!warning]
> - La conversión es automática pero **puede necesitar ajustes manuales** (especialmente para configuraciones complejas).
> - No genera `Dockerfile` — solo la configuración de Compose.
> - Las opciones avanzadas de `docker run` pueden no ser soportadas completamente.
> 
> **Consejo**: Después de la conversión, revisa el YAML generado cuidadosamente.

## Próximos pasos

- [[06-docker-compose|Docker Compose]]: Aprende a escribir y optimizar archivos `docker-compose.yml`
- [[05-volumenes-y-redes|Volúmenes y redes]]: Entiende cómo funcionan los volúmenes y redes en Compose
- [[03-comandos-basicos|Comandos básicos]]: Referencia de comandos `docker run`

## Referencias

- [Composerize en GitHub](https://github.com/magicmark/composerize)
- [composerize.com](https://www.composerize.com/)
