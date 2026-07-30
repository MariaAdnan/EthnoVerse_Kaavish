# EthnoVerse

EthnoVerse is a React/Vite archive for documenting Sindh's Indigenous communities through images, oral histories, documents, and interactive 3D tours.

## Stack

- React + Vite frontend (`website/`)
- Supabase for authentication, Postgres, storage, and RLS
- Cloudinary for media uploads
- Modal Python worker for COLMAP and 3D Gaussian Splatting

## Local setup

1. Install Node.js 22 and Python 3.11+.
2. In `website/`, run `npm ci`.
3. Copy `.env.example` to `.env` and set the required values.
4. Run `npm run dev`; use `npm run lint` and `npm run build` before committing.

Required frontend variables are `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, and `VITE_MODAL_DOWNLOAD_URL`.

Never put a Supabase `sb_secret_` key in the frontend. The Modal worker receives its server credentials through the `ethnoverse-secrets` Modal secret.

## Database and worker

Run `supabase/rls_policies.sql` in the Supabase SQL Editor for a new project. Database-webhook configuration is documented in `supabase/WEBHOOK.md`. Deploy the 3D worker with `modal deploy website/pipeline.py` after configuring its Modal secret.

The Modal secret must include a random `WEBHOOK_SHARED_SECRET`. Configure the
same value as the `x-ethnoverse-webhook-secret` header on the Supabase database
webhook. The worker rejects missing or incorrect values.

## Deployment status

The frontend is deliberately not deployed publicly while the project reviews
the non-commercial restriction on its 3D reconstruction dependency. Local
development and private research use remain supported. Do not make the
frontend or worker public without reviewing the licensing and webhook controls
documented here.

## Licensing

Original EthnoVerse code is available under the repository [LICENSE](LICENSE).
That license does not cover third-party media, research assets, dependencies,
or the 3D Gaussian Splatting implementation.

The Modal reconstruction step clones and runs
[Inria/GraphDeco Gaussian Splatting](https://github.com/graphdeco-inria/gaussian-splatting).
Its upstream license is non-commercial and remains controlling regardless of
the license applied to original EthnoVerse code. Review the upstream license
before using, distributing, or deploying the reconstruction pipeline.

Third-party acknowledgements are recorded in
[`website/ATTRIBUTIONS.md`](website/ATTRIBUTIONS.md).

## Waking the project up

Supabase free-tier projects can pause after inactivity. In Supabase Dashboard, open EthnoVerse and select **Resume project**, wait until the status is **Healthy**, then restart or redeploy the website with its current publishable key.
