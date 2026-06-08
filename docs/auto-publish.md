# Auto Publish

NexaBlog keeps the public site static. To make published Supabase posts appear without manually clicking **Redeploy**, connect Supabase `posts` changes to a Vercel Deploy Hook.

## Flow

1. Admin publishes or edits a public post in Supabase.
2. A Supabase database trigger sends a `POST` request to a Vercel Deploy Hook.
3. Vercel runs `npm run build:with-supabase`.
4. The build syncs published Supabase posts into `src/content/blog/generated/` and publishes the static site.

## Setup

1. In Vercel, open the NexaBlog project.
2. Go to **Settings -> Git -> Deploy Hooks**.
3. Create a hook named `supabase-posts` for the production branch.
4. Copy the generated hook URL.
5. Open `supabase/deploy-hook-trigger.sql`.
6. Replace `__VERCEL_DEPLOY_HOOK_URL__` with the copied Vercel hook URL.
7. Run the SQL in the Supabase SQL editor.

## Behavior

- Draft saves do not trigger a rebuild.
- Publishing a post triggers a rebuild.
- Editing an already published post triggers a rebuild.
- Unpublishing or deleting a published post triggers a rebuild.

Vercel deploy hooks are secret URLs. Treat the copied URL like a password.
