# Release verification

## Automated checks

```bash
cd website
npm ci
npm run check
npm audit --audit-level=high
cd ..
python -m unittest discover -s website -p 'test_*.py'
python -m py_compile website/pipeline.py website/pipeline_security.py
```

## Browser matrix

At minimum, test current Chrome/Safari-compatible desktop and a 390px-wide
mobile viewport. Verify home, explore, search, about, contact, login, media
filters, 404, and the built-in tour. Check keyboard focus, mobile menu,
horizontal overflow, control collisions, console errors, and an axe audit.

With a real administrator account, separately verify login/logout, create
community, upload each supported type, upload failure cleanup, delete
confirmation, job status transitions, secure model download, saved tour label
round-trip, and denial for a non-admin account.

## Evidence retention

Record the date, browser/device, deployment URL, commit SHA, database project,
test account role, pass/fail result, and screenshots for failures. A local test
that cannot reach Supabase is not evidence that production database behavior
passed or failed.
