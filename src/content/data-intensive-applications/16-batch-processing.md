---
title: "Batch processing"
description: "El paradigma clásico del procesamiento a escala: Unix tools, MapReduce y los Dataflow engines (Spark, Flink, Dataflow)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, batch, mapreduce, spark, flink, dataflow]
---

# Batch processing

> [!abstract] Resumen
> El procesamiento por lotes es el paradigma clásico para tratar **grandes volúmenes de datos**: ejecuta un trabajo que lee un dataset, lo transforma y escribe el resultado. Esta nota cubre los Unix tools como ancestros, MapReduce como primer framework distribuido, los Dataflow engines modernos (Spark, Flink, Dataflow) y los patrones de uso.

## El paradigma batch

El libro define el batch processing por contraste con los sistemas online:

```text
Online (OLTP/OLAP):

  Request ──► Process ──► Response
  Latencia: ms-seg

Batch:

  Input ──► Process ──► Output
  Latencia: minutos-horas
```

> [!note> Batch es para análisis masivos
> El batch es adecuado cuando el **volumen es alto** y la **latencia tolerada** es de minutos a horas. Pensado para **ETL, agregaciones, índices, modelos**.

## Unix tools como ancestros

El libro arranca con una observación sorprendente: las **Unix tools** son un sistema de batch processing.

```bash
# Conteo de palabras
cat archivo.txt | grep -o '[a-zA-Z]*' | sort | uniq -c | sort -nr | head -10
```

### Por qué Unix es importante

| Concepto Unix | Equivalente moderno |
|---|---|
| `cat` | Input |
| `grep` | Filter |
| `sort` | Sort |
| `uniq` | Group by |
| `awk` | Map |
| `wc` | Reduce |

> [!quote] "Unix es el padre de los sistemas de batch processing."
> El libro lo dice en serio: los pipelines de Unix inspiraron MapReduce, los Dataflow engines, y los query engines modernos.

### Limitaciones de Unix

- **Una máquina**: los datos deben caber en un servidor.
- **Sin tolerancia a fallos**: si la tubería se cae, hay que empezar de cero.
- **Sin coordinación**: difícil expresar computaciones complejas.

## MapReduce

El paper seminal de Google (2004) que popularizó el batch processing distribuido.

### Modelo de programación

```python
def map(key, value):
    """Para cada registro, emite un par (clave, valor)."""
    for word in value.split():
        yield (word, 1)

def reduce(key, values):
    """Para cada clave, agrega los valores."""
    yield key, sum(values)
```

### Ejecución distribuida

```text
MapReduce job:

1. Map: procesa input, emite pares (k, v).
2. Shuffle: reagrupa por clave.
3. Reduce: agrega por clave.
4. Output: escribe el resultado.
```

### Propiedades

- **Tolerancia a fallos**: si un nodo falla, su trabajo se replanifica.
- **Escalabilidad**: añadir nodos = más capacidad.
- **Simplicidad**: el modelo es sorprendentemente simple.

```text
MapReduce execution:

  ┌────────────┐
  │   Input    │
  └────┬───────┘
       │
  ┌────┴────────────────────────┐
  ▼        ▼        ▼        ▼
Map 1    Map 2    Map 3    Map 4   (paralelo)
  │        │        │        │
  └────┬───┴────┬───┴────┬───┘
       │        │        │
       ▼        ▼        ▼
    Shuffle (por clave)
       │
  ┌────┴────────────────────────┐
  ▼        ▼        ▼        ▼
Reduce 1 Reduce 2 Reduce 3 Reduce 4
  │        │        │        │
  └────┬───┴────┬───┴────┬───┘
       ▼        ▼        ▼
    Output final
```

> [!tip> MapReduce es educación
> Hadoop (basado en MapReduce) sigue siendo importante en empresas con datos masivos. Spark lo ha reemplazado en gran parte porque es más rápido y más fácil de programar.

## Implementaciones de MapReduce

### Hadoop MapReduce

- **El original**: código open-source desde 2006.
- **YARN**: gestor de recursos.
- **Hive**: SQL sobre MapReduce.
- **Pig**: scripting sobre MapReduce.

### Spark

- **RDD** (Resilient Distributed Dataset): abstracción principal.
- **In-memory**: mucho más rápido que MapReduce en disco.
- **Lazy evaluation**: las operaciones se planifican y optimizan.
- **API**: Scala, Python (PySpark), Java, R.

```python
# Spark WordCount
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("WordCount").getOrCreate()

text = spark.read.text("file.txt")
words = text.selectExpr("explode(split(value, ' ')) as word")
counts = words.groupBy("word").count()
counts.show()
```

### Tez

- **Modelo DAG**: Directed Acyclic Graph.
- **Más flexible** que MapReduce.
- **Backend para Hive** en muchos deployments.

### Dataflow engines

El libro introduce los **dataflow engines** como evolución:

- **Apache Flink**: stream-first, batch over stream.
- **Google Cloud Dataflow**: managed, soporta Flink y Spark.
- **Apache Beam**: SDK unificado que corre en Flink, Spark, Dataflow.

```python
# Apache Beam
import apache_beam as beam

with beam.Pipeline() as pipeline:
    words = (pipeline
        | 'Read' >> beam.io.ReadFromText('file.txt')
        | 'Split' >> beam.FlatMap(lambda line: line.split())
        | 'Count' >> beam.combiners.Count.PerElement()
        | 'Write' >> beam.io.WriteToText('output'))
```

## Patrones de uso

El libro describe los patrones de batch processing:

### 1. ETL (Extract, Transform, Load)

```text
ETL:

  Source DB ──► extract ──► transform ──► load ──► Warehouse
```

El patrón clásico de data warehousing.

### 2. Log analysis

```text
Log analysis:

  Logs ──► Parse ──► Filter ──► Aggregate ──► Dashboard
```

Procesar logs de servidores, aplicaciones, eventos.

### 3. Recommendation

```text
Recommendation (batch):

  Events ──► Build user profile ──► Compute similarities ──► Save to DB
```

### 4. Index building

```text
Index building:

  Documents ──► Tokenize ──► Build inverted index ──► Search engine
```

### 5. ML training

```text
ML training:

  Training data ──► Feature extraction ──► Train model ──► Save model
```

## Batch vs stream

El libroComparar:

```text
Batch                       Stream
────────────────────────────────
Latencia: minutos-horas       Latencia: ms-seg
Volumen: grande              Volumen: continúa
Coste: bajo por execution    Coste: alto (always-on)
Estado: inicia limpio        Estado: persistente
```

> [!tip> Complementarios, no excluyentes
> Batch y stream processing cubren **necesidades distintas**. La arquitectura moderna usa ambos: batch para lo masivo, stream para lo reactivo.

## Distributed filesystems

El batch processing requiere un **filesystem compartido** que los workers puedan leer.

```text
Sistemas:

- HDFS (Hadoop Distributed File System): the original.
- Amazon S3: object storage casi universal.
- Google Cloud Storage: similar.
- Azure Data Lake Storage: similar.
- MinIO: open-source, S3-compatible.
```

### Características de un buen filesystem para batch

- **Append-only**: writes son siempre al final.
- **Read in bulk**: lecturas eficientes sobre rangos.
- **Compartido**: todos los workers ven los mismos datos.
- **Tolerante a fallos**: replica los datos.

## Uso de Unix con archivos grandes

El libro da recomendaciones para Unix sobre datasets grandes:

```text
Tips:

- sort / uniq son eficientes.
- awk es más rápido que Python para operaciones simples.
- grep -o es la forma eficiente de buscar.
- Evita cat archivo | grep (grep ya lee archivos).
- Parallel: xargs -P, GNU parallel.
```

## Patrones de optimización

### 1. Reducer skew

Si una clave tiene muchos más valores, el reducer correspondiente tarda mucho.

```text
Skew:

  Claves: apple (10), banana (10), cherry (1000000)
  Reducer para cherry: mucho más lento.
```

**Solución**: pre-agregar, o random sampling.

### 2. Combiner

Reducción parcial en el mapper para reducir el tráfico al reducer.

```text
Combiner:

  Mapper: 100 pares (apple, 1)
  Combiner: agregar a (apple, 100)
  Reducer: recibe menos datos.
```

### 3. Data partitioning

Particionar los datos por alguna clave relevante.

```text
Partitioning:

  Datos particionados por user_id.
  Joins sobre user_id son locales.
```

### 4. Broadcasting

Replicar un dataset pequeño a todos los nodos.

```text
Broadcast:

  Tabla countries (1 MB): broadcast a 1000 nodos.
  vs shuffle: solo los nodos que la necesitan.
```

## Cost of batch processing

El libro señala que el batch es **rentable** para algunos workloads:

```text
Cost comparison:

  Real-time stream:  100 máquinas, 24/7        = running cost
  Batch:            10 máquinas, 1 h/día       = running cost / 24
```

> [!tip> El batch es la opción "económica"
> Si la latencia es tolerable, batch es la opción más barata. Para latencia baja, hay que pagar por streaming.

## Workflow managers

Coordinar jobs de batch complejos:

- **Apache Airflow**: el estándar de la industria.
- **Prefect**: modern, Python-native.
- **Dagster**: más moderno aún.
- **Luigi**: el veterano.

```python
# Airflow DAG
from airflow import DAG
from airflow.operators.bash import BashOperator

with DAG('etl', schedule_interval='@daily') as dag:
    extract = BashOperator(task_id='extract', bash_command='extract.sh')
    transform = BashOperator(task_id='transform', bash_command='transform.sh')
    load = BashOperator(task_id='load', bash_command='load.sh')
    
    extract >> transform >> load
```

## Beyond MapReduce

El libro destaca que los frameworks modernos han **superado** el modelo MapReduce en varios aspectos:

```text
MapReduce:

  - Pairs de (k, v) son restrictivos.
  - Joins son difíciles.
  - Machine learning es complejo.

Spark/Flink:

  - API rica (DataFrames, Datasets).
  - Joins optimizados.
  - ML libraries integradas.
```

> [!tip> MapReduce como educación
> MapReduce ya no es la opción por defecto. Pero entenderlo es **esencial** para entender cómo funciona el batch processing distribuido.

## Resumen en tres frases

- El **batch processing** es el paradigma para procesar grandes volúmenes de datos con latencia tolerable.
- **MapReduce** fue el primer framework popular. **Spark** y **Flink** han evolucionado el modelo sin perder la filosofía.
- Los **Dataflow engines** unifican batch y stream, representados por **Apache Beam** como SDK y **Flink/Dataflow** como runners.

## Próximos pasos

- [[17-stream-processing|Stream processing]]: el otro gran paradigma. Cómo procesar datos que llegan continuamente, con latencia de milisegundos y semánticas distintas.
