---
title: "Seguridad del frontend"
description: "OWASP aplicado a frontend, business logic validation, session management (timeouts, tokens, logout), package maintenance, input validation, ethical hacking"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, security, owasp, session, input-validation, hacking]
---

# Seguridad del frontend

> [!abstract] Resumen
> Esta nota cubre la seguridad aplicada al frontend: vulnerabilidades comunes (business logic flaws, session management, paquetes desactualizados, input validation), principios como "security through obscurity", cómo testear tu propia app con ethical hacking (PortSwigger, Kali Linux, bug bounties), y la importancia de mantener el frontend tan protegido como el backend. El frontend es la primera línea de defensa y donde muchos atacantes empiezan a explorar.

## Frontend como gateway

El frontend es la parte más accesible del producto y puede actuar como **gateway para ataques al server**. Por eso hay que pensar en:

- Vulnerabilidades del browser.
- Formas en que usuarios maliciosos manipulan el flujo para ganar acceso.
- Cómo almacenas y transmites datos en el frontend.

Recuerda: **todo lo que carga en el browser es accesible al usuario** abriendo DevTools. El equipo tiene que encontrar el balance entre conveniencia y seguridad.

## Vulnerabilidades comunes

### Business logic validation

A veces el diseño del flujo abre vulnerabilidades. El **golden path** (el camino "feliz" que quieres que el usuario tome) deja edge cases sin cubrir:

- ¿Qué pasa si un usuario hace 5 pedidos del mismo producto en 5 minutos?
- ¿Puede cancelar un pedido recién enviado?
- ¿Puede bookear todas las sesiones de soporte con un bot?

Cuando recorras diseños y specs, **busca estos huecos** y piensa cómo podrían explotarse.

> [!warning] Cuidado con mensajes de error verbosos
> En forms, no digas "te quedan 2 intentos" o "el email ya existe" — eso le da a un bot info para iterar. Limita los intentos de forma no anunciada o añade un CAPTCHA.

> [!tip] Limita data sharing al frontend
> Pide solo lo que necesitas. Datos sensibles (PII) detrás de autenticación. Aunque el usuario no vea los datos en la página, **puede ver las responses de red en DevTools**.

### Session management

Cómo manejas y almacenas access tokens es un vector de ataque. Ataques simples: alguien mira tu browser, encuentra un token en la URL, ve que estás logged en en un device viejo.

#### Idle session timeouts

Tras un tiempo de inactividad, **deslogea automáticamente al usuario**. Esto evita que un atacante use un session ID robado para siempre.

> [!warning] No confíes en el browser para tiempos de sesión
> Un atacante puede modificar valores locales. El **backend tiene que validar** que el session ID realmente expiró.

#### Absolute session timeouts

Independientemente de actividad, **fuerza logout tras un tiempo máximo**. Complementa al idle timeout: si el session ID fue robado, no durará para siempre.

#### Logout button

No te olvides del botón de Logout. Los usuarios conscientes de seguridad quieren la capacidad de cerrar sesión manualmente. Opcionalmente, hookea el cierre del browser o de la página para disparar logout.

#### Session renewal timeout

Cuando un session ID expira, se genera uno nuevo en background y reemplaza al viejo en el frontend **sin acción del usuario**. Permite sesiones largas sin dar a los atacantes un session ID estable.

#### Multi-device login

¿Puedes estar logged en en varios devices a la vez? Permitirlo da más superficie de ataque (el atacante puede loguearse sin que el usuario legítimo lo note). Si lo permites, monitoriza actividad inusual entre sesiones. Si no, requiere backend work para invalidar session IDs al cambiar de device.

### Package version maintenance

Paquetes desactualizados con CVEs conocidos son vulnerables. Atancantes van al OWASP Top 10 y construyen listas de ataques basados en vulnerabilidades públicas.

> [!tip] Ticket mensual de mantenimiento
> Pon en el backlog un ticket recurrente (mensual) para actualizar paquetes a la última versión estable. Idealmente, actualiza paquetes cuando trabajas en features cercanas o como tech debt.

Herramientas:

- **Dependabot**: PRs automáticos cuando hay updates.
- **npm-audit**: vulnerabilidad report built-in.
- **Snyk**, **retire.js**: scanners de paquetes vulnerables.

> [!warning] Vetted packages
> No todos los paquetes necesitan mantenimiento. Hay paquetes que hacen su tarea bien y no se actualizan en años. Con experiencia, aprendes a balancear. Si un paquete que usas ya no se mantiene, busca reemplazo o implementa la funcionalidad internamente.

### Input validation

La validación de frontend es **complemento** del backend, no sustituto. Backend ya tiene validación y sanitization, pero la frontend:

- Da **feedback inmediato al usuario** sin roundtrip al server.
- **Frena ataques básicos** (no frena los sofisticados, que bypasean UI).

> [!warning] Frontend validation se bypasea
> Un atacante con DevTools puede saltarse tu validación frontend. **El backend siempre debe re-validar**. La frontend validation es UX y primera línea de defensa, no seguridad.

#### Form validation con HTML attributes

```html
<form>
  <label>First Name: <input type="text" required /></label>
  <label>Quantity: <input type="number" min={0} max={12} /></label>
  <label>Email: <input type="email" /></label>
  <label>Password: <input type="password" /></label>
  <label>Best Contact Time: <input type="datetime-local" /></label>
  <button type="submit">Submit</button>
</form>
```

#### Form validation con React Hook Form

```typescript
{...register('search', {
  required: true,
  maxLength: 15,
  minLength: 3,
  pattern: /^[A-Za-z]+$/i,
})}
```

#### Con schema (Yup, Zod, Joi)

Reus across componentes, customización clara, separación de concerns.

## Otros principios

### Security through obscurity

> Mantén información sobre mecanismos internos **need-to-know**. El equipo de Seguridad sabe más sobre roles y autorización que tú. Las passwords de infra están en un gestor de passwords al que solo某些 acceden.

No es la **única** defensa (security through obscurity solo es frágil), pero **complementa** otras capas: si un atacante sabe menos sobre tu sistema, le cuesta más encontrar vulnerabilidades.

### Headers y URLs

> Todo lo que el server envía al cliente puede dar pistas a un atacante:
>
> - `X-Powered-By` headers que revelan tu stack.
> - URLs con default AWS API endpoints en lugar de custom domains.
>
> Sé muy intencional con cada piece de data que envías al frontend.

## Cómo testear tu propia app

Aprender a hacer **ethical hacking** básico en tus propias apps te enseña a ver la seguridad desde el otro lado.

### PortSwigger Web Security Academy

Recurso muy completo: artículos, ejemplos, labs. **Recomendado**: prueba labs como el de bypassing 2FA o business logic flaws.

### Kali Linux

OS con todas las herramientas que un atacante usaría. Puedes correrlo en una VM para practicar sin setup completo.

### Bug bounties

Plataformas como **HackerOne** o **Bugcrowd** muestran qué buscan las organizaciones. Sitios de Microsoft y Apple también tienen programas públicos.

> [!warning] Solo en apps donde tengas permiso
> Conoce las leyes. **No ataques apps reales sin autorización**; te puede llegar una demanda o la policía a tu casa.

## Próximos pasos

- [[21-performance-del-frontend|Performance del frontend]]: Core Web Vitals, Lighthouse, sitespeed.io, bundle size analysis, lazy loading, prefetching, imágenes y CSS.
