---
title: "Modularización y reutilización de código"
description: "Encapsulación y arquitectura en OpenSCAD: definición de módulos propios, argumentos nombrados y por defecto, inclusión de librerías con use vs include y diseño paramétrico avanzado"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, modules, functions, libraries, architecture, lego, code-reuse]
---

# Modularización y reutilización de código

> [!abstract] Resumen
> A medida que los proyectos de modelado 3D ganan complejidad, escribir scripts lineales conduce a código duplicado, difícil de mantener y propenso a inconsistencias. OpenSCAD proporciona **módulos** (`module`) para encapsular geometrías y comportamientos bajo nombres descriptivos. En esta nota se analiza cómo definir módulos con parámetros por defecto, cómo invocar argumentos posicionales o nombrados, la diferencia estructural crítica entre las directivas `use <...>` e `include <...>`, y cómo diseñar una librería modular tomando como caso práctico el diseño paramétrico de bloques compatibles con LEGO.

---

## Definición y anatomía de un módulo

Un módulo en OpenSCAD es una función que genera geometría sólida o transformaciones espaciales. La definición de un módulo actúa como una plantilla o receta que no añade material al visor hasta que se invoca explícitamente.

```text
┌─────────────────────────────────────────────────────────────┐
│  module nombre_modulo(param1 = valor1, param2 = valor2) {   │
│      // Sentencias geométricas y transformaciones           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

```openscad
// Declaración del módulo con valores por defecto
module columna_conica(altura = 40, radio_base = 10, radio_corte = 5) {
    difference() {
        cylinder(h = altura, r1 = radio_base, r2 = radio_corte, $fn = 40);
        // Alivio interior hueco
        translate([0, 0, -1])
            cylinder(h = altura + 2, r1 = radio_base - 2, r2 = radio_corte - 2, $fn = 40);
    }
}

// Invocación usando valores por defecto
columna_conica();

// Invocación con argumentos posicionales
translate([30, 0, 0]) columna_conica(60, 12, 6);

// Invocación con argumentos nombrados (en cualquier orden)
translate([60, 0, 0]) columna_conica(radio_corte = 8, altura = 25);
```

> [!tip] Argumentos nombrados para código autodocumentado
> En módulos con más de dos o tres parámetros, usar la sintaxis `nombre_parametro = valor` previene errores graves de confusión entre radios, diámetros y alturas, facilitando la lectura del código a colaboradores.

---

## Organización de proyectos y librerías: `use` vs `include`

OpenSCAD permite separar proyectos en múltiples archivos `.scad` e interconectarlos. Existen dos directivas con comportamientos radicalmente distintos:

| Directiva | Qué importa | Ejecuta código de nivel superior | Sobrescribe variables globales | Caso de uso principal |
|---|---|---|---|---|
| `use <archivo.scad>` | **Solo módulos y funciones** | **No** (ignora piezas sueltas dibujadas en el archivo importado) | **No** | Importar librerías de piezas reutilizables sin alterar el script principal. |
| `include <archivo.scad>` | **Todo el archivo** (como un copia-pega textual) | **Sí** (dibuja cualquier sólido de nivel raíz) | **Sí** (sobrescribe valores de variables globales) | Importar tablas de configuración, parámetros globales o paletas de colores. |

```openscad
// Ejemplo: estructura recomendada de imports
include <config_impresion.scad> // Carga tolerancias globales y constantes
use <libreria_tornilleria.scad> // Carga modulos de tornillos sin dibujarlos
use <libreria_bisagras.scad>    // Carga modulos de bisagras

// Llamada limpia a los modulos importados
caja_con_bisagra();
```

---

## Caso práctico de ingeniería: Ladrillo LEGO paramétrico

Un ejemplo clásico de pensamiento computacional en CAD es el diseño de un ladrillo LEGO cuya anchura, número de espigas (*studs*) y refuerzos interiores se recalculan automáticamente en función de una única variable.

```text
       ┌───┐       ┌───┐       ┌───┐
       │ • │       │ • │       │ • │     <-- Espigas (d = 4.8mm, h = 1.7mm)
   ┌───┴───┴───────┴───┴───────┴───┴───┐
   │                                   │ <-- Altura estándar = 9.6mm
   │       Bloque paramétrico          │
   └───────────────────────────────────┘
   ◄──────── (espigas * 8mm) ──────────►
```

```openscad
module bloque_lego(espigas_x = 4, espigas_y = 2) {
    $fn = 30;
    
    // Dimensiones estándar oficiales (en mm)
    paso_espiga = 8.0;
    diametro_espiga = 4.8;
    altura_espiga = 1.7;
    altura_cuerpo = 9.6;
    espesor_pared = 1.2;
    
    ancho_total = espigas_x * paso_espiga;
    profundo_total = espigas_y * paso_espiga;
    
    union() {
        // Cuerpo principal hueco
        difference() {
            cube([ancho_total, profundo_total, altura_cuerpo]);
            // Vaciado inferior
            translate([espesor_pared, espesor_pared, -1])
                cube([
                    ancho_total - 2 * espesor_pared,
                    profundo_total - 2 * espesor_pared,
                    altura_cuerpo - espesor_pared + 1
                ]);
        }
        
        // Matriz de espigas superiores
        for (ix = [0 : espigas_x - 1]) {
            for (iy = [0 : espigas_y - 1]) {
                pos_x = ix * paso_espiga + paso_espiga / 2;
                pos_y = iy * paso_espiga + paso_espiga / 2;
                
                translate([pos_x, pos_y, altura_cuerpo])
                    cylinder(h = altura_espiga, d = diametro_espiga);
            }
        }
    }
}

// Generación de distintas piezas con el mismo módulo
bloque_lego(espigas_x = 2, espigas_y = 2); // Bloque 2x2
translate([0, 25, 0]) bloque_lego(espigas_x = 6, espigas_y = 2); // Bloque 6x2
translate([0, 50, 0]) bloque_lego(espigas_x = 8, espigas_y = 1); // Listón 8x1
```

---

## Patrones de arquitectura de código limpio

1. **Un archivo, una responsabilidad:** Guardar piezas genéricas (`tornillo_m3.scad`, `polea_gt2.scad`) en una carpeta común de librerías (`lib/`).
2. **Auto-test al final del archivo de librería:** Añadir una llamada comentada o condicional al módulo al final del archivo para poder previsualizarlo de forma aislada mientras se programa.
3. **Desacoplar geometría de dimensiones físicas:** Agrupar los parámetros modificables al inicio de la cabecera del módulo y calcular las variables derivadas dentro del cuerpo antes de las sentencias CSG.

---

## Próximos pasos

Aprende a dotar a tus modelos de toma de decisiones automáticas y variabilidad mediante sentencias condicionales:

- [[07-logica-condicional-y-diseno-parametrico-dinamico|07: Lógica condicional y diseño paramétrico dinámico]]
