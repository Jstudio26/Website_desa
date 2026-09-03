# Village Website Platform — Sistem Informasi Desa

A modern, modular, **fully customizable** village information system built as a
**Nuxt 3 fullstack app** (frontend + Nitro server API — no separate backend).
One codebase serves many villages: branding, theme, navigation, pages, and
content are all configured from the Admin Dashboard, never hardcoded.

> Built as a work program (Proker) for **Kuliah Kerja Terpadu (KKT)**. The
> optional **KKT module** records the student development team on a public
> *Tim Pengembang* page, and can be switched off (feature flag) so the platform
> stays reusable after the program ends.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Nuxt 3** (Vue 3, TypeScript strict, compatibility v4 → `app/` dir) |
| Server | **Nitro** server routes (`server/api/**`) — services + repositories + validators |
| Styling | **Tailwind CSS** driven by runtime **CSS variables** (Dynamic Theme Engine) |
| Database | **PostgreSQL** via **Drizzle ORM** — swap provider with one env var |
| Auth | **JWT** (access + rotating refresh) in **HttpOnly cookies**, **RBAC** |
| Validation | **Zod** on every endpoint, consistent `{ ok, data | error }` envelope |
| Storage | Pluggable adapter: **local** \| **S3-compatible** \| **Supabase Storage** |
| Utilities | VueUse, `@nuxt/image` |
| Deploy | Vercel · VPS (`node-server`) · Docker |

---

## Quick start

```bash
# 1. Install (this project pins legacy-peer-deps via .npmrc)
npm install

# 2. Configure environment
cp .env.example .env
#   → set DATABASE_URL and JWT_SECRET at minimum

# 3. Create the schema + seed demo data (admin user, menus, sample content, KKT)
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev            # http://localhost:3000  (public)  ·  /admin/login (CMS)
```

Default seed admin (override via `SEED_ADMIN_*` in `.env`):

```
email:    admin@desa.local
password: admin12345          (role: SUPER_ADMIN)
```

### Database scripts

| Script | Purpose |
|---|---|
| `npm run db:generate` | Generate a new SQL migration from schema changes |
| `npm run db:migrate` | Apply pending migrations (`database/migrations/`) |
| `npm run db:push` | Push schema directly (dev only, no migration file) |
| `npm run db:seed` | Idempotent seed (skips rows that already exist) |
| `npm run db:studio` | Open Drizzle Studio |

### Swapping the database

`DATABASE_URL` is the only thing to change — local Postgres, Docker, Neon,
Supabase, RDS all work unmodified. For connection poolers (PgBouncer / Supabase
"transaction" mode) prepared statements are already disabled in
`server/utils/db.ts`.

### Swapping storage

```bash
STORAGE_DRIVER=local      # ./public/uploads (default)
STORAGE_DRIVER=s3         # + S3_* vars   → npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
STORAGE_DRIVER=supabase   # + SUPABASE_* vars → npm i @supabase/supabase-js
```

The S3 / Supabase SDKs are **optional dependencies** loaded via dynamic
`import()` — only install them if you use that driver.

---

## Project structure

```
app/                         # Nuxt srcDir (compatibility v4)
├── assets/css/main.css       # Tailwind + default theme tokens
├── components/
│   ├── ui/                   # design system: Button, Card, Modal, Toaster, …
│   ├── layout/               # TopBar, SiteHeader, SiteFooter
│   ├── admin/                # Sidebar, PageHeader, ModulePlaceholder
│   ├── sections/             # Page Builder section components + Renderer
│   ├── AppIcon.vue           # inline icon set (no icon lib, no emoji)
│   └── PageHero.vue
├── composables/              # useSiteConfig, useApi, useToast, useReveal
├── layouts/                  # default.vue (public) · admin.vue
├── middleware/               # admin.global.ts (route guard)
├── pages/                    # public + /admin/** routes
├── plugins/00.site-config.ts # loads config + injects Dynamic Theme (SSR, no FOUC)
└── stores/                   # Pinia: config, auth

server/
├── api/
│   ├── auth/                 # login, logout, refresh, me
│   ├── public/               # unauthenticated read APIs (+ feature-flag gated)
│   └── admin/                # authenticated + RBAC-protected write APIs
├── services/                 # business logic (auth, settings, news, kkt, …)
├── repositories/             # data-access (news.repo.ts — pattern reference)
├── validators/               # Zod schemas per domain
├── middleware/00.context.ts  # session resolve + security headers
└── utils/                    # db, session, jwt, password, response, storage, …

database/
├── schema/                   # Drizzle schema, one file per domain
├── migrations/               # generated SQL
├── migrate.ts · seed.ts

shared/                       # types + utils shared by app AND server
config/                       # platform defaults, theme presets, section registry
```

---

## How "fully customizable" works

| Concern | Where it's edited | Storage |
|---|---|---|
| Village name, wilayah, kontak, socials, logo, favicon | **Admin → Profil Desa** | `village_settings` (jsonb) |
| Colors, fonts, radius, container, button/card style, light/dark, local pattern | **Admin → Tema** (live preview) | `theme_settings` (jsonb) |
| Navigation (labels, URLs, order, dropdowns, show/hide) | **Admin → Navigasi** | `menus` + `menu_items` (tree) |
| Homepage & any page composition | **Admin → Halaman** (Page Builder) | `pages` + `page_sections` (ordered) |
| Footer columns, links, KKT credit, developer link | **Admin → Pengaturan → Footer** | `footer_settings` (jsonb) |
| Which modules exist at all | **Admin → Pengaturan → Modul** | `feature_flags` (jsonb) |

At runtime `GET /api/public/config` returns one resolved `SiteConfig`
(village + theme + features + footer + navigation). The `00.site-config` plugin
fetches it during SSR and writes the theme as CSS variables into `<head>` — so
restyling takes effect immediately, **no rebuild**.

### Dynamic Theme tokens (CSS variables)

```
--color-primary --color-secondary --color-accent
--color-surface --color-surface-muted --color-ink --color-ink-muted --color-line
--font-heading --font-body --font-scale
--radius --container-width --btn-style --card-style
```

Tailwind classes (`bg-primary`, `text-ink`, `rounded-theme`, `max-w-container`,
`font-heading`) all resolve to these variables — see `tailwind.config.ts`.

### Page Builder

A page is an ordered array of **sections**. Each section has a `type` (from
`config/sections.ts`), free-form `data`, and layout `settings` (background type
solid/gradient/image/pattern/dark, overlay, spacing, container width, alignment).

Section components live in `app/components/sections/` and are wired in
`Renderer.vue`. Adding a new section = add a registry entry + a component +
one line in the renderer map. Sections shipped in this build:
`hero, statistics, imageQuote, featuredNews, tourismShowcase, umkm, events,
masonryGallery, cta, kktTeam, text` (others fall back gracefully).

### Feature flags

`enableNews, enableAnnouncements, enableEvents, enableUMKM, enableTourism,
enableGallery, enableTransparency, enableDigitalServices, enableStatistics,
enableGovernment, enableKKTDeveloperPage`

When a flag is off: its admin menu hides, its public routes return **404**
(`assertFeature()` server-side + guards client-side), and its homepage blocks
disappear.

---

## Authentication & security

- Passwords hashed with bcrypt (cost 11).
- **Access token** (JWT, 15 min) + **refresh token** (opaque, hashed in
  `refresh_tokens`, rotated on every refresh) — both `HttpOnly`, `SameSite=Lax`,
  `Secure` in production.
- **RBAC**: `SUPER_ADMIN` / `ADMIN_DESA` / `EDITOR` → fine-grained permissions
  (`shared/types/rbac.ts`). Endpoints call `requirePermission(event, '…')`.
- **Login rate limiting**: DB-backed, per email **and** per IP, rolling window
  (`LOGIN_RATE_LIMIT_*`).
- Baseline security headers on every response; input validated with Zod;
  parameterised queries via Drizzle; secrets only in `runtimeConfig` (server).
- Uploads: MIME allow-list + size cap, randomised keys.
- Every admin write is written to `activity_logs`.

---

## API shape

All endpoints return:

```jsonc
{ "ok": true,  "data": <T>, "meta"?: {...} }
{ "ok": false, "error": { "code": "VALIDATION", "message": "...", "fields"?: {...} } }
```

See **[docs/API.md](docs/API.md)** for the full route list. Public read routes
are under `/api/public/**`, authenticated writes under `/api/admin/**`,
session under `/api/auth/**`.

---

## Deployment

### Vercel
Zero config — Nitro auto-detects the `vercel` preset. Set env vars in the
dashboard. Run `npm run db:migrate` against the production DB from CI or locally.

### VPS / Docker
```bash
NITRO_PRESET=node-server npm run build
node .output/server/index.mjs        # serve on PORT (default 3000)
```
A `Dockerfile` pattern: multi-stage `node:20-alpine`, `npm ci`, `npm run build`,
copy `.output`, `CMD ["node", ".output/server/index.mjs"]`. Provide `DATABASE_URL`
and `JWT_SECRET` at runtime; run migrations as a release step.

---

## Implementation status

This repository delivers the **architecture + Phases 1–4 + the KKT module**
end-to-end, with the remaining CMS modules scaffolded (schema + API patterns in
place, admin UI marked *coming soon*). See **[ROADMAP.md](ROADMAP.md)** for the
phase-by-phase breakdown and exactly what remains.

**Working now:** project + DB + migrations + seed · JWT/RBAC auth · public &
admin layouts · Village settings · Dynamic Theme engine · Navigation manager ·
Feature flags · Footer builder · News CMS (list/editor + public list/detail/
search/pagination/related) · Page Builder rendering + homepage · Media
upload API + storage adapters · KKT module (settings, fields, members, public
*Tim Pengembang* page) · SEO meta/OG/JSON-LD on articles · consistent
error/loading/empty states · toast + confirm dialogs.

---

## License

Provided for the KKT program and the partner village. Reuse for other villages
is expected and encouraged.
