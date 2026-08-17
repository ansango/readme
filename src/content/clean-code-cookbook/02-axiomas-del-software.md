---
title: "Axiomas del software"
description: "Qué es el software, el principio único de diseño y los axiomas que vertebran todas las recetas del cookbook"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, axiomas, principios, mapper, design]
---

# Axiomas del software

> [!abstract] Resumen
> Antes de entrar en las recetas, el libro sienta las bases filosóficas. Esta nota cubre qué es el software (spoiler: no es solo código) y cuál es el **principio único de diseño** que Contieri considera la raíz de toda la disciplina: **el software debe mapear el mundo real**. De ese axioma se derivan todas las recetas del libro.

## Qué es el software

El libro empieza con una definición amplia: **el software es un mapeo del mundo real**.

```text
Software =

  - Mapeo de un dominio al mundo digital.
  - Conjunto de instrucciones que una máquina puede ejecutar.
  - Sistema que satisface las necesidades de sus usuarios.
  - Producto que evoluciona a lo largo del tiempo.
```

> [!quote] "Software is a MAPPER."
> El libro usa **MAPPER** en mayúsculas porque es la sigla de un concepto central:
> - **M**odel
> - **A**bstraction
> - **P**rogram
> - **P**roject
> - **E**xecute
> - **R**efactor

```text
MAPPER: el rol del software.

  - Model: el código modela el dominio.
  - Abstraction: el código abstrae la realidad.
  - Program: el código se programa.
  - Project: el código es un proyecto.
  - Execute: el código se ejecuta.
  - Refactor: el código se refactoriza.
```

> [!tip> El software no es el código
> El libro insiste: software es **el modelo de un dominio**. El código es la representación. Si el modelo es bueno, el código lo refleja. Si el modelo es malo, el código no puede arreglarlo.

### El dominio es la realidad

El libro usa la palabra **dominio** con un significado preciso:

```text
Dominio = el mundo real que el software representa.

Ejemplos:
  - Banca: cuentas, transacciones, balances.
  - Salud: pacientes, citas, diagnósticos.
  - E-commerce: productos, carritos, pedidos.
  - Logística: envíos, rutas, almacenes.

El código debe mapear el dominio.
```

> [!note] El dominio no incluye tecnología
> El dominio es la **realidad del negocio**. La tecnología (la base de datos, el framework, el lenguaje) es **auxiliar**. Cuando el código depende más de la tecnología que del dominio, está mal modelado.

## El principio único de diseño

El libro es radical: **hay un solo principio de diseño**.

```text
El principio único:

  El software debe mapear el mundo real.

Consecuencias:
  - Los objetos deben corresponderse con entidades del dominio.
  - Las relaciones entre objetos deben corresponderse con relaciones del dominio.
  - El comportamiento de los objetos debe corresponderse con el comportamiento del dominio.
  - Las excepciones deben corresponderse con excepciones del dominio.
```

> [!quote] "If you remember only one thing from this book, remember this: software must map the real world."
> El libro lo dice en serio. El resto de las recetas son **consecuencias** de este axioma.

### Por qué un solo principio

La mayoría de los libros de diseño enseñan **múltiples principios** (SOLID, GRASP, DRY, KISS, YAGNI...). Contieri argumenta que todos esos principios son **consecuencias** del uno:

```text
Single Responsibility Principle:  →  Una responsabilidad = un rol en el dominio.
Open/Closed Principle:           →  Abierto a nuevos roles del dominio.
Liskov Substitution:              →  Las subtipos modelan subtipos del dominio.
Interface Segregation:            →  Interfaces separadas por capacidad del dominio.
Dependency Inversion:             →  Depender de abstracciones del dominio.

Todos derivan de "el software debe mapear el mundo real".
```

> [!tip> Los principios son consecuencias
> No necesitas memorizar SOLID si entiendes el axioma. Las decisiones de diseño se deducen.

## Decisiones que se derivan del axioma

El libro aplica el axioma a varias decisiones prácticas:

### 1. Naming

```text
Axioma: el código mapea el dominio.

Conclusión:
  - Los nombres deben venir del dominio, no de la tecnología.
  - "Customer" es mejor que "UserRecord".
  - "Order" es mejor que "TransactionEntity".

Mal:
  - CustomerDTO, CustomerResponse, CustomerVO
  - CustomerBO, CustomerBean, CustomerInfo

Por qué:
  - Esos sufijos son de la implementación, no del dominio.
```

### 2. Modeling

```text
Axioma: el código mapea el dominio.

Conclusión:
  - Si en el dominio "Customer" tiene un nombre, el objeto se llama "Customer".
  - Si en el dominio "Customer" tiene un email, el objeto tiene un email.
  - Si en el dominio "Customer" no tiene un "middleName", el objeto no debería tenerlo.
```

### 3. Encapsulation

```text
Axioma: el código mapea el dominio.

Conclusión:
  - Lo que está oculto en el dominio, está oculto en el código.
  - Lo que está accesible en el dominio, está accesible en el código.
  - Si "Customer.email" no debería ser modificable, el código lo protege.
```

### 4. Behavior

```text
Axioma: el código mapea el dominio.

Conclusión:
  - Las acciones del dominio se modelan como métodos.
  - "Customer.activate()" en lugar de "status='active'".
  - "Order.cancel()" en lugar de "Order.setStatus('cancelled')".
```

### 5. Composition

```text
Axioma: el código mapea el dominio.

Conclusión:
  - Las relaciones "tiene-un" se modelan con composición.
  - Las relaciones "es-un" se modelan con herencia (cuando apropiado).
  - Customer tiene un Address.
  - VIPCustomer es un Customer.
```

## El dominio es el qué, la tecnología es el cómo

El libro marca una distinción que parece trivial pero cambia todo:

```text
Dominio (qué):

  - ¿Qué hace el sistema?
  - ¿Quiénes son los actores?
  - ¿Qué reglas de negocio hay?
  - ¿Qué restricciones?
  - ¿Qué excepciones?

Tecnología (cómo):

  - ¿En qué lenguaje se implementa?
  - ¿Qué base de datos se usa?
  - ¿Qué framework de UI?
  - ¿Cómo se despliega?
  - ¿Cómo se monitorea?

El código debe reflejar el "qué".
El código no debe estar atado al "cómo".
```

> [!tip> Si tu código cambia con cada nueva tecnología, está mal
> El libro es claro: un modelo de dominio bien hecho **migra** de una tecnología a otra con poco cambio. Si tu código depende de la base de datos, no del dominio, **no es MAPPER**.

## Anti-mapper

El libro define el **anti-mapper**: código que **no** mapea el dominio.

```text
Anti-mapper:

  - Nombres técnicos (DTO, BO, VO, Bean).
  - Anemic objects (solo atributos, sin comportamiento).
  - Primitive obsession (int, String para todo).
  - Service classes que hacen "todo".
  - Controllers que contienen lógica de negocio.
  - DB queries en la presentación.
  - Frameworks que dictan la estructura.

Cada uno de estos es un smell que la receta correspondiente intenta arreglar.
```

> [!note] El libro es claro
> Casi todos los code smells son **violaciones del axioma MAPPER**. Por eso las recetas existen: para arreglar violaciones del mapeo.

## El test del mapeo

El libro propone un test simple para saber si tu código es MAPPER:

```text
Test del MAPPER:

  - ¿Un experto del dominio puede leer los nombres?
  - ¿Un experto del dominio puede entender las relaciones?
  - ¿Un experto del dominio puede predecir el comportamiento?
  - ¿Un cambio en el dominio se traduce en un cambio local en el código?

Si la respuesta es "no" a alguna, el código no mapea.
```

> [!tip] El test del experto
> El libro recomienda **mostrar el código a un experto del dominio** (no técnico). Si puede leer y entender, el código mapea. Si no puede, no.

## El "MAPPER" como mantisa

El libro argumenta que el MAPPER tiene **consecuencias prácticas**:

```text
MAPPER implica:

  - Domain-Driven Design (Eric Evans).
  - Clean Architecture (Robert C. Martin).
  - Hexagonal Architecture (Alistair Cockburn).
  - Onion Architecture (Jeffrey Palermo).

Todas estas arquitecturas son variaciones del mismo principio:
  separar el dominio de la tecnología.
```

> [!tip> El libro no es dogmático
> Contieri no impone ninguna arquitectura. Propone el axioma y deja al lector elegir cómo implementarlo.

## Ciclos de cambio

El libro introduce un concepto importante: **los ciclos de cambio**.

```text
¿Qué cambia en el software?

  - Reglas de negocio: cambian a menudo.
  - Tecnología: cambia con frecuencia.
  - Interfaz de usuario: cambia con frecuencia.
  - Base de datos: cambia con menos frecuencia.
  - Casos de uso: cambian con menos frecuencia.

Principio:
  - Lo que cambia junto, va junto.
  - Lo que cambia en tiempos distintos, va separado.
```

> [!note] Por qué importa esto
> Si las reglas de negocio y la base de datos están acopladas, **cualquier cambio de BD toca las reglas de negocio**. Separarlas es una decisión arquitectónica.

## El dominio primero

El libro cierra el capítulo con la **regla de oro**:

```text
Regla de oro:

  1. Entiende el dominio.
  2. Modela el dominio.
  3. Implementa el modelo.
  4. Aísla la implementación.
  5. Refactoriza contra el modelo, no contra la implementación.
```

> [!quote] "Without a clear domain, all recipes are useless."
> El libro es claro: las recetas son **consecuencias de un modelo claro**. Sin modelo, no hay a qué aplicar las recetas.

## Resumen en tres frases

- **El software es un MAPPER**: modela el mundo real con abstracciones ejecutables.
- **El principio único de diseño**: el código debe mapear el dominio. SOLID y los demás son consecuencias.
- **El dominio es el qué, la tecnología es el cómo**: si tu código está atado a la tecnología, no es MAPPER.

## Próximos pasos

- [[03-anemic-models-parte-1|Anemic Models - parte 1]]: la primera receta del libro. Los objetos anémicos son la violación más común del MAPPER. Cómo detectar y empezar a corregir.
