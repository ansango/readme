/**
 * Helpers to extract the book-slug and chapter-id from the id of a
 * chapter of the `chapters` collection. With the glob loader using a
 * one-level subfolder pattern, the id has the form `"<book-slug>/<chapter-id>"`.
 */

export function bookSlugFromId(id: string): string {
	const idx = id.indexOf("/");
	return idx === -1 ? "" : id.slice(0, idx);
}

export function chapterIdFromId(id: string): string {
	const idx = id.indexOf("/");
	return idx === -1 ? id : id.slice(idx + 1);
}
