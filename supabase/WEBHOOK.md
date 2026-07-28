# Model processing database webhook

The 3D-processing worker is started by a Supabase Database Webhook. This
configuration lives in Supabase, so record it here whenever it changes.

- Table: `public.model_jobs`
- Event: `INSERT` only
- Method: `POST`
- Target: the deployed Modal `webhook` endpoint from `website/pipeline.py`
- Header: `x-ethnoverse-webhook-secret: <shared random value>`
- Payload: default Supabase record payload; the worker consumes `record.id`,
  `record.community_id`, `record.images_zip_url`, `record.object_name`, and
  `record.status`.

Create the random value once and store it in two places:

1. Add it to the Modal secret `ethnoverse-secrets` as
   `WEBHOOK_SHARED_SECRET`.
2. Add the same value as the custom
   `x-ethnoverse-webhook-secret` header in the Supabase webhook settings.

The endpoint returns HTTP 401 when the header is missing or wrong and HTTP 503
when the Modal secret has not been configured. Never put this value in a
frontend environment variable, source file, issue, or screenshot.

After changing the Modal app name or workspace, update the target URL in
Supabase and deploy the frontend with `VITE_MODAL_DOWNLOAD_URL` set to the
matching `download_ply` endpoint. Test with a 10+ image ZIP and confirm the
job moves from `queued` to `processing`.
