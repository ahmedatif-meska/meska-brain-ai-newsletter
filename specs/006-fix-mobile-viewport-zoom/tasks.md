# Tasks: Fix Mobile Viewport Zoom on Authenticated Pages

**Feature**: 006-fix-mobile-viewport-zoom
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Branch**: `006-fix-mobile-viewport-zoom`

## Story → Task Map

- **US1 (P1)** — Mobile sign-in lands on a perfectly-fitted dashboard
- **US2 (P1)** — All authenticated routes behave consistently
- **US3 (P2)** — Public/unauthenticated pages remain unaffected

No test runner is installed; verification tasks use the Claude-in-Chrome MCP path mandated by Constitution Principle III.

---

## Phase 1 — Setup

- [ ] T001 Confirm `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (no edit; abort if missing) in D:\meska-brain-ai-newsletter\.env.local
- [ ] T002 Capture baseline screenshots of the current bug at 360 × 800 and 390 × 844 for `/home` and `/profile` (signed-in) and store them under specs/006-fix-mobile-viewport-zoom/_baseline/ for before/after comparison

## Phase 2 — Foundational

No foundational/blocking work is required — this is a single-file meta change with no shared schema or scaffolding.

---

## Phase 3 — User Story 1: Mobile sign-in lands on a perfectly-fitted dashboard (P1)

**Goal**: Replace the UA-sniffed `generateViewport()` in the root layout with a static `viewport` export that pins `initial-scale=1`, so the home dashboard renders at natural scale on mobile.

**Independent test (per spec)**: Sign in on a 390 × 844 viewport. The home dashboard must render with zero horizontal overflow, no clipped right-edge element, and no pinch-zoom required.

- [X] T003 [US1] Edit app/layout.tsx — remove the `generateViewport()` async function and remove the `import { headers } from "next/headers"` line; export a static `export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };` in D:\meska-brain-ai-newsletter\app\layout.tsx
- [X] T004 [US1] Run `npx tsc --noEmit` from the repo root and confirm zero TypeScript errors after the edit
- [X] T005 [US1] Run `npm run lint` (only pre-existing `@next/next/google-font-display` warning remains — unrelated to this change) and confirm no new ESLint warnings introduced by the edit
- [ ] T006 [US1] Start the dev server (`npm run dev`) in D:\meska-brain-ai-newsletter\
- [ ] T007 [US1] Using Claude-in-Chrome MCP: `resize_window` to 390 × 844, `navigate` to http://localhost:3000/signin, sign in with the test user, and screenshot the `/home` redirect target — verify natural-scale rendering, no horizontal overflow, no clipped element on the right edge
- [ ] T008 [US1] Repeat the verification from T007 at 360 × 800 — confirm the same pass criteria on the smallest supported mobile viewport

## Phase 4 — User Story 2: All authenticated routes behave consistently (P1)

**Goal**: Confirm the same fix applies cleanly to every other authenticated route (currently `/profile`); patch `components/dashboard/DashboardNav.tsx` only if residual overflow is observed.

**Independent test (per spec)**: Each authenticated route renders at natural scale with zero horizontal overflow at 360 px and 390 px.

- [ ] T009 [P] [US2] At 390 × 844, navigate to http://localhost:3000/profile and screenshot — verify natural-scale rendering, no horizontal overflow, no clipped nav element
- [ ] T010 [P] [US2] At 360 × 800, repeat the `/profile` verification from T009
- [ ] T011 [US2] If T009 or T010 shows residual overflow, edit components/dashboard/DashboardNav.tsx to shrink horizontal padding or gap on the smallest breakpoint (e.g., `gap-1 px-3` instead of `gap-1 px-4`) in D:\meska-brain-ai-newsletter\components\dashboard\DashboardNav.tsx — otherwise mark as N/A and skip
- [ ] T012 [US2] If T011 was applied, re-verify T009 and T010 to confirm the fix and capture updated screenshots

## Phase 5 — User Story 3: Public/unauthenticated pages remain unaffected (P2)

**Goal**: Confirm that switching the viewport meta from UA-sniffed 0.9 to static 1.0 does not regress any public page.

**Independent test (per spec)**: All four public pages render at parity with their pre-fix behavior at every supported viewport.

- [ ] T013 [P] [US3] At 390 × 844, navigate to and screenshot `/signin` — confirm parity with pre-fix layout (no clipping, no zoom mismatch)
- [ ] T014 [P] [US3] At 390 × 844, navigate to and screenshot `/signup` — same parity check
- [ ] T015 [P] [US3] At 390 × 844, navigate to and screenshot `/reset-password` — same parity check
- [ ] T016 [P] [US3] At 390 × 844, navigate to and screenshot `/terms` — same parity check
- [ ] T017 [P] [US3] At 360 × 800, repeat the four public-page checks (T013–T016)

## Phase 6 — Polish & Cross-Cutting Concerns

- [ ] T018 [P] At 1280 × 800, navigate to each route (`/signin`, `/signup`, `/terms`, `/reset-password`, `/home`, `/profile`) and confirm desktop rendering is visually identical to pre-fix (SC-005)
- [ ] T019 [P] At 1440 × 900, repeat the desktop sweep from T018
- [ ] T020 Manually verify on a real mobile device (or iOS Simulator) that user pinch-zoom still works on `/home` and `/profile` (FR-005, SC-006)
- [ ] T021 Verify the `<meta name="viewport">` tag in the rendered HTML head emits exactly `width=device-width, initial-scale=1, viewport-fit=cover` — use Chrome DevTools "View Source" or `curl` against the dev server and grep the head
- [X] T022 Write the post-implementation walkthrough at specs/006-fix-mobile-viewport-zoom/walkthrough.md documenting: root cause confirmation, before/after screenshots, files changed, verification matrix completed — per Constitution Principle VIII
- [X] T023 Update learning.md with the entry "UA-sniffed `generateViewport()` with `initial-scale < 1` inflates the CSS viewport and breaks mobile-first breakpoints — always use a static `initial-scale=1` viewport export" in D:\meska-brain-ai-newsletter\learning.md

---

## Dependencies

```text
Phase 1 (T001, T002)
   ↓
Phase 3 (US1: T003 → T004 → T005 → T006 → T007 → T008)
   ↓
Phase 4 (US2: T009, T010 in parallel → T011 if needed → T012)
   ↓
Phase 5 (US3: T013–T016 in parallel → T017)
   ↓
Phase 6 (T018, T019 in parallel; T020, T021 sequential; T022 → T023)
```

**Story independence**: US1 must precede US2 and US3 because the viewport edit (T003) is the shared root cause; US2 and US3 are independent of each other and can be verified in parallel.

## Parallel Execution Opportunities

- T009 ∥ T010 (different viewport screenshots of the same route)
- T013 ∥ T014 ∥ T015 ∥ T016 (different public routes at 390 px)
- T018 ∥ T019 (different desktop viewports)

## Implementation Strategy (MVP)

**MVP scope** = US1 only (T001 → T008). Completing just US1 ships the fix for the most-impacted screen (the post-login home dashboard) and validates the approach. US2 and US3 are verification-heavy and add confidence but do not block the user-visible fix.

Recommended order:

1. Ship MVP (US1) — single one-line meta change + 360/390 verification.
2. Layer in US2 (other authenticated routes) — likely no code edit, just verification.
3. Layer in US3 (public-page regression check) — pure verification.
4. Polish (Phase 6) — desktop sweep, pinch-zoom check, walkthrough, learning.md.

## Format Validation

All 23 tasks above use the required format: `- [ ] T### [P?] [Story?] Description with file path`. Setup, Foundational, and Polish tasks omit story labels; US1/US2/US3 tasks include them. Parallel-eligible tasks carry `[P]`. Every task references the file or route it touches.
