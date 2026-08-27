---
title: "Código generado por IA y la paradoja del rendimiento"
description: "Análisis del impacto de los modelos de lenguaje en el desarrollo web: la paradoja del código 'correcto pero subóptimo', deuda técnica oculta, bundle bloat y el rol de la auditoría humana"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [desarrollo, performance, ai, llm, prompt-engineering, code-quality, bundle-size]
---

# Código generado por IA y la paradoja del rendimiento

> [!abstract] Resumen
> La adopción masiva de asistentes de código basados en modelos de lenguaje (LLMs como Gemini, Claude, GPT-4 en entornos como Cursor, GitHub Copilot o v0) ha multiplicado la velocidad de prototipado y generación de interfaces. Sin embargo, este salto cuantitativo ha introducido la **Paradoja del Rendimiento**: los LLMs generan código que cumple fielmente con los requisitos funcionales del prompt pero que es arquitectónicamente ineficiente, sobrecargado de dependencias innecesarias y ciego a las restricciones de tiempo de ejecución del navegador. En esta nota se desglosan los costes ocultos del código generado por IA y el papel irremplazable de la supervisión técnica humana.

---

## La paradoja: "Sintácticamente correcto, operacionalmente subóptimo"

Los modelos de lenguaje son motores probabilísticos entrenados para predecir el siguiente token más probable a partir de repositorios públicos de código (como GitHub o StackOverflow), donde abunda código desactualizado, patrones antipatrón y librerías obsoletas.

```text
┌─────────────────────────────────────────────────────────────┐
│                 CÓDIGO GENERADO POR IA                      │
├──────────────────────────────┬──────────────────────────────┤
│ Lo que la IA optimiza:       │ Lo que la IA ignora:         │
│ • Cumplir el prompt visual.  │ • Presupuesto de bundle (KB).│
│ • Que compile sin errores.   │ • Re-renderizados en React.  │
│ • Rapidez de respuesta.      │ • Latencia de red y CPU p75. │
└──────────────────────────────┴──────────────────────────────┘
```

```text
  Prompt del Desarrollador: "Crea una tabla con búsqueda y paginación"
                    │
                    ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ Generación por LLM:                                         │
  │ - Importa Lodash completo (70 KB gzipped) para un debounce  │
  │ - Importa Moment.js (65 KB) para formatear 1 fecha          │
  │ - Re-filtra 5.000 filas en cada pulsación sin useMemo       │
  │ - Omite dimensiones en avatares (genera CLS)                │
  └─────────────────────────────────────────────────────────────┘
```

---

## Los cuatro costes ocultos del código de LLM

Addy Osmani categoriza los fallos sistemáticos de rendimiento introducidos por asistentes de IA:

### 1. Inflación masiva de dependencias (*Bundle Bloat*)
Los LLMs tienden a resolver problemas comunes sugiriendo la instalación de paquetes `npm` pesados en lugar de utilizar APIs web nativas modernas:

```javascript
// ANTIPATRÓN GENERADO POR IA (Importa 70 KB de Lodash):
import _ from 'lodash';
const debouncedSearch = _.debounce(fetchResults, 300);

// SOLUCIÓN ÓPTIMA CON API NATIVA (0 KB adicionales):
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

---

### 2. Gestión de estado ineficiente y bucles de re-renderizado
Al generar componentes de React, Vue o Svelte, la IA suele anidar estados locales innecesarios, olvidar la memoización de callbacks costosos o mutar estados dentro de `useEffect`, provocando cascadas de renderizado que congelan el hilo principal.

---

### 3. Omisión de metadatos de maquetación (Impacto en CLS)
La IA suele estructurar etiquetas `<img>`, `<video>` o contenedores dinámicos sin atributos explícitos `width`, `height` o propiedades CSS `aspect-ratio`, provocando saltos bruscos de diseño cuando los recursos multimedia terminan de descargar.

---

### 4. Componentes monolíticos sin división de código (*Code Splitting*)
Un asistente de IA genera habitualmente componentes gigantescos en un único archivo. Sin directivas explícitas de carga diferida (`React.lazy()`, `next/dynamic`), modales secundarios, editores de texto enriquecido o librerías de gráficos pesadas terminan empaquetadas en el *bundle* inicial crítico de la página.

---

## La mentalidad del "Desarrollador Junior Ultrarrápido"

Para mantener la calidad y el rendimiento en la era de la IA, Osmani propone tratar a los LLMs como **desarrolladores junior extremadamente veloces**:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Generación   │ ────► │ 2. Auditoría    │ ────► │ 3. Validación   │
│ Asistida (LLM)  │       │ Humana (Review) │       │ Profiling Real  │
│ Velocidad x10   │       │ Detectar bloat  │       │ DevTools / CWVs │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

> [!tip] Prompts orientados a rendimiento
> Para guiar a los LLMs hacia código más eficiente, incluye siempre restricciones explícitas de rendimiento en el *system prompt* o instrucción inicial:
> *"Usa exclusivamente APIs web nativas modernas; no importes librerías externas para utilidades simples; incluye width y height en todas las imágenes; implementa lazy loading en componentes no visibles inicialmente."*

---

## Próximos pasos

Aprende a diagnosticar y refactorizar componentes web generados por IA mediante herramientas de auditoría modernas:

- [[04-optimizacion-de-frontends-generados-por-ia|04: Optimización y refactorización de frontends generados por IA]]
