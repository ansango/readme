---
title: "Cierre y recursos"
description: "Cierre de la wiki, recursos para profundizar (libros, documentación oficial, comunidad), palabras finales sobre mantener el hábito de aprender y construir"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, resources, books, learning, community, career]
---

# Cierre y recursos

> [!abstract] Resumen
> Esta última nota de la wiki recopila **recursos para profundizar** en Docker y containerización: libros complementarios, documentación oficial, comunidades, y herramientas. Termina con palabras finales sobre cómo mantener el hábito de aprender en un ecosistema que cambia rápido, y cómo aplicar lo aprendido a tu carrera.

## Libros complementarios

### El libro del que viene esta wiki

- **Docker: Up & Running** — Sean P. Kane, Karl Matthias (O'Reilly, 3ª edición, 2023). La fuente de toda esta wiki. Si quieres profundizar en algo que aquí se queda corto, vuelve a este libro.

### Containers y Linux fundamentals

- **Containers für den Raspberry Pi** — si quieres ver containers desde otro ángulo (literalmente, en hardware mínimo).
- **The Linux Command Line** — William Shotts. Para quien se sienta débil en shell. Containers viven en la shell.

### Kubernetes (el siguiente paso natural)

- **Kubernetes: Up & Running** — Brendan Burns, Joe Beda, Kelsey Hightower (O'Reilly). El equivalente en Kubernetes de este libro sobre Docker.
- **Kubernetes in Action** — Marko Lukša (Manning). Más profundo, ideal cuando ya manejas lo básico.
- **Cloud Native DevOps with Kubernetes** — Justin Domingus, John Arundel (O'Reilly). Para el lado de operaciones.

### Site Reliability Engineering

- **Site Reliability Engineering** — Niall Murphy, Betsy Beyer, Chris Jones, Jennifer Petoff (O'Reilly). Cómo Google opera sistemas a escala. Conceptos aplicables a cualquier plataforma.
- **The Site Reliability Workbook** — Betsy Beyer et al. (O'Reilly). Más práctico.

### Project management y liderazgo

- **The Manager's Path** — Camille Fournier (O'Reilly). Para el camino de management.
- **The Phoenix Project** — Gene Kim et al. Novela sobre DevOps, fácil de leer.
- **The Unicorn Project** — Gene Kim. Su secuela, sobre developers.

### Para pensar arquitectura

- **Software Architecture: The Hard Parts** — Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani (O'Reilly). Trade-offs arquitectónicos con honestidad brutal.
- **Domain-Driven Design** — Eric Evans. Si tus apps tienen lógica de negocio compleja.
- **Building Evolutionary Architectures** — Neal Ford, Rebecca Parsons, Patrick Kua (O'Reilly).

## Documentación oficial

- **Docker docs**: https://docs.docker.com — La referencia canónica. Cambia con cada release; siempre revisa la versión correspondiente a tu Docker engine.
- **Docker Hub**: https://hub.docker.com — Registry público con miles de imágenes.
- **Docker Compose spec**: https://docs.docker.com/compose/compose-file/ — Para YAML reference de `docker-compose.yml`.
- **Kubernetes docs**: https://kubernetes.io/docs/ — Cuando estés listo para el siguiente nivel.
- **containerd docs**: https://containerd.io/ — El runtime por debajo de Docker.
- **OCI spec**: https://opencontainers.org/ — El estándar abierto de containers.

## Comunidades

- **Docker Community Slack**: https://dockercommunity.slack.com/ — Canal oficial de la comunidad Docker.
- **CNCF Slack**: https://slack.cncf.io/ — Comunidades de Kubernetes y todo el ecosistema cloud-native.
- **r/docker en Reddit**: https://www.reddit.com/r/docker/ — Discusiones y noticias.
- **Stack Overflow**: tag `docker` — Para preguntas técnicas específicas.
- **Server Fault**: para ops/sysadmin questions.

## Conferencias y eventos

- **DockerCon** — La conferencia oficial de Docker. Generalmente tiene talks grabados disponibles.
- **KubeCon + CloudNativeCon** — La conferencia de la CNCF, centrada en Kubernetes pero con mucho contenido sobre containers.
- **DevOpsDays** — Conferencias locales en muchas ciudades del mundo. Buenos para networking.
- **Linux Foundation events** — Training y eventos sobre open source, containers, cloud native.

## Newsletters y blogs

- **Docker Newsletter** — Updates oficiales de Docker.
- **Last Week in Kubernetes (LWK)** — Resumen semanal de lo importante en el ecosistema.
- **The New Stack** — Análisis y reportajes sobre el ecosistema de containers.
- **Julia Evans (b0rk)** — No es de Docker específicamente, pero sus explicaciones de Linux, networking, y debugging son **maravillosas** y muy aplicables.

## Herramientas útiles para seguir aprendiendo

- **`dive`**: para explorar layers de una imagen Docker interactivamente.
- **`docker-debug`**: imagen de debug con busybox + strace + gdb.
- **Hadolint**: linter para Dockerfiles, cazas malas prácticas.
- **Trivy**: scanner de vulnerabilidades para imágenes y configs.
- **Slim.ai**: herramienta para optimizar imágenes (minimizar tamaño).

## Cómo mantener el hábito de aprender

El ecosistema de containers cambia rápido. Lo que es verdad hoy puede no serlo en dos años. Mantenerse al día es difícil pero importante. Aquí van algunas estrategias:

### Dedica tiempo a leer cada semana

No tiene que ser mucho. **30 minutos a la semana** es mejor que 5 horas una vez al mes. Lee blogs, issues de GitHub, RFCs. Sigue a gente interesante en Twitter/Mastodon.

### Construye cosas

**Lee sobre algo, luego impleméntalo**. Las notas de este wiki no sirven de nada si no abres una terminal y pruebas. Construye un side project, automatiza algo en tu trabajo, o contribuye a open source.

### Enseña

La mejor forma de aprender es **explicar a otros**. Escribe blogs, da talks internos, mentoriza a juniors. Cuando tienes que explicar algo, descubres huecos en tu propio conocimiento.

### Mantén la humildad

El senior de hoy es el junior de mañana en el tema del futuro. **Nadie sabe todo** y los frameworks van y vienen. Lo que permanece son los **principios**: stateless, inmutable, externalizado, automatizado.

### Construye una red

Ten un grupo de colegas con quien hablar de tecnología. **Una conversación de 30 minutos** con alguien que ha resuelto tu problema te ahorra 5 horas de búsqueda en Google.

## Reflexión final

> [!tip] El viaje importa más que el destino
> Cuando termines esta wiki y vuelvas a tu trabajo, no vas a "saber Docker". Vas a **saber lo suficiente para tomar buenas decisiones** sobre containers, y eso es lo que importa. El resto se aprende haciéndolo.

Esta wiki no es un sustituto de la experiencia. Es un mapa. El territorio lo caminas tú.

Si en algún momento te sientes perdido con un problema de containers, vuelve aquí. Si después de leer te das cuenta de que algo falta o está mal, **edítalo**. Esta wiki vive en tu vault; tú tienes el control.

Ahora sal y construye algo. Y cuando lo construyas, **comparte lo que aprendiste** con alguien más.
