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

Add a separate random `MODEL_DOWNLOAD_SIGNING_SECRET` to the Modal secret and
to the `cloudinary-admin` Edge Function. Set that function's
`MODAL_DOWNLOAD_URL` to the deployed `download_ply` endpoint. The browser asks
the Edge Function for a five-minute administrator-only download URL; the Modal
endpoint rejects missing, incorrect, or expired signatures.

After changing the Modal app name or workspace, update the webhook target and
the Edge Function's `MODAL_DOWNLOAD_URL`. Test with a 10+ image ZIP and confirm
the job moves from `queued` to `processing`. Deliver the same webhook twice and
confirm that only one GPU worker is started.
