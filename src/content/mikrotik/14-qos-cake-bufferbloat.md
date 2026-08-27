---
title: "MikroTik: Calidad de servicio (QoS) y mitigación de Bufferbloat con CAKE"
description: "Eliminación del lag, picos de latencia en juegos y congelaciones en videollamadas mediante el algoritmo SQM/CAKE en Queues de RouterOS v7."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [bufferbloat, cake, homelab, mikrotik, networking, qos, routeros, sqm]
---
[[]]
# Calidad de servicio (QoS) y mitigación de Bufferbloat con CAKE

> [!abstract] Resumen
> El **Bufferbloat** es el aumento descontrolado de la latencia cuando la conexión a Internet se satura por descargas pesadas o subidas de archivos, provocando cortes en videollamadas (Zoom, Teams, Google Meet) y lag en juegos online. RouterOS v7 incorpora de forma nativa el algoritmo **CAKE (*Common Applications Kept Enhanced*)**, el mecanismo de gestión de colas activas (*Active Queue Management / SQM*) más avanzado de la actualidad.

---

## 1. Diagnóstico previo del Bufferbloat

Antes de aplicar cualquier cambio, realiza un test de Bufferbloat desde un equipo conectado preferentemente por cable:

1. Accede a [Waveform Bufferbloat Test](https://www.waveform.com/tools/bufferbloat).
2. Si obtienes una calificación **C, D o F** con incrementos de latencia superiores a `+30 ms` durante la subida o descarga, tu red sufre Bufferbloat.
3. El objetivo tras configurar CAKE es alcanzar una calificación **A o A+** (incremento menor a `+5 ms`).

---

## 2. Configuración de Tipos de Cola CAKE en RouterOS v7

En la terminal de RouterOS, crea los tipos de cola (*Queue Types*) optimizados para la subida (*upload*) y la bajada (*download*):

```routeros
# 1. Cola CAKE para Descarga (Downlink)
/queue type add name="cake-download" kind=cake cake-flowmode=triple-isolate \
    cake-diffserv=diffserv4 cake-overhead=docsis cake-nat=yes cake-rtt=100ms

# 2. Cola CAKE para Subida (Uplink)
/queue type add name="cake-upload" kind=cake cake-flowmode=triple-isolate \
    cake-diffserv=diffserv4 cake-overhead=docsis cake-nat=yes cake-rtt=100ms
```

> [!tip] Explicación de parámetros clave
> - `cake-flowmode=triple-isolate`: Distribuye el ancho de banda equitativamente entre hosts internos, hosts externos y flujos individuales, impidiendo que una sola descarga acapare la línea.
> - `cake-nat=yes`: Permite a CAKE inspeccionar las IPs privadas reales detrás del NAT para aislar a los clientes de forma justa.

---

## 3. Creación de la Cola Simple (Simple Queue)

Para que CAKE controle el flujo antes de que los buffers del módem del operador se saturen, se debe limitar la velocidad en el router al **90% - 95%** del ancho de banda contratado real.

*Ejemplo para una línea contratada de 600 Mbps de descarga y 75 Mbps de subida (Lowi/Vodafone):*
- **Límite de subida (Upload):** 70 Mbps (`70M`)
- **Límite de bajada (Download):** 570 Mbps (`570M`)

```routeros
# Crear la cola simple vinculada a la interfaz WAN (ether1)
/queue simple add name="SQM-CAKE-WAN" \
    target=ether1 \
    max-limit=70M/570M \
    queue=cake-upload/cake-download \
    comment="Mitigacion de Bufferbloat con CAKE"
```

---

## 4. Interacción con FastTrack y Rendimiento de CPU

> [!warning] FastTrack y Queues en RouterOS
> Las reglas de aceleración **FastTrack** saltan el procesamiento de colas para ahorrar CPU. Para que CAKE procese todo el tráfico, desactiva la regla FastTrack o crea una excepción para el tráfico interactivo en `/ip firewall filter`:
> ```routeros
> /ip firewall filter disable [find action=fasttrack-connection]
> ```
> El procesador ARM Quad-Core del **MikroTik hAP ax²** (IPQ-6010) es capaz de gestionar colas CAKE a velocidades de hasta 500–700 Mbps sin saturación.

---

## 5. Verificación de Resultados

1. Vuelve a ejecutar la prueba en [Waveform Bufferbloat Test](https://www.waveform.com/tools/bufferbloat).
2. Durante una descarga máxima de Steam o Torrent, inicia una llamada de Google Meet o una sesión de juego: la latencia debe permanecer completamente plana y estable.
