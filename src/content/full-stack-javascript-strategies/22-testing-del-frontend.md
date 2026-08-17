---
title: "Testing del frontend"
description: "Cuándo testear, unit tests con Vitest, React Testing Library, mock data en archivos separados, Mock Service Worker, e2e con Cypress, snapshot tests, refactors para testabilidad"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, testing, vitest, msw, cypress]
---

# Testing del frontend

> [!abstract] Resumen
> Esta nota cubre el testing en frontend: cómo decidir qué testear, unit tests con Vitest y React Testing Library, organización de mocks, Mock Service Worker para mockear endpoints reales, e2e tests con Cypress, snapshot tests, y el hábito de refactorizar para hacer el código más testeable. El objetivo es cazar regresiones antes de producción y documentar cómo se supone que funciona el código.

## Por qué testear el frontend

Necesitas evitar **regresiones**: nuevo código que rompe funcionalidad existente. QA no tiene tiempo de correr regression testing en cada release, pero tú como dev puedes asegurar la calidad de tu código desde el principio.

Dos objetivos del testing:

- **Prevenir código roto** que llega a usuarios.
- **Documentar** cómo se supone que funciona el código.

## Cuándo testear

> [!tip] Escribe tests a la vez que implementas
> El mejor momento para escribir el test es **con la implementación**, no después. Es fácil decir "lo escribo luego" pero el luego nunca llega.

Qué testear:

- **Renderizado condicional** → test.
- **API requests** → test.
- **Errores potenciales** → test.
- **Manipulación de datos** → test.
- **Cualquier cosa que cambie el render del componente** → test.

### Trade-off realista

Algunos features cuestan más testear que implementar. **No persigas 100% de cobertura en frontend**. A diferencia del backend (donde 90-100% es alcanzable), el frontend es complejo y cambiante por su naturaleza. Timing, eventos, dependencias externas... conseguir que todo sea determinista es difícil.

Si un test se complica, **discútelo con el equipo**. A veces es señal de que el código necesita refactor.

## Unit tests con Vitest

El proyecto usa **Vitest** (compatible con Jest, mucho más rápido, encaja con Vite).

```bash
npm install -D vitest @testing-library/react jsdom
```

> [!note] Jest vs Vitest
> Si vienes de Jest, la transición a Vitest es suave. La sintaxis es prácticamente idéntica. La diferencia importante es **velocidad**: Vitest usa el mismo pipeline de Vite, así que cold starts y test runs son mucho más rápidos.

### Mocks en archivos separados

Los datos de mock van en archivos separados (no inline en el test):

```typescript
// src/mocks/orders.ts
export const orderResponseData = { /* ... */ };

// src/mocks/users.ts
export const userResponseData = { /* ... */ };
```

> [!tip] Mock data reusable
> Si los mocks están en archivos separados, **un cambio se propaga a todos los tests** que los usen. Si los pones inline en cada test, tienes que actualizar N archivos cuando el schema cambia.

### Mocks de hooks

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserInfo from '.';
import { orderResponseData } from '../../mocks/orders';
import { userResponseData } from '../../mocks/users';

const mocks = {
  useQuery: vi.fn(),
  useErrorBoundary: vi.fn(),
  showBoundary: vi.fn(),
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mocks.useQuery(),
}));

vi.mock('react-error-boundary', () => ({
  useErrorBoundary: () => mocks.useErrorBoundary(),
}));

describe('<UserInfo />', () => {
  beforeEach(() => {
    mocks.useQuery.mockReturnValue({
      isLoading: false,
      data: orderResponseData,
    });
    mocks.useQuery.mockReturnValue({
      isLoading: false,
      data: userResponseData,
    });
    mocks.useErrorBoundary.mockReturnValue({ showBoundary: mocks.showBoundary });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
```

`beforeEach` inicializa los mocks; `afterEach` resetea para que cambios no se filtren entre tests.

### Tests reales

```typescript
it('should render the user info screen', async () => {
  render(<UserInfo />);
  expect(screen.getByPlaceholderText('Search products...')).toBeDefined();
  expect(screen.getByText('Dog stuff')).toBeDefined();
  expect(screen.getByText('Customer since 2002')).toBeDefined();
});

it('should render the loading circle when user data is loading', async () => {
  mocks.useQuery.mockReturnValue({ isLoading: true });
  render(<UserInfo />);
  expect(screen.getByTestId('user-loading-circle')).toBeDefined();
});
```

> [!tip] Compara con código real
> Cuando escribas tests, ten el código del componente y el test en columnas lado a lado. Recorre línea por línea para asegurarte de cubrir cada rama. Esto te descubre lógica que no habías pensado y casos raros.

> [!warning] Verifica que el test falla
> Después de escribir un test, **cambia una assertion a algo que debería fallar** y asegúrate de que falla. Tests que pasan siempre sin importar qué no están testeando nada.

### Snapshot tests

Comparan el output del código con un snapshot file (HTML o valores esperados). Útil para detectar cambios inesperados en la UI.

```typescript
import { render } from '@testing-library/react';
import MyComponent from '.';

it('matches snapshot', () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchSnapshot();
});
```

> [!tip] Refactoriza para testabilidad
> Cuando un test es difícil de escribir, **es señal de que el código necesita refactor**. Por ejemplo, una función que depende de `new Date()` se vuelve testeable si acepta la fecha como parámetro:

```typescript
// Antes: difícil de testear
const updateDate = () => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US').format(now);
};

// Después: testeable
const updateDate = (date?: string) => {
  const now = date ? new Date(date) : new Date();
  return new Intl.DateTimeFormat('en-US').format(now);
};
```

## Mock Service Worker (MSW)

**MSW** mockea endpoints a nivel de service worker. Útil cuando:

- Frontend y backend son equipos separados y frontend desarrolla contra MSW antes de que el backend esté listo.
- Necesitas deployar el app a un entorno de develop para que Producto pruebe.

> [!warning] Riesgo de MSW
> Si frontend desarrolla contra MSW sin coordinación con backend, **puede haber trabajo redundante** cuando el backend cambia data structures. Mantén comunicación estrecha.

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { userResponseData } from './users';
import { orderResponseData } from './orders';

export const handlers = [
  http.get(`${import.meta.env.VITE_API_URL}/v1/users`, () => {
    return HttpResponse.json(userResponseData);
  }),
  http.get(`${import.meta.env.VITE_API_URL}/v1/orders`, () => {
    return HttpResponse.json(orderResponseData);
  }),
];
```

```typescript
// main.tsx
export async function shouldEnableMocking() {
  if (import.meta.env.MODE !== 'development') return;
  const { worker } = await import('./mocks/browser');
  return worker.start();
}

shouldEnableMocking();
```

Alternativas: **Nock**, **JSON Server**.

## E2E tests con Cypress

Cypress corre en un browser real y simula al usuario: click, type, verificar que el resultado aparece. Ideal para flujos completos.

```bash
npm install cypress --save-dev
```

```typescript
describe('User Info', () => {
  beforeEach(function () {
    cy.intercept('GET', '/v1/orders').as('getOrders');
    cy.intercept('GET', '/v1/users').as('getUser');
    cy.intercept('POST', '/v1/orders').as('createOrder');
  });

  it('loads the orders table', function () {
    cy.visit('http://localhost:8080/');
    cy.wait('@getOrders');
    cy.get('[aria-label="orders-table"]')
      .contains('Dog stuff')
      .should('be.visible');
    cy.get(`[data-testid="orders-loading-circle"]`)
      .should('not.be.visible');
  });

  it('submits a successful order request', function () {
    cy.visit('http://localhost:8080/');
    cy.wait('@getOrders');
    cy.get('input[name="firstName"]').type('Ernest');
    cy.get('input[name="lastName"]').type('Abcde');
    cy.get('input[name="quantity"]').type('3');
    cy.get('input[name="email"]').type('e.abcde@ern.com');
    cy.get('input[name="password"]').type('B1gt3sTAcc0un!');
    cy.get('input[name="contactTime"]').type('2024-07-09T12:00');
    cy.get('form').find('Submit').click();
    cy.wait('@createOrder').its('response.statusCode').should('equal', 204);
    cy.find('Order submitted successfully').should('be.visible');
  });

  it('does not submit an incomplete order request', function () {
    cy.visit('http://localhost:8080/');
    cy.wait('@getOrders');
    cy.get('input[name="firstName"]').type('Ernest');
    cy.get('input[name="lastName"]').type('Abcde');
    cy.get('input[name="quantity"]').type('3');
    cy.get('input[name="email"]').type('e.abcde');
    cy.get('input[name="password"]').type('B1gt3sTAcc0un!');
    cy.get('input[name="contactTime"]').type('2024-07-09T12:00');
    cy.get('form').find('Submit').click();
    cy.get('.email-errors').should('be.visible');
  });
});
```

### Gherkin + Cucumber

Para involucrar a Producto en la escritura de tests, **Gherkin** y **Cucumber** permiten escribir escenarios en formato Given/When/Then:

```gherkin
Feature: User Info functionality
  Scenario: Navigate to user actions screen
    Given I am on the user info screen
    When I click the Actions nav link
    Then I should be redirected to the user actions screen
```

```typescript
import { When, Then, Given } from '@badeball/cypress-cucumber-preprocessor';

Given('I am on the user info screen', () => {
  cy.visit('http://localhost:5173/');
});

When('I click the Actions nav link', () => {
  cy.contains('Actions');
  cy.contains('Actions').click();
});

Then('I should be redirected to the user actions screen', () => {
  cy.url().should('include', '/actions');
});
```

> [!tip] Gherkin: debate
> Hay devs que prefieren escribir e2e tests con Cypress directamente porque es más expresivo out-of-the-box. **Gherkin + Cucumber brillan en organizaciones enterprise** donde quieres integrar a Producto en specs técnicas. Es decisión de equipo.

## La pirámide de testing

> [!quote] Ethan Brown sobre la pirámide
> La sabiduría convencional dice que tienes **pocos e2e tests** porque son caros. Herramientas como Cypress están cambiando esto, pero el principio sigue siendo válido: **invierte en una tecnología en proporción a su coste y valor**. Cypress cambia el ratio coste-valor, pero el principio no desaparece.

- **Unit tests**: la base de la pirámide. Muchos, rápidos, baratos.
- **Integration tests**: en el medio. Cubren flujos pequeños entre componentes.
- **E2E tests**: la cima. Pocos, lentos, caros. Cubren flujos completos de usuario.

## Próximos pasos

- [[23-debugging-del-frontend|Debugging del frontend]]: proceso, logs, console.log, breakpoints, Browser DevTools (Elements, Sources, Network, Application), bugs en lugares inesperados.
