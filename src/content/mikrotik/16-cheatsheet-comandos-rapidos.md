---
title: "MikroTik: Chuleta de comandos rápidos de RouterOS (Cheatsheet)"
description: "Guía de referencia rápida y chuleta de comandos CLI esenciales en RouterOS v7: diagnóstico, interfaces, firewall, DHCP, Wi-Fi, DNS, rutas y mantenimiento del sistema."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [cheatsheet, cli, commands, homelab, mikrotik, routeros, sysadmin]
---

# Chuleta de comandos rápidos de RouterOS (Cheatsheet)

> [!abstract] Resumen
> Guía de referencia rápida (*Cheatsheet*) con los comandos CLI más utilizados en el día a día para la administración, diagnóstico, monitorización y resolución de problemas en **RouterOS v7**.

---

## 1. Atajos de navegación en la Terminal (CLI)

| Atajo / Tecla | Acción |
| :--- | :--- |
| **`Tab`** | Autocompleta comandos, parámetros y nombres de interfaces. Pulsar dos veces muestra las opciones disponibles. |
| **`?`** | Muestra la ayuda contextual del menú o comando actual. |
| **`..`** | Sube un nivel en la jerarquía de menús (ej. de `/ip/firewall/nat` a `/ip/firewall`). |
| **`/`** | Vuelve a la raíz de la consola desde cualquier submenú. |
| **`Ctrl + X`** | Activa o desactiva **Safe Mode** (revierte cambios si se pierde la conexión). |
| **`Ctrl + C`** | Cancela o interrumpe la ejecución de un comando en curso (ej. ping continuo o Torch). |
| **`Ctrl + K`** | Borra todo el texto desde el cursor hasta el final de la línea. |

---

## 2. Diagnóstico de red y conectividad

```routeros
# Ping con número fijo de paquetes
/ping 1.1.1.1 count=4

# Ping especificando tamaño de paquete o interfaz de salida
/ping 192.168.10.10 interface=bridge-lan count=5 size=1500

# Trazar ruta hacia un destino (Traceroute)
/tool traceroute 8.8.8.8

# Monitorizar tráfico en tiempo real en una interfaz (Torch)
/tool torch ether1 src-address=0.0.0.0/0 dst-address=0.0.0.0/0 port=any

# Ver tabla de rutas activas
/ip route print where dst-address=0.0.0.0/0
/ip route print detail

# Ver tabla de resolución ARP (dispositivos físicos detectados en LAN)
/ip arp print

# Ver vecinos MikroTik / LLDP descubiertos en la red
/ip neighbor print
```

---

## 3. Interfaces y enlaces físicos

```routeros
# Listar todas las interfaces con su estado (R: Running, X: Disabled)
/interface print

# Ver velocidad y tráfico en tiempo real de una interfaz
/interface monitor-traffic ether1

# Habilitar / Deshabilitar un puerto
/interface enable ether3
/interface disable ether3

# Ver estadísticas detalladas de errores y paquetes
/interface ethernet print stats

# Ver puertos miembros del Bridge
/interface bridge port print
```

---

## 4. Gestión de DHCP y Direcciones IP

```routeros
# Ver todas las direcciones IP asignadas a las interfaces del router
/ip address print

# Ver concesiones DHCP activas (clientes conectados)
/ip dhcp-server lease print

# Ver solo concesiones dinámicas activas
/ip dhcp-server lease print where dynamic

# Convertir una concesión dinámica en estática (fijar IP)
/ip dhcp-server lease make-static [find address="192.168.88.245"]

# Añadir una reserva de IP estática manualmente
/ip dhcp-server lease add address=192.168.10.50 mac-address=B8:27:EB:11:22:33 server=defconf comment="Home Assistant"

# Ver estado del cliente DHCP WAN (IP obtenida del proveedor)
/ip dhcp-client print detail
/ip dhcp-client release [find interface=ether1]
/ip dhcp-client renew [find interface=ether1]
```

---

## 5. Cortafuegos y NAT

```routeros
# Listar reglas de Firewall Filter con contadores de paquetes y bytes
/ip firewall filter print stats

# Listar reglas de NAT (dstnat / masquerade)
/ip firewall nat print

# Ver conexiones activas en tiempo real (Connection Tracking)
/ip firewall connection print

# Vaciar la tabla de conexiones (forzar renegociación de sesiones)
/ip firewall connection remove [find]

# Ver miembros de una Address List
/ip firewall address-list print

# Añadir una IP a una lista de bloqueo temporal por 1 día
/ip firewall address-list add list=bloqueados address=192.168.88.99 timeout=1d comment="Dispositivo sospechoso"
```

---

## 6. Wi-Fi e Inalámbrico (RouterOS v7 `wifi`)

```routeros
# Ver estado de las radios Wi-Fi
/interface wifi print detail

# Monitorizar en tiempo real el uso de canal y frecuencia
/interface wifi monitor [find name="wifi1"] once

# Ver clientes Wi-Fi asociados con su RSSI y tasa de modulación MCS
/interface wifi registration-table print stats

# Reiniciar una interfaz de radio suavemente
/interface wifi disable [find name="wifi1"]
/interface wifi enable [find name="wifi1"]

# Escaneo de redes e interferencias del entorno
/interface wifi scan wifi1
```

---

## 7. DNS y Resolución de Nombres

```routeros
# Ver servidores DNS configurados y estado de caché
/ip dns print

# Vaciar la memoria caché de DNS del router
/ip dns cache flush

# Ver entradas cacheadas activas
/ip dns cache print

# Añadir un registro DNS estático local en el router
/ip dns static add name="router.lan" address=192.168.88.1 comment="Acceso local al router"
```

---

## 8. Sistema, Recursos y Mantenimiento

```routeros
# Ver uso de CPU, memoria RAM disponible y tiempo de actividad (Uptime)
/system resource print

# Ver consumo detallado por núcleo de CPU
/system resource cpu print

# Ver temperatura, voltajes y estado de los sensores de hardware
/system health print

# Ver registro de eventos del sistema (Logs en directo)
/log print follow
/log print where topics~"warning"

# Reiniciar o apagar el router con confirmación
/system reboot
/system shutdown

# Comprobar actualizaciones de RouterOS
/system package update check-for-updates

# Exportar configuración limpia en texto plano
/export file=backup-config-completa show-sensitive
/export file=backup-config-segura hide-sensitive

# Crear backup binario comprimido
/system backup save name=backup-full encryption=aes-sha256 password="TuContraseña"
```
