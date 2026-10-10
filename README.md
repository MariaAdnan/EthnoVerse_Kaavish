# EthnoVerse

EthnoVerse is a React/Vite archive for documenting Sindh's Indigenous communities through images, oral histories, documents, and interactive 3D tours.

The live archive currently holds one community (Kolhi) with oral histories,
photographs and a 3D tour. Document (PDF) records are supported by the upload,
search and viewer code, but none have been published yet.

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

For a new project, run `supabase/schema.sql` and then
`supabase/rls_policies.sql` in the Supabase SQL Editor.
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

EthnoVerse is live at **[ethnoverse.netlify.app](https://ethnoverse.netlify.app/)**,
deployed on Netlify from this repository (`npm run build` in `website/`). The
publication review is complete, and the site is shared publicly as a
non-commercial research project. Search engines are asked not to index it
(`noindex`), so it is reached by direct link.

Public visitors can browse the archive, listen to oral histories and explore
the 3D tour. Admin tools stay limited to provisioned accounts. The 3D
reconstruction worker is not exposed publicly; see [Licensing](#licensing) for
the non-commercial terms that apply to it.

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

## Keeping the database awake

Supabase free-tier projects pause after 7 days without database activity. Two
scheduled jobs read one row so that does not happen, without needing commits:

- **Netlify Scheduled Function** (`website/netlify/functions/keep-supabase-awake.mjs`),
  every 2 days, for as long as the site is deployed. Its runs and logs are under
  **Logs → Functions** in the Netlify dashboard.
- **GitHub Action** (`.github/workflows/supabase-keepalive.yml`), every 3 days, as
  a backup. It re-enables its own schedule on each run, so GitHub's 60-day
  inactivity rule does not switch it off. Run it by hand from the **Actions** tab.

If the project does pause, the website shows visitors an "archive isn't
responding" notice. A paused project can only be resumed by a project owner: in
Supabase Dashboard, open EthnoVerse, select **Resume project** and wait until the
status is **Healthy**.
