# Walkthrough: Dashboard Home (`/home`)

Phase 2 ships a signed-in landing page at `/home` with a personalized greeting, a
Profile Progress card, a tagline, and the dashboard top nav (wordmark + Home tab
+ Profile tab + Sign Out). White surface with neon-blue accents — no dark-theme
leakage.

## How to run

```powershell
# from D:\meska-brain-ai-newsletter
npm run dev
```

Open `http://localhost:3000` (Next.js may fall back to 3001/3002 if the port is
busy — read the URL printed by `next dev`).

Required env vars in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

You must have at least one user account (created via `/signup` from Phase 1).

## Implemented features

Mapped to the functional requirements in `spec.md`:

| FR | Where to observe it |
|---|---|
| FR-001 (`/home` exists, signed-in only) | `app/home/page.tsx` |
| FR-002 (sign-in → `/home`) | `app/(auth)/_actions/signin.ts` returns `redirect: "/home"` (Phase 1 wiring) |
| FR-003 (unauth → `/signin`) | `getUser()` null-check + `redirect("/signin")` at top of `app/home/page.tsx` |
| FR-004, FR-005 (greeting from stored name) | `formatGreeting()` + `<h1>` in `app/home/page.tsx`; name read from `user.user_metadata.first_name` / `last_name` |
| FR-006 (greeting reflects updated name on next render) | Page is `force-dynamic`; no caching |
| FR-007 (card centered below greeting) | `<ProfileProgressCard />` inside `max-w-md mx-auto` |
| FR-008 (card composition) | `components/dashboard/ProfileProgressCard.tsx` — icon, title, subtitle, label, percent, bar |
| FR-009 (derivation) | `lib/profile/completion.ts` — returns `0 / 33 / 66 / 100` based on form flags (Phase 2 stub: always 0) |
| FR-010 (Complete Profile CTA when < 100%) | `ProfileProgressCard.tsx` conditional; links to `/profile` |
| FR-011 (`Profile complete ✓` when = 100%) | same component, opposite branch |
| FR-012 (no per-form checklist) | not rendered anywhere |
| FR-013 (tagline below card) | `<p>News built for you. Not for the feed.</p>` in `app/home/page.tsx` |
| FR-014 → FR-019 (top nav) | `components/dashboard/DashboardNav.tsx` + `SignOutButton.tsx` |
| FR-020 (no sidebar) | none rendered |
| FR-021 (no "Active ●" indicator) | none rendered |
| FR-022 (white bg + neon-blue accents) | `--dashboard-surface` token + `var(--neon-blue-gradient)` |
| FR-023 (shared gradient) | reuses the Phase 1 `--neon-blue-gradient` token by name |
| FR-024 (responsive parity) | `clamp()` greeting, mobile-first padding, nav compresses Sign Out to icon-only |

## Manual verification steps

### Golden path (desktop ≥ 1280 × 800)

1. `/signin` → sign in with a valid account.
2. After sign-in you land on `/home`.
3. Greeting reads `Welcome back, {First} {Last} 👋`.
4. Profile Progress card is centered below the greeting, showing **0%**, an
   empty progress bar, and the **Complete Profile** button with the neon-blue
   gradient.
5. The tagline **News built for you. Not for the feed.** appears below the card.
6. Top nav: Meska Brain wordmark (left, linking to `/home`), Home tab (active,
   neon-blue), Profile tab (inactive), Sign Out (right).
7. No left sidebar, no "Active ●" dot, no dark theme anywhere.

### Click-through

- Click the wordmark → stays on `/home`.
- Click Profile tab → routes to `/profile` (404 in Phase 2, Phase 3 ships it).
- Click **Complete Profile** → routes to `/profile`.
- Click **Sign Out** → session ends, route to `/signin`. Browser Back MUST NOT
  re-enter `/home`.

### Edge cases

1. Open `/home` directly while signed out → redirected to `/signin`. ✓ verified
   in Phase 6 (screenshot at `390 × 844`).
2. Sign in with a user whose `last_name` is empty → greeting renders as
   `Welcome back, {first} 👋` with no double-space (whitespace is collapsed by
   `formatGreeting`).
3. Both names empty → renders `Welcome back 👋`.
4. Temporarily edit `lib/profile/completion.ts` to return `percent: 100` →
   reload `/home` → button disappears, `Profile complete ✓` appears.

### Mobile-fit gate (Principle III v1.2.0)

Verified at 390 × 844 (unauthenticated redirect to `/signin`). For the
authenticated render, walk both `390 × 844` and `360 × 800`:

- No horizontal scrollbar.
- Top nav fits without overflow (Sign Out collapses to icon-only with
  `aria-label="Sign out"` at the smallest width).
- Greeting line count matches desktop.
- Profile Progress card stays within the viewport with padding intact.
- Tagline reads cleanly below the card.

Then walk ≥ 1280 × 800:

- Card centered with `max-w-md`, greeting centered with `max-w-3xl`.
- All four nav elements visible with comfortable spacing.

## Known gaps / deferred items

- **`getProfileCompletion` is a Phase 2 stub** — always returns 0% regardless of
  the user. Phase 3 will swap the implementation against the profile tables it
  owns (see `contracts/profile-completion.md`). The UI exercises every percent
  branch (0 / 33 / 66 / 100) — Phase 3 only needs to flip the data source.
- **`/profile` does not exist yet** — Phase 3 ships it. The Profile tab link and
  the Complete Profile CTA both navigate to `/profile`; expect a 404 in Phase 2.
- **Mobile collapse pattern for the top nav** — out of scope per spec. Current
  approach: Sign Out collapses to icon-only on mobile, tabs use compressed
  icon+label, wordmark stays as the text fallback. Hamburger/drawer awaits a
  later design pass.
- **Authenticated mobile screenshot** — the in-session walkthrough requires the
  reviewer's credentials and was not captured during this implementation. The
  unauthenticated redirect was verified visually.
- **Dark-tone logo asset** — `Wordmark tone="light"` still falls back to text.
  Drop a dark-tone PNG at `public/meska-logo-dark.png` and wire it when
  available.
