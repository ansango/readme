---
title: "Data models: grafos y triple stores"
description: "Cuando los datos están muy conectados: grafos de propiedades, Cypher, SPARQL, triple stores, event sourcing y bases de datos orientadas a eventos"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, modelos-de-datos, grafo, sparql, cypher, triple-store]
---

# Data models: grafos y triple stores

> [!abstract] Resumen
> Cuando los datos están **muy conectados** (redes sociales, grafos de conocimiento, sistemas de recomendación), el modelo relacional se queda corto. Esta nota cubre los modelos de grafos: grafos de propiedades (Neo4j), triple stores (RDF/SPARQL), y la familia de modelos basados en eventos (event sourcing).

## El problema de los datos muy conectados

El libro comienza con un ejemplo clásico: una **red social** con personas, ciudades, países, profesiones, hobbies. Las preguntas naturales son:

- ¿Quiénes son los amigos de los amigos de Ana que viven en Madrid?
- ¿Qué productos han comprado los usuarios interesados en coches eléctricos?
- ¿Qué películas ha visto Ana que también han visto personas con perfiles similares?

Estas preguntas requieren **joins múltiples**. En SQL, eso es costoso:

```sql
-- "Amigos de amigos de Ana que viven en Madrid"
SELECT DISTINCT friend_of_friend.id
FROM users ana
JOIN friendships f1 ON f1.user_a = ana.id
JOIN users friend ON f1.user_b = friend.id
JOIN friendships f2 ON f2.user_a = friend.id
JOIN users friend_of_friend ON f2.user_b = friend_of_friend.id
JOIN cities ON friend_of_friend.city_id = cities.id
WHERE ana.name = 'Ana'
  AND cities.name = 'Madrid';
```

> [!tip] Los joins caros son la señal
> Si tu código de aplicación pasa el tiempo haciendo joins múltiples, un modelo de grafos puede ser mejor. La ganancia es **encontrar los patrones una vez** y dejar que la base de datos optimice.

## Grafos de propiedades

Los grafos de propiedades (Neo4j, JanusGraph, Amazon Neptune) almacenan datos como **nodos** y **relaciones**, ambos con propiedades.

```cypher
// Crear un grafo en Cypher (Neo4j)
CREATE (ana:Person {name: 'Ana', age: 30})
CREATE (madrid:City {name: 'Madrid', country: 'Spain'})
CREATE (ana)-[:LIVES_IN]->(madrid)
CREATE (ana)-[:FRIENDS_WITH]->(bob:Person {name: 'Bob'})
CREATE (bob)-[:LIVES_IN]->(madrid)
```

### Lenguajes de query

- **Cypher** (Neo4j): el más usado. Sintaxis ASCII-art para grafos.
- **Gremlin** (Apache TinkerPop): lenguaje de recorrido procedural.
- **SPARQL** (W3C): para RDF (más sobre esto abajo).

```cypher
// "Amigos de amigos de Ana que viven en Madrid"
MATCH (ana:Person {name: 'Ana'})-[:FRIENDS_WITH]-(friend)-[:FRIENDS_WITH]-(fof)
WHERE (fof)-[:LIVES_IN]->(:City {name: 'Madrid'})
RETURN DISTINCT fof.name
```

### Ventajas de los grafos de propiedades

- **Naturaleza**: el modelo encaja con problemas como redes sociales, recomendaciones.
- **Rendimiento**: queries que serían multi-join en SQL son **traversals** en el grafo.
- **Flexibilidad**: añadir tipos de relación no requiere migrar el esquema.

### Limitaciones

- **Escala**: grafos distribuidos son difíciles (el traversals no son partitionable trivialmente).
- **Madurez**: menos de 20 años de historia comparado con relacional.
- **Ecosistema**: menos herramientas, menos consultores.

## Triple stores y RDF

El modelo **RDF** (Resource Description Framework) y los **triple stores** son la otra tradición de grafos, con raíces en la web semántica.

### El modelo triple

La unidad básica es el **triple**: `<sujeto, predicado, objeto>`.

```turtle
@prefix ex: <http://example.org/> .

ex:ana ex:name "Ana" ;
       ex:age 30 ;
       ex:livesIn ex:madrid .

ex:madrid ex:name "Madrid" ;
         ex:country ex:spain .
```

```sparql
-- SPARQL: "amigos de amigos de Ana que viven en Madrid"
PREFIX ex: <http://example.org/> .

SELECT DISTINCT ?fofName
WHERE {
    ex:ana ex:friendsWith ?friend .
    ?friend ex:friendsWith ?fof .
    ?fof ex:livesIn ?city .
    ?city ex:name "Madrid" .
    ?fof ex:name ?fofName .
}
```

### RDF Schema y OWL

RDF se usa típicamente con vocabularios estándar:

- **FOAF**: Friend of a Friend, para describir personas.
- **Dublin Core**: para describir documentos.
- **Schema.org**: vocabularios para la web.
- **OWL**: para razonamiento sobre ontologías.

### Web semántica

La idea original era que toda la web describiera sus datos en RDF enlazable. No funcionó como se esperaba, pero dejó:

- **Wikidata**: la base de conocimiento de Wikipedia.
- **Schema.org**: vocabularios adoptados por Google, Microsoft, Yahoo.
- **Knowledge graphs**: como el de Google, que mejora las búsquedas.

> [!note] RDF no es solo para la web
> Aunque la web semántica no cuajó, los triple stores siguen siendo útiles para **datos enlazados** (Linked Data), gestión de conocimiento y razonamiento.

### Limitaciones de RDF

- **Complejidad**: las URIs y los vocabularios añaden verbosidad.
- **Rendimiento**: los triple stores son más lentos que los grafos de propiedades.
- **Curva de aprendizaje**: SPARQL, OWL, RDF Schema... mucho que aprender.

## Comparación grafos vs relacional

El libro usa un ejemplo práctico para mostrar la diferencia:

```sql
-- SQL: encontrar los amigos de los amigos de los amigos de Ana
WITH RECURSIVE friends AS (
    SELECT friend_id, 1 AS depth
    FROM users JOIN friendships ON users.id = friendships.user_a_id
    WHERE users.name = 'Ana'
    UNION ALL
    SELECT f.friend_id, friends.depth + 1
    FROM friends
    JOIN friendships f ON f.user_a_id = friends.friend_id
    WHERE friends.depth < 3
)
SELECT DISTINCT users.name FROM users
JOIN friends ON users.id = friends.friend_id
WHERE friend_id != (SELECT id FROM users WHERE name = 'Ana');
```

```cypher
// Cypher: lo mismo
MATCH (ana:Person {name: 'Ana'})-[:FRIENDS_WITH*1..3]-(fof)
WHERE fof <> ana
RETURN DISTINCT fof.name;
```

> [!tip] La misma query, la mitad de código
> En grafos, la query es **una línea**. Sobre todo cuando la profundidad es variable.

## Event sourcing

El libro cubre también el modelo **event sourcing**, donde los datos no son un estado actual sino una **secuencia de eventos**.

### Concepto

En lugar de guardar "el saldo actual del cliente es 100€", guardas:

```
"2024-01-15 10:00: depósito de 50€"
"2024-01-20 14:30: retirada de 30€"
"2024-02-01 09:15: depósito de 80€"
```

El estado actual (100€) se **deriva** de los eventos.

```text
Event sourcing:

Eventos (inmutables):          Estado actual (derivado):
  - depósito 50€                  ──────────────
  - retirada 30€                  Saldo: 100€
  - depósito 80€                  
```

### Ventajas

- **Auditoría completa**: puedes reconstruir el estado en cualquier momento.
- **Eventos son inmutables**: añadir datos no corrompe los anteriores.
- **Análisis retrospectivo**: puedes hacer preguntas que no anticipaste.

### Limitaciones

- **Complejidad**: reconstruir el estado requiere **playback** de eventos.
- **Eventos cambian**: ¿qué pasa cuando un evento tiene un error?
- **Performance**: los reads requieren acceder a muchos eventos.

> [!note] Kafka como log de eventos
> Kafka es la implementación más popular de event sourcing. Los tópicos de Kafka son logs de eventos inmutables. Los streams de Kafka procesan esos eventos para producir estado actual.

## CQRS (Command Query Responsibility Segregation)

Un patrón asociado a event sourcing: separar las **escrituras** del modelo de las **lecturas**.

```text
                ┌──────────────┐
                │   Events    │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼                             ▼
   ┌─────────┐                  ┌─────────┐
   │ Write   │                  │ Read    │
   │ model   │                  │ model   │
   └─────────┘                  └─────────┘
   (normalizado)               (desnormalizado)
```

- **Write model**: optimizado para ingestión, normalizado.
- **Read model**: optimizado para consulta, desnormalizado.
- **Sync**: el read model se actualiza a partir de los eventos.

> [!tip] CQRS no es obligatorio
> CQRS funciona bien cuando los patrones de escritura y lectura son muy distintos (e.g., muchas escrituras, pocas lecturas agregradas). Para sistemas simples, es sobre-ingeniería.

## Cuándo elegir grafos

El libro resume con criterio:

| Caso | Modelo |
|---|---|
| Cualquier cosa tabular | **Relacional** |
| Schema flexible, datos jerárquicos | **Documental** |
| Red social, recomendaciones, knowledge graph | **Grafo de propiedades** |
| Linked data, vocabularios estándar, ontologías | **Triple store (RDF)** |
| Auditoría, eventos, dominio event-driven | **Event sourcing** |
| Sistemas con escritura rápida y lectura agregada | **CQRS + event sourcing** |

> [!question] ¿Multiple modelos?
> En la práctica, los sistemas modernos usan **varios modelos**: PostgreSQL para lo transaccional, MongoDB para semi-estructurado, Neo4j para grafos, Kafka para eventos. La clave es **conocer los trade-offs** y elegir con criterio.

## Resumen en tres frases

- Los **grafos de propiedades** (Neo4j, Cypher) son ideales para redes y datos muy conectados con queries de traversals.
- Los **triple stores** (RDF, SPARQL) sirven para linked data y vocabularios estándar, pero son más complejos.
- El **event sourcing** cambia el modelo fundamental: en lugar de estado actual, guardas la historia. Es poderoso pero requiere disciplina.

## Próximos pasos

- [[05-storage-and-retrieval-oltp|Storage and retrieval (OLTP)]]: cómo se almacenan los datos en disco. Log-structured, B-trees, LSM-trees, índices secundarios. La parte física del modelo de datos.
