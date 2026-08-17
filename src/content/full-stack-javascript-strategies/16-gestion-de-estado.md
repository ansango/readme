---
title: "Gestión de estado"
description: "Cómo funciona el state en React, useState, useReducer, useContext, prop drilling, enfoques de state management (reducer, atom, mutable), Valtio como ejemplo"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, state-management, hooks, valtio]
---

# Gestión de estado

> [!abstract] Resumen
> Esta nota cubre el corazón de las apps React: cómo funciona el state, los hooks built-in (`useState`, `useReducer`, `useContext`), cuándo subir el state en la jerarquía, los tres enfoques de state management externo (reducer, atom, mutable) y un ejemplo práctico con Valtio. La gestión de estado es lo que determina cómo manejas datos dinámicos que cambian con las acciones del usuario, y hacerlo mal provoca efectos raros en la UI.

## Cómo funciona el state en React

En React, hay un método que controla el render inicial: el método `render`, generalmente en `main.tsx`. La función recibe el `domNode` donde se monta la app y muestra el componente raíz, típicamente `<App />`.

El render por sí solo no actualiza la UI cuando el usuario interactúa. **El state es la memoria del componente** que React usa para re-renderizar en respuesta a acciones del usuario: clicks, form events, cambios de datos.

React usa un **virtual DOM** para hacer los re-renders eficientes: solo se actualizan las partes afectadas. Cuando el state cambia, solo los componentes afectados re-renderizan.

### Hooks

Los **hooks** son piezas de código que permiten trabajar con el ciclo de vida de React. Solo usables en componentes funcionales (reemplazaron a las class methods). Los principales para state son `useState`, `useReducer` y `useContext`.

## useState

Es el hook que más vas a usar. Da "memoria" a un componente individual. Cuando un usuario teclea en un form, useState guarda esos valores hasta que cambien.

```typescript
const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
```

- `userInfo`: valor actual.
- `setUserInfo`: función para actualizar (dispara re-render).
- `initialUserInfo`: valor inicial.

**Cada componente tiene su propio state aislado**. Si tienes dos SearchBar en la misma página, cada uno tiene su state. No hay interferencia.

### Cuándo subir el state

Si dos componentes necesitan compartir state, **sube el state al componente padre** ("lift state up"). Mueves el `useState` del hijo al padre y lo pasas como prop.

```typescript
const UserInfo = () => {
  // El state vive aquí
  return (
    <Container>
      <header><SearchBar /></header>
      <footer><SearchBar /></footer>
    </Container>
  );
};
```

## useReducer

Antes de saltar a Redux, prueba `useReducer`. Es la forma built-in de React para representar state de forma más estructurada, con **actions y dispatchers**.

Úsalo cuando:

- Hay varios filtros en una página que se afectan entre sí.
- Múltiples state changes a través de varios user events.
- Estás haciendo mucho state management pasando props entre componentes.

```typescript
const [state, dispatch] = useReducer(reducer, initialState);
```

Con un reducer puedes manejar state complejo como un **objeto único** en lugar de múltiples variables. La mayoría de pros/cons entre useState y useReducer son team preference. **Un mix de ambos funciona bien** para escenarios complejos.

## useContext

A medida que subes state, aparece el **prop drilling**: pasar valores a través de capas de componentes que no los necesitan. Eso es ineficiente y messy. `useContext` te permite extraer state y compartirlo sin drilling.

`<ThemeProvider />` es el ejemplo clásico: cualquier componente que use `useContext` para pedir el theme tiene acceso directo sin que pase por props.

> [!warning] Context NO mejora performance por sí mismo
> Ethan Brown lo dice claro: he visto a mucha gente usar context pensando que también mejoraría performance. Context no hace nada por la performance. De hecho, **puede empeorarla** si no consideras con qué frecuencia cambia el state.
>
> Buenos usos de context: theme, idioma, light/dark mode, current user (cosas que cambian poco y justifican re-render de todo el árbol).
>
> Mal uso: un sort o filter setting en una tabla. Cambia frecuentemente, y cada cambio re-renderiza todo el árbol. **Usa state local para eso**.

### Cuándo plantear context al equipo

- Props pasándose 10+ niveles.
- App grande con 20+ niveles de props.
- Notas documentadas de por qué cada valor se está pasando y dónde.

> [!tip] Documenta el prop drilling
> Cuando veas prop drilling, anota los valores y por qué. Lleva eso a una retro y propon context. Es una decisión de equipo, no individual.

## A qué nivel de la app gestionar el state

Si dos filtros en la misma página deben actualizarse juntos, **sube el state al nivel de la página** y togglea desde ahí. Single source of truth.

**No tengas prisa en usar context**. Si solo pasas props unos pocos niveles, no hace falta context. Cuando se vuelve un hindrance notable, es momento de discutirlo.

> [!tip] Tracking de refactors potenciales
> Yo llevo una nota con bullet list de posibles refactors que veo. En retros los subo al sprint como tech cleanup. Es un hábito que paga con el tiempo.

## Enfoques de state management externo

Los hooks built-in cubren mucho. Pero si la app crece, hay tres enfoques principales:

### 1. Reducer (centralized source of truth)

Un store central. Los componentes dispatch actions al store. **Redux** y **Zustand** caen aquí.

- **Pros**: source central, devtools, fácil de razonar.
- **Contras**: nuevos conceptos, no es lo más rápido comparado con hooks built-in.

### 2. Atom (state como piezas pequeñas)

State dividido en partes pequeñas que se pueden componer. **Recoil** y **Jotai**.

- **Pros**: integra muy bien con React, sintaxis similar a useState.
- **Contras**: necesitas pensar el state como un grafo, no lineal. Puede confundir a juniors.

### 3. Mutable (proxies)

State mutable a través de proxies que trackean cambios. **MobX** y **Valtio**.

- **Pros**: muy flexible, dependencias se actualizan automáticamente,减少 re-renders.
- **Contras**: cuesta ver cuándo y cómo se actualiza el state, mezcla de mutable/inmutable puede confundir.

> [!note] Proxies explicados
> Un proxy es un objeto o función que actúa en nombre de otro. En state management, el proxy trackea cambios al objeto original y dispara listeners cuando se actualiza. Más info en la [MDN sobre Proxy](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

### Cuál elegir

Mejor forma de decidir: **construye un prototipo pequeño con cada uno** (Redux, Jotai, Valtio) y haz benchmarks. Bundle size, performance, developer experience. **No te fíes solo de benchmarks**; las diferencias de performance suelen aparecer con apps grandes, no con demos.

> [!quote] Sobre la elección
> El proyecto del libro usa **Valtio** por su simplicidad: usa devtools existentes como Redux Toolkit, es compatible con Node y Next.js, no solo React. Es un underdog pero vale la pena.

## Setup del state manager con Valtio

Instala Valtio:

```bash
npm i valtio
```

Crea `src/pages/UserInfo/UserInfo.State.tsx`:

```typescript
import { proxy } from 'valtio';

const OrderStatus = {
  Pending: 'pending',
  Shipped: 'shipped',
  OutOfStock: 'out_of_stock',
} as const;

export type OrderStatusKeys = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface Order {
  id: string;
  productName: string;
  status: OrderStatusKeys;
  orderedDate: string;
  deliveryDate: string;
  totalAmount: number;
  hasBeenReviewed: boolean;
}

export const orderStore = proxy<{
  filter: OrderStatusKeys | undefined;
  orders: Order[];
}>({
  filter: undefined,
  orders: [],
});
```

`orderStore` es el **proxy** que guarda el state. Lo usan los componentes con `useSnapshot` para leer y asignación directa para escribir.

### En el Container

```typescript
import { useSnapshot } from 'valtio';
import { orderStore } from './UserInfo.State';

const UserInfo = () => {
  const orderSnap = useSnapshot(orderStore);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);

  useEffect(() => {
    // Fetch user info and orders from the backend here
    setUserInfo(userResponseData);
    orderSnap.orders = orderResponseData;
  }, []);

  return (
    <Container>
      <div>{userInfo.name}</div>
      <div>Search bar</div>
      <div>
        {orderSnap.orders.map((order) => (
          <div key={order.id}>{order.productName}</div>
        ))}
      </div>
    </Container>
  );
};
```

`useSnapshot(orderStore)` te da acceso al state actual. La asignación directa (`orderSnap.orders = ...`) lo actualiza. **Es híbrido con state local**: forms típicamente usan useState, estado compartido usa el proxy.

> [!tip] No sobredimensiones
> Implementar un state manager demasiado pronto ralentiza el desarrollo y añade complejidad. Espera a que la app lo necesite. Hasta entonces, los hooks built-in son más que suficientes.

## Próximos pasos

- [[17-gestion-de-datos|Gestión de datos]]: Axios + TanStack Query, .env, loading states, error states, configurar headers, cuándo revisar la lógica del backend.
