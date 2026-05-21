# Walkthrough: Phase 1 — Sign-up Page

## 1. How to run the phase

```powershell
# From repo root
copy .env.local.example .env.local
# Fill in real values from your Supabase Cloud project:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY

# Supabase dashboard prerequisites (one-time):
#   Auth → Providers → Email: enable; UNCHECK "Confirm email".
#   Auth → Providers → Google: enable with Google OAuth Client ID + Secret.
#   Auth → URL Configuration: add http://localhost:3000/auth/callback
#                             and http://localhost:3000 to the allow list.

npm install            # if not already
npm run dev            # http://localhost:3000
```

Open `http://localhost:3000/signup`.

## 2. Implemented features

| Story | Where to observe |
|---|---|
| US1 — Email/password sign-up | `/signup` form → Server Action `app/(auth)/_actions/signup.ts` → Supabase `auth.users` row created, redirect to `/signin?signedup=1`. |
| US1 — Live password strength meter | `components/auth/PasswordStrengthMeter.tsx` (weak/medium/strong segments). |
| US1 — Eye toggle | `components/auth/PasswordField.tsx`. |
| US1 — Submit-only validation | `lib/validation/signup.ts` consumed by the Server Action; client only renders the result. |
| US1 — Duplicate-email inline error | Surfaced by the Server Action under the Email field. |
| US2 — Google OAuth sign-up | `components/auth/GoogleButton.tsx` → Supabase OAuth → `app/auth/callback/route.ts` → name backfilled from Google profile → `supabase.auth.signOut()` → redirect to `/signin?signedup=1` (or `/signin?reason=existing` for an existing email). |
| US3 — Cross-navigation | SIGN IN tab in `components/auth/AuthCard.tsx` is `<Link href="/signin">`; wordmark in `components/chrome/Wordmark.tsx` is `<Link href="/">`. |
| Dark starry sky + parallax | `components/background/StarField.tsx` (canvas, two depth layers, respects `prefers-reduced-motion`). |
| Mesh blue glow behind card | Radial gradient in `components/auth/AuthCard.tsx` driven by `--mesh-glow`. |
| AI HYPERPERSONALIZED NEWSLETTER pill | `components/ui/Pill.tsx` with star-rendered leading dot (animated ping + neon gradient). |
| Hero with blue-tinted accent | Headline in `app/signup/page.tsx` uses `clamp()` font sizing and the `--neon-blue-gradient` token. |
| Design tokens | All colors flow from CSS custom properties in `app/globals.css`; no hex per component. |

## 3. Manual verification steps

### Desktop (≥1280 px)

1. Open Chrome at 1440×900. Navigate to `/signup`.
2. Confirm: wordmark top-left; starry-sky background animating; mesh glow behind card; pill badge with star dot at top of hero; headline with blue accent; SIGN UP / SIGN IN tabs at top of card; Google button; First/Last/Email/Password form; strength meter below password.
3. Type `a` → meter weak; type `Aa1!aaaa` → meter strong within ~one frame.
4. Click the eye icon — password becomes visible without losing the value. Click again — re-masked.
5. Click Sign up with all fields empty → inline errors appear under each missing field; field borders turn red.
6. Submit `Jane / Doe / jane+wt@example.com / Aa1!aaaa` → browser navigates to `/signin?signedup=1`; the green "Account created" banner shows. Confirm in Supabase dashboard → Authentication → Users that the row exists with `user_metadata.first_name = "Jane"` and `user_metadata.last_name = "Doe"`.
7. Re-submit the same email → "An account with this email already exists. Sign in instead." appears under the Email field; no second user row.
8. Double-click Sign up rapidly → button shows "Creating account…" and is disabled; only one row is created.
9. Click "Sign up with Google" → consent → land on `/signin?signedup=1` (fresh) or `/signin?reason=existing` (duplicate). Confirm Google name landed in `user_metadata`.
10. Click the SIGN IN tab → URL becomes `/signin`. Click the Meska Brain wordmark → URL becomes `/`.

### Mobile (≤390 px)

1. Open DevTools responsive mode at 390 px. Reload `/signup`.
2. Hero, pill, and card stack vertically; the headline and pill text retain the same line count as desktop (2-line headline, 1-line pill).
3. Repeat steps 3–6 above on the narrow viewport.

### Reduced motion

1. Windows: Settings → Accessibility → Visual effects → turn Animation effects OFF. Reload `/signup`.
2. Stars freeze (no twinkle, no parallax). Layout unchanged.

### Bundle-leak check (Constitution V)

```powershell
npm run build
# Then search the produced client chunks for the service-role key name.
Select-String -Path ".next/static/**/*.js" -Pattern "SUPABASE_SERVICE_ROLE_KEY" -SimpleMatch
# Must produce zero matches.
```

### Gates

```powershell
npx tsc --noEmit   # must pass clean
npm run lint       # must pass clean
```

## 4. Known gaps / deferred items

- **Sign-in flow itself** — `/signin` is currently a placeholder that receives the post-sign-up redirect. The full sign-in form, session handling, and `/home` redirect ship in **Phase 2 (Dashboard home)**.
- **Password reset / change email / magic links** — deferred; not in any current phase.
- **Email verification** — intentionally disabled per the plan; not coming back.
- **Phase 2 dashboard greeting, Profile Progress card, top nav** — Phase 2.
- **Phase 3 profile wizard (Forms 1/2/3) and channel/language fields** — Phase 3.
- **Automated tests (unit / e2e)** — deferred; manual click-through above is the gate per Constitution VIII.
- **Rate limiting / anti-abuse** — explicit non-goal per spec Assumptions.
- **Internationalization of sign-up copy** — out of scope.

## 5. Constitution gate summary

| Principle | Status |
|---|---|
| II — Design Fidelity | PASS — neon-blue gradient, dark-sky, mesh-glow defined once in `app/globals.css`, consumed by name. |
| III — Responsive Parity | PASS — `clamp()` sizing + `max-width: 20ch` headline; verified at 360/768/1280/1920. |
| IV — RSC Performance | PASS — only `StarField`, `SignupForm`, `PasswordField`, `PasswordStrengthMeter`, `GoogleButton` are `"use client"`. |
| V — Privacy/Auth | PASS — service-role key lives only in `lib/supabase/admin.ts` (server-only); not present in client bundle. |
| VI — Validation Discipline | PASS — all field validation runs in the Server Action; only strength meter is live. |
| VIII — Artifact Structure | PASS — this walkthrough exists alongside plan.md / tasks.md / spec.md. |
