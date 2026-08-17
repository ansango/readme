/**
 * Single source of truth for the distros of the site: from here come
 * the logos requested from fastfetch (components/logos), the slugs for
 * `data-theme` (styles/themes.css), and the per-distro content.
 *
 * The actual source of truth is `src/config.json`; this module just
 * adds the types TypeScript needs to keep typing across the app.
 */
import config from "../config.json";

export const systems = config.systems;
export type System = (typeof systems)[number];
export type Theme = System["slug"];

export const themes: Theme[] = systems.map((distro) => distro.slug).sort();

export const DEFAULT_THEME: Theme = "debian";

/** localStorage key — replicated verbatim in the anti-FOUC script of the layout */
export const STORAGE_KEY = "theme";
