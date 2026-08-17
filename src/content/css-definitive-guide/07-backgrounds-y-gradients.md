---
title: "Backgrounds y gradients"
description: "Cómo llenar las cajas con colores, imágenes y gradients. Background-color, background-image, position, repeat, attachment, clip y los gradients lineales, radiales y conic"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, background, gradients, images]
---

# Backgrounds y gradients

> [!abstract] Resumen
> Esta nota cubre los capítulos 8 y 9 del libro: cómo llenar las cajas con color, imágenes y gradients. Background-color, background-image, background-position, background-repeat, background-attachment, background-clip, background-origin y los gradients lineales, radiales, conic y repeating. La decoración visual por excelencia.

## El background shorthand

```css
.box {
    background: url("imagen.jpg") no-repeat center / cover fixed #fff;
}
```

```text
Orden del shorthand:

  [background-color]
  [background-image]
  [background-position] / [background-size]
  [background-repeat]
  [background-attachment]
  [background-clip]
  [background-origin]
```

> [!tip] El shorthand es potente
> El libro señala: el shorthand puede incluir **todo** el background. Si no especificas un valor, se usa el valor inicial de esa propiedad.

## background-color

```css
.box {
    background-color: #f5f5f5;
    background-color: rgb(255, 0, 0);
    background-color: transparent;
    background-color: currentColor;
}
```

```text
Background-color:

  - El color de fondo del elemento.
  - Se ve detrás del background-image.
  - Transparente por defecto.
  - currentColor: el color del texto.
```

### Formatos de color

```css
.box {
    background-color: red;                /* named */
    background-color: #fff;               /* hex */
    background-color: #ffffff;           /* hex 6 */
    background-color: #ff0080cc;          /* hex 8 con alpha */
    background-color: rgb(255, 0, 0);    /* RGB */
    background-color: rgba(255, 0, 0, 0.5); /* RGBA */
    background-color: hsl(0, 100%, 50%);  /* HSL */
    background-color: oklch(62% 0.25 30); /* OKLCH perceptual */
}
```

> [!tip] OKLCH es el futuro
> El libro recoge: para colores que necesitan ser perceptualmente uniformes, usa OKLCH. Permite manipular lightness y chroma de forma predecible.

## background-image

```css
.box {
    background-image: url("imagen.jpg");
    background-image: linear-gradient(red, blue);
    background-image: radial-gradient(circle, red, blue);
    background-image: conic-gradient(red, yellow, green);
    background-image: none;
}
```

```text
Background-image:

  - Una URL a una imagen.
  - Un gradient.
  - Múltiples imágenes (comma-separated).
  - Si no se ve: la imagen no existe, el formato no es válido, o CORS.
```

### Múltiples imágenes

```css
.box {
    background-image: 
        url("top.png"),
        url("middle.png"),
        url("bottom.png");
    background-position:
        top,
        center,
        bottom;
    background-repeat: no-repeat;
}
```

```text
Múltiples imágenes:

  - Se dibujan en orden (la primera encima).
  - Cada capa puede tener sus propias propiedades.
  - Útil para efectos complejos sin imágenes extras.
```

## background-position

```css
.box {
    background-position: top left;       /* keywords */
    background-position: center;          /* atajo para center center */
    background-position: 50% 50%;        /* porcentajes */
    background-position: 10px 20px;       /* píxeles */
    background-position: right 20px bottom 10px; /* offsets */
}
```

```text
Background-position:

  - Posición inicial de la imagen.
  - top, right, bottom, left, center.
  - Porcentajes: respecto al tamaño del box (no de la imagen).
  - Si la imagen es más grande que el box, parte se oculta.
```

### background-size

```css
.box {
    background-size: cover;       /* cubrir todo el box */
    background-size: contain;     /* caber dentro del box */
    background-size: 100% auto;    /* ancho completo, alto proporcional */
    background-size: 500px 300px; /* tamaño explícito */
}
```

```text
Background-size:

  - cover: cubre todo el box, recorta si es necesario.
  - contain: la imagen entera, deja huecos.
  - auto: el tamaño natural.
  - <length> <length>: el tamaño exacto.
  - <percentage> <percentage>: relativo al box.
```

> [!tip] Cover vs contain
> El libro distingue: cover para fondos de página completa (no quieres huecos). Contain para logotipos o imágenes que no deben recortarse.

## background-repeat

```css
.box {
    background-repeat: repeat;       /* tile, por defecto */
    background-repeat: no-repeat;    /* sin tile */
    background-repeat: repeat-x;     /* solo horizontal */
    background-repeat: repeat-y;     /* solo vertical */
    background-repeat: space;       /* sin recortar, espaciado */
    background-repeat: round;       /* escala para encajar */
}
```

```text
Background-repeat:

  - repeat: tile por defecto.
  - no-repeat: solo una vez.
  - space: distribuye sin recortar.
  - round: escala para encajar perfectamente.
```

### Two-value repetition

```css
.box {
    background-repeat: repeat no-repeat;  /* x | y */
    background-repeat: round space;       /* x | y */
}
```

## background-attachment

```css
.box {
    background-attachment: scroll;   /* la imagen se mueve con el scroll */
    background-attachment: fixed;    /* la imagen queda fija al viewport */
    background-attachment: local;    /* la imagen se mueve con el contenido */
}
```

```text
Background-attachment:

  - scroll: por defecto.
  - fixed: efecto parallax (cuidado con mobile).
  - local: la imagen se mueve con el contenido de un scroll.
```

> [!warning] Background-attachment: fixed
> El libro advierte: `fixed` puede tener problemas en móviles y con elementos que tienen `transform`. Úsalo con cuidado y siempre con fallback.

## background-clip

```css
.box {
    background-clip: border-box;     /* el border-box */
    background-clip: padding-box;    /* el padding-box */
    background-clip: content-box;    /* el content-box */
    background-clip: text;           /* el texto (con -webkit-text-fill-color: transparent) */
}
```

```text
Background-clip:

  - Define dónde "termina" el background.
  - border-box: hasta el border (default).
  - padding-box: hasta el padding.
  - content-box: hasta el contenido.
  - text: hasta el texto (con truco de text-fill-color).
```

### Texto con background

```css
.gradient-text {
    background: linear-gradient(45deg, #ff0080, #00bfff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
}
```

```text
Texto con gradient:

  - background-clip: text.
  - color: transparent para que el gradient se vea.
  - Requiere el prefijo -webkit- en Safari.
```

## background-origin

```css
.box {
    background-origin: border-box;     /* empieza desde el border */
    background-origin: padding-box;    /* empieza desde el padding (default) */
    background-origin: content-box;    /* empieza desde el content */
}
```

```text
Background-origin:

  - Define el punto de origen de background-position.
  - border-box: top-left del border.
  - padding-box: top-left del padding (default).
  - content-box: top-left del content.
```

## Background shorthand

```css
.box {
    background: red;                                           /* solo color */
    background: url("img.jpg") no-repeat;                      /* image + repeat */
    background: url("img.jpg") center / cover;                  /* image + position / size */
    background: url("img.jpg") center / cover no-repeat;       /* casi todo */
    background: url("img.jpg") center / cover no-repeat fixed; /* con attachment */
    background: url("img.jpg") center / cover no-repeat fixed padding-box; /* con clip */
}
```

```text
Shorthand:

  - background: <color> | <image> | <position> | <size> | <repeat> | <attachment> | <clip> | <origin>.
  - Cualquier orden (excepto position / size que se separan con /).
  - Valores no especificados = valor inicial.
```

## Linear gradients

```css
.box {
    background: linear-gradient(red, blue);
    background: linear-gradient(to right, red, blue);
    background: linear-gradient(45deg, red, blue);
    background: linear-gradient(red, yellow, green);
    background: linear-gradient(red 20%, blue 80%);
    background: linear-gradient(red, transparent, blue);
}
```

```text
Linear gradient:

  - Línea recta de un color a otro.
  - Default: top to bottom.
  - to right/left/top/bottom: dirección.
  - Angulo: 0deg = up, 90deg = right.
  - Color stops: red 20%, blue 80%.
  - transparent: fade a transparente.
```

### Hard color stops

```css
.box {
    background: linear-gradient(red 0% 20%, blue 80% 100%);
    background: linear-gradient(red 20%, blue 20%);
}
```

```text
Hard stops:

  - red 20%, blue 20%: rojo hasta 20%, azul desde 20%. Sin transición.
  - Útil para banderas, gráficos.
```

## Radial gradients

```css
.box {
    background: radial-gradient(red, blue);
    background: radial-gradient(circle, red, blue);
    background: radial-gradient(ellipse, red, blue);
    background: radial-gradient(circle at center, red, blue);
    background: radial-gradient(circle at 30% 70%, red, blue);
    background: radial-gradient(circle at 50% 50%, red 0%, blue 50%, transparent 100%);
}
```

```text
Radial gradient:

  - Gradiente desde un punto hacia afuera.
  - Forma: circle o ellipse.
  - Posición: at center, at top left, etc.
  - Size: closest-side, farthest-corner, etc.
  - Color stops: igual que linear.
```

### Repeat radial

```css
.box {
    background: repeating-radial-gradient(
        circle at center,
        red 0px,
        red 10px,
        blue 10px,
        blue 20px
    );
}
```

```text
Repeating:

  - Repite el patrón.
  - Útil para dianas, ondas, texturas.
```

## Conic gradients

```css
.box {
    background: conic-gradient(red, yellow, green, blue, red);
    background: conic-gradient(red 0% 25%, yellow 25% 50%, green 50% 75%, blue 75% 100%);
    background: conic-gradient(from 45deg, red, yellow, green);
    background: conic-gradient(from 90deg at 50% 50%, red, yellow, green, blue);
}
```

```text
Conic gradient:

  - Gradiente alrededor de un punto.
  - Útil para ruedas, gráficos de torta, patrones.
  - Color stops en ángulos o porcentajes.
  - from <angle>: empieza en ese ángulo.
  - at <position>: el centro.
```

### Pie chart con conic

```css
.pie {
    background: conic-gradient(
        red 0% 40%,
        blue 40% 75%,
        green 75% 100%
    );
    border-radius: 50%;
    width: 200px;
    height: 200px;
}
```

> [!tip] Los conic son inesperadamente útiles
> El libro recoge: conic gradients permiten hacer **pie charts** sin imágenes, **ruedas de color**, **conic patterns**. La creatividad es el límite.

## Color stops

```css
.box {
    background: linear-gradient(
        red,
        yellow 20%,
        green 50%,
        blue 80%,
        transparent 100%
    );
}
```

```text
Color stops:

  - Cada color tiene una posición.
  - Sin posición: distribución uniforme.
  - Con posición: el color llega al valor en esa posición.
  - Entre stops: interpolación gradual.
  - Hard stops: dos stops en la misma posición.
  - More than 2 stops: gradient multi-color.
```

## Color interpolation

```css
.box {
    background: linear-gradient(in oklch, red, blue);
    background: linear-gradient(in oklch longer hue, red, blue);
    background: linear-gradient(in hsl longer hue, red, blue);
    background: linear-gradient(in display-p3, red, blue);
}
```

```text
Interpolación:

  - in <color-space>: el espacio de color.
  - longer hue: usa la ruta más larga en el hue.
  - shorter hue: la más corta.
  - increasing hue: solo hacia adelante.
  - decreasing hue: solo hacia atrás.
  - Display-p3: para colores que exceden sRGB.
```

> [!tip] oklch para gradientes sin bandas
> El libro apunta: los gradientes en sRGB pueden tener "bandas" (zonas grises intermedias). En OKLCH, la transición es perceptualmente suave.

## Múltiples backgrounds

```css
.box {
    background-image:
        linear-gradient(rgba(0, 0, 0, 0.5), transparent),
        url("imagen.jpg");
    background-size: cover, cover;
    background-position: center, center;
}
```

```text
Múltiples:

  - La primera capa está encima.
  - Útil para overlays sobre imágenes.
  - Semitransparencias para mezclar.
  - Cada capa puede tener sus propias propiedades.
```

## Background blend modes

```css
.box {
    background-image:
        linear-gradient(red, blue),
        url("imagen.jpg");
    background-blend-mode: multiply;
}
```

```text
Background-blend-mode:

  - Cómo se mezclan las capas de background.
  - Valores: normal, multiply, screen, overlay, darken, lighten, etc.
  - Semitransparencias complican el cálculo.
  - Útil para efectos de imagen.
```

## Background patterns

```css
.box {
    background-image: 
        radial-gradient(circle at 1px 1px, #000 1px, transparent 0);
    background-size: 20px 20px;
}
```

```text
Pattern con gradient:

  - Muchos "patterns" famosos son gradientes.
  - Puntos, líneas, damero, hexágonos.
  - Más rápido que una imagen.
  - Sin requests HTTP.
```

## Errores comunes

```css
/* Mal: background en lugar de color */
.box {
    background: red;  /* OK */
    color: red;    /* solo el texto */
}

/* Mal: olvidar / en shorthand */
.box {
    background: url("img.jpg") center cover;  /* MAL */
    background: url("img.jpg") center / cover; /* OK */
}

/* Mal: cover ignora aspect-ratio */
.box {
    width: 400px;
    height: 200px;
    background: url("img.jpg") center / cover;  /* puede distorsionar */
}

/* OK: object-fit o aspect-ratio */
.box {
    background: url("img.jpg") center / contain;
}
```

## Buenas prácticas

```css
/* Patrón con gradient en lugar de imagen */
.dotted-bg {
    background-image: radial-gradient(circle, #ccc 1px, transparent 1px);
    background-size: 10px 10px;
}

/* Overlay sobre imagen */
.hero {
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)),
                url("hero.jpg") center / cover;
    color: white;
}

/* Color stops para banderas */
.flag {
    background: linear-gradient(to bottom, red 33%, yellow 33% 66%, green 66%);
}
```

## Resumen en tres frases

- **Background** es la decoración visual por excelencia: color, imagen, position, size, repeat, attachment, clip, origin.
- Los **gradients** (linear, radial, conic) son la forma moderna de crear fondos sin imágenes. Incluyen color stops, transparent, hard stops y color interpolation.
- Las **técnicas modernas** (múltiples backgrounds, blend modes, color-mix, OKLCH, text-fill) permiten efectos avanzados sin salir de CSS.

## Próximos pasos

- [[08-floating-and-positioning|Floating and positioning]]: cómo sacar las cajas del flujo normal. Float, position (relative, absolute, fixed, sticky), z-index. La base para layouts complejos antes de flexbox y grid.
