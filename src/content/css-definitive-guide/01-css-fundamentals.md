---
title: "CSS Fundamentals"
description: "El capítulo 1: cómo se escribe CSS, cómo se vincula con HTML, el orden de las declaraciones y los comentarios"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, fundamentals, sintaxis]
---

# CSS Fundamentals

> [!abstract] Resumen
> Esta nota cubre el primer capítulo del libro: la historia y motivación de CSS, su sintaxis, cómo se vincula con HTML, el árbol del documento y los conceptos de elementos replaced y nonreplaced. La base para entender todo lo demás.

## Qué es CSS

CSS (Cascading Style Sheets) es el lenguaje que describe la **presentación** de documentos HTML. Separa el contenido (HTML) del aspecto visual (CSS).

```text
Separación:

  HTML  = estructura y contenido.
  CSS   = presentación y estilo.
  JS    = comportamiento.

Tres tecnologías, tres responsabilidades.
```

> [!quote] "CSS is a language for describing the presentation of structured documents."
> CSS se aplica a documentos **estructurados** (HTML, XML, SVG). Sobre texto plano, no hace nada.

### Una breve historia

El libro recorre los hitos:

```text
Cronología:

  1996: CSS1, el primer estándar.
  1998: CSS2, posicionamiento.
  2011: CSS2.1, revisión.
  2011: Media queries (responsive).
  2017: Grid layout.
  2020: Container queries.
  2023: Color functions, :has() selector.
```

> [!tip] CSS es un estándar vivo
> A diferencia de HTML, CSS no tiene "versiones" incompatibles. Las propiedades se añaden, pero las viejas siguen funcionando. Una hoja de estilos de 2000 sigue siendo válida en 2024.

## Anatomía de una regla CSS

Una regla CSS tiene tres partes:

```css
selector {
    property: value;
    another-property: another-value;
}
```

```text
Anatomía:

  h1 {                       ← selector
      color: navy;          ← declaración (property: value)
      font-size: 2em;       ← declaración
  }
```

> [!note] CSS es declarativo
> Solo **describes** el aspecto. No dices "calcular el ancho", dices "el ancho es 50%". El navegador hace el cálculo.

### Reglas, declaraciones, propiedades, valores

```css
/* Una regla completa */
h1, h2 {
    color: navy;
    font-size: 2em;
    text-align: center;
}

/  Esto es un comentario
```

```text
Partes:

  - Regla: h1, h2 { ... }
  - Selector: h1, h2
  - Declaración: color: navy;
  - Propiedad: color
  - Valor: navy
  - Comentario: /* ... */
```

> [!tip] Las comas en selectores
> `h1, h2` aplica la regla a **ambos**. `h1 h2` aplica a `h2` dentro de `h1`. La coma es "o", no.

## Cómo se vincula CSS con HTML

CSS se aplica a HTML de **tres formas**:

### 1. Inline (no recomendado)

```html
<p style="color: red;">Texto rojo</p>
```

```text
Inline:

  - Directamente en el atributo style.
  - Solo para casos muy puntuales.
  - Difícil de mantener.
```

### 2. Estilo embebido (limitado)

```html
<head>
    <style>
        p { color: red; }
    </style>
</head>
```

```text
Estilo embebido:

  - En el <head> del HTML.
  - Útil para páginas únicas.
  - No escala a múltiples páginas.
```

### 3. Hoja externa (recomendado)

```html
<head>
    <link rel="stylesheet" href="styles.css">
</head>
```

```text
Hoja externa:

  - Archivo .css separado.
  - Cacheable por el navegador.
  - Reutilizable entre páginas.
  - Separación clara de responsabilidades.
```

> [!tip] La forma profesional
> El libro insiste: **usa hojas externas siempre**. Es la única forma que escala a sitios reales.

## Reglas @ (at-rules)

CSS tiene reglas especiales que empiezan con `@`:

```css
@media (max-width: 600px) {
    /* reglas para móviles */
}

@import url("otro.css");

@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

```text
At-rules comunes:

  - @media: media queries.
  - @import: importar otra hoja.
  - @keyframes: definir animaciones.
  - @supports: feature queries.
  - @font-face: definir fuentes.
  - @charset: declarar encoding.
  - @container: container queries.
  - @layer: cascada explícita.
```

> [!note] Las at-rules son poderosas
> Permiten **CSS condicional**: aplicar reglas según el contexto (viewport, navegador, contenedor). El libro las cubre en detalle en la nota [[17-css-at-rules-y-media-queries|17]].

## Bloques de declaración

Las reglas se organizan en bloques con `{}`:

```css
/* Esto es válido */
h1 {
    color: navy;
    background: white;
}

/* También válido en una línea */
h1 { color: navy; background: white; }
```

```text
Estilo:

  - Libre: cualquier whitespace.
  - Una declaración por línea es legible.
  - Indentación de 4 o 2 espacios.
  - Las mayúsculas no importan en valores.
```

## Comentarios

```css
/* Esto es un comentario de varias líneas */
p {
    color: red; /* Comentario al final */
    /* background: blue; */  /* comentado */
}
```

```text
Comentarios:

  - /* ... */: estilo C.
  - No se anidan.
  - Aceptan saltos de línea.
  - No hay // de una línea (C++).
```

## El árbol del documento

CSS funciona con el **árbol DOM**: cada elemento HTML es un nodo con padre, hijos, hermanos.

```html
<html>
  <body>
    <header>
      <h1>Hola</h1>
    </header>
    <main>
      <p>Texto</p>
    </main>
  </body>
</html>
```

```text
Árbol:

  html
    └── body
        ├── header
        │   └── h1
        └── main
            └── p
```

> [!tip] El árbol es la base
> Casi todo en CSS depende del árbol: selectores descendientes, herencia, el modelo de caja. **Entender el árbol** es entender CSS.

## Elementos replaced y nonreplaced

CSS distingue dos tipos de elementos:

### Nonreplaced (la mayoría)

```html
<p>Texto</p>
<h1>Encabezado</h1>
<div>...</div>
```

```text
Nonreplaced:

  - Su contenido es texto.
  - CSS controla su presentación.
  - Ejemplos: <p>, <h1>, <div>, <span>, <ul>.
```

### Replaced

```html
<img src="...">
<input type="text">
<video>
```

```text
Replaced:

  - El navegador renderiza el contenido.
  - CSS no afecta al contenido en sí.
  - Ejemplos: <img>, <input>, <video>, <iframe>.
```

> [!note] La distinción importa
> El modelo de caja trata diferente a replaced y nonreplaced. Por ejemplo, `auto` en width se comporta distinto en <img> que en <div>.

## Elementos block vs inline

Dos modos de display básicos:

### Block

```css
div {
    display: block;
}
```

```text
Block:

  - Ocupa todo el ancho del contenedor.
  - Salto de línea antes y después.
  - Puede tener width y height.
  - Ejemplos: <div>, <p>, <h1>, <ul>.
```

### Inline

```css
span {
    display: inline;
}
```

```text
Inline:

  - Ocupa solo el espacio necesario.
  - No hay salto de línea.
  - No se respetan width/height.
  - Ejemplos: <span>, <a>, <em>, <strong>.
```

### Inline-block

```css
.button {
    display: inline-block;
}
```

```text
Inline-block:

  - Híbrido: inline por fuera, block por dentro.
  - Puede tener width/height.
  - No fuerza salto de línea.
  - Útil para botones, badges.
```

> [!tip] La elección de display es clave
> La nota sobre el box model ([[05-basic-visual-formatting|05]]) entra en detalle. Por ahora: **block** para secciones, **inline** para texto, **inline-block** para elementos interactivos.

## La regla @import

CSS permite importar otras hojas:

```css
@import url("base.css");
@import url("https://fonts.googleapis.com/css?family=Inter");
```

```text
Import:

  - Primero en el archivo.
  - Antes de cualquier regla.
  - Carga sincrónica: bloquea el render.
  - Mejor: <link> en HTML.
```

> [!warning] @import es lento
> El libro advierte: `@import` hace que el navegador **espere** a cargar el archivo antes de continuar. Usa `<link>` en HTML, que es más rápido.

## Comentarios en HTML que se ven afectados por CSS

```html
<!-- Este comentario de HTML no se ve -->
<p>Pero el texto <span> sí se ve</span></p>
```

```css
/* Comentarios CSS: no se ven en la página.
   Sirven para documentar el código. */
```

```text
Diferencias:

  - HTML: <!-- -->
  - CSS: /* */
  - JS: // o /* */
```

## Trucos y buenas prácticas

### Indentación consistente

```css
/* Bien */
.card {
    padding: 1em;
    border: 1px solid #ccc;
}

.card .title {
    font-size: 1.2em;
    font-weight: bold;
}

/* Mal */
.card{padding:1em;border:1px solid #ccc;}
.card .title{font-size:1.2em;font-weight:bold;}
```

### Agrupar selectores relacionados

```css
/* Bien: secciones grandes juntas */
h1, h2, h3 {
    font-family: serif;
    color: navy;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.2em; }

/* Mal: estilos repetidos */
h1 { font-family: serif; color: navy; font-size: 2em; }
h2 { font-family: serif; color: navy; font-size: 1.5em; }
```

### Orden de propiedades

```css
.card {
    /* Posicionamiento */
    position: relative;
    z-index: 1;

    /* Box model */
    display: block;
    width: 100%;
    padding: 1em;
    margin: 0;

    /* Tipografía */
    font-family: serif;
    font-size: 1em;
    color: #333;

    /* Visual */
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
}
```

> [!tip] Convenciones de orden
> El libro describe varias: alfabético, por grupo (posicionamiento, box model, tipografía, visual), etc. Lo importante es ser **consistente**.

## Resumen en tres frases

- CSS es un lenguaje **declarativo** que describe la presentación de documentos HTML.
- La sintaxis es **selector + declaración + valor**, y se organiza en bloques con `{}`.
- CSS se aplica al HTML de tres formas: inline, embebido o externo. La tercera es la profesional.

## Próximos pasos

- [[02-selectors-y-pseudo-classes|Selectors y pseudo-classes]]: una vez que entiendes la sintaxis, el siguiente paso es **seleccionar** los elementos. De los más simples a los más complejos.
