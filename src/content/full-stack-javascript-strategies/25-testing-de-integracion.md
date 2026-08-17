---
title: "Testing de integración"
description: "Test cases para e2e, Cypress, Playwright, Nightwatch, comparativa, testing pyramid, Gherkin y Cucumber, Mock Service Worker"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, testing, e2e, cypress, playwright, nightwatch, gherkin]
---

# Testing de integración

> [!abstract] Resumen
> Esta nota cubre los tests e2e (end-to-end) que verifican flujos completos desde la perspectiva del usuario. Compara las tres herramientas principales (Cypress, Playwright, Nightwatch) con el mismo test case en cada una, discute cuándo usar Gherkin/Cucumber para involucrar a Producto, y aterriza la testing pyramid: muchos unit tests, algunos integration, pocos e2e porque son caros.

## Por qué e2e tests

Los e2e tests verifican el **flujo completo** del usuario. Más robustos que unit tests: si cambias lo que pasa cuando se hace click, un unit test puede seguir pasando mientras un e2e falla porque prueba el comportamiento real.

Herramientas e2e son **stack-agnostic** (sirven para React, Vue, lo que sea). En este capítulo ves los mismos tests escritos con **Cypress, Playwright y Nightwatch** para comparar.

> [!warning] E2e tests son caros
> E2e tests tardan más en escribirse y mantenerse que unit tests. **Para mantenerlos manejables, defínelos durante el feature development o el roadmap**, no al final.

## Los tres test cases

Para comparar herramientas, escribimos los mismos 3 tests en las tres:

1. **Cargar la tabla de orders**: requiere responses de varios endpoints, esperar loading state, esperar que los datos carguen.
2. **Submit exitoso de un order**: inputs válidos, endpoint llamado correctamente, status code esperado, success message visible.
3. **Submit incompleto bloqueado**: input inválido, mensaje de error visible, no submit.

## Cypress

El más establecido. Usa tu app en un browser real, igual que un usuario.

```bash
npm install cypress --save-dev
```

```typescript
// cypress/e2e/user-info.cy.ts
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

`cy.intercept` mockea responses. `cy.wait` espera a que se resuelvan. `cy.get` selecciona elementos del DOM.

> [!tip] Falsa confianza
> Después de que un test pase, **cambia una assertion a algo que debería fallar** y asegúrate de que falla. Tests que siempre pasan no testean nada.

## Playwright

Similar a Cypress pero con algunas diferencias:

- Corre tests en **Chromium, Firefox, WebKit** automáticamente.
- Tiene guía de migración desde Testing Library.
- API context built-in para testing de APIs.

```bash
npm init playwright@latest
```

```typescript
// user-info.spec.ts
import { test, expect } from '@playwright/test';
import { orderResponseData } from '../src/mocks/orders';

let apiContext;

test.beforeEach(async ({ page, playwright }) => {
  await page.goto('http://localhost:8080/');
  apiContext = await playwright.request.newContext({
    baseURL: 'https://api.teststore.com',
    extraHTTPHeaders: {
      Authorization: `token ${process.env.API_TOKEN}`,
    },
  });
});

test.afterEach(async () => {
  await apiContext.dispose();
});

test.describe('User Info', () => {
  test('navigates to the TestStore actions page', async ({ page }) => {
    const actionsButton = page.getByText('Actions');
    await actionsButton.click();
    expect(page.url().includes('/actions'));
  });

  test('loads the orders table', async ({ page }) => {
    const ordersData = await apiContext.get('/v1/orders', {
      data: { orderResponseData },
    });
    expect(ordersData.ok()).toBeTruthy();
    const orderRow = page.getByText('Dog stuff');
    expect(orderRow).toBeVisible();
  });

  test('submits a successful order request', async ({ page }) => {
    page.getByLabel('First Name').fill('Ernest');
    page.getByLabel('Last Name').fill('Abcde');
    page.getByLabel('Quantity').fill('3');
    page.getByLabel('Email').fill('e.abcde@ern.com');
    page.getByLabel('Password').fill('B1gt3sTAcc0un!');
    page.getByLabel('Contact Time').fill('2024-07-09T12:00');
    const submitButton = page.getByText('Submit');
    await submitButton.click();

    const ordersData = await apiContext.post('/v1/orders', {
      data: {
        firstName: 'Ernest', lastName: 'Abcde', quantity: 3,
        email: 'e.abcde@ern.com', password: 'B1gt3sTAcc0un!',
        contactTime: '2024-07-09T12:00',
      },
    });
    expect(ordersData.ok()).toBeTruthy();
    expect(page.getByText('Order submitted successfully')).toBeVisible;
  });

  test('does not submit an incomplete order request', async ({ page }) => {
    page.getByLabel('First Name').fill('Ernest');
    page.getByLabel('Last Name').fill('Abcde');
    page.getByLabel('Quantity').fill('3');
    page.getByLabel('Email').fill('e.abcde');
    page.getByLabel('Password').fill('B1gt3sTAcc0un!');
    page.getByLabel('Contact Time').fill('2024-07-09T12:00');
    const submitButton = page.getByText('Submit');
    await submitButton.click();

    const formError = page.getByText(
      "Please include an '@' in the email address."
    );
    expect(formError).toBeTruthy();
  });
});
```

```bash
npx playwright test
```

Genera un `index.html` con los resultados (commiteable o no, según prefieras).

## Nightwatch

Basado en **Selenium WebDriver**, el veterano de la automatización de browsers. Skills de Selenium transfieren. Integra con **SauceLabs** para cross-platform testing.

```bash
npm init nightwatch
npm i @nightwatch/apitesting --save-dev
```

```typescript
// nightwatch.conf.cjs con el plugin apitesting

// user-info.test.ts
import { ExtendDescribeThis } from 'nightwatch';
import { orderResponseData } from '../src/mocks/orders';

interface CustomThis {
  customerPortalUrl: string;
  submitButton: string;
}

describe('User Info', function (this: ExtendDescribeThis<CustomThis>) {
  this.customerPortalUrl = 'http://localhost:8080/';
  this.submitButton = '*[type=submit]';
  let server;

  beforeEach(async function (this: ExtendDescribeThis<CustomThis>, browser, client) {
    server = await client.mockserver.create();
    server.setup((app) => {
      app.get('/v1/orders/', (_, res) => {
        res.status(204).data(orderResponseData);
      });
      app.post('/v1/orders/', (_, res) => {
        res.status(204).data([]);
      });
    });
    await server.start(3000);
    browser.navigateTo(this.customerPortalUrl!);
  });

  afterEach(() => {
    server.close();
  });

  it('loads the orders table', async (browser, client) => {
    client.assert.strictEqual(
      server.route.get('/v1/orders').calledOnce,
      true,
      'called once'
    );
    expect(browser.element.findByText('Dog stuff')).to.exist;
  });

  it('submits a successful order request', (browser, client) => {
    browser.element.findByLabelText('First Name').setValue('Ernest');
    browser.element.findByLabelText('Last Name').setValue('Abcde');
    browser.element.findByLabelText('Quantity').setValue('3');
    browser.element.findByLabelText('Email').setValue('e.abcde@ern.com');
    browser.element.findByLabelText('Password').setValue('B1gt3sTAcc0un!');
    browser.element.findByLabelText('Contact Time').setValue('2024-07-09T12:00');
    browser.element.findByText('Submit').click();

    client.assert.strictEqual(
      server.route.post('/v1/orders').calledOnce,
      true,
      'called once'
    );
    expect(browser.element.findByText('Order submitted successfully')).to.exist;
  });

  it('does not submit an incomplete order request', (browser) => {
    browser.element.findByLabelText('First Name').setValue('Ernest');
    browser.element.findByLabelText('Last Name').setValue('Abcde');
    browser.element.findByLabelText('Quantity').setValue('3');
    browser.element.findByLabelText('Email').setValue('e.abcde');
    browser.element.findByLabelText('Password').setValue('B1gt3sTAcc0un!');
    browser.element.findByLabelText('Contact Time').setValue('2024-07-09T12:00');
    browser.element.findByText('Submit').click();
    const errorMessage = browser.element.findByText(
      "Please include an '@' in the email address."
    );
    expect(errorMessage).to.exist;
  });
});
```

```bash
npx nightwatch nightwatch-tests
```

## Comparativa entre paquetes

| Métrica | Cypress | Playwright | Nightwatch |
|---|---|---|---|
| Establecido | El más | Creciendo rápido | Veterano (Selenium) |
| Velocidad devs | Bueno | Bueno | Bueno (conocimiento Selenium) |
| Velocidad CI | Buena | Buena | Buena |
| Documentación | Muy buena | Muy buena | Buena |
| Comunidad | Grande | Creciendo | Establecida (Selenium) |
| Browsers | Chromium-based | Chromium, Firefox, WebKit | WebDriver (todos) |

**Lo que más importa**: lo rápido que tu equipo puede escribir y mantener tests. Si con uno escriben 10% más rápido, eso suma a largo plazo.

> [!tip] Instala como devDependency
> Asegúrate de instalar las herramientas de testing como **devDependencies**. No las quieres en el bundle de producción. Eso hace el bundle más grande y abre superficie de ataque.

## La pirámide de testing

> [!quote] Ethan Brown sobre la pirámide
> La sabiduría convencional: **pocos e2e tests porque son caros**. Cypress está cambiando esto, pero el principio sigue: **invierte en proporción a coste y valor**. Cypress cambia el ratio, pero el principio no desaparece.

```
        /\          ← pocos e2e tests (caros pero alto valor)
       /  \
      /────\       ← integration tests (medio)
     /      \
    /────────\     ← muchos unit tests (baratos y rápidos)
```

- **Unit tests**: la base. Muchos, rápidos, baratos.
- **Integration tests**: en el medio. Algunos, cubren interacciones.
- **E2e tests**: la cima. Pocos, lentos, caros, pero cubren flujos completos.

## Gherkin + Cucumber

Para involucrar a Producto en escribir tests:

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

> [!tip] Naming es señal
> Si luchas por ponerle un buen nombre a un test, **quizás no estás escribiendo buenos test cases**. Tenlo en mente al revisar PRs.

## Próximos pasos

- [[26-estrategias-de-despliegue|Estrategias de despliegue]]: release dates, version releases, blue-green, canary, rollbacks y hotfixes.
