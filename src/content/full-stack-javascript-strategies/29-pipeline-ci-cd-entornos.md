---
title: "Pipeline CI/CD: entornos"
description: "Feature, development, staging, production: propósitos, env vars por entorno, deploy-dev/staging/prod jobs en CircleCI, .env separados"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, devops, ci-cd, environments, env-vars, feature-flags]
---

# Pipeline CI/CD: entornos

> [!abstract] Resumen
> Esta nota cubre los cuatro entornos principales del pipeline (feature, development, staging, production), qué hace cada uno, cómo se gestionan las env vars por entorno (con CircleCI, con archivos .env separados), y cómo el deploy workflow conecta cada branch con su entorno correspondiente. El objetivo es tener un pipeline donde el código pasa por entornos con propósitos claros antes de llegar a usuarios reales.

## Los cuatro entornos

### Feature environment

Para **cambios grandes en el frontend** que necesitan testearse antes de mergear al resto del código. Cuando refactorizas una pieza sustancial de la app, feature environment es el sitio para verificar que no rompes todo.

Mantiene al resto del equipo unblocked: pueden mergear cambios más pequeños a develop sin pisar el feature work.

### Development environment

Donde el dev team hace **deploys preliminares** para ver cómo sus cambios funcionan con el sistema completo. Deploys ad hoc mientras el equipo se coordina. QA puede entrar para tests rápidos o demos.

Frontend y backend están conectados aquí. Los feature environments del frontend suelen apuntar al backend de development. **Buen sitio para verificar feature flags** antes de promover.

### Staging environment

Donde verificas que los cambios funcionan antes de release. **QA hace feature y regression testing**. Producto y Diseño pueden hacer user acceptance testing. Frontend y backend sincronizados, conectados a third-party services con **test credentials**. Lo más parecido a producción.

### Production environment

Donde los usuarios usan la app. **Los mejores server resources**. Env vars apuntan a third-party services y cloud services de producción. Es donde se nota la calidad de todo el testing previo.

## Env vars por entorno

Cada entorno tiene su propio set de env vars. El infra de development es típicamente separado del de producción (distintas databases, distintos event managers, etc.).

### Configurar env vars en CircleCI

En Project Settings, define variables para cada entorno. Después referencia esas variables en `config.yml`. Cualquier parte del app que use esa env var toma el valor configurado.

```yaml
deploy-dev:
  docker:
    - image: 'cimg/base:stable'
  steps:
    - checkout
    - run:
        name: 'dev env vars'
        command: |
          echo $API_URL

deploy-staging:
  docker:
    - image: 'cimg/base:stable'
  steps:
    - checkout
    - run:
        name: 'staging env vars'
        command: |
          echo $API_URL

deploy-prod:
  docker:
    - image: 'cimg/base:stable'
  steps:
    - checkout
    - run:
        name: 'prod env vars'
        command: |
          echo $API_URL

deploy:
  jobs:
    - deploy-dev:
        filters:
          branches:
            only: develop
    - deploy-staging:
        filters:
          branches:
            only: staging
    - deploy-prod:
        requires:
          - build-and-tests
        filters:
          branches:
            only: main
```

> [!tip] Build and tests required para producción
> En el ejemplo, el `deploy-prod` requiere que `build-and-tests` haya pasado primero. **No skipees los tests en producción** aunque el deploy sea urgente. El ejemplo se salta esa verificación para dev/staging, pero tú deberías tenerlo en tu pipeline real.

### Alternativa: .env files separados

Puedes tener un `.env.dev`, `.env.staging`, `.env.prod` y un script que cargue el correcto según el entorno.

> [!warning] Riesgo de .env files
> Si no están en un private repo o script seguro, **todo el mundo tiene acceso a credenciales de producción**. Las env vars son best practice porque no hay persistent record fuera del cloud provider. Si usas archivos, asegúrate de que están protegidos.

> [!tip] Por qué env vars son seguras
> No hay persistent record de env vars en ningún sitio excepto el cloud provider con su secure infrastructure. Cuando se cargan, están en memoria y no persisten fuera de ella. Cualquier otro mecanismo tiene más riesgo de exposición.

## Flujo de deployments

```
develop branch ──> development env (deploy-dev)
       │
       ▼
staging branch ──> staging env (deploy-staging)
       │
       ▼
main branch ──> production env (deploy-prod, requires build-and-tests)
```

Conectar branches a entornos específicos hace que el flujo sea predecible. **El código pasa por environments de menor a mayor criticidad** antes de llegar a producción.

## Lo que falta

Con los deploy jobs configurados, **todo lo que queda es conectar con los servicios e infraestructura reales**, y eso es trabajo de DevOps. Tú aportas:

- Conocimiento del código y dependencias.
- Runtime versions correctas.
- Build commands precisos.
- Env vars que la app necesita.
- Tests que validan el comportamiento.

## Próximos pasos

- [[30-git-management|Git management]]: branching strategies, PR reviews, squashing, rebase vs merge, merge conflicts, `git bisect`.
