# Tasks: Profile Wizard (`/profile`)

**Feature**: Phase 3 — three-step onboarding wizard (Identity → Bio-Link →
Finalize) at `/profile` that drives the completion percentage on `/home`.

**Spec**: [./spec.md](./spec.md) · **Plan**: [./plan.md](./plan.md)

All three user stories are Priority **P1**. They share the route and the wizard
shell, but each story can be independently verified once the foundational pieces
land. No automated tests requested in the spec.

---

## Phase 1 — Setup

- [X] T001 Apply the SQL migration `supabase/migrations/0001_profile_tables.sql` against the Supabase project — copy the SQL from `specs/003-profile-wizard/contracts/supabase-schema.md` into a new file at `supabase/migrations/0001_profile_tables.sql`, then run it via the Supabase dashboard SQL editor (verify the three tables and RLS policies exist before continuing)
- [X] T002 Create the shared schema module at `lib/profile/schema.ts` exporting the const tuples `REFERRAL_SOURCES`, `AI_USAGES`, `MAIN_REASONS`, `CONSUMPTIONS`, `LANGUAGES`, `CHANNELS`, `TOPICS`, their derived types, plus `WizardFieldError` and `SaveResult` per `contracts/server-actions.md`
- [X] T003 Create the validators module at `lib/profile/validators.ts` exporting `validateWhatsappE164(value)`, `validateLinkedInUrl(value)`, and `validateExactlyThreeTopics(topics)`, each returning a `WizardFieldError | null` (regexes per research R4)

## Phase 2 — Foundational (blocks all user stories)

- [X] T004 Rewrite `lib/profile/completion.ts` so `getProfileCompletion(userId)` runs three parallel `maybeSingle()` reads against `profile_identity`, `profile_curation`, `profile_finalize` via `createSupabaseServerClient()`, then maps the boolean count to `[0, 33, 66, 100]` (keep the existing `FormKey`/`ProfileCompletion` types; do NOT change the signature)
- [X] T005 Create the wizard shell page at `app/profile/page.tsx` as an async Server Component: call `createSupabaseServerClient()` + `getUser()`, redirect `/signin` if null, read `profile_identity`/`profile_curation`/`profile_finalize` rows via `Promise.all` with `.maybeSingle()`, and render `<DashboardNav active="profile" />` + `<ProfileWizard initial={…} firstNameDefault={…} lastNameDefault={…} />`
- [X] T006 Create `app/profile/_wizard/StepIndicator.tsx` as a Server Component accepting `step: "identity" | "curate" | "finalize"` and rendering three numbered circles ("Identity", "Bio-Link", "Finalize") connected by a horizontal line — active circle uses `var(--neon-blue-gradient)` with white text, completed circles use a flat neon-blue with a white check, pending circles are gray (FR-005)
- [X] T007 Create `app/profile/_wizard/ProfileWizard.tsx` as a Client Component (`"use client"`) that reads `useSearchParams().get("step")` (default `"identity"`, accept also `"curate"`, `"finalize"`, `"done"`), renders the matching child form passing `initial` defaults, and exposes a `goTo(step)` helper that calls `router.push("?step=…", { scroll: false })` (FR-009 — no resume across sessions; this component is unmounted on sign-out)

## Phase 3 — User Story 1: Form 1 — Personal Information (P1)

**Story goal**: Capture name (with auto-fill), WhatsApp (E.164), referral, and
LinkedIn URL; persist Form 1, advance to Form 2, and bump completion to ~33%.

**Independent test**: Sign in, open `/profile`, verify First/Last auto-fill,
complete the five fields with valid values, click Next Step, verify routing to
Form 2 and that `/home` shows ~33% with the greeting reflecting any name edits.

- [X] T008 [US1] Create the Server Action `app/_actions/save-identity.ts` (`"use server"`, `import "server-only"`) — validate via `validateName`/`validateWhatsappE164`/`validateLinkedInUrl` + referral membership check, UPSERT into `profile_identity` via `createSupabaseServerClient()`, then `createSupabaseAdminClient().auth.admin.updateUserById(user.id, { user_metadata: { first_name, last_name, full_name, display_name, name } })`, then `revalidatePath("/home")` and `revalidatePath("/profile")`, return `SaveResult` (per `contracts/server-actions.md`)
- [X] T009 [P] [US1] Create `app/profile/_wizard/Form1Identity.tsx` as a Client Component (`"use client"`) accepting `{ firstNameDefault, lastNameDefault, initial: ProfileIdentityRow | null, onSaved: () => void }`: two-column grid at `sm:` collapsing to one column on mobile, fields First Name, Last Name, WhatsApp (country-code `<select>` + number `<input>`), "How did you hear about us?" `<select>`, LinkedIn URL `<input>` — all with the same pill styling as Phase 1 signup inputs
- [X] T010 [US1] In `Form1Identity.tsx`, wire the submit handler — build `FormData`, call `saveIdentity` inside `useTransition`, on `{ ok: false }` set inline errors keyed by field (border turns `var(--error-border)`, message renders directly under the field), on `{ ok: true }` call `onSaved()` which the parent wires to `goTo("curate")` (FR-017, FR-018)
- [X] T011 [US1] In `Form1Identity.tsx`, render the bottom-right "Next Step" pill button with `var(--neon-blue-gradient)` + right-arrow icon (Material Symbols `arrow_forward`); do NOT render a Back button (FR-008, FR-010)
- [X] T012 [US1] In `ProfileWizard.tsx`, render `<Form1Identity>` when `step === "identity"`, threading `firstNameDefault`/`lastNameDefault`/`initial.identity` defaults and wiring `onSaved` to `goTo("curate")`

## Phase 4 — User Story 2: Form 2 — Curate Your Intelligence (P1)

**Story goal**: Capture AI usage, main reason, exactly 3 topics, content
consumption, language, and channel; persist Form 2, advance to Form 3, and bump
completion to ~66%.

**Independent test**: From Form 2, attempt Next with no selections (per-section
errors), with 2 topics (Topics error), with 4 topics (Topics error). With all
sections valid and exactly 3 topics, Next routes to Form 3 and `/home` shows
~66%. Back returns to Form 1 with values preserved.

- [X] T013 [US2] Create the Server Action `app/_actions/save-curation.ts` (`"use server"`, `import "server-only"`) — validate each enum value against its const tuple from `lib/profile/schema.ts`, validate topics via `validateExactlyThreeTopics` + membership, UPSERT into `profile_curation` with all six columns, `revalidatePath("/home")` and `revalidatePath("/profile")`, return `SaveResult`
- [X] T014 [P] [US2] Create `app/profile/_wizard/Form2Curation.tsx` as a Client Component (`"use client"`) accepting `{ initial: ProfileCurationRow | null, onSaved: () => void, onBack: () => void }`: render five vertically-stacked sections (Current AI Usage, Main Reason, Topics of Interest, Content Consumption Preference, Delivery Preferences) — no options pre-selected on first open (FR-029)
- [X] T015 [US2] In `Form2Curation.tsx`, implement the three single-select pill rows (Current AI Usage, Main Reason, Content Consumption) — each pill is a `<button type="button" aria-pressed={selected}>` with `var(--neon-blue-gradient)` + white text when selected, white bg + subtle gray border when unselected (FR-022, FR-023, FR-025, FR-030)
- [X] T016 [US2] In `Form2Curation.tsx`, implement the Topics multi-select chip grid (`grid-cols-2 sm:grid-cols-3`) using the `TOPICS` const tuple from `lib/profile/schema.ts` — toggling a chip flips its presence in local state; exact-3 enforcement happens only on submit (Principle VI); explicitly do NOT render an "Add Topic" affordance (FR-024)
- [X] T017 [US2] In `Form2Curation.tsx`, implement the Delivery Preferences gray sub-card (`bg-zinc-50` or `var(--dashboard-track)`-tinted) containing the Language single-select (English / Arabic / Both) and the Channel single-select (WhatsApp / Telegram / Email) with the subtitle "Routes everything downstream." (FR-026 → FR-028)
- [X] T018 [US2] In `Form2Curation.tsx`, wire the submit handler — call `saveCuration` inside `useTransition`; on `{ ok: false }` render per-section errors (Topics error message exactly "Please select exactly 3 topics."); on `{ ok: true }` call `onSaved()` (FR-031, FR-032)
- [X] T019 [US2] In `Form2Curation.tsx`, render the bottom action row: **Back** on the left (plain/outline, no gradient — calls `onBack`) and **Next Step** on the right (`var(--neon-blue-gradient)` + `arrow_forward` icon) — FR-008, FR-033
- [X] T020 [US2] In `ProfileWizard.tsx`, render `<Form2Curation>` when `step === "curate"`, threading `initial.curation`, wiring `onSaved` to `goTo("finalize")` and `onBack` to `goTo("identity")`

## Phase 5 — User Story 3: Form 3 — Finalize + Congratulations (P1)

**Story goal**: Copy the fixed prompt, submit a (possibly empty) response, mark
the profile 100% complete, and show a one-shot congratulations screen that does
not auto-redirect. Clicking Go to Home routes to `/home` showing 100%.

**Independent test**: From Form 3, click Copy Prompt → "Copied!" feedback +
clipboard contains the prompt. Submit with empty textarea → confetti +
congratulations + Go to Home. Submit with text → same path; the text persists.
Back returns to Form 2 with values preserved.

- [X] T021 [US3] Create the Server Action `app/_actions/save-finalize.ts` (`"use server"`, `import "server-only"`) — accept `responseText` from FormData (coerce missing → `""`), NO validation (FR-038), UPSERT into `profile_finalize` with `response_text` + `submitted_at = now()`, `revalidatePath("/home")` and `revalidatePath("/profile")`, return `SaveResult`
- [X] T022 [US3] Create `app/profile/_wizard/Confetti.tsx` as a Client Component (`"use client"`) that mounts ~40 absolutely-positioned `<span>` particles with randomized positions generated inside `useEffect` (hydration-safe per `learning.md` Problem 2), animates via a CSS `@keyframes confetti-burst` (translate + rotate + opacity 0→1→0 over ~2s), and unmounts itself after the animation completes; respect `prefers-reduced-motion: reduce` by rendering nothing in that case
- [X] T023 [US3] Add the `confetti-burst` keyframes and `.confetti-particle` class to `app/globals.css` — particles use GPU-composited `transform` only, not `top`/`left` animations; reduced-motion media query hides them entirely
- [X] T024 [P] [US3] Create `app/profile/_wizard/Form3Finalize.tsx` as a Client Component (`"use client"`) accepting `{ initial: ProfileFinalizeRow | null, onSubmitted: () => void, onBack: () => void }`: render the code-block surface with "PHASE 01" tag (top-left) + "Copy Prompt" button (top-right) + monospaced `<pre tabindex="0">` containing the fixed prompt placeholder string (FR-035)
- [X] T025 [US3] In `Form3Finalize.tsx`, wire the Copy Prompt button to `navigator.clipboard.writeText(prompt)` — on success show "Copied!" feedback (state flag cleared after 1.5s); on rejection surface an inline note "Copy failed — text is selectable above." (FR-036, Edge Case "clipboard denied")
- [X] T026 [US3] In `Form3Finalize.tsx`, render the "PHASE 02 Paste response here" label + multi-line `<textarea>` with the placeholder copy from FR-037, defaulting to `initial?.response_text ?? ""` (no validation)
- [X] T027 [US3] In `Form3Finalize.tsx`, render the centered **Submit & Sync** button (`var(--neon-blue-gradient)` + Material Symbols `sync` icon), wire it through `useTransition` to call `saveFinalize`; render a centered plain/outline **Back** button below (FR-039, FR-041); disable both buttons while the request is in flight to prevent double-submit
- [X] T028 [US3] Create `app/profile/_wizard/CongratulationsScreen.tsx` as a Client Component (`"use client"`) rendering a full-page (no card) centered layout: `<Confetti />` mounted once on first render, the headline `🎉 Profile complete! Your personalized intelligence sync is live.`, and a single gradient **Go to Home** pill button that calls `router.push("/home")` — explicitly do NOT auto-redirect (FR-044)
- [X] T029 [US3] In `ProfileWizard.tsx`, render `<Form3Finalize>` when `step === "finalize"` and `<CongratulationsScreen>` when `step === "done"`; wire `Form3Finalize.onSubmitted` to `goTo("done")` and `Form3Finalize.onBack` to `goTo("curate")`

## Phase 6 — Polish & cross-cutting

- [X] T030 In `app/profile/page.tsx`, ensure unauthenticated visits route to `/signin` via the `getUser()` null-check; verify by visiting `/profile` while signed out in a fresh browser context (FR-002, Edge Case "User opens /profile directly via URL after sign-out")
- [X] T031 Verify FR-009 — sign out mid-wizard then sign back in and re-open `/profile`: the wizard MUST re-open at Form 1 regardless of last-viewed step (this is the natural behavior since step state lives in the URL search param and is not persisted; document the verification path)
- [X] T032 Walk every form + the congratulations screen at 390 × 844 AND 360 × 800 using the Claude in Chrome MCP (`resize_window` → `navigate` → screenshot): verify zero horizontal overflow, no clipped content, line-count parity vs desktop, the topics chip grid is 2-col on mobile, the delivery sub-card stays inside the card with padding intact (Principle III v1.2.0)
- [X] T033 Walk every form at ≥ 1280 × 800: verify the wizard card centered with `max-w-2xl`, step indicator visually balanced, two-column Form 1 grid (Principle III v1.2.0)
- [X] T034 Run `npx tsc --noEmit` and `npm run lint`; fix any errors introduced by the new files (no blanket ESLint disables; only targeted disables with a single-line rationale comment per CLAUDE.md guidance)
- [X] T035 Manually verify the validation matrix from `quickstart.md`: Form 1 with everything blank, Form 1 with `+invalid` whatsapp, Form 1 with non-LinkedIn URL, Form 2 with 2 topics, Form 2 with 4 topics, Form 2 with a missing section, Form 3 Submit & Sync with empty response — each behaves exactly as the spec FR-014 / FR-016 / FR-017 / FR-024 / FR-031 / FR-038 require
- [X] T036 Manually verify the data-preservation matrix: Form 2 Back → Form 1 with values preserved on screen; Form 3 Back → Form 2 with selections preserved; sign out + sign in → wizard at Form 1, fields reloaded from Supabase rows (FR-033, FR-041, FR-050)
- [X] T037 Verify the congratulations + completion path: Submit & Sync with empty textarea → confetti animates exactly once + headline + Go-to-Home button visible + NO auto-redirect; click Go to Home → `/home` shows 100% + "Profile complete ✓" (FR-042 → FR-045, SC-006, SC-007)
- [X] T038 Write `specs/003-profile-wizard/walkthrough.md` per constitution Principle VIII: how-to-run shell commands (including the migration step), implemented-features list mapped to FR-001..FR-050, manual verification steps for desktop AND mobile, known-gaps section noting the placeholder prompt text and any deferred items

---

## Dependencies

```
Phase 1 (T001 T002 T003)
   └─▶ Phase 2 (T004 T005 T006 T007)
         ├─▶ Phase 3 — US1 (T008 T009 T010 T011 T012)
         ├─▶ Phase 4 — US2 (T013 T014 T015 T016 T017 T018 T019 T020)
         └─▶ Phase 5 — US3 (T021 T022 T023 T024 T025 T026 T027 T028 T029)
                  └─▶ Phase 6 — Polish (T030 → T038)
```

T001 (SQL migration) MUST land before any task that hits Supabase (T004, T005,
T008, T013, T021). Stories 1/2/3 are independently developable after Phase 2.

## Parallel execution examples

- **Phase 1**: T002 (`schema.ts`) and T003 (`validators.ts`) are different files
  with no shared dependency → run in parallel after T001.
- **Phase 2**: T004 (rewrite `completion.ts`), T005 (`app/profile/page.tsx`),
  T006 (`StepIndicator.tsx`) all touch different files; T007 (`ProfileWizard.tsx`)
  imports T006 → serialize after T006. T004 has no consumers in this phase →
  parallel with T005 + T006.
- **Phase 3**: T008 (server action) and T009 (form component) are different
  files → parallel; T010 + T011 edit T009's file → serialize behind T009; T012
  edits `ProfileWizard.tsx` and depends on T009 landing.
- **Phase 4**: T013 (server action) and T014 (form component) are different
  files → parallel; T015 → T018 all edit `Form2Curation.tsx` → serialize.
- **Phase 5**: T021, T022, T023, T024, T028 touch different files and can run
  in parallel until T025–T027 (all edit `Form3Finalize.tsx`) which serialize.
  T029 edits `ProfileWizard.tsx` and depends on T024 + T028.

## Implementation strategy (MVP-first)

1. **Setup + Foundational** (T001–T007) — get the migration applied, the
   shared types in place, and a `/profile` page that renders the step
   indicator + an empty wizard card. At this point `/home` already reads real
   completion (which will be 0% until any form is saved).
2. **US1 first** (T008–T012) — Form 1 alone unblocks the greeting-edit path
   (FR-019, SC-009) and gets users to ~33%.
3. **US2 next** (T013–T020) — captures the routing inputs; ~66% after submit.
4. **US3 + congratulations** (T021–T029) — closes the onboarding loop and
   exercises the 100% / "Profile complete ✓" path on `/home`.
5. **Phase 6 polish** is the gate to "done" — without the mobile-fit
   walkthrough at both breakpoints, the data-preservation matrix verification,
   and `walkthrough.md`, the phase ships incomplete.

---

## Format validation

All 38 tasks start with `- [ ]`, include a sequential `T###` ID, carry the
`[US#]` label inside user-story phases, and name an exact file path. The `[P]`
marker is used only on the first task that opens a new file inside its phase
when nothing else in that phase touches the same file. Total task count:
**38** (Setup 3, Foundational 4, US1 5, US2 8, US3 9, Polish 9).
