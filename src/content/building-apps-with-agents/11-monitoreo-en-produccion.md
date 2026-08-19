---
title: "Monitoreo en producción : observability, deployment patterns y distribución shifts"
description: "Cómo monitorizar sistemas agenticos en producción: OpenTelemetry + Loki + Tempo + Grafana, Arize Phoenix, SigNoz, Langfuse, deployment patterns (shadow mode, canary, regression traces, self-healing), user feedback, distribution shifts (KS, KL, PSI) y governance"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, monitoring, observability, opentelemetry, grafana, langfuse, phoenix, signoz, distribution-shift]
---

# Monitoreo en producción

> [!abstract] Resumen
> Shippear el agente es la mitad del camino. La otra mitad es **monitorizar** lo que hace en producción: distinguir **failure** (bug sistemático) de **expected variation** (ruido del LLM), capturar feedback humano, detectar distribution shifts antes de que se vuelvan incidentes, y elegir **deployment patterns** que de-risken cambios sobre comportamiento probabilístico. El capítulo arma el stack **OpenTelemetry + Loki + Tempo + Grafana** como referencia open source, repasa las alternativas **Arize Phoenix**, **SigNoz** y **Langfuse**, recorre los **patrones** (shadow, canary, regression trace collection, self-healing) y termina con **distribution shifts** (KS test, KL divergence, PSI) — las señales silenciosas que degradan un agente sin tirar errores.

## Por qué el monitoreo importa (de verdad)

> [!quote> Tesis
> "Una vez los agentes están en producción, necesitas ver qué hacen y por qué. **Monitoring es el nervous system** de tu infraestructura agentica desplegada. Y no es solo detectar problemas — es el backbone de un **tight feedback loop** que acelera aprendizaje e iteración."

A diferencia del software tradicional, los agentes son **probabilísticos**:

```text
   Traditional software           Agent-based software
   ─────────────────           ──────────────────
   Deterministic                 Probabilistic
   Same input → same output     Same input → different outputs
   Errors are exceptions         Failures are emergent behaviors
   Crash = failure               Hallucination = subtle miss, not exception
   Test exhaustively             Test what you can; observe the rest
```

Tres tipos de señales que debes capturar:

```text
   Infrastructure signals            Semantic behaviors
   ────────────────────            ──────────────
   Latency, error rate              Intent grasp accuracy
   CPU, memory                      Tool selection quality
   Throughput                       Hallucination rate
                                    Task abandonment
```

## Stack de monitoreo open source de referencia

El libro se centra en un stack open source self-hostable:

```text
   OpenTelemetry  ──  instrumentation (Python, Java, Go, ...)
       ↓
   Loki            ──  log aggregation, structured JSON, searchable
   Tempo           ──  distributed traces, span storage
       ↓
   Grafana         ──  unified dashboards, alerting, correlation
```

### Antes de instrumentar: qué medir

El libro define una **taxonomía de métricas por capa** (Table 10-1):

```text
   Capa            Métrica                              Acción típica
   ────            ──────                              ─────────────
   Infrastructure  CPU/memory                          autoscale
                   Uptime, latency p95                  incident response
   Workflow        Task success rate                   investigar fallos
                   Tool call success/failure rate      patch wrappers
                   Tool use rate limit exceeded        ajustar límites
                   Retry frequency                     debounce
                   Fallback frequency                  mejorar robustez
   Output quality  Token usage                         prompt tuning
                   Hallucination indicator             grounding / critique
                   Embedding drift from baseline       retrain
   User feedback   Requery rate                        intent clasification
                   Task abandonment                   simplificar UX
                   Thumbs up/down                      triage
```

> [!note> No todo
> "El objetivo no es coleccionarlo todo, sino **coleccionar lo necesario** para detectar cambio significativo. Sobre-medir satura el pipeline y nubla las señales."

## Stacks comerciales y open source

| Stack | Backend | Strength | Best for | Trade-off vs Grafana |
|-------|---------|----------|----------|----------------------|
| **Grafana + Loki + Tempo** | ClickHouse / Grafana DB | Composability, viz | Enterprise ops | Más piezas a operar |
| **ELK** (Elasticsearch + Logstash/Fluentd + Kibana) | Elasticsearch | Search/analytics | Large-scale logs | Resource-intensive |
| **Phoenix** (Arize) | Postgres + ClickHouse | Tracing + AI eval | Dev iteration (LLM-native) | Limited prod scale |
| **SigNoz** | ClickHouse | Unified, lightweight | Startups / ML teams | Less extensible |
| **Langfuse** | PostgreSQL / ClickHouse | LLM-native evals + session replay | Semantic monitoring | Narrower infra coverage |

> [!tip> Decide por tu punto de partida
> **¿Tienes ya Prometheus + Grafana?** Extiéndelo con OTel para agents, añade Langfuse si necesitas LLM-specific metrics. **¿Greenfield project?** Grafana o SigNoz dan cobertura broad. **¿Equipo chico de LLM-focused startup?** Langfuse o Phoenix dan setup rápido con eval nativo.

## OpenTelemetry instrumentation

La instrumentación vive en el **runtime** del agente. Cada nodo del grafo LangGraph se convierte en un *span*, cada decisión en un *event*, cada error en un *exception* con traceback.

```python
from opentelemetry import trace

tracer = trace.get_tracer("agent-tracer")

def call_model_with_tracing(state):
    with tracer.start_as_current_span("llm.generation") as span:
        span.set_attribute("agent.state.input_tokens", input_tokens)
        span.set_attribute("agent.state.output_tokens", output_tokens)
        span.set_attribute("agent.tool_calls", tool_calls)
        try:
            response = llm.invoke(full_prompt)
            span.set_attribute("agent.tool_choice", response.tool_choice)
            return {"messages": [response]}
        except Exception as e:
            span.record_exception(e)
            raise
```

Cada span incluye:

- **Contexto mínimo suficiente**: user request IDs, session metadata, agent config.
- **No demasiado detalle**: se vuelve ruidoso. El equilibrio está en hacer el trace **searchable** cuando algo rompe.

```text
   Spans por node LangGraph:
   ────────────────────
   supervisor_node          (span: supervisor.route)
   ├── specialist.nodes     (sub-span: spec.<role>)
   │   ├── llm.generate      (sub-sub-span: llm.generation, con tokens)
   │   └── tool.call         (sub-sub-span: tool.<name>, con latency)
   └── response.format
```

## Visualización y alerting con Grafana

Grafana es el **frontend operacional**:

- **Trace explorer**: trace ID único por request → navega por todos los spans que componen ese turno del agente.
- **Dashboards por versión**: filtra por `app_version` para comparar v1.0 vs v1.1 en producción.
- **Alertas**: cuando la tasa de error del agente sube X% en 5 min, cuando la latencia p95 cruza SLO, cuando hallucination_score > umbral durante 30 min.

```yaml
# Ejemplo de alerting rule
- alert: AgentHallucinationSpike
  expr: avg_over_time(agent_hallucination_score[5m]) > 0.25
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Agent hallucination score rising"
    description: "Consider triggering rollback or prompt fix"
```

## Patrones de deployment para sistemas probabilísticos

Cuatro patrones que reducen el riesgo de cada release:

### Shadow mode

```text
   Production agents        Shadow agent
   (sirve usuarios)         (recibe mismas queries, output descartado)
        │                       │
        ├── ambos instrumented ──┤
        ├── mismo request_id         │
        └── comparar behavior en Grafana
```

> [!success> Cuándo brilla
> Ensayar cambios de modelo, nuevas estrategias de planning o prompting sin arriesgar用户体验. Mide success rate, latency, token usage, hallucination frequency comparando ambos.

### Canary deployment

```text
   Baseline agent: 95% tráfico
   Canary agent:  5% tráfico
       ↓
   Filtra logs por version tag en Grafana
   Compara success rate, latency, errors
       ↓
   ✅ OK → subir a 25%, 50%, 100%
   ❌ KO → rollback inmediato, blast radius mínimo
```

### Regression trace collection

```text
   Production failure trace
        ↓
   Automáticamente exporta al evaluation set
        ↓
   Se convierte en regression test
        ↓
   PR con el fix → CI corre el trace → fix verificado
```

> [!tip> "Shift-left" monitoring
> "El mismo principio de shift-left testing se aplica aquí: capture failures production, conviértelas en regression tests, prevenga su recurrencia antes de que lleguen al próximo deploy."

### Self-healing agents

Los agentes pueden leer **su propia telemetría** y actuar en consecuencia:

```text
   Tool falla 3 veces seguidas  →  switch a fallback plan
   Latency > SLA                →  skip optional reasoning step
   Hallucination score alto     →  defer to human review / disclaimer
```

> [!note> Cada fallback es loggeable
> "Cada decisión de fallback debería loggearse como span con la telemetría que la motivó. Así sabrás **cuándo** se activaron y **por qué** — y si ayudaron o no."

## User feedback como señal de observability

Dos tipos:

| Tipo | Ejemplos | Implementación |
|------|----------|----------------|
| **Implícito** | Requeries, task abandonment, hesitation | Log con trace_id; agregación en Loki |
| **Explícito** | Thumbs up/down, star rating, free-text comment | Evento atado al trace; alerta cuando dissatisfaction spike |

```text
   thumbs_down → attach trace_id → Alert in Grafana
        ↓
   Triage in eval set post-hoc
        ↓
   Problematic traces → regression corpus
```

## Distribution shifts: la alerta silenciosa

Las **distribution shifts** son cambios lentos en el entorno que degradan performance sin tirar errores explícitos:

```text
   ¿Qué cambia?
   ──────────
   - Lenguaje de los usuarios (jerga nueva, modismos)
   - Terminología de producto (features nuevas, renombrados)
   - API responses (cambios upstream)
   - Foundation model (versión cambia comportamiento)
   - Patrones de uso (mix de queries cambia)
```

Tres tests clásicos para detectar drifts:

### Kolmogorov-Smirnov (KS)

Compara distribuciones continuas entre baseline y current:

```python
from scipy.stats import ks_2samp
ks_stat, p_value = ks_2samp(historical_latencies, current_latencies)
if ks_stat > 0.1:
    print(f"Drift detected: KS statistic = {ks_stat}")
```

### Kullback-Leibler divergence (KL)

Para distribuciones categóricas o token distributions:

```python
import numpy as np

def kl_divergence(p, q, epsilon=1e-10):
    p = (p + epsilon) / np.sum(p + epsilon)
    q = (q + epsilon) / np.sum(q + epsilon)
    return np.sum(p * np.log(p / q))

historical_tokens = np.array([0.4, 0.3, 0.3])
current_tokens    = np.array([0.2, 0.5, 0.3])

kl = kl_divergence(historical_tokens, current_tokens)
if kl > 0.5:
    print(f"Concept drift: KL = {kl}")
```

### Population Stability Index (PSI)

Para variables categorizadas/binned (e.g., tool usage):

```python
def psi(expected, actual):
    e_pct = expected / np.sum(expected)
    a_pct = actual / np.sum(actual)
    return np.sum((a_pct - e_pct) * np.log(a_pct / e_pct))

historical = np.array([50, 30, 20])   # refund, cancel, modify
current    = np.array([20, 50, 30])

psi_value = psi(historical, current)
# PSI < 0.1 = no drift, 0.1-0.25 = minor, > 0.25 = major
```

> [!success> Cuándo alertar
> - KS > 0.1 (con p-value < 0.05)
> - KL > 0.5
> - PSI > 0.1 (minor), > 0.25 (major)

## Metric ownership y governance

El monitoreo agentico cruza equipos:

```text
   Producto  →  user satisfaction, abandono, ratings
   ML team   →  hallucinación, drift, model performance
   SRE       →  infra signals, latency, uptime, MTTR
   Soporte   →  escalaciones, fricciones, edge cases reportados
```

> [!danger> Sin governance, el monitoreo se evapora
> "Sin claros owners, las métricas huérfanas se ignoran; los dashboards se vuelven obsoletos; las alertas se silencian. Cada métrica crítica necesita un equipo responsable y un proceso de revisión regular."

## Compliance y privacidad

Los traces y logs contienen **contenido sensible** (mensajes de usuario, inputs/outputs de LLMs):

```text
   Compliance + observability requieren:
   ─────────────────────────────────────────
   1. Clústeres separados con RBAC estricto
   2. Encryption at-rest + audit logs
   3. Redacción / hash / mask de PII antes de exportar
   4. OpenTelemetry hooks para data scrubbing durante export
   5. Retención limitada (no guardar 5 años de traces con PII)
```

## Resumen del capítulo

- Monitoring es el **nervous system** de un agente en producción; sin él, no hay feedback loop.
- **OpenTelemetry + Loki + Tempo + Grafana** (o **Langfuse/Phoenix/SigNoz**) forman el stack open source canónico.
- Taxonomía de métricas por capa: infra, workflow, output quality, user feedback.
- Cuatro **deployment patterns** que reducen riesgo: **shadow mode**, **canary**, **regression trace collection**, **self-healing**.
- **Distribution shifts** se detectan con KS / KL / PSI — señales silenciosas que degradan sin tirar errores.
- **User feedback** (implícito + explícito) + traces correlation = lazo cerrado entre prod y development.
- Compliance: clusters separados, RBAC, redacción de PII.

> [!quote> Cierre
> "En un mundo donde los agentic systems se vuelven infraestructura core, el monitoreo robusto no es opcional — es foundational. Quien lo domine liderará en crear agentes confiables a escala."

## Próximos pasos

Los agentes en producción están estabilizados, monitorizados. ¿Pero cuándo vale la pena invertir en **mejorarlos en loop**? El siguiente capítulo entra en [[12-bucles-de-mejora]].
