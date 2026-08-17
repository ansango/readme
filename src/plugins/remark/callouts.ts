/**
 * remark plugin: converts block directives `:::type[Title]` from
 * remark-directive into HTML containers with class .callout and an
 * optional .callout-title.
 *
 * Expected syntax (markdown):
 *
 *   :::note
 *   Callout body.
 *   :::
 *
 *   :::warning[Watch out!]
 *   Body with an explicit title.
 *   :::
 *
 * `containerDirective` nodes are emitted by remark-directive. Here we
 * re-tag them with hName/hProperties so the resulting HTML has the
 * form <div class="callout callout-{name}">.
 */

import type { Root } from "mdast";
import type { Plugin } from "unified";
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
		visit(
			tree,
			(node: {
				type?: string;
				name?: string;
				children?: Array<unknown>;
				data?: {
					hName?: string;
					hProperties?: Record<string, unknown>;
					directiveLabel?: unknown;
				};
			}) => {
				if (
					(node.type === "containerDirective" ||
						node.type === "leafDirective") &&
					node.name &&
					TYPES.has(node.name)
				) {
					node.data ??= {};
					const data = node.data;
					data.hName = "div";
					data.hProperties = {
						className: ["callout", `callout-${node.name}`],
					};

					// If remark-directive marked the first child with
					// directiveLabel, we move it into a wrapper .callout-title
					// and leave the rest in .callout-content.
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
										...((
											c as { data?: { hProperties?: Record<string, unknown> } }
										).data?.hProperties ?? {}),
										className: ["callout-content"],
									},
								},
							})),
						];
						node.children = wrapped as never;
					}
				}
			},
		);
	};
};
