import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const chapterSchema = z.object({
	title: z.string(),
	description: z.string(),
	date: z.coerce.date(),
	mod: z.coerce.date(),
	draft: z.boolean().default(false),
	tags: z.array(z.string()).default([]),
});

const chapters = defineCollection({
	loader: glob({ pattern: "*/**/*.md", base: "./src/content" }),
	schema: chapterSchema,
});

export const collections = { chapters };

// Tipo inferido del schema, exportado para que las páginas puedan
// tipar `getCollection` sin depender de `.astro/types.d.ts` (que es
// gitignored y solo se genera con `astro sync`).
export type ChapterData = z.infer<typeof chapterSchema>;
export interface Chapter {
	id: string;
	data: ChapterData;
	body?: string;
	collection: "chapters";
	// biome-ignore lint/suspicious/noExplicitAny: RenderedContent se genera con `astro sync`; mantener any evita depender de tipos virtuales
	rendered?: any;
	filePath?: string;
	digest?: string | number;
}
