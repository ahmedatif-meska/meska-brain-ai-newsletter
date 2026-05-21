# Data Model: Profile Wizard

Three new Supabase tables + writes to existing `auth.users.raw_user_meta_data` for
first/last name updates. All tables RLS-scoped to the owning user (Principle V).

---

## Entity: PersonalInfo — `profile_identity`

| Column | Type | Constraints | Source |
|---|---|---|---|
| `user_id` | `uuid` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | session |
| `whatsapp_e164` | `text` | `NOT NULL`, format `^\+[1-9]\d{6,14}$` (app-validated) | Form 1 |
| `referral_source` | `text` | `NOT NULL`, one of `google` / `linkedin` / `twitter_x` / `friend` / `meska_community` / `other` | Form 1 |
| `linkedin_url` | `text` | `NOT NULL`, matches LinkedIn regex (app-validated) | Form 1 |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | system |

### Validation (FR-013 → FR-017)

- First Name + Last Name are stored on `auth.users.raw_user_meta_data` (not in this
  table); both required.
- `whatsapp_e164`: required, regex `^\+[1-9]\d{6,14}$`.
- `referral_source`: required, must be one of the six enum values.
- `linkedin_url`: required, regex
  `^https:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9._-]{2,100}\/?(?:\?.*)?$`.

### State transitions

UPSERT-only. Re-saving Form 1 overwrites all fields and bumps `updated_at`.

---

## Entity: CurationPreferences — `profile_curation`

| Column | Type | Constraints | Source |
|---|---|---|---|
| `user_id` | `uuid` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | session |
| `ai_usage` | `text` | `NOT NULL`, one of `just_starting` / `casual` / `daily` / `builder` | Form 2 |
| `main_reason` | `text` | `NOT NULL`, one of `stay_current` / `find_tools` / `learn_deeply` / `lead_transformation` | Form 2 |
| `topics` | `text[]` | `NOT NULL`, `array_length(topics, 1) = 3`, each element ∈ fixed taxonomy | Form 2 |
| `consumption` | `text` | `NOT NULL`, one of `quick` / `short` / `medium` / `deep` | Form 2 |
| `language` | `text` | `NOT NULL`, one of `english` / `arabic` / `both` | Form 2 |
| `channel` | `text` | `NOT NULL`, one of `whatsapp` / `telegram` / `email` | Form 2 |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | system |

### Validation (FR-022 → FR-031)

- All six columns required on save; no partial saves.
- `topics`: exactly 3 distinct values from the 13-chip taxonomy (see
  `lib/profile/schema.ts` const tuple). Submission with ≠ 3 elements MUST fail
  with the inline error "Please select exactly 3 topics."

### State transitions

UPSERT-only. Re-saving Form 2 overwrites all fields and bumps `updated_at`. There
is no separate "change channel" UI — the user re-opens Form 2 and re-submits.

---

## Entity: IntelligenceSync — `profile_finalize`

| Column | Type | Constraints | Source |
|---|---|---|---|
| `user_id` | `uuid` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | session |
| `response_text` | `text` | `NOT NULL DEFAULT ''` — empty string is valid | Form 3 |
| `submitted_at` | `timestamptz` | `NOT NULL DEFAULT now()` | system |

### Validation (FR-037 → FR-040)

- The response textarea is **unvalidated**; empty submission is accepted as
  literal `''`.
- A row in this table → user is 100% complete (in conjunction with rows in the
  other two tables).

### State transitions

UPSERT-only. The first successful submit creates the row and the user crosses to
100% complete. Re-submitting (after editing the response in a later session)
overwrites `response_text` and bumps `submitted_at`; completion remains 100%.

---

## Entity: User — `auth.users` (read + targeted write)

This table is owned by Supabase Auth; Phase 3 only writes to
`raw_user_meta_data`:

| Field | Read | Write |
|---|---|---|
| `id` | yes (RLS key, prop into save actions) | no |
| `email` | yes (debug only) | no |
| `raw_user_meta_data.first_name` | yes (Form 1 default; `/home` greeting) | yes (Form 1 submit, via admin client) |
| `raw_user_meta_data.last_name` | yes (Form 1 default; `/home` greeting) | yes (Form 1 submit, via admin client) |
| `raw_user_meta_data.display_name` | (no) | yes (Form 1 submit — derived from first+last) |
| `raw_user_meta_data.full_name` | (no) | yes (Form 1 submit — derived from first+last) |

The Form 1 Server Action uses the existing `createSupabaseAdminClient()` (Phase 1)
to call `supabase.auth.admin.updateUserById(user.id, { user_metadata: {…} })`.
Other forms do not touch `auth.users`.

---

## Entity: ProfileCompletion (derived, read-only)

Unchanged in shape from Phase 2 — same return type, same call site (`/home`).
Implementation moves from a constant stub to a single `SELECT` against the three
tables above (see `contracts/server-actions.md` and `research.md` R3).

```ts
type ProfileCompletion = {
  percent: 0 | 33 | 66 | 100;
  formsCompleted: { identity: boolean; bioLink: boolean; finalize: boolean };
};
```

---

## Relationships

```
auth.users (1) ─┬─ profile_identity   (0..1)
                ├─ profile_curation   (0..1)
                └─ profile_finalize   (0..1)
```

Each child table has a `user_id` PK that doubles as the FK to `auth.users`. On
user delete, all three child rows cascade.
