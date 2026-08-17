---
title: "Debugging del backend"
description: "Logs detallados, configs de entorno, herramientas, estrategias para trazar bugs, ayudar a otros devs y checklist de debugging"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, debugging, logging, observability]
---

# Debugging del backend

> [!abstract] Resumen
> Esta nota cubre el oficio de debuggear en backend: cómo escribir logs que valgan oro, qué mirar en las configs de entorno, qué herramientas usar, estrategias para trazar bugs (consola, hacky code, herramientas), cómo ayudar a otros devs (método científico, flow diagrams, rubber-ducking) y un checklist amplio para usar cuando te quedas atascado. El debugging es un arte de persistencia con disciplina sistemática, y se aprende haciendo.

## El arte del debugging

No hay una forma estrictamente correcta o incorrecta de debuggear, aunque hay cosas que siempre conviene mirar. Los bugs que te llevan días a veces se arreglan con un cambio de una línea; la clave es llegar a esa línea rápido.

> [!note] El senior como mentor
> Cuando devs con menos experiencia se atascan, te van a venir a buscar. Es una oportunidad de mentoría y, a la vez, de aprender de cómo otros abordan problemas. A medida que el equipo crece, cada persona se vuelve experta en una parte; colaborar en debugging acelera a todos.

## Logs detallados

Los logs son la primera herramienta de debugging en backend. No hay un límite práctico a cuántos puedes poner; la clave es decidir **qué información es la más importante** para todos los que vayan a leerlos.

### Ejemplo: tracing de un flujo con Stripe

```typescript
public async createProduct(product: CreateStripeProductDto) {
  this.logger.debug(
    `Started product creation in Stripe with product data:
    ${JSON.stringify(product, null, 2)}`,
  );
  try {
    const productResponse = await this.stripe.products.create({
      name: product.name,
      description: product.description,
    });
    this.logger.log(
      `Response from stripe.products.create sdk:
      ${JSON.stringify(productResponse)}`,
    );
    this.logger.log(
      `Add price info for product id: ${productResponse.id},
      unit_amount: ${1009}, currency: ${'usd'}
      with stripe.prices.create sdk`,
    );
    const priceResponse = await this.stripe.prices.create({
      product: productResponse.id,
      unit_amount: 1009,
      currency: 'usd',
    });
    this.logger.log(`Response from stripe.prices.create sdk:
    ${JSON.stringify(priceResponse)}`);
    const productRecord = {
      stripeProductId: productResponse.id,
      name: productResponse.name,
      price: priceResponse.unit_amount,
    };
    this.logger.log(
      `Create product table record with productRecord:
      ${JSON.stringify(productRecord)}`,
    );
    try {
      const [dbProduct] = await this.prisma.$transaction([
        this.prisma.product.create({ data: productRecord }),
      ]);
      this.logger.debug(`Created product id: ${dbProduct.id} in product table`);
    } catch (err) {
      this.logger.debug(
        `DB rollback for product record: ${JSON.stringify(productRecord)}
        with error: ${JSON.stringify(err)}`,
      );
    }
  } catch (err) {
    this.logger.error(
      `Stripe failed with status: ${err.status} and error:
      ${JSON.stringify(err)}`,
    );
    throw new Error(`Stripe failed with status: ${err.status}`);
  }
}
```

Hay nueve logs ahí, y podrías añadir más. Cosas que notar:

- **Stringifica los objetos** siempre. Sin `JSON.stringify` acabas con `[Object object]` que no dice nada.
- **Incluye el environment** en algunos logs para distinguir producción de staging.
- **Usa distintos niveles** según la severidad (más abajo).
- **Loggea requests y responses** cuando llamas a servicios externos.

> [!tip] Jeff Graham sobre cuánto loggear
> La cantidad "correcta" de logs es difícil de calibrar. La prueba es local: ¿puedes diagnosticar un problema con tu API leyendo solo los logs? Si no, añade más. CloudWatch, Splunk, Datadog y New Relic te ayudan a buscar. Y recuerda: **los logs pueden contener PII sin querer**. Asegúrate de ofuscar o eliminar esos datos antes de producción.

## Niveles de log

| Nivel | Para qué sirve | Ejemplo |
|---|---|---|
| `trace` | Lo más verboso. Solo cuando necesitas visibilidad granular. | Cada paso en una función compleja. |
| `debug` | Diagnóstico, trabajar en test env. | "Started payment in Stripe" |
| `info` | Lo que pasó, sin ser crítico. | "GET /v1/orders requested" |
| `warn` | Algo inesperado pero la app sigue. | "Data parsed incorrectly" |
| `error` | Algo para de funcionar como debería. 4xx/5xx. | "Stripe failed with status: 500" |
| `fatal` | Funcionalidad core caída. | "DB down, users can't log in" |

Mezclar niveles en el mismo archivo de logs es **ruido**. Si todo está a `error`, te costará distinguir lo importante. Si todo está a `debug`, no podrás encontrar lo urgente.

### Cuidado con los try-catch anidados

Try-catch anidados pueden **suprimir errores silenciosamente**. Revisa siempre qué hace cada catch, especialmente cuando el error de un servicio externo se loggea y se relanza con un mensaje custom.

### Preserve el error original

Cuando customizas el error, **incluye el error original en el log**. Si solo loggeas tu mensaje custom, pierdes la información que da el servicio externo sobre qué pasó.

> [!note] Los tests te salvan aquí
> Si tienes unit tests para cada path del código, vas a cazar errores en desarrollo, antes de que lleguen a logs de producción. Cada escenario de error debería tener su test.

## Qué buscar en los logs cuando debuggeas

Cuando abres los logs en producción, mira:

- **Timestamp** del incidente. Filtra por esa ventana.
- **Servicios que aparecen**. ¿De qué parte de la app viene el error?
- **Status codes**. Te llevan al endpoint concreto.
- **Auth messages**. ¿Hay un problema de token o permisos?
- **Parámetros** enviados. ¿Llegan los valores correctos?
- **Frecuencia**. ¿Pasa siempre o solo a veces? Si solo a veces, mira concurrencia.

También mira si hay **errores que no causaron el bug actual pero que pasaron antes**. Un error en un job hace dos días puede haber dejado la base de datos en un estado raro que ahora explota.

## Configuraciones de entorno

Uno de los despistes más comunes: una variable de entorno nueva que pusiste en local pero no añadiste al pipeline, al CircleCI, al infra como código, etc. El CI lo va a detectar en el primer build, pero si la pieza llega a producción sin esa variable, vas a perder horasdebuggeando "qué pasa que esto no funciona".

Cosas concretas que mirar en la config:

- ¿Están todas las variables de entorno añadidas en todos los sitios (`.env`, pipeline, infra)?
- ¿Se rotó alguna credencial de un servicio externo sin avisar?
- ¿Tu deploy está yendo al entorno correcto? Compara el hash del artifact con el que esperas.
- ¿Algún stage del pipeline está fallando silenciosamente?

> [!tip] Pareja con DevOps
> Cuando el debugging toca infra, **pide a DevOps que se siente contigo**. Las responsabilidades se difuminan y entre los dos vais a aislar el problema más rápido.

## Estrategias para trazar bugs

### Tómate un descanso

Cuando llevas horas mirando los mismos archivos, tu cerebro se queda atascado. Ve a caminar o trabaja en otra cosa. A la vuelta, muchas veces el problema es obvio. Es real.

### La regla de los 30 minutos

Intenta debuggear solo durante 30 minutos. Si no has pasado del error inicial, **pide ayuda a un teammate**. Una mirada fresca ve cosas que tú ya no ves.

### Usa console.log

Es la herramienta más simple. Loggea cada línea si hace falta. Verás llamadas inesperadas o transformaciones de datos que pasan desapercibidas.

### Escribe hacky code para probar hipótesis

Comentando líneas y dejando que el código falle antes, puedes aislar qué parte está causando el problema. **No tiene que ser PR-ready**. Es código de investigación, lo limpias cuando ya sepas la solución.

```typescript
// if (!user) {
//   throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
// }
// if (!user.roles.includes('Customer')) {
//   throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
// }
// ... más comentarios ...
try {
  // const newOrder = await this.ordersService.createOrder(order);
  const newOrder = {
    id: 35354252,
    total: 1342.24,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [],
    userId: 7,
  };
  return newOrder;
} catch (err) {
  throw new HttpException('Something happened', HttpStatus.NOT_FOUND);
}
```

Vas descomentando poco a poco hasta que encuentras qué línea rompe.

### Usa herramientas para verificar

- **Postman / RapidAPI**: para probar endpoints como lo haría un cliente.
- **pgAdmin** (o el cliente de tu DB): para ver los datos directamente.
- **Chrome DevTools** + Network tab: para ver qué manda realmente el frontend.

### Reproduce el bug con datos falsos

A veces hackear un poco de data en el código y correrlo local reproduce el bug. En el proceso de reproducirlo, lo resuelves. Y a veces descubres **bugs de servicios externos** que no esperabas (estructura de respuesta rara, transformaciones inesperadas, etc.).

### Doble chequea la lógica de negocio

A veces el sistema hace exactamente lo que el código dice, pero la lógica de negocio no es la que pensabas. Habla con Producto: "¿es un bug o es un feature?". Esas conversaciones aclaran mucho.

## Ayudar a otros devs a debuggear

### Método científico

Forma una hipótesis, diseña un test, ejecútalo, observa. Ejemplo:

> Hipótesis: el user no tiene el rol Customer.
> Test: llama al endpoint en Postman con un user que sí tiene el rol.
> Observa: la terminal dice si hay error o no.

Si la hipótesis se confirma, vale. Si no, prueba otra.

### Flow diagrams

Dibuja el camino exacto del bug: qué eventos pasan, qué código se toca. Herramientas como Miro o un Google Slide rápido valen. Te ayuda a ti y al dev a ver el mismo mapa.

### Descomposición del problema

¿Está en el controller o en el service? Si está en el service, ¿es código del service o interacción con DB o servicio externo? Ve acotando hasta llegar al lugar exacto.

### Rubber-ducking

Pídele al dev que **explique el código línea por línea**, en voz alta o por chat, a un objeto inanimado o a ti. El acto de verbalizar el problema muchas veces **revela la solución**. A veces no tienes que decir nada, ellos solos lo ven.

> [!tip] AI como rubber-duck automatizado
> Herramientas como ChatGPT o Copilot son útiles aquí: leen tu código, te ayudan a describir el problema y te dan feedback. No las uses para enviar código propietario si tu organización lo prohíbe, pero como sparring técnico son geniales.

## Checklist de debugging

No es exhaustivo, pero cubre los puntos principales. Úsalo cuando te quedes atascado:

**Application logs**

- ¿Hay errores? ¿De dónde vienen?
- ¿Cuándo empezó el problema?
- ¿Hay stack traces útiles?
- ¿Fuiste a la línea de código que marca el error?

**Access token**

- ¿Está expirado?
- ¿El requester tiene los permisos correctos?
- ¿Está malformado (alguien lo editó a mano)?

**Request**

- ¿Están los parámetros correctos?
- ¿Los tipos son los correctos?
- ¿Es un problema de CORS?
- ¿Los headers están bien?

**Response**

- ¿Mandó el error esperado?
- ¿La data venía en el formato correcto?
- ¿Hay transformaciones de datos antes de enviar la respuesta?
- ¿Se llamó a algún servicio de terceros antes?

**Database**

- ¿Se actualizaron/consultaron los campos esperados?
- ¿Cuándo fue la última actualización?
- ¿Qué pasa si haces un raw SQL query vs la query del ORM?

**Environment**

- ¿Añadiste las nuevas variables de entorno?
- ¿Actualizaste las existentes?
- ¿Las variables están en infra, pipeline, código?
- ¿Un servicio externo rotó valores?
- ¿Estás deployando al entorno correcto?
- ¿Puedes checkear la versión del artifact?
- ¿Pediste a DevOps que se siente contigo?

**Third-party services**

- ¿Sacaron una nueva versión?
- ¿Cambiaron nombres o tipos de campos?
- ¿Has releído los docs para request/response?
- ¿Cambió algo en el dashboard?
- ¿Necesitas una nueva API key?

**Code**

- ¿Todos los paquetes están actualizados?
- ¿Has ido método por método línea por línea?
- ¿Probaste reduciendo el código a su forma más simple y añadiendo poco a poco?
- ¿Hay try-catch blocks que puedan suprimir errores?
- ¿Cómo se manejan los errores de DB?
- ¿La lógica de negocio tiene sentido?
- ¿Hay otras partes del código que tocan esta?

> [!tip] Tu propio checklist
> Con el tiempo, construye tu checklist personal. Yo tengo una y me ahorra muchísimo esfuerzo mental. Es tedioso, pero es la forma más thorough de descartar root causes.

## Próximos pasos

- [[10-performance-del-backend|Performance del backend]]: métricas clave, alertas, monitoring, estrategias y tipos de caching, implementación con Redis.
