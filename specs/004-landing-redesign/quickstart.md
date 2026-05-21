# Quickstart: Landing Redesign

Local set-up steps so a reviewer can run the redesigned `/signup` end-to-end on Windows. Assumes the 001-era Supabase Cloud project (and `.env.local`) is already in place; if not, do that first per `specs/001-signup-page/quickstart.md`.

## 1. Prerequisites

- Node 20+
- A Supabase Cloud project with Email auth enabled and "Confirm email" turned **off**
- `.env.local` populated (see `.env.local.example`)

## 2. Run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Confirm the browser is on `http://localhost:3000/signup` (the `/` redirect). The "Get started" landing must NOT be visible at any point.

## 3. Smoke test (matches the reference image)

1. **Layout**: at 1280 px, confirm the visible order: wordmark (top-left), centred pill "AI-HYPERPERSONALIZED NEWSLETTER", 2-line hero ("Eliminate the noise. Get hyper-personalized" / "AI insights on your preferred channel.") with "AI insights" in the neon-blue gradient, the card, the T&C footer copy.
2. **Card content**: confirm "SIGN UP" label at the top of the card; "Create account" title; subtitle; Email field; Password field with eye toggle; strength meter; "Sign up" button; "Already have an account? Sign in" link below.
3. **No social-auth**: confirm there is no Google button and no LinkedIn button anywhere on the page.
4. **Sign-up happy path**: submit `jane@example.com` / `Aa1!aaaa`. Confirm the browser lands on `/signin?signedup=1` and the green "Account created" banner shows. Confirm the user row exists in the Supabase dashboard with empty `first_name`/`last_name` and `auth_method: 'password'`.
5. **Duplicate email**: resubmit the same email. Inline error under Email reads exactly: "An account with this email already exists. Sign in instead."
6. **Eye toggle**: click the eye icon — masked password becomes visible without losing the typed value.
7. **Strength meter**: type `a` → weak; `Aa1!aaaa` → strong within ~one frame.
8. **In-card sign-in link**: click "Sign in" inside the card → URL becomes `/signin`.
9. **Wordmark**: click "Meska Brain" → URL becomes `/signup` (via the `/` redirect).
10. **T&C copy is non-blocking**: never click the T&C text; sign-up still works.

## 4. Stars behind card + hover parallax

1. Stand still: confirm stars twinkle in the dark-sky background.
2. Move pointer slowly across the page in a wide arc. Stars should drift along a 2D parallax — closer (larger) stars drift more than the far layer.
3. Move the pointer **over the card**. Stars behind the card surface should still drift — the card is translucent and `pointermove` continues to fire on `window`.
4. Open OS reduce-motion (Windows Settings → Accessibility → Visual effects → Animation effects OFF) and reload. Stars are static; layout unchanged.

## 5. Responsive verification (Constitution III)

Open DevTools responsive mode. Render `/signup` at 360, 768, 1280, 1920 px. Confirm:

- Hero stays 2 lines at every width.
- Pill stays 1 line at every width.
- Card width is bounded (single column on mobile, centred + bounded on desktop).
- No horizontal scroll.

## 6. Bundle-leak audit (Constitution V)

```powershell
npm run build
Select-String -Path ".next/static/**/*.js" -Pattern "SUPABASE_SERVICE_ROLE_KEY" -SimpleMatch
# Expected: zero matches
```

## 7. Pre-merge gates

```powershell
npx tsc --noEmit
npm run lint
```

Both must pass clean.

## 8. Cleanup verification

```powershell
# Files that MUST be gone in this revision:
Test-Path app/auth/callback/route.ts        # → False
Test-Path components/auth/GoogleButton.tsx  # → False
```

If either prints `True`, the cleanup tasks did not run.
