---
title: "Instalar Docker"
description: "Setup multiplataforma del Docker client y server: Linux (Ubuntu, Fedora), macOS (Docker Desktop, Homebrew), Windows 11 (Docker Desktop, WSL2, Chocolatey), y Vagrant para VMs Linux"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, install, ubuntu, fedora, macos, windows, wsl2, vagrant, docker-desktop]
---

# Instalar Docker

> [!abstract] Resumen
> Esta nota cubre la instalación del Docker client y server en las plataformas más comunes: Linux (Ubuntu y Fedora con apt/dnf), macOS (Docker Desktop o Homebrew), Windows 11 (Docker Desktop con WSL2 o Hyper-V, o Chocolatey), y el approach con Vagrant cuando necesitas una VM Linux. Cubre también el primer test de la instalación con un container de Ubuntu/Fedora/Alpine y cómo explorar el Docker server.

## Antes de empezar

Los pasos de instalación varían según la plataforma de desarrollo y la distribución Linux de producción. El Docker client puede correr en Linux, Windows y macOS, pero los **Linux containers solo se construyen y lanzan en un sistema Linux**. Por eso, en Windows y macOS necesitas o una VM o un server remoto que aloje el Docker server. Docker Desktop, Docker Community Edition y Vagrant son las tres formas principales de resolver esto.

> [!tip] Elige un método y quédate con él
> No instales más de uno a la vez. Mezclar Docker Desktop, Docker Community Edition, el package manager del OS y Vagrant puede causar problemas si no sabes bien cómo cambiar entre ellos. **Empieza con el primero que se ajuste a tu caso**.

## Docker Client

El Docker client soporta nativamente versiones 64-bit de Linux, Windows y macOS. La mayoría de las distribuciones Linux populares vienen de Debian (usa `apt`) o Red Hat (usa `rpm` + `yum`/`dnf`). Alpine Linux, popular en containers por su tamaño mínimo, usa `apk`. En macOS y Windows hay installers GUI y también package managers populares (Homebrew y Chocolatey).

### Linux

Recomendado usar una release moderna. **Kernel 3.8+** mínimo, idealmente la última stable de tu distribución preferida. Las instrucciones asumen Ubuntu 22.04 o Fedora 36.

#### Ubuntu 22.04 (64-bit)

```bash
# Limpia versiones antiguas
sudo apt-get remove docker docker.io containerd runc
sudo apt-get remove docker-engine

# Instala dependencias y añade el repo de Docker
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) \
signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instala Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io \
  docker-compose-plugin
```

#### Fedora 36 (64-bit)

```bash
# Limpia versiones antiguas
sudo dnf remove -y docker docker-client docker-client-latest \
  docker-common docker-latest docker-latest-logrotate \
  docker-logrotate docker-selinux docker-engine-selinux \
  docker-engine

# Añade el repo
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo \
  https://download.docker.com/linux/fedora/docker-ce.repo

# Instala Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io \
  docker-compose-plugin
```

> [!tip] Docker Desktop para Linux
> Aunque el libro no entra en detalle, **Docker Desktop para Linux existe** y puede usarse si prefieres correr el Docker daemon en una VM local en lugar de directamente en tu sistema.

### macOS

#### Docker Desktop (GUI installer)

Descarga el instalador de Docker Desktop para Mac, doble clic y sigue los prompts. Docker Desktop para macOS usa **xhyve** y el Apple Hypervisor framework para dar una capa de virtualización ligera que provee el Linux server component necesario para construir imágenes y correr containers.

#### Homebrew

```bash
brew install --cask docker
```

> [!tip] Homebrew + Vagrant
> Si vas por Homebrew para el CLI, considera instalar también Vagrant para gestionar la VM Linux que correrá el Docker server.

### Windows 11

> [!tip] WSL2 primero
> Es muy recomendable **set up WSL2 (Windows Subsystem for Linux v2) antes de instalar Docker Desktop**, y luego seleccionar las opciones del instalador de Docker Desktop para habilitar y default a WSL2.

Docker Desktop para Windows puede usar Hyper-V para virtualizar el Linux server, pero **WSL2 da la mejor experiencia** para Linux containers.

```powershell
# Descarga el instalador de Docker Desktop para Windows
# Doble clic y sigue los prompts

# Para instalar el CLI via Chocolatey (opcional):
choco install docker-desktop
```

#### Cambiar entre Linux y Windows containers

Por defecto, Docker Desktop en Windows viene configurado para Linux containers. Si ves un error como "no matching manifest for windows/amd64", está en modo Windows containers. Click derecho en el icono de Docker en la taskbar → "Switch to Linux containers...".

### Servidor en VM Linux (Vagrant)

Si no puedes usar Docker Desktop (versión vieja de Windows, no quieres Hyper-V, etc.), puedes usar **Vagrant** para crear y gestionar la VM Linux que correrá el Docker server. Vagrant funciona sobre varios hypervisors:

| Hypervisor | Tipo | Plataformas |
|---|---|---|
| VirtualBox | Gratis | Multi |
| VMware Workstation Pro/Fusion | Comercial | Multi |
| Hyper-V | Incluido en Windows Pro | Windows |
| KVM | Gratis | Linux |

> [!warning] El ejemplo de Vagrant NO es seguro
> El setup con Vagrant que muestra el libro expone un puerto Docker TCP sin encriptar. Es solo una demo, no una recomendación para producción. **Usa TLS o SSH** para asegurar el endpoint.

Ejemplo de `Vagrantfile` que crea un host Docker con Ubuntu 22.04:

```ruby
$script = <<-SCRIPT
echo '{"hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"]}' \
  | sudo tee /etc/docker/daemon.json
sudo mkdir -p /etc/systemd/system/docker.service.d
echo -e "[Service]\nExecStart=\nExecStart=/usr/bin/dockerd" \
  | sudo tee /etc/systemd/system/docker.service.d/docker.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.box = 'bento/ubuntu-22.04'
  config.vm.provision :docker
  config.vm.provision "shell", inline: $script, run: "always"
  config.vm.network "forwarded_port",
    guest: 2375, host: 12375, protocol: "tcp", auto_correct: true
end
```

Arranca la VM y configura el contexto de Docker:

```bash
vagrant up
docker context create vagrant --docker host=tcp://127.0.0.1:12375
docker context use vagrant
docker version
# Cuando termines:
vagrant halt
docker context use default
```

> [!tip] Colima en macOS
> Si usas macOS, échale un ojo a **Colima**: facilita mucho el spin up y gestión de una VM Docker o Kubernetes flexible.

## Docker Server

El Docker server es un binario separado del client. Si usaste Docker Desktop o Community Edition, el server ya está configurado. Solo asegúrate de que esté corriendo. En Windows y macOS, eso es arrancar la app de Docker. En Linux con systemd:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

## Testear el setup

Una vez tengas client y server funcionando, **testea que todo se comunica bien**. Lanza un container basado en una imagen oficial y entra a una shell:

```bash
# Ubuntu
docker container run --rm -ti docker.io/ubuntu:latest /bin/bash

# Fedora
docker container run --rm -ti docker.io/fedora:latest /bin/bash

# Alpine Linux
docker container run --rm -ti docker.io/alpine:latest /bin/sh
```

Si todo va bien, verás un prompt de root dentro del container (`root@<hash>:#` o `/#` para Alpine). Sale con `exit`. Esto demuestra que puedes correr containers basados en cualquier distribución Linux.

> [!tip] Añádete al grupo docker
> En Linux, por defecto necesitas `sudo` para usar Docker. La mayoría de installs crean un grupo `docker`. Añádete para evitar el `sudo`:
> ```bash
> sudo usermod -aG docker $USER
> # Cierra sesión y vuelve a entrar para que tome efecto
> ```

## Explorando el Docker server

Aunque normalmente el server arranca automáticamente, **ver el comando manual** ayuda a entender qué pasa por debajo:

```bash
sudo dockerd \
  -H unix:///var/run/docker.sock \
  --config-file /etc/docker/daemon.json
```

El flag `-H` define dónde escucha el daemon (Unix socket), y `--config-file` apunta al archivo de configuración (por defecto `/etc/docker/daemon.json`).

> [!note] Docker Desktop y la VM
> En macOS y Windows, Docker Desktop corre una pequeña VM Linux donde está el daemon. Esa VM **no tiene SSH** por diseño, pero puedes entrar con `nsenter`:
> ```bash
> docker container run --rm -it --privileged --pid=host debian \
>   nsenter -t 1 -m -u -n -i sh
> # Dentro del container verás "Docker Desktop" como /etc/os-release
> ```

El archivo de configuración del daemon es típicamente `/etc/docker/daemon.json` (o `/containers/services/docker/rootfs/etc/docker/daemon.json` en Docker Desktop). Puede estar vacío o casi vacío porque Docker usa defaults razonables. En Docker Desktop, edítalo desde Preferences → Docker Engine.

## Próximos pasos

- [[04-trabajar-con-imagenes-docker]]: anatomía de un Dockerfile, instrucciones clave (FROM, RUN, COPY, ENV, ARG, LABEL, USER, WORKDIR, CMD), build, run, build args, env vars como configuración, y custom base images.
