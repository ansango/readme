---
title: "Transforms, transitions y animation"
description: "Cómo animar y transformar elementos. Transform 2D, 3D, perspective, transiciones, keyframes. La parte vibrante de CSS"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [css, transform, transition, animation, keyframes]
---

# Transforms, transitions y animation

> [!abstract] Resumen
> Esta nota cubre los capítulos 17, 18 y 19 del libro: cómo **animar y transformar** elementos. Transform 2D y 3D, perspective, transiciones entre estados, y animaciones con keyframes. Es la parte vibrante de CSS: la que da movimiento y vida a las interfaces.

## El trio de movimiento

CSS tiene tres mecanismos para el movimiento:

```text
1. transform:

  - Cambia la forma/posición del elemento.
  - Instantáneo por defecto.
  - 2D y 3D.

2. transition:

  - Anima una propiedad de un estado a otro.
  - Disparado por cambios de estado (hover, focus, etc.).
  - Simple y declarativo.

3. animation:

  - Anima con keyframes.
  - Ciclos infinitos.
  - Más complejo pero más flexible.
```

## Transform 2D

```css
.box {
    transform: translate(50px, 100px);
    transform: translateX(50px);
    transform: translateY(100px);
    
    transform: rotate(45deg);
    transform: rotate(0.5turn);
    
    transform: scale(1.5);
    transform: scale(0.5, 1.5);
    transform: scaleX(0.5);
    transform: scaleY(1.5);
    
    transform: skew(10deg, 20deg);
    transform: skewX(10deg);
    transform: skewY(20deg);
}
```

```text
Transform 2D:

  - translate(x, y): mover.
  - rotate(deg): rotar.
  - scale(x, y): escalar.
  - skew(x, y): sesgar.
  - matrix(6 variables): definir a mano.
```

### Combinando transforms

```css
.box {
    transform: translate(50px, 50px) rotate(45deg) scale(1.5);
}
```

```text
Combinación:

  - El orden importa: de izquierda a derecha.
  - Pero se aplican de derecha a izquierda.
  - translate rotate scale: primero scale, luego rotate, luego translate.
  - El libro enfatiza: el orden es **importante**.
```

> [!tip] Translate primero
> El libro recomienda: usa `translate()` antes de `rotate()` y `scale()`. Si rotas primero, el translate se aplica en el eje rotado.

## Transform-origin

```css
.box {
    transform-origin: center;        /* default */
    transform-origin: 50% 50%;
    transform-origin: top left;
    transform-origin: 50px 100px;
    transform-origin: 0 0;           /* top-left */
}
```

```text
transform-origin:

  - El punto de origen del transform.
  - Default: center (50% 50%).
  - Para rotate: dónde gira.
  - Para scale: dónde se mantiene fijo.
  - Para translate: no tiene efecto.
```

## Transform 3D

```css
.box {
    transform: translateZ(100px);
    transform: translate3d(100px, 200px, 50px);
    
    transform: rotateX(45deg);
    transform: rotateY(45deg);
    transform: rotateZ(45deg);
    transform: rotate3d(1, 1, 1, 45deg);
    
    transform: scaleZ(2);
    transform: scale3d(1, 1, 2);
    
    transform: perspective(500px);
}
```

```text
Transform 3D:

  - translateZ, translate3d: deepth.
  - rotateX, rotateY, rotateZ: rotación en ejes.
  - scaleZ: scale en Z.
  - perspective: la distancia del observador.
```

### perspective

```css
.parent {
    perspective: 1000px;     /* perspectiva del padre */
    perspective-origin: 50% 50%;
}

.child {
    transform: rotateY(45deg);  /* gira en Y */
}
```

```text
perspective:

  - En el padre: perspectiva global.
  - En el transform: perspective(500px) para un elemento.
  - Determina la "profundidad" del 3D.
  - Valores altos: menos distorsión.
  - Valores bajos: más dramático.
```

### transform-style

```css
.parent {
    transform-style: preserve-3d;   /* los hijos mantienen 3D */
}

.child {
    transform: rotateY(45deg);
}
```

```text
transform-style:

  - flat: el padre colapsa a 2D.
  - preserve-3d: los hijos mantienen 3D.
  - Sin preserve-3d, los hijos se aplanan.
  - Necesario para cubos, prismas, etc.
```

### backface-visibility

```css
.card {
    transform-style: preserve-3d;
    transition: transform 1s;
}

.card.flipped {
    transform: rotateY(180deg);
}

.card-inner {
    backface-visibility: hidden;  /* oculta la cara trasera */
}
```

```text
backface-visibility:

  - visible: default.
  - hidden: oculta la cara trasera.
  - Útil para cards que se voltean.
```

## Transiciones

```css
.button {
    background: blue;
    color: white;
    transition: background 0.3s ease, color 0.3s ease;
}

.button:hover {
    background: red;
    color: yellow;
}
```

```text
Transition:

  - transition: property duration timing-function delay.
  - Anima una propiedad de un estado a otro.
  - Disparado por cambios de estado (hover, focus, class change).
  - Solo anima propiedades interpolables.
```

### Propiedades individuales

```css
.element {
    transition-property: color;
    transition-property: color, background, transform;
    transition-property: all;     /* todas las propiedades */
    transition-property: none;    /* ninguna */
    
    transition-duration: 0.3s;
    transition-duration: 300ms;
    
    transition-timing-function: linear;
    transition-timing-function: ease;
    transition-timing-function: ease-in;
    transition-timing-function: ease-out;
    transition-timing-function: ease-in-out;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    
    transition-delay: 0.5s;
}
```

```text
Transition:

  - property: qué animar.
  - duration: cuánto tarda.
  - timing-function: cómo se ve la animación.
  - delay: cuándo empieza.
  - shorthand: transition: all 0.3s ease.
```

### transition shorthand

```css
.element {
    transition: opacity 0.3s ease;
    transition: opacity 0.3s ease, transform 0.5s ease-in-out;
    transition: all 0.3s ease;
    transition: none;
}
```

### Timing functions

```css
.element {
    /* keywords */
    transition-timing-function: linear;
    transition-timing-function: ease;          /* default */
    transition-timing-function: ease-in;
    transition-timing-function: ease-out;
    transition-timing-function: ease-in-out;
    transition-timing-function: step-start;
    transition-timing-function: step-end;
    
    /* custom */
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-timing-function: steps(4, end);
}
```

```text
Timing functions:

  - linear: velocidad constante.
  - ease: default, suave.
  - ease-in: arranca lento.
  - ease-out: termina lento.
  - ease-in-out: ambos.
  - cubic-bezier: custom.
  - steps: discreto.
```

### cubic-bezier

```css
.element {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

```text
cubic-bezier(x1, y1, x2, y2):

  - 4 valores de 0 a 1.
  - x1, x2: tiempo.
  - y1, y2: progreso.
  - Herramientas: cubic-bezier.com, easings.net.
```

## Propiedades animables

```text
Animables:

  - Color, background, border.
  - Transform, opacity, filter.
  - Width, height, margin, padding.
  - font-size, line-height, letter-spacing.
  - top, right, bottom, left.
  - Box-shadow, text-shadow.

NO animables:

  - display (de none a block no se puede).
  - visibility (sí).
  - font-family.
  - z-index (sí, pero no se ve).
  - position (no).
```

> [!tip] will-change para performance
> El libro recomienda: para animaciones pesadas, usa `will-change: transform` o `will-change: opacity`. Le dice al navegador que prepare la GPU.

## Animaciones con keyframes

```css
@keyframes fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.element {
    animation: fade-in 1s ease forwards;
}
```

```text
@keyframes:

  - Define los estados de la animación.
  - from (0%) / to (100%).
  - 0%, 50%, 100% para más detalle.
  - from se llama también "from".
  - to se llama también "to".
```

### Animation shorthand

```css
.element {
    animation-name: fade-in;
    animation-duration: 1s;
    animation-timing-function: ease-in-out;
    animation-delay: 0.5s;
    animation-iteration-count: infinite;  /* o un número */
    animation-direction: alternate;       /* normal, reverse, alternate, alternate-reverse */
    animation-fill-mode: forwards;        /* none, forwards, backwards, both */
    animation-play-state: running;        /* running, paused */
}
```

```text
Animation shorthand:

  name | duration | timing-function | delay | iteration-count | direction | fill-mode | play-state.
```

### Keyframes intermedios

```css
@keyframes bounce {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-50px);
    }
    100% {
        transform: translateY(0);
    }
}

.ball {
    animation: bounce 1s ease infinite;
}
```

```text
Multi-step:

  - 0%, 50%, 100% para tres puntos.
  - 0%, 25%, 50%, 75%, 100% para cinco.
  - Cualquier número entre 0 y 100%.
```

### animation-iteration-count

```css
.element {
    animation-iteration-count: 1;          /* default */
    animation-iteration-count: 3;          /* tres veces */
    animation-iteration-count: infinite;   /* infinito */
}
```

### animation-direction

```css
.element {
    animation-direction: normal;           /* default */
    animation-direction: reverse;           /* al revés */
    animation-direction: alternate;         /* ida y vuelta */
    animation-direction: alternate-reverse; /* al revés y vuelta */
}
```

```text
animation-direction:

  - normal: 0% → 100%.
  - reverse: 100% → 0%.
  - alternate: 0% → 100% → 0% → 100% ...
  - alternate-reverse: 100% → 0% → 100% → 0% ...
```

### animation-fill-mode

```css
.element {
    animation-fill-mode: none;       /* default */
    animation-fill-mode: forwards;    /* mantiene el último estado */
    animation-fill-mode: backwards;   /* aplica el primer estado durante el delay */
    animation-fill-mode: both;        /* forwards + backwards */
}
```

```text
animation-fill-mode:

  - none: vuelve al estado original.
  - forwards: mantiene el último estado.
  - backwards: aplica el primer estado durante el delay.
  - both: ambos.
```

## animation composition

```css
@keyframes a {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes b {
    from { transform: translateX(0); }
    to { transform: translateX(100px); }
}

.element {
    animation: a 1s, b 1s;  /* múltiples animaciones */
}
```

```text
Composición:

  - Múltiples animaciones separadas por coma.
  - animation-composition: replace, add, accumulate.
  - Útil para combinar movimientos.
```

## prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
    .element {
        animation: none;
        transition: none;
    }
}
```

```text
prefers-reduced-motion:

  - Media query del sistema.
  - reduce: usuario prefiere menos movimiento.
  - increase: usuario quiere más.
  - no-preference: sin preferencia.
  - Accesibilidad: respeta siempre.
```

> [!tip] Respetar la preferencia del usuario
> El libro es claro: siempre que uses animaciones, respeta `prefers-reduced-motion`. Usuarios con vestibular disorders se marean con animaciones.

## Trinkets y patrones

### Hamburger menu

```css
.hamburger {
    width: 30px;
    height: 24px;
    position: relative;
}

.hamburger span {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: #333;
    transition: transform 0.3s, opacity 0.3s;
}

.hamburger span:nth-child(1) { top: 0; }
.hamburger span:nth-child(2) { top: 10px; }
.hamburger span:nth-child(3) { top: 20px; }

.hamburger.open span:nth-child(1) {
    transform: translateY(10px) rotate(45deg);
}

.hamburger.open span:nth-child(2) {
    opacity: 0;
}

.hamburger.open span:nth-child(3) {
    transform: translateY(-10px) rotate(-45deg);
}
```

### Skeleton loading

```css
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.skeleton {
    background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
}
```

### Modal fade-in

```css
.modal {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s, transform 0.3s;
}

.modal.open {
    opacity: 1;
    transform: translateY(0);
}
```

### Button hover effect

```css
.button {
    position: relative;
    overflow: hidden;
}

.button::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.button:hover::before {
    transform: translateX(0);
}
```

### Spinner

```css
@keyframes spin {
    to { transform: rotate(360deg); }
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #ccc;
    border-top-color: #333;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```

### Card flip

```css
.card {
    perspective: 1000px;
}

.card-inner {
    transform-style: preserve-3d;
    transition: transform 0.6s;
}

.card.flipped .card-inner {
    transform: rotateY(180deg);
}

.card-front, .card-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
}

.card-back {
    transform: rotateY(180deg);
}
```

## Errores comunes

```css
/* Mal: transition en propiedad no animable */
.element {
    transition: display 0.3s;  /* no funciona */
}

/* Mal: keyframe con propiedades que no se interpolan */
@keyframes bad {
    from { display: none; }
    to { display: block; }
}

/* Mal: animation sin fill-mode */
@keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
}

.element {
    animation: fade 1s;
    /* Vuelve a opacity: 1 original, no mantiene el final */
}

/* Mal: transition que se interrumpe */
.element {
    transition: transform 0.3s;
}

.element:hover {
    transform: scale(1.2);
}

/* Si el mouse sale antes de los 0.3s, vuelve */
```

## will-change

```css
.element {
    will-change: transform;
    will-change: opacity;
    will-change: transform, opacity;
}

.element.animating {
    will-change: auto;  /* desactivar cuando no se anima */
}
```

```text
will-change:

  - Le dice al navegador que prepare la GPU.
  - Mejora performance de animaciones.
  - Usar solo cuando se anima.
  - Quitar con will-change: auto después.
  - No abusar: cada will-change es memoria.
```

> [!tip] will-change con moderación
> El libro advierte: `will-change` no es gratuito. Cada elemento con will-change usa más memoria. Úsalo solo en animaciones pesadas.

## Resumen en tres frases

- **Transform** cambia la forma/posición del elemento. 2D (`translate`, `rotate`, `scale`, `skew`) y 3D (`rotateX`, `rotateY`, `rotateZ`, `perspective`).
- **Transition** anima una propiedad al cambiar de estado. Declarativa, simple, perfecta para hovers y estados.
- **Animation** con `@keyframes` es más flexible. Ciclos infinitos, multi-step, fill-mode. Para animaciones complejas.

## Próximos pasos

- [[16-filters-blending-clipping-masking|Filters, blending, clipping, masking]]: los efectos visuales avanzados. Filtros SVG (blur, brightness, contrast), modos de fusión, clip-path y máscaras.
