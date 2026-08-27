---
title: "Referencia rápida, modificadores y buenas prácticas"
description: "Cheatsheet de sintaxis de OpenSCAD, modificadores de depuración, variables especiales de cálculo y catálogo de buenas prácticas para modelado 3D paramétrico"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, reference, cheat-sheet, modifiers, special-variables, math-functions]
---

# Referencia rápida, modificadores y buenas prácticas

> [!abstract] Resumen
> Esta nota actúa como manual de consulta rápida y compendio de referencia del lenguaje OpenSCAD. Reúne los modificadores de depuración de árbol geométrico (`*`, `!`, `#`, `%`), las variables especiales del sistema (`$fn`, `$fa`, `$fs`, `$t`, `$preview`), las funciones matemáticas y vectoriales más frecuentes, las comprensiones de listas (*list comprehensions*), y un catálogo de recomendaciones prácticas para modelar piezas técnicas fiables.

---

## Modificadores de depuración de árbol CSG

OpenSCAD permite anteponer cuatro caracteres especiales a cualquier módulo o sentencia para controlar su visualización en el visor 3D sin tener que comentar o reestructurar el código:

| Modificador | Nombre | Función | Comportamiento |
|---|---|---|---|
| `*` | **Disable (Desactivar)** | Ignora completamente el subárbol. | El objeto no se evalúa ni se renderiza (equivale a comentarlo). |
| `!` | **Root / Show Only (Aislar)** | Ignora el resto del diseño y muestra **únicamente** este elemento. | Muy útil para depurar un módulo dentro de un ensamblaje masivo. |
| `#` | **Highlight / Ghost (Resaltar)** | Renderiza el objeto como un sólido transparente de color rojo. | Permite ver la forma y posición exacta de los cortes en operaciones `difference()`. |
| `%` | **Background / Transparent (Fondo)** | Muestra el objeto como una sombra gris semitransparente. | No participa en el renderizado final ni en las operaciones booleanas; sirve como referencia de contorno. |

```openscad
difference() {
    cube([40, 40, 20], center = true);
    
    // El cilindro se resalta en rojo transparente mientras se resta del cubo
    #translate([10, 0, 0])
        cylinder(h = 30, d = 8, center = true);
}

// Este soporte solo sirve como referencia visual en el visor, no se exportará
%translate([0, 0, -15]) cube([60, 60, 2], center = true);
```

---

## Variables especiales del sistema

OpenSCAD reserva variables prefijadas con el símbolo `$` para configurar la teselación de curvas, el motor de animación y el estado de compilación:

### 1. Control de resolución de arcos y cilindros
- `$fn`: Número fijo de fragmentos (subdivisiones) por revolución completa de 360°.
- `$fa`: Ángulo mínimo permitido por fragmento en grados (por defecto `12`).
- `$fs`: Longitud mínima permitida para cada segmento en unidades de diseño (por defecto `2.0 mm`).

```openscad
// Regla recomendada para resolución adaptativa global:
$fa = 1;   // Ángulo suave de 1 grado
$fs = 0.5; // Aristas de máximo 0.5 mm en círculos grandes
```

### 2. Animación y estado de ejecución
- `$t`: Paso de tiempo de animación (valor decimal continuo normalizado entre `0.0` y `1.0`). Permite crear animaciones mecánicas desde el menú `View > Animate`.
- `$preview`: Variable booleana de solo lectura; vale `true` durante la previsualización (`F5`) y `false` durante el renderizado CGAL (`F6`). Permite bajar el detalle durante el modelado interactivo y aumentarlo automáticamente al renderizar.

```openscad
// Ajuste automático de calidad según modo de compilación
$fn = $preview ? 24 : 96;
```

---

## Funciones matemáticas y vectoriales clave

### Trigonometría y aritmética
- **Trigonométricas (en grados):** `sin(a)`, `cos(a)`, `tan(a)`, `asin(v)`, `acos(v)`, `atan(v)`, `atan2(y, x)`.
- **Aritmética y potencias:** `sqrt(x)`, `pow(base, exp)`, `abs(x)`, `sign(x)`, `ln(x)`, `log(x)`, `exp(x)`.
- **Redondeo:** `floor(x)` (redondeo hacia abajo), `ceil(x)` (redondeo hacia arriba), `round(x)` (redondeo al entero más cercano).

### Álgebra vectorial y utilidades de cadenas
- `norm(v)`: Norma euclídea (longitud o distancia de un vector 2D o 3D).
- `cross(v1, v2)`: Producto vectorial en el espacio 3D.
- `concat(v1, v2, ...)`: Concatena vectores en uno solo.
- `len(v)`: Devuelve la longitud de una lista o cadena de texto.
- `str(...)`: Convierte cualquier tipo de dato a texto plano y concatena.
- `let(var = val) ...`: Permite asignar variables locales intermedias dentro de expresiones funcionales.

---

## Comprensión de listas (*List Comprehensions*)

Permite generar vectores calculados y matrices geométricas en una sola línea compacta:

```openscad
// Genera las coordenadas de una parábola: [ [0, 0], [1, 1], [2, 4], [3, 9], [4, 16] ]
puntos_curva = [ for (x = [0 : 4]) [x, x*x] ];

// Genera un polígono a partir de la lista calculada
polygon(concat([ [0, 0] ], puntos_curva, [ [4, 0] ]));
```

---

## Catálogo de proyectos recomendados para práctica continua

Para consolidar las habilidades adquiridas en OpenSCAD, se recomienda desarrollar los siguientes proyectos prácticos progresivos:

1. **Juego de cucharas dosificadoras paramétricas:** Variar la capacidad de volumen en mililitros calculando el radio de la semiesfera mediante la fórmula del volumen esférico ($V = \frac{2}{3} \pi r^3$).
2. **Adaptador para boquillas de aspiradora:** Conexión cónica entre diámetros dispares utilizando cilindros con `r1` y `r2` para garantizar un acople hermético por fricción (*friction-fit*).
3. **Caja con bisagra integrada *Print-in-Place*:** Ensamblaje con pasador móvil horizontal modelado con holguras radiales mínimas de `0.4 mm` para imprimir ensamblado en una sola sesión.
4. **Panel organizador tipo Pegboard:** Matriz bidimensional de ganchos y soportes modulares con directivas `use <...>` y lógica condicional.

---

## Próximos pasos

Vuelve al índice general de la wiki para repasar cualquier tema o consultar otros capítulos:

- [[00-programming-with-openscad|00: Índice general - Programming with OpenSCAD]]
