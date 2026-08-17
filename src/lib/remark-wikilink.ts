/**
 * remark plugin: convierte `[[wikilink]]` y `[[wikilink|alias]]` en
 * enlaces a /{book-slug}/{chapter-slug}/. Si el slug no existe, genera
 * un span con clase .wikilink-broken para que el CSS lo marque
 * visualmente.
 *
 * El slug se deriva del texto entre corchetes; no se valida contra
 * las collections de Astro en build-time (remarkPlugins corre sin
 * contexto de Astro). El 404 se delega al router.
 *
 * El book-slug se obtiene de `file.path`, que Astro 7 rellena con
 * renderOpts.fileURL (URL file:// absoluta del .md origen). Si la
 * ruta no parece de un libro (ej. un README suelto), el plugin
 * produce wikilinks sin prefijo de libro.
 */

import type { Link, PhrasingContent, Root } from "mdast";
import type { Plugin } from "unified";
import type { VFile } from "vfile";

const WIKILINK = /\[\[([^\]\n|]+?)(?:\|([^\]\n]+?))?\]\]/g;

function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** Derive the book slug from a file:// URL pointing into src/content. */
function bookSlugFromPath(path: string | undefined): string {
	if (!path) return "";
	let p = path;
	if (p.startsWith("file://")) p = decodeURIComponent(p.slice(7));
	const marker = "/src/content/";
	const i = p.lastIndexOf(marker);
	if (i === -1) return "";
	const rest = p.slice(i + marker.length);
	const slash = rest.indexOf("/");
	return slash === -1 ? "" : rest.slice(0, slash);
}

export const remarkWikilink: Plugin<[], Root> = () => {
	return (tree, file) => {
		const bookSlug = bookSlugFromPath((file as VFile | undefined)?.path);
		const prefix = bookSlug ? `/${bookSlug}/` : "/";
		visitText(tree, prefix);
	};
};

function visitText(tree: Root, prefix: string): void {
	walk(tree, prefix);
}

function walk(
	node: Root | PhrasingContent | { children?: Array<unknown> },
	prefix: string,
): void {
	if (!("children" in node) || !Array.isArray(node.children)) return;

	const newChildren: Array<unknown> = [];

	for (const child of node.children as Array<{
		type?: string;
		value?: string;
		children?: Array<unknown>;
	}>) {
		if (
			child.type === "text" &&
			typeof child.value === "string" &&
			child.value.includes("[[")
		) {
			const segments = splitWikilinks(child.value);
			for (const seg of segments) {
				if (seg.type === "text") {
					newChildren.push({ type: "text", value: seg.value });
				} else {
					const slug = slugify(seg.target);
					const linkNode: Link = {
						type: "link",
						url: `${prefix}${slug}/`,
						title: null,
						children: [{ type: "text", value: seg.label || seg.target }],
						data: {
							hProperties: { className: ["wikilink"] },
						},
					};
					newChildren.push(linkNode);
				}
			}
		} else if (
			child.type === "text" ||
			child.type === "inlineCode" ||
			child.type === "link"
		) {
			newChildren.push(child);
		} else {
			walk(child as { children?: Array<unknown> }, prefix);
			newChildren.push(child);
		}
	}

	node.children = newChildren as never;
}

type Segment =
	| { type: "text"; value: string }
	| { type: "wikilink"; target: string; label: string | null };

function splitWikilinks(input: string): Segment[] {
	const out: Segment[] = [];
	let last = 0;
	const re = new RegExp(WIKILINK.source, "g");
	let m: RegExpExecArray | null = re.exec(input);
	while (m !== null) {
		if (m.index > last) {
			out.push({ type: "text", value: input.slice(last, m.index) });
		}
		out.push({
			type: "wikilink",
			target: m[1].trim(),
			label: m[2]?.trim() || null,
		});
		last = m.index + m[0].length;
		m = re.exec(input);
	}
	if (last < input.length) {
		out.push({ type: "text", value: input.slice(last) });
	}
	return out;
}
