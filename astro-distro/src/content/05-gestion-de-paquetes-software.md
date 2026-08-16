---
title: Gestión de paquetes de software
description: "Instalar, actualizar y eliminar software en distribuciones basadas en Debian con apt, añadir repositorios en sources.list e instalar herramientas directamente desde git"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, package-manager]
---

# Gestión de paquetes de software

> [!abstract] Resumen
> En distribuciones basadas en Debian (Ubuntu, Kali, Mint...) el gestor de paquetes por defecto es **apt**. Con él buscas, instalas, actualizas y eliminas software, y puedes ampliar de dónde descarga paquetes editando `/etc/apt/sources.list`. Cuando el software que necesitas no está empaquetado, las alternativas son un instalador gráfico o clonarlo directamente desde `git`.

## apt: el gestor de paquetes de Debian/Ubuntu

Un paquete no es solo el programa: incluye también sus dependencias (librerías que necesita para funcionar) y los scripts que automatizan la instalación. `apt` se encarga de resolver esas dependencias por ti, así que rara vez necesitas instalar nada "a mano".

Sin gestor de paquetes, instalar algo mínimamente complejo implicaría descargar el código fuente, localizar manualmente cada librería de la que depende, compilarlas todas en el orden correcto y copiar los binarios resultantes en las rutas adecuadas del sistema. `apt` automatiza justo esa cadena: mantiene un índice de qué paquete depende de qué otros paquetes (el "árbol de dependencias") y, cuando pides instalar algo, calcula toda la cadena necesaria y la descarga de una vez.

> [!note] `apt` frente a `apt-get`
> Durante años el comando de referencia fue `apt-get`, que sigue existiendo y es más completo en opciones de scripting. `apt` es una capa posterior, pensada para uso interactivo, con una salida más legible (barra de progreso incluida) y los subcomandos más habituales unificados en un solo binario. Para el uso diario da igual cuál emplees; en scripts automatizados es más robusto seguir usando `apt-get`, porque `apt` no garantiza mantener la misma sintaxis entre versiones.

### Buscar un paquete

Antes de instalar algo conviene comprobar que existe en los repositorios configurados:

```bash
apt-cache search snort
# snort - flexible Network Intrusion Detection System
# snort-common - flexible Network Intrusion Detection System - common files
```

`apt-cache search` busca la palabra clave en los nombres y descripciones de todos los paquetes disponibles, no solo en los instalados. Esto es útil para descubrir el nombre exacto del paquete que necesitas: en el ejemplo, la búsqueda de "snort" también habría devuelto `fwsnort` (traductor de reglas Snort a iptables) o `ippl` (un logger de protocolos IP), paquetes relacionados que quizá no conocías.

Una vez localizado el nombre exacto, `apt show` (o el más antiguo `apt-cache show`) te da la ficha completa del paquete antes de instalarlo: versión, tamaño, de qué depende y una descripción más larga que la del `search`.

```bash
apt show snort
# Package: snort
# Version: 2.9.15.1-1
# Depends: libc6, libdaq2, libpcap0.8, libpcre3, ...
# Description: flexible Network Intrusion Detection System
```

Comprobar las dependencias antes de instalar es especialmente útil cuando trabajas en un sistema con poco espacio o poco ancho de banda: te permite anticipar cuánto vas a descargar sin sorpresas.

### Instalar y eliminar

```bash
sudo apt install snort          # descarga e instala el paquete y sus dependencias
```

Al lanzar la instalación, `apt` primero resuelve el árbol de dependencias y muestra qué paquetes nuevos vas a instalar (y, a veces, paquetes "sugeridos" que son opcionales, como `snort-doc`). Es el momento de revisar la lista antes de confirmar con `y`: si ves que va a instalar decenas de paquetes que no esperabas, puede ser señal de que el nombre del paquete no era el que creías.

```bash
sudo apt remove snort           # elimina el binario, pero conserva los ficheros de configuración
sudo apt purge snort            # elimina también la configuración
sudo apt autoremove             # limpia las dependencias que ya no usa ningún paquete instalado
```

> [!note] `remove` no es lo mismo que `purge`
> Si crees que vas a reinstalar el paquete más adelante, usa `remove`: así conservas la configuración que ya tenías ajustada. Usa `purge` cuando quieras empezar de cero o liberar espacio por completo.

> [!tip] Por qué existe `autoremove`
> Al desinstalar un paquete, sus dependencias (las librerías que se instalaron junto a él) no se eliminan automáticamente, porque en teoría otro paquete podría seguir necesitándolas. `apt` las marca como "instaladas automáticamente y ya no requeridas" y las deja ahí hasta que ejecutas `autoremove`. Es buena práctica lanzarlo después de cualquier `remove` o `purge` para no acumular librerías huérfanas.

### Comprobar qué está instalado

Antes de instalar (o para auditar un sistema que no has configurado tú) conviene saber qué hay ya en la máquina:

```bash
apt list --installed              # lista todos los paquetes instalados por apt
apt list --installed | grep snort # filtra por nombre
dpkg -l | grep snort              # equivalente de más bajo nivel, vía dpkg
```

`dpkg` es la herramienta subyacente sobre la que está construido `apt`: gestiona los paquetes `.deb` individuales (instalarlos, listarlos, consultar sus contenidos) pero, a diferencia de `apt`, no resuelve dependencias por ti ni sabe nada de repositorios remotos. En la práctica trabajarás casi siempre con `apt`, pero es útil saber que `dpkg -l` existe cuando necesitas una lista rápida sin depender de la caché de `apt-cache`.

### Actualizar vs. actualizar de verdad

Es fácil confundir estos dos comandos porque en español ambos suenan a "actualizar", pero hacen cosas distintas:

```bash
sudo apt update     # refresca la LISTA de paquetes disponibles en los repositorios (no instala nada)
sudo apt upgrade    # instala las versiones más recientes de los paquetes YA instalados
```

`update` es casi siempre el primer paso: sin una lista actualizada, `upgrade` no sabe qué versiones nuevas existen.

> [!warning] Ejecuta `upgrade` cuando puedas asumir el corte
> Actualizar decenas o cientos de paquetes a la vez puede tardar y, ocasionalmente, cambiar el comportamiento de algo que dependía de una versión anterior. No es el mejor momento para hacerlo justo antes de necesitar el sistema estable para trabajar. Además, `apt upgrade` casi siempre requiere permisos de root: si dudas de si vas a tener espacio en disco suficiente, `apt` te lo indica antes de continuar (verás una línea del tipo "Need to get 827 MB of archives... After this operation, 408 MB disk space will be freed").

## El archivo sources.list y los repositorios

Los repositorios son los servidores donde vive el software de tu distribución. Cada distribución mantiene los suyos propios, configurados y probados específicamente para esa versión, y aunque distintas distribuciones (Kali, Ubuntu, Debian...) puedan compartir buena parte del software, no son intercambiables sin más: un paquete pensado para Ubuntu puede no funcionar, o directamente romper algo, en Kali. La lista de repositorios que `apt` consulta se guarda en un archivo de texto plano:

```bash
sudo nano /etc/apt/sources.list
```

Un repositorio Debian típico separa el software en categorías:

- **main**: software libre soportado oficialmente
- **universe** / **contrib**: software mantenido por la comunidad
- **multiverse** / **non-free**: software con restricciones de licencia
- **restricted**: controladores propietarios de hardware
- **backports**: paquetes retroportados desde una versión más reciente de la distribución, para quien quiere una versión más nueva de un programa sin cambiar de release completo

Para añadir un repositorio de terceros, añades una línea `deb` (y opcionalmente `deb-src` para el código fuente) al archivo. Por ejemplo, un caso real y habitual es añadir un PPA (Personal Package Archive) que ofrece un paquete no disponible en los repositorios oficiales, como Oracle Java:

```
deb http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main
deb-src http://ppa.launchpad.net/webupd8team/java/ubuntu precise main
```

Después de editar el archivo, siempre hay que refrescar la lista con `sudo apt update` antes de poder instalar algo de ese repositorio nuevo. Una práctica habitual en Kali es añadir además los repositorios de Ubuntu **después** de los de Kali: así, si un paquete no está en el repositorio de Kali (que prioriza herramientas de seguridad, no software genérico), `apt` puede encontrarlo en el de Ubuntu sin que tengas que buscarlo por otro lado.

> [!danger] No añadas repositorios `testing`, `experimental` o de origen dudoso
> Estos canales contienen software sin probar del todo, y pueden introducir paquetes rotos o incompatibles con el resto del sistema. Añade solo repositorios de terceros en los que confíes y que estén pensados para tu versión de la distribución.

### Firmas GPG: por qué apt a veces se queja de un repositorio

Los repositorios oficiales firman sus paquetes con una clave GPG, y `apt` comprueba esa firma antes de instalar nada: es lo que garantiza que el `.deb` que descargas es el que publicó el mantenedor del repositorio y no ha sido alterado por el camino. Cuando añades un repositorio de terceros sin importar antes su clave pública, `apt update` avisa con un mensaje del tipo `NO_PUBKEY` o `not signed`, y la instalación te pedirá confirmar "sin verificación":

```bash
# Importar la clave pública de un repositorio de terceros antes de confiar en él
wget -qO - https://ejemplo.com/clave.gpg | sudo gpg --dearmor -o /usr/share/keyrings/ejemplo.gpg
```

> [!warning] Instalar "sin verificación" es aceptar el paquete a ciegas
> Si `apt` pregunta `Install these packages without verification [Y/n]?`, significa que no puede comprobar la autenticidad del paquete. Decir que sí sin más no es necesariamente peligroso si confías plenamente en el origen (por ejemplo, un PPA que llevas usando tiempo), pero en un repositorio nuevo o de procedencia dudosa es exactamente el vector que un atacante usaría para colar un paquete troyanizado.

## Instaladores gráficos (GUI)

Si prefieres no usar la terminal para gestionar paquetes, existen interfaces gráficas como **Synaptic** o **Gdebi**, que se instalan igual que cualquier otro paquete:

```bash
sudo apt install synaptic
synaptic       # lanza la interfaz gráfica
```

Desde Synaptic puedes buscar un paquete, marcarlo para instalación y aplicar los cambios con un par de clics, exactamente igual que con `apt install`, pero de forma visual. Es útil sobre todo cuando estás explorando qué software hay disponible sin conocer el nombre exacto del paquete: abres la pestaña de búsqueda, escribes la palabra clave, marcas la casilla del paquete que te interesa y pulsas "Aplicar", y Synaptic descarga e instala el paquete junto con sus dependencias exactamente igual que haría `apt-get install` desde la terminal.

Las versiones más recientes de Kali ya no traen un instalador gráfico preinstalado por defecto (la distribución está pensada para trabajarse desde terminal), así que si lo quieres tendrás que instalarlo tú mismo con `apt`, como cualquier otro paquete.

## Instalar software desde git

No todo el software está empaquetado en un repositorio, especialmente proyectos nuevos, herramientas muy específicas de nicho (frecuente en el mundo del hacking, donde muchas utilidades las mantiene una sola persona) o software que todavía no ha llegado a los canales oficiales de la distribución. En esos casos, la fuente suele ser un repositorio de código (GitHub, GitLab...) que clonas directamente. Por ejemplo, para instalar `bluediving`, una suite de auditoría Bluetooth que no está en los repositorios de Kali:

```bash
git clone https://github.com/balle/bluediving.git
cd bluediving
ls -l
```

`git clone` descarga todo el historial y los archivos del repositorio a un directorio nuevo con el mismo nombre que el proyecto (`bluediving` en este caso). Comprobar el resultado con `ls -l` es buena costumbre: si la clonación ha ido bien, verás el directorio recién creado junto con sus permisos, propietario y fecha, igual que con cualquier otro archivo del sistema.

A partir de ahí, cada proyecto indica su propio método de instalación, pero lo más habitual en herramientas escritas en C es compilar antes de instalar:

```bash
cd proyecto
./configure          # comprueba dependencias y prepara la compilación (si el proyecto lo incluye)
make                 # compila el código fuente en binarios
sudo make install    # copia los binarios compilados a las rutas del sistema (p. ej. /usr/local/bin)
```

> [!tip] Lee siempre el README antes de compilar
> No todos los proyectos usan `./configure && make && make install`. Algunos usan `cmake`, otros un script propio de instalación (`install.sh`), y los de Python o Node suelen tener su propio gestor de dependencias. El README del repositorio es la fuente de verdad sobre cómo instalarlo.

> [!question] ¿apt, GUI o git?
> Usa **apt** siempre que el paquete esté en los repositorios: es la vía más segura y la que mejor gestiona actualizaciones y dependencias. Recurre a un **instalador gráfico** si prefieres explorar visualmente el catálogo de paquetes. Usa **git** solo cuando el software no esté empaquetado, y ten en cuenta que tendrás que actualizarlo y gestionar sus dependencias de forma manual.

> [!warning] `git clone` no lleva la cuenta de nada
> A diferencia de `apt`, cuando instalas algo clonándolo de git no queda registrado en ningún índice de paquetes: no hay `apt remove` que lo desinstale limpiamente, no hay resolución automática de dependencias si el proyecto las necesita, y actualizarlo implica volver al directorio y hacer `git pull` (o, peor, clonarlo de nuevo) por tu cuenta. Es la contrapartida de tener acceso a software que aún no ha llegado a ningún repositorio oficial.

## Próximos pasos

- [[06-permisos-de-archivos-y-directorios|Permisos de archivos y directorios]]
