---
title: "Transactions: distributed"
description: "Las transacciones en sistemas distribuidos: 2PC, XA, consensus en el commit, exactly-once semantics y el teorema CAP"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, transactions, distributed, 2pc, cap, eventual-consistency]
---

# Transactions: distributed

> [!abstract] Resumen
> Cuando los datos viven en **varios nodos**, las transacciones ACID se complican. Esta nota cubre los protocolos para transacciones distribuidas (2PC, XA), el teorema CAP, las transacciones en sistemas eventually consistent y la semántica exactly-once.

## El problema central

El libro abre con la pregunta fundamental: **¿qué pasa cuando una transacción toca varios nodos?**

```text
Transacción distribuida:

BEGIN
  UPDATE row in Node 1
  UPDATE row in Node 2
  UPDATE row in Node 3
COMMIT
```

Si un nodo falla a la mitad, ¿qué pasa con los otros?

> [!danger> Las transacciones distribuidas son intrínsecamente complejas
> Los nodos pueden caer. La red puede fallar. No hay un **árbitro global** que diga quién tiene la verdad. La consistencia distribuida es el problema central de los sistemas distribuidos.

## Two-phase commit (2PC)

El protocolo clásico para resolver transacciones distribuidas.

### Fases

**Fase 1: prepare**

```text
Coordinator ──► Node 1: prepare
Coordinator ──► Node 2: prepare
Coordinator ──► Node 3: prepare

Node 1 ──► Coordinator: yes (prepared)
Node 2 ──► Coordinator: yes (prepared)
Node 3 ──► Coordinator: yes (prepared)
```

**Fase 2: commit**

```text
Coordinator ──► all: commit

Node 1: commit
Node 2: commit
Node 3: commit
```

### Variantes

Si algún nodo dice **no**:

```text
Phase 1:
  Node 1: yes
  Node 2: no
  Node 3: yes

Phase 2: rollback
  Node 1: rollback
  Node 3: rollback
```

> [!tip> 2PC es lento pero consistente
> El protocolo es **blocking**: si el coordinator cae, los nodos quedan en estado "prepared" hasta que vuelva.

## XA transactions

XA es un estándar para 2PC usado en Java y otras plataformas.

```java
// Pseudo-XA
XAConnection conn1 = dataSource1.getXAConnection();
XAConnection conn2 = dataSource2.getXAConnection();

XAResource res1 = conn1.getXAResource();
XAResource res2 = conn2.getXAResource();

// Phase 1
res1.prepare(xid1);
res2.prepare(xid1);

// Phase 2
res1.commit(xid1);
res2.commit(xid1);
```

### Limitaciones

- **Coordinator failures**: si el coordinator cae, los nodos están en estado "in doubt".
- **Latency**: 2PC requiere **round-trips** a todos los nodos.
- **No scaling**: añadir nodos hace el protocolo más lento.

## Las transacciones distribuidas en la práctica

El libro es claro: las transacciones distribuidas **existen** pero son **caras**. La mayoría de los sistemas modernos las evitan.

### Alternativa 1: procesos que evitan la necesidad

Si un cliente controla **el orden** de las escrituras, no necesita 2PC.

```text
Sin 2PC:

BEGIN local transaction
  UPDATE local
COMMIT
  → enqueue message to other service
  → retry until acknowledged
```

### Alternativa 2: idempotencia

Si las operaciones son **idempotentes**, el reintento es seguro.

```text
Idempotency:

POST /orders
  Headers: Idempotency-Key: abc123

Servidor: si ya tengo la key, devuelvo el resultado anterior.
```

### Alternativa 3: sagas

Una **saga** es una secuencia de transacciones locales con compensaciones.

```text
Saga ejemplo (reservar viaje):

1. Reservar vuelo (transacción local)
2. Reservar hotel (transacción local)
3. Cargar tarjeta (transacción local)

Si 3 falla:
  2a. Cancelar hotel
  1a. Cancelar vuelo
```

> [!tip> Las sagas son la alternativa práctica
> En microservicios, las sagas son la forma habitual de mantener la consistencia entre servicios. Cada paso es local, y los pasos se pueden **compensar**.

## Exactly-once semantics

El libro aborda un problema sutil: **¿qué significa "exactamente una vez" en un sistema distribuido?**

### Las tres garantías

- **At-most-once**: el mensaje se entrega 0 o 1 vez. Puede perderse.
- **At-least-once**: el mensaje se entrega 1 o más veces. Puede duplicarse.
- **Exactly-once**: el mensaje se entrega **exactamente** una vez.

### ¿Es posible exactly-once?

El libro argumenta: **exactly-once delivery no es posible sin coordinación atómica**. Pero sí es posible **exactly-once processing** si:

1. La operación es **idempotente**.
2. El **receptor** puede detectar y deduplicar.

```text
Exactly-once processing:

Emisor: "Operation X, idempotency_key=abc"
Receptor: 
  ¿Ya procesé abc? Sí → no procesa, devuelve mismo resultado
                   No → procesa, registra que se hizo
```

```python
# Ejemplo: idempotency en HTTP
def process_request(request):
    key = request.headers['Idempotency-Key']
    
    if cache.exists(key):
        return cache.get(key)  # devolver resultado anterior
    
    result = do_actual_work(request)
    cache.set(key, result)
    return result
```

> [!tip> Exactly-once es idempotency + dedup
> No se logra en la **red**, se logra en el **receptor**. La garantía es del receptor, no del transporte.

## El teorema CAP

El libro presenta el famoso **teorema CAP** de Eric Brewer:

```text
Consistency
Availability
       ●
      /│\
     / │ \
   C   A   P
```

**Afirmación**: en presencia de una partición de red, solo puedes elegir **dos** de los tres:

- **Consistency**: todos los nodos ven los mismos datos.
- **Availability**: el sistema sigue respondiendo.
- **Partition tolerance**: el sistema sigue funcionando cuando la red falla.

### El matiz del libro

El libro señala que el teorema ha sido **sobreinterpretado**:

- En la práctica, la red **siempre** falla a veces. Partición es inevitable.
- La elección real es entre **consistency** y **availability** en presencia de partición.
- No se puede tener "perfect" consistency y "perfect" availability simultáneamente.

```text
Elección real:

Si la red está particionada:
  - CP: bloquear hasta que se resuelva la partición.
  - AP: seguir aceptando escrituras, divergir.
```

### Más allá de CAP

El libro introduce el modelo **PACELC** (Latency-Consistency):

```
If partition (P):
  Either A or C
Else (E):
  Tradeoff between Latency and Consistency
```

> [!note> El libro es escéptico
> El teorema CAP es útil, pero no es la última palabra. Sistemas modernos (Cassandra, DynamoDB) tienen modos configurables.

## Consistencia fuerte vs eventual

El libro contrapone dos filosofías:

### Consistencia fuerte

Cada lectura ve la **escritura más reciente** confirmada.

```text
Strong consistency:

T1: write x = 5
T1: COMMIT
T2: READ x → 5 (siempre)
```

**Ventajas**: el programador razona sobre un solo estado.
**Limitaciones**: latencia, menos disponibilidad.

### Consistencia eventual

Las lecturas **eventualmente** ven las escrituras, pero no inmediatamente.

```text
Eventual consistency:

T1: write x = 5
T2: READ x → 0 (todavía no replicado)
T2: READ x después → 5 (eventualmente)
```

**Ventajas**: disponibilidad, latencia baja.
**Limitaciones**: el programador gestiona anomalías.

> [!tip> El libro es agnóstico
> Ambos modelos son útiles. La elección depende del caso. La mayoría de los sistemas modernos ofrecen **opciones** entre los dos por operación.

## Estrategias prácticas

### Patrón 1: Single-region, single-database

```text
Recomendación: serializable (lo más safe)
Realidad: read committed (suficiente)
```

### Patrón 2: Multi-region, asynchronous

```text
Recomendación: eventual consistency
Realidad: compensación de negocio
```

### Patrón 3: Sistema financiero

```text
Recomendación: serializable + 2PC
Realidad: caro, lento, pero correcto
```

### Patrón 4: Redes sociales

```text
Recomendación: eventual consistency
Realidad: los likes no necesitan ser estrictamente correctos
```

## Lock-free y otras alternativas

El libro menciona otras técnicas para concurrencia:

### Lock-free data structures

Estructuras de datos que **no requieren locks** para ser correctas.

```python
# Compare-and-swap
def atomic_increment(counter):
    while True:
        old = counter.value
        new = old + 1
        if counter.compare_and_swap(old, new):
            return new
```

### CRDT

Como vimos en [[09-replication-multi-leader-leaderless|replicación multi-leader]].

### FoundationDB

FoundationDB usa [[15-consistency-and-consensus|consensus]] para serializar todas las operaciones. Es un ejemplo de **distribución con consistencia fuerte**.

## The trouble with 2PC

El libro es claro sobre los problemas de 2PC:

1. **Blocking**: los participantes esperan al coordinator.
2. **Coordinator failure**: si cae, los participantes quedan en limbo.
3. **Coordinator failure after commit**: el coordinator cree que hizo commit, pero no todos los nodos lo saben.
4. **Network partition**: cualquier partición puede bloquear.

```text
Coordinator failure scenario:

1. Coordinator: prepare → YES from all
2. Coordinator: cae antes de commit
3. Participants: preparado, esperando commit
4. Nadie sabe si hacer commit o rollback
```

> [!danger> 2PC es la pesadilla de los operadores
> La recuperación de un coordinator de 2PC es manual. Las transacciones en limbo pueden durar horas.

## Resumen en tres frutas

- **2PC** es el protocolo clásico pero caro y con problemas de operatoria.
- **Sagas** son la alternativa práctica en microservicios: transacciones locales con compensaciones.
- **Exactly-once processing** se logra con **idempotencia + dedup** en el receptor, no en la red.

## Próximos pasos

- [[13-distributed-systems-faults|The trouble with distributed systems: faults y redes]]: por qué diseñar para fallos no es paranoia sino disciplina. TCP, timeouts, partial failures y los escenarios más sutiles.
