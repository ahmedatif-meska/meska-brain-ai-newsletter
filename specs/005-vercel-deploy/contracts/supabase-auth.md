# Contract: Supabase Auth URL Configuration

Configure in **Supabase Studio → Authentication → URL Configuration**.

## Site URL

Set to the **production** origin only. Example: `https://meska.ai` (or
`https://www.meska.ai` — pick one and be consistent; the same value must be the
canonical host the app serves).

This is the fallback `redirectTo` Supabase uses when an email link's intended
target is not on the allow-list. It controls password-reset and email-confirmation
templates.

## Redirect URLs (allow-list)

Each entry is a fully-qualified URL. Supabase allows one `*` wildcard in the
hostname segment.

| Pattern | Purpose | Environment |
|---|---|---|
| `https://<prod-host>/auth/callback` | Production password reset callback. | Production |
| `https://<prod-host>/auth/callback?next=/update-password` | Exact-string variant Supabase will match when the action passes `next` in the query. | Production |
| `https://*.vercel.app/auth/callback` | All preview deployment callbacks share one wildcard entry. | Preview |
| `https://*.vercel.app/auth/callback?next=/update-password` | Exact-query variant for previews. | Preview |
| `http://localhost:3000/auth/callback` | Local dev. Keep — Supabase validates the recipient, not just the URL. | Development |
| `http://localhost:3000/auth/callback?next=/update-password` | Exact-query variant for local dev. | Development |

Replace `<prod-host>` with the actual production host once the custom domain is
attached (e.g., `meska.ai`). If no custom domain is attached at launch, use the
Vercel-provided production hostname (e.g., `meska-brain.vercel.app`) and add
the custom domain entry once it is connected.

## Email templates

Leave the default "Reset Password" template's `{{ .ConfirmationURL }}` token
unchanged. The template substitutes the URL computed from `Site URL +
redirectTo`, which the allow-list above will permit.

## Verification

After saving the configuration:

1. From the **production** deployment, request a password reset for a real test
   user.
2. Open the email on a separate device.
3. Confirm the link host equals the production host (NOT `localhost`, NOT a
   preview hostname).
4. Click the link. The user is redirected via `/auth/callback?code=…` to
   `/update-password` with an authenticated session.
5. Submit a new password. The user lands on `/signin?pwreset=1` with the
   "Password updated. Sign in with your new password." banner.

Repeat steps 1-5 from a **preview** deployment and confirm the link host is
`*.vercel.app` and that the same flow succeeds.

## What MUST NOT appear here

- `http://localhost:3001` or `http://localhost:3002`. The `npm run dev` script
  always tries `3000` first; if a contributor's machine has it occupied, the
  fallback ports are temporary and adding them invites stale entries.
