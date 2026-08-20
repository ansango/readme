---
title: "Orquestación : tipos de agente, tool selection, topologías y context engineering"
description: "Cómo decide un agente qué hacer: arquetipos (Reflex, ReAct, Planner-Executor, Query-Decomposition, Reflection, Deep Research), selección de tools (standard, semantic, hierarchical), ejecución (single, parallel, chains, graphs), y context engineering como el pegamento entre planning y execution"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, orchestracion, react, planning, context-engineering, langgraph]
---

# Orquestación

> [!abstract] Resumen
> Orquestación es **más que decidir qué tools llamar**: es construir el contexto correcto para cada invocación. El capítulo abre con el **espectro de arquetipos de agente** — de reflex (sin razonamiento, milisegundos) hasta deep research (multietapa, latencia alta) — y recorre tres ejes: **tool selection** (standard, semantic, hierarchical), **tool execution** (single, parallel, chains, graphs) y **context engineering** (relevancia, claridad, summarización, ensamblaje dinámico). La regla pragmática que cierra el capítulo: *"start small, then graduate up"* — usa chain hasta que necesites graph, standard tool selection hasta que necesites hierarchical, ReAct hasta que necesites reflection.

## Los seis arquetipos de agente

| Tipo | Mentalidad | Latencia | Caso ideal |
|------|-----------|----------|-----------|
| **Reflex** | if → then, sin razonamiento | ms | Keyword routing, lookups simples |
| **ReAct** | Thought → Action → Observation en loop | media | Exploración, troubleshooting, agregación multisource |
| **Planner-Executor** | Plan explícito → ejecución de cada step | media-alta | Multistep processes, debuggeabilidad |
| **Query-Decomposition** | "¿Qué subpregunta necesito?" → tool → siguiente → synthesis | media | Research, fact-based Q&A |
| **Reflection** | ReAct + auto-crítica y replanning | alta | High-stakes (finanzas, salud) |
| **Deep Research** | Combina planner + decomposition + reflection | muy alta | Literature reviews, due diligence |

### Reflex agents

```text
   Input    →    match(condición)   →    Tool X
```

Sin plan, sin razonamiento, sin estado. Latencia mínima. Útiles para **routing keywords** y **single-step lookups**. Limitados: no atienden multistep o contexto más allá del input inmediato.

### ReAct agents

Reason + Action en bucle. Cada iteración produce un `thought` (qué voy a hacer), ejecuta la tool, observa el resultado, repite.

```text
   Thought 1 ─→ Action (tool call)  ─→ Observation 1
       │                                   │
       └────────── feeds back ──────────────┘
                 ↓
   Thought 2 ─→ Action               ─→ Observation 2
                 ↓
            ... until done
```

LangChain expone `ZERO_SHOT_REACT_DESCRIPTION` (single prompt) y `CHAT_ZERO_SHOT_REACT_DESCRIPTION` (con historial). **Pros**: exploración dinámica, reasoning auditable. **Contras**: latencia y coste por las llamadas iterativas.

### Planner-Executor

Dos fases explícitas. Fase 1: un LLM genera un plan multistep. Fase 2: cada step se ejecuta (posiblemente con LLMs o tools más pequeñas).

```text
   Plan (LLM grande):
     1. validate order id
     2. fetch order from DB
     3. issue refund
     4. send confirmation email
        ↓
   Execute steps (con re-plan si algo falla)
```

Pros: separación clara, **debuggeabilidad** (miras el plan cuando algo falla), **coste optimizable** (LLM grande solo en planning, ejecuciones más baratas). Contras: la fase de planning puede fallar — el modelo debe ser bueno descomponiendo.

### Query-decomposition ("self-ask")

```text
   "¿Quién vivió más, X o Y?"
        ↓
   "Necesito saber la edad de X"  → search("X lifespan")
        ↓
   "Necesito saber la edad de Y"  → search("Y lifespan")
        ↓
   Synthesize: "X 85, Y 90 → Y vivió más"
```

LangChain lo expone como `SELF_ASK_WITH_SEARCH`. Cada paso ground su siguiente paso en output de tool. Excelente cuando la respuesta final depende de varias recuperaciones encadenadas.

### Reflection agents

Extiende ReAct con una fase extra de **auto-revisión**: después de cada `observation`, el agente evalúa si el resultado coincide con el objetivo. Si no, replanifica.

```text
   ReAct loop + Reflection
        ↓
   ¿estoy cumpliendo el objetivo?
       ├─ Sí → continuar
       └─ No → replanificar / corregir / rollback
```

**Crítico en high-stakes workflows** (transacciones financieras, soporte clínico, respuesta a incidentes) donde un error temprano se vuelve catastrófico. El overhead extra es tolerable cuando correctness importa más que latencia.

### Deep Research agents

El heavy-weight del espectro. Combina **planner-executor + query-decomposition + reflexión iterativa** sobre hipótesis emergentes.

```text
   Plan general ─→ Decompose ─→ Search APIs ─→ Reflect
       │                                  │
       └───── adapta con nueva evidencia ───┘
                ↓
       Synthesize evolving report
```

Ideal para literatura académica, due diligence técnico, inteligencia competitiva. **Limitaciones críticas**: coste muy alto (muchas llamadas al LLM), latencia inaceptable para muchos casos de uso, frágil ante fuentes de baja calidad. Resérvalo para **trabajos largos y de alto rigor**.

```text
   Type           Strength         Weakness          Best use case
   ─────────      ─────────        ─────────         ────────────────
   Reflex         ms responses     sin multistep     keyword routing
   ReAct          flexible adapt    higher cost       troubleshooting
   Plan-exec      clear breakdown  planning overhead multistep process
   Query-dec      grounded retrie   multi tool calls  research Q&A
   Reflection     early error det  added compute     high-stakes
   Deep research  multistage capa   very high cost    literature reviews
```

## Tool selection

Tres estrategias. El orden es aproximadamente **simplicidad ↔ coste ↔ escalabilidad**.

### Standard tool selection

Pasas al modelo **todas las tools** con su descripción, el modelo elige cuál invocar. Lo que ya hemos visto en capítulo 4 (`bind_tools`).

```text
   Model + all tools + query  →  1 tool + parameters
```

**Calidad de selección depende de las descripciones** que escribas. Reglas:

```text
   Nombre distintivo:        calculate_sum, no process_numbers
   Descripción concisa:     "Returns the sum of two numbers"
   Ejemplo de invocación:   "Ej: add(2,3) → 5"
   Constraints explícitas:   "x,y enteros entre 0 y 1000"
```

> [!warning> Límite de escalabilidad
> Cuando tienes cientos de tools, las descripciones empiezan a solaparse y el modelo se confunde. Standard tool selection **escala mal**.

### Semantic tool selection

```text
   Tool descriptions ──→ Embeddings ──→ Vector store (FAISS, etc.)
                                                         ↑
   Query               ──→ Embedding  ──→ Top-k retrieval ─┘
                                                         ↓
                                               pick from top-k
```

Reduces la elección a un **top-k pequeño** sobre el que el LLM elige. Indexa **una vez** (los embeddings no cambian salvo que cambies las descripciones). **Pros**: escala a cientos o miles de tools con latencia de retrieval mínima. **Contras**: las colisiones semánticas ("send email" vs "send message") pueden empeorar la accuracy.

```python
from langchain_openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
import faiss, numpy as np

embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
tool_embeddings = [embeddings.embed_text(d) for d in tool_descriptions.values()]

index = faiss.IndexFlatL2(len(tool_embeddings[0]))
index.add(np.array(tool_embeddings).astype('float32'))

def select_tool(query, top_k=1):
    """Recupera tools relevantes por búsqueda semántica y los devuelve."""
    query_embedding = embeddings.embed_text(query)
    distances, indices = index.search(np.array([query_embedding]).astype('float32'), top_k)
    return [index_to_tool[i] for i in indices[0]]
```

### Hierarchical tool selection

Para tool sets grandes con muchas tools **semánticamente similares**, divide en grupos por dominio, y resuelve en dos pasos:

```text
   User query
       ↓
   Step 1: ¿qué grupo? (Computation | Automation | Communication)
       ↓
   Step 2: dentro del grupo, ¿qué tool?
       ↓
   Tool call
```

```python
def select_group_llm(query):
    prompt = f'''Select the most appropriate tool group for the following query:
        '{query}'.\nOptions are: Computation, Automation, Communication.'''
    return llm([HumanMessage(prompt)]).content.strip()

def select_tool_llm(query, group_name):
    prompt = f'''Based on the query: '{query}', select the most appropriate tool from group '{group_name}'.'''
    return llm([HumanMessage(prompt)]).content.strip()
```

> [!note> Trade-off
> Más **latencia** por la doble llamada, **mayor accuracy** al descomponer el problema en dos búsquedas más cortas.

```text
   Strategy               Pros                 Cons
   ────────               ────                ────
   Standard               simple, sin infra    escala mal a >50 tools
   Semantic               escala a >100 tools  colisiones semánticas
   Hierarchical           escala a >1000       doble llamada LLM
```

## Tool execution

Cuatro topologías determinan **cómo** se ejecutan las tools dentro del plan.

### Single tool execution

```text
   Think → Tool X  →  observe  →  Think
```

El más simple. Suficiente para tareas donde no se necesita información en paralelo.

### Parallel tool execution

Cuando el agente necesita datos de **múltiples fuentes independientes**, dispara varias tools en paralelo y agrega los resultados.

```text
   Ticket de soporte
       ├─ get_customer_details()
       ├─ get_order_history()
       ├─ get_service_logs()
       ├─ get_similar_tickets()
       └─ get_support_policy_excerpt()
       ↓
   Consolidate → Final response
```

**Cuándo**: las queries son independientes, no se dependen entre sí. Reduce latencia total incluso si consume más tokens en un solo paso.

### Chains

Secuencias lineales donde **cada paso depende del anterior**. Perfectas para "prompt → model → parser" o "fetch → validate → transform".

```python
from langchain_core.runnables import RunnableLambda
from langchain.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = RunnableLambda.from_callable(ChatOpenAI(model_name="gpt-4", temperature=0).generate)
prompt = RunnableLambda.from_callable(lambda text: PromptTemplate.from_template(text).format_prompt(...).to_messages())

chain = prompt | llm   # LangChain Expression Language (LCEL)
result = chain.invoke("What is the capital of France?")
```

> [!warning> Length cap
> "Es altamente recomendado poner un máximo a la longitud del tool chain. Errores se compound a lo largo de la cadena."

### Graphs

Cuando necesitas **branching + consolidación**. Una topología en graph modela workflows no-hierárquicos: aristas condicionales, ramificación, merge.

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class AgentState(TypedDict):
    messages: list
    user_message: str

def categorize_issue(state):
    # LLM clasifica el ticket
    return {**state, "issue_type": "billing" if "invoice" in state["user_message"] else "technical"}

def handle_invoice(state):
    return {**state, "step_result": "Invoice info retrieved"}

def handle_refund(state):
    return {**state, "step_result": "Refund processed"}

def summarize(state):
    return {**state, "response": f"Customer reply based on {state.get('step_result')}"}

graph = StateGraph(AgentState)
graph.add_node("categorize", categorize_issue)
graph.add_node("billing", handle_invoice)
graph.add_node("refund", handle_refund)
graph.add_node("summary", summarize)

graph.add_edge(START, "categorize")
graph.add_conditional_edges("categorize",
    lambda s: "billing" if s["issue_type"] == "billing" else "refund",
    {"billing": "billing", "refund": "refund"})
graph.add_edge("billing", "summary")
graph.add_edge("refund", "summary")
graph.add_edge("summary", END)

result = graph.compile().invoke({"user_message": "I need help with my invoice", "issue_type": "billing"})
```

> [!success> Cuándo subir de chain a graph
> "Start with a chain si tu task es estrictamente lineal (prompt → model → parser). Chains son fáciles de razonar y debuggear. **Adopta graph solo cuando necesites tanto branching como consolidación** (e.g., análisis paralelos que alimentan un resumen único)."

## Context engineering

> [!quote> Premisa central
> "A medida que los modelos mejoran, la frontera del diseño agentico se está moviendo de la arquitectura del modelo a la **calidad del contexto que provees**. Un contexto bien diseñado desbloquea el potencial incluso de modelos modestos. Un mal contexto socava los mejores sistemas."

**Context engineering** ≠ prompt engineering. Mientras prompt engineering se centra en escribir instrucciones, context engineering **ensambla dinámicamente** todos los inputs en una ventana de contexto estructurada y token-eficiente.

### Las cinco prácticas

1. **Priorizar relevancia**: recupera solo la info útil de memory/kb, no appends indiscriminados de texto grande.
2. **Mantener claridad estructural**: schemas como **MCP** pasan estado y retrieved knowledge de forma predecible.
3. **Summarización**: comprime historiales largos en representaciones concisas preservando detalles críticos.
4. **Ensamblaje dinámico en cada step**: el contexto cambia con el objetivo actual del agente, el stage del workflow y el input del usuario.
5. **Tools y KB**: elige retrieval que trae contexto relevante, no el más voluminoso.

```text
   Simple system              Agent avanzado
   ─────────────              ─────────────
   system prompt              system prompt
   user query        →        user query
                              order summary (RAG)
                              policy excerpts (RAG)
                              prior conversation summary
                              current step_result
                              tool observations
```

> [!note> Context engineering es el pegamento
> Une memory, knowledge y orchestration. Sin un contexto bien construido, los planes quedan abstractos y la ejecución se vuelve ciega.

## Reglas de oro del capítulo

> [!quote> Cinco mandatorios para diseñar planificación
> 1. **Considera latency vs accuracy** explícitamente — son trade-offs reales.
> 2. **Cuenta el número típico de acciones** del task — más acciones, más complejo el plan que necesitas.
> 3. **Evalúa cuánto necesita cambiar el plan** en función de acciones previas.
> 4. **Diseña test cases representativos** antes de elegir arquitectura.
> 5. **Elige la opción más simple** que cumpla los requisitos.

El cierre del capítulo insiste en **start small**:
> "Empieza con escenarios bien diseñados y approaches simples a orquestación, luego sube gradualmente la escala de complejidad según el caso de uso lo demande."

## Resumen del capítulo

- **Seis arquetipos**: reflex (ms) → ReAct (adaptativo) → planner-executor (explícito) → query-decomposition (grounded research) → reflection (high-stakes) → deep research (long-form expert).
- **Tool selection**: standard (simplicidad), semantic (escala via embeddings), hierarchical (escala extrema a costa de latencia).
- **Tool execution**: single → parallel → chains → graphs; sube de complejidad solo cuando el caso de uso lo exige.
- **Context engineering**: ensamblaje dinámico del contexto correcto en cada step; usa summarization, retrieval relevante y schemas como MCP.

## Próximos pasos

Con orquestación y tools en mano, los agentes necesitan **memoria y conocimiento** para no ser stateless. Entramos en [[06-conocimiento-y-memoria]].
