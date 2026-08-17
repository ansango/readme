---
title: Post-training y muestreo
description: "Cómo se ajusta un foundation model tras el preentrenamiento: supervised finetuning, preference finetuning y estrategias de muestreo (test-time compute, structured outputs, naturaleza probabilística)"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, foundation-models, fine-tuning, sampling, sft, rlhf]
---

# Post-training y muestreo

> [!abstract] Resumen
> Esta nota cubre la segunda mitad del capítulo 2: las técnicas que se aplican **después** del preentrenamiento para convertir un modelo crudo en un modelo útil (supervised finetuning, preference finetuning, RLHF, DPO) y las decisiones de **muestreo** que determinan la calidad de cada respuesta generada (temperatura, top-p, top-k, test-time compute, structured outputs). Cierra con una discusión sobre la naturaleza probabilística de los modelos y por qué la misma pregunta puede dar respuestas distintas.

## Por qué existe el post-training

El preentrenamiento produce un modelo que **completa texto**: sabe predecir el siguiente token, pero no sabe **conversar**, **seguir instrucciones** ni **seguir convenciones** de un producto. La transición de "completa texto" a "es un asistente útil" ocurre en la fase de **post-training**.

> [!quote] "El preentrenamiento es el conocimiento; el post-training es el comportamiento."
> El libro utiliza esta analogía para recordar que ningún truco de post-training introduce conocimiento nuevo que no esté en los datos; solo cambia cómo el modelo **expresa** ese conocimiento.

El post-training tiene tres grandes objetivos:

1. **Alineación con instrucciones**: que el modelo entienda y responda a lo que se le pide.
2. **Alineación con valores**: que el modelo rechace solicitudes peligrosas o inadecuadas.
3. **Alineación con el formato**: que el modelo genere **cómo** y **cuándo** queremos (JSON, Markdown, longitud, estilo, herramientas).

## Supervised finetuning (SFT)

SFT es la técnica más antigua y más simple: se toma un modelo preentrenado y se sigue entrenando con **pares (input, output)** donde el output es la respuesta ideal. Es aprendizaje supervisado clásico.

### Datos de SFT

Los datos de SFT son típicamente:

- **Conversaciones humanas**: miles o decenas de miles de diálogos donde alguien ha escrito lo que sería una respuesta "buena".
- **Sintéticas**: generadas por otro modelo (a menudo un modelo más potente) y curadas después.
- **Anotaciones humanas específicas**: ejemplos de tareas concretas de tu producto.

> [!tip] La calidad gana a la cantidad
> Para SFT, mil ejemplos de alta calidad y bien diversos ganan a un millón de ejemplos sintéticos ruidosos. En la práctica, los mejores modelos open-source recientes (Llama 3, Mistral, Qwen) usan entre 10K y 100K ejemplos de SFT, no millones.

### Limitaciones de SFT

SFT tiene tres problemas conocidos:

1. **Solo enseña imitación**: el modelo aprende a parecerse a los ejemplos, no a **preferir** respuestas mejores.
2. **Sesgo hacia el estilo**: si los ejemplos son todos largos y formales, el modelo no sabrá ser breve.
3. **Caro de producir**: anotar ejemplos buenos manualmente cuesta tiempo humano.

## Preference finetuning

Para atacar las limitaciones de SFT, se introdujo una segunda fase: **entrenar al modelo con preferencias**, no con respuestas fijas. La idea: en lugar de decirle "esta es la respuesta correcta", le dices "de estas dos respuestas, los humanos prefieren la A".

### RLHF: Reinforcement Learning from Human Feedback

El flujo clásico de RLHF (popularizado por InstructGPT y luego ChatGPT):

1. **Generar pares de respuestas**: para un prompt, el modelo genera dos o más respuestas distintas.
2. **Anotar la preferencia**: un humano (o un modelo) elige cuál es mejor.
3. **Entrenar un modelo de recompensa**: un modelo que predice la puntuación que un humano daría a una respuesta.
4. **Optimizar el modelo con RL**: ajustar el modelo para maximizar la recompensa esperada, típicamente con PPO.

> [!note] PPO y su complejidad
> PPO (*Proximal Policy Optimization*) es un algoritmo de RL estable pero complejo. Es conocido por ser **frágil** y requerir mucho *tuning*. Por eso han surgido alternativas más simples.

### DPO: Direct Preference Optimization

DPO (2023) eliminó la fase de RL por completo. En lugar de entrenar un modelo de recompensa y luego optimizar, ajusta directamente el modelo a partir de las preferencias, usando una pérdida sencilla inspirada en la diferencia de log-probabilidades.

> [!tip] DPO > RLHF en la mayoría de casos
> Para la mayoría de aplicaciones, DPO es **más simple, más estable y consigue resultados comparables o mejores** que PPO. Si vas a hacer preference finetuning, empieza por DPO.

### Otros algoritmos de preference learning

El libro menciona variantes que han aparecido después:

- **IPO**: alternativa a DPO más robusta frente a *overfitting* en las preferencias.
- **KTO**: Kahneman-Tversky Optimization, modela las preferencias como asimetrías de ganancia/pérdida.
- **ORPO**: combina SFT y preference optimization en una sola fase.
- **GRPO** (Group Relative Policy Optimization): usado en DeepSeek-Math, entre otros.

> [!question] ¿Cuándo preference finetuning y cuándo SFT?
> Si tu objetivo es **mejorar la calidad general** de las respuestas (tono, matiz, preferencia) → preference finetuning. Si tu objetivo es **enseñar una tarea concreta** (responder en un formato, usar una API, hablar en un idioma) → SFT. Muchos pipelines hacen **SFT primero, preference finetuning después**.

## Lo que el post-training NO arregla

El libro insiste en una idea clave para evitar expectativas disparatadas:

- El post-training **no añade conocimiento**. El modelo sabe lo que el preentrenamiento le dio.
- El post-training **no arregla alucinaciones estructurales**. Si el modelo no tiene datos sobre un tema, seguirá alucinando, solo que con más confianza.
- El post-training **no convierte un modelo pequeño en uno grande**. Las capacidades emergentes siguen dependiendo de la escala.

> [!danger] "Vamos a fine-tunear y se arregla"
> Si tu problema es que el modelo **no sabe** algo, fine-tunear no lo va a saber mágicamente. Si tu problema es que el modelo **lo sabe pero lo expresa mal**, ahí sí fine-tuning puede ayudar. Diagnosticar antes de actuar.

## Muestreo: cómo decide el modelo qué token emitir

Una vez entrenado, cuando el modelo genera texto, no elige el siguiente token al azar. Hay un proceso de **muestreo** que convierte la distribución de probabilidad del modelo en una elección concreta.

### El proceso básico

En cada paso:

1. El modelo produce una **distribución de probabilidad** sobre todos los tokens del vocabulario.
2. Un **algoritmo de muestreo** elige un token.
3. Se añade a la secuencia y se repite.

Este paso se llama **decoding** y la elección del algoritmo afecta dramáticamente la calidad de la salida.

### Parámetros clave

#### Temperatura

La temperatura escala la distribución antes de muestrear:

- **Temperatura 0**: greedy decoding. Siempre se elige el token más probable. Rápido, pero repetitivo y plano.
- **Temperatura 1**: la distribución original del modelo.
- **Temperatura > 1**: distribución más uniforme. Más creatividad, más riesgo de incoherencia.
- **Temperatura < 1**: distribución más picuda. Más determinista, más "segura".

> [!tip] Cómo elegir temperatura
> Para clasificación y extracción → temperatura 0. Para chat y escritura creativa → temperatura 0.7–1.0. Para brainstorming y generación de ideas → 1.0–1.3. Por encima de 1.5 la cosa se descontrola.

#### Top-k

En lugar de muestrear sobre todo el vocabulario, se eligen los **k tokens más probables** y se renormaliza la distribución entre ellos. Sirve para evitar tokens muy improbables que ensucian la salida.

> [!example] Top-k en acción
> Si el vocabulario tiene 50K tokens y el modelo asigna 80% de probabilidad a "el", 15% a "la", 4% a "un", 1% a "una" y el resto a tokens improbables, con top-k=5 solo se muestrea entre los 5 más probables, descartando la cola.

#### Top-p (nucleus sampling)

Top-p elige el conjunto **mínimo de tokens cuya probabilidad acumulada supere `p`**. Más flexible que top-k: si la distribución es muy picuda, top-p coge pocos tokens; si es plana, coge más.

- **Top-p 0.9** es un valor por defecto popular.
- **Top-p 0.95** permite más diversidad.
- **Top-p 1.0** equivale a no usar top-p.

> [!note] Top-k vs top-p
> En la práctica, top-k y top-p a menudo se usan **combinados** (top-k=50, top-p=0.9 es una combinación común). Lo importante es que ambos cortan la cola de la distribución para evitar tokens basura.

#### Min-p

Una alternativa más reciente que corta los tokens cuya probabilidad es **menor que `min_p` veces la del token más probable**. Resulta en un comportamiento más estable entre pasos con distribuciones picudas y planas.

### Test-time compute

Una de las ideas más importantes de este apartado: **pensar más rato cuesta más caro, pero mejora la calidad**. La técnica se conoce como *test-time compute scaling* o *inference-time compute*.

#### ¿Por qué funciona?

Los modelos pequeños a menudo "se equivocan" en la primera predicción porque no "piensan" antes de responder. Si se les da tiempo (más tokens generados antes de la respuesta final), pueden:

- Razonar paso a paso (*chain-of-thought*).
- Explorar múltiples respuestas y elegir la mejor (*best-of-N*).
- Verificar su propia respuesta (*self-verification*).
- Reformular la pregunta (*reformulation*).

#### Técnicas concretas

- **Chain-of-thought (CoT)**: añadir al prompt "piensa paso a paso" mejora mucho en tareas de razonamiento.
- **Self-consistency**: muestrear N respuestas y elegir la respuesta mayoritaria. Barato y sorprendentemente efectivo.
- **Best-of-N (Rejection sampling)**: muestrear N respuestas y puntuar con un modelo de recompensa, devolviendo la mejor.
- **Tree of Thoughts (ToT)**: explorar un árbol de razonamiento, podando ramas malas.
- **Verifier + search**: usar un modelo verificador para guiar la búsqueda (esto es la base de o1/o3 de OpenAI).

> [!question] ¿Cuándo usar test-time compute?
> Cuando la tarea es **razonamiento** (matemáticas, lógica, planificación) y el coste por pregunta es asumible. Para tareas de extracción o clasificación, no vale la pena. Para chatbots en producción, hay que encontrar el equilibrio entre latencia y calidad.

> [!warning] Coste multiplicativo
> Si generas 10 respuestas y las verificas, estás pagando 10x el coste de inferencia. El cálculo de cuánto vale la pena gastar más en una sola pregunta es una decisión de producto, no de ML.

### Structured outputs

Muchos productos necesitan que el modelo devuelva **JSON válido**, **XML**, **SQL** o algún formato concreto. Hay varias técnicas para garantizarlo:

#### JSON mode / function calling

Las APIs modernas (OpenAI, Anthropic, Google) ofrecen modos nativos:

- **JSON mode**: el modelo se compromete a generar JSON válido. La API valida la sintaxis.
- **Function calling / tool use**: describes un esquema y el modelo responde ajustándose a él.

#### Constrained decoding

Técnicas como *outlines*, *guidance*, *instructor* o *lm-format-enforcer* que **limitan** el vocabulario en cada paso del decoding para garantizar que la salida cumple un esquema (regex, JSON Schema, gramática).

```python
# Ejemplo conceptual con outlines
import outlines

generator = outlines.generate.json(model, schema=MiEsquema)
result = generator("Extrae los datos del cliente: Juan, 35 años, Madrid")
# result es un objeto pydantic validado, no un string
```

#### Ventajas y trade-offs

- **Ventaja**: outputs fiables, fácil de procesar downstream.
- **Riesgo**: si el esquema es muy rígido, el modelo puede "forzar" contenido incorrecto para encajar.
- **Latencia**: incrementa ligeramente, sobre todo con esquemas grandes.

## La naturaleza probabilística de los modelos

El libro cierra la discusión técnica con un punto filosófico-operativo fundamental: los foundation models son **máquinas probabilísticas**, no deterministas. Esto tiene implicaciones profundas.

### Implicaciones operativas

- **La misma pregunta puede dar respuestas distintas** entre llamadas. Esto rompe la intuición de "software = input → output".
- **Variabilidad ≠ alucinación**. Variabilidad es esperada; alucinación es un error factual.
- **No hay ground truth único**. Muchos problemas tienen múltiples respuestas correctas igualmente válidas.
- **La reproducibilidad requiere fijar la semilla** (*seed*) y la temperatura. Sin eso, dos ejecuciones del mismo prompt pueden divergir.

> [!tip] Cachear y guardar seeds
> En pipelines de producción, fijar `temperature=0` o guardar la `seed` permite reproducir resultados al debuggear. En evaluación, fijar la semilla es obligatorio para comparar versiones del modelo.

### Por qué esto importa al diseñar productos

El libro extrae tres consecuencias para el diseño de productos:

1. **Diseña para la variabilidad**: nunca asumas que una respuesta concreta es "la" respuesta. Si tu UI muestra "el modelo dijo X", expón la opción de regenerar.
2. **No conviertas respuestas en verdad**: el modelo no sabe qué es verdad. Cualquier cosa que se muestre al usuario como factual debe pasar por una validación propia.
3. **Mide la distribución, no la salida**: en evaluación, importa más la **distribución** de calidad de respuestas que el caso particular.

### Cuándo la estocasticidad es buena y cuándo mala

- **Buena**: generación creativa, brainstorming, diálogo natural.
- **Mala**: extracción de datos, clasificación, tareas que requieren el mismo resultado siempre.

> [!question] ¿Cómo combato la variabilidad en clasificación?
> Dos técnicas: (1) **temperatura 0** + salidas estructuradas, (2) **ensemble**: hacer varias llamadas y votar. La segunda es más cara pero más robusta.

## Resumen en tres frases

- El post-training convierte un modelo que "completa texto" en un modelo que "sigue instrucciones" — y sus dos familias principales son SFT y preference finetuning.
- El muestreo determina la calidad (y la creatividad) de cada respuesta: temperatura, top-k, top-p y test-time compute son las palancas principales.
- Los foundation models son probabilísticos por naturaleza; los productos que se construyen sobre ellos deben diseñarse teniendo esta propiedad siempre presente.

## Próximos pasos

- [[04-metricas-de-evaluacion-de-lenguaje|Métricas de evaluación de lenguaje]]: cómo se mide la calidad de un modelo. Empezamos por las métricas intrínsecas (entropía, cross-entropy, perplexity) para después pasar a las evaluaciones de sistema.
