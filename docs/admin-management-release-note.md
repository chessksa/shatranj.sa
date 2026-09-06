# Admin Management Release Note

Release scope:
- owner/moderator roles with scoped permissions
- add/delete/edit players from the admin panel
- add/remove moderators (owner only)
- create and manage tournaments globally or by country/city
- JWT-protected Supabase Edge Function for Auth create/delete operations
- admin action auditing and explicit removal of anonymous access to admin RPCs

Verification:
- `node --check admin.js`: pass
- `python -m pytest -q tests/test_admin_management_ui.py`: pass
- `admin-management` Edge Function: ACTIVE with JWT verification enabled
