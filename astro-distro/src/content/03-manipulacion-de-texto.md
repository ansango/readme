---
title: Manipulación de texto
description: "Referencia rápida para mostrar, filtrar y modificar el contenido de archivos de texto en Linux: head, tail, nl, grep, sed, more y less"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, cheatsheet]
---

# Manipulación de texto

> [!abstract] Resumen
> En Linux, casi todo lo que administras a diario son archivos de texto: configuraciones, logs, scripts. Esta nota recoge las herramientas básicas para verlos por partes (`head`, `tail`, `nl`), filtrarlos (`grep`), modificarlos sin abrir un editor (`sed`) y navegar por archivos largos (`more`, `less`).

## Por qué importa manipular texto

La mayoría de los archivos de configuración de Linux son texto plano: para reconfigurar un servicio, basta con abrir su archivo de configuración, editar el texto, guardarlo y reiniciar el servicio. Esto hace que dominar unas pocas herramientas de manipulación de texto tenga un retorno enorme: se aplican por igual a un archivo de configuración de 5 líneas que a un log de 50.000.

Para los ejemplos de esta nota usaremos un archivo de configuración ficticio, `config.conf`, con varios cientos de líneas, como el que encontrarías en cualquier servicio real (por ejemplo, `/etc/nginx/nginx.conf` o `/etc/ssh/sshd_config`).

### Cuándo un editor de texto es mejor que la terminal

Todo lo que veremos aquí sirve para inspeccionar y hacer cambios puntuales sin salir de la terminal, algo imprescindible cuando trabajas por SSH contra un servidor remoto sin entorno gráfico. Pero cuando el cambio es más profundo (reescribir varias secciones, revisar con calma la sintaxis completa de un archivo), lo razonable es abrirlo con un editor de texto en condiciones: `vim` o `nano` en la propia terminal, o `gedit`/`kate` si tienes entorno gráfico. Las herramientas de esta nota (`grep`, `sed`, `head`, `tail`) son las que usarás para *localizar* rápidamente qué hay que cambiar; el editor es el que usarás para *hacer* el cambio con comodidad.

> [!tip]
> `nano` es el editor más amigable para quien empieza (los atajos aparecen en la parte inferior de la pantalla); `vim` tiene más curva de aprendizaje pero es casi universal: está preinstalado en prácticamente cualquier distribución y sistema Unix que te vayas a encontrar, lo que lo convierte en una habilidad rentable a medio plazo.

## Ver el principio y el final de un archivo

`cat` muestra el archivo entero de golpe, lo cual es poco práctico si el archivo tiene cientos o miles de líneas. Para casos así, `head` y `tail` muestran solo una porción.

### `head`: las primeras líneas

```bash
head config.conf        # primeras 10 líneas por defecto
head -20 config.conf    # primeras 20 líneas
```

### `tail`: las últimas líneas

```bash
tail config.conf        # últimas 10 líneas por defecto
tail -20 config.conf    # últimas 20 líneas
tail -f /var/log/syslog # sigue el archivo en tiempo real, mostrando nuevas líneas a medida que se añaden
```

> [!tip]
> `tail -f` es imprescindible para seguir logs en directo mientras reproduces un problema (por ejemplo, mientras reinicias un servicio que está fallando). Sal con Ctrl+C.

### `nl`: numerar líneas

Cuando un archivo tiene cientos de líneas, referenciar cambios por número de línea ahorra mucho tiempo:

```bash
nl config.conf
```

`nl` numera automáticamente cada línea no vacía, lo que facilita volver exactamente al mismo punto del archivo en conversaciones, documentación o comandos posteriores (por ejemplo, combinándolo con `tail -n+N` para saltar a una línea concreta).

> [!note] `nl` se salta las líneas en blanco
> A diferencia de `cat -n` (que numera literalmente todas las líneas, incluidas las vacías), `nl` por defecto no asigna número a las líneas en blanco. Esto es cómodo si quieres contar solo las líneas "con contenido real", pero puede ser confuso si luego intentas casar ese número de línea con lo que muestra tu editor de texto, que sí cuenta las vacías. Si necesitas que ambos coincidan, usa `cat -n config.conf` en su lugar.

## Filtrar contenido con `grep`

`grep` busca líneas que contienen un patrón determinado, tanto directamente sobre un archivo como sobre la salida de otro comando:

```bash
grep "output" config.conf              # busca directamente en el archivo
cat config.conf | grep "output"        # mismo resultado, vía tubería
grep -i "output" config.conf           # ignora mayúsculas/minúsculas
grep -n "output" config.conf           # muestra también el número de línea
grep -v "output" config.conf           # invierte la búsqueda: todo lo que NO contiene "output"
```

Combinado con `nl`, puedes localizar en qué línea exacta aparece algo antes de editarlo:

```bash
nl config.conf | grep "output"
#   34    # 6) Configure output plugins
#  512    # Step #6: Configure output plugins
```

> [!example] Ver el contexto alrededor de una coincidencia
> ```bash
> nl config.conf | grep output   # localizas la línea 512
> tail -n+507 config.conf | head -n 6   # muestras las 5 líneas anteriores + la línea 512
> ```
> `tail -n+507` empieza a mostrar desde la línea 507 en adelante, y `head -n 6` recorta el resultado a las 6 primeras líneas de ese fragmento. Es una forma rápida de inspeccionar el contexto de una coincidencia sin abrir un editor.

### El atajo moderno: `grep` con opciones de contexto

Encadenar `nl`, `grep`, `tail` y `head` es un buen ejercicio para entender cómo se combinan herramientas simples, pero en el día a día casi siempre es más rápido pedirle directamente a `grep` que muestre el contexto alrededor de la coincidencia:

```bash
grep -A 5 "output" config.conf     # la coincidencia + las 5 líneas posteriores (After)
grep -B 5 "output" config.conf     # la coincidencia + las 5 líneas anteriores (Before)
grep -C 5 "output" config.conf     # la coincidencia + 5 líneas antes y 5 después (Context)
grep -n -C 3 "output" config.conf  # igual, pero mostrando también el número de línea de cada una
```

> [!question] ¿Entonces para qué sirve la técnica de `nl` + `tail` + `head`?
> Sobre todo para cuando necesitas un rango de líneas muy concreto y asimétrico (por ejemplo, "las 3 líneas anteriores pero las 20 posteriores"), algo que `grep -A`/`-B` puede hacer combinando ambos flags, pero que resulta más intuitivo montar a mano con `tail -n+N | head -n M` cuando ya conoces el número exacto de línea de interés. En la práctica, para el caso general, `grep -C` es la opción más rápida y la que deberías usar primero.

## Buscar y reemplazar con `sed`

`sed` (*stream editor*) permite buscar patrones de texto y sustituirlos, funcionando de forma similar a un "buscar y reemplazar" pero desde la línea de comandos y sobre archivos completos:

```bash
sed s/mysql/MySQL/g config.conf > config2.conf
```

La sintaxis básica es `s/patrón_a_buscar/reemplazo/flags`:

- `s` indica que es una operación de sustitución.
- `g` (*global*) reemplaza todas las coincidencias de cada línea; si se omite, solo se sustituye la primera coincidencia de cada línea.
- Un número (por ejemplo, `s/mysql/MySQL/2`) sustituye únicamente la segunda coincidencia de cada línea.

> [!warning]
> Ten en cuenta que Linux distingue mayúsculas de minúsculas, así que `sed s/mysql/MySQL/g` no tocará las apariciones de `MYSQL` o `MySql`. Si necesitas ignorar mayúsculas, añade el flag `i`: `s/mysql/MySQL/gi`.

Por defecto, `sed` no modifica el archivo original: envía el resultado a la salida estándar. Para guardar el resultado hay que redirigirlo a un archivo nuevo (`> config2.conf`) o usar la opción `-i` para editar el archivo in situ.

```bash
sed -i s/mysql/MySQL/g config.conf   # modifica config.conf directamente, sin crear una copia
```

> [!danger]
> `sed -i` sobrescribe el archivo original sin pedir confirmación. Si el patrón de búsqueda es más amplio de lo que crees, puedes corromper una configuración en producción sin darte cuenta. Antes de usar `-i` sobre un archivo importante, haz una copia (`cp config.conf config.conf.bak`) o prueba primero sin `-i` para ver el resultado.

> [!tip] Copia de seguridad automática con `-i`
> `sed` admite un sufijo opcional junto a `-i` que crea automáticamente una copia del archivo original antes de modificarlo: `sed -i.bak s/mysql/MySQL/g config.conf` deja el resultado en `config.conf` y una copia intacta en `config.conf.bak`. Es un término medio razonable entre la comodidad de `-i` a secas y la seguridad de una copia manual previa.

### Más allá de sustituir: borrar e imprimir líneas concretas

`sed` no se limita al comando `s` de sustitución; también puede operar directamente sobre números o rangos de línea, lo cual es útil para tareas rápidas de edición sin abrir un editor:

```bash
sed '5d' config.conf              # muestra el archivo sin la línea 5 (d de delete)
sed '10,20d' config.conf          # elimina el rango de líneas 10 a 20
sed -n '15,25p' config.conf       # imprime SOLO las líneas 15 a 25 (p de print, -n silencia el resto)
sed '/^#/d' config.conf           # elimina todas las líneas que empiezan por # (comentarios)
```

> [!note]
> La opción `-n` combinada con `p` es el equivalente en `sed` a lo que `grep` hace con patrones de texto, pero aquí filtrando por posición o por una expresión regular en el propio patrón de búsqueda del comando `p`. Para filtrado por contenido, `grep` sigue siendo la herramienta más directa; `sed` gana cuando además necesitas modificar lo que encuentras.

## Ver archivos con `more` y `less`

`cat` no es práctico para archivos largos: los muestra enteros y de un tirón hasta el final. Para eso existen dos utilidades de paginación.

### `more`: paginado simple

```bash
more config.conf
```

Muestra el archivo página a página; pulsa Enter para avanzar línea a línea, espacio para avanzar página a página, y `q` para salir. En la esquina inferior izquierda indica qué porcentaje del archivo llevas visto.

### `less`: paginado con búsqueda

```bash
less config.conf
```

`less` hace todo lo que hace `more`, pero además permite desplazarte libremente hacia adelante y hacia atrás, y buscar texto dentro del archivo con `/patrón` (busca hacia adelante) o `?patrón` (busca hacia atrás). Pulsa `n` para saltar a la siguiente coincidencia y `q` para salir.

Otros atajos que merece la pena conocer dentro de `less`:

| Tecla | Acción |
|---|---|
| `espacio` | avanza una página |
| `b` | retrocede una página (*back*), algo que `more` no permite |
| `g` | salta al principio del archivo |
| `G` | salta al final del archivo |
| `n` / `N` | siguiente / anterior coincidencia de la última búsqueda |
| `q` | salir |

> [!tip]
> `less` puede abrir un archivo enorme casi al instante porque no lo carga entero en memoria de golpe, sino que va leyendo bajo demanda a medida que te desplazas. Esto lo hace mucho más práctico que `cat` o incluso que un editor de texto para inspeccionar logs de varios gigabytes.

> [!question] ¿`more`, `less` o `grep`?
> Usa `grep` cuando ya sabes exactamente qué línea buscas y solo quieres verla. Usa `less` cuando necesitas explorar un archivo largo con calma, buscando varios términos o navegando de un lado a otro. `more` tiene sentido sobre todo en sistemas muy antiguos o minimalistas donde `less` no esté instalado; en el día a día, `less` es casi siempre la mejor opción. De hecho, muchos sistemas modernos hacen que `more` sea en realidad un alias de `less` ejecutado en modo compatible, así que es posible que ya estés usando `less` sin saberlo.

## Próximos pasos

- [[04-analisis-y-gestion-de-redes|Análisis y gestión de redes]]: inspeccionar interfaces de red, cambiar tu IP y tu MAC, y resolver nombres de dominio con `dig`.
