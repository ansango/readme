---
title: "MikroTik: Conceptos fundamentales de redes explicados fácil"
description: "Diccionario visual y exhaustivo de redes para entender RouterOS: Modelo TCP/IP por capas, tabla CIDR (/24, /32), IPs privadas RFC 1918, Broadcast vs Multicast, TCP vs UDP, puertos y NAT."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [beginners, concepts, homelab, mikrotik, networking, routeros]
---

# Conceptos fundamentales de redes explicados fácil

> [!abstract] Resumen
> Configurar un router MikroTik con soltura requiere entender qué ocurre por debajo cuando dos ordenadores se comunican. Esta guía traduce los conceptos teóricos de redes a un lenguaje claro, práctico y visual: las capas del modelo TCP/IP, las direcciones IP privadas (RFC 1918), las máscaras de subred CIDR, la diferencia entre TCP y UDP, los puertos de red y el funcionamiento de Gateways, DNS y NAT.

---

## 1. El modelo de comunicación por capas (TCP/IP)

En informática, las redes se dividen en capas. Cada capa se encarga de una tarea específica y se apoya en la capa inferior:

| Capa | Nombre | Función práctica | Protocolos / Equipos |
| :--- | :--- | :--- | :--- |
| **Capa 7** | **Aplicación** | Lo que el usuario o aplicación utiliza directamente. | Web (HTTPS), DNS, SSH, DHCP. |
| **Capa 4** | **Transporte** | Cómo viaja la información: fiable (TCP) o rápida (UDP). Identificado por **Puertos**. | TCP, UDP (puertos 80, 443, 53, 22). |
| **Capa 3** | **Red (L3)** | Hacia dónde va el paquete: direccionamiento lógico con **Dirección IP**. | Routers, Gateways, subredes IP. |
| **Capa 2** | **Enlace (L2)** | Cómo cruza el enlace físico: tramas identificadas por **Dirección MAC**. | Switches, Bridges, tarjetas de red. |
| **Capa 1** | **Física (L1)** | El medio físico de transmisión de señales eléctricas, ópticas o electromagnéticas. | Cable RJ45, Fibra óptica, Ondas Wi-Fi. |

- **En Capa 2 (Local):** Los equipos conectados al mismo switch o bridge se comunican directamente usando su dirección física (**MAC Address**, ej. `48:A9:8A:11:22:33`). El router no interviene.
- **En Capa 3 (Interconexión):** Cuando necesitas salir a Internet o saltar a otra VLAN, entra en juego la **dirección IP** y el router actúa como árbitro y pasarela.

---

## 2. Direcciones IP: Públicas vs. Privadas (RFC 1918)

Las direcciones IPv4 son números de 32 bits formados por 4 bloques (octetos) de 0 a 255.

Para evitar que se agotaran las direcciones globales, el estándar internacional (**RFC 1918**) reservó tres rangos específicos para redes domésticas y empresariales (**IPs privadas**). Estas direcciones son invisibles desde el exterior y nunca viajan directamente por Internet:

| Rango Privado | Notación CIDR | Rango de IPs | Uso habitual |
| :--- | :--- | :--- | :--- |
| **Clase A** | `10.0.0.0/8` | `10.0.0.0` a `10.255.255.255` | Grandes empresas y subredes VPN (WireGuard). |
| **Clase B** | `172.16.0.0/12` | `172.16.0.0` a `172.31.255.255` | Redes internas y contenedores Docker por defecto. |
| **Clase C** | `192.168.0.0/16` | `192.168.0.0` a `192.168.255.255` | Redes domésticas (`192.168.88.x` en MikroTik). |

> [!warning] ¿Qué es el rango CG-NAT (`100.64.0.0/10`)?
> Si en la interfaz WAN de tu MikroTik recibes una IP que empieza por `100.64.x.x` a `100.127.x.x`, tu proveedor (ISP) te tiene tras **CG-NAT** (te comparte una IP pública con otros clientes). En ese escenario, no podrás abrir puertos directamente hacia el exterior sin solicitar una IP pública real a tu operador o usar túneles VPN.

---

## 3. Máscaras de subred y notación CIDR (`/24`, `/32`)

Una dirección IP como `192.168.88.50/24` se compone de la parte de **Red** (la calle) y la parte de **Host** (el número de la casa):

```
  192 . 168 . 88  .  50   /24
 └──────┬───────┘   └─┬─┘  └─┬─┘
    Nombre de Red     Host  Máscara CIDR: Los primeros 24 bits
 (Común para todos) (Único) (3 primeros octetos) identifican la red.
```

### Tabla de equivalencias CIDR más utilizadas:

| Notación CIDR | Máscara Decimal | IPs Totales | IPs Útiles para Hosts | Uso común en Homelab |
| :--- | :--- | :--- | :--- | :--- |
| **/24** | `255.255.255.0` | 256 | **254** | Red local estándar (hogar / oficina). |
| **/28** | `255.255.255.240` | 16 | **14** | Subred pequeña para servidores DMZ. |
| **/29** | `255.255.255.248` | 8 | **6** | Bloque de IPs públicas o interconexión. |
| **/30** | `255.255.255.252` | 4 | **2** | Enlace punto a punto entre dos routers. |
| **/32** | `255.255.255.255` | 1 | **1** | Host único (asignación de peer en WireGuard). |

---

## 4. Tipos de Tráfico: Unicast, Broadcast y Multicast

| Tipo | Destinatario | Descripción | Casos de uso habituales |
| :--- | :--- | :--- | :--- |
| **Unicast** | De uno a uno | Envío directo y privado entre dos dispositivos específicos. | Navegación web hacia un servidor, conexión SSH, transferencia de archivos. |
| **Broadcast** | De uno a todos | Un dispositivo envía un mensaje a toda la subred local (`.255`). | Peticiones DHCP Discover (*"¿Quién es el DHCP?"*), consultas ARP (*"¿Quién tiene la IP X?"*). |
| **Multicast** | A un grupo selecto | Envío a un grupo de interés suscrito (rango `224.0.0.0/4`). | Descubrimiento local (**mDNS / Apple Bonjour / Chromecast / Spotify Connect**), streaming IPTV. |

---

## 5. Protocolos de Transporte: TCP vs. UDP

En la Capa 4, las aplicaciones eligen cómo enviar sus datos según sus prioridades:

| Característica | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Orientación** | Conexión orientada (apretón de manos *3-way handshake*). | Sin conexión previa (*dispara y olvida*). |
| **Garantía de entrega** | **Sí:** Si un paquete se pierde por el camino, se retransmite automáticamente. | **No:** Si un paquete se pierde, se descarta y continúa el flujo. |
| **Orden de llegada** | Garantiza que los paquetes se reensamblan en orden estricto. | Los paquetes pueden llegar desordenados. |
| **Latencia y sobrecarga** | Mayor sobrecarga por confirmaciones (ACKs). | Mínima sobrecarga y latencia ultra-baja. |
| **Casos de uso** | Web (HTTP/HTTPS), SSH, transferencias de archivos, APIs. | DNS (53), Streaming de vídeo/audio, llamadas VoIP/Meet, Juegos online, WireGuard VPN. |

---

## 6. Puertos y Sockets de Red

Una dirección IP identifica al ordenador, pero dentro de ese ordenador se ejecutan decenas de programas. Los **Puertos** (del 0 al 65535) son como los timbres o extensiones telefónicas de cada aplicación.

La combinación `IP:Puerto` se denomina **Socket** (ej. `192.168.88.1:8291`):

| Puerto | Protocolo | Servicio / Aplicación |
| :--- | :--- | :--- |
| **53** | UDP / TCP | **DNS** (Resolución de nombres). |
| **67 / 68** | UDP | **DHCP** (Asignación automática de IPs). |
| **80** | TCP | **HTTP** (Navegación web sin cifrar). |
| **443** | TCP | **HTTPS** (Navegación web segura con SSL/TLS). |
| **22** | TCP | **SSH** (Acceso remoto seguro por terminal). |
| **8291** | TCP | **Winbox** (Gestión nativa de MikroTik). |
| **51820** | UDP | **WireGuard** (Túnel VPN moderno). |

---

## 7. Los Servicios Centrales de la Red Local

### La Puerta de Enlace (*Default Gateway*)
Es la dirección IP del router en tu red local (habitualmente `192.168.88.1`). Cuando un ordenador quiere enviar datos a una IP fuera de su subred, se los entrega al Gateway para que los encamine.

### El Servidor DNS (Domain Name System)
La libreta de contactos que traduce nombres humanos (`google.com`) a números de IP (`142.250.200.14`).

### NAT Masquerade (Traducción de Direcciones de Red)
El mecanismo que permite a decenas de dispositivos privados navegar por Internet compartiendo la única dirección IP pública que entrega tu operadora de telecomunicaciones.
