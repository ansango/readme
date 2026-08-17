// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import remarkDirective from "remark-directive";
import { remarkCallouts } from "./src/lib/remark-callouts";
import { remarkObsidianCallouts } from "./src/lib/remark-obsidian-callouts";
import { remarkStripFirstHeading } from "./src/lib/remark-strip-first-heading";
import { remarkWikilink } from "./src/lib/remark-wikilink";

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	redirects: {
		"/capitulos/[...slug]": "/linux-para-hackers/[...slug]",
		"/capitulos": "/",
	},
	markdown: {
		remarkPlugins: [
			remarkDirective,
			remarkObsidianCallouts,
			remarkCallouts,
			remarkStripFirstHeading,
			remarkWikilink,
		],
	},
});
