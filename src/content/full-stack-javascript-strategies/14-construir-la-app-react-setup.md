---
title: "Construir la app React: setup"
description: "Vite, linters (ESLint) y formatters (Prettier) con Husky, build configs, estilos con MUI y styled-components, testing con Vitest, CHANGELOG y README"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, vite, prettier, eslint, husky, mui, vitest]
---

# Construir la app React: setup

> [!abstract] Resumen
> Esta nota recorre la inicialización del repo: scaffolding con Vite + React + TypeScript, linters y formatters (Prettier, ESLint, Husky en pre-commit y pre-push), build configs (tsconfig y Vite), estilos con Material UI + styled-components, theme provider, testing con Vitest + React Testing Library, y los docs de mantenimiento (CHANGELOG, README). El objetivo es dejar el repo listo para que varios devs puedan trabajar en paralelo sin pisarse.

## Inicializar el proyecto

Antes de tocar código, **inicializa Git** (local o conectado a un remote). Version control desde el día uno.

```bash
npm create vite@latest
? Project name: › dashboard-web
? Select a framework: › React
? Select a variant: › TypeScript
```

Una de las ventajas de Vite es que **no es muy opinionated**, así que puedes estructurar componentes y pantallas como quieras. Para esta primera fase, basta con tener el scaffolding listo y configurar las herramientas core.

> [!tip] No necesitas todo, solo lo suficiente
> En greenfield, **tú eres quien inicializa el repo** para que el equipo pueda arrancar a trabajar en paralelo. No hace falta que esté todo perfecto: solo lo suficiente para que cada dev tenga confianza de que puede empezar sin romper nada.

## Linters y formatters

Cuando se acerca un deadline, los devs escriben código que no sigue las convenciones por salir del paso. Resultado: código messy y difícil de mantener. Linters y formatters lo previenen.

- **Prettier** formatea automáticamente: spacing, comas, line lengths.
- **ESLint** caza bugs: variables sin usar, ternarios anidados, magic numbers.

Se emparejan con **Husky** para correr en Git hooks (commits y pushes). ESLint ya viene configurado por Vite; instala el resto:

```bash
npm install --save-dev husky prettier
```

> [!warning] Sin reglas conflictivas
> He visto configs de Prettier y ESLint contradictorias romper Git hooks y pipelines. **Corre el lint varias veces** para cazar issues antes del primer commit. Si necesitas control fino, `lint-staged` te ayuda a coordinar.

Crea `.prettierrc` en la raíz:

```json
{
  "arrowParens": "always",
  "bracketSpacing": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true
}
```

Y `.prettierignore`:

```text
# Ignore artifacts:
build
# Ignore all HTML files:
**/*.html
# Ignore other config files:
**/*.json
.prettierrc
.eslintrc.cjs
src/vite-env.d.ts
vite.config.ts
```

Añade el script de format en `package.json`:

```json
"scripts": {
  "format": "prettier . --write"
}
```

> [!tip] Format on save
> Activa "format on save" en VS Code. Nadie quiere ocuparse de formatting en el último minuto antes de pushear.

## Husky: hooks de Git

```bash
npx husky-init && npm install
```

Crea `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npm run lint
npm run format
```

Y `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
# npm test
```

Convención de la autora: linting y formatting en pre-commit, tests en pre-push. Adapta según lo que prefiera el equipo.

## Build configs

### tsconfig.json

Valores clave:

- **target**: versión de ECMAScript compatible (afecta a qué browsers/Node puede correr la app).
- **lib**: features JS disponibles al ejecutar el código compilado.
- **module**: cómo el compiler resuelve módulos (afecta a imports).

Por defecto, Vite pone valores que corren en browsers modernos. Si necesitas polyfills o targets específicos, ajusta aquí. **Afecta directamente al bundle size y a cómo escribes imports**.

### vite.config.ts

Vite usa Rollup por debajo. Los defaults suelen bastar. Si necesitas tocar bundle size o browser compatibility, ajusta aquí.

## Estilos

### Material UI + styled-components

**Material UI (MUI)** da componentes con accesibilidad y responsiveness built-in. **styled-components** te da control fino con CSS-in-JS y permite conditional styling por props.

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled styled-components
```

Limpia el scaffolding:

- Borra `App.css`, `index.css`, y la carpeta `assets/`.
- Quita `import './index.css'` de `main.tsx`.

Crea `theme.tsx`:

```typescript
import { createTheme } from '@mui/material/styles';
import { blue, orange } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: { main: blue[900] },
    secondary: { main: orange[400] },
  },
});

export default theme;
```

El theme va a cambiar mucho según avancen los diseños, pero esto es un buen punto de partida. Mira la doc de MUI para ver todas las opciones (incluyendo dark mode).

### ThemeProvider

Aplica el theme globalmente con un provider en `App.tsx`. Los **providers** son un patrón común en React: proveen funcionalidad top-level (themes, modals, state) disponible para todos los componentes. Suelen basarse en React Context.

```typescript
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* el resto de la app */}
    </ThemeProvider>
  );
}

export default App;
```

> [!tip] Override styles cuando haga falta
> Aunque uses una component library, habrá momentos en que necesites customizar más allá de lo que permite. Prepárate para override styles. Y si tu organización tiene design system propio (lo cual es común en empresas medianas/grandes), intégrate con él en lugar de pelearte.

## Testing setup

Instala Vitest y React Testing Library:

```bash
npm install -D jsdom vitest @testing-library/react
```

Añade el script en `package.json`:

```json
"scripts": {
  "test": "vitest"
}
```

Actualiza `vite.config.ts`:

```typescript
/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

> [!note] Testing frontend es más tricky
> Componentes dinámicamente renderizados y API requests hacen que testear frontend sea más sutil que backend. Vitest + React Testing Library te dan las herramientas; los patrones específicos los veremos en [[22-testing-del-frontend]].

## CHANGELOG y README

### README

Es el "cómo" del proyecto. Tiene que decir a cualquier dev cómo levantar el proyecto, qué variables de entorno necesita, qué quirks existen. **Docuementación viva**: cuando descubras un paso adicional o un problema, actualízalo.

### CHANGELOG

Lleva el historial de cambios por release. Útil para responder "¿qué versión tenía esta feature?" cuando hay un bug en producción.

> [!quote] Ethan Brown sobre CHANGELOGs
> Mi opinión sobre los CHANGELOG ha cambiado. Antes usaba un Markdown que actualizaba con cada cambio. El problema es que **duplica el trabajo del release process**, que ya examina los PRs mergeados desde el último release y escribe un resumen. He encontrado que es mejor **concentrar la documentación en las issues y PRs**. Si cada PR tiene toda la info relevante, construir release notes es trivial.

Work with the team para mantener estos docs como parte del PR review. Si no, se desactualizan.

## Verificar que todo corre

Una vez configurado todo, comprueba la versión de Node (en el libro se usa 20.10.0; usa nvm, Volta o n para switchear):

```bash
npm i
npm run dev
```

Deberías ver:

```text
VITE v5.0.5  ready in 174 ms
➜ Local:   http://localhost:5173/
```

Prueba también:

- `npm run build` → genera `dist/`. Verifica que está en `.gitignore`.
- `npm run lint` → sin errores.
- `npm run format` → sin cambios si todo está formateado.
- `npm test` → no hay tests aún, pero el script debe correr.

> [!tip] Commits pequeños y frecuentes
> Commits pequeños ayudan a code reviews y a no perder cambios. Anima al equipo a hacer lo mismo y ponlo en las convenciones de PR review.

## Próximos pasos

- [[15-construir-la-app-react-primera-feature|Construir la app React: primera feature]]: estructura de carpetas (components/ y pages/), crear el primer container, routing con React Router, actualizar la raíz de la app.
