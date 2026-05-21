# Feature Specification: Sign-up Page

**Feature Branch**: `001-signup-page`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "Phase 1 of the Meska Brain plan — public sign-up page with Google and email/password options, dark starry-sky aesthetic."

## Clarifications

### Session 2026-05-20

- Q: Which Supabase deployment will back this app? → A: Supabase Cloud (managed at supabase.com) for all environments — dev, staging, and production point at hosted Supabase projects; Google OAuth is configured via the Supabase dashboard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account with email and password (Priority: P1)

A new visitor lands on `/signup`, fills in first name, last name, email, and a strong password, and creates a Meska Brain account.

**Why this priority**: Email/password is the universal sign-up path and the only one that requires the full form. Without it, no member can self-onboard without a Google account.

**Independent Test**: Open `/signup` in an incognito session, complete the email/password form with valid values, and verify the account exists in the identity store and the user is routed to `/signin`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/signup`, **When** they submit valid first name, last name, email, and a password that satisfies all complexity rules, **Then** the account is created and the user is routed to `/signin` (no auto-login, no email verification).
2. **Given** a visitor typing in the password field, **When** the input changes, **Then** the password strength meter updates live (weak / medium / strong) but no other field validation runs.
3. **Given** a visitor on `/signup`, **When** they click the eye icon in the password field, **Then** the password visibility toggles without losing the typed value.
4. **Given** a visitor submits with an email already registered, **When** the form is submitted, **Then** an inline error appears: "An account with this email already exists. Sign in instead." and no duplicate account is created.
5. **Given** a visitor submits with one or more required fields empty or invalid (missing name, invalid email, password failing complexity), **When** the form is submitted, **Then** inline errors appear under each invalid field; the error styling marks the field border.

---

### User Story 2 - Create an account with Google (Priority: P1)

A new visitor clicks "Sign up with Google" on `/signup`, completes the Google consent flow, and is routed to `/signin` to log in.

**Why this priority**: Google sign-up is a one-click alternative that materially reduces friction for the target audience. It must be present on day one alongside email/password.

**Independent Test**: Open `/signup`, click the Google button, complete the Google flow with a test account, and verify the account exists with first/last name pulled from the Google profile and that the user lands on `/signin`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/signup`, **When** they click "Sign up with Google" and complete the Google consent flow successfully, **Then** an account is created with the first and last name from the Google profile and the user is routed to `/signin`.
2. **Given** a visitor abandons the Google consent flow, **When** they return to `/signup`, **Then** no account is created and the form is in its initial state.
3. **Given** a Google account whose email is already registered, **When** the visitor attempts Google sign-up, **Then** the system surfaces guidance to sign in instead and does not create a duplicate account.

---

### User Story 3 - Navigate between sign-up and sign-in (Priority: P2)

A visitor on `/signup` who already has an account uses the "SIGN IN" tab on the auth card to move to `/signin`, or clicks the "Meska Brain" wordmark to return to the marketing root.

**Why this priority**: Visitors arrive at the wrong page often; cross-navigation prevents drop-off.

**Independent Test**: From `/signup`, click each of: the "SIGN IN" tab and the wordmark; verify the resulting routes are `/signin` and `/` respectively.

**Acceptance Scenarios**:

1. **Given** a visitor on `/signup`, **When** they click the "SIGN IN" tab at the top of the auth card, **Then** they are routed to `/signin` (a separate page, not an in-place tab switch).
2. **Given** a visitor on `/signup`, **When** they click the "Meska Brain" wordmark in the top-left, **Then** they are routed to `/`.

---

### Edge Cases

- Password that meets length but lacks one required character class (e.g. all lowercase + numbers) → rejected on submit with a field-level error explaining the missing requirement.
- Pasted password containing leading/trailing whitespace → preserved as-is; user is responsible for the literal string.
- Email containing uppercase characters → normalized for duplicate detection (case-insensitive uniqueness).
- Visitor on mobile viewport at 360px width → hero, badge, and headline retain the same line count as desktop (Phase 1's responsive rule).
- Visitor with reduced-motion browser preference → the twinkling-star and parallax animation may be reduced or paused; layout remains identical.
- Duplicate-email error is the only inline error that runs against the server; all other field validations are client-side.
- Submit clicked twice in quick succession → only one account creation attempt is processed.

## Requirements *(mandatory)*

### Functional Requirements

**Page & navigation**

- **FR-001**: The system MUST expose a sign-up page at the route `/signup`.
- **FR-002**: The page MUST render a "Meska Brain" wordmark in the top-left. Clicking it MUST route to `/`.
- **FR-003**: The auth card MUST include a "SIGN IN" tab at the top. Clicking it MUST route the user to `/signin` as a separate page (not an in-place tab switch).
- **FR-004**: A sign-in page MUST exist at `/signin` to receive users routed from the SIGN IN tab and from successful sign-up. The full sign-in flow is out of scope for this spec beyond receiving the route.

**Auth methods on the card**

- **FR-005**: The card MUST offer exactly two sign-up methods: "Sign up with Google" and "Sign up with email and password". A LinkedIn option MUST NOT be present.
- **FR-006**: The Google button MUST occupy the same position and visual treatment as the LinkedIn button in the design reference (shape, position, treatment), with the Google branding.
- **FR-007**: A terms-and-conditions checkbox MUST NOT be present.

**Email & password form fields**

- **FR-008**: The form MUST collect First Name, Last Name, Email, and Password as separate fields.
- **FR-009**: The Password field MUST include an eye icon that toggles password visibility without clearing the value.
- **FR-010**: Below the Password field, a live password strength meter MUST update on every keystroke and indicate weak / medium / strong.
- **FR-011**: The strength meter MUST be the only element that updates live during typing or on blur; no other field validation runs until submit.

**Password rules**

- **FR-012**: Passwords MUST be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol.
- **FR-013**: A password that fails any of these rules MUST be rejected on submit with a clear inline error stating which class is missing.

**Validation & submission**

- **FR-014**: All required-field, email-format, password-complexity, and duplicate-email validations MUST run only on submit (not on type, not on blur).
- **FR-015**: When the submitted email is already registered, the system MUST display the inline error "An account with this email already exists. Sign in instead." and MUST NOT create a duplicate account.
- **FR-016**: On successful email/password sign-up, the system MUST create the user record with the supplied first name, last name, and email; MUST NOT send an email-verification step; MUST NOT auto-login the user; and MUST route the user to `/signin`.

**Google sign-up**

- **FR-017**: On successful Google sign-up, the system MUST create the user record using the first and last name pulled from the Google profile, MUST NOT auto-login the user, and MUST route the user to `/signin`.
- **FR-018**: If the Google account's email matches an existing user, the system MUST NOT create a duplicate; it MUST surface guidance to sign in instead.

**Name handling**

- **FR-019**: For email/password sign-up, the user record's first/last name MUST be taken from the form fields.
- **FR-020**: For Google sign-up, the user record's first/last name MUST be taken from the Google profile.
- **FR-021**: The stored first and last name MUST be available for use by downstream features (e.g., the dashboard greeting in Phase 2).

**Visual & responsive**

- **FR-022**: The page background MUST be a dark blue night-sky surface with stars; the stars MUST animate as twinkling and exhibit a 2D parallax effect.
- **FR-023**: A blue mesh glow MUST sit behind the auth card, with the dark starry sky behind that.
- **FR-024**: The hero headline MUST use the blue-tinted accent shown in the reference image, with the same overall color contrast as the reference.
- **FR-025**: An "AI HYPERPERSONALIZED NEWSLETTER" pill badge MUST be present. Its leading dot MUST be rendered as small bright stars moving in 2D, matching the dark starry sky aesthetic.
- **FR-026**: The page MUST render visually consistent on web and mobile. Multi-line text blocks (e.g., the hero) MUST retain the same line count across viewport sizes; text MUST NOT wrap into additional lines on smaller viewports.

### Key Entities

- **User (created during sign-up)**: identifier, email (uniqueness enforced case-insensitively), authentication method (Google or email/password), first name, last name, created-at timestamp. Email verification is intentionally absent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can complete email/password sign-up (form fill + submit + landing on `/signin`) in under 90 seconds on a typical broadband connection.
- **SC-002**: A visitor can complete Google sign-up (button click + consent + landing on `/signin`) in under 30 seconds on a typical broadband connection.
- **SC-003**: At least 99% of successful sign-up submissions result in exactly one new account record being created (no duplicates).
- **SC-004**: Across desktop and mobile viewports (360px, 768px, 1280px, 1920px wide), the hero headline and badge text retain the same line count, verified by visual inspection.
- **SC-005**: 0% of sign-up attempts using an already-registered email succeed; 100% surface the documented inline error.
- **SC-006**: Field-level validation errors are displayed inline on submit for 100% of the documented invalid-input cases (missing required fields, invalid email format, password failing complexity), with the field border styled to indicate the error.
- **SC-007**: The password strength meter updates within 200ms of each keystroke for 100% of test inputs.

## Assumptions

- Identity is backed by **Supabase Cloud** (managed at supabase.com). Dev, staging, and production each use a hosted Supabase project; Google OAuth credentials are configured in the Supabase dashboard. Self-hosting Supabase is explicitly not in scope.
- The authentication provider supports both Google OAuth and email/password flows with the behavior described; email verification is intentionally disabled.
- Email uniqueness is enforced case-insensitively (industry standard).
- The exact gradient/colors used for the headline accent and any "Sign up" CTA are a design-handoff detail and are described as the same "neon blue" used throughout the app.
- The "AI HYPERPERSONALIZED NEWSLETTER" badge animation is decorative; users with reduced-motion preferences see a static badge.
- Accessibility (WCAG), analytics events, error-tracking integration, rate-limiting, and anti-abuse protections are out of scope for this spec and will be addressed separately.

## Out of Scope

- The sign-in flow itself (beyond the `/signin` route receiving redirects).
- Email verification, magic links, or password-reset flows.
- Onboarding, dashboard, or profile-completion behavior (covered by Phase 2 and Phase 3 specs).
- Internationalization of sign-up copy.
- Admin or operator tooling for user management.
