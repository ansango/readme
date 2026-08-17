// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import remarkDirective from "remark-directive";
import { remarkCallouts } from "./src/lib/remark-callouts";
import { remarkObsidianCallouts } from "./src/lib/remark-obsidian-callouts";
import { remarkWikilink } from "./src/lib/remark-wikilink";

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		remarkPlugins: [
			remarkDirective,
			remarkObsidianCallouts,
			remarkCallouts,
			remarkWikilink,
		],
	},
});
