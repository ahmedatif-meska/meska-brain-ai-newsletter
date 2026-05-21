# Data Model: Sign-up Page

Phase 1 introduces exactly one entity: the authenticated user. All persistence lives in Supabase Auth (`auth.users`). No application-managed profile table is created in this phase — profile fields (WhatsApp, LinkedIn, topics, channel, language, prompt response) arrive in Phase 3.

## Entities

### User (`auth.users` — managed by Supabase Auth)

| Field | Type | Source | Notes |
|---|---|---|---|
| `id` | `uuid` | Supabase | Primary key. |
| `email` | `text` | Form (email/password) or Google profile | Uniqueness enforced case-insensitively by Supabase Auth. |
| `encrypted_password` | `text` (managed) | Supabase | Present for email/password users; null for OAuth-only users. |
| `email_confirmed_at` | `timestamptz` | Set at creation | We set `email_confirm: true` at create time so the user is treated as confirmed without sending a verification email. |
| `user_metadata.first_name` | `text` | Form field (email/password) or Google `given_name` | Required. Used by Phase 2 greeting and Phase 3 Form 1 default. |
| `user_metadata.last_name` | `text` | Form field (email/password) or Google `family_name` | Required. |
| `user_metadata.auth_method` | `'password' \| 'google'` | Set by sign-up code path | Diagnostic; not used by UI in Phase 1. |
| `app_metadata.providers` | `text[]` | Supabase | Populated automatically by OAuth. |
| `created_at` | `timestamptz` | Supabase | Default. |

### Validation rules

- `email` — must match RFC-5322-lite regex; trimmed; lowercased before duplicate check.
- `first_name`, `last_name` — non-empty after trim; max length 80.
- `password` (email/password only) — length ≥8 AND contains at least one of each: uppercase `[A-Z]`, digit `[0-9]`, symbol from `` !@#$%^&*()_+-=[]{};':",.<>/?\|`~ ``.

### State transitions

There is one state in Phase 1: **Created**. A user becomes Created when:

- The email/password Server Action calls `supabase.auth.admin.createUser` successfully, or
- The Google OAuth callback completes successfully (whether the row already existed or was newly created — we treat both the same from the user's perspective and route to `/signin`).

No further transitions are defined in this phase. Sign-in, password reset, and email change are deferred.

## Row-Level Security

`auth.users` is managed by Supabase; RLS on this table is owned by Supabase and not modified by application code. No application table is created in this phase, so no RLS policies are written. Phase 3 will introduce a `profiles` table with `user_id`-scoped RLS per Constitution V.

## Index requirements

None added by application code. Supabase enforces unique email at the `auth.users` level.
