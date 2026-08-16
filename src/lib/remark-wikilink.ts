/**
 * remark plugin: convierte `[[wikilink]]` y `[[wikilink|alias]]` en
 * enlaces a /capitulos/{slug}/. Si el slug no existe, genera un span
 * con clase .wikilink-broken para que el CSS lo marque visualmente.
 *
 * El slug se deriva del texto entre corchetes; no se valida contra
 * las collections de Astro en build-time (remarkPlugins corre sin
 * contexto de Astro). El 404 se delega al router.
 */

import type { Plugin } from "unified";
import type { Root, Text, PhrasingContent, Link } from "mdast";

const WIKILINK = /\[\[([^\]\n|]+?)(?:\|([^\]\n]+?))?\]\]/g;

function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export const remarkWikilink: Plugin<[], Root> = () => {
	return (tree) => {
		visitText(tree);
	};
};

function visitText(tree: Root): void {
	walk(tree);
}

function walk(
	node: Root | PhrasingContent | { children?: Array<unknown> },
): void {
	if (!("children" in node) || !Array.isArray(node.children)) return;

	const newChildren: Array<unknown> = [];

	for (const child of node.children as Array<{ type?: string; value?: string; children?: Array<unknown> }>) {
		if (child.type === "text" && typeof child.value === "string" && child.value.includes("[[")) {
			const segments = splitWikilinks(child.value);
			for (const seg of segments) {
				if (seg.type === "text") {
					newChildren.push({ type: "text", value: seg.value });
				} else {
					const slug = slugify(seg.target);
					const linkNode: Link = {
						type: "link",
						url: `/capitulos/${slug}/`,
						title: null,
						children: [{ type: "text", value: seg.label || seg.target }],
						data: {
							hProperties: { className: ["wikilink"] },
						},
					};
					newChildren.push(linkNode);
				}
			}
		} else if (child.type === "text" || child.type === "inlineCode" || child.type === "link") {
			newChildren.push(child);
		} else {
			walk(child as { children?: Array<unknown> });
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
	let m: RegExpExecArray | null;
	while ((m = re.exec(input)) !== null) {
		if (m.index > last) {
			out.push({ type: "text", value: input.slice(last, m.index) });
		}
		out.push({
			type: "wikilink",
			target: m[1].trim(),
			label: m[2]?.trim() || null,
		});
		last = m.index + m[0].length;
	}
	if (last < input.length) {
		out.push({ type: "text", value: input.slice(last) });
	}
	return out;
}