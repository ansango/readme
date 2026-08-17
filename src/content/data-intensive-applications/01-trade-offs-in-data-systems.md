---
title: "Trade-offs in data systems architecture"
description: "El marco que vertebra todo el libro: operacional vs analítico, data warehousing, cloud vs self-hosting, single-node vs distribuido. Por qué no hay respuestas universales"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [arquitectura, sistemas-distribuidos, datos, trade-offs, cloud]
---

# Trade-offs in data systems architecture

> [!abstract] Resumen
> DDIA abre con un capítulo que **enmarca** las decisiones del resto del libro. La idea central: en sistemas de datos todo es un trade-off. No existe "la mejor base de datos", sino "la base de datos apropiada para tu caso". Esta nota recorre los grandes ejes de decisión: operacional vs analítico, cloud vs self-hosting, single-node vs distribuido, microservices vs monolito.

## Por qué no hay respuestas universales

Kleppmann y Riccomini arrancan con la observación más importante del libro: **"It depends"**. Para cada decisión de arquitectura hay un trade-off, y el trade-off correcto depende del contexto. La tarea del ingeniero de datos no es recordar la respuesta correcta, sino:

1. **Identificar** los trade-offs en juego.
2. **Evaluar** cuál pesa más en tu caso.
3. **Decidir** con criterio.
4. **Documentar** la decisión para futuros colegas.

```text
Cada decisión de arquitectura tiene la estructura:

                ┌─────────────────────┐
                │   PROBLEMA A        │
                │   RESOLVER          │
                └──────────┬──────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
     ┌─────────────┐               ┌─────────────┐
     │  OPCIÓN A   │               │  OPCIÓN B   │
     │  (fuerte en)│               │  (fuerte en)│
     │  (débil en) │               │  (débil en) │
     └─────────────┘               └─────────────┘
            │                             │
            └──────────────┬──────────────┘
                           ▼
                ┌─────────────────────┐
                │  NUESTRA DECISIÓN   │
                │  (con justificación)│
                └─────────────────────┘
```

> [!note] No es cobardía
> Decir "depende" no es noResponder. Es **responder con el marco correcto**: identificar qué se pierde, qué se gana, qué se asume. Esa es la disciplina del ingeniero.

## Operacional vs analítico

El primer eje de decisión es el **tipo de carga** que va a soportar el sistema:

### Sistemas operacionales (OLTP)

- **Propósito**: soportar las operaciones del día a día. Procesar transacciones, servir consultas a usuarios finales.
- **Patrón de carga**: muchas escrituras pequeñas, muchas lecturas **por clave**. Latencia baja (milisegundos).
- **Volumen**: alto en número de operaciones, pero cada una toca **pocos registros**.
- **Ejemplo**: el sistema de reservas de una aerolínea, una tienda online, una aplicación móvil.

### Sistemas analíticos (OLAP)

- **Propósito**: soportar decisiones de negocio. Informes, dashboards, análisis de tendencias.
- **Patrón de carga**: pocas consultas (decenas a cientos), pero cada una escanea **millones de registros**.
- **Volumen**: pocas operaciones, pero cada una es **muy pesada**.
- **Ejemplo**: un data warehouse sobre el que corren informes trimestrales.

```text
OLTP vs OLAP:

                    OLTP                           OLAP
                 ┌──────────┐                   ┌───────────┐
Usuarios:        │ Millones │                   │ Decenas   │
Consultas:       │ Muchas   │                   │ Pocas     │
Tamaño:          │ Pequeñas │                   │ Grandes   │
Latencia:        │ 1-100 ms │                   │ 1-60 min  │
Datos:           │ Actuales │                   │ Históricos│
Uso:             │ Transacc.│                   │ Análisis  │
Fuente:          │ Eventos  │                   │ Agregados │
```

> [!tip] Mezclar cargas es el error clásico
> Si intentas servir consultas analíticas sobre una base OLTP, **ambas** sufren. La base se satura con escaneos masivos, y las operaciones diarias se ralentizan. La separación entre sistemas operacionales y analíticos es la razón de ser del **data warehouse**.

## Data warehousing

Un **data warehouse** es una base de datos dedicada a analítica. Su función es **separar** la carga analítica de la operacional. El patrón típico:

```
┌─────────────────┐
│  OLTP systems   │ (Postgres, MongoDB, etc.)
│  (producción)   │
└────────┬────────┘
         │ ETL/ELT
         │ (extract → load → transform)
         ▼
┌─────────────────┐
│  DATA WAREHOUSE │ (BigQuery, Snowflake, Redshift)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BI / analytics │ (Tableau, Looker, dashboards)
└─────────────────┘
```

### ETL vs ELT

Dos variantes del flujo:

- **ETL** (Extract → Transform → Load): se transforma **antes** de cargar. Bueno si la transformación es pesada y la base analítica no puede con ella.
- **ELT** (Extract → Load → Transform): se carga el dato crudo y se transforma **dentro** de la base. Bueno si la base analítica es potente (Snowflake, BigQuery) y quieres mantener transformaciones reproducibles.

## Sistemas de record vs derived data

El libro introduce una distinción que recorre toda la wiki: **datos de record** vs **datos derivados**.

### Datos de record (system of record)

- Son la **fuente de verdad** del negocio.
- Se **escriben** una vez y se **leen** muchas.
- Cualquier modificación es un **hecho nuevo** (no se borra lo antiguo).
- Ejemplo: la base de datos de clientes, el ledger de transacciones.

```sql
-- Tabla de clientes (datos de record)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- no hay updated_at a propósito:
    -- un cliente actualizado es un cliente nuevo
    -- (o se conserva la historia en una tabla aparte)
);
```

### Datos derivados (derived data)

- Se **calculan** a partir de los datos de record.
- Pueden **reconstruirse** desde la fuente.
- Ejemplo: el cache, los índices, los data warehouses, las vistas materializadas, los read models.

```sql
-- Vista materializada: derived data
CREATE MATERIALIZED VIEW daily_sales AS
SELECT
    date_trunc('day', created_at) AS day,
    SUM(amount) AS total
FROM orders
GROUP BY day;
```

> [!warning] La asimetría
> Los datos de record son **insustituibles**: si los pierdes, los pierdes. Los datos derivados son **descartables**: si los pierdes, los puedes regenerar. Es fundamental saber cuál es cuál en cada tabla.

## Cloud vs self-hosting

El libro dedica una sección importante a la comparación. La decisión ha evolucionado mucho desde la primera edición:

### Self-hosting

**Cuándo tiene sentido**:
- Requisitos regulatorios estrictos (datos que no pueden salir de tu infra).
- Volumen masivo y estable (la economía de escala evita pagar margen).
- Equipo grande con capacidad de operar sistemas complejos.
- Casos donde el **vendor lock-in** es prohibitivo.

**Coste oculto**: contratar personas expertas, mantener on-call, hacer backups, gestionar fallos.

### Cloud services

**Cuándo tiene sentido**:
- Volumen variable o impredecible.
- Equipo pequeño que no quiere operar infraestructura.
- Necesidad de iterar rápido sin gastar seis meses creando un equipo de operaciones.
- Casos donde el **time-to-market** es más importante que el coste a largo plazo.

**Coste oculto**: dependencia del proveedor, precios que pueden subir, capacidades limitadas por lo que el proveedor ofrece.

```text
Self-hosting            vs.            Cloud
─────────────                          ──────
Coste fijo                              Coste variable
Control total                          Control limitado
Operación pesada                       Operación delegable
Vendor lock-in: hardware               Vendor lock-in: API
Personas expertas necesarias            MenosOperations
Predecible                             Sorprendente
```

> [!tip] "Cloud native" no es "mejor"
> El libro es agnóstico. La decisión depende del **negocio**, no de la moda. Hay sistemas excelentes auto-hospedados y hay sistemas excelentes en cloud. Lo que cuenta es la **economía** y la **organización**.

### Cloud native architecture

Kleppmann describe la **cloud native architecture** como un estilo que asume cloud:

- **Stateless services**: los servicios no mantienen estado en memoria.
- **Managed databases**: usar RDS, Aurora, Cloud SQL en lugar de auto-hospedar.
- **Object storage**: S3, GCS, Azure Blob para datos no estructurados.
- **Serverless**: AWS Lambda, Cloud Functions, para lógica puntual.
- **Infrastructure as code**: Terraform, CloudFormation, Pulumi.

### Pros y contras del cloud

El libro enumera con cuidado:

**Pros**:
- Reducción del time-to-market.
- Escalado elástico (subir y bajar según demanda).
- Equipo de operaciones gestionado por el proveedor.
- Capacidad de probar cosas nuevas sin grandes compromisos.

**Contras**:
- Costes difíciles de predecir (especialmente egress).
- Vendor lock-in técnico.
- Latencia entre servicios cloud puede ser mayor.
- Compliance y auditoría más complejos.
- Requiere capacidades distintas en el equipo.

## Distribuido vs single-node

El libro aborda uno de los debates más importantes: ¿cuándo vale la pena **distribuir**?

### Single-node systems

Sorprendentemente actuales. Kleppmann destaca:

- **Más simple**: no hay coordinación entre nodos.
- **Más rápido**: no hay latencia de red.
- **Más consistente**: solo hay una copia de los datos.
- **Suficiente para muchos casos**: hasta cierto volumen, un solo servidor moderno con buen diseño es suficiente.

> [!quote] "La distribución es un coste, no un beneficio."
> No se distribuye porque sí. Se distribuye cuando la **escala excede** lo que un solo servidor puede manejar.

### Cuándo distribuir

- **Volumen de datos**: >10TB por máquina, o >100TB totales.
- **Volumen de queries**: >100K QPS sostenido.
- **Latency requirements**: <10ms en P99 globalmente.
- **High availability**: SLA >99.9%.

### Distributed systems don't exist

El libro toma prestada esta frase provocadora: en la práctica, **no construimos sistemas distribuidos**, ejecutamos **redes de sistemas single-node** que cooperan. La red no es confiable. La coordinación entre nodos es lenta. Los fallos son parciales.

```text
Arquitectura típica "distribuida":

┌──────────┐    ┌──────────┐    ┌──────────┐
│ Nodo 1  │◄──►│ Nodo 2  │◄──►│ Nodo 3  │
│ single  │    │ single  │    │ single  │
└──────────┘    └──────────┘    └──────────┘
       │              │              │
       └──────────────┼──────────────┘
                      ▼
              RED (no confiable)
```

> [!warning] La red no es confiable
> Esta es la observación fundamental del libro. Los sistemas distribuidos asumen que la red **va a fallar**. Por eso son complejos. Por eso los algoritmos tienen que tolerar fallos de comunicación. Por eso el consensus es difícil.

## Microservices vs monolito

El libro discute la moda de los **microservices** con sano escepticismo:

### Microservices

- **Ventajas**: deployments independientes, escalado independiente, equipos separados.
- **Problemas**: latencia entre servicios, complejidad operativa, consistencia eventual forzada, debugging distribuido.

### Monolito modular

- **Ventajas**: simplicidad operacional, latencia baja, debugging fácil.
- **Problemas**: deployments acoplados, escalado conjunto.

> [!tip] El consejo del libro
> Empieza con un **monolito bien estructurado** (módulos con interfaces claras). Dividir en microservicios **solo cuando duela**: cuando un equipo necesita desplegar independientemente, cuando una parte necesita escalar independientemente, cuando los límites organizativos lo exijan.

## Microservices vs serverless

El libro introduce también el **serverless** como opción:

- **Ventajas**: pago por uso, escalado automático, sin administración de servidores.
- **Problemas**: cold starts, vendor lock-in, debugging difícil, límites de tiempo y memoria.

## Cloud native y la era de la AI

La 2ª edición añade una reflexión sobre cómo la **AI** ha cambiado el panorama:

- Los **LLMs** y modelos de embeddings son ahora parte de la pila de datos.
- Los **vector embeddings** se almacenan en bases de datos especiales (Pinecone, Weaviate, Milvus).
- El **prompt engineering** y el **fine-tuning** son parte del workflow de datos.
- Los **sistemas de recomendación** y la **búsqueda semántica** añaden complejidad a la búsqueda tradicional.

> [!note] La IA no reemplaza los fundamentos
> Aunque la IA cambia algunos componentes, los principios del libro (consistencia, escalabilidad, mantenibilidad) siguen siendo válidos. La AI no es una varita mágica que esquiva los problemas de siempre.

## Resumen en tres frases

- En sistemas de datos, **todo es un trade-off**. La disciplina del ingeniero es identificar los trade-offs, evaluar el contexto y decidir con criterio.
- La separación entre **operacional y analítico** es la primera decisión que casi siempre hay que tomar. Mezclar las cargas es la fuente de muchos problemas.
- La **distribución** es un coste, no un beneficio. Solo se distribuye cuando la escala excede lo que un solo servidor puede manejar.

## Próximos pasos

- [[02-nonfunctional-requirements|Defining nonfunctional requirements]]: cómo decidir qué quiere decir "rápido", "fiable", "escalable" y "mantenible" en tu caso concreto. La base para tomar decisiones arquitectónicas con números reales.
