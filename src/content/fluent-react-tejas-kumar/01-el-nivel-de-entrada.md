---
title: "El nivel de entrada : por qué existe React"
description: "Historia de React: problemas del mundo pre-React (jQuery, Backbone, KnockoutJS, AngularJS), nacimiento en Facebook y propuesta de valor (componentes, unidirectional data flow, virtual DOM, inmutabilidad, Flux)"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, historia, arquitectura]
---

# El nivel de entrada

> [!abstract] Resumen
> Capítulo *meta* que recorre el camino que llevó a React: por qué el modelo clásico de manipular el DOM con jQuery o Backbone/KnockoutJS/AngularJS se quedó corto en escala (rendimiento, fiabilidad y seguridad), cómo nació React en Facebook alrededor de la idea de *one-way data flow* de Jordan Walke, y cuáles son sus cinco pilares — modelo de componentes, virtual DOM, datos inmutables, JSX y la arquitectura Flux. Es el capítulo de motivación: una vez leído, el resto del libro se entiende como implementación de estas ideas.

## Por qué existe React: la palabra clave es *updates*

En los primeros años de la web las páginas eran esencialmente estáticas: rellenar un formulario, pulsar "Submit" y obtener una página nueva. Esto era aceptable hasta que los usuarios empezaron a esperar que las vistas se actualizasen **al instante**, sin recargar la página. Esa expectativa chocó con tres problemas estructurales al intentar hacerlo a mano:

| Problema | Síntoma |
|----------|---------|
| **Rendimiento** | Cada actualización podía forzar *reflows* (recálculo de layout) y repintados del navegador. |
| **Fiabilidad** | El estado había que mantenerlo sincronizado entre muchas zonas del DOM y JavaScript, algo casi imposible con varios ingenieros tocando la misma base de código. |
| **Seguridad** | Inyectar HTML/JS en el DOM obligaba a sanitizar para evitar XSS y CSRF. |

La tesis central de React es: si la fuente de verdad la posee por completo JavaScript y la UI se **describe declarativamente** a partir de ese estado, las tres clases de problemas se mitigan a la vez.

## El mundo antes de React: por qué jQuery se quedó corto

Para fijar las costuras del problema, el libro reconstruye paso a paso el botón "Like":

1. `<button>Like</button>` con `id="likeButton"`.
2. `document.getElementById("likeButton")` + `addEventListener("click", ...)`.
3. `textContent = "Liked"`.
4. Añadir `data-liked` para representar el estado.
5. Meter un `fetch(...)` con `data-pending`, `data-failed`, control de carrera con `disabled`, `finally` para resetear `data-pending`, `debounce`/`throttle` para evitar clicks repetidos.

Al llegar a este punto el botón maneja cuatro estados (`pre-click`, `clicked but pending`, `clicked and succeeded`, `clicked and failed`) con seis atributos y un puñado de preguntas abiertas:

- ¿Cómo se testea si depende del DOM real?
- ¿`isPending` se deduce de `disabled` o son cosas distintas (un botón puede estar deshabilitado por permisos, no por estar pendiente)?
- ¿Mejor un `data-state="pending|liked|failed"`? Más legible, pero introduce un `switch/case` pesado.
- ¿Dónde queda la separación entre la fuente de verdad (atributos del DOM) y la lógica (JS)?

> [!note] Idea clave
> React no responde a *todas* esas preguntas — por ejemplo, modelar el estado como una máquina de estados o como flags separadas sigue siendo decisión del equipo. Lo que sí responde es a la pregunta de **escala**: cómo construir miles de botones interactivos, predecibles y testeables, sin pegarse al DOM.

El ejemplo del **listado** agrava las cosas: `appendChild` por cada `listItems.push(...)` se vuelve O(n) sobre mutaciones reales del DOM — exactamente lo que un iPhone de hace seis años en una red 3G nota. JQuery mitigaba el dolor de escribir el código, no el problema estructural: seguía manipulando el DOM a fuego lento, "side-effectful", con `$('#likeButton')` dando `null` en los tests porque no hay navegador.

```jsx title="El mismo listado en React"
function MyList() {
  const [items, setItems] = useState(["I love"]);

  return (
    <div>
      <ul>
        {items.map((i) => (
          <li key={i /* keep items unique */}>{i}</li>
        ))}
      </ul>
      <NewItemForm onAddItem={(newItem) => setItems([...items, newItem])} />
    </div>
  );
}
```

Fíjate en lo que cambia: no hay `getElementById`, no hay `appendChild`, no hay bucle imperativo. **Describe lo que quieres ver** y React decide el *cómo*. La fuente de verdad vuelve a ser exclusivamente JavaScript.

## El estado del arte antes de React: jQuery, Backbone, KnockoutJS y AngularJS

El capítulo hace un recorrido histórico por las cuatro familias que precedieron a React, explicando qué aportó cada una y dónde se rompió.

### jQuery (≈2006)

Una capa de utilidades para `document.querySelector`, AJAX y animaciones. JQuery fue una revolución por su ergonomía, pero tres problemas acabaron con su idoneidad para apps modernas:

- **Peso**: la librería completa era grande, especialmente en conexiones móviles lentas.
- **Redundancia con los navegadores modernos**: `querySelector` cubre la mayor parte del `$()`.
- **Rendimiento**: las implementaciones nativas del navegador mejoran versión a versión; `classList`, `fetch`, `Promise` dejan a jQuery como un wrapper pesado.

### Backbone (≈2010) — MVC y el problema del `render`

Backbone introdujo **models y views** como primitivas y exportó un API testeable (podías instanciar `LikeButton` y llamar a `render()` directamente). Pero no implementó `render`: dejaba al usuario mutando el DOM con jQuery o Handlebars. Las views crecían hasta volverse monolíticas, y los eventos en cascada producían refactors arriesgados. No tenía *two-way data binding* ni soporte cómodo de composición (el enfantsement anidado de views era farragoso, lo que Marionette intentó resolver sin éxito completo).

### KnockoutJS — MVVM y la idea de "observable"

KnockoutJS fue probablemente **la primera librería reactiva** de JavaScript: valores *observables* que disparan *bindings* declarativas en la UI. Anticipó el modelo de **signals** que hoy explotan Vue, Solid, Svelte, Qwik y Angular moderno.

```js
function createViewModel({ liked }) {
  const isPending = ko.observable(false);
  const hasFailed = ko.observable(false);
  const onClick = () => {
    isPending(true);
    fetch("/like", { method: "POST", body: JSON.stringify({ liked: !liked() }) })
      .then(() => liked(!liked()))
      .catch(() => hasFailed(true))
      .finally(() => isPending(false));
  };
  return { isPending, hasFailed, onClick, liked };
}

ko.applyBindings(createViewModel({ liked: ko.observable(false) }));
```

Funcionaba, pero los *view models* se volvían verbosos y monolíticos, y la coexistencia con HTML 5 y con módulos ES era ya trabajosa cuando AngularJS salió a escena.

### AngularJS (2010) — *two-way data binding* y *dependency injection*

AngularJS popularizó tres ideas que el ecosistema conserva:

- **Modularidad + dependency injection** que, aunque anterior, en JavaScript se generalizó con AngularJS.
- **Two-way data binding** entre `ng-model` y la vista.
- **Template engines** dentro de un marco *framework*, no librería.

Tres problemas conocidos explican su declive:

- **Digest cycle** y dos-way binding como lastre de rendimiento en apps grandes.
- **Sin type safety** en las plantillas: un `ng-click="$ctrl.some.deep.path = 123"` mezcla capa de presentación con lógica.
- **Migración incompatible** a Angular 2 (Dart/TypeScript), lo que fragmentó la comunidad y dejó un hueco que React aprovechó.
- **`$scope`** con herencia prototipal entre scopes: antipatrón para *reasoning*. React lo resuelve **colocando el estado en el componente que lo necesita**.

> [!tip] Tabla rápida MVC vs MVVM
> | Criterio | MVC | MVVM |
> |---|---|---|
> | Propósito | Web apps, separar UI y lógica | UI rica con data binding bidireccional |
> | Componentes | Model / View / Controller | Model / View / **ViewModel** (puente) |
> | Flujo de datos | Controller orquesta | View ↔ ViewModel bidireccional |
> | Acoplamiento | View–Controller a menudo acoplados | ViewModel ignora la View |
> | Plataforma típica | Rails, Django, ASP.NET MVC | WPF, Xamarin |

## Nacimiento en Meta: BoltJS y la idea de Jordan Walke

Dentro de Facebook la complejidad de las vistas crecía al ritmo de la plataforma. Apareció primero **BoltJS** ("bolted together"), una colección de utilidades internas. En ese caldo, el ingeniero **Jordan Walke** tuvo la idea que se convertiría en React: **reemplazar enteramente fragmentos de la página** en cada actualización, en vez de gestionar dos-vías-frente-a-dos-vías. Eso solo era viable si el flujo de datos iba en **una sola dirección** (*one-way data flow* / *unidirectional data flow*).

Esa única decisión — eliminar el binding bidireccional — estructuró todo lo demás:

- Estado propiedad del componente, no del DOM.
- Render = función pura `props + state → elemento`.
- Sin surprises por mutaciones externas (extensiones del navegador, scripts de terceros).

## La propuesta de valor de React

El libro lo resume en cinco pilares que se entrelazan:

### 1. Declarativo sobre imperativo

La UI se describe como una expresión que React transforma en mutaciones reales del DOM. El ejemplo de `MyList` lo ilustra: declaras qué quieres ver y React decide si añade nodos uno a uno, en lotes, o usando *commit phase*.

### 2. Virtual DOM

Una representación de la UI como árbol de objetos JavaScript (`$$typeof: Symbol.for('react.element')`, `type`, `props`, `children`). El botón Like produce algo así:

```js
{
  $$typeof: Symbol.for('react.element'),
  type: 'div',
  props: {},
  children: [
    { type: 'button', props: { onClick: handleLike }, children: ['Like'] },
    { type: 'p',      props: {},                         children: [0, ' Likes'] }
  ]
}
```

Tras cada cambio de estado React compara el árbol viejo con el nuevo — el **diffing** — y genera el conjunto mínimo de mutaciones sobre el DOM real. El detalle de cómo lo hace (heurísticas del diff, Fiber, `key`) es materia de [[03-el-dom-virtual]] y [[04-reconciliacion]].

### 3. Modelo de componentes

Pensar en componentes da tres superpoderes:

- **DRY**: arreglar un `Button` lo arregla en todos los sitios.
- **Keying**: dar `key={...}` permite a React identificar componentes concretos entre renders y decidir qué actualizar.
- **Colocation** y composición: la lógica vive al lado de la UI a la que afecta, y `children` permite anidar limpiamente a cualquier profundidad (lo que faltaba en Backbone).

### 4. Estado inmutable

El estado no se muta; cada cambio es un *snapshot* nuevo. Tres consecuencias prácticas:

- Los *renders* se vuelven funciones puras: con los mismos `props` y `state` producen el mismo árbol.
- Es posible agregar actualizaciones en *batches* sin riesgo de pisarse.
- Abre la puerta a *time-travel debugging* (Replay.io) y a optimizaciones de compilador como React Forget.

### 5. Unidirectional data flow

El estado fluye *padre → hijo* por props y los hijos notifican cambios *hijo → padre* por callbacks explícitos. Esto se institucionalizó con la arquitectura **Flux**.

## La arquitectura Flux

Flux fue la respuesta de Facebook al problema del flujo de datos en aplicaciones grandes, y precedió a las librerías de estado modernas (Redux, Zustand, Jotai). Sus cuatro piezas:

```text
   ┌────────────┐    dispatch    ┌─────────────┐
   │  Action    │ ──────────────▶│  Dispatcher │
   └────────────┘                └─────────────┘
        ▲                                │
        │                                ▼
   ┌────────────┐  emit change   ┌─────────────┐
   │   Views    │◀───────────────│   Store(s)  │
   │ (React)    │                └─────────────┘
   └────────────┘
```

- **Action**: `{ type: 'ADD_TODO', text: 'Learn Flux Architecture' }`.
- **Dispatcher**: un único hub que recibe *actions* y las reparte a todos los *stores* registrados.
- **Store**: clase que extiende `EventEmitter`, mantiene estado y emite `change` al actualizarse.
- **View**: componentes React que escuchan `change` de los stores y pueden re-dispatchar nuevas *actions*.

```js
const Dispatcher = new FacebookDispatcher();
Dispatcher.register(store.handleActions.bind(store));

class TodoStore extends EventEmitter {
  constructor() { super(); this.todos = []; }
  handleActions(action) {
    switch (action.type) {
      case "ADD_TODO":
        this.todos.push(action.text);
        this.emit("change");
        break;
    }
  }
}
```

> [!success] Por qué importa Flux
> Sus tres garantías — **single source of truth**, **testabilidad** por piezas aisladas y **separación de concerns** estricta — siguen siendo el contrato implícito que cualquier librería moderna de estado intenta preservar.

## ¿Por qué React ganó?

- **Pionera del modelo de componentes** y de la unidirectional data flow, justo cuando AngularJS colapsaba por la migración a Angular 2.
- **Backing of Meta**: React se cocinó dentro de Facebook e Instagram a escala antes de salir.
- **Salida al mundo en 2013**: lenta pero constante, aupada por Netflix, Airbnb, NYT.
- **Plataforma-agnóstico**: la misma librería sirve para web, React Native, React 3D, etc.
- **Ecosistema rico**: testing, debugging (DevTools, Replay.io), state management, routing.

## Resumen del capítulo

- React existe porque sincronizar el DOM con el estado a mano era **ineficiente, poco fiable e inseguro** a escala.
- Cada intento previo (jQuery, Backbone, KnockoutJS, AngularJS) dejó una lección que React integró: ergonomía de jQuery, componentes de Backbone/Angular, reactividad de KnockoutJS, y un marcado distinto (JSX) sin dos-way binding ni `$scope`.
- La idea fundacional de Jordan Walke fue **reemplazar fragmentos del DOM con árboles nuevos**: viable porque el dato fluye en una dirección.
- Los cinco pilares — declarativo, virtual DOM, componentes, inmutabilidad, unidirectional data flow — son las cinco lentes con las que el resto del libro explica los detalles de implementación.

> [!quote] Resumen del autor
> "React es una cosa porque permite construir interfaces con mayor predictibilidad y fiabilidad, describiendo declarativamente lo que queremos ver mientras React se ocupa del cómo."

## Próximos pasos

Saltar al meollo del lenguaje: cómo se compila JSX en [[02-jsx]].
