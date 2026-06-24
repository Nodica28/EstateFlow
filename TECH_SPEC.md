# Real Estate CRM — Technical Specification

**Version:** 1.0  
**Date:** 2026-04-09  
**Status:** Draft

---

## 1. Overview

A custom CRM dashboard for real estate agents. Provides contact management, unit tracking, communication history, AI-assisted Q&A, and pipeline management through Kanban and table views. Contact data flows in via automated n8n webhooks.

---

## 2. Tech Stack

### Frontend

| Layer             | Technology              |
| ----------------- | ----------------------- |
| Framework         | Next.js 15 (App Router) |
| Styling           | Tailwind CSS            |
| Component Library | shadcn/ui               |
| Icons             | Lucide React            |
| State Management  | Zustand                 |
| Schema Validation | Zod                     |
| Language          | TypeScript              |

### Backend

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| API Routes         | Next.js Route Handlers (App Router) |
| Database           | Supabase (PostgreSQL)               |
| Auth               | Supabase Auth                       |
| Realtime           | Supabase Realtime                   |
| Row-Level Security | Enabled on all tables               |

### Tooling

| Tool     | Purpose                            |
| -------- | ---------------------------------- |
| ESLint   | Linting                            |
| Prettier | Code formatting                    |
| Husky    | Git hooks (pre-commit lint/format) |

### Infrastructure

| Layer            | Technology                  |
| ---------------- | --------------------------- |
| Deployment       | Vercel                      |
| Automation       | n8n (self-hosted or cloud)  |
| Webhook Security | HMAC signature verification |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Next.js)                 │
│                                                     │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │  Auth    │  │   App Router     │  │  API      │  │
│  │  Pages   │  │   (RSC + CSR)    │  │  Routes   │  │
│  └──────────┘  └──────────────────┘  └─────┬─────┘  │
└──────────────────────────────────────────── │ ──────┘
                                              │
              ┌───────────────────────────────┤
              │                               │
     ┌────────▼────────┐             ┌────────▼────────┐
     │    Supabase      │             │      n8n        │
     │  - PostgreSQL    │             │  - Workflows    │
     │  - Auth          │◄────────────│  - Webhooks     │
     │  - Realtime      │             │  - Automations  │
     │  - RLS           │             └─────────────────┘
     └─────────────────┘
```

### n8n Webhook Flow

```
n8n Workflow
  → POST /api/webhooks/n8n
  → HMAC signature verified (X-Webhook-Signature header)
  → Payload parsed and validated with Zod
  → Contact upserted into Supabase
  → Realtime broadcast triggers UI update
```

---

## 4. Authentication

- Supabase Auth (email/password)
- Session managed via `@supabase/ssr` (server-side cookie handling)
- Protected routes via Next.js middleware (`middleware.ts`)
- RLS policies enforce that agents only access their own data

### Auth Flow

```
/login  →  Supabase signInWithPassword  →  Session cookie set  →  /dashboard
/signup →  Supabase signUp              →  Email verification  →  /dashboard
```

---

## 5. Pages

### 5.1 `/login`

- Email + password form
- Validation via Zod
- Redirects authenticated users to `/dashboard`

### 5.2 `/signup`

- Email + password + name fields
- Supabase email verification flow
- Agent profile created on successful signup

### 5.3 `/dashboard` (protected)

Three-panel layout:

```
┌─────────────┬──────────────────────────┬──────────────┐
│             │                          │              │
│   Sidebar   │      Main Content        │  AI Sidebar  │
│   (Left)    │      (Center)            │   (Right)    │
│             │                          │              │
│  - Nav      │  Table / Kanban View     │  AI Chat     │
│  - Filters  │  Contact Details         │  Context     │
│  - Quick    │  Unit Details            │  Aware       │
│    Actions  │  Communication Panel     │              │
│             │                          │              │
└─────────────┴──────────────────────────┴──────────────┘
```

---

## 6. Layout Components

### 6.1 Left Sidebar

- App logo / branding
- Primary navigation links (Dashboard, Contacts, Units, Communications, Settings)
- Quick filters (by contact type, status)
- Collapsed/expanded toggle (stored in Zustand)

### 6.2 Main Content Area

- View switcher: **Table View** | **Kanban View**
- Search bar + column filters
- Bulk action toolbar (appears on selection)
- Detail panel or slide-over for selected record

### 6.3 Right AI Sidebar

- Collapsible chat interface
- Context-aware: passes currently viewed contact/unit to the AI prompt
- Message history per session (stored in Zustand, optionally persisted to Supabase)
- Powered by Claude API (via `/api/ai/chat` route handler)

---

## 7. Core Features

### 7.1 Table View

- Columns: Name, Type, Status, Unit, Last Contact, Created At
- Sortable, filterable columns
- Pagination (server-side)
- Inline edit for key fields
- Row click → detail slide-over

### 7.2 Kanban View

- Columns map to contact pipeline stages (see §8 for stages)
- Drag-and-drop via `@dnd-kit/core`
- Cards show: Name, Unit, Last Activity, Type badge
- Dropping a card updates `status` in Supabase via optimistic update
- Realtime: other agents' moves reflected instantly

### 7.3 AI Q&A (Right Sidebar)

- Input: free-text question
- System prompt includes currently selected contact/unit as structured context
- Responses streamed via Vercel AI SDK (`useChat`)
- Example queries: "What's the next step for this tenant?", "Summarize this contact's history"

### 7.4 Driver License Verification (Simulated)

- Triggered from a contact's detail view: "Verify Identity" button
- Displays a dummy driver's license image (pre-seeded assets)
- Agent marks fields as verified: Name, DOB, Address, License Number
- Stores `identity_verified: boolean` and `verified_at: timestamp` on the contact record
- No real OCR or external API — purely simulated UI flow for demo/training purposes

### 7.5 Communication Panel

Unified view of all interactions per contact:

| Type  | Details                                           |
| ----- | ------------------------------------------------- |
| Email | Subject, body, sent/received timestamp, direction |
| SMS   | Message body, timestamp, direction                |
| Phone | Call transcript, duration, timestamp              |

- Communications are linked to a `contact_id`
- Stored in `communications` table
- Can be manually logged or ingested via n8n automation
- Filterable by type; sorted newest-first

### 7.6 Contact ↔ Unit Linking

- Each contact can be linked to one or more units
- Each unit can have multiple contacts (e.g., prospective tenants, owner)
- Junction table `contact_units` with role context
- Unit detail accessible inline from contact view and vice versa

---

## 8. Contact Types & Pipeline

### Contact Types

| Type                 | Description                             |
| -------------------- | --------------------------------------- |
| `prospective_tenant` | Current default type — main scope of v1 |
| `tenant`             | Active tenant (future)                  |
| `owner`              | Property owner (future)                 |
| `vendor`             | Service vendor (future)                 |
| `realtor`            | Other agents/realtors (future)          |

### Pipeline Stages (Kanban Columns)

Applies to `prospective_tenant` in v1:

1. **New Lead** — Ingested via n8n or manually added
2. **Contacted** — Initial outreach made
3. **Showing Scheduled** — Property showing booked
4. **Application Submitted** — Rental application received
5. **Under Review** — Application being processed
6. **Approved / Rejected** — Final decision made
7. **Lease Signed** — Converted to tenant (future stage)

---

## 9. Database Schema

### `profiles`

```sql
id            uuid  PRIMARY KEY REFERENCES auth.users(id)
full_name     text
email         text
avatar_url    text
created_at    timestamptz DEFAULT now()
```

### `contacts`

```sql
id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid()
agent_id            uuid  REFERENCES profiles(id)
first_name          text  NOT NULL
last_name           text  NOT NULL
email               text
phone               text
type                text  DEFAULT 'prospective_tenant'
status              text  DEFAULT 'new_lead'
identity_verified   bool  DEFAULT false
verified_at         timestamptz
notes               text
source              text  -- 'manual' | 'n8n'
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

### `units`

```sql
id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
agent_id      uuid  REFERENCES profiles(id)
address       text  NOT NULL
unit_number   text
city          text
state         text
zip           text
bedrooms      int
bathrooms     numeric
rent_amount   numeric
status        text  DEFAULT 'available'  -- available | occupied | maintenance
created_at    timestamptz DEFAULT now()
```

### `contact_units`

```sql
id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
contact_id    uuid  REFERENCES contacts(id) ON DELETE CASCADE
unit_id       uuid  REFERENCES units(id)    ON DELETE CASCADE
role          text  -- 'applicant' | 'tenant' | 'owner'
created_at    timestamptz DEFAULT now()
UNIQUE(contact_id, unit_id)
```

### `communications`

```sql
id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
contact_id    uuid  REFERENCES contacts(id) ON DELETE CASCADE
agent_id      uuid  REFERENCES profiles(id)
type          text  NOT NULL  -- 'email' | 'sms' | 'phone'
direction     text  NOT NULL  -- 'inbound' | 'outbound'
subject       text            -- email only
body          text
duration_sec  int             -- phone only
created_at    timestamptz DEFAULT now()
```

### `ai_conversations`

```sql
id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
agent_id      uuid  REFERENCES profiles(id)
contact_id    uuid  REFERENCES contacts(id)  -- nullable, context anchor
messages      jsonb DEFAULT '[]'
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### RLS Policies (applied to all tables)

```sql
-- Example for contacts
CREATE POLICY "agents_own_contacts" ON contacts
  FOR ALL USING (agent_id = auth.uid());
```

---

## 10. API Routes

| Method | Route                               | Description                              |
| ------ | ----------------------------------- | ---------------------------------------- |
| POST   | `/api/webhooks/n8n`                 | Ingest contacts from n8n (HMAC secured)  |
| POST   | `/api/ai/chat`                      | Proxy to Claude API, streams response    |
| GET    | `/api/contacts`                     | List contacts (with filters, pagination) |
| POST   | `/api/contacts`                     | Create contact manually                  |
| PATCH  | `/api/contacts/[id]`                | Update contact (status, fields)          |
| GET    | `/api/contacts/[id]/communications` | Fetch communication history              |
| POST   | `/api/contacts/[id]/communications` | Log new communication                    |
| GET    | `/api/units`                        | List units                               |
| POST   | `/api/units`                        | Create unit                              |
| PATCH  | `/api/units/[id]`                   | Update unit                              |
| POST   | `/api/contacts/[id]/verify`         | Mark identity as verified                |

---

## 11. n8n Integration

### Webhook Endpoint

```
POST /api/webhooks/n8n
```

### Security

- n8n sends `X-Webhook-Signature: sha256=<hmac>` header
- Server computes HMAC-SHA256 of raw body using `WEBHOOK_SECRET` env var
- Requests with invalid signatures return `401`

### Expected Payload (Zod schema)

```typescript
const N8nContactPayload = z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string().optional(),
    type: z
        .enum(["prospective_tenant", "tenant", "owner", "vendor", "realtor"])
        .default("prospective_tenant"),
    notes: z.string().optional(),
    unit_address: z.string().optional(), // auto-links or creates unit
});
```

### Behavior

1. Validate payload with Zod
2. Upsert contact (match on email or phone)
3. If `unit_address` provided, find or create unit and create `contact_units` record
4. Supabase Realtime broadcasts new contact to connected dashboard clients

---

## 12. State Management (Zustand)

```typescript
// stores/useUIStore.ts
interface UIStore {
    sidebarCollapsed: boolean;
    aiSidebarOpen: boolean;
    activeView: "table" | "kanban";
    selectedContactId: string | null;
    toggleSidebar: () => void;
    toggleAISidebar: () => void;
    setView: (view: "table" | "kanban") => void;
    setSelectedContact: (id: string | null) => void;
}

// stores/useContactStore.ts
interface ContactStore {
    contacts: Contact[];
    filters: ContactFilters;
    setContacts: (contacts: Contact[]) => void;
    updateContactStatus: (id: string, status: string) => void;
    setFilters: (filters: Partial<ContactFilters>) => void;
}
```

---

## 13. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Webhooks
WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 14. Project Structure

```
realestate/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── layout.tsx          # Three-panel shell
│   │       └── page.tsx
│   └── api/
│       ├── webhooks/n8n/route.ts
│       ├── ai/chat/route.ts
│       ├── contacts/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── communications/route.ts
│       │       └── verify/route.ts
│       └── units/
│           ├── route.ts
│           └── [id]/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── AISidebar.tsx
│   │   └── TopBar.tsx
│   ├── contacts/
│   │   ├── ContactTable.tsx
│   │   ├── ContactKanban.tsx
│   │   ├── ContactCard.tsx
│   │   ├── ContactDetail.tsx
│   │   └── VerifyIdentityModal.tsx
│   ├── communications/
│   │   └── CommunicationFeed.tsx
│   ├── units/
│   │   └── UnitDetail.tsx
│   └── ai/
│       └── AIChat.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (cookies)
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── contact.ts
│   │   └── webhook.ts
│   └── utils.ts
├── stores/
│   ├── useUIStore.ts
│   └── useContactStore.ts
├── types/
│   └── index.ts
├── middleware.ts                    # Auth route protection
└── public/
    └── licenses/                   # Dummy DL images for simulation
```

---

## 15. Security Considerations

| Concern                  | Mitigation                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| Unauthorized data access | Supabase RLS on all tables, scoped to `agent_id = auth.uid()`       |
| Webhook spoofing         | HMAC-SHA256 signature verification on n8n webhook endpoint          |
| XSS                      | React's default escaping; no `dangerouslySetInnerHTML`              |
| CSRF                     | Supabase SSR uses `SameSite=Lax` cookies                            |
| Secret exposure          | All secrets in environment variables, never in client bundles       |
| Service role leakage     | `SUPABASE_SERVICE_ROLE_KEY` only used in server-side route handlers |

---

## 16. Realtime Behavior

Supabase Realtime subscriptions are enabled for:

- `contacts` table — new leads from n8n appear instantly on the dashboard
- `contact_units` table — unit link changes reflected live
- `communications` table — new messages appear in communication feed

Clients subscribe via `supabase.channel()` on mount and unsubscribe on unmount.

---

## 17. v1 Scope vs. Future

### v1 (In Scope)

- Login / Signup
- Dashboard with table + kanban view
- Contact management (`prospective_tenant` type only)
- Unit management + contact-unit linking
- Communication log (email, SMS, phone transcript — manual entry + n8n ingest)
- AI Q&A sidebar
- Simulated driver license identity verification
- n8n webhook ingest with HMAC security

### Future Scope

- Additional contact types: Tenant, Owner, Vendor, Realtor
- Real OCR-based identity verification (e.g., Stripe Identity, Onfido)
- Email/SMS send from within the CRM (Resend, Twilio)
- Reporting & analytics dashboard
- Document management (lease uploads)
- Mobile-responsive / PWA

---

_End of Tech Spec_
