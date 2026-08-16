---
title: Fundamentos y sistema de archivos
description: "Referencia rápida de la terminal, la jerarquía de directorios de Linux y los comandos básicos para navegar, buscar y manipular archivos"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, cheatsheet]
---

# Fundamentos y sistema de archivos

> [!abstract] Resumen
> Cheatsheet de los primeros comandos que necesitas para moverte por Linux: dónde estás (`pwd`, `whoami`, `id`), qué hay (jerarquía de directorios, rutas absolutas y relativas), cómo navegar (`cd`, `ls`), cómo pedir ayuda (`man`, `--help`), cómo buscar (`locate`, `whereis`, `which`, `find`, `grep`) y cómo crear, copiar, mover y borrar archivos y directorios.

## La terminal

La terminal es la interfaz de línea de comandos: el intérprete de comandos (shell) más habitual en Linux es **bash** (*Bourne-again shell*), aunque también existen `zsh`, `sh` o `fish`. Todo lo que veremos en esta wiki asume bash, que es el shell por defecto en la inmensa mayoría de distribuciones Debian/Ubuntu.

A diferencia de un entorno gráfico, donde ves las carpetas y los iconos directamente, la terminal es una interfaz puramente textual: escribes un comando, pulsas Enter, y el sistema te devuelve texto como resultado. No hay nada oculto detrás de una ventana o un botón; todo lo que ocurre queda expuesto en la propia salida del comando. Esto puede resultar árido al principio, pero es precisamente lo que hace que Linux sea tan predecible y automatizable: cualquier cosa que puedas hacer a mano, puedes guardarla en un script y repetirla exactamente igual mil veces.

A diferencia de otros sistemas operativos, el sistema de archivos de Linux **distingue mayúsculas de minúsculas**: `Documentos`, `documentos` y `DOCUMENTOS` son tres nombres distintos. Si obtienes un error de "archivo o directorio no encontrado" y estás seguro de que existe, revisa primero las mayúsculas.

> [!note] Bash no es el único shell
> Si alguna vez abres una terminal y el prompt tiene un aspecto distinto (por ejemplo, `%` en vez de `$`), probablemente estés en `zsh` en vez de `bash`. La sintaxis básica de comandos que veremos aquí (`cd`, `ls`, `grep`...) es idéntica en ambos, porque son los propios comandos —no el shell— los que hacen el trabajo. Las diferencias entre shells aparecen sobre todo al escribir scripts o al personalizar el prompt, no en el uso interactivo del día a día.

### Dónde estás: `pwd`

El comando `pwd` (*print working directory*) muestra el directorio en el que te encuentras:

```bash
pwd
# /home/ansango
```

A diferencia de un entorno gráfico, en la terminal no siempre es obvio en qué carpeta estás trabajando, así que `pwd` es uno de los comandos que más vas a usar al principio.

### Quién eres: `whoami`

```bash
whoami
# ansango
```

Útil para confirmar con qué usuario has iniciado sesión, especialmente cuando alternas entre tu usuario normal y `root` (el superusuario, equivalente al administrador). Si has iniciado sesión como `root`, `whoami` devolverá literalmente `root`; si estás como un usuario normal, devolverá tu nombre de usuario.

> [!warning]
> Trabajar como `root` en el día a día es una mala práctica: si un proceso o script se comporta mal (o te hackean) mientras estás como root, el daño potencial es total sobre el sistema. Usa un usuario normal para el trabajo habitual y recurre a `sudo` solo cuando necesites privilegios elevados para una tarea concreta.

> [!tip]
> Si necesitas saber qué grupos pertenecen a tu usuario (relevante en la nota de permisos), el comando `id` te da de un vistazo el UID, el GID principal y todos los grupos secundarios: `id ansango`.

## El sistema de archivos de Linux

Linux no tiene unidades como `C:\`; todo cuelga de una única raíz representada por `/`, y el sistema se organiza como un árbol invertido: en la copa está la raíz, y de ahí cuelgan todos los directorios de primer nivel, cada uno con un propósito muy concreto. Esto es distinto de Windows, donde cada disco físico o partición aparece como una letra independiente (`C:`, `D:`...): en Linux, aunque tengas varios discos, todos se "injertan" (se *montan*) en algún punto de este mismo árbol único, de forma que desde el punto de vista del usuario todo parece un solo sistema de archivos continuo.

```text
/
├── root      (home de root)      ├── bin, sbin   (binarios)
├── home      (home de usuarios)  ├── lib         (librerías compartidas)
├── etc       (configuración)     ├── boot        (kernel y gestor de arranque)
├── var       (datos variables)   ├── tmp         (archivos temporales)
├── mnt, media (puntos de montaje)├── opt, srv    (software de terceros, servicios)
└── dev, proc, sys (vistas del hardware y del kernel)
```

| Directorio | Contenido |
|---|---|
| `/root` | Directorio personal del usuario `root` |
| `/home` | Directorios personales del resto de usuarios (`/home/ansango`, etc.) |
| `/etc` | Archivos de configuración del sistema y de los servicios instalados |
| `/bin`, `/usr/bin` | Binarios (ejecutables) de comandos básicos y aplicaciones |
| `/sbin`, `/usr/sbin` | Binarios de administración del sistema, normalmente para root |
| `/lib`, `/usr/lib` | Librerías compartidas, el equivalente a las DLL de Windows |
| `/var` | Datos variables: logs, colas de correo, cachés de paquetes |
| `/mnt` | Punto de montaje genérico para sistemas de archivos externos |
| `/media` | Punto de montaje automático para CDs, USBs y discos extraíbles |
| `/dev` | Archivos especiales que representan dispositivos (discos, terminales) |
| `/proc`, `/sys` | Vistas virtuales del kernel y del hardware, no son archivos reales en disco |
| `/boot` | La imagen del kernel y los archivos que necesita GRUB para arrancar el sistema |
| `/tmp` | Archivos temporales; muchas distribuciones lo vacían automáticamente en cada reinicio |
| `/opt` | Software de terceros instalado fuera del gestor de paquetes del sistema |
| `/srv` | Datos de servicios que corren en el propio equipo (por ejemplo, el contenido servido por un servidor web) |

> [!note]
> No hace falta memorizar todo el árbol de golpe. Con saber que la configuración vive en `/etc`, los binarios en `/bin` y `/usr/bin`, y tu propio espacio en `/home`, ya puedes moverte con soltura el 90% del tiempo. El resto lo iremos viendo según haga falta.

> [!question] ¿Por qué `/proc` y `/sys` no son "archivos reales"?
> Si haces `ls /proc` verás una lista de números: son los PID (identificadores) de los procesos en ejecución en ese instante. No existen en el disco; el kernel los genera al vuelo cuando los consultas, y desaparecen en cuanto el proceso termina. Es una forma de exponer información interna del sistema usando la misma interfaz (archivos y directorios) que usarías para cualquier otro dato, en lugar de inventar un mecanismo de consulta distinto para cada cosa.

## Navegación

### Cambiar de directorio con `cd`

```bash
cd /etc          # ir a una ruta absoluta
cd ..            # subir un nivel
cd ../..         # subir dos niveles
cd /             # ir a la raíz del sistema
cd               # sin argumentos, te lleva a tu directorio personal
```

### Listar contenido con `ls`

```bash
ls               # lista archivos y directorios
ls -l            # listado "largo": permisos, propietario, tamaño, fecha
ls -a            # incluye archivos ocultos (los que empiezan por .)
ls -la           # combina ambos flags
ls -lh           # tamaños "legibles" (KB, MB, GB) en vez de bytes
ls /etc          # lista el contenido de otra ruta sin moverte a ella
```

> [!tip]
> Los archivos ocultos en Linux son simplemente los que empiezan por un punto (`.bashrc`, `.config`). No es un atributo especial como en Windows, así que `ls` normal no los muestra, pero cualquier comando que apunte a su nombre exacto (`cat .bashrc`) funciona sin problema.

### Leer la salida de `ls -l`

El listado largo condensa mucha información en una sola línea, y merece la pena aprender a leerla de un vistazo:

```text
drwxr-xr-x  2  ansango  ansango  4096  jul 11 10:15  documentos
```

De izquierda a derecha: el primer carácter indica el tipo (`d` de directorio, `-` de archivo normal, `l` de enlace simbólico), seguido de los permisos de propietario, grupo y otros; después el número de enlaces, el usuario propietario, el grupo propietario, el tamaño en bytes, la fecha de última modificación y, por último, el nombre. La lectura detallada de la parte de permisos (`rwxr-xr-x`) la vemos en la nota dedicada a permisos; de momento basta con saber ubicar cada campo.

### Rutas absolutas y relativas

Todo lo anterior funciona tanto con **rutas absolutas** (empiezan por `/` y describen la ubicación exacta desde la raíz, como `/etc/ssh/sshd_config`) como con **rutas relativas** (se interpretan desde el directorio en el que estás en ese momento, como `../config` o `subcarpeta/archivo.txt`). Además de `..` (directorio padre), Linux reconoce `.` como "el directorio actual" y `~` como atajo a tu directorio personal:

```bash
cd ~/documentos      # ~ se expande a /home/ansango
cp ./archivo.txt ./copia.txt   # . es equivalente a no poner nada, pero deja explícito el origen
```

> [!tip]
> Si dudas entre usar ruta absoluta o relativa en un script, usa siempre la absoluta: es más verbosa, pero evita sorpresas si el script se ejecuta desde un directorio distinto al que esperabas (por ejemplo, lanzado desde un cron o un servicio systemd).

## Obtener ayuda

Casi cualquier comando lleva incorporada su propia documentación:

```bash
comando --help   # ayuda rápida y lista de opciones
man comando      # manual completo: sintaxis, descripción, ejemplos
```

Dentro de `man`, usa la barra espaciadora o las flechas para desplazarte, `/palabra` para buscar un término, `n` para saltar a la siguiente coincidencia y `q` para salir.

Un man page sigue casi siempre la misma estructura, lo que hace que una vez aprendes a leer uno, sepas leerlos todos:

```text
NAME          Nombre del comando y una línea de descripción
SYNOPSIS      Cómo se invoca: comando [opciones] argumentos
DESCRIPTION   Explicación detallada de qué hace y sus opciones
EXAMPLES      (si existe) casos de uso típicos
SEE ALSO      Comandos relacionados que también te pueden interesar
```

> [!note]
> La convención en Linux es usar doble guion (`--help`) para opciones que son palabras completas, y un solo guion (`-h`) para opciones de una sola letra. No todos los comandos soportan las tres variantes (`--help`, `-h`, `-?`), así que si una no funciona, prueba otra.

> [!tip]
> Si solo necesitas recordar la sintaxis exacta de un comando que ya conoces (y no quieres leer la descripción completa), prueba `man -f comando` (equivalente a `whatis`) para una línea de resumen, o busca directamente con `/` dentro del propio `man` en vez de leer desde el principio.

## Buscar cosas

Linux ofrece varias herramientas de búsqueda, cada una con sus ventajas:

### `locate`: rápida pero desactualizada

```bash
locate nombre_de_archivo
```

Busca en una base de datos indexada de todo el sistema de archivos, por lo que es muy rápida. El inconveniente es que esa base de datos suele actualizarse una vez al día (con el proceso `updatedb`), así que un archivo creado hace un momento puede no aparecer todavía.

### `whereis`: localizar binarios y su documentación

```bash
whereis grep
# grep: /usr/bin/grep /usr/share/man/man1/grep.1.gz
```

Devuelve la ubicación del binario junto con su página de manual, sin el ruido de miles de coincidencias que puede dar `locate`.

### `which`: dónde está el ejecutable que se lanza

```bash
which python3
# /usr/bin/python3
```

Solo busca en los directorios listados en la variable de entorno `PATH` (donde el sistema busca los comandos que ejecutas). Es la forma más directa de saber qué binario concreto se ejecuta cuando escribes un comando.

### `find`: la búsqueda más potente y flexible

```bash
find directorio opciones expresión
```

`find` puede buscar por nombre, tipo, fecha de modificación, propietario, permisos o tamaño, empezando en cualquier directorio.

```bash
find / -type f -name apache2          # busca el archivo exacto "apache2" desde la raíz
find /etc -type f -name apache2       # misma búsqueda, pero solo dentro de /etc (mucho más rápida)
find /etc -type f -name "apache2.*"   # con comodín, encuentra apache2.conf, apache2.bak, etc.
```

> [!tip]
> Cuanto más acotes el punto de partida (`/etc` en vez de `/`), más rápida será la búsqueda. `find` recorre físicamente el árbol de directorios, así que buscar desde la raíz en un disco grande puede tardar bastante.

A diferencia de `locate`, `find` solo encuentra coincidencias exactas con el nombre salvo que uses comodines: `*` (cualquier secuencia de caracteres, de longitud cero o más), `?` (un único carácter, ni más ni menos) y `[abc]` (cualquiera de los caracteres listados entre corchetes).

> [!example] Cómo se comportan los comodines
> En un directorio con los archivos `cat`, `hat`, `what` y `bat`:
> - `?at` encuentra `hat`, `cat` y `bat`, pero no `what` (tiene dos caracteres antes de "at", no uno).
> - `[cb]at` encuentra `cat` y `bat`, pero no `hat` ni `what`.
> - `*at` encuentra los cuatro, porque `*` no tiene límite de longitud.

### Más allá del nombre: buscar por tipo, fecha, tamaño o propietario

`find` no se limita a nombres de archivo; puede filtrar por prácticamente cualquier metadato del sistema de archivos:

```bash
find /var/log -type f -mtime -1        # archivos modificados en el último día
find /home -type f -size +100M         # archivos de más de 100 MB
find / -type f -user ansango           # archivos propiedad del usuario ansango
find / -type f -perm 4755              # archivos con permisos exactos 4755 (útil para buscar SUID)
find /tmp -type d -empty               # directorios vacíos dentro de /tmp
```

- `-type f` busca solo archivos ordinarios; `-type d`, solo directorios.
- `-mtime -1` significa "modificado hace menos de 1 día"; con `+7` sería "hace más de 7 días".
- `-size +100M` admite sufijos `k`, `M`, `G`; el signo `+` es "mayor que" y `-` es "menor que".

> [!warning]
> Un `find` mal acotado sobre un directorio grande (o directamente sobre `/`) puede generar bastante carga de E/S en el disco, especialmente en servidores con mucho tráfico. Si necesitas buscar de forma habitual, `locate` (con su base de datos indexada) suele ser una alternativa mucho más ligera, aunque menos precisa en el momento.

## Filtrar con `grep`

`grep` busca un patrón de texto dentro de la salida de otro comando o de un archivo, y es habitual combinarlo mediante una tubería (`|`):

```bash
ps aux | grep nginx     # ¿está corriendo el proceso nginx?
cat /etc/hosts | grep 127
grep "error" /var/log/syslog
```

El símbolo `|` toma la salida del comando de la izquierda y la pasa como entrada al comando de la derecha, encadenando herramientas simples para construir consultas más potentes. Esta filosofía —programas pequeños que hacen una cosa bien, combinables entre sí— es una de las señas de identidad de Unix/Linux, y la retomamos con más detalle en la siguiente nota de manipulación de texto.

```bash
grep -r "TODO" /home/ansango/proyecto/   # busca recursivamente en todos los archivos de un directorio
grep -c "error" /var/log/syslog          # cuenta cuántas líneas coinciden, sin mostrarlas
grep -l "mysql" /etc/*.conf              # muestra solo los nombres de los archivos con coincidencias, no las líneas
```

> [!tip]
> `grep` distingue mayúsculas de minúsculas por defecto. Añade `-i` para ignorarlas, algo especialmente útil cuando buscas en logs donde el mismo término puede aparecer capitalizado de formas distintas (`Error`, `ERROR`, `error`).

## Crear, copiar, mover y borrar

### Crear archivos

```bash
touch nuevo.txt          # crea un archivo vacío (o actualiza su fecha si ya existe)
mkdir nuevo_directorio   # crea un directorio
mkdir -p a/b/c           # crea toda la ruta de golpe, incluidos los directorios intermedios que falten
```

Además de `touch`, `cat` seguido de una redirección permite crear archivos pequeños directamente desde la terminal, sin abrir un editor:

```bash
cat > notas.txt
Primera línea de contenido.
Segunda línea.
# Ctrl+D para salir del modo interactivo y guardar
```

Al ejecutar `cat >`, la terminal entra en un modo interactivo donde todo lo que escribas se vuelca al archivo indicado; se sale y se guarda con `Ctrl+D`. Si usas doble redirección (`>>`) en vez de una sola, el contenido se **añade** al final del archivo existente en lugar de sobrescribirlo:

```bash
cat >> notas.txt
Esta línea se añade al final, sin borrar lo anterior.
```

> [!warning]
> Con una sola flecha (`>`), `cat` sobrescribe el archivo de destino sin avisar si ya existía. Para archivos de configuración importantes, usa siempre `>>` si tu intención es añadir contenido, no reemplazarlo.

### Copiar

```bash
cp origen.txt destino.txt              # copia dentro del mismo directorio
cp origen.txt /home/ansango/copia.txt  # copia a otra ruta, con otro nombre
cp -r directorio_origen/ directorio_destino/   # copia recursiva de un directorio completo
cp -p origen.txt destino.txt           # conserva permisos, propietario y fechas del original
```

### Renombrar y mover

Linux no tiene un comando dedicado solo a renombrar: `mv` (*move*) sirve tanto para mover como para renombrar, según si el destino cambia de ruta o solo de nombre.

```bash
mv archivo.txt archivo_nuevo.txt         # renombrar
mv archivo.txt /home/ansango/otra_ruta/  # mover
```

### Borrar

```bash
rm archivo.txt        # elimina un archivo
rmdir directorio/     # elimina un directorio, solo si está vacío
rm -r directorio/     # elimina un directorio y todo su contenido
```

> [!danger]
> `rm -r` no pregunta confirmación y no manda nada a una papelera: el borrado es inmediato y, salvo que tengas backups, irreversible. Ejecutar `rm -r` en tu directorio personal por error borraría todo tu contenido sin posibilidad de deshacerlo. Comprueba dos veces la ruta antes de pulsar Enter, y evita usar `rm -rf` salvo que sepas exactamente lo que vas a borrar.

## Próximos pasos

- [[03-manipulacion-de-texto|Manipulación de texto]]: mostrar, filtrar y modificar el contenido de archivos con `head`, `tail`, `grep`, `sed`, `more` y `less`.
