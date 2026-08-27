---
title: "Programming with OpenSCAD"
description: "Índice de la wiki de Programming with OpenSCAD: guía completa de modelado 3D paramétrico mediante código, basada en el libro de Justin Gohde y Marius Kintel (No Starch Press, 2021)"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, cad, 3d-printing, modeling, constructive-solid-geometry]
---

# Programming with OpenSCAD

> [!abstract] Resumen
> Esta wiki estructura y sintetiza los conceptos fundamentales y avanzados del libro *Programming with OpenSCAD: A Beginner's Guide to Coding 3D-Printable Objects* (Justin Gohde y Marius Kintel, No Starch Press, 2021). A diferencia de los programas de diseño asistido tradicionales basados en interacción visual (como Blender, Tinkercad o Fusion 360), OpenSCAD trata el modelado 3D como un ejercicio de programación declarativa mediante **Geometría Sólida Constructiva** (CSG). Esta wiki cubre desde las primitivas tridimensionales y transformaciones espaciales hasta el diseño paramétrico avanzado, modularización, lógica condicional, extrusiones 2D complejas y metodologías de diseño de proyectos de ingeniería listos para impresión 3D.

---

## Acerca del libro y sus autores

OpenSCAD es el estándar de código abierto por excelencia para el modelado 3D mediante código. El libro fue escrito por **Justin Gohde** (educador en ciencias de la computación y entusiasta de la fabricación digital) en colaboración con **Marius Kintel** (el creador y mantenedor principal de OpenSCAD).

La obra se distingue por enseñar simultáneamente dos disciplinas:
1. **Modelado y geometría 3D para fabricación aditiva:** precisión milimétrica, tolerancias, geometría manifold y optimización para impresión 3D.
2. **Fundamentos de programación y pensamiento computacional:** descomposición de problemas, bucles, modularización, parametrización, control de flujo y reutilización de código.

> [!note] El paradigma declarativo de OpenSCAD
> En OpenSCAD no se "dibuja" arrastrando el ratón; se escribe una descripción formal de cómo se combinan, transforman y restan sólidos geométricos. El código fuente es texto plano (`.scad`), lo que permite versionarlo con Git, compartirlo limpiamente y parametrizar cualquier dimensión mediante variables.

---

## Cómo leer esta wiki

Las notas están ordenadas de forma progresiva, cubriendo la totalidad del temario técnico del libro:

1. **Fundamentos y entorno:**
   - [[01-fundamentos-e-interfaz-de-openscad|Fundamentos e interfaz de OpenSCAD]]: Introducción al paradigma, coordenadas 3D, visor, atajos y pipeline hacia STL.
2. **Modelado 3D y Transformaciones:**
   - [[02-primitivas-3d-y-operaciones-booleanas|Primitivas 3D y operaciones booleanas (CSG)]]: Sólidos básicos (`cube`, `sphere`, `cylinder`), resolución con `$fn`, traslación y operaciones booleanas (`union`, `difference`, `intersection`).
   - [[03-transformaciones-avanzadas-hull-y-minkowski|Transformaciones avanzadas, hull y minkowski]]: Rotación, espejo, escalado, cálculo de envolventes (`hull`), redondeos y compensaciones morfológicas (`minkowski`).
3. **Modelado 2D y Extrusión:**
   - [[04-geometria-2d-y-extrusion|Geometría 2D y técnicas de extrusión]]: Formas planas (`circle`, `square`, `polygon`, `text`), extrusión lineal con torsión y escala (`linear_extrude`), extrusión rotacional (`rotate_extrude`) y dilataciones con `offset`.
4. **Pensamiento Computacional y Parametrización:**
   - [[05-variables-bucles-y-patrones-matematicos|Variables, bucles y patrones matemáticos]]: Manejo de variables, bucles `for`, rangos, salida por consola `echo()`, matemáticas aplicadas a patrones radiales y matrices tridimensionales.
   - [[06-modularizacion-y-reutilizacion-de-codigo|Modularización y reutilización de código]]: Creación de módulos (`module`), parámetros con valores por defecto, inclusión de librerías (`use` vs `include`) y caso de estudio: bloque LEGO paramétrico.
   - [[07-logica-condicional-y-diseno-parametrico-dinamico|Lógica condicional y diseño paramétrico dinámico]]: Estructuras `if` e `if-else`, operadores lógicos, alternancia entre modo diseño y modo impresión, y generación pseudoaleatoria con `rands()`.
5. **Ingeniería de Proyectos y Referencia:**
   - [[08-metodologia-de-diseno-y-proyectos-complejos|Metodología de diseño y proyectos complejos]]: Ciclo de diseño en cuatro fases, técnica del *Walking Skeleton*, caso práctico de la Torre de Pisa por iteraciones y arquitectura de proyectos.
   - [[09-referencia-rapida-y-buenas-practicas-openscad|Referencia rápida, modificadores y buenas prácticas]]: Cheatsheet de sintaxis, modificadores de depuración (`*`, `!`, `#`, `%`), variables especiales (`$fa`, `$fs`, `$fn`, `$t`) y catálogo de proyectos de práctica.

---

## Mapa de relaciones temáticas

```text
[01 Fundamentos e Interfaz]
         │
         ▼
[02 Primitivas 3D & CSG] ───────────► [04 Geometría 2D & Extrusión]
         │                                      │
         ▼                                      ▼
[03 Transformaciones (Hull/Minkowski)] ◄────────┘
         │
         ▼
[05 Variables, Bucles & Patrones]
         │
         ▼
[06 Modularización & Librerías]
         │
         ▼
[07 Lógica Condicional & Variabilidad]
         │
         ▼
[08 Metodología: Walking Skeleton & Proyectos]
         │
         ▼
[09 Referencia Rápida & Depuración]
```

---

## Próximos pasos

Comienza la lectura por el primer capítulo:

- [[01-fundamentos-e-interfaz-de-openscad|01: Fundamentos e interfaz de OpenSCAD]]
