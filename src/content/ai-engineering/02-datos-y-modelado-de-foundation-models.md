---
title: Datos y modelado de foundation models
description: "Cómo se entrena un foundation model: datos de entrenamiento, arquitectura del transformer y cómo el tamaño del modelo determina sus capacidades"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, foundation-models, transformer, training]
---

# Datos y modelado de foundation models

> [!abstract] Resumen
> Esta nota cubre la primera mitad del capítulo 2: qué datos se usan para entrenar un foundation model, por qué la calidad y la mezcla importan más que el algoritmo, qué hace la arquitectura transformer por debajo y cómo la escala (parámetros, datos, cómputo) explica las capacidades que vemos hoy. La segunda mitad (post-training y muestreo) está en [[03-post-training-y-muestreo|Post-training y muestreo]].

## El papel de los datos en los foundation models

Hay un mantra que se repite a lo largo de toda la disciplina: **"the data is the model"**. La arquitectura de un foundation model es casi siempre la misma (transformer), las recetas de entrenamiento son parecidas y los frameworks están estandarizados. Lo que de verdad diferencia un modelo de otro son los **datos** con los que se entrenó.

> [!quote] "Los foundation models son, en esencia, una imagen comprimida y probabilística de sus datos de entrenamiento."
> Cualquier capacidad sorprendente del modelo era ya un patrón presente (de forma explícita o implícita) en esos datos.

### Tipos de datos de entrenamiento

El libro agrupa los datos en tres grandes familias, por orden de peso operativo:

1. **Texto**:依然是 el grueso del entrenamiento. Libros, artículos, código, foros, documentación, transcripciones, etc. La calidad y la diversidad lingüística determinan las capacidades de comprensión y generación.
2. **Código**: tratado como un sublenguaje con estructura propia. Entrenar con código mejora el razonamiento paso a paso, la planificación y la capacidad de seguir instrucciones estructuradas, no solo la habilidad de programar.
3. **Datos multimodales**: pares imagen-texto, audio, vídeo, tablas. Permiten entrenar foundation models que no son solo de lenguaje.

> [!tip] Por qué entrenar con código mejora todo
> El código tiene tres propiedades que lo hacen oro para el entrenamiento: es **estructurado** (gramática estricta), es **ejecutable** (se puede verificar si es correcto) y exige **razonamiento paso a paso**. Un modelo que aprende a predecir el siguiente token de código acaba aprendiendo un estilo de "pensar antes de responder" que se transfiere al lenguaje natural.

### Características de los datos que importan

El libro insiste en tres dimensiones que el práctico subestima:

#### Calidad

Un dataset grande y de baja calidad produce un modelo mediocre. La calidad se mide de muchas formas:

- **Limpieza**: ortografía, gramática, formato, sin duplicados.
- **Veracidad**: contenido factualmente correcto (cada vez más importante para reducir alucinaciones).
- **Seguridad**: ausencia de instrucciones peligrosas, odio, etc.
- **Densidad informativa**: contenido sustantivo vs relleno publicitario, SEO spam, etc.

> [!danger] Crawls masivos sin filtrar
> Common Crawl contiene una proporción enorme de páginas de baja calidad (spam, SEO farms, contenido duplicado). Entrenar directamente sobre un crawl sin filtrar degrada mucho el modelo. De ahí que casi todos los pipelines serios dediquen **semanas de cómputo** a limpiar y deduplicar antes de entrenar.

#### Cobertura

Un modelo entrenado solo con artículos de Wikipedia en inglés será muy bueno respondiendo sobre historia general y muy malo sobre programación en Rust o sobre literatura japonesa. La **cobertura** del dataset determina **para qué sirve el modelo**. Esto es lo que justifica inversiones masivas en scrapeo multilingüe, licencias con editoriales o curación de datasets clínicos.

#### Cantidad

Más datos mejoran el modelo hasta un punto, pero ese punto depende del tamaño del modelo y del cómputo. Para un modelo pequeño, pasar de 100 GB a 1 TB de datos suele ayudar notablemente porque todavía está hambriento; para un modelo muy grande en el límite de su capacidad, añadir más datos duplicados solo añade coste de entrenamiento.

> [!note] La ley de scaling no es mágica
> La famosa *scaling law* (más parámetros + más datos + más cómputo = mejor modelo) tiene un techo. Llegar a ese techo requiere datasets **diversos y de calidad**, no solo grandes. Los modelos actuales están cerca del techo no por falta de cómputo, sino por falta de datos de calidad.

### Mezcla de datos (*data mixture*)

El libro trata la mezcla de datos como un **hiperparámetro crítico** del entrenamiento. La proporción de código, texto web, libros, datos sintéticos, etc. impacta directamente en las habilidades del modelo. Por ejemplo:

- Un modelo con 5% de código razona mejor en tareas de planning.
- Un modelo con 60% de texto web multilingüe mejora en tareas de traducción.
- Un modelo con datos sintéticos de matemáticas mejora en aritmética, pero demasiado sesga hacia el formato sintético.

Encontrar la mezcla óptima es un arte que requiere muchos experimentos de ablación.

### Filtros y curación

Antes de entrenar se aplican típicamente:

- **Deduplicación** exacta y difusa (para que el modelo no memorice).
- **Filtrado por calidad** (heurísticas + modelos clasificadores entrenados para distinguir "buen" de "mal" texto).
- **Filtrado por seguridad** (eliminar instrucciones peligrosas, PII, etc.).
- **Filtrado por longitud** (documentos muy cortos o extremadamente largos suelen contaminar el entrenamiento).
- **Filtrado por dominio** (si quieres un modelo excelente en código, oversample código; si lo quieres multilingüe, balancéalo).

> [!tip] Lo que no se ve en el paper
> Los papers de los modelos grandes dedican la mayoría del espacio a hablar de la arquitectura y muy poco al pipeline de datos. La realidad es que **el 80% del trabajo de entrenar un foundation model es ingeniería de datos**, no arquitectura.

### Modelos multilingües

Entrenar un modelo multilingüe no es solo añadir más idiomas al dataset. El libro señala varios retos:

- **Desbalance de recursos**: inglés sigue siendo el idioma con más datos limpios. Idioma con pocos recursos (gallego, bengalí, muchos africanos) salen perdiendo.
- **Interferencias entre idiomas**: tokens compartidos entre idiomas distintos pueden degradar la calidad.
- **Calidad de la traducción**: gran parte de los datos multilingües procede de traducción automática, que introduce sesgos.

> [!question] ¿Entrenar multilingüe o dos modelos especializados?
> La mayoría de equipos pequeños opta por un solo modelo multilingüe (GPT-4, Claude, Llama) porque entrenar varios modelos es carísimo. Pero si tu producto es solo en un idioma y necesitas la máxima calidad, un modelo especializado en ese idioma puede ganarle al multilingüe.

### Modelos específicos de dominio

El libro distingue entre modelos de propósito general y modelos entrenados con datos de un dominio concreto (medicina, derecho, código, biología). Los modelos de dominio:

- Pueden ser **más pequeños** y aun así superar a un modelo generalista en tareas del dominio.
- Requieren datasets específicos, que son caros y a menudo confidenciales (historiales clínicos, contratos legales).
- Plantean cuestiones legales y éticas adicionales (privacidad, copyright).

> [!example] Modelos de dominio en producción
> BloombergGPT (modelo de finanzas), Med-PaLM (medicina), Codex (código) son ejemplos de modelos entrenados o fine-tuneados con datos específicos. La tendencia actual es hacia **fine-tuning de un modelo general** sobre datos de dominio, más que entrenar un modelo desde cero.

## Modelado: la arquitectura

A pesar de la enorme variedad de foundation models, la inmensa mayoría comparten la **misma arquitectura base**: el transformer. La innovación se ha desplazado a la **escala**, los **datos** y los **trucos de entrenamiento**, no a la arquitectura.

### El transformer

El transformer, introducido en 2017, revolucionó el campo porque superó las limitaciones de las arquitecturas anteriores (RNN, LSTM) para modelar secuencias largas. Sus dos ingredientes clave son:

1. **Self-attention**: cada token de la secuencia atiende a todos los demás tokens, ponderando su relevancia. Esto permite capturar relaciones a corta y larga distancia sin la recurrencia secuencial de las RNN.
2. **Capas feed-forward**: tras la atención, cada token se procesa por una red feed-forward independiente.

> [!note] Por qué el transformer es tan importante
> La atención permite paralelizar el entrenamiento mucho mejor que las RNN (no hay dependencia secuencial en el cómputo de cada capa). Esto, sumado a las GPUs modernas, hizo posible entrenar modelos **mucho más grandes** en tiempos viables, y empezó la era de los LLMs.

#### Variantes

El libro repasa las dos familias principales:

- **Decoder-only** (GPT, Llama, Claude): optimizados para generación. Solo miran al pasado (máscara causal). Hoy dominan la generación de texto.
- **Encoder-only** (BERT, RoBERTa): optimizados para comprensión. Ven toda la secuencia en ambos sentidos. Útiles para clasificación, búsqueda, embeddings.
- **Encoder-decoder** (T5, BART): un encoder lee la entrada, un decoder genera la salida. Buenos para traducción y tareas estructuradas.

> [!tip] Cómo elegir arquitectura para tu caso
> Si necesitas generar texto libre → decoder-only. Si necesitas embeddings y clasificación → encoder-only. Si necesitas transformar una entrada estructurada en otra (traducción, resumen extractivo) → encoder-decoder. En 2024-2025 la frontera se ha difuminado: los decoder-only hacen ya casi todo, pero los encoder-only siguen ganando en embeddings puros.

#### Innovaciones posteriores

El transformer original ha sido mejorado incrementalmente:

- **Rotary positional embeddings (RoPE)**: mejor manejo de posiciones largas.
- **Grouped-query attention (GQA)**: reduce coste de memoria en inferencia.
- **Mixture of experts (MoE)**: solo se activa un subconjunto de parámetros por token, permitiendo modelos enormes con menos cómputo por token.
- **Sliding window attention**: reduce el coste cuadrático de la atención en secuencias largas.
- **State space models (Mamba, etc.)**: alternativas al transformer para secuencias muy largas, con coste lineal.

### Tokenización

Antes de entrar al modelo, el texto se convierte en **tokens** mediante un tokenizador. La tokenización importa más de lo que parece:

- **BPE (Byte Pair Encoding)**: el algoritmo más común. Fusiona los pares de caracteres más frecuentes hasta llegar a un vocabulario de tamaño deseado.
- **SentencePiece**: framework popular para entrenar tokenizadores multilingües.
- **Tiktoken**: tokenizador de OpenAI, optimizado para su familia de modelos.

> [!warning] La tokenización afecta al coste y al rendimiento
> Un mismo texto puede ser más caro en un modelo que en otro porque su tokenizador produce más tokens. Las APIs se facturan por **token**, no por carácter. Idiomas con tokenizadores subóptimos (a veces el chino, a veces el español en tokenizadores entrenados mayoritariamente en inglés) pagan más por la misma información.

> [!example] Comparación práctica
> Un párrafo de 1000 caracteres en inglés puede ocupar ~250 tokens en GPT-4. El mismo párrafo en español ronda ~300, y en chino unos ~500 tokens según el tokenizador. Esto impacta directamente en el coste por llamada y en el tamaño del contexto efectivo.

## Tamaño del modelo

El libro dedica mucho espacio a la **escala** porque es la variable que más cuesta modificar y la que más impacto tiene en capacidades.

### Leyes de scaling

Las *scaling laws* (Kaplan 2020, Chinchilla 2022) cuantificaron la relación entre:

- **N**: número de parámetros del modelo.
- **D**: cantidad de datos de entrenamiento (en tokens).
- **C**: cómputo de entrenamiento (FLOPs).

> [!note] Chinchilla: el equilibrio correcto
> El paper de Chinchilla mostró que la mayoría de modelos pre-Chinchilla estaban **subentrenados**: muchos parámetros con pocos datos. La regla de Chinchilla (~20 tokens por parámetro) redefinió el equilibrio: para un presupuesto de cómputo dado, hay un tamaño de modelo y un tamaño de dataset óptimos.

### Lo que la escala cambia

El libro describe tres patrones de comportamiento cuando escalas un modelo:

1. **Capacidades que escalan suave**: calidad general, coherencia, seguimiento de instrucciones. Mejoran monótonamente con la escala.
2. **Capacidades que emergen**: tareas que aparecen de forma discontinua a cierta escala. Razonamiento matemático, corrección de código, planificación multi-paso. A 10B parámetros casi no existen; a 100B+ aparecen "de repente".
3. **Capacidades que no escalan**: cualquier cosa que requiera **datos específicos** que no están en el entrenamiento. Por ejemplo, un modelo entrenado solo con texto web no aprenderá a usar una API concreta por mucha escala que le des.

> [!danger] "Solo necesito un modelo más grande"
> Es la respuesta más común y la más equivocada. Escalar sin diagnosticar primero **por qué falla el modelo** suele agravar el problema (las alucinaciones se vuelven más convincentes, los sesgos se afianzan, los costes se disparan). Antes de escalar, **mide, diagnostica y arregla el cuello de botella**.

### Cómo afecta la escala a capacidad vs coste

| Tamaño aprox. | Capacidades típicas | Coste relativo |
|---|---|---|
| <1B parámetros | Tareas muy concretas, instruct-following básico | Barato, se puede correr en CPU |
| 1B–10B | Conversación decente, código sencillo | Moderado, requiere GPU |
| 10B–100B | Razonamiento emergente, código sólido | Alto, GPUs especializadas |
| 100B+ | Cerca del estado del arte en casi todo | Muy alto, infra dedicada |

> [!tip] No necesitas el modelo más grande
> Para la mayoría de aplicaciones prácticas, un modelo de 7B–13B bien fine-tuneado supera a un modelo de 70B genérico en la tarea concreta. La escala bruta es la opción **cuando no tienes tiempo/recursos para adaptar el modelo**, no la opción por defecto.

### Latencia vs escala

A más parámetros, más latencia por token generado. Si tu producto es interactivo, la latencia manda. Hay tres caminos cuando la escala choca con la latencia:

1. **Cuantización**: convertir pesos de FP16 a INT8/INT4 (ver [[14-fundamentos-y-optimizacion-de-inferencia|Fundamentos y optimización de inferencia]]).
2. **Speculative decoding**: usar un modelo pequeño para "adivinar" tokens que un modelo grande verifica.
3. **Caching**: prompts idénticos o parcialmente idénticos se sirven desde caché sin tocar el modelo.

## Resumen en tres frases

- Los datos son el factor que más determina la calidad de un foundation model; arquitectura y cómputo están casi estandarizados.
- El transformer es la arquitectura dominante; la innovación se ha movido a escala, datos y trucos de entrenamiento.
- La escala explica capacidades que parecen emergentes, pero no arregla lo que los datos no contienen.

## Próximos pasos

- [[03-post-training-y-muestreo|Post-training y muestreo]]: cómo se ajusta un foundation model tras el preentrenamiento (SFT, preference finetuning) y qué decisiones de muestreo determinan la calidad de la respuesta.
