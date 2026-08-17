---
title: "Padding, borders, outlines, margins"
description: "Las cuatro propiedades del box model. Margin collapsing, padding shorthand, border styles, outlines, border-radius y los trucos del modelo de caja"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, padding, border, margin, outline, box-model]
---

# Padding, borders, outlines, margins

> [!abstract] Resumen
> Esta nota cubre el capítulo 7 del libro: las **cuatro propiedades del box model**. Padding (espacio interior), borders (líneas del borde), outlines (otra línea, no afecta al layout) y margins (espacio exterior). El margin collapsing, los shorthand properties, los distintos estilos de border, los border-radius y los trucos que diferencian a un desarrollador que entiende el modelo de caja.

## Repaso del box model

```text
El box model:

  ┌─────────────────────────────┐
  │           margin              │  ← Capítulo 7
  │  ┌───────────────────────┐   │
  │  │      border           │   │  ← Capítulo 7
  │  │  ┌───────────────┐   │   │
  │  │  │   padding     │   │   │  ← Capítulo 7
  │  │  │  ┌─────────┐   │   │   │
  │  │  │  │ content │   │   │   │  ← Capítulo 6
  │  │  │  └─────────┘   │   │   │
  │  │  └───────────────┘   │   │
  │  └───────────────────────┘   │
  └─────────────────────────────┘
```

> [!tip] Las cuatro propiedades, en orden
> El libro recorre las propiedades en orden: padding, border, outline, margin. Cada una tiene su comportamiento, sus shorthand y sus trucos.

## Padding

El padding es el **espacio interior** de la caja, entre el contenido y el borde:

```css
.box {
    padding: 20px;             /* todos los lados */
    padding: 10px 20px;        /* vertical | horizontal */
    padding: 10px 20px 15px;   /* top | horizontal | bottom */
    padding: 10px 20px 15px 5px; /* top | right | bottom | left */
}
```

```text
Shorthand:

  1 valor:    todos los lados.
  2 valores:  vertical | horizontal.
  3 valores:  top | horizontal | bottom.
  4 valores:  top | right | bottom | left.

Orden: top, right, bottom, left (en el sentido del reloj).
```

### Propiedades individuales

```css
.box {
    padding-top: 1em;
    padding-right: 2em;
    padding-bottom: 1em;
    padding-left: 2em;
}
```

```text
Padding:

  - No acepta valores negativos.
  - No es colapsable (no se combina con el del padre).
  - Aumenta el tamaño de la caja (con content-box).
  - En inline, no afecta al line-height vertical.
```

### Padding en inline

```css
span {
    padding: 1em;
    /* Horizontal: funciona bien. */
    /* Vertical: afecta al background, no al line-height. */
}
```

```text
Padding en inline:

  - Horizontal: separa del texto adyacente.
  - Vertical: NO empuja el texto de arriba/abajo.
  - Solo el background se extiende.
  - Para afectar el line-height, usa line-height.
```

> [!tip] Padding vs line-height
> El libro insiste: para dar "aire" vertical a un inline, no abuses del padding. Usa `line-height` o cambia el display a inline-block.

## Borders

El border es la **línea del borde** de la caja:

```css
.box {
    border: 1px solid #000;     /* shorthand */
    border: 2px dashed red;
    border: 0;                  /* sin border */
    border: none;               /* sin border */
}
```

```text
Shorthand:

  border: <width> <style> <color>;

  - 1px solid red: el más común.
  - 0 o none: oculta el border.
  - style es obligatorio (sin él, no se muestra).
```

### Border styles

```css
.box {
    border-style: solid;     /* línea sólida */
    border-style: dashed;    /* guiones */
    border-style: dotted;    /* puntos */
    border-style: double;    /* doble línea */
    border-style: groove;    /* efecto 3D */
    border-style: ridge;     /* efecto 3D opuesto */
    border-style: inset;     /* efecto 3D hundido */
    border-style: outset;    /* efecto 3D elevado */
    border-style: none;      /* sin border */
    border-style: hidden;    /* sin border, pero cuenta en tablas */
}
```

| Estilo | Descripción |
|---|---|
| `solid` | Línea sólida continua. |
| `dashed` | Línea de guiones. |
| `dotted` | Línea de puntos. |
| `double` | Dos líneas paralelas. |
| `groove` | Efecto 3D hundido. |
| `ridge` | Efecto 3D elevado. |
| `inset` | Efecto 3D en los cuatro lados. |
| `outset` | Efecto 3D en los cuatro lados, opuesto. |
| `none` | No border. |
| `hidden` | No border, pero ocupa espacio en tablas. |

> [!tip] Border-style es obligatorio
> El libro señala: si pones `border: 1px red` sin style, el border **no se muestra**. El navegador asume style: none.

### Border width

```css
.box {
    border-width: 1px;        /* todos los lados */
    border-width: 1px 2px;     /* vertical | horizontal */
    border-width: 1px 2px 3px 4px; /* top, right, bottom, left */
    
    border-top-width: 2px;
    border-right-width: 4px;
    border-bottom-width: 2px;
    border-left-width: 4px;
}
```

```text
Border width:

  - keywords: thin, medium, thick.
  - thin = 1px, medium = 3px, thick = 5px (por convención).
  - Cualquier length unit.
```

### Border colors

```css
.box {
    border-color: red;
    border-color: red blue;        /* vertical | horizontal */
    border-color: currentColor;    /* toma el color del texto */
}
```

```text
Border color:

  - Acepta cualquier color.
  - currentColor: el color del texto (útil para tematización).
  - Por defecto: el color del texto del elemento.
```

### Border en cada lado

```css
.box {
    border-top: 1px solid red;
    border-right: 2px solid blue;
    border-bottom: 1px solid red;
    border-left: 2px solid blue;
}

/* O equivalente */
.box {
    border-top: 1px solid red;
    border-right: 1px solid blue;
    border-bottom: 1px solid red;
    border-left: 1px solid blue;
    border-right-width: 2px;
    border-left-width: 2px;
}
```

## Border radius

```css
.box {
    border-radius: 8px;             /* todos los lados */
    border-radius: 50%;              /* círculo */
    border-radius: 8px 16px;         /* horizontal | vertical */
    border-radius: 8px 16px 24px 32px; /* top-left, top-right, bottom-right, bottom-left */
}
```

```text
Border-radius:

  - Redondea las esquinas.
  - border-radius: 50% en un cuadrado = círculo.
  - border-radius: 50% en un rectángulo = elipse.
```

### Border radius asimétrico

```css
.box {
    border-top-left-radius: 20px;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 20px;
    border-bottom-left-radius: 5px;
}
```

```text
Asimétrico:

  - Cada esquina tiene su propio radio.
  - Útil para formas orgánicas.
  - Piénsalo como 4 propiedades independientes.
```

> [!tip] Bordes como sonrisa
> El libro recoge: `border-radius: 0 0 50% 50% / 0 0 100% 100%` crea una forma de gota. Los radios pueden ser porcentajes y combinados de formas sorprendentes.

## Border image

```css
.box {
    border: 1px solid transparent;
    border-image: url("frame.png") 30 round;
}
```

```text
Border-image:

  - Usa una imagen como border.
  - slice: cómo se corta la imagen.
  - fill: si el centro se rellena.
  - repeat: stretch, repeat, round, space.
```

## Outlines

Los outlines son líneas **alrededor del border** que no afectan al layout:

```css
.box {
    outline: 2px solid blue;
    outline-offset: 2px;  /* espacio entre border y outline */
}
```

```text
Outlines:

  - Dibujados sobre el border.
  - No afectan al layout (no ocupan espacio).
  - Comunes: focus rings.
  - No se pueden redondear con border-radius.
  - No se pueden estilizar por lado.
```

### Focus styles

```css
.button:focus-visible {
    outline: 2px solid blue;
    outline-offset: 2px;
}

button:focus {
    outline: none;  /* cuidado con accesibilidad */
}
```

> [!warning] Sin outline pierdes accesibilidad
> El libro es claro: nunca elimines el outline sin reemplazarlo por otro mecanismo visual. Hay usuarios que necesitan ver el foco.

## Outline vs border

```text
Diferencias:

  Border                    Outline
  ─────────                 ─────────
  Ocupa espacio.            No ocupa espacio.
  Por lado.                 Por todos los lados.
  border-radius sí.         border-radius no.
  Afecta al layout.         No afecta al layout.
```

## Margins

El margin es el **espacio exterior** de la caja:

```css
.box {
    margin: 20px;               /* todos los lados */
    margin: 10px 20px;          /* vertical | horizontal */
    margin: 10px 20px 15px 25px; /* top, right, bottom, left */
    margin: -10px;              /* margin negativo */
    margin: auto;               /* centrado */
}
```

```text
Margin:

  - Acepta valores negativos.
  - Auto en block centra horizontal.
  - Auto en flex/grid es especial.
  - Se colapsan verticalmente.
```

### Margin collapse

```css
.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }

/* El espacio entre .box1 y .box2 es 30px, no 50px. */
```

```text
Margin collapsing:

  - Solo en margins verticales.
  - Solo en block elements.
  - El resultado es el mayor, no la suma.
  - No colapsa con padding o border.
  - No colapsa si hay posición absoluta o float.
  - No colapsa dentro de flex/grid.
```

### Casos del margin collapse

```css
/* Caso 1: padre e hijo */
.parent { margin-bottom: 20px; }
.child { margin-top: 30px; }
/* Resultado: el padre queda con 30px (el mayor). */

/* Caso 2: hermanos adyacentes */
.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* Resultado: 30px entre ellos. */

/* Caso 3: bloque vacío */
.empty { margin: 20px 0; }
/* Resultado: el top y bottom del mismo elemento colapsan. */
```

### Evitar el margin collapse

```css
/* Opción 1: padding */
.parent {
    padding: 1px;  /* cualquier valor no-cero */
}

/* Opción 2: border */
.parent {
    border: 1px solid transparent;
}

/* Opción 3: overflow */
.parent {
    overflow: hidden;
}

/* Opción 4: flex/grid */
.parent {
    display: flex;
    flex-direction: column;
}

/* Opción 5: flow-root */
.parent {
    display: flow-root;
}
```

> [!tip] El libro es claro sobre margin collapse
> El margin collapse es un **comportamiento intencional** del modelo de cajas. Es útil para tipografía (los párrafos no acumulan espacio). Para layouts, evita usar margins del hijo y usa gap del padre.

## Margin auto

```css
.block {
    width: 500px;
    margin: 0 auto;  /* centrado horizontal */
}
```

```text
margin: auto:

  - En block con width: centra el bloque.
  - En flex/grid: comportamiento especial.
  - En vertical: no funciona (height: auto).
  - En absolute: posicionamiento centrado.
```

## Margin negativo

```css
.pull-up {
    margin-top: -20px;  /* tira del elemento hacia arriba */
}

.overlap {
    margin-left: -10px;
}
```

```text
Margin negativo:

  - Tira del elemento en la dirección opuesta.
  - Útil para superposiciones controladas.
  - Útil para corregir espacios no deseados.
  - Cuidado con el efecto en el flujo.
```

## Aspect ratio

```css
.box {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #ccc;
}
```

```text
Aspect-ratio:

  - Proporción width:height.
  - Combina con width o height.
  - Útil para imágenes, videos, contenedores.
```

## Logical properties

```css
.box {
    margin-block: 1em;          /* margin-top y margin-bottom */
    margin-inline: 1em;         /* margin-left y margin-right */
    padding-block: 1em;
    padding-inline: 1em;
    border-block: 1px solid #000;
    border-inline: 1px solid #000;
}
```

```text
Logical properties:

  - block: vertical en LTR, horizontal en writing-mode vertical.
  - inline: horizontal en LTR, vertical en writing-mode vertical.
  - Adaptables a idiomas que escriben de derecha a izquierda.
  - Mejor para internacionalización.
```

### Inline-start vs inline-end

```css
.box {
    margin-inline-start: 1em;  /* margin-left en LTR, margin-right en RTL */
    border-inline-start: 1px solid #000;
}
```

```text
Direcciones:

  - inline-start: el lado de inicio (left en LTR, right en RTL).
  - inline-end: el lado final (right en LTR, left en RTL).
  - block-start: arriba (top).
  - block-end: abajo (bottom).
```

## Tabla resumen de propiedades

```text
Propiedad             Shorthand               Lado
─────────────────────────────────────────────────────
padding               padding: <all>           padding-top/right/bottom/left
border                border: <w> <s> <c>      border-top/right/bottom/left
border-width          border-width: <all>      border-top-width/...
border-style          border-style: <all>      border-top-style/...
border-color          border-color: <all>      border-top-color/...
border-radius         border-radius: <all>     border-top-left-radius/...
outline               outline: <w> <s> <c>     No por lado.
outline-offset        outline-offset: <value>  —
margin                margin: <all>            margin-top/right/bottom/left
margin-block          margin-block: <all>      —
margin-inline         margin-inline: <all>     —
```

## Trucos comunes

### Botón con border-radius perfecto

```css
.button {
    display: inline-block;
    padding: 0.5em 1em;
    border: 1px solid #ccc;
    border-radius: 0.25em;  /* ~4px */
    background: #f5f5f5;
    cursor: pointer;
}
```

### Card con box shadow

```css
.card {
    padding: 1em;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Stripes con border-image

```css
.striped {
    border: 4px solid;
    border-image: repeating-linear-gradient(
        45deg,
        transparent 0,
        transparent 10px,
        #000 10px,
        #000 20px
    ) 4;
}
```

### Centrado perfecto

```css
.parent {
    display: grid;
    place-items: center;
    min-height: 100vh;
}
```

## Errores comunes

```css
/* Mal: margin colapsa con el body */
body {
    margin: 0;  /* siempre */
}

h1 {
    margin-top: 1em;  /* empuja el contenido */
}

/* Mal: border sin style */
.box {
    border: 1px red;  /* invisble */
    border: 1px solid red;  /* OK */
}

/* Mal: padding no se hereda */
.parent {
    padding: 1em;  /* no se hereda */
}

.child {
    /* sin padding */
}

/* Mal: outline al usar position */
.tooltip {
    position: absolute;
    outline: 0;  /* no */
}
```

## Resumen en tres frases

- **Padding** es el espacio interior, **margin** es el exterior, **border** es la línea, **outline** es como el border pero sin afectar al layout.
- El **margin collapse** es intencional para tipografía (los párrafos no acumulan espacio vertical), pero puede ser confuso en layouts. Usa flex/grid o gap para evitarlo.
- Las **propiedades lógicas** (margin-block, padding-inline) son la forma moderna y consciente del idioma de escribir las cuatro propiedades del box model.

## Próximos pasos

- [[07-backgrounds-y-gradients|Backgrounds y gradients]]: cómo llenar las cajas con colores, imágenes y gradients. Background-color, background-image, background-position, background-repeat, background-attachment, background-clip y los gradients lineales, radiales y conic.
