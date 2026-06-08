# NexaBlog V1 Design

Date: 2026-06-07

## Direction

Build NexaBlog V1 as a polished static-first personal blog. The public reading experience is the product core: fast pages, strong typography, clear article discovery, dark/light themes, SEO, RSS, and small progressive enhancements.

The Supabase-backed admin system, database persistence, and advanced integrations are reserved for V2. V1 keeps clean extension points so those features can be added without replacing the public site.

## Product Scope

V1 includes:

- Home page with a focused editorial introduction, featured article, recent articles, tags, and newsletter-style CTA.
- Markdown content collection for articles.
- Article detail pages with metadata, reading time, tag links, generated table of contents, code copy buttons, and comment/donation placeholders.
- Article index, tag index, about page, links page, search page, RSS feed, sitemap, and custom 404 page.
- Light/dark/system theme handling with persistent user preference.
- Static JSON search index with client-side filtering.
- Responsive desktop, tablet, and mobile layout with a bottom mobile navigation bar.

V1 intentionally excludes:

- Supabase Auth and PostgreSQL-backed article CRUD.
- Full admin dashboard.
- Real Giscus, Plausible, and donation provider credentials.
- Automated database backup.

## Architecture

Astro renders the public site at build time. Blog posts live in `src/content/blog` and are validated with an Astro content collection schema. Shared layout, navigation, SEO metadata, and design tokens are centralized in reusable components and global CSS.

Client JavaScript is limited to progressive enhancements:

- `theme.ts` controls theme preference.
- `search.ts` fetches `/search-index.json` and filters locally.
- `article.ts` handles code copy, table-of-contents active state, and back-to-top behavior.

## Design

The visual language follows "Nexa Minimal": editorial, quiet, and precise. The page uses restrained color, generous negative space, 8px-radius cards, crisp borders, and a single dominant reading column. Motion is short and functional, with no decorative blobs or heavy gradients.

Light and dark themes use CSS variables from the source spec. The accent color is blue, but the interface is not a one-hue composition: neutral surfaces, strong text contrast, and content hierarchy do most of the work.

## Data Flow

Article Markdown frontmatter provides title, description, dates, tags, cover metadata, draft status, and feature flag. Astro collection utilities sort and filter published articles. Search and RSS consume the same source collection so public lists, feeds, and search results stay consistent.

## Error Handling

Missing optional article fields fall back to sensible defaults. Empty search queries show an editorial prompt. No-result searches show a plain recovery message. The 404 page links back to articles and search.

## Testing And Verification

V1 is verified through:

- `npm run build` to validate Astro routes, content schema, RSS, and TypeScript.
- Manual browser pass on home, article, search, tags, and mobile layout.
- Dev server URL for user acceptance.

## Extension Points

Future dynamic enhancement should attach behind stable public interfaces:

- Admin publishing can write Markdown files or sync from Supabase into the content collection.
- Giscus, Plausible, and donation methods can be activated by config.
- Pagefind can replace the JSON search without changing the search page UI.
