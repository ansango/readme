#!/usr/bin/env node
/**
 * Generates the PWA / apple-touch icons:
 *   - public/apple-touch-icon.png  (180×180)   — iOS home screen
 *   - public/icon-192.png          (192×192)   — Android home screen, PWA
 *   - public/icon-512.png          (512×512)   — Android splash, PWA install
 *
 * All three use the Debian accent (the default theme) on the arch
 * background. Re-run whenever the design changes:
 *   node tools/generate-pwa-icons.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Palette: matches `arch` (default base) + `debian` (default accent) from
// src/config.json — keeps the icons consistent with the default theme.
const BG = "#08090b";
const DIM = "#5e6470";
const ACCENT = "#d70a53";

function buildSvg(size) {
	const fontSize = Math.round(size * 0.42);
	const taglineY = Math.round(size * 0.78);
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect x="${size * 0.08}" y="${size * 0.08}" width="${size * 0.84}" height="${size * 0.84}" fill="none" stroke="${DIM}" stroke-width="${Math.max(1, Math.round(size * 0.012))}"/>
  <text x="50%" y="52%" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="${fontSize}" font-weight="500" fill="${ACCENT}" text-anchor="middle" dominant-baseline="middle">README</text>
  <text x="50%" y="${taglineY}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="${Math.round(size * 0.075)}" fill="${DIM}" text-anchor="middle">by ansango</text>
</svg>`;
}

async function emit(name, size) {
	const png = await sharp(Buffer.from(buildSvg(size)))
		.png()
		.toBuffer();
	const out = resolve(root, "public", name);
	writeFileSync(out, png);
	console.log(`Wrote ${out} (${png.length} bytes, ${size}×${size})`);
}

await emit("apple-touch-icon.png", 180);
await emit("icon-192.png", 192);
await emit("icon-512.png", 512);
