---
title: "Web Performance Engineering in the Age of AI"
description: "Índice de la wiki de Web Performance Engineering in the Age of AI: guía integral de optimización web, Core Web Vitals y calidad de software en la era del código asistido por IA, basada en la obra de Addy Osmani (O'Reilly, 2026)"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [desarrollo, performance, webperf, core-web-vitals, ai, javascript, optimization, frontend]
---

# Web Performance Engineering in the Age of AI

> [!abstract] Resumen
> Esta wiki estructura y sintetiza las directrices técnicas, patrones de arquitectura y metodologías de auditoría de *Web Performance Engineering in the Age of AI: Mastering Speed and Quality for AI-Generated Applications* (Addy Osmani, O'Reilly Media, febrero de 2026). Escrito por uno de los líderes históricos del equipo de Google Chrome y Google Cloud AI, el libro aborda la ingeniería del rendimiento web desde una perspectiva holística: desde la psicología de la percepción humana y los **Core Web Vitals** (LCP, INP, CLS), hasta la arquitectura interna del motor de renderizado, el coste de ejecución de JavaScript y el nuevo paradigma de optimización para **código generado por Inteligencia Artificial** e **interfaces basadas en streaming de tokens**.

---

## Acerca del libro y su autor

**Addy Osmani** es un líder de ingeniería en Google Cloud AI y anteriormente lideró durante más de 14 años iniciativas de rendimiento, experiencia de desarrollo y Core Web Vitals en el equipo de **Google Chrome**.

La tesis central de la obra sostiene que, si bien los modelos de lenguaje (LLMs como Gemini, ChatGPT o Claude en herramientas como Cursor o Copilot) permiten generar interfaces completas en minutos, el código resultante suele ser *"sintácticamente correcto pero arquitectónicamente subóptimo"*. El rendimiento sigue gobernado por las restricciones físicas inmutables de los dispositivos móviles, la latencia de red y el hilo principal del navegador.

```text
┌─────────────────────────────────────────────────────────────┐
│       WEB PERFORMANCE ENGINEERING IN THE AGE OF AI          │
├──────────────────────────────┬──────────────────────────────┤
│  Core Web Vitals (LCP/INP/CLS│  Internals del Navegador     │
│  Código Asistido por IA      │  Coste Real de JavaScript    │
│  Scripts de Terceros & Chat  │  Cultura y CI/CD Budgets     │
│  Interfaces Streaming (SSE)  │  Casos Reales y ROI          │
└──────────────────────────────┴──────────────────────────────┘
```

---

## Estructura de la wiki y mapa de lectura

Las 13 notas de la wiki están organizadas en cinco bloques temáticos que cubren la totalidad del libro:

### Parte I: El Rendimiento como Experiencia de Usuario
- [[01-rendimiento-como-experiencia-de-usuario|El rendimiento como experiencia de usuario]]: Umbrales de percepción humana (0.1s, 1s, 10s), impacto directo en métricas de negocio (conversión, rebote) y modelo RAIL.
- [[02-metricas-esenciales-y-core-web-vitals|Métricas esenciales y Core Web Vitals]]: Definición técnica de LCP, INP y CLS; telemetría de laboratorio (Lighthouse, DevTools) vs campo (RUM, CrUX, `web-vitals.js`) y presupuestos de rendimiento.
- [[03-codigo-generado-por-ia-y-la-paradoja-del-rendimiento|Código generado por IA y la paradoja del rendimiento]]: El fenómeno del código "correcto pero inflado", alucinación de dependencias innecesarias y el papel indispensable de la auditoría humana.

### Parte II: Optimización Técnica e Internals del Navegador
- [[04-optimizacion-de-frontends-generados-por-ia|Optimización y refactorización de frontends generados por IA]]: Errores comunes en componentes React generados por LLMs (inestabilidad de layout, cuellos de botella en el hilo principal) y diagnóstico asistido por IA en DevTools / MCP.
- [[05-arquitectura-interna-del-navegador-y-renderizado|Arquitectura interna del navegador y pipeline de renderizado]]: Multiproceso de Chromium, pipeline de render (DOM $\rightarrow$ Layout $\rightarrow$ Paint $\rightarrow$ Composite), Preload Scanner, planificador de tareas prioritarias de Chrome y dilemas de SSR / Hidratación.
- [[06-trade-offs-y-compromisos-en-optimizacion|Trade-offs y compromisos en la optimización web]]: Balances de ingeniería: métricas objetivas vs percepción subjetiva, tamaño de bundle vs número de peticiones de red y frameworks vs Vanilla JS.

### Parte III: Optimización de JavaScript
- [[07-el-coste-real-de-javascript|El coste real de JavaScript en cliente y servidor]]: La brecha de CPU en dispositivos móviles (*Mobile Gap*), fases del motor V8 (parseo, Ignition bytecode, compilador TurboFan JIT, Garbage Collection) y rendimiento en Node.js.

### Parte IV: Gestión de Terceros y Dependencias
- [[08-auditoria-e-impacto-de-scripts-de-terceros|Auditoría e impacto de scripts de terceros]]: Inventario y evaluación del impacto de analítica, anuncios, widgets y chatbots de IA en el hilo principal.
- [[09-estrategias-de-carga-de-scripts-externos|Estrategias avanzadas de carga de scripts externos]]: Secuenciación crítica (`async` vs `defer`), *Resource Hints* (`preconnect`, `dns-prefetch`), lazy loading con IntersectionObserver y patrones *Facade* / *Click-to-Load*.
- [[10-planificacion-y-aislamiento-de-scripts-third-party|Planificación y aislamiento de scripts de terceros]]: `requestIdleCallback`, patrón *Idle-Until-Urgent*, aislamiento en Web Workers con Partytown, optimización en Next.js (`Script` component) y gestión de Tag Managers.

### Parte V: Cultura, Casos de Estudio y el Futuro con IA
- [[11-cultura-de-rendimiento-e-integracion-continua|Cultura de rendimiento e integración continua (CI/CD)]]: El rendimiento como requerimiento no funcional, roles de *Performance Champion* y automatización con Lighthouse CI en GitHub Actions.
- [[12-casos-de-estudio-reales-y-roi-del-rendimiento|Casos de estudio reales y retorno de inversión (ROI)]]: Casos de éxito empíricos en comercio electrónico (Rakuten, Vodafone, Shopify), medios de comunicación (The Telegraph) e innovaciones de IA (Vercel, Cloudflare, Chrome Speculation Rules).
- [[13-el-futuro-del-rendimiento-web-en-la-era-de-la-ia|El futuro del rendimiento web en la era de la IA]]: Interfaces basadas en streaming de tokens (SSE), componentes React concurrentes en streaming, control de backpressure, métricas para LLMs y checklist para producción.

---

## Próximos pasos

Comienza explorando los fundamentos psicológicos y métricos de la velocidad web:

- [[01-rendimiento-como-experiencia-de-usuario|01: El rendimiento como experiencia de usuario]]
