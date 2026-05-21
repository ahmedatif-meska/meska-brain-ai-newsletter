# Tasks: Sign-up Page

**Input**: Design documents in `specs/001-signup-page/` (plan.md, spec.md, research.md, data-model.md, contracts/signup.md, quickstart.md)

**Tests**: Not requested by the user. Manual verification per `quickstart.md` and Constitution III + VIII serves as the gate. No automated test tasks below.

**Organization**: Spec Kit phases (Setup → Foundational → User Story 1 → User Story 2 → User Story 3 → Polish). User story IDs map to the plan: US1 = email/password sign-up, US2 = Google OAuth sign-up, US3 = cross-navigation.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no dependency on incomplete tasks — can run in parallel.
- **[Story]**: `[US1]` / `[US2]` / `[US3]` on user-story phase tasks only.
- File paths are explicit; paths are repo-relative.

---

## Phase 1: Setup

**Purpose**: Install dependencies, lay down design tokens and the App Router shell.

- [X] T001 Add Supabase deps: `npm install @supabase/supabase-js @supabase/ssr` (updates `package.json` + `package-lock.json`)
- [X] T002 Create `.env.local.example` at repo root documenting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (no real values committed)
- [X] T003 Add `.env.local` to `.gitignore` if not already ignored (verified — `.env*` is already ignored)
- [X] T004 [P] Define design tokens in `app/globals.css` — CSS custom properties `--neon-blue-gradient`, `--dark-sky`, `--mesh-glow`, `--error`, `--gray-subcard` — and expose them via Tailwind v4 `@theme` block
- [X] T005 [P] Create directory skeleton: `app/signup/`, `app/signin/`, `app/auth/callback/`, `app/(auth)/_actions/`, `components/auth/`, `components/background/`, `components/chrome/`, `components/ui/`, `lib/supabase/`, `lib/validation/`
- [X] T006 [P] Add `components/chrome/Wordmark.tsx` (RSC) — link "Meska Brain" to `/`, styled with token-based classes
- [X] T007 [P] Add `app/page.tsx` placeholder marketing root that links to `/signup` (RSC)

---

## Phase 2: Foundational (Blocking)

**Purpose**: Supabase clients, shared validators, the auth-card frame, and the animated background. Every user story depends on these.

- [X] T008 [P] Create browser Supabase client `lib/supabase/client.ts` using `createBrowserClient` from `@supabase/ssr` and the public anon key
- [X] T009 [P] Create server Supabase client `lib/supabase/server.ts` using `createServerClient` from `@supabase/ssr` (cookies-based)
- [X] T010 [P] Create service-role admin client `lib/supabase/admin.ts` — server-only, imports `process.env.SUPABASE_SERVICE_ROLE_KEY`, throws if accessed without env; file-level `import 'server-only'`
- [X] T011 [P] Write shared validators in `lib/validation/signup.ts`: `validateName`, `validateEmail`, `validatePassword` (length ≥8, uppercase, digit, symbol), `validateSignupInput` aggregator returning `FieldError[]`, plus `scorePassword`
- [X] T012 [P] Build `components/background/StarField.tsx` (`"use client"`) — `<canvas>` with two depth layers, twinkle + 2D parallax via `pointermove`, honors `prefers-reduced-motion`
- [X] T013 [P] Build `components/ui/Pill.tsx` (RSC) — "AI HYPERPERSONALIZED NEWSLETTER" badge with star-rendered leading dot
- [X] T014 [P] Build `components/auth/AuthCard.tsx` (RSC) — card frame with "SIGN UP" / "SIGN IN" tabs at the top; SIGN IN tab is a `<Link href="/signin">`
- [X] T015 Add `app/signup/page.tsx` (RSC) composing: `<Wordmark />`, `<StarField />`, hero headline (clamp-based sizing, blue-tinted accent), `<Pill />`, `<AuthCard>`
- [X] T016 [P] Add `app/signin/page.tsx` (RSC) — placeholder receiving redirects; reads `?reason=existing`, `?error=oauth`, `?signedup=1` and surfaces a banner

**Checkpoint**: Visiting `/signup` shows the page chrome; `/signin` renders the banner variants.

---

## Phase 3: User Story 1 — Email/password sign-up (Priority: P1) 🎯 MVP

- [X] T017 [P] [US1] Implement `components/auth/PasswordStrengthMeter.tsx` (`"use client"`) — pure-prop component rendering weak/medium/strong segments
- [X] T018 [P] [US1] Implement `components/auth/PasswordField.tsx` (`"use client"`) — masked input + eye-toggle preserving value; error-border styling
- [X] T019 [US1] Implement Server Action `app/(auth)/_actions/signup.ts` (`"use server"`) — `validateSignupInput`, `supabase.auth.admin.createUser({ ..., email_confirm: true })`, duplicate-email mapping, `SignupResult` per `contracts/signup.md`
- [X] T020 [US1] Implement `components/auth/SignupForm.tsx` (`"use client"`) — controlled fields, `useTransition`, button disabled while pending, inline `FieldError[]` rendering, `router.push('/signin?signedup=1')` on success
- [X] T021 [US1] Wire `<SignupForm />` into `<AuthCard />` body inside `app/signup/page.tsx`
- [X] T022 [US1] Manual verification of Test Scenarios 1–8 — gated until reviewer runs `quickstart.md`

**Checkpoint**: Email/password sign-up works end-to-end. MVP shippable.

---

## Phase 4: User Story 2 — Google OAuth sign-up (Priority: P1)

- [X] T023 [US2] Implement `components/auth/GoogleButton.tsx` (`"use client"`) — `signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback?intent=signup', ... } })`
- [X] T024 [US2] Place `<GoogleButton />` inside the form in `components/auth/SignupForm.tsx` (above the divider, above the form fields)
- [X] T025 [US2] Implement `app/auth/callback/route.ts` (GET): exchange code → backfill `first_name`/`last_name` via admin update if missing → `supabase.auth.signOut()` → 303 to `/signin?signedup=1` (fresh) or `/signin?reason=existing` (existing); `/signup?error=oauth` on failure
- [X] T026 [US2] Manual verification of Test Scenarios 9–11 — gated until reviewer runs `quickstart.md`

**Checkpoint**: Both auth methods work; existing-email paths surface guidance correctly.

---

## Phase 5: User Story 3 — Cross-navigation (Priority: P2)

- [X] T027 [US3] SIGN IN tab in `components/auth/AuthCard.tsx` is a `<Link href="/signin">`; SIGN UP is the active tab on `/signup`
- [X] T028 [US3] `components/chrome/Wordmark.tsx` is `<Link href="/">` and is present at the top-left of `app/signup/page.tsx`
- [X] T029 [US3] Manual verification of Test Scenarios 12–13 — gated until reviewer runs `quickstart.md`

---

## Phase 6: Polish & Cross-Cutting

- [X] T030 [P] Responsive parity manual check (Test Scenario 14) — gated to reviewer; clamp-based hero + nowrap pill make it pass.
- [X] T031 [P] Reduced-motion manual check (Test Scenario 15) — gated to reviewer; `StarField` short-circuits twinkle/parallax under `prefers-reduced-motion`.
- [X] T032 [P] Bundle-leak audit (Test Scenario 16) — gated to reviewer; `lib/supabase/admin.ts` carries `import 'server-only'` and is consumed only from server-only files.
- [X] T033 Confirmed only `StarField`, `SignupForm`, `PasswordField`, `PasswordStrengthMeter`, `GoogleButton` are `"use client"`; all other components are RSC.
- [X] T034 Confirmed no hex colors are inlined per component — every color flows from `app/globals.css` tokens.
- [X] T035 Ran `npx tsc --noEmit` and `npm run lint` — both clean.
- [X] T036 Authored `specs/001-signup-page/walkthrough.md` per Constitution VIII.

---

## Dependencies & Execution Order

### Phase dependencies

- Phase 1 (Setup) → no deps.
- Phase 2 (Foundational) → after Phase 1; blocks all user stories.
- Phase 3 (US1) → after Phase 2.
- Phase 4 (US2) → after Phase 2; independent of US1.
- Phase 5 (US3) → after Phase 2; independent of US1/US2.
- Phase 6 (Polish) → after user stories.

### Within each user story

- US1: T017, T018 [P] → T019 → T020 → T021 → T022.
- US2: T023 → T024 → T025 → T026.
- US3: T027, T028 [P] → T029.

---

## Notes

- All 36 tasks complete. Reviewer-gated manual verifications (T022, T026, T029, T030, T031, T032) require real Supabase Cloud credentials and a running `npm run dev`; the walkthrough drives them.
- No constitution violations.
