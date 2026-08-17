// @ts-check

import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import remarkDirective from "remark-directive";
import { remarkCallouts } from "./src/plugins/remark/callouts";
import { remarkExternalLinks } from "./src/plugins/remark/external-links";
import { remarkObsidianCallouts } from "./src/plugins/remark/obsidian-callouts";
import { remarkStripFirstHeading } from "./src/plugins/remark/strip-first-heading";
import { remarkWikilink } from "./src/plugins/remark/wikilink";

// https://astro.build/config
//
// `markdown.remarkPlugins` (legacy) only applies to loose .md files in
// `src/pages/`. For the plugins to also run on content-collection
// entries (chapters), we use the new API
// `markdown.processor = unified({...})` from @astrojs/markdown-remark.
export default defineConfig({
	site: "https://readme.ansango.com",
	trailingSlash: "ignore",
	integrations: [sitemap()],
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
				remarkExternalLinks,
			],
		}),
	},
});
