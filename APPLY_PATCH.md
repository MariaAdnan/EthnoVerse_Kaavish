# Security rollout: roadmap sections 1-3

These steps are intentionally split at the irreversible operations.

## 1. Credentials

1. Keep only the current Supabase publishable and secret keys.
2. Set the five Modal `ethnoverse-secrets` values: `SUPABASE_URL`, `SUPABASE_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Set the four `website/.env` values shown in `website/.env.example`.
4. Restrict the Cloudinary `ethnoverse_unsigned` preset to the required formats and an `ethnoverse/uploads` asset folder.
5. Deploy `website/pipeline.py` and run a small end-to-end upload check before deleting any superseded key.

## 2. Rewrite Git history

Run this only in a fresh clone after the security changes are committed:

```bash
python -m pip install git-filter-repo
./clean_history.sh
git log --oneline --decorate -10
git push --force-with-lease origin main
```

Use `--force-with-lease`, not plain `--force`. After the push, every collaborator must delete old clones and clone again because the commit IDs changed.

## 3. Apply RLS

1. Open `supabase/rls_policies.sql` in the Supabase SQL Editor as `postgres`.
2. Run the complete script as one operation.
3. Confirm all eight verification rows report `rls_enabled = true`.
4. Confirm the anonymous/public write-policy verification returns zero rows.
5. Test logged-out reads and signed-in admin create, update, delete, upload, and 3D object placement.
