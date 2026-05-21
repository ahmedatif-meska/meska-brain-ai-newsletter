# Research: Sign-up Page

## Decisions

### 1. Framework + rendering model

- **Decision**: Next.js 16 App Router with React 19 Server Components by default. `/signup/page.tsx` is an RSC; interactive islands (`StarField`, `SignupForm`, `PasswordField`, `PasswordStrengthMeter`, `GoogleButton`) are explicit `"use client"` files.
- **Rationale**: Constitution Principle IV mandates RSC-first. The page is mostly static chrome (wordmark, badge, headline, card layout) with small client islands.
- **Alternatives considered**: Pages Router (rejected — legacy, no streaming); fully-client SPA (rejected — heavier bundle, violates Principle IV).

### 2. Styling

- **Decision**: Tailwind CSS v4 (already in `package.json`) via `@tailwindcss/postcss`. Design tokens (neon-blue gradient, dark-sky surface, mesh-glow color, error red, gray sub-card) defined as CSS custom properties in `app/globals.css` and exposed to Tailwind via `@theme`. Components reference tokens by name (`bg-[--neon-blue-gradient]` etc.) — no hex per component.
- **Rationale**: Constitution Principle II + Design System section require single-source tokens.
- **Alternatives considered**: CSS Modules per component (rejected — token reuse harder to enforce); inline hex values (rejected — explicitly forbidden by constitution).

### 3. Authentication provider

- **Decision**: Supabase Auth via `@supabase/supabase-js` + `@supabase/ssr` cookie helpers. Email verification disabled in the Supabase project settings. `auth.users.user_metadata` carries `first_name` and `last_name`.
- **Rationale**: Constitution V mandates Supabase Auth as the single identity store. `@supabase/ssr` is the official path for App Router cookie-based sessions.
- **Alternatives considered**: NextAuth/Auth.js (rejected — adds an indirection over Supabase, contradicts Principle V); custom JWT (rejected — reinventing the wheel and violating the principle).

### 4. Email/password sign-up implementation

- **Decision**: Client form posts to a Server Action (`app/(auth)/_actions/signup.ts`). The action validates server-side, then calls `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name, last_name } })` using a service-role client. `email_confirm: true` skips Supabase's verification email while still marking the user as confirmed (since the plan explicitly disables verification). On success the action returns a redirect to `/signin`. No session cookie is set (no auto-login per FR-016).
- **Rationale**: `supabase.auth.signUp` would either send a verification email (if confirmations are on) or auto-create-and-login (if confirmations are off). The plan needs the user to exist immediately *and* be sent to `/signin` to log in manually. `admin.createUser` is the only call that satisfies both. Service-role key is referenced only in `lib/supabase/admin.ts` (server-only, never imported by a client component).
- **Alternatives considered**: `signUp` with confirmations off (rejected — auto-logs the user in, violating FR-016); `signUp` with confirmations on (rejected — sends an email, violating FR-016).

### 5. Google OAuth implementation

- **Decision**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback?next=/signin' } })` from the browser. Supabase's OAuth callback hits `app/auth/callback/route.ts`, which exchanges the code for a session, reads the resulting user, copies `given_name`/`family_name` from `user.identities[0].identity_data` into `user_metadata.first_name`/`last_name` (idempotent), then **signs the user out** and redirects to `/signin`. If the email already exists, Supabase returns the existing user — we still sign out and redirect, but surface the "sign in instead" message via a `?reason=existing` query param on `/signin` (the duplicate guidance the spec asks for).
- **Rationale**: Supabase OAuth always returns a session; to satisfy the "no auto-login after sign-up" rule we explicitly sign out post-account-creation. Pulling first/last name from the identity payload satisfies FR-017 / FR-020.
- **Alternatives considered**: Custom Google OAuth via `googleapis` (rejected — duplicates Supabase's flow); keep the user logged in (rejected — violates the plan's "no auto-login" rule).

### 6. Password complexity & strength meter

- **Decision**: Validation rule lives in `lib/validation/signup.ts` and is shared between the client (for the inline error rendering after submit) and the Server Action (authoritative check). Rule: length ≥8 AND at least one of `[A-Z]`, one of `[0-9]`, one of a documented symbol set. The strength meter is heuristic: count satisfied classes + length buckets → weak / medium / strong. It runs entirely client-side on each keystroke (debounced to next animation frame to satisfy SC-007's 200ms budget).
- **Rationale**: Validation discipline (Principle VI) requires submit-only validation, but the strength meter is one of the three documented exceptions.
- **Alternatives considered**: `zxcvbn` library (rejected — ~400KB on the client, overkill for a 3-bucket indicator); server-side strength check (rejected — defeats the live update).

### 7. Animated starry background

- **Decision**: A single Client Component `StarField.tsx` renders to a `<canvas>` sized to the viewport. Stars are generated once in two depth layers; per-frame work is opacity flicker + small x/y offsets based on `mousemove` (parallax). Honors `window.matchMedia('(prefers-reduced-motion: reduce)')` by holding stars static.
- **Rationale**: Canvas is faster and cheaper than animating hundreds of DOM nodes; it isolates the animation cost inside one client island.
- **Alternatives considered**: SVG stars with CSS animations (rejected — paints too many layers on mobile); WebGL (rejected — overkill).

### 8. Responsive line count

- **Decision**: Hero headline uses `clamp()` font sizing and constrained `max-width` so that the same line breaks happen at 360/768/1280/1920. The badge uses `white-space: nowrap` (its content is short). Verified by manual width-check (Constitution III gate).
- **Rationale**: Constitution III is non-negotiable; SC-004 enumerates the four widths.
- **Alternatives considered**: JS-driven font fitting (rejected — flicker on load, accessibility issues); separate mobile copy (rejected — duplicates content).

### 9. Form validation library

- **Decision**: Hand-rolled validators in `lib/validation/signup.ts` returning `{ field: string; message: string }[]`. No external schema library.
- **Rationale**: Four fields with simple rules; adding Zod would balloon the dependency footprint with no payoff for this scope.
- **Alternatives considered**: Zod (rejected — overkill for four fields); React Hook Form (rejected — we explicitly do not want field-level live validation).

### 10. Testing & verification

- **Decision**: TypeScript (`tsc --noEmit`) + ESLint as compile gates. Manual click-through at 360px and 1280px before merge, per Constitution III. No automated test runner introduced this phase.
- **Rationale**: Constitution VIII mandates a walkthrough.md per phase; manual verification is the explicit gate. Adding Vitest/Playwright is out of scope for Phase 1.
- **Alternatives considered**: Playwright (deferred — likely added in a later phase once the dashboard exists).

## Open items

None. All NEEDS CLARIFICATION resolved by the user input and the constitution.
