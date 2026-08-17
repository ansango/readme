---
title: "Explorando Docker"
description: "Comandos para explorar el entorno: docker version, docker system info, descargar imágenes, docker container inspect, exec, retornar resultados, logging, stats, health checks, system events, cAdvisor y Prometheus"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, exploration, exec, logging, health-checks, monitoring, prometheus, cadvisor]
---

# Explorando Docker

> [!abstract] Resumen
> Esta nota cubre los comandos para **explorar y operar** el entorno Docker: versión, info del server, descargar imágenes, inspeccionar containers, entrar a un container corriendo con `exec`, retornar resultados de comandos, logging, estadísticas, health checks, system events, y monitoring con cAdvisor y Prometheus. Es la navaja suiza del día a día con Docker.

## Versión e info del server

### `docker version`

```bash
$ docker version
Client:
 Cloud integration: v1.0.24
 Version:           20.10.17
 API version:       1.41
 Go version:        go1.17.11
 OS/Arch:           darwin/amd64
Server: Docker Desktop 4.10.1 (82475)
 Engine:
  Version:          20.10.17
  API version:      1.41 (minimum version 1.12)
 containerd:
  Version:          1.6.6
 runc:
  Version:          1.1.2
```

> [!tip] Útil para troubleshooting
> Cuando hay errores de "API version mismatch" entre client y server, este comando te dice exactamente qué versión tiene cada pieza. **Client y server pueden tener versiones diferentes**, lo cual es útil en desarrollo.

### `docker system info`

Información completa del server: storage driver, kernel, OS, plugins, número de containers, runtime por defecto.

```bash
$ docker system info
Server:
 Containers: 11
 Images: 6
 Server Version: 20.10.17
 Storage Driver: overlay2
 Runtimes: io.containerd.runc.v2 runc
 Default Runtime: runc
 Kernel Version: 5.10.104-linuxkit
 Operating System: Docker Desktop
 Architecture: x86_64
```

> [!tip] Storage root
> Por defecto, `/var/lib/docker`. Si necesitas cambiarlo, edita la config del daemon (`daemon.json`) con `--data-root` al arrancar manualmente.

## Descargar imágenes

```bash
docker image pull ubuntu:latest
# latest: Pulling from library/ubuntu
# 405f018f9d1d: Pull complete
# Digest: sha256:b6b83d3c331794420340093eb706a6f152d9c1fa51b262d9bf34594887c2c7ac
# Status: Downloaded newer image for ubuntu:latest
```

Solo descarga los **layers que cambiaron** desde la última vez. **No se actualiza automáticamente**; tienes que hacer pull explícitamente. `latest` es flotante — en producción usa tags con versión específica o el SHA-256.

```bash
# Pull por SHA (la forma más precisa de garantizar la versión exacta)
docker image pull ubuntu@sha256:b6b83d3c331794420340093eb706a6f152d9c1fa51b262d9bf34594887c2c7ac
```

> [!note] SHAs no se pueden truncar
> A diferencia de los container IDs (que se pueden abreviar), los SHA-256 de imágenes **deben ir completos**.

## Inspeccionar un container

`docker container inspect` da output JSON verboso con toda la metadata:

```bash
$ docker container inspect <container_id>
[{
    "Id": "3c4f916619a5dfc420396d823b42e8bd30a2f94ab5b0f42f052357a68a67309b",
    "Created": "2022-07-17T17:26:53.611762541Z",
    "Config": {
        "Hostname": "3c4f916619a5",
        "Env": ["PATH=/usr/local/sbin:..."],
        "Cmd": ["/bin/bash"],
        ...
    }
}]
```

El campo `Env` es especialmente útil en debugging: te dice exactamente qué env vars recibió el container en creación.

> [!tip] IDs cortos y largos
> `3c4f916619a5` es el ID corto (12 caracteres del hash). Docker lo acepta igual que el ID completo de 64 caracteres. Acostúmbrate a usar el corto para los comandos diarios.

## Entrar a un container corriendo

`docker container exec` corre un proceso nuevo dentro de un container **ya corriendo**:

```bash
# Inicia un container en background
docker container run -d --rm ubuntu:22.04 sleep 600

# Entra con shell
docker container exec -it <container_id> /bin/bash
# root@<container_id>:/#
```

`docker container exec` es la forma Docker-native de hacer "SSH al container". En producción es un antipatrón entrar a un container en producción (similar a SSH a servers), pero para **debugging activo** es invaluable.

> [!warning] exec en background
> Puedes correr `docker container exec -d`, pero **pierdes la repeatability** del image deployment. Si dependes de procesos lanzados con `exec`, otros devs necesitan saber qué pasar. Mejor rebuild-ear la imagen para lanzar ambos procesos de forma reproducible.
>
> Para señalizar a un proceso (rotar logs, recargar config), usa `docker container kill -s <SIGNAL>` con el nombre del Unix signal.

## Retornar resultados

Los containers son **ligeros y rápidos** de crear y destruir. Eso los hace ideales para correr comandos one-off y obtener resultados:

```bash
# Ejecuta /bin/false y captura el exit code
docker container run --rm ubuntu:22.04 /bin/false
echo $?
# 1

# Ejecuta /bin/true
docker container run --rm ubuntu:22.04 /bin/true
echo $?
# 0

# Ejecuta cat /etc/passwd en el container
docker container run --rm ubuntu:22.04 /bin/cat /etc/passwd
# root:x:0:0:root:/root:/bin/bash
# ...

# Pipe al local wc (NO al wc del container)
docker container run --rm ubuntu:22.04 /bin/cat /etc/passwd | wc -l
# 19
```

> [!warning] Los pipes son locales
> El pipe `| wc -l` corre en tu local, no en el container. Si quieres que el pipe se ejecute dentro del container, usa `bash -c "..."`:
> ```bash
> docker container run --rm ubuntu:22.04 /bin/bash -c "/bin/cat /etc/passwd | wc -l"
> ```

## Logging

Docker captura **todo lo que el container escribe a stdout y stderr** y lo streamea a un backend de logging configurable.

### `docker container logs`

```bash
$ docker container run --rm -d --name nginx-test nginx:latest
$ docker container logs nginx-test
# …output del container…

# Tail en vivo
$ docker container logs -f nginx-test

# Solo las últimas N líneas o desde un timestamp
docker container logs --tail 100 nginx-test
docker container logs --since 5m nginx-test
```

Los logs se almacenan por defecto en `/var/lib/docker/containers/<id>/<id>-json.log` en formato JSON:

```json
{"log":"2022/07/31 16:36:05 [notice] 1#1: nginx/1.23.1\n",
 "stream":"stderr","time":"2022-07-31T16:36:05.189234362Z"}
```

> [!warning] Habilita log rotation
> El default **no tiene log rotation**. En producción, configura `--log-opt max-size` y `--log-opt max-file` en `daemon.json`:
> ```json
> {
>   "log-driver": "json-file",
>   "log-opts": {
>     "max-size": "10m",
>     "max-file": "3"
>   }
> }
> ```
> Sin rotación, el archivo de log crece sin límite.

### Backends alternativos

Para setups más serios, hay drivers de logging que envían a sistemas centralizados:

| Driver | Destino |
|---|---|
| `syslog` | Syslog remoto (UDP recomendado, TCP puede bloquear) |
| `fluentd` | Fluentd / Fluent Bit |
| `awslogs` | CloudWatch Logs (AWS) |
| `gcplogs` | Cloud Logging (GCP) |
| `splunk` | Splunk |
| `journald` | systemd journal |

> [!warning] Solo un driver a la vez
> Docker soporta **un driver de logging simultáneamente**. Si cambias de `json-file` a `syslog`, **pierdes `docker container logs`**. Algunos plug-ins terceros mantienen copia local para soportar ambos; verifica antes de cambiar.

> [!tip] UDP > TCP/TLS para syslog remoto
> Con TCP, si el server remoto está caído, Docker **bloquea el arranque del container**. UDP es non-blocking; pierdes garantía de entrega pero ganas reliability.

## Monitoring

### Container statistics

```bash
$ docker container run --rm -d --name stress \
    spkane/train-os:latest \
    stress -v --cpu 2 --io 1 --vm 2 --vm-bytes 128M --timeout 60s

$ docker container stats stress
CONTAINER ID NAME   CPU %   MEM USAGE/LIMIT   MEM % NET I/O   BLOCK I/O PIDS
1a9f52f0855f stress 476.50% 36.09MiB/7.773GiB 0.45% 1.05kB/0B 0B/0B     6
```

CPU% es relativo a **un core**. 476% significa 4.76 cores. `--no-stream` da un snapshot único.

### API stats endpoint (vía curl)

```bash
$ curl -s -XGET --unix-socket /var/run/docker.sock \
    http://docker/containers/stress/stats | head -n 1 | jq
{
  "pids_stats": { "current": 6, "limit": ... },
  "cpu_stats": { "cpu_usage": { "total_usage": 101883204000, ... } },
  "memory_stats": { "usage": 183717888, "limit": 8346021888 },
  "networks": { "eth0": { "rx_bytes": 1046, ... } }
  ...
}
```

### Container health checks

```dockerfile
HEALTHCHECK CMD ["docker-healthcheck"]
```

`docker container ls` muestra el estado de salud:

```bash
$ docker container ls
# STATUS: Up 1 second (health: starting) 27017/tcp
# STATUS: Up 32 seconds (healthy) 27017/tcp
# STATUS: Up 9 minutes (unhealthy) 27017/tcp
```

Flags útiles:

- `--health-interval`: cada cuánto checkear.
- `--health-retries`: cuántos fallos antes de marcar unhealthy.
- `--health-start-period`: tiempo de gracia al arrancar.
- `--no-healthcheck`: deshabilitar.

> [!tip] Health checks en todas tus imágenes
> Es una de las **mejores inversiones de tiempo** que puedes hacer. Estandariza cómo se chequea la salud y úsalo en todos los containers.

### docker system events

Stream de eventos del lifecycle de containers:

```bash
$ docker system events
# En otro terminal:
$ docker container run --rm --name sleeper debian:latest sleep 5
# En el primero verás:
# container create d6... (image=debian:latest, name=sleeper)
# container start  d6...
# container die    d6... (exitCode=0)
# container destroy d6...
```

Útil para monitoring y para detectar eventos de seguridad (`container exec_create` puede señalar que alguien entró a un container).

Eventos importantes a monitorizar:

- `container oom`: container killed por OOM.
- `container exec_create` / `exec_start` / `exec_die`: alguien entró al container.

### cAdvisor (Google)

Container Advisor de Google: corre como container, expone métricas detalladas de containers y del host en una web UI y REST API.

```bash
$ docker container run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  --detach=true \
  --name=cadvisor \
  --privileged \
  --rm \
  --device=/dev/kmsg \
  gcr.io/cadvisor/cadvisor:latest
```

Abre `http://<docker-host>:8080/` para ver gráficos de CPU, memoria, network, I/O por container.

```bash
# API REST
curl http://<docker-host>:8080/api/v2.1/machine/
```

### Prometheus

Docker tiene un **endpoint de metrics para Prometheus** (experimental, hay que activarlo en `daemon.json`):

```json
{
  "experimental": true,
  "metrics-addr": "0.0.0.0:9323"
}
```

```bash
sudo systemctl restart docker
curl -s http://localhost:9323/metrics | head
# HELP builder_builds_failed_total Number of failed image builds
# TYPE builder_builds_failed_total counter
# builder_builds_failed_total{reason="build_canceled"} 0
# ...
```

Configurar Prometheus para scrapear este endpoint (`/etc/prometheus/prometheus.yaml`):

```yaml
global:
  scrape_interval: 5s
  external_labels:
    monitor: 'stats-monitor'
scrape_configs:
  - job_name: 'DockerStats'
    static_configs:
    - targets: ['172.17.0.1:9323']
```

Levantar Prometheus como container:

```bash
docker container run --rm -d -p 9090:9090 \
  -v /tmp/prometheus/prometheus.yaml:/etc/prometheus.yaml \
  prom/prometheus --config.file=/etc/prometheus.yaml
```

> [!tip] dockprom para dashboards
> Si quieres dashboards bonitos, échale un ojo a **dockprom**, que combina Prometheus + Grafana con queries preconfiguradas para Docker metrics.

> [!warning] Métricas en red
> Cualquier servicio que expongas en red es un riesgo de seguridad. **`metrics-addr=0.0.0.0` lo expone a todo**. En producción, considera bind a una red interna o usar autenticación.

## Próximos pasos

- [[08-debug-de-contenedores]]: estrategias de debugging, logs, debugging interactivo con `docker container exec`, `nsenter` y `docker-debug`, debugging en producción, debugging shell-less containers.
