---
title: "MikroTik: Gestión de DHCP y cómo fijar IPs a dispositivos"
description: "Aprende el ciclo DORA de DHCP, cómo diseñar un plan de direccionamiento IP ordenado (/24), fijar IPs estáticas desde el router con 'Make Static' y proteger la red contra servidores Rogue DHCP."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [beginners, dhcp, dora, homelab, leases, mikrotik, networking, routeros]
---

# Gestión de DHCP y cómo fijar IPs a dispositivos

> [!abstract] Resumen
> El servidor DHCP es el responsable de dar la bienvenida a cada nuevo dispositivo que se conecta a tu red, entregándole una dirección IP, la puerta de enlace y los servidores DNS. En esta guía aprenderás cómo funciona el ciclo de negociación DHCP (**DORA**), cómo estructurar un plan de direccionamiento profesional en una subred `/24`, cómo fijar direcciones estáticas con **Make Static** y cómo alertar ante servidores DHCP no autorizados (*Rogue DHCP*).

---

## 1. El ciclo de vida de una conexión: El proceso DORA

Cuando un móvil, ordenador o bombilla inteligente se conecta por cable o Wi-Fi a tu red, se produce una conversación de 4 pasos denominada **DORA**:

```
Dispositivo Cliente                                   Router MikroTik (DHCP Server)
(Nuevo en la red)                                        (Conserje de la red)

       │                                                          │
       │ 1. DHCP DISCOVER (Broadcast: "¿Hay algún DHCP?")         │
       ├─────────────────────────────────────────────────────────►│
       │                                                          │
       │ 2. DHCP OFFER    (Unicast: "Te ofrezco la IP .45")       │
       │◄─────────────────────────────────────────────────────────┤
       │                                                          │
       │ 3. DHCP REQUEST  (Broadcast: "Acepto quedarme con la .45")│
       ├─────────────────────────────────────────────────────────►│
       │                                                          │
       │ 4. DHCP ACK      (Unicast: "Confirmado, es tuya por 24h") │
       │◄─────────────────────────────────────────────────────────┤
       │                                                          │
```

1. **Discover:** El cliente grita a toda la red buscando un servidor DHCP.
2. **Offer:** El router consulta su **IP Pool** y le ofrece una IP libre.
3. **Request:** El cliente confirma formalmente que quiere utilizar esa dirección.
4. **Acknowledge (ACK):** El router registra la concesión (*Lease*) y le entrega los parámetros de red (Gateway y DNS).

---

## 2. Estrategia profesional: Mapa de direccionamiento en una subred `/24`

Para evitar que tu red se convierta en un caos de IPs aleatorias, la mejor práctica en redes domésticas y Homelab es reservar rangos lógicos dentro de los 254 números disponibles (`192.168.88.1` a `192.168.88.254`):

| Rango IP | Tipo de dispositivo | Ejemplos |
| :--- | :--- | :--- |
| **`.1`** | **Puerta de Enlace (Gateway)** | Router MikroTik principal. |
| **`.2` a `.19`** | **Infraestructura de red** | Switches gestionados, puntos de acceso Wi-Fi. |
| **`.20` a `.49`** | **Servidores y Homelab** | Servidor Proxmox VE, NAS (TrueNAS), AdGuard Home, Nginx Proxy Manager. |
| **`.50` a `.99`** | **Dispositivos fijos del hogar** | PCs de sobremesa, impresoras, Smart TVs, consola de videojuegos. |
| **`.100` a `.254`** | **Pool Dinámico DHCP** | Móviles, tablets, portátiles y dispositivos de visitas. |

---

## 3. Inspeccionar clientes conectados (DHCP Leases)

En Winbox, accede al menú:
👉 **IP > DHCP Server > pestaña Leases**

Verás una tabla con las columnas:
- **`Address`:** Dirección IP asignada al dispositivo.
- **`MAC Address`:** Dirección física del cliente (ej. `B8:27:EB:44:55:66`).
- **`Host Name`:** Nombre que el dispositivo reporta (ej. `pve-homelab`, `MacBook-Air`).
- **`Status`:** Estado de la conexión (`bound` = equipo activo y conectado).
- **Bandera `D` (*Dynamic*):** Indica que es un alquiler temporal. Si el equipo se apaga varios días, el router podría asignarle otra IP diferente.

---

## 4. Fijar una IP estática desde el router (*Make Static*)

Nunca configures una IP fija en los ajustes del propio aparato (riesgo de IP duplicada). Hazlo siempre desde el router:

### Método visual desde Winbox:
1. En la lista de **Leases**, busca el dispositivo que quieres fijar (ej. `pve-homelab`).
2. Haz doble clic sobre la fila para abrir sus detalles.
3. En la botonera de la derecha, haz clic en **Make Static**.
4. Verás que la letra **`D` desaparece**. Ahora esa IP está vinculada de por vida a esa dirección MAC.
5. Edita el campo **Address** para asignarle la IP limpia de tu mapa (ej. `192.168.88.10`) y añade un **Comment** descriptivo (*"Servidor Proxmox VE"*).
6. Haz clic en **Apply**.

> [!tip] Renumerar a una IP limpia
> Una vez convertida en estática, edita el campo **Address** para asignarle la IP que le corresponde según tu mapa (por ejemplo, cambiar la aleatoria `192.168.88.180` por la limpia `192.168.88.10`). Pulsa **Apply**, y en tu servidor o PC desconecta y vuelve a conectar el cable de red para renovar la concesión al instante.

---

## 5. Detección de servidores DHCP no autorizados (*Rogue DHCP Alert*)

Si alguien conecta en tu casa un segundo router o un repetidor Wi-Fi mal configurado con su propio DHCP activado, dos servidores empezarán a repartir IPs en conflicto, provocando caídas intermitentes de conexión en toda la casa.

RouterOS permite monitorizar y alertar si detecta otro servidor DHCP en la red:

```routeros
# Crear una alerta de Rogue DHCP en el bridge local
/ip dhcp-server alert add interface=bridge valid-server=defconf alert-timeout=1h on-alert=":log error \"¡ALERTA! Detectado servidor DHCP no autorizado en la red local\""
```
