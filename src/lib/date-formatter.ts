/**
 * Formateo de fechas usado en las páginas (frontmatter `date`/`mod`).
 *
 * Centralizado para que el "es-ES corto" y el "ISO corto" vivan en
 * un único sitio — antes estaban inline en las páginas y se
 * duplicaban entre index y chapter.
 */
export class DateFormatter {
	/** YYYY-MM-DD alineado con el frontmatter (sección "metadata"). */
	static iso(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	/** "01 oct. 2026" — usado en la cabecera de capítulo. */
	static spanishLong(date: Date): string {
		return date.toLocaleDateString("es-ES", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	}
}
