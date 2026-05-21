# Research: Dashboard Home

Decisions resolving the "NEEDS CLARIFICATION" items from Technical Context and the
ambiguities surfaced by reading the spec against the current codebase.

---

## R1. How is `firstName` / `lastName` read on `/home`?

**Decision**: Read from `supabase.auth.getUser()`'s `user.user_metadata.first_name`
and `user_metadata.last_name`. Render as `${first} ${last}` collapsing intermediate
whitespace.

**Rationale**: Phase 1 already writes both keys on signup
(`app/(auth)/_actions/signup.ts`), in addition to `display_name`, `full_name`, and
`name` (for dashboard/JWT compatibility). No new table is required.

**Alternatives considered**:

- **Read `display_name`** — easier (one field) but loses the ability to render just
  the first name when the last name is missing (Edge Case in spec — "Google profile
  lacks one"). Rejected.
- **New `profiles` table** — would duplicate identity data Supabase Auth already
  owns. Rejected on YAGNI grounds; Phase 3 introduces its own profile tables for
  the wizard answers, not for the user's name.

---

## R2. Source of Profile Completion percentage

**Decision**: A pure server-only function `getProfileCompletion(userId)` in
`lib/profile/completion.ts` returns
`{ percent: 0 | 33 | 66 | 100, formsCompleted: { identity, bioLink, finalize } }`.
For Phase 2 it returns `{ percent: 0, formsCompleted: { identity: false, bioLink:
false, finalize: false } }` for every user — Phase 3 will swap the implementation
to read from the profile tables it owns.

**Rationale**: `/home` only needs to *read* completion; it doesn't write it. By
defining the contract now with a stub implementation, Phase 2 can be shipped and
verified end-to-end without coupling to Phase 3 schema decisions. When Phase 3
lands, the only file that changes is `lib/profile/completion.ts`; the UI is
unchanged.

**Alternatives considered**:

- **Pull completion from `user_metadata.profile_completion`** — would require Phase
  3 to write metadata in a Supabase-specific shape. Rejected: couples Phase 2 UI
  to a key that may not exist after Phase 3 schema review.
- **Compute on the client from a fetch** — violates Principle IV (RSC-first) for
  no benefit. Rejected.

**Edge case**: percentages other than {0, 33, 66, 100} should never appear; the
function returns one of those four values to keep the UI deterministic.

---

## R3. Server-side session enforcement for `/home`

**Decision**: At the top of `app/home/page.tsx`, call
`const supabase = await createSupabaseServerClient(); const { data: { user } } = await
supabase.auth.getUser();`. If `user === null`, `redirect("/signin")` from
`next/navigation`. This runs on every request because `/home` is dynamic.

**Rationale**: Principle V requires server-side session validation on every protected
route. `getUser()` (not `getSession()`) verifies the JWT against Supabase to defeat
stolen-cookie replay. The SSR client we already have wires cookies via
`next/headers`.

**Alternatives considered**:

- **Next.js middleware** — would centralize the check across all dashboard routes.
  Reasonable, but premature: with only one dashboard route in scope, the per-route
  check is simpler and keeps the surface area visible. Migrate to middleware in
  Phase 3 when `/profile` lands.
- **`getSession()`** — faster but trusts the cookie without verifying. Rejected
  per Supabase guidance and Principle V.

---

## R4. Sign Out — Server Action vs. client SDK call

**Decision**: A Server Action at `app/_actions/signout.ts` that calls
`supabase.auth.signOut()` on the SSR client, then `redirect("/signin")`. The button
in the nav is a tiny client island that submits a form to this action.

**Rationale**: Calling `signOut()` server-side cleans the auth cookie correctly
(`@supabase/ssr` writes the response cookie). The client component is the smallest
possible — just a `<form action={signOut}><button>Sign Out</button></form>`.

**Alternatives considered**:

- **`supabase.auth.signOut()` on the browser client** — would leave the server-set
  cookie intact until the next response. Rejected: causes intermittent "still
  signed in" flashes.

---

## R5. Top nav — shared layout vs. inline

**Decision**: Implement `DashboardNav` as a Server Component imported directly by
`app/home/page.tsx`. Do NOT create `app/(dashboard)/layout.tsx` yet.

**Rationale**: The spec is explicit: `/home` is the only dashboard surface in this
phase. Creating a route-group layout now would add abstraction for a single user.
When `/profile` ships in Phase 3, refactor the nav into a shared layout — the
constitution favors avoiding premature abstractions (CLAUDE.md guidance: "Three
similar lines is better than a premature abstraction").

**Alternatives considered**:

- **`app/(dashboard)/layout.tsx` now** — rejected per above.

---

## R6. Mobile collapse pattern for the top nav

**Decision**: Out of scope per spec. The bar uses a single horizontal row with
`gap-*` spacing tuned so all four elements (wordmark, Home tab, Profile tab, Sign
Out) fit at 360px width — wordmark shortens to the icon-only form, tabs become
icon+label compressed (Material Symbols `home` / `person`), Sign Out becomes
icon-only with `aria-label`. No hamburger; no drawer. Document this in the
walkthrough.

**Rationale**: Spec explicitly defers the collapse pattern; constitution Principle
III still requires zero overflow at 360px. The compressed-but-visible approach
satisfies the gate without committing to a hamburger before the design exists.

---

## R7. Design tokens reuse

**Decision**: Reuse existing tokens in `app/globals.css`:

- `--primary-deep: #0a72f3` and `--secondary-cyan: #00c9fc` → progress bar fill +
  percentage text + Complete Profile button background (via
  `--neon-blue-gradient`).
- `--primary: #aec6ff` → optional hover/accent.
- New token introduced ONLY if needed for the dashboard light theme: a single
  `--dashboard-surface` (probably `#ffffff` or near-white). Avoid per-component
  hex values.

**Rationale**: Principle II — tokens by name, never re-define per component.

---

## R8. Greeting fallback when name is missing

**Decision**: If both `first_name` and `last_name` are empty, render `Welcome back
👋`. If only one is present, render `Welcome back, {whichever} 👋`. Spaces between
name tokens are collapsed with `.trim().split(/\s+/).join(" ")`.

**Rationale**: Spec Assumption #3 + Edge Case #5 — render gracefully without
awkward gaps.

---

## R9. Performance / SC-001 budget

**Decision**: Render `/home` as a Server Component that performs both Supabase
calls (`getUser`, `getProfileCompletion`) in parallel via `Promise.all`. No client
fetches; no `useEffect`; no streaming Suspense in Phase 2 (the payload is small).

**Rationale**: One server round-trip + one HTML response → well under the 2s
budget on broadband. Streaming/Suspense would help if the data fan-out grew (not
the case here).

---

*All NEEDS CLARIFICATION resolved.*
