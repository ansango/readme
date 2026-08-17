#!/usr/bin/env node
/**
 * Sync book wikis from an Obsidian vault into the Astro `chapters` collection.
 *
 * Reads a markdown manifest (`--manifest`) whose body contains wikilinks of the
 * form `[[00-<book-name>]]`. For each link, finds the matching file
 * recursively inside the vault (`--vault`) and copies the parent folder to
 * `src/content/<slug>/` where `<slug>` is the basename of that folder.
 *
 * Usage:
 *   node tools/sync-vault/index.mjs \
 *     --manifest vault/3.resources/wikis/books.md \
 *     --vault vault \
 *     --out src/content
 */
import { cp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { glob } from "tinyglobby";

const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i++) {
	if (argv[i].startsWith("--")) opts[argv[i].slice(2)] = argv[++i];
}

if (!opts.manifest || !opts.out) {
	console.error(
		"Usage: sync-vault --manifest <path> --out <dir> [--vault <root>]",
	);
	process.exit(1);
}

const VAULT = opts.vault ?? ".";
const OUT = opts.out;
// Matches [[name]] and [[name|alias]] / [[name#heading]] — captures the target only.
const WIKILINK = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;

const md = await readFile(opts.manifest, "utf8");
const wanted = [...md.matchAll(WIKILINK)]
	.map((m) => m[1].trim())
	.filter((name) => /^00-/.test(name));

if (!wanted.length) {
	console.error("no [[00-…]] links found in manifest");
	process.exit(1);
}

await mkdir(OUT, { recursive: true });
const expected = new Map();

for (const name of wanted) {
	const filename = `${name}.md`;
	const matches = await glob(`**/${filename}`, { cwd: VAULT, absolute: true });
	if (!matches.length) {
		console.warn(`✗ ${filename} not found in vault — skipping`);
		continue;
	}
	if (matches.length > 1) {
		console.warn(
			`! ${filename} matched ${matches.length} files, taking first: ${matches[0]}`,
		);
	}

	const filePath = matches[0];
	const folder = dirname(filePath);
	const slug = basename(folder);

	const dest = join(OUT, slug);
	await cp(folder, dest, { recursive: true });
	expected.set(slug, folder);
	console.log(`✓ ${slug} ← ${folder}`);
}

// Drop stale book folders. `pages` is a sibling collection (rendered at /{id}/)
// and must never be touched.
for (const entry of await readdir(OUT, { withFileTypes: true })) {
	if (!entry.isDirectory() || entry.name === "pages") continue;
	if (!expected.has(entry.name)) {
		await rm(join(OUT, entry.name), { recursive: true, force: true });
		console.log(`✗ removed stale: ${entry.name}`);
	}
}

console.log(`\nSynced ${expected.size} book(s)`);
