# README

> Wikis de libros que he leído.

Sitio web estático (Astro) donde documento lo que aprendo leyendo libros técnicos. Cada libro vive como una wiki propia en `src/content/<book-slug>/`, y la portada (`/`) lista todas las wikis disponibles.

> **Aviso legal**: el contenido de cada wiki es de mi autoría, no una reproducción de los libros. Ver [`/about`](https://github.com/ansango/readme/blob/main/src/pages/about.md) para el disclaimer completo.

## Stack

- **Astro 7** (static output) + **Tailwind 4** via `@tailwindcss/vite`
- Markdown con plugins custom: callouts de Obsidian, wikilinks `[[slug]]`, strip del primer heading
- Linter: Biome
- Deploy: Cloudflare Pages

## Comandos

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # ./dist
npm run check    # biome check --write
```

> ⚠️ **Termux**: `dev` y `build` fallan (binding nativo no publicado para `android-arm64`). Trabajar en Linux/macOS/Windows o vía CI.

## Estructura

```
src/
├── content/<book-slug>/
│   ├── 00-<slug-del-indice>.md   # índice del libro (frontmatter + TOC)
│   └── NN-<capitulo>.md           # capítulos numerados
├── pages/
│   ├── index.astro                # /  → estantería
│   ├── about.md                   # /about  → disclaimer
│   └── [book]/{index,[chapter]}.astro
└── lib/
    ├── book-slug.ts                # bookSlugFromId / chapterIdFromId
    └── remark-*.ts                 # plugins custom de markdown
```

## Añadir un libro

1. Crear `src/content/<book-slug>/00-<indice>.md` con el frontmatter:

   ```yaml
   ---
   title: "Título del libro"
   bookAuthor: "Nombre del autor"
   bookSubtitle: "Subtítulo (opcional)"
   description: "Descripción corta"
   date: 2026-08-17
   mod: 2026-08-17
   draft: false
   tags: [tag1, tag2]
   ---
   ```

2. Añadir los capítulos `01-…`, `02-…` en la misma carpeta.
3. La home `/` listará el libro automáticamente al hacer push.
4. Atribuir la obra original en `/about` (lista de "Libros que han inspirado esta wiki").

Más detalles técnicos para agentes AI: ver [`AGENTS.md`](./AGENTS.md).