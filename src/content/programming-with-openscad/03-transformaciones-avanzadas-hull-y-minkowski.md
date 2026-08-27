---
title: "Transformaciones avanzadas, hull y minkowski"
description: "Transformaciones espaciales en OpenSCAD: rotaciones, simetrías, escalado, orden de evaluación y operaciones avanzadas de combinación geométrica como convex hull y suma de Minkowski"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [3d, openscad, transformations, rotate, mirror, resize, hull, minkowski, 3d-printing]
---

# Transformaciones avanzadas, hull y minkowski

> [!abstract] Resumen
> Más allá de la traslación lineal, OpenSCAD proporciona transformaciones espaciales continuas para reorientar, reflejar y redimensionar cuerpos geométricos (`rotate`, `mirror`, `resize`). Además, introduce dos operadores geométricos de alto nivel sumamente potentes: `hull()`, que calcula la envolvente convexa continua tensada entre varios sólidos, y `minkowski()`, que calcula la suma morfológica de Minkowski para suavizar aristas o expandir volúmenes. Esta nota desglosa cómo controlar el orden de evaluación de transformaciones encadenadas y cómo optimizar el relleno (*infill*) y los perímetros (*shells*) al imprimir estas piezas.

---

## Transformaciones espaciales básicas

Las transformaciones en OpenSCAD son operadores prefijos que actúan sobre la sentencia o bloque `{ ... }` que les sigue.

```text
┌─────────────────┬─────────────────┬─────────────────┐
│ rotate([x,y,z]) │ mirror([x,y,z]) │ resize([x,y,z]) │
├─────────────────┼─────────────────┼─────────────────┤
│ Rota en grados  │ Refleja sobre   │ Ajusta cotas    │
│ sobre cada eje  │ plano normal    │ milimétricas    │
└─────────────────┴─────────────────┴─────────────────┘
```

---

### 1. Rotación en el espacio (`rotate`)

El operador `rotate([ang_x, ang_y, ang_z])` rota el sólido en sentido antihorario respecto al origen `(0,0,0)` de cada eje coordenado. Los ángulos se expresan en grados decimales.

```openscad
// Rotación simple de 90 grados sobre el eje X
rotate([90, 0, 0]) cube([30, 20, 10]);

// Rotación sobre el eje Z (útil para patrones polares)
rotate([0, 0, 45]) cube([20, 20, 10], center = true);
```

> [!tip] Descomponer rotaciones multi-eje complejas
> Aunque `rotate([rx, ry, rz])` acepta los tres ángulos a la vez, OpenSCAD aplica internamente las rotaciones en el orden estricto $X \rightarrow Y \rightarrow Z$. Cuando se requiere un control exacto de la orientación espacial (por ejemplo, articular un brazo robótico), es mucho más predecible y legible encadenar rotaciones individuales:
> ```openscad
> rotate([0, 0, 30]) rotate([45, 0, 0]) mi_pieza();
> ```

---

### 2. Simetría y reflexión (`mirror`)

El operador `mirror([nx, ny, nz])` refleja la geometría a través de un plano que pasa por el origen y es **perpendicular al vector normal** indicado:

- `mirror([1, 0, 0])`: Reflejo a través del plano $YZ$ (invierte la coordenada $X$).
- `mirror([0, 1, 0])`: Reflejo a través del plano $XZ$ (invierte la coordenada $Y$).
- `mirror([0, 0, 1])`: Reflejo a través del plano $XY$ (invierte la coordenada $Z$).

```openscad
// Crea la mitad izquierda original y añade la mitad derecha reflejada
module semicarcasa() {
    translate([5, 0, 0]) cube([20, 30, 10]);
}

// Unión simétrica bilateral completa
union() {
    semicarcasa();
    mirror([1, 0, 0]) semicarcasa();
}
```

> [!note] `mirror` desplaza, no duplica
> `mirror` no crea un clon simétrico por sí solo, sino que transforma la posición del sólido hijo. Para generar simetrías completas, se debe instanciar la pieza original y una copia bajo `mirror()`.

---

### 3. Redimensionado absoluto (`resize`)

A diferencia de `scale([factor_x, factor_y, factor_z])`, que multiplica por un factor de escala porcentual, `resize([cota_x, cota_y, cota_z])` fuerza a que el sólido final ocupe exactamente las dimensiones absolutas deseadas.

```openscad
// Convierte una esfera de radio 10 (20 mm diámetro) en un elipsoide de 50x20x10 mm
resize([50, 20, 10]) sphere(r = 10, $fn = 60);
```

---

## El orden de encadenamiento: evaluación de derecha a izquierda

El orden en el que se redactan las transformaciones es crucial. OpenSCAD evalúa las operaciones desde la más interna (más cercana al sólido) hacia la más externa.

```text
Caso A: rotate() después de translate()
[Origen] ────► translate([20,0,0]) ────► rotate([0,0,90]) ────► [Posición: (0, 20, 0)]
(La rotación gira también el vector de traslación alrededor del origen general)

Caso B: translate() después de rotate()
[Origen] ────► rotate([0,0,90]) ────► translate([20,0,0]) ────► [Posición: (20, 0, 0)]
(La traslación desplaza el sólido ya orientado respecto a su sistema local)
```

```openscad
// Caso A: Rota sobre el origen DESPUÉS de haberse desplazado 20mm
rotate([0, 0, 90]) translate([20, 0, 0]) cube([10, 5, 5], center = true);

// Caso B: Rota sobre sí mismo y LUEGO se desplaza 20mm
translate([20, 0, 0]) rotate([0, 0, 90]) cube([10, 5, 5], center = true);
```

---

## Envolvente convexa: `hull()`

El operador `hull()` calcula el poliedro o piel convexa mínima que envuelve a todos los sólidos hijos contenidos en su bloque (análogo a envolver los objetos con una película plástica a tensión).

```openscad
// Mango anatómico o biela redondeada conectando dos cilindros de distinto diámetro
hull() {
    translate([-25, 0, 0]) cylinder(h = 6, d = 16, center = true, $fn = 40);
    translate([25, 0, 0]) cylinder(h = 6, d = 30, center = true, $fn = 40);
}
```

```text
       ┌────────┐
      /          \
     (   (•)      )═══════════════(   (•)   )
      \          /
       └────────┘
     cilindro base                 cilindro mayor
     ◄───────────────── hull() ─────────────────►
```

### Casos de uso de `hull()`
1. **Transiciones suaves y bielas:** Conectar ejes o cilindros sin calcular manualmente tangentes trigonométricas complejas.
2. **Carcasas aerodinámicas y ergonómicas:** Definir esferas en los extremos y permitir que `hull()` genere el fuselaje continuo.
3. **Chaflanes y cuñas poligonales:** Unir cubos o perfiles desplazados.

---

## Suma morfológica de Minkowski: `minkowski()`

El operador `minkowski()` recorre todo el perímetro del primer sólido barriendo con el centro geométrico del segundo sólido.

```openscad
// Caja rectangular con todas las esquinas y cantos perfectamente redondeados
$fn = 30;
radio_esquina = 3;

minkowski() {
    // Sólido base compensado en tamaño
    cube([40 - 2*radio_esquina, 30 - 2*radio_esquina, 10 - 2*radio_esquina], center = true);
    // Herramienta de redondeo
    sphere(r = radio_esquina);
}
```

> [!warning] Aumento dimensional y coste de CPU en `minkowski()`
> 1. **Crecimiento volumétrico:** `minkowski()` suma el radio del segundo sólido a las tres dimensiones del primero. Si necesitas una pieza de dimensiones exteriores exactas, debes restar el doble del radio al sólido base antes de aplicar la operación.
> 2. **Carga computacional:** Un `minkowski()` entre dos sólidos de alta resolución poligonal puede congelar el cálculo en CPU (`CGAL`). Utiliza `$fn` moderados (15 a 30) o combina `cylinder` en lugar de `sphere` si solo deseas redondear en 2D.

---

## Consideraciones para impresión 3D: Relleno e Integridad Estructural

Al laminar modelos generados en OpenSCAD con formas orgánicas creadas mediante `hull` o `minkowski`:

| Parámetro en el Slicer | Descripción | Recomendación de ajuste |
|---|---|---|
| **Infill (Densidad de relleno)** | Porcentaje de material interno (rejilla, giroide, panal). | **5% a 15%** para piezas decorativas/modelos; **30% a 50%** para piezas mecánicas bajo carga. |
| **Shells / Perímetros (Paredes)** | Número de capas perimetrales continuas que forman la piel exterior del objeto. | **2 perímetros (~0.8 mm)** para prototipos rápidos; **4 a 6 perímetros (~1.6 a 2.4 mm)** para máxima resistencia estructural sin aumentar excesivamente el relleno. |
| **Orientación de impresión** | Plano de contacto con la base de impresión (*bed*). | Posicionar la cara plana más amplia generada por `hull()` hacia la base para maximizar la adherencia y evitar soportes innecesarios. |

---

## Próximos pasos

Aprende a diseñar perfiles en dos dimensiones y proyectarlos hacia el espacio tridimensional mediante extrusión:

- [[04-geometria-2d-y-extrusion|04: Geometría 2D y técnicas de extrusión]]
