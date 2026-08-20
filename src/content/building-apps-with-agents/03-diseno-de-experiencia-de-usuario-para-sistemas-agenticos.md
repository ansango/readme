---
title: "UX para sistemas agenticos : modalidades, autonomía, contexto y confianza"
description: "Diseño de experiencia de usuario para agentes AI: modalidades (texto, GUI, voz, vídeo), el autonomy slider (Manual/Assisted/Agent), experiencias sync vs async, retención de contexto, comunicación de capacidades e incertidumbre, failing gracefully y construir confianza"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, ux, voz, multimodal, autonomia, confianza]
---

# UX para sistemas agenticos

> [!abstract] Resumen
> Las capacidades técnicas de un sistema agentico no importan si la experiencia de usuario las frustra. Este capítulo recorre los **cuatro ejes de UX agentico**: **modalidades de interacción** (texto, GUI, voz, vídeo), **autonomía** (de manual a fully-agentic vía el *autonomy slider*), **sync vs async** (latencia vs continuidad) y **confianza** (predictabilidad, comunicación de incertidumbre, capacidad de fallar con gracia). La tesis central: **context is UX**. Cómo un agente recuerda, adapta y responde determina si se siente como un colaborador atento o como una herramienta mecánica que obliga al usuario a repetirse.

## Cuatro modalidades, una decisión

```text
   Modalidad       Prevalencia    Caso ideal                  Limitación
   ─────────       ───────────    ──────────                  ──────────
   Texto           Muy común      Chatbots, support,           Discoverability:
                                  comandos, terminales         el usuario no sabe
                                                            qué puede invocar
   GUI             Común          Dashboards, IDEs,           Real estate limitado,
                                  workflows visuales          responsive challenges
   Voz             Menos común    Hands-free, concierge,      Mainstream todavía;
                                  call centers                latency/bandwidth
   Vídeo           Raro           Avatares, training,         "Uncanny valley",
                                  immersive learning          privacy concerns
```

> [!success] Regla del libro
> Los usuarios **no piensan en términos de modalidad**. Quieren completar su tarea. Un diseño excelente **combina modalidades en un único journey coherente**: empiezas hablando mientras conduces, sigues por texto caminando a una reunión, terminas revisando un dashboard en el portátil. Mantener el **estado y el contexto a través del cambio de modalidad** es la marca de un gran agente.

### Texto

**Fortalezas**: simpleza, familiaridad, sync y async a la vez, trazabilidad, integración natural en herramientas existentes (Slack, CLI). El capítulo menciona el renacimiento del terminal con herramientas como **Warp**, **Claude Code**, **Gemini CLI**: comandos en lenguaje natural + autocompletado inteligente + debugging inline.

**Limitación clave — discoverability**: a diferencia de la GUI, el usuario no sabe qué invocar. La mitigación es **proactividad del agente**:

```text
   Antipatrón                           Patrón
   ───────────────                      ──────
   "¿En qué puedo ayudarte?"    →      "Puedo cancelar pedidos,
                                       revisar estado de envío
                                       o actualizar datos de la
                                       cuenta. ¿Con cuál arranco?"
```

Diseño de agentes textuales exige: **claridad, retención de contexto, manejo elegante de errores, turn-taking natural, robustez a ambigüedad**.

### GUI: la frontera generativa

Las interfaces gráficas modernas combinan elementos estáticos y **generative UIs** — elementos generados dinámicamente en respuesta al input del usuario. Ejemplos:

- **Perplexity AI** genera *knowledge cards* y tablas de referencias además de texto.
- **AI coding copilots** generan archivos completos de configuración o componentes UI según la intención del usuario.

```text
   Generative UI
   ─────────────
   Input natural    →  el agente compone la UI óptima
                       (botones, tablas, gráficos, código)
   Constraints      →  layout coherence, priorización, estética
   Output           →  rich, contexto-específico
```

Herramientas como **LangSmith**, **n8n**, **Arize**, **AutoGen** popularizan la orquestación visual de agentes como nodos interconectados — más fácil de entender, debuggear y razonar que el código solo.

### Voz: todavía frontier

Hasta hace poco, los voice assistants eran limitados: parsear comandos, devolver respuestas estáticas. La nueva generación de voz tiene **interrupciones naturales** ("oh wait, mejor mañana") y **tool use** ("resérvame una mesa, agenda esta cita, cambia mi envío"). Pero sigue siendo **tecnología frontier**: la mayoría de deployments son pilotos.

```python title="Patrón típico: bidirectional PCM WebSocket relay"
async def from_client():
    """Relay microphone PCM chunks from browser → OpenAI."""
    async for msg in ws.iter_text():
        data = json.loads(msg)
        pcm = base64.b64decode(data["audio"])
        await openai_ws.send(json.dumps({
            "type": "input_audio_buffer.append",
            "audio": base64.b64encode(pcm).decode("ascii"),
        }))

async def to_client():
    """Relay assistant audio + handle interruptions."""
    if msg["type"] == "response.audio.delta":
        pcm = base64.b64decode(msg["delta"])
        await ws.send_json({"audio": base64.b64encode(pcm).decode("ascii")})
        last_assistant_item = msg.get("item_id")

    # user started talking → cancel assistant speech
    if msg["type"] == "input_audio_buffer.speech_started" and last_assistant_item:
        await openai_ws.send(json.dumps({
            "type": "conversation.item.truncate",
            "item_id": last_assistant_item,
            "content_index": 0,
            "audio_end_ms": 0,        # stop immediately
        }))
```

> [!tip] Latencia cognitiva voz vs texto
> Hablar ≈ 150-180 palabras/minuto. Leer ≈ 250-300 wpm. **Skimming** puede ir mucho más rápido. Diseñar la respuesta hablada (breve) es muy distinto de diseñar la respuesta leída.

## Autonomy slider

> [!quote] Andrej Karpathy (citado por el libro)
> Sistemas agenticos efectivos deberían permitir al usuario mover suavemente la autonomía de control total a fully-agentic.

Tres modos canónicos:

| Modo | Dev (code) | Customer support |
|------|------------|------------------|
| **Manual** | Escribes todo el código a mano; agente apagado en interacciones | Humano responde todo; AI solo analítica |
| **Assisted (Ask)** | Sugerencias, refactors, docs; tú apruebas cada una | Agente redacta respuestas; humano revisa y edita antes de enviar |
| **Agent** | Aplica refactors, fix lint, genera boilerplate sin aprobación caso-a-caso | Agente maneja queries rutin; escala solo casos complejos |

> [!note] El slider no es feature, es **mecanismo de construcción de confianza**
> Da control al usuario sobre cuánto delega. Reconoce su experiencia y su agency. Es la mejor manera de evitar el pitfall de *"one-size-fits-all autonomy"* que o abruma o infrautiliza.

Cuatro reglas operativas para implementarlo bien:

1. **Transición suave** entre niveles — el usuario debe poder moverlo sin fricción.
2. **Comportamiento predecible y transparente** en cada nivel (qué hace el agente en cada modo, qué requiere aprobación).
3. **Comunicar riesgos y beneficios** al subir de nivel.
4. **Adaptar autonomía a confianza demostrada** — después de N usos exitosos, sugerir pasar a Assisted.

## Sync vs Async: latency choose your adventure

| Modalidad | Loop | Caso ideal |
|-----------|------|-----------|
| **Synchronous** | Turno a turno en tiempo real | Chat de soporte, asistente de voz, debugging, decisiones que requieren respuesta inmediata |
| **Asynchronous** | El agente trabaja, el usuario regresa | Emails con drafts pre-generados, reportes de SOC analyst, tickets con código pre-escrito |

> [!quote> El libro insiste
> "Elige qué experiencias caen en cada categoría para que los usuarios no terminen mirando un spinner esperando algo que claramente no es síncrono."

### Design principles para sync

- **Latencia mínima**: nada destruye más la sensación de "inteligencia" que pausas largas.
- **Brevedad y claridad**: respuestas concisas; sin explicaciones largas innecesarias.
- **Turn-taking natural**: preguntar es humano; alargar respuestas es robótico.
- **Cues visuales**: typing indicators, progress spinners — calman ansiedad.

### Design principles para async

- **Proactividad respetuosa**: notificar al usuario cuando hay algo importante, no en bucle.
- **Configurabilidad**: frecuencia de notificaciones, canales, umbrales de escalación.
- **Resumen + detalle**: mostrar headline y dar acceso a detalle bajo demanda.
- **Empático con el tiempo del usuario**: dejar al humano hacer trabajo, no interrumpir.

> [!success> Balance entre proactivo e intrusivo
> "Bien diseñado, los agentes entrelazan engagement proactivo en su flow — productividad sin ser pesado. Diseñado mal, el agente se vuelve spam o, en el otro extremo, espera pasivamente a que le pregunten."

## Context retention y continuidad

**Context is UX**. Cómo un agente recuerda, adapta y responde determina si se siente como **un colaborador coherente y atento** o **una herramienta desconectada que obliga a repetir**.

### Estrategia de almacenamiento

| Estrategia | Pros | Contras |
|------------|------|---------|
| **Client-side** (browser memory) | Rápido dentro de sesión | Pierde continuidad entre dispositivos/login |
| **Server-side** (database, user ID) | Memoria larga duración, cross-device | Latencia posible, consideraciones de privacidad |
| **Hybrid** (short client + long server) | Lo mejor de ambos | Más complejo de implementar |

### Memoria a corto y largo plazo

- **Short-term**: ventana deslizante durante la sesión actual. "Acabas de decir X, ¿quieres que haga Y?"
- **Long-term**: preferencias persistentes, patrones históricos del usuario, adaptación entre sesiones.

> [!warning> Riesgo típico
> "Si el agente pierde track a mitad de tarea, el usuario siente discontinuity, repetición y frustración. Si el agente recuerda todo, privacidad + ruido. **Encontrar el balance es la UX**."

## Comunicar capacidades y limitaciones

Texto: mensajes onboarding que enumeran capacidades. GUI: capability menus, tooltips. Voz: enumerar opciones al inicio. **Generative UIs**: combinar natural language + dynamic visual outputs.

```text
   Wrong                                Right
   ──────                                ─────
   "I'm an AI assistant."    →          "Puedo cancelar pedidos,
                                          revisar estado de envío
                                          y actualizar datos de cuenta."
                                          (lista visible y verificable)
```

### Comunicar confianza e incertidumbre

Tres formas de expresar confianza:

| Forma | Ejemplo |
|-------|---------|
| **Explicit statement** | "I'm 90% certain this is correct." |
| **Visual cue** | Confidence meter, color-coded alert |
| **Behavioral adjustment** | Ofrece "suggestion" en vez de "recommendation" si la confianza es baja |

> [!danger> Equilibrio de hedging
> Demasiada confianza en respuestas inciertas → pérdida rápida de confianza. Demasiado hedging en interacciones de bajo riesgo → agente parece indeciso. **El stakes cuenta**.

### Preguntar al usuario por guía

Ante ambigüedad, **preguntar** es mejor que asumir. Por ejemplo, ante "Book me a ticket to Chicago", preguntar one-way vs round-trip y fechas. Reglas:

- Preguntas **claras, corteses, contexto-aware** (no repetir info ya pedida).
- **Transparent** sobre por qué pregunta.
- **Secuenciadas**: la más crítica primero.

### Failing gracefully

Cuando algo falla (porque va a fallar):

- **Acknowledgement transparente**: no fabricar respuesta.
- **Next steps accionables**: "no encuentro la info, ¿escalar a humano?".
- **State preservation**: que el usuario no pierda progreso.
- **Fallback pre-definido**: si voz falla, ofrecer text input.
- **Lenguaje empático**: cuando algo va mal, el agente debe reconocerlo sin repetir el error infinitamente.

## Construir confianza

> [!quote> Relación de confianza
> La confianza se construye en dos ejes: **transparencia** (explicar qué hace el agente) y **predictibilidad** (actuar igual en condiciones similares).

### Transparencia ≠ data dump

No hace falta mostrar todo el razonamiento. Sí hace falta:

- **Explicar acciones**: cómo llegó a la recomendación, por qué declinó una request, cómo interpretó una instrucción ambigua.
- **Visual cues**: status messages, qué está pasando ahora.
- **Equilibrio**: insight suficiente para confiar, sin overwhelm cognitivo.

### Predictibilidad

- Mismo input → mismo output (o marcado como variación probabilística).
- Edge cases → respuestas previsibles (preguntar, fallback neutral, escalar).
- Consistencia con el tiempo: el agente no debe ser muy cauto en un contexto y overly confiado en otro idéntico.
- **No prometer más de lo que entrega**: mejor admitir límites upfront.

### Resiliencia

- Recuperación de errores.
- State preservation a través de interrupciones.
- Notificar al usuario cuando algo se rompe, sin fallas silenciosas.
- **Cascading failures prevention**: evitar que un subsistema caído tumbé toda la experiencia.

## Resumen del capítulo

- **Modalidad**: texto, GUI, voz, vídeo — y combinaciones que cruzan seamlessly con estado persistente.
- **Autonomy slider**: Manual / Assisted / Agent — mecanismo central de construcción de confianza.
- **Sync vs Async**: latency como commitment; el usuario debe saber qué esperar.
- **Context retention**: short-term en cliente, long-term en servidor, hybrid cuando puedas.
- **Capacidades**: no esconder funciones detrás de jerga; exponerlas proactivamente.
- **Confianza**: transparencia + predictibilidad + resiliencia a errores. Falla con gracia.
- **Context is UX**: el diseño de la retención de contexto es, por sí mismo, la UX.

> [!note> Conexión con el resto del libro
> El UX que describes aquí depende de capacidades técnicas cubiertas en [[04-uso-de-herramientas]] (voice = tool integrations), [[06-conocimiento-y-memoria]] (memoria a largo plazo), [[05-orquestacion]] (qué tan rápido puede iterar el agente), y [[12-bucles-de-mejora]] (qué mejora con el feedback de usuario).

## Próximos pasos

UX definida, pasemos al **cómo extender las capacidades del agente**: las herramientas que puede invocar, empezando por el **Model Context Protocol** en [[04-uso-de-herramientas]].
