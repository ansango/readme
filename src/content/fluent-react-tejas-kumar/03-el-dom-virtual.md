---
title: "El DOM virtual : React elements, diffing y rerenders innecesarios"
description: "Qué es el DOM virtual, cómo se diferencia del real DOM, qué son los React elements ($$typeof, type, props, key, ref, _owner, _store), y cómo el algoritmo de diffing minimiza las mutaciones sobre el DOM real"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, virtual-dom, reconciliacion]
---

# El DOM virtual

> [!abstract] Resumen
> El **virtual DOM** es la representación en memoria de la UI como árbol de objetos JS planos. Existe porque el DOM real es caro de tocar: cada cambio puede forzar *reflows* (recálculo de layout) y *repaints*. React construye primero el árbol nuevo, lo compara con el anterior mediante un **algoritmo de diffing**, y aplica solo el conjunto mínimo de mutaciones sobre el DOM real. El capítulo recorre los *React elements* (sus campos `$$typeof`, `type`, `props`, `key`, `ref`, `_owner`, `_store`), la analogía con los *document fragments*, y la trampa más común: los **rerenders innecesarios** que solo se mitigan con `memo`/`useMemo`/`useCallback`.

## Por qué existe el virtual DOM

La respuesta corta: **tocar el DOM real es lento**. Cada vez que cambias algo — añadir un nodo, modificar un atributo, leer `offsetWidth` — el navegador puede forzar un *reflow* (recalculación de layout) y un *repaint* (redibujado). En el peor caso, leer una propiedad dependiente del layout cuesta O(n) sobre el número de elementos afectados.

```js
const btn = document.getElementById("myButton");
const width = btn.offsetWidth; // puede disparar un reflow del documento
```

Actualizar un objeto JS plano, en cambio, es cuestión de JIT: rápido y sin repaints. Esa es la promesa del virtual DOM: una capa intermedia barata donde ocurren los cálculos y los diffs, y una única oleada de mutaciones reales sobre el navegador cuando hace falta.

## El real DOM: por qué duele

El DOM es un árbol vivo de nodos que el navegador mantiene en memoria. Cada nodo expone propiedades y métodos para inspeccionarlo y mutarlo. Un simple `appendChild` en una lista grande obliga al navegador a recalcular el layout de los 1000 `<li>` previos, aunque solo añadas uno al final.

El capítulo insiste en tres problemas del DOM real:

| Problema | Detalle |
|----------|---------|
| **Rendimiento** | Reflows y repaints se acumulan; en móviles de gama baja los milisegundos se notan. |
| **Compatibilidad entre navegadores** | `event.target` vs `event.srcElement`, `onChange` con semánticas distintas por tipo de input, etc. React los normaliza. |
| **Seguridad** | Manipular `innerHTML` o `outerHTML` es terreno abonado para XSS. |

> [!note] "Milliseconds make millions"
> El blog de Google Developers tiene un artículo con ese titular; cada milisegundo de carga perdido se traduce en pérdida de ingresos a escala. La promesa del virtual DOM no es "ahorrar código" sino "ahorrar CPU en el dispositivo del usuario".

### El truco de `getBoundingClientRect` y *layout thrashing*

Cuando lees propiedades dependientes del layout (`offsetWidth`, `getBoundingClientRect`, etc.) y a continuación escribes (`style.width = ...`), el navegador alterna reflows y repaints. Esto se llama **layout thrashing**. La mitigación manual: leer todo en un lote, escribir todo en otro lote. React lo hace por ti porque solo escribe cuando ya tiene el árbol nuevo calculado.

```js title="Patrón batching para evitar thrashing"
function getOffsetWidthWithoutTriggeringReflow(element) {
  let width;
  const rect = element.getBoundingClientRect();   // 1 sólo read batched
  width = rect.width;
  // ... otras lecturas ...
  // ... luego escrituras ...
  return width;
}
```

## Document fragments: el precursor nativo

Antes del virtual DOM existía un patrón nativo para agrupar cambios: **document fragments**. Son contenedores ligeros que no forman parte del árbol activo: mueves nodos dentro de ellos sin causar reflow, y al hacer `appendChild(fragment)` solo pagas un reflow.

```js
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i + 1}`;
  fragment.appendChild(li);
}
document.getElementById("myList").appendChild(fragment);
```

| Capacidad | Document fragment | Virtual DOM |
|-----------|-------------------|-------------|
| **Staging en memoria** | sí | sí |
| **Batched writes** | sí (uno al final) | sí (commit phase) |
| **Diffs entre estados** | no | sí (diffing recursivo) |
| **Abstracción del DOM real** | manual | automática |
| **Compatibilidad cross-browser** | nativa pero con quirks | via `SyntheticEvent` |

El virtual DOM es un *document fragment con superpoderes*: añade diffing automático, batching global de la app y normalización de eventos.

## Cómo funciona: de elementos a árbol virtual

En React, la UI se representa como un árbol de **React elements**, objetos planos creados con `React.createElement` (o el `jsx`/`jsxs` del runtime moderno):

```js
const element = React.createElement(
  "div",
  { className: "my-class" },
  "Hello, world!"
);
```

El objeto resultante, logueado, tiene esta forma:

```js
{
  $$typeof: Symbol(react.element),
  type: "div",
  key: null,
  ref: null,
  props: {
    className: "my-class",
    children: "Hello, world!"
  },
  _owner: null,
  _store: {}
}
```

### Anatomía de un React element

| Campo | Qué guarda | Cuándo mirarlo |
|-------|------------|----------------|
| **`$$typeof`** | Símbolo que identifica el tipo: `react.element`, `react.fragment`, `react.portal`, `react.profiler`, `react.provider`, `react.lazy`, etc. | Cuando depuras errores de "element type is invalid". |
| **`type`** | `"div"` → host component; función → componente custom; clase → class component. | Para saber qué se va a invocar. |
| **`props`** | Atributos + `children`. `{ className: "my-class", children: "Hello" }`. | Lo que ven los componentes. |
| **`key`** | Identificador estable entre renders (lo defines tú). | En listas, para fijar identidad de componentes. |
| **`ref`** | Referencia al DOM node subyacente. | Cuando necesitas imperativos (`inputRef.current.focus()`). |
| **`_owner`** | Componente que creó el element (solo en dev). | Aparece en *stack traces* de errores. |
| **`_store`** | Datos internos de validación / origen. | No se toca desde código de usuario. |

> [!warning] Privados por diseño
> `_owner` y `_store` son **detalles de implementación**. React los expone para diagnosticar errores en dev, pero cambiarlos rompe builds. `propTypes` y TypeScript cubren la validación legítima.

### `React.createElement` vs `document.createElement`

```js
// React: crea un React element (objeto JS plano)
const reactEl = React.createElement(
  "div", { className: "my-class" }, "Hello, World!"
);

// DOM: crea un DOM node (no se inserta hasta appendChild)
const domEl = document.createElement("div");
domEl.className = "my-class";
domEl.textContent = "Hello, World!";
```

Conceptualmente ambos producen una *descripción* de un `<div>`. React lo trata como una *descripción de UI* que se materializa en commit; el DOM nativo te entrega un *objeto vivo* inmediatamente.

## Diffing: cómo React calcula los cambios mínimos

Cuando un componente se rerenderiza, React produce un nuevo árbol de React elements y lo compara recursivamente con el anterior. El algoritmo de diffing, optimizado para tratar árboles grandes, opera así:

```text
1. Si los nodos raíz son distintos, reemplaza el árbol entero.
2. Si los nodos raíz son iguales, actualiza solo los atributos que cambiaron.
3. Si los hijos cambian, actualiza solo los hijos que cambiaron; no recrea el subárbol entero.
4. Si los hijos son iguales pero cambia el orden, los reordena sin recrearlos.
5. Si un nodo se elimina, lo quita del DOM real.
6. Si aparece un nodo nuevo, lo añade al DOM real.
7. Si el type cambia (div → span), desmonta y monta el nuevo (state se pierde).
8. Si hay key, úsala para decidir qué nodo se conserva entre renders.
```

> [!tip] Por qué `key` importa en listas
> Sin `key`, React compara por posición. Si intercalas un ítem al principio, todos los siguientes se consideran *nuevos* y se remontan con su estado reseteado. Con `key={item.id}`, React empareja por identidad estable: reordena, no remonta.

El botón contador que vimos en el prefacio ilustra el ciclo completo:

```text
Render 1:                          Render 2:
div                                div
├─ h1                              ├─ h1
│  └─ "Count: 0"                   │  └─ "Count: 1"     ← único cambio
└─ button                          └─ button
   └─ "Increment"                     └─ "Increment"
```

React detecta que solo cambia el text node del `<h1>` y emite una mutación sobre ese nodo concreto.

## El problema: rerenders innecesarios

El modelo de React es **simple**: cuando cambia el estado de un componente, React rerenderiza ese componente y **todos sus descendientes**, sin saltar a los que no dependen del cambio. La razón: React no sabe qué subárbol depende de qué estado, y prefiere rerenderizar de más antes que perderse un cambio.

```jsx
import React, { useState } from "react";

const ChildComponent = ({ message }) => {
  return <div>{message}</div>;   // se rerenderiza siempre, le cambien o no las props
};

const ParentComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <ChildComponent message="This is a static message" />
    </div>
  );
};
```

> Cada vez que `setCount` se ejecuta, `ChildComponent` se rerenderiza aunque su `prop` `message` no haya cambiado. Si el árbol es grande y el cálculo de cada componente es caro, esto se nota. La solución se trabaja en [[05-optimizacion-y-rendimiento]] con `React.memo`, `useMemo` y `useCallback` y, a futuro, con el compilador de React Forget.

## Resumen del capítulo

- El **DOM real** es caro: reflows, repaints, compatibilidades entre navegadores, XSS.
- Los **document fragments** ya ofrecían batching, pero sin diffing.
- El **virtual DOM** es un árbol de React elements (objetos JS planos) que se construye antes de cualquier mutación real.
- Cada React element es `{ $$typeof, type, props, key, ref, _owner, _store }`. Los tres últimos son internos.
- El **diffing** de React produce un conjunto mínimo de mutaciones sobre el DOM real: reordena, actualiza atributos, monta y desmonta lo justo.
- React **rerenderiza en cascada** por diseño: los descendientes se rerenderizan aunque sus props no cambien. Esto se optimiza con memoización.

## Próximos pasos

Con el diffing entendido, el siguiente paso es la **reconciliación**: cómo se conecta ese cálculo con el commit al DOM real a través del [[04-reconciliacion]].
