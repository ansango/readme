---
title: "De un agente a muchos — Parte A : decidir y coordinar agentes"
description: "Cuándo y cómo dividir en múltiples agentes: single-agent vs multiagent, principles (task decomposition, specialization, parsimony, coordination, robustness, efficiency), democratic/manager/hierarchical/actor-critic coordination, ADAS"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, multi-agent, coordination, adas, hierarchical]
---

# De un agente a muchos — Parte A

> [!abstract] Resumen
> La mayoría de casos empiezan con un solo agente. A medida que el *toolset* y la complejidad crecen, **multi-agent** mejora performance y mantenibilidad — pero solo si se hace bien. Esta primera mitad del Capítulo 8 cubre los criterios para decidir **cuántos agentes necesitas** y los **patrones de coordinación**: **democrático** (peer-to-peer), **manager** (supervisor centralizado), **jerárquico** (multi-tier), y **actor-critic**. Cierra con **Automated Design of Agentic Systems (ADAS)**, donde los agentes se diseñan a sí mismos vía un meta-agente. La Parte B ([[09-de-un-agente-a-muchos-parte-b]]) entra en cómo esos agentes **se comunican y mantienen estado** (A2A protocol, message brokers, actor frameworks, state persistence).

## Cuántos agentes necesitas

> [!rule> Regla de oro
> Empieza con un **single-agent**. Solo divide en multi-agent cuando el single-agent degrada, ya sea por (a) el número de tools se vuelve inmanejable para la selección, (b) la latencia se resiente porque necesitas inter-comunicación, o (c) las tareas tienen **especialización clara** que un solo prompt no captura.

### Single-agent: el punto de partida

```python
# Esquema típico: 1 StateGraph, 1 nodo assistant, N tools
class AgentState(TypedDict):
    operation: Optional[dict]
    messages: Annotated[Sequence[BaseMessage], operator.add]

TOOLS = [manage_inventory, track_shipments, evaluate_suppliers, optimize_warehouse, ...]

llm = ChatOpenAI(model="gpt-5", temperature=0).bind_tools(TOOLS)

def call_model(state: AgentState): ...
def construct_graph(): g = StateGraph(AgentState); g.add_node("assistant", call_model); ... 

# 16 tools arriba → las tool descriptions se solapan
# Selección de tool degrada → empieza el single-agent a fallar
```

**Ventajas del single-agent**:

```text
   - Simplicidad: 1 graph, 1 nodo, fácil de seguir
   - Latencia: no hay comunicación inter-agente
   - Coste: menos llamadas al LLM
   - Debuggeabilidad: trazabilidad lineal
```

**Límite**: cuando el número de tools sube (16, 50, 100+) la selección de tools degrada. Es momento de multiagent — o de optimizaciones single-agent como **hierarchical tool selection** del [[05-orquestacion]].

### Multiagent: cuándo y por qué

```text
   Single-agent
       ↓ síntomas
       ├─ Selección de tool confusa (16+ tools)
       ├─ Prompt demasiado largo (>5 KB)
       ├─ Especialización clara que 1 prompt no captura
       ├─ Necesidad de paralelismo real
       └─ Latencia por inter-agent-comm (la pones tú a cambio de escalabilidad)
       ↓
   Multiagent
```

```python
# Multiagent: supervisor que enruta a especialistas
class AgentState(TypedDict):
    operation: Optional[dict]
    messages: Annotated[Sequence[BaseMessage], operator.add]

INVENTORY_TOOLS    = [manage_inventory, optimize_warehouse, forecast_demand, ...]
TRANSPORTATION_TOOLS = [track_shipments, arrange_shipping, coordinate_operations, ...]
SUPPLIER_TOOLS     = [evaluate_suppliers, handle_compliance, send_logistics_response]

inventory_llm      = llm.bind_tools(INVENTORY_TOOLS)
transportation_llm = llm.bind_tools(TRANSPORTATION_TOOLS)
supplier_llm       = llm.bind_tools(SUPPLIER_TOOLS)

def supervisor_node(state):   # decide qué especialista responde
    ...
    return {"messages": [response]}    # content = "inventory" | "transportation" | "supplier"

def route_to_specialist(state): ...       # conditional edge

graph.add_conditional_edges("supervisor", route_to_specialist, {
    "inventory": "inventory",
    "transportation": "transportation",
    "supplier": "supplier",
})
```

> [!note> Beneficios cuando están bien
> **Specialization**: cada agente con su subset acotado de tools y prompt ajustado. **Parallelism**: varios especialistas pueden correr en paralelo cuando la query lo permite. **Reliability**: menos selección errónea por contexto acotado. **Escalabilidad**: añadir capacidades = añadir agente, no prompt monolítico.

## Principios para añadir agentes

Seis principios guían cuándo y cómo partir un sistema en más agentes:

| Principio | Definición |
|-----------|-----------|
| **Task decomposition** | Romper tareas complejas en subtareas claras, una por agente. Limita overlap y coordinación. |
| **Specialization** | Cada agente hace lo que hace mejor (un agente de inventario, otro de transporte). |
| **Parsimony** | **Minimal agents**: añade solo cuando el valor incremental está claro. Cada agente suma overhead. |
| **Coordination** | Protocolos robustos de comunicación y conflict-resolution entre agentes. |
| **Robustness** | Redundancy: un agente puede tomar el trabajo de otro si cae. Fault tolerance. |
| **Efficiency** | Pesar siempre: ¿vale el coste de comunicación lo que gano en paralelismo y reliability? |

> [!warning> Parsimony es el principio olvidado
> Multi-agent **no es gratis**. Cada agente suma:
> - **Latencia** (más llamadas al LLM entre agentes)
> - **Coste** (más tokens para prompts especiales y mensajes)
> - **Complejidad operacional** (más nodos que monitorizar, debuggear)
> - **Riesgo de coordinación mala** (deadlocks, loops entre agentes)
>
> Si single-agent cubre el caso de uso, quédate ahí.

## Patrones de coordinación

Cuatro patrones canónicos de cómo los agentes **interaccionan** entre sí.

### Democratic coordination

Cada agente tiene **igual poder de decisión**, sin líder. La coordinación emerge del consenso.

```text
   Agent A  ←──→  Agent B  ←──→  Agent C
        ↑               ↑               ↑
        └───────────────┴───────────────┘
                      consensus
```

```text
   Ventajas                           Trade-offs
   ────────                           ──────────
   ✓ Sin single point of failure      ✗ Comunicación intensa
   ✓ Adaptación rápida               ✗ Decisiones lentas
   ✓ Equity entre agentes             ✗ Complejidad de implementación
```

**Caso ideal**: distributed sensor networks, collaborative robotics — entornos distribuidos donde la equidad y la resiliencia importan más que la velocidad de decisión.

### Manager coordination

Un **supervisor** centralizado. El supervisor analiza la query y delega al especialista correcto.

```text
                      Supervisor
                        │ "inventory"
                        ▼
                  ┌─────┴─────┐
                  ▼           ▼
            Inventory   Transportation
            Specialist  Specialist
```

```python
def supervisor_node(state):
    prompt = f'''You are a supervisor coordinating specialists.
    Members: inventory, transportation, supplier.
    Output ONLY the member's name.
    
    Query: {state["messages"]}'''
    response = llm.invoke([SystemMessage(prompt)])
    return {"messages": [response]}     # content: "inventory"

def route_to_specialist(state):
    agent_name = state["messages"][-1].content.strip().lower()
    return agent_name if agent_name in {"inventory", "transportation", "supplier"} else END
```

```text
   Ventajas                           Trade-offs
   ────────                           ──────────
   ✓ Decisiones claras y rápidas      ✗ Single point of failure (supervisor)
   ✓ Sin overhead de consenso        ✗ Bottleneck cuando escala
   ✓ Tareas claras por agente          ✗ Adaptabilidad reducida
```

**Caso ideal**: customer support centers, manufacturing systems — entornos **estructurados y jerárquicos** donde centralizar beneficia control y auditoría.

### Hierarchical coordination

**Multi-tier**. Combina centralizado y descentralizado: managers en cada nivel delegan a subordinados que tienen autonomía.

```text
                    Top Manager (strategic)
                    ┌─────┴─────┐
              Middle Manager A    Middle Manager B (tactical)
              ┌─────┴─────┐
         Specialist A1     Specialist A2 (execution)
```

```text
   Ventajas                           Trade-offs
   ────────                           ──────────
   ✓ Escala a muchos agentes          ✗ Complejidad de diseño
   ✓ Redundancy: tareas se mueven     ✗ Latencia a través de niveles
     entre niveles                      ✗ Posible staleness en límites
```

**Caso ideal**: supply chain management militar, operaciones globales — donde se necesita **planificación estratégica** y **ejecución táctica** por separado.

### Actor-critic

Dos roles diferenciados: el **actor** ejecuta, el **critic** evalúa la salida y propone mejoras. Bucle iterativo.

```text
   Plan → execute via Actor → output
                                  ↓
                              Critic evalúa
                                  ↓
                            ¿cumple objetivo?
                                  ├─ Sí → done
                                  └─ No → feedback → new plan → new actor
```

> [!success> Conexión con Reflexion
> Actor-Critic es el patrón de [[07-aprendizaje-en-sistemas-agenticos#Reflexion|Reflexion]] aplicado a multi-agent. El critic genera una crítica textual que el actor usa como guía para el siguiente intento, mientras el memory buffer acumula las críticas pasadas.

> [!note> Cuándo elegir cada patrón
> | Patrón | Cuándo |
> |--------|--------|
> | **Democratic** | Resiliencia crítica, equidad entre agentes, complejidad de consensus tolerable |
> | **Manager** | Single-supervisor overhead; muchos especialistas bien diferenciados |
> | **Hierarchical** | Organizaciones a gran escala con capas naturales de autoridad |
> | **Actor-Critic** | Necesidad de iteración, validación repetida antes de commit, planes revisables |

## Automated design of agentic systems (ADAS)

ADAS parte de un giro copernicano: en lugar de diseñar los agentes **a mano**, **un meta-agente** los diseña, evalúa e itera automáticamente.

```text
   Search space: todas las arquitecturas agenticas representables
                     ↓
   Search algorithm: Meta Agent Search (MAS)
                     ↓
   Evaluation: cada candidato se ejecuta contra objectives
                     ↓
   Iterate: mejores designs reemplazan a los peores
                     ↓
   Output: arquitectura de agente más alta-performing
```

ADAS define agentes en **código** (Turing-complete), lo que permite al meta-agente inventar estructuras y comportamientos **no anticipados por humanos**:

```text
   Foundation models  ── block genérico sobre el que se construyen módulos
   Code-as-agent      ── agentes son funciones o clases
   Automated search    ── propone mutaciones, recombinaciones
   Evaluation metric   ── performance, robustness, efficiency
```

> [!quote> Idea central
> "Históricamente, las soluciones hand-designed en ML son reemplazadas por alternativas aprendidas o automatizadas (CNN sobre特征SIFT, transformers sobre RNN). ADAS aplica esa transición a los agentes: foundation models son un buen punto de partida, pero el meta-agente puede construir **mejor que los humanos** dados suficiente search time."

> [!warning> R&D, no listo para producción
> ADAS es investigación cutting-edge. Aplicable a prototipos y benchmarks, pero **no** a producción crítica en 2025-2026. La idea es importante porque cambia cómo pensarás sobre el **futuro del diseño de agentes**.

## Resumen de la primera mitad

- Empieza **single-agent**. Solo divide cuando los tools desbordan la selección o la especialización es clara.
- Aplica **Parsimony primero, parallelism después**: cada agente añade overhead.
- Cuatro patrones de coordinación: **Democratic** (peer), **Manager** (supervisor), **Hierarchical** (multi-tier), **Actor-Critic** (iterativo).
- ADAS imagina un futuro donde los agentes **se diseñan a sí mismos** vía meta-agente. Hoy no production-ready pero define la dirección.

## Próximos pasos

Decidir cuántos agentes y cómo coordinarlos es la mitad del problema. La otra mitad es **cómo se comunican** entre sí y **cómo mantienen estado distribuido**: eso en [[09-de-un-agente-a-muchos-parte-b]] (la Parte B de este capítulo).
