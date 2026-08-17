---
title: "Seguridad del backend"
description: "Autenticación, autorización, OWASP Top 10 aplicado al backend, audit trails, security testing (SAST, DAST), rotación de credenciales y geopolítica"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, backend, security, authentication, authorization, owasp]
---

# Seguridad del backend

> [!abstract] Resumen
> Esta nota es un mapa de los temas de seguridad que tienes que tener en mente cuando construyes un backend: cómo autenticar a los usuarios, cómo autorizar distintos niveles de acceso, los puntos del OWASP Top 10 que más aplican, las prácticas de seguridad continuas (audit trails, SAST/DAST, rotación de tokens) y la importancia de la geopolítica y las regulaciones. El objetivo no es convertirte en experto en seguridad, sino saber **qué preguntar y cuándo**.

## El alcance de la seguridad

La seguridad es un tema con tanta profundidad que tiene libros enteros dedicados. Este capítulo se enfoca en lo que puedes hacer en el backend. Si tienes un equipo de Seguridad, trabaja con ellos: revisan toda la infraestructura técnica de la empresa, hasta qué se puede instalar en tu laptop.

Las **regulaciones** que pueden aplicar a tu producto:

- **HIPAA**: apps de salud (US).
- **PCI DSS**: apps que manejan pagos.
- **GDPR**: casi cualquier app que maneje datos de usuarios europeos.

> [!tip] La seguridad se diseña, no se añade
> Es mucho más fácil (y barato) hacer seguridad desde el principio que añadirla después. Empieza por preguntar "¿esto es seguro?" en cada PR.

## Autenticación (AuthN)

Es cómo se valida la identidad del usuario. Métodos comunes:

- **Password authentication** (la más habitual).
- **MFA (Multifactor Authentication)**: añade una capa con email, SMS o app autenticadora.
- **Token authentication**: tokens que se intercambian.
- **Biometric authentication**: huella, cara.
- **OAuth**: delegación a un proveedor externo.
- **OTP (One-Time Password)**: códigos de un solo uso.

Esperar usar al menos uno o dos de estos en cualquier app seria. Cuanto más sensible sea la app, más capas.

### Amenazas a la autenticación

- **Brute force attacks**: probar millones de contraseñas.
- **Phishing**: engañar al usuario para que dé sus credenciales.
- **Session hijacking**: robar el token de sesión.

### Passwords robustos

- Almacenar siempre con **hashing + salting**.
- Forzar longitud y caracteres.
- Limitar número de intentos de login.

> [!note] Outsource cuando puedas
> Implementar AuthN desde cero es muy caro y muy arriesgado. Si necesitas un nivel de seguridad alto (por regulación o por sector), **usa un servicio de terceros**: Auth0, FusionAuth, Amazon Cognito, SuperTokens, Clerk. Si tu app no tiene requisitos especiales, Passport.js, NextAuth.js o la integración built-in de NestJS son opciones válidas.

### Tokens y sesiones

Cómo almacenas los tokens, cuánto viven, cuándo expiran, cómo los rotas: todo eso es decisión de diseño. Opciones:

- **Authorization code flow + PKCE** para apps con frontend separado.
- **Sesiones cortas + refresh tokens** para apps con sesiones largas.
- **Forzar re-login** tras cierto tiempo (más seguro, peor UX).

> [!tip] El balance UX vs seguridad
> La biometría es más segura, pero ¿la van a usar tus usuarios? Cada decisión de seguridad tiene un trade-off de UX. Discútelo con Producto y Seguridad.

## Autorización (AuthZ)

Que un usuario pueda loguearse **no significa que deba ver todo**. AuthZ es lo que define **qué puede hacer cada rol**.

### Principio de least privilege

Da a cada usuario **el mínimo acceso** que necesite para hacer su trabajo. Es la base sobre la que se construye cualquier otra cosa.

### RBAC (Role-Based Access Control)

Asignas usuarios a roles y cada rol tiene un conjunto de permisos. Es lo más común y lo más fácil de implementar. Muchos servicios de AuthN lo traen built-in.

```typescript
export const rbacConfig = {
  rolesConfig: [
    {
      roles: ['Customer'],
      permissions: ['get:order', 'create:order', 'get:product'],
    },
    {
      roles: ['Support'],
      permissions: ['get:order', 'update:order', 'delete:order', 'get:product'],
    },
    {
      roles: ['Store'],
      permissions: [
        'get:product', 'delete:product', 'create:product', 'update:product',
      ],
    },
  ],
};

const canCreateOrder = (user: User) => {
  if (user.roles.includes(Roles.Customer)) return true;
  return false;
};
```

> [!warning] RBAC se vuelve un monstruo
> RBAC escala razonablemente hasta cierto punto. Cuando tienes docenas de roles con pequeñas variaciones, considera ABAC o PBAC.

### ABAC (Attribute-Based Access Control)

Control mucho más granular basado en **atributos**: tipo de usuario, recurso al que accede, acción, entorno. Más flexible, pero más complejo. AWS IAM es un ejemplo clásico.

```typescript
export const abacConfig = {
  attributesConfig: [
    {
      action: 'CreateOrder',
      attributes: {
        user: { type: ['customer'] },
        resource: { type: 'order' },
      },
    },
    {
      action: 'GetOrder',
      attributes: {
        user: { type: ['customer', 'support'] },
        resource: { type: 'order' },
      },
    },
  ],
};
```

> [!quote] Cuidado al copiar roles en ABAC
> Ethan Brown lo señala: con docenas de reglas, los developers copian roles para ahorrar tiempo y meten reglas que no deberían estar. La flexibilidad de ABAC se convierte en un riesgo si no se audita regularmente.

### PBAC (Policy-Based Access Control)

Muy similar a ABAC pero definiendo **políticas** en vez de atributos. Es otra forma de hacer fine-grained access control (FGAC).

### ¿Cuál elegir?

| Pregunta | Implicación |
|---|---|
| ¿Cuántos tipos de usuario hay? | Pocos → RBAC basta. Muchos con variaciones → ABAC. |
| ¿Los servicios que usas ya ofrecen algún control? | Úsalo, no reinventes. |
| ¿Necesito granularidad fina? | Sí → ABAC/PBAC. No → RBAC. |
| ¿El acceso es dinámico? | Sí → ABAC se adapta mejor. |
| ¿Qué info tengo para decidir acceso? | Más atributos disponibles → ABAC funciona mejor. |

## OWASP Top 10 aplicado al backend

El [OWASP Top 10](https://owasp.org/www-project-top-ten/) es la lista canónica de las vulnerabilidades web más comunes. Revísalo en detalle. Los puntos más relevantes para backend:

### Broken access control (el #1)

Sucede cuando los permisos no están bien aplicados. Causas típicas:

- No seguir least privilege hasta sus últimas consecuencias.
- Olvidar guards en algunos endpoints (cubriste POST pero no PUT ni DELETE).
- "Por comodidad", dar a todo el mundo permisos de admin.

**Defensa:** denegar acceso por defecto, permitir explícitamente.

### Injection (por falta de validación)

SQL injection, XSS, command injection. El backend debe **validar y sanear todos los inputs** que recibe. La validación en frontend nunca es suficiente: un atacante con DevTools puede saltarla.

### Authentication failure

Passwords débiles, credenciales en URLs, flujos de reset mal implementados. Defensa: passwords robustos, MFA, rate limiting en login.

### Vulnerable and outdated components

Las versiones viejas de paquetes tienen CVEs conocidos. **Mantén tus paquetes al día**; usa Dependabot o similar para que se creen PRs automáticamente.

### Insecure design

A veces el diseño mismo es inseguro. La técnica para detectarlo es **threat modeling**, un proceso de cuatro pasos:

1. ¿Qué feature estamos construyendo?
2. ¿Qué puede salir mal?
3. ¿Cómo lo vamos a manejar?
4. ¿Hemos abordado las concerns lo suficientemente bien?

Ejemplo concreto: al implementar "comprar producto", ¿se puede bypasear el stock? ¿se puede cambiar el order desde un link de email? ¿se puede ver info de otro user por un conditional mal puesto?

> [!note] Security como conversación
> Cuando un product owner te explica cómo quiere una feature, **pregunta por los huecos de seguridad** desde el principio. A veces la conversación lleva a re-diseñar la feature.

## Otras prácticas de seguridad

### Audit trail

Incluye siempre: fecha de modificación e ID del usuario que modificó. Como mínimo. Esto te permite:

- Identificar al usuario o servicio que está causando problemas.
- Determinar cuándo empezó un ataque.
- Investigar accesos sospechosos a datos.

Para apps con datos muy sensibles, considera auditar incluso los GET.

### Security scanning automatizado

- **Snyk**, **Veracode**: escanean tu código en busca de vulnerabilidades conocidas y dependencias vulnerables.
- **Dependabot**: abre PRs automáticos cuando hay actualizaciones de seguridad.
- **SAST (Static Application Security Testing)**: analiza tu código sin ejecutarlo.
- **DAST (Dynamic Application Security Testing)**: lo ejecuta como si fuera un atacante.

Inclúyelos en el pipeline de DevOps. Cuando lleguen reportes, tómatelos en serio.

### Pen testing

Equipos de ethical hackers contratados para encontrar debilidades. Escribe reportes con sus hallazgos y posibles soluciones. Muchas empresas complementan con **bug bounties**: pagan a quien encuentre vulnerabilidades legítimas en producción.

### Tipos de attackers

- **White hat**: usan sus skills para ayudar.
- **Black hat**: los que intentas mantener fuera.
- **Grey hat**: encuentran vulnerabilidades sin permiso pero sin intención maliciosa.

> [!tip] Aprende haciendo ataques básicos
> PortSwigger's Web Security Academy tiene recursos para aprender los ataques más comunes. Herramientas como sqlmap, Wireshark, John the Ripper o Kali Linux te enseñan cómo piensa un atacante.

### Auditorías de compliance

Haz auditorías específicas del sector (HIPAA, PCI DSS, GDPR) para asegurar que la app sigue cumpliendo. El equipo legal suele llevar el calendario; si no, revisa el código y verifica:

- ¿La PII está encriptada?
- ¿Los usuarios pueden acceder a sus propios datos?
- ¿Los datos se borran cuando el usuario lo pide?

### Supply chain security

Tu software depende de open source, que a su vez tiene dependencias. Vulnerabilidades en esas dependencias pueden venir **con intención** (ataques DDoS) o **sin intención** (un dev instala un paquete con nombre parecido al real). Usa frameworks de supply chain security para monitorizarlo.

### Rotación de credenciales

Rota tokens y credenciales de servicios de terceros **al menos varias veces al año**. Empresas que llevan años con el mismo token se llevan días intentando entender por qué algo dejó de funcionar cuando el servicio expiró la credencial.

## Developer experience con AuthZ

> [!quote] Ethan Brown sobre AuthZ testing
> En un proyecto con requisitos extensos de AuthZ, los developers empezaron dándose a sí mismos permisos de "superuser" para terminar features. Cuando llegó el UAT con usuarios reales, todo estaba roto porque los devs no habían role-played. Solución: una policy "Developer" que solo permite asumir otros roles, sin permisos elevados. Un role switcher en la UI. La fricción cayó, y el rol de cada uno se quedó en la cabeza de los devs.

## Próximos pasos

- [[09-debugging-del-backend|Debugging del backend]]: logs detallados, configs de entorno, estrategias para trazar bugs, ayudar a otros devs y checklist de debugging.
