---
title: "Data models: relacional vs documento"
description: "El debate clásico de los modelos de datos, el object-relational mismatch, la normalización y cuándo cada modelo gana"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, modelos-de-datos, sql, nosql, document]
---

# Data models: relacional vs documento

> [!abstract] Resumen
> La elección del modelo de datos condiciona todo lo demás: cómo se expresa la aplicación, qué garantías ofrece la base de datos, cómo se escala. Kleppmann y Riccomini revisan los principales modelos: relacional, documental, grafo y triple stores. Esta nota cubre los dos primeros y la cuestión de la normalización.

## Por qué el modelo importa

El libro arranca con una afirmación que parece obvia y rara vez se examina: **el modelo de datos determina cómo pensamos sobre el problema**. Un sistema modelado en tablas relacionales hace fácil unas preguntas y difíciles otras. Lo mismo ocurre con el modelo documental o el modelo de grafos.

> [!quote] "Cada capa de abstracción es una manera de restringir lo que puedes hacer."
> Un buen modelo de datos es el que **encaja** con el problema y permite evolucionar.

## El modelo relacional

El modelo relacional, propuesto por **Edgar Codd** (1970) y encarnado en SQL, dominó la informática empresarial durante cuarenta años. Sus principios:

- Los datos se organizan en **tablas** (relaciones).
- Cada tabla tiene filas (**tuplas**) y columnas (**atributos**).
- Las relaciones entre tablas se expresan con **claves foráneas**.
- El álgebra relacional define operaciones formales (selección, proyección, join).

```sql
-- Tabla de clientes (modelo relacional)
CREATE TABLE customers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total       DECIMAL(10, 2) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    status      VARCHAR(50) NOT NULL
);
```

### Ventajas del modelo relacional

- **Madurez**: 50 años de optimización, herramientas, conocimiento.
- **Consistencia**: las transacciones ACID están bien definidas (las vemos en [[11-transactions-isolation|transactions]]).
- **Flexibilidad**: SQL es un lenguaje potente que permite combinaciones no anticipadas.
- **JOINs**: combinar datos de múltiples tablas es directo y eficiente.

### Limitaciones

- **Impedance mismatch**: los objetos en una aplicación no encajan naturalmente en tablas.
- **Rigidez de esquema**: cambiar el esquema requiere migración.
- **Ineficiencia para datos jerárquicos**: modelar un árbol de comentarios requiere varias tablas y joins.

## El modelo documental

El modelo documental (MongoDB, CouchDB, Couchbase, DynamoDB) almacena los datos como **documentos** auto-contenidos, típicamente en formato JSON.

```json
// Un "cliente" en modelo documental
{
    "id": "user-123",
    "name": "Ana García",
    "email": "ana@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "orders": [
        { "id": 1, "total": 99.99, "items": [...] },
        { "id": 2, "total": 149.50, "items": [...] }
    ],
    "preferences": {
        "language": "es",
        "notifications": true
    }
}
```

### Ventajas del modelo documental

- **Esquema flexible**: cada documento puede tener campos diferentes.
- **Datos auto-contenidos**: una sola consulta trae todo lo necesario.
- **Modelo cercano a los objetos**: encaja con la programación orientada a objetos.
- **Rendimiento para casos concretos**: menores joins, menos latencia.

### Limitaciones

- **JOINs limitados**: las bases documentales no están optimizadas para joins.
- **Consistencia**: las transacciones multi-documento son más recientes y menos robustas.
- **Actualizaciones parciales**: actualizar un sub-documento requiere cuidadoso manejo.

> [!tip] MongoDB no es lo que era
> MongoDB ha evolucionado mucho. Tiene transacciones multi-documento (desde 4.0), índices, agregaciones. La diferencia con relacional se ha estrechado. Pero la **mentalidad** sigue siendo distinta.

## El object-relational mismatch

El libro describe con detalle el **impedance mismatch**: la dificultad de mapear objetos en aplicaciones a tablas relacionales.

```python
# Un objeto en Python
class User:
    def __init__(self, id, name, email, orders=[], preferences={}):
        self.id = id
        self.name = name
        self.email = email
        self.orders = orders  # lista de Order
        self.preferences = preferences  # dict

# ¿Cómo guardar este objeto en SQL?
# Opción 1: una tabla con todos los campos aplanados
# Opción 2: varias tablas con JOINs
# Opción 3: JSON serializado en una columna
```

### Las tres opciones

| Opción | Ventajas | Desventajas |
|---|---|---|
| **Aplanar** | Consultas rápidas | Datos duplicados, anomalías de actualización |
| **JOINs** | Normalización, sin duplicación | Más consultas, latencia mayor |
| **JSON en columna** | Cercano al objeto, flexible | Pierde capacidades SQL |

> [!note] No hay bala de plata
> Cada opción tiene un trade-off. El libro insiste en que la decisión depende del **patrón de consulta** dominante de la aplicación.

## Normalización

La **normalización** es el proceso de diseñar tablas para evitar **anomalías** (problemas al actualizar datos).

### Las formas normales

**Primera forma normal (1NF)**: cada columna contiene un valor atómico (no listas).

```sql
-- MAL: viola 1NF (lista en una columna)
CREATE TABLE orders (
    id INTEGER,
    product_ids VARCHAR(255)  -- "1,2,3,4"
);

-- BIEN: 1NF (una fila por producto)
CREATE TABLE orders (
    id INTEGER,
    product_id INTEGER
);
```

**Segunda forma normal (2NF)**: 1NF + cada columna no-clave depende de la clave completa.

**Tercera forma normal (3NF)**: 2NF + no hay dependencias transitivas.

**Forma normal de Boyce-Codd (BCNF)**: 3NF con restricciones más estrictas.

### Cuándo desnormalizar

El libro es claro: la normalización es la **disciplina por defecto**, pero hay casos donde desnormalizar tiene sentido:

- **Rendimiento**: si los JOINs son la operación más cara, desnormalizar puede ser correcto.
- **Lectura/escritura asimétrica**: si escribes poco y lees mucho, desnormalizar es bueno.
- **Reporting**: para data warehouses, la desnormalización es la norma.

> [!tip] El data warehouse es un desnormalizado por diseño
> Star schema, snowflake schema, tablas anchas: todo eso es desnormalización controlada. El data warehouse **no** debe seguir las formas normales de OLTP.

## SQL y la flexibilidad

El libro destaca que SQL, pese a su fama de rígido, es bastante flexible:

- **JSON support**: Postgres, MySQL y otros tienen columnas JSON nativas con índices.
- **Vistas**: abstracciones que ocultan la complejidad.
- **Funciones definidas por el usuario**: lógica en la base.
- **Extensiones**: PostGIS, pgvector, etc.

```sql
-- Postgres: columna JSON con índice
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_events_data ON events USING GIN (data);

-- Consulta con JSON
SELECT * FROM events
WHERE data->>'type' = 'purchase'
  AND (data->>'amount')::numeric > 100;
```

## Cuándo cada modelo

El libro resume con un cuadro equilibrado:

| Caso | Modelo recomendado |
|---|---|
| Datos tabulares, transacciones, reporting estándar | **Relacional** |
| Datos jerárquicos naturales, esquemas cambiantes | **Documental** |
| Datos muy conectados, muchos joins | **Grafo** (lo vemos en otra nota) |
| Datos estructurados con esquema estable | **Relacional** |
| Prototipado rápido, esquema desconocido | **Documental** |
| Datos analíticos con muchas agregaciones | **Columnar** (warehouse) |

> [!warning] Los lenguajes de modelo importan
> El modelo de datos se expresa en un **lenguaje**. SQL es muy maduro. Los lenguajes de las bases documentales son variados (MongoDB Query Language, DynamoDB Query, etc.). La elección del lenguaje puede importar más que la del modelo.

## Híbridos en la práctica

El libro insiste en una observación importante: pocas empresas modernas usan **un solo** modelo. Lo típico:

- **Postgres** para datos estructurados críticos.
- **MongoDB** o **DynamoDB** para datos semi-estructurados.
- **Elasticsearch** para búsqueda.
- **Redis** para cache.
- **BigQuery / Snowflake** para analytics.

```text
Sistema real típico:

┌─────────────────────────────────────────────┐
│            Aplicación                       │
└──────────┬──────────┬──────────┬─────────────┘
           │          │          │
           ▼          ▼          ▼
       ┌──────┐  ┌──────┐  ┌──────────┐
       │Postgres│ │Redis │  │MongoDB   │
       │OLTP   │  │cache │  │documentos │
       └──────┘  └──────┘  └──────────┘
           │
           ▼
       ┌──────────────┐
       │  BigQuery    │
       │  warehouse   │
       └──────────────┘
```

> [!tip] Polyglot persistence
> El término técnico para usar múltiples bases de datos en el mismo sistema. Es la norma, no la excepción. La complejidad operativa es real; el libro advierte contra ella.

## Resumen en tres frases

- El **modelo relacional** (SQL) es la elección por defecto para datos estructurados con transacciones.
- El **modelo documental** (MongoDB, DynamoDB) brilla con datos jerárquicos y esquemas cambiantes.
- En la práctica, los sistemas modernos usan **polyglot persistence**: varias bases de datos, cada una para lo que mejor sabe hacer.

## Próximos pasos

- [[04-data-models-graph-y-triple-stores|Data models: grafos y triple stores]]: cuando los datos están muy conectados y los joins se vuelven prohibitivos. Grafos de propiedades, Cypher, SPARQL y triple stores.
