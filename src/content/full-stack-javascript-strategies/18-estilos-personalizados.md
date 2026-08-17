---
title: "Estilos personalizados"
description: "Accesibilidad en frontend (aria labels, semantic HTML, forms accesibles), consistencia de diseños, temas custom con MUI, responsive design, imágenes y CSS"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [javascript, fullstack, frontend, react, accessibility, styling, responsive, mui]
---

# Estilos personalizados

> [!abstract] Resumen
> Esta nota cubre las decisiones de estilo y accesibilidad en el frontend: por qué accesibilidad desde el día uno (es legal bajo ADA), cómo hacer forms accesibles con React Hook Form y MUI, mantener consistencia en los diseños, custom themes con MUI, responsive design (mobile-first, breakpoints, imágenes), y las herramientas para verificar todo (Chrome DevTools, Lighthouse, axe-core).

## Accesibilidad primero

La accesibilidad puede parecer un afterthought cuando se está sacando un MVP a presión, pero es **tan importante como el mobile design**. Razones:

- **Acceso justo a la información** para personas con discapacidad.
- **Requisito legal** bajo la Americans with Disabilities Act (ADA).

Aunque MUI trae muchas features de accesibilidad, tú eres responsable de usarlas:

- **aria labels** en elementos interactivos.
- **alt text** en imágenes.
- **Semantic HTML** (`<section>`, `<article>`, `<aside>`) en lugar de `<div>` cuando aplica.
- **Keyboard navigation** funcional.

```html
<button aria-label="Cancel" onClick={onCancel}>Cancel</button>

<img
  src="https://images.unsplash.com/photo-1497531551184-06b252e1bee1"
  alt="Multi-colored hot air balloon with three people in the basket in the sky"
/>

<h1>Welcome to the Test Store</h1>
```

> [!tip] Semántica > divs
> Si tus componentes son todo `<div>`, replantéate usar elementos semánticos. No afecta al render visual, pero los screen readers y el teclado navegan mucho mejor.

Para forms: instrucciones claras, feedback útil con errores y success messages. El contenido estático debe ser fácil de encontrar para screen readers porque suele tener info importante que no deben perderse.

## Form accesible

Forms accesibles son críticos porque permiten a los usuarios tomar acción. Si alguien no puede usar o entender un form, no puede hacer pagos, actualizar info personal, ni solicitar servicios.

Instala React Hook Form:

```bash
npm install react-hook-form
```

Crea `src/elements/SearchBar.tsx`:

```typescript
import { Input, InputAdornment, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';

export type SearchBarProps = {
  name: string;
  onSubmitSearch: (searchText: string) => void;
};

const FullWidthForm = styled.form`
  width: 450px;
  @media (max-width: 500px) {
    width: 100%;
  }
`;

const SearchBar = (props: SearchBarProps) => {
  const { onSubmitSearch } = props;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const searchFieldInputProps = {
    maxLength: 15,
    minLength: 3,
  };

  return (
    <FullWidthForm
      aria-label={`${props.name} search form`}
      onSubmit={handleSubmit(onSubmitSearch)}
    >
      <InputLabel htmlFor="search">Search Input</InputLabel>
      <Input
        placeholder={`Search ${props.name}...`}
        type="search"
        fullWidth
        inputProps={searchFieldInputProps}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
        {...register('search', { required: true, maxLength: 15, minLength: 3 })}
        aria-invalid={errors.search ? 'true' : 'false'}
      />
      {errors && errors.search && (
        <span>Search text doesn't meet requirements</span>
      )}
    </FullWidthForm>
  );
};

export default SearchBar;
```

Notas de accesibilidad:

- **aria-label** en el form para screen readers (no todo elemento lo necesita, solo los interactivos donde el texto visible no es suficiente).
- **type="search"** aporta semántica.
- **aria-invalid** indica al screen reader si el input tiene errores.
- No hay botón Submit: el form se submitea con Enter, que es el comportamiento por defecto y accesible.

### Validación con schemas

Para validaciones más robustas y reusables, usa un schema con **Yup**, **Zod** o **Joi**:

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup
  .object({
    searchText: yup.string().min(3).max(15).required(),
  })
  .required();

const SearchBar = (props: SearchBarProps) => {
  const {
    register, handleSubmit, formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
  // ...
};
```

> [!tip] Trabaja con Diseño en mensajes de error
> Hay distintas opiniones sobre cuándo mostrar errores (inline al focus, al submit, en bloque). Discute con Diseño qué espera el usuario. Tú aportas qué errores pueden venir del backend.

## Verificar accesibilidad

### Chrome DevTools

Chrome tiene herramientas para evaluar accesibilidad. **Accessibility tab** muestra cómo los elementos están agrupados, los labels y la funcionalidad. Puedes ver el **orden de tab** que sigue el usuario navegando solo con teclado.

### Lighthouse

Open source, audita la app en performance, accesibilidad y más. **Lighthouse** te da una lista concreta de qué mejorar. Útil para demos a Producto y stakeholders.

```bash
npm install -g lighthouse
lighthouse http://localhost:5173/ --output-path=./report.json --output json
```

> [!warning] Local != producción
> Lighthouse en local puede dar resultados muy distintos a producción (assets sin comprimir, código sin minificar, configs no optimizados). Para tests representativos, **haz un build de producción local y corre Lighthouse sobre ese build**.

### axe-core

Ligero, se puede añadir al app para testing automatizado durante desarrollo. Encuentra reglas de accesibilidad que se suelen pasar por alto.

```typescript
import axe from 'axe-core';

axe.run(document, (err, results) => {
  if (err) throw err;
  console.log(results);
});
```

Configurable para correr solo reglas WCAG específicas o targets concretos. Útil para compliance audits antes de releases.

### i18n

La mayoría de apps se usan en más idiomas. Crea archivos por idioma. Las traducciones pueden requerir más espacio, lo que afecta al layout.

## Consistencia en diseños

Mantener consistencia con múltiples pantallas, plataformas (Figma, Miro) y diseñadores es difícil. Las inconsistencias se cuelan: cuatro diseños para el mismo modal, paddings diferentes en botones.

> [!tip] Tú tienes que marcar las inconsistencias
> Cuando veas una inconsistencia (sutil como un padding, importante como colores en una sección), coméntala. Tu trabajo es mantener la implementación alineada.

Trabaja con el equipo en cómo se implementan estilos:

- Inline styles vs styled components vs CSS classes vs archivos por componente.
- No hay respuesta única; lo importante es **mantener consistencia**.

Documenta las convenciones. Cuando algo cambia, queda en el código como una forma de version control de los diseños. Cualquier dev debería poder explicar dónde está cambiando qué.

## Temas custom con MUI

Ya tienes `theme.tsx` configurado. Actualízalo con cualquier cambio que afecte a MUI components. Ejemplo: customizar un botón para que coincida con la marca.

```typescript
const theme = createTheme({
  palette: {
    primary: { main: blue[900] },
    secondary: { main: orange[400] },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#4C4C4C',
          borderRadius: '4px',
          background: '#B4CD93',
        },
      },
    },
  },
});
```

> [!warning] Mezcla de estilos globales y locales
> Con el tiempo, theme + estilos locales se mezclan. Cuando Diseño pida cambios globales, pregunta: "¿afecta a estilos custom ya hechos?" Esos cambios suelen requerir más trabajo del que Diseño anticipa.

### Herramientas de documentación

- **Storybook**, **Ladle**, **React Cosmos**: documentación interactiva de componentes. Facilitan que devs y Diseño encuentren componentes existentes y vean todas sus variantes. Es el "puente dev-diseño" para componentes compartidos.

## Responsive design

Mobile-first es lo ideal, pero en apps legacy a veces solo hay desktop y la responsiveness se añade después. Si ese es tu caso, **pregunta a Producto y Diseño si debe haber mobile antes de empezar**.

### Implementación

- **Breakpoints con media queries**: switchear estilos o componentes según tamaño.

```typescript
const StyledHeader = styled.header`
  display: flex;
  justify-content: space-between;
  @media (max-width: 500px) {
    flex-direction: column-reverse;
    width: 100%;
  }
`;
```

- **Componentes separados para mobile** cuando la estructura cambia mucho.
- **CSS layout structures** específicas para móvil.

### Responsive en componentes desde el inicio

Crea componentes con responsiveness en mente desde el principio. Aunque no tengas los diseños mobile, piensa en cómo se va a comportar en pantallas más pequeñas.

### UX considerations

- **Hover states** no funcionan en touch → diseña estados activos.
- **Contenido oculto en móvil** puede ser inaccesible para algunos usuarios.
- **Imágenes responsive** con `srcset`:

```html
<img
  srcset="tulip-field-320w.jpg, tulip-field-480w.jpg 1.5x, tulip-field-640w.jpg 2x"
  src="tulip-field-640w.jpg"
  alt="A field of tulips blooming"
/>
```

Mantén **aspect ratio** y usa **SVG** para gráficos e ilustraciones (scaling sin pérdida).

### Web Components

Custom elements con shadow DOM, mantienen estilos y funcionalidad aislados. Algo a explorar en organizaciones con problemas de style clashing.

## Próximos pasos

- [[19-manejo-de-errores-en-frontend|Manejo de errores en frontend]]: error boundaries (app/layout/component level), error components, user validation, API errors, logging.
