---
title: "Validación y medición : cómo saber si el agente funciona"
description: "Cómo medir sistemas agenticos: métricas tradicionales vs semánticas para LLMs, integrar evaluación al development lifecycle, escalar evaluation sets, evaluación por componente (tools, planning, memory, learning), evaluación holística (consistencia, coherencia, alucinación, edge cases) y preparar para deploy"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, evaluation, observability, hallucination, llm-as-judge, evals]
---

# Validación y medición

> [!abstract] Resumen
> Construir agentes es fácil; **medirlos correctamente es el reto**. Sin evaluación rigurosa no se sabe si los cambios son mejoras, no se detectan regresiones, y la confianza del equipo y del usuario se evapora. El capítulo define un marco de medición práctico: **integrar evaluación en el development lifecycle** (no al final), **crecer evaluation sets** que cubran hero scenarios y long-tail, **evaluar por componente** (tools, planning, memory, learning) y luego **evaluación holística** end-to-end (performance, consistencia, coherencia, alucinación, manejo de unexpected inputs). Cierra con **Preparing for Deployment**, el pre-launch gate antes de que tu agente toque usuarios reales.

## Medición es el keystone

> [!quote> Tesis del capítulo
> "Sin medición rigurosa y continua, es imposible saber si los cambios son mejoras reales, entender cómo los agentes se comportan en entornos realistas y adversariales, o protegerse contra regresiones inesperadas."

Tres clases de métricas:

| Tipo | Ejemplos | Cuándo medir |
|------|----------|--------------|
| **Quantitativa** | Accuracy, latency, robustness, scalability, precision, recall | Continuo, automated |
| **Cualitativa** | User satisfaction, design quality | Sampling + human-in-the-loop |
| **Semántica** (LLM-specific) | Embedding distance, **BERTScore**, BLEU, ROUGE, **LLM-as-judge** | En lugar de exact match, mide intención |

> [!note> Métricas tradicionales fallan en LLMs
> "En agentes basados en lenguaje, **exact-match metrics frecuentemente fallan** en capturar utilidad real — la respuesta correcta puede tomar muchas formas. Por eso el practice moderno recae en **semantic similarity** (BERTScore, embeddings) y **LLM-as-judge** que evalúan intención más que wording."

### Hero scenarios primero

Definir un **hero scenario** — un caso representativo, alta prioridad, que define el éxito del agente. Las métricas nacen de medir el agente contra ese hero:

```text
   Hero: customer support ecommerce recibe mensaje sobre mug rota
        ↓
   Métricas:
   - ¿Llamó a la tool correcta? (issue_refund)
   - ¿Pasó los parámetros correctos? (order_id)
   - ¿Dio confirmación clara?
   - Latencia end-to-end < X segundos
```

Variantes: multi-item orders, cancellation, address change — cada variante prueba un edge del caso.

## Integrar evaluación al lifecycle

> [!danger> No relegar la medición al final
> "Sin evaluación sistemática, es demasiado fácil para equipos expertos engañarse a sí mismos pensando que sus agentes mejoran cuando el progreso es ilusorio o disparejo."

Cuatro prácticas:

```text
   1. Offline eval  ── al mergear PR / cambiar modelo / cambiar tools
   2. Hero scenarios ── must-pass checks; si rompen, no ship
   3. Reg sets       ── regression detection entre versiones
   4. Sampling       ── QA humano en samples aleatorios production
```

> [!tip> Live vs offline
> **Offline eval** (datasets curados, estables): regression detection, A/B comparison. Rápido, reproducible.
>
> **Live eval** (tráfico real): captura distribución real, long-tail. Sampling + human-in-the-loop.

### Crecer el evaluation set continuamente

Los **static test suites** se quedan cortos: sobrefitean, pierden long-tail, no pueden seguir workflows en evolución. Una buena **eval set** se **grows with the system**:

```text
   v1.0   50 hero scenarios  ────────────────────────
   v1.1   50 hero + 12 fallos de v1.0  ───────────────  ← failure modes
   v1.2   50 hero + 12 + 8 edge cases de producción ─  ← real traffic insights
   ...
```

```json
{
  "order": {
    "order_id": "A89268",
    "status": "Delivered",
    "total": 39.99,
    "items": [
      {"sku": "MUG-001", "name": "Ceramic Coffee Mug", "qty": 1, "unit_price": 19.99},
      {"sku": "TSHIRT-S", "name": "T-Shirt-Small",     "qty": 1, "unit_price": 20.00}
    ],
    "delivered_at": "2025-05-15"
  },
  "conversation": [
    {"role": "customer",  "content": "Hi, my coffee mug arrived cracked..."},
    {"role": "assistant", "content": "I'm very sorry about that! Could you please send us a quick photo..."}
  ]
}
```

## Component evaluation

Evaluar **componentes aislados** del agente antes de medir el end-to-end. **Cinco dimensiones**:

### Evaluar tools

¿El agente llama a la **tool correcta** con los **parámetros correctos**?

```python
# Métricas típicas sobre un dataset
metrics = {
    "tool_precision":   casos_correctos / casos_totales,         # ¿la tool?
    "parameter_accuracy": args_correctos / args_esperados,        # ¿los params?
    "tool_recall":         tools_usadas_esperadas_encontradas,   # completeness
}

# Salidas a testear
def evaluate_tool_call(predicted_tool_call, expected):
    assert predicted_tool_call["name"] == expected["name"]      # tool correcta
    assert predicted_tool_call["args"]["order_id"] == expected["args"]["order_id"]  # params correctos
    return True
```

### Evaluar planning

¿El plan que genera el agente **cubre los pasos necesarios** y los **ordena bien**?

- **Plan coverage**: ¿todos los sub-objetivos del hero tienen un step en el plan?
- **Order correctness**: ¿el orden de los steps respeta dependencias?
- **Plan efficiency**: ¿hay steps redundantes o innecesarios?

### Evaluar memory

¿El agente **recuerda lo que debería** y **no contamina** con info no pertinente?

- **Recall**: ¿cuántos eventos relevantes recupera cuando los necesita?
- **Precision**: ¿de los eventos recuperados, cuántos son realmente relevantes?
- **No leakage**: ¿evita traer info de otros user sessions?

### Evaluar learning

Si el sistema tiene mejora continua (Reflexion, ExpeL, fine-tuning):

- ¿Las reflexiones generadas son útiles? (LLM-as-judge eval)
- ¿La accuracy mejora entre iteraciones sobre el mismo eval set?
- ¿El feedback humano (👍/👎) correlaciona con mejoras reales?

## Holistic evaluation

Evaluar el **agente entero end-to-end** con métricas cualitativas y de comportamiento:

| Métrica | Qué mide | Cómo |
|---------|----------|-----|
| **Performance** | Tiempo end-to-end, success rate | Timestamp end-start, success flag |
| **Consistencia** | Mismo input → mismo output (modulo variabilidad LLM) | Multiple runs sobre mismo dataset |
| **Coherence** | Respuesta tiene sentido lógico narrativo | LLM-as-judge + human sampling |
| **Hallucination** | Output se apalanca en el contexto correcto (no inventa facts) | RAG faithfulness eval, human review |
| **Unexpected inputs** | Edge cases — adversarial, ambiguous, malformed | Adversarial eval set |

### Hallucination: el asesino silencioso

```text
   Tipos de alucinación en agentes:
   ──────────────────────────────
   - Factual:    inventa datos que no existen en el KB
   - Source:     atribuye la respuesta a sources incorrectas
   - Logical:    conclusiones no se siguen de las premisas
   - Fabricated: inventa policies, procedures, capabilities que no tiene
```

> [!success> Defensa contra alucinaciones
> - **RAG faithfulness**: la respuesta se basa en los chunks recuperados, no en alucinación libre.
> - **Tool verification**: si el agente invoca una tool, ejecuta el output; no se inventa responses.
> - **LLM-as-judge con rubric**: otro LLM evalúa "esta respuesta se sostiene con el contexto dado (Y/N)".

### Handling unexpected inputs

Adversarial eval set incluye:

```text
   - Inputs vacíos / muy largos / malformed
   - Inyecciones de prompt ("ignore previous instructions")
   - Lenguaje no esperado (mezcla idiomas, errores tipográficos)
   - Inyección JSON ("} malformed input {")
   - Race conditions (input changes mid-task)
```

> [!warning> No intentes cubrir todo al 100%
> "No intentes cubrir cada combinación de inputs. En su lugar, **categorías representativas** y edge cases conocidos. Cubre lo que importa al usuario."

## Preparing for deployment

El pre-launch gate:

```text
   ☐ Hero scenarios: 100% pass rate
   ☐ Reg tests: ninguna regresión vs última release
   ☐ Performance: latency p95 < SLA
   ☐ Adversarial: comportamiento aceptable en inputs hostiles
   ☐ Holistic: coherence + consistency + hallucination dentro de umbrales
   ☐ Observability: logs, traces, métricas listas (siguiente capítulo)
   ☐ Rollback: mecanismo de rollback a versión anterior definido
   ☐ User feedback: mecanismo de feedback en producción
```

```text
   Pre-launch check                                  Post-launch
   ──────────────────                                ────────────
   Offline eval set ── 100% pass                    Sample 5% traffic → human review
   Hero scenarios  ── pass                          Live eval set → eval set grows
   Reg tests       ── no regression                 Drift detection → re-train si necesario
   Synthetic load  ── p95 < SLA                     Production traces → debugging
```

## Resumen del capítulo

- **Measurement is the keystone**: sin evaluación rigurosa no sabes si mejoras o regresiones.
- Define **hero scenarios** y métricas sobre ellos. Integra evaluación al **development lifecycle** (no al final).
- Crece el **evaluation set** continuamente con failure modes y long-tail. Auto-evalúa en cada PR, no en cada release.
- Evalúa por **componente** (tools, planning, memory, learning) y luego **holísticamente** (performance, consistency, coherence, hallucination, edge cases).
- Para LLMs, **métricas semánticas** (BERTScore, embedding distance, LLM-as-judge) > exact match.
- **Hallucination** requiere defenses explícitas: RAG faithfulness, tool verification, judge prompts.
- **Adversarial eval set** con inputs hostiles y edge cases forma tu red de seguridad.
- Pre-deployment gate: hero + reg + perf + adversarial + observability + rollback + feedback.

> [!note> Toma de cierre
> "Medición y validación no son opcionales en producción — son la **diferencia entre un agente que mejora con el tiempo y uno que silenciosamente degrada**. Sin medidas, cualquier cambio es un volado."

## Próximos pasos

El agente ha pasado los gates y está en producción. Ahora la pregunta es: ¿qué está pasando ahí fuera? El siguiente capítulo entra en [[11-monitoreo-en-produccion]].
