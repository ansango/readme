---
title: "Reconocimiento y escaneo: de War Driving a Google Hacking"
description: "Metodologías de reconocimiento y descubrimiento de objetivos: escaneo de puertos TCP/UDP, OS fingerprinting, war driving inalámbrico, símbolos warchalking y Google Dorking"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, reconnaissance, port-scanning, nmap, war-driving, wifi, google-dorking, osint]
---

# Reconocimiento y escaneo: de War Driving a Google Hacking

> [!abstract] Resumen
> Antes de que un atacante lance un exploit o intente vulnerar un sistema, ejecuta una fase meticulosa de **reconocimiento y mapeo de la superficie de ataque**. Wallace Wang desglosa las técnicas empleadas para descubrir máquinas activas y servicios expuestos: desde el análisis de puertos y huella digital del sistema operativo (*OS fingerprinting* con Nmap), hasta el rastreo geográfico de redes inalámbricas vulnerables (**War Driving** y simbología *Warchalking*), culminando con el uso de motores de búsqueda como herramientas de explotación pasiva (**Google Hacking / Dorking**).

---

## Escaneo de puertos y análisis de respuestas TCP/IP

Un escaneo de puertos equivale a verificar metódicamente cada puerta y ventana de un edificio para comprobar cuáles están abiertas y qué servicio responde tras ellas.

```text
  1. TCP Connect Scan (3-Way Handshake Completo)
  Atacante ─── SYN ───► Víctima ─── SYN/ACK ───► Atacante ─── ACK ───► [Conexión Registrada en Logs]
  
  2. TCP SYN Stealth Scan (Escaneo Semiabierto / Half-Open)
  Atacante ─── SYN ───► Víctima ─── SYN/ACK ───► Atacante ─── RST ───► [Puerto Abierto / Sin Conexión]
```

### Técnicas principales de escaneo (Nmap)

| Tipo de escaneo | Flag Nmap | Mecanismo técnico | Visibilidad en Logs |
|---|---|---|---|
| **TCP Connect** | `-sT` | Completa el *Three-Way Handshake* (`SYN` $\rightarrow$ `SYN/ACK` $\rightarrow$ `ACK`). | Muy alta; el SO registra la conexión establecida en syslog/eventviewer. |
| **SYN Stealth** | `-sS` | Responde con `RST` tras recibir `SYN/ACK`, abortando antes del `ACK` final. | Baja; no completa la sesión de aplicación. |
| **FIN / NULL / Xmas** | `-sF`, `-sN`, `-sX` | Envía paquetes anómalos con flags `FIN`, vacíos o con `FIN+PSH+URG`. | Diseñado para evadir cortafuegos sin estado (*stateless*). |
| **UDP Scan** | `-sU` | Envía datagramas UDP vacíos; si el puerto está cerrado devuelve `ICMP Port Unreachable`. | Lento; los sistemas operativos limitan las respuestas ICMP por segundo. |

### Identificación del sistema operativo (*OS Fingerprinting*)
Cada sistema operativo (Linux, Windows NT/2000, BSD, Solaris) implementa la pila TCP/IP (*RFCs*) con ligeras diferencias: tamaño inicial de ventana TCP (*Window Size*), valores TTL (*Time to Live*) y orden de opciones TCP. Herramientas como Nmap analizan estas respuestas sutiles para deducir la versión exacta del kernel remoto sin necesidad de autenticarse.

---

## Guerra inalámbrica: *War Driving* y *Warchalking*

Con la popularización del estándar Wi-Fi (802.11b) a principios de los 2000, los atacantes descubrieron que las señales de radio traspasaban los muros de edificios corporativos y residenciales.

```text
       ┌──────────────┐         (•) Red Abierta / Sin Clave
       │   Vehículo   │         ├── ( ) WEP / Clave Cifrada Débil
       │  con Portátil│ ──────► └── (X) Red Cerrada / Filtrado MAC
       │  GPS + Antena│
       └──────────────┘         Símbolos Warchalking en tiza sobre la acera:
                                  )(  = Red abierta + SSID + Bandwidth
                                 (W)  = Red con cifrado WEP
```

### Herramientas y vectores de ataque Wi-Fi:
- **NetStumbler y Kismet:** Software para capturar *beacon frames* de puntos de acceso, asociando coordenadas GPS en tiempo real.
- **Antenas artesanales direccionales (*Pringles Cantenna* / Yagi):** Guías de onda construidas con tubos metálicos que concentraban la ganancia de señal a 2.4 GHz, permitiendo conectarse a redes Wi-Fi a kilómetros de distancia.
- **Vulnerabilidad de WEP (Wired Equivalent Privacy):** El algoritmo RC4 de WEP reutilizaba vectores de inicialización (IVs) de solo 24 bits. Al capturar suficientes paquetes cifrados (*IV collisions*), herramientas como AirCrack permitían recuperar la contraseña de la red en minutos mediante computación estadística.

---

## Google Hacking (Google Dorking)

Los motores de búsqueda como Google rastrean e indexan continuamente servidores web sin discriminar si un directorio contiene documentos públicos o archivos de configuración críticos expuestos por negligencia del administrador.

```text
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Operador Dork   │ Función técnica                                           │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ `site:`         │ Restringe la búsqueda a un dominio concreto.              │
│ `filetype:`     │ Filtra por extensión de archivo (.log, .ini, .sql, .cfg). │
│ `inurl:`        │ Busca cadenas específicas en la ruta URL.                 │
│ `intitle:`      │ Busca texto en la etiqueta HTML `<title>`.                │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### Ejemplos clásicos de *Google Dorks*:
```text
# Localizar listados de directorios desprotegidos expuestos en Apache/IIS:
intitle:"index of /" "parent directory"

# Encontrar archivos con credenciales de bases de datos o contraseñas en plano:
filetype:ini "ws_ftp.ini"
filetype:sql "INSERT INTO" "password"
inurl:config.php "DB_PASSWORD"

# Descubrir cámaras de seguridad IP con panel de control abierto:
inurl:"ViewerFrame?Mode="
inurl:"view/index.shtml"
```

> [!warning] La base de datos GHDB (Google Hacking Database)
> Creada por Johnny Long, la GHDB recopila miles de consultas automatizadas que permiten localizar servidores vulnerables, dispositivos IoT sin clave y fugas de datos sin enviar un solo paquete directo contra la víctima (reconocimiento 100% pasivo).

---

## Próximos pasos

Analiza los mecanismos de captura y descifrado de credenciales de acceso y las limitaciones de la seguridad biométrica:

- [[07-ataques-a-credenciales-y-biometria|07: Ataques a credenciales, autenticación y biometría]]
