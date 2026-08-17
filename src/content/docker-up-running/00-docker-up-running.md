---
title: "Docker: Up & Running"
description: "Índice de la wiki de Docker: Up & Running, basada en la 3ª edición del libro de Sean P. Kane y Karl Matthias (O'Reilly, 2023), que cubre la promesa de Docker, arquitectura, imágenes, contenedores, debugging, Compose, producción y orquestación a escala"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, containers, devops, orchestration, dockerfile, kubernetes]
---

# Docker: Up & Running

> [!abstract] Resumen
> Esta wiki toma como guía *Docker: Up & Running* (Sean P. Kane y Karl Matthias, O'Reilly, 3ª edición de 2023), un manual de referencia sobre Docker y Linux containers. Cubre desde la promesa de Docker y su arquitectura cliente/servidor, hasta la instalación multiplataforma, la construcción y publicación de imágenes, el trabajo diario con contenedores, debugging, Docker Compose, el camino a producción, orquestación a escala (Swarm, Kubernetes, ECS) y temas avanzados (cgroups, namespaces, security, networking, storage). Es un libro práctico, lleno de ejemplos y con foco en el flujo de trabajo real de los equipos.

## Acerca del libro

El libro arranca con la promesa original de Docker: una herramienta que apareció en 2013 (presentada por Solomon Hykes en una charla relámpago de 5 minutos) y que se convirtió en pocos años en la base de la containerización en la industria. Docker **no es una plataforma de virtualización enterprise ni un reemplazo de configuration management**: es una pieza que cruza workflows muy diversos y que, combinada con otras herramientas, simplifica enormemente cómo se construyen, prueban y despliegan aplicaciones.

> [!note] No es un tutorial paso a paso
> Como la wiki de Full Stack JS Strategies, esta no es un tutorial que se sigue de principio a fin. Es una **referencia de estrategias y patrones** sobre Docker: cuándo usar cada feature, qué trade-offs tiene cada decisión, qué patrones de arquitectura container encajan mejor en cada caso. Úsala como checklist cuando enfrentes un problema concreto.

## Cómo leer esta wiki

Las notas van en el orden del libro. Tres capítulos muy densos (4, 10, 11) están partidos en dos notas cada uno. El resto se queda en una sola nota.

Cada nota sigue el patrón: `[!abstract]` arriba, contenido con H2/H3, callouts usados con propósito, bloques de código con `dockerfile`, `bash`, `yaml` o `text` cuando aportan, tablas para comparar opciones, y un `## Próximos pasos` al final enlazando a la siguiente nota.

## Mapeo capítulo → nota

| Capítulo | Nota(s) de la wiki | Título |
|---|---|---|
| Preface + Ch 1 | [[01-introduccion-y-promesa]] | Introducción y promesa de Docker |
| Ch 2 | [[02-arquitectura-y-ecosistema]] | Arquitectura y ecosistema |
| Ch 3 | [[03-instalar-docker]] | Instalar Docker |
| Ch 4 | [[04-trabajar-con-imagenes-docker]] + [[05-imagenes-avanzadas-registries]] | Trabajar con imágenes Docker |
| Ch 5 | [[06-trabajar-con-contenedores]] | Trabajar con contenedores |
| Ch 6 | [[07-explorando-docker]] | Explorando Docker |
| Ch 7 | [[08-debug-de-contenedores]] | Debug de contenedores |
| Ch 8 | [[09-docker-compose]] | Docker Compose |
| Ch 9 | [[10-path-to-production]] | Path to production |
| Ch 10 | [[11-containers-at-scale]] + [[12-kubernetes-en-detalle]] | Containers at scale |
| Ch 11 | [[13-advanced-topics]] + [[14-advanced-security-networking-storage]] | Advanced topics |
| Ch 12 | [[15-paisaje-en-expansion]] | El paisaje en expansión |
| Ch 13 | [[16-container-platform-design]] | Container platform design |
| Ch 14 | [[17-conclusion]] | Conclusión |
| Cierre | [[18-cierre-y-recursos]] | Cierre y recursos |

## Las cuatro partes del libro

### Parte I — Fundamentos

- [[01-introduccion-y-promesa]]: qué es Docker, qué no es, terminología clave.
- [[02-arquitectura-y-ecosistema]]: cliente/servidor, networking, ecosistema, el Docker workflow.
- [[03-instalar-docker]]: setup multiplataforma (Linux, macOS, Windows, WSL2, Vagrant).

### Parte II — Imágenes y contenedores

- [[04-trabajar-con-imagenes-docker]]: Dockerfile, build, ejecución, build args, env vars, custom base images.
- [[05-imagenes-avanzadas-registries]]: public y private registries, autenticación, push.
- [[06-trabajar-con-contenedores]]: comandos, volumes, networking, environment, labels.
- [[07-explorando-docker]]: inspeccionar contenedores, network, filesystem, recursos.

### Parte III — Debugging, Compose y producción

- [[08-debug-de-contenedores]]: estrategias, logs, debugging interactivo, debugging en producción.
- [[09-docker-compose]]: archivos multi-servicio, networking, volumes, profiles, override.
- [[10-path-to-production]]: testing, CI/CD, registry workflows, deployment patterns.

### Parte IV — Escala y temas avanzados

- [[11-containers-at-scale]]: Swarm mode, introducción a Kubernetes, Minikube.
- [[12-kubernetes-en-detalle]]: kubectl, deployments, services, scaling, ECS, Fargate.
- [[13-advanced-topics]]: cgroups, namespaces, daemon config, runtime swap, gVisor.
- [[14-advanced-security-networking-storage]]: security (UID 0, rootless, AppArmor), networking, storage.
- [[15-paisaje-en-expansion]]: nerdctl, podman, buildah, Rancher Desktop, Podman Desktop.
- [[16-container-platform-design]]: Twelve-Factor App, Reactive Manifesto.
- [[17-conclusion]]: el camino adelante, los desafíos que Docker aborda.
- [[18-cierre-y-recursos]]: recursos para profundizar, palabras finales.

## Subtemas transversales

> [!tip] Tres ejes que reaparecen constantemente
> A lo largo del libro se repiten tres tensiones que definen casi todas las decisiones sobre Docker:
> 1. **Stateless vs stateful** → Docker encaja especialmente bien con aplicaciones stateless; stateful requiere diseño cuidadoso (volúmenes externos, bases de datos gestionadas, etc.).
> 2. **Inmutabilidad vs mutabilidad** → la filosofía "atomic / throwaway" (tirar el contenedor y reemplazarlo) choca con sistemas que asumen updates in-place.
> 3. **Cuándo Docker vs otras herramientas** → Docker no sustituye a Kubernetes, ni a config management, ni a CI/CD; se complementa con todas.

> [!warning] Lo que este libro NO es
> No es un tutorial de Kubernetes exhaustivo (hay libros enteros dedicados), ni una guía de security hardening, ni una referencia completa de networking de containers. Cada uno de esos temas tiene su propio libro. Esta wiki cubre **lo suficiente para tomar decisiones informadas** sobre cada uno.

## Próximos pasos

- [[01-introduccion-y-promesa]]: por qué Docker merece una mirada más profunda, qué no es, y la terminología clave para seguir el resto de la wiki.
