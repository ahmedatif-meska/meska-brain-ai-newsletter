# Meska Brain — AI Newsletter

Hyper-personalized AI newsletter. Members complete a 3-step profile (Identity → Bio-Link → Finalize) and receive content via WhatsApp, Telegram, or Email.

The product brief lives in [`meska-brain-plan.md`](./meska-brain-plan.md). The non-negotiable governing document is [`.specify/memory/constitution.md`](./.specify/memory/constitution.md). Read both before non-trivial changes.

## Stack

- **Next.js 16** (App Router, React 19 RSC-first) with the React Compiler enabled via `babel-plugin-react-compiler`
- **TypeScript** strict
- **Tailwind CSS v4** via `@tailwindcss/postcss` — brand tokens live in `app/globals.css` (`@theme` + `:root`)
- **Supabase Cloud** (`@supabase/supabase-js` + `@supabase/ssr`)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Open http://localhost:3000 — `/` redirects to `/signup`.

### Required environment variables

`.env.local` must contain:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key used by SSR + browser clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key used only by `lib/supabase/admin.ts` (signup flow) |

The admin client throws at construction if any of these are missing, so signup returns a graceful "Server is not configured" error rather than crashing.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Type-check | `npx tsc --noEmit` |
| Build | `npm run build` |
| Start prod | `npm run start` |

No test runner is installed yet.

## Architecture overview

### Spec-driven workflow (non-negotiable)

Every feature flows through Spec Kit before code is written:
`/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

Each feature lives in `specs/<NNN-name>/` with `spec.md`, `plan.md`, `tasks.md`, and a post-implementation `walkthrough.md`.

### RSC-first with named client islands

Default to Server Components. The only `"use client"` boundaries today are:
- `components/background/StarField.tsx` — DOM-based animated starfield (150 stars, mouse parallax)
- `components/auth/SignupForm.tsx`, `components/auth/SignInForm.tsx` — interactive forms with submit-only validation

Anything new client-side must be justified in the PR.

### Two Supabase client patterns — not interchangeable

| Flow | Client | Why |
|---|---|---|
| **Signup** | `lib/supabase/admin.ts` (service role, `server-only`) via `supabase.auth.admin.createUser` | Bypass email confirmation and write `user_metadata` directly |
| **Signin** | `lib/supabase/server.ts` (`@supabase/ssr` cookie bridge to `next/headers`) via `supabase.auth.signInWithPassword` | Writes the session cookie onto the response — the browser client would not persist it |

Never import `admin.ts` from a client module; the `server-only` import will fail the build.

### Submit-only validation

`lib/validation/signup.ts` exports pure validators that run **only on submit** — not on keystroke, not on blur. The only live-updating UI in Phase 1 is the password strength meter. Inline errors render under the offending field with `var(--error-border)`.

### Route layout

```
app/
├── page.tsx              → redirects / to /signup
├── globals.css           → tokens + @theme + .star/.glass-card/keyframes
├── layout.tsx            → Plus Jakarta Sans + Inter + Material Symbols
├── icon.ico              → favicon (Next.js auto-detected — do not rename)
├── terms/page.tsx
├── home/                 → post-auth dashboard
├── profile/_wizard/      → 3-step profile wizard (Identity → Curation → Finalize)
└── (auth)/               → route group (no URL segment)
    ├── _actions/         → server actions (signup.ts, signin.ts)
    ├── signin/page.tsx
    ├── signup/page.tsx
    └── reset-password/page.tsx
```

## Mobile-fit gate (non-negotiable, Principle III)

Every page **and** every component must fit the mobile viewport. Enforced on every UI PR:

- Zero horizontal overflow at **390 × 844** and **360 × 800**
- No clipped or off-screen content; no awkward wraps
- Multi-line text keeps its line count across breakpoints (use `clamp()` + a conditional `<br className="hidden md:block" />`)
- Touch targets ≥ 44 × 44 px
- Mobile-first: base styles assume mobile; scale up with `sm:` / `md:` / `lg:`
- No fixed pixel widths on layout containers — use `max-w-*`, `w-full`, `clamp()`
- **Verify in a real browser at ≤ 390 px AND ≥ 1280 px before claiming done.** TypeScript + lint passing is not enough.

Concrete recipes (hero pills, glass cards, pill inputs, headline sizing) live in [`learning.md`](./learning.md) under "Phase 1 standard".

## Background animation gotchas

Two non-obvious traps documented in `learning.md`:

1. **z-index propagation** — the starfield is `position: fixed; z-index: -1`. This only works because `<html>` has no background. Adding `background` to the `html` selector makes every star disappear.
2. **SSR/CSR hydration** — star coordinates use `Math.random()`. `StarField` initializes empty state and populates inside `useEffect` so SSR ships an empty container. The single `react-hooks/set-state-in-effect` disable on that line is intentional.

Mouse parallax mutates `field.style.transform` directly inside the mousemove handler — no React state, no re-renders. Respect `prefers-reduced-motion`.

## Repository documents

- [`CLAUDE.md`](./CLAUDE.md) — guidance for Claude Code agents working in this repo
- [`meska-brain-plan.md`](./meska-brain-plan.md) — product brief (source of truth)
- [`.specify/memory/constitution.md`](./.specify/memory/constitution.md) — non-negotiable governing principles
- [`learning.md`](./learning.md) — past gotchas, mobile-fit recipes, debugging notes
- [`specs/`](./specs) — per-feature spec / plan / tasks / walkthrough
