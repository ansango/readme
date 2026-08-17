---
title: "Trabajar con contenedores"
description: "Qué son los containers, breve historia (chroot, jail, LXC), docker container create/run/start, configuración (nombre, labels, hostname, DNS, MAC), storage volumes, resource quotas"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, containers, history, volumes, resources, cgroups, namespaces]
---

# Trabajar con contenedores

> [!abstract] Resumen
> Esta nota cubre el día a día con containers. Empieza con la definición (qué son, qué no son) y un breve recorrido histórico (chroot, jail, LXC). Después entra en cómo crear containers (`docker container create` vs `run`), las opciones de configuración (nombre, labels, hostname, DNS, MAC address), storage volumes (bind mounts, SELinux), y cómo poner resource quotas (CPU shares, memory, block I/O) con cgroups. Es la base para correr containers de forma controlada.

## Qué son los containers

Los containers son **execution environments self-contained** que comparten el kernel del host y están (opcionalmente) aislados de otros containers en el sistema. Es lo que se llama **OS-level virtualization**.

A diferencia de VMs (que tienen su propio kernel sobre un hypervisor), los containers son **procesos del host kernel** con aislamiento. Ventajas:

- Eficiencia de recursos: no necesitas una instancia completa de OS por cada workload aislado.
- Menos capas de indirección: cuando un proceso llama al hardware, no hay doble salto como en VMs.
- Casi todo lo que corre en el kernel del host puede correr en un container.

> [!note] Limitación fundamental
> Como comparten kernel, los containers solo pueden correr **procesos compatibles con el kernel subyacente**. Una app Windows no corre nativamente en un Linux container en un host Linux. **Sí puede** correr en un Windows container en un host Windows.

## Breve historia

Los containers no son nuevos. La semilla se plantó en **1979** con `chroot` (Unix V7), que restringe la vista del filesystem de un proceso a un subárbol. En los 80s y 90s hubo variantes Unix con mandatory access controls. En 2000, **FreeBSD 4.0** introdujo `jail`, que expandía chroot con restricciones de red y procesos. En 2004, **Solaris Zones** apareció como la primera implementación comercial importante. En 2008, **LXC (Linux Containers)** llegó al kernel Linux. En 2013, **user namespaces** (kernel 3.8) y el lanzamiento de Docker un mes después **dispararon la adopción masiva**.

> [!quote] Serverless no es sin servidores
> Las tecnologías "serverless" dependen de los servidores de otros. Solo que el dueño de la app no tiene que gestionar el hardware y el OS.

## Crear un container

`docker container run` es un wrapper que combina dos pasos: `docker container create` (crea el container desde la imagen) y `docker container start` (lo ejecuta). Puedes hacerlos por separado:

```bash
# Crear
docker container create --name="awesome-service" ubuntu:latest sleep 120

# Iniciar
docker container start awesome-service
# Se detendrá automáticamente a los 120s, o antes con:
docker container stop awesome-service
```

> [!warning] Nombres únicos
> Solo puede haber un container con un nombre dado en un host Docker. Si ejecutas el mismo `create` dos veces, el segundo falla. Borra el anterior con `docker container rm` o usa otro nombre.

### Configuración básica

#### Container name

```bash
docker container create --name="mi-app" ubuntu:latest sleep 120
```

Si no se especifica, Docker genera un nombre aleatorio combinando adjetivo y nombre de famoso (`ecstatic-babbage`, `serene-albattani`).

#### Labels

Metadata key/value que se heredan de la imagen y puedes extender:

```bash
docker container run --rm -d --name has-some-labels \
  -l deployer=Ahmed -l tester=Asako \
  ubuntu:latest sleep 1000

# Filtra por label
docker container ls -a -f label=deployer=Ahmed

# Ver todos los labels
docker container inspect has-some-labels
```

#### Hostname

Por defecto, el hostname es el ID del container. Para algo más legible:

```bash
docker container run --rm -ti --hostname="mycontainer.example.com" \
  ubuntu:latest /bin/bash
# Dentro: hostname -f → mycontainer.example.com
```

#### DNS

`/etc/resolv.conf` se bind-mounte desde el host. Para sobreescribir:

```bash
docker container run --rm -ti \
  --dns=8.8.8.8 --dns=8.8.4.4 \
  --dns-search=example1.com --dns-search=example2.com \
  ubuntu:latest /bin/bash
```

> [!tip] Dejar el search domain unset
> Usa `--dns-search=` (vacío) si quieres que el container no tenga search domain.

#### MAC address

Por defecto, el container recibe una MAC calculada con prefijo `02:42:ac:11`. Para fijarla (por ejemplo, para evitar conflictos con otra capa de virtualización):

```bash
docker container run --rm -ti --mac-address="a2:11:aa:22:bb:33" \
  ubuntu:latest /bin/bash
```

> [!warning] ARP contention
> Dos systems con la misma MAC address en la misma red causan **ARP contention**. Si tienes que fijar MACs, quédate dentro de los rangos `x2-xx-xx-xx-xx-xx`, `x6-xx-xx-xx-xx-xx`, `xA-xx-xx-xx-xx-xx`, `xE-xx-xx-xx-xx-xx`.

## Storage volumes

A veces el espacio default del container o su naturaleza ephemeral **no es suficiente** y necesitas storage que persista entre deploys.

```bash
# Bind mount (monta directorio del host en el container)
docker container run --rm -ti \
  --mount type=bind,target=/mnt/session_data,source=/data \
  ubuntu:latest /bin/bash

# O con -v (sintaxis corta)
docker container run --rm -ti \
  -v /mnt/session_data:/data \
  ubuntu:latest /bin/bash

# Read-only
docker container run --rm -ti \
  -v /mnt/session_data:/data:ro \
  ubuntu:latest /bin/bash
```

> [!warning] No es generalmente recomendado
> Montar storage del host en containers **ata el container a un host particular** para su estado persistente. Para casos como cache temporal puede tener sentido; para state persistente, busca volúmenes externos o servicios gestionados.

### SELinux y volume mounts

Con SELinux habilitado en el host, mount puede dar "Permission Denied". Usa las opciones `z` (compartido entre containers) o `Z` (privado, un solo container):

```bash
# Compartido entre containers
docker container run --rm -v /app/dhcpd/etc:/etc/dhcpd:z dhcpd

# Privado (un solo container, mejor seguridad)
docker container run --rm -v /app/dhcpd/etc:/etc/dhcpd:Z dhcpd
```

> [!danger] Cuidado con Z en system directories
> Bind-mounting `/etc` o `/var` con `Z` puede **romper tu host** (cambia los SELinux labels). Solo usa `Z` en volúmenes dedicados a containers.

### Read-only root filesystem

Para prevenir que procesos escriban al filesystem del container (logs, archivos temporales inesperados):

```bash
docker container run --rm -ti --read-only=true \
  -v /mnt/session_data:/data \
  ubuntu:latest /bin/bash
# El root está read-only, pero /data (volume) sigue rw
```

Combinado con tmpfs para directorios como `/tmp`:

```bash
docker container run --rm -ti --read-only=true \
  --mount type=tmpfs,destination=/tmp,tmpfs-size=256M \
  ubuntu:latest /bin/bash
```

> [!warning] Diseña stateless
> Containers stateless son mucho más simples de gestionar. Storage crea dependencias que complican los deploys. **Empieza con stateless, agrega state solo cuando sea realmente necesario**.

## Resource quotas

El problema clásico de "noisy neighbor": otros containers consumen recursos en el mismo host. Las VMs resuelven esto con límites estrictos de memoria y CPU por VM. En Docker, **cgroups del Linux kernel** hacen este trabajo.

```bash
# Verificar soporte de cgroups en tu kernel
docker system info
# Si falta soporte, verás warnings como:
# WARNING: No swap limit support
```

### CPU shares

El total de poder de cómputo de los cores es **1,024 shares**. Asignar 512 a un container significa que puede usar hasta la mitad de CPU. Son shares, no exclusivo: si otros containers no usan CPU, este puede usar más.

```bash
# 50% del CPU
docker container run --rm -ti \
  --cpu-shares=512 \
  spkane/train-os \
  stress --cpu 2 --io 1 --vm 2 --vm-bytes 128M --timeout 30s
```

| Container | CPU shares | Comportamiento |
|---|---|---|
| A | 1024 (default) | Tiempo completo de CPU |
| B | 512 | Mitad del tiempo de A |
| C | 512 | Mitad del tiempo de A |

Si A no está corriendo, B y C pueden usar el 100% cada uno.

> [!note] Shares vs límites absolutos
> CPU shares son **proporcionales** (relativos). Para límites absolutos, usa `--cpuset-cpus` (pines a cores específicos) o `--cpu-quota` / `--cpu-period` (límite duro en microsegundos).

### Memory limits

```bash
# Limitar a 256 MB
docker container run --rm -d \
  --memory=256m \
  --memory-swap=512m \
  your-image

# Si el container excede la memoria, es OOMKilled
```

> [!note] `--memory-swap`
> `--memory-swap` es memory + swap. Si `--memory=256m` y `--memory-swap=512m`, el container puede usar 256 MB RAM + 256 MB swap. Si pones `--memory-swap=-1`, swap ilimitado. Si lo pones igual a `--memory`, swap deshabilitado.

### Block I/O limits

Limitar el I/O de disco es especialmente útil para databases y workloads I/O-intensive:

```bash
# Limitar lectura/escritura a /dev/sda
docker container run --rm -d \
  --device-read-bps /dev/sda:1mb \
  --device-write-bps /dev/sda:1mb \
  your-image
```

Valores en `kb`, `mb` o `gb`. Para reads/writes per second en vez de bytes per second, usa `--device-read-iops` y `--device-write-iops`.

> [!tip] Constraints se aplican al create
> Los resource limits se aplican al crear el container. Para cambiarlos, usa `docker container update` o deploya un nuevo container con los ajustes.

## Próximos pasos

- [[07-explorando-docker]]: comandos para explorar Docker (versión, info, imágenes, contenedores, logs, stats), entrando a containers corriendo con `docker container exec` y `nsenter`, retornando resultados, y explorando el shell de un container.
