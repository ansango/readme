---
title: Kernel y módulos
description: "Qué es un módulo del kernel, cómo comprobar la versión del kernel, ajustar parámetros con sysctl e inspeccionar, cargar y quitar módulos"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, kernel]
---

# Kernel y módulos

> [!abstract] Resumen
> El kernel es el núcleo privilegiado del sistema operativo: gestiona memoria, CPU y hardware, y solo root puede tocarlo directamente. Aquí vemos cómo comprobar su versión (`uname`), ajustar su comportamiento en caliente (`sysctl`) y cómo listar, inspeccionar, cargar y quitar los módulos que le añaden funcionalidad (`lsmod`, `modinfo`, `modprobe`, `insmod`/`rmmod`).

## Qué es un módulo del kernel

El sistema operativo se divide, a grandes rasgos, en dos zonas: el **kernel**, que controla la memoria, la CPU y el hardware con privilegios totales, y el **espacio de usuario** (*user land*), donde corren las aplicaciones normales con acceso restringido. Esa separación es deliberada: si cualquier proceso pudiera tocar el kernel directamente, un fallo o un ataque podría tirar el sistema entero o tomar control absoluto de él.

Linux usa un **kernel monolítico**, pero con una particularidad importante: admite **módulos cargables** (*Loadable Kernel Modules*, LKM). En vez de recompilar y reiniciar todo el kernel cada vez que necesitas soporte para un dispositivo nuevo (una tarjeta de vídeo, un adaptador Bluetooth, un sistema de archivos), puedes insertar y quitar módulos sueltos sin tocar el resto.

> [!note] Monolítico no significa "todo en un único bloque fijo"
> "Monolítico" se refiere a que el kernel entero corre en un único espacio de direcciones privilegiado (a diferencia de un *microkernel*, que reparte funciones entre procesos separados con menos privilegios cada uno). Los LKM son la manera que tiene un kernel monolítico como el de Linux de seguir siendo modular sin renunciar al rendimiento de tenerlo todo en el mismo espacio: cargas o quitas piezas sueltas, pero todas comparten el mismo nivel de privilegio máximo una vez dentro.

Esto tiene una consecuencia directa para el trabajo diario: no hace falta detener el sistema para añadir soporte de hardware nuevo, actualizar un driver de sistema de archivos o instalar una extensión del kernel. `modprobe`/`insmod` insertan el código del módulo en el espacio del kernel en caliente, y `rmmod`/`modprobe -r` lo retiran cuando ya no se necesita.

> [!warning]
> Los LKM tienen acceso a las capas más bajas del kernel, lo que los convierte en un objetivo jugoso para malware: un **rootkit** que se instala como módulo del kernel obtiene control total y casi invisible del sistema. Trata la carga de módulos con la misma cautela que darías a instalar software con privilegios de root.

### Por qué los módulos son el vector favorito de los rootkits

Un rootkit que se limita al espacio de usuario puede, como mucho, falsear lo que ve *un* proceso o modificar binarios concretos (`ps`, `ls`, `netstat`...) para ocultar su actividad; sigue siendo detectable comparando con herramientas de confianza. Un rootkit que consigue cargarse como LKM opera en el mismo nivel de privilegio que el propio kernel, así que puede interceptar y falsear las llamadas al sistema que *todas* las herramientas usan para reportar procesos, puertos abiertos, servicios activos o espacio en disco. En la práctica, el sistema entero puede mentir de forma consistente sobre su propio estado, porque la mentira ocurre por debajo de cualquier herramienta que pudieras usar para detectarla.

> [!danger]
> Si consigues (como atacante, en un ejercicio autorizado) que un administrador cargue un driver "inocente" con un rootkit embebido —una tarjeta de vídeo, un dispositivo Bluetooth, cualquier hardware que justifique instalar algo nuevo—, obtienes control total del sistema y, en la mayoría de los casos, ese control es invisible para las herramientas normales de auditoría ejecutadas desde el propio sistema comprometido. Es una de las razones por las que instalar drivers de fuentes no verificadas es una mala idea incluso fuera de un contexto de pentesting.

## Comprobar la versión del kernel

```bash
uname -a
# Linux kali 5.10.0-kali7-amd64 #1 SMP Debian 5.10.28-1 (2021-04-09) x86_64 GNU/Linux
```

Te dice la distribución, la versión del kernel, si tiene soporte SMP (multiprocesador) y la arquitectura para la que se compiló. Esta información es imprescindible cuando vas a instalar un módulo o driver, porque debe coincidir con la versión del kernel en ejecución.

La misma información (y algo más) está disponible leyendo directamente un archivo virtual del propio kernel:

```bash
cat /proc/version
```

## Ajustar el kernel en caliente con sysctl

`sysctl` permite leer y modificar parámetros del kernel en tiempo de ejecución: memoria, red, límites del sistema, etc.

```bash
sysctl -a | less              # lista todos los parámetros disponibles
sysctl -a | grep ipv4 | less  # filtra solo los relacionados con IPv4
```

Un ejemplo práctico y muy citado es habilitar el reenvío de paquetes IP, necesario cuando tu máquina actúa de puente entre dos redes (por ejemplo, en un escenario de *man-in-the-middle* controlado en tu propio laboratorio):

```bash
sysctl -w net.ipv4.ip_forward=1
```

> [!example] Por qué este parámetro concreto importa en un MITM
> En un ataque *man-in-the-middle*, el atacante se sitúa entre cliente y servidor para poder ver (o alterar) el tráfico que pasa entre ambos. Para que ese tráfico llegue a su destino real y la víctima no note nada raro, la máquina intermedia tiene que reenviar los paquetes que recibe: exactamente lo que activa `net.ipv4.ip_forward=1`. Con `ip_forward` desactivado (el valor por defecto, `0`), cualquier paquete que llegue a una interfaz sin ir destinado a la propia máquina simplemente se descarta, y el "puente" no funciona.

El propio `/etc/sysctl.conf` trae, comentadas, varias líneas de hardening que merece la pena conocer aunque no las toques:

```bash
# en /etc/sysctl.conf

# Verificación de la dirección de origen en todas las interfaces
# (mitiga ataques de IP spoofing)
#net.ipv4.conf.default.rp_filter=1
#net.ipv4.conf.all.rp_filter=1

# SYN cookies: mitiga ataques de SYN flood sin gastar memoria
# en el backlog de conexiones a medio abrir
#net.ipv4.tcp_syncookies=1
```

Descomentar `rp_filter` activa el filtrado por ruta inversa: el kernel descarta paquetes cuya dirección de origen no sea alcanzable por la interfaz por la que han entrado, una defensa razonable contra spoofing. Activar `tcp_syncookies` protege frente a un SYN flood clásico sin necesidad de reservar memoria para cada conexión a medio abrir.

> [!tip]
> Un parámetro que no viene comentado por defecto pero que aparece a menudo en guías de *hardening* es `net.ipv4.icmp_echo_ignore_all=1`: ignora todos los pings entrantes, lo que no te hace invisible pero sí complica un poco el reconocimiento inicial de un atacante que solo hace un barrido de `ping`. Añádela a `/etc/sysctl.conf` y aplica los cambios con `sysctl -p`.

> [!warning]
> Los cambios hechos con `sysctl -w` son **temporales**: se pierden al reiniciar. Para hacerlos permanentes hay que editar `/etc/sysctl.conf` (o un archivo en `/etc/sysctl.d/`) y descomentar o añadir la línea correspondiente, y luego aplicar los cambios con `sysctl -p`.

```bash
# en /etc/sysctl.conf
net.ipv4.ip_forward=1
```

> [!danger]
> Modificar parámetros del kernel sin saber exactamente qué hacen puede dejar el sistema inestable o directamente inarrancable. Revisa dos veces cualquier cambio permanente antes de guardarlo en `/etc/sysctl.conf`.

## Listar e inspeccionar módulos

```bash
lsmod
# Module            Size    Used by
# bluetooth         516096  0
# rfkill            28672   2 bluetooth
```

`lsmod` muestra qué módulos están cargados, su tamaño y qué otros módulos dependen de ellos (columna *Used by*). Para profundizar en uno concreto:

```bash
modinfo bluetooth
# filename:    /lib/modules/.../bluetooth.ko
# license:     GPL
# version:     2.22
# depends:     rfkill, ecdh_generic, crc16
```

`modinfo` es especialmente útil para depurar por qué un dispositivo no funciona: te da la versión del módulo, para qué versión de kernel se compiló y, sobre todo, sus **dependencias**.

> [!note] Leer la columna "Used by" de `lsmod`
> En la salida de `lsmod`, la tercera columna indica cuántos otros módulos dependen del que estás mirando y cuáles son. Por ejemplo, `nfnetlink` (un protocolo de mensajería entre el kernel y el espacio de usuario usado, entre otras cosas, por `netfilter`/`iptables`) suele aparecer como dependencia de `nfnetlink_log` y `nfnetlink_queue`. Si intentas quitar con `rmmod` un módulo del que otros dependen, la operación falla: primero hay que quitar los módulos dependientes, o usar directamente `modprobe -r`, que resuelve ese orden por ti.

## Cargar y quitar módulos: modprobe frente a insmod/rmmod

Linux ofrece dos vías para gestionar módulos:

- **`insmod` / `rmmod`** (la vía antigua): insertan o quitan un módulo de forma literal, sin resolver dependencias. Si el módulo que quieres cargar depende de otro que no está presente, `insmod` simplemente falla o deja el sistema en un estado inconsistente.
- **`modprobe`** (la vía moderna, la que usan las distribuciones actuales): resuelve automáticamente las dependencias antes de cargar o quitar un módulo, consultando la información que también expone `modinfo`. Es la opción más segura y la recomendada por defecto.

```bash
modprobe -a nombre_del_modulo   # añade el módulo (y sus dependencias)
modprobe -r nombre_del_modulo   # quita el módulo
```

> [!example] Insertar y comprobar un módulo
> ```bash
> modprobe -a mi_driver_nuevo
> dmesg | grep mi_driver   # revisa el buffer de mensajes del kernel en busca de errores
> modprobe -r mi_driver_nuevo
> ```
> Si algo va mal al cargar el módulo, `dmesg` suele ser el primer sitio donde mirar: ahí aparecen los mensajes que el propio kernel genera al inicializar (o rechazar) el módulo.

> [!tip]
> Usa `modprobe` para el trabajo normal y reserva `insmod`/`rmmod` para casos muy concretos en los que necesites cargar un módulo suelto (por ejemplo, uno que acabas de compilar y que todavía no está indexado por `modprobe`).

## Próximos pasos

- [[17-automatizacion-con-cron|Automatización con cron]]: programa tareas periódicas con `cron` y controla qué servicios arrancan junto con el sistema.
