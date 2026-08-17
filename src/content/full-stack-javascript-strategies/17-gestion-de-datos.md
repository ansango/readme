---
title: "Gestión de datos"
description: "API calls con Axios y TanStack Query, .env y variables de entorno, loading states, error states, configurar headers, cuándo revisar la lógica del backend"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, data-fetching, axios, tanstack-query, env]
---

# Gestión de datos

> [!abstract] Resumen
> Esta nota cubre el fetching y actualización de datos desde el frontend: herramientas (Axios + TanStack Query), configuración de env vars, custom hooks para data fetching, loading y error states, configuración de headers y el principio de "cálculos en el backend, no en el frontend". El objetivo es tener un sistema de data fetching consistente, performante y fácil de mantener, que dialogue bien con el backend.

## Coordinar con backend

Habla con los devs de backend sobre las expectativas de API calls. Si eres full stack, también puedes escribir tickets para hacer cambios en el backend tú mismo. Por ahora, tú y el equipo de backend habéis acordado endpoints y schema esperados.

> [!tip] Minimizar API calls
> Es buena práctica **limitar el número de API calls** que el frontend necesita. Para eso, entiende cómo los datos afectan al layout y cuándo se necesitan en el flujo de UX. Una experiencia consistente es clave: si los datos parpadean o tardan, el usuario piensa que algo va mal.

## Herramientas para fetching

El ecosistema JS cambia rápido. Opciones principales: **TanStack Query**, **SWR**, **RTK Query**, **React Router**. Se pueden combinar con Axios o con Fetch built-in.

Métricas para evaluar data-fetching libraries:

- Cache management.
- Devtools.
- Retry handling.
- Error handling.
- Query y mutation capabilities.
- Supported protocols.
- API definitions.
- Integración con el framework.

Y las métricas estándar de cualquier paquete:

- Bundle size.
- Community support.
- Documentación.
- Ejemplos.

> [!note] RTK Query si ya usas Redux
> Si ya tienes Redux en la app, RTK Query es la opción natural porque es parte del suite. Si quieres caching, memoization y refetching out-of-the-box, TanStack Query o SWR son full-feature.

> [!note] Memoization
> Funciones que son costosas (tiempo o cómputo) **guardan el resultado en caché**. Si pasas los mismos argumentos, devuelven el resultado cacheado sin ejecutar la función de nuevo.

### GraphQL o tRPC

Si en el backend hay GraphQL o tRPC (relaciones complejas, valores muy anidados), el frontend probablemente cambie para ser compatible. **Apollo Client** o **urql** entran en juego.

> [!tip] Haz tu propio benchmark
> Las comparaciones online son útiles, pero **tu benchmark para tu app** es lo que cuenta. Prueba los top 3 candidatos con datos reales de tu proyecto.

## API calls con Axios y TanStack Query

El proyecto del libro usa:

- **Axios**: sintaxis más limpia que Fetch, configs built-in.
- **TanStack Query**: muy feature rich, caching, pagination, deduplicación de requests.

```bash
npm i @tanstack/react-query axios
npm i -D @tanstack/eslint-plugin-query
```

> [!note] Axios vs Fetch
> Fetch puede hacer esencialmente lo mismo que Axios. La diferencia es la developer experience. Consulta al equipo: algunos devs prefieren uno u otro por costumbre.

### QueryClientProvider

TanStack Query funciona como context, así que necesitas crear el client y envolver la app.

```typescript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* ... */}
      </ThemeProvider>
    </QueryClientProvider>
  );
};
```

Toda la app tiene acceso al cache del queryClient. Puedes configurar opciones avanzadas (cache time, stale time, refetch on window focus, etc.) según las necesidades de la app.

## .env: variables de entorno

En backend, Node 20+ tiene soporte built-in para .env. Antes era el paquete `dotenv`. En frontend, las env vars se usan también, con matices importantes:

> [!warning] Frontend env vars son públicas
> En el frontend, las env vars son **simuladas**: cuando compilas el código, sus valores aparecen en el output en texto plano. **Nunca pongas secretos en frontend env vars**. Solo cosas que no te importa que sean públicas: endpoint URLs, API keys públicas.

Para local y develop, está bien cargar de un .env en disco porque los valores no afectan producción ni billing.

### Cómo acceder

Depende del build tool. Con Vite:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

(Vite expone solo las variables que empiezan con `VITE_`.)

### Configurar la API URL

En `.env`:

```text
VITE_API_URL=http://localhost:3000
```

El valor cambia según el entorno (local, dev, staging, prod). Por eso se externaliza.

## Custom hook para API calls

Crea un custom hook que encapsule las llamadas. Razones: separación de concerns, testing más fácil, componente más legible.

```typescript
// useUserInfo.tsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function useUserInfo() {
  const {
    isLoading: ordersAreLoading,
    error: ordersErrors,
    data: orderData,
  } = useQuery({
    queryKey: ['orderData'],
    queryFn: () =>
      axios
        .get(`${import.meta.env.VITE_API_URL}/v1/orders`)
        .then((res) => res.data),
  });

  const {
    isLoading: userIsLoading,
    error: userErrors,
    data: userData,
  } = useQuery({
    queryKey: ['userData'],
    queryFn: () =>
      axios
        .get(`${import.meta.env.VITE_API_URL}/v1/users`)
        .then((res) => res.data),
  });

  return {
    ordersAreLoading, ordersErrors, orderData,
    userIsLoading, userErrors, userData,
  };
}

export default useUserInfo;
```

`useQuery` te da loading, error y data. El `queryKey` identifica la query en el cache. `queryFn` hace la llamada.

### En el Container

```typescript
const UserInfo = () => {
  const {
    orderData, ordersAreLoading, ordersErrors,
    userData, userIsLoading, userErrors,
  } = useUserInfo();

  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    orderStore.orders = orderData;
  }, [orderData]);

  useEffect(() => {
    userStore.user = userData;
  }, [userData]);

  if (userIsLoading || ordersAreLoading) return <div>Data is loading...</div>;
  if (userErrors || ordersErrors) {
    return <div>Something went wrong</div>;
  }

  return (
    <Container component="section">
      <Header
        userName={userStore.user.name}
        joinedDate={userStore.user.joinedDate}
        onSubmitSearch={onSubmitProductSearch}
      />
      <OrderForm />
      <OrdersTable orders={orderStore.orders} />
    </Container>
  );
};
```

## Loading states

Crea **componentes reales** para loading states, no divs con texto. Tu component library ayuda. Discute con Diseño y Producto qué loading states se necesitan.

> [!tip] No bloquees toda la página
> Bloquear la página entera esperando a todas las responses es malo para UX. Una response suele volver antes que la otra. Muestra **loading states separados** por sección.

```typescript
return (
  <Container>
    {userIsLoading ? (
      <CircularProgress />
    ) : (
      <Header
        userName={userStore.user.name}
        joinedDate={userStore.user.joinedDate}
        onSubmitSearch={onSubmitProductSearch}
      />
    )}

    <div>Search bar</div>

    {ordersAreLoading ? (
      <CircularProgress color="secondary" />
    ) : (
      orderSnap.orders.map((order) => (
        <div key={order.id}>{order.productName}</div>
      ))
    )}
  </Container>
);
```

Esto da más flexibilidad en lo que el usuario ve y cuándo. La carga async se maneja con el `isLoading` que TanStack Query expone hasta que vuelve la response.

## Error states

Por ahora, un componente simple con un mensaje de error es suficiente (scaffolding para desbloquear al equipo). En [[19-manejo-de-errores-en-frontend]] entraremos en detalle.

```typescript
if (userErrors || ordersErrors)
  return (
    <Alert icon={<CheckIcon fontSize="inherit" />} severity="error">
      Something went wrong
    </Alert>
  );
```

## Configurar request headers

En algún momento necesitas enviar headers específicos en tus requests: access tokens, content types, etc. Configurar los headers **a nivel global** es mejor que per-request por mantenibilidad y debugging.

Crea `src/axios.config.ts`:

```typescript
import axios from 'axios';

const AUTH_TOKEN = localStorage.getItem('dashboard_web_auth');

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/json';
```

> [!warning] Tokens en localStorage
> Usar `localStorage` para tokens es **común pero tiene riesgos** (XSS). En [[20-seguridad-del-frontend]] veremos opciones más seguras.

Si necesitas diferentes base URLs, puedes tener varias instancias de Axios o hacerlo per-request.

### SDK para el backend

Si haces las mismas API calls desde múltiples apps, considera crear un **SDK** (paquete que exporta métodos con tipos y docs). SendGrid y Google Maps son ejemplos de SDKs bien hechos.

## Cuándo revisar la lógica del backend

Cuando empieces a hacer cálculos en el frontend, **pregunta si debería estar en el backend**:

- Los cálculos en el backend son consistentes entre browsers y client machines.
- Haces el cálculo una vez en el server, no miles en clients.
- Puedes cachear el resultado.

### Cuando hay que revisar

- **Data formatting pesado en frontend**: si hay otros servicios llamando al endpoint, considera un endpoint distinto.
- **Payloads grandes**: puede ser falta de paginación, sorting o filtering en el backend. Discute con el equipo.
- **Múltiples requests para merge en frontend**: ¿se puede hacer un endpoint único o hay razones legítimas para separarlos?

> [!note] Separación de concerns
> A veces tiene sentido tener endpoints separados por separation of concerns en el backend, aunque signifique más requests en frontend. No siempre es malo.

## Próximos pasos

- [[18-estilos-personalizados|Estilos personalizados]]: accesibilidad, diseños consistentes, temas, responsive design.
