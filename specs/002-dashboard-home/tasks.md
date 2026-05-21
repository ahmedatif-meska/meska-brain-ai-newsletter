# Tasks: Dashboard Home (`/home`)

**Feature**: Phase 2 — signed-in landing page at `/home` with greeting, Profile
Progress card, tagline, and top nav.

**Spec**: [./spec.md](./spec.md) · **Plan**: [./plan.md](./plan.md)

All three user stories in the spec are Priority **P1**. They share the route and
must ship together; within the phase they are independently testable (per spec)
once the foundational pieces exist.

---

## Phase 1 — Setup

- [X] T001 Verify `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (no file change; abort if missing)
- [X] T002 Add the dashboard surface token `--dashboard-surface: #ffffff` to the `:root` block in `app/globals.css` and expose it as `--color-dashboard-surface` inside `@theme inline` (do NOT modify existing Phase 1 tokens)

## Phase 2 — Foundational (blocks all user stories)

- [X] T003 Create the profile-completion contract module at `lib/profile/completion.ts` with `import "server-only"`, exporting `FormKey`, `ProfileCompletion`, and `getProfileCompletion(userId)` returning the Phase 2 stub `{ percent: 0, formsCompleted: { identity: false, bioLink: false, finalize: false } }` per `contracts/profile-completion.md`
- [X] T004 Create the sign-out Server Action at `app/_actions/signout.ts` (`"use server"`, `import "server-only"`): construct the SSR Supabase client, call `auth.signOut()`, then `redirect("/signin")`
- [X] T005 Create the `/home` route file at `app/home/page.tsx` as an `async` Server Component that calls `createSupabaseServerClient()`, `Promise.all([supabase.auth.getUser(), getProfileCompletion(user.id)])` (guarded by a null-user check that `redirect("/signin")`), and returns a placeholder layout (US1/US2/US3 tasks fill the children in)

## Phase 3 — User Story 1: Personalized greeting (P1)

**Story goal**: Signed-in user lands on `/home` and sees `Welcome back, {First}
{Last} 👋` rendered server-side from their stored name.

**Independent test**: Sign in with any account, observe routing to `/home`, verify
the greeting renders with the user's first/last name read from
`user_metadata.first_name` / `last_name`.

- [X] T006 [US1] Create a tiny helper `formatGreeting(first?: string, last?: string): string` at the top of `app/home/page.tsx` (or co-located) that returns `Welcome back, {trimmed-joined-name} 👋`, falling back to `Welcome back 👋` when both names are empty (per research R8)
- [X] T007 [US1] In `app/home/page.tsx`, read `user.user_metadata.first_name` and `user.user_metadata.last_name`, build the greeting via the helper, and render it as the page's only `<h1>` styled with the existing display font (`font-display`) plus `clamp()` sizing so mobile keeps the same line count as desktop (Principle III)
- [X] T008 [US1] Wrap the trailing `👋` emoji in `<span aria-hidden>` so screen readers don't announce "waving hand sign"

## Phase 4 — User Story 2: Profile Progress card (P1)

**Story goal**: Card centered below the greeting shows completion percentage with
the neon-blue progress bar, and either a "Complete Profile" CTA (< 100%) or a
"Profile complete ✓" confirmation (= 100%).

**Independent test**: Render `/home` with the completion stub temporarily flipped
to each of {0, 33, 66, 100} and verify the card matches FR-008 through FR-012.

- [X] T009 [P] [US2] Create `components/dashboard/ProfileProgressCard.tsx` as a Server Component accepting `{ completion: ProfileCompletion }`; render the card outer wrapper with a white surface, rounded corners, neon-blue circular person icon (Material Symbols `account_circle`), `<h2>Profile Progress</h2>` title, and the subtitle copy
- [X] T010 [US2] Inside `ProfileProgressCard.tsx`, render the `COMPLETION STATUS` label on the left and `{percent}%` on the right styled with neon-blue text (`color: var(--primary-deep)`)
- [X] T011 [US2] Inside `ProfileProgressCard.tsx`, render the horizontal progress bar — track `bg-zinc-200/60` (or a token equivalent), fill width `{percent}%` with `background: var(--neon-blue-gradient)` so it reuses the Phase 1 gradient (FR-023)
- [X] T012 [US2] Inside `ProfileProgressCard.tsx`, add the conditional CTA region: when `percent < 100`, render `<Link href="/profile">` styled as a full-width pill button with `var(--neon-blue-gradient)`, the person-with-plus icon (Material Symbols `person_add`), and label "Complete Profile"; when `percent === 100`, render the centered text `Profile complete ✓` instead (FR-010, FR-011) — explicitly do NOT render any per-form checklist (FR-012)
- [X] T013 [US2] In `app/home/page.tsx`, import and render `<ProfileProgressCard completion={completion} />` centered below the `<h1>` greeting using `max-w-md mx-auto`

## Phase 5 — User Story 3: Top navigation (P1)

**Story goal**: Every dashboard page renders a top nav with wordmark, Home tab,
Profile tab, and Sign Out — no left sidebar, no "Active ●" indicator.

**Independent test**: On `/home`, locate wordmark + Home + Profile + Sign Out;
click each (wordmark → `/home`, Profile → `/profile`, Sign Out → ends session +
routes to `/signin`).

- [X] T014 [P] [US3] Create `components/dashboard/SignOutButton.tsx` as a Client Component (`"use client"`) wrapping a `<form action={signOut}>` whose submit `<button>` is labeled "Sign Out" (collapses to icon-only `logout` Material Symbol with `aria-label="Sign out"` at ≤ 360px per research R6); import the `signOut` action from `@/app/_actions/signout`
- [X] T015 [US3] Create `components/dashboard/DashboardNav.tsx` as a Server Component that renders a single horizontal flex row across the top: `<Wordmark tone="light" />` linking to `/home` (left), two `<Link>` tabs (Home active with neon-blue underline, Profile to `/profile` inactive), a `flex-1` spacer, and `<SignOutButton />` on the right (FR-014 → FR-019)
- [X] T016 [US3] Ensure `DashboardNav` lays out without horizontal overflow at 360 × 800: gap values that compress on mobile, and explicit `whitespace-nowrap` on tab labels (Principle III)
- [X] T017 [US3] In `components/chrome/Wordmark.tsx`, confirm `tone="light"` still renders the text fallback used by the dashboard (no dark-tone logo asset exists yet); make no change beyond verifying behavior
- [X] T018 [US3] In `app/home/page.tsx`, import and render `<DashboardNav />` at the top of the page, above the `<main>` greeting + card + tagline column
- [X] T019 [US3] In `app/home/page.tsx`, render the tagline `<p>News built for you. Not for the feed.</p>` below the `<ProfileProgressCard>` (FR-013), with text color `--on-surface-variant`-equivalent (muted dark text on the white surface)

## Phase 6 — Polish & cross-cutting

- [X] T020 Walk `/home` at 390 × 844 AND 360 × 800 using the Claude in Chrome MCP (`resize_window` → `navigate` → screenshot): verify zero horizontal overflow, greeting line-count parity vs desktop, top nav fits without wrap, card fits with padding intact (Principle III v1.2.0)
- [X] T021 Walk `/home` at ≥ 1280 × 800: verify greeting + card centered with `max-w-3xl`, nav spans full width with all four elements visible (Principle III v1.2.0)
- [X] T022 Run `npx tsc --noEmit` and `npm run lint`; fix any errors introduced by the new files (no blanket ESLint disables)
- [X] T023 Verify edge cases from `spec.md`: (a) unauthenticated GET `/home` redirects to `/signin`, (b) Browser Back after Sign Out does NOT re-enter `/home`, (c) user with empty `last_name` renders `Welcome back, {first} 👋` without double-space, (d) manually flipping the stub to `percent: 100` swaps the CTA for `Profile complete ✓`
- [X] T024 Write `specs/002-dashboard-home/walkthrough.md` per constitution Principle VIII: how-to-run shell commands, implemented-features list mapped to FR-001..FR-024, manual verification steps for desktop AND mobile, known-gaps section noting that `getProfileCompletion` is stubbed and `/profile` is a Phase-3 404

---

## Dependencies

```
Phase 1 (T001 T002)
   └─▶ Phase 2 (T003 T004 T005)
         ├─▶ Phase 3 — US1 (T006 T007 T008)
         ├─▶ Phase 4 — US2 (T009 T010 T011 T012 T013)
         └─▶ Phase 5 — US3 (T014 T015 T016 T017 T018 T019)
                  └─▶ Phase 6 — Polish (T020 T021 T022 T023 T024)
```

Phases 3, 4, and 5 can be developed in parallel once Phase 2 lands — they touch
different files. The only point of contention is `app/home/page.tsx`, which all
three phases edit; T007 (US1), T013 (US2), and T018 + T019 (US3) must be
serialized through that single file (mark each as the integration step at the
end of its story).

## Parallel execution examples

- **Phase 2**: T003 and T004 are in different files with no shared imports — run in parallel.
- **Phase 4**: T009 is creation of `ProfileProgressCard.tsx`; T010–T012 are edits inside that same file → serialize. T013 is the integration step in `app/home/page.tsx` and depends on T012.
- **Phase 5**: T014 (`SignOutButton.tsx`) and T015 (`DashboardNav.tsx`) start in parallel; T015 then imports T014; T016 edits T015's file; T017 only verifies an existing file; T018 + T019 integrate in `app/home/page.tsx` after the other Phase 5 work lands AND after US2's T013.

## Implementation strategy (MVP-first)

1. Land **Phase 1 + Phase 2** first — gives the route a server-rendered skeleton that doesn't 404 and enforces auth.
2. Land **US1** (greeting) next — single-file change in `app/home/page.tsx`; immediately verifiable.
3. Land **US2** (card) — the biggest piece visually but isolated to `ProfileProgressCard.tsx` until the integration step.
4. Land **US3** (nav + tagline + Sign Out) last — depends on the Server Action from Phase 2 and pulls everything together.
5. **Phase 6 polish** is the gate to "done" — without the mobile-fit walkthrough and `walkthrough.md`, the phase ships incomplete.

---

## Format validation

All tasks above start with `- [ ]`, include a sequential `T###` ID, carry the
`[US#]` label when inside a user-story phase, and name an exact file path. The
`[P]` marker is used only on the first task of US2 and US3 because everything
else in those stories either depends on a prior task or edits the same file as
one. Total task count: **24**.
