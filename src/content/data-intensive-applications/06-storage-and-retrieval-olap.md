---
title: "Storage and retrieval (OLAP)"
description: "El lado analítico: data warehouses, almacenamiento columnar, materialized views, búsqueda full-text y vector embeddings"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, olap, warehouse, columnar, materialized-view, full-text, vector]
---

# Storage and retrieval (OLAP)

> [!abstract] Resumen
> Las bases de datos OLTP están optimizadas para transacciones. Los **data warehouses** están optimizados para análisis: consultas grandes sobre muchos datos. Esta nota cubre el almacenamiento columnar, las materialized views, los data cubes, la búsqueda full-text y los embeddings vectoriales.

## OLTP vs OLAP en el almacenamiento

El libro insiste en la distinción:

- **OLTP**: pocas filas por query, baja latencia, muchas transacciones.
- **OLAP**: muchas filas por query, latencia tolerable, pocas consultas pero pesadas.

El **almacenamiento** debe adaptarse a cada caso:

```text
OLTP (Postgres, MySQL):
  Filas completas en disco, leídas enteras.
  B-tree o LSM-tree.
  Optimizado para transacciones.

OLAP (BigQuery, Snowflake, Redshift):
  Columnas en bloques separados, lectura selectiva.
  Compresión columnar.
  Optimizado para agregaciones.
```

## Data warehousing

El patrón **ETL/ELT** introduce un contenedor separado para análisis:

```text
                        ┌─────────────────┐
OLTP  ──── ETL/ELT ────►│  DATA WAREHOUSE │──── BI / Reporting
                        └─────────────────┘
```

### ¿Por qué separar?

- **Rendimiento**: las consultas analíticas sobre OLTP degradan las transacciones.
- **Coste**: diferentes tipos de almacenamiento son más baratos en su caso de uso.
- **Esquema**: el warehouse puede ser desnormalizado (star schema) sin afectar la fuente.

### Star schema

El patrón dominante: una **tabla de hechos** central con **dimensiones** alrededor.

```text
Estrella (star schema):

       ┌─────────┐
       │ Customers│
       └────┬────┘
            │
            ▼
   ┌──────────────┐
   │   Sales      │  ← tabla de hechos
   │ (fecha, cli, │     (muchas filas)
   │  producto, $)│
   └──────┬───────┘
            │
   ┌────────┼────────┐
   ▼        ▼        ▼
┌─────┐  ┌─────┐  ┌─────┐
│Dates│  │Stores│ │Products│  ← dimensiones
└─────┘  └─────┘  └─────┘
```

> [!tip] Denormalización controlada
> El star schema es la **excepción** a la normalización: es deliberadamente desnormalizado para hacer las consultas **más fáciles y rápidas**.

## Almacenamiento columnar

El libro dedica mucho espacio al almacenamiento **columnar** porque es la clave de los warehouses modernos.

### Concepto

En lugar de guardar **filas** completas, guarda cada **columna** en un archivo separado.

```text
Almacenamiento por filas (OLTP):
┌────────────────────────────────────────┐
│ id=1, name="Ana", age=30, city="Madrid"│
│ id=2, name="Bob", age=25, city="Barca" │
└────────────────────────────────────────┘

Almacenamiento por columnas (OLAP):
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ids:     │  │ names:   │  │ cities:  │
│ 1, 2, 3  │  │ Ana, Bob │  │ Madrid,  │
│          │  │          │  │ Barcelona│
└──────────┘  └──────────┘  └──────────┘
```

### Ventajas

- **Lectura selectiva**: si la query solo necesita 3 columnas de 50, no carga las otras 47.
- **Compresión**: las columnas tienen valores similares → alta compresión.
- **Agregaciones rápidas**: SUM, AVG, COUNT sobre una columna se calculan sin tocar las otras.

### Codificación de columnas

El libro describe varias técnicas de encoding:

**Run-length encoding (RLE)**:

```text
Original: [Madrid, Madrid, Madrid, Barcelona, Madrid]
RLE:      Madrid x 3, Barcelona x 1, Madrid x 1
```

**Bitmap encoding**:

```text
country ∈ {Spain, France, Italy, Germany}:
Spain:   1 0 0 1 0 0 1 0 1 0 1
France:  0 0 1 0 1 0 0 0 0 1 0
Italy:   0 1 0 0 0 1 0 1 0 0 0
Germany: 0 0 0 0 0 0 0 0 0 0 0
```

**Dictionary encoding**:

```text
countries = {Madrid, Barcelona, Valencia}
rows:      [1, 2, 1, 3, 1]   ← índices al diccionario
```

> [!tip> La compresión es clave
> En warehouses, la compresión **multiplica** el rendimiento efectivo. Menos datos a leer = menos I/O = menos latencia.

## Materialized views

Las **materialized views** son queries pre-computadas. A diferencia de las vistas normales, **se almacenan físicamente**.

```sql
-- Vista materializada en Postgres
CREATE MATERIALIZED VIEW daily_sales AS
SELECT
    date_trunc('day', created_at) AS day,
    SUM(amount) AS total,
    COUNT(*) AS num_orders
FROM orders
GROUP BY day;
```

### Trade-offs

- **Ventaja**: queries son instantáneas (solo leer la vista).
- **Desventaja**: los datos pueden quedar **stale** si la fuente cambia.
- **Solución**: refrescar la vista periódicamente (`REFRESH MATERIALIZED VIEW`) o usar **incremental updates**.

```text
Vista materializada:

    OLTP (orders) ──── cambios ────►
                                       ▼
              REFRESH MATERIALIZED VIEW
                                       ▼
                            daily_sales (físico)
```

## Data cubes

Una **OLAP cube** es la pre-computación de todas las agregaciones posibles de un conjunto de dimensiones.

```text
Cube (tiempo, producto, geografía):

                Geografía
                    │
        ┌───────────┼───────────┐
   Tiempo│           │           │
        │   Total   │   Total   │
        │   Madrid  │  Cataluña │
        │           │           │
   Tiempo│   Total  │   Total  │
        │   Sevilla │  Andalucía
        └───────────┴───────────┘
                    │
              Producto
```

Cada celda del cubo es una agregación pre-calculada. Los queries son instantáneos. El coste: el cubo crece **exponencialmente** con las dimensiones.

> [!warning] Olap cubes son costosos
> Un cubo con 10 dimensiones y 10 valores por dimensión tiene 10^10 celdas. Por eso los cubos se usan solo con pocas dimensiones.

## Búsqueda full-text

El libro cierra la sección de almacenamiento cubriendo la **búsqueda full-text**.

### Lucene y derivados

El motor de búsqueda más popular es **Apache Lucene** (y sus derivados Elasticsearch, Solr, OpenSearch).

```text
Índice invertido:

Documento 1: "El gato come pescado"
Documento 2: "El perro come carne"
Documento 3: "El gato duerme"

Índice:
"gato"   → [documento 1, documento 3]
"perro"  → [documento 2]
"come"   → [documento 1, documento 2]
"pescado"→ [documento 1]
"carne"  → [documento 2]
"duerme" → [documento 3]
```

### Búsqueda

```sql
-- Buscar documentos que contengan "gato" y "come"
SELECT doc_id FROM inverted_index
WHERE term IN ('gato', 'come')
GROUP BY doc_id
HAVING COUNT(DISTINCT term) = 2;
```

### Fuzzy search

Lucene permite búsqueda aproximada (typos):

```text
"gato" busca también:
- "pato" (1 edición)
- "pito" (1 edición)
- "gatos" (prefijo)
```

> [!tip> Elasticsearch no es solo búsqueda
> Elasticsearch se ha convertido en un almacén de datos **general** para casos que no encajan en una base relacional. Logs, métricas, eventos, todo cabe.

## Vector embeddings

La sección moderna del libro cubre los **vector embeddings** y la **búsqueda por similitud**.

### Embeddings

Un embedding es una **representación vectorial densa** de un texto (o imagen, audio, etc.). Los LLM y modelos de visión producen embeddings.

```text
Embedding:
"El gato come" → [0.12, -0.34, 0.56, ..., 0.78]  (768 dim)
"El perro come" → [0.11, -0.32, 0.54, ..., 0.76]  (muy similar)
"El coche rojo" → [0.89, 0.12, -0.45, ..., 0.21]  (diferente)
```

### Búsqueda por similitud

```sql
-- Pseudocódigo
SELECT text, embedding
FROM documents
ORDER BY embedding <-> query_embedding  -- distancia coseno
LIMIT 10;
```

### Bases de datos vectoriales

- **pgvector** (Postgres): añade tipo vector y búsqueda ANN.
- **Pinecone**: especializada, comercial.
- **Weaviate**: open-source, con módulos.
- **Milvus**: open-source, alto rendimiento.
- **Qdrant**: open-source, moderna.
- **Chroma**: pensada para AI apps.

> [!note> Embeddings, no SQL
> La búsqueda vectorial **no es búsqueda exacta**. Es búsqueda **aproximada** (ANN, Approximate Nearest Neighbors). Hay un trade-off entre precisión y velocidad.

## HNSW y la búsqueda ANN

El libro introduce los algoritmos de búsqueda ANN:

- **HNSW** (Hierarchical Navigable Small World): grafos多层.
- **IVF** (Inverted File): particiones del espacio.

```text
HNSW (simplificado):

Capa 3: ●─────────●─────────● (saltos largos)
         │         │         │
Capa 2: ●───●─────●───●─────● (saltos medios)
         │   │     │   │     │
Capa 1: ●─●─●─●─●─●─●─●─●─● (saltos cortos)
```

## ETL y ELT modernos

El libro finaliza con los patrones modernos de carga:

- **ETL**: extract → transform → load (transformación previa).
- **ELT**: extract → load → transform (transformación en el warehouse).
- **Streaming ETL**: los datos van directamente del stream al warehouse.

```text
Patrón moderno:

Producer event ──► Kafka ──► Flink ──► BigQuery
                  (log)      (stream)    (warehouse)
```

## Resumen en tres frases

- El **almacenamiento columnar** es la clave de los data warehouses modernos: lectura selectiva, compresión, agregaciones rápidas.
- Las **materialized views** y los **OLAP cubes** sacrificar consistencia por velocidad de consulta.
- Los **vector embeddings** añaden una nueva dimensión a la búsqueda: encontrar documentos por **significado**, no por coincidencia de texto.

## Próximos pasos

- [[07-encoding-and-evolution|Encoding and evolution]]: cómo se **codifican** los datos para que viajen entre servicios. JSON, Protobuf, Avro y los patrones de dataflow que los usan.
