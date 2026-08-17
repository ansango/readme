---
title: "Glosario y referencias"
description: "Glosario de términos del cookbook, libros de referencia y rutas de profundización"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, glosario, referencias, lecturas]
---

# Glosario y referencias

> [!abstract] Resumen
> Esta nota es la **herramienta de referencia** de la wiki. Un glosario de los términos técnicos más usados, una bibliografía esencial para clean code y refactoring, y enlaces a autores clave de la disciplina.

## Cómo usar esta nota

El glosario es de **búsqueda rápida**: cuando un término en una nota te resulte confuso, vuelve aquí. La bibliografía es para **profundizar**: si un capítulo te interesa más, aquí tienes por dónde seguir.

## Glosario

### A

- **Anemic Domain Model**: anti-patrón donde los objetos solo tienen datos, sin comportamiento.
- **Anti-mapper**: código que no mapea el dominio.
- **Anemic object**: objeto sin comportamiento, solo atributos.
- **Anti-pattern**: patrón que produce resultados contraproducentes.
- **Auto-properties**: propiedades que auto-generan getters y setters.
- **Axiom**: verdad fundamental que sostiene el resto de razonamientos.

### B

- **Behavior**: comportamiento. Lo que un objeto hace, no sus datos.
- **Behavioral code**: código que modela comportamiento del dominio.
- **Bijection**: correspondencia uno-a-uno entre el modelo y el mundo real.
- **Blob**: objeto que hace demasiado, fuera de control.

### C

- **Changeability**: capacidad del software para ser modificado.
- **Class**: artefacto de implementación, no objeto del dominio.
- **Clean code**: código que aplica las recetas del libro.
- **Code smell**: síntoma de un problema potencial.
- **Cookbook**: formato de libro con recetas (problema → solución).
- **Coupling**: acoplamiento, dependencia entre módulos.

### D

- **DAO (Data Access Object)**: objeto para acceder a datos.
- **DDD (Domain-Driven Design)**: disciplina de diseño dirigida por el dominio.
- **DTO (Data Transfer Object)**: objeto para transferir datos entre capas.
- **Defensive copy**: copia de un objeto mutable para preservar encapsulación.
- **Domain**: el mundo real que el software modela.
- **Double encapsulation**: encapsulación a través de objetos anidados.

### E

- **Encapsulation**: ocultar el estado interno de un objeto.
- **Entity**: objeto con identidad.
- **Essential**: lo que define al objeto, no cambia.
- **Essential complexity**: complejidad inherente al problema.
- **Expression**: combinación de valores y operaciones.

### F

- **Factory method**: método para crear instancias.
- **Framework**: estructura que define cómo se organiza el código.
- **Function**: comportamiento sin estado.

### G

- **Getter**: método que devuelve un atributo.
- **GRASP**: General Responsibility Assignment Software Patterns.

### I

- **Identity**: lo que hace único a un objeto.
- **Immutability**: propiedad de no cambiar.
- **Information Hiding**: encapsulación.
- **Invariant**: propiedad que debe mantenerse en todo momento.

### M

- **MAPPER**: Model, Abstraction, Program, Project, Execute, Refactor. El rol del software.
- **Mapping**: correspondencia entre el dominio y el código.
- **Method**: comportamiento de un objeto.
- **Method object**: patrón que extrae un método complejo a un objeto.

### N

- **null**: ausencia de valor.
- **Null Object**: patrón que reemplaza null con un objeto "nulo" con comportamiento.
- **Naming**: nombrar variables, métodos, clases.

### O

- **Object**: entidad del dominio materializada en el código.
- **Object orgy**: anti-patrón donde un objeto expone sus colecciones internas.
- **ORM (Object-Relational Mapper)**: herramienta que traduce entre objetos y tablas.

### P

- **Paradigm**: estilo de programación (OO, funcional, etc.).
- **Pattern**: solución recurrente a un problema común.
- **Primitive**: tipo de dato básico (int, String, bool).
- **Primitive obsession**: code smell que usa primitivos en lugar de objetos.
- **Property**: atributo con getter y setter automáticos.

### R

- **Recipe**: solución a un problema en formato cookbook.
- **Refactoring**: cambio estructura sin cambio de comportamiento.
- **Ripple effect**: propagación de cambios en módulos dependientes.

### S

- **Setter**: método que asigna un atributo.
- **Service**: objeto que orquesta operaciones.
- **State machine**: modelado de estados y transiciones.
- **Stream**: objeto que produce o consume datos.
- **SRP (Single Responsibility Principle)**: una responsabilidad por clase.

### T

- **Tell, don't ask**: principio de que el objeto haga, no exponga datos.
- **Test coverage**: porcentaje de código cubierto por tests.
- **Trade-off**: decisión donde ganar algo implica perder otra cosa.

### V

- **Value object**: objeto sin identidad, definido por sus valores.
- **View**: representación de un objeto para un propósito específico.

### W

- **Wrapper**: clase que envuelve a otra para añadir funcionalidad.

### Y

- **YAGNI**: You Aren't Gonna Need It. No añadas funcionalidad antes de necesitarla.

## Bibliografía esencial

### Clásicos del clean code

- **Clean Code** (Robert C. Martin, 2008). El libro fundador del movimiento. Pragmático, contundente, a veces extremo.
  - **Clean Architecture** (Robert C. Martin, 2017). Cómo estructurar sistemas a gran escala.
  - **The Clean Coder** (Robert C. Martin, 2011). Código profesional más allá de la sintaxis.

- **Refactoring** (Martin Fowler, 1ª ed. 1999, 2ª ed. 2018). El libro de referencia.
  - **Patterns of Enterprise Application Architecture** (Martin Fowler, 2002). Patrones clásicos.
  - **Domain-Specific Languages** (Martin Fowler, 2010). Cuando los lenguajes específicos importan.

- **Working Effectively with Legacy Code** (Michael Feathers, 2004). Cómo refactorizar código sin tests.
  - **Refactoring Workbook** (William Wake). Ejercicios prácticos.

### Domain-Driven Design

- **Domain-Driven Design** (Eric Evans, 2003). El libro fundador.
  - **Domain-Driven Design Distilled** (Vaughn Vernon, 2016). Versión condensada.
  - **Implementing Domain-Driven Design** (Vaughn Vernon, 2013). Cómo implementar DDD.
  - **Patterns, Principles, and Practices of Domain-Driven Design** (Scott Millett, 2015).

### Diseño orientado a objetos

- **Object-Oriented Software Construction** (Bertrand Meyer, 1ª ed. 1988, 2ª ed. 1997). El libro clásico.
- **Design Patterns** (Gang of Four: Gamma, Helm, Johnson, Vlissides, 1994). Los patrones clásicos.
- **Head First Design Patterns** (Freeman, Robson, 2004). Versión didáctica.

### Programación extrema y agile

- **Extreme Programming Explained** (Kent Beck, 1ª ed. 1999, 2ª ed. 2004). XP.
- **The Pragmatic Programmer** (Hunt, Thomas, 1ª ed. 1999, 2ª ed. 2019). Pragmatismo.
- **Refactoring to Patterns** (Joshua Kerievsky, 2004). Combinar refactoring y patterns.
- **Clean Agile** (Robert C. Martin, 2019). Agile desde la escuela de clean code.

### Funcional

- **Functional Programming in Scala** (Paul Chiusano, Runar Bjarnason, 2014). FP puro.
- **Domain Modeling Made Functional** (Scott Wlaschin, 2018). FP para DDD.
- **Functional Programming, Head First** (Eric Freeman, 2017).

### Testing

- **Test-Driven Development** (Kent Beck, 2002). El libro de TDD.
- **Growing Object-Oriented Software, Guided by Tests** (Steve Freeman, Nat Pryce, 2009).
- **Unit Testing** (Vladimir Khorikov, 2020). Principios y patrones.

### Otros libros del autor

- **Clean Code Cookbook** (Maximiliano Contieri, 2023+). Este libro.
  - El blog del autor: https://maximilianocontieri.com/

## Recursos online

### Blogs

- **Martin Fowler**: https://martinfowler.com/.
- **Robert C. Martin**: https://blog.cleancoder.com/.
- **Maximiliano Contieri**: https://maximilianocontieri.com/.
- **Refactoring Guru**: https://refactoring.guru/. Catálogo visual de refactorings.

### Newsletters

- **Refactoring** (de Contieri): newsletter semanal.
- **The Pragmatic Engineer**: https://newsletter.pragmaticengineer.com/.

### Comunidades

- **Software Design subreddit**: https://www.reddit.com/r/SoftwareDesign/.
- **HackerNews**: https://news.ycombinator.com/ (discusión sobre clean code).
- **Clean Coders**: https://cleancoders.com/ (vídeos de Robert C. Martin).

### Conferencias

- **Crafted Design**: conferencias sobre diseño.
- **GOTO**: conferencias generales.
- **DDD Europe**: conferencia de Domain-Driven Design.

## Conceptos para profundizar

### Los cinco principios SOLID

- **SRP (Single Responsibility)**: una clase, una razón para cambiar.
- **OCP (Open/Closed)**: abierto a extensión, cerrado a modificación.
- **LSP (Liskov Substitution)**: subtipos deben sustituir a tipos padre.
- **ISP (Interface Segregation)**: interfaces pequeñas y específicas.
- **DIP (Dependency Inversion)**: depender de abstracciones.

### GRASP

- **Information Expert**: el que tiene la info, hace el trabajo.
- **Creator**: la clase A crea B si A contiene B, registra B, usa B, etc.
- **Controller**: recibe las requests del sistema.
- **Low Coupling**: minimizar dependencias.
- **High Cohesion**: maximizar cohesión dentro de un módulo.
- **Polymorphism**: el comportamiento depende del tipo.
- **Pure Fabrication**: crear clases que no corresponden al dominio.
- **Indirection**: intermediarios para desacoplar.
- **Protected Variations**: encapsular variaciones.

### Los principios del libro de Contieri

- **MAPPER**: el software debe mapear el dominio.
- **Behavior over data**: los objetos tienen comportamiento.
- **Tell, don't ask**: el objeto hace, no expone.
- **Encapsulation**: el estado está protegido.
- **YAGNI**: no añadas antes de necesitar.

## Ruta de profundización

### Si vienes de cero

1. **Clean Code** (Martin). El libro fundamental.
2. **Refactoring** (Fowler). El catálogo de refactorings.
3. **Domain-Driven Design** (Evans). Cómo modelar el dominio.
4. **Clean Code Cookbook** (Contieri). El cookbook para aplicar.
5. **Clean Architecture** (Martin). Cómo estructurar sistemas.

### Si ya tienes experiencia

1. **Object-Oriented Software Construction** (Meyer). El clásico.
2. **Domain-Driven Design Distilled** (Vernon). DDD condensado.
3. **Implementing Domain-Driven Design** (Vernon). DDD aplicado.
4. **Refactoring to Patterns** (Kerievsky). Combinar ambos.
5. **Functional Programming in Scala** (Chiusano). FP para DDD.

### Si quieres ir más allá

1. **Modern Software Engineering** (Dave Farley). Ingeniería moderna.
2. **A Philosophy of Software Design** (John Ousterhout). Complejidad.
3. **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani). Trade-offs.
4. **Fundamentals of Software Architecture** (Ford, Richards). Para una visión amplia.

## Próximos pasos

- [[08-epilogo-y-claves|Epílogo y claves]]: cierre de la wiki. Las ideas recurrentes y cómo seguir aplicando las recetas.
