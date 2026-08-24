---
title: "MikroTik: Optimización Wi-Fi en RouterOS (hAP ax2)"
description: "Guía de diagnóstico, separación de bandas Wi-Fi (SSID dual y Virtual APs), ajuste físico y optimización de radio Wi-Fi 6 en RouterOS v7."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [homelab, mikrotik, networking, routeros, wifi, wifi6]
---

# Optimización Wi-Fi en RouterOS (hAP ax2)

> [!abstract] Resumen
> Guía práctica de optimización para radios inalámbricas Wi-Fi 6 (802.11ax) en dispositivos MikroTik con RouterOS v7 (paquete `wifi` / `wifi-qcom`). Detalla la separación estratégica de bandas (2.4 GHz vs 5 GHz) y creación de Virtual APs, el impacto de la ubicación física, el ajuste del dominio regulatorio, la exclusión de canales DFS y los comandos de diagnóstico en tiempo real.

---

## Métricas de rendimiento obtenidas

Prueba realizada sobre conexión FTTH 600/75 Mbps con un MikroTik hAP ax2 sustituyendo al router del operador (en modo bridge):

| Métrica | Estado inicial (detrás de TV) | Estado optimizado (despejado) |
| :--- | :--- | :--- |
| **Velocidad Wi-Fi (5 GHz)** | 187 – 215 Mbps | **508 – 520 Mbps** |
| **Velocidad Cable (Gigabit)** | 625 Mbps | **625 Mbps** |
| **Link rate (5 GHz / 80 MHz)** | 286 Mbps | **576 – 1201 Mbps** |
| **Link rate (2.4 GHz / 20 MHz)** | No medido | **130 – 286 Mbps** |
| **RSSI cliente (a 2 metros)** | -68 dBm | **-45 dBm** |

> [!tip] La regla del obstáculo físico
> El factor más determinante en la degradación de la señal de 5 GHz fue la ubicación del router detrás del panel de la televisión. La reubicación a un espacio despejado aportó más de **300 Mbps de incremento real** sin modificar parámetros de software.

---

## 1. Diagnóstico de ubicación física y propagación RF

Las frecuencias de 5 GHz tienen una longitud de onda corta que sufre una atenuación drástica ante materiales densos, placas electrónicas y fuentes de alimentación.

> [!warning] Atenuación por pantallas y electrodomésticos
> Las pantallas de televisión modernas cuentan con chasis metálicos, circuitos integrados y fuentes de alimentación que actúan como apantallamiento electromagnético. Situar el router detrás de una TV refleja la señal y degrada el RSSI a niveles propios de tener varias paredes de por medio.

### Recomendaciones de colocación:
- **Elevación:** Colocar el router a una altura media (1–1.5 metros del suelo), nunca en el suelo o dentro de muebles cerrados.
- **Línea de visión:** Mantener despejada la trayectoria hacia las estancias principales de uso frecuente.
- **Separación de fuentes EMI:** Alejar al menos 1 metro de bases de teléfonos inalámbricos, fuentes conmutadas potentes o microondas.

---

## 2. Ajustes de radio en RouterOS v7 (`/interface wifi`)

En RouterOS v7, la gestión inalámbrica para dispositivos AX se realiza bajo el menú `/interface wifi` (o `/interface/wifi`).

### 2.1. Dominio regulatorio (`country`)

Si el país no está configurado, RouterOS restringe las frecuencias a valores genéricos conservadores, bloqueando canales estándar en Europa como UNII-1 (36–48) o aplicando potencias de transmisión incorrectas.

```routeros
# Aplicar dominio de España en la interfaz de 5 GHz
/interface wifi set [find name="wifi1"] configuration.country="Spain"

# Reiniciar la interfaz para aplicar los cambios
/interface wifi disable [find name="wifi1"]
/interface wifi enable [find name="wifi1"]
```

### 2.2. Exclusión de canales DFS (`skip-dfs-channels`)

Los canales DFS (52–64 y 100–144) requieren escaneo continuo de radares meteorológicos/militares. Ante falsos positivos, el router reduce el ancho de canal a 20 MHz o interrumpe la emisión durante varios minutos (tiempo CAC).

```routeros
# Forzar el uso exclusivo de canales libres de DFS (UNII-1 y UNII-3)
/interface wifi set [find name="wifi1"] channel.skip-dfs-channels=all
```

> [!info] Canales UNII-1 vs UNII-3
> Al omitir DFS, RouterOS seleccionará canales limpios en UNII-1 (36–48) o UNII-3 (149–165). Si se desea forzar un canal específico de baja atenuación para clientes locales, se puede fijar el canal 36.

---

## 3. Perfiles de configuración recomendados

### 3.1. Banda de 5 GHz (Máximo rendimiento)

| Parámetro | Configuración recomendada | Motivo |
| :--- | :--- | :--- |
| **Band** | `5ghz-ax` | Wi-Fi 6 nativo con modulación hasta 1024-QAM. |
| **Channel Width** | `20/40/80mhz` | Permite negociar 80 MHz para clientes de alto rendimiento. |
| **Country** | `Spain` | Habilita el plan de frecuencias regulado por la UE/CNMC. |
| **Skip DFS Channels** | `all` | Evita cortes por detección de radar y caídas de ancho de banda. |
| **Security** | `WPA2-PSK / WPA3-PSK` | Compatibilidad mixta con seguridad reforzada (WPA3 SAE). |

### 3.2. Banda de 2.4 GHz (Cobertura e IoT)

| Parámetro | Configuración recomendada | Motivo |
| :--- | :--- | :--- |
| **Band** | `2.4ghz-ax` (o `2.4ghz-g/n/ax`) | Compatibilidad con dispositivos domóticos antiguos. |
| **Channel Width** | `20mhz` | **Nunca usar 40 MHz** en 2.4 GHz para evitar solapamiento e interferencias. |
| **Channel** | `1`, `6` u `11` | Canales sin solapamiento espectral en la banda de 2.4 GHz. |

---

## 4. Estrategias para separar el Wi-Fi en RouterOS

Mantener un único nombre de red (SSID) para ambas frecuencias suele provocar que los clientes salten a la banda de 2.4 GHz ante pequeñas bajadas de señal, quedando limitados a ~80 Mbps. Además, muchos dispositivos domóticos (bombillas, enchufes) no admiten redes combinadas durante su proceso de emparejamiento.

### 4.1. Separación de bandas por SSID (2.4 GHz vs 5 GHz)

La forma más directa y eficaz de garantizar que los dispositivos de trabajo o multimedia aprovechen el ancho de banda completo es asignar identificadores SSID distintos a cada interfaz de radio física:

```routeros
# 1. Radio de 5 GHz (wifi1) -> Red exclusiva de alta velocidad
/interface wifi set [find name="wifi1"] configuration.ssid="ASMS5"

# 2. Radio de 2.4 GHz (wifi2) -> Cobertura extendida e IoT
/interface wifi set [find name="wifi2"] configuration.ssid="ASMS2"
```

> [!tip] Ventaja del SSID independiente
> Al forzar tu ordenador o móvil a conectarse a `MiRed_5G`, el dispositivo nunca conmutará de forma errática a 2.4 GHz, garantizando tasas de enlace estables superiores a 500 Mbps.

### 4.2. Creación de una red adicional para IoT o Invitados (Virtual AP)

RouterOS permite crear interfaces virtuales (*slave interfaces*) que emiten un SSID adicional utilizando el mismo hardware de radio.

> [!danger] Por qué no funciona solo con crear la interfaz Wi-Fi
> Al crear una interfaz virtual inalámbrica en RouterOS, esta nace **desconectada en Capa 2**. Si no se añade al `bridge` local (o no se le configura un servidor DHCP propio), los clientes asociados no recibirán dirección IP (`DHCP Discover` no llega a ningún sitio) y no podrán navegar.

#### Opción A: SSID dedicado compartiendo la red local (Método directo)

Ideal si solo quieres un SSID exclusivo para domótica/IoT pero que reciba IP del mismo rango DHCP que el resto de la casa:

```routeros
# 1. Crear la interfaz virtual en la radio de 2.4 GHz con contraseña
/interface wifi add master-interface=wifi2 name="wifi-iot" \
    configuration.ssid="ASMSIOT" \
    security.authentication-types=wpa2-psk,wpa3-psk \
    security.passphrase="TuContraseñaAqui" \
    disabled=no

# 2. VINCULAR AL BRIDGE (Imprescindible para recibir IP y tener Internet)
/interface bridge port add bridge=bridge interface=wifi-iot
```

#### Opción B: Red aislada con su propia subred y DHCP independiente (Aislamiento real)

Si deseas que los dispositivos IoT o invitados estén en un rango de red separado (ej. `192.168.99.0/24`) y no puedan acceder a tus equipos locales:

```routeros
# 1. Crear la interfaz virtual
/interface wifi add master-interface=wifi2 name="wifi-iot" \
    configuration.ssid="ASMSIOT" \
    security.authentication-types=wpa2-psk,wpa3-psk \
    security.passphrase="TuContraseñaAqui" \
    disabled=no

# 2. Asignar IP y rango a la interfaz IoT
/ip address add address=192.168.99.1/24 interface=wifi-iot network=192.168.99.0

# 3. Crear Pool de IPs y Servidor DHCP para la red IoT
/ip pool add name="pool-iot" ranges=192.168.99.10-192.168.99.200
/ip dhcp-server add name="dhcp-iot" interface=wifi-iot address-pool="pool-iot" lease-time=1d disabled=no
/ip dhcp-server network add address=192.168.99.0/24 gateway=192.168.99.1 dns-server=1.1.1.1,8.8.8.8

# 4. Aislar tráfico: permitir salida a Internet pero bloquear acceso a la LAN local
/ip firewall filter add chain=forward in-interface=wifi-iot out-interface-list=WAN action=accept comment="IoT a Internet" place-before=0
/ip firewall filter add chain=forward in-interface=wifi-iot dst-address=192.168.88.0/24 action=drop comment="Bloquear IoT hacia LAN" place-before=1
```

---

## 5. Comandos de diagnóstico y monitorización CLI

### Ver estado y parámetros activos de la interfaz

```routeros
/interface wifi print detail where name="wifi1"
```

### Monitorización de radio en tiempo real

```routeros
/interface wifi monitor [find name="wifi1"] once
```

### Inspección de clientes conectados y tasas de modulación (MCS)

Muestra los clientes asociados, su RSSI exacto, el índice MCS (Modulation and Coding Scheme) y el ancho de canal negociado:

```routeros
/interface wifi registration-table print stats
```

---

## 6. Métricas de validación en el cliente

Para verificar la calidad de la conexión desde un cliente macOS, mantén pulsada la tecla `Option (⌥)` y haz clic en el icono de Wi-Fi de la barra de menús:

| Parámetro | Rango óptimo | Diagnóstico |
| :--- | :--- | :--- |
| **RSSI** | `-40 dBm` a `-55 dBm` | Señal excelente (sin obstáculos cercanos). |
| **RSSI (Aceptable)** | `-55 dBm` a `-68 dBm` | Señal adecuada (1 o 2 paredes intermedias). |
| **RSSI (Degradado)** | `< -72 dBm` | Pérdida de paquetes y caída drástica de modulación MCS. |
| **Tx Rate / MCS (5 GHz)** | MCS 9 – 11 (2 streams) | Link rate de 576 a 1201 Mbps en 80 MHz. |
| **NSS** | `2` | 2x2 MIMO espacial activo. |

---

## 7. Velocidades reales esperadas por entorno

| Escenario | Rendimiento en 5 GHz (80 MHz) | Rendimiento en 2.4 GHz (20 MHz) |
| :--- | :--- | :--- |
| **Cable Gigabit (referencia)** | 600 – 625 Mbps (límite contratado) | 600 – 625 Mbps |
| **Línea de visión directa (< 3 m)** | 500 – 600 Mbps | 90 – 120 Mbps |
| **1 pared de tabique estándar** | 350 – 480 Mbps | 60 – 85 Mbps |
| **2 o más paredes / forjados** | 150 – 280 Mbps | 40 – 60 Mbps |

---

## 8. Protocolo de resolución ante caídas de rendimiento

Si en algún momento la velocidad inalámbrica desciende de forma anómala:

1. **Comprobar RSSI y canal:** Verifica en el cliente si se ha conectado a la banda de 2.4 GHz por error o si el RSSI ha caído por debajo de -70 dBm.
2. **Revisar saturación de canal:** Ejecuta `/interface wifi monitor [find name="wifi1"]` para comprobar el porcentaje de ocupación del canal (`channel-use`).
3. **Reinicio suave de la interfaz:**
   ```routeros
   /interface wifi disable [find name="wifi1"]
   /interface wifi enable [find name="wifi1"]
   ```
4. **Revisar interferencias físicas:** Asegúrate de que no se hayan colocado nuevos dispositivos o cables sobre el router.
