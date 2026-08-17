/**
 * Agregación de capítulos a nivel de libro.
 *
 * Cada libro en `src/content/<slug>/` está compuesto por un capítulo
 * índice (`00-…`) más N capítulos numerados (`01-…`, `02-…`, …). Esta
 * clase agrupa, busca el índice y produce la metadata que se muestra
 * en la estantería y la home de cada libro.
 */
import type { Chapter } from "../content.config";
import { bookSlugFromId, chapterIdFromId } from "./book-slug";

export interface Book {
	slug: string;
	/** Capítulo `00-…` del libro — aporta título/descripción/autor a nivel de libro. */
	index: Chapter;
	/** Capítulos numerados (`01-…` en adelante). Excluye el índice. */
	chapters: Chapter[];
	/** `chapters.length` — azúcar sintáctico para la UI. */
	total: number;
}

export class Books {
	/** Capitulos de un libro, agrupados por `bookSlug`. */
	static groupByBook(chapters: Chapter[]): Map<string, Chapter[]> {
		const out = new Map<string, Chapter[]>();
		for (const c of chapters) {
			const slug = bookSlugFromId(c.id);
			if (!slug) continue;
			const list = out.get(slug);
			if (list) list.push(c);
			else out.set(slug, [c]);
		}
		return out;
	}

	/** Devuelve el capítulo `00-…` de un libro o `undefined` si no existe. */
	static findIndex(bookSlug: string, chapters: Chapter[]): Chapter | undefined {
		return chapters.find((c) => {
			if (bookSlugFromId(c.id) !== bookSlug) return false;
			const id = chapterIdFromId(c.id);
			return id?.startsWith("00-");
		});
	}

	/**
	 * Estantería: agrupa capítulos por libro y construye un `Book` por
	 * cada uno que tenga capítulo índice. Orden alfabético por slug.
	 */
	static listFromChapters(chapters: Chapter[]): Book[] {
		const grouped = Books.groupByBook(chapters);
		const out: Book[] = [];
		for (const [slug, list] of grouped) {
			const index = list.find((c) => chapterIdFromId(c.id).startsWith("00-"));
			if (!index) continue; // sin índice el libro no es navegable
			out.push({ slug, index, chapters: list, total: list.length });
		}
		return out.sort((a, b) => a.slug.localeCompare(b.slug));
	}

	/** Resuelve un libro concreto a partir de su slug. */
	static findBySlug(bookSlug: string, chapters: Chapter[]): Book | undefined {
		const list = chapters.filter((c) => bookSlugFromId(c.id) === bookSlug);
		const index = Books.findIndex(bookSlug, list);
		if (!index) return undefined;
		return { slug: bookSlug, index, chapters: list, total: list.length };
	}
}
