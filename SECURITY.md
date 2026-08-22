# Security policy

Please report suspected vulnerabilities privately to the repository owners and
do not include credentials, cultural records, or personal data in a public
issue. This research prototype is not a suitable destination for confidential
or unconsented material.

## Security properties

- Public clients receive read-only database access.
- Database and storage mutations require a Supabase user with the admin role.
- Cloudinary upload/delete signatures are issued only by an authenticated Edge
  Function and expire with their timestamp.
- Modal webhook requests require a shared secret, and duplicate jobs are
  atomically claimed.
- Generated model download links require administrator authorization and expire
  after five minutes.
- Labels and other database strings are rendered as text, not executable HTML.

## Secrets

Frontend variables may contain only publishable identifiers and keys. Store
Supabase server credentials, Cloudinary API secret, webhook secret, and model
download signing secret in their respective managed secret stores. Rotate a
suspected key before investigating its use.

See `docs/ADMIN_OPERATIONS.md` for deployment and incident procedures.
