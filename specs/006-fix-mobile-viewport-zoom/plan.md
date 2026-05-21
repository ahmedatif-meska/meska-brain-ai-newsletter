# Implementation Plan: Fix Mobile Viewport Zoom on Authenticated Pages

**Branch**: `006-fix-mobile-viewport-zoom` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-fix-mobile-viewport-zoom/spec.md`

## Summary

Authenticated pages (`/home`, `/profile`) render at an effective initial zoom > 100% on mobile, forcing the user to pinch-zoom out and clipping the top-right of the navigation. Root cause (confirmed during Phase 0 research): the production root layout uses a UA-sniffed `generateViewport()` that emits `initial-scale=0.9` for mobile user agents. That 0.9 inflates the CSS viewport ~11%, breaks the mobile-first breakpoint assumptions (Tailwind `sm:` at 640 px), and produces the "zoomed-in, content overflows right" symptom the user reported.

**Technical approach**:

1. Replace `generateViewport()` with a single static `viewport: Viewport` that pins `initial-scale=1` and `width=device-width` — no UA sniffing. (The user's local working tree already has this change staged; the plan formalizes it and verifies no regressions.)
2. Verify and harden the authenticated nav (`DashboardNav`) so it fits at 360 px CSS width with the icon-only mobile variant (`hidden sm:inline` labels) — confirm no overflow contribution from logo, tabs, or sign-out button.
3. Re-verify all routes on 360 / 390 / 1280 / 1440 viewports using the Claude-in-Chrome browser MCP.
4. Preserve user pinch-zoom (no `maximum-scale` / `user-scalable=no`).

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19 (RSC-first), Next.js 16 (App Router)

**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), `@supabase/ssr`, `babel-plugin-react-compiler`

**Storage**: N/A (no data changes)

**Testing**: No test runner installed. Verification is manual via Claude-in-Chrome MCP (`resize_window` → `navigate` → screenshot) at the four target viewports.

**Target Platform**: Web (responsive). Primary devices: iOS Safari (iPhone 12–15), Android Chrome (Pixel 6/7/8). Secondary: desktop Chrome / Safari / Firefox.

**Project Type**: Web application (Next.js App Router, single project)

**Performance Goals**: No measurable change. Fix is layout/meta only; no runtime regression.

**Constraints**:

- Zero horizontal overflow at 360 × 800 and 390 × 844 (Principle III).
- Must preserve pinch-zoom (accessibility).
- Must not regress desktop ≥ 1280 px.
- Must not regress public pages (`/signup`, `/signin`, `/terms`, `/reset-password`).

**Scale/Scope**: ~2 file edits (`app/layout.tsx` is the dominant change; possibly `components/dashboard/DashboardNav.tsx` if overflow remains after the viewport fix). Six routes to re-verify (signup, signin, terms, reset-password, home, profile).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0 principles applied to this change:

| Principle | Status | Notes |
|---|---|---|
| I. Spec-driven workflow | PASS | Following `/speckit-specify → /speckit-plan → …` order. |
| II. Visual identity (white + neon-blue dashboard, dark hero for public) | PASS | No visual redesign; bug fix only. |
| III. Mobile-fit gate (NON-NEGOTIABLE) | PASS — this fix RESTORES the gate. | Verification at 360 / 390 / 1280 / 1440 is built into Phase 2 tasks. |
| IV. RSC-first with named client islands | PASS | No new client components. `DashboardNav` is and remains server-rendered. |
| V. Supabase auth client choice (admin vs SSR) | N/A | No auth changes. |
| VI. Submit-only validation | N/A | No form changes. |
| VII. Tokenized styling (no per-component hex) | PASS | No new colors. |
| VIII. Spec directory structure | PASS | `specs/006-…/{spec,plan,research,quickstart}.md` follows the convention. |

**Gate result**: All applicable gates pass. No complexity-tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/006-fix-mobile-viewport-zoom/
├── plan.md              # This file
├── spec.md              # Feature spec (already written)
├── research.md          # Phase 0: root-cause analysis
├── quickstart.md        # Phase 1: how to verify the fix manually
├── checklists/
│   └── requirements.md  # Spec quality checklist (already written)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

**Skipped**: `data-model.md` and `contracts/` — this is a layout/meta bug; no entities, no external contracts.

### Source Code (repository root)

```text
app/
├── layout.tsx                       # PRIMARY EDIT: replace generateViewport() with static viewport
├── globals.css                      # Verify no width regressions; no edit expected
├── home/page.tsx                    # Verify only
├── profile/page.tsx                 # Verify only
├── (auth)/
│   ├── signin/page.tsx              # Verify no regression
│   ├── signup/page.tsx              # Verify no regression
│   └── reset-password/page.tsx      # Verify no regression
└── terms/page.tsx                   # Verify no regression

components/
├── dashboard/
│   ├── DashboardNav.tsx             # SECONDARY EDIT if overflow remains after viewport fix
│   ├── ProfileProgressCard.tsx      # Verify only
│   └── SignOutButton.tsx            # Verify only
└── chrome/
    └── Wordmark.tsx                 # Verify (image sizing on mobile)
```

**Structure Decision**: Single Next.js App Router project — no backend/frontend split. Changes are confined to the root `app/layout.tsx` viewport configuration and (if needed) the authenticated `DashboardNav` component. No new files.

## Phase 0 — Research (consolidated into [research.md](./research.md))

Three questions investigated:

1. **What is the proximate cause of the "zoomed-in" appearance on mobile?**
   → A `generateViewport()` function in `app/layout.tsx` emits `initial-scale=0.9` for mobile user agents (UA-sniffed via `next/headers`). `initial-scale` < 1 expands the CSS viewport beyond the device width, so the mobile-first layout (Tailwind `sm:` = 640 px) sees a wider canvas than intended and content authored to fit 360–430 px ends up rendering with extra padding/labels. The user perceives this as "the page is zoomed in" because the entire document is rendered larger relative to the device's native pixel grid.

2. **Why was UA sniffing introduced, and what does removing it cost?**
   → Likely an attempted shrink-to-fit for an earlier overflow bug. Removing it is safe because (a) the constitution mandates mobile-first authoring that fits 360 px natively, and (b) UA sniffing for layout is brittle and inconsistent with the SSR-first approach (the response is no longer purely static, and any caching layer that ignores `User-Agent` would serve the wrong viewport).

3. **Is there any residual overflow once `initial-scale=1` is restored?**
   → `DashboardNav` uses `hidden sm:inline` for labels (so on < 640 px the nav is icon-only logo + 2 icons + sign-out button). At 360 px CSS width with icon-only tabs, the nav fits. The reference screenshot showing visible "Home" and "Profile" labels at a phone width is consistent with the 0.9 scale inflating the CSS viewport above 640 px — once `initial-scale=1` is restored, labels will revert to icons on phones and the right-edge clipping disappears. No secondary edit is expected, but Phase 2 verification will confirm.

See `research.md` for the full decision/rationale/alternatives breakdown.

## Phase 1 — Design & Contracts

**Data model**: N/A. No entities, no persistence change.

**Contracts**: N/A. No external interfaces are added or modified. The only "interface" touched is the document `<meta name="viewport">` directive — its contract is the W3C-standard `width=device-width, initial-scale=1`, which is the canonical mobile-fit declaration.

**Quickstart**: See [quickstart.md](./quickstart.md) — the manual verification recipe for reviewers.

**Agent context update**: The active-plan reference in `CLAUDE.md` will be updated to point to this plan (`specs/006-fix-mobile-viewport-zoom/plan.md`) as part of executing this command (see Step 4 below).

## Complexity Tracking

> No Constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
