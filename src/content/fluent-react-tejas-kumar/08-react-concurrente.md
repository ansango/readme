---
title: "React concurrente : scheduler, render lanes, useTransition, useDeferredValue, useSyncExternalStore"
description: "Cómo funciona React 18 concurrent: el scheduler basado en microtasks, render lanes como bitmask de prioridad, useTransition y startTransition, useDeferredValue como stale-while-revalidate, tearing y useSyncExternalStore"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, concurrente, useTransition, useDeferredValue, useSyncExternalStore, fiber]
---

# React concurrente

> [!abstract] Resumen
> Antes de React 18 todo render era síncrono: la cascada de renders se ejecutaba en orden de llegada, sin prioridades ni posibilidad de pausar. **React concurrente** lo cambia: el scheduler organiza microtasks, las **render lanes** clasifican las actualizaciones por prioridad y el Fiber reconciler cede el hilo cada ≈5 ms entre tareas. Como resultado, un click urgente puede interrumpir un render caro sin parpadeo. El capítulo aterriza la teoría en los hooks que el desarrollador toca: **`useTransition`** para diferir actualizaciones no urgentes, **`useDeferredValue`** para mantener valores stale mientras se computa el nuevo, y **`useSyncExternalStore`** como antídoto a *tearing* cuando se lee de fuentes externas durante un render interrumpible.

## El problema con el render síncrono

Síncrono significa: "yo pinto este componente, termino, paso al siguiente, termino". Si hay un componente caro (*ExpensiveComponent*) por delante en el árbol, el usuario notará input lag: el `onChange` se ejecuta, pero React no llega al `setState` que pinta el nuevo valor del `<input>` porque sigue con la cascada previa.

> [!note] Síncrono no es todo malo
> El render síncrono es *simple* y *determinista* — siempre ves el mismo snapshot del estado para todo el árbol. Esa propiedad la rompe la concurrencia, y por eso existen mecanismos como `useSyncExternalStore` para recuperarla cuando importa.

Batching mitiga parte del problema pero **no lo resuelve**: agrupas diez `setCount` en uno, sigues sin tener prioridades, y un `setSearchQuery` sigue siendo capaz de tragarse el `setInputValue` del campo.

## El scheduler: poner prioridades donde React las necesita

Cuando una actualización entra al scheduler, este decide:

```js
if (nextLane === Sync) {
  queueMicrotask(processNextLane);              // inmediata
} else {
  Scheduler.scheduleCallback(callback, processNextLane);
}
```

```text
   ┌─────────────────────┐
   │     Event loop      │
   └─────────────────────┘
              │
   ┌──────────┴──────────┐
   ▼                     ▼
┌─────────┐         ┌─────────────┐
│  Task   │         │  Microtask  │
│ (macros)│         │ queue       │
└─────────┘         └─────────────┘
   setTimeout, I/O   promises, queueMicrotask
```

`ensureRootIsScheduled(root)` se ejecuta cuando un root recibe una actualización:

1. Añade el root a una lista global de roots pendientes.
2. Marca `mightHavePendingSyncWork = true` para que `flushSync` lo respete.
3. Encola una microtask (`scheduleImmediateTask(processRootScheduleInMicrotask)`) si todavía no hay una.
4. Si no estamos en `act()` (modo test) y el flag `enableDeferRootSchedulingToMicrotask` está deshabilitado, agenda la tarea de render directamente.

> [!tip] Microtasks vs macrotasks
> Las microtasks se procesan **antes** de la próxima macrotask. Eso permite a React priorizar su trabajo sobre eventos del navegador sin anidar `setTimeout`. Si una microtask encola más microtasks, se llega a *starvation* — el event loop nunca descansa. Por eso el scheduler cede cada ≈5 ms.

## Render lanes: el corazón de la concurrencia

Reemplazan al antiguo concepto de `renderExpirationTime`. Cada actualización se asigna a un **lane**, un bit de un bitmask que codifica su prioridad. El bitmask permite operar con varias lanes a la vez (entrelazado, rebase, etc.).

| Lane | Cuándo se usa |
|------|---------------|
| `SyncLane` | Clicks, eventos discretos del usuario. |
| `SyncHydrationLane` | Clicks durante hidratación. |
| `InputContinuousLane` | Hovers, scroll, eventos continuos *después* de hidratar. |
| `InputContinuousHydrationLane` | Hovers, scroll durante hidratación. |
| `DefaultLane` | `setTimeout`, respuestas de red, primer render. |
| `TransitionHydrationLane` | `startTransition` durante hidratación. |
| `TransitionLanes` (1-15) | `startTransition` post-hidratación. |
| `RetryLanes` (1-4) | Reintentos de Suspense. |

```js title="Cómo se prioriza una actualización"
socket.onmessage = (e) => {
  startTransition(() => {
    setMessages(prev => [...prev, e.data]);   // → TransitionLanes (baja prioridad)
  });
};

<button onClick={() => setCount(c => c + 1)}>   // → SyncLane (alta prioridad)
```

> [!danger] Los nombres importan menos que el concepto
> El capítulo insiste: estas lanes son detalle de implementación, seguramente cambiarán. Lo que importa es que **React asigna prioridades automáticamente** y que tú puedes *override* con `useTransition` o `useDeferredValue`.

### Flujo de procesamiento

```text
1. Collect     →  agrupa updates del último render en sus lanes
2. Process     →  itera lanes de mayor a menor prioridad
                  updates del mismo lane se batchean
3. Commit      →  fase síncrona: aplica al DOM, corre effects
4. Repeat
```

Conceptos avanzados que el libro menciona sin enterrarse: **entanglement** (dos lanes que deben procesarse juntas, p. ej. cuando una transición termina en un update síncrono) y **rebasing** (reordenar updates cuando una transición es interrumpida por algo más urgente).

## `useTransition` y `startTransition`

`useTransition` devuelve `[isPending, startTransition]`. Cualquier actualización envuelta en `startTransition` se procesa en una *transition lane* — más baja que SyncLane — y React puede interrumpirla si llega algo urgente.

```jsx
const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const socket = new WebSocket("wss://your-server.com");
    socket.onmessage = (e) => {
      startTransition(() => {                                // ← baja prioridad
        setMessages(prev => [...prev, e.data]);
      });
    };
    return () => socket.close();
  }, []);

  return (
    <div>
      <MessageList messages={messages} />
      {isPending && <small>Rendering…</small>}
      <MessageInput onSubmit={sendMessage} />
    </div>
  );
};
```

`isPending` se actualiza vía `setState` síncrono *inmediatamente* después de empezar una transición, así que es seguro leerlo para mostrar feedback.

### Tres formas de usarlo

| API | Caso |
|-----|------|
| `useTransition()` | Dentro de un componente: queremos `isPending`. |
| `startTransition()` importado de `"react"` | Fuera de componentes (event handlers globales, librerías). Sin `isPending`. |
| `startTransition(callback, options)` (React 19) | Permite marcar la transición como *sync* con `async_hooks` para errores. |

### Navegación entre páginas con Suspense

```jsx
function App() {
  const [page, setPage] = useState("pageOne");
  const [isPending, startTransition] = useTransition();

  const goTo = (p) => startTransition(() => setPage(p));

  return (
    <>
      {isPending && <p>Loading…</p>}
      {page === "pageOne" ? <PageOne /> : <PageTwo />}
    </>
  );
}
```

Aquí el truco no es "ir más lento" sino **atar `isPending` a Suspense**: si la siguiente página suspende (data fetch en servidor), React mantiene `isPending=true` hasta que los datos llegan y el árbol está listo.

> [!warning] Cuidado con lo que *no* se difiere
> `startTransition` solo difiere lo que cambia dentro de su closure. Si un effect en el componente hijo dispara una petición `fetch`, esa petición *no* espera a la transición. Para amarrar data fetching a transición necesitas frameworks como Next.js que usan `useFormState`/`useActionState` o Remix con `defer()`.

## `useDeferredValue`: stale-while-revalidate puro

`useDeferredValue(value)` devuelve un valor que *retrasa su actualización* cuando `value` cambia. Equivale conceptualmente a `useTransition` aplicado al valor:

```jsx
function Search() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);   // "se actualiza cuando pueda"

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <SearchResults query={deferredQuery} />     {/* recibe el valor deferido */}
    </>
  );
}

const SearchResults = memo(({ query }) => { /* ... costoso ... */ });
```

### Comportamiento dinámico

`useDeferredValue` **no impone un delay fijo**. Adapta la espera a la capacidad del dispositivo:

- En un Mac M3: la lista puede rerender casi sin pausa.
- En un Android de gama baja: se retrasa lo justo para que el `<input>` siga respondiendo.
- Si el usuario teclea otra letra mientras la lista está rerenderizando, **React interrumpe** el rerender de la lista, actualiza el input, y vuelve al rerender.

### vs. `debounce` / `throttle`

| Técnica | Comportamiento |
|---------|----------------|
| `debounce(query, 250)` | Espera 250 ms de silencio. Mala para listas donde cada tecla dispara trabajo. |
| `throttle(query, 250)` | Rerenderiza al menos una vez cada 250 ms. Constante, no interrumpe. |
| `useDeferredValue(query)` | Sin delay fijo; se adapta a la carga del dispositivo y **puede interrumpirse**. |

> [!tip] Cuándo **no** usarlo
> Si la actualización es resultado de input directo, no la diferirías: `useDeferredValue` está pensado para *consecuencias* de un input, no para el input en sí. El libro lo resume: *"si la cosa que cambia es respuesta directa a algo que el usuario acaba de hacer, ponla en SyncLane. Todo lo demás, mira a ver si vale la pena diferirlo."*

## Tearing y `useSyncExternalStore`

La concurrencia tiene un tradeoff incómodo: si un componente lee un valor mientras se está rerenderizando y ese valor cambia *a mitad del render*, varios componentes pueden ver valores distintos del mismo estado. Esto es **tearing**.

```jsx title="Componente que rompe con tearing"
let count = 0;
setInterval(() => count++, 1);   // mutación externa al render

const ExpensiveComponent = () => {
  const now = performance.now();
  while (performance.now() - now < 100) { /* bloquear 100ms */ }
  return <>Expensive count is {count}</>;   // lee la variable global
};
```

Al pintar cinco `ExpensiveComponent`, React los interrumpe para responder al typing del input. Cuatro podrían leer `count = 568`, uno `count = 570`. La UI es internamente inconsistente.

### Cómo lo arregla `useSyncExternalStore`

```jsx title="Snapshot consistente desde fuente externa"
const store = {
  subscribe(forceSyncRerender) {
    setInterval(() => forceSyncRerender(), 1);
    return () => clearInterval(interval);
  },
  getSnapshot() { return count; },
};

const ExpensiveComponent = () => {
  const consistentCount = useSyncExternalStore(store.subscribe, store.getSnapshot);
  // ... dibuja consistentCount ...
};
```

| Argumento | Responsabilidad |
|-----------|-----------------|
| `subscribe(callback)` | Registra el callback que React llamará cuando la fuente externa cambie. Devuelve función de cleanup. |
| `getSnapshot()` | Devuelve el valor **actual** de la fuente. Debe ser síncrona y pura. |

> [!note] Por qué funciona
> React garantiza que `getSnapshot()` se llama una sola vez *al principio* del commit y ese valor se pasa a todos los componentes que usen el hook en este commit. Aunque la fuente cambie entre tanto, todos ven el mismo snapshot. La palabra clave aquí es **sync** — el snapshot se hace en fase síncrona, fuera del render interrumpible.

Equivale al `getDerivedStateFromProps` que pedía un valor *antes* del commit, o al viejo patrón con `useEffect` + `useState`, solo que ahora el handshake entre source y React es declarativo y la inconsistencia imposible.

## Resumen del capítulo

| Concepto | Lo que hace |
|----------|-------------|
| **Scheduler** | Coordina cuándo corre cada lane; cede el main thread con microtasks. |
| **Render lanes** | Bitmask de prioridad: Sync, InputContinuous, Transition, Default, Retry. |
| **`useTransition`** | `[isPending, startTransition]` — diferir updates no urgentes. |
| **`startTransition()` standalone** | Igual sin `isPending`, para usar fuera de componentes. |
| **`useDeferredValue`** | Versión "valor" de `useTransition` — stale-while-revalidate dinámico. |
| **`useSyncExternalStore`** | Snapshot consistente desde fuentes externas; evita tearing. |

> [!quote] Regla de oro
> "Anything that causes a user to expect a reaction ought not be deferred. Everything else should be." En otras palabras: si tu update *es* la respuesta al input del usuario, va en Sync. Si tu update es *consecuencia* del input, mira a ver si se puede diferir.

## Próximos pasos

Toda esta base teórica converge en una pregunta práctica: **¿qué framework uso?**. Entramos en [[09-frameworks]].
