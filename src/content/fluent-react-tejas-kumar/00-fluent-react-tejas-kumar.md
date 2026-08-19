---
title: "Fluent React : construir aplicaciones web rápidas, performantes e intuitivas"
description: "Wiki estructurada del libro de Tejas Kumar sobre cómo funciona React por dentro: historia, JSX, DOM virtual, reconciliación, optimización, patrones, SSR, concurrencia, frameworks, RSC, alternativas y conclusión"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, wiki, libro]
---

# Fluent React

> [!abstract] Resumen
> Wiki del libro *Fluent React* de Tejas Kumar (O'Reilly, 2024). El libro **no enseña a usar React** sino a **entender cómo funciona por dentro**: su historia, JSX, el DOM virtual, reconciliación, Fiber, optimizaciones de rendimiento, patrones avanzados, renderizado en servidor, concurrencia, frameworks como Remix/Next.js, React Server Components y Server Actions, y las alternativas a React (Vue, Angular, Solid, Qwik, Svelte) junto al modelo de signals. La lectura es lineal pero los bloques se pueden abordar de forma semi-independiente una vez se dominan los fundamentos.

## Origen y propósito

El libro parte de una idea clara: la mayoría de tutoriales enseñan a **usar** React, pero pocos explican **cómo funciona**. Esa capa intermedia — la que separa a quien *usa una librería* de quien *piensa como su autor* — es el terreno de esta obra. La motivación se resume en una sola palabra: **updates**. Sin una librería de UI, mantener el estado sincronizado con un DOM que cambia se vuelve frágil, verboso e inseguro cuando se multiplican los componentes y los equipos que los tocan.

> [!quote] Foreword, Kent C. Dodds
> "Tejas ha ido a gran profundidad en temas que te dan una base sólida. Vas a entender el propósito de la existencia de React, lo que te dará un buen marco de referencia al considerarlo como herramienta."

## Cómo leer esta wiki

El libro respeta un orden pedagógico: primero la historia, después los fundamentos del modelo de componentes, luego el motor interno y, finalmente, los frameworks y las alternativas. La wiki mantiene ese orden con pequeñas inversiones temáticas (la concurrencia va antes que los frameworks, porque RSC depende de ella).

> [!tip] Recomendación
> Si ya dominas React a nivel de uso, salta la primera nota y empieza por [[02-jsx|JSX]] para entrar directamente en el modelo de componentes; vuelve después a [[01-el-nivel-de-entrada|El nivel de entrada]] cuando te preguntes *por qué* React es como es.

## Continuar leyendo

### Bloque 1 — Historia y motivación
- [[01-el-nivel-de-entrada|El nivel de entrada]] — por qué existe React, el mundo pre-React (problemas de XHR, reflows, inconsistencias entre HTML/JS), el nacimiento en Facebook, la liberación como open source en 2013 y la evolución hasta los frameworks actuales.

### Bloque 2 — Fundamentos del modelo de componentes
- [[02-jsx|JSX]] — qué es JSX realmente, por qué no es HTML, cómo se compila a `React.createElement`, dónde encaja como sublenguaje y qué papel juegan los fragments.
- [[03-el-dom-virtual|El DOM virtual]] — qué problema resuelve el DOM virtual, qué son los React elements, cómo se relacionan con el DOM real y por qué el diffing sigue dando lugar a *rerenders* innecesarios.
- [[04-reconciliacion|Reconciliación]] — qué hace `render`, qué es la fase de *render* frente a la de *commit*, cómo Fiber parte el trabajo en unidades interrumpibles y cómo el reconciler decide qué montar, actualizar o desmontar.

### Bloque 3 — Optimización y patrones
- [[05-optimizacion-y-rendimiento|Optimización y rendimiento]] — `React.memo`, `useMemo`, `useCallback`, el por qué y cuándo de la memoización, React Forget como futuro de la memoización automática y carga perezosa con `lazy` + `Suspense`.
- [[06-patrones-avanzados|Patrones avanzados]] — HOCs, Render Props, Prop Getters, State Reducers, Control Props y Compound Components: las primitivas de composición que sustentan las librerías del ecosistema (Radix, Reach UI, Headless UI, Downshift…).

### Bloque 4 — Renderizado en servidor y concurrencia
- [[07-react-del-lado-del-servidor|React del lado del servidor]] — SSR clásico, `renderToString`, `renderToPipeableStream`, `hydrateRoot`, los problemas de hidratación que motivan a React 18 y a los frameworks.
- [[08-react-concurrente|React concurrente]] — qué problema resuelve la concurrencia, `useTransition`, `useDeferredValue`, Suspense para *data fetching*, time slicing y selectores como `useSyncExternalStore`.

### Bloque 5 — Frameworks, RSC y alternativas
- [[09-frameworks|Frameworks]] — qué problemas resuelven los frameworks (server rendering, routing, data fetching), la comparativa conceptual Remix ↔ Next.js y por qué React se posiciona como *library on a framework* igual que Linux se posiciona como kernel.
- [[10-server-components-y-server-actions|Server Components y Server Actions]] — la arquitectura RSC, las reglas (serialización, sin hooks con efectos, sin estado mutable), Server Actions como mutaciones asíncronas y el papel del bundler.
- [[11-alternativas-a-react|Alternativas a React]] — Vue, Angular, Solid, Qwik y Svelte; el modelo de **signals** y *fine-grained reactivity* frente al de *render* por componentes; por qué React responde con el toolchain Forget.
- [[12-conclusion|Conclusión]] — el modelo mental consolidado y hacia dónde mira el ecosistema.

## Mapa de dependencias entre capítulos

```text
01 Historia  →  02 JSX  →  03 DOM virtual  →  04 Reconciliación (Fiber)
                                                       │
                                                       ▼
                                            05 Optimización y patrones
                                                       │
                                                       ▼
                                  07 SSR  ←  08 React concurrente
                                          │
                                          ▼
                                09 Frameworks (Remix/Next.js)
                                          │
                                          ▼
                  10 RSC + Server Actions (sobre concurrencia + SSR)
                                          │
                                          ▼
                                11 Alternativas (incluye signals)
                                          │
                                          ▼
                                      12 Conclusión
```

> [!note] Sobre el orden
> El grafo tiene dos atajos: [[07-react-del-lado-del-servidor|SSR]] se lee antes o después de [[08-react-concurrente|Concurrencia]], según prefieras. [[11-alternativas-a-react|Alternativas]] cierra con el contraste signals ↔ React y por eso va al final.

## Próximos pasos

Empezar por la historia: [[01-el-nivel-de-entrada|El nivel de entrada]].
