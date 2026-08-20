---
title: "JSX : el lenguaje que parece HTML dentro de JavaScript"
description: "Qué es JSX (JavaScript Syntax eXtension), cómo se compila a React.createElement, el JSX transform moderno (React 17+), expresiones vs sentencias, beneficios y trade-offs como separar conceptos"
date: 2026-08-18
mod: 2026-08-18
published: true
tags: [frontend, react, fluent-react, jsx, compiladores]
---

# JSX

> [!abstract] Resumen
> JSX — **JavaScript Syntax eXtension** — es la sintaxis que parece HTML dentro de JavaScript. No es un lenguaje separado: es azúcar sintáctico que un *transpilador* (Babel, swc, esbuild, TypeScript) convierte en llamadas a `React.createElement` (clásico) o a las funciones del nuevo *runtime* `react/jsx-runtime` (introducido en React 17). El capítulo recorre las cuatro ideas que necesitas para *fluir* con JSX: cómo se transforma en JavaScript plano, qué es el *pragma* que nombra la función de creación, por qué solo se admiten expresiones (no sentencias) y por qué mezclar marcado y lógica dejó de considerarse herejía.

## Qué es JSX y qué no es

JSX no es HTML, no es JS versión 10, no es JS Xtra. La *X* viene de **eXtension** (a veces se le llama también JavaScript XML). Es una extensión sintáctica para JavaScript desarrollada en Meta y adoptada después por otros frameworks (Vue, Solid, Qwik, e incluso implementaciones fuera del ecosistema web como SwiftUI).

| HTML | JSX |
|------|-----|
| Atributos en minúsculas (`onclick`) | Atributos en *camelCase* (`onClick`) |
| Solo elementos | Mezcla elementos (`div`) y componentes (`<MyComponent/>` con mayúscula) |
| No tiene expresiones | `{}` para embeber expresiones JS válidas |
| Interpretado por el navegador | Necesita un paso de compilación previo |

### Con y sin JSX, lado a lado

```jsx title="Con JSX"
const MyComponent = () => (
  <section id="list">
    <h1>This is my list!</h1>
    <p>Isn't my list amazing? It contains amazing things!</p>
    <ul>
      {amazingThings.map((t) => (
        <li key={t.id}>{t.label}</li>
      ))}
    </ul>
  </section>
);
```

```js title="Sin JSX — clásico (React 16 y anteriores)"
const MyComponent = () =>
  React.createElement(
    "section",
    { id: "list" },
    React.createElement("h1", {}, "This is my list!"),
    React.createElement("p", {}, "Isn't my list amazing? It contains amazing things!"),
    React.createElement(
      "ul",
      {},
      amazingThings.map((t) =>
        React.createElement("li", { key: t.id }, t.label)
      )
    )
  );
```

```js title="Sin JSX — transform moderno (React 17+)"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const MyComponent = () =>
  _jsxs("section", {
    id: "list",
    children: [
      _jsx("h1", { children: "This is my list!" }),
      _jsx("p",  { children: "Isn't my list amazing? It contains amazing things!" }),
      _jsx("ul", {
        children: amazingThings.map((t) =>
          _jsx("li", { children: t.label }, t.id)
        ),
      }),
    ],
  });
```

> [!tip] Por qué el cambio del transform
> El transform clásico obligaba a tener `React` en el *scope* para que `React.createElement` existiera. El nuevo transform importa automáticamente las funciones `jsx`/`jsxs` del *runtime* oficial y mejora el tree-shaking porque el componente deja de ser un punto de acoplamiento con el import.

## Beneficios y trade-offs de JSX

### Beneficios

| Beneficio | Por qué importa |
|----------|-----------------|
| **Más legible** | Reconoces la estructura de la UI sin descifrar árboles de `createElement`. |
| **Más seguro** | React escapa caracteres peligrosos (`<`, `>`) para evitar XSS por default. |
| **Type-safe** | Funciona con TypeScript y, sin TS, con `propTypes` y JSDoc. |
| **Fuerza componentes** | Obliga a pensar en `MyComponent` antes que en `<div>` suelto. |
| **Amplia adopción** | Vue, Solid, Qwik y SwiftUI reconocen su valor. |

### Desventajas

| Desventaja | Cómo se mitiga |
|------------|----------------|
| **Curva de aprendizaje inicial** | Una vez leído este capítulo desaparece. |
| **Requiere build step** | Vite, swc, esbuild, Babel hacen el transpile de forma transparente. |
| **Mezcla conceptos** | Composición + colocation hace que sea *menos* problema de lo que parece: la lógica vive con el componente que la usa. |
| **Expresiones, no sentencias** | Se resuelve con `ternarios`, `&&`, `map`, IIFE ligero — no `if/else` inline. |

> [!note] "JSX rompe la separación de concerns"
> Es el argumento histórico de 2013. La respuesta del libro: la separación por *archivos* (HTML vs JS vs CSS) no es separación de concepts, es separación por tecnología. La separación real es por **componente**, y JSX la hace posible localizando markup, lógica y estilos en un mismo lugar cohesivo.

## Under the hood: cómo se transforma texto en máquina

Para entender por qué JSX necesita un *build step*, el capítulo hace un repaso por las tres fases que cualquier compilador sigue con JavaScript (V8, SpiderMonkey, JSCore).

### Tokenización / *lexing*

Convertir el texto crudo en tokens con significado: `const → 0`, `let → 1`, `function → 2`. Un lexer con estado (que sabe qué token acaba de ver) se llama **lexer** propiamente — la diferencia es fina pero explica por qué expresiones como `</` para cerrar JSX son ambiguas sin un parser real debajo.

### Parsing

Convertir la lista de tokens en un **AST** (*Abstract Syntax Tree*). El capítulo muestra el AST de `const a = 1; let b = 2; console.log(a + b)` como un objeto JSON con `type: "Program"`, `body: [...]`, `kind: "const" | "let"`, etc. Ese árbol es la estructura que el resto del pipeline sabe consumir.

### Code generation

Transformar el AST en *machine code* (o *bytecode* JIT). En el navegador esto pasa continuamente: motores como V8 traducen primero a bytecode para arrancar rápido y luego especializan los *hot paths* en código máquina. Los *runtimes* (Chrome, Node, Cloudflare Workers, Bun, Deno) añaden el contexto (`window`, `process`, edge APIs).

> [!tip] Transpilador vs compilador
> Un **compilador** baja de nivel de abstracción (alto nivel → máquina). Un **transpilador** se mueve entre lenguajes del mismo nivel: TypeScript → JavaScript, ES6 → ES5, **JSX → JavaScript**. Babel, swc y esbuild son transpiladores; V8 es un compilador JIT. JSX vive en el primer grupo.

## Cómo extender JavaScript: dos caminos posibles

Para añadir una sintaxis nueva hay dos rutas:

1. **Crear un motor nuevo** que la entienda. Inviable: tardarías años y nadie adoptaría tu motor.
2. **Transformar la sintaxis antes de que llegue al motor**. Es la ruta barata: tú escribes un lexer y un parser propios, generas un AST del lenguaje extendido y lo reduces a JavaScript plano.

JSX toma la ruta 2. Por eso JSX nunca llega al navegador sin pasar por Babel/swc/esbuild — el navegador sigue siendo V8/SpiderMonkey/JSCore, sin cambios.

```text
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │   JSX src    │ ───▶ │  Transpiler  │ ───▶ │   Vanilla JS  │ ───▶ motor
   │              │      │ (Babel/swc)  │      │              │
   └──────────────┘      └──────────────┘      └──────────────┘
                                │
                                ▼
                          AST intermedio
```

## El pragma de JSX

JSX no es más que azúcar sobre llamadas a una función. Esa función es el **pragma** y su nombre es configurable. Por defecto puede ser:

- `React.createElement` (transform clásico)
- `jsx` / `jsxs` desde `react/jsx-runtime` (transform moderno)

La firma es siempre la misma: `pragma(tag, props, ...children)`. Esto hace que cualquier árbol JSX se reduzca a llamadas anidadas:

```jsx
<MyComponent prop="value">contents</MyComponent>
```

↓

```js
React.createElement(MyComponent, { prop: "value" }, "contents");
```

> [!note] Otros pragmas en el ecosistema React
> Los *directives* como `"use strict"` y, más recientemente, `"use client"` y `"use server"` son pragmas en el sentido clásico: dan información extra al compilador. El `"use server"` delimita funciones que se ejecutan en el servidor en el contexto de RSC — se ve en [[10-server-components-y-server-actions]].

## Expresiones (no sentencias) entre `{}`

JSX permite ejecutar cualquier **expresión** JavaScript entre `{}`. Las expresiones devuelven un valor; las sentencias (`if`, `for`, `let`, `const = ...`) no, así que JSX las rechaza para no caer en código con efectos secundarios invisibles.

```jsx title="Expresión válida — se renderiza el resultado"
const a = 1;
const b = 2;

const MyComponent = () => <Box>Here's an expression: {a + b}</Box>;
// → "Here's an expression: 3"
```

```jsx title="Sentencia inválida — SyntaxError"
const MyComponent = () => <Box>{
  const a = 1;
  const b = 2;
  if (a > b) {
    3
  }
}</Box>;
// No compila: las sentencias no devuelven valor.
```

> [!tip] Patrones para control de flujo dentro de JSX
> Sin `if/else` dentro del árbol se vuelve al viejo truco de la condición externa: `showHeader && <Header />`, ternarios `cond ? <A /> : <B />`, y para casos complejos, mapear un array y dejar que React lo aplane. La regla mental: **lo que está entre `{}` debe devolver algo renderizable**.

## Resumen del capítulo

- JSX es una extensión sintáctica, no un lenguaje: cualquier JSX es JavaScript plano después de pasar por un transpilador.
- El transpilador (Babel, swc, esbuild) hace *lex*, *parse*, *transform* y *emit*. El navegador sigue siendo V8/SpiderMonkey/JSCore.
- Hay dos modos: el clásico, con `React.createElement`, y el moderno (React 17+), con `jsx`/`jsxs` desde `react/jsx-runtime`.
- `{}` admite expresiones porque solo ellas devuelven valor. Sentencias (incluido `if`) requieren extraer la lógica fuera del árbol JSX.
- La famosa "mezcla de conceptos" se resuelve con el **modelo de componentes**: la unidad cohesiva ya no es el archivo (`.html`, `.js`, `.css`), sino el componente React, donde cada concepto vive al lado de los otros.

## Próximos pasos

Adentrarnos en la estructura que JSX produce: el árbol de React elements y el [[03-el-dom-virtual]].
