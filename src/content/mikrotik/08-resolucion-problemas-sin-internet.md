---
title: "MikroTik: Diagnóstico de red local sin Internet"
description: "Guía paso a paso en RouterOS para diagnosticar y solucionar cuando el router MikroTik recibe IP pública (WAN) pero los equipos de la red local (LAN/Wi-Fi) no tienen acceso a Internet."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [homelab, mikrotik, networking, routeros, troubleshooting]
---

# Diagnóstico de red local sin Internet

> [!abstract] Resumen
> Esta guía detalla el procedimiento estructurado para diagnosticar y resolver el fallo en el que un router MikroTik con RouterOS obtiene conectividad e IP pública en su interfaz WAN (`ether1`), pero los clientes conectados a la red local (LAN o Wi-Fi) no consiguen navegar. El flujo de resolución analiza sucesivamente: conectividad WAN, enmascaramiento NAT, resolución DNS y bloqueo por caché ARP/MAC en la ONT o módem del proveedor.

---

## 1. Diagnóstico por capas (Router vs. Proveedor)

Antes de modificar reglas o configuraciones, es necesario aislar si la pérdida de conectividad ocurre en el enlace WAN exterior o en el reenvío de tráfico hacia la red interna.

Abre la **Terminal** en RouterOS (mediante Winbox, WebFig o SSH) y ejecuta las siguientes comprobaciones:

### 1.1. Prueba de conectividad directa (ICMP)

```routeros
/ping 8.8.8.8 count=4
```

* **Resultado A (packet-loss = 0%):** El router MikroTik **sí tiene salida directa a Internet**. El fallo se encuentra en la capa de traducción de direcciones (NAT), en el enrutamiento interno o en el DNS. Continúa con el [Paso 2](#2-verificación-y-reparación-del-nat-masquerade).
* **Resultado B (timeout o packet-loss = 100%):** El router **no tiene salida a Internet**. Revisa el estado del cable físico en `ether1`, la concesión DHCP WAN o la ONT/módem.

### 1.2. Verificación de IP WAN y Ruta por defecto

Comprueba que el cliente DHCP ha recibido los parámetros de red del ISP:

```routeros
/ip dhcp-client print detail
```

Verifica que el campo `status` muestre `bound` y que tenga asignada una dirección IP pública.

A continuación, revisa la tabla de rutas:

```routeros
/ip route print where dst-address=0.0.0.0/0
```

> [!tip] Comprobación de Gateway activo
> Debe existir una ruta con bandera `DA` (*Dynamic, Active*) apuntando a la dirección IP de la pasarela (*gateway*) suministrada por tu proveedor.

---

## 2. Verificación y reparación del NAT (Masquerade)

El enmascaramiento (*NAT / Masquerade*) es el mecanismo que traduce las direcciones privadas de la red local (como `192.168.88.0/24`) a la dirección IP pública del puerto WAN. Si esta regla está ausente, dañada o mal vinculada, los clientes locales no podrán comunicarse con el exterior.

### 2.1. Revisión de reglas existentes

1. En Winbox / WebFig, dirígete a **IP > Firewall > NAT** (o ejecuta `/ip firewall nat print`).
2. Verifica que exista la regla de enmascaramiento:
   * **Chain:** `srcnat`
   * **Out. Interface:** `ether1` (o tu interfaz WAN configurada)
   * **Action:** `masquerade`

> [!warning] Conflicto entre Out. Interface y Out. Interface List
> No mezcles simultáneamente `Out. Interface` (ej. `ether1`) con `Out. Interface List` (ej. `WAN`) en la misma regla si la interfaz no pertenece estrictamente a esa lista. Deja `Out. Interface List` vacío o selecciona únicamente la interfaz física correcta.

### 2.2. Creación / Restauración por Terminal

Si la regla no existe o está corrupta, créala con el siguiente comando:

```routeros
/ip firewall nat add chain=srcnat action=masquerade out-interface=ether1 comment="Internet LAN Masquerade"
```

---

## 3. Limpieza y configuración de DNS

Un síntoma muy habitual de "falta de internet" ocurre cuando las IPs responden (por ejemplo, `ping 1.1.1.1`), pero los nombres de dominio no resuelven (`google.com`).

### 3.1. Configurar servidores upstream y permitir peticiones

1. En el menú, accede a **IP > DNS**.
2. En el campo **Servers**, define servidores DNS públicos confiables: `1.1.1.1,8.8.8.8`.
3. Activa la opción **Allow Remote Requests** (permite que los clientes LAN utilicen el router como resolver local).
4. Haz clic en **Apply**.

```routeros
/ip dns set allow-remote-requests=yes servers=1.1.1.1,8.8.8.8
```

> [!danger] Evitar bucles de DNS en la lista upstream
> **Nunca** incluyas la IP local del router (como `192.168.88.1`) en la lista de servidores de `/ip dns`, ya que creará bucles de resolución recursiva que colapsarán la CPU del router.

### 3.2. Asignación de DNS a los clientes vía DHCP

Asegúrate de que el servidor DHCP entrega las direcciones DNS correctas a los clientes de la LAN:

```routeros
/ip dhcp-server network print
```

Para actualizar los servidores DNS ofrecidos a los clientes en la subred local:

```routeros
/ip dhcp-server network set [find] dns-server=1.1.1.1,8.8.8.8
```

*(O `dns-server=192.168.88.1` si utilizas la caché DNS de RouterOS con `allow-remote-requests=yes`).*

---

## 4. Bloqueo por MAC del proveedor (Caché ARP en ONT/Módem)

Cuando la configuración del MikroTik es correcta, el cliente DHCP obtiene IP pero el tráfico saliente es descartado silenciosamente por el proveedor, la causa raíz suele ser el **enlace de dirección MAC** (*MAC binding* o tabla ARP estricta en el equipo del ISP).

Las ONT o módems en modo bridge suelen memorizar la MAC del primer dispositivo conectado y descartan el tráfico de cualquier nueva interfaz.

### Procedimiento de desbloqueo y sincronización

1. **Apaga por completo la ONT / módem** desenchufándolo de la corriente eléctrica.
2. **Espera un mínimo de 3 minutos completos.** Este tiempo es imprescindible para que el concentrador (*BRAS/OLT*) del operador de telecomunicaciones detecte la desconexión física y libere la sesión previa.
3. Enciende el módem/ONT y espera hasta que las luces de sincronización PON/LAN estén estables.
4. **Reinicia el MikroTik** y renueva las conexiones en tus clientes:

```routeros
/system reboot
```

---

## 5. Script de rescate rápido (RouterOS CLI)

Si has restablecido el router a valores de fábrica, has cambiado de proveedor o necesitas reparar toda la pila de salida a Internet en un solo paso, ejecuta el siguiente bloque de comandos en **New Terminal**:

```routeros
# 1. Configurar o asegurar cliente DHCP en ether1
/ip dhcp-client remove [find interface=ether1]
/ip dhcp-client add interface=ether1 use-peer-dns=yes use-peer-ntp=yes add-default-route=yes disabled=no

# 2. Configurar enmascaramiento NAT correcto
/ip firewall nat remove [find comment="Internet LAN Masquerade"]
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="Internet LAN Masquerade"

# 3. Configurar DNS limpios y habilitar consultas remotas
/ip dns set allow-remote-requests=yes servers=1.1.1.1,8.8.8.8

# 4. Limpiar tabla de seguimiento de conexiones (vaciar estados obsoletos)
/ip firewall connection remove [find]
```

> [!note] Persistencia de sesiones
> Vaciar la tabla de conexiones (`/ip firewall connection remove [find]`) fuerza a todos los clientes a renegociar estados TCP/UDP a través de la nueva regla de NAT, evitando bloqueos por conexiones colgadas.
