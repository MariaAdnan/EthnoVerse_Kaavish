# Architecture

```text
Public browser ──read-only──> Supabase PostgREST ──> PostgreSQL + RLS
      │
      ├──media reads────────> Cloudinary CDN
      └──tour view─────────> Three.js/Spark viewer

Admin browser ──session────> Supabase Auth
      ├──writes────────────> PostgREST ──is_admin()──> PostgreSQL
      ├──upload request────> cloudinary-admin Edge Function
      │                         └──short-lived signature──> Cloudinary
      ├──tour object───────> cloudinary-admin ──signature──> Cloudinary
      └──model job─────────> model_jobs INSERT
                                └──secret webhook──> Modal GPU worker
                                      ├──COLMAP + pinned 3DGS
                                      ├──status/model path──> Supabase
                                      └──signed download────> Admin browser
```

The browser guard is a user-interface control. PostgreSQL row-level security
and the administrator check inside the Edge Function are the authorization
boundaries. The Modal webhook is authenticated independently with a shared
secret. Public clients never receive a Supabase secret/service key, Cloudinary
API secret, or model-download signing secret.

See `supabase/rls_policies.sql`, `supabase/WEBHOOK.md`,
`supabase/functions/cloudinary-admin/README.md`, and `website/pipeline.py` for
the executable definitions.
