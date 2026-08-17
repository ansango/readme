/**
 * Approximate reading time of a markdown text.
 *
 * Strategy: strip markdown syntax (code blocks, images, links,
 * formatting characters) and count the remaining words. The result
 * is divided by an average reading speed in words per minute (WPM).
 *
 * The calculation is deliberately approximate — counting "words"
 * after removing markdown gives a reasonable figure without having
 * to render HTML.
 */

const WPM = 220;

export interface ReadingTime {
	minutes: number;
	words: number;
}

export function readingTime(text: string): ReadingTime {
	if (!text) return { minutes: 1, words: 0 };
	const plain = text
		// code blocks (multiline)
		.replace(/```[\s\S]*?```/g, "")
		// inline code
		.replace(/`[^`\n]*`/g, "")
		// images ![alt](src)
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		// links [text](url) → keep text
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		// markdown formatting characters
		.replace(/[#*_>~|]/g, "")
		// loose embedded HTML (the render strips it but just in case)
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
