# Administrator operations

## Who can use the archive

Public visitors do not need accounts and receive read-only access. Content
management requires both:

1. a Supabase Auth user created or invited by a project owner; and
2. a `public.users` row whose `user_id` is that Auth user's UUID and whose
   `role` is `admin`.

There is deliberately no public signup or browser-based role promotion. Remove
the role row and revoke the Auth session when access is no longer required.

## New environment checklist

1. Create the Supabase project, provision the application schema, and apply
   migrations in timestamp order. The repository does not yet contain a full
   baseline schema migration, so export and version the live schema before
   attempting a clean-room rebuild.
2. Run `supabase/rls_policies.sql` and its verification queries.
3. Deploy `cloudinary-admin` after setting the secrets documented in its
   README. Use the same model-download signing secret in Modal.
4. Configure the `model_jobs` INSERT webhook exactly as documented in
   `supabase/WEBHOOK.md`.
5. Deploy `website/pipeline.py` and configure its listed secrets.
6. Configure only publishable values from `website/.env.example` in the
   frontend host.
7. Run the release verification in `docs/TESTING.md` before allowing uploads.

## Backup and recovery

Backups are a deployment responsibility; the application does not schedule
them. Enable the appropriate Supabase backup/PITR plan and maintain a separate
Cloudinary asset inventory. At least quarterly, restore into an isolated test
project, run the RLS verification queries, compare table/asset counts, and open
sample records. Record the date, operator, backup identifier, result, and any
corrective action. A backup that has never been restored is not verified.

## Incidents

For suspected credential exposure, revoke/rotate the affected key first, then
redeploy consumers and inspect Supabase, Cloudinary, and Modal logs. Do not put
secrets in issues or screenshots. For orphaned Cloudinary uploads, use the
asset public ID logged by the client and remove it through an authenticated
administrator operation.
