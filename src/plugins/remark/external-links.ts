/**
 * remark plugin: detects external links and marks them so they open
 * in a new tab (`target="_blank"` + `rel="noopener noreferrer"`).
 *
 * Considered external:
 *   - Absolute URLs: http://, https://, ftp://, mailto:, tel:, data:, …
 *   - Protocol-relative URLs: //cdn.example.com/foo
 *
 * Considered internal (left untouched):
 *   - /abs/path, ./relative, ../relative, page, #anchor
 *
 * Implemented via `data.hProperties`: the unified → rehype pipeline
 * translates that object into attributes on the final `<a>`. Keeping
 * this plugin as the last one in the pipeline guarantees that any
 * other plugin (e.g. wikilink) has already rewritten the `url` before
 * we evaluate whether it is external.
 *
 * `rel="noopener noreferrer"` is added for security together with
 * `target="_blank"`: `noopener` isolates `window.opener` (prevents
 * tabnabbing) and `noreferrer` hides the Referer header. If another
 * plugin already set a `rel`, the existing one is preserved.
 */

import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/** Is the URL absolute / protocol-relative / has a non-relative scheme? */
function isExternalUrl(url: string): boolean {
	if (!url) return false;
	// //host/path  →  protocol-relative (always external).
	if (url.startsWith("//")) return true;
	// scheme:rest  →  http(s), mailto, ftp, tel, data, …
	return /^[a-z][a-z0-9+.-]*:/i.test(url);
}

export const remarkExternalLinks: Plugin<[], Root> = () => {
	return (tree) => {
		visit(tree, "link", (node: Link) => {
			if (!isExternalUrl(node.url)) return;

			const data = node.data ?? {};
			const props = (data.hProperties ?? {}) as Record<string, unknown>;
			props.target = "_blank";
			if (typeof props.rel !== "string" || props.rel.length === 0) {
				props.rel = "noopener noreferrer";
			}
			data.hProperties = props;
			node.data = data;
		});
	};
};
