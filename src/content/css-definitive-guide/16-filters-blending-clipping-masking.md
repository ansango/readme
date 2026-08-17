---
title: "Filters, blending, clipping, masking"
description: "Los efectos visuales avanzados. Filtros SVG (blur, brightness, contrast), modos de fusión, clip-path y máscaras"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, filters, blend, clip-path, mask]
---

# Filters, blending, clipping, masking

> [!abstract] Resumen
> Esta nota cubre el capítulo 20 del libro: los **efectos visuales avanzados** de CSS. Filtros SVG (blur, brightness, contrast, saturate, hue-rotate, drop-shadow), modos de fusión (mix-blend-mode, background-blend-mode), clip-path (recortar con formas) y mask (imágenes como máscara). Una caja de herramientas para efectos gráficos.

## Filtros

CSS tiene filtros que replican los filtros SVG pero aplicables a cualquier elemento:

```css
.element {
    filter: blur(5px);
    filter: brightness(0.5);
    filter: contrast(200%);
    filter: grayscale(100%);
    filter: hue-rotate(90deg);
    filter: invert(100%);
    filter: opacity(50%);
    filter: saturate(200%);
    filter: sepia(100%);
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
}
```

```text
Filtros CSS:

  - blur: desenfoque.
  - brightness: brillo.
  - contrast: contraste.
  - grayscale: escala de grises.
  - hue-rotate: rotar el hue.
  - invert: invertir colores.
  - opacity: opacidad.
  - saturate: saturación.
  - sepia: tono sepia.
  - drop-shadow: sombra siguiendo la forma.
```

### Función filter

```css
.element {
    filter: blur(5px) brightness(1.2) contrast(110%);
}
```

```text
filter:

  - Combinación de filtros.
  - Se aplican en orden.
  - Útil para hover effects.
```

### Filter en imágenes

```css
.image {
    filter: grayscale(100%);
    transition: filter 0.3s;
}

.image:hover {
    filter: grayscale(0%);
}
```

```text
Filtros en imágenes:

  - Decorativos.
  - Hover effects.
  - Combinables con transition.
  - Rendimiento: cada filter es un render extra.
```

### Drop-shadow

```css
.element {
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
    filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
}
```

```text
drop-shadow:

  - Como box-shadow, pero sigue la forma del elemento.
  - Para SVGs: la sombra sigue el path.
  - Para PNGs con transparencia: la sombra sigue la silueta.
  - Más lento que box-shadow.
```

> [!tip] drop-shadow vs box-shadow
> El libro recomienda: `drop-shadow` para imágenes con transparencia, `box-shadow` para cajas. `drop-shadow` es más flexible pero más caro.

## Backdrop-filter

```css
.element {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
}
```

```text
backdrop-filter:

  - Filtra lo que está DETRÁS del elemento.
  - Crea el efecto glass/frosted.
  - Requiere que el elemento sea transparente o semi.
  - Muy usado en iOS y sitios modernos.
```

```css
.glass {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
}
```

```text
Glass effect:

  - backdrop-filter: blur: el fondo se difumina.
  - background semi-transparente.
  - Border sutil para definir el glass.
  - Sombra para profundidad.
  - El "frosted glass" de macOS.
```

## Filtros encadenados

```css
.element {
    filter: blur(2px) brightness(1.1) saturate(150%) hue-rotate(15deg);
}
```

```text
Filtros encadenados:

  - Se aplican en orden.
  - Cadena larga puede afectar performance.
  - Útil para efectos artísticos.
```

## Filtros como hover

```css
.card {
    filter: brightness(100%);
    transition: filter 0.3s;
}

.card:hover {
    filter: brightness(1.2) contrast(1.1);
}
```

```text
Filter en interacciones:

  - Combinan bien con transition.
  - Pueden combinarse con otros transforms.
  - Útil para llamar la atención.
```

## Blend modes

CSS permite definir **cómo se mezclan los colores** de elementos que se superponen:

```css
.overlay {
    background: red;
    mix-blend-mode: multiply;      /* se mezcla con el fondo */
}
```

```text
Blend modes:

  - normal: el default, cubre el fondo.
  - multiply: oscurece.
  - screen: aclara.
  - overlay: mezcla multiply y screen.
  - darken: el más oscuro.
  - lighten: el más claro.
  - color-dodge: aclara según el color.
  - color-burn: oscurece según el color.
  - hard-light: multiply con el color del fondo.
  - soft-light: igual pero suave.
  - difference: resta.
  - exclusion: similar pero más suave.
  - hue: usa el hue del color encima.
  - saturation: usa la saturación del color encima.
  - color: usa el hue y saturation del color encima.
  - luminosity: usa la luminosidad del color encima.
```

### mix-blend-mode

```css
.box {
    background: red;
    mix-blend-mode: difference;
}
```

```text
mix-blend-mode:

  - Cómo se mezcla el elemento con su BACKDROP.
  - Requiere posicionamiento absoluto o fixed a veces.
  - Crea isolation implícita.
  - Útil para efectos de superposición.
```

### background-blend-mode

```css
.bg {
    background:
        linear-gradient(red, blue),
        url("texture.jpg");
    background-blend-mode: multiply;
}
```

```text
background-blend-mode:

  - Cómo se mezclan las capas de background.
  - Entre la imagen, el gradient y el color.
  - Cada capa se mezcla con la anterior.
```

### isolation

```css
.parent {
    isolation: isolate;  /* crea un nuevo contexto de composición */
}

.parent .child {
    mix-blend-mode: multiply;
}
```

```text
isolation:

  - Aísla un subárbol del blending exterior.
  - Sin isolation, los blend modes se propagan.
  - Con isolation, los blend modes son locales.
```

## Clip-path

Recorta un elemento con una forma:

```css
.element {
    clip-path: circle(50%);
    clip-path: circle(50% at 50% 50%);
    clip-path: ellipse(50% 30% at 50% 50%);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    clip-path: inset(10px 20px 30px 40px);
    clip-path: path("M 0 0 L 100 0 L 50 100 z");
}
```

```text
clip-path:

  - circle(): círculo.
  - ellipse(): elipse.
  - polygon(): polígono.
  - inset(): rectángulo con esquinas recortadas.
  - path(): un SVG path.
  - box edges con keywords: margin-box, border-box, etc.
```

### Animación de clip-path

```css
.element {
    clip-path: circle(0% at 50% 50%);
    transition: clip-path 0.5s ease;
}

.element:hover {
    clip-path: circle(100% at 50% 50%);
}
```

```text
Animación:

  - clip-path es animable.
  - Transiciones suaves entre formas.
  - Útil para efectos de "reveal".
```

### Clip-path vs overflow: hidden

```css
.box {
    overflow: hidden;
    /* recorta en rectángulo */
}

.box {
    clip-path: circle(50%);
    /* recorta en cualquier forma */
}
```

```text
Diferencias:

  - overflow: hidden: solo rectángulo.
  - clip-path: cualquier forma.
  - clip-path: animable.
  - clip-path: más caro.
```

## Mask

Las máscaras permiten **ocultar partes** de un elemento según una imagen:

```css
.element {
    mask-image: url("mask.png");
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: cover;
}
```

```text
Mask:

  - Define qué partes son visibles.
  - mask-image: imagen o gradient.
  - El alpha de la imagen determina la visibilidad.
  - Alpha 0: invisible.
  - Alpha 1: visible.
```

### Mask vs clip-path

```text
Diferencias:

  - clip-path: formas geométricas.
  - mask: imágenes (más flexible).
  - mask: gradients como máscara.
  - Ambos: cortan visualmente.
  - mask-mode: alpha, luminance, match-source.
```

### Mask con gradient

```css
.gradient-mask {
    mask-image: linear-gradient(to right, transparent, black);
    mask-mode: alpha;
}
```

```text
Mask con gradient:

  - linear-gradient: fade lineal.
  - radial-gradient: fade circular.
  - conic-gradient: fade angular.
  - mask-mode: alpha o luminance.
  - mask-type: alpha (default) o luminance.
```

## mask-mode y mask-type

```css
.element {
    mask-image: url("mask.png");
    mask-mode: alpha;       /* usa la transparencia */
    mask-mode: luminance;   /* usa la luminosidad */
    mask-mode: match-source;  /* depende del formato */
}
```

```text
mask-mode:

  - alpha: el canal alpha determina la máscara.
  - luminance: la luminosidad determina la máscara.
  - match-source: según el formato.
  - Defaults: alpha para imágenes, luminance para SVG.
```

## Mask shorthand

```css
.element {
    mask: url("mask.png") no-repeat center / cover;
    mask: linear-gradient(black, transparent) no-repeat;
    
    /* O individualmente */
    mask-image: url("mask.png");
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: cover;
    mask-origin: border-box;
    mask-clip: border-box;
    mask-composite: add;
    mask-mode: alpha;
}
```

```text
Mask shorthand:

  - mask: image repeat position / size origin clip mode.
  - Similar a background shorthand.
  - mask-composite: cómo se compone la máscara.
  - mask-mode: alpha o luminance.
```

## Mask con SVG

```html
<svg width="0" height="0">
    <defs>
        <mask id="my-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx="50%" cy="50%" r="40%" fill="black" />
        </mask>
    </defs>
</svg>
```

```css
.element {
    mask: url(#my-mask);
}
```

```text
Mask con SVG:

  - Define la máscara en SVG.
  - La máscara puede tener cualquier forma.
  - Más complejo pero más flexible.
  - Útil para morphing effects.
```

## Mask animation

```css
.element {
    mask-image: linear-gradient(black 0%, black 50%, transparent 50%, transparent 100%);
    transition: mask-image 0.5s;
}

.element:hover {
    mask-image: linear-gradient(black 0%, black 100%, transparent 100%, transparent 100%);
}
```

```text
Mask animation:

  - mask-image es animable.
  - Útil para reveal effects.
  - Combinar con transitions.
```

## Clip-path vs Mask: cuándo usar

```text
Usa clip-path cuando:

  - Formas geométricas (círculo, polígono).
  - Animaciones simples.
  - Mejor performance.

Usa mask cuando:

  - Imágenes como máscara.
  - Gradients complejos.
  - Máscaras animadas.
  - SVG masks.
```

## Filtros SVG vs CSS

```css
/* SVG filter */
svg filter feGaussianBlur {
    filter: blur(5px);
}

/* CSS filter equivalent */
.element {
    filter: blur(5px);
}
```

```text
SVG filters:

  - Más poderosos (más efectos).
  - feGaussianBlur, feColorMatrix, feComposite, etc.
  - Útiles para efectos no disponibles en CSS.
  - Más verbosos.
```

## Filtros de imagen

```css
.image {
    filter: brightness(0.8) contrast(1.2) saturate(1.5);
}
```

```text
Filtros en imágenes:

  - Editar imágenes sin editar el archivo.
  - Hover effects.
  - Theme switching (claro/oscuro).
```

## Errores comunes

```css
/* Mal: filter con valores incorrectos */
.element {
    filter: blur;  /* sin valor */
}

/* Mal: backdrop-filter sin fondo transparente */
.element {
    background: red;
    backdrop-filter: blur(10px);  /* el blur no se ve */
}

/* Mal: mix-blend-mode sin posicionamiento */
.element {
    mix-blend-mode: multiply;
    /* el elemento no está sobre nada */
}
```

## Trucos comunes

### Image con grayscale a color en hover

```css
.image {
    filter: grayscale(100%);
    transition: filter 0.3s;
}

.image:hover {
    filter: grayscale(0%);
}
```

### Frosted glass

```css
.glass {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
}
```

### Texto sobre imagen con legibilidad

```css
.hero {
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
                url("hero.jpg") center / cover;
    color: white;
}
```

### Recorte diagonal

```css
.diagonal {
    clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
}
```

### Fade out en bordes

```css
.fade-edges {
    mask-image: linear-gradient(black, transparent);
    mask-mode: luminance;
}
```

### Botón con sombra que sigue la forma

```css
.button {
    background: tomato;
    color: white;
    border-radius: 50%;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}
```

## Mix-blend-mode en acción

```css
.container {
    background: linear-gradient(45deg, #ff0080, #00bfff);
    padding: 2em;
}

.text {
    color: white;
    mix-blend-mode: difference;  /* siempre legible */
}
```

```text
mix-blend-mode: difference:

  - Para texto sobre cualquier fondo.
  - El texto será siempre legible.
  - Útil para overlays.
```

## Resumen en tres frases

- **Filters** aplican efectos similares a los filtros SVG: `blur`, `brightness`, `contrast`, `grayscale`, `hue-rotate`, `drop-shadow`. Funcionan en cualquier elemento.
- **Blend modes** (`mix-blend-mode`, `background-blend-mode`) mezclan colores entre capas. `multiply` y `screen` son los más útiles.
- **Clip-path** y **mask** recortan el elemento. Clip-path para formas geométricas, mask para imágenes y SVG.

## Próximos pasos

- [[17-css-at-rules-y-media-queries|CSS At-Rules y media queries]]: cómo hacer CSS condicional. @media queries para responsive, @supports para feature queries, @container para container queries, @keyframes, @import.
