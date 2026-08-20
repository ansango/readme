---
title: "Alternativas a React : Vue, Angular, Svelte, Solid, Qwik y signals"
description: "Más allá de React: reactividad granular con signals en Vue, Angular Signals, Svelte 5, Solid; resuability de Qwik; comparación coarse-grained vs fine-grained reactivity y la respuesta de React con el compilador Forget"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, signals, vue, angular, svelte, solid, qwik, reactivo]
---

# Alternativas a React

> [!abstract] Resumen
> Capítulo panorámico: Vue, Angular, Svelte 5, Solid y Qwik, comparados en su modelo de reactividad. La tesis: **React no es reactivo en sentido tradicional**. Su modelo (re-render del componente) es *coarse-grained*; signals son *fine-grained* — solo el subárbol que depende de un valor mutado se actualiza, sin reejecutar el componente completo. El capítulo recorre las primitivas de cada framework (Vue `ref`/`reactive`, Angular Signals, Svelte `$state`/`$derived`/`$effect`, Solid `createSignal`, Qwik resumability) y cierra con la postura oficial del equipo de React ante este enfoque: no se adoptan signals, sino que el compilador **Forget** automatiza la memoización. Lectura recomendada para entender *por qué* tu próxima librería favorita decide las cosas como las decide.

## El patrón común: reactividad, declaratividad, componentes

Antes de meternos en cada framework, el libro destaca lo que todas comparten:

| Característica | Cómo la resuelve cada framework |
|----------------|--------------------------------|
| **Componentes** | Functional/class-style en todos; se componen igual. |
| **Sintaxis declarativa** | JSX (React, Solid, Qwik), templates (Vue, Angular), `.svelte` files (Svelte). |
| **Updates** | vDOM diffing (React) ↔ signals ↔ change detection (Angular) ↔ compilación a código imperativo (Svelte) ↔ resumability (Qwik). |
| **Lifecycle** | Hooks (React), `onMounted`/`onUnmounted` (Vue), `effect` runes (Svelte), `onMount` (Solid), `useVisibleTask$` (Qwik). |

Y luego están las divergencias, que es donde está la chicha.

## Vue.js: reactividad con proxies

Vue (Evan You, ex-Angular) coge la parte buena de AngularJS y la entrega sin su peso. Su modelo es lo que hoy llamamos *reactividad fina con signals* (aunque en Vue se llaman `ref` y `reactive`).

```js title="Pseudocódigo del reactivity de Vue"
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) { track(target, key); return target[key]; },
    set(target, key, value) { target[key] = value; trigger(target, key); },
  });
}

function ref(value) {
  return {
    get value() { track(refObject, "value"); return value; },
    set value(newValue) { value = newValue; trigger(refObject, "value"); },
  };
}
```

```js title="Render reactivo simple"
import { ref, watchEffect } from "vue";

const count = ref(0);

watchEffect(() => {
  document.body.innerHTML = `count is: ${count.value}`;
});

count.value++;     // dispara trigger → ejecuta el watchEffect
```

> [!tip] Composition API + Vapor Mode
> Vue 3 con Composition API ya tiene primitivas estilo signal. Está explorando *Vapor Mode* (inspirado por Solid) para no pasar por virtual DOM en absoluto.

## Angular: change detection y Signals (nuevo)

Angular mantuvo durante mucho tiempo *change detection* con Zone.js: recorría el árbol de componentes buscando bindings con cada evento asíncrono. Reciente, adoptó Signals como primitiva de reactividad:

```js title="Angular Signals"
const count = signal(0);
count();                       // access
count.set(1);                  // asignación explícita
count.update(v => v + 1);      // derivado del previo

const state = signal({ count: 0 });
state.mutate(o => { o.count++; });   // mutación con identidad compartida
```

> [!note] Cómo se accede
> Sin auto-unwrapping: acceder a un signal siempre es `count()`. Es un poco más verboso en lectura, pero a cambio te deja *pasar signals crudos* como props sin que pierdan reactividad. Es la dirección opuesta al `ref` de Vue (que se desenvuelve automáticamente).

Angular sigue siendo el *Swiss Army knife*: opinionated, completo, gran curva de aprendizaje, pero propone estructura en equipos grandes donde la consistencia pesa más que la flexibilidad.

## Svelte: compilación, no vDOM ni runtime reactivity (¿en realidad?)

La 4.ª y 5.ª generación de Svelte transforma componentes `.svelte` en **código imperativo** que actualiza el DOM directamente. Sin virtual DOM, sin diffing.

```svelte title="Svelte: reactividad 'automática'"
<script>
  let count = 0;
  function increment() { count += 1; }
</script>

<div>{count}</div>
<button on:click={increment}>Click me</button>
```

```svelte title="Svelte: reactive statements con $:"
<script>
  let count = 0;
  let doubleCount = 0;
  $: doubleCount = count * 2;     // se recalcula cuando count cambia
</script>

<div>{doubleCount}</div>
```

El problema de `$:` es que es estático: el compilador determina dependencias al parsear. Si extraes una función, las dependencias se pierden. **Svelte 5 con runes** resuelve esto:

```svelte title="Svelte 5: runes"
<script>
  let { width, height } = $props();
  const area = $derived(width * height);

  $effect(() => {
    console.log(area);        // dependencias detectadas en tiempo de ejecución
  });
</script>
```

```svelte title="$state en lugar de let"
<script>
- let count = 0;
+ let count = $state(0);
  function increment() { count += 1; }
</script>
```

> [!tip] Detrás de las runes
> Svelte 5 está propulsado por **signals**. No los ves como `$state` lo expone, pero internamente son lo mismo que Solid y Angular Signals. La frase del capítulo es precisa: *"Knockout estaba en lo correcto en 2010"*.

## Solid: reactividad fina, JSX familiar

Solid (Ryan Carniato) se parece a React en sintaxis (JSX) pero **reinvente el modelo**: el componente no se reejecuta, solo las *porciones reactivas* se actualizan.

```jsx title="Solid Counter"
import { createSignal } from "solid-js";

function Counter() {
  const [count, setCount] = createSignal(0);    // Signal: read/write split
  return (
    <>
      <div>{count()}</div>                       // count() registra suscripción
      <button onClick={() => setCount(count() + 1)}>+</button>
    </>
  );
}
```

> [!danger] La diferencia con React
> En React, `setCount` reejecuta `Counter` entero. En Solid, `setCount` notifica a los *subscribers* del signal `count`. `Counter` solo se ejecuta **una vez**. Es la diferencia entre *coarse-grained* y *fine-grained* reactivity.

### Read/write segregation

```js title="API de createSignal"
const [count, setCount] = createSignal(0);
count();                  // read
setCount(1);              // write
setCount(prev => prev + 1);   // write derived
```

LaSignal devuelve `[read, write]` separados. Si pasas `count` a un hijo, no tienes forma de mutarlo desde fuera (la setter no la recibes). Es un *api shape* deliberado: la inmutabilidad-from-the-outside es estructural.

## Qwik: "the O(1) framework"

Qwik ataca el problema del tamaño del bundle: en vez de enviar el JS de la app, **envía solo un loader de ~1 kB** y carga cada componente en el momento exacto en que se necesita.

```text
   Tamaño de bundle al cargar la página
   ──────────────────────────────────────
   React/Vue/Svelte:  variable (puede ser MB)
   Qwik:              O(1) ≈ 1 kB
```

### Resumability, no hidratación

Recordemos del [[07-react-del-lado-del-servidor|Cap. 7]]: hidratación significa **renderizar otra vez** el árbol en cliente para enganchar listeners. Qwik lo evita con *resumability*: serializa en el HTML qué listener va dónde y reanuda la interactividad sin re-renderizar.

```text
   Hidratación                  Resumability
   ───────────                  ─────────────
   Server render                 Server render
       ↓                              ↓
   HTML → Client                 HTML + meta (qué listener en qué nodo)
       ↓                              ↓
   Hydrate (rerender)            Resume (pick up donde el server paró)
       ↓                              ↓
   Interactive                   Interactive
```

> [!tip] Compatibilidad con React
> Qwik tiene `qwikify` para interoperar con componentes React. No se recomienda para todo, pero permite migrar piezas.

### DX: JSX casi idéntico a React

```jsx title="Qwik counter"
import { component$, useSignal, $ } from "@builder.io/qwik";

export const Counter = component$(() => {
  const count = useSignal(0);     // signal
  return (
    <>
      <div>{count.value}</div>
      <button onClick$={() => count.value++}>+</button>
    </>
  );
});
```

`onClick$` y `component$` terminan en `$` para indicar al compilador que esa parte es un límite lazy: Qwik genera referencias HTML para que se carguen **bajo demanda** cuando el usuario interactúe.

## React no es reactivo en sentido tradicional

Volvamos al `<Counter>` que vimos en cada framework:

```jsx title="React Counter"
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

Cuando llamas `setCount`, React **reinvoca** `Counter` entero. Esa es la fórmula clásica:

```text
   v = f(s)
```

La vista es función del estado. Pero esa función **no se llama sola**: la invoca React cuando algo cambia. En contraste:

```jsx title="Solid Counter (mismo JSX, distinto motor)"
function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}
```

`Counter` se ejecuta **una vez**. `count()` registra una suscripción en el JSX. `setCount` notifica y React — perdón, Solid — actualiza solo el `<p>` que escuchaba.

### Coarse-grained vs fine-grained

| Modelo | Quién actualiza | Cuándo |
|--------|------------------|--------|
| **Coarse-grained** (React) | El componente entero se reejecuta y el reconciler decide qué diffs. | En cada cambio de estado/props del componente o de un ancestro. |
| **Fine-grained** (Solid, Vue 3, Svelte 5, Angular Signals, Qwik) | Solo las celdas reactivas que leyeron el signal. | En cada `setSignal`/`write` de un valor del cual alguien está suscrito. |

> [!danger] Implicaciones
> Fine-grained es casi siempre *más performante* y *menos trabajo para el desarrollador* (no necesita `memo` ni pensar en dependencias). Pero coarse-grained da *predictibilidad*: el render siempre ve el mismo snapshot del estado, lo que facilita `useSyncExternalStore` y debug.

## React Forget: el camino del compilador

El equipo de React ha dicho que **no adoptarán signals**. Su respuesta: un compilador (Forget) que detecta qué valores no cambian a lo largo del ciclo de vida y los memoiza automáticamente.

```jsx title="Hoy con memo manual"
const MemoizedExpensive = memo(ComponentWithExpensiveChildren);

// ... código de usuario obligado a acordarse ...
```

```jsx title="Mañana con Forget"
function Counter() {
  const [count, setCount] = useState(0);

  function increment() { setCount(count + 1); }

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
      <ComponentWithExpensiveChildren />     {/* Forget meterá memo aquí */}
    </div>
  );
}
```

Forget se aprovecha de las *reglas de React*:

1. Los componentes son funciones puras.
2. Algunos hooks y event handlers no son puros.
3. Las funciones puras no pueden mutar bindings externos.
4. Las funciones puras solo leen props o state.

Con esas reglas, Forget puede predecir qué valores no cambian y emitir `useMemo`/`memo` por nosotros. Resultado: misma perf-or-smance que signals sin que el desarrollador tenga que pensar en memo.

> [!quote] Decisión del equipo
> El equipo ve signals como un *implementation detail*. La postura filosófica es: **"declarativamente describe tu UI, deja que React se ocupe del cómo"** — y Forget es la encarnación tecnológica de esa promesa.

## Forget vs signals — la jugada

| Dimensión | Signals | Forget |
|-----------|---------|--------|
| **API visible** | `createSignal`, `ref`, `$state` que el desarrollador usa | Cero: el compilador lo deduce |
| **Granularidad** | Fina: solo cambia lo suscrito | Igual de fina una vez compilada |
| **Live outside component tree** | Sí (puede haber signals a nivel global) | No: vive donde React los monta |
| **Verbosidad** | APIs explícitas en código | Cero APIs nuevas |
| **Coste mental** | Aprender cuándo subscribirse | Ninguno: la memoria decide |
| **Trade-off futuro** | Cambiar de framework te obliga a reentender | Compilador se mantiene entre versiones |

> [!note] Comparativa justa, distintos compromisos
> Ambos llevan a software rápido y pequeño. Signals te hacen explícito lo que Forget deduce. En cinco años miraremos atrás y veremos que las dos rutas convergen: el código que Forget emite *es* una capa de signals, solo que la escribe el compilador.

## Resumen del capítulo

- **Vue**, **Angular Signals**, **Svelte 5 runes**, **Solid**, **Qwik** han convergido en *fine-grained reactivity* vía signals. Diferente sintaxis, idéntico motor conceptual.
- **React usa `useState` + re-run del componente** — *coarse-grained*. No es "reactivo" en el sentido tradicional, es `v = f(s)` con el render invocado manualmente.
- **Forget** es la respuesta de React: un compilador que automatiza la memoización para acercarse a la perf de signals sin cambiar la API.
- **En la práctica**, todo framework moderno tiene componentes, sintaxis declarativa, lifecycle y un ecosistema. Lo que cambia es **dónde corre el render** y **qué primitiva de reactividad** ofrece.

> [!quote] La lección final del autor
> "No hay un one-size-fits-all. Cada framework es una opinión distinta sobre *quién decide qué* en la UI. Entender esas opiniones hace mejores ingenieros, **incluso si terminas eligiendo React**."

## Próximos pasos

El cierre: en [[12-conclusion]] se resume el viaje entero y qué mirar para no quedarse atrás.
