---
title: "Advanced security, networking y storage"
description: "Secure Computing Mode (seccomp) y profiles custom, SELinux y AppArmor, networking avanzado (host, macvlan, overlay), storage backends (overlay2, btrfs, devicemapper), nsenter, swapping de runtimes (gVisor)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, seccomp, selinux, apparmor, networking, storage, nsenter, gvisor]
---

# Advanced security, networking y storage

> [!abstract] Resumen
> Esta nota cubre tres temas avanzados que cierran la parte de "cómo funciona Docker por dentro": **Secure Computing Mode (seccomp)** y profiles custom, **SELinux y AppArmor** como capas adicionales de seguridad, **networking avanzado** (host networking, macvlan, overlay), **storage backends** (overlay2, btrfs, devicemapper, vfs, zfs), **`nsenter`** para entrar a containers avanzados, y **swapping de runtimes** como gVisor para más seguridad. Es la parte más profunda del libro.

## Secure Computing Mode (seccomp)

**seccomp** (Secure Computing Mode) es una feature del kernel Linux desde 2.6.12 (2005) que limita **qué system calls puede hacer un proceso**. **Todos los containers de Docker usan seccomp por default** con un profile que bloquea system calls peligrosas.

### Ver el profile por default

```bash
# Bajar el profile default
wget https://raw.githubusercontent.com/moby/moby/master/profiles/seccomp/default.json
```

El profile es un JSON que lista system calls permitidas y denied. El default es bastante permisivo pero bloquea las llamadas más peligrosas.

### Custom profile

Para casos donde necesitas ser muy específico, puedes crear tu propio profile:

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "defaultErrnoRet": 1,
  "syscalls": [
    {"names": ["umount2"], "action": "SCMP_ACT_ALLOW",
     "includes": {"caps": ["CAP_SYS_ADMIN"]}}
  ]
}
```

```bash
# Usa el custom profile
docker container run -ti --rm \
    --security-opt seccomp=umount2.json \
    --cap-add=SYS_ADMIN spkane/train-os:latest /bin/bash
```

> [!caution] `--security-opt seccomp=unconfined`
> Deshabilita seccomp completamente. **Solo útil para debugging** de qué system calls necesitas. Nunca en producción.

> [!tip] seccomp > capabilities
> seccomp es **más granular** que capabilities. CAP_SYS_ADMIN da 37 system calls. seccomp te permite dar **solo una específica**. Usa seccomp cuando necesites control fino.

## SELinux y AppArmor

**SELinux** (originado en la NSA, adoptado por Red Hat) y **AppArmor** (más user-friendly, sin metadata de filesystem) son **capas de mandatory access control** que extienden la seguridad de los containers más allá de Unix tradicional. Permiten políticas que dicen: "incluso si root, este proceso no puede acceder a este recurso".

Docker trae **profiles default razonables** en plataformas que los soportan. Puedes customizarlos o deshabilitarlos con `--security-opt`.

> [!tip] AppArmor > SELinux en algunos casos
> SELinux solo funciona con filesystems que soporten metadata (xattrs). AppArmor **funciona con cualquier storage backend de Docker**. Si tu storage backend no soporta SELinux, AppArmor es tu opción.

## Networking avanzado

### Cómo funciona el default

Cuando un request llega al Docker host:

1. Llega a la interfaz eth0 del host.
2. Docker tiene un `docker-proxy` escuchando en el port publicado.
3. El proxy reenvía al container correcto en la red privada.
4. El tráfico vuelve por el mismo camino.

El tráfico **outbound** sigue un camino distinto: container → docker0 (bridge) → NAT del kernel → eth0 → internet.

### Host networking (`--net=host`)

`--net=host` hace que el container **comparta el network namespace del host**. Sin virtualización de red. Útil para:

- **High-throughput apps** que no pueden pagar el overhead del proxy.
- Apps que necesitan escuchar en muchos ports.

```bash
docker container run -rm -it --net=host spkane/train-os bash
# Dentro, ves las interfaces del host directamente
```

> [!warning] Implicaciones de host networking
> - El container **puede bind-ar ports que el host ya usa** (conflictos).
> - Pierdes el aislamiento de network.
> - No es un buen default; solo para casos específicos.

### Userland proxy

`docker-proxy` se interpone en el tráfico de red y puede ser un cuello de botella. `--userland-proxy=false` al `dockerd` lo deshabilita y usa hairpin NAT directamente (más rápido, menos seguro).

### Otros drivers de red

| Driver | Uso |
|---|---|
| **bridge** | Default. Red privada virtual en un solo host. |
| **host** | Comparte network namespace del host. |
| **none** | Sin red. El container está aislado. |
| **overlay** | Usado por Swarm para multi-host. |
| **macvlan** | Asigna MAC address real a cada container. Útil para migrar de legacy. |

```bash
# Crear red macvlan
docker network create -d macvlan \
    --subnet=172.16.16.0/24 \
    --gateway=172.16.16.1 \
    -o parent=eth0 ourvlan
```

> [!warning] macvlan no es para principiantes
> macvlan requiere que tu switch soporte múltiples MACs por port. **Puede saturar las MAC tables** y dificultar el debugging. Solo si entiendes bien tu network.

Para setups más complejos (multi-host, network policies, encryption), échale un ojo a:

- **Weave**: overlay network tool, sin requerir Swarm.
- **Project Calico**: network policies, especialmente con Kubernetes.
- **Cilium**: eBPF-based networking para containers.

## Storage backends

Docker usa un **storage backend** que maneja layers, copy-on-write, y la persistencia de los cambios. Diferentes backends tienen diferentes trade-offs.

| Backend | Estado | Cuándo usarlo |
|---|---|---|
| **overlay2** | Recomendado | Default en distros modernas. Rápido, estable. |
| **btrfs** | Estable | Si ya usas Btrfs. No funciona con SELinux. |
| **devicemapper** | Estable pero legacy | Solo si tu distro no soporta overlay2. **Usa direct-lvm en producción** (no loop-lvm). |
| **aufs** | Deprecated | No en mainline. Solo distros viejas. |
| **vfs** | Simple, lento | Solo para testing. Copia el filesystem entero. |
| **zfs** | Avanzado | Si ya usas ZFS. Requiere setup extra (licensing). |

> [!caution] Cambiar el storage backend borra imágenes visibles
> Si cambias el backend (`--storage-driver=devicemapper` al arrancar `dockerd`), **las imágenes existentes desaparecen** (no se borran del disco, pero no son visibles). No lo hagas en producción sin planificar.

> [!tip] Cómo ver tu backend
> ```bash
> $ docker system info | grep "Storage Driver"
> # Storage Driver: overlay2
> ```

## nsenter

`nsenter` (namespace enter) viene en `util-linux` y te permite **entrar a cualquier namespace del kernel** desde el host. Útil cuando `docker container exec` no funciona (daemon caído, container shell-less).

```bash
# Encuentra el PID del container en el host
PID=$(docker container inspect --format '{{.State.Pid}}' <container_id>)

# Entra a todos sus namespaces
sudo nsenter --target $PID --all
# O por namespace específico
sudo nsenter -t $PID -m -u -n -i sh
# -m: mount, -u: UTS, -n: network, -i: IPC, -p: PID
```

> [!caution] nsenter requiere root
> Sin root no puedes entrar a otros namespaces. Por eso los containers shell-less (FROM scratch) son más seguros.

### nsenter vía container

Si no tienes SSH al Docker host, puedes usar un container con `--pid=host` y `--privileged`:

```bash
docker container run --rm -it --privileged --pid=host debian \
    nsenter -t 1 -m -u -n -i sh
# Ahora estás en el host, no en un container
```

## Debugging shell-less containers

Containers con `FROM scratch` (sin shell) no pueden hacer `docker container exec /bin/sh`. Para debuggearlos, lanza un **container de debug** que comparte namespaces con el shell-less:

```bash
# Lanza el container shell-less
docker container run -d --rm --name app-shell-less \
    --publish 8090:8080 spkane/outyet:1.9.4-small

# Lanza un container de debug que comparte PID y network namespaces
docker container run --rm -it \
    --pid=container:app-shell-less \
    --net=container:app-shell-less \
    --cap-add sys_ptrace --cap-add sys_admin \
    spkane/train-os /bin/sh
```

Dentro del container de debug:

- Ves los procesos del shell-less (PID 1 es /outyet).
- Puedes hacer `curl localhost:8080` (mismo network namespace).
- Tienes `sys_ptrace` y `sys_admin` para `strace`/`gdb` o montar filesystems.
- Pero **no ves los archivos** del shell-less (filesystem distinto).

> [!tip] Multi-stage debug image
> Una buena práctica: tener un `Dockerfile.debug` que es la versión "fat" de tu app shell-less, con busybox, strace, gdb, y otras herramientas. Lo construyes solo para debug, no se pushea a producción.

## Swapping de runtimes

Docker usa **containerd + runc** por default. Pero puedes cambiar el **low-level runtime** (el que realmente crea los containers):

| Runtime | Notas |
|---|---|
| **runc** | Default. OCI-compliant, estable. |
| **crun** | Escrito en C, más rápido, menor footprint. |
| **Kata Containers** | Cada container corre en su propio microVM. Mayor seguridad. |
| **gVisor** (Google) | Sandbox implementado en user space. Reduce attack surface. |
| **runsc** (gVisor binary) | El runtime real de gVisor. |

```bash
# Configurar un runtime alternativo
docker container run --runtime=runc <image>
docker container run --runtime=crun <image>
docker container run --runtime=runsc <image>  # gVisor
```

### gVisor para más seguridad

gVisor (de Google) implementa un sandbox en **user space** que intercepta las system calls del container. **El kernel del host nunca toca las system calls del container directamente**. Esto reduce drásticamente la attack surface:

- El container "habla" con el sandbox de gVisor.
- El sandbox habla con el kernel.
- El kernel nunca ve syscalls directamente del container.

> [!tip] Cuándo usar gVisor
> - **Multi-tenant environments** donde containers de distintos usuarios no se fían unos de otros.
> - **Untrusted code** (CI runners, sandboxes para código de terceros).
> - Cuando el performance hit (10-20%) es aceptable por la ganancia en seguridad.

> [!warning] Performance
> gVisor añade overhead. Para apps de alta performance (gaming, video processing, ML training), **evalúa si el trade-off vale la pena**.

## Próximos pasos

- [[15-paisaje-en-expansion]]: el ecosistema de alternatives a Docker CLI (nerdctl, podman, buildah), Rancher Desktop, Podman Desktop, y herramientas all-in-one para developers.
