---
title: "MikroTik: Diagnóstico en tiempo real y monitorización con Torch"
description: "Aprende a usar la herramienta Torch de RouterOS para descubrir qué dispositivo satura tu conexión, analizar gráficas de tráfico en directo e interpretar los logs del sistema."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [beginners, diagnostics, homelab, mikrotik, monitoring, routeros, torch]
---

# Diagnóstico en tiempo real y monitorización con Torch

> [!abstract] Resumen
> Cuando la conexión a Internet se vuelve lenta de repente o un servicio deja de responder, RouterOS incluye un arsenal de herramientas de diagnóstico en tiempo real. La más potente y visual es **Torch**, una utilidad integrada que te permite "encender una linterna" sobre cualquier interfaz para ver exactamente qué IP, qué puerto y qué protocolo está consumiendo el ancho de banda en ese preciso instante.

---

## 1. La herramienta reina del diagnóstico: Torch

Para abrir Torch:
👉 Ve al menú lateral **Tools > Torch** (o abre cualquier interfaz en `Interfaces` y haz clic en el botón **Torch** en el panel superior/derecho).

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Torch <ether1>                                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ Interface: [ ether1 (WAN) ]               [✓] Src. Address   [✓] Dst. Address  │
│                                           [✓] Port           [✓] Protocol      │
├────────────────────────────────────────────────────────────────────────────────┤
│ [ Start ]  [ Stop ]                                                            │
├────────────────────────────────────────────────────────────────────────────────┤
│ SRC-ADDRESS       DST-ADDRESS        PRO. PORT   TX-RATE    RX-RATE            │
│ 192.168.88.45     162.254.195.34     udp  27015  1.2 Mbps   485.4 Mbps (Steam) │
│ 192.168.88.20     142.250.200.14     tcp  443    120 kbps   1.8 Mbps   (Web)   │
│ 192.168.88.80     52.84.12.90        tcp  443    45 kbps    600 kbps   (TV)    │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Cómo usarla paso a paso:
1. **Interface:** Elige la interfaz que quieres monitorizar:
   - `ether1`: Para ver todo el tráfico que entra o sale hacia Internet.
   - `bridge`: Para ver el tráfico interno entre tus dispositivos locales.
2. **Casillas de filtro:** Marca `Src. Address`, `Dst. Address`, `Port` y `Protocol`.
3. Haz clic en el botón **Start**.
4. Haz clic en la cabecera de la columna **Rx-Rate** o **Tx-Rate** para ordenar de mayor a menor consumo.
5. **Resultado inmediato:** En 3 segundos sabrás qué IP de tu casa está saturando la línea y a qué servicio se está conectando.

> [!tip] Torch por terminal (CLI)
> También puedes lanzar Torch directamente desde la consola para una inspección rápida:
> ```routeros
> /tool torch ether1 src-address=0.0.0.0/0 dst-address=0.0.0.0/0 port=any
> ```

---

## 2. Gráficas de tráfico por interfaz en vivo

Si solo quieres ver el volumen de megabits totales que circulan por un puerto:

1. Ve a **Interfaces** en el menú lateral.
2. Haz doble clic sobre la interfaz que te interese (ej. `ether1` para ver la velocidad total de tu fibra o `wifi1` para ver la radio Wi-Fi).
3. Haz clic en la pestaña **Traffic** de la ventana emergente.
4. Verás dos velocímetros en tiempo real y una gráfica continua con la velocidad de subida (**Tx**) y bajada (**Rx**).

---

## 3. Inspección del registro de eventos (*System Log*)

RouterOS registra todos los eventos clave en el menú:
👉 **Log**

```
┌────────────────────────────────────────────────────────────────────────┐
│ Log                                                                    │
├────────────────────────────────────────────────────────────────────────┤
│ TIME       TOPICS          MESSAGE                                     │
│ 10:14:02   dhcp, info      defconf assigned 192.168.88.45 to 48:A9:... │
│ 10:15:20   system, info    user admin logged in from 192.168.88.20     │
│ 10:18:05   wireless, info  48:A9:8A:11:22:33@wifi1 connected           │
│ 10:22:40   wireless, info  48:A9:8A:11:22:33@wifi1 disconnected,       │
│                            extensive data loss                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Mensajes habituales a los que prestar atención:
- `dhcp, info ... assigned`: Un dispositivo ha solicitado IP y se ha conectado a la red.
- `wireless, info ... connected / disconnected`: Un móvil u ordenador se ha asociado o desasociado del Wi-Fi.
- `system, error / warning`: Errores de sincronización horaria, caídas del enlace físico de un puerto Ethernet o intentos de acceso no autorizados.

---

## 4. Herramientas rápidas: Ping y Traceroute

Cuando sospechas que no hay salida a Internet o que un equipo local no responde, no abras la terminal de tu ordenador; ejecútalo directamente desde el procesador del router:

### Ping desde Winbox:
- Ve a **Tools > Ping**.
- Introduce la IP de destino (ej. `1.1.1.1` o `192.168.88.10`) y pulsa **Start**.
- Te mostrará la latencia en milisegundos y el porcentaje de paquetes perdidos (*packet loss*).

### Traceroute (Descubrir el camino de los paquetes):
- Ve a **Tools > Traceroute**.
- Introduce un dominio (ej. `google.com`) y pulsa **Start** para ver cada uno de los saltos e intermediarios por los que viaja tu tráfico hasta llegar al servidor de destino.
