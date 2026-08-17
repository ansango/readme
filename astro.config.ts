// @ts-check

import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import remarkDirective from "remark-directive";
import { remarkCallouts } from "./src/lib/remark-callouts";
import { remarkObsidianCallouts } from "./src/lib/remark-obsidian-callouts";
import { remarkStripFirstHeading } from "./src/lib/remark-strip-first-heading";
import { remarkWikilink } from "./src/lib/remark-wikilink";

// https://astro.build/config
//
// `markdown.remarkPlugins` (legacy) solo aplica a .md sueltos en
// `src/pages/`. Para que los plugins también corran sobre las entradas
// de las content collections (capítulos), usamos la nueva API
// `markdown.processor = unified({...})` desde @astrojs/markdown-remark.
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		processor: unified({
			remarkPlugins: [
				remarkDirective,
				remarkObsidianCallouts,
				remarkCallouts,
				remarkStripFirstHeading,
				remarkWikilink,
			],
		}),
	},
});
