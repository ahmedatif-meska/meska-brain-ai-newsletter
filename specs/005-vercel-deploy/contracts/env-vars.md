# Contract: Environment Variables

Set these in **Vercel → Project Settings → Environment Variables**. Tick the
appropriate scope checkboxes. **Never** commit real values.

| Name | Client-exposed | Required | Scopes | Source | Rotation |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | Production, Preview, Development | Supabase → Project Settings → API → Project URL | Effectively static; only changes if the project is renamed. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | Production, Preview, Development | Supabase → Project Settings → API → `anon` `public` key | Rotate from Supabase Studio → API. Old key stays valid until refresh, so push the new value first, then click "Refresh" in Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | yes | Production, Preview, Development | Supabase → Project Settings → API → `service_role` `secret` key | Treat as a database root password. Rotate by issuing a new key in Supabase, updating Vercel's variable for the affected environment, then redeploying. |

## Per-environment value sources

If three separate Supabase projects exist (recommended):

| Environment | Supabase project |
|---|---|
| Production | `meska-prod` |
| Preview | `meska-staging` |
| Development | `meska-dev` (or local `.env.local`) |

If only one Supabase project exists at launch (known-gap fallback), all three
Vercel environments point at it. Document this in `walkthrough.md`.

## Local development

A `.env.example` lives at repo root with the three variable names and no values.
Contributors copy it to `.env.local` and paste their dev keys. `.env.local` and
`.env*.local` MUST remain in `.gitignore`.

## What MUST NOT appear here

- `OPENAI_API_KEY`, `STRIPE_SECRET`, or any other secret not actually consumed by
  the current codebase. Add them only when a feature ships that uses them.
- Any default value or fallback hardcoded in the codebase — the admin client
  currently throws if the service-role key is missing, which is the desired
  behavior. Do not add defaults.

## Validation

After setting all three variables for an environment:

1. Trigger a deployment for that environment.
2. From the deployed URL, attempt signup with a throwaway email.
3. Confirm the user appears in Supabase → Authentication → Users.
4. Sign in and confirm the session cookie is set.

If any step fails, recheck variable spelling and scope — most failures here are
a typo in the variable name or scoping the variable to the wrong environment.
