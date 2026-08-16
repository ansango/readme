---
title: Compresión y archivado
description: "Cómo empaquetar archivos con tar, comprimirlos con gzip, bzip2 y compress, y hacer copias bit a bit de dispositivos con dd"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, cheatsheet]
---

# Compresión y archivado

> [!abstract] Resumen
> Cheatsheet para combinar varios archivos en uno solo con `tar`, reducir su tamaño con `gzip`, `bzip2` o `compress`, y hacer copias exactas (bit a bit) de discos o particiones con `dd`, la herramienta más potente y también más peligrosa de este grupo. Incluye el porqué de la compresión con pérdida frente a sin pérdida y una comparativa real de ratio/velocidad entre los tres compresores.

## Qué es comprimir, y por qué importa la pérdida

Comprimir es, en esencia, representar la misma información con menos bytes. Existen dos familias completamente distintas, y confundirlas puede arruinar un archivo:

- **Compresión con pérdida (*lossy*)**: descarta información que se considera poco perceptible para ganar mucho tamaño. Es el terreno de `.jpg`, `.mp3` o `.mp4` — una foto o una canción pueden perder detalle sin que el ojo o el oído lo noten, y a cambio el archivo se reduce muchísimo. Es excelente para multimedia, pero el archivo descomprimido **no es idéntico** al original.
- **Compresión sin pérdida (*lossless*)**: reduce el tamaño sin descartar ni un solo bit; al descomprimir recuperas exactamente el archivo original. Es la única opción aceptable para scripts, código fuente, documentos o cualquier dato donde la integridad importa más que el ratio de compresión. `tar`, `gzip`, `bzip2` y `compress` —las herramientas de esta nota— trabajan siempre en modo sin pérdida.

> [!note]
> Como hacker o administrador, casi nunca vas a comprimir con pérdida tú mismo: la usarás sobre todo para reconocer con qué se comprimió algo que recibes (una captura, un vídeo de PoC) y saber que, si lo recomprimes, perderás aún más calidad. Para transferir herramientas, exploits o backups, sin pérdida es la única opción razonable.

## Empaquetar archivos con tar

`tar` (*tape archive*, herencia de cuando los datos se guardaban en cintas magnéticas) combina varios archivos en uno solo, llamado **tarball**. Es el paso previo casi obligado antes de comprimir o de enviar un conjunto de archivos como una unidad.

```bash
tar -cvf paquete.tar archivo1 archivo2 archivo3
```

- `c` — *create*: crea un archivo nuevo.
- `v` — *verbose*: muestra en pantalla qué archivos va procesando (opcional, útil para verificar).
- `f` — indica que lo siguiente es el nombre del archivo de destino (o de origen, al extraer).

> [!note]
> El tarball resultante ocupa algo más que la suma de los archivos originales: `tar` añade cabeceras y metadatos por cada archivo incluido. Con archivos pequeños ese overhead es perceptible; con archivos grandes se vuelve insignificante.

> [!example] El overhead con números reales
> Empaquetando tres scripts de 22.311, 8.791 y 3.992 bytes (35.094 bytes en total), el tarball resultante ocupa 40.960 bytes: `tar` ha añadido algo más de 5.000 bytes solo en cabeceras. Con tres archivos de varios megas cada uno, ese mismo overhead de unos pocos KB pasaría totalmente desapercibido — el coste de `tar` es fijo por archivo incluido, no proporcional a su tamaño.

### Ver el contenido sin extraer

```bash
tar -tvf paquete.tar
```

Lista los archivos contenidos en el tarball (con su tamaño y fecha) sin extraerlos, útil para comprobar qué hay dentro antes de descomprimir algo que no controlas.

### Extraer un tarball

```bash
tar -xvf paquete.tar     # extrae mostrando el detalle de cada archivo
tar -xf paquete.tar      # extrae en silencio, sin listado
```

> [!warning]
> Si al extraer ya existe un archivo con el mismo nombre en el directorio de destino, `tar` lo sobrescribe sin pedir confirmación. Comprueba el contenido con `-tvf` antes de extraer sobre un directorio que ya tenga archivos con esos nombres.

## Comprimir archivos

Un tarball por sí solo no comprime nada, solo agrupa. Para reducir el tamaño real hay tres utilidades habituales en Linux, cada una con un compromiso distinto entre velocidad y ratio de compresión:

| Herramienta | Extensión | Velocidad | Tamaño resultante |
|---|---|---|---|
| `compress` | `.tar.Z` | La más rápida | El más grande de los tres |
| `gzip` | `.tar.gz` / `.tgz` | Intermedia | Intermedio |
| `bzip2` | `.tar.bz2` | La más lenta | El más pequeño de los tres |

> [!example] Comparativa con el mismo tarball de 40.960 bytes
> Comprimiendo el mismo `HackersArise.tar` de la sección anterior con cada herramienta se obtienen resultados muy distintos:
>
> | Herramienta | Tamaño resultante | Reducción aproximada |
> |---|---|---|
> | Original (`.tar`) | 40.960 bytes | — |
> | `compress` (`.tar.Z`) | 5.476 bytes | ~87% |
> | `gzip` (`.tar.gz`) | 3.299 bytes | ~92% |
> | `bzip2` (`.tar.bz2`) | 2.081 bytes | ~95% |
>
> La diferencia entre `compress` y `bzip2` es de más del doble en tamaño final. Con archivos de texto (scripts, logs, configuración) esta brecha se nota mucho; con archivos ya comprimidos de origen (imágenes, binarios) las tres herramientas convergen porque apenas queda redundancia que exprimir.

### gzip

```bash
gzip paquete.tar        # genera paquete.tar.gz y borra el .tar original
gunzip paquete.tar.gz    # descomprime y recupera paquete.tar
```

### bzip2

```bash
bzip2 paquete.tar        # genera paquete.tar.bz2
bunzip2 paquete.tar.bz2   # descomprime y recupera paquete.tar
```

### compress

```bash
compress paquete.tar      # genera paquete.tar.Z
uncompress paquete.tar.Z  # descomprime y recupera paquete.tar
```

> [!tip]
> `gzip` es, con diferencia, el formato más habitual en el mundo Linux (muchos man pages y logs rotados terminan como `.gz`). Conocer los otros dos sirve sobre todo para reconocer con qué se comprimió un archivo que te llega de fuera y saber qué comando usar para descomprimirlo. `gunzip` además puede descomprimir archivos `.Z` generados con `compress`.

> [!example] Flujo completo típico
> ```bash
> tar -cvf backup.tar /home/ansango/proyecto
> gzip backup.tar
> # resultado: backup.tar.gz, listo para transferir
> ```
> Empaquetar y comprimir en dos pasos es el patrón más común para preparar una copia de seguridad o un envío de archivos.

### Empaquetar y comprimir en un solo comando

En la práctica, casi nadie hace `tar` y luego `gzip` como dos comandos separados: `tar` acepta un flag adicional que llama al compresor por ti en el mismo paso, sin generar el `.tar` intermedio.

```bash
tar -czvf backup.tar.gz /home/ansango/proyecto     # tar + gzip en un solo paso (z)
tar -cjvf backup.tar.bz2 /home/ansango/proyecto    # tar + bzip2 en un solo paso (j)
tar -cJvf backup.tar.xz /home/ansango/proyecto     # tar + xz en un solo paso (J, mayúscula)
```

Y a la inversa, para extraer directamente sin descomprimir en un paso previo:

```bash
tar -xzvf backup.tar.gz     # descomprime gzip y extrae en el mismo comando
tar -xjvf backup.tar.bz2    # ídem con bzip2
tar -xJvf backup.tar.xz     # ídem con xz
```

> [!tip]
> Aunque no aparezca en el libro (que se centra en `gzip`, `bzip2` y `compress`), `xz` es hoy el formato de referencia cuando el ratio de compresión importa más que la velocidad: comprime bastante mejor que `bzip2` a costa de ser todavía más lento, y es el formato habitual para distribuir código fuente de proyectos grandes (kernel de Linux incluido). Si `bzip2` te parece lento pero necesitas apurar el tamaño, `xz` es el siguiente paso lógico.

## Copias bit a bit con dd

`dd` hace algo muy distinto a `cp`: copia un dispositivo o archivo **bit a bit**, incluyendo bloques marcados como borrados a nivel de sistema de archivos. Es la herramienta de referencia en análisis forense y en clonado de discos, precisamente porque no respeta la capa lógica del sistema de archivos: copia lo que hay físicamente en el dispositivo, borrado o no.

```bash
dd if=/dev/sdb of=/root/copia_flash bs=4096 conv=noerror
```

- `if` (*input file*) — dispositivo o archivo de origen.
- `of` (*output file*) — archivo o dispositivo de destino.
- `bs` (*block size*) — tamaño de bloque por operación de lectura/escritura; por defecto 512 bytes, pero ajustarlo al tamaño de sector real del dispositivo (normalmente 4096 bytes) acelera bastante el proceso.
- `conv=noerror` — continúa la copia aunque encuentre errores de lectura, en vez de abortar.

> [!example] Por qué dd y no cp
> `cp` opera a nivel lógico: le pides "copia este archivo" y el sistema de archivos decide qué bloques leer, ignorando cualquier cosa marcada como borrada o libre. `dd` no sabe nada de archivos ni de sistemas de archivos — copia byte a byte todo lo que hay en el dispositivo de origen, tal cual, sin preguntar qué representa cada bloque. Esa es la razón de que un `dd if=/dev/sdb of=copia.img` conserve datos que un usuario borró hace tiempo (el espacio quedó marcado como libre, pero el contenido sigue físicamente ahí hasta que algo lo sobrescribe). Es exactamente lo que busca un investigador forense, y exactamente lo que busca un atacante que ha comprometido una máquina y quiere llevarse una copia exacta del disco.

Un ejemplo real del libro, clonando una memoria flash de 7,6 GB:

```bash
dd if=/dev/sdb of=/root/flashcopy
# 1257440+0 records in
# 1257440+0 records out
# 7643809280 bytes (7.6 GB) copied, 1220.729 s, 5.2 MB/s
```

Sin especificar `bs`, `dd` usa bloques de 512 bytes por defecto, lo que explica la velocidad modesta (5.2 MB/s). Ajustando el tamaño de bloque al tamaño de sector real del dispositivo se reduce drásticamente el número de operaciones de E/S necesarias:

```bash
dd if=/dev/sdb of=/root/flashcopy bs=4096 conv=noerror
```

> [!tip]
> Dos variantes útiles que no vienen en el ejemplo básico:
> - `conv=noerror,sync` — además de continuar tras un error de lectura, rellena con ceros el bloque que falló para que el archivo resultante mantenga el mismo tamaño y las mismas posiciones relativas que el original (crítico en forense: sin esto, un sector dañado desplazaría todo lo que viene después).
> - `status=progress` — muestra una barra de progreso en tiempo real; sin ella, `dd` no imprime nada hasta que termina, lo que en discos grandes puede dejarte mirando un terminal en silencio durante horas sin saber si sigue vivo.

> [!danger]
> `dd` no pregunta confirmación y no entiende de "deshacer". Si intercambias `if` y `of`, o simplemente escribes mal el dispositivo de destino (por ejemplo, `of=/dev/sda` en vez de `of=/dev/sdb`), puedes sobrescribir tu disco principal en segundos sin ningún aviso. Antes de ejecutar `dd`, verifica siempre con `lsblk` o `fdisk -l` qué dispositivo es cuál — se explica en la siguiente nota.

> [!note]
> `dd` es intencionadamente lento comparado con `cp` o herramientas de clonado especializadas, porque copia todo el dispositivo byte a byte sin las optimizaciones que aporta conocer la estructura del sistema de archivos. No lo uses para copiar archivos del día a día: resérvalo para clonado de discos completos, forense o recuperación de datos borrados.

## Próximos pasos

- [[11-sistema-de-archivos-y-dispositivos|Sistema de archivos y dispositivos]]: cómo Linux nombra y representa discos y particiones en `/dev`, y cómo montarlos, desmontarlos y comprobar errores.
