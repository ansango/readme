---
title: Redes inalámbricas y Bluetooth
description: "Comandos para inspeccionar y conectar redes Wi-Fi, auditar tu propia red con aircrack-ng y reconocer dispositivos Bluetooth cercanos"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, redes]
---

# Redes inalámbricas y Bluetooth

> [!abstract] Resumen
> Cómo inspeccionar y conectar interfaces Wi-Fi con `iwconfig`, `iwlist` y `nmcli`, cómo poner una tarjeta en modo monitor con la suite `aircrack-ng` para auditar la seguridad de tu propia red, y cómo escanear y reconocer dispositivos Bluetooth cercanos con las herramientas de BlueZ (`hciconfig`, `hcitool`, `sdptool`, `l2ping`).

## Wi-Fi: conceptos previos

Antes de tocar comandos conviene tener claros unos pocos términos que aparecen constantemente en la salida de estas herramientas:

- **AP (access point)**: el dispositivo al que se conectan los clientes para tener acceso a la red.
- **SSID**: el nombre de la red. El **ESSID** es lo mismo pero cuando varios APs comparten el mismo nombre formando una única red Wi-Fi.
- **BSSID**: identificador único de cada AP, coincide con su dirección MAC.
- **Canal**: Wi-Fi opera en canales del 1 al 14 (en EE. UU. solo 1-11), dentro de las bandas de 2.4GHz o 5GHz.
- **Seguridad**: WEP (obsoleto e inseguro), WPA y WPA2-PSK (el estándar actual con clave compartida).
- **Modos**: `managed` (cliente conectado o listo para conectarse a un AP), `master` (actuando como AP) y `monitor` (captura todo el tráfico que pasa por el aire, no solo el dirigido a la propia tarjeta).
- **Potencia**: cuanto más cerca estés del AP, mayor la potencia de la señal recibida y más fácil resulta capturar e interpretar su tráfico. La potencia (`PWR`, en dBm) es uno de los primeros datos que se mira al elegir qué objetivo auditar.
- **Alcance**: en EE. UU., un AP Wi-Fi está legalmente limitado a emitir a un máximo de 0.5 W, lo que le da un alcance normal de unos 100 metros (300 pies). Con una antena de alta ganancia (barata y fácil de conseguir) ese alcance puede extenderse hasta varios kilómetros, algo a tener en cuenta tanto para auditar como para defenderte.
- **Frecuencia**: Wi-Fi opera en 2.4GHz y 5GHz; la mayoría de tarjetas y APs modernos soportan ambas bandas simultáneamente. La banda de 5GHz ofrece más canales y menos interferencias, pero peor penetración a través de paredes.

## Inspeccionar interfaces Wi-Fi

`ifconfig` ya muestra las interfaces de red, pero `iwconfig` está pensado específicamente para las inalámbricas:

```bash
iwconfig
# lo      no wireless extensions
# wlan0   IEEE 802.11bg  ESSID:off/any
#         Mode:Managed  Access Point:Not-Associated  Tx-Power=20 dBm
# eth0    no wireless extensions
```

> [!note]
> Solo aparecen datos "reales" en las interfaces inalámbricas (`wlan0`); en las cableadas (`eth0`) y en `lo` se indica directamente que no tienen extensiones wireless.

En Kali (y en la mayoría de distros orientadas a auditoría) las interfaces Wi-Fi se numeran como `wlanX`: la primera tarjeta es `wlan0`, la segunda `wlan1`, y así sucesivamente. Es habitual tener varias a la vez si conectas un adaptador USB externo además del chip interno del portátil.

`iwconfig` también expone, aunque en la salida completa (no truncada) que se ve más arriba, varios campos que conviene saber leer:

- **Retry short limit**: número de reintentos que hace la tarjeta antes de descartar un paquete corto no confirmado.
- **RTS thr / Fragment thr**: umbrales de tamaño de paquete para activar el mecanismo *Request to Send* o la fragmentación; en `off` significa que no se están usando.
- **Encryption key**: si la tarjeta tiene configurada una clave de cifrado (no confundir con si el AP al que se conecta usa cifrado).
- **Power Management**: si el ahorro de energía de la interfaz está activo, lo que puede introducir latencia en la captura de tráfico.

### Buscar redes cercanas con `iwlist`

```bash
iwlist wlan0 scan
```

Devuelve todos los APs al alcance de la tarjeta, con su MAC (BSSID), canal, frecuencia, nivel de señal y si tienen cifrado activo. Este dato —BSSID del AP, canal, y MAC de algún cliente conectado— es la información base que necesitas antes de intentar cualquier auditoría de la red.

### Buscar y conectar con `nmcli`

`nmcli` es la interfaz de línea de comandos del NetworkManager, el daemon que gestiona las conexiones de red (normalmente lo usas desde su GUI sin saberlo):

```bash
nmcli dev wifi                                          # lista APs cercanos con SSID, canal, señal y seguridad
nmcli dev wifi connect Hackers-Arise password 12345678   # conectar a un AP con contraseña
```

Tras conectar, vuelve a ejecutar `iwconfig`: verás el ESSID, la frecuencia y la MAC del AP asociado, además de la calidad de la señal.

```bash
iwconfig
# wlan0   IEEE 802.11bg  ESSID:"Hackers-Arise"
#         Mode:Managed  Frequency:2.452GHz  Access Point:00:25:9C:97:4F:48
#         Bit Rate=12 Mb/s  Tx-Power=20 dBm
#         Link Quality=64/70  Signal level=-46 dBm
```

Ahora sí hay datos de verdad: el ESSID ya no es `off/any`, aparece la frecuencia real a la que opera el AP y su MAC (BSSID). Como una misma red Wi-Fi puede estar formada por varios APs con el mismo ESSID, ese BSSID identifica exactamente a cuál te has asociado, algo importante para cualquier análisis posterior de la red.

> [!tip]
> `nmcli` da más contexto que `iwlist` en un formato más legible (modo, tasa de transferencia, seguridad en columnas), así que suele ser la primera opción para el día a día. `iwlist` sigue siendo útil cuando necesitas el detalle completo de cada celda detectada.

## Auditoría de Wi-Fi con aircrack-ng

> [!warning] Uso ético y legal
> Todo lo que sigue solo debe practicarse sobre **tu propia red** o en un entorno de laboratorio con permiso explícito. Poner una tarjeta en modo monitor y capturar handshakes de una red ajena sin autorización es ilegal en la inmensa mayoría de jurisdicciones. El objetivo aquí es que sepas auditar la seguridad de tu propia infraestructura, no la de terceros.

La suite `aircrack-ng` viene preinstalada en Kali y permite poner la tarjeta en **modo monitor**, es decir, capturar todo el tráfico que pasa por el aire dentro de su alcance, no solo el dirigido a ella (el equivalente inalámbrico del modo promiscuo en redes cableadas).

```bash
airmon-ng start wlan0
# PHY   INTERFACE  DRIVER   Chipset
# phy0  wlan0      rt18187  Realtek Semiconductor Corp RTL8187
# (monitor mode vif enabled for [phy0]wlan0 on [phy0]wlan0mon)
```

`airmon-ng` renombra la interfaz (por ejemplo a `wlan0mon`); usa ese nuevo nombre en los siguientes pasos. Para volver al modo normal:

```bash
airmon-ng stop wlan0mon
```

> [!warning]
> Al arrancar `airmon-ng` es habitual que avise de "procesos que pueden dar problemas" (`Found three processes that could cause trouble`), normalmente `NetworkManager`, `wpa_supplicant` o `dhclient`. Si `airodump-ng`, `aireplay-ng` o `airtun-ng` dejan de funcionar al poco de arrancar, es porque uno de esos procesos ha vuelto a tomar el control de la interfaz. La solución rápida es `airmon-ng check kill`, que los mata antes de poner la tarjeta en modo monitor (ten en cuenta que esto también corta cualquier conexión Wi-Fi "normal" que tuvieras activa).

Con la tarjeta en modo monitor, `airodump-ng` captura y muestra en tiempo real los APs y clientes visibles: BSSID, potencia de señal (PWR), cifrado (ENC), canal (CH) y ESSID.

```bash
airodump-ng wlan0mon
```

> [!example] Flujo completo de auditoría (en tu propia red, con permiso)
> ```bash
> # 1. Modo monitor
> airmon-ng start wlan0
>
> # 2. Capturar el handshake WPA2 de un AP concreto (canal y BSSID sacados del paso anterior)
> airodump-ng -c 10 --bssid 01:01:AA:BB:CC:22 -w capturas wlan0mon
>
> # 3. En otra terminal, forzar una reautenticación para acelerar la captura del handshake
> aireplay-ng --deauth 100 -a 01:01:AA:BB:CC:22 -c A0:A3:E2:44:7C:E5 wlan0mon
>
> # 4. Intentar recuperar la contraseña a partir del handshake capturado y un diccionario
> aircrack-ng -w wordlist.dic -b 01:01:AA:BB:CC:22 capturas.cap
> ```
> El resultado depende por completo de que la contraseña esté en el diccionario usado; esto es una prueba de robustez de tu propia clave WPA2, no un atajo garantizado.

## Cómo funciona Bluetooth

Bluetooth es un protocolo universal de comunicación de corto alcance y bajo consumo (*near-field communication*) que opera entre 2.4 y 2.485GHz. A diferencia de Wi-Fi, usa **espectro ensanchado con salto de frecuencia** (*frequency hopping spread spectrum*): el dispositivo cambia de canal hasta 1600 veces por segundo dentro de esa banda, lo que originalmente se diseñó como medida de seguridad y para reducir interferencias con otros dispositivos que comparten la misma frecuencia (como el propio Wi-Fi de 2.4GHz).

> [!note] Un poco de historia
> Bluetooth lo desarrolló Ericsson en 1994, y su nombre es un homenaje a Harald Blåtand ("diente azul"), rey vikingo del siglo X que unificó Dinamarca y Noruega, igual que el protocolo pretendía unificar los estándares de comunicación entre dispositivos.

La especificación exige un alcance mínimo de 10 metros, pero no pone techo al alcance máximo: muchos dispositivos llegan a los 100 metros, y con antenas especiales ese alcance puede ampliarse todavía más. Esto tiene implicaciones prácticas para una auditoría: un dispositivo Bluetooth "cercano" puede en realidad ser accesible desde bastante más lejos de lo que parece razonable.

### Descubrimiento y emparejamiento

Conectar dos dispositivos Bluetooth se llama **emparejamiento** (*pairing*), pero solo es posible si al menos uno de ellos está en **modo detectable** (*discoverable*). Un dispositivo en ese modo transmite:

- Su nombre.
- Su clase (qué tipo de dispositivo es: teléfono, auriculares, teclado...).
- La lista de servicios que ofrece.
- Información técnica adicional (reloj, capacidades).

Al emparejarse, ambos dispositivos intercambian una **clave de enlace** (*link key*) que cada uno guarda para reconocer al otro en futuras conexiones sin repetir todo el proceso. Además, cada dispositivo tiene un identificador único de 48 bits (una dirección tipo MAC) y normalmente un nombre asignado por el fabricante: son los dos datos que vas a necesitar para identificar y acceder a cualquier dispositivo cercano.

## Bluetooth: escaneo y reconocimiento

La pila Bluetooth de Linux se llama **BlueZ** y viene instalada por defecto en la mayoría de distribuciones (si no, `apt install bluez`). Igual que con Wi-Fi, antes de nada hay que confirmar que el adaptador está reconocido y activo.

### Comprobar y activar el adaptador con `hciconfig`

```bash
hciconfig
# hci0: Type: BR/EDR  Bus: USB
#       BD Address: 10:AE:60:58:F1:37 ...
#       UP RUNNING PSCAN INQUIRY

hciconfig hci0 up   # activa el adaptador si aparece down
```

### Escanear dispositivos con `hcitool`

```bash
hcitool scan
# 72:6E:46:65:72:66    ANDROID BT
# 22:C5:96:08:5D:32    SCH-I535
```

Encuentra dispositivos que estén en modo detectable. Para obtener más datos (clock offset, clase de dispositivo) de las MACs ya localizadas:

```bash
hcitool inq
```

> [!note]
> El campo `class` que devuelve `hcitool inq` es un código que identifica el tipo de dispositivo (teléfono, auriculares, teclado...). Puedes consultarlo en el registro de *assigned numbers* del Bluetooth SIG.

### Explorar servicios con `sdptool`

Una vez tienes la MAC de un dispositivo, `sdptool` permite ver qué servicios ofrece sin que tenga que estar en modo detectable:

```bash
sdptool browse 76:6E:46:63:72:66
```

### Comprobar si un dispositivo está al alcance con `l2ping`

```bash
l2ping 76:6E:46:63:72:66 -c 3
# 3 sent, 3 received, 0% loss
```

Confirma que el dispositivo responde y está dentro de rango antes de intentar cualquier otra interacción con él.

### Capturar tráfico con `hcidump`

BlueZ incluye también `hcidump`, el equivalente Bluetooth de un sniffer de paquetes: permite capturar y volcar la comunicación que pasa por el adaptador, igual que `tcpdump` hace con tráfico de red convencional. Es la herramienta que usarías para pasar de "saber que un dispositivo existe y responde" a "entender qué se están diciendo dos dispositivos emparejados".

```bash
hcidump -X   # vuelca en hexadecimal y ASCII el tráfico HCI capturado
```

> [!tip]
> `hcitool`, `sdptool`, `l2ping` y `hcidump` se pueden combinar en un script bash o Python para automatizar el reconocimiento de todos los dispositivos Bluetooth de una zona: escanear con `hcitool scan`, sacar detalle con `inq`, listar servicios con `sdptool`, comprobar alcance con `l2ping` y, si hace falta profundizar, capturar con `hcidump`. La mayoría de herramientas de "hacking Bluetooth" que circulan por ahí no son más que esta misma secuencia envuelta en un script.

## Próximos pasos

- [[16-kernel-y-modulos|Kernel y módulos]]: qué es un módulo del kernel, cómo listarlos e inspeccionarlos, y cómo cargarlos y quitarlos de forma segura.
