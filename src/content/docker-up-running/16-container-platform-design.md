---
title: Container platform design
description: "Diseñar plataformas de containers resilientes: Twelve-Factor App methodology (12 principios), Reactive Manifesto (responsive, resilient, elastic, message-driven), y cómo aplicar ambas a arquitecturas container-native"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, twelve-factor, reactive, architecture, microservices, saas, design]
---

# Container platform design

> [!abstract] Resumen
> Esta nota cubre cómo diseñar una **plataforma de containers resiliente** siguiendo dos documentos clave: **The Twelve-Factor App** (12 principios para aplicaciones SaaS modernas, escritos por Adam Wiggins de Heroku en 2011, antes de Docker) y **The Reactive Manifesto** (sistemas que son responsive, resilient, elastic, y message-driven). Ambos son anteriores a Docker pero han influenciado profundamente su diseño y el de las plataformas container-native.

## Twelve-Factor App

En noviembre de 2011, **Adam Wiggins** (cofundador de Heroku) publicó "The Twelve-Factor App", una metodología de 12 prácticas para aplicaciones que escalan en un entorno SaaS moderno. **Docker no existía aún**, pero estos principios han influido en su diseño y siguen siendo la base de cualquier plataforma container-native que se precie.

### Los 12 factores

#### 1. Codebase — Un codebase en revision control

**Una sola codebase tracked en Git** para cada aplicación. Todos los containers de esa app se construyen desde ese repo. Si necesitas stitch-ear código de múltiples repos, **algo está mal**.

> [!tip] Test: clean laptop + new dev
> Dale a un dev nuevo un laptop limpio y un párrafo de instrucciones. **Si no puede buildear tu app en menos de una hora**, el proceso necesita simplificarse.

#### 2. Dependencies — Declarar y aislar explícitamente

**Nunca** confíes en dependencias del sistema operativo. Todo lo que tu app necesita debe estar **declarado en el Dockerfile** (o `package.json`, `Gemfile`, `requirements.txt`, etc.) y pulled in por el build.

> [!tip] Imágenes base son convenientes pero peligrosas
> Las imágenes oficiales (Ubuntu, Alpine) son un buen punto de partida pero **enmascaran dependencias ocultas**. Para apps en C/Go estáticamente compiladas, una imagen `FROM scratch` te obliga a saber exactamente qué necesitas. Para apps en lenguajes interpretados, sé explícito sobre qué librerías y runtimes necesitas.

#### 3. Config — En environment variables, no en el codebase

```bash
docker container run -e ENVIRONMENT="production" \
    -e DATABASE_URL="postgresql://..." \
    -e API_KEY="..." \
    myapp:1.2.3
```

**Mismo container, distintos env vars** para staging, prod, dev. **Nunca bakees secrets en el código**. Las env vars son el contrato entre tu imagen y el entorno.

> [!caution] Secrets management
> Si tienes muchos secrets o rotación frecuente, **no los pongas en env vars planas**. Usa:
> - **Docker Swarm**: `docker secret`.
> - **Kubernetes**: Secret resources, Vault, AWS Secrets Manager.
> - **Vault**, **Consul** para setups más complejos.

#### 4. Backing Services — Tratar como recursos attached

Las DBs locales **no son más confiables que las de terceros**. Trata todas las dependencias externas (DB, cache, message queue) como **recursos que pueden caerse** y diseña tu app para **degradar gracefully** cuando eso pase.

Con containers, **high availability viene del horizontal scaling + rolling deploys**, no de mantener procesos vivos para siempre. **Las instancias van y vienen**; tu app debe manejarlo.

#### 5. Build, Release, Run — Separar estrictamente

Tres stages distintos:

- **Build**: compilar la imagen desde el código.
- **Release**: combinar la imagen con la config del entorno → produce un release inmutable.
- **Run**: ejecutar el release.

> [!tip] Registry como handoff
> El **image registry** es el handoff natural entre build y run. CI pushea la imagen al registry; deploy la pulla. No rebuildes entre entornos; **cambias las env vars**.

#### 6. Processes — Stateless

**Ejecuta la app como uno o más procesos stateless**. Todo el estado compartido va en un backing store (DB, cache, S3). **Nunca confíes en disco local del container**; el container es ephemeral.

> [!tip] Un proceso por container
> Un container = una función = fácil de escalar horizontalmente. Si tu app tiene 3 procesos acoplados, **rebuild-ala en 3 containers** o usa un init system (tini) dentro de uno.

#### 7. Port Binding — Exportar servicios por port binding

La app **bind directamente al port**, sin inetd externo. Tú expones con `--publish 80:8080` y confías en que el port 8080 del container es tu servicio.

```bash
# App Go estáticamente compilada, solo expone el binario
docker container run -d -p 80:8080 myapp:1.0
# El container solo tiene el binario. No hay nginx, no hay gunicorn.
```

#### 8. Concurrency — Escalar via process model

**Diseña para horizontal scaling**. Añadir una instancia más es trivial con containers; añadir RAM a una instancia existente es caro y difícil de revertir. **Escala horizontal** es el modelo natural con Docker + scheduler.

#### 9. Disposability — Fast startup y graceful shutdown

**Containers son descartables**. Diseño para que mueran y se reemplacen rápidamente:

- **SIGTERM**: tu app debe manejarlo, cerrar conexiones, flush de logs.
- **SIGKILL**: el kernel termina el proceso sin aviso; tu app debe tener **graceful shutdown** en el menor tiempo posible.
- **Fast startup**: < 5 segundos ideal. Si tarda más, los rolling updates son lentos.

> [!tip] Init system
> Si tu app spawn-ea hijos, usa `--init` (tini) para que PID 1 sea un init que reapa hijos. Sin esto, **acumulas zombies** en cada restart.

#### 10. Development/Production Parity — Minimizar divergencia

**Mismas personas, mismos procesos, mismos artifacts** en dev, staging, prod. **Cada divergencia es un riesgo** que se manifiesta en producción cuando es tarde para arreglarlo proactivamente.

Con containers, esto es más fácil: **mismo Dockerfile, mismas env vars ajustadas, mismo registry**. La imagen es idéntica en todos los entornos.

#### 11. Logs — Tratar como event streams

**Escribe logs a STDOUT/STDERR, no a archivos en el container**. Deja que la plataforma los collecte (Docker, Kubernetes, el logging service):

```bash
# Tu app solo hace:
console.log("User logged in");
# La plataforma (Docker daemon, k8s, fluentd) se encarga del resto
```

> [!tip] No escribas logs a archivos
> Si tu app escribe a `/var/log/myapp/`, **esos logs se pierden cuando el container se destruye**. STDOUT/STDERR van al driver de logging del daemon (json-file, syslog, fluentd) y persisten fuera del container.

#### 12. Admin Processes — Como one-off processes

**Tareas admin (migrations, cleanup, etc.) se corren como containers one-off** con la misma imagen y config que la app:

```bash
# Migración de DB
docker container run --rm \
    -e DATABASE_URL="..." \
    myapp:1.2.3 \
    python manage.py migrate
```

> [!caution] No cron jobs en el host
> **No** crees cron jobs en el host que ejecuten `docker exec` para hacer tareas admin. Usa un **job scheduler** (Kubernetes CronJob, Jenkins) que lance el container one-off.

## The Reactive Manifesto

En julio de 2013, **Jonas Bonér** (cofundador/CTO de Typesafe) publicó "The Reactive Manifesto". Describe cómo los sistemas modernos deben reaccionar predeciblemente a eventos, usuarios, carga, y fallos.

### Los cuatro traits

#### Responsive

**El sistema responde rápido si es posible**. Si una operación es lenta (renderizar un PDF grande), **responde inmediatamente con "job submitted"** y notifica al usuario cuando esté listo. **No hagas esperar al usuario**.

Con containers, el sistema es **responsive por diseño**: los schedulers re-arrancan containers muertos, el load balancer re-routea traffic, y la app puede escalar.

#### Resilient

**El sistema se mantiene responsive ante fallos**. Cuando algo falla:
- **Maneja el fallo gracefully** (degrada funcionalidad, muestra error claro al usuario).
- **Reporta internamente** (logs, monitoring, alertas).
- **No** te vuelvas unresponsive — eso siempre es peor que degradar.

Con containers, los **orchestrators re-arrancan containers muertos** automáticamente. Tu trabajo como dev: diseñar la app para que la muerte de un container no sea catastrófica.

#### Elastic

**El sistema se mantiene responsive bajo carga variable**. Con Docker, esto es **dinámico**: deploy más containers cuando sube la carga, retira cuando baja. **Sin over-provisioning permanente**.

#### Message Driven

**Sistemas reactivos usan message passing asíncrono** para establecer boundaries entre componentes. Loose coupling, isolation, location transparency.

Si tu servicio A habla con B de forma síncrona y B está down, A se cuelga. **Con message queues** (RabbitMQ, Kafka, SQS), A publica mensajes y sigue. B los procesa cuando esté disponible.

> [!caution] Mensajes asíncronos no son siempre la respuesta
> Async message passing añade complejidad. **No es gratis**. Para muchos casos, una llamada HTTP síncrona con timeout y retry es más simple. Async es para casos donde la latencia, throughput, o decoupling realmente importan.

## Wrap-Up: los principios juntos

> [!quote] "Una service is only as reliable as its least reliable dependency"
> Por eso importa incorporar estas ideas en **cada componente** de tu plataforma, no solo en la app principal.

Los 12 factores y los 4 traits del Reactive Manifesto **se complementan**:

- **Twelve-Factor** te dice **cómo estructurar tu app y build pipeline**.
- **Reactive Manifesto** te dice **cómo diseñar la app para que sobreviva al fallo y escale**.

Docker provee la **infraestructura** que hace ambos viables. La **imagen inmutable** es el artefacto compartido. El **registry** es el handoff. El **scheduler** provee resilience y elasticity. Tu trabajo es **diseñar la app** siguiendo estos principios.

## Próximos pasos

- [[17-conclusion]]: cierre del libro, recapitulación de los desafíos que Docker aborda, beneficios del workflow, y palabras finales sobre el camino adelante.
