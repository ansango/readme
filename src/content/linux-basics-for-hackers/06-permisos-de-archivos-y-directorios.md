---
title: Permisos de archivos y directorios
description: "Cómo funcionan los permisos de lectura, escritura y ejecución en Linux (propietario, grupo y otros), chown, chmod en notación octal y simbólica, umask y los bits especiales SUID/SGID"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, permisos]
---

# Permisos de archivos y directorios

> [!abstract] Resumen
> Linux es un sistema multiusuario: cada archivo y directorio tiene un propietario, un grupo y un conjunto de permisos (lectura, escritura, ejecución) para cada uno de los tres niveles de acceso: propietario, grupo y resto de usuarios. `chown` cambia quién es el dueño, `chmod` cambia qué puede hacer cada nivel, y `umask` define los permisos por defecto de los archivos nuevos. Además existen tres bits especiales (SUID, SGID y sticky bit) que conviene entender también por motivos de seguridad.

## Propietario, grupo y otros

Cada archivo pertenece a un usuario (el propietario) y a un grupo. El resto de usuarios del sistema caen en una tercera categoría, "otros". Esta triple división es la base de todo el modelo de permisos:

- **Propietario (user, u)**: normalmente quien creó el archivo.
- **Grupo (group, g)**: un conjunto de usuarios con necesidades similares (por ejemplo, un grupo `desarrollo` o `sysadmins`). Cada usuario que pertenece al grupo hereda los permisos que tenga el archivo para ese grupo.
- **Otros (others, o)**: cualquier usuario del sistema que no sea ni el propietario ni miembro del grupo.

El usuario `root` no está sujeto a estas restricciones: puede leer, escribir y ejecutar prácticamente cualquier cosa, independientemente de los permisos configurados, y pertenece por defecto al grupo `root`.

Agrupar usuarios por función es lo que hace manejable la administración de permisos en un sistema con más de un puñado de cuentas: en una empresa podrías tener grupos como `finanzas`, `desarrollo` o `ventas`; en un equipo de seguridad, un grupo de pentesters con acceso a herramientas ofensivas y un grupo de analistas defensivos con acceso solo a herramientas de detección. En lugar de conceder permisos usuario por usuario, se conceden una vez al grupo y cualquier miembro nuevo los hereda automáticamente al añadirse a él.

### Cambiar el propietario: chown

Para transferir la propiedad de un archivo a otro usuario (de forma que esa persona pueda a partir de ahí controlar sus permisos), se usa `chown`:

```bash
sudo chown ana archivo.txt         # cambia el propietario del archivo a "ana"
```

Este comando entrega la propiedad de `archivo.txt` a la cuenta `ana`; a partir de ese momento, es `ana` quien decide qué permisos tiene cada nivel de acceso sobre ese archivo.

### Cambiar el grupo propietario: chgrp

De forma equivalente, `chgrp` transfiere la propiedad de grupo. Es habitual en entornos colaborativos: imagina un grupo `pentesters` (con acceso total, equivalente al grupo root del proyecto) que instala una herramienta nueva, `newIDS`, pensada para el equipo de seguridad defensiva. Para que el grupo `seguridad` pueda usarla sin más trámite, basta con reasignar el grupo propietario:

```bash
sudo chgrp seguridad newIDS         # el grupo "seguridad" pasa a ser propietario de newIDS
sudo chown ana:desarrollo archivo.txt  # cambia propietario y grupo en un solo paso
```

Solo `root` o el propietario actual del archivo pueden reasignar la propiedad.

## Consultar permisos con `ls -l`

```bash
ls -l /etc/hosts
# -rw-r--r-- 1 root root 220 jul 10 10:03 /etc/hosts
```

Cada campo de la salida aporta una pieza de información distinta, de izquierda a derecha:

| Campo | Ejemplo | Significado |
|---|---|---|
| Tipo + permisos | `-rw-r--r--` | Tipo de archivo y permisos de propietario/grupo/otros |
| Nº de enlaces | `1` | Cuántos nombres (enlaces duros) apuntan al mismo archivo en disco |
| Propietario | `root` | Usuario dueño del archivo |
| Grupo | `root` | Grupo propietario del archivo |
| Tamaño | `220` | Tamaño en bytes |
| Fecha | `jul 10 10:03` | Última modificación |
| Nombre | `/etc/hosts` | Ruta o nombre del archivo |

La cadena inicial (`-rw-r--r--`) se lee así:

- El primer carácter indica el tipo: `-` para archivo normal, `d` para directorio.
- Los siguientes 9 caracteres son **tres grupos de tres**: permisos del propietario, del grupo y de otros, en ese orden. Cada grupo es una combinación de `r` (lectura), `w` (escritura) y `x` (ejecución), o `-` si ese permiso no está concedido.

En el ejemplo anterior, `rw-r--r--` significa: el propietario (`root`) puede leer y escribir; el grupo y el resto de usuarios solo pueden leer.

> [!note] Qué significa cada permiso según el tipo
> En un archivo, `x` permite ejecutarlo como programa o script. En un directorio, `x` permite *entrar* en él (aunque no necesariamente listar su contenido, que depende de `r`). Es una distinción que confunde al principio: un directorio con `r-x` se puede recorrer y usar, pero no listar con `ls`.

## Cambiar permisos con chmod

Solo `root` o el propietario del archivo pueden cambiar sus permisos, y hay dos formas de hacerlo con `chmod`: notación octal y notación simbólica (UGO).

### Notación octal

Cada combinación de `rwx` se puede representar como un número binario de 3 bits (activado/desactivado), que a su vez se expresa como un único dígito octal:

| Octal | rwx | Significado |
|---|---|---|
| 0 | `---` | sin permisos |
| 1 | `--x` | solo ejecución |
| 2 | `-w-` | solo escritura |
| 3 | `-wx` | escritura y ejecución |
| 4 | `r--` | solo lectura |
| 5 | `r-x` | lectura y ejecución |
| 6 | `rw-` | lectura y escritura |
| 7 | `rwx` | todos los permisos |

`chmod` recibe tres dígitos octales (propietario, grupo, otros):

```bash
chmod 754 script.sh
# propietario: 7 (rwx) · grupo: 5 (r-x) · otros: 4 (r--)
```

Es el método más rápido de escribir y el que verás más en scripts y documentación, aunque al principio cueste un poco hacer la conversión mental.

### Notación simbólica (UGO)

La sintaxis UGO (user/group/others) es más explícita porque no requiere memorizar la tabla octal: indicas a quién afecta (`u`, `g`, `o`, o `a` para todos), un operador (`+` añade, `-` quita, `=` fija exactamente) y el permiso.

```bash
chmod u+x script.sh        # añade ejecución al propietario
chmod g-w archivo.txt      # quita escritura al grupo
chmod o=r archivo.txt      # deja "otros" solo con lectura, elimine lo que elimine
chmod u+x,o+x script.sh    # varios cambios en un mismo comando, separados por comas
```

> [!tip] Un archivo recién descargado no se puede ejecutar
> Por defecto, Linux crea archivos con permisos `644` (sin ejecución para nadie). Si descargas un script o binario y te da "Permission denied" al lanzarlo, necesitas darte permiso de ejecución explícitamente: `chmod u+x nombre_del_archivo`.

### Ejemplo completo: de "Permission denied" a herramienta ejecutable

Este flujo es tan habitual para cualquiera que trabaje con herramientas descargadas que merece verse paso a paso. Supón que descargas `newhackertool` en tu directorio personal:

```bash
ls -l
# -rw-r--r-- 1 root root 1072 dic  5 11:17 newhackertool
```

El archivo no tiene bit de ejecución para nadie: intentar lanzarlo con `./newhackertool` devuelve `Permission denied`. Le das permisos de lectura, escritura y ejecución al propietario, y lectura y escritura al grupo y a otros:

```bash
chmod 766 newhackertool
ls -l
# -rwxrw-rw- 1 root root 1072 dic  5 11:17 newhackertool
./newhackertool     # ahora sí se ejecuta
```

Es un buen ejemplo de cómo leer la tabla al revés: `766` sale de sumar 4+2+1 (rwx) para el propietario y 4+2 (rw-) para grupo y otros. Fíjate en que aquí se ha dado permiso de escritura a todo el mundo sobre el binario, algo que en un sistema compartido normalmente querrías evitar; en la práctica, para un binario que solo tú vas a ejecutar, `chmod 755` (rwx para el propietario, r-x para el resto) suele ser la opción más sensata.

## umask: permisos por defecto para archivos nuevos

`umask` define qué permisos se **restan** a los permisos base del sistema (666 para archivos, 777 para directorios) cada vez que se crea un archivo o directorio nuevo.

```bash
umask
# 0022
```

Con un umask de `022`, un archivo nuevo queda en `644` (666 − 022) y un directorio nuevo en `755` (777 − 022): el propietario mantiene lectura y escritura (y ejecución en directorios), mientras que grupo y otros solo conservan lectura.

Para cambiar el umask de un usuario de forma permanente, se añade la instrucción en su `~/.profile` o `~/.bashrc`:

```bash
echo "umask 027" >> ~/.profile
```

Un umask más restrictivo (como `027` o `077`) es habitual en cuentas de servicio o sistemas donde no quieres que el grupo u otros usuarios tengan acceso por defecto a nada de lo que se cree.

## Permisos especiales: SUID y SGID

Además de `rwx`, Linux tiene tres bits de permiso especiales que se añaden como un cuarto dígito delante de la notación octal habitual.

### SUID (Set User ID)

Cuando el bit SUID está activado en un ejecutable, cualquier usuario que lo ejecute obtiene temporalmente los permisos del **propietario del archivo** (no los suyos propios) mientras dura esa ejecución. Es el mecanismo que usan herramientas como `passwd`, que necesita escribir en `/etc/shadow` (solo accesible por root) aunque la ejecute un usuario normal.

```bash
chmod 4755 herramienta   # el 4 inicial activa el bit SUID
ls -l herramienta
# -rwsr-xr-x 1 root root ... herramienta
```

Fíjate en la `s` que sustituye a la `x` del propietario en la salida de `ls -l`: así se representa visualmente que el SUID está activo.

### SGID (Set Group ID)

Funciona igual que SUID pero con el grupo: quien ejecuta el archivo hereda los permisos del **grupo propietario**. Sobre un directorio, el comportamiento es distinto y muy útil para trabajo colaborativo: cualquier archivo nuevo creado dentro hereda automáticamente el grupo del directorio, en lugar del grupo del usuario que lo crea.

```bash
chmod 2755 directorio_compartido   # el 2 inicial activa el bit SGID
```

### El sticky bit

El sticky bit (representado con un `1` inicial, por ejemplo `chmod 1777`) permite que, en un directorio compartido por varios usuarios, cada uno solo pueda borrar o renombrar sus propios archivos, aunque el directorio tenga permisos de escritura abiertos para todos. Es lo que hace, por ejemplo, que `/tmp` no se convierta en un caos entre usuarios distintos: cualquiera puede crear archivos ahí, pero nadie puede borrar los de otro usuario salvo el propietario o `root`.

> [!note] El libro lo llama "outmoded"
> Algunas referencias tratan el sticky bit como un resto arqueológico de los Unix antiguos, donde sin él cualquier usuario con permiso de escritura sobre un directorio podía borrar archivos ajenos. En la práctica, en los Linux actuales sigue teniendo un uso muy real y activo (justo el caso de `/tmp`), así que no lo descartes por "legacy": compruébalo tú mismo con `ls -ld /tmp` y verás la `t` al final de la cadena de permisos.

## Por qué esto importa para la seguridad

> [!danger] SUID + root + una vulnerabilidad = escalada de privilegios
> Si un binario tiene el bit SUID activado y pertenece a `root`, cualquier fallo de seguridad en ese programa (un bug que permita ejecutar comandos arbitrarios, por ejemplo) puede aprovecharse para obtener una shell con privilegios de `root`, aunque quien lo ejecute sea un usuario sin privilegios. Por eso auditar qué binarios tienen SUID activo es una tarea habitual tanto en hardening de sistemas como en pruebas de penetración.

Para localizar todos los binarios con SUID propiedad de root en el sistema:

```bash
find / -user root -perm -4000 2>/dev/null
```

Este comando le pide a `find` que arranque en la raíz (`/`) y busque, en todo el árbol de directorios, archivos cuyo propietario sea `root` y cuyo modo de permisos incluya el bit SUID (`-perm -4000`). En un Kali típico, la salida incluye binarios esperables como:

```
/usr/bin/chsh
/usr/bin/gpasswd
/usr/bin/pkexec
/usr/bin/sudo
/usr/bin/passwd
```

Si inspeccionas cualquiera de ellos con `ls -l`, verás la `s` característica en el bit de ejecución del propietario:

```bash
ls -l /usr/bin/sudo
# -rwsr-xr-x 1 root root 140944 jul  5  2018 sudo
```

### Ejemplo de escalada de privilegios vía SUID mal configurado

La lista de `find / -perm -4000` no es solo curiosidad: es el primer paso de cualquier auditoría de post-explotación. Los binarios de la lista anterior (`sudo`, `passwd`, `pkexec`) son SUID *por diseño* y no suponen un problema en sí mismos porque están escritos para dejar caer sus privilegios de forma segura. El riesgo real aparece cuando un administrador marca con SUID un binario que **no** debería tenerlo —por ejemplo, un binario de sistema como `find`, `vim`, `cp` o un script de mantenimiento casero— porque, sin haberlo pensado, cualquier usuario puede usarlo para leer o escribir donde solo `root` debería poder:

```bash
# Si find tuviera el bit SUID activo por error...
find / -perm -4000 2>/dev/null | xargs ls -l | grep find
# -rwsr-xr-x 1 root root ... /usr/bin/find

# ...un usuario sin privilegios podría usar la propia opción -exec de find
# para lanzar una shell con permisos heredados del propietario (root)
find . -exec /bin/sh -p \; -quit
```

Este patrón (binario con SUID + una función del propio programa que permite ejecutar código o abrir una shell) es la base de listas como GTFOBins, y es exactamente lo que un pentester busca nada más obtener acceso de bajo privilegio a un sistema: ejecutar `find / -user root -perm -4000 2>/dev/null` es casi siempre uno de los primeros comandos tras conseguir una shell inicial.

Revisar periódicamente esta lista (y quitar el bit SUID de cualquier binario que no lo necesite realmente, con `chmod u-s binario`) es una medida básica de endurecimiento de cualquier sistema Linux.

## Próximos pasos

- [[07-gestion-de-procesos|Gestión de procesos]]
