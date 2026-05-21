# Quickstart: Sign-up Page

Local set-up steps so a reviewer can run `/signup` end-to-end on Windows.

## Prerequisites

- Node 20+ (`node -v`)
- A Supabase project (free tier is fine)
- A Google Cloud OAuth 2.0 Client (Web application) wired into the Supabase project's Auth → Providers → Google

## 1. Supabase configuration

In the Supabase dashboard for your project:

1. **Auth → Providers → Email**: enable "Email"; **disable** "Confirm email" (Phase 1 has no verification step).
2. **Auth → Providers → Google**: enable; paste the Google OAuth Client ID and Secret. Set the authorized redirect URL Google requires to the Supabase callback shown on that screen.
3. **Auth → URL Configuration**: add `http://localhost:3000/auth/callback` and `http://localhost:3000` to the redirect allow-list.
4. **Project Settings → API**: copy the Project URL, the `anon` key, and the `service_role` key.

## 2. Environment variables

Create `.env.local` in the repo root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

The service-role key is server-only — it MUST NOT be prefixed with `NEXT_PUBLIC_`.

## 3. Install & run

```powershell
npm install
npm install @supabase/supabase-js @supabase/ssr
npm run dev
```

Open `http://localhost:3000/signup`.

## 4. Smoke test (golden path)

1. **Email/password**: fill `Jane / Doe / jane@example.com / Aa1!aaaa` → Sign up → land on `/signin`. Confirm in the Supabase dashboard → Authentication → Users that the row exists with `first_name`/`last_name` metadata.
2. **Google**: click Sign up with Google → consent with a test account → land on `/signin`. Confirm the row exists with the Google-supplied first/last name.
3. **Duplicate email**: re-submit step 1 with the same email → inline error under the Email field reads "An account with this email already exists. Sign in instead."
4. **Strength meter**: type `a`, `aa`, `Aa1`, `Aa1!aaaa` into the password field — the meter walks weak → medium → strong without any other validation appearing.
5. **Eye toggle**: click the eye icon — masked text becomes visible without changing the value.
6. **SIGN IN tab**: click the SIGN IN tab → URL becomes `/signin`.
7. **Wordmark**: click "Meska Brain" → URL becomes `/`.

## 5. Responsive verification (Constitution III gate)

Using browser devtools responsive mode, render `/signup` at 360, 768, 1280, and 1920 px widths. Confirm the hero headline and badge text keep the same line count at every width. No text wraps onto extra lines on mobile.

## 6. Reduced motion

Open OS-level "reduce motion" (Windows: Settings → Accessibility → Visual effects → Animation effects off) and reload `/signup`. Stars and parallax should freeze or noticeably reduce; layout is unchanged.

## 7. Pre-merge gates

```powershell
npx tsc --noEmit
npm run lint
```

Both must pass clean. Then the manual click-through above is the final gate per Constitution VIII.
