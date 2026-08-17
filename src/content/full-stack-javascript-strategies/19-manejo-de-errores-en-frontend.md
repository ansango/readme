---
title: "Manejo de errores en frontend"
description: "Error boundaries en distintos niveles, error components, user validation errors, API errors, logging con Sentry/LogRocket/Datadog"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, error-handling, error-boundaries, sentry]
---

# Manejo de errores en frontend

> [!abstract] Resumen
> Esta nota cubre el lado práctico del manejo de errores en frontend: error boundaries de React a tres niveles (app, layout, component), construir componentes de error específicos, validación de inputs del usuario (MUI, React Hook Form, schemas con Zod/Yup), manejo de errores de API con TanStack Query, y logging con servicios externos. El objetivo es que la app no crashee, no filtre información sensible, y mantenga una UX consistente incluso cuando algo falla.

## Por qué el error handling es crítico

Error handling no es decoración: es **seguridad, UX y debuggability**. Sin él, los usuarios ven pantallas en blanco, devs pierden horasdebuggeando, y atacantes pueden extraer información sensible de mensajes de error mal filtrados.

Trabaja con Producto y Diseño para definir **error states útiles** que guíen al usuario a tomar la acción correcta.

## Error boundaries

Un **error boundary** es un componente que muestra un fallback UI (mensaje de error) cuando se captura un error en el component tree. Sin él, los usuarios ven pantalla en blanco en producción; en desarrollo, ves el React error overlay.

> [!note] try/catch no es suficiente
> En React, `try/catch` no captura errores de rendering como esperarías. React llama a las funciones; no es imperativo. Para rendering errors, necesitas error boundaries.

### Limitaciones

Un error boundary **no maneja**:

- **Async errors** (usa `useErrorBoundary` hook para esto).
- **Errores en event handlers**.
- **Errores lanzados dentro del propio boundary**.

Por eso necesitas una **combinación** de estrategias.

### Tres niveles de error boundary

#### App level

En la raíz del component tree, envolviendo todo. Es el catchall final. **Siempre tenlo en cualquier app**. Similar a un try/catch top-level.

```typescript
import { ErrorBoundary } from 'react-error-boundary';

const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => window.location.reload()}
    >
      <QueryClientProvider client={queryClient}>
        {/* ... */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
```

#### Layout level

Para grupos de componentes en una misma página. Más específico que app level. Si algo falla en un componente del layout, el boundary muestra para todos los del layout.

#### Component level

El más granular. Para componentes aislados (con su propio state, sus propias API calls). El error no afecta al resto de la página.

### Implementación con `react-error-boundary`

Usa el paquete `react-error-boundary` (lightweight, no requiere class components):

```bash
npm install react-error-boundary
```

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={logError}
  onReset={() => window.location.reload()}
>
  {/* children */}
</ErrorBoundary>
```

- `onError`: se llama cuando se captura un error; aquí logueas.
- `onReset`: maneja retries. En app level suele ser `window.location.reload()`. En levels inferiores, resetea el state del componente.

### React Router y error boundaries

React Router v6 (en el momento del libro) tiene un comportamiento que requiere refactor: el router interno captura errores antes que tu boundary. Usa `useRoutes` + `BrowserRouter` en lugar de `createBrowserRouter` + `RouterProvider` para que los errores lleguen a tu boundary.

```typescript
// routes.tsx
import { useRoutes } from 'react-router-dom';
import UserInfo from './pages/UserInfo';

const Router = () => {
  const routes = useRoutes([
    { path: '/', element: <UserInfo /> },
    { path: '/actions', element: <div>Actions are here</div> },
  ]);
  return routes;
};

export default Router;
```

```typescript
// App.tsx
import Router from './routes';
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <Router />
</BrowserRouter>
```

> [!warning] Paquetes con boundaries internos
> Si un paquete (como React Router) tiene su propio error boundary, va a capturar errores antes de llegar a tu boundary. Cuando un error no se maneje como esperas, mira si algún paquete lo está interceptando.

## Componentes de error

Trabaja con Diseño y Producto para decidir cómo se ven los errores: modals con retry, mensajes full-screen, toasts temporales, o combinaciones.

Crea `src/components/ErrorFallbacks/ErrorFallback.tsx`:

```typescript
import { Box, Typography, Button } from '@mui/material';
import { ErrorFallbackProps } from '../../types/errorTypes';

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <Box
      margin="24px auto"
      role="alert"
      display="flex"
      flexDirection="column"
      gap="24px"
      textAlign="center"
    >
      <Typography variant="h2">Something weird happened</Typography>
      <Typography variant="h3">This is what it was:</Typography>
      <Typography color="tomato" variant="body1">
        {error.message}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Refresh the page to try again
      </Button>
    </Box>
  );
};

export default ErrorFallback;
```

Componentes específicos para cada caso (404, 500, undefined values) son variaciones de este con copy distinto y botones contextuales.

## Logging de errores

Loguear errores te da el contexto que necesitas para debuggear en producción. **No loguees a `console.log` en producción**: usa un servicio externo.

Crea `src/utils/helpers.tsx`:

```typescript
import { ErrorFallbackProps } from '../types/errorTypes';

export const logError = (error: ErrorFallbackProps['error']) => {
  // Log a Sentry, LogRocket, Datadog, etc.
  // NO loguear a console en producción
  console.log(error.message);
};
```

Servicios populares:

- **Sentry**: errors y performance. Se puede self-host.
- **LogRocket**: session replay.
- **Datadog**: monitoring y logs.
- **Amazon CloudWatch**: si estás en AWS.

Cuanto mejores sean los logs, más rápido encontrarás las causas raíz. Métricas sobre qué errores pasan más a menudo apuntan a lugares que necesitan refactor.

## User validation errors

Distintos momentos y formas de mostrar errores de validación:

- **Inline al focus** del input.
- **Al submit o al cambiar focus** desde el input.
- **En bloque** al final del form.

Lo más común es **combinar**: feedback inmediato en campos críticos, resumen al submit.

### Con MUI

MUI trae validación built-in en sus inputs:

```typescript
const searchFieldInputProps = {
  maxLength: 15,
  minLength: 3,
  required: true,
};

<Input
  inputProps={searchFieldInputProps}
  {...register('search', { required: true, maxLength: 15, minLength: 3 })}
  aria-invalid={errors.search ? 'true' : 'false'}
/>
```

### Con React Hook Form

React Hook Form valida al submit. El usuario no ve errores hasta que intenta enviar:

```typescript
{...register('search', {
  required: true,
  maxLength: 15,
  minLength: 3,
  pattern: /^[A-Za-z]+$/i,
})}
```

### Con schema (Yup/Zod/Joi)

Validación declarativa, reus across componentes:

```typescript
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  searchText: yup.string().min(3).max(15).required(),
}).required();

useForm({ resolver: yupResolver(schema) });
```

> [!tip] Mensajes de error con Diseño
> Las opiniones varían sobre cuándo y cómo mostrar errores. **Trabaja con Diseño** porque ellos tienen mejor intuición de lo que el usuario espera.

## API errors

TanStack Query trae error handling built-in. Los status codes permiten mostrar mensajes útiles:

| Status | Significado | Mensaje típico al usuario |
|---|---|---|
| 4xx | Error del cliente | Algo no fue bien con tu request |
| 422 | Unprocessable entity | Datos inválidos, revisa el form |
| 500 | Error del server | Algo falló en nuestra parte, intenta más tarde |
| 404 | Not found | No encontramos lo que buscas |

> [!warning] No filtres detalles del backend
> Un 422 puede ser un parámetro mal nombrado en el código del frontend, o input format incorrecto. El usuario no puede hacer nada con esa info, pero un atacante sí. **Loguea el detalle en tu servicio, muestra algo genérico al usuario**.

```typescript
if (userErrors || ordersErrors)
  return (
    <Alert icon={<CheckIcon fontSize="inherit" />} severity="error">
      Something went wrong
    </Alert>
  );
```

El dev ve el error real en Sentry/Datadog; el usuario ve algo útil pero genérico.

### Mocking errors para testing

- **httpstat.us** devuelve status codes específicos.
- **tweak** (browser extension) modifica responses.
- **Mock Service Worker (MSW)** mocks desde el frontend.
- O añade un query param a tu endpoint: `GET /order/72?responseStatus=404`.

> [!tip] Estrategia de doble mensaje
> **Loguear el mensaje del backend, mostrar mensaje custom al usuario**. Pero cuidado: en DevTools el usuario puede ver la response. Asegúrate de que la response ya venga redactada desde el backend, o que tu custom message sea lo único que se renderiza.

## Próximos pasos

- [[20-seguridad-del-frontend|Seguridad del frontend]]: business logic validation, session management, package version maintenance, input validation, ethical hacking para entender las vulnerabilidades.
