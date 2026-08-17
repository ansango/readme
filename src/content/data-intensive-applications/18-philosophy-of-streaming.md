---
title: "Philosophy of streaming systems"
description: "La integración de datos, el unbundling de las bases de datos, los trade-offs entre correctness, freshness y maintainability. La filosofía de diseñar sistemas modernos"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, filosofia, integracion, derived-data, observability]
---

# Philosophy of streaming systems

> [!abstract] Resumen
> La 2ª edición del libro añade este capítulo (totalmente nuevo) que reflexiona sobre la **filosofía** subyacente a los sistemas modernos de datos. Cubre la integración como problema central, el "unbundling" de las bases de datos, los trade-offs entre correctness, freshness y maintainability, y los principios de diseño.

## ¿Por qué un capítulo de filosofía?

El libro reconoce que la 1ª edición era muy **pragmática**: describía qué hacen los sistemas. La 2ª añade este capítulo para discutir **por qué**.

> [!quote] "Construir un sistema de datos es, sobre todo, decidir qué tradeoff quieres."
> El libro eleva las decisiones de diseño a una **discusión filosófica**: no son solo técnicas, son éticas.

## Data integration

El libro arranca con **el problema de la integración de datos** como uno de los más subestimados.

```text
El problema:

  Servicio A: tabular format
  Servicio B: JSON format
  Servicio C: Parquet format
  Servicio D: Avro format
  ...

  ¿Cómo consultar datos de los cuatro?
```

### Por qué es difícil

- **Esquemas incompatibles**.
- **Identificadores distintos** para el mismo concepto.
- **Latencias** distintas (real-time, batch).
- **Calidades** distintas (autoritativos, derivados).

> [!tip> El solapamiento semántico es el verdadero enemigo
> No es el **schema mismatch** (que se arregla con transformaciones). Es cuando dos servicios definen **user_id** de forma distinta. Eso es un problema **organizativo**, no técnico.

## Composing data storage technologies

El libro describe la **composición** de bases de datos:

```text
Sistema moderno:

┌─────────────────┐
│  OLTP DB        │
│  (Postgres)     │
└────────┬────────┘
         │ CDC
         ▼
┌─────────────────┐
│  Event log      │
│  (Kafka)        │
└────────┬────────┘
         │
         ├────► Search index (Elasticsearch)
         ├────► Read replica (Redis)
         ├────► Cache (Memcached)
         ├────► Feature store (ML)
         ├────► Analytics (BigQuery)
         └────► Dashboard (Tableau)
```

> [!note> Cada subsistema tiene una especialidad
> Redis es rápido pero volatile. Postgres es consistente pero lento. Elasticsearch es bueno para búsqueda. Cada uno hace **una cosa bien**.

## Unbundling databases

El libro describe la **separación** de las responsabilidades que antes estaban juntas en una sola base:

```text
Base tradicional (todo junto):

  - Storage
  - Replication
  - Sharding
  - Query engine
  - Cache
  - Indexes
  - Concurrency control

Base moderna (separado):

  - Storage: S3, GCS
  - Replication: Kafka
  - Sharding: Service
  - Query: Trino, Presto
  - Cache: Redis
  - Indexes: Elasticsearch
  - Concurrency: FoundationDB
```

> [!tip> El unbundling es la tendencia
> Las "modern data stacks" reflejan esta separación. Snowflake, Databricks, Confluent, etc. son **componentes especializados**, no suites monolíticas.

## Derived data

El libro insiste en la **importancia de los datos derivados**:

```text
Tipos de datos:

  - Source of truth (datos de record)
  - Derived data (vistas, índices, caches)
  - Aggregated data (reportes, dashboards)
```

### Por qué importa

Los **datos derivados** son la razón principal por la que los sistemas modernos son **complejos**:

```text
Decisiones:

  - ¿Qué datos derivados mantener?
  - ¿Cómo invalidarlos?
  - ¿Cómo mantener la consistencia?
  - ¿Cuándo recargar?
```

## Observing derived state

El libro dedica un bloque a la **observabilidad** de los datos derivados:

```text
Observabilidad:

  - ¿De dónde vienen estos datos?
  - ¿Cuándo se actualizaron?
  - ¿Qué lógica los calcula?
  - ¿Qué upstream afecta?
```

### Lineage

El **lineage** es la trazabilidad de los datos:

```text
Lineage:

  upstream_table_1
     │
     ▼
  transform_v3
     │
     ▼
  transform_v7
     │
     ▼
  derived_table
```

> [!tip> Sin lineage, no hay debugging
> El libro es claro: los sistemas de datos sin lineage son **imposibles de debuggear**. Tools como DataHub, Marquez, OpenLineage implementan esta idea.

## Correctness

El libro introduce un modelo de **correctness** que va más allá de "consistency":

```text
Correctness:

  - Internal consistency: no contradicciones internas.
  - External consistency: consistente con el mundo real.
  - Temporal consistency: el estado refleja el momento correcto.
```

### Por qué es difícil

- **Sistema distribuido**: no hay un "ahora" global.
- **Datos derivados**: la propagación tiene latencia.
- **Eventos desordenados**: el orden importa.

## Aiming for correctness

El libro describe los **objetivos** de un sistema de datos:

```text
Goals:

  - Correctness: los datos son correctos.
  - Freshness: los datos están actualizados.
  - Throughput: procesar muchos datos.
  - Latency: respuesta rápida.
  - Maintainability: fácil de cambiar.
```

### Trade-offs

El libro es explícito: **no se puede tener todo**.

```text
Trade-offs:

  Alta Freshness ──► recompute todo rápido: cost.
  Alta Correctness ──► validar mucho: cost.

  Alta Throughput ──► esquema simple: cost en features.
  Alta Latency baja ──► decisiones precipitadas: cost en accuracy.
```

> [!tip> El "end-to-end argument" en datos
> El libro recoge un principio de la ingeniería de redes: el **end-to-end argument**. Las garantías se aplican en los **extremos**, no en el medio. Para datos, eso se traduce en: **no intentes garantizar correctness en cada paso, garantiza correctness del conjunto**.

## The end-to-end argument for databases

El libro aplica el principio **end-to-end** a los datos:

```text
End-to-end argument:

  No intentes:
    - Hacer cada capa idempotente.
    - Garantizar consistency en cada hop.

  Haz:
    - El sistema completo es idempotente.
    - El sistema completo es consistente.
```

### Ejemplo

```text
Sistema de pagos:

  Servicio A: registra el pago (puede fallar)
  Servicio B: envía el recibo (puede fallar)
  Servicio C: actualiza el saldo (puede fallar)

  Solución incorrecta: cada paso hace su propia garantía.
  Solución correcta: idempotency keys + retries.
```

## Enforcing constraints

El libro describe los mecanismos de **enforcement** de invariantes:

### 1. Where to enforce

```text
¿Dónde poner las constraints?

  - En el cliente (cada servicio valida).
  - En el servidor (la base valida).
  - En el broker (Kafka Schema Registry).
  - En el stream processor (comprobaciones).
```

### 2. What to enforce

```text
Constraints:

  - Tipos de datos.
  - Rangos de valores.
  - Unicidad.
  - Referencias (foreign keys).
  - Orden de eventos.
```

### 3. How to enforce

```text
Mechanisms:

  - Schema (Avro, Protobuf).
  - Schema Registry (validación central).
  - Tests (CI/CD).
  - Monitoring (en producción).
```

## Timeliness and integrity

El libro introduce la diferencia entre **timeliness** (freshness) e **integridad** (correctness):

```text
Timeliness:    los datos están actualizados.
Integrity:     los datos son correctos.

Sistema timely pero no integrity:
  Recién actualizado, pero con datos viejos todavía.

Sistema integrity pero no timely:
  Correcto, pero desactualizado hace 1 hora.
```

> [!tip> El libro propone un framework
> El "timeliness and integrity" framework mide **cuánto tarda** un sistema en volverse correcto tras un cambio.

## Trust, but verify

El libro cierra con un principio de diseño:

> [!quote] "Trust, but verify."
> El libro recoge una frase de Reagan. En sistemas de datos: **confía en tus asunciones, pero verifica que se cumplan**.

```text
Verifications:

  - Asserts en código.
  - Tests en CI.
  - Sanity checks en producción.
  - Reconciliación periódica.
  - Alerts cuando algo se desvía.
```

> [!note> El libro es optimista
> Después de ocho capítulos técnicos densos, el libro termina **optimista**. Diseñar sistemas de datos es difícil, pero es un arte que se aprende. La clave es la **disciplina** y la **humildad** ante la complejidad.

## Resumen en tres frases

- La **integración de datos** es más organizativa que técnica. El coste real es alinear personas, identidades y definiciones.
- El **unbundling** de las bases de datos tradicionales es la tendencia: cada sistema hace una cosa bien.
- El **end-to-end argument** aplicado a datos: las garantías se aplican en los extremos, no en cada paso.

## Próximos pasos

- [[19-doing-the-right-thing|Doing the right thing]]: ética y sociedad. Bias en predictive analytics, privacidad, surveillance, legislación. El lado humano de los datos.
