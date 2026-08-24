---
title: "MikroTik: Control de DNS y redirección forzada con AdGuard / Pi-hole"
description: "Integración de servidores DNS locales (AdGuard Home / Pi-hole) en RouterOS v7, distribución por DHCP y captura forzada con NAT dstnat (puerto 53)."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [adguard, dns, homelab, mikrotik, networking, pihole, routeros]
---

# Control de DNS y redirección forzada con AdGuard / Pi-hole

> [!abstract] Resumen
> Implementar un bloqueador de publicidad y rastreadores a nivel de red (como AdGuard Home o Pi-hole en un contenedor LXC de Proxmox) requiere dos acciones en el router: entregar la IP del servidor DNS a los clientes vía DHCP y **forzar la redirección por NAT de todas las consultas salientes en el puerto 53**. Esto último impide que dispositivos como Smart TVs, Chromecast o enchufes inteligentes evadan el filtrado utilizando servidores DNS cableados en su firmware (como `8.8.8.8`).

---

## 1. Distribución del DNS mediante DHCP

El primer paso es indicar a los clientes que utilicen la IP local de tu servidor DNS (por ejemplo, `192.168.10.10` en la VLAN 10).

```routeros
# Actualizar los servidores DHCP de cada red / VLAN
/ip dhcp-server network set [find address="192.168.10.0/24"] dns-server=192.168.10.10
/ip dhcp-server network set [find address="192.168.20.0/24"] dns-server=192.168.10.10
/ip dhcp-server network set [find address="192.168.30.0/24"] dns-server=192.168.10.10
```

> [!tip] DNS de reserva en el propio router
> En la sección global `/ip dns set servers=1.1.1.1,8.8.8.8` del MikroTik, mantén servidores DNS públicos de respaldo para que el propio router pueda comprobar actualizaciones de RouterOS o sincronizar la hora NTP incluso si el contenedor de AdGuard está apagado.

---

## 2. El problema de los dispositivos con DNS "hardcodeado"

Muchos dispositivos inteligentes (Google Chromecast, televisores Samsung/LG, altavoces Alexa) ignoran por completo los servidores DNS entregados por el servidor DHCP y realizan consultas directas en texto claro contra `8.8.8.8`, `8.8.4.4` o `1.1.1.1`.

Esto provoca que:
1. La tele siga mostrando publicidad invasiva y telemetría no filtrada.
2. El tráfico DNS quede expuesto a intermediarios.

---

## 3. Trampa de Interceptación DNS en RouterOS (NAT `dstnat`)

Mediante reglas de cortafuegos en la tabla NAT, RouterOS puede capturar al vuelo cualquier paquete con destino al puerto `53/UDP` o `53/TCP` originado en la red local y redirigirlo de forma transparente hacia AdGuard Home.

```routeros
# 1. Interceptar consultas DNS por UDP (estándar)
/ip firewall nat add chain=dstnat protocol=udp dst-port=53 \
    in-interface-list=!WAN src-address=!192.168.10.10 \
    action=dst-nat to-addresses=192.168.10.10 to-ports=53 \
    comment="Redireccion Forzada DNS UDP -> AdGuard"

# 2. Interceptar consultas DNS por TCP (respuestas grandes / DNSSEC)
/ip firewall nat add chain=dstnat protocol=tcp dst-port=53 \
    in-interface-list=!WAN src-address=!192.168.10.10 \
    action=dst-nat to-addresses=192.168.10.10 to-ports=53 \
    comment="Redireccion Forzada DNS TCP -> AdGuard"
```

> [!danger] Parámetro `src-address=!192.168.10.10` imprescindible
> La exclamación (`!`) indica **negación**. Si omites excluir la propia IP de AdGuard Home, el servidor entrará en un bucle infinito (*loop*) al intentar consultar sus servidores upstream (como Quad9 o Cloudflare), dejando a toda la red sin resolución DNS.

---

## 4. Bloqueo de DNS-over-TLS (DoT) y DNS-over-HTTPS (DoH) externos

Algunos dispositivos y navegadores intentan utilizar protocolos DNS cifrados para saltarse los bloqueos locales.

Para neutralizar intentos de evasión por DoT (puerto `853/TCP`):

```routeros
# Bloquear DNS-over-TLS hacia servidores externos
/ip firewall filter add chain=forward protocol=tcp dst-port=853 \
    in-interface-list=!WAN src-address=!192.168.10.10 action=reject reject-with=tcp-reset \
    comment="Bloquear DoT externo (forzar uso de AdGuard)" place-before=0
```

---

## 5. Verificación del funcionamiento

1. **Prueba forzada desde un cliente:** Ejecuta un `nslookup` apuntando intencionadamente a un servidor público:
   ```bash
   nslookup doubleclick.net 8.8.8.8
   ```
   *Resultado esperado:* Si la regla funciona, la consulta será interceptada y bloqueada por AdGuard Home, devolviendo `0.0.0.0` en lugar de la IP real.
2. **Revisión del Panel de AdGuard / Pi-hole:**
   - Abre la interfaz web de AdGuard Home en `http://192.168.10.10:3000` (o `http://192.168.10.10`).
   - Revisa el registro de consultas (*Query Log*): deberías ver todas las peticiones registradas en tiempo real.
3. **Comprobación de Fugas (DNS Leak Test):**
   - Accede a [BrowserLeaks DNS Test](https://browserleaks.com/dns).
   - Solo deben aparecer los proveedores configurados como *Upstream* en tu AdGuard Home (por ejemplo, Quad9 o Cloudflare), nunca los servidores de tu operador de telecomunicaciones.
