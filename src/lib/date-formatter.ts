/**
 * Date formatting used in pages (frontmatter `date`/`mod`).
 *
 * Centralized so the "short ISO" and "long human-readable" formats
 * live in a single place — they used to be inlined in pages and
 * duplicated between index and chapter.
 */
export class DateFormatter {
	/** YYYY-MM-DD aligned with the frontmatter (section "metadata"). */
	static iso(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	/** "01 oct. 2026" — used in the chapter header. */
	static spanishLong(date: Date): string {
		return date.toLocaleDateString("es-ES", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	}
}
