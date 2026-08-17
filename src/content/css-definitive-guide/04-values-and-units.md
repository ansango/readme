---
title: "Values and units"
description: "Los valores que toman las propiedades CSS: keywords, strings, números, porcentajes, longitudes, colores, ángulos, tiempo y custom properties"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, values, units, colores, custom-properties]
---

# Values and units

> [!abstract] Resumen
> Esta nota cubre el capítulo 5 del libro: los tipos de valores que acepta CSS. Keywords, strings, identificadores, números, porcentajes, dimensiones (longitudes, ángulos, tiempo, frecuencia), colores (named, hex, RGB, HSL, color-mix), y custom properties (variables CSS). Sin entender los valores, no puedes escribir CSS que funcione.

## Categorías de valores

CSS acepta muchos tipos de valores:

```text
Categorías:

  1. Keywords: red, auto, bold.
  2. Strings: "Hola", 'mundo'.
  3. URLs: url("imagen.png").
  4. Números: 1, 1.5, -3.
  5. Porcentajes: 50%, 100%.
  6. Dimensiones: 10px, 2em, 90vh.
  7. Colores: #fff, rgb(255, 0, 0), hsl(0, 100%, 50%).
  8. Funciones: calc(), var(), env().
```

> [!tip] La documentación es tu amiga
> Cada propiedad lista sus valores válidos. Si dudas, consulta MDN.

## Keywords

Valores literales predefinidos:

```css
color: red;
font-weight: bold;
display: flex;
position: absolute;
text-align: center;
```

```text
Keywords:

  - Específicos de cada propiedad.
  - No entrecomillados.
  - Algunos son "globales" (inherit, initial, unset, revert).
```

### Keywords globales

```css
.element {
    color: inherit;        /* toma el del padre */
    color: initial;       /* valor inicial del spec */
    color: unset;         /* inherit o initial según contexto */
    color: revert;        /* como si no se hubiera declarado */
    color: revert-layer;  /* cascade layer */
}
```

```text
Keywords globales:

  - inherit: toma el valor del padre.
  - initial: valor inicial del spec.
  - unset: como si no se hubiera declarado.
  - revert: deshace la cascada.
  - revert-layer: deshace la cascade layer.
```

## Strings

```css
content: "Hola mundo";
content: 'Hola mundo';
content: "Con 'comillas' adentro";
content: 'Con "comillas" adentro';
```

```text
Strings:

  - Entre comillas dobles o simples.
  - Pueden tener saltos de línea (\A).
  - Pueden tener caracteres escapados.
  - Solo algunas propiedades aceptan strings (content, font-family).
```

## Identificadores

```css
font-family: "Helvetica Neue";
grid-area: header;
```

```text
Identificadores:

  - Parecidos a strings, sin comillas.
  - Limitados a caracteres permitidos.
  - Usados en grid-area, counter-style, etc.
```

## Números

```css
opacity: 0.5;
line-height: 1.5;
flex-grow: 1;
z-index: 100;
```

```text
Números:

  - Enteros o decimales.
  - Pueden tener signo.
  - Sin unidad (number) o con unidad (dimension).
  - Algunas propiedades solo aceptan enteros.
```

## Porcentajes

```css
width: 50%;
padding: 5%;
font-size: 120%;
opacity: 50%;
transform: scale(0.5);
```

```text
Porcentajes:

  - Relativos a un valor del contexto.
  - width/height: relativo al contenedor.
  - padding/margin: relativo al width del contenedor.
  - font-size: relativo al font-size del padre.
  - transform: relativo al elemento.
```

## Dimensiones

Combinación de número + unidad:

```css
width: 100px;
margin: 2em;
font-size: 1.2rem;
height: 100vh;
padding: 5vmin;
```

### Length units (longitudes)

```css
/* Absolute */
1cm, 1mm, 1in, 1px, 1pt, 1pc

/* Relative */
1em, 1rem, 1ex, 1ch
1vh, 1vw, 1vmin, 1vmax
1%, 1svh, 1lvh, 1dvh
```

```text
Absolute:

  - px: píxel CSS (no = píxel físico).
  - cm, mm, in: para impresión.
  - pt, pc: tipográficos (1pt = 1/72 in).

Relative:

  - em: relativo al font-size del padre.
  - rem: relativo al font-size del root.
  - ex: relativo a la x-height.
  - ch: relativo al ancho del 0.
  - vh, vw: viewport height / width.
  - vmin, vmax: el menor / mayor de vh y vw.
  - svh, lvh, dvh: small, large, dynamic viewport.
```

### Cuándo usar cada uno

```css
/* Mobile-first */
html { font-size: 16px; }    /* base */
h1 { font-size: 2rem; }     /* relativo al root */
.card { padding: 1rem; }    /* relativo al root */

/* Tipografía */
body { font-size: 1.2em; }  /* relativo al padre */
blockquote { font-size: 1.5em; }

/* Layout */
.app { width: 90vw; max-width: 1200px; }
.hero { height: 100vh; }

/* Accesibilidad */
html { font-size: 100%; }   /* respetar preferencias */
h1 { font-size: 2rem; }     /* rem escala con html */
```

> [!tip] `rem` para tipografía
> El libro recomienda: usa `rem` para `font-size` y `padding` de tipografía. Escala con la preferencia del usuario.

### Angle units

```css
transform: rotate(45deg);
transform: skew(30deg);
background: linear-gradient(45deg, red, blue);
```

```text
Ángulos:

  - deg: grados (0-360).
  - rad: radianes (0-2π).
  - grad: gradianes (0-400).
  - turn: vueltas (0-1).
```

## Time units

```css
transition-duration: 300ms;
animation-duration: 1s;
transition-delay: 0.5s;
```

```text
Tiempo:

  - ms: milisegundos.
  - s: segundos.
  - Cada propiedad acepta una u otra o ambas.
```

## Frequency units

```css
/* Para audio */
voice-range: 200Hz;
```

```text
Frequency:

  - Hz, kHz.
  - Pocas propiedades lo usan.
```

## Resolution units

```css
/* Para imágenes y media queries */
@media (min-resolution: 300dpi) { ... }
```

```text
Resolution:

  - dpi, dpcm, dppx, x.
  - Usado en media queries.
```

## Funciones de cálculo

```css
width: calc(100% - 2em);
height: calc(100vh - 50px);
padding: max(1rem, 10px);
margin: min(2rem, 5vw);
```

```text
Funciones:

  - calc(): cálculos con + - * /.
  - min(): el valor menor.
  - max(): el valor mayor.
  - clamp(): un valor entre un mínimo y un máximo.
```

### clamp()

```css
font-size: clamp(1rem, 2vw + 1rem, 2rem);
```

```text
clamp(min, ideal, max):

  - Si ideal < min: usa min.
  - Si ideal > max: usa max.
  - Si ideal entre min y max: usa ideal.
  - Perfecto para tipografía fluida.
```

## Colors

El tipo de valor más complejo. Hay **muchas formas** de especificar colores:

### Named colors

```css
color: red;
color: tomato;
color: rebeccapurple;  /* color de Rebecca, ingeniera */
background: transparent;
```

```text
144 named colors:

  - Históricamente el primer sistema.
  - 144 colores con nombre (red, blue, etc.).
  - transparent: el "sin color".
  - currentColor: el color del texto.
```

### Hexadecimal

```css
color: #fff;           /* shorthand */
color: #ffffff;       /* 6 dígitos */
color: #ffffff80;     /* 8 dígitos con alpha */
color: #ff0080;       /* RGB */
color: #ff0080cc;     /* RGBA */
```

```text
Hex:

  - #RGB: shorthand.
  - #RRGGBB: 6 dígitos.
  - #RRGGBBAA: 8 dígitos.
  - Deffffff a 000000 (escala de grises).
  - ffffffff a 00000000 (alpha).
```

### RGB y RGBA

```css
color: rgb(255, 0, 128);
color: rgb(255 0 128);
color: rgb(100%, 0%, 50%);
color: rgba(255, 0, 128, 0.5);
```

```text
RGB:

  - 0-255 para cada canal.
  - O porcentajes.
  - Alpha 0-1 (RGBA, o barra / en RGB).
  - El orden es R, G, B.
```

### HSL y HSLA

```css
color: hsl(0, 100%, 50%);      /* rojo */
color: hsl(120, 100%, 50%);   /* verde */
color: hsl(240, 100%, 50%);   /* azul */
color: hsl(0, 100%, 50%, 0.5); /* con alpha */
```

```text
HSL:

  - H: Hue (0-360, grados).
  - S: Saturation (0-100%, %).
  - L: Lightness (0-100%, %).
  - A: Alpha (0-1).
  - MÁS INTUITIVO que RGB.
```

### HWB

```css
color: hwb(0 0% 0%);         /* rojo */
color: hwb(120 0% 50%);     /* verde medio */
color: hwb(240 0% 0% / 0.5); /* azul con alpha */
```

```text
HWB:

  - H: Hue (0-360).
  - W: Whiteness (0-100%).
  - B: Blackness (0-100%).
  - MÁS INTUITIVO aún que HSL.
  - Para definir colores "tint" y "shade".
```

### Color spaces modernos

```css
color: color(display-p3 1 0 0);       /* rojo en display-p3 */
color: oklch(62% 0.25 30);            /* perceptual */
color: color-mix(in oklch, red, blue 50%); /* mezclar */
```

```text
Color spaces modernos:

  - display-p3: espacio de pantalla.
  - oklch: perceptualmente uniforme.
  - color-mix(): mezclar colores.
  - Más amplio que sRGB.
  - Soporte creciente en navegadores.
```

### Color-mix

```css
.element {
    /* Mezclar rojo y azul al 50% con oklch */
    background: color-mix(in oklch, red, blue 50%);

    /* Aclarar un color */
    color: color-mix(in oklch, var(--brand), white 20%);

    /* Oscurecer */
    background: color-mix(in oklch, var(--brand), black 20%);
}
```

```text
color-mix():

  - color-mix(in <space>, color1, color2 <percentage>).
  - Espacio define cómo se mezclan.
  - Porcentaje opcional.
  - Útil para tematización.
```

## Funciones de color

```css
color: rgb(from var(--base) r g b / 0.5);
color: color-contrast(white vs red, blue);
background: light-dark(white, black);
```

```text
Funciones modernas:

  - rgb(from var(--c) r g b / alpha): relativo a una variable.
  - color-contrast: elegir el color con más contraste.
  - light-dark: light mode / dark mode.
```

## Custom properties (variables CSS)

```css
:root {
    --primary: navy;
    --secondary: tomato;
    --spacing: 1rem;
}

.button {
    background: var(--primary);
    padding: var(--spacing);
    color: var(--secondary, white);  /* fallback */
}
```

```text
Custom properties:

  - Nombres con --.
  - Se heredan por defecto.
  - Se acceden con var().
  - Pueden tener fallback.
  - Pueden sobrescribirse en cualquier nivel.
```

### Casos de uso

```css
/* Tematización */
:root { --brand: navy; }
.dark-theme { --brand: lightblue; }

/* Espaciado consistente */
:root { --gap: 1rem; }
.card { padding: var(--gap); margin-bottom: var(--gap); }

/* Tokens de diseño */
:root {
    --color-bg: #fff;
    --color-text: #333;
    --color-border: #ccc;
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 2rem;
}
```

> [!tip] Custom properties son el sistema de tokens de CSS
> El libro recoge: custom properties son la base de cualquier **sistema de diseño** en CSS. Úsalas para colores, espaciado, tipografía, todo.

### var() con fallback

```css
.element {
    color: var(--text-color, navy);  /* fallback a navy */
    padding: var(--padding, 1rem);
}
```

```text
var():

  - var(--name): el valor.
  - var(--name, fallback): fallback si no está definida.
  - El fallback puede ser otro var().
  - Si el fallback también es inválido, valor inicial.
```

### Custom properties dinámicas

```css
:root {
    --size: 100;
}

.box {
    width: calc(var(--size) * 1px);
    transform: translateX(calc(var(--size) * 1%));
}
```

```text
Dinámicas:

  - Custom properties son strings hasta que se usan.
  - calc(var(--size) * 1px) convierte el string a píxel.
  - Útil para animaciones con @property.
```

### @property

```css
@property --color {
    syntax: "<color>";
    initial-value: red;
    inherits: false;
}

.box {
    background: var(--color);
    transition: --color 0.3s;
}

.box:hover {
    --color: blue;
}
```

```text
@property:

  - Declara el tipo de una custom property.
  - Permite animaciones reales sobre variables.
  - syntax: el tipo.
  - initial-value: el valor por defecto.
  - inherits: si se hereda.
```

## Funciones de tamaño

```css
width: fit-content(500px);
height: minmax(100px, auto);
width: clamp(200px, 50%, 800px);
```

```text
Fitting:

  - fit-content(<size>): el contenido, hasta un máximo.
  - minmax(min, max): para grid.
  - clamp(min, ideal, max): valor entre un rango.
```

## Funciones de transformación

```css
transform: translate(10px, 20px);
transform: rotate(45deg);
transform: scale(1.5);
transform: skew(10deg);
```

```text
Transformaciones:

  - 2D: translate, rotate, scale, skew.
  - 3D: translateZ, rotateX, rotateY, etc.
  - matrix(): para los valientes.
```

## Funciones de filtro

```css
filter: blur(5px);
filter: brightness(0.5);
filter: contrast(200%);
filter: grayscale(100%);
```

```text
Filters:

  - blur, brightness, contrast, grayscale, hue-rotate, etc.
  - drop-shadow: sombra sobre el shape.
```

## Resumen de unidades de longitud

```text
Unidad    Uso común
─────────────────────────────
px       borders, sombras, detalles.
em       font-size relativo al padre.
rem      font-size relativo al root.
%       width, height, padding relativos.
vh, vw  layout relativo al viewport.
vmin, vmax  layout relativo a la pantalla más pequeña.
fr       grid (espacio fraccional).
ch       tipografía (ancho del 0).
ex       tipografía (x-height).
```

## Errores comunes

```css
/* Mal: 0 con unidad */
margin: 0px;     /* redundante */
margin: 0;       /* mejor */

/* Mal: em sin font-size */
.btn { padding: 1em; }  /* depende del contexto */
.btn { padding: 1rem; } /* relativo al root */

/* Mal: mezclar unidades */
.box { width: calc(100% + 20px); /* OK */
.box { width: calc(100% + 2em);  /* OK */
.box { width: calc(100% + 200);  /* MAL: falta unidad */

/* Mal: división por cero */
.box { width: calc(100% / 0); }  /* MAL */
```

> [!danger] El navegador es tu aliado
> Si olvidas una unidad, el navegador suele usar la unidad por defecto (px). Pero es una mala práctica: explícito es mejor.

## Resumen en tres frases

- CSS acepta muchos tipos de valores: keywords, strings, números, porcentajes, dimensiones, colores, y funciones.
- Los **colores** son de los más versátiles: named, hex, RGB, HSL, HWB, color-mix, light-dark. Cada uno tiene su momento.
- Las **custom properties** son el sistema de tokens moderno: permiten tematización, consistencia y variables en tiempo real.

## Próximos pasos

- [[05-basic-visual-formatting|Basic visual formatting]]: el modelo de caja. Cómo CSS calcula el tamaño y posición de los elementos. Display, sizing, block vs inline.
