---
title: "React del lado del servidor : renderToString, renderToPipeableStream, hidratación"
description: "Limitaciones del client-only rendering (SEO, performance, network waterfalls, CSRF), beneficios del SSR, renderToString vs renderToPipeableStream vs renderToReadableStream, hidratación vs resumability, Suspense para SSR"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, ssr, hidratacion, frameworks]
---

# React del lado del servidor

> [!abstract] Resumen
> React empezó siendo una librería *client-side*, pero las limitaciones de CSR — SEO endeble en crawlers que no ejecutan JS, *time to interactive* alargado por waterfalls de red, poca accesibilidad en dispositivos lentos, riesgos de CSRF — empujaron el modelo hacia el servidor. Hoy React ofrece tres APIs para SSR (`renderToString`, `renderToPipeableStream`, `renderToReadableStream`), todas se complementan con **hidratación** y, sobre todo en combinación con `Suspense`, abren la puerta a streaming de HTML y *partial hydration*. El capítulo cierra con una advertencia muy repetida por el libro: **no hagas tu propio SSR en producción**. Confía en Next.js, Remix o el framework que tu equipo haya elegido.

## Por qué CSR no basta

React como librería pura de cliente pinta el árbol en el DOM del navegador. Eso funciona perfectamente bien si el usuario llega con buen 4G y un iPhone 15. Si no, aparece la lista de problemas:

| Problema | Por qué duele |
|----------|--------------|
| **SEO** | Crawlers propietarios que no ejecutan JS ven una shell vacía. |
| **Performance** | El *time to interactive* depende de la descarga, parseo y ejecución del bundle. En redes lentas o dispositivos de gama baja es lento. |
| **Network waterfalls** | El HTML inicial no trae nada útil. La primera petición sirve el shell; la segunda, el JS; la tercera, el JSON de la API. |
| **Accesibilidad** | Lectores de pantalla y crawlers sociales (Facebook Open Graph, Twitter cards) ven páginas vacías. |

### SEO: ¿Google ya lo arregla?

Google y Bing indexan contenido que se renderiza con JS, pero los crawlers desconocidos, los archivadores web y los lectores sociales siguen esperando HTML. La forma segura sigue siendo **enviar el HTML ya renderizado** desde el servidor.

### Performance: el argumento central

Con CSR el primer byte es un `<div id="root"></div>` vacío. El usuario espera a que baje el bundle, lo parsee, lo ejecute y entonces ve algo. Con SSR el primer byte ya contiene la UI, y la hidratación se ejecuta en paralelo a la percepción del usuario.

```text
   Client only               Server rendered
   ───────────               ──────────────
   GET /                →    GET /
   ↓ shell vacío              ↓ HTML con UI
   GET bundle.js        →    GET bundle.js (en paralelo, mientras se ve UI)
   GET /api/items       →    GET /api/items (durante hidratación)
   ↓ render                  ↓ interactivo cuando termina hydrate()
   = waterfalls
```

### Seguridad: CSRF

Si todo tu código vive en el cliente, no tienes un *shared secret* entre front y back. Eso facilita ataques CSRF donde una página externa dispara acciones autenticadas con tus cookies. Tener un servidor controlado habilita tokens anti-CSRF que mitigan este vector.

```jsx title="Ejemplo vulnerable (cliente puro)"
const Account = () => {
  const [balance, setBalance] = useState(100);
  const handleWithdrawal = async (amount) => {
    const response = await fetch("/withdraw", {
      method: "POST",
      credentials: "include",                  // envía cookies automáticamente
      body: JSON.stringify({ amount }),
    });
    if (response.ok) setBalance(await response.json());
  };
  // ...
};
```

```jsx title="Mitigación con SSR + token anti-CSRF"
// server.ts
const csrfToken = randomBytes(32).toString("hex");
return ReactDOMServer.renderToString(
  <Account csrfToken={csrfToken} />              // token generado por el server
);

// Account.tsx
fetch("/withdraw", {
  method: "POST",
  headers: { "X-CSRF-Token": csrfToken },       // el back compara con la sesión
  body: JSON.stringify({ amount }),
});
```

## Beneficios del SSR

Resumidos en una tabla que el libro desglosa:

| Beneficio | Detalle |
|-----------|---------|
| **Faster first meaningful paint** | HTML con UI ya visible al primer byte. |
| **Mejor accesibilidad** | Usuarios con conexiones lentas ven contenido sin esperar JS. |
| **Mejor SEO** | HTML completo e indexable. |
| **Mejor seguridad** | Contrato bidireccional cliente ↔ servidor, con tokens y validación. |

## Hidratación

Una vez enviado el HTML estático, **la página todavía no es interactiva**. La hidratación es el proceso por el que React *toma ese HTML* y le engancha event listeners, restaurando el comportamiento de SPA.

```js title="Cliente (index.js)"
import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App";

hydrateRoot(document, <App />);   // reusa el DOM, no lo reemplaza
```

> [!warning] Hidratación estricta
> Si el árbol JSX produce una estructura distinta al HTML del servidor, React avisa con "hydration mismatch" y vuelve a renderizar desde cero. La causa típica: usar `Date.now()`, `Math.random()` o condiciones basadas en `typeof window` en render que no se replica en el servidor. Una de las trampas más sutiles de SSR.

### Hidratación *vs* resumability

La crítica a la hidratación es que **reconstruye todo el árbol** en cliente aunque el servidor ya lo tenía listo. *Resumability* (Qwik, Marko) envía en el HTML serializado **qué listeners van dónde**, para que el cliente solo *reanude* sin reejecutar todo el render. Más rápido en TTI pero más complejo de implementar; debate abierto en el ecosistema.

## Cómo funciona: server manual con Express

El libro muestra un SSR *naive* en Express para que se entienda el flujo. **No es para producción.**

```js title="server.js (didáctico)"
const express = require("express");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const App = require("./src/App");

const app = express();
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  const html = ReactDOMServer.renderToString(<App />);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>My React App</title></head>
      <body>
        <div id="root">${html}</div>
        <script src="/static/js/main.js"></script>
      </body>
    </html>
  `);
});

app.listen(3000);
```

Y en el cliente:

```js title="index.js (hidratación)"
import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App";

hydrateRoot(document, <App />);
```

> [!danger] Fíjate en la advertencia
> El libro etiqueta esta sección como "didáctica". El nodo `cachedUserData` que cualquier tutorial-Express mostraría es exactamente el tipo de bug que rompe a producción. En el siguiente apartado se insiste: no lo hagas tú mismo.

## Las APIs de SSR en React

| API | Stream | Concurrencia | Tamaño del payload | Hidratación |
|-----|--------|--------------|---------------------|-------------|
| `renderToString` | No | No | String completo | Sí |
| `renderToPipeableStream` | Node | Sí (`Suspense`) | Chunks streamed | Sí |
| `renderToReadableStream` | Web (WHATWG) | Sí (`Suspense`) | Chunks streamed | Sí |

### `renderToString` (legacy en la práctica)

Es el API síncrona original. Convierte el árbol en un string de HTML y lo entrega de una vez.

```js
import { renderToString } from "react-dom/server";

const html = renderToString(<App />);
// '<div><h1>Hello, world!</h1>...</div>'
```

**Problemas:**

- Es **síncrona y bloqueante** en el event loop. Atender 30 clientes simultáneos obliga a los siguientes a esperar.
- **Sin streaming**: el cliente no empieza a pintar hasta tener la cadena completa, lo que infla el *time to first byte*.
- **Memoria intensa**: mantener el árbol entero en memoria antes de enviarlo es caro en apps grandes.

> [!note] Cuándo sigue valiendo
> Solo para apps pequeñas, *toy projects*, pre-renderizado estático (Next.js static generation), o generación de HTML para emails donde `renderToStaticMarkup` (su variante sin atributos React) sigue siendo la opción.

### `renderToPipeableStream` (React 18+, Node)

Devuelve un *Node.js stream* que se conecta con `res` de Express. Soporta `Suspense` y **streaming de HTML**: el shell se envía inmediatamente; los hijos suspendidos se sustituyen en cuanto se resuelven.

```js title="server.js con renderToPipeableStream"
import { renderToPipeableStream } from "react-dom/server";

app.get("*", (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady: () => {
      res.setHeader("Content-Type", "text/html");
      pipe(res);   // emite el shell en cuanto está listo y sigue con el resto
    },
  });
});
```

```jsx title="App con Suspense + lazy"
import { lazy, Suspense } from "react";

const DogBreeds = lazy(() => fetch("/api/breeds").then(r => r.json()));

function App() {
  return (
    <div>
      <h1>Dog Breeds</h1>
      <Suspense fallback={<div>Loading Dog Breeds...</div>}>
        <DogBreeds />
      </Suspense>
    </div>
  );
}
```

Cuando el servidor emite el HTML, dentro del `Suspense` aparece un comentario/`<template>` como placeholder; un script inline (`$RC(...)`, el *reactComponentCleanup* minificado) reemplaza el fallback por el HTML resuelto *en el cliente* **sin necesidad de hidratar todavía**. Es decir, el contenido llega y se intercambia, y solo después hidrata el resto.

> [!tip] Streaming + Suspense ≠ hidratación
> El streaming usa *scripts inline* listos por el servidor para reemplazar fallbacks cuando los datos llegan. Para que la página sea interactiva todavía necesitas `hydrateRoot`, pero el usuario ve contenido y datos en paralelo, no espera la cascada completa.

### `renderToReadableStream` (Web Streams)

Misma idea que `renderToPipeableStream` pero con `ReadableStream` (WHATWG Streams), el estándar de los navegadores. Es lo que usarías en edge runtimes (Cloudflare Workers, Deno, Bun).

```js
import { renderToReadableStream } from "react-dom/server";

const stream = await renderToReadableStream(<App />);
return new Response(stream, { headers: { "Content-Type": "text/html" } });
```

## Cuándo usar cada API

El libro resume con un cuadro claro:

> **Si necesitas SSR en Node** → `renderToPipeableStream`.
> **Si necesitas SSR en un edge runtime / Web Streams** → `renderToReadableStream`.
> **Solo para tiny apps / static pre-render** → `renderToString`.

Pero el propio autor reconoce que **en React 18 casi nadie puede usar `renderToPipeableStream` en producción**, porque la mayoría de librerías de CSS-as-JS y data fetching asumen que el render del servidor está completo. La *partial hydration* y los APIs para preload (`prefetchDNS`, `preconnect`, `preload`) aterrizan en React 19, donde el panorama cambia.

## No hagas tu propio SSR

El autor es tajante:

> [!warning] El capítulo 6 termina con un aprendizaje
> Implementar SSR "a mano" parece educativo y, de hecho, lo es. Pero en producción es un agujero de edge cases: caching por usuario, data-fetching cancelable, partial hydration, streaming de CSS, errores, reintentos, modo estricto… los frameworks resuelven esto porque **es la clase de problema donde los errores humanos son catastróficos**. El ejemplo del `cachedUserData` global que devuelve datos de cliente A a cliente B es exactamente el tipo de bug que se filtra a producción y se arregla con auditorías de seguridad. Si tienes acceso a un servidor, usa Next.js o Remix. Si no, *static site generation*.

```jsx title="Equivalente con Remix (loader + UI colocalizados)"
// routes/posts/$postId.tsx
import { useParams } from "react-router-dom";
import { useLoaderData } from "@remix-run/react";

export function loader({ params }) {
  return fetchPost(params.postId);   // se ejecuta en el servidor
}

function Post() {
  const { postId } = useParams();
  const post = useLoaderData();
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}
```

El ejemplo opone *cargar data en el cliente* con `useEffect` + `fetch` vs *loader del framework*. La ganancia es doble: **TTFB más rápido** y **bug imposible de cross-user cache** por construcción.

## Resumen del capítulo

| Decisión | Implicación |
|----------|------------|
| Cliente puro | No SSR. SEO malo, TTFB lento, riesgo CSRF. |
| `renderToString` | Bloqueante, sin streaming, sin Suspense. Aceptable solo en static pre-render. |
| `renderToPipeableStream` (Node) o `renderToReadableStream` (Web) | Soportan `Suspense`, streaming nativo del HTML, partial hydration si el resto lo permite. |
| Hidratación | Reusa el DOM del servidor. Cuidado con los hydration mismatches. |
| Resumability | Alternativa a hidratación (Qwik, Marko). Debate abierto. |
| **En producción** | Confía en Next.js, Remix, Gatsby o TanStack Start. No roces tu propio SSR. |

## Próximos pasos

SSR destapa el problema de "el shell se ve, pero los datos no están". Resolver ese *coordination gap* es la motivación de [[08-react-concurrente]].
