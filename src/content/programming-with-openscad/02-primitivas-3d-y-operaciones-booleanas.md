---
title: "Primitivas 3D y operaciones booleanas (CSG)"
description: "Modelado de sólidos constructivos en OpenSCAD: cubos, esferas, cilindros, conos, traslación, operaciones booleanas (union, difference, intersection) y prevención de caras coincidentes"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, csg, primitives, boolean-operations, translation, z-fighting]
---

# Primitivas 3D y operaciones booleanas (CSG)

> [!abstract] Resumen
> La base del modelado en OpenSCAD es la **Geometría Sólida Constructiva** (*Constructive Solid Geometry* o CSG). Este método permite generar piezas complejas a partir de primitivas tridimensionales elementales (`cube`, `sphere`, `cylinder`), posicionarlas en el espacio mediante transformaciones como `translate()` y combinarlas utilizando las tres operaciones booleanas fundamentales: `union()`, `difference()` e `intersection()`. En esta nota se analiza la sintaxis rigurosa de cada comando, el control de teselación curva con `$fn`, la depuración visual con el modificador `#` y la regla esencial para evitar paredes parpadeantes (*z-fighting* o caras coincidentes) al sustraer volúmenes.

---

## Primitivas 3D fundamentales

OpenSCAD dispone de comandos integrados para generar los tres bloques básicos de la geometría euclidiana: ortoedros, esferas y cilindros/conos.

```text
       ┌──────────┐               ▲              ┌───────┐
      /          /│             / | \           /         \
     ┌──────────┐ │           /   |   \        │           │
     │          │ │          │    •    │       │     •     │
     │          │ │           \   |   /        │           │
     │          │/             \ | /            \         /
     └──────────┘                 ▼              └───────┘
     cube([x,y,z])          sphere(r)          cylinder(h,r1,r2)
```

### 1. Cubos y ortoedros (`cube`)

El comando `cube()` genera prismas rectangulares u ortoedros definiendo un vector de tres dimensiones `[ancho_x, largo_y, alto_z]`.

```openscad
// Ortoedro de 10mm de ancho (X), 20mm de profundidad (Y) y 30mm de altura (Z)
cube([10, 20, 30]);

// Cubo perfecto centrado en el origen (0, 0, 0)
cube([15, 15, 15], center = true);

// Atajo para un cubo perfecto no centrado
cube(10); // Equivale a cube([10, 10, 10]);
```

- **Posicionamiento por defecto:** Una esquina del cubo se ancla en el origen `[0, 0, 0]`, extendiéndose hacia el octante positivo ($+X, +Y, +Z$).
- Con `center = true`, el centro geométrico del sólido se sitúa exactamente en `[0, 0, 0]`.

---

### 2. Esferas (`sphere`)

El comando `sphere()` crea una esfera tridimensional perfecta. A diferencia de `cube()`, **siempre nace centrada en el origen `[0, 0, 0]`**.

```openscad
// Esfera especificada por radio (r)
sphere(r = 10);

// Esfera especificada por diámetro (d)
sphere(d = 20);
```

> [!tip] Preferir diámetro `d` frente a radio `r` en diseño mecánico
> En piezas técnicas (alojamientos para rodamientos, tornillería, ejes), los componentes comerciales se miden habitualmente por su diámetro nominal. Usar el parámetro explícito `d = 20` evita cálculos mentales o divisiones innecesarias como `r = 20 / 2`.

---

### 3. Cilindros y conos (`cylinder`)

El comando `cylinder()` es versátil: permite crear cilindros rectos, conos truncados y conos en punta según los radios de la base inferior (`r1`) y superior (`r2`).

```openscad
// 1. Cilindro recto estándar (radio constante)
cylinder(h = 25, r = 5, center = true);

// 2. Cilindro usando diámetro uniforme
cylinder(h = 30, d = 12);

// 3. Cono truncado (r1 = base inferior, r2 = base superior)
cylinder(h = 20, r1 = 10, r2 = 4);

// 4. Cono en punta (radio superior = 0)
cylinder(h = 18, r1 = 8, r2 = 0);
```

- **Alineación por defecto:** El eje central del cilindro coincide con el eje $Z$, y su base inferior descansa sobre el plano $XY$ ($Z = 0$).

---

## Control de suavizado y resolución de curvas: `$fn`

OpenSCAD aproxima todas las superficies curvas (círculos, esferas, cilindros) mediante polígonos y facetas planas. La variable especial `$fn` (*fragment number*) define el número de segmentos lineales o subdivisiones que forman la circunferencia.

```openscad
// Prisma hexagonal (6 caras)
cylinder(h = 10, r = 8, $fn = 6);

// Cilindro estándar de previsualización (30 caras)
cylinder(h = 20, r = 8, $fn = 30);

// Cilindro de alta definición para renderizado final (60-100 caras)
cylinder(h = 20, r = 8, $fn = 80);
```

> [!warning] El coste computacional de `$fn`
> Asignar valores excesivos a `$fn` (por ejemplo `$fn = 360`) en múltiples sólidos o dentro de bucles incrementa exponencialmente el número de polígonos de la malla, ralentizando gravemente el renderizado CGAL (`F6`).
> - Durante el diseño interactivo: usar `$fn = 20` o `$fn = 30`.
> - Para exportación final a impresión 3D: `$fn = 60` a `$fn = 100` suele ser indistinguible al tacto y a la vista en impresoras FDM estándar.

---

## Traslación de sólidos en el espacio: `translate()`

Para posicionar sólidos se antepone el operador `translate([dx, dy, dz])` a la sentencia o bloque que se desea desplazar.

```openscad
// Desplaza un cubo 15 mm en X, -5 mm en Y y 10 mm en Z
translate([15, -5, 10]) {
    cube([10, 10, 10]);
}

// Aplicación encadenada a una sola línea
translate([0, 0, 20]) sphere(r = 5);
```

---

## Operaciones booleanas (CSG)

Las tres operaciones booleanas reciben un bloque entre llaves `{ ... }` con los sólidos sobre los que van a actuar.

```text
┌─────────────────┬─────────────────┬─────────────────┐
│     union()     │  difference()   │ intersection()  │
├─────────────────┼─────────────────┼─────────────────┤
│     A ∪ B       │      A ∖ B      │      A ∩ B      │
│  Fusiona todos  │  Resta del 1º   │ Conserva solo   │
│  los sólidos    │  los siguientes │ el solapamiento │
└─────────────────┴─────────────────┴─────────────────┘
```

### 1. Unión (`union`)

Fusiona todos los sólidos declarados en su interior en un único cuerpo geométrico continuo.

```openscad
union() {
    cube([20, 20, 10], center = true);
    cylinder(h = 25, r = 4, center = true);
}
```

> [!note] Unión implícita
> Si no se especifica ninguna operación booleana en el nivel raíz, OpenSCAD asume una unión de todas las formas declaradas. No obstante, usar `union()` de forma explícita es crucial cuando se anidan grupos de piezas dentro de un `difference()`.

---

### 2. Diferencia o sustracción (`difference`)

Conserva **únicamente el primer sólido** declarado dentro del bloque y le sustrae secuencialmente todos los sólidos subsiguientes.

```openscad
// Bloque con un taladro pasante central
difference() {
    cube([30, 30, 10], center = true);      // Sólido base (se conserva)
    cylinder(h = 12, d = 6, center = true); // Taladro (se sustrae)
}
```

---

### 3. Intersección (`intersection`)

Calcula el volumen común compartido por todos los sólidos del bloque, eliminando cualquier material que no pertenezca simultáneamente a todos ellos.

```openscad
// Lente / forma biconvexa resultante de intersecar dos esferas
intersection() {
    translate([-5, 0, 0]) sphere(r = 15);
    translate([5, 0, 0]) sphere(r = 15);
}
```

---

## La regla crítica de sustracción: evitar caras coincidentes (*Z-Fighting*)

Cuando el sólido que se va a sustraer comparte exactamente la misma cara o plano que el sólido base (por ejemplo, perforar una placa de 10 mm de espesor con un cilindro de altura exacta 10 mm), el motor de geometría no puede determinar si la cara exterior pertenece al sólido o al vacío. Esto produce **superficies parpadeantes (*shimmering walls*)** y errores de malla no estanca (*non-manifold*).

```text
  INCORRECTO (Caras coincidentes)         CORRECTO (Solapamiento intencionado)
  
       ┌──────────────┐                       ┌──────────────┐
       │ ░░░░░░░░░░░░ │                       │ ░░░░░░░░░░░░ │
  ═════╪══════════════╪═════  <-- z-fighting   ──┬──────────┬──
       │              │                          │          │
       │              │                          │          │
  ═════╪══════════════╪═════  <-- z-fighting   ──┴──────────┴──
       │ ░░░░░░░░░░░░ │                       │ ░░░░░░░░░░░░ │
       └──────────────┘                       └──────────────┘
```

### Solución: sobredimensionar y desplazar el sólido de corte

```openscad
// GROSOR DE PLACA
grosor = 10;
epsilon = 0.1; // Pequeño margen de seguridad

difference() {
    cube([40, 40, grosor], center = true);
    
    // El cilindro de corte mide (grosor + 2*epsilon) para sobresalir por ambas caras
    cylinder(h = grosor + epsilon * 2, d = 8, center = true, $fn = 40);
}
```

> [!danger] Nunca restar geometrías a ras de superficie
> Cualquier perforación pasante debe tener una longitud superior al grosor de la pieza y estar desplazada ligeramente para atravesar con total claridad las caras superior e inferior.

---

## Depuración con el modificador `#` (*Highlight/Ghost*)

Al trabajar con diferencias complejas, a menudo resulta difícil ubicar mentalmente dónde se sitúa el sólido que está cortando. Anteponer un caracter `#` a cualquier sentencia dibuja ese objeto como un sólido semitransparente de color rojo en la vista previa.

```openscad
difference() {
    cube([30, 30, 20], center = true);
    #translate([5, 5, 0]) cylinder(h = 25, d = 10, center = true);
}
```

---

## Tolerancias para impresión 3D (Ajustes mecánicos)

Al diseñar ensamblajes donde dos piezas deben encajar (por ejemplo, un pasador dentro de un orificio):

- **Encaje a presión / forzado (*press-fit*):** holgura de `0.1 mm` a `0.15 mm`.
- **Encaje deslizante estándar (*sliding fit*):** holgura radial de `0.2 mm` a `0.3 mm` por cada lado.
- **Encaje holgado / articulaciones móviles impresas *in-place*:** holgura mínima de `0.4 mm` a `0.5 mm`.

---

## Próximos pasos

Aprende a transformar geometrías con rotaciones espaciales, simetrías y operaciones avanzadas de envolvente:

- [[03-transformaciones-avanzadas-hull-y-minkowski|03: Transformaciones avanzadas, hull y minkowski]]
