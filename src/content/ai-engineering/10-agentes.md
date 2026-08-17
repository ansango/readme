---
title: Agentes
description: "Más allá de RAG: cuando el modelo toma acciones. Visión general de agentes, herramientas, planning, modos de fallo y memoria"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, llm, agents, function-calling, memory]
---

# Agentes

> [!abstract] Resumen
> Esta nota cubre la segunda mitad del capítulo 6: los agentes, la forma más ambiciosa y compleja de aplicación sobre foundation models. Un agente no se limita a responder textos: **toma decisiones, ejecuta acciones, observa resultados e itera**. Veremos qué define a un agente, qué herramientas usa, cómo planifica, qué memory tiene, los **modos de fallo** más comunes y cómo evaluarlos. La nota anterior ([[09-rag-arquitectura-y-optimizacion|RAG]]) cubre la parte de retrieval de contexto.

## De RAG a agentes

El libro traza una evolución natural:

1. **Prompt engineering**: el modelo responde con su conocimiento.
2. **RAG**: el modelo responde con conocimiento externo.
3. **Agentes**: el modelo **actúa** en el mundo real.

Un agente es un sistema donde el modelo controla un **loop de acciones**: decide qué hacer, lo hace, observa el resultado, y decide qué hacer a continuación. Esto abre posibilidades enormes pero también riesgos nuevos.

> [!quote] "Un chatbot responde. Un agente hace."
> El libro usa esa frase para recordar que la diferencia clave es la capacidad de actuar sobre sistemas externos (mandar emails, mover dinero, ejecutar código).

## Qué es un agente

El libro define un agente como un sistema que tiene:

- **Un modelo** (el "cerebro") que decide.
- **Un conjunto de herramientas** que el modelo puede invocar.
- **Un loop** que ejecuta la decisión y alimenta el resultado de vuelta al modelo.
- **Un objetivo** que el modelo intenta alcanzar.

```text
┌────────────────────────────────────────┐
│           Loop del agente              │
│                                        │
│   ┌──────────┐    ┌─────────────┐      │
│   │   LLM    │ -> │  Tool call  │      │
│   │ piensa   │    │  ejecuta    │      │
│   └──────────┘    └─────────────┘      │
│        ▲                  │            │
│        │                  ▼            │
│        │           ┌─────────────┐     │
│        └───────────│  Resultado  │     │
│       observa      │  observable │     │
│                    └─────────────┘     │
│                                        │
│   Repite hasta cumplir el objetivo     │
└────────────────────────────────────────┘
```

### Ejemplo: agente de planificación de viajes

```text
Objetivo: "Planifica un viaje a Tokio de 5 días en noviembre, presupuesto 3000€."

Pensamiento 1: "Necesito buscar vuelos desde España a Tokio en noviembre."
Acción 1: search_flights(origen="MAD", destino="NRT", mes="noviembre")
Observación 1: [3 vuelos, mejor opción 850€]

Pensamiento 2: "Ahora necesito hoteles para 5 noches."
Acción 2: search_hotels(ciudad="Tokio", noches=5, presupuesto=1000)
Observación 2: [5 opciones, mejor 80€/noche]

Pensamiento 3: "Calculo el total: 850€ vuelos + 400€ hotel = 1250€. Sobran 1750€ para actividades."
Acción 3: search_activities(ciudad="Tokio", presupuesto=1750)
...

Final: "Plan completo por 3050€. ¿Lo confirmo?"
```

## Function calling / tool use

Casi todos los frameworks de agentes actuales se construyen sobre **function calling** (también llamado **tool use**).

### Concepto

1. Tú defines **qué herramientas** existen (nombre, descripción, parámetros).
2. El modelo, en lugar de generar texto, puede **pedir llamar a una herramienta** con argumentos concretos.
3. Tu sistema **ejecuta** la herramienta y devuelve el resultado al modelo.
4. El modelo **continúa** con el resultado en su contexto.

```python
# Ejemplo conceptual de tool definition
tools = [
    {
        "name": "search_flights",
        "description": "Busca vuelos entre dos ciudades en una fecha.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {"type": "string"},
                "destination": {"type": "string"},
                "date": {"type": "string", "format": "date"},
            },
            "required": ["origin", "destination", "date"]
        }
    }
]

response = client.messages.create(
    model="claude-3-5-sonnet",
    tools=tools,
    messages=[{"role": "user", "content": "Busca vuelos MAD-NRT en noviembre"}]
)
```

### Buenas prácticas en la definición de tools

- **Descripción precisa**: si la descripción de la herramienta es ambigua, el modelo no la usará bien.
- **Parámetros bien tipados**: usa JSON Schema estricto.
- **Ejemplos de uso**: incluir 1-2 ejemplos en la descripción mejora la calidad.
- **Naming consistente**: verbos en infinitivo, nombres claros.

> [!warning] Demasiadas tools confunden al modelo
> Más de 15-20 herramientas empieza a degradar la elección del modelo. Si necesitas muchas, considera grouping o "router" tools.

## Estrategias de planning

El libro distingue dos enfoques principales para que el agente razone sobre qué hacer.

### ReAct (Reasoning + Acting)

Intercalar textualmente razonamiento y acciones:

```text
Thought: Necesito saber la temperatura actual en Madrid.
Action: get_weather(city="Madrid")
Observation: 23°C, soleado.
Thought: Ahora puedo recomendar ropa.
Action: recommend_clothing(weather="soleado", temp=23)
```

### Plan-and-execute

Primero crear un plan completo, luego ejecutar paso a paso:

```text
Plan:
1. Buscar vuelos.
2. Buscar hoteles.
3. Buscar actividades.
4. Calcular presupuesto total.
5. Presentar resumen.

Step 1: search_flights(...)
Step 2: search_hotels(...)
...
```

### Reflexion

Después de ejecutar, el modelo revisa su trabajo y detecta problemas.

```text
"He ejecutado la búsqueda. Pero el hoteles está en una zona cara. 
Voy a buscar alternativas más céntricas."
```

### Tree of Thoughts

Explorar múltiples planes en paralelo, elegir el mejor.

### Cual elegir

- **ReAct**: tareas cortas, debugging fácil.
- **Plan-and-execute**: tareas largas, traza clara.
- **Reflexión**: cuando los errores son recuperables.
- **Tree of Thoughts**: cuando hay varios caminos válidos y necesitas explorar.

> [!tip] Empieza con ReAct
> El libro recomienda empezar con ReAct (o incluso prompts estructurados sin tools reales) y solo subir de complejidad cuando la tarea lo requiera.

## Tool design

El libro dedica una sección entera al diseño de herramientas porque **la calidad de las tools es más importante que la del modelo**.

### Características de buenas tools

- **Atomic**: cada tool hace una cosa bien.
- **Composable**: combinables entre sí.
- **Observable**: devuelven resultados estructurados y claros.
- **Idempotent cuando posible**: ejecutarla dos veces no rompe nada.
- **Con poco acoplamiento**: no asumir un estado concreto.

### Anti-patrones

- ❌ Tools que hacen demasiado ("do_everything").
- ❌ Tools que devuelven texto no estructurado.
- ❌ Tools que modifican estado sin confirmación.
- ❌ Tools con parámetros ambiguos.

> [!example] Diseña tool pensando en cómo la usará el LLM
> La tool `book_flight(origen, destino, fecha, pasajeros, clase)` parece bien. Pero para el modelo, `class` puede significar "turista", "business", "económica" o "premium". Mejor: `cabin_class` con valores enumerados.

## Memory

Los agentes necesitan **memoria** para funcionar en tareas que se extienden en el tiempo.

### Tipos de memoria

#### Short-term memory (contexto)

La información en el contexto actual de la conversación. Limitada por la ventana del modelo.

#### Long-term memory

Información que persiste entre conversaciones:

- **Perfil del usuario**: preferencias, datos básicos.
- **Historial de interacciones**: qué pidió antes, qué funcionó.
- **Conocimiento del mundo**: datos que el sistema aprende con el tiempo.

### Implementación

- **Vector DB**: para memoria semántica (lo que dijiste antes con palabras distintas).
- **Structured DB**: para hechos concretos (SQL, KV store).
- **Resumen**: comprimir memorias antiguas en resúmenes.

> [!danger] Memory errors son caros
> El libro advierte: las memorias persisten y se multiplican. Un error en una memoria contaminará futuras conversaciones. Es importante tener:
> - **Validación** de lo que entra en memoria.
> - **Expiración**: memorias antiguas caducan.
> - **Inspección**: poder ver qué recuerda el sistema del usuario.

## Failure modes

El libro identifica los **modos de fallo** más comunes en agentes. Conocerlos es la mitad de la defensa.

### 1. Hallucination of tools

El modelo invoca tools que **no existen** o con argumentos incorrectos.

```text
Action: search_database_for_customer(...)
# Pero esa tool no está definida
```

### 2. Hallucination of results

El modelo invoca la tool, pero en lugar de leer la observación, **se inventa el resultado**.

```text
Action: get_weather("Madrid")
# El modelo ignora lo que devolvió y dice "Hace 25°C en Madrid"
```

### 3. Goal drift

El modelo pierde de vista el objetivo y empieza a hacer cosas no relacionadas.

```text
Objetivo: "Encuentra vuelos a Tokio."
Cinco pasos después: "Te recomiendo documentales sobre Japón."
```

### 4. Infinite loops

El modelo entra en un ciclo donde las mismas acciones se repiten sin avanzar.

### 5. Premature termination

El modelo declara éxito antes de que el objetivo esté cumplido.

### 6. Unsafe actions

El modelo invoca tools que ejecutan acciones destructivas sin confirmación.

### 7. Context overflow

El loop se extiende tanto que el contexto se desborda y el modelo pierde coherencia.

### 8. Cost explosion

Un agente que entra en loops puede gastar cientos de dólares en una sola tarea.

> [!warning] Los failure modes son sistémicos
> El libro es claro: **casi todos los fallos de agentes son sistémicos, no del modelo**. Soluciones: validación de tools, guard rails, presupuestos de steps, humanos en el loop para acciones críticas.

## Evaluación de agentes

Evaluar agentes es más difícil que evaluar chatbots: hay muchos caminos, muchos resultados posibles.

### Métricas de proceso

- **Steps por tarea**: ¿cuántas acciones se necesitan?
- **Tasa de éxito**: ¿el agente cumple el objetivo?
- **Tasa de error**: ¿cuántas acciones fallan?
- **Tasa de loops**: ¿cuántas veces entra en bucle?

### Métricas de resultado

- **Final-state accuracy**: ¿el estado final del mundo es el deseado?
- **User satisfaction**: ¿el usuario quedó contento?
- **Task completion**: ¿el objetivo se cumplió?

### Evaluación human-in-the-loop

Para acciones críticas, **un humano debe aprobar** antes de que el agente ejecute. La evaluación se hace con muestras de las aprobaciones.

### Frameworks de evaluación

- **LangSmith**: tracing y evaluación de agentes LangChain.
- **Langfuse**: open-source, compatible con múltiples frameworks.
- **Helicone**: observabilidad + evaluación.
- **Patrón propio**: usar el sistema de logs y AI as judge sobre los resultados.

> [!tip] Evalúa el camino, no solo el resultado
> Un agente que cumple el objetivo por mal camino (ejecuta acciones innecesarias, gasta 10x más de lo debido) es un agente con problemas. Mide el camino.

## Frameworks de agentes

El libro repasa las opciones más usadas:

- **LangChain / LangGraph**: el más popular, opinionado, ecosistema enorme.
- **LlamaIndex**: foco en RAG, también soporta agentes.
- **Autogen** (Microsoft): multi-agente.
- **CrewAI**: multi-agente con roles.
- **DSPy**: prompts como código, optimización automática.
- **Letta**: foco en memoria persistente.
- **DIY**: código propio, sin framework.

> [!danger] Empieza sin framework
> El libro insiste: **los frameworks de agentes cambian muy rápido, tienen muchos quirks y abstraen problemas que necesitas entender**. Empieza con código propio y añade framework solo cuando duela de verdad.

## Patrones de diseño de agentes

### Single agent

Un solo LLM con un conjunto de tools. Funciona para la mayoría de tareas.

### Multi-agent

Varios agentes especializados colaboran:

- **Manager-worker**: un agente coordina, otros ejecutan.
- **Peer-to-peer**: agentes iguales que se comunican.
- **Hierarchical**: cadena de agentes especializados.

### Human-in-the-loop

En puntos clave, **un humano aprueba** antes de continuar.

### Background agents

Agentes que corren sin intervención del usuario (ej: monitorización, tareas programadas).

## Resumen en tres frases

- Un agente añade un loop de acciones a un LLM: piensa, decide, ejecuta, observa, repite.
- El éxito depende menos del modelo y más del diseño de tools, la estrategia de planning y la gestión de memoria.
- Los failure modes son sistémicos y costosos: validación, guard rails, presupuestos de steps y humanos en el loop son obligatorios, no opcionales.

## Próximos pasos

- [[11-finetuning-decisiones-y-memoria|Finetuning: decisiones y memoria]]: cuando prompt engineering y RAG no bastan, llega el momento de ajustar el modelo. Cuándo fine-tunear, cuándo no, y la matemática de memoria que necesitas entender.
