---
title: "Performance del backend"
description: "Métricas de performance, alertas y monitoring, estrategias de caching (read-through, write-through, write-back, cache-aside), Redis, consideraciones de producto"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, performance, caching, redis, monitoring]
---

# Performance del backend

> [!abstract] Resumen
> Esta nota cubre cómo encontrar áreas de mejora de performance con datos: las métricas clave (latencia, P90, throughput, hardware utilization), cómo configurar alertas y monitoring útiles, las estrategias de caching (read-through, write-through, write-back, cache-aside), los tipos de cache (in-memory, distribuido, client-side), y la implementación práctica con Redis. El foco está en tomar decisiones data-driven y no caer en optimización prematura.

## Cuándo empezar a mirar performance

La optimización de performance suele empezar cuando algo lo fuerza: usuarios reportando lentitud, servers crasheando bajo carga, o un release importante que va a multiplicar el tráfico. También puede ser **preventiva**: si sabes que se viene un pico (Black Friday en ecommerce, por ejemplo), preempardeces.

Antes de tocar nada, **mira los datos**. ¿Por qué se ha levantado el tema? ¿Es un endpoint concreto? ¿Es en ciertas horas? ¿Es desde que desplegamos X?

## Métricas clave

### Latencia

- **Latencia media**: tiempo medio de respuesta (excluyendo processing time).
- **Desviación estándar**: para ver cuánto varía.
- **Latencia mínima y máxima**: los outliers.
- **P90 latency**: el percentil 90. Si tu P90 es 100ms, significa que el 90% de las requests acaban en menos de 100ms y el 10% más lentas tardan más.

> [!quote] Ethan Brown sobre P90
> Si tu P90 latency es 100 ms, el 90% de tus requests acaban en menos de 100 ms, y el 10% más lentas tardan más. Es la métrica más útil para entender la experiencia del usuario porque promediar esconde lo que el usuario percibe.

### Throughput

- **Requests por segundo**: cuántas requests maneja tu server.
- **Data I/O ratio**: tamaño medio de los payloads de request y response.
- **Peak response time (PRT)**: la response time más larga de todas. Distinta de max latency: PRT incluye processing time, max latency es solo de transporte.

### Hardware

- **Utilización de RAM y disco**.
- **Número de threads**: en Node, por defecto es single-threaded. Si tu server tiene varios procesos Node, hay load balancing, pero el modelo base es single-threaded con event loop. Un solo proceso puede manejar requests concurrentes, pero eso no aparece en las stats de threads del OS.
- **Server load**: threads corriendo o esperando CPU en un rango.
- **Server uptime rate**: % de tiempo que el server está disponible.

### Errores

- **HTTP error rate**: frecuencia de errores 4xx y 5xx.
- **Apdex score**: estándar abierto que agrega satisfacción de usuario en un score ponderado.

> [!tip] Familiarízate con tus dashboards
> Si puedes, dedica una tarde a explorar los dashboards de tu cloud platform. Aprende dónde están las métricas, qué mide cada una, cómo se ven los patrones. No hace falta ser experto, pero sí saber lo suficiente para ser efectivo.

### Optimizaciones avanzadas (con cuidado)

- **Algorithmic performance**: time complexity, space complexity. Solo para apps muy intensivas en cálculo (videojuegos, data processing, tiempo real).
- **Database query optimization**: refinar SQL queries, añadir índices, reducir lecturas/escrituras.

> [!warning] No оптимиices antes de tiempo
> Estas optimizaciones avanzadas pueden llevar a оптимиización prematura. Deja que los patrones de uso te digan dónde mirar. Mientras tanto, mantén al día a tu equipo sobre lo que ves.

## Alertas y monitoring

Ya estás midiendo métricas. El siguiente paso es **automatizar la respuesta**: monitoring detecta cuando algo cruza un umbral, las alertas avisan al equipo.

### Thresholds

Configura umbrales para cada métrica importante. Ver con qué frecuencia se acercan al máximo te dice qué partes necesitan ajuste. A largo plazo verás **tendencias estacionales** (más tráfico en Black Friday, en vuelta al cole, en navidad) que te permiten planificar recursos.

### Acciones automáticas

Con monitoring puedes **disparar eventos automáticamente**: escalar recursos, mandar email y Slack al dev team, actualizar un mensaje en la web, cambiar un valor en la base de datos. Herramientas como Zapier, n8n y Make se integran con casi todo.

> [!tip] ChatOps
> Cuando los alerts van a canales de Slack con los miembros relevantes, haces **ChatOps**: las herramientas se encargan de la comunicación entre recursos y personas. Distribuye la responsabilidad de manera natural.

### Revisa los alerts periódicamente

Si mandas muchos alerts, todos se ignoran. Reserva tiempo cada cierto tiempo a revisar:

- ¿Qué alerts se disparan más?
- ¿Siguen siendo relevantes?
- ¿Hay que subir/bajar el threshold?
- ¿Hay que mandarlos a otro canal?

### Comparte con el equipo

Cuando tengas monitoring en su sitio, **escribe docs y haz una call** explicando cómo funciona. Es una de las mejores formas de hacer team leveling.

## Caching

El caching es la mejora de performance más común. Hay dos métricas centrales:

- **Latencia**: la quieres baja. Cachear respuestas recurrentes ayuda mucho.
- **Load**: con serverless puede que no importe; con servers propios, quieres load bajo sin pagar por recursos ociosos.

### Cómo funciona

Cuando un endpoint tiene cache, el server **comprueba primero el cache**. Si la respuesta está ahí, no toca la base de datos. Si no, hace la query, guarda el resultado en cache, y lo devuelve. La próxima vez que pidan lo mismo, sale del cache.

> [!warning] No caches PII
> Es una vulnerabilidad de seguridad. Si alguien ataca el cache en lugar del server, se lleva datos sensibles. **Cache poisoning** es cuando un atacante fuerza contenido malicioso al cache y los usuarios lo reciben hasta que se purgue.

### Estrategias de caching

#### Read-through

El cache se mira siempre primero. Si la data no está, se va al backend, se trae, y se guarda en cache. **No hay mecanismo para actualizar** la data en el cache; depende de cuándo se refresca naturalmente. Útil cuando la DB no se actualiza a menudo o cuando las queries son lentas. Los writes van directo a la DB.

#### Write-through

Escribes en cache y en DB a la vez. Garantiza datos frescos, pero **el write inicial es más lento** porque espera a la DB. Normalmente se combina con read-through.

#### Write-back / write-behind

Múltiples writes al cache antes de que la DB se actualice. **Procesas input del usuario muy rápido** y haces batch updates a la DB. Peligro: si el cache se pierde antes de la DB, **pérdida de datos**. Útil para high write performance donde no necesitas los datos inmediatamente (procesamiento de imágenes, audio).

#### Cache-aside

La **aplicación** gestiona el cache. Cuando se pide data, mira el cache; si no está, va a la DB y guarda en cache. Es la más equilibrada. Buena cuando la demanda es impredecible (cargas bajo demanda).

### Tipos de cache

#### In-memory

Data en la **RAM** del server. Muy rápido, pero los datos desaparecen al reiniciar. Útil para datos grandes que cambian poco (lista de productos que se carga una vez al inicio).

#### Distribuido (Redis, Memcached)

Cache servers en distintas regiones para apps con usuarios globales. Coste-efectivo para llevar datos cerca de los usuarios. Trade-offs: **data consistency** puede ser problemático (usuarios en regiones distintas ven datos distintos), y la gestión de la infra distribuida se vuelve compleja.

#### Client-side

Lo vemos en [[21-performance-del-frontend]].

### Implementación con Redis

```typescript
// app.module.ts
@Module({
  imports: [
    AuthModule, OrdersModule, StripeModule, ProductsModule, UsersModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    }),
  ],
})
export class AppModule {}
```

Y en el controller:

```typescript
@Controller('products')
export class ProductsController {
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products')
  @CacheTTL(30) // 30 segundos
  @Get()
  public async products(): Promise<Array<Product>> {
    return await this.productsService.products({});
  }
}
```

Tres cosas importantes:

- **Cache automático**: el response se cachea sin código extra.
- **Cache key**: la key con la que guardas el valor. Útil para invalidar manualmente.
- **TTL (Time to Live)**: cuánto tiempo está fresco antes de que se considere stale.

## Consideraciones de producto

Cuando optimizas, **no pierdas de vista el problema original**. Pregúntate:

- ¿Esto mejora la experiencia del usuario?
- ¿Hay un trade-off que considerar?
- ¿Cuán seguro estoy de poder debuggear problemas de cache?
- ¿Esto afecta la velocidad del equipo porque requiere mantenimiento?

> [!warning] Imagen del equipo
> Las decisiones de monitoring y alertas afectan cómo el resto de la organización percibe al equipo. Aunque el software es dinámico y los alerts se ajustan, lo que reportas y cómo se mantiene influye en el nivel de autonomía y confianza que te dan.

### Cómo medir el impacto

Haz throttling de la response rate antes y después del cambio. Compara latencias. ¿Mejoró lo que esperabas? Si no, vuelve a la mesa de dibujo.

### Otros speedups

- **Más RAM** en el server para manejar más requests.
- **Más concurrent requests** permitidas por configuración.
- **Refactor de código** que tenga paths ineficientes.

### Cuándo vale la pena оптимиizar

Trade-off entre tiempo de optimización y features nuevas. Empieza con **quick approaches** para validar hipótesis, luego planifica la solución a largo plazo. Criterios para decidir si vale la pena:

- ¿Está causando churn de clientes por lentitud?
- ¿Estamos peor que la competencia en benchmarks?

## Próximos pasos

- [[11-escalabilidad|Escalabilidad]]: tipos de scaling (vertical, horizontal, híbrido), best practices y proceso para escalar.
