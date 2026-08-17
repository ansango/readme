---
title: "Esquema de datos"
description: "Diagramar el modelo de datos, montar Postgres, elegir ORM (Prisma), escribir migraciones y seed data, buenas prácticas para el schema inicial"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, database, postgresql, prisma, orm]
---

# Esquema de datos

> [!abstract] Resumen
> Esta nota cubre el diseño de la capa de datos del proyecto: cómo diagramar el modelo, montar Postgres, elegir un ORM (Prisma en este caso), traducir el diagrama a un schema ejecutable, escribir migraciones y crear seed data. La regla de oro: el schema de datos **dirige todo lo demás**, así que vale la pena dedicarle tiempo y revisarlo en equipo antes de empezar a migrar.

## El schema dirige todo

El esquema de datos es la pieza más importante de toda la aplicación. Cambiar un schema es caro porque afecta a migraciones, a la API, al frontend, a los servicios de terceros que la consumen. Por eso el primer paso siempre es **diagramar** antes de tocar código.

> [!note] No vamos a hablar de no relacionales
> El libro trabaja exclusivamente con bases de datos relacionales (Postgres). Las no relacionales (MongoDB, DynamoDB, etc.) tienen su sitio, sobre todo cuando el formato de los datos es muy variable o hay eventos con estructura cambiante, pero la mayoría de apps de negocio se manejan bien con una relacional.

## Pasos básicos para la capa de datos

1. **Hacer un diagrama** del schema: entidades, columnas, tipos de datos, relaciones.
2. **Configurar la conexión** a la base de datos. En el proyecto del libro se usa Prisma con PostgreSQL, pero hay otras opciones populares (Knex.js, Drizzle).
3. **Escribir el schema en código** traduciendo el diagrama.
4. **Añadir seed data** para que la base de datos tenga datos esenciales desde el principio y para testear en distintos entornos.
5. **Correr migraciones** para que los cambios lleguen a la base de datos real.
6. **Validar con SQL básico** que las tablas se crean, actualizan y almacenan datos como esperas.

## Diagrama del schema

Un buen diagrama vale más que mil líneas de documentación textual. Debe incluir:

- Tablas (entidades).
- Columnas y tipos de datos.
- Relaciones entre tablas (uno-a-muchos, muchos-a-muchos).

> [!tip] No pierdas tiempo en la herramienta
> Developers pierden horas discutiendo sobre qué herramienta de diagramación usar. Lo importante es que el diagrama sea legible para todos. Opciones:
> - **DBeaver**: se conecta a la base de datos y genera el diagrama desde el schema real.
> - **Miro / FigJam**: para mantener toda la documentación arquitectónica en un solo lugar.
> - **dbdiagram.io**: para hacer diagramas rápidos con sintaxis propia.
> - **draw.io**: gratis y exporta a muchos formatos.

El proyecto del libro tiene tres tablas principales:

- **User**: id, email (único), name, address, orders (relación 1-N con Order).
- **Order**: id, total, createdAt, updatedAt, products (relación N-N con Product vía tabla pivote), userId.
- **Product**: id (UUID), name, price, createdAt, updatedAt.

> [!warning] Frontend no debe dictar el schema
> Una tentación común es diseñar el schema pensando en lo que el frontend necesita. La realidad es que el schema debe modelar el dominio correctamente; el frontend se adapta al schema vía la API. Eso sí: el endpoint que sirva los datos sí debe tener en cuenta las queries que el frontend va a hacer (búsquedas, ordenaciones, paginación).

Una vez tengas el diagrama, **llévalo al equipo**. Frontend devs pueden tener requisitos de formato de datos, otros devs pueden levantar consideraciones de seguridad, y un peer review en este punto ahorra muchos problemas a futuro.

## Configurar Postgres

Postgres es open source, tiene décadas de fiabilidad y está detrás de algunas de las apps más grandes del mundo. Para desarrollo local:

1. Descargar Postgres desde la web oficial.
2. Seguir el instalador y fijar una master password.
3. Abrir **pgAdmin** y crear una nueva base de datos (`dashboard` en el ejemplo).

Una vez creada, guarda estos valores (los necesitarás para la `DATABASE_URL`):

- **Host:** `localhost`
- **Port:** `5432` (por defecto)
- **Username:** `postgres` (por defecto)
- **Password:** la que pusiste durante la instalación
- **Database name:** `dashboard`

> [!note] Seguridad básica desde el día uno
> Aunque sea local, configurar un password no trivial para Postgres te obliga a pensar como si fuera producción. Si lo dejas abierto y más adelante te olvidas, te puede pillar desprevenido.

## SQL básico que conviene saber

No hace falta ser experto en SQL, pero tener un puñado de comandos a mano es útil para validar que el ORM está haciendo lo correcto:

```sql
-- Insertar una fila
INSERT INTO Orders (id, name, total) VALUES (4, 'Mark', 25.99) RETURNING id;

-- Consultar
SELECT * FROM Orders;

-- Borrar
DELETE FROM Orders WHERE id = 4 RETURNING *;
```

Si manejas `INSERT`, `SELECT`, `UPDATE` y `DELETE` tienes suficiente para verificar manualmente que los datos están donde esperas. Para profundizar: SQLBolt, LearnSQL.com.

## Elegir ORM

La elección del ORM es una de las grandes decisiones del proyecto. Migrar de ORM más adelante es caro porque hay que reescribir todas las queries y la capa de acceso a datos.

NestJS trae soporte built-in para TypeORM, Sequelize y Mongoose. Otros comunes: Knex.js, Prisma. La elección se basa en:

- Experiencia del equipo.
- Mantenimiento y comunidad del proyecto.
- Limitaciones conocidas (algunos ORMs manejan mal ciertos tipos de queries).

> [!tip] El proyecto usa Prisma
> El libro usa **Prisma** por varias razones: el equipo ya lo conoce, tiene documentación excelente, comunidad grande y funciona muy bien con Postgres. Esa es la decisión por defecto razonable; las alternativas son igual de válidas según el contexto.

### Instalación de Prisma

```bash
npm install prisma @prisma/client tsx --save-dev
```

> [!note] Tipos de dependencias
> - **dependencies**: paquetes necesarios para correr la app en producción.
> - **devDependencies**: paquetes solo para desarrollo (testing, linting, scaffolding).
> - **peerDependencies**: paquetes que tu app espera que estén en la app que la consume (relevante si publicas una librería).

### Inicializar Prisma

```bash
npx prisma init --datasource-provider postgresql
```

Esto crea el directorio `prisma/` con un `schema.prisma` vacío y un `.env` con la URL de la base de datos.

```text
✔ Your Prisma schema was created at prisma/schema.prisma
warn You already have a .gitignore file. Don't forget to add `.env` in it to not commit any private information.
```

> [!warning] .env en .gitignore
> El `.env` contiene credenciales. Asegúrate de que está en `.gitignore` **antes** de hacer el primer commit. Las credenciales reales van en tu pipeline de CI/CD como secrets.

### Configurar la DATABASE_URL

En el `.env`:

```text
DATABASE_URL="postgresql://username:password@localhost:5432/dashboard"
```

Y en el pipeline (ejemplo con GitHub Actions):

```yaml
name: Node.js CI
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
env:
  DATABASE_URL: ${{ secrets.ProdDatabase }}
jobs:
  build:
    runs-on: ubuntu-latest
```

### Definir los modelos

En `prisma/schema.prisma`:

```prisma
// schema.prisma
model User {
  id      Int     @id @default(autoincrement())
  email   String  @unique
  name    String
  address String
  orders  Order[]
}

model Order {
  id        Int      @id @default(autoincrement())
  total     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  products  Product[]
  userId    Int?
  User      User?    @relation(fields: [userId], references: [id])
}

model Product {
  id        String   @id @default(uuid())
  name      String
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}
```

Fíjate en cómo se modelan las relaciones:

- En **User**: array de `orders` (1-N con Order).
- En **Order**: `userId` opcional + relación con `User`.
- En **Product**: array de `orders` (N-N con Order; Prisma crea la tabla pivote automáticamente).

> [!tip] VS Code extension
> Instala la extensión de Prisma para VS Code. Tiene autocompletado, errores en tiempo real y formateo del schema.

## Escribir migraciones

Las migraciones son las queries SQL que el ORM genera a partir de tu schema. Cuando corres una migración, en el fondo estás ejecutando SQL. Por eso los ORMs son tan útiles: tú escribes en TypeScript y el ORM traduce.

```bash
npx prisma migrate dev --name initialize_dashboard_db
```

```text
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "dashboard", schema "public" at "localhost:5432"
Applying migration `20230318132006_initialize_dashboard_db`
The following migration(s) have been created and applied from new schema changes:
migrations/
  └─ 20230318132006_initialize_dashboard_db/
    └─ migration.sql
Your database is now in sync with your schema.
```

Después de correr la migración, abre Postgres y verifica que las tablas y columnas se crearon como esperabas. La forma más rápida de validar que la conexión funciona es ver las tablas directamente en pgAdmin.

> [!note] Tablas pivote automáticas
> Si tienes una relación N-N, Prisma crea una tabla pivote con el formato `_ModelAToModelB`. En el ejemplo verás `_OrderToProduct` que conecta Order y Product.

### Nombres descriptivos en migraciones

Cada vez que cambies el schema, crea una migración nueva con un nombre que describa el cambio (`add_user_phone`, `rename_orders_total`, etc.). El timestamp al inicio del nombre lo genera Prisma automáticamente y es importante para que la base de datos sepa en qué orden correr las migraciones al inicializar.

El SQL generado queda en `prisma/migrations/<timestamp>_<nombre>/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
```

> [!tip] Rollback
> Cuando una migración sale mal, puedes revertirla. Consulta la doc de Prisma para el procedimiento concreto; depende de la versión.

## Seed data

Para desarrollo local necesitas datos de prueba realistas. El seed es el script que los inserta. Crea un `prisma/seed.ts`:

```typescript
// seed.ts
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const main = async () => {
  const orderData = [...Array(10)].map(() => ({
    id: faker.number.int({ min: 10, max: 170 }),
    total: faker.number.float({ min: 7, max: 15657, precision: 0.01 }),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
    userId: 5,
  }));

  const productData = [...Array(10)].map(() => ({
    id: faker.lorem.word(),
    name: faker.commerce.productName(),
    price: faker.number.float({ min: 35, max: 1055, precision: 0.01 }),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  }));

  // ... inserciones
};

main();
```

Y configura en `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Para correrlo:

```bash
npx prisma db seed
```

```text
Environment variables loaded from .env
Running seed command `tsx prisma/seed.ts` ..
The seed command has been executed.
```

## Checklist antes de dar el schema por bueno

Antes de marcar la tarea de schema como completada, pasa esta lista:

- ¿El schema refleja los diseños y la funcionalidad explicada en la doc de comportamiento?
- ¿Otro dev lo ha revisado?
- ¿Has comprobado que el schema funciona para todas las apps que consumen datos de esta base de datos?

### Temas avanzados (fuera de alcance del libro pero útiles)

- **¿El schema deja espacio para crecer?** Ver *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani, O'Reilly).
- **¿Hay manera de auditar acciones y los usuarios que las dispararon?** Ver ["What Is an Audit Trail?" (Auditboard)](https://www.auditboard.com/blog/what-is-an-audit-trail/).
- **¿Has considerado distintos niveles de role-based access control?** Ver ["Role-Based Access Control" (Imperva)](https://www.imperva.com/learn/data-security/role-based-access-control-rbac/).

Cada uno de estos temas tiene libros enteros dedicados; no te atasques aquí. Si puedes responder estas preguntas, explicar el schema a otro dev y hacer un demo a Producto, vas bien por ahora.

> [!tip] Apunta optimizaciones en tickets
> Si ves mejoras posibles mientras trabajas en el schema, anota en tickets con contexto suficiente. Así pueden volver a priorizarse en un sprint futuro sin perder el contexto.

## Próximos pasos

- [[04-apis-rest|APIs REST]]: convenciones de API, DTOs, controllers vs services, validación, manejo de errores y logging en NestJS.
