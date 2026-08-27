---
title: "Metodología de diseño y proyectos complejos"
description: "Ingeniería de proyectos CAD en OpenSCAD: el ciclo de diseño en cuatro fases, pensamiento computacional aplicado, arquitectura Walking Skeleton y caso práctico iterativo de la Torre de Pisa"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, design-cycle, computational-thinking, walking-skeleton, architecture, best-practices]
---

# Metodología de diseño y proyectos complejos

> [!abstract] Resumen
> Afrontar modelos tridimensionales a gran escala (edificios históricos, robots articulados, mecanismos complejos) requiere una metodología estructurada de ingeniería de software y pensamiento computacional. En lugar de intentar programar todos los detalles desde la primera línea, se aplica el **Ciclo de Diseño en cuatro fases** (*Investigate, Plan, Create, Evaluate*) junto con el enfoque de desarrollo **Walking Skeleton** (esqueleto funcional andante). En esta nota se desglosan los pilares del diseño modular multifichero y se analiza el caso de estudio completo de la Torre inclinada de Pisa a través de cinco iteraciones de refinamiento progresivo.

---

## El Ciclo de Diseño en cuatro fases

El diseño de piezas técnicas en OpenSCAD sigue un bucle iterativo de ingeniería:

```text
       ┌───────────────┐          ┌───────────────┐
       │ 1. INVESTIGAR │ ───────► │ 2. PLANIFICAR │
       │ (Fotos, cotas)│          │ (Pensamiento) │
       └───────────────┘          └───────┬───────┘
               ▲                          │
               │                          ▼
       ┌───────┴───────┐          ┌───────────────┐
       │  4. EVALUAR   │ ◄─────── │   3. CREAR    │
       │  (F5/F6 vs R) │          │ (Skeleton)    │
       └───────────────┘          └───────────────┘
```

1. **Investigar (*Investigate*):** Recopilar vistas ortogonales (alzado, planta, perfil), fotografías de referencia y cotas fundamentales. Dibujar bocetos manuales antes de programar.
2. **Planificar (*Plan*):** Aplicar los cuatro pilares del pensamiento computacional para decidir qué módulos, archivos y variables gobernarán el modelo.
3. **Crear (*Create*):** Construir la estructura general de bajo nivel de detalle (*Walking Skeleton*) antes de abordar molduras, chaflanes o microgeometrías.
4. **Evaluar (*Evaluate*):** Comparar la previsualización (`F5`) con las especificaciones. Identificar desviaciones o puntos críticos de impresión y disparar una nueva iteración de refinamiento.

---

## Los 4 pilares del pensamiento computacional en CAD

```text
┌───────────────────────────┬───────────────────────────┐
│     DESCOMPOSICIÓN        │         PATRONES          │
│ Dividir el modelo global  │ Identificar elementos     │
│ en subconjuntos aislados  │ repetitivos (matrices,    │
│ (archivos y módulos).     │ giros, simetrías).        │
├───────────────────────────┼───────────────────────────┤
│       ABSTRACCIÓN         │        ALGORITMOS         │
│ Modelar primero bloques   │ Automatizar la colocación │
│ simples (cilindros/cubos) │ y parametrización con     │
│ sin perderse en detalles. │ bucles y trigonometría.   │
└───────────────────────────┴───────────────────────────┘
```

---

## La estrategia del *Walking Skeleton*

El enfoque **Walking Skeleton** consiste en conectar la arquitectura completa del proyecto desde la primera iteración mediante formas geométricas ultrabásicas (volúmenes envolventes o cajas delimitadoras). Una vez que la estructura global, proporciones relativas y ensamblajes encajan, se reemplaza progresivamente cada bloque por su implementación detallada.

### Ventajas:
- **Validación temprana:** Se detectan errores de escala, colisiones o ángulos erróneos antes de invertir horas modelando detalles finos.
- **Desarrollo en paralelo:** Permite que varios colaboradores trabajen simultáneamente en diferentes archivos (`top.scad`, `bottom.scad`, `column.scad`) mientras el archivo raíz (`main.scad`) los ensambla continuamente.

---

## Caso de estudio: Torre de Pisa en 5 iteraciones

El libro desarrolla la emblemática Torre inclinada de Pisa organizando el proyecto en cuatro archivos conectados mediante directivas `use <...>`:

```text
                     ┌──────────────────┐
                     │    tower.scad    │ (Archivo raíz ensamblador)
                     └───┬───┬───┬──────┘
                         │   │   │
        ┌────────────────┘   │   └────────────────┐
        ▼                    ▼                    ▼
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │ bottom.scad  │     │ middle.scad  │     │   top.scad   │
 └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
        │                    │                    │
        └───────────────┐    │    ┌───────────────┘
                        ▼    ▼    ▼
                     ┌──────────────────┐
                     │   column.scad    │ (Librería compartida)
                     └──────────────────┘
```

---

### Iteración 1: Esqueleto arquitectónico global (`tower.scad`)

Se definen tres secciones como cilindros primitivos abstractos y se aplica la inclinación global de 4 grados y la base.

```openscad
// tower.scad (Iteración 1)
use <bottom.scad>
use <middle.scad>
use <top.scad>

tower_height = 100;
tower_width = 0.3 * tower_height;
bottom_height = 0.2 * tower_height;
middle_height = 0.65 * tower_height;
top_height = 0.15 * tower_height;
lean_angle = 4;

$fn = 20; // Resolución baja para prototipado rápido

rotate([lean_angle, 0, 0]) {
    bottom_section(tower_width, bottom_height);
    translate([0, 0, bottom_height])
        middle_section(tower_width, middle_height);
    translate([0, 0, bottom_height + middle_height])
        top_section(tower_width, top_height);
}

// Base de apoyo estable
translate([0, 0, -2]) cube([tower_width * 2, tower_width * 2, 4], center = true);
```

---

### Iteración 2: Bucle de pisos en el cuerpo central (`middle.scad`)

Se descompone la sección media en 6 niveles idénticos apilados verticalmente mediante un bucle `for`.

```openscad
// middle.scad (Iteración 2)
module middle_section(width, height) {
    num_pisos = 6;
    altura_piso = height / num_pisos;
    radio_piso = width / 2;
    
    for (h = [0 : num_pisos - 1]) {
        translate([0, 0, h * altura_piso])
            nivel(radio_piso, altura_piso);
    }
}

module nivel(radio, alto) {
    // Estructura interior + cornisa superior
    cylinder(h = alto, r = radio * 0.7);
    translate([0, 0, alto * 0.9])
        cylinder(h = alto * 0.1, r = radio);
}
```

---

### Iteración 3: Columnata y arquería radial (`column.scad` + `middle.scad`)

Se independiza el módulo `column` en su propio archivo y se distribuyen 24 columnas por piso en anillo circular mediante giros polares y cortes de arcos con `difference()`.

```openscad
// column.scad (Iteración 3)
module column(ancho, alto) {
    r = ancho / 2;
    orn = alto * 0.05;
    
    // Capitel superior
    translate([-r, -r, alto - orn]) cube([ancho, ancho, orn]);
    // Fuste cilíndrico
    cylinder(h = alto, r = r);
    // Basa inferior
    translate([-r, -r, 0]) cube([ancho, ancho, orn]);
}
```

---

### Iteración 4: Detalle de campanario y balaustradas (`top.scad`)

Se introducen arcos alternados de puertas y ventanas mediante un módulo `archway()`, junto con un módulo `fence()` que genera los balaustres de la terraza del campanario.

```openscad
// Módulo de arco genérico (combinación de prisma y semicilindro horizontal)
module archway(alto, ancho, profundidad) {
    r = ancho / 2;
    rotate([90, 0, -90]) {
        translate([0, (alto - r) / 2, -profundidad / 2])
            cylinder(h = profundidad, r = r, $fn = 20);
        cube([ancho, alto - r, profundidad], center = true);
    }
}
```

---

### Iteración 5: Refuerzo de planta baja y acabado final

Se modelan las 14 columnas de mayor porte de la planta baja en `bottom.scad` y se sube la variable global a `$fn = 100` en `tower.scad` para suavizar todas las arquerías antes de renderizar (`F6`) y exportar a STL.

---

## Próximos pasos

Consulta la guía de referencia rápida, modificadores de inspección y catálogo de ejercicios prácticos:

- [[09-referencia-rapida-y-buenas-practicas-openscad|09: Referencia rápida, modificadores y buenas prácticas]]
