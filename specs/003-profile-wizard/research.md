# Research: Profile Wizard

Decisions resolving open questions surfaced by reading the spec against the current
codebase. No `NEEDS CLARIFICATION` markers remain after this document.

---

## R1. Wizard step state — single route or three routes?

**Decision**: Single route `/profile` with internal step state driven by a
URL search param (`?step=identity|curate|finalize`). The wizard reads the param on
load; navigation between forms updates it via `router.push("?step=…", { scroll:
false })`.

**Rationale**:

- FR-009 explicitly states the wizard always restarts at Form 1 on sign-in, so
  step state is genuinely session-ephemeral — three separate routes would imply
  durable per-step URLs the spec rejects.
- A URL param gives users browser-Back navigation that matches the spec's "Back
  button" semantics (FR-008, FR-033, FR-041) for free.
- Avoids creating three React subtrees that all need the same data fetch.

**Alternatives considered**:

- **`useState` only** — Back-button behavior would not match the spec; refresh
  would always start at Form 1, breaking the Back-button-with-preserved-values
  contract within a session.
- **Three routes `/profile/identity` etc.** — over-structures the URL space for
  a flow that's intentionally non-resumable across sessions.

---

## R2. Persistence — schema shape

**Decision**: Three new tables in Supabase, one per form, each keyed by
`user_id uuid PRIMARY KEY REFERENCES auth.users(id)` (so each user has at most
one row per form). All three tables get RLS policies allowing only
`auth.uid() = user_id`. First/last name updates from Form 1 are written to
`auth.users.raw_user_meta_data` via Supabase Admin (server-only) — the same path
Phase 1 signup uses, so the `/home` greeting keeps working.

Tables:

- `profile_identity` (Form 1): `whatsapp_e164`, `referral_source`, `linkedin_url`,
  `updated_at`.
- `profile_curation` (Form 2): `ai_usage`, `main_reason`, `topics` (text[]),
  `consumption`, `language`, `channel`, `updated_at`.
- `profile_finalize` (Form 3): `response_text` (text, may be empty),
  `submitted_at`.

The presence of a row in each table (i.e., `updated_at IS NOT NULL`) drives the
completion percentage. See `contracts/supabase-schema.md` for the migration.

**Rationale**: Storing the curation choices in dedicated columns (vs. JSONB blobs)
keeps RLS straightforward, makes columns queryable for the eventual delivery
pipeline (out of scope here), and avoids JWT bloat that would come with stuffing
everything into `user_metadata`. Separate tables per form mean a single-row UPSERT
per save with no compound transaction concerns. The Form 3 response is plain text
per spec Assumption — no application-layer encryption.

**Alternatives considered**:

- **Single `profiles` table with all columns nullable** — would require partial
  saves across many columns and complicate "is Form 2 saved?" detection. Rejected.
- **`user_metadata` JSONB on `auth.users`** — JWT size pressure + harder RLS;
  rejected for Forms 2 + 3.

---

## R3. `getProfileCompletion()` rewrite

**Decision**: Replace the Phase 2 stub with one SQL round-trip:

```sql
SELECT
  EXISTS (SELECT 1 FROM profile_identity  WHERE user_id = $1) AS identity_saved,
  EXISTS (SELECT 1 FROM profile_curation  WHERE user_id = $1) AS bio_link_saved,
  EXISTS (SELECT 1 FROM profile_finalize  WHERE user_id = $1) AS finalize_saved;
```

Map the three booleans → count → `[0, 33, 66, 100]`. Phase 2's `ProfileCompletion`
type signature and `FormKey` enum are unchanged; only the body of the exported
function moves.

**Rationale**: Phase 2 deliberately made this the only contract `/home` reads.
Swapping the body satisfies Phase 3 with zero `/home` changes — same UI exercises
every percent branch.

**Alternatives considered**:

- **Read three separate queries** — three round-trips when one suffices. Rejected.
- **Maintain a denormalized `profile_completion` table** — premature; the
  EXISTS check on three small tables is sub-ms with PKs.

---

## R4. Validation — E.164 phone & LinkedIn URL

**Decision**: Tiny custom validators in `lib/profile/validators.ts`, used by both
the client form (for inline-error display on submit) and the Server Action (as
the authoritative check). No new dependency.

- **E.164**: regex `^\+[1-9]\d{6,14}$` — strict E.164 form `+CCNNNNNNNNNN`,
  total digits 7–15 including country code. The "country code picker" rendered
  in the UI is purely a presentational helper that prepends the dial code to a
  shared `whatsapp_e164` field; storage and validation always use the canonical
  E.164 string.
- **LinkedIn URL**: regex
  `^https:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9._-]{2,100}\/?(?:\?.*)?$`.
  Path segment length 2–100, allows trailing slash and query string. No live
  HTTP check (out of scope per Assumptions).
- **Topics**: exactly 3 string values, each member of the fixed taxonomy.

**Rationale**: Spec FR-014/FR-016 require format validation only; libraries like
`libphonenumber-js` would be 100+ KB for what's effectively a regex. The shared
validator file lets both client and server run the same check, and the Server
Action remains the source of truth.

**Alternatives considered**:

- **`libphonenumber-js`** — heavyweight for one regex's job. Rejected.
- **`zod`** — appealing for type-safe schemas, but adds a dep for three forms.
  Rejected; we can add later if validation surface grows.

---

## R5. Pill / chip toggle UI

**Decision**: Plain `<button type="button">` elements with controlled selection
state held by the parent `Form2Curation` client component. No `<input
type="radio">` because the visual treatment is a fully custom pill with the neon
blue gradient (spec FR-030). Each pill gets `aria-pressed={selected}` so screen
readers receive the toggle state. The topics grid uses the same pattern but with
multi-select (cap at 3 visually-marked + inline error only on submit per FR-024,
FR-031).

**Rationale**: Native radios cannot host the gradient + custom layout cleanly,
and the spec's selection rules (exactly 3 for topics, no pre-selection on first
open) are easier with explicit state. `aria-pressed` is the W3C-recommended
pattern for toggle buttons.

**Alternatives considered**:

- **Native radios with `appearance: none`** — fragile across browsers for the
  pill styling. Rejected.

---

## R6. Clipboard — Copy Prompt

**Decision**: A small client island `Form3Finalize.tsx` calls
`navigator.clipboard.writeText(prompt)`. On success, set local state to show
"Copied!" feedback for 1.5s, then clear. If the call rejects (permission denied
or insecure context), surface a graceful inline note and keep the prompt text
selectable in the surrounding `<pre>` so users can manually copy (spec Edge
Case: clipboard denied).

**Rationale**: `document.execCommand("copy")` is deprecated; `navigator.clipboard`
is the standard and works everywhere `/profile` will be used (HTTPS).

**Alternatives considered**:

- **Library (`clipboard-copy`, etc.)** — unnecessary; one-line API. Rejected.

---

## R7. Confetti

**Decision**: A small CSS-keyframe confetti island. ~40 absolutely-positioned
`<span>` elements with randomized starting offsets, rotations, and durations;
each animates `transform: translate(...) rotate(...)` + `opacity` 0→1→0 over
~2s. The component mounts on the congratulations screen and unmounts after the
animation ends (one-shot per FR-043) — implemented by setting a `useEffect`
timer that flips a `done` flag.

To stay hydration-safe (per `learning.md` Problem 2), particle positions are
generated inside `useEffect` after mount, not during render.

**Rationale**: A library (canvas-confetti) is ~12 KB gzipped for a single
2-second moment — overkill. CSS keyframes are GPU-composited and respect
`prefers-reduced-motion: reduce` via a media query that hides the particles
entirely.

**Alternatives considered**:

- **`canvas-confetti`** — would work but introduces a runtime dep for one
  feature. Rejected unless the CSS approach proves visually weak.

---

## R8. WhatsApp country code picker

**Decision**: A small, single-file static list of the top ~30 countries by
likely user base, presented as a `<select>` next to the number `<input>`. The
selected dial code (`+44`, `+20`, etc.) prepends to the user's typed number;
on submit the combined string is validated as E.164. The visible field stores
only the local digits (cleaner UX); the canonical E.164 value is rebuilt at
submit time and at re-render of saved data.

**Rationale**: A full international country list (~250 entries) adds noise
without value for the launch audience and inflates bundle size if shipped
client-side. A curated short list with "Other" → free-typed code keeps the UX
tight; users can still enter any code if they pick "Other".

**Alternatives considered**:

- **Headless international phone-input library** — meaningful bundle cost; not
  warranted at this scale.

---

## R9. Topics taxonomy

**Decision**: Encode the fixed 13-chip taxonomy from FR-024 as a const tuple in
`lib/profile/schema.ts`:

```ts
export const TOPICS = [
  "Generative AI", "LLM Research", "AI Ethics", "Prompt Engineering",
  "Robotics", "AI Policy", "Autonomous Agents", "Compute Infrastructure",
  "Neuroscience", "Coding Assistants", "Voice AI", "Venture Capital",
  "Cybersecurity",
] as const;
export type Topic = (typeof TOPICS)[number];
```

Server-side validation rejects any value not in this list — defensive against
client tampering.

**Rationale**: Single source of truth; type-safe membership checks on both
client and server.

---

## R10. Reload of saved values when revisiting a form

**Decision**: `app/profile/page.tsx` reads all three saved-form rows server-side
(via SSR Supabase client; RLS scopes to current user) and passes them as
prop-shaped defaults into `<ProfileWizard initial={…}>`. Client-side, when the
user navigates between steps, the in-memory form state is the source of truth;
on submit, the Server Action updates the DB and `revalidatePath("/home")`
invalidates the cached home render so the new percentage is visible next time.

**Rationale**: Server fetch on every render of `/profile` keeps the view
consistent with persisted state (FR-050). `revalidatePath` ensures the next
`/home` visit isn't stale.

---

## R11. Submit & Sync — empty response is valid

**Decision**: Honor the spec literally (FR-038 — "MUST succeed even when the
textarea is empty"). The Server Action accepts an empty string and persists it;
the row exists with `response_text = ''` and `submitted_at = now()`. The
EXISTS check in `getProfileCompletion` picks it up → 100%.

**Rationale**: Spec is unambiguous; over-validating would block users who want
to skip the LLM step.

---

*All open questions resolved.*
