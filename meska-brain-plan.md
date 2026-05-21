# Meska Brain — Plan

## Product brief

Meska Brain is a hyper-personalized AI news and articles delivery service. Each member receives content tailored to them through their preferred channel: WhatsApp, Telegram, or Email.

To enable personalization, every member fills a 3-form profile inside the dashboard's Profile tab. Each form is separated by a Next button.

**Form 1 — Personal info**
- WhatsApp number
- LinkedIn URL
- How did you hear about us?

(First name and last name are collected during sign-up — see Phase 1 — and auto-filled into Form 1 where they remain editable.)

**Form 2 — Bio info**
- Current AI Usage (single choice): Just getting started / Casual user / Daily user / Builder
- Main Reason for Signing Up (single choice): Stay current / Find tools / Learn deeply / Lead AI transformation
- Topics of Interest (pick 3): Generative AI, LLM Research, AI Ethics, Prompt Engineering, Robotics, AI Policy, Autonomous Agents, Compute Infrastructure, Neuroscience, Coding Assistants, Voice AI, Venture Capital, Cybersecurity. Plus an "Add Topic" option.
- Content Consumption Preference (single choice): Quick / Short / Medium / Deep
- Delivery Preferences:
  - Language: English / Arabic / Both
  - Channel: WhatsApp / Telegram / Email

**Form 3 — Final intelligence sync**
- A fixed prompt is displayed for the user to copy.
- The user pastes the prompt into ChatGPT, gets a response, and pastes that response back into a text box.
- On submit, a congratulations message confirms the profile is complete.

The implementation will use Spec Kit (spec-driven development).

---

## Phase 1 — Sign-up page

The sign-up page must follow the provided reference image exactly.

### Visual

- Dark blue night-sky background with stars.
- The background is animated: twinkling stars with a parallax effect.
- A mesh blue glow sits behind the sign-up form (the cool blue mesh visible behind the card in the reference image), with the dark starry sky behind that.
- The page uses the same color contrast as the reference image — the dark blue background and the blue tint used in the headline text.
- The "AI HYPERPERSONALIZED NEWSLETTER" pill badge has a leading dot that is rendered as small bright stars moving in 2D, matching the dark starry sky aesthetic.

### Header

- "Meska Brain" wordmark in the top-left.
- Clicking the wordmark routes to `/`.

### Auth options

- The sign-up card offers two ways to create an account:
  1. Sign up with Google.
  2. Sign up with email and password.
- The LinkedIn option shown in the reference image is removed and replaced by the Google option.
- The Google button matches the visual styling of the LinkedIn button in the reference image (same shape, position, and treatment).

### Email and password form

- First name field.
- Last name field.
- Email field.
- Password field with an eye icon that toggles password visibility.
- A live password strength meter under the password field, updating as the user types (weak / medium / strong).
- Password rules: minimum 8 characters, with at least 1 uppercase letter, 1 number, and 1 symbol.

### Name handling

- For email/password sign-up, the first name and last name come from the sign-up form fields above.
- For Google sign-up, the first name and last name are pulled automatically from the user's Google profile.
- In both cases, the name is stored on the user record and used to greet the user inside the dashboard.

### Validation

- Validation runs only on submit (not as the user types, not on blur).
- The password strength meter is the only thing that updates live.
- If the email already exists, show an inline error: "An account with this email already exists. Sign in instead."

### Submit behavior

- After a successful sign-up, the user is routed to the Sign In page to log in.
- No email verification is required.
- No auto-login after sign-up.

### Sign in tab

- The "SIGN IN" tab at the top of the card navigates to a separate `/signin` page (not an in-place tab switch).

### Terms and conditions

- No terms and conditions checkbox for now.

### Routes

- Sign-up page: `/signup`
- Sign-in page: `/signin`

### Auth provider

- Supabase Auth handles both the email/password flow and the Google OAuth flow.

### Responsive behavior

- The design must look the same on web and mobile.
- Multi-line text blocks must keep the same line count across all viewport sizes. If the hero is 2 lines on desktop, it must stay 2 lines on mobile — not 3 or more. Text must not look awkward after shrinking.

---

## Phase 2 — Dashboard home

The dashboard home is the landing page a user sees after signing in. It must follow the provided reference image exactly, except for the navigation layout (the dark left sidebar in the reference is removed).

### Visual

- The whole dashboard uses a white background with neon blue accents — the styling shown on the right side of the reference image.
- No dark space theme on dashboard pages.

### Navigation (replaces the dark sidebar in the reference)

- A top navigation bar runs across the top of every dashboard page.
- Layout, left to right:
  - "Meska Brain" wordmark on the far left. Clicking it routes to `/home` (not the root).
  - Two tabs: **Home** and **Profile**. The active tab is styled with the neon blue accent.
  - **Sign Out** button on the far right, visible at all times (not hidden inside a dropdown).
- The dark left sidebar shown in the reference image is removed entirely.

### Greeting

- A large greeting at the top of the page: `Welcome back, {First Name} {Last Name} 👋`
- The waving-hand emoji 👋 appears at the end.
- The name source:
  - For Google sign-up users, the name comes from the Google profile.
  - For email/password sign-up users, the name comes from the first name and last name fields they filled in during sign-up.

### Profile Progress card

A card centered below the greeting, following the reference image:

- A circular icon at the top of the card (the profile-person icon in the reference).
- Title: **Profile Progress**.
- Subtitle: short explanation that completing the profile unlocks personalized delivery.
- A label **COMPLETION STATUS** on the left.
- A percentage on the right (e.g. `65%`) using the neon blue color.
- A horizontal progress bar below them, filled to the percentage with the same neon blue gradient used on the "Complete Profile" button and on the "AI insights" text from Phase 1.
- A **Complete Profile** button below the bar:
  - Full card width.
  - Neon blue gradient background — the exact same gradient used in Phase 1 for the "Sign up" button and the headline accent.
  - Contains a person-with-plus icon and the text "Complete Profile".
  - Clicking the button routes the user to the **Profile tab** inside the dashboard.

### Completion percentage

- The percentage is calculated from the 3 onboarding steps:
  - Step 1 complete = ~33%
  - Step 1 + Step 2 complete = ~66%
  - All 3 steps complete = 100%
- No detailed checklist items are shown under the progress bar — just the percentage and the bar.

### When the profile is 100% complete

- The Complete Profile button is hidden.
- In its place, the card shows a "Profile complete ✓" confirmation message.

### Sign-in routing

- After a user signs in, they are always routed to `/home`.
- If their profile is incomplete, they see the Complete Profile card on `/home` and can click into it from there. They are not auto-routed into an onboarding step.

### Sign Out

- Clicking Sign Out ends the Supabase session and routes the user back to `/signin`.

### Tagline

- A small tagline shown on the dashboard home, below the Profile Progress card:
  `News built for you. Not for the feed.`

### Active indicator

- The "Active ●" indicator visible in the bottom-right of the reference image is removed.

### Routes

- Dashboard home: `/home`
- Profile tab: `/profile` (to be detailed in Phase 3)

### Responsive behavior

- Same rule as Phase 1: the design must look consistent on web and mobile. Text blocks keep the same line count across viewport sizes.
- On mobile, the top navigation collapses appropriately (exact mobile nav pattern to be decided when we get there — flag for later interview).

---

## Phase 3 — Profile tab

The Profile tab is a 3-form wizard the user fills to complete their profile. It must follow the provided reference image, except for the dark left sidebar (which is removed — the top navigation from Phase 2 applies here).

### Relationship to the rest of the app

- The Profile tab **is** the onboarding flow. There is no separate onboarding wizard outside the dashboard.
- The "Complete Profile" button on `/home` and the "Profile" tab in the top navigation both open this same wizard.
- The completion percentage on `/home` tracks completion of these 3 forms: Form 1 done = ~33%, Form 1 + Form 2 done = ~66%, all 3 done = 100%.

### Shared layout for all 3 forms

- White background with neon blue accents, consistent with Phase 2.
- The dark left sidebar shown in the reference image is removed. The top navigation from Phase 2 (Meska Brain wordmark / Home / Profile / Sign Out) is the only navigation on this page.
- At the top of the page, a step indicator shows three steps connected by a horizontal line:
  1. **Identity**
  2. **Bio-Link**
  3. **Finalize**
- The active step's circle is filled with the neon blue accent and shows its number in white. Completed steps are also filled with the neon blue accent. Pending steps are gray.
- The form sits inside a centered card with a soft white surface and a subtle shadow, on the light background.
- The neon blue accent color (the same gradient used in Phase 1 for the "Sign up" button and the headline accent, and in Phase 2 for the progress bar and "Complete Profile" button) is used on the active step circle and on the Next Step / Back buttons of all forms.

### Step progression rules

- A Back button appears on Forms 2 and 3 only. Form 1 has no Back button because there is nothing to go back to.
- When a user signs out and returns later, the wizard always starts from Form 1 — it does not resume from the form they were last on.

---

### Phase 3 — Form 1: Personal Information

#### Header inside the card

- Title: **Personal Information**.
- Subtitle: a short helper line, e.g. "Define your digital signature. This metadata helps Meska Brain calibrate its cognitive filters for you." (matches the tone of the reference image).

#### Fields

The form has 5 fields, arranged in two columns where space allows (as in the reference image):

1. **First Name** — auto-filled from the database (sourced originally from sign-up or Google profile). Editable. Required.
2. **Last Name** — auto-filled from the database. Editable. Required.
3. **WhatsApp** — required. E.164 format with a country code picker, same input pattern as defined for Phase 1. The number is accepted at face value; no verification code is sent.
4. **How did you hear about us?** — dropdown, required. Options:
   - Google
   - LinkedIn
   - Twitter / X
   - Friend
   - Meska Community
   - Other
5. **LinkedIn URL** — required. Must match the LinkedIn profile URL format `https://(www.)linkedin.com/in/...`. If the value does not match, show an inline error directly under the field.

#### Behavior

- If the user edits First Name or Last Name, the greeting on `/home` ("Welcome back, {First Name} {Last Name} 👋") updates to reflect the new values after the form is saved.
- Validation runs on Next Step click (not as the user types). Each invalid field shows an inline error below it; the field border turns to an error color.
- The Next Step button is in the bottom-right of the card, with the neon blue gradient background and a right-arrow icon.
- Clicking Next Step:
  1. Validates all fields.
  2. If valid, saves the form data to the database.
  3. Routes the user to Form 2 inside the Profile tab.
- No Back button on this form.

---

### Phase 3 — Form 2: Curate Your Intelligence

#### Header inside the card

- Title: **Curate Your Intelligence**.
- Subtitle: "Refine the Meska Brain to match your professional cadence."

#### Sections

The form has 5 sections, stacked vertically in this order.

##### 1. Current AI Usage

- Question: "How would you describe your current AI usage?"
- Helper line under the question: "AI fluency drives content depth + tone."
- Single-select pill buttons:
  - Just getting started
  - Casual user
  - Daily user
  - Builder
- The selected pill uses the neon blue gradient background with white text. Unselected pills have a white background with a subtle gray border.
- No default selection.

##### 2. Main Reason for Signing Up

- Question: "What's the main reason you signed up?"
- Helper line: "Primary goal determines content type mix."
- Single-select pill buttons:
  - Stay current
  - Find tools
  - Learn deeply
  - Lead AI transformation
- Same pill styling and selected/unselected treatment as section 1.
- No default selection.

##### 3. Topics of Interest

- Question: "Which 3 topics matter most to you?"
- Helper line: "Topic affinity is the core routing input."
- Multi-select chips, displayed in a wrapping grid:
  - Generative AI
  - LLM Research
  - AI Ethics
  - Prompt Engineering
  - Robotics
  - AI Policy
  - Autonomous Agents
  - Compute Infrastructure
  - Neuroscience
  - Coding Assistants
  - Voice AI
  - Venture Capital
  - Cybersecurity
- Selected chips use the neon blue gradient background with white text. Unselected chips have a white background with a subtle gray border.
- The user must select **exactly 3** topics. If they submit with fewer or more, show an inline error under the section: "Please select exactly 3 topics."
- The "Add Topic" feature is deferred — it is not part of this phase and will be discussed later.

##### 4. Content Consumption Preference

- Question: "How do you like to consume content?"
- Helper line: "Depth preference shapes every variant."
- Single-select pill buttons:
  - Quick
  - Short
  - Medium
  - Deep
- Same pill styling and selected/unselected treatment as section 1.
- No default selection.

##### 5. Delivery Preferences

This section is visually grouped inside a slightly darker gray sub-card to separate it from the sections above, as shown in the reference image.

- Section title inside the sub-card: **Delivery Preferences**.
- Section subtitle: "Routes everything downstream."

The sub-card contains two rows:

**Row 1 — Language**
- Label: "Language"
- Helper line: "Select your primary output language."
- Single-select pill toggle on the right side of the row with three options:
  - English
  - Arabic
  - Both
- Choosing **Both** means the user wants to receive content in both English and Arabic.
- The selected pill uses the neon blue gradient background with white text.
- No default selection.

**Row 2 — Channel**
- Label: "Channel"
- Helper line: "Where should we deliver intelligence?"
- Single-select pill toggle on the right side of the row with three options:
  - WhatsApp
  - Telegram
  - Email
- Only one channel can be selected. To change channels later, the user must return to this form.
- No default selection.

#### Behavior

- No fields are pre-selected when the user first opens Form 2.
- Validation runs on Next click (not as the user types/clicks). Each invalid section shows an inline error directly under it; missing required selections are flagged with a clear message.
- The Topics section enforces exactly 3 selections — fewer or more triggers the error message described in section 3.
- The **Back** button is in the bottom-left of the card. It is a plain text or outlined button (no gradient). Clicking Back returns the user to Form 1 with the previously-entered data preserved on screen.
- The **Next** button is in the bottom-right of the card with the neon blue gradient background and a right-arrow icon. Clicking Next:
  1. Validates all sections.
  2. If valid, saves the form data to the database.
  3. Routes the user to Form 3 inside the Profile tab.

---

### Phase 3 — Form 3: Finalize Intelligence Sync

#### Header inside the card

- Title: **Finalize Intelligence Sync**.
- Subtitle: "Connect your neural processing layers by executing the baseline prompt and feeding the intelligence back into the system."

#### Fixed prompt block

- A code-block surface with monospace font styling, matching the reference image.
- The prompt text inside is a fixed string that will be provided later (placeholder for now — to be supplied before implementation).
- A label "PHASE 01" sits in the top-left of the code block, styled as a small uppercase tag.
- A "Copy Prompt" button sits in the top-right of the code block. Clicking it:
  1. Copies the prompt text to the user's clipboard.
  2. Shows a brief "Copied!" toast or inline feedback.
- There is no "Open ChatGPT" button. The user is expected to bring the response back on their own.

#### Response field

- A label "PHASE 02 Paste response here" above the field, styled like a section label.
- A multi-line textarea below the label, with placeholder text such as "Paste the intelligence manifest response from your local LLM or processing environment...".
- **No validation on this field.** The user can submit even if the textarea is empty.
- The response is saved as-is to the user's record in the Supabase database. No application-layer encryption is applied (Supabase's own at-rest encryption is sufficient).

#### Submit & Sync button

- Centered below the response field.
- Neon blue gradient background — same gradient used everywhere else in the app.
- Contains a sync / refresh icon and the label "Submit & Sync".
- Clicking the button:
  1. Saves the response to the database.
  2. Marks the user's profile as 100% complete.
  3. Triggers the congratulations screen described below.

#### Back button

- Plain text or outlined button (no gradient), styled the same as the Back button on Form 2.
- Positioned below the Submit & Sync button, centered on the card.
- Clicking it returns the user to Form 2 with all previously-entered data preserved on screen.

#### Congratulations screen

After Submit & Sync, the page transitions to a full-page success screen that takes over the whole content area (no card, hero-style layout).

Contents of the screen:

- A celebratory headline: **"🎉 Profile complete! Your personalized intelligence sync is live."**
- A short confetti / celebration animation that bursts on the screen when it first appears (one-time, not looping).
- A single primary button labeled **"Go to Home"** in the neon blue gradient styling. Clicking it routes the user to `/home`.
- The page does not auto-redirect — the user clicks the button when they're ready.

On reaching `/home` after this flow, the Profile Progress card on `/home` reflects 100% completion (the Complete Profile button is hidden and the "Profile complete ✓" confirmation is shown, as defined in Phase 2).
