---
title: "CSS: The Definitive Guide"
description: "Índice de la wiki de CSS The Definitive Guide 5th ed: la guía de referencia completa para CSS, basada en el libro de Eric A. Meyer y Estelle Weyl"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, web, frontend, layout]
---

# CSS: The Definitive Guide

> [!abstract] Resumen
> Esta wiki toma como guía *CSS: The Definitive Guide: Web Layout and Presentation* (Eric A. Meyer y Estelle Weyl, O'Reilly, 5ª edición de junio de 2023). Es la referencia definitiva de CSS: cubre selectores, el modelo de caja, layout (flexbox, grid, positioning), tipografía, animaciones y mucho más. Las notas destilan los conceptos con ejemplos prácticos, listos para aplicar.

## Acerca del libro

Eric A. Meyer es uno de los referentes históricos de CSS. Ha escrito la guía definitiva desde la primera edición (2000), actualizada en cada revisión importante del estándar. La 5ª edición (junio 2023) cubre el estado del arte tras CSS Grid, subgrid, container queries y otras novedades recientes.

El libro es **el manual de referencia**. No es un tutorial paso a paso, aunque puedes seguirlo linealmente. Es más bien una **guía completa** que vuelve a cada propiedad con detalle, ejemplos y casos edge.

> [!quote] "This guide covers everything you need to know about CSS, from the syntax to the latest features."
> El libro es explícito: cubre **todo** lo que necesitas saber.

### Quién debería leer esta wiki

- **Frontend developers** que quieran una referencia completa de CSS.
- **Diseñadores web** que necesiten entender cómo CSS implementa sus diseños.
- **Estudiantes** de desarrollo web que busquen un manual estructurado.
- **Tech leads** que necesitan vocabulario común con su equipo.

## Cómo leer esta wiki

Las notas siguen el orden del libro. Cada capítulo tiene su propia nota, con algunas fusiones cuando los temas están estrechamente relacionados.

- **Capítulos 1-7** → una nota por capítulo (fundamentos).
- **Capítulos 8-21** → una nota por capítulo o por bloque temático, fusionando algunos.

Cada nota arranca con un `[!abstract]`, sigue con H2/H3, usa **callouts** cuando aportan (`tip`, `warning`, `danger`, `question`, `example`, `note`, `info`), incluye **bloques de código CSS** extensos, **diagramas** cuando simplifican la comprensión, y cierra con `## Próximos pasos` enlazando a la siguiente nota.

## Bloques temáticos

### Fundamentos

- [[01-css-fundamentals|CSS Fundamentals]]: introducción. Sintaxis, cómo se aplica CSS, marcado básico.
- [[02-selectors-y-pseudo-classes|Selectors y pseudo-classes]]: cómo seleccionar elementos. Selectores básicos, combinadores, pseudo-classes, pseudo-elements, attribute selectors.
- [[03-specificity-cascade-y-inheritance|Specificity, cascade y inheritance]]: por qué algunas reglas ganan y otras no. La base para evitar frustraciones.
- [[04-values-and-units|Values and units]]: los valores que toman las propiedades. Números, porcentajes, longitudes, colores, time, custom properties.

### El modelo de caja

- [[05-basic-visual-formatting|Basic visual formatting]]: el box model. Display, sizing, block vs inline.
- [[06-padding-borders-outlines-margins|Padding, borders, outlines, margins]]: las cuatro propiedades del box model.

### Decoración visual

- [[07-backgrounds-y-gradients|Backgrounds y gradients]]: fondos, imágenes, gradients lineales, radiales, conic.
- [[11-table-layout|Table layout]]: cómo CSS maneja las tablas.
- [[12-fonts|Fonts]]: tipografía. Familias, tamaños, pesos, fuentes variables.
- [[13-text-properties|Text properties]]: alineación, decoración, transformaciones, escritura.

### Layout

- [[08-floating-and-positioning|Floating and positioning]]: float, position (relative, absolute, fixed, sticky), z-index.
- [[09-flexbox|Flexbox]]: el modelo de layout unidimensional.
- [[10-grid-layout|Grid Layout]]: el modelo de layout bidimensional.

### Contenido y presentación

- [[14-lists-y-generated-content|Lists y generated content]]: list markers, contadores, content, comillas.

### Transformaciones y animaciones

- [[15-transforms-transitions-y-animation|Transforms, transitions y animation]]: 2D, 3D, transiciones, keyframes.
- [[16-filters-blending-clipping-masking|Filters, blending, clipping, masking]]: filtros, modos de fusión, máscaras.

### Reglas y directivas

- [[17-css-at-rules-y-media-queries|CSS At-Rules y media queries]]: @media, @supports, @import, @container.

### Cierre

- [[18-glosario-y-referencias|Glosario y referencias]]: glosario CSS, libros de referencia, sitios web clave.
- [[19-epilogo-y-claves|Epílogo y claves]]: cierre + ideas recurrentes + cómo seguir.

## Temas transversales

> [!tip] Cinco ideas que vuelven en cada capítulo
> El libro tiene una estructura interna que se repite:
> 1. **Syntax**: cómo se escribe la propiedad.
> 2. **Values**: qué valores acepta.
> 3. **Computed values**: cómo se calculan los valores finales.
> 4. **Inheritance**: qué se hereda y qué no.
> 5. **Animatable**: si la propiedad se puede animar.
>
> Si entiendes este patrón, cualquier propiedad nueva la aprendes más rápido.

## Cómo usar esta wiki

La wiki está diseñada para **dos lecturas**:

1. **Lectura secuencial**: si quieres aprender CSS desde cero, sigue el orden. Las notas explican los conceptos antes de entrar en las propiedades.

2. **Referencia rápida**: si necesitas consultar una propiedad, ve al capítulo correspondiente. Cada nota tiene secciones claras, ejemplos aislados y tablas resumen.

## Próximos pasos

- [[01-css-fundamentals|CSS Fundamentals]]: el primer paso. Cómo se escribe CSS, cómo se aplica al HTML, y los conceptos que vertebran todo lo demás.
