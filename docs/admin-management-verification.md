# Admin Management Verification

Verified on 2026-09-06:

- Supabase `admin-management` Edge Function is ACTIVE and JWT verification is enabled.
- New admin RPCs are not executable by the `anon` role.
- Existing legacy admin RPCs were also revoked from `anon` execution.
- Active owner count is exactly 1.
- Player country data is populated for existing records.
- Tournament registration table exists with RLS enabled.
- `node --check admin.js` passes in GitHub Actions.
- `python -m pytest -q tests/test_admin_management_ui.py` passes in GitHub Actions.

Repository-wide historical tests still include unrelated stale failures for old home/play assets and cache-version expectations. Those failures predate this feature and are not caused by the admin-management changes.
