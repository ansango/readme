---
title: "Setup del frontend"
description: "Decisiones de arquitectura, elegir framework (React), paquetes comunes por categoría, trabajar con Producto, Diseño, QA y DevOps"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, architecture, tooling]
---

# Setup del frontend

> [!abstract] Resumen
> Esta nota cubre las decisiones iniciales del frontend: arquitectura (component-based, atomic design), elección de framework (React por estabilidad y comunidad), paquetes por categoría (data viz, forms, state, data fetching, styling, testing), y la coordinación con Producto, Diseño, QA y DevOps antes de empezar a codear. El foco está en tomar decisiones fundamentadas que cimienten el proyecto a largo plazo y en coordinar con los equipos que van a impactar en cómo se construye.

## El frontend es la cara del producto

El backend puede ser la joya técnica, pero el frontend es lo que el usuario ve y toca. Una UX mala tira por tierra cualquier feature genial. Construir el frontend requiere un tipo de pensamiento distinto al backend porque hay research de usuario de por medio: cómo afectan los diseños a la gente, qué les frustra, qué les encanta.

## Decisiones de arquitectura

Las decisiones del frontend tienen que ser **consistentes** porque si hay diferencias, los usuarios las notan. Crea convenciones de código con el equipo. Las pequeñas diferencias en el frontend impactan UX directamente.

### Patrones de arquitectura

Antes de elegir, estudia los diseños y piensa en:

- Dónde manejarás data y API calls.
- Qué partes de la UI serán reutilizables.
- Qué patrones repiten las pantallas.

Patrones comunes:

- **MVC (Model-View-Controller)**: clásico, separación clara.
- **MVVM (Model-View-ViewModel)**: común en apps con bindings reactivos.
- **Component-based**: el más usado hoy en apps grandes. React lo fomenta.
- **Micro frontends**: apps independientes que se componen. Útil en organizaciones con muchos equipos frontend.

> [!tip] Atomic design
> El proyecto del libro usa **component-based + atomic design** como metodología. No te cases con el nombre, pero sí con la idea: descompón la UI en sus piezas más pequeñas (átomos), combínalas en moléculas, y construye páginas a partir de ahí. Te ayuda a identificar reusables.

> [!tip] Comparte tu investigación
> Cuando estés tomando estas decisiones, comparte con el equipo lo que encuentras. No hace falta presentación formal; basta con abrir las pestañas que tienes y hablar de por qué elegiste cada cosa. Es mentoría pura y le da al equipo criterio para decisiones futuras.

### PR reviews en frontend son más lentas

En la mayoría de proyectos, los PRs de frontend tardan más en revisarse que los de backend. Naming conventions importan mucho (las props se pasan entre componentes en distintos estados), y necesitas verificar que cada referencia es correcta. **Crea un template de PR review** con la checklist. Ahorra tiempo y統一 criterios.

### Consideraciones de seguridad

La seguridad impacta directamente en decisiones de arquitectura. ¿Qué herramientas usas para validar inputs? ¿Cómo manejas tokens? ¿Cómo previenes ataques comunes? Esto se va a repetir en cada form y cada request, así que las decisiones se multiplican.

### Organización de componentes

- **Modular y separado de la lógica de negocio**. Si necesitas lógica, hazla en un custom hook o un helper, no en el componente.
- **Trabaja con Diseño en estándares y terminología común.** Usar las mismas palabras para los mismos elementos ayuda a que el equipo se entienda.
- **Single Responsibility.** Si un componente tiene muchas props, probablemente está haciendo demasiado.

### Diagrama de arquitectura

Una vez tengas claras las decisiones, **dibuja un diagrama de arquitectura del frontend**. Ayuda a descomponer los diseños en vistas y componentes reusables, y a encontrar patrones comunes (tablas, search bars, botones).

Pásalo al equipo. Anima a mid-level devs a tomar un container y detallarlo: states, API calls, conditional rendering. Es un buen ejercicio de aprendizaje y te da parallel work.

## Elegir framework

El ecosistema frontend cambia rápido. Lo que era popular hace dos años puede que no lo sea hoy. Antes de elegir:

- **Comunidad y soporte** en GitHub y Stack Overflow.
- **Calidad de la documentación** y velocidad para encontrar respuestas.
- **Frecuencia de updates.**
- **Antigüedad** del framework (más tiempo = más battle-tested).
- **Empresas que lo apoyan** (sponsors).
- **Paquetes del ecosistema** (data viz, bundling, state, SDKs de terceros).
- **Encuestas** (State of JavaScript, Stack Overflow Annual Survey).
- **Job descriptions** para ver qué se usa en producción.
- **Restricciones geográficas** por geopolítica.
- **Licencia.**
- **Política de parches de seguridad.**
- **Compatibilidad con tu cloud platform.**
- **Lo que usan otros proyectos de tu organización.**

> [!warning] Cuidado con el hype
> Frameworks nuevos pueden ser geniales, pero no todo está listo para producción. He visto devs quemarse por invertir tiempo en una herramienta que perdió tracción. **Prueba los nuevos en proyectos personales pequeños**, no en producción.

> [!tip] Construye dos prototipos
> Para un greenfield, monta el mismo prototipo en el framework establecido y en el nuevo. Deja que el equipo pruebe ambos. La velocidad de desarrollo y la DX son métricas reales que hablan más que las features en el paper.

El proyecto del libro usa **React + TypeScript**: probado, con gran comunidad, muchos devs familiarizados, mercado laboral grande. Pero eso no significa que sea el mejor para todo. **Svelte** y **Solid** tienen DX excelente. Pruebalos en otros proyectos y trae lo bueno a tu organización.

## Setup de la app

Una vez tienes el framework, necesitas un build tool. Opciones:

- **Vite**: rápido, no muy opinionated.
- **Rollup**: usado por Vite por debajo.
- **esbuild**: bundler en Go, muy rápido.
- **Webpack**: veterano, poderoso pero más lento y verboso.

El build tool afecta bundle size, herramientas compatibles, performance de la app, y velocidad de deploy.

## Componentes comunes

Toda app frontend tiene:

- Manejo de errores.
- Modales.
- Tablas.
- Forms.
- Search.
- Filtrado.
- Toast messages.

Recorre los diseños y busca funcionalidad común entre páginas. Si tienes preguntas de UX, súbalas pronto. Cambios de diseño tardíos afectan layouts y consistencia.

## Paquetes por categoría

### Data visualization

- Chart.js, D3, Three.js, Recharts, VictoryChart, Highcharts.

### Form handling

- React Final Form, React Hook Form, Formik.

### Component libraries

- Material UI (MUI), Chakra UI, Materialize, Semantic UI, Mantine, React Bootstrap, Radix UI.
- Tendencias actuales: Tailwind UI, Headless UI, shadcn/ui (componentes que se copian al proyecto y se customizan).

> [!warning] Internal component libraries son difíciles
> He visto a muchos equipos empezar una librería interna con buenas intenciones y acabarla odiando. Sin un equipo dedicado, mantenerla se vuelve pesado. Si la necesitas multi-equipo, asigna owners.

### State management

- Redux, MobX, Zustand, XState, Jotai, Valtio.

### Data fetching

- TanStack Query, SWR, Apollo Client, RTK-Query.

### Styling

- styled-components, Emotion, CSS Modules, Tailwind CSS.

### Accessibility

- i18n, React Aria.

### Utilities

- Lodash, date-fns, Day.js, jwt-decode.

### Linters/formatters

- ESLint, Babel, Prettier, js-beautify, Biome, dprint.

### Package managers

- npm, pnpm, Yarn.

### Testing

- Jest, Vitest, React Testing Library, Mocha, Cypress, Puppeteer, Playwright.

> [!note] El ecosistema cambia rápido
> Estas son sugerencias actuales. Haz tu due diligence y mira qué se está usando en proyectos similares. Ningún tool es para siempre; tarde o temprano sale algo mejor.

## Trabajar con otros equipos

### Producto y Diseño

Revisa los diseños con el equipo y crea **tickets por pantalla** con criterios de aceptación claros. Piensa en cómo se ven los inputs, cómo manejan errores, qué pasa al submit. Busca edge cases y añádelos a los tickets. Las preguntas técnicas que hagas **moldean cómo Producto piensa features futuras**.

### QA

Aunque no tengas equipo de QA dedicado, ten un **test plan**. Trabaja con QA para decidir escenarios y qué entornos se usan para testear. Si no hay QA, hazlo como actividad grupal del dev team.

### DevOps

Habla con DevOps para **montar pipelines de deploy** para múltiples entornos. Esto puede ir en paralelo mientras tú preparas el codebase. Necesitarás storage para assets (imágenes, fonts). Discutir esto al inicio evita bloqueos cuando empieces a hacer deploys reales.

## Próximos pasos

- [[14-construir-la-app-react-setup|Construir la app React: setup]]: Vite, linters y formatters (Prettier, ESLint, Husky), build configs, estilos (MUI + styled-components), testing (Vitest, React Testing Library), CHANGELOG y README.
