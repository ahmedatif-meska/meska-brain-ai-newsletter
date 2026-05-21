# Feature Specification: Fix Mobile Viewport Zoom on Authenticated Pages

**Feature Branch**: `006-fix-mobile-viewport-zoom`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "When I sign in using mobile, the page is not fitting 100%. It appears slightly zoomed in and requires the user to pinch-zoom out to make the page fit. The home dashboard page exhibits the same issue. This is critical."

## Problem Statement

After a member signs in on a mobile device, the landing dashboard (and other authenticated pages) renders at a width that exceeds the device viewport. The browser compensates by displaying the page at an effective zoom level greater than 100%, so:

- Content (logo, top navigation tabs, headings, cards) appears oversized relative to the device.
- A horizontal scroll/clip appears on the right edge — visible in the reference screenshot as a partially cut-off tab pill to the right of "Profile".
- The user must pinch-zoom out to see the layout as intended, which breaks the perception that the app is a native-feeling mobile experience.

This is a **Constitution Principle III (Mobile-Fit Gate) violation** and is tagged critical: Phase 1 traffic is overwhelmingly mobile (newsletter signups arrive from WhatsApp/Telegram links), so a zoom-on-arrival impression directly damages activation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile sign-in lands on a perfectly-fitted dashboard (Priority: P1)

A member opens the app on a phone (iPhone 13 / Pixel-class device, 360–414 px wide), signs in, and is redirected to the home dashboard.

**Why this priority**: This is the first authenticated screen the user sees. A zoomed/clipped first impression directly impacts retention and signals an unpolished product. Resolving this restores the mobile-fit guarantee that the constitution treats as non-negotiable.

**Independent Test**: Sign in on a 390 × 844 viewport (iPhone 13/14 Pro) at the device's natural zoom (100% / `initial-scale=1`). Confirm: no horizontal scroll, no clipped elements on the right edge, the M logo + Home tab + Profile tab all visible inside the viewport with comfortable padding, and the page renders at the same effective scale as the public/marketing pages.

**Acceptance Scenarios**:

1. **Given** a signed-out user on a 390 × 844 mobile viewport, **When** they sign in successfully and land on the home dashboard, **Then** the page fits the viewport with zero horizontal overflow and no element is clipped at the right edge.
2. **Given** a user on a 360 × 800 mobile viewport (smallest target), **When** the home dashboard loads, **Then** the top navigation (logo, Home, Profile, and any further tabs) is fully visible inside the viewport without horizontal scrolling.
3. **Given** any authenticated page on any supported mobile viewport (360–430 px wide), **When** the page first paints, **Then** the browser's initial scale is 1.0 (no automatic zoom-to-fit kicks in).
4. **Given** a user lands on the home dashboard on mobile, **When** they attempt to scroll horizontally, **Then** no horizontal scrolling occurs (vertical scroll only).

---

### User Story 2 - All authenticated routes behave consistently (Priority: P1)

The fix must not be limited to the home dashboard. Every authenticated route the user can reach — including profile/wizard pages and any future authenticated screens — must adhere to the same mobile-fit guarantee.

**Why this priority**: The user explicitly called out "the home dashboard page looks exactly like this" — implying the issue spans more than one screen. Fixing only the visible page would leave the underlying root cause in place.

**Independent Test**: Visit every authenticated route on a 390 × 844 viewport and verify each renders at natural scale with no horizontal overflow.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they navigate between authenticated routes (home, profile wizard steps, any settings), **Then** every route renders at natural scale with no horizontal overflow on 360 px and 390 px viewports.

---

### User Story 3 - Public/unauthenticated pages remain unaffected (Priority: P2)

The signup, signin, terms, and reset-password pages must continue to fit correctly. Whatever fix is applied to authenticated layouts must not regress these pages.

**Why this priority**: Public pages are the entry funnel and currently fit mobile correctly. A fix targeting authenticated routes must not break them.

**Independent Test**: After the fix lands, re-verify `/signin`, `/signup`, `/terms`, `/reset-password` on 360 px and 390 px viewports.

**Acceptance Scenarios**:

1. **Given** the fix is deployed, **When** an unauthenticated user visits `/signup`, **Then** the page continues to fit the viewport identically to its pre-fix behavior.

---

### Edge Cases

- **Very narrow viewports (320 px, e.g., iPhone SE 1st gen)**: Layout should still fit without horizontal scroll; minor copy truncation or wrapping is acceptable, but no clipped interactive controls.
- **Landscape orientation on phones**: Page must fit horizontally and not introduce double-zoom.
- **Tablet viewports (768 px, 820 px)**: Page must not regress; layout should scale up gracefully.
- **Large desktop (≥ 1280 px)**: Must remain unchanged from current behavior.
- **Dynamic browser chrome (iOS Safari URL bar collapse/expand)**: Layout must remain stable; no element should jump in or out of view as chrome resizes.
- **System font-size accessibility setting bumped up**: Page should still not overflow horizontally (vertical growth is acceptable).
- **Pinch-zoom by user choice**: Users must still be able to pinch-zoom for accessibility; the fix must not disable user scaling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every authenticated page MUST render at the device's natural scale (effective initial zoom = 100%) on mobile viewports between 360 px and 430 px wide, with no automatic browser zoom-to-fit.
- **FR-002**: Every authenticated page MUST have zero horizontal scroll on viewports ≥ 360 px wide. The page's rendered width MUST equal the viewport width.
- **FR-003**: No element on any authenticated page MAY be clipped by the right viewport edge under normal (non-scrolled) conditions. This explicitly includes the top navigation tabs visible in the reference screenshot.
- **FR-004**: The top navigation on authenticated pages MUST fit fully inside a 360 px-wide viewport, OR MUST become horizontally scrollable in a contained, intentional way that does not cause the whole page to overflow.
- **FR-005**: The fix MUST preserve user pinch-zoom capability (accessibility requirement); zoom MUST NOT be disabled via viewport meta or CSS.
- **FR-006**: The fix MUST NOT regress any currently-passing public/unauthenticated page (`/signup`, `/signin`, `/terms`, `/reset-password`) on any supported viewport.
- **FR-007**: The fix MUST NOT regress desktop (≥ 1280 px) rendering of any page.
- **FR-008**: The fix MUST be verified in a real browser at 360 × 800, 390 × 844, and ≥ 1280 px before the task is marked complete (per Constitution Principle III).
- **FR-009**: Touch targets on authenticated pages MUST remain ≥ 44 × 44 px after the fix.

### Key Investigation Areas (informational, not prescriptive)

The spec does not prescribe the technical fix, but planning should examine these candidate root causes:

- Whether the root layout emits a correct viewport meta directive for authenticated routes (and whether any authenticated layout overrides or omits it).
- Whether any container in the authenticated layout has a fixed pixel width, min-width, or unconstrained max-width that exceeds 360 px.
- Whether the top-nav tab list overflows horizontally and forces the document to expand.
- Whether any global CSS (e.g., body padding, container padding) inadvertently widens the document beyond the viewport width.

## Success Criteria *(mandatory)*

- **SC-001**: 100% of authenticated pages render with zero horizontal overflow on 360 × 800 and 390 × 844 viewports.
- **SC-002**: A new mobile user signing in on a 390 px-wide device sees the home dashboard at natural scale with no need to pinch-zoom — measured by visual inspection across all authenticated routes.
- **SC-003**: Zero clipped elements on the right edge of any authenticated page across the tested viewport range (360–430 px).
- **SC-004**: All four public pages (`/signup`, `/signin`, `/terms`, `/reset-password`) retain their current mobile-fit behavior — verified post-fix.
- **SC-005**: Desktop rendering at 1280 px and 1440 px is visually identical to pre-fix behavior.
- **SC-006**: User-initiated pinch-zoom continues to function on all pages.

## Assumptions

- The reference screenshot was taken on an iPhone-class device (≈ 390 px CSS width) in portrait orientation, in mobile Safari, immediately after a successful sign-in.
- "Home dashboard" refers to the route the user is redirected to after sign-in (current implementation lives in the dashboard route group — to be confirmed in planning).
- Phase 1 supported mobile viewports are 360 px–430 px wide (covering common Android and iPhone devices). The 320 px iPhone SE 1st gen is a stretch goal, not a blocking target.
- "Authenticated pages" includes at minimum the home dashboard and the profile wizard (Identity / Bio-Link / Finalize). Any additional authenticated routes added later inherit the same guarantee.
- The fix is purely a frontend/layout concern; no backend, database, or auth-flow changes are required.

## Out of Scope

- Redesigning the home dashboard or top navigation visually.
- Adding new authenticated routes or features.
- Changing the post-login redirect destination.
- Native mobile app behavior (the product is a responsive web app in Phase 1).
- Performance optimization unrelated to mobile-fit.
