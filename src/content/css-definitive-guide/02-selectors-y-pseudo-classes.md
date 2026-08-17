---
title: "Selectors y pseudo-classes"
description: "Cómo seleccionar elementos: selectores básicos, combinadores, pseudo-classes, pseudo-elements, attribute selectors. La herramienta fundamental de CSS"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, selectors, pseudo-classes, pseudo-elements]
---

# Selectors y pseudo-classes

> [!abstract] Resumen
> Esta nota cubre los capítulos 2 y 3 del libro: cómo seleccionar elementos con CSS. Selectores de tipo, clase, ID, universal; combinadores (descendant, child, sibling); pseudo-classes estructurales (`:first-child`, `:nth-child`, etc.); pseudo-classes de interacción (`:hover`, `:focus`, etc.); pseudo-elements (`::before`, `::after`); y attribute selectors (`[attr]`, `[attr="value"]`). Sin selectores, no hay CSS.

## Por qué importan los selectores

CSS se aplica a elementos. Los **selectores** son el mecanismo que decide **a qué elementos** se aplica cada regla.

```css
/* Sin selectores, no hay CSS */
h1 { color: red; }      /* Selector: h1 */
.card { padding: 1em; }  /* Selector: .card */
#menu { display: none; } /* Selector: #menu */
```

> [!tip] Los selectores son la mitad del lenguaje
> Si el libro tiene un capítulo entero para ellos, es porque **dominarlos** es más importante que memorizar propiedades.

## Estructura de un selector

```css
/* Sintaxis completa */
section.article > p:first-child::before {
    content: "→ ";
    color: red;
}
```

```text
Partes:

  section.article        ← selector de tipo + clase
  >                     ← combinador (child)
  p                     ← selector de tipo
  :first-child          ← pseudo-clase
  ::before              ← pseudo-element

  → section.article > p:first-child::before
```

## Selectores básicos

### Selector de tipo

```css
h1 { color: red; }
p { line-height: 1.5; }
div { padding: 1em; }
```

```text
Tipo:

  - Selecciona elementos por nombre de etiqueta.
  - Aplica a TODOS los elementos de ese tipo.
  - El más simple pero menos específico.
```

### Selector de clase

```css
.button { padding: 1em; }
.card { background: white; }
.error { color: red; }
```

```text
Clase:

  - Selecciona elementos con class="..."
  - Reutilizable: muchos elementos pueden tener la misma clase.
  - El caballo de batalla de CSS moderno.
```

### Selector de ID

```css
#header { position: fixed; }
#menu { display: none; }
```

```text
ID:

  - Selecciona elementos con id="..."
  - Cada ID debe aparecer UNA vez en la página.
  - MÁS específico que las clases.
  - Evitar para estilado: complica la reutilización.
```

> [!warning] IDs son problemáticos
> El libro advierte: los IDs tienen **más specificity** que las clases, lo que hace que sobrescribir estilos sea difícil. Usar IDs para estilo es un anti-patrón.

### Selector universal

```css
* { margin: 0; padding: 0; }
```

```text
Universal:

  - Selecciona TODOS los elementos.
  - Útil para resets.
  - Performance: úsalo con moderación.
```

### Selectores múltiples

```css
h1, h2, h3 {
    font-family: serif;
}
```

```text
Múltiples:

  - Coma separa selectores.
  - Aplica la regla a todos.
  - No confundir con combinadores.
```

## Agrupamiento de selectores

```css
/* Todas las cabeceras con la misma fuente */
h1, h2, h3, h4, h5, h6 {
    font-family: "Helvetica Neue", sans-serif;
}

/* Todos los títulos de sección */
h1, h2, h3 {
    color: navy;
    margin-bottom: 0.5em;
}
```

> [!tip] Agrupar es herencia de estilos
> Cuando varios elementos comparten estilo, agrúpalos. Si después tienes que diferenciar, usa selectores más específicos.

## Combinadores

Los combinadores conectan selectores:

### Descendant (espacio)

```css
article p {
    line-height: 1.6;
}
```

```text
Descendant:

  - Selecciona <p> dentro de <article> en cualquier nivel.
  - article > section > p califica.
  - Es el combinador más común.
```

### Child (>)

```css
article > p {
    margin-top: 1em;
}
```

```text
Child:

  - Selecciona <p> hijo DIRECTO de <article>.
  - article > section > p califica.
  - article section > p no califica.
```

### Adjacent sibling (+)

```css
h1 + p {
    font-size: 1.2em;
}
```

```text
Adjacent sibling:

  - Selecciona el hermano inmediatamente siguiente.
  - <p> justo después de <h1>.
  - Ambos hijos del mismo padre.
```

### General sibling (~)

```css
h1 ~ p {
    color: gray;
}
```

```text
General sibling:

  - Selecciona cualquier hermano siguiente.
  - Todos los <p> después de <h1>.
  - Ambos hijos del mismo padre.
```

## Resumen de combinadores

```text
Combinadores:

  E F        descendant (cualquier nivel)
  E > F      child (hijo directo)
  E + F      adjacent sibling (siguiente)
  E ~ F      general sibling (cualquiera siguiente)
```

## Attribute selectors

CSS permite seleccionar elementos por sus atributos:

### Presencia

```css
a[href] {
    color: navy;
}
```

```text
[href]:

  - Selecciona elementos con el atributo.
  - No importa el valor.
```

### Valor exacto

```css
input[type="text"] {
    border: 1px solid #ccc;
}

input[type="submit"] {
    background: green;
}
```

### Valor en lista

```css
[class~="warning"] {
    color: red;
}
```

```html
<div class="warning urgent">Alerta</div>
<!-- El selector coincide por "warning" -->
```

```text
~=:

  - Atributo contiene la palabra en una lista separada por espacios.
  - warning urgent: coincide con "warning".
  - No confundir con el combinador general sibling.
```

### Valor empieza con

```css
a[href^="https://"] {
    color: green;
}

a[href^="mailto:"] {
    color: orange;
}
```

```text
^=:

  - Atributo empieza con el valor.
  - Útil para enlaces externos, protocolos.
```

### Valor termina con

```css
a[href$=".pdf"] {
    background: url("pdf-icon.png") no-repeat right;
}

img[src$=".jpg"], img[src$=".jpeg"] {
    border-radius: 4px;
}
```

```text
$=:

  - Atributo termina con el valor.
  - Útil para extensiones, sufijos.
```

### Valor contiene

```css
a[href*="github.com"] {
    color: black;
}
```

```text
*=

  - Atributo contiene el valor en cualquier parte.
  - Cuidado: puede ser demasiado amplio.
```

## Pseudo-classes estructurales

Aplican según la posición del elemento en el árbol:

### `:first-child` y `:last-child`

```css
li:first-child {
    border-top: none;
}

li:last-child {
    border-bottom: none;
}
```

```text
:first-child / :last-child:

  - Primer/último hijo de su padre.
  - Independiente del tipo.
```

### `:nth-child()` y `:nth-last-child()`

```css
/* Tercer elemento */
li:nth-child(3) {
    color: red;
}

/* Elementos pares */
li:nth-child(even) {
    background: #f5f5f5;
}

/* Elementos impares */
li:nth-child(odd) {
    background: white;
}

/* Cada tres elementos */
li:nth-child(3n) {
    margin-bottom: 2em;
}

/* Primeros 3 */
li:nth-child(-n+3) {
    font-weight: bold;
}
```

```text
:nth-child(an + b):

  - Fórmula: a = paso, n = contador, b = offset.
  - 3n: cada 3.
  - 3n+1: cada 3, empezando en el 1.
  - :nth-child(2): exactamente el 2.
  - even/odd: pares/impares.
```

### `:only-child`

```css
.card:only-child {
    margin: auto;
}
```

```text
:only-child:

  - Elemento único hijo de su padre.
```

### `:first-of-type` y `:last-of-type`

```css
/* Primera imagen de un artículo */
article img:first-of-type {
    margin-top: 0;
}
```

```text
:first-of-type:

  - Primer elemento de su tipo entre los hijos.
  - A diferencia de :first-child, considera el tipo.
```

### `:empty`

```css
div:empty {
    display: none;
}
```

```text
:empty:

  - Elemento sin hijos (ni texto, ni elementos).
  - Útil para ocultar placeholders.
```

## Pseudo-classes de interacción

```css
/* Estados del enlace */
a:link { color: blue; }
a:visited { color: purple; }
a:hover { color: red; }
a:active { color: orange; }
a:focus { outline: 2px solid yellow; }
```

```text
Interacción:

  - :link: enlace no visitado.
  - :visited: enlace ya visitado.
  - :hover: cursor encima.
  - :active: click activo.
  - :focus: tiene el foco del teclado.
```

### LVHA (orden importante)

```css
/* Correcto: link, visited, hover, active */
a:link { color: blue; }
a:visited { color: purple; }
a:hover { color: red; }
a:active { color: orange; }

/* Mal: hover en otro orden */
a:hover { color: red; }
a:link { color: blue; }  /* sobrescribe hover */
```

> [!tip] El orden importa
> El libro insiste: respectá el orden **:link → :visited → :hover → :active**. Si no, las reglas se sobrescriben en cascada.

### :focus-visible

```css
button:focus-visible {
    outline: 2px solid blue;
}
```

```text
:focus-visible:

  - Foco solo cuando es por teclado (no por mouse).
  - Mejor para accesibilidad que :focus.
```

### :focus-within

```css
form:has(input:focus) {
    /* selecciona el form cuando un input tiene foco */
}
```

```text
:focus-within:

  - Elemento que contiene un descendiente con foco.
  - Útil para forms completos.
```

## Pseudo-classes de UI

```css
input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

input:required {
    border-left: 3px solid red;
}

input:checked + label {
    font-weight: bold;
}

input:valid {
    background: #e0ffe0;
}

input:invalid {
    background: #ffe0e0;
}
```

```text
UI pseudo-classes:

  - :enabled / :disabled
  - :required / :optional
  - :checked / :indeterminate
  - :valid / :invalid
  - :read-only / :read-write
  - :placeholder-shown
  - :focus
```

## Pseudo-classes de posición

```css
a:first-child { /* primer hijo */ }
p:last-child { /* último hijo */ }
li:nth-child(2) { /* segundo hijo */ }
li:nth-of-type(odd) { /* impar */ }
```

## Pseudo-elements

Los pseudo-elements crean **contenido virtual** o seleccionan **partes específicas**:

### `::before` y `::after`

```css
.quote::before {
    content: """;
    font-size: 2em;
    color: gray;
}

.quote::after {
    content: """";
}
```

```text
::before / ::after:

  - Generan contenido antes/después del elemento.
  - Requieren content: "" ; (siquiera vacío).
  - Se renderizan como inline children.
  - Inheritance funciona.
```

### `::first-letter` y `::first-line`

```css
p::first-letter {
    font-size: 3em;
    font-weight: bold;
    float: left;
    margin-right: 0.1em;
}

p::first-line {
    font-weight: bold;
}
```

```text
::first-letter:

  - Primera letra.
  - Clásico para drop caps.

::first-line:

  - Primera línea de texto.
  - Se adapta al ancho.
```

### `::placeholder`

```css
input::placeholder {
    color: #999;
    font-style: italic;
}
```

```text
::placeholder:

  - Estiliza el placeholder de un input.
```

### `::selection`

```css
::selection {
    background: yellow;
    color: black;
}
```

```text
::selection:

  - Estiliza el texto seleccionado por el usuario.
```

### `::marker`

```css
li::marker {
    color: red;
    font-size: 1.2em;
}
```

```text
::marker:

  - El bullet de una lista.
  - El número de un item.
```

### `::backdrop`

```css
dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
}
```

```text
::backdrop:

  - Detrás de un elemento modal.
  - Para oscurecer el fondo.
```

## Pseudo-classes modernas

### `:is()` y `:where()`

```css
/* Sin :is() */
.header h1, .header h2, .header h3 {
    /* idénticos */
}

/* Con :is() */
.header :is(h1, h2, h3) {
    font-family: serif;
}

/* Con :where() (specificity 0) */
:where(.header) :is(h1, h2, h3) {
    color: gray;
}
```

```text
:is() y :where():

  - Agrupan selectores con menos texto.
  - :is() usa la specificity MÁS ALTA.
  - :where() usa specificity 0 (no afecta).
  - Útiles para cascada controlada.
```

### `:has()` (selector padre)

```css
/* Selecciona <a> que contiene <img> */
a:has(img) {
    display: block;
}

/* Selecciona <form> con input inválido */
form:has(input:invalid) {
    border: 2px solid red;
}
```

```text
:has():

  - El "selector padre" que CSS no tenía.
  - Selecciona elementos que CONTIENEN otros.
  - Soportado en navegadores modernos.
  - Cuidado: selectores anidados son lentos.
```

### `:not()`

```css
/* Selecciona divs que NO tienen la clase .card */
div:not(.card) {
    margin: 0;
}

/* Combinar con :is() */
button:not(:is(.primary, .secondary)) {
    /* estilos por defecto */
}
```

```text
:not():

  - Selecciona lo que NO coincide.
  - Útil para exclusiones.
  - No acepta pseudo-elements.
```

### `:has()`, `:is()`, `:where()` combinan bien

```css
/* Estilo a divs con imagen o video */
div:has(:is(img, video)) {
    /* */
}

/* Sin afectar specificity */
:where(.card, .panel) :where(h1, h2) {
    margin: 0;
}
```

## Tabla resumen de selectores

```text
Selector          Significado
─────────────────────────────────────────
*                 Universal
element           Tipo
.class            Clase
#id               ID
[attr]            Atributo presente
[attr="value"]    Atributo igual
[attr^="value"]   Atributo empieza con
[attr$="value"]   Atributo termina con
[attr*="value"]   Atributo contiene
E F               Descendant
E > F             Child
E + F             Adjacent sibling
E ~ F             General sibling
:hover, :focus    Estado
:first-child      Posición
:nth-child(n)    Posición con fórmula
:is(), :where()   Agrupación
:has()            Contiene
:not()            Exclusión
::before, ::after Pseudo-elements
```

## Selectores y rendimiento

El libro señala:

```text
Performance:

  - Selectores simples son más rápidos.
  - Selectores anidados (E F G H) son más lentos.
  - :has() puede ser particularmente lento.
  - Para CSS moderno, el navegador optimiza.
  - Solo optimiza si mediste un problema.
```

> [!tip] No optimices prematuramente
> El libro es claro: la optimización de selectores **rara vez** es la causa de problemas de rendimiento. Mejor escribe selectores legibles.

## Resumen en tres frases

- Los **selectores** son el mecanismo para aplicar CSS a elementos. Desde el simple `h1` hasta el moderno `:has()`.
- Los **combinadores** (descendant, child, sibling) permiten seleccionar elementos por su **relación** con otros.
- Las **pseudo-classes** y **pseudo-elements** añaden lógica CSS sin necesidad de JavaScript: `:hover`, `:first-child`, `::before`, `:has()`.

## Próximos pasos

- [[03-specificity-cascade-y-inheritance|Specificity, cascade y inheritance]]: cuando varias reglas aplican al mismo elemento, ¿cuál gana? La respuesta es la specificity, y entenderla es vital para no frustrarse.
