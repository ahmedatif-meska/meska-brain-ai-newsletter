# Plan: Landing Redesign

**Branch**: `004-landing-redesign` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-landing-redesign/spec.md`

## Summary

Rework the public sign-up surface to match `Login.png` exactly. Three concrete deltas vs. the shipped 001 implementation: (1) remove the `/` "Get started" marketing page — `/` now redirects to `/signup`; (2) restructure `/signup` from a two-column hero/card split into a single centred column (pill → hero → card → terms footer) with the card carrying only Email + Password, a single "SIGN UP" label at the top (no SIGN UP/SIGN IN tab strip), an in-card "Already have an account? Sign in" link, and small informational T&C copy below the button; (3) drop social-auth entirely for MVP (no Google button, no LinkedIn). The animated starry-sky parallax stays — and is explicitly preserved behind the (translucent) card so dots are visible and move while hovering. Identity stays on Supabase Cloud; password complexity, submit-only validation, and no-auto-login behaviour from the 001 spec carry forward unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+ (unchanged from 001).

**Primary Dependencies**: Next.js 16.2 App Router with React 19 RSC-first; Tailwind CSS v4 with token block in `app/globals.css`; `@supabase/supabase-js` + `@supabase/ssr` (already installed); `babel-plugin-react-compiler`. No new dependencies.

**Storage**: Supabase Cloud Postgres + Supabase Auth (`auth.users`). No application table changes from this spec.

**Testing**: TypeScript (`tsc --noEmit`) + ESLint as compile gates. Manual click-through per `quickstart.md` is the verification gate (Constitution III + VIII).

**Target Platform**: Web. Mobile widths from 360 px; desktop from 1280 px.

**Project Type**: Web app — single Next.js App Router project.

**Performance Goals**: Strength meter ≤200 ms per keystroke (SC-006). Parallax shift ≥3 px on near layer within 1 frame for a 200 px pointer path (SC-008).

**Constraints**: Submit-only validation (Constitution VI). Token-defined colours only (Constitution II). RSC-first; client islands stay limited (Constitution IV). Service-role key server-only (Constitution V). Hero/badge keep their line count at 360/768/1280/1920 px (Constitution III, SC-003). Reduced-motion fully pauses twinkle + parallax (FR-025, SC-009).

**Scale/Scope**: One public route (`/signup`), one redirect (`/`), one placeholder route (`/signin`). ~4 file rewrites + 2 deletions + 1 new file. No new dependencies.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Spec-Driven Development | PASS | `spec.md` exists; plan supersedes layout choices in 001 explicitly. |
| II. Design Fidelity to Plan | PASS | Tokens unchanged. The screenshot's LinkedIn button is NOT reintroduced; social-auth removed per the in-session clarification. T&C is informational text only — no checkbox. |
| III. Responsive Parity | PASS | Single-column layout makes line-count parity easier; `clamp()` headline and `whitespace-nowrap` pill carry over. Manual check at 360/1280 still mandatory. |
| IV. RSC Performance | PASS | Client islands shrink: `GoogleButton` removed, `SignupForm` simplified (fewer state fields), `PasswordField` + `PasswordStrengthMeter` + `StarField` kept. Net 4 client components on `/signup`. |
| V. Privacy/Auth | PASS | Same Supabase Cloud setup, service-role key untouched in `lib/supabase/admin.ts`. OAuth callback route is removed because Google is dropped — fewer surfaces, no regression. |
| VI. Validation Discipline | PASS | Email + password validated on submit only; strength meter is the sole live element. |
| VII. Channel-Aware Delivery | N/A | Not applicable to sign-up. |
| VIII. Artifact Structure | PASS | plan.md follows Phase → User Story → Acceptance Criteria → Test Scenarios layout. |

No violations. Complexity Tracking omitted.

## Project Structure

### Documentation (this feature)

```text
specs/004-landing-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (delta vs 001)
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── signup.md        # Server Action contract (delta vs 001)
├── checklists/
│   └── requirements.md  # Already exists (from /speckit-specify)
└── tasks.md             # Produced later by /speckit-tasks
```

### Source Code (deltas vs current tree)

```text
app/
├── page.tsx                              # REWRITE → redirect('/signup')
├── signup/
│   └── page.tsx                          # REWRITE → single-column layout per Login.png
├── signin/
│   └── page.tsx                          # KEEP (already a placeholder; banner copy stays)
├── auth/
│   └── callback/route.ts                 # DELETE (Google OAuth removed from MVP)
└── (auth)/_actions/signup.ts             # KEEP behaviour; TRIM input to email + password only

components/
├── auth/
│   ├── AuthCard.tsx                      # REWRITE → single "SIGN UP" label, no tab strip; translucent surface tuned so stars show through
│   ├── SignupForm.tsx                    # REWRITE → only Email + Password fields, in-card "Sign in" link, T&C footer copy
│   ├── PasswordField.tsx                 # KEEP
│   ├── PasswordStrengthMeter.tsx         # KEEP
│   └── GoogleButton.tsx                  # DELETE
├── background/StarField.tsx              # KEEP; verify card sits in front of canvas via z-stacking
├── chrome/Wordmark.tsx                   # KEEP; default link target stays `/` (since `/` itself redirects to `/signup`, the visible behaviour matches FR-004)
└── ui/Pill.tsx                           # KEEP; copy adjusted at use-site to "AI-Hyperpersonalized Newsletter"

lib/
├── supabase/{client,server,admin}.ts     # KEEP
└── validation/signup.ts                  # TRIM → remove validateName; keep validateEmail, validatePassword, scorePassword, validateSignupInput (now { email, password })
```

**Structure Decision**: No directory layout change. This is a layout + scope reduction. The OAuth callback route, Google button, and First/Last Name validators are removed. Two files (`app/page.tsx`, `app/signup/page.tsx`) and two components (`AuthCard`, `SignupForm`) are substantially rewritten.

## Phase 1 — Landing Redesign

### User Story 1.1: Email/password sign-up matching the reference

> As a new visitor, I want to create a Meska Brain account with my email and a strong password on the screen shown in `Login.png`, so that I can sign in.

- Visitor lands on `/signup` (directly, or by hitting `/` which routes here), sees the pill + hero + card layout exactly as the reference, submits Email + Password, lands on `/signin` with the post-signup banner. No auto-login, no verification email, no name collected at this step.

### User Story 1.2: Cross-navigation moves to inside-card link

> As a visitor who already has an account, I want to click an in-card "Sign in" link to reach `/signin`, since the SIGN IN tab from the previous design has been removed.

- The "Already have an account? Sign in" link is the only path from `/signup` to `/signin`. The wordmark targets `/signup` (since `/` is no longer a separate page).

### User Story 1.3: Marketing root removed

> As a visitor arriving at the bare domain, I want to land directly on `/signup`, with no "Get started" interstitial.

- A GET on `/` returns a server-side redirect to `/signup`. No "Get started" content remains anywhere.

### User Story 1.4: Stars visible and reactive behind the card

> As a visitor, I want the dark-sky stars to remain visible behind the (translucent) sign-up card and to drift in 2D as I move my pointer, including over the card, so the brand's animated background reads through.

- The full-page `<canvas>` sits below the card in z-order; the card surface is translucent (`rgba` background + backdrop blur tuned so stars are perceptible). `pointermove` is listened to on `window`, so motion over the card still drives parallax. `prefers-reduced-motion: reduce` freezes both twinkle and parallax.

### Acceptance Criteria (for the phase)

- `/` returns a server-side redirect to `/signup`. No "Get started" content is reachable.
- `/signup` renders, top-to-bottom, single centred column: wordmark (top-left) → pill badge "AI-HYPERPERSONALIZED NEWSLETTER" → hero "Eliminate the noise. Get hyper-personalized\nAI insights on your preferred channel." with "AI insights" in the neon-blue gradient → auth card → T&C footer copy "By signing up, you agree to our Terms and Conditions."
- The auth card has a single "SIGN UP" header label at the top (no tab strip), the title "Create account", the subtitle "Join the next generation of AI intelligence", Email and Password fields (in that order), the eye toggle on Password, the live password strength meter under Password, a full-width "Sign up" button with the neon-blue gradient, and an in-card "Already have an account? Sign in" link below the button.
- No Google button, no LinkedIn button, no T&C checkbox. The T&C copy is plain text; the phrase "Terms and Conditions" may be a link to a placeholder route or `#`. Submission does NOT depend on any user action on this text.
- All field validation (required, email format, password complexity, duplicate-email) runs only on submit. The strength meter is the only live UI element.
- Password complexity: ≥8 chars, ≥1 uppercase, ≥1 number, ≥1 symbol. Failures surface field-level inline errors naming the missing class.
- Duplicate email inline message is verbatim: "An account with this email already exists. Sign in instead."
- On valid submit, a Supabase Cloud user is created with `email_confirm: true`, `user_metadata.auth_method = 'password'`, and `first_name` / `last_name` left empty. The visitor is routed to `/signin?signedup=1`.
- The `app/auth/callback/route.ts` file no longer exists.
- The `components/auth/GoogleButton.tsx` file no longer exists.
- `lib/validation/signup.ts` no longer exports `validateName`; `SignupInput` is `{ email, password }`.
- The full-page `<canvas>` is `fixed inset-0 -z-10`; the card sits above it with a translucent surface.
- `pointermove` parallax fires over the card area as well as the page background.
- `prefers-reduced-motion: reduce` freezes twinkle + parallax; layout is unchanged.
- Hero and badge keep the same line count at 360/768/1280/1920 px.
- All colours flow from tokens defined in `app/globals.css`; no per-component hex literals are introduced.

### Test Scenarios (for the phase)

1. **Root redirect** — Given a visitor opens `/`, When the response completes, Then the URL is `/signup` and no "Get started" copy appears anywhere in the response.
2. **Layout matches reference** — Given `/signup` is rendered at 1280 px, When the page is inspected, Then the visible order top-to-bottom is: wordmark, pill, hero (2 lines, "AI insights" in blue), card, T&C copy — single column, centred.
3. **No social auth** — Given `/signup` is rendered, When the auth card body is inspected, Then there is no element with role "button" labelled Google or LinkedIn, and `/auth/callback` returns 404.
4. **Only email + password fields** — Given `/signup` is rendered, When form inputs are enumerated, Then exactly two text-like inputs exist: `name=email` and `name=password`.
5. **Eye toggle preserves value** — Given the Password field contains `Aa1!aaaa` masked, When the eye icon is clicked, Then the field shows `Aa1!aaaa` in plain text; clicking again re-masks without clearing.
6. **Live strength meter, no other live validation** — Given a visitor types `Aa1!aaaa` into Password, When 200 ms has elapsed, Then the meter reads "strong" and no Email-field error is rendered.
7. **Submit empty form** — Given all fields are empty, When Sign up is clicked, Then inline errors appear under both Email and Password simultaneously with error-coloured borders.
8. **Invalid email format** — Given Email is `not-an-email`, When Sign up is clicked, Then the Email field renders "Enter a valid email address." and no Supabase user is created.
9. **Weak password missing a class** — Given password `password1!` (no uppercase), When Sign up is clicked, Then the Password field renders "Password must contain at least one uppercase letter."
10. **Email/password happy path** — Given an incognito visitor submits `jane@example.com` / `Aa1!aaaa`, When the request returns, Then the browser is at `/signin?signedup=1` and a Supabase user exists with that email, `user_metadata.first_name === ""`, `user_metadata.last_name === ""`, `user_metadata.auth_method === "password"`, `email_confirmed_at` set.
11. **Duplicate email** — Given a Supabase user already exists with `jane@example.com`, When the visitor submits `JANE@example.com` / `Aa1!aaaa`, Then the Email field renders "An account with this email already exists. Sign in instead." and no second user is created.
12. **Double-click submit** — Given the Sign up button is double-clicked rapidly, When both clicks fire, Then only one create-user call is issued (button disabled while pending) and only one user exists.
13. **In-card sign-in link** — Given a visitor on `/signup`, When the "Sign in" link inside the card is clicked, Then the URL is `/signin`.
14. **Wordmark navigation** — Given a visitor on `/signup`, When the wordmark is clicked, Then the URL settles on `/signup` (the wordmark targets `/`, which 307-redirects).
15. **T&C copy is non-blocking** — Given the visitor never interacts with the T&C copy, When they submit a valid form, Then sign-up succeeds.
16. **Stars visible behind card** — Given `/signup` is rendered with reduce-motion OFF, When the auth card is inspected, Then star pixels are perceptible within the card's bounding box (the surface is translucent).
17. **Parallax over card** — Given the pointer moves from outside the card to inside the card while still inside the viewport, When the pointer reaches the centre of the card, Then individual stars near the near layer have shifted by ≥3 px since the last frame outside the card.
18. **Reduced motion** — Given a visitor with `prefers-reduced-motion: reduce`, When the pointer moves 200 px across the page, Then no star position changes between frames.
19. **Responsive line count** — Given `/signup` is rendered at 360, 768, 1280, 1920 px widths, When the hero headline and pill text are inspected, Then the line count is identical across all four widths.
20. **No service-role key in client** — Given a production build, When the static chunks under `.next/static/` are grepped, Then `SUPABASE_SERVICE_ROLE_KEY` (and its real value) appear in zero chunks.
21. **OAuth callback removed** — Given the codebase, When `app/auth/callback/route.ts` is checked, Then it does not exist.

## Complexity Tracking

No constitution violations; section intentionally empty.
