---
title: "Clean Code Cookbook"
description: "Índice de la wiki de Clean Code Cookbook: recetas de refactoring para resolver code smells, basada en el libro de Maximiliano Contieri"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, refactoring, code-smells, cookbook]
---

# Clean Code Cookbook

> [!abstract] Resumen
> Esta wiki toma como guía *Clean Code Cookbook* de Maximiliano Contieri (O'Reilly, en early release). A diferencia del libro clásico de Robert C. Martin, este es un **cookbook**: cada capítulo ofrece recetas específicas para resolver code smells. Las notas destilan los patrones en español, con ejemplos y discusión de cuándo aplicar cada uno.

## Acerca del libro

Maximiliano Contieri es ingeniero de software, escritor y conferenciante. Lleva años publicando sobre clean code y refactoring en su blog. Este cookbook es la **versión sistemática** de sus recetas: tomadas de su blog, depuradas, ordenadas y ampliadas.

La estructura es deliberadamente práctica:

- **Code smells**: cada capítulo se organiza alrededor de un code smell.
- **Recetas**: cada sección es un "problema → solución → discusión".
- **Modernos**: incluye reflexiones sobre AI-generated code, polyglot programming, machine learning.

> [!quote] "Code smells are hints, not rigid rules. Recipes are optional, not mandatory."
> El libro es claro: las recetas son **herramientas**, no mandamientos. Aplicarlas sin entender es peor que no aplicarlas.

## Quién debería leer esta wiki

- **Programadores** que quieren mejorar la calidad de su código.
- **Tech leads** que necesitan un vocabulario compartido para code reviews.
- **Refactorers** que buscan patrones sistemáticos.
- **Cualquier persona** que se haya preguntado "¿esto se podría hacer mejor?".

## Cómo leer esta wiki

Las notas siguen el orden del libro. Cada capítulo cubre un code smell, y cada receta es una sub-sección del capítulo.

- **Capítulos 1 y 2** → una sola nota (conceptual, introductoria).
- **Capítulos 3 y 4** → dos notas por capítulo (split por bloque temático).

Cada nota arranca con un `[!abstract]`, sigue con H2/H3, usa **callouts** con propósito (`tip`, `warning`, `danger`, `question`, `example`, `note`, `info`), incluye **bloques de código** con ejemplos en Python (con notas sobre cómo aplicar el patrón en otros lenguajes), y cierra con `## Próximos pasos` enlazando a la siguiente.

## Bloques temáticos

### Conceptos básicos

- [[01-code-smells-y-refactoring|Code smells y refactoring]]: el setup. Qué es un code smell, qué es refactoring, qué es una receta, naming, design patterns, paradigmas.
- [[02-axiomas-del-software|Axiomas del software]]: el principio único de diseño. Lo que Contieri considera la base de toda la disciplina.

### Recetas por code smell

- [[03-anemic-models-parte-1|Anemic Models - parte 1]]: las primeras recetas sobre objetos anémicos. Conversión, esencia, setters, generadores de código.
- [[04-anemic-models-parte-2|Anemic Models - parte 2]]: completando la transformación. DTOs, constructores vacíos, getters, doble encapsulación, object orgy.
- [[05-primitive-obsession-parte-1|Primitive Obsession - parte 1]]: reificar primitives. Crear objetos pequeños, reificar datos primitivos, arrays asociativos, eliminar abusos de strings.
- [[06-primitive-obsession-parte-2|Primitive Obsession - parte 2]]: reificar timestamps, subconjuntos, validaciones, eliminar propiedades innecesarias.

### Cierre

- [[07-glosario-y-referencias|Glosario y referencias]]: glosario del libro, libros de referencia y rutas de profundización.
- [[08-epilogo-y-claves|Epílogo y claves]]: cierre de la wiki. Las ideas recurrentes y cómo seguir.

## Temas transversales

> [!tip] Cinco ideas que vuelven una y otra vez
> El libro entero orbita alrededor de cinco ideas:
> 1. **Mappings**: el código debe mapear el mundo real.
> 2. **Encapsulation**: el estado debe estar protegido.
> 3. **Behavior over data**: los objetos tienen comportamiento, no solo datos.
> 4. **Naming**: los buenos nombres son la mitad del código.
> 5. **Specialization**: no abstraigas antes de tener tres casos.

## Tono y estilo del libro

El libro es **directo** y **argumentativo**. Contieri no duda en afirmar "esto está mal" sin largas disquisiciones. La wiki mantiene ese tono: preferimos consejos claros a "depende".

> [!note] Las recetas son agnósticas de lenguaje
> El autor usa Java, C#, Python, JavaScript, Ruby y otros. La wiki usa **Python** como lenguaje de ejemplo porque es legible, pero los patrones aplican a cualquier lenguaje orientado a objetos.

## Próximos pasos

- [[01-code-smells-y-refactoring|Code smells y refactoring]]: el primer capítulo. Lo que aprendemos sobre qué es un code smell, qué es refactoring, y qué reglas usar para nombrar y clasificar.
