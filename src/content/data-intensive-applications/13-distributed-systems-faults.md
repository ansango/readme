---
title: "The trouble with distributed systems: faults y redes"
description: "Por qué los sistemas distribuidos fallan: partial failures, unreliable networks, TCP, timeouts y los escenarios más sutiles"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, distributed, faults, networks, tcp, timeouts]
---

# The trouble with distributed systems: faults y redes

> [!abstract] Resumen
> La observación más importante del libro: **los sistemas distribuidos son intrínsecamente poco fiables**. No porque la tecnología sea mala, sino porque están compuestos de partes que se comunican por una red que **falla**. Esta nota cubre los tipos de fallos, las limitaciones de TCP, los timeouts y los patrones que las aplicaciones deben implementar para robustez.

## Lo que diferencia un sistema distribuido de uno single-node

El libro abre con la observación más importante del libro (un eco de la que ya usamos en esta wiki):

> "Los sistemas distribuidos son aquellos en los que el fallo de un nodo del que nunca has oído hablar impide que tu propio código funcione."

```text
Sistema single-node:

failure mode:
  - tu código tiene un bug
  - el sistema operativo se cuelga
  - el hardware falla

Sistema distribuido:

failure modes adicionales:
  - cualquier nodo remoto puede fallar
  - la red puede particionarse
  - los mensajes pueden llegar dos veces
  - los mensajes pueden no llegar nunca
  - los mensajes pueden llegar en otro orden
  - un nodo puede estar caído pero el resto no lo sabe
```

> [!note> Diseñar para fallos no es paranoia
> El libro insiste: en producción, los fallos ocurren. Diseñar asumiendo que todo va a funcionar es diseñar para que **todo falle** cuando algo falle.

## Faults vs failures

El libro distingue dos niveles:

- **Fault**: un componente tiene un problema.
- **Failure**: el **sistema** (no el componente) deja de funcionar.

```text
Fault → Failure?

Red se particiona (fault)
  → Node 1 no alcanza a Node 2
  → ¿El sistema sigue funcionando? (failure?)

Fault tolerance: el sistema sigue aunque haya faults.
```

> [!tip> El objetivo es fault tolerance
> No evitar los faults (imposible), sino **evitar las failures** (con un buen diseño).

## Tipos de fallos

El libro enumera los fallos típicos:

### Hardware

- **Disco duro**: sectores defectuosos, vibración, vida útil.
- **SSD**: vida útil limitada por escrituras.
- **RAM**: bit flips por radiación cósmica.
- **Switch**: muere, deja de enrutar.
- **Datacenter**: corte de energía, incendio, inundación.

### Software

- **Bug**: en una versión concreta, en una combinación concreta.
- **Bug propagación**: un componente bugueado afecta a los dependientes.
- **Memory leak**: consume memoria hasta el crash.
- **CPU spin**: proceso al 100% de CPU sin avanzar.

### Human

- **Operator error**: deploy con bug, config incorrecta.
- **Misconfiguration**: error en parámetros.
- **Accidental**: rm -rf accidental.

### Network

- **Packet loss**: subred saturada, switch malo.
- **Latency**: cola, ruta larga.
- **Partition**: dos nodos no se ven.
- **Split brain**: dos nodos creen ser el líder.

## Partial failures

El libro considera la **partial failure** como la propiedad definitoria de los sistemas distribuidos.

```text
Single-node failure:

Nodo cae → sistema deja de funcionar.
Failure: {sistema}.

Distributed partial failure:

Nodo 1 sigue activo.
Nodo 2 cae.
¿El sistema falla? ¿Qué partes?
```

> [!danger> La parcialidad es el problema
> En un sistema single-node, un fallo es **binario**: funciona o no. En un sistema distribuido, los fallos son **parciales**: cada nodo tiene su estado, y la combinación es incierta.

## Redes poco fiables

El libro dedica una sección a las **redes**, que trata como "best effort".

### Ethernet y TCP

TCP es **fiable** en teoría, pero en la práctica...

```text
TCP guarantees:

  - In-order delivery: los mensajes llegan en orden.
  - No duplication: no llegan duplicados.
  - Error detection: detecta errores y retransmite.

TCP does NOT guarantee:

  - Latency: el mensaje puede tardar 100ms o 10 segundos.
  - Delivery: las conexiones pueden cortarse.
  - No data loss: en la práctica, hay pérdida si la conexión se corta.
```

### Síntomas de la red

```text
Síntomas:                  Causa posible:
  - Sin respuesta             Switch muerto
  - Latencia alta              Subred congestionada
  - Conexión rechazada         Peer caído
  - Conexión cortada           Firewall, NAT timeout
```

> [!tip> La red puede mentir
> El libro advierte: la red **no te dice** si el mensaje llegó o no. Una conexión "estable" puede haber sido **reseteada por un NAT** que no te avisa.

## Detección de fallos

El libro describe los mecanismos de detección:

### 1. Timeouts

Si no recibes respuesta en un tiempo, asume que ha fallado.

```python
# Timeout simple
response = send_with_timeout(request, timeout=5)
if response is None:
    # Posible fallo
    handle_failure()
```

### 2. Heartbeats

Probes periódicos a nodos.

```text
Heartbeat:

Coordinator ──► "¿estás vivo?" ──► Node 1
Coordinator ◄── "sí" ──
```

**Ventajas**: detecta caídas rápidamente.
**Limitaciones**: la red puede tener falsas alarmas.

### 3. Acks (acknowledgments)

Esperar reconocimiento.

```text
Ack:

Node 1 ──► Comando ──► Node 2
Node 2 ──► Ack ──► Node 1
Node 1: confirmado
```

### 4. Tracing distribuido

Sistemas como **Jaeger** o **Zipkin** trazan requests a través del sistema.

```text
Trace:

Request ──► API ──► Service A ──► Service B ──► DB
0ms     5ms       15ms              50ms
```

> [!tip> El tracing es indispensable
> Sin tracing distribuido, debuggear un sistema distribuido es **imposible**. OpenTelemetry es el estándar.

## Timeouts

El libro dedica páginas al **timeout**, porque es la decisión más sutil.

### El problema del timeout

Si el timeout es **muy corto**: falsas alarmas.
Si el timeout es **muy largo**: detección de fallos lentos.

```text
Trade-off del timeout:

Timeout 1s:  rápido, muchas falsas alarmas.
Timeout 60s: lento, pocas falsas alarmas.
```

### Adaptive timeouts

Cassandra usa **timeouts adaptativos** que se ajustan al RTT observado.

```text
Adaptive timeout:

RTT observado: 50ms
Timeout: 50ms × 2 = 100ms

RTT observado: 500ms (red lenta)
Timeout: 500ms × 2 = 1000ms
```

### Phi accrual failure detector

Cassandra usa el **phi accrual** failure detector, que calcula una **probabilidad** de fallo basada en los heartbeats.

```python
# Phi accrual simplificado
last_heartbeat = t0
current_time = t1
heartbeat_interval = 10ms  # típico
arrival_interval = current_time - last_heartbeat

# Phi = log(...) en función del arrival interval
```

> [!tip> Phi accrual es elegante
> En vez de un booleano (vivo/muerto), Phi accrual devuelve un **valor continuo** (la probabilidad de que el nodo haya caído). El sistema decide el umbral según sus necesidades.

## Las trampas del networking

### TCP y el "double ack"

Si se retransmite un paquete, el receptor puede recibir **dos copias**. El emisor puede **no darse cuenta** y reenviar.

```text
Double ack:

Emisor ──► packet 1 ──► Receptor (ack 1)
Emisor ──► packet 1 (retransmit) ──► Receptor (ack 1)
Emisor: piensa que está hablando con dos receptores.
```

### TCP y los NAT timeouts

Los NAT cierran conexiones **después de un tiempo** de inactividad. Si el cliente no envía nada, el NAT tira la conexión.

```text
NAT timeout:

Cliente ──► NAT ──► Servidor
         ↑ 5 min idle
NAT: cierra la conexión
Cliente: conexión rota ✗
```

### TCP y los firewalls

Los firewalls pueden **rechazar** paquetes que no reconocen. A veces la conexión se corta sin aviso.

## Patrones para robustez

El libro enumera los patrones que un sistema distribuido debe implementar:

### 1. Timeouts en todas las operaciones

```python
# Mal
result = other_service.do_thing()

# Bien
result = other_service.do_thing(timeout=5)
```

### 2. Retries con backoff

```python
def with_retries(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except (Timeout, ConnectionError):
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # exponential backoff
```

### 3. Circuit breaker

Si un servicio falla mucho, deja de llamarlo.

```text
Circuit breaker:

Closed    → normal
Open      → no llamar, devolver error
Half-open → probar una vez, decidir
```

### 4. Bulkhead

Aislar los recursos para que un fallo no se propague.

```text
Bulkhead:

Pool A: 10 conexiones a servicio X
Pool B: 10 conexiones a servicio Y
         │
   Pool A cae → Pool B sigue funcionando
```

### 5. Idempotency keys

Permitir retries seguros.

```python
def transfer_money(from, to, amount, idempotency_key):
    if cache.exists(f"transfer:{idempotency_key}"):
        return cache.get(f"transfer:{idempotency_key}")
    
    result = do_transfer(from, to, amount)
    cache.set(f"transfer:{idempotency_key}", result)
    return result
```

## Casos de estudio: fallos famosos

El libro menciona algunos casos famosos:

### AWS S3 outage (2017)

Operador escribió un comando mal. Se borró mass de objetos. Sistema caído horas.

**Lección**: los commandos administrativos deben requerir **doble confirmación**.

### GitLab database deletion (2017)

Caché mal configurada. Réplica se borró. Cinco minutos de datos perdidos.

**Lección**: las copias de seguridad deben ser **inmutables**.

### Knight Capital (2012)

Bug en un deploy automatizado. Una máquina usó código viejo. $440M perdidos en 45 minutos.

**Lección**: los deploys deben ser **canary** y **reversibles**.

> [!tip> Los fallos son inevitables
> El libro no intenta asustar con estos ejemplos. Lo que intenta es mostrar que **la historia importa** y los buenos diseños deben asumir que los fallos ocurrirán.

## Diseño robusto

El libro cierra con un **checklist** de robustez:

```text
Diseño robusto:

☐ Timeouts en todas las llamadas externas.
☐ Retries con backoff exponencial.
☐ Circuit breakers en servicios remotos.
☐ Bulkheads para aislamiento.
☐ Idempotency keys en operaciones no idempotentes.
☐ Tracing distribuido.
☐ Health checks.
☐ Dead letter queues para mensajes fallidos.
☐ Backups con restore probado.
☐ Chaos engineering (romper cosas a propósito).
```

## Resumen en tres frases

- Los sistemas distribuidos fallan **de maneras parciales**: un nodo cae, otro no, la red se rompe, los mensajes se pierden.
- La detección de fallos es **imperfecta**: timeouts, heartbeats y acks son aproximaciones. Phi accrual es la mejor implementación moderna.
- Los patrones de robustez (timeouts, retries, circuit breakers, idempotency) son obligatorios, no opcionales.

## Próximos pasos

- [[14-distributed-systems-clocks|The trouble with distributed systems: clocks y conocimiento]]: la otra cara del problema. Los relojes no son fiables, los procesos se pausan, "el conocimiento" en sistemas distribuidos es más sutil de lo que parece.
