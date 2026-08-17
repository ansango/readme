/**
 * remark plugin: converts Obsidian callouts into containerDirectives
 * so that remarkCallouts can process them.
 *
 * Detected syntax (blockquote with a marker on the first line):
 *
 *   > [!abstract] Summary
 *   > Callout body.
 *
 *   > [!warning]
 *   > No title.
 *
 * Output (mdast):
 *
 *   containerDirective
 *     name: "abstract"
 *     children:
 *       - paragraph { data: { directiveLabel: true }, children: [text "Summary"] }
 *       - paragraph { children: [text "Body…"] }
 *
 * Restrictions:
 * - The name must match ^[a-zA-Z][a-zA-Z0-9-_]*$ (same rule as
 *   remark-directive). Otherwise the blockquote is left untouched.
 * - Only acts on blockquotes whose FIRST child is a paragraph whose
 *   FIRST text starts with [!type].
 */

import type {
	ContainerDirective,
	Paragraph,
	PhrasingContent,
	Root,
} from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

const OBSIDIAN_CALLOUT =
	/^\s*\[!([a-zA-Z][a-zA-Z0-9-_]*)\](?:\s+([^\n]+?))?(?=\n|$)/;
const VALID_NAME = /^[a-zA-Z][a-zA-Z0-9-_]*$/;

export const remarkObsidianCallouts: Plugin<[], Root> = () => {
	return (tree) => {
		visit(tree, "blockquote", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;
			if (node.children.length === 0) return;

			const first = node.children[0];
			if (first.type !== "paragraph") return;
			if (first.children.length === 0) return;

			const firstChild = first.children[0];
			if (firstChild.type !== "text") return;

			const match = firstChild.value.match(OBSIDIAN_CALLOUT);
			if (!match || match[0].length === 0) return;

			const [, rawName, rawTitle] = match;
			if (!VALID_NAME.test(rawName)) return;
			const name = rawName.toLowerCase();
			const title = rawTitle?.trim();

			// Strip the first line [!type] title\n from the first text.
			// mdast concatenates all blockquote lines into a single text
			// separated by '\n', so we look for the first newline after
			// the match to split title from body.
			const newlineIdx = firstChild.value.indexOf("\n", match[0].length);
			const restOfFirstText =
				newlineIdx === -1 ? "" : firstChild.value.slice(newlineIdx + 1);

			const newFirstParagraphChildren: PhrasingContent[] = [];
			if (restOfFirstText) {
				newFirstParagraphChildren.push({
					type: "text",
					value: restOfFirstText,
				});
			}
			newFirstParagraphChildren.push(...first.children.slice(1));

			const directiveChildren: Paragraph[] = [];

			// Label paragraph (if there is a title)
			if (title) {
				const labelPara: Paragraph = {
					type: "paragraph",
					children: [{ type: "text", value: title }],
					data: { directiveLabel: true },
				};
				directiveChildren.push(labelPara);
			}

			// Remaining content of the original first paragraph
			if (newFirstParagraphChildren.length > 0) {
				directiveChildren.push({
					type: "paragraph",
					children: newFirstParagraphChildren,
				});
			}

			// Remaining paragraphs of the original blockquote
			for (let i = 1; i < node.children.length; i++) {
				const c = node.children[i];
				if (c.type === "paragraph") {
					directiveChildren.push(c);
				}
			}

			const directive: ContainerDirective = {
				type: "containerDirective",
				name,
				children: directiveChildren,
				data: {},
			};

			parent.children.splice(index, 1, directive);
			return [SKIP, index];
		});
	};
};
