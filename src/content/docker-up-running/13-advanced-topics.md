---
title: "Advanced topics"
description: "Cómo funcionan los containers por dentro: cgroups (resource limits), namespaces (aislamiento), tipos de namespaces (mount, UTS, IPC, PID, network, user, cgroup, time), security (UID 0, rootless mode, privileged containers, capabilities)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, containers, cgroups, namespaces, security, rootless, capabilities, kernel]
---

# Advanced topics

> [!abstract] Resumen
> Esta nota entra en cómo funcionan los containers por dentro: **cgroups** (resource limits via el kernel), **namespaces** (aislamiento de recursos globales: mount, UTS, IPC, PID, network, user, cgroup, time), y **security** (UID 0, rootless mode, privileged containers, capabilities). La próxima nota cubre networking, storage y swapping de runtimes (gVisor). Es la parte más técnica del libro; útil si haces work en runtime, debugging avanzado, o quieres entender por qué los containers son (y no son) seguros.

## Containers en detalle

Los Linux containers se implementan con **varios mecanismos del kernel trabajando juntos**: control groups (cgroups), namespaces, Secure Computing Mode (seccomp), SELinux y AppArmor. Cada uno cumple un rol:

- **cgroups**: resource limits (memoria, CPU, I/O).
- **Namespaces**: procesos ven recursos con nombres únicos, aislados unos de otros.
- **seccomp**: limita qué system calls puede hacer un proceso.
- **SELinux/AppArmor**: aislamiento de seguridad adicional.

Una analogía: si un server normal es un almacén abierto donde los procesos se estorban unos a otros, **Docker convierte el almacén en un edificio de oficinas**. Los namespaces son las paredes, los cgroups son los servicios (CPU, memoria, I/O), seccomp/SELinux/AppArmor son la seguridad del edificio.

> [!tip] Defaults son buenos
> Docker tiene defaults sensatos. **No cambies configs sin entender qué hacen**. Cambiar cgroups directamente rompe la reproducibilidad del deployment.

## cgroups (control groups)

cgroups fueron inventados **antes de Docker** (Linux 2.6.24, 2007) específicamente para resolver el problema de **resource partitioning sin virtualización**. Permiten poner límites en memoria, swap, CPU, I/O de storage, y network.

Hay **dos versiones** de cgroups (v1 y v2). **Asegúrate de saber cuál usas en producción** para aprovechar todas sus capacidades.

### Cómo se ven en Docker

Cada container recibe un cgroup único. Todos los procesos del container están en el mismo grupo, así que **puedes controlar recursos para el container como un todo** sin preocuparte por qué procesos hay dentro.

```bash
# Ver CPU shares de un container
docker container inspect <id> | grep CpuShares

# Cambiar en runtime
docker container update --cpu-shares=512 <container_id>
```

`docker container stats` usa cgroups internamente para darte CPU%, memoria, I/O por container. **No son solo límites, también son métricas**.

### Configurar cgroups manualmente

Si tienes root en el host, puedes tocar `/sys/fs/cgroup` directamente para configurar cualquier aspecto:

```bash
# Encuentra el ID del container
docker container run -d spkane/train-os stress --cpu 2 --timeout 360s
LONG_ID=<long_container_id>

# Lista los cgroup controllers disponibles
ls /sys/fs/cgroup/docker/$LONG_ID
# cpu.max, cpu.weight, memory.max, memory.current, io.max, etc.

# Mira el CPU weight actual (default 100)
cat /sys/fs/cgroup/docker/$LONG_ID/cpu.weight
# 100

# Cámbialo a la mitad
echo 50 > /sys/fs/cgroup/docker/$LONG_ID/cpu.weight
cat /sys/fs/cgroup/docker/$LONG_ID/cpu.weight
# 50
```

> [!warning] Los cambios son efímeros
> Cuando el container se para, el directorio desaparece. **Cuando arranca de nuevo, vuelve a los defaults**. Para cambios persistentes, usa `docker container update` o config de la plataforma.

> [!tip] cgroup parent
> `--cgroup-parent` permite crear un container dentro de un cgroup custom. Útil para schedulers (Kubernetes, p.ej.) que agrupan varios containers en el mismo cgroup.

## Namespaces

Los namespaces hacen que cada container vea su propia versión de recursos globales (filesystem, network, hostname, PIDs, UIDs). Son las "paredes" de la oficina.

### Tipos de namespaces

| Tipo | Qué aísla |
|---|---|
| **Mount** | Filesystem. El container ve un `/` propio. |
| **UTS** (Unix Time Sharing) | Hostname y domain name. Por eso el container tiene un hostname distinto al host. |
| **IPC** | System V IPC, POSIX message queues, shared memory. |
| **PID** | Process IDs. Dentro del container, el primer proceso es PID 1. |
| **Network** | Network devices, IPs, ports. Tu container tiene su propia red. |
| **User** | UIDs y GIDs. UID 0 dentro del container **no es lo mismo** que UID 0 en el host. |
| **Cgroup** | Oculta la identidad del cgroup de un proceso (kernel 4.6+). |
| **Time** | Permite al container tener su propio clock offset (kernel 5.6+). |

### Ejemplo: PID namespace

```bash
# Crear container
docker container run -d --rm --name pstest spkane/train-os sleep 240

# Desde dentro: el main process es PID 1
$ docker container exec -ti pstest ps -ef
UID  PID  PPID  C  STIME  TTY  TIME  CMD
root   1    0   0  15:33  ?   00:00:00  sleep 240
root  13    0   0  15:33  pts/0   00:00:00  ps -ef

# Desde el host: el mismo proceso es un PID distinto (31396)
$ docker container top pstest
UID   PID    PPID  C  STIME  TTY  TIME     CMD
root  31396  31370  0  15:33  ?    00:00:00  sleep 240

# El PPID 31370 es el containerd-shim
$ docker container run --pid=host ubuntu ps -p 31370
PID  TTY  TIME  CMD
31370  ?   00:00:00  containerd-shim
```

> [!tip] lsns y /proc/*/ns
> Para explorar namespaces, `lsns` es útil. También puedes mirar `/proc/*/ns/*` para ver a qué namespaces está conectado cada proceso.

### nsenter

`nsenter` te permite **entrar al namespace de otro proceso** desde el host:

```bash
# Entra a los namespaces de PID 1 (init del host)
sudo nsenter -t 1 -m -u -n -i sh
# -m: mount
# -u: UTS
# -n: network
# -i: IPC
# -p: PID (sin esto, no compartes PID namespace)
```

> [!warning] nsenter requiere root
> Solo root puede entrar a otros namespaces. Por eso los containers shell-less (FROM scratch) son más seguros: no puedes hacer exec en ellos.

## Security

La seguridad de los containers **no es comparable a la de una VM**, y eso es un punto importante para tener claro.

### UID 0 (root)

**Por default, los procesos corren como root dentro del container**, y ese root es **el mismo root del host** (a menos que uses rootless mode o `userns-remap`). Los namespaces dan algo de aislamiento, pero **si root escapa del namespace, tiene acceso root al host**.

```bash
# Peligroso: montar /etc del host
docker container run --rm -it -v /etc:/host_etc ubuntu /bin/bash
root@e674eb96bb74:/# cat /host_etc/shadow
# ¡Root puede leer el /etc/shadow del host!
```

> [!caution] Nunca root en producción
> Corre containers como **unprivileged user** (`-u 500` o `USER 500` en el Dockerfile). Si un exploit escapa del namespace, **el atacante no tiene root en el host**.

```bash
# Crear un user no-root en el Dockerfile
FROM fedora:34
RUN useradd -u 500 -m myuser
USER 500:500
CMD ["whoami"]
```

### Rootless mode

`rootless mode` permite correr el **daemon de Docker y todos los containers sin root privileges**. El daemon corre en el user namespace del usuario no-root, y los containers heredan esa restricción.

```bash
# Instalar dependencias
sudo apt-get install -y dbus-user-session uidmap

# Deshabilitar el daemon system-wide
sudo systemctl disable --now docker.service docker.socket
sudo shutdown -r now

# Después del reboot, login como unprivileged user
# Instalar rootless
dockerd-rootless-setuptool.sh install
# ...
# Setear las env vars
export PATH=/usr/bin:$PATH
export DOCKER_HOST=unix:///run/user/1000/docker.sock

# Verificar
docker container run --rm hello-world
```

> [!caution] Limitaciones de rootless mode
> Algunas operaciones privilegiadas no funcionan, como `--privileged` o `--pid=host`. **El container no puede tener más privilegios que el user que corre el daemon**.

### Privileged containers

`--privileged=true` quita muchas restricciones. El container tiene **casi todos los capabilities** del kernel:

```bash
# Sin --privileged: no puedes cambiar MAC address
$ docker container run --rm -ti spkane/train-os /bin/bash
# [root@...]# ip link set eth0 address 02:0a:03:0b:04:0c
# RTNETLINK answers: Operation not permitted

# Con --privileged: sí puedes
$ docker container run -ti --rm --privileged=true spkane/train-os /bin/bash
# [root@...]# ip link set eth0 address 02:0a:03:0b:04:0c
# (success)
```

> [!danger] --privileged rompe el modelo
> Containers privileged pueden mount-ar filesystems del host, modificar network, hacer cosas que un container normal no puede. **Equivale a darle al container casi todos los capabilities del kernel**. En producción, evita `--privileged`; usa capabilities específicas.

### Capabilities

En lugar de `--privileged`, **añade solo las capabilities que necesitas**:

```bash
# Añade NET_ADMIN (necesario para cambiar MAC)
docker container run --rm --cap-add=NET_ADMIN spkane/train-os /bin/bash

# Quita todas las capabilities y añade solo NET_ADMIN
docker container run --rm --cap-drop=ALL --cap-add=NET_ADMIN spkane/train-os /bin/bash
```

Capabilities comunes que puedes necesitar:

- `NET_ADMIN`: configurar network (interfaces, routing, bridges).
- `SYS_PTRACE`: debuggear procesos del container con `strace`/`gdb`.
- `SYS_ADMIN`: montaje de filesystems, swapon, etc. (riesgosa).
- `NET_RAW`: usar raw sockets.
- `CHOWN`: cambiar ownership de files.
- `SETUID`/`SETGID`: cambiar UID/GID.

> [!tip] Default capabilities son muchas
> Docker da un set default de capabilities que es bastante permisivo. Para máxima seguridad, **`--cap-drop=ALL` y luego añade solo lo necesario**.

## Próximos pasos

- [[14-advanced-security-networking-storage]]: security avanzado (seccomp, AppArmor, SELinux), networking avanzado (host networking, custom networks), storage (volumes, drivers), `nsenter` en detalle, swapping de runtimes (gVisor, runc alternatives).
