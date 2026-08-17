---
title: "Setup de despliegue full stack"
description: "Equipos involucrados (Infra, DevOps, SRE), pasos de conexión backend-frontend, cleanup, documentación, mantenimiento, demos con Producto"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, devops, infrastructure, deployment, sre]
---

# Setup de despliegue full stack

> [!abstract] Resumen
> Esta nota cubre el momento en que pasas de "tengo la app funcionando en local" a "está en producción con usuarios". Equipos involucrados (Infra, DevOps, SRE), checks del backend antes de producción, checks del frontend, integración de CDN, optimización de bundle, testing cross-browser, verificación de monitoring/alerts, tests del incident/rollback plan, y la importancia de documentar todo. El foco está en los pasos manuales y automáticos que tienes que validar antes de abrir la app a usuarios reales.

## El momento de la verdad

Una vez que el backend está construido y tested, has estado haciendo llamadas desde el frontend, y todo funciona local, es hora de **verificar la conexión full stack y abrir a usuarios**. Es el momento donde pones la infraestructura a prueba y aparecen los problemas que no se veían en local.

## Equipos involucrados

### Infrastructure team

Maneja el cloud platform en sí: hardware, networking, storage, server resources. Elige las mejores opciones de servicios según conversaciones contigo y DevOps. Tiene experiencia con Linux y prácticas de seguridad al nivel de infra.

### DevOps team

Automatiza tareas manuales: mover artifacts, escribir scripts para procesos repetitivos. Implementa **CI/CD pipelines** (CircleCI, GitHub Actions). Fomenta colaboración entre dev y ops. Para infraestructura automation, configuration management, y tooling de delivery rápido y fiable, habla con DevOps.

### SRE team (Site Reliability Engineering)

En organizaciones grandes. Foco en **reliability, performance, availability** de las apps. Trabajan con monitoring, incident response, performance optimization. Manejan **SLOs** (Service Level Objectives).

> [!quote] Jeff Graham: own your deployment
> Animo a todos los engineers a **aprender y ser dueños del deployment process** de su app. Aunque Infra o DevOps ayuden, es importante que entiendas cada detalle. Tú conoces mejor tu código, tests, dependencias, build commands. Eso mejora tu capacidad de troubleshooting y tu conocimiento de DevOps y cloud services.

> [!note] En empresas pequeñas
> En empresas pequeñas, todas estas funciones (DevOps, Infra, SRE) pueden caer sobre ti. Es overwhelming al principio, pero tómate tu tiempo, lee docs, y pide ayuda. Sé claro con tu organización sobre qué dominas y qué no.

## Pasos de conexión backend-frontend

### Backend

1. **Database connection** con pgAdmin u otra herramienta. Connection string correcto, credenciales, data schema. Configurar **connection pooling** si esperas escala (involucra a Infra/DevOps).

2. **Seed la base de datos de producción**. No mucha data, pero suficiente para verificar relaciones, tablas, índices, valores. Reusa el script de seed con modificaciones.

3. **Query los datos seed** para verificar que se fetchean como esperas. Prueba updates para validar constraints.

4. **Configura la conexión en tu app backend** con las env vars de producción.

5. **Doble check de env vars** en producción. Fácil olvidarse cuando estás emocionado de que todo funciona.

6. **Trabaja con Infra** para configurar el server de backend: seguridad de acceso, SSL certificates, parámetros para scripts, regiones, invalidación de cache, user roles y permisos para cloud service access.

7. **Configura logging, monitoring, y alerts** para la database y backend API. Triggers basados en errores en logs, CPU usage, memory usage.

8. **Verifica el API con Postman**. Mira headers, permisos, encoding/decoding. Esto se puede automatizar con tests para tener una baseline.

9. **Verifica third-party services**. Estás cambiando de test credentials (con límites) a producción. Ve con Producto por todos los escenarios. Confirma que estás usando production credentials.

10. **No olvides los background jobs y cron jobs**. Triggera cada uno y verifica que actualizan data correctamente. Si dependen de servicios externos, abre un ticket para verificarlos cuando haya data real.

11. **Plan para cuando las cosas vayan mal**. Ten el incident plan y rollback strategy listos antes de necesitarlos.

12. **Documenta todos los pasos**. Cuando lleguen más deployments, tener un documento detallado mantiene a todos en la misma página. **Automatizaciones pueden romperse**; un doc detallado es backup.

### Frontend

1. **Trabaja con DevOps** para configurar la ubicación del frontend. Diferente del backend en algunos aspectos. **CDN** para performance y uptime (Cloudflare, CloudFront si AWS).

2. **Optimiza el bundle**: código minimized, assets compressed. El artifact que los usuarios reciben tiene que ser pequeño.

3. **Verifica logging, monitoring, y alerts**. Mantén **dashboards separados** para frontend y backend. Distintos equipos pueden necesitar distintas notificaciones.

4. **Verifica en todos los browsers** que vas a soportar. **CanIUse** y **SauceLabs** para cross-device, cross-browser.

5. **Verifica los forms**. Edge cases van a aparecer, pero el core functionality tiene que estar sólido. Network y Application tabs para ver requests/responses.

6. **Usa la app como usuario** y mira los cambios en la database. Recorre user flows con Producto. **Haz que ellos conduzcan** y descubran problemas.

7. **Crea la documentación** del frontend. Diagramas high-level o low-level según necesidad. **No mezcles component state con infra** en el mismo diagrama.

### Cleanup

- **Verifica que los connection tests aparezcan en logs**. Si no ves actividad, algo está mal.
- **Prueba las alertas** disparando las condiciones. ¿Van a los emails y canales correctos?
- **Testa el incident plan y el rollback plan** mientras hay poco tráfico. En DR, **no tienes un plan de backup si nunca has restaurado nada**.
- **Familiarízate con los servicios** que usas. Al menos, sabe ir a la consola del cloud provider y leer configs a alto nivel.

## Mantenimiento

Una vez el app está en producción:

- **Actualiza el architecture diagram** a estado de producción. Mantenlo al día.
- **Repite el release process** muchas veces antes de que haya usuarios reales. Que cada dev en el equipo esté cómodo con él.
- **Testa el incident plan** con tráfico mínimo.
- **Construye tu propio checklist** con el tiempo. Muchos devs llevan el suyo de trabajo en trabajo.

## Demos y retrospectivas

Este es un buen momento para **hacer demos con Producto y stakeholders**. Recorrer el app construido, mostrar monitoring, explicar decisiones. Las demos traen feedback y abren conversaciones para el roadmap.

> [!tip] Self-reflection
> Después de un proyecto greenfield, **tómate un tiempo para reflexionar**. ¿Qué fue bien? ¿Qué harías distinto? Comparte con el equipo. Es aprendizaje invaluable para el siguiente proyecto.

## Próximos pasos

- [[25-testing-de-integracion|Testing de integración]]: test cases, Cypress, Playwright, Nightwatch y comparativa entre los tres.
