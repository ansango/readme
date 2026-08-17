---
title: Automatización con cron
description: "Programar tareas periódicas con cron y crontab, sus atajos habituales, y cómo gestionar qué servicios arrancan junto con el sistema"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, cron]
---

# Automatización con cron

> [!abstract] Resumen
> `cron` es el daemon que ejecuta tareas de forma periódica según lo que definas en el `crontab`: backups nocturnos, rotación de logs, scripts de escaneo, lo que sea que quieras que corra sin que tengas que acordarte. Además de programar tareas repetitivas, veremos los scripts `rc` y los runlevels clásicos (y su relación con `systemd` hoy en día), y cómo decidir qué servicios arrancan junto con el sistema.

## El daemon cron y el crontab

`cron` (el daemon se llama `crond`) revisa constantemente una tabla de tareas —el **crontab**— para saber qué comando debe ejecutar y cuándo. Esa tabla tiene siete campos: los cinco primeros definen el momento de ejecución, el sexto el usuario que ejecuta la tarea, y el séptimo la ruta absoluta al comando o script.

| Campo | Unidad de tiempo | Valores |
|---|---|---|
| 1 | Minuto | 0-59 |
| 2 | Hora | 0-23 |
| 3 | Día del mes | 1-31 |
| 4 | Mes | 1-12 |
| 5 | Día de la semana | 0-7 (0 y 7 son domingo) |

```
M  H  DOM MON DOW USER  COMANDO
30 2  *   *   1-5 root  /root/mi_script.sh
```

Este ejemplo ejecuta `/root/mi_script.sh` como `root` a las 2:30, de lunes a viernes (`1-5`), cualquier día del mes y cualquier mes (los asteriscos significan "cualquiera").

> [!note]
> El asterisco (`*`) significa "todos los valores posibles" en ese campo. Para varios valores no contiguos se usan comas (`2,4` = martes y jueves); para un rango, un guion (`1-5` = lunes a viernes). Recuerda también que la hora usa formato de 24 horas: la 1 de la tarde es `13`.

### Editar el crontab

```bash
crontab -e   # abre tu crontab personal en el editor configurado (nano por defecto)
crontab -l   # lista las tareas programadas del usuario actual
```

La primera vez que ejecutas `crontab -e` en un sistema, te pregunta qué editor prefieres usar:

```
Select an editor. To change later, run 'select-editor'.
  1. /bin/nano        <---- easiest
  2. /usr/bin/vim.basic
  3. /usr/bin/vim.tiny
Choose 1-5 [1]:
```

Esa elección se guarda para las siguientes veces, así que solo tendrás que responder una vez por usuario. Como alternativa, nada te impide editar `/etc/crontab` directamente con tu editor de texto habitual (`nano /etc/crontab`, `vim /etc/crontab`...); la diferencia es que ese archivo, al ser el crontab del sistema, exige el campo de usuario en cada línea que `crontab -e` no pide en el crontab personal.

El crontab de todo el sistema vive en `/etc/crontab` y añade el campo de usuario que no tiene el crontab personal de cada usuario (`crontab -e` ya asume que la tarea corre como tú).

> [!example] Un `/etc/crontab` real
> Un `/etc/crontab` recién instalado ya trae tareas propias del sistema, útiles como referencia de sintaxis:
> ```
> SHELL=/bin/sh
> PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
>
> # m h dom mon dow user  command
> 17 *  *   *   *   root  cd / && run-parts --report /etc/cron.hourly
> 25 6  *   *   *   root  test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
> 47 6  *   *   7   root  test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )
> 52 6  1   *   *   root  test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )
> ```
> `run-parts` ejecuta, en orden, todos los scripts que encuentre dentro de un directorio (`/etc/cron.daily`, `/etc/cron.weekly`...). Es el mecanismo que usan muchos paquetes del sistema (logrotate, actualizaciones de índices, limpiezas varias) para engancharse a una periodicidad estándar sin tener que tocar el crontab directamente: basta con dejar caer un script ejecutable en la carpeta correspondiente.

> [!note] ¿Y `anacron`?
> Fíjate en el `test -x /usr/sbin/anacron || (...)` de las líneas diaria, semanal y mensual: si `anacron` está instalado, es él quien se encarga de ejecutar esos `run-parts`, y si no, cron los lanza directamente. La diferencia importa en portátiles y equipos que no están encendidos 24/7: `cron` asume que la máquina siempre está viva a la hora programada, así que si el equipo estaba apagado a esa hora la tarea simplemente no se ejecuta ese día. `anacron` lleva la cuenta de cuándo se ejecutó cada tarea por última vez y, si detecta que se ha "saltado" una ejecución, la lanza en cuanto el sistema vuelve a arrancar. Por eso las distros de escritorio combinan ambos: cron para la precisión horaria, anacron como red de seguridad para cuando la máquina estuvo apagada.

> [!example] Programar un backup
> ```
> # Backup cada domingo a las 2 de la madrugada
> 00 2 * * 0 backup /bin/systembackup.sh
>
> # Solo los días 15 y 30 de cada mes
> 00 2 15,30 * * backup /root/systembackup.sh
>
> # Todas las noches entre semana a las 23:00
> 00 23 * * 1-5 backup /root/systembackup.sh
> ```
> Tres variantes de la misma idea: frecuencia semanal, quincenal aproximada y diaria solo en días laborables. El usuario (`backup`) y la ruta del script son los mismos; lo único que cambia son los campos de tiempo.

### Combinar rangos de mes y de día de la semana

Los campos de mes y de día de la semana también admiten rangos y listas, lo que permite condiciones bastante específicas sin salir de una sola línea. Por ejemplo, para lanzar un escáner de reconocimiento solo los fines de semana de verano, a las 2 de la madrugada (para pasar más desapercibido en los logs de tráfico):

```
00 2 * 6-8 0,6 user /usr/share/miscanner.sh
```

`6-8` restringe el rango de meses a junio, julio y agosto, y `0,6` a domingo y sábado. La lectura completa sería: "a las 2:00, cualquier día del mes, entre junio y agosto, en sábado o domingo, ejecuta el script como `user`". Es un buen ejemplo de que los cinco campos son independientes entre sí: cada uno filtra su propia dimensión del tiempo, y cron solo ejecuta la tarea cuando **todos** los campos coinciden a la vez.

## Atajos habituales del crontab

En vez de rellenar los cinco campos a mano, `cron` admite unos atajos para los casos más comunes:

```
@reboot     # al arrancar el sistema
@yearly     # una vez al año (equivale a 0 0 1 1 *)
@annually   # igual que @yearly
@monthly    # una vez al mes
@weekly     # una vez a la semana
@daily      # una vez al día
@midnight   # igual que @daily
@noon       # a mediodía
```

```bash
# ejemplo: ejecutar un scanner cada noche a medianoche
@midnight   user   /usr/share/miscanner.sh

# ejemplo: arrancar un servicio propio nada más iniciar el sistema
@reboot     root   /root/mi_servicio.sh
```

> [!tip]
> `@reboot` es la forma más simple de tener un script corriendo justo después de arrancar, sin depender de runlevels ni de unidades de `systemd`: basta con añadir la línea al crontab del usuario que deba ejecutarlo.

| Atajo | Equivalente en los 5 campos |
|---|---|
| `@yearly` / `@annually` | `0 0 1 1 *` |
| `@monthly` | `0 0 1 * *` |
| `@weekly` | `0 0 * * 0` |
| `@daily` / `@midnight` | `0 0 * * *` |
| `@noon` | `0 12 * * *` |
| `@reboot` | (no tiene equivalente en los 5 campos: se dispara al arrancar `cron`, no en una fecha) |

> [!question] ¿Cuándo usar el atajo y cuándo los cinco campos?
> Para los casos exactos de la tabla, el atajo es más legible y evita errores de dedo en los campos numéricos. En cuanto necesitas algo que no encaje literalmente (por ejemplo, "todos los días laborables a medianoche" o "cada domingo a las 3 de la madrugada"), tienes que volver a los cinco campos: los atajos no admiten parámetros ni combinaciones.

## Scripts rc y runlevels

Antes de que `systemd` se generalizara, el arranque de Linux seguía un modelo heredado de **System V** (SysV init): tras inicializar el kernel y cargar sus módulos, el propio kernel lanzaba un único proceso en espacio de usuario con **PID 1**, llamado `init` (o `initd`). Ese proceso, y solo ese, era responsable de arrancar todo lo demás: era literalmente el padre de todos los procesos del sistema, directa o indirectamente.

`init` ejecutaba, en orden, los scripts que encontraba en `/etc/init.d/rc` según el **runlevel** activo en ese arranque. Un runlevel es, básicamente, un perfil que define qué conjunto de servicios debe estar corriendo:

| Runlevel | Significado |
|---|---|
| 0 | Apagar el sistema |
| 1 | Modo monousuario / mínimo (sin red) |
| 2-5 | Modos multiusuario (el contenido exacto depende de la distribución) |
| 6 | Reiniciar el sistema |

Cada runlevel determinaba qué servicios se arrancaban y cuáles no; por ejemplo, en runlevel 1 ni siquiera se levantaba la red, porque ese modo está pensado para tareas de mantenimiento con el mínimo posible corriendo. El runlevel por defecto de cada máquina se definía históricamente en `/etc/inittab`, el archivo de configuración que leía `init` nada más arrancar.

> [!note] De dónde viene todo esto
> El modelo SysV init (y sus runlevels numerados) proviene de Unix System V de los años 80. Cuando Linux adoptó ese esquema para gestionar el arranque, heredó también su vocabulario: de ahí que scripts, comandos y documentación de sistemas antiguos (y de mucho hardware *embedded* que sigue vivo hoy) hablen de "runlevel 3" o "runlevel 5" con total naturalidad.

### Adding Services to rc.d

Añadir o quitar un servicio de ese arranque se hacía con `update-rc.d`:

```bash
update-rc.d nombre_del_servicio defaults   # añade el servicio al arranque
update-rc.d nombre_del_servicio remove     # lo quita
```

> [!example] Comprobar el efecto de verdad, no solo confiar en el comando
> Antes de dar por hecho que un servicio arranca solo, conviene comprobarlo con `ps`. Por ejemplo, para que PostgreSQL esté siempre disponible (típico si depende de él Metasploit u otra herramienta):
> ```bash
> # 1. Comprobar que no está corriendo todavía
> ps aux | grep postgresql
> # root  3876  0.0  0.0  12720  964 pts/1  S+  grep postgresql   (solo aparece el propio grep)
>
> # 2. Añadirlo al arranque
> update-rc.d postgresql defaults
>
> # 3. Reiniciar y comprobar de nuevo
> ps aux | grep postgresql
> # postgresql  757  0.0  0.1  287636  25180 ?  S  /usr/lib/postgresql/9.6/bin/postgresql ...
> ```
> El script rc correspondiente ya lo arrancó por ti sin que tuvieras que ejecutar nada manualmente tras el reinicio.

### De runlevels a systemd targets

La mayoría de distribuciones modernas (Debian, Ubuntu, Fedora, Arch...) ya no usan runlevels ni scripts `rc` como mecanismo principal: los ha sustituido `systemd`, que organiza el arranque en **targets** en vez de runlevels numéricos. Un target es, en esencia, la misma idea que un runlevel —un conjunto de servicios y dependencias que deben estar activos— pero declarado de forma explícita como una unidad más de `systemd`, con dependencias entre unidades que el propio `systemd` resuelve en paralelo (una de las razones por las que el arranque con `systemd` suele ser más rápido que con `init` secuencial).

Para no romper toda la documentación y todos los scripts que durante décadas asumieron runlevels numéricos, `systemd` mantiene una tabla de alias de compatibilidad:

| Runlevel clásico | Target de `systemd` equivalente |
|---|---|
| 0 | `poweroff.target` |
| 1 | `rescue.target` |
| 2-4 | `multi-user.target` (sin distinción real entre ellos) |
| 5 | `graphical.target` |
| 6 | `reboot.target` |

```bash
systemctl get-default          # target por defecto del sistema (equivalente al runlevel de arranque)
systemctl isolate multi-user.target   # cambia "en caliente" al equivalente del runlevel 3
runlevel                       # sigue funcionando: muestra el runlevel "traducido" desde el target actual
```

> [!note]
> Conocer el modelo `rc`/runlevel sigue siendo útil por dos motivos muy prácticos: para entender sistemas antiguos o *embedded* que todavía corren SysV init de verdad, y porque los propios targets de `systemd` reciben esos alias (`runlevel3.target` como symlink a `multi-user.target`, por ejemplo), así que el vocabulario clásico nunca desapareció del todo, solo cambió de implementación por debajo.

## Gestionar qué arranca con el sistema

Con `systemd`, el equivalente directo a `update-rc.d` es:

```bash
systemctl enable nombre.service    # arranca el servicio en cada boot
systemctl disable nombre.service   # deja de arrancarlo automáticamente
systemctl status nombre.service    # comprueba si está activo ahora mismo
```

`systemctl enable` no arranca el servicio de inmediato: solo crea el enlace simbólico que hace que la unidad se active la próxima vez que se alcance el target del que depende. Si además quieres que arranque ya, en la sesión actual, combínalo con `start`:

```bash
systemctl enable --now nombre.service   # lo activa para el próximo boot Y lo arranca ahora mismo
```

Si prefieres una interfaz visual en vez de recordar nombres de unidades, en sistemas basados en `rc` puedes usar una herramienta como `rcconf`:

```bash
apt install rcconf
rcconf
```

Se abre un menú de texto donde marcas con la barra espaciadora los servicios que quieres que arranquen con el sistema (por ejemplo, una base de datos que necesites siempre disponible) y confirmas con `Ok`.

> [!tip]
> Antes de activar un servicio para que arranque siempre, comprueba si de verdad lo necesitas en cada boot o si te basta con arrancarlo puntualmente (`systemctl start nombre.service` o el propio comando del servicio). Cuantos menos servicios arranquen por defecto, menor la superficie de ataque y más rápido el arranque. Esto aplica igual de bien tanto si administras un servidor propio como si estás valorando qué servicios de un sistema objetivo podrías deshabilitar (o, según el caso, activar de forma persistente) durante una auditoría.

## Próximos pasos

- [[18-python-fundamentos|Python: fundamentos]]: deja atrás bash para scripts más complejos y aprende los fundamentos de Python aplicados a la administración de sistemas.
