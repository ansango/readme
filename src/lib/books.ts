/**
 * Chapter aggregation at the book level.
 *
 * Each book in `src/content/<slug>/` is made of an index chapter
 * (`00-…`) plus N numbered chapters (`01-…`, `02-…`, …). This class
 * groups them, locates the index, and produces the metadata shown on
 * the bookshelf and each book's home.
 */
import type { Chapter } from "../content.config";
import { bookSlugFromId, chapterIdFromId } from "./book-slug";

export interface Book {
	slug: string;
	/** `00-…` chapter of the book — provides title/description/author at book level. */
	index: Chapter;
	/** Numbered chapters (`01-…` onwards). Excludes the index. */
	chapters: Chapter[];
	/** `chapters.length` — syntactic sugar for the UI. */
	total: number;
}

export class Books {
	/** Chapters of a book, grouped by `bookSlug`. */
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

	/** Returns the `00-…` chapter of a book, or `undefined` if missing. */
	static findIndex(bookSlug: string, chapters: Chapter[]): Chapter | undefined {
		return chapters.find((c) => {
			if (bookSlugFromId(c.id) !== bookSlug) return false;
			const id = chapterIdFromId(c.id);
			return id?.startsWith("00-");
		});
	}

	/**
	 * Bookshelf: groups chapters by book and builds a `Book` for each
	 * one that has an index chapter. Alphabetical order by slug.
	 */
	static listFromChapters(chapters: Chapter[]): Book[] {
		const grouped = Books.groupByBook(chapters);
		const out: Book[] = [];
		for (const [slug, list] of grouped) {
			const index = list.find((c) => chapterIdFromId(c.id).startsWith("00-"));
			if (!index) continue; // without an index the book is not navigable
			out.push({ slug, index, chapters: list, total: list.length });
		}
		return out.sort((a, b) => a.slug.localeCompare(b.slug));
	}

	/** Resolves a specific book from its slug. */
	static findBySlug(bookSlug: string, chapters: Chapter[]): Book | undefined {
		const list = chapters.filter((c) => bookSlugFromId(c.id) === bookSlug);
		const index = Books.findIndex(bookSlug, list);
		if (!index) return undefined;
		return { slug: bookSlug, index, chapters: list, total: list.length };
	}
}
