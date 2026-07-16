-- EthnoVerse RLS policies
-- Cross-checked against the live Supabase schema on 2026-07-15.
-- Run this file as the postgres role in the Supabase SQL Editor.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.communities enable row level security;
alter table public.documents enable row level security;
alter table public.interviews enable row level security;
alter table public.model_jobs enable row level security;
alter table public.tour_objects enable row level security;
alter table public.users enable row level security;
alter table public.visual_media enable row level security;

drop policy if exists "Public read communities" on public.communities;
drop policy if exists "Public read interviews" on public.interviews;
drop policy if exists "public read interviews" on public.interviews;
drop policy if exists "Anon insert" on public.tour_objects;
drop policy if exists "Public read" on public.tour_objects;
drop policy if exists "Users can read own role" on public.users;
drop policy if exists "Allow insert media" on public.visual_media;
drop policy if exists "Allow read media" on public.visual_media;

drop policy if exists "Allow public reads" on storage.objects;
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "allow anon uploads terrain-files" on storage.objects;
drop policy if exists "allow uploads" on storage.objects;

create policy communities_public_read
on public.communities
for select
to anon, authenticated
using (true);

create policy communities_admin_all
on public.communities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy documents_public_read
on public.documents
for select
to anon, authenticated
using (true);

create policy documents_admin_all
on public.documents
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy interviews_public_read
on public.interviews
for select
to anon, authenticated
using (true);

create policy interviews_admin_all
on public.interviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy model_jobs_admin_all
on public.model_jobs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tour_objects_public_read
on public.tour_objects
for select
to anon, authenticated
using (true);

create policy tour_objects_admin_all
on public.tour_objects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy users_read_self
on public.users
for select
to authenticated
using (auth.uid() = user_id);

create policy users_admin_all
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy visual_media_public_read
on public.visual_media
for select
to anon, authenticated
using (true);

create policy visual_media_admin_all
on public.visual_media
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy archive_storage_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('terrain-files', 'tour-objects'));

create policy archive_storage_admin_all
on storage.objects
for all
to authenticated
using (
  bucket_id in ('terrain-files', 'tour-objects')
  and public.is_admin()
)
with check (
  bucket_id in ('terrain-files', 'tour-objects')
  and public.is_admin()
);

commit;

-- Verification: every row must report rls_enabled = true.
with expected_tables (schema_name, table_name) as (
  values
    ('public', 'communities'),
    ('public', 'documents'),
    ('public', 'interviews'),
    ('public', 'model_jobs'),
    ('public', 'tour_objects'),
    ('public', 'users'),
    ('public', 'visual_media'),
    ('storage', 'objects')
)
select
  expected.schema_name,
  expected.table_name,
  coalesce(class.relrowsecurity, false) as rls_enabled
from expected_tables as expected
left join pg_catalog.pg_namespace as namespace
  on namespace.nspname = expected.schema_name
left join pg_catalog.pg_class as class
  on class.relnamespace = namespace.oid
 and class.relname = expected.table_name
order by expected.schema_name, expected.table_name;

-- Verification: no anonymous/public write policy should remain.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_catalog.pg_policies
where schemaname in ('public', 'storage')
  and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  and (roles && array['anon', 'public']::name[])
order by schemaname, tablename, policyname;
