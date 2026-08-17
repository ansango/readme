# AGENTS.md

Technical context for AI agents working on `ansango/readme`.

## What it is

Static website (Astro) that renders a **library of technical-book wikis**. Each book lives in `src/content/<book-slug>/` with its numbered chapters; the `00-…` chapter of every book is the index of that wiki and is rendered on its home. Visual theme "fastfetch style" with a rotating `<DistroLogo />` and a per-distro color palette.

- Repo: <https://github.com/ansango/readme> (private)
- Origin: forked from `ansango/astro-distro` (base theme) and adapted to content collections.

## Stack

| | |
|---|---|
| Framework | Astro **7.1.6** (static output) |
| CSS | Tailwind **4.3.3** via `@tailwindcss/vite` |
| Markdown | `@astrojs/markdown-remark` 7.x (unified processor, no Sätteri) |
| MD plugins | `remark-directive` + 3 custom plugins |
| Linter | Biome 2.5.6 |
| Runtime | Node `>=22.12.0` |

Versions are hardcoded in `src/lib/build-info.ts` (cannot import `package.json` from inside `src/` due to Vite/Rolldown rules).

## Structure

```
src/
├── components/
│   ├── distro-toggle.astro         # theme switcher (footer)
│   ├── logos/                      # distro ASCII logos
│   ├── section-title.astro         # (legacy from the theme)
│   └── tui/                        # (legacy from the theme, unused)
├── config.json                     # 26 systems: [slug, font, colors{...}]
├── content/
│   └── linux-para-hackers/         # book "Linux Basics for Hackers" (20 .md)
├── content.config.ts               # defineCollection + Chapter/ChapterData types
├── layouts/
│   └── default.astro               # base layout, uses config.json
├── lib/
│   ├── books.ts                    # class Books: groupByBook, findIndex, listFromChapters
│   ├── chapters.ts                 # class Chapters: all(), getNumbered, totalReadingTime
│   ├── date-formatter.ts           # class DateFormatter: iso, longDate
│   ├── book-slug.ts                # bookSlugFromId / chapterIdFromId
│   ├── build-info.ts               # hardcoded versions
│   ├── fastfetch.ts                # fetches ASCII logos
│   ├── fonts.ts, themes.ts         # types and constants
│   └── reading-time.ts             # readingTime / formatReadingTime
├── plugins/
│   └── remark/
│       ├── callouts.ts             # containerDirective → .callout HTML
│       ├── obsidian-callouts.ts    # > [!type] Title → containerDirective
│       ├── strip-first-heading.ts  # drops the first heading from the AST
│       └── wikilink.ts             # [[link|alias]] → /{book}/{chapter}/
└── pages/
    ├── index.astro                 # / book list
    └── [book]/
        ├── index.astro             # /{book}/ (renders chapter 00-)
        └── [chapter].astro         # /{book}/{chapter}/ (chapters 01+)
└── styles/global.css
```

## Commands

```bash
npm install           # 388 packages (~10s with a clean cache)
npm run dev           # dev server on :4321
npm run build         # static build to ./dist
npm run check         # biome check --write
```

**Termux**: `npm run dev` and `npm run build` fail because Astro 7 does not publish the native binding `@astrojs/compiler-binding-android-arm64`. Develop locally (Linux/macOS/Windows) or via CI.

## Markdown plugins (order in `astro.config.ts`)

Configured via `markdown.processor = unified({...})` from `@astrojs/markdown-remark` (the legacy `markdown.remarkPlugins` option only applies to loose `.md` files in `src/pages/`, not to content-collection entries).

```ts
import { unified } from "@astrojs/markdown-remark";

markdown: {
  processor: unified({
    remarkPlugins: [
      remarkDirective,           // :::name[Title]  (official)
      remarkObsidianCallouts,    // > [!type] Title (Obsidian)
      remarkCallouts,            // containerDirective → HTML .callout
      remarkStripFirstHeading,   // drops the first <h1> from the AST
      remarkWikilink,            // [[link|alias]] → link
    ],
  }),
},
```

Supported callout types (aligned with Obsidian): `note, abstract, info, tip, success, question, warning, failure, danger, bug, example, quote`.

## Code conventions

### Content collections (Content Layer API)

- Defined in `src/content.config.ts` (NOT `src/content/config.ts` — legacy path).
- Each entry has `.id` (NOT `.slug`). With the glob loader `*/**/*.md` the id has the form `<book-slug>/<chapter-id>` (e.g. `linux-para-hackers/01-introduccion-a-linux-y-distribuciones-debian`).
- Render with `await render(entry)` (NOT `entry.render()`).

```ts
import { getCollection, render, type CollectionEntry } from "astro:content";
import { bookSlugFromId, chapterIdFromId } from "../lib/book-slug";

const chapters = await getCollection("chapters", ({ data }) => !data.draft);
const { Content } = await render(chapter);
const book = bookSlugFromId(chapter.id);       // "linux-para-hackers"
const chap = chapterIdFromId(chapter.id);      // "01-introduccion-..."
```

### Routing

- `/` → bookshelf: iterates groups by `<book-slug>` and shows the title, author and chapter count of each. Does not render chapter content.
- `/{book-slug}/` → book home: renders the `00-…` chapter (the index of that wiki).
- `/{book-slug}/{chapter-id}/` → individual chapter (`01-…` and beyond). The `00-…` is not generated here because it already lives on the book's home.
- `/capitulos/*` → 301 redirect to `/linux-para-hackers/:splat`. Defined in `public/_redirects` (Cloudflare Pages applies it at the edge in production) **and** duplicated in `astro.config.ts` → `redirects` (so the dev server honors it). Maintained for SEO/backlinks.

The chapter that acts as the index must start with `00-` and lives in `src/content/<book-slug>/00-…md`. The list of chapters of a book lives in that markdown (not duplicated in code).

### Frontmatter schema

The current schema (in `src/content.config.ts`) is intentionally lean:

```ts
const chapterSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  mod: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
```

- Book-level metadata (author, subtitle) is no longer part of the schema. If needed, it goes in the chapter body (e.g. as an Obsidian callout at the top of `00-…`).
- The `01-…` chapters onwards only declare the standard fields above.
- `published: true` was renamed to `draft: false` (Astro style).

### Wikilinks

- Format: `[[slug|alias]]` or `[[slug]]`.
- Resolves to `/{book-slug}/{chapter-slug}/`. The book-slug is obtained from the file being processed at build (`file.path` is a `file://` URL filled in by Astro 7). No validation against collections; broken links produce 404 when navigated.
- If the file does not live under `src/content/<book>/`, the plugin degrades to `/<slug>/` (no book prefix).

### Styles

- No `@tailwindcss/typography` installed. Chapter CSS lives in a scoped `<style>` inside `[chapter].astro` (class `.chapter-body`).
- Custom CSS classes: `.callout`, `.callout-title`, `.callout-content`, `.wikilink`, `.wikilink-broken`.

## Adding a book

1. Create `src/content/<book-slug>/00-<index-slug>.md` with frontmatter:

   ```yaml
   ---
   title: "Book title"
   description: "Short description of the book"
   date: 2026-07-11
   mod: 2026-07-11
   draft: false
   tags: [linux, sysadmin]
   ---
   ```

2. Add chapters `01-…`, `02-…`, etc. in the same folder.
3. (Optional) Mark `draft: true` on any chapter to hide it from the build.
4. The home `/` will list the book automatically.
5. Commit and push. Cloudflare will redeploy automatically.

## Gotchas

1. **Termux cannot run `astro build`** (no published native binding). Use CI or another machine.
2. **`import "../package.json"` from `src/` is not allowed.** Vite does not resolve outside `src/`. Use `src/lib/build-info.ts`.
3. **mdast joins blockquote lines** into a single `text` node with embedded `\n`. Plugins that work with blockquotes must split on `\n`.
4. **`markdown.processor = unified({...})`** is the current API for remark plugins in Astro 7. Configuring plugins here (not in `markdown.remarkPlugins`) makes them also run on content-collection entries.
5. **Cloudflare Pages uses Node 22.16.0**; `undici@8.10.0` requires `>=22.19.0` (EBADENGINE warning, non-blocking).
6. **`slug` does not exist** in the Content Layer API with `glob()`. Always use `.id`. With the loader `*/**/*.md`, the id includes the `<book-slug>/`.
7. **`DistroLogo` rotates with the active theme** (defined in `src/config.json`). The book logo on the index also rotates with the theme switcher.
8. **`file.path` in remark plugins** is an absolute `file://` URL. The book-slug parser uses `/src/content/` as a stable marker.
9. **Changes to `astro.config.ts` require restarting the dev server.** Astro only does HMR of content and Vite plugins; top-level config (e.g. `redirects`, `site`, `output`) is not hot-reloaded.

## Deployment

Cloudflare Pages connected to `main`. Automatic build on every push. Output directory: `dist`.

Dashboard: <https://dash.cloudflare.com/> → Pages → project (the Cloudflare project name may not match the repo). After renaming the repo, reconnect the build from the dashboard pointing at `ansango/readme`.

## Git

- Branches: only `main` (no develop/staging).
- Commits in English, short messages: `feat:`, `fix:`, `refactor:`, `chore:`.
- `package-lock.json` is committed.
- `node_modules/` is excluded by `.gitignore`.
