# Secure Cloudinary administration

This Edge Function signs media, 3D capture ZIP, and tour-object uploads and
deletes failed/orphaned uploads. It only
responds to a valid Supabase user whose `public.users.role` is `admin`.

Configure and deploy it from the repository root:

```bash
supabase secrets set \
  CLOUDINARY_CLOUD_NAME=... \
  CLOUDINARY_API_KEY=... \
  CLOUDINARY_API_SECRET=... \
  MODAL_DOWNLOAD_URL=... \
  MODEL_DOWNLOAD_SIGNING_SECRET=...
supabase functions deploy cloudinary-admin
```

Do not put `CLOUDINARY_API_SECRET` in a frontend environment file. The browser
receives only a short-lived signature for a fixed `ethnoverse/` folder. New
PLY files inserted in the tour editor use the same authenticated signer rather
than Supabase Storage.
Use the same random `MODEL_DOWNLOAD_SIGNING_SECRET` in the Modal
`ethnoverse-secrets` secret. Model download links expire after five minutes.
