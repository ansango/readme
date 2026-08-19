---
title: "De un agente a muchos — Parte B : comunicación, broker y estado distribuido"
description: "Cómo se comunican los agentes en producción: local vs distributed, Agent-to-Agent Protocol (A2A), message brokers (Kafka, Redis Streams, NATS), actor frameworks (Ray, Orleans, Akka), workflow engines (Temporal) y gestión de estado distribuido"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, multi-agent, a2a-protocol, kafka, nats, ray, orleans, akka, temporal, distributed-state]
---

# De un agente a muchos — Parte B

> [!abstract] Resumen
> Decidir cuántos agentes y cómo coordinarlos es la mitad del problema; la otra mitad es **cómo se comunican** y **cómo mantienen estado distribuido**. La Parte B del Capítulo 8 entra en: **local vs distributed** communication, el **Agent-to-Agent Protocol (A2A)** (iniciativa de Google que estandariza discovery y RPC entre agentes heterogéneos), **message brokers** (Kafka, Redis Streams, NATS para desacoplar publishers y subscribers), **actor frameworks** (Ray, Orleans, Akka — encapsulan estado + mensaje en una sola unidad), **workflow engines** (Temporal, durable execution) y **storage tier** para memory y persistente. Cierra con la tabla resumen que el libro ofrece a los lectores que necesitan elegir infraestructura.

## Comunicación local vs distribuida

A **escala de prototipo**, los agentes se comunican vía **function calls directos, shared memory o message queues in-memory**. AutoGen y LangGraph usan routers in-memory. Es simple y eficiente.

A **escala de producción**, los agentes viven en procesos, contenedores o nodos distintos. La comunicación tiene que ser:

```text
   - Explícita (no se asume in-memory)
   - Asíncrona (no bloquea al agente esperando respuesta)
   - Fault-tolerant (un consumer caído no pierde mensajes)
```

```text
   Escala:                Comunicación:
   ──────                  ────────────────
   Single agent            function calls directos
   Few agents in-process   in-memory queues
   Multi-process           message broker (Redis, NATS)
   Multi-node              broker distribuido (Kafka, NATS JetStream)
   Cross-org               A2A / MCP / HTTP
```

## Agent-to-Agent Protocol (A2A)

El **A2A Protocol** (Google) busca el **mismo papel que HTTP juega para servicios web**, pero entre agentes.

### Componentes

```text
   Agent Card (JSON) ── descriptor machine-readable de identidad, capabilities, endpoint, auth
                        ↓
   Discovery ── servidor /.well-known/agent.json o registry central
        ↓
   Handshake ── verificar protocol version, capabilities compartidas
        ↓
   JSON-RPC 2.0 sobre HTTPS (referencia) ── o gRPC/WebSocket (transporte agnóstico)
        ↓
   Structured request ── método + params + id correlacionado
```

```python
agent_card = {
    "identity": "SummarizerAgent",
    "capabilities": ["summarizeText"],
    "schemas": {
        "summarizeText": {
            "input": {"text": "string"},
            "output": {"summary": "string"}
        }
    },
    "endpoint": "http://localhost:8000/api",
    "auth_methods": ["none"],                    # In prod: OAuth2, API keys
    "version": "1.0"
}
```

```python
import requests, json

# 1. Discover
card_url = 'http://localhost:8000/.well-known/agent.json'
agent_card = requests.get(card_url).json()

# 2. Validate (handshake)
if agent_card['version'] != '1.0':
    raise ValueError("Incompatible protocol version")
if "summarizeText" not in agent_card['capabilities']:
    raise ValueError("Required capability not supported")

# 3. RPC call
rpc_request = {
    "jsonrpc": "2.0",
    "method": "summarizeText",
    "params": {"text": "Long text to summarize..."},
    "id": 123,
}
response = requests.post(agent_card['endpoint'], json=rpc_request)
summary = response.json()["result"]["summary"]
```

> [!success> Por qué A2A importa
> - **Interoperabilidad** cross-framework (AutoGen ↔ LangGraph ↔ CrewAI).
> - **Discoverability** dinámica vía Agent Cards (no más registrar manualmente).
> - **Seguridad** negociada (OAuth2, mTLS — al nivel HTTP).
> - **Open standard**: propiedad del protocolo en Linux Foundation.

> [!warning> Limitaciones
> - **Spec joven** (2024-2025): gaps en seguridad, discovery overhead, semánticas en evolución.
> - **Necesita transporte**: gRPC/WebSocket no están tan estandarizados como HTTPS.
> - **Authentication**: el spec no dicta la implementación; queda a criterio del operador.

## Message brokers y event buses

A medida que los agentes crecen, **point-to-point** se vuelve frágil. Un **message broker** desacopla senders de receivers y soporta async, retries y replay.

```text
   Publisher ──→ Broker ──→ Subscribers
       (fire-and-forget)        (procesan cuando pueden)
```

### Comparativa de brokers

| Broker | Throughput | Latencia | Durabilidad | Caso ideal |
|--------|-----------|----------|-------------|-----------|
| **Apache Kafka** | Muy alto (millones de msgs/s) | Algo mayor | Fuerte (log-based) | Agentes que necesitan **audit trail** y replay; multi-tenant |
| **Redis Streams** | Moderado-alto | Baja | Limitada (memory-bound) | Prototipos, low-latency single-process |
| **RabbitMQ** | Moderado | Baja | Buena | Workloads tradicionales con routing complejo |
| **NATS / NATS JetStream** | Alto | Muy baja | Opcional con JetStream | Cloud-native, edge, microservicios |

### Ejemplo: Redis Streams para supply chain

```python
import redis, json, uuid

def supervisor_publish(operation, messages):
    r = redis.Redis(host='localhost', port=6379)
    agent_name = "inventory"                      # decisión del supervisor
    task_id = str(uuid.uuid4())
    task = {
        'task_id': task_id,
        'agent': agent_name,
        'operation': operation,
        'messages': [m.dict() for m in messages],
    }
    r.xadd('supply-chain-tasks', {'data': json.dumps(task)})
    return task_id

# Specialist consume loop
def inventory_consumer():
    r = redis.Redis(host='localhost', port=6379)
    while True:
        _, msg = r.brpop('supply-chain-tasks')      # blocking pop
        task = json.loads(msg['data'])
        if task['agent'] != 'inventory': continue
        process_inventory(task)
```

```text
   Ventajas del broker                    Trade-offs
   ────────────────────                  ──────────
   ✓ Asynchronous: agents escalan        ✗ Latencia añadida
   ✓ Fault tolerance: replay missed       ✗ Complejidad operativa
   ✓ Observability: every msg logged      ✗ Consistencia eventual entre agentes
   ✓ Loosely coupled: añade agentes sin tocar a nadie
```

## Actor frameworks: Ray, Orleans, Akka

Los **actors** encapsulan **state + behavior + message handling**. A diferencia de un message broker puro, cada actor tiene **stateful computation** local y procesa mensajes **secuencialmente**, eliminando race conditions.

```text
   Message broker                    Actor framework
   ──────────────                    ──────────────
   routes messages                  routes + executes messages
   stateless handler                 stateful computation
   external state (DB)               state inside actor
   coordination via topic            coordination via actor address
```

### Tres frameworks

| Framework | Lenguaje nativo | Modelo | Caso ideal |
|-----------|----------------|--------|-----------|
| **Ray** | Python (`@ray.remote`) | Actor + tasks | Python-first, prototype rápido, integrates with LangGraph/AutoGen |
| **Orleans** | C# (también .NET multi-lang) | Virtual actors (auto-instantiate) | Cloud-native, alta concurrencia, stateful |
| **Akka** | JVM (Scala/Java) | Classic actor + Akka Cluster | Sistemas distribuidos de alta concurrencia |

```python
import ray

@ray.remote
class InventoryAgent:
    def __init__(self):
        self.fulfilled = 0

    def fulfill(self, sku, qty):
        # stateful: increments a counter, talks to DB, etc.
        self.fulfilled += qty
        return {"sku": sku, "qty": qty, "total": self.fulfilled}

agent = InventoryAgent.remote()
result = ray.get(agent.fulfill.remote("SKU-12345", 100))
```

> [!success> Cuándo introducir actor framework
> - Multi-agent **count > 10-20**, o swarm dinámico donde añadir agentes es operacional.
> - **Stateful per-agent memory** (conversación, learned behaviors) que vive con el agente.
> - **High-concurrency**: bidding, IoT coordination, multi-agent simulations.
> - **Latencia dura**: actor invoke location-transparent, sin API hops.
>
> Para setups pequeños o monolíticos, brokers o single-container son suficientes.

## Workflow engines: Temporal

Los **workflow engines** añaden **durability and recovery** para procesos que cruzan agentes y tiempo.

```python
from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy

@workflow.defn
class SupplyChainWorkflow:
    @workflow.run
    async def run(self, operation, initial_messages):
        # Step 1: Inventory
        inventory_result = await workflow.execute_activity(
            "inventory_activity",
            {"operation": operation, "messages": initial_messages},
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        # Step 2: Transportation with updated state
        updated_messages = initial_messages + inventory_result["messages"]
        transport_result = await workflow.execute_activity(
            "transportation_activity",
            {"operation": operation, "messages": updated_messages},
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        # Step 3: Supplier
        ...
```

> [!note> Durable execution
> Temporal automáticamente **checkpoint** el estado del workflow después de cada activity. Si el proceso cae o el agente falla, el workflow **resume exactamente donde paró** — incluso semanas después, con state intacto.

```text
   ¿Cuándo usar un workflow engine?
   ────────────────────────────────────
   - El proceso tiene steps asíncronos o multi-día (supply chain, compliance)
   - Necesitas retry automático con backoff y circuit breaker
   - La caída del proceso no debe perder el progreso
   - Criticalidad alta: transacciones financieras, health, compliance
```

## Managing state and persistence

| Tipo de memoria | Storage típico | Características |
|-----------------|----------------|------------------|
| **Episodic** (corto plazo) | Redis, in-memory | Latencia baja, ephemeral, TTL corto |
| **Semantic** (largo plazo) | PostgreSQL + Vector store (Pinecone) | Buscable, durable, requiere indexación |
| **Workflow state** | Temporal / Orleans checkpoint | Resiliencia ante crash, durable execution |
| **Tool outputs / plans** | Object storage (S3, Blob) | Cheap, archivado, sin acceso inmediato |

```text
   Approach                  Pros                      Cons                          Best for
   ─────────                  ────                      ─────                          ─────────
   Relational DB (Postgres)  Flexible, queryable        Manual consistency             Custom systems
   Vector store (Pinecone)    Semantic search           Coste, complejidad             Knowledge agents
   Object storage (S3)        Cheap, durable            Slow access, no index         Artifacts
   Stateful framework        Auto-recovery             Framework lock-in              Long-running workflows
```

```python
# Ejemplo: Episodic in Redis + Semantic in Pinecone + Workflow in Temporal
import redis
from pinecone import Pinecone

def get_redis_state(task_id: str):
    """Short-lived state, TTL 1h, fast access during workflow."""
    r = redis.Redis()
    return json.loads(r.get(f"state:{task_id}") or "{}")

def get_semantic_memory(query: str, top_k: int = 5):
    """Long-lived knowledge via vector store."""
    pc = Pinecone(api_key="...")
    index = pc.Index("agent-memory")
    return index.query(query, top_k=top_k)
```

## Tabla resumen del capítulo 8

| Approach | Conceptos | Beneficios | Challenges |
|----------|-----------|-----------|------------|
| **Single-container** | Agente monolítico, sync calls | Simple, low-latency | Single point of failure, escala pobre |
| **A2A Protocol** | Agent Cards + JSON-RPC | Interoperable, descubrible | Spec joven, security gaps |
| **Message brokers** | Async pub/sub desacoplado | Escala, fault tolerance | Latencia añadida, consistencia eventual |
| **Actor frameworks** | State + message en un actor | Statefulness, concurrencia segura | Infraestructura pesada |
| **Workflow engines** | Durable execution, retries | Crash recovery automático | Framework lock-in |

## Resumen de la Parte B

- **Local → distributed** según crece el sistema; cada paso añade complejidad pero también escalabilidad.
- **A2A Protocol** (Google + Linux Foundation) es el emerging standard para interoperabilidad de agentes heterogéneos — discovery via Agent Cards, RPC vía JSON-RPC 2.0 sobre HTTPS/gRPC.
- **Message brokers** (Kafka, Redis Streams, NATS) desacoplan publishers y subscribers; añadiendo **replay**, **durable storage**, **observation**.
- **Actor frameworks** (Ray, Orleans, Akka) suben el listón encapsulando stateful computation en cada actor, ideal para high-concurrency y dynamic agent count.
- **Workflow engines** (Temporal) son la pieza para procesos **durable and resumable**: si un agente falla, el workflow no muere.
- **State management** se distribuye entre tiers: episodic (Redis), semantic (vector store), workflow state (Temporal checkpoints), object storage (S3).

> [!quote> Cierre del capítulo
> "La transición de single-agent a multi-agent ofrece ventajas significativas en adaptación, eficiencia y manejo de complejidad. Pero esa escalabilidad **viene con trade-offs que demandan planificación cuidadosa**: cuántos agentes, cómo coordinan, cómo se comunican, cómo comparten estado. Decidir bien requiere entender el coste incremental de cada capa."

## Próximos pasos

Tienes agentes, comunicación, estado. Ahora viene el **cómo saber si funciona**: el sistema de evaluación holística en [[10-validacion-y-medicion]].
