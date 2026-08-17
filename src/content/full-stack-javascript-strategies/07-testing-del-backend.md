---
title: "Testing del backend"
description: "Por qué testear el backend, trade-offs de cobertura, tests unit con Jest, mock data, e2e tests con Postman/Cypress y colaboración con QA"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, testing, jest, mock-data, qa]
---

# Testing del backend

> [!abstract] Resumen
> Esta nota cubre el lado práctico de los tests en el backend: por qué vale la pena invertir tiempo en ellos, qué trade-offs aceptar, cómo escribir unit tests con Jest, qué son los e2e tests, cómo manejar mock data y cómo encaja QA en el flujo. El objetivo es tener un mindset de testing que sobreviva al crecimiento del proyecto, no a una cobertura del 100% que no aporta valor real.

## Por qué dedicar tiempo a los tests

A medida que un proyecto crece, las **regresiones** (cambios que rompen funcionalidad que ya funcionaba) son inevitables. Los tests son la red de seguridad que las caza antes de que lleguen a producción.

En el backend los tests verifican:

- Que los errores se llaman en los escenarios correctos.
- Que los datos se devuelven en el formato correcto.
- Que los métodos se llaman con los parámetros correctos.

> [!tip] Tests como documentación
> Un test bien escrito es documentación ejecutable. Muestra cómo se espera que funcione el código, qué inputs son válidos, qué errores se devuelven. Cuando un dev nuevo llega al proyecto, leer los tests es una de las formas más rápidas de entender el sistema.

## Trade-offs

Hay developers con opiniones muy fuertes sobre testing. Los puntos de equilibrio importantes:

- **Cobertura 100% en backend es alcanzable pero costosa.** Un 90% es más razonable. Hay tests que no aportan valor y solo quitan tiempo.
- **Más tests = release cycles más lentos** al principio. El ROI aparece a medio plazo: menos hotfixes, menos sustos en producción, más confianza al hacer refactors.
- **Tests e2e + unit tests son complementarios**, no redundantes. Los unit verifican implementación; los e2e verifican el flujo que verá un usuario.

> [!warning] El espejismo de "lo escribo después"
> Decir "lo escribo después para salir del paso" es una trampa. Los tests se van al backlog cuando entran bugs y features, y nunca vuelven. Escríbelos con la implementación.

> [!tip] Vende los tests a Producto
> Si tu equipo de Producto no ve el valor de los tests, muéstrales cómo evitan hotfixes. Una vez vean el ROI, van a empezar a preguntar por escenarios adicionales para que escribas tests más completos.

## Colaboración con QA

Si tienes un equipo de QA:

- Los **devs escriben los unit tests**.
- **QA puede escribir e2e tests** automatizados contra el entorno de desarrollo.
- Es una **colaboración**, no una división estricta. Si no hay QA dedicated, el dev team cubre ambas capas.

## Cómo enfocar la escritura de tests

No hace falta ser purista de TDD o BDD. Lo importante es saber **qué testear**.

Cuando escribes unit tests en el backend, verificas **funcionalidad específica**:

- ¿Qué pasa exactamente cuando llega una request a un endpoint?
- ¿Se devuelven los errores esperados en los casos correctos?
- ¿Las funciones internas se llaman con los parámetros correctos?
- ¿Devuelven los datos esperados?

### Recorre el código línea a línea

> [!tip] Tests con el código abierto a la vez
> Tener el archivo de test y el archivo de código abiertos en columnas lado a lado ayuda a ver si has cubierto cada rama mientras avanzas por el código.

### Cuándo mockear

- **Paquetes externos**: mockear. No quieres que tu test dependa de que la API de Stripe responda.
- **Código interno del equipo**: generalmente no hace falta mockear. Que el test llame al código real.

### Qué cubrir con los tests

- Condiciones que disparan errores.
- Status codes HTTP en distintas situaciones.
- Cómo afectan los permisos de usuario al resultado.
- Cualquier cosa que cambie el output que recibe un usuario o servicio.

## Tests con Jest

Jest es la elección estándar en proyectos NestJS. Veamos un ejemplo sobre un controller.

### El código bajo test

```typescript
@Post()
public async create(@Body() user: User, order: CreateOrderDto): Promise<Order> {
  if (!user) {
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
  if (!user.permissions.includes('create:orders')) {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }
  if (!order) {
    throw new HttpException('No order data', HttpStatus.BAD_REQUEST);
  }
  if (order.products.length === 0) {
    throw new HttpException('No products in order', HttpStatus.CONFLICT);
  }
  if (!order.total) {
    throw new HttpException('No order total', HttpStatus.CONFLICT);
  }
  try {
    const newOrder = await this.ordersService.createOrder(order);
    return newOrder;
  } catch (err) {
    throw new HttpException('Something happened', HttpStatus.NOT_FOUND);
  }
}
```

### Test suite

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersV1Controller } from './orders.controller';
import { OrdersService } from './orders.service';

const user = {
  id: 1001,
  email: 'tester@rest.com',
  name: 'Tester Rest',
  permissions: ['get:orders', 'create:orders'],
};

const order = {
  name: 'Biggest order',
  total: 125.99,
  stripeInvoiceId: 'stripeInvoiceId',
};

describe('OrdersController', () => {
  let controller: OrdersV1Controller;
  let ordersService: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersV1Controller],
      providers: [OrdersService],
    }).compile();
    controller = module.get<OrdersV1Controller>(OrdersV1Controller);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('throws unauthorized error if the user is undefined', async () => {
    await controller.create(undefined, order);
    expect(controller.create).toThrowError('Unauthorized');
  });

  it('throws forbidden error if the user does not have correct permissions', async () => {
    const badPermissionsUser = {
      id: 1001,
      email: 'tester@rest.com',
      name: 'Tester Rest',
      permissions: ['get:products'],
    };
    await controller.create(badPermissionsUser, order);
    expect(controller.create).toThrowError('Forbidden');
  });

  it('throws bad request error if the order is undefined', async () => {
    await controller.create(user, undefined);
    expect(controller.create).toThrowError('No order data');
  });

  it('throws conflict error if products are missing from the order', async () => {
    const orderWithoutName = {
      total: 125.99,
      stripeInvoiceId: 'stripeInvoiceId',
    };
    await controller.create(user, orderWithoutName);
    expect(controller.create).toThrowError('No order name');
  });

  it('throws conflict error if the order total is missing', async () => {
    const orderWithoutTotal = {
      name: 'Biggest order',
      stripeInvoiceId: 'stripeInvoiceId',
    };
    await controller.create(user, orderWithoutTotal);
    expect(controller.create).toThrowError('No order total');
  });

  it('successfully creates a new order', async () => {
    controller.create(user, order);
    const newOrder = await ordersService.createOrder(undefined);
    expect(ordersService.createOrder).toBeCalledWith(order);
    expect(ordersService.createOrder).toReturnWith(newOrder);
  });

  it('throws not found error if something happens in the service', async () => {
    try {
      controller.create(user, order);
      await ordersService.createOrder(undefined);
      expect(ordersService.createOrder).toThrowError();
    } catch (e) {
      expect(e.message).toBe('Something happened');
    }
  });
});
```

De una función con cinco errores posibles y un happy path salen **siete tests**. Esa es la mecánica: cada rama de código se traduce en al menos un test.

> [!tip] AI tools para tests
> Herramientas como Copilot o ChatGPT son útiles para acelerar la escritura de tests o generar escenarios que no habías pensado. No las uses como sustituto de entender qué estás testeando, pero sí como acelerador.

### Mensajes de error

> [!note] Mensaje corto y útil
> El mensaje de error que devuelve tu API al frontend debe ser **breve y específico**, sin filtrar PII ni info que un atacante pueda aprovechar. El status code asociado va aparte.

## e2e tests

Los e2e tests verifican el **flujo completo** de un usuario, no la implementación. Hay varias formas de hacerlos:

- **Postman / Thunder Client**: las colecciones de requests se pueden exportar a JSON, compartir con el equipo y versionar en el repo. Son amigables para gente no-dev.
- **Cypress / Playwright**: tests programáticos. La sintaxis es parecida a los unit tests. Más potente pero requiere que el equipo se ramp-up.

```typescript
it('/v1/orders (POST)', () => {
  return request(app.getHttpServer())
    .post('/v1/orders')
    .expect(200)
    .expect(order);
});
```

> [!warning] "e2e" significa cosas distintas para cada uno
> Para algunos, e2e implica frontend + backend. Para otros, e2e puede ser solo backend si verifica funcionalidad de alto nivel en lugar de implementación. No hay una definición canónica. Acuerda qué significa en tu equipo.

## Mock data

El mock data cubre los **escenarios** que quieres testear, no solo el caso feliz.

### Tipos de mocks

- **Mocks en archivos de test** (`__mocks__`): mocks de funciones externas.
- **Mocks como objetos completos en el test**: defines el objeto con todos los campos del schema y modificas lo que necesites para cada caso.
- **Faker / Falso**: genera datos aleatorios realistas. Útil para seed y para tests con datos variados.
- **Datos seed de la base de datos**: úsalos también como base para los tests. Mantener el seed sincronizado con el schema te ahorra dolores de cabeza al levantar el proyecto en una máquina nueva.

### Test data factories

Ethan Brown lo explica bien: en lugar de que cada dev reinvente el objeto user cada vez, define **factories** que devuelven datos realistas. Algo como `FakeUserFactory.create(10)` te da 10 usuarios con datos que podrían existir en producción.

> [!quote] Test data que cubra casos reales
> Si tienes un archivo con 15 usuarios ficticios para elegir, asegúrate de incluir casos raros: nombres ridículamente largos, nombres de una palabra, caracteres no latinos. Cuando un junior dev use uno de esos, recordará que tiene que manejar nombres extremos.

### Buena cobertura con poco código

Por cada test quieres:

- **Test data**: el input.
- **Expected response**: lo que esperas.

Con eso cubres el caso principal. Los edge cases se van añadiendo según los encuentras (y según hablas con Producto y QA sobre qué se considera "caso raro").

## Próximos pasos

- [[08-seguridad-del-backend|Seguridad del backend]]: autenticación, autorización, OWASP Top 10, audit trails, security testing (SAST, DAST) y rotación de credenciales.
