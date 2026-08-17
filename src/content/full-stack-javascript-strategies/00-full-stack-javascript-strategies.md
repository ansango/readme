---
title: Full Stack JavaScript Strategies
description: "Índice de la wiki de Full Stack JavaScript Strategies: estrategias para construir, testear, asegurar, optimizar y desplegar una aplicación full stack JS, basada en el libro de Milecia McGregor (O'Reilly, 2025)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, nestjs, react, postgresql, devops, career]
---

# Full Stack JavaScript Strategies

> [!abstract] Resumen
> Esta wiki toma como guía el índice de *Full Stack JavaScript Strategies* (Milecia McGregor, O'Reilly, primera edición de 2025, ISBN 978-1-098-12225-6). Es un manual de referencia para devs frontend o backend que quieren dar el salto a un nivel senior cubriendo el ciclo de vida completo de una aplicación full stack JS: desde el kickoff con Producto y Diseño, hasta la arquitectura del backend con NestJS, el frontend con React, la integración, el despliegue y la gestión de proyectos y carrera. La prosa está llena de **estrategias y criterios de decisión** (cuándo usar microservicios, cuándo fine-tunear, cuándo reescribir vs migrar), no de tutoriales paso a paso de un framework concreto. Por eso sigue siendo útil como checklist aunque cambien las herramientas específicas.

## Acerca del libro

El libro arranca con una idea clara: este no es un manual para aprender JavaScript ni un tutorial exhaustivo de un framework. Es una **guía de referencia** que puedas abrir en cualquier momento del SDLC (Software Development Lifecycle) para validar decisiones técnicas. La autora Milecia McGregor asume que el lector ya sabe escribir código frontend o backend con solidez y que está listo para aprender a tomar decisiones que afectan a todo el sistema.

> [!note] Frontend, backend y el resto
> El libro está escrito pensando en devs con un foco principal (frontend o backend) que necesitan entender el otro lado y el ciclo completo. Eso explica el énfasis en hablar con otros equipos (Producto, Diseño, DevOps, QA, Soporte) tanto como en escribir código. Esta wiki mantiene ese mismo equilibrio: la mitad de las notas son técnicas puras y la otra mitad son sobre comunicación, criterio y proceso.

La prosa tiene un tono muy específico: cada decisión técnica viene acompañada de **por qué** se toma, **qué alternativas** había y **qué pasa cuando la decisión falla**. No hay "siempre haz X", hay "en esta situación X, pero si pasa Y considera Z". El libro también incluye opiniones de otros ingenieros senior (Ethan Brown, Jeff Graham) para dar contexto de cómo se resuelven estos problemas en distintos equipos.

## Cómo leer esta wiki

Las notas van en el orden del libro. Cada capítulo del libro está cubierto por una o dos notas según la densidad del contenido:

- **Capítulos 14, 27 y 31** → dos notas por capítulo (split por bloque temático).
- **El resto** → una sola nota.

Cada nota sigue el mismo patrón: un `[!abstract]` arriba, contenido con H2/H3, callouts usados con propósito (`tip`, `warning`, `danger`, `question`, `example`, `note`, `info`), bloques de código cuando aportan y un `## Próximos pasos` al final enlazando a la siguiente nota.

> [!tip] Numeración de las notas
> La numeración `01-`, `02-`, etc. es **consecutiva por orden de lectura**, no correlativa con el número de capítulo del libro. Por eso, por ejemplo, las dos notas del capítulo 14 son la `14-` y la `15-`, y el capítulo 15 original pasa a la `16-`. La tabla "Mapeo capítulo → nota" más abajo resuelve esa correspondencia cuando la necesites.

## Mapeo capítulo → nota

| Capítulo del libro | Nota(s) de la wiki | Título |
|---|---|---|
| Preface + Ch 1 | [[01-kickoff-del-proyecto]] | Kickoff del proyecto |
| Ch 2 | [[02-setup-del-backend]] | Setup del backend |
| Ch 3 | [[03-esquema-de-datos]] | Esquema de datos |
| Ch 4 | [[04-apis-rest]] | APIs REST |
| Ch 5 | [[05-servicios-de-terceros]] | Servicios de terceros |
| Ch 6 | [[06-background-jobs]] | Background jobs |
| Ch 7 | [[07-testing-del-backend]] | Testing del backend |
| Ch 8 | [[08-seguridad-del-backend]] | Seguridad del backend |
| Ch 9 | [[09-debugging-del-backend]] | Debugging del backend |
| Ch 10 | [[10-performance-del-backend]] | Performance del backend |
| Ch 11 | [[11-escalabilidad]] | Escalabilidad |
| Ch 12 | [[12-monitoring-logs-e-incidentes]] | Monitoring, logs e incidentes |
| Ch 13 | [[13-setup-del-frontend]] | Setup del frontend |
| Ch 14 | [[14-construir-la-app-react-setup]] + [[15-construir-la-app-react-primera-feature]] | Construir la app React |
| Ch 15 | [[16-gestion-de-estado]] | Gestión de estado |
| Ch 16 | [[17-gestion-de-datos]] | Gestión de datos |
| Ch 17 | [[18-estilos-personalizados]] | Estilos personalizados |
| Ch 18 | [[19-manejo-de-errores-en-frontend]] | Manejo de errores en frontend |
| Ch 19 | [[20-seguridad-del-frontend]] | Seguridad del frontend |
| Ch 20 | [[21-performance-del-frontend]] | Performance del frontend |
| Ch 21 | [[22-testing-del-frontend]] | Testing del frontend |
| Ch 22 | [[23-debugging-del-frontend]] | Debugging del frontend |
| Ch 23 | [[24-setup-de-despliegue-full-stack]] | Setup de despliegue full stack |
| Ch 24 | [[25-testing-de-integracion]] | Testing de integración |
| Ch 25 | [[26-estrategias-de-despliegue]] | Estrategias de despliegue |
| Ch 26 | [[27-preocupaciones-de-integracion]] | Preocupaciones de integración |
| Ch 27 | [[28-pipeline-ci-cd-creacion]] + [[29-pipeline-ci-cd-entornos]] | Pipeline CI/CD |
| Ch 28 | [[30-git-management]] | Git management |
| Ch 29 | [[31-gestion-de-proyectos]] | Gestión de proyectos |
| Ch 30 | [[32-apps-nuevas-vs-existentes]] | Apps nuevas vs existentes |
| Ch 31 | [[33-carrera-y-desarrollo-profesional]] | Carrera y desarrollo profesional |
| Cierre | [[34-cierre-y-claves]] | Cierre y claves |

## Las cuatro partes del libro

### Parte I — Empezar el proyecto

- [[01-kickoff-del-proyecto|Kickoff del proyecto]]: reuniones con Producto y Diseño, traducir diseños en tickets, hablar con DevOps, QA y Soporte, fijar plazos sin prometer de más.

### Parte II — Construir el backend (NestJS + Postgres)

- [[02-setup-del-backend|Setup del backend]]: por qué NestJS, monolito vs microservicios vs serverless, REST vs GraphQL, README y CHANGELOG.
- [[03-esquema-de-datos|Esquema de datos]]: diagramar el modelo, montar Postgres, elegir ORM (Prisma), escribir migraciones y seed.
- [[04-apis-rest|APIs REST]]: convenciones de API, DTOs, controllers vs services, validación y manejo de errores.
- [[05-servicios-de-terceros|Servicios de terceros]]: cómo elegir (Stripe como ejemplo), trade-offs de cada integración.
- [[06-background-jobs|Background jobs]]: cron jobs, alertas, monitoring, problemas de sincronización.
- [[07-testing-del-backend|Testing del backend]]: por qué testear, qué tipo de tests, mock data.
- [[08-seguridad-del-backend|Seguridad del backend]]: autenticación, autorización, OWASP Top 10.
- [[09-debugging-del-backend|Debugging del backend]]: logs detallados, configs de entorno, trazar bugs, ayudar a otros devs.
- [[10-performance-del-backend|Performance del backend]]: métricas, alertas, caching (estrategias, tipos, Redis).
- [[11-escalabilidad|Escalabilidad]]: vertical, horizontal, híbrida, best practices.
- [[12-monitoring-logs-e-incidentes|Monitoring, logs e incidentes]]: playbooks de incidente, postmortems sin culpa.

### Parte III — Construir el frontend (React)

- [[13-setup-del-frontend|Setup del frontend]]: decisiones de arquitectura, elegir framework, paquetes.
- [[14-construir-la-app-react-setup|Construir la app React: setup]]: linters, formateadores, build, estilos, testing, CHANGELOG, README.
- [[15-construir-la-app-react-primera-feature|Construir la app React: primera feature]]: estructura de proyecto, routing, actualizar la raíz.
- [[16-gestion-de-estado|Gestión de estado]]: useState, useReducer, useContext, state managers externos.
- [[17-gestion-de-datos|Gestión de datos]]: Axios + TanStack Query, .env, loading y error states, headers.
- [[18-estilos-personalizados|Estilos personalizados]]: accesibilidad, diseños consistentes, temas, responsive.
- [[19-manejo-de-errores-en-frontend|Manejo de errores en frontend]]: error boundaries, validación de usuario, errores de API.
- [[20-seguridad-del-frontend|Seguridad del frontend]]: vulnerabilidades comunes, validación de lógica de negocio, sesiones, paquetes, inputs.
- [[21-performance-del-frontend|Performance del frontend]]: métricas, Lighthouse, bundle size, lazy loading, prefetching, assets.
- [[22-testing-del-frontend|Testing del frontend]]: unit (Jest, Vitest, MSW), E2E con Cypress.
- [[23-debugging-del-frontend|Debugging del frontend]]: proceso, logs, breakpoints, DevTools (Elements, Sources, Network, Application).

### Parte IV — Desplegar la app full stack

- [[24-setup-de-despliegue-full-stack|Setup de despliegue full stack]]: equipos involucrados, pasos de conexión backend-frontend, cleanup y docs.
- [[25-testing-de-integracion|Testing de integración]]: test cases, Cypress, Playwright, Nightwatch, comparativa.
- [[26-estrategias-de-despliegue|Estrategias de despliegue]]: release dates, version releases, blue-green, canary, rollbacks y hotfixes.
- [[27-preocupaciones-de-integracion|Preocupaciones de integración]]: frontend/backend, terceros, datos, seguridad en prod, containerización.
- [[28-pipeline-ci-cd-creacion|Pipeline CI/CD: creación]]: velocidad, git hooks, GitHub Actions, CircleCI.
- [[29-pipeline-ci-cd-entornos|Pipeline CI/CD: entornos]]: feature, dev, staging, production, variables de entorno.
- [[30-git-management|Git management]]: branching strategies, PR reviews, conflictos, squash, rebase.
- [[31-gestion-de-proyectos|Gestión de proyectos]]: sprint planning, estimaciones, capacidad, tickets, contexto.

### Parte V — El lado humano

- [[32-apps-nuevas-vs-existentes|Apps nuevas vs existentes]]: consideraciones para greenfield y para legacy, lectura de código, refactors.
- [[33-carrera-y-desarrollo-profesional|Carrera y desarrollo profesional]]: camino técnico, camino de management, journal profesional, moverse a otras áreas.
- [[34-cierre-y-claves|Cierre y claves]]: cierre del libro, qué leer para seguir profundizando.

## Subtemas transversales

> [!tip] Tres ejes que reaparecen constantemente
> A lo largo del libro se repiten tres preocupaciones que vuelven una y otra vez, en frontend y en backend, al construir features y al operar el sistema en producción:
> 1. **Comunicación entre equipos** → kickoff (Ch 1), DevOps/QA/Soporte (Ch 1), feedback de usuarios (Ch 29-30).
> 2. **Criterio de decisión** → arquitectura (Ch 2), ORM (Ch 3), GraphQL vs REST (Ch 2), seguridad (Ch 8, 19), performance (Ch 10, 20).
> 3. **Operación en producción** → monitoring (Ch 12, 6, 10), debugging (Ch 9, 22), despliegue (Ch 25-27), incidentes (Ch 12).
>
> Si una decisión de diseño no mejora alguna de esas tres dimensiones, probablemente no merece la complejidad añadida.

> [!warning] Lo que este libro NO es
> El libro no es un tutorial de JavaScript, ni un deep dive en NestJS o React, ni una guía exhaustiva de GraphQL, Docker o Kubernetes. La autora lo dice explícitamente en el prefacio: **es un libro de estrategias**, no de implementaciones. Si buscas tutoriales paso a paso, este no es tu libro. Si quieres saber **cuándo** y **por qué** tomar cada decisión técnica, sí.

## Próximos pasos

- [[01-kickoff-del-proyecto|Kickoff del proyecto]]: por dónde empieza todo. Reunión inicial con Producto y Diseño, preguntas clave, traducir diseños en tickets y coordinar con los demás equipos.
