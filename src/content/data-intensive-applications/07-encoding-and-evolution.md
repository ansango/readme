---
title: "Encoding and evolution"
description: "Cómo se codifican los datos para que viajen entre servicios: JSON, Protobuf, Avro y los patrones de dataflow que los usan"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, encoding, json, protobuf, avro, schema, evolution]
---

# Encoding and evolution

> [!abstract] Resumen
> Los datos viajan entre procesos, servicios, máquinas. Necesitan un **formato** que los represente en bytes. Esta nota cubre los formatos principales (JSON, XML, Protobuf, Avro, Thrift), sus trade-offs y los patrones de **dataflow** que los usan. La cuestión clave: cómo evolucionar un esquema sin romper la compatibilidad.

## Por qué importa la codificación

El libro abre con una observación: los datos tienen **dos formas**:

- **En memoria**: objetos, structs, listas, mapas.
- **En disco o red**: una secuencia de bytes.

Convertir de una a otra es la **codificación** (o serialización). El formato elegido tiene consecuencias:

- **Tamaño**: afecta al almacenamiento y al ancho de banda.
- **Velocidad**: afecta a la latencia.
- **Evolución**: ¿qué pasa cuando cambia el esquema?
- **Compatibilidad**: ¿quién puede leerlo?

```text
Memoria ──[serialize]──► Bytes ──[transmit]──► Bytes ──[deserialize]──► Memoria
         encoding                               decoding
```

## Formatos basados en texto

### JSON

El formato más popular. Ventajas y limitaciones:

```json
{
    "id": 123,
    "name": "Ana",
    "orders": [
        {"id": 1, "total": 99.99},
        {"id": 2, "total": 149.50}
    ]
}
```

**Ventajas**:
- Ubicuidad: todo lenguaje lo soporta.
- Legible por humanos.
- Sin herramientas especiales.

**Limitaciones**:
- Verboso: mucho espacio para los delimitadores.
- Tipos limitados: no distingue entero de coma flotante, no tiene fecha nativa.
- Sin comentarios (oficialmente).
- Parsing relativamente lento.

### XML

Similar a JSON pero más verboso. Usado en sistemas legacy:

```xml
<order>
    <id>1</id>
    <total>99.99</total>
</order>
```

> [!note] XML está en retirada
> Para nuevos sistemas, JSON es la norma. XML sobrevive en SOAP, SAML, RSS y sistemas antiguos.

### CSV

El formato tabular minimalista:

```csv
id,name,total
1,Ana,99.99
2,Bob,149.50
```

**Ventajas**: simple, legible, Excel lo entiende.
**Limitaciones**: sin tipos, comas en valores. NoRecommended para datos complejos.

## Formatos binarios

### Protocol Buffers (Protobuf)

Google, 2008. Esquema en `.proto`:

```protobuf
syntax = "proto3";

message Order {
    int64 id = 1;
    string name = 2;
    double total = 3;
    repeated Item items = 4;
}

message Item {
    int64 id = 1;
    string description = 2;
    int32 quantity = 3;
}
```

Codificación binaria, compacta:

```text
JSON:       {"id":1, "name":"Ana", "total":99.99}
            ~32 bytes
Protobuf:   \x08\x01\x12\x03Ana\x19\x9d\xff\xff\xff\x5b\x40\xc0\xa8\x1e
            ~16 bytes
```

### Apache Thrift

Similar a Protobuf, de Facebook. Diferencias sutiles en la sintaxis.

### Apache Avro

Pensado para datos que cambian mucho. El esquema es **JSON**:

```json
{
    "type": "record",
    "name": "Order",
    "fields": [
        {"name": "id", "type": "long"},
        {"name": "name", "type": "string"},
        {"name": "total", "type": "double"}
    ]
}
```

**Característica clave**: el esquema se codifica en el **escrito**, no en el reader. Permite añadir campos sin coordinación.

```text
Protobuf vs Avro:

Protobuf: el reader necesita el esquema.
Avro:     el writer codifica el esquema en el dato.
```

> [!tip> Avro es ideal para streams
> La codificación de Avro incluye el esquema en el header de cada bloque. Para Kafka y data lakes, es perfecto.

### MessagePack

Serialización binaria de JSON:

```json
JSON:       {"id":1, "name":"Ana"}
            ~22 bytes
MessagePack: \x82\xa2id\x01\xa4name\xa3Ana
            ~13 bytes
```

Mismo modelo que JSON, pero binario. Útil cuando quieres JSON sin su tamaño.

## Comparación de formatos

| Formato | Tamaño | Velocidad | Schema | Evolución |
|---|---|---|---|---|
| JSON | Grande | Lento | Opcional | Manual |
| XML | Muy grande | Lento | Opcional (XSD) | Manual |
| Protobuf | Compacto | Rápido | Obligatorio | Reglas |
| Thrift | Compacto | Rápido | Obligatorio | Reglas |
| Avro | Compacto | Rápido | Obligatorio | Automática |
| MessagePack | Mediano | Rápido | Opcional | Manual |

## Evolución del esquema

El libro considera la **evolución** como la característica más importante de un formato moderno.

### Compatibilidad hacia atrás (backward)

Un consumer nuevo puede leer datos escritos con un esquema viejo.

```text
Esquema viejo: {id, name}
Esquema nuevo: {id, name, email}

Reader con esquema nuevo funciona con datos viejos: ✓
```

### Compatibilidad hacia adelante (forward)

Un consumer viejo puede leer datos escritos con un esquema nuevo.

```text
Esquema viejo: {id, name}
Esquema nuevo: {id, name, email}

Reader con esquema viejo funciona con datos nuevos: ✓
```

### Reglas típicas

- **Añadir un campo opcional**: backward + forward compatible.
- **Borrar un campo opcional**: backward compatible.
- **Cambiar el tipo de un campo**: rompe ambos.
- **Renombrar un campo**: rompe ambos.

```protobuf
message User {
    int64 id = 1;
    string name = 2;       // exist before
    string email = 3;      // new, opcional → safe
    // int32 age = 4;       // borrado → seguro si era opcional
}
```

> [!tip> La regla de oro
> **Nunca borrar un campo obligatorio**. Borrar o renombrar obliga a una migración coordinada, mientras que añadir campos opcionales se hace sin coordinación.

## Dataflow modes

El libro describe los principales patrones de movimiento de datos:

### 1. Databases (DB → App → DB)

Los datos viven en una base. Una aplicación los lee, los modifica, los escribe.

```text
App ──read──► DB
    ◄─write──┘
```

### 2. Services (REST/RPC)

Las aplicaciones exponen endpoints. Otras aplicaciones llaman.

```text
App A ──call──► Service B ──response──► App A
                (REST, gRPC, etc.)
```

### 3. Asynchronous messaging (message brokers)

Servicios publican mensajes. Otros servicios los consumen.

```text
Producer ──► Kafka ──► Consumer 1
                     ──► Consumer 2
                     ──► Consumer 3
```

### 4. Event sourcing

El estado es una secuencia de eventos inmutables. El estado actual se deriva.

```text
Eventos (inmutables):
  UserRegistered
  UserEmailChanged
  UserDeleted

Estado actual (derivado):
  Usuario activo, email = ...
```

### 5. Dataflow (batch + stream)

Movimiento de datos a gran escala: ETL, ELT, CDC.

```text
DB ──► Kafka ──► Flink ──► BigQuery ──► Dashboard
        (CDC)      (stream)   (warehouse)
```

## RPC: REST vs gRPC

El libro compara los protocolos de RPC:

### REST

```text
GET /api/users/123
GET /api/users/123/orders
POST /api/users
```

**Ventajas**: simple, basada en HTTP, casi cualquier lenguaje.
**Limitaciones**: verboso, sin tipos, depende de convenciones.

### gRPC

```protobuf
service UserService {
    rpc GetUser(UserId) returns (User);
    rpc GetOrders(UserId) returns (OrderList);
}
```

**Ventajas**: tipada, rápida (HTTP/2), genera clientes.
**Limitaciones**: más compleja, no es trivialmente debuggeable.

> [!tip> REST para APIs públicas, gRPC para internas
> Es la regla heurística. Las APIs internas entre servicios se benefician de gRPC. Las APIs externas a menudo son REST por compatibilidad.

## Cada modo tiene implicaciones

| Modo | Latencia | Throughput | Acoplamiento |
|---|---|---|---|
| Base de datos | ms | Alto | Tight |
| REST | ms-seg | Medio | Loose |
| gRPC | ms-seg | Alto | Loose |
| Message broker | ms-seg | Muy alto | Very loose |
| Event sourcing | Variable | Variable | Decoupled |

## Schema evolution en práctica

El libro enumera las **mejores prácticas**:

1. **Usa un formato con esquema**: Protobuf, Avro, Thrift. No JSON sin esquema.
2. **Versiona el esquema**: cada cambio es un nuevo version.
3. **Usa números de campo, no nombres**: facilita añadir/eliminar.
4. **Haz las compatibilidades explícitas**: tests de forward/backward.
5. **Mata los campos viejos**: deja deprecated fields durante un tiempo, pero eventualmente elimínalos.

```protobuf
// Mal
message User {
    int64 id = 1;
    string name = 2;
    string email = 3;  // obligatorio
}

// Bien
message User {
    int64 id = 1;
    string name = 2;
    optional string email = 3;  // opcional
    reserved 4, 5;  // campos eliminados, no reusar
}
```

> [!danger> Reutilizar números de campo
> Nunca **reutilices** un número de campo. Si borras un campo, márcalo `reserved` para que nadie lo use accidentalmente.

## Schema registries

Para gestionar la evolución de esquemas centralizadamente:

- **Confluent Schema Registry** (con Kafka).
- **AWS Glue Schema Registry**.
- **Apicurio**.

```text
Flujo con schema registry:

Producer ──check schema──► Schema Registry
   │                            │
   │◄──get schema──────────────┘
   │
   ▼
publish (schema id + data)
```

## Resumen en tres frases

- Los formatos binarios como **Protobuf** y **Avro** son la elección por defecto para sistemas de servicios: compactos, rápidos, con compatibilidad bien definida.
- La **evolución del esquema** es la preocupación clave: añadir campos opcionales es seguro; renombrar o cambiar tipos no lo es.
- Los **modos de dataflow** (DB, REST, message brokers, event sourcing) tienen trade-offs distintos de latencia, throughput y acoplamiento.

## Próximos pasos

- [[08-replication-single-leader|Replication: single-leader]]: una vez que tenemos los datos, lo siguiente es **copiarlos** en varios nodos. La estrategia más común: un nodo líder y varios seguidores.
