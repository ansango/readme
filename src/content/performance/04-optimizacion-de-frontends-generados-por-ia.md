---
title: "Optimización y refactorización de frontends generados por IA"
description: "Patrones prácticos de refactorización de componentes web generados por LLMs: corrección de CLS, optimización de LCP, eliminación de bloqueos de INP y diagnóstico con DevTools AI"
date: 2026-08-27
mod: 2026-08-27
published: true
tags: [desarrollo, performance, react, refactoring, ai, chrome-devtools, inp, cls, lcp]
---

# Optimización y refactorización de frontends generados por IA

> [!abstract] Resumen
> Cuando un desarrollador le pide a una IA generativa una funcionalidad completa (como un panel de productos, un carrusel de imágenes o un formulario con autocompletado), el código generado suele contener patrones que destruyen las puntuaciones de Core Web Vitals. En esta nota se analiza un caso práctico de refactorización de un componente React generado por IA, abordando la eliminación de saltos de diseño (**CLS**), la aceleración de la carga del elemento principal (**LCP**), la liberación del hilo principal para garantizar interactividad fluida (**INP**) y el uso de las nuevas capacidades de diagnóstico asistido por IA en **Chrome DevTools**.

---

## Patología de un componente React generado por IA

Analicemos un componente típico generado por un LLM sin instrucciones explícitas de optimización:

```jsx
// ❌ CÓDIGO GENERADO POR IA (LLENO DE ANTIPATRONES DE RENDIMIENTO)
import React, { useState, useEffect } from 'react';
import _ from 'lodash'; // 70 KB innecesarios

export function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cascada de red en cliente (LCP tardío):
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  // Bloqueo del hilo principal en cada tecla (Mal INP):
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="catalog">
      <input 
        type="text" 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Buscar..." 
      />
      
      {loading ? (
        <p>Cargando...</p> // Sin dimensiones: provocará un salto masivo (Mal CLS)
      ) : (
        <div className="grid">
          {filtered.map(item => (
            <div key={item.id} className="card">
              {/* Imagen sin width/height ni aspect-ratio (Mal CLS): */}
              <img src={item.imageUrl} alt={item.name} />
              <h3>{item.name}</h3>
              <p>{item.price} €</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Refactorización paso a paso hacia la excelencia en CWV

Para transformar este componente en una pieza de alto rendimiento aplicamos cuatro intervenciones de ingeniería:

```text
┌─────────────────────────────────────────────────────────────┐
│                 PLAN DE REFACTORIZACIÓN                     │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Eliminar CLS              │ Atributos width/height y     │
│                              │ aspect-ratio en CSS.         │
├──────────────────────────────┼──────────────────────────────┤
│ 2. Optimizar INP             │ Concurrencia con             │
│                              │ useDeferredValue / debounce. │
├──────────────────────────────┼──────────────────────────────┤
│ 3. Acelerar LCP              │ Skeleton UI de tamaño fijo   │
│                              │ y carga prioritaria de imgs. │
├──────────────────────────────┼──────────────────────────────┤
│ 4. Eliminar dependencias     │ Suprimir librerías pesadas.  │
└──────────────────────────────┴──────────────────────────────┘
```

```jsx
// ✅ CÓDIGO REFACTORIZADO Y OPTIMIZADO PARA PRODUCCIÓN
import React, { useState, useDeferredValue, useMemo } from 'react';

export function ProductCatalogOptimized({ initialProducts = [] }) {
  const [query, setQuery] = useState('');
  // useDeferredValue permite que la UI del input responda de inmediato (INP < 50ms)
  const deferredQuery = useDeferredValue(query);

  const filteredProducts = useMemo(() => {
    if (!deferredQuery) return initialProducts;
    const cleanQuery = deferredQuery.toLowerCase().trim();
    return initialProducts.filter(p => 
      p.name.toLowerCase().includes(cleanQuery)
    );
  }, [initialProducts, deferredQuery]);

  return (
    <div className="catalog-container">
      <input 
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar productos..."
        className="search-input"
      />

      <div className="product-grid">
        {filteredProducts.map((item, index) => (
          <article key={item.id} className="product-card">
            {/* Dimensiones explícitas + lazy loading adaptativo */}
            <img 
              src={item.imageUrl} 
              alt={item.name}
              width={300}
              height={200}
              loading={index < 4 ? "eager" : "lazy"} // Las primeras 4 imágenes son críticas
              fetchPriority={index === 0 ? "high" : "auto"} // Prioridad al LCP
              className="product-image"
            />
            <h3>{item.name}</h3>
            <p className="price">{item.price} €</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

```css
/* CSS para garantizar estabilidad visual absoluta (CLS = 0) */
.product-image {
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2; /* Reserva el espacio exacto antes de que descargue la imagen */
  object-fit: cover;
  background-color: #f1f5f9; /* Skeleton placeholder sutil */
}
```

---

## Diagnóstico asistido por IA en Chrome DevTools

Las versiones modernas de **Chrome DevTools** integran capacidades de análisis mediante IA (y soporte para *Model Context Protocol* / MCP):

```text
  Grabación de Traza de Rendimiento (Performance Panel)
                     │
                     ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ Detección de "Long Tasks" (> 50 ms) en el Hilo Principal    │
  ├─────────────────────────────────────────────────────────────┤
  │ Diagnóstico IA integrado:                                   │
  │ "La función calculateLayout() tardó 142 ms debido a un      │
  │ recalculo forzado de estilos (Layout Thrashing) en la       │
  │ línea 45 de ProductList.tsx. Sugerencia: agrupar lecturas   │
  │ del DOM antes de mutaciones."                               │
  └─────────────────────────────────────────────────────────────┘
```

> [!tip] Validación obligatoria con estrangulamiento (*Throttling*)
> Las pruebas en DevTools deben ejecutarse siempre con **CPU 4x/6x Slowdown** y emulación de red **Fast 4G** para reproducir fielmente la experiencia de un dispositivo móvil de gama media y validar que el INP se mantenga en verde ($\le 200\text{ ms}$).

---

## Próximos pasos

Comprende el funcionamiento interno del navegador, su arquitectura multiproceso y el pipeline de renderizado:

- [[05-arquitectura-interna-del-navegador-y-renderizado|05: Arquitectura interna del navegador y pipeline de renderizado]]
