---
title: "MikroTik: Copias de seguridad rápidas y recuperación ante fallos"
description: "Cómo proteger tu trabajo con backups antes de hacer cambios, la diferencia entre exportar configuración y backup binario, y los modos del botón de Reset físico."
date: 2026-08-24
mod: 2026-08-24
published: true
tags: [backup, beginners, homelab, mikrotik, recovery, reset, routeros]
---

# Copias de seguridad rápidas y recuperación ante fallos

> [!abstract] Resumen
> Antes de experimentar con nuevas configuraciones, Wi-Fi o cortafuegos, la costumbre más sana en RouterOS es generar una copia de seguridad rápida. Esta guía explica cómo crear copias de respaldo en 10 segundos, cómo descargarlas a tu ordenador y cómo usar el **botón físico de Reset** si en algún momento cometes un fallo y necesitas devolver el router a su estado de fábrica.

---

## 1. La regla de oro: Copia antes de experimentar

Existen dos formas rápidas de guardar el estado actual de tu router:

| Característica | Método A: Export Script (`.rsc`) | Método B: Backup Binario (`.backup`) |
| :--- | :--- | :--- |
| **Formato** | Archivo de texto plano con comandos CLI legibles. | Archivo comprimido y cifrado con la imagen exacta del sistema. |
| **Contenido** | Lista de instrucciones para reconstruir la configuración. | Copia íntegra de memoria (incluye contraseñas, certificados y MACs). |
| **Portabilidad** | **Alta:** Puedes abrirlo, editarlo y cargarlo en otro router. | **Baja:** Diseñado para restaurarse en el mismo equipo físico. |
| **Control de versiones** | **Ideal para Git** y auditorías de cambios. | No editable ni versionable en texto. |
| **Restauración** | Ejecutando `/import file-name=config.rsc`. | Con 1 clic desde el botón **Restore** de Winbox. |

---

## 2. Cómo hacer un backup rápido en 2 clics (Winbox)

### Crear la copia:
1. En el menú lateral de Winbox, haz clic en **Files**.
2. En la barra de botones superior de la ventana Files, haz clic en **Backup**.
3. Ponle un nombre descriptivo (ej: `backup-antes-de-vlan`) y una contraseña opcional.
4. Haz clic en **Backup**.
5. Verás aparecer en la lista el archivo `backup-antes-de-vlan.backup`.

### Guardarlo en tu PC:
- **Arrastrar y soltar:** Simplemente haz clic sobre el archivo en la lista de Winbox y arrástralo con el ratón a una carpeta de tu ordenador o al escritorio. ¡Listo!

```routeros
# También puedes generarlo al instante por consola:
/system backup save name="backup-rapido"
```

---

## 3. Exportar la configuración legible (`.rsc`)

Para tener un archivo de texto con todos los comandos de tu router:

Abre la **New Terminal** y escribe:
```routeros
/export file=mi-configuracion show-sensitive
```

Se creará en la ventana **Files** un archivo llamado `mi-configuracion.rsc`. Puedes abrirlo con cualquier editor de texto (como VS Code, Bloc de Notas u Obsidian) para ver línea por línea cómo está montada tu red.

---

## 4. Cómo restaurar una copia si algo falla

### Restaurar el archivo `.backup`:
1. Ve a **Files**.
2. Si el archivo está en tu PC, arrástralo dentro de la ventana Files de Winbox.
3. Selecciónalo en la lista y haz clic en el botón superior **Restore**.
4. Confirma el reinicio: el router se reiniciará y volverá exactamente al estado en el que hiciste la copia.

---

## 5. La salida de emergencia física: El botón de Reset

Si por accidente aplicaste una configuración errónea sin Safe Mode, perdiste la contraseña o no puedes entrar ni por IP ni por dirección MAC, todos los routers MikroTik disponen de un **botón físico de Reset** (en la parte trasera).

```
          [ BOTÓN DE RESET ]               [ LED ACT / USR ]
                  │                                │
                  ▼                                ▼
       Mantener pulsado con            Observar el parpadeo
       un clip o bolígrafo             del indicador luminoso
```

### Procedimiento exacto de Reset de fábrica:
1. **Desenchufa el cable de alimentación** del MikroTik.
2. Mantén presionado el botón de **Reset** con la punta de un bolígrafo o un clip.
3. **Sin soltar el botón**, vuelve a enchufar el cable de corriente eléctrica.
4. Observa la luz LED marcada como **ACT** o **USR**:
   - **A los 5 segundos:** La luz empieza a parpadear.
   - **¡SUELTA EL BOTÓN AHORA!**
5. El router se reiniciará solo y volverá a cargar la configuración por defecto de fábrica (**defconf**) con IP `192.168.88.1` y usuario `admin`.

> [!danger] No mantengas el botón más de 10 segundos
> - Si lo mantienes **más de 10 segundos** (hasta que la luz queda fija), el router entra en modo **Netinstall** (espera reinstalación de firmware por cable de red).
> - Para un reseteo normal, suelta el botón en cuanto la luz empiece a parpadear (alrededor de 5 segundos).
