---
title: "Python: redes y scripting para hacking"
description: "Sockets TCP en Python (cliente y servidor), diccionarios, bucles y control de flujo, y un cracker de contraseñas educativo con manejo de excepciones"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, python, redes]
---

# Python: redes y scripting para hacking

> [!abstract] Resumen
> Con los fundamentos de [[18-python-fundamentos|la nota anterior]] ya podemos escribir scripts útiles de verdad: un cliente TCP que hace banner grabbing, un listener que recoge información de quien se conecta, y un bucle que combina ambos con una lista de puertos. Cerramos con diccionarios, control de flujo (if/elif/else, while, for) y dos ejemplos de manejo de excepciones aplicados a crackers de contraseñas de laboratorio: uno contra un hash local y otro, más fiel al original del libro, contra un servidor FTP real mediante `ftplib`.

## Reconocimiento antes de atacar: el hilo conductor

Todo lo que sigue en esta nota gira alrededor de una misma idea: antes de explotar nada hay que reconocer el objetivo. Un socket que hace banner grabbing te dice qué servicio y qué versión corre detrás de un puerto; un listener te dice qué información filtra quien se conecta a ti; un diccionario te permite mapear puertos con servicios conocidos; y un bucle sobre una lista de contraseñas es, en esencia, la automatización de la fase de acceso una vez identificado el objetivo. Cada pieza de Python que veamos aquí encaja en alguna de esas fases del proceso de reconocimiento y explotación.

## Sockets: un cliente TCP simple

El módulo `socket` de la biblioteca estándar es la puerta de entrada a cualquier comunicación de red en Python. Un socket es simplemente el mecanismo por el que dos máquinas (normalmente un cliente y un servidor) se conectan e intercambian datos.

Un uso clásico en reconocimiento es el **banner grabbing**: conectar a un puerto y leer lo primero que el servicio envía, que casi siempre identifica la aplicación y su versión.

```python
#!/usr/bin/python3

import socket

s = socket.socket()
s.connect(("127.0.0.1", 22))    # IP y puerto objetivo (aquí, SSH local)

banner = s.recv(1024)            # lee hasta 1024 bytes de respuesta
print(banner)

s.close()
```

```bash
./banner_grab.py
# b'SSH-2.0-OpenSSH_7.3p1 Debian-1'
```

> [!note]
> `socket.socket()` crea el objeto socket (sin argumentos usa por defecto TCP/IPv4); `connect()` abre la conexión; `recv(n)` lee como máximo `n` bytes del buffer de entrada. Es exactamente lo que hace un escáner tipo Shodan a pequeña escala: identificar qué corre detrás de cada puerto abierto antes de decidir cómo atacarlo.

### Qué es exactamente un socket

Un socket es el mecanismo que permite a dos nodos de una red comunicarse entre sí; normalmente uno actúa de servidor y el otro de cliente, y toda la complejidad de abrir la conexión, gestionar el flujo de bytes y cerrarla queda encapsulada detrás de un puñado de métodos (`connect()`, `send()`, `recv()`, `close()`...). Cuando escribes `s.connect(("127.0.0.1", 22))` estás usando el método `connect()` del objeto `s`, con la sintaxis habitual de programación orientada a objetos que vimos en [[18-python-fundamentos|la nota anterior]]: `objeto.método(argumentos)`.

`socket.socket()` sin argumentos crea, por defecto, un socket de tipo `AF_INET` (IPv4) y `SOCK_STREAM` (TCP). Esa combinación —familia de direcciones más tipo de socket— es la que determina el protocolo de transporte que vas a usar. En el listener de la siguiente sección la escribimos de forma explícita (`socket.socket(socket.AF_INET, socket.SOCK_STREAM)`), que es exactamente lo mismo que el valor por defecto pero dejando claro en el propio código qué protocolo se está usando, algo recomendable en cuanto el script empieza a crecer.

> [!example] La misma idea con UDP
> El libro solo trabaja con TCP (`SOCK_STREAM`), pero el módulo `socket` soporta UDP igual de bien cambiando el segundo argumento a `SOCK_DGRAM`. La diferencia práctica es que UDP no establece conexión: no hay `connect()`/`accept()` previo, solo se envían y reciben datagramas sueltos. Es el protocolo detrás de servicios como DNS o SNMP, y conviene saber tocarlo aunque solo sea para escaneos o pruebas puntuales:
> ```python
> import socket
>
> s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
> s.sendto(b"consulta", ("192.168.1.1", 53))
> datos, origen = s.recvfrom(1024)
> print(datos, origen)
> s.close()
> ```
> `sendto()` y `recvfrom()` sustituyen a `send()`/`recv()` precisamente porque en UDP no hay una conexión persistente a la que escribir o leer: cada llamada especifica (o recibe) la dirección de origen/destino de forma explícita.

## Sockets: un listener/servidor TCP simple

El mismo módulo sirve para el otro lado: escuchar conexiones entrantes y recoger información de quien se conecta. Esto es útil, por ejemplo, para capturar las cabeceras que envía un navegador o un escáner cuando toca uno de tus puertos.

```python
#!/usr/bin/python3

import socket

IP_ESCUCHA = "0.0.0.0"
PUERTO = 6996
TAM_BUFFER = 1024

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind((IP_ESCUCHA, PUERTO))
s.listen(1)

conexion, direccion = s.accept()
print("Conexión entrante desde:", direccion)

while True:
    datos = conexion.recv(TAM_BUFFER)
    if not datos:
        break
    print("Datos recibidos:", datos)
    conexion.send(datos)   # los devolvemos tal cual (echo)

conexion.close()
```

Con el script corriendo, basta con apuntar un navegador a `http://<tu-ip>:6996` para ver cómo se capturan la IP de origen y las cabeceras HTTP completas de la petición: es información de reconocimiento igual de valiosa que la que obtienes escaneando tú mismo.

> [!tip]
> `socket.AF_INET` indica IPv4 y `socket.SOCK_STREAM` indica TCP; es la combinación estándar para casi todo lo que vas a hacer con sockets al principio. El `while True` que envuelve el `recv()` es el patrón habitual para mantener la conexión viva mientras sigan llegando datos.

### El flujo bind → listen → accept

Un servidor TCP en Python sigue siempre la misma secuencia de pasos, y merece la pena tenerla clara porque se repite en prácticamente cualquier script que actúe de listener:

1. `socket.socket(...)`: crea el objeto socket.
2. `bind((ip, puerto))`: asocia el socket a una dirección IP y un puerto concretos de la máquina local. Es el paso que "reserva" ese puerto para tu script.
3. `listen(n)`: pone el socket en modo escucha; `n` es el número de conexiones en cola que el sistema operativo puede mantener pendientes de aceptar antes de empezar a rechazarlas.
4. `accept()`: bloquea la ejecución del script hasta que llega una conexión entrante, y entonces devuelve dos valores: un nuevo objeto socket específico para esa conexión (`conexion`) y una tupla con la IP y el puerto de origen (`direccion`).

Es importante no confundir el socket original (`s`), que solo sirve para escuchar nuevas conexiones, con el socket que devuelve `accept()` (`conexion`), que es con el que realmente envías y recibes datos de ese cliente concreto. Si tu servidor tuviera que atender a varios clientes a la vez, necesitarías volver a llamar a `s.accept()` para cada nueva conexión, típicamente dentro de otro bucle.

> [!warning] Cuidado con lo que expones
> Levantar un listener en `0.0.0.0` (todas las interfaces) y dejarlo corriendo es, en la práctica, abrir un puerto nuevo en tu máquina. Fuera de un entorno de laboratorio aislado, hazlo solo el tiempo necesario para la prueba y ciérralo después; un listener de echo como el del ejemplo, si queda expuesto a una red no confiable, es una superficie de ataque trivial para cualquiera que lo encuentre escaneando puertos.

## Diccionarios

Un diccionario almacena pares clave-valor sin un orden fijo, a diferencia de una lista. Son el equivalente en Python de los arrays asociativos de otros lenguajes, y muy útiles para cosas como asociar un puerto con su servicio, o un usuario con su contraseña conocida.

```python
servicios = {21: "ftp", 22: "ssh", 25: "smtp", 3306: "mysql"}

print(servicios[22])          # ssh
servicios[80] = "http"        # añadir un par nuevo
```

La sintaxis general para crear un diccionario es `{clave1: valor1, clave2: valor2, ...}`, usando llaves y separando cada par con una coma; puedes incluir tantos pares como necesites. Otro ejemplo típico —tomando prestado el que usa el propio libro— es asociar un nombre con una propiedad cualquiera:

```python
color_fruta = {"manzana": "roja", "uva": "verde", "naranja": "naranja"}

print(color_fruta["uva"])          # verde

color_fruta["manzana"] = "verde"   # se puede reasignar el valor de una clave existente
```

> [!warning] Acceder a una clave que no existe
> `servicios[99]` sobre el diccionario de arriba lanza un `KeyError`, porque el 99 no es una de las claves definidas. A diferencia de una lista, donde un índice fuera de rango también falla pero al menos el rango es numérico y predecible, en un diccionario no hay forma de saber de antemano si una clave existe sin comprobarlo. El método `.get(clave, valor_por_defecto)` evita el error devolviendo un valor de repuesto en lugar de lanzar la excepción: `servicios.get(99, "desconocido")` devuelve `"desconocido"` en vez de romper el script.

Como las listas, los diccionarios son iterables: se pueden recorrer con un `for` para procesar todos sus pares, algo que usaremos en el cracker de contraseñas más abajo. La ventaja de un diccionario frente a dos listas paralelas (una de puertos, otra de servicios) es que la relación clave-valor queda explícita en la propia estructura: no depende de que ambas listas mantengan el mismo orden.

## Bucles y control de flujo

### if / elif / else

La estructura condicional de Python se apoya en la indentación en lugar de en llaves, igual que vimos con los bloques de función:

```python
uid = 0

if uid == 0:
    print("Eres el usuario root")
elif uid < 1000:
    print("Eres un usuario de sistema")
else:
    print("Eres un usuario normal")
```

Como en cualquier bloque de Python, la línea que abre el condicional termina en dos puntos y el cuerpo va indentado; la primera línea no indentada que el intérprete encuentra marca el final del bloque `if`/`elif`/`else`, exactamente igual que ocurre con las funciones que vimos en [[18-python-fundamentos|la nota anterior]].

> [!note] if...else en su forma mínima
> No siempre hace falta `elif`: la forma más simple es un `if` con un único `else` de respaldo.
> ```python
> if uid == 0:
>     print("Eres el usuario root")
> else:
>     print("No eres el usuario root")
> ```
> Esto es exactamente lo que necesitas cuando la condición es binaria (root / no root) y no hay más casos intermedios que distinguir.

### while

Repite un bloque mientras una condición sea verdadera:

```python
intentos = 1

while intentos <= 5:
    print(f"Intento número {intentos}")
    intentos += 1
```

El bucle `while` evalúa una expresión booleana (algo que solo puede valer verdadero o falso) y repite el bloque indentado mientras esa expresión siga siendo verdadera. Es el bucle natural cuando no sabes de antemano cuántas iteraciones vas a necesitar y dependes de una condición que cambia dentro del propio bucle, como el `while True` del listener de la sección anterior, que sigue leyendo del socket hasta que deja de llegar información (`if not datos: break`).

> [!warning] El riesgo del bucle infinito
> Si la condición de un `while` nunca llega a ser falsa —por ejemplo, si te olvidas de incrementar `intentos` dentro del bloque— el script se queda colgado para siempre. Es un error tan común como fácil de evitar: cada vez que escribas un `while`, comprueba explícitamente qué parte del código hace que la condición acabe cumpliéndose (o usa un `break` como red de seguridad si la lógica lo permite).

### for

Recorre los elementos de una lista, diccionario, string o cualquier otro iterable, uno a uno:

```python
for puerto, servicio in servicios.items():
    print(f"Puerto {puerto} -> {servicio}")
```

> [!example] `for` como base de un intento de conexión
> ```python
> for password in lista_passwords:
>     resultado = intentar_login(usuario, password)
>     if resultado == "OK":
>         print("Contraseña encontrada:", password)
>         break
> ```
> Este patrón —recorrer una lista probando cada valor hasta acertar o agotarla— es la base de cualquier ataque de fuerza bruta por diccionario, y también de scripts legítimos de comprobación de credenciales débiles.

### break y continue

Dentro de cualquier bucle (`while` o `for`), dos palabras clave alteran el flujo normal de iteración:

- `break` corta el bucle inmediatamente, sin completar las iteraciones que quedaran pendientes. Es lo que se usa en el ejemplo anterior en cuanto se encuentra la contraseña correcta: seguir probando el resto de la lista sería trabajo desperdiciado.
- `continue` salta el resto del cuerpo del bucle para la iteración actual y pasa directamente a la siguiente, sin salir del bucle por completo.

```python
for puerto in range(1, 1025):
    if puerto in (0, 1):          # nos saltamos un par de puertos irrelevantes
        continue
    print(f"Comprobando puerto {puerto}")
```

> [!note]
> `continue` no es imprescindible —siempre puedes conseguir el mismo efecto invirtiendo la condición de un `if` que envuelva el resto del cuerpo del bucle—, pero cuando el cuerpo tiene varias líneas, saltar la iteración explícitamente con `continue` en cuanto detectas el caso que quieres descartar suele leerse mejor que anidar el resto de la lógica dentro de un `if`.

## Mejorar scripts de reconocimiento combinando todo

Con listas, `for` y sockets ya podemos ampliar el banner grabber para que revise varios puertos de golpe en lugar de uno solo:

```python
#!/usr/bin/python3

import socket

objetivo = "192.168.1.101"
puertos = [21, 22, 25, 3306]

for puerto in puertos:
    s = socket.socket()
    print("Banner del puerto", puerto)
    try:
        s.connect((objetivo, puerto))
        print(s.recv(1024))
    except ConnectionRefusedError:
        print("Puerto cerrado o filtrado")
    finally:
        s.close()
```

```bash
./banner_grab_multi.py
# Banner del puerto 21
# b'220 (vsFTPd 2.3.4)'
# Banner del puerto 22
# b'SSH-2.0-OpenSSH_4.7p1 Debian-8ubuntu1'
# Banner del puerto 25
# b'220 metasploitable.localdomain ESMTP Postfix (Ubuntu)'
# Banner del puerto 3306
# b'5.0.51a-3ubuntu5'
```

Con cuatro líneas de lista y un `for` hemos convertido un script de un único puerto en una herramienta de reconocimiento multipuerto. Este es el patrón general para "escalar" cualquier script de hacking: identifica qué parte se repite (el puerto, la IP, la contraseña) y sácala a una lista o diccionario que recorres con un bucle.

## Manejo de excepciones: un cracker de contraseñas sencillo

Cualquier script está expuesto a errores: un fichero que no existe, una conexión rechazada, un dato con un formato inesperado. En terminología de programación, una **excepción** es justo eso: cualquier cosa que interrumpe el flujo normal del código, casi siempre por un error en la entrada o en la propia lógica. Python usa el bloque `try` / `except` para capturar esas excepciones sin que el script se caiga, y también como herramienta de control de flujo: si algo falla dentro del `try`, el `except` decide qué hacer a continuación en lugar de interrumpir la ejecución.

Un bloque `try` intenta ejecutar un fragmento de código; si se produce un error, la ejecución salta inmediatamente a la cláusula `except` correspondiente sin llegar a completar el resto del `try`. Esto lo convierte en una alternativa válida a un `if`/`else` en situaciones donde es más simple "intentarlo y ver si falla" que comprobar de antemano todas las condiciones que podrían hacer fallar la operación: es exactamente el enfoque que sigue el cracker de contraseñas de más abajo, que prueba credencial tras credencial y usa el `except` para decidir "seguir probando" en lugar de comprobar previamente si cada contraseña es válida.

> [!warning] Solo en tu propio laboratorio
> El siguiente script prueba contraseñas de una lista contra un hash conocido, comparando localmente. Es un ejercicio para entender `try`/`except` y bucles, no una herramienta de ataque. Practica esto únicamente contra tus propios sistemas o en un entorno de laboratorio controlado por ti: probar contraseñas contra cuentas o servicios de terceros sin autorización explícita es ilegal en prácticamente cualquier jurisdicción.

```python
#!/usr/bin/python3

import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Hash de referencia: el que intentamos "crackear". En un caso real
# vendría de un fichero de hashes de tu propio laboratorio, nunca de un
# sistema que no controlas.
hash_objetivo = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d"

ruta_diccionario = input("Ruta al diccionario de contraseñas: ")

try:
    with open(ruta_diccionario, "r") as fichero:
        for linea in fichero:
            intento = linea.strip("\r\n")
            try:
                if hash_password(intento) == hash_objetivo:
                    print("Contraseña encontrada:", intento)
                    break
            except Exception as error_hash:
                print("Error calculando el hash de este intento:", error_hash)
        else:
            print("Ninguna contraseña del diccionario coincide con el hash")
except FileNotFoundError:
    print("No se encuentra el fichero de diccionario en esa ruta")
except Exception as error:
    print("Error inesperado:", error)
```

Un par de detalles del script:

- `linea.strip("\r\n")` es necesario porque cada línea leída de un fichero de texto arrastra el salto de línea al final; si no lo quitas, la comparación nunca coincide aunque la contraseña sea correcta.
- El `else` del `for` se ejecuta solo si el bucle termina sin que el `break` se haya disparado nunca, es decir, si se agotó la lista sin encontrar coincidencia.
- El `except FileNotFoundError` específico captura el caso más probable de error (una ruta mal escrita); el `except Exception` genérico al final actúa como red de seguridad para cualquier otro fallo no previsto.

El mismo esqueleto (`try` exterior para el fichero, `try` interior para la comprobación, `for` para recorrer la lista) es aplicable casi sin cambios a cualquier prueba de credenciales contra un servicio local que tengas montado para practicar, sustituyendo la comparación de hash por la llamada de login correspondiente.

### El mismo patrón contra un servicio real: ftplib

El ejemplo anterior compara un hash en local, pero el caso original que plantea el libro es distinto y más ilustrativo del uso real de `try`/`except`: probar cada contraseña directamente contra un servidor FTP en marcha, usando el módulo `ftplib` de la biblioteca estándar que ya mencionamos en la nota anterior.

```python
#!/usr/bin/python3

import ftplib

servidor = input("Servidor FTP: ")
usuario = input("Usuario: ")
ruta_diccionario = input("Ruta al diccionario de contraseñas: ")

try:
    with open(ruta_diccionario, "r") as fichero:
        for palabra in fichero:
            palabra = palabra.strip("\r\n")
            try:
                ftp = ftplib.FTP(servidor)
                ftp.login(usuario, palabra)
                print("Contraseña encontrada:", palabra)
                break
            except ftplib.error_perm as error_login:
                print("Todavía probando...", error_login)
except Exception as error:
    print("Error con el diccionario:", error)
```

La lógica es la misma que en el ejemplo del hash, pero cambia lo que se prueba en el `try` interior: en vez de calcular un hash y compararlo, se abre una conexión FTP real (`ftplib.FTP(servidor)`) y se intenta un login (`ftp.login(usuario, palabra)`) con cada contraseña del diccionario. Si las credenciales son incorrectas, `ftplib` lanza la excepción específica `ftplib.error_perm`, que capturamos para imprimir "Todavía probando..." y seguir con la siguiente palabra del fichero; si el login tiene éxito, no se lanza ninguna excepción y el script llega a la línea `print("Contraseña encontrada...")` seguida de un `break` que corta el bucle.

> [!danger] Esto ya no es un ejercicio de sintaxis
> A diferencia del ejemplo con hash local, este script sí establece conexiones reales contra un servidor FTP. Ejecutarlo contra cualquier servidor que no sea tuyo, o para el que no tengas autorización explícita por escrito, es un delito de acceso no autorizado a sistemas informáticos en prácticamente cualquier legislación. El único uso legítimo es un laboratorio propio —por ejemplo, una máquina vulnerable tipo Metasploitable levantada para practicar— donde tú mismo controlas tanto el atacante como el objetivo.

Comparar ambos ejemplos deja claro por qué `except Exception` genérico y `except <ExcepciónConcreta>` cumplen papeles distintos: capturar `ftplib.error_perm` específicamente te permite distinguir "la contraseña no es correcta" (algo esperable y que quieres seguir probando) de cualquier otro fallo inesperado —de red, de configuración, del propio fichero de diccionario— que capturaría el `except Exception` genérico y que probablemente merece detener el script en lugar de seguir iterando.

## Próximos pasos

- [[00-linux-basics-for-hackers|Volver al índice]]
