---
title: "Fundamentos e interfaz de OpenSCAD"
description: "Introducción a OpenSCAD: filosofía declarativa, sistema de coordenadas 3D, navegación en la interfaz, vista previa vs renderizado y flujo de trabajo hacia la impresión 3D"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, cad, gui, coordinates, workflow, 3d-printing]
---

# Fundamentos e interfaz de OpenSCAD

> [!abstract] Resumen
> OpenSCAD es un software libre de CAD 3D basado en texto que permite modelar piezas sólidas mediante código de programación declarativa. A diferencia de las herramientas escultóricas o de modelado interactivo con ratón (como Blender o Tinkercad), OpenSCAD se enfoca en el diseño mecánico y paramétrico de precisión. Esta nota cubre los principios del lenguaje, la navegación por la interfaz, el sistema de coordenadas cartesiano tridimensional, la diferencia crítica entre vista previa (`F5`) y renderizado geométrico completo (`F6`), y el flujo de exportación hacia formatos listos para fabricación aditiva.

---

## ¿Qué es OpenSCAD y en qué se diferencia?

OpenSCAD aborda el diseño asistido por ordenador desde la perspectiva del código fuente. Los modelos no se construyen arrastrando mallas poligonales en pantalla, sino escribiendo sentencias que describen con exactitud matemática la forma, tamaño, posición y combinaciones de cada elemento geométrico.

```text
┌─────────────────────────────────────────────────────────────┐
│                       OpenSCAD                              │
├──────────────────────────────┬──────────────────────────────┤
│  Modelado mediante código    │  Precisión paramétrica       │
│  Texto plano (.scad)         │  Control de versiones (Git)  │
│  Geometría sólida (CSG)      │  Orientado a fabricación 3D  │
└──────────────────────────────┴──────────────────────────────┘
```

### Ventajas del modelado mediante código

1. **Parametrización total:** Cualquier cota (ancho, grosor de pared, número de taladros) puede definirse mediante variables. Modificar un único valor recalcula instantáneamente todo el modelo sin romper la geometría.
2. **Historial de diseño transparente y versionable:** Al ser archivos de texto plano (`.scad`), los proyectos pueden versionarse con Git, comparar diferencias entre revisiones (*diffs*) y compartirse ocupando unos pocos kilobytes.
3. **No destructivo:** A diferencia del botón "Deshacer" (*Undo*) de los programas visuales, en OpenSCAD modificar un paso inicial no destruye ni reinicia las operaciones intermedias posteriores.
4. **Pensamiento computacional aplicado al mundo físico:** Permite aplicar abstracción, bucles, funciones, modularización y lógica condicional a objetos reales tangibles.

> [!note] Enfoque mecánico vs artístico
> OpenSCAD está optimizado para ingeniería mecánica, cajas para electrónica, mecanismos, adaptadores y piezas funcionales para impresión 3D. No está concebido para animación cinematográfica, modelado orgánico de personajes ni escultura digital de alta densidad poligonal.

---

## La interfaz de usuario de OpenSCAD

La ventana principal de OpenSCAD se organiza en cuatro áreas de trabajo fundamentales:

```text
┌───────────────────────────┬───────────────────────────┐
│                           │                           │
│     EDITOR DE CÓDIGO      │      VISOR 3D             │
│   (Escribe tus scripts    │   (Visualización de       │
│         .scad)            │    geometría)             │
│                           │                           │
├───────────────────────────┼───────────────────────────┤
│        CONSOLA            │  BARRA DE VISTA 3D        │
│ (Mensajes, errores, echo) │  (Vistas ortogonales)     │
└───────────────────────────┴───────────────────────────┘
```

1. **Editor de código (panel izquierdo):** Donde se escribe el código de OpenSCAD. Incluye resaltado de sintaxis y numeración de líneas. También es posible utilizar un editor externo (como VS Code o Neovim) habilitando la opción de recarga automática al guardar.
2. **Visor 3D (panel derecho superior):** Ventana de previsualización gráfica que muestra el resultado tridimensional en tiempo real.
3. **Barra de herramientas de visualización 3D:** Botones de acceso rápido para alternar entre proyecciones en perspectiva y ortogonales (vistas frontal, lateral, superior, inferior y trasera).
4. **Consola de registro (panel inferior):** Muestra mensajes de advertencia, errores sintácticos o de compilación, y salidas de depuración generadas mediante la función `echo()`.

---

## El sistema de coordenadas tridimensional

OpenSCAD utiliza un sistema de coordenadas cartesiano tridimensional estándar ($X, Y, Z$):

- **Eje $X$ (Ancho / *Width*):** Movimiento izquierda $(-)$ y derecha $(+)$.
- **Eje $Y$ (Largo o Profundidad / *Length*):** Movimiento adelante $(+)$ y atrás $(-)$.
- **Eje $Z$ (Alto / *Height*):** Movimiento abajo $(-)$ y arriba $(+)$.
- **Origen $(0, 0, 0)$:** Punto de intersección central de los tres ejes.

```text
          +Z (Alto)
           │
           │
           │   +Y (Profundidad)
           │  /
           │ /
           │/
───────────┼─────────── +X (Ancho)
          /│
         / │
        /  │
```

> [!tip] La leyenda de ejes y vistas ortogonales
> En el visor 3D, la esquina inferior muestra un pequeño triedro de referencia que rota en sincronía con el modelo para evitar desorientarse. Utiliza los botones de la barra de herramientas para fijar vistas perpendiculares de 2D exactas (Frontal, Planta, Perfil) cuando necesites comprobar alineaciones precisas.

---

## Convención de unidades y dimensiones

OpenSCAD es técnicamente **adimensional** (*unitless*): una cifra como `10` representa 10 unidades de cálculo. Sin embargo, por estándar universal en el ecosistema de fabricación aditiva y software de laminado (*slicers* como PrusaSlicer, Cura o Bambu Studio), **1 unidad en OpenSCAD equivale a 1 milímetro (1 mm)**.

```openscad
// Ejemplo conceptual: dimensiones en milímetros
ancho = 25;   // 25 mm en el eje X
largo = 40;   // 40 mm en el eje Y
alto = 10;    // 10 mm en el eje Z
```

---

## Vista previa (*Preview*) vs Renderizado (*Render*)

Uno de los conceptos más importantes al trabajar con OpenSCAD es entender las dos etapas de compilación geométrica del programa:

| Característica | Vista previa (*Preview* - `F5`) | Renderizado (*Render* - `F6`) |
|---|---|---|
| **Motor utilizado** | OpenCSG (rasterización rápida basada en GPU) | CGAL (geometría constructiva sólida exacta en CPU) |
| **Velocidad** | Prácticamente instantánea | Puede tardar de segundos a minutos en geometrías complejas |
| **Finalidad** | Inspección interactiva durante la escritura del código | Generación matemática exacta de sólidos y mallas *manifold* |
| **Uso para exportar** | No permite exportar a STL/3MF/DXF | **Obligatorio** antes de exportar a STL u otros formatos |
| **Visualización** | Muestra aristas y cortes rápidos (puede mostrar artefactos visuales) | Resuelve todas las intersecciones y genera la malla definitiva limpia |

> [!warning] La trampa de la exportación sin renderizar
> Si intentas exportar directamente a formato STL pulsando el botón de exportación sin haber ejecutado previamente un Render (`F6`), OpenSCAD te obligará a compilarlo o exportará un archivo vacío. Acostúmbrate a usar `F5` mientras desarrollas y `F6` únicamente cuando vayas a validar la pieza o a generar el archivo final para fabricación.

---

## Flujo de trabajo: del código a la pieza física impresa

El ciclo típico de trabajo consta de cinco pasos:

```text
┌─────────────────┐     F5      ┌─────────────────┐     F6      ┌─────────────────┐
│ 1. Escribir     │ ──────────► │ 2. Previsualizar│ ──────────► │ 3. Renderizar   │
│    código .scad │             │    en visor 3D  │             │    con CGAL     │
└─────────────────┘             └─────────────────┘             └────────┬────────┘
                                                                         │
                                                                         ▼
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ 5. Imprimir en  │ ◄────────── │ 4. Laminar      │ ◄────────── │ Exportar archivo│
│    impresora 3D │   G-code    │    en Slicer    │   .stl/.3mf │ .stl / .3mf     │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

1. **Diseño paramétrico:** Se escribe el código en el editor estructurando piezas, tolerancias y variables de ajuste.
2. **Previsualización interactiva (`F5`):** Inspección visual inmediata para verificar proporciones y alineaciones.
3. **Renderizado de producción (`F6`):** CGAL calcula la geometría sólida y garantiza que la malla sea estanca (*manifold* / *watertight*), sin caras invertidas ni huecos.
4. **Exportación:** Desde el menú `File > Export` se genera el archivo `.stl` o `.3mf`.
5. **Laminado e impresión:** El laminador convierte la geometría en instrucciones de capas (*G-code*) para la impresora 3D (generalmente tecnología FFF/FDM de filamento fundido).

---

## Próximos pasos

Con el entorno y los conceptos básicos asimilados, el siguiente paso es aprender a declarar las primitivas 3D y combinarlas mediante operaciones booleanas:

- [[02-primitivas-3d-y-operaciones-booleanas|02: Primitivas 3D y operaciones booleanas (CSG)]]
