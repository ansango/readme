/**
 * Single source of truth for the themes of the site: from here come
 * the logos requested from fastfetch (components/logos), the slugs for
 * `data-theme` (styles/themes.css), and the per-theme content.
 *
 * Two kinds coexist:
 *   - `distro` (default): the 26 Linux distros / OSes defined in
 *     `src/config.json`. Each has a unique font and an ASCII logo.
 *   - `glance`: palettes lifted from the Glance dashboard themes
 *     (https://github.com/glanceapp/glance/blob/main/docs/themes.md).
 *     No ASCII logo, no per-theme font (use the default mono).
 *
 * The actual source of truth is `src/config.json`; this module just
 * adds the types TypeScript needs to keep typing across the app.
 */
import config from "../config.json";

export const systems = config.systems;
export type System = (typeof systems)[number];
export type Theme = System["slug"];

/** A theme's kind. `distro` if missing in the JSON (back-compat). */
export type ThemeKind = "distro" | "glance";

export function kindOf(slug: Theme): ThemeKind {
	const s = systems.find((x) => x.slug === slug);
	return (s?.kind as ThemeKind | undefined) ?? "distro";
}

export const themes: Theme[] = systems.map((s) => s.slug).sort();

export const DEFAULT_THEME: Theme = "debian";

/** localStorage key — replicated verbatim in the anti-FOUC script of the layout */
export const STORAGE_KEY = "theme";
