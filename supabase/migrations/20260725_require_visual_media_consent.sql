-- Run once in the Supabase SQL editor after supplying consent_doc_uri for any
-- existing visual_media rows.  New media cannot be inserted without it.
alter table public.visual_media
  add column if not exists consent_doc_uri text;

alter table public.visual_media
  drop constraint if exists visual_media_consent_doc_uri_required;

alter table public.visual_media
  add constraint visual_media_consent_doc_uri_required
  check (nullif(trim(consent_doc_uri), '') is not null) not valid;

-- Validate only after backfilling existing content:
-- alter table public.visual_media validate constraint visual_media_consent_doc_uri_required;
