---
title: "Code smells y refactoring"
description: "Qué es un code smell, qué es refactoring, qué es una receta, naming, design patterns y paradigmas. La introducción del cookbook"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, refactoring, code-smells, naming, design-patterns]
---

# Code smells y refactoring

> [!abstract] Resumen
> Esta nota cubre el primer capítulo del cookbook: las definiciones fundamentales (code smell, refactoring, receta), la justificación de clean code, las reglas de naming, los design patterns más usados y los paradigmas de los que se nutren las recetas. Es la base conceptual antes de entrar en las recetas prácticas.

## Qué es un code smell

Contieri arranca con la definición de Martin Fowler: **un code smell es un síntoma de un problema**. No es el problema en sí, sino una **alerta** que nos dice "mira aquí".

```text
Code smell: indicador de un problema potencial.

NO es:
  - Una regla rígida.
  - Una verdad absoluta.
  - Una acusación.

SÍ es:
  - Una heurística.
  - Una pista.
  - Una invitación a investigar.
```

> [!tip] Smells, no reglas
> El libro es claro: "He visto el término code smell en muchos de mis artículos y la gente se lo toma como algo personal." La intención original de Fowler no es imponer, sino **alertar**.

### Cómo distinguir un smell de un problema real

El libro insiste en que un code smell es **una hipótesis**, no un diagnóstico. Antes de refactorizar, hay que confirmar:

```text
Proceso ante un code smell:

1. Detectar el smell.
2. Investigar la causa.
3. Evaluar el coste de no arreglarlo.
4. Comparar con el coste de arreglarlo.
5. Decidir.
```

> [!note] No todos los smells se arreglan
> Si el código está en un módulo que no se va a tocar nunca, el coste de refactorizar puede no merecer la pena. Las recetas existen **para cuando hace falta**, no como obligación.

## Qué es refactoring

Fowler da dos definiciones de refactoring, una como sustantivo y otra como verbo:

- **Refactoring (sustantivo)**: un cambio en la estructura interna del software para hacerlo más fácil de entender y modificar, **sin cambiar su comportamiento observable**.
- **Refactoring (verbo)**: reestructurar software aplicando una serie de refactorings sin cambiar su comportamiento observable.

> [!quote] "Refactoring doesn't change behavior. It changes structure."
> El libro insiste en la definición: refactoring no añade features, no corrige bugs, no cambia features. Solo cambia la **forma**.

### Refactorings automáticos vs semánticos

El libro distingue dos tipos:

| Tipo | Descripción | Herramientas |
|---|---|---|
| **Automático (safe)** | Cambios estructurales que la herramienta puede hacer sin alterar el comportamiento | IDE (IntelliJ, VS Code, etc.) |
| **Semántico (unsafe)** | Cambios que el humano hace entendiendo el código | El programador |

```text
Refactoring safe (automático):

  - Renombrar una variable.
  - Extraer un método.
  - Mover un método a otra clase.

Refactoring unsafe (semántico):

  - Convertir un objeto anémico en rich.
  - Reificar un primitive.
  - Cambiar la semántica de un método.
```

> [!warning] Los refactorings inseguros necesitan test coverage
> El libro insiste: cualquier refactoring semántico debe estar cubierto por **tests**. Sin tests, los refactorings inseguros son peligrosos.

## Qué es una receta

El libro usa **receta** como formato. Cada receta tiene:

```text
Anatomía de una receta:

1. Título: nombre memorable.
2. Problema: situación que reconoces.
3. Solución: cambio recomendado.
4. Discusión: por qué, cuándo, excepciones.
5. Véase también: recetas relacionadas.
```

> [!note] Las recetas son opcionales
> Como en un cookbook de cocina, las recetas se aplican **cuando te interesa el plato**. Ningún chef cocina todas las recetas del libro. Ningún programador debe aplicar todas las refactorings.

## Por qué clean code importa

El libro responde a la pregunta con un argumento práctico:

> [!quote] "Clean code is very important both in evolving systems like traditional Software as Service (SAS) systems and mobile apps. Even now it is more relevant in environments where we cannot push updates as fast as we wish."

```text
Clean code importa en:

  - Sistemas que evolucionan (SaaS, mobile).
  - Sistemas donde no puedes pushear updates rápido (embedded, space probes, smart contracts).
  - Equipos que cambian de membresía (cualquier equipo no trivial).
  - Contextos donde los bugs son caros (medicina, finanzas, aviación).
```

> [!tip] Clean code no es un fin, es un medio
> El libro es claro: la calidad del código importa en la medida en que **reduce costes futuros**. Refactorizar por estética, sin evidencia de valor, es **premature optimization**.

## Readability vs performance

Contieri toma partido: **legibilidad > rendimiento**, casi siempre.

```text
Filosofía:

  - Escribe código legible.
  - Cúbrelo con tests.
  - Mide el rendimiento real.
  - Optimiza solo los cuellos de botella.

  El principio 80/20 dice: optimizando el 20% crítico del código,
  obtienes el 80% del rendimiento.
```

> [!danger] La optimización prematura es la raíz del mal
> El libro cita explícitamente a Knuth: "la optimización prematura es la raíz de todo mal". Ojo: el libro es contra la optimización sin evidencia, no contra la optimización en general.

## Tipos de software

El libro nota que las recetas se aplican de forma distinta en distintos tipos de software:

| Tipo | Aplicabilidad de las recetas |
|---|---|
| Backend con reglas de negocio complejas | Todas las recetas aplican |
| Frontend | Muchas recetas, con adaptaciones |
| Embedded | Menos aplicables, otras prioridades |
| Smart contracts | Las recetas de encapsulación son críticas |
| ML/AI | Adaptar al modelo de objetos |

## Machine-generated code

El libro incluye una sección sobre herramientas de generación de código (Copilot, Codex, etc.) y su relación con clean code.

```text
Pregunta: ¿necesitamos clean code si tenemos AI que genera código?

Respuesta del libro: SÍ, más que nunca.

Por qué:
  - Los AI assistants generan código "anémico" estándar.
  - No entienden el contexto del sistema.
  - El humano sigue siendo el responsable del diseño.
  - Las decisiones de naming, encapsulación, modelado son humanas.
```

> [!note> El libro es de 2023
> Las herramientas evolucionan. La idea central: **el humano diseña, la máquina implementa**. Mientras eso sea cierto, las decisiones de clean code siguen siendo humanas.

## Naming

El libro dedica una sección a la **terminología** que usará de aquí en adelante. Los términos son intercambiables entre sí:

```text
Términos equivalentes:

  - Methods / functions / procedures
  - Attributes / instance variables / properties
  - Protocol / behavior
  - Arguments / collaborators / parameters
  - Anonymous functions / closures / lambdas
```

> [!tip> No te cases con la terminología
> El libro es agnóstico: lo que importa es el **concepto**, no la palabra. Las diferencias entre "method" y "procedure" son sutiles y a veces solo importan en el lenguaje concreto.

### Cómo nombrar bien

El libro no da una sola regla, pero recoge las habituales:

```text
Reglas de oro:

  - Nombres pronunciables.
  - Nombres que expresan intención.
  - Nombres sin ambigüedad.
  - Nombres que no engañan.
  - Nombres consistentes con el dominio.
```

### Nombres que engañan

El libro señala algunos patrones problemáticos:

```text
Mal:

  - DataClass / Info / Manager / Helper / Util
  - Process / Handle / Do / Run
  - A, B, C, tmp, x, foo, bar
  - theThing, theOtherThing

Por qué:
  - "DataClass" no dice nada del dominio.
  - "Process" no dice qué proceso.
  - Las letras no comunican.
  - "the" en nombres es ruido.
```

## Design patterns

El libro asume familiaridad con los **design patterns** clásicos (Gang of Four) y los usa como referencia.

```text
Patterns usados en el libro:

  - Strategy
  - Template Method
  - Null Object
  - Method Object
  - Visitor
  - Factory
  - Builder
  - Observer
  - Decorator
  - State

Patterns considerados anti-patterns:

  - Singleton (en la mayoría de los casos)
  - Anemic Domain Model
  - Primitive Obsession
```

> [!note> Los patrones son vocabulario, no dogma
> Saber qué es un Singleton ayuda a conversar. Aplicar Singleton sin contexto es un error. El libro usa los patrones como **puntos de referencia**, no como soluciones obligatorias.

## Paradigmas de programación

El libro combina ideas de varios paradigmas:

### Structured programming

```text
Principios:

  - Secuencia, selección, iteración.
  - Funciones pequeñas.
  - Una entrada, una salida.
  - Sin goto.
  - Sin estado compartido.
```

### Object-oriented programming

```text
Principios:

  - Encapsulación.
  - Herencia.
  - Polimorfismo.
  - Abstracción.
  - Mapeo a entidades del mundo real.
```

### Functional programming

```text
Principios:

  - Funciones puras.
  - Datos inmutables.
  - Composición.
  - Sin efectos secundarios.
```

> [!tip> El libro es pluralista
> No favorece un paradigma. Cada problema pide su solución. Las recetas mezclan técnicas de los tres.

## Objetos vs clases

El libro es claro: **habla de objetos, no de clases**.

```text
El libro prefiere hablar de objetos porque:

  - Los objetos son concretos en el mundo real.
  - Las clases son artefactos de implementación.
  - El programador razona en objetos (mapeo).
  - El compilador / intérprete genera las clases.
```

> [!note> Esto es importante
> La jerga del libro es deliberada. Cuando leas "objeto", piensa en una **entidad del mundo real** que tu código simula. Cuando leas "clase", piensa en una **forma** de crear objetos.

## Changeability

El libro cierra con la idea de **changeability**: la capacidad del software para cambiar.

```text
Changeability = capacidad de modificación.

Software es changeable cuando:
  - Pequeños cambios requieren poco código.
  - Los cambios están localizados.
  - Los tests verifican el cambio.
  - Los nombres comunican intención.
  - La estructura sigue al dominio.
```

> [!quote] Dave Farley, citado en el libro:
> "We must be experts at learning and make software ready for change."

## Resumen en tres frases

- Un **code smell** es un síntoma, no un diagnóstico. Investigar antes de refactorizar.
- **Refactoring** cambia la estructura sin cambiar el comportamiento. La disciplina es separar los refactorings safe (herramientas) de los inseguros (semánticos).
- **Clean code** importa cuando el software evoluciona, cuando los bugs son caros, y cuando equipos distintos necesitan entenderse. El naming es la mitad del código.

## Próximos pasos

- [[02-axiomas-del-software|Axiomas del software]]: el siguiente paso. El libro sienta las bases filosóficas antes de las recetas: qué es el software y cuál es el principio único de diseño.
