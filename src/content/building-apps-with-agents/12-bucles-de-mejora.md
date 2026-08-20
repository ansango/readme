---
title: "Bucles de mejora : feedback pipelines, experimentación y aprendizaje continuo"
description: "Cómo cerrar el ciclo de mejora continua: feedback pipelines con automated analysis y human-in-the-loop, experimentación (shadow deployments, A/B testing, Bayesian bandits), continuous learning (in-context y offline retraining), frameworks como DSPy y Microsoft Trace"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, improvement-loop, dspy, microsoft-trace, ab-testing, bayesian-bandits, hitl]
---

# Bucles de mejora

> [!abstract] Resumen
> En un sistema multi-agente complejo, los fallos **no son anomalías — son inevitables**. La diferencia entre un agente mediocre y uno excelente no es la ausencia de errores, sino **cómo aprende de ellos**. El capítulo estructura el ciclo de mejora continua en tres bloques: **(1) feedback pipelines** que observan, diagnostican y priorizan issues (con frameworks como DSPy y Microsoft Trace); **(2) experimentación** que valida cambios de forma controlada (shadow deployments, A/B testing, Bayesian bandits); y **(3) continuous learning** que embute mejoras en el sistema (in-context para inmediatez, offline retraining para profundidad). El ejemplo: un **SOC analyst agent** cuyas tools (`lookup_threat_intel`, `query_logs`, `triage_incident`, `isolate_host`) merecen ajustes constantes frente a nuevas tácticas de ataque.

## El ciclo completo

> [!quote> Mental model
> "Reinforcement learning: agente recibe observation, toma action, recibe reward + new observation. En nuestros sistemas agenticos, el feedback loop es **observation → diagnosis → experiment → learning → back to observation**."

```text
   ┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
   │  Observe    │ →  │  Diagnose   │ →  │  Experiment  │ →  │  Learn       │ │
   │  (telemetry)│    │  (RCA)      │    │  (A/B, canary)│    │  (in-context │
   └─────────────┘    └─────────────┘    └──────────────┘    │   o retrain) │
          ↑                                                            │
          └────────────────────────────────────────────────────────────┘
```

Tres bloques:

| Bloque | Output | Salida típica |
|--------|--------|-----------------|
| **Feedback pipelines** | Issues priorizadas con severidad | Backlog de mejoras |
| **Experimentation** | Validación antes de deploy | Métrica + confianza para ship/no-ship |
| **Continuous learning** | Mejoras embebidas | Prompt actualizado, modelo fine-tuneado |

## Feedback pipelines: observar y diagnosticar

### Detección automática y RCA

> [!note> Compresión del problema
> "Cuando un sistema procesa cientos de alertas diarias, **mirar logs manualmente no escala**. Automated pipelines usan reglas, anomaly detection y statistical clustering para detectar patrones repetidos. La **root cause analysis** es iterativa: workflow tracing → fault localization → pattern recognition → impact assessment."

```text
   Falla detectada                            Acción propuesta
   ────────────────                            ────────────────
   "query_logs falla 12%        →  ¿el prompt genera SQL malformado?
   de las veces"                       →  Añadir validation step
                                   →  Limitar complejidad del query
                                   →  Fallback automático
```

### Frameworks open source

| Framework | Firma | Lo que hace |
|-----------|-------|-------------|
| **DSPy** (Stanford NLP) | Pipelines declarativos + optimizers automáticos | Compila pipelines declarativos en prompts optimizados. `BootstrapFewshot` y `MIPROv2` generan automáticamente few-shot examples y prompts desde un dataset + métrica. |
| **Microsoft Trace** | Optimización generativa black-box | Usa un LM para **proponer y evaluar mejoras** iterativamente a partir de feedback signals (scores, NL critiques, pairwise preferences). |
| **TextGrad** | NLP-as-gradients | Optimiza prompts haciendo que el LM critique su propio output y proponga edits. |

```python
# DSPy ejemplo simplificado
import dspy

class SOCPipeline(dspy.Module):
    def __init__(self):
        super().__init__()
        self.triage = dspy.ChainOfThought(TriageSignature)

    def forward(self, alert):
        return self.triage(alert=alert)

# Optimizer automático (MIPROv2 usa Bayesian search sobre instrucciones + demos)
optimizer = dspy.MIPROv2(
    metric=dspy.evaluate(triage_correct),
    num_threads=4,
)
optimized = optimizer.compile(
    SOCPipeline(),
    trainset=train_alerts,                     # dataset con ejemplos
    valset=val_alerts,
)
```

> [!tip> El loop de optimización de prompts
> **initial prompt** → ejecuta en train → **evaluator model** lo puntúa vs dataset → **optimizer model** genera nuevo prompt → repite. Sin tocar pesos del modelo base.

### Human-in-the-Loop (HITL) review

Algunos issues requieren criterio humano:

```text
   Pipeline detecta                Routed a human
   ────────────────                ──────────────
   Triage borderline              security engineer evalúa
   Anomalía inexplicable           domain expert analiza
   Failure ética/regulatoria        legal/compliance team
   Tarjeta de alto valor            product owner aprueba
   Conflicto entre herramientas    arbitra en el trade-off
```

> [!quote> Cómo estructurar el escalado
> "Para encontrar el balance entre humano y AI, los criterios de escalación deben priorizar **casos de menor certeza** y **outcomes más consequenciales**. Muchas foundation models emiten un certainty score (0-1) junto a la respuesta — `certainty: 0.45`. Thresholds: **escala si certainty < 0.5 o failure rate > 20%**."

```python
# Pipeline que escala casos low-certainty
def should_escalate(response, thresholds=None):
    thresholds = thresholds or {"low_certainty": 0.5, "high_failure": 0.20}
    certainty = extract_certainty_score(response)
    failure_rate = response.get("failure_rate_in_recent_window", 0)
    return certainty < thresholds["low_certainty"] or failure_rate > thresholds["high_failure"]
```

### Prompt and tool refinement

Una vez diagnosticado, la mejora se aplica sobre tres ejes:

```text
   Eje              Acción                          Cuándo
   ────             ──────                          ──────
   Prompt           Wording tightening, examples    Mayoría de casos
   Tool             Validation, parameter shapes     Parsing errors
   Reasoning        Reorder steps, add constraints  Multi-step failures
```

> [!tip> Cuándo NO iterar más
> "Iterar sobre prompts y tools es **gratis en CPU, costoso en atención humana**. Si después de 3-4 iteraciones no mejoras 5%, **pregunta si la tarea tiene sentido para tu modelo**. A veces la respuesta correcta es reducir el scope o cambiar a un small LM específico."

### Aggregation and prioritization

Los issues se acumulan. Sin priorización, el backlog explota:

```text
   Criterio de priorización
   ────────────────────────
   Impacto           % de tareas afectadas
   Severidad         ¿cuánto duele al usuario?
   Reversibilidad    ¿se arregla rápido o requiere reentrenar?
   Costo             ¿cuánto cuesta la mejora?
```

## Experimentación: validar antes de deploy

Una mejora pasa de "parece buena idea" a "está desplegada" solo cuando pasa por experimentación.

### Shadow deployments

Ya cubierto en [[11-monitoreo-en-produccion|Cap. 10]]: la nueva versión procesa las mismas queries **sin afectar usuarios**, permite comparar behavior sin riesgo.

### A/B testing

Asignar **5% a variante canary, 95% a baseline**, durante suficiente tiempo para que la métrica sea estadísticamente significativa:

```text
   Asignación:        Cookie/ID hash → bucket 5% o 95%
   Métrica de éxito:   task success rate, latency, user feedback
   Duración:          hasta N samples o X días, lo que llegue primero
   Significancia:     p-value < 0.05, lift > X% sobre baseline
```

> [!success> Cuándo NO A/B testing
> "Si el cambio tiene **riesgo catastrófico** (seguridad, salud, finanzas), shadow mode + review manual > A/B testing. A/B testing brilla en cambios incrementales de UX, prompts, routing. En cambios estructurales, prefieres **switch directo con monitoreo intensivo**."

### Bayesian Bandits

Para escenarios donde **la respuesta correcta cambia constantemente** (e.g., qué modelo usar para cada tipo de query):

```text
   Variantes:              Model A, Model B, Model C
   Reward por variant:    success rate en cada task
   Algoritmo:             Thompson sampling — actualiza priors
                           bayesianos por cada resultado, prioriza
                           variantes con mayor posterior
   Exploración vs          equilibrio natural: alta incertidumbre
   explotación:            → más exploración; baja → más explotación
```

```python
# Conceptual Thompson sampling en langfuse/langsmith
import random
priors = {"model_a": [3, 1], "model_b": [2, 3], "model_c": [4, 2]}    # Beta(α,β)

def select_model():
    samples = {k: random.betavariate(*v) for k, v in priors.items()}
    return max(samples, key=samples.get)                                # argmax

# Tras cada observación: actualiza priors[chosen][success ? 0 : 1]
```

> [!note> Cuándo Bayesian bandits ganan
> "Bandits son ideales cuando **el contexto (o el usuario) tiene preferences cambiantes**. Si el dataset es estático, A/B testing simple es suficiente. Si cada interaction es un experimento único, bandits son más eficientes porque convergen más rápido que A/B testing por usuario."

## Continuous learning: embeber la mejora

Dos modos: **in-context (inmediato, gratis en CPU)** y **offline retraining (lento, profundo)**.

### In-context learning

Las mejoras no requieren reentrenar — **se embuten en el prompt**:

```text
   Fuentes:
   ────────
   - Reflexion / ExpeL (Cap. 7)       →  reflexión como few-shot
   - Few-shot dinámico                  →  retrieve from eval set
   - System prompt tuning              →  update static instructions
   - Memory bank of past solutions     →  RAG-like retrieval
```

> [!success> Loop end-to-end
> "Cuando un agente tiene éxito en un escenario difícil, **guarda el trace como golden path** en el corpus de few-shot. Cuando falla, **guarda como regression test**. El sistema aprende continuamente del feedback loop sin tocar pesos. Fine-tuning es más profundo pero más arriesgado."

### Offline retraining

Para cambios de comportamiento más profundos: fine-tuning del modelo con la data acumulada.

```text
   Trigger:
   ────────
   - Acumulación de N miles de ejemplos curados
   - Cambio de voz / tono del agente
   - Latencia / coste demasiado alto (small LM específico)
   - Distribución shift significativa

   Pipeline:
   ─────────
   eval set de regresión    ── debe pasar antes de deploy
   + ejemplos curados        ── SFT/DPO (Cap. 7)
   + eval set holdout        ── medir uplift real
```

> [!tip> Offline vs Online
> "**In-context** es barato y rápido — úsalo siempre. **Fine-tuning** es caro y lento — úsalo solo cuando sepas exactamente qué quieres memorizar. Y **mide siempre** sobre un holdout que el modelo nunca haya visto durante training, para detectar overfitting al corpus."

## Tabla resumen del capítulo

| Técnica | Propósito | Strengths | Limits |
|---------|-----------|-----------|--------|
| **Feedback pipelines** | Observe, analyze, prioritize issues | Scalable, blends auto + human | Depends on data quality |
| **Human-in-the-loop** | Resolve nuanced / edge cases | Catches context automated misses | Doesn't scale to millions of cases |
| **Experimentation** | Validate before deploy | Data-driven, low-risk | Needs ample data, time |
| **In-context learning** | Adapt dynamically | Real-time, no compute cost | Limited by context window |
| **Offline retraining** | Embed deep changes | Long-lasting updates | Overfit risk, slow |

## Resumen del capítulo

- Los **fallos** son inevitables; la **calidad del agente** se mide por cómo aprende de ellos.
- Tres bloques cerrados: **feedback pipelines** → **experimentation** → **continuous learning**.
- **DSPy** y **Microsoft Trace** automatizan la optimización de prompts sobre datasets + métricas.
- **Human-in-the-loop** complementa la automatización en casos de baja certeza o alto valor.
- **Experimentación** (shadow, A/B, Bayesian bandits) valida cambios antes de tocar producción.
- **Continuous learning**:
  - In-context: barato, inmediato, limitado por context window.
  - Offline retraining: profundo, caro, requiere eval set de regresión.
- Cuando un agente funciona bien → golden path. Cuando falla → regression test. Ambos al corpus.

> [!quote> Cierre
> "Los agentic systems están en producción están diseñados para ser **evolutivos, no estáticos**. Equipos que observan, experimentan y aprenden continuamente de production data **mejoran con el tiempo**, mientras que los que solo iteran manualmente **se quedan atrás** frente al ritmo de cambio del mundo real."

## Próximos pasos

Los sistemas agenticos están listos para producción, monitorizados y mejorando. ¿Pero **qué podría romperlos**? Entramos en seguridad y threat modeling en [[13-proteccion-de-sistemas-agenticos]].
