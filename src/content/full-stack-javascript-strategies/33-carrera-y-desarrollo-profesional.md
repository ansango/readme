---
title: "Carrera y desarrollo profesional"
description: "Camino técnico (architect, staff, principal, tech lead) vs management (engineering manager, director), professional journal, mover a otras áreas, libros de liderazgo"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, career, leadership, tech-lead, engineering-management]
---

# Carrera y desarrollo profesional

> [!abstract] Resumen
> Esta nota cubre los dos caminos principales que se abren después de senior: el technical path (architect, staff engineer, principal engineer, tech lead) y el management path (engineering manager, director, VP). También cubre la práctica del professional journal (documentar lo que aprendes y lo que hiciste), cómo moverte a otras áreas de tech sin perder seniority, recursos de liderazgo, y la importancia de aceptar que cada persona tiene su propio camino. El foco está en tomar decisiones conscientes sobre tu carrera en vez de seguir la inercia.

## El cruce de caminos

A este punto de tu carrera, estás añadiendo **depth a tus skills** y empezando a mentor a devs más juniors. Eso te lleva a un cruce de caminos con dos opciones claras.

## Technical path

Roles: **architect, staff engineer, principal engineer**. Sigues escribiendo código, pero el impacto en teaching es más prominente. Trabajas más a nivel de **sistema que de código**.

### Qué cambia

- En lugar de implementar endpoints individuales, decides **cómo los endpoints se conectan a la database**, cómo disparan events, naming conventions basadas en dominio, data schema.
- Generas y documentas **diagramas de cómo encaja todo**, los presentas al equipo para feedback.
- **Entrenas al equipo** cuando se atascan en debugging que involucra múltiples partes del sistema y external services.
- Mantienes packages actualizados, entiendes cómo sus dependencies afectan al codebase.
- **Traes visión** que une múltiples teams bajo el engineering department.
- Desarrollas un **engineering roadmap** técnico.
- **Métricas**: PR review time, calidad de estimaciones.
- **Más time enseñando que codeando**.

### Tech lead

Si te interesa más el lado de liderazgo del technical path, el rol de tech lead es una opción. Más project management, trabajando con el team para cumplir timelines y con Producto para entender goals y explicar blocks técnicos. **Trabajas con engineering manager** para mantener o mejorar la culture.

> [!tip] Mantente al día de trends
> En el technical path, **estate al día de industry trends** para que puedas ayudar al equipo a implementar las últimas best practices. Da awareness de new tools que resuelvan problemas del team.

## Management path

Roles: **engineering manager, associate director, director, VP**. **Quitas del código completamente** según creces. Foco en coaching, growth, y strategic sides.

### Qué haces

- **Creas culture** del engineering department.
- **Career levels** que cada dev puede crecer.
- **Review de herramientas**: cuánto gastamos, mejores alternativas.
- **1-on-1 meetings** con team members, notas sobre cómo van y cómo quieren progresar.
- **Feedback crítico y reconocimiento público**. Cuando hacen buen trabajo, **reconócelo** en 1-on-1s y públicamente. Cuando necesitan mejorar, diles las áreas concretas con tiempo para cambiar antes de reviews.
- **Pide feedback a tu team sobre ti**. Anónimo (surveys) si hace falta, porque la gente no se siente cómoda dando crítica directa.

> [!tip] Exit interviews y anonymous surveys
> Personas en tu team pueden no sentirse cómodas diciéndote directamente cómo mejorar. **Exit interviews y surveys anónimos** quitan esa presión y te dan info valiosa.

### Manager de managers

Si llegas a este nivel, **crea docs** que guíen a otros managers a través de sus propios 1-on-1s, cómo tener conversaciones difíciles, cómo mantener a la gente engaged en la culture, cómo ayudar a su gente a crecer. No tocas código, pero **todo lo que documentes sirve como starting point** para managers que te reportan.

### Reuniones y stakeholders

- Más meetings con Producto y stakeholders (VPs, C-suite).
- **Mapeas el Product roadmap** y mantienes el technical roadmap en alineación.
- **Hiring decisions** y cuándo es momento de que el team crezca.
- **Shield para tu team** de meetings innecesarios.

> [!warning] Tu trabajo es advocacy
> Una parte crítica de management es **advocate por tu team** y asegurarte de que sus necesidades se consideren en decisiones grandes. **Habla cuando algo te parece raro**; es una de las cosas más valiosas que puedes hacer.

> [!quote] Recursos para el management path
> - *The Manager's Path* by Camille Fournier (O'Reilly)
> - *Engineering Management for the Rest of Us* by Sarah Drasner
> - *Resilient Management* by Lara Hogan

## Professional journal

Recomiendo **encarecidamente** mantener documentación personal de lo que ves y haces en distintos proyectos. **Es tu template** para cómo abordar cualquier cosa. Puedes llevar contigo prácticas de cada organización.

### Qué documentar

- **Situaciones de las que estás orgulloso**.
- **Situaciones donde más struggle**.
- **Tech issues**: qué pasó y qué hiciste para arreglarlo.

**Invaluable** para entrevistas de nuevos roles (situational / behavioral questions) y para reviews. Es difícil recordar qué hiciste en los últimos seis meses o un año. **Escríbelo**.

> [!tip] Journal en tu PC personal
> Tu journal debería estar en tu **computadora personal, no de la empresa**. Nunca sabes cuándo perderás acceso. Formato libre: cualquier cosa que te sirva.

### Ejemplos de entradas

- **Issue con package npm custom en pipeline CircleCI**: borrar package-lock.json, reinstalar, push PR, mergear.
- **Test pasa solo pero falla con otros**: array method que mutaba original; usar spread para nueva instancia.
- **Bugs que tomé pride en resolver**: track down un bug de 2 años en UI de micro-frontend con 6 teams y un team escribiendo en Vue mientras otros en React.

## Moving to other areas

Quizás decides que necesitas un **cambio completo** y quieres probar otra cosa. **Data engineering, DevOps, otro specialty**. Tus core software skills no se van, y trabajar en otra parte del tech world **mejora tu creatividad** porque ves cómo funcionan las cosas desde otro viewpoint.

Trade-off: el current state de tech stacks cambia constantemente. **Puedes no estar al día de lo último** mientras exploras. Pero también es un tiempo para certificaciones o trabajo en funcionalidad más pequeña.

> [!tip] Leadership training
> Sin importar qué camino elijas, **algún tipo de leadership training ayuda enormemente**. Tu organización puede tener algo. Libros útiles:
>
> - *How to Win Friends and Influence People* by Dale Carnegie
> - *Thinkertoys: A Handbook of Creative-Thinking Techniques* by Michael Michalko
> - *Spark: How to Lead Yourself and Others to Greater Success* by Angie Morgan, Courtney Lynch, Sean Lynch
> - *Wherever You Go, There You Are: Mindfulness Meditation in Everyday Life* by Jon Kabat-Zinn

## No hay "normal"

Puedes saltar entre specialties. **Probar data engineering y no gustarte** está bien. Volver a software development hasta que encuentres lo siguiente. **No todo el mundo quiere subir la escalera y ser promovido ASAP**, y eso está bien. Es tu carrera, y **no hay "normal"**.

## Próximos pasos

- [[34-cierre-y-claves|Cierre y claves]]: cierre del libro, qué cubre y qué no, lecturas recomendadas, palabras finales.
