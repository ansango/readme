---
title: "Python: fundamentos"
description: "Bases de Python para scripting en Linux: instalar módulos con pip, variables, comentarios, funciones, listas y una introducción a la programación orientada a objetos"
date: 2026-07-11
mod: 2026-07-11
published: true
tags: [linux, sysadmin, python]
---

# Python: fundamentos

> [!abstract] Resumen
> Python es el lenguaje de scripting más usado en el mundo del hacking (sqlmap, scapy, el Social-Engineer Toolkit, w3af están escritos en él) gracias a su enorme catálogo de módulos: más de mil ya incluidos de serie, y muchísimos más en repositorios de terceros. Esta nota cubre lo mínimo imprescindible para escribir tus propios scripts: instalar paquetes con `pip`, variables y tipos de datos, comentarios, funciones, listas, módulos y los conceptos básicos de la programación orientada a objetos, incluida una primera pincelada de herencia.

## Por qué Python y no otra cosa

Quedarte solo con las herramientas que ha escrito otra persona te condena, en palabras del propio libro, al terreno del *script kiddie*: dependes de lo que alguien más haya decidido programar, no puedes adaptar una herramienta a un objetivo concreto, y usas binarios que cualquier antivirus o IDS ya conoce de sobra. Saber programar aunque sea a nivel básico es lo que separa a quien ejecuta exploits de quien los entiende, los modifica y los combina.

Podrías construir herramientas de hacking en bash, Perl o Ruby —de hecho en [[09-bash-scripting|la nota de bash scripting]] ya viste que es perfectamente viable—, pero Python tiene una ventaja estructural: su ecosistema de módulos. La biblioteca estándar ya trae tipos de datos, manejo de excepciones, criptografía, y soporte para casi cualquier protocolo de internet; y lo que no trae de serie, casi seguro que existe como paquete de terceros. Esa combinación de una sintaxis sencilla y una cantidad enorme de piezas reutilizables es lo que ha hecho que herramientas como sqlmap o scapy se escriban en Python en lugar de en C o Java.

## Instalar módulos de terceros con pip

Python ya trae de serie una biblioteca estándar enorme (tipos de datos, manejo de excepciones, criptografía, protocolos de red...), pero la razón por la que se ha convertido en el lenguaje preferido para construir herramientas de hacking es lo fácil que resulta añadir módulos de terceros. El repositorio de referencia es [PyPI](https://pypi.org), y `pip` (Pip Installs Packages) es el gestor de paquetes que tira de él.

```bash
# Instalar pip para Python 3 si no viene ya incluido
apt-get install python3-pip

# Instalar un paquete desde PyPI
pip3 install <nombre-del-paquete>

# Ver dónde se ha instalado un paquete y qué depende de él
pip3 show pysnmp
```

> [!note]
> Los paquetes instalados con `pip3` acaban típicamente en `/usr/local/lib/<versión-de-python>/dist-packages`. Si tienes dudas de dónde ha ido a parar uno en concreto, `pip3 show <paquete>` te lo dice en el campo `Location`.

`pip3 show` no solo te da la ubicación: en el campo `Requires` lista también las dependencias del paquete, algo útil para depurar por qué un módulo no termina de funcionar después de instalarlo (falta alguna de esas dependencias) o para entender qué te vas a traer si lo instalas.

No todos los módulos que te interesan están en PyPI. Muchos proyectos de la comunidad hacker se distribuyen como código fuente en su propia web. En ese caso el patrón es descargar, descomprimir e instalar a mano:

```bash
wget http://xael.org/norman/python/python-nmap/python-nmap-0.3.4.tar.gz
tar -xzf python-nmap-0.3.4.tar.gz
cd python-nmap-0.3.4/
python3 setup.py install
```

> [!tip]
> Si vas a escribir mucho Python conviene usar algo más que un editor de texto plano. Kali trae PyCrust integrado, pero un IDE como PyCharm (con edición de color, autocompletado y depurador) acelera bastante el aprendizaje.

## Tu primer script

Un script de Python se ejecuta igual que uno de bash: con una shebang en la primera línea, permisos de ejecución y `./` delante del nombre.

```python
#!/usr/bin/python3

nombre = "OccupyTheWeb"

print("Saludos a " + nombre + " desde Hackers-Arise. El mejor sitio para aprender hacking")
```

```bash
chmod 755 saludo.py
./saludo.py
# Saludos a OccupyTheWeb desde Hackers-Arise. El mejor sitio para aprender hacking
```

> [!note]
> A diferencia de otros lenguajes, en Python no hace falta declarar el tipo de una variable antes de asignarle un valor: `nombre = "OccupyTheWeb"` crea la variable y le asigna el string en el mismo paso.

### Formato e indentación

Python usa la indentación para agrupar bloques de código, no llaves ni palabras clave de cierre. Esto no es una cuestión de estilo: si un bloque no mantiene una indentación consistente, el intérprete lanza un error. Es algo a lo que hay que acostumbrarse viniendo de bash o de lenguajes con bloques delimitados por `{ }`.

> [!note] La indentación no es cosmética
> El nivel de sangrado concreto que elijas (dos espacios, cuatro espacios, un tabulador) es indiferente para el intérprete, siempre que seas consistente *dentro del mismo bloque*. Si empiezas un bloque con doble indentación, todas las líneas de ese bloque tienen que mantener esa misma doble indentación; en el momento en que una línea rompe el patrón, Python no sabe si sigue perteneciendo al bloque o no, y lanza un `IndentationError`. En lenguajes como C o bash la indentación es una convención de estilo que puedes ignorar sin que el programa deje de funcionar; en Python es sintaxis.

### Variables: qué son y cómo las trata Python

Una variable es un nombre asociado a un valor: cuando usas ese nombre en el resto del programa, invocas el valor que representa. En términos de memoria, el nombre de la variable apunta a una posición donde vive el dato real, y ese dato puede ser de cualquier tipo —entero, número real, string, booleano, lista, diccionario—. La particularidad de Python frente a lenguajes como C o Java es que no hace falta declarar de antemano qué tipo de dato va a contener una variable: la asignación (`nombre = "OccupyTheWeb"`) crea la variable y fija su tipo en el mismo paso, y ese tipo puede incluso cambiar si más adelante le asignas un valor de otra clase.

### Tipos de variables básicos

```python
#!/usr/bin/python3

texto = "Hackers-Arise Is the Best Place to Learn Hacking"
entero = 12
decimal = 3.1415
lista = [1, 2, 3, 4, 5, 6]
diccionario = {"nombre": "OccupyTheWeb", "valor": 27}
es_root = False

print(texto)
print(entero)
print(decimal)
```

Cada uno de estos valores es en realidad una instancia de una clase (string, int, float, list, dict, bool); volvemos sobre esta idea más abajo, en la sección de programación orientada a objetos. Los diccionarios se tratan con más detalle en [[19-python-redes-y-hacking|la siguiente nota]], junto con los bucles que los recorren.

> [!warning] Un número entre comillas sigue siendo texto
> `puerto = "22"` no es lo mismo que `puerto = 22`. En el primer caso `puerto` es un string y no puedes usarlo directamente en una comparación numérica o una operación aritmética sin convertirlo antes con `int()`; en el segundo es un entero desde el principio. Es un error habitual cuando el valor viene de `input()` o de leer un fichero de texto línea a línea, porque en ambos casos Python te entrega siempre strings, nunca números, aunque el contenido "parezca" un número.

`type()` es la forma más rápida de comprobar qué está guardando realmente una variable en un momento dado, algo útil cuando el valor viene de fuera del script (entrada de usuario, un fichero, la respuesta de un socket) y no tienes control directo sobre su formato:

```python
>>> type(entero)
<class 'int'>
>>> type(texto)
<class 'str'>
```

## Comentarios

Python ignora todo lo que va después de `#` en una línea, y todo lo que queda entre dos bloques de triple comilla `"""` para comentarios de varias líneas:

```python
#!/usr/bin/python3
"""
Script de saludo. Sirve como plantilla mínima para probar que el intérprete
y los permisos de ejecución están bien configurados.
"""
nombre = "OccupyTheWeb"
print("Saludos a " + nombre + " desde Hackers-Arise")
```

> [!tip]
> Comentar no es opcional en la práctica: dentro de seis meses no vas a recordar por qué elegiste una expresión regular concreta o por qué un valor está hardcodeado. El coste de escribir el comentario ahora es mucho menor que el de reconstruir el razonamiento después.

El intérprete no ejecuta ni analiza sintácticamente lo que hay dentro de un comentario: puedes escribir ahí fragmentos de código roto, notas a medio terminar o recordatorios en lenguaje natural sin que eso afecte al funcionamiento del script. Es habitual, por ejemplo, dejar comentada una línea de depuración (`# print(respuesta_completa)`) mientras desarrollas un script de reconocimiento, para poder reactivarla rápidamente sin tener que volver a escribirla si necesitas inspeccionar de nuevo la respuesta cruda de un socket.

## Funciones

Una función es un bloque de código reutilizable. `print()` es la más usada de todas, pero Python trae muchas más incorporadas de serie:

- `len()`: número de elementos de una lista o diccionario.
- `int()` / `float()`: convierten el argumento al tipo numérico correspondiente (`int()` trunca la parte decimal, no redondea).
- `range()`: genera una lista de enteros entre dos valores.
- `sorted()`: devuelve una lista ordenada.
- `max()`: devuelve el valor más alto de una lista.
- `type()`: el tipo del argumento (`int`, `str`, `list`...).
- `open()`: abre un fichero en el modo indicado.
- `help()`: muestra la documentación de lo que le pases.
- `exit()`: termina la ejecución del script en el punto donde se llama.

> [!tip]
> Antes de escribir tu propia función para algo, comprueba si ya existe en la biblioteca estándar (documentación oficial en [docs.python.org](https://docs.python.org), sección *Library Reference*). Reinventar `sorted()` o `len()` es tiempo perdido, y las implementaciones incorporadas suelen estar más optimizadas que cualquier versión casera.

Definir tus propias funciones usa `def`, y el valor de retorno se indica con `return`:

```python
def es_puerto_valido(puerto):
    """Comprueba que un puerto está en el rango válido de TCP/UDP."""
    return 0 < puerto <= 65535

if es_puerto_valido(3306):
    print("Puerto válido para escanear")
```

Las funciones también admiten parámetros con un valor por defecto, algo muy útil en scripts de reconocimiento donde casi siempre quieres el mismo comportamiento salvo que se indique lo contrario:

```python
def construir_objetivo(ip, puerto=22):
    """Si no se indica puerto, se asume SSH (22) por defecto."""
    return f"{ip}:{puerto}"

print(construir_objetivo("192.168.1.101"))        # 192.168.1.101:22
print(construir_objetivo("192.168.1.101", 3306))  # 192.168.1.101:3306
```

> [!note]
> Una función que no lleva ningún `return` explícito no devuelve "nada" en el sentido literal: devuelve el valor especial `None`, el equivalente en Python al nulo de otros lenguajes. Es un matiz que conviene tener presente si más adelante intentas usar el resultado de una función así en una comparación o una operación.

## Listas

Muchos lenguajes usan arrays para almacenar varios valores bajo un mismo nombre; en Python la implementación más habitual es la lista. Como en casi cualquier lenguaje moderno, el índice empieza en 0: el primer elemento es `lista[0]`, el segundo `lista[1]`, y así sucesivamente.

```python
puertos = [21, 22, 25, 3306]

print(puertos[0])   # 21
print(puertos[3])   # 3306
```

Las listas son iterables, es decir, se pueden recorrer una a una con un bucle `for` (lo vemos con detalle en [[19-python-redes-y-hacking|la siguiente nota]]). Esa propiedad es la que hace útiles a las listas para, por ejemplo, mantener un catálogo de puertos a escanear o una serie de direcciones IP objetivo.

### Indexación negativa y slicing

Además del índice positivo (`puertos[0]` para el primer elemento), Python permite indexar desde el final de la lista con números negativos, y extraer sublistas con la notación de *slicing* `[inicio:fin]`:

```python
puertos = [21, 22, 25, 80, 443, 3306]

print(puertos[-1])     # 3306 -> el último elemento
print(puertos[-2])     # 443  -> el penúltimo
print(puertos[1:3])    # [22, 25] -> desde el índice 1 hasta el 3 (sin incluir)
print(puertos[:2])     # [21, 22] -> los dos primeros
print(puertos[3:])     # [80, 443, 3306] -> del índice 3 en adelante
```

> [!tip]
> `puertos[-1]` es muy socorrido cuando no sabes de antemano cuántos elementos tiene una lista (por ejemplo, si la has construido dinámicamente a partir de una respuesta de red) pero necesitas el último valor añadido.

### Operaciones y comprensión de listas

Las listas admiten operaciones habituales como añadir (`append`), quitar (`remove`) o comprobar pertenencia con `in`:

```python
puertos = [21, 22, 25]

puertos.append(3306)          # añade al final: [21, 22, 25, 3306]
puertos.remove(25)            # quita el primer 25 que encuentre: [21, 22, 3306]

if 22 in puertos:
    print("El puerto 22 está en la lista")
```

Python también permite construir listas nuevas a partir de otra con una sola línea, mediante **comprensión de listas** (*list comprehension*). Es una herramienta compacta muy habitual en scripts de reconocimiento para, por ejemplo, generar de golpe un rango de puertos o filtrar una lista existente:

```python
# Genera los puertos del 1 al 1024 sin escribir un bucle for explícito
puertos_bajos = [p for p in range(1, 1025)]

# Filtra de una lista de puertos solo los que están por debajo de 1024
puertos_privilegiados = [p for p in puertos if p < 1024]
```

> [!note]
> La comprensión de listas no es imprescindible —el mismo resultado se consigue con un `for` normal y un `append()` en cada vuelta—, pero es un patrón tan extendido en código Python real (incluido el de muchas herramientas de hacking) que conviene reconocerlo aunque al principio prefieras escribir el bucle explícito por claridad.

## Módulos

Un módulo es simplemente código guardado en un fichero aparte para poder reutilizarlo sin volver a escribirlo. Para usar el código de un módulo hay que importarlo primero:

```python
import nmap
```

Esto aplica tanto a los módulos que instalaste con `pip3` como a los que ya vienen con Python. En la siguiente nota usaremos dos módulos de la biblioteca estándar especialmente relevantes para hacking: `socket`, para comunicaciones de red, y `ftplib`, para hablar el protocolo FTP.

> [!note] Módulo propio vs. módulo de terceros
> Un módulo no tiene por qué venir de PyPI ni de la biblioteca estándar: cualquier fichero `.py` que guardes aparte y luego importes con `import mi_modulo` cumple la misma función. Es el mecanismo natural para dividir un script de hacking que empieza a crecer —por ejemplo, separar las funciones de escaneo de puertos de las funciones de generación de informes— en varios ficheros más pequeños y manejables, en lugar de acumularlo todo en un único script interminable.

## Programación orientada a objetos (OOP) básica

Python es un lenguaje orientado a objetos, igual que C++, Java o Ruby. La idea central es modelar el código como si fueran cosas del mundo real: un **objeto** tiene **propiedades** (atributos o estados, como sustantivos/adjetivos) y **métodos** (acciones, como verbos). Una **clase** es la plantilla a partir de la cual se crean los objetos, y puede tener subclases que heredan sus atributos y métodos.

Por ejemplo, la clase `Coche` podría tener como propiedades la marca, el modelo y el color, y como métodos `arrancar()`, `conducir()` y `aparcar()`. La clase `Coche` puede tener a su vez varios objetos que son miembros suyos —un Mercedes, un BMW, un Audi—, y también subclases más específicas: `BMW` sería una subclase de `Coche`, y un `BMW 320i` concreto sería ya un objeto de esa subclase, que hereda los métodos `arrancar()`, `conducir()` y `aparcar()` de su clase padre sin tener que redefinirlos.

Entender esta jerarquía —clase, subclase, objeto— es clave porque es exactamente el mismo patrón que vas a encontrarte leyendo el código fuente de casi cualquier herramienta de hacking medianamente grande: una clase base `Scanner` de la que cuelgan subclases `TCPScanner` y `UDPScanner`, por ejemplo, cada una especializando el comportamiento genérico para su caso concreto.

Trasladado a un contexto de reconocimiento de red, podríamos modelar un host descubierto como una clase:

```python
class Host:
    def __init__(self, ip, puertos_abiertos):
        # __init__ se ejecuta al crear el objeto: aquí se inicializan sus atributos
        self.ip = ip
        self.puertos_abiertos = puertos_abiertos

    def resumen(self):
        return f"{self.ip} tiene {len(self.puertos_abiertos)} puerto(s) abierto(s): {self.puertos_abiertos}"


objetivo = Host("192.168.1.101", [21, 22, 3306])
print(objetivo.resumen())
# 192.168.1.101 tiene 3 puerto(s) abierto(s): [21, 22, 3306]
```

> [!note]
> `__init__` es el constructor de la clase: se ejecuta automáticamente cada vez que creas un objeto nuevo (`Host(...)`) y es el sitio donde se asignan los atributos iniciales (`self.ip`, `self.puertos_abiertos`). `self` es la referencia al propio objeto dentro de sus métodos.

### Herencia básica

Siguiendo el símil del `Coche` y el `BMW`, podemos crear una subclase de `Host` que añada comportamiento específico sin repetir lo que ya tiene la clase padre. Por ejemplo, un `HostVulnerable` que además de la información básica de `Host` sepa listar sus CVE conocidos:

```python
class HostVulnerable(Host):
    def __init__(self, ip, puertos_abiertos, cves):
        super().__init__(ip, puertos_abiertos)   # reutiliza el __init__ de Host
        self.cves = cves

    def resumen(self):
        # sobrescribimos (override) el método de la clase padre para añadir los CVE
        resumen_base = super().resumen()
        return f"{resumen_base} | CVEs: {', '.join(self.cves)}"


objetivo = HostVulnerable("192.168.1.101", [21, 3306], ["CVE-2011-2523", "CVE-2012-2122"])
print(objetivo.resumen())
# 192.168.1.101 tiene 2 puerto(s) abierto(s): [21, 3306] | CVEs: CVE-2011-2523, CVE-2012-2122
```

> [!note]
> `super()` da acceso a la clase padre desde dentro de la subclase: `super().__init__(...)` llama al constructor de `Host` para no tener que repetir la asignación de `self.ip` y `self.puertos_abiertos`, y `super().resumen()` reutiliza el método original de `Host` en lugar de reescribirlo entero. Este patrón —heredar la clase base y sobrescribir (*override*) solo el método que necesita comportamiento distinto— es exactamente el mecanismo detrás de cuando una herramienta de hacking define, por ejemplo, distintos tipos de escáner o distintos tipos de payload a partir de una clase genérica común.

Entender estos conceptos —clase, objeto, atributo, método, `__init__`, herencia— es la base para leer con soltura el código de casi cualquier herramienta de hacking escrita en Python, y para estructurar tus propios scripts de reconocimiento cuando empiecen a crecer más allá de un puñado de líneas.

## Próximos pasos

- [[19-python-redes-y-hacking|Python: redes y scripting para hacking]]: sockets para hablar con la red, diccionarios, bucles y control de flujo, y un cracker de contraseñas educativo con manejo de excepciones.
