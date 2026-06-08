-- NexaBlog Supabase schema
-- Run this in the Supabase SQL editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  title text not null,
  description text not null,
  body text not null,
  tags text[] not null default '{}',
  draft boolean not null default true,
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid references auth.users(id) on delete set null
);

create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_at_idx on posts (published_at desc);
create index if not exists posts_draft_idx on posts (draft);
create index if not exists posts_tags_idx on posts using gin (tags);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at
before update on posts
for each row execute function set_updated_at();

drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at
before update on settings
for each row execute function set_updated_at();

alter table posts enable row level security;
alter table settings enable row level security;
alter table admin_users enable row level security;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  );
$$;

drop policy if exists "Published posts are public" on posts;
create policy "Published posts are public"
on posts for select
using (draft = false and published_at is not null and published_at <= now());

drop policy if exists "Authenticated users can read all posts" on posts;
drop policy if exists "Admins can read all posts" on posts;
create policy "Admins can read all posts"
on posts for select
to authenticated
using (is_admin());

drop policy if exists "Authenticated users can insert posts" on posts;
drop policy if exists "Admins can insert posts" on posts;
create policy "Admins can insert posts"
on posts for insert
to authenticated
with check (is_admin() and (auth.uid() = author_id or author_id is null));

drop policy if exists "Authenticated users can update posts" on posts;
drop policy if exists "Admins can update posts" on posts;
create policy "Admins can update posts"
on posts for update
to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists "Authenticated users can delete posts" on posts;
drop policy if exists "Admins can delete posts" on posts;
create policy "Admins can delete posts"
on posts for delete
to authenticated
using (is_admin());

drop policy if exists "Authenticated users can read settings" on settings;
drop policy if exists "Admins can read settings" on settings;
create policy "Admins can read settings"
on settings for select
to authenticated
using (is_admin());

drop policy if exists "Authenticated users can write settings" on settings;
drop policy if exists "Admins can write settings" on settings;
create policy "Admins can write settings"
on settings for all
to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists "Admins can read admin users" on admin_users;
create policy "Admins can read admin users"
on admin_users for select
to authenticated
using (is_admin());

drop policy if exists "Admins can manage admin users" on admin_users;
create policy "Admins can manage admin users"
on admin_users for all
to authenticated
using (is_admin())
with check (is_admin());

insert into posts (slug, title, description, body, tags, draft, featured, published_at)
values
  (
    'hello-supabase-admin',
    'Hello Supabase Admin',
    '这是一篇来自 Supabase 的示例文章，用于验证后台读取链路。',
    '## 后台链路\n\n如果你能在 NexaBlog 后台看到这篇文章，说明 Supabase 表结构、Auth 和 RLS 已经可以协同工作。',
    array['Supabase', 'Admin'],
    true,
    false,
    null
  )
on conflict (slug) do nothing;

-- After creating your first Supabase Auth user, run this once with that user id:
-- insert into admin_users (user_id, email)
-- values ('00000000-0000-0000-0000-000000000000', 'you@example.com')
-- on conflict (user_id) do nothing;
