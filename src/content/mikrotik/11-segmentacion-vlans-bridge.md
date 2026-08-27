---
title: "MikroTik: Segmentación de red con VLANs y Bridge VLAN Filtering"
description: "Guía paso a paso para segmentar la red en VLANs (Gestión/Homelab, Confianza e IoT) utilizando Bridge VLAN Filtering en RouterOS v7, puertos Trunk, Access y Wi-Fi."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [homelab, mikrotik, networking, proxmox, routeros, vlan]
---

# Segmentación de red con VLANs y Bridge VLAN Filtering

> [!abstract] Resumen
> Esta guía documenta la segmentación de red en RouterOS v7 mediante **Bridge VLAN Filtering**. Este estándar permite aislar el tráfico de red en tres zonas diferenciadas (Homelab/Gestión, Dispositivos Personales e IoT/Domótica), configurando puertos *Trunk* hacia hipervisores (como Proxmox VE), puertos de acceso (*Access*) y vinculando redes Wi-Fi a sus respectivas etiquetas VLAN.

---

## 1. Arquitectura de VLANs y direccionamiento

| VLAN ID | Nombre | Subred IP | Propósito y Dispositivos |
| :--- | :--- | :--- | :--- |
| **VLAN 10** | `vlan10-gestion` | `192.168.10.0/24` | Servidor Proxmox VE, VMs/LXCs del Homelab, AdGuard Home (`192.168.10.10`). |
| **VLAN 20** | `vlan20-confianza` | `192.168.20.0/24` | Equipos personales (MacBook, PC, smartphones de confianza). |
| **VLAN 30** | `vlan30-iot` | `192.168.30.0/24` | Domótica, Smart TV, enchufes inteligentes, aspiradores y visitas. |

---

## 2. Fundamentos de Bridge VLAN Filtering en RouterOS v7

En RouterOS existen dos métodos históricos para gestionar VLANs. El método moderno y recomendado para dispositivos como el **hAP ax²** es **Bridge VLAN Filtering**:

- **Un único Bridge lógico:** Todas las interfaces cableadas e inalámbricas pertenecen a un mismo bridge (`bridge-lan`).
- **Filtrado L2 acelerado:** La conmutación entre puertos de la misma VLAN se realiza por hardware (*HW Offloading*), evitando sobrecargar la CPU.
- **Interfaces VLAN en CPU:** Para que el router actúe como puerta de enlace (Gateway) y servidor DHCP de cada VLAN, se añaden interfaces `/interface vlan` vinculadas al bridge.

> [!warning] Activar Safe Mode antes de empezar
> Durante la configuración de VLANs es muy fácil perder el acceso si se aplica el filtrado antes de tiempo. Pulsa **Ctrl + X** en la terminal de Winbox / WebFig para activar **Safe Mode** (o haz clic en el botón *Safe Mode* en la esquina superior izquierda). Si la conexión se corta, RouterOS revertirá automáticamente los cambios.

---

## 3. Despliegue paso a paso

### Paso 1: Crear el Bridge y las interfaces VLAN

```routeros
# 1. Crear el bridge único (sin activar vlan-filtering todavía)
/interface bridge add name=bridge-lan vlan-filtering=no

# 2. Crear las interfaces virtuales para que la CPU del router gestione el Layer 3
/interface vlan add interface=bridge-lan name=vlan10-gestion vlan-id=10
/interface vlan add interface=bridge-lan name=vlan20-confianza vlan-id=20
/interface vlan add interface=bridge-lan name=vlan30-iot vlan-id=30
```

---

### Paso 2: Asignar Direccionamiento IP y Servidores DHCP

```routeros
# 1. Asignar IP de pasarela (Gateway) a cada interfaz VLAN
/ip address add address=192.168.10.1/24 interface=vlan10-gestion comment="Gateway Gestion"
/ip address add address=192.168.20.1/24 interface=vlan20-confianza comment="Gateway Confianza"
/ip address add address=192.168.30.1/24 interface=vlan30-iot comment="Gateway IoT"

# 2. Crear Pools de direcciones DHCP
/ip pool add name=pool-gestion ranges=192.168.10.100-192.168.10.200
/ip pool add name=pool-confianza ranges=192.168.20.100-192.168.20.200
/ip pool add name=pool-iot ranges=192.168.30.100-192.168.30.200

# 3. Crear Servidores DHCP
/ip dhcp-server add name=dhcp-gestion interface=vlan10-gestion address-pool=pool-gestion lease-time=1d disabled=no
/ip dhcp-server add name=dhcp-confianza interface=vlan20-confianza address-pool=pool-confianza lease-time=1d disabled=no
/ip dhcp-server add name=dhcp-iot interface=vlan30-iot address-pool=pool-iot lease-time=1d disabled=no

# 4. Configurar parámetros entregados por DHCP (DNS y Gateway)
/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=1.1.1.1,8.8.8.8
/ip dhcp-server network add address=192.168.20.0/24 gateway=192.168.20.1 dns-server=1.1.1.1,8.8.8.8
/ip dhcp-server network add address=192.168.30.0/24 gateway=192.168.30.1 dns-server=1.1.1.1,8.8.8.8
```

*(Si utilizas AdGuard Home como DNS, sustituye `1.1.1.1,8.8.8.8` por la IP fija de tu servidor AdGuard, como `192.168.10.10`).*

---

### Paso 3: Asignación de Puertos del Switch y PVID

Definimos el rol de cada interfaz física del router:
- `ether1`: Puerto WAN (conectado a la ONT / módem, **fuera del bridge**).
- `ether2`: Puerto **Trunk** hacia Proxmox VE (transporta VLANs 10, 20 y 30 etiquetadas).
- `ether3`: Puerto **Access** en VLAN 20 (para un PC o dispositivo cableado de confianza).
- `ether4` / `ether5`: Puertos Access en VLAN 10 o 30.

```routeros
# Añadir puertos físicos al bridge con su respectivo PVID (VLAN nativa/sin etiquetar)
/interface bridge port add bridge=bridge-lan interface=ether2 comment="Trunk Proxmox"
/interface bridge port add bridge=bridge-lan interface=ether3 pvid=20 frame-types=admit-only-untagged-and-priority-tagged comment="Access Confianza"
/interface bridge port add bridge=bridge-lan interface=ether4 pvid=10 frame-types=admit-only-untagged-and-priority-tagged comment="Access Homelab"
/interface bridge port add bridge=bridge-lan interface=ether5 pvid=30 frame-types=admit-only-untagged-and-priority-tagged comment="Access IoT"
```

---

### Paso 4: Vincular Redes Wi-Fi a VLANs

En RouterOS v7 con el paquete `wifi`, se puede asociar una red inalámbrica a una VLAN añadiéndola al bridge con su correspondiente `pvid`:

```routeros
# Wi-Fi Principal (5 GHz / 2.4 GHz) -> Asignado a VLAN 20 (Confianza)
/interface bridge port add bridge=bridge-lan interface=wifi1 pvid=20
/interface bridge port add bridge=bridge-lan interface=wifi2 pvid=20

# Wi-Fi Virtual IoT (wifi-iot) -> Asignado a VLAN 30 (IoT)
/interface bridge port add bridge=bridge-lan interface=wifi-iot pvid=30
```

---

### Paso 5: Tabla de VLANs en el Bridge (`bridge vlan`)

Aquí definimos explícitamente qué puertos transportan paquetes etiquetados (*tagged*) y cuáles sin etiquetar (*untagged*). 

> [!tip] El puerto `bridge-lan` como miembro tagged
> La interfaz `bridge-lan` (que representa la CPU interna del router) debe incluirse como **tagged** en todas las VLANs para que RouterOS pueda atender peticiones DHCP y enrutar paquetes entre ellas.

```routeros
# VLAN 10 (Gestión / Homelab)
/interface bridge vlan add bridge=bridge-lan vlan-ids=10 \
    tagged=bridge-lan,ether2 \
    untagged=ether4

# VLAN 20 (Confianza)
/interface bridge vlan add bridge=bridge-lan vlan-ids=20 \
    tagged=bridge-lan,ether2 \
    untagged=ether3,wifi1,wifi2

# VLAN 30 (IoT)
/interface bridge vlan add bridge=bridge-lan vlan-ids=30 \
    tagged=bridge-lan,ether2 \
    untagged=ether5,wifi-iot
```

---

### Paso 6: Activación final de Bridge VLAN Filtering

Una vez completadas las tablas, activa el motor de filtrado:

```routeros
/interface bridge set [find name="bridge-lan"] vlan-filtering=yes
```

Si todo es correcto, sal de Safe Mode pulsando de nuevo **Ctrl + X**.

---

## 4. Verificación de conectividad

1. **Prueba en puerto Trunk (Proxmox):** En la configuración de red de Proxmox (`/etc/network/interfaces`), asegúrate de que el bridge `vmbr0` tiene marcada la opción `VLAN aware = yes`. Las VMs con tag `10` obtendrán IP `192.168.10.x`, y con tag `30` obtendrán `192.168.30.x`.
2. **Prueba Wi-Fi:** Al conectar a `ASMS5`, el cliente debe recibir una IP `192.168.20.x`. Al conectar a `ASMSIOT`, debe recibir una IP `192.168.30.x`.
3. **Paso siguiente:** Por defecto, un router enruta tráfico entre todas sus interfaces directamente. Para bloquear la comunicación entre la VLAN de IoT y la VLAN de Gestión, continúa en la guía `[[12-firewall-aislamiento-inter-vlan|Cortafuegos y aislamiento Inter-VLAN]]`.
