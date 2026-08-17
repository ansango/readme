---
title: "Text properties"
description: "Cómo se ve el texto. Alineación, decoración, transformaciones, whitespaces, writing modes y vertical-align"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, text, typography, alignment]
---

# Text properties

> [!abstract] Resumen
> Esta nota cubre el capítulo 15 del libro: las propiedades que afectan al **texto**. Alineación horizontal y vertical, decoración (subrayado, tachado, color), transformaciones (mayúsculas, minúsculas), espaciado (letter, word, line-height), white-space, word-wrap, writing modes y los indents. La tipografía en detalle.

## text-align

```css
.text {
    text-align: left;       /* default en LTR */
    text-align: right;
    text-align: center;
    text-align: justify;     /* texto justificado */
    text-align: start;       /* inicio del bloque (left en LTR) */
    text-align: end;         /* final del bloque (right en LTR) */
    text-align: justify-all;
    text-align: match-parent;
}
```

```text
text-align:

  - left, right: alineación fija.
  - start, end: dirección del idioma.
  - center: centrado.
  - justify: justificado (los dos lados alineados).
  - justify-all: también justifca la última línea.
  - match-parent: igual que el padre.
```

> [!tip] start y end son modernos
> El libro recoge: `start` y `end` son mejores que `left` y `right` para internacionalización. En árabe, `start` es la derecha.

## text-align-last

```css
.text {
    text-align: justify;
    text-align-last: left;        /* solo la última línea */
    text-align-last: center;
    text-align-last: right;
    text-align-last: justify;
}
```

```text
text-align-last:

  - Alineación de la última línea.
  - Útil con justificar.
  - left: la última línea a la izquierda.
  - center: centrada.
```

## text-align en bloques

```css
.block {
    text-align: center;   /* el texto DENTRO del bloque */
}

.block-child {
    display: inline-block;  /* para centrar el bloque completo */
}
```

```text
text-align:

  - Solo afecta a contenido inline (texto, inline-block, img).
  - No afecta a bloques.
  - Para centrar un bloque, usa margin: auto.
```

## text-decoration

```css
.text {
    text-decoration: none;
    text-decoration: underline;
    text-decoration: line-through;
    text-decoration: overline;
    text-decoration: underline dotted red;
    text-decoration: underline wavy red 2px;
}
```

```text
text-decoration:

  - line: underline, line-through, overline.
  - style: solid, double, dotted, dashed, wavy.
  - color: cualquier color.
  - thickness: 1px, 2px, from-font.
  - Shorthand: line-style-color-thickness.
```

### text-decoration-line

```css
.text {
    text-decoration-line: underline;
    text-decoration-line: line-through;
    text-decoration-line: overline;
    text-decoration-line: blink;        /* deprecated */
}
```

### text-decoration-style

```css
.text {
    text-decoration-style: solid;
    text-decoration-style: double;
    text-decoration-style: dotted;
    text-decoration-style: dashed;
    text-decoration-style: wavy;
}
```

### text-decoration-color

```css
.text {
    text-decoration-color: red;
    text-decoration-color: hsl(0 100% 50% / 0.5);
}
```

### text-decoration-thickness

```css
.text {
    text-decoration-thickness: 1px;
    text-decoration-thickness: 2px;
    text-decoration-thickness: from-font;
    text-decoration-thickness: 10%;
}
```

```text
text-decoration-thickness:

  - 1px, 2px: absoluto.
  - from-font: el grosor de la fuente.
  - %: relativo al font-size.
```

### Personalizar underline

```css
a {
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-thickness: 0.05em;
    text-underline-offset: 0.2em;
}
```

```text
Underline moderno:

  - color: el color del texto.
  - thickness: 5% del font-size.
  - offset: 20% por encima del baseline.
  - Más elegante que el default.
```

> [!tip] Subrayado color texto
> El libro recoge: `text-decoration-color: currentColor` hace que el subrayado sea del mismo color que el texto, pero puedes hacerlo de cualquier color.

## text-decoration-skip-ink

```css
.text {
    text-decoration-skip-ink: auto;    /* default */
    text-decoration-skip-ink: none;   /* cruza las letras */
    text-decoration-skip-ink: all;     /* siempre skip */
}
```

```text
text-decoration-skip-ink:

  - Si el subrayado "salta" las "ascendentes" (b, d, h, k, l) o "descendentes" (g, j, p, q, y).
  - auto: el navegador decide.
  - none: el subrayado cruza las letras.
  - all: siempre skip.
```

## text-transform

```css
.text {
    text-transform: none;
    text-transform: uppercase;       /* HOLA */
    text-transform: lowercase;       /* hola */
    text-transform: capitalize;      /* Hola */
    text-transform: full-size-kana;  /* Japanese: caracteres de ancho completo */
}
```

```text
text-transform:

  - uppercase: convierte a mayúsculas.
  - lowercase: convierte a minúsculas.
  - capitalize: primera letra de cada palabra en mayúscula.
  - Aplica solo a la presentación, no cambia el texto.
  - A11y: lectores de pantalla ven el texto original.
```

## text-indent

```css
p {
    text-indent: 1em;       /* primera línea indentada */
    text-indent: 2em;       /* sangría francesa */
    text-indent: 10%;
    text-indent: -1em;      /* hanging indent */
}
```

```text
text-indent:

  - Indentación de la primera línea.
  - Solo afecta la primera línea de un bloque.
  - Útil para tipografía clásica.
  - 2em: sangría francesa.
```

## word-spacing

```css
.text {
    word-spacing: normal;     /* default */
    word-spacing: 0.5em;      /* más */
    word-spacing: -0.2em;     /* menos */
}
```

```text
word-spacing:

  - Espacio entre palabras.
  - Normal: el de la fuente.
  - Length: añade o resta.
  - Word-spacing: -0.2em condensa el texto.
```

## letter-spacing

```css
.text {
    letter-spacing: normal;       /* default */
    letter-spacing: 0.05em;       /* tracking */
    letter-spacing: -0.02em;     /* tighter */
}
```

```text
letter-spacing:

  - Espacio entre letras.
  - También llamado "tracking".
  - Positivo: más amplio.
  - Negativo: más condensado.
  - Útil para títulos (más amplio) o texto pequeño (más ampliación).
```

## line-height

```css
.text {
    line-height: normal;       /* default, 1.2 aprox */
    line-height: 1.5;          /* multiplicador */
    line-height: 24px;         /* absoluto */
    line-height: 150%;        /* del font-size */
}
```

```text
line-height:

  - La altura de cada línea.
  - Normal: 1.0 a 1.2 según fuente.
  - Sin unidad: multiplicador (recomendado).
  - Con unidad: absoluto (menos flexible).
  - Con porcentaje: del font-size del elemento.
```

### line-height en herencia

```css
.parent {
    font-size: 16px;
    line-height: 1.5;  /* = 24px */
}

.child {
    font-size: 24px;
    line-height: 1.5;  /* ahora = 36px, no 24px */
}
```

```text
Herencia:

  - Sin unidad: el multiplicador se hereda.
  - Con unidad: el valor se hereda directamente.
  - Recomendado: sin unidad.
```

## word-break

```css
.text {
    word-break: normal;       /* palabras se cortan en espacios */
    word-break: break-all;    /* palabras se cortan en cualquier carácter */
    word-break: keep-all;     /* palabras no se cortan (CJK) */
}
```

```text
word-break:

  - normal: default.
  - break-all: corta en cualquier carácter.
  - keep-all: no corta palabras (CJK-friendly).
  - Útil para evitar overflow en contenedores.
```

## overflow-wrap

```css
.text {
    overflow-wrap: normal;       /* default */
    overflow-wrap: break-word;   /* corta palabras largas */
    overflow-wrap: anywhere;     /* similar, pero más agresivo */
}
```

```text
overflow-wrap:

  - Cómo se cortan palabras largas.
  - break-word: si no caben, se cortan.
  - anywhere: igual pero más flexible.
  - Diferencia: anywhere considera mínimos.
```

## word-wrap

```css
.text {
    word-wrap: normal;       /* legacy */
    word-wrap: break-word;   /* alias de overflow-wrap */
}
```

```text
word-wrap:

  - Alias de overflow-wrap.
  - Funciona en navegadores antiguos.
  - Usa overflow-wrap en código moderno.
```

## white-space

```css
.text {
    white-space: normal;       /* colapsa espacios, ajusta */
    white-space: nowrap;      /* sin saltos de línea */
    white-space: pre;         /* preserva espacios y saltos */
    white-space: pre-wrap;    /* preserva espacios, ajusta */
    white-space: pre-line;    /* colapsa espacios, preserva saltos */
    white-space: break-spaces;    /* preserva espacios al final */
}
```

```text
white-space:

  - normal: colapsa espacios y ajusta.
  - nowrap: sin saltos de línea.
  - pre: como <pre>, preserva todo.
  - pre-wrap: preserva pero ajusta.
  - pre-line: colapsa pero preserva saltos.
  - break-spaces: como pre-wrap pero conserva espacios al final.
```

## white-space-collapse

```css
.text {
    white-space-collapse: collapse;   /* default */
    white-space-collapse: preserve;
    white-space-collapse: preserve-breaks;
    white-space-collapse: break-spaces;
}
```

```text
white-space-collapse:

  - collapse: colapsa espacios.
  - preserve: preserva.
  - preserve-breaks: preserva saltos.
  - break-spaces: como normal pero con espacios al final.
```

## text-wrap

```css
.text {
    text-wrap: wrap;          /* default */
    text-wrap: nowrap;        /* sin saltos */
    text-wrap: balance;       /* balance visual */
    text-wrap: pretty;        /* tipografía cuidada */
    text-wrap: stable;        /* saltos estables en edición */
}
```

```text
text-wrap:

  - wrap: default.
  - nowrap: sin saltos.
  - balance: balancea las líneas para美观.
  - pretty: minimiza orphans en párrafos.
  - stable: saltos estables en tiempo real.
```

> [!tip] balance mejora la estética
> El libro recomienda: `text-wrap: balance` para títulos y párrafos cortos. Equilibra el ancho de las líneas para que se vean más estéticos.

## hyphens

```css
.text {
    hyphens: none;       /* no se cortan */
    hyphens: manual;     /* solo con &shy; o - */
    hyphens: auto;       /* divide palabras según el idioma */
}
```

```text
hyphens:

  - none: no se cortan.
  - manual: solo en &shy; o al final de la línea.
  - auto: divide palabras automáticamente.
  - Requiere lang="es" en el HTML.
  - Para idiomas con guiones.
```

## tab-size

```css
pre {
    tab-size: 4;          /* default */
    tab-size: 8;
}
```

```text
tab-size:

  - El ancho de un tab.
  - Default: 8.
  - Común: 2 o 4.
  - Importante para código.
```

## text-orientation

```css
.vertical {
    writing-mode: vertical-rl;
    text-orientation: mixed;        /* default */
    text-orientation: upright;      /* sin rotación */
    text-orientation: sideways;     /* siempre rotada */
}
```

```text
text-orientation:

  - mixed: rotar según el carácter.
  - upright: no rotar.
  - sideways: rotar 90deg.
  - Útil para textos verticales.
```

## writing-mode

```css
.text {
    writing-mode: horizontal-tb;       /* default */
    writing-mode: vertical-rl;         /* vertical, derecha a izquierda */
    writing-mode: vertical-lr;         /* vertical, izquierda a derecha */
    writing-mode: sideways-rl;         /* sideways right-to-left */
    writing-mode: sideways-lr;         /* sideways left-to-right */
}
```

```text
writing-mode:

  - horizontal-tb: default, horizontal.
  - vertical-rl: vertical, derecha a izquierda.
  - vertical-lr: vertical, izquierda a derecha.
  - sideways-rl: sideways RTL.
  - sideways-lr: sideways LTR.
  - Necesario para idiomas asiáticos.
```

## direction

```css
.text {
    direction: ltr;       /* default */
    direction: rtl;       /* derecha a izquierda */
}
```

```text
direction:

  - ltr: default.
  - rtl: para árabe, hebreo.
  - Cambiado por el lang del HTML.
  - Junto con writing-mode.
```

## unicode-bidi

```css
.text {
    unicode-bidi: normal;       /* default */
    unicode-bidi: embed;
    unicode-bidi: isolate;
    unicode-bidi: bidi-override;
    unicode-bidi: plaintext;
}
```

```text
unicode-bidi:

  - Cómo se manejan los textos bidireccionales.
  - Normal: automático.
  - embed, isolate, override: control fino.
  - plaintext: como normal pero ignora el padre.
```

## text-emphasis

```css
.text {
    text-emphasis: filled circle red;
    text-emphasis: open sesame;
    text-emphasis-position: over right;
}
```

```text
text-emphasis:

  - Decoraciones en el texto.
  - Para idiomas asiáticos.
  - Puntos, círculos, etc.
  - Posición: over, under, right, left.
```

## text-shadow

```css
.text {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    text-shadow: 0 0 5px red, 0 0 10px blue;  /* múltiples sombras */
}
```

```text
text-shadow:

  - offset-x, offset-y, blur-radius, color.
  - Múltiples sombras separadas por coma.
  - Para efectos de texto.
  - No aplicar a mucho texto (render cost).
```

## font-variant

```css
.text {
    font-variant: small-caps;
    font-variant-caps: all-small-caps;
    font-variant-numeric: tabular-nums slashed-zero;
    font-variant-ligatures: common-ligatures discretionary-ligatures;
}
```

```text
font-variant:

  - shorthand para un grupo de features.
  - small-caps: mayúsculas pequeñas.
  - all-small-caps: todas las letras como small caps.
  - tabular-nums: números monoespaciados.
  - common-ligatures: ligaduras estándar.
  - discretionary-ligatures: ligaduras decorativas.
```

## text-rendering

```css
.text {
    text-rendering: auto;        /* default */
    text-rendering: optimizeSpeed;
    text-rendering: optimizeLegibility;
    text-rendering: geometricPrecision;
}
```

```text
text-rendering:

  - auto: el navegador decide.
  - optimizeSpeed: más rápido.
  - optimizeLegibility: más legible.
  - geometricPrecision: precisión.
```

## text-justify

```css
.text {
    text-align: justify;
    text-justify: auto;       /* default */
    text-justify: inter-word;    /* distribuye entre palabras */
    text-justify: inter-character;    /* entre caracteres */
    text-justify: distribute;    /* legacy */
    text-justify: none;       /* sin justificar */
}
```

```text
text-justify:

  - Cómo se justifica el texto.
  - inter-word: entre palabras (default en idiomas occidentales).
  - inter-character: entre caracteres (idiomas asiáticos).
  - distribute: legacy, no recomendado.
```

## Trucos comunes

### Texto truncado con elipsis

```css
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

### Texto balanceado

```css
h1 {
    text-wrap: balance;
    max-width: 20em;  /* importante para que el balance funcione */
}
```

### Listas con marcadores custom

```css
li {
    list-style: none;
}

li::before {
    content: "→";
    color: red;
    margin-right: 0.5em;
}
```

### Texto vertical

```css
.vertical {
    writing-mode: vertical-rl;
    text-orientation: upright;
}
```

### Capitalización elegante

```css
.text {
    text-transform: lowercase;
    font-variant: small-caps;
}
```

## Resumen en tres frases

- **text-align** y **text-align-last** controlan la alineación horizontal. `start` y `end` son mejores que `left` y `right` para i18n.
- **text-decoration** moderno: color, thickness, style, offset. Puedes personalizar el subrayado.
- **white-space** y **overflow-wrap** controlan cómo se rompe el texto. `text-wrap: balance` mejora la estética de títulos.

## Próximos pasos

- [[14-lists-y-generated-content|Lists y generated content]]: cómo las listas y el contenido generado se estilizan en CSS. List markers, counters, content, comillas y los trucos con ::before y ::after.
