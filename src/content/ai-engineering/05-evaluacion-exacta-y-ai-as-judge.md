---
title: Evaluación exacta y AI as judge
description: "Más allá de la perplexity: corrección funcional, métricas de similarity, embeddings, LLM-as-a-judge y evaluación comparativa entre modelos"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, evaluation, llm-as-judge, rag, embeddings]
---

# Evaluación exacta y AI as judge

> [!abstract] Resumen
> Esta nota cubre la segunda mitad del capítulo 3: cuando las métricas intrínsecas (perplexity, cross-entropy) no son suficientes, necesitamos **métricas de tarea** más precisas. Vemos corrección funcional, métricas de similarity contra datos de referencia, embeddings, **AI as judge** (usar otro modelo para evaluar) y la evaluación comparativa entre modelos. La siguiente nota ([[06-evaluacion-de-sistemas-de-ia|evaluación de sistemas de IA]]) lleva todo esto al nivel de sistema completo.

## Por qué la perplexity no basta

El libro insiste en la misma idea desde otro ángulo: la perplexity y la cross-entropy son **métricas de preentrenamiento**, útiles para optimizar el modelo en su fase de aprendizaje, pero **inútiles para decir si el modelo va a funcionar en tu producto**. Un modelo con perplexity baja puede generar respuestas correctas en formato incorrecto, o responder con tres párrafos cuando pediste una frase, o alucinar con total confianza.

Para evaluar la calidad real necesitamos ir a **métricas de tarea**: ¿el modelo resolvió el problema que le pediste?

## Evaluación de corrección funcional

La evaluación más potente, cuando aplica, es la **corrección funcional**: ¿el output del modelo hace lo que debería hacer?

### ¿Cuándo aplica?

Cuando la respuesta se puede **verificar automáticamente**:

- Generación de código que se ejecuta y pasa tests.
- Generación de SQL que se ejecuta contra una BD de prueba.
- Salida JSON que valida contra un esquema.
- Predicción de estructura química que se valida con un toolkit.
- Texto que se transforma en una acción (clicar, agregar al carrito) y observas el resultado.

### Ejemplo: evaluación de código

```python
def evaluate_code(model, problem, test_cases):
    """Evalúa si el código que genera el modelo pasa los tests."""
    code = model.generate(problem)
    try:
        exec(code, namespace := {})
        passed = all(
            namespace["solution"](*args) == expected
            for args, expected in test_cases
        )
        return passed
    except Exception:
        return False
```

### Ventajas

- **Objetiva**: 0 o 1, sin ambigüedad.
- **Automatizable**: corre en CI, no requiere humanos.
- **Conecta el output con el resultado**: mide la cosa que importa.

### Limitaciones

- **No aplica a open-ended**: resúmenes, escritura creativa, chat.
- **Requiere buenos tests**: tests malos dan métricas malas.
- **Code != correctness**: código que pasa tests puede tener bugs latentes.

> [!tip] Empieza aquí si puedes
> Si tu tarea admite corrección funcional, no empieces con métricas vagas. La corrección funcional es la evaluación más robusta que existe.

## Métricas de similarity

Para tareas donde la respuesta no se puede verificar funcionalmente pero hay una **respuesta de referencia**, repasamos las métricas de similarity más usadas.

### ROUGE (Recall-Oriented Understudy for Gisting Evaluation)

Familia de métricas estándar en summarization. Mide el overlap de **n-gramas** (secuencias de palabras) entre la respuesta del modelo y la referencia.

- **ROUGE-1**: overlap de unigramas (palabras individuales).
- **ROUGE-2**: overlap de bigramas.
- **ROUGE-L**: longest common subsequence.

> [!example] ROUGE en acción
> Referencia: "El gato se sentó en la alfombra."
> Modelo: "El gato se sentó sobre la alfombra."
> ROUGE-1: 6/7 = 0.86 (6 palabras coinciden de 7).
> ROUGE-2: 5/6 = 0.83 (5 bigramas de 6 coinciden).

### Limitaciones de ROUGE

- **Premia copiar literal**: si tu modelo parafrasea (cosa buena para un resumen), ROUGE cae.
- **Ignora semántica**: "perro" y "can" no son similares para ROUGE aunque signifiquen lo mismo.
- **No captura orden de ideas**: solo n-gramas.

### BLEU y METEOR

Métricas populares en traducción automática, similares a ROUGE pero con matices:

- **BLEU**: precision-oriented (¿el output del modelo tiene los n-gramas correctos?).
- **METEOR**: incluye sinónimos y stemming, más robusto que BLEU.

### BERTScore

Una mejora moderna: usa **embeddings** (representaciones vectoriales del significado) en lugar de n-gramas. Compara los vectores de la salida con los de la referencia.

> [!tip] BERTScore > ROUGE para matices
> Si necesitas una métrica que capture significado y no solo palabras, BERTScore gana. Es más cara de calcular pero más fiel a la calidad semántica.

## Embeddings: la base de las métricas modernas

El libro introduce **embeddings** porque aparecen en varias métricas y técnicas posteriores (RAG, búsqueda semántica, evaluación).

### Qué es un embedding

Un embedding es una **representación vectorial densa** de un texto (palabra, frase, párrafo, imagen). Las posiciones en el espacio vectorial capturan **similitud semántica**: textos con significado parecido están cerca.

> [!example] Embeddings en la práctica
> "El gato está en el sofá" y "Un felino descansa sobre el mueble" tienen embeddings cercanos, aunque no comparten casi palabras.
> "El gato está en el sofá" y "La cocina está desordenada" tienen embeddings lejanos.

### Cómo se generan

Los embeddings se generan con un **encoder**, un modelo entrenado para representar texto en un espacio vectorial. Modelos populares:

- **sentence-transformers** (open-source, multilingüe).
- **text-embedding-3-small** (OpenAI).
- **Cohere embed-v3**.
- **Voyage AI**.

### Dimensionalidad

Los embeddings tienen entre 256 y 4096 dimensiones. Más dimensiones capturan más detalle, pero cuestan más espacio y más cómputo.

### Métricas de similaridad entre embeddings

- **Cosine similarity**: ángulo entre los vectores. La más usada.
- **Distancia euclídea**: distancia geométrica.
- **Dot product**: producto escalar, útil cuando los vectores están normalizados.

> [!question] ¿Cuándo cosine vs euclidean?
> En la práctica, casi siempre cosine. Funciona bien incluso cuando los embeddings tienen magnitudes distintas, y es invariante a la longitud del texto.

## AI as a judge

La técnica más disruptiva de los últimos años en evaluación: **usar un modelo (a menudo uno más potente o especializado) para evaluar la salida de otro modelo**.

### El problema que resuelve

Las métricas automáticas clásicas (ROUGE, BERTScore) son baratas pero limitadas. La evaluación humana es la mejor pero cara y lenta. AI as judge es el **punto medio**: razonablemente buena, razonablemente barata, razonablemente rápida.

### Cómo funciona

1. Defines una **rúbrica** de evaluación (criterios, escala).
2. Le pasas al modelo evaluador el **prompt original**, la **respuesta** del modelo a evaluar y la **rúbrica**.
3. El modelo devuelve una **puntuación** o veredicto.

```python
# Pseudo-código
def llm_as_judge(prompt, response, rubric, judge_model):
    eval_prompt = f"""
    Evalúa la siguiente respuesta según esta rúbrica:
    {rubric}

    Prompt del usuario: {prompt}
    Respuesta: {response}

    Puntuación (1-5):
    """
    return judge_model.generate(eval_prompt).score
```

### Ventajas

- **Escala**: puedes evaluar 10K respuestas en minutos.
- **Consistencia**: a diferencia de humanos, no se cansa ni se distrae.
- **Explicabilidad**: el modelo puede escribir *por qué* puso esa nota.
- **Nuancia**: puede captar matices que ROUGE nunca captaría.

### Limitaciones

- **Sesgo de posición**: muchos modelos prefieren la primera respuesta que ven.
- **Sesgo de longitud**: respuestas largas suelen puntuar más alto.
- **Sesgo de "auto-preferencia"**: un modelo prefiere outputs que se parecen a los que él generaría.
- **Costes**: evaluar 10K respuestas cuesta dinero real.
- **Validación necesaria**: AI as judge no es truth. Hay que calibrarlo contra humanos periódicamente.

> [!warning] El modelo es juez, no dios
> El libro repite que **AI as judge es una herramienta, no una verdad**. Funciona cuando la rúbrica es clara y la tarea es razonablemente objetiva. Falla en tareas muy subjetivas (estilo, creatividad) y en preguntas multi-paso donde el modelo se pierde.

### Cuándo usar AI as judge

- **Viable**: resúmenes, QA, generación estructurada, traducción, instrucciones.
- **Arriesgado**: creatividad pura, decisiones éticas, hechos que requieren fuente externa.
- **Insuficiente**: cuando necesitas evaluación legal o médica.

### Modelos como jueces

- **GPT-4** y **Claude Opus/Sonnet** son los jueces más usados en la industria.
- **Modelos específicos** entrenados para juzgar (Prometheus, JudgeLM) son alternativas más baratas y reproducibles.
- **Self-evaluation**: usar el mismo modelo para generar y evaluar. Más barato, más sesgado.

> [!tip] Combina AI judge con humanos
> El libro recomienda una **pirámide invertida**: AI judge evalúa el 100% de las salidas; humanos evalúan un 5–10% muestreado. Cuando AI judge y humanos discrepan, etiquetas ese caso para revisarlo y ajustar la rúbrica.

## Evaluación comparativa

La última técnica del capítulo: en lugar de evaluar un modelo en abstracto, **comparas dos modelos directamente** y determinas cuál es mejor.

### Pairwise comparison

En lugar de pedir "del 1 al 10", presentas dos respuestas y preguntas "¿cuál es mejor?". Esta técnica reduce el sesgo y es más fácil para el modelo evaluador.

> [!example] Pairwise en acción
> - Respuesta A: "El río Amazonas tiene 6.400 km."
> - Respuesta B: "El río Amazonas tiene aproximadamente 6.400 km de longitud."
> - Pregunta al juez: "¿Cuál es más precisa y útil?"
> - Probable veredicto: B (precisa y matiza con "aproximadamente").

### Ventajas de la comparación

- **Más robusta**: las preferencias relativas son más estables que las puntuaciones absolutas.
- **Mitiga el "logro del 7"**: muchos modelos tienden a puntuar todo en la zona media.

### Cómo implementarla

- **Elo rating**: como en ajedrez, los modelos van ganando/perdiendo partidas según preferencias. Termina en un ranking.
- **Bradley-Terry**: modelo estadístico que convierte pares en rankings.
- **LMSYS Chatbot Arena**: la implementación más famosa, con miles de usuarios humanos votando.

### Limitaciones

- **Requiere más inferencia**: comparar 2 modelos cuesta el doble que evaluar 1.
- **Positional bias**: igual que en AI judge, el orden de presentación importa.
- **Style bias**: respuestas más largas o más formatex peuvent ganar sin ser mejores.

> [!tip] Intercambia el orden
> En pairwise, siempre evalúa **dos veces**, con orden invertido. Si "A > B" y "B > A" según el orden, sabes que tienes positional bias y descartas esa comparación.

## Resumen en tres frases

- Hay tres familias de evaluación: intrínseca (perplexity), de tarea (corrección funcional, similarity) y de juicio (AI as judge, comparativa).
- AI as judge ha cambiado la industria: permite evaluar miles de respuestas a coste razonable, pero requiere calibración y no reemplaza a humanos en lo importante.
- La evaluación comparativa es más robusta que la absoluta y la base de benchmarks modernos como LMSYS Chatbot Arena.

## Próximos pasos

- [[06-evaluacion-de-sistemas-de-ia|Evaluación de sistemas de IA]]: todo lo visto aquí se aplica al modelo aislado. La siguiente nota sube al nivel de sistema: criterios de capacidad, selección de modelo, navegación de benchmarks y diseño del pipeline de evaluación.
