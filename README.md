# README

> Wikis of books I have read.

Static website (Astro) where I document what I learn by reading technical books. Each book lives as its own wiki in `src/content/<book-slug>/`, and the landing page (`/`) lists every available wiki.

> **Disclaimer**: the content of each wiki is my own, not a reproduction of the books. See [`/about`](https://github.com/ansango/readme/blob/main/src/pages/about.md) for the full notice.

## Stack

- **Astro 7** (static output) + **Tailwind 4** via `@tailwindcss/vite`
- Markdown with custom plugins: Obsidian callouts, `[[slug]]` wikilinks, first-heading strip
- Linter: Biome
- Deploy: Cloudflare Pages

## Commands

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # ./dist
npm run check    # biome check --write
```

> ⚠️ **Termux**: `dev` and `build` fail (no native binding published for `android-arm64`). Develop on Linux/macOS/Windows or via CI.

## Structure

```
src/
├── content/<book-slug>/
│   ├── 00-<index-slug>.md   # book index (frontmatter + TOC)
│   └── NN-<chapter>.md       # numbered chapters
├── pages/
│   ├── index.astro            # /  → bookshelf
│   ├── about.md               # /about  → disclaimer
│   └── [book]/{index,[chapter]}.astro
└── lib/
    ├── book-slug.ts            # bookSlugFromId / chapterIdFromId
    └── remark-*.ts             # custom markdown plugins
```

## Adding a book

1. Create `src/content/<book-slug>/00-<index>.md` with this frontmatter:

   ```yaml
   ---
   title: "Book title"
   description: "Short description"
   date: 2026-08-17
   mod: 2026-08-17
   draft: false
   tags: [tag1, tag2]
   ---
   ```

2. Add the chapters `01-…`, `02-…` in the same folder.
3. The home `/` will list the book automatically on push.
4. Credit the original work in `/about` (under "Books that inspired this wiki").

More technical details for AI agents: see [`AGENTS.md`](./AGENTS.md).
