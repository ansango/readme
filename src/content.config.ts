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

// Inferred type from the schema, exported so pages can type
// `getCollection` without depending on `.astro/types.d.ts` (which is
// gitignored and only generated with `astro sync`).
export type ChapterData = z.infer<typeof chapterSchema>;
export interface Chapter {
	id: string;
	data: ChapterData;
	body?: string;
	collection: "chapters";
	// biome-ignore lint/suspicious/noExplicitAny: RenderedContent is generated with `astro sync`; keeping `any` avoids depending on virtual types
	rendered?: any;
	filePath?: string;
	digest?: string | number;
}
