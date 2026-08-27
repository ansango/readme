---
title: "Variables, bucles y patrones matemáticos"
description: "Estructuras de repetición en OpenSCAD: inmutabilidad de variables, bucles for, depuración con echo, generación de patrones lineales, radiales y rejillas 2D/3D"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, loops, variables, patterns, math, echo, debugging]
---

# Variables, bucles y patrones matemáticos

> [!abstract] Resumen
> Escribir código manual para duplicar elementos repetitivos (como hileras de taladros, aletas de disipación o ventanas de un edificio) es ineficiente y propenso a errores. OpenSCAD resuelve esto mediante el uso de **variables** y **bucles `for`**. En esta nota se explica el modelo de inmutabilidad funcional de variables en OpenSCAD, la sintaxis de rangos numéricos `[inicio:paso:fin]`, la depuración por consola con `echo()`, y cómo combinar funciones matemáticas con bucles anidados para generar matrices bidimensionales y entramados espaciales tridimensionales.

---

## Variables en OpenSCAD: Modelo funcional e inmutabilidad

A diferencia de los lenguajes imperativos convencionales (como C, Python o JavaScript), OpenSCAD es un lenguaje declarativo funcional.

```openscad
// Declaración de variables globales de configuración
grosor_pared = 2.4;
radio_eje = 5.0;
separacion = radio_eje * 2 + grosor_pared;
```

> [!warning] Inmutabilidad y tiempo de compilación
> En OpenSCAD, las variables **no cambian de valor en tiempo de ejecución secuencial**. El compilador procesa todo el script y asigna a cada variable el **último valor definido en su ámbito (*scope*)**:
> ```openscad
> a = 10;
> echo(a); // Imprimirá 20, ¡no 10!
> a = 20;
> ```
> Para variar valores de forma iterativa, se debe utilizar obligatoriamente el ámbito que genera un bucle `for` o los parámetros de un módulo.

---

## Comentarios en el código

OpenSCAD admite comentarios estándar estilo C/C++:

```openscad
// Comentario de una sola línea

/*
   Comentario de bloque multilínea:
   Ideal para documentar módulos o desactivar
   temporalmente secciones extensas de geometría.
*/
```

---

## El bucle `for` y la sintaxis de rangos

El bucle `for` itera sobre un vector o un rango numérico continuo. En cada iteración se instancia una copia del bloque con el nuevo valor de la variable.

```openscad
// Sintaxis general: for (variable = [inicio : incremento : fin])
for (x = [10 : 15 : 70]) {
    translate([x, 0, 0]) cylinder(h = 10, d = 8, center = true);
}
```

```text
  x=10          x=25          x=40          x=55          x=70
   ┌──┐          ┌──┐          ┌──┐          ┌──┐          ┌──┐
   │  │          │  │          │  │          │  │          │  │
   └──┘          └──┘          └──┘          └──┘          └──┘
    ◄────── 15 ───►
```

- Si se omite el incremento intermedio (`[inicio : fin]`), OpenSCAD asume un incremento de `1`.
- También es posible iterar sobre listas explícitas de valores arbitrarios: `for (d = [4, 6, 8, 12, 20]) { ... }`.

---

## Depuración en la consola con `echo()`

La función `echo()` imprime texto y valores de variables directamente en el panel de consola de OpenSCAD. Es la herramienta principal para inspeccionar cálculos matemáticos y pasos de iteración:

```openscad
for (i = [1 : 4]) {
    angulo = i * 90;
    pos_x = cos(angulo) * 20;
    pos_y = sin(angulo) * 20;
    
    echo("Iteración:", i, "Ángulo:", angulo, "Coordenadas:", [pos_x, pos_y]);
    translate([pos_x, pos_y, 0]) sphere(r = 3);
}
```

---

## Patrones geométricos mediante matemáticas

Combinando la variable del bucle con expresiones aritméticas se obtienen distribuciones espaciales complejas:

### 1. Patrón radial o polar (Rotación continua)

Distribución de elementos en círculo alrededor del eje $Z$:

```openscad
num_aspas = 8;
paso_angular = 360 / num_aspas;

for (a = [0 : paso_angular : 360 - paso_angular]) {
    rotate([0, 0, a])
        translate([25, 0, 0])
            cube([20, 4, 2], center = true);
}
```

---

### 2. Crecimiento cuadrático o no lineal

Modificando la altura o el tamaño en función del cuadrado del índice:

```openscad
for (n = [1 : 1 : 8]) {
    altura_escalon = n * n; // Crecimiento cuadrático: 1, 4, 9, 16, 25, 36, 49, 64
    translate([n * 10, 0, 0])
        cylinder(h = altura_escalon, d = 6);
}
```

---

## Bucles anidados: Matrices 2D y rejillas 3D

Al anidar bucles `for`, el bucle interno se ejecuta por completo para cada iteración del bucle externo.

```openscad
// Matriz de orificios / ventanas (10 filas x 6 columnas)
filas = 10;
columnas = 6;
paso_x = 12;
paso_z = 15;

difference() {
    // Fachada sólida
    cube([columnas * paso_x + 10, 8, filas * paso_z + 10]);
    
    // Rejilla de ventanas pasantes
    for (f = [1 : filas]) {
        for (c = [1 : columnas]) {
            x = c * paso_x - 5;
            z = f * paso_z - 5;
            translate([x, -1, z]) cube([6, 10, 8]);
        }
    }
}
```

```text
  Z ▲  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐
    │  │  │  │  │  │  │  │  │  │  │  │  │   (Fila 2)
    │  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘
    │  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐
    │  │  │  │  │  │  │  │  │  │  │  │  │   (Fila 1)
    │  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘
    └──────────────────────────────────────► X
```

---

## Colores en previsualización: `color()`

El operador `color([r, g, b, alfa])` permite teñir piezas en el visor de previsualización (`F5`) con valores RGB normalizados entre `0.0` y `1.0`:

```openscad
// Visualización de un espacio de color o componentes diferenciados
for (r = [0 : 0.5 : 1]) {
    for (g = [0 : 0.5 : 1]) {
        translate([r * 30, g * 30, 0])
            color([r, g, 0.2])
                cube([8, 8, 8], center = true);
    }
}
```

> [!note] Los colores solo existen en Preview (`F5`)
> La instrucción `color()` ayuda a diferenciar piezas durante el diseño, pero el motor CGAL (`F6`) y los archivos `.stl` generados carecen de información cromática: el color final vendrá determinado por la bobina de filamento montada en la impresora 3D.

---

## Claves de fabricación 3D para bucles y juegos de piezas

1. **Resolución mínima de detalle:** Aunque en OpenSCAD se pueden programar detalles de `0.05 mm`, las boquillas estándar FDM de `0.4 mm` no pueden extruir detalles más finos que el ancho de la boquilla o alturas de capa de menos de `0.1 mm`.
2. **Evitar la fusión de piezas (*Print-in-place* vs Despiece):** Si se diseña un juego (como discos de la Torre de Hanoi o fichas de tres en raya), no deben generarse apiladas en contacto en el código de impresión, ya que el calor fundirá las piezas entre sí. Deben posicionarse distribuidas en la base con al menos `3 a 5 mm` de separación.
3. **Exportación multicolor:** Para imprimir piezas en diferentes colores sin sistema multi-material, se deben comentar alternativamente bloques con `/* */`, renderizar (`F6`) y exportar un STL independiente por cada color.

---

## Próximos pasos

Aprende a encapsular lógica en bloques reutilizables y librerías externas mediante módulos:

- [[06-modularizacion-y-reutilizacion-de-codigo|06: Modularización y reutilización de código]]
