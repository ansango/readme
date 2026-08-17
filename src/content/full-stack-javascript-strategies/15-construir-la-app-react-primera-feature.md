---
title: "Construir la app React: primera feature"
description: "Estructura de carpetas (components/ y pages/), patrón Container + index, routing con React Router, actualizar la raíz con ThemeProvider y RouterProvider"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, routing, react-router, structure]
---

# Construir la app React: primera feature

> [!abstract] Resumen
> Esta nota continúa el setup del frontend: estructura de carpetas (components/ para piezas reusables, pages/ para vistas), el patrón Container + index + test, configurar routing con React Router, y actualizar la raíz de la app con ThemeProvider y RouterProvider. El objetivo es tener un esqueleto navegable para que el equipo pueda trabajar en paralelo en distintas features.

## Build the first feature

Con el repo listo, es momento de añadir algo de funcionalidad. Empieza con una pieza **relativamente pequeña pero lo bastante grande para resaltar issues potenciales**. En el ejemplo del libro: la estructura de carpetas, el routing inicial, y el container para las páginas.

> [!tip] El senior como multiplicador
> Mientras el resto del equipo hace feature work, tú puedes hacer background development: convenciones, docs, e implementar herramientas que aceleren a los demás. Es una forma de ser multiplicador para el equipo.

## Estructura del proyecto

En `src/`, crea dos carpetas:

- **`components/`**: piezas reusables, pequeñas. Search bars, navbar, header, styled components compartidos.
- **`pages/`**: vistas grandes que componen una pantalla entera. UserInfo, UserActions, etc.

> [!note] README debe reflejar la estructura
> Documenta en el README cómo está organizado el código. Cuando devs nuevos lleguen, esa nota les ahorra horas de exploración. **Pide al equipo que testee los pasos** del README y añadan detalles cuando encuentren issues.

## Patrón Container + index + test

Por cada feature, sigue este patrón mínimo:

```text
pages/
  UserInfo/
    index.tsx
    UserInfo.Container.tsx
    UserInfo.Container.test.tsx
```

### UserInfo.Container.tsx

El componente principal con styled-components y la lógica:

```typescript
import styled from 'styled-components';

const Container = styled.div`
  background-color: #f0f0f0;
  height: 100vh;
  width: 100%;
`;

const UserInfo = () => {
  // Fetch user info from el backend aquí
  return (
    <Container>
      <div>
        <div>Search bar</div>
        <div>User notification</div>
      </div>
    </Container>
  );
};

export default UserInfo;
```

### index.tsx

Crea un **module file** que reexporta. Esto simplifica imports: en lugar de `import UserInfo from './UserInfo/UserInfo.Container'`, escribes `import UserInfo from './pages/UserInfo'`.

```typescript
import UserInfo from './UserInfo.Container';
export default UserInfo;
```

> [!tip] Module files
> Los module files (index.tsx) son una buena práctica que escala. A medida que la app crece, no quieres estar pendiente de qué archivo específico tiene qué cosa. Echa un vistazo a la [doc de MDN sobre módulos](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Modules) si no los dominas, es algo que todo el equipo debería entender.

### Test mínimo

Por cada container, **al menos un test** que verifica que renderiza. Esto sienta precedente: el proyecto tiene tests, no son opcionales.

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserInfo from '.';

const ui = () => render(<UserInfo />);

describe('<UserInfo />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the user info screen', async () => {
    ui();
    expect(screen.getByText('Search bar')).toBeDefined();
  });
});
```

> [!tip] No te atasques en el primer componente
> En esta fase no estás intentando hacer todo feature-complete. Estás poniendo el esqueleto para que cada dev trabaje en su parte. Es tentador querer hacer todo tú; resístelo. **Tu trabajo es habilitar a los demás**.

## Routing

El container principal se compone de dos partes: el **navbar** y la **pantalla actual**. Vamos a configurar el routing inicial para esa pantalla actual.

Instala React Router:

```bash
npm i react-router-dom
```

> [!note] Alternativas a React Router
> - **TanStack Router**: type-safe, con excelente TypeScript inference.
> - **Next.js**: trae routing built-in si vas a hacer SSR/SSG.

Crea `src/routes.tsx`:

```typescript
import { createBrowserRouter } from 'react-router-dom';
import UserInfo from './pages/UserInfo';

const router = createBrowserRouter([
  {
    path: '/',
    element: <UserInfo />,
  },
  {
    path: '/actions',
    element: <div>Actions go here</div>,
  },
]);

export default router;
```

Las rutas iniciales son placeholders. La idea es tener URLs distintas para cada página desde el principio, así puedes configurar linking interno y testing E2E sin esperar a tener todo el contenido.

## Actualizar la raíz de la app

`App.tsx` queda como el contenedor base con theme y router:

```typescript
import { ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { RouterProvider } from 'react-router-dom';
import styled from 'styled-components';
import theme from './theme';
import router from './routes';

const AppContainer = styled(Box)`
  display: flex;
`;

const CurrentScreen = styled(Box)`
  width: calc(100% - 240px);
  margin-left: 240px;
`;

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer component="main">
        <CurrentScreen component="section">
          <RouterProvider router={router} />
        </CurrentScreen>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;
```

El navbar (240px de ancho) se queda fuera del CurrentScreen, y el resto del espacio es para la pantalla activa. La estructura permite iterar después sobre el navbar sin tocar el contenido.

## Probar y commitear

Corre la app:

```bash
npm run dev
```

Deberías ver el esqueleto cargando. **Todos los scripts deben seguir corriendo sin errores**: dev, build, lint, format, test (sin tests aún pero no debe fallar).

> [!tip] Testea el pipeline en este punto
> Si DevOps ya tiene algo del pipeline montado, haz un deploy a un entorno de prueba. **Es mejor cazar issues de infra ahora** que cuando el equipo esté a tope en features.

## Cuándo parar

Esta es la parte difícil. **No intentes hacer todo solo**. Tu trabajo es:

1. Tener la estructura clara.
2. Tener las herramientas funcionando.
3. Tener un ejemplo (la primera feature) que sirva de template.
4. Dejar que el equipo itere.

Las cosas van a cambiar. Los componentes se van a refactorizar. Los nombres van a evolucionar. Está bien. La consistencia inicial no se logra bloqueando cambios, sino teniendo un ejemplo que el equipo pueda seguir y mejorar.

## Próximos pasos

- [[16-gestion-de-estado|Gestión de estado]]: useState, useReducer, useContext, elegir nivel de la app para gestionar estado, state managers externos (Zustand, Redux).
