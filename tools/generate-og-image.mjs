#!/usr/bin/env node
/**
 * Generates the default Open Graph image (1200×630 PNG) used by the
 * Seo component when no per-chapter image is provided.
 *
 * One-off tool: produces `public/og-default.png`. Not part of the build.
 * Re-run with `node tools/generate-og-image.mjs` whenever the design changes.
 *
 * Uses `sharp` (transitively present via Astro) for SVG → PNG conversion
 * with embedded JetBrains Mono so the look matches the rest of the site.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#08090b"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#1a1d22" stroke-width="2"/>
  <rect x="40" y="40" width="1120" height="48" fill="#0e1014"/>
  <circle cx="72" cy="64" r="8" fill="#d70a53"/>
  <circle cx="98" cy="64" r="8" fill="#5e6470"/>
  <circle cx="124" cy="64" r="8" fill="#5e6470"/>
  <text x="160" y="70" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="20" fill="#5e6470">README.md</text>
  <text x="600" y="290" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="96" font-weight="500" fill="#d70a53" text-anchor="middle">README</text>
  <text x="600" y="360" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="32" fill="#d8d8d8" text-anchor="middle">Wikis de libros técnicos</text>
  <text x="600" y="410" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="22" fill="#5e6470" text-anchor="middle">by ansango</text>
  <text x="600" y="540" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="18" fill="#5e6470" text-anchor="middle">readme.ansango.com</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
const out = resolve(root, "public/og-default.png");
writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes)`);

// Sanity check: verify it's a valid PNG by re-reading it.
const meta = await sharp(readFileSync(out)).metadata();
console.log(`Verified: ${meta.width}x${meta.height} ${meta.format}`);
