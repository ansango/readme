/**
 * Calcula el tiempo de lectura aproximado de un texto markdown.
 *
 * Estrategia: limpiamos la sintaxis markdown (code blocks, imágenes,
 * links, caracteres de formato) y contamos las palabras restantes.
 * El resultado se divide por una velocidad de lectura media en
 * castellano (`WPM`).
 *
 * El cálculo es deliberadamente aproximado — el conteo de "palabras"
 * tras quitar markdown da una cifra razonable sin necesidad de
 * renderizar HTML.
 */

const WPM = 220;

export interface ReadingTime {
	minutes: number;
	words: number;
}

export function readingTime(text: string): ReadingTime {
	if (!text) return { minutes: 1, words: 0 };
	const plain = text
		// code blocks (multilínea)
		.replace(/```[\s\S]*?```/g, "")
		// inline code
		.replace(/`[^`\n]*`/g, "")
		// imágenes ![alt](src)
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		// links [text](url) → conservar text
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		// caracteres de formato markdown
		.replace(/[#*_>~|]/g, "")
		// HTML embebido suelto (lo elimina el render pero por si acaso)
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();

	const words = plain ? plain.split(/\s+/).length : 0;
	const minutes = Math.max(1, Math.round(words / WPM));
	return { minutes, words };
}

export function formatReadingTime(minutes: number): string {
	return `~${minutes} min`;
}
