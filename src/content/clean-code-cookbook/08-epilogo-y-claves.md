---
title: "Epílogo y claves"
description: "Cierre de la wiki de Clean Code Cookbook: las ideas recurrentes, los frameworks de decisión y cómo seguir aplicando las recetas"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, epilogo, cierre, claves]
---

# Epílogo y claves

> [!abstract] Resumen
> Cierre de la wiki sobre *Clean Code Cookbook* de Maximiliano Contieri. Recopila las ideas recurrentes, los marcos de decisión para aplicar las recetas, y cómo seguir profundizando en clean code y refactoring.

## La postura del libro

Clean Code Cookbook no es un libro que te diga "este código es feo, reescríbelo". Es un libro que te dice: **estos son los problemas, estas son las recetas, pero aplícalas con criterio**.

> [!quote> "Recipes are optional, code smells are heuristics."
> El libro es claro: las recetas son **herramientas**, no mandamientos. El programador decide cuándo aplicarlas.

### El tono del libro

Contieri escribe con una mezcla de:

- **Pragmatismo**: cada receta tiene contraindicaciones.
- **Argumentación**: explica por qué, no solo qué.
- **Honestidad**: admite que algunas recetas son controversiales.
- **Pasión**: se nota que lleva años escribiendo sobre esto.

## Las ideas recurrentes

A lo largo de las notas, hay ideas que se repiten con insistencia. Las recopilo aquí.

### 1. El software es un MAPPER

El axioma único: **el código debe mapear el dominio**. Todo lo demás (SOLID, refactoring, design patterns) son consecuencias.

### 2. Anemicidad y primitive obsession son las dos caras del anti-mapper

La anemicidad viola el MAPPER porque quita el comportamiento. La primitive obsession viola el MAPPER porque esconde el dominio tras tipos básicos. Combatir ambas es **devolver el dominio al código**.

### 3. Encapsulación es la disciplina diaria

Cada getter, cada setter, cada atributo público es una grieta en la encapsulación. Cada grieta es una oportunidad de error. La disciplina es **reducir la superficie**.

### 4. Naming es la mitad del código

Los buenos nombres comunican intención. Los malos nombres obligan al lector a descifrar. Invertir tiempo en naming es invertir en **legibilidad**.

### 5. Los behaviors son de los objetos

Cada acción del dominio debe ser un método del objeto. Si el método está en otro lugar, el objeto es anémico.

### 6. La esencia no cambia

Los atributos esenciales no deben cambiar. Si cambian, son accidentales. Distinguirlos es la base del diseño correcto.

### 7. Los primitivos tienen nombre

Un `int` que representa dinero es **dinero**, no un int. El dominio le da nombre, el código debe usarlo.

### 8. Las validaciones se centralizan

Una vez que existe `Email`, no hay `if "@" not in email` en treinta sitios. La validación está en el constructor.

### 9. La doble encapsulación es un agujero

`customer.getAddress().getCity().setName("Madrid")` es acceso excesivo. La forma correcta es `customer.moveTo("Madrid")`.

### 10. Las colecciones no se exponen

Devolver una lista mutable es devolver una puerta abierta. Vistas inmutables, copias defensivas, streams.

### 11. Los DTOs son para comunicación externa

En el dominio, los DTOs son la exportación del problema anémico. Úsalos solo donde la **comunicación externa** los exige.

### 12. Los frameworks no deciden el modelo

Lombok, ActiveRecord, JPA: útiles para eliminar boilerplate, peligrosos si dictan la estructura.

### 13. La IA hereda los problemas

Copilot, Codex, ChatGPT: generan código estándar, también anémico. El humano diseña.

### 14. Clean code es una disciplina

Clean code no es un destino, es un camino. Las recetas existen para ayudarte a recorrerlo.

### 15. Los tests son la red de seguridad

Sin tests, las refactorings semánticas son peligrosas. Los tests son la red que permite moverse con confianza.

## Marcos de decisión

El libro no da recetas aplicadas. Da **marcos para decidir**. Aquí los más útiles:

### ¿Refactorizo o lo dejo?

```text
Pregunta 1: ¿El smell está confirmado?
  - ¿Es un problema real o solo estética?
  - ¿Hay evidencia (bugs, fricción, complejidad)?

Pregunta 2: ¿Es el momento?
  - ¿Estoy modificando este código por otra razón?
  - ¿Hay tiempo y recursos?

Pregunta 3: ¿Vale la pena?
  - ¿Cuánto cuesta la refactorización?
  - ¿Cuánto cuesta NO refactorizar?

Si el coste de no-refactorizar > coste de refactorizar, hazlo.
Si no, déjalo para otro momento.
```

### ¿Reifico un primitivo?

```text
Pregunta 1: ¿El dominio le da nombre?
  - Si sí, reificar.
  - Si no, dejar primitivo.

Pregunta 2: ¿Hay validaciones?
  - Si sí, reificar.
  - Si no, podría reificar, pero no obligatorio.

Pregunta 3: ¿Hay comportamiento?
  - Si sí, reificar.
  - Si no, primitivo OK.

Si al menos 2 "sí", reificar.
```

### ¿Muevo comportamiento al objeto o lo dejo en un service?

```text
Va en el objeto:

  - Lógica que afecta solo al objeto.
  - Validaciones de invariantes.
  - Transiciones de estado.
  - Cálculos derivados.

Va en un service:

  - Lógica que cruza varios objetos.
  - Orquestación.
  - Interacción con infraestructura.
  - Notificaciones externas.
```

### ¿Vale la pena un DTO?

```text
Considera un DTO si:

  - La comunicación externa lo necesita.
  - El formato debe ser estable.
  - El contrato es diferente al modelo.

NO uses DTO si:

  - Es solo para mover datos entre capas internas.
  - Duplicas el modelo "por flexibilidad".
  - Es para tu propia base de código.
```

### ¿Uso auto-properties?

```text
Si en Java/Kotlin y los necesitas:
  - Usa @Data con cuidado.
  - Genera solo lo que necesitas.
  - Documenta los setters.

En Python:
  - Usa @property solo con lógica.
  - No abuses de los atributos "públicos".

En JavaScript:
  - Evita setters auto-generados.
  - Usa Object.freeze o inmutabilidad cuando puedas.
```

## Aplicación práctica

El libro es lectura, pero la cocina se aprende **cocinando**. Aquí una ruta práctica:

### Nivel 1: tu código actual

```text
1. Elige un módulo con code smells claros.
2. Identifica un objeto anémico.
3. Mueve un método del service al objeto.
4. Reifica un primitivo.
5. Escribe tests.
6. Compara antes y después.
```

### Nivel 2: code reviews

```text
1. En cada PR, identifica un code smell.
2. Sugiere una receta.
3. Discute con el equipo.
4. Acuerda estándares.
```

### Nivel 3: equipo

```text
1. Comparte el libro.
2. Discute los principios.
3. Establece convenciones.
4. Code reviews con vocabulario común.
```

### Nivel 4: sistema

```text
1. Aplica las recetas a nivel de arquitectura.
2. Mapea el dominio desde el principio.
3. Evita anemicidad sistémica.
4. Diseña con la esencia en mente.
```

## Cómo NO aplicar el libro

El libro es claro sobre los anti-patrones de aplicar las recetas:

### No aplicar por aplicar

```text
Anti-patrón:

  - "Vamos a refactorizar todo, no se toca nada."
  - "El team lead dice que hay que reificar todos los int."
  - "El clean code cookbook es la biblia."

El libro es claro: las recetas son opcionales.
```

### No obsesionarse con la pureza

```text
Anti-patrón:

  - "Esta clase tiene un getter, ES MAL."
  - "Necesito un value object para este int."
  - "Mi modelo es imperfecto."

El libro es claro: prioriza. Algunos smells se arreglan, otros no.
```

### No usar las recetas como cuchilla de Carnicero

```text
Anti-patrón:

  - Refactorizar código que no se va a tocar.
  - Forzar recetas en un módulo que funciona.
  - Hacer refactorings inseguros sin tests.

El libro es claro: las recetas tienen contraindicaciones.
```

## Ideas para tu carrera

El libro invita a una pregunta más amplia: **¿qué tipo de programador quiero ser?**

### Las opciones

```text
Programador 1: "Escribo código que funciona."

  - Tiene trabajo.
  - El código es difícil de mantener.
  - El equipo se queja.

Programador 2: "Escribo código que funciona y que se entiende."

  - Tiene más trabajo inicial.
  - El código es mantenible.
  - El equipo lo agradece.

Programador 3: "Escribo código que funciona, se entiende, y enseña a otros."

  - Más trabajo aún.
  - El código es mantenible Y educativo.
  - El equipo crece.

Programador 4: "Diseño sistemas que enseñan a otros."

  - El diseño del sistema es la lección.
  - El código es la implementación.
  - El equipo se automejora.
```

> [!tip> El libro aboga por el programador 4
> Contieri no lo dice explícitamente, pero la filosofía del libro es esa: el código es **enseñanza**. Cada decisión comunica una forma de pensar.

## El legado del libro

Clean Code Cookbook no es un libro técnico más. Es un libro de **cultura de equipo**. Las recetas se enseñan, se comparten, se debaten. El valor no es aplicarlas, sino **hablar el mismo idioma**.

```text
El libro aporta:

  - Vocabulario compartido (anemic, MAPPER, DTO, etc.).
  - Marcos de decisión (cuándo aplicar, cuándo no).
  - Ejemplos concretos (código, anti-código, refactor).
  - Recursos adicionales (libros, papers, blogs).

El libro no es:

  - Una biblia de mandamientos.
  - Un conjunto de reglas mecánicas.
  - Una guía para hacer el código perfecto.
```

## Una reflexión final

El libro termina con una idea que vale la pena recordar:

> "El mejor código no es el que aplica todas las recetas. Es el que sabe **cuándo** aplicarlas y cuándo dejarlas en la caja."

> [!quote> "Code is a means, not an end."
> El libro es claro: el código es un **medio** para resolver problemas del dominio. El fin es resolver el problema. El código es la herramienta.

## Próximos pasos con esta wiki

Con esta wiki completa, las direcciones naturales desde aquí son:

- **Usarla como referencia**: cuando un code smell aparezca, vuelve a las notas pertinentes.
- **Aplicar las recetas**: en un módulo pequeño, en un proyecto personal, en un PR.
- **Enseñar a otros**: comparte las ideas, discute con tu equipo, escribe tu propio blog.
- **Criticar la selección**: el libro es parcial. Tu lectura debe serlo también.

Y, sobre todo: **la mejor forma de aprender clean code es escribirlo, leerlo, refactorizarlo y volverlo a escribir**. Las recetas son el camino, no el destino.
