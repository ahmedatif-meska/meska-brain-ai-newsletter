# Research: Landing Redesign

## Decisions

### 1. How to remove the `/` "Get started" page

- **Decision**: Replace `app/page.tsx` with a Server Component that calls `redirect('/signup')` from `next/navigation`. No marketing copy lives at `/` for MVP.
- **Rationale**: A server-side redirect from an RSC has no flash and returns a 307 to the browser before any "Get started" markup is shipped. Keeps `/signup` as the single source of truth for the public entry surface, satisfying FR-001 / FR-002 / SC-007.
- **Alternatives considered**: Rewrite at the `next.config.ts` `redirects` level (rejected — adds config surface for a trivial case, less discoverable); render the signup page directly at `/` and 404 the old `/signup` (rejected — breaks every existing link and bookmark to `/signup` and contradicts FR-003).

### 2. Single-column page structure

- **Decision**: Hero block stacks above the card in one column, both centred horizontally with `max-w-md` on the card and `max-w-2xl` on the hero. No `lg:grid-cols-2` split.
- **Rationale**: Matches `Login.png` exactly. Also simplifies responsive parity — the line count is naturally identical between mobile and desktop because the layout itself doesn't reflow into a different shape.
- **Alternatives considered**: Keep the two-column desktop layout and reserve single-column for narrow viewports (rejected — contradicts the user's "exact screen" directive).

### 3. Drop the SIGN UP / SIGN IN tab strip

- **Decision**: Replace the tab strip in `AuthCard` with a single uppercase label "SIGN UP" sitting inside the card header. Cross-navigation to `/signin` moves to a small "Already have an account? Sign in" link inside the card, below the submit button.
- **Rationale**: Matches the reference image. The single-tab visual is also unambiguous about which form is in use.
- **Alternatives considered**: Keep the strip but make SIGN UP active with no SIGN IN tab (rejected — leaves a visually unbalanced strip).

### 4. No social-auth button for MVP

- **Decision**: Remove `components/auth/GoogleButton.tsx`, `app/auth/callback/route.ts`, and the Google option from `SignupForm`. The card now opens directly with the Email field. The "or" divider is removed.
- **Rationale**: Explicit in-session clarification. Constitution-banned LinkedIn was already out. Without any social provider the divider has no meaning.
- **Alternatives considered**: Keep the OAuth callback route inert as a stub (rejected — dead code on a public route is a maintenance footgun; removing the file is cleaner).

### 5. Email + Password only — no First/Last Name

- **Decision**: `SignupForm` collects only Email and Password. The Server Action's `SignupInput` becomes `{ email: string; password: string }`. `validateName` is removed from `lib/validation/signup.ts`. The created Supabase user has empty `first_name` and `last_name` in `user_metadata` and `auth_method: 'password'`.
- **Rationale**: User clarification. Names will be collected in Phase 3 Form 1 with empty defaults. Phase 2 dashboard greeting will need a "Welcome back" fallback when names are empty — flagged in spec under "Relationship to existing specs" so the 002 plan picks it up.
- **Alternatives considered**: Collect names but hide them behind an expander (rejected by clarification — "match the screen exactly").

### 6. T&C copy as non-blocking footer text

- **Decision**: Render the line "By signing up, you agree to our Terms and Conditions." as small grey text below the card body. "Terms and Conditions" is a `<Link>` to `/terms` (a route that does not exist yet — link is allowed to be a dead anchor for MVP). It is plain copy, not a checkbox, and submission is unaffected by it.
- **Rationale**: Constitution II forbids a T&C checkbox. The reference image shows footer copy, which is informational. Treating the copy as decorative (not a gating control) keeps both the reference fidelity and the constitution intact.
- **Alternatives considered**: Omit the line entirely (rejected — reference fidelity); render an inline checkbox (rejected — constitution).

### 7. Translucent card surface so stars show through

- **Decision**: The card's surface uses an `rgba(10, 18, 48, 0.55)` background colour over a `backdrop-blur-md` filter. The page-wide `<canvas>` sits at `fixed inset-0 -z-10`; the card sits at the default stacking context (z above the canvas). The card's mesh-glow remains as a `radial-gradient` behind the card.
- **Rationale**: Satisfies FR-008 ("stars MUST remain visible behind the card surface") and Test Scenario 16. Backdrop blur softens the stars under the card just enough to keep form-field contrast accessible, while the alpha keeps them perceptible.
- **Alternatives considered**: Place a clipped `<canvas>` inside the card and render a second star layer there (rejected — duplicates work and complicates reduced-motion); use full-opacity card with star "decorations" outside its bounds (rejected — contradicts the reference image, which clearly shows dots through the card).

### 8. Parallax responds to pointer over the card

- **Decision**: `StarField` continues to attach `pointermove` to `window`, not to the page background element. Because the card does not call `stopPropagation`, pointer events that pass through the card still reach `window` and the parallax updates uniformly. No additional pointer listener on the card is needed.
- **Rationale**: Simplest correct implementation. Matches FR-024 and Test Scenario 17.
- **Alternatives considered**: Attach an additional `pointermove` listener inside the card and merge the deltas (rejected — duplicate work, no benefit since `window`-level listener already sees the event).

### 9. Wordmark target

- **Decision**: The wordmark continues to `<Link href="/">`. Since `/` now redirects to `/signup`, clicking the wordmark from `/signup` lands the visitor back on `/signup`. This is acceptable per FR-004 (wordmark routes to `/signup` in MVP).
- **Rationale**: One fewer special case — the wordmark doesn't need to know whether `/` is alive. The redirect at `/` does the work.
- **Alternatives considered**: Hard-link the wordmark to `/signup` (rejected — when the marketing root returns in a later phase, the wordmark naturally re-targets it; less code to change later).

### 10. Pill copy hyphenation

- **Decision**: Render the pill as "AI-HYPERPERSONALIZED NEWSLETTER" (hyphen, all caps, letter-spaced). The previous implementation rendered it without the hyphen. The hyphen matches `Login.png`.
- **Rationale**: Reference fidelity.
- **Alternatives considered**: Keep the un-hyphenated form (rejected — visible mismatch with the reference).

## Open items

None. All clarifications resolved in the spec's `## Clarifications` section.
