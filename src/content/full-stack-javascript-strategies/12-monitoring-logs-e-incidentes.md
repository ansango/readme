---
title: "Monitoring, logs e incidentes"
description: "Usos de logs y monitoring, herramientas (Datadog, Sentry), playbooks de incidente en 7 etapas, comunicación durante incidentes, blameless postmortems"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, monitoring, logging, datadog, sentry, incidents, postmortem]
---

# Monitoring, logs e incidentes

> [!abstract] Resumen
> Esta nota une las piezas de observabilidad: qué información sacas de los logs y monitoring más allá del debugging, qué herramientas usar (Datadog, Sentry, LogRocket), y sobre todo cómo responder a incidentes en producción con un playbook en 7 etapas. El último tercio cubre los **blameless postmortems**: reuniones sin culpa que buscan aprender del proceso, no castigar a personas.

## Logs y monitoring: para qué sirven además de debuggear

Los logs y monitoring no son solo para cuando algo se rompe. Cuentan **la historia de lo que está pasando** en tu app y en tu infraestructura. Si sabes qué pasa y cuándo, puedes empezar a entender por qué.

### Logs

Son mensajes que se emiten cuando ocurren eventos. Empiezan siendo líneas en un fichero de texto, pero enseguida pasan a herramientas que permiten buscar y filtrar.

Usos principales:

- **Debugging**: buscar el mensaje concreto que se emitió antes del bug.
- **Cruzar frontend y backend**: si el frontend reporta un error, busca en backend logs de la misma ventana temporal.
- **Detectar problemas de jobs**: si los cron no terminan, los logs lo dicen.
- **Investigar diferencias entre entornos**: bugs que pasan en staging pero no en producción (o al revés).
- **Tracking de bugs en producción**: si el bug se puede reproducir en staging, añade logs extra y abre un PR pequeño.
- **Insights de uso real**: los logs cuentan cómo los usuarios usan la app.

> [!tip] PII en logs
> Acuérdate de que los logs pueden contener PII sin querer. Asegúrate de ofuscarlos antes de producción. **Verifica esto con auditoría, no te fíes de la memoria**.

### Monitoring

Monitoring te da info agregada en tiempo real. Métricas y thresholds que se chequean constantemente. Combinado con alertas, hace que el equipo se entere cuando algo unusual pasa.

Métricas típicas a monitorizar:

- Frecuencia de llamadas a endpoints.
- Cuándo se disparan ciertos errores.
- Latencia de carga de páginas.
- Cumulative layout shift.
- Tiempo de respuesta de APIs.

Monitoring también detecta cosas que manualmente no verías: **DDoS attacks** (subida repentina de calls), saturación de recursos antes de que se caiga algo, etc.

> [!note] Monitoring debe estar desde el día uno
> He visto sitios donde no se configuró monitoring hasta que la app sufrió varios DDoS. Cuando había incidentes, el equipo tenía que hacer búsqueda manual de logs en plena crisis. Esos sitios luego configuraron monitoring y la respuesta a incidentes mejoró radicalmente.

## Herramientas

Hay tres categorías principales de herramientas que verás:

- **Datadog**: el más popular en organizaciones grandes. Logging, monitoring, APM, dashboards. Tiene trial de 14 días.
- **Sentry**: errors y performance. Se puede self-host gratis.
- **LogRocket**: session replay, ves exactamente qué hizo el usuario.

### Datadog en la práctica

Necesitas instalar el **Datadog Agent** en tu máquina o server, y luego un logger (Winston es una opción sólida):

```bash
npm i winston
```

Crea un util `datadog.ts`:

```typescript
// datadog.ts
import { createLogger, format, transports } from 'winston';

const datadogLogger = createLogger({
  level: 'info',
  exitOnError: false,
  format: format.json(),
  transports: [new transports.File({ filename: './logs/server.log' })],
});

datadogLogger.log('info', 'Testing Datadog logs...');
datadogLogger.info('This is an info log with a blue color', { color: 'blue' });

export default datadogLogger;
```

Y úsalo en tus controllers:

```typescript
// orders.controller.ts
import datadogLogger from 'src/utils/loggers/datadog';

@Get()
public async orders(@Param() user: User): Promise<Omit<Order, 'products'>[]> {
  if (!user) {
    datadogLogger.error(`unauthorized user: ${user}`);
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
  if (!user.permissions.includes('get:orders')) {
    datadogLogger.error(`forbidden user: ${user}`);
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }
  datadogLogger.info('GET /v1/orders requested');
  try {
    const orders = await this.ordersService.orders();
    datadogLogger.debug(`orders: ${orders}`);
    return orders;
  } catch (err) {
    if (err) {
      datadogLogger.error(`orders: ${err}`);
      throw new HttpException('Not found', HttpStatus.NOT_FOUND, { cause: err });
    }
    throw new HttpException('Generic', HttpStatus.BAD_GATEWAY);
  }
}
```

En el dashboard de Datadog verás los logs en tiempo real, con stats de frecuencia de errores, qué servicios los emiten, y mucho más. Puedes filtrar por log type, servicio, parámetro, etc.

> [!tip] Dedica tiempo a aprender los filtros
> Datadog tiene mucha info. Tómate un tiempo en aprender a usar los filtros eficientemente. Una vez lo tengas, filtrar el ruido es rápido y llegas al log que buscas en segundos.

## Incident playbooks

Por mucho que te prepares, en producción siempre habrá bugs nuevos, servicios externos que se caen, y herramientas que fallan. Por eso necesitas un **playbook** que el equipo pueda seguir de forma procedural cuando algo pase.

### Las 7 etapas

#### 1. Detectar el incidente

Primero, **definir qué es un incidente** para tu app. Esto se ata a las métricas que monitorizas (downtime, security breaches, etc.). Sin una definición clara, perderás tiempo discutiendo si algo es o no es un incidente cuando ya está pasando.

#### 2. Configurar la comunicación

Crea **canales dedicados** (Slack, Teams) para cada tipo de incidente. Grupos pequeños al principio (menos de 10 personas) que crecen según se necesita. La comunicación es más enfocada.

#### 3. Determinar impacto y severidad

Evalúa:

- ¿Cuántos usuarios están afectados?
- ¿Qué servicios están caídos y qué funcionalidad afecta?
- ¿Se puede arreglar rápido?
- ¿Cuánto ha revelado la investigación inicial?

Esta evaluación define cuántas personas se dedican al incidente y dónde enfocan. Comunica a stakeholders la severidad encontrada.

#### 4. Notificar a usuarios

Incluye a Soporte en la comunicación. Van a hablar con clientes; necesitan info precisa. Una vez que se haya comunicado a usuarios, el equipo puede centrarse en la resolución.

#### 5. Notificar a los equipos correctos

Para cuando la comunicación llega aquí, los equipos ya saben que van a tener un rol. Según la investigación inicial, el camino se bifurca: dev + infraestructura típicamente.

#### 6. Delegar responsabilidades del incidente

Haz una **incident call** con todos los involucrados. Permite screen sharing rápido, brainstorming en tiempo real, y disparar comandos mientras el otro equipo ve qué pasa. La comunicación en tiempo real es crítica.

> [!tip] Updates frecuentes a stakeholders
> **Cada 10-15 minutos, manda un update**, aunque sea "seguimos investigando". El silencio absoluto es lo que más ansiedad genera. Updates constantes demuestran urgencia y dan confianza en que el problema se está tratando con prioridad.

#### 7. Resolver el incidente

Cuando creas tener la solución, **testea entre los equipos antes de anunciar nada**. "Parecía que estaba arreglado hasta que clicamos otro botón" pasa más de lo que crees. Haz que varias personas prueben la resolución de las formas que se les ocurran, rápido. Puedes decir a stakeholders que estás "trabajando en la resolución", pero **no digas que está resuelta** hasta que esté testeada y desplegada en producción.

### Template de respuesta a incidentes

```text
Identification (Stages 1 & 2)
  - Become aware that an incident is happening through monitoring and alerts.
  - Report the issue to the correct incident response team.

Incident coordination (Stages 3, 4 & 5)
  - The incident response team triages the incident.
  - The impact and severity are determined.
  - Facts around the incident are gathered.
  - Relevant teams are notified to investigate the incident.
  - Stakeholders are notified with the current findings.

Resolution (Stages 6 & 7)
  - The facts around the incident are researched.
  - Consistent communication is sent to key stakeholders.
  - Any steps to mitigate damage are taken.
  - The underlying issue is resolved.
  - The resolution gets tested.
  - Any affected systems and apps are restored to normal operations.

Postmortem
  - Have a retrospective meeting on what happened.
  - Make a report that outlines timelines and actions taken.
  - Find areas that can be improved.
  - Plan for any processes or tools that need to be improved or maintained.
```

Adapta este template a tu organización. Lo importante es que sea conocido y fácil de seguir bajo presión.

## Blameless postmortems

Después de que el incidente esté resuelto y los usuarios notificados, es momento del **postmortem**. Es igual de importante que el resto del manejo de incidentes porque **revela huecos en el playbook** y oportunidades de añadir resiliencia.

### No es un juicio

Los incidentes rara vez pasan por culpa de una persona. **Múltiples cosas contribuyeron**, y entender cuáles y cómo es el propósito del postmortem.

> [!note] Por qué blameless
> Si alguien tiene miedo de perder su trabajo al reportar un incidente, lo va a esconder. Eso alarga el incidente y empeora las cosas. La cultura blameless **anima a reportar** y hace que el equipo se enfoque en fallos de proceso, no en individuos.

### Estructura del postmortem

```text
Set a meeting time
  - Avoid placing blame on anyone.
  - Focus on the issues that happened in the process leading to the incident.

Share everyone's findings
  - The incident team should have notes on what they did during the resolution process.
  - Each team member can give the details from the part they reviewed.
  - No detail is unimportant.

Write a formal report
  - Include everyone's findings.
  - Highlight key actions that happened over the course of the incident.
  - Create takeaways for improvements.
  - Share the report across the organization.

Praise people for doing things right
  - Consider having a meeting with teams across the organization based on the scale of the incident.
  - If someone made a mistake and owned up to it, publicly praise them for it to encourage a culture of this.

Review the postmortem a few days later
  - This will give everyone time to take a step back and see if the report is good.
  - Do some role-playing through the steps that happened during the incident.
  - Accept feedback on what could have made the postmortem more effective.
```

### El senior como punto de contacto

Eventualmente te conviertes en el punto de contacto cuando hay incidentes. Como has estado involucrado en montar la funcionalidad core y has trabajado con todos los equipos, tienes una **visión amplia de cómo funciona todo**. Toda la documentación y el planning que hiciste dan fruto: no tienes que buscar a tientas cómo se conecta una pieza con otra.

Mantén la calma y aborda la situación de forma sistemática. La gente se pone nerviosa cuando hay producción caída; tu temple es un activo para el equipo.

> [!warning] Comunica incluso con el CEO
> Cuando los incidentes son grandes (mira el de CrowdStrike en 2024), hay millones de dólares en juego y servicios críticos afectados. La comunicación tiene que escalar hasta donde haga falta, sin importar el nivel de seniority del receptor.

## Próximos pasos

- [[13-setup-del-frontend|Setup del frontend]]: arquitectura, elección de framework, decisiones de paquetes y coordinación con otros equipos.
