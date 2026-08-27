---
title: "El coste real de JavaScript en cliente y servidor"
description: "Análisis del ciclo de vida de JavaScript en motores modernos (V8): parseo, compilación JIT (Ignition/TurboFan), recolector de basura (GC) y optimización en Node.js"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [desarrollo, performance, javascript, v8, jit, nodejs, garbage-collection, cpu]
---

# El coste real de JavaScript en cliente y servidor

> [!abstract] Resumen
> En la web moderna, **100 KB de JavaScript no equivalen en absoluto a 100 KB de una imagen JPG**. Mientras que una imagen se decodifica en hilos secundarios de GPU y se pinta de forma pasiva, JavaScript es un lenguaje ejecutable que monopoliza el **hilo principal**, consume memoria RAM para árboles de sintaxis abstracta (*AST*) y requiere compilación Just-In-Time (**JIT**). En esta nota se desglosa el ciclo de vida completo de ejecución de JavaScript dentro del motor **V8** de Chromium y las consideraciones de concurrencia y Event Loop en el backend con **Node.js**.

---

## Por qué JavaScript es el recurso más costoso de la red

El peso de transferencia de un archivo `.js` comprimido con Brotli o Gzip solo representa una fracción mínima de su impacto real:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Descarga     │ ────► │ 2. Descom-      │ ────► │ 3. Parseo y     │ ────► │ 4. Compilación  │
│ de Red (Wire)   │       │ presión         │       │ Tokenización    │       │ Bytecode (JIT)  │
│ (e.g. 300 KB)   │       │ (e.g. 1.2 MB)   │       │ (Crea el AST)   │       │ (Ignition)      │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                                                       │
                                                                                       ▼
┌─────────────────┐                                                           ┌─────────────────┐
│ 6. Garbage      │ ◄──────────────────────────────────────────────────────── │ 5. Ejecución en │
│ Collection (GC) │         (Monopoliza la CPU del dispositivo móvil)         │ Hilo Principal  │
└─────────────────┘                                                           └─────────────────┘
```

- **El coste de memoria y batería:** Procesar 1 MB de JavaScript sin comprimir en un teléfono Android de gama media puede consumir hasta **2.5 segundos de CPU al 100%**, elevando la temperatura del chip, activando el estrangulamiento térmico (*thermal throttling*) y congelando la interfaz ante cualquier toque del usuario (**INP crítico**).

---

## El pipeline del motor V8 (Chromium y Node.js)

El motor V8 ejecuta código JavaScript a través de un sofisticado pipeline multi-etapa:

```text
  Código JS (Texto plano)
            │
            ▼ (Scanner & Parser)
  Árbol de Sintaxis Abstracta (AST)
            │
            ▼ (Ignition)
  Bytecode del Intérprete ──────────────► [ Ejecución Rápida Inmediata ]
            │                                         │
            │ (Perfilado de tipos calientes)          │ (Deoptimización / Bailout)
            ▼                                         ▼
  Compilador TurboFan JIT ──────────────► [ Código Máquina Optimizado ]
```

### Componentes de V8:
1. **Parser & Pre-Parser:** Analiza la sintaxis del código. El *Pre-Parser* salta funciones que no se invocan de inmediato para acelerar el arranque.
2. **Intérprete Ignition:** Genera *bytecode* compacto a partir del AST y comienza a ejecutarlo de inmediato sin esperar a compilarlo.
3. **Compilador optimizador TurboFan:** Monitorea las funciones que se ejecutan repetidamente (*hot functions*). Si una función siempre recibe los mismos tipos de datos (e.g., enteros), TurboFan genera código binario nativo optimizado. Si los tipos cambian repentinamente (*monomórfico* $\rightarrow$ *polimórfico*), se produce una **desoptimización (*deopt*)**, volviendo al intérprete y castigando el rendimiento.
4. **Recolector de Basura (Orinoco Garbage Collector):** Libera memoria mediante algoritmos generacionales (*Young Generation / Scavenger* para objetos efímeros y *Old Generation / Mark-Sweep-Compact* para objetos duraderos). Las pausas de recolección de basura (*GC pauses*) en el hilo principal son una causa habitual de caídas de frames (*jank*).

---

## Optimización de JavaScript en el backend: Node.js

En el servidor, Node.js utiliza el mismo motor V8 pero bajo un modelo de concurrencia basado en la librería de E/S asíncrona **libuv**:

```text
┌─────────────────────────────────────────────────────────────┐
│                 FASES DEL EVENT LOOP DE NODE.JS             │
├──────────────────┬──────────────────────────────────────────┤
│ 1. Timers        │ `setTimeout()`, `setInterval()`          │
│ 2. Pending I/O   │ Callbacks de red y errores de sockets    │
│ 3. Idle, Prepare │ Operaciones internas de libuv            │
│ 4. Poll          │ Recupera nuevos eventos de E/S / sockets │
│ 5. Check         │ Callbacks de `setImmediate()`            │
│ 6. Close         │ Callbacks de cierre (`socket.on('close')│
└──────────────────┴──────────────────────────────────────────┘
```

> [!danger] La regla de oro en Node.js: "Don't Block the Event Loop"
> Dado que Node.js procesa miles de peticiones simultáneas sobre un único hilo de ejecución, **cualquier operación síncrona pesada** (cálculo criptográfico en bucle, parseo de JSONs de 50 MB con `JSON.parse` o expresiones regulares catastróficas *ReDoS*) detiene por completo el servidor, disparando el **TTFB** de todos los usuarios concurrentes.

---

## Próximos pasos

Aprende a auditar y controlar el impacto de los scripts de analítica, publicidad y widgets externos en tu aplicación:

- [[08-auditoria-e-impacto-de-scripts-de-terceros|08: Auditoría e impacto de scripts de terceros]]
