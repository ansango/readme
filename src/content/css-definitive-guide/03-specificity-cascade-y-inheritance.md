---
title: "Specificity, cascade y inheritance"
description: "Por qué algunas reglas CSS ganan y otras no. Specificity, !important, origen, cascada, herencia y el orden de declaración"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, specificity, cascade, inheritance]
---

# Specificity, cascade y inheritance

> [!abstract] Resumen
> Esta nota cubre el capítulo 4 del libro: cómo CSS decide qué regla aplicar cuando varias coinciden. El sistema de **specificity**, el papel de `!important`, el **origen** de las reglas (autor, usuario, navegador), el **orden de declaración** y la **herencia**. Sin entender esto, el CSS se vuelve frustrante e impredecible.

## El problema

```css
/* ¿Qué color tiene el párrafo? */
p { color: black; }
.intro { color: blue; }
#main p { color: red; }
```

```text
El navegador recibe:

  Tres reglas para <p>.
  Cada una con un color distinto.
  ¿Cuál aplica?
```

> [!tip] La respuesta es la specificity
> El navegador usa un sistema de **scoring** llamado specificity. Cada selector tiene un peso. El de mayor peso gana.

## Specificity

La specificity es un **número de 4 dígitos** que se calcula así:

```text
Specificity = (a, b, c, d)

  a: ¿Hay !important? → 1 si sí, 0 si no.
  b: Selectores de ID (#id).
  c: Selectores de clase (.class), atributos ([attr]), pseudo-clases (:hover).
  d: Selectores de tipo (div, p), pseudo-elements (::before).
```

### Ejemplo

```css
/* (0, 0, 0, 1) - solo tipo */
p { color: red; }

/* (0, 0, 1, 0) - solo clase */
.intro { color: blue; }

/* (0, 1, 0, 0) - solo ID */
#main { color: green; }

/* (0, 0, 1, 1) - clase + tipo */
p.intro { color: yellow; }

/* (0, 1, 0, 1) - ID + tipo */
div#main { color: orange; }

/* (0, 1, 2, 1) - ID + 2 clases + tipo */
#main p.intro.warning { color: pink; }
```

> [!note] Los números no se comparan como decimales
> `(0, 1, 0, 0)` (un ID) gana a `(0, 0, 100, 0)` (cien clases). **Una IDsiempre gana sobre cualquier número de clases**.

### Specificity práctica

```text
Specificity (de mayor a menor):

  !important: 1, 0, 0, 0, 0
  inline style: 1, 0, 0, 0, 0  (en specificity)
  #id: 0, 1, 0, 0
  .class, [attr], :pseudo-class: 0, 0, 1, 0
  element, ::pseudo-element: 0, 0, 0, 1
  * universal: 0, 0, 0, 0
```

## Cómo se calcula paso a paso

```css
#main .article p.warning::before {
    /* 
    #main → (0, 1, 0, 0)
    .article → (0, 0, 1, 0)
    p → (0, 0, 0, 1)
    .warning → (0, 0, 1, 0)
    ::before → (0, 0, 0, 1)
    
    Total: (0, 1, 2, 2)
    */
}
```

```text
Cálculo:

  Componente   | a | b | c | d
  ---|
  #main        | 0 | 1 | 0 | 0
  .article     | 0 | 0 | 1 | 0
  p            | 0 | 0 | 0 | 1
  .warning     | 0 | 0 | 1 | 0
  ::before     | 0 | 0 | 0 | 1
  ---|
  TOTAL        | 0 | 1 | 2 | 2
```

## El algoritmo de la cascada

Cuando varias reglas tienen la **misma specificity**, el navegador usa un algoritmo de **cascada**:

```text
Orden de la cascada:

  1. Origen y !important:
     a) Origen del agente (declaraciones del navegador).
     b) Declaraciones del usuario.
     c) Declaraciones del autor.
     d) Animaciones.
     e) Transiciones.
     f) Declaraciones del autor !important.
     g) Declaraciones del usuario !important.
     h) Declaraciones del agente !important.
     i) !important en transitions.

  2. Especificidad (de mayor a menor).

  3. Orden de aparición (último gana).
```

```text
Visualizando:

  Mayor prioridad
  ↑
  Agent !important
  User !important
  Author !important
  --- Animations ---
  --- Transitions ---
  Author normal
  User normal
  Agent normal
  ↓
  Menor prioridad
```

### Ejemplo práctico

```css
/* En el archivo CSS, en este orden: */
p { color: red; }                /* specificity (0, 0, 0, 1), gana por orden */
.intro { color: blue; }            /* specificity (0, 0, 1, 0) */
.intro { color: green; }           /* specificity (0, 0, 1, 0), gana por orden */
```

```text
Resultado:

  <p>     → red (única regla)
  <p class="intro"> → green (última con specificity igual)
```

```css
/* Cambiando el orden */
p { color: red; }
.intro { color: blue; }            /* specificity (0, 0, 1, 0) */
#main p { color: purple; }          /* specificity (0, 1, 0, 1) */
.intro { color: green; }           /* specificity (0, 0, 1, 0) */
```

```text
Resultado:

  <p>     → red (única regla)
  <p class="intro"> → blue (1ª .intro)
  <p id="main"> → purple (específico gana)
  <p id="main" class="intro">
    → purple (specificity (0,1,0,1) > (0,0,1,0))
```

> [!tip] La specificity gana siempre sobre el orden
> El orden de declaración es el **último** criterio. Solo importa cuando las specificities son iguales.

## !important

```css
p { color: red; }
p { color: blue !important; }
```

```text
!important:

  - Añade la declaración al "nivel !important" del autor.
  - Solo el !important del usuario y el !important del agente pueden sobreescribirlo.
  - No es parte de la specificity.
  - USE CON CUIDADO.
```

### Cuándo usar !important

```css
/* Aceptable: utility classes */
.hidden { display: none !important; }

/* Aceptable: casos extremos */
body { margin: 0 !important; }

/* NO: para tapar specificity */
#main .article p.intro { color: red !important; }
```

> [!warning] El libro es claro
> !important es **escaparate de emergencia**. Si lo usas para tapar problemas de specificity, tienes un problema de diseño, no un problema de !important.

> [!tip] Mejor diseñar especificities
> El libro recomienda: diseña specificitys desde el principio, no las arregles con !important.

## Herencia

La herencia es automática para algunas propiedades:

```css
body {
    color: navy;
    font-family: sans-serif;
}

h1 {
    font-size: 2em;  /* no se hereda */
}

h1 {
    color: inherit;  /* fuerza la herencia */
}
```

```text
Herencia:

  - Algunas propiedades se heredan por defecto.
  - Otras no.
  - Se puede forzar con inherit.
  - No se hereda si specificity 0 está activa.
```

### Propiedades que se heredan

```text
Sí se heredan:

  color, font, font-family, font-size,
  font-weight, font-style, line-height,
  letter-spacing, text-align, text-indent,
  text-transform, white-space, word-spacing,
  visibility, cursor, list-style, list-style-type,
  direction, unicode-bidi
```

### Propiedades que NO se heredan

```text
No se heredan:

  width, height, padding, margin, border,
  background, position, display, top, left,
  right, bottom, float, overflow, z-index,
  vertical-align, text-decoration, transform
```

### Forzar herencia

```css
.inherited {
    color: inherit;        /* toma el del padre */
    font-size: revert;     /* toma el del padre */
    border: initial;       /* valor inicial del spec */
    border: unset;         /* inherit o initial según contexto */
}
```

```text
Valores especiales:

  - inherit: el valor del padre.
  - initial: el valor inicial del spec.
  - revert: el valor del padre (del user agent).
  - unset: como si no se hubiera declarado.
```

## Specificity de !important

```css
.intro { color: blue; }            /* normal */
#main .intro { color: red; }       /* ID gana */
.instructor { color: green !important; }  /* !important del autor */
```

```text
Orden efectivo:

  .instructor (con !important) > #main .intro > .intro
```

> [!note] !important rompe la specificity
> Cuando hay !important, la specificity no cuenta. Lo que cuenta es el orden de !important.

## Casos prácticos

### Reset de estilos

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
```

```text
Reset:

  - Universal * con specificity (0, 0, 0, 0).
  - Solo gana si no hay otra regla.
  - Se sobrescribe con cualquier specificity.
```

### Style inheritance

```css
/* En la cabecera del sitio */
header {
    color: #333;
    font-family: sans-serif;
}

/* El header es padre de todos los hijos */
header h1, header h2, header p {
    color: inherit; /* toma el de header */
}
```

> [!tip] Herencia vs specificity
> La herencia es **automática** y **general**. La specificity es **mecánica** y **específica**. Usa inheritance para "temas", specificity para "ajustes".

## Specificity de selectores anidados

```css
/* Un único selector */
.parent .child { color: red; }     /* (0, 0, 2, 0) */

/* Anidado en pre-procesador */
.parent {
    .child {
        color: red;
    }
}

/* Compilado a */
.parent .child { color: red; }     /* (0, 0, 2, 0) - igual */
```

```text
Pre-procesadores:

  - Sass, Less, PostCSS.
  - Anidan el código, pero la specificity no cambia.
  - El navegador ve los selectores aplanados.
```

## Pseudo-classes y specificity

```css
/* :is() usa la specificity del más específico */
:is(h1, h2, h3) { color: red; }    /* specificity = (0, 0, 0, 1), la más alta */

/* :where() tiene specificity 0 */
:where(h1, h2, h3) { color: red; }  /* specificity (0, 0, 0, 0) */

/* :not() usa la specificity del argumento */
:not(p) { color: red; }             /* specificity = (0, 0, 0, 1) */
```

> [!tip] :where() es un "reset" de specificity
> Si quieres reglas base con specificity 0, usa :where():where(h1, h2, h3) { margin: 0; } te da specificity cero.

## Cascada y unidades

```css
/* Argumento heredado */
:root {
    --main-color: navy;
}

.card {
    color: var(--main-color);  /* hereda la variable */
}
```

```text
Custom properties:

  - Se heredan por defecto.
  - Se sobrescriben a nivel de cascada.
  - Permiten tematización.
```

## Tabla resumen de cascada

```text
Cascada (de mayor a menor prioridad):

  1. Agent !important
  2. User !important
  3. Author !important
  4. Animations
  5. Author normal
  6. User normal
  7. Agent normal
  8. (no match) → valor inicial

Dentro de "Author normal":
  - Specificity más alta gana.
  - Si empatan, gana la última declaración.
```

## Buenas prácticas

### Diseñar especificities

```css
/* Bien: 1 especificidad por nivel */
:root { color: blue; }              /* specificity 0, 0, 0, 1 */
.button { color: blue; }            /* specificity 0, 0, 1, 0 */
.button.primary { color: white; }   /* specificity 0, 0, 2, 0 */

/* Mal: IDs que contaminan */
div#main .article .content p { color: blue; }  /* specificity alta */
```

### Minimizar IDs

```css
/* Bien */
.card { }
.card-title { }

/* Mal */
#header .card .card-title { }
```

### Usar especificidad plana

```css
/* Todas las reglas tienen specificity similar */
.btn { } /* (0, 0, 1, 0) */
.btn-lg { } /* (0, 0, 1, 0) */
.btn-primary { } /* (0, 0, 1, 0) */
```

## Resumen en tres frases

- Cuando varias reglas aplican, el navegador usa **specificity** + **cascada** + **orden** para decidir cuál gana.
- La specificity se calcula con un **número de 4 dígitos** (a, b, c, d). Un selector de tipo pesa menos que una clase, que pesa menos que un ID.
- Usa `!important` solo en casos extremos. Mejor diseñar specificitys **planas** desde el principio.

## Próximos pasos

- [[04-values-and-units|Values and units]]: los valores que toman las propiedades. Números, porcentajes, longitudes, colores, time, custom properties. La base para escribir CSS.
