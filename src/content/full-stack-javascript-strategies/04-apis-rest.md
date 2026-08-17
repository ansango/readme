---
title: "APIs REST"
description: "Convenciones de API, DTOs, controllers vs services, validación con class-validator, manejo de errores, logging y conexión con Prisma"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, api, rest, nestjs, dto]
---

# APIs REST

> [!abstract] Resumen
> Esta nota cubre el corazón de la exposición de datos: convenciones de API (formato JSON, versionado, naming), DTOs como contrato entre capas, la separación controller vs service, validación con class-validator, manejo de errores con códigos estándar y logging detallado. El objetivo es tener endpoints consistentes, fáciles de mantener y que sirvan de contrato claro con el frontend y otros consumidores.

## Por qué hacen falta convenciones

Cuando un equipo de developers trabaja en una API que va a ser consumida por el frontend y otros servicios, **las convenciones son el pegamento** que mantiene todo coherente. Cubren desde naming de endpoints hasta estructura de errores y versionado.

Las convenciones se documentan en un documento vivo que el equipo referencia al crear nuevos endpoints. Sirve para onboarding, para PR reviews y para que no haya ambigüedad sobre cómo se hace algo. La automatización con ESLint, Prettier, EditorConfig y Husky permite que las convenciones se cumplan **antes** del commit, no después del code review.

### Convenciones del proyecto del libro

- Enviar y recibir datos en formato JSON.
- Lógica de un endpoint no debe referenciar a otros endpoints (separación de concerns).
- El nombre del endpoint debe reflejar la relación de datos y funcionalidad (ej. `/orders/{orderId}/products`).
- Devolver códigos de error estándar con mensajes custom.
- Versionar los endpoints para manejar deprecations con elegancia.
- Manejar cálculos, paginación, filtrado y ordenación en el backend.
- Todos los endpoints que reciben datos deben tener validación.
- La documentación de endpoints se actualiza con cada cambio.

## Frontend y backend: la negociación

Siempre hay una tensión entre cuánto procesa el frontend y cuánto procesa el backend. La regla general:

- **Paginación, filtrado, ordenación y cálculos** van en el backend. Más eficiente y reduce la cantidad de datos que viaja por la red.
- **Filtrado visual** (esconder columnas, ordenar columnas en una vista concreta) puede ir en el frontend.

> [!note] Nunca cargues toda la data en el frontend
> Es muy raro que quieras cargar todos los datos de una tabla en el navegador. Siempre piensa en paginación desde el principio.

### Data boundaries

Los **data boundaries** son las líneas que separan dominios de datos. La idea es que un endpoint de `orders` no debería devolver datos de `products` directamente, y viceversa. El frontend puede mostrar datos cruzados, pero cada endpoint es responsable solo de su dominio.

> [!warning] Seguridad no es solo del frontend
> Aunque el frontend oculte datos sensibles, cualquier usuario con DevTools puede inspeccionar las respuestas de red. La **seguridad de datos siempre se enforza en el backend**. El frontend añade capas pero no sustituye al backend.

## Documento de convenciones

Un buen doc de convenciones cubre:

- Naming de endpoints y métodos.
- Estructura de respuestas exitosas.
- Estructura de respuestas de error.
- Paginación.
- Versionado.
- Validación.
- Status codes permitidos.
- Headers estándar.
- Rate limiting (si aplica).

### Ejemplo: estructura de respuesta paginada

```json
{
  "page": [
    {
      "id": 4,
      "first_name": "My first name",
      "last_name": "My last name",
      "email": "myemail@server.com"
    },
    {
      "id": 5,
      "first_name": "My first name",
      "last_name": "My last name",
      "email": "myemail@server.com"
    }
  ],
  "count": 3,
  "limit": 3,
  "offset": 0,
  "total_pages": 4,
  "total_count": 12,
  "previous_page": 1,
  "current_page": 2,
  "next_page": 3
}
```

### Ejemplo: estructura de respuesta de error

```json
{
  "errors": [
    { "statusCode": "111", "message": "age must be an int" },
    { "statusCode": "112", "message": "email is mandatory" }
  ]
}
```

> [!tip] Documentos de referencia
> Buenos puntos de partida para escribir tu propio doc de convenciones:
> - [Microsoft Azure: RESTful Web API Design](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
> - [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
> - [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

> [!warning] No fuerces convenciones antes de tiempo
> Implementa unas pocas features y observa cómo se sienten las convenciones en la práctica. Cuando ya las tengas estables, automatízalas con linting y hooks. Si las fuerzas antes de validarlas, vas a perder tiempo cambiando reglas que no tenían sentido.

## Construyendo la API y el primer endpoint

NestJS es el framework, pero el libro no entra en tutorial paso a paso de su sintaxis (la doc oficial es el sitio para eso). Lo que sí cubre es **la forma de pensar** que se traslada a cualquier framework.

### Estructura por feature

Cada feature tiene su propia carpeta dentro de `src/`:

```text
src/
├── orders/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── orders.controller.spec.ts
│   ├── orders.service.spec.ts
│   └── orders.interface.ts
├── products/
│   └── ...
└── utils/
    └── prisma.service.ts
```

### Controllers: la capa fina

Los controllers manejan **requests y responses**. No contienen lógica de negocio. Su trabajo es:

1. Recibir la request.
2. Validar los datos de entrada.
3. Llamar al service correspondiente.
4. Mapear errores a códigos HTTP.
5. Devolver la respuesta.

```typescript
// orders.controller.ts
@Get()
public async orders(): Promise<Array<Order>> {
  try {
    const orders = await this.ordersService.orders({});
    return orders;
  } catch (err) {
    if (err) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    throw new HttpException('Generic', HttpStatus.BAD_GATEWAY);
  }
}
```

> [!tip] Limpia el boilerplate
> Cuando inicies un proyecto con scaffolding, fíjate qué archivos de ejemplo puedes borrar sin miedo. En NestJS, `app.controller.spec.ts`, `app.controller.ts` y `app.service.ts` son ejemplos. Bórralos y limpia las referencias en `app.module.ts`. Cuanto menos código muerto haya, más fácil es entender el repo.

### Validación con DTOs

Los **DTOs (Data Transfer Objects)** encapsulan los datos que se transfieren entre capas. Sirven como modelo en frameworks MVC como NestJS y como contrato de qué datos se esperan.

```typescript
// orders.interface.ts
export class UpdateOrderDto {
  @IsNumber()
  total: number;

  @IsNotEmpty()
  products: Product[];

  @IsNotEmpty()
  userId: number;
}
```

NestJS usa `class-validator` por debajo. Si el `userId` viene vacío o `total` no es un número, el DTO lanza un error automáticamente. La clave es que el frontend recibe **mensajes de validación útiles**, no errores genéricos, lo que mejora la UX y acelera el debug.

```typescript
// orders.controller.ts
@Patch(':id')
public async update(
  @Param('id', ParseIntPipe) id: number,
  @Body() order: UpdateOrderDto,
): Promise<Order> {
  try {
    return await this.ordersService.updateOrder({
      where: { id },
      data: order,
    });
  } catch (err) {
    if (err) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    throw new HttpException('Generic', HttpStatus.BAD_GATEWAY);
  }
}
```

Fíjate en el patrón `try-catch` consistente en todos los endpoints. Es un buen candidato para convention: cualquier PR que no lo cumpla, se devuelve.

## Services: la lógica de negocio

Los services son donde vive la lógica de negocio. Cálculos, transformaciones, llamadas a la base de datos, llamadas a otros servicios. Los controllers quedan finos y los services se pueden testear de forma aislada.

```typescript
// orders.service.ts
public async updateOrder(params: {
  where: Prisma.OrderWhereUniqueInput;
  data: Prisma.OrderUpdateInput;
}): Promise<Order> {
  const { data, where } = params;

  this.logger.log(`Updated existing order ${where.id}`);

  try {
    const updatedOrder = await this.prisma.order.update({
      data: {
        ...data,
        updatedAt: new Date(),
      },
      where,
    });

    this.logger.log(`Updated for existing order ${updatedOrder.id} successful`);
    return updatedOrder;
  } catch (err) {
    this.logger.log(`Updated for existing order ${where.id} failed`);
    throw new HttpException(err.message, HttpStatus.CONFLICT);
  }
}
```

> [!note] Logs descriptivos
> Los logs son la primera herramienta de debugging en backend. Hazlos descriptivos: incluye el ID del recurso, el resultado de la operación, los valores clave. Cuando algo falla en producción, esos logs son lo que te va a decir qué pasó.

## Conexión con la base de datos

Crea una carpeta `utils/` o `helpers/` para servicios transversales. Dentro, un `prisma.service.ts` que instancie el Prisma Client y lo conecte a la base de datos. Copia el código base de la doc oficial de NestJS y customízalo.

> [!tip] Mueve aquí lo que se repite
> Cada vez que veas una función pequeña usada en varios sitios (formatters de datos, helpers de fechas, transformadores), muévela a `utils/`. Es un ahorro para ti y para los que vengan detrás.

## Convenciones que resumen lo aprendido

- **Validación en cada endpoint que recibe datos**, vía DTOs.
- **Logging** en los puntos cruciales del flujo (inicio, fin, errores).
- **Manejo de errores con try-catch** consistente.
- **Controllers finos, services gordos** (lógica en services, no en controllers).
- **Errores del service** burbujean al controller, que los mapea a HTTP.

## Próximos pasos

- [[05-servicios-de-terceros|Servicios de terceros]]: cómo elegir un proveedor (Stripe como ejemplo), trade-offs de cada integración, y qué partes del código aislar.
