---
title: "Basic visual formatting"
description: "El modelo de caja. Cómo CSS calcula el tamaño y posición de los elementos. Display, sizing, block vs inline, el containing block"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, modelo-de-caja, box-model, display, layout]
---

# Basic visual formatting

> [!abstract] Resumen
> Esta nota cubre el capítulo 6 del libro: el **modelo de caja** básico. Cómo CSS decide el tamaño y la posición de los elementos. Los conceptos de **containing block**, **display**, **block vs inline**, **width/height**, **sizing algorithm** y los cambios que introduce el box-sizing. La base para entender todos los capítulos de layout siguientes.

## El modelo de caja

Todo elemento en CSS es una **caja rectangular**. Esta es la idea central:

```text
La caja:

  ┌─────────────────────────────┐
  │           margin              │  ← espacio exterior
  │  ┌───────────────────────┐   │
  │  │      border           │   │  ← línea del borde
  │  │  ┌───────────────┐   │   │
  │  │  │   padding     │   │   │  ← espacio interior
  │  │  │  ┌─────────┐   │   │   │
  │  │  │  │ content │   │   │   │  ← el contenido
  │  │  │  └─────────┘   │   │   │
  │  │  └───────────────┘   │   │
  │  └───────────────────────┘   │
  └─────────────────────────────┘
```

> [!tip] Pieza por pieza
> Las notas [[06-padding-borders-outlines-margins|06]], [[07-backgrounds-y-gradients|07]] y [[08-floating-and-positioning|08]] profundizan en cada parte. Esta nota da el marco.

## Display

La propiedad `display` es la más importante de CSS. Define cómo se ve una caja:

```css
display: block;             /* por defecto para <div>, <p>, <h1> */
display: inline;            /* por defecto para <span>, <a>, <em> */
display: inline-block;      /* híbrido */
display: flex;              /* flexbox */
display: grid;              /* grid */
display: none;              /* oculto, no ocupa espacio */
display: contents;          /* solo contenido, no la caja */
display: flow-root;         /* nuevo block formatting context */
```

> [!quote] "El display es el ADN del layout."
> El libro es claro: `display` define el comportamiento del elemento. Todo el layout depende de él.

### Block vs inline

```css
/* Block: ocupa todo el ancho, salto de línea */
div { display: block; }

/* Inline: solo el espacio del contenido */
span { display: inline; }
```

```text
Block:

  - Salto de línea antes y después.
  - width y height se respetan.
  - padding, margin, border aplicados a los cuatro lados.
  - Por defecto: <div>, <p>, <h1>, <ul>, <li>, <section>.

Inline:

  - Sin salto de línea.
  - width y height NO se respetan.
  - padding y margin verticales NO afectan al line-height.
  - Por defecto: <span>, <a>, <em>, <strong>, <img>.
```

### Inline-block

```css
.button {
    display: inline-block;
    padding: 0.5em 1em;
    border: 1px solid #ccc;
}
```

```text
Inline-block:

  - Inline por fuera (no fuerza newline).
  - Block por dentro (respeta width/height).
  - Muy útil para botones, badges.
```

### Display none

```css
.hidden {
    display: none;
}
```

```text
display: none:

  - El elemento NO se renderiza.
  - NO ocupa espacio en el layout.
  - NO es accesible para screen readers.
  - Para accesibilidad, usar visibility: hidden o aria-hidden.
```

### Visibility

```css
.invisible {
    visibility: hidden;
}

.collapse {
    visibility: collapse;  /* table-specific */
}
```

```text
visibility:

  - hidden: no visible, pero ocupa espacio.
  - visible: el default.
  - collapse: en tablas, quita la fila/columna.
  - Más accesible que display: none.
```

## Containing block

El **containing block** es el rectángulo de referencia para el elemento:

```text
Reglas:

  - El containing block del elemento raíz es el viewport.
  - Para elementos estáticos, es el content box del padre.
  - Para elementos con posición, depende del position.
```

```css
.parent {
    width: 500px;
    padding: 20px;
}

.child {
    width: 50%;  /* 250px - relativo al content box del padre */
}
```

> [!tip] El containing block es el padre
> Para la mayoría de cálculos, el containing block es el **content box** del padre (no el padding box ni el border box).

## Box sizing

```css
/* Default: content-box */
.box {
    box-sizing: content-box;
    width: 200px;
    padding: 20px;
    border: 1px solid #000;
    /* El width real es 200 + 40 + 2 = 242px */
}

/* Mejor: border-box */
.box {
    box-sizing: border-box;
    width: 200px;
    padding: 20px;
    border: 1px solid #000;
    /* El width real es 200px, content = 158px */
}
```

```text
box-sizing:

  - content-box: width = solo content.
  - border-box: width = content + padding + border.
  - Con border-box, el width es lo que tú specifies.
  - Con content-box, el width es solo el contenido.
```

### Reset recomendado

```css
* {
    box-sizing: border-box;
}

*, *::before, *::after {
    box-sizing: border-box;
}
```

```text
Reset:

  - Aplicar border-box a todos los elementos.
  - Hace el width más predecible.
  - Es el comportamiento que la mayoría quiere.
```

## Width y height

```css
.box {
    width: 100px;
    height: 50px;
}

.box-fluid {
    width: 100%;
    max-width: 800px;
    min-width: 200px;
}
```

```text
Width/Height:

  - Aceptan length, percentage, auto.
  - max-width: límite superior.
  - min-width: límite inferior.
  - auto: el navegador decide.
```

### Auto

```css
.box {
    width: auto;     /* toma el espacio disponible */
    height: auto;    /* toma el contenido */
}
```

```text
Auto:

  - En block: ocupa todo el ancho disponible.
  - En inline: solo el contenido.
  - En flex/grid: lo que el algoritmo decida.
  - En absolute: el contenido si no hay width.
```

## Replaced elements

```css
img {
    width: 100%;
    height: auto;
}
```

```text
Replaced elements:

  - Su contenido es externo (img, video, input).
  - CSS no afecta al contenido.
  - Si no pones width/height, el tamaño es el natural.
  - Con width: 100%, height: auto, escalan proporcionalmente.
```

> [!tip] Imágenes responsive
> El libro recomienda: `img { max-width: 100%; height: auto; }` para que las imágenes escalen pero no excedan su tamaño natural.

## Width algorithm

CSS calcula el width de un elemento con un algoritmo:

```text
Algoritmo:

  1. width: explícito.
  2. Si no hay width, depende de display:
     - block: ocupa todo el width disponible.
     - inline: solo el contenido.
  3. max-width: limita el width.
  4. min-width: limita el width.
  5. Si nada de eso, shrink-to-fit.
```

```css
.box {
    /* El navegador aplica: */
    /* max(min(max-width, width), min(min-width, available)) */
}
```

> [!note] No memorices el algoritmo
> El libro dice: "entiende la idea, no memorices cada paso". El navegador hace los cálculos por ti.

## Height

```css
.parent {
    height: 100vh;
}

.child {
    height: 100%;  /* 100% del height del padre */
}
```

> [!warning] Height: 100% tiene truco
> El height del padre debe estar **definido** para que `height: 100%` funcione. Si el padre tiene `height: auto`, el hijo tiene height: 0.

### Min-height y max-height

```css
.section {
    min-height: 100vh;  /* al menos la altura del viewport */
    max-height: 500px;   /* como máximo 500px */
}
```

```text
Min-height:

  - Útil para "esta sección debe ocupar la pantalla".
  - Si el contenido es más, se expande.
  - Si el contenido es menos, mantiene el tamaño.

Max-height:

  - Limita el crecimiento.
  - Útil para contenedores que no deben ser gigantes.
```

## Display: flow-root

```css
.container {
    display: flow-root;
}
```

```text
flow-root:

  - Crea un nuevo block formatting context.
  - Contiene los floats.
  - Sin trucos de overflow: hidden.
  - Solución limpia para el clásico problema de floats.
```

> [!tip] flow-root > clearfix
> El libro recomienda: usa `display: flow-root` en lugar de `.clearfix { content: ""; display: block; clear: both; }`. Es la solución moderna.

## Display: contents

```css
.wrapper {
    display: contents;
}
```

```text
contents:

  - El wrapper es "transparente".
  - Solo sus hijos son visibles para el layout.
  - Útil para grouping sin afectar al layout.
```

> [!warning] Accesibilidad
> El libro advierte: `display: contents` puede romper la accesibilidad porque el wrapper desaparece del árbol de accesibilidad. Úsalo con cuidado.

## Inline formatting

```css
span {
    display: inline;
    padding: 0.5em;  /* horizontal sí, vertical no afecta al line-height */
    margin: 0.5em;   /* horizontal sí, vertical no */
}
```

```text
Inline:

  - El line-height determina la altura de la línea.
  - padding y margin horizontales funcionan.
  - padding y margin verticales NO afectan al line-height (pero sí al background).
  - border sí se ve en los cuatro lados.
```

### Subrayados visuales

```css
a {
    text-decoration: none;
    border-bottom: 1px solid currentColor;
    padding-bottom: 2px;
}
```

```text
Subrayados:

  - text-decoration: underline, line-through, etc.
  - Tienen su propio color y estilo.
  - Para subrayados custom: border-bottom.
```

## Box dimensions

```css
.box {
    width: 200px;
    height: 100px;
    padding: 1em;
    border: 2px solid;
    margin: 1em;
}
```

```text
Dimensiones:

  - width, height: el contenido.
  - padding: espacio dentro del border.
  - border: la línea del borde.
  - margin: espacio fuera del border.
```

### Cálculo del tamaño total

```css
.box {
    width: 200px;
    padding: 20px;
    border: 5px;
    margin: 10px;
}

/* Con content-box:
   Total = 200 + 40 + 10 + 20 = 270px (ancho real)
   El elemento ocupa 250px (content + padding + border)
   + 20px de margin (espacio exterior)

   Con border-box:
   El width es 200px TOTAL.
   El content = 200 - 40 - 10 = 150px
*/
```

## El algoritmo de block sizing

```css
/* El navegador hace estos pasos: */

/* 1. width preferido */
.box { width: 200px; }

/* 2. Si no hay width, block ocupa todo el espacio disponible */
.box { width: auto; }  /* toma el espacio */

/* 3. max-width limita */
.box { max-width: 300px; }

/* 4. min-width garantiza */
.box { min-width: 100px; }
```

## Min-width: 0 por defecto

```css
.grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
}

.item {
    /* Por defecto, min-width: auto = no shrink más allá del contenido */
    /* Para que los items se encojan, hay que poner min-width: 0 */
    min-width: 0;
}
```

> [!tip] Flexbox y Grid tienen min-width: auto
> El libro advierte: por defecto, los items de flexbox/grid no se encogen más allá de su contenido. Para layouts flexibles, usa `min-width: 0`.

## Margin collapsing

```css
.box1 { margin-bottom: 20px; }
.box2 { margin-top: 30px; }

/* El espacio entre ambos es 30px, no 50px. */
```

```text
Margin collapsing:

  - Los margins verticales de elementos adyacentes se "combinan".
  - El espacio final es el mayor, no la suma.
  - NO aplica a horizontal.
  - NO aplica a flexbox/grid/inline.
  - NO aplica a elementos con padding o border.
```

> [!tip] Herramientas contra el margin collapsing
> El libro apunta: `display: flex`, `overflow: hidden`, `padding: 1px` en el padre, o `margin: 0` en el hijo. Personalmente, prefiero flex.

## Centrar elementos

```css
/* Centrar horizontal (block con width) */
.box {
    margin: 0 auto;
    width: 80%;
}

/* Centrar absoluto */
.box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* Centrar con flexbox */
.parent {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Centrar con grid */
.parent {
    display: grid;
    place-items: center;
}
```

## Vertical alignment

```css
/* inline */ 
span {
    vertical-align: middle;  /* baseline, sub, super, top, text-top, middle, bottom, text-bottom */
}

/* table-cell */
.cell {
    vertical-align: middle;
}

/* flex/grid */
.cell {
    display: flex;
    align-items: center;
}
```

> [!warning] Vertical-align no hace lo que crees
> El libro es claro: `vertical-align` solo aplica a **inline elements** y **table cells**. Para centrar verticalmente divs, usa flexbox o grid.

## Overflow

```css
.box {
    overflow: visible;   /* default */
    overflow: hidden;    /* esconde el exceso */
    overflow: scroll;    /* scroll siempre */
    overflow: auto;      /* scroll si es necesario */
}
```

```text
Overflow:

  - visible: el contenido se sale de la caja.
  - hidden: el contenido se corta.
  - scroll: siempre hay scrollbar.
  - auto: scroll solo cuando es necesario.
```

### Overflow-x y overflow-y

```css
.box {
    overflow-x: auto;
    overflow-y: hidden;
}
```

```text
Overflow-x y -y:

  - Específicos para horizontal y vertical.
  - Si uno es visible y el otro no, el visible se convierte en auto.
```

## Display: inline-block quirks

```css
.parent {
    font-size: 0;  /* truco para eliminar el espacio entre inline-blocks */
}

.parent .child {
    display: inline-block;
    font-size: 16px;  /* reset */
}
```

> [!tip] El espacio entre inline-blocks
> El libro apunta: alinear inline-blocks deja un espacio en blanco. Truco: `font-size: 0` en el padre.

## Tabla de display

```text
display          Caso de uso
─────────────────────────────────────────────────────
block            Secciones, párrafos.
inline           Texto.
inline-block     Botones, badges.
flex             Layout 1D.
grid             Layout 2D.
none             Ocultar.
flow-root        Contener floats.
contents         Grouping invisible.
table            Tablas.
inline-table     Tablas inline.
table-row        Filas de tabla.
table-cell       Celdas de tabla.
list-item        Items de lista.
```

## Resumen en tres frases

- El **modelo de caja** es el marco central: margin, border, padding, content. Cada propiedad CSS opera sobre esta caja.
- El **display** define el tipo de caja: block, inline, flex, grid. Cambiar display es la decisión más poderosa en CSS.
- El **box-sizing** determina cómo se calcula el width: con `border-box`, el width es lo que tú specifies; con `content-box`, hay que sumar padding y border.

## Próximos pasos

- [[06-padding-borders-outlines-margins|Padding, borders, outlines, margins]]: las cuatro propiedades del box model. Margin collapsing, padding shorthand, border styles, outlines y los trucos que diferencian a un desarrollador que entiende el modelo de caja.
