---
title: "El paisaje en expansión"
description: "Alternativas a Docker CLI y ecosistema: nerdctl (containerd-compatible), podman y buildah (Red Hat, daemonless), Rancher Desktop (k3s + containerd/dockerd), Podman Desktop"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, nerdctl, podman, buildah, rancher-desktop, podman-desktop, containerd, daemonless]
---

# El paisaje en expansión

> [!abstract] Resumen
> Esta nota cubre el ecosistema de **alternativas y complements** a Docker CLI: **nerdctl** (Docker-compatible CLI para containerd puro), **podman y buildah** (de Red Hat, daemonless, OCI-native), **Rancher Desktop** (todo-en-uno con k3s), y **Podman Desktop**. El foco está en entender cuándo cada uno aporta algo y cuándo quedarte con Docker. Es la nota sobre "lo que hay más allá" del propio Docker.

## El panorama

El ecosistema de container tools está en constante cambio, sobre todo desde la adopción masiva de Kubernetes. Hay una **pluralidad de CLIs, runtimes, y herramientas de build** que vale la pena conocer aunque uses Docker en el día a día.

## Client tools

### nerdctl

**nerdctl** es un CLI **Docker-compatible para containerd puro**, sin Docker daemon. Si tienes un cluster Kubernetes (con kind, k3s, etc.) basado en containerd, nerdctl te da una interfaz familiar.

```bash
# Crear cluster con kind
kind create cluster --name nerdctl

# Entrar al control plane
docker container exec -ti nerdctl-control-plane /bin/bash

# Instalar nerdctl
curl -s -L "https://github.com/containerd/nerdctl/releases/download/v0.23.0/nerdctl-0.23.0-linux-${ARCH}.tar.gz" -o /tmp/nerdctl.tar.gz
tar -C /usr/local/bin -xzf /tmp/nerdctl.tar.gz

# Usar como Docker (casi idéntico)
nerdctl --namespace k8s.io container list
nerdctl --namespace k8s.io image list
nerdctl --namespace k8s.io container run --rm --net=host debian sleep 5
```

> [!tip] nerdctl como migration path
> Si vienes de Docker pero necesitas trabajar con clusters containerd-only (Kubernetes), nerdctl es la **migration path más fácil**. La mayoría de comandos Docker funcionan sin cambios. La principal diferencia es que suele necesitar `--namespace`.

### podman y buildah

**Podman** y **buildah** son tools de Red Hat que **no requieren un daemon** (a diferencia de Docker). Hablan directamente con un runtime OCI como runc.

```bash
# Instalar
apt install -y podman

# Run container (sintaxis casi idéntica a Docker)
podman container run -d --rm --name test debian sleep 120
podman container list
podman container stop test
```

**buildah** es el equivalente para build de imágenes. Una diferencia clave: **no requiere Dockerfile**; puedes scriptar todo el build en bash.

```bash
#!/usr/bin/env bash
ctr1=$(buildah from fedora)
buildah run "$ctr1" -- dnf update -y
buildah run "$ctr1" -- dnf install -y httpd
buildah config --cmd "/usr/sbin/httpd -D FOREGROUND" "$ctr1"
buildah config --port 80 "$ctr1"
buildah commit "$ctr1" myrepo/apache
```

> [!tip] Daemonless = rootless
> Sin daemon corriendo como root, podman es inherentemente más seguro. Puedes correr containers como unprivileged user sin rootless mode complejo.

> [!caution] Compatibilidad
> Podman apunta a ser Docker-compatible pero **no es 100% idéntico**. Hay diferencias en:
> - Comando de network management.
> - Build context y某些 flags de `run`.
> - Comportamiento de rootless.
>
> Para CI/CD que asume Docker, **usa Docker o nerdctl**. Para desarrollo local en Linux sin daemon, **podman es excelente**.

## All-in-one Developer Tools

Docker Desktop es el más popular, pero hay alternativas con foco distinto.

### Rancher Desktop

**Rancher Desktop** da una experiencia similar a Docker Desktop pero **con foco en Kubernetes**. Internamente usa:

- **k3s**: distribución ligera y certificada de Kubernetes.
- **containerd o dockerd** (moby): elige el container runtime.

```bash
# Después de instalar y abrir Rancher Desktop
$ ${HOME}/.rd/bin/nerdctl --namespace k8s.io image list
# REPOSITORY     TAG     IMAGE ID      …  PLATFORM
# moby/buildkit  v0.8.3  171689e43026  …  linux/amd64
```

> [!tip] Una sola VM, dos runtimes
> Rancher Desktop es interesante porque puedes elegir entre tener containerd (más Kubernetes-native) o dockerd (más Docker-compatible). Todo en una VM administrada.

> [!warning] Recursos
> Cada Desktop tool (Docker, Rancher, Podman) corre su propia VM. **No corras varios a la vez** o vas a agotar RAM y CPU.

### Podman Desktop

**Podman Desktop** provee una experiencia GUI pero usa **podman** (daemonless) bajo el capó. Ideal para devs que quieren una interfaz visual sin la dependencia del Docker daemon.

```bash
# Después de instalar y arrancar la VM
$ podman run quay.io/podman/hello
# !… Hello Podman World …!
```

```bash
# Comandos útiles
podman machine start   # arrancar VM
podman machine stop    # parar VM
```

## ¿Cuándo usar qué?

| Caso | Herramienta |
|---|---|
| Desarrollo local con Docker CLI | **Docker Desktop** o **Rancher Desktop** (con dockerd) |
| Desarrollo local sin daemon | **Podman Desktop** o **podman** en Linux |
| Cluster Kubernetes local | **Minikube**, **kind**, **Rancher Desktop** (con k3s), **k3d** |
| Producción Kubernetes | Managed services: EKS, GKE, AKS, DigitalOcean, Civo |
| Producción containers sin Kubernetes | ECS (AWS), Cloud Run (GCP), Container Apps (Azure) |
| Integración con OpenShift | **podman** y **buildah** (Red Hat ecosystem) |
| CI/CD pipelines | **Docker** o **nerdctl** según el runner |
| Single-host multi-container | **Compose** (cualquiera de los anteriores) |

## Wrap-Up: ¿qué hacer con todo esto?

El lugar de Docker en la historia de la tech está bien establecido. **No hay duda** de que la introducción de Docker llevó la tecnología de Linux containers, la extendió con image format, y la hizo accesible a engineers en todo el mundo.

> [!quote] El debate importa menos que la implementación
> Podemos discutir si las cosas son mejores o peores que antes de Docker, y qué tools son mejores. Pero al final, **mucho de eso depende de cómo cada tool se usa y cómo se diseñan los workflows**.

**No hay tool que mágicamente resuelva todos tus problemas**, y cualquier tool puede implementarse tan mal que hace todo peor. Por eso es crítico **pensar en el workflow** desde al menos tres ángulos:

1. ¿Qué inputs y outputs necesita soportar el workflow?
2. ¿Qué tan fácil es para las personas que lo usan (a diario o una vez al año)?
3. ¿Qué tan fácil es de operar y mantener para el equipo de plataforma?

Una vez que tienes claridad sobre el workflow, **elige los tools** que lo habilitan.

## Próximos pasos

- [[16-container-platform-design]]: el diseño de plataformas de containers. Twelve-Factor App methodology, Reactive Manifesto (responsive, resilient, elastic, message-driven), y cómo estas guías aplican a la arquitectura container-native.
