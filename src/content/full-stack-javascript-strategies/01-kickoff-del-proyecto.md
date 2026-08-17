---
title: "Kickoff del proyecto"
description: "Reunión inicial con Producto y Diseño, traducir diseños en tickets, coordinar con DevOps, QA y Soporte, y fijar plazos sin prometer de más"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, project-management, product, design]
---

# Kickoff del proyecto

> [!abstract] Resumen
> Esta nota cubre la primera semana de un proyecto greenfield: la reunión de kickoff con Producto y Diseño, cómo hacer preguntas que destapen ambigüedades, cómo traducir los mocks en tickets accionables, y las conversaciones paralelas que hay que mantener con DevOps, QA y Soporte antes de comprometerse a una fecha de lanzamiento. El foco está en cultivar el criterio para diferenciar lo que se puede prometer de lo que no, y en sentar las bases de la comunicación con todos los equipos involucrados.

## El proyecto del libro

El libro sigue la construcción de un **dashboard de ecommerce** donde los clientes pueden ver su historial de pedidos, editar su información personal, comprar productos digitales (ebooks) y gestionar acciones según sus permisos. La app maneja **PII (Personally Identifiable Information)** y se conecta con múltiples servicios de terceros, lo que la hace realista para los temas de seguridad, datos y operaciones que se cubren más adelante.

> [!note] Greenfield vs legacy
> El libro arranca con un proyecto greenfield, pero casi todo lo que se discute (arquitectura, testing, seguridad, deploy) se aplica también a proyectos legacy. El capítulo 31 cierra esa brecha con una lista de consideraciones específicas para cada tipo de proyecto.

## La reunión de kickoff

La reunión de kickoff suele consistir en que el equipo de Producto recorre los mocks que el equipo de Diseño ha preparado. Esos mocks suelen estar al **80% del camino**: hay piezas que se ajustarán sobre la marcha según se implemente, pero ya reflejan el flujo de usuario principal y dan una idea bastante clara de los datos que se necesitan.

> [!tip] Haz introductions al principio
> Es muy fácil lanzarse directo al trabajo y saltarse la parte humana. Tómate un par de minutos al inicio de la reunión para que todos sepan quién es quién. Esa inversión de tiempo paga dividendo más adelante, sobre todo cuando hay que escalar problemas.

En esa primera reunión hay que cultivar un hábito: **hacer preguntas técnicas sobre los mocks**. Producto y Diseño han pasado por sus propias reuniones internas, pero hay detalles que solo se ven desde la perspectiva de quien va a implementar. Preguntas sobre qué pasa cuando el usuario hace X, qué datos se necesitan, qué tipo de permisos, etc.

### Herramientas de diseño comunes

- **Figma**: la más usada. Los mocks suelen incluir HTML y CSS, que sirven como punto de partida para dimensiones y estilos (aunque no siempre son 100% exactos).
- **InVision (ahora Miro)**: alternativa clásica.
- **Penpot**: alternativa open source más reciente.

> [!warning] Pide los mocks mobile siempre
> Si el proyecto interactúa con usuarios externos, debe haber mocks de mobile. Si no los hay, es la primera pregunta que hay que hacer en la reunión. Implementar pensando solo en desktop y luego adaptar a mobile es mucho más costoso que hacerlo desde el principio.

### Ejemplo del libro: dos pantallas iniciales

El libro trabaja con dos pantallas:

1. **User info screen**: barra lateral de navegación, search bar arriba, productos destacados + último pedido del usuario, tabla paginada y ordenable con el historial de órdenes.
2. **User actions screen**: campos editables, toggles, acciones contextuales sobre pedidos y compras digitales.

La segunda pantalla tiene más complejidad que la primera, así que conviene dedicarle más tiempo en la reunión para entender bien cada interacción.

## Consideraciones de diseño

El momento de las preguntas es en la reunión, no después. Es totalmente normal no saber qué preguntar al principio; con el tiempo, exponerse a distintos sets de diseño ayuda a saber qué buscar. Una buena fuente de aprendizaje es fijarse en los flujos de las apps que usas a diario: la del banco, la de meditación, la de delivery.

> [!tip] Crea un ticket de investigación
> Si necesitas tiempo para explorar algo (cómo se comporta un componente en otras apps, qué patrones existen), abre un ticket que documente qué vas a investigar, qué hipótesis tienes y qué preguntas quieres responder. Así es oficial y se puede priorizar.

### Lista de preguntas para arrancar

El libro propone esta lista como punto de partida. No es exhaustiva y las preguntas dependerán del proyecto, pero da una idea del calibre de cosas que hay que aclarar:

**Sobre usuarios y permisos:**

- ¿Cuántos tipos de usuario habrá?
- ¿Qué permisos necesita cada tipo para ver información?
- ¿Qué permisos necesita cada tipo para tomar acciones?
- ¿Cuánto tiempo estará activo un usuario? (afecta a la vida del access token)

**Sobre datos:**

- ¿Qué datos esperamos manejar para los usuarios?
- ¿Tenemos que mostrar datos por rangos temporales?
- ¿La tabla debe ser ordenable por todas las columnas o solo algunas?
- ¿Cómo decidimos qué órdenes destacar?
- ¿Qué tipo de datos acepta cada campo de input?

**Sobre UI/UX:**

- ¿Qué guía de marca (colores, fuentes, tamaños responsive) hay que seguir?
- ¿Hay traducciones a otros idiomas?
- ¿Qué debe ver el usuario cuando guarda cambios?
- ¿Qué debe ver si hay un error de API en el cliente?
- ¿Hay que pedir credenciales extra antes de acciones sensibles (cambiar PII)?
- ¿Errores inline en el campo o agrupados junto al botón Submit?
- ¿Hay que considerar tablets y otros tamaños mobile?

**Sobre alcance e integraciones:**

- ¿El backend de esta app será usado por otras apps?
- ¿El frontend se integrará en otra app?
- ¿Hay compliance o regulaciones que apliquen (GDPR, PCI-DSS, SOC2, HIPAA)?

> [!warning] Lee la documentación existente antes de preguntar
> Antes de llevar tu lista de preguntas a la reunión, dedica una hora a leer la documentación que ya existe: docs de ingeniería de otros proyectos, docs de los servicios de terceros, READMEs de los paquetes que se están considerando. Muchas veces la respuesta ya está ahí. Es una falta de respeto a los demás ir a la reunión con preguntas que ya tienen respuesta documentada.

## Data-driven design

**Los datos son los que mandan.** Todo en los mocks está construido alrededor de cómo mostrar los datos y permitir que el usuario interactúe con ellos. La tabla del ejemplo no tiene que ser una tabla: podría ser una lista colapsable o un gráfico. La forma de la UI es una consecuencia de los datos, no al revés.

Por eso conviene tomar notas durante la reunión de:

- **Qué datos se necesitan** en cada pantalla.
- **Nombres de variables y tipos de datos** tentativos (que se puedan compartir con el equipo).
- **Relaciones** entre los datos que se mencionan en las conversaciones.

Después hay que validar con Producto que esos valores y relaciones son los que esperan. Producto no va a hablar en términos técnicos, pero va a recorrer escenarios de uso que te permiten pintar el cuadro completo.

## De diseños a tickets

Una vez resuelta la primera ronda de preguntas y con los mocks actualizados, empieza la fase de **romper las features en tickets**. Es el primer uso serio de un sistema de tickets (Jira, Trello, ClickUp, Shortcut).

### Sistema de tickets

Los tickets van a pasar por más rondas de refinamiento según se sumen más developers y otros equipos. El objetivo en esta fase es **crear action items para partes de los diseños**: por ejemplo, la pantalla de info tiene la sección destacada y la tabla; cada una puede ser su propio conjunto de tickets.

> [!tip] Agrupa features por relaciones de datos
> Esto facilita que los cambios de backend se puedan hacer e ir deployando mientras se construye el frontend en paralelo. Si dos features no comparten datos, se pueden desarrollar independientemente.

Cualquier observación técnica o requisito que aparezca en este punto se convierte en ticket. Si no hay ticket, el trabajo no se va a priorizar.

### De feature requirements a tareas técnicas

Producto ya debería tener **user stories** escritas (descripciones cortas de la feature desde la perspectiva del usuario). Esas stories esconden contexto útil sobre cómo el usuario va a interactuar con la funcionalidad.

En una reunión de **backlog grooming** se desglosan los tickets en las piezas más pequeñas que un developer pueda hacer. La definición de "más pequeño" no es exacta, pero una heurística útil es: **lo mínimo que tenga sentido testear de forma conjunta**. Para tickets con UI, hay que tener acceso a los mocks de desktop y mobile; para todos, hay que acordar criterios de aceptación con Producto, QA y el equipo.

#### Ejemplo de ticket bien definido

> **Title:** `[Backend, QA] Create endpoint for table data on user info screen`
>
> **Description:** As a user, I need to see a table with my purchase info. This info should include the product name, price, estimated arrival date, and quantity in each row on the table. This table should also be sortable by clicking on the column headers. It should have pagination so that I can go through my purchase history for the previous 12 months. It should match the designs attached.
>
> **Acceptance criteria:**
> - Update data schema to include purchase history definition (product name, price, estimated arrival date, quantity).
> - Run migration on database.
> - Create endpoint that responds with user purchase history for past 12 months.
> - Ensure authentication is working correctly.
> - Implement validation on request data.
> - Write tests for new endpoint.
> - Write docs for how the endpoint works so frontend can use it.
>
> **Points:** 5

Fíjate en que el ticket dice **qué** hay que hacer, pero no **cómo** implementarlo. Eso lo decide el equipo técnico.

> [!note] Arte vs ciencia
> Romper tickets es una habilidad que se aprende haciendo. La mejor forma de calibrar el tamaño de un ticket es pensar en QA: si un tester pudiera probar la pieza como una unidad, probablemente es del tamaño correcto.

## Discutir timelines con Producto y otros equipos

Una vez los tickets están estimados, Producto va a querer fijar una fecha de lanzamiento. Esa fecha tiene que negociarse con varios equipos a la vez, no solo con Producto.

> [!warning] Push back si la fecha es irreal
> Si Producto llega con una fecha de lanzamiento antes de que hayas tenido tiempo de estimar tickets y la fecha es más corta de lo que el equipo necesita, habla. Siempre. Comunicar pronto un problema de timing evita sustos mucho más grandes el día del lanzamiento.

### Hablar con otros equipos de desarrollo

Tu proyecto puede depender de que otro equipo implemente algo en su código que tu app consume, o tus cambios pueden causar **breaking changes** en otros equipos. En cualquiera de los dos casos hay que hablar con ellos y tener preparados:

- Requisitos técnicos bien definidos (tan claros como si los fuera a hacer tu equipo).
- Una idea general de dónde en su código están los cambios.
- Contexto detrás del cambio (por qué se necesita, qué problema del usuario resuelve).
- Un deadline flexible (que se pueda ajustar según lo que digan).
- Disposición a hacerlo tú si sale más rápido.

### Coordinar con DevOps

DevOps se encarga de la infraestructura y del pipeline de CI/CD. En un proyecto nuevo, hay que:

- Decidir en qué cloud provider corre la app.
- Poner en pie al menos algunos entornos (QA, staging, prod).
- Decidir el lenguaje y framework (DevOps necesita saberlo para provisionar).
- Decidir el **deployment strategy** (qué se automatiza, qué se hace manual).
- Acordar quién mantiene la config de CI/CD (muchas veces devs y DevOps por igual).
- Acordar las **versiones soportadas** del runtime (Node, Deno, Bun). Los servers no siempre corren la última versión, y un mismatch causa bugs raros.
- Poner recordatorios para rotar credenciales (npm tokens, secrets de servicios) antes de que expiren.
- Reservar tiempo para **testear juntos antes del deploy**.
- Reservar tiempo extra para arreglar lo que salga mal en los primeros deploys.

> [!tip] No intentes entenderlo todo de DevOps
> Habrá términos y decisiones de DevOps que no vas a entender a la primera. Está bien. A medida que trabajes con ellos irás cogiendo contexto. Si te interesa el área, haz pair con ellos de vez en cuando; si no, deja que ellos lleven esa parte y céntrate en lo tuyo.

### Trabajar con QA

QA existe porque a los developers se les escapan bugs, especialmente en integraciones raras, PRs que sobreescriben funcionalidad y edge cases. Para que el ciclo funcione:

- Incluir QA en las llamadas relevantes (backlog grooming, standups).
- Definir el nivel de detalle esperado en los pasos de reproducción.
- Aclarar que QA habla con el developer que hizo el ticket, no que el developer se sienta atacado. QA no está para decir que el código es malo, está para evitar que los bugs lleguen a producción.
- Dejar claro que **los developers escriben los unit tests** y QA se encarga (o ayuda) con los integration tests.

> [!note] Y si no hay QA
> En startups pequeñas puede que no haya equipo de QA, o que Producto haga algo de QA manual. Las recomendaciones aplican igual: si haces tu propio QA con este nivel de detalle, vas a cazar muchos más bugs antes de que lleguen a producción.

### Coordinar con Soporte

Soporte está en contacto directo con usuarios enfadados. Su trabajo es duro y tu trabajo con ellos es **traducir lo técnico a lo que ellos necesitan saber**.

Lo que Soporte necesita de ti:

- Documentación de cómo usar la feature (con foco en valores que el usuario tiene que meter, que es donde más se equivocan).
- Escuchar sus quejas y patrones de bugs (si varios usuarios piden lo mismo, vale la pena investigarlo).
- Sincronizar fechas y horas de release (para que no les pille desprevenidos un aluvión de tickets).
- Hacer un **demo en vivo** de la feature justo antes del release.
- Dedicar tiempo de developer extra los días cercanos al release (por si hay que rollbackar).

> [!tip] Construye relación con Soporte
> Engineering y Soporte trabajan más cerca de lo que parece. Invertir en esa relación al principio paga con creces cuando hay un problema gordo en producción y necesitas que Soporte te ayude a reproducir, clasificar y comunicar lo que está pasando.

## Conclusión: de kickoff a sprint

Después de todas esas conversaciones tienes:

- Tickets bien definidos, estimados y con criterios de aceptación.
- Documentación de las conexiones entre equipos.
- Una fecha de lanzamiento que todo el mundo conoce.
- Canales abiertos con DevOps, QA y Soporte.

> [!note] Los deadlines son siempre una estimación
> En software development, los plazos son siempre una estimación. Algo va a salir mal: alguien se pone enfermo, una herramienta de terceros resulta más compleja de lo esperado, otro equipo se retrasa y te retrasa a ti. Comunica los problemas en cuanto los veas y trabaja con el equipo para decidir qué hacer. No pasa nada. Pasa siempre.

Ahora ya estás listo para empezar a escribir código. La siguiente parada es el backend.

## Próximos pasos

- [[02-setup-del-backend|Setup del backend]]: por qué NestJS, cómo elegir arquitectura (monolito, microservicios, serverless), REST vs GraphQL, y los primeros pasos del repo.
