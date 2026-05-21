# Walkthrough: Landing Redesign (supersedes 001's UI)

## 1. How to run

```powershell
# .env.local already populated from spec 001's quickstart? Skip to npm run dev.
copy .env.local.example .env.local   # if missing
# Fill Supabase Cloud values; ensure Email provider is enabled with "Confirm email" OFF.

npm install
npm run dev                          # http://localhost:3000
```

Open `http://localhost:3000`. The browser must land on `http://localhost:3000/signup` immediately (307 redirect).

## 2. Implemented features

| Story | Where to observe |
|---|---|
| US1 — Email/password sign-up (P1) | `/signup` form → `app/(auth)/_actions/signup.ts` → Supabase user with empty `first_name`/`last_name`, `auth_method: 'password'` → redirect to `/signin?signedup=1`. |
| US1 — Single-column reference layout | `app/signup/page.tsx` — wordmark · pill · 2-line hero with "AI insights" gradient · `<AuthCard><SignupForm /></AuthCard>` · T&C footer copy. |
| US1 — Single SIGN UP label, no tab strip | `components/auth/AuthCard.tsx`. |
| US1 — Email + Password fields only | `components/auth/SignupForm.tsx` (no first/last name, no Google button, no "or" divider). |
| US2 — In-card "Sign in" link | `components/auth/SignupForm.tsx` — `<Link href="/signin">` below the submit button. |
| US3 — `/` redirects to `/signup` | `app/page.tsx` calls `redirect('/signup')` from `next/navigation`. 307. |
| US4 — Stars visible behind card | `AuthCard` uses `rgba(10, 18, 48, 0.55)` + `backdrop-blur-md` over the page-wide `<canvas>`. |
| US4 — Parallax over card | `components/background/StarField.tsx` listens to `pointermove` on `window`; the card does not stop propagation. Reduce-motion freezes both twinkle and parallax. |
| Cleanup | `app/auth/callback/route.ts` removed; `components/auth/GoogleButton.tsx` removed. |

## 3. Manual verification

### Desktop (≥1280 px)

1. Open `/` → URL settles on `/signup`. Inspect Network: `/` returns 307 with `Location: /signup`. No flash of any prior content.
2. Confirm visible order top-to-bottom: wordmark, pill (`AI-HYPERPERSONALIZED NEWSLETTER`), hero ("Eliminate the noise. Get hyper-personalized" / "AI insights on your preferred channel." with "AI insights" in blue), card, "By signing up, you agree to our Terms and Conditions." footer line.
3. Inside card: "SIGN UP" header label, "Create account" title, subtitle, Email field, Password field with eye toggle, strength meter, "Sign up" button (full width, neon-blue gradient), "Already have an account? Sign in" link.
4. Type `Aa1!aaaa` into Password → meter shows "strong"; no other field has an error.
5. Click eye icon → password becomes visible without losing value. Click again → re-masked.
6. Click Sign up with empty fields → inline errors under both Email and Password; red borders.
7. Submit `jane@example.com / Aa1!aaaa` → land on `/signin?signedup=1` with green banner. Confirm Supabase row exists with empty names and `auth_method: 'password'`.
8. Re-submit same email → inline error "An account with this email already exists. Sign in instead."
9. Click the in-card "Sign in" link → URL becomes `/signin`.
10. Click "Meska Brain" wordmark → URL settles on `/signup` (via `/`).
11. Confirm no Google button, no LinkedIn button, no T&C checkbox anywhere on the page.
12. Move pointer across the page including over the card — stars drift in 2D. Stars are perceptible behind the card surface.

### Mobile (≤390 px)

Reload at 390 px. Single column stays single column. Hero remains 2 lines. Pill remains 1 line. Card is full-width within the 390 px container. Repeat steps 4–10.

### Reduced motion

OS-level reduce motion ON → reload `/signup`. Stars are static; layout unchanged.

### Cleanup verification

```powershell
Test-Path app/auth/callback/route.ts        # → False
Test-Path components/auth/GoogleButton.tsx  # → False
```

### Bundle leak

```powershell
npm run build
Select-String -Path ".next/static/**/*.js" -Pattern "SUPABASE_SERVICE_ROLE_KEY" -SimpleMatch
# Expected: zero matches
```

### Gates

```powershell
npx tsc --noEmit   # clean
npm run lint       # clean
```

## 4. Known gaps / deferred items

- **Sign-in form, session handling, `/home` redirect** — Phase 2 (`specs/002-dashboard-home`).
- **First/Last Name capture** — moved to Phase 3 Form 1. Sign-up rows now carry empty `first_name`/`last_name`. The Phase 2 dashboard greeting needs an empty-name fallback ("Welcome back 👋") — flagged in `specs/004-landing-redesign/data-model.md`.
- **Google OAuth sign-up** — removed from MVP. Can be reintroduced as a later phase if needed.
- **Password reset, magic links, email verification** — not in MVP.
- **`/terms` page** — `Terms and Conditions` link points to `/terms`, which does not yet have a page. Acceptable per FR-017.

## 5. Constitution gate summary

| Principle | Status |
|---|---|
| II — Design Fidelity | PASS — tokens unchanged; LinkedIn / T&C checkbox not reintroduced. |
| III — Responsive Parity | PASS — single column simplifies parity; clamp-based hero verified. |
| IV — RSC Performance | PASS — 4 client components (`StarField`, `SignupForm`, `PasswordField`, `PasswordStrengthMeter`). Down from 5. |
| V — Privacy/Auth | PASS — service-role key remains in `lib/supabase/admin.ts` only. OAuth route removed. |
| VI — Validation Discipline | PASS — submit-only validation; strength meter is the only live UI. |
| VIII — Artifact Structure | PASS — this walkthrough exists alongside plan.md / tasks.md / spec.md. |
