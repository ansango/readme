---
title: Fundamentos y optimización de inferencia
description: "Cómo poner un modelo en producción: panorama de inferencia, métricas de rendimiento, AI accelerators, model optimization y service optimization"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, inference, optimization, gpu, latency, cost]
---

# Fundamentos y optimización de inferencia

> [!abstract] Resumen
> Esta nota cubre el capítulo 9 completo: la fase de **inferencia**, donde el modelo ya entrenado recibe peticiones en producción y genera respuestas. Vemos qué es la inferencia, las métricas que importan (latencia, throughput, coste), los AI accelerators (GPU, TPU, ASIC), las técnicas de **model optimization** (cuantización, pruning, distillation, Flash Attention) y las de **service optimization** (batching, caching, speculative decoding, paralelización). El libro es claro: la optimización de inferencia es donde se decide si tu producto es viable económicamente.

## Por qué la inferencia importa

El libro abre el capítulo con un dato contundente: **la inferencia es la mayor parte del coste** de una aplicación de IA. Mientras que entrenar un modelo es un gasto único (y enorme), servirlo cuesta **por cada llamada, todos los días, durante años**. Una mala optimización de inferencia puede hundir un negocio con buen modelo.

> [!quote] "El entrenamiento es la inversión inicial. La inferencia es la hipoteca."
> La inferencia es lo que pagas recurrentemente, así que optimizarla tiene impacto directo en el modelo económico.

## Understanding inference

### Qué es la inferencia

Inferencia es el proceso de **usar un modelo entrenado para generar outputs** a partir de inputs nuevos. En LLMs, típicamente:

1. **Prefill**: el modelo procesa el prompt completo en paralelo, calcula KV cache.
2. **Decode**: el modelo genera tokens uno a uno, cada uno condicional al anterior.

Estas dos fases tienen **características muy distintas**:

- **Prefill**: compute-bound, paralelizable, GPU-saturating.
- **Decode**: memory-bound, secuencial, limitado por bandwidth.

### Inference overview

El libro describe tres modos principales de servir un modelo:

#### Online inference

Responde a peticiones en tiempo real con baja latencia. El caso típico de chatbots y APIs.

#### Batch inference

Procesa grandes volúmenes de peticiones en grupos. Acepta latencia mayor (minutos-horas) a cambio de mayor throughput.

#### Streaming inference

Responde con tokens a medida que se generan. Reduce el **time-to-first-token** percibido por el usuario.

### Métricas clave

#### Latencia

- **Time-to-first-token (TTFT)**: tiempo hasta el primer token. Crítico para perceived responsiveness.
- **Time-per-output-token (TPOT)**: tiempo medio entre tokens generados. Importante para la "fluidez" de la respuesta.
- **Latencia total**: tiempo total de la request. Es la suma de TTFT + TPOT × tokens_generados.

> [!note] Siempre mide p95, no la media
> La latencia mediana engaña. Un p95 de 5 segundos es una mala experiencia para el 5% de tus usuarios. Mide p50, p95, p99 y pon alertas en los dos últimos.

#### Throughput

- **Tokens per second (TPS)**: cuántos tokens genera el sistema por segundo.
- **Requests per second (RPS)**: cuántas peticiones maneja por segundo.
- **Tokens per second per user**: la métrica que importa al usuario.

#### Coste

- **Coste por millón de tokens**: el "precio de lista".
- **Coste por request**: el coste real, depende de longitud de input y output.
- **Coste por usuario activo**: lo que importa al negocio.

#### Calidad

Aunque no es métrica de **infraestructura**, hay que medirla en inferencia:

- **% de respuestas que pasan quality bar**.
- **% de alucinaciones**.
- **% de respuestas que cumplen formato**.

> [!warning] Trade-off latencia vs throughput
> Batching más grande = más throughput, peor latencia. Batching más pequeño = menos throughput, mejor latencia. El batch size óptimo depende del caso de uso.

## AI accelerators

El hardware que ejecuta la inferencia determina el techo de rendimiento.

### CPU

- **Ventajas**: barato, disponible, bajo consumo.
- **Limitaciones**: compute limitado. Solo viable para modelos muy pequeños (<1B) o casos de ultra-bajo throughput.

### GPU

El estándar para inferencia de LLMs.

- **NVIDIA H100**: el más potente en 2024. 80 GB HBM3, ideal para modelos grandes.
- **NVIDIA A100**: 40/80 GB, sigue siendo excelente.
- **NVIDIA L4**: eficiente en consumo, ideal para edge.
- **NVIDIA RTX 4090**: potente para inferencia local con modelos pequeños.

### TPU

- **Google TPU v5**: optimizado para Gemini y modelos entrenados en JAX.
- **Ventajas**: excelente para training, inferencia razonable.
- **Limitaciones**: solo disponible en Google Cloud.

### ASIC especializados

- **Groq LPU**: latencia ultra-baja gracias a arquitectura determinista.
- **Cerebras**: chips de gran tamaño para modelos enormes.
- **SambaNova**: dataflow architecture.
- **AWS Inferentia / Trainium**: optimizados para AWS.

### Apple Silicon

- **M1/M2/M3**: UNIFIED memory permite correr modelos más grandes que la VRAM.
- **MLX framework**: optimizado para Apple Silicon.
- **Ollama**: interfaz sencilla para correr LLMs en Mac.

### Cómo elegir

| Caso | Hardware recomendado |
|---|---|
| Experimentación local | Apple Silicon, RTX 4090 |
| Inferencia pequeña-media | A100, L4 |
| Inferencia alta escala | H100, A100 cluster |
| Latencia ultra-baja | Groq, Inferentia |
| Cloud-native | TPU en GCP, Inferentia en AWS |

## Model optimization

Técnicas que reducen el **coste del modelo en sí**: tamaño, memoria, tiempo de inferencia.

### Cuantización

La técnica más efectiva. Reduce los bits por peso de 16 a 8 o 4.

#### Trade-offs

- **INT8**: 2x reducción de memoria, casi sin pérdida de calidad.
- **INT4**: 4x reducción, pérdida mínima de calidad en la mayoría de casos.
- **INT2**: 8x reducción, calidad degradada, investigación.

#### Frameworks de cuantización

- **bitsandbytes**: NF4, INT8, INT4. Ideal para QLoRA.
- **GPTQ**: post-training quantization rápido.
- **AWQ**:Activation-aware Weight Quantization.
- **GGUF**: formato de llama.cpp, ideal para inferencia local.
- **SmoothQuant**: cuantización INT8 con poca pérdida.

### Pruning

Eliminar pesos que contribuyen poco, "podando" la red.

- **Magnitude pruning**: quitar pesos pequeños.
- **Structured pruning**: quitar capas enteras o cabezas de atención.
- **Unstructured pruning**: quitar pesos individuales (más fino, más complejo).

### Distillation

Entrenar un modelo pequeño para imitar a uno grande.

- **Knowledge distillation**: el estudiante aprende las **probabilidades** del profesor, no solo los outputs.
- **Task-specific distillation**: el estudiante aprende solo la tarea concreta.
- **Dataset distillation**: comprimir el dataset, no el modelo.

> [!tip] Distillation vs quantization
> Son ortogonales. Un modelo puede estar cuantizado Y destilado. La combinación típica es: destilar a un modelo más pequeño, después cuantizar, y obtener reducciones de 10-30x con calidad razonable.

### Flash Attention

Optimización algorítmica que reduce el **uso de memoria** y **acelera** el cómputo de la atención.

- **Standard attention**: O(N²) memoria.
- **Flash attention**: O(N) memoria con técnicas de tiling.

Soporte nativo en PyTorch 2.0+, cada vez más el estándar.

### KV cache optimization

El KV cache (que almacena claves y valores pasados) crece linealmente con la longitud del contexto. Optimizaciones:

- **Multi-query attention (MQA)**: comparte K y V entre heads.
- **Grouped-query attention (GQA)**: compromiso entre MHA y MQA.
- **PagedAttention** (vLLM): gestiona KV cache como páginas, evita fragmentación.

### Speculative decoding

Usar un modelo **pequeño y rápido** para proponer tokens, y un modelo **grande y preciso** para verificarlos.

- **Pros**: acelera 2-3x la generación.
- **Cons**: más complejo, requiere dos modelos.

```python
# Pseudo-código
def speculative_decoding(prompt, draft_model, main_model, k=4):
    while not done:
        # Draft model propone k tokens
        draft_tokens = draft_model.generate(prompt, k=k)
        
        # Main model verifica los k tokens en paralelo
        main_logits = main_model.score(prompt + draft_tokens)
        
        # Aceptar los tokens correctos, rechazar los incorrectos
        accepted = verify(draft_tokens, main_logits)
        prompt += accepted
```

## Inference service optimization

Técnicas que optimizan **cómo se sirve** el modelo, no el modelo en sí.

### Batching

Agrupar varias peticiones en un solo forward pass.

#### Static batching

Tamaño fijo de batch. Simple pero ineficiente.

#### Dynamic batching

Tamaño variable, ajustándose a la carga. Más complejo pero mejor.

#### Continuous batching (in-flight batching)

Cada vez que un request termina, se añade uno nuevo al batch. Utilización mucho mayor.

### Caching

Cachear resultados para evitar recomputación.

#### Prompt caching

Si dos requests tienen prompts idénticos (mismo system prompt + context), cachear el KV cache.

#### Response caching

Si dos requests producen la misma respuesta, cachear directamente.

#### Semantic caching

Cachear por **similitud semántica** del prompt. Dos prompts parecidos comparten cache.

```python
import hashlib

def semantic_cache_lookup(query, cache):
    query_embedding = embed(query)
    for cached_query, cached_response in cache:
        if cosine_sim(query_embedding, cached_query) > 0.95:
            return cached_response
    return None
```

### Paralelización

Para servir modelos muy grandes, distribuir entre GPUs.

#### Tensor parallelism

Particionar los pesos del modelo entre GPUs. Cada GPU tiene una parte.

#### Pipeline parallelism

Capas consecutivas en GPUs distintas. Pipeline de procesamiento.

#### Sequence parallelism

Particionar la dimensión de secuencia entre GPUs.

#### Expert parallelism (Mixture of Experts)

Solo las GPUs con los expertos activos para un token concreto participan.

### Frameworks de serving

- **vLLM**: el más popular para serving online, PagedAttention.
- **TGI** (Text Generation Inference): de Hugging Face.
- **TensorRT-LLM**: optimizaciones de NVIDIA.
- **LMDeploy**: framework chino optimizado.
- **SGLang**: serving con primitivas estructuradas.
- **Triton Inference Server**: serving genérico de NVIDIA.

### Choosing batch size

El batch size óptimo depende del caso:

- **Online baja latencia**: batch 1-4.
- **Online buen throughput**: batch 8-32.
- **Batch offline**: batch 64-256+.

```python
# Configuración típica de vLLM
engine_args = {
    "model": "model_name",
    "tensor_parallel_size": 4,  # 4 GPUs
    "max_num_seqs": 256,        # batch máximo
    "max_model_len": 8192,
    "gpu_memory_utilization": 0.9,
}
```

## Cuantificación de la mejora

El libro insiste en que **cada técnica tiene su coste y su beneficio**:

| Técnica | Mejora típica | Cuándo aplicar |
|---|---|---|
| INT8 quantization | 2x memory, 1.5x speed | Default para modelos grandes |
| INT4 quantization | 4x memory, 2x speed | Hardware moderno, modelos robustos |
| Flash Attention | 2-4x speed | Hardware Ampere+ |
| PagedAttention | 2-4x throughput | Online serving |
| Continuous batching | 2-10x throughput | Online serving |
| Speculative decoding | 2-3x speed | Tienes un modelo pequeño bueno |
| KV cache optimization | 1.5-2x speed | Contextos largos |
| Tensor parallelism | Nx memoria | Modelos más grandes que una GPU |

> [!tip] Optimiza de fuera hacia adentro
> El libro recomienda empezar por las optimizaciones con mejor ratio: continuous batching, Flash Attention, INT8 quantization. Solo después baja a técnicas más quirúrgicas.

## Coste por inferencia

El cálculo económico es simple una vez tienes los números:

```
Coste total = (precio_por_hora_gpu × horas_usadas) /
              (tokens_generados_por_hora)
```

#### Ejemplo

- 1 H100: $3/hora.
- Genera 50.000 tokens/hora.
- Coste: 0.00006 $/token.
- A 1000 tokens de output por request: $0.06 por request.
- A 1M requests/mes: $60.000/mes.

Para reducir coste:

- **Modelos más pequeños** (destilación).
- **Cuantización agresiva**.
- **Batching más grande**.
- **Caching**.
- **Hardware más eficiente** (Groq, Inferentia).

## Resumen en tres frases

- La inferencia es donde se decide la viabilidad económica de un producto de IA: optimizar inferencia es optimizar el modelo de negocio.
- Las optimizaciones se dividen en model optimization (cuantización, pruning, distillation) y service optimization (batching, caching, paralelización).
- Las técnicas modernas (continuous batching, PagedAttention, Flash Attention, speculative decoding) permiten mejoras de 5-10x combinadas, siendo la diferencia entre un producto viable y uno que no lo es.

## Próximos pasos

- [[15-arquitectura-de-ai-engineering|Arquitectura de AI engineering]]: subimos a la capa de sistema. Los 5 pasos para diseñar la arquitectura de un producto de IA, monitoring, observabilidad y orquestación.
