---
title: AI Engineering
description: "Índice de la wiki de AI Engineering: construir aplicaciones con foundation models, basada en la estructura del libro de Chip Huyen (O'Reilly, 2024)"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, foundation-models, ai-engineering]
---

# AI Engineering

> [!abstract] Resumen
> Esta wiki toma como guía el índice de *AI Engineering: Building Applications with Foundation Models* (Chip Huyen, O'Reilly, primera edición de diciembre de 2024). Es uno de los manuales de referencia para construir productos reales sobre foundation models: cubre desde cómo elegir un caso de uso y planificar el proyecto, hasta prompt engineering, RAG, agentes, finetuning, ingeniería de datos, optimización de inferencia, arquitectura y feedback. El libro se centra en los **fundamentos** (qué problema resuelve cada técnica y cuándo usarla), no en un proveedor o framework concreto, así que sigue siendo útil aunque cambien las herramientas específicas.

## Acerca del libro

El libro arranca con una observación interesante: cuando apareció ChatGPT no sorprendió tanto la capacidad del modelo como la **explosión de aplicaciones** que esa capacidad desbloqueó. Construir productos sobre foundation models (LLMs y LMMs) pasó de ser un campo esotérico a un **toolkit de desarrollo** que cualquiera puede usar, incluso sin escribir una sola línea de código.

> [!note] AI Engineering ≠ ML Engineering
> Conviene distinguir desde el principio entre **ML engineering** (datos tabulares, feature engineering, entrenamiento de modelos clásicos) y **AI engineering** (prompt engineering, context construction, finetuning eficiente sobre foundation models). Las dos disciplinas comparten buenas prácticas (experimentación sistemática, evaluación rigurosa, optimización de latencia y coste), pero las técnicas concretas son distintas. Esta wiki se centra en AI engineering.

Chip Huyen, la autora, pasó dos años trabajando en el libro con más de 100 conversaciones con gente de OpenAI, Anthropic, Google, NVIDIA, Hugging Face, Meta, Anyscale, LangChain, LlamaIndex, etc. La prosa es muy práctica y está llena de frameworks de decisión: cuándo construir vs comprar, cuándo fine-tunear vs RAG, qué métrica mirar en cada momento.

## Cómo leer esta wiki

Las notas van en el orden del libro. Cada capítulo está partido en una o dos notas según la densidad del contenido:

- **Capítulos 1, 4, 8 y 9** → una sola nota (contenido cohesivo).
- **Capítulos 2, 3, 5, 6, 7 y 10** → dos notas por capítulo (split por bloque temático).

Cada nota sigue el mismo patrón: un `[!abstract]` arriba, contenido con H2/H3, callouts usados con propósito (`tip`, `warning`, `danger`, `question`, `example`, `note`, `info`), bloques de código y tablas cuando ayudan, y un `## Próximos pasos` al final enlazando a la siguiente nota.

## Fundamentos y panorama

- [[01-introduccion-a-ai-engineering|Introducción a AI Engineering]]: del lenguaje model al foundation model, casos de uso, planificación de aplicaciones y el stack de AI engineering.

## Cómo funcionan los foundation models

- [[02-datos-y-modelado-de-foundation-models|Datos y modelado de foundation models]]: datos de entrenamiento, arquitectura del transformer y cómo afecta el tamaño del modelo.
- [[03-post-training-y-muestreo|Post-training y muestreo]]: *supervised finetuning*, *preference finetuning*, estrategias de sampling, *test-time compute* y *structured outputs*.

## Evaluación

- [[04-metricas-de-evaluacion-de-lenguaje|Métricas de evaluación de lenguaje]]: entropía, cross-entropy, bits-per-character y perplexity como medidas intrínsecas.
- [[05-evaluacion-exacta-y-ai-as-judge|Evaluación exacta y AI as judge]]: corrección funcional, similaridad, embeddings, *LLM-as-a-judge* y evaluación comparativa.
- [[06-evaluacion-de-sistemas-de-ia|Evaluación de sistemas de IA]]: capacidades a medir, criterios de selección de modelo, *benchmarks* y diseño del pipeline de evaluación.

## Adaptar el modelo a tu problema

- [[07-prompt-engineering-fundamentos|Prompt engineering: fundamentos]]: *in-context learning*, system prompt, las 7 buenas prácticas y cómo iterar sobre prompts.
- [[08-prompt-engineering-defensivo|Prompt engineering defensivo]]: extracción de prompts, *jailbreaking*, *prompt injection* y defensas.
- [[09-rag-arquitectura-y-optimizacion|RAG: arquitectura y optimización]]: arquitectura, algoritmos de retrieval, optimización y RAG más allá de texto.
- [[10-agentes|Agentes]]: herramientas (*tools*), planificación, *failure modes*, memoria y evaluación de agentes.
- [[11-finetuning-decisiones-y-memoria|Finetuning: decisiones y memoria]]: cuándo fine-tunear, cuándo no, finetuning vs RAG, matemática de memoria y cuantización.
- [[12-tecnicas-de-finetuning|Técnicas de finetuning]]: *parameter-efficient finetuning* (PEFT), *model merging*, *multi-task finetuning* y tácticas prácticas.

## Datos

- [[13-ingenieria-de-datos|Ingeniería de datos]]: curación (calidad, cobertura, cantidad), *data augmentation*, síntesis con AI, *model distillation* y procesamiento.

## Producción

- [[14-fundamentos-y-optimizacion-de-inferencia|Fundamentos y optimización de inferencia]]: panorama de inferencia, métricas, AI accelerators, *model optimization* y *service optimization*.
- [[15-arquitectura-de-ai-engineering|Arquitectura de AI engineering]]: los 5 pasos para diseñar el sistema (context → guardrails → router → caches → agents), monitoring y orquestación.
- [[16-feedback-de-usuario|Feedback de usuario]]: extraer feedback conversacional, diseñar el loop de feedback y sus limitaciones.

## Cierre

- [[17-epilogo-y-claves|Epílogo y claves]]: cierre del libro y lecturas recomendadas para profundizar.

## Subtemas transversales

> [!tip] Tres ejes que reaparecen constantemente
> A lo largo de la práctica de AI engineering se repiten tres preguntas que vuelven una y otra vez a la hora de tomar decisiones:
> 1. **¿Vale la pena construir esto?** → casos de uso, expectativas, milestones (Ch.1).
> 2. **¿Cómo sé que mi sistema va mejor?** → evaluación (Ch.3, Ch.4).
> 3. **¿Cómo lo hago más rápido, más barato y más fiable?** → optimización de inferencia (Ch.9) y arquitectura (Ch.10).
>
> Si una decisión de diseño no mejora alguna de esas tres dimensiones, probablemente no merece la complejidad añadida.

## Próximos pasos

- [[01-introduccion-a-ai-engineering|Introducción a AI Engineering]]: por qué el campo se llama *AI engineering* y no *prompt engineering*, qué formas de construir aplicaciones hay hoy y cómo se eligen.
