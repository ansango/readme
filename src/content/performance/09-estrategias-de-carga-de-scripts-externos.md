---
title: "Estrategias avanzadas de carga de scripts externos"
description: "Optimización de la entrega de scripts: directivas async/defer, resource hints (preconnect, dns-prefetch), lazy loading con IntersectionObserver, patrones Facade y carga condicional por hardware"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [desarrollo, performance, script-loading, async-defer, resource-hints, facades, lazy-loading]
---

# Estrategias avanzadas de carga de scripts externos

> [!abstract] Resumen
> Cuando un script de terceros es estrictamente imprescindible para el negocio, el objetivo de la ingeniería de rendimiento consiste en **desacoplar su descarga y ejecución de la ruta crítica de renderizado**. En esta nota se analizan las diferencias técnicas entre `async` y `defer`, el uso estratégico de pistas de recursos (**Resource Hints** como `preconnect` y `dns-prefetch`), la implementación del patrón **Facade / Click-to-Load** para componentes interactivos pesados (como reproductores de vídeo o widgets de chat) y la **carga condicional** adaptada a las capacidades del hardware y la red del usuario.

---

## Secuenciación en el HTML: Síncrono vs `async` vs `defer`

El comportamiento de la etiqueta `<script>` determina si la descarga o ejecución detiene el analizador HTML del navegador:

```text
  1. Script Síncrono (<script src="...">)
  HTML Parse ─────► [ DETENIDO / BLOQUEO ] ─────► HTML Parse continúa
                    Descarga + Ejecuta JS
  
  2. Script Asíncrono (<script async src="...">)
  HTML Parse ──────────────────────► [ PAUSA ] ──► HTML Parse continúa
         Descarga en paralelo ───►  Ejecuta JS
  
  3. Script Diferido (<script defer src="...">)
  HTML Parse ──────────────────────────────────────────► DOMContentLoaded
         Descarga en paralelo ───► [ Ejecuta al final ]
```

| Atributo | Cuándo descarga | Cuándo ejecuta | ¿Respeta el orden del HTML? | Caso de uso ideal |
|---|---|---|---|---|
| **Ninguno (Síncrono)** | Inmediato (bloquea) | Inmediato (bloquea) | Sí | Scripts de polyfills ultra-críticos de arranque inmediato. |
| `async` | En paralelo | Inmediatamente al descargar (interrumpe el parser) | **No** (el que antes descarga, antes ejecuta) | Scripts totalmente independientes (e.g., analítica que no toca el DOM). |
| `defer` | En paralelo | Tras finalizar el parseo HTML antes de `DOMContentLoaded` | **Sí** (en el orden exacto en que están declarados) | Librerías de UI, frameworks y scripts dependientes entre sí. |
| `type="module"` | En paralelo | Diferido por defecto (equivalente a `defer`) | Sí | Módulos ES modernos (`import` / `export`). |

---

## Optimización de red con *Resource Hints*

Cada dominio externo nuevo exige una resolución DNS, un *handshake* TCP y una negociación TLS (consumiendo entre 100 ms y 400 ms en redes móviles):

```html
<!-- 1. dns-prefetch: Resuelve solo la IP en segundo plano (muy bajo coste) -->
<link rel="dns-prefetch" href="https://analytics.google.com" />

<!-- 2. preconnect: Resuelve DNS + TCP + TLS con antelación (para dominios críticos inmediatos) -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

> [!warning] No abusar de `preconnect`
> Cada `preconnect` mantiene un socket TCP abierto consumiendo recursos de red del navegador y del servidor. Limita `preconnect` a un máximo de **2 o 3 dominios críticos** que vayan a solicitar recursos en los primeros 2 segundos de carga.

---

## El patrón *Facade* / *Click-to-Load*

Un *Facade* es un sustituto estático ultraligero (una imagen o botón en HTML/CSS) que imita visualmente a un componente pesado de terceros. El código JavaScript real solo se descarga cuando el usuario interactúa expresamente con él.

```text
  Carga Inicial de la Página                   Interacción del Usuario
  ┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐
  │ Imagen miniatura JPG + Botón Play   │ ───► │ Clic en el botón Play:              │
  │ (Peso: 15 KB - 0 ms de bloqueo JS)  │      │ Se descarga e inserta el iframe     │
  └─────────────────────────────────────┘      │ interactivo de YouTube (600 KB JS)  │
                                               └─────────────────────────────────────┘
```

### Ejemplo: Botón de soporte / Chatbot bajo demanda

```javascript
// Carga del script del Chatbot únicamente cuando el usuario pulsa el icono
const chatLauncher = document.getElementById('chat-launcher-button');

chatLauncher.addEventListener('click', () => {
  chatLauncher.disabled = true;
  chatLauncher.textContent = 'Iniciando asistente...';
  
  const script = document.createElement('script');
  script.src = 'https://cdn.ai-chat-provider.com/widget.js';
  script.async = true;
  script.onload = () => {
    window.AIChatWidget.open();
  };
  document.body.appendChild(script);
}, { once: true });
```

---

## Carga condicional basada en hardware y red (*Adaptive Loading*)

Las APIs de información del dispositivo permiten adaptar la carga de scripts no esenciales según la potencia del terminal:

```javascript
// Comprobar si el usuario está en red lenta o modo ahorro de datos
const isDataSaver = navigator.connection && navigator.connection.saveData;
const isSlowNetwork = navigator.connection && 
  (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === '3g');
const isLowEndDevice = navigator.deviceMemory && navigator.deviceMemory < 4; // < 4 GB RAM

if (!isDataSaver && !isSlowNetwork && !isLowEndDevice) {
  // Cargar visualizaciones 3D pesadas, animaciones complejas o widgets de IA
  import('./heavy-visualizer.js');
} else {
  // Servir versión estática ligera
  import('./static-fallback.js');
}
```

---

## Próximos pasos

Aprende a planificar la ejecución en momentos de reposo y a aislar scripts de terceros fuera del hilo principal:

- [[10-planificacion-y-aislamiento-de-scripts-third-party|10: Planificación y aislamiento de scripts de terceros]]
