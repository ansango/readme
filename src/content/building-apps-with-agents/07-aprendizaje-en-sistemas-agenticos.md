---
title: "Aprendizaje en sistemas agenticos : few-shot, Reflexion, fine-tuning, SFT, DPO, RLVR"
description: "Cómo mejoran los agentes con el tiempo: nonparametric (exemplar learning, Reflexion, experiential learning con ExpeL) versus parametric (fine-tuning supervisado, DPO, RLVR) y la promesa de los modelos pequeños específicos"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, fine-tuning, dpo, rlvr, reflexion, expel, small-models]
---

# Aprendizaje en sistemas agenticos

> [!abstract] Resumen
> Hay dos grandes familias para que un agente **mejore con la experiencia**. **Nonparametric learning** (no toca los pesos del modelo): few-shot fijo, few-shot dinámico desde un vector store, **Reflexion** (el modelo se auto-critica tras cada fallo y guarda la reflexión para próximos intentos) y **ExpeL** (lista de *insights* promovidos/devaluados como una "memoria estratégica"). **Parametric learning** (toca los pesos): **fine-tuning supervisado** sobre trazas expertas, **Direct Preference Optimization** sobre pares good/bad, y **Reinforcement Learning with Verifiable Rewards** para tareas con métricas objetivas. El capítulo cierra con la promesa de los **modelos pequeños** (small-LMs) fine-tuneados para tareas específicas — más baratos que los frontier, competitivos en latencia, propiedad intelectual que se queda en casa.

## Nonparametric: aprender sin tocar pesos

Las técnicas nonparametric no modifican los pesos del foundation model — **modifican el prompt** (con ejemplos, reflexiones, insights) o **modifican el contexto retrieval** (con experiencias pasadas). Son el equivalente de *estudiar para el examen* en lugar de cambiar tu cerebro.

```text
   Nonparametric learning
   ──────────────────────
   • Exemplar learning        few-shot examples en el prompt
   • Reflexion                self-critique escrita en memoria
   • Experiential learning    insights acumulados cross-task
```

### Nonparametric exemplar learning

El más simple. El agente realiza una tarea, recibe feedback, los **casos exitosos** se almacenan y se inyectan como few-shot examples en futuros prompts.

```text
   Setup: prompt  ─┐   few-shot dinámico:
                   │   1. query entra
   Memoria:        │   2. retrieve top-k examples similares (semantic search)
   (problem,       │   3. prepend ejemplos al prompt
    solution,      │   4. LLM resuelve
    outcome)       ▼   5. evalúa y guarda el resultado
```

Dos variantes:

```text
   Fixed few-shot                    Dynamic few-shot
   ──────────────                    ───────────────
   Ejemplos hardcoded en              Retrieve en cada request los
   el system prompt.                  ejemplos más similares desde
   Bajo costo, bajo contexto.        un vector store.
                                     Más adaptativo, más caro.
```

> [!note> Trade-off clásico
> Few-shot examples mejoran la accuracy, pero **cada ejemplo que añades cuesta tokens**. Para el balance correcto: few-shot fijo limitado (3-5 ejemplos canónicos por tarea) + few-shot dinámico top-k cuando la experiencia es abundante.

### Reflexion

> [!quote> Idea central
> "Si el agente falla una tarea, haz que **escriba en lenguaje natural qué salió mal**, y guarda esa reflexión. En el siguiente intento, prepend sus reflexiones anteriores al prompt."

Es el ciclo:

```text
   1. Action sequence   ──── ejecuta el prompt-driven planning
   2. Log trial         ──── cada step (action, observation, success/fail)
   3. Generate          ──── si falla: "¿qué se me escapó? ¿qué hacer
      reflection              diferente la próxima vez?"
   4. Update memory     ──── guardar la reflexión
   5. Inject on next    ──── prepend las últimas N reflexiones al prompt
```

```python
from typing import Annotated, List, Dict
from typing_extensions import TypedDict
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-5")

reflections: list[str] = []           # memory buffer

def call_model(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": response}

reflexion_prompt = """
You will be given the history of a past experience in which you were
placed in an environment and given a task to complete. You were
unsuccessful. Do not summarize your environment, but rather think
about the strategy and path you took. Devise a concise, new plan
of action that accounts for your mistake with reference to specific
actions that you should have taken.
"""

def update_memory(trial_log_path, env_configs):
    """Adds a reflection for each unsolved env config."""
    with open(trial_log_path, 'r') as f:
        full_log = f.read()

    env_logs = full_log.split('#####\n\n#####')
    for i, env in enumerate(env_configs):
        if not env['is_success'] and not env.get('skip'):
            memory = env['memory'][-3:]                 # últimos 3 reflections
            reflection_query = f"{memory}\n\n{trial_log_path}\nBased on the above, what plan would you follow next? Plan:"
            reflection = get_completion(reflection_query)
            env_configs[i]['memory'] += [reflection]

# 2. Loop: invoke again with reflections in context
builder = StateGraph(MessagesState)
builder.add_node("reflexion", call_model)
builder.add_edge(START, "reflexion")
graph = builder.compile()

for _ in range(max_attempts):
    result = graph.invoke({"messages": [HumanMessage(reflexion_prompt)]})
    reflections.append(result)
    update_memory(trial_log_path, env_configs)
```

> [!tip> Cuándo brilla
> Reflexion es **ultraligero** — no requiere training, reescribes prompts y nada más. Brilla en code debugging y multistep reasoning donde el modelo repite errores que se autocorrige con la primera reflexión.

### Experiential learning (ExpeL)

Reflexion es *single-task learning*. ExpeL extiende a **cross-task**: el agente acumula **insights** sobre tipos de tareas y los mantiene vivos.

```text
   Insights = lista de "lecciones aprendidas" extraídas de observaciones
              ── promote lo útil, demote lo falso, edita, vota
              ── aplicadas cross-task: insights de task A sirven en task B
```

```python
class InsightAgent:
    def __init__(self):
        self.insights = []
        self.promoted = []                       # upvotes
        self.demoted = []                       # downvotes
        self.reflections = []

    def generate_insight(self, observation: str) -> str:
        """Llama al LLM para extraer una lección útil de la observación."""
        messages = [HumanMessage(content=f'''Generate an insightful analysis based on: {observation}''')]
        return llm.invoke(messages).content.strip()

    def update_insights(self, observation: str, success: bool):
        """Modifica el pool de insights según el resultado."""
        new_insight = self.generate_insight(observation)
        # dynamic voting / promotion / demotion logic...
        if success:
            self.promoted.append(new_insight)
        else:
            self.demoted.append(new_insight)
        # Update self.insights accordingly
```

> [!tip> ExpeL vs Reflexion
> Reflexion piensa *en* la task ("¿qué hice mal aquí?"). ExpeL piensa *entre* tasks ("¿qué patrón me ha funcionado en varias?"). ExpeL es valioso cuando tu agente ejecuta **familias de tareas similares** y puedes extraer principios compartidos.

## Parametric: fine-tuning

Cuando tocar los pesos gana a few-shot reflexion: dominios especializados con vocabulario propio, latencia dura (modelos pequeños específicos), propiedad intelectual (tu modelo fine-tuneado vive en tu infra).

### Fine-tuning de foundation models

```text
   Foundation model  ──→  fine-tuning  ──→  specialised model
   (e.g., GPT-5)         (SFT / DPO          - más rápido que GPT-5
                          RLVR)              - más barato
                                             - IP-friendly
```

> [!quote> Regla pragmática
> "Fine-tuning vale la pena cuando tu caso de uso justifica el coste de entrenar y mantener un modelo especializado. Para la mayoría de casos, mejor few-shot + RAG. Fine-tuning gana a largo plazo **para latencia dura**, **dominios cerrados** o cuando **el modelo debe reflejar voz y tono propietaria**."

### La promesa de los small models

```text
   Modelo            Parámetros  GPU   RAM VRAM   Hardware típico
   ──────            ──────────  ────  ─────────   ──────────────────
   Llama 3.1 Turbo   8B         20GB             RTX 3090 (gaming)
   Gemma 2           9B         22.5GB           RTX 3090
   Phi-3             14.7B      29.4GB           A100 (40GB)
   Qwen1.5           32B        60GB             A100
   Llama 3           70B        160GB            4×A100
```

> [!note> El futuro cercano
> "Pequeños modelos, abiertos y bien entrenados, están comiendo terreno a los flagship en producción. **Fine-tuned, son más baratos, más rápidos y propiedad del cliente**." La promesa de los small-LMs fine-tuneados:
> - Latencia baja (corrida on-prem, sin API hops).
> - Coste predecible por token.
> - IP-friendly (los datos de training nunca salen de tu infra).
> - Tweakable a tu voz/tarea.

### Tres técnicas de fine-tuning

#### Supervised Fine-Tuning (SFT)

El canónico. Tomas un foundation model y lo entrenas sobre **trazas expertas**: pares `input → respuesta ideal`.

```text
   Dataset SFT
   ───────────
   {"input": "...", "output": "respuesta correcta del experto"}
   {"input": "...", "output": "..."}
   ...
       ↓
   Loss = cross-entropy(output, gold)
       ↓
   Update weights via gradient descent
```

```text
   Pros                              Cons
   ────                              ─────
   Simple, estable                   Costoso: GPU/horas/datasets
   Funciona bien con pocas demos      Modelos pueden olvidar capacidades
   Comportamiento reproducible        "Catastrophic forgetting" si mucho fine-tune
```

#### Direct Preference Optimization (DPO)

Más reciente y popular. Entrenas con **pares de preferencias**: el experto etiqueta *output A* como mejor que *output B* para el mismo input.

```text
   Para cada input (q):
     output_a ── modelo produjo ── etiqueta humana: A es mejor
     output_b                      que B
       ↓
   Loss = -log sigmoid(β * [log π*(A|q) - log π(B|q)])
       ↓
   Update weights para que A suba en likelihood, B baje
```

```text
   Pros                              Cons
   ────                              ─────
   Sin modelo de reward separado     Datos de preferencias son caros (human labelers)
   Más estable que RLHF puro          Solo 2 outcomes por par
   Funciona con pocos miles de       Puede overfit a las preferencias
   preferencias                      
```

> [!note> DPO vs RLHF
> RLHF necesita entrenar **separado** un reward model, luego RL fine-tune contra él. DPO combina reward y policy en una sola loss. Más simple, menos infraestructura, mismo principio.

#### Reinforcement Learning with Verifiable Rewards (RLVR)

Para tareas donde **la calidad del output puede medirse objetivamente**. La recompensa es binaria (o casi): ¿se ejecutó el test? ¿se cumplió la constraint? ¿dio el output correcto?

```text
   Tareas con reward verificable:
   ────────────────────────────
   • código que pasa tests
   • SQL queries que ejecutan
   • math: respuesta correcta
   • juegos con score claro
```

> [!success> Por qué RLVR importa
> "RLVR elimina el reward model humano. La reward sale de ejecutar la verificación automáticamente (test suite, sandbox, calculator). Más barata, más escalable, alineada con tasks donde hay un ground truth."

## Cuándo aprender (nonparametric o parametric)

| Pregunta | Nonparametric | Parametric |
|----------|---------------|------------|
| ¿Cuánta data de feedback tienes? | Cualquier cantidad (<10 ejemplos útiles) | >10k ejemplos curados |
| ¿Necesitas deploy rápido? | Few-shot mañana | Semanas de training |
| ¿Voz propietaria de la marca? | Few-shot en prompt | Fine-tune sobre ejemplos de marca |
| ¿Latencia dura (<100 ms)? | Few-shot añade tokens | Small LM específico |
| ¿Coste por call importa? | Few-shot por call cuesta | Modelo propio en infra |
| ¿Dominio cambia frecuentemente? | Few-shot editable | Re-fine-tuning caro |

```text
   Strategies mixtas
   ────────────────
   1. Empieza con nonparametric: RAG + few-shot dinámico + Reflexion.
   2. Mide patrones: ¿qué tipo de fallo es recurrente? ¿qué insights no captura el modelo?
   3. Si acumulación significativa (cientos de ejemplos curados, voz de marca, latencia de producción):
      pasar a fine-tune un modelo base con SFT o DPO.
   4. Verificar la mejora con el [[10-validacion-y-medicion|Cap. 9]] antes de commit.
```

## Resumen del capítulo

- **Nonparametric** es aprender **modificando el prompt**: few-shot fijo, few-shot dinámico, **Reflexion** (self-critique escrita), **ExpeL** (insights acumulados cross-task).
- **Parametric** es **tocar los pesos**: **SFT** sobre trazas expertas, **DPO** sobre preferencias, **RLVR** sobre rewards verificables.
- Los **small-LMs fine-tuneados** son una alternativa creciente a los frontier: baratos, rápidos, propiedad del cliente.
- Elige nonparametric primero. Salta a parametric cuando (a) acumulas data suficiente, (b) necesitas voz/latencia/scale que few-shot no cubre.
- Cualquier técnica de aprendizaje debe ir acompañada de **evaluación rigurosa** en el [[10-validacion-y-medicion|Cap. 9]].

> [!note> Cierre del capítulo (paráfrasis)
> "Aprendizaje en sistemas agenticos no es opcional en producción: el mundo cambia, los modelos deben cambiar con él. Nonparametric es rápido y barato; parametric es profundo y propio. Elige el que tu timeline, presupuesto y nivel de madurez permita — pero no te quedes sin ninguno."

## Próximos pasos

Un agente que aprende necesita **medir si aprende**. Entramos en [[10-validacion-y-medicion]] para construir el sistema de evaluación que separa experimentación de producción.
