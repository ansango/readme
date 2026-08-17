---
title: "Arquitectura y ecosistema"
description: "Modelo cliente/servidor, containerd y runc, network ports y Unix sockets, Docker Engine API, container networking (bridge mode), broad support del ecosistema, simplificación de procesos"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, containers, architecture, client-server, networking, containerd, runc, ocr, open-container-initiative]
---

# Arquitectura y ecosistema

> [!abstract] Resumen
> Esta nota cubre la arquitectura de Docker: el modelo cliente/servidor y por qué es simple aunque debajo sea complejo, containerd y runc como runtimes por debajo, network ports y Unix sockets, la Docker Engine API como punto de integración, container networking (especialmente el bridge mode por defecto), el broad support del ecosistema (todos los clouds grandes, Linux distros, OCI), y el Docker workflow como simplificador de procesos. Es la base para entender cómo interactúan las piezas.

## Simplificación de procesos

Antes de meternos en la arquitectura técnica, vale la pena entender **cómo Docker cambia los procesos del equipo**. Sin Docker, el ciclo de llevar una aplicación a producción típicamente era:

1. Los developers piden recursos a operaciones.
2. Operaciones aprovisiona y entrega los recursos.
3. Developers escriben scripts y herramientas de deployment.
4. Operaciones y developers iteran sobre el deployment.
5. Developers descubren dependencias adicionales.
6. Operaciones instala los nuevos requisitos.
7. Loop sobre los pasos 4-6 n veces.
8. La aplicación se despliega.

**Un deploy de una app compleja podía tomar casi una semana**. DevOps prácticas ayudaban pero el problema persistía: comunicación costosa, capacidad técnica limitada, y la fricción llevaba a developers a evitar features nuevas o meterse en problemas de deployment.

### Cómo lo cambia Docker

Con Docker, el ciclo se convierte en:

1. Los developers construyen la imagen Docker y la suben al registry.
2. Operaciones proporciona configuración al container y aprovisiona recursos.
3. Developers disparan el deploy.

Esto es posible porque Docker permite descubrir problemas de dependencias **durante los ciclos de dev y test**, no en producción. El handoff entre dev y ops se reduce drásticamente. En un pipeline bien afinado, **nadie más que el equipo de desarrollo necesita estar involucrado** en crear y desplegar un nuevo servicio.

> [!quote] "Batteries included but removable"
> Docker adopta la filosofía de "baterías incluidas pero removibles": viene con todo lo que la mayoría necesita, pero las piezas son intercambiables. Esto te permite empezar rápido y reemplazar partes con soluciones custom según sea necesario.

## Modelo cliente/servidor

Docker es más simple de lo que parece por fuera. Por debajo tiene muchas piezas (containerd, runc, etc.), pero la interacción básica es **cliente habla con servidor a través de una API**.

### Las tres piezas

- **Client**: el comando `docker` que usas desde la terminal.
- **Server (daemon)**: el proceso `dockerd` que hace el trabajo de construir, correr y gestionar containers.
- **Registry**: almacenamiento de imágenes Docker y su metadata (opcional pero típico).

El server hace el trabajo ongoing; el cliente le dice qué hacer. Un cliente puede hablar con muchos servers; un server puede correr en cualquier número de máquinas de la infraestructura.

> [!note] Estructura por debajo
> El server no es monolítico: orquesta otros componentes como `containerd-shim-runc-v2` para hablar con runc y containerd. Docker **esconde esa complejidad** detrás de una API simple. Para el uso diario, piensa en cliente y server.

## containerd y runc

Por debajo del `dockerd`, hay un stack de runtimes que cumplen el estándar OCI:

- **containerd**: runtime de alto nivel. Es el default en versiones modernas de Docker y Kubernetes. Maneja el ciclo de vida de los containers, imágenes, network, etc.
- **runc**: runtime de bajo nivel. Es el default que usa containerd. Cumple el estándar OCI y crea los containers a nivel de kernel.
- **crun**: escrito en C, optimizado para velocidad y footprint pequeño.
- **Kata Containers**: runtime virtualizado de Intel, Hyper y OpenStack Foundation. Ejecuta una mezcla de containers y VMs.
- **gVisor** (Google): runtime sandboxed implementado enteramente en user space.
- **Nabla Containers**: otro runtime sandboxed que reduce significativamente la attack surface.

> [!tip] El stack real
> Cuando corres `docker run`, la cadena es: docker CLI → dockerd → containerd → runc → kernel. Docker te da una API unificada; los runtimes especializados pueden intercambiarse.

## Network ports y Unix sockets

El cliente `docker` y el daemon `dockerd` se comunican a través de **Unix sockets** o **network ports**. Docker, Inc. tiene registrados tres puertos con IANA:

| Puerto | Uso |
|---|---|
| 2375 | Tráfico sin encriptar |
| 2376 | SSL encriptado |
| 2377 | Docker Swarm mode |

> [!warning] El default es seguro
> El instalador de Docker configura por defecto **solo Unix socket** para la comunicación con el daemon local. Esto es lo más seguro. Los ports de red son configurables, pero no se recomienda usarlos por la falta de autenticación y RBAC en el daemon.
>
> El socket se encuentra típicamente en `/var/run/docker.sock`. Versiones recientes de Docker Desktop pueden crearlo en `~/.docker/run/` y symlinkearlo.

## Docker Engine API

Como cualquier software moderno, el daemon tiene una **API REST documentada**. El cliente CLI la usa internamente, pero cualquiera puede usarla directamente. Esto es un punto de integración potente para construir herramientas custom que creen, inspeccionen y gestionen imágenes y containers.

Docker mantiene **SDKs oficiales para Python y Go**. Hay librerías de terceros para otros lenguajes. Casi todo lo que hace el CLI se puede hacer vía API, con dos excepciones notables: operaciones que requieren **streaming o acceso a terminal** (shells remotos, modo interactivo) son más fáciles con un client library o el CLI.

## Container networking

Aunque los Linux containers son procesos en el host, **se comportan de forma diferente a nivel de red**. Docker soporta varias configuraciones; el **bridge mode** es el default.

### Cómo funciona el bridge mode

Cada container es como un host en una red privada. El Docker server actúa como bridge (repetidor de tráfico entre lados). Cada container tiene una **interfaz Ethernet virtual** conectada al bridge Docker y una IP asignada a esa interfaz.

Docker asigna la subred privada de un **bloque RFC 1918 no usado** en el host. La bridge hacia la red local del host es una interfaz llamada `docker0`. Por defecto, **todos los containers están en la misma red** y pueden hablar entre sí directamente. Para llegar al host o al exterior, pasan por la interfaz `docker0`.

> [!note] Network por defecto vs custom
> Empieza con el networking por defecto. Si necesitas topologías más complejas, hay opciones: configurar tu propio bridge, asignar tus propios bloques, o usar `--net=host` para saltarse toda la capa de virtual networking. Cuidado con las implicaciones de seguridad de `host` networking.

## Broad support y adopción

Docker tiene **soporte masivo en la industria**. La mayoría de los grandes clouds ofrecen soporte directo:

- **AWS**: ECS, EKS, Fargate, Elastic Beanstalk.
- **Google**: GKE, App Engine.
- **Microsoft Azure**: AKS.
- **Red Hat OpenShift**, **IBM Cloud**, y muchos más.

> [!note] Historia del formato
> En 2014, Google anunció que soportaría Docker como formato interno primario. En 2017, Docker donó containerd a la CNCF (Cloud Native Computing Foundation), que lo elevó a graduated project en 2019. Hoy, el formato OCI (basado en Docker image format v2) es el estándar.

Docker está disponible en **Linux, macOS y Windows**. En macOS y Windows, Docker Desktop crea una pequeña VM Linux que corre el daemon (porque Linux containers solo corren en Linux kernel). En Windows 10/11 también puedes usar **WSL2 (Windows Subsystem for Linux v2)** para correr Linux containers sin VM.

### Open Container Initiative (OCI)

Para evitar la dependencia de un vendor, Docker, Inc. ayudó a patrocinar la OCI en 2015. La primera especificación completa se liberó en julio de 2017, basada en gran parte en el formato Docker v2. Ahora se puede certificar OCI tanto para imágenes como para runtimes.

## Cómo sacarle más a Docker

Docker funciona especialmente bien para **aplicaciones stateless** o donde el estado se externaliza a data stores como DBs o caches. Esas son las más fáciles de containerizar. **Aplicaciones stateful** (bases de datos, por ejemplo) son más complicadas porque el container es ephemeral; pierdes el estado al re-crear el container.

> [!tip] Empieza con stateless
> Si empiezas containerizando bases de datos, te vas a frustrar. Empieza con **web frontends, backend APIs, y tareas cortas** como scripts de mantenimiento. Una vez que tengas confianza, aborda casos más complejos.

### Containers no son VMs

Una buena forma de internalizar Docker es pensar en los containers como **wrappers muy ligeros alrededor de un solo proceso Unix**, no como VMs. El proceso puede spawnear otros procesos, pero un binario estáticamente compilado puede ser todo lo que hay dentro.

Los containers son **efímeros**: pueden existir meses o ser creados, correr una tarea de un minuto y ser destruidos. Eso es OK; es fundamentalmente diferente a cómo se usan las VMs.

### Aislamiento limitado

Los containers están aislados unos de otros, pero el aislamiento es más limitado de lo que podrías esperar. **Por defecto, comparten CPU y memoria en el host** (como procesos Unix normales). Puedes poner límites, pero no son el default como en una VM.

Todos los procesos de containers aparecen en el `ps` del host. Eso es **completamente diferente** de un hypervisor, donde cada VM corre su propio kernel.

> [!warning] UID 0 no es seguro
> Por defecto, muchos containers corren procesos como UID 0 (root). Dentro del container parece seguro, pero como todo corre en el mismo kernel, **vulnerabilidades o configuraciones erróneas pueden dar al root del container acceso no autorizado a recursos del host**. Hay formas de mitigar esto (rootless mode, capabilities, seccomp, AppArmor, SELinux), pero requieren configuración explícita.

### Containers son ligeros

Un container recién creado desde una imagen existente toma **~12 KB** de disco. Una VM nueva desde un golden image puede requerir cientos o miles de MB. El container es solo una referencia a un filesystem layerizado y metadata de configuración. No se asigna copia de datos hasta que el container necesita escribir algo único para sí mismo.

### Hacia infraestructura inmutable

Desplegando la mayoría de las apps en containers, puedes **simplificar tu config management** moviéndote hacia infraestructura inmutable, donde los componentes se reemplazan enteros en lugar de modificarse in-place. El server Docker puede ser muy ligero y necesitar poco o nada de config management.

> [!note] Atomic hosts
> Distribuciones como Fedora CoreOS están diseñadas alrededor de este principio. En lugar de decommissionar la instancia, **Fedora CoreOS puede actualizarse a sí mismo atómicamente** y cambiar a la nueva versión del OS. Tu configuración y workloads siguen en containers; no tienes que configurar el OS apenas.

## El Docker workflow

Docker sugiere un workflow particular que encaja bien con cómo muchas empresas están organizadas:

### Revision control

Docker te da **dos formas de revision control** out of the box:

- **Filesystem layers**: cada cambio en el build se apila como un nuevo layer con un hash único. Cuando haces un nuevo build, solo se reconstruyen los layers afectados por el cambio. Esto ahorra tiempo y bandwidth.
- **Image tags**: cada release tiene un tag. "¿Cuál era la versión anterior desplegada?" se responde trivialmente. Rollback es trivial.

> [!warning] Nunca uses `latest` en producción
> `latest` es un tag **flotante**: siempre apunta a la última build. Si actualizas la imagen, el tag apunta a la nueva. No puedes rollback a "latest" porque la versión vieja ya no es latest. **Usa semantic versioning** o el hash de git como tag.

### Build, test, package, deploy

Docker estandariza cada paso del pipeline. La herramienta de build (`docker image build`) consume un Dockerfile y produce una imagen. Cualquiera que haya trabajado con un Dockerfile puede modificar el build de cualquier otra app. **Multistage builds** te permiten definir el build environment por separado del artifact final, dando mucha flexibilidad al build pipeline.

Para testing, Docker garantiza que **el artefacto que pasó los tests es el que va a producción** (porque usas el SHA o un tag custom). Como los containers incluyen todas las dependencias, los tests son muy fiables: si pasan en el container, no tendrás problemas de versiones de librerías en producción.

Para packaging, una imagen Docker es un solo artefacto build, técnicamente compuesto de múltiples layers pero tratado como una unidad. Y para deploy, el cliente Docker built-in soporta una estrategia de deploy de **una sola línea** para poner una build en un host y corriendo. Para clusters, hay un ecosistema enorme de orquestadores que lo extienden.

## El ecosistema Docker

Hay un ecosistema amplio alrededor de Docker. Categorías importantes:

- **Orchestration y mass deployment**: Kubernetes, Apache Mesos + Marathon, HashiCorp Nomad, Mesosphere DC/OS, Rancher.
- **Immutable atomic hosts**: Fedora CoreOS, Bottlerocket OS, etc.
- **APIs y monitoring**: Prometheus (monitoring), Ansible (orquestación simple), etc.
- **Plug-ins Docker**: ejecutables que extienden funcionalidad (aunque muchos están marcados como legacy).

> [!warning] Cuidado con plug-ins legacy
> Muchos plug-ins Docker están siendo reemplazados con mejores approaches. Antes de comprometerte con uno, asegúrate de que sigue siendo la mejor opción y no va a ser unsupported pronto.

## Próximos pasos

- [[03-instalar-docker]]: setup multiplataforma del Docker client y server, incluyendo Linux (Ubuntu, Fedora), macOS, Windows, WSL2, y el approach con Vagrant para casos no soportados.
