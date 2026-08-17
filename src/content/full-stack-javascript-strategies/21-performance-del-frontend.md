---
title: "Performance del frontend"
description: "Core Web Vitals (LCP, FID, CLS), Lighthouse, sitespeed.io, bundle size analysis, lazy loading, prefetching, SSR, imágenes y CSS optimizados"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, performance, lighthouse, web-vitals, lazy-loading, prefetching]
---

# Performance del frontend

> [!abstract] Resumen
> Esta nota cubre cómo medir y mejorar la performance del frontend: Core Web Vitals (LCP, FID, CLS), herramientas (Lighthouse, sitespeed.io), análisis de bundle size, lazy loading con Suspense, prefetching con TanStack Query, optimización de imágenes, CSS, fuentes y assets. El objetivo es una app rápida, suave y eficiente que no deje fuera a usuarios con hardware modesto o conexiones lentas.

## Por qué importa la performance

Apps lentas con interfaces saltarina frustran a usuarios y ralentizan a los devs. Una vez la app está estable y la arquitectura principal está en su sitio, optimizar performance es de las mejores inversiones de tiempo.

> [!tip] Performance desde el inicio
> La performance debería estar en tu mente desde el principio. Muchos problemas se pueden abordar más tarde, pero cuanto antes los surfaces, mejor. **No esperes a que un dev del equipo se queje** de lo lento que es HMR para empezar a mirar esto.

## Métricas: Core Web Vitals

Antes de optimizar, **define en qué métricas te basas**. Si no sabes qué medir, empieza con los Core Web Vitals. Algunos se aplican más que otros a tu app.

### LCP (Largest Contentful Paint)

Cuánto tarda en renderizar el **mayor bloque de contenido o imagen** desde que el usuario navega a la página.

- **Objetivo**: < 2.5 segundos.
- **Aceptable**: hasta 4 segundos.
- **Por encima**: UX pobre, hay que mejorar.

### FID (First Input Delay)

Cuánto tarda el browser en **procesar event handlers** disparados por el usuario tras una interacción (click, type).

- **Objetivo**: < 100 ms.
- **Aceptable**: hasta 300 ms.

### CLS (Cumulative Layout Shift)

Cuánto **salta el layout** durante la carga. Importante para evitar contenido moviéndose mientras el usuario interactúa. Los **skeleton loading components** son útiles aquí.

- **Objetivo**: < 0.1.
- **Aceptable**: hasta 0.25.

> [!warning] CLS es controlable por devs
> De las tres, esta es la que más depende de las decisiones de frontend. Skeletons, imágenes con dimensiones fijas, fuentes que no causan reflow.

## Herramientas de medición

### Lighthouse

Open source, integrado en Chrome DevTools. Audita performance, accessibility, SEO, best practices. **Corre Lighthouse periódicamente** y comparte resultados con el equipo.

```bash
npm install -g lighthouse
lighthouse http://localhost:5173/ --output-path=./report.json --output json
```

> [!warning] Local != producción
> Resultados en local pueden ser muy distintos a producción (assets sin comprimir, código sin minificar, configs no optimizados). Para tests representativos, **haz un build de producción local** y corre Lighthouse sobre ese build.

El output JSON es programable: puedes configurar thresholds en CI y fallar el build si una métrica crítica está por debajo.

### sitespeed.io

Open source, más flexible que Lighthouse. Permite dashboards, reportes por página, distintos browsers, configs custom. Se puede correr en Docker.

```bash
npm install -g sitespeed.io
sitespeed.io http://localhost:5173/ --browser safari -n 2 --summary-detail
```

Reporta TTFB, FCP, DOMContentLoaded, Load, CPU Benchmark. Envía alertas a Slack. Integra en CI/CD fácilmente.

### Commercial products

Sentry, New Relic, Datadog — cubren performance, errors, logs en producción con dashboards y alertas.

## Bundle size analysis

Bundle size es uno de los factores menos obvios. **Cada paquete que instalas suma al bundle**, y muchos traen sus propias dependencias transitivas.

### Herramientas de análisis

- `vite-bundle-visualizer` (o `source-map-explorer` para Webpack).

```bash
npm install vite-bundle-visualizer
npx vite-bundle-visualizer
```

Genera un treemap visual del bundle. **Haz clic en cada cuadrado** para ver qué archivo lo infla. Sorpresas comunes:

- Un paquete que pensabas pequeño resulta enorme.
- Componentes del propio equipo que son más grandes de lo esperado.

## Build configurations

Fine-tuning de build configs es una skill senior. Cosas a revisar:

- `tsconfig.json`: target, module, lib — qué archivos se incluyen, cómo se compilan, compatibilidad con browsers.
- **Excluye tests y reportes** del artifact de producción.
- **Polyfills**: browser support dictates cuántos necesitas.
- **Módulos JS modernos**: ES2016, ES8, async/await, spread, optional chaining. Mantente al día con [TC39 proposals](https://github.com/tc39/proposals).

> [!tip] CRACO para Create React App
> Si tu proyecto es CRA, **CRACO** te da acceso a configs que CRA no expone directamente. Útil para optimizations de performance.

### Caching configuration

Cachear recursos en el browser reduce load times. Trade-off: **performance vs consistency**. Bank account info o order info deben fetchear en cada page load; listas de productos o event calendars pueden cachear más tiempo.

> [!tip] El cache hace debugging más difícil
> Cuando algo no se ve como esperas, puede ser cache desactualizado. **Sugiere a devs y usuarios limpiar el cache o probar otro browser**. Si la app está mostrando valores que ya no existen, podría crashear.

#### Con TanStack Query

```typescript
const { isLoading, error, data } = useQuery({
  gcTime: 3600000,       // garbage collected tras 1h
  refetchInterval: 3600000, // refetch cada 1h
  staleTime: 1800000,    // stale tras 30 min
  queryKey: ['orderData'],
  queryFn: () => axios.get(...).then((res) => res.data),
});
```

#### Cache busting

Mecanismo para forzar reload de pages o invalidar cache. Útil cuando:

- API updates cambian la response de forma que rompe el frontend.
- Push de updated data para cumplir deadlines de terceros.

Implementación: código que force-reload, cambio temporal de cache strategy, o un **CDN** que permita push changes.

> [!note] CDNs
> Un **CDN** cachea snapshots de tu app en servers geográficamente cercanos al usuario. Acelera loads. Añade complejidad a debugging: si "algunos pero no todos los usuarios" tienen un issue, el CDN puede ser el culpable. Limpia el cache desde el dashboard del provider.

#### Hooks built-in de React

`useContext`, `useMemo`, `useCallback` también pueden ayudar a cachear data. Revisa los defaults antes de tocar nada.

## Lazy loading

Carga contenido importante primero; el resto bajo demanda. Reduce page load time y mejora CLS (si los skeletons tienen las dimensiones correctas).

### Con React Suspense

```typescript
const Header = lazy(() => import('../../components/Header'));

<Suspense
  fallback={
    <CircularProgress
      color="secondary"
      size={100}
      data-testid="header-loading-circle"
    />
  }
>
  <Header userName={userInfo.name} joinedDate={userInfo.joinedDate} />
</Suspense>
```

### Skeleton components

```typescript
const TableLoadingSkeleton = () => (
  <table>
    <thead>
      <tr>
        <td>Product</td>
        <td>Description</td>
        <td>Price</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colSpan={3}>Loading...</td>
      </tr>
    </tbody>
  </table>
);
```

Mantén **alto y ancho similares** al componente real para evitar layout shift.

> [!tip] Lazy loading vs conditional rendering
> Puedes hacer algo similar renderizando condicionalmente según loading state. **Suspense + lazy es más idiomático en React**, pero es cuestión de preferencia del equipo.

## Prefetching

**Pre-carga lo que el usuario va a necesitar después** y ténlo listo en cache.

TanStack Query tiene `prefetchQuery` para esto.

> [!note] SSR
> **Server-side rendering** viene a colación con prefetching porque puedes prefetch páginas enteras desde el server (Next.js, React Server Components).
>
> SSR es un paradigma distinto: los componentes server-rendered no re-renderizan en el cliente. No se actualizan con `useState` o `useEffect`. Ventajas: contenido estático carga muy rápido, lógica de backend se escribe en el mismo estilo que el frontend. Desventajas: debugging puede ser confuso si no lo esperas, y si tu contenido es muy user-specific el beneficio es limitado.
>
> Útil para: contenido estático, calendarios de eventos compartidos, listas de productos. Menos útil para: account info de usuario, dashboards con datos específicos.

## CSS, imágenes, fuentes

### Imágenes

- **Comprimir** y servir con dimensiones correctas.
- **SVG** para gráficos e ilustraciones (scaling sin pérdida).
- **WebP, AVIF**: formatos modernos pero con soporte limitado. Mira [CanIUse](https://caniuse.com/).
- **`srcset`** para diferentes tamaños según resolución.

### CSS

- **Minifica** y **elimina estilos no usados**.
- CSS moderno hace cosas que antes requerían JS (dark mode, gradient animations, parallax). Antes de meter JS, mira si CSS lo puede hacer.

### Fuentes

- Carga solo las fuentes que necesitas, **elimina las que no**.
- Si puedes, **self-host** las fuentes en lugar de depender de un CDN de terceros.
- Lo mismo con MUI: importa componentes específicos, no la librería entera.

## Performance como accessibility

> [!warning] Performance deja gente fuera
> Personas en áreas rurales, en cellular, con hardware viejo, con conexiones lentas, con planes de datos medidos. Si tu site es lento, **los excluyes**. Como devs tendemos a tener buen hardware y conexión rápida, y eso nubla el juicio.

## Próximos pasos

- [[22-testing-del-frontend|Testing del frontend]]: unit tests con Jest/Vitest, React Testing Library, Mock Service Worker, e2e tests con Cypress.
