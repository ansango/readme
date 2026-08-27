---
title: "Lógica condicional y diseño paramétrico dinámico"
description: "Control de flujo y variabilidad en OpenSCAD: sentencias if/else, operadores booleanos y lógicos, alternancia de modos de visualización e impresión, y generación estocástica con rands"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, conditionals, if-else, boolean-logic, rands, procedural-generation]
---

# Lógica condicional y diseño paramétrico dinámico

> [!abstract] Resumen
> El diseño paramétrico adquiere su máxima potencia cuando los modelos pueden tomar decisiones autónomas sobre qué geometrías instanciar en función de condiciones lógicas o valores de entrada. OpenSCAD implementa estructuras condicionales (`if`, `if...else`, `else if`), una gama completa de operadores relacionales y booleanos, y un generador pseudoaleatorio mediante la función `rands()`. Esta nota cubre la construcción de expresiones condicionales complejas, el patrón de alternancia entre **Modo Ensamblaje / Diseño** y **Modo Impresión 3D**, y técnicas de generación procedural orgánica.

---

## Estructuras condicionales: `if`, `else if` y `else`

Las sentencias `if` evalúan una condición booleana y solo ejecutan las transformaciones y geometrías hijas si el resultado es `true`.

```openscad
// 1. Condicional simple
if (incluir_taladro == true) {
    cylinder(h = 30, d = 5, center = true);
}

// 2. Rama mutuamente excluyente (if...else)
if (tipo_union == "tornillo") {
    alojamiento_m3();
} else {
    clip_presion();
}

// 3. Selección múltiple escalonada (else if)
if (nivel_detalle == "bajo") {
    cube([10, 10, 10], center = true);
} else if (nivel_detalle == "medio") {
    sphere(r = 6, $fn = 20);
} else {
    sphere(r = 6, $fn = 80);
}
```

```text
                  ┌──────────────────────┐
                  │ condición booleana ? │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
             true                         false
              ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │ Código Rama  │              │ Rama else /  │
       │    if { }    │              │ siguiente if │
       └──────────────┘              └──────────────┘
```

---

## Operadores relacionales y lógicos

OpenSCAD proporciona operadores estándar con estricta precedencia de evaluación:

| Operador | Tipo | Significado | Ejemplo |
|---|---|---|---|
| `==`, `!=` | Relacional | Igualdad estricta / Desigualdad | `tipo == "hex"`, `filas != 0` |
| `<`, `>`, `<=`, `>=` | Relacional | Comparación de magnitud | `radio < 15`, `altura >= 100` |
| `&&` | Lógico | Conjunción (*AND*: ambas verdaderas) | `(x > 0) && (y > 0)` |
| `\|\|` | Lógico | Disyunción (*OR*: al menos una verdadera) | `(ancho > 50) \|\| (reforzado == true)` |
| `!` | Lógico | Negación (*NOT*: invierte valor) | `!ocultar_tapa` |

### Jerarquía de precedencia (de mayor a menor prioridad)
1. Paréntesis `( )`
2. Multiplicación `*`, División `/`, Módulo `%`
3. Suma `+`, Resta `-`
4. Comparaciones relacionales `<`, `>`, `<=`, `>=`
5. Igualdades `==`, `!=`
6. Operador lógico `&&`
7. Operador lógico `||`

---

## Patrón de arquitectura: Modo Diseño vs Modo Impresión

Al modelar ensamblajes complejos (cajas con bisagras, engranajes, juegos de mesa), es fundamental alternar rápidamente entre la visualización del producto montado y la disposición de las piezas en el plano de la cama de impresión.

```openscad
// CONFIGURACIÓN GLOBAL
modo = "impresion"; // Opciones: "diseno" | "impresion"
holgura = 0.3;

module base() {
    cube([50, 40, 15], center = true);
}

module tapa() {
    cube([50, 40, 4], center = true);
}

// LÓGICA DE VISUALIZACIÓN DINÁMICA
if (modo == "diseno") {
    // Modo ensamblado: la tapa descansa sobre la base
    base();
    translate([0, 0, 7.5 + 2])
        color("lightblue", 0.8) tapa();
} else if (modo == "impresion") {
    // Modo fabricación: ambas piezas apoyadas planas sobre Z=0 con separación
    translate([-30, 0, 7.5]) base();
    translate([30, 0, 2]) tapa();
}
```

> [!tip] Ahorro de tiempo con conmutadores de modo
> Definir la variable `modo = "diseno"` al inicio del archivo permite validar tolerancias visuales con el modificador `#` o transparencias de `color()`, y cambiarla a `modo = "impresion"` justo antes de enviar el render a CGAL (`F6`).

---

## Generación estocástica y variabilidad con `rands()`

OpenSCAD incluye la función matemática `rands(min, max, cantidad, [semilla])`, que devuelve un vector con números decimales pseudoaleatorios distribuidos uniformemente.

```openscad
// Generar un número aleatorio entre 5.0 y 25.0
azar = rands(5, 25, 1)[0];
cylinder(h = azar, d = 8);
```

### Conversión a enteros discretos mediante `round()`

Dado que `rands()` produce valores en coma flotante continuos, para obtener enteros (por ejemplo, número de ventanas o selector de variante) se amplían los límites medio paso y se redondea:

```openscad
// Generar enteros uniformes entre 1 y 6 (dado de 6 caras)
tirada = round(rands(0.5, 6.49, 1)[0]);
```

### Ejemplo: Bosque procedural con variabilidad orgánica

```openscad
use <arbol_base.scad> // Asumiendo un modulo arbol(alto, radio)

num_arboles = 15;

// Generar vectores de parametros aleatorios
alturas = rands(20, 50, num_arboles, 1234); // Semilla fija para reproducibilidad
radios  = rands(6, 14, num_arboles, 5678);
pos_x   = rands(-80, 80, num_arboles, 9999);
pos_y   = rands(-80, 80, num_arboles, 1111);

for (i = [0 : num_arboles - 1]) {
    translate([pos_x[i], pos_y[i], 0]) {
        // Tronco
        cylinder(h = alturas[i] * 0.4, d = radios[i] * 0.3, $fn = 15);
        // Copa de follaje con variabilidad
        translate([0, 0, alturas[i] * 0.3])
            cylinder(h = alturas[i] * 0.7, r1 = radios[i], r2 = 0, $fn = 20);
    }
}
```

> [!note] Semillas de reproducibilidad (*Seeds*)
> El cuarto parámetro opcional de `rands(min, max, count, seed)` permite fijar una semilla entera. Esto garantiza que la distribución pseudoaleatoria sea exactamente idéntica en cada compilación, evitando que el modelo cambie arbitrariamente al presionar `F5`.

---

## Próximos pasos

Aprende la metodología de diseño integral en cuatro fases y el enfoque *Walking Skeleton* para proyectos complejos:

- [[08-metodologia-de-diseno-y-proyectos-complejos|08: Metodología de diseño y proyectos complejos]]
