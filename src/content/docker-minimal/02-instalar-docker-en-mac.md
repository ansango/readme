---
title: Instalar docker en mac
description: "Instalar Docker en Mac: Docker Desktop, Homebrew, y verificación según chip (Apple Silicon / Intel)"
date: 2024-12-17
mod: 2026-07-10
published: true
tags: [apple, docker, mac, sysadmin]
---

# Instalar docker en mac

## Opción 1: Docker Desktop (GUI)

### Descargar e instalar

1. Ve a [la página oficial de Docker](https://www.docker.com/products/docker-desktop/) y descarga Docker Desktop.
2. **Elige la versión correcta según tu chip Mac:**
   - **Apple Silicon (M1/M2/M3/...)**: Descarga la versión `Docker.dmg` con soporte ARM64.
   - **Intel**: Descarga la versión Intel estándar.

> [!danger]
> Descargar la versión incorrecta puede causar incompatibilidades. Verifica tu chip en **Apple Menu > About This Mac > Chip**.

3. Abre el archivo `.dmg` descargado y arrastra `Docker.app` a la carpeta `Applications`.
4. Abre Docker desde `Applications` y sigue el asistente de configuración.

## Opción 2: Homebrew (CLI)

Si prefieres instalar Docker vía Homebrew (más rápido):

```bash
brew install --cask docker
```

> [!tip]
> Homebrew detecta automáticamente tu arquitectura (Apple Silicon o Intel) e instala la versión correcta de Docker Desktop.

> [!question] ¿Docker Desktop (GUI) u Homebrew (CLI)?
> Ambas opciones instalan lo mismo. Usa Homebrew si ya gestionas tus apps por terminal y quieres poder scriptear la instalación; usa el `.dmg` si prefieres un proceso guiado con interfaz gráfica.

## Verificar la instalación

Una vez instalado Docker, abre una terminal y verifica:

```bash
docker --version
docker compose version
```

> [!success] Instalación correcta
> Si ambos comandos devuelven un número de versión sin errores, Docker y Docker Compose están listos para usar.

## Continuar

Ahora que Docker está instalado en tu Mac, aprende los [[03-comandos-basicos|comandos básicos]] o pasa directamente a [[06-docker-compose|Docker Compose]].

## Referencias

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Desktop Mac Documentation](https://docs.docker.com/engine/mac/)
- [Docker Desktop on Apple Silicon](https://docs.docker.com/desktop/install/mac-install/)
