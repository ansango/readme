---
title: Sistema de archivos y dispositivos
description: "Cómo representa Linux los discos y particiones en /dev, la diferencia entre dispositivos de bloque y carácter, y cómo listar, montar, desmontar y comprobar errores de almacenamiento"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, almacenamiento]
---

# Sistema de archivos y dispositivos

> [!abstract] Resumen
> A diferencia de Windows, Linux no tiene letras de unidad (`C:`, `D:`): todo dispositivo de almacenamiento se representa como un archivo especial dentro de `/dev` y se "engancha" al árbol de directorios mediante el montaje. Esta nota explica esa representación, cómo identificar discos y particiones, la diferencia entre dispositivos de bloque y de carácter, cómo crear particiones desde cero con `fdisk`/`parted`, y cómo montar, desmontar y comprobar errores de un sistema de archivos.

## Por qué Linux no usa letras de unidad

En Windows cada volumen nuevo aparece como una letra (`D:`, `E:`...) desconectada del resto. Linux hereda un modelo distinto, más antiguo: el de un único árbol de directorios que arranca en `/` (la raíz), donde cualquier dispositivo adicional no aparece "al lado" sino que se **injerta** dentro de ese árbol en un punto concreto. La palabra "montar" es literal: viene de la época en que las cintas magnéticas tenían que montarse físicamente en la unidad lectora antes de poder acceder a los datos que contenían. Hoy el disco puede estar ya conectado físicamente (por USB, SATA...) sin que el sistema operativo pueda todavía leer ni escribir en él — hasta que no lo montas en algún punto del árbol, esos datos no existen para el resto del sistema.

Esta idea es clave para un hacker que trabaja contra un sistema objetivo: encontrar un dispositivo listado en `/dev` no significa que su contenido ya sea accesible; hay que identificarlo, y después montarlo en algún punto del árbol de directorios para poder leer o escribir en él.

## El directorio /dev

`/dev` (de *device*) contiene un archivo especial por cada dispositivo que el kernel reconoce, ya esté conectado físicamente o no. Un listado largo muestra algo así:

```bash
ls -l /dev
# crw-------  1 root root  10, 175 may 16 12:44 agpgart
# drwxr-xr-x  1 root root      160 may 16 12:44 block
# lrwxrwxrwx  1 root root        3 may 16 12:44 cdrom -> sr0
# brw-rw----  1 root root    8,  0 may 16 12:44 sda
# brw-rw----  1 root root    8,  1 may 16 12:44 sda1
# brw-rw----  1 root root    8, 16 may 16 12:44 sdb
```

Lo interesante aquí no es memorizar cada entrada, sino identificar el patrón: discos y particiones aparecen con nombres como `sda`, `sda1`, `sdb`, `sdb1`.

## Cómo nombra Linux los discos

Los discos con interfaz SATA o SCSI se representan como `sd` seguido de una letra que se incrementa por cada disco adicional que el sistema detecta, en el orden en que los encuentra:

| Dispositivo | Descripción |
|---|---|
| `sda` | Primer disco SATA/SCSI |
| `sdb` | Segundo disco |
| `sdc` | Tercer disco |
| `sdd` | Cuarto disco |

> [!note]
> En sistemas legacy todavía puedes encontrarte discos IDE representados como `hda`, `hdb`... y disqueteras como `fd0`. Son resquicios históricos que rara vez verás en hardware moderno, pero conviene reconocerlos si trabajas con sistemas antiguos.

### Particiones

Cuando un disco se divide en particiones, cada una añade un número al final del nombre del disco:

| Partición | Descripción |
|---|---|
| `sda1` | Primera partición del primer disco |
| `sda2` | Segunda partición del primer disco |
| `sda3` | Tercera partición del primer disco |

Para ver todas las particiones de todos los discos, con su tamaño y tipo de sistema de archivos:

```bash
fdisk -l
```

> [!tip]
> `fdisk -l` normalmente requiere privilegios de root porque lee directamente la tabla de particiones del disco. Si solo necesitas consultar (no modificar particiones), `lsblk` cumple el mismo propósito sin necesitar `sudo`.

### Sistemas de archivos: ext4 y compañía

Una partición no es utilizable hasta que se le da formato con un **sistema de archivos**, la estructura lógica que organiza dónde y cómo se guardan los archivos dentro de esos bloques. Linux soporta muchos, pero el más habitual con diferencia es la familia **ext** (*extended filesystem*): `ext2` (sin *journaling*, es decir, sin registro de transacciones que proteja frente a cortes de luz), `ext3` (añade journaling) y `ext4` (la versión actual, más rápida y con soporte para particiones más grandes).

Cuando `fdisk -l` o `lsblk` muestran un tipo distinto — `HPFS/NTFS/exFAT`, por ejemplo — es una señal de que ese dispositivo se formateó en otro sistema operativo:

- **NTFS** (*New Technology File System*): el sistema de archivos nativo de Windows moderno.
- **HPFS** (*High Performance File System*): un antecesor de NTFS, ya raro de ver.
- **exFAT**: pensado para memorias flash y tarjetas SD, compatible tanto con Windows como con macOS.

> [!tip]
> Identificar el tipo de sistema de archivos de un dispositivo desconocido (por ejemplo, uno que te encuentras en un análisis forense o al examinar un objetivo) te da una pista inmediata sobre qué sistema operativo lo formateó, incluso antes de montarlo.

### Crear particiones desde cero con fdisk

Además de listar particiones (`-l`), `fdisk` se usa en modo interactivo para crear, borrar o modificar la tabla de particiones de un disco. Es un ejemplo típico de herramienta que conviene practicar primero contra un disco de prueba o una máquina virtual, nunca contra un disco con datos que te importen.

```bash
fdisk /dev/sdb
```

Esto abre un prompt interactivo (`Command (m for help):`) donde se manejan las particiones con letras sueltas:

```
Command (m for help): n        # nueva partición
Partition type
   p   primary (0 primary, 0 extended, 4 free)
   e   extended
Select (default p): p
Partition number (1-4, default 1): 1
First sector (2048-...): [Enter para aceptar el valor por defecto]
Last sector, +sectors or +size{K,M,G,T,P} (...): +10G   # tamaño de la partición

Command (m for help): p        # muestra la tabla de particiones resultante
Command (m for help): w        # escribe los cambios en el disco y sale
```

- `n` crea una partición nueva; `p` la marca como primaria (frente a extendida, pensada para albergar particiones lógicas cuando ya tienes 4 primarias).
- `+10G` en "Last sector" es la forma cómoda de decir "esta partición debe medir 10 GB" sin calcular el sector final a mano.
- **Nada se escribe en el disco hasta `w`** (*write*): puedes explorar, equivocarte y salir con `q` sin haber tocado la tabla de particiones real. Esa `w` final es el punto de no retorno.

Tras crear la partición, todavía hace falta darle un sistema de archivos antes de poder montarla:

```bash
mkfs.ext4 /dev/sdb1     # formatea la nueva partición como ext4
```

> [!warning]
> `fdisk` opera sobre tablas de partición **MBR** (*Master Boot Record*), limitadas a 2 TB y a 4 particiones primarias. Para discos más grandes o con tabla **GPT** (*GUID Partition Table*), la herramienta equivalente es `parted`, con una sintaxis algo distinta:
> ```bash
> parted /dev/sdb
> (parted) mklabel gpt              # crea una tabla de particiones GPT
> (parted) mkpart primary ext4 0% 100%   # una única partición ocupando todo el disco
> (parted) print                    # muestra la tabla resultante
> (parted) quit
> ```
> `parted` aplica los cambios en el momento (no tiene un `w` final separado), así que confirma cada línea con más cuidado todavía que con `fdisk`.

## Dispositivos de bloque vs. de carácter

En el listado de `/dev`, la primera letra de los permisos indica cómo transfiere datos ese dispositivo:

- **`c`** (*character*): transfiere datos carácter a carácter, uno detrás de otro. Típico de ratones, teclados y otros periféricos de baja velocidad.
- **`b`** (*block*): transfiere datos en bloques (varios bytes de golpe). Es el caso de discos duros, SSDs y unidades ópticas, que necesitan mayor throughput.

```bash
ls -l /dev/sda
# brw-rw---- 1 root disk 8, 0 may 16 12:44 /dev/sda
#  ^
#  b = dispositivo de bloque
```

### Listar dispositivos de bloque con lsblk

`lsblk` (*list block devices*) resume la misma información que `fdisk -l`, pero en forma de árbol y sin requerir privilegios de root — además indica dónde está montado cada dispositivo:

```bash
lsblk
# NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
# sda      8:0    0    20G  0 disk
# ├─sda1   8:1    0  18.7G  0 part /
# ├─sda2   8:2    0     1K  0 part
# └─sda5   8:5    0   1.3G  0 part [SWAP]
# sdb      8:16   1  29.8G  0 disk
# └─sdb1   8:17   1  29.8G  0 part /media
```

## Montar y desmontar

Montar un dispositivo significa engancharlo lógicamente al árbol de directorios en un punto concreto (el **punto de montaje**), de forma que su contenido pase a ser accesible como si fuera una carpeta más. Estar conectado físicamente no implica estar disponible: hasta que no se monta, el sistema operativo no puede leer ni escribir en él.

Las dos rutas de montaje habituales por convención son `/mnt` (montaje manual) y `/media` (montaje automático de unidades extraíbles), aunque técnicamente puedes montar sobre cualquier directorio vacío.

```bash
mount /dev/sdb1 /mnt      # monta la partición sdb1 en /mnt
```

> [!warning]
> El punto de montaje debe ser un directorio vacío. Si montas un dispositivo sobre una carpeta que ya tiene archivos, esos archivos quedan ocultos (no borrados, pero inaccesibles) mientras el dispositivo permanezca montado ahí.

Para desmontar se usa `umount` (sin la "n" de "unmount", es un error tipográfico habitual):

```bash
umount /dev/sdb1
```

> [!note]
> Si el dispositivo está "ocupado" (algún proceso tiene un archivo abierto en él), `umount` fallará con un error. Cierra los programas que puedan estar usando ese punto de montaje antes de reintentarlo. Si no sabes qué proceso es, `lsof +f -- /mnt` (o `fuser -m /mnt`) lista qué procesos tienen archivos abiertos dentro de ese punto de montaje, para poder cerrarlos o matarlos antes de reintentar.

Los sistemas de archivos que deben montarse automáticamente al arrancar el sistema se definen en `/etc/fstab` (*filesystem table*), que el sistema lee en cada arranque. Cada línea describe un dispositivo, su punto de montaje, su tipo de sistema de archivos y un conjunto de opciones:

```
# /etc/fstab (fragmento)
# <dispositivo>       <punto de montaje>   <tipo>   <opciones>       <dump> <pass>
/dev/sda1              /                    ext4     defaults         0      1
/dev/sda5              none                 swap     sw               0      0
/dev/sdb1              /media/datos         ext4     defaults,noauto  0      2
```

> [!tip]
> La opción `noauto` es útil para discos externos que no siempre están conectados: evita que el arranque se quede esperando (o falle) buscando un dispositivo que no está presente. La última columna (`pass`) indica el orden en que `fsck` comprueba cada sistema de archivos al arrancar — `1` para la raíz, `2` para el resto, `0` para no comprobarlo nunca (como en el `swap`).

## Comprobar el estado de un sistema de archivos

### Espacio disponible con df

```bash
df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        19G   17G  1.4G  92% /
# /dev/sdb1        30G   28G  100M  99% /media/USB
```

`-h` (*human-readable*) muestra los tamaños en KB/MB/GB en lugar de bloques de 1K, mucho más legible de un vistazo. Sin `-h`, `df` reporta en bloques de 1 KB por defecto — por ejemplo, `19620732` bloques usados en la raíz equivalen a los mismos 19 GB que `-h` te muestra ya convertidos, solo que sin hacer tú la división.

> [!tip]
> `df` admite indicar un dispositivo concreto como argumento (`df /dev/sdb1`) para no tener que buscarlo entre todos los montados, y combinado con `-i` muestra en su lugar el uso de *inodos* (el número de archivos que caben, no el espacio en bytes) — útil cuando un disco da "espacio insuficiente" pese a tener bytes libres, síntoma de haberse quedado sin inodos por acumular demasiados archivos pequeños.

### Comprobar y reparar errores con fsck

`fsck` (*filesystem check*) revisa la integridad del sistema de archivos y repara lo que puede, o marca como defectuosos los bloques que no puede recuperar.

```bash
umount /dev/sdb1     # imprescindible: no se puede comprobar un dispositivo montado
fsck -p /dev/sdb1    # -p repara automáticamente los problemas que encuentre
```

> [!danger]
> Ejecutar `fsck` sobre un dispositivo montado falla con un error de seguridad (`e2fsck: Cannot continue, aborting`), y forzarlo de otra manera puede corromper datos. Desmonta siempre primero. Si necesitas comprobar el disco raíz (`/`), normalmente hace falta hacerlo desde un sistema live o en el arranque, ya que no puedes desmontar la raíz mientras el sistema está en marcha sobre ella.

## Próximos pasos

- [[12-sistema-de-logs|Sistema de logs]]: qué registra Linux automáticamente, dónde se guarda y cómo se gestiona con `rsyslog` y `logrotate`.
