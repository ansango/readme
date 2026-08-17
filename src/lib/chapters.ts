/**
 * Operaciones sobre la collection `chapters`: fetch desde Astro,
 * filtros por convención (00- = índice, 01+ = numerados) y métricas
 * agregadas (tiempo total de lectura).
 *
 * Todas las funciones leen capítulos no-borrador (`draft: false`).
 */
import { getCollection } from "astro:content";
import type { Chapter, ChapterData } from "../content.config";
import { chapterIdFromId } from "./book-slug";
import { readingTime } from "./reading-time";

export class Chapters {
	/** Fetch de la collection excluyendo drafts. Tipado contra `Chapter` (no la inferencia de Astro). */
	static async all(): Promise<Chapter[]> {
		return (await getCollection(
			"chapters",
			({ data }: { data: ChapterData }) => !data.draft,
		)) as Chapter[];
	}

	/** Solo los capítulos numerados (01-, 02-, …). El 00- es el índice del libro. */
	static getNumbered(chapters: Chapter[]): Chapter[] {
		return chapters.filter((c) => {
			const id = chapterIdFromId(c.id);
			return id && !id.startsWith("00-");
		});
	}

	/**
	 * Tiempo total de lectura (minutos) de un conjunto de capítulos.
	 * Útil para "X min de lectura" en la home del libro.
	 */
	static totalReadingTime(chapters: Chapter[]): number {
		return chapters.reduce((acc, c) => {
			const { minutes } = readingTime(c.body ?? "");
			return acc + minutes;
		}, 0);
	}
}
