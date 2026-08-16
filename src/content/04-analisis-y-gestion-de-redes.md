---
title: Análisis y gestión de redes
description: "Referencia rápida para inspeccionar interfaces de red, cambiar IP, máscara y MAC, gestionar DHCP, resolver DNS con dig y mapear nombres en /etc/hosts"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, redes]
---

# Análisis y gestión de redes

> [!abstract] Resumen
> Cheatsheet de las herramientas de red más básicas de Linux: inspeccionar interfaces con `ifconfig`/`iwconfig`, cambiar IP, máscara y dirección MAC, pedir una IP por DHCP, resolver información DNS con `dig` y mapear nombres de dominio propios en `/etc/hosts`.

## Qué es una interfaz de red

Antes de tocar comandos conviene tener claro qué es lo que estamos inspeccionando. Una **interfaz de red** es la representación, a nivel de kernel, de un punto de conexión a una red: puede corresponder a hardware real (una tarjeta Ethernet, un chip Wi-Fi) o ser puramente software (la interfaz de loopback, un túnel VPN, un puente virtual). El kernel le asigna un nombre (`eth0`, `wlan0`, `lo`...) y le asocia una serie de parámetros: estado (arriba/abajo), dirección MAC, una o varias direcciones IP, máscara de red, MTU, estadísticas de tráfico, etc.

Cuando ejecutas un comando como `ifconfig` o `ip addr`, no estás preguntando a la tarjeta de red directamente: estás leyendo la vista que el kernel mantiene de esa interfaz, construida a partir del driver del dispositivo y de la configuración que se le haya aplicado (manual, por DHCP, o por un gestor de red como NetworkManager).

> [!note] `ifconfig` frente a `ip`: por qué conviene conocer las dos
> El libro (y muchas guías clásicas) se apoyan en `ifconfig`, pero esta herramienta forma parte del paquete `net-tools`, que lleva años sin desarrollo activo y que muchas distribuciones ya no instalan por defecto (Arch, Fedora y las Debian/Ubuntu más recientes). Su sustituto es el comando `ip`, del paquete `iproute2`, que es el que de verdad vas a encontrar preinstalado en un sistema Linux moderno. La equivalencia básica es:
>
> ```bash
> ifconfig            # equivalente a...
> ip addr show        # o ip a
>
> ifconfig eth0 up    # equivalente a...
> ip link set eth0 up
>
> ifconfig eth0 192.168.1.115 netmask 255.255.255.0   # equivalente a...
> ip addr add 192.168.1.115/24 dev eth0
> ```
>
> `ip` además distingue mejor entre configuración de "capa 2" (`ip link`, MAC, estado de la interfaz) y "capa 3" (`ip addr`, direcciones IP), algo que `ifconfig` mezcla todo en una sola salida. Esta nota sigue el enfoque del libro con `ifconfig` porque es más didáctico para empezar, pero en un sistema real de hoy es `ip` lo que vas a usar el 90% de las veces.

## Inspeccionar interfaces con `ifconfig`

`ifconfig` es la herramienta clásica para consultar y configurar las interfaces de red activas del sistema:

```bash
ifconfig
```

```text
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
      inet 192.168.1.131  netmask 255.255.255.0  broadcast 192.168.1.255
      ether 00:0c:29:ba:82:0f  ...

lo:   flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
      inet 127.0.0.1  netmask 255.0.0.0
```

De cada interfaz podemos leer:

- **Nombre**: `eth0` es la primera interfaz Ethernet cableada (Linux empieza a contar en 0); `lo` es la interfaz de *loopback*, un canal puramente software que apunta a `127.0.0.1` y solo sirve para que el propio equipo se comunique consigo mismo (por ejemplo, para probar un servidor web local).
- **`ether`**: la dirección MAC (*Media Access Control*), un identificador único grabado en la tarjeta de red.
- **`inet`**: la IP asignada a esa interfaz, junto con la máscara de red (`netmask`) y la dirección de broadcast, usada para enviar información a todos los equipos de la subred.

> [!note]
> `ifconfig` está marcado como obsoleto en muchas distribuciones modernas en favor del comando `ip` (`ip addr`, `ip link`), parte del paquete `iproute2`. Sigue disponible en la mayoría de sistemas Debian/Ubuntu instalando el paquete `net-tools`, y como referencia histórica y didáctica sigue siendo muy útil para entender los conceptos básicos.

## Consultar adaptadores inalámbricos con `iwconfig`

Si el equipo tiene una interfaz Wi-Fi, `iwconfig` muestra información específica de redes inalámbricas que `ifconfig` no reporta:

```bash
iwconfig
```

```text
wlan0   IEEE 802.11bg  ESSID:off/any
        Mode:Managed  Access Point: Not Associated  Tx-Power=20 dBm

lo      no wireless extensions
eth0    no wireless extensions
```

Aquí vemos el estándar inalámbrico soportado (`b`, `g`, y en equipos modernos también `n` o `ac`), el modo de la interfaz (`Managed` es el modo normal de cliente, frente a modo monitor o promiscuo, usados para capturar tráfico) y si está o no asociada a un punto de acceso.

`Tx-Power` indica la potencia de transmisión en dBm, un dato relevante al evaluar el alcance de una red o al comparar adaptadores. En equipos modernos, `iwconfig` va camino de la misma obsolescencia que `ifconfig`: su sustituto es `iw` (`iw dev`, `iw dev wlan0 link`, `iw dev wlan0 scan`), también parte de `iproute2`/`wireless-tools` modernas.

> [!note] Modo monitor
> El modo `Managed` es el que usa cualquier portátil conectado a un router: la tarjeta solo procesa el tráfico dirigido a ella. Para auditoría inalámbrica (capturar handshakes WPA, analizar tráfico ajeno) se necesita **modo monitor**, en el que la tarjeta captura todos los paquetes que llegan a su rango de frecuencia, estén o no dirigidos a ella. Cambiar a modo monitor no se hace con `iwconfig` a pelo en la mayoría de tarjetas modernas: se usa una herramienta como `airmon-ng` (del paquete `aircrack-ng`), que además mata los procesos que puedan interferir con la interfaz (`NetworkManager`, `wpa_supplicant`).

## Cambiar la configuración de red

Poder cambiar tu configuración de red manualmente es útil tanto para depurar problemas de conectividad como para adaptar un equipo a una red distinta sin depender de DHCP. Y desde la óptica de este libro, tiene una segunda utilidad: presentarte ante una red como un dispositivo distinto al que realmente eres, algo relevante tanto para evadir controles de acceso como, en un ataque de denegación de servicio (DoS), para que el tráfico parezca originarse en otra máquina y dificultar el rastreo forense posterior.

### Cambiar la IP

```bash
ifconfig eth0 192.168.1.115
```

Si el comando se ejecuta correctamente, no imprime nada: el silencio es la confirmación. Verifica el cambio volviendo a ejecutar `ifconfig`.

### Cambiar máscara de red y broadcast

```bash
ifconfig eth0 192.168.1.115 netmask 255.255.0.0 broadcast 192.168.1.255
```

Puedes fijar los tres parámetros (IP, máscara y broadcast) en una sola llamada.

> [!note] Qué hace realmente la máscara de red
> La máscara (`netmask`) no es un dato decorativo: define qué parte de la IP identifica la red y qué parte identifica al host dentro de ella. Con `255.255.255.0` (equivalente a `/24` en notación CIDR), los tres primeros octetos (`192.168.1`) son la red y el último (`.115`) es el host; por tanto, esa interfaz puede hablar directamente con cualquier IP de `192.168.1.0` a `192.168.1.255` sin pasar por un router. Cambiar la máscara a `255.255.0.0` (`/16`) amplía artificialmente lo que el sistema considera "mi misma red local" a todo el rango `192.168.0.0`–`192.168.255.255`, lo cual puede ser útil para depurar, pero también puede hacer que el equipo intente comunicarse directamente (sin pasar por el router) con hosts que en realidad están en un segmento distinto y son inalcanzables así.
>
> El **broadcast** es la dirección especial (normalmente el último host del rango, `.255` en una `/24`) a la que se envían paquetes destinados a *todos* los equipos de la subred a la vez; es la que usan, por ejemplo, las peticiones ARP o los descubrimientos DHCP.

### Cambiar la dirección MAC

Para asignar una MAC distinta a la de fábrica hay que bajar la interfaz, cambiarla y volver a levantarla:

```bash
ifconfig eth0 down
ifconfig eth0 hw ether 00:11:22:33:44:55
ifconfig eth0 up
```

> [!warning]
> Cambiar la MAC de una interfaz puede romper el acceso a redes que filtran dispositivos por dirección física (filtrado MAC) o generar conflictos si otro equipo de la red ya usa esa misma dirección. Es una operación puntual para depuración o pruebas controladas, no algo que dejar así de forma permanente sin motivo.

### Por qué funciona: ARP y la dirección física

Cambiar la MAC "engaña" al sistema porque **ARP** (*Address Resolution Protocol*) es el mecanismo que traduce direcciones IP (capa 3) a direcciones MAC (capa 2) dentro de una misma red local. Cuando un equipo quiere hablar con `192.168.1.50`, primero pregunta por ARP-broadcast "¿quién tiene esta IP?", y el dueño responde con su MAC. A partir de ahí, los switches de la red aprenden en qué puerto físico vive cada MAC, y el propio sistema operativo mantiene una caché de estas asociaciones (`ip neigh` o el clásico `arp -a`).

Si cambias la MAC de tu interfaz, para la red local pasas a ser, a todos los efectos, "otro dispositivo": los mecanismos de control de acceso que se basan en la dirección física (filtrado MAC en un router doméstico, políticas 802.1X en redes corporativas, o simplemente el registro de qué MAC corresponde a qué usuario) dejan de reconocerte como el equipo que eras antes. Es también la base de ataques como el **ARP spoofing/poisoning**: enviar respuestas ARP falsas para hacer creer a la red que tu MAC corresponde a la IP de otro equipo (por ejemplo, la puerta de enlace), y así interceptar tráfico ajeno.

> [!tip]
> Puedes consultar la caché ARP local con `ip neigh show` (o `arp -a` si tienes `net-tools`), y ver qué MAC asocia el sistema a cada IP de tu red en este momento.

### La alternativa práctica: `macchanger`

En Kali y otras distros orientadas a seguridad suele venir instalada la herramienta `macchanger`, pensada específicamente para este caso de uso y algo más cómoda que el `ifconfig down/hw ether/up` manual:

```bash
macchanger -s eth0              # muestra la MAC actual (y el fabricante asociado al prefijo OUI)
macchanger -r eth0              # asigna una MAC aleatoria válida
macchanger -m 00:11:22:33:44:55 eth0   # asigna una MAC concreta
macchanger -p eth0              # restaura la MAC original de fábrica
```

La interfaz debe estar caída (`ip link set eth0 down`) para poder cambiarla también con `macchanger`, igual que con `ifconfig`. La opción `-p` (*permanent*) es la que conviene recordar: te devuelve a la MAC grabada en el hardware sin tener que anotarla tú mismo antes de empezar a hacer pruebas.

## Pedir una IP por DHCP

La mayoría de redes domésticas y corporativas asignan direcciones IP automáticamente mediante un servidor **DHCP** (*Dynamic Host Configuration Protocol*), que corre como un demonio en segundo plano y lleva un registro de qué IP se ha asignado a qué equipo.

Si has fijado una IP manualmente y quieres volver a obtener una asignada por DHCP, no hace falta reiniciar el equipo: basta con volver a pedir una dirección al servidor:

```bash
dhclient eth0
```

`dhclient` envía una petición `DHCPDISCOVER` desde la interfaz indicada, recibe una oferta (`DHCPOFFER`) del servidor DHCP de la red y confirma la asignación. Distintas distribuciones usan clientes DHCP distintos, pero las basadas en Debian (Debian, Ubuntu, Mint) usan `dhclient` por defecto.

El servidor DHCP en sí corre normalmente como el demonio `dhcpd` en el equipo que reparte direcciones (típicamente el router), y no solo asigna una IP: también entrega máscara de red, puerta de enlace y, como veremos más abajo, la configuración de servidores DNS a usar. Además mantiene un registro (el *lease*, o concesión) de qué IP se ha entregado a qué dirección MAC y durante cuánto tiempo, algo que conviene tener presente porque ese registro es exactamente lo que un analista forense consultaría para rastrear qué equipo tenía una IP concreta en un momento dado.

> [!note] `dhclient` está siendo reemplazado
> En distribuciones recientes (Ubuntu 22.04+, Fedora, Arch con NetworkManager) `dhclient` ha ido perdiendo terreno frente a clientes DHCP integrados en el propio gestor de red, como `systemd-networkd` o el cliente interno de NetworkManager. El comportamiento conceptual (DISCOVER/OFFER/REQUEST/ACK) es el mismo; lo que cambia es la herramienta que lo orquesta.

## Resolución DNS con `dig`

**DNS** (*Domain Name System*) es el servicio que traduce nombres de dominio legibles (como `ejemplo.com`) a direcciones IP. `dig` es la herramienta de referencia para consultar esa información desde la terminal.

### Consultar el servidor de nombres de un dominio

```bash
dig ejemplo.com ns
```

```text
;; ANSWER SECTION:
ejemplo.com.    300   IN   NS   ns1.proveedor.net.
ejemplo.com.    300   IN   NS   ns2.proveedor.net.
```

La opción `ns` (*nameserver*) muestra qué servidores son responsables de resolver ese dominio.

### Consultar el servidor de correo de un dominio

```bash
dig ejemplo.com mx
```

La opción `mx` (*mail exchange*) muestra qué servidores gestionan el correo entrante de ese dominio, información habitual en tareas de diagnóstico de correo o de reconocimiento de infraestructura.

### Otros tipos de registro útiles

`dig` acepta cualquier tipo de registro DNS, no solo `ns` y `mx`. Algunos que conviene conocer para tareas de diagnóstico o reconocimiento:

```bash
dig ejemplo.com a       # registro A: la IPv4 del dominio (el que se consulta por defecto sin especificar tipo)
dig ejemplo.com aaaa    # registro AAAA: la IPv6, si la tiene
dig ejemplo.com txt     # registros TXT: verificación de dominio, políticas SPF/DKIM anti-spoofing de correo
dig ejemplo.com any     # intenta traer todos los tipos de registro de golpe (muchos servidores lo ignoran o lo limitan)
```

Los registros `TXT` merecen mención aparte: además de verificar la propiedad de un dominio ante servicios externos (Google, Microsoft 365...), suelen contener las políticas SPF (qué servidores tienen permiso para enviar correo en nombre del dominio), lo que los convierte en una pista útil al mapear la infraestructura de correo de un objetivo.

> [!note] DNS y BIND
> El servidor DNS más extendido en Linux es **BIND** (*Berkeley Internet Name Domain*). Es habitual que se use "DNS" y "BIND" como sinónimos en la jerga de administración de sistemas, pero no lo son: DNS es el protocolo/sistema de resolución de nombres en sí, y BIND es una implementación concreta (la más popular) de un servidor que habla ese protocolo.

> [!tip]
> Si solo quieres la IP final de un dominio sin todo el detalle de secciones de `dig`, usa `dig ejemplo.com +short`. Es la forma más rápida de resolver un nombre desde la terminal.

### Cambiar el servidor DNS del sistema

La configuración del servidor DNS que usa el sistema vive en `/etc/resolv.conf`:

```bash
cat /etc/resolv.conf
# nameserver 192.168.1.1
```

Puedes editarlo con cualquier editor de texto, o sobrescribirlo directamente desde la terminal:

```bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
```

Esto redirige las resoluciones DNS al servidor público de Google (`8.8.8.8`) en lugar del servidor de tu red local. El sistema consulta los servidores en el orden en que aparecen en el archivo, así que puedes mantener tu DNS local como primera opción y añadir uno público como respaldo:

```text
nameserver 192.168.1.1
nameserver 8.8.8.8
```

> [!note]
> Si tu interfaz obtiene la IP por DHCP y el servidor DHCP entrega también una configuración DNS, es habitual que `/etc/resolv.conf` se sobrescriba automáticamente en cada renovación de la concesión DHCP, perdiendo los cambios manuales que hayas hecho.

> [!warning] `/etc/resolv.conf` puede ser un symlink gestionado
> En distribuciones que usan `systemd-resolved` (Ubuntu desde la 18.04, entre otras) `/etc/resolv.conf` suele ser en realidad un enlace simbólico a `/run/systemd/resolve/stub-resolv.conf`, un archivo generado automáticamente. Editarlo a mano en ese caso es inútil: el cambio se pierde en el siguiente reinicio del servicio o de la red. Comprueba con `readlink -f /etc/resolv.conf` si es un enlace, y si lo es, gestiona el DNS con `resolvectl` (`resolvectl dns eth0 8.8.8.8`) o directamente en la configuración de NetworkManager/`netplan`, según la distribución.

### Resolver un nombre sin `dig`

`dig` no es la única herramienta de resolución. Para una consulta rápida y sin todo el detalle de protocolo, `host` y `getent` son alternativas más ligeras:

```bash
host ejemplo.com          # resolución simple, una línea de salida
getent hosts ejemplo.com  # usa el mismo mecanismo de resolución que el resto del sistema (NSS),
                           # por lo que respeta /etc/hosts, /etc/nsswitch.conf, etc.
```

`getent` es especialmente útil para depurar: mientras `dig` consulta directamente al servidor DNS ignorando `/etc/hosts`, `getent hosts` reproduce exactamente lo que vería cualquier aplicación del sistema al resolver ese nombre, incluidas las entradas locales.

## Mapear tus propias IPs en `/etc/hosts`

El archivo `/etc/hosts` es otra vía de traducción nombre-IP, independiente del DNS, y tiene prioridad sobre él: si un dominio aparece en `/etc/hosts`, el sistema usará esa IP sin llegar a consultar ningún servidor DNS.

```bash
cat /etc/hosts
```

```text
127.0.0.1       localhost
127.0.1.1       mi-equipo

# IPv6
::1     localhost ip6-localhost ip6-loopback
```

Puedes añadir tus propias entradas para forzar que un dominio resuelva a una IP concreta de tu elección:

```text
127.0.0.1        localhost
127.0.1.1        mi-equipo
192.168.1.50     app-interna.local
```

> [!example] Caso de uso habitual: probar un dominio antes de que exista DNS
> Si estás desplegando un servicio en `192.168.1.50` y quieres probarlo con el nombre de dominio definitivo (`app-interna.local`) antes de tener el DNS configurado en producción, añadir esa línea a `/etc/hosts` en tu propio equipo te permite navegar a ese dominio como si ya estuviera resuelto públicamente, sin afectar a nadie más en la red.

> [!warning]
> Al editar `/etc/hosts` a mano, separa la IP del dominio con tabulador o espacios, no mezcles tabulaciones de forma inconsistente entre líneas: aunque suele funcionar igual, mantener el formato uniforme evita errores de lectura en herramientas que parseen el archivo.

> [!danger] `/etc/hosts` como vector de ataque
> Precisamente porque `/etc/hosts` tiene prioridad sobre el DNS real, es un objetivo clásico para malware y ataques locales: si un atacante consigue escritura sobre ese archivo (por ejemplo, tras escalar privilegios), puede redirigir silenciosamente el tráfico de un dominio legítimo —el banco, el proveedor de actualizaciones del sistema, un servicio interno— hacia un servidor bajo su control, sin que el usuario note nada raro en la barra de direcciones. Es la misma lógica que herramientas como `dnsspoof` o `Ettercap` explotan a nivel de red, pero aplicada localmente y de forma persistente. Revisar el contenido de `/etc/hosts` de vez en cuando (o vigilar su integridad con una herramienta como `aide` o `tripwire`) es una comprobación barata en cualquier auditoría.

## Próximos pasos

- [[05-gestion-de-paquetes-software|Gestión de paquetes de software]]: instalar, actualizar y eliminar software con `apt` en distribuciones basadas en Debian.
