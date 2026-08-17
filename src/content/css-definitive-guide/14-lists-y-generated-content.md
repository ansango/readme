---
title: "Lists y generated content"
description: "Cómo las listas y el contenido generado se estilizan en CSS. List markers, counters, content, comillas y los trucos con ::before y ::after"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, lists, counters, content, markers]
---

# Lists y generated content

> [!abstract] Resumen
> Esta nota cubre el capítulo 16 del libro: cómo CSS maneja las **listas** y el **contenido generado**. List markers (bullets, números), counters automáticos, las propiedades `content`, `quotes` y los trucos con `::before` y `::after`. Una herramienta potente para añadir estructura visual sin HTML extra.

## Tipos de listas

```html
<!-- Lista desordenada -->
<ul>
    <li>Manzanas</li>
    <li>Naranjas</li>
    <li>Plátanos</li>
</ul>

<!-- Lista ordenada -->
<ol>
    <li>Primero</li>
    <li>Segundo</li>
    <li>Tercero</li>
</ol>

<!-- Lista de definiciones -->
<dl>
    <dt>HTML</dt>
    <dd>Lenguaje de marcado.</dd>
    <dt>CSS</dt>
    <dd>Lenguaje de estilos.</dd>
</dl>
```

```text
Tipos:

  - <ul>: unordered list, bullets.
  - <ol>: ordered list, números.
  - <li>: list item.
  - <dl>: description list.
  - <dt>: description term.
  - <dd>: description detail.
```

## list-style-type

```css
ul {
    list-style-type: disc;       /* default */
    list-style-type: circle;
    list-style-type: square;
    list-style-type: none;
}

ol {
    list-style-type: decimal;       /* 1, 2, 3 */
    list-style-type: decimal-leading-zero;   /* 01, 02, 03 */
    list-style-type: lower-roman;    /* i, ii, iii */
    list-style-type: upper-roman;    /* I, II, III */
    list-style-type: lower-alpha;    /* a, b, c */
    list-style-type: upper-alpha;    /* A, B, C */
    list-style-type: lower-greek;    /* α, β, γ */
    list-style-type: none;          /* sin marker */
}
```

```text
list-style-type:

  - disc, circle, square: para ul.
  - decimal, roman, alpha: para ol.
  - "marker" genérico: el navegador decide.
  - Variantes específicas del idioma.
  - Casi cualquier string (con list-style: content).
```

## list-style-image

```css
ul {
    list-style-image: url("bullet.png");
}
```

```text
list-style-image:

  - Imagen en lugar del marker.
  - Limitado en control (no se puede redimensionar).
  - Mejor usar ::marker.
```

## list-style-position

```css
ul {
    list-style-position: outside;     /* default */
    list-style-position: inside;      /* el marker dentro */
}
```

```text
list-style-position:

  - outside: el marker a la izquierda del texto.
  - inside: el marker dentro del bloque.
  - Útil para alinear la lista con otros elementos.
```

## list-style shorthand

```css
ul {
    list-style: square inside;
    list-style: url("bullet.png") inside;
    list-style: none;
}
```

```text
list-style:

  - shorthand para type, image, position.
  - Cualquier orden.
  - Si uno falta, valor inicial.
```

## ::marker

```css
li::marker {
    color: red;
    font-size: 1.2em;
    font-weight: bold;
    content: "→ ";
}

li::before {
    content: "✓ ";
    color: green;
}
```

```text
::marker:

  - El pseudo-element del bullet.
  - Pocas propiedades compatibles: color, font-size, font-weight, content.
  - Limitado en control.
  - Para más control: usar ::before.
```

> [!tip] ::marker es moderno
> El libro recoge: `::marker` es relativamente nuevo. Antes había que usar `::before` con `content: counter()`. Sigue siendo válido, pero `::marker` es más limpio.

## Trucos para listas

### Sin bullets

```css
.list {
    list-style: none;
    padding: 0;
    margin: 0;
}
```

### Bullets custom

```css
.list {
    list-style: none;
    padding-left: 0;
}

.list li {
    position: relative;
    padding-left: 1.5em;
}

.list li::before {
    content: "→";
    position: absolute;
    left: 0;
    color: red;
}
```

### Listas inline

```css
.inline-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1em;
}
```

### Listas con columnas

```css
.multi-column-list {
    column-count: 3;
    column-gap: 2em;
    list-style-position: inside;
}
```

### Lista de definiciones estilizada

```css
.dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.5em 1em;
}

.dt {
    font-weight: bold;
}

.dd {
    margin: 0;
}
```

## Counters

CSS tiene **contadores** que se incrementan automáticamente:

```css
ol {
    counter-reset: section;      /* reset a 0 */
    list-style: none;
}

li {
    counter-increment: section;  /* incrementa */
}

li::before {
    content: counter(section) ". ";
}
```

```text
Counters:

  - counter-reset: nombre: inicializa el counter.
  - counter-increment: nombre: incrementa.
  - counter(nombre): muestra el valor.
  - counter(nombre, style): con formato (decimal, roman, etc.).
  - Útil para numeración automática.
```

### Contadores anidados

```css
ol {
    counter-reset: item;
    list-style: none;
}

li {
    counter-increment: item;
}

li::before {
    content: counters(item, ".") " ";
}

/* HTML:
   <ol>
     <li>Capítulo 1
       <ol>
         <li>Sección 1.1</li>
       </ol>
     </li>
   </ol>
   
   Resultado:
   1.
   1.1.
*/
```

```text
Counters anidados:

  - counters(item, "."): genera "1.1.1".
  - Funcionan sin reset adicional.
  - Útil para outline de libros.
```

### Estilo de counter

```css
li::before {
    content: counter(item, lower-roman) ". ";
}
```

```text
Formato:

  - decimal, decimal-leading-zero.
  - lower-roman, upper-roman.
  - lower-alpha, upper-alpha.
  - lower-greek.
  - lower-latin, upper-latin.
  - armenian, georgian, hebrew.
```

### Contadores en contenido generado

```css
.chapter {
    counter-reset: section;
}

.chapter > h2 {
    counter-increment: section;
}

.chapter > h2::before {
    content: "Chapter " counter(section) ": ";
}
```

```text
Contadores en títulos:

  - counter-reset en el contenedor.
  - counter-increment en cada título.
  - counter() en ::before.
  - Numeración automática en h2, h3, etc.
```

## content

```css
.element::before {
    content: "★ ";
}

.url::after {
    content: " (" attr(href) ")";
}

.counter::before {
    content: counter(item) ". ";
}
```

```text
content:

  - String: contenido textual.
  - attr(name): el valor de un atributo.
  - url(): una URL.
  - counter(): un counter.
  - Combinable: content: "Item " counter(item) ": " attr(name);
```

### Valores especiales

```css
.element::before {
    content: normal;       /* default */
    content: none;         /* no se genera */
    content: open-quote;    /* comilla de apertura */
    content: close-quote;   /* comilla de cierre */
    content: no-open-quote; /* sin comilla de apertura */
    content: no-close-quote; /* sin comilla de cierre */
    content: url("imagen.png");  /* imagen */
}
```

```text
Valores:

  - normal: default, sin contenido.
  - none: no genera el pseudo-element.
  - open-quote, close-quote: comillas según quotes.
  - quote: usa el quote apropiado.
  - url(): una imagen.
  - counter(), counters(): contadores.
  - attr(): valor de atributo.
```

### Strings con caracteres especiales

```css
.element::before {
    content: "Texto con \"comillas\" y \\backslash";
    content: "Línea 1\ALínea 2";  /* \A es nueva línea */
}
```

```text
Escape:

  - \" comilla doble.
  - \' comilla simple.
  - \\ backslash.
  - \A nueva línea.
  - \XXXX Unicode.
```

## quotes

```css
.body {
    quotes: "«" "»" "‹" "›";  /* 1: abierto, 1: cerrado, 2: abierto, 2: cerrado */
}

q::before {
    content: open-quote;
}

q::after {
    content: close-quote;
}
```

```text
quotes:

  - quotes: define pares de comillas.
  - Primer par: para el primer nivel.
  - Segundo par: para el segundo nivel.
  - open-quote, close-quote: usan el nivel apropiado.
```

### quotes en español

```css
.body {
    quotes: "«" "»" "‘" "’";
}
```

```text
Convenciones por idioma:

  - Español: « y ».
  - Español (citando en cit): « y », ‘ y ’.
  - Inglés: “ y ”, ‘ y ’.
  - Francés: « y », « y ».
  - settings del navegador.
```

## content para iconos

```css
.icon::before {
    content: "\f007";  /* código Unicode */
    font-family: "Font Awesome";
}
```

```text
Iconos:

  - content: código Unicode.
  - font-family: la fuente de iconos.
  - Mejor: usar SVG.
  - icon fonts son legacy.
```

## content con attr()

```css
/* Tooltip simple */
[data-tooltip] {
    position: relative;
}

[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: 100%;
    left: 0;
    background: #000;
    color: #fff;
    padding: 0.5em;
    border-radius: 4px;
    white-space: nowrap;
}
```

```html
<button data-tooltip="Haz clic para más">Botón</button>
```

```text
attr() en tooltips:

  - Útil para tooltips simples.
  - No reemplaza a una librería de tooltips.
  - Tiene problemas de accesibilidad.
  - Mejor: aria-label + librería.
```

## List-style shorthand

```css
.list {
    list-style: none;                  /* sin marker */
    list-style: square inside;          /* tipo + posición */
    list-style: url("bullet.png");      /* imagen */
    list-style: square url("bullet.png") inside;  /* todo */
}
```

```text
list-style shorthand:

  - type: disc, circle, square, decimal, etc.
  - image: url().
  - position: inside, outside.
  - Si falta, valor inicial.
```

## Counters anidados en headings

```css
.body {
    counter-reset: h2;
}

h2 {
    counter-increment: h2;
    counter-reset: h3;
}

h3 {
    counter-increment: h3;
}

h2::before {
    content: counter(h2) ". ";
}

h3::before {
    content: counter(h2) "." counter(h3) " ";
}
```

```text
HTML:

  <h2>Capítulo 1</h2>     → 1. Capítulo 1
  <h3>Sección 1.1</h3>   → 1.1 Sección 1.1
  <h2>Capítulo 2</h2>     → 2. Capítulo 2
```

## Trinkets y técnicas

### Tooltip con content

```css
[data-tooltip] {
    position: relative;
}

[data-tooltip]:hover::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 0.5em 1em;
    border-radius: 4px;
    white-space: nowrap;
    font-size: 0.875em;
}
```

### Quitar bullets sin perder semántica

```css
.list {
    list-style: none;
    padding: 0;
    margin: 0;
}

/* Pero el <ul> sigue siendo accesible */
```

### Lista de definiciones en grid

```css
.dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.5em 1em;
}

.dl dt {
    font-weight: bold;
}

.dl dd {
    margin: 0;
}
```

### Tabla con counters

```css
table {
    counter-reset: row;
}

tbody tr {
    counter-increment: row;
}

tbody tr td:first-child::before {
    content: counter(row) ". ";
    color: #999;
    margin-right: 0.5em;
}
```

## Errores comunes

```css
/* Mal: counter-reset en el lugar incorrecto */
li {
    counter-increment: item;
}

/* El reset debe estar en el padre */
ol {
    counter-reset: item;
}

/* Mal: content mal escapado */
.element::before {
    content: "Hola " mundo;  /* error */
}

/* Mal: content con solo número */
.content {
    content: 42;  /* no funciona */
}
```

## Resumen en tres frases

- Las **listas** (`<ul>`, `<ol>`, `<li>`) tienen `list-style-type`, `list-style-image`, `list-style-position`. El pseudo-element `::marker` permite controlar el bullet directamente.
- Los **counters** (`counter-reset`, `counter-increment`, `counter()`) permiten numeración automática. Útil para outline, listas personalizadas, captions.
- La propiedad **content** genera contenido en pseudo-elements (`::before`, `::after`). Puede incluir strings, `attr()`, `counter()`, `url()`. Es la herramienta para añadir información visual sin tocar el HTML.

## Próximos pasos

- [[15-transforms-transitions-y-animation|Transforms, transitions y animation]]: cómo animar y transformar elementos. 2D, 3D, transiciones, keyframes. La parte vibrante de CSS.
