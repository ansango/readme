---
title: "Transactions: isolation"
description: "Las transacciones como mecanismo para gestionar la concurrencia: ACID, isolation levels, read phenomena y serializability"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, transactions, acid, isolation, serializability, concurrency]
---

# Transactions: isolation

> [!abstract] Resumen
> Las transacciones son el mecanismo clásico para que varias operaciones concurrentes se comporten como si fueran una sola. Esta nota cubre ACID, los niveles de aislamiento, los read phenomena y los mecanismos que las bases de datos usan para implementarlos.

## Por qué importan las transacciones

El libro abre con un problema clásico: dos clientes hacen reservas concurrentes sobre el mismo asiento.

```text
Race condition:

Cliente 1: lee asiento A (libre)
Cliente 2: lee asiento A (libre)
Cliente 1: reserva asiento A (no libre)
Cliente 2: reserva asiento A (no libre)
Resultado: dos clientes con el mismo asiento 😢
```

Sin transacciones, el sistema se **rompe**. Las transacciones son el mecanismo para evitar esto.

> [!quote] "Las transacciones son una abstracción que permite a los programadores ignorar ciertos modos de fallo."
> El libro enmarca las transacciones como **simplificación**: el programador no piensa en conflictos posibles porque la base los maneja.

## ACID

El acrónimo ACID resume las garantías de las transacciones:

### Atomicity

Una transacción es **todo o nada**. Si falla a la mitad, el sistema vuelve al estado anterior.

```text
Atomicity:

Transacción: transferir 100€ de A a B
  1. Restar 100€ de A
  2. Sumar 100€ a B

Si 2 falla, 1 también debe deshacerse.
```

### Consistency

La transacción lleva la base de un **estado válido** a otro.

```text
Consistency:

Si la base tiene la regla "todo email es único",
una transacción que cree un usuario con email duplicado
debe fallar.
```

> [!note> Consistency es débil
> "Consistency" en ACID es **consistencia del esquema** (constraints), no la consistencia entre réplicas (eventual consistency). El libro es claro: la palabra se usa con dos sentidos.

### Isolation

Las transacciones concurrentes no se **interfieren** entre sí. El resultado es como si se ejecutaran **una a una**.

```text
Isolation:

Cliente 1: suma 1 a counter
Cliente 2: suma 1 a counter

Sin isolation: counter = 1 (segundo escribe sobre el primero)
Con isolation: counter = 2 (se serializan)
```

### Durability

Una vez confirmada, la transacción **sobrevive** a fallos del sistema.

```text
Durability:

Cliente confirma la transacción.
El sistema cae.
El sistema recupera.
La transacción sigue ahí.
```

## El modelo del libro

El libro prefiere hablar de **garantías concretas** en lugar de ACID:

- **Atomicity**: no se observan efectos parciales.
- **Isolation**: las transacciones concurrentes no se interfieren.
- **Durability**: los datos confirmados sobreviven.

```text
Modelo del libro:

atomicity += garantizar atomicidad
isolation += garantizar aislamiento
durability += garantizar durabilidad
```

## Read phenomena

El libro describe los **problemas** que pueden ocurrir si no hay suficiente aislamiento:

### 1. Dirty read

Una transacción lee datos de otra transacción que aún no ha hecho commit.

```text
T1: UPDATE x = 5
T2: READ x  → ve 5
T1: ROLLBACK
T2: leyó un valor que nunca existió
```

### 2. Non-repeatable read

Una transacción lee el mismo dato dos veces y obtiene valores diferentes.

```text
T1: READ x → 10
T2: UPDATE x = 20
T2: COMMIT
T1: READ x → 20  (¡diferente!)
```

### 3. Phantom read

Una transacción ejecuta la misma query dos veces y obtiene **filas nuevas**.

```text
T1: SELECT * FROM users WHERE age > 18 → 10 rows
T2: INSERT INTO users (age) VALUES (25)
T2: COMMIT
T1: SELECT * FROM users WHERE age > 18 → 11 rows
```

### 4. Lost update

Dos transacciones leen y escriben concurrentemente, el segundo pisa al primero.

```text
T1: lee counter = 10
T2: lee counter = 10
T1: counter = 10 + 1
T2: counter = 10 + 1
Resultado: counter = 11 (¡debería ser 12!)
```

## Niveles de aislamiento

El estándar SQL define cuatro niveles:

### Read uncommitted

- Puede ver datos no confirmados.
- Solo evita lost updates (parcialmente).
- Casi nunca se usa.

### Read committed

- Solo ve datos confirmados.
- Implementa con **row locks** durante la lectura.
- El nivel por defecto en Postgres, Oracle.

```text
Read committed:

T1: UPDATE x = 5
T2: READ x → ve el valor viejo (5 todavía no confirmado)
T1: COMMIT
T2: READ x → ve 5 (ahora confirmado)
```

### Repeatable read

- Garantiza que la transacción ve el mismo snapshot durante toda su vida.
- Más costoso que read committed.
- El nivel por defecto en MySQL/InnoDB.

```text
Repeatable read:

T1: START TRANSACTION
T1: READ x → 10
T2: UPDATE x = 20  (no afecta al snapshot de T1)
T2: COMMIT
T1: READ x → 10 (mismo valor)
T1: COMMIT
```

### Serializable

- Garantiza que el resultado es equivalente a una ejecución **una a una**.
- El más seguro. El más lento (mucha sobrecarga).

```text
Serializable:

Equivalente a ejecutar las transacciones
una tras otra, en algún orden.
```

## Comparación de niveles

| Nivel | Dirty read | Non-repeatable | Phantom | Lost update |
|---|---|---|---|---|
| Read uncommitted | Posible | Posible | Posible | Posible |
| Read committed | No | Posible | Posible | Posible |
| Repeatable read | No | No | Posible | No |
| Serializable | No | No | No | No |

> [!tip> El nivel por defecto es suficiente
> Para la mayoría de aplicaciones, **read committed** es suficiente. Subir a serializable solo si las anomalies importan al negocio.

## Implementaciones del isolation

### 1. Locks pesimistas

La forma más simple: bloquear lo que se lee o escribe.

```text
Lock pesimista:

T1: LOCK x
T2: pide LOCK x → espera
T1: UPDATE x
T1: COMMIT
T2: obtiene LOCK x
T2: UPDATE x
```

**Ventajas**: simple.
**Limitaciones**: latencia, riesgo de deadlock.

### 2. Two-phase locking (2PL)

Todas las adquisiciones de locks **antes** de todas las liberaciones.

```text
2PL:

Growing phase: solo acquires.
Shrinking phase: solo releases.

T1: LOCK a, LOCK b
T1: USE a, b
T1: UNLOCK a, UNLOCK b
T2:           LOCK a, b
```

### 3. Snapshot isolation (MVCC)

Cada transacción ve un **snapshot** de la base al inicio.

```text
MVCC:

T1: BEGIN, snapshot en t=0
T2: UPDATE x = 20 a t=1
T1: READ x → 10 (snapshot t=0)
T1: WRITE x → 11 (basado en el valor del snapshot)
T1: COMMIT
```

**Ventajas**: lecturas no bloquean escrituras.
**Limitaciones**: escribe-escribe conflictos.

### 4. Serializable snapshot isolation (SSI)

Variante optimizada de MVCC que detecta **conflictos** que podrían causar anomalies.

```text
SSI:

T1: lee x, escribe y
T2: lee y, escribe x

SSI detecta el ciclo y aborta una transacción.
```

> [!tip> SSI es la tendencia actual
> Postgres desde 9.1, CockroachDB, FoundationDB usan SSI. Es el sweet spot: casi tan rápido como MVCC, casi tan seguro como 2PL.

## Lock y deadlock

El libro advierte sobre los **deadlocks**:

```text
Deadlock:

T1: tiene lock A, pide lock B
T2: tiene lock B, pide lock A
         │
         ▼
    ambos esperan
```

### Soluciones

- **Prevención**: adquirir locks en un orden consistente.
- **Detección**: mantener un grafo de espera, abortar ciclos.
- **Timeouts**: si una transacción tarda demasiado, abortarla.

## Transaction isolation en la práctica

El libro cuantifica los trade-offs:

```text
Throughput relativo:

Read uncommitted:  100% (rarely used)
Read committed:    95-99%
Repeatable read:   80-95%
Serializable:      50-80%
```

> [!danger> Serializable sale caro
> Subir de read committed a serializable puede **dividir por dos** el throughput. Merece la pena solo si las anomalies cuestan más.

## Resumen en tres frases

- Las transacciones ofrecen **garantías** (atomicity, isolation, durability) que simplifican el código de aplicación.
- Los **niveles de aislamiento** son el trade-off entre consistencia y rendimiento. Read committed es el sweet spot habitual.
- Las implementaciones modernas (**MVCC, SSI**) son casi tan seguras como las pesimistas y mucho más rápidas.

## Próximos pasos

- [[12-transactions-distributed|Transactions: distributed]]: las transacciones en sistemas distribuidos. 2PC, XA, consensus en el commit, exactly-once semantics.
