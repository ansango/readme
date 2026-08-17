---
title: Arquitectura de AI engineering
description: "Cómo diseñar el sistema: los 5 pasos para construir una arquitectura robusta (context, guardrails, router, caches, agents), monitoring, observabilidad y orquestación"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, ai-engineering, architecture, monitoring, observability, orchestration]
---

# Arquitectura de AI engineering

> [!abstract] Resumen
> Esta nota cubre la primera mitad del capítulo 10: cómo diseñar la **arquitectura** de un sistema de IA listo para producción. El libro propone **5 pasos** secuenciales (enhance context → put guardrails → add model router → reduce latency with caches → add agent patterns), una **capa de monitoring y observabilidad** que es no opcional, y los patrones de **orquestación** que encadenan todo. La segunda mitad (feedback de usuarios) está en [[16-feedback-de-usuario|Feedback de usuario]].

## El mindset de arquitectura

El libro empieza el capítulo con una observación clave: la arquitectura de un sistema de IA es **iterativa**, no big-design-up-front. Empiezas con un diagrama de 4 cajas (usuario → aplicación → API del modelo → modelo) y vas añadiendo complejidad a medida que los problemas aparecen.

> [!quote] "La arquitectura de un sistema de IA es la respuesta a 'qué falla y cómo lo mitigo'."
> Cada decisión arquitectónica responde a un problema concreto que ya has visto o que anticipas. Arquitectura sin diagnóstico es especulación.

## Los 5 pasos del framework arquitectónico

El libro destila el diseño de un sistema de IA en cinco pasos acumulativos. No todos los productos necesitan los cinco, pero la mayoría acaba llegando a grados 3-4.

### Paso 1: Enhance context

El primer paso es **mejorar el contexto** que recibe el modelo. Ya vimos esto en [[09-rag-arquitectura-y-optimizacion|RAG]].

#### En qué consiste

- Recuperación semántica (RAG) sobre una base de conocimiento.
- Historial de la conversación.
- Datos del usuario (con consentimiento).
- Cualquier información que el modelo necesite para responder bien.

#### Patrones comunes

- **RAG estándar**: retrieve → prepend al prompt.
- **Multi-source RAG**: combinar múltiples fuentes (docs, BD, APIs).
- **Contextual retrieval**: añadir contexto adicional a cada chunk (ej: el documento del que viene).
- **Temporal context**: información que cambia con el tiempo (precios, disponibilidad).

#### Por qué es el primer paso

Porque es lo que más impacto tiene en la calidad con el menor coste. Un sistema con buen contexto y un modelo mediocre a menudo gana a un sistema con mal contexto y un modelo excelente.

### Paso 2: Put in guardrails

El segundo paso es **poner barreras de seguridad**. Cubrimos esto en [[08-prompt-engineering-defensivo|Prompt engineering defensivo]].

#### En qué consiste

- **Validación de input**: detectar prompt injection, datos malformados.
- **Validación de output**: detectar PII, contenido peligroso, formato inválido.
- **Rate limiting**: prevenir abuse.
- **Topic restrictions**: bloquear dominios no permitidos.
- **PII filtering**: enmascarar o rechazar datos personales.

#### Implementación en la arquitectura

```
user_input → [input guard] → app → [output guard] → response
```

Los guards son típicamente:
- Regex y heurísticas para casos simples.
- LLMs rápidos (o especializados) para casos complejos.
- Sistemas de scoring (¿esto se parece a algo peligroso?).

#### Por qué es importante

Sin guardrails, tarde o temprano alguien:

- Encuentra una jailbreak que genera daño reputacional.
- Mete datos privados en el input.
- Abusa del sistema para spam o scams.
- Filtra información sensible del prompt.

> [!danger] Los guardrails son code, no prompt
> El libro es claro: las defensas críticas **no pueden ser solo prompt**. Deben ser código que se ejecuta de forma determinista. El prompt es complemento, no sustituto.

### Paso 3: Add model router and gateway

Cuando un sistema tiene **varios modelos** (o varios proveedores), necesitas un **router** que decida qué modelo usar para cada request.

#### Por qué un router

- **Distintos modelos para distintas tareas**: un modelo barato para clasificación, uno potente para generación.
- **Distintos proveedores como respaldo**: si OpenAI falla, fallover a Anthropic.
- **Routing por usuario**: cliente premium va a modelo premium.
- **A/B testing**: 10% del tráfico a un modelo nuevo para comparar.

#### Patrones de routing

##### Task-based routing

Ciertos tipos de request a ciertos modelos.

```python
def route(request):
    if request.task == "classification":
        return cheap_model
    elif request.task == "complex_reasoning":
        return powerful_model
    elif request.task == "code":
        return code_model
```

##### Capability-based routing

Rutas basadas en capacidades requeridas (contexto largo, multimodal, function calling).

##### Cost-based routing

Maximizar calidad por dólar. Empezar con modelo barato, escalar a potente solo si falla.

```python
def cascade_route(request):
    try:
        return cheap_model.generate(request)
    except QualityBelowThreshold:
        return retry_with_powerful_model(request)
```

#### Gateway

Un gateway añade:

- **Logging centralizado** de todas las requests.
- **Rate limiting** por usuario/API key.
- **Authentication** y accounting.
- **Request transformation** (formato A → formato B).
- **Caching** centralizado.

Frameworks populares: **Portkey**, **OpenRouter**, **Cloudflare AI Gateway**.

### Paso 4: Reduce latency with caches

El cuarto paso es **reducir latencia con cachés**. Cubrimos técnicas en [[14-fundamentos-y-optimizacion-de-inferencia|Inferencia]].

#### Tipos de cache

- **Prompt cache**: el proveedor cachea el prefijo del prompt (system prompt + contexto recurrente).
- **Exact response cache**: misma query → misma response.
- **Semantic cache**: query similar → response similar.
- **Embedding cache**: embeddings precomputados.
- **Tool call cache**: resultados de tools cacheados.

#### Qué cachear

| Tipo | Hit rate típico | Impacto |
|---|---|---|
| System prompt | 100% | Ahorro medio |
| User context (RAG) | 20-50% | Gran ahorro |
| Conversation history | 0-30% | Depende |
| Full request | 5-20% | Latencia brutal |

> [!tip] Prompt caching es el quick win
> Si usas OpenAI, Anthropic, Google o Together, **activa prompt caching**. Ahorra 50-90% del coste de input con casi ningún cambio en tu código.

#### Invalidación

- **TTL**: TTL en segundos (5 min, 1 hora, 1 día).
- **Manual**: invalidate key cuando el dato cambia.
- **Eventos**: en respuesta a un evento (nuevo documento, cambio de precio).

### Paso 5: Add agent patterns

El quinto paso es **añadir patrones de agentic** cuando la tarea lo requiere. Cubrimos agentes en [[10-agentes|Agentes]].

#### Cuándo añadir agentes

- La tarea requiere **múltiples pasos** dependientes.
- Hay que **tomar acciones** en sistemas externos.
- El usuario quiere **automatización** más que conversación.

#### Cuándo NO añadir agentes

- Una sola llamada al modelo basta.
- El usuario quiere control fino de cada paso.
- El coste de las acciones es alto (e.g., transaccional).

#### Patrones de integración

- **Human-in-the-loop**: el agente propone, el humano aprueba.
- **Background agents**: corren tareas programadas.
- **Tool extensions**: el modelo accede a herramientas externas.

> [!warning] No todo necesita un agente
> El libro advierte: el entusiasmo por los agentes a menudo lleva a **complicar sistemas que funcionarían mejor como pipelines tradicionales**. Un agente es la opción cuando hay decisiones genuinas a tomar, no para añadir buzzwords.

## Monitoring y observability

El libro insiste: **sin monitoring, no tienes un sistema de producción**. Tienes una demo glorificada.

### Las tres pilares

#### Logs

Registros de cada request, response, error.

```python
log.info({
    "request_id": uuid(),
    "user_id": user.id,
    "model": "gpt-4",
    "input_tokens": 245,
    "output_tokens": 102,
    "latency_ms": 1832,
    "cost_usd": 0.018,
    "quality_score": 0.92,
    "tools_called": ["search_docs"],
    "errors": None,
})
```

#### Metrics

Agregaciones numéricas:

- **Latencia p50, p95, p99**.
- **Throughput** (RPS, TPS).
- **Tasa de error**.
- **Coste por hora**.
- **Quality scores promedio**.

#### Traces

Secuencias de spans que muestran qué pasó en cada request:

```
user_request (1500ms)
 ├─ input_validation (10ms)
 ├─ context_retrieval (200ms)
 │   ├─ embedding (50ms)
 │   └─ vector_search (120ms)
 ├─ model_call (1200ms)
 │   ├─ prefill (300ms)
 │   └─ decode (900ms)
 ├─ output_validation (50ms)
 └─ response_serialization (40ms)
```

### Qué monitorizar (específico de AI)

- **Quality drift**: la calidad promedio baja o sube con el tiempo.
- **Topic drift**: cambian los temas que preguntan los usuarios.
- **Cost per request**: alertas cuando sube.
- **Hallucination rate**: alertas cuando sube.
- **Cache hit rate**: baja → coste sube.
- **Refusal rate**: el modelo rechaza más/menos de lo esperado.
- **Latency p95**: tu SLA.

### Herramientas

- **LangSmith**: el más popular, especialmente para LangChain.
- **Langfuse**: open-source, compatible con todo.
- **Weights & Biases**: plataforma más amplia.
- **Helicone**: focused en observability de LLMs.
- **Honeycomb / Datadog**: herramientas tradicionales de observability que se adaptan.
- **Custom**: dashboards propios con PostgreSQL + Grafana.

> [!tip] Dashboards en producción, no en staging
> El libro recomienda diseñar los dashboards para **el primer día** en producción, no después. Lo que no se mide en producción, no se mejora.

### Alerting

- **P95 latencia > X ms**: aviso al equipo.
- **Tasa de error > Y%**: aviso al on-call.
- **Coste por hora > Z**: aviso al manager.
- **Quality score < W**: aviso al equipo de datos.

Define estos umbrales **antes** de salir a producción.

## AI pipeline orchestration

El último bloque de esta nota trata de cómo **orquestar** los distintos pasos del pipeline.

### Frameworks de orquestación

#### LangChain / LangGraph

El más popular. Tiene LangGraph para grafos con estado.

#### LlamaIndex

Foco en RAG, también soporta agentes.

#### Haystack (deepset)

Framework para pipelines NLP, muy maduro.

#### Prefect / Airflow

Workflow managers generales, no específicos de AI pero útiles.

#### Custom

Código propio con asyncio, threads, message queues.

### Patrones de orquestación

#### DAG (Directed Acyclic Graph)

Pasos en orden, sin ciclos. El más simple.

```text
validate_input → retrieve_context → call_model → format_output → log
```

#### State machine

Estado explícito, transiciones según resultados.

```text
INITIAL → PROCESSING → SUCCESS
                    ↓
                  ERROR → RETRY → PROCESSING
```

#### Event-driven

Pasos reaccionan a eventos. Más complejo pero más flexible.

#### Long-running

Workflows que duran horas o días. Stateful, con persistencia.

### Persistencia de estado

Para workflows largos, el estado debe persistir:

- **Bases de datos**: SQL/NoSQL.
- **Object stores**: S3, GCS.
- **State stores**: Redis, etc.

Frameworks como **LangGraph** o **Temporal** lo gestionan automáticamente.

### Error handling

- **Retries**: con backoff exponencial.
- **Circuit breakers**: deja de llamar a un servicio que falla repetidamente.
- **Fallbacks**: si el modelo falla, devuelve algo razonable.
- **Timeouts**: cada step tiene un timeout explícito.

> [!tip] Diseña para fallar
> El libro recomienda asumir que **todo falla**. El modelo se cae, la BD de vectores se cae, la API externa se cae. Diseña para que cada fallo degrade el sistema de forma elegante, no catastrófica.

## Resumen en tres frases

- La arquitectura de un sistema de IA se construye por **5 pasos acumulativos**: contexto, guardrails, router, caches, agentes.
- Monitoring y observability son **no opcionales**: sin ellos, no sabes qué está pasando en producción.
- La orquestación conecta todo: DAGs simples para tareas cortas, state machines para tareas largas, siempre con error handling y persistencia.

## Próximos pasos

- [[16-feedback-de-usuario|Feedback de usuario]]: el último componente que cierra el loop. Cómo recoger feedback de los usuarios, qué tipo de feedback es útil, sus limitaciones y cómo construir un loop de mejora continua.
