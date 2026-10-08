# DivineConnect — RBAC + Temple Module Integration

This is the main project (backend + frontend) with:
1. A full RBAC (role-based access control) architecture added, replacing the old flat `role: 'admin'` check
2. Your teammate's temple module (draft/publish/trash workflow + sidebar/AP-TMS content fields + new public UI) integrated on top of it

Everything here builds and lints clean (`npm run build`, `eslint`), **and has now been runtime-tested end-to-end against a real Postgres 16 database** — not just statically checked. See §5 for exactly what was verified.

---

## 0. Don't forget the pre-existing setup step

This is unrelated to the RBAC/temple work, but I hit it during testing and it's easy to miss: the Home module needs its tables created once too, same as always —
```bash
npm run seed:home
```
Without it, `GET /api/admin/home` 500s with "relation home_content does not exist." Nothing to do with this integration; main's project already needed this step.

---

## 1. Database migration order

Run these **in order**, once, against your database:

```bash
cd backend
npm install

# 1. RBAC foundation — roles, permissions, role_permissions, audit_logs tables;
#    adds role_id/is_active/last_login_at to users
npm run db:migrate:rbac

# 2. Temple content + publishing workflow fields (all additive/safe)
npm run db:migrate:temple-sidebar
npm run db:migrate:temple-tms
npm run db:migrate:temple-publishing   # adds status/slug/seo/created_by; existing temples become 'published' automatically

# 3. Create your first SUPER_ADMIN — pick ONE of these:
node src/scripts/setAdminPassword.js you@example.com "YourNewPassword123!" SUPER_ADMIN   # new or reset
node src/scripts/promoteUser.js you@example.com SUPER_ADMIN                              # existing account
```

Start the backend as usual: `npm run dev`.

**Verified against a real Postgres 16 instance** — ran this exact sequence end-to-end: `seedTemples.js` (140 temples) → `seedAuth.js` → `db:migrate:rbac` (7 roles seeded, permission counts from 0 to 72) → `db:migrate:temple-sidebar` → `db:migrate:temple-tms` → `db:migrate:temple-publishing` (all 140 existing temples auto-backfilled to `status='published'`, so nothing on the public site breaks for temples that existed before this migration).

---

## 2. What changed, and why

### Auth: flat role → RBAC
- `middleware/auth.js` — dropped `requireAdmin`. Only `requireAuth`/`optionalAuth` remain.
- `middleware/rbac.js` (new) — `attachRoleAndPermissions`, `requireRole(...)`, `requirePermission(...)`.
- `config/jwt.js` (new) — one shared source of truth for the JWT secret.
- `services/auditLogger.js` (new) — every admin write now logs to `audit_logs`.
- `controllers/authController.js` — login joins the `roles` table, checks `is_active`, updates `last_login_at`. **The JWT itself no longer carries a role** — `GET /api/auth/me` looks it up fresh on every request, so a role change or deactivation takes effect immediately without the user needing to log in again.
- `routes/admin/index.js` — `requireAuth` + `attachRoleAndPermissions` now run once for all of `/api/admin/*`. Each module route then adds its own `requirePermission('module.action')`.
- `routes/admin/home.js` and `routes/admin/prayers.js` — converted from `requireAdmin` to permission checks (`home.read`, `home.update`, etc.) — same protection, now role-aware instead of all-or-nothing.
- Old `scripts/seedAdmin.js` — **deprecated, not deleted**. It wrote to the old `users.role` column, which nothing reads anymore. Use `promoteUser.js` / `setAdminPassword.js` instead.

### Temples: is_active flag → draft/publish workflow + trash
- `controllers/templeController.js` (public) — rewritten. Public queries now require `is_active = TRUE AND status = 'published'` everywhere (list, detail, categories, states, deities, featured, similar).
- `controllers/admin/templesAdminController.js` — replaced with the full workflow: create (as draft) → publish/unpublish → soft-delete (trash) → restore (back to draft) → **permanent delete (SUPER_ADMIN only)**.
- `routes/admin/temples.js` — new endpoints for all of the above, each gated by a specific permission (`temples.create/read/update/delete/publish`). Permanent delete requires the `SUPER_ADMIN` role specifically, not just a permission — it's irreversible.
- Sidebar fields (Sevas, Darshan types, Accommodation, Donation, Gallery, Trust, Online services) and AP-TMS fields (Activities, Annadanam, Hundi, Guidelines, Rituals, etc.) are in the database and whitelisted for the admin API to write, **but the admin edit form UI does not have inputs for them yet** — that was also true in your teammate's original version (see the note left in `AdminTempleFormPage.jsx`). For now those fields are only fillable via the backend scripts (`updateTempleSidebarDetails.js`, `seedTempleTmsDummyData.js`) or directly via the API. Building that part of the form is a good next task.

### 🐛 Bug caught while integrating
Your teammate's `templeController.js` had **two different admin controllers**: a full "Phase 2 admin CRUD" section inside that file that was never actually wired to any route (dead code), and a separate `adminTempleController.js` that was the one actually mounted. I used the real one and removed the dead copy — worth mentioning to your teammate, since dead code like this is an easy source of "I edited the file but nothing changed" confusion later.

### Frontend
- `context/AdminAuthContext.jsx` (new) — a **separate session from the public site** (`dc_admin_token`/`dc_admin_user` vs the public site's `dc_token`). Re-verifies against `/auth/me` on every page load.
- `components/admin/RequireAdminAuth.jsx` (new) — replaces `AdminProtectedRoute.jsx` (deleted; it checked the old flat role via the public `AuthContext`).
- `services/adminApi.js` — rewritten. Kept the exact same function signatures for `adminHomeApi` and `adminPrayersApi` your existing `AdminHomePage.jsx`/`AdminPrayersPage.jsx` already call, so those two pages needed **zero changes**. Added `adminAuthApi`, `adminDashboardApi`, and a fully rebuilt `adminTemplesApi` (publish/unpublish/trash/restore/permanentDelete).
- `components/admin/AdminLayout.jsx` — nav items are now filtered by `hasPermission(...)`. With SUPER_ADMIN/ADMIN this looks identical to before; it only starts hiding things once you assign someone a narrower role (EDITOR, SUPPORT, etc.).
- Admin Temples UI — the old single-page-with-modal (`AdminTemplesPage.jsx` + `TempleFormModal.jsx`, deleted) is replaced with three routed pages: `AdminTemplesListPage`, `AdminTemplesTrashPage` (Recycle Bin), `AdminTempleFormPage`.
- Public Temples UI — `TemplesPage.jsx` replaced wholesale (deity filter, state filter, sort dropdown, "Your Favorite Temples" strip). Temple detail is now a real route, `TempleDetailPage.jsx` at `/temples/:id`, with a "Similar Temples" section — replacing the old `TempleDetailModal.jsx` (deleted).
- `App.jsx` — wired up all of the above; kept every other route (calendar, astrology, scriptures, bhajans, etc.) exactly as they were.

---

## 5. What I actually verified end-to-end (real Postgres, real HTTP requests)

Ran the full migration chain against a fresh Postgres 16 database, booted the server, and hit it with real `curl` requests:

| Test | Result |
|---|---|
| `seedTemples.js` → 140 temples, `seedAuth.js`, `db:migrate:rbac` → 7 roles seeded (SUPER_ADMIN 72 perms → USER 0 perms) | ✅ |
| `db:migrate:temple-sidebar`, `db:migrate:temple-tms`, `db:migrate:temple-publishing` | ✅ all 140 existing temples auto-backfilled to `status='published'` — nothing broke for pre-existing data |
| `setAdminPassword.js` → created SUPER_ADMIN, logged in via `POST /auth/login` | ✅ returns `role: "SUPER_ADMIN"`, no role in the JWT itself |
| `GET /auth/me` | ✅ returns live role + full 72-permission list |
| Create temple → `POST /admin/temples` | ✅ saved as `status: "draft"` automatically |
| Draft temple on public API → `GET /temples/:id` | ✅ 404s (correctly hidden) |
| Publish → `PATCH /admin/temples/:id/publish` → public `GET /temples/:id` | ✅ now visible |
| Soft-delete → `DELETE /admin/temples/:id` → shows in `GET /admin/temples/trash`, gone from public | ✅ |
| Restore → `PATCH /admin/temples/:id/restore` | ✅ back in admin list as `draft`, not auto-published |
| Permanent delete on a temple *not* in trash | ✅ correctly refused ("only trashed temples can be permanently deleted") |
| Permanent delete on a temple actually in trash | ✅ row gone from DB |
| `audit_logs` after all the above | ✅ every action recorded: `temple.created`, `.published`, `.deleted`, `.restored`, `.deleted`, `.permanently_deleted`, plus `user.logged_in` |
| Registered a second user, promoted to `EDITOR` via `promoteUser.js` | ✅ `/auth/me` shows the narrower 34-permission set (no `temples.delete`, no `temples.publish`) |
| EDITOR tries `DELETE /admin/temples/:id` | ✅ 403 `"Missing required permission: temples.delete"` |
| EDITOR tries `DELETE /admin/temples/:id/permanent` (SUPER_ADMIN-only route) | ✅ 403 |
| EDITOR tries `PUT /admin/temples/:id` (has `temples.update`) | ✅ 200, succeeded |
| Deactivated EDITOR's account (`is_active = false`), retried login | ✅ 403 `"This account has been deactivated"` |
| No token at all → `GET /admin/temples` | ✅ 401 `"Login required."` |
| Regression: `GET /admin/prayers`, `GET /admin/dashboard/stats` | ✅ unaffected by the RBAC rewiring |
| Regression: `GET /admin/home` | ✅ works once `npm run seed:home` has been run (see §0) |

I did **not** get to click through the actual React admin UI in a browser in this sandbox (no display available) — the checklist below is for you to walk through that part visually once you run `npm run dev` on the frontend.

## 6. Manual UI checklist (not yet done — needs a browser)

---

## 6. Manual UI checklist (not yet done — needs a browser)

- [ ] `/admin/login` with the SUPER_ADMIN → lands on `/admin/home`, sidebar shows all modules
- [ ] `/admin/temples` → create, publish/unpublish toggle, edit, delete → confirm each against the Recycle Bin at `/admin/temples/trash`
- [ ] Log in as the EDITOR test account → confirm the Recycle Bin nav item and delete/publish buttons are hidden (no `temples.delete`/`temples.publish` permission)
- [ ] Public `/temples` → deity filter chips, state dropdown, sort dropdown all narrow the grid correctly
- [ ] Click a temple card → lands on `/temples/:id`, shows the "Similar Temples" strip at the bottom
- [ ] Wishlist a temple while logged in → appears in the "Your Favorite Temples" strip on `/temples`

## 7. Security note

The backend `.env` in the original upload had a real Gmail SMTP password in it. Rotate that credential and make sure `.env` is git-ignored before this goes anywhere shared.
