---
title: "Geometría 2D y técnicas de extrusión"
description: "Modelado en dos dimensiones, extrusión lineal y rotacional, compensación morfológica con offset, tipografía e importación de vectores DXF/SVG en OpenSCAD"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, 2d-shapes, linear-extrude, rotate-extrude, offset, text, vector-graphics]
---

# Geometría 2D y técnicas de extrusión

> [!abstract] Resumen
> Una gran cantidad de piezas mecánicas complejas son intrínsecamente más sencillas de concebir a partir de su perfil o "sombra" bidimensional en el plano $XY$ que mediante la combinación directa de sólidos 3D. OpenSCAD permite dibujar primitivas 2D (`circle`, `square`, `polygon`, `text`), aplicarles transformaciones y operaciones booleanas en el plano, y transformarlas en sólidos tridimensionales mediante dos potentes operadores: `linear_extrude()` (con torsión y conicidad) y `rotate_extrude()` (sólidos de revolución). Además, el operador `offset()` proporciona control milimétrico sobre espesores de pared y holguras.

---

## Primitivas bidimensionales (Plano $XY$)

Las formas 2D existen estrictamente en el plano $Z = 0$.

```text
       ┌──────────┐              ▲              ┌───────────────┐
       │          │            /   \            │               │
       │    •     │          /   •   \          │  Texto / TXT  │
       │          │        /           \        │               │
       └──────────┘       └─────────────┘       └───────────────┘
     square([x,y])         polygon([[x,y]..])      text("OpenSCAD")
```

### 1. Cuadrados y rectángulos (`square`)

```openscad
// Rectángulo de 40mm de ancho (X) por 20mm de largo (Y)
square([40, 20]);

// Cuadrado centrado en el origen (0,0)
square([30, 30], center = true);
```

---

### 2. Círculos y polígonos regulares (`circle`)

```openscad
// Círculo por radio o diámetro
circle(r = 15, $fn = 50);
circle(d = 30, $fn = 50);

// Polígono regular (por ejemplo, octógono regular)
circle(r = 20, $fn = 8);
```

---

### 3. Polígonos arbitrarios por vértices (`polygon`)

Permite trazar cualquier contorno cerrado especificando una lista ordenada de coordenadas `[x, y]`:

```openscad
// Trapezoide definido por sus 4 vértices perimetrales
polygon(points = [
    [0, 0],
    [30, 0],
    [20, 15],
    [5, 15]
]);
```

> [!tip] Orden de los vértices
> Los puntos del array de vértices deben declararse en orden secuencial continuo (en sentido horario o antihorario) recorriendo el perímetro de la figura. No es necesario repetir el punto inicial: OpenSCAD cierra automáticamente el contorno.

---

### 4. Generación de texto y tipografía (`text`)

El comando `text()` genera perfiles 2D a partir de cadenas de caracteres, admitiendo fuentes del sistema, alineaciones y símbolos Unicode.

```openscad
// Texto con parámetros de tamaño y alineación
text(
    text = "REV 1.2",
    size = 8,
    font = "Liberation Sans:style=Bold",
    halign = "center",
    valign = "center"
);

// Conversión de números a cadena mediante str()
numero_serie = 42;
text(str("ID-", numero_serie), size = 6);
```

---

## Operaciones morfológicas en 2D: `offset()`

El operador `offset()` expande (*dilatación*) o contrae (*erosión*) el contorno de una figura 2D por una distancia determinada. Es la herramienta estándar para crear espesores de pared constantes, vaciados de cajas y rebordes de tapas.

```openscad
// Ejemplo: Caja hueca con pared de 2.5 mm mediante offset()
linear_extrude(height = 20) {
    difference() {
        square([60, 40], center = true);            // Perímetro exterior
        offset(r = -2.5) square([60, 40], center = true); // Interior contraído
    }
}
```

```text
       ┌──────────────────────────────┐
       │   Pared exterior             │
       │   ┌──────────────────────┐   │
       │   │  offset(-2.5)        │   │
       │   │                      │   │
       │   └──────────────────────┘   │
       └──────────────────────────────┘
```

### Variantes de `offset`:
- `offset(r = d)`: Redondea todas las esquinas exteriores al dilatar o las interiores al contraer.
- `offset(delta = d, chamfer = true)`: Mantiene esquinas biseladas o vivas sin redondeo circular.

---

## De 2D a 3D: Extrusión lineal (`linear_extrude`)

Eleva una figura plana a lo largo del eje $Z$. Admite efectos avanzados como torsión helicoidal (`twist`) y factor de escalado progresivo (`scale`).

```openscad
// 1. Extrusión recta básica
linear_extrude(height = 15) {
    circle(r = 10, $fn = 40);
}

// 2. Columna helicoidal con torsión y estrechamiento
linear_extrude(height = 60, twist = 90, scale = 0.5, slices = 100) {
    square([20, 20], center = true);
}
```

- `height`: Altura total en $Z$.
- `twist`: Ángulo total de rotación en grados a lo largo de la extrusión.
- `scale`: Escala del extremo superior relativo a la base (crea conos, pirámides o formas piramidales giradas).
- `slices`: Número de subdivisiones intermedias verticales necesarias para que la torsión quede suave.

---

## De 2D a 3D: Extrusión rotacional (`rotate_extrude`)

Gira un perfil 2D en torno al eje $Z$ creando sólidos de revolución (anillos, toros, poleas, jarrones, copas).

```openscad
// Anillo toroidal completo (360 grados)
rotate_extrude($fn = 60) {
    translate([30, 0]) circle(r = 8, $fn = 40);
}

// Codo o sector circular de 90 grados
rotate_extrude(angle = 90, $fn = 60) {
    translate([25, 0]) circle(d = 10, $fn = 40);
}
```

> [!danger] La regla de oro de `rotate_extrude`: Prohibido cruzar el eje $Z$
> La figura 2D debe encontrarse completamente en el semiplano positivo de $X$ ($X \ge 0$). Si algún vértice del perfil 2D cruza hacia coordenadas negativas de $X$ ($X < 0$), la revolución interseca consigo misma y OpenSCAD producirá un error crítico impidiendo el renderizado.

---

## Importación de vectores externos: `.dxf` y `.svg`

OpenSCAD permite importar dibujos vectoriales procedentes de programas como Inkscape o Illustrator:

```openscad
// Importar un logotipo en SVG y extruirlo a 3 mm de grosor
linear_extrude(height = 3) {
    import("logo.svg", center = true);
}
```

- **Requisitos del archivo vectorial:** Los trazados deben ser polígonos **completamente cerrados**, sin curvas abiertas ni líneas sueltas.

---

## Estrategia para impresión 3D: Despiece de modelos grandes

Cuando una pieza diseñada por extrusión excede el volumen útil de impresión de la máquina (*build volume*):

```openscad
module trofeo_completo() {
    rotate_extrude($fn = 80) {
        // Perfil 2D del trofeo
        polygon(points = [[0,0], [40,0], [10,60], [35,120], [0,120]]);
    }
}

// Exportación de la parte inferior (Base)
difference() {
    trofeo_completo();
    translate([-100, -100, 60]) cube([200, 200, 100]); // Corta la mitad superior
}
```

1. Se diseña el modelo completo unificado.
2. Mediante operaciones `difference()` con cubos de corte, se divide el modelo en secciones encajables.
3. Se exporta cada pieza en un archivo `.stl` independiente, permitiendo imprimir piezas de gran tamaño por partes y ensamblarlas con uniones mecánicas o adhesivo cianoacrilato.

---

## Próximos pasos

Aprende a automatizar matrices de componentes y patrones geométricos mediante variables y bucles:

- [[05-variables-bucles-y-patrones-matematicos|05: Variables, bucles y patrones matemáticos]]
