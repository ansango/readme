/**
 * Versiones de las dependencias principales. Se mantiene manualmente
 * (sincronizar con package.json cuando se actualicen). Existe porque
 * Vite no resuelve imports fuera del directorio src/ por defecto, así
 * que no podemos leer package.json directamente desde un .astro.
 */

export const BUILD_INFO = {
	astro: "7.1.6",
	tailwindcss: "4.3.3",
} as const;