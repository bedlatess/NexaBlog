# NexaBlog

NexaBlog is a static-first personal blog built with Astro. V1 focuses on the public reading experience: fast pages, Markdown articles, tags, search, RSS, SEO, dark/light/system themes, and small progressive enhancements.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run build:with-supabase
npm run sync:supabase
npm run check:production
npm run preview
```

Copy `.env.example` to `.env` when you want to enable comments, analytics, donations, or the future Supabase admin integration.

## Structure

- `src/content/blog/` - Markdown articles.
- `src/content.config.ts` - Astro content collection schema and loader.
- `src/pages/` - Static routes, RSS, sitemap, robots, and search index.
- `src/components/` - Header, footer, mobile navigation, and article cards.
- `src/styles/global.css` - Nexa Minimal design system.
- `public/scripts/` - Theme, search, and article enhancement scripts.

## Current Scope

Implemented in V1:

- Home, article archive, article detail, tags, search, about, links, and custom 404 pages.
- Markdown content collection with reading time and metadata.
- Static JSON search index.
- RSS, sitemap, robots, Open Graph metadata, and canonical URLs.
- System/light/dark theme handling with persisted preference.
- Code copy buttons, active table of contents, back-to-top, and mobile bottom navigation.

Reserved for V2:

- Supabase Auth and PostgreSQL-backed article CRUD.
- Automated backups.
- Pagefind replacement for large search indexes.

## Dynamic Enhancement

V2 groundwork is already present:

- `/admin/` shows a static control console with content counts and integration status.
- Giscus, Plausible, Supabase, and donation channels are controlled by public environment variables.
- Article pages automatically show configured donation methods and load Giscus when ready.
- `/admin/login/`, `/admin/posts/new/`, and `/admin/posts/edit/?id=...` provide a Supabase-backed admin skeleton.
- `supabase/schema.sql` contains the first posts/settings schema and RLS policies.
- `npm run sync:supabase` pulls published Supabase posts into `src/content/blog/generated/`.

See `docs/deployment.md` for the exact variables and deployment flow.

## Deployment

The project includes `vercel.json` and a production readiness script. Set `PUBLIC_SITE_URL` to the real domain before deployment, then run:

```bash
npm run check:production
npm run build
```
