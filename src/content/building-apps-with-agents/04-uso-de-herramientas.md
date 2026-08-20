---
title: "Uso de herramientas : local, API, plug-ins, MCP y herramientas con estado"
description: "Capacidades que el agente invoca: LangChain fundamentals (bind_tools), herramientas locales/API/plug-in, Model Context Protocol (MCP) como USB-C para agentes, herramientas con estado y principio de least power, generación automática de herramientas y configuración de tool use"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, tools, mcp, langchain, stateful, toolmaker]
---

# Uso de herramientas

> [!abstract] Resumen
> Mientras los foundation models son buenos conversando, las **herramientas** son lo que convierte a un agente en algo que **actúa sobre el mundo**. El capítulo abre con **LangChain fundamentals** (`@tool`, `bind_tools`, tool calls), recorre los cuatro sabores de herramienta — **local**, **API-based**, **plug-in** y **MCP** — y entra en dos temas críticos: **stateful tools** y el principio de *least power* (un agente que borra media tabla de producción "optimizando performance" es un caso real), y **generación automática de herramientas** vía foundation models como tool-makers. Cierra con `tool use configuration` (parámetro `tool_choice` para forzar/limitar invocaciones) y estrategias defensivas de output validation, retry y fallback.

## LangChain fundamentals: el bloque constructor

Antes de las herramientas, tres primitivas de LangChain que aparecen en todos los ejemplos del libro:

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool

@tool
def add_numbers(x: int, y: int) -> int:
    """Adds two numbers and returns the sum."""
    return x + y

llm = ChatOpenAI(model_name="gpt-4o")          # 1. Inicializar modelo
llm_with_tools = llm.bind_tools([add_numbers])  # 2. Bindear herramientas

messages = [HumanMessage("What is 11 + 49?")]
ai_msg = llm_with_tools.invoke(messages)         # 3. El modelo decide y tool-calls

for tool_call in ai_msg.tool_calls:
    tool_msg = add_numbers.invoke(tool_call)     # 4. Ejecutar y devolver resultado
    messages.append(tool_msg)

final = llm_with_tools.invoke(messages)         # 5. El modelo redacta la respuesta final
```

> [!note> Tres bloques, todas las opciones
> El patrón es siempre: **chat model + mensajes + tools + bind_tools + loop de tool_calls**. Quien entiende este ciclo entiende el 80% de cómo se ejecuta un agente con herramientas.

## Cuatro tipos de herramientas

| Tipo | Dónde corre | Pros | Contras |
|------|-------------|------|---------|
| **Local** | Co-desplegado con el agente | Predecible, configurable, herramienta "perfecta" para debilidades del modelo (math, timezones, calendar) | Cada equipo re-deploy para actualizarla; difícil de compartir |
| **API-based** | Servicio externo | Real-time data, escala gestionada, tools especializadas (Wikipedia, stocks, weather) | Latencia, throttling, autenticación, dependencia de servicio externo |
| **Plug-in** | Plataformas OpenAI/Anthropic/Google | Catálogo curado, integración inmediata | Acoplamiento al vendor; muchas veces behind-UI |
| **MCP** | Servidor que cumple `model_context_protocol` | Reusabilidad cross-agent, estandarizado (JSON-RPC 2.0), vendor-agnostic | Spec joven, seguridad no estandarizada aún |

### Local tools

Refuerzan **áreas donde los LLMs son débiles**: aritmética, timezones, conversions, calendar, operaciones sobre grafos y mapas. El éxito depende del **metadata**, no solo de la lógica:

```text
   Reglas para el @tool decorator
   ──────────────────────────────
   - Nombre preciso y narrow:  add_numbers, NO arithmetic
   - Descripción clara y distinta: no overlap con otras tools
   - Schemas estrictos: type hints explícitos, retornos tipados
```

```python
@tool
def multiply(x: float, y: float) -> float:
   """Multiply 'x' times 'y'."""
   return x * y

@tool
def exponentiate(x: float, y: float) -> float:
   """Raise 'x' to the 'y'."""
   return x ** y

@tool
def add(x: float, y: float) -> float:
   """Add 'x' and 'y'."""
   return x + y

tools = [multiply, exponentiate, add]
llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
llm_with_tools = llm.bind_tools(tools)
```

Modelo con `query = "What is 393 * 12.25? Also, what is 11 + 49?"`:

```text
   multiply {'x': 393,  'y': 12.25} Result: 4814.25
   add      {'x': 11,   'y': 49}    Result: 60.0
   final:    "393 times 12.25 is 4814.25, and 11 + 49 is 60."
```

> [!warning> Responsabilidad
> Cuando bindeas tools, **cedes poder computacional al modelo**. Hacerlo responsablemente — solo herramientas que produzcan más bien que daño — es la responsabilidad paramount de quien construye agentes.

### API-based tools

Conectan al agente con el mundo. Wikipedia para datos enciclopédicos, una API de stocks para precios, cualquier API REST o GraphQL es terreno válido. La lógica es idéntica a la local:

```python
@tool
def get_stock_price(ticker: str) -> float:
   """Get the stock price for the stock exchange ticker for the company."""
   response = requests.get(f"https://api.example.com/stocks/{ticker}")
   if response.status_code == 200:
       return response.json()["price"]
   raise ValueError(f"Failed to fetch stock price for {ticker}")
```

> [!note> Real-time data es la killer feature
> APIs meteorológicas, financieras, de salud, etc., convierten al agente de "responde con tu data de entrenamiento" a "responde con el estado del mundo ahora mismo". Esto, por sí solo, justifica la complejidad de tools externas.

### Plug-in tools

Catálogos mantenidos por proveedores. **Importante asimetría** entre vendors:

- **OpenAI**: su catálogo plug-in vive *dentro* del producto ChatGPT — **no es accesible vía API pública**. Para replicar en tus apps necesitas custom function-calling wrappers (LangChain).
- **Anthropic (Claude)**: expone "tool use" directamente vía la API de Mensajes. **API-first** — registras tus tools y Claude las invoca en inferencia.
- **Google Gemini**: function calling via Vertex AI, declarando tools en un `FunctionCallingConfig`.

> [!tip> Decide por API, no por catálogo UI
> OpenAI's plug-ins son un catálogo *visible al usuario*, no una API. Si tu agente va a invocar tools programáticamente, Anthropic y Google te dan eso directamente. OpenAI te obliga a construir wrappers custom.

### Model Context Protocol (MCP)

> [!quote> Anthropic (origen de MCP)
> "USB-C port for AI" — una interfaz estándar única que cualquier data source expone y cualquier agente consume, sin glue code custom.

Dos roles:

```text
   MCP server                              MCP client
   (web service)                          (agente / LLM app)
       │                                       │
       │  expone vía JSON-RPC 2.0              │  envía requests, recibe responses
       │  methods: listFiles, getRecord,        │  no necesita saber internals
       │  runAnalysis, etc.                     │  solo el catálogo de métodos
       ▼                                       ▼
       ◄────────── JSON-RPC payload ──────────►
```

```python
from langchain_mcp import MultiServerMCPClient

mcp_client = MultiServerMCPClient({
    "math": {
        "command": "python3",
        "args": ["src/common/mcp/MCP_weather_server.py"],
        "transport": "stdio",                    # subprocess → JSON-RPC
    },
    "weather": {
        "url": "http://localhost:8000/mcp",
        "transport": "streamable_http",          # HTTP/WebSocket
    },
})

async def get_mcp_tools() -> list[Tool]:
    return await mcp_client.get_tools()
```

> [!success> Antes de MCP
> Cada agente escribía adapters custom por cada data source. Con N data sources y M agentes, escribías **N × M adapters**. MCP **rompe esa matriz**: un MCP server expone una vez, cualquier agente lo descubre.

> [!danger> Riesgos abiertos
> Auth, role-based access, payload injection y audit logs son áreas donde MCP **no tiene aún una solución única estandarizada**. Las organizaciones con riesgo serio combinan MCP con network policies y proxies adicionales.

Plataformas como **Glama.ai** y **mcp.so** agregan servidores MCP públicos, descubribles y buscables — están construyendo el "npm registry" de tools para agentes.

## Stateful tools y el principio de *least power*

> [!quote> Caso real del libro
> Un agente AI "optimizó" el rendimiento de una base de datos borrando la mitad de filas de una tabla de producción. Borró registros críticos. Sin malicia — solo interpretación errónea de la intención del usuario.

El caso sirve de cabecera para toda la sección: **stateful tools interactúan con data stores vivos cuyo contenido cambia con el tiempo**, y los errores del modelo se vuelven destructivos.

```text
   Antipatrón                                  Patrón
   ───────────                                  ──────
   execute_arbitrary_sql(query)         →      get_user_profile(user_id)
                                              add_new_customer(record)
   "DROP TABLE users" si la query          →    narrowly scoped operations
   contenía 'optimize database'                una operación bien testeada
```

> [!danger> Principio de least power
> Da al modelo **solo las tools que estrictamente necesita**. Si el agente solo lee, no le des rights de delete/update. **La capacidad destructiva debe estar restringida a nivel de la tool, no asumida por el prompt**.

Si inevitablemente necesitas free-form queries (SQL arbitrario):

- **Sanitización**: rechazar `DROP`, `ALTER`, otros patrones OWASP GenAI Security Project.
- **Prepared statements**: previenen SQL injection.
- **Privilegios mínimos**: el `user` del agente no debe ser `postgres`.
- **Logging completo**: cada invocación, cada acción, para forensics.
- **Alertas en tiempo real**: borrados masivos o `ALTER` deben notificar.

## Automated tool development

Dos modos:

### Foundation models como tool makers

El modelo es capaz de leer la documentación de una API o un esquema de DB, generar la tool wrapper, escribir el test de integración, y dejar la tool lista para bindear.

```text
   Spec de entrada                  Modelo produce                        Iteración
   ───────────────                  ──────────────                        ─────────
   OpenAPI spec         →          llama un DSL (Pydantic)                tests
   Esquema SQL          →          tool de query narrow-scoped              schema checks
   Endpoint SDK         →          wrapper con auth                        ejemplos de uso
```

> [!note> El loop generate-and-refine es la palanca
> El modelo **escribe código → ejecuta → revisa → corrige**. Cuesta pocas llamadas a la API y se reusa como librería cuando está bien. Esto es similar en espíritu a [[07-aprendizaje-en-sistemas-agenticos|Learning in Agentic Systems]] pero aplicado a tools en vez de comportamiento.

### Real-time code generation

El agente **escribe y ejecuta código durante operación** para manejar APIs nunca vistas o problemas noveles.

```text
   task nuevo
       ↓
   ¿tool disponible?  ──NO──→  genera código al vuelo
       ↓ ↓ SÍ                  ↓
   ↓ run tool                ↓ ejecuta
       ↓                     ↓
       ↓                     ↓ observa resultado
       ↓                     ↓ ¿funciona?
       └─────────────────────┘     ↓ NO
                                   ↓ vuelve a generar
```

> [!success> Ventajas
> - **Adaptabilidad** total: el agente puede resolver problemas que nadie anticipó.
> - **Time-to-solution** mínimo: sin esperar intervención humana.

> [!warning> Trade-offs serios
> - **Calidad y seguridad**: errores del modelo se vuelven código en producción.
> - **Repetibilidad**: éxito hoy no garantiza éxito mañana — un cambio en la API del modelo o de la API externa rompe el código generado.
> - **Recursos**: cada generación cuesta tokens y ejecución; un agente naive gasta mucho presupuesto.
> - **Debug y compliance**: re-generar código en producción complica auditorías.

## Tool use configuration

Las APIs de foundation model exponen un parámetro `tool_choice` que controla cómo el modelo invoca tools:

```text
   tool_choice     Comportamiento
   ───────────     ─────────────
   "auto"          Decide el modelo si invocar o no (default)
   "any"           Debe invocar al menos una tool
   "none"          No debe invocar nada
   {"name": "X"}   Debe invocar específicamente la tool X
```

```python
# Forzar al modelo a usar una tool específica
llm_with_choice = llm.bind_tools([get_weather], tool_choice="any")
llm_specific = llm.bind_tools([get_weather, calc], tool_choice={"name": "get_weather"})
```

> [!tip> tool_choice en producción
> "Any" fuerza a la modelo a usar **alguna** tool, lo cual es útil en agentes que **siempre** deben tomar acción. Forzar a tool específica previene que el modelo improvise cuando solo una tool es la correcta.

### Output validation y retry

Con stateful tools o APIs externas, los outputs pueden ser malos. La defensa en profundidad:

1. **Validar con schema** (`jsonschema` o `Pydantic`): atrapa malformados antes de continuar.
2. **Retry inteligente** con exponential backoff: reintenta solo la parte que falló.
3. **Fallback graceful**: si el retry agota, usa un modelo alterno, datos cacheados, o pide clarificación.
4. **Log everything**: prompts, calls, errores, retries, fallbacks. Para observabilidad.

```text
   tool call     validation
       ↓             ↓ (si falla: retry con backoff)
       ↓             ↓ (si retry agota: fallback a modelo alterno o safe default)
       ↓             ↓
        ────→  log everything
```

## Resumen del capítulo

- Las **herramientas** convierten LLM en agente: invoke APIs, query databases, ejecuta side-effects, integra con tu sistema.
- Tres bloques LangChain: chat model + mensajes + tools + bind_tools + loop de tool_calls.
- Cuatro sabores de tool: **local** (precisas, narrow-scoped), **API-based** (real-time), **plug-in** (vendor-curado), **MCP** (vendor-neutral, JSON-RPC 2.0, reutilizable cross-agent).
- **MCP es USB-C**: una interfaz estándar que rompe la maldición de los N×M custom adapters.
- **Stateful tools** exigen *least power*: registered narrowly scoped, sanitización, logging, alertas.
- **Generación automática de herramientas** da adaptabilidad pero introduce calidad, repetibilidad y recursos como trade-offs.
- **`tool_choice`** controla el comportamiento de invocación; la defensa en producción pasa por validación + retry + fallback + logging.

## Próximos pasos

Con herramientas en mano, el siguiente paso es **organizar los pasos del agente**: qué tools llamar, en qué orden, con qué plan. Eso es [[05-orquestacion]].
