# Feature Specification: Profile Wizard

**Feature Branch**: `003-profile-wizard`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "Phase 3 of the Meska Brain plan — three-step profile wizard at `/profile` (Identity / Bio-Link / Finalize) that captures personalization data and drives the completion percentage on `/home`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Form 1: Personal Information (Priority: P1)

A signed-in user opens the Profile tab, sees Form 1 with their first and last name auto-filled, fills in the remaining fields, and advances to Form 2.

**Why this priority**: Form 1 is the entry point of the wizard and the first 33% of completion. Without it, no profile data flows downstream.

**Independent Test**: Sign in, open `/profile`, verify first/last name are auto-filled, complete all fields validly, click Next Step, and verify the user lands on Form 2 with data persisted.

**Acceptance Scenarios**:

1. **Given** a user opens `/profile` for the first time, **When** Form 1 renders, **Then** First Name and Last Name are auto-filled from the user record and remain editable; no Back button is present.
2. **Given** Form 1, **When** the user clicks Next Step with one or more required fields empty, **Then** each missing field shows an inline error directly below it and the field border turns to an error color; the user remains on Form 1.
3. **Given** Form 1, **When** the user submits a WhatsApp number that is not valid E.164, **Then** an inline error appears under the WhatsApp field and no save occurs.
4. **Given** Form 1, **When** the user submits a LinkedIn URL not matching `https://(www.)linkedin.com/in/...`, **Then** an inline error appears directly under the field and no save occurs.
5. **Given** Form 1 with all fields valid, **When** the user clicks Next Step, **Then** the form data is persisted, the completion percentage updates to ~33%, and the user is routed to Form 2.
6. **Given** a user edits their First Name or Last Name on Form 1 and saves, **When** they return to `/home`, **Then** the greeting reflects the updated name.

---

### User Story 2 - Complete Form 2: Curate Your Intelligence (Priority: P1)

A user on Form 2 makes their personalization selections — AI usage, signup reason, exactly 3 topics, content depth preference, and delivery (language + channel) — then advances to Form 3.

**Why this priority**: Form 2 captures the routing inputs for personalized content. Without it, the product cannot tailor delivery.

**Independent Test**: From Form 2, attempt to advance with missing selections (verify per-section errors), then with exactly 3 topics selected, complete all sections and click Next; verify routing to Form 3 and saved data.

**Acceptance Scenarios**:

1. **Given** a user lands on Form 2 for the first time, **When** the page renders, **Then** no options are pre-selected in any section.
2. **Given** Form 2, **When** the user clicks Next with fewer or more than 3 topics selected, **Then** an inline error appears under the Topics section: "Please select exactly 3 topics." The user remains on Form 2.
3. **Given** Form 2, **When** the user clicks Next with any required section missing a selection, **Then** each missing section shows an inline error directly under it; no save occurs.
4. **Given** Form 2 with all required selections made (Current AI Usage, Main Reason, exactly 3 Topics, Content Consumption Preference, Language, Channel), **When** the user clicks Next, **Then** the form data is persisted, the completion percentage updates to ~66%, and the user is routed to Form 3.
5. **Given** Form 2, **When** the user clicks Back, **Then** they return to Form 1 with all previously-entered values still on screen.
6. **Given** Form 2 with "Both" selected as Language, **When** the form is saved, **Then** the system records that the user wants content in both English and Arabic.
7. **Given** Form 2, **When** the user toggles a pill in any single-select section, **Then** exactly one option is active in that section at a time.

---

### User Story 3 - Complete Form 3: Finalize Intelligence Sync (Priority: P1)

A user copies the fixed prompt, runs it externally, pastes the response (or skips it), submits, sees a one-time congratulations screen, and lands back on `/home` at 100%.

**Why this priority**: Form 3 marks the profile as 100% complete and triggers the celebratory completion experience that closes the onboarding loop.

**Independent Test**: From Form 3, click Copy Prompt and verify clipboard contents and "Copied!" feedback; click Submit & Sync (with empty or non-empty response); verify the congratulations screen appears with confetti and routes to `/home` showing 100% on click.

**Acceptance Scenarios**:

1. **Given** Form 3 is rendered, **When** the user clicks "Copy Prompt", **Then** the fixed prompt text is copied to the clipboard and a brief "Copied!" feedback appears.
2. **Given** Form 3, **When** the user clicks "Submit & Sync" with the response textarea empty, **Then** the submission still succeeds — the (possibly empty) response is persisted as-is, the profile is marked 100% complete, and the congratulations screen appears.
3. **Given** Form 3, **When** the user clicks "Submit & Sync" with a non-empty response, **Then** the response is persisted as-is (no application-layer encryption beyond what the data store provides), the profile is marked 100%, and the congratulations screen appears.
4. **Given** the congratulations screen, **When** it first appears, **Then** a one-time confetti animation plays (not looping), the headline "🎉 Profile complete! Your personalized intelligence sync is live." is visible, and a single "Go to Home" button is shown.
5. **Given** the congratulations screen, **When** the user clicks "Go to Home", **Then** they are routed to `/home`, where the Profile Progress card shows 100% and "Profile complete ✓".
6. **Given** the congratulations screen, **When** the user does nothing, **Then** the page does NOT auto-redirect — the user must click the button.
7. **Given** Form 3, **When** the user clicks Back, **Then** they return to Form 2 with all previously-entered values still on screen.

---

### Edge Cases

- User signs out mid-wizard then signs back in → the wizard re-opens at Form 1, regardless of which form was last viewed. Previously-saved data is still stored and is reloaded into the forms when revisited.
- User completes Form 1 and Form 2, then returns to Form 1 via the Profile tab → Form 1 still shows the saved values and remains editable.
- User opens `/profile` directly via URL after sign-out → routed to `/signin` (only signed-in users can reach `/profile`).
- User completes Form 1, then on Form 2 toggles topics rapidly past 3 selections → the validation error only appears on Next click, not during clicking.
- User clicks Next or Submit & Sync twice rapidly → only one save is processed; subsequent clicks during the in-flight save are ignored.
- User changes Channel later by re-entering Form 2 → the new Channel value overwrites the previous one; there is no separate "change channel" UI.
- User views any form at 360px, 768px, 1280px, 1920px wide → multi-line headers/subtitles retain the same line count across viewports.
- Submit & Sync fails server-side (transient error) → the user remains on Form 3 with their typed response intact and an actionable error is surfaced; the profile does NOT flip to 100% until a successful save.
- Clipboard access is denied by the browser → the "Copy Prompt" button surfaces a graceful fallback (e.g., the prompt text is still selectable) and indicates the copy did not succeed.
- The fixed prompt text is not yet finalized at implementation time → a clearly-marked placeholder may stand in until the final prompt is supplied (per Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

**Wizard shell & access**

- **FR-001**: The system MUST expose the profile wizard at the route `/profile`, accessible only to signed-in users.
- **FR-002**: An unauthenticated request to `/profile` MUST be routed to `/signin`.
- **FR-003**: The Profile tab in the dashboard top nav and the "Complete Profile" button on `/home` MUST both open the same wizard (the wizard IS the onboarding flow; no separate onboarding wizard exists).
- **FR-004**: The wizard MUST be presented as three sequential steps labeled, in order: Identity (Form 1), Bio-Link (Form 2), Finalize (Form 3).
- **FR-005**: A step indicator at the top of the page MUST visualize the three steps connected by a horizontal line. Active and completed step circles MUST use the neon blue accent (the active step shows its number in white); pending step circles MUST be gray.
- **FR-006**: The form MUST sit inside a centered card with a soft white surface and a subtle shadow on the light dashboard background.
- **FR-007**: The top navigation from Phase 2 (wordmark / Home / Profile / Sign Out) MUST be the only navigation on `/profile`. The dark left sidebar from the reference image MUST NOT be present.
- **FR-008**: Form 1 MUST NOT show a Back button. Forms 2 and 3 MUST show a Back button (plain text or outlined, no gradient) that returns the user to the previous form with all previously-entered data preserved on screen.
- **FR-009**: When a user signs out and signs back in, the wizard MUST always re-open at Form 1, regardless of which form was last viewed. Previously-saved field values MUST still be reloaded into their respective forms.
- **FR-010**: Each form's Next/Submit button MUST appear in the bottom-right of the card with the neon blue gradient and a right-arrow (or sync) icon, as specified per form below.

**Form 1 — Personal Information**

- **FR-011**: Form 1 MUST display the title "Personal Information" and a short subtitle in the documented tone (e.g., "Define your digital signature. This metadata helps Meska Brain calibrate its cognitive filters for you.").
- **FR-012**: Form 1 MUST contain five fields, arranged in two columns where space allows: First Name, Last Name, WhatsApp, "How did you hear about us?", LinkedIn URL.
- **FR-013**: First Name and Last Name MUST be auto-filled from the stored user record and remain editable. Both are required.
- **FR-014**: The WhatsApp field MUST be required, accept E.164-formatted numbers, and include a country code picker. No verification SMS or code is sent.
- **FR-015**: "How did you hear about us?" MUST be a required dropdown with options: Google, LinkedIn, Twitter / X, Friend, Meska Community, Other.
- **FR-016**: LinkedIn URL MUST be required and MUST match the pattern `https://(www.)linkedin.com/in/...`. A non-matching value MUST surface an inline error directly under the field.
- **FR-017**: All Form 1 validations MUST run only on Next Step click (not on type, not on blur). Invalid fields MUST display an inline error directly below them; the field border MUST turn to an error color.
- **FR-018**: On valid submit, Form 1 MUST persist its data to the user record, update the completion percentage to reflect Form 1 saved (~33% if not previously saved), and route the user to Form 2.
- **FR-019**: If First Name or Last Name is edited and saved, downstream consumers (e.g., the `/home` greeting) MUST reflect the new values on next render.

**Form 2 — Curate Your Intelligence**

- **FR-020**: Form 2 MUST display the title "Curate Your Intelligence" and the subtitle "Refine the Meska Brain to match your professional cadence."
- **FR-021**: Form 2 MUST present five sections, stacked vertically, in this order: (1) Current AI Usage, (2) Main Reason for Signing Up, (3) Topics of Interest, (4) Content Consumption Preference, (5) Delivery Preferences.
- **FR-022**: "Current AI Usage" MUST be a single-select pill group with options: Just getting started, Casual user, Daily user, Builder.
- **FR-023**: "Main Reason for Signing Up" MUST be a single-select pill group with options: Stay current, Find tools, Learn deeply, Lead AI transformation.
- **FR-024**: "Topics of Interest" MUST present a multi-select chip grid with these chips: Generative AI, LLM Research, AI Ethics, Prompt Engineering, Robotics, AI Policy, Autonomous Agents, Compute Infrastructure, Neuroscience, Coding Assistants, Voice AI, Venture Capital, Cybersecurity. The user MUST select exactly 3. Submission with fewer or more MUST surface the inline error "Please select exactly 3 topics." The "Add Topic" affordance MUST NOT be present in this phase.
- **FR-025**: "Content Consumption Preference" MUST be a single-select pill group with options: Quick, Short, Medium, Deep.
- **FR-026**: The "Delivery Preferences" section MUST be visually grouped inside a slightly darker gray sub-card with the title "Delivery Preferences" and the subtitle "Routes everything downstream." The sub-card MUST contain two rows: Language and Channel.
- **FR-027**: Language MUST be a single-select toggle with options English, Arabic, Both. "Both" MUST be persisted to mean the user wants content in both English and Arabic.
- **FR-028**: Channel MUST be a single-select toggle with options WhatsApp, Telegram, Email. Only one channel may be active. Changing channels later requires returning to Form 2.
- **FR-029**: No option in Form 2 MUST be pre-selected when the form first opens.
- **FR-030**: Selected pills/chips MUST use the neon blue gradient background with white text. Unselected pills/chips MUST have a white background with a subtle gray border.
- **FR-031**: All Form 2 validations MUST run only on Next click (not on type/click). Each invalid section MUST display an inline error directly under it; the Topics section error message MUST be "Please select exactly 3 topics."
- **FR-032**: On valid submit, Form 2 MUST persist its data, update the completion percentage to reflect Form 1 + Form 2 saved (~66% if not previously beyond), and route the user to Form 3.
- **FR-033**: Clicking Back on Form 2 MUST return the user to Form 1 with the previously-entered values preserved on screen.

**Form 3 — Finalize Intelligence Sync**

- **FR-034**: Form 3 MUST display the title "Finalize Intelligence Sync" and the subtitle "Connect your neural processing layers by executing the baseline prompt and feeding the intelligence back into the system."
- **FR-035**: Form 3 MUST present a code-block surface with monospaced styling containing a fixed prompt string. A "PHASE 01" tag MUST appear in the top-left of the code block; a "Copy Prompt" button MUST appear in the top-right.
- **FR-036**: Clicking "Copy Prompt" MUST copy the prompt text to the user's clipboard and display brief "Copied!" feedback (toast or inline). No "Open ChatGPT" button MUST be present.
- **FR-037**: Below the prompt block, a label "PHASE 02 Paste response here" MUST appear above a multi-line textarea with placeholder copy such as "Paste the intelligence manifest response from your local LLM or processing environment...".
- **FR-038**: The response textarea MUST NOT be validated. Submission MUST succeed even when the textarea is empty.
- **FR-039**: A "Submit & Sync" button MUST be centered below the response field, styled with the neon blue gradient background and containing a sync/refresh icon plus the label "Submit & Sync".
- **FR-040**: Clicking "Submit & Sync" MUST persist the response text as-is to the user record (no application-layer encryption beyond the data store's own at-rest encryption), mark the user's profile as 100% complete, and trigger the congratulations screen.
- **FR-041**: A Back button (plain text or outlined, no gradient) MUST be positioned below the Submit & Sync button, centered on the card. Clicking it MUST return the user to Form 2 with values preserved on screen.

**Congratulations screen**

- **FR-042**: After a successful Submit & Sync, the page MUST transition to a full-page success screen that takes over the whole content area (no card layout).
- **FR-043**: The success screen MUST contain: a celebratory headline "🎉 Profile complete! Your personalized intelligence sync is live."; a one-time confetti animation that bursts when the screen first appears (no loop); and a single primary "Go to Home" button styled with the neon blue gradient.
- **FR-044**: The success screen MUST NOT auto-redirect. Clicking "Go to Home" MUST route the user to `/home`.
- **FR-045**: On arriving at `/home` after this flow, the Profile Progress card MUST reflect 100% (the "Complete Profile" button hidden, the "Profile complete ✓" confirmation shown), as defined by the Phase 2 spec.

**Visual & responsive**

- **FR-046**: The neon blue gradient used on the active step circle, the Next Step buttons of Forms 1 and 2, the Submit & Sync button, and the "Go to Home" button MUST be the same gradient used throughout the rest of the app.
- **FR-047**: The `/profile` page MUST render visually consistent on web and mobile. Multi-line text blocks (titles, subtitles, helper lines) MUST retain the same line count across viewport sizes.

**Persistence**

- **FR-048**: All Form 1, Form 2, and Form 3 data MUST be persisted to the user's record and survive sign-out and sign-in.
- **FR-049**: The user's profile completion state MUST be derivable from saved-form state so that the percentage shown on `/home` always matches current persisted state.
- **FR-050**: When the user revisits a previously-saved form, the saved values MUST be reloaded into the fields.

### Key Entities

- **PersonalInfo (Form 1)**: One per user. Attributes: WhatsApp number (E.164), referral source (Google / LinkedIn / Twitter-X / Friend / Meska Community / Other), LinkedIn URL. Belongs to one User. Form 1 also updates first/last name on the User record itself.
- **CurationPreferences (Form 2)**: One per user. Attributes: current AI usage (enum), main reason for signing up (enum), topics of interest (exactly 3 values from the fixed taxonomy), content consumption preference (enum), language (English / Arabic / Both), channel (WhatsApp / Telegram / Email). Belongs to one User.
- **IntelligenceSync (Form 3)**: One per user. Attributes: pasted response text (free-form, may be empty), submitted-at timestamp. Belongs to one User.
- **ProfileCompletion (derived)**: Derived from which of Form 1, Form 2, Form 3 are saved. Values used by `/home`: 0%, ~33%, ~66%, 100%.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the full wizard end-to-end (Form 1 → Form 2 → Form 3 → congratulations → `/home`) in under 5 minutes, assuming they have the requested information ready.
- **SC-002**: 100% of submissions with valid inputs persist successfully; the resulting completion percentage matches the documented levels (~33% / ~66% / 100%) on the next render of `/home`.
- **SC-003**: 100% of submissions of Form 2 with a topics count ≠ 3 are blocked with the documented inline error and produce no save.
- **SC-004**: 100% of submissions of Form 1 with an invalid LinkedIn URL or invalid WhatsApp E.164 number are blocked with field-level inline errors and produce no save.
- **SC-005**: At least 60% of users who reach Form 1 reach 100% completion within their first week.
- **SC-006**: 100% of Submit & Sync clicks (with empty or non-empty response) that succeed surface the congratulations screen with the confetti animation playing exactly once.
- **SC-007**: 0% of Submit & Sync events auto-redirect to `/home`; 100% require an explicit "Go to Home" click.
- **SC-008**: Across viewports (360px, 768px, 1280px, 1920px wide), every form's title, subtitle, and helper-line text retains the same line count, verified by visual inspection.
- **SC-009**: When a user edits and saves their first/last name in Form 1, the `/home` greeting reflects the new name on the next render in 100% of cases.

## Assumptions

- The Phase 3 wizard runs on top of the Phase 1 user record and the Phase 2 dashboard shell; both are assumed to exist.
- "Neon blue gradient" is the same single gradient used in Phases 1 and 2.
- The Form 3 prompt text is a fixed string supplied prior to implementation; a clearly-marked placeholder may stand in until the final text is provided.
- The Form 3 response is stored as plain text in the user record; the data store's own at-rest encryption is sufficient — no application-layer encryption is applied.
- WhatsApp numbers are accepted at face value; no verification SMS or code is sent.
- The "Add Topic" affordance shown in some references is explicitly deferred and is NOT part of this spec.
- Accessibility (WCAG), analytics events, error-tracking integration, rate-limiting, anti-abuse protections, and offline/PWA behavior are out of scope for this spec.
- Mobile-specific top nav behavior is deferred (see Phase 2 spec).

## Out of Scope

- The personalization pipeline itself (how content is selected, generated, and delivered to WhatsApp / Telegram / Email based on the Form 2 selections).
- The "Add Topic" custom-topic feature.
- Sending verification SMS for WhatsApp or running any LinkedIn URL liveness check beyond format validation.
- Resume-from-last-form behavior across sessions (intentionally NOT supported — the wizard always restarts at Form 1).
- Admin or operator tooling for inspecting profile data.
- Internationalization of wizard copy.
