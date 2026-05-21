# Server Actions Contract

All three save actions follow the same shape: validate → upsert → revalidate.
Validation uses `lib/profile/validators.ts`; persistence uses the SSR Supabase
client (which respects RLS as the calling user) except for the `auth.users`
metadata write in `saveIdentity`, which requires the admin client.

---

## Shared types (`lib/profile/schema.ts`)

```ts
export const REFERRAL_SOURCES = [
  "google","linkedin","twitter_x","friend","meska_community","other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const AI_USAGES = ["just_starting","casual","daily","builder"] as const;
export type AiUsage = (typeof AI_USAGES)[number];

export const MAIN_REASONS = [
  "stay_current","find_tools","learn_deeply","lead_transformation",
] as const;
export type MainReason = (typeof MAIN_REASONS)[number];

export const CONSUMPTIONS = ["quick","short","medium","deep"] as const;
export type Consumption = (typeof CONSUMPTIONS)[number];

export const LANGUAGES = ["english","arabic","both"] as const;
export type Language = (typeof LANGUAGES)[number];

export const CHANNELS = ["whatsapp","telegram","email"] as const;
export type Channel = (typeof CHANNELS)[number];

export const TOPICS = [
  "Generative AI","LLM Research","AI Ethics","Prompt Engineering",
  "Robotics","AI Policy","Autonomous Agents","Compute Infrastructure",
  "Neuroscience","Coding Assistants","Voice AI","Venture Capital",
  "Cybersecurity",
] as const;
export type Topic = (typeof TOPICS)[number];

export type WizardFieldError = {
  field:
    | "firstName" | "lastName"
    | "whatsapp" | "referralSource" | "linkedinUrl"
    | "aiUsage" | "mainReason" | "topics" | "consumption" | "language" | "channel"
    | "form";
  message: string;
};

export type SaveResult =
  | { ok: true }
  | { ok: false; errors: WizardFieldError[] };
```

---

## `saveIdentity(_: unknown, formData: FormData): Promise<SaveResult>`

Server Action at `app/_actions/save-identity.ts`.

**Inputs (FormData keys)**: `firstName`, `lastName`, `whatsapp`, `referralSource`,
`linkedinUrl`.

**Behavior**:

1. Read session via `createSupabaseServerClient()`; redirect `/signin` if no user.
2. Trim names. Validate:
   - `firstName`, `lastName` required, ≤ 60 chars, Phase 1 NAME regex (reuse
     `lib/validation/signup.ts` `validateName`).
   - `whatsapp` matches `^\+[1-9]\d{6,14}$`.
   - `referralSource` ∈ `REFERRAL_SOURCES`.
   - `linkedinUrl` matches the LinkedIn regex.
3. UPSERT into `public.profile_identity`:
   ```ts
   await supabase.from("profile_identity").upsert({
     user_id: user.id,
     whatsapp_e164: whatsapp,
     referral_source: referralSource,
     linkedin_url: linkedinUrl,
   });
   ```
4. Write first/last + derived display fields to `auth.users.raw_user_meta_data`
   via the admin client (so the `/home` greeting reflects edits — FR-019):
   ```ts
   await admin.auth.admin.updateUserById(user.id, {
     user_metadata: {
       first_name, last_name,
       full_name: `${first_name} ${last_name}`.trim(),
       display_name: `${first_name} ${last_name}`.trim(),
       name: `${first_name} ${last_name}`.trim(),
     },
   });
   ```
5. `revalidatePath("/home")` and `revalidatePath("/profile")`.
6. Return `{ ok: true }`. The client then routes to `?step=curate`.

**Errors**: per-field messages mapped to `WizardFieldError.field`; mid-flow
Supabase errors → `{ field: "form", message: "Save failed. Try again." }`.

---

## `saveCuration(_: unknown, formData: FormData): Promise<SaveResult>`

Server Action at `app/_actions/save-curation.ts`.

**Inputs (FormData keys)**: `aiUsage`, `mainReason`, `topics` (JSON-stringified
array of exactly 3 strings), `consumption`, `language`, `channel`.

**Behavior**:

1. Session check; redirect `/signin` if no user.
2. Validate:
   - Each scalar enum value is a member of its respective const tuple.
   - `topics` parses to a `string[]` with `length === 3`, no duplicates, every
     element ∈ `TOPICS`.
3. UPSERT into `public.profile_curation` with all six columns.
4. `revalidatePath("/home")` and `revalidatePath("/profile")`.
5. Return `{ ok: true }`. Client routes to `?step=finalize`.

**Errors**: per-section messages mapped to the offending field. The Topics
section message is exactly `"Please select exactly 3 topics."` (FR-024, FR-031).

---

## `saveFinalize(_: unknown, formData: FormData): Promise<SaveResult>`

Server Action at `app/_actions/save-finalize.ts`.

**Inputs (FormData keys)**: `responseText` (may be empty).

**Behavior**:

1. Session check; redirect `/signin` if no user.
2. NO validation on `responseText` (FR-038). Coerce missing → `""`.
3. UPSERT into `public.profile_finalize` with `response_text` + `submitted_at =
   now()`.
4. `revalidatePath("/home")` and `revalidatePath("/profile")`.
5. Return `{ ok: true }`. Client transitions to `<CongratulationsScreen>` (no
   route change — the screen is rendered in place of the wizard within
   `/profile`). The Go-to-Home button then routes to `/home`.

**Errors**: only `{ field: "form", message: "Submission failed. Try again." }`
on Supabase failure (per Edge Case "Submit & Sync fails server-side"). The
client preserves the typed response so the user can retry.

---

## `getProfileCompletion(userId: string)` rewrite

Located at `lib/profile/completion.ts`. Same signature; new body:

```ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormKey = "identity" | "bioLink" | "finalize";
export type ProfileCompletion = {
  percent: 0 | 33 | 66 | 100;
  formsCompleted: Record<FormKey, boolean>;
};

const TIERS = [0, 33, 66, 100] as const;

export async function getProfileCompletion(
  userId: string,
): Promise<ProfileCompletion> {
  const supabase = await createSupabaseServerClient();
  const [{ data: id1 }, { data: id2 }, { data: id3 }] = await Promise.all([
    supabase.from("profile_identity").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("profile_curation").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("profile_finalize").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  const formsCompleted = {
    identity: Boolean(id1),
    bioLink:  Boolean(id2),
    finalize: Boolean(id3),
  };
  const count = Number(formsCompleted.identity)
              + Number(formsCompleted.bioLink)
              + Number(formsCompleted.finalize);
  return { percent: TIERS[count] as ProfileCompletion["percent"], formsCompleted };
}
```

Three queries in parallel against PKs — sub-ms per call. The Phase 2 `/home`
implementation continues to consume this contract unchanged.

---

## Failure modes (cross-cutting)

| Condition | Action behavior |
|---|---|
| No session | `redirect("/signin")` from the action (no `SaveResult` returned). |
| Validation failure | Return `{ ok: false, errors: […] }` without touching the DB. |
| Supabase upsert error | Log + return `{ ok: false, errors: [{ field: "form", message: "Save failed. Try again." }] }`. The client keeps the form state intact. |
| Admin metadata update fails (saveIdentity only) | Log + still return `{ ok: true }` if the profile row was saved, because the greeting will catch up on next sign-in. Add a TODO comment so future-us can promote this to a hard failure if telemetry shows drift. |
