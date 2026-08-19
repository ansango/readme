---
title: "Frameworks : Remix y Next.js como referencia de problemas que React no resuelve solo"
description: "Por qué React necesita un framework: SSR, routing y data fetching. Construcción incremental de un mini-framework, Remix (loaders, actions, forms) vs Next.js (App Router, server components, server actions, useFormStatus)"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, frameworks, nextjs, remix, ssr, routing, data]
---

# Frameworks

> [!abstract] Resumen
> React es una librería, no un framework. Te da el modelo de componentes, el virtual DOM, JSX, hooks, concurrencia y SSR — pero no te dice cómo se organiza tu proyecto, cómo se enrutan las URLs, ni cómo se cargan los datos antes del render. Esos tres problemas — **server rendering**, **routing**, **data fetching** — son lo que un *React framework* resuelve. El capítulo arma un mini-framework casero para mostrar el mecanismo (Express + filesystem routing + `getData`), lo compara con **Remix** (`loaders`, `action`, forms HTML) y con **Next.js 14+** (App Router, server components, server actions, `"use server"`), y cierra con una guía de elección basada en trade-offs reales, no en modas.

## React no es suficiente (a escala)

React nos da componentes, virtual DOM, hooks, Fiber, SSR... y nada más. Cuando tu aplicación deja de ser un toy, tropiezas con tres problemas recurrentes:

1. **Server rendering real**: cómo construir el HTML antes de mandarlo al cliente y luego hidratar.
2. **Routing**: cómo `/users/42` se traduce en una jerarquía de componentes.
3. **Data fetching sin waterfall**: cómo pedir los datos tan pronto como sea posible y, sobre todo, en paralelo al HTML.

Esos problemas son ortogonales a React: ninguna versión de `react` y `react-dom` los resuelve por sí sola. De ahí nacen los frameworks.

## Construir un framework mínimo, paso a paso

El libro arranca con una SPA cliente-only y le va añadiendo los tres ingredientes uno a uno, hasta entender qué aporta cada framework.

### 1. Server rendering manual

Una página con `useEffect` + `fetch(...)` es client-only. Para SSR manual, montas Express y reusas `renderToString`:

```js title="server.js — Server rendering manual"
import express from "express";
import { renderToString } from "react-dom/server";
import { List } from "./List";
import { Detail } from "./Detail";

const app = express();
app.use(express.static("./dist"));

const layout = (children) => `<html><body>${children}<script src="/clientBundle.js"></script></body></html>`;

app.get("/",        (req, res) => res.end(layout(renderToString(<List />))));
app.get("/detail",  (req, res) => res.end(layout(renderToString(<Detail thingId={req.params.thingId} />))));

app.listen(3000);
```

> [!warning] Problema
> Cada nueva ruta exige un `app.get` adicional. Esto no escala.

### 2. Filesystem-based routing

La convención: cualquier archivo en `./pages` es una ruta, exportada como default. El servidor importa dinámicamente la página correspondiente:

```text
   pages/
   ├── list.js
   └── detail.js    →   GET /detail     →   import("./pages/detail").default
```

```js title="server.js — routing escalable"
app.get("/:route", async (req, res) => {
  const { default: Page } = await import(join(process.cwd(), "pages", req.params.route));
  res.end(layout(renderToString(<Page {...req.query} />)));
});
```

> [!note] Trade-off
> El filesystem routing nos obliga a que las páginas sean **default exports** — ya no hay nombres. A cambio, el servidor escala sin tocar código.

### 3. Data fetching integrada

Pasa los datos como props a la página:

```jsx title="./pages/list.jsx"
export const getData = async () => ({
  props: {
    initialThings: await fetch("https://api.com/get-list").then(r => r.json()),
  },
});

export default function List({ initialThings }) {
  const [things, setThings] = useState(initialThings);
  // ... (useEffect solo si el primer render no traía datos)
  return <ul>{things.map(t => <li key={t.id}>{t.label}</li>)}</ul>;
}
```

```js title="server.js — fetch + render"
app.get("/:route", async (req, res) => {
  const exportedStuff = await import(join(process.cwd(), "pages", req.params.route));
  const Page = exportedStuff.default;
  const data = await exportedStuff.getData();          // ← data primero
  res.end(layout(renderToString(<Page {...req.query} {...data.props} />)));
});
```

Esa es exactamente la mecánica que están usando frameworks como Next.js pages router con `getServerSideProps`/`getStaticProps`. Una vez que entiendes la mecánica, las convenciones dejan de sentirse arbitrarias.

## Beneficios y trade-offs de usar un framework

### Beneficios

| Beneficio | Por qué importa |
|-----------|-----------------|
| **Estructura y consistencia** | Estructura fija para todo el equipo; menos decisiones que tomar. |
| **Best practices baked-in** | Data fetching temprano, SSR por defecto, code splitting automático. |
| **Abstracciones** | Routing, data loading, etc. — sin reinventar la rueda. |
| **Optimizaciones de performance** | Code splitting, prefetch on hover, image optimization. |
| **Comunidad y ecosistema** | Soluciones a problemas comunes ya resueltos. |

### Trade-offs

| Trade-off | Implicación |
|-----------|-------------|
| **Curva de aprendizaje** | Convenciones, APIs y filosofía propias. |
| **Convenciones vs flexibilidad** | Si tu caso rompe el modelo del framework, lo peleas. |
| **Compromiso a largo plazo** | Cambiar de framework es costoso. |
| **Overhead de abstracción** | Magia que puede opacar el debug de performance. |

El balance:

> [!quote] El dilema
> "Todo trade-off de frameworks se reduce a **conveniencia vs control**. Los frameworks sacrifican flexibilidad para darte productividad. Si esa productividad compensa el control perdido depende de tu proyecto y de tu equipo."

## Remix: web fundamentals + React

Remix parte de una filosofía clara: **apoyarse en la plataforma web** (formularios HTML, fetch API, `request`/`Response`, etc.) en lugar de reinventarla con JavaScript.

### Anatomía de un proyecto Remix

```text
   app/
   ├── entry.client.tsx
   ├── entry.server.tsx
   ├── root.tsx
   └── routes/
       └── cheese.tsx
```

`entry.server.tsx` viene preconfigurado con `renderToPipeableStream` y separa bots de humanos para devolver HTML completo a los crawlers y streaming a los usuarios.

### Loaders: data fetching por ruta

```jsx title="app/routes/cheese.tsx"
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  const data = await fetch("https://api.com/get-cheeses");
  return json(await data.json());
}

export default function CheesePage() {
  const cheeses = useLoaderData();
  return (
    <div>
      <h1>Cheese</h1>
      <ul>{cheeses.map(c => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  );
}
```

`loader` corre en el servidor para cada request; el componente lee el resultado con `useLoaderData`. Es exactamente lo que nuestro `getData` casero hacía, pero con tipos, compresión, error boundaries y prefetching incluidos.

### Actions: mutaciones con `<form>` HTML

```jsx title="app/routes/cheese.tsx"
import { json, redirect } from "@remix-run/node";

export async function action({ request }) {
  const formData = await request.formData();
  await fetch("https://api.com/add-cheese", {
    method: "POST",
    body: JSON.stringify({ name: formData.get("cheese") }),
  });
  return redirect("/cheese");
}

export default function CheesePage() {
  return (
    <>
      <h1>Cheese</h1>
      <form action="/cheese" method="post">
        <input type="text" name="cheese" />
        <button type="submit">Add Cheese</button>
      </form>
    </>
  );
}
```

Remix **progressive enhancement**: si el usuario tiene JS deshabilitado, el form HTML funciona igual (POST → action → redirect). Con JS, Remix intercepta la submission y la convierte en una transición de cliente sin recarga completa.

> [!note] Forma es plataforma
> El `action` no es una llamada AJAX ni un `onSubmit`: es la *misma* `<form action="/cheese" method="post">` que escribirías sin JS. Esa es la apuesta de Remix: si aprendes los básicos de la web, también sabes Remix.

## Next.js: server-first, hybrid rendering

A partir de la versión 13 con **App Router**, Next.js se vuelve server-first: **todos los componentes son server components por defecto**. El cliente entra con el prefijo `"use client"`.

### Routing por filesystem (otra vez, con esteroides)

```text
   app/
   ├── layout.tsx          ← Layout compartido
   ├── page.tsx            ← /
   └── cheese/
       ├── layout.tsx      ← Solo bajo /cheese
       └── page.tsx        ← /cheese
```

```jsx title="app/cheese/page.tsx"
export default function CheesePage() {
  return <h1>This might sound cheesy, but I think you're really grate!</h1>;
}
```

### Data fetching como `async` plano

```jsx title="app/cheese/page.tsx"
export default async function CheesePage() {
  const cheeses = await fetch("https://api.com/get-cheeses").then(r => r.json());
  return (
    <ul>{cheeses.map(c => <li key={c.id}>{c.name}</li>)}</ul>
  );
}
```

> [!success] Por qué importa
> Esto es exactamente lo que la gente llevaba años pidiendo. Un componente que es `async`, que `await`-a sus datos, que se renderiza en el servidor y desaparece del bundle. Cero waterfalls, cero `useEffect` tratando de imitar esto.

Y no se limita a la página: cualquier componente de servidor puede `await` su propio data.

### Server actions: mutaciones en servidor

```jsx title="app/cheese/page.tsx"
"use client";   // o no — se puede definir inline
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addCheeseAction(formData) {
  "use server";
  await fetch("https://api.com/add-cheese", {
    method: "POST",
    body: JSON.stringify({ name: formData.get("cheese") }),
  });
  revalidatePath("/cheese");
  return redirect("/cheese");
}
```

```jsx title="app/AddCheeseForm.tsx"
"use client";
import { useFormStatus } from "react-dom";
import { addCheeseAction } from "./actions";

export function AddCheeseForm() {
  const { pending } = useFormStatus();
  return (
    <form action={addCheeseAction} method="post">
      <input disabled={pending} type="text" name="cheese" />
      <button type="submit" disabled={pending}>
        {pending ? "Loading…" : "Add Cheese"}
      </button>
    </form>
  );
}
```

**`useFormStatus`** viene de `react-dom` y expone el estado de la `<form>` (pendiente, data, método) a los hijos. Es el equivalente al `isPending` de `useTransition` para formularios que se procesan en server actions.

## Cómo elegir

El libro resume el trade-off en una tabla:

| Dimensión | Next.js | Remix |
|-----------|---------|-------|
| **Filosofía** | Server-first, opinated, primera línea de adopción de React canary | Web fundamentals, menos magia, controles sobre la plataforma |
| **Curva de aprendizaje** | Curva alta al entrar (App Router, RSC, server actions, cache modes...) | Curva más baja: parecido a React Router + web APIs |
| **Flexibilidad** | Estático, SSR o cliente-only por página | Server-rendered por defecto, muy cercano a la plataforma |
| **Performance** | 4 caches especializadas, static-first | Streaming-first, cache API nativo |
| **Riesgo** | Migrar cuesta (ISRs, edges, lambda-size) y la magia puede opacar | Migrar es más llevadero porque las primitivas son más estándar |

> [!tip] Reglas de dedo
> - *Más flexibilidad* + ecosistema maduro + integra cualquier backend → **Next.js**.
> - *Web fundamentals* + progressive enhancement + control fino del runtime → **Remix**.
> - Cuando dudes, prueba uno en un proyecto pequeño. La mejor elección a largo plazo es la que tu equipo adopta con confianza.

## Performance: build y runtime

| Métrica | Next.js | Remix |
|---------|---------|-------|
| **Build time** | Static-first por defecto → builds largos con miles de páginas; ISR mitiga esto. | Server-first: builds más cortos; las páginas se renderizan bajo demanda. |
| **Code splitting** | Automático por página; prefetch on hover. | Automático por ruta; manifests + lazy routes. |
| **Runtime TTFB** | SSG/ISR para contenido cacheable, streaming SSR para dinámico. | Streaming SSR por defecto; cache API integrado. |
| **JS shipped** | Mínimo gracias a server components (sin RSC = sin JS de un componente). | Toda la interactividad pasa por cliente, pero la cantidad total es comparable. |

## Resumen del capítulo

- React te da **la librería**. El framework te da **el proyecto**: cómo arranca, cómo enruta, cómo carga datos, cómo se conecta con el servidor.
- Los tres problemas clásicos (SSR, routing, data fetching) se pueden resolver a mano con ~100 líneas de Express + filesystem routing + `getData`. **Eso no significa que debas hacerlo**: los frameworks cubren edge cases que escala sola no cubre.
- Remix apuesta por forms HTML y funciones `loader`/`action` separadas del componente. Next.js App Router apuesta por server components con `await` y server actions con `"use server"`.
- Ninguno es *mejor*; son filosofías distintas sobre **dónde corre el código** y **cuánto te apoyas en la plataforma web**.

## Próximos pasos

Next.js abre la caja de Pandora de RSC. Veremos exactamente qué son, qué reglas tienen y cómo cambian el modelo mental en [[10-server-components-y-server-actions]].
