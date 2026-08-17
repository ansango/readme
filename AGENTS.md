# AGENTS.md

Contexto técnico para agentes AI que trabajen en `ansango/readme`.

## Qué es

Sitio web estático (Astro) que renderiza una **biblioteca de wikis técnicas** basadas en libros. Cada libro vive en `src/content/<book-slug>/` con sus capítulos numerados; el capítulo `00-…` de cada libro es el índice de esa wiki y se renderiza en su home. Tema visual "fastfetch style" con `<DistroLogo />` rotativo y paleta de colores configurable por distro.

- Repo: <https://github.com/ansango/readme> (privado)
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
│   ├── distro-toggle.astro         # switcher de temas (footer)
│   ├── logos/                      # ASCII logos de distros
│   ├── section-title.astro         # (legacy del tema)
│   └── tui/                        # (legacy del tema, no usado)
├── config.json                     # 26 sistemas: [slug, font, colors{...}]
├── content/
│   └── linux-para-hackers/         # libro "Linux Basics for Hackers" (20 .md)
├── content.config.ts               # defineCollection + tipos Chapter/ChapterData
├── layouts/
│   └── default.astro               # layout base, usa config.json
├── lib/
│   ├── book-slug.ts                # bookSlugFromId / chapterIdFromId
│   ├── build-info.ts               # versiones hardcodeadas
│   ├── fastfetch.ts                # descarga ASCII logos
│   ├── fonts.ts, themes.ts         # tipos y constantes
│   ├── remark-callouts.ts          # containerDirective → .callout HTML
│   ├── remark-obsidian-callouts.ts # > [!type] Title → containerDirective
│   ├── remark-strip-first-heading.ts # quita el primer heading del AST
│   └── remark-wikilink.ts          # [[link|alias]] → /{book}/{chapter}/
└── pages/
    ├── index.astro                 # / lista de libros
    └── [book]/
        ├── index.astro             # /{book}/ (renderiza el cap. 00-)
        └── [chapter].astro         # /{book}/{chapter}/ (capítulos 01+)
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

Se configuran vía `markdown.processor = unified({...})` desde `@astrojs/markdown-remark` (la opción legacy `markdown.remarkPlugins` solo aplica a `.md` sueltos en `src/pages/` y no a las entradas de las content collections).

```ts
import { unified } from "@astrojs/markdown-remark";

markdown: {
  processor: unified({
    remarkPlugins: [
      remarkDirective,           // :::name[Title]  (oficial)
      remarkObsidianCallouts,    // > [!type] Title (Obsidian)
      remarkCallouts,            // containerDirective → HTML .callout
      remarkStripFirstHeading,   // quita el primer <h1> del AST
      remarkWikilink,            // [[link|alias]] → link
    ],
  }),
},
```

Tipos de callout soportados (alineados con Obsidian): `note, abstract, info, tip, success, question, warning, failure, danger, bug, example, quote`.

## Convenciones de código

### Content collections (Content Layer API)

- Definidas en `src/content.config.ts` (NO `src/content/config.ts` — ruta legacy).
- Cada entrada tiene `.id` (NO `.slug`). Con el glob loader `*/**/*.md` el id tiene forma `<book-slug>/<chapter-id>` (p.ej. `linux-para-hackers/01-introduccion-a-linux-y-distribuciones-debian`).
- Renderizar con `await render(entry)` (NO `entry.render()`).

```ts
import { getCollection, render, type CollectionEntry } from "astro:content";
import { bookSlugFromId, chapterIdFromId } from "../lib/book-slug";

const chapters = await getCollection("chapters", ({ data }) => !data.draft);
const { Content } = await render(chapter);
const book = bookSlugFromId(chapter.id);       // "linux-para-hackers"
const chap = chapterIdFromId(chapter.id);      // "01-introduccion-..."
```

### Routing

- `/` → estantería de libros: itera los grupos por `<book-slug>` y muestra el título, autor y nº de capítulos de cada uno. No renderiza contenido de capítulos.
- `/{book-slug}/` → home del libro: renderiza el capítulo `00-…` (el índice de esa wiki).
- `/{book-slug}/{chapter-id}/` → capítulo individual (los `01-…` en adelante). El `00-…` no se genera aquí porque ya vive en la home del libro.
- `/capitulos/*` → redirect 301 a `/linux-para-hackers/:splat`. Definido en `public/_redirects` (Cloudflare Pages lo aplica en el edge en producción) **y** duplicado en `astro.config.ts` → `redirects` (para que el dev server lo respete). Mantenido por SEO/backlinks.

El capítulo que actúa como índice debe empezar por `00-` y vive en `src/content/<book-slug>/00-…md`. La lista de capítulos de un libro vive en ese markdown (no se duplica en código).

### Metadata del libro

Vive en el frontmatter del capítulo `00-…` de cada libro. Campos opcionales del schema:

- `bookAuthor: z.string().optional()` — autor del libro.
- `bookSubtitle: z.string().optional()` — subtítulo.

Los capítulos `01-…` en adelante solo declaran los campos estándar (`title`, `description`, `date`, `mod`, `draft`, `tags`).

### Frontmatter YAML

Los `.md` usan YAML estricto (js-yaml). Reglas:

- Títulos o descripciones con `:` deben ir entrecomillados.
- Arrays de tags: `tags: [linux, sysadmin]`.
- `published: true` se renombró a `draft: false` (estilo Astro).

### Wikilinks

- Formato: `[[slug|alias]]` o `[[slug]]`.
- Resuelve a `/{book-slug}/{chapter-slug}/`. El book-slug se obtiene del archivo que se está procesando en build (`file.path` es una URL `file://` rellenada por Astro 7). Sin validación contra collections; links rotos generan 404 al navegar.
- Si el archivo no vive bajo `src/content/<book>/`, el plugin degrada a `/<slug>/` (sin prefijo de libro).

### Estilos

- Sin `@tailwindcss/typography` instalado. El CSS de capítulos vive en `<style>` scoped dentro de `[chapter].astro` (clase `.chapter-body`).
- Clases CSS custom: `.callout`, `.callout-title`, `.callout-content`, `.wikilink`, `.wikilink-broken`.

## Añadir un libro

1. Crear `src/content/<book-slug>/00-<slug-del-indice>.md` con frontmatter:
   ```yaml
   ---
   title: "Título del libro"
   bookAuthor: "Nombre del autor"
   bookSubtitle: "Subtítulo (opcional)"
   description: "Descripción corta del libro"
   date: 2026-07-11
   mod: 2026-07-11
   draft: false
   tags: [linux, sysadmin]
   ---
   ```
2. Añadir capítulos `01-…`, `02-…`, etc. en la misma carpeta.
3. (Opcional) Marcar `draft: true` en cualquier capítulo para ocultarlo del build.
4. La home `/` listará el libro automáticamente.
5. Commit y push. Cloudflare redeploy automáticamente.

## Cosas que recordar (gotchas)

1. **Termux no puede correr `astro build`** (binding nativo no publicado). Usar CI u otra máquina.
2. **No se puede `import "../package.json"` desde `src/`**. Vite no resuelve fuera de `src/`. Usar `src/lib/build-info.ts`.
3. **mdast une líneas de blockquote** en un único `text` con `\n` embebido. Los plugins que trabajen con blockquotes deben buscar `\n` para separar líneas.
4. **`markdown.processor = unified({...})`** es la API actual para plugins de remark en Astro 7. Configurar los plugins aquí (no en `markdown.remarkPlugins`) hace que se ejecuten también sobre las entradas de las content collections.
5. **Cloudflare Pages usa Node 22.16.0**; `undici@8.10.0` pide `>=22.19.0` (warning EBADENGINE, no bloquea).
6. **El `slug` no existe** en Content Layer API con `glob()`. Usar `.id` siempre. Con el loader `*/**/*.md`, el id incluye el `<book-slug>/`.
7. **El `DistroLogo` rota con el tema activo** (definido en `src/config.json`). El logo del libro en el index rota también con el theme switcher.
8. **`file.path` en remark plugins** es una URL `file://` absoluta. El parser de book-slug usa `/src/content/` como marcador estable.
9. **Cambios en `astro.config.ts` requieren reiniciar el dev server**. Astro solo hace HMR de contenido y plugins de Vite; la config de nivel superior (p.ej. `redirects`, `site`, `output`) no se recarga en caliente.

## Despliegue

Cloudflare Pages conectado a `main`. Build automático en cada push. Output directory: `dist`.

Dashboard: <https://dash.cloudflare.com/> → Pages → proyecto (el nombre en Cloudflare puede no coincidir con el repo). Tras renombrar el repo, reconectar el build desde el dashboard apuntando a `ansango/readme`.

## Git

- Branches: solo `main` (no hay develop/staging).
- Commits en español, mensajes cortos: `feat:`, `fix:`, `refactor:`, `chore:`.
- `package-lock.json` se commitea.
- `node_modules/` excluido por `.gitignore`.