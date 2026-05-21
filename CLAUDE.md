# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- SPECKIT START -->
Active plan: specs/003-profile-wizard/plan.md
<!-- SPECKIT END -->

## Product

Meska Brain is a hyper-personalized AI newsletter. Members complete a 3-form profile
(Identity → Bio-Link → Finalize) and receive content via WhatsApp, Telegram, or Email.
The product brief is `meska-brain-plan.md`; the **non-negotiable** governing document
is `.specify/memory/constitution.md` (currently v1.2.0). Read those two before any
non-trivial change — design tokens, removed elements (LinkedIn, sidebar, email-verify),
and the submit-only validation rule all live there.

## Stack

- Next.js 16 (App Router, React 19 RSC-first) with the React Compiler enabled via
  `babel-plugin-react-compiler` (configured in `next.config.ts`).
- TypeScript strict.
- Tailwind CSS v4 via `@tailwindcss/postcss`. Brand tokens (neon-blue gradient,
  dark-sky, mesh-glow, headline-gradient) are defined in `app/globals.css` inside the
  `@theme` and `:root` blocks. Reference tokens by name; never re-define hex per
  component.
- Supabase Cloud (`@supabase/supabase-js` + `@supabase/ssr`).

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` (port 3000, often falls back to 3001/3002 if occupied) |
| Lint | `npm run lint` (flat config in `eslint.config.mjs`) |
| Type-check | `npx tsc --noEmit` (no script alias — call directly) |
| Build | `npm run build` |
| Start prod | `npm run start` |

No test runner is installed yet. When adding one, document the single-test invocation here.

## Architecture

### Spec-driven workflow (NON-NEGOTIABLE — Principle I)

Every feature flows through Spec Kit before code is written:
`/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`. Each feature lives in `specs/<NNN-name>/` with `spec.md`,
`plan.md`, `tasks.md`, and a post-implementation `walkthrough.md` (Principle VIII
mandates that exact structure). `meska-brain-plan.md` is the source of truth; specs
cite the phase/section they implement and never silently contradict it.

### RSC-first with named client islands (Principle IV)

Default to Server Components. Current `"use client"` boundaries are deliberate:

- `components/background/StarField.tsx` — DOM-based animated starfield (150 stars).
- `components/auth/SignupForm.tsx` and `components/auth/SignInForm.tsx` — interactive
  forms with submit-only validation.

Anything else should stay server-side unless interactivity or a browser API forces
otherwise. Justify new client components in the PR.

### Auth flows have two different Supabase client patterns

Important distinction — these are not interchangeable:

- **Signup** uses `lib/supabase/admin.ts` (service-role, `import "server-only"`,
  throws if env vars missing) via `supabase.auth.admin.createUser`. The admin client
  is needed to bypass email confirmation and write `user_metadata` directly. Called
  from `app/(auth)/_actions/signup.ts`.
- **Signin** uses `lib/supabase/server.ts` (anon key + `@supabase/ssr` cookie
  bridge to `next/headers`) via `supabase.auth.signInWithPassword`. The SSR client
  is required because it writes the session cookie onto the response — the browser
  client would NOT persist the session. Called from `app/(auth)/_actions/signin.ts`.

Never import `admin.ts` from a client module; the `server-only` import will fail
the build if you do.

`SignupForm` collects `firstName` and `lastName` (required) and the server action
writes both to `user_metadata` along with `display_name`, `full_name`, and `name`
(all set to `"First Last"`) because different Supabase dashboards/JWT consumers read
different keys.

### Validation is submit-only (Principle VI)

`lib/validation/signup.ts` exports pure validators (`validateName`, `validateEmail`,
`validatePassword`, `validateSignupInput`, `scorePassword`). They run **only when
the form is submitted** — not on keystroke, not on blur. The only live-updating UI
allowed in Phase 1 is the password strength meter; the signup card itself is silent
until submit. Inline errors render directly under the offending field with
`var(--error-border)` on the input.

### Route layout

```
app/
├── page.tsx              → redirects / to /signup (Phase 1 has no marketing home)
├── icon.ico              → Next.js auto-detects this as the favicon
├── globals.css           → tokens + @theme + .star/.glass-card/keyframes
├── layout.tsx            → loads Plus Jakarta Sans + Inter + Material Symbols
├── terms/page.tsx        → /terms (linked from signup footer)
└── (auth)/               → route group (parentheses ⇒ no URL segment)
    ├── _actions/         → server actions; underscore keeps it out of the route table
    │   ├── signup.ts
    │   └── signin.ts
    ├── signin/page.tsx
    ├── signup/page.tsx
    └── reset-password/page.tsx
```

`(auth)` is purely organizational — URLs remain `/signin`, `/signup`, `/reset-password`.
Phase 2/3 dashboard pages will live outside this group with the white + neon-blue
theme (no dark-theme leakage — Principle II).

### Background animation: known gotchas

The animated starfield has two non-obvious traps documented in `learning.md`:

1. **z-index propagation.** The starfield is `position: fixed; z-index: -1` so it
   sits behind content. This only works because `<html>` has NO background — the
   body's `background-color` propagates to the viewport canvas, leaving the
   negative-z layer visible. If you add `background` to the `html` selector in
   `globals.css`, every star disappears.
2. **SSR/CSR hydration.** Star coordinates use `Math.random()`, which would diverge
   between server and client. `StarField` initializes `useState<StarSpec[]>([])` and
   populates inside `useEffect` so SSR ships an empty container. The single
   `react-hooks/set-state-in-effect` disable on that line is intentional.

The mouse parallax mutates `field.style.transform` directly inside the mousemove
handler — no React state, no re-renders. Respect `prefers-reduced-motion`.

### Mobile-fit gate (NON-NEGOTIABLE — Principle III v1.2.0)

Every page AND every component MUST fit the mobile viewport. This is a strict,
blocking gate enforced on every PR touching UI:

- Zero horizontal overflow at 390 × 844 and 360 × 800.
- No clipped content, no off-screen elements, no awkward wraps (use
  `whitespace-nowrap`, mobile-only `text-[10px]`, or shorter copy as needed).
- Multi-line text keeps its line count across breakpoints (use `clamp()` font sizes
  and a conditional `<br className="hidden md:block" />`).
- Touch targets ≥ 44 × 44 px.
- Mobile-first: base styles assume mobile; scale UP with `sm:`/`md:`/`lg:`.
- No fixed pixel widths on layout containers — use `max-w-*`, `w-full`, `clamp()`.
- **Verify in a real browser at ≤ 390px AND ≥ 1280px before claiming a UI task is
  done.** TypeScript + ESLint passing is NOT enough. The Claude in Chrome MCP
  (`resize_window` → `navigate` → screenshot) is the standard verification path.

Concrete recipes for hero pills, glass cards, pill inputs, and headline sizing live
in `learning.md` under "Phase 1 standard".

## Environment

`.env.local` is required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; consumed by `lib/supabase/admin.ts`)

The admin client throws at construction if any of these are missing, so the signup
action returns a graceful "Server is not configured" error rather than crashing.

## When in doubt

- Read `.specify/memory/constitution.md` first — it overrides design refs when the
  two conflict (Phase 1 had a LinkedIn round-trip because that order was inverted).
- Read `learning.md` for documented past gotchas (starfield z-index, hydration,
  mobile-fit recipes, favicon naming, Supabase admin vs SSR client choice).
- The active spec is referenced in the SPECKIT comment at the top of this file.
