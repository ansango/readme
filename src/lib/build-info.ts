/**
 * Versions of the main dependencies. Kept manually in sync with
 * package.json on update. Exists because Vite does not resolve imports
 * outside the `src/` directory by default, so we cannot read
 * package.json directly from an .astro file.
 */

export const BUILD_INFO = {
	astro: "7.1.6",
	tailwindcss: "4.3.3",
} as const;
