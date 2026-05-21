# UI Contract: `/profile`

Server Component shell + a client wizard island. Reuses the Phase 2
`<DashboardNav active="profile" />`.

## Route

- **Path**: `/profile`
- **Method**: GET
- **Access**: signed-in users only.
- **Unauthenticated behavior**: server-side `redirect("/signin")` (302).

## Server inputs

```ts
// app/profile/page.tsx
const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/signin");

const [{ data: identity }, { data: curation }, { data: finalize }] = await Promise.all([
  supabase.from("profile_identity").select("*").eq("user_id", user.id).maybeSingle(),
  supabase.from("profile_curation").select("*").eq("user_id", user.id).maybeSingle(),
  supabase.from("profile_finalize").select("*").eq("user_id", user.id).maybeSingle(),
]);

const first = user.user_metadata?.first_name ?? "";
const last  = user.user_metadata?.last_name  ?? "";
```

`identity` / `curation` / `finalize` are passed as `initial` props into the
client wizard.

## Rendered structure (top → bottom)

1. **`<DashboardNav active="profile" />`** — Phase 2 component, unchanged.
2. **`<main>`** — centered column (`mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6`).
   1. **`<StepIndicator step={current} />`** — three circles connected by a
      horizontal line:
      - Index 1 "Identity", index 2 "Bio-Link", index 3 "Finalize".
      - Active circle: white-text number on `var(--neon-blue-gradient)`.
      - Completed circle (prior steps): neon-blue background, white check
        glyph.
      - Pending circle: gray background, gray number.
   2. **Wizard card** — `bg-white rounded-3xl shadow-md p-6 sm:p-10` containing
      the current form OR `<CongratulationsScreen />` if `?step=done`.
3. The page never renders all three forms simultaneously.

## `<ProfileWizard>` client component contract

```ts
type Props = {
  firstNameDefault: string;
  lastNameDefault: string;
  initial: {
    identity: ProfileIdentityRow | null;
    curation: ProfileCurationRow | null;
    finalize: ProfileFinalizeRow | null;
  };
};
```

Reads the current step from `useSearchParams().get("step")` (defaults to
`"identity"`). Renders the matching child form, passing the relevant `initial`
slice as defaults. On successful save, calls `router.push("?step=…", { scroll:
false })` to advance.

Permitted `step` values: `"identity" | "curate" | "finalize" | "done"`. Anything
else falls back to `"identity"`.

## Per-form contracts (UI)

### `<Form1Identity>`

- Title `<h2>Personal Information</h2>`.
- Subtitle line.
- Grid of inputs (2 columns at `sm:`, 1 column at mobile):
  - First Name (text, required, default from prop).
  - Last Name (text, required, default from prop).
  - WhatsApp (country-code `<select>` + number `<input>`, required, E.164).
  - "How did you hear about us?" (`<select>`, required, six options).
  - LinkedIn URL (text, required, regex).
- Bottom-right action: **Next Step** pill with right-arrow icon, neon-blue
  gradient (FR-010). No Back button (FR-008).
- Inline errors render directly under their input on submit failure.

### `<Form2Curation>`

- Title `<h2>Curate Your Intelligence</h2>` + subtitle.
- Five sections, stacked:
  1. **Current AI Usage** — pill row (single-select).
  2. **Main Reason for Signing Up** — pill row (single-select).
  3. **Topics of Interest** — chip grid (multi-select; client-side counter for
     UX, but exact-3 enforced on submit only — Principle VI).
  4. **Content Consumption Preference** — pill row (single-select).
  5. **Delivery Preferences** — gray sub-card containing two single-select rows
     (Language, Channel) with the subtitle "Routes everything downstream."
- Selected pill/chip: `bg: var(--neon-blue-gradient); color: white`.
- Unselected: white bg + 1px subtle border + dashboard-muted text.
- Bottom action row: **Back** (left, plain/outline) + **Next Step** (right,
  gradient).
- Section-level errors render under each section that failed.

### `<Form3Finalize>`

- Title `<h2>Finalize Intelligence Sync</h2>` + subtitle.
- Code block:
  - "PHASE 01" tag top-left.
  - "Copy Prompt" button top-right (icon + label).
  - Monospaced `<pre>` containing the fixed prompt string.
- Below the code block: "PHASE 02 Paste response here" label + multi-line
  `<textarea>` (placeholder copy from FR-037, unvalidated).
- Centered **Submit & Sync** button (gradient + sync icon).
- Centered **Back** button below Submit (plain/outline, no gradient).
- A small `<span role="status">` near the Copy button surfaces "Copied!"
  feedback on success.

### `<CongratulationsScreen>`

- Replaces the wizard card entirely (FR-042 — no card layout).
- Centered headline: `🎉 Profile complete! Your personalized intelligence sync is live.`
- One-shot `<Confetti>` island (mounts → animates ~2s → flips a `done` flag and
  stops rendering particles).
- Single gradient pill button "Go to Home" → `router.push("/home")`.
- No auto-redirect (FR-044).

## Accessibility

- Wizard card has `aria-live="polite"` so error messages are announced on
  submit failure.
- Each pill/chip uses `aria-pressed` for its selected state.
- The fixed prompt `<pre>` is `tabindex="0"` so it can be focused and
  manually copied if clipboard permission is denied.
- Confetti particles are wrapped in a `prefers-reduced-motion: reduce` media
  query that hides them entirely.

## Failure modes

| Condition | Behavior |
|---|---|
| `getUser()` returns null | redirect `/signin`. |
| Any profile-read query throws | render the wizard with empty defaults; log error. The user can still proceed. |
| Server Action returns `{ ok: false, errors }` | render inline errors; remain on the same step; preserve typed values. |
| Server Action throws | toast/inline "Something went wrong"; preserve typed values; remain on step. |
