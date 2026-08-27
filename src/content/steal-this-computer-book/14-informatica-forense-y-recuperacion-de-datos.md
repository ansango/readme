---
title: "Informática forense: recuperación y destrucción de datos"
description: "Principios de análisis forense digital: persistencia de datos en sistemas de archivos (FAT/NTFS), espacio no asignado (slack space), swap y técnicas de borrado seguro irreversible (shredding)"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, forensics, data-recovery, slack-space, shredding, privacy, file-systems]
---

# Informática forense: recuperación y destrucción de datos

> [!abstract] Resumen
> Borrar un archivo desde el explorador del sistema operativo o vaciar la papelera de reciclaje no destruye la información almacenada en el soporte físico. La **informática forense** explota el diseño de los sistemas de archivos para reconstruir documentos borrados, extraer historiales ocultos en el archivo de intercambio (*swap*) y descubrir datos ocultos en el espacio no asignado (**Slack Space**). En esta nota se analiza cómo operan los investigadores forenses para recuperar evidencias y qué algoritmos de sobreescritura criptográfica (**File Shredding**) garantizan la eliminación irreversible de información confidencial.

---

## La ilusión del borrado en los sistemas de archivos

Los sistemas de archivos convencionales (FAT32, NTFS, ext3/ext4) optimizan la velocidad de operación sobre la seguridad. Cuando un usuario "elimina" un archivo:

```text
  1. Estado Inicial (Archivo 'secreto.doc' en Clúster 105)
  [ Tabla de Asignación / MFT ] ──► "secreto.doc" apunta a Clúster 105 (Marcado Ocupado)
  [ Superficie del Disco ]      ──► [ Datos reales del documento ]
  
  2. Tras pulsar "Eliminar" (Borrado Lógico)
  [ Tabla de Asignación / MFT ] ──► Primer caracter marcado con '0xE5' / Clúster 105 marcado como DISPONIBLE
  [ Superficie del Disco ]      ──► [ Los datos siguen 100% INTACTOS en el Clúster 105 ]
```

- **Mecanismo:** El sistema operativo únicamente desvincula el puntero en la tabla de asignación de archivos (FAT o MFT en NTFS) y marca los clústeres como "disponibles para futura sobreescritura". Los datos magnéticos u ópticos permanecen intactos hasta que otro archivo nuevo los sobrescriba por azar.

---

## Dónde se esconden los datos: *Slack Space* y *Swap*

Los analistas forenses buscan evidencias en áreas de almacenamiento que escapan a la vista del explorador de archivos:

```text
┌─────────────────────────────────────────────────────────────┐
│                    UN CLÚSTER DE 4096 BYTES                 │
├──────────────────────────────┬──────────────────────────────┤
│ Datos del archivo (1500 B)   │ Slack Space / Espacio Libre  │
│ Información real guardada    │ (2596 B de datos antiguos    │
│ por la aplicación.           │ de la memoria RAM o disco).  │
└──────────────────────────────┴──────────────────────────────┘
```

### 1. Espacio no asignado (*File Slack / Slack Space*)
Los sistemas de archivos asignan espacio en bloques fijos de tamaño estándar (clústeres de 4 KB u 8 KB). Si un documento ocupa 1.500 bytes en un clúster de 4.096 bytes, los 2.596 bytes restantes (*slack space*) se rellenan con fragmentos de memoria RAM o datos residuales que residían previamente en ese sector del disco, permitiendo recuperar contraseñas o fragmentos de correos antiguos.

### 2. Archivos de intercambio (*Swap* / `pagefile.sys`)
Cuando la memoria RAM física se satura, el sistema operativo vuelca páginas enteras de memoria activa al disco duro (`pagefile.sys` en Windows o partición *swap* en Linux). Este archivo contiene textos sin cifrar, claves de sesión, credenciales recién tecleadas y documentos abiertos que nunca se guardaron conscientemente en disco.

---

## Herramientas y técnicas de investigación forense

```text
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Herramienta     │ Función en la investigación                               │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Duplicación   │ Clonado bit a bit del disco (`dd`, EnCase, FTK Imager)    │
│ Forense**       │ usando bloqueadores de escritura hardware (*Write         │
│                 │ Blockers*) para no alterar los sellos temporales (MAC).   │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Editores      │ Inspección directa de sectores en crudo (*raw sectors*)   │
│ Hexadecimales** │ sin intermediación del sistema de archivos (WinHex).      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **File Carving**│ Extracción de archivos huérfanos buscando cabeceras       │
│                 │ (*headers*) y pies de archivo conocidos (e.g., `FF D8 FF` │
│                 │ para imágenes JPEG o `%PDF` para documentos PDF).         │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Destrucción segura de datos (*Data Shredding*)

Para evitar que un adversario o un laboratorio forense recupere información de un soporte que va a desecharse o reutilizarse, se emplean algoritmos de sobreescritura destructiva múltiple:

| Estándar de borrado | Pasadas de sobreescritura | Patrón de datos | Nivel de seguridad |
|---|---|---|---|
| **Zero-Fill (Cero único)** | 1 pasada | Escribe `0x00` en todo el disco. | Suficiente contra herramientas de software convencionales. |
| **DoD 5220.22-M (Militar)** | 3 pasadas | 1ª: ceros (`0x00`), 2ª: unos (`0xFF`), 3ª: datos pseudoaleatorios. | Estándar de defensa del gobierno estadounidense. |
| **Método Gutmann** | 35 pasadas | Secuencias diseñadas para anular la remanencia magnética en platos antiguos MFM/RLL. | Máxima seguridad teórica para discos magnéticos rotacionales. |

> [!danger] Borrado seguro en discos SSD / Memorias Flash
> Los algoritmos clásicos de sobreescritura diseñados para discos mecánicos (como Gutmann) no funcionan de forma predecible en unidades SSD debido a los controladores de nivelación de desgaste (*Wear Leveling*). En memorias Flash modernas se debe utilizar el comando de borrado de hardware ATA Secure Erase o cifrado de disco completo (BitLocker / LUKS) con destrucción de la clave de cabecera (*crypto-shredding*).

---

## Próximos pasos

Aprende a proteger y fortificar tu sistema contra ataques físicos y lógicos mediante buenas prácticas de bastionado:

- [[15-bastionado-y-defensa-integral-del-sistema|15: Bastionado, seguridad física y defensa integral]]
