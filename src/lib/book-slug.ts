/**
 * Helpers para extraer el book-slug y el chapter-id del id de un
 * capítulo del collection `chapters`. Con el glob loader con patrón
 * de un nivel de subcarpeta el id tiene forma `"<book-slug>/<chapter-id>"`.
 */

export function bookSlugFromId(id: string): string {
	const idx = id.indexOf("/");
	return idx === -1 ? "" : id.slice(0, idx);
}

export function chapterIdFromId(id: string): string {
	const idx = id.indexOf("/");
	return idx === -1 ? id : id.slice(idx + 1);
}
