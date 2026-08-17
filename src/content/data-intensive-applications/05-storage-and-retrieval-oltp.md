---
title: "Storage and retrieval (OLTP)"
description: "Cómo se almacenan los datos en disco: log-structured, B-trees, LSM-trees, índices secundarios y por qué cada algoritmo favorece distintos patrones de carga"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, almacenamiento, b-tree, lsm-tree, olap, indexing]
---

# Storage and retrieval (OLTP)

> [!abstract] Resumen
> Una base de datos es, en el fondo, una estructura de datos que **persiste** en disco y responde consultas. Esta nota cubre los algoritmos de almacenamiento y recuperación que dominan las bases de datos modernas: **log-structured** (LSM-trees), **B-trees**, índices secundarios y las implicaciones operativas de cada opción.

## Por qué importa el almacenamiento

El libro abre con la observación más simple y más profunda: las bases de datos gastan la mayor parte del tiempo moviendo datos entre **disco** y **memoria**. La elección del formato de almacenamiento determina el rendimiento de cada operación.

```text
Jerarquía de almacenamiento:

   Registers (CPU)  ◄─── 1 ns
        │
   L1 cache        ◄─── 1 ns
        │
   L2 cache        ◄─── 10 ns
        │
   L3 cache        ◄─── 100 ns
        │
   RAM             ◄─── 100 ns
        │
   SSD             ◄─── 100 μs
        │
   HDD             ◄─── 10 ms
        │
   Network         ◄─── 1 ms
```

> [!note] Disco es 1000x más lento que RAM
> Un acceso a disco es **mil veces** más lento que un acceso a RAM. Por eso las bases de datos tratan de minimizar accesos a disco, no maximizar CPU.

## Database-centric architecture

El libro comienza con un patrón básico usado en bases de datos sencillas (SQLite, dbm):

```text
key1 → value1
key2 → value2
key3 → value3
```

Cada clave es un **offset** en un archivo. La búsqueda es O(1) en el mejor caso. La limitación: el modelo es muy pobre (clave plana, valor binario).

## Log-structured storage

El primer paso más sofisticado es el **log-structured**: append-only.

```text
Log:
┌─────────────────────────────────────────┐
│ k1=v1 │ k2=v2 │ k3=v3 │ k4=v4 │ k5=v5 │
└─────────────────────────────────────────┘
     ▲                                ▲
   write here                    read from here
```

### Características

- **Append-only**: las escrituras van al final. Son O(1) en disco.
- **Read**: hay que leer **todo** el log para encontrar un valor. O(n).
- **Crash recovery**: los logs son la fuente de verdad si los datos están en disco.

### Por qué es útil

- **Escrituras rápidas**: solo añadir al final.
- **Inmutable**: no se actualiza, se añaden nuevas versiones.
- **Replicable**: los logs se pueden copiar a otros nodos.

> [!tip] El log como estructura universal
> Kafka, los logs de transacciones, los logs de eventos: todos vienen de esta idea. Un log es **muchas** cosas: almacenamiento, replicación, fuente de verdad.

## Hash indexes

El primer paso para hacer el log consultable es añadir un **índice hash** en memoria.

```python
# Hash index en memoria
index = {
    "k1": 0,    # offset 0
    "k2": 6,    # offset 6
    "k3": 12,   # offset 12
    ...
}
```

### Características

- **Read**: O(1) con un lookup en memoria + lectura en disco.
- **Write**: append + actualización del hash en memoria.
- **Limitación**: el hash debe caber en RAM. Si no, no funciona.

### Compactación

El log crece indefinidamente. Para evitarlo, los sistemas **compactan**: mantienen solo la versión más reciente de cada clave.

```text
Antes de compactación:
┌─────────────────────────────────────┐
│ k1=v1 │ k2=v2 │ k1=v3 │ k3=v3 │ k1=v5 │
└─────────────────────────────────────┘

Después de compactación:
┌────────────────────┐
│ k1=v5 │ k2=v2 │ k3=v3 │
└────────────────────┘
```

> [!tip] Compactación = garbage collection
> Es el mismo concepto que en memoria (generation scavenging). Las versiones antiguas se eliminan. Solo mantienen la más reciente.

## SSTables (Sorted String Tables)

Para superar la limitación del hash, los sistemas usan **SSTables**: log ordenado por clave.

```text
SSTable:
┌─────────────────────────────────────────┐
│ apple=red, k1=v1                       │
│ banana=yellow, k2=v2                   │
│ cherry=red, k3=v3                       │
│ ...                                     │
└─────────────────────────────────────────┘
Cada bloque está ordenado por clave.
```

### Ventajas

- **Búsqueda binaria**: O(log n) en lugar de O(n).
- **Compresión**: el bloque se comprime mejor cuando los datos están ordenados.
- **Merge**: dos SSTables ordenados se pueden mergear en uno (merge sort).

### Implementaciones

- **LevelDB** (Google), **RocksDB** (Facebook): basados en SSTables.
- **Cassandra**: usa SSTables.
- **HBase**: usa SSTables.
- **SQLite** (modo WAL): usa elementos de log-structured.

## LSM-trees (Log-Structured Merge-Trees)

El libro describe las **LSM-trees** como la evolución de los SSTables. La estructura típica:

```text
Memtable (en RAM, mutable)
    ↓ flush cuando se llena
SSTable 1 (en disco, inmutable)
    ↓ cuando se acumulan varios
SSTable 2 (en disco, merge con SSTable 1)
    ↓
SSTable mayor (mergea varios menores)
```

### Beneficios

- **Escrituras rápidas**: solo añadir a memtable + flush.
- **Reads eficientes**: se consultan los SSTables en orden (más reciente primero).
- **Compresión buena**: los SSTables ordenados se comprimen bien.

### Limitaciones

- **Compaction en background**: consume recursos.
- **Read amplification**: hay que mirar varios SSTables.
- **Write amplification**: las escrituras se duplican durante la compactación.

> [!note] LSM-trees son el estándar de las bases modernas
> LevelDB, RocksDB, Cassandra, HBase, ScyllaDB, DynamoDB (con Local Secondary Indexes) usan LSM-trees. La razón: las **escrituras** son baratas, lo que importa para workloads con muchos writes.

## B-trees

El otro gran enfoque es el **B-tree**, usado en la mayoría de bases relacionales.

### Estructura

```text
B-tree:
                    ┌─────────────┐
                    │  [50, 100]  │  ← root
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │[10, 30] │  │[60, 80] │  │[120,150]│
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
        ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
        ▼         ▼  ▼         ▼  ▼         ▼
      [≤10]  [11-30] ...           ...
```

### Características

- **Páginas de tamaño fijo** (4-16 KB típicamente).
- **Read O(log n)**: pocos accesos a disco.
- **Write O(log n)**: hay que actualizar las páginas.
- **Crash recovery**: write-ahead log (WAL) para no perder escrituras.

### B-trees vs LSM-trees

| Característica | B-tree | LSM-tree |
|---|---|---|
| Reads | Más rápidos | Multiple SSTables, más I/O |
| Writes | Más lentos (página random) | Muy rápidos (append) |
| Compresión | Más difícil | Mejor (orden + bloques) |
| Predicibilidad | Estable | Variable (compaction) |
| Madurez | Más | Menos |

> [!tip> Elige el árbol según el workload
> - **Read-heavy**: B-tree (Postgres, MySQL, Oracle).
> - **Write-heavy**: LSM-tree (Cassandra, RocksDB).
> - **Mixto**: depende del ratio y de los índices secundarios.

## Índices secundarios

Los **índices secundarios** son índices adicionales para búsquedas que no son por clave primaria.

```sql
-- Tabla principal
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    name VARCHAR(255)
);

-- Índice secundario sobre email
CREATE INDEX idx_users_email ON users(email);
```

### Implementación

- **B-tree storage**: el índice es una tabla de (clave_secundaria, primary_key).
- **Heap storage**: el índice apunta a la fila física.
- **Clustered index**: las filas se almacenan ordenadas por el índice.

> [!danger] Costos de los índices secundarios
> Cada índice adicional **multiplica el coste de escritura** (hay que actualizar todos los índices). El libro insiste: **cada índice tiene un precio**.

### Multicolumn indexes

```sql
-- Índice compuesto (last_name, first_name)
CREATE INDEX idx_users_name ON users(last_name, first_name);
```

Útil para queries que filtran por ambos campos. El orden importa: solo funciona para queries que usan el prefijo más a la izquierda.

### Índices covering

Un índice que **incluye** todas las columnas que la query necesita, sin tener que ir al heap.

```sql
-- Índice covering
CREATE INDEX idx_users_covering ON users(email) INCLUDE (name);
```

> [!tip] Los índices covering son trucos poderosos
> Postgres y otros permiten columnas extra en el índice. La query puede servirse **solo** desde el índice, sin tocar la tabla.

## Manteniendo los índices

El libro advierte sobre los costes ocultos:

- **Actualizaciones**: el índice se actualiza en **cada** INSERT, UPDATE, DELETE.
- **Fragmentación**: con muchas actualizaciones, los índices se fragmentan. Hay que **reindexar** periódicamente.
- **Estadísticas**: el query planner usa estadísticas sobre los índices. Si están desactualizadas, las queries son lentas.

```sql
-- Reindexar en Postgres
REINDEX INDEX idx_users_email;

-- Actualizar estadísticas
ANALYZE users;
```

## Comparación final

| Sistema | Modelo de almacenamiento | Mejor para |
|---|---|---|
| Postgres, MySQL | B-tree | Read-heavy, transacciones |
| MongoDB, Cassandra | LSM-tree | Write-heavy, escala horizontal |
| LevelDB, RocksDB | LSM-tree | Embedded, baja latencia |
| HBase | LSM-tree | Big data, scan-heavy |
| CockroachDB, Spanner | B-tree distribuido | Geo-distribuido, OLTP |
| FoundationDB | B-tree | Transacciones serializables |

## Resumen en tres frases

- Las bases de datos modernas usan dos familias de algoritmos: **B-trees** (lecturas rápidas, escrituras más lentas) y **LSM-trees** (escrituras rápidas, lecturas potencialmente más lentas).
- Los **índices secundarios** aceleran queries pero multiplican los costes de escritura.
- Cada decisión (algoritmo, tipo de índice, índice clustered vs non-clustered) es un **trade-off** entre los patrones de carga esperados.

## Próximos pasos

- [[06-storage-and-retrieval-olap|Storage and retrieval (OLAP)]]: el otro lado. Cómo se almacenan los datos para **análisis**: data warehouses, almacenamiento columnar, materialized views, búsqueda full-text y vector embeddings.
