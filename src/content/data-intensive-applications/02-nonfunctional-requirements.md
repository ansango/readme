---
title: "Defining nonfunctional requirements"
description: "Cómo definir performance, reliability, scalability y maintainability con números concretos. La base para cualquier decisión arquitectónica"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [arquitectura, requisitos, performance, scalability, reliability]
---

# Defining nonfunctional requirements

> [!abstract] Resumen
> Antes de elegir una herramienta, hay que definir qué queremos de ella. Kleppmann y Riccomini dedican el segundo capítulo a la **definición operativa** de los requisitos no funcionales: performance, reliability, scalability y maintainability. La idea central: sin números concretos, los requisitos son slogans.

## Por qué importan los requisitos no funcionales

El libro abre con un caso de estudio: una **red social** que necesita un sistema de timelines. ¿Qué significa eso? ¿Rápido? ¿Fiable? ¿Escalable? Sin responder estas preguntas, cualquier elección de herramienta es un acto de fe.

> [!quote] "Si no puedes medirlo, no puedes mejorarlo."
> El libro recoge el viejo Lord Kelvin. La definición operativa de un requisito es la única que permite **decidir** si está cumplido.

## Caso de estudio: el timeline de una red social

Una red social típica tiene estas consultas:

1. **Leer el timeline home**: los posts de las personas que sigo, en orden cronológico inverso.
2. **Publicar un post**: añadir un post al sistema.
3. **Like, retweet, responder**: acciones sobre un post.
4. **Búsqueda**: encontrar posts por texto.

Cada una tiene un **perfil de carga** distinto:

```text
Acción       Latencia objetivo   QPS esperado    Consistencia
─────────────────────────────────────────────────────────────
Home timeline   < 200 ms        50K - 500K      Lectura tolerante
Publicar post   < 200 ms        1K - 5K         Escritura estricta
Like/Reply      < 200 ms        10K - 100K      Consistencia eventual
Búsqueda        < 1 sec         5K - 50K        Tolerante
```

> [!note] Los números son hipótesis
> Antes de tener datos reales, los números son **estimaciones**. La disciplina es hacerlos explícitos para poder **medirlos** y **actualizarlos** cuando haya datos.

## Performance

El libro distingue **latencia** y **response time** (que en español solemos traducir igual). Las métricas clave:

### Latencia vs response time

- **Latencia**: cuánto tarda en ejecutarse algo. Una operación.
- **Response time**: cuánto tarda el sistema en responder a una solicitud. Incluye la latencia + la cola + la red.

> [!tip] En sistemas interactivos, response time es lo que importa
> El usuario ve el tiempo total desde que hace clic hasta que ve la respuesta. Si "la latencia es baja pero el response time es alto", hay cola.

### Percentiles

La media **no** es buena métrica de performance. Una operación con latencia media de 100ms puede tener:
- El 50% de requests en 50ms.
- El 5% en 5 segundos.

Para用户体验, la **p95** y la **p99** son más representativas:

```text
Distribución típica de latencias:

         ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇
         ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇
     ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇
─────────────────────────────────────────────────────
50%   90%   95%   99%   99.9%   99.99%   100%
```

- **p50** (mediana): el 50% de los requests son más rápidos.
- **p95**: el 95% son más rápidos. El 5% más lento.
- **p99**: el 99% son más rápidos. El 1% más lento.
- **p99.9**: el 99.9% son más rápidos. El 0.1% más lento.

> [!warning] p99 es lo que necesitas mirar
> La p95 es útil para validar "el sistema va bien". La p99 es lo que el **1% de los usuarios** experimenta. Si tu SLA es 99.9%, necesitas mirar p99.

### Tail latency amplification

Si una sola operación llama a 10 servicios, y cada uno tiene p99 de 100ms, la p99 total del sistema es mucho peor (porque 10 p99s consecutivos no son improbables de forma independiente). Esto se llama **tail latency amplification** y es uno de los problemas centrales de los microservicios.

```text
Una request → 10 servicios:
P(cada uno < 100ms) = 0.99
P(todos < 100ms) = 0.99^10 ≈ 0.904

O sea: p99^10 ≈ p90
```

> [!tip] Por eso los microservicios son un reto
> Un monolito con p99 de 100ms es un sistema con p99 de 100ms. Diez microservicios con p99 de 100ms cada uno es un sistema con p99 de aproximadamente 400ms.

## Reliability

El libro define fiabilidad como **"el sistema continúa funcionando correctamente a pesar de los fallos"**.

### Definición operativa

Un sistema es fiable si:

- **Hace lo que se supone que debe hacer** (funcionalidad).
- **No hace lo que no se supone que debe hacer** (seguridad).
- **Funciona cuando se necesita** (disponibilidad).

### Métricas

- **MTBF** (Mean Time Between Failures): tiempo medio entre fallos.
- **MTTR** (Mean Time To Repair): tiempo medio de reparación.
- **Disponibilidad**: MTBF / (MTBF + MTTR).

```text
Disponibilidad = MTBF / (MTBF + MTTR)

"Dos nueves"  99%       = 3.65 días de caída al año
"Tres nueves" 99.9%     = 8.77 horas de caída al año
"Cuatro nueves" 99.99%  = 52.6 minutos de caída al año
"Cinco nueves" 99.999%  = 5.26 minutos de caída al año
```

> [!danger] Los "nueves" tienen costes exponenciales
> Pasar de 99.9% a 99.99% no cuesta 10x. Cuesta entre 10x y 100x. Hay que evaluar si la mejora lo vale.

### Sources of failure

El libro enumera las fuentes típicas de fallo:

- **Hardware**: discos, RAM, red, poder.
- **Software**: bugs, memory leaks, race conditions.
- **Humanos**: errores de operación, deploys rotos.
- **Sobrecarga**: picos de tráfico, sistemas no escalados.

> [!tip] Los humanos son también failure mode
> El error humano está en la raíz de la mayoría de los incidentes graves. Diseñar con eso en mente: herramientas que **impidan** errores, no solo que los detecten.

## Scalability

El libro define scalability como **la capacidad de mantener el rendimiento cuando la carga crece**.

### Tipos de carga

- **Aumento del volumen de datos**: 10x más usuarios, 10x más eventos.
- **Aumento del volumen de lecturas**: 10x más consultas.
- **Aumento del volumen de escrituras**: 10x más publicaciones.

Para cada tipo hay una estrategia distinta.

### Scaling strategies

#### Vertical scaling (scale up)

Añadir recursos a un servidor: más CPU, más RAM, más disco.

**Pros**: simple, no requiere cambiar el código.
**Contras**: tiene un techo, los servidores grandes son caros, el failover requiere réplica.

#### Horizontal scaling (scale out)

Añadir más servidores y repartir la carga.

**Pros**: teóricamente ilimitado, más barato en commodity hardware.
**Contras**: requiere arquitectura distribuida, replicación, consenso, particionado.

```text
Vertical vs horizontal:

Vertical:
  Antes:        Después:
  ┌──────┐      ┌──────────┐
  │ 1 CPU│      │  8 CPUs  │
  │ 8 GB │      │ 64 GB    │
  └──────┘      └──────────┘

Horizontal:
  Antes:        Después:
  ┌──────┐      ┌──────┐ ┌──────┐ ┌──────┐
  │ 1 srv│      │ srv 1│ │ srv 2│ │ srv 3│
  └──────┘      └──────┘ └──────┘ └──────┘
```

### Elasticidad

El libro describe la **elasticidad** como la capacidad de ajustar recursos según la demanda. En cloud, eso es automático; en on-premise, requiere planificación.

> [!tip] El oversizing es un coste, no un seguro
> Comprar dos veces más capacidad de la necesaria no es "ir a lo seguro". Es tirar dinero. Mejor diseñar para escalar y pagar por la escala real.

## Maintainability

El libro define maintainability como **la facilidad con la que el sistema puede ser operado, entendido y modificado**.

### Tres categorías

#### Operability

- ¿El equipo puede **operar** el sistema sin sobresaltos?
- ¿Hay herramientas de monitoring, alerting, debugging?
- ¿Los incidentes tienen runbooks?
- ¿Hay rotación on-call sostenible?

#### Simplicity

- ¿El sistema es **comprensible** por un nuevo miembro del equipo?
- ¿Hay acoplamiento excesivo?
- ¿Las abstracciones son claras?
- ¿La complejidad accidental es evitable?

#### Evolvability

- ¿El sistema puede **cambiar** sin reescribirse?
- ¿Las interfaces son estables?
- ¿Hay tests que permiten refactorizar con confianza?
- ¿Los datos pueden migrarse a nuevos esquemas?

```text
Maintainability:

         ┌─────────────────────────────┐
         │     Maintainability         │
         └──────────┬──────────────────┘
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Operability│ │Simplicity│  │Evolvability│
│Operar     │ │Entender  │  │Cambiar    │
└──────────┘  └──────────┘  └──────────┘
```

> [!quote] "La complejidad es el enemigo."
> Cualquier sistema crece en complejidad. La disciplina es no añadir complejidad **accidental** (la que no aporta). La complejidad **esencial** (la del problema) no se puede eliminar.

### Cómo medir maintainability

No hay métrica única. El libro sugiere surrogates:

- **Tiempo medio de incorporar** un nuevo ingeniero al sistema.
- **Tiempo medio de hacer un cambio** pequeño y desplegarlo.
- **Número de bugs** que se introducen por cambio.
- **Tiempo medio de resolver** un incidente.

## Resumen en tres frases

- Los requisitos no funcionales se definen en **números**: latencia p99, MTBF, MB/s, etc. Sin números, son slogans.
- **Performance, reliability, scalability y maintainability** son las cuatro dimensiones que un ingeniero de datos debe equilibrar.
- Cada dimensión tiene **trade-offs**: más reliability sale cara, más scalability añade complejidad, más maintainability cuesta diseño. La disciplina es saber qué pesa más.

## Próximos pasos

- [[03-data-models-relational-vs-document|Data models: relacional vs documento]]: una vez definidos los requisitos, el siguiente paso es elegir cómo **modelar** los datos. Empezamos por el debate clásico: relacional vs documento.
