-- Reversal of the consent-URI experiment. Run after confirming that no
-- legitimate consent URLs have been stored in the column.
alter table public.visual_media
  drop constraint if exists visual_media_consent_doc_uri_required;

alter table public.visual_media
  drop column if exists consent_doc_uri;
