---
title: "Git management"
description: "Branching strategies (main, staging, develop, feature), PR reviews, squashing commits, rebase vs merge, merge conflicts, git bisect, comunicación en conflictos"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, git, branching, pr-review, rebase, merge-conflicts]
---

# Git management

> [!abstract] Resumen
> Esta nota cubre el dominio de Git a nivel senior: branching strategies (main/staging/develop + feature branches), PR reviews efectivos, cuándo squashear commits vs cuándo no, rebase vs merge (cuándo usar cada uno), cómo manejar merge conflicts de forma colaborativa, y `git bisect` como herramienta para encontrar el commit que introdujo un bug. El objetivo es tener un historial limpio, merges sin dolor, y un equipo que sabe cómo trabajar con Git sin pisarse.

## Branching strategies

Lo primero es definir **qué branches existen y qué rol juega cada una**. Las decisiones se basan en:

- Cambios en archivos solapados.
- Updates de package versions.
- Tamaño de features.
- Cuándo se supone que se release una feature.
- Cambios app-wide.

### Common branches

- **main**: source of truth de lo que ven los usuarios. Conectado a production.
- **staging**: cambios listos para release, en pre-production testing.
- **develop**: features aprobadas por el dev team, en validación más profunda.

> [!tip] main es la source of truth
> Si alguien pregunta "¿qué features están disponibles o cuáles son los cambios correctos?", main es la respuesta. **Trata main y staging con cuidado**: bloquea pushes directos salvo en hotfixes.

### Flujo típico

```
PRs a develop → Dev team checks → develop a staging → QA + Product approval → staging a main → production deploy
```

### PRs son GitHub, no Git

Aclaración: las "Pull Requests" son feature de GitHub. **GitLab usa "Merge Requests"**. Puedes hacer merge con Git puro sin PRs nunca.

## PR reviews

Razones:

- Asegurar calidad en shared branches.
- Cazar bugs obvios antes de producción.
- Compartir y difundir conocimiento.
- Fomentar comunicación y colaboración.

**No critiques personas, critica código**. No tienes el mismo contexto que el autor.

### Checklist de PR review

- Al menos 1 aprobación de otro dev.
- Unit tests pasan, build exitoso en main y staging.
- Cumple convenciones del equipo.
- Pull down el branch, app corre localmente.
- Funcionalidad funciona como esperado.
- Cambios entendidos línea por línea.
- Si no entiendes algo, pregunta.
- No impongas tu estilo personal.
- Cuidado con conditions y llamadas a third-party services.
- Data se envía y devuelve como esperado.

## Branches para funcionalidad pequeña

Cada branch se asocia a un ticket, especialmente con bug fixes. **Pull de develop cada día** (o más) para evitar conflictos al mergear.

- Commits pequeños cuando sea posible.
- **Squash al mergear a develop** (un commit por ticket/feature).

> [!warning] Stale branches
> Un branch "stale" es uno que lleva tanto tiempo que develop ha cambiado mucho después de su aprobación. **Mergear rápido** después de aprobación. Small, quick merges mitigan conflictos.

## Feature branches para implementaciones grandes

Features grandes que cambian funcionalidad significativa pueden aislarse en **feature branches**. Cada ticket individual del feature tiene su propio branch basado en el feature branch.

```
develop
  └── feature/onboarding
        ├── task/sign-up-form
        ├── task/welcome-email
        └── task/profile-setup
```

Ventajas:

- Otros devs pueden mergear cambios pequeños a develop sin bloqueo.
- Reviews más pequeñas y manejables.
- Testing aislado de la feature.

> [!tip] Feature flags vs feature branches
> Si la feature es pequeña pero high-impact, feature flags. Si es grande y necesita múltiples partes, feature branch. **Puedes combinarlos** para rollout granular.

## Squashing commits

Al mergear branches individuales a develop, **squash** los commits. Un commit por ticket/feature con mensaje que resume los cambios. Reduce ruido en el historial.

**No squashear merges a staging o main**. Si squash, pierdes la historia de qué features se están testeando o deploying. Cuando hay un bug, **quieres ver los commits por separado** para entender qué lo introdujo.

## Rebase vs merge

### Rebase

Mueve el inicio del historial del feature branch al final del source branch (develop). Resultado: **historial lineal, más limpio**.

```bash
# En tu feature branch
git rebase develop
```

**Cuándo usar**: en feature branches individuales, para mantenerlas actualizadas con develop.

> [!warning] Nunca rebase shared branches
> Rebase reescribe historial. Si rebasas develop o main, **rompes commits que otros devs ya tienen**. Solo rebasea feature branches privadas.

### Merge

Añade los cambios de develop al final de tu feature branch con un merge commit. Historial más cluttered pero preserva los hashes.

```bash
# En tu feature branch
git merge develop
```

**Cuándo usar**: para merges a shared branches.

### Comparativa

| | Rebase | Merge |
|---|---|---|
| Historial | Lineal, menos cluttered | Cluttered con merge commits |
| Resolución de conflictos | Multi-step | Single-step |
| Shared branches | No recomendado | Bueno |
| Hashes | Reescritos | Preservados |

### Flujo recomendado

1. **Feature branch individual**: rebase con develop para mantener actualizada.
2. **Feature branch → develop**: merge (con squash).
3. **develop → staging**: merge.
4. **staging → main**: merge.

> [!tip] Higiene: borra branches mergeados
> Después de mergear, **borra el branch**. Quita ruido del repo. Los cambios ya están en shared branches y registrados en el PR.

## Merge conflicts

Aparecerán. **La forma de manejarlos importa más que evitarlos**.

### Habla con el dev que hizo los cambios

El dev con el branch conflictuado es quien mejor conoce qué cambios son correctos. **Anímales a resolver sus propios conflictos** primero. Si están atascados, screen-sharing call para resolver juntos.

> [!tip] Mantén branches actualizadas
> Conflictos son más pequeños y manejables cuando las branches se actualizan frecuentemente. Si una feature branch está muy desincronizada con develop, **pide al dev abrir un nuevo branch** con los últimos cambios y re-aplicar el feature code.

### `git bisect` para encontrar el bug

Cuando un merge conflict es difícil de rastrear, **usa `git bisect`** para encontrar el commit problemático. Hace búsqueda binaria en el historial.

```bash
# Inicia el bisect
git bisect start

# Marca un commit bueno (anterior al problema)
git bisect good b29cafce7

# Marca un commit malo (posterior al problema)
git bisect bad f0dd190b8

# Git hace checkout a un commit intermedio
# Examinas los archivos
git bisect bad  # si el commit actual tiene el bug
git bisect good  # si el commit actual no tiene el bug

# Repite hasta encontrar el commit problemático
# Git te da el hash del primer bad commit
git bisect reset  # salir cuando termines
```

> [!tip] `git bisect` ahorra horas
> Hacerlo manualmente revisando commit por commit es tedioso y propenso a errores. `git bisect` automatiza la búsqueda binaria y **puede ahorrarte horas** de debugging.

### Comparación manual de archivos

A veces los conflictos son tan grandes y complicados que las herramientas automáticas no ayudan. **Crea un branch separado**, copia y pega código de varios branches. Si el conflicto tiene más de 5 líneas en un solo archivo, **evalúa opciones** para resolver.

Después de resolver conflictos complejos, **corre el app localmente**. Los tests existentes te ayudan a cazar runtime issues inesperados. **Trae a los devs que trabajaron en las features** para validación final.

## Próximos pasos

- [[31-gestion-de-proyectos|Gestión de proyectos]]: sprint discussions, estimaciones, dev capacity, tickets, comunicación con Producto.
