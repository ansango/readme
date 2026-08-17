---
title: "Stream processing"
description: "Cómo procesar datos que llegan continuamente: event streams, message brokers, change data capture, joins en streaming y la gestión de estado"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, stream, kafka, flink, cdc, event-streaming]
---

# Stream processing

> [!abstract] Resumen
> El **stream processing** es el paradigma para tratar datos que llegan **continuamente**: cada evento se procesa pocos milisegundos después de producirse. Esta nota cubre los event streams, los message brokers (Kafka, Pulsar), el change data capture (CDC), las queries continuas, los joins en streaming y la gestión de estado.

## El paradigma stream

El libro define el stream processing por contraposición al batch:

```text
Batch:

  Input ──► Process ──► Output
  Latencia: minutos-horas
  Volumen: histórico

Stream:

  Input continuo ──► Process continuo ──► Output continuo
  Latencia: ms-seg
  Volumen: infinito
```

> [!note> Stream es para datos que ocurren
> El batch es para datos que **ya ocurrieron**. El stream es para datos que **están ocurriendo**. Si los datos futuros importan, necesitas stream.

## Tipos de streams

El libro distingue tres tipos:

### 1. Logs de actividad

```text
User activity stream:

  login   /products
  click   /products/123
  scroll  /products/123
  ...
```

Eventos generados por **usuarios** o **sistemas**.

### 2. Cambios en bases de datos

```text
Database change stream:

  INSERT INTO users (1, "Ana")
  UPDATE users SET name = "Anna" WHERE id = 1
  DELETE FROM users WHERE id = 1
```

Log de cambios en una base de datos (**change data capture**).

### 3. Streams de mensajes

```text
Message stream:

  ping.check
  ping.check
  ping.check
```

Mensajes entre servicios asíncronos.

## Message brokers

El libro introduce los **message brokers** como infraestructura básica de los streams.

### Kafka

El actor dominante. Arquitectura:

```text
Kafka:

  Producer ──► Topic ──► Consumer
  Producer ──► Topic ──► Consumer
  Producer ──► Topic ──► Consumer
  
  Topic particionado en N shards.
  Cada shard es un log ordenado.
```

```python
# Kafka producer
from kafka import KafkaProducer
producer = KafkaProducer(bootstrap_servers='localhost:9092')
producer.send('topic', b'hola')
```

```python
# Kafka consumer
from kafka import KafkaConsumer
consumer = KafkaConsumer('topic')
for message in consumer:
    print(message.value)
```

### Otros message brokers

- **RabbitMQ**: tradicional, AMQP.
- **Pulsar**: alternativa moderna a Kafka.
- **NATS**: ligero, para microservicios.
- **Kinesis** (AWS): managed, similar a Kafka.
- **Event Hubs** (Azure): managed, similar.
- **Pub/Sub** (GCP): managed, similar.

> [!tip> Kafka dominó el campo
> Por arquitectura (log partitioned), comunidad, herramientas. Es la elección por defecto para streams.

## Change data capture (CDC)

El libro dedica atención especial al **CDC**: capturar cambios de una base de datos y emitirlos a un stream.

```text
CDC:

  OLTP DB ──► transaction log ──► Kafka topic ──► consumers
```

### Implementaciones

- **Debezium**: la opción open-source.
- **Kafka Connect**: framework para CDC.
- **AWS DMS**: managed.
- **Striim**: comercial.

```sql
-- Debezium lee el binlog de MySQL
-- y emite eventos a Kafka
```

> [!tip> CDC es el pegamento
> CDC es la pieza que **conecta** bases operacionales con sistemas de streaming. Sin CDC, los datos de producción están atrapados en la base.

## Logs vs message brokers

El libro describe la diferencia:

```text
Message broker (RabbitMQ):

  - Mensajes entregados a consumers.
  - Mensajes eliminados tras ack.
  - Push model.

Log (Kafka):

  - Mensajes persistidos en disco.
  - Consumers mantienen offset.
  - Pull model.
```

> [!tip> Kafka es un log, no solo un broker
> Lo que distingue a Kafka es que los mensajes **persisten**. Esto permite reprocesar, varios consumers, retención.

## Procesamiento de streams

### Stream processors

Los sistemas que procesan los eventos:

```text
Stream processors:

- Kafka Streams (parte de Kafka).
- Apache Flink (stateful, scalable).
- Apache Spark Streaming.
- Google Cloud Dataflow.
- Amazon Kinesis Data Analytics.
- Apache Beam (SDK unificado).
```

### Stateless vs stateful

#### Stateless

El processor no guarda estado entre eventos.

```python
def process(event):
    if event['type'] == 'click':
        emit_event('analytics', event)
```

#### Stateful

El processor guarda estado (contadores, ventanas, etc.).

```python
class ClickCounter:
    def __init__(self):
        self.counts = {}
    
    def process(self, event):
        url = event['url']
        self.counts[url] = self.counts.get(url, 0) + 1
        emit(self.counts[url])
```

> [!note> El estado es difícil
> El estado en sistemas distribuidos requiere **persistencia** (no se pierde si el processor cae) y **consistencia** (todos los nodos ven el mismo estado).

## Windowing

El libro cubre las **ventanas** como herramienta básica del stream processing.

```text
Tipos de ventana:

Tumbling:
  [00:00-00:10] [00:10-00:20] [00:20-00:30]
  No overlap, fixed size.

Sliding:
  [00:00-00:10] [00:05-00:15] [00:10-00:20]
  Overlap, sliding.

Session:
  Window per user, closes after inactivity.
```

### Tumbling window

```text
Tumbling:

  Event: 00:03, url=A
  Event: 00:05, url=A
  Event: 00:12, url=B

  Window [00:00-00:10]:
    A: 2

  Window [00:10-00:20]:
    B: 1
```

> [!tip> La elección de ventana es crítica
> Si la ventana es muy corta, los números son inestables. Si es muy larga, la latencia es alta.

## Joins en streaming

El libro introduce los joins sobre streams, que son más complejos que los joins batch.

### Stream-table join

```text
Stream-table join:

  Stream: click events
  Table: user data (cached)

  Output: click event with user info
```

### Stream-stream join

```text
Stream-stream join:

  Stream A: search events
  Stream B: click events

  Output: matched pairs (search + click)
```

> [!tip> Los joins en streaming son difíciles
> El libro es claro: los joins en stream **asumen orden temporal**. Si los eventos llegan desordenados, los joins son incorrectos.

## Fault tolerance

El libro describe los mecanismos de tolerancia a fallos:

### 1. Checkpointing

El processor guarda **snapshots** de su estado periódicamente.

```text
Checkpointing:

  [Estado 1] [Estado 2] [Estado 3]
       t1      t2      t3

Si falla, restaurar el último snapshot.
```

### 2. Exactly-once processing

Como vimos en [[12-transactions-distributed|transactions distributed]], la garantía exactly-once requiere **idempotencia + dedup**.

En Flink, esto se logra con **two-phase commit sinks**.

```python
# Flink + Kafka con exactly-once
env.enable_checkpointing(1000)  # cada segundo
env.get_checkpoint_config().set_checkpointing_mode(CheckpointingMode.EXACTLY_ONCE)
```

### 3. Event time vs processing time

```text
Event time: cuando el evento ocurrió.
Processing time: cuando el processor lo ve.

2026-01-15 10:00:00  (evento ocurrió)
2026-01-15 10:00:05  (processor lo ve)

Si los clocks están bien, suelen estar cerca.
Si no, hay que confiar en el productor.
```

> [!tip> Event time es la verdad
> El libro insiste: para sistemas con event time, **debate qué es un evento en el momento que ocurre**, no cuando se procesa. Eso requiere **watermarks** y manejo de lateness.

## Materialized views derivadas

El libro describe cómo los streams permiten **derived data** continuamente actualizado.

```text
Materialized view:

  Stream source ──► Processor ──► View store
                                     │
                                     ▼
                                  Query (instant)
```

Cuando hay un cambio en el stream, la view se actualiza automáticamente.

### Cassandra materialized views

```sql
CREATE MATERIALIZED VIEW users_by_email AS
  SELECT * FROM users
  WHERE email IS NOT NULL
  PRIMARY KEY (email);
```

### Stream-stream materialized views

```text
Real-time view:

  Stream A ──┐
             ├──► Materializer ──► View
  Stream B ──┘
```

## Ejemplo: sistema de detección de fraude

El libro usa un ejemplo completo:

```text
Fraud detection:

  Event: tarjeta cobrada
    ▼
  Stream: transacciones
    ▼
  Stream processor:
    - Verifica con reglas
    - Compara con históricos
    - Consulta blacklists
    ▼
  Alert: transacción sospechosa
```

## Real-time ML inference

El libro menciona brevemente la nueva frontera:

```text
Real-time ML:

  Stream event ──► Feature extraction ──► Model inference ──► Decision
                                                       │
                                                       ▼
                                               Approve / Reject
```

Los modelos se entrenan en batch, se sirven en stream.

## Comparación con batch

| Aspecto | Batch | Stream |
|---|---|---|
| Latencia | Minutos-horas | Ms-seg |
| Coste | Bajo por job | Alto siempre |
| Complejidad | Baja | Alta |
| Estado | Construir | Mantener |
| Casos | Análisis masivos | Reacción rápida |

> [!tip> Batch y stream se complementan
> La arquitectura moderna usa ambos: batch para lo masivo (training, aggregations diarias), stream para tiempo real (fraud, alerts, recommendations).

## Resumen en tres frases

- El **stream processing** es para datos que ocurren continuamente: logs, eventos, cambios en BD.
- **Kafka** es el actor dominante como message broker; **Flink** y **Kafka Streams** como processors.
- El **CDC** es el pegamento que conecta bases operacionales con streams, habilitando derived data en tiempo real.

## Próximos pasos

- [[18-philosophy-of-streaming|Philosophy of streaming systems]]: la integración de datos, el "unbundling" de las bases de datos, y los trade-offs entre correctness, freshness y maintainability. La filosofía de diseñar sistemas modernos.
