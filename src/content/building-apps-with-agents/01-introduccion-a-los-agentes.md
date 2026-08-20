---
title: "Introducción a los agentes : qué es un agente AI y por qué ahora"
description: "Definición de agentes AI, la revolución del pre-training, los siete tipos de agentes, selección de modelo, sync vs async, elecciones entre código/workflow/RAG/agente, principios de sistemas agenticos, organización organizativa y panorama de frameworks (LangGraph, AutoGen, CrewAI, OpenAI Agents SDK)"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, fluent-react, building-ai-agents, intro, langgraph, autogen, crewai]
---

# Introducción a los agentes

> [!abstract] Resumen
> Capítulo inaugural del libro. Define qué es un agente AI (un sistema que razona y actúa en bucle con un modelo y herramientas, no un script determinista) y por qué ahora: la revolución del pre-training produjo foundation models capaces de generar firmas de función estructuradas y alimentar orquestaciones. Recorre los **siete tipos de agentes** (negocio, conversacional, investigación, analytics, dev, dominio específico, browser-using) y los emergentes de voz/vídeo, los criterios de selección de modelo en un mercado multimodelo, la transición de operaciones síncronas a asíncronas, la decisión entre código/workflow/RAG/agente según la variabilidad y el coste, los **principios de sistemas agenticos** (escalabilidad, modularidad, aprendizaje continuo, resiliencia, futuro-proofing), la organización humana necesaria para escalar, y el panorama de frameworks.

## Definiendo un agente AI

Un **agente AI** es un sistema inteligente capaz de analizar datos, interpretar su entorno y tomar decisiones contextuales de forma autónoma. La definición importa porque el término "agente" se ha diluido: hoy se aplica a casi cualquier cosa que use un LLM, incluyendo scripts deterministas envueltos en un wrapper de "agente".

> [!note] El test definitivo
> La verdadera agencia existe en un espectro. La pregunta que separa un agente de un script disfrazado es: **¿toma decisiones reales, razonamiento dependiente del contexto, comportamientos adaptativos?** Si la respuesta es no, es un workflow con buzzwords.

```text
   Agente verdadero                     Script con buzzwords
   ───────────────                     ─────────────────────
   Decide qué herramienta usar        Llama siempre la misma API
   Adapta plan a resultados parciales  Tiene un árbol fijo de if/else
   Aprende de feedback de usuario     No mejora con uso
   Razona sobre incertidumbre          Falla silenciosamente
```

El libro reserva el término **sistema agentico** (`agentic system`) para el conjunto completo de funcionalidad que permite al agente operar: modelo, herramientas, memoria, orquestación e infraestructura de soporte. Con protocolos como **Model Context Protocol (MCP)** y **Agent-to-Agent Protocol**, los agentes serán capaces de consumir herramientas remotas y colaborar con otros agentes — el doble de oportunidad y responsabilidad.

## La revolución del pre-training

> [!quote] Antes
> Construir una aplicación con ML requería contratar ML engineers, recolectar datos y entrenar modelos. El cuello de botella era el dataset.

> [!quote] Ahora
> Foundation models pre-entrenados ofrecen capacidades generales con una llamada a una API — sin entrenar, sin hospedar, sin dataset propio. Esto reduce drásticamente el coste y la complejidad de construir productos con ML.

Modelos como GPT-5, Claude, Llama, Gemini Ultra y DeepSeek V3 extienden la capacidad sobre tareas difíciles, ensanchando el rango de problemas abordables. Las capacidades que desbloquean para un agente:

| Capacidad | Lo que habilita en un agente |
|-----------|----------------------------|
| NL understanding | Interpretar input libre del usuario |
| Context-aware interaction | Mantener contexto en interacciones largas |
| Structured content generation | Producir JSON, código y firmas de función |
| Contextual interpretation | Decidir qué hacer en ambigüedad |
| Tool use | Invocar APIs y operar sistemas externos |
| Adaptive planning | Planificar y ejecutar acciones multi-paso |
| Code generation | Escribir y ejecutar código + tests |
| Multimodal synthesis | Trabajar con imagen/audio/vídeo a escala |

El resultado: los agentes AI pueden abordar escenarios complejos y dinámicos que **los modelos ML estáticos no pueden**.

## Tipos de agentes

El libro adopta una taxonomía de siete tipos prácticos (de *The Information*), a los que añade voz y vídeo como categorías emergentes:

| Tipo | Qué hace | Ejemplos |
|------|----------|----------|
| **Business-task agents** | Automatización de workflows predefinidos | UiPath, Microsoft Power Automate, Zapier |
| **Conversational agents** | Chatbots de atención al cliente | Asistentes virtuales en customer support |
| **Research agents** | Recolección y síntesis de información | Perplexity AI, Elicit |
| **Analytics agents** | Análisis de datos estructurados | Power BI Copilot, Glean |
| **Developer agents** | Generación y refactor de código | Cursor, Windsurf, GitHub Copilot |
| **Domain-specific agents** | Vertical especializado | Harvey (legal), Hippocratic AI (salud) |
| **Browser-using agents** | Navegación web interactiva | Computer-use agents (browser automation) |

```text
   Emergentes (en crecimiento):
   ──────────────────────────────
   Voice agents   →  speech-to-speech completo, atención al cliente en tiempo real
   Video agents   →  avatares con lip-sync, sales/onboarding sin producción manual
```

> [!note] Foco del libro
> El énfasis está en **agentes basados en language models**, principalmente texto y código — la columna más asentada del ecosistema. Voz, vídeo y RPA se mencionan tangencialmente.

## Selección de modelo

El mercado es **multimodelo** y cambiante. La regla inicial razonable es **arrancar con el último modelo generalista** de un proveedor líder (OpenAI, Anthropic, Google, Meta, DeepSeek). Ejemplos del HELM Core Scenario leaderboard (agosto 2025):

```text
   Modelo                      Mean   MMLU-Pro   GPQA   IFEval   WildBench   Omni-MATH
   ──────                      ─────  ─────────  ─────  ───────  ──────────  ──────────
   GPT-5 mini                  0.819  0.835      0.756  0.927    0.855       0.722
   o4-mini                     0.812  0.820      0.735  0.929    0.854       0.720
   o3                          0.811  0.859      0.753  0.869    0.861       0.714
   GPT-5                       0.807  0.863      0.791  0.875    0.857       0.647
   Qwen3 235B A22B             0.798  0.844      0.726  0.835    0.866       0.718
   Grok 4                      0.785  0.851      0.726  0.949    0.797       0.603
   Claude 4 Opus               0.780  0.875      0.709  0.849    0.852       0.616
   Claude 4 Sonnet             0.766  0.843      0.706  0.840    0.838       0.602
```

Para tareas bien definidas o sensibles a latencia/coste, **modelos pequeños pueden dar casi el mismo rendimiento a una fracción del precio**. La tendencia actual: **selección automática de modelo por query**, enrutando las fáciles a modelos pequeños y reservando el modelo grande para razonamiento complejo. Esto es **test-time optimization dinámico**.

> [!tip] Cuando invertir en selección de modelo
> Solo cuando tu escala o constraints lo demandan. Para empezar: modelo generalista. Optimizar viene después. Diseña hoy para multimodelo aunque uses uno solo.

## De síncrono a asíncrono

El software tradicional ejecuta tareas **síncronamente**: paso a paso, esperando a que cada uno termine. Los agentes AI están diseñados para **operación asíncrona**: múltiples tareas en paralelo, repriorización dinámica, adaptación a nueva información.

```text
   Software tradicional          Agente AI
   ──────────────────          ─────────
   Esperar input                Procesar input en background
   Esperar respuesta            Sugerir respuesta mientras llega
   Siguiente acción             Múltiples acciones en paralelo
   Bloqueo                     Re-priorización dinámica
```

Casos de uso reales que el libro menciona:

- Emails con drafts de respuesta ya generados al aterrizar.
- Invoices con detalles de pago pre-poblados antes de validar.
- Tickets de soporte con código de fix + tests listos.
- Respuestas sugeridas para agentes de customer support.
- Alertas SOC ya investigadas con threat intelligence adjunta.

> [!quote] Un cambio de rol
> Los agentes no solo aceleran workflows — cambian la naturaleza del trabajo. **De ejecutores de tareas a gestores de tareas**. El humano revisa, aprueba, decide lo estratégico; el agente opera los detalles mecánicos.

## Workflows vs agentes

La decisión más importante al diseñar un sistema es **no usar agente cuando no toca**. Cuatro criterios según el libro:

| Característica | Traditional code | Workflow | RAG / Chatbot | Autonomous agent |
|----------------|------------------|----------|----------------|-------------------|
| **Input structure** | Totalmente predecible | Ramas finitas conocidas | Preguntas sobre corpus | Altamente variable / novel |
| **Explainability** | Full transparencia | Audit trail por rama | Caja negra parcial | Caja negra + tooling |
| **Latency** | Ultra-baja | Moderada | Moderada | Alta |
| **Adaptabilidad** | Ninguna | Limitada | Limitada | Alta (con feedback) |

> [!success] Cuatro preguntas para decidir
> 1. ¿Mis inputs son **no estructurados o impredecibles**?
> 2. ¿Necesito **planificación multi-paso** que se adapta a resultados intermedios?
> 3. ¿Basta **RAG/chatbot** o el sistema necesita **decidir y actuar**?
> 4. ¿Quiero que **mejore con el tiempo** con mínima intervención?

Si las cuatro se inclinan a "sí", agente. Si alguna se inclina a "no estricto", baja un escalón. **El sobre-ingeniería es el error más común** en 2025.

## Aplicaciones prácticas

El libro acompaña la teoría con siete ejemplos de código abierto (en su repo público), uno por dominio:

- **Customer support agent** — maneja consultas, procesa refunds, escala a humanos.
- **Financial services agent** — gestión de cuentas, fraude, portfolio rebalancing.
- **Healthcare patient intake & triage** — registro, seguros, priorización, citas.
- **IT help desk agent** — accesos, troubleshooting, despliegue, incidentes de seguridad.
- **Legal document review** — revisión de contratos, descubrimiento, compliance.
- **SOC analyst agent** — investigación de alertas, threat intel, aislamiento de hosts.
- **Supply chain & logistics** — inventario, forecasting, disrupciones, compliance.

Cada ejemplo tiene un sistema de evaluación asociado — algo coherente con [[10-validacion-y-medicion]].

## Principios para construir sistemas agenticos efectivos

| Principio | Definición | Anti-patrón |
|-----------|-----------|-------------|
| **Escalabilidad** | Arquitectura distribuida, autoscaling, paralelismo | "Customer support a 10 tickets/min se cae a 1000" |
| **Modularidad** | Componentes intercambiables, interfaces claras | "Tools hardcodeados en el servicio de agente" |
| **Aprendizaje continuo** | In-context learning, feedback loops | "Mismo error de clasificación de cláusulas en bucle" |
| **Resiliencia** | Manejo de errores, retries, fallbacks | "API call falla, agente crashea, usuario esperando" |
| **Future-proofing** | Estándares abiertos, modularidad | "Prompts acoplados a un vendor propietario" |

Los cinco principios convergen en una regla: **diseña para cambiar**. El modelo de hoy será el modelo de transición de mañana.

## Organizar el éxito

La facilidad de experimentar con LLMs produce **fragmentación organizativa** — proyectos solapados, experimentos inacabados, descubrimientos duplicados. La estandarización prematura mata la innovación. La respuesta:

- **"One standard per large group"**: dentro de cada departamento, estandariza alrededor de una herramienta. Entre departamentos, deja diversidad.
- **Evita vendor lock-in**: adopta **OpenAPI**, **MCP**, diseños modulares.
- **Knowledge sharing explícito**: docs internas, foros, repos compartidos.
- **Governance ligero**: principios, no mandates rígidos.

> [!success] Equilibrio dinámico
> La organización debe reevaluar continuamente el balance entre exploración y estandarización. Es un proceso iterativo, no un estado estable.

## Frameworks agenticos

Cuatro frameworks principales dominan el espacio (a fecha del libro):

### LangGraph

- **Fortalezas**: framework modular basado en **grafos dirigidos** cuyos nodos contienen unidades discretas de lógica (típicamente llamadas a modelos) y cuyas aristas controlan el flujo. Workflows cíclicos, async nativo, retries, ergonomía de developer.
- **Trade-offs**: requiere lógica custom para planificación avanzada y memoria persistente; soporte limitado para multi-agente comparado con AutoGen.
- **Best for**: equipos construyendo sistemas single-agent o multi-agent ligeros con **control de flujo explícito e inspeccionable**.

### AutoGen

- **Fortalezas**: orquestación multi-agente poderosa, asignación dinámica de roles, mensajería flexible entre agentes. Actor-critic y reflection loops como patrones de fábrica.
- **Trade-offs**: pesado para casos simples; muy opinionated alrededor de patrones de interacción.
- **Best for**: sistemas de investigación y producción que involucran diálogo entre múltiples agentes.

### CrewAI

- **Fortalezas**: API amigable, setup rápido, abstracciones como *crew*, *tasks* y *agents*. Buen path para prototipos.
- **Trade-offs**: personalización limitada sobre internals de orquestación; menos maduro para workflows complejos.
- **Best for**: asistentes y agentes human-centric donde la velocidad de prototipado pesa más que el control fino.

### OpenAI Agents SDK

- **Fortalezas**: integración profunda con el ecosistema OpenAI, function calling seguro, primitivas de memoria y routing de tools incorporadas.
- **Trade-offs**: acoplado al stack OpenAI; menor portabilidad para custom u open source.
- **Best for**: equipos ya invertidos en la API de OpenAI que necesitan agentes seguros y tool-using con scaffolding mínimo.

> [!note] Qué framework usa este libro
> **LangGraph, principalmente**. Por su equilibrio entre simplicidad y potencia — grafos explícitos que se pueden depurar, extender y desplegar sin sorpresas. Los ejemplos del libro se escriben sobre LangGraph.

## Resumen del capítulo

- Un agente AI **razona y actúa en bucle**: interpreta contexto, decide qué herramienta usar, ejecuta, evalúa, itera.
- La **revolución del pre-training** democratizó los modelos; lo que queda por resolver es el sistema alrededor del modelo.
- Existen **siete tipos prácticos** de agentes (negocio, conversacional, research, analytics, dev, dominio, browser) más voz/vídeo. El libro se centra en language-model agents.
- La elección **código vs workflow vs RAG vs agente** depende de variabilidad de input, latencia, compliance y necesidad de adaptación.
- Cinco principios no negociables: escalabilidad, modularidad, aprendizaje continuo, resiliencia, future-proofing.
- Los frameworks principales son **LangGraph**, **AutoGen**, **CrewAI**, **OpenAI Agents SDK**. El libro escoge **LangGraph** por simplicidad + potencia.

## Próximos pasos

Adentrarnos en los componentes y patrones: cómo diseñar el **sistema** que rodea al agente en [[02-diseno-de-sistemas-de-agentes]].
