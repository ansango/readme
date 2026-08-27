---
title: "La industria del lucro: spam, adware y spyware"
description: "La comercialización del malware y la economía subterránea: botnets de spam, filtros bayesianos, spamdexing (Black Hat SEO), BHOs y spyware publicitario"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, spam, adware, spyware, botnets, black-hat-seo, bho, tracking]
---

# La industria del lucro: spam, adware y spyware

> [!abstract] Resumen
> Durante la década del 2000, el hacking experimentó una mutación irreversible: la curiosidad técnica y el vandalismo adolescente fueron reemplazados por una **industria criminal y publicitaria multimillonaria orientada al lucro**. Wallace Wang disecciona en detalle los engranajes de esta economía subterránea: las infraestructuras de envío masivo de **spam** basadas en botnets, la evasión de filtros bayesianos, la manipulación de motores de búsqueda (**Spamdexing / Black Hat SEO**), el fraude por clic y el auge del **adware/spyware** corporativo que secuestraba navegadores mediante *Browser Helper Objects* (BHOs).

---

## La economía y maquinaria del Spam

El spam (correo electrónico no solicitado masivo) no es un fenómeno accidental; es un modelo de negocio con un coste marginal prácticamente nulo que se sostiene gracias a la explotación de ordenadores zombi (*botnets*).

```text
  Recolector de Emails            Botnet (Miles de PCs infectados)           Víctimas
  ┌──────────────────────┐         ┌──────────────────────────────┐         ┌───────────────┐
  │ Scrapers en foros    │ ──────► │ Envío distribuido a través   │ ──────► │ Bandejas de   │
  │ y código web         │         │ de proxies SOCKS y relés     │         │ entrada de    │
  └──────────────────────┘         │ SMTP abiertos                │         │ millones de   │
                                   └──────────────────────────────┘         │ usuarios      │
                                                                            └───────────────┘
```

### Técnicas de los emisores de spam:
1. **Recolección masiva (*Email Harvesting*):** Arañas web que extraen direcciones de páginas públicas, libros de visitas y grupos de Usenet.
2. **Falsificación de cabeceras (*Header Spoofing*):** Alteración de las cabeceras `From:` y `Reply-To:` del protocolo SMTP para camuflar el origen real.
3. **Evasión de filtros bayesianos (*Bayesian Poisoning* / *Hash Busting*):** Inserción de textos aleatorios de novelas clásicas o palabras de diccionario en texto invisible para alterar las probabilidades estadísticas del filtro bayesiano y evitar que el correo sea clasificado como basura.

### Mecanismos de defensa:
- **Listas negras por DNS (*DNSBL*):** Bases de datos en tiempo real (como *Spamhaus*) que bloquean IPs de redes residenciales y servidores conocidos por retransmitir spam.
- **Filtrado Bayesiano:** Algoritmos que calculan la probabilidad matemática de que un mensaje sea spam según la presencia y frecuencia de palabras específicas.

---

## Manipulación de buscadores: *Spamdexing* (Black Hat SEO)

Para desviar tráfico hacia tiendas fraudulentas y portales de afiliados, los atacantes explotaban los algoritmos de clasificación de los motores de búsqueda mediante técnicas de *spamdexing*:

```text
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Técnica SEO     │ Funcionamiento                                            │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Keyword       │ Inserción masiva de palabras clave repetidas con texto    │
│ Stuffing**      │ del mismo color que el fondo (invisible para el usuario,  │
│                 │ pero leído por la araña del buscador).                    │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Granjas de    │ Redes de miles de dominios artificiales interconectados   │
│ Enlaces**       │ entre sí para inflar artificialmente el *PageRank*.       │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Encubrimiento │ El servidor detecta la IP del rastreador (Googlebot) y le │
│ (*Cloaking*)**  │ sirve un artículo académico, mientras que a un usuario    │
│                 │ real le muestra una tienda de medicamentos falsificados.  │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Doorway       │ Páginas intermedias optimizadas para una búsqueda que     │
│ Pages**         │ redirigen instantáneamente (*meta refresh*) a otra web.   │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## El negocio del Spyware y Adware corporativo

A principios de los 2000, empresas legales de publicidad crearon utilidades aparentemente gratuitas (reproductores, barras de herramientas, asistentes animados como *BonziBuddy*) que integraban módulos espía como *Gator/Claria* o *SaveNow*.

```text
  Instalación de Software "Gratuito" ──► Inyección de BHO en Internet Explorer
                                                    │
                                                    ▼
                     ┌─────────────────────────────────────────────┐
                     │ Monitoriza cada URL visitada en tiempo real │
                     │ Dispara anuncios Pop-up y Pop-under         │
                     │ Secuestra la página de inicio (Hijacking)   │
                     │ Envía historial de navegación a servidores  │
                     └─────────────────────────────────────────────┘
```

### Vectores de persistencia en Windows:
- **Browser Helper Objects (BHOs):** DLLs que se cargaban automáticamente dentro del espacio de memoria de Internet Explorer cada vez que se abría el navegador, interceptando todos los eventos de navegación y formularios.
- **Drive-by Downloads:** Infección silenciosa al visitar una página web que explotaba controles ActiveX sin firmar o fallos de seguridad en navegadores desactualizados.
- **Claves de inicio en el Registro:** Inserción en `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` para asegurar la ejecución en cada reinicio del sistema.

---

## Próximos pasos

Aprende cómo la informática forense permite reconstruir y recuperar datos borrados o destruir información de forma irreversible:

- [[14-informatica-forense-y-recuperacion-de-datos|14: Informática forense: recuperación y destrucción de datos]]
