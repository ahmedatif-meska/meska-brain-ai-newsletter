# Plan: Sign-up Page

**Branch**: `001-signup-page` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-signup-page/spec.md`

## Summary

Build the public `/signup` page (Phase 1 of `meska-brain-plan.md`) — a dark starry-sky landing card offering Google OAuth and email/password sign-up. Validation runs on submit only; the password strength meter is the lone live-updating element. On success the user is routed to `/signin` (no auto-login, no email verification). Identity is backed by Supabase Auth; first/last name are persisted on the user record (form fields for email/password, Google profile for OAuth). The page is built in Next.js (App Router) with Tailwind CSS v4 and React Server Components by default — interactive islands (`StarField`, `SignupForm`, password meter, eye toggle) are explicit Client Components.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+

**Primary Dependencies**: Next.js 16.2 (App Router, React 19), Tailwind CSS v4 (`@tailwindcss/postcss`), `@supabase/supabase-js` and `@supabase/ssr` (to be added), `babel-plugin-react-compiler` (already configured)

**Storage**: Supabase Postgres + Supabase Auth (identity is single source of truth; profile rows protected by Row-Level Security per Constitution V)

**Testing**: Manual verification at desktop (≥1280px) and mobile (≤390px) widths per Constitution III; TypeScript + ESLint as compile-time gates (`tsc --noEmit`, `npm run lint`). No automated test runner added for this phase.

**Target Platform**: Web (modern evergreen browsers, mobile Safari/Chrome from 360px)

**Project Type**: Web application — Next.js single-package layout (`app/`, `lib/`, `components/`)

**Performance Goals**: Password strength meter updates ≤200ms per keystroke (SC-007). Initial route TTFB acceptable on broadband; bundle kept lean by isolating client components.

**Constraints**: Validation on submit only (Constitution VI). Multi-line hero text must hold its line count across 360/768/1280/1920 widths (Constitution III, SC-004). No application-layer encryption — rely on Supabase at-rest (Constitution V). Neon-blue gradient and dark-sky tokens defined once, referenced by name (Constitution II).

**Scale/Scope**: One public route (`/signup`), one placeholder route (`/signin`), one Supabase Auth integration, ~6 components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md exists; plan cites Phase 1 of `meska-brain-plan.md`. |
| II. Design Fidelity to Plan | PASS | Tokens (`--neon-blue-gradient`, dark-sky surface, mesh-glow) defined in `app/globals.css` and Tailwind theme; reused across components. No LinkedIn, no T&C checkbox. |
| III. Responsive Parity | PASS | Hero/headline use clamp-based sizing; manual verification at 360/1280 mandatory before merge. |
| IV. RSC Performance Discipline | PASS | `/signup/page.tsx` is a Server Component. Only `StarField`, `SignupForm`, password meter, and eye toggle carry `"use client"`. Server Action handles email/password submission. |
| V. Privacy, Auth, Data Integrity | PASS | Supabase Auth is the only identity store. Secrets in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` server-only). Email verification disabled in Supabase Auth settings; no auto-login. |
| VI. Validation Discipline | PASS | All field validation runs in the Server Action / on submit. Only password strength meter is live. |
| VII. Channel-Aware Delivery | N/A | Phase 1 does not collect channel/language; deferred to Phase 3. |
| VIII. Artifact Structure | PASS | plan.md follows Phase → User Story → Acceptance Criteria → Test Scenarios layout (below). |

No violations. Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-signup-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── signup.md        # Server Action + Supabase Auth contract
└── tasks.md             # Produced later by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── layout.tsx                      # Root layout (RSC) — loads globals.css, fonts
├── globals.css                     # Tailwind v4 + design tokens (neon-blue gradient, dark-sky, mesh-glow)
├── page.tsx                        # Marketing root `/` (placeholder — links to /signup)
├── signup/
│   └── page.tsx                    # `/signup` Server Component — composes the page
├── signin/
│   └── page.tsx                    # `/signin` placeholder receiving redirects (full flow out of scope)
├── (auth)/
│   └── _actions/
│       └── signup.ts               # Server Action: email/password sign-up via Supabase admin client
└── auth/
    └── callback/route.ts           # Google OAuth callback → creates account, redirects to /signin

components/
├── auth/
│   ├── AuthCard.tsx                # RSC — frame with "SIGN UP" / "SIGN IN" tabs
│   ├── SignupForm.tsx              # Client — controlled form, calls Server Action, renders errors
│   ├── PasswordField.tsx           # Client — eye-toggle + strength meter
│   ├── PasswordStrengthMeter.tsx   # Client — weak/medium/strong indicator
│   └── GoogleButton.tsx            # Client — triggers Supabase OAuth sign-in flow
├── background/
│   └── StarField.tsx               # Client — twinkling-stars + parallax canvas (respects prefers-reduced-motion)
├── chrome/
│   └── Wordmark.tsx                # RSC — top-left "Meska Brain" link to `/`
└── ui/
    └── Pill.tsx                    # RSC — "AI HYPERPERSONALIZED NEWSLETTER" badge

lib/
├── supabase/
│   ├── client.ts                   # Browser client (anon key)
│   ├── server.ts                   # Server client with cookies (anon key)
│   └── admin.ts                    # Service-role client (server-only) — used for createUser
└── validation/
    └── signup.ts                   # Zod-free hand-rolled validators: name, email, password complexity
```

**Structure Decision**: Single Next.js App Router project. Tailwind v4 + design tokens defined in `app/globals.css`. Supabase clients split into browser/server/admin per `@supabase/ssr` guidance. Server Component is the default; four explicit Client Components handle the interactive islands.

## Phase 1 — Sign-up Page

### User Story 1.1: Email/password sign-up

> As a new visitor, I want to create a Meska Brain account with my first name, last name, email, and a strong password, so that I can sign in and begin onboarding.

- The visitor lands on `/signup`, fills the form, submits, and lands on `/signin`. No email verification, no auto-login. Email uniqueness is case-insensitive; the only server-side error surfaced inline is duplicate-email.

### User Story 1.2: Google OAuth sign-up

> As a new visitor, I want to sign up with my Google account in one click, so that I can skip the form.

- "Sign up with Google" launches Supabase OAuth. On consent, a Supabase user is created with first/last name pulled from the Google profile. The visitor is then routed to `/signin` (no auto-login). If the Google email matches an existing user, no duplicate is created and guidance to sign in is surfaced.

### User Story 1.3: Cross-navigation

> As a visitor who is on the wrong page, I want to move between `/signup`, `/signin`, and `/`, so that I don't get stuck.

- The "SIGN IN" tab at the top of the auth card routes to `/signin` as a separate page (not in-place tab switch). The "Meska Brain" wordmark routes to `/`.

### Acceptance Criteria (for the phase)

- Route `/signup` is publicly accessible (no session required).
- The page renders: Meska Brain wordmark (top-left), AI HYPERPERSONALIZED NEWSLETTER badge with star-rendered leading dot, hero headline with blue-tinted accent, auth card with SIGN UP / SIGN IN tabs, Google button (occupying the LinkedIn position from the reference), email/password form (First Name, Last Name, Email, Password), and a Sign-up CTA.
- The form contains exactly the four fields above. No terms-and-conditions checkbox is present. No LinkedIn button is present.
- The Password field has an eye toggle that flips visibility without clearing the value.
- A password strength meter updates within 200ms of each keystroke (weak / medium / strong).
- All field validation (required, email format, password complexity, duplicate email) runs only on submit — never on type, never on blur. The strength meter is the only live UI.
- Password complexity: ≥8 chars, ≥1 uppercase, ≥1 number, ≥1 symbol. Failures surface field-level inline errors naming the missing class.
- Duplicate email surfaces the inline error: "An account with this email already exists. Sign in instead." No duplicate row is created.
- On valid email/password submit, a Supabase user is created with `user_metadata.first_name`, `user_metadata.last_name` set, email verification disabled. The visitor is routed to `/signin`.
- Clicking "Sign up with Google" initiates Supabase OAuth. After consent, the user record carries first/last name from the Google profile, the visitor lands on `/signin`, and no auto-login occurs.
- A submit double-click results in at most one account creation attempt (button disabled while pending).
- The page background is a dark-blue starry sky with twinkling + 2D parallax; a blue mesh glow sits behind the card; both respect `prefers-reduced-motion`.
- At viewport widths 360, 768, 1280, and 1920 px, the hero headline and badge text keep the same line count.
- The neon-blue gradient and dark-sky tokens are defined once (in `app/globals.css` / Tailwind theme) and consumed by every component that needs them.
- `/signup` is a Server Component. Only `StarField`, `SignupForm`, `PasswordField`, `PasswordStrengthMeter`, and `GoogleButton` carry `"use client"`.
- No Supabase service-role key is shipped in any client bundle. The Server Action that creates email/password users runs server-side.

### Test Scenarios (for the phase)

1. **Email/password happy path** — Given an incognito visitor on `/signup`, When they enter `Jane / Doe / jane@example.com / Aa1!aaaa` and click Sign up, Then a new Supabase user exists with that email and metadata, and the browser is at `/signin`.
2. **Live strength meter, no other live validation** — Given a visitor typing in the Password field, When they have typed `Aa1!aaaa`, Then the strength meter shows "strong" within 200ms and no error/badge appears on Email, First Name, Last Name, or Password fields.
3. **Eye toggle preserves value** — Given the Password field contains `Aa1!aaaa` masked, When the visitor clicks the eye icon, Then the field shows `Aa1!aaaa` in plain text and the cursor/value are preserved; clicking again re-masks without clearing.
4. **Password missing a character class** — Given a visitor submits with password `password1!` (no uppercase), When the form is submitted, Then a field-level inline error names the missing uppercase requirement, the field border is in the error color, and no Supabase user is created.
5. **Invalid email format** — Given a visitor submits with `not-an-email`, When the form is submitted, Then the Email field shows an inline format error and no Supabase user is created.
6. **Missing required fields** — Given a visitor submits with First Name and Password blank, When the form is submitted, Then both fields show an inline "required" error simultaneously and no Supabase user is created.
7. **Duplicate email (email/password)** — Given an existing Supabase user with `jane@example.com`, When a visitor submits the form using `JANE@example.com`, Then the Email field shows "An account with this email already exists. Sign in instead." and no second user is created.
8. **Double-click submission** — Given a visitor double-clicks the Sign-up button rapidly, When both clicks fire, Then only one create-user call is issued (button disabled while pending) and only one user exists.
9. **Google happy path** — Given a visitor clicks "Sign up with Google" and completes consent with a fresh Google account, When the OAuth callback returns, Then a Supabase user exists with first/last name from the Google profile and the browser is at `/signin`.
10. **Google duplicate email** — Given an existing Supabase user with `jane@example.com`, When a Google sign-up flow returns with the same email, Then no duplicate user is created and the page surfaces guidance to sign in.
11. **Google abandoned** — Given a visitor clicks the Google button then closes the consent popup, When they return to `/signup`, Then the form is in its initial state and no Supabase user exists.
12. **SIGN IN tab routes away** — Given a visitor on `/signup`, When they click the SIGN IN tab at the top of the auth card, Then the URL is `/signin` (full navigation, not in-place toggle).
13. **Wordmark routes to root** — Given a visitor on `/signup`, When they click the Meska Brain wordmark, Then the URL is `/`.
14. **Responsive line count** — Given the page is rendered at 360, 768, 1280, and 1920 px widths, When the hero headline and badge are inspected, Then the line count is identical across all four widths.
15. **Reduced motion** — Given a visitor with `prefers-reduced-motion: reduce`, When `/signup` loads, Then the twinkle/parallax animation is paused or substantially reduced while the layout remains identical.
16. **No server-role key in client** — Given the production bundle, When `app/**/_actions/**` and client components are inspected, Then `SUPABASE_SERVICE_ROLE_KEY` is referenced only by server-only modules and is not present in any client chunk.

## Complexity Tracking

No constitution violations; section intentionally empty.
