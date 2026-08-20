---
title: "Reconciliación : Fiber, render phase y commit phase"
description: "Cómo funciona la reconciliación de React: batching, del stack reconciler (legacy) al Fiber reconciler, nodos Fiber, double buffering, render phase (beginWork) y commit phase (mutation + layout)"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, fiber, reconciliacion, arquitectura]
---

# Reconciliación

> [!abstract] Resumen
> La reconciliación es el proceso por el que React convierte el árbol de React elements en cambios reales sobre el host (normalmente el navegador). Antes de React 16 era un **stack reconciler** sin prioridades ni posibilidad de interrupción. Hoy es el **Fiber reconciler**, basado en una estructura `Fiber` mutable con punteros `return`/`child`/`sibling`. La reconciliación moderna se divide en **render phase** (off-screen, interrumpible) y **commit phase** (síncrona, no interrumpible), con un modelo de *double buffering* entre el árbol *current* y el *work-in-progress* que se renderiza off-screen y se descarta si llega una actualización de mayor prioridad. Este capítulo es la pieza central del modelo interno de React y prepara el terreno para [[08-react-concurrente]].

## El recorrido: de JSX a un árbol *committed*

Volvamos al contador. Un componente `App` con `useState(0)` produce, al invocarse, un árbol de React elements inmutables:

```js
{
  type: "main",
  props: {
    children: {
      type: "div",
      props: {
        children: [
          { type: "h1",    props: { children: "Hello, world!" } },
          { type: "span",  props: { children: ["Count: ", count] } },
          { type: "button", props: { onClick: () => setCount(count + 1), children: "Increment" } }
        ]
      }
    }
  }
}
```

Como es el primer render, ese árbol se "commitea" al navegador con un mínimo de llamadas imperativas al DOM. La pregunta que abre el capítulo: **¿cómo decide React qué árbol nuevo comparar contra qué viejo, y cuándo aplicar los cambios?**

## Batching: una mutación, no tres

Cuando un *handler* dispara varias actualizaciones consecutivas, React las agrupa en un único batch en lugar de rerenderizar por cada `setState`:

```jsx
function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);   // un solo commit con count + 3
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}
```

React **forks** el árbol actual y construye un árbol *work-in-progress* con `count = 3`. La reconciliación calcula que el cambio real es 0 → 3 y emite **una sola** mutación sobre el text node. Esto reduce drásticamente los reflows y se complementa con la analogía del [[03-el-dom-virtual|document fragment]] del capítulo anterior.

## El problema que Fiber vino a resolver: el Stack Reconciler

Antes de React 16, el reconciler era un **stack-based algorithm**. Funcionaba mediante un único *stack* LIFO (*last-in, first-out*) que recorría el árbol de componentes de manera recursiva y **sin posibilidad de pausar**:

```text
  ┌─────────────┐
  │     3       │ ← push() más reciente, top of stack
  ├─────────────┤
  │     2       │
  ├─────────────┤
  │     1       │ ← primer push
  └─────────────┘
```

> [!warning] Tres limitaciones del stack reconciler
> 1. **Sin prioridad**: los renders se ejecutan en el orden en que se reciben. Un componente pesado puede *bloquear* la respuesta a un input urgente.
> 2. **Sin interrupción ni cancelación**: si empieza un render, termina. Una notificación de baja prioridad puede comerse el frame que necesitaría un click.
> 3. **Jank garantizado** en interacción input → rerender: si `ExpensiveComponent` corre antes que `<input>` se rerenderiza, el usuario ve el campo *lagged*.

Esa mezcla de problemas (jank, sin prioridad, sin pausa) es exactamente lo que Fiber viene a resolver: una *data structure* que permite *time slicing*, *priorities* y *bail-outs*.

## La estructura Fiber

Un **Fiber** es un *objeto mutable* que representa una unidad de trabajo dentro del reconciler. Se distingue de un React element en dos ejes: las Fibers son *stateful* y *long-lived*, mientras que los React elements son *ephemeral* y *stateless*.

```js
{
  tag: 3,                  // ClassComponent / FunctionComponent / HostComponent / Fragment ...
  type: App,               // componente o 'div' (host element)
  key: null,
  ref: null,
  props: { name: "Tejas", age: 30 },
  stateNode: AppInstance,  // instancia del componente (clase) o DOM node (host)
  return: FiberParent,     // puntero al padre (recorrido walk-up)
  child: FiberChild,       // primer hijo (recorrido walk-down)
  sibling: FiberSibling,   // siguiente hermano
  index: 0
}
```

> [!quote] Mark Erikson (mantenedor de Redux, contributor de Replay.io)
> "Fibers son la estructura interna de datos que representa el árbol de componentes actual de React en un punto dado en el tiempo."

Cada Fiber tiene su *gemelo* en el árbol *current* y su *gemelo* en el árbol *work-in-progress*. Esto habilita el **double buffering**.

## Double buffering: dibujar el siguiente frame fuera de pantalla

React aplica una técnica tomada de los gráficos por computador:

```text
1.  Buffer A está visible al usuario.
2.  El siguiente estado se renderiza en Buffer B (off-screen).
3.  Cuando B está listo, swap atómico: ahora B es el visible.
4.  El siguiente render prepara A, otra vez off-screen.
```

La consecuencia es enorme: **todo el trabajo del render phase ocurre en un árbol invisible**. Si mientras tanto llega una actualización de mayor prioridad, React puede *tirar* ese *work-in-progress* a la basura sin que el usuario vea nada raro. Es lo que permite que un input urgente pueda interrumpir un render costoso sin parpadeos.

## Las dos fases de la reconciliación

La reconciliación moderna se divide en **render phase** y **commit phase**, con responsabilidades muy distintas.

```text
  State change
      │
      ▼
  ┌────────────────────────┐
  │      Render phase       │  ← off-screen, interrumpible
  │  beginWork (downward)   │
  │  completeWork (upward)  │
  └─────────────┬──────────┘
                │ (cuando React decide que hay UI lista)
                ▼
  ┌────────────────────────┐
  │      Commit phase       │  ← síncrona, no interrumpible
  │   mutation phase        │
  │   layout phase          │
  └────────────────────────┘
```

### Render phase: beginWork + completeWork

**`beginWork(current, workInProgress, renderLanes)`** recorre el árbol *work-in-progress* de arriba abajo. Para cada Fiber compara con su gemelo en `current`, marca flags de actualización y baja al siguiente Fiber. Si termina y encuentra trabajo pendiente, **cede el hilo al navegador cada ≈5 ms** — gracias a eso el render se siente interrumpible incluso en displays de 120 fps.

**`completeWork(current, workInProgress, renderLanes)`** sube el árbol construyendo un **árbol real de DOM nodes *desconectado del navegador***. Es decir, hace `document.createElement` y `appendChild` *off-screen* a un fragmento que el usuario todavía no ve.

### Commit phase: mutation + layout

Cuando la render phase entrega un árbol completo, React cruza al commit phase:

```js
function commitMutationEffects(Fiber) {
  switch (Fiber.tag) {
    case HostComponent: { /* apply new props/children to DOM node */ break; }
    case HostText:      { /* update text content */ break; }
    case ClassComponent:{ /* componentDidMount / componentDidUpdate */ break; }
    // ...
  }
}
```

| Subfase | Qué hace |
|---------|----------|
| **Mutation** | `commitMutationEffects` aplica al DOM real los cambios calculados: inserciones, borrados (`commitUnmount` / `commitDeletion`), actualizaciones. |
| **Layout** | `commitLayoutEffects` calcula el layout final; equivalente a `componentDidMount`/`componentDidUpdate` en clases y `useLayoutEffect` en funciones. |

Y aquí es donde se ejecutan los **efectos**. La regla de oro:

- `useLayoutEffect` → corre antes del paint (lectura de layout, focus, mediciones).
- `useEffect` → corre después del paint (fetch, analytics, suscripciones).

> [!tip] Orden de efectos en commit
> React aplica placement → update → deletion. Tras mutation effects, se ejecuta `commitLayoutEffects` (sincrónicamente); las passive effects (`useEffect`) se difieren al final, ya con la UI pintada.

## El FiberRootNode: el ancla de los dos árboles

React mantiene un `FiberRootNode` que apunta alternativamente al *current tree* y al *workInProgress tree*:

```js
commitRoot() {
  // ... aplica mutations ...
  // ... layout effects ...
  FiberRootNode.current = workInProgressTree;
}
```

Esa asignación de puntero es el "swap" del double buffering. A partir de ahí, cualquier lectura del árbol actual ve la nueva UI sin ambigüedad. Es por eso que **el commit phase es síncrono**: si se moviese a la mitad, la UI quedaría inconsistente.

## ¿Y por qué importa todo esto?

La consecuencia para quien escribe componentes es sutil pero importante:

- Mientras más alto en el árbol esté tu estado, más descendientes se rerenderizan cuando cambia. ([05-optimizacion-y-rendimiento]] entra en detalle.)
- Los `useLayoutEffect` pueden bloquear paint si hacen trabajo pesado — úsalos solo para mediciones que necesitas antes del primer dibujado.
- Si tu aplicación hace computación síncrona pesada durante render, está bloqueando el *time slice* de 5 ms y degradando la respuesta a input. Aquí entran `useMemo`, `useTransition` y `useDeferredValue`, que se cubren en [[08-react-concurrente]].

## Resumen del capítulo

- La reconciliación es la traducción del árbol de React elements al DOM real. Batching evita pagar N mutaciones cuando solo cambia un valor.
- El **stack reconciler** (pre-16) carecía de prioridades e interrupción. Eso provocaba jank con componentes pesados y updates urgentes.
- El **Fiber reconciler** representa cada unidad de trabajo como un nodo `Fiber` con punteros `return`/`child`/`sibling`. Es mutable y persistente entre renders, a diferencia de los React elements efímeros.
- **Double buffering**: React prepara el siguiente frame en un árbol *work-in-progress* *off-screen*. Si llega un update prioritario, lo descarta sin parpadeos.
- **Render phase** (off-screen, interrumpible) y **commit phase** (síncrona, no interrumpible) son los dos hemisferios. Effects corren en commit: mutation + layout primero, passive después.

## Próximos pasos

Con la reconciliación en su sitio, en [[05-optimizacion-y-rendimiento]] se aprovecha para responder a las preguntas prácticas: cuándo *memoizar* (`React.memo`, `useMemo`, `useCallback`) y cuándo diferir carga con `lazy` + `Suspense`.
