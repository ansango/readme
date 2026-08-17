---
title: "RAG: arquitectura y optimización"
description: "Retrieval-Augmented Generation: cómo dar contexto externo al modelo, las arquitecturas más comunes, los algoritmos de retrieval, cómo optimizar la calidad y los patrones para ir más allá del texto"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, llm, rag, retrieval, embeddings, vector-db]
---

# RAG: arquitectura y optimización

> [!abstract] Resumen
> Esta nota cubre la primera mitad del capítulo 6: **Retrieval-Augmented Generation (RAG)**, la técnica más común para dar contexto externo a un foundation model sin reentrenarlo. Vemos la arquitectura general, los algoritmos de retrieval (léxico, semántico, híbrido), las técnicas de optimización (chunking, reranking, query rewriting), y cómo extender RAG más allá del texto (imágenes, tablas, código). La segunda mitad del capítulo (agentes) está en [[10-agentes|Agentes]].

## Por qué RAG existe

Los foundation models tienen dos limitaciones que RAG ataca directamente:

1. **Conocimiento desactualizado**: entrenado hasta una fecha, no sabe lo que pasó después.
2. **Conocimiento privado**: no saben sobre los datos internos de tu empresa.

Hay tres formas de darle ese conocimiento al modelo:

- **Meterlo en el prompt**: imposible si el corpus es grande.
- **Fine-tunear**: costoso, lento, requiere reentrenar con cada cambio.
- **RAG**: recuperar contexto dinámicamente en cada pregunta.

RAG es **barato, inmediato y siempre actualizado**. Para la mayoría de casos prácticos, es la opción correcta.

> [!quote] "RAG es la cinta transportadora del contexto."
> Cada vez que el usuario pregunta, el sistema recoge los trozos relevantes de una base de conocimiento y los pone en el prompt. El modelo responde con ese contexto fresco.

## Arquitectura general

Un sistema RAG tiene **tres componentes**:

### 1. Indexing pipeline (offline)

Proceso que prepara la base de conocimiento:

1. **Cargar** documentos de sus fuentes (PDFs, web, BD, etc.).
2. **Chunkear**: dividir en fragmentos de tamaño manejable.
3. **Embedir**: convertir cada chunk en un vector.
4. **Almacenar**: guardar los vectores en una base de datos vectorial con sus metadatos.

### 2. Retrieval pipeline (online)

Proceso que responde a una query:

1. **Recibir** la query del usuario.
2. **Embedir** la query.
3. **Buscar** los chunks más similares en la base.
4. **Devolver** los top-k chunks como contexto.

### 3. Generation pipeline (online)

Proceso que genera la respuesta:

1. **Construir** el prompt con instrucciones + contexto + query.
2. **Llamar** al modelo.
3. **Post-procesar** la respuesta (citaciones, validación, etc.).

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Documentos │ -> │  Indexing   │ -> │  Vector DB  │
└─────────────┘    │  (chunking, │    └─────────────┘
                   │  embedding) │
                   └─────────────┘
                          ▲
                          │ (offline)
                          │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Usuario /   │ -> │  Retrieval  │ -> │  Contexto   │
│  query      │    │  (top-k)    │    │  + prompt   │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   LLM       │
                                        │  genera     │
                                        │ respuesta   │
                                        └─────────────┘
```

## Chunking

El primer paso del indexing es **dividir los documentos en chunks**. El chunking es más importante de lo que parece: el tamaño y la estrategia afectan directamente a la calidad del retrieval.

### Estrategias de chunking

#### Fixed-size chunking

Dividir en chunks de N tokens con overlap.

- **Pros**: simple, predecible.
- **Cons**: corta frases, pierde contexto.

```python
def fixed_chunk(text, chunk_size=500, overlap=50):
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
    return chunks
```

#### Sentence/paragraph chunking

Dividir en oraciones o párrafos.

- **Pros**: respeta la estructura del texto.
- **Cons**: oraciones largas siguen siendo largas.

#### Semantic chunking

Agrupar frases por similitud semántica.

- **Pros**: cada chunk es temáticamente coherente.
- **Cons**: más caro, requiere embedding de cada frase.

#### Hierarchical chunking

Indexar a múltiples niveles (documento, sección, párrafo).

- **Pros**: retrieval multi-granular.
- **Cons**: más complejo.

### Tamaño del chunk

El libro recomienda **ajustar empíricamente** pero da heurísticas:

- **Chunks cortos (100–300 tokens)**: retrieval más preciso, menos contexto por chunk.
- **Chunks medios (500–800 tokens)**: balance habitual.
- **Chunks largos (1000+ tokens)**: más contexto, retrieval menos preciso.

> [!tip] Overlap es importante
> Sin overlap, una frase importante puede quedar partida entre dos chunks y "escaparse" del retrieval. Un overlap del 10-20% es típico.

## Embeddings para retrieval

El corazón de RAG moderno es **buscar por similitud semántica** en lugar de por coincidencia exacta de palabras.

### Embedding models

Modelos populares para embeddings:

- **OpenAI text-embedding-3-small/large**: alta calidad, pago por uso.
- **Cohere embed-v3**: buena calidad, multilingüe.
- **sentence-transformers** (open-source): gratuitos, multitud de modelos.
- **Voyage AI**: optimizados para RAG.

### Cómo elegir

- **Multilingüe**: si tu contenido mezclá idiomas, necesitas un modelo multilingüe.
- **Tamaño del vector**: 384, 768, 1024, 1536, 3072. Mayor = más detalle, más coste.
- **Velocidad**: importante si tu pipeline es online.
- **Coste**: 1M de embeddings cuesta distinto en cada proveedor.

## Algoritmos de retrieval

El libro distingue tres familias principales.

### 1. Retrieval léxico (BM25)

El clásico de la recuperación de información: cuenta términos, los pondera por rareza, los normaliza por longitud del documento.

- **Pros**: rápido, sin modelo externo, excelente para nombres propios y términos técnicos.
- **Cons**: no captura sinónimos ni semántica.

### 2. Dense retrieval (semántico)

Busca por **similitud de embeddings**.

- **Pros**: captura semántica, encuentra "perro" cuando buscas "can".
- **Cons**: falla en nombres propios y tecnicismos raros.

### 3. Hybrid retrieval

Combina BM25 con dense retrieval. La práctica ganadora.

```python
# Pseudo-código de hybrid retrieval
def hybrid_search(query, k=10):
    bm25_results = bm25_index.search(query, k=k)
    semantic_results = vector_index.search(query_embedding, k=k)
    
    # Combinar con Reciprocal Rank Fusion
    combined = reciprocal_rank_fusion([
        bm25_results, semantic_results
    ])
    return combined[:k]
```

> [!tip] Hybrid es casi siempre mejor
> El libro insiste en que, hoy por hoy, **hybrid retrieval gana a cualquier versión pura** en la mayoría de benchmarks. La razón: BM25 captura lo que embeddings no capturan y viceversa.

## Bases de datos vectoriales

Donde se almacenan los embeddings. Las principales opciones:

### Open-source locales

- **FAISS** (Meta): librería, no servidor.
- **Qdrant**: servidor completo, open-source.
- **Milvus**: servidor completo, open-source.
- **Weaviate**: open-source, con módulos de búsqueda híbrida.

### Gestionadas

- **Pinecone**: pago, fácil de escalar.
- **Weaviate Cloud**: managed de Weaviate.
- **Chroma**: open-source friendly, también managed.
- **pgvector**: extensión de PostgreSQL, ideal si ya usas Postgres.

### Cómo elegir

- **Volumen bajo**: cualquier opción sirve.
- **Volumen alto + latencia crítica**: Pinecone, Qdrant cluster.
- **Ya tienes Postgres**: pgvector es lo más simple.
- **Multimodal**: Weaviate, Milvus.
- **Coste cero**: FAISS local.

## Query rewriting

La query del usuario rara vez es la mejor query para el retrieval. Técnicas para mejorarla:

### Query expansion

Generar variantes de la query antes de buscar.

```text
Query original: "¿Cómo cambio la contraseña?"
Variantes:
- "procedimiento para cambiar contraseña"
- "reset password"
- "cambiar clave de acceso"
```

### Multi-query

Hacer varias búsquedas con queries distintas y combinar los resultados.

### HyDE (Hypothetical Document Embeddings)

Generar **una respuesta hipotética** con el LLM, embedirla y buscar con eso. La intuición: la respuesta hipotética está más cerca de los documentos relevantes que la pregunta.

```python
def hyde_search(query, vector_index, llm):
    # 1. Generar respuesta hipotética
    hypothetical = llm.generate(
        f"Responde a esta pregunta de forma informativa: {query}"
    )
    
    # 2. Embedir la hipotética
    hypo_embedding = embed(hypothetical)
    
    # 3. Buscar con la hipotética
    return vector_index.search(hypo_embedding, k=10)
```

### Step-back prompting

Hacer una pregunta más general antes de la específica:

```text
Pregunta: "¿Cuál es la tasa de cancelación del plan Enterprise en 2024?"
Step-back: "¿Cuáles son las métricas clave de negocio?"

Buscar con la pregunta original Y la step-back.
```

## Reranking

El primer retrieval devuelve muchos candidatos. Un **reranker** los reordena por relevancia.

### Two-stage retrieval

1. **Stage 1**: retrieval rápido (BM25 o dense) → top-100.
2. **Stage 2**: reranker lento pero preciso → top-10.

### Rerankers populares

- **Cohere Rerank**: el más usado en producción.
- **bge-reranker** (BAAI): open-source.
- **Cross-encoders**: modelos que miran query y documento juntos.

> [!tip] Reranking mejora mucho la calidad
> El libro reporta que añadir un reranker típicamente mejora la calidad del retrieval un 10-20%. Es una de las optimizaciones con mejor ratio coste/mejora.

## Técnicas de optimización adicionales

### Compresión de contexto

Pasar al modelo solo los **fragmentos relevantes** de los chunks, no el chunk entero.

```python
def compress_chunk(chunk, query):
    """Extrae solo las partes del chunk relacionadas con la query."""
    sentences = chunk.split(". ")
    relevant = []
    for sentence in sentences:
        if is_relevant(sentence, query):
            relevant.append(sentence)
    return ". ".join(relevant)
```

### Generación de citaciones

Para que el usuario pueda verificar, incluye en el prompt instrucciones de citar fuentes:

```text
Responde a la pregunta usando SOLO la información del contexto.
Cita los documentos entre corchetes: [doc_1], [doc_2].
```

### Validación de la respuesta

Después de generar, verificar que la respuesta está respaldada por el contexto:

```python
def verify_answer(answer, context, llm):
    prompt = f"""
    ¿La siguiente respuesta está respaldada por el contexto?
    
    Contexto: {context}
    Respuesta: {answer}
    
    Responde VERDADERO o FALSO con explicación.
    """
    return llm.generate(prompt)
```

## RAG más allá del texto

El libro cierra la sección con extensiones a otros formatos.

### RAG multimodal

- **Imágenes**: usar modelos como CLIP para embedir imágenes y texto en el mismo espacio.
- **Tablas**: convertir tablas a texto descriptivo o tablas a DataFrames con summaries.
- **Audio**: transcribir con Whisper, después RAG estándar sobre la transcripción.

### RAG sobre código

- Indexar funciones en lugar de archivos enteros.
- Embedir con modelos específicos de código (CodeBERT, StarEncoder).
- Retrieval por similitud semántica + filtros por lenguaje.

### RAG estructurado

Combinar retrieval semántico con **filtros SQL**:

```python
# Vector search + metadata filter
results = vector_index.search(
    query_embedding,
    filter={"category": "legal", "year": 2024},
    k=10
)
```

Esto es **extremadamente potente** en empresas: puedes hacer "búscame documentos jurídicos de 2024 sobre X".

## Cuándo RAG no es la solución

El libro es claro con las **contraindicaciones**:

- ❌ Cuando el modelo **no tiene la capacidad base** para la tarea (RAG no convierte un modelo malo en bueno).
- ❌ Cuando necesitas **estilo o comportamiento específico** que el modelo no tiene (mejor fine-tuning).
- ❌ Cuando necesitas **latencia sub-100ms** y la búsqueda en vectores añade overhead.
- ❌ Cuando la base de conocimiento es **tan grande que no cabe en el contexto** aunque la filtres.

> [!question] RAG vs fine-tuning
> La regla práctica: si tu problema es "el modelo no **sabe** algo", RAG. Si tu problema es "el modelo no **hace** algo (formato, estilo, comportamiento)", fine-tuning. Para la mayoría de productos, RAG es más barato y efectivo. Fine-tuning entra cuando RAG ha llegado a su techo.

## Resumen en tres frases

- RAG es la técnica más usada para dar contexto actualizado y privado a un foundation model, con tres componentes: indexing, retrieval, generación.
- La calidad del RAG depende de chunking, embeddings, query rewriting y reranking; hybrid retrieval + reranker es el patrón ganador en la mayoría de casos.
- RAG funciona para texto, pero también para imágenes, tablas y código con las adaptaciones adecuadas. Cuando llega a su techo, pasamos a fine-tuning (próximas notas).

## Próximos pasos

- [[10-agentes|Agentes]]: dar el salto de "el modelo responde con contexto" a "el modelo toma acciones en otros sistemas". Otra superficie, otros riesgos, otras técnicas.
