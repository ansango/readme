---
title: Servicios - Apache, SSH y MySQL
description: "Arrancar, parar y usar los servicios más comunes en Linux: servidor web Apache, acceso remoto por SSH y base de datos MySQL/MariaDB"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, servicios]
---

# Servicios: Apache, SSH y MySQL

> [!abstract] Resumen
> Un servicio en Linux es una aplicación que corre en segundo plano esperando a que la uses: un servidor web, un demonio SSH, una base de datos. En esta nota vemos cómo arrancar, parar y reiniciar servicios, y cómo poner en marcha cuatro de los más habituales en cualquier sistema Linux: Apache, OpenSSH, MySQL/MariaDB y, de propina, PostgreSQL en su papel de almacén de datos de Metasploit.

## Arrancar, parar y reiniciar servicios

La sintaxis depende de si tu distribución usa `systemd` (la mayoría de las actuales: Ubuntu, Debian, Kali, Fedora, Arch...) o el sistema `init.d` más antiguo.

```bash
# systemd (sistemas modernos)
sudo systemctl start apache2      # arrancar
sudo systemctl stop apache2       # parar
sudo systemctl restart apache2    # reiniciar (recarga la config)
sudo systemctl enable apache2     # arrancar automáticamente en cada boot
sudo systemctl status apache2     # ver el estado del servicio

# sistemas más antiguos (SysVinit)
sudo service apache2 start
sudo service apache2 stop
sudo service apache2 restart
```

> [!note]
> Cada vez que cambies un fichero de configuración de un servicio en texto plano, necesitas reiniciarlo (`restart`) para que aplique los cambios. Si solo quieres recargar la configuración sin cortar las conexiones activas, muchos servicios aceptan `reload` en lugar de `restart`.

Estos tres — y un cuarto, PostgreSQL, que veremos al final — son los servicios que más va a tocar cualquiera que trabaje en Linux, ya sea como administrador de sistemas o como atacante: un servidor web que sirve contenido, un demonio de acceso remoto que administra (o compromete) máquinas, y una base de datos que guarda, en la mayoría de los casos, la información realmente valiosa de cualquier aplicación.

## Servidor web con Apache

Apache es, con diferencia, el servidor web más extendido del mundo: según las estadísticas que maneja *Linux Basics for Hackers*, ronda el 55% de los servidores web de todo internet. Junto con MySQL y un lenguaje de script (PHP, Python), forma la pila **LAMP** (Linux, Apache, MySQL, PHP/Python) — la misma combinación que en el mundo Windows se conoce como **WAMP**, sustituyendo la L de Linux por la W de Windows.

Para quien quiere entender cómo se ataca la web, conocer Apache por dentro no es opcional: entender cómo sirve contenido, cómo interpreta las peticiones y cómo se conecta con la base de datos es la base para entender vulnerabilidades como el *cross-site scripting* (XSS) o el secuestro de tráfico mediante manipulación de DNS. Y en sentido contrario, levantar tu propio Apache es exactamente lo que necesitarías para alojar una web clonada, servir un payload o montar cualquier infraestructura de pruebas controlada.

### Instalación y arranque

```bash
sudo apt update
sudo apt install apache2

sudo systemctl start apache2
sudo systemctl enable apache2   # opcional: que arranque con el sistema
```

Con el servicio arrancado, abre `http://localhost` en tu navegador. Deberías ver la página por defecto de Apache ("It works" o similar), lo que confirma que el servidor está sirviendo contenido correctamente.

### Editar la página por defecto

El fichero que Apache sirve por defecto está en `/var/www/html/index.html`. Edítalo con cualquier editor de texto:

```bash
sudo nano /var/www/html/index.html
```

Sustituye el contenido por algo propio, por ejemplo:

```html
<html>
<body>
  <h1>Mi primer servidor Apache</h1>
  <p>Si ves esto en el navegador, Apache está sirviendo mis cambios.</p>
</body>
</html>
```

Guarda el fichero y recarga `http://localhost` en el navegador: Apache servirá el HTML que acabas de escribir.

> [!tip]
> No hace falta reiniciar Apache para que sirva cambios en el HTML: `index.html` es contenido estático que se lee en cada petición. El `restart` solo es necesario si tocas la configuración del propio Apache (por ejemplo, `/etc/apache2/apache2.conf` o los ficheros de `sites-available`).

> [!warning] El otro lado de editar index.html
> Cambiar la página por defecto es un ejercicio inocente en tu propia máquina, pero el mismo mecanismo es el que hay detrás de clonar una web ajena para un ataque de *phishing*, o de servir contenido malicioso (por ejemplo, un script que explota XSS) a quien visite tu servidor. Servir HTML arbitrario a terceros sin su consentimiento, o suplantar un dominio ajeno, es delito en la mayoría de jurisdicciones; el interés de tocar `index.html` aquí es puramente didáctico, para entender qué pasa "al otro lado" de una petición HTTP.

## OpenSSH: acceso remoto seguro

SSH (*Secure Shell*) permite abrir una terminal remota cifrada en otra máquina, sustituyendo al inseguro y obsoleto `telnet`. Con SSH puedes autenticar usuarios, restringir quién puede conectarse y cifrar toda la comunicación, lo que reduce el riesgo de que alguien intercepte tu sesión. **OpenSSH** es la implementación más usada y viene preinstalada en casi cualquier distribución.

SSH cumple un doble papel muy revelador según quién lo use: para un administrador de sistemas es la herramienta estándar para gestionar servidores remotos sin acceso físico a ellos (listas de acceso, autenticación por clave, cifrado de toda la sesión); para un atacante, es a menudo el canal que se usa para *mantener* el acceso a un sistema ya comprometido, precisamente porque es la misma herramienta legítima que ya usa el administrador — no levanta sospechas como lo haría una puerta trasera a medida.

### Instalar y arrancar el servicio

```bash
sudo apt install openssh-server
sudo systemctl start ssh
sudo systemctl enable ssh
```

### Conectar a otra máquina

```bash
ssh usuario@192.168.1.101
```

La primera vez te pedirá confirmar la huella de la clave del host, y después la contraseña del usuario remoto (o tu clave privada, si usas autenticación por clave pública).

> [!example] Acceso remoto a una Raspberry Pi con cámara
> Un caso práctico habitual para aprender SSH "en el mundo real" es controlar una Raspberry Pi con módulo de cámara desde tu propio ordenador, sin necesidad de teclado ni monitor conectados a la Pi:
> ```bash
> # En la Raspberry Pi (con Raspberry Pi OS): habilita SSH desde
> # raspi-config > Interface Options > SSH, o con:
> sudo systemctl enable ssh --now
>
> # Averigua la IP de la Pi
> ifconfig
>
> # Desde tu máquina, conecta por SSH
> ssh pi@192.168.1.101
>
> # Ya dentro, habilita la cámara si no lo has hecho
> sudo raspi-config    # Interface Options > Camera > Enable
>
> # Toma una foto
> raspistill -v -o foto.jpg
> ```
> Esto convierte la Pi en una pequeña cámara remota controlable por SSH: útil para un vigilabebés casero, una cámara de trail o monitorizar tu propio taller.

> [!warning]
> Haz esto solo con hardware de tu propiedad y en tu propia red, con el consentimiento de cualquier persona que pueda quedar grabada. Acceder por SSH a un dispositivo ajeno sin autorización, aunque sea "solo para mirar", es acceso no autorizado a un sistema informático y puede ser delito. Cambia también la contraseña por defecto de cualquier Raspberry Pi (`pi`/`raspberry` en versiones antiguas) antes de exponerla en red, aunque sea una red local.

## MySQL y MariaDB

MySQL (y su fork libre MariaDB, mantenido tras la compra de MySQL por Oracle) es la base de datos relacional detrás de una enorme parte de la web: WordPress, Facebook, LinkedIn, Twitter o Wikipedia (entre muchísimas otras) la usan, o la han usado, como backend, igual que otros CMS populares como Joomla o Drupal.

> [!note] De dónde viene MariaDB
> MySQL nació en 1995 de la mano de la empresa sueca MySQL AB, fue comprada por Sun Microsystems en 2008 y, un año después, por Oracle — el mayor fabricante de software de bases de datos del mundo. La comunidad de software libre nunca terminó de fiarse de que Oracle mantuviera MySQL abierto a largo plazo, así que nació **MariaDB** como fork libre, con el compromiso explícito de seguir siendo de código abierto. En la práctica, para el uso que le damos aquí, ambas se comportan igual: mismos comandos, mismo cliente, salida casi idéntica.

Para quien quiere atacar (o defender) aplicaciones web, las bases de datos son el objetivo por excelencia: ahí es donde vive la información realmente sensible — credenciales, datos personales, números de tarjeta —, así que merece la pena dedicarles más tiempo que a Apache o SSH.

### Instalación y arranque

```bash
sudo apt install mariadb-server   # o mysql-server, según distro
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### Conectar con el cliente

```bash
mysql -u root -p
```

En una instalación recién hecha es habitual que el usuario `root` de MySQL no tenga contraseña (pulsa Intro cuando la pida). Esto es un riesgo de seguridad evidente y lo primero que hay que corregir. Ten en cuenta además que el usuario y la contraseña de MySQL son completamente independientes de los del sistema operativo: puedes tener un `root` de Linux con contraseña fuerte y, al mismo tiempo, un `root` de MySQL completamente abierto.

### Comandos SQL básicos

SQL (*Structured Query Language*) es el lenguaje con el que se habla con casi cualquier base de datos relacional — es decir, una base de datos donde los datos viven en tablas, y cada tabla tiene columnas (campos) y filas (registros) que se relacionan entre sí. Hay distintas implementaciones de SQL según el motor (MySQL, MariaDB, PostgreSQL, SQL Server...), pero un puñado de verbos se repite en todas:

```sql
show databases;                     -- listar bases de datos
use nombre_basedatos;                -- seleccionar una base de datos
show tables;                        -- listar tablas de la BD actual
describe nombre_tabla;               -- ver estructura de una tabla
select * from nombre_tabla;          -- volcar todo el contenido de una tabla
select columna1, columna2 from tabla where condicion;
```

> [!note]
> `SELECT` recupera datos, `INSERT` añade filas nuevas, `UPDATE` modifica filas existentes, `DELETE` las elimina y `UNION` combina el resultado de varios `SELECT`. Son los cinco verbos que cubren la mayoría del trabajo diario con SQL. Añadiendo una cláusula `WHERE` puedes acotar cualquiera de ellos a las filas que cumplan una condición, por ejemplo `select user, password from customers where user='admin';` para traer solo la fila del usuario `admin`.

### Explorar bases de datos y tablas que no son tuyas

Si te conectas (autorizado, en tu propio entorno de pruebas) a un servidor MySQL del que no conoces el contenido, el flujo de exploración es siempre el mismo: primero ver qué bases de datos hay, después qué tablas contiene la que te interese, y por último qué columnas tiene cada tabla antes de volcar los datos.

```sql
show databases;
-- +-------------------------------+
-- | Database                      |
-- +-------------------------------+
-- | information_schema            |
-- | mysql                         |
-- | creditcardnumbers             |  -- <- esta llama la atención
-- | performance_schema            |
-- +-------------------------------+

use creditcardnumbers;
show tables;
-- +-----------------------------------+
-- | Tables_in_creditcardnumbers       |
-- +-----------------------------------+
-- | cardnumbers                       |
-- +-----------------------------------+

describe cardnumbers;
-- +---------------+--------------+---------+-----+---------+
-- | Field         | Type         | Null    | Key | Default |
-- +---------------+--------------+---------+-----+---------+
-- | customers     | varchar(15)  | YES     |     | NULL    |
-- | address       | varchar(15)  | YES     |     | NULL    |
-- | city          | varchar(15)  | YES     |     | NULL    |
-- | state         | varchar(15)  | YES     |     | NULL    |
-- | cc            | int(12)      | NO      |     | 0       |
-- +---------------+--------------+---------+-----+---------+
```

`describe` es el paso que muchas veces se salta por prisa, y es un error: te dice el nombre exacto de cada columna, su tipo de dato, si acepta `NULL`, y si tiene una clave que la relaciona con otra tabla — información imprescindible para construir después un `SELECT` bien dirigido en lugar de ir a ciegas.

```sql
select * from cardnumbers;
-- +-----------+---------------+-------------+---------+--------------+
-- | customers | address       | city        | state   | cc           |
-- +-----------+---------------+-------------+---------+--------------+
-- | Jones     | 1 Wall St     | NY          | NY      |    12345678  |
-- | Sawyer    | 12 Piccadilly | London      | UK      | 234567890    |
-- | Doe       | 25 Front St   | Los Angeles | CA      | 4567898877   |
-- +-----------+---------------+-------------+---------+--------------+
```

> [!example] El "vellocino de oro" del atacante
> El libro llama a las bases de datos el "vellocino de oro" (*golden fleece*) del hacker: es donde se concentra la información realmente valiosa — credenciales, tarjetas, datos personales — de una aplicación entera en un único sitio. El ejemplo de arriba usa un nombre de base de datos deliberadamente obvio (`creditcardnumbers`) solo con fines didácticos; en la práctica, nadie llama así a una base de datos de producción, y encontrar la tabla de interés suele requerir explorar varias bases de datos y tablas con nombres mucho más anodinos (`app_db`, `wp_options`, `t1`...).

> [!warning]
> El cliente de línea de comandos (`mysql`) no es la única forma de interactuar con MySQL: existen interfaces gráficas como MySQL Workbench, Navicat o TOAD. Pero si tu objetivo es examinar un servidor al que has accedido sin que el administrador te haya dado antes una interfaz cómoda, la CLI suele ser la única opción disponible — es la que hay que dominar.

### Crear un usuario y una contraseña

Da igual si trabajas con MySQL o MariaDB: la forma moderna y recomendada de crear un usuario con contraseña es `CREATE USER`, no tocar directamente la tabla `mysql.user` con `UPDATE` (ese método es antiguo y depende de la función `PASSWORD()`, hoy en desuso):

```sql
CREATE USER 'analista'@'localhost' IDENTIFIED BY 'una-contraseña-fuerte';
GRANT SELECT, INSERT, UPDATE ON mi_basedatos.* TO 'analista'@'localhost';
FLUSH PRIVILEGES;
```

Para poner o cambiar la contraseña del propio `root` (imprescindible nada más instalar el servicio):

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'otra-contraseña-fuerte';
FLUSH PRIVILEGES;
```

> [!danger]
> Un `root` de MySQL sin contraseña, accesible además desde red (`bind-address` mal configurado o puerto 3306 expuesto a internet), es una de las causas más comunes de bases de datos comprometidas. Cambia la contraseña por defecto y limita el acceso remoto salvo que lo necesites explícitamente.

### Conectar a una base de datos remota

```bash
mysql -u root -p -h 192.168.1.101
```

Si no se indica `-h` (host), el cliente asume `localhost`.

## PostgreSQL y Metasploit

**PostgreSQL** (o simplemente Postgres) es otra base de datos relacional de código abierto, mantenida por la comunidad PostgreSQL Global Development Group desde 1996. Frente a MySQL/MariaDB, suele elegirse en aplicaciones muy grandes por su capacidad de escalar y de manejar cargas de trabajo pesadas. Se instala y arranca igual que las anteriores:

```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Lo que hace a PostgreSQL especialmente relevante para un hacker es que es la base de datos por defecto de **Metasploit**, el framework de pentesting más usado del mundo. Metasploit la usa para almacenar sus propios módulos y, sobre todo, los resultados de escaneos y explotación de una auditoría, lo que agiliza muchísimo las búsquedas posteriores frente a tenerlo todo suelto en ficheros de texto.

### Configurar la base de datos de Metasploit

```bash
# 1. Arranca msfconsole con Postgres ya en marcha
msfconsole

# 2. Deja que Metasploit inicialice su propia base de datos
msf > msfdb init
# crea la base de datos 'msf' y 'msf_test', pide una contraseña
# y genera /usr/share/metasploit-framework/config/database.yml
```

Si prefieres montarlo a mano (útil para entender qué hace `msfdb init` por debajo), el proceso es el típico de administración de PostgreSQL:

```bash
# Cambia al usuario del sistema 'postgres' (dueño por defecto del servicio)
msf > su postgres

# Crea un rol/usuario para Metasploit
postgres@kali:~$ createuser msf_user -P
# pide la contraseña del nuevo rol dos veces

# Crea una base de datos propiedad de ese usuario
postgres@kali:~$ createdb --owner=msf_user hackers_arise_db
postgres@kali:~$ exit
```

### Conectar msfconsole a la base de datos

Para que Metasploit guarde ahí sus resultados necesita cuatro datos: usuario, contraseña, host y nombre de la base de datos.

```bash
msf > db_connect msf_user:contraseña@127.0.0.1/hackers_arise_db

# Comprobar que la conexión se ha establecido
msf > db_status
# [*] postgresql connected to msf
```

Con la base de datos conectada, cada escaneo (`db_nmap`) o cada exploit lanzado desde `msfconsole` queda registrado automáticamente, y los módulos se indexan en Postgres en lugar de leerse uno a uno del disco en cada arranque — la diferencia se nota especialmente en el tiempo de arranque de `msfconsole` y en la velocidad de búsqueda con `search`.

> [!note]
> Entrar en detalle sobre el uso de Metasploit queda fuera del alcance de esta nota; el objetivo aquí es entender por qué PostgreSQL, un servicio que a primera vista parece "solo otra base de datos más", tiene un papel tan concreto en el ecosistema de pentesting.

## Próximos pasos

- [[14-seguridad-y-anonimato|Seguridad y anonimato]]: cómo proteger tu identidad y tu tráfico cuando navegas
