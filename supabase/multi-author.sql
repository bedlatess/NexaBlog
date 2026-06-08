-- NexaBlog multi-author support migration
--
-- Usage: Run this in Supabase SQL editor after the initial schema.sql
--
-- What it does:
-- 1. Add role column to admin_users (admin | author)
-- 2. Update RLS policies so authors can only edit their own posts
-- 3. Add author display name

-- Add role and display name to admin_users
alter table public.admin_users
  add column if not exists role text not null default 'author' check (role in ('admin', 'author')),
  add column if not exists display_name text;

-- Set existing users to admin role
update public.admin_users set role = 'admin' where role = 'author';

-- Helper function: check if current user is admin
create or replace function public.is_admin()
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
      and admin_users.role = 'admin'
  );
$$;

-- Update posts RLS policies for author role

drop policy if exists "Admins can insert posts" on public.posts;
create policy "Admins and authors can insert posts"
on public.posts for insert
to authenticated
with check (
  exists (
    select 1 from admin_users
    where admin_users.user_id = auth.uid()
  )
  and (auth.uid() = author_id or author_id is null)
);

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update any post, authors can update their own"
on public.posts for update
to authenticated
using (
  is_admin() or (
    exists (select 1 from admin_users where admin_users.user_id = auth.uid())
    and author_id = auth.uid()
  )
)
with check (
  is_admin() or (
    exists (select 1 from admin_users where admin_users.user_id = auth.uid())
    and author_id = auth.uid()
  )
);

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete any post, authors can delete their own"
on public.posts for delete
to authenticated
using (
  is_admin() or (
    exists (select 1 from admin_users where admin_users.user_id = auth.uid())
    and author_id = auth.uid()
  )
);

-- Settings table remains admin-only (no change needed)

-- Admin users table: admins can manage, authors can only read
drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage users, authors can read"
on public.admin_users for all
to authenticated
using (
  is_admin() or (
    exists (select 1 from admin_users where admin_users.user_id = auth.uid())
  )
)
with check (is_admin());

comment on column public.admin_users.role is 'admin: full access; author: can only edit own posts';
comment on column public.admin_users.display_name is 'Public display name for article attribution';
