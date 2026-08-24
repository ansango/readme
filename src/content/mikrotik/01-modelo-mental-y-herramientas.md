---
title: "MikroTik: El modelo mental y herramientas de acceso"
description: "Entendiendo la filosofía modular de RouterOS, arquitectura interna (CPU vs Switch Chip), por qué no es como un router tradicional y cómo acceder mediante Winbox v4, WebFig, SSH y dirección MAC."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [beginners, homelab, mikrotik, networking, routeros, winbox]
---

# El modelo mental de MikroTik y herramientas de acceso

> [!abstract] Resumen
> Cuando un usuario llega a MikroTik tras usar routers comerciales o de operadora, la primera impresión suele ser de desconcierto. En RouterOS no existen menús simplificados que "hacen magia" por detrás; todo el sistema funciona como un conjunto de piezas modulares que tú conectas. Este capítulo explica la arquitectura interna de un router, la diferencia entre procesar paquetes por CPU o por chip de conmutación (*Switch Chip*), y cómo dominar herramientas de acceso como **Winbox v4**, **SSH** y el **acceso por dirección MAC (Capa 2)**.

---

## 1. ¿Qué hay dentro de un router MikroTik? (Arquitectura básica)

Un router no es un simple módem; es un ordenador especializado de alto rendimiento diseñado exclusivamente para mover paquetes de datos:

| Componente | Función principal | Impacto en rendimiento |
| :--- | :--- | :--- |
| **Procesador (CPU)** | • Enrutamiento entre redes distintas (L3)<br>• Cortafuegos (Firewall Filter / Mangle)<br>• Traducción de direcciones (NAT Masquerade)<br>• Cifrado y túneles VPN (WireGuard, IPsec)<br>• Calidad de servicio y colas (Queues / CAKE) | Procesa paquetes por software. Un uso intensivo eleva el porcentaje de uso de CPU del router. |
| **Chip Conmutador (Switch Chip)** | • Conmutación ultra-rápida entre puertos del mismo Bridge (Capa 2)<br>• Filtrado de VLANs acelerado por hardware (*HW Offloading*) | **Cero consumo de CPU.** El tráfico local entre puertos conmuta a velocidad de cable sin saturar el procesador. |
| **Memoria RAM** | Mantiene las tablas de estado en vivo (conexiones activas en tiempo real, rutas dinámicas y caché). | Memoria volátil de alta velocidad (se reinicia al apagar). |
| **Almacenamiento Flash** | Almacena el sistema operativo RouterOS, certificados SSL y los archivos de configuración (`.rsc`). | Almacenamiento no volátil permanente. |

### CPU vs. Switch Chip (Hardware Offloading)
- **Tráfico local (Switching / L2):** Cuando un ordenador en el puerto `ether2` envía un archivo a un NAS en el puerto `ether3`, el tráfico pasa directamente por el **Switch Chip** a velocidad de cable (1 Gbps o 2.5 Gbps) sin que la CPU del router se entere ni se caliente (**HW Offload**).
- **Tráfico enrutado (Routing / L3 / Firewall):** Cuando ese mismo ordenador navega a Internet o cruza hacia otra VLAN aislada, el paquete sube a la **CPU** para ser inspeccionado por el cortafuegos, traducido por NAT y enrutado a la WAN.

---

## 2. El cambio de mentalidad: Router tradicional vs. RouterOS

| Router Doméstico / Operadora | Router MikroTik (RouterOS) |
| :--- | :--- |
| **Caja negra:** Pulsas un botón de "Activar red de invitados" y el firmware crea interfaces, reglas de firewall y rutas ocultas que no puedes ver ni personalizar. | **Bloques modulares (Lego):** Creas una interfaz virtual, la conectas a un bridge, le asignas una subred IP, defines su servidor DHCP y decides en el Firewall qué permisos tiene. |
| **Limitado a asistentes predefinidos:** Si una función no viene en la web simplificada del fabricante, simplemente no se puede hacer. | **Control total de Capa 2 y Capa 3:** Cualquier topología corporativa, laboratorio o segmentación de Homelab es configurable. |
| **Pérdida de acceso si cambias la IP:** Si te equivocas al cambiar de subred, te quedas fuera y estás obligado a hacer un reseteo de fábrica. | **Acceso por Capa 2 (MAC):** Puedes conectarte y administrar el router por su dirección física MAC aunque no tenga ninguna IP asignada. |

---

## 3. Las 4 Vías de Acceso a RouterOS

| Herramienta | Plataforma / Acceso | Uso recomendado |
| :--- | :--- | :--- |
| **Winbox v4** | App nativa (Windows, macOS, Linux) | **Recomendado:** Gestión diaria, multiventana y máximo rendimiento. |
| **WebFig** | Navegador web (`http://IP`) | Acceso rápido desde equipos donde no puedes instalar software. |
| **Terminal / SSH** | Consola CLI (`ssh admin@IP`) | Automatización, scripts y diagnósticos rápidos por teclado. |
| **App Móvil** | iOS / Android | Diagnóstico Wi-Fi rápido y monitorización desde el teléfono. |

### 3.1. Winbox v4 (La herramienta recomendada)
**Winbox** es el software de administración por excelencia de MikroTik:
- **Ultraligero y rápido:** Carga al instante y no consume recursos de navegador.
- **Multiventana real:** Permite tener abiertas simultáneamente las ventanas de interfaces, firewall, leases DHCP y gráficas de tráfico sin recargar la pantalla.
- **Winbox v4 Multiplataforma:** Ya no requiere emuladores (como Wine). Cuenta con ejecutables nativos para **Windows**, **macOS** (Apple Silicon / Intel) y **Linux**, con soporte para modo oscuro (*Dark Mode*).
- **Descarga:** [mikrotik.com/download](https://mikrotik.com/download).

### 3.2. WebFig
La interfaz web integrada de RouterOS. Se accede introduciendo la dirección IP del router en cualquier navegador (por defecto `http://192.168.88.1`). Comparte la misma estructura de menús que Winbox, lo que resulta muy útil cuando accedes desde un ordenador donde no puedes instalar aplicaciones.

### 3.3. Terminal y SSH
Para usuarios acostumbrados a la línea de comandos, RouterOS ofrece una consola (*CLI*) completa y estructurada:
```bash
# Conectar por SSH desde tu terminal habitual (Ghostty, iTerm2, Alacritty)
ssh admin@192.168.88.1
```

### 3.4. App Móvil Oficial (MikroTik RouterOS)
Disponible para iOS y Android. Es ideal para diagnósticos rápidos desde el móvil: comprobar el estado de las conexiones Wi-Fi, monitorizar el tráfico en tiempo real o reiniciar el equipo sin encender el ordenador.

---

## 4. El superpoder de MikroTik: Conexión por dirección MAC (Layer 2)

En los routers convencionales necesitas que tu ordenador tenga una dirección IP en el mismo rango para poder abrir la web de configuración. Si borras la IP del router o rompes el servidor DHCP, pierdes el acceso.

En MikroTik dispones del **descubrimiento de vecinos MNDP / LLDP**:

1. Abre **Winbox**.
2. Ve a la pestaña inferior **Neighbors**.
3. Winbox detectará automáticamente cualquier router MikroTik conectado por cable a tu red local (incluso a través de switches intermedios).
4. **Haz clic sobre la columna MAC Address** (ej. `48:A9:8A:XX:XX:XX`, en lugar de la columna IP).
5. Introduce el usuario (`admin`) y la contraseña.
6. Haz clic en **Connect**.

> [!tip] Rescate garantizado
> Conectarse por dirección MAC te permite entrar al router aunque esté completamente reseteado, tenga IP `0.0.0.0` o las interfaces desconfiguradas. Es tu salvavidas número uno.

---

## 5. Anatomía de la interfaz de Winbox

Al iniciar sesión en Winbox encontrarás una interfaz limpia y estructurada:

- **Menú lateral izquierdo:** Agrupa todos los subsistemas del router:
  - `Interfaces`: Puertos físicos Ethernet, SFP y estado de enlaces.
  - `Wireless / WiFi`: Configuración de antenas Wi-Fi 6, SSIDs y canales.
  - `Bridge`: Puentes virtuales y tablas de VLANs.
  - `IP`: Direcciones (`Addresses`), servidores DHCP, DNS, rutas y el Cortafuegos (`Firewall`).
  - `Queues`: Gestión de ancho de banda y mitigación de latencia (CAKE).
  - `System`: Usuarios, reloj, copias de seguridad, logs y actualizaciones.
  - `Tools`: Utilidades de diagnóstico (Torch, Ping, Traceroute, Packet Sniffer).
- **Barra de estado superior:** Muestra el nombre del router (*Identity*), la versión de RouterOS instalada, la arquitectura del procesador, el porcentaje de carga de la CPU y el botón **Safe Mode** (que veremos en el Capítulo 03).
