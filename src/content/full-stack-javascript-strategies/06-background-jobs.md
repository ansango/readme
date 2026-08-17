---
title: "Background jobs"
description: "Cron jobs para sincronizar datos con servicios de terceros, background jobs para eventos async, alertas, monitoring y problemas comunes de sincronización"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, cron, background-jobs, monitoring]
---

# Background jobs

> [!abstract] Resumen
> Esta nota cubre el trabajo que tu app tiene que hacer **fuera del flujo de las requests HTTP**: cron jobs que corren en schedule (sincronizar datos con Stripe cada noche) y background jobs disparados por eventos (enviar un email cuando se completa un pago). El foco está en cómo afectan a la arquitectura, cómo se monitorean, qué problemas típicos dan (data sync, timeouts, race conditions) y cómo dejar el código preparado para evolucionar.

## Background job vs cron job

No son lo mismo, aunque a veces se usan indistintamente:

- **Background job**: ejecuta código o acciones fuera del flujo de una API, de forma sistemática. Lo disparan eventos (una request, un mensaje en una cola, una compra completada). Suelen tener lógica de negocio alrededor y se definen al nivel de service. Ejemplo: enviar un email cuando un pago se completa.
- **Cron job**: ejecuta una tarea en un **schedule**. La disparan las configs del cloud, no una request de usuario. Ejemplo: sincronizar productos de Stripe con tu base de datos cada noche a las 00:05.

> [!note] Lenguaje de los jobs
> Tus jobs pueden escribirse en cualquier lenguaje. En este proyecto se hacen en TypeScript porque ya es el stack. Es código que corre en otro sitio (una EC2 instance, un contenedor separado, una función Lambda), no en tus endpoints.

## Lo difícil de los jobs

Como corren en su propio schedule, **pueden afectar al estado de todo el sistema de formas inesperadas**. Esto es donde las skills senior se notan: anticipar race conditions, diseñar reintentos, hacer que los jobs sean idempotentes.

## Actualizar la arquitectura

El primer paso cuando añades jobs al sistema es **actualizar el diagrama de arquitectura**. Es el sitio al que la gente va a mirar cuando se pregunte cómo encaja una pieza nueva. Si el diagrama está desactualizado, las decisiones se toman con información incorrecta.

En el proyecto del libro:

- **Background job** para enviar emails, disparado cuando se completa un pago en Stripe.
- **Cron job** para sincronizar datos de Stripe con tu base de datos, en schedule diario.

> [!tip] Actualizar docs es mentoring
> Cada vez que actualizas el diagrama estás haciendo dos cosas: dejando claro cómo funciona el sistema y obligándote a ti mismo a repasar los conceptos. Junior devs aprenden viendo diagramas actualizados y senior devs consolidan conocimiento al mantenerlos.

## Opinión: jobs en el mismo repo

Hay un debate sobre si los cron y background jobs deben vivir en el mismo repo que la app o en uno separado. Ethan Brown, autor de varios libros de O'Reilly, prefiere **monorepos con todo el código de aplicación junto**, organizado en carpetas. Lo ve como **código de aplicación**: parte se invoca por requests de usuario, parte por schedules, parte por colas. La unidad no es "lo que responde a HTTP" sino "lo que cambia el estado del sistema".

> [!quote] Si un job cambia el estado del sistema, es código de aplicación
> Aunque se invoque de forma distinta, sigue siendo lógica de negocio. Mantenerlo junto al resto del código (con sus carpetas apropiadas) lo desmitifica. Excepción razonable: jobs de solo lectura como analytics o reporting, que pueden vivir en un microservicio aparte.

## Cron jobs: implementación

Los cron jobs suelen correr en infraestructura gestionada por el cloud. **No vas a tocar la config del schedule**: DevOps o el cloud provider se encarga. Tú eres responsable del código que se ejecuta y de saber a qué hora corre.

### Ejemplo: sincronizar invoices de Stripe

```typescript
onModuleInit() {
  this.addCronJob('sync_stripe_orders', '5 00 * * *',
    this.cronSyncStripeOrders.bind(this));
}

async cronSyncStripeOrders(syncDate: Date) {
  this.logger.debug(`Stripe orders sync started at ${new Date()}`);
  const previousDate = syncDate.setDate(syncDate.getDate() - 1);
  const params = { created: { gte: previousDate } };
  const { data: latestInvoices } = await this.stripe.invoices.list(params);

  if (latestInvoices.length === 0) {
    this.logger.debug(`No new Stripe invoices since ${previousDate}`);
    return;
  }

  for (const invoice of latestInvoices) {
    const orderRecord = {
      name: invoice.account_name,
      stripeInvoiceId: invoice.id,
      total: invoice.total,
    };
    try {
      const doesOrderRecordExist = await this.prisma.order.findUnique({
        where: { stripeInvoiceId: invoice.id },
      });
      if (!doesOrderRecordExist) {
        await this.prisma.order.create({ data: orderRecord });
      }
    } catch (error) {
      this.logger.debug(`Something happened with invoice ${invoice.id}: ${error}`);
    }
  }
  this.logger.debug(`Stripe orders sync finished at ${new Date()}`);
}
```

La expresión `5 00 * * *` significa "a las 00:05 todos los días". Puedes probar expresiones en [Cronitor](https://crontab.guru/).

> [!warning] Time zones importan
> Si tu server corre en UTC-5 y tus usuarios están en UTC-8, la sincronización va a desfasar con el calendario que ellos perciben. Asegúrate de que el cron corre en el time zone que tiene sentido para tu negocio (probablemente UTC).

### Lo que sale mal con los cron jobs

A medida que el tráfico crece, los cron jobs empiezan a encontrar problemas:

- Tardan más en completarse.
- Timeouts.
- Queries largas que afectan a la base de datos.
- En el peor caso, el job no termina, se reinicia al día siguiente, y se acumulan ejecuciones.

La solución es **monitorear la duración y la finalización** de los jobs. Si ves que un job está tardando más de lo normal, refactorízalo antes de que reviente.

## Alertas y monitoring

Los jobs automáticos van a fallar. Lo importante es enterarte rápido y tener contexto.

- **Alertas basadas en métricas**: número de errores en un rango de tiempo, tipo específico de error, uso de recursos. Las configura DevOps para temas de infraestructura; el dev team configura las de código.
- **Logs descriptivos**: con IDs, statuses y nombres que puedas cruzar con otras partes del sistema.
- **Términos buscables en logs**: a medida que el sistema crece, la cantidad de logs se vuelve inmanejable. Marca cada log con tags que puedas filtrar (`sync_stripe_orders`, `email_send`, etc.).

> [!tip] Qué monitorear
> Lo que hay que vigilar en jobs:
> - ¿Terminó? (no se quedó colgado).
> - ¿Cuánto tardó? (alerta si supera cierto umbral).
> - ¿Cuántos errores tuvo?
> - ¿Cuántos registros procesó?
>
> Esas cuatro métricas cubren la mayoría de problemas.

## Problemas de data sync y task execution

### Reintentos

Buena práctica: cualquier cron o background job debe tener un **mecanismo de retry**. Para problemas de data sync, reintentar la petición al servicio externo suele arreglar el problema. Antes de hacer el retry, cuenta cuántos registros se actualizaron para conocer el impacto.

### Background job de email

El libro no recorre el código del background job de email, pero el patrón es similar al cron: lo dispara un evento (en este caso, la finalización de un pago en Stripe) y debe tener su propio monitoring.

### Trabajo conjunto con DevOps

Los jobs viven en la infraestructura, así que cuando hay problemas **el debug casi siempre es en pareja dev + DevOps**. Tener buena relación con ese equipo paga con creces.

## Consideraciones de futuro

### Stop mechanism

Los jobs a veces se ejecutan de forma inesperada y necesitas pararlos rápido. Diseña cada job con un mecanismo de stop desde el principio. Si copias el patrón al siguiente job, el handling ya viene "de fábrica".

### Refactors periódicos

El código de los jobs tiende a **envejecer mal** porque mientras funcione, nadie lo toca. Mantén un ticket en el backlog para actualizar paquetes y refactorizar al menos una vez por trimestre. Si lo dejas, acabas con código legacy que da miedo tocar.

> [!warning] Jobs sin dueño son legacy en potencia
> Documenta quién es el responsable de cada job. Si rota el equipo, esa info se pierde. Ponlo en el README, en el código, en el ticket de configuración. Lo que sea. Pero que esté.

## Próximos pasos

- [[07-testing-del-backend|Testing del backend]]: por qué testear, qué tipo de tests escribir (unit, e2e), mock data y cómo QA encaja en el flujo.
