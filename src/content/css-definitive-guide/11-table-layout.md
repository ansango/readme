---
title: "Table layout"
description: "Cómo CSS maneja las tablas. Display table, table-row, table-cell, y los trucos específicos para tablas en CSS"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, tables, table-layout, caption]
---

# Table layout

> [!abstract] Resumen
> Esta nota cubre el capítulo 13 del libro: cómo CSS maneja las **tablas**. Display valores para tablas (table, table-row, table-cell), los selectores específicos (`:nth-child` para filas), el caption, los colapsos de bordes, el table-layout y los trucos para tablas responsive.

## El elemento `<table>` y el display table

```html
<table>
    <caption>Tabla de datos</caption>
    <thead>
        <tr>
            <th>Nombre</th>
            <th>Edad</th>
            <th>Ciudad</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Ana</td>
            <td>30</td>
            <td>Madrid</td>
        </tr>
        <tr>
            <td>Bob</td>
            <td>25</td>
            <td>Barcelona</td>
        </tr>
    </tbody>
</table>
```

```text
Estructura semántica:

  - <table>: la tabla.
  - <caption>: el título (accesible).
  - <thead>: la cabecera.
  - <tbody>: el cuerpo.
  - <tfoot>: el pie (totales, etc.).
  - <tr>: una fila.
  - <th>: una celda de cabecera.
  - <td>: una celda de datos.
```

> [!tip] Tabla HTML vs div con display: table
> El libro recomienda: usa `<table>` siempre que el contenido sea una tabla. No simules con divs y display: table; pierdes la semántica.

## Display values para tablas

```css
.table      { display: table; }
.table-row  { display: table-row; }
.table-cell { display: table-cell; }
.table-header-group { display: table-header-group; }
.table-row-group    { display: table-row-group; }
.table-footer-group { display: table-footer-group; }
.table-caption { display: table-caption; }
```

```text
Display values:

  - table: el contenedor.
  - table-row: una fila.
  - table-cell: una celda.
  - table-header-group: el header.
  - table-row-group: el body.
  - table-footer-group: el footer.
  - table-caption: el título.
```

> [!warning] Solo para casos especiales
> El libro apunta: usar display: table con divs es un anti-patrón. Pierde semántica, accesi
> bilidad y selectores específicos.

## border-collapse

```css
table {
    border-collapse: collapse;     /* bordes compartidos */
    border-collapse: separate;    /* bordes separados (default) */
    border-spacing: 0;            /* con separate, sin espacio entre celdas */
}
```

```text
border-collapse:

  - separate: cada celda tiene su propio border.
  - collapse: los bordes se comparten.
  - border-spacing: con separate, el espacio entre celdas.
  - Por defecto: separate, que puede verse mal.
```

> [!tip] El 99% de las veces usa collapse
> El libro recomienda: `border-collapse: collapse` con `border-spacing: 0`. Es lo que espera el usuario.

## table-layout

```css
table {
    table-layout: auto;    /* default, se ajusta al contenido */
    table-layout: fixed;   /* tamaños fijos según table-layout */
}
```

```text
table-layout:

  - auto: el navegador ajusta las columnas al contenido.
  - fixed: las columnas tienen el tamaño del primer row.
  - fixed es más rápido para tablas grandes.
  - Con fixed, necesitas especificar anchos.
```

> [!tip] table-layout: fixed para tablas grandes
> El libro señala: con muchas filas, fixed es **mucho más rápido** porque el navegador no recalcula.

## Anchos de columnas

```css
table {
    table-layout: fixed;
    width: 100%;
}

th, td {
    padding: 0.5em;
}

th:nth-child(1), td:nth-child(1) { width: 30%; }
th:nth-child(2), td:nth-child(2) { width: 50%; }
th:nth-child(3), td:nth-child(3) { width: 20%; }
```

```text
Anchos:

  - Con table-layout: fixed, los anchos vienen de la primera fila.
  - <col>: definir anchos por columna.
  - <colgroup>: agrupar columnas.
  - nth-child: estilizar por posición.
```

## Alineación de tablas

```css
table {
    /* Centrar la tabla en su contenedor */
    margin: 0 auto;
}

caption {
    caption-side: top;       /* default */
    caption-side: bottom;
    text-align: center;
}

/* Alinear celdas */
th, td {
    text-align: left;        /* default */
    text-align: center;
    text-align: right;
    vertical-align: middle;  /* en tablas, centrar vertically */
}
```

```text
Alineación:

  - table: margin: auto para centrar.
  - caption: arriba o abajo.
  - text-align: en cada celda.
  - vertical-align: en cada celda (distinto de block).
```

## Pseudo-classes para tablas

```css
/* Filas alternas */
tr:nth-child(even) {
    background: #f5f5f5;
}

/* Primera fila */
tr:first-child {
    background: #333;
    color: white;
}

/* Última fila */
tr:last-child {
    border-bottom: 2px solid #000;
}

/* Hover */
tr:hover {
    background: #e0e0e0;
}
```

```text
Pseudo-classes:

  - :nth-child(odd/even): filas alternas.
  - :first-child: primera fila.
  - :last-child: última fila.
  - :hover: al pasar el mouse.
  - :nth-of-type(n): fila n.
```

## Tablas responsive

```css
/* Para tablas grandes en móvil */
.table-wrapper {
    overflow-x: auto;
}

table {
    min-width: 600px;
}
```

```text
Tabla responsive:

  - Envolver la tabla en un div con overflow-x: auto.
  - El scroll horizontal aparece en móvil.
  - min-width: ancho mínimo antes de scroll.
  - Es la solución más simple.
```

### Tabla con display: block

```css
@media (max-width: 600px) {
    table, thead, tbody, tr, th, td {
        display: block;
    }

    thead tr {
        position: absolute;
        top: -9999px;
        left: -9999px;
    }

    td {
        border: none;
        border-bottom: 1px solid #ccc;
        padding-left: 50%;
        position: relative;
    }

    td::before {
        content: attr(data-label);
        position: absolute;
        left: 0.5em;
        font-weight: bold;
    }
}
```

```html
<table>
    <thead>
        <tr>
            <th>Nombre</th>
            <th>Edad</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td data-label="Nombre">Ana</td>
            <td data-label="Edad">30</td>
        </tr>
    </tbody>
</table>
```

```text
Tabla reescrita:

  - En móvil, cada fila es un bloque.
  - td::before con data-label muestra el nombre de la columna.
  - Más trabajo pero mejor experiencia.
```

## empty-cells

```css
table {
    empty-cells: show;    /* default */
    empty-cells: hide;    /* oculta celdas vacías */
}
```

```text
empty-cells:

  - show: la celda vacía se muestra.
  - hide: la celda vacía no se muestra.
  - Solo aplica con border-collapse: separate.
```

## caption-side

```css
table {
    caption-side: top;       /* default */
    caption-side: bottom;
    caption-side: top outside;     /* fuera de la tabla */
    caption-side: bottom outside;
}
```

```text
caption-side:

  - top: el caption arriba de la tabla.
  - bottom: el caption abajo.
  - outside: separado de la tabla.
  - Útil para accesibilidad.
```

## border-spacing

```css
table {
    border-collapse: separate;
    border-spacing: 10px;          /* ambos ejes */
    border-spacing: 10px 20px;     /* horizontal | vertical */
}
```

```text
border-spacing:

  - Con separate, el espacio entre bordes.
  - Por defecto: 0.
  - Espacio entre celdas adyacentes.
  - No espacio entre celdas y border.
```

## Tabla recursiva

```css
table {
    table-layout: auto;
    border-collapse: collapse;
    width: 100%;
}

caption {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 0.5em;
}

th, td {
    padding: 0.5em 1em;
    border: 1px solid #ccc;
    text-align: left;
}

th {
    background: #f5f5f5;
    font-weight: bold;
}

tbody tr:nth-child(even) {
    background: #fafafa;
}

tbody tr:hover {
    background: #e8e8e8;
}
```

```text
Estilo base:

  - El libro recomienda este set de reglas como base.
  - Ajustar según el diseño.
  - table-layout: auto para tablas de datos pequeñas.
  - fixed para tablas grandes.
```

## Vertical-align en tablas

```css
td {
    vertical-align: top;       /* top, middle, bottom, baseline */
}
```

```text
Vertical-align:

  - En tablas, alinea el contenido de la celda.
  - middle: centra verticalmente.
  - baseline: alinea con la base del texto.
  - top: alinea arriba.
  - bottom: alinea abajo.
```

## Trucos comunes

### Tabla con primera columna fija

```css
.table-wrapper {
    overflow-x: auto;
}

table {
    table-layout: fixed;
    width: 100%;
}

td:first-child {
    position: sticky;
    left: 0;
    background: white;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}
```

### Tabla con sticky header

```css
.table-wrapper {
    max-height: 500px;
    overflow-y: auto;
}

th {
    position: sticky;
    top: 0;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Tabla con bordes solo entre filas

```css
table {
    border-collapse: collapse;
}

th, td {
    border: none;
    border-bottom: 1px solid #ccc;
}
```

### Tabla con zebra striping

```css
tbody tr:nth-child(odd) {
    background: #f5f5f5;
}

tbody tr:nth-child(even) {
    background: white;
}
```

### Tabla con cards en móvil

```css
@media (max-width: 600px) {
    table, thead, tbody, th, td, tr {
        display: block;
    }

    thead tr {
        display: none;
    }

    tr {
        border: 1px solid #ccc;
        margin-bottom: 1em;
    }

    td {
        display: flex;
        justify-content: space-between;
        border: none;
    }

    td::before {
        content: attr(data-label);
        font-weight: bold;
    }
}
```

## Resumen en tres frases

- **`<table>`** es el elemento semántico para datos tabulares. No lo simules con divs.
- `border-collapse: collapse` + `border-spacing: 0` es el 99% de las veces. `table-layout: fixed` para tablas grandes.
- En móvil, la mejor solución es **scroll horizontal** (envolver en un div con overflow-x: auto). Para UI más rica, reescribir la tabla con display: block y data-label.

## Próximos pasos

- [[12-fonts|Fonts]]: tipografía. Font families, sizes, weights, kerning, font synthesis, variable fonts y OpenType features. La base de la legibilidad.
