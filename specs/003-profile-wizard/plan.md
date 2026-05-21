# Plan: Profile Wizard (`/profile`)

**Branch**: `004-landing-redesign` (active) | **Date**: 2026-05-21 | **Spec**: [./spec.md](./spec.md)

**Input**: Feature specification at `specs/003-profile-wizard/spec.md`

## Summary

Phase 3 of the Meska Brain plan: the three-step onboarding wizard at `/profile`
(Identity → Bio-Link → Finalize) that captures personalization data and drives the
completion percentage shown on `/home`. The wizard always restarts at Form 1 on
sign-in (per spec). Form 1 updates the user record's first/last name (used by the
`/home` greeting — already wired) and persists WhatsApp / referral / LinkedIn.
Form 2 captures curation pills + delivery (language + channel). Form 3 stores an
optional free-text intelligence-sync response, marks the profile 100% complete,
and shows a one-shot congratulations screen with confetti.

Persistence moves from "stub returning 0" (Phase 2) to real Supabase tables; the
existing `getProfileCompletion()` contract (`lib/profile/completion.ts`) is the
only interface `/home` cares about — its implementation flips to read these tables.

## Technical Context

| | |
|---|---|
| Language / Version | TypeScript 5, React 19.2, Next.js 16.2.6 (App Router) |
| Primary Dependencies | `@supabase/ssr`, `@supabase/supabase-js`, Tailwind CSS v4. No new runtime deps — confetti via CSS keyframes, not a library. |
| Storage | Supabase Cloud — three new tables (`profile_identity`, `profile_curation`, `profile_finalize`). All with RLS policies restricting each row to its owning user (Principle V). |
| Testing | Manual verification per Principle III walkthrough; no automated runner installed yet. |
| Target Platform | Modern browsers (Chromium, Safari 16+, Firefox); mobile-first (≥ 360px). |
| Project Type | Web app (Server Components + Server Actions + tight client islands for pill toggles, clipboard, confetti). |
| Performance Goals | First contentful render of `/profile` < 1.5s on broadband; SC-001: full wizard end-to-end < 5 min. |
| Constraints | RSC-first (Principle IV); submit-only validation (Principle VI); session validated server-side (Principle V); mobile-fit (Principle III v1.2.0). |
| Scale / Scope | Three forms + congratulations screen, ~7 new components, 3 Server Actions, 1 SQL migration, 1 contract-implementation swap. |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-Phase 1.*

| Principle | Status | Notes |
|---|---|---|
| I. Spec-Driven Development | ✓ | Spec exists at `specs/003-profile-wizard/spec.md`; plan flows /speckit-plan → /speckit-tasks → /speckit-implement. |
| II. Design Fidelity | ✓ | White dashboard surface + neon-blue accent gradient (`var(--neon-blue-gradient)`). No LinkedIn social-auth, no left sidebar, no "Active ●" dot, no email-verify checkbox, no "Add Topic" affordance. Step indicator: neon-blue for active/completed, gray for pending. |
| III. Responsive Parity (mobile-fit) | ✓ planned | Wizard card uses `max-w-2xl` with `clamp()` titles; pill rows wrap; topics chip grid is `grid-cols-2 sm:grid-cols-3`; delivery sub-card scrolls cleanly at 360px. Verify per phase walkthrough. |
| IV. RSC-first | ✓ | `/profile/page.tsx` is a Server Component that reads any saved values and renders an `<ProfileWizard>` client island only for the step-state + pill-toggle UX. Server Actions handle saves; no client-side Supabase calls. |
| V. Privacy / Auth | ✓ | Session validated on every request to `/profile`. New tables have RLS allowing read/write only when `user_id = auth.uid()`. No application-layer encryption; Form 3 response stored as plain text per spec FR-040 + Assumption. |
| VI. Submit-only validation | ✓ | All validators run on Next/Submit click only — never on type, never on blur. The Form 3 response textarea is unvalidated entirely. The Phase 1 password strength meter is unrelated to this phase. |
| VII. Channel-aware delivery | ✓ | Form 2 captures `language` (`english` / `arabic` / `both`) and `channel` (`whatsapp` / `telegram` / `email`) as first-class fields on `profile_curation`. "Both" persists as the literal value `both`. |
| VIII. Artifact Structure | ✓ | This plan + research.md + data-model.md + contracts/ + quickstart.md generated here. walkthrough.md follows /speckit-implement. |

**Gate verdict**: PASS — no violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-profile-wizard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── profile-page.md
│   ├── server-actions.md
│   └── supabase-schema.md
└── tasks.md            # /speckit-tasks output
```

### Source code (repository root)

New files:

```text
app/
└── profile/
    ├── page.tsx                          # Server Component: session + read saved forms
    └── _wizard/
        ├── ProfileWizard.tsx             # Client: step state, navigation between forms
        ├── StepIndicator.tsx             # Server: Identity → Bio-Link → Finalize circles
        ├── Form1Identity.tsx             # Client: pill inputs + submit
        ├── Form2Curation.tsx             # Client: pill selectors + topics chip grid
        ├── Form3Finalize.tsx             # Client: code-block, copy button, textarea
        ├── CongratulationsScreen.tsx     # Client: one-shot confetti + Go to Home
        └── Confetti.tsx                  # Client: CSS-keyframe confetti island

app/_actions/
├── save-identity.ts                      # Server Action: persist Form 1
├── save-curation.ts                      # Server Action: persist Form 2
└── save-finalize.ts                      # Server Action: persist Form 3, mark 100%

lib/profile/
├── completion.ts                         # MODIFIED: read real tables, return real percent
├── schema.ts                             # Shared types & enums (referral source, AI usage, …)
└── validators.ts                         # E.164, LinkedIn regex, exactly-3 topics, etc.

supabase/migrations/
└── 0001_profile_tables.sql               # CREATE TABLE + RLS policies for the 3 tables
```

Files modified:

```text
components/chrome/Wordmark.tsx            # No change — already accepts href prop (Phase 2)
CLAUDE.md                                  # SPECKIT marker → specs/003-profile-wizard/plan.md
```

**Structure Decision**: The wizard lives at a single route `/profile` with internal
step state (no `/profile/identity`/`/profile/curate`/etc.) because step state is
ephemeral per session per spec FR-009 — the wizard always restarts at Form 1 on
sign-in. Persistent per-form data lives in Supabase and is reloaded into the form
fields when the user revisits a form. The `_wizard/` subfolder uses Next.js's
underscore prefix to keep its children out of the route table — they are internal
building blocks.

The `_actions/` folder created in Phase 2 is reused; three new Server Actions
co-locate alongside `signout.ts`.

## Complexity Tracking

No constitution violations; nothing to justify. The wizard introduces several
client components (pill toggles, clipboard, confetti) but each is the minimum
surface needed for the interactivity the spec requires; the page shell, step
indicator, and any data reads remain server-rendered.
