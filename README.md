# NexaBlog

NexaBlog is a static-first personal blog built with Astro and Supabase. It keeps the public site fast and static, while the admin can create, edit, publish, and delete posts through Supabase. Published database posts are pulled into the static build and can trigger Vercel redeploys automatically.

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

Copy `.env.example` to `.env` when you want to enable Supabase admin, comments, analytics, or donations.

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

Still reserved for a later pass:

- Automated backups.
- Pagefind replacement for large search indexes.

## Dynamic Enhancement

- `/admin/` shows static build status plus live Supabase post management.
- Giscus, Plausible, Supabase, and donation channels are controlled by public environment variables.
- Article pages automatically show configured donation methods and load Giscus when ready.
- `/admin/login/`, `/admin/posts/new/`, and `/admin/posts/edit/?id=...` provide Supabase-backed article CRUD.
- `supabase/schema.sql` contains the first posts/settings schema and RLS policies.
- `npm run sync:supabase` pulls published Supabase posts into `src/content/blog/generated/`.
- `supabase/deploy-hook-trigger.sql` can trigger Vercel rebuilds when published posts change.

See `docs/deployment.md` for the exact variables and deployment flow.

## Deployment

The project includes `vercel.json` and a production readiness script. Set `PUBLIC_SITE_URL` to the real domain before deployment, then run:

```bash
npm run check:production
npm run build:with-supabase
```
