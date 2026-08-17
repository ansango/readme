---
title: Escalabilidad
description: "Tipos de scaling (vertical, horizontal, híbrido, recursos), best practices, proceso para escalar (plan, documentar, testear, comunicar) y cambios de tráfico graduales"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, scalability, devops, infrastructure]
---

# Escalabilidad

> [!abstract] Resumen
> Esta nota cubre los tipos de escalado que puedes aplicar a un backend (vertical, horizontal, híbrido, de recursos), las best practices para hacerlo bien, y el proceso completo: hacer un plan, documentarlo, testearlo, comunicar el progreso y migrar tráfico gradualmente. El escalado es una decisión grande y costosa, así que se planifica con tiempo, se documenta todo, y se hace de forma incremental para no romper producción.

## Cuándo empezar a hablar de escalabilidad

Cuando las optimizaciones de performance no son suficientes para mantener el ritmo de uso. El escalado **va a empezar a costarle más dinero a la empresa** (más tier de servicios, más gente, más infraestructura), así que es una decisión que se toma con datos y stakeholders.

La decisión de escalar **cimenta la arquitectura durante años**. Cambiar de cloud platform o de tipo de escalado es un proyecto de meses, no de sprints. Por eso hay que dedicarle tiempo a investigar opciones y verificar lo que se tiene disponible antes de comprometerse.

## Tipos de escalado

### Vertical scaling

**Aumentar la potencia** de un solo recurso. Más CPU, más RAM, disco más rápido en una misma EC2 instance. Es lo más sencillo si tu app no está distribuida: no tocas código, ajustas configuración.

**Ventajas:**

- Rápido de implementar (cambiar config).
- Más barato (sigue siendo un solo recurso).

**Desventajas:**

- Punto único de fallo. Si ese server cae, no hay backup.
- Las upgrades se vuelven tediosas y pueden requerir downtime.
- Tiene un techo físico (no puedes añadir RAM infinitamente).

### Horizontal scaling

**Añadir más instancias** de tu app. En AWS, eso son más EC2 instances detrás de un load balancer. Cada instancia tiene la config que ya tenías.

**Ventajas:**

- Más resiliencia: si una instancia cae, las demás siguen.
- Upgrades sin downtime: desvías tráfico mientras actualizas.
- Mejor para productos comerciales.

**Desventajas:**

- Tarda más en implementar.
- Necesitas un load balancer.
- El código tiene que estar pensado para correr en múltiples instancias (sin estado local, sesiones centralizadas, etc.).

> [!quote] Jeff Graham sobre auto scaling
> Los cloud providers tienen servicios de **auto scaling** que monitorizan tráfico o uso de recursos y añaden/eliminan servers según necesidad. Ahorra tiempo y dinero: durante la noche puedes tener 2 servers, y escalar a 10 en hora punta. Lo hay también para databases, queues, contenedores, etc.

### Híbrido

Algunas instancias con más recursos (vertical) y otras con menos (horizontal), con load balancer delante. Útil cuando algunas regiones geográficas necesitan más capacidad.

### Escalado de recursos

El escalado no es solo de API. También lo necesitas para:

- **Queues y background jobs**: si las jobs tardan más de lo normal, probablemente necesitas más capacidad. A veces toca partir los jobs a un repo separado en otro server.
- **Database**: escalando la DB aceptas más throughput o más conexiones.

### Manual vs automático

**Autoscaling** (elástico, escalado según demanda) es lo habitual con cloud services. Es lo que se activa cuando el tráfico sube en una temporada concreta y vuelve a bajar (ecommerce en navidad, fintech en cierres trimestrales, etc.).

> [!note] Elastic scaling vs scaling
> **Elastic scaling** es a corto plazo, responde a picos. **Scaling** es a largo plazo, asume que el uso se ha quedado alto de forma consistente. Si tu web se vuelve viral un día y vuelve a la normalidad, elastic. Si tu SaaS ha pasado de 1000 a 5000 clientes y se mantiene, scaling.

## Best practices

### 1. Hacer un plan

Antes de tocar nada, documenta:

- ¿Nos quedamos con el cloud platform actual o migramos?
- ¿Qué métricas vas a monitorizar para decidir el escalado?
- ¿Qué equipos están involucrados?
- ¿Cuál es el rollout plan y el rollback plan?
- ¿Cuál es el test plan?
- ¿Cuál es el coste estimado?

La decisión del cloud platform se basa en:

- Experiencia del equipo DevOps.
- Stack técnico actual.
- Compatibilidad con tus servicios externos.
- Servicios disponibles en el provider.

> [!warning] Las migraciones de cloud son largas
> Cambiar de Heroku a AWS te puede llevar un año y medio con varios equipos. De GCP a Azure, casi dos años. Elige bien al principio.

### 2. Documentar el plan

El "por qué" de cada decisión se va a preguntar varias veces durante el proceso. Ten el diagrama de arquitectura actualizado y la investigación a mano. Anota las preguntas que surgen y las discusiones que generan.

**Anima a otros a contribuir a los docs.** Distribuir el conocimiento ayuda a todos a entender qué está pasando y crea redundancia de expertise.

### 3. Testear

Usa tus tests automatizados como primera línea de validación. Después, haz testing manual de los endpoints de alta carga.

#### Stress testing

Simula carga creciente para ver cómo responde el sistema:

1. **Planifica el test**: define el objetivo (ej. "manejar 25.000 RPM sin crashear, manteniendo 3s de response time").
2. **Crea scripts de automatización** que simulen user actions.
3. **Ejecuta los scripts** incrementando carga gradualmente.
4. **Analiza resultados**: response times, error rates, bottlenecks.
5. **Optimiza** los settings del escalado según los datos.

> [!tip] Tests pequeños al principio
> Antes de tirar a producción, haz tests incrementales. Un cambio de recursos puede hacer que importen detalles que antes no importaban (capitalización de filenames, paths absolutos vs relativos, etc.).

### 4. Comunicar progreso

- **Otros dev teams**: si van a hacer lo mismo algún día, aprenden con tu ejemplo.
- **Producto**: para que entienda por qué el feature development va más lento durante el testing.
- **Soporte**: para que estén preparados ante un aluvión de mensajes si algo va mal.
- **Stakeholders no técnicos**: timelines, qué esperar, posibles downtimes. **Mantén el flujo de comunicación constante** para que no se pongan nerviosos.

> [!tip] Involucra a devs más juniors
> Si el timeline lo permite, **trae a un dev más junior a las conversaciones**. Que aprendan cómo se hace, expande el equipo que entiende estos procesos y reparte la responsabilidad a futuro.

### 5. Cambiar tráfico gradualmente

**Nunca** muevas todo el tráfico a la vez a los nuevos recursos. La transición gradual es la forma segura:

- Ten el server de producción actual y los nuevos recursos corriendo a la vez.
- Empieza a desviar un porcentaje pequeño del tráfico a los nuevos.
- Monitorea logs y errores.
- Sube el porcentaje poco a poco.
- **Hazlo en horas de bajo tráfico** para que, si algo falla, afecte al mínimo de usuarios.

> [!warning] Ten siempre un rollback plan
> Si algo va mal en una fase, tienes que poder volver atrás rápido. Los rollbacks son una red de seguridad, no un lujo.

## Próximos pasos

- [[12-monitoring-logs-e-incidentes|Monitoring, logs e incidentes]]: herramientas (Datadog, Sentry), playbooks de incidente y blameless postmortems.
