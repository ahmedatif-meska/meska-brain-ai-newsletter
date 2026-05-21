# Tasks: Landing Redesign

**Input**: Design documents in `specs/004-landing-redesign/` (plan.md, spec.md, research.md, data-model.md, contracts/signup.md, quickstart.md)

**Tests**: Not requested. Manual verification via `quickstart.md` is the gate (Constitution III + VIII).

**Organization**: Spec Kit phases — Setup → Foundational → US1 (sign-up rewrite, P1) → US2 (in-card sign-in link, P2) → US3 (root redirect, P2) → US4 (stars behind card + hover parallax, P3) → Polish. Tasks edit the existing 001 implementation; no greenfield directory work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no dependency on incomplete tasks.
- **[Story]**: `[US1]` / `[US2]` / `[US3]` / `[US4]` on user-story phase tasks only.
- File paths are explicit and repo-relative.

---

## Phase 1: Setup (deletions + scope reduction)

**Purpose**: Remove the surfaces 004 supersedes so later tasks operate on a clean tree. No new dependencies.

- [X] T001 Delete `app/auth/callback/route.ts` (Google OAuth callback no longer used)
- [X] T002 Delete `components/auth/GoogleButton.tsx` (no social-auth in MVP)
- [X] T003 Verify `Test-Path app/auth/callback/route.ts` and `Test-Path components/auth/GoogleButton.tsx` both return `False` (PowerShell quick check)

---

## Phase 2: Foundational (Blocking)

**Purpose**: Shared types, validators, and tokens that every user story depends on.

- [X] T004 [P] Trim `lib/validation/signup.ts`: remove `validateName`; change `SignupInput` to `{ email: string; password: string }`; update `validateSignupInput` to take/return only email + password errors; keep `validateEmail`, `validatePassword`, `scorePassword`, `PasswordStrength` unchanged
- [X] T005 [P] Update `FieldError['field']` union in `lib/validation/signup.ts` to `'email' | 'password' | 'form'` (drop `'firstName' | 'lastName'`)
- [X] T006 [P] Confirm `app/globals.css` already exposes `--neon-blue-gradient`, `--dark-sky`, `--mesh-glow`, `--error`, `--error-border`, `--gray-subcard` (carried over from 001 — no edit expected; flag any drift)

**Checkpoint**: TypeScript compiles after Phase 2 only if T007–T010 are not yet run — `signupWithPassword` and `SignupForm` still reference the old `SignupInput` shape. That's expected; US1 fixes it.

---

## Phase 3: US1 — Email/password sign-up matching the reference (P1) 🎯 MVP

**Goal**: `/signup` renders the single-column layout from `Login.png`, the card collects only Email + Password, the Server Action creates the Supabase user with empty `first_name`/`last_name`, and the visitor lands on `/signin?signedup=1`.

**Independent Test**: Submit `jane@example.com` / `Aa1!aaaa` in incognito and verify the Supabase row exists with empty names and `auth_method: 'password'`; URL is `/signin?signedup=1`.

- [X] T007 [US1] Rewrite Server Action `app/(auth)/_actions/signup.ts`: read only `email` and `password` from `FormData`; pass `{ email, password }` to `validateSignupInput`; on Supabase call, set `user_metadata: { first_name: '', last_name: '', auth_method: 'password' }`; on success return `{ ok: true, redirect: '/signin?signedup=1' }`; keep the duplicate-email mapping unchanged
- [X] T008 [US1] Rewrite `components/auth/SignupForm.tsx`: drop firstName/lastName state and inputs; drop the `<GoogleButton />` and the "or" divider; render in order: card title "Create account", subtitle "Join the next generation of AI intelligence", Email field, Password field (with eye toggle), strength meter, full-width "Sign up" button (neon-blue gradient), an `<Link href="/signin">` "Already have an account? Sign in" line, and below the card the small T&C copy "By signing up, you agree to our Terms and Conditions." with "Terms and Conditions" as a `<Link href="/terms">` (placeholder)
- [X] T009 [US1] Rewrite `components/auth/AuthCard.tsx`: remove the SIGN UP / SIGN IN tab strip; render a single uppercase "SIGN UP" label inside the card header; set card surface to translucent (`bg-[rgba(10,18,48,0.55)]` + `backdrop-blur-md`) and keep the mesh-glow radial behind it; ensure card sits above the page-wide canvas (default z, no `-z` class)
- [X] T010 [US1] Rewrite `app/signup/page.tsx` to a single centred column: wordmark top-left, then a vertically stacked `max-w-md` column containing `<Pill>AI-Hyperpersonalized Newsletter</Pill>`, the 2-line hero ("Eliminate the noise. Get hyper-personalized" / "AI insights on your preferred channel.") with "AI insights" inside a `bg-clip-text` span using `--neon-blue-gradient`, and `<AuthCard><SignupForm /></AuthCard>`; remove the old `lg:grid-cols-2` split; keep `<StarField />` mounted once at the top
- [X] T011 [US1] In `components/ui/Pill.tsx` (or at the use-site in `app/signup/page.tsx`), update the pill copy to `AI-HYPERPERSONALIZED NEWSLETTER` (uppercase, hyphenated) and keep `whitespace-nowrap`
- [X] T012 [US1] Update `app/signin/page.tsx` so the `?signedup=1` banner text reads "Account created. Sign in to continue." (already in place from 001 — confirm it still renders correctly without name)
- [X] T013 [US1] Run `npx tsc --noEmit` and `npm run lint`; fix any drift introduced by T007–T012
- [X] T014 [US1] Manual verification of Test Scenarios 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15 from `plan.md` against `npm run dev` at 1280 px width

**Checkpoint**: Email/password sign-up works end-to-end on the new layout. MVP shippable here.

---

## Phase 4: US2 — In-card "Sign in" link (P2)

**Goal**: The only path from `/signup` to `/signin` is the in-card link.

**Independent Test**: From `/signup`, click "Sign in" inside the card → URL becomes `/signin`.

- [X] T015 [US2] Confirm the `<Link href="/signin">` "Already have an account? Sign in" line exists inside `components/auth/SignupForm.tsx` below the Sign up button (added in T008); ensure it is keyboard-focusable and styled with a subtle hover state
- [X] T016 [US2] Confirm `components/auth/AuthCard.tsx` no longer renders any top-of-card SIGN IN tab/link
- [X] T017 [US2] Manual verification of Test Scenarios 13, 14

---

## Phase 5: US3 — Marketing root removed (P2)

**Goal**: GET `/` returns a 307 redirect to `/signup`; no "Get started" content remains.

**Independent Test**: `curl -I http://localhost:3000/` returns 307 with `Location: /signup`; opening `/` in a browser lands on `/signup` with no flash.

- [X] T018 [US3] Rewrite `app/page.tsx` to:
  ```ts
  import { redirect } from "next/navigation";
  export default function Root() { redirect("/signup"); }
  ```
- [X] T019 [US3] Manual verification of Test Scenario 1 — confirm DevTools Network shows a 307 from `/` to `/signup` and no flash of any prior content

---

## Phase 6: US4 — Stars visible behind card + parallax over card (P3)

**Goal**: Stars are perceptible through the translucent card surface, and `pointermove` parallax fires while the pointer is over the card.

**Independent Test**: Hover the pointer from outside the card to inside; near-layer stars shift ≥3 px between frames. Toggle reduce-motion on and stars freeze.

- [X] T020 [US4] Confirm `components/background/StarField.tsx` mounts a `<canvas>` with `fixed inset-0 -z-10` (already true from 001) and listens to `pointermove` on `window` (already true from 001); no edit expected — flag drift only
- [X] T021 [US4] Confirm `components/auth/AuthCard.tsx` no longer applies `backdrop-blur-xl` over a near-opaque surface that hides stars; if T009 lowered the alpha and used `backdrop-blur-md`, this is satisfied
- [X] T022 [US4] Manual verification of Test Scenarios 16, 17, 18

---

## Phase 7: Polish & Cross-Cutting

- [X] T023 [P] Manual responsive parity check at 360/768/1280/1920 px (Test Scenario 19)
- [X] T024 [P] Bundle-leak audit: `npm run build` and `Select-String -Path ".next/static/**/*.js" -Pattern "SUPABASE_SERVICE_ROLE_KEY" -SimpleMatch` returns zero matches (Test Scenario 20)
- [X] T025 [P] Confirm only `StarField`, `SignupForm`, `PasswordField`, `PasswordStrengthMeter` carry `"use client"`; no Google client island remains (Constitution IV, Test Scenario 3)
- [X] T026 [P] Confirm no per-component hex colours were introduced — every colour references a token in `app/globals.css` (Constitution II)
- [X] T027 [P] Final `npx tsc --noEmit` + `npm run lint` — both clean
- [X] T028 Update `specs/004-landing-redesign/walkthrough.md` per Constitution VIII (how to run, implemented features mapped to routes/components, desktop + mobile click-through, known gaps including the deferred name-capture in Phase 3)

---

## Dependencies & Execution Order

### Phase dependencies

- Phase 1 (Setup deletions) → no deps. Must run before Phase 3 to avoid broken imports.
- Phase 2 (Foundational) → after Phase 1; modifies the validator shape that US1 consumes.
- Phase 3 (US1) → after Phase 2; this phase contains every code rewrite for the sign-up surface.
- Phase 4 (US2), Phase 5 (US3), Phase 6 (US4) → all depend on US1 (US2/US4 verify behaviours of files US1 rewrites; US3 is independent file-wise but only meaningful after `/signup` works).
- Phase 7 (Polish) → after the user stories that ship.

### Within US1

- T007 (Server Action) and T008 (SignupForm) are co-dependent on the new `SignupInput` shape from T004/T005, so Phase 2 must precede.
- T008 imports `SignupForm` consumers ; T009 (AuthCard) is parallelizable with T007/T008.
- T010 (signup page) integrates the above — runs after T008 and T009.
- T011 (pill copy), T012 (signin banner) parallelizable with T010.
- T013 (typecheck/lint) gates T014 (manual verification).

### Parallel opportunities

- Phase 2: T004, T005, T006 all in parallel (all touch `lib/validation/signup.ts` or none — T004+T005 touch the same file so sequence them as one combined edit; T006 is read-only verification).
- Phase 3: T009 in parallel with T007/T008 (different files); T011, T012 in parallel with T010.
- Phase 7: T023–T027 all in parallel.

---

## Parallel Example: Phase 3 kickoff

```text
# Once Phase 2 is done, run in parallel:
Task: T007 — app/(auth)/_actions/signup.ts (Server Action)
Task: T008 — components/auth/SignupForm.tsx (form rewrite)
Task: T009 — components/auth/AuthCard.tsx (single label, translucent)
# Then T010 (app/signup/page.tsx) once T008/T009 are merged.
# T011 + T012 can run in parallel with T010.
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 deletions.
2. Phase 2 validator/type updates.
3. Phase 3 rewrites.
4. Manual verification of Scenarios 2, 4–12, 15.
5. Ship as the new MVP — supersedes 001's UI.

### Incremental delivery

1. MVP above.
2. Phase 4 — confirm in-card "Sign in" link (likely free from T008).
3. Phase 5 — root redirect.
4. Phase 6 — verify parallax + translucency (likely free from T009 + 001 carry-over).
5. Phase 7 — gates + walkthrough → merge.

### Coordination

- Specs 002 and 003 will be impacted (empty first_name/last_name from sign-up). Flag this in their `/speckit-plan` runs; do not edit 002/003 source from this feature branch.

---

## Notes

- This is largely a layout/scope rework on top of the 001 implementation. The bulk of the work lives in T007–T010.
- Avoid reintroducing constitution-forbidden elements: LinkedIn button, T&C checkbox, dark-theme leakage into dashboard pages.
- Do not introduce new dependencies. Tailwind v4 utilities + the existing token block are sufficient.

