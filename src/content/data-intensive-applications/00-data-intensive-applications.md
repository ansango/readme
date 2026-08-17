---
title: "Designing Data-Intensive Applications"
description: "Índice de la wiki de DDIA 2nd ed: los principios detrás de los sistemas de datos fiables, escalables y mantenibles, basada en el libro de Martin Kleppmann y Chris Riccomini (O'Reilly, 2026)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [arquitectura, sistemas-distribuidos, datos, ddia, kleppmann]
---

# Designing Data-Intensive Applications

> [!abstract] Resumen
> Esta wiki toma como guía *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems* (Martin Kleppmann y Chris Riccomini, O'Reilly, 2ª edición de febrero de 2026). Es uno de los manuales de referencia para diseñar **sistemas de datos** modernos: bases de datos, caches, message brokers, sistemas de búsqueda, data warehouses, pipelines batch y stream. Las notas destilan los principios que hay detrás de las decisiones, no las herramientas específicas.

## Acerca del libro

La primera edición de DDIA (2017) se convirtió rápidamente en el libro de cabecera de cualquier persona que construya sistemas de datos. La autora del prefacio, Ileana Puiu, lo define como "una brújula para el paisaje de los datos modernos". La 2ª edición de 2026, coescrita con Chris Riccomini, mantiene el espíritu pero renueva el contenido:

- Cubre los **fundamentos** que no han cambiado (transacciones, replicación, consenso).
- Renueva los capítulos sobre **cloud** y **arquitectura distribuida**.
- Añade **dos capítulos nuevos** sobre la **filosofía de los sistemas de streaming** y la **ética de los datos**.
- Cubre el auge de **AI/ML** pipelines y las implicaciones de los datos como insumo de modelos.

> [!quote] "It depends."
> La respuesta corta del libro a casi cualquier pregunta técnica. La respuesta larga es entender los trade-offs que hay detrás de cada decisión: "It depends on what you're optimizing for."

El libro es deliberadamente **independiente de proveedor**: no enseña a usar PostgreSQL, Kafka o Snowflake, sino a **entender** qué hacen esas herramientas y por qué. Esa es la diferencia entre un operador y un ingeniero.

## Quién debería leer esta wiki

- **Software engineers** que necesitan tomar decisiones de arquitectura de datos.
- **Data engineers** que quieren entender los principios detrás de las herramientas que usan.
- **Tech leads** que evalúan trade-offs entre Postgres, MongoDB, Cassandra, DynamoDB.
- **Preparadores de entrevistas** de system design.

## Cómo leer esta wiki

Las notas siguen el orden del libro. Cada capítulo está partido en una o dos notas según la densidad del contenido:

- **Capítulos 1, 2, 5, 7, 10, 11, 13, 14** → una sola nota (contenido cohesivo).
- **Capítulos 3, 4, 6, 8, 9** → dos notas por capítulo (split por bloque temático).

Cada nota arranca con un `[!abstract]`, sigue con H2/H3, usa **callouts** solo cuando aportan (`tip`, `note`, `warning`, `danger`, `question`, `example`, `info`), incluye **diagramas ASCII o Mermaid** cuando simplifican un concepto, ejemplos de **SQL o pseudocódigo** cuando es necesario, y cierra con `## Próximos pasos` enlazando a la siguiente nota.

## Bloques temáticos

### Fundamentos y requisitos

- [[01-trade-offs-in-data-systems|Trade-offs in data systems architecture]]: el capítulo que enmarca todo. Operacional vs analítico, data warehousing, cloud vs self-hosting, single-node vs distribuido.
- [[02-nonfunctional-requirements|Defining nonfunctional requirements]]: cómo decidir qué quiere decir "rápido", "fiable", "escalable" y "mantenible" en tu caso concreto.

### Modelos de datos y almacenamiento

- [[03-data-models-relational-vs-document|Data models: relacional vs documento]]: el debate clásico, el object-relational mismatch, la normalización.
- [[04-data-models-graph-y-triple-stores|Data models: grafos y triple stores]]: cuando el modelo relacional no encaja, las alternativas para datos muy conectados.
- [[05-storage-and-retrieval-oltp|Storage and retrieval (OLTP)]]: cómo se almacenan los datos en disco. Log-structured, B-trees, LSM-trees, índices secundarios.
- [[06-storage-and-retrieval-olap|Storage and retrieval (OLAP)]]: cómo se almacenan los datos para análisis. Data warehouses, columnar, materialized views, búsqueda full-text, vector embeddings.

### Codificación y replicación

- [[07-encoding-and-evolution|Encoding and evolution]]: los formatos de datos (JSON, Protobuf, Avro) y los modos de dataflow que los usan.
- [[08-replication-single-leader|Replication: single-leader]]: la estrategia más común de replicación. Replication log, synchronous vs asynchronous, lag.
- [[09-replication-multi-leader-leaderless|Replication: multi-leader y leaderless]]: las estrategias más exóticas y los retos que resuelven.

### Distribución y consistencia

- [[10-sharding|Sharding]]: cómo partir los datos entre nodos. Estrategias, request routing, secondary indexes.
- [[11-transactions-isolation|Transactions: isolation]]: ACID, isolation levels, read phenomena, serializability.
- [[12-transactions-distributed|Transactions: distributed]]: 2PC, XA, exactly-once semantics.
- [[13-distributed-systems-faults|The trouble with distributed systems: faults y redes]]: por qué las redes fallan, TCP, timeouts, partial failures.
- [[14-distributed-systems-clocks|The trouble with distributed systems: clocks y conocimiento]]: reloj monotónico, sincronización, process pauses, knowledge.
- [[15-consistency-and-consensus|Consistency and consensus]]: linearizability, ID generators, consenso (Paxos, Raft).

### Procesamiento de datos

- [[16-batch-processing|Batch processing]]: Unix tools, MapReduce, Dataflow engines.
- [[17-stream-processing|Stream processing]]: event streams, messaging, change data capture, joins en streaming.
- [[18-philosophy-of-streaming|Philosophy of streaming systems]]: data integration, unbundling databases, derived state, observability.

### Cierre y ética

- [[19-doing-the-right-thing|Doing the right thing]]: ética, predictive analytics, bias, privacy, surveillance.
- [[20-glosario-y-referencias|Glosario y referencias]]: glosario del libro, bibliografía, lecturas recomendadas.
- [[21-epilogo-y-claves|Epílogo y claves]]: cierre + ideas recurrentes + cómo seguir.

## Temas transversales

> [!tip] Tres ejes que aparecen una y otra vez
> A lo largo del libro y de la wiki hay tres preguntas que vertebran todas las decisiones:
> 1. **¿Qué garantiza este sistema?** → consistency, isolation, durability.
> 2. **¿Cómo escala?** → replication, sharding, caching, asynchronous processing.
> 3. **¿Cómo se mantiene?** → operabilidad, simplicidad, evolvability.
>
> Si una decisión de diseño no mejora alguna de esas tres dimensiones, probablemente no merece la complejidad añadida.

## Próximos pasos

- [[01-trade-offs-in-data-systems|Trade-offs in data systems architecture]]: por qué no hay respuestas universales y cómo se enmarcan las decisiones en este libro.
