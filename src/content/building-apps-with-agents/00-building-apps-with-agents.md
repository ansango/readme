---
title: "Building Applications with AI Agents : de prototipo a producción"
description: "Wiki estructurada del libro de Michael Albada sobre sistemas agenticos: introducción, diseño, UX, herramientas, orquestación, memoria, aprendizaje, multi-agente, validación, monitoreo, mejora continua, seguridad y colaboración humano-agente"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, wiki, libro, mcp, rsc, observability]
---

# Building Applications with AI Agents

> [!abstract] Resumen
> Wiki del libro *Building Applications with AI Agents* de Michael Albada (O'Reilly, fines de 2025). El libro **no enseña qué es un LLM**, sino **cómo diseñar, construir y operar sistemas agenticos en producción**: cómo combinar herramientas, memoria, conocimiento y modelos, qué patrones de orquestación y arquitectura multi-agente usar, cómo evaluarlos y monitorizarlos con rigurosidad, cómo defenderlos frente a riesgos únicos, y qué marco humano-organizativo necesita un sistema agenticos para escalar. La lectura sigue un orden lineal pero los bloques temáticos se pueden abordar de forma semi-independiente una vez se dominan los fundamentos de [[01-introduccion-a-los-agentes]] y [[02-diseno-de-sistemas-de-agentes]].

## Origen y propósito

El libro parte de una observación: la IA generativa ha acelerado el paso de concepto a prototipo a solución, pero **desplegar agentes sigue siendo un reto para la mayoría de organizaciones**. La salida a producción demanda planificación, drafting y revising — un rigor similar al de cualquier sistema distribuido, con problemas nuevos (no determinismo, confianza, observabilidad) encima. La tesis del libro: **los agentes son un patrón de diseño, no un truco**. Y los patrones de diseño se enseñan.

> [!quote] Descripción editorial (O'Reilly)
> "Hemos visto surgir un nuevo patrón de diseño: los agentes AI. Combinando herramientas, conocimiento, memoria y aprendizaje con modelos fundacionales avanzados, ahora podemos secuenciar múltiples inferencias para resolver problemas ambiguos y difíciles."

## Cómo leer esta wiki

El libro sigue un orden pedagógico: primero la motivación y los conceptos básicos, después el diseño y la interacción, luego memoria y aprendizaje, multi-agente, y finalmente operación y mejora. La wiki mantiene ese orden con un split natural en Chapter 8 (multi-agente).

```text
   Fundamentos            →  01 Introducción + 02 Diseño
   Diseño e interacción   →  03 UX + 04 Herramientas + 05 Orquestación
   Memoria y aprendizaje  →  06 Conocimiento + 07 Aprendizaje
   Multi-agente           →  08a Decidir y coordinar + 08b Comunicar y orquestar
   Operación y mejora     →  09 Validación + 10 Monitoreo + 11 Mejora
   Riesgo y colaboración  →  12 Protección + 13 Humano-agente
```

> [!tip] Recomendación
> Si ya vienes de la wiki [[../ai-engineering/00-ai-engineering|AI Engineering]] en este vault, empieza por [[02-diseno-de-sistemas-de-agentes]] y [[05-orquestacion]]. Si partes de cero, lee en orden desde [[01-introduccion-a-los-agentes]]. Si operas agentes en producción, salta a [[10-validacion-y-medicion]] y [[11-monitoreo-en-produccion]].

## Continuar leyendo

### Bloque 1 — Fundamentos
- [[01-introduccion-a-los-agentes|Introducción a los agentes]] — qué define a un agente, la revolución del pre-training, tipos, selección de modelos, sync↔async, principios para construir sistemas agenticos efectivos y panorama de frameworks (LangGraph, AutoGen, CrewAI, OpenAI Agents SDK).
- [[02-diseno-de-sistemas-de-agentes|Diseño de sistemas de agentes]] — componentes núcleo (modelo, herramientas, memoria, orquestación), trade-offs de diseño (performance, escalabilidad, fiabilidad, costes) y patrones arquitectónicos single-agent vs multi-agent.

### Bloque 2 — Diseño de interacción y orquestación
- [[03-diseno-de-experiencia-de-usuario-para-sistemas-agenticos|UX de sistemas agenticos]] — modalidades de interacción (texto, gráfico, voz, vídeo), autonomy slider, sync/async UX, confianza y retención de contexto.
- [[04-uso-de-herramientas|Uso de herramientas]] — herramientas locales, API-based y plug-in, **Model Context Protocol (MCP)**, stateful tools y generación automática de herramientas con foundation models.
- [[05-orquestacion|Orquestación]] — tipos de agentes (ReAct, planner-executor, reflexión, deep research), selección y topologías de ejecución de herramientas, **context engineering**.

### Bloque 3 — Memoria y aprendizaje
- [[06-conocimiento-y-memoria|Conocimiento y memoria]] — vector stores y búsqueda semántica, **RAG**, **GraphRAG**, knowledge graphs y note-taking memory.
- [[07-aprendizaje-en-sistemas-agenticos|Aprendizaje en sistemas agenticos]] — aprendizaje no paramétrico (RAG, few-shot, Reflexion) vs paramétrico (SFT, DPO, RLVR) y el rol de los modelos pequeños.

### Bloque 4 — Multi-agente
- [[08-de-un-agente-a-muchos-parte-a|De un agente a muchos — Parte A]] — cuántos agentes necesito, principios para añadir agentes, coordinación democrática / manager / jerárquica / actor-crítico, y diseño automatizado de sistemas agenticos.
- [[09-de-un-agente-a-muchos-parte-b|De un agente a muchos — Parte B]] — comunicación local vs distribuida, **Agent-to-Agent Protocol**, message brokers, actor frameworks (Ray, Orleans, Akka), orquestación de workflows y gestión de estado distribuido.

### Bloque 5 — Operación y mejora
- [[10-validacion-y-medicion|Validación y medición]] — evaluación por componente (herramientas, planificación, memoria, aprendizaje) y evaluación holística (rendimiento end-to-end, consistencia, coherencia, alucinación).
- [[11-monitoreo-en-produccion|Monitoreo en producción]] — stacks (Grafana/OTel, ELK, Arize Phoenix, SigNoz, Langfuse), instrumentación OTel, patrones (shadow mode, canary, self-healing) y feedback de usuario como señal de observabilidad.
- [[12-bucles-de-mejora|Bucles de mejora]] — feedback pipelines, refinamiento de prompts y herramientas, A/B testing, Bayesian bandits y continuous learning in-context vs offline retraining.

### Bloque 6 — Riesgo y colaboración
- [[13-proteccion-de-sistemas-agenticos|Protección de sistemas agenticos]] — riesgos únicos, threat modeling con **MAESTRO**, red teaming, data privacy, safeguards frente a amenazas externas y fallos internos.
- [[14-colaboracion-humano-agente|Colaboración humano-agente]] — roles y autonomía, ciclo de vida de la confianza, marcos de accountability, diseño de escalación y el futuro de los equipos humano-agente.

## Mapa de dependencias

```text
   01 Intro        →  02 Diseño           (fundamentos)
                       │
                       ├─  03 UX          (consume los principios de diseño)
                       ├─  04 Tools       (MCP, stateful, generación)
                       └─  05 Orquestración (tipos de agente, contexto)
                              │
                              ├─  06 Memoria  (RAG, vector stores)
                              └─  07 Aprendizaje (SFT, DPO, RLVR)

   08a Decidir y coordinar ────  08b Comunicar (multi-agente)
                              │
                              ├─  09 Validación
                              ├─  10 Monitoreo
                              └─  11 Mejora

   12 Protección  ──  13 Humano-agente  (governance, escalación)
```

## Próximos pasos

Empezar por la base: [[01-introduccion-a-los-agentes]].
