---
title: "Estrategias de despliegue"
description: "Despliegues de solo frontend o solo backend, release dates y versionado semántico, blue-green deploys, canary deploys con feature flags, rollbacks y hotfixes"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, devops, deployment, blue-green, canary, rollback, semver]
---

# Estrategias de despliegue

> [!abstract] Resumen
> Esta nota cubre las decisiones estratégicas alrededor de los despliegues: cuándo deployar solo frontend o solo backend, cómo coordinar release dates con Producto, versionado semántico y graceful degradation, blue-green deploys para zero-downtime, canary deploys con feature flags para rollouts progresivos, y las distintas estrategias de rollback (redeploy de versión anterior, revert/reset de PRs, hotfix roll-forward). El foco está en encontrar el balance entre velocidad de release y riesgo para los usuarios.

## Despliegues de frontend o backend

Es habitual que **backend y frontend release en schedules distintos**. No todos los cambios requieren deployar ambos. Lo importante es cómo las partes del stack se afectan entre sí y los servicios externos.

### Cambios en backend

Cuando trabajas en features del backend, mira el impacto:

- **Data que el frontend espera**: ¿cambia? → breaking change, requiere coordinación.
- **Data enviada a servicios externos**: ¿cambia? Refactor o update del servicio.
- **Jobs y herramientas de infra**: ¿se ven afectados? Unit e integration tests cazan regresiones, pero a veces se cuelan.
- **Database**: ¿cambian tablas, columnas, queries?

El backend toca más piezas que el frontend; documentación y diagramas de arquitectura son críticos.

### Cambios en frontend

El frontend suele ser más seguro de deployar independientemente. **Lo que hay que vigilar**:

- ¿El backend y otros servicios están listos para el cambio que viene?
- ¿Deployas el frontend antes que el backend? Riesgo de romper parte de la app.
- **Overlaps con otros devs**: si varios trabajan en los mismos archivos, funcionalidad o designs pueden sobreescribirse.
- **Shared components**: actualizarlos puede romper layouts en otras partes. Revisa todas las referencias.

> [!tip] Versiona frontend y backend por separado
> El backend puede ir en `2.0.0` mientras el frontend va en `1.0.0`. Los version numbers van en `package.json` de cada proyecto. **Especifica qué versión del backend espera el frontend** para evitar incompatibilidades.

## Release dates con Producto

Producto negocia release dates con stakeholders. Cuando te las traen:

- **Pide diseños y specs** detallados antes de comprometerte.
- **Discútelas con el equipo** para identificar issues técnicos.
- **Push back si falta info** — comprometerte sin detalles lleva a crunch time.
- **Trabaja con un dev deadline interno** que solo el equipo conoce. El release date es cuando Producto necesita en producción; el código tiene que estar merged, tested, sin bugs antes.

> [!warning] Reputación del equipo
> Tu trabajo también es **proteger la reputación del equipo**. No quieres ser "el equipo que siempre llega tarde o rompe cosas". A veces eso significa push back en fechas irreales o ser muy estricto con la calidad de los PRs.

### Continuous release cycle

El ideal: **cambios pequeños que van a producción tan rápido como QA los valide**. Eso evita grandes releases con muchos cambios a la vez. Tamaño de la organización afecta el ritmo:

- **Enterprise**: 3-4 production releases al año. Legal, DevOps, security, etc. involucrados.
- **Mid-size / startup**: releases cada pocos días o semanas.
- **Scaling**: a medida que crece, hasta las startups acaban espaciando releases.

### Freeze periods

Algunas industrias (advertising, finance) tienen **freeze periods** alrededor de holidays donde no se release a producción. Buen momento para **atacar tech debt** sin feature work compitiendo.

## Versionado semántico

Especialmente importante en el backend donde los API changes pueden romper más que el frontend.

**Semantic versioning** (semver) usa tres números: `MAJOR.MINOR.PATCH`.

- `MAJOR`: breaking changes.
- `MINOR`: nuevas features, backwards-compatible.
- `PATCH`: bug fixes.

> [!warning] Semver se sigue "loosely"
> He visto equipos ir por `v0.193.36` sin pasar nunca por `v1.0.0`. Sigue semver tan estrictamente como puedas, especialmente con el CHANGELOG para que otros puedan debuggear sus apps.

Herramientas para automatizar:

- **release-please**, **commit-and-tag-version**, **release-it**: automatizan el version bump según conventional commits.
- `npm version`: actualiza `package.json` y `package-lock.json`.
- **Git tags**: artifacts por versión de la app.

### Versionado en el frontend

En el frontend, el versionado es útil para **debugging de deployments fallidos silenciosos**. Muestra la versión en un componente siempre visible (navbar, footer):

> [!tip] Versión visible siempre
> El usuario no necesita verla normalmente, pero tiene que ser fácil de encontrar si contacta a Soporte. Visible tanto logged-in como logged-out.

Frontend no suele usar **graceful degradation** (debería haber una sola versión de la UI). Pero versionar ayuda a detectar deployments que no llegaron al servidor.

## Blue-green deploys

Cuando tu app recibe mucho tráfico y no puedes permitirte downtime: **dos environments idénticos** (blue y green), uno con la versión actual, otro con la nueva.

```
Traffic ──>  Blue (v1)        Green (v2) [10% traffic]
            ↑
        (90% traffic)
```

**Proceso**:

1. Despliega la nueva versión en green.
2. Mueve 10% del tráfico a green.
3. Monitorea error rates, performance, resource usage.
4. Si todo va bien, sube gradualmente: 25%, 50%, 100%.
5. Blue queda on standby por si necesitas rollback.
6. Una vez green está estable, apaga blue.

### Ventajas

- **Zero downtime** para los usuarios.
- **A/B testing** fácil entre las dos versiones.
- **Test in production**: el equipo puede hacer testing last-minute con tráfico real bajo control.
- **Rollback instantáneo** moviendo el tráfico de vuelta.

### Desventajas

- **Setup costoso**: dos production environments con todos los recursos.
- **Sincronización de data** entre entornos puede ser difícil (schema changes, etc.).
- **Containerización** ayuda a mantener consistencia.
- **Licencias de terceros**: revisa si las cuentas permiten uso desde diferentes environments.
- **DNS cache**: registros stale pueden apuntar el frontend blue al backend green y causar líos.

## Canary deploys

Similar a blue-green pero con **feature flags** en lugar de dos environments separados.

La nueva feature se deploya a producción pero **oculta detrás de un flag**. Activada para un grupo pequeño (beta testers, internal users). Gradualmente abres a más usuarios.

```
Producción:
  - Versión vieja (todos los usuarios)
  - Versión nueva (solo flag activo, 5% de usuarios)
```

### Feature flags

- **FeatureFlags**, **LaunchDarkly**, **Unleash**, **PostHog**: herramientas de gestión de flags.
- O puedes hacer tu propio sistema (más trabajo).

> [!warning] Limpia los flags
> Pon tickets recurrentes para limpiar flags viejos. Un flag olvidado deja a usuarios sin acceso a features completas. Un flag activado antes de tiempo expone features incompletas.

### Canary release vs canary deploy

No confundir:

- **Canary deploy**: progressive rollout con feature flags.
- **Canary release**: versión early-access para early adopters (Chrome canary). Tiene su propio version number, normalmente no estable.

## Estrategias de rollback

A pesar de todo el planning, las cosas irán mal en producción. Asume que tu último deploy causó el problema y prepárate con contingencia.

### 1. Redeploy de versión anterior

La más simple. Si tienes Git tags o almacenas artifacts por versión en el cloud, redeploy la versión anterior.

- **Ventaja**: rápida, no requiere nuevos PRs.
- **Funciona especialmente bien** con blue-green (switch traffic de vuelta) o canary (toggles del flag).

DevOps puede hacerlo, o puede haber una UI para seleccionar la versión.

### 2. Revert o reset de PRs

Otra estrategia: revertir el release PR. Abres un nuevo PR que deshace los cambios y dispara un nuevo deploy.

Comandos Git útiles:

| Comando | Qué hace | Cuándo usar |
|---|---|---|
| `git revert <commit>` | Crea un nuevo commit que deshace los cambios del commit especificado. No toca el historial. | Quieres deshacer cambios sin reescribir historia. |
| `git reset --soft <commit>` | Deshace commits pero deja los cambios staged. | Quieres revisar los cambios antes de decidir qué hacer. |
| `git reset --mixed <commit>` | Deshace commits y mueve los cambios a unstaged. | Por defecto; ves los cambios como nuevos. |
| `git reset --hard <commit>` | Deshace commits, los quita de staged, **y los borra**. | Estás seguro de que no quieres los cambios. |

> [!warning] --hard borra permanentemente
> Con `git reset --hard` **pierdes los cambios completamente**. Ten mucho cuidado.

> [!warning] No confundas revert y reset
> Para deshacer un commit reciente, ambos funcionan. Para deshacer varios, **la diferencia importa mucho**. Lee bien antes de usar.

### 3. Hotfix roll-forward

En lugar de deshacer, **avanzas con un fix**. El equipo trabaja rápido para encontrar el root cause, parchear el código, y abrir un PR. A veces la infra no soporta rollbacks, o el repo no permite reverts fácilmente.

> [!quote] Ethan Brown sobre hotfixes
> Es razonable tener un **"hotfix protocol"** con requisitos de review y test más bajos, **siempre que el último paso sea hacer el review y test normales en cuanto la crisis termine**. Hacer el hotfix gana a todo lo demás temporalmente. Bajo presión hay dos tipos de personas: las que confiesan haber cortado esquinas y los mentirosos. No avergüences a los que cortan esquinas ni dejes a los mentirosos salirse con la suya. Crea un proceso que se ajuste a la situación e incluye cómo "re-uncut" esas esquinas cuando el fuego se apaga.

Hotfix pasos:

- **Logs y último commit** son los primeros sospechosos.
- **No pasa por QA normal** — es urgencia.
- **Group call** con devs, QA, Producto para verificar el fix.
- **Test específico** del issue; verifica que el fix no causa otros problemas.

## Conclusión

Las estrategias aquí son **algunas** de las muchas posibles. Combinaciones suelen funcionar mejor que una sola. **Partner con DevOps y QA** constantemente. El éxito del release depende tanto de la infra donde corre el código como de la calidad del testing.

Haz que el deploy no sea estreszante: **build breathing room en el plan**, prep recursos en cloud con antelación, comunicación constante con Producto y stakeholders. Cuando la gente sabe qué está pasando, **confía en tu equipo y te da más autonomía**.

## Próximos pasos

- [[27-preocupaciones-de-integracion|Preocupaciones de integración]]: testing en producción, third-party services, data y seguridad en prod, containerización con Docker.
