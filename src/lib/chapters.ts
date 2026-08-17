/**
 * Operations on the `chapters` collection: fetch from Astro, filter
 * by convention (00- = index, 01+ = numbered), and aggregate metrics
 * (total reading time).
 *
 * Every function reads non-draft chapters (`draft: false`).
 */
import { getCollection } from "astro:content";
import type { Chapter, ChapterData } from "../content.config";
import { chapterIdFromId } from "./book-slug";
import { readingTime } from "./reading-time";

export class Chapters {
	/** Collection fetch excluding drafts. Typed against `Chapter` (not Astro's inference). */
	static async all(): Promise<Chapter[]> {
		return (await getCollection(
			"chapters",
			({ data }: { data: ChapterData }) => !data.draft,
		)) as Chapter[];
	}

	/** Only numbered chapters (01-, 02-, …). The 00- is the book index. */
	static getNumbered(chapters: Chapter[]): Chapter[] {
		return chapters.filter((c) => {
			const id = chapterIdFromId(c.id);
			return id && !id.startsWith("00-");
		});
	}

	/**
	 * Total reading time (minutes) of a set of chapters.
	 * Useful for "X min of reading" on the book home.
	 */
	static totalReadingTime(chapters: Chapter[]): number {
		return chapters.reduce((acc, c) => {
			const { minutes } = readingTime(c.body ?? "");
			return acc + minutes;
		}, 0);
	}
}
