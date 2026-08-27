---
title: "Métricas esenciales y Core Web Vitals"
description: "Medición cuantitativa del rendimiento web: desglose técnico de LCP, INP y CLS, diferencias entre datos de laboratorio y de campo (RUM/CrUX) y presupuestos de rendimiento"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [desarrollo, performance, core-web-vitals, lcp, inp, cls, rum, crux, lighthouse]
---

# Métricas esenciales y Core Web Vitals

> [!abstract] Resumen
> Durante años, la industria evaluó la velocidad mediante eventos técnicos abstractos como `DOMContentLoaded` o `window.onload`. La iniciativa de **Core Web Vitals (CWVs)** de Google redefinió el estándar global midiendo tres momentos críticos de la experiencia real del usuario: velocidad de carga percibida (**LCP**), capacidad de respuesta a la interacción (**INP**) y estabilidad visual (**CLS**). En esta nota se analiza la formulación matemática de cada métrica, las diferencias entre datos sintéticos de **Laboratorio** y telemetría de **Campo** (**RUM / CrUX**), y la implementación de presupuestos de rendimiento automatizados.

---

## Las tres métricas Core Web Vitals (CWV)

Los Core Web Vitals evalúan la calidad de la experiencia web mediante tres umbrales estandarizados evaluados en el **percentil 75 (p75)** de los usuarios:

```text
┌─────────────────────────────────────────────────────────────┐
│                 CORE WEB VITALS (UMBRALES P75)              │
├──────────────┬──────────────────┬──────────────┬────────────┤
│ Métrica      │ Bueno (Verde)    │ A mejorar    │ Pobre      │
├──────────────┼──────────────────┼──────────────┼────────────┤
│ **LCP**      │ ≤ 2.5 s          │ 2.5 s – 4.0 s│ > 4.0 s    │
│ **INP**      │ ≤ 200 ms         │ 200 – 500 ms │ > 500 ms   │
│ **CLS**      │ ≤ 0.1            │ 0.1 – 0.25   │ > 0.25     │
└──────────────┴──────────────────┴──────────────┴────────────┘
```

---

### 1. Largest Contentful Paint (LCP) — Velocidad de carga principal

Mide el tiempo transcurrido desde que el usuario inicia la navegación hasta que el elemento de contenido visible más grande dentro del *viewport* termina de renderizarse por completo (típicamente una imagen hero, un banner de vídeo o un bloque de texto principal).

```text
  Navegación ──► [ TTFB (Servidor) ] ──► [ FCP ] ──► [ LCP: Imagen Hero visible ]
  ◄────────────────────────────── ≤ 2.5 segundos ──────────────────────────────►
```

#### Subpartes de LCP para diagnóstico:
1. **Time to First Byte (TTFB):** Tiempo de respuesta del servidor backend y red.
2. **Resource Load Delay:** Retraso hasta que el navegador descubre la URL del recurso LCP.
3. **Resource Load Duration:** Tiempo de descarga física del archivo.
4. **Element Render Delay:** Tiempo que tarda el hilo principal en renderizar el elemento tras descargarlo.

---

### 2. Interaction to Next Paint (INP) — Capacidad de respuesta interactiva

Sustituyó oficialmente a FID (*First Input Delay*). Evalúa la latencia de **todas las interacciones** realizadas a lo largo de toda la vida de la página (clics, toques en pantalla táctil y pulsaciones de teclado), reportando el peor retraso observado.

```text
  Pulsación de Usuario (Click / Tap)
                │
                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. Input Delay (Espera en cola en el Hilo Principal)        │
  ├─────────────────────────────────────────────────────────────┤
  │ 2. Processing Time (Ejecución de Event Handlers en JS)      │
  ├─────────────────────────────────────────────────────────────┤
  │ 3. Presentation Delay (Layout, Paint y Composite del Frame) │
  └─────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
  Actualización visual en pantalla (Next Paint)  <-- Objetivo: ≤ 200 ms
```

---

### 3. Cumulative Layout Shift (CLS) — Estabilidad visual

Mide la suma total de todas las puntuaciones de cambio de diseño inesperado que ocurren durante toda la sesión.

$$\text{Layout Shift Score} = \text{Impact Fraction} \times \text{Distance Fraction}$$

- **Impact Fraction:** Porcentaje del área de la pantalla afectada por el movimiento de elementos.
- **Distance Fraction:** Distancia máxima que los elementos inestables se han desplazado respecto a la dimensión del viewport.
- **Causas principales de mal CLS:** Imágenes, vídeos o iframes sin atributos explícitos `width` y `height`, anuncios inyectados dinámicamente sin reserva de espacio, y fuentes web con *FOUT/FOIT* brusco.

---

## Laboratorio (*Lab Data*) vs Campo (*Field Data / RUM*)

```text
┌───────────────────────────┬───────────────────────────┐
│ DATOS DE LABORATORIO (LAB)│ DATOS DE CAMPO (FIELD/RUM)│
├───────────────────────────┼───────────────────────────┤
│ • Herramientas:           │ • Herramientas:           │
│   Lighthouse, WPT,        │   CrUX (Chrome Report),   │
│   DevTools Performance.   │   web-vitals.js, RUM.     │
│ • Entorno sintético fijo  │ • Condiciones reales de   │
│   (CPU/Red emulada).      │   millones de usuarios.   │
│ • Ideal para debugging    │ • La verdad definitiva    │
│   y validación en CI/CD.  │   para SEO y negocio.     │
└───────────────────────────┴───────────────────────────┘
```

> [!note] Por qué Lighthouse no puede medir INP directamente
> Lighthouse es una prueba automatizada que carga la página y finaliza; no puede simular el comportamiento errático de un usuario humano interactuando durante 15 minutos en la aplicación. Para estimar la interactividad en laboratorio, Lighthouse utiliza como proxy **Total Blocking Time (TBT)** (tiempo total en que las tareas del hilo principal exceden los 50 ms entre FCP y TTI).

---

## Medición de campo con `web-vitals.js`

La librería oficial `web-vitals` permite capturar los Core Web Vitals en clientes reales y enviarlos a cualquier endpoint de analítica:

```javascript
import { onLCP, onINP, onCLS } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType
  });
  
  // Uso de sendBeacon para asegurar entrega al cerrar la página
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', { body, method: 'POST', keepalive: true });
  }
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
```

---

## Presupuestos de rendimiento (*Performance Budgets*)

Un presupuesto de rendimiento define límites cuantitativos estrictos que no deben sobrepasarse durante el desarrollo:

```json
// budget.json para Lighthouse CI
[
  {
    "path": "/*",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "total-blocking-time", "budget": 200 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 150 },
      { "resourceType": "total", "budget": 500 }
    ]
  }
]
```

---

## Próximos pasos

Comprende por qué el código generado por modelos de Inteligencia Artificial tiende a degradar estas métricas si no se audita:

- [[03-codigo-generado-por-ia-y-la-paradoja-del-rendimiento|03: Código generado por IA y la paradoja del rendimiento]]
