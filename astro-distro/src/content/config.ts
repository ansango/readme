import { defineCollection, z } from "astro:content";

const chapters = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		mod: z.coerce.date(),
		draft: z.boolean().default(false),
		tags: z.array(z.string()).default([]),
	}),
});

export const collections = { chapters };