---
title: "CSS At-Rules y media queries"
description: "Cómo hacer CSS condicional. @media queries para responsive, @supports para feature queries, @container para container queries, @keyframes, @import, @layer"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, at-rules, media-queries, container-queries, responsive]
---

# CSS At-Rules y media queries

> [!abstract] Resumen
> Esta nota cubre el capítulo 21 del libro: las **reglas at-rules** que permiten hacer CSS condicional. @media queries para diseño responsive, @supports para feature detection, @container para container queries, @keyframes para animaciones, @import, @layer y @property. Esenciales para CSS moderno.

## ¿Qué son las at-rules?

Las at-rules son directivas especiales que empiezan con `@`:

```css
@media (max-width: 768px) {
    /* reglas para móvil */
}

@import url("base.css");

@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@layer reset, base, components;
```

```text
At-rules principales:

  - @media: media queries.
  - @import: importar hojas.
  - @supports: feature queries.
  - @keyframes: definir animaciones.
  - @container: container queries.
  - @layer: cascade layers.
  - @property: custom properties tipadas.
  - @charset: encoding.
  - @namespace: XML namespaces.
  - @font-face: definir fuentes.
  - @page: páginas para imprimir.
  - @counter-style: estilos de contadores.
```

## @media queries

Las media queries permiten aplicar CSS según el contexto:

```css
/* Sintaxis básica */
@media (max-width: 768px) {
    .sidebar {
        display: none;
    }
}
```

```text
@media queries:

  - Condición + reglas.
  - Si la condición es verdadera, las reglas aplican.
  - Sintaxis: @media <type> and (<condition>) and ...
```

### Tipos de media

```css
@media screen { /* pantallas */ }
@media print { /* impresoras */ }
@media speech { /* lectores de pantalla */ }
@media all { /* default, todos */ }
```

```text
Tipos:

  - screen: pantallas.
  - print: impresión.
  - speech: lectores de pantalla.
  - all: default.
  - En la práctica, solo screen y print se usan.
```

### Media features

```css
/* Ancho del viewport */
@media (max-width: 768px) { }
@media (min-width: 769px) and (max-width: 1024px) { }

/* Ancho y alto */
@media (min-width: 768px) and (max-height: 1024px) { }

/* Orientación */
@media (orientation: portrait) { }
@media (orientation: landscape) { }

/* Relación de aspecto */
@media (aspect-ratio: 16/9) { }

/* Color */
@media (prefers-color-scheme: dark) { }
@media (prefers-color-scheme: light) { }

/* Hover */
@media (hover: hover) { }  /* dispositivo con hover */
@media (hover: none) { }   /* touch-only */

/* Pointer */
@media (pointer: fine) { } /* ratón o lápiz */
@media (pointer: coarse) { } /* touch */

/* Update frequency */
@media (update: fast) { }  /* gaming, video */
@media (update: slow) { }  /* e-readers */
```

```text
Media features:

  - width, height, device-width, device-height.
  - aspect-ratio, device-aspect-ratio.
  - orientation.
  - resolution.
  - color, color-index, monochrome.
  - prefers-color-scheme: dark/light.
  - prefers-reduced-motion: reduce.
  - prefers-contrast: more/less.
  - hover, pointer.
  - update: fast/slow.
```

### Operadores lógicos

```css
/* AND (default) */
@media (min-width: 768px) and (max-width: 1024px) { }

/* OR */
@media (max-width: 768px), (orientation: portrait) { }

/* NOT */
@media not (prefers-color-scheme: dark) { }
```

```text
Operadores:

  - and: ambas condiciones.
  - or (coma): alguna condición.
  - not: niega la condición.
  - Sin operador: como and.
```

### Mobile-first

```css
/* Base: mobile */
.button {
    padding: 1em;
    font-size: 1em;
}

/* Tablet */
@media (min-width: 768px) {
    .button {
        padding: 1.5em;
        font-size: 1.2em;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .button {
        padding: 2em;
        font-size: 1.4em;
    }
}
```

```text
Mobile-first:

  - Estilos base para el caso más pequeño (mobile).
  - Media queries min-width para los siguientes.
  - El código crece con el viewport.
  - El libro recomienda este enfoque.
```

> [!tip] Mobile-first es el estándar
> El libro es claro: mobile-first es el patrón moderno. Empieza por el caso difícil (mobile) y añade complejidad cuando tienes más espacio.

## prefers-color-scheme

```css
/* Default: light */
:root {
    --bg: white;
    --text: black;
}

@media (prefers-color-scheme: dark) {
    :root {
        --bg: #1a1a1a;
        --text: white;
    }
}

body {
    background: var(--bg);
    color: var(--text);
}
```

```text
prefers-color-scheme:

  - dark: el usuario quiere tema oscuro.
  - light: el usuario quiere tema claro.
  - no-preference: sin preferencia.
  - Detecta la preferencia del sistema operativo.
```

## prefers-reduced-motion

```css
.element {
    animation: fade 1s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
    .element {
        animation: none;
        transition: none;
    }
}
```

```text
prefers-reduced-motion:

  - reduce: el usuario prefiere menos movimiento.
  - no-preference: sin preferencia.
  - Accesibilidad: respeta siempre.
```

> [!tip] Accesibilidad
> El libro insiste: respeta siempre `prefers-reduced-motion`. Usuarios con vestibular disorders se marean con animaciones.

## @supports

```css
@supports (display: grid) {
    .container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }
}

@supports not (display: grid) {
    .container {
        display: flex;
        flex-wrap: wrap;
    }
}
```

```text
@supports:

  - Feature detection.
  - Aplica reglas según si el navegador soporta una feature.
  - Útil para progressive enhancement.
  - Anidable con not.
```

### Operadores en @supports

```css
@supports (display: grid) and (gap: 1rem) { }
@supports (display: grid) or (display: flexbox) { }
@supports not (display: grid) { }
```

```text
Operadores:

  - and: ambas features.
  - or: alguna feature.
  - not: niega.
  - Igual que en @media.
```

## @container queries

Las container queries son el "media queries dentro de un componente":

```css
.card-container {
    container-type: inline-size;
    container-name: card;
}

@container card (min-width: 400px) {
    .card {
        display: grid;
        grid-template-columns: 1fr 2fr;
    }
}

@container card (max-width: 399px) {
    .card {
        display: block;
    }
}
```

```text
@container:

  - Aplica CSS según el tamaño del contenedor.
  - container-type: inline-size o size.
  - container-name: identifica el contenedor.
  - Mucho más potente que media queries para componentes.
```

### container-type

```css
.parent {
    container-type: inline-size;
    container-name: card;
}

.parent {
    container-type: size;      /* inline + block */
    container-name: card;
}
```

```text
container-type:

  - inline-size: solo el ancho afecta.
  - size: ancho y alto afectan.
  - normal: no se comporta como contenedor.
  - Sin container-type, @container no funciona.
```

### ¿Cuándo usar container queries?

```text
Usa @container:

  - Para componentes que cambian según el espacio disponible.
  - Sidebars que colapsan a topbar en móvil.
  - Cards que muestran/ocultan información según el espacio.
  - Cualquier cosa con estado contextual.

Usa @media:

  - Para el layout de página completo.
  - Cuando el cambio es global.
  - Responsive design tradicional.
```

> [!tip] Container queries son el futuro
> El libro señala: container queries han cambiado el juego. Permiten componentes verdaderamente reutilizables que saben cuándo cambiar según el espacio disponible.

## @keyframes

```css
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.element {
    animation: fade-in 1s ease;
}
```

```text
@keyframes:

  - Define estados de una animación.
  - from / to: 0% / 100%.
  - 0%, 50%, 100%: puntos intermedios.
  - Múltiples keyframes para movimientos complejos.
```

## @import

```css
@import url("base.css");
@import url("https://fonts.googleapis.com/css2?family=Inter");
@import url("print.css") print;
@import url("screen.css") screen;
```

```text
@import:

  - Importa otra hoja de estilos.
  - Solo válido al inicio del archivo.
  - Bloquea el render: usar <link> en HTML.
  - print/screen: aplica condicionalmente.
```

> [!warning] @import es lento
> El libro advierte: `@import` fuerza al navegador a **bloquear** el render hasta que la hoja importada se cargue. Usa `<link>` en HTML para mejor performance.

## @layer

```css
@layer reset, base, components, utilities;

@layer reset {
    * { margin: 0; padding: 0; box-sizing: border-box; }
}

@layer base {
    body { font-family: sans-serif; }
}

@layer components {
    .button { padding: 1em; }
}

@layer utilities {
    .hidden { display: none; }
}
```

```text
@layer:

  - Cascade layers.
  - Orden de prioridad: el último gana dentro del mismo layer.
  - Entre layers: el último layer gana.
  - Sin layer: menor prioridad que cualquier layer.
  - Útil para organizar CSS de gran tamaño.
```

### Layer anidados

```css
@layer components {
    .button { padding: 1em; }
    
    @layer themes {
        .button.dark { background: black; }
    }
}
```

```text
Anidamiento:

  - Layers dentro de layers.
  - Útil para organizar temas.
  - El orden de declaración importa.
```

## @property

```css
@property --gradient-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
}

.element {
    --gradient-angle: 90deg;
    background: linear-gradient(var(--gradient-angle), red, blue);
    transition: --gradient-angle 0.3s;
}

.element:hover {
    --gradient-angle: 180deg;
}
```

```text
@property:

  - Declara el tipo de una custom property.
  - syntax: el tipo (length, color, angle, etc.).
  - initial-value: el valor por defecto.
  - inherits: si se hereda.
  - Permite animaciones reales sobre variables.
```

## @font-face

```css
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
```

```text
@font-face:

  - Define una fuente personalizada.
  - Múltiples src para compatibilidad.
  - font-display: comportamiento de carga.
  - Ver la nota 12 sobre fonts para más detalle.
```

## @page

```css
@page {
    size: A4;
    margin: 2cm;
}

@page :first {
    /* La primera página */
    margin-top: 4cm;
}

@page book {
    /* Para páginas dentro del elemento con class="book" */
    @top-right {
        content: counter(page);
    }
}
```

```text
@page:

  - Para CSS de impresión.
  - Define márgenes, tamaño, headers/footers.
  - Pseudo-classes: :first, :left, :right.
  - Útil para imprimir artículos.
```

## @counter-style

```css
@counter-style fancy {
    system: cyclic;
    symbols: "🌟" "🌙" "☀️";
    suffix: " ";
}

ol {
    list-style: fancy;
}
```

```text
@counter-style:

  - Define un estilo de numeración personalizado.
  - system: cyclic, alphabetic, symbolic, additive, etc.
  - symbols: los símbolos a usar.
  - suffix, prefix: puntuación.
```

## @charset

```css
@charset "UTF-8";
```

```text
@charset:

  - Solo al inicio del archivo.
  - Define el encoding.
  - UTF-8 es el estándar.
  - Raramente necesario hoy.
```

## @namespace

```css
@namespace svg url("http://www.w3.org/2000/svg");

@namespace html url("http://www.w3.org/1999/xhtml");

svg | circle { /* selectores del namespace SVG */ }
```

```text
@namespace:

  - Para SVG, MathML, etc.
  - Permite selectores con prefijo.
  - Raramente necesario en HTML.
```

## Cascada y at-rules

```text
Orden de la cascada:

  1. Transitions (animaciones).
  2. !important user agent.
  3. !important user.
  4. !important author.
  5. Animations.
  6. Author normal.
  7. User normal.
  8. User agent.

Dentro del "author normal":
  - @layer (orden importa).
  - Specificity.
  - Orden de declaración.
```

## @media vs @container

```text
@media:

  - Responde al viewport.
  - Cambia el layout según el tamaño de pantalla.
  - Bueno para layouts globales.

@container:

  - Responde al contenedor.
  - Cambia el componente según el espacio.
  - Bueno para componentes reutilizables.
```

## Mobile-first vs Desktop-first

```css
/* Mobile-first: empezamos con el caso pequeño */
.button {
    padding: 0.5em;
}

@media (min-width: 768px) {
    .button {
        padding: 1em;
    }
}

/* Desktop-first: empezamos con el caso grande */
.button {
    padding: 1em;
}

@media (max-width: 767px) {
    .button {
        padding: 0.5em;
    }
}
```

> [!tip] Mobile-first es el estándar
> El libro es claro: empiezar por mobile es más fácil. Es más simple añadir que quitar.

## Errores comunes

```css
/* Mal: @media sin condiciones */
@media {
    .button { color: red; }
}

/* Mal: breakpoint random */
@media (max-width: 767px) { }  /* 767? */
@media (max-width: 768px) { }

/* Mal: anidamiento de @media */
@media (max-width: 768px) {
    @media (orientation: landscape) { }  /* no funciona */
}

/* Mejor: condiciones combinadas */
@media (max-width: 768px) and (orientation: landscape) { }
```

## Trucos comunes

### Hover solo en dispositivos con hover

```css
.button:hover {
    background: red;
}

@media (hover: none) {
    /* En touch-only, no hacer nada con hover */
    .button:hover {
        background: inherit;
    }
}
```

### Theme switcher

```css
:root {
    --bg: white;
    --text: black;
}

:root[data-theme="dark"] {
    --bg: #1a1a1a;
    --text: white;
}

@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
        --bg: #1a1a1a;
        --text: white;
    }
}
```

### Container queries para cards

```css
.card-grid {
    container-type: inline-size;
    container-name: grid;
}

@container grid (min-width: 600px) {
    .card {
        display: grid;
        grid-template-columns: 1fr 2fr;
    }
}
```

### Soporte progresivo

```css
/* Sin grid */
.container {
    display: flex;
    flex-wrap: wrap;
}

/* Con grid */
@supports (display: grid) {
    .container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }
}
```

## Resumen en tres frases

- **@media queries** aplican CSS según el viewport. Mobile-first con `min-width` es el patrón estándar.
- **@container queries** son el "media queries para componentes". Permiten que un componente cambie según el espacio disponible.
- **@supports** y **@layer** permiten feature detection y organización de cascade. Combinados con @property, dan CSS moderno y mantenible.

## Próximos pasos

- [[18-glosario-y-referencias|Glosario y referencias]]: cierre de la wiki. Glosario CSS, libros de referencia, sitios web clave y herramientas para profundizar.
- [[19-epilogo-y-claves|Epílogo y claves]]: cierre con ideas recurrentes y cómo seguir.
