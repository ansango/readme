/**
 * Operations on the `pages` collection: standalone pages (about, legal,
 * …) that live in `src/content/pages/*.md` and render at `/{id}/`.
 */
import { getCollection } from "astro:content";
import type { Page, PageData } from "../content.config";

export class Pages {
	/** Collection fetch excluding drafts. Typed against `Page`. */
	static async all(): Promise<Page[]> {
		return (await getCollection(
			"pages",
			({ data }: { data: PageData }) => !data.draft,
		)) as Page[];
	}
}
