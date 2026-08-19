---
title: "Patrones avanzados : HOCs, Render Props, Prop Getters, State Reducer, Compound Components"
description: "Patrones de composición reutilizables en React: componentes presentacionales/contenedor, HOCs (con forwardRef y compose), Render Props y children-as-function, Control Props, Prop Collections y Prop Getters, Compound Components con Context, State Reducer"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, patrones, hoc, render-props, compound-components, state-reducer]
---

# Patrones avanzados

> [!abstract] Resumen
> Segunda mitad del capítulo 5: las primitivas de composición que estructuran las librerías del ecosistema (Radix, Headless UI, Downshift, Reach UI). Se recorre un *timeline* de patrones — de los más antiguos a los más modernos: **presentacional/contenedor**, **HOCs** (con `forwardRef` y `compose`), **Render Props** (incluyendo `children`-as-function), **Prop Collections y Prop Getters**, **Control Props**, **Compound Components con Context** y **State Reducer**. El capítulo argumenta que los hooks cubren muchos de estos casos, pero conocer los patrones sigue siendo útil para leer y escribir bibliotecas de componentes headless.

## Por qué importan los patrones

Las "patrones" en React son respuestas a preguntas recurrentes: cómo reusar lógica entre componentes, cómo permitir al consumidor controlar el estado interno, cómo invertir el control de render. Cada uno coloca la frontera "quién decide qué" en un sitio distinto. La elección del patrón suele ser **una cuestión de control**: cuánta autonomía le das al componente frente a cuánto poder le das al consumidor.

> [!note] Sobre los hooks
> Los hooks cubren buena parte de estos patrones con menos ceremonia, pero los patrones sobreviven dentro de las **librerías headless** (Radix, Headless UI, Downshift, Reach UI, etc.). Cuando lees código de esas librerías reconocerás estas formas.

## Componentes presentacionales vs. contenedores

El patrón más viejo, nacido con React en su primera década. La idea: separar **cómo se ve** la UI de **cómo se comporta**.

```jsx title="Patrón clásico"
const PresentationalCounter = (props) => (
  <section>
    <button onClick={props.increment}>+</button>
    <button onClick={props.decrement}>-</button>
    <button onClick={props.reset}>Reset</button>
    <h1>Current Count: {props.count}</h1>
  </section>
);

const ContainerCounter = () => {
  const [count, setCount] = useState(0);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(0);

  return (
    <PresentationalCounter
      count={count}
      increment={increment}
      decrement={decrement}
      reset={reset}
    />
  );
};
```

```text
   Beneficios
   ----------
   - Reusabilidad: la presentación se monta sobre otros containers con datos distintos.
   - Testabilidad: el container se testea por estado, la presentación por UI (Storybook).
   - Separación de equipos: visual ↔ datos.
```

Con hooks la separación se vuelve opcional — un componente puede tener `useState` directamente — pero el patrón sobrevive cuando quieres aislar *visualmente* un componente mientras lo enchufas en *contenedores* con lógica distinta (p. ej., `TodoList` consumiendo `useTodos` o `useMockTodos`).

## Higher-Order Components (HOCs)

Una **HOC** es una función que toma un componente y devuelve un componente nuevo.

```jsx title="HOC para estados de carga/error (withAsync)"
const withAsync = (Component) => (props) => {
  if (props.loading) return "Loading...";
  if (props.error)   return props.error.message;
  return <Component {...props} />;
};

const TodoList  = withAsync(BasicTodoList);
const Post      = withAsync(BasicPost);
const Comments  = withAsync(BasicComments);

// App solo pasa los flags:
<TodoList loading={isLoading} error={err} data={data} />;
```

### `React.forwardRef` como HOC idiomática

`React.memo` y `React.forwardRef` son HOCs *built-in*. `forwardRef` reenvía una `ref` desde el padre al hijo a través del wrapper:

```jsx
const FancyInput = React.forwardRef((props, ref) => (
  <input type="text" ref={ref} {...props} />
));

const App = () => {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current.focus(); }, []);
  return <FancyInput ref={inputRef} />;
};
```

### Componer HOCs: del *wrapper hell* a `compose`

Las HOCs se componen, pero encadenarlas *a mano* se vuelve ilegible:

```jsx
const Enhanced = withErrorHandler(
  withLoadingSpinner(
    withAuthentication(
      withAuthorization(
        withPagination(
          withDataFetching(
            withLogging(
              withUser(
                withTheme(
                  withIntl(
                    withRouting(MyComponent)))))))))));   // buena suerte leyéndolo
```

La utilidad `compose` aplana la composición:

```js
const compose = (...hocs) => (WrappedComponent) =>
  hocs.reduceRight((acc, hoc) => hoc(acc), WrappedComponent);

const Enhanced = compose(
  withErrorHandler, withLoadingSpinner, withAuthentication,
  withAuthorization, withPagination, withDataFetching,
  withLogging, withUser, withTheme, withIntl, withRouting,
)(MyComponent);
```

> [!tip] `reduceRight`
> Aplica las HOCs de derecha a izquierda, igual que `compose` en Redux o en la composición clásica de funciones. La primera de la lista es la más externa (wrap final).

### HOCs vs. hooks en una tabla

| Característica | HOCs | Hooks |
|----------------|------|-------|
| Reutilización de lógica | Entre componentes | Dentro y entre componentes |
| Control del render del envuelto | Sí | No |
| Inyección / manipulación de props | Sí | No |
| Estado fuera del componente envuelto | Sí | Solo local |
| Lifecycle del envuelto | Encapsula `componentDidMount` etc. | `useEffect` en el consumidor |
| "Wrapper hell" si se acumulan | Riesgo real | Sin capas de árbol |
| Tipado con TS | Frágil en cadenas profundas | Inferencia natural |
| Testeo | Algo más complejo | Aislables |

`React.memo`, `forwardRef` y tu propio `withAsync` coexisten con hooks; **no es o una cosa o la otra**. La regla: si necesitas manipular props, inyectar comportamiento transversal, o controlar si el hijo rerenderiza — una HOC es legítima. Si solo necesitas exponer lógica reusable, un custom hook es suficiente.

## Render Props

Un componente que recibe una función que devuelve JSX, y la llama con su estado interno. El consumidor decide qué renderizar.

```jsx
<WindowSize
  render={({ width, height }) => (
    <div>Your window is {width}x{height}px</div>
  )}
/>
```

```jsx title="Implementación del componente headless"
const WindowSize = (props) => {
  const [size, setSize] = useState({ width: -1, height: -1 });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return props.render(size);
};
```

### Children as a function

Algunos autores prefieren pasar la función como `children`:

```jsx
<WindowSize>
  {({ width, height }) => (
    <div>Your window is {width}x{height}px</div>
  )}
</WindowSize>
```

`children` es una prop como cualquier otra: pasar una función convierte al componente en un *context-like*. Hoy sobrevive sobre todo en librerías que exponen una API *hook-based* (Downshift, react-aria) y en APIs con renderizado por slot.

## Control Props

Llevar la idea de *componente controlado* de los inputs a un componente más complejo: el padre puede **optar por controlar el estado**; si no, el componente usa su propio `useState` interno.

```jsx title="Toggle: puede ser controlado o no"
function Toggle({ on, onToggle }) {
  const [isOn, setIsOn] = useState(false);

  const handleToggle = () => {
    const nextState = on === undefined ? !isOn : on;
    if (on === undefined) setIsOn(nextState);
    if (onToggle) onToggle(nextState);
  };

  return (
    <button onClick={handleToggle}>
      {on !== undefined ? on : isOn ? "On" : "Off"}
    </button>
  );
}
```

Casos de uso típicos: dropdowns, modales, selects — widgets que un equipo de diseño quiere forzar a estar abiertos o cerrados desde fuera, pero que también funcionan *uncontrolled*.

## Prop Collections y Prop Getters

Un *Prop Collection* agrupa varios handlers que suelen ir juntos. Drag-and-drop es el ejemplo perfecto:

```jsx
const droppableProps = {
  onDragOver: (e) => e.preventDefault(),
  onDrop: () => {},
};
const draggableProps = {
  onDragStart: () => {},
  onDragEnd: () => {},
};

<Dropzone {...droppableProps} />;
```

El problema: si el consumidor **override** una de estas props, pierde la lógica base (p. ej., `preventDefault`). **Prop Getter** resuelve esto componiendo el handler por defecto con el del usuario:

```jsx
const compose = (...fns) => (...args) => fns.forEach((fn) => fn?.(...args));

export const getDroppableProps = ({ onDragOver: userOnDragOver, ...rest }) => {
  const defaultOnDragOver = (e) => e.preventDefault();
  return {
    onDragOver: compose(userOnDragOver, defaultOnDragOver),
    onDrop: () => {},
    ...rest,
  };
};

<Dropzone
  {...getDroppableProps({
    onDragOver: () => alert("Dragged!"),
  })}
/>
// alert("Dragged!") + preventDefault() en cada dragover
```

```text
   Prop collections    →  prop "spread" plano
   Prop getters        →  funciones que componen el handler
```

Los *prop getters* son el patrón detrás de `useForm`/`useDropzone`/`useClipboard` y similares: dejan que la librería mantenga su lógica interna, pero otorgan al consumidor *puntos de inyección* seguros.

## Compound Components con Context

Cuando varios componentes necesitan compartir estado pero la API debe poder **reordenarse y mezclarse** (un `<hr />` entre dos `<AccordionItem />`, un `<hr />` que envuelve a `<TooltipContent />`, etc.), el patrón *compound component* con Context es la respuesta.

```jsx title="Accordion con compound components"
<Accordion>
  <AccordionItem item={items[0]} index={0} />
  <AccordionItem item={items[1]} index={1} />
  <hr />
  <AccordionItem item={items[2]} index={2} />
</Accordion>
```

```jsx title="Implementación"
const AccordionContext = createContext({ activeItemIndex: 0, setActiveItemIndex: () => 0 });

const Accordion = ({ children }) => {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  return (
    <AccordionContext.Provider value={{ activeItemIndex, setActiveItemIndex }}>
      <ul>{children}</ul>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({ item, index }) => {
  const { activeItemIndex, setActiveItemIndex } = useContext(AccordionContext);
  return (
    <li onClick={() => setActiveItemIndex(index)}>
      <strong>{item.label}</strong>
      {index === activeItemIndex && item.content}
    </li>
  );
};
```

> [!tip] Por qué se prefiere Context sobre `React.cloneElement`
> `cloneElement` mezcla el state del padre con los children en cada render; Context es declarativo y -compatible con cualquier *flavour* de children (arrays, fragments, condicionales, etc.). El primer método se considera legacy.

Las tabs, dropdowns, dialogs y carousels del ecosistema se construyen así. La regla implícita: el contexto compartido define el **estado**, los *subcomponentes* definen los **elementos** y el consumidor compone el árbol.

## State Reducer

Popularizado por Kent C. Dodds. La idea: el componente expone un *punto de inyección* sobre sus transiciones de estado. El consumidor puede vetar o transformar cambios sin tocar la lógica interna.

```jsx title="Toggle básico con reducer"
function toggleReducer(state, action) {
  switch (action.type) {
    case "TOGGLE":
      return { on: !state.on };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function Toggle() {
  const [state, dispatch] = useReducer(toggleReducer, { on: false });
  return (
    <button onClick={() => dispatch({ type: "TOGGLE" })}>
      {state.on ? "On" : "Off"}
    </button>
  );
}
```

```jsx title="Toggle con stateReducer inyectado"
function Toggle({ stateReducer }) {
  const [state, dispatch] = useReducer(
    (state, action) => {
      const nextState = toggleReducer(state, action);
      return stateReducer(state, { ...action, changes: nextState });
    },
    { on: false }
  );

  // ...
}

Toggle.defaultProps = {
  stateReducer: (state, action) => state,  // default: no-op
};
```

```jsx title="El consumidor veta el "off" los miércoles"
function App() {
  const noOffOnWednesday = (state, { changes }) =>
    new Date().getDay() === 3 && !changes.on ? state : changes;

  return <Toggle stateReducer={noOffOnWednesday} />;
}
```

El consumidor recibe `state` actual + `action` + un `changes` con el siguiente estado interno; puede dejarlo pasar o vetarlo. Esto convierte un *toggle* en una pieza con comportamiento configurable sin abrir la caja del componente.

> [!success] Cuándo brilla
> Cuando construyes una **librería de componentes** que tu organización necesita personalizar: el componente "trae" los casos comunes y deja al consumidor *inyectar* lógica externa sin forkearlo. Downshift y react-table son ejemplos del mundo real.

## El patrón que sobrevive: invertir el control

Todos los patrones vistos aquí orbitan la misma idea: **invertir el control** del render a cambio de reusabilidad. El componente deja de ser un bloque monolítico y se convierte en un *kit*:

| Patrón | Quién controla el render | Quién controla el estado |
|--------|---------------------------|---------------------------|
| Presentacional/contenedor | Presentacional, vía props | Contenedor |
| HOC | HOC externa, envolviendo al envuelto | A veces la HOC (e.g. `withAsync`) |
| Render Props | Consumidor, vía la función | Componente headless |
| Compound Components | Consumidor, vía composición | Padre del compound (con Context) |
| Control Props | Componente | Padre si pasa `value`, si no el componente |
| State Reducer | Componente | Componente, pero el consumidor puede vetar |

Los hooks, en particular los *custom hooks*, comparten espacio con todos ellos: sirven cuando lo único que necesitas es exponer lógica, no renderizar UI por el consumidor.

## Resumen de la segunda mitad del capítulo

- Los patrones de React existen para responder a *quién decide qué* en una composición reutilizable.
- **HOCs** siguen vivas en `React.memo`, `forwardRef` y `withAsync`-style wrappers; el `compose` evita el wrapper hell.
- **Render Props** sigue siendo el puente entre "lógica reusable" y "UI específica"; los hooks los han desplazado en componentes user-facing pero sobreviven en APIs internas.
- **Prop Getters** y **State Reducer** son las primitivas que mantienen las librerías headless (Radix, Downshift, react-aria) extensibles sin fork.
- **Compound Components con Context** invierte el control del render y desbloquea APIs expresivas (`<Accordion><hr/><Item/></Accordion>`).
- Hooks ≠ fin de los patrones. Los hooks *complementan* o *sustituyen* ciertos casos; los patrones sobreviven donde la API expone composición al consumidor.

## Próximos pasos

Las decisiones que tomamos en el cliente empiezan a tener una hermana en el servidor. Saltar a [[07-react-del-lado-del-servidor]].
