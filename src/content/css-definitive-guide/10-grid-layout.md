---
title: "Grid Layout"
description: "El modelo de layout bidimensional. Cómo crear grids complejos con filas y columnas, áreas nombradas, alineamiento y el truco del subgrid"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, grid, layout, grid-template]
---

# Grid Layout

> [!abstract] Resumen
> Esta nota cubre el capítulo 12 del libro: **CSS Grid Layout**, el modelo de layout bidimensional. Permite crear grids complejos con filas y columnas, áreas nombradas, alineamiento y el reciente truco del subgrid. La herramienta principal para layouts de página completos.

## Por qué grid

Flexbox es unidimensional: una fila o una columna. **Grid** es bidimensional: filas **y** columnas a la vez.

```text
Flexbox vs Grid:

  Flexbox:  [item1] [item2] [item3]
  Grid:     ┌─────┬─────┬─────┐
            │item1│item2│item3│
            ├─────┼─────┼─────┤
            │item4│item5│item6│
            └─────┴─────┴─────┘
```

```text
Usa grid para:

  - Layouts de página completos.
  - Grids complejos (tipo Excel).
  - Cuando necesitas alinear en ambas dimensiones.
  - Layouts que cambian mucho entre breakpoints.

Usa flexbox para:

  - Componentes: navbars, cards, listas.
  - Cuando solo necesitas una dimensión.
  - Distribuir space entre items.
```

## Conceptos básicos

```css
.container {
    display: grid;
}
```

```text
Conceptos:

  - Grid container: el padre con display: grid.
  - Grid items: los hijos directos.
  - Grid lines: las líneas que separan filas y columnas.
  - Grid tracks: las filas y columnas.
  - Grid cells: la intersección de una fila y columna.
  - Grid areas: regiones rectangulares del grid.
```

```
        col1    col2    col3
        ├───────┼───────┼───────┤
row 1   │  cell │  cell │  cell │
        ├───────┼───────┼───────┤
row 2   │  cell │  cell │  cell │
        └───────┴───────┴───────┘
```

## grid-template-columns y grid-template-rows

```css
.container {
    display: grid;
    grid-template-columns: 100px 200px 100px;
    grid-template-rows: 50px 100px;
}
```

```text
grid-template-columns:

  - Define el número y tamaño de las columnas.
  - Tres columnas: 100px, 200px, 100px.
  - grid-template-rows: análogo para filas.

Valores:

  - length: 100px, 50%, 1fr.
  - fr: fracción del espacio sobrante.
  - auto: según el contenido.
  - min-content, max-content: según el contenido.
```

### La unidad fr

```css
.container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;  /* 3 columnas iguales */
    grid-template-columns: 1fr 2fr;       /* segunda el doble */
    grid-template-columns: 200px 1fr;      /* fija + flexible */
}
```

```text
fr:

  - Fracción del espacio sobrante.
  - 1fr 1fr 1fr: tres columnas iguales.
  - 1fr 2fr: la segunda el doble.
  - El espacio se distribuye DESPUÉS de los tamaños fijos.
```

### repeat()

```css
.container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-columns: repeat(auto-fill, 200px);
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

```text
repeat():

  - repeat(n, pattern): repite n veces.
  - auto-fill: tantas columnas como quepan.
  - auto-fit: igual, pero colapsa si no hay items.
```

### minmax()

```css
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

```text
minmax(min, max):

  - Define un rango de tamaño.
  - minmax(200px, 1fr): mínimo 200px, máximo 1fr.
  - Combinado con auto-fit/auto-fill: responsive grid.
  - El grid más común en producción.
```

## gap

```css
.container {
    display: grid;
    gap: 1rem;           /* ambos ejes */
    gap: 1rem 2rem;      /* row | column */
    row-gap: 1rem;
    column-gap: 2rem;
}
```

```text
gap en grid:

  - Espacio entre filas y columnas.
  - row-gap: espacio entre filas.
  - column-gap: espacio entre columnas.
  - Moderno, reemplaza los margin negativos.
```

## Posicionar items

### Líneas y áreas

```css
.container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 100px 100px;
}

.item-1 {
    grid-column: 1 / 3;       /* ocupa columnas 1 a 2 */
    grid-row: 1;               /* solo fila 1 */
}

.item-2 {
    grid-column: 3;
    grid-row: 1 / 3;
}
```

```text
Posición por líneas:

  - grid-column: 1 / 3: de línea 1 a línea 3 (excluyendo).
  - grid-row: 1: solo línea 1.
  - grid-column: span 2: ocupa 2 columnas.
```

### Área nombrada

```css
.container {
    display: grid;
    grid-template-columns: 1fr 3fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

```text
grid-template-areas:

  - Define un mapa visual.
  - Usar comillas para cada fila.
  - Nombres separados por espacio.
  - "." para celdas vacías.
  - Cada item se posiciona con grid-area: <nombre>.
```

### Visualización

```
┌─────────────────────────────────┐
│            header              │
├─────────┬───────────────────────┤
│         │                       │
│ sidebar │         main            │
│         │                       │
├─────────┴───────────────────────┤
│            footer              │
└─────────────────────────────────┘
```

## Grid placement

```css
/* Por línea */
.item-1 {
    grid-column-start: 1;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 2;
}

/* Shorthand */
.item-1 {
    grid-column: 1 / 3;       /* start / end */
    grid-row: 1 / 2;
}

/* Span */
.item-1 {
    grid-column: span 2;       /* ocupa 2 columnas */
}

/* Por área */
.item-1 {
    grid-area: header;          /* usa el área nombrada */
}
```

> [!tip] El ASCII art es tu amigo
> El libro recomienda: dibujar el grid en ASCII antes de escribir el CSS. Cada carácter es una celda. Es mucho más claro que los números.

## Grid auto-placement

Cuando no specifies posición, grid coloca los items automáticamente:

```css
.container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1em;
}

/* Los items se colocan en orden, llenando filas */
```

```text
Auto-placement:

  - grid-row y grid-column: auto.
  - grid-auto-flow: row (default) o column.
  - dense: rellena huecos.
  - Control fino del auto-placement.
```

### grid-auto-flow

```css
.container {
    grid-auto-flow: row;        /* default */
    grid-auto-flow: column;
    grid-auto-flow: row dense;
    grid-auto-flow: column dense;
}
```

```text
grid-auto-flow:

  - row: filas, llenando izquierda a derecha.
  - column: columnas, llenando arriba a abajo.
  - dense: rellena huecos (puede reordenar).
  - sparse (default): deja huecos.
```

## Alignment

```css
.container {
    display: grid;
    justify-items: center;     /* horizontal en cada celda */
    align-items: center;       /* vertical en cada celda */
    place-items: center;       /* ambos */
    
    justify-content: center;   /* grid completo en el contenedor */
    align-content: center;     /* grid completo en el contenedor */
    place-content: center;     /* ambos */
}
```

```text
justify-items:

  - Cómo se alinea el item en su celda (horizontal).
  - stretch (default), start, center, end.

align-items:

  - Cómo se alinea el item en su celda (vertical).
  - Igual que justify-items pero vertical.

justify-content:

  - Cómo se alinea el grid completo en el contenedor.
  - stretch, start, center, end, space-between, etc.

align-content:

  - Cómo se alinea el grid completo en el contenedor.
  - Vertical (si hay varias filas).
```

### align-self y justify-self

```css
.item-1 {
    align-self: center;       /* vertical dentro de la celda */
    justify-self: end;        /* horizontal dentro de la celda */
}
```

```text
Align-self / justify-self:

  - Sobreescribe align-items / justify-items.
  - Solo para el item específico.
```

## Implicit grid

Cuando un item se sale del grid explícito:

```css
.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 100px;      /* filas implícitas */
}

.item-3 {
    grid-column: 1;
    grid-row: 5;                /* fila no definida */
    /* Crea una fila implícita de 100px */
}
```

```text
Implicit grid:

  - grid-auto-rows: tamaño de filas automáticas.
  - grid-auto-columns: tamaño de columnas automáticas.
  - grid-auto-flow: cómo se colocan las nuevas filas/columnas.
```

## Subgrid

Una de las adiciones más esperadas:

```css
.parent {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
}

.child {
    display: grid;
    grid-template-columns: subgrid;  /* hereda las columnas del padre */
}

.grandchild {
    grid-column: 2;  /* la segunda columna del padre */
}
```

```text
subgrid:

  - El elemento hereda las columnas/filas del padre.
  - No necesita redefinir el grid.
  - El item se posiciona en las líneas del padre.
  - Útil para componentes anidados.
```

> [!tip] Subgrid es moderno
> El libro destaca: subgrid es relativamente nuevo. Soportado en navegadores modernos, pero no universal. Úsalo si puedes permitirte el soporte.

## Repeat y auto-fit

```css
/* El grid responsive más común */
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1em;
}
```

```text
Explicación:

  - auto-fit: tantas columnas como quepan.
  - minmax(250px, 1fr): cada columna entre 250px y 1fr.
  - Si caben 4 cards: 4 columnas.
  - Si caben 2: 2 columnas.
  - Si no caben 1: 1 columna (250px).
  - Sin media queries.
```

## Ejemplo típico: layout de página

```css
.page {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    min-height: 100vh;
}

.header {
    grid-row: 1;
}

.main {
    grid-row: 2;
}

.footer {
    grid-row: 3;
}
```

```text
Layout de página:

  - Header: altura automática.
  - Main: ocupa el espacio sobrante.
  - Footer: abajo.
  - 100vh: ocupa toda la pantalla.
```

## Ejemplo típico: 12 columnas

```css
.container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1em;
}

.col-6 {
    grid-column: span 6;
}

.col-4 {
    grid-column: span 4;
}

.col-3 {
    grid-column: span 3;
}
```

```text
Grid de 12 columnas:

  - Patrón típico de frameworks CSS.
  - Cada "col-N" ocupa N columnas.
  - El gap entre columnas.
  - Fácil de combinar.
```

## Grid + Flexbox

```css
.card {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 1em;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-body {
    /* contenido */
}

.card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5em;
}
```

```text
Grid + Flexbox:

  - Grid para el layout de página.
  - Flexbox para los componentes.
  - Cada herramienta para lo que es buena.
  - El libro recomienda esta combinación.
```

## Errores comunes

```css
/* Mal: grid sin template */
.container {
    display: grid;
    /* sin grid-template-columns */
    /* el grid es auto, sin estructura */
}

/* Mejor */
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* Mal: items sin posicionamiento */
.item {
    /* cada item se queda en auto-placement */
    /* puede no ser lo que quieres */
}

/* Mejor: usar áreas nombradas */
.container {
    grid-template-areas: "header header" "sidebar main";
}
```

## Grid template areas: dibujo

```text
Dibuja tu grid en ASCII antes de escribir CSS:

  ┌──────┬───────────────┐
  │      │               │
  │ nav  │    content     │
  │      │               │
  └──────┴───────────────┘

Equivale a:

  grid-template-areas:
    "nav    content"
    "nav    content";
```

## Resumen en tres frases

- **Grid** es el modelo de layout bidimensional: permite crear grids complejos con filas y columnas definidas, áreas nombradas y alineamiento en ambas dimensiones.
- Las propiedades clave son `grid-template-columns/rows`, `grid-template-areas`, `grid-column/row`, `gap`, `grid-auto-flow`, `justify-items`, `align-items`.
- El truco más útil es `repeat(auto-fit, minmax(250px, 1fr))` para crear grids responsive sin media queries.

## Próximos pasos

- [[11-table-layout|Table layout]]: cómo CSS maneja las tablas. Display table, table-row, table-cell, y los trucos específicos para tablas.
