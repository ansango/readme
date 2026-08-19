---
title: "Optimización y rendimiento : memoización, lazy loading y Suspense"
description: "Memoización en React: React.memo, useMemo, useCallback, shallow equality vs referencia, React Forget, lazy loading con React.lazy y Suspense, code splitting y useState vs useReducer"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, memo, useMemo, useCallback, lazy, suspense, performance]
---

# Optimización y rendimiento

> [!abstract] Resumen
> Capítulo 5, primera mitad. Cubre los tres optimizadores de rendimiento canónicos en React — `React.memo` para component-level memoization, `useMemo` para cálculos costosos, `useCallback` para callbacks estables — y sus trampas (shallow equality sobre referencias, comparaciones de funciones siempre rotas sin memoización). También entra en **lazy loading** con `React.lazy` + `Suspense` como frontera de carga, y la decisión **`useState` vs `useReducer`** según la complejidad del estado. Cierra con un atisbo de **React Forget**, el compilador de memoización automática que el equipo de Meta ya está ejecutando en producción.

## Memoización con `React.memo`

La memoización es la técnica clásica de CS: **almacenar el resultado de una función basado en sus inputs** para no recomputar si las entradas no cambian. Para que sea segura la función tiene que ser pura — misma entrada, misma salida — y no tener efectos.

```js
function add(num1, num2) {        // pura → memoizable
  return num1 + num2;
}

async function addToNumberOfTheDay(num) {  // impura (depende del día) → no memoizable
  const todaysNumber = await fetch("https://number-api.com/today")...
    .then(data => data.number);
  return num + todaysNumber;
}
```

En React, la memoización se aplica a **componentes funcionales** envolviéndolos con `React.memo`. El efecto: el componente solo se rerenderiza cuando sus props cambian; en cascada desde el padre se le evita el rerender gratuito.

```jsx title="Por defecto: input que rerenderiza un componente pesado"
function App() {
  const todos = Array.from({ length: 1_000_000 });
  const [name, setName] = useState("");

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <TodoList todos={todos} />
    </div>
  );
}
```

```jsx title="Con React.memo: la cascada se corta"
const MemoizedTodoList = React.memo(function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  );
});
```

### Shallow comparison y la trampa de las referencias

`React.memo` usa shallow equality. Funciona perfecta con escalares (`number`, `string`, `boolean`) pero se viene abajo con tipos por referencia (arrays, objetos, funciones): la comparación es por identidad de memoria, no por contenido.

```js
[1, 2, 3] === [1, 2, 3];   // false — dos arrays, dos referencias
{ foo: "bar" } === { foo: "bar" };  // false
(() => save()) === (() => save());  // false — son funciones distintas
```

Eso rompe la memoización sin querer:

```jsx title="Anti-patrón: cada rerender crea un array nuevo"
function ParentComponent({ allFruits }) {
  const [count, setCount] = useState(0);
  const favoriteFruits = allFruits.filter(f => f.isFavorite);  // ← nuevo array cada vez

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <List items={favoriteFruits} />     {/* React.memo no se entera: shallow dice "diferente" */}
    </div>
  );
}
```

```jsx title="Patrón: useMemo preserva la referencia"
function ParentComponent({ allFruits }) {
  const [count, setCount] = useState(0);
  const favoriteFruits = useMemo(
    () => allFruits.filter(f => f.isFavorite),
    [allFruits]
  );
  return (...);
}
```

Lo mismo aplica con callbacks. `useCallback` estabiliza la referencia siempre que sus dependencias no cambien:

```jsx title="Callback estable para componentes memoizados"
const Parent = ({ currentUser }) => {
  const onAvatarChange = useCallback(
    (newAvatarUrl) => updateUserModel({ avatarUrl: newAvatarUrl, id: currentUser.id }),
    [currentUser]
  );

  return <MemoizedAvatar name="Tejas" url="..." onChange={onAvatarChange} />;
};
```

### Una *guía*, no una *regla*

`React.memo` es **un hint al reconciler**, no un contrato. React siempre puede decidir rerenderizar de todos modos (state local, context changes, force update). Lo importante es entender qué garantiza *de verdad*: evita rerenders en **cascada desde el padre cuando las props no cambian**. Eso, y nada más.

### Cómo se ve por dentro

`React.memo` envuelve el Fiber en un `SimpleMemoComponent`. En cada update, el reconciler (`updateMemoComponent`) compara props anteriores y nuevas con `shallowEqual` (o tu función `compare` si la pasaste). Si son iguales y no hay context changes pendientes, hace `bailoutOnAlreadyFinishedWork` y se salta el render.

> [!tip] `SimpleMemoComponent` fast path
> Si tu componente es una función simple sin `defaultProps` ni `compare` propio, React marca su Fiber como `SimpleMemoComponent` y usa una ruta optimizada. La memoización "pura" es la que mejor partido saca al motor.

## Memoización con `useMemo`

A diferencia de `React.memo`, `useMemo` memoiza **un cálculo dentro del componente**, no el componente entero. Sirve para dos cosas:

1. Evitar recalcular algo caro en cada rerender.
2. Preservar la **referencia** de un objeto o array entre renders.

```jsx title="Ordenar un millón de personas, sin useMemo"
const People = ({ unsortedPeople }) => {
  const [name, setName] = useState("");
  const sortedPeople = unsortedPeople.sort((a, b) => b.age - a.age);   // O(n log n) por keystroke

  return (...);
};
```

```jsx title="El mismo componente con useMemo"
const People = ({ unsortedPeople }) => {
  const [name, setName] = useState("");
  const sortedPeople = useMemo(
    () => [...unsortedPeople].sort((a, b) => b.age - a.age),   // spread para no mutar
    [unsortedPeople]
  );

  return (...);
};
```

### `useMemo` no siempre es buena idea

El libro es explícito al respecto: **memoizar escalares es contraproducente**. El overhead de importar la función, llamarla, comparar dependencias y devolver el valor cached casi siempre es mayor que el cálculo real.

```jsx title="Memoización inútil"
const doubledCount = useMemo(() => count * 2, [count]);
```

```jsx title="Versión correcta: cálculo directo"
return <p>Doubled count: {count * 2}</p>;
```

```js title="Regla práctica"
Si el cálculo es más rápido que el overhead de useMemo, no lo uses.
Si la referencia al resultado importa (se pasa a un componente memoizado), sí.
```

Tampoco tiene sentido `useCallback` con un `<button onClick>`. Los host components (`div`, `button`, `input`) **no rerenderizan por funciones pasadas como props** — React usa event delegation a nivel de root y no compara referencia a función. `useCallback` solo se justifica cuando el callback baja a un **componente custom**, sobre todo si está memoizado con `React.memo`.

```jsx title="useCallback útil: child memoizado"
const ExpensiveComponent = React.memo(({ onButtonClick }) => {
  // 1s artificial delay para mostrar el problema
  const now = performance.now();
  while (performance.now() - now < 1000) {}
  return <button onClick={onButtonClick}>Click Me</button>;
});

const MyComponent = () => {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  // Sin useCallback, ExpensiveComponent se rerenderiza cuando cambia `other`.
  const incrementCount = useCallback(
    () => setCount(p => p + 1),
    []                            // solo se crea una vez
  );

  return (
    <>
      <p>Count: {count}</p>
      <ExpensiveComponent onButtonClick={incrementCount} />
      <button onClick={() => setOther(s => s + 1)}>Do something else</button>
    </>
  );
};
```

> [!warning] Coste oculto de `useCallback`
> Olvídate de usarlo por defecto. Cada call implica: import, función de comparación de dependencias, asignación de closure nuevo. Solo vale la pena cuando rompe una memoización downstream.

## React Forget: el compilador de memoización

El propio equipo de React reconoce que `React.memo`/`useMemo`/`useCallback` son ruido visual y fuente de bugs. **React Forget** (presentado en React Conf 2021) es un compilador que introduce memoización automática en tiempo de build: el código generado detecta por análisis estático qué entradas pueden cambiar y protege cada export interno con un `useMemo` automático, **sin** cambios profundos a la API.

```text
   ┌────────────┐          ┌──────────────┐         ┌────────────────────────┐
   │ Tu código  │ ───────▶ │  Babel/swc   │ ──────▶ │ Código con memoization │
   │ "tonto"    │   parse  │ + React      │   codegen│  automática inyectada  │
   │ sin hooks  │          │   Forget     │         │                        │
   └────────────┘          └──────────────┘         └────────────────────────┘
```

> [!quote] Estado de Forget
> En Meta ya se ejecuta en producción en Facebook, Instagram y ads manager, donde ha "exceeded expectations". Meta lo abrió a npm como `react-compiler` para que el compilador pueda usarse desde Vite, Next.js y Metro. Su tesis central: en lugar de pedir al desarrollador que declare dependencias, derivarlas automáticamente a partir del flujo.

La promesa: **borrar `React.memo`, `useMemo` y `useCallback` del código de usuario** sin perder rendimiento. Hasta entonces, el libro defiende la postura *medida*: memoiza donde el profiler diga que duele, no por defecto. Más sobre Forget como respuesta a signals en [[11-alternativas-a-react]].

## Lazy loading con `React.lazy` y `Suspense`

Enviar un bundle de 22 MB para una `<Sidebar>` que el usuario quizá nunca abre es un lastre. **Code splitting** y **lazy loading** son las contramedidas: el navegador descarga solo el código del *feature* cuando hace falta.

```js title="Dynamic import manual"
import("./Sidebar").then(module => { /* ... */ });
```

`React.lazy` y `Suspense` envuelven la idea con un API idiomática y sin Promises explícitas:

```jsx title="Sidebar de 22 MB, diferida hasta showSidebar = true"
import { lazy, Suspense } from "react";
import FakeSidebarShell from "./FakeSidebarShell";   // 1 KB skeleton

const Sidebar = lazy(() => import("./Sidebar"));

const MyComponent = ({ initialSidebarState }) => {
  const [showSidebar, setShowSidebar] = useState(initialSidebarState);

  return (
    <div>
      <button onClick={() => setShowSidebar(!showSidebar)}>
        Toggle sidebar
      </button>
      <Suspense fallback={<FakeSidebarShell />}>
        {showSidebar && <Sidebar />}
      </Suspense>
    </div>
  );
};
```

### Dónde poner la frontera de `Suspense`

`Suspense` funciona como `try/catch`: coloca el `Suspense` en cualquier ancestro del componente que promete, y React "atrapa" la promesa ahí. Lo correcto es **rodear solo lo que es asíncrono**, no la app entera:

```jsx title="Patrón: Suspense solo sobre la parte que carga"
<>
  <button onClick={() => setShowSidebar(!showSidebar)}>Toggle sidebar</button>
  <Suspense fallback={<p>Loading...</p>}>
    {showSidebar && <Sidebar />}
  </Suspense>
  <main>{/* El resto de la app sigue siendo interactivo */}</main>
</>
```

```jsx title="Anti-patrón: Suspense en la raíz = toda la app bloqueada"
<Suspense fallback={<p>Loading...</p>}>
  <div>{/* ... */}</div>
</Suspense>
```

> [!tip] Suspense como primitiva, no como ornamento
> Cuando un framework moderno (Next.js, Remix) detecta `Suspense`, sabe dónde inyectar `loading.tsx`, dónde dividir boundaries y cómo coordinar con streaming SSR. Es la frontera que une [[08-react-concurrente|Concurrencia]] y [[10-server-components-y-server-actions|RSC]].

## `useState` vs `useReducer`

Dato poco conocido: **`useState` está implementado encima de `useReducer`**.

```js
function useState(initialState) {
  const [state, dispatch] = useReducer(
    (state, newValue) => newValue,
    initialState
  );
  return [state, dispatch];
}
```

`useReducer` gana cuando:

1. **Separa lógica de UI**: el reducer vive en un módulo aparte, se testea en aislamiento, se reusa en otros componentes.
2. **Hace explícito el flujo**: cada cambio de estado es un `dispatch({ type: "..." })`, y el reducer es la única fuente de verdad para transiciones.
3. **Modela eventos**: el patrón *event-sourced* permite auditar, hacer undo/redo, optimistic updates y time-travel debugging.

```jsx title="Reducer con Immer (use-immer)"
import { useImmerReducer } from "use-immer";

const reducer = (draft, action) => {
  switch (action.type) {
    case "updateName":  draft.user.name = action.payload; break;
    case "updateCity":  draft.user.address.city = action.payload; break;
    default: break;
  }
};

const [state, dispatch] = useImmerReducer(reducer, initialState);
```

```jsx title="useReducer desnudo, con spreads"
const reducer = (state, action) => {
  switch (action.type) {
    case "increment": return { ...state, count: state.count + 1 };
    default: return state;
  }
};
```

Immer simplifica los reducers con estado anidado. A cambio, mete un *Proxy* en el draft — barato en comparación con la complejidad evitada.

### Cuándo no usar `useReducer`

Si tu estado es "un contador", "un string", "un boolean" — usa `useState`. Los reducers son para máquinas de estados con varias transiciones y branches.

## Resumen de la primera mitad del capítulo

- La memoización en React descansa en tres herramientas: `React.memo` (componente), `useMemo` (cálculo) y `useCallback` (callback). Las tres se apoyan en shallow equality o en `Object.is` para detectar cambios.
- Las **referencias rompen la memoización**. Cada `()` y cada `[]` en línea crea una identidad nueva y obliga al componente a rerenderizar aunque semánticamente no haya cambiado nada.
- **React Forget** apunta a borrar la memoización manual. Mientras tanto, mide con React DevTools Profiler antes de añadir más `useMemo` de la cuenta.
- **Lazy loading** con `React.lazy` + `Suspense` es la frontera idiomática para code splitting. Ponla lo más cerca posible del código que promete para que la app siga interactiva mientras carga.
- **`useState` vs `useReducer`**: estado simple, useState. Estado como máquina con varias transiciones, useReducer. Immer alivia la verbosidad.

## Próximos pasos

La segunda mitad de este capítulo se va a patrones de composición: cómo Radix, Reach UI o Headless UI ofrecen sus primitivas reutilizables. Seguir en [[06-patrones-avanzados]].
