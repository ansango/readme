---
title: Seguridad y anonimato
description: "Cómo te identifica internet y qué herramientas (Tor, proxies, VPN, email cifrado) existen para navegar con más privacidad"
date: 2026-07-11
mod: 2026-07-11
draft: false
tags: [linux, sysadmin, seguridad, anonimato]
---

# Seguridad y anonimato

> [!abstract] Resumen
> Casi todo lo que haces en internet queda registrado: tu IP, las webs que visitas, el contenido de tus correos. Esta nota repasa cómo te identifica la red y cuatro estrategias para reducir esa exposición: la red Tor (con su origen militar y sus límites frente a agencias de inteligencia), los proxies encadenados (con sus distintos modos de encadenado), las VPN y el correo cifrado con PGP. Ninguna es infalible ni excluyente entre sí; se trata de capas de dificultad, no de garantías absolutas.

## Cómo te delata internet

Cada paquete que envías por la red viaja etiquetado con la IP de origen y la de destino, y salta de router en router (normalmente entre 10 y 20 saltos) hasta llegar a su destino. Cualquiera que intercepte ese tráfico por el camino puede ver quién lo envió, por dónde ha pasado y a dónde va. Así es como una web sabe quién eres al volver a visitarla, y también cómo se puede reconstruir tu actividad en la red.

```bash
# Ver la ruta (los saltos) que hacen tus paquetes hasta un destino
traceroute google.com
```

Además de la IP, hay otras formas habituales de identificarte:

- **Contenido de tus correos y búsquedas**: servicios de correo "gratuitos" como Gmail escanean el contenido para servir publicidad.
- **Huella digital del navegador (fingerprinting)**: la combinación de user-agent, resolución de pantalla, fuentes instaladas, zona horaria y extensiones activas suele ser única, incluso sin cookies ni IP identificable.
- **Cookies y trackers de terceros**: incrustados en la mayoría de webs para seguir tu actividad entre sitios distintos.

> [!note]
> Ningún método de los que siguen anula todas estas vías a la vez. Se trata de dificultar el rastreo, no de hacerlo imposible: con tiempo y recursos suficientes, casi cualquier actividad puede rastrearse.

> [!question] ¿Por qué tantos saltos?
> Un paquete no viaja directo de tu router a su destino: pasa por entre 10 y 20 routers intermedios de media (hasta 20-30 en casos extremos, aunque en la práctica casi siempre llega en menos de 15). Cada uno de esos saltos es un punto donde, en teoría, alguien podría capturar el tráfico si no va cifrado. `traceroute` no cambia nada de esto: solo te deja ver la ruta que ya está tomando cada paquete, salto a salto, con su IP y el tiempo de ida y vuelta (RTT) hasta cada uno.

## Tor: enrutamiento cebolla

**Tor** (*The Onion Router*) nació de un proyecto de la Oficina de Investigación Naval de EE. UU. (ONR) a principios de los años 90 con un objetivo muy concreto: permitir a agentes de inteligencia navegar por internet sin que se pudiera rastrear el origen ni el destino de su tráfico, útil para labores de espionaje. La idea era construir una red de routers completamente separada de la del internet convencional, que cifrara el tráfico y en la que cada nodo solo conociera la IP del salto inmediatamente anterior — nunca la ruta completa. Ese proyecto de investigación se formalizó en 2002 bajo el nombre "The Onion Router (Tor) Project", y desde entonces está disponible para cualquiera. Hoy es una red pública de más de 7000 routers voluntarios (nodos) repartidos por el mundo, sostenida por gente que cede ancho de banda de su propio equipo.

### Cómo funciona

En lugar de viajar por los routers habituales de internet, tu tráfico pasa por al menos tres nodos Tor elegidos al azar, y en cada salto se cifra una capa distinta (de ahí lo de "cebolla"):

- Cada nodo solo conoce la IP del nodo **anterior** y del **siguiente**, nunca la ruta completa.
- El nodo de salida (el último) es el único que ve el tráfico sin cifrar hacia el destino final, pero no sabe quién lo originó.
- El destino solo ve la IP del nodo de salida, nunca la tuya.

### Instalación y uso básico

```bash
# Kali y derivados de Debian
sudo apt install tor torbrowser-launcher
torbrowser-launcher
```

El Tor Browser funciona como cualquier navegador, pero todo tu tráfico circula por la red Tor.

### La dark web y los dominios .onion

Además de acceder a la web convencional de forma más privada, el Tor Browser es la puerta habitual a la llamada **dark web**: sitios cuyo dominio de nivel superior es `.onion` en lugar de `.com` o `.es`, y que solo son accesibles a través de la red Tor — no se resuelven en un DNS convencional ni son indexables por buscadores normales. Esa misma propiedad (anonimato reforzado tanto para quien visita como para quien aloja el sitio) es lo que ha hecho de la dark web un espacio asociado sobre todo a actividad ilegal, aunque también alberga servicios legítimos: foros de disidentes bajo regímenes represivos, filtraciones periodísticas o versiones `.onion` de medios y organizaciones conocidas.

> [!warning]
> Si decides explorar la dark web, ten presente que es habitual encontrar contenido que mucha gente consideraría ofensivo o directamente ilegal, y que la ausencia de moderación es la norma, no la excepción. Navegar por curiosidad no es delito en sí mismo, pero acceder, descargar o distribuir determinados contenidos sí puede serlo, con independencia de la red que uses para llegar hasta ellos.

### Limitaciones y riesgos reales de Tor

> [!warning] Limitaciones reales de Tor
> - La navegación es notablemente más lenta, al haber muchos menos nodos que routers convencionales.
> - Agencias de inteligencia como la NSA operan sus propios nodos Tor y han demostrado ser capaces de romper el anonimato mediante *traffic correlation* (correlacionar patrones de tráfico de entrada y salida en los extremos de la red, sin necesidad de descifrar nada por el camino).
> - Si el nodo de salida es hostil o está monitorizado, puede ver tu tráfico sin cifrar si la web de destino no usa HTTPS — el cifrado de Tor protege el trayecto por la red, no lo que ocurre entre el nodo de salida y el servidor final.
> - Es efectivo frente a rastreo comercial (Google, anunciantes), pero no es garantía frente a un atacante con recursos de estado: agencias como la NSA consideran Tor una amenaza a la seguridad nacional (permite comunicarse sin vigilancia a gobiernos extranjeros y organizaciones criminales) y llevan años invirtiendo recursos serios en romper su anonimato, con éxito documentado en algunos casos.

Dicho de otro modo: Tor sube muchísimo el listón frente a un rastreador comercial normal, pero no es una bala de plata frente a un adversario con presupuesto de estado y capacidad de vigilancia en ambos extremos de la conexión.

## Proxies y proxychains

Un proxy es un intermediario: te conectas a él y es su IP, no la tuya, la que llega al destino. La respuesta hace el camino inverso: el servidor de destino contesta al proxy, y es el proxy quien te la reenvía a ti. De cara a quien intercepte el tráfico, o de cara al propio servidor de destino, todo parece originarse en el proxy.

A diferencia de Tor, un proxy normalmente registra tu tráfico en algún log (por diseño, necesita saber a quién devolver la respuesta), así que la protección real que ofrece frente a una investigación formal depende de que alguien consiga una orden judicial o citación para obligar al dueño del proxy a entregar esos registros — no es anonimato per se, sino una capa extra de fricción para quien intenta rastrearte.

Kali incluye `proxychains`, una herramienta que fuerza a cualquier comando a salir a través de uno o varios proxies encadenados (una **cadena de proxies**), lo que dificulta aún más rastrear el origen: quien intercepte el tráfico solo ve el último proxy de la cadena, no los anteriores ni tu IP real.

```bash
# Sintaxis general
proxychains <comando> <argumentos>

# Ejemplo: navegar de forma anónima
proxychains firefox www.ejemplo.com

# Ejemplo: escanear una IP a través del proxy configurado
proxychains nmap -sT -Pn 192.168.1.50
```

`proxychains` construye la cadena de proxies por ti a partir de la configuración: no tienes que preocuparte de encaminar manualmente el tráfico de un proxy a otro, solo de mantener la lista de proxies actualizada.

### Configuración

La configuración vive en `/etc/proxychains.conf`:

```bash
sudo nano /etc/proxychains.conf
```

Al final del fichero está la lista de proxies:

```ini
[ProxyList]
# por defecto usa Tor si no añades nada más
socks4 127.0.0.1 9050

# puedes añadir tus propios proxies
socks4 114.134.186.12 22020
socks4 188.187.190.59 8888
```

Por defecto, si no tocas nada, `proxychains` enruta el tráfico a través de Tor (`127.0.0.1:9050`, el puerto SOCKS local donde escucha el demonio de Tor si lo tienes instalado). Si quieres usar tus propios proxies en lugar de Tor, comenta esa línea con `#` y añade los tuyos debajo.

> [!tip]
> Puedes encontrar listas de proxies públicos buscando "free proxies" o en sitios como hidemy.name. Úsalos solo para practicar la sintaxis de `proxychains`: como se explica más abajo, un proxy gratuito no es una opción seria si el anonimato te importa de verdad.

### Añadir varios proxies

Nada impide meter más de un proxy en la lista; `proxychains` los usará en el orden en que aparecen (salvo que actives el modo aleatorio, ver más abajo):

```ini
[ProxyList]
socks4 114.134.186.12 22020
socks4 188.187.190.59 8888
socks4 181.113.121.158 33551
```

Con varios proxies en la lista, tu tráfico salta de uno a otro antes de llegar al destino. Desde fuera no notarás ninguna diferencia al navegar — la web se ve igual —, pero cada salto añade una capa más de indirección entre tú y el sitio que visitas.

### Modo de encadenado

Al principio del fichero está el modo de encadenado, que determina cómo se recorre la lista de proxies. Solo uno debe estar descomentado a la vez:

```ini
# dynamic_chain   -> usa todos los proxies de la lista en orden,
#                    salta al siguiente si uno falla
# strict_chain    -> igual, pero exige que TODOS estén activos
# random_chain    -> elige aleatoriamente `chain_len` proxies de la lista
#                    en cada conexión (más difícil de rastrear, más latencia)
chain_len = 3
```

**Encadenado dinámico (`dynamic_chain`)**: recorre la lista en orden y, si un proxy no responde, lo salta automáticamente y sigue con el siguiente, sin que la conexión falle. Es la opción más práctica del día a día: con `strict_chain` (la alternativa "todo o nada"), basta con que uno solo de los proxies de la lista esté caído para que la petición entera falle.

```ini
dynamic_chain
# strict_chain     <- comentado
# random_chain      <- comentado
```

**Encadenado aleatorio (`random_chain`)**: en lugar de recorrer siempre la lista en el mismo orden, `proxychains` elige al azar `chain_len` proxies de la lista en cada conexión. El resultado es que la cadena de proxies que ve el destino cambia cada vez, lo que complica bastante más el rastreo por patrones — el precio es más latencia, porque en cada conexión hay que comprobar de nuevo qué proxies aleatorios están vivos.

```ini
# dynamic_chain
# strict_chain
random_chain
chain_len = 3
```

Solo puede haber un modo activo a la vez: antes de descomentar `random_chain`, asegúrate de comentar `dynamic_chain` y `strict_chain`, o `proxychains` se quedará con el último que encuentre en el fichero.

### Consideraciones de seguridad de los proxies

> [!danger]
> Evita los proxies gratuitos para cualquier cosa que te importe mantener privada: su dueño ve tu IP real y, en la práctica, muchos venden esos registros. Como dice el dicho (atribuido al criptógrafo Bruce Schneier), "si el producto es gratis, el producto eres tú". Para un uso serio, usa proxies de pago de confianza.

Incluso usando proxies de pago, conviene tener claras las limitaciones reales de este método:

- El dueño del proxy conoce tu IP de origen — es imprescindible para poder devolverte la respuesta —, así que tu anonimato depende por completo de que ese dueño no coopere con quien te investigue.
- Si una agencia de seguridad o un cuerpo policial presiona lo suficiente (con jurisdicción y una orden legal de por medio), el operador del proxy puede verse obligado a entregar tu identidad para proteger su propio negocio.
- `proxychains` es tan bueno como los proxies que le des: una cadena de proxies mal elegidos, lentos o comprometidos no mejora tu anonimato, solo añade latencia.

En resumen, `proxychains` con una buena lista de proxies de confianza dificulta mucho el rastreo casual, pero no es una garantía frente a un adversario con capacidad legal o técnica de presionar al operador del proxy.

## VPN

Una **VPN** (red privada virtual) cifra todo tu tráfico entre tu equipo y un servidor intermedio (normalmente un router gestionado por el proveedor de la VPN), que es quien finalmente lo reenvía a su destino con su propia IP.

Frente a Tor y los proxies:

- Es mucho más rápida y sencilla de usar (una app, un botón): no hay que elegir nodos ni encadenar nada manualmente.
- Cifra **todo** el tráfico del sistema, no solo el de una aplicación concreta como hace `proxychains` con el comando al que se aplica.
- No es anónima por diseño: el proveedor de la VPN tiene que conocer tu IP real para poder devolverte el tráfico, y si no tiene una política estricta de "no logs", puede entregar esos registros ante una orden judicial o presión de una agencia de inteligencia.
- Es muy útil para esquivar bloqueos geográficos o censura estatal, y para protegerte en redes Wi-Fi públicas no confiables (un aeropuerto, una cafetería), donde cualquiera en la misma red podría intentar interceptar tráfico sin cifrar.

### Para qué sirve realmente una VPN

Más allá del anonimato, el caso de uso más habitual de una VPN es sortear restricciones geográficas: si tu gobierno bloquea el acceso a según qué contenido político, una VPN con salida en otro país suele destaparlo. Y a la inversa, servicios como Netflix, Hulu o HBO limitan parte de su catálogo según el país de origen del tráfico; conectarte a través de una VPN con salida en el país "correcto" es la forma habitual de saltarse ese límite (aunque cada vez más plataformas detectan y bloquean IPs conocidas de VPN comerciales).

Entre los proveedores comerciales más conocidos están IPVanish, NordVPN, ExpressVPN, CyberGhost, Private Internet Access o ProtonVPN, con precios habituales en el rango de 50-100 $/año y, en muchos casos, un periodo de prueba gratuito. A la hora de elegir uno, lo relevante no es tanto la velocidad publicitada como su política de logs (si de verdad no guarda registros de conexión) y la jurisdicción bajo la que opera (qué órdenes judiciales le pueden obligar a cooperar).

> [!tip]
> Si el objetivo es anonimato serio frente a rastreo activo, una VPN sola no basta; combínala con Tor o proxychains. Si el objetivo es solo cifrar el tráfico en una red no confiable o saltar restricciones geográficas, una VPN por sí sola es suficiente y mucho más cómoda.

> [!warning]
> La "confianza" en una VPN comercial es, en última instancia, un acto de fe: pagas para que un tercero deje de ver tu tráfico tu ISP y lo vea, en su lugar, el proveedor de la VPN. Si ese proveedor decide (o se ve obligado a) llevar registros pese a lo que diga en su web, estás exactamente en la misma situación que sin VPN, solo que con un intermediario de más.

## Correo cifrado (PGP)

Los servicios de correo gratuitos (Gmail, Outlook...) son gratuitos por una razón muy concreta: son un vehículo para conocer tus intereses y venderte publicidad, y el proveedor tiene acceso al contenido sin cifrar de tus mensajes en sus propios servidores, aunque el transporte vaya por HTTPS. HTTPS protege el trayecto entre tu navegador y el servidor del proveedor, no lo que ese proveedor hace con el contenido una vez lo tiene delante. Dos alternativas complementarias, no excluyentes:

- **Servicios con cifrado nativo**, como ProtonMail: cifran el correo de extremo a extremo entre usuarios de la misma plataforma, de forma que ni sus propios administradores pueden leerlo.
- **PGP (Pretty Good Privacy)**, que puedes usar sobre cualquier proveedor de correo mediante un par de claves pública/privada, sin depender de que el destinatario use el mismo servicio que tú.

### ProtonMail: cifrado de extremo a extremo por defecto

ProtonMail nació de un grupo de científicos jóvenes que trabajaban en el CERN, en Suiza, y aprovecharon dos ventajas del país para montar el servicio: una larga tradición de proteger secretos (la misma que hizo célebres a las cuentas bancarias suizas) y una legislación europea mucho más estricta que la estadounidense en materia de protección de datos personales. El servicio ofrece cuenta básica gratuita y planes de pago con más capacidad, y cifra el correo de tal forma que ni el propio personal de ProtonMail puede leer el contenido de los mensajes almacenados en sus servidores.

> [!warning]
> El cifrado de extremo a extremo de ProtonMail solo está garantizado entre dos cuentas de ProtonMail. Si escribes a alguien que usa Gmail o cualquier otro proveedor sin cifrado nativo compatible, parte o todo el contenido del mensaje puede acabar viajando o almacenándose sin cifrar en el otro extremo. Conviene revisar la documentación de ProtonMail sobre este punto antes de asumir que "todo lo que mando desde ProtonMail va cifrado siempre".

### Generar un par de claves

```bash
gpg --full-generate-key
# Elige tipo de clave (RSA por defecto), tamaño (4096 recomendado),
# fecha de caducidad, y tu nombre/email como identidad
```

### Compartir tu clave pública

```bash
gpg --armor --export tu-email@ejemplo.com > mi-clave-publica.asc
```

Envía este fichero (o cuélgalo en un servidor de claves) para que otros puedan cifrar mensajes dirigidos a ti.

### Cifrar y descifrar un mensaje

```bash
# Cifrar un fichero para el destinatario (necesitas su clave pública importada)
gpg --encrypt --armor -r destinatario@ejemplo.com mensaje.txt
# genera mensaje.txt.asc, listo para pegar en el cuerpo de un correo

# Descifrar un mensaje recibido (usa tu clave privada, pide tu passphrase)
gpg --decrypt mensaje.txt.asc
```

> [!example]
> Antes de cifrar para alguien, necesitas importar su clave pública:
> ```bash
> gpg --import clave-publica-del-destinatario.asc
> gpg --sign-key destinatario@ejemplo.com   # opcional: firmarla si confías en su autenticidad
> ```

> [!warning]
> PGP protege el **contenido** del mensaje, pero no metadatos como quién escribe a quién ni cuándo, algo que sigue siendo visible para el proveedor de correo. Y si pierdes tu clave privada (o su passphrase), no hay forma de recuperar los mensajes cifrados con ella: haz copia de seguridad de la clave en un sitio seguro.

## Próximos pasos

- [[15-redes-inalambricas-y-bluetooth|Redes inalámbricas y Bluetooth]]: identificar y conectar con dispositivos Wi-Fi y Bluetooth
