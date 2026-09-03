# Implementation Roadmap

The build follows the phased plan from the brief. Every phase shares the same
vertical pattern, so the remaining modules are repetitive rather than novel:

```
database/schema/<domain>.ts        ← table(s)         (ALL DONE for every phase)
server/validators/<domain>.ts      ← Zod schemas
server/repositories/<domain>.repo  ← queries (optional; see news.repo.ts)
server/services/<domain>.service   ← business logic
server/api/public/<domain>/*       ← read endpoints (feature-flag gated)
server/api/admin/<domain>/*        ← CRUD endpoints (requirePermission)
app/pages/admin/<domain>*          ← list + editor (copy app/pages/admin/news/*)
app/pages/<domain>*                ← public pages (copy app/pages/berita/*)
```

Legend:  ✅ done   ◑ partial (API/schema done, admin UI stubbed)   ⬜ not started

---

## Phase 1 — Foundation ✅

- ✅ Nuxt 3 project, TypeScript strict, Tailwind, `app/` structure
- ✅ Full Drizzle schema — **all 33 tables** incl. KKT — + generated migration
- ✅ Seed script (admin, settings, menus, sample content, KKT team)
- ✅ JWT auth: login / logout / refresh (rotating) / me, HttpOnly cookies
- ✅ RBAC roles + permissions, `requirePermission` middleware helpers
- ✅ Login rate limiting (DB-backed, email + IP)
- ✅ Public layout (TopBar + sticky/transparent SiteHeader + rich Footer)
- ✅ Admin layout (collapsible sidebar, header, logout)
- ✅ Consistent API envelope + `AppError` + global error normaliser
- ✅ Storage abstraction: local / S3 / Supabase adapters
- ◑ **Users & roles admin UI** — API pattern ready, screen stubbed

## Phase 2 — Config, Theme, Navigation ✅

- ✅ Central `SiteConfig` resolver + 30s cache + invalidation on save
- ✅ Village settings admin (identity, wilayah, contact, emergency, socials)
- ✅ Dynamic Theme engine — CSS variables injected SSR, no rebuild/FOUC
- ✅ Theme admin: colors + presets, typography + Google Fonts, layout, mode,
      local identity/pattern, **live preview**
- ✅ Navigation manager: menus by location, tree with dropdowns, reorder,
      show/hide, create/edit/delete
- ✅ Feature-flag admin + enforcement (404 routes, hidden menus/sections)
- ✅ Footer builder (columns, links, KKT credit, developer link toggle)

## Phase 3 — News / Announcements / Events ◑

- ✅ **News**: full CRUD API + categories, repo pattern, admin list + editor,
      public list (search / category / pagination) + detail + related + SEO
- ◑ **Announcements**: `announcements` table + `publishStatus`, expiry — needs
      `announcement.service` + `/api/admin/announcements/*` + admin screen
      (copy the News module) + `/pengumuman` public pages
- ◑ **Events**: `events` table (start/end/location/poster) — needs service +
      endpoints + admin screen + `/agenda` public page with calendar/timeline UI
      (`app/components/sections/Events.vue` already renders the timeline style)

## Phase 4 — Page Builder / Homepage ◑

- ✅ Section model (`shared/types/sections.ts`), registry (`config/sections.ts`)
- ✅ `SectionShell` (background system: solid/gradient/image/pattern/dark +
      overlay + spacing + container) + `Renderer`
- ✅ Section components: hero, statistics, imageQuote, featuredNews,
      tourismShowcase, umkm, events, masonryGallery, cta, kktTeam, text
- ✅ Homepage renders from `pages/home` + `/api/public/homepage` aggregate,
      floating quick-facts panel, feature-flag aware
- ✅ Page CRUD API + generic `[...slug].vue` renderer for CMS pages
- ⬜ **Admin Page Builder UI** — drag-and-drop section list, per-type data
      forms, show/hide, reorder. Backend (`/api/admin/pages/*`,
      `page.service.ts` with `replaceSections`) is complete; only the editor
      screen at `/admin/pages` remains (currently a stub).
- ⬜ Remaining section components (heroSlider, videoHero, bentoGrid, splitScreen,
      timeline, faq, map, video, featureCards, officials, culturalShowcase,
      parallax, customHtml) — add component + registry map entry.

## Phase 5 — UMKM / Tourism / Gallery / Statistics ◑

All tables exist (`umkm`, `tourism`, `galleries` + `gallery_items`,
`statistic_groups` + `village_statistics`, `government_officials`).
Homepage already consumes them via `/api/public/homepage`.

- ◑ UMKM — service + admin CRUD + `/potensi-desa/umkm` list/detail
- ◑ Tourism — service + admin CRUD + `/potensi-desa/wisata` list/detail
- ◑ Gallery — service + admin CRUD (attach media) + `/galeri`
- ◑ Statistics — group + datapoint CRUD; public charts (bar/pie/line —
      `Statistics.vue` already draws dependency-free bar + pie; add a line
      renderer or a chart lib for richer output)
- ◑ Government/Perangkat Desa — CRUD + `/pemerintahan/*` org chart

## Phase 6 — Transparency / Documents / Digital Services ◑

- ◑ Documents — `documents` table (category, year, file). Needs upload wiring to
      Media Library + `/transparansi` grouped-by-year public page
- ◑ Digital Services — `services` (+ dynamic `formSchema`) and `service_requests`
      (ticket, status workflow) tables + seed exist; `/api/public/services`
      list endpoint + `/layanan` page are live. Remaining: request submission
      endpoint + status-tracking page + admin processing queue
      (`/admin/service-requests`).

## Phase 7 — SEO / Security / Performance / Deploy ◑

- ✅ Dynamic meta + Open Graph + Twitter card + JSON-LD (news article)
- ✅ Security headers, RBAC, Zod validation, rate limiting, HttpOnly cookies,
      secret isolation, upload allow-list
- ✅ `@nuxt/image` (lazy, webp), SSR, config caching, DB indexes on hot columns,
      pagination everywhere
- ⬜ `sitemap.xml` + `robots.txt` route handlers (add
      `server/routes/sitemap.xml.ts` enumerating published news/pages)
- ⬜ CSRF double-submit token for cookie-auth mutations (SameSite=Lax already
      mitigates; add for defense-in-depth)
- ⬜ Automated tests (Vitest for services, Playwright for the golden paths)
- ⬜ `Dockerfile` + `docker-compose.yml` (Postgres + app) — steps documented in
      README

---

## KKT module ✅ (brief section X)

- ✅ `kkt_settings`, `kkt_fields`, `kkt_members` tables + relations + seed
- ✅ Public: `/api/public/kkt`, `/kkt/team` (grouped: koordinator / sekretaris /
      bendahara / bidang→anggota / unassigned), `/kkt/fields`
- ✅ Public page `/about-developer` (+ `/tentang-pengembang` redirect) — hero
      with program info & logos, prominent coordinator, secretary, treasurer,
      dynamic field sections, member cards with photo placeholder + socials
- ✅ Admin: `/admin/kkt` (info), `/admin/kkt/fields` (CRUD + order + active),
      `/admin/kkt/team` (CRUD, filter by role/field, search)
- ✅ Gated by `enableKKTDeveloperPage` — off ⇒ footer link hidden, route 404,
      admin menu hidden. Platform stays reusable post-KKT.
