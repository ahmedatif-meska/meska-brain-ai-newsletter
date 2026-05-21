# Feature Specification: Dashboard Home

**Feature Branch**: `002-dashboard-home`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "Phase 2 of the Meska Brain plan — signed-in landing page at `/home` with greeting, Profile Progress card, top nav (no sidebar), and tagline."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a personalized landing page after sign-in (Priority: P1)

After signing in, a member arrives at `/home` and immediately sees a personalized greeting using their stored first and last name plus a card showing how far along their profile is.

**Why this priority**: `/home` is the routing target of every successful sign-in. Without it, signed-in users have nowhere coherent to land.

**Independent Test**: Sign in with any account, observe routing to `/home`, and verify the greeting renders with the user's first/last name and the progress card displays the current completion percentage.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** sign-in succeeds, **Then** they are routed to `/home` regardless of profile completion state.
2. **Given** a signed-in user lands on `/home`, **When** the page renders, **Then** the greeting reads `Welcome back, {First Name} {Last Name} 👋` using the values stored on the user record.
3. **Given** a Google-sign-up user, **When** they reach `/home` for the first time, **Then** the greeting uses the first/last name pulled from the Google profile.
4. **Given** an email/password sign-up user, **When** they reach `/home`, **Then** the greeting uses the first/last name they entered during sign-up.
5. **Given** any signed-in user on `/home`, **When** the page renders, **Then** the tagline "News built for you. Not for the feed." appears below the Profile Progress card.

---

### User Story 2 - Track and act on profile completion (Priority: P1)

A signed-in user sees their current profile completion percentage on `/home`, with a single clear call-to-action that opens the profile wizard. When their profile is fully complete, the card confirms completion instead of prompting further action.

**Why this priority**: Driving profile completion is the entire purpose of `/home`; personalization downstream depends on it.

**Independent Test**: For three users (0%, 33%, 66%, 100% complete), open `/home` and verify the card shows the correct percentage, the progress bar fills proportionally, and the button visibility/behavior matches the spec.

**Acceptance Scenarios**:

1. **Given** a user with 0 of 3 profile forms saved, **When** they open `/home`, **Then** the Profile Progress card shows 0% and the "Complete Profile" button is visible.
2. **Given** a user with Form 1 saved, **When** they open `/home`, **Then** the card shows ~33%.
3. **Given** a user with Form 1 + Form 2 saved, **When** they open `/home`, **Then** the card shows ~66%.
4. **Given** a user with all three forms saved, **When** they open `/home`, **Then** the card shows 100%, the "Complete Profile" button is hidden, and a "Profile complete ✓" confirmation appears in its place.
5. **Given** an incomplete-profile user, **When** they click "Complete Profile", **Then** they are routed into the profile wizard (the Phase 3 feature). They are not auto-routed at sign-in.
6. **Given** any user on `/home`, **When** the page renders the card, **Then** the percentage, progress bar fill, and button styling all use the same neon blue accent gradient used elsewhere in the app.
7. **Given** a user who edits their first/last name in Form 1 and saves it, **When** they return to `/home`, **Then** the greeting reflects the updated name.

---

### User Story 3 - Navigate the dashboard via the top bar (Priority: P1)

Every dashboard page (starting with `/home`) presents a persistent top navigation bar with the wordmark, Home and Profile tabs, and a Sign Out button. There is no left sidebar.

**Why this priority**: The top nav is the only navigation surface on dashboard pages. Without it, members cannot move between Home/Profile or sign out.

**Independent Test**: On `/home`, locate the wordmark, Home tab, Profile tab, and Sign Out button in the top nav; click each and verify the resulting behavior.

**Acceptance Scenarios**:

1. **Given** a user on `/home`, **When** the page renders, **Then** a top navigation bar shows the "Meska Brain" wordmark on the far left, Home and Profile tabs to its right, and a Sign Out button on the far right.
2. **Given** a user on `/home`, **When** they click the Meska Brain wordmark, **Then** they are routed to `/home` (not `/`).
3. **Given** a user on `/home`, **When** they click the Profile tab, **Then** they are routed to `/profile`.
4. **Given** a user on `/home`, **When** the page renders, **Then** the Home tab is styled as active with the neon blue accent.
5. **Given** a user on `/home`, **When** they click Sign Out, **Then** their authentication session ends and they are routed to `/signin`.
6. **Given** a user on `/home`, **When** the page renders, **Then** the dark left sidebar shown in the reference image is NOT present, and the "Active ●" indicator from the reference image is NOT present.
7. **Given** a user on `/home`, **When** they view it on a mobile viewport, **Then** multi-line text blocks retain the same line count as desktop. The mobile collapse pattern for the top nav is acknowledged as deferred (see Out of Scope).

---

### Edge Cases

- User reaches `/home` while their profile has been partially saved on another device → percentage reflects the latest persisted state at render time; live updates while the page is open are not required.
- User clicks "Complete Profile" while the previous click is still navigating → only one navigation is initiated.
- User signs out then attempts to use the browser Back button to return to `/home` → the system enforces that `/home` is unreachable without an active session.
- User opens `/home` directly via URL without being signed in → they are routed to `/signin`.
- User's first or last name is missing (e.g., Google profile lacks one) → the greeting still renders without an awkward gap (handled per Assumptions).
- User views `/home` at 360px, 768px, 1280px, 1920px wide → the hero greeting and tagline retain the same line count across viewports.
- User's profile completion crosses 100% during the session → on next render of `/home`, the "Profile complete ✓" state is shown.

## Requirements *(mandatory)*

### Functional Requirements

**Routing & access control**

- **FR-001**: The system MUST expose the dashboard home at the route `/home`, accessible only to signed-in users.
- **FR-002**: After successful sign-in, the system MUST route the user to `/home` regardless of their profile completion state.
- **FR-003**: An unauthenticated request to `/home` MUST be routed to `/signin`.

**Greeting**

- **FR-004**: `/home` MUST render a large greeting at the top of the page in the format `Welcome back, {First Name} {Last Name} 👋`, ending with the waving-hand emoji.
- **FR-005**: The first and last name used in the greeting MUST come from the user record (sourced originally from Google profile or sign-up form per the user's auth method).
- **FR-006**: When the stored first or last name changes (e.g., via Phase 3 Form 1), the greeting MUST reflect the new value on next render of `/home`.

**Profile Progress card**

- **FR-007**: `/home` MUST render a Profile Progress card centered below the greeting.
- **FR-008**: The card MUST contain: a circular profile-person icon at the top; the title "Profile Progress"; a short subtitle explaining that completing the profile unlocks personalized delivery; a "COMPLETION STATUS" label on the left; a percentage value on the right (using the neon blue color); and a horizontal progress bar filled proportionally with the neon blue gradient.
- **FR-009**: The completion percentage MUST be derived from the three Phase 3 profile forms: 0 saved = 0%, Form 1 only = ~33%, Form 1+2 = ~66%, all three = 100%.
- **FR-010**: When percentage < 100%, the card MUST render a full-card-width "Complete Profile" button below the bar, with the neon blue gradient background, a person-with-plus icon, and the text "Complete Profile". Clicking it MUST route the user to `/profile`.
- **FR-011**: When percentage = 100%, the "Complete Profile" button MUST be hidden, and the card MUST render a "Profile complete ✓" confirmation message in its place.
- **FR-012**: No checklist of individual completed items MUST be shown under the bar; only the percentage and the bar appear.

**Tagline**

- **FR-013**: `/home` MUST render the tagline "News built for you. Not for the feed." below the Profile Progress card.

**Top navigation**

- **FR-014**: Every dashboard page (starting with `/home` and `/profile`) MUST render a top navigation bar across the top of the page.
- **FR-015**: The top nav MUST contain, left to right: a "Meska Brain" wordmark, Home and Profile tabs, and a Sign Out button on the far right.
- **FR-016**: The wordmark in the dashboard top nav MUST route to `/home` (not `/`).
- **FR-017**: The active tab MUST be styled with the neon blue accent.
- **FR-018**: The Sign Out button MUST be persistently visible (not hidden inside a dropdown).
- **FR-019**: Clicking Sign Out MUST end the user's authentication session and route to `/signin`.
- **FR-020**: The dark left sidebar shown in the reference image MUST NOT be present on any dashboard page.
- **FR-021**: The "Active ●" indicator shown in the bottom-right of the reference image MUST NOT be present on `/home`.

**Visual & responsive**

- **FR-022**: All dashboard pages MUST use a white background with neon blue accents. The dark space theme MUST NOT be used on dashboard pages.
- **FR-023**: The neon blue gradient used on the progress bar fill and the "Complete Profile" button MUST be the same gradient used on the Phase 1 "Sign up" button and the Phase 1 headline accent.
- **FR-024**: `/home` MUST render visually consistent on web and mobile. Multi-line text blocks MUST retain the same line count across viewport sizes.

### Key Entities

- **User** (read-only on `/home`): identifier, first name, last name. Greeting source.
- **ProfileCompletion** (derived, read-only on `/home`): a percentage in {0%, ~33%, ~66%, 100%} derived from which of the three Phase 3 forms are saved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After successful sign-in, the user lands on `/home` and sees the greeting plus Profile Progress card within 2 seconds on a typical broadband connection.
- **SC-002**: 100% of `/home` renders show the correct completion percentage for the current persisted profile state (verified against the four documented levels: 0%, ~33%, ~66%, 100%).
- **SC-003**: 100% of users with a fully complete profile see the "Profile complete ✓" confirmation and no "Complete Profile" button.
- **SC-004**: Clicking "Complete Profile" routes the user to `/profile` in under 500ms in typical conditions.
- **SC-005**: Clicking Sign Out ends the session and routes the user to `/signin` for 100% of attempts.
- **SC-006**: Across viewports (360px, 768px, 1280px, 1920px wide), the greeting and tagline retain the same line count, verified by visual inspection.
- **SC-007**: 0% of unauthenticated requests to `/home` are served the dashboard; 100% are routed to `/signin`.

## Assumptions

- Sign-in itself is implemented separately; this spec only relies on the post-sign-in route being `/home` and the user record having a first and last name.
- "Neon blue gradient" is the same single gradient defined for the app and applied consistently across Phase 1, Phase 2, and Phase 3.
- When a first or last name is missing in the user record, the greeting still renders gracefully (collapsing whitespace, e.g., `Welcome back, Sarah 👋`).
- Profile completion is derived at render time from saved-form state; live updates while `/home` is open are not required.
- The Phase 3 wizard at `/profile` exists as a downstream feature; this spec only requires the route target and the contract that saved forms drive the percentage.
- Accessibility (WCAG), analytics events, error-tracking integration, and rate-limiting are out of scope for this spec.

## Out of Scope

- The profile wizard itself (Phase 3).
- The exact mobile collapse pattern for the top nav (e.g., hamburger menu, drawer). Acknowledged as deferred to a later interview.
- Notifications, content previews, or any feed/article surfaces on `/home` beyond the greeting, Profile Progress card, and tagline.
- Subscription / billing flows.
- Internationalization of `/home` copy.
