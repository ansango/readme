---
title: "Rootkits, manipulación de logs y persistencia en el sistema"
description: "Mecanismos de persistencia y ocultación profunda: alteración de logs binarios, binarios troyanizados en espacio de usuario, API hooking y módulos de kernel (LKM / Ring 0)"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, rootkits, kernel, lkm, api-hooking, persistence, logs, forensics]
---

# Rootkits, manipulación de logs y persistencia en el sistema

> [!abstract] Resumen
> Una vez que un atacante obtiene privilegios de administrador (*root* o *SYSTEM*), su objetivo principal pasa de la intrusión a la **persistencia e invisibilidad**. Un **rootkit** no es un exploit en sí mismo, sino un conjunto sofisticado de herramientas diseñadas para ocultar procesos, archivos, conexiones de red y puertas traseras frente a los ojos del administrador. En esta nota se analiza la evolución técnica de los rootkits: desde la edición quirúrgica de registros contables (`wtmp`/`utmp`) y el reemplazo de binarios del sistema (`ps`, `ls`, `netstat`), hasta la interceptación de llamadas del sistema (*API Hooking*) y los módulos de kernel cargables (**LKM / Ring 0**).

---

## Anatomía de los niveles de privilegio del sistema operativo

Los microprocesadores modernos dividen la ejecución de código en anillos de protección jerárquicos (*Rings*):

```text
  ┌─────────────────────────────────────────────────────────────┐
  │  Ring 3: Espacio de Usuario (Userland)                      │
  │  - Aplicaciones (Navegador, Office, ps, ls, netstat)        │
  ├─────────────────────────────────────────────────────────────┤
  │  Ring 0: Espacio de Kernel (Kernel Space)                   │
  │  - Núcleo del SO, controladores de hardware, tablas de      │
  │    llamadas al sistema (sys_call_table), memoria física     │
  └─────────────────────────────────────────────────────────────┘
```

---

## La evolución de los Rootkits

La técnica de ocultación ha evolucionado históricamente para responder a las mejoras en las herramientas de detección de los administradores:

```text
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Generación      │ Mecanismo de ocultación                                   │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **1ª Gen:       │ Limpiadores de logs (`zap`, `wip`). Borran registros en   │
│ Log Cleaners**  │ archivos binarios (`/var/log/wtmp`, `utmp`, `lastlog`).   │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **2ª Gen:       │ Reemplazo de ejecutables legítimos (`/bin/ps`, `ls`,      │
│ Binarios        │ `netstat`, `top`) por versiones modificadas que filtran   │
│ Troyanizados**  │ los PIDs, puertos y archivos del intruso.                 │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **3ª Gen:       │ Interceptación de funciones API en memoria (e.g.,         │
│ API Hooking**   │ `ZwQuerySystemInformation`) mediante inyección DLL o      │
│                 │ modificación de tablas IAT (*Import Address Table*).      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **4ª Gen:       │ Inserción de código directamente en el kernel (LKM en     │
│ Kernel / LKM**  │ Linux o drivers `.sys` en Windows). Modifican la tabla    │
│                 │ de llamadas al sistema (`sys_call_table`) o listas DKOM.  │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Manipulación de registros y binarios troyanizados

En sistemas Unix clásicos, los administradores supervisan el sistema mediante utilidades estándar:
- `ps aux`: Lista todos los procesos activos en memoria.
- `netstat -an`: Muestra todos los sockets y puertos de red abiertos.
- `ls -la`: Lista los archivos de un directorio.
- `last / wtmp`: Muestra el historial de inicios de sesión y direcciones IP remotas.

```text
  Llamada del Administrador: # ps aux
  ─────────────────────────────────────────────────────────────
  1. Ejecuta /bin/ps modificado por el atacante.
  2. El binario lee la tabla de procesos del kernel (/proc).
  3. Filtra cualquier proceso llamado "backdoor" o con PID oculto.
  4. Muestra la salida limpia al administrador: "Todo normal".
```

> [!tip] Detección mediante verificación de integridad (Tripwire / AIDE)
> Los administradores combaten los binarios troyanizados utilizando herramientas de integridad de archivos como **Tripwire** o **AIDE**, que comparan sumas criptográficas (hashes SHA-256) de los binarios del sistema contra una base de datos segura de sólo lectura creada durante la instalación limpia.

---

## Rootkits en el espacio del Kernel (LKM: *Loadable Kernel Modules*)

Los rootkits de kernel (como *Knark*, *Adore*, *SuckIT* o *HackerDefender*) no modifican un solo byte de los archivos en disco. Se cargan directamente en la memoria del kernel (Ring 0) interceptando las llamadas al sistema (*System Calls*):

```text
  Aplicación de Usuario (ls / dir)
              │
              ▼ (Llamada sys_getdents64)
  ┌───────────────────────────────────────────────┐
  │         TABLA DE SYSTEM CALLS (Kernel)        │
  │                                               │
  │  Puntero Original ──► [ Hook del Rootkit LKM ]│
  │                             │                 │
  │   1. Ejecuta llamada real   │                 │
  │   2. Oculta carpetas que    │                 │
  │      empiecen por ".hide_"  │                 │
  │   3. Devuelve lista filtrada│                 │
  └─────────────────────────────┼─────────────────┘
                                ▼
               Respuesta filtrada a la aplicación
```

### Técnicas avanzadas de Kernel:
1. **Manipulación Directa de Objetos del Kernel (DKOM):** El rootkit localiza la lista enlazada doble de procesos del sistema operativo (`EPROCESS` en Windows o `task_struct` en Linux) y desenlaza el nodo del proceso malicioso. El proceso sigue ejecutándose y consumiendo ciclos de CPU, pero deja de existir para cualquier herramienta de monitorización.
2. **Puertas traseras pasivas (*Magic Packet Backdoors*):** El rootkit instala un filtro en la tarjeta de red en modo promiscuo. No abre ningún puerto TCP (evitando escaneos de Nmap), pero al recibir un paquete UDP con una carga útil secreta predeterminada (*Magic Packet*), abre una shell inversa (*Reverse Shell*) hacia la IP del atacante.

---

## Detección y erradicación de Rootkits

Detectar un rootkit de kernel desde el propio sistema infectado es matemáticamente inviable, ya que el rootkit tiene el control absoluto de la capa que genera las respuestas del sistema operativo.

### Estrategias de mitigación:
- **Detección basada en anomalías de bajo nivel:** Herramientas como `chkrootkit` o `rkhunter` comparan llamadas del sistema directas con respuestas de alto nivel buscando discrepancias en el conteo de enlaces de directorios o PIDs invisibles.
- **Análisis Forense Offline:** Apagar el equipo, extraer el disco duro o generar una imagen física de la memoria RAM (*volatility*) y analizarla desde un entorno seguro y no comprometido.
- **Reinstalación desde cero:** Si un sistema ha sido comprometido a nivel de kernel, la única garantía de seguridad al 100% es formatear y reconstruir el servidor desde medios de confianza.

---

## Próximos pasos

Explora cómo la censura de contenidos opera en las redes estatales y corporativas y las técnicas utilizadas para eludirla:

- [[09-censura-en-internet-y-tecnicas-de-elusion|09: Censura en la red, filtrado y técnicas de elusión]]
