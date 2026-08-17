---
title: Métricas de evaluación de lenguaje
description: "Cómo se mide la calidad de un modelo de lenguaje: entropía, cross-entropy, bits-per-character y perplexity como métricas intrínsecas para comparar modelos"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, llm, evaluation, metrics, perplexity, entropy]
---

# Métricas de evaluación de lenguaje

> [!abstract] Resumen
> Esta nota cubre la primera mitad del bloque de evaluación: por qué evaluar foundation models es difícil, y las métricas **intrínsecas** que se han usado históricamente para medir la calidad de un modelo de lenguaje: entropía, cross-entropy, bits-per-character/byte y perplexity. Son métricas técnicas, valiosas para comparar modelos en preentrenamiento, pero limitadas para medir calidad en productos. La segunda mitad (evaluación exacta, AI as judge, comparativa) está en [[05-evaluacion-exacta-y-ai-as-judge|Evaluación exacta y AI as judge]].

## Por qué evaluar foundation models es difícil

El libro abre el capítulo con una observación demoledora: **no sabemos medir la inteligencia de un sistema que genera lenguaje**. Toda métrica es una **aproximación** a algo que no tiene definición operativa cerrada. Esto se nota especialmente en tres problemas:

1. **Open-ended**: muchos problemas no tienen una respuesta única correcta. ¿Cuál es el "mejor" resumen de un texto? ¿La mejor introducción a un tema? No hay ground truth objetivo.
2. **Contextual**: la calidad de una respuesta depende del contexto, la audiencia, el formato. La misma respuesta puede ser excelente en un caso y terrible en otro.
3. **Dinámico**: lo que hoy se considera "buena" puede no serlo mañana. Las expectativas culturales y del usuario evolucionan.

Esto explica por qué la industria ha acabado con un **popurrí de métricas**, cada una con un propósito concreto, en lugar de una sola métrica "buena".

### Tipos de evaluación

El libro distingue tres grandes familias:

- **Métricas intrínsecas**: miden la capacidad del modelo per se, independientemente de la tarea. Ejemplos: entropía, perplexity.
- **Métricas de tarea**: miden el rendimiento en una tarea concreta (clasificación, QA, summarization). Ejemplos: accuracy, F1, ROUGE.
- **Métricas de sistema**: miden la calidad de un sistema end-to-end que envuelve al modelo (latencia, coste, NPS, tasa de error del usuario).

> [!tip] Métricas para cada decisión
> Para comparar dos modelos en preentrenamiento → perplexity. Para saber si tu prompt engineering mejoró → métrica de tarea. Para decidir si tu producto está listo para escalar → métricas de sistema.

## Entropía

La entropía es el concepto base de toda la teoría de información. En el contexto de modelos de lenguaje, mide **la incertidumbre del modelo sobre el siguiente token**: cuán "sorprendido" está por lo que viene.

### Definición

$$H(P) = -\sum_{i} p_i \log_2 p_i$$

donde $p_i$ es la probabilidad que el modelo asigna al token $i$-ésimo del vocabulario.

### Interpretación

- **Baja entropía**: el modelo está bastante seguro de cuál será el próximo token. Suele pasar en secuencias predecibles (frases hechas, código boilerplate).
- **Alta entropía**: el modelo está indeciso entre muchas opciones. Pasa en posiciones creativas (inicio de frase, decisión de estilo).

> [!example] Entropía en distintos contextos
> Tras "El cielo es", la entropía es baja: probablemente azul, gris, despejado. Tras "Me pregunto qué...", la entropía es alta: podría seguir con infinitas palabras.

### Limitaciones

La entropía, por sí sola, **no es una buena métrica de calidad**. Un modelo puede tener entropía baja porque es **muy seguro estando equivocado**. Por eso necesita combinarse con otras señales.

## Cross-entropy

La cross-entropy es la métrica de entrenamiento **real** de los modelos de lenguaje. Mide cómo de bien la distribución predicha por el modelo se ajusta a la **distribución verdadera**.

### Definición

$$H(P, Q) = -\sum_{i} p_i \log_2 q_i$$

donde $p_i$ es la distribución real (one-hot en el caso de entrenamiento) y $q_i$ es la distribución predicha por el modelo.

### Intuición

- Si el modelo asigna probabilidad alta al token correcto, la cross-entropy es **baja**.
- Si el modelo asigna probabilidad baja al token correcto, la cross-entropy es **alta**.
- En el límite, si el modelo predice perfectamente, la cross-entropy es 0.

### ¿Por qué se usa en el entrenamiento?

La cross-entropy es **diferenciable** y tiene una derivada sencilla, lo que la hace ideal para gradient descent. Casi todos los modelos de lenguaje se entrenan minimizando cross-entropy.

### Limitaciones

- Es una **métrica por token**, no por documento. Hay que agregarla (sumando o promediando) para tener una métrica global.
- Depende de la **tokenización**: el mismo texto tiene cross-entropy distinta en modelos con tokenizadores diferentes.
- No captura la **calidad semántica**. Un modelo puede tener cross-entropy baja y aun así generar texto incoherente.

## Bits-per-character y bits-per-byte

BPC y BPB son variantes de la cross-entropy normalizadas por la cantidad de texto, lo que permite comparar entre tokenizaciones y corpus de tamaños distintos.

### Bits-per-character (BPC)

$$BPC = \frac{H}{\text{número de caracteres}}$$

Bits de información necesarios para predecir un carácter, promediados.

### Bits-per-byte (BPB)

Igual que BPC pero en bytes (8 bits cada byte). Se prefiere cuando se trabaja con texto que mezcla alfabetos y el "carácter" no es una unidad natural.

### Por qué importan

Permiten **comparar modelos con tokenizadores distintos** en igualdad de condiciones. Un modelo que reporta bits-per-byte está dando una métrica "limpia" de la tokenización.

## Perplexity

La perplexity es la métrica histórica por excelencia de los modelos de lenguaje. Es simplemente la exponencial de la cross-entropy.

### Definición

$$PPL = 2^{H} = e^{H/\ln 2}$$

donde $H$ es la cross-entropy media por token.

### Intuición

La perplexity se interpreta como **"el número de tokens entre los que el modelo está indeciso en promedio"**:

- **PPL = 1**: el modelo sabe exactamente cuál será el siguiente token. Perfecto pero imposible.
- **PPL = 100**: en cada paso, el modelo está indeciso entre 100 tokens (razonable).
- **PPL = 100.000**: el modelo está básicamente adivinando.

### Valores típicos

| Modelo | Perplexity (benchmark) | Notas |
|---|---|---|
| Modelo trivial (bigrama) | ~500 | Línea base muy débil |
| GPT-2 small | ~50 | Buen modelo pequeño |
| GPT-3 | ~20 | Modelo grande |
| GPT-4 / Claude 3.5 | ~7–10 | Estado del arte (aprox) |

> [!note] Las perplexities no son directamente comparables
> Cada modelo se evalúa sobre datasets y tokenizadores distintos. Compara perplexities solo cuando vienen del **mismo benchmark, misma tokenización, mismo dataset**.

### Por qué la perplexity sigue siendo útil

A pesar de sus limitaciones, la perplexity es invaluable porque:

- **Es barata de calcular**: solo necesitas pasar texto por el modelo, sin anotaciones humanas.
- **Es estable**: pequeñas variaciones en el dataset no la mueven mucho.
- **Es comparable entre checkpoints** del mismo modelo durante el entrenamiento.

### Por qué la perplexity NO es suficiente

El libro es claro: la perplexity **no** mide calidad de generación, especialmente en instrucciones. Tres razones:

1. **No mide factualidad**: un modelo con baja perplexity puede ser un alucinador convincente.
2. **No mide seguimiento de instrucciones**: la perplexity mide predicción del siguiente token, no adherencia a un formato pedido.
3. **No mide razonamiento**: tareas multi-paso requieren coherencia global, no solo predicción local.

> [!example] El caso del modelo que predice bien pero genera mal
> Un modelo entrenado solo con texto web (foros, comentarios) puede tener perplexity decente porque esos textos son predecibles, pero generar respuestas horribles en un contexto de atención al cliente. La perplexity no captura esa brecha.

### Usos correctos de la perplexity

- **Comparar el mismo modelo en datasets distintos** (¿es mi modelo mejor en textos legales que en código?).
- **Detectar overfitting** durante el entrenamiento (la perplexity en validación debería bajar en paralelo a la de entrenamiento).
- **Estimar la "rareza" de un texto** (perplexity alta = texto inusual para el modelo).

### Usos incorrectos

- ❌ Decir que "mi modelo es mejor que GPT-4 porque tiene menor perplexity" sin mismo benchmark.
- ❌ Usar perplexity como única métrica de release.
- ❌ Optimizar perplexity pensando que mejorará la calidad de generación.

## Métricas de tarea

Más allá de las métricas intrínsecas, lo que importa en producción son las **métricas de tarea**: cómo rinde el modelo en el trabajo concreto que va a hacer.

### Common task metrics

- **Accuracy**: porcentaje de respuestas correctas. Útil en clasificación.
- **F1**: balance entre precision y recall. Útil cuando hay desbalance de clases.
- **Exact match (EM)**: porcentaje de respuestas que son idénticas a la verdad ground-truth. Estándar en QA.
- **ROUGE**: mide overlap de n-gramas con texto de referencia. Estándar en summarization.
- **BLEU**: mide overlap de n-gramas en traducción automática.
- **METEOR**: similar a BLEU pero con sinónimos y stemming.

### Limitaciones de las métricas de tarea

- **Dependen de ground-truth**: si las etiquetas son malas, la métrica es mala.
- **No capturan variaciones válidas**: en summarization, dos resúmenes muy distintos pueden ser igualmente buenos.
- **Son específicas de tarea**: cambiar de tarea requiere nuevas métricas.

> [!tip] Métricas de tarea vs AI as judge
> Las métricas de tarea sirven como **filtro rápido** (¿el modelo alucinó un campo? ¿dio el formato correcto?). Para matices (¿la respuesta es útil, educada, completa?), necesitas evaluación humana o AI as judge ([[05-evaluacion-exacta-y-ai-as-judge|Evaluación exacta y AI as judge]]).

## Buenas prácticas de medición

El libro cierra la parte conceptual con una lista de buenas prácticas que parecen obvias y todo el mundo se salta:

1. **Mide en datos que no hayas visto nunca**. Un modelo con perplexity 5 en su propio training set no ha aprendido nada.
2. **Usa el mismo dataset para comparar**. Comparar perplexity en datasets distintos es comparar peras con manzanas.
3. **Reporta varianza, no solo media**. Una perplexity "media" sin desviación estándar puede esconder inestabilidad.
4. **Mide en múltiples slices**. Un modelo puede ir muy bien en preguntas de historia y fatal en preguntas de medicina. La media lo oculta.
5. **No confundas regresión en métrica con regresión en producto**. A veces una métrica baja y el producto va mejor (y viceversa).

> [!danger] Sobreoptimización de métricas
> Cuando una métrica se vuelve objetivo, deja de ser buena. Esto es la *Goodhart's Law* aplicada a ML. Si optimizas solo para perplexity, tu modelo aprenderá a "ser predecible" sin mejorar la calidad. Las métricas hay que mirarlas, no jugar con ellas.

## Cuándo sirve cada métrica

| Métrica | Útil para | No útil para |
|---|---|---|
| **Entropía** | Entender distribuciones internas del modelo | Comparar calidad entre modelos |
| **Cross-entropy** | Entrenamiento, optimización | Decidir release a producción |
| **Bits-per-byte** | Comparar modelos con tokenizadores distintos | Decisión final de producto |
| **Perplexity** | Comparar checkpoints, detectar anomalías | Medir calidad en instrucciones |
| **Métricas de tarea** | Comparar modelos en tareas concretas | Evaluar matices de calidad |

## Resumen en tres frases

- Las métricas intrínsecas (entropía, cross-entropy, perplexity) miden la capacidad de predicción del modelo, no la calidad de la respuesta final.
- Perplexity sigue siendo útil para comparar checkpoints y detectar problemas, pero es una métrica incompleta para productos.
- Para evaluar calidad real necesitas combinar métricas de tarea, evaluación humana y AI as judge (próxima nota).

## Próximos pasos

- [[05-evaluacion-exacta-y-ai-as-judge|Evaluación exacta y AI as judge]]: cuando la perplexity no basta, pasamos a métricas de tarea más sofisticadas (exact match, similarity, embeddings), a AI como juez y a evaluación comparativa entre modelos.
