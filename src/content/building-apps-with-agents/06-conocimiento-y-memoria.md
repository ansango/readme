---
title: "Conocimiento y memoria : context windows, BM25, vector stores, RAG y GraphRAG"
description: "Cómo los agentes recuerdan y saben más: context windows, full-text search (BM25), semantic memory con vector stores, retrieval-augmented generation (RAG), GraphRAG sobre knowledge graphs dinámicos, note-taking"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [ai, agents, building-ai-agents, rag, embeddings, vector-store, knowledge-graph, graphrag]
---

# Conocimiento y memoria

> [!abstract] Resumen
> Un agente con tools y orquestación es capaz de actuar; sin memoria, es **stateless**. Este capítulo recorre las cinco formas que un agente tiene para enriquecer su contexto más allá de los pesos del modelo: **(1)** context window deslizante + keyword extraction, **(2)** full-text search (BM25), **(3)** semantic memory sobre **vector stores**, **(4)** Retrieval-Augmented Generation (RAG) que combina retrieval con generación, y **(5)** **GraphRAG** sobre knowledge graphs con multihop reasoning. La categoría ortogonal — **note-taking** — se explica como técnica que mejora workflows de inferencia generando notas intermedias antes de la respuesta. El libro termina vinculando este capítulo al de [[05-orquestacion]]: *memory es donde vive el conocimiento; context engineering es cómo lo aprovecha*.

## Knowledge vs Memory: dos complementarios

> [!note> Distinción crucial
> **Knowledge** (típicamente vía RAG): inyecta contenido factual o de dominio — specs, políticas, catálogos — al prompt para que el agente "sepa" información verificable más allá de la conversación inmediata.
>
> **Memory**: captura el historial del propio agente — turnos previos, outputs de tools, state updates — para mantener continuidad entre turnos y sesiones.

```text
   Capacities del foundation model
        ↓
   + Knowledge (RAG)  ── datos externos: políticas, docs, datos
   + Memory           ── historia del propio agente
        ↓
   = Contexto completo que ve el agente
```

## Foundational: rolling context window y full-text search

### Context window

El **context window** es toda la información que pasa al modelo en una sola llamada. Su tamaño define **cuánto puede atender** el LLM a la vez. Tabla comparativa de los modelos de 2024-2025:

```text
   Modelo                    Tokens          Equivalente humano
   ──────                    ──────          ──────────────────
   GPT-3.5 Turbo             4,000           ~12 páginas
   Claude 3.5 Sonnet         8,000           ~24 páginas
   Mistral Large             32,000          ~96 páginas
   Claude 3.7 / GPT-5        272,000         ~800 páginas
   Gemini 2.5                1,000,000       ~2,500+ páginas
```

> [!note> El context window sigue siendo limitado
> Aunque hemos pasado de 4 K a 1 M tokens, **no es memoria infinita**: el modelo pierde atención con prompts largos, la latencia y el coste crecen, y la información relevante debe ser inyectada cerca del final del prompt para que el modelo la "vea" mejor.

El approach más simple: **rolling context window**. Metes todo en el prompt; cuando se llena, expulsas lo más antiguo en FIFO. Es low-complexity y cubre muchos casos. Su talón de Aquiles es **pérdida de información valiosa** sin importar cuán relevante fuera — un detail crítico de hace 20 turnos se esfuma porque entró antes.

```python
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START

llm = ChatOpenAI(model="gpt-5")

def call_model(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": response}

# LangGraph con MessagesState trunca automáticamente
graph = StateGraph(MessagesState)
graph.add_node("model", call_model)
graph.add_edge(START, "model")
graph = graph.compile()
```

> [!tip> Truco de prompting
> "Si el contexto está cerca del final del prompt, el modelo lo ve con más probabilidad. **Highlight** el dato más importante al final del mensaje."

### Traditional full-text search (BM25)

Cuando la conversación es más grande que el context window, necesitas **recortar**. Full-text search por keywords es la opción simple:

```python
# pip install rank_bm25
from rank_bm25 import BM25Okapi

corpus = [
    "Agent J is the fresh recruit with attitude".split(),
    "Agent K has years of MIB experience and a cool neuralyzer".split(),
    "The galaxy is saved by two Agents in black suits".split(),
]

bm25 = BM25Okapi(corpus)
top_n = bm25.get_top_n("Who is a recruit?".split(), corpus, n=2)

for line in top_n:
    print("•", " ".join(line))
```

**BM25** rankea por:
- **Term frequency**: cuántas veces aparece el término en el chunk.
- **Inverse document frequency**: cómo de raro es el término en el corpus.
- **Document length normalization**: penaliza chunks extremos.

```text
   Top matching lines:
     • Agent J is the fresh recruit with attitude
```

**Pros**: simple, exacto en términos literales. **Contras**: pierde sinonimia, paráfrasis y vínculos conceptuales.

## Semantic memory y vector stores

Semantic memory **codifica el significado** de la información en embeddings. Cuando un agente necesita un dato, busca por **similitud semántica**, no por keywords.

```text
   Texto  ───→  embedding model (OpenAI, BGE, etc.)  ──→  vector de 1.5K-3K dim
                                                          ↓
                                                          Vector store (FAISS, Pinecone, etc.)
                                                          ↓
   Query  ─→  embedding  ─→  cosine sim  ─→  top-k chunks
```

### Implementación típica

```python
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START

llm = ChatOpenAI(model="gpt-5")

def call_model(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": response}

from vectordb import Memory

memory = Memory(chunking_strategy={'mode': 'sliding_window', 'window_size': 128, 'overlap': 16})

text = """Machine learning is a method of data analysis that automates analytical model building..."""
metadata = {"title": "Introduction to Machine Learning", "url": "https://learn.microsoft.com/..."}
memory.save(text, metadata)
```

> [!note> ¿Por qué semantic?
> "El usuario puede preguntar '¿quién derrotó al rey en el ajedrez?' y el agente recupera 'Magnus Carlsen ganó el Campeonato Mundial 2024' — **sin que las palabras 'derrotó al rey' estén en ningún chunk**". La similitud semántica cierra ese gap que BM25 no puede.

### Retrieval-Augmented Generation (RAG)

**RAG** es la combinación canónica: retrieval semántico + generation. El proceso canónico:

```text
   User query
       ↓ embed
   Vector similarity search (top-k)
       ↓
   Top-k chunks relevantes
       ↓
   Inyectar en prompt como context
       ↓
   LLM genera respuesta grounded en los chunks
       ↓
   Respuesta con citas / fuentes
```

> [!success> Por qué RAG ganó
> - **Factual grounding**: las respuestas se apoyan en textos concretos, no en paráfrasis del LLM.
> - **Freshness**: el corpus puede actualizarse sin reentrenar el modelo.
> - **Citando al original**: el chunk recuperado puede incluirse verbatim o como referencia.
> - **Dominio específico**: las políticas internas, los manuales técnicos, los catálogos de producto caben en un vector store aunque no estén en el pre-training del modelo.

### Semantic experience memory

Las tools modernas de conversación (Cursor, Windsurf, etc.) **inyectan contexto automáticamente** desde el entorno — el IDE identifica los archivos relevantes, los snippets abiertos, la historia del proyecto — y los pasa al LLM como memories. Esto es lo que el libro llama **semantic experience memory**: no necesitas copiar-pegar context; el IDE lo descubre.

## GraphRAG: cuando las relaciones importan

RAG tradicional opera sobre chunks planos. La **RAG falla** en preguntas que requieren **multihop reasoning** sobre entidades conectadas:

```text
   "¿Qué ha hecho Geoffrey Hinton?"
       ↓
   RAG tradicional busca chunks sobre Hinton
       ↓
   Puede no cubrir sus contribuciones integralmente
       ↓
   Falla
```

**GraphRAG** resuelve esto construyendo un **knowledge graph** (nodos = entidades, aristas = relaciones) y razonando sobre estructura.

### Componentes de GraphRAG

```text
   ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
   │  Knowledge graph     │    │ Retrieval system     │    │ Generative model     │
   │ (entities + rels)    │───▶│ (query the graph)    │───▶│ (synthesize answer)  │
   └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

Implementaciones referencia:

- **`neo4j-graphrag`**: production-grade, Neo4j + embedders + retrievers.
- **`nano-graphrag`**: lightweight, ~300 líneas para experimentar localmente.
- **GraphRAG CLI**: introspección global y local en minutos, sin código.

### Construir un knowledge graph

Siete pasos canónicos:

1. **Data collection**: documentos, bases de datos, sitios web, contenido de usuario.
2. **Preprocessing**: limpieza, normalización, eliminación de redundantes.
3. **Entity recognition (NER)**: extraer entidades — personas, lugares, organizaciones, conceptos.
4. **Relationship extraction**: extraer relaciones entre entidades (sujeto + verbo + objeto).
5. **Ontology design**: schema de tipos y relaciones — backbone del grafo.
6. **Graph population**: INSERTs en Neo4j (u otro graph DB) usando Cypher.
7. **Integration y validation**: refresh, deduplication, query correctness.

#### Cypher example (Neo4j)

```cypher
// Crear nodos de conceptos
CREATE (:Concept {name: 'Artificial Intelligence'});
CREATE (:Concept {name: 'Machine Learning'});
CREATE (:Concept {name: 'Deep Learning'});

// Relaciones jerárquicas
MATCH (ml:Concept {name: 'Machine Learning'}),
      (dl:Concept {name: 'Deep Learning'})
CREATE (dl)-[:SUBSET_OF]->(ml);

// Herramientas y modelos
CREATE (:Tool {name: 'TensorFlow', creator: 'Google'});
CREATE (:Tool {name: 'PyTorch', creator: 'Facebook'});
CREATE (:Model {name: 'BERT', year: 2018});

// Multihop traversal
MATCH path = shortestPath(
  (nlp:Concept {name: 'Natural Language Processing'})-[*]-(dl:Concept {name: 'Deep Learning'})
)
RETURN path;
```

> [!success> Multihop es lo que GraphRAG aporta
> El `shortestPath` de Cypher da respuestas que **vector similarity no podría**. Si "NLP" y "Deep Learning" están a tres saltos vía "BERT → BUILT_WITH → TensorFlow → IMPLEMENTS → Neural Networks → USED_IN → Deep Learning", GraphRAG lo conecta en una sola query.

### Promise and peril de dynamic knowledge graphs

Los **dynamic knowledge graphs** se actualizan en tiempo real — útiles para news, social media, monitoring — pero:

| Promesa | Peligro |
|---------|---------|
| Información actualizada al momento | Mantenimiento complejo: errores e inconsistencias se propagan |
| Adaptive learning sin re-training | Resource intensity: updaters consumen mucha CPU en grafos grandes |
| Structured format para multihop | Compliance: real-time complica GDPR/HIPAA |
| Decisión informada en campos rápidos | Overreliance: el grafo no captura todo el contexto |

Mitigaciones:

```text
   Validación robusta            ── automated tools para verificar accuracy
   Arquitectura escalable         ── distributed databases, cloud
   Seguridad fuerte              ── encryption, access controls, anonymization
   Human-in-the-loop en crítico   ── validación humana en decisiones importantes
```

> [!note> Cambio de paradigma reciente
> Con Gemini 2.5 y GPT-4.1 alcanzando ventanas de **1 millón de tokens** (~750,000 palabras, ~2,500 páginas), han surgido **index-free RAG**: el LLM hace su propio chunking y relevance scoring internamente. Útil cuando tienes pocos documentos y la latencia del retrieval es cuello de botella. **Pero no reemplaza RAG tradicional** cuando necesitas freshness, precisión ranking o control estricto del contexto.

## Note-taking: técnica de prompting intermedia

El agente **genera notas intermedias** sobre el contexto, **antes** de responder:

```text
   Context + question
       ↓
   Generate notes on key parts of context
       ↓
   Generate notes on the question itself
       ↓
   Interleave notes + context
       ↓
   Final answer (deeper, more grounded)
```

Tres modos de prompting:

- **Standard**: contexto + pregunta → respuesta.
- **Chain-of-thought**: contexto + pregunta + razonamiento → respuesta.
- **Self-note** (note-taking): notas sobre el contexto + notas sobre la pregunta → respuesta.

> [!success> El capítulo cita evidencia experimental
> Lanchantin et al. (2023), "Learning to Reason and Memorize with Self-Notes", demuestran buenos resultados en razonamiento y evaluación. La idea: **espaciar notas** sobre lo que el modelo "debería pensar" antes de generar la respuesta final.

## Resumen del capítulo

- El **context window** es el recurso crítico; rolling window funciona para casos simples, pero pierde información valiosa.
- **BM25** (full-text search) es la opción rápida para coincidencia exacta de keywords; **semantic memory con vector stores** gana cuando necesitas capturar **significado** más allá de keywords.
- **RAG** es la combinación canónica (retrieval semántico + generation) y cubre 80% de los casos prácticos; ofrece grounding factual, freshness y citas.
- **GraphRAG** extiende RAG a multihop reasoning sobre entities conectadas — críticos cuando la pregunta cruza varias entidades o necesita relaciones explícitas.
- Los **modelos con ventanas de 1M tokens** abren index-free RAG, pero no reemplazan retrieval dedicado cuando necesitas control fino de freshness y precisión.
- **Note-taking** mejora workflows de inferencia con notas intermedias que guían el razonamiento.

> [!note> Toma del libro
> "Memory no es solo almacenar datos — es transformar cómo los agentes interactúan con su entorno y con los usuarios. Las systems que continuamente invierten en memory sofisticada crean agentes más inteligentes, responsivos y capaces."

## Próximos pasos

Memoria estática es solo la base. Lo que cierra el círculo es **cómo el agente aprende de la experiencia** para mejorar automáticamente con el tiempo. Entramos en [[07-aprendizaje-en-sistemas-agenticos]].
