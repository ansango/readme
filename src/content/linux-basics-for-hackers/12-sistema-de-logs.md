---
title: Sistema de logs
description: "Cómo funciona el demonio rsyslog, su archivo de configuración y reglas de logging, la rotación de logs con logrotate, y por qué entender este mecanismo es clave para auditar y defender un sistema"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, forense]
---

# Sistema de logs

> [!abstract] Resumen
> Los logs son el registro de lo que le ha pasado a un sistema: errores, accesos, arranques de servicios, alertas de seguridad. Esta nota explica cómo `rsyslog` decide qué se registra y dónde, cómo `logrotate` evita que esos registros llenen el disco, y por qué entender el mecanismo de logging (incluyendo cómo se puede manipular) es una competencia básica de administración y forense, no una receta para saltarse controles ajenos.

## El demonio rsyslog

La mayoría de distribuciones basadas en Debian (Kali incluida) usan `rsyslog` como demonio de logging: un proceso en segundo plano que recibe mensajes de otros programas y del propio kernel, y decide, según un conjunto de reglas, qué hacer con cada uno (normalmente, escribirlo en un archivo de `/var/log`).

Puedes localizar todos los archivos relacionados con `rsyslog` en tu sistema con:

```bash
locate rsyslog
# /etc/rsyslog.conf
# /etc/rsyslog.d
# /etc/logrotate.d/rsyslog
# /etc/init.d/rsyslog
```

El archivo que de verdad importa para entender el comportamiento del sistema es `/etc/rsyslog.conf`.

## El archivo de configuración

`/etc/rsyslog.conf` es un archivo de texto plano, como casi toda la configuración en Linux. Se divide en secciones: módulos que carga el demonio, directivas globales y, la parte más relevante, las **reglas** de logging.

```bash
# /etc/rsyslog.conf (fragmento)
module(load="imuxsock")   # soporte de logging local del sistema
module(load="imklog")     # soporte de logging del kernel
```

## Las reglas de logging

Cada regla tiene el mismo formato:

```
facility.priority    acción
```

- **`facility`** identifica el subsistema que genera el mensaje.
- **`priority`** filtra por gravedad.
- **`acción`** indica el destino, normalmente un archivo dentro de `/var/log`.

### Facilities disponibles

| Facility | Qué registra |
|---|---|
| `auth`, `authpriv` | Mensajes de seguridad y autorización (logins, `sudo`, `su`...) |
| `cron` | El propio demonio de tareas programadas (`cron`/`crond`) |
| `daemon` | Otros demonios del sistema sin facility propia |
| `kern` | Mensajes generados por el propio kernel |
| `lpr` | El sistema de impresión |
| `mail` | El sistema de correo |
| `user` | Mensajes genéricos a nivel de usuario |
| `*` | Todas las facilities a la vez |

Puedes combinar varias facilities en una misma regla separándolas por comas, como en `auth,authpriv.*`.

### Prioridades, de menor a mayor gravedad

```
debug → info → notice → warning → err → crit → alert → emerg
```

Al especificar una prioridad en una regla, se registran los mensajes de esa prioridad **y todas las superiores** — por ejemplo, `kern.crit` captura mensajes `crit`, `alert` y `emerg`, pero ignora los de `warning` o inferiores. Un asterisco como prioridad (`kern.*`) captura absolutamente todo lo que genere esa facility, sin filtrar por gravedad.

> [!warning]
> Los códigos `warn`, `error` y `panic` existen por compatibilidad histórica pero están marcados como obsoletos (*deprecated*) en favor de `warning`, `err` y `emerg` respectivamente. Si ves alguno de los antiguos en un `rsyslog.conf` heredado, es candidato a actualizar.

Ejemplos reales tal y como aparecen en el archivo por defecto:

```bash
auth,authpriv.*             /var/log/auth.log
*.*;auth,authpriv.none      -/var/log/syslog
daemon.*                    -/var/log/daemon.log
kern.*                      -/var/log/kern.log
lpr.*                       -/var/log/lpr.log
mail.*                      -/var/log/mail.log
user.*                      -/var/log/user.log
```

> [!note]
> El guion (`-`) delante de la ruta de algunos destinos (por ejemplo `-/var/log/kern.log`) le dice a `rsyslog` que no fuerce una escritura sincrónica a disco tras cada mensaje, por rendimiento — a cambio, en un corte de luz muy puntual podrías perder el último mensaje que no llegó a escribirse. Es un compromiso deliberado entre rendimiento y durabilidad que rara vez importa fuera de discos ya muy exigidos.

La segunda línea (`*.*;auth,authpriv.none`) merece explicarse aparte: registra en `/var/log/syslog` todos los mensajes de todas las facilities y prioridades (`*.*`), **excepto** los de `auth` y `authpriv` (`auth,authpriv.none`), que ya tienen su propio destino en la línea anterior. Es el patrón habitual para evitar duplicar en el log general lo que ya vive en un log especializado.

### Más ejemplos de reglas personalizadas

```bash
mail.*              /var/log/mail          # todo el tráfico de mail, cualquier prioridad
kern.crit           /var/log/kernel        # solo kernel de gravedad crítica o superior
*.emerg             :omusrmsg:*            # cualquier emergencia se envía además a todas las sesiones abiertas
```

La última regla usa la acción especial `:omusrmsg:*`, que en lugar de escribir en un archivo envía el mensaje directamente a la terminal de todos los usuarios conectados — reservado, como su nombre indica, para emergencias que alguien debe ver ya.

> [!note]
> La ausencia de mensajes en un log no siempre significa que "no ha pasado nada": puede significar que ninguna regla capturaba esa facility o prioridad. Al auditar un sistema, revisa siempre `rsyslog.conf` antes de asumir que un log está completo.

> [!tip]
> Muchas distribuciones modernas (Ubuntu, Fedora, Arch...) usan `systemd-journald` como capa adicional o sustituta de `rsyslog`, consultable con `journalctl` en lugar de (o además de) leer archivos en `/var/log`. Kali, al ser Debian, sigue centrada en `rsyslog` con archivos de texto plano, pero si trabajas contra un objetivo con `systemd`, `journalctl -xe` o `journalctl -u <servicio>` es el equivalente que deberías conocer.

## Rotación de logs con logrotate

Un log que crece sin control acaba llenando el disco; uno que se borra demasiado pronto te deja sin rastro cuando lo necesitas para investigar un problema. `logrotate` resuelve ese equilibrio archivando periódicamente los logs (renombrándolos y comprimiéndolos) y empezando un archivo nuevo y vacío.

Su configuración vive en `/etc/logrotate.conf`, y de hecho ya está en marcha por defecto en cualquier instalación: un `cron` diario invoca `logrotate` sin que tengas que configurar nada para empezar a beneficiarte de la rotación.

```bash
# /etc/logrotate.conf (fragmento)
weekly          # unidad de tiempo por defecto: semanal
rotate 4        # conserva 4 periodos de logs antiguos
create          # crea un archivo de log nuevo tras rotar
#compress       # descomenta para comprimir los logs rotados
include /etc/logrotate.d
```

Con esta configuración por defecto, `/var/log/auth.log` va generando `auth.log.1`, `auth.log.2`, `auth.log.3` y `auth.log.4` a medida que rota; al llegar al quinto ciclo, el más antiguo (`auth.log.4`) se descarta en lugar de pasar a `auth.log.5`, que nunca llega a crearse.

> [!tip]
> Si necesitas conservar logs más tiempo para una investigación o auditoría (por ejemplo, cumplimiento normativo), sube el valor de `rotate` — `rotate 26` conserva unos seis meses con rotación semanal, `rotate 52` un año. Si el disco es limitado, baja ese valor o activa `compress`.

### Reglas específicas por servicio en logrotate.d

`/etc/logrotate.conf` fija el comportamiento por defecto, pero cada paquete instalado suele añadir su propia regla dentro de `/etc/logrotate.d/`, sobrescribiendo esos valores para el log que le interesa. Un ejemplo más completo, con las directivas que de verdad se usan en producción:

```bash
# /etc/logrotate.d/miapp
/var/log/miapp/*.log {
    daily                   # rota a diario en vez de semanalmente
    missingok               # no da error si el archivo de log no existe
    rotate 14                # conserva 14 días
    compress                # comprime los logs ya rotados (genera .gz)
    delaycompress           # pero no comprime el más reciente, por si algo lo sigue leyendo
    notifempty              # no rota si el log está vacío
    create 0640 root adm    # crea el nuevo log con estos permisos y propietario
    dateext                 # nombra los rotados como auth.log-20260711 en vez de .1, .2...
    sharedscripts
    postrotate
        systemctl reload miapp >/dev/null 2>&1 || true
    endscript
}
```

- `missingok` y `notifempty` evitan errores y rotaciones inútiles cuando el servicio lleva poco tiempo instalado o no ha generado tráfico.
- `delaycompress` es importante para servicios que mantienen el descriptor de archivo abierto un rato tras la rotación: comprimir de inmediato podría truncar líneas que el proceso todavía está escribiendo.
- `postrotate` / `endscript` ejecuta un comando justo después de rotar — típicamente para que el servicio reabra su archivo de log nuevo en lugar de seguir escribiendo en el que acaba de renombrarse.
- `dateext` sustituye el sufijo numérico (`.1`, `.2`...) por la fecha (`-20260711`), mucho más legible al buscar el log de un día concreto durante una investigación.

> [!note]
> Consulta siempre `man logrotate` antes de tocar la configuración de un servicio de producción: la lista completa de directivas es larga (`maxsize`, `minsize`, `olddir`, `su`...) y cada una afecta a un compromiso distinto entre espacio en disco, rendimiento y disponibilidad del rastro para una investigación posterior.

## Por qué entender la manipulación de logs importa (sin cruzar la línea)

Los mismos mecanismos que acabas de ver — reglas de `rsyslog`, rotación con `logrotate`, permisos sobre `/var/log` — son exactamente lo que un atacante intentaría manipular para borrar su rastro, y exactamente lo que un analista forense o un administrador necesita entender para detectar esa manipulación. Conocer el mecanismo en ambas direcciones (cómo se genera un log y cómo se podría alterar o eliminar) es lo que te permite:

- **Defender**: saber qué archivos y permisos proteger, y detectar si `rsyslog` se ha detenido o si un log tiene huecos temporales sospechosos.
- **Hacer forense**: reconocer cuándo un log ha sido truncado, sobrescrito o "limpiado" de forma no natural.
- **Depurar**: diagnosticar por qué cierto evento no aparece donde lo esperabas (regla mal configurada, servicio caído, rotación agresiva).

En la práctica, esto se traduce en comandos muy concretos: parar el demonio de logging (`service rsyslog stop`) corta la generación de nuevos registros; y una herramienta como `shred` sobrescribe repetidamente el contenido de un archivo antes de borrarlo, dificultando su recuperación forense frente a un simple `rm` (que solo libera el espacio, sin destruir el contenido hasta que se sobrescribe).

### Por qué rm no basta y qué hace shred

Cuando `rm` borra un archivo, en realidad solo elimina la entrada que lo referencia en el sistema de archivos y marca esos bloques como libres para reutilizarse — el contenido en sí sigue físicamente en el disco hasta que otro archivo lo sobrescribe, exactamente el mismo principio que hace útil a `dd` en el análisis forense (ver la nota de [[10-compresion-y-archivado|compresión y archivado]]). Un investigador con las herramientas adecuadas puede recuperar un archivo "borrado" con `rm` sin demasiado esfuerzo.

`shred` ataca ese problema de raíz: sobrescribe el contenido del archivo varias veces con patrones de datos antes de eliminarlo, para que no quede nada recuperable en esos bloques.

```bash
shred --help                     # revisa las opciones disponibles antes de usarlo
shred -f -n 10 /var/log/auth.log.*
```

- `-f` (*force*) cambia los permisos del archivo si hace falta para poder sobrescribirlo.
- `-n 10` indica el número de pasadas de sobrescritura (por defecto son 4); más pasadas dificultan más la recuperación, a costa de tardar más en archivos grandes.
- El comodín `auth.log.*` aplica la operación tanto al log activo como a todas sus copias rotadas por `logrotate` (`auth.log.1`, `auth.log.2`...) — de nada serviría destruir el log actual si las copias rotadas siguen intactas.

> [!note]
> `shred` por defecto no borra el archivo tras sobrescribirlo (solo destruye su contenido); si quieres además eliminarlo del directorio, añade la opción `-u`. Ten en cuenta también que en sistemas de archivos con journaling (como `ext4`) o en SSDs con *wear leveling*, `shred` no garantiza una destrucción tan completa como en discos mecánicos con `ext2`, porque el propio sistema de archivos o el firmware del disco pueden mantener copias de los datos en otros bloques sin que `shred` llegue a tocarlos.

> [!warning]
> Detener el logging o borrar/sobrescribir logs en un sistema que no es tuyo, o para el que no tienes autorización explícita, es ilegal en la gran mayoría de jurisdicciones y constituye destrucción de evidencia. El valor de conocer estos mecanismos está en poder auditarlos, protegerlos y reconocer cuándo alguien los ha usado en tu contra — no en aplicarlos sobre sistemas ajenos. Si trabajas en pentesting o respuesta a incidentes, hazlo siempre dentro de un contrato o autorización explícita que cubra este tipo de acciones.

## Próximos pasos

- [[13-servicios-apache-ssh-mysql|Servicios: Apache, SSH y MySQL]]: cómo arrancar, parar y configurar los servicios más habituales de un sistema Linux.
