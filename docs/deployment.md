# NexaBlog Deployment And Integrations

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The site works without any environment variables. Empty values keep dynamic integrations disabled and show a clear pending state in `/admin/`.

## Vercel

1. Import the repository into Vercel.
2. Set the build command to `npm run build:with-supabase`.
3. Set the output directory to `dist`.
4. Add the public environment variables you need from `.env.example`, including `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `PUBLIC_ADMIN_EMAIL` when the admin is enabled.

Before deploying, set a real production URL:

```bash
PUBLIC_SITE_URL=https://your-domain.com
npm run check:production
```

The check script warns when `PUBLIC_SITE_URL` still points to the placeholder domain, and fails when required deployment files are missing.

`vercel.json` already declares the Astro build command, `dist` output directory, clean URLs, trailing slashes, and static asset cache headers.

## Giscus

Create or select a GitHub repository with Discussions enabled, then fill:

- `PUBLIC_GISCUS_REPO`
- `PUBLIC_GISCUS_REPO_ID`
- `PUBLIC_GISCUS_CATEGORY`
- `PUBLIC_GISCUS_CATEGORY_ID`

The article page automatically loads Giscus when all required values are present. If Giscus is not configured, the public article page stays quiet and does not show an admin-facing placeholder.

## Plausible

Set `PUBLIC_PLAUSIBLE_DOMAIN` to your production domain. The analytics script is only emitted when this value exists.

## Donations

Each donation channel supports a display label and optional URL. For example:

```bash
PUBLIC_DONATE_PAYPAL_LABEL=PayPal
PUBLIC_DONATE_PAYPAL_URL=https://paypal.me/example
```

Channels without a label or URL are hidden. If no donation channel and no comment integration are configured, the entire article integration block is hidden from readers.

## Supabase Admin Roadmap

The current `/admin/` route includes a browser-side Supabase admin skeleton. It stays compatible with static Vercel deployment: Auth and database access run through `@supabase/supabase-js`, and security is enforced by Supabase Row Level Security.

To activate it:

1. Create a Supabase project.
2. Enable email or OAuth authentication.
3. In Supabase SQL editor, run `supabase/schema.sql`.
4. Copy the project URL and anon public key into `.env`.
5. Add your local and production URLs to Supabase Auth redirect URLs:
   - `http://localhost:4321/admin/`
   - `http://localhost:4321/admin/login/`
   - `https://your-domain.com/admin/`
   - `https://your-domain.com/admin/login/`
6. Create a user in Supabase Auth or invite yourself.
7. Copy that user's `id` from Supabase Auth and add it to `admin_users`:

```sql
insert into admin_users (user_id, email)
values ('your-auth-user-id', 'you@example.com')
on conflict (user_id) do nothing;
```

8. Open `/admin/login/`, sign in, then verify that `/admin/` can read the `posts` table.

Required variables:

```bash
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PUBLIC_ADMIN_EMAIL=you@example.com
```

The anon key is intentionally public. Do not use a service-role key in this frontend project. Access control must live in RLS policies.
The included policies only allow users listed in `admin_users` to read drafts or write content.

## Manual Content Backups

The admin dashboard can export Supabase posts after login:

- `导出 JSON` downloads a full structured backup that can be imported later.
- `导出 Markdown` downloads a readable archive with frontmatter and body content.
- `导入 JSON` accepts the JSON backup format exported by NexaBlog. Records with the same `id` are updated; new records are inserted. If a new record uses a slug that already exists under another id, Supabase will reject the import and show the conflict.

For disaster recovery, keep the JSON backup. The Markdown export is mainly for human review, migration, and copy editing.

## Supabase Storage Images

The editor can upload post images to a public Supabase Storage bucket named `post-images`.

Run the latest `supabase/schema.sql` in the Supabase SQL editor after pulling this version. It creates or updates the bucket, keeps images publicly readable, and only allows users listed in `admin_users` to upload, update, or delete objects.

Supported upload types:

- JPG
- PNG
- WebP
- GIF

The browser editor limits uploads to 5MB. After upload, NexaBlog inserts a Markdown image using the public Storage URL.

The first schema is stored at:

```sql
supabase/schema.sql
```

Current admin capabilities:

- `/admin/login/`: email/password login and magic link request.
- `/admin/`: static content overview, integration/deployment status, and live Supabase post list when authenticated.
- `/admin/posts/new/`: create a Supabase draft.
- `/admin/posts/edit/?id=<post-id>`: edit an existing Supabase post.
- `npm run sync:supabase`: sync published Supabase posts into Astro Markdown files.
- `npm run build:with-supabase`: sync published posts first, then build the static site.

## Supabase To Static Publishing

NexaBlog keeps the public site static. The admin writes to Supabase, then a build-time script pulls published posts into `src/content/blog/generated/`.

Use this when Supabase is configured:

```bash
npm run sync:supabase
npm run build
```

Or run both steps together:

```bash
npm run build:with-supabase
```

Only records matching all of these conditions are synced:

- `draft = false`
- `published_at is not null`
- `published_at <= now()`

Generated files include a `<!-- generated: supabase -->` marker. The sync script only deletes generated Markdown files with that marker, so hand-written posts in `src/content/blog/` stay untouched.

## Automatic Rebuilds

To make published Supabase changes appear without manually redeploying, use a Vercel Deploy Hook with the Supabase trigger template in `supabase/deploy-hook-trigger.sql`.

Detailed setup is in `docs/auto-publish.md`.

If Supabase is not configured, keep using:

```bash
npm run build
```

Still reserved for the next implementation pass:

- Role-based author permissions.
- Rich Markdown editor toolbar.
