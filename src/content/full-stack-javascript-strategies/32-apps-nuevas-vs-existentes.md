---
title: "Apps nuevas vs existentes"
description: "Checklist para greenfield (problema, schema, arquitectura, cloud, backend, frontend, integración, CI/CD, QA, producción) y consideraciones para legacy apps"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, greenfield, legacy, career, project-management]
---

# Apps nuevas vs existentes

> [!abstract] Resumen
> Esta nota cubre las dos realidades del trabajo de dev: construir un producto desde cero (greenfield) y entrar a un codebase existente (legacy). Para greenfield hay un checklist ligero que cubre las decisiones clave (problema, schema, arquitectura, cloud, backend, frontend, integración, CI/CD, QA, producción). Para legacy apps hay un flujo de onboarding técnico: acceso a servicios, dev instance, leer el código, refactors potenciales, preguntas y tests. El objetivo es estar preparado para ambos contextos a lo largo de tu carrera.

## Apps nuevas (greenfield)

Un proyecto greenfield es **tu oportunidad de hacerlo bien desde el principio**. Vas a tomar decisiones que determinarán la mantenibilidad futura del codebase. Aunque vas a poder refactorizar y cambiar componentes en el futuro, una base bien definida hace que esos cambios sean smoother.

> [!tip] Tu propio checklist
> A lo largo de tu carrera, **desarrolla tu propio checklist** para greenfield apps. Es uno de los artefactos más valiosos que llevas de trabajo en trabajo. El siguiente es un ejemplo para empezar.

### Checklist ligero para greenfield full stack

#### 1. Entender el problema

Antes de crear un repo, **entiende qué problema resuelve el software**. Numerosas calls con Producto y senior leadership. Habla con business colleagues de alto nivel sobre el dominio, debilidades del software, y planes para cómo el producto satisface una necesidad del dominio. Cuando hables con Producto, tendrás mejor entendimiento del roadmap.

Crea un **Software Bill of Materials (SBOM)** para trackear qué tools resuelven qué problemas técnicos, sus implicaciones de seguridad, y cómo integran entre sí. Herramientas como **AuditJS** generan SBOMs rápidos con todas las dependencies, versiones, y vulnerabilidades conocidas.

#### 2. Construir el data schema

Decidir cómo modelar datos afecta las tools y el crecimiento futuro. Cosas estándar a incluir en el schema (SQL o NoSQL):

- `createdAt` date.
- `updatedAt` date.
- User ID de quién hizo el update.

Mantén **expandability** en mente: el schema escalará y puede integrarse con data warehouses o pipelines. Naming conventions claras.

Usa tools como **dbdiagram.io** o **Miro** para organizar y presentar ideas.

#### 3. Decidir arquitectura

El sistema architecture es **una decisión enorme** porque el dev team se va a quedar locked-in. Elige algo simple pero flexible para empezar. Opciones: backend monolith, microservices, frontend monolith, micro frontends. Cualquier combinación.

> [!warning] Incident real
> Un incidente grande y muy público pasó cuando los teams que trabajaban en el formulario FAFSA **no hicieron estos checks**. Hay un límite a lo que puedes desarrollar en aislamiento, y aún así deberías estar hablando con otros teams.

#### 4. Elegir cloud provider

Tu cloud provider determina todo: servicios disponibles, bill mensual. **Análisis de costes** para 3-4 providers, comparando según servicios necesarios. Considera skills del dev team y skills que estarían interesados en desarrollar. Trae security a la evaluación, especialmente en dominios regulados.

#### 5. Construir el backend

Implementa la arquitectura diseñada. Elige tools para hacer development smoother. **Scaffolding con boilerplate** (folders, file structures) basado en tu arquitectura y schema. Conecta la app a la database y crea el seed script. **Escribe uno o dos endpoints** para tener algo que testear.

#### 6. Construir el frontend

Implementa arquitectura del frontend. Si decidiste monolithic frontend, **estructura de carpetas** que organice components, utility methods, API calls. Si micro-frontend, **repos separados** que serán los componentes del frontend global.

Crea un main container component y un smaller component para testear cómo corre la app. **API request desde el smaller component** para verificar conexión con backend.

#### 7. Integrar backend y frontend

Después de los checks iniciales, **empieza a añadir más features**. Aún con todo el planning, aparecerán issues de conexión: API sin permisos habilitados, nombres y tipos no matching, CORS issues. Este es el momento donde verás áreas de ambos lados que necesitan refactor.

**Actualiza el architecture diagram** según encuentres áreas complejas y nuevas relaciones.

#### 8. Set up CI/CD pipeline

Set up environments donde deployar frontend y backend, dónde almacenar secrets y credentials. **Trabaja con DevOps**, pero tú verificas que el app se deploya y funciona. Chequea qué endpoints se llaman, haz data checks, verifica cloud services.

#### 9. QA testing

Trabaja con QA para testear la app completamente. **Escribe test cases** que cubran funcionalidad requerida y edge cases encontrados. **Producto para demos** y user acceptance testing. **Discute automated testing** como tarea compartida entre QA y dev team.

Si no hay QA dedicated, haz testing basado en feature specs y designs. Chequea cómo funciona el app en distintos browsers, con distintas velocidades de red, y con múltiples tipos de users. Fuerza al app a tirar errores y mira cómo los maneja.

#### 10. Check en producción

El primer deploy a producción siempre tiene cosas que ajustar. **Configs o recursos** que necesitan actualizarse para el load. Roles de user que solo están en otros environments. **Seguridad**: network responses para ver si hay PII leaked. ¿Puedes forzar acceso a recursos protegidos?

**Test accounts y test users** en producción para no usar data real. **Verifica logs y alerts**.

## Apps existentes (legacy)

Los legacy apps son **codebases que existían antes de que llegaras**. Constituyen la mayoría del trabajo. No todo team tiene documentation adecuada o buen entendimiento del problema. **Tú puedes traer ideas frescas** a algo con lo que todos están familiarizados de trabajar alrededor.

### Get access a los servicios que necesitas

Cualquier app existente ya está conectada a servicios. **Pide acceso a todo al inicio**: cloud platform, logging, storage, monitoring, third-party services (Stripe, Twilio, etc.). Si no existen docs de cómo conectarse, **actualiza los onboarding docs**.

### Get a dev instance running

Una de las primeras cosas que harás. **Herramientas a instalar, servicios a configurar, quirks que necesitas saber**. Pull del code, install packages, intenta correr la app. Llega tan lejos como puedas con la docs, **luego pide ayuda al team**. Actualiza o crea docs que te habrían ayudado.

### Look at the app in production

La mejor forma de aprender qué hace el app es **usarla en producción**. Con test credentials. Recorre todas las features. Pregunta a Producto sobre el producto. **Toma un tour** rápido para encontrar si tienes permission para acceder a la funcionalidad que necesitarás debuggear.

### Look at the app en non-production

Asegúrate de tener acceso al developer view (staging, develop). **Otro checkpoint** para verificar user roles correctos. Pide a otro dev que te haga walkthrough de los environments y release process. Toma notas: pasos para cambiar entre environments, tickets pequeños que puedas terminar rápido para verificar tus cambios.

### Read through the code

Entender folder structure y arquitectura del codebase. **Trabaja backward desde algo que viste en la UI** para guiarte desde frontend hasta database e infrastructure. Hazlo con varias features para tener un tour estructurado. **Reverse engineer features** para aprender implementation y patterns.

### Take notes about potential refactors

A medida que te familiarices, verás áreas que implementarías distinto. **Pregunta al team por qué** se implementó así. Podría haber razones fuertes. Después de tener contexto, haz sugerencias basadas en performance, DX, security.

### Ask questions and document the answers

Si tienes hard time entendiendo algo, **no eres el único**. Empieza un doc con las answers. **Documentación** alrededor de las partes unclear del app es lo más valioso que puedes hacer por un legacy app. **Technical docs, product docs, todo**.

### Improve code quality

DRY out repetition, crea shared utility functions y components. **Pregunta al team sobre patterns** y por qué se eligieron. **Busca simplificación** de files y folder structures. **Incremental**, no intentes reescribir todo.

> [!quote] Ethan Brown sobre DRY
> Solía ser proponente entusiasta de DRY, pero he moderado mi advocacy. He encontrado que DRY tiene downsides que pueden ser grandes:
>
> 1. Capas de abstracción que reducen código a costa de claridad: terminas con código que aparentemente hace algo simple pero tienes que saltar media docena de funciones para entender qué pasa realmente.
> 2. Tiempo y esfuerzo creando abstracciones hermosas que no se pagan: pasas mucho tiempo abstrayendo algo que se hace un puñado de veces.
> 3. No observar patterns el tiempo suficiente para entender la abstracción más apropiada.
>
> Aún pienso que DRY es útil, pero prefiero presentarlo con más nuance.

### Add tests

Algunos legacy apps no tienen test coverage como prioridad. **Cuando trabajes en features nuevas o refactors, añade test cases**. Si coverage es bajo, lidera al equipo a aumentarlo gradualmente. Escribir tests para código existente es una gran forma de aprender cómo se supone que funciona el software.

### Learn what different alerts mean

Cuando recibas alerts de error, **tómate tiempo para entender** cómo funciona el alerting del team, dónde vienen los errores, y dónde se comparten. Acceso a logging tools y servers. **Haz pair con otro dev** para aprender cómo llegan al root cause.

## Próximos pasos

- [[33-carrera-y-desarrollo-profesional|Carrera y desarrollo profesional]]: technical path (architect, staff engineer, tech lead), management path (engineering manager), professional journal, moverte a otras áreas.
