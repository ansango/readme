---
title: "Setup del backend"
description: "Por qué NestJS, monolito vs microservicios vs serverless, REST vs GraphQL, primeros pasos del repo, README y CHANGELOG"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, nestjs, typescript, architecture]
---

# Setup del backend

> [!abstract] Resumen
> Esta nota cubre las decisiones fundacionales del backend: por qué elegir NestJS como framework, las opciones de arquitectura (monolito, microservicios, serverless, SOA), REST vs GraphQL, cómo inicializar el proyecto, qué herramientas usar para testear localmente, y qué documentación incluir desde el principio (README, CHANGELOG, convenciones). El objetivo es tener una base limpia y documentada sobre la que iterar sin acumular deuda temprana.

## Por qué NestJS

NestJS es, en la práctica, **una arquitectura de backend en una caja**. En cuanto inicializas la app tienes acceso a validación, autenticación, routing, controllers, data schema y un montón de funcionalidad más. La ventaja es que no tienes que ir pegando piezas: NestJS te da lo necesario para montar un backend escalable desde el primer commit. La desventaja es que la estructura es menos flexible: pagas enopinabilidad lo que ganas en velocidad de arranque.

> [!tip] Mantén ADRs
> A medida que el proyecto crece, lleva un registro de **Architecture Decision Records (ADRs)**: documentos cortos que explican por qué y cuándo se tomó cada decisión arquitectónica importante. Es invaluable cuando alguien nuevo se une al equipo o cuando hay que revisar decisiones meses después.

## Eligiendo el enfoque del proyecto

El proyecto del libro es un **monolito con algunas funciones serverless** (arquitectura híbrida). Es la opción adecuada aquí porque permite construir y desplegar rápido, y porque el equipo aún no sabe qué partes van a necesitar escala masiva.

La decisión de arquitectura depende de **cómo va a crecer la app** en el tiempo:

- **Microservicios**: más recursos y más engineers para mantener, pero perfectos si vas a una arquitectura domain-driven (ver [[32-apps-nuevas-vs-existentes]]).
- **Monolito**: más fácil de desarrollar y debuggear, pero los cambios grandes cuestan más y un bug grave puede tirar toda la app.

### Por qué TypeScript

El proyecto se escribe en TypeScript desde el día uno. Las razones son operativas:

- Atrapa errores antes de ejecutar (tipos estrictos).
- Hace explícitas las interfaces de los datos, lo que ayuda a mantener tipos consistentes entre frontend y backend.
- Funciona como documentación viva de qué campos y tipos hay en cada parte del sistema.

## Setup inicial de NestJS

### Instalación

```bash
# Instalar CLI global
npm i -g @nestjs/cli

# Crear proyecto
nest new dashboard-server
```

NestJS preguntará qué package manager usar. Selecciona `npm` (o el que uses) y dale Enter. La instalación tarda unos minutos e incluye dependencias, scaffolding, código boilerplate y TypeScript preconfigurado.

> [!note] Versiones
> En el momento de escribir el libro, NestJS va por la versión 9.2.0. La versión actual seguramente sea más alta; revisa la documentación oficial si necesitas features específicas.

### Antes de tocar nada: entender el scaffolding

Una vez creado el proyecto, **tómate un tiempo en leer el repo** antes de hacer cambios. Cosas concretas que mirar:

- El `package.json` para ver qué paquetes se usan.
- Los archivos de configuración (TypeScript, ESLint, Prettier) para entender cómo funciona el tooling.
- Los archivos de test: dan una idea rápida de la funcionalidad principal.
- Algo del código real para ver el estilo que esperan los autores.

### Arrancar la app

```bash
cd dashboard-server
npm start
```

Deberías ver un log como este:

```text
> dashboard-server@0.0.1 start
> nest start
[Nest] 20891  - 03/03/2023, 8:18:46 PM     LOG [NestFactory] Starting Nest application...
[Nest] 20891  - 03/03/2023, 8:18:46 PM     LOG [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 20891  - 03/03/2023, 8:18:46 PM     LOG [RoutesResolver] AppController {/}: +5ms
[Nest] 20891  - 03/03/2023, 8:18:46 PM     LOG [RouterExplorer] Mapped {/, GET} route +3ms
[Nest] 20891  - 03/03/2023, 8:18:46 PM     LOG [NestApplication] Nest application successfully started +1ms
```

### Entorno local consistente

Una de las primeras decisiones senior es **cómo va a ser el entorno de desarrollo local**. La opción estándar es **Docker**: puedes empaquetar desde la base de datos Postgres hasta el servidor de la app en uno o dos contenedores, y cualquier developer puede levantarlo idéntico en su máquina (Linux, macOS, Windows). Otra opción son los **Dev Containers de VS Code**, que montan un entorno reproducible dentro del editor.

> [!tip] Lo que sea, que sea consistente
> Lo importante es que todo el equipo use la misma configuración. Tener un dev en Mac con Postgres 14, otro en Linux con Postgres 15 y un tercero corriendo en Docker va a hacer que pierdas horas debugging diferencias de entorno que no tienen nada que ver con el código.

## Testear el backend localmente

Antes de tener UI, la forma estándar de probar endpoints es con **Postman** o **RapidAPI**. Postman tiene versión gratis y permite hacer requests con distintos headers, bodies y demás, viendo las respuestas exactas. Es como el "browser del backend".

```bash
# Arrancar el server
npm start

# En Postman, hacer GET a:
http://localhost:3000
# Deberías ver: Hello World!
```

> [!note] No te cases con la herramienta
> Postman, Insomnia, Bruno, curl con scripts... todas valen. Lo importante es que el equipo se ponga de acuerdo en una, para poder compartir colecciones de tests y usarlas como documentación viva para el frontend.

Las colecciones de tests de Postman pueden ser **documentación ejecutable** para el frontend: en lugar de escribir un .md con la forma de cada endpoint, el frontend puede importar la colección y ver exactamente qué devuelve cada llamada. Crea un ticket para que esto entre en un sprint.

## Actualizar el README

El README no tiene que ser un documento filosófico. Tiene que ser **lo mínimo para que un dev nuevo clone el repo y lo tenga funcionando**. Algo como esto:

```markdown
# Dashboard Server

## Description
Back-end to support customers built on [Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation
```bash
$ npm install
```

## Running the app
```bash
# development
$ npm run start
# watch mode
$ npm run start:dev
# production mode
$ npm run start:prod
```

## Test
```bash
# unit tests
$ npm run test
# e2e tests
$ npm run test:e2e
# test coverage
$ npm run test:cov
```
```

> [!note] El README es un documento vivo
> Todo el mundo debería sentirse cómodo actualizándolo como parte de sus PRs. Si añades una variable de entorno, un comando nuevo o un prerrequisito, actualiza el README en el mismo PR.

## Añadir un CHANGELOG

Un `CHANGELOG.md` lleva un registro de qué hay en cada release. Esto es oro cuando hay un problema en producción: puedes ver exactamente qué versión tenía qué cambios.

```markdown
# CHANGELOG

## Guide
- Major releases include breaking changes and the version number will be incremented like, `x.0.0`
- Minor releases include new features, but no breaking changes and the version number will be incremented like, `0.x.0`
- Patch releases include bug fixes and performance enhancements and the version number will be incremented like, `0.0.x`

### 0.0.1
- Initial release
```

> [!tip] Hook entre version bump y CHANGELOG
> Si usas Semantic Versioning, un buen hábito es **actualizar el CHANGELOG cada vez que bumpeas la versión en `package.json`**. Si lo haces manual, se te va a olvidar. Considera un git hook o un script que te lo recuerde.

### Convencional commits (opcional pero recomendado)

Una buena práctica complementaria es **forzar un formato en los mensajes de commit** con algo como `commitlint`. Mensajes del estilo:

```text
fix: update modal to send API call once
```

ayudan a generar el CHANGELOG automáticamente más adelante y dan contexto rápido de qué cambió.

## Monolito vs microservicios

La decisión arquitectónica grande. Se toma una sola vez (o casi) y condiciona años de desarrollo, así que vale la pena pensarla con calma.

### Monolito

**Definición:** toda la funcionalidad de backend en un único codebase, una base de datos, un servidor, desplegado como una sola unidad.

**Ventajas:**

- Todo el código en un sitio. Más fácil tener visión global del sistema.
- Infraestructura sencilla: despliegas una sola app.
- Debugging holístico: puedes trazar una request de punta a punta sin saltar entre servicios.

**Desventajas:**

- Un bug grave en producción puede tirar toda la app.
- Escalar es caro: si un endpoint recibe mucho tráfico, tienes que escalar el monolito entero.
- Cambios grandes cuestan más a medida que crece el código.

### Microservicios

**Definición:** la lógica de negocio se divide en chunks por funcionalidad, cada uno con su propio codebase, base de datos y servidor.

**Ventajas:**

- Escalar servicios individuales según demanda.
- Cada servicio puede usar el lenguaje y framework que mejor le venga (Rust para concurrencia, Python para ML, TypeScript para el resto).
- Despliegues independientes, fallos aislados.

**Desventajas:**

- Debugging es más complejo: hay que seguir el rastro a través de varios servicios.
- Integridad de datos: si varios microservicios referencian los mismos datos, hay que coordinarlo bien.
- Más infraestructura que mantener (más repos, más pipelines, más monitoring).

### Alternativas a considerar

- **Serverless:** puedes usar funciones lambda para partes muy específicas sin tener que mantener un servidor. Cuidado con los costes del cloud provider, que pueden dispararse rápido.
- **SOA (Service-Oriented Architecture):** precursor de los microservicios. La diferencia principal es que comparten la misma base de datos. Sigue siendo válido para apps que se quieren modularizar sin la complejidad operativa de microservicios.
- **Service meshes:** capa de infraestructura que gestiona la comunicación entre servicios. Vale la pena aprender sobre ellos si vas por microservicios, pero el libro no entra en detalle.

> [!warning] Cambiar de arquitectura es caro
> Cualquiera de estas decisiones marca el desarrollo futuro del proyecto. Cambiar de monolito a microservicios (o al revés) no es un refactor trivial: afecta a datos, despliegues, monitoring, contratación, onboarding. Tómate el tiempo necesario y busca feedback de los demás developers antes de decidir.

## REST vs GraphQL

Otra decisión grande que se toma al principio: cómo van a hablar el frontend y el backend.

### Diferencia fundamental

| | REST | GraphQL |
|---|---|---|
| Endpoints | Uno por recurso | Uno solo, con queries/mutations |
| Forma de pedir datos | URL + método HTTP + body | Query con los campos exactos |
| Lo que devuelve | Todo lo que el endpoint expone | Solo lo que el cliente pidió |
| Subscriptions | WebSockets aparte | Built-in |

### Cuándo GraphQL brilla

GraphQL permite pedir **exactamente los campos que necesitas** y nada más. Esto es especialmente útil en sistemas con datos muy relacionados donde cada vista pide un subset distinto:

```graphql
query {
  order(id: 'fejiw-f4wt301-4tfw2g-g4t24') {
    name
    products {
      name
      price
    }
  }
}
```

REST devolvería el order entero con todos los productos, las direcciones, los pagos, etc. GraphQL solo lo que pediste.

### Cuándo REST es suficiente

REST es el estándar y para la mayoría de apps es más que suficiente. Si tu API tiene un número manejable de recursos y los clientes no necesitan combinaciones exóticas de datos, REST es más fácil de razonar, de cachear y de debuggear.

> [!tip] GraphQL es una evolución, no un reemplazo
> El libro describe GraphQL como "el siguiente paso después de REST", parecido a cómo TypeScript evolucionó sobre JavaScript. No es que REST esté mal; es que GraphQL cubre un conjunto de problemas que REST no cubre tan elegantemente. Si tu proyecto no tiene esos problemas, quédate con REST.

El libro no entra en profundidad en GraphQL, pero es importante saber que la opción existe y es mainstream en la industria.

## Próximos pasos

- [[03-esquema-de-datos|Esquema de datos]]: diagrama de tablas, montar Postgres, elegir ORM (Prisma en este caso), escribir migraciones y seed.
