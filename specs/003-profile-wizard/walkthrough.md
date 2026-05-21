# Walkthrough: Profile Wizard (`/profile`)

Phase 3 ships the three-step onboarding wizard (Identity → Bio-Link → Finalize),
the congratulations screen, real Supabase persistence via three new tables, and
the swap of `getProfileCompletion()` from a Phase 2 stub to a real read.

## How to run

```powershell
# from D:\meska-brain-ai-newsletter
npm run dev
```

Open the URL printed by `next dev` (3000, with fallback 3001/3002).

### Required setup BEFORE first use

1. Apply the SQL migration to your Supabase project. Either:
   - **Dashboard**: paste the contents of
     `supabase/migrations/0001_profile_tables.sql` into the SQL editor and
     execute, OR
   - **CLI**: `supabase db push` if you have the Supabase CLI configured.
2. Verify the three tables exist with RLS enabled and the policies installed:
   `profile_identity`, `profile_curation`, `profile_finalize`.
3. `.env.local` must contain `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. At least one user account created via `/signup`.

## Implemented features

| FR | Where |
|---|---|
| FR-001, FR-002 (route + auth guard) | `app/profile/page.tsx` (`getUser` null-check + redirect) |
| FR-003 (single wizard from both entry points) | `/home` Complete Profile button + dashboard Profile tab both link to `/profile` |
| FR-004, FR-005 (three steps + indicator) | `app/profile/_wizard/StepIndicator.tsx` |
| FR-006, FR-007 (card + no sidebar) | wizard card in `ProfileWizard.tsx`; `<DashboardNav active="profile" />` is the only chrome |
| FR-008 (no back on Form 1; back on 2/3) | each form renders its own action row |
| FR-009 (wizard restarts on sign-in) | step state lives in `?step=` URL param; sign-out clears the session and the next `/profile` visit defaults to `identity` |
| FR-010 (Next/Submit gradient + arrow icon) | every form's primary button uses `var(--neon-blue-gradient)` and `arrow_forward` / `sync` |
| FR-011 → FR-019 (Form 1) | `Form1Identity.tsx` + `app/_actions/save-identity.ts` + `lib/profile/validators.ts` |
| FR-020 → FR-033 (Form 2) | `Form2Curation.tsx` + `app/_actions/save-curation.ts`; topics const tuple in `lib/profile/schema.ts` |
| FR-034 → FR-041 (Form 3) | `Form3Finalize.tsx` + `app/_actions/save-finalize.ts`; clipboard + textarea + Submit & Sync |
| FR-042 → FR-045 (Congratulations) | `CongratulationsScreen.tsx` + `Confetti.tsx` + `confetti-burst` keyframe in `globals.css` |
| FR-046 (shared gradient) | every primary action references `var(--neon-blue-gradient)` |
| FR-047 (responsive parity) | `clamp()` titles, mobile-first grids, pill rows wrap |
| FR-048 → FR-050 (persistence + reload) | UPSERT-only server actions; `app/profile/page.tsx` reads all three rows server-side and threads `initial` into the wizard |

## Manual verification steps

### Golden path — full wizard, brand-new user

1. Sign in → `/home`. Profile Progress shows **0%**.
2. Click **Complete Profile** → routes to `/profile?step=identity`.
3. **Form 1**: First/Last auto-filled. Enter WhatsApp via the dial code + number
   field (e.g. `+20` + `1001234567`), pick a referral, paste
   `https://linkedin.com/in/jane-doe`. Click **Next Step** → routes to
   `?step=curate`.
4. **Form 2**: pick one AI Usage pill, one Main Reason pill, exactly 3 Topics
   chips, one Consumption pill, one Language, one Channel. Click **Next Step**
   → routes to `?step=finalize`.
5. **Form 3**: click **Copy Prompt** — "Copied!" appears briefly. Paste
   anything (or leave empty). Click **Submit & Sync** → routes to `?step=done`.
6. **Congratulations**: confetti plays once. Headline + Go to Home button
   visible. NO auto-redirect. Click **Go to Home** → `/home` shows **100%** +
   "Profile complete ✓".

### Validation matrix

- Form 1, click Next with everything blank → 5 inline errors (one under each
  required field); borders flash red.
- Form 1, WhatsApp `0123` → "Enter a valid WhatsApp number in international
  format" under the field.
- Form 1, LinkedIn `https://twitter.com/...` → "Enter a valid LinkedIn profile
  URL (https://linkedin.com/in/...)" under the field.
- Form 2, 2 topics selected + Next → "Please select exactly 3 topics." under
  the Topics section.
- Form 2, 4 topics selected + Next → same error.
- Form 2, any section unselected + Next → "Please make a selection." under
  each missing section.
- Form 3, Submit & Sync with empty textarea → succeeds; congratulations plays.
- Form 3, Submit & Sync with text → succeeds; the row in `profile_finalize`
  has `response_text = '<your text>'`.

### Back-button + data preservation

- Form 2 **Back** → returns to Form 1 with values preserved on screen
  (re-fetched from the saved row).
- Form 3 **Back** → returns to Form 2 with all selections still highlighted.
- Sign out, sign back in, open `/profile` → re-opens at Form 1 (NOT Form 3).
  Previously-saved values are reloaded from the Supabase rows.

### Mobile-fit gate (Principle III v1.2.0)

Walk every form + the congratulations screen at BOTH `390 × 844` and `360 × 800`
using Claude in Chrome (`resize_window` → `navigate` → screenshot):

- No horizontal scrollbar at any width.
- Step indicator fits without wrap (labels hide on mobile; numbered circles
  remain).
- Form 1: two-column grid collapses to one column.
- Form 2: pill rows wrap; topics chip grid is 2-col on mobile, 3-col from
  `sm:` up; delivery sub-card stays inside the card.
- Form 3: code block scrolls horizontally if needed via `<pre>` overflow.
- Congratulations: headline wraps cleanly; confetti respects
  `prefers-reduced-motion`.

Also walk at ≥ 1280 × 800: wizard card centered (`max-w-2xl`), step indicator
visually balanced.

### Cross-cutting

- Unauthenticated GET `/profile` → 302 `/signin`.
- Double-click Submit & Sync → only one row written (the button is disabled
  during the in-flight request).
- Edit First/Last on Form 1 and save → revisit `/home`: greeting reflects the
  new name (`saveIdentity` writes `user_metadata` via the admin client and
  `revalidatePath("/home")`).

## Known gaps / deferred items

- **Prompt text is a placeholder** (`PROMPT_TEXT` in
  `app/profile/_wizard/Form3Finalize.tsx`). Replace with the final string when
  marketing supplies it.
- **WhatsApp country-code list** is curated to ~21 entries. Add more codes if
  the launch audience needs them; the regex validation already accepts any
  E.164 number, so users picking "Other" can free-type a leading `+CC`.
- **No analytics or error-tracking** is wired (per spec Assumption — out of
  scope).
- **Authenticated walkthrough screenshots** were not captured in this
  implementation pass because the SQL migration must be applied by the
  reviewer with access to the Supabase project. Run the migration, sign in,
  and walk the steps above to capture them.
- **`/profile` resume across sessions** is intentionally NOT supported per
  FR-009. The wizard always restarts at Form 1; saved data still reloads into
  the form fields.
- **Mobile collapse pattern for the top nav** is the Phase 2 default (Sign
  Out collapses to icon-only); the hamburger/drawer pattern remains deferred.
