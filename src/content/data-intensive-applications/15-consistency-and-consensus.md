---
title: "Consistency and consensus"
description: "La cúspide del problema distribuido: linearizability, ID generators, consenso distribuido (Paxos, Raft) y servicios de coordinación"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, distributed, consensus, linearizability, paxos, raft]
---

# Consistency and consensus

> [!abstract] Resumen
> Cuando los datos se replican en varios nodos, ¿qué significa que estén "consistentes"? El libro distingue varios modelos de consistencia, desde la más débil (eventual) hasta la más fuerte (linearizability). Esta nota cubre linearizability, los órdenes totales, los generadores de IDs, los algoritmos de consenso (Paxos, Raft) y los servicios de coordinación.

## El problema del consenso

El libro abre con la observación más importante del campo:

> "El consenso es uno de los problemas más sutiles del diseño de sistemas distribuidos, pero se ha convertido en uno de los más importantes."

```text
El problema del consenso:

N nodos, cada uno con un valor.
Todos los nodos deben ponerse de acuerdo en un valor.
A pesar de fallos de nodos y de la red.
```

> [!tip> El consenso es poderoso
> Si tienes consenso, puedes hacer **leader election**, **distributed locks**, **global sequence numbers**, **atomic commits**. Casi todo lo "imposible" en sistemas distribuidos se vuelve posible con consenso.

## Linearizability

El modelo de consistencia más fuerte.

### Definición

Una historia es **linearizable** si existe un **orden total** de los eventos que respeta:

1. **El orden de los eventos en un mismo proceso**.
2. **El tiempo real** (si A termina antes que B empiece, A va antes).

```text
Linearizability:

Proceso 1: write x = 1 → ack
Proceso 2:        read x → 1

Todos los nodos ven los eventos en el MISMO orden, y ese orden
es compatible con el tiempo real.
```

### Ejemplo visual

```text
Tiempo real:

  Proceso 1 ──w(x=1)──────────────────────────────────►
  Proceso 2 ──────────────r(x=?)───────────────────────►

Si w(x=1) termina antes que r(x=?) empiece,
entonces r(x=?) debe devolver 1.
```

> [!tip> Linearizability es **fuerte**
> Cualquier lectura, en cualquier momento, devuelve el último valor escrito. La garantía es la misma que un sistema single-node.

### Coste de linearizability

El libro es claro: **linearizability sale cara**.

```text
Linearizability:

  + Consistencia fuerte
  - Latencia alta (necesita round-trips)
  - Menos disponibilidad (si la red se particiona, no podemos escribir)
  - Throughput menor
```

### Cuándo usar linearizability

- **Locking**: para que solo un cliente haga un lock.
- **Uniqueness constraints**: para que no haya duplicados.
- **Sequence numbers**: para que solo haya un número "siguiente".

## Órdenes totales vs parciales

El libro introduce esta distinción clave:

### Orden total

Para **cualquier par** de operaciones, una es anterior a la otra.

```text
Orden total:

  op1 < op2
  op2 < op3
  op1 < op3

  (CUALQUIER par es comparable)
```

### Orden parcial

Algunos pares son comparables, otros **no**.

```text
Orden parcial:

  op1 < op2 (op1 causó op2)
  op3 < op4 (op3 causó op4)
  op1 vs op3: no comparables (concurrentes)
```

> Linearizability requiere **orden total** sobre las operaciones. La consistencia eventual permite orden parcial.

## Implementar linearizability

El libro describe los mecanismos para linearizar:

### 1. Single-leader con synchronous replication

El leader espera a que **todos los followers** confirmen antes de retornar.

```text
Implementación:

  Cliente ──► Leader ──► Follower 1 (ack)
                       ──► Follower 2 (ack)
                       ──► Follower 3 (ack)
  Leader ──► Cliente (ack)
```

**Ventajas**: simple.
**Limitaciones**: latencia, no disponible si algún follower no responde.

### 2. Consensus (Paxos, Raft)

Algoritmos que garantizan acuerdo a pesar de fallos.

```text
Consensus:

  Leader ──► valor=v1 ──► Followers
  Followers: mayoría acepta
  Leader: confirmado
```

Lo vemos en detalle más abajo.

### 3. Compare-and-set (CAS)

Operación atómica que cambia solo si el valor es el esperado.

```python
def compare_and_set(key, expected, new_value):
    current = read(key)
    if current == expected:
        write(key, new_value)
        return True
    return False
```

> [!tip> CAS es la primitiva básica
> Casi todos los mecanismos de linearizability se construyen sobre CAS.

## ID generators

El libro cubre un problema muy concreto: **generar IDs únicos en sistemas distribuidos**.

### Por qué es difícil

```text
El problema:

Servidor A: genera ID = 100
Servidor B: genera ID = 100
Conflicto.
```

### Solución 1: Auto-increment por shard

```text
Shard 1: 1, 101, 201, ...
Shard 2: 2, 102, 202, ...
Shard 3: 3, 103, 203, ...
```

Cada shard tiene un rango. Sin coordinación.

### Solución 2: UUID

UUIDs de 128 bits son prácticamente únicos.

```text
UUID: 550e8400-e29b-41d4-a716-446655440000

Probabilidad de colisión: 2^-122. Prácticamente cero.
```

### Solución 3: Snowflake (Twitter)

Timestamp + worker ID + sequence.

```text
Snowflake:

  41 bits timestamp
  10 bits worker ID
  12 bits sequence

Hasta 4096 IDs/ms/worker.
```

### Solución 4: Snowflake con consensus

Usando consensus para garantizar unicidad.

```text
Consensus-based:

  Cliente ──► Servicio de IDs (consensus)
            ◄── ID único
```

Más lento, pero único estricto.

## Linearizability y consenso

El libro describe la **relación profunda** entre linearizability y consenso:

```text
Linearizability + compare-and-set  ←→  Consensus
```

Si tienes linearizability, puedes hacer consensus.
Si tienes consensus, puedes hacer linearizability.

> [!tip> Son dos caras de lo mismo
> linearizability es la **propiedad**.
> consensus es el **mecanismo**.
> Son equivalentes en poder.

## Paxos

El algoritmo de consenso clásico, de **Leslie Lamport** (1998).

### Conceptos

- **Proposer**: propone un valor.
- **Acceptor**: vota por un valor.
- **Learner**: aprende el valor consensuado.
- **Quorum**: mayoría de acceptors.

### Fases

```text
Paxos - Fase 1 (prepare):

  Proposer ──► Acceptors: prepare(n)
  Acceptors ──► Promised(n, no higher)

Paxos - Fase 2 (accept):

  Proposer ──► Acceptors: accept(n, value)
  Acceptors ──► Accepted

Paxos - Fase 3 (learn):

  Learners ──► ¿Cuál es el valor?
```

### Propiedades

- **Safety**: nunca se decide un valor distinto.
- **Liveness**: si la mayoría funciona, eventualmente se decide.

### Problema

**Paxos es notoriamente difícil** de entender e implementar. Lamport escribió un paper en 1998, pero la comunidad tardó años en apreciar su significado.

> [!note> Paxos es la base teórica
> El libro describe Paxos como la **solución teórica** al problema de consensus. La implementación práctica se hace a través de Raft o Zab.

## Raft

Raft (2014, **Diego Ongaro**) es una simplificación de Paxos diseñada para ser **entendible**.

### Conceptos

- **Líder elegido**: un nodo es el líder en cualquier momento.
- **Términos**: cada elección es un nuevo término (epoch).
- **Log**: cada nodo tiene un log replicado.

### Fases

#### 1. Elección

```text
Heartbeat timer expira:
  - Nodo se convierte en candidate
  - Incrementa su término
  - Vota por sí mismo
  - Pide votos a otros

Si mayoría vota:
  - Se convierte en leader
  - Empieza a enviar heartbeats

Si mayoría NO vota:
  - Otro nodo ganó
```

#### 2. Replicación

```text
Leader recibe comando:
  - Appenda al log
  - Envía AppendEntries a followers
  - Cuando mayoría confirma, aplica al state machine

Follower:
  - Acepta el log si el término coincide
  - Si encuentra inconsistencias, las rechaza
```

### Propiedades

- **Safety**: los logs de los nodos convergen.
- **Liveness**: si la mayoría funciona, eventualmente progresa.

```text
Raft simplificado:

  ┌──────┐        ┌──────┐
  │Lead 1│◄──────►│Follow│
  └──────┘        └──────┘
       ▲
       │ AppendEntries
       ▼
  ┌──────┐
  │Follow│
  └──────┘
```

> [!tip> Raft es la elección habitual
> etcd, Consul, CockroachDB, MongoDB replica set, Kafka (parcialmente), FoundationDB usan Raft o variantes.

## Zab

Zab (ZooKeeper Atomic Broadcast) es el algoritmo de consensus usado por **ZooKeeper**.

### Conceptos

- **Líder único**: similar a Raft.
- **Zxid**: sequence number global, asigna orden a los eventos.
- **Recuperación**: tras failover, los followers sincronizan con el nuevo líder.

> [!tip> ZooKeeper es el abuelo
> Antes de Raft, ZooKeeper y su Zab eran la implementación de facto de consensus. Para muchos sistemas "legacy", sigue siendo válido.

## Servicios de coordinación

El libro cubre los **servicios de coordinación** que se construyen sobre consensus:

### ZooKeeper

- **Leader election**: elegir un coordinador.
- **Configuration management**: configuración distribuida.
- **Locks**: distribuidos, con protección contra process pauses.
- **Queues**: cola de mensajes.

```python
# Pseudo-ZooKeeper
from kazoo.client import KazooClient

zk = KazooClient('localhost:2181')
zk.start()

lock = zk.Lock('/mypath')
lock.acquire()
# ... critical section ...
lock.release()
```

### etcd

- **Moderno**: menos quirks que ZooKeeper.
- **Raft-based**: usa Raft directamente.
- **k/v API**: simple.
- **Kubernetes**: usa etcd como backend.

### Consul

- **Service discovery**: encuentra servicios.
- **Health checks**: monitores.
- **Multi-datacenter**: replicación entre datacenters.

```text
Comparación:

                ZooKeeper    etcd    Consul
Consensus:       Zab        Raft    Raft
Lenguaje:        Java        Go      Go
API:             ZNode       K/V     K/V + HTTP
Service discovery: Manual     Manual  Built-in
```

## Reliability of consensus

El libro cuantifica las garantías:

```text
Garantías de consensus:

  - Terminación: si no hay fallos, consensus termina.
  - Acuerdo: dos nodos no deciden valores distintos.
  - Integridad: un nodo no decide dos veces valores distintos.
```

> [!tip> El teorema FLP
> El teorema **Fischer-Lynch-Paterson** (1985) dice que en un sistema asíncrono, consensus es **imposible** con un solo fallo de proceso. La práctica sortea esto con timeouts.
```

## Total order broadcast

El libro conecta consensus con **total order broadcast** (también llamado **atomic broadcast**).

### Concepto

Todos los mensajes son **entregados** en el mismo orden a todos los nodos.

```text
Total order broadcast:

  Nodo 1: recibe m1, m2, m3
  Nodo 2: recibe m1, m2, m3
  Nodo 3: recibe m1, m2, m3

  Todos en el mismo orden.
```

### Equivalencia con consensus

```text
Consensus  ←→  Total order broadcast

Consensus: ponerse de acuerdo en UN valor.
Total order broadcast: ponerse de acuerdo en una SECUENCIA.
```

> [!tip> Total order broadcast es la primitiva
> Casi todos los sistemas distribuidos necesitan total order broadcast. Y se implementa con consensus.

## Coordination services

El libro enumera los usos de los servicios de coordinación:

### 1. Leader election

```text
Leader election:

  5 nodos quieren ser líder.
  Solo uno puede.
  Coordination service elige.
```

### 2. Distributed locks

```text
Distributed lock:

  Servicio A: lock(recurso)
  Servicio B: intenta lock
  Servicio A: unlock
  Servicio B: lock (ahora sí)
```

### 3. Configuration management

```text
Config:

  etcd: {"db_host": "db1", "timeout": 30}
  Todos los nodos leen de etcd.
```

### 4. Cluster membership

```text
Membership:

  Nodos: [n1, n2, n3, n4]
  n3 cae: [n1, n2, n4]
  n5 entra: [n1, n2, n4, n5]
```

## Linearizability vs serializability

El libro aclara la confusión:

- **Linearizability**: el orden de las operaciones es **compatible con el tiempo real**.
- **Serializability**: las transacciones ejecutan en **algún orden secuencial** que da el mismo resultado.

```text
Linearizability: orden con tiempo real.
Serializability: orden que respeta dependencias.
```

> [!tip> No son intercambiables
> Una historia puede ser serializable pero no linearizable. Una historia linearizable es automáticamente serializable.

## Resumen en tres frases

- **Linearizability** es la consistencia más fuerte: las operaciones se ordenan como si fueran un sistema single-node.
- **Consensus** (Paxos, Raft) es el mecanismo para conseguir acuerdo distribuido a pesar de fallos.
- Los **servicios de coordinación** (ZooKeeper, etcd, Consul) usan consensus para ofrecer servicios que serían imposibles de otra forma.

## Próximos pasos

- [[16-batch-processing|Batch processing]]: el otro gran paradigma de procesamiento. Unix tools, MapReduce y los Dataflow engines: cómo procesar terabytes con código sorprendentemente simple.
