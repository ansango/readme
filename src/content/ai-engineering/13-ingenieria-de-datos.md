---
title: Ingeniería de datos
description: "El capítulo que más determina la calidad de un sistema de IA: curación de datos, augmentation, síntesis con AI, model distillation y el pipeline de procesamiento"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, data-engineering, data-curation, data-synthesis, distillation]
---

# Ingeniería de datos

> [!abstract] Resumen
> Esta nota cubre la ingeniería de datos: la disciplina que se considera **el factor #1 de calidad** en AI engineering. Cubre curación (calidad, cobertura, cantidad, adquisición), data augmentation, **data synthesis** (cómo generar datos sintéticos con otro modelo), **model distillation** y el pipeline de procesamiento (limpieza, deduplicación, formato). Es el apartado más "aburrido" y el más decisivo.

## Por qué la ingeniería de datos es lo más importante

El libro repite un mantra del campo: **"the data is the model"**. La diferencia entre un sistema de IA excelente y uno mediocre casi nunca está en el modelo o en el framework, sino en los datos. Por eso este capítulo es largo: la ingeniería de datos es la habilidad más valiosa y más subestimada.

> [!quote] "Si tu sistema falla, échale la culpa a los datos hasta que se demuestre lo contrario."
> El libro cuenta que la mayoría de errores en AI engineering se diagnostican mal: se culpa al modelo, cuando la causa real es un dataset mal curado.

## Data curation

La curación de datos es el proceso de **construir y mantener** el dataset que tu sistema va a usar para entrenar, evaluar o ambos.

### Calidad

La calidad de los datos impacta directamente en la calidad del modelo. Se mide en múltiples dimensiones:

#### Tipos de calidad

- **Limpieza**: ortografía, gramática, formato consistente.
- **Veracidad**: afirmaciones factualmente correctas.
- **Densidad informativa**: contenido sustantivo vs relleno.
- **Seguridad**: sin instrucciones peligrosas, sin PII.
- **Diversidad**: cubre los casos que importan.

#### Cómo medir calidad

- **Heurísticas**: longitud, ratio caracteres especiales, presencia de palabras clave.
- **Modelos clasificadores**: entrenar un clasificador "bueno/malo" sobre ejemplos etiquetados.
- **Modelos LLM**: usar un modelo potente como juez de calidad.
- **Revisión humana**: la mejor para casos críticos, la más cara.

#### Trade-offs calidad vs cantidad

| Más calidad | Menos cantidad |
|---|---|
| Más tiempo de curación | Menos datos por unidad de tiempo |
| Mayor fidelidad | Potencialmente menos cobertura |
| Menos alucinaciones | Posible sesgo por lo seleccionado |

> [!tip] Calidad mínima antes de cantidad
> El libro recomienda establecer un **umbral mínimo de calidad** y descartar todo lo que no lo cumpla. Más datos de baja calidad **empeoran** el modelo.

### Cobertura

La cobertura mide **qué tan bien representa el dataset el dominio** que te importa.

#### Por qué importa

Un modelo entrenado solo con artículos de Wikipedia será muy bueno en hechos generales y muy malo en tu dominio. La cobertura determina las **capacidades**.

#### Cómo medirla

- **Análisis de topics**: qué temas aparecen y cuáles no.
- **Análisis de demographic**: qué subgrupos están representados.
- **Análisis de intención**: qué intenciones de usuario están cubiertas.
- **Gap analysis**: qué casos importantes faltan.

#### Cómo mejorarla

- **Targeted collection**: recolectar datos específicamente para los huecos.
- **Synthetic data**: generar datos sintéticos para cubrir huecos (con cuidado).
- **Active data acquisition**: pedir a usuarios que generen datos en áreas faltantes.

### Cantidad

La Ley de Chinchilla dice ~20 tokens por parámetro. Para un modelo de 7B, eso son ~140B tokens.

#### Pero la cantidad bruta no basta

- 1B de tokens de alta calidad > 10B de tokens ruidosos.
- 1B de tokens diversos > 10B de tokens repetitivos.
- 1B de tokens relevantes > 10B de tokens irrelevantes.

#### Dónde está el sweet spot

El libro es pragmático: **más datos que tu mínimo, no tantos como para que el coste de adquisición eclipse el ROI**. Para fine-tuning de un modelo de 7B para una tarea concreta, 10K-100K ejemplos de alta calidad suelen ser suficientes.

### Data acquisition and annotation

La curación necesita datos. Estos vienen de cuatro fuentes:

#### 1. Datos existentes

- **Públicos**: Common Crawl, Wikipedia, GitHub, datasets abiertos.
- **Privados**: los datos de tu empresa (con governance adecuada).
- **Comprados**: datasets de vendors, data brokers, etc.

#### 2. Anotación humana

La más cara pero la más controlada. Tres modelos:

- **In-house**: tu propio equipo anota. Caro pero alineado con tu criterio.
- **Crowdsourced**: Mechanical Turk, Toloka, Scale AI. Barato pero menos consistente.
- **Outsourced**: equipos especializados. Punto medio.

#### 3. Datos sintéticos

Generados por un modelo (el tema principal de la siguiente sección).

#### 4. User-generated

Datos que los usuarios generan al usar tu producto. Potencialmente el más valioso, pero con problemas de privacidad y consentimiento.

> [!note] El consentimiento importa
> El libro es claro: cualquier dato de usuario debe tener **consentimiento explícito** y una política clara de uso. Las multas regulatorias (GDPR, etc.) pueden hundir un negocio.

### Framework de evaluación de datos

El libro propone un framework de cinco preguntas para evaluar un dataset:

1. **¿De dónde viene?** (procedencia)
2. **¿Qué cubre?** (cobertura)
3. **¿Tan bueno es?** (calidad)
4. **¿Cuánto hay?** (cantidad)
5. **¿Es legal y ético?** (licencias, privacidad, consentimiento)

Si alguna respuesta es "no sé", es un agujero que necesitas cerrar.

## Data augmentation and synthesis

A veces no tienes suficientes datos. La augmentation y la síntesis atacan exactamente ese problema.

### Por qué augmentation

Más datos diversos → mejor modelo. Pero conseguir datos reales es caro. La augmentation genera **datos nuevos a partir de datos existentes**.

### Técnicas tradicionales

#### Paraphrasing

Reescribir el mismo texto con otras palabras.

```text
Original: "El cielo está nublado."
Paraphrase: "Hay nubes cubriendo el cielo."
```

#### Back-translation

Traducir a otro idioma y volver. Genera variaciones naturales.

#### Synonym replacement

Sustituir palabras por sinónimos manteniendo el significado.

#### Token-level augmentation

Borrar, insertar, sustituir, swap de tokens aleatorios. Bueno para datos de entrenamiento robustos.

### Técnicas modernas: AI-powered data synthesis

Generar datos sintéticos usando un LLM. Es la técnica dominante a 2024.

#### Cuándo es útil

- **Aumentar**: cuando tienes pocos datos reales.
- **Cubrir huecos**: cuando necesitas datos en dominios específicos.
- **Diversificar**: cuando tu dataset es demasiado homogéneo.

#### Cuándo NO es útil

- **Knowledge**: el modelo no sabe cosas que no están en su entrenamiento.
- **Truth ground**: si necesitas datos verificados, los sintéticos heredan los sesgos del modelo.
- **Casos extremos**: el modelo tiende a generar "lo típico", no lo raro.

#### Técnicas de synthesis

##### Generación libre

Prompt simple: "genera 100 ejemplos de conversaciones de soporte".

##### Generation with constraints

Prompt estructurado con condiciones explícitas.

```text
Genera un ejemplo de conversación de soporte. 
- Tema: facturación
- Tono: profesional
- Longitud: media
- Cliente: frustrado
- Solución: reembolso parcial
```

##### Constitutional AI

Usar un conjunto de principios para guiar la generación, descartando outputs que no los cumplan.

##### Self-instruct

Modelo genera instrucciones, después genera las respuestas a esas instrucciones. Útil para SFT.

##### Evol-instruct

Generar variaciones de instrucciones existentes, haciéndolas más complejas o más simples.

> [!tip] Valida SIEMPRE los datos sintéticos
> El libro es tajante: **datos sintéticos sin validación humana son un riesgo**. Incluye revisión humana o al menos AI as judge para detectar problemas.

### Model distillation

Una forma especial de síntesis: usar un **modelo grande como profesor** para entrenar a uno pequeño.

#### Concepto

1. El modelo grande (profesor) genera outputs (con sus probabilidades, no solo el top-1).
2. El modelo pequeño (estudiante) aprende a imitar esas outputs.
3. El estudiante acaba produciendo resultados similares al profesor, pero con menos parámetros.

#### Por qué funciona

- El modelo pequeño aprende **probabilidades completas**, no solo decisiones finales.
- Aprende "el proceso" del profesor, no solo "el resultado".
- Es mucho más barato que entrenar el modelo pequeño desde cero.

#### Ejemplo: distilling GPT-4 en Llama 7B

```python
# Pseudo-código
def distill(teacher, questions):
    student_data = []
    for q in questions:
        # Profesor da probabilidades (no solo el top-1)
        teacher_logits = teacher.full_logits(q)
        student_data.append((q, teacher_logits))
    return student_data

# Entrenar al estudiante con esta data
```

> [!warning] Distillation vs fine-tuning
> Distillation es **más profunda** que fine-tuning estándar porque aprende probabilidades completas. Pero requiere acceso al modelo profesor (sus logits completos), algo que las APIs cerradas no suelen exponer.

### Riesgos del synthetic data

- **Model collapse**: si entrenas con datos sintéticos generados por un modelo, y luego entrenas otro con esos mismos datos, los outputs se degradan iterativamente.
- **Bias amplification**: los sesgos del modelo generador se amplifican.
- **Homogenization**: los datos sintéticos son "promedio" del modelo, pierden los extremos.

## Data processing

El pipeline de procesamiento convierte datos crudos en datos utilizables para entrenamiento/evaluación.

### Inspección

Antes de procesar, **mira los datos**. El libro insiste (y es contraintuitivo para los engineers):

> [!danger] El error más común
> "Mi código de procesamiento compila, los datos entran, los datos salen, parece que funciona." Esto **no es** validar. Hay que mirar manualmente una muestra: ¿los datos son lo que crees que son? ¿Hay basura? ¿Hay duplicados inesperados?

### Deduplicación

Datos duplicados en el entrenamiento **sobreajustan** el modelo y le enseñan a memorizar.

#### Tipos de duplicación

- **Exacta**: misma cadena byte a byte.
- **Cercana**: misma idea, distintas palabras.
- **Cross-dataset**: un chunk aparece en varios de tus datasets.

#### Técnicas

- **Hash exacto**: SHA-256 sobre chunks.
- **MinHash**: detección de duplicados近似.
- **Embeddings**: nearest neighbors en el espacio semántico.
- **Suffix arrays**: para documentos grandes.

> [!tip] Deduplicación como inversión rentable
> El libro reporta estudios que muestran deduplicar puede **mejorar el modelo** mientras **reduce** el coste de entrenamiento. Una de las inversiones con mejor ratio retorno/tiempo.

### Clean and filter

Eliminar lo que no sirve:

- **Lenguaje ofensivo o peligroso**.
- **PII** (personally identifiable information).
- **Spam, SEO farms, contenido de baja calidad**.
- **Outliers estadísticos**: documentos anormalmente cortos/largos.
- **Errores de formato**: encoding corrupto, etc.

#### Técnicas

- **Regex y heurísticas**: palabras clave, patrones.
- **Classifiers**: modelos entrenados para detectar categorías.
- **Modelos LLM**: usar un modelo potente para clasificar.
- **Domain-specific**: filtros adaptados al dominio (ej: filtrar código que no compila).

### Format

Convertir los datos a un formato que el modelo entienda.

#### Formatos comunes

- **JSON Lines (JSONL)**: cada línea es un ejemplo JSON.
- **Parquet**: columnar, eficiente para datasets grandes.
- **Hugging Face datasets**: nativo en la librería.
- **Custom formats**: cuando necesitas algo específico.

#### Templates

Cómo se estructura cada ejemplo:

```jsonl
{"prompt": "What is the capital of France?", "response": "Paris."}
{"prompt": "Translate to Spanish: 'Hello, world'", "response": "Hola, mundo."}
{"prompt": "Classify: 'I love this product!'", "response": "POSITIVE"}
```

O con chat templates:

```jsonl
{"messages": [
  {"role": "system", "content": "You are a helpful assistant."},
  {"role": "user", "content": "What is the capital of France?"},
  {"role": "assistant", "content": "Paris."}
]}
```

#### Conversiones

- **Conversations → SFT format**: convertir chat logs a pares prompt/response.
- **Format → token IDs**: el tokenizador se encarga.
- **Token IDs → training batches**: el data collator.

## Pipelines de datos en producción

El libro cierra con una visión de pipelines reales.

### Componentes típicos

```
raw_data → ingest → clean → dedup → filter → format → validate → train_data
```

Cada paso tiene:
- **Input esperado**.
- **Output garantizado**.
- **Métricas de calidad**.
- **Logs de operación**.

### Versionado

Almacenar **metadatos** de cada versión del dataset:

```yaml
dataset:
  name: customer_support_v3
  version: 2024-11-15
  sources: [help_scout, intercom, salesforce]
  num_examples: 15234
  avg_length: 245 tokens
  quality_score: 0.87
  license: internal_use
  creator: data_team
  schema_version: 2.1
```

### Automatización

Los pipelines de datos son **código**. Como tal:

- **Versionados en git**.
- **Testeados con unit tests** (¿este filtro elimina los casos A, B, C?).
- **Continuous integration**: cambios en el código reconstruyen el dataset.
- **Monitoreados en producción**: tiempo de ejecución, throughput, errores.

> [!tip] Datasets como artefactos
> El libro propone tratar los datasets como **artefactos de primera clase**, no como subproductos del entrenamiento. Cada dataset tiene un dueño, una versión, una descripción, un test de regresión.

## Resumen en tres frases

- La ingeniería de datos es el factor #1 de calidad en AI engineering: más impacto que el modelo, más impacto que el framework.
- La curación implica calidad, cobertura, cantidad, adquisición y **siempre** validación humana o AI as judge de los datos sintéticos.
- El pipeline de procesamiento (inspección, deduplicación, limpieza, formato) es **código de producción**: versionado, testeado, monitoreado.

## Próximos pasos

- [[14-fundamentos-y-optimizacion-de-inferencia|Fundamentos y optimización de inferencia]]: una vez que el modelo está entrenado y los datos están curados, queda la fase de ponerlo en producción. Aquí entran las decisiones de cómputo, latencia y coste.
