# EstateFlow

A leasing and contact-management dashboard for property teams. Tracks prospects from first
inquiry through signed application, keeps unit availability current on a drag-and-drop board,
and answers questions about the portfolio through an AI sidebar grounded in live data.

Built with Next.js 16 (App Router), React 19, Supabase, and TypeScript.

<!--
  TODO: add 2–3 screenshots or a short GIF here (dashboard, units kanban, AI sidebar).
  This is the first thing a reader looks at — worth the ten minutes.
-->

---

## Features

**Leasing pipeline.** Opportunities move through six stages — inquired, qualified, showing,
toured, feedback, applied. The `stage` column is _generated_ in Postgres from the underlying
date fields, so the board can never drift out of sync with the record.

**Unit board.** Units are tracked as occupied, notice, vacant, or terminated, with drag-and-drop
between columns backed by optimistic updates.

**Contact management.** Prospects and tenants, each linked to units through leasing
opportunities, with full communication history (email, SMS, phone; inbound and outbound).

**AI assistant.** A right-hand sidebar that answers questions about the selected contact and the
wider portfolio. The prompt is built from live contact and unit data, so answers cite real
figures rather than inventing them.

**ID verification workflow.** Prospects upload a license from their phone via a tokenised public
link. Staff review front, back, and selfie images side by side against a checklist, and the
queue advances automatically as each contact is verified.

**Geofenced tour check-in.** A public per-opportunity page that confirms a prospect is physically
at the unit using the device's geolocation and a barcode scan, with a manual fallback.

**Webhook ingestion.** Inbound leads arrive from n8n at `/api/webhooks/n8n`, verified by HMAC
signature before anything touches the database.

---

## Tech stack

| Layer      | Choice                                           |
| ---------- | ------------------------------------------------ |
| Framework  | Next.js 16 (App Router, React Server Components) |
| Language   | TypeScript (strict)                              |
| UI         | Tailwind CSS v4, shadcn/ui, Lucide icons         |
| State      | Zustand                                          |
| Validation | Zod                                              |
| Database   | Supabase (Postgres) with row-level security      |
| Auth       | Supabase Auth via `@supabase/ssr`                |
| AI         | OpenRouter (OpenAI-compatible chat completions)  |
| Testing    | Vitest                                           |
| Tooling    | ESLint, Prettier, Husky + lint-staged            |

---

## Getting started

**Prerequisites:** Node.js 20+, [pnpm](https://pnpm.io) 9+, and the
[Supabase CLI](https://supabase.com/docs/guides/local-development) for the local stack.

```bash
pnpm install
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Start the local Supabase stack, apply migrations, and seed demo data:

```bash
supabase start && supabase db reset
```

The seed creates a demo login — `jordan.rivera@realty.com` / `DemoPassword123!` — along with
sample contacts, units, and leasing opportunities.

Run the dev server:

```bash
pnpm dev
```

The app is served at [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command           | What it does                |
| ----------------- | --------------------------- |
| `pnpm dev`        | Start the dev server        |
| `pnpm build`      | Production build            |
| `pnpm start`      | Serve the production build  |
| `pnpm test`       | Run the Vitest suite once   |
| `pnpm test:watch` | Run tests in watch mode     |
| `pnpm typecheck`  | Type-check without emitting |
| `pnpm lint`       | ESLint                      |
| `pnpm lint:fix`   | ESLint with autofix         |
| `pnpm format`     | Prettier write              |

Husky runs ESLint and Prettier against staged files on every commit.

---

## Project structure

```
src/
├── app/
│   ├── (auth)/              # login, signup
│   ├── (dashboard)/         # contacts, units, leasing opportunities,
│   │                        # communications, license review, settings
│   ├── api/                 # route handlers (REST + AI + webhooks)
│   ├── tour-checkin/        # public geofenced check-in page
│   └── upload/              # public tokenised ID upload page
├── components/              # feature components + shadcn/ui primitives
├── lib/                     # pure domain logic, Supabase clients, helpers
├── stores/                  # Zustand stores
└── types/                   # shared domain types and constants

supabase/
├── migrations/              # ordered SQL migrations (001 … 015)
└── seed.sql                 # demo user + sample portfolio
```

`src/proxy.ts` handles session refresh and route protection. (Next.js 16 renamed the former
`middleware.ts` convention to `proxy.ts`.)

---

## Testing

```bash
pnpm test
```

Vitest covers the pure domain logic in `src/lib` — pipeline-stage derivation, tenant resolution
across leasing opportunities, storage-path parsing, and the geofence distance calculation.

---

## Security notes

- Row-level security is enabled on every table; the browser only ever holds the anon key.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses RLS — it is never sent to the client.
- Inbound n8n webhooks are rejected unless the HMAC signature matches `WEBHOOK_SECRET`.
- License images live in private storage buckets and are served through short-lived signed URLs.

---

## Further reading

[`TECH_SPEC.md`](./TECH_SPEC.md) contains the original design document — data model, RLS policy
set, webhook payload schema, and scope decisions. Some sections predate the current
implementation; the code is the source of truth where they disagree.
