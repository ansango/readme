---
title: "Server Components y Server Actions : la arquitectura RSC"
description: "React Server Components (RSC): cómo se renderizan en servidor, serialización JSON de React elements, module references, navegación suave (soft navigation) con jsx-only, reglas (serialización, hooks, estado), Server Actions con use server"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, rsc, server-components, server-actions, use-server, bundler]
---

# Server Components y Server Actions

> [!abstract] Resumen
> **React Server Components (RSC)** introduce un tercer modo de ejecutar componentes: en el servidor, **una sola vez** y **excluido del bundle** del cliente. Combinado con `Suspense` y streaming, traen MPA *tan rápido* como SPA *tan interactivo*. El capítulo recorre el mecanismo — un *renderer* asíncrono que `await` cada server component, serializa el árbol a JSON, lo envía al cliente y rellena los huecos donde hay `client components` vía *module references*. Cierra con **Server Actions**, `"use server"` como nueva frontera servidor↔cliente, y las reglas (no interactivo, no estado mutable, no hooks effectful, no se importan desde clientes) que dan forma al modelo.

## La motivación: el problema de "todo en el bundle"

En las SPAs cada componente, sea un `<Tooltip>` que usa `useState` o un `<ArticleBody>` que solo pinta markdown, termina en el bundle de cliente. La consecuencia para tu `<ArticleBody>`: baja a un usuario que solo quiere leer, pero se paga el costo de descargar, parsear y ejecutar JS que nunca interactuará.

**RSC** parte de una idea simple: si un componente no necesita interactividad, no debería enviarse al cliente. La única manera de que React lo decida de forma fiable es **ejecutarlo en el servidor** y *solo* enviar al cliente un placeholder (un *module reference*) si encuentra un componente interactivo en el árbol.

## Qué es un server component y qué no

Un server component es exactamente lo que parece: un componente React que se evalúa solo en el servidor. Su valor es:

- Computación fuera del navegador (latencia predecible, sin "RAM de un Nokia 2.1").
- Acceso a recursos del servidor: `node:fs`, secretos, bases de datos, cache HTML.
- `async` sin fricción — `await` en render es legal y se serializa al árbol.

```jsx title="Lo que NO puede hacer un server component"
function Counter() {
  const [count, setCount] = useState(0);     // ❌ useState solo en cliente
  return (
    <button onClick={() => setCount(count + 1)}>{count}</button>
                                                  // ❌ onClick no se serializa
  );
}

function ServerOnlyGreeting({ name }) {
  return <h1>Hello, {name.toUpperCase()}</h1>;  // ✅ solo pinta texto
}
```

> [!danger] Estado ≠ estado
> Estado "del servidor" es broadcast a muchos clientes. Estado "del cliente" es unicast al navegador. Confundirlos abre fugas cross-tenant. Por eso `useState` no existe en server components.

## Under the hood: cómo se renderiza un server component

El libro propone un *renderer* asíncrono minimalista para explicar la mecánica. Vamos a destriparlo:

```js title="turnServerComponentsIntoTreeOfElements (esqueleto)"
async function renderJSXToClientJSX(jsx) {
  if (typeof jsx === "string" || typeof jsx === "number" /*...*/) return jsx;
  if (Array.isArray(jsx)) return await Promise.all(jsx.map(renderJSXToClientJSX));

  if (jsx?.$$typeof === Symbol.for("react.element")) {
    if (typeof jsx.type === "string") {
      // Host components: replicar tal cual
      return { ...jsx, props: await renderJSXToClientJSX(jsx.props) };
    }
    if (typeof jsx.type === "function") {
      // Custom component: lo invocamos (aqui es donde await es válido)
      const returnedJsx = await jsx.type(jsx.props);
      return await renderJSXToClientJSX(returnedJsx);
    }
  }
  // Objeto plano: recursar en cada key
  return Object.fromEntries(
    await Promise.all(
      Object.entries(jsx).map(([k, v]) => [k, await renderJSXToClientJSX(v)])
    )
  );
}
```

```text
   <App />
       │
       ▼
   JSX ──► turnServerComponentsIntoTreeOfElements ──► Árbol de React elements
       │                                                          │
       ▼                                                          ▼
   renderToString / renderToPipeableStream                Serialización JSON
                                                                  │
                                                                  ▼
                                                           Wire format (JSON)
                                                                  │
                                                                  ▼
                                                            hydrateRoot / root.render
```

```js
const rscTree = await turnServerComponentsIntoTreeOfElements(<App />);
const html = ReactDOMServer.renderToPipeableStream(rscTree);
```

El **`await` en el render** es lo que lo hace diferente de SSR clásico: el render no termina hasta que cada `await fetch(...)` se resuelve. Combinado con `Suspense`, los placeholders se rellenan en cuanto sus dependencias están listas.

## Serialización: el wire format

Los React elements no son JSON-friendly: usan `Symbol.for('react.element')` como `$$typeof`, y los símbolos no se serializan. Solución: un `replacer` en `JSON.stringify` los convierte a un literal serializable; un `replacer` en `JSON.parse` los restaura al símbolo en cliente.

```js title="Servidor: serializar"
const wire = JSON.stringify(rscTree, (key, value) => {
  if (key === "$$typeof") return "react.element";   // string, no Symbol
  return value;
});
```

```js title="Cliente: deserializar"
const element = JSON.parse(wire, (key, value) => {
  if (key === "$$typeof") return Symbol.for("react.element"); // símbolo otra vez
  return value;
});
```

> [!tip] Función trivial, payoff enorme
> Esta ida-y-vuelta permite enviar un árbol completo por la red (incluyendo valores de props que son arrays, objetos anidados, fechas, etc.) sin reimplementar un protocolo.

## Module references: cómo el cliente rellena los huecos

El árbol serializado que sale del servidor **no** incluye el código de los client components. En su lugar, deja un *module reference* que el bundle resuelve en cliente.

```js title="Huecos en el árbol serializado"
{
  $$typeof: Symbol(react.element),
  type: "div",
  props: {
    children: [
      { type: "h1", props: { children: "Hello friends…" } },
      {
        $$typeof: Symbol(react.element),
        type: {
          $$typeof: Symbol(react.module.reference),
          name: "default",
          filename: "./src/InteractiveClientPart.js"
        },
        props: { children: "..." }
      }
    ]
  }
}
```

> [!note] ¿Quién produce esto?
> El **bundler**. Lee `"use client"` y construye dos module graphs separados: uno para servidor (que nunca sale al cliente), otro para cliente. Frameworks como Next.js App Router lo hacen por ti; en React puro el bundler tiene que ser de nueva generación.

Llega al cliente, React ve un module reference, lo busca en el bundle y reemplaza el placeholder por el módulo real para que se monte, hidrate y ejecute. Mientras tanto, el resto del árbol — incluyendo los hijos *server* del client component — ya está pintado y es interactivo a nivel DOM.

## Navegación: SPAs sin perder el modelo RSC

```jsx title="Soft navigation: un <a> que no recarga la página"
window.addEventListener("click", (event) => {
  if (event.target.tagName !== "A") return;
  event.preventDefault();
  navigate(event.target.href);
});

async function navigate(url) {
  const response = await fetch(url, { headers: { "jsx-only": "true" } });
  const wire = await response.text();
  const element = JSON.parse(wire, (key, value) =>
    key === "$$typeof" ? Symbol.for("react.element") : value);
  root.render(element);                        // reusa el root tras hidratación
}
```

```js title="Servidor: responder a la navegación soft"
app.get("*", async (req, res) => {
  const rscTree = await turnServerComponentsIntoTreeOfElements(<App url={req.url} />);
  if (req.headers["jsx-only"]) {
    return res.end(JSON.stringify(rscTree, jsxOnlyReplacer));
  }
  // ... camino clásico: renderToPipeableStream + HTML completo
});
```

Event delegation a `window` para no atar un listener por link. Fetch con header `jsx-only` para pedir solo el árbol. JSON como wire format. `root.render(element)` reusa el root existente y reemplaza el árbol.

> [!tip] Por qué funciona
> El cliente ya está hidratado: el `hydrateRoot` inicial creó un `FiberRoot`. Cada navegación llama `root.render(element)` con un árbol nuevo, exactamente como en CSR. Sin recargar la página, sin perder el estado visual.

## Reglas que el modelo impone

| Regla | Por qué |
|-------|--------|
| **Serialización obligatoria de props** | Las props cruzan la frontera servidor→cliente. Funciones y Symbol no sobreviven `JSON.stringify`. El render props pattern *muere* aquí. |
| **No hooks effectful** | El servidor no tiene DOM, no tiene window. `useState`/`useReducer`/`useEffect`/`useRef` no tienen significado en el render del servidor. (Algunos hooks "puros" como `useId` se siguen usando en server.) |
| **State ≠ state** | Estado de servidor es *broadcast* a muchos clientes. Filtrarlo es una fuga de seguridad. |
| **Client components NO pueden importar Server components** | Si el bundler lo permitiera, el `import` de un server component terminaría arrastrando `node:fs` u otro código no-runtime al bundle. Solución: composición vía `children` o props. |
| **Server components envuelven a client components, no al revés** | El servidor renderiza el árbol completo y deja huecos. El cliente rellena esos huecos. |

### Composición cross-boundary

```jsx title="Padre servidor + hijo cliente + nieto servidor"
import { ClientWrapper } from "./ClientWrapper";    // "use client" en su archivo
import { ServerCard }    from "./ServerCard";       // server component

export default async function Page() {
  const user = await fetchUser();                    // solo en servidor
  return (
    <ClientWrapper>
      <ServerCard user={user} />                    // server -> client -> server solo via JSX children
    </ClientWrapper>
  );
}
```

El truco es que el bundler **no ve** la importación de `ServerCard` desde un client component — solo la ve en `Page.tsx`, que es server. La composición es por *JSX*, no por import.

## Server Actions: `"use server"`

Las **Server Actions** son funciones *puras* que viven en el servidor pero se invocan desde el cliente. Marcarlas con `"use server"` las identifica al bundler; las convierte en endpoints auto-generados que el cliente puede llamar como si fueran funciones locales.

```js title="Top of file: marca todas las exports"
"use server";
export async function addCheeseAction(formData) {
  await fetch("https://api.com/add-cheese", {
    method: "POST",
    body: JSON.stringify({ name: formData.get("cheese") }),
  });
  revalidatePath("/cheese");
  return redirect("/cheese");
}
```

```jsx title="Top of function: solo esa función"
async function requestUsername(formData) {
  "use server";
  const username = formData.get("username");
  // ...
}

export default function App() {
  return (
    <form action={requestUsername}>
      <input type="text" name="username" />
      <button type="submit">Request</button>
    </form>
  );
}
```

> [!success] Progressive enhancement
> Si JS está deshabilitado, `<form action={requestUsername}>` se degrada a un POST HTML normal contra el endpoint que el bundler generó. Es lo que ya vimos en Remix/Next.js; RSC lo lleva al núcleo del runtime de React.

Fuera de un `<form>`, se llama dentro de una `useTransition` para tener feedback y errores manejados:

```jsx title="Like button con transition + server action"
"use client";
import { useState, useTransition } from "react";
import { incrementLike } from "./actions";

function LikeButton() {
  const [isPending, startTransition] = useTransition();
  const [likes, setLikes] = useState(0);

  const onClick = () => {
    startTransition(async () => {
      const current = await incrementLike();
      setLikes(current);
    });
  };

  return (
    <>
      <p>Total Likes: {likes}</p>
      <button onClick={onClick} disabled={isPending}>Like</button>
    </>
  );
}
```

```js title="actions.js"
"use server";
let count = 0;
export async function incrementLike() { return ++count; }
```

## Nuance: client components sí ejecutan en el servidor

Confunde a mucha gente: los **client components se ejecutan dos veces** — una en el servidor (para producir el HTML inicial) y otra en el cliente (para hidratarlos). Lo que *no* hace el cliente es ejecutar **server components**: ese código nunca llega al bundle del cliente.

```text
   Server components →  ejecutan en servidor (1 vez) → JSON
   Client components →  ejecutan en servidor (HTML) → luego hidratan en cliente
                        ↑
                        ambos generan React elements
                        en servidor durante SSR
```

## El futuro: bundlers de nueva generación

RSC exige que el bundler entienda la directiva `"use client"` para producir **dos module graphs**:

```text
   server graph   →  módulo que ejecuta solo en servidor
   client graph   →  módulo que llega al navegador, con refs a huecos
```

Webpack, Rollup, esbuild, Vite, Turbopack y Rsbuild están añadiendo soporte. Los frameworks actuales (Next.js App Router, Redwood, Waku) lo llevan empaquetado. **React puro + RSC sin framework es viable pero ruidoso**, así que en producción conviene apoyarse en uno.

## Resumen del capítulo

- **RSC** = componentes que se ejecutan **una vez** en el servidor, **excluidos del bundle** del cliente, y dejan *module references* en el árbol serializado para que el navegador rellene los huecos donde hay interactividad.
- La **serialización JSON con replacer** convierte `Symbol(react.element)` en un string y viceversa: es el wire format mínimo para mover un árbol React por la red.
- **Reglas**: props serializables, sin hooks effectful en server, sin importar server components desde client components, sin estado mutable.
- **Server Actions** = funciones marcadas con `"use server"` que el cliente llama como si fueran locales, pero que se ejecutan en el servidor. Encajan naturalmente con `<form action>` para progressive enhancement y con `useTransition` para feedback fuera de formularios.

## Próximos pasos

RSC ha cambiado qué se ejecuta dónde. Ahora el turno de mirar **quién decide qué** en el resto del ecosistema: en [[11-alternativas-a-react]] Vue, Angular, Solid, Qwik y Svelte ponen sobre la mesa otro modelo: las **signals** y la reactividad de granularidad fina.
