---
title: "Diseño de sistemas de agentes : componentes, trade-offs y patrones arquitectónicos"
description: "Cómo se compone un agente AI (modelo, herramientas, memoria, orquestación), trade-offs de diseño (performance, escalabilidad, fiabilidad, costes), selección de modelo con tablas de MMLU/precio, patrones single-agent vs multiagent, buenas prácticas (iteración, evaluación, real-world testing)"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, design, arquitectura, gpu, langgraph]
---

# Diseño de sistemas de agentes

> [!abstract] Resumen
> Capítulo de diseño práctico: parte de un ejemplo concreto (agente de soporte ecommerce que cancela pedidos sobre email) que cabe en pocas líneas con LangGraph, y desde ahí levanta los **cuatro componentes núcleo** de cualquier sistema agentico — modelo, herramientas, memoria, orquestación — más los **trade-offs** que toda decisión arrastra (performance, escalabilidad, fiabilidad, costes) y los **patrones arquitectónicos** single-agent vs multi-agent. Cierra con buenas prácticas de proceso — diseño iterativo, estrategia de evaluación, real-world testing — que el libro defiende como no negociables.

## Empezar con un caso de uso estrecho

La mayoría de practitioners no empiezan con un *grand design document*. Empiezan con **un problema desordenado, una API key y una idea aproximada**. El capítulo construye un ejemplo: un agente de soporte ecommerce que, ante un email de cliente, decide qué herramienta invocar (`issue_refund`, `cancel_order` o `update_address_for_order`) y envía una confirmación breve.

```text
   Cliente dice:           "Please cancel my order #B73973."
                           ↓
   Agente decide:          llamar cancel_order(order_id="B73973")
                           ↓
   Tool ejecuta:           cancelación en el backend
                           ↓
   Agente redacta:         "Tu pedido B73973 ha sido cancelado."
```

La versión con LangGraph son ~30 líneas: un `@tool` con `cancel_order`, un `call_model` que hace dos pasadas al LLM (decide tool call → ejecuta tool → genera confirmación), y un `StateGraph` con un único nodo `assistant`. Lo importante es **la disciplina de scope**: si el primer caso es solo "cancelar pedidos" (no "toda la atención al cliente"), las entradas son concretas, las salidas estructuradas y el feedback loop es rápido.

> [!warning] Regla de oro al acotar
> Demasiado estrecho → impacto limitado. Demasiado amplio → ahogado en edge cases. Demasiado vago → nunca sabes cuándo terminaste. El libro apuesta por **un workflow acotado y claro** como mejor punto de partida.

```python title="Evaluación mínima (transcripción del libro)"
example_order = {"order_id": "B73973"}
convo = [HumanMessage(content="Please cancel order #B73973. I found a cheaper option elsewhere.")]

result = graph.invoke({"order": example_order, "messages": convo})

assert any("cancel_order" in str(m.content) for m in result["messages"]), \
    "Cancel order tool not called"
assert any("cancelled" in m.content.lower() for m in result["messages"]), \
    "Confirmation message missing"

print("✅ Agent passed minimal evaluation.")
```

> [!danger] Sin test, sin confianza
> Un agente sin evaluación es un agente no confiable. Mide **tool precision**, **parameter accuracy**, **task success rate** sobre cientos de ejemplos antes de promoverlo a producción.

## Componentes núcleo de un sistema agentico

Cuatro bloques componen cualquier sistema agentico. Cada uno tiene su propio capítulo en el libro (memory → cap. 6, orquestación → cap. 5, multi-agente → cap. 8).

```text
   ┌────────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐
   │   Modelo   │    │ Herramientas│    │   Memoria    │    │Orquestación│
   └────────────┘    └────────────┘    └──────────────┘    └────────────┘
        ↑                   ↑                ↑                  ↑
        └────── todas se coordinan vía el componente de orquestación ──┘
```

### Selección de modelo (extendido)

Además del criterio "qué modelo usar" del capítulo 1, aquí entran las **decisiones de modalidad, openness, custom training y tamaño**:

| Criterio | Decisión |
|----------|----------|
| **Complejidad de tarea** | Tareas abiertas → LLM grande (GPT-5, Claude Opus). Tareas bien definidas → modelo pequeño (distillados, Phi-4) corre local. |
| **Modalidad** | Texto solo → modelo de texto. Texto + imagen/audio → multimodal (GPT-5, Claude). |
| **Openness** | Privacidad / regulación → open source (Llama, DeepSeek) hosteable on-prem. Velocidad de desarrollo → API gestionada. |
| **Custom training** | Dominio (medicina, legal) → fine-tuning o modelo custom. General → pretraining basta. |
| **Latencia / coste** | Tarjeta del HELM Core Scenario permite comparar: GPT-5 mini (0.819), o4-mini (0.812), o3 (0.811), GPT-5 (0.807), Qwen3-235B-A22B (0.798), Grok 4 (0.785), Claude 4 Opus (0.780). |

> [!success] Tres preguntas para decidir
> - ¿La tarea es abierta o estructurada?
> - ¿El input es solo texto o multimodal?
> - ¿Necesito control sobre el modelo o acepto el API gestionado?

### Herramientas: tres categorías

| Tipo | Qué hace | Ejemplo |
|------|----------|---------|
| **Local tools** | Lógica interna sin dependencias externas: cálculos, reglas, decision making | "decide si la solicitud cumple el criterio X" |
| **API-based tools** | Invocan servicios externos vía API REST, GraphQL, etc. | "consultar precio actual", "crear ticket" |
| **MCP-based tools** | Inyectan contexto estructurado al LLM en tiempo real (no requieren round-trip) | "perfil de usuario + historial de conversación" |

> [!tip] Diseño modular
> Cada herramienta debe ser un **módulo autocontenido e intercambiable**. La razón: añadir una nueva herramienta o cambiar una existente no debería requerir redesplegar el servicio de agente entero.

### Memoria: corto plazo y largo plazo

- **Short-term**: ventana deslizante durante la tarea actual. Útil para mantener coherencia en una conversación o workflow. Implementación típica: rolling context window.
- **Long-term**: conocimiento persistente (preferencias del usuario, métricas históricas, fallos recurrentes). Implementación típica: bases de datos, knowledge graphs, modelos fine-tuned.

Memoria efectiva = organizar datos indexados + recuperar rápido + descartar outdated. Profundizado en [[06-conocimiento-y-memoria]].

### Orquestación

La orquestación convierte capacidades aisladas en soluciones de extremo a extremo:

- **Componer, schedule, supervisar** una secuencia de skills hacia un objetivo.
- **Evaluar secuencias posibles**, predecir outcomes, elegir el path más probable.
- **Monitorizar** progreso y entorno, reroute cuando algo cambia.
- **Construir el plan incrementalmente**: ejecutar N pasos, reevaluar, continuar.

```text
   Orquestador
       │
       ├─ ¿plan?            ───── build_plan() con LLM o rules
       │
       ├─ ¿tool a usar?     ───── select_tool()    ─┐
       │                                              │
       ├─ ejecutarla             run_tool()     ─┐   │
       │                                          │   │
       └─ ¿sigue el plan?        re_eval()    ───┘   │
                                                    │
                          feedback loop ─────────────┘
```

Profundizado en [[05-orquestacion]].

## Trade-offs de diseño

Cuatro familias de trade-offs que toda decisión en un sistema agentico arrastra:

### Performance: velocidad vs precisión

| Contexto | Prioriza |
|----------|----------|
| Vehículos autónomos, trading | Velocidad (ms importan) |
| Análisis legal, diagnóstico médico | Precisión (latencia tolerable) |
| Sistemas híbridos | Aproximar rápido, refinar despacio |

```text
   Aproximación rápida          Refinamiento iterativo
   ────────────────          ──────────────────────
   "taxi más cercano"  →  "llegada + tráfico + precio"
   "responder en 200ms" → "pulir tono en segundo pase"
```

### Escalabilidad: GPUs, allocation y elasticidad

Los GPUs son el cuello de botella y el coste principal. Estrategias clave:

| Estrategia | Lo que hace |
|------------|-------------|
| **Dynamic GPU allocation** | Asigna GPUs según demanda real, no estática |
| **Elastic GPU provisioning** | Auto-scaling con cloud (burst to GPU spot) |
| **Priority queuing** | Alta prioridad va primero; resto en cola en picos |
| **Multi-GPU parallelism** | Pipeline/tensor parallelism para inferencia distribuida |
| **Asynchronous task execution** | Tareas cortas en paralelo (overlap) |
| **Hybrid cloud** | On-prem + cloud para picos |

> [!tip] Lei del libro
> No basta con **añadir GPUs** — hay que **utilizarlas**. La mayoría de deployments infrautilizan hardware por mal scheduler o por dependencias secuenciales innecesarias.

### Fiabilidad: tolerancia a fallos + consistencia

- **Fault tolerance**: detectar fallos (red, hardware) y recuperar con gracia. Redundancy en componentes críticos.
- **Consistencia**: el mismo input → el mismo output, en el rango de variabilidad permitido por el modelo.
- **Robustez**: no solo ideal, también edge cases, inputs adversarios, stress tests.

Alcanzar fiabilidad exige:

```text
   - Testing exhaustivo  ── unit + integration + adversarial
   - Monitoring en producción
   - Feedback loops   ── el agente aprende y se corrige
```

### Costes: desarrollo + operación + valor

| Tipo | Drivers |
|------|---------|
| **Desarrollo** | Datos curados, talento especializado (ML engineers + dominio), infraestructura de test |
| **Operación** | GPUs/Cloud, almacenamiento de memoria, bandwidth, mantenimiento |
| **Valor** | ¿Justifica el coste vs alternativas? |

> [!note] Reglas de optimización
> - **Lean models**: usar modelos simples cuando el rendimiento es suficiente.
> - **Cloud-based**: pay-as-you-go evita CapEx.
> - **Open source**: minimiza costes de licencia si tienes talento.
> - **Multimodelo**: enrutar a modelos baratos para tareas sencillas.

## Patrones arquitectónicos

Dos patrones principales. El libro los expande en [[08-de-un-agente-a-muchos-parte-a]].

### Single-agent

```text
   User ───→ [ Agent ] ───→ Tools / Memory / Models
                 │
              Output
```

- **Ideal para**: tareas bien definidas y narrow (FAQs, tracking de pedidos, entry de datos).
- **Pros**: simple, fácil de diseñar/desplegar/diagnosticar.
- **Contras**: no escala a problemas multi-dominio.

### Multi-agent

```text
   Coordinator
      ├── Agent A (data collection)
      ├── Agent B (data processing)
      └── Agent C (user interaction)
```

| Ventaja | Detalle |
|---------|--------|
| **Colaboración / especialización** | Cada agente se enfoca en un área |
| **Paralelismo** | Múltiples rutas ejecutan en simultáneo |
| **Escalabilidad** | Añadir agentes para distribuir carga |
| **Resiliencia** | Fallo de uno no compromete el sistema |

| Trade-off | Detalle |
|-----------|--------|
| **Coordinación** | Comunicación entre agentes es compleja |
| **Complejidad operativa** | Protocolos, sincronización, orquestación de protocolos |
| **Eficiencia** | Multi-agent consume más tokens (comunicación + contexto compartido) |

> [!tip] Regla de dedo
> Single-agent siempre que puedas. Multi-agent cuando la tarea es **claramente descomponible** en subtareas independientes o cuando **necesitas paralelismo real** (tiempo, throughput).

## Buenas prácticas

### Diseño iterativo

```text
   MVP
     ↓ feedback
   Iteración 1
     ↓ feedback
   Iteración 2
     ↓ feedback
   ...
```

Beneficios:
- **Detección temprana** de issues antes de que sean arquitectónicos.
- **Diseño user-centric**: feedback continuo de stakeholders.
- **Escalabilidad por capas**: añadir features en cada vuelta, tested incrementalmente.

Tres reglas operativas:
1. **Prototipos rápidos** — feature mínimo que entrega valor.
2. **Testear + recoger feedback** después de cada iteración.
3. **Refinar + repetir**.

### Estrategia de evaluación

Cobertura mínima:

```text
   Funcionalidad     ── correctness, edge cases, métricas de dominio
   Generalización     ── comportamiento en tareas fuera de training
   User experience    ── NPS, CSAT, completion rates, feedback explícito
   Operacional        ── latencia, throughput, tasa de error
   HITL               ── human-in-the-loop para validación de alta-precisión
   E2E environment    ── simulaciones de producción reales
```

Tres señales que importa recoger:
- **Explícitas**: thumbs up/down, ratings.
- **Implícitas**: patrones de fallo (delays, sentiment, misinterpretations).
- **Human-in-the-loop**: expertos revisan muestras para calibrar métricas auto.

### Real-world testing

Más allá del laboratorio: deploy en condiciones reales con phased rollout.

```text
   Fases de rollout
   ────────────────
   Canary (5% tráfico)    ─→ 15% → 50% → 100%
       ↓
   Monitor (KPIs en vivo)
       ↓
   Recoger feedback de usuarios
       ↓
   Iterar
```

KPIs típicos: response time, accuracy, user satisfaction, system stability.

> [!quote> Toma de cierre del capítulo
> "No necesitas 30 páginas de plan para empezar a construir un buen sistema agentico — pero algo de foresight ayuda."

## Resumen del capítulo

- Empieza por un caso de uso **estrecho y concreto** (como "cancelar pedidos") — no por el "agente completo de soporte".
- Los cuatro componentes núcleo son **modelo, herramientas, memoria, orquestación** — todos se coordinan vía el orquestador.
- Los trade-offs de diseño se agrupan en cuatro ejes: **performance (velocidad↔precisión), escalabilidad (GPU allocation), fiabilidad (tolerancia a fallos, consistencia), coste (desarrollo + operación)**.
- Elige **single-agent hasta que tengas razón para multi-agent**. La regla no es "qué tan cool", es "qué tan claro el paralelismo".
- **Diseño iterativo + evaluación robusta + real-world testing** son el proceso que convierte prototipo en sistema en producción.

## Próximos pasos

Con agentes y orquestación en mente, el siguiente paso natural es **cómo el usuario interactúa con el sistema agentico**: la UX de agentes se trata en [[03-diseno-de-experiencia-de-usuario-para-sistemas-agenticos]].
