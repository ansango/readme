---
title: "Pipeline CI/CD: creación"
description: "Stages (build, test, deploy), Git hooks (commit-msg, pre-push), GitHub branch protection, CircleCI como ejemplo, Snyk y Cypress orbs, config.yml"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, devops, ci-cd, circleci, github-actions, git-hooks]
---

# Pipeline CI/CD: creación

> [!abstract] Resumen
> Esta nota cubre la construcción de un pipeline CI/CD desde cero: stages principales (build, test, deploy), optimización de velocidad, Git hooks (commit-msg para conventional commits, pre-commit y pre-push para quality checks), configuraciones de GitHub para proteger branches, y un ejemplo concreto con CircleCI que define jobs (unit-test, security-scan, integration-test, build) y workflows. El objetivo es deployments automatizados, consistentes y rápidos con buena calidad.

## Por qué automatizar deployments

Una vez tienes la app integrada, quieres **automatizar los deployments** para que sean consistentes cada vez. Un CI/CD pipeline (Continuous Integration / Continuous Deployment) es el estándar en cualquier organización seria.

Tu contribución como dev: **entender cómo funciona la app** y cómo debería correr. Así puedes ayudar a configurar env vars, runtime versions, y los comandos correctos para llevar la app a un estado deployable.

> [!tip] Partner con DevOps
> Esta área cruza mucho con DevOps. **No tienes que ser experto aquí**, pero sí entender lo suficiente para mantener al equipo unblocked. Puedes profundizar más o quedarte con el overview según tu rol.

## Stages y steps

Un pipeline tiene **stages** (metas) y **steps** (comandos individuales):

- **Step**: un comando individual (create a build, invalidate a cache).
- **Stage**: agrupa steps para una meta (run tests, deploy artifact).

### Mínimo viable

- **Build stage**: spin up environment, prepare env vars, checkout code, install packages, run build.
- **Test stage**: code-quality, unit, integration, security tests, report results.
- **Deploy stage**: setup secrets, upload artifact, move to server, reset cache, send notification.

## Velocidad del pipeline

He visto pipelines que tardan más de una hora. **Eso frena al equipo brutalmente**. Stages pueden partirse y correr en paralelo para acelerar.

> [!tip] Fail fast
> Una señal de buen pipeline: **fallar lo antes posible**. Si un test falla, quieres saberlo en el primer stage, no después de 45 minutos. Configura stages para que los chequeos más rápidos y universales corran primero.

### PRs como feedback temprano

Correr build y test stages **en PRs abiertos** (incluso drafts) da feedback antes de review. Si algo está roto, el dev lo arregla antes de que nadie tenga que invertir tiempo revisando. Los Git hooks llevan esto aún más temprano, al commit-time.

## Git hooks

Ya tienes pre-commit y pre-push (linting, formatting, tests). Puedes añadir más:

### commit-msg hook

Verifica el formato de los mensajes de commit (conventional commits). Crea `.husky/commit-msg`:

```bash
#!/usr/bin/env bash
. "$(dirname -- "$0")/_/husky.sh"
commit_types="(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test|wip)"
conventional_commit_regex="^${commit_types}(\([a-z \-]+\))?!?: .+$"
commit_message=$(cat "$1")
if [[ "$commit_message" =~ $conventional_commit_regex ]]; then
  exit 0
fi
echo "The commit message does not meet commit standards"
echo "An example of a valid message is: "
echo "  feat: update modal fields"
exit 1
```

> [!warning] Hooks pueden ser contraproducentes
> Si los pre-commit/pre-push son muy estrictos, devs pueden **comentarlos** para salir del paso, y entonces tienes código de baja calidad pasando al shared branch. **Sé selectivo con lo que ejecutas en hooks**.

### pre-push hook

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npm test
```

> [!tip] Husky o Git puro
> No necesitas Husky para Git hooks. **Puedes ir al directorio `.git/hooks` del proyecto** y ver ejemplos de todos los hooks disponibles. Renombra el `.sample` para activarlos. Husky solo facilita la configuración.

## GitHub configs

Una vez tienes checks en local, el siguiente nivel es **GitHub PRs**.

### Branch protection

- **Restringe pushes directos a main y develop**.
- **Restringe qué branches pueden borrarse** y por quién.
- Settings del repo → Branch protection rules.

### PR rules

- **Al menos 1 aprobación** antes de merge a develop.
- **Bloquea PRs directos a main** (solo vía release process).
- **Run pipeline checks en PRs** (tests + build) — cazo issues antes de merge.

> [!warning] Hotfixes
> En hotfixes, puede ser necesario **deshabilitar temporalmente la regla de protección** para meter un fix rápido. Tenerlo en cuenta.

## CircleCI como ejemplo

Hay muchos CI/CD tools: **Jenkins, CircleCI, Bamboo, GitHub Actions, TeamCity**. CircleCI es fácil de configurar e integra bien con GitHub.

Setup inicial:

1. Crea cuenta en CircleCI.
2. Conecta con el repo de GitHub.
3. Elige la branch y la opción "Fastest".
4. Se crea `.circleci/config.yml` con un config inicial.

### config.yml básico

```yaml
version: 2.1
orbs:
  node: circleci/node@5.1.1
  cypress: cypress-io/cypress@3
  snyk: snyk/snyk@2.1.0
jobs:
  unit-test:
    docker:
      - image: 'cimg/base:stable'
    steps:
      - checkout
      - node/install:
          node-version: '21.2'
      - node/install-packages
      - run:
          command: npm run lint
      - run:
          command: npm run test
  security-scan:
    docker:
      - image: 'cimg/base:stable'
    steps:
      - checkout
      - node/install:
          node-version: '21.2'
      - node/install-packages
      - snyk/scan
  integration-test:
    docker:
      - image: 'cimg/base:stable'
    steps:
      - checkout
      - node/install:
          node-version: '21.2'
      - node/install-packages
      - snyk/scan
  build:
    docker:
      - image: 'cimg/base:stable'
    steps:
      - checkout
      - node/install:
          node-version: '21.2'
      - node/install-packages
      - run:
          command: npm run build
workflows:
  build-and-tests:
    jobs:
      - build
      - unit-test:
          requires:
            - build
      - security-scan:
          requires:
            - unit-test
  integration-test:
    jobs:
      - cypress/run:
          start-command: npm run start
```

### Secciones del config

- **version**: qué versión de CircleCI usas (define qué keys tienes disponibles).
- **orbs**: paquetes compartidos con jobs y commands preconfigurados (Cypress, Snyk).
- **jobs**: steps que quieres correr en cada stage.
- **workflows**: orden de jobs y dependencias.

> [!tip] Un stage a la vez
> Construye el pipeline **un stage a la vez**. Asegúrate de que cada uno funciona antes de añadir el siguiente. Ahorra tiempo debuggeando configs.

## Medición y mejora

Una vez el pipeline está en su sitio, **mide cuánto tarda cada workflow y job**. Esa información te dice dónde optimizar. Si unit tests tardan 20 min, vale la pena investigar por qué.

## Próximos pasos

- [[29-pipeline-ci-cd-entornos|Pipeline CI/CD: entornos]]: feature, development, staging, production y gestión de env vars por entorno.
