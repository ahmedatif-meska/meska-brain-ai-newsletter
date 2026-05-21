# Plan: Vercel Production Deployment

**Branch**: `005-vercel-deploy` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-vercel-deploy/spec.md`

## Summary

Ship the Phase 1 Meska Brain app (signup, signin, password reset) to Vercel as the
production hosting platform. The deploy is the work — there is no new user-facing
feature. Concretely: connect the GitHub repo to a Vercel project, configure three
Supabase secrets per environment (prod/preview/dev), align Supabase's Site URL +
Redirect Allow-list with the production origin, prove the auth flows work
end-to-end against the live URL, and harden `next.config.ts` for production
(remove dev-only Turbopack flag, add HSTS / nosniff / Referrer-Policy headers).
Preview deployments are gated by `npm run lint`, `npx tsc --noEmit`, and
`next build`; `main` promotes to production only when the build passes.

## Technical Context

**Language/Version**: TypeScript ^5 (strict), React 19.2.4, Next.js 16.2.6 (App
Router, RSC-first, React Compiler on via `babel-plugin-react-compiler`).

**Primary Dependencies**: `@supabase/supabase-js ^2.106.1`, `@supabase/ssr
^0.10.3`, `server-only ^0.0.1`, Tailwind v4 via `@tailwindcss/postcss`.

**Storage**: Supabase Cloud (Auth + Postgres). No application-managed storage.

**Testing**: No test runner installed yet — verification is manual via the
quickstart in this plan and `walkthrough.md` post-implementation. (Future spec
should add Playwright or Vitest; not in scope here.)

**Target Platform**: Vercel — Next.js runtime auto-detected. Server actions and
the `/auth/callback` route run on the **Node.js runtime** (not Edge) because
`@supabase/ssr` writes session cookies via `next/headers`, which the Edge runtime
does not support in the way this code uses it.

**Project Type**: Web application (single Next.js project; no separate backend).

**Performance Goals**: Lighthouse perf ≥ 90 and a11y ≥ 95 on `/signup` desktop;
no measurable regression from local dev to production for FCP on a 4G profile.

**Constraints**: Three environment-scoped Supabase secrets; service-role key MUST
remain server-only; no third-party analytics added in this work; the dark-sky
+ starfield theme is preserved without leakage to dashboard pages (Principle II).

**Scale/Scope**: Launch-day estimate is < 1,000 sessions/day. Vercel's Hobby tier
function and bandwidth limits are comfortably above this; the Pro tier is
recommended only if/when team collaboration on Vercel is needed.

## Constitution Check

Reviewed against `.specify/memory/constitution.md` v1.2.0.

| Principle | Status | Notes |
|---|---|---|
| I. Spec-Driven Development (NON-NEGOTIABLE) | PASS | This plan, the spec, and the tasks file follow the Spec Kit pipeline; `meska-brain-plan.md` does not specify hosting, so no conflict. |
| II. Design Fidelity to Plan (NON-NEGOTIABLE) | PASS | Deployment changes no design tokens or component layout. |
| III. Responsive Parity — Web and Mobile (NON-NEGOTIABLE) | PASS (verification required) | Production smoke-test MUST exercise `/signup`, `/signin`, `/reset-password`, `/update-password` at 390 × 844, 360 × 800, and ≥ 1280px on the live URL. Walkthrough records the results. |
| IV. React/Next.js Performance Discipline | PASS | `reactCompiler: true` retained. No new client components introduced; existing `"use client"` boundaries unchanged. |
| V. Privacy, Auth, and Data Integrity (NON-NEGOTIABLE) | PASS | Service-role key stays in `SUPABASE_SERVICE_ROLE_KEY`, consumed only by `lib/supabase/admin.ts` (`import "server-only"`). Allow-listed redirect URLs and Site URL aligned with production origin. RLS posture unchanged. |
| VI. Validation Discipline | PASS | No form changes. |
| VII. Channel-Aware Delivery | N/A | Phase 1 only; channel selection is Phase 2. |
| VIII. Artifact Structure & Walkthroughs (NON-NEGOTIABLE) | PASS | This plan follows the Phase → User Story → Acceptance Criteria → Test Scenarios structure. `walkthrough.md` will be produced after `/speckit-implement`. |

**Gate result**: PASS. No violations; no entries in Complexity Tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/005-vercel-deploy/
├── plan.md              # This file
├── spec.md              # Feature spec
├── research.md          # Phase 0 — Vercel + Supabase + next.config.ts decisions
├── data-model.md        # Phase 1 — env vars, allow-list, deployment entities
├── quickstart.md        # Phase 1 — step-by-step deploy runbook
├── contracts/
│   ├── env-vars.md      # Required env vars per environment with types/scopes
│   └── supabase-auth.md # Required Site URL + Redirect Allow-list entries
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Produced by /speckit-tasks (not by this command)
```

### Source Code (repository root)

No new app source directories. Affected files only:

```text
next.config.ts            # Update: remove dev-only experimental flag; add headers()
.env.example              # New: documents the three required env var names (no values)
specs/005-vercel-deploy/  # New artifacts above
```

**Structure Decision**: Single Next.js project, App Router, no monorepo split. The
deploy is configuration + infra, not new code, so the existing structure stands.

## Phase 0 — Research & Configuration Decisions

### User Story 0.1: As the maintainer, I want a single documented decision record for every Vercel/Supabase/next.config choice so that future contributors don't reverse them by accident.

- Description: Produce `research.md` capturing decisions (with rationale and
  alternatives) for: Vercel project setup, environment scoping, runtime choice
  (Node vs Edge) for auth routes, preview deployment indexing posture, security
  headers, `next.config.ts` cleanup, and Supabase Auth URL configuration.

### Acceptance Criteria (for the phase)

- `research.md` exists at `specs/005-vercel-deploy/research.md`.
- Every "NEEDS CLARIFICATION" implicit in the spec's Assumptions section is
  resolved — specifically:
  - Decision on `experimental.turbopackFileSystemCacheForDev`.
  - Decision on Node vs Edge runtime for `/auth/callback` and server actions.
  - Decision on how preview deployments are protected from indexing.
  - Decision on which security headers ship in production.
- Each decision in `research.md` lists at least one rejected alternative.
- No `[NEEDS CLARIFICATION]` markers remain anywhere in the feature directory.

### Test Scenarios (for the phase)

1. **Given** a fresh reader opens `research.md`, **When** they look up the dev-only
   Turbopack flag, **Then** they see the decision (remove from prod config),
   the rationale (it affects only `next dev`), and at least one alternative
   considered (keep + gate on `NODE_ENV`).
2. **Given** the reviewer searches the feature directory, **When** they grep for
   `NEEDS CLARIFICATION`, **Then** zero matches are returned.
3. **Given** the runtime decision section, **When** the reviewer reads it,
   **Then** the document explicitly states that `/auth/callback`, `(auth)/_actions/*`,
   and `/update-password` run on Node.js and explains why Edge is rejected.

## Phase 1 — Design Artifacts

### User Story 1.1: As the maintainer, I want a precise, copy-pasteable list of every environment variable and Supabase Auth URL setting so that I can configure Vercel and Supabase without guessing.

- Description: Produce `data-model.md` (the conceptual entities: Environment,
  Deployment, Redirect Allow-list Entry, plus the env-var table), and
  `contracts/env-vars.md` + `contracts/supabase-auth.md` (the literal values, with
  placeholders for the unknown production hostname).

### User Story 1.2: As a contributor seeing the repo for the first time, I want a `quickstart.md` that walks me from "I have a Vercel account" to "I clicked the production URL and signed up" in under 15 minutes.

- Description: Produce `quickstart.md` covering: connect repo → set env vars →
  attach custom domain (optional) → set Supabase Site URL + Redirect Allow-list
  → push to `main` → verify the four mobile widths → roll back drill.

### Acceptance Criteria (for the phase)

- `data-model.md`, `quickstart.md`, `contracts/env-vars.md`, and
  `contracts/supabase-auth.md` exist under the feature directory.
- `contracts/env-vars.md` lists each variable with: name, scope
  (production/preview/development), client-exposed (yes/no), required (yes/no),
  source of value, and how to rotate.
- `contracts/supabase-auth.md` lists each required Redirect Allow-list entry as
  a fully-qualified URL pattern and names the Site URL value.
- `quickstart.md` is a numbered sequence; each step has a verification check the
  reader can perform before moving on.
- `CLAUDE.md` `<!-- SPECKIT START -->` block points at `specs/005-vercel-deploy/plan.md`.
- Constitution re-check after design produces the same PASS verdict as Phase 0
  (no new violations introduced).

### Test Scenarios (for the phase)

1. **Given** a contributor who has never touched Vercel, **When** they follow
   `quickstart.md` step-by-step against a throwaway Vercel project, **Then** they
   reach a working preview URL with signup completing successfully in under
   15 minutes.
2. **Given** `contracts/env-vars.md`, **When** the reviewer cross-checks every
   `process.env.*` and `import.meta.env.*` reference in the repo,
   **Then** every variable in the code appears in the contract and every
   variable in the contract is consumed somewhere in the code.
3. **Given** `contracts/supabase-auth.md`, **When** the reviewer opens Supabase
   → Authentication → URL Configuration in the dashboard, **Then** every entry in
   the contract is present and no extra entries exist for environments that no
   longer exist.

## Phase 2 — Build Configuration & Headers

### User Story 2.1: As the maintainer, I want `next.config.ts` cleaned up so that production builds don't ship dev-only flags and HTML responses set basic security headers.

- Description: Update `next.config.ts` to (a) move
  `experimental.turbopackFileSystemCacheForDev` behind a `process.env.NODE_ENV
  === "development"` check or remove it entirely, and (b) add an `async headers()`
  function returning `Strict-Transport-Security`, `X-Content-Type-Options:
  nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` for all routes.

### User Story 2.2: As a deploy reviewer, I want a `.env.example` file checked in so that contributors know exactly which secrets are needed without me having to tell them.

- Description: Add `.env.example` with the three variable names and short
  comments — no values. Add it to git but ensure `.env*.local` patterns remain
  in `.gitignore`.

### Acceptance Criteria (for the phase)

- `next.config.ts` builds cleanly under `npm run build` with no warnings about
  unknown or deprecated options.
- `next.config.ts` does NOT include any flag that is documented in Next.js docs
  as "development only".
- The deployed production response for `/signup` includes the three required
  headers (verifiable with `curl -I`).
- `.env.example` exists at repo root, lists `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` with comments,
  and contains no real secret values.
- `npm run lint` and `npx tsc --noEmit` both pass after the changes.

### Test Scenarios (for the phase)

1. **Given** the updated `next.config.ts`, **When** the maintainer runs
   `npm run build`, **Then** the build completes without warnings and the output
   is a normal (non-`standalone`) Next.js production bundle.
2. **Given** the deployed production URL, **When** the maintainer runs
   `curl -I https://<prod-host>/signup`, **Then** the response includes
   `strict-transport-security`, `x-content-type-options: nosniff`, and
   `referrer-policy: strict-origin-when-cross-origin`.
3. **Given** a contributor cloning the repo for the first time, **When** they
   copy `.env.example` to `.env.local` and fill in the three values from
   Supabase, **Then** `npm run dev` boots and `/signup` works end-to-end locally.

## Phase 3 — Vercel Project + Supabase Alignment

### User Story 3.1: As the maintainer, I want the GitHub repo connected to a Vercel project with the three Supabase env vars set per environment so that pushing to `main` deploys to a stable production URL.

- Description: Through the Vercel dashboard (no code change), create the
  project, link it to this repository, set the three env vars in
  Production / Preview / Development scopes, and confirm the first production
  deployment turns green.

### User Story 3.2: As the maintainer, I want Supabase Auth's Site URL and Redirect Allow-list updated to match the production origin so that password reset emails route users back to the live site rather than localhost.

- Description: In Supabase Studio → Authentication → URL Configuration, set the
  Site URL to the production origin and add the production
  `/auth/callback` URL (plus one shared preview pattern) to the allow-list.

### User Story 3.3: As a maintainer worried about indexed previews, I want preview deployments protected from search engines and casual visitors so that a half-finished feature doesn't leak.

- Description: Enable Vercel's Deployment Protection (Vercel Authentication) for
  Preview environments only. Production remains public.

### Acceptance Criteria (for the phase)

- A Vercel project exists, linked to this repository, with the three Supabase
  env vars set independently for Production, Preview, and Development.
- The most recent commit on `main` has a green production deployment with a
  unique URL.
- Pushing any non-`main` branch produces a preview deployment with its own URL
  within 3 minutes of the push.
- Supabase Auth Site URL equals the production origin.
- Supabase Auth Redirect Allow-list contains `https://<prod-host>/auth/callback`
  and `https://*-<vercel-team>.vercel.app/auth/callback` (or equivalent preview
  pattern).
- Preview deployments require Vercel SSO / link-based access to be opened.

### Test Scenarios (for the phase)

1. **Given** a merge to `main`, **When** Vercel runs the build, **Then** within
   5 minutes the production URL serves the new commit.
2. **Given** a feature branch push, **When** the maintainer opens the PR,
   **Then** the Vercel preview URL is posted as a check and renders the change.
3. **Given** the production deployment, **When** a tester requests a password
   reset from `/reset-password`, **Then** the email arrives within 60 seconds,
   its link host equals the production origin, the link loads `/update-password`
   with an authenticated session, and submitting a new password returns the
   tester to `/signin?pwreset=1`.
4. **Given** an unauthenticated visitor pastes a preview URL, **When** they load
   it, **Then** Vercel's Deployment Protection blocks the page until they
   authenticate with the maintainer's Vercel team.

## Phase 4 — Production Smoke Test & Rollback Drill

### User Story 4.1: As the maintainer, I want a recorded smoke test against the production URL on mobile and desktop widths so that mobile-fit (Principle III) is verified on the real deployment, not just locally.

- Description: After the first production deployment is live, exercise signup,
  signin, password reset, and `/update-password` on 390 × 844, 360 × 800, and
  ≥ 1280px viewports. Capture screenshots and note any visual regressions.

### User Story 4.2: As the maintainer, I want to know I can roll back a bad deploy in under 2 minutes so that a future regression doesn't become an outage.

- Description: From the Vercel dashboard, promote the immediately-previous
  production deployment back to current. Record the elapsed time.

### Acceptance Criteria (for the phase)

- `walkthrough.md` exists at `specs/005-vercel-deploy/walkthrough.md` and
  contains: how to run, implemented features, manual verification (mobile +
  desktop), and known gaps (Principle VIII).
- The mobile smoke test recorded zero horizontal scrollbars on any of the four
  pages at 390 × 844 and 360 × 800 (Principle III).
- The rollback drill completed in under 2 minutes and the URL is documented in
  the walkthrough.

### Test Scenarios (for the phase)

1. **Given** the live production URL on a real iPhone-14-sized viewport,
   **When** the tester scrolls through `/signup`, **Then** no horizontal scroll
   bar appears and the headline holds 2 lines.
2. **Given** the maintainer triggered the rollback drill, **When** they reload
   the production URL after promotion, **Then** the previous commit's content is
   served and the elapsed wall-clock is < 2 minutes from "click rollback" to
   "served".
3. **Given** the completed walkthrough, **When** a second reviewer follows it
   end-to-end on the production URL, **Then** every numbered step passes
   without modification.

## Complexity Tracking

No constitution violations to justify. Table intentionally empty.
