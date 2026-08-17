---
title: "Debug de contenedores"
description: "Estrategias de debugging: docker container top, process inspection (strace, lsof), network inspection, controlling processes con tini, debugging interactivo, shell-less containers con nsenter"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, debugging, strace, lsof, tini, nsenter, networks, signals]
---

# Debug de contenedores

> [!abstract] Resumen
> Esta nota cubre el debugging de containers: cómo ver procesos (dentro y fuera del container), process inspection con strace y lsof, controlling processes con tini/init, network inspection, debugging interactivo con `docker container exec`, y estrategias para containers "shell-less" (como scratch). Es la navaja suiza para cuando algo va mal en producción o en desarrollo.

## La premisa: los containers son procesos

Los containers son **procesos del Linux host**, no máquinas virtuales. Comparten kernel con el host y con otros containers. Eso significa que **toda la tooling estándar de Unix funciona** para debuggearlos, con algunos matices sobre namespaces y views.

> [!note] Tu app NO está aislada
> A diferencia de VMs donde cada instancia es completamente independiente, tus containers comparten kernel, filesystem backing, network interfaces. **Toda la info que necesitas está disponible desde el host** sin entrar al container.

## Process output

### `docker container top`

Forma más fácil de ver qué corre dentro de un container:

```bash
$ docker container run --rm -d --name nginx-debug nginx:latest
$ docker container top nginx-debug
UID   PID  PPID C STIME TTY TIME  CMD
root  2027 2002 0 12:35 ?   00:00 nginx: master process nginx -g daemon off;
uuidd 2085 2027 0 12:35 ?   00:00 nginx: worker process
uuidd 2086 2027 0 12:35 ?   00:00 nginx: worker process
…
```

> [!warning] UID/GID en el host pueden ser diferentes
> El UID/GID del container se ve desde la perspectiva del container. **En el host, ese mismo UID puede corresponder a otro user** (porque los namespaces aíslan users). Por ejemplo, UID 7 puede ser `lp` en el host Ubuntu y `halt` en un container Fedora.
>
> **Solución**: crea un user dedicado (e.g., `container` con UID 5000) en host y container, y corre containers como ese user con `-u 5000`. Así el `ps` del host muestra nombres consistentes.

### `ps` desde el host

Como los containers son procesos del host, **`ps` desde el host ve todo**:

```bash
$ ps axlfww
… /usr/bin/containerd
… /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
… \_ /usr/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 8080 \
       -container-ip 172.17.0.2 -container-port 8080
… \_ /usr/bin/docker-proxy -proto tcp -host-ip :: -host-port 8080 \
       -container-ip 172.17.0.2 -container-port 8080
…
… /usr/bin/containerd-shim-runc-v2 -namespace moby -id 97…3d …
… \_ sleep 120
… /usr/bin/containerd-shim-runc-v2 -namespace moby -id 69…7c …
```

Cada `containerd-shim-runc-v2` representa un container. Cada `docker-proxy` mapea puertos del host al container. **El tree view te dice qué proceso vive en qué container**.

> [!tip] Encuentra el PID de un container
> ```bash
> $ ps aux | grep containerd-shim-runc-v2
> root    3072  … /usr/bin/containerd-shim-runc-v2 -namespace moby -id 69…7c …
>
> # pstree te muestra todos los procesos hijos
> $ pstree -p 3072
> containerd-shim(3072)─┬─cadvisor(3092)─┬─{cadvisor}(3123)
>                       │                ├─{cadvisor}(3124)
>                       │                …
> ```

## Process inspection

Si tienes shell en el host, **toda la tooling Unix estándar funciona**:

```bash
# strace sobre un proceso del container
$ sudo strace -p 23032
# epoll_pwait(10, …

# lsof muestra archivos y sockets abiertos
$ sudo lsof -p 22983
# COMMAND   PID USER … NAME
# nginx   22983 root … /
# nginx   22983 root … /usr/sbin/nginx
# …

# gdb (GNU debugger)
sudo gdb -p 22983
```

> [!warning] Paths son del container
> Los paths en `lsof`, `strace` y `ps` son relativos a la **vista del container**, no del host. Si intentas abrir `/var/lib/docker/...` desde el host con el path que aparece en el container, no lo encontrarás. **Usa `docker container exec` para ver el filesystem del container**.

### Container de debug con acceso a otro container

Para casos avanzados, puedes correr un container que ve los procesos de otro:

```bash
$ docker container run -ti --rm --cap-add=SYS_PTRACE \
    --pid=container:nginx-debug \
    spkane/train-os:latest bash

# Dentro: ps aux ve los procesos de nginx-debug
[root@e4b5d2f3a3a7 /]# ps aux
USER  PID  %CPU %MEM  …  COMMAND
root  1    0.0  0.2  …  nginx: master process
101  30   0.0  0.1  …  nginx: worker process
101  31   0.0  0.1  …  nginx: worker process
root  136  0.1  0.1  …  bash
root  152  0.2  0.2  …  ps aux
```

`--pid=container:nginx-debug` comparte el PID namespace. `--cap-add=SYS_PTRACE` permite `strace` y `gdb` sobre los procesos del otro container.

## Controlling processes

### PID 1 es especial

En Unix, **PID 1** (init) es responsable de reapar hijos (zombie processes). En un container sin init system, **tu main process es PID 1**. Si tu proceso spawn-ea hijos y no los reapa, **se acumulan zombies**.

```bash
# Sin --init: tu CMD es PID 1
$ docker container run --rm -it alpine:3.16 sh
/ # ps -ef
PID   USER     TIME  COMMAND
    1 root      0:00  sh   ← tu CMD es PID 1
    5 root      0:00  ps -ef

# Con --init: tini es PID 1
$ docker container run --rm -it --init alpine:3.16 sh
/ # ps -ef
PID   USER     TIME  COMMAND
    1 root      0:00  /sbin/docker-init -- sh   ← tini maneja PID 1
    5 root      0:00  sh
    6 root      0:00  ps -ef
```

`tini` es un init minimalista que reapa hijos. **Úsalo en producción si tienes procesos que fork-ean**. La alternativa es un init system completo (`s6`, `runit`, `supervisord`), pero eso añade peso.

> [!tip] Init solo si lo necesitas
> En general, **un solo proceso por container** y no necesitas init. Si tu app spawn-ea background workers o maneja signals mal, `--init` te salva.

### Signals

`docker container kill -s <SIGNAL>` envía Unix signals al PID 1 del container. Ejemplos:

```bash
# SIGTERM (default) - pide al proceso que termine limpiamente
docker container kill nginx-debug

# SIGUSR1 - nginx reopen logs (lo lee de su config)
docker container kill -s SIGUSR1 nginx-debug

# SIGHUP - reload config
docker container kill -s SIGHUP nginx-debug
```

> [!warning] Kill no reemplaza restart
> Matar el PID 1 **termina el container** (que es lo que quieres para reemplazo). Matar procesos internos **no termina el container** y deja el estado inconsistente. Si necesitas matar algo dentro, mejor reemplaza el container entero.

> [!note] La abstracción importa
> Los orquestadores asumen que los containers son **atómicos**: presentes y healthy = todo funciona. Si empiezas a matar procesos internos, rompes esa abstracción y confundes al scheduler.

## Network inspection

```bash
$ docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
f9685b50d57c   bridge    bridge    local
8acae1680cbd   host      host      local
fb70d67499d3   none      null      local

$ docker network inspect bridge
[
  {
    "Name": "bridge",
    "Containers": {
      "69e9…c87c": {
        "Name": "cadvisor",
        "IPv4Address": "172.17.0.2/16",
        ...
      }
    }
  }
]
```

> [!tip] Naming consistente
> Dale nombres legibles a tus containers. Cuando haces `docker network inspect`, solo ves el **name** y el **ID**, no la imagen. Si los schedulers dan nombres crípticos, debugging es un dolor.

### Desde el host

`netstat` desde el host muestra los puertos bindeados por `docker-proxy`:

```bash
$ sudo netstat -anp
# tcp  0  0  0.0.0.0:8080  0.0.0.0:*  LISTEN  1516/docker-proxy
# tcp6 0  0  :::8080        :::*      LISTEN  1522/docker-proxy
```

Cada `docker-proxy` por container-port mapeado (uno IPv4, otro IPv6).

> [!tip] Deja los containers en la bridge default
> Hasta que tengas una buena razón, mantén los containers en la **bridge network default**. Las redes custom tienen su lugar (multi-tenant, isolation por servicio), pero añaden complejidad. Si usás Docker Compose o un scheduler, **ellos gestionan las redes** por ti.

## Debugging shell-less containers

Las imágenes minimalistas (como `FROM scratch`) **no tienen shell**. No puedes hacer `docker container exec /bin/bash` ni `nsenter`. Para esas imágenes:

### Opción 1: image de debug temporal

```bash
# Build un image de debug basado en el binario de tu app
FROM scratch
COPY --from=builder /helloworld /helloworld
CMD ["/helloworld"]
```

```bash
# Si necesitas herramientas, crea un image paralelo con busybox
docker container run -ti --rm \
  --pid=container:<container_id> \
  --network=container:<container_id> \
  busybox sh
```

Esto comparte el PID namespace y network namespace con el container shell-less. Dentro, puedes correr `ps`, `netstat`, `wget`, `nc`, etc.

### Opción 2: nsenter al PID 1

```bash
# Encuentra el PID del container en el host
PID=$(docker container inspect --format '{{.State.Pid}}' <container_id>)

# Entra al container
sudo nsenter -t $PID -m -u -n -i -p
# -m: mount namespace
# -u: UTS namespace (hostname)
# -n: network namespace
# -i: IPC namespace
# -p: PID namespace
```

Dentro de `nsenter` tienes un shell "del container" sin necesidad de que el container tenga uno.

> [!note] Privilegios necesarios
> `nsenter` y `--pid=container:...` requieren **privilegios** (root o capabilities específicas). Por eso las imágenes shell-less son más seguras: no se puede entrar con exec.

## Debugging interactivo (lo básico)

Para la mayoría de casos en desarrollo, `docker container exec` es suficiente:

```bash
# Lanza un container con tu app
docker container run -d --name mi-app my-image

# Entra a un shell
docker container exec -it mi-app /bin/bash
# ...investiga...

# O corre un comando puntual
docker container exec mi-app ls /app
docker container exec mi-app cat /var/log/app.log
docker container exec mi-app ps aux
```

> [!warning] No uses exec en producción como workflow
> Si dependes de `docker container exec` para que el container funcione, **tu imagen no es self-contained**. Mejor rebuild-ala imagen con todo lo necesario. `exec` es para debugging, no para operación normal.

## Cuándo usar qué

| Situación | Herramienta |
|---|---|
| Ver procesos de un container | `docker container top <id>` |
| Ver todos los procesos del host | `ps axlfww` |
| Process tree de un container | `pstree -p <shim_pid>` |
| Trace de syscalls | `strace -p <pid>` |
| Files/sockets abiertos | `lsof -p <pid>` |
| Filesystem del container | `docker container exec` |
| Debugger (gdb) | `sudo gdb -p <pid>` |
| Container shell-less debug | `nsenter` o busybox con `--pid=container:` |
| Process que fork-ea sin reapar | `--init` |
| Señal al PID 1 | `docker container kill -s <signal>` |
| Ver red | `docker network inspect` |

## Próximos pasos

- [[09-docker-compose]]: archivos `docker-compose.yml`, servicios múltiples, networks y volumes, profiles, override, y patrones de uso.
