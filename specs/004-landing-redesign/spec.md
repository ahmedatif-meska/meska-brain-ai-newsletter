# Feature Specification: Landing Redesign

**Feature Branch**: `004-landing-redesign`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "first the get start page remove it; second the landing page is not as expected — Login.png is the exact screen to implement; the dots behind the sign-up form should move while hovering."

## Clarifications

### Session 2026-05-20

- Q: The reference screenshot shows ONLY Email + Password on the card — no First Name / Last Name fields. How should we handle the user's name? → A: Match the screen exactly. Drop social-auth (Google) too — it is not needed for MVP. The card collects only Email + Password.

## Background

This feature revises the visual and structural design of `/signup` to match the supplied reference image (`Login.png`) exactly, and it removes the standalone marketing "Get started" page that currently lives at `/`. It supersedes the layout choices made in `specs/001-signup-page/` while keeping the constitutional rules around tokens, validation discipline, and Supabase Cloud identity.

Compared to spec 001, this revision changes:

1. **Page structure** — single centered column (hero stacked above the auth card), not a two-column hero/card split.
2. **Auth methods** — Email + Password ONLY for MVP. No Google button. No LinkedIn button. No social-auth slot at all.
3. **Form fields** — only Email and Password. First Name and Last Name are not collected during sign-up.
4. **Top of card** — single "SIGN UP" header label inside the card (no SIGN UP / SIGN IN tab strip across the top).
5. **Cross-navigation to sign-in** — an "Already have an account? Sign in" link sits inside the card, near the bottom, instead of a top tab.
6. **Footer** — small informational T&C copy below the Sign-up button. This is decorative text only — it is NOT a checkbox and does NOT gate submission.
7. **Marketing root** — `/` no longer renders a "Get started" page. Visiting `/` immediately routes the visitor to `/signup`.
8. **Background parallax visibility** — the twinkling-stars background is explicitly visible behind the sign-up card, and its parallax responds to pointer movement over the card surface, not just the page background.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create an account with email and password (Priority: P1)

A new visitor lands on `/signup`, sees the hero copy and the sign-up card from the reference image, fills in their email and a strong password, and creates a Meska Brain account.

**Why this priority**: This is the only sign-up method in MVP. Without it no member can self-onboard.

**Independent Test**: Open `/signup` in an incognito session, complete the email + password form with valid values, and verify the account exists in Supabase Cloud and the user is routed to `/signin`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/signup`, **When** they enter a valid email and a password that satisfies all complexity rules, and click Sign up, **Then** the account is created and the visitor is routed to `/signin` (no auto-login, no verification email).
2. **Given** a visitor typing in the Password field, **When** the input changes, **Then** the password strength meter (if rendered) updates live, and no other field validation runs until submit.
3. **Given** a visitor on `/signup`, **When** they click the eye icon in the Password field, **Then** password visibility toggles without losing the typed value.
4. **Given** a visitor submits with an email that already exists, **When** the form is submitted, **Then** an inline error appears under the Email field: "An account with this email already exists. Sign in instead." and no duplicate account is created.
5. **Given** a visitor submits with an empty field or an invalid email or a password that fails complexity, **When** the form is submitted, **Then** an inline error appears under each invalid field and the field border is styled to indicate the error.

---

### User Story 2 — Navigate from sign-up to sign-in (Priority: P2)

A visitor on `/signup` who already has an account uses the "Already have an account? Sign in" link inside the card to move to `/signin`.

**Why this priority**: The top SIGN IN tab is removed in this revision; the in-card link is now the only path to sign-in from `/signup`.

**Independent Test**: From `/signup`, click "Sign in"; verify the URL becomes `/signin`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/signup`, **When** they click the "Sign in" link inside the card, **Then** the URL is `/signin` (a full navigation to a separate page).
2. **Given** a visitor on `/signup`, **When** they click the Meska Brain wordmark in the top-left, **Then** the URL becomes `/signup` (the wordmark links to the public entry point, which is `/signup` in MVP).

---

### User Story 3 — Marketing root removed (Priority: P2)

A visitor who types the bare domain URL (`/`) lands directly on the sign-up page instead of a separate "Get started" marketing page.

**Why this priority**: Removes a dead-end UI and a confusing intermediate step. In MVP the only public entry point is `/signup`.

**Independent Test**: Open `/` in an incognito browser; verify the final URL is `/signup` and the sign-up card is visible.

**Acceptance Scenarios**:

1. **Given** a visitor opens `/`, **When** the response completes, **Then** the URL is `/signup` and the sign-up page is rendered.
2. **Given** any internal navigation that previously routed to `/`, **When** that navigation triggers, **Then** the visitor arrives at `/signup` (no intermediate "Get started" screen).

---

### User Story 4 — Stars move while hovering (Priority: P3)

The dark starry-sky background is visible behind the sign-up card, and the stars subtly drift in response to pointer movement — including when the pointer hovers over the card.

**Why this priority**: It is a documented visual signature of the brand. The reference image emphasises the dotted/starry texture directly behind the card surface.

**Independent Test**: Load `/signup`, hover the pointer over the auth card, and observe the stars behind the card shifting along a 2D parallax. Set the OS reduce-motion preference and observe the stars become static.

**Acceptance Scenarios**:

1. **Given** a visitor on `/signup` with reduce-motion OFF, **When** they move the pointer across the page (including over the auth card), **Then** the stars in the background shift along two depth layers and individual stars twinkle.
2. **Given** a visitor on `/signup` with reduce-motion ON, **When** they move the pointer across the page, **Then** the stars are static and the layout is unchanged.
3. **Given** the auth card has a translucent surface, **When** the page is rendered, **Then** the stars are perceptibly visible behind the card (i.e., the card is not a fully opaque panel that hides the background).

---

### Edge Cases

- A password meeting length but missing one character class (e.g., all lowercase + numbers) → rejected on submit with a field-level error naming the missing class.
- Pasted password containing leading/trailing whitespace → preserved as-is; the user is responsible for the literal string.
- Email containing uppercase characters → normalised for duplicate detection (case-insensitive uniqueness).
- Visitor on mobile viewport at 360px width → hero copy, badge, headline, and card retain the same line count as desktop.
- Visitor with reduced-motion browser preference → twinkling and parallax are paused; layout is identical.
- Submit clicked twice in rapid succession → only one account-creation attempt is processed.
- Visitor clicks the small T&C footer text → it MAY link to a terms page or be inert; submission MUST NOT depend on any user action on this text.
- Visitor types a URL that previously matched `/` (the old "Get started" page) → they land on `/signup` with no flash of the old page.

## Requirements *(mandatory)*

### Functional Requirements

**Marketing root removal**

- **FR-001**: The system MUST NOT render any "Get started" page or marketing landing at `/`. The previous root content is removed.
- **FR-002**: Visiting `/` MUST result in the visitor being on `/signup` (via redirect or by serving the same content at the root path). There MUST be no flash of intermediate content.

**Sign-up page layout (matches `Login.png` exactly)**

- **FR-003**: The system MUST expose the sign-up page at `/signup`.
- **FR-004**: The page MUST render the "Meska Brain" wordmark in the top-left. Clicking it MUST route to `/signup` in MVP (the previous `/` destination no longer exists).
- **FR-005**: A pill badge with the copy "AI-HYPERPERSONALIZED NEWSLETTER" MUST be centred above the hero, exactly as in the reference image.
- **FR-006**: The hero headline MUST read exactly: "Eliminate the noise. Get hyper-personalized" on the first line and "AI insights on your preferred channel." on the second line, with "AI insights" rendered in the brand neon-blue accent and the surrounding text in white.
- **FR-007**: The page MUST be a single centred column: pill → hero → card → terms footer. There MUST NOT be a two-column hero/card split.
- **FR-008**: The auth card MUST appear inside the dark starry background with a subtle blue mesh glow behind it; the stars MUST remain visible behind the card surface (the card is not fully opaque).

**Auth card content**

- **FR-009**: The card MUST display "SIGN UP" as a single label/tab at the top (no SIGN IN tab beside it).
- **FR-010**: The card MUST show a title "Create account" and a subtitle "Join the next generation of AI intelligence" (or wording matching the reference).
- **FR-011**: The card MUST NOT contain any social-auth button (no Google, no LinkedIn). MVP collects credentials directly.
- **FR-012**: The card MUST collect exactly two fields: Email and Password. First Name and Last Name MUST NOT be present on this card.
- **FR-013**: The Password field MUST include an eye icon that toggles password visibility without clearing the typed value.
- **FR-014**: A password strength meter MUST appear under the Password field and MUST update live as the user types (weak / medium / strong). This is the only live UI element.
- **FR-015**: The "Sign up" submit button MUST occupy the full card width, with the brand neon-blue gradient.
- **FR-016**: Below the Sign-up button, an "Already have an account? Sign in" link MUST navigate to `/signin` as a separate page (this replaces the top SIGN IN tab from the previous design).
- **FR-017**: Below the link, small informational footer copy MUST be rendered: "By signing up, you agree to our Terms and Conditions." This copy is NOT a checkbox and MUST NOT gate submission. The "Terms and Conditions" phrase MAY be a link to a terms page (a placeholder destination is acceptable for MVP).

**Validation**

- **FR-018**: Field validation (required, email format, password complexity, duplicate email) MUST run only on submit. No validation runs on keystroke or on blur, except the password strength meter (FR-014).
- **FR-019**: Passwords MUST be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol.
- **FR-020**: A password failing any rule MUST be rejected on submit with a field-level error naming the missing class.
- **FR-021**: If the submitted email is already registered, the system MUST display the inline error "An account with this email already exists. Sign in instead." under the Email field and MUST NOT create a duplicate account.
- **FR-022**: On successful sign-up, the system MUST create the user record with the supplied email; MUST NOT send an email-verification step; MUST NOT auto-login the user; and MUST route the user to `/signin` (a brief success affordance on `/signin` is acceptable).

**Background and motion**

- **FR-023**: The page background MUST be a dark night-sky surface with stars distributed across two perceptible depth layers.
- **FR-024**: With reduced-motion OFF, stars MUST twinkle and exhibit a 2D parallax response to pointer movement across the entire page, including when the pointer is over the auth card.
- **FR-025**: With reduced-motion ON, twinkling and parallax MUST be paused; layout MUST remain unchanged.
- **FR-026**: The "AI-HYPERPERSONALIZED NEWSLETTER" pill MUST have a leading dot rendered as small bright stars that animate in 2D (subject to reduced-motion).

**Name handling implications**

- **FR-027**: Because no First/Last Name fields are collected during sign-up, the user record's `first_name` and `last_name` fields MUST be empty after MVP sign-up. Downstream features that previously assumed those fields existed (e.g., the dashboard greeting in Phase 2, Form 1 defaults in Phase 3) MUST tolerate empty values and continue to function. Concretely: the Phase 2 greeting falls back to "Welcome back" (no name) until the user fills Form 1; Phase 3 Form 1 collects First Name and Last Name with empty defaults.

**Responsive parity (Constitution III)**

- **FR-028**: The page MUST render with the same line count for the hero and badge text across 360, 768, 1280, and 1920 px widths. Text MUST NOT wrap into additional lines on smaller viewports.

### Key Entities

- **User (created during sign-up)**: identifier, email (uniqueness enforced case-insensitively), authentication method (`password`), `first_name = ""`, `last_name = ""`, created-at timestamp. First and Last Name are populated later via the profile wizard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can complete sign-up (form fill + submit + landing on `/signin`) in under 60 seconds on a typical broadband connection.
- **SC-002**: At least 99% of successful sign-up submissions result in exactly one new account record being created.
- **SC-003**: Across desktop and mobile viewports (360, 768, 1280, 1920 px wide), the hero headline and badge text retain the same line count, verified by visual inspection.
- **SC-004**: 0% of sign-up attempts using an already-registered email succeed; 100% surface the documented inline error.
- **SC-005**: Field-level validation errors are displayed inline on submit for 100% of the documented invalid-input cases (missing required fields, invalid email format, password failing complexity).
- **SC-006**: The password strength meter updates within 200 ms of each keystroke.
- **SC-007**: A visitor opening `/` lands on `/signup` 100% of the time, with no visible flash of any previous "Get started" content.
- **SC-008**: With reduced-motion OFF, moving the pointer in a 200 px circular path causes a visually perceptible shift of stars (≥3 px on the near layer) within 1 frame.
- **SC-009**: With reduced-motion ON, no star position changes for the same 200 px pointer path.

## Assumptions

- Identity is backed by **Supabase Cloud** (same as spec 001).
- Email uniqueness is enforced case-insensitively.
- The exact gradient and dark-sky tokens are the existing tokens defined in `app/globals.css` and consumed by name (Constitution II).
- The terms page linked from the footer copy may not exist yet; in MVP the link may point to a placeholder route or be inert. Submission is unaffected either way.
- Accessibility (WCAG AA), analytics, error tracking, rate limiting, and anti-abuse remain out of scope for MVP.
- The Phase 2 dashboard greeting and Phase 3 Form 1 defaults will be revised separately to handle the now-empty First/Last Name fields. Coordination with specs `002-dashboard-home` and `003-profile-wizard` happens during their respective `/speckit-plan` runs.

## Out of Scope

- Sign-in flow (only the `/signin` route receives redirects from this page; full sign-in ships later).
- Email verification, magic links, password reset.
- Onboarding, dashboard, profile-wizard behaviour (covered by the 002 and 003 specs).
- Internationalisation of sign-up copy.
- Admin / operator tooling for user management.
- Re-introducing any social-auth button (Google or LinkedIn) — explicitly out for MVP.

## Relationship to existing specs

- **Supersedes layout choices in `specs/001-signup-page/spec.md`**: FR-003 / FR-005 / FR-007 / FR-009 (top tabs and two-column layout) and FR-008 (form has First+Last+Email+Password) are replaced by FR-007 / FR-009 / FR-012 here. The 001 spec's behavioural rules (validation discipline, password complexity, no auto-login, no verification email, duplicate-email handling, responsive parity, reduced-motion) remain in effect and are restated above.
- **Affects `specs/002-dashboard-home/spec.md`** (Phase 2): the greeting "Welcome back, {First Name} {Last Name} 👋" needs a fallback when names are empty.
- **Affects `specs/003-profile-wizard/spec.md`** (Phase 3): Form 1's First/Last Name fields no longer have a sign-up default to auto-fill; they start empty for email/password users.
