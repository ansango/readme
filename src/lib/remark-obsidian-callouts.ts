/**
 * remark plugin: convierte callouts de Obsidian en containerDirectives
 * para que remarkCallouts los pueda procesar.
 *
 * Sintaxis detectada (blockquote con marcador en la primera línea):
 *
 *   > [!abstract] Resumen
 *   > Contenido del callout.
 *
 *   > [!warning]
 *   > Sin título.
 *
 * Salida (mdast):
 *
 *   containerDirective
 *     name: "abstract"
 *     children:
 *       - paragraph { data: { directiveLabel: true }, children: [text "Resumen"] }
 *       - paragraph { children: [text "Contenido…"] }
 *
 * Restricciones:
 * - El nombre debe coincidir con ^[a-zA-Z][a-zA-Z0-9-_]*$ (mismo rule
 *   que remark-directive). Si no, se deja el blockquote intacto.
 * - Solo actúa sobre blockquotes cuyo PRIMER hijo sea un paragraph
 *   cuyo PRIMER text empieza por [!type].
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

			// Eliminar la primera línea [!type] title\n del primer text.
			// mdast concatena todas las líneas del blockquote en un único
			// text separadas por '\n', así que buscamos el primer newline
			// después del match para separar el título del contenido.
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

			// Label paragraph (si hay título)
			if (title) {
				const labelPara: Paragraph = {
					type: "paragraph",
					children: [{ type: "text", value: title }],
					data: { directiveLabel: true },
				};
				directiveChildren.push(labelPara);
			}

			// Contenido restante del primer paragraph original
			if (newFirstParagraphChildren.length > 0) {
				directiveChildren.push({
					type: "paragraph",
					children: newFirstParagraphChildren,
				});
			}

			// Resto de paragraphs del blockquote original
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
