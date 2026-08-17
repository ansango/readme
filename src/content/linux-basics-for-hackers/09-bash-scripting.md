---
title: Bash scripting
description: "Crash course de bash para automatizar tareas: tu primer script, variables, entrada de usuario, bucles/condicionales y los comandos built-in del shell"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, bash]
---

# Bash scripting

> [!abstract] Resumen
> Introducción práctica a los scripts de bash: cómo escribir tu primer script y darle permisos de ejecución, cómo usar variables y `read` para capturar entrada del usuario, y cómo combinar bucles `for`/`while` con condicionales y parámetros posicionales para automatizar una tarea real (un escáner de puertos casero inspirado en un caso real de cibercrimen). Cierra con patrones de control de flujo adicionales, manejo de argumentos y una tabla de comandos built-in del shell.

## Qué es un script de bash

Un script es simplemente un archivo de texto con una secuencia de comandos que el shell ejecuta uno detrás de otro, como si los escribieras a mano en la terminal. La ventaja frente a teclear comandos sueltos es evidente: lo escribes una vez y lo reutilizas siempre que quieras, sin errores de repetición.

Bash no es el único shell (existen `zsh`, `ksh`, `csh`...), pero es el que viene por defecto en la inmensa mayoría de distribuciones Linux y en macOS, así que es el estándar de facto para scripting de sistema.

> [!note]
> Bash no es la única herramienta de automatización que necesitarás. Para tareas más complejas de manipulación de texto, exploits o herramientas de terceros, es habitual acabar recurriendo a Python (el lenguaje de la mayoría de herramientas de seguridad), Ruby (Metasploit está escrito en Ruby) o Perl (fuerte en procesamiento de texto). Bash sigue siendo el punto de partida porque no depende de ningún intérprete adicional: está ya en cualquier sistema Linux que toques.

## Tu primer script

Todo script de bash empieza con una línea especial llamada **shebang**, que le dice al sistema qué intérprete debe usar para ejecutar el resto del archivo:

```bash
#!/bin/bash

# Este es mi primer script. Simplemente saluda.
echo "Hola, mundo"
```

> [!note]
> La línea que empieza por `#` (salvo el shebang) es un comentario: el intérprete la ignora por completo. Úsalos generosamente para explicar el *porqué* de un bloque de código, no solo el *qué*.

Guarda el archivo, por ejemplo, como `saludo.sh`. Aunque la extensión `.sh` no es obligatoria para que el script funcione, es la convención que indica a cualquiera que lea el directorio que ese archivo es un script de shell.

### Dar permisos de ejecución

Por defecto, un archivo recién creado no es ejecutable, ni siquiera para su propietario:

```bash
ls -l saludo.sh
# -rw-r--r-- 1 ansango ansango 52 jul 11 10:00 saludo.sh
```

Le falta el permiso `x` (ejecución). Se lo damos con `chmod`:

```bash
chmod +x saludo.sh
# o, de forma más explícita:
chmod 755 saludo.sh
```

> [!tip]
> `chmod +x` añade el permiso de ejecución a quien ya lo tuviera de lectura/escritura, sin tocar el resto. `chmod 755` fija permisos exactos (rwx para el propietario, r-x para grupo y otros). Para repasar la notación numérica de permisos, consulta la nota de [[06-permisos-de-archivos-y-directorios|permisos de archivos y directorios]].

### Ejecutar el script

```bash
./saludo.sh
```

> [!warning]
> El `./` delante del nombre no es decorativo: le dice al shell que ejecute el archivo del directorio actual y no un binario con el mismo nombre que pudiera estar en el `PATH`. Sin él, si el directorio actual no está en tu `PATH` (lo habitual), recibirás un error de `command not found`.

## Variables y entrada de usuario

Una variable es simplemente un espacio de memoria con un nombre al que puedes asignar y recuperar un valor. Para leer un valor introducido por el usuario se usa el comando `read`, que lo captura de la entrada estándar y lo guarda en la variable indicada.

```bash
#!/bin/bash

echo "¿Cómo te llamas?"
read nombre

echo "¿En qué directorio trabajas normalmente?"
read directorio

echo "Hola $nombre, hoy vamos a trabajar en $directorio"
```

> [!note]
> Para leer el contenido de una variable se antepone `$` a su nombre (`$nombre`), tal y como se explica en la nota de [[08-variables-de-entorno|variables de entorno]]. Sin el `$`, bash trata la palabra como texto literal, no como una referencia a la variable.

## Parámetros posicionales: pasar argumentos al script

Antes de meternos con el escáner, conviene distinguir las dos formas de dar datos a un script: pedirlos de forma interactiva con `read` (como en el ejemplo anterior) o pasarlos como argumentos en la propia línea de invocación, al estilo de cualquier comando de Linux (`grep -i patron archivo`).

Dentro del script, esos argumentos están disponibles como **parámetros posicionales**:

| Variable | Contenido |
|---|---|
| `$0` | El nombre del propio script |
| `$1`, `$2`, `$3`... | El primer, segundo, tercer argumento recibido |
| `$#` | El número total de argumentos recibidos |
| `$@` | Todos los argumentos, como lista separada |
| `$*` | Todos los argumentos, como una única cadena |

```bash
#!/bin/bash

echo "El script se llama: $0"
echo "Se han pasado $# argumentos"
echo "El primero es: $1"
echo "Todos juntos: $@"
```

> [!tip]
> Casi siempre es buena idea validar que el usuario ha pasado los argumentos esperados antes de usarlos, para no lanzar el resto del script con variables vacías:
> ```bash
> if [[ $# -lt 3 ]]; then
>     echo "Uso: $0 <host> <puerto_inicial> <puerto_final>"
>     exit 1
> fi
> ```
> `exit 1` termina el script con un código de salida distinto de cero, la convención universal en Unix para señalar que algo ha ido mal (`exit 0`, o simplemente no llamar a `exit`, indica éxito). Ese código queda disponible después en la variable `$?` para quien haya invocado el script.

## Un script práctico: escáner de puertos con bash puro

> [!question] Por qué este ejemplo y no otro
> El libro plantea un caso real de cibercrimen: Max "Vision" Butler, condenado por robar y vender números de tarjetas de crédito, escribió un script para rastrear internet en busca de sistemas con el puerto 5505 abierto (una puerta trasera de soporte técnico del TPV Aloha POS). El mismo patrón —recorrer un rango de host/puerto con un bucle y filtrar los resultados— sirve tanto para defender una red (auditar qué tienes expuesto) como para atacarla; de ahí que sea uno de los primeros scripts que cualquier manual de hacking enseña a construir.

Bash tiene un truco poco conocido pero muy útil para un administrador o para depurar conectividad: el pseudo-dispositivo `/dev/tcp/<host>/<puerto>`. Al intentar abrir ese "archivo" en redirección, bash intenta abrir una conexión TCP real contra ese host y puerto, sin depender de herramientas externas como `nc` o `nmap`.

Vamos a construir un escáner simple que recorra un rango de puertos de un host usando un bucle `for` y decida con un condicional si cada puerto está abierto o cerrado:

```bash
#!/bin/bash

# Escáner de puertos TCP usando solo bash, sin herramientas externas.
# Uso: ./escaner.sh <host> <puerto_inicial> <puerto_final>

host="$1"
puerto_inicio="$2"
puerto_fin="$3"

echo "Escaneando $host del puerto $puerto_inicio al $puerto_fin..."

for puerto in $(seq "$puerto_inicio" "$puerto_fin"); do
    # Intentamos abrir una conexión TCP con timeout de 1 segundo.
    if timeout 1 bash -c "echo > /dev/tcp/$host/$puerto" 2>/dev/null; then
        echo "Puerto $puerto: ABIERTO"
    fi
done

echo "Escaneo completado."
```

Desglosemos las dos piezas nuevas:

- **El bucle `for puerto in $(seq inicio fin); do ... done`** itera la variable `puerto` sobre cada número generado por `seq`, ejecutando el bloque una vez por cada valor. Es el patrón estándar para repetir una acción sobre un rango o una lista.
- **El condicional `if ... ; then ... fi`** evalúa el código de salida del comando que le sigue: si `bash -c "echo > /dev/tcp/$host/$puerto"` consigue abrir la conexión, el código de salida es `0` (éxito) y el `if` se cumple. Si el puerto está cerrado o filtrado, el intento falla y el `if` no entra en el bloque.

Ejecutado así:

```bash
chmod +x escaner.sh
./escaner.sh 192.168.1.1 20 25
# Escaneando 192.168.1.1 del puerto 20 al 25...
# Puerto 22: ABIERTO
# Escaneo completado.
```

> [!example] Variante con `read` para pedir los datos de forma interactiva
> ```bash
> #!/bin/bash
> echo "Host a escanear: "
> read host
> echo "Puerto inicial: "
> read puerto_inicio
> echo "Puerto final: "
> read puerto_fin
>
> for puerto in $(seq "$puerto_inicio" "$puerto_fin"); do
>     if timeout 1 bash -c "echo > /dev/tcp/$host/$puerto" 2>/dev/null; then
>         echo "Puerto $puerto: ABIERTO"
>     fi
> done
> ```
> Misma lógica, pero pidiendo los tres valores por teclado en lugar de recibirlos como argumentos — el mismo patrón que usarás en la mayoría de tus primeros scripts.

> [!warning]
> Escanear puertos de un sistema que no es tuyo, o para el que no tienes autorización explícita, puede ser ilegal dependiendo de la jurisdicción y del contexto. Usa este tipo de scripts únicamente sobre tus propios equipos o en entornos de laboratorio/CTF autorizados.

### Variante combinando bash con nmap

El truco de `/dev/tcp` es elegante porque no depende de nada externo, pero en la práctica casi ningún script de reconocimiento real reinventa el escaneo TCP: se apoya en `nmap` y bash se limita a orquestar la entrada, la salida y el filtrado. Es el patrón que usa el propio libro para construir un escáner de MySQL (puerto 3306, la base de datos que casi todo atacante quiere encontrar):

```bash
#!/bin/bash

if [[ $# -lt 3 ]]; then
    echo "Uso: $0 <ip_inicial> <ultimo_octeto_final> <puerto>"
    exit 1
fi

primera_ip="$1"
ultimo_octeto="$2"
puerto="$3"

# -oG genera una salida "grep-able", pensada para procesarse línea a línea
nmap -sT "$primera_ip-$ultimo_octeto" -p "$puerto" >/dev/null -oG escaneo.tmp

# Nos quedamos solo con las líneas que contienen la palabra "open"
grep open escaneo.tmp > escaneo_abiertos.tmp
cat escaneo_abiertos.tmp
rm -f escaneo.tmp escaneo_abiertos.tmp
```

> [!note]
> `>/dev/null` descarta la salida normal de `nmap` en pantalla (irrelevante aquí, pero imprescindible si quieres que el script pase desapercibido al ejecutarse contra un objetivo remoto). El resultado grep-able (`-oG`) es el que de verdad procesamos, con `grep open` como filtro final para quedarnos solo con los puertos que respondieron.

## Más control de flujo

El bucle `for` y el condicional `if` del escáner cubren el caso más habitual, pero bash ofrece más estructuras que conviene conocer para no forzar todo a base de `for`.

### while y until

`while` repite un bloque mientras una condición sea cierta; `until` hace justo lo contrario, repite mientras sea **falsa**:

```bash
#!/bin/bash

# Reintenta una conexión hasta 5 veces, esperando 2 segundos entre intento e intento
intentos=0
until timeout 1 bash -c "echo > /dev/tcp/$1/$2" 2>/dev/null || [[ $intentos -ge 5 ]]; do
    echo "Intento $((intentos+1)) fallido, reintentando..."
    intentos=$((intentos+1))
    sleep 2
done
```

### case, la alternativa legible a una cadena de if/elif

Cuando hay que comparar una misma variable contra varios valores posibles, `case` es más claro que encadenar `if`/`elif`/`else`:

```bash
#!/bin/bash

read -p "¿Qué acción quieres? (start/stop/status): " accion

case "$accion" in
    start)
        echo "Arrancando servicio..."
        ;;
    stop)
        echo "Deteniendo servicio..."
        ;;
    status)
        echo "Consultando estado..."
        ;;
    *)
        echo "Opción no reconocida: $accion"
        exit 1
        ;;
esac
```

### break, continue y trap

`break` corta un bucle inmediatamente; `continue` salta a la siguiente iteración sin ejecutar el resto del cuerpo del bucle en la iteración actual. Son útiles para descartar casos concretos dentro de un `for`, por ejemplo saltarse un puerto ya conocido:

```bash
for puerto in $(seq 1 100); do
    [[ "$puerto" == "22" ]] && continue   # nos saltamos el 22, ya sabemos que está abierto
    # resto del escaneo...
done
```

`trap`, por su parte, intercepta una señal del sistema (por ejemplo, `Ctrl+C`, que envía `SIGINT`) para ejecutar una acción de limpieza antes de salir, en lugar de dejar el script a medias:

```bash
#!/bin/bash

trap 'echo "Escaneo interrumpido por el usuario. Saliendo limpio."; exit 1' SIGINT

for puerto in $(seq 1 65535); do
    # escaneo largo que el usuario podría querer cancelar...
    :
done
```

> [!tip]
> `shift` (ya presente en la tabla de built-ins) es el complemento natural de `$@` cuando quieres procesar un número variable de argumentos uno a uno: cada llamada a `shift` descarta `$1` y desplaza el resto una posición a la izquierda, de forma que el bucle `while [[ $# -gt 0 ]]; do ... shift; done` es el patrón estándar para recorrer todos los argumentos sin conocer de antemano cuántos son.

## Comandos built-in habituales de bash

Además de los programas externos (`ls`, `grep`, etc.), bash trae sus propios comandos internos, que no dependen de ningún binario en disco:

| Comando | Función |
|---|---|
| `echo` | Muestra texto o el valor de variables en pantalla |
| `read` | Lee una línea de la entrada estándar y la guarda en una variable |
| `exit` | Termina el script (opcionalmente con un código de salida: `exit 1`) |
| `cd` | Cambia de directorio |
| `pwd` | Muestra el directorio actual |
| `export` | Hace que una variable esté disponible para procesos hijos |
| `test` / `[[ ]]` | Evalúa una expresión condicional (comparaciones, existencia de archivos...) |
| `unset` | Elimina una variable |
| `shift` | Desplaza los parámetros posicionales (`$1`, `$2`...) una posición |
| `break` / `continue` | Sale de un bucle o salta a la siguiente iteración |
| `trap` | Captura una señal (por ejemplo, `Ctrl+C`) para manejarla en el script |
| `getopts` | Procesa argumentos con formato de opción (`-h`, `-p 80`...) pasados al script |
| `eval` | Evalúa una cadena como si fuera código bash y la ejecuta |
| `exec` | Sustituye el proceso actual del shell por el comando indicado, sin crear uno nuevo |
| `readonly` | Declara una variable como solo lectura, para que no pueda modificarse después |
| `wait` | Espera a que termine un proceso lanzado en segundo plano (`&`) |
| `jobs` / `bg` / `fg` | Lista, envía a segundo plano o trae a primer plano los trabajos del shell |

> [!tip]
> `test` y `[[ ]]` son equivalentes en su función pero no en sintaxis: `[[ -f archivo.txt ]]` (comprueba si un archivo existe y es regular) es la forma moderna y más segura frente a errores de expansión de variables que `test -f archivo.txt` o su alias `[ -f archivo.txt ]`.

> [!example] getopts en la práctica
> Cuando un script admite varias opciones con o sin valor (por ejemplo `./escaner.sh -h 192.168.1.1 -p 22`), `getopts` es más robusto que ir comparando `$1`, `$2`... a mano:
> ```bash
> #!/bin/bash
>
> while getopts "h:p:" opcion; do
>     case "$opcion" in
>         h) host="$OPTARG" ;;
>         p) puerto="$OPTARG" ;;
>         *) echo "Uso: $0 -h host -p puerto"; exit 1 ;;
>     esac
> done
>
> echo "Escaneando $host en el puerto $puerto"
> ```
> La cadena `"h:p:"` declara dos opciones (`-h` y `-p`) que esperan un valor a continuación (de ahí los dos puntos); `OPTARG` guarda ese valor en cada iteración.

> [!warning]
> Rodea siempre tus variables entre comillas dobles al usarlas (`"$host"`, no `$host`) salvo que quieras explícitamente que bash haga *word splitting* o expansión de comodines sobre su contenido. Sin comillas, una variable con espacios (por ejemplo, una ruta como `/home/ana sango/proyecto`) se parte en varios argumentos y rompe el script de formas difíciles de depurar.

## Próximos pasos

- [[10-compresion-y-archivado|Compresión y archivado]]: empaqueta y comprime los archivos que generan tus scripts con `tar`, `gzip`, `bzip2` y `dd`.
