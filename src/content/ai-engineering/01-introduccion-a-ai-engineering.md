---
title: Introducción a AI Engineering
description: "Por qué el campo se llama AI engineering, cómo evolucionamos de los modelos de lenguaje a los foundation models, casos de uso típicos, cómo planificar una aplicación y qué capas forman el stack"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, ai-engineering, foundation-models, llm]
---

# Introducción a AI Engineering

> [!abstract] Resumen
> Esta nota cubre las bases del campo: cómo pasamos de los modelos de lenguaje a los **foundation models**, qué define a la disciplina de **AI engineering** frente al ML clásico, qué tipos de aplicaciones se están construyendo hoy, cómo evaluar si un caso de uso merece la pena, cómo planificar el proyecto (expectativas, milestones, mantenimiento) y las tres capas del stack en el que se apoya todo lo demás.

## El ascenso de la AI engineering

El libro arranca con una observación: cuando en 2012 el paper de AlexNet mostró que los resultados mejoraban solo con más datos y más GPUs, la comunidad de ML ya sabía que la escala importaba. Lo que sorprendió con la llegada de ChatGPT no fue la calidad del modelo en abstracto, sino la **explosión de aplicaciones** que esa calidad desbloqueó.

Tres cosas pasaron a la vez:

1. Los **modelos subieron varios peldaños** de capacidad en muy poco tiempo.
2. La **barrera de entrada cayó** drásticamente: ya no hace falta entrenar un modelo para construir un producto.
3. Las **interfaces se abstrajeron** en APIs simples (text-in, text-out al principio; multimodal más tarde), y se construyeron encima frameworks que estandarizan el resto.

El resultado es que la AI engineering se convirtió en la **primera disciplina de software de la historia** en la que es viable construir un producto útil sin escribir una sola línea de código propio: con un *prompt* bien diseñado y algo de orquestación, ya tienes algo que resuelve un problema real.

> [!note] AI Engineering ≠ "prompt engineering"
> Prompt engineering es una técnica dentro de AI engineering, no su sinónimo. AI engineering cubre todo el ciclo: ideación, evaluación, prompt engineering, RAG, agentes, finetuning, ingeniería de datos, arquitectura, inferencia y feedback. El prompt es solo una pieza.

## De los modelos de lenguaje a los foundation models

El libro traza una evolución de cuatro saltos que conviene tener clara antes de hablar de "AI engineering" como tal.

### 1. Modelos de lenguaje (LMs)

Los modelos de lenguaje originales eran modelos estadísticos o neuronales sencillos entrenados para predecir la siguiente palabra en una secuencia. Eran útiles para tareas como autocompletar, corrección ortográfica o traducción automática cuando se entrenaban con pares de datos, pero su capacidad era limitada y dependían mucho de la tarea concreta.

### 2. Large Language Models (LLMs)

Con la arquitectura transformer (2017) y datasets mucho mayores, los LLM dieron un salto cualitativo: el mismo modelo entrenado para predecir el siguiente token servía razonablemente bien para una **variedad enorme** de tareas sin reentrenarlo. La capacidad sorprendió porque **escalaba suavemente**: cada vez que se aumentaban parámetros, datos y cómputo, las métricas mejoraban de forma predecible.

### 3. Foundation Models (FMs)

El término *foundation model* lo popularizó el Stanford Institute for Human-Centered AI en 2021 para capturar una idea más amplia: modelos **grandes, entrenados con datos muy diversos**, que pueden servir como **base** para muchos downstream tasks distintos vía fine-tuning, prompting, RAG, etc. No todos los foundation models son LLMs: hay modelos multimodales (texto + imagen + audio), modelos de visión, modelos de razonamiento especializados, modelos de código, etc.

La diferencia operativa con "LLM" es importante: cuando hablamos de **foundation models** el centro de gravedad se mueve de "predecir texto" a "servir como base reutilizable para múltiples aplicaciones".

### 4. AI Engineering

El último salto es de los modelos a los **productos**. Una vez que el foundation model existe, el trabajo de construir aplicaciones encima se convierte en una disciplina de ingeniería con sus propios problemas recurrentes:

- Cómo elegir el modelo y el proveedor adecuados.
- Cómo estructurar el contexto (prompts, RAG, memoria).
- Cómo evaluar de forma sistemática.
- Cómo reducir latencia y coste.
- Cómo diseñar un loop de feedback sostenible.
- Cómo defender el sistema de ataques y usos indebidos.

Todo eso es AI engineering.

## Casos de uso de los foundation models

El libro repasa los casos de uso más comunes a 2024. No es una lista exhaustiva, pero sirve para entender qué tipo de problemas resuelve bien esta tecnología y dónde todavía hace falta pensar bien el diseño.

| Caso de uso | Ejemplos | Notas |
|---|---|---|
| **Coding** | Copilot, Cursor, generación de tests, refactor, code review | Es el caso más *mainstream* y el que más rápido recupera inversión. |
| **Imagen y vídeo** | Generación, edición, animación, storyboards | Aquí entran modelos como DALL·E, Stable Diffusion, Sora, etc. |
| **Escritura** | Borradores, resúmenes, corrección, traducción, reescritura | Abarca desde redacción creativa hasta documentación técnica. |
| **Educación** | Tutores personalizados, explicaciones a distintos niveles, generación de ejercicios | El formato conversacional encaja muy bien con el caso. |
| **Chatbots conversacionales** | Atención al cliente, assistants internos, *companions* | El caso más obvio, pero también el más sensible a alucinaciones. |
| **Agregación de información** | Resúmenes de noticias, *newsletters* personalizados, búsqueda semántica | Encaja muy bien con RAG. |
| **Organización de datos** | Clasificación, extracción, normalización, *data cleaning* | Es el caso que más ROI da en empresas con datos desordenados. |
| **Automatización de workflows** | Agentes que ejecutan acciones en otros sistemas | El territorio de los **agents**, todavía con muchos *failure modes*. |

> [!question] ¿Y los agentes?
> Los agentes merecen su propia nota ([[10-agentes|Agentes]]) porque tienen una complejidad de diseño muy distinta a los casos "transaccionales" (pregunta → respuesta). Si tu caso de uso requiere que el sistema **tome acciones** sobre otros sistemas, planifica en consecuencia y no lo trates como un chatbot.

> [!warning] La trampa del "demo effect"
> Casi todos estos casos lucen muy bien en una demo. La dificultad real aparece en producción: el modelo alucina, los datos de evaluación escasean, los costes se disparan, los usuarios intentan romper el prompt. Una idea central que se repite a lo largo de la disciplina: **la mayoría de problemas de AI engineering no son problemas del modelo, sino de diseño del sistema que lo rodea**.

## Tipos de aplicaciones según la arquitectura

Otro corte útil para entender el espacio es por la **forma de la aplicación** (cómo interactúa el usuario con el modelo):

- **Aplicaciones de un solo turno** (*single-turn*): el usuario hace una pregunta, el sistema responde. Es el caso más sencillo y donde mejor funcionan los modelos actuales.
- **Aplicaciones conversacionales multi-turno**: el contexto se acumula entre turnos. Exigen gestionar la memoria de la conversación y que el modelo recuerde lo anterior.
- **Aplicaciones agenticas**: el sistema toma acciones, observa resultados, itera. Mucho más complejo y propenso a fallar.
- **Aplicaciones de un solo modelo frente a multi-modelo**: a veces un solo modelo no basta (uno barato clasifica, uno caro genera; uno rápido extrae, otro razona). Diseñar **routers** entre modelos es una decisión arquitectónica clave.

> [!tip] Empieza simple
> Conviene empezar por la arquitectura más simple que resuelva el problema. Si con un solo modelo y un prompt logras el 80% de la calidad, no te compliques con un sistema multi-modelo hasta no tener métricas que justifiquen la complejidad.

## Planificar una aplicación de AI

Antes de escribir código, hay un ciclo de planificación con cuatro preguntas que conviene hacerse en este orden.

### 1. ¿Merece la pena este caso de uso?

El libro insiste: **no todo problema necesita un foundation model**. Hay que comparar siempre con la línea base más sencilla posible:

- Línea base humana (una persona haciéndolo manualmente).
- Línea base de software clásico (heurísticas, reglas, búsqueda tradicional).
- Línea base de ML supervisado clásico.
- Línea base de un modelo más pequeño y barato.

Si la línea base no-AI cubre el caso a coste y calidad razonables, no hay negocio en meter un foundation model. El coste oculto (evaluación, mantenimiento, gestión de alucinaciones) suele ser mayor de lo que parece al principio.

> [!question] La pregunta más difícil
> "¿Es esto un problema que un foundation model resuelve **mejor** y más **barato** que las alternativas?" Si la respuesta es "más o menos", replantéalo antes de invertir tres meses en construir algo.

### 2. Fijar expectativas

AI engineering vive bajo la presión de expectativas desproporcionadas. El libro pide ser explícito sobre:

- **Qué métrica importa**: muchas veces no es "inteligencia general" sino una métrica operativa (tasa de respuesta útil, ratio de alucinaciones, latencia p95, coste por tarea).
- **Cuál es el nivel de calidad aceptable**: una cosa es un asistente interno para empleados técnicos (tolerancia alta a errores) y otra un chatbot médico cara al público (tolerancia casi nula).
- **Cuánto se puede degradar el modelo antes de que el producto sea inusable**: los modelos cambian con cada release del proveedor; lo que hoy va bien puede romperse mañana.

> [!danger] Contratos y SLAs
> Si vendes un producto que usa un modelo de terceros, **no puedes prometer SLA que el proveedor no te promete**. Revisa los términos del proveedor y construye tu propio colchón de margen.

### 3. Planificar por milestones

El libro desaconseja los planes trimestrales vagos y propone planear por **milestones** explícitos y verificables:

- **Milestone 1**: ¿podemos resolver el caso de uso con un modelo externo vía API?
- **Milestone 2**: ¿mejoran las métricas tras prompt engineering básico?
- **Milestone 3**: ¿mejora con RAG?
- **Milestone 4**: ¿mejora con fine-tuning?
- **Milestone 5**: ¿merece la pena invertir en servir nuestro propio modelo?

Cada milestone es una **puerta de decisión**: si en M1 las métricas no son aceptables, no tiene sentido saltar a M4. Esto evita la trampa clásica de invertir meses en fine-tuning un modelo cuando el problema estaba en los datos o en el diseño del prompt.

> [!tip] El orden importa
> La razón para empezar por la API y solo después considerar fine-tuning es que cada técnica es **máscara y más arriesgada** que la anterior. Prompt engineering es gratis; RAG cuesta un pipeline de datos; fine-tuning cuesta GPUs y datos etiquetados; entrenar tu propio modelo cuesta un equipo y mucho dinero.

### 4. Planear el mantenimiento

Mantener un producto de AI es más exigente que mantener uno de software clásico:

- Los **modelos cambian**: cada release del proveedor puede alterar el comportamiento.
- Los **datos de usuario cambian**: temas que ayer funcionaban dejan de funcionar.
- Los **atacantes evolucionan**: nuevos *jailbreaks* aparecen cada semana.
- Los **costes fluctúan**: el patrón de uso real raramente coincide con la estimación inicial.

El libro recomienda tratar el sistema como **experimental**: pipelines de evaluación continuos, datasets de regression tests, dashboards de calidad, y un runbook claro para cuando un modelo nuevo rompe algo.

> [!note] La AI engineering no termina en "production"
> Es un error muy común celebrar el "deploy a producción" como el final del proyecto. En AI engineering, el deploy es la línea de salida: a partir de ahí empieza el trabajo de verdad (observar, medir, iterar).

## El stack de AI engineering

El libro describe el stack como **tres capas**, cada una con sus propias decisiones y trade-offs.

### Capa 1: Application development

Es la capa donde escribes tu código de producto. Aquí entran:

- **Frameworks de orquestación**: LangChain, LlamaIndex, DSPy, frameworks internos, código propio sin framework.
- **Estrategias de prompt**: system prompts, few-shot, structured outputs, function calling.
- **Gestión de contexto**: cómo se construye el prompt (RAG, memoria, herramientas).
- **Lógica de control**: cuándo llamar al modelo, qué hacer con la respuesta, cómo encadenar llamadas.

> [!question] ¿Framework o no framework?
> A 2024-2025 la frontera se ha movido: muchos equipos que empezaron con LangChain han pasado a **código propio o DSPy** porque los frameworks opinados en exceso se interponen cuando necesitas optimizaciones finas. El libro recomienda **empezar sin framework** y añadir uno solo cuando duela.

### Capa 2: Model development

Es la capa donde se decide **qué modelo** usar y **cómo adaptarlo**:

- **Selección de modelo**: commercial vs open-source, tamaño, capacidades, coste, latencia.
- **Adaptación**: prompt engineering, fine-tuning, distillation.
- **Evaluación**: cómo saber si el modelo responde a tus necesidades.
- **Despliegue**: API gestionada vs hosting propio.

### Capa 3: Infrastructure

Es la capa "aburrida" pero determinante: cómputo, almacenamiento, redes, monitoring, costes. Aquí entran decisiones como:

- **GPU vs CPU**: qué workloads se pueden ejecutar en CPU y cuáles no.
- **Cloud vs on-premise**: hyperscalers (AWS, GCP, Azure) vs specialized providers (Together, Anyscale, Fireworks).
- **Latencia vs throughput**: batch más grande = más throughput, peor latencia.
- **Cuantización y optimizaciones**: ver [[14-fundamentos-y-optimizacion-de-inferencia|Fundamentos y optimización de inferencia]].

## AI engineering vs ML engineering

El libro dedica tiempo a distinguir las dos disciplinas porque se confunden, pero tienen problemas muy distintos.

| Dimensión | ML Engineering | AI Engineering |
|---|---|---|
| **Datos** | Curados y etiquetados para una tarea | Crudos, scraped, mezcla de fuentes |
| **Modelos** | Entrenados a medida para cada problema | Foundation models preentrenados |
| **Adaptación** | Feature engineering, entrenamiento | Prompt engineering, RAG, fine-tuning |
| **Evaluación** | Métricas específicas por tarea | Métricas generales (calidad, latencia, coste) |
| **Despliegue** | Modelo propio, ciclo de reentrenamiento | API externa + adaptaciones |
| **Coste principal** | Datos etiquetados | Inferencia y escala |

La consecuencia práctica: muchas herramientas y procesos del ML clásico **no aplican** directamente. Por ejemplo, en ML clásico la precisión importa más que la latencia; en AI engineering a veces la latencia es la métrica que define el producto.

## AI engineering vs Full-stack engineering

Otro símil útil para entender el perfil: AI engineering es **full-stack con esteroides**. Un AI engineer tiene que entender:

- **Frontend** (cómo interactúa el usuario con la IA).
- **Backend** (cómo se orquesta el sistema).
- **Datos** (cómo se mueve la información).
- **DevOps** (cómo se despliega y monitoriza).
- **ML/AI** (cómo se comporta el modelo y por qué).

Es un perfil generalista con criterio técnico en AI. El libro afirma que los buenos AI engineers tienden a ser **más versátiles** que los ML engineers puros porque necesitan tocar todas las capas.

## Resumen en tres frases

- AI engineering es la disciplina de **construir productos** sobre foundation models, no la disciplina de entrenarlos.
- Antes de escribir código hay que decidir **caso de uso**, **expectativas**, **milestones** y **plan de mantenimiento**.
- El stack tiene tres capas (aplicación, modelo, infraestructura) y la mayoría de problemas no están en el modelo, sino en el sistema que lo rodea.

## Próximos pasos

- [[02-datos-y-modelado-de-foundation-models|Datos y modelado de foundation models]]: por qué los datos importan más que la arquitectura, qué hace el transformer y cómo afecta el tamaño del modelo a su comportamiento.
