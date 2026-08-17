/**
 * remark plugin: elimina el primer nodo `heading` del AST.
 *
 * Por qué: cada capítulo tiene su título en el frontmatter (`title:`),
 * que se renderiza como `<h1>` desde la página que lo aloja
 * (`/{book}/{chapter}/` con su header, o `/{book}/` para el cap. 00).
 * El markdown empieza siempre por `# <mismo título>`, lo que produce
 * un `<h1>` duplicado. Este plugin lo quita del AST para que el HTML
 * final tenga un solo `<h1>` por capítulo.
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
