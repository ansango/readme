---
title: "Replication: multi-leader y leaderless"
description: "Las estrategias de replicación más exóticas: multi-leader para resolver conflictos geográficos, leaderless con quorum y consistencia eventual"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, replication, multi-leader, leaderless, quorum, eventual-consistency]
---

# Replication: multi-leader y leaderless

> [!abstract] Resumen
> La single-leader replication no es la única opción. Hay entornos donde **múltiples líderes** tienen sentido (geográficamente distribuidos, multi-datacenter) y entornos donde **ningún líder** funciona mejor (Dynamo, Cassandra). Esta nota cubre ambas estrategias, sus trade-offs y los protocolos que las hacen posibles.

## Multi-leader replication

El patrón multi-leader permite que **más de un nodo acepte escrituras**.

```text
Multi-leader:

               ┌─────────┐
               │ Leader 1│ (datacenter EU)
               └────┬────┘
                    │ replicación bidireccional
                    │
        ┌───────────┼───────────┐
        ▼                       ▼
   ┌─────┐                  ┌─────┐
   │L2 US│                  │L3 AP│
   └─────┘                  └─────┘
```

### Cuándo tiene sentido

El libro enumera tres casos:

1. **Multi-datacenter**: cada datacenter tiene su líder. Reduce la latencia para los usuarios locales.
2. **Aplicaciones offline**: dispositivos que sincronizan cuando tienen conectividad (EDP, journals).
3. **Trabajo colaborativo en tiempo real**: Google Docs, Figma, donde múltiples usuarios editan a la vez.

```text
Multi-datacenter:

EU datacenter          US datacenter
┌──────────┐           ┌──────────┐
│ Leader 1 │ ◄──────► │ Leader 2 │
└──────────┘  latency  └──────────┘
   baja en EU             baja en US
```

### La complicación: los conflictos

Si dos líderes aceptan la misma escritura en paralelo, los datos se **divergen**.

```text
Conflicto:

Líder 1 (EU):  user.name = "Ana"
Líder 2 (US):  user.name = "Ann"

¿Quién gana?
```

> [!danger> El problema central
> Con un solo líder, no hay conflictos. Con varios, hay que **resolverlos**. La resolución no es trivial.

## Resolución de conflictos

El libro describe las estrategias principales:

### 1. Last-write-wins (LWW)

Cada escritura tiene un **timestamp**. La escritura más reciente gana.

```text
Líder 1: t=10, user.name = "Ana"
Líder 2: t=11, user.name = "Ann"

Resultado: user.name = "Ann" (la más reciente)
```

**Ventajas**: simple.
**Limitaciones**: el reloj debe estar sincronizado. Si está mal, los datos no son los correctos.

### 2. CRDT (Conflict-free Replicated Data Types)

Estructuras de datos diseñadas para **no tener conflictos**.

```python
# Un contador CRDT
class GCounter:
    def __init__(self):
        self.counts = {}  # por nodo
    
    def increment(self, node_id):
        self.counts[node_id] += 1
    
    def value(self):
        return sum(self.counts.values())
```

**Ventajas**: convergencia automática.
**Limitaciones**: solo ciertos tipos de datos.

### 3. Operational transformation (OT)

Los conflictos se resuelven **transformando** operaciones.

```text
Operación A: insert("Ana", position=0)
Operación B: insert("Bob", position=0)

Después de la transformación:
Lista: ["Ana", "Bob"]  (resultado consistente)
```

> [!tip> Google Docs usa OT
> La edición colaborativa de Google Docs se basa en operational transformation. Es la tecnología que permite editar un documento a la vez sin perder cambios.

### 4. Last-writer-wins por nodo

Cada nodo tiene un **orden local**. El conflicto se resuelve por orden de nodos.

### 5. Reservar la resolución

Bloquear si hay conflicto, dejar al usuario decidir.

```text
Conflicto detectado:
  Opción A: "Ana"
  Opción B: "Ann"

Sistema: "Hay un conflicto. ¿Cuál quieres?"
```

## Multi-leader y el problema del ordering

El libro destaca un problema sutil: el **orden de las escrituras**.

```text
Escrituras concurrentes:

Líder 1: write(name="Ana")
Líder 2: write(name="Ann")

Orden en EU:  Ana, Ann
Orden en US:  Ann, Ana

Sin un reloj global, no hay forma de saber quién fue primero.
```

> [!note] Los relojes importan
> El libro abre una reflexión sobre los relojes que después desarrolla en otro capítulo: los relojes de los sistemas distribuidos son **imprecisos**. Si el orden importa, no puedes fiarte del wall clock.

## Topologías de multi-leader

### Circular

```text
Líder 1 ──► Líder 2
  ▲            │
  │            ▼
Líder 3 ◄── Líder 4
```

**Ventajas**: simple.
**Limitaciones**: si un nodo falla, la cadena se rompe.

### Star

```text
          ┌────────┐
          │Central │
          └┬──┬──┬─┘
           ▼  ▼  ▼
          L1  L2  L3
```

**Ventajas**: centralizado.
**Limitaciones**: el central es un SPOF.

### All-to-all

```text
L1 ◄──► L2 ◄──► L3
 │             ▲
 └─────────────┘
```

**Ventajas**: redundancia.
**Limitaciones**: complejidad.

> [!tip> All-to-all es la norma
> Es la usada en sistemas modernos (CouchDB, Datacenter replication). Cada nodo replica con todos los demás.

## Leaderless replication

El libro introduce la **replication sin líder**, popularizada por Amazon Dynamo.

### Concepto

Cualquier nodo puede aceptar **cualquier operación**.

```text
Leaderless:

       ┌─────┐
       │  N1 │ (cualquiera)
       └─────┘
            │
       ┌────┼────┐
       ▼    ▼    ▼
      N2    N3   N4
```

### Quorum

Para considerar una escritura como **exitosa**, el cliente debe obtener confirmación de **W** réplicas. Para una lectura, debe consultar **R** réplicas.

```text
Quorum:

Escritura: cliente contacta W réplicas
              W = 3 (en este caso)
Lectura:    cliente consulta R réplicas
              R = 3 (en este caso)
```

### Regla del quorum

Si `W + R > N`, la lectura va a ver la escritura más reciente.

```text
N = 5 réplicas
W = 3, R = 3

W + R = 6 > 5 ✓

Garantía: toda lectura ve al menos una de las
réplicas que tiene la escritura.
```

> [!tip> Elegir W y R
> - **W = 1, R = N**: cualquier nodo acepta, lectura requiere ver todos. Bajo consistencia, alto throughput.
> - **W = N, R = 1**: escritura requiere todos, lectura en uno. Alto consistency, alto costo.
> - **W = N/2 + 1, R = N/2 + 1**: balance. La elección típica.

## Sistemas eventual consistent

El libro describe la **consistencia eventual** como propiedad central de los sistemas leaderless:

> Después de que cesa toda escritura, eventualmente todos los nodos convergen al mismo estado.

```text
Consistencia eventual:

t=0: write "Ana" en N1
t=1: N2 recibe "Ana"
t=2: N3 recibe "Ana"
t=3: N4 recibe "Ana"

t=3: todos los nodos tienen "Ana" ✓
```

### Sloppy quorum

A veces no puedes usarías réplicas **del cluster**. El libro introduce **sloppy quorum**:

```text
Sloppy quorum:

Cliente escribe a N1, N2, N3.
Pero N3 está caído.
El cliente escribe a X1 (otro nodo en otra zona).

Cuando N3 vuelva, se reconcilia.
```

> [!warning] El libro advierte
> Sloppy quorum es útil pero introduce complejidad. Mejor evitarlo si puedes.

## Lectura y reparación (read repair, anti-entropy)

En sistemas leaderless, los nodos pueden **divergir**. Hay que repararlos:

### Read repair

Cuando un cliente lee y los datos están desactualizados, los **actualiza** en el nodo que devolvió la versión vieja.

```text
Read repair:

Cliente lee N1 (valor "A") y N2 (valor "B").
N1 está desactualizado.
Cliente escribe "B" en N1.
```

### Anti-entropy

Un proceso en background **compara** los datos entre nodos y replica los faltantes.

```text
Anti-entropy:

Background sync N1 ↔ N2:
  N2 tiene "X", N1 no.
  Background replica "X" en N1.
```

## Vector clocks y versiones

El libro describe **vector clocks** como mecanismo para detectar conflictos:

```text
Vector clock:

Dato: user.name = "Ana"
Version: {N1: 3, N2: 1, N3: 2}

Cada nodo tiene un contador.
La versión más reciente tiene todos los counters mayores o iguales.
```

Cuando dos vectores no se pueden comparar, hay un **conflicto** que hay que resolver.

> [!note] En la práctica, los vector clocks son raros
> Dynamo los popularizó, pero la mayoría de los sistemas modernos usan **timestamps** (LWW) en su lugar. La complejidad de los vector clocks es alta.

## Sloppy quorum y hinted handoff

El libro explica mecanismos para mantener disponibilidad:

```text
Hinted handoff:

Cliente escribe a N1, N2, N3.
N3 está caído.
El sistema escribe a N3' (otro nodo en la misma zona).
Cuando N3 vuelva, se reconcilia.
```

## Dynamo y derivados

El libro describe los sistemas que popularizaron la leaderless replication:

- **Amazon Dynamo** (2007): el original.
- **DynamoDB**: el servicio gestionado.
- **Cassandra**: open-source, derivado de Dynamo + BigTable.
- **Riak**: open-source, similar.
- **Voldemort**: open-source.

```text
Propiedades comunes:

- Leaderless con quorum.
- Consistencia eventual.
- Sloppy quorum.
- Vector clocks.
- Diseño para fallos.
```

## Dynamo en producción

El libro explica las decisiones de diseño de Dynamo:

### Sloppy quorum

Para asegurar disponibilidad, escriben a nodos cercanos aunque no sean la "réplica correcta".

### Merkle trees

Para anti-entropy eficiente, usan **Merkle trees** (hashes jerárquicos).

```text
Merkle tree:

          H(root)
         /      \
    H(A)         H(B)
    / \         / \
  H(1) H(2)  H(3) H(4)
```

Si dos nodos tienen el mismo H(root), sus datos son idénticos. Si difieren, solo se sincroniza la rama diferente.

### Mejoras posteriores

Cassandra y DynamoDB han refinado las ideas originales:

- **Better consistency**: desde DynamoDB 2019, opción de strong consistency.
- **LWW + timestamps** en vez de vector clocks.
- **Models for conflict resolution**: aplicación del lado del cliente.

> [!tip> El libro es escéptico
> El libro señala que la leaderless replication es **compleja** y que la mayoría de los casos no la necesitan. Para la mayoría de workloads, single-leader es más simple y suficiente.

## Comparación de estrategias

| Estrategia | Latencia | Consistencia | Complejidad | Cuándo |
|---|---|---|---|---|
| Single-leader sync | Alta | Fuerte | Media | Transacciones críticas |
| Single-leader async | Baja | Eventual | Baja | Servicios web |
| Multi-leader | Baja | Muy eventual | Alta | Multi-datacenter |
| Leaderless (quorum) | Variable | Configurable | Alta | Escala extrema |

## Resumen en tres frases

- **Multi-leader** resuelve problemas de latencia geográfica y multi-datacenter, pero introduce **conflictos** que requieren resolución.
- **Leaderless** (Dynamo) maximiza disponibilidad al precio de consistencia eventual. Es complejo pero apropiado para casos extremos.
- La mayoría de los sistemas reales usan **single-leader** como opción por defecto, y solo recurren a multi-leader o leaderless cuando la escala o la geografía lo exigen.

## Próximos pasos

- [[10-sharding|Sharding]]: una vez que tenemos réplicas, el siguiente paso es **particionar** los datos entre nodos. Cómo decidir qué dato va en qué nodo, cómo rutear las queries y cómo rebalancear.
