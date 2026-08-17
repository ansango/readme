---
title: Variables de entorno
description: "Ver y modificar variables de entorno con env, printenv y export, la diferencia entre cambios de sesión y permanentes, cómo funciona PATH y cómo personalizar el prompt con PS1"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, bash]
---

# Variables de entorno

> [!abstract] Resumen
> Las variables de entorno son pares clave-valor (`CLAVE=valor`) que controlan cómo se comporta tu sesión de shell: dónde busca comandos (`PATH`), qué aspecto tiene el prompt (`PS1`), dónde está tu directorio personal (`HOME`), etc. Se consultan con `env`, `printenv` o `set`, se modifican asignándolas directamente, y solo persisten en sesiones futuras si las declaras en un archivo de configuración como `.bashrc` o `.profile`.

## Qué es exactamente una variable de entorno

Una variable de entorno no es un concepto exclusivo de bash: es un mecanismo del propio kernel de Linux para pasar configuración a los procesos. Cada proceso en ejecución tiene asociado un bloque de memoria con pares `CLAVE=valor` llamado su *entorno* (puedes inspeccionarlo directamente en `/proc/<PID>/environ`). Cuando un proceso crea uno nuevo (típicamente con una llamada `fork()` seguida de `exec()`), el proceso hijo recibe **una copia** del entorno del padre en el momento de crearse: de ahí que se diga que las variables de entorno "se heredan".

Esto tiene una consecuencia práctica importante: la herencia va siempre de padre a hijo, nunca al revés. Si cambias una variable en un proceso hijo (por ejemplo, dentro de un script que has lanzado), ese cambio no puede "subir" y afectar a la shell que lo lanzó, porque el hijo solo tiene una copia independiente. Es la razón por la que ejecutar un script que hace `cd` o cambia variables de entorno no afecta a tu terminal actual, a menos que lo ejecutes con `source` (que carga el script en la shell actual en lugar de crear un proceso hijo).

### Variable de shell frente a variable de entorno

El libro distingue, con razón, entre dos cosas que a menudo se confunden:

- **Variable de shell**: solo existe dentro de la shell en la que se define (normalmente en minúsculas por convención, aunque nada te lo impide). No se pasa a los procesos hijos. Ejemplo: `mi_variable=valor`.
- **Variable de entorno**: forma parte del entorno del proceso y se hereda por cualquier proceso hijo. Por convención se escribe en mayúsculas (`PATH`, `HOME`, `EDITOR`...). Una variable de shell se convierte en variable de entorno en el momento en que la marcas con `export`.

```bash
mi_variable="solo en esta shell"
bash -c 'echo "hijo ve: $mi_variable"'     # hijo ve: (vacío, no la hereda)

export mi_variable
bash -c 'echo "hijo ve: $mi_variable"'     # hijo ve: solo en esta shell
```

Este experimento es la forma más directa de comprobar en la práctica qué hace realmente `export`: no cambia el valor de la variable, cambia si esa variable pasa o no a formar parte del entorno que se copia a los procesos hijos.

## Ver las variables de entorno

```bash
env
# SHELL=/bin/bash
# USER=ansango
# PATH=/usr/local/sbin:/usr/local/bin:/usr/bin:/bin
# HOME=/home/ansango
# ...
```

`env` (o su equivalente más simple, `printenv`) muestra solo las variables de entorno "oficiales": las que se heredan automáticamente en cualquier proceso o shell hijo que lances. Por convención, siempre se escriben en mayúsculas.

Algunas de las más relevantes en el día a día, más allá de `PATH` y `HOME`:

| Variable | Para qué sirve |
|---|---|
| `SHELL` | Ruta del intérprete de comandos por defecto del usuario (`/bin/bash`, `/bin/zsh`...) |
| `USER` | Nombre del usuario que ha iniciado la sesión |
| `HOSTNAME` | Nombre del equipo |
| `LANG` / `LC_*` | Idioma y formato regional (fecha, moneda, orden alfabético) que usan los programas |
| `EDITOR` / `VISUAL` | Editor de texto que invocan otros programas cuando necesitan que edites algo (`git commit` sin `-m`, `crontab -e`...) |
| `TERM` | Tipo de terminal, usado para saber qué secuencias de color y control soporta |

> [!tip] Cambia el editor por defecto de todo el sistema con una variable
> Si `EDITOR` no está definida, herramientas como `crontab -e` o `visudo` suelen caer en `vi` o `nano` según la distribución. Poniendo `export EDITOR=vim` (o el editor que prefieras) en tu `~/.bashrc`, cualquier programa que respete esta convención se abrirá con tu editor de preferencia sin tener que configurarlo herramienta por herramienta.

Para ver **todas** las variables, incluyendo variables de shell, funciones y alias definidos localmente (que no se heredan en procesos hijos), se usa `set`:

```bash
set | more
```

`set` sin filtros suele producir una salida larguísima, así que combinarlo con `more` (para paginar) o con `grep` (para filtrar) es casi obligatorio en la práctica.

### Filtrar una variable concreta

```bash
printenv PATH
# /usr/local/sbin:/usr/local/bin:/usr/bin:/bin

set | grep HISTSIZE
# HISTSIZE=1000
```

`HISTSIZE`, por ejemplo, controla cuántos comandos guarda el historial de la sesión (los que recuperas con las flechas arriba/abajo). Ponerla a `0` es una forma rápida de que la sesión actual deje de guardar historial.

> [!tip] `HISTSIZE` no es lo mismo que `HISTFILESIZE`
> `HISTSIZE` limita cuántos comandos se mantienen en memoria durante la sesión actual; `HISTFILESIZE` limita cuántas líneas se guardan en el archivo de historial en disco (`~/.bash_history`) al cerrar la sesión. Poner `HISTSIZE=0` detiene el historial de la sesión en curso, pero si quieres borrar rastro de forma más completa también hay que vaciar o limitar `HISTFILESIZE`, y recordar que el archivo `~/.bash_history` en sí sigue existiendo hasta que se sobrescribe o se borra explícitamente (`history -c` limpia el historial en memoria; `> ~/.bash_history` vacía el archivo).

## Cambios de sesión vs. cambios permanentes

Esta es la distinción más importante a la hora de trabajar con variables de entorno, y la que más confunde a quien empieza:

```bash
HISTSIZE=0          # cambia el valor SOLO en la shell actual
export HISTSIZE      # hace que el valor se propague a los procesos hijos de ESTA sesión
```

Ninguna de las dos líneas anteriores sobrevive a cerrar la terminal: al abrir una sesión nueva, `HISTSIZE` vuelve a su valor por defecto. Para que un cambio sea realmente permanente, tiene que quedar escrito en un archivo que bash lea al arrancar:

- **`~/.bashrc`**: se ejecuta en cada shell interactiva nueva (por ejemplo, cada terminal que abres). Es el sitio habitual para alias, funciones y casi cualquier variable de uso personal.
- **`~/.profile`** (o `~/.bash_profile`): se ejecuta en sesiones de *login* (cuando inicias sesión, no en cada terminal). Es más apropiado para variables que deben aplicarse a toda la sesión de usuario, no solo a bash.

```bash
echo 'export HISTSIZE=5000' >> ~/.bashrc
source ~/.bashrc    # recarga el archivo sin necesidad de cerrar y abrir la terminal
```

### El orden de carga, de más general a más específico

Cuando arranca una sesión, bash no lee un único archivo, sino varios, en un orden concreto, y entender ese orden explica por qué a veces un cambio "no se aplica" aunque esté bien escrito:

1. **`/etc/environment`**: variables de entorno globales para todo el sistema, para todos los usuarios. No es un script (no admite lógica de shell), solo asignaciones simples `CLAVE=valor`. Se lee al iniciar sesión, no en cada terminal nueva.
2. **`/etc/profile`** y los scripts en **`/etc/profile.d/*.sh`**: configuración global de shell de login, gestionada normalmente por el sistema o por paquetes instalados (no por ti a mano).
3. **`~/.bash_profile`**, o en su defecto **`~/.bash_login`**, o en su defecto **`~/.profile`** (bash solo lee el primero que encuentre, en ese orden): configuración de *login* específica de tu usuario.
4. **`~/.bashrc`**: se lee en cada shell interactiva **no** de login (cada terminal nueva que abres dentro de una sesión gráfica ya iniciada). Es habitual que `~/.bash_profile` incluya una línea que llama explícitamente a `~/.bashrc`, precisamente para que las variables definidas ahí también estén disponibles en la sesión de login.

> [!question] ¿Login o no-login? La distinción que confunde a todo el mundo
> Una shell de **login** es la que arranca al iniciar sesión (por ejemplo, al conectar por SSH, o la primera shell tras un login en consola). Una shell interactiva **no de login** es la que se abre después, como cada pestaña nueva de tu terminal gráfico. GNOME Terminal, Konsole o iTerm2 suelen abrir shells no-login por defecto, así que en el día a día es `~/.bashrc` el que casi siempre entra en juego, y `~/.bash_profile`/`~/.profile` solo se ejecuta al iniciar sesión en el sistema. Puedes comprobar en qué tipo de shell estás con `shopt login_shell`.

> [!tip] Guarda una copia antes de tocar variables importantes
> Si vas a modificar algo delicado como `PATH`, es buena práctica volcar su valor actual a un archivo antes de tocarlo: `echo $PATH > ~/path_backup.txt`. Así, si algo deja de funcionar, puedes restaurar el valor original sin tener que reconstruirlo de memoria.

## La variable PATH

`PATH` es la lista de directorios (separados por `:`) donde bash busca el binario correspondiente cada vez que escribes un comando. Si un ejecutable no está en ninguno de esos directorios, obtienes un error de "command not found" aunque el archivo exista en otra ruta.

```bash
echo $PATH
# /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

### Añadir una ruta correctamente

```bash
export PATH=$PATH:/home/ansango/mis-herramientas
```

La clave aquí es `$PATH:` al principio: estás diciendo "todo lo que ya había en PATH, más este directorio nuevo al final". Así conservas el acceso a `ls`, `grep`, `cd`, etc., y además ganas acceso directo a lo que haya en `mis-herramientas`, sin tener que estar en esa carpeta para ejecutarlo.

> [!note] El orden de PATH importa
> Bash recorre los directorios de `PATH` de izquierda a derecha y ejecuta el **primer** binario que encuentre con ese nombre, ignorando el resto. Si añades tu directorio al final (como en el ejemplo de arriba), un script tuyo llamado `ls` nunca se ejecutará en lugar del `/bin/ls` real, porque `/bin` aparece antes en la lista. Si en cambio lo antepones (`export PATH=/home/ansango/mis-herramientas:$PATH`), tu directorio pasa a tener prioridad, y un binario tuyo con el mismo nombre que uno del sistema *sí* se ejecutaría primero. Esto es exactamente lo que hacen ciertas técnicas de *PATH hijacking*: colocar un ejecutable malicioso con el nombre de un comando común en un directorio que aparezca antes en el `PATH` de la víctima.

> [!warning] Nunca antepongas `.` (el directorio actual) a tu PATH
> Añadir el directorio actual al PATH (`export PATH=.:$PATH`) es una práctica antigua y desaconsejada: haría que, al entrar en cualquier carpeta que contenga un archivo llamado igual que un comando habitual (`ls`, `cd`...), bash pudiera ejecutar ese archivo en lugar del comando real del sistema. Es un vector de ataque conocido desde hace décadas en sistemas Unix, y la razón por la que ningún PATH por defecto incluye `.`.

### El error más común: sobrescribir PATH

```bash
export PATH=/home/ansango/mis-herramientas
```

Esta versión, sin `$PATH:` delante, **reemplaza** el contenido completo de la variable. El resultado es que comandos básicos como `ls` o `cd` dejan de encontrarse, porque sus directorios (`/bin`, `/usr/bin`...) ya no forman parte de `PATH`:

```bash
ls
# bash: ls: command not found
```

> [!danger] Nunca reasignes PATH sin `$PATH:` delante
> Sobrescribir `PATH` en lugar de ampliarlo te puede dejar sin acceso a los comandos básicos del sistema en esa misma sesión. Si ocurre, normalmente basta con cerrar la terminal y abrir una nueva (el cambio no era permanente), pero si lo hiciste permanente en `.bashrc`, tendrás que editar el archivo desde otra sesión o con un editor externo para arreglarlo.

## Personalizar el prompt con PS1

El aspecto del prompt (`usuario@equipo:directorio $`) también es una variable de entorno, `PS1` (*Prompt String 1*), que admite marcadores especiales:

- `\u`: nombre del usuario actual
- `\h`: nombre del equipo (hostname)
- `\w`: directorio de trabajo actual completo; `\W` muestra solo el último componente de la ruta, sin todo el camino
- `\$`: muestra `$` para un usuario normal y `#` para root, útil para ver de un vistazo con qué privilegios estás operando

```bash
export PS1='\u@\h:\w\$ '     # formato clásico
export PS1='[\u] '           # prompt minimalista, solo el usuario
```

Como cualquier otra variable, si quieres que el prompt personalizado sea el de siempre, tienes que añadir la línea `export PS1='...'` a tu `~/.bashrc`, no solo ejecutarla en la sesión actual.

> [!example] Un prompt que imita el símbolo de sistema de Windows
> Nada impide poner literales fuera de los marcadores `\x`. Por ejemplo, para que el prompt se parezca al `cmd.exe` de Windows (útil como broma, o para confundir a alguien que mire por encima del hombro sobre qué sistema estás usando):
> ```bash
> export PS1='C:\w> '
> cd /tmp
> # C:/tmp>
> ```
> El cambio solo afecta a la sesión actual: cualquier terminal nuevo que abras seguirá teniendo el prompt por defecto hasta que hagas el `export` permanente en `~/.bashrc`.

> [!tip] PS1 con color
> `PS1` también admite secuencias de escape ANSI para colorear el prompt, algo muy habitual en configuraciones personalizadas (`\[\e[32m\]` para empezar en verde, `\[\e[0m\]` para volver al color por defecto). Los corchetes `\[` `\]` alrededor de la secuencia son importantes: le dicen a bash que ese fragmento no ocupa espacio visible, para que el cursor no se descoloque al mover el historial con las flechas.

## Crear tus propias variables

Puedes definir variables propias para simplificar comandos largos o guardar valores que reutilizas en scripts:

```bash
MI_VARIABLE="algún valor con espacios"
echo $MI_VARIABLE
# algún valor con espacios

export MI_VARIABLE       # la hace visible para procesos hijos de esta sesión
unset MI_VARIABLE         # la elimina por completo
```

> [!note] Los valores con espacios necesitan comillas
> Igual que con cualquier cadena en bash, si el valor contiene espacios hay que envolverlo entre comillas; de lo contrario, bash interpretará cada palabra como un argumento distinto y el resultado no será el esperado.

> [!danger] Piénsatelo dos veces antes de hacer `unset` de una variable del sistema
> `unset` no distingue entre una variable tuya y una variable crítica del sistema: `unset PATH`, por ejemplo, deja la sesión sin ninguna ruta de búsqueda de comandos, con el mismo efecto (o peor) que sobrescribir `PATH` por accidente. Antes de eliminar una variable que no hayas creado tú mismo, confirma con `echo $NOMBRE` que sabes exactamente qué contiene y qué la usa.

### Variables útiles para scripting

Aunque este capítulo se centra en variables de sesión interactiva, merece la pena saber que bash expone también variables especiales de solo lectura, muy usadas dentro de scripts (se retomarán con más detalle en la siguiente nota):

```bash
echo $$        # PID de la shell actual
echo $?        # código de salida del último comando ejecutado (0 = éxito)
echo $0        # nombre del script o de la shell en curso
echo $HOSTNAME # nombre del equipo, sin necesidad de llamar a `hostname`
```

`$?` en particular es la base de cualquier script que necesite comprobar si un comando anterior tuvo éxito antes de continuar, algo que verás constantemente en `if` y en operadores como `&&`/`||`.

## Próximos pasos

- [[09-bash-scripting|Bash scripting]]
