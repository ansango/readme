---
title: "MikroTik: Redirección de puertos y Hairpin NAT"
description: "Publicación de servicios locales (Nginx Proxy Manager, HTTPS 443, WireGuard) mediante dstnat en RouterOS v7 y solución a la pérdida de acceso interno con Hairpin NAT (NAT Loopback)."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [homelab, mikrotik, nat, networking, ports, routeros, security]
---

# Redirección de puertos y Hairpin NAT

> [!abstract] Resumen
> Cuando se alojan servicios en un Homelab (como Nextcloud, Vaultwarden o Home Assistant detrás de Nginx Proxy Manager / Traefik), es necesario redirigir el tráfico externo hacia el servidor mediante **Destination NAT (`dstnat`)**. Esta guía detalla cómo crear redirecciones de puertos seguras en RouterOS v7 y cómo configurar **Hairpin NAT** (o *NAT Loopback*) para permitir el acceso a dichos dominios desde dentro de la propia red local.

---

## 1. Redirección de Puertos Estándar (`dstnat`)

Para exponer un servidor web o proxy inverso situado en la red interna (por ejemplo, Nginx Proxy Manager en `192.168.10.25`):

```routeros
# Redirigir el puerto HTTP (80/TCP) para certificados Let's Encrypt / HTTP Challenge
/ip firewall nat add chain=dstnat protocol=tcp dst-port=80 \
    in-interface-list=WAN action=dst-nat \
    to-addresses=192.168.10.25 to-ports=80 \
    comment="HTTP -> Nginx Proxy Manager"

# Redirigir el puerto HTTPS (443/TCP) para todo el trafico web seguro
/ip firewall nat add chain=dstnat protocol=tcp dst-port=443 \
    in-interface-list=WAN action=dst-nat \
    to-addresses=192.168.10.25 to-ports=443 \
    comment="HTTPS -> Nginx Proxy Manager"
```

> [!tip] Buenas prácticas: Exponer solo el Proxy Inverso
> Nunca redirijas puertos de aplicaciones individuales directamente (como el puerto 8006 de Proxmox o el 8123 de Home Assistant). Publica únicamente los puertos 80 y 443 dirigidos a un Proxy Inverso con certificados SSL/TLS y autenticación reforzada.

---

## 2. El Problema del NAT Loopback (¿Por qué no carga mi dominio en casa?)

Cuando estás fuera de casa y accedes a `https://servicios.tudominio.com`, la conexión funciona perfectamente. Sin embargo, al conectarte a la Wi-Fi de tu casa, la página da un error de tiempo de espera (*Connection Timed Out*).

### ¿Por qué ocurre?
1. Tu cliente local (`192.168.20.50`) resuelve el dominio a tu **IP pública WAN**.
2. Envía el paquete TCP SYN al router MikroTik.
3. El router aplica `dstnat` y envía el paquete al servidor interno (`192.168.10.25`), pero **manteniendo la IP de origen local del cliente**.
4. El servidor responde directamente al cliente por la red interna (evitando pasar por el router).
5. El cliente recibe una respuesta desde una IP privada (`192.168.10.25`) cuando esperaba respuesta desde la IP pública del dominio, y **descarta el paquete TCP** por incoherencia de conexión.

---

## 3. Solución con Hairpin NAT en RouterOS

Para solucionar el bucle, se añade una regla `srcnat` que enmascara las conexiones originadas en la LAN cuyo destino sea la red de los servidores locales. De este modo, el servidor responde al router y el router devuelve la respuesta al cliente correctamente traducida.

### Regla Hairpin NAT en CLI:

```routeros
# Aplicar Hairpin NAT para todo el rango de redes locales que acceden a servidores internos
/ip firewall nat add chain=srcnat \
    src-address=192.168.0.0/16 dst-address=192.168.10.0/24 \
    out-interface=bridge-lan action=masquerade \
    comment="Hairpin NAT (NAT Loopback para acceso interno)"
```

*Donde:*
- `src-address=192.168.0.0/16`: Engloba todas las subredes internas de tu casa (VLAN 10, 20, 30).
- `dst-address=192.168.10.0/24`: Subred donde reside tu proxy inverso o servidores locales.
- `out-interface=bridge-lan`: Interfaz del bridge local por donde sale el paquete hacia el servidor.

---

## 4. Alternativa con Split-Horizon DNS

Si cuentas con **AdGuard Home** o **Pi-hole** en tu red local (ver `[[13-redireccion-dns-adguard-pihole|Control de DNS con AdGuard / Pi-hole]]`), puedes implementar **DNS Split-Horizon** (o reescritura DNS local):

1. En AdGuard Home, entra en **Filtros > Reescrituras DNS** (*DNS Rewrites*).
2. Añade una regla: `*.tudominio.com` $\rightarrow$ `192.168.10.25`.
3. Cuando tus dispositivos estén en casa, resolverán directamente a la IP privada del Proxy Inverso, evitando saturar la CPU del router con traducciones NAT adicionales.
