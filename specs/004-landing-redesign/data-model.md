# Data Model: Landing Redesign

This revision changes only what is **captured** at sign-up. The storage entity (`auth.users` in Supabase Cloud) is unchanged. No new tables; no schema migration.

## Entities

### User (`auth.users` — managed by Supabase Auth)

| Field | Type | Source | Notes |
|---|---|---|---|
| `id` | `uuid` | Supabase | Primary key. |
| `email` | `text` | Form (Email field) | Lowercased before duplicate check. Uniqueness case-insensitive. |
| `encrypted_password` | `text` (managed) | Supabase | Present for every MVP user (password is the only auth method). |
| `email_confirmed_at` | `timestamptz` | Set at creation | `email_confirm: true` keeps the user "confirmed" without sending a verification email. |
| `user_metadata.first_name` | `text` | (not set at sign-up) | **Empty string** at user creation. Populated later by Phase 3 Form 1. |
| `user_metadata.last_name` | `text` | (not set at sign-up) | **Empty string** at user creation. Populated later by Phase 3 Form 1. |
| `user_metadata.auth_method` | `'password'` | Set by sign-up code path | Diagnostic. |
| `created_at` | `timestamptz` | Supabase | Default. |

### Delta vs spec 001

- `first_name` / `last_name` are no longer populated at sign-up time. They start as empty strings and are filled in by the Phase 3 profile wizard.
- `auth_method` only takes the literal `'password'` for MVP (no `'google'` path).

### Validation rules

- **Email** — non-empty after trim; matches RFC-5322-lite regex; max length 254; lowercased before storage and duplicate check.
- **Password** — length ≥8 AND at least one of `[A-Z]`, one of `[0-9]`, one symbol from `` !@#$%^&*()_+-=[]{};':",.<>/?\|`~ ``.
- **No name validation** at sign-up.

### State transitions

One state: **Created**. Transition happens when the Server Action's call to `supabase.auth.admin.createUser` returns success. No further transitions in this phase.

## Implications for related specs

- **`specs/002-dashboard-home`**: greeting copy "Welcome back, {First Name} {Last Name} 👋" no longer has source data at first dashboard load. Fallback rule for that spec: render "Welcome back 👋" (no name) when both `first_name` and `last_name` are empty; render the available name(s) otherwise. To be confirmed in 002's `/speckit-plan`.
- **`specs/003-profile-wizard`**: Form 1 First Name and Last Name fields no longer have a pre-populated default for email/password users. They are empty inputs until the user types. To be confirmed in 003's `/speckit-plan`.

## Row-Level Security

`auth.users` is managed by Supabase. No application table is added in this phase; no RLS policy work.

## Indexes

None added by application code. Supabase enforces unique email at the `auth.users` level.
