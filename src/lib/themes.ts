/**
 * Single source of truth for the themes of the site: slugs for
 * `data-theme`, per-theme CSS variables and accent colors for the
 * picker swatch.
 *
 * The themes are palettes from glanceapp/glance's
 * `docs/themes.md` (https://github.com/glanceapp/glance). 14
 * presets total: 3 light (catppuccin-latte, peachy, zebra) and
 * 11 dark. The previous Linux-distro themes (debian, arch,
 * ubuntu, …) have been removed.
 *
 * The actual source of truth is `src/config.json`; this module
 * just adds the types TypeScript needs to keep typing across the
 * app.
 */
import config from "../config.json";

export const systems = config.systems;
export type System = (typeof systems)[number];
export type Theme = System["slug"];

export const themes: Theme[] = systems.map((s) => s.slug).sort();

/**
 * Default theme. Light, as the user asked. `catppuccin-latte` is
 * the canonical Catppuccin light palette and a sensible entry
 * point.
 */
export const DEFAULT_THEME: Theme = "catppuccin-latte";

/** localStorage key — replicated verbatim in the anti-FOUC script of the layout */
export const STORAGE_KEY = "theme";

/**
 * Per-theme accent color, used by the theme picker to render a
 * little color dot next to each option. Maps `slug → #hex`.
 */
export const themeAccent: Record<Theme, string> = Object.fromEntries(
	systems.map((s) => [s.slug, s.colors.accent]),
) as Record<Theme, string>;
