/**
 * Fonts are served from `@fontsource/*` (each package ships its `.woff2`
 * and its `@font-face`). Importing the weight files here is enough for
 * Vite to bundle them into the final CSS — no external CDN, no DNS to
 * Google.
 *
 * When adding/removing weights or families in the future, just touch
 * these `import` statements and the `FONT_FAMILY` map below.
 */
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/ubuntu-mono/400.css";
import "@fontsource/ubuntu-mono/700.css";
import "@fontsource/fira-code/400.css";
import "@fontsource/fira-code/500.css";
import "@fontsource/fira-code/700.css";
import "@fontsource/noto-sans-mono/400.css";
import "@fontsource/noto-sans-mono/500.css";
import "@fontsource/noto-sans-mono/700.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "@fontsource/roboto-mono/700.css";

import type { systems } from "./themes";

type SystemFont = (typeof systems)[number]["font"];

/**
 * Local family (already bundled by `@fontsource`) used by each `font`
 * declared in `config.json → systems[]`. For fonts that have no
 * equivalent covered by `@fontsource` (Hack is not available, and
 * Iosevka/DejaVu/SF/Liberation/Cascadia have no free equivalent) the
 * closest reasonable substitute of the same type is chosen.
 *
 *  * `Fira Code` substitutes Hack: both are programming monos with
 *    good glyph differentiation, Fira Code is the de-facto standard
 *    in the community to replace Hack.
 */
export const FONT_FAMILY: Record<SystemFont, string> = {
	"JetBrains Mono": "JetBrains Mono",
	"Ubuntu Mono": "Ubuntu Mono",
	Hack: "Fira Code",
	Inter: "Inter",
	"Noto Sans": "Noto Sans",
	"Noto Sans Mono": "Noto Sans Mono",
	"Roboto Mono": "Roboto Mono",
	// Substitutes for fonts NOT in @fontsource (same style):
	"Iosevka Term": "JetBrains Mono",
	"DejaVu Sans Mono": "JetBrains Mono",
	"Liberation Mono": "JetBrains Mono",
	"Cascadia Mono": "JetBrains Mono",
	"SF Mono": "JetBrains Mono",
	Monospace: "JetBrains Mono",
	Cantarell: "Inter",
};

/**
 * `font-family` string with sensible fallbacks: if the `@font-face`
 * hasn't finished being injected, the browser falls back to the
 * system monospace font.
 */
export function fontStack(family: string): string {
	return `'${family}', ui-monospace, 'SF Mono', Menlo, Monaco, monospace`;
}
