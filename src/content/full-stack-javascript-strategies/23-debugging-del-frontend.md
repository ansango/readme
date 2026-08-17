---
title: "Debugging del frontend"
description: "El proceso de debugging, mirar logs, console.log, breakpoints, Browser DevTools (Elements, Sources, Network, Application), debugging cross-environment, bugs inesperados"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, debugging, chrome-devtools, debugging-tips]
---

# Debugging del frontend

> [!abstract] Resumen
> Esta nota cubre el oficio de debuggear en el frontend: el proceso paso a paso (descubrir, reproducir, fix, test, deploy, validar), mirar logs efectivamente, console.log como herramienta temporal, breakpoints en DevTools, las cuatro pestañas clave del browser DevTools (Elements, Sources, Network, Application), debugging cross-environment y los famosos bugs en lugares inesperados. La regla de oro: tómate un descanso, pide ayuda a los 30 minutos, y no te fíes solo del código.

## El proceso de debugging

El primer paso es **enterarte de que el bug existe**: te lo reporta Soporte, lo detectas en monitoring/alertas, lo ves en logs, o lo descubres tú/QA al probar otra cosa.

Después, **recolecta información**:

- Habla con Soporte para sacar los pasos de reproducción.
- Mira logs con más detalle.
- Revisa los cambios más recientes deployados a producción.

Una vez puedes reproducir el bug, **arregla el código y escribe tests** que cubran el caso. Después, deploya el fix y valida en producción.

> [!note] El fix suele ser simple
> En muchos casos, el fix es un one-liner. **Lo que tarda es encontrar dónde**. Por eso la recolección de información y la reproducción son lo crítico.

## Mirar logs

Los logs son el primer sitio donde buscar cuando sabes que hay un bug. Filtra por:

- **Patrones en los errores**: ¿es siempre el mismo tipo?
- **Eventos específicos**: ¿qué dispara el error?
- **Data capturada**: ¿qué inputs están llegando?
- **Usuarios afectados**: ¿es solo algunos o todos?

> [!tip] Añade más logs si hace falta
> Si necesitas más visibilidad, **añade logs al código y deploya**. Tu backend log debería ser inaccesible desde fuera, así que puedes loggear user data sin riesgo de exposición.

### Checklist para logs

- **Cuándo se reportó el bug** → filtra por timestamp.
- **Mensajes específicos** relacionados con el issue (página, componente, API call, user ID).
- **Log completo**, no solo el mensaje.
- **Call stack** si está disponible.
- **Logs alrededor** del momento del error.
- **Código**: ve al área sospechada.
- **Si no encuentras nada, añade más logs** alrededor del problema y vuelve a buscar.

> [!warning] Source maps
> Para usar el call stack necesitas **source maps configurados correctamente**. Vite, Rollup, esbuild los tienen deshabilitados por defecto en producción. Habilítalos para debuggear.

## Console.log

Tu herramienta más simple. Pon `console.log` por todos lados cuando estés reproduciendo el bug localmente. No te preocupes por formato: **los vas a borrar después**.

```typescript
useEffect(() => {
  console.log('userResponseData', userResponseData);
  console.log('orderResponseData', orderResponseData);
  setUserInfo(userResponseData);
  setOrders(orderResponseData);
}, [orderData, userData]);

if (userIsLoading) return <CircularProgress data-testid="user-loading-circle" />;
console.log('successfully completed the user loading state');

if (userErrors || ordersErrors) showBoundary(userErrors || ordersErrors);
console.log('successfully made it past the error states');
```

> [!tip] Cambios incrementales
> Cambia **una línea a la vez** y ve el efecto. Si cambias 5 cosas a la vez y el bug desaparece, no sabes cuál lo arregló. Si cambias 1 y se rompe otra cosa, sabes exactamente qué regresión meter.

Para logs más estructurados: **missionlog**, **pino**, **winston**.

## Breakpoints

Mejor que console.log porque ves el state en tiempo real sin ensuciar el código. En Chrome DevTools (Sources tab):

1. Abre el archivo con Cmd/Ctrl+P.
2. Click en el número de línea para poner el breakpoint.
3. Refresca la página; el código se detiene ahí.
4. Inspecciona variables, call stack, ejecuta línea por línea.

> [!warning] Async functions
> No puedes hacer step-into en una async function directamente. Pon el breakpoint **dentro del callback** de la promise o dentro de la función async.

## Unit tests para debuggear

Corre los tests existentes primero. Si pasan, **modifica las condiciones** y mira si siguen pasando. Si un test pasa cuando no debería, **mira el código** — puede haber un async que no se está manejando bien o un componente que no se está renderizando como esperas.

Añadir tests puede ser un buen ejercicio de debugging: recorrer línea por línea qué casos faltan te descubre condiciones que no habías considerado.

## Git para debuggear

`git bisect` encuentra el commit que introdujo el bug. Mira la historia de Git: **qué cambios se pushearon antes de que el bug empezara**. Revisa los PRs mergeados o usa tu IDE para comparar la versión actual con el último commit.

> [!warning] No es para culpar
> El propósito **no es culpar a nadie**. Todos hemos metido código shaky que pasó review y rompió producción. **Coaching**, no shaming.

> [!tip] Pair debugging
> Las mejores sesiones de debugging vienen de pair programming. "Rubber-duck" con el otro dev. Como regla: **si llevas más de 30 minutos atascado, pide ayuda**. Otra mirada ve lo que tú ya no ves.

> [!tip] AI tools
> Cuando tengas que **explicar el problema a alguien** (o a un AI como ChatGPT), muchas veces la verbalización revela la solución. Explicar te obliga a estructurar lo que sabes.

## Browser DevTools

Las cuatro pestañas que más vas a usar:

### Elements

Para style issues. **Click derecho en un elemento** → Inspect. Panel derecho muestra todos los estilos aplicados. Puedes **editar los estilos en vivo** en el browser, perfecto para ver qué cambio arregla el problema.

Para mobile views: click en el **icono de mobile** (segundo icono en la nav del DevTools) y cambia entre responsive sizes en el dropdown.

### Sources

Para state y rendering. Navega por los archivos con Cmd/Ctrl+P, pon breakpoints, ejecuta paso a paso. **En producción**, los archivos están bundled y minified, así que source maps son esenciales.

### Network

Para issues de datos. **Todas las requests** que hace la página al cargar: componentes, paquetes, API calls. Mira headers, parameters, status codes.

Para un 403, mira los headers (¿token correcto? ¿permisos?). Para un payload raro, mira Preview/Response (¿viene en el formato que esperabas?).

> [!note] DevTools en cualquier sitio
> DevTools funciona en cualquier website. **Ve a un sitio que uses mucho y mira lo que pasa en Network**. Vas a ver un lío de chunks y calls — eso es lo que quieres ver en producción por razones de performance. Si cualquiera puede acceder a tus APIs y data como tú lo haces en local, **es un problema de seguridad enorme**.

### Application

Para cookies, localStorage, sessionStorage. Si te llegan 403 constantemente, mira aquí. Si el token es un JWT, cópialo y decodifica con [jwt.io](https://jwt.io/).

> [!tip] localStorage vs sessionStorage
> - **localStorage**: persiste tras cerrar tab. User preferences.
> - **sessionStorage**: se borra al cerrar tab. State tracking.
>
> Que un usuario pueda tener múltiples tabs con interacciones distintas suele ser por sessionStorage.

## Debugging cross-environment

Si no puedes reproducir el bug local:

- **Develop environment**: el siguiente paso natural.
- **Staging**: si depende de recursos parecidos a producción.
- **Producción**: solo con cuenta de test, no de un usuario real.

Pide a otros devs que prueben en esos entornos. **Diferentes browsers y responsive sizes** también son clave — un bug en Safari que no reproduces en Chrome te dice algo.

> [!warning] Production debugging
> Si tienes que debuggear en producción, **usa una cuenta de test**. No toques datos ni settings de usuarios reales.

## Debugging en lugares inesperados

Los bugs que recordarás son los que vienen de sitios que nunca sospechaste. Ejemplos reales:

- **Tablet viejo**: usuario accediendo en una tablet con un tamaño de pantalla que tu responsive no cubría.
- **Safari**: estilos no se renderizaban correctamente.
- **Tercero revoca permisos sin avisar**: usuarios no veían sus datos.
- **Time zones**: servers configurados con time zones distintos causaban updates inconsistentes.
- **CI/CD artifact no actualizado**: el pipeline reportaba success pero el app no se actualizaba por un file hash stale.
- **Filename capitalization**: archivos que necesitaban empezar con mayúscula y underscore en producción pero no en dev.
- **SSR vs CSR**: componentes server-rendered que no re-renderizan, lógica que parece no funcionar.

> [!tip] Si la versión vieja funciona y la nueva no
> Revisa el **build artifact**. Hashes stale, ubicación incorrecta, caché del CDN. Tedioso pero efectivo cuando el código está bien.

> [!tip] Clear cache y probar otros browsers
> Antes de debuggear durante horas, **pide a usuarios/devs que limpien el cache o prueben otro browser**. A veces es eso.

## Resumen

- **Pide ayuda tras 30 minutos** atascado.
- **Tómate descansos** — una caminata de 30 min ha resuelto más bugs que horas de staring.
- **Diferentes approaches** según el bug: logs, console.log, breakpoints, DevTools, otros devs, otros entornos.
- **No te fíes solo del código**. A veces el bug no está donde crees.

> [!note] Si el bug cruza infra
> Trabaja con el equipo responsable de mantener la infra. Los pipelines CI/CD pueden tener issues silenciosos (Node upgrade, packages upgrade en el pipeline, scripts cambiados). Tu incident playbook de [[12-monitoring-logs-e-incidentes]] aplica.

## Próximos pasos

- [[24-setup-de-despliegue-full-stack|Setup de despliegue full stack]]: equipos involucrados, conexión backend-frontend, cleanup y documentación.
