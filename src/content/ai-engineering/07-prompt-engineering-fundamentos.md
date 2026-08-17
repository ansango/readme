---
title: "Prompt engineering: fundamentos"
description: "Cómo construir prompts efectivos: in-context learning, system prompt vs user prompt, gestión de contexto y las 7 buenas prácticas que separan un prompt mediocre de uno excelente"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, llm, prompt-engineering, in-context-learning]
---

# Prompt engineering: fundamentos

> [!abstract] Resumen
> Esta nota cubre la primera mitad del capítulo 5: por qué el prompt es la primera palanca de adaptación al modelo, cómo funcionan in-context learning zero-shot y few-shot, qué diferencia hay entre system prompt y user prompt, cómo afecta la longitud del contexto a la calidad y al coste, y las **siete buenas prácticas** que aparecen una y otra vez en prompts que funcionan. La parte defensiva (jailbreaking, prompt injection) está en [[08-prompt-engineering-defensivo|Prompt engineering defensivo]].

## ¿Por qué prompt engineering es la primera palanca?

El libro secuencia las técnicas de adaptación por coste y complejidad ascendente:

1. **Prompt engineering** (gratis, inmediato).
2. **RAG** (requiere datos y pipeline).
3. **Fine-tuning** (requiere datos etiquetados y GPUs).
4. **Entrenar propio** (requiere dataset masivo y equipo).

Antes de saltar a la siguiente, asegúrate de haber exprimido la anterior. La mayoría de problemas que la gente intenta resolver con fine-tuning se arreglan con un prompt mejor.

> [!quote] "Si tus prompts son malos, fine-tuning no los arregla. Solo te da prompts malos con más confianza."
> El libro repite esta idea porque es el error más caro y más común en AI engineering.

## In-context learning

Los modelos generativos modernos tienen una capacidad notable: **aprenden de los ejemplos que ven en el prompt** sin actualizar sus pesos. Esto se llama **in-context learning** (ICL) y es la base de las técnicas de prompting más poderosas.

### Zero-shot

El caso más simple: solo la instrucción, sin ejemplos.

```text
Clasifica el sentimiento de esta review:
"La comida llegó fría y el repartidor fue grosero."
```

El modelo usa lo aprendido en preentrenamiento para resolver la tarea. Funciona bien para tareas **familiares** (clasificación de sentimiento, traducción, resumen).

### Few-shot

Añadir **ejemplos** en el prompt mejora notablemente la calidad, sobre todo en tareas donde el formato o el matiz importan.

```text
Clasifica el sentimiento de cada review como POSITIVO, NEGATIVO o NEUTRO.

Review: "Me encantó, lo recomiendo."
Sentimiento: POSITIVO

Review: "Funciona, pero es caro para lo que ofrece."
Sentimiento: NEUTRO

Review: "La comida llegó fría y el repartidor fue grosero."
Sentimiento:
```

#### Por qué few-shot mejora

- **Ancla el formato**: el modelo ve exactamente cómo se espera la salida.
- **Aclara el criterio**: si los ejemplos son diversos, el modelo entiende los límites.
- **Reduce la variabilidad**: con ejemplos, es más probable que la salida sea consistente.

#### Cuántos ejemplos

- **0 (zero-shot)**: para tareas genéricas.
- **2–5**: el sweet spot habitual. Más allá de 8, rara vez ayuda y siempre encarece.
- **10+**: casos muy específicos donde la tarea es muy open-ended.

> [!tip] Calidad > cantidad en los ejemplos
> 3 ejemplos muy claros y diversos ganan a 10 ejemplos redundantes. Si tus 5 ejemplos dicen lo mismo, es como si tuvieras 1.

### Estructura del prompt

El libro introduce una anatomía básica del prompt que se repite en todas las buenas prácticas:

1. **System prompt** (o mensaje de sistema): instrucciones globales, personalidad, restricciones, formato.
2. **Contexto**: información relevante (RAG, tools, ejemplos).
3. **Instrucción del usuario**: la pregunta o tarea concreta.
4. **Formato de salida**: esquema del output esperado.

### System prompt vs user prompt

La mayoría de APIs modernas separan el prompt en dos canales:

- **System prompt**: instrucciones persistentes que aplican a toda la conversación. Lo configuras una vez al crear el assistant.
- **User prompt**: el mensaje específico de cada turno.

#### Cuándo usar cada uno

- **System prompt**: personalidad, reglas de formato, restricciones de seguridad, ejemplos que aplican siempre.
- **User prompt**: la pregunta concreta, datos específicos del turno, contexto dinámico.

> [!warning] Error común: instrucciones contradictorias
> Si el system prompt dice "responde en español" y el user prompt dice "respond in English", la mayoría de modelos priorizan el último mensaje. Asegúrate de que ambos estén alineados.

```python
# Ejemplo de separación correcta
response = client.messages.create(
    model="claude-3-5-sonnet",
    system="Eres un asistente técnico que responde en español, con ejemplos de código y tono directo.",
    messages=[
        {"role": "user", "content": "¿Cómo leo un archivo en Python?"}
    ]
)
```

### Longitud del contexto y eficiencia

El contexto de un modelo tiene un **límite** (4K, 8K, 32K, 128K, 1M+ tokens según el modelo). A medida que crece la conversación, hay tres problemas:

1. **Coste**: el precio es por token de input. Contexto largo = input largo = más caro.
2. **Latencia**: procesar muchos tokens lleva más tiempo.
3. **Degradación**: en contextos muy largos, los modelos a veces "se pierden" y olvidan información del medio.

#### Cómo gestionar contexto largo

- **Resumir** conversaciones antiguas en lugar de mantenerlas verbatim.
- **Priorizar** información: coloca lo importante al principio y al final; el medio es donde más se degrada la atención.
- **Dividir** tareas largas en subtareas con su propio contexto.
- **Caching**: muchos proveedores cobran menos por partes del prompt que se cachean (prompt caching).

> [!note] La "forma" del contexto importa
> El libro resalta un fenómeno contraintuitivo: el modelo presta **más** atención al principio y al final del contexto, y **menos** al medio. Esto se llama *lost in the middle*. Coloca la información crítica en los extremos.

## Buenas prácticas de prompt engineering

El libro destila siete prácticas que separan los prompts básicos de los buenos.

### 1. Escribe instrucciones claras y explícitas

La vaguedad es enemiga de la calidad. Cada instrucción debe ser:

- **Específica**: no "responde de forma concisa", sino "máximo 50 palabras".
- **Medible**: si no puedes medir si se cumplió, no es instrucción.
- **Sin ambigüedad**: "tono profesional" puede significar cosas distintas.

> [!example] Antes y después
> ❌ "Haz un resumen del texto."
> ✅ "Resume el texto en un párrafo de máximo 80 palabras, manteniendo los tres puntos principales y el tono formal."

### 2. Proporciona contexto suficiente

El modelo no sabe lo que tú sabes. Si tu tarea requiere conocimiento del dominio, incluye:

- **Glosario**: definiciones de términos específicos.
- **Audiencia**: "el lector es un ingeniero senior", "es un cliente no técnico".
- **Restricciones**: "no incluir precios", "evitar jerga médica".

> [!tip] El contexto es el凭什么 de la calidad
> Cuando un prompt falla, el culpable habitual es **falta de contexto**, no falta de capacidad del modelo. Antes de culpar al modelo, pregúntate "¿le he dado toda la información que necesita?".

### 3. Divide tareas complejas en subtareas

Para tareas complejas, una sola llamada al modelo suele ser insuficiente. Divide en **subtareas** que se encadenan:

```text
# Tarea: "Analiza este contrato y dame un resumen ejecutivo"

# Subtask 1: extraer cláusulas clave
"Lee este contrato y lista las cláusulas más relevantes, una por línea."

# Subtask 2: categorizar riesgos
"Para cada cláusula listada, asigna un nivel de riesgo: ALTO, MEDIO, BAJO."

# Subtask 3: redactar resumen
"Genera un resumen ejecutivo de máximo 150 palabras a partir de esta lista categorizada."
```

> [!tip] Pipeline de prompts > un prompt gigante
> Tres prompts encadenados suelen ganar a un prompt monolítico que intenta hacer todo. Razón: cada paso empieza con un foco limpio, sin contaminarse de partes de la tarea que no le tocan.

### 4. Dale al modelo tiempo para pensar

Para tareas que requieren razonamiento, **instruir al modelo a "pensar antes de responder"** mejora notablemente la calidad. Tres técnicas:

- **Chain-of-thought (CoT)**: "piensa paso a paso antes de dar la respuesta final".
- **Step-by-step**: "primero X, luego Y, finalmente Z".
- **Self-ask**: "hazte preguntas intermedias y respóndelas".

```text
Sin CoT:
P: "Si tengo 3 manzanas y doy la mitad a mi hermano, ¿cuántas me quedan?"
R: "0"  # Incorrecto

Con CoT:
P: "Si tengo 3 manzanas y doy la mitad a mi hermano, ¿cuántas me quedan? Piensa paso a paso."
R: "Tengo 3 manzanas. La mitad de 3 es 1.5. Doy 1.5 manzanas, me quedan 1.5."
```

### 5. Itera sobre los prompts

El prompt perfecto no existe en el primer intento. El libro recomienda un workflow de iteración:

1. **Empieza simple**: el prompt más básico que creas que puede funcionar.
2. **Mide** con un dataset de evaluación.
3. **Diagnostica** los fallos: ¿en qué falla?
4. **Modifica** el prompt con un cambio a la vez.
5. **Vuelve a medir**.
6. **Repite** hasta que las métricas se estabilicen.

> [!warning] No cambies dos cosas a la vez
> Si modificas el prompt y la temperatura al mismo tiempo, no sabrás qué causó la mejora. Cambia **una variable por iteración**.

### 6. Evalúa herramientas de prompt engineering

Hay decenas de frameworks y herramientas para gestionar prompts (DSPy, Guidance, LangChain, PromptFoo, etc.). El libro pide **evaluar cada herramienta** en lugar de adoptarla por hype:

- ¿Mejora realmente la calidad?
- ¿Reduce la complejidad?
- ¿Cuál es su coste de adopción?
- ¿Qué pasa cuando el modelo subyacente cambia?

> [!danger] Framework lock-in
> Adoptar un framework pesado (LangChain completo, por ejemplo) puede salir caro cuando necesitas optimizaciones que el framework no soporta. Empieza con **tu propio código** y añade framework solo cuando duela.

### 7. Organiza y versiona prompts

Los prompts son **código**. Como tal, merecen:

- **Control de versiones**: cada cambio en git, con autor y fecha.
- **Tests**: el dataset de evaluación corre con cada cambio.
- **Documentación**: qué hace cada prompt, qué variables tiene, qué outputs esperar.
- **Entornos**: dev, staging, prod con prompts separados.

> [!tip] Prompt ≠ string mágica
> El libro insiste en que un prompt es **código de producto**. Tratarlo como un texto que cambia a mano por cualquiera es una receta para el desastre. Invierte en la disciplina de gestión desde el día uno.

## Patrones de prompting frecuentes

El libro recoge patrones que aparecen en muchos productos:

### Role prompting

Asignar un rol al modelo al principio del system prompt:

```text
Eres un desarrollador senior con 20 años de experiencia en Python.
```

Funciona sorprendentemente bien para anclar tono y nivel de detalle. Pero no abuses: el rol no aumenta la capacidad técnica, solo la predisposición al estilo.

### Format constraints

Especificar el formato de salida:

```text
Responde SOLO con JSON válido siguiendo este esquema:
{"sentimiento": "POSITIVO|NEGATIVO|NEUTRO", "confianza": 0.0-1.0}
```

Combinado con JSON mode / function calling, garantiza que el output sea procesable.

### Conditional behavior

Instrucciones que solo aplican en ciertos casos:

```text
Si el usuario pide código, usa TypeScript. Si pide una explicación, usa prosa en español.
```

### Negative instructions

Decirle al modelo qué **no** hacer:

```text
No menciones precios. No uses jerga técnica. No inventes datos que no estén en el contexto.
```

> [!warning] Las restricciones negativas funcionaron mejor con la generación GPT-4+; con modelos más débiles pueden ser ignoradas. Confirma con tests.

### Iterative refinement

Pedirle al modelo que refine su propia respuesta:

```text
1. Genera una respuesta inicial.
2. Revísala críticamente.
3. Reescríbela si hay problemas.
```

Esta técnica es **sorprendentemente efectiva** y reduce alucinaciones. El coste: 2-3x más tokens.

## Resumen en tres frases

- Prompt engineering es la primera palanca de adaptación: barato, inmediato, y muchas veces suficiente.
- Las siete buenas prácticas (claridad, contexto, subdivisión, tiempo para pensar, iteración, evaluación de herramientas, versionado) son el suelo mínimo de calidad.
- El contexto es lo que más afecta a la calidad: coloca lo importante al principio y al final, resume cuando se haga largo, y ten un dataset de evaluación antes de empezar a iterar.

## Próximos pasos

- [[08-prompt-engineering-defensivo|Prompt engineering defensivo]]: la otra cara del prompt. Qué pasa cuando los usuarios intentan extraer tu system prompt, jailbreak el modelo o inyectar instrucciones maliciosas, y cómo defenderte.
