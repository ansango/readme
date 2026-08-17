/**
 * remark plugin: detecta enlaces externos y los marca para que se
 * abran en una pestaña nueva (`target="_blank"` + `rel="noopener
 * noreferrer"`).
 *
 * Considera externos:
 *   - URLs absolutos: http://, https://, ftp://, mailto:, tel:, data:, …
 *   - URLs protocol-relative: //cdn.example.com/foo
 *
 * Considera internos (no se tocan):
 *   - /ruta/absoluta, ./relativa, ../relativa, pagina, #ancla
 *
 * Implementación via `data.hProperties`: el pipeline unified → rehype
 * traduce ese objeto a atributos del `<a>` final. Mantener este plugin
 * como el último del pipeline garantiza que cualquier otro plugin (p.ej.
 * wikilink) ya haya reescrito el `url` antes de evaluar si es externo.
 *
 * `rel="noopener noreferrer"` se añade por seguridad junto con
 * `target="_blank"`: `noopener` aísla `window.opener` (previene
 * tabnabbing) y `noreferrer` oculta la cabecera Referer. Si otro
 * plugin ya fijó un `rel`, se respeta el existente.
 */

import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/** ¿El URL es absoluto / protocol-relative / tiene esquema no-relativo? */
function isExternalUrl(url: string): boolean {
	if (!url) return false;
	// //host/path  →  protocol-relative (siempre externo).
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
