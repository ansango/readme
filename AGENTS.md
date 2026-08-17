# AGENTS.md

Contexto técnico para agentes AI que trabajen en `ansango/linux-para-hackers`.

## Qué es

Sitio web estático (Astro) que renderiza la wiki del libro **Linux Basics for Hackers** (OccupyTheWeb) como 20 capítulos navegables. Tema visual "fastfetch style" con `<DistroLogo />` rotativo y paleta de colores configurable por distro.

- Repo: <https://github.com/ansango/linux-para-hackers> (privado)
- Origen: clonado desde `ansango/astro-distro` (tema base) y adaptado a content collections.

## Stack

| | |
|---|---|
| Framework | Astro **7.1.6** (static output) |
| CSS | Tailwind **4.3.3** via `@tailwindcss/vite` |
| Markdown | `@astrojs/markdown-remark` 7.x (unified processor, no Sätteri) |
| Plugins MD | `remark-directive` + 3 plugins custom |
| Linter | Biome 2.5.6 |
| Runtime | Node `>=22.12.0` |

Las versiones están hardcodeadas en `src/lib/build-info.ts` (no se puede importar `package.json` desde dentro de `src/` por las reglas de Vite/Rolldown).

## Estructura

```
src/
├── components/
│   ├── chapter-list.astro          # lista de capítulos, reusada
│   ├── distro-toggle.astro         # switcher de temas (footer)
│   ├── logos/                      # ASCII logos de distros
│   ├── section-title.astro         # (legacy del tema)
│   └── tui/                        # (legacy del tema, no usado)
├── config.json                     # 26 sistemas: [slug, font, colors{...}]
├── content/                        # 20 .md (capítulos 00–19)
├── content.config.ts               # defineCollection con glob loader
├── layouts/
│   └── default.astro               # layout base, usa config.json
├── lib/
│   ├── build-info.ts               # versiones hardcodeadas
│   ├── fastfetch.ts                # descarga ASCII logos
│   ├── fonts.ts, themes.ts         # tipos y constantes
│   ├── remark-callouts.ts          # containerDirective → .callout HTML
│   ├── remark-obsidian-callouts.ts # > [!type] Title → containerDirective
│   └── remark-wikilink.ts          # [[link|alias]] → /capitulos/{slug}/
├── pages/
│   ├── index.astro                 # home: DistroLogo + info + lista capítulos
│   └── capitulos/
│       ├── index.astro             # /capitulos/ (lista completa)
│       └── [...slug].astro         # /capitulos/{id}/ (capítulo individual)
└── styles/global.css
```

## Comandos

```bash
npm install           # 388 paquetes (~10s con caché limpio)
npm run dev           # dev server en :4321
npm run build         # build estático a ./dist
npm run check         # biome check --write
```

**Termux**: `npm run dev` y `npm run build` fallan porque Astro 7 no publica el binding nativo `@astrojs/compiler-binding-android-arm64`. Trabajar en local (Linux/macOS/Windows) o vía CI.

## Plugins Markdown (orden en `astro.config.ts`)

```ts
remarkPlugins: [
  remarkDirective,           // :::name[Title]  (oficial)
  remarkObsidianCallouts,    // > [!type] Title (Obsidian)
  remarkCallouts,            // containerDirective → HTML .callout
  remarkWikilink,            // [[link|alias]] → link
]
```

Tipos de callout soportados (alineados con Obsidian): `note, abstract, info, tip, success, question, warning, failure, danger, bug, example, quote`.

## Convenciones de código

### Content collections (Content Layer API)

- Definidas en `src/content.config.ts` (NO `src/content/config.ts` — ruta legacy).
- Cada entrada tiene `.id` (NO `.slug`).
- Renderizar con `await render(entry)` (NO `entry.render()`).
- IDs vienen del nombre del archivo: `01-introduccion-...md` → `id: "01-introduccion-..."`.

```ts
import { getCollection, render, type CollectionEntry } from "astro:content";

const chapters = await getCollection("chapters", ({ data }) => !data.draft);
const { Content } = await render(chapter);
```

### Routing

- `/` → home con DistroLogo + tabla de info del libro + lista de capítulos
- `/capitulos/` → índice de capítulos
- `/capitulos/{id}/` → capítulo individual (`id` sin `.md`)

### Frontmatter YAML

Los `.md` usan YAML estricto (js-yaml). Reglas:

- Títulos o descripciones con `:` deben ir entrecomillados.
- Arrays de tags: `tags: [linux, sysadmin]`.
- `published: true` se renombró a `draft: false` (estilo Astro).

### Wikilinks

- Formato: `[[slug|alias]]` o `[[slug]]`.
- Resuelve a `/capitulos/{slug}/`. Sin validación contra collections; links rotos generan 404 al navegar.

### Estilos

- Sin `@tailwindcss/typography` instalado. El CSS de capítulos vive en `<style>` scoped dentro de `[...slug].astro` (clase `.chapter-body`).
- Clases CSS custom: `.callout`, `.callout-title`, `.callout-content`, `.wikilink`, `.wikilink-broken`.

## Añadir un capítulo

1. Crear `src/content/NN-slug-del-capitulo.md` con frontmatter:
   ```yaml
   ---
   title: "Título del capítulo"
   description: "Descripción corta"
   date: 2026-07-11
   mod: 2026-07-11
   draft: false
   tags: [linux, sysadmin]
   ---
   ```
2. (Opcional) Marcar `draft: true` para ocultarlo del build.
3. Commit y push. Cloudflare redeploy automáticamente.

## Cosas que recordar (gotchas)

1. **Termux no puede correr `astro build`** (binding nativo no publicado). Usar CI u otra máquina.
2. **No se puede `import "../package.json"` desde `src/`**. Vite no resuelve fuera de `src/`. Usar `src/lib/build-info.ts`.
3. **mdast une líneas de blockquote** en un único `text` con `\n` embebido. Los plugins que trabajen con blockquotes deben buscar `\n` para separar líneas.
4. **Deprecation warning** actual: `markdown.remarkPlugins` → Astro recomienda `unifiedPlugins` desde `@astrojs/markdown-remark`. No bloquea pero conviene migrar.
5. **Cloudflare Pages usa Node 22.16.0**; `undici@8.10.0` pide `>=22.19.0` (warning EBADENGINE, no bloquea).
6. **El `slug` no existe** en Content Layer API con `glob()`. Usar `.id` siempre.
7. **El `DistroLogo` rota con el tema activo** (definido en `src/config.json`). El logo del libro en el index rota también con el theme switcher.

## Despliegue

Cloudflare Pages conectado a `main`. Build automático en cada push. Output directory: `dist`.

Dashboard: <https://dash.cloudflare.com/> → Pages → `linux-para-hackers`.

## Git

- Branches: solo `main` (no hay develop/staging).
- Commits en español, mensajes cortos: `feat:`, `fix:`, `refactor:`, `chore:`.
- `package-lock.json` se commitea.
- `node_modules/` excluido por `.gitignore`.