---
title: "MikroTik: Cortafuegos y aislamiento Inter-VLAN"
description: "Estructura de cortafuegos en RouterOS v7 para aislar subredes y VLANs (Homelab, Confianza, IoT), FastTrack, reglas stateful y excepciones seguras."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [firewall, homelab, mikrotik, networking, routeros, security, vlan]
---

# Cortafuegos y aislamiento Inter-VLAN

> [!abstract] Resumen
> Por defecto, los routers MikroTik enrutan automáticamente el tráfico entre todas sus interfaces y VLANs. Esta guía define una arquitectura de cortafuegos (*Firewall Filter*) en RouterOS v7 basada en inspección de estado (*Stateful*), aceleración por FastTrack, aislamiento estricto de la zona IoT/Invitados y apertura controlada de puertos hacia servicios específicos del Homelab.

---

## 1. Modelo de Cadenas en RouterOS (`input` vs `forward`)

Para diseñar un firewall seguro, es fundamental diferenciar las dos cadenas de tráfico principales:

```
                  ┌─────────────────────────────────────────┐
Tráfico hacia el  │                CADENA INPUT             │  (Winbox, SSH, DNS local,
propio router ──► │  Protege los servicios del propio router │   DHCP, WireGuard)
                  └─────────────────────────────────────────┘

                  ┌─────────────────────────────────────────┐
Tráfico que cruza │               CADENA FORWARD            │  (LAN -> Internet,
de una red a otra │   Regula la comunicación Inter-VLAN    │   VLAN 20 -> VLAN 10,
                  │      y el tráfico LAN hacia WAN         │   VLAN 30 -> Internet)
                  └─────────────────────────────────────────┘
```

---

## 2. Bloque de Reglas Base (Rendimiento y Estado)

Todo firewall en RouterOS debe comenzar aceptando conexiones ya establecidas y descartando paquetes corruptos (*invalid*). Esto ahorra ciclos de CPU mediante el seguimiento de conexiones (*Connection Tracking*).

```routeros
# ==========================================================
# 1. ACELERACIÓN FASTTRACK Y SEGUIMIENTO DE CONEXIONES
# ==========================================================

# Acelerar conexiones establecidas en forward mediante FastTrack
/ip firewall filter add chain=forward action=fasttrack-connection connection-state=established,related \
    comment="Acelerar trafico establecido (FastTrack)"

# Aceptar conexiones ya establecidas y relacionadas
/ip firewall filter add chain=input action=accept connection-state=established,related,untracked \
    comment="Input: aceptar establecidas/relacionadas"
/ip firewall filter add chain=forward action=accept connection-state=established,related,untracked \
    comment="Forward: aceptar establecidas/relacionadas"

# Descartar paquetes invalidos o corruptos
/ip firewall filter add chain=input action=drop connection-state=invalid comment="Input: drop invalidos"
/ip firewall filter add chain=forward action=drop connection-state=invalid comment="Forward: drop invalidos"
```

---

## 3. Protección de la Cadena `input` (Gestión del Router)

Evita que dispositivos no autorizados (como un enchufe inteligente infectado o visitas) puedan acceder a la interfaz de administración (Winbox, WebFig o SSH):

```routeros
# Permitir peticiones ICMP (Ping) seguras
/ip firewall filter add chain=input action=accept protocol=icmp comment="Permitir ICMP"

# Permitir consultas DNS y DHCP desde las redes locales
/ip firewall filter add chain=input action=accept protocol=udp dst-port=53,67 in-interface-list=!WAN \
    comment="Permitir DNS y DHCP local"

# Permitir acceso administrativo a Winbox/SSH SOLO desde VLAN Gestion y Confianza
/ip firewall filter add chain=input action=accept in-interface=vlan10-gestion comment="Gestion desde VLAN 10"
/ip firewall filter add chain=input action=accept in-interface=vlan20-confianza comment="Gestion desde VLAN 20"

# Permitir conexion WireGuard desde el exterior (WAN)
/ip firewall filter add chain=input action=accept protocol=udp dst-port=51820 comment="WireGuard VPN"

# BLOQUEO FINAL: Rechazar todo lo demas hacia el router
/ip firewall filter add chain=input action=drop in-interface-list=WAN comment="Drop resto WAN"
/ip firewall filter add chain=input action=drop comment="Drop resto Input"
```

---

## 4. Reglas de Aislamiento en la Cadena `forward` (Inter-VLAN)

Aquí se establece la política de seguridad entre las zonas:
- **VLAN 10 (Gestión/Homelab):** Puede iniciar conexiones a Internet y a cualquier VLAN.
- **VLAN 20 (Confianza):** Puede navegar a Internet y acceder a los servicios de la VLAN 10.
- **VLAN 30 (IoT):** Solo puede salir a Internet. **Bloqueada hacia VLAN 10 y VLAN 20**.

```routeros
# ==========================================================
# 2. SALIDA A INTERNET DESDE TODAS LAS VLANS
# ==========================================================
/ip firewall filter add chain=forward action=accept in-interface=vlan10-gestion out-interface-list=WAN comment="VLAN 10 a Internet"
/ip firewall filter add chain=forward action=accept in-interface=vlan20-confianza out-interface-list=WAN comment="VLAN 20 a Internet"
/ip firewall filter add chain=forward action=accept in-interface=vlan30-iot out-interface-list=WAN comment="VLAN 30 a Internet"

# ==========================================================
# 3. ACCESO CONTROLADO ENTRE VLANS
# ==========================================================

# Permitir que los dispositivos de Confianza accedan a los servidores del Homelab
/ip firewall filter add chain=forward action=accept in-interface=vlan20-confianza out-interface=vlan10-gestion \
    comment="Confianza accede a Homelab"

# ==========================================================
# 4. AISLAMIENTO ESTRICTO DE IOT (ZONA CERO CONFIANZA)
# ==========================================================
/ip firewall filter add chain=forward action=drop in-interface=vlan30-iot out-interface=vlan10-gestion \
    comment="BLOQUEO: IoT no accede a Homelab"
/ip firewall filter add chain=forward action=drop in-interface=vlan30-iot out-interface=vlan20-confianza \
    comment="BLOQUEO: IoT no accede a Confianza"

# ==========================================================
# 5. BLOQUEO FINAL EN FORWARD
# ==========================================================
/ip firewall filter add chain=forward action=drop in-interface-list=WAN connection-nat-state=!dstnat \
    comment="Drop conexiones entrantes desde WAN no autorizadas"
/ip firewall filter add chain=forward action=drop comment="Drop resto Forward no contemplado"
```

---

## 5. Excepciones puntuales (Pinceladas de Apertura)

Si tienes un servidor de domótica (como **Home Assistant** en `192.168.10.50`) al que los dispositivos IoT necesitan enviar datos por MQTT (puerto `1883/TCP`):

```routeros
# Permitir solo MQTT desde IoT hacia Home Assistant antes del drop
/ip firewall filter add chain=forward action=accept \
    in-interface=vlan30-iot dst-address=192.168.10.50 protocol=tcp dst-port=1883 \
    comment="Excepcion: IoT -> Home Assistant MQTT" \
    place-before=[/ip firewall filter find comment="BLOQUEO: IoT no accede a Homelab"]
```

> [!tip] La importancia del orden de las reglas
> En RouterOS el cortafuegos evalúa las reglas **de arriba hacia abajo**. Cualquier excepción (`accept`) debe ubicarse siempre **antes** de la regla general de descarte (`drop`).

---

## 6. Diagnóstico y Registro de Paquetes Bloqueados (Logging)

Para auditar si algún dispositivo IoT o sospechoso está intentando comunicarse con tus servidores:

```routeros
# Registrar intentos de acceso no autorizados antes de descartarlos
/ip firewall filter add chain=forward action=log log-prefix="[FW-DROP-IOT]" \
    in-interface=vlan30-iot out-interface=vlan10-gestion \
    place-before=[/ip firewall filter find comment="BLOQUEO: IoT no accede a Homelab"]
```

Para visualizar los eventos en tiempo real:
```routeros
/log print follow where topics~"firewall"
```
