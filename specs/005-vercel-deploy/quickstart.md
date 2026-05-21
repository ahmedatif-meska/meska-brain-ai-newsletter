# Quickstart: Deploy Meska Brain to Vercel

Target audience: a maintainer who has a Vercel account and admin access to the
Supabase project. Estimated time: 15 minutes to a working production URL.

## Prerequisites

- GitHub repo `meska-brain-ai-newsletter` accessible to your Vercel account.
- Supabase project with the three keys in hand (URL, anon, service-role).
- (Optional) A domain you control. If you don't have one yet, you can skip the
  custom domain step and use the `*.vercel.app` URL Vercel issues for free.

## 1. Connect the repository to Vercel (≈ 3 min)

1. Vercel dashboard → **Add New… → Project**.
2. Pick the GitHub repository. Vercel detects Next.js 16 automatically — leave
   build settings at defaults (Build Command: `next build`, Output: `.next`,
   Install: `npm install`, Dev: `next dev`).
3. **Do not deploy yet.** Click **Environment Variables** first.

## 2. Set environment variables (≈ 2 min)

Per `contracts/env-vars.md`, add each of:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Tick **Production, Preview, Development** for each. If you have separate
Supabase projects per environment, paste the matching values; if you only have
one Supabase project at launch, paste the same values across all three scopes
and note this as a known gap in `walkthrough.md`.

Click **Deploy**.

**Verification**: the first deployment finishes green and Vercel shows a URL
ending in `.vercel.app`. Open it. The `/signup` page loads with the starfield
animation, the headline gradient, and the signup card.

## 3. Configure Supabase Auth (≈ 3 min)

Per `contracts/supabase-auth.md`:

1. Supabase Studio → **Authentication → URL Configuration**.
2. Set **Site URL** to the production origin (your `*.vercel.app` URL for now,
   or your custom domain if step 5 is done first).
3. Under **Redirect URLs**, add the six entries listed in the contract.
4. **Save**.

**Verification**: from the deployed URL, visit `/reset-password`, submit a real
test email. Within 60 seconds, the email arrives. Its link host equals the
Site URL host (NOT `localhost`).

## 4. End-to-end auth smoke test (≈ 4 min)

On the deployed URL:

1. **Signup**: `/signup` → enter a fresh first/last/email/password → submit.
   Expect redirect to `/signin?signedup=1` with the "Account created" banner.
2. **Signin**: enter the same credentials. Expect redirect to `/home`.
3. **Sign out** (from `/home`).
4. **Password reset**: `/signin` → click "Forgot?" → submit the email. Open
   the email, click the link. Expect `/update-password` with the user already
   logged in. Submit a new password. Expect redirect to `/signin?pwreset=1`.
5. **Re-signin** with the new password. Expect redirect to `/home`.

**Verification**: all five steps succeed and Supabase Studio → Authentication →
Users shows the test user with the most recent `last_sign_in_at` matching now.

## 5. (Optional) Attach a custom domain (≈ 3 min)

1. Vercel project → **Settings → Domains** → add `meska.ai` (or your domain).
2. Follow Vercel's DNS instructions (CNAME or A/AAAA depending on your DNS
   provider).
3. Wait for **Valid Configuration** and **SSL: Issued**.
4. Re-open Supabase URL Configuration and update **Site URL** to the custom
   domain. Add the custom-domain `/auth/callback` entries to the Redirect
   URLs list (keep the `*.vercel.app` ones for previews).

**Verification**: `curl -I https://<your-domain>/signup` returns HTTP/2 200 with
a valid `strict-transport-security` header.

## 6. Enable Preview Deployment Protection (≈ 1 min)

1. Vercel project → **Settings → Deployment Protection**.
2. Enable **Vercel Authentication** for **Preview** only (leave **Production**
   public).
3. Save.

**Verification**: open a recent preview URL in a private browser window.
Vercel intercepts with a sign-in prompt.

## 7. Mobile-fit smoke test (NON-NEGOTIABLE — Principle III) (≈ 2 min)

In Chrome DevTools or a real device:

1. Open `/signup` at **390 × 844** (iPhone 14). Confirm no horizontal scroll,
   headline holds two lines, the starfield is visible behind the card.
2. Repeat at **360 × 800** (smallest commonly-supported Android).
3. Repeat at **≥ 1280px** desktop.
4. Run the same checks for `/signin`, `/reset-password`, `/update-password`.

**Verification**: zero horizontal scrollbars; no element clipped or off-screen.
Record results in `walkthrough.md`.

## 8. Rollback drill (≈ 1 min)

1. Vercel project → **Deployments** → pick the previous successful production
   deployment → **⋯ → Promote to Production**.
2. Confirm. Open the production URL.

**Verification**: the previous commit's content is served. Elapsed time from
click to served < 2 minutes. Record the elapsed time in `walkthrough.md`. Then
re-promote the latest commit to restore current state.

## Troubleshooting

- **"Server is not configured"** on signup: a Vercel environment variable is
  missing or scoped to the wrong environment. Recheck step 2.
- **Reset email link goes to `localhost`**: Supabase Site URL is still
  `http://localhost:3000`. Recheck step 3.
- **Preview deploys 404 on `/auth/callback`**: the wildcard entry
  `https://*.vercel.app/auth/callback` was omitted. Recheck step 3.
- **Production build fails on `next.config.ts`**: a dev-only experimental flag
  is still present. See `research.md` decision 2.
