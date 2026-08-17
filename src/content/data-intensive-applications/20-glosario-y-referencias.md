---
title: "Glosario y referencias"
description: "Glosario de términos del libro, bibliografía ampliada y lecturas recomendadas para profundizar en cada tema"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, glosario, referencias, lecturas]
---

# Glosario y referencias

> [!abstract] Resumen
> Esta nota es la **herramienta de referencia** de la wiki. Un glosario de los términos técnicos más usados en el libro, una bibliografía ampliada para profundizar en cada capítulo y referencias complementarias para casos específicos.

## Cómo usar esta nota

El glosario es de **búsqueda rápida**: cuando un término en una nota te resulte confuso, vuelve aquí. La bibliografía es para **profundizar**: si un capítulo te interesa más, aquí tienes por dónde seguir.

## Glosario

### A

- **ACID**: Atomicity, Consistency, Isolation, Durability. Propiedades de las transacciones.
- **Aggregation**: operación que combina varios registros (SUM, AVG, COUNT).
- **Anti-entropy**: proceso en background que sincroniza réplicas.
- **API**: Application Programming Interface.
- **Append-only**: estructura que solo permite añadir al final.

### B

- **Backpressure**: mecanismo para que un productor lento no sature a un consumidor.
- **B-tree**: estructura de datos de almacenamiento, base de la mayoría de RDBMS.
- **Batch processing**: procesar grandes volúmenes de datos en grupos.
- **Bloom filter**: estructura de datos probabilística para membership testing.

### C

- **CDC**: Change Data Capture. Captura cambios de una BD y los emite como eventos.
- **Ceph**: sistema de archivos distribuido.
- **Checkpoint**: snapshot del estado de un sistema en un momento.
- **Chubby**: servicio de lock distribuido de Google.
- **Compaction**: proceso de combinar archivos de log en LSM-trees.
- **Consensus**: acuerdo entre nodos sobre un valor.
- **Consistency level**: garantía de lectura/escritura en Cassandra.
- **CRDT**: Conflict-free Replicated Data Type. Estructura sin conflictos.
- **Cursor**: mecanismo de paginación en queries.

### D

- **Data lake**: almacenamiento masivo de datos crudos.
- **Data pipeline**: flujo de datos de origen a destino.
- **Data warehouse**: base de datos optimizada para análisis.
- **DDIA**: Designing Data-Intensive Applications. Este libro.
- **Deadlock**: dos procesos bloquean mutuamente.
- **Derived data**: datos calculados a partir de otros.
- **Distributed lock**: lock que funciona entre procesos en nodos distintos.
- **DTDL**: Digital Twin Definition Language.

### E

- **ETL**: Extract, Transform, Load.
- **ELT**: Extract, Load, Transform.
- **Event sourcing**: patrón donde el estado se deriva de eventos.
- **Exactly-once**: garantía de que un mensaje se procesa exactamente una vez.

### F

- **Failover**: cambio automático a un sistema de respaldo.
- **Fault tolerance**: capacidad de operar con fallos.
- **Flink**: motor de stream processing.
- **FQDN**: Fully Qualified Domain Name.

### G

- **Garbage Collection**:回收 automático de memoria.
- **GDPR**: General Data Protection Regulation. Regulación europea de privacidad.
- **Gossip**: protocolo de comunicación epidemics-style.

### H

- **HDFS**: Hadoop Distributed File System.
- **HNSW**: Hierarchical Navigable Small World. Algoritmo de ANN.
- **Holt-Winters**: método de forecasting.

### I

- **Idempotency**: propiedad que permite aplicar una operación varias veces con el mismo resultado.
- **Inverted index**: estructura que mapea términos a documentos.
- **Isolation level**: nivel de garantía de aislamiento en transacciones.

### J

- **JDBC**: Java Database Connectivity.
- **JSON**: JavaScript Object Notation. Formato de datos.

### K

- **Kafka**: message broker / log distribuido.
- **Kafka Streams**: API para procesar streams en Kafka.

### L

- **Lambda architecture**: combinar batch + stream para datos.
- **Leader**: nodo principal en una replicación.
- **Linearizability**: consistencia más fuerte: lecturas ven la última escritura.
- **Log-structured**: almacenamiento append-only.
- **LSM-tree**: Log-Structured Merge Tree. Estructura de almacenamiento.

### M

- **MapReduce**: modelo de programación para batch processing.
- **Materialized view**: vista computada y almacenada.
- **Monotonic clock**: reloj que nunca va hacia atrás.
- **MVCC**: Multiversion Concurrency Control.

### N

- **NTP**: Network Time Protocol. Sincronización de relojes.
- **NoSQL**: "Not only SQL". Bases de datos no relacionales.

### O

- **OLTP**: Online Transaction Processing.
- **OLAP**: Online Analytical Processing.
- **ORM**: Object-Relational Mapping.
- **OSDI**: Symposium on Operating Systems Design and Implementation.

### P

- **Paxos**: algoritmo de consenso.
- **Pipeline**: secuencia de operaciones de datos.
- **Postgres**: PostgreSQL. RDBMS open-source.
- **Protobuf**: Protocol Buffers. Formato de serialización binario.

### Q

- **QoS**: Quality of Service.
- **Quorum**: mayoría de nodos en sistemas distribuidos.

### R

- **Raft**: algoritmo de共识.
- **RDBMS**: Relational Database Management System.
- **Read repair**: reparar réplicas tras una lectura.
- **Replication**: copia de datos entre nodos.
- **REST**: Representational State Transfer.
- **RHS**: Right Hand Side.

### S

- **S3**: Simple Storage Service (AWS).
- **Saga**: secuencia de transacciones con compensaciones.
- **ScyllaDB**: base NoSQL compatible con Cassandra.
- **Shard**: partición de datos.
- **SI**: Snapshot Isolation.
- **Single-leader**: replicación con un líder.
- **Snapshot**: copia del estado en un momento.
- **SST**: Sorted String Table.
- **SSI**: Serializable Snapshot Isolation.
- **Stream processing**: procesar datos en continuo.

### T

- **TLA+**: especificación formal para sistemas concurrentes.
- **TCP**: Transmission Control Protocol.
- **Throughput**: cantidad de datos procesados por unidad de tiempo.
- **TTL**: Time To Live.
- **Two-phase commit (2PC)**: protocolo de transacciones distribuidas.

### U

- **UUID**: Universal Unique Identifier.
- **UPSERT**: INSERT OR UPDATE.

### V

- **Vector clock**: estructura para tracking causalidad.
- **Vertex**: nodo en un grafo.
- **VPC**: Virtual Private Cloud.

### W

- **WAL**: Write-Ahead Log.
- **WASM**: WebAssembly.
- **Window**: rango temporal en stream processing.

### X

- **XA**: eXtended Architecture. Estándar de transacciones distribuidas.

### Y

- **YAML**: YAML Ain't Markup Language. Formato de serialización.

### Z

- **Zab**: ZooKeeper Atomic Broadcast.
- **ZooKeeper**: servicio de coordinación.

## Bibliografía ampliada

Para profundizar en cada capítulo:

### Fundamentos y requisitos

- **CAP Theorem**: Gilbert, Lynch. *Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services*.
- **Designing Data-Intensive Applications**: este libro. (Kleppmann, O'Reilly 2017/2026).
- **System Design Interview** (vol 1, 2): Alex Xu. Práctico, con casos.

### Modelos de datos

- **Graph Databases** (Ian Robinson, O'Reilly). Neo4j y grafos de propiedades.
- **Foundations of databases** (Abiteboul, Hull, Vianu). El libro clásico.
- **SQL and Relational Theory** (C.J. Date). Pensamiento relacional puro.

### Storage

- **Database Internals** (Alex Petrov). B-trees, LSM-trees, distribuidos.
- **The Log-Structured Merge-Tree (LSM-Tree)** (O'Neil). Paper original.
- **Modern B-Tree Techniques** (Graefe. IEEE 2011).

### Codificación y replicación

- **Protocol Buffers documentation**. Google.
- **Apache Avro specification**. Avro project.
- **Kafka: The Definitive Guide** (Narkhede, Shapira, Palino). O'Reilly.

### Sharding

- **Cassandra: The Definitive Guide** (Carpenter, Hewitt). O'Reilly.
- **Pinterest: Manas' presentation on sharding**. En YouTube.

### Transactions

- **Concurrency Control and Recovery** (Bernstein, Hadzilacos, Goodman). El libro clásico.
- **A Critique of ANSI SQL Isolation Levels** (Berenson et al.).

### Sistemas distribuidos

- **Time, Clocks, and the Ordering of Events** (Lamport). Paper seminal.
- **Designing Data-Intensive Applications** (este libro, cap 8-9).
- **Distributed Systems** (Maarten van Steen, Andrew Tanenbaum). El libro introductorio.

### Consistency y consensus

- **Paxos Made Simple** (Lamport). El paper accesible.
- **Raft: In Search of an Understandable Consensus Algorithm** (Ongaro, Ousterhout).
- **Impossibility of Distributed Consensus with One Faulty Process** (Fischer, Lynch, Paterson). FLP.

### Batch y stream

- **MapReduce: Simplified Data Processing on Large Clusters** (Dean, Ghemawat). Paper original.
- **Learning Spark** (Karau, Warren, Zaharia). O'Reilly.
- **Kafka: The Definitive Guide** (Narkhede et al.).

### Filosofía y ética

- **The Age of Surveillance Capitalism** (Shoshana Zuboff). El libro definitivo.
- **Weapons of Math Destruction** (Cathy O'Neil). Sobre algoritmos y bias.
- **Privacy is Power** (Carissa Véliz). Una introducción accesible.

## Recursos online

### Blogs

- **Martin Kleppmann's blog**: https://martin.kleppmann.com/
- **High Scalability**: http://highscalability.com/
- **The Morning Paper**: papers relevantes comentados.

### Conferencias

- **Strange Loop**: anual, St. Louis. Sistemas distribuidos.
- **QCon**: múltiples ciudades. Engineering.
- **Ricon**: eventos pasados sobre NoSQL.

### Newsletters

- **DB Weekly**: https://dbweekly.com/
- **Data Engineering Weekly**: https://dataengineeringweekly.com/
- **Pragmatic Engineer**: https://newsletter.pragmaticengineer.com/

## Próximos pasos

- [[21-epilogo-y-claves|Epílogo y claves]]: cierre de la wiki. Las ideas recurrentes, las claves y cómo seguir profundizando.
