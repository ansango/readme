---
title: "Finetuning: decisiones y memoria"
description: "Cuándo fine-tunear un modelo y cuándo no, comparación con RAG, los cuellos de botella de memoria y la matemática que necesitas entender"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, llm, fine-tuning, gpu, memory, quantization]
---

# Finetuning: decisiones y memoria

> [!abstract] Resumen
> Esta nota cubre la primera mitad del capítulo 7: la decisión de **cuándo fine-tunear** un modelo y cuándo no, cómo se compara con RAG, los **cuellos de botella de memoria** que hacen que fine-tunear sea caro y complejo, la matemática que los explica (backpropagation, tamaños de peso, cuantización) y por qué eso determina todo el diseño de las técnicas de fine-tuning. La segunda mitad (técnicas concretas: PEFT, LoRA, model merging) está en [[12-tecnicas-de-finetuning|Técnicas de finetuning]].

## El lugar del fine-tuning en la cascada

El libro insiste en una jerarquía clara de técnicas de adaptación, **de menos a más costosa**:

1. **Prompt engineering**: gratis, inmediato.
2. **RAG**: low-cost, requiere datos.
3. **Fine-tuning**: medio-alto coste, requiere datos etiquetados y GPUs.
4. **Entrenar desde cero**: altísimo coste, requiere dataset masivo y equipo.

> [!quote] "El 90% de las veces que alguien dice 'necesito fine-tunear', la respuesta real es 'necesito un mejor prompt o un mejor RAG'."
> El libro repite esto porque la tentación de saltar a fine-tuning es constante y casi siempre equivocada.

## Cuándo fine-tunear

El libro da **razones legítimas** para fine-tunear:

### 1. Estilo y tono específicos

Si necesitas que el modelo siempre responda en un estilo muy concreto (formato, vocabulario, nivel de formalidad) que el prompting no logra fijar, fine-tuning ayuda.

### 2. Comportamientos complejos

Si necesitas que el modelo **siga un flujo específico** de pasos o use herramientas de formas concretas que el prompting no controla, fine-tuning puede enseñar el patrón.

### 3. Reducir latencia y coste

Un modelo más pequeño fine-tuneado para tu caso puede reemplazar a un modelo grande genérico, con menor latencia y menor coste.

### 4. Datos propietarios

Si tienes datos muy valiosos y quieres "destilarlos" en un modelo más pequeño, fine-tuning es el camino.

### 5. Mejoras incrementales

Después de que prompt engineering y RAG se han estabilizado, fine-tuning puede dar un salto del 5-15% en métricas específicas.

## Cuándo NO fine-tunear

El libro lista **anti-patrones** frecuentes:

### ❌ Creer que fine-tuning añade conocimiento

Si el modelo no sabe algo, fine-tuning no lo va a saber mágicamente. Fine-tuning enseña **comportamiento**, no conocimiento. Si necesitas inyectar conocimiento, usa RAG.

> [!example] Caso real
> Una empresa intentó fine-tunear un modelo con su documentación interna para que "supiera" sobre sus productos. Resultado: el modelo alucinaba con más confianza. La solución correcta: RAG sobre la documentación.

### ❌ Fine-tunear con pocos datos

Con **menos de 1000 ejemplos** de calidad, fine-tuning raramente vale la pena. Tu tiempo se gasta en datos, no en entrenamiento.

### ❌ Fine-tunear sin un pipeline de evaluación

Fine-tuning sin manera de medir el antes/después es tirar dinero. Antes de empezar, necesitas tu dataset de evaluación.

### ❌ Fine-tunear porque "es lo que hace la competencia"

Presión social no es una razón técnica. Si tu problema está resuelto con prompt + RAG, quédate ahí.

### ❌ Fine-tunear un modelo recién sacado

Espera unos meses a que la comunidad Identifique bugs y mejores prácticas. Fine-tuning sobre un modelo inmaduro es construir sobre arena.

## Fine-tuning vs RAG

El libro dedica tiempo a esta comparación porque es la decisión más recurrente.

| Dimensión | RAG | Fine-tuning |
|---|---|---|
| **Coste inicial** | Bajo | Alto |
| **Latencia** | +200-500ms | Sin overhead |
| **Conocimiento actualizado** | Automático | Requiere reentrenar |
| **Estilo de comportamiento** | Limitado | Excelente |
| **Datos privados** | Permanece en tu infra | Puede salir (cuidado) |
| **Reproducibilidad** | Total | Necesita versionar el modelo |
| **Debugging** | Inspeccionable | Caja negra |

### Cuándo RAG

- El conocimiento cambia con frecuencia.
- El corpus es grande y diverso.
- No tienes acceso a GPUs.
- Necesitas citaciones y trazabilidad.

### Cuándo fine-tuning

- El comportamiento es lo que importa, no el conocimiento.
- Necesitas bajas latencia y bajo coste.
- El estilo es muy específico.
- Ya has exprimido RAG y necesitas más.

### Lo mejor de ambos mundos

Muchos sistemas en producción usan **RAG + fine-tuning**:

1. RAG para aportar conocimiento actualizado.
2. Fine-tuning para fijar estilo y comportamiento.

> [!tip] La pirámide del AI engineer
> El libro lo resume con una imagen potente: en la base está prompt engineering, luego RAG, luego fine-tuning. Solo subes de nivel cuando el actual no llega a la métrica objetivo.

## Memory bottlenecks

El libro abre la segunda mitad del capítulo con la matemática de memoria del fine-tuning, porque es lo que determina **qué técnicas son posibles**.

### Por qué fine-tuning es caro de memoria

Fine-tuning un LLM requiere **cuatro tipos de memoria** en GPU:

1. **Pesos del modelo**: los parámetros que se cargan en VRAM.
2. **Gradientes**: lo que calcula backpropagation (un tensor del tamaño de los pesos).
3. **Optimizador**: estado adicional del optimizador (Adam requiere 2x el tamaño de los pesos).
4. **Activaciones**: los outputs intermedios de cada capa durante el forward pass.

### Cálculo de memoria

Para un modelo con **N parámetros**:

| Componente | Memoria (FP32) | Memoria (FP16) |
|---|---|---|
| Pesos | 4N bytes | 2N bytes |
| Gradientes | 4N bytes | 2N bytes |
| Optimizador (Adam) | 8N bytes | 4N bytes |
| **Total (sin activaciones)** | **16N bytes** | **8N bytes** |

> [!example] Modelo de 7B parámetros
> Memoria para fine-tuning en FP16: 8 × 7B = 56 GB. Solo los pesos, gradientes y optimizador. Sin contar activaciones.
> Resultado: necesitas al menos 2 GPUs A100 (80 GB cada una) o 1 H100.

### Por qué esto importa

La memoria limita **qué modelos puedes fine-tunear**:

- **7B**: GPUs tope de gama (A100, H100).
- **13B**: necesitas multi-GPU.
- **70B+**: clusters de GPUs, optimizaciones obligatorias.

> [!warning] VRAM no es opcional
> Si tu modelo no cabe en VRAM, no puedes fine-tunear. Punto. Las técnicas que se ven en la próxima nota (LoRA, cuantización) son, en esencia, **trucos para reducir estas cuatro cifras**.

## Backpropagation y parámetros entrenables

El libro explica por qué algunos parámetros son más "entrenables" que otros.

### Cómo funciona backpropagation

1. Forward pass: input → modelo → output → loss.
2. Backward pass: del loss hacia atrás, calcular el gradiente de cada peso con respecto al loss.
3. Optimizer step: actualizar cada peso con su gradiente.

### Qué hace Adam (el optimizador por defecto)

Adam mantiene **dos estados adicionales por cada peso**:

- El primer momento (media móvil de gradientes).
- El segundo momento (media móvil de gradientes al cuadrado).

Por eso Adam requiere 8N bytes (2 estados × 4 bytes por estado × N parámetros).

### Optim memory-efficient (Adafactor, etc.)

Optimizadores como Adafactor o Lion reducen el estado del optimizador, pero a costa de convergencia más sensible.

## Representaciones numéricas

La precisión numérica afecta dramáticamente a la memoria.

### FP32 (32 bits)

Precisión completa. 4 bytes por peso. Estándar histórico.

### FP16 (16 bits)

Media precisión. 2 bytes por peso. Permite entrenar el doble de parámetros en la misma VRAM. Riesgo: underflow/overflow en gradientes muy pequeños.

### BF16 (Brain Floating Point)

Como FP16 pero con más rango en el exponente. **El estándar actual para fine-tuning**. Sin apenas pérdida de calidad frente a FP32.

### INT8 (8 bits)

Enteros de 8 bits. 1 byte por peso. Se usa para **inferencia**, no para entrenamiento (los gradientes necesitan más precisión).

### INT4 (4 bits)

Cuartos de byte. Medio byte por peso. Para inferencia con cuantización agresiva.

## Cuantización

La cuantización es la técnica que reduce la memoria convirtiendo pesos de precisión alta a baja.

### Por qué funciona

Los pesos de un modelo entrenado **no necesitan 16 bits para almacenar información útil**. Distribución de pesos es aproximadamente normal con valores típicos en un rango estrecho. 4 bits capturan lo esencial.

### Tipos de cuantización

#### Post-training quantization (PTQ)

Cuantizar **después** del entrenamiento, sin más datos.

- **Pros**: barato, rápido.
- **Cons**: pequeña pérdida de calidad.

#### Quantization-aware training (QAT)

Entrenar **con la cuantización en mente**, simulándola durante el forward pass.

- **Pros**: casi sin pérdida de calidad.
- **Cons**: costoso, requiere entrenamiento completo.

#### GPTQ, AWQ, GGUF

Algoritmos populares de cuantización optimizados:

- **GPTQ**: basado en segunda derivada, muy rápido.
- **AWQ**: protege los "salient weights" identificados por activación.
- **GGUF**: formato de llama.cpp, ideal para inferencia local.

### Bitsandbytes

La librería más usada para cuantización en entrenamiento:

```python
from transformers import AutoModelForCausalLM
from bitsandbytes.optim import AdamW8bit

model = AutoModelForCausalLM.from_pretrained(
    "model_name",
    load_in_4bit=True,  # cuantizar a INT4 al cargar
    device_map="auto"
)

optimizer = AdamW8bit(model.parameters())  # optimizador de 8 bits
```

## Zero-redundancy optimizer (ZeRO)

DeepSpeed ZeRO parte el estado del optimizador, gradientes y pesos entre múltiples GPUs:

- **ZeRO-1**: solo estado del optimizador partido.
- **ZeRO-2**: + gradientes partidos.
- **ZeRO-3**: + pesos partidos.

Permite entrenar modelos más grandes en clusters de GPUs.

## Mixed precision training

Técnica estándar: usar **FP16/BF16 para el forward pass y FP32 para los gradientes** (master weights).

```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()
for batch in dataloader:
    optimizer.zero_grad()
    with autocast(dtype=torch.bfloat16):
        loss = model(batch)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

> [!tip] BF16 > FP16 para entrenamiento
> Si tu hardware lo soporta (Ampere+, TPU v3+), **BF16 es casi siempre mejor que FP16** para fine-tuning. Más rango, menos problemas, misma velocidad.

## Gradient checkpointing

Para reducir el consumo de activaciones (que pueden ser mayores que los pesos), **no guardar todas las activaciones**, recalcularlas en el backward pass.

- **Pros**: reduce VRAM dramáticamente.
- **Cons**: entrenamiento más lento (recomputación).

```python
model.gradient_checkpointing_enable()
```

## Resumen en tres frases

- Fine-tuning es la tercera palanca de adaptación, y solo se justifica cuando prompt engineering y RAG no dan la calidad objetivo.
- La VRAM es el cuello de botella: pesos + gradientes + optimizador + activaciones rápidamente exceden las GPUs más caras.
- Las técnicas que aborda la próxima nota (LoRA, adapters, model merging) son esencialmente **trucos para reducir alguna de esas cuatro cifras**.

## Próximos pasos

- [[12-tecnicas-de-finetuning|Técnicas de finetuning]]: el arsenal de trucos que la industria ha desarrollado para hacer fine-tuning viable en hardware modesto: PEFT, LoRA, adapters, model merging y tácticas prácticas.
