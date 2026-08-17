---
title: "Sharding"
description: "Cómo partir los datos entre nodos: estrategias de particionamiento, request routing, secondary indexes y rebalancing"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, sharding, partitioning, distributed, hash, range]
---

# Sharding

> [!abstract] Resumen
> Cuando un solo nodo no basta, los datos se **particionan** entre varios nodos. Esta nota cubre las estrategias de sharding (hash, range, hash consistente), el request routing, los secondary indexes y las operaciones de rebalance. La pregunta central: ¿en qué nodo debe vivir cada clave?

## Por qué sharding

El libro abre con la pregunta directa: **¿para qué partir los datos?**

- **Volumen**: los datos no caben en un solo nodo.
- **Throughput**: las queries no se atienden con un solo nodo.
- **Latencia**: los datos geográficamente lejanos deben estar cerca del usuario.

```text
Sin sharding:                   Con sharding:

┌─────────────┐               ┌─────────────┐
│ Nodo único  │               │ Shard 1     │
│ 1 TB datos  │               │ 250 GB      │
│ 10K QPS     │               └─────────────┘
└─────────────┘               ┌─────────────┐
                              │ Shard 2     │
                              │ 250 GB      │
                              └─────────────┘
                              ┌─────────────┐
                              │ Shard 3     │
                              │ 250 GB      │
                              └─────────────┘
                              ┌─────────────┐
                              │ Shard 4     │
                              │ 250 GB      │
                              └─────────────┘
```

> [!note] Sharding != replication
> **Sharding** reparte los datos entre nodos (cada fila en un nodo). **Replication** copia los datos entre nodos (cada fila en varios). Son ortogonales: un sistema production tiene ambos.

## Estrategias de sharding

### Sharding por key range

Cada shard tiene un **rango de claves**.

```text
Range sharding:

Shard 1: A-F
Shard 2: G-M
Shard 3: N-S
Shard 4: T-Z
```

**Ventajas**: range queries son eficientes (`SELECT * FROM users WHERE name BETWEEN 'A' AND 'F'`).
**Limitaciones**: si la distribución no es uniforme, los shards pueden desequilibrarse.

> [!example> Distribución sesgada
> Si las claves son UUIDs y empiezas por 'a', el shard A-F puede tener 80% de los datos. El libro insiste en elegir una clave que **distribuya uniformemente**.

### Sharding por hash

Se aplica una función **hash** a la clave, y se asigna al shard correspondiente.

```text
Hash sharding:

hash(key) % N = shard_id

hash("Ana") = 0x1234ABCD
0x1234ABCD % 4 = 0
→ Shard 1 (asumiendo que 0 → 1)
```

**Ventajas**: distribución uniforme.
**Limitaciones**: range queries requieren scan de todos los shards.

### Hash consistente

El problema del hash normal: si añades un shard, **todos los datos se remapean**.

```text
Hash normal:

4 shards → 5 shards
hash(key) % 4 → hash(key) % 5
Casi todo se mueve.
```

**Hash consistente**: cada shard tiene un rango en el **círculo de hash**.

```text
Hash consistente:

        0
        │
   2500 ─┼─ 2500
        │
       5000
```

Cuando añades un shard, solo se mueven los datos del rango afectado.

```text
Añadir un shard en el hash consistente:

         0
        /│\
       / │ \
   2000 2500  3000  (nuevo shard aquí)
      │       │
      Shard 1  Shard 3
```

> [!tip> Hash consistente es el estándar
> Cassandra, DynamoDB, Riak, Voldemort lo usan. El motivo: añadir o quitar shards es **barato** en términos de movimiento de datos.

## Pros y contras de cada estrategia

| Estrategia | Range queries | Distribución | Resharding |
|---|---|---|---|
| Range | Eficiente | Sesgada | Fácil |
| Hash | Costoso | Uniforme | Costoso |
| Hash consistente | Costoso | Uniforme | Moderado |

## Sharding by key range

El libro describe con detalle el **sharding by key range**.

### Snitches

Los **snitches** deciden a qué shard va un dato. En Cassandra, hay varios:

- **SimpleSnitch**: igual para todos.
- **RackInferringSnitch**: deduce rack y datacenter.
- **PropertyFileSnitch**: configurable.

## Skew y hot spots

El libro advierte sobre el **skew** (sesgo) en la distribución:

```text
Skew problem:

Shard 1: 5GB  (poco cargado)
Shard 2: 5GB
Shard 3: 50GB (hot spot)
Shard 4: 5GB
```

> [!danger> Un hot spot mata el sistema
> Si un shard recibe el 80% del tráfico, la infraestructura escala el peor caso, no el mejor. **Hot spots son el enemigo**.

### Cómo evitar hot spots

- **Buena clave de sharding**: hash uniforme, no secuencial.
- **Consistent hashing con virtual nodes**: el libro cita un ejemplo de Discord que usó **varios cientos de nodos virtuales** por servidor para equilibrar.
- **Hot-spot mitigation**: vigilar y rebalancear.

```text
Virtual nodes (vnodes):

Servidor 1 ──► Nodos virtuales: 1, 17, 33, 49, ...
Servidor 2 ──► Nodos virtuales: 2, 18, 34, 50, ...
```

## Secondary indexes

El **problema** con índices secundarios en un sistema shardado: cada índice es local al shard.

```text
Secondary indexes shard-local:

Shard 1: índice local (user_id: 1, 2, 3)
Shard 2: índice local (user_id: 4, 5, 6)
Shard 3: índice local (user_id: 7, 8, 9)

Query: "todos los usuarios con email = 'a@x.com'"
→ hay que buscar en TODOS los shards.
```

### Dos soluciones

#### Document-partitioned (local index)

Cada shard tiene su propio índice. La query es **scatter-gather**.

```text
Scatter-gather:

Cliente ──► Shard 1: "busca a@x.com" → no
         ──► Shard 2: "busca a@x.com" → no
         ──► Shard 3: "busca a@x.com" → sí
         ◄── combinar resultados
```

**Ventajas**: la query es tolerante a fallos en shards.
**Limitaciones**: latencia suma todos los shards.

#### Term-partitioned (global index)

El índice está en **otro** shard, particionado por el término.

```text
Term-partitioned:

Índice global:
  "a@x.com" → shard 3
  "b@x.com" → shard 1
  ...

Query: "busca a@x.com"
Cliente ──► Shard 3 (índice) ──► Shard 3 (datos)
```

**Ventajas**: queries precisas.
**Limitaciones**: el índice es un nuevo sistema distribuido.

> [!tip> Elige según el patrón de queries
> - **Pocas queries, baja latencia**: term-partitioned.
> - **Muchas queries, alta disponibilidad**: document-partitioned.

## Request routing

El libro cubre cómo los clientes encuentran el shard correcto:

### 1. Cliente → cualquier nodo → reenvía

```text
Cliente ──► N1 ──► Shard 2 (datos)
  ◄── (N1 reenvía la query)
```

**Ventajas**: cliente simple.
**Limitaciones**: hop extra.

### 2. Cliente → router service

```text
Cliente ──► Router Service ──► Shard 2
                            (el router conoce el sharding)
```

**Ventajas**: cliente simple, router configurable.
**Limitaciones**: el router es un SPOF.

### 3. Cliente conoce el sharding

```text
Cliente ──► Shard 2 (directo)
```

**Ventajas**: sin hops.
**Limitaciones**: cliente complejo; cambiar sharding requiere actualizar todos los clientes.

## Consistency en sharding

Un problema típico es **escribir** en un shard y **leer** de otro:

```text
Problema:

Escribo "Ana" en Shard 1.
La query "Ana" se enrutó a Shard 2 (no la tiene).
```

> [!tip> La consistencia entre shards es difícil
> El libro conecta esto con el [[15-consistency-and-consensus|capítulo de consistencia]]. Por ahora, la regla: si necesitas transacciones entre shards, necesitas **two-phase commit** (lo vemos en [[12-transactions-distributed|transactions distributed]]).

## Rebalancing

El **rebalance** redistribuye datos entre shards. Tipos:

### Fixed number of shards

Más shards que nodos. Varios shards por nodo. Reasignar nodos sin mover datos.

```text
N -> N+1 nodos pero 16 shards fijos:

Antes:  4 nodos, 4 shards (1 cada uno)
        N1: shard 1
        N2: shard 2
        N3: shard 3
        N4: shard 4

Después: 5 nodos, 4 shards
        N1: shard 1
        N2: shard 2
        N3: shard 3
        N4: shard 4
        N5: (vacío)
```

### Dynamic partitioning

El número de shards crece con los datos. Cada shard tiene un rango.

```text
Splitting:

Shard 1: A-M
  → Shard 1a: A-F
  → Shard 1b: G-M
```

> [!example> HBase
> HBase hace split automático cuando un shard crece demasiado.

### Consistent hashing

El libro describe **consistent hashing** como la opción preferida para sistemas grandes.

```text
Consistent hashing:

         0
        /│\
       / │ \
      /  │  \
   Server 1 Server 2 Server 3

Cada servidor tiene un rango en el anillo.
```

> [!tip> Virtual nodes
> La mayoría de sistemas modernos usan **vnodes**: cada servidor tiene varios cientos de segmentos aleatorios en el anillo. Esto **distribuye** la carga más uniformemente.

## Request routing detallado

El libro describe los algoritmos para que un cliente encuentre el shard:

### Zookeeper como coordinator

```text
Cliente ──► Zookeeper ──► "dónde está esta clave?"
                              │
                              ▼
                           Shard 3
```

Cassandra, Kafka, HBase usan Zookeeper (o equivalente) para coordinación.

### Gossip protocol

```text
Gossip:

N1 ──► N2: "yo sé los shards 1, 2, 3"
N2 ──► N3: "ahora sé los shards 1, 2, 3, 4"
...
```

Eventualmente todos saben la distribución. Usado en Cassandra.

### Sidecar/Proxy

Un servicio **proxy** se interpone entre cliente y shards.

```text
Cliente ──► Proxy ──► Shard 1
                 ──► Shard 2
                 ──► Shard 3
```

## Resumen en tres frases

- El **sharding** reparte los datos entre nodos. Las dos familias principales son **range** (range queries eficientes) y **hash** (distribución uniforme).
- Los **índices secundarios** en sistemas shardados son un problema: el libro describe **document-partitioned** y **term-partitioned** como soluciones.
- El **rebalance** es la operación más delicada. Hash consistente, virtual nodes y gossip son las técnicas para escalar sin grandes movimientos de datos.

## Próximos pasos

- [[11-transactions-isolation|Transactions: isolation]]: una vez que tenemos datos repartidos y replicados, hay que decidir qué garantías ofrecemos. ACID, los niveles de aislamiento y los read phenomena.
