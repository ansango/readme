---
title: Instalar docker en linux
description: "Instalar Docker en Linux: guía completa para Ubuntu, Debian, Arch Linux con configuración y solución de problemas"
date: 2024-12-17
mod: 2026-07-10
published: true
tags: [arch, docker, linux, sysadmin, ubuntu]
---

# Instalar docker en linux

## Instalación en Debian

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove -y $pkg 2>/dev/null || true; done
```

> [!note]
> El comando anterior intenta eliminar paquetes antiguos que puedan entrar en conflicto. Si alguno no está instalado, el script continúa sin error gracias al `-y` (acepta automáticamente) y `2>/dev/null || true` (tolera fallos).

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verifica que Docker Compose está instalado como plugin:

```bash
docker compose version
```

```bash
sudo systemctl status docker
```

```bash
sudo systemctl start docker
```

## Instalación en Arch Linux

Actualiza repositorios:

```bash
sudo pacman -Syy
```

Instala Docker:

```bash
sudo pacman -S docker
```

Inicia Docker y habilítalo para que se inicie al reiniciar:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Verifica la versión:

```bash
docker --version
```

## Instalación en Ubuntu

Ubuntu (basado en Debian) puede usar el mismo método oficial que Debian arriba. Sin embargo, también existe un script de conveniencia rápido:

```bash
sudo apt update
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

> [!warning]
> El script de `get.docker.com` es cómodo pero **no se recomienda en producción**. Para entornos empresariales, utiliza el método oficial de Debian con repositorio firmado.

Después, añade tu usuario al grupo docker para evitar usar `sudo`:

```bash
sudo usermod -aG docker <username>
```

Cierra la sesión y vuelve a iniciar, luego verifica:

```bash
docker --version
docker run hello-world
```

### Problemas con compilación en algunas distribuciones

En algunas distribuciones, es posible que el plugin `docker-compose-plugin` no se compile correctamente. Si ocurre un error al ejecutar `docker compose version`, puedes reportar un bug en el repositorio oficial.

> [!tip]
> Esto es raro con Docker Engine moderno (v23+). En la mayoría de casos, el plugin se instala sin problemas con `docker-compose-plugin`.

## Añadir usuario en Docker

Creamos el grupo docker:

```bash
sudo groupadd docker
```

Añadimos al usuario:

```bash
sudo usermod -aG docker $USER
```

### Problemas de permisos

> [!bug] Error común
> ```
> docker: permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Head "http://%2Fvar%2Frun%2Fdocker.sock/_ping": dial unix /var/run/docker.sock: connect: permission denied.
> ```

Verifica los permisos del socket:

```shell
ls -l /var/run/docker.sock
```

> [!warning]
> **No hagas** `sudo chmod 666 /var/run/docker.sock` de forma permanente (crea un riesgo de seguridad). En su lugar, asegúrate de que el usuario esté en el grupo docker:

```bash
sudo usermod -aG docker $USER
```

Reinicia Docker:

```bash
sudo systemctl restart docker
```

Y prueba nuevamente:

```bash
docker run hello-world
```

> [!success] Instalación correcta
> Si ves el mensaje "Hello from Docker!", tu instalación funciona correctamente y el usuario tiene los permisos adecuados.

## Continuar

Ahora que Docker está instalado, aprende los [[03-comandos-basicos|comandos básicos]] o pasa directamente a [[06-docker-compose|Docker Compose]] para orquestar múltiples contenedores.
