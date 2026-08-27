---
title: "Ataques a credenciales, autenticación y biometría"
description: "Mecanismos de robo y descifrado de credenciales: keyloggers por hardware y software, debilidades de hashes LM/NTLM, ataques por diccionario y fuerza bruta, y evasión de sistemas biométricos"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, passwords, authentication, keyloggers, brute-force, john-the-ripper, biometrics, hashes]
---

# Ataques a credenciales, autenticación y biometría

> [!abstract] Resumen
> Las contraseñas representan la primera línea de defensa de la identidad digital y, simultáneamente, uno de los objetivos predilectos de los atacantes. En esta nota se analizan las técnicas de interceptación directa de pulsaciones mediante **keyloggers** físicos y lógicos, las vulnerabilidades criptográficas estructurales de sistemas de almacenamiento de credenciales históricos (como los hashes LM de Windows NT), las metodologías de descifrado mediante ataques de diccionario y fuerza bruta con herramientas como *John the Ripper* y *L0phtCrack*, y los métodos de engaño y evasión frente a tecnologías de autenticación **biométrica**.

---

## Interceptación de credenciales: Keyloggers

Un *keylogger* registra de forma invisible cada pulsación de tecla ejecutada en el teclado, capturando usuarios, contraseñas, conversaciones y números de tarjetas bancarias.

```text
  1. Keylogger por Hardware (Físico en Cable)
  [Teclado PS/2 o USB] ──► [ Módulo Hardware Intermedio ] ──► [ Puerto de la Torre ]
                               (Almacena en Flash interna)
  
  2. Keylogger por Software (Lógico en Sistema Operativo)
  [Pulsación de Tecla] ──► [ Hook de Windows (SetWindowsHookEx) ] ──► [ Archivo Log Cifrado ]
```

### Tipos de Keyloggers:
1. **Hardware Keyloggers (ej. KeyGhost):** Pequeños adaptadores cilíndricos conectados entre el cable del teclado y el puerto del ordenador. Son 100% invisibles para cualquier antivirus o sistema operativo, ya que operan a nivel físico almacenando pulsaciones en memoria EEPROM interna.
2. **Software Keyloggers:** Programas que interceptan eventos de entrada mediante llamadas a la API del sistema (`SetWindowsHookEx`) o controladores de filtro en el kernel (*keyboard filter drivers*), enviando los registros periódicamente por correo electrónico o FTP al atacante.

---

## Métodos de ataque y descifrado de contraseñas

Cuando los atacantes obtienen el archivo que contiene las contraseñas cifradas o *hasheadas* del sistema (como el archivo `/etc/shadow` en Unix o la base de datos `SAM` en Windows), aplican técnicas de computación intensiva:

```text
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Tipo de Ataque  │ Funcionamiento técnico y eficiencia                       │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Fuerza Bruta**│ Prueba exhaustiva de todas las combinaciones posibles     │
│                 │ ($A-Z, a-z, 0-9, \text{símbolos}$). Muy lento para claves largas.  │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Diccionario** │ Compara el hash con listas de palabras comunes            │
│                 │ (`rockyou`, nombres, jerga, diccionarios multilingües).   │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Híbrido /     │ Aplica reglas de mutación sobre palabras de diccionario   │
│ Mutación**      │ (e.g., `admin` $\rightarrow$ `Admin123!`, `p@ssw0rd`).    │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

```text
  Base de Datos SAM / Shadow              Descifrador (John the Ripper / L0phtCrack)
  ┌─────────────────────────┐             ┌────────────────────────────────────────┐
  │ Hash:                   │             │ Palabra: "secreto"                     │
  │ e52cac67419a9a224a5b... │ ◄────────── │ Hash(MD5/NTLM) = e52cac67419a9a224a5b..│
  └─────────────────────────┘  Coincidencia  └────────────────────────────────────────┘
                                   │
                                   ▼
                         Contraseña recuperada: "secreto"
```

---

## La debilidad histórica del hash LAN Manager (LM) de Windows

Uno de los fallos arquitectónicos más notorios de Microsoft en Windows NT/2000/XP fue el algoritmo de hash **LM (LAN Manager)**:

```text
  Contraseña original: "MiClaveSegura1" (13 caracteres)
  
  Paso 1: Se convierte todo a MAYÚSCULAS ──────────► "MICLAVESEGURA1"
  Paso 2: Se divide en dos bloques de 7 bytes ────► [MICLAVE]  +  [SEGURA1]
  Paso 3: Se hashea cada bloque por separado con DES ──► Hash_1  +  Hash_2
```

> [!danger] Colapso de la complejidad criptográfica
> Dividir una clave de 14 caracteres en dos mitades independientes de 7 caracteres reduce el espacio de búsqueda de $95^{14}$ combinaciones a simplemente dos búsquedas triviales de $26^7$ (letras mayúsculas), permitiendo a herramientas como *L0phtCrack* descifrar cualquier contraseña de Windows en cuestión de segundos.

---

## Biometría: Promesas y vulnerabilidades físicas

Los sistemas biométricos autentican usuarios basándose en rasgos físicos inherentes (huellas dactilares, reconocimiento facial, escáner de iris o geometría de la mano).

```text
┌───────────────────────────┬───────────────────────────┐
│ FAR (False Acceptance Rate│ FRR (False Rejection Rate)│
│ Tasa de Falsa Aceptación  │ Tasa de Falso Rechazo     │
│ Admite a un impostor.     │ Bloquea al usuario legal. │
├───────────────────────────┴───────────────────────────┤
│      CER (Crossover Error Rate) / Punto de equilibrio │
└───────────────────────────────────────────────────────┘
```

### Técnicas de engaño y evasión (*Biometric Spoofing*):
1. **Huellas dactilares de gelatina (*Gummy Bear Attack*):** El investigador japonés Tsutomu Matsumoto demostró que levantando una huella latente con cianocrilato y moldeándola con gelatina comercial comestible, se burlaban el 80% de los lectores ópticos y capacitivos comerciales.
2. **Fotografías de alta resolución en reconocimiento facial 2D:** Cámaras sin detección de profundidad o infrarrojos pueden engañarse colocando una foto impresa o pantalla de smartphone frente al sensor.
3. **Imposibilidad de revocación:** Si una contraseña se filtra, se cambia en 10 segundos; si la plantilla biométrica de tu huella o iris es comprometida, no puedes cambiar de dedo u ojo.

---

## Próximos pasos

Aprende cómo los atacantes logran invisibilidad total y persistencia mediante la alteración del núcleo del sistema operativo:

- [[08-rootkits-y-persistencia-en-el-kernel|08: Rootkits, manipulación de logs y persistencia en el sistema]]
