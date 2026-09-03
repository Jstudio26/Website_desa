# API Reference

Base URL: your site origin. All responses use the envelope:

```jsonc
// success
{ "ok": true, "data": <payload>, "meta"?: { ... } }
// error  (HTTP status matches: 400 / 401 / 403 / 404 / 409 / 429 / 500)
{ "ok": false, "error": { "code": "STRING_CODE", "message": "pesan (id-ID)", "fields"?: { "path": ["msg"] } } }
```

Auth is via **HttpOnly cookies** (`v_access`, `v_refresh`) set by `/api/auth/login`.
Admin routes require a valid session **and** the listed permission (RBAC).
Public routes gated by a feature flag return **404** when the module is disabled.

Pagination params: `?page=1&pageSize=12&q=`. Paginated payload:
`{ items, page, pageSize, total, totalPages }`.

---

## Auth — `/api/auth`

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/login` | `{ email, password, remember? }` | Rate-limited per email+IP. Sets cookies, returns `AuthUser`. |
| POST | `/refresh` | — | Rotates refresh token, re-issues cookies. |
| POST | `/logout` | — | Revokes refresh token, clears cookies. |
| GET | `/me` | — | `{ user: AuthUser | null }`. |

`AuthUser = { id, name, email, role, avatar, permissions[] }`
`role ∈ SUPER_ADMIN | ADMIN_DESA | EDITOR`

---

## Public — `/api/public`

| Method | Path | Description |
|---|---|---|
| GET | `/config` | Resolved `SiteConfig` (village + theme + features + footer + navigation). Cached. |
| GET | `/village` | Village profile config only. |
| GET | `/homepage` | Aggregate for the landing page (news, announcements, events, umkm, tourism, gallery, statistics, headman) — each block honours its feature flag. |
| GET | `/pages/:slug` | A published CMS page with ordered `sections`. 404 if draft/missing. |
| GET | `/news` | Paginated published news. Query: `page,pageSize,q,category,featured`. `enableNews`. |
| GET | `/news/:slug` | `{ article, related[] }`, increments view count. |
| GET | `/news/categories` | All categories. |
| GET | `/services` | Active digital services. `enableDigitalServices`. |
| GET | `/kkt` | KKT settings. `enableKKTDeveloperPage`. |
| GET | `/kkt/team` | `{ settings, coordinators[], secretaries[], treasurers[], fields[{…, members[]}], unassigned[] }`. |
| GET | `/kkt/fields` | Active KKT fields. |

---

## Admin — `/api/admin` (auth + permission required)

### Settings — permission `settings.manage` (theme: `theme.manage`)

| Method | Path | Description |
|---|---|---|
| GET / PUT | `/settings/village` | Village identity, wilayah, contact, socials. |
| GET / PUT | `/settings/theme` | Colors, typography, layout, mode, local identity. `theme.manage` |
| GET / PUT | `/settings/features` | Feature-flag map. |
| GET / PUT | `/settings/footer` | Footer columns, links, KKT credit. |

### Navigation — permission `menu.manage`

| Method | Path | Body |
|---|---|---|
| GET | `/menus` | — (menus with nested items) |
| POST | `/menus/items` | `{ menuId, parentId?, label, url, icon?, target?, visible?, order? }` |
| PUT | `/menus/items/:id` | partial of the above |
| DELETE | `/menus/items/:id` | — (children re-parent to top level) |
| PUT | `/menus/reorder` | `{ items: [{ id, parentId, order }] }` |

### Pages / Page Builder — permission `page.manage`

| Method | Path | Body |
|---|---|---|
| GET | `/pages` | — |
| POST | `/pages` | `{ title, slug?, status?, showInMenu?, seo…, sections[] }` |
| GET | `/pages/:id` | page + sections |
| PUT | `/pages/:id` | partial; `sections` (if present) fully replaces |
| DELETE | `/pages/:id` | — (system pages protected) |

`sections[]` item: `{ type, visible?, order?, data{}, settings{}? }`
`type` ∈ registry in `config/sections.ts`.

### News — permission `news.manage`

| Method | Path | Body |
|---|---|---|
| GET | `/news` | query `page,pageSize,q,status(all|draft|published|archived),category,featured` |
| POST | `/news` | `{ title, slug?, excerpt?, content?, featuredImage?, categoryId?, status?, isFeatured?, tags[], publishedAt? }` |
| GET / PUT / DELETE | `/news/:id` | — / partial / — |
| GET / POST | `/news/categories` | — / `{ name, slug?, description?, color? }` |
| PUT / DELETE | `/news/categories/:id` | partial / — |

### Media Library — permission `media.manage`

| Method | Path | Notes |
|---|---|---|
| GET | `/media` | query `page,pageSize,q,kind,folderId` |
| POST | `/media/upload` | `multipart/form-data` fields: `file` (required), `prefix?`, `alt?`. MIME allow-list + size cap. |
| DELETE | `/media/:id` | removes the row and the stored object. |

### KKT — permission `kkt.manage`

| Method | Path | Body |
|---|---|---|
| GET / PUT | `/kkt/settings` | program, university, year, period, posko, logos, footer credit |
| GET / POST | `/kkt/fields` | `{ name, slug?, description?, image?, displayOrder?, isActive? }` |
| GET / PUT / DELETE | `/kkt/fields/:id` | — / partial / — (members detached on delete) |
| GET | `/kkt/members` | query `q, role, fieldId` |
| POST | `/kkt/members` | `{ name, photo?, studentId?, studyProgram?, faculty?, university?, role, position?, fieldId?, displayOrder?, isActive?, instagram?, linkedin?, email? }` |
| GET / PUT / DELETE | `/kkt/members/:id` | — / partial / — |

`role` ∈ `KOORDINATOR | SEKRETARIS | BENDAHARA | ANGGOTA`

### Dashboard / Activity

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/dashboard` | any authenticated | counts + 30-day visitors + recent activity |
| GET | `/activity` | `activity.view` | `?limit=30` audit log entries |

---

## Permission matrix

| Permission | SUPER_ADMIN | ADMIN_DESA | EDITOR |
|---|:-:|:-:|:-:|
| `news.manage` `announcement.manage` `event.manage` `gallery.manage` `media.manage` `page.manage` | ✅ | ✅ | ✅ |
| `settings.manage` `theme.manage` `menu.manage` `government.manage` `statistics.manage` `umkm.manage` `tourism.manage` `document.manage` `service.manage` `service.process` `kkt.manage` `activity.view` | ✅ | ✅ | — |
| `user.manage` | ✅ | — | — |

See `shared/types/rbac.ts` for the source of truth.
