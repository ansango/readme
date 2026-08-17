---
title: Técnicas de finetuning
description: "El arsenal de PEFT, LoRA, QLoRA, adapters, model merging y multi-task finetuning. Cuándo usar cada uno y tácticas prácticas"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, llm, fine-tuning, lora, peft, model-merging]
---

# Técnicas de finetuning

> [!abstract] Resumen
> Esta nota cubre la segunda mitad del capítulo 7: las técnicas concretas que existen para hacer fine-tuning viable en hardware modesto. **PEFT (Parameter-Efficient Fine-Tuning)** con LoRA, QLoRA y adapters, cómo se entrenan, y técnicas avanzadas como **model merging** y **multi-task finetuning**. Cerramos con tácticas prácticas: cómo elegir el learning rate, cuántas epochs, cómo evaluar. La parte conceptual (cuándo fine-tunear, memoria) está en [[11-finetuning-decisiones-y-memoria|Finetuning: decisiones y memoria]].

## Por qué PEFT

Recordemos la matemática de la nota anterior: fine-tunear un modelo de 7B consume ~56 GB de VRAM solo en pesos + gradientes + optimizador. Para 70B, la cifra se dispara. **PEFT (Parameter-Efficient Fine-Tuning)** es un conjunto de técnicas que **solo ajustan una pequeña fracción de los parámetros**, dejando el resto congelado.

### Beneficios

- **Memoria**: se reduce 10-100x.
- **Velocidad**: entrenamiento más rápido.
- **Almacenamiento**: en lugar de guardar 7B de pesos fine-tuneados, guardas unos MB.
- **Portabilidad**: puedes tener un adapter por tarea y cargarlos bajo demanda.

> [!quote] "PEFT es la democratización del fine-tuning."
> El libro destaca que PEFT es lo que ha permitido que equipos pequeños fine-tuneen modelos que antes estaban reservados a organizaciones con clusters de GPUs.

## LoRA (Low-Rank Adaptation)

La técnica PEFT más popular. La idea central: **no actualizar los pesos directamente, sino aprender una matriz de bajo rango que se multiplica con ellos**.

### Cómo funciona

En cada capa lineal del transformer, los pesos son una matriz **W** de dimensión `d × d`. LoRA aprende dos matrices **A** y **B** tales que:

`W' = W + α × (A × B)`

donde:
- **A** tiene dimensión `d × r`
- **B** tiene dimensión `r × d`
- **r** es el **rank**, típicamente 4, 8, 16 o 32
- **α** es un factor de escala

El número de parámetros entrenables pasa de `d²` a `2 × d × r`, una reducción brutal.

### Intuición

Cuando `r` es pequeño, la matriz `A × B` solo puede representar **pocos patrones de cambio**. Esto fuerza al modelo a aprender **adaptaciones simples**, no a reescribir sus pesos.

> [!tip] El rank es el hiperparámetro clave
> - **r=4**: cambios muy sutiles, mínimo riesgo de olvidar.
> - **r=16**: balance típico.
> - **r=64**: más capacidad, más memoria, más riesgo de catastrophic forgetting.
> - **r=128+**: se acerca a full fine-tuning.

### Implementación

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(base_model, config)
model.print_trainable_parameters()
# Salida típica: "trainable params: 4.2M || all params: 7B || trainable: 0.06%"
```

### Qué módulos targetear

Por defecto, LoRA se aplica a **q_proj** y **v_proj** (proyecciones de atención). Pruebas recientes muestran que aplicar también a **k_proj, o_proj, gate_proj, up_proj, down_proj** mejora resultados sin coste excesivo.

> [!warning] Más módulos ≠ siempre mejor
> Más módulos entrenables = más capacidad pero más memoria y más riesgo de overfitting. La convención 2024 es aplicar a todas las proyecciones lineales.

## QLoRA

**QLoRA = LoRA + cuantización de 4 bits** del modelo base.

### Cómo funciona

1. Cuantizar el modelo base a INT4 (con el algoritmo NF4 de bitsandbytes).
2. Aplicar LoRA sobre las capas cuantizadas.
3. Entrenar solo los adapters LoRA.

### Beneficios

- Permite fine-tunear un modelo de 70B en **una sola GPU A100 de 80 GB**.
- Reduce memoria ~4x respecto a LoRA puro en FP16.
- Calidad casi idéntica a LoRA puro.

```python
from transformers import BitsAndBytesConfig
from peft import LoraConfig, prepare_model_for_kbit_training

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True
)

model = AutoModelForCausalLM.from_pretrained(
    "model_name",
    quantization_config=bnb_config,
    device_map="auto"
)
model = prepare_model_for_kbit_training(model)
```

> [!tip] QLoRA es el sweet spot actual
> El libro recomienda QLoRA como **punto de partida por defecto** para fine-tuning en hardware modesto. Si necesitas más capacidad, sube a LoRA en FP16. Si necesitas más aún, full fine-tuning.

## Otros métodos PEFT

### Adapters

Capas adicionales insertadas dentro del modelo, congelando la red original.

- **Serial adapter**:插入 entre la atención y la feed-forward.
- **Parallel adapter**: en paralelo a la feed-forward.

Históricamente importantes, pero hoy **LoRA ha ganado la batalla** por simplicidad y rendimiento.

### Prefix tuning

Añadir **prefijos entrenables** al input de cada capa de atención. El modelo aprende a condicionarse por estos prefijos.

- **Pros**: muy pocos parámetros.
- **Cons**: ocupa ventana de contexto.

### Prompt tuning

Aprender **prompts suaves** (embeddings, no tokens reales) que se prependen al input.

- **Pros**: simple, pocos parámetros.
- **Cons**: menos flexible que LoRA.

### (IA)³

Multiplicar las activaciones por vectores aprendidos, escalando el efecto de cada componente.

- **Pros**: ultra-eficiente (mucho menos que LoRA).
- **Cons**: menos maduro, menos estudios.

## Cuándo cada técnica

| Técnica | Parámetros entrenables | Memoria | Cuándo |
|---|---|---|---|
| **Full FT** | 100% | Muy alta | Tienes 8+ GPUs y presupuesto |
| **LoRA** | 0.1-1% | Media | Default razonable |
| **QLoRA** | 0.1-1% | Baja | Hardware modesto |
| **Adapters** | 1-5% | Media | Casos legacy |
| **Prefix tuning** | 0.01% | Baja | Prompt condicional |
| **Prompt tuning** | 0.001% | Mínima | Multitask simple |

## Model merging

Después de entrenar varios adapters, hay técnicas para **combinarlos en un solo modelo** sin reentrenar.

### Model souping

Si tienes varios modelos fine-tuneados con el mismo entrenamiento pero diferentes seeds, **promediar los pesos** produce a menudo un modelo mejor que cualquiera de los originales.

> [!example] El truco del "model soup"
> Entrena 3 modelos con seeds distintos. Promedia sus pesos. Sin coste adicional, el modelo promediado es típicamente 0.5-1% mejor.

### Task arithmetic

Si entrenas adapters para tareas A, B y C, puedes **sumar y restar** los adapters como vectores:

```
Adapter_Sumar = Adapter_A + Adapter_B
Adapter_Restar = Adapter_A - Adapter_B (esto te da "lo específico de A")
```

Permite combinación y descomposición de capacidades.

### SLERP (Spherical Linear Interpolation)

Interpolar entre dos modelos **en la esfera de pesos** (no en línea recta):

```python
def slerp(model_a, model_b, t=0.5):
    """Interpola entre model_a y model_b con factor t."""
    # Implementación usando spherical geometry
    ...
```

Útil para combinar modelos specialty y base.

### MergeKit

La herramienta más popular para todo esto. Soporta:

- Linear merge
- SLERP
- Task arithmetic
- TIES (resolver conflictos entre adapters)
- DARE (drop and rescale)

```bash
mergekit-yaml config.yaml merge_output/
```

## Multi-task finetuning

Entrenar **un solo modelo** en múltiples tareas a la vez.

### Por qué

- **Mejor generalización**: el modelo ve más diversidad.
- **Sin interferencia**: a diferencia del catastrophic forgetting.
- **Un solo modelo en producción**: más simple.

### Técnicas

#### Mixture training

Mezclar datasets de distintas tareas, entrenar normalmente.

#### Multi-task prompting

Añadir al prompt una **instrucción de tarea**:

```text
Tarea: clasificación de sentimiento
Review: "El producto es horrible."
Sentimiento: NEGATIVO

Tarea: traducción
Texto: "Hello, world"
Traducción: "Hola, mundo"
```

#### Conditional computation

Mezclar los datasets con un campo de "task token" que le indica al modelo qué tarea es.

> [!tip] Multi-task + LoRA
> La combinación más popular: **un adapter por tarea** entrenado con multi-task, después se selecciona el adapter según la tarea. Tienes specialization sin perder el modelo base.

## Tácticas prácticas de fine-tuning

El libro cierra con una lista de consejos prácticos basados en la experiencia.

### Learning rate

| Tipo | LR típico |
|---|---|
| Full FT | 1e-5 a 5e-5 |
| LoRA | 1e-4 a 5e-4 |
| QLoRA | 1e-4 a 2e-4 |
| Embeddings | 1e-5 a 5e-5 |

> [!question] LR o learning rate scheduler
> El libro recomienda **SIEMPRE** usar un scheduler (cosine, linear decay). Sin scheduler, los fine-tunes divergen o no convergen.

### Número de epochs

- **1 epoch**: si tienes >100K ejemplos.
- **2-3 epochs**: 10K-100K ejemplos.
- **3-5 epochs**: <10K ejemplos.
- **Más de 5**: sospechoso, probablemente overfitting.

### Batch size

- **LoRA**: batch sizes grandes (32-128) funcionan bien.
- **Full FT**: depende de VRAM, empezar pequeño.

### Cuantización del optimizador

Usar **AdamW8bit** (bitsandbytes) en lugar de AdamW puro reduce memoria del optimizador un 50%.

### Validación

- **Holdout split**: 5-10% del dataset para validación.
- **Eval cada N steps**: para detectar divergencia temprano.
- **Eval contra modelo base**: comparar siempre con el modelo sin fine-tunear.

### Catastrophic forgetting

Síntoma: el modelo fine-tuneado **olvida** capacidades que tenía antes (responder en idiomas, seguir instrucciones básicas).

Mitigaciones:

- **Mixing training data**: incluir 10-20% de datos genéricos.
- **Lower learning rate**: menor LR = menos olvido.
- **Adapter LoRA**: solo entrenar el adapter, el base queda intacto.
- **Replay**: volver a entrenar en datos del preentrenamiento periódicamente.

> [!tip] Test de olvido
> El libro recomienda un test "anti-forget": mantener un dataset de capacidades generales y medir que **no caigan más de X%** después del fine-tune.

### Dataset prep

- **Tokenización correcta**: usar el mismo tokenizador que el modelo base.
- **Padding**: left-padding para inferencia, right-padding para entrenamiento.
- **Special tokens**: no añadir tokens nuevos sin reentrenar embeddings.
- **Sequence length**: adapta a la longitud real de tus datos, no a la máxima del modelo.

### Framework

- **Hugging Face Transformers + PEFT + TRL**: el stack estándar.
- **Axolotl**: configuración de fine-tuning simplificada.
- **LLaMA-Factory**: similar, popular para LLMs chinos.
- **Unsloth**: optimizaciones de velocidad, 2-5x más rápido.

> [!warning] La elección de framework importa menos que la de datos
> El libro es claro: **el 80% del éxito de un fine-tune está en los datos, no en el framework**. No pierdas semanas eligiendo framework; dedica ese tiempo a curar datos.

## Resumen en tres frases

- PEFT (LoRA, QLoRA) son las técnicas dominantes hoy: ajustan <1% de los parámetros pero ofrecen calidad comparable a full fine-tuning.
- Model merging permite combinar adapters y modelos sin reentrenar, abriendo combinaciones de capacidades que no existían antes.
- Las tácticas prácticas (LR, epochs, validación, gestión del olvido) son el "último 20%" que separa un fine-tune mediocre de uno excelente.

## Próximos pasos

- [[13-ingenieria-de-datos|Ingeniería de datos]]: la siguiente parada cubre algo más aburrido pero más decisivo. Los datos con los que fine-tuneas (o con los que haces cualquier cosa) determinan la calidad. Aquí aprendemos a curarlos, augmentarlos y procesarlos.
