---
title: "MikroTik: Primer arranque, configuración inicial y Safe Mode"
description: "Guía paso a paso para encender un router MikroTik por primera vez: cableado físico, qué es defconf, cambio de contraseña de admin, reloj NTP y el uso de Safe Mode (Ctrl+X)."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [beginners, defconf, homelab, mikrotik, routeros, safemode, setup]
---

# Primer arranque, configuración inicial y Safe Mode

> [!abstract] Resumen
> Sacar un router MikroTik de la caja y ponerlo en marcha por primera vez requiere seguir un orden claro: conectar los cables en los puertos correctos, entender qué hace la configuración de fábrica (**defconf**), dominar el uso de **Safe Mode** para no quedarte incomunicado y aplicar los 5 ajustes de seguridad y mantenimiento indispensables del primer día.

---

## 1. Conexión física de los cables

La mayoría de routers MikroTik domésticos y de laboratorio (como la gama **hAP** o **hEX**) tienen los puertos asignados por convención de fábrica:

| Puerto Físico | Rol asignado | Conexión requerida |
| :--- | :--- | :--- |
| **`ether1`** | **WAN (Internet)** | Conecta el cable Ethernet que viene del módem o la ONT de tu operadora. |
| **`ether2`** a **`ether5`** | **LAN (Red Local)** | Conecta tu ordenador con Winbox, puntos de acceso o el switch principal de tu casa. |

---

## 2. La configuración por defecto (*defconf*)

Al conectarte por primera vez con Winbox, verás una ventana emergente titulada **"RouterOS Default Configuration"**.

Esta configuración inicial (*defconf*) crea automáticamente:
1. Un **Bridge** (`bridge`) que agrupa los puertos `ether2` a `ether5` y las radios Wi-Fi en una red conmutada común.
2. Una dirección IP local: `192.168.88.1/24` asignada a ese bridge.
3. Un servidor **DHCP** con un pool de direcciones (`192.168.88.10 - 192.168.88.254`).
4. Un cliente DHCP en `ether1` para negociar la conexión con tu operadora.
5. Un cortafuegos básico con aceleración FastTrack y regla de enmascaramiento NAT (*Masquerade*).

> [!warning] Regla de oro para principiantes
> Pulsa siempre el botón **"OK"** para mantener esta configuración base. **Nunca** pulses *"Remove Configuration"* al principio, ya que borraría todos los puentes, IPs y cortafuegos, dejándote con un router totalmente en blanco que solo responderá por dirección MAC.

---

## 3. Tu seguro de vida: Safe Mode (`Ctrl + X`)

En la esquina superior izquierda de Winbox verás el botón **Safe Mode** (o puedes pulsar el atajo de teclado **Ctrl + X**).

> [!tip] La regla del administrador: Usa siempre Safe Mode
> Pulsa `Ctrl + X` siempre que vayas a tocar reglas de cortafuegos, interfaces de red o VLANs. Es la diferencia entre un susto de 5 segundos y tener que resetear el router físicamente.

### ¿Cómo funciona la protección de Safe Mode?
1. Al pulsarlo, el botón queda presionado y RouterOS guarda una copia instantánea de la configuración en la memoria RAM.
2. Si aplicas un cambio peligroso (como deshabilitar el puerto por el que estás conectado o bloquear el firewall por error) y **pierdes la conexión con Winbox**:
3. El router detecta la desconexión del socket de administración a los pocos segundos y **revierte automáticamente todos los cambios** al estado exacto previo a presionar el botón.
4. Si el cambio que hiciste funciona bien y conservas el acceso, vuelves a pulsar el botón para consolidar los cambios en la memoria flash de forma permanente.

> [!tip] La regla del administrador
> Acostúmbrate a pulsar `Ctrl + X` siempre que vayas a tocar reglas de cortafuegos, interfaces de red o VLANs. Es la diferencia entre un susto de 5 segundos y tener que resetear el router físicamente.

---

## 4. Los 5 ajustes esenciales del primer día

Abre la **New Terminal** en Winbox y ejecuta estos comandos (o configúralos desde los menús visuales):

### 4.1. Crear un usuario administrador nuevo y eliminar `admin`
Mantener el usuario por defecto `admin` es el vector de ataque más explotado en ataques de fuerza bruta. Creamos un usuario personal con permisos totales (`group=full`) y deshabilitamos el predeterminado:

```routeros
# 1. Crear tu usuario personal
/user add name="tu_usuario" group=full password="TuPasswordFuerteYSeguro"

# 2. Deshabilitar el usuario admin de fabrica
/user disable admin
```

### 4.2. Asignar un nombre descriptivo al router (*Identity*)
Por defecto el equipo se identifica como `MikroTik`. Cambiarlo te permitirá saber en qué router estás trabajando cuando tengas varios equipos o ventanas abiertas:

```routeros
/system identity set name="MikroTik-Homelab"
```

### 4.3. Configurar zona horaria y sincronización de hora (SNTP)
RouterOS requiere la hora exacta para validar certificados SSL/TLS, programar tareas y correlacionar logs de seguridad:

```routeros
# Configurar zona horaria
/system clock set time-zone-name="Europe/Madrid"

# Habilitar cliente SNTP automático contra pool público
/system ntp client set enabled=yes
/system ntp client servers add address="pool.ntp.org"
```

### 4.4. Apagar servicios de administración inseguros
Desactiva todos los protocolos en texto plano o interfaces que no vayas a utilizar:

```routeros
/ip service disable telnet,ftp,www,api,api-ssl
```
*(Mantenemos activos únicamente **winbox** en el puerto 8291 y **ssh** en el puerto 22).*

### 4.5. Configurar servidores DNS upstream del router
Asegura que el propio router pueda resolver dominios de actualización y sincronización horaria de forma fiable:

```routeros
/ip dns set allow-remote-requests=yes servers=1.1.1.1,8.8.8.8
```
