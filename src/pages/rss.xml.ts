import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { bookSlugFromId, chapterIdFromId } from "../lib/book-slug";
import { Chapters } from "../lib/chapters";

/**
 * RSS feed of every published chapter across all books.
 *
 * Each `<item>` links to `/{book-slug}/{chapter-id}/`, matching the URL
 * produced by `src/pages/[book]/[chapter].astro`.
 */
export async function GET(context: APIContext) {
	const all = await Chapters.all();
	// Include 00-… too: they live at /{book}/ and are useful entry points.
	// The book homepage is already linked from the index of each chapter.
	const items = all
		.map((c) => ({
			chapter: c,
			bookSlug: bookSlugFromId(c.id),
			chapterId: chapterIdFromId(c.id),
		}))
		.filter((x) => x.bookSlug && x.chapterId)
		.sort((a, b) =>
			Number(b.chapter.data.mod.getTime() - a.chapter.data.mod.getTime()),
		);

	return rss({
		title: "README — Capítulos",
		description: "Wikis de libros técnicos que voy leyendo y documentando",
		site: context.site ?? "https://readme.ansango.com",
		trailingSlash: false,
		items: items.map(({ chapter, bookSlug, chapterId }) => ({
			title: chapter.data.title,
			description: chapter.data.description,
			pubDate: chapter.data.mod,
			link: `/${bookSlug}/${chapterId}/`,
		})),
		customData: "<language>es-ES</language>",
	});
}
