---
title: "Kubernetes en detalle"
description: "Kubernetes en profundidad: pods como abstracción clave, deployments, services, kubectl, Minikube para dev local, kind, Docker Desktop Kubernetes, y managed offerings (EKS, GKE, AKS, ECS, Fargate)"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [docker, kubernetes, k8s, pods, deployments, services, kubectl, minikube, eks, gke, aks, ecs, fargate]
---

# Kubernetes en detalle

> [!abstract] Resumen
> Esta nota entra en Kubernetes en profundidad: la abstracción de **pod** (uno o más containers que comparten namespaces y volumes), deployments y services, kubectl como CLI, Minikube para tener un cluster local, kind como alternativa más simple, Docker Desktop Kubernetes para pruebas rápidas, y los managed offerings de los grandes clouds (EKS, GKE, AKS, ECS, Fargate). El objetivo es que sepas qué es Kubernetes, cuándo usarlo, y cómo empezar.

## El pod: la abstracción clave

Kubernetes añade una abstracción sobre los containers: el **pod**. Un pod es **uno o más containers que comparten cgroups, namespaces, IPs y volumes**. Es la unidad de scheduling y ejecución.

> [!note] ¿Por qué "pod"?
> El término viene de Docker: la mascota de Docker es Moby, la ballena, y un grupo de ballenas se llama "pod". Curioso pero cierto.

### ¿Por qué un pod y no un mega-container?

Un pod permite **granularidad sin perder acoplamiento**:

- Los containers en un pod se comunican en `localhost` (no necesitan service discovery entre ellos).
- Comparten el mismo IP externo (desde fuera del pod, parecen una sola entidad).
- Puedes resource-limitar cada container individualmente.
- Containers secundarios (init containers, sidecars) pueden preparar el entorno o mantener recursos compartidos.

**Regla de oro**: cada pod = una unidad funcional. Un pod con un solo container es lo más común. Multi-container pods se usan para sidecars (logging, proxy) o init containers.

> [!tip] Un proceso por container
> Aunque puedes meter varios containers en un pod, **corre un solo proceso principal por container**. Los otros containers del pod son auxiliares (sidecars, init).

## Conceptos clave de Kubernetes

| Concepto | Qué es |
|---|---|
| **Pod** | Unidad de scheduling. Uno o más containers. |
| **Deployment** | Define el estado deseado (imagen, réplicas, labels). Crea y gestiona los pods. |
| **Service** | Expone un set de pods como un servicio de red estable. Load balancing. |
| **Namespace** | Aislamiento lógico dentro de un cluster. |
| **PersistentVolume (PV)** | Storage físico en el cluster (local, NFS, EBS, etc.). |
| **PersistentVolumeClaim (PVC)** | Petición de storage por parte de un pod. |
| **ReplicaSet** | Mantiene N réplicas de un pod. Lo maneja el Deployment. |
| **Label** | Key/value pair para organizar y seleccionar recursos. |
| **kubectl** | CLI para interactuar con el cluster. |

## kubectl: el CLI

```bash
# Ver recursos
kubectl get all                  # servicios, pods, deployments, replicasets
kubectl get pods                 # solo pods
kubectl get services             # solo services
kubectl get deployments
kubectl get nodes

# Ver detalles
kubectl describe pod <name>
kubectl describe service <name>

# Logs
kubectl logs <pod_name>
kubectl logs <pod_name> -c <container_name>  # multi-container pod
kubectl logs deployment/<name>               # logs de una réplica

# Ejecutar comandos en pods
kubectl exec -it <pod_name> /bin/bash
kubectl exec -it <pod_name> -- <command>

# Aplicar configuración
kubectl apply -f deployment.yaml
kubectl apply -f ./directory/        # todos los YAML del dir

# Escalar
kubectl scale --replicas=2 deploy/<name>
kubectl scale --replicas=0 deploy/<name>   # scale to zero

# Eliminar
kubectl delete -f deployment.yaml
kubectl delete pod <name>
kubectl delete service <name>

# Proxies y port forwarding
kubectl proxy    # API server en localhost:8001
kubectl port-forward <pod> 8080:80    # forward local 8080 a pod:80
```

> [!note] kubectl get all no es "all"
> Aunque el nombre sugiere "todos los recursos", `kubectl get all` solo muestra los más comunes. Para ver TODOS, usa `kubectl api-resources` para listar tipos y `kubectl get <tipo>` para cada uno.

## Desplegar algo: el caso hello-minikube

```bash
# Crear un deployment (genera un ReplicaSet, que genera un pod)
$ kubectl create deployment hello-minikube \
    --image=kennethreitz/httpbin:latest --port=80
# deployment.apps/hello-minikube created

# Exponer el deployment como service
$ kubectl expose deployment hello-minikube --type=NodePort
# service/hello-minikube exposed

# Ver todo lo creado
$ kubectl get all
# NAME                                 READY   STATUS    RESTARTS   AGE
# pod/hello-minikube-ff49df9b8-svl68   1/1     Running   0          2m39s
# NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
# service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   98m
# NAME                             READY   UP-TO-DATE   AVAILABLE   AGE
# deployment.apps/hello-minikube   1/1     1            1           2m39s
# NAME                                       DESIRED   CURRENT   READY   AGE
# replicaset.apps/hello-minikube-ff49df9b8   1         1         1       2m39s

# Acceder desde el host
$ minikube service hello-minikube --url
# http://192.168.99.100:30616
```

`kubectl create deployment` + `kubectl expose deployment` es el flujo mínimo. Para producción, defines todo en YAML y haces `kubectl apply`.

## Manifiestos YAML: la forma declarativa

```yaml
# Service definition
apiVersion: v1
kind: Service
metadata:
  name: lazyraster
  labels:
    app: lazyraster
spec:
  type: NodePort
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
  selector:
    app: lazyraster
---
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cache-data-claim
  labels:
    app: lazyraster
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Mi
---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lazyraster
  labels:
    app: lazyraster
spec:
  selector:
    matchLabels:
      app: lazyraster
  strategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: lazyraster
    spec:
      containers:
      - image: relistan/lazyraster:demo
        name: lazyraster
        env:
        - name: RASTER_RING_TYPE
          value: memberlist
        - name: RASTER_BASE_DIR
          value: /data
        ports:
        - containerPort: 8000
          name: lazyraster
        volumeMounts:
        - name: cache-data
          mountPath: /data
      volumes:
      - name: cache-data
        persistentVolumeClaim:
          claimName: cache-data-claim
```

Aplica todo con un comando:

```bash
kubectl apply -f lazyraster-service.yaml
# service/lazyraster created
# persistentvolumeclaim/cache-data-claim created
# deployment.apps/lazyraster created
```

> [!tip] RollingUpdate por default
> El `strategy: type: RollingUpdate` en el deployment hace que Kubernetes **actualice los pods uno por uno** durante un deploy. Cero downtime por default. `Recreate` tira todos los pods y crea nuevos (downtime, pero más simple para stateful apps).

## Escalar en Kubernetes

```bash
# Escalar a 2 réplicas
$ kubectl scale --replicas=2 deploy/lazyraster
# deployment.apps/lazyraster scaled

# Ver el estado
$ kubectl get deployment/lazyraster
# NAME         READY   UP-TO-DATE   AVAILABLE   AGE
# lazyraster   2/2     2            2           16m

# Logs de un pod específico (de las réplicas)
$ kubectl logs <pod_name>
```

## Minikube: Kubernetes local

**Minikube** crea un cluster de un solo nodo en una VM o container local. Es ideal para **desarrollo y aprendizaje**.

```bash
# Instalar (macOS con Homebrew)
$ brew install minikube
$ brew install kubernetes-cli

# Iniciar cluster
$ minikube start
# minikube v1.26.1 on Darwin 12.5.1 (arm64)
# Automatically selected the docker driver
# Starting control plane node minikube in cluster minikube
# Done! kubectl is now configured to use "minikube" cluster

# Dashboard web
$ minikube dashboard

# Comandos útiles
$ minikube status
$ minikube ip          # IP del cluster
$ minikube stop
$ minikube delete      # limpieza completa
```

> [!tip] SSH al nodo de Minikube
> ```bash
> $ minikube ssh
> # Verás que Minikube corre Kubernetes como containers dentro de la VM
> $ docker container ls
> # Verás kube-apiserver, kube-scheduler, etcd, etc.
> ```

Alternativas para Kubernetes local:

| Herramienta | Notas |
|---|---|
| **Minikube** | VM o container, distribución completa |
| **kind** | Containers Docker, más simple, multi-nodo para HA testing |
| **k3d** | k3s (lightweight k8s) en containers Docker |
| **k3s** | Distribución ligera de Kubernetes |
| **k0s** | Zero-friction k8s |
| **microk8s** | Snap-based, ideal para Linux |
| **Docker Desktop Kubernetes** | Built-in, single-node, no configurable |

### kind: Kubernetes en Docker

```bash
$ kind create cluster --name test
# Creating cluster "test" ...
# ✓ Ensuring node image (kindest/node:v1.25.3)
# ✓ Starting control-plane
$ kubectl cluster-info
$ kind delete cluster --name test
```

## Docker Desktop Kubernetes

Docker Desktop trae un cluster single-node integrado. Para habilitarlo: Preferences → Kubernetes → Enable Kubernetes.

> [!warning] No es para producción
> El cluster integrado de Docker Desktop es **single-node, no configurable, y pensado para pruebas locales**. Para staging o producción, usa un cluster real.

## Managed Kubernetes offerings

Para producción, los grandes clouds ofrecen Kubernetes managed. Tú gestionas los workloads, ellos gestionan el control plane.

| Servicio | Cloud | Notas |
|---|---|---|
| **EKS** (Elastic Kubernetes Service) | AWS | Compatible con la mayoría del ecosistema AWS (IAM, VPC, EBS). |
| **GKE** (Google Kubernetes Engine) | Google Cloud | El más maduro; Autopilot mode para "no gestionar nodos". |
| **AKS** (Azure Kubernetes Service) | Azure | Integración fuerte con Active Directory y Azure DevOps. |
| **DigitalOcean Kubernetes** | DigitalOcean | Más simple y barato, ideal para startups. |
| **Civo Kubernetes** | Civo | Managed k8s con precios bajos. |

### Amazon ECS y Fargate

**ECS** (Elastic Container Service) es la alternativa de AWS a Kubernetes: **first-class en AWS**, sin operar un cluster Kubernetes. **Fargate** es la opción serverless: AWS maneja los nodos por ti, tú solo defines tasks.

```bash
# Crear un cluster ECS con Fargate
aws ecs create-cluster --cluster-name my-cluster

# Registrar una task definition
aws ecs register-task-definition --cli-input-json file://task-def.json

# Lanzar el service
aws ecs create-service --cluster my-cluster --service-name my-service \
    --task-definition my-task:1 --desired-count 2 \
    --launch-type FARGATE
```

> [!tip] ECS vs EKS
> - **ECS**: tightly integrated con AWS, más simple, sin Kubernetes que aprender.
> - **EKS**: Kubernetes estándar, portabilidad multi-cloud, ecosistema más grande.
>
> Si todo tu infra es AWS y no necesitas portabilidad multi-cloud, **ECS puede ser más simple**. Si anticipas multi-cloud o quieres evitar lock-in, **EKS**.

## API de Kubernetes con kubectl proxy

`kubectl proxy` expone el API server en `http://localhost:8001`:

```bash
$ kubectl proxy
# Starting to serve on 127.0.0.1:8001

# Desde otro terminal
$ curl http://localhost:8001/api/v1/namespaces/default/endpoints/lazyraster
# Devuelve JSON con los endpoints del service
```

Útil para **scripting** y para entender cómo funcionan las herramientas de Kubernetes internamente.

> [!tip] Casi todo está en la API
> El dashboard web de Kubernetes está construido sobre esta API. **Casi todo lo que ves en el dashboard, lo puedes hacer con `kubectl`** (o `curl` al proxy). Eso lo hace muy scriptable.

## Cuándo usar Kubernetes (y cuándo no)

### Úsalo cuando

- Tu equipo es de 5+ engineers.
- Tienes múltiples servicios que necesitan coordinarse.
- Necesitas scheduling, auto-healing, rolling updates a escala.
- Quieres portabilidad multi-cloud.
- Estás dispuesto a invertir tiempo en aprenderlo y mantenerlo (o pagar un managed service).

### No lo uses cuando

- **Single-host deployment** funciona (usa Compose).
- **Serverless o PaaS** (Cloud Run, App Engine, Vercel) cubre tu caso.
- Tu equipo no tiene tiempo para aprender la complejidad operacional.

> [!quote] Si tu app cabe en un solo container, considera serverless antes que Kubernetes. La complejidad de k8s solo se justifica a escala.**

## Próximos pasos

- [[13-advanced-topics]]: cómo funciona Docker por dentro — cgroups (CPU, memoria, I/O), namespaces (mount, UTS, IPC, network, PID, user), debugging avanzado con `nsenter`.
