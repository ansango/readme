---
title: MikroTik
description: "Manual y guía integral de aprendizaje de MikroTik y RouterOS v7: desde conceptos básicos y primer arranque hasta arquitectura avanzada de Homelab."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [homelab, mikrotik, networking, routeros]
---

# MikroTik

> [!abstract] Resumen
> Manual de referencia e itinerario de aprendizaje progresivo para routers MikroTik con **RouterOS v7**. Diseñado desde los cimientos conceptuales para usuarios principiantes hasta la arquitectura completa de seguridad, VLANs y servicios de Homelab.

## Continuar leyendo

### Nivel 1: Cimientos y primer contacto
- [[01-modelo-mental-y-herramientas|El modelo mental de MikroTik y herramientas de acceso]] — qué es RouterOS, cómo entender su arquitectura modular, Winbox, WebFig y el acceso por dirección MAC.
- [[02-conceptos-fundamentales-de-redes|Conceptos fundamentales de redes explicados fácil]] — diccionario visual y sin tecnicismos de Capa 2 vs Capa 3, IP, subred `/24`, Gateway, DNS, DHCP, NAT Masquerade y Bridge vs Switch.
- [[03-primer-arranque-y-ajustes-esenciales|Primer arranque, configuración inicial y Safe Mode]] — configuración por defecto (*defconf*), cambio de contraseña de administración, reloj NTP y tu red de seguridad: **Safe Mode (`Ctrl + X`)**.

### Nivel 2: Gestión diaria y herramientas básicas
- [[04-gestion-dhcp-y-fijar-ips|Gestión de DHCP y cómo fijar IPs a dispositivos]] — asignación de IPs estáticas desde el router (*Make Static*), comentarios identificativos y organización de la red local.
- [[05-diagnostico-en-tiempo-real-torch|Diagnóstico en tiempo real y monitorización con Torch]] — identificar qué dispositivo o puerto consume tu ancho de banda, lectura de gráficas de tráfico e inspección de logs.
- [[06-copias-de-seguridad-y-recuperacion|Copias de seguridad rápidas y recuperación ante fallos]] — cómo hacer backups antes de cambios arriesgados y modos del botón de Reset físico (5s, 10s y Netinstall).

### Nivel 3: Conectividad y resolución de incidencias
- [[07-optimizacion-wifi|Optimización Wi-Fi en RouterOS (hAP ax2)]] — Wi-Fi 6 (802.11ax), separación de bandas 2.4G/5G, creación de Virtual APs (SSID para IoT/invitados), eliminación de atenuación física y canales DFS.
- [[08-resolucion-problemas-sin-internet|Diagnóstico de red local sin Internet]] — flujo de recuperación paso a paso cuando el router recibe IP WAN pero los equipos de la LAN no navegan (NAT Masquerade, DNS upstream, gateway y bloqueo de MAC en ONT).

### Nivel 4: Servicios, puertos y acceso remoto
- [[09-port-forwarding-y-hairpin-nat|Redirección de puertos y Hairpin NAT]] — publicación segura de servicios web/reverse proxy mediante `dstnat` y solución al bucle NAT Loopback (Hairpin NAT) desde la red interna.
- [[10-servidor-vpn-wireguard|Servidor VPN WireGuard en RouterOS]] — servidor VPN nativo en RouterOS v7, script automatizado de generación de claves y códigos QR, DDNS Cloud y apertura de firewall.

### Nivel 5: Arquitectura Homelab y control total
- [[11-segmentacion-vlans-bridge|Segmentación de red con VLANs y Bridge VLAN Filtering]] — diseño de subredes (VLAN 10 Gestión/Homelab, VLAN 20 Confianza, VLAN 30 IoT), puertos Trunk hacia Proxmox, puertos Access y asignación a SSIDs.
- [[12-firewall-aislamiento-inter-vlan|Cortafuegos y aislamiento Inter-VLAN]] — estructura de reglas Fasttrack y Connection Tracking, bloqueo estricto entre VLANs, excepciones puntuales y uso de Safe Mode.
- [[13-redireccion-dns-adguard-pihole|Control de DNS y redirección forzada con AdGuard / Pi-hole]] — entrega de DNS por DHCP, trampa de redirección NAT en puerto 53 contra dispositivos con DNS hardcodeado y prevención de fugas DNS.
- [[14-qos-cake-bufferbloat|Calidad de servicio (QoS) y mitigación de Bufferbloat]] — implementación de algoritmos CAKE y FQ-CoDel en Queues para eliminar el lag y garantizar fluidez en videollamadas.
- [[15-mantenimiento-routeros-y-routerboot|Ciclo de mantenimiento y actualización de RouterOS y RouterBOOT]] — diferencias entre `/system backup` binario y `/export` RSC en texto plano, automatización de respaldos y actualización segura de firmware.

### Referencia y chuletas rápidas
- [[16-cheatsheet-comandos-rapidos|Chuleta de comandos rápidos de RouterOS (Cheatsheet)]] — referencia rápida de comandos CLI organizada por categorías (atajos, diagnóstico, interfaces, DHCP, firewall, Wi-Fi, DNS y recursos).
