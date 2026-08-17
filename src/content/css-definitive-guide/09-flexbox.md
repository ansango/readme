---
title: "Flexbox"
description: "El primer modelo de layout moderno. Cómo distribuir espacio en una dimensión, alinear y centrar elementos de manera predecible. La herramienta principal para UI components"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, flexbox, layout, alignment]
---

# Flexbox

> [!abstract] Resumen
> Esta nota cubre el capítulo 11 del libro: **Flexbox**, el primer modelo de layout moderno de CSS. Permite distribuir espacio en una dimensión, alinear elementos, centrar contenido y crear layouts flexibles. La herramienta principal para UI components como navbars, cards, listas y formularios.

## Por qué flexbox

Antes de flexbox, los layouts se hacían con `float`, `position`, `inline-block` y muchos hacks. Flexbox **resolvió el problema** de distribuir espacio en una dimensión.

```text
Problemas que flexbox resolvió:

  - Centrar vertical y horizontalmente.
  - Distribuir espacio entre items.
  - Hacer que los items crezcan o se encojan.
  - Alinear en el eje principal.
  - Alinear en el eje secundario.
  - Reordenar items.
```

```text
Flexbox vs Grid:

  Flexbox: layout en 1D (una fila O una columna).
  Grid: layout en 2D (filas Y columnas).

  Usa flexbox para:
    - Navbars, sidebars, cards, listas.
    - Cualquier cosa en una dimensión.

  Usa grid para:
    - Layouts de página, grids complejos.
    - Cualquier cosa en 2D.
```

## Conceptos básicos

```css
.container {
    display: flex;
}
```

```text
Conceptos:

  - Flex container: el padre con display: flex.
  - Flex items: los hijos directos.
  - Main axis: el eje principal (horizontal por default).
  - Cross axis: el eje perpendicular.
  - Main start / main end: inicio y fin del eje principal.
  - Cross start / cross end: inicio y fin del eje cruzado.
```

```
    flex-direction: row (default)

    main start
    ┌───────┬───────┬───────┐
    │ item1 │ item2 │ item3 │
    └───────┴───────┴───────┘
                              main end
    cross start
    cross end
```

## flex-direction

```css
.container {
    display: flex;
    flex-direction: row;            /* horizontal, default */
    flex-direction: row-reverse;    /* horizontal invertido */
    flex-direction: column;         /* vertical */
    flex-direction: column-reverse; /* vertical invertido */
}
```

```text
flex-direction:

  - row: horizontal, start a end.
  - row-reverse: horizontal, end a start.
  - column: vertical, top a bottom.
  - column-reverse: vertical, bottom a top.
```

## flex-wrap

```css
.container {
    display: flex;
    flex-wrap: nowrap;     /* default, todo en una línea */
    flex-wrap: wrap;       /* varios items por línea */
    flex-wrap: wrap-reverse; /* varios items en líneas invertidas */
}
```

```text
flex-wrap:

  - nowrap: default, sin saltos.
  - wrap: items saltan a la siguiente línea.
  - wrap-reverse: items saltan a la línea de arriba.
```

### flex-flow shorthand

```css
.container {
    flex-flow: row wrap;       /* flex-direction + flex-wrap */
    flex-flow: column nowrap;
}
```

## justify-content

Cómo distribuir los items en el **eje principal**:

```css
.container {
    display: flex;
    justify-content: flex-start;     /* default */
    justify-content: flex-end;
    justify-content: center;
    justify-content: space-between;  /* espacio entre items */
    justify-content: space-around;   /* espacio alrededor */
    justify-content: space-evenly;   /* espacio equitativo */
}
```

```text
justify-content:

  - flex-start: items al inicio.
  - flex-end: items al final.
  - center: items centrados.
  - space-between: primer y último al borde, resto espaciado.
  - space-around: espacio igual alrededor de cada item.
  - space-evenly: espacio igual ENTRE items.
```

### Visualización

```
flex-start:        [item1][item2][item3]
flex-end:                     [item1][item2][item3]
center:                [item1][item2][item3]
space-between:    [item1]      [item2]      [item3]
space-around:   [item1]    [item2]    [item3]
space-evenly:   [item1]    [item2]    [item3]
```

## align-items

Cómo alinear los items en el **eje cruzado**:

```css
.container {
    display: flex;
    align-items: stretch;     /* default, estira al alto */
    align-items: flex-start;  /* al inicio */
    align-items: flex-end;    /* al final */
    align-items: center;      /* centrado */
    align-items: baseline;     /* alineado por la base del texto */
}
```

```text
align-items:

  - stretch: estira al alto del contenedor.
  - flex-start: al inicio del cross axis.
  - flex-end: al final.
  - center: centrado.
  - baseline: alineado por la base del texto.
```

### Visualización

```
stretch:    los items se estiran al alto del contenedor
flex-start: alineados al top
flex-end:   alineados al bottom
center:     centrados verticalmente
baseline:   alineados por la base del texto
```

## align-content

Cuando hay **varias líneas** (flex-wrap: wrap), cómo se distribuyen:

```css
.container {
    display: flex;
    flex-wrap: wrap;
    align-content: stretch;       /* default */
    align-content: flex-start;
    align-content: flex-end;
    align-content: center;
    align-content: space-between;
    align-content: space-around;
    align-content: space-evenly;
}
```

```text
align-content:

  - Similar a justify-content, pero en el cross axis.
  - Solo aplica cuando hay múltiples líneas.
  - Con una línea, no tiene efecto.
```

## gap

```css
.container {
    display: flex;
    gap: 1rem;           /* ambos ejes */
    gap: 1rem 2rem;      /* row | column */
    row-gap: 1rem;
    column-gap: 2rem;
}
```

```text
gap:

  - Espacio entre items.
  - row-gap: espacio entre filas.
  - column-gap: espacio entre columnas.
  - Funciona en flex, grid, multi-column.
  - Alternativa moderna a márgenes.
```

> [!tip] gap reemplaza a margin en flexbox
> El libro es claro: si quieres espacio entre items, usa `gap`. Los margin en flexbox hijos **no se colapsan** y crean espacios no deseados.

## align-self

Sobreescribe align-items para un item específico:

```css
.item-1 {
    align-self: flex-end;
}

.item-2 {
    align-self: center;
}
```

```text
align-self:

  - auto: usa el align-items del padre.
  - flex-start, flex-end, center, baseline, stretch.
  - Solo afecta a un item.
```

## Order

Reordena los items sin tocar el HTML:

```css
.item-1 { order: 3; }
.item-2 { order: 1; }
.item-3 { order: 2; }

/* Render: item2, item3, item1 */
```

```text
order:

  - Default: 0.
  - Valor más bajo: aparece antes.
  - Mismo valor: el orden del DOM.
  - Útil para reordenar responsive.
  - Cuidado: afecta el orden de tabulación y accesibilidad.
```

## flex-grow

Cómo crece el item cuando sobra espacio:

```css
.item-1 {
    flex-grow: 1;  /* ocupa el espacio sobrante */
}

.item-2 {
    flex-grow: 2;  /* ocupa el doble que .item-1 */
}
```

```text
flex-grow:

  - 0: no crece (default).
  - 1: ocupa el espacio sobrante.
  - 2: el doble que un item con flex-grow: 1.
  - El espacio se distribuye proporcionalmente.
```

### Ejemplo completo

```css
.container {
    display: flex;
}

.item-1 { flex-grow: 1; }
.item-2 { flex-grow: 1; }
.item-3 { flex-grow: 2; }

/* Si el container es 600px y los items tienen 100px cada uno:
   Sobra: 600 - 300 = 300px.
   Se distribuye: 100 a item-1, 100 a item-2, 200 a item-3.
   Tamaño final: 200, 200, 300.
*/
```

## flex-shrink

Cómo se encoge el item cuando no hay espacio:

```css
.item {
    flex-shrink: 1;     /* default, se encoge */
    flex-shrink: 0;     /* no se encoge */
    flex-shrink: 2;     /* se encoge el doble */
}
```

```text
flex-shrink:

  - 1: se encoge proporcionalmente (default).
  - 0: no se encoge (mantiene su tamaño).
  - N: se encoge N veces más.
  - Útil para evitar que un item se haga muy pequeño.
```

## flex-basis

El **tamaño inicial** antes de distribuir el espacio:

```css
.item {
    flex-basis: 200px;     /* tamaño inicial de 200px */
    flex-basis: 50%;       /* 50% del contenedor */
    flex-basis: auto;       /* el width del item (default) */
    flex-basis: content;    /* el contenido (default en column) */
}
```

```text
flex-basis:

  - El tamaño "base" del item.
  - El espacio se distribuye después de flex-basis.
  - auto: usa el width/height según flex-direction.
  - content: el contenido del item.
```

## flex shorthand

```css
.item {
    flex: 1;           /* flex-grow: 1, flex-shrink: 1, flex-basis: 0 */
    flex: auto;       /* flex-grow: 1, flex-shrink: 1, flex-basis: auto */
    flex: none;       /* flex-grow: 0, flex-shrink: 0, flex-basis: auto */
    flex: 1 1 200px;  /* grow | shrink | basis */
    flex: 1 0 auto;   /* grow | shrink | basis */
}
```

```text
flex:

  - Un valor: flex-grow.
  - Dos valores: flex-grow, flex-shrink.
  - Tres valores: flex-grow, flex-shrink, flex-basis.
  - auto: 1 1 auto.
  - none: 0 0 auto.
  - initial: 0 1 auto.
```

> [!tip] flex: 1 es el más común
> El libro señala: `flex: 1` (también `flex: 1 1 0`) es el patrón más usado. El item crece y se encoge para llenar el espacio.

## El famoso truco del centrado

```css
.center {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

```text
Centrado perfecto:

  - justify-content: center: horizontal.
  - align-items: center: vertical.
  - El item se centra en ambos ejes.
  - Funciona con cualquier tamaño de item.
  - Funciona con cualquier tamaño de contenedor.
```

## Navegación típica

```css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em;
}

.nav-links {
    display: flex;
    gap: 1em;
    list-style: none;
}
```

## Card grid simple

```css
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
}

.card {
    flex: 1 1 300px;  /* crece y se encoge, base 300px */
    padding: 1em;
    border: 1px solid #ccc;
    border-radius: 8px;
}
```

```text
Card grid:

  - flex-wrap: wrap: múltiples líneas.
  - flex: 1 1 300px: cada card ocupa al menos 300px.
  - gap: espacio entre cards.
  - Solución simple para un grid de cards.
```

## Sticky footer

```css
body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

main {
    flex: 1;  /* ocupa el espacio sobrante */
}

footer {
    /* tamaño natural */
}
```

```text
Sticky footer:

  - El body es un flex container.
  - main crece para ocupar el espacio.
  - El footer queda abajo.
  - Sin flexbox, esto requería JavaScript.
```

## Centrar con margin auto

```css
.container {
    display: flex;
}

.item {
    margin: auto;  /* centrado en ambos ejes */
}
```

```text
margin auto en flex:

  - En flex items, margin: auto se expande.
  - Útil para empujar un item al final.
  - margin-left: auto empuja a la derecha.
```

## Casos de estudio

### Navbar

```css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em 2em;
    background: #333;
    color: white;
}

.navbar-brand {
    font-size: 1.5em;
    font-weight: bold;
}

.navbar-links {
    display: flex;
    gap: 1em;
    list-style: none;
}

.navbar-link {
    color: white;
    text-decoration: none;
}
```

### Card

```css
.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    padding: 1em;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.card-body {
    flex: 1;  /* empuja el footer al final */
}

.card-footer {
    display: flex;
    justify-content: space-between;
}
```

### Form

```css
.form {
    display: flex;
    flex-direction: column;
    gap: 1em;
    max-width: 400px;
    margin: 0 auto;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
}

.form-actions {
    display: flex;
    gap: 0.5em;
    justify-content: flex-end;
}
```

## min-width: 0 y flexbox

```css
.flex-container {
    display: flex;
}

.flex-item {
    /* Por defecto, min-width: auto */
    /* Los items no se encogen más allá de su contenido */
    min-width: 0;  /* permite que se encojan */
}
```

```text
min-width: 0:

  - El valor default es auto, no 0.
  - Los items no se encogen más allá de su contenido natural.
  - Para layouts flexibles, hay que poner min-width: 0.
```

## Errores comunes

```css
/* Mal: height: 100% en flex item */
.flex-item {
    height: 100%;  /* a veces no funciona */
}

/* Mejor: stretch (default) */
.flex-container {
    align-items: stretch;
}

/* Mal: margin en items */
.flex-item {
    margin: 1em;  /* crea espacio INESPERADO */
}

/* Mejor: gap */
.flex-container {
    gap: 1em;
}

/* Mal: text-align en flex */
.flex-container {
    text-align: center;  /* no funciona */
}

/* Mejor: justify-content */
.flex-container {
    justify-content: center;
}
```

## Resumen en tres frases

- **Flexbox** es un layout unidimensional: alinea y distribuye elementos en una fila o columna. La herramienta principal para UI components.
- Las propiedades clave son `flex-direction`, `justify-content` (eje principal), `align-items` (eje cruzado), `flex-wrap`, `gap`, `flex-grow`, `flex-shrink` y `flex-basis`.
- El truco más útil es `display: flex; justify-content: center; align-items: center;` para centrar perfectamente en ambos ejes.

## Próximos pasos

- [[10-grid-layout|Grid Layout]]: el modelo de layout bidimensional. Permite crear grids complejos con filas y columnas, ideal para layouts de página completos.
