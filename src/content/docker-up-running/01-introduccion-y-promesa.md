---
title: "Introducción y promesa de Docker"
description: "Qué es Docker, la promesa original, beneficios del workflow, qué no es Docker y terminología clave (cliente, servidor, imagen, contenedor, host atómico)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, containers, introduction, terminology, history]
---

# Introducción y promesa de Docker

> [!abstract] Resumen
> Esta nota cubre la introducción al libro: la historia de Docker (cómo apareció en 2013 en una charla relámpago de Solomon Hykes), la promesa real detrás de la herramienta (no es virtualización, es containerización), los beneficios concretos del workflow Docker, las cosas para las que Docker **no** es la herramienta adecuada, y la terminología esencial que se usa en el resto del libro. Es una nota corta pero sienta las bases para todo lo demás.

## Un poco de historia

Docker fue presentado al mundo el 15 de marzo de 2013 por Solomon Hykes, fundador y CEO de dotCloud, en una charla relámpago de 5 minutos en la PyCon de Santa Clara. **Sin preaviso, sin fanfarria**. Solo unas 40 personas fuera de dotCloud habían probado la herramienta en ese momento. Unas semanas después, el código se publicó en GitHub como proyecto open source y la industria empezó a hablar de Docker como la herramienta que iba a revolucionar cómo se construye, entrega y ejecuta el software.

Linux containers existían desde 2008, pero Docker fue la pieza que los hizo **accesibles y útiles para todos los engineers**, no solo para unos pocos expertos en kernel.

## La promesa de Docker

Docker es una herramienta que promete **encapsular fácilmente el proceso de crear un artefacto distribuible** para cualquier aplicación, **desplegarlo a escala** en cualquier entorno, y **optimizar el workflow** de organizaciones Agile.

> [!tip] No es virtualización
> Mucha gente al principio veía Docker como "una plataforma de virtualización", pero en realidad es la **primera herramienta ampliamente accesible** construida sobre una tecnología más nueva llamada **containerización**. No es lo mismo.

Docker y los Linux containers han impactado a segmentos de la industria que incluyen herramientas como Vagrant, KVM, OpenStack, Mesos, Ansible, Chef, Puppet, Capistrano, etc. La pista está en que **todos estos workflows han cambiado para siempre** por Docker. Lo que tienen en común es que todos son parte del pipeline CI/CD, y Docker ha alterado las expectativas de cómo ese pipeline debería funcionar: totalmente automatizado, sin intervención humana entre pasos.

### Por qué importa la comunicación entre equipos

Conseguir que la comunicación entre equipos funcione bien es **difícil y caro**, incluso en organizaciones pequeñas. Vivimos en un mundo donde comunicar información detallada entre equipos es cada vez más necesario para tener éxito. **Docker reduce la complejidad de esa comunicación** mientras ayuda a producir software más robusto.

El ejemplo clásico: pedir al equipo de operaciones que instale release 1.2.1 de una librería. Eso **retrasa al developer** y no aporta valor directo al negocio. Si el developer pudiese simplemente subir la versión de la librería, escribir código, testear con la nueva versión y desplegar, el tiempo de entrega se acortaría y habría menos riesgo. Docker ayuda a construir una **capa de aislamiento** en el software que reduce la carga de comunicación.

### Filosofía: atomic y throwaway

Docker es **opinioniated sobre arquitectura de software** de una forma que fomenta aplicaciones más robustas. Su filosofía arquitectónica se centra en **contenedores atómicos o descartables**. Durante el despliegue, el entorno completo de la versión anterior se tira con ella. Nada en el entorno de la aplicación vive más que la propia aplicación. Las consecuencias:

- Las apps no dependen accidentalmente de artefactos de releases anteriores.
- Los cambios de debug efímeros no sobreviven en releases futuros.
- Las apps son altamente portables entre servers porque todo el estado va dentro del artefacto o se externaliza a una DB, cache o file server.

> [!tip] Atomic + inmutable = apps más escalables y fiables
> Las instancias de la app pueden aparecer y desaparecer con poco impacto en el uptime. Docker **obliga** a seguir estas buenas prácticas, lo cual es muy bueno.

## Beneficios del workflow Docker

Docker aporta beneficios a organizaciones, equipos, developers y operaciones por igual. Las decisiones arquitectónicas se simplifican (todas las apps se ven igual desde fuera del host), el tooling es más fácil de escribir y compartir entre apps, y los trade-offs están sorprendentemente skewed hacia los beneficios.

### Beneficios clave

- **Empaquetar software aprovechando las skills que ya tienen los developers**: en lugar de aprender rpm, dpkg, mock, pbuilder y similares, todo se mete en un único formato estándar (OCI).
- **Empaquetar app y filesystem en una sola imagen estandarizada**: ensures que el entorno de ejecución es exactamente el mismo en dev, test, staging y producción.
- **Mismo artefacto en todos los sistemas y entornos**: builds van de CI a producción sin recompilar ni reempaquetar.
- **Abstraer apps del hardware sin sacrificar recursos**: las VMs consumen recursos del host para correr sus propios kernels; los containers son procesos del kernel del host y usan más recursos hasta los límites del sistema.

## Qué no es Docker

Docker tiene un feature set muy amplio pero a menudo le falta profundidad en funcionalidad específica. **No reemplaza directamente** varias categorías de herramientas; en su lugar, se complementa con ellas.

| Categoría | Docker no es... | Cómo se relaciona |
|---|---|---|
| Virtualización enterprise (VMware, KVM) | Los containers no son VMs. Comparten kernel con el host. | Útil en combinación: VMs como hosts Docker, containers como workloads. |
| Cloud platform (OpenStack, CloudStack) | No crea hosts, object storage, block storage. | Se ejecuta en cloud; los clouds ofrecen servicios Docker gestionados. |
| Configuration management (Puppet, Chef) | No gestiona estado de containers ongoing ni el host. | Reduce la cantidad de config management necesaria. |
| Deployment framework (Capistrano, Fabric) | No automatiza workflows complejos por sí solo. | Estandariza el artefacto, así que el deployment es consistente. |
| Development environment (Vagrant) | No simula servidores de producción. | Reemplaza parcialmente: tu dev environment puede ser containers. |
| Workload management (Mesos, Kubernetes, Swarm) | No coordina pools de hosts. | Es la capa que se ejecuta **sobre** Docker. |

> [!warning] Docker tampoco es un reemplazo del sentido común
> Cada organización tiene particularidades. Lo que funciona en una puede no funcionar en otra. Docker **reduce** mucha complejidad pero no la elimina.

## Terminología clave

Estos términos se usan constantemente en el resto de la wiki y en cualquier conversación sobre Docker. Mereces tenerlos claros antes de seguir.

### Docker client

Es el comando `docker` que usas desde tu terminal. Controla la mayoría del workflow de Docker y habla con Docker servers remotos a través de la API.

### Docker server (o daemon)

Es el proceso `dockerd`. Construye y lanza containers, y mantiene su estado. En macOS y Windows, el server corre dentro de una pequeña VM Linux administrada por Docker Desktop.

### Docker / OCI images

Una imagen es uno o más **filesystem layers** más metadata que representan todos los archivos necesarios para correr una aplicación containerizada. Una imagen tiene una dirección de repositorio, un nombre y un tag. El tag suele identificar una release concreta (por ejemplo, `docker.io/superorbital/wordchain:v1.0.1`).

- **Docker image**: cualquier imagen compatible con el toolset de Docker.
- **OCI image**: imagen que cumple el estándar Open Container Initiative y funciona con cualquier tool OCI-compliant.

### Linux container

Un container es una **instancia** instanciada a partir de una imagen Docker u OCI. Un container específico solo existe una vez, pero puedes crear múltiples containers de la misma imagen. El término "Docker container" es un poco misnomer: Docker aprovecha la funcionalidad de containers del sistema operativo, no la inventa.

### Atomic o immutable host

Un sistema operativo **mínimo y afinado** para correr containers, como Fedora CoreOS. Soporta container hosting y actualizaciones atómicas del OS. La idea es tratar el host igual que un container: reemplazarlo entero en lugar de actualizarlo in-place.

## Wrap-Up

Entender qué es Docker (y qué no) es clave antes de seguir. La promesa es real, los beneficios son concretos, y los trade-offs están claramente delimitados. En la próxima nota entraremos en arquitectura: el modelo cliente/servidor, los runtimes por debajo (containerd, runc), el networking y el ecosistema.

## Próximos pasos

- [[02-arquitectura-y-ecosistema]]: el modelo cliente/servidor de Docker, containerd y runc, network ports y Unix sockets, Docker Engine API, y el Docker workflow.
