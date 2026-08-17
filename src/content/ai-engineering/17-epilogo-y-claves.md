---
title: Epílogo y claves
description: "Cierre del libro AI Engineering de Chip Huyen: las ideas recurrentes, las claves para el AI engineer en 2024-2025, y lecturas recomendadas para profundizar"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, ai-engineering, summary, further-reading]
---

# Epílogo y claves

> [!abstract] Resumen
> Esta nota cierra la wiki. El epílogo del libro es breve (dos páginas), así que la aprovechamos para destilar las **ideas recurrentes** que aparecen a lo largo de la disciplina, las **claves prácticas** que distinguen a un buen AI engineer y un **plan de lecturas** para profundizar en cada una de las áreas tratadas.

## El epílogo del libro

En dos páginas, Chip Huyen cierra con una nota que es casi una declaración de principios:

> La AI engineering es una disciplina nueva. Las técnicas específicas cambiarán, los modelos y proveedores también, pero los fundamentos (cómo evaluar, cómo adaptarse, cómo iterar, cómo defender) permanecerán.

El propio epílogo recalca que se ha procurado **no casarse con un proveedor o framework**. Las técnicas cambian cada pocos meses; los principios permanecen.

> [!quote] "Dentro de dos años, quién sabe qué modelo dominará. Pero quien haya dominado los principios de esta disciplina podrá cambiar con el campo."
> Esta frase merece quedarse como recordatorio.

## Las ideas recurrentes

Después de recorrer las notas anteriores, hay una decena de ideas que se repiten una y otra vez. Las recopilo aquí como referencia rápida.

### 1. La calidad viene de los datos, no del modelo

[[13-ingenieria-de-datos|Ingeniería de datos]] es la nota más larga por algo. El 80% del trabajo de un AI engineer es ingeniería de datos.

### 2. Empieza simple, escala solo si hace falta

La jerarquía es:
1. Prompt engineering.
2. RAG.
3. Fine-tuning.
4. Entrenar propio.

Salta al siguiente nivel solo cuando el actual se ha quedado corto.

### 3. Mide siempre

Sin métricas, no sabes si mejoras. Tu propio dataset de evaluación es el activo más importante.

### 4. Lazy loading de complejidad

[[15-arquitectura-de-ai-engineering|Arquitectura]]: añade guardrails, routers, caches, agentes **a medida que los necesites**, no por adelantado.

### 5. La seguridad es sistémica, no del modelo

El modelo no puede ser el único punto de control. Acciones críticas requieren humanos en el loop.

### 6. Coste y latencia importan desde el día uno

La inferencia es la hipoteca. Optimízala pronto o tu negocio no escala.

### 7. El feedback cierra el loop

[[16-feedback-de-usuario|Feedback de usuario]]: sin él, no aprendes.

### 8. Versionar todo

Prompts, datasets, evaluación, modelos. Todo es código.

### 9. Empty commit ≠ garbage in

Los outputs del modelo son probabilísticos. Diseña para la variabilidad.

### 10. El humano en el loop

Para cualquier cosa que importe, **un humano debe aprobar**. El modelo propone, el humano dispone.

## Claves prácticas por área

### Para ser mejor en prompting

- [[07-prompt-engineering-fundamentos|Prompt engineering fundamentos]]: las 7 buenas prácticas.
- [[08-prompt-engineering-defensivo|Prompt engineering defensivo]]: cómo no caer en los ataques más comunes.
- Iterar con tu propio dataset de evaluación.

### Para ser mejor en RAG

- [[09-rag-arquitectura-y-optimizacion|RAG]]: hybrid retrieval + reranker es el patrón ganador.
- Cuidar el chunking: tamaño, overlap, semántica.
- Query rewriting cuando la query del usuario es mala.

### Para ser mejor en agentes

- [[10-agentes|Agentes]]: tools atómicas, bien documentadas, con output estructurado.
- Presets de fallo definidos: qué hacer si la tool falla, si el agente entra en loop, si excede presupuesto.
- Humanos en el loop para todas las acciones no triviales.

### Para ser mejor en fine-tuning

- [[11-finetuning-decisiones-y-memoria|Decisiones]]: cuándo fine-tunear, cuándo no.
- [[12-tecnicas-de-finetuning|Técnicas]]: QLoRA como punto de partida.
- LoRA + multi-task + merge es la combinación más flexible.

### Para ser mejor en datos

- [[13-ingenieria-de-datos|Engineering de datos]]: calidad > cantidad, deduplicación > adición, sintéticos validados.
- Datasets como artefactos de primera clase.

### Para ser mejor en producción

- [[14-fundamentos-y-optimizacion-de-inferencia|Inferencia]]: cuantización, batching, caching, speculative decoding.
- [[15-arquitectura-de-ai-engineering|Arquitectura]]: 5 pasos, monitoring desde el día uno.
- [[16-feedback-de-usuario|Feedback]]: explícito, implícito, conversacional, de sistema.

## Checklist de un AI engineer en 2024-2025

Antes de empezar un proyecto o unirte a un equipo, verifica que cubres estas bases:

- [ ] Tengo un **problema concreto** que un foundation model puede resolver mejor que las alternativas.
- [ ] Tengo **métricas** definidas para medir si el sistema va bien.
- [ ] Tengo un **dataset de evaluación** propio (no solo benchmarks públicos).
- [ ] Empiezo con **prompt engineering** y solo escalo a RAG/FT si hace falta.
- [ ] Tengo **guardrails** desde el día uno (input validation, output filtering).
- [ ] Mido **latencia p95** y **coste por request** desde el primer deploy.
- [ ] Tengo **logging** completo de requests y responses.
- [ ] Tengo **tests automatizados** que corren con cada cambio.
- [ ] Tengo un **runbook** para cuando algo falla en producción.
- [ ] Tengo un **plan de feedback** que captura experiencias de los usuarios.

## Recursos recomendados

El libro no cita muchos recursos explícitamente, pero hay un cuerpo de conocimiento asociado a cada tema. Aquí algunos puntos de partida por área.

### Para foundation models

- **Papers**: "Attention is All You Need" (Vaswani et al., 2017), "Scaling Laws for Neural Language Models" (Kaplan et al., 2020), "Chinchilla" (Hoffmann et al., 2022).
- **Cursos**: Stanford CS25, Hugging Face NLP course.
- **Libros**: "Designing Machine Learning Systems" (Huyen, O'Reilly) — el libro anterior de la autora.

### Para prompt engineering

- **Papers**: "Chain-of-Thought Prompting" (Wei et al., 2022), "Self-Consistency" (Wang et al., 2022).
- **Documentación**: Anthropic prompt engineering guide, OpenAI prompt engineering guide.
- **Repos**: DSPy, PromptFoo.

### Para RAG

- **Papers**: "REALM", "Retrieval-Augmented Generation for Large Language Models" (Lewis et al., 2020).
- **Repos**: LangChain, LlamaIndex, sentence-transformers.
- **Cursos**: DeepLearning.AI RAG course.

### Para agentes

- **Papers**: "ReAct", "Tree of Thoughts", "Reflexion".
- **Repos**: LangGraph, Autogen, CrewAI.
- **Libros**: aún no hay un libro de referencia definitivo; el campo es muy joven.

### Para fine-tuning

- **Papers**: "LoRA" (Hu et al., 2021), "QLoRA" (Dettmers et al., 2023), "DPO" (Rafailov et al., 2023).
- **Repos**: PEFT, TRL, Axolotl, Unsloth.
- **Cursos**: Hugging Face PEFT course.

### Para inferencia

- **Papers**: "Flash Attention" (Dao et al., 2022), "PagedAttention" (Kwon et al., 2023).
- **Repos**: vLLM, TGI, llama.cpp.
- **Documentación**: NVIDIA TensorRT-LLM docs.

### Para evaluación

- **Papers**: "TruthfulQA", "MMLU", "AlpacaEval", "MT-Bench".
- **Plataformas**: LMSYS Chatbot Arena, Hugging Face Open LLM Leaderboard.
- **Repos**: PromptFoo, LangSmith.

### Para seguridad

- **Papers**: "Prompt Injection" (Greshake et al., 2023), "Jailbreak" (Wei et al., 2023).
- **Repos**: Garak, PyRIT.

### Para arquitectura

- **Repos**: Portkey, OpenRouter, Langfuse, Helicone.
- **Libros**: "Designing Data-Intensive Applications" (Kleppmann, O'Reilly) para los fundamentos de sistemas distribuidos.

## Otros libros del campo

- **"Designing Machine Learning Systems"** — Chip Huyen (O'Reilly, 2022). La precuela natural de este libro. Cubre ML clásico pero los principios de evaluación, monitoreo y feedback siguen aplicando.
- **"Hands-On Large Language Models"** — Jay Alammar & Maarten Grootendorst (O'Reilly, 2024). Más visual y práctico, ideal para empezar.
- **"The Transformer Blueprint"** — Various. Para profundizar en arquitectura.
- **"Build a Large Language Model (From Scratch)"** — Sebastian Raschka (2024). Para entender LLMs desde dentro.

## La promesa de la disciplina

Si hay una frase que resume todo lo recogido en estas notas, es esta:

> [!quote] "AI engineering es, ante todo, ingeniería. Las técnicas específicas se quedan obsoletas; los hábitos de experimentación, evaluación rigurosa, diseño iterativo y feedback continuo no."

Si esta wiki te ha servido, vuelve a ella cuando:
- Vayas a empezar un nuevo proyecto de IA.
- Te enfrentes a un fallo que no entiendes.
- Quieras decidir entre prompt engineering, RAG o fine-tuning.
- Tu modelo cambie de versión y todo se rompa.
- Necesites explicar a un stakeholder qué es AI engineering.

## Próximos pasos

Con esta wiki completa, las direcciones naturales desde aquí son:

- **Aplicar** estas ideas a un proyecto real, empezando simple.
- **Profundizar** en el área que más te interese usando los recursos de la sección anterior.
- **Medir** tus propios sistemas siguiendo los frameworks de evaluación.
- **Iterar** con un loop de feedback explícito.

Y, sobre todo: **la mejor forma de aprender AI engineering es construyendo**. Leer es el primer paso; construir es el camino.
