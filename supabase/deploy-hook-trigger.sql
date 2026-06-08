-- NexaBlog automatic static rebuild trigger.
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
--
-- This uses Supabase's pg_net extension because it is asynchronous and works
-- well inside Postgres triggers.

create extension if not exists pg_net;

drop trigger if exists posts_redeploy_after_insert on public.posts;
drop trigger if exists posts_redeploy_after_update on public.posts;
drop trigger if exists posts_redeploy_after_delete on public.posts;

create or replace function public.trigger_vercel_deploy()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  post_id uuid;
  post_slug text;
begin
  if TG_OP = 'DELETE' then
    post_id := old.id;
    post_slug := old.slug;
  else
    post_id := new.id;
    post_slug := new.slug;
  end if;

  perform net.http_post(
    url := '__VERCEL_DEPLOY_HOOK_URL__',
    body := jsonb_build_object(
      'source', 'supabase',
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'post_id', post_id,
      'slug', post_slug
    ),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 1000
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger posts_redeploy_after_insert
after insert on public.posts
for each row
when (new.draft = false and new.published_at is not null)
execute function public.trigger_vercel_deploy();

create trigger posts_redeploy_after_update
after update on public.posts
for each row
when (
  (old.draft = false and old.published_at is not null)
  or
  (new.draft = false and new.published_at is not null)
)
execute function public.trigger_vercel_deploy();

create trigger posts_redeploy_after_delete
after delete on public.posts
for each row
when (old.draft = false and old.published_at is not null)
execute function public.trigger_vercel_deploy();
