---
title: "Replication: single-leader"
description: "La estrategia de replicación más común: un nodo líder, varios seguidores. Sincronización, asynchronous vs synchronous, replication lag y problemas derivados"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, replication, single-leader, consensus, distributed]
---

# Replication: single-leader

> [!abstract] Resumen
> La estrategia de replicación más común es tener **un nodo líder** que acepta todas las escrituras y **varios seguidores** que las replican. Esta nota cubre cómo funciona, los trade-offs entre synchronous y asynchronous, los problemas derivados del replication lag y los casos extremos.

## Por qué replicar

El libro arranca con la pregunta más simple: ¿para qué tener **copias** de los datos?

Cuatro razones:

1. **Disponibilidad**: si un nodo cae, otros siguen sirviendo.
2. **Latencia**: tener réplicas cerca de los usuarios reduce la latencia.
3. **Throughput**: distribuir reads entre réplicas escala la capacidad.
4. **Durabilidad**: una copia en otra región protege contra desastres.

```text
Réplica simple:

┌──────────┐
│  App     │
└────┬─────┘
     │
     ▼
┌──────────┐
│  Node 1  │ ── primario
└────┬─────┘
     │ replicación
     ▼
┌──────────┐
│  Node 2  │ ── réplica
└──────────┘
```

> [!note> Replicar no es gratis
> Cada copia adicional es un **coste**: almacenamiento extra, ancho de banda para sincronización, complejidad operativa. No se replica por defecto.

## Single-leader replication

El patrón dominante. Funciona así:

1. Una de las réplicas es designada **líder** (también llamada primary, master).
2. Las demás son **seguidores** (followers, replicas, secondaries).
3. Las escrituras van solo al líder.
4. El líder envía un **log de cambios** a los seguidores.
5. Los seguidores aplican los cambios en el mismo orden.

```text
Single-leader replication:

         ┌────────────┐
         │   Leader   │
         │  (writes)  │
         └─────┬──────┘
               │ log
       ┌───────┼───────┐
       ▼       ▼       ▼
  ┌────────┐┌────────┐┌────────┐
  │Follow 1││Follow 2││Follow 3│
  │ (reads)││(reads)││ (reads)│
  └────────┘└────────┘└────────┘
```

### Propiedades

- **Una sola fuente de verdad**: el líder.
- **Lecturas**: pueden ir a cualquier réplica.
- **Escrituras**: solo al líder.
- **Consistencia**: si el líder se cae, hay un **nuevo líder**.

## Implementación del log de replicación

El libro describe tres formas de replicar:

### 1. Statement-based replication

El líder envía las **queries SQL** que ejecutó.

```sql
-- El líder ejecuta:
INSERT INTO users (id, name, email) VALUES (1, 'Ana', 'a@x.com');
-- El seguidor ejecuta la misma query.
```

**Ventajas**: simple.
**Limitaciones**: las queries no deterministas (NOW(), RAND()) dan resultados distintos.

### 2. Write-ahead log (WAL) shipping

El líder envía las **escrituras de bajo nivel** (bytes modificados).

```text
Líder: pg_wal contiene "modify page 123 with bytes ..."
Seguidor: aplica la misma modificación.
```

**Ventajas**: exacto.
**Limitaciones**: acoplamiento con el formato de almacenamiento.

### 3. Logical log (row-based) replication

El líder envía **cambios en formato lógico**.

```protobuf
message Change {
    string table = 1;
    int64 id = 2;
    Row before = 3;
    Row after = 4;
}
```

**Ventajas**: desacoplado del formato de almacenamiento.
**Limitaciones**: más lento que WAL, más complejo.

### 4. Trigger-based replication

El usuario define **triggers** que se ejecutan al cambiar.

```sql
CREATE TRIGGER log_change
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION log_to_queue();
```

**Ventajas**: flexible.
**Limitaciones**: overhead, fácil de olvidar.

## Sincronización

El libro distingue tres modos:

### Synchronous replication

El líder espera a que **todos los seguidores** confirmen antes de responder.

```text
Cliente ──► Líder ──► Follower 1 ──ack──► Líder ──► Cliente
                  ──► Follower 2 ──ack──► Líder
                  ──► Follower 3 ──ack──► Líder
```

**Ventajas**: garantiza que los datos están en todas las réplicas.
**Limitaciones**: latencia = la del seguidor más lento. Si uno cae, el líder no acepta escrituras.

### Asynchronous replication

El líder responde **antes** de que los seguidores confirmen.

```text
Cliente ──► Líder ──► Cliente
                  ──► Follower 1 (ack después)
                  ──► Follower 2 (ack después)
```

**Ventajas**: latencia baja.
**Limitaciones**: si el líder cae antes de replicar, los datos se pierden.

### Semi-synchronous

El líder espera a **al menos uno** de los seguidores.

```text
Cliente ──► Líder ──► Follower 1 ──ack──► Cliente
                  ──► Follower 2 (async)
```

**Ventajas**: buen balance.
**Limitaciones**: aún se pueden perder datos.

> [!tip> El trade-off fundamental
> Más synchronous = más seguro pero más lento.
> Más asynchronous = más rápido pero menos seguro.
> Semi-synchronous = balance habitual.

```text
Trade-off sincronización:

            Safety
              ▲
              │
              │
  ●           │           ●
  Async                Sync
              │
              │
              └──────────────────► Latency
```

## Configuración de nuevos seguidores

¿ Cómo se añade un nuevo seguidor al sistema?

1. **Snapshot**: tomar una copia del estado del líder.
2. **Catch-up**: aplicar los cambios que ocurrieron durante el snapshot.
3. **Live**: seguir al líder en tiempo real.

```text
Nuevo follower:

1. Snapshot ──► Catch-up ──► Live
                      ▲
                      │
                   log de cambios
                   desde el líder
```

## Failover del líder

Si el líder se **cae**, hay que elegir uno nuevo:

```text
Pasos del failover:

1. Detección: ¿el líder está caído?
   (timeout, mensaje perdido, etc.)

2. Selección: ¿qué seguidor será el nuevo líder?
   (el que tenga el log más actualizado)

3. Reconfiguración: los clientes y seguidores
   deben apuntar al nuevo líder.
```

### Split brain

**El riesgo principal**: dos seguidores creen que son el líder.

```text
Split brain:

        ┌──────────┐
        │ Leader A │ (caído)
        └──────────┘
              ▲
              │ ambos creen ser líder
              │
        ┌──────────┐
        │ Leader B │
        └──────────┘
```

> [!danger> Split brain es desastroso
> Si dos líderes aceptan escrituras, los datos se **dividen**. La resolución requiere **detección manual** y puede incluir pérdida de datos.

## Replication lag

El **replication lag** es el tiempo entre que el líder escribe y los seguidores la replican.

```text
Tiempo:

Líder:    ──w1──w2──w3──w4──►
Follower: ──w1──w2──  (lag)
                  en este punto, w3 y w4 no están en el follower
```

### Problemas derivados del lag

#### 1. Lectura no actualizada

El usuario lee del follower y no ve su propia escritura.

```text
Usuario escribe 'Ana' en leader.
Usuario recarga la página → lee de follower.
El follower no tiene 'Ana' todavía.
La página dice "no tienes posts". 😢
```

#### 2. Lectura monotónica

El usuario lee de follower A, luego de follower B. Los datos "van hacia atrás".

```text
Momento 1: usuario lee de follower A → 'Ana' (¿no existe?)
Momento 2: usuario lee de follower B → 'Ana' existe
```

#### 3. Read-your-writes

El usuario escribe y luego lee. La lectura puede no ver la escritura.

#### 4. Causas y efectos

Escribir 'A' y luego 'B'. La lectura de 'B' puede llegar al follower antes que la de 'A'.

## Soluciones para el lag

El libro discute varias soluciones:

### 1. Read-your-writes consistency

El usuario siempre lee desde el **líder** (o desde un follower que ha replicado su última escritura).

```text
Solución: trackear la escritura del usuario y leer
del follower que la tiene.

┌──────────┐
│  User    │
└────┬─────┘
     │ write
     ▼
┌──────────┐
│ Leader   │
└────┬─────┘
     │ replicación
     ▼
┌──────────┐
│ Follower │ ← user lee aquí
└──────────┘
```

### 2. Monotonic reads

Cada usuario lee **siempre del mismo follower**.

```text
Solución: routing consistente por usuario.

User 1 ──► Follower A
User 2 ──► Follower B
User 3 ──► Follower A
```

### 3. Consistent prefix reads

Si escribes 'A' y luego 'B', el usuario que lee ambos los ve en orden.

```text
Write A → write B → ambos llegan al follower en orden.
```

### 4. Causality

El libro enfatiza la **causalidad**: las escrituras que dependen unas de otras deben verse en orden.

## Lag en la práctica

El libro cuantifica los problemas con ejemplos:

```text
Timeline:

t=0: líder escribe w1
t=1: usuario lee de follower (no ve w1, lag)
t=2: líder escribe w2
t=3: usuario lee de follower (no ve w2, lag)
t=4: w1 llega al follower
t=5: w2 llega al follower

A partir de t=4, los reads son consistentes.
```

> [!tip> El lag suele ser < 1 segundo
> En sistemas bien configurados, el lag se mide en **decenas de milisegundos**. Pero bajo carga, puede dispararse a **segundos** o más.

## Detección del lag

El libro menciona que detectar el lag es sorprendentemente difícil:

- **Heartbeat**: el líder pregunta a los seguidores por su posición.
- **Lag calculado**: la diferencia entre el log del líder y el del follower.

```text
Detección:

Líder:     "Estoy en log position 1000"
Follower:  "Estoy en log position 995"
Lag = 5 entradas
```

## Resumen en tres frases

- La **single-leader replication** es el patrón dominante: un líder para escribir, varios seguidores para leer.
- El **trade-off fundamental** es synchronous (seguro, lento) vs asynchronous (rápido, arriesgado).
- El **replication lag** causa problemas sutiles de consistencia: read-your-writes, monotonic reads, consistent prefix.

## Próximos pasos

- [[09-replication-multi-leader-leaderless|Replication: multi-leader y leaderless]]: las estrategias más exóticas. Multi-leader para conflictos geográficos, leaderless para alta disponibilidad con quorum.
