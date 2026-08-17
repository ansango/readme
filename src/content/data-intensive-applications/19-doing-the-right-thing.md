---
title: "Doing the right thing"
description: "Ética y sociedad: bias en predictive analytics, privacidad, surveillance, legislación. El lado humano de los sistemas de datos"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [datos, etica, privacidad, bias, surveillance, regulacion]
---

# Doing the right thing

> [!abstract] Resumen
> La 2ª edición del libro añade este capítulo (nuevo en la versión de 2026) que reflexiona sobre el **lado humano** de los sistemas de datos. Cubre el bias en predictive analytics, la privacy, la surveillance, la legislación y los criterios éticos para los ingenieros de datos.

## Por qué importa la ética

El libro abre con una observación directa:

> "Los sistemas de datos no son neutrales. Codifican valores, decisiones y prioridades."

```text
Un sistema de datos decide:

  - Qué datos se recogen.
  - Qué se considera "correcto".
  - Quién tiene acceso.
  - Quién se beneficia.
  - Quién sale perdiendo.
```

> [!note> La neutralidad es un mito
> El libro es claro: cualquier sistema de datos **toma partido**. Mejor ser consciente.

## Predictive analytics

El libro distingue los **predictive analytics** (pronóstico) de los **prescriptive** (decisión):

```text
Predictive:    "Este cliente probablemente dejará el servicio."
Prescriptive:  "Entonces le ofrecemos un descuento."
```

> [!tip> El deslizamiento es peligroso
> Predecir es **informar**. Recomendar / decidir es **actuar**. El deslizamiento de uno al otro es sutil pero transformador.

## Bias y discriminación

El libro describe los **tipos de bias** que afectan a los modelos:

### 1. Bias histórico

El modelo aprende del pasado, y el pasado tiene discriminaciones.

```text
Ejemplo:

  Datos: hiring histórico (1950-2020).
  Realidad: discriminaba a mujeres.
  Modelo aprendido: "los varones son mejores candidatos".

El modelo perpetúa la discriminación.
```

### 2. Bias de muestreo

Los datos no son representativos.

```text
Sesgo de muestreo:

  Encuesta en una ciudad rica.
  Conclusión: "la riqueza media es alta".

Realidad: excluiste a los que no viven en esa ciudad.
```

### 3. Bias de medición

Se mide mal lo que se quiere medir.

```text
Bias de medición:

  Medición: "tiempo en la página".
  Realidad: "tiempo hasta que cierras la pestaña".

Abre otra pestaña y deja la página abierta: el "engagement" sube.
```

### 4. Bias de feedback loop

Las decisiones del modelo afectan los datos futuros.

```text
Feedback loop:

  Modelo: "los barrios X pagan más tarde"
  Decisión: negar crédito a X
  Resultado: X paga aún más tarde (no tiene crédito)
  Confirmación: el modelo "tenía razón"
```

> [!warning] Los feedback loops son el problema más difícil
> El modelo **se refuerza a sí mismo**. Sin intervención externa, las predicciones se vuelven profecías autocumplidas.

## Responsabilidad y accountability

El libro pregunta: **¿quién es responsable cuando una decisión automatizada sale mal?**

```text
Cadena de decisiones:

  Data scientist: entrena el modelo.
  Product manager: decide usarlo.
  Engineer: lo deploys.
  Manager: lo opera.
  Ejecutivo: lo aprueba.

Si el modelo discrimina, ¿quién responde?
```

> [!tip> El libro propone el "test de la prensa"
> Compara cualquier sistema automatizado con: ¿cómo se vería esto en una **portada de periódico**? Si la respuesta te incomoda, replantear.

## Feedback loops

El libro describe los **feedback loops** como mecanismo subyacente de muchos problemas:

```text
Feedback loop nocivo:

  Modelo predice Y.
  Sistema actúa sobre Y.
  Datos futuros reflejan la acción.
  Modelo re-entrenado confirma Y.
  
  (Y puede ser una discriminación social)
```

### Cómo romper los loops

- **Auditorías externas**: revisión periódica por terceros.
- **Límites al modelo**: el modelo informa, no decide.
- **Datos de "counterfactual"**: medir qué habría pasado sin la decisión.
- **Diseño con la comunidad**: involucrar a los afectados.

## Privacy y tracking

El libro dedica una sección importante a la **privacy**.

### Surveillance

El libro describe el **surveillance capitalism** (Zuboff):

```text
Surveillance capitalism:

  Recoger datos de comportamiento.
  Inferir perfiles.
  Vender perfiles a anunciantes.
  Optimizar la persuasión.

La privacy es el precio.
```

### Consentimiento

El libro es crítico con cómo se obtiene el consentimiento:

```text
Consentimiento real:

  - Informado: el usuario sabe qué se recoge.
  - Voluntario: sin coerción.
  - Específico: para este uso, no genérico.
  - Reversible: el usuario puede retractarse.

Consentimiento habitual:

  - Implicado (long TOS, nadie lee).
  - Forzado (sin esto, no accedes).
  - Amplio (cualquier uso futuro).
  - Irreversible (en la práctica).
```

> [!tip> El libro es técnicamente preciso
> La 2ª edición incluye análisis de GDPR, CCPA, AI Act europeo, y cómo los sistemas de datos deben adaptarse.

```{tip}
La anonimización funciona menos de lo que parece:

  Datos: nombre, edad, código postal.
  Identifique: "Ana, 32, 28013" → única en España.

Unos pocos campos son suficientes para re-identificar.
```

## Datos como asset y poder

El libro articula una observación incómoda: **los datos son poder**.

```text
Datos como poder:

  - Quien tiene datos, decide.
  - Quien decide, determina el futuro.
  - Data brokers acumulan, sin accountability.
  - Los individuos pierden control.
```

### Tensiones

- **Privacidad vs conveniencia**: ¿preferimos un servicio que sabe todo de nosotros?
- **Open data vs commercial data**: ¿qué se publica, qué se vende?
- **Personalización vs discriminación**: ¿preferimos un mundo a medida o uno justo?

> [!tip> La transparencia es lo único que funciona
> El libro es claro: la única defensa eficaz es la **transparencia**. Los sistemas que operan en la sombra pierden legitimidad.

## Data as assets, data as power

El libro distingue dos modelos:

### Modelo anglosajón

```text
Datos como propiedad:

  - Quien los recoge, los posee.
  - Los vende a quien quiera.
  - Individual consent.

Problemas: asimetría, falta de transparencia.
```

### Modelo europeo

```text
Datos como bien común:

  - El individuo tiene derechos sobre sus datos.
  - Las empresas son custodios.
  - El estado regula para proteger.

Limitaciones: la implementación es difícil.
```

> [!note> El libro describe el RGPD
> El Reglamento General de Protección de Datos (GDPR) europeo codifica este segundo modelo. Es la legislación más ambiciosa del mundo.

## Remembering the Industrial Revolution

El libro hace una analogía histórica poderosa:

```text
Industrial Revolution (s. XIX):

  - Trabajo: explotado.
  - Trabajadores: niños, jornadas 16h.
  - Estado: laissez-faire.
  - Cambio: regulación, sindicatos, derechos.

Data Revolution (s. XXI):

  - Datos: explotados.
  - Usuarios: perfiles, distractores.
  - Estado: laissez-faire.
  - Cambio: ¿regulación, derechos, accountability?
```

> [!tip> El libro es optimista
> El cambio es **posible**. La revolución industrial tardó décadas en corregirse. La revolución de datos puede corregirse **más rápido**, si la voluntad política existe.

## Legislation y self-regulation

El libro discute la **legislación** como mecanismo:

```text
Legislación:

  Ventajas:
    - Aplica a todos.
    - Tiene dientes.
    - Define límites.

  Limitaciones:
    - Llega tarde a la tecnología.
    - Es global por jurisdicción.
    - La regulación mata innovación.
```

### Self-regulation

```text
Self-regulation:

  - Códigos de ética.
  - Certificaciones.
  - Auditorías.
  - Industry standards.

Problema: sin enforcement, los free-riders ganan.
```

## Responsabilidad del ingeniero

El libro cierra con la pregunta ética directa:

> "Como ingenieros de datos, ¿qué decisiones tomamos y por qué?"

```text
Cuestiones éticas:

  - ¿Este modelo discrimina?
  - ¿Estos datos tienen consentimiento?
  - ¿La segmentación es fair?
  - ¿Los afectados saben que están siendo procesados?
  - ¿Quién audit?
```

> [!tip> No eres neutral
> El libro es claro: **no eres neutral**. Las decisiones técnicas tienen consecuencias sociales. Reconocerlo es el primer paso.

## Resumen en tres frases

- Los sistemas de datos **no son neutrales**: codifican valores, sesgos y decisiones.
- El **bias** se manifiesta de muchas formas, y los **feedback loops** pueden perpetuar discriminaciones.
- La **legislación** (GDPR, AI Act) y la **self-regulation** son complementarias. La transparencia es la base de todo.

## Próximos pasos

- [[20-glosario-y-referencias|Glosario y referencias]]: glosario del libro, bibliografía ampliada y lecturas recomendadas para profundizar.
- [[21-epilogo-y-claves|Epílogo y claves]]: cierre de la wiki. Las ideas recurrentes, las claves y cómo seguir.
