# Quickstart: Profile Wizard

## Prerequisites

- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- The Supabase project has been migrated with
  `supabase/migrations/0001_profile_tables.sql` (run via dashboard SQL editor or
  Supabase CLI).
- At least one user account created via `/signup`.

## Run

```powershell
npm run dev
```

Open the URL printed by `next dev` (port 3000, fallback 3001/3002).

## Verify (manual walkthrough)

### Golden path — full wizard, brand-new user

1. Sign in. Land on `/home`. Profile Progress shows **0%**.
2. Click **Complete Profile** → routes to `/profile`. Step indicator shows
   Identity active, Bio-Link + Finalize pending. No Back button.
3. **Form 1**: First/Last name auto-filled. Enter WhatsApp `+201001234567`,
   pick referral "Google", paste LinkedIn `https://linkedin.com/in/jane-doe`.
   Click **Next Step**.
4. **Form 2**: pick one option in each section, exactly 3 topics, English,
   WhatsApp. Click **Next Step**.
5. **Form 3**: click **Copy Prompt** → toast "Copied!", clipboard has the
   prompt. Paste anything (or leave empty). Click **Submit & Sync**.
6. **Congratulations screen**: confetti plays once, headline visible, "Go to
   Home" button. Wait — page does NOT auto-redirect.
7. Click **Go to Home** → routes to `/home`. Profile Progress shows **100%**
   with "Profile complete ✓"; no Complete Profile button.

### Validation paths

- **Form 1**, click Next with everything blank → 5 inline errors directly
  under each required field; field borders error-colored. No save.
- **Form 1**, enter WhatsApp `0123` → "Enter a valid WhatsApp number in
  international format" under that field. No save.
- **Form 1**, enter LinkedIn `https://twitter.com/janedoe` → "Enter a valid
  LinkedIn profile URL." under that field. No save.
- **Form 2**, click Next with 2 topics selected → "Please select exactly 3
  topics." under the Topics section.
- **Form 2**, click Next with 4 topics selected → same error.
- **Form 2**, click Next with any other section unselected → "Please make a
  selection." under each missing section.

### Back-button & data preservation

- **Form 2**, click Back → returns to Form 1 with all previously-entered values
  still on screen.
- **Form 3**, click Back → returns to Form 2 with all previously-entered
  selections still highlighted.
- Sign out, sign back in, open `/profile` → re-opens at Form 1 (NOT Form 3,
  per FR-009). Previously-saved values are still loaded into the fields.

### Edge cases to verify

1. Open `/profile` directly while signed out → redirects to `/signin`.
2. Submit & Sync with empty response textarea → succeeds, profile flips to
   100%, congratulations screen plays.
3. Double-click Submit & Sync rapidly → only one row written; the second
   click is ignored while the request is in flight (the button is disabled).
4. Clipboard permission denied (force in DevTools) → "Copy" reports the error
   inline; the `<pre>` text remains selectable for manual copy.
5. `prefers-reduced-motion: reduce` enabled → confetti does NOT animate; the
   headline and button still appear.

### Mobile-fit gate (Principle III v1.2.0)

Walk every form at BOTH `390 × 844` and `360 × 800` using the Claude in Chrome
MCP (`resize_window` → `navigate` → screenshot):

- No horizontal scrollbar at any width.
- Step indicator fits without wrap; circles touch the connecting line cleanly.
- Form 1: two-column grid collapses to one column; field borders flush with
  the card edge.
- Form 2: pill rows wrap; topics chip grid is 2-column on mobile, 3-column
  from `sm:` up; delivery sub-card stays within the card with padding intact.
- Form 3: code block scrolls horizontally if needed for the prompt; Copy
  button and "Copied!" feedback do not overflow.
- Congratulations screen: headline wraps cleanly; button stays within viewport
  width.

Also verify at ≥ 1280 × 800: wizard card centered with `max-w-2xl`; step
indicator visually balanced.

## Definition of Done

- SQL migration applied to the Supabase project; the three tables exist with
  the RLS policies from `contracts/supabase-schema.md`.
- All 50 functional requirements from `spec.md` satisfied (FR-001 → FR-050).
- All 9 success criteria verified (SC-001 → SC-009).
- Mobile-fit gate passed at 390 × 844 AND 360 × 800.
- `getProfileCompletion()` returns 0/33/66/100 against real data.
- `npm run lint` + `npx tsc --noEmit` clean.
- `walkthrough.md` written.
