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
3. Copy `website/.env.example` to `website/.env.local` and set the required values.
4. Run `npm run dev`; use `npm run check` before committing.

Required frontend variables are `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_CLOUDINARY_ADMIN_FUNCTION`, and
`VITE_BUILT_IN_TOUR_COMMUNITY_ID`.

Never put a Supabase `sb_secret_` key in the frontend. The Modal worker receives its server credentials through the `ethnoverse-secrets` Modal secret.

## Database and worker

Run `supabase/rls_policies.sql` in the Supabase SQL Editor for a new project.
Deploy the authenticated Cloudinary/signing function using
[`supabase/functions/cloudinary-admin/README.md`](supabase/functions/cloudinary-admin/README.md).
Database-webhook configuration is documented in `supabase/WEBHOOK.md`. Deploy
the 3D worker with `modal deploy website/pipeline.py` after configuring its
Modal secret.

The Modal secret must include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, random `WEBHOOK_SHARED_SECRET`, and
`MODEL_DOWNLOAD_SIGNING_SECRET` values. Configure the
same value as the `x-ethnoverse-webhook-secret` header on the Supabase database
webhook. Configure the model-download secret in the Edge Function as well. The
worker rejects missing, incorrect, or expired credentials.

## Access and operations

- [Architecture](docs/ARCHITECTURE.md)
- [Administrator setup, backups, and incidents](docs/ADMIN_OPERATIONS.md)
- [Release testing](docs/TESTING.md)
- [Cultural-record publication gate](docs/PUBLICATION_CHECKLIST.md)
- [Security policy](SECURITY.md)

Public visitors are read-only. Administrators must be separately provisioned
in Supabase Auth and have `public.users.role = 'admin'`; there is no public
signup or role-promotion interface.

## Deployment status

The frontend is deliberately not deployed publicly while the project reviews
the non-commercial restriction on its 3D reconstruction dependency. Local
development and private research use remain supported. Do not make the
frontend or worker public without reviewing the licensing and webhook controls
documented here and completing the item-level publication checklist. A private
recorded demo or local demonstration is the recommended portfolio format until
those reviews are complete.

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
