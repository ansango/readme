---
title: Gestión de procesos
description: "Ver, filtrar y priorizar procesos con ps, top, nice y renice, terminarlos con kill, moverlos a segundo/primer plano con & y bg/fg, y planificar su ejecución con at"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, procesos]
---

# Gestión de procesos

> [!abstract] Resumen
> Un proceso es simplemente un programa en ejecución. En un momento dado, un sistema Linux tiene cientos de procesos activos, y saber inspeccionarlos (`ps`, `top`), priorizarlos (`nice`, `renice`), terminarlos (`kill`) y moverlos entre primer y segundo plano es una habilidad básica de cualquier administrador. También veremos cómo planificar la ejecución de un proceso para un momento futuro.

## Ver procesos con ps

`ps` sin argumentos solo muestra los procesos lanzados desde la terminal actual, lo cual es poco útil casi siempre:

```bash
ps
#   PID TTY      TIME CMD
# 39659 pts/0 00:00:01 bash
# 39665 pts/0 00:00:00 ps
```

Para ver todos los procesos del sistema, de todos los usuarios, se usa la combinación de opciones `aux` (sin guion delante, y en minúsculas: Linux distingue mayúsculas):

```bash
ps aux
# USER   PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
# root     1  0.0  0.4 202540  6396 ?    Ss   abr24   0:46 /sbin/init
# root  1234  2.1  1.8  45000 12000 ?    S    10:03   0:05 nginx
```

Las columnas más útiles son `USER` (quién lanzó el proceso), `PID` (su identificador único), `%CPU` y `%MEM` (consumo de recursos) y `COMMAND` (el nombre del proceso). El **PID** es lo importante para actuar sobre un proceso: casi todos los comandos de este documento lo piden como argumento en lugar del nombre, porque el kernel asigna los PID de forma secuencial y única, mientras que el nombre del proceso (`COMMAND`) puede repetirse decenas de veces en la misma máquina.

`ps aux` tiene más columnas de las que parece a simple vista, y merece la pena conocerlas porque son las mismas que usa `top`:

| Columna | Significado |
|---|---|
| `VSZ` | Memoria virtual reservada por el proceso, en KB (incluye memoria que quizá nunca llegue a usar) |
| `RSS` | Memoria física (RAM) que el proceso está usando realmente ahora mismo |
| `TTY` | Terminal asociada al proceso, o `?` si no tiene ninguna (procesos de sistema o demonios) |
| `STAT` | Código de estado del proceso (ver tabla siguiente) |
| `START` | Cuándo se lanzó el proceso |

### Estados de un proceso: la columna STAT

| Código | Significado |
|---|---|
| `R` | Running: en ejecución o en cola para ejecutarse |
| `S` | Sleeping: esperando un evento (entrada de teclado, red...) para continuar |
| `D` | Sleeping ininterrumpible: normalmente esperando E/S de disco; no responde a señales mientras dura |
| `T` | Detenido (stopped), por ejemplo tras un `Ctrl+Z` |
| `Z` | Zombie: el proceso ya ha terminado pero sigue en la tabla de procesos |
| `<` | Prioridad alta (proceso "no amable") |
| `N` | Prioridad baja (proceso "amable") |
| `+` | El proceso está en primer plano en su terminal |

> [!example] Procesos zombie y procesos huérfanos
> Un proceso **zombie** (`Z`) es un proceso que ya ha terminado de ejecutarse, pero cuyo proceso padre todavía no ha leído su código de salida con `wait()`. El proceso zombie no consume CPU ni memoria real: solo ocupa una entrada en la tabla de procesos hasta que el padre la recoge. Si ves muchos procesos en estado `Z`, normalmente indica un bug en el programa padre que no gestiona bien el ciclo de vida de sus hijos; no se pueden "matar" con `kill` porque técnicamente ya están muertos, la única forma de limpiarlos es que el padre los recoja o termine él mismo.
>
> Un proceso **huérfano**, en cambio, es un proceso cuyo padre ha terminado *antes* que él. En Linux, en cuanto esto ocurre, el proceso huérfano es automáticamente adoptado por `init` (PID 1) o por `systemd`, que se convierte en su nuevo padre y se encarga de recoger su código de salida cuando finalmente termine. Puedes comprobar esta adopción mirando la columna `PPID` de `ps -ef`: un proceso huérfano de mucho tiempo suele tener `PPID 1`.

### Filtrar procesos por nombre

La salida de `ps aux` en un sistema real es larguísima, así que casi siempre se combina con `grep`:

```bash
ps aux | grep nginx
```

Esto filtra la lista completa y solo muestra las líneas que contienen "nginx" (incluyendo, como efecto colateral, el propio proceso `grep` que acabas de lanzar, que también aparecerá en el resultado, porque su línea de comando contiene literalmente la palabra "nginx"). Es un detalle menor pero que confunde la primera vez: si ves un resultado de más y no reconoces qué proceso es, comprueba si no es simplemente tu propio `grep`.

> [!tip] Filtrar consumo de recursos, no solo nombre
> Si lo que buscas es qué proceso concreto está consumiendo más CPU o memoria (por ejemplo, para investigar Metasploit u otra herramienta pesada que hayas lanzado), fíjate en las columnas `%CPU` y `%MEM` de la línea filtrada: un `msfconsole` puede perfectamente estar usando un 30-40% de CPU y un 15% de memoria en una máquina modesta, así que no te sorprendas si algunas herramientas de seguridad son así de exigentes.

## Monitorizar en tiempo real con top

Mientras que `ps` da una foto fija en el momento de ejecutarlo, `top` muestra los procesos en una vista que se refresca automáticamente (cada 3 segundos por defecto) y los ordena por consumo de recursos, de mayor a menor:

```bash
top
```

Antes de mostrar la lista de procesos, la cabecera de `top` ya te da un resumen del estado global del sistema: cuántas tareas hay en cada estado (`running`, `sleeping`, `stopped`, `zombie`), el porcentaje de CPU repartido entre uso de usuario/sistema/inactivo, y la memoria y swap usados. Es lo primero que conviene mirar cuando sospechas que el sistema va lento: por ejemplo, un valor alto de `wa` (I/O wait) suele indicar un cuello de botella de disco, no de CPU.

Dentro de `top`, algunas teclas interactivas útiles:

- `q` para salir
- `h` o `?` para ver la ayuda de atajos
- `k` para matar un proceso (te pedirá el PID y, opcionalmente, la señal)
- `r` para cambiar la prioridad (`renice`) de un proceso (te pedirá el PID y el nuevo valor de *nice*)

> [!tip] `top` para vigilar, `ps` para consultar puntualmente
> Si sospechas que algo está consumiendo recursos de forma anómala, deja `top` abierto en una terminal mientras trabajas: verás en tiempo real qué proceso empieza a acaparar CPU o memoria. `ps aux`, en cambio, es más útil cuando ya sabes qué proceso buscas y solo quieres su PID rápido, por ejemplo dentro de un script.

## Prioridad de los procesos: nice y renice

El kernel decide cuánta CPU recibe cada proceso, pero puedes influir en esa decisión con un valor de "amabilidad" (*niceness*) que va de **-20** (máxima prioridad, "nada amable" con el resto) a **+19** (mínima prioridad, muy "amable"). El valor por defecto es 0. La idea detrás del nombre es literal: cuanto más bajo el valor, menos "amable" eres con el resto de procesos porque acaparas más recursos; cuanto más alto, más cedes tu turno de CPU a los demás.

Un detalle importante que se pierde fácilmente de vista: **un proceso hijo hereda el valor nice de su proceso padre** en el momento de arrancar. Si lanzas una shell con prioridad baja y desde ella arrancas nuevos procesos, todos partirán con esa misma prioridad heredada, salvo que la cambies explícitamente.

### Al arrancar un proceso: nice

```bash
nice -n 10 ./script_lento.sh    # arranca con prioridad más baja (más "amable")
nice -n -10 ./script_urgente.sh # arranca con prioridad más alta (requiere privilegios de root para valores negativos)
```

`nice` toma un valor **relativo** que se suma al nice por defecto (0) del proceso que arranca. Cualquier usuario puede bajar su propia prioridad (subir el nice), pero solo `root` puede pedir valores negativos, es decir, subir la prioridad por encima de la de cualquier otro usuario.

### Sobre un proceso ya en marcha: renice

```bash
renice 19 -p 6996    # fija la prioridad del proceso con PID 6996 al valor absoluto 19
```

A diferencia de `nice`, `renice` recibe un valor **absoluto**, no un incremento, y actúa sobre el PID de un proceso que ya está corriendo, no sobre su nombre. Cualquier usuario puede bajar la prioridad de sus propios procesos, pero solo `root` puede subirla por encima de 0.

También puedes hacer lo mismo sin salir de `top`: con `top` abierto, pulsa `r`, introduce el PID del proceso que quieres repriorizar y a continuación el nuevo valor de nice. Es más rápido que abrir otra terminal cuando ya tienes `top` corriendo para vigilar el sistema.

## Terminar procesos con kill

`kill` envía una señal a un proceso identificado por su PID. Linux define 64 señales distintas, cada una con un significado propio, aunque en el día a día solo usarás un puñado de ellas. La señal por defecto, si no especificas ninguna, es `SIGTERM` (15), que pide al proceso que termine de forma ordenada.

| Señal | Número | Qué hace |
|---|---|---|
| `SIGHUP` | 1 | Recarga el proceso (lo detiene y reinicia con el mismo PID) |
| `SIGINT` | 2 | Interrupción "suave", no siempre se respeta |
| `SIGQUIT` | 3 | Termina el proceso y vuelca su memoria a un archivo `core` en el directorio actual, útil para depurar qué estaba haciendo el proceso en el momento de morir |
| `SIGTERM` | 15 | Señal de terminación por defecto de `kill` |
| `SIGKILL` | 9 | Terminación forzosa e inmediata, sin margen para limpiar recursos |

```bash
kill 6996           # pide al proceso que termine (SIGTERM)
kill -9 6996         # lo fuerza a terminar de inmediato (SIGKILL)
killall firefox      # termina por NOMBRE en lugar de por PID (mata todos los procesos que coincidan)
```

> [!warning] `kill -9` es el último recurso, no el primero
> `SIGKILL` no da oportunidad al proceso de cerrar archivos abiertos, liberar recursos o guardar su estado: lo detiene en seco, enviando sus recursos directamente al dispositivo nulo (`/dev/null`). Prueba primero con `kill` (SIGTERM) y reserva `-9` para procesos que no responden a la señal normal, como un proceso "rogue" (fuera de control) que se ha quedado colgado ignorando cualquier petición ordenada de cierre.

## Segundo plano y primer plano

Cuando trabajas desde la terminal (o incluso desde una aplicación gráfica, que en Linux también se ejecuta dentro de una shell subyacente), cada comando que lanzas ocupa esa terminal hasta que termina: no puedes escribir el siguiente comando hasta que el anterior devuelve el control. Para procesos largos o interactivos que no quieres bloqueando tu única terminal disponible, puedes enviarlo a segundo plano.

### Lanzar directamente en segundo plano

```bash
./script_largo.sh &     # el & al final lanza el proceso en background
# [1] 6996
```

La terminal devuelve el control inmediatamente y muestra entre corchetes el número de job y su PID. A partir de ahí puedes seguir usando la misma terminal para otras tareas mientras `script_largo.sh` sigue ejecutándose por su cuenta. Este patrón es especialmente útil cuando trabajas con varias herramientas a la vez (un escáner de puertos en background mientras preparas un exploit en primer plano, por ejemplo) sin gastar una terminal distinta para cada una.

### Mover procesos entre plano de fondo y primer plano

```bash
jobs             # lista los procesos en segundo plano de la sesión actual
bg %1            # reanuda en segundo plano un proceso que estaba parado
fg %1            # trae un proceso de segundo plano al primer plano
```

`fg` es especialmente útil si lanzaste algo sin `&` y necesitas recuperar el control de la terminal para otra cosa: puedes pausarlo con `Ctrl+Z` (queda en estado `T`, detenido) y luego decidir si continuarlo con `bg` (sigue ejecutándose, pero en segundo plano) o con `fg` (vuelve al primer plano exactamente donde lo dejaste). Si no recuerdas el PID de un proceso que quieres traer a primer plano, `ps` te lo da; `jobs` en cambio te da el número de job relativo a la sesión actual, que es justo lo que espera `bg`/`fg` con el prefijo `%`.

## Planificar la ejecución de procesos

Para ejecutar algo en un momento futuro sin tener que estar pendiente, Linux ofrece principalmente dos mecanismos:

- **`at`**: para programar una ejecución única en un momento concreto, gestionada por el demonio `atd`.
- **`cron`** (el demonio `crond`): para tareas recurrentes (cada día, cada semana...), pensado para automatizaciones permanentes.

Un uso básico de `at`:

```bash
at 23:00
at> /home/ansango/backup.sh
at> <Ctrl+D>
```

`at` entra en modo interactivo, te deja escribir uno o varios comandos, y los ejecuta en el momento indicado. Cuando termines de introducir comandos, `Ctrl+D` cierra el modo interactivo y confirma la programación.

`at` acepta una notación de horas bastante flexible, lo cual es cómodo porque no siempre quieres pensar en formato de 24 horas:

| Formato | Significado |
|---|---|
| `at 7:20pm` | Hoy a las 19:20 |
| `at noon` | Hoy al mediodía |
| `at 7:20pm June 25` | El 25 de junio a las 19:20 |
| `at tomorrow` | Mañana, a la misma hora actual |
| `at now + 20 minutes` | Dentro de 20 minutos |
| `at now + 3 days` | Dentro de 3 días |
| `at now + 3 weeks` | Dentro de 3 semanas |

> [!note] `at` para "una vez", `cron` para "siempre"
> Si necesitas que algo se repita periódicamente (una copia de seguridad semanal, una limpieza de logs diaria, o —pensando como atacante— un script de reconocimiento que compruebe puertos abiertos en un objetivo cada cierto tiempo), `cron` es la herramienta adecuada; `at` está pensado para una ejecución puntual y no persiste más allá de esa vez. La sintaxis de `crontab` se trata con más detalle en la nota dedicada a automatización de tareas.

> [!tip] `at` como herramienta discreta
> Programar una tarea con `at` para que se ejecute de madrugada, o mientras el propietario de un sistema está fuera, es una técnica habitual tanto para tareas legítimas de administración (backups nocturnos) como en escenarios de pentesting, donde interesa que un script de reconocimiento se ejecute en un momento de baja actividad del objetivo, minimizando la probabilidad de que alguien lo note en tiempo real.

## Próximos pasos

- [[08-variables-de-entorno|Variables de entorno]]
