/**
 * remark plugin: convierte directivas de bloque `:::type[Title]` de
 * remark-directive en contenedores HTML con clase .callout y un
 * .callout-title opcional.
 *
 * Sintaxis esperada (markdown):
 *
 *   :::note
 *   Contenido del callout.
 *   :::
 *
 *   :::warning[¡Cuidado!]
 *   Contenido con título explícito.
 *   :::
 *
 * Los nodos `containerDirective` los emite remark-directive. Aquí los
 * re-marcamos con hName/hProperties para que el HTML resultante tenga
 * la forma <div class="callout callout-{name}">.
 */

import type { Plugin } from "unified";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

const TYPES = new Set([
	"note",
	"abstract",
	"info",
	"tip",
	"success",
	"question",
	"warning",
	"failure",
	"danger",
	"bug",
	"example",
	"quote",
]);

export const remarkCallouts: Plugin<[], Root> = () => {
	return (tree) => {
		visit(tree, (node: { type?: string; name?: string; children?: Array<unknown>; data?: { hName?: string; hProperties?: Record<string, unknown>; directiveLabel?: unknown } }) => {
			if (
				(node.type === "containerDirective" || node.type === "leafDirective") &&
				node.name &&
				TYPES.has(node.name)
			) {
				const data = (node.data ??= {});
				data.hName = "div";
				data.hProperties = {
					className: ["callout", `callout-${node.name}`],
				};

				// Si remark-directive marcó el primer hijo con directiveLabel,
				// lo movemos a un wrapper .callout-title y dejamos el resto
				// en .callout-content.
				const children = node.children as Array<{
					type?: string;
					data?: { directiveLabel?: unknown };
					children?: Array<unknown>;
				}>;

				if (
					node.type === "containerDirective" &&
					children.length > 0 &&
					children[0].type === "paragraph" &&
					children[0].data?.directiveLabel
				) {
					const first = children[0];
					const rest = children.slice(1);
					const titleChildren = first.children ?? [];

					const wrapped = [
						{
							type: "paragraph",
							data: {
								hName: "div",
								hProperties: { className: ["callout-title"] },
							},
							children: titleChildren,
						},
						...rest.map((c) => ({
							...c,
							data: {
								...(c as { data?: Record<string, unknown> }).data,
								hProperties: {
									...(((c as { data?: { hProperties?: Record<string, unknown> } }).data?.hProperties) ?? {}),
									className: ["callout-content"],
								},
							},
						})),
					];
					node.children = wrapped as never;
				}
			}
		});
	};
};