---
title: "Gestión de proyectos"
description: "Sprint discussions, estimaciones (underpromise, overdeliver), dev capacity, burnout, feature requirements, tickets, roadmaps, comunicación con Producto"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, project-management, sprint, estimation, capacity, burn-out]
---

# Gestión de proyectos

> [!abstract] Resumen
> Esta nota cubre el lado "no técnico" de tu carrera: cómo participar en sprint discussions sin pasarte de la raya con Producto, hacer estimaciones realistas (underpromise, overdeliver), gestionar tu capacity y evitar burnout, escribir tickets útiles, revisar roadmaps (Producto e Ingeniería), y mantener comunicación abierta con todos. Es el lado del trabajo que más impacto tiene en tu equipo y en tu propia carrera a largo plazo.

## Sprint discussions

Temas comunes: **estimaciones, requirements, división de tasks**. Es trabajo en grupo, colaboración. Puede sentirse tedioso, pero **preguntar mucho al inicio** hace que el sprint sea smooth.

### Estimaciones

Producto pide estimaciones para comunicar timelines a stakeholders. **Resiste el impulso de tirar fechas optimistas hasta tener todos los requirements, designs, y tiempo para investigar**. Tickets "simples" se complican una vez te metes.

> [!tip] Underpromise, overdeliver
> Aunque sepas que puedes terminar X trabajo, **acuerda un poco menos**. Si acabas teniendo tiempo para todo y más, todo el mundo está contento. Si te quedas corto, **cumpliste tu compromiso**. Nunca te quedas mal.

> [!warning] No des la estimación más optimista
> Conoces el código y el codebase, puedes idear soluciones rápido. **Está bien**, pero incluye detalles en el ticket a menos que estés dando espacio a otro dev para pensar. **Y nunca des estimación sin hablar con el equipo**.

### Dev capacity

Establecer baseline de puntos toma **2-3 sprints**. Incluye buffer para overdelivery, days off, holidays. Si maxeas puntos o tasks, no dejas espacio para PR reviews, bugs de QA, etc.

> [!warning] Burnout
> He experimentado burnout varias veces. **Cada vez tardé meses en recuperarme**. Siempre empieza aceptando un poco más hasta que tu existencia entera es trabajo. Eventualmente todo se apila y rompes bajo la presión. **No es fácil de recuperar**, así que toma medidas para prevenirlo.

### Feature requirements

No puedes enfatizarlo lo suficiente: **asegúrate de tener todo antes de estimar un ticket**. Designs y requirements listos. Si aceptas tickets incompletos, scope creep te explota la estimación.

> [!note] Research tickets
> Cuando los detalles de una feature aún se están creando, **crea tickets de research**. Son un buen vehículo para investigar y volver con tickets más específicos.

Si Producto no ha escrito specs, **pídeles que lo documenten, pero no lo escribas por ellos**. Las specs deben decir cómo funciona el producto, qué debe hacer, cuándo, cómo afecta al usuario. Tú rompes eso en implementación técnica y preguntas a Producto lo que no entiendas.

> [!tip] Epics
> Si la feature es grande, **empuja por epics** que agrupen varios tickets. Es más fácil estimar el conjunto cuando tienes las piezas que lo construyen.

### Dev team ticket review

Revisa tickets con el equipo antes de sprint planning. **Es meeting extra en el calendario, pero ahorra tiempo en el sprint**. Permite que más questions salgan a la luz, distintos perspectives mejoran los tickets.

> [!tip] Checklist para tickets
> Envía al equipo las questions antes del meeting:
> - ¿Dónde están los designs?
> - ¿Qué data necesitamos mostrar?
> - ¿Qué pasa con distintos status?
> - ¿Cómo manejamos missing values?
> - ¿Hay restricciones en parámetros de input?

### Roadmaps

Revisa el **Product roadmap** en cada sprint discussion. Mantiene a todo el mundo al día de qué viene y cuándo. Sin sorpresas.

> [!tip] Engineering roadmap
> El dev team debería tener su **propio engineering roadmap**: tickets de updates, refactors, package upgrades. Producto necesita saber de estas tareas para darte espacio sin presionar por features.

Cuando revisas Product y Engineering roadmaps juntos, **puedes encontrar features útiles que cruzan ambos**. Por ejemplo, Producto quiere email alerts y tú tienes mejor event handling en dev roadmap. Combinación de ambos gana tiempo para todos.

## Definir y gestionar tasks

### Mantén team awareness

Estate al día del roadmap y de las features en desarrollo. **Te van a pedir ayuda** con tasks de otros devs. Awareness evita trabajo duplicado y desbloquea a otros.

**Tech lead vs Engineering manager**:

- **Tech lead**: dev con responsabilidades extra por skill (backend lead, frontend lead). Sigue siendo individual contributor, sin reports.
- **Engineering manager**: strategic planning, budgeting, hiring. Tiene reports.

### Escribe y clarifica tickets

Después de investigar, **añade detalles a los tickets**: links a specs, UI designs, acceptance criteria inicial. El objetivo es que **cualquier dev del equipo pueda pick up un ticket tuyo con pocas questions**.

> [!tip] Tickets focused por frontend/backend
> Para features grandes, **separa tickets de frontend y backend**. Eso permite a varios devs trabajar en paralelo sin overlap. Incluye tickets para mock data y tests.

### Considera overhead tasks

Capacity realista incluye:

- Días fuera durante el sprint.
- Trabajar con QA para resolver bugs.
- PR reviews (especialmente si hay mucho feature work).
- Nuevos team members integrándose.
- Package version upgrades.

> [!tip] Comunica overhead
> Lleva estas tareas a la conversación de sprint. Hace visibles las cosas que se suelen pasar por alto. **Ayuda a que las estimaciones sean más realistas**.

### Pace yourself

Balance entre **retarte a ti mismo y aceptar demasiado**. Si maxeas tasks cada sprint, eventualmente quemas. Si Producto quiere que pivotes focus a mitad de sprint, **pregunta qué depriorizar**.

> [!warning] Cultura de equipo
> **Lo que aceptas se convierte en estándar**. Si siempre dices sí, ese se vuelve el expectation. Es más fácil decir "no" o "qué depriorizamos" desde el principio que romper el patrón después.

### Context shifting

A lo largo del día, **múltiples meetings, mensajes, alerts, distintos tasks** te hacen context-switch. Eso ralentiza tu workflow, causa fatiga mental, e incluso puede crear overload emocional.

Para proteger el flow state:

- **Pomodoro technique**: no respondas a mensajes hasta que tu tiempo termine.
- **Bloques de tiempo dedicados**: meetings en mañana, deep work en tarde, PR reviews en otros momentos.

> [!quote] Sobre responder todo inmediatamente
> Me tomó tiempo aprender lo importante que es proteger mi tiempo. Antes pensaba que cada mensaje requería respuesta inmediata. **Eso no es sostenible** y me llevó a burnout severo. **Bloques de calendario** para coding, meetings, otras tareas. **No todo es un incendio**. Está bien decir "te respondo en una hora".

### Comunicación abierta

**Fomenta cultura de comunicación**. Si algo va a tomar más tiempo del esperado, avisa pronto. Si tienes questions sobre el código, pregunta. **Cuando hablas, normalizas que otros también lo hagan**.

> [!tip] La pregunta "tonta"
> Hay entornos donde preguntar se encuentra con desprecio. **Sé la persona que habla**, sin importar si crees que es pregunta tonta. He pasado horas buscando respuestas que nadie en mi equipo sabía.

## Próximos pasos

- [[32-apps-nuevas-vs-existentes|Apps nuevas vs existentes]]: consideraciones para greenfield y para legacy apps, tu carrera y los dos caminos posibles.
