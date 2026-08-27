---
title: "MikroTik: Copias de seguridad y ciclo de mantenimiento en RouterOS"
description: "Diferencias críticas entre backups binarios y exports RSC en texto plano, automatización de copias y procedimiento seguro de actualización de RouterOS y firmware RouterBOOT."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [backup, homelab, maintenance, mikrotik, networking, routeros, sysadmin]
---

# Copias de seguridad y ciclo de mantenimiento en RouterOS

> [!abstract] Resumen
> Gestionar de forma profesional un router MikroTik requiere conocer la diferencia fundamental entre una copia binaria (`.backup`) y una exportación de configuración en texto plano (`.rsc`), así como seguir un protocolo seguro para actualizar tanto los paquetes del sistema operativo (**RouterOS**) como el microcódigo de arranque del hardware (**RouterBOOT**).

---

## 1. Copia Binaria (`.backup`) vs Exportación de Configuración (`.rsc`)

Es un error común confundir ambos métodos. Cada uno tiene una finalidad completamente distinta:

| Característica | Copia Binaria (`/system backup`) | Exportación Script (`/export`) |
| :--- | :--- | :--- |
| **Formato** | Archivo binario cifrado / comprimido (`.backup`) | Archivo de texto plano con comandos CLI (`.rsc`) |
| **Contenido** | Imagen exacta del sistema (usuarios, certificados SSL, claves privadas, direcciones MAC de interfaces). | Script con todos los comandos necesarios para recrear la configuración. |
| **Portabilidad** | **Baja:** Solo debe restaurarse en el mismo dispositivo físico (o mismo modelo idéntico). Si se restaura en otro router, duplicará direcciones MAC y romperá interfaces. | **Alta:** Totalmente portable. Puedes editarlo con un editor de texto antes de cargarlo en otro modelo. |
| **Control de versiones** | No apto para Git / diff. | **Ideal para Git**, auditorías de cambios y backups automáticos. |

---

## 2. Generación de Respaldos por CLI

### 2.1. Exportación de configuración en texto plano (`.rsc`)

```routeros
# Exportar configuración completa incluyendo contraseñas/claves
/export file=config-homelab-completa show-sensitive

# Exportar configuración limpia (omite claves para compartir públicamente o versionar)
/export file=config-homelab-segura hide-sensitive
```

### 2.2. Copia de seguridad del sistema completo (`.backup`)

```routeros
# Crear copia binaria cifrada con contraseña
/system backup save name=backup-full-router encryption=aes-sha256 password="TuContraseñaDeCifrado"
```

Los archivos generados se almacenan en el menú **Files** de RouterOS y pueden descargarse mediante Winbox (arrastrar y soltar), WebFig o SCP/SFTP.

---

## 3. Restauración de Configuraciones

### Restaurar un archivo binario `.backup`
```routeros
/system backup load name=backup-full-router.backup password="TuContraseñaDeCifrado"
```

### Importar un script `.rsc`
```routeros
/import file-name=config-homelab-completa.rsc
```

> [!warning] Cargar scripts en un router reseteado
> Para aplicar un archivo `.rsc` de forma limpia en un equipo restablecido de fábrica, utiliza el comando de reseteo con auto-importación:
> ```routeros
> /system reset-configuration no-defaults=yes run-after-reset=config-homelab-completa.rsc
> ```

---

## 4. Ciclo de Actualización Seguro: RouterOS + RouterBOOT

El proceso de actualización consta de dos pasos obligatorios: primero el sistema operativo y después el firmware de la placa base (*bootloader*).

### Paso 1: Actualizar paquetes de RouterOS

```routeros
# 1. Configurar canal de actualización a versión estable
/system package update set channel=stable

# 2. Comprobar si existen nuevas versiones
/system package update check-for-updates

# 3. Descargar e instalar la actualización (reinicia automáticamente)
/system package update install
```

### Paso 2: Actualizar microcódigo RouterBOOT (¡Paso imprescindible!)

Tras reiniciar el router con la nueva versión de RouterOS, el firmware de la placa no se actualiza solo:

```routeros
# 1. Comprobar si current-firmware es inferior a upgrade-firmware
/system routerboard print
```

*Si `upgrade-firmware` es más reciente:*

```routeros
# 2. Actualizar el bootloader
/system routerboard upgrade

# 3. Confirmar escribiendo 'y' y reiniciar para aplicar
/system reboot
```

> [!tip] ¿Por qué es crucial actualizar RouterBOOT?
> Actualizar RouterBOOT garantiza la estabilidad de la memoria NAND/Flash, soluciona incompatibilidades con nuevos controladores de radio Wi-Fi 6 y asegura que el router arranque correctamente tras cortes eléctricos.
