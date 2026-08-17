---
title: Docker Minimal
description: "Docker: contenedores, imágenes, virtualización y herramientas para desarrollo y despliegue de aplicaciones"
date: 2024-12-17
mod: 2026-07-10
published: true
tags:
  - docker
  - sysadmin
---

# Docker

> [!abstract] Resumen
> Docker crea contenedores: entornos aislados y ligeros que empaquetan una app con todo lo necesario para ejecutarla, consumiendo menos recursos que una máquina virtual. Esta nota es la puerta de entrada a la guía completa (instalación, comandos, Dockerfile, volúmenes/redes y Compose).

## Definición

Docker es una popular herramienta de creación de contenedores de código abierto que se utiliza para proporcionar un entorno de ejecución portátil y consistente para aplicaciones de software, al tiempo que consume menos recursos que un servidor o una máquina virtual tradicional.

Docker utiliza contendores entornos de espacio de usuario aislados que se ejecutan a nivel del sistema operativo y comparten recursos del sistema, como el kernel y el sistema de archivos.

## Contenedores

Un contenedor es un entorno de espacio de usuario aislado y minimalista que se ejecuta a nivel del sistema operativo y comparte recursos del sistema con otras instancias. Los contenedores están diseñados para proporcionar un entorno de ejecución portátil y consistente para aplicaciones, al tiempo que consumen menos recursos que un servidor o una máquina virtual tradicional.

> [!note]
> **No es una máquina virtual completa**: Los contenedores comparten el kernel del host. Son mucho más ligeros pero con menos aislamiento que una VM tradicional. 

Esto permite un mejor uso general de los recursos informáticos en aplicaciones distribuidas de múltiples componentes y sistemas de alta disponibilidad.

A diferencia de maquina virtual, los contenedores comparten recursos del host, como el kernel y el sistema de archivos, lo que resulta en una huella más pequeña.

## Imágenes

Una **imagen** es un *paquete*, en el que se encuentra una aplicación o servicio y **todo lo necesario** (código, ejecutables, librerías, configuración, etc) para que esta aplicación pueda funcionar.

Un contenedor no es más que una imagen en funcionamiento.

Es el mismo concepto de un ejecutable. La **imagen es el ejecutable**, y el **contenedor** es cada una de las **instancias** o procesos que hay en funcionamiento. Si has lanzado el ejecutable tres veces, por ejemplo, tendrás tres instancias del ejecutable. Lo mismo para contenedores: puedes tener tres contenedores corriendo de la misma imagen.

A diferencia de la ejecución de una instancia de aplicación normal, **al detener un contenedor este queda en tu equipo** (no desaparece). Esto es útil porque puedes iniciar el contenedor de nuevo, y además es posible que en el interior de ese contenedor tengas archivos o datos que te sean de utilidad.

## Máquina virtual

Una máquina virtual, también conocida comúnmente como **VM** , es un sistema invitado que se ejecuta sobre un software de virtualización o *hipervisor* . 

VirtualBox, VMWare y QEMU son ejemplos de herramientas populares que pueden emular redes, discos y otros recursos de hardware para crear entornos virtualizados que se comportan como computadoras físicas. 

Estos entornos están aislados entre sí y del host donde está instalado el software de virtualización, y cada uno ejecuta sistemas operativos distintos.

## Por qué usar Docker

- **Rápido**: Docker es significativamente más rápido que máquinas virtuales.
- **Multiplataforma**: Funciona en Linux, Mac, Windows.
- **Inicio rápido**: Los contenedores se construyen y destruyen en segundos.
- **Sin dependencias manuales**: No repites instalaciones en cada máquina.
- **Ambiente limpio**: Cada entorno está aislado del resto.
- **Despliegue fácil**: Lleva tu app al servidor sin cambios.

> [!question] ¿Cuándo elegir una VM en lugar de Docker?
> Si necesitas aislamiento total (kernels distintos, sistemas operativos diferentes al del host, o requisitos estrictos de seguridad multi-tenant), una máquina virtual sigue siendo la opción más segura. Docker prioriza velocidad y densidad sobre aislamiento máximo.

## Continuar leyendo

Sigue el camino de aprendizaje en este orden:

### Instalación
- [[01-instalar-docker-en-linux|Instalar Docker en Linux]]
- [[02-instalar-docker-en-mac|Instalar Docker en Mac]]

### Fundamentos
- [[03-comandos-basicos|Comandos básicos de Docker]] (`run`, `ps`, `exec`, `logs`, etc.)
- [[04-dockerfile|Dockerfile]] (crear imágenes propias)
- [[05-volumenes-y-redes|Volúmenes y redes]] (persistencia y comunicación entre contenedores)

### Orquestación
- [[06-docker-compose|Docker Compose]] (aplicaciones multicontenedor)
- [[07-composerize|Composerize]] (convertir `docker run` a `docker-compose.yml`)

