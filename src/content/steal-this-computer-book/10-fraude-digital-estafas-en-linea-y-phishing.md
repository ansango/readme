---
title: "Fraude digital, estafas en línea y phishing"
description: "Ingeniería del cibercrimen financiero: estafas de honorarios por adelantado (cartas nigerianas 419), esquemas Ponzi, clonación web (phishing), fraudes en subastas y carding"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [ciberseguridad, fraud, phishing, scams, carding, ponzi, social-engineering, 419]
---

# Fraude digital, estafas en línea y phishing

> [!abstract] Resumen
> El mayor volumen de pérdidas económicas en Internet no procede de sofisticados ciberataques contra infraestructuras críticas, sino de la traslación y automatización masiva de los **timos y estafas tradicionales** al medio digital. En esta nota se analizan los mecanismos psicológicos y técnicos del cibercrimen financiero: desde las estafas de honorarios por adelantado (*Advance Fee Fraud* o cartas nigerianas 419) y esquemas piramidales/Ponzi, hasta el **phishing bancario**, la suplantación de identidad web (*web spoofing*), los dialers de tarificación internacional y el mercado negro de tarjetas de crédito (*carding*).

---

## La anatomía psicológica del engaño digital

Todos los fraudes por Internet operan bajo un patrón psicológico constante de tres etapas:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. La Promesa   │ ────► │ 2. Explotación  │ ────► │ 3. La Extracción│
│ Ganancia masiva │       │ de la Confianza │       │ Envío de dinero │
│ o falsa urgencia│       │ y Aislamiento   │       │ o credenciales  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **La Promesa desproporcionada o Urgencia ficticia:** Ofrecer recompensas astronómicas a cambio de un mínimo esfuerzo (herencias millonarias, trabajos de empaquetado desde casa) o sembrar pánico inmediato (*"Su cuenta bancaria será clausurada en 24 horas"*).
2. **Explotación de la confianza y secretismo:** Pedir a la víctima que mantenga la operación en secreto ("por razones fiscales o legales") para evitar que consulte con familiares o asesores profesionales.
3. **Extracción y escalada de pagos:** Exigir pagos iniciales menores bajo conceptos de "tasas notariales", "aranceles aduaneros" o "comisiones de transferencia".

---

## Catálogo de estafas digitales clásicas

```text
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Tipo de Estafa  │ Mecanismo operativo                                       │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Cartas        │ Un supuesto dignatario o abogado afirma necesitar ayuda   │
│ Nigerianas 419**│ para liberar fondos millonarios retenidos a cambio del    │
│                 │ 20-30%, exigiendo continuos anticipos para trámites.      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Esquemas      │ Falsas inversiones de rentabilidad garantizada donde los  │
│ Ponzi / Pirámide│ beneficios de los inversores antiguos se pagan con el     │
│                 │ dinero de los nuevos usuarios hasta el colapso total.     │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Falsa Caridad │ Creación de dominios y páginas de donación fraudulentas   │
│ (*Charity*)**   │ inmediatamente tras catástrofes naturales o terremotos.   │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Romance Scam  │ Perfiles falsos en portales de citas que cultivan un      │
│ (Catfishing)**  │ vínculo emocional para solicitar transferencias urgentes. │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ **Mulas / Work  │ Ofertas de trabajo desde casa para recibir transferencias │
│ at Home**       │ ilícitas o paquetería robada y reenviarla al extranjero.  │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Phishing y Suplantación Web (*Web Spoofing*)

El phishing es la técnica de ingeniería social técnica mediante la cual los atacantes clonan la interfaz gráfica y correos corporativos de una entidad bancaria, pasarela de pago o proveedor de servicios para recolectar credenciales en plano.

```text
  1. Correo Falsificado
  [ Alerta Banco Falso ] ─── Enlace: "http://www.banco-seguro.com.evil.ru" ───► [ Víctima ]
                                                                                   │
  2. Portal Clonado (Web Spoofing)                                                 │
  [ Formulario Idéntico ] ◄────────────────────────────────────────────────────────┘
          │
          ▼ (Usuario introduce Clave y PIN)
  [ Base de Datos del Atacante ] ──► [ Vaciamiento de Fondos / Reventa ]
```

### Técnicas técnicas de ofuscación de URL:
- **Typosquatting y dominios homógrafos:** Registrar dominios visualmente idénticos (`paypa1.com`, `bank0famerica.com`, o caracteres cirílicos idénticos en UTF-8).
- **Subdominios engañosos:** `https://www.paypal.com.login-security-update.net/` (donde el dominio real es `login-security-update.net`).
- **Inyección de falsos certificados SSL:** Portales maliciosos con candado verde que cifran la conexión contra el servidor del estafador, engañando al usuario que asume que el candado valida la legitimidad de la empresa.

---

## Fraudes en subastas, *Dialers* y *Carding*

1. **Fraude en subastas online (eBay / Escrow falso):** El atacante solicita realizar la transacción a través de un servicio de depósito en custodia (*escrow service*) inventado por él mismo. La víctima transfiere los fondos y el producto nunca se envía.
2. **Marcadores telefónicos (*Porn Dialers*):** En la era del módem analógico, programas maliciosos desconectaban silenciosamente la llamada local del usuario y marcaban números satelitales de tarificación astronómica (Vanuatu, Niue, Moldavia) generando facturas de miles de dólares.
3. **Carding (Mercado negro de tarjetas de crédito):** Redes organizadas que capturan números de tarjeta mediante *skimmers* en cajeros, *sniffers* de pasarelas de pago o inyecciones SQL, revendiendo los datos en foros clandestinos para la compra de bienes electrónicos de fácil reventa.
4. **La estafa de la sala de recuperación (*Recovery Room Scam*):** El atacante contacta a personas que ya han sido estafadas haciéndose pasar por investigadores del FBI o detectives privados, cobrándoles una comisión por adelantado para "recuperar el dinero perdido".

---

## Próximos pasos

Aprende cómo los investigadores y atacantes recopilan información de personas mediante fuentes abiertas:

- [[11-osint-rastreo-de-personas-y-privacidad|11: OSINT, rastreo de personas y huella digital]]
