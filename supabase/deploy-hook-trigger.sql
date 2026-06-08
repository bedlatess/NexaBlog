-- NexaBlog automatic static rebuild trigger
--
-- Usage:
-- 1. Create a Vercel Deploy Hook for the production branch.
-- 2. Replace __VERCEL_DEPLOY_HOOK_URL__ below with the hook URL.
-- 3. Run this file in the Supabase SQL editor.
--
-- The triggers call Vercel only when public content may have changed:
-- - a published post is inserted
-- - a post is published, unpublished, or edited while published
-- - a published post is deleted

drop trigger if exists posts_redeploy_after_insert on public.posts;
drop trigger if exists posts_redeploy_after_update on public.posts;
drop trigger if exists posts_redeploy_after_delete on public.posts;

create trigger posts_redeploy_after_insert
after insert on public.posts
for each row
when (new.draft = false and new.published_at is not null)
execute function supabase_functions.http_request(
  '__VERCEL_DEPLOY_HOOK_URL__',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);

create trigger posts_redeploy_after_update
after update on public.posts
for each row
when (
  (old.draft = false and old.published_at is not null)
  or
  (new.draft = false and new.published_at is not null)
)
execute function supabase_functions.http_request(
  '__VERCEL_DEPLOY_HOOK_URL__',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);

create trigger posts_redeploy_after_delete
after delete on public.posts
for each row
when (old.draft = false and old.published_at is not null)
execute function supabase_functions.http_request(
  '__VERCEL_DEPLOY_HOOK_URL__',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);
