---
title: "Containers at scale"
description: "Orquestación a escala: Docker Swarm mode (built-in), servicios, scaling, rolling updates, rollbacks, drain de nodes, y la decisión de cuándo usar Swarm vs Kubernetes"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, swarm, orchestration, scaling, rolling-updates, rollback, kubernetes, microservices]
---

# Containers at scale

> [!abstract] Resumen
> Esta nota cubre cómo correr containers a escala. Empieza con **Docker Swarm mode** (el orquestador built-in en Docker engine), incluyendo setup del cluster, services, scaling, rolling updates, rollbacks, y drain de nodes. Termina con la decisión de **Swarm vs Kubernetes** y por qué Kubernetes ganó la batalla de los orquestadores. La siguiente nota entra en detalle en Kubernetes con Minikube.

## El problema de escalar containers

Los containers son portables por diseño, pero **un solo host tiene límites**. Cuando tu app crece, necesitas:

- Múltiples hosts trabajando juntos como un cluster.
- Scheduling: decidir qué container corre en qué host.
- Service discovery: que los containers se encuentren unos a otros.
- Load balancing: distribuir tráfico entre réplicas.
- Rolling updates: actualizar sin downtime.
- Self-healing: reemplazar containers que fallan.

**Docker engine no hace esto por sí solo**. Necesitas un **orquestador**.

## Docker Swarm mode

> [!warning] Swarm classic vs Swarm mode
> Hay dos cosas llamadas "Swarm". La original standalone, ahora llamada **Swarm classic**, está deprecated. La que importa es **Swarm mode**, que viene **built-in en el Docker client**. No necesitas instalar nada extra.

Swarm mode te da un cluster manager con interfaz única: usas el mismo `docker` que ya conoces, pero apunta a un manager en vez de un host individual. Swarm **agrega scheduling, service discovery, rolling updates y load balancing** sobre lo que Docker ya provee.

### Conceptos clave

- **Manager**: nodo que controla el cluster. Mejor tener un número impar para quorum. Solo uno es "leader" en un momento dado.
- **Worker**: nodo que corre containers.
- **Service**: definición declarativa de un container (imagen, réplicas, ports, networks). Swarm se encarga de mantener el estado deseado.
- **Task**: la unidad de scheduling. Una instancia de un service corriendo en un nodo.
- **Routing mesh**: cuando publicas un port en Swarm, **cualquier nodo** del cluster puede recibir tráfico y rutearlo al container correcto, aunque ese container no esté corriendo en ese nodo. Magic.

### Setup del cluster

```bash
# En el manager (1º nodo)
$ sudo docker swarm init --advertise-addr 172.17.4.1
# Swarm initialized: current node (hyp...) is now a manager.
# To add a worker, run:
#   docker swarm join --token SWMTKN-1-14... 172.17.4.1:2377

# Guarda el token en un password manager
$ sudo docker swarm join-token --quiet worker
# (regenera el token si lo pierdes)

# En cada worker
$ ssh 172.17.4.2 "sudo docker swarm join --token SWMTKN-1-14... 172.17.4.1:2377"
# This node joined a swarm as a worker.

$ ssh 172.17.4.3 "sudo docker swarm join --token SWMTKN-1-14... 172.17.4.1:2377"
# This node joined a swarm as a worker.
```

> [!tip] Verifica el estado
> ```bash
> $ docker -H 172.17.4.1 node ls
> ID      HOSTNAME      STATUS AVAILABILITY MANAGER STATUS ENGINE VERSION
> l9…82 * ip-172-17-4-1 Ready  Active       Leader         20.10.7
> 3d…7b   ip-172-17-4-2 Ready  Active                      20.10.7
> ip…qe   ip-172-17-4-3 Ready  Active                      20.10.7
> ```
> El asterisco marca el nodo al que estás conectado.

### Crear networks overlay

```bash
$ docker -H 172.17.4.1 network create --driver=overlay default-net
$ docker -H 172.17.4.1 network ls
NETWORK ID     NAME              DRIVER    SCOPE
xqgshg0nurzu   default-net       overlay   swarm
n8kjd6oa44fr   ingress           overlay   swarm
…
```

### Lanzar un service

```bash
$ docker -H 172.17.4.1 service create --detach=true --name quantum \
    --replicas 2 --publish published=80,target=8080 --network default-net \
    spkane/quantum-game:latest
```

Flags importantes:

- `--replicas N`: número de instancias a mantener.
- `--publish published=X,target=Y`: map port X (host) a Y (container).
- `--network`: red a la que se conecta el service.
- `--detach=true`: no esperar a que termine.

```bash
$ docker -H 172.17.4.1 service ps quantum
# ID    NAME       IMAGE       NODE          DESIRED  CURRENT
# rk…13 quantum.1 spkane/…  ip-172-17-4-1 Running  Running
# lz…t3 quantum.2 spkane/…  ip-172-17-4-2 Running  Running
```

> [!warning] Nunca uses `latest` en producción
> En este ejemplo usamos `latest` por simplicidad del libro. En producción, **usa siempre tags con versión o commit hash**. El tag `latest` es flotante y puede causar deploys no reproducibles.

### Ver detalles de un service

```bash
$ docker -H 172.17.4.1 service inspect --pretty quantum
ID:        iuoh6oxrec9fk67ybwuikutqa
Name:      quantum
Service Mode: Replicated
 Replicas:  2
Resources:
Networks: default-net
Endpoint Mode: vip
Ports:
  PublishedPort = 80
  TargetPort = 8080
  PublishMode = ingress
```

El `--update-order` por default es `stop-first` (tira el viejo, levanta el nuevo). En producción **cambia a `start-first`** (levanta el nuevo, después tira el viejo) para evitar downtime durante deploys.

### Escalar

```bash
$ docker -H 172.17.4.1 service scale --detach=false quantum=4
# quantum scaled to 4
# 1/4: running [=====================================>]
# ...
# verify: Service converged
```

> [!warning] Swarm prioriza número de réplicas sobre distribución
> Si pides más réplicas que nodos, Swarm pone **varias réplicas en el mismo nodo**. Si pierdes ese nodo, pierdes varias réplicas a la vez. Piensa en tu placement cuidadosamente.

### Rolling updates

```bash
$ docker -H 172.17.4.1 service update --update-delay 10s \
    --update-failure-action rollback --update-monitor 5s \
    --update-order start-first --update-parallelism 1 \
    --image spkane/quantum-game:latest-plus quantum
```

Flags importantes:

- `--update-delay`: espera entre updates de réplicas (zero-downtime).
- `--update-failure-action rollback`: si falla el health check, hace rollback automático.
- `--update-monitor`: cada cuánto chequea el health.
- `--update-parallelism`: cuántas réplicas actualiza a la vez (1 = una por una, sin downtime).
- `--update-order start-first`: levanta el nuevo antes de tirar el viejo.

### Rollback

```bash
$ docker -H 172.17.4.1 service rollback quantum
# quantum
# rollback: manually requested rollback
# overall progress: rolling back update: 4 out of 4 tasks
```

Docker **guarda la versión anterior** y puede hacer rollback a ella con un solo comando. **Funciona porque los health checks confirman que la nueva versión está bien antes de tirar la vieja**.

> [!note] Limitación del rollback
> Solo vuelve a la **versión inmediatamente anterior**. Si haces rollback dos veces seguidas, alterna entre las mismas dos versiones. Para control fino, usa versionado explícito con tags.

### Docker stack: Compose en Swarm

`docker stack deploy` permite deployar un `docker-compose.yml` (con ajustes) a Swarm:

```bash
$ docker -H 172.17.4.1 stack deploy --compose-file docker-compose-stack.yaml rocketchat
# Creating network rocketchat_default
# Creating service rocketchat_hubot
# Creating service rocketchat_mongo
# ...
```

```bash
$ docker -H 172.17.4.1 stack ls
# NAME         SERVICES   ORCHESTRATOR
# rocketchat   4          Swarm

$ docker -H 172.17.4.1 stack rm rocketchat
# Tearing down the stack...
```

### Drain de nodes

Para hacer mantenimiento en un nodo, **drena** sus tasks primero:

```bash
$ docker -H 172.17.4.1 node update --availability drain ip-172-17-4-3
# Swarm mueve los tasks a otros nodos

$ docker -H 172.17.4.1 node inspect --pretty ip-172-17-4-3
# Availability: Drain

# Después del mantenimiento
$ docker -H 172.17.4.1 node update --availability active ip-172-17-4-3
```

> [!warning] No balancea automáticamente
> Cuando vuelves a activar un nodo, **no balancea** las tasks existentes a través del cluster. Tienes que hacer un nuevo deploy o update para redistribuir.

## Swarm vs Kubernetes

| Aspecto | Docker Swarm | Kubernetes |
|---|---|---|
| Setup | Built-in en Docker, fácil | Requiere kubectl + cluster (local o managed) |
| Complejidad | Baja | Alta |
| Ecosistema | Smaller, más cohesivo | Enorme, vendor-neutral |
| Curva de aprendizaje | Suave | Empinada |
| Managed offerings | Docker Swarm en cloud vendors | EKS, GKE, AKS, DigitalOcean, etc. |
| Adopción mercado | Decreciendo | Masiva |
| Documentación / comunidad | Buena | Excelente |
| Caso ideal | Clusters pequeños, transición de Compose a multi-host | Producción seria, multi-cloud, escala |

> [!quote] Kelsey Hightower
> "Kubernetes is a platform for building platforms."

**La realidad del mercado**: Kubernetes ganó. La mayoría de las nuevas orquestaciones de producción se hacen con Kubernetes. Swarm sigue siendo útil para clusters pequeños o para gente que ya tiene un ecosistema basado en Docker puro. Docker, Inc. integra Kubernetes en Docker Desktop, lo que sugiere que el propio Docker reconoce esta tendencia.

> [!tip] Empieza con Swarm si vienes de Compose
> Si ya usas Compose y necesitas multi-host, **Swarm es el paso más natural**. Cuando el cluster crece más allá de lo que Swarm maneja cómodamente, **migra a Kubernetes**. La transición es más fácil desde Swarm que desde Compose directo.

## Cuándo NO usar Swarm ni Kubernetes

Para casos simples, **no necesitas un orquestador**:

- **Single-host apps**: usa Compose.
- **Static sites o APIs pequeñas**: serverless, Cloud Run, FaaS.
- **Dev local**: Compose es suficiente.

Los orquestadores añaden **complejidad operacional** que solo se justifica cuando la escala lo demanda.

## Próximos pasos

- [[12-kubernetes-en-detalle]]: Kubernetes en detalle con Minikube para dev local, kubectl, deployments, services, scaling y las alternativas managed (EKS, GKE, AKS, ECS, Fargate).
