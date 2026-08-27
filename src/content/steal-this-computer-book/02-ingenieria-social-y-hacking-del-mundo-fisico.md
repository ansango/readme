---
title: "Ingeniería social, ganzuado y hacking del mundo físico"
description: "Vectores de intrusión física y psicológica: principios de ingeniería social, técnicas y herramientas de ganzuado (lockpicking), exploración urbana y vulnerabilidades en radiofrecuencia"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, hacking, social-engineering, lockpicking, physical-security, urban-exploration, radio]
---

# Ingeniería social, ganzuado y hacking del mundo físico

> [!abstract] Resumen
> La seguridad de cualquier sistema digital es tan fuerte como su eslabón más débil, que con frecuencia radica en la psicología humana o en las barreras físicas perimetrales. Wallace Wang analiza cómo la mentalidad hacker trasciende el teclado para aplicarse al mundo real: la **ingeniería social** (*social engineering* o "hackeo de personas"), el arte mecánico del **ganzuado** (*lockpicking*), la exploración urbana de infraestructuras críticas y la intercepción de ondas de radio y comunicaciones inalámbricas.

---

## Ingeniería social: El arte de manipular la confianza humana

La ingeniería social consiste en convencer a una persona con privilegios legítimos de que facilite información confidencial (contraseñas, números de cuenta, organigramas internos) o realice una acción insegura sin percatarse del engaño.

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Reconocimiento│ ────► │ 2. Pretexting   │ ────► │ 3. Explotación  │
│  Recopilar nombres│       │  Crear identidad│       │  Obtener acceso │
│  y jerga interna │       │  creíble y rol  │       │  o credenciales │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Principios psicológicos explotados en ingeniería social

1. **Autoridad percibida:** Hacerse pasar por un directivo, auditor externo o técnico del departamento de IT. Las personas tienden a obedecer órdenes jerárquicas sin cuestionar credenciales.
2. **Urgencia y miedo:** Crear una falsa situación de crisis (*"Si no reinicio esta clave en 5 minutos, el servidor de nóminas se caerá"*). La prisa anula el razonamiento crítico y los protocolos de verificación.
3. **Deseo de ayudar y empatía:** Explotar la amabilidad inherente del personal de soporte o recepción frente a un supuesto empleado en apuros.
4. **Familiaridad y jerga técnica:** Aprender los nombres de los jefes de departamento y los acrónimos internos de la empresa para sonar como alguien de dentro de la organización.

> [!tip] La regla de Kevin Mitnick
> El célebre hacker Kevin Mitnick demostró que era más rápido y eficaz conseguir una contraseña llamando por teléfono al personal de soporte fingiendo ser un compañero de oficina que pasar semanas intentando romper el cifrado criptográfico del sistema.

---

## Ganzuado (*Lockpicking*): Comprensión de la seguridad física

El ganzuado es una disciplina fundamental en la cultura hacker: desmitifica la supuesta invulnerabilidad de las cerraduras mecánicas convencionales y enseña a manipular sus tolerancias de fabricación.

```text
   Posición de reposo               Línea de corte (Shear Line) alineada
   ┌──────────────────────┐         ┌──────────────────────┐
   │ [Muelle]  [Muelle]   │         │ [Muelle]  [Muelle]   │
   │ █ Perno   █ Perno    │         │ █ Perno   █ Perno    │
   │══════════════════════│         ├──────────────────────┤ <--- Shear Line
   │ ░ Contra  ░ Contra   │         │ ░ Contra  ░ Contra   │
   │ ▒ Rotor   ▒ Rotor    │         │ ▒ Rotor   ▒ Rotor    │
   └──────────────────────┘         └──────────────────────┘
```

### Anatomía de una cerradura de bombín de pines (*Pin-Tumbler*)
- **Rotor (Plug):** Cilindro interior que gira para accionar el pestillo.
- **Pernos superiores (Driver pins) y contrapernos inferiores (Key pins):** Cilindros metálicos empujados por resortes que bloquean la rotación del rotor.
- **Línea de corte (*Shear Line*):** Espacio infinitesimal entre el rotor y el cuerpo exterior de la cerradura.

### Herramientas básicas de ganzuado:
- **Tensor (*Tension Wrench*):** Aplica una ligera torsión rotacional al rotor para atrapar cada pin conforme sube.
- **Ganzúa de gancho (*Hook pick*):** Permite colocar los pines uno a uno (*Single Pin Picking* / SPP) detectando el clic mecánico en la línea de corte.
- **Ganzúa de rastrillado (*Rake pick*):** Se desliza rápidamente adelante y atrás para colocar múltiples pines simultáneamente por vibración.
- **Llaves de percusión (*Bump Keys*):** Llaves talladas a la máxima profundidad que transfieren energía cinética a los pernos mediante un golpe seco (*lock bumping*).

---

## Exploración urbana y seguridad de instalaciones

La exploración urbana (*Urbex*) en el ámbito hacker consiste en investigar los aspectos ocultos o abandonados de la arquitectura urbana e industrial: azoteas, túneles de servicio, salas de telecomunicaciones y centros de cableado.

```text
┌─────────────────────────────────────────────────────────────┐
│                 VULNERABILIDADES FÍSICAS COMUNES            │
├──────────────────────────────┬──────────────────────────────┤
│  Puertas con pestillo        │  Falsos techos continuos     │
│  simple sin cerrojo muerto   │  entre despachos y salas     │
├──────────────────────────────┼──────────────────────────────┤
│  Contenedores de basura      │  Tailgating / Piggybacking   │
│  sin trituración (Dumpster)  │  Seguir a alguien al entrar  │
└──────────────────────────────┴──────────────────────────────┘
```

- **Dumpster Diving (Búsqueda en basura):** Recuperación de discos duros desechados, listados de teléfonos, notas adhesivas con contraseñas o facturas con información confidencial.
- **Tailgating (Colarse a rebufo):** Entrar a un edificio de acceso restringido caminando justo detrás de un empleado autorizado con las manos ocupadas o sosteniendo la puerta educadamente.

---

## Vulnerabilidades en el espectro radioeléctrico (*Hacking the Airwaves*)

Cualquier comunicación transmitida por ondas electromagnéticas sin cifrado robusto es susceptible de intercepción pasiva mediante receptores de radio y escáneres de frecuencia:

- **Escáneres de radio VHF/UHF:** Escucha de frecuencias de servicios de emergencia no cifrados, walkie-talkies corporativos y servicios de seguridad privada.
- **Intercepción de buscas (*Pagers* / POCSAG):** Los sistemas de radiomensajería antiguos emitían texto en plano por radiofrecuencia, permitiendo leer mensajes médicos o de mantenimiento con un simple receptor SDR (*Software Defined Radio*).
- **Telefonía inalámbrica doméstica analógica:** Los primeros teléfonos inalámbricos operaban en frecuencias abiertas de 46/49 MHz o 900 MHz sin cifrar, permitiendo a vecinos escuchar conversaciones privadas con radios comerciales modificadas.

---

## Próximos pasos

Analiza el surgimiento de las primeras amenazas de software destructivo en la era de los ordenadores personales:

- [[03-malware-pionero-virus-troyanos-y-gusanos|03: Malware pionero: bombas ANSI, virus, troyanos y gusanos]]
