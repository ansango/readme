---
title: "Floating and positioning"
description: "Cómo sacar las cajas del flujo normal. Float, position (relative, absolute, fixed, sticky), z-index. La base para layouts complejos antes de flexbox y grid"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, float, position, z-index, layout]
---

# Floating and positioning

> [!abstract] Resumen
> Esta nota cubre el capítulo 10 del libro: cómo sacar las cajas del **flujo normal** del documento. La propiedad `float` (la técnica clásica para layouts con texto alrededor), `position` (relative, absolute, fixed, sticky), `z-index` (control del orden de apilamiento) y los trucos clásicos. La base para layouts complejos antes de flexbox y grid.

## El flujo normal

Por defecto, los elementos siguen el **flujo normal** del documento:

```text
Flujo normal:

  - block elements: en líneas, ocupando todo el ancho.
  - inline elements: en líneas, sin saltos.
  - Los elementos se acomodan según su display.
```

> [!tip] El flujo normal es el "background"
> El libro es claro: el flujo normal es lo que pasa cuando no haces nada especial. Float y position son **excepciones** para casos específicos.

## Float

La propiedad `float` saca al elemento del flujo normal y lo coloca a un lado:

```css
img {
    float: left;
    margin-right: 1em;
}

.sidebar {
    float: right;
    width: 200px;
    margin-left: 1em;
}
```

```text
Float:

  - left: el elemento flota a la izquierda.
  - right: a la derecha.
  - none: el default (no flota).
  - El texto y los elementos inline fluyen alrededor.
```

### Cómo funciona float

```css
/* Imágenes con texto alrededor */
.article {
    width: 600px;
}

.article img {
    float: left;
    margin: 0 1em 1em 0;
}

.article p {
    /* El texto fluye alrededor de la imagen */
}
```

```text
Float paso a paso:

  1. El elemento se saca del flujo normal.
  2. Se coloca a la izquierda (o derecha).
  3. Los elementos inline y de texto fluyen alrededor.
  4. Los elementos block se ignoran (siguen en el flujo).
  5. El padre "pierde" la altura del float.
```

> [!warning] Float es antiguo
> El libro recoge: float fue muy usado para layouts en los 2000s. Ahora, flexbox y grid lo han reemplazado. Float se usa solo para **texto alrededor de imágenes**.

### clear

```css
img {
    float: left;
}

.clear {
    clear: left;       /* no floats a la izquierda */
    clear: right;      /* no floats a la derecha */
    clear: both;       /* ningún float */
}
```

```text
Clear:

  - Evita que un elemento se coloque junto a un float.
  - Empuja el elemento por debajo del float.
  - Útil para finalizar un float.
```

### clearfix

```css
/* Técnica clásica */
.parent::after {
    content: "";
    display: block;
    clear: both;
}

/* Técnica moderna */
.parent {
    display: flow-root;
}
```

```text
Clearfix:

  - El problema: float no da altura al padre.
  - El clearfix (técnica clásica) cierra el float.
  - display: flow-root es la solución moderna.
  - El libro recomienda display: flow-root.
```

## Position

La propiedad `position` es más potente que float. Define cómo se posiciona el elemento:

```css
.box {
    position: static;     /* default */
    position: relative;   /* relativo a su posición normal */
    position: absolute;   /* relativo al containing block */
    position: fixed;      /* relativo al viewport */
    position: sticky;     /* híbrido entre relative y fixed */
}
```

### Position: static

```css
.box {
    position: static;  /* default */
}
```

```text
static:

  - El default.
  - Sigue el flujo normal.
  - top, right, bottom, left no tienen efecto.
  - z-index no tiene efecto.
```

### Position: relative

```css
.box {
    position: relative;
    top: 10px;
    left: 20px;
}
```

```text
relative:

  - El elemento se mueve desde su posición normal.
  - top/right/bottom/left lo desplazan.
  - El espacio original se mantiene.
  - Crea un "containing block" para descendientes absolute.
```

### Position: absolute

```css
.box {
    position: absolute;
    top: 10px;
    left: 20px;
}
```

```text
absolute:

  - El elemento se saca del flujo normal.
  - Se posiciona respecto al containing block más cercano.
  - El containing block es el ancestro position más cercano.
  - Si no hay, es el viewport.
  - Sin top/left/right/bottom, queda en su posición original.
```

### Position: fixed

```css
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
```

```text
fixed:

  - El elemento se posiciona respecto al viewport.
  - No se mueve con el scroll.
  - Se usa para modales, headers fijos, etc.
  - Cuidado: el ancestro con transform, filter, will-change crea un containing block.
```

### Position: sticky

```css
.header {
    position: sticky;
    top: 0;
}
```

```text
sticky:

  - Híbrido entre relative y fixed.
  - Se comporta como relative hasta que se "pega".
  - El top/left/etc. define cuándo se pega.
  - Muy útil para headers que se quedan arriba.
```

### Position: sticky en detalle

```css
.item {
    position: sticky;
    top: 60px;  /* se pega a 60px del top */
}

.parent {
    overflow: visible;  /* necesario para que funcione */
}
```

> [!tip] Sticky tiene truco
> El libro señala: `position: sticky` requiere que el **padre tenga overflow: visible** (no hidden ni auto) y que tenga altura suficiente para que el elemento tenga "espacio" para pegarse.

## Offsets

Las propiedades `top`, `right`, `bottom`, `left` funcionan con position != static:

```css
.box {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    /* Cubre todo el containing block */
}
```

```text
Offsets:

  - top, right, bottom, left.
  - Valores: length, percentage, auto.
  - Positivos: aleja del borde.
  - Negativos: acerca del borde.
  - Solo funcionan con position != static.
```

### Centrar con absolute

```css
.center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 100px;
}
```

```text
Centrar absolute:

  - top: 50%, left: 50%: esquina superior izquierda.
  - transform: translate(-50%, -50%): centrar el elemento.
  - Requiere width y height (o se ajusta al contenido).
```

## z-index

El **z-index** controla el orden de apilamiento:

```css
.modal {
    position: fixed;
    z-index: 100;
}

.tooltip {
    z-index: 10;
}

.content {
    z-index: 1;  /* por defecto */
}
```

```text
z-index:

  - Número: mayor, más encima.
  - Solo aplica a elementos con position != static.
  - Crea stacking contexts.
  - auto: usa el orden del DOM.
```

### Stacking contexts

```css
.modal {
    position: fixed;
    z-index: 100;
}

.modal-content {
    position: absolute;
    z-index: 50;  /* se ve detrás de modal sibling */
}

.modal-overlay {
    position: absolute;
    z-index: 9999;  /* se ve encima de modal-content */
}
```

```text
Stacking context:

  - Un elemento con position != static y z-index crea un stacking context.
  - Los descendientes del stacking context están apilados entre sí.
  - Pero no se mezclan con el exterior.
  - Cuidado: el modal-content no puede sobresalir más allá de su contexto.
```

> [!tip] z-index transparente
> El libro apunta: asigna z-index a los **elementos que lo necesitan**. Si asignas z-index a todo, acabas con un sistema imposible de debuggear.

## Overflow

```css
.box {
    overflow: visible;   /* default */
    overflow: hidden;    /* oculta el exceso */
    overflow: scroll;    /* scroll siempre */
    overflow: auto;      /* scroll si es necesario */
}
```

```text
Overflow:

  - visible: el contenido se sale.
  - hidden: el contenido se corta.
  - scroll: scrollbar siempre.
  - auto: scrollbar si es necesario.
```

### text-overflow

```css
.text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;  /* ... */
}
```

```text
text-overflow:

  - clip: corta sin puntos suspensivos.
  - ellipsis: añade "...".
  - Útil para títulos largos.
```

## Visibility

```css
.hidden {
    visibility: hidden;
}
```

```text
visibility:

  - visible: el default.
  - hidden: no visible, pero ocupa espacio.
  - collapse: en tablas, quita la fila/columna.
```

## Centrado vertical y horizontal

```css
/* Centrado horizontal */
.box {
    width: 200px;
    margin: 0 auto;
}

/* Centrado absoluto */
.box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* Centrado con flexbox (moderno) */
.parent {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Centrado con grid (más moderno) */
.parent {
    display: grid;
    place-items: center;
}
```

## Position sticky: detalles

```css
.header {
    position: sticky;
    top: 0;  /* se pega cuando el top llega a 0 */
}

.nav-second {
    position: sticky;
    top: 60px;  /* se pega debajo del header */
}
```

```text
Sticky:

  - El elemento se comporta como relative mientras se ve.
  - Cuando se sale del viewport, se pega al top.
  - Cada ancester con overflow distinto a visible rompe el sticky.
  - El sticky es por padre, no global.
```

> [!tip] Sticky en tablas
> El libro recomienda: `position: sticky` en `<th>` dentro de tablas largas para que las cabeceras se queden visibles al hacer scroll.

## Clip y clip-path

```css
.box {
    /* Recortar visualmente */
    overflow: hidden;
    
    /* Recortar con formas */
    clip-path: circle(50%);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
```

```text
Clip:

  - overflow: hidden: corta el contenido.
  - clip-path: recorta con formas.
  - No afecta al layout, solo a la visualización.
```

## Float vs position

```text
Float:

  - Texto alrededor de imágenes.
  - Layouts antiguos (no recomendado hoy).
  - El elemento es parte del flujo (parcialmente).

Position:

  - Posicionamiento preciso.
  - Modals, tooltips, dropdowns.
  - El elemento se saca del flujo.
```

## Errores comunes

```css
/* Mal: position absolute sin contenedor relative */
.parent {
    /* sin position: relative */
}

.child {
    position: absolute;
    top: 0;
    /* se posiciona respecto al viewport, no al padre */
}

/* Mal: z-index sin position */
.box {
    z-index: 100;  /* no funciona */
    position: relative;  /* necesario */
}
```

## Trucos clásicos

### Centrar un modal

```css
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
}

.modal {
    background: white;
    padding: 2em;
    border-radius: 8px;
    max-width: 500px;
}
```

### Header sticky

```css
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Texto sobre imagen

```css
.hero {
    position: relative;
    height: 400px;
}

.hero-image {
    position: absolute;
    inset: 0;
    background: url("hero.jpg") center / cover;
}

.hero-text {
    position: absolute;
    bottom: 2em;
    left: 2em;
    color: white;
}
```

### Dropdown menu

```css
.dropdown {
    position: relative;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    display: none;
    background: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dropdown:hover .dropdown-menu {
    display: block;
}
```

## Resumen en tres frases

- **Float** es antiguo y útil solo para texto alrededor de imágenes. Para layouts, usa flexbox o grid.
- **Position** es más versátil: static (default), relative (desplazamiento), absolute (fuera del flujo), fixed (al viewport), sticky (híbrido).
- **z-index** controla el orden de apilamiento, pero requiere position != static. Asignar z-index a todo lleva a pesadillas.

## Próximos pasos

- [[09-flexbox|Flexbox]]: el primer modelo de layout moderno. Cómo distribuir espacio en una dimensión, alinear y centrar elementos de manera predecible. La herramienta principal para UI components.
