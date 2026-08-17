---
title: Feedback de usuario
description: "El último componente del sistema: cómo extraer feedback de los usuarios, diseñar el loop de feedback y conocer sus limitaciones"
date: 2026-08-17
mod: 2026-08-17
draft: false
tags: [ai, ai-engineering, feedback, evaluation, ux]
---

# Feedback de usuario

> [!abstract] Resumen
> Esta nota cubre la segunda mitad del capítulo 10: el **feedback de usuario**, el ingrediente que cierra el loop de mejora continua. Veremos por qué el feedback es diferente en AI engineering, cómo extraerlo de las conversaciones, las distintas formas de feedback (explícito, implícito, conversacional), cómo diseñar el loop y, sobre todo, sus limitaciones. La nota anterior ([[15-arquitectura-de-ai-engineering|Arquitectura]]) cubre la infraestructura que recoge, mueve y procesa ese feedback.

## Por qué el feedback es fundamental

El libro abre este bloque con una idea incómoda: **los modelos con los que cuentas hoy serán obsoletos en 6-12 meses**. Las APIs cambian, los modelos se deprecán, el tráfico se mueve. Si tu sistema no aprende de los usuarios, se queda atrás.

> [!quote] "Sin un loop de feedback, no tienes un producto de IA. Tienes una demo que envejece."
> El libro es tajante. La diferencia entre un sistema de IA y "un wrapper sobre una API" es que el primero aprende, el segundo no.

## Qué hace diferente al feedback en AI

El feedback en AI engineering es **distinto** del feedback clásico en varios sentidos:

### Es heterogéneo

En software clásico, el feedback es estructurado: clicks, conversiones, errores. En AI, el feedback aparece en:

- Texto libre del usuario.
- Patrones de uso (reformulaciones = insatisfacción).
- Reacciones a la salida del modelo.
- Respuestas a preguntas explícitas.

### Es ruidoso

Los usuarios no siempre saben lo que quieren. Muchos dan feedback contradictorio o impreciso.

### Es cargada emocional

Cuando un modelo falla, el usuario se frustra. Ese feedback es **señal**, pero viene mezclado con ruido emocional.

### Es asimétrica

Los usuarios que dan feedback **no son una muestra aleatoria** del total. Tienden a ser los más satisfechos o los más insatisfechos.

## Tipos de feedback

El libro distingue cuatro familias principales.

### 1. Feedback explícito

El usuario responde a una pregunta directa sobre la respuesta.

#### Thumbs up/down

El más simple. Después de la respuesta, dos botones.

**Ventajas**: fácil de implementar, alta cobertura.
**Limitaciones**: la mayoría no hace clic, los que hacen clic están sesgados.

> [!tip] Capturar el "no"
> Más útil que el thumbs up es capturar el **thumbs down con razón**. El usuario que dice "no" está señalando un problema concreto.

#### Calificación con estrellas

Más matizado que el thumb. Útil para respuestas creativas.

#### Texto libre

El usuario escribe una queja, sugerencia o corrección.

**Muy valioso pero muy poco frecuente**. Cuando alguien escribe, vale la pena leerlo en detalle.

#### Encuestas puntuales

Después de N interacciones, "¿cómo va todo?". Puede ser NPS, CSAT, o preguntas abiertas.

### 2. Feedback implícito

El usuario **no sabe** que está dando feedback. Está implícito en su comportamiento.

#### Señales positivas

- **Continuar la conversación**: el usuario no se fue.
- **Aceptar sugerencias**: el usuario copió/pegó la respuesta.
- **Marcar como favorito**.
- **Volver al día siguiente**: engagement sostenido.

#### Señales negativas

- **Reformular la misma pregunta**: la respuesta no resolvió.
- **Cambiar de tema abruptamente**: frustración.
- **Cerrar la conversación tras error**: signo claro.
- **Reportar el contenido**: feedback explícito aunque venga del comportamiento.

#### Patrones avanzados

- **Tiempo de lectura**: si la respuesta aparece en 2s y el usuario la lee 30s, va bien. Si la lee 2s, va mal.
- **Reformulación semántica**: embedding de la pregunta nueva vs original. Si es muy similar, la primera falló.

### 3. Feedback conversacional

El usuario **discute con el modelo** sobre su propia respuesta. Esto es único en AI.

#### Ejemplo

```
Modelo: "El cielo es verde."
Usuario: "No, el cielo es azul."
Modelo: "Tienes razón, me equivoqué. El cielo es azul."
```

Esa corrección es **oro puro**: tienes input, output incorrecto, y la corrección. Es exactamente el tipo de par que necesitas para mejorar.

#### Por qué es valioso

El usuario está haciendo el trabajo de anotación **gratis y con contexto**.

#### Por qué es difícil de capturar

- El usuario puede no querer corregir al modelo.
- El modelo puede no dejar que el usuario le corrija (alucinación con confianza).
- Conversaciones largas: hay que saber qué corrección aplicar a qué respuesta.

### 4. Feedback de sistema

Métricas técnicas que no necesitan al usuario.

- **Latencia**: si sube, la UX se resiente.
- **Tasa de error**: si la API falla, hay problema.
- **Coste**: si sube, el modelo de negocio se rompe.
- **Distribución de temas**: si los usuarios preguntan cada vez más sobre X, hay tendencia.

## Extraer feedback conversacional

El libro dedica una sección a esto porque es la técnica más infrautilizada.

### Cómo extraerlo

#### Con un modelo

Pasas la conversación a un LLM y le pides que extraiga:

```text
Analiza esta conversación y extrae:
1. ¿Hubo correcciones del usuario? (sí/no, cuáles)
2. ¿Hubo satisfacción explícita? (sí/no, dónde)
3. ¿Hubo frustración? (sí/no, señales)
4. ¿La respuesta final fue correcta? (sí/no/no sé)
```

#### Con heurísticas

Patrones simples:
- "No, ..." → corrección.
- "Sí, gracias" → satisfacción.
- "Otra vez" → frustración.
- "¿Puedes...?" → refinamiento.

#### Con clasificación

Entrenar un clasificador (pequeño y barato) que categorice cada turno.

### Cómo almacenarlo

Un dataset de feedback conversacional típico:

```json
{
  "conversation_id": "abc-123",
  "turns": [
    {"role": "user", "text": "¿Cuál es la capital de Francia?"},
    {"role": "assistant", "text": "Marsella."},
    {"role": "user", "text": "No, es París."},
    {"role": "assistant", "text": "Tienes razón, París."}
  ],
  "feedback": {
    "was_correct": false,
    "was_corrected": true,
    "user_satisfaction": "corrected",
    "extracted_at": "2024-11-15T10:30:00Z"
  }
}
```

### Cómo usarlo

- **Eval datasets**: las correcciones se convierten en ejemplos de evaluación.
- **Training data**: las correcciones, después de validad, son datos de fine-tuning.
- **Hard cases**: las correcciones suelen señalar casos donde el modelo falla más.

## Feedback design

El libro enfatiza que **el feedback se diseña**, no se recibe pasivamente.

### Cuándo preguntar

- **No después de cada mensaje**: cansa al usuario.
- **Sí cuando la respuesta es ambigua**: el modelo no está seguro.
- **Sí cuando la respuesta tiene coste**: enviar emails, ejecutar código.
- **Sí tras errores detectados**: tras una reformulación del usuario.

### Cómo preguntar

#### Preguntas cortas

Mejor "¿fue útil?" que "¿cómo calificarías esta respuesta del 1 al 10 considerando...".

#### Preguntas concretas

Mejor "¿fue correcto?" que "¿qué tal?".

#### Preguntas accionables

Mejor "¿qué cambiarías?" que "¿algún comentario?".

### Privacidad

El feedback recoge datos del usuario. Cuida:

- **Anonimización**: quitar PII antes de almacenar.
- **Retención**: no guardar feedback para siempre.
- **Visibilidad**: el usuario debe saber qué se recoge.
- **Derecho al olvido**: poder borrar su feedback.

> [!tip] Feedback es un activo, no un subproducto
> El libro propone tratar el feedback como un **dataset de primera clase**, con versioning, propietario, y análisis regular. No es un log más.

## Loop de feedback

El loop conecta el feedback con la mejora del sistema.

### Componentes del loop

1. **Recolección**: capturar feedback (logs, surveys, patrones).
2. **Procesamiento**: limpiar, anonimizar, estructurar.
3. **Análisis**: identificar patrones, problemas recurrentes.
4. **Acción**: corregir prompt, actualizar evaluación, fine-tunear.
5. **Medición**: ¿la acción mejoró las métricas?
6. **Repetición**.

### Frecuencia del loop

- **Tiempo real**: para safety y errores graves.
- **Diario**: para análisis de calidad.
- **Semanal**: para decisiones de producto.
- **Mensual**: para tendencias estratégicas.

### Quién hace cada parte

- **Ingenieros**: implementar la recolección.
- **Data scientists**: analizar patrones.
- **PM/Producto**: priorizar acciones.
- **Domain experts**: validar correcciones.

## Limitaciones del feedback

El libro cierra con una lista de **limitaciones** que conviene tener presentes para no sobrestimar el feedback.

### Selection bias

Los que dan feedback no son una muestra aleatoria. Tienden a estar en los extremos.

### Feedback users ≠ all users

Un usuario que da feedback negativo ruidoso puede no representar la mayoría silenciosa.

### Feedback de calidad difícil

¿Qué es "bueno" en una respuesta abierta? Los usuarios no siempre están bien situados para juzgar.

### Feedback de comportamiento, no de capacidad

El usuario juzga la experiencia, no la capacidad técnica. Una respuesta técnicamente brillante que el usuario no entiende puede merecer un thumbs down.

### Feedback ruidoso

Los usuarios son inconsistentes. El mismo usuario puede dar feedback contradictorio en días distintos.

### Feedback manipulado

Competidores, trolls, atacantes pueden dar feedback malintencionado para hundir tu sistema.

> [!warning] No todo feedback es bueno
> El libro es claro: el feedback es una **señal**, no la verdad. Combínalo con evaluación humana, AI as judge y métricas técnicas. Si un feedback contradice las métricas, no actúes en automático.

### Feedback loops negativos

Si el sistema ajusta prompts/respuestas en función del feedback, puede entrar en loops degenerativos:

- Feedback negativo → modelo más conservador.
- Conservadurismo → menos respuestas útiles → más feedback negativo.
- ...

El libro recomienda **revisar manualmente** los cambios antes de aplicarlos.

## Resumen en tres frases

- El feedback de usuario es la diferencia entre un producto que aprende y un wrapper sobre una API que envejece.
- Hay cuatro tipos: explícito, implícito, conversacional y de sistema. El conversacional es el más infrautilizado y el más valioso.
- El feedback es una señal ruidosa, no la verdad. Combínalo con evaluación y métricas, y ten cuidado con los loops degenerativos.

## Próximos pasos

- [[17-epilogo-y-claves|Epílogo y claves]]: cierre de la wiki. Las ideas recurrentes, las claves para un AI engineer en 2024-2025 y lecturas recomendadas para profundizar.
