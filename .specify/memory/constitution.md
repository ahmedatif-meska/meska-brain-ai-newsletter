<!--
Sync Impact Report
==================
Version change: 1.1.0 → 1.2.0
Bump rationale: MINOR — materially expands Principle III (Responsive Parity) to make
mobile-fit a strict, blocking gate for EVERY page and EVERY component, with explicit
zero-horizontal-overflow, no-wrap-regression, and verify-before-merge rules. No
principle was removed; new guidance was added.

Modified principles: III. Responsive Parity — Web and Mobile (tightened)
Added sections: none (expanded within Principle III)
Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md ⚠ pending — Constitution Check should call
    out the mobile-fit verification step explicitly.
  - CLAUDE.md ✓ updated in same change — surfaces the mobile-fit rule.

Prior reports preserved below for history:
  - v1.1.0 (2026-05-20): added Principle VIII (Artifact Structure & Walkthroughs).
  - v1.0.0 (2026-05-20): initial ratification with seven NON-NEGOTIABLE principles.
-->

# Meska Brain Constitution

Meska Brain is a hyper-personalized AI news and articles delivery service. Members
complete a 3-form profile (Identity → Bio-Link → Finalize) and receive content tailored
to them via their preferred channel (WhatsApp, Telegram, or Email). The product is
defined in `meska-brain-plan.md`. This constitution is the non-negotiable contract that
governs how the product is specified, designed, built, and shipped.

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

Every feature MUST flow through the Spec Kit pipeline: `/speckit-specify` →
`/speckit-clarify` (when ambiguous) → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`. Code MUST NOT be written for a feature before its spec, plan, and
tasks artifacts exist and are consistent. `meska-brain-plan.md` is the authoritative
product brief; specs MUST cite the phase/section they implement and MUST NOT contradict
it without an explicit amendment.

Rationale: The product is multi-phase (sign-up, dashboard, profile wizard) with tight
visual and behavioral requirements. Spec-first prevents drift and rework.

### II. Design Fidelity to Plan (NON-NEGOTIABLE)

CSS, colors, gradients, typography, spacing, iconography, and component shapes MUST
match `meska-brain-plan.md` exactly. The shared neon-blue gradient (used on the Phase 1
"Sign up" button and headline accent, the Phase 2 progress bar and "Complete Profile"
button, and every Phase 3 primary action) is a single design token reused everywhere —
it MUST NOT be re-defined per page. The Phase 1 dark starry sky + blue mesh glow is
scoped to `/signup` and `/signin`; Phase 2/3 dashboard pages MUST use the white +
neon-blue accent theme with no dark-theme leakage. The dark left sidebar shown in
reference images is removed; the top nav (Meska Brain wordmark / Home / Profile / Sign
Out) is the only dashboard chrome.

Rationale: The plan specifies pixel-level expectations and reference images. Any
"close enough" interpretation produces inconsistency users will see immediately.

### III. Responsive Parity — Web and Mobile (NON-NEGOTIABLE)

**Every page AND every component MUST fit the mobile viewport.** This is a strict,
blocking gate — no page or component ships if it fails mobile fit. Concretely:

1. **Zero horizontal overflow** at 390 × 844 (iPhone 14) and 360 × 800 (smallest
   commonly-supported Android). `document.body.scrollWidth` MUST equal
   `window.innerWidth` — no horizontal scroll bar, ever.
2. **No clipped or cut-off content**: no element may render off-screen, behind a fixed
   nav, or with truncated text that isn't intentional `text-overflow: ellipsis`.
3. **No awkward wraps**: pills, buttons, tab strips, badges, and single-line labels
   MUST stay on one line on mobile (use `whitespace-nowrap`, shorter copy, or smaller
   `text-[10px]`-class sizing as needed). Multi-line text blocks (hero headlines,
   card subtitles, helper lines) MUST preserve their line count across viewports —
   if the hero is 2 lines on desktop it MUST stay 2 lines on mobile, not 3+.
4. **Touch targets** for interactive elements MUST be ≥ 44 × 44 px on mobile.
5. **Forms** MUST be fully usable on mobile: inputs fit the viewport, keyboards don't
   obscure the submit button, error messages remain visible.
6. **Mobile-first responsive defaults**: write mobile styles as the base and use
   `sm:`/`md:`/`lg:` Tailwind prefixes to scale UP for larger viewports — not the
   reverse. Components MUST NOT assume desktop width.
7. **Fixed widths in pixels are forbidden** on top-level layout containers. Use
   `max-w-*`, `w-full`, `clamp()`, or fluid utilities so containers shrink to fit.
8. **Every PR touching UI MUST be verified at ≤ 390px AND ≥ 1280px before merge.**
   Verification means actually loading the route in a browser (Claude in Chrome
   extension or a desktop browser's responsive mode) — TypeScript and ESLint passing
   is NOT a substitute. The PR description MUST note the verification was done.

This rule applies to **every** new page, every new component, every edit to an
existing page or component, and every Spec Kit feature. A walkthrough.md (Principle
VIII) is incomplete if its manual verification steps do not include mobile width.

Rationale: User input states this is non-negotiable. Newsletter sign-up funnels are
heavily mobile-traffic; one cramped pill or off-screen button costs members
immediately. The mobile-fit gate must be strict because it is the single most common
regression in iterative UI work.

### IV. React/Next.js Performance Discipline

Implementation MUST follow the rules in
`.claude/skills/vercel-react-best-practices/SKILL.md` and its `rules/` directory.
Concretely: prefer Server Components by default; mark Client Components (`"use client"`)
only when interactivity or browser APIs require it; use Suspense + streaming for
data-dependent sections; co-locate data fetching with the component that needs it;
avoid client-side waterfalls; keep bundles lean (no large client-only libraries when a
server-rendered equivalent exists). The animated starry background, password strength
meter, copy-to-clipboard, and confetti animation are explicit Client Component
boundaries — everything else SHOULD default to server.

Rationale: The app is content-and-form heavy with a few interactive islands; an
RSC-first architecture keeps it fast on mobile networks.

### V. Privacy, Auth, and Data Integrity

Supabase Auth is the single source of truth for identity (email/password + Google
OAuth). Sessions MUST be validated server-side on every protected route (`/home`,
`/profile`). Sign-out MUST end the Supabase session and redirect to `/signin`. Profile
data (WhatsApp number, LinkedIn URL, topics, language, channel, Phase 3 free-text
response) is stored in Supabase and relies on Supabase's at-rest encryption — no
application-layer encryption is added. Secrets (Supabase keys, OAuth client secrets)
MUST live in environment variables, never in client bundles or committed files.
Row-Level Security policies MUST restrict every profile row to its owning user.

Rationale: The plan defers email verification and application-layer encryption; this
principle codifies what we DO require so those deferrals stay safe.

### VI. Validation Discipline — On Submit, Not on Keystroke

Form validation runs **on submit click**, not on keystroke and not on blur. The only
live-updating UI elements are: (a) the Phase 1 password strength meter, (b) the Phase 2
profile completion percentage (recomputed when a form is saved), and (c) the Phase 3
"Copied!" toast. Inline errors MUST appear directly under the offending field with an
error-colored border. The Topics-of-Interest section MUST enforce exactly 3 selections.
The Phase 3 response textarea MUST accept empty submissions.

Rationale: The plan is explicit about this UX. Live validation on every form would
break consistency and surprise the user.

### VII. Channel-Aware Delivery & Profile Completeness

A member's `channel` (WhatsApp / Telegram / Email) and `language` (English / Arabic /
Both) selections in Form 2 are first-class fields and determine downstream delivery.
Profile completion is computed strictly from the 3 forms: Form 1 = ~33%, Form 1+2 =
~66%, all three = 100%. The "Complete Profile" CTA on `/home` MUST be hidden and
replaced with "Profile complete ✓" once completion reaches 100%. When a user signs out
and returns, the wizard MUST restart from Form 1 (not resume mid-flow), while
previously-saved field values remain on screen as defaults.

Rationale: Channel and language drive the core product value (personalized delivery);
treating them as throwaway form fields would break the product promise.

### VIII. Artifact Structure & Walkthroughs (NON-NEGOTIABLE)

Every Spec Kit feature MUST produce artifacts in the structures below. These structures
are mandatory; reviewers MUST reject artifacts that deviate.

**`plan.md` — produced by `/speckit-plan`** MUST be organized as:

```
# Plan: <feature name>

## Phase <N> — <phase name>
  ### User Story <N.x>: <as a … I want … so that …>
    - Description
  ### Acceptance Criteria (for the phase)
    - Bulleted, declarative, testable statements (one fact per bullet)
  ### Test Scenarios (for the phase)
    - Numbered scenarios in Given / When / Then form covering golden path + edge cases
```

Each phase MUST contain at least one user story, one acceptance-criteria block, and one
test-scenarios block. Acceptance criteria and test scenarios live at the **phase**
level (not buried inside individual stories), so the whole phase can be signed off as a
unit.

**`tasks.md` — produced by `/speckit-tasks`** MUST be organized as:

```
# Tasks: <feature name>

## Phase <N> — <phase name>
  ### User Story <N.x>: <story title>
    - [ ] Task description (atomic, verifiable)
    - [ ] …
```

Tasks MUST be GitHub-style checklist items (`- [ ]`), grouped under the user story they
serve, grouped in turn under their phase. Tasks MUST be atomic — a single PR-sized unit
of work whose completion can be ticked off independently.

**`walkthrough.md` — produced after `/speckit-implement` completes for a phase** MUST
live alongside the spec (same `specs/<feature>/` directory) and MUST contain:

1. **How to run the phase** — exact shell commands (install deps, env vars to set,
   `npm run dev` or equivalent, URL to open).
2. **Implemented features** — bulleted list of every user story / acceptance criterion
   that is now live, with the route or component path where it can be observed.
3. **Manual verification steps** — numbered click-through that exercises the golden
   path on desktop AND mobile widths (per Principle III).
4. **Known gaps / deferred items** — anything not in this phase, with a pointer to
   the phase that will deliver it.

A phase is not "done" until its `walkthrough.md` is written and a reviewer has
followed it end-to-end successfully.

Rationale: The product is multi-phase with overlapping UI surfaces. Forcing phase →
story → criteria/tests structure keeps planning testable and aligned to the plan
document; the walkthrough makes hand-off and regression-checking deterministic.

## Design System & Visual Fidelity

- **Tokens**: the neon-blue gradient, dark-sky background, blue mesh glow, light
  dashboard surface, error color, and gray sub-card background MUST be defined as
  shared tokens (Tailwind theme extension or CSS variables) and referenced by name. No
  hard-coded hex per component.
- **Iconography**: the person-with-plus icon (Complete Profile), waving hand emoji 👋
  (greeting), right-arrow (Next Step), sync/refresh (Submit & Sync), eye toggle
  (password visibility), and "Copy Prompt" affordance MUST appear exactly where the
  plan places them.
- **Removed elements**: the LinkedIn sign-up option, the dark left sidebar across all
  dashboard pages, the "Active ●" indicator, the "Open ChatGPT" button, the
  terms-and-conditions checkbox, and the email-verification step are explicitly
  removed by the plan and MUST NOT be reintroduced.
- **Step indicator**: Identity → Bio-Link → Finalize uses neon-blue for active and
  completed, gray for pending.

## Development Workflow & Quality Gates

- **Branching**: feature work MUST happen on a Spec Kit feature branch created via
  `/speckit-git-feature`. Direct commits to `main` are not allowed for feature work.
- **Commits**: routine `/speckit-git-commit` checkpoints are encouraged at the
  before-plan, before-tasks, before-implement, and before-analyze hook points.
- **Pre-merge checks** (every PR touching UI):
  1. TypeScript compiles with no errors.
  2. ESLint passes (`eslint.config.mjs`).
  3. The feature is manually verified at desktop (≥1280px) and mobile (≤390px) widths.
  4. The neon-blue gradient and other shared tokens are referenced by name, not
     re-defined.
  5. New Client Components are justified; the default is Server Component.
- **Definition of Done** for a phase: every behavior listed in the corresponding
  `meska-brain-plan.md` phase is implemented, validated on submit (not keystroke), and
  responsive-parity verified.

## Governance

This constitution supersedes ad-hoc preferences and prior conventions. Amendments
require:

1. A PR that edits this file with a clear rationale.
2. A version bump following SemVer:
   - **MAJOR** for removing or redefining a NON-NEGOTIABLE principle.
   - **MINOR** for adding a new principle or materially expanding guidance.
   - **PATCH** for clarifications, wording, or typo fixes.
3. A Sync Impact Report (HTML comment at top of file) listing affected templates and
   follow-up TODOs.
4. Propagation: dependent Spec Kit templates (`plan-template.md`, `spec-template.md`,
   `tasks-template.md`) MUST be reviewed and updated in the same PR if their
   Constitution Check sections are affected.

Compliance is verified during `/speckit-plan` (Constitution Check block) and
`/speckit-analyze` (cross-artifact consistency). PR reviewers MUST cite the principle
number when requesting changes grounded in this document. Runtime engineering guidance
lives in `.claude/skills/vercel-react-best-practices/` and `CLAUDE.md`.

**Version**: 1.2.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-21
