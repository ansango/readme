---
title: Evaluación de sistemas de IA
description: "Cómo evaluar un sistema de IA completo: criterios por capacidad, selección de modelo, navegación de benchmarks públicos y diseño del pipeline de evaluación"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [ai, llm, evaluation, benchmarks, model-selection]
---

# Evaluación de sistemas de IA

> [!abstract] Resumen
> Esta nota sube la evaluación desde el modelo aislado (capítulos 3) al **sistema** completo. Cubre los criterios por los que se evalúa un sistema de IA (capacidad de dominio, calidad de generación, seguimiento de instrucciones, coste y latencia), el workflow de selección de modelo, el dilema construir vs comprar, cómo navegar benchmarks públicos sin que te engañen y un pipeline de evaluación en tres pasos que puedes aplicar a tu proyecto.

## Por qué la evaluación cambia cuando es de sistema

El libro insiste en una diferencia crucial: evaluar un **modelo** y evaluar un **sistema** son ejercicios distintos. Un modelo puede ser brillante en un benchmark y dar un producto mediocre porque:

- El **prompt** está mal diseñado y el modelo no entiende la tarea.
- El **contexto** está incompleto (RAG mal configurado).
- La **infraestructura** añade latencia inaceptable.
- El **coste por uso** desborda el modelo de negocio.
- Los **usuarios** lo usan de formas que el benchmark no anticipa.

Por eso, antes de obsesionarte con benchmarks, define qué significa **"bueno"** para tu sistema concreto.

> [!question] Sobre qué decide el usuario
> El usuario no evalúa el modelo. Evalúa el **producto**. Esto incluye la latencia, el coste, la UX, la robustez, la consistencia. Un modelo "menos bueno" en un benchmark puede dar un producto superior porque el sistema que lo envuelve está bien diseñado.

## Criterios de evaluación

El libro propone cuatro dimensiones a cubrir, cada una con métricas concretas.

### 1. Capacidad específica del dominio

Para tu caso de uso, ¿el modelo sabe lo que necesita saber?

#### Cómo evaluarla

- **Crea un dataset propio** de preguntas reales del dominio. Es inevitable: los benchmarks públicos no cubren tu tema.
- **Mide con corrección funcional** cuando sea posible (código que compila, SQL que se ejecuta, llamada a API que tiene éxito).
- **Mide con AI as judge** cuando la verdad ground sea abierta.
- **Mide con humanos** en una muestra para calibrar.

#### Errores comunes

- ❌ Asumir que "el modelo es de propósito general, sabrá de finanzas".
- ❌ Confiar en benchmarks como MMLU o HumanEval para tu caso concreto.
- ❌ No tener dataset propio hasta que ya estás en producción.

> [!tip] Tu dataset es el activo
> El dataset de evaluación propio es **el activo más valioso** de un equipo de AI engineering. Es lo que te permite iterar con confianza. Construirlo lleva semanas, pero es la inversión con más retorno.

### 2. Capacidad de generación

Independientemente del dominio, ¿el modelo genera **bien**?

#### Dimensiones a evaluar

- **Coherencia**: ¿el texto se entiende?
- **Factualidad**: ¿lo que dice es verdad?
- **Estilo**: ¿el tono y el formato son los adecuados?
- **Concisión**: ¿dice lo que tiene que decir sin relleno?
- **Completitud**: ¿falta información crítica?

#### Cómo medirlo

- **Métricas de tarea**: exact match, ROUGE, BERTScore.
- **AI as judge**: rúbrica por cada dimensión.
- **Tasa de alucinación**: porcentaje de respuestas con afirmaciones factualmente incorrectas. **La métrica más importante para产品质量**.

> [!danger] Alucinaciones
> Una alucinación es una afirmación que el modelo presenta como verdad pero no lo es. No tiene que ver con que la respuesta sea creativa o esté mal redactada: tiene que ver con que **dice cosas falsas con seguridad**. Es la métrica de calidad que más vigilan los equipos serios.

### 3. Capacidad de seguir instrucciones

¿El modelo hace **lo que le pides**, no solo lo que entiende?

#### Tipos de instrucciones

- **Formato**: "responde en JSON", "máximo 100 palabras", "en español".
- **Contenido**: "no menciones X", "usa ejemplos positivos", "asume que el usuario sabe Y".
- **Estilo**: "tono profesional", "como si fueras un profesor", "informal y cercano".
- **Negativas**: "no digas X", "evita estos términos".

#### Cómo evaluarla

- **Tests de cumplimiento**: instrucciones concretas con verificación automática del output.
- **AI as judge**: rúbrica que puntúe adherencia a las instrucciones.
- **Tasa de違反**: porcentaje de respuestas que violan alguna instrucción explícita.

#### Por qué importa

Un modelo que sigue instrucciones es un modelo que puedes **controlar**. Un modelo que las ignora es un modelo que tendrás que filtrar con código externo.

> [!example] Tests de instrucciones
> Test 1: prompt = "Resume en 1 frase". Salida válida = 1 frase. ❌ Si el modelo da 3, falla.
> Test 2: prompt = "Responde solo con JSON". Salida válida = JSON parseable. ❌ Si hay prosa antes o después, falla.
> Test 3: prompt = "No menciones el precio". Validación: ¿la respuesta menciona "precio", "€", "$"? Si sí, falla.

### 4. Coste y latencia

El filtro que más proyectos nuevos se saltan y que acaba con la mitad.

#### Latencia

- **p50**: latencia mediana (la mitad de llamadas tardan menos).
- **p95**: percentil 95 (el 5% más lento).
- **p99**: percentil 99 (los outliers extremos).

> [!note] Siempre mide p95, no la media
> La latencia mediana es engañosa. Si la p95 es de 8 segundos, el 5% de tus usuarios esperan 8 segundos por una respuesta. Eso es una experiencia **muy** mala para ese 5%.

#### Cómo reducir latencia

- **Streaming**: empezar a enviar tokens al usuario mientras se generan. Reduce el "time-to-first-token".
- **Modelos más pequeños**: más rápidos, peor calidad.
- **Cuantización**: ver [[14-fundamentos-y-optimizacion-de-inferencia]].
- **Caching**: prompts repetidos o similares.
- **Speculative decoding**: generación en paralelo con verificación.
- **Paralelización**: para tareas largas, dividir en subtareas (más complejo).

#### Coste

El coste se mide en **dólares por millón de tokens** (input / output por separado). Hay tres componentes:

1. **Coste por token**: lo que cobra el proveedor.
2. **Tokens consumidos**: input (a veces más caro) + output (siempre más caro).
3. **Cache hit rate**: si tu sistema reusa prompts, el coste efectivo cae.

> [!tip] Coste ≠ precio
> Un modelo "barato" puede ser caro si genera respuestas largas o si falla y hay que reintentar. Calcula el coste por **tarea completada**, no por token.

## Selección de modelo

El libro dedica una sección entera al workflow de selección porque es la decisión más recurrente en AI engineering.

### Workflow de selección

1. **Define requirements**: capacidades mínimas, latencia, presupuesto, formato, compliance.
2. **Genera shortlist**: candidatos que cumplen los requirements básicos.
3. **Evalúa con tu dataset**: usa tu dataset propio, no solo benchmarks.
4. **Piloto en producción**: el ganador va a un 10% de tráfico.
5. **Mide métricas de negocio**: ¿el sistema aporta valor?
6. **Consolida o itera**: si el piloto confirma, escala; si no, vuelve al paso 1.

> [!warning] No te enamores de un modelo
> Los modelos cambian cada pocos meses. El que hoy es el mejor, en 6 meses puede haber sido superado. Mantén el pipeline de selección vivo, no decidas "modelo para siempre".

### Construir vs comprar

El libro plantea **tres opciones** que conviene distinguir:

1. **API externa**: usar OpenAI, Anthropic, Google, etc. Cero infraestructura, máxima flexibilidad, escala inmediata.
2. **Open-source self-hosted**: descargar Llama, Mistral, Qwen, etc. y servirlos tú. Más control, más coste fijo, más complejidad.
3. **Entrenar tu propio modelo**: solo viable para organizaciones grandes con datasets masivos y equipo de ML.

#### Cuándo API externa

- Empezar un producto.
- Volumen bajo a moderado.
- Necesitas la mejor calidad absoluta.
- El coste marginal es aceptable.

#### Cuándo open-source

- Volumen alto (ahorros de escala).
- Datos sensibles que no pueden salir de tu infra.
- Necesitas latencia muy baja.
- Necesitas customización profunda.

#### Cuándo entrenar propio

- Tienes un caso de uso único con datos masivos.
- El modelo base no aprende lo que necesitas ni con fine-tuning.
- Tienes equipo y presupuesto de millions.

> [!question] Tabla de decisión rápida
> Si gastas <$10K/mes en API → probablemente quédate con API. Si gastas >$100K/mes → evalúa open-source. Si gastas >$1M/mes → evalúa entrenar propio.

### Navegando benchmarks públicos

El libro dedica una sección a los benchmarks porque son **necesarios y engañosos** a partes iguales.

#### Por qué son necesarios

- Permiten **comparar modelos** sin tener que ejecutar cada uno.
- Cubren capacidades **generales** (no tu caso concreto).
- Son útiles para **filtrar** candidatos antes de evaluarlos con tu dataset.

#### Por qué son engañosos

- **Contamination**: los modelos pueden haber visto los tests en su entrenamiento. Las métricas están infladas.
- **Distribución**: tu caso de uso puede no parecerse en nada al benchmark.
- **Gaming**: algunos modelos se optimizan específicamente para benchmarks famosos.
- **Tamaño de muestra**: un benchmark con 100 preguntas tiene varianza enorme.

#### Benchmarks importantes a 2024

- **MMLU, MMLU-Pro**: preguntas tipo'examen en 57+ materias.
- **HumanEval, MBPP, BigCodeBench**: generación de código.
- **GSM8K, MATH**: problemas matemáticos.
- **HellaSwag**: commonsense reasoning.
- **TruthfulQA**: factualidad y resistencia a misconceptions.
- **IFEval**: seguir instrucciones.
- **Chatbot Arena (LMSYS)**: comparativa real con miles de usuarios humanos.

> [!tip] Usa benchmarks como filtro, no como veredicto
> Los benchmarks sirven para descartar candidatos que claramente no sirven. La decisión final la debe tomar **tu dataset propio**, no HumanEval.

## Diseño del pipeline de evaluación

El libro cierra el capítulo con un framework de tres pasos para diseñar el pipeline de evaluación de tu proyecto.

### Paso 1: Evaluar todos los componentes del sistema

Un sistema de IA tiene varios componentes, cada uno con su propia calidad:

- **Modelo base**: ¿se comporta como esperamos?
- **Recuperador (RAG)**: ¿encuentra los documentos correctos?
- **Generador**: ¿produce respuestas correctas?
- **Output parser**: ¿procesa correctamente la salida?
- **Herramientas externas**: ¿se llaman con los argumentos correctos?

> [!danger] Evalúa el sistema, no solo el modelo
> Si solo evalúas el modelo, no sabrás si un problema es del prompt, del RAG, del parser o del modelo. **Mide cada capa por separado**.

### Paso 2: Crear una guía de evaluación

Una guía de evaluación es un documento compartido por el equipo que define:

- **Qué se evalúa**: casos cubiertos, casos excluidos.
- **Cómo se puntúa**: rúbricas, escalas, criterios de aprobación.
- **Quién evalúa**: humanos, AI as judge, mix.
- **Con qué frecuencia**: cada cambio, cada release, cada milestone.
- **Qué hacer cuando falla**: runbook, criterios de rollback.

> [!tip] La guía antes que la métrica
> El libro recomienda escribir la guía de evaluación **antes** de empezar a medir. Sin guía, las métricas se interpretan a posteriori según convenga, y el equipo termina confiando en señales sin saber por qué.

### Paso 3: Definir métodos de evaluación y datos

El método depende del tipo de proyecto:

| Tipo de proyecto | Método principal | Datos |
|---|---|---|
| **Producto interno** | AI as judge + humanos muestreados | Logs reales anonimizados |
| **Producto B2B** | AI as judge + humanos | Datos de clientes (con consentimiento) |
| **Producto B2C** | AI as judge + humanos + A/B test | Telemetría de uso |
| **Investigación** | Humanos + métricas clásicas | Datasets públicos + propios |
| **Compliance** | Expertos del dominio | Casos de prueba manuales |

#### Tipos de datos para evaluación

- **Holdout**: parte del training set apartada para validación.
- **Test set curado**: ejemplos escritos a mano para casos clave.
- **Datos sintéticos**: generados por el modelo (potencialmente sesgados).
- **Datos de producción**: ejemplos reales, sesgados por el tráfico.
- **Datos adversariales**: casos diseñados para "romper" el sistema.

> [!warning] No mezcles training y evaluación
> El error más tonto y más común: **usar datos de entrenamiento para evaluar**. Si tu dataset de evaluación salió del mismo crawl que entrenó al modelo, las métricas están infladas y no predicen calidad en producción.

## Resumen en tres frases

- Evaluar un sistema de IA es un ejercicio multidimensional: capacidad de dominio, calidad de generación, seguimiento de instrucciones, coste y latencia.
- La selección de modelo es un workflow continuo, no una decisión única; tu propio dataset es la fuente de verdad, no los benchmarks públicos.
- Un pipeline de evaluación cubre todos los componentes del sistema, tiene una guía explícita y combina AI as judge con revisión humana.

## Próximos pasos

- [[07-prompt-engineering-fundamentos|Prompt engineering: fundamentos]]: la primera palanca para adaptar un modelo a tu problema. Cómo se construyen prompts efectivos, qué técnicas usar y cómo iterar.
