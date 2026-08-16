---
title: Introducción a Linux y distribuciones Debian
description: "Por qué usar Linux, qué son las distribuciones basadas en Debian y cómo montar una máquina virtual para practicar"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, debian]
---

# Introducción a Linux y distribuciones Debian

> [!abstract] Resumen
> Punto de partida de la wiki de Linux: por qué merece la pena aprender este sistema operativo, el vocabulario básico que usarás en el resto de notas, qué son las distribuciones basadas en Debian y cómo montar una máquina virtual con VirtualBox para practicar sin arriesgar tu sistema principal.

## Por qué usar Linux

Linux no es solo "el sistema de los servidores": es la base de la mayoría de la infraestructura de internet, de los dispositivos embebidos (routers, switches, electrodomésticos) y de plataformas de virtualización como VMware o Citrix. Aprenderlo tiene sentido más allá de cualquier nicho concreto, por varias razones de fondo.

### Código abierto

El código fuente del kernel y de la inmensa mayoría de sus utilidades está disponible públicamente. Puedes leerlo, modificarlo y recompilarlo. Esto no es un detalle filosófico: significa que si algo no se comporta como esperas, existe la posibilidad real de entender por qué (y de corregirlo), en lugar de depender de que el fabricante lo arregle en su próxima versión.

### Transparencia

En Linux casi todo lo que ocurre en el sistema queda expuesto a través de archivos de configuración de texto plano, comandos de inspección y logs accesibles. No hay una capa opaca que oculte "lo que pasa por debajo". Esto hace que administrar, depurar y automatizar tareas sea mucho más predecible que en sistemas donde buena parte del comportamiento interno está cerrado.

### Control granular

En Linux, prácticamente cualquier parámetro del sistema es configurable desde la terminal, desde el nivel más superficial (qué aplicaciones arrancan) hasta el más profundo (parámetros del kernel, permisos a nivel de archivo, red). Esa granularidad, combinada con lenguajes de scripting como bash o Python, permite automatizar casi cualquier tarea repetitiva. En un sistema con una capa gráfica más restrictiva, buena parte de esas opciones simplemente no existen, o están enterradas detrás de varios menús; en Linux siempre hay un archivo de configuración o un comando que te da acceso directo.

### El ecosistema de herramientas modernas nace aquí

Buena parte del software de infraestructura que se usa hoy en día (contenedores como Docker, orquestadores como Kubernetes, la inmensa mayoría de los lenguajes de programación y sus toolchains) se desarrolla primero para Linux, y solo después, si acaso, se adapta a otros sistemas. Aprender Linux no es solo aprender "un sistema operativo más": es aprender el entorno nativo en el que corre casi todo lo que hoy llamamos "la nube".

### El software de infraestructura corre sobre Linux

Gran parte de los servidores web de internet corren sobre Linux o Unix (según qué estimación se consulte, en torno a dos tercios del total), igual que la mayoría de los dispositivos embebidos y buena parte de los sistemas de virtualización en la nube: hipervisores comerciales como VMware o Citrix están construidos sobre un kernel Linux. Si a eso le sumas que la mayoría de los móviles del planeta corren Android (Linux) o iOS (Unix), la conclusión es sencilla: quien no entiende Linux tiene un punto ciego enorme sobre cómo funciona la tecnología que usa a diario. Si tu objetivo es trabajar en sistemas, DevOps, administración de servidores o simplemente entender la infraestructura que sostiene internet, Linux es una inversión que se amortiza rápido.

> [!note]
> Existen distribuciones especializadas orientadas a seguridad ofensiva (auditorías, pentesting), que vienen precargadas con herramientas específicas para ese propósito. Esta wiki no se centra en ellas: el objetivo aquí es aprender Linux como sistema operativo de propósito general, con un enfoque de administración de sistemas.

## Vocabulario que verás repetirse

Antes de entrar en materia conviene fijar unos pocos términos que aparecerán constantemente en el resto de la wiki. No hace falta memorizarlos ahora, pero sí saber a qué se refieren cuando los vuelvas a leer:

- **Binario**: un archivo ejecutable, el equivalente a un `.exe` en Windows. Los binarios de los comandos que usarás a diario (`ls`, `cat`, `ps`...) viven sobre todo en `/usr/bin` y `/usr/sbin`.
- **Shell**: el intérprete de comandos que traduce lo que escribes en la terminal a llamadas que entiende el sistema. `bash` es, con diferencia, el más extendido.
- **Terminal**: la ventana o interfaz desde la que interactúas con la shell mediante texto, en lugar de con clics.
- **Script**: una secuencia de comandos guardada en un archivo para ejecutarla de un tirón, escrita normalmente en bash, Python o Perl.
- **root**: la cuenta de superusuario, con permisos para hacer prácticamente cualquier cosa en el sistema (crear usuarios, cambiar configuración de red, instalar software). Es el equivalente al Administrador de Windows.
- **Directorio**: lo que en Windows o macOS se llama carpeta; una forma de organizar archivos de forma jerárquica.
- **Home**: el directorio personal de cada usuario (`/home/tu_usuario`), donde por defecto se guardan los archivos que creas.

> [!tip]
> Estos términos coinciden con los que usa el libro en el que se basa esta wiki (*Linux Basics for Hackers*), así que si en algún momento consultas la fuente original, el vocabulario te resultará familiar.

## Distribuciones basadas en Debian

Linux no es un único sistema operativo cerrado, sino un kernel sobre el que distintas organizaciones construyen **distribuciones**: conjuntos de utilidades, gestor de paquetes, entorno gráfico y convenciones propias. Todas comparten el mismo kernel, pero cada una tiene su propia personalidad.

Debian es una de las distribuciones más veteranas y estables del ecosistema, mantenida por una comunidad de voluntarios sin una empresa detrás que marque el rumbo. De ella derivan, entre muchas otras, estas distribuciones:

- **Debian**: la base. Prioriza estabilidad y software probado por encima de tener siempre la última versión de cada paquete. Buena elección para servidores.
- **Ubuntu**: la distribución de escritorio (y servidor) más popular, construida sobre Debian. Añade facilidades de instalación, soporte comercial de Canonical y ciclos de publicación más frecuentes.
- **Linux Mint**: pensada para quien viene de Windows o macOS, con un entorno de escritorio muy pulido y decisiones orientadas a la facilidad de uso.
- Otras distribuciones no derivadas de Debian, como Red Hat, CentOS, Fedora, Arch o openSUSE, comparten el mismo kernel pero usan gestores de paquetes y filosofías distintas (por ejemplo, `dnf`/`yum` en vez de `apt`, o `pacman` en Arch).

> [!question] ¿Por qué empezar por una distro basada en Debian?
> Porque el gestor de paquetes `apt` es especialmente amigable para quien empieza, la documentación y comunidad son enormes (cualquier problema que tengas ya lo tuvo alguien antes), y lo que aprendas aquí se traslada casi sin cambios a Ubuntu, Mint, Kali o cualquier otra derivada. Es la puerta de entrada con menos fricción.

### Una familia, no un único sistema

Es fácil pensar en "Linux" como si fuera un producto único, pero en realidad es un ecosistema: el kernel es compartido, pero cada distribución decide su propio gestor de paquetes, sus políticas de actualización y hasta la filosofía de qué software incluir por defecto. Debian, por ejemplo, prioriza la estabilidad hasta el extremo de tener ciclos de publicación de varios años entre versiones mayores (`stable`), mientras que Ubuntu ofrece versiones intermedias más frecuentes además de su propio ciclo LTS (*Long Term Support*) cada dos años. Conocer esta jerarquía de derivadas te ayuda a entender por qué un tutorial escrito para Ubuntu suele funcionar en Debian con pequeños ajustes, pero uno escrito para Fedora puede requerir traducir cada comando de `apt` a `dnf`.

## Montar una máquina virtual para practicar

La forma más segura de aprender Linux es no tocar tu sistema operativo actual. Una máquina virtual (VM) te permite ejecutar Debian o Ubuntu dentro de una ventana de tu Windows, macOS o Linux actual, sin particionar discos ni arriesgar tus datos.

### Instalar VirtualBox

[VirtualBox](https://www.virtualbox.org/) es la solución de virtualización gratuita de Oracle, disponible para Windows, macOS y Linux.

1. Entra en la web oficial y descarga el paquete correspondiente a tu sistema operativo anfitrión.
2. Ejecuta el instalador y acepta las opciones por defecto (asistente de instalación, interfaces de red).
3. Durante la instalación es normal que se te pida confirmar la instalación de varios "dispositivos de software": son los adaptadores de red virtuales necesarios para que las VMs tengan conectividad. Acepta todos.

> [!warning]
> Si al arrancar una VM obtienes un error relacionado con la virtualización, probablemente tengas la virtualización por hardware (VT-x/AMD-V) desactivada en la BIOS/UEFI de tu equipo, o tengas otro hipervisor (como Hyper-V en Windows) compitiendo por el mismo recurso. Revisa la BIOS de tu fabricante o desactiva Hyper-V si aplica.

### Modo de red: NAT frente a adaptador puente

Al crear la VM, VirtualBox te preguntará (o asignará por defecto) el modo de red del adaptador virtual. Los dos que más vas a usar mientras aprendes son:

- **NAT** (*Network Address Translation*): la VM sale a internet a través de tu equipo anfitrión, pero no es visible desde el resto de tu red local ni tiene una IP propia en ella. Es el modo por defecto y el más seguro para practicar, porque aísla la VM del resto de dispositivos de tu casa u oficina.
- **Adaptador puente** (*bridged*): la VM se comporta como un equipo más de tu red local, con su propia IP asignada por el router. Es necesario si quieres, por ejemplo, acceder a un servicio de la VM desde otro dispositivo de la misma red, pero también expone la VM a esa red como si fuera una máquina física más.

> [!tip]
> Para seguir esta wiki, el modo NAT es más que suficiente. Cambia a adaptador puente solo si necesitas que otro equipo de tu red hable directamente con la VM (por ejemplo, para probar un servidor web accesible desde tu móvil).

### Crear la máquina virtual

1. Descarga la imagen `.iso` de la distribución que quieras instalar (por ejemplo, [Debian](https://www.debian.org/distrib/) o [Ubuntu](https://ubuntu.com/download/desktop)).
2. Abre VirtualBox y pulsa **New** (Nueva).
3. Ponle un nombre a la máquina, selecciona el tipo **Linux** y la versión correspondiente (Debian de 64 bits, por ejemplo).
4. Asigna la RAM. Como regla general, no reserves más del 25% de la RAM total de tu equipo: si tienes 8 GB, usa 2 GB; si tienes 16 GB, puedes subir a 4 GB.
5. Crea un disco duro virtual nuevo, en formato VDI, con reserva **dinámica** (así el fichero del disco solo crece según lo necesites, en vez de ocupar todo el espacio desde el primer momento).
6. Asigna al menos 20-25 GB de espacio de disco. Ampliarlo más adelante es incómodo, así que mejor pecar de generoso.
7. Con la VM creada pero apagada, selecciona el fichero `.iso` descargado como disco de arranque y pulsa **Start**.

> [!example] Configuración recomendada para practicar
> ```text
> Tipo: Linux
> Versión: Debian (64-bit)
> RAM: 2048-4096 MB
> Disco: VDI, reserva dinámica, 25 GB
> ```
> Suficiente para seguir el resto de esta wiki sin sorpresas de espacio o rendimiento.

### Instalar Debian/Ubuntu en la VM

El instalador te irá guiando paso a paso:

1. Elige **instalación gráfica** si es tu primera vez; es más guiada que la instalación en modo texto (esta última tiene sentido en servidores sin entorno gráfico o con recursos muy limitados, pero añade fricción innecesaria mientras aprendes).
2. Selecciona idioma, ubicación y distribución de teclado.
3. Configura el nombre de host (el nombre de la máquina) y, si lo pide, el dominio (puedes dejarlo en blanco).
4. Define la contraseña del usuario administrador. Como es una VM aislada de la red externa por defecto, no es crítico usar una contraseña ultra compleja, pero tampoco pongas `1234`.
5. En el particionado de disco, elige la opción **guiada, usar todo el disco** y, cuando te pregunte, selecciona **un único sistema de archivos para todo** (todas las carpetas en una sola partición). Es la opción más simple para un entorno de aprendizaje.

> [!note] Particionado con LVM o particiones separadas
> El instalador también suele ofrecer particionar con LVM (*Logical Volume Manager*) o separar `/home`, `/var` y `/` en particiones independientes. Son opciones útiles en servidores de producción (por ejemplo, para poder redimensionar `/var` sin tocar el resto, o hacer snapshots de LVM), pero añaden complejidad que no aporta nada mientras estás aprendiendo los fundamentos. Guárdalas para cuando construyas tu primer servidor real.
6. Confirma que quieres escribir los cambios en el disco. Como es un disco virtual recién creado, no hay nada que perder.
7. Si el instalador te pregunta si quieres usar una réplica de red (*network mirror*) para completar paquetes durante la instalación, puedes responder que no sin problema: no es necesario para tener un sistema funcional, y puedes instalar cualquier paquete después con `apt`.
8. Cuando termine la instalación, instala el gestor de arranque **GRUB** (*Grand Unified Bootloader*), el programa que se encarga de mostrarte el menú de arranque y cargar el kernel de Linux al encender la máquina. Si te da a elegir entre instalarlo automáticamente o indicar el dispositivo a mano, elige la opción manual y selecciona el disco principal (normalmente `/dev/sda`): instalarlo en el dispositivo equivocado es una de las causas más comunes de que la VM se quede con una pantalla en negro tras reiniciar.
9. Reinicia y listo: tendrás una pantalla de login de tu distribución recién instalada.

> [!tip]
> Antes de instalar nada más, crea un snapshot de la VM desde VirtualBox (clic derecho sobre la VM → Snapshots → Take). Así, si rompes algo experimentando con permisos o paquetes, puedes volver atrás en segundos en lugar de reinstalar desde cero.

### Primer arranque y cambio de contraseña

Tras el reinicio verás la pantalla de login de tu distribución. Entra con el usuario que definiste durante la instalación y, una vez dentro, abre una terminal para comprobar que todo funciona:

```bash
whoami       # confirma con qué usuario has entrado
passwd       # cambia la contraseña del usuario actual, si lo necesitas
```

Si en algún momento necesitas ejecutar una tarea administrativa (instalar un paquete, editar un archivo de `/etc`), no inicies sesión directamente como `root`: usa tu usuario normal y antepón `sudo` al comando concreto que necesite privilegios elevados. Es una práctica que conviene automatizar desde el primer día, y que retomamos con más detalle en la siguiente nota.

## Próximos pasos

- [[02-fundamentos-y-sistema-de-archivos|Fundamentos y sistema de archivos]]: la terminal, la jerarquía de directorios y los primeros comandos para moverte con soltura.
