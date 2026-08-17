---
title: "Epílogo y claves"
description: "Cierre de la wiki de DDIA: las ideas recurrentes, las claves para diseñar sistemas de datos y cómo seguir profundizando"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, epilogo, cierre, claves]
---

# Epílogo y claves

> [!abstract] Resumen
> Cierre de la wiki sobre *Designing Data-Intensive Applications* de Martin Kleppmann y Chris Riccomini. Recopila las ideas recurrentes que aparecen a lo largo de las notas, ofrece una base para tomar decisiones de diseño y propone rutas de profundización.

## La postura del libro

DDIA no es un libro de **cómo usar** una tecnología específica. Es un libro de **cómo pensar** sobre los sistemas de datos. La postura de los autores es deliberadamente:

- **Independiente del proveedor**: no enseña Postgres, Kafka o Snowflake. Enseña qué hacen, por qué, y con qué trade-offs.
- **Honesta sobre los trade-offs**: cada decisión tiene un coste. El libro señala cuáles.
- **Histórica**: explica cómo llegamos hasta aquí, no solo cómo están las cosas.
- **Pragmática**: el book se ocupa de problemas reales, no de elegancia teórica.

> [!quote] "It depends."
> La respuesta corta del libro a casi cualquier pregunta técnica. La respuesta larga es entender los trade-offs.

## Las ideas recurrentes

A lo largo de las 20 notas anteriores, hay ideas que se repiten con insistencia. Las recopilo aquí como motivo de cierre.

### 1. Los datos son el centro

Los sistemas modernos giran en torno a los datos. La arquitectura, la escalabilidad, la operabilidad, la seguridad, las decisiones éticas: todo se decide en función de los datos.

### 2. Cada decisión es un trade-off

**No hay respuestas universales**. Latencia, throughput, consistencia, coste, complejidad operativa: cada diseño hace un trade-off distinto. La tarea del ingeniero es **identificar el trade-off**, **evaluar** cuál pesa más, **decidir** con criterio.

### 3. La distribución es un coste, no un beneficio

Distribuir añade complejidad. Solo se distribuye cuando la escala excede lo que un solo servidor puede manejar. Antes de añadir nodos, veamos si un servidor potente o una optimización de queries basta.

### 4. Operacional vs analítico son cosas distintas

Mezclar cargas transaccionales con consultas analíticas en la misma base es la fuente de muchos problemas. La separación entre **OLTP** y **OLAP** es la primera decisión de arquitectura.

### 5. Los datos de record son insustituibles

Los datos de record (system of record) son la fuente de verdad. Los datos derivados (índices, caches, vistas) se pueden regenerar. Trátalos con la seriedad que merecen: **backups, inmutabilidad, audits**.

### 6. El modelo de datos condiciona todo

La elección entre relacional, documental, grafo o vectorial no es solo técnica: **determina cómo piensas sobre el problema**. Cambiar el modelo es cambiar la aplicación.

### 7. Replication es para disponibilidad y escala

Replicar tiene un precio: storage, ancho de banda, complejidad. Solo se replica lo que **vale la pena**.

### 8. Sharding es la respuesta a datasets grandes

Cuando los datos no caben en un servidor, se shardean. La elección entre range, hash, hash consistente es un trade-off entre range queries y uniformidad.

### 9. Las transacciones son garantías, no características

Las transacciones ACID ofrecen **garantías**. Sin ellas, las invariantes del negocio se rompen. La elección de qué nivel de aislamiento usar es un trade-off entre consistencia y throughput.

### 10. Los sistemas distribuidos son unreliable por naturaleza

Los nodos caen. Las redes se caen. Los mensajes se pierden. Si el diseño no asume esto, el sistema falla. **Asume partial failures.**

### 11. Los relojes son imprecisos

NTP no basta para ordenación. Para ordenación, usa **monotonic clocks** o **logical clocks** (Lamport, vector clocks).

### 12. Consensus es caro pero poderoso

Paxos, Raft son los algoritmos que permiten acuerdo distribuido. Son lentos y complejos, pero abren puertas que de otra forma están cerradas.

### 13. Batch y stream son complementarios

Batch para análisis masivos, stream para tiempo real. La arquitectura moderna usa ambos.

### 14. Los datos derivados son la complejidad

Los datos derivados (índices, caches, materialized views) son fáciles de añadir y difíciles de mantener. Sin lineage, son imposibles de debuggear.

### 15. Los sistemas no son neutrales

Los datos codifican valores. Las decisiones técnicas son decisiones morales. Reconocerlo es el primer paso para diseñar con responsabilidad.

## Claves para tomar decisiones

El libro no da recetas, pero ofrece **marcos** de decisión. Para tomar una decisión de arquitectura, el libro recomienda:

### 1. Identifica los trade-offs en juego

Antes de elegir, hazte:

- ¿Qué **propiedades** estoy optimizando?
- ¿Qué **propiedades** estoy sacrificando?
- ¿Quién decide cuáles pesan más?

### 2. Define los requisitos en números

Sin números, las decisiones son slogans. Define:

- **Latencia**: p50, p95, p99.
- **Throughput**: QPS, MB/s.
- **Disponibilidad**: 99.9% vs 99.99%.
- **Coste**: $/mes, $/request.

### 3. Empieza simple, escala solo si hace falta

La regla de oro: **monolito primero, microservicios después**. Single-node primero, distribuido después. Síncrono antes que asíncrono.

### 4. Diseña para la operación

El sistema que se opera bien es mejor que el sistema teóricamente óptimo pero inoperable. La **operabilidad** es la dimensión más subestimada.

### 5. Asume partial failures

En un sistema distribuido, los fallos son parciales. Las defensas son obligatorias: timeouts, retries, circuit breakers, idempotency keys.

### 6. Versiona todo

Datos, esquemas, código, modelos, dashboards. Sin versionado, no puedes revertir.

### 7. Mide y observa

Sin métricas, estás volando a ciegas. Invierte en observabilidad desde el día uno.

## Patrones a evitar

El libro señala patrones que **parecen** buenas pero **no lo son**:

- **Avoid premature distribution**: añade nodos solo cuando lo necesitas.
- **Avoid premature optimization**: mide antes de optimizar.
- **Avoid premature microservices**: monolito modular primero.
- **Avoid "best practices" without context**: cada situación es distinta.
- **Avoid "AI will solve it"**: la IA no arregla los problemas fundamentales.

## Cómo seguir aprendiendo

DDIA es un libro que **se relee**. Cada vez que tienes un proyecto nuevo, vuelves a las notas pertinentes y aparecen matices nuevos.

### Ruta de profundización

Si quieres profundizar en un área concreta:

1. **Relacional/SQL**: *SQL and Relational Theory* (C.J. Date).
2. **NoSQL/distribuido**: *Database Internals* (Alex Petrov).
3. **Stream processing**: *Kafka: The Definitive Guide* + *Flink* documentation.
4. **Consensus**: el paper de Raft, *Paxos Made Simple*.
5. **Ética**: *Weapons of Math Destruction* (Cathy O'Neil).

### Ruta práctica

Si quieres **construir** algo:

1. **Crea una aplicación pequeña** con Postgres + Redis.
2. **Añade un message broker** (Kafka en modo simple).
3. **Escala** a tres nodos.
4. **Añade un caso de uso** de stream.
5. **Rompe cosas** con chaos engineering.

### Ruta de comunidad

Únete a comunidades:

- **Hacker News**: https://news.ycombinator.com/
- **r/dataengineering**: subreddit activo.
- **Confluent Community**: eventos y foros sobre Kafka.
- **Postgres slack**: usuarios expertos.

## La pregunta que importa

El libro termina con una pregunta que organiza el resto:

> "Cuando diseñes un sistema, ¿estás satisfaciendo una necesidad real o estás alardeando de tu conocimiento?"

```text
La pregunta:

  - ¿El sistema resuelve un problema?
  - ¿Es simple?
  - ¿Es fiable?
  - ¿Es mantenible?
  - ¿Es ético?

Si alguna respuesta es no, replantea.
```

## Próximos pasos con esta wiki

Con esta wiki completa, las direcciones naturales desde aquí son:

- **Usarla como referencia**: cuando un problema aparezca, busca en las notas pertinentes.
- **Volver** a las notas que te interesen. La relectura produce nuevas conexiones.
- **Construir** algo. La mejor forma de fijar el conocimiento es aplicarlo.
- **Enseñar** a otros. Explicar lo aprendido revela huecos.
- **Criticar** la selección. El libro es parcial; tu lectura debe serlo también.

Y, sobre todo: **la mejor forma de aprender sistemas de datos es construyendo**. Leer es el primer paso; diseñar e implementar es el camino.
