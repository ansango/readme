---
title: "Servicios de terceros"
description: "Cómo elegir un servicio de terceros, integrarlo en el backend (Stripe como ejemplo), aislar el código en una carpeta integrations, manejar errores, outages y upgrades"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, third-party, stripe, integrations]
---

# Servicios de terceros

> [!abstract] Resumen
> Esta nota cubre el ciclo de adopción de un servicio de terceros: criterios de evaluación, lista de categorías y proveedores, cómo integrarlo en el código de forma aislada (con el ejemplo de Stripe), qué partes de tu arquitectura actualizar, y los trade-offs operativos que hay que aceptar (precios, lock-in, outages, cambios en la API). El foco está en hacer la integración **resiliente y fácil de cambiar** sin dejar que el servicio imponga su estilo al resto del código.

## Por qué llegan los servicios de terceros

En algún momento del desarrollo de un producto aparece la necesidad de usar un servicio externo. Funcionalidad que tardaría muchísimo en implementarse, sería difícil de mantener, o necesitaría su propio equipo: pagos, autenticación, monitoring, logging, etc. El servicio lo mantiene otra empresa, tú pagas una fee y tienes acceso a soporte.

En el proyecto del libro el servicio de terceros es **Stripe** para la parte de pagos. La razón principal: tiene muy buena documentación, una comunidad enorme de developers, y un entorno de testing bien cuidado.

> [!note] El servicio puede cambiar sin avisarte
> Cualquier servicio de terceros es **código de interfaz** que no controlas. La API puede romperse, los formatos de respuesta pueden cambiar, pueden deprecar funciones. Por eso el logging y el manejo de errores son más importantes que nunca en estas integraciones.

## Criterios para elegir un servicio

Elegir un servicio de terceros se parece a elegir un paquete de código, con la diferencia clave de que **cuesta dinero**. No hay nada malo en pagar si eso ahorra tiempo de desarrollo y saca features antes y con más confianza.

### Qué investigar

- **Documentación buena y actualizada con regularidad.** Si la doc es mala, vas a perder horasdebuggeando.
- **Cómo se gestionan las releases de nuevas versiones.** ¿Te avisan con tiempo? ¿Hay changelog?
- **Soporte responsive.** ¿Hay alguien al otro lado cuando algo se rompe?
- **Pricing claro**, aunque tengas que hacer una call con un sales rep para entenderlo.
- **Otras opciones** para esa misma funcionalidad (no te cases con el primer candidato).
- **Madurez y estabilidad de la empresa.** ¿Van a estar en el mercado en 3 años?
- **Facilidad de integración** con tu arquitectura actual.
- **Comparación con otras soluciones populares.**
- **Sandbox o entorno de testing** para probar antes de comprometerte.
- **Coste de migración** si en el futuro tienes que cambiar.

> [!tip] Prueba con la integración mínima
> Una vez tengas un candidato, **intenta añadir la integración más pequeña posible a tu código**. Cuánto tarda te da una medida real de cómo será trabajar con el servicio.

> [!warning] Lee opiniones después de firmar
> Antes de firmar un contrato, busca experiencias de otros developers con ese servicio tras un año de uso. Es fácil que un servicio parezca bueno en la demo y se vuelva un infierno cuando hay un bug gordo y nadie responde.

### Consideraciones geopolíticas

Si el software lo usará un gobierno o una empresa regulada, **el país de origen del servicio importa**. Ciertas legislaciones obligan a evitar software de ciertos países. Por el lado contrario, hay empresas que eligen servicios por razones geopolíticas positivas.

### Mira el GitHub del servicio

Si el servicio tiene repo público, mira las issues: verás los problemas más comunes que otros developers han tenido y cómo los resolvió la empresa. Es información que ninguna demo te va a dar.

### Cómo interactúan entre sí

Si usas varios servicios, mira si hay integraciones entre ellos (por ejemplo, vía Zapier o servicios nativos del cloud provider). Complementarse bien es una ventaja competitiva.

## Lista de servicios comunes por categoría

### Pagos

- Stripe, Square, Clover, PayPal, Paddle.

### Logging y monitoring

- Datadog, New Relic, Splunk, Sentry.

### Apps de terceros (integración con redes)

- Meta, Instagram, YouTube, Google Workspace.

### Ecommerce

- Shopify, Amazon, Etsy, BigCommerce.

### Autenticación

- Auth0, FusionAuth, Amazon Cognito, SuperTokens, Clerk.

### Email

- SendGrid, Amazon SES, Mailgun, Postmark, Brevo.

### Geolocalización

- Google Maps, Mapbox, Esri ArcGIS, Radar.

> [!note] La estructura de datos importa
> Antes de comprometerte con un servicio, **inspecciona la estructura de las respuestas de su API**. Algunos servicios están muy bien documentados; otros devuelven datos en formatos raros que te obligan a escribir adapters custom.

## Integración con Stripe

Stripe cumple los requisitos para un servicio de pagos de ecommerce: tiene **PCI DSS compliance** built-in, lo que significa que maneja datos sensibles de pago con un nivel de seguridad alto sin que tengas que certificarte tú.

### Estructura de carpetas

Crea una carpeta `integrations/` dentro de `src/`. Dentro, una subcarpeta por servicio:

```text
src/
├── integrations/
│   └── stripe/
│       ├── stripe.controller.spec.ts
│       ├── stripe.controller.ts
│       ├── stripe.interface.ts
│       ├── stripe.module.ts
│       ├── stripe.service.spec.ts
│       └── stripe.service.ts
├── orders/
├── app.module.ts
└── main.ts
```

Esta organización escala bien: cuando llegue el siguiente servicio (Auth0, SendGrid, etc.), tendrá su propia subcarpeta sin contaminar el resto.

> [!tip] Empieza por una quick win
> Empezar por una pieza pequeña (un módulo con su controller y su service) genera momentum. Ver el esqueleto funcionando anima a seguir. La autora suele empezar por los imports del módulo, luego controller, luego service, e ir actualizando la interfaz según va escribiendo.

### Actualiza el diagrama de arquitectura

Cualquier integración nueva debe quedar reflejada en el **diagrama de arquitectura**. Es la fuente de verdad cuando alguien pregunta cómo encaja una pieza. Mantenerlo al día es una de las tareas de mentoring más valiosas que puedes hacer.

### Variables de entorno

Añade la secret key de Stripe al `.env`:

```text
STRIPE_SECRET_KEY="sk_your_stripe_account_secret_key"
```

Como siempre, **`.env` en `.gitignore`** y la key real configurada en el pipeline de CI/CD como secret.

### El controller

```typescript
// stripe.controller.ts
import {
  Body, Controller, Headers, HttpException, HttpStatus, Post, Res,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateStripePaymentDto } from './stripe.interface';

@Controller('/v1/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/payments')
  public async createPayment(
    @Body() payment: CreateStripePaymentDto,
    @Headers() headers,
    @Res() res,
  ) {
    try {
      const paymentInfo = await this.stripeService.createPayment({
        payment, res, origin: headers.origin,
      });
      return paymentInfo;
    } catch (err) {
      throw new HttpException('Something happened', HttpStatus.NOT_FOUND);
    }
  }
}
```

El redirect al checkout de Stripe se hace en el service. El controller solo recibe la request, valida con el DTO y delega.

### DTOs espejo de la API del servicio

```typescript
// stripe.interface.ts
import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateStripePaymentDto {
  @IsNotEmpty()
  priceId: string;

  @MinLength(1, { message: 'quantity has to be at least 1' })
  quantity: number;
}
```

> [!tip] Espejo vs SDK types
> Cuando la API del servicio está bien documentada, **espeja los tipos en tu propia interfaz** para tener control sobre cómo entran los datos en tu app. Si solo usas los tipos del SDK directamente, cualquier breaking change en el SDK te rompe el código sin previo aviso. Los tipos espejo son un firewall.

### El service

```typescript
// stripe.service.ts
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-08-16',
  });

  public async createPayment({ payment, origin, res }) {
    this.logger.log('Started payment in Stripe');
    try {
      const session = await this.stripe.checkout.sessions.create({
        line_items: [{
          price: payment.priceId,
          quantity: payment.quantity,
        }],
        mode: 'payment',
        success_url: `${origin}/?success=true`,
        cancel_url: `${origin}/?canceled=true`,
      });
      res.status(303).redirect(session.url);
    } catch (err) {
      throw Error('Something happened with Stripe');
    }
  }
}
```

> [!warning] La versión de la API va como string literal
> Stripe recomienda fijar `apiVersion` como string literal en la inicialización. No la saques a una variable; está ahí por una razón.

### Logs + monitoring = debugging con precisión

Los logs estructurados en el service (inicio, fin, errores, IDs) combinados con un servicio como Datadog te dan visibilidad total de qué pasa en cada interacción con Stripe. Cuando algo falla, los logs son lo que te dice exactamente dónde.

### ¿Qué pasa cuando el servicio está caído?

Piensa en los **edge cases**: ¿qué hace tu app si Stripe no responde? ¿O si la red entre tu backend y Stripe se cae a mitad de un pago? Estas conversaciones con Producto tienen que pasar al principio de la integración, no cuando el primer usuario pierda su carrito.

### Schema updates

La integración con Stripe puede requerir campos nuevos en tu base de datos (por ejemplo, `stripeProductId` para mapear tus productos con los de Stripe). Esos cambios implican migraciones. Planifícalos como cualquier otro cambio de schema.

## Trade-offs a aceptar

El código de terceros puede **romper tus convenciones**. El formato de error de Stripe no es el que definiste en tu doc de convenciones, los nombres de campos vienen en `snake_case` en lugar de `camelCase`, etc. Acepta una zona gris en tus convenciones para integraciones externas; intentar forzarlas todas a tu estilo suele generar más problemas que beneficios.

> [!note] Migrar de servicio es caro
> Cuando eliges un servicio, estás firmando un compromiso a varios años. Por eso la evaluación inicial es crítica. Si en el futuro necesitas migrar (porque el servicio se vuelve caro, lo adquiere otra empresa, cambia sus términos, deprecate funciones clave), prepárate para reescribir una cantidad significativa de código de integración.

## Próximos pasos

- [[06-background-jobs|Background jobs]]: cron jobs para sincronizar datos con Stripe, background jobs para enviar emails, alertas y monitoring, problemas comunes de data sync.
