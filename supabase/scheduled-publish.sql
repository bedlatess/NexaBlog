-- NexaBlog scheduled publish trigger.
--
-- Usage:
-- 1. Make sure deploy-hook-trigger.sql has already been applied (the
--    trigger_vercel_deploy function must exist).
-- 2. Replace __VERCEL_DEPLOY_HOOK_URL__ with your Vercel Deploy Hook URL.
-- 3. Run this file in the Supabase SQL editor.
--
-- What it does:
-- Every 5 minutes, look for posts whose published_at has passed but the
-- static site has not yet been rebuilt for them.  A lightweight flag column
-- `rebuild_pending` tracks this.  When the cron job finds pending posts it
-- calls the Vercel Deploy Hook once and clears the flag.
--
-- This lets you set published_at to a future date in the admin editor and
-- have the post go live automatically without any manual action.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Add rebuild_pending flag if it does not already exist.
alter table public.posts
  add column if not exists rebuild_pending boolean not null default false;

-- When a post's published_at is set to a future date, mark it pending.
create or replace function public.mark_scheduled_post_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A post is "scheduled" when it is not a draft but published_at is in the future.
  if new.draft = false and new.published_at is not null and new.published_at > now() then
    new.rebuild_pending := true;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_mark_scheduled_pending on public.posts;
create trigger posts_mark_scheduled_pending
before insert or update on public.posts
for each row execute function public.mark_scheduled_post_pending();

-- Cron job: every 5 minutes, fire the Deploy Hook if any scheduled post is now due.
select cron.schedule(
  'nexablog-scheduled-publish',
  '*/5 * * * *',
  $$
    do $$
    declare
      due_count int;
    begin
      select count(*) into due_count
      from public.posts
      where draft = false
        and published_at is not null
        and published_at <= now()
        and rebuild_pending = true;

      if due_count > 0 then
        perform net.http_post(
          url := '__VERCEL_DEPLOY_HOOK_URL__',
          body := jsonb_build_object(
            'source', 'nexablog-cron',
            'reason', 'scheduled-publish',
            'count', due_count
          ),
          headers := '{"Content-Type":"application/json"}'::jsonb,
          timeout_milliseconds := 2000
        );

        update public.posts
        set rebuild_pending = false
        where draft = false
          and published_at is not null
          and published_at <= now()
          and rebuild_pending = true;
      end if;
    end;
    $$ language plpgsql;
  $$
);
