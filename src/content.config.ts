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
	// `!pages/**` keeps single pages (src/content/pages/) out of the books.
	loader: glob({ pattern: ["*/**/*.md", "!pages/**"], base: "./src/content" }),
	schema: chapterSchema,
});

const pageSchema = z.object({
	title: z.string(),
	description: z.string(),
	date: z.coerce.date(),
	mod: z.coerce.date(),
	draft: z.boolean().default(false),
});

/** Standalone pages (about, legal, …): one .md = one route `/{id}/`. */
const pages = defineCollection({
	loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
	schema: pageSchema,
});

export const collections = { chapters, pages };

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

export type PageData = z.infer<typeof pageSchema>;
export interface Page {
	id: string;
	data: PageData;
	body?: string;
	collection: "pages";
	// biome-ignore lint/suspicious/noExplicitAny: RenderedContent is generated with `astro sync`; keeping `any` avoids depending on virtual types
	rendered?: any;
	filePath?: string;
	digest?: string | number;
}
