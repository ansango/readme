---
title: "Fonts"
description: "Tipografía en CSS. Font families, sizes, weights, kerning, font synthesis, variable fonts y OpenType features. La base de la legibilidad"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, fonts, typography, variable-fonts]
---

# Fonts

> [!abstract] Resumen
> Esta nota cubre el capítulo 14 del libro: las **fuentes** en CSS. Font families, sizes, weights, kerning, font synthesis, variable fonts y OpenType features. La tipografía es el 80% de la legibilidad de un sitio web.

## Font family

```css
body {
    font-family: "Helvetica Neue", Arial, sans-serif;
}

code {
    font-family: "JetBrains Mono", Consolas, monospace;
}
```

```text
Font family:

  - Lista de fuentes separadas por coma.
  - El navegador usa la primera disponible.
  - Última opción: una familia genérica.
  - Nombres con espacios: comillas.
  - Nombres sin espacios: sin comillas.
```

### Familias genéricas

```css
body {
    font-family: serif;          /* con "patas" */
}

code {
    font-family: monospace;      /* ancho fijo */
}

h1 {
    font-family: sans-serif;     /* sin "patas" */
}

.cursive {
    font-family: cursive;        /* manuscrita */
}

.fantasy {
    font-family: fantasy;        /* decorativa */
}

.ui {
    font-family: system-ui;      /* la del sistema */
}
```

```text
Familias genéricas:

  - serif: con remates (Times, Georgia).
  - sans-serif: sin remates (Helvetica, Arial).
  - monospace: ancho fijo (Courier, Consolas).
  - cursive: manuscrita (Comic Sans).
  - fantasy: decorativa (Impact).
  - system-ui: la del sistema.
```

> [!tip] system-ui es moderno
> El libro recoge: `system-ui` usa la fuente del sistema operativo. Da una experiencia más rápida y familiar.

### @font-face

```css
@font-face {
    font-family: "MiFuente";
    src: url("fonts/mifuente-regular.woff2") format("woff2"),
         url("fonts/mifuente-regular.woff") format("woff");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
```

```text
@font-face:

  - Define una fuente personalizada.
  - src: URL con format() opcional.
  - font-weight, font-style: para esa variante.
  - font-display: cómo se muestra mientras carga.
```

### Formatos de fuente

```text
Formatos:

  - WOFF2: el mejor, comprimido, soportado por todos los navegadores actuales.
  - WOFF: comprimido, aún soportado.
  - TTF: TrueType, sin compresión.
  - EOT: solo IE.
  - SVG: antiguo, no usar.
```

> [!tip] WOFF2 es el estándar
> El libro recomienda: usa WOFF2 con fallback a WOFF para navegadores antiguos. WOFF2 es ~30% más pequeño que WOFF.

## Font size

```css
body {
    font-size: 16px;        /* absoluto */
    font-size: 1rem;        /* relativo al root */
    font-size: 100%;        /* relativo al default del navegador */
}

h1 {
    font-size: 2em;         /* relativo al padre */
}
```

```text
Font size:

  - px: absoluto.
  - rem: relativo al root.
  - em: relativo al padre.
  - %: como em.
  - Default: 16px (configurable por el usuario).
```

### rem vs em

```css
html {
    font-size: 16px;
}

.parent {
    font-size: 1.5em;  /* 24px */
}

.child {
    font-size: 1.5em;  /* 36px (1.5 * 24px) */
}

.other-child {
    font-size: 1.5rem;  /* 24px (1.5 * 16px) */
}
```

```text
rem vs em:

  - em: relativo al padre. Compone.
  - rem: relativo al root. No compone.
  - rem es más predecible.
  - em es más "natural" en herencia.
```

### Tamaño relativo al viewport

```css
.hero {
    font-size: 10vw;        /* 10% del viewport width */
}

.responsive-text {
    font-size: clamp(1rem, 2vw + 0.5rem, 2rem);
}
```

```text
Viewport units:

  - vw: 1% del viewport width.
  - vh: 1% del viewport height.
  - vmin: el menor de vw y vh.
  - vmax: el mayor de vw y vh.
  - clamp: tamaño entre un rango.
```

## Font weight

```css
.text {
    font-weight: normal;       /* 400 */
    font-weight: bold;        /* 700 */
    font-weight: 100;          /* thin */
    font-weight: 900;          /* black */
    font-weight: lighter;       /* más ligero que el padre */
    font-weight: bolder;       /* más pesado que el padre */
}
```

```text
Font weight:

  - keywords: normal, bold, lighter, bolder.
  - numéricos: 100-900, en pasos de 100.
  - bold = 700, normal = 400.
  - La fuente debe tener esa variante.
  - Si no la tiene, el navegador interpola.
```

> [!tip] Usa variables
> El libro recomienda: define variables para los weights que uses. `--font-weight-normal: 400; --font-weight-bold: 700;`.

## Font style

```css
.text {
    font-style: normal;
    font-style: italic;
    font-style: oblique;
    font-style: oblique 10deg;   /* ángulo fijo */
}
```

```text
Font style:

  - normal: el default.
  - italic: cursiva diseñada.
  - oblique: la misma fuente inclinada.
  - oblique Ndeg: ángulo personalizado.
  - No todas las fuentes tienen cursiva.
```

## Font stretch

```css
.text {
    font-stretch: normal;
    font-stretch: condensed;
    font-stretch: expanded;
    font-stretch: 50%;          /* del 50% al 200% */
}
```

```text
Font stretch:

  - normal: el ancho normal.
  - condensed: más estrecho.
  - expanded: más ancho.
  - Porcentajes: 50% (más estrecho) a 200% (más ancho).
  - Solo útil con fonts que tienen variantes.
```

## Font size adjustment

```css
@font-face {
    font-family: "Fallback";
    src: local("Fallback");
    size-adjust: 105%;
    ascent-override: 90%;
    descent-override: 20%;
}
```

```text
size-adjust:

  - Ajusta el tamaño cuando se usa como fallback.
  - Útil para que el cambio de fuente no mueva el layout.
  - ascent-override: altura desde la línea base.
  - descent-override: profundidad desde la línea base.
```

## Font kerning

```css
.text {
    font-kerning: auto;       /* default */
    font-kerning: normal;
    font-kerning: none;
}
```

```text
Font kerning:

  - Ajusta el espacio entre pares de letras específicos.
  - "AV" se ajusta para que no se vea mal.
  - auto: el navegador decide.
  - normal: kerning estándar.
  - none: sin kerning.
```

## Font feature settings

```css
.text {
    font-feature-settings: "kern" 1;
    font-feature-settings: "liga" 1;
    font-feature-settings: "liga" 1, "dlig" 1;
    font-feature-settings: "tnum" 1;
}
```

```text
OpenType features:

  - liga: ligaduras estándar (fi → fi).
  - dlig: ligaduras decorativas.
  - smcp: small caps.
  - tnum: tabular nums (123.456, ancho fijo).
  - lnum: lining nums (123, ancho variable).
  - onum: old-style nums (123, variables).
  - kern: kerning.
```

> [!tip] OpenType features son poderosas
> El libro destaca: muchas fuentes tienen docenas de features. Activarlas correctamente mejora la tipografía mucho.

## Font variant

```css
.text {
    font-variant: small-caps;
    font-variant-caps: all-small-caps;
    font-variant-caps: all-petite-caps;
    font-variant-numeric: tabular-nums;
    font-variant-numeric: slashed-zero;
    font-variant-ligatures: common-ligatures;
    font-variant-ligatures: no-common-ligatures;
    font-variant-east-asian: ruby;
}
```

```text
Font variant:

  - shorthand para un grupo de features.
  - font-variant-caps: small-caps, all-small-caps, etc.
  - font-variant-numeric: tabular-nums, oldstyle-nums, etc.
  - font-variant-ligatures: ligaduras.
  - font-variant-east-asian: asian typography.
```

## Variable fonts

```css
@font-face {
    font-family: "MiVariableFont";
    src: url("font.woff2") format("woff2-variations");
}

.text {
    font-family: "MiVariableFont";
    font-weight: 350;        /* cualquier peso, no solo 100, 200, ..., 900 */
    font-stretch: 80%;      /* cualquier stretch */
    font-style: oblique 5deg; /* cualquier ángulo */
}
```

```text
Variable fonts:

  - Una sola fuente, múltiples variaciones.
  - font-weight de 1 a 1000 (no solo 100, 200, ..., 900).
  - font-stretch de 50% a 200%.
  - font-style de 0deg a 90deg.
  - font-variation-settings: acceso low-level.
```

### font-variation-settings

```css
.text {
    font-variation-settings: "wght" 400, "slnt" -5, "ital" 1;
}
```

```text
font-variation-settings:

  - Acceso low-level a los axes de variación.
  - "wght": weight.
  - "slnt": slant.
  - "ital": italic.
  - "opsz": optical size.
  - Varía según la fuente.
```

> [!tip] Variable fonts son el futuro
> El libro recomienda: usa variable fonts para reducir el número de archivos y tener más control. Soporte amplio en navegadores modernos.

## Font shorthand

```css
.text {
    font: italic small-caps bold 1.2em/1.5 "Helvetica Neue", sans-serif;
}
```

```text
Font shorthand:

  - font-style | font-variant | font-weight | font-size/line-height | font-family.

  - El orden importa.
  - font-size y font-family son obligatorios.
  - Otros valores opcionales.
  - Otros (kerning, features) se ponen por separado.
```

## @font-face avanzado

```css
/* Una declaración para múltiples variantes */
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2") format("woff2-variations");
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}

/* Lazy loading */
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2");
    font-display: optional;  /* si no carga, usa fallback */
}
```

### font-display

```css
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2");
    font-display: auto;        /* default */
    font-display: block;       /* bloque hasta que cargue */
    font-display: swap;        /* usa fallback mientras carga */
    font-display: fallback;    /* muestra fallback breve */
    font-display: optional;    /* usa fallback si no está lista */
}
```

```text
font-display:

  - auto: el navegador decide.
  - block: invisible hasta que cargue.
  - swap: usa fallback, salta a la real.
  - fallback: usa fallback breve.
  - optional: opcional, sin cambio brusco.
```

> [!tip] font-display: swap para contenido
> El libro recomienda: usa `swap` para contenido (no es tan malo mostrar fallback breve), `optional` para logos y elementos críticos.

## Loading strategy

```html
<!-- Preload crítico -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
```

```css
/* Carga asíncrona */
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2");
    font-display: swap;
}
```

```text
Estrategias:

  - preload: cargada antes de que se use.
  - preload + font-display: swap: rápida + sin FOIT.
  - font-display: optional: si no carga, fallback.
```

## Font loading API

```css
/* Para casos complejos: usar JavaScript */
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2");
}

@font-face {
    font-family: "MiFuente Fallback";
    src: local("Arial");
    size-adjust: 105%;
    ascent-override: 90%;
    descent-override: 20%;
}
```

```js
// JavaScript: detectar carga de fuente
document.fonts.ready.then(() => {
    document.body.classList.add('fonts-loaded');
});
```

## Resumen de propiedades

```text
Propiedad             Uso
─────────────────────────────────────────────────────
font-family           Lista de fuentes.
font-size             Tamaño.
font-weight           Grosor.
font-style            Estilo.
font-variant          small-caps, ligatures, etc.
font-stretch          Ancho.
font-kerning          Ajuste entre letras.
font-feature-settings OpenType features.
font-variation-settings Para variable fonts.
font-display          Comportamiento de carga.
```

## Errores comunes

```css
/* Mal: font-size sin unidad */
.text {
    font-size: 16;  /* no funciona */
}

/* Mal: font-size en porcentaje sobre algo que no es size */
.text {
    font-size: 50%;  /* del font-size del padre */
}

/* Mal: font-family sin fallback */
.text {
    font-family: "FuenteRaraQueNoExiste";  /* texto invisible */
}

/* Mal: @font-face sin font-display */
@font-face {
    font-family: "MiFuente";
    src: url("font.woff2");
    /* FOIT: invisible hasta que cargue */
}
```

## Resumen en tres frases

- **Font family** es una lista de fuentes con fallback a una familia genérica. WOFF2 es el formato estándar.
- **Font size** se expresa en `rem` (relativo al root) `em` (relativo al padre) o `px` (absoluto). `clamp()` da tamaños fluidos.
- **Variable fonts** son una sola fuente con múltiples variaciones controlables. Reducen el tamaño y dan más control que las fuentes estáticas.

## Próximos pasos

- [[13-text-properties|Text properties]]: cómo se ve el texto. Alineación, decoración, transformaciones, whitespaces, writing modes y vertical-align.
