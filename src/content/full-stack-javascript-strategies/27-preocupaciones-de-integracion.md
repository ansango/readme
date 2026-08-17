---
title: "Preocupaciones de integración"
description: "Testing en producción, third-party services (cambios silenciosos, credenciales), data y seguridad en prod, containerización con Docker, golden images, time zones"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, devops, integration, docker, containerization, production]
---

# Preocupaciones de integración

> [!abstract] Resumen
> Esta nota cubre los problemas que aparecen una vez que la app está en producción: validación final entre frontend y backend, comportamiento inesperado de third-party services cuando cambian credenciales o configuración, data y seguridad en producción, y containerización con Docker para tener environments consistentes entre local, staging y prod. El objetivo es identificar y resolver los issues que solo aparecen cuando todo está integrado de verdad.

## El último 5% que solo se ve en producción

Has pasado las fases de testing, los integration tests pasan, el deploy funcionó. Pero una vez en producción con tráfico real, **aparecen cosas que no se podían testear en preproduction**: un environment variable missing, los frontend y backend se desincronizan por un nuevo dev que no conoce el proceso, time zones distintos entre servers, etc.

Esta fase **requiere grit**: estás tan cerca del final que cualquier problema se siente como un paso atrás, pero cazar estos issues antes de que los usuarios los sufran es crítico.

## Frontend y backend en producción

### Cosas concretas a verificar

- **Env vars en producción**: ¿faltan? ¿Apuntan a valores correctos?
- **Sincronización de deployments**: ¿qué pasa si frontend y backend se desincronizan? Coordinar especialmente en breaking changes, idealmente en nonpeak hours.
- **Cambios mergeados silenciosamente** de otros devs: revisar el branch antes de deployar.
- **Browser y device testing** en producción: Safari, Edge, tablets viejos, smartphones viejos.
- **Responsive / adaptive design** real, no asumido.
- **Time zones** en servers y scheduled jobs.

> [!tip] UTC everywhere
> Donde sea posible, **usa UTC en tu aplicación**: databases, APIs, scheduled jobs. Mantiene todo consistente y evita bugs de time zones.

### Cleanup de configs

- **tsconfig**: optimiza para producción. Quita mock data, toggles de dev views.
- **Build artifacts**: nada de developer functionality en producción.
- **No dejes nada accesible a usuarios que no deberían ver**.

### Test in production

Una vez deployado, **testa en producción con cuentas fake** que tienes controladas. No asumas que porque staging funcionaba, producción está perfecta. Planifica para que el testing no disrupte a usuarios reales y comunica al equipo que estás testeando.

> [!warning] Sé honesto
> Es incómodo admitir que puede haber bugs después de tanto testing. Pero es la realidad. Comunícalo y haz el testing.

## Third-party services en producción

### El switch de credenciales

Cuando cambias de test credentials a producción, **el app puede comportarse distinto**. Límites de rate, eventos inesperados, errores que no viste en staging. He visto un caso con Stripe donde en producción no había productos configurados y los errores eran diferentes a los que testeamos.

**Conclusión**: testea en producción con datos fake antes de anunciar features como "ready".

> [!tip] Feature flags como red de seguridad
> Si una feature está detrás de un feature flag, puedes testear en producción sin afectar usuarios reales. **No te olvides de quitar el flag cuando todo esté validado**; un flag olvidado bloquea features completas.

### Mantente al día con servicios externos

- **Revisa announcements** de tus servicios regularmente.
- **Lee los docs** al menos una vez al mes por cambios silenciosos.
- **Mira releases de betas/alphas** que puedan romper tu app.
- **Los breaking changes no siempre vienen con version updates** de paquetes: a veces cambian responses o events sin avisar.

### Errores suprimidos

Si customizaste el error handling, asegúrate de que el **error raw del servicio** se preserva. Si customizas el mensaje que mandas al usuario, loguea el original internamente. Si todo es custom message, no puedes distinguir si el problema es tuyo o del servicio.

### Servicios dependientes entre sí

Si tus servicios externos dependen unos de otros, **un fallo en uno puede hacer fallar al resto**. Por ejemplo, si Google Analytics requiere permisos que el usuario no ha dado, tu app puede fallar. He visto casos donde **3 devs tardaron un día entero** en descubrir que un custom error message estaba ocultando el problema.

### Mantenimiento programado

Para servicios externos con mantenimiento, programa ventanas y avisa a usuarios. Si tienes que hacerlo fuera de horario, coordina con Soporte y Sales para emails avisando.

## Data y seguridad en producción

### Ataques reales

En producción, los ataques son reales. Trabaja con el Security team en penetration testing. **Product, Design y stakeholders** deberían poder testear la app en producción también (con cuentas fake) para entender el producto y ver dónde hay vulnerabilidades.

### Business logic loopholes

Piensa como un atacante. ¿Puedes bypassear reglas de negocio? Por ejemplo:

- ¿Puedes ordernar un item out of stock?
- ¿Puedes ver todos los productos saltándote el limit que muestras?
- ¿Puedes manipular valores en URL, localStorage, sessionStorage?

### SQL injection y validación

¿Se validan strings en frontend **y** backend? Más crítico en el backend (protege la DB). Intenta meter SQL queries como string values y mira qué hace el backend.

### Tokens y permisos

- ¿Los tokens expiran como configuraste?
- ¿El backend actualiza el status de los tokens?
- ¿Puedes manipular un JWT, cambiar permisos, y usarlo para llamar endpoints directamente vía Postman?

### Información sensible en responses

Revisa las responses en el browser. **Que no se envíe PII en plain text**. JWTs o HTTPS habilitado. Passwords y SSNs masked en inputs. El `<input type="password">` lo hace por defecto; para otros campos masked, paquetes como `@react-input/mask` o `react-input-mask` ayudan.

## Containerización con Docker

### Por qué containers

La app funciona en tu máquina pero no en otros entornos, o se comporta distinto entre staging y producción. **Diferencias de configuración** (Node 21.2.0 local vs Node 18.19.1 en prod) pueden tener impacto enorme.

**Containers** bundlean todas las dependencias: runtime, libraries, configs. Es como virtualización pero sin fake hardware. El container corre aislado en el hardware existente pero no puedes instalar drivers ni interactuar con USB.

### Docker y alternativas

- **Docker**: el más común.
- **Podman**, **Buildah**, **runc**: alternativas.

> [!tip] Containers desde el inicio
> Si puedes configurar containers al principio del proyecto, **todo el equipo tiene un dev environment consistente**. Eso paga dividendos enormes a medida que el equipo crece.

### Dockerfile del frontend

```dockerfile
FROM node:21-alpine
WORKDIR /dashboard-ui
COPY package.json .
RUN npm install
RUN npm install serve -g
COPY . .
RUN npm run build
EXPOSE 8080
CMD [ "serve", "-s", "dist" ]
```

Instrucciones:

- **FROM**: imagen base (comúnmente la versión del runtime).
- **WORKDIR**: directorio de trabajo en el container.
- **COPY**: mueve archivos del host al container.
- **RUN**: ejecuta comandos.
- **EXPOSE**: qué puerto expone el container.
- **CMD**: comando a ejecutar cuando el container corre.

> [!warning] `serve` solo para local
> El ejemplo con `serve` es para correr local. En producción real, **sirve desde S3, Vercel, Cloudflare**, etc.

### Build y run

```bash
# Build de la imagen
docker build . -t "dashboard-ui:v1.0"

# Lista imágenes
docker images

# Run en detached mode, mapeando puerto
docker run -d -p 8080:8080 dashboard-ui:v1.0

# Containers corriendo
docker ps
```

### Dockerfile del backend

```dockerfile
FROM node:21-alpine
WORKDIR /dashboard-server
COPY package.json .
COPY package-lock.json .
RUN npm i --production
COPY src src
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

La principal diferencia es el `CMD`.

### Golden images

Una **golden image** es una template con environment, tools, packages, security settings predefinidos. **Ventajas**:

- Latest security patches preinstalados.
- Acelera el desarrollo (no preocupas por configs).
- Mantiene consistencia entre todas las imágenes.
- Automatiza deploys de nuevos apps.

El equipo DevOps suele ser responsable de mantener la golden image actualizada. **Partner con ellos** para que las imágenes reflejen las necesidades de seguridad y de la app.

## Próximos pasos

- [[28-pipeline-ci-cd-creacion|Pipeline CI/CD: creación]]: stages (build, test, deploy), Git hooks, GitHub configs, CircleCI como ejemplo.
