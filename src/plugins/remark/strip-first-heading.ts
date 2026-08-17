/**
 * remark plugin: removes the first `heading` node from the AST.
 *
 * Why: each chapter has its title in the frontmatter (`title:`),
 * which is rendered as `<h1>` by the page that hosts it
 * (`/{book}/{chapter}/` with its header, or `/{book}/` for chapter
 * 00). The markdown always starts with `# <same title>`, which would
 * produce a duplicate `<h1>`. This plugin removes it from the AST so
 * the final HTML has a single `<h1>` per chapter.
 */

import type { Root } from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

export const remarkStripFirstHeading: Plugin<[], Root> = () => {
	return (tree) => {
		let removed = false;
		visit(tree, "heading", (_node, index, parent) => {
			if (removed) return;
			if (typeof index !== "number" || !parent) return;
			parent.children.splice(index, 1);
			removed = true;
			return [SKIP, index];
		});
	};
};
