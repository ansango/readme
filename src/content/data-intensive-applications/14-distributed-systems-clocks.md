---
title: "The trouble with distributed systems: clocks y conocimiento"
description: "Los relojes de los sistemas distribuidos no son fiables, los procesos se pausan, y 'el conocimiento' entre nodos es más sutil de lo que parece"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, distributed, clocks, time, logical-clocks, vector-clocks]
---

# The trouble with distributed systems: clocks y conocimiento

> [!abstract] Resumen
> El libro dedica dos capítulos al "trouble with distributed systems" y este segundo nota cubre los relojes, los process pauses y la noción de "conocimiento" en sistemas distribuidos. La idea central: los relojes son **imprecisos**, los procesos se **pausan**, y los nodos nunca pueden estar seguros de lo que otros saben.

## Por qué los relojes importan

El libro arranca con una observación incómoda: si tu sistema distribuido usa **wall clocks** (relojes de pared) para ordenar eventos, estás confiando en que **todos los nodos tienen el mismo reloj**. Y eso no es cierto.

```text
El problema:

Nodo 1 (Madrid):   t = 10:00:00.500
Nodo 2 (Nueva York): t = 10:00:00.503
Nodo 3 (Tokio):    t = 10:00:00.498

¿Cuál fue primero?
```

> [!danger> Asumir sincronización es un error común
> NTP (Network Time Protocol) sincroniza relojes con precisión de **milisegundos**, pero en sistemas de alta carga esa precisión **no basta**.

## Por qué los relojes fallan

El libro enumera las causas de la **imprecisión**:

### 1. Quartz clocks

Los relojes de los servidores son **osciladores de cuarzo**. Su frecuencia depende de la temperatura, vibración, y la edad del cristal.

```text
Drift típico:

  Buen reloj: 1 segundo de drift por día
  Reloj malo: 1 segundo de drift por hora

En una red distribuida, los relojes **divergen** constantemente.
```

### 2. NTP

NTP sincroniza relojes sobre la red. Pero:

- **Latencia**: la sincronización sufre la latencia de la red.
- **Asimetría**: el camino de ida y de vuelta pueden tener tiempos distintos.
- **Salto de segundos**: cada vez que se añade un leap second, los relojes pueden tener bugs.

```text
NTP precision:

- Mejor caso:  ~1ms
- Caso típico: ~10-100ms
- Peor caso:  varios segundos
```

> [!tip> NTP no es infalible
> El libro es claro: **asumir NTP como verdad absoluta es un error**. Mucho software robusto (Cassandra, DynamoDB) no depende de NTP para ordenación.

### 3. Falsos positivos

Los relojes pueden **saltar hacia atrás** o hacia adelante por:

- **Operación de un administrador**: ntpdate puede saltar el reloj.
- **Reanudar de sleep**: el proceso se despierta con un reloj distinto.
- **Bugs**: el kernel puede tener un bug que produce un salto.

```text
Salto de reloj (NTP correction):

t=10:00:00.000
  NTP: salta a t=10:00:00.001 para corregir
  No fue instantáneo: 1ms perdida
```

### 4. Relojes virtuales

Máquinas virtuales, containers, sandboxes: los relojes están **mediados** por el hypervisor.

```text
VM clock:

Host: 10:00:00.000
VM: 10:00:00.000 (al iniciar)
... 1 hora después:
Host: 11:00:00.000
VM: 10:00:00.000 (si no hay sincronización)
```

## Synchronous vs asynchronous networks

El libro distingue:

### Red sincrónica (teórica)

- **Latencia acotada**: la red garantiza que un mensaje llega en menos de T.
- **Útil**: facilita algoritmos distribuidos.
- **No existe**: las redes reales no garantizan esto.

### Red asíncrona (real)

- **Latencia variable**: la red no garantiza nada.
- **Realista**: es el modelo que tenemos.
- **Difícil**: requiere algoritmos que toleren tiempos arbitrarios.

> [!tip> Diseña para la red asíncrona
> El libro es claro: **asume que la red es asíncrona**. Si los algoritmos funcionan en ese modelo, funcionarán en el real.

## Relojes monotónicos

El libro recomienda **relojes monotónicos** cuando sea posible.

```python
# Monotonic clock
import time

t1 = time.monotonic()
# ... tiempo después ...
t2 = time.monotonic()

# Garantía: t2 >= t1
```

### Características

- **Mono**: nunca retrocede.
- **Relativo**: mide desde un punto arbitrario (no el epoch).
- **Adecuado para**: medir duraciones, no para fechas absolutas.

```text
Wall clock vs monotonic:

                       Go backwards?     Sync between nodes?
Wall clock (time.time):    YES (with NTP)        YES (with NTP)
Monotonic (time.monotonic): NO                    NO
```

> [!tip> Para medir duración, usa monotonic
> El libro insiste: si mides tiempo transcurrido, **monotonic**. Si necesitas el wall clock (para mostrar al usuario), **solo convierte al final**.

## Lamport timestamps

**Leslie Lamport** (1978) introdujo una forma de ordenación de eventos en sistemas distribuidos.

```text
Cada evento tiene un timestamp (counter, nodo).
Reglas:
  - Counter local se incrementa en cada evento.
  - Al enviar, se incluye el counter.
  - Al recibir, counter = max(local, received) + 1.
```

```python
class LamportClock:
    def __init__(self, node_id):
        self.counter = 0
        self.node_id = node_id
    
    def tick(self):
        self.counter += 1
        return self.counter
    
    def update(self, received_counter):
        self.counter = max(self.counter, received_counter)
```

### Limitaciones

**No captura causalidad**: si un Lamport timestamp de evento A es menor que el de B, no sabemos si A causó B.

```text
Ejemplo:

Nodo 1: evento A (Lamport: 1)
Nodo 2: recibe de 1 (Lamport: 2)
Nodo 2: evento B (sin A relacionado) (Lamport: 3)

¿A causó B? No sabemos. Lamport solo dice "B está después".
```

## Vector clocks

Para capturar **causalidad**, los vector clocks.

```text
Vector clock = {nodo1: c1, nodo2: c2, ...}

Reglas:
  - En cada evento local, incrementar counter del propio nodo.
  - Al enviar, incluir el vector clock.
  - Al recibir, hacer element-wise max.
```

```python
class VectorClock:
    def __init__(self, nodes):
        self.clocks = {n: 0 for n in nodes}
    
    def tick(self, node):
        self.clocks[node] += 1
        return self.clocks
    
    def update(self, other):
        for n in self.clocks:
            self.clocks[n] = max(self.clocks[n], other[n])
        self.clocks[node] += 1  # también en mensaje
```

### Detección de conflictos

Dos eventos con vector clocks **no comparables** son **concurrentes**.

```text
Conflicto:

Event A: {1: 1, 2: 0}
Event B: {1: 0, 2: 1}

Comparación:
  A.clocks[1] = 1, B.clocks[1] = 0 → A después
  A.clocks[2] = 0, B.clocks[2] = 1 → B después
  ¡Contradicción! → Eventos concurrentes.
```

> [!tip> Vector clocks son el gold standard
> Dynamo, Riak, Cassandra usan vector clocks. Pero el libro señala que **la mayoría de los sistemas actuales prefieren LWW** (timestamp) por simplicidad.

## Process pauses

El libro introduce un problema sutil: **los procesos se pausan**.

```text
Process pause:

1. Proceso 1 escribe x = 1 (commit a disco).
2. Proceso 1 se pausa (GC, scheduler, etc.).
3. Proceso 1 se reanuda 30 segundos después.
4. Proceso 1 piensa que "no ha pasado nada", pero...
   - el reloj ha avanzado 30 segundos.
   - el nodo 2 puede haber escrito x = 2.
```

### Causas de pausas

- **Stop-the-world GC**: el proceso se pausa durante la GC.
- **Scheduler**: el sistema operativo puede suspender el proceso.
- **Hypervisor**: en VMs, el hypervisor puede suspender la VM.
- **Network**: el proceso espera I/O de red.

### VM clock jumping

El libro describe un caso famoso: **VMware corrects the clock** después de reanudar una VM. Esto puede **romper** los timestamps en la aplicación.

```text
VM scenario:

  t1: VM pausada
  t2: 10 minutos después, VM reanudada
  hypervisor: "corrijo" el reloj para que coincida con el real
  aplicación: "¡¿pero si pasaron 10 minutos?!"
```

> [!note> Los relojes no son lo que parecen
> El libro insiste: cualquier uso de **wall clock** para ordenación es frágil. La disciplina es **diseñar para que los saltos no importen**.

## Conocimiento distribuido

El libro introduce un punto filosófico: **el conocimiento entre nodos es problemático**.

### El problema

Si el nodo A **cree** que el nodo B ha procesado un mensaje, ¿cómo lo sabe?

```text
Escenario:

A ──► mensaje ──► B
A ◄── ¿ack? ──

A: "B tiene mi mensaje"
A: "pero no estoy seguro"
```

### La verdad eventual

El libro usa la frase de Lamport: "**happens-before**" define la causalidad.

```text
happens-before:

  - En un nodo, los eventos se ordenan por tiempo.
  - Entre nodos, un envío "happens-before" su recepción.
  - La transitividad: si a happens-before b, y b happens-before c, entonces a happens-before c.
```

### Knowledge: tests

El libro describe los **tests** que un nodo puede hacer para saber si tiene conocimiento:

```text
Test de conocimiento:

Para saber si el nodo B recibió un mensaje:
  - Reenviar mensajes hasta que B envíe ack.
  - Asumir que B tiene el mensaje cuando B ya responde con el siguiente.
```

### Synchronous vs asynchronous

El libro cierra con una distinción importante:

- **Sistema síncrono**: los nodos tienen un **reloj global** y bounded latencia.
- **Sistema asíncrono**: nada está garantizado.

> [!tip> Asume asynchronous
> El libro recomienda diseñar siempre para sistemas asíncronos. Si funciona en ese modelo, funcionará en cualquier red.

## El conocimiento distribuido y los problemas que crea

El libro enumera los problemas derivados del conocimiento imperfecto:

### 1. Fencing tokens

Si un nodo cae y se reanuda, no debe escribir sin haber confirmado que su estado es actual.

```text
Fencing:

Nodo A: lease expira
        (nodo A no sabe que otros le dan trabajo)
Nodo B: emite lease con token=42
Nodo B: emite lease con token=43
Nodo A: reanimado, intenta escribir con token=41 (viejo)
Sistema: rechaza, el token es antiguo
```

### 2. Lease y renewal

Los **leases** son locks con tiempo de expiración. El cliente debe **renovarlos** antes de que expiren.

```text
Lease:

Cliente: "lease por 30s"
Servidor: tok=42, exp=30s
Cliente: "renovar" (cada 10s)
Si no renueva, lease expira, otro pueda tomarlo.
```

### 3. Leader election

Si el leader cae, los seguidores necesitan **elegir** uno nuevo. Esto requiere [[15-consistency-and-consensus|consensus]].

## Cómo gastar tiempo y clicar el conocimiento

El libro cierra con una frase que merece recordar:

> "El conocimiento en sistemas distribuidos es como el precio: todos hablan de él, pero pocos lo entienden."

El **conocimiento** entre nodos no es como el estado local. Es siempre **incompleto**, **temporal** y susceptible de **revisión** cuando llega un mensaje.

```text
El conocimiento es:

  - Incompleto: nunca sabes "todo" sobre otros nodos.
  - Temporal: tu conocimiento puede caducar.
  - Revisable: cuando un mensaje llega, puede cambiar.
```

> [!tip> Diseña asumiendo conocimiento incompleto
> Cualquier componente que dependa de un estado "estable" en otro nodo es **frágil**. Diseña para que la **incertidumbre** sea **tolerada**.

## Resumen en tres frases

- Los **relojes** de los sistemas distribuidos son imprecisos por naturaleza. Diseña con **monotonic clocks** para duraciones, desconfía de los wall clocks.
- Los **vector clocks** capturan causalidad; los **Lamport timestamps** solo ordenan. LWW es la simplificación habitual.
- El **conocimiento** entre nodos es incompleto y temporal. Los sistemas robustos lo asumen y diseñan fencing, leases y tolerancias.

## Próximos pasos

- [[15-consistency-and-consensus|Consistency and consensus]]: la cúspide del problema. Linearizability, consensus distribuido (Paxos, Raft) y la verdadera garantía de "todos los nodos ven los mismos datos".
