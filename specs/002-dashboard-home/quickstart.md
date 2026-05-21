# Quickstart: Dashboard Home

## Prerequisites

- `.env.local` populated with `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- At least one user created via `/signup` (so a signed-in session is available).

## Run

```powershell
npm run dev
```

Open `http://localhost:3000` (or whatever port Next.js chooses if 3000 is busy).

## Verify (manual walkthrough)

### Golden path — signed-in user, 0% complete

1. `/signin` → sign in with the test user.
2. After successful sign-in you are routed to `/home`.
3. The greeting reads `Welcome back, {First} {Last} 👋`.
4. The Profile Progress card shows `0%`, the bar is empty, and the **Complete
   Profile** button is visible with the neon-blue gradient.
5. Below the card, the tagline reads **News built for you. Not for the feed.**
6. The top nav shows: Meska Brain wordmark (left) · Home (active, neon-blue) ·
   Profile (inactive, `/profile`) · Sign Out (right).
7. There is NO dark left sidebar and NO "Active ●" indicator.

### Click-through

- Click the wordmark → stays on `/home` (not `/`).
- Click the Profile tab → routes to `/profile` (404 expected in Phase 2; Phase 3
  ships it).
- Click **Complete Profile** → routes to `/profile`.
- Click **Sign Out** → session ends, you are routed to `/signin`. Browser Back
  must NOT re-enter `/home`.

### Edge cases to verify

1. Open `/home` directly while signed out → redirects to `/signin`.
2. Sign in with a user whose `last_name` is empty in `user_metadata` → greeting
   collapses whitespace, e.g. `Welcome back, Sarah 👋` (no double-space).
3. Manually flip the stub to `percent: 100` in `lib/profile/completion.ts` →
   the button disappears and `Profile complete ✓` appears in its place.

### Mobile-fit gate (Principle III v1.2.0)

Verify on a real browser at BOTH breakpoints before claiming done:

1. **Mobile** (Claude in Chrome `resize_window` to **390 × 844** AND **360 × 800**):
   - No horizontal scrollbar.
   - Greeting renders on the same number of lines as desktop.
   - Top nav fits without overflow (wordmark may compress, Sign Out may collapse
     to icon-only with `aria-label="Sign out"`).
   - Profile Progress card fits within the viewport with padding intact.
   - Tagline renders below the card with comfortable line spacing.
2. **Desktop** (≥ 1280 × 800):
   - Greeting + card centered with `max-w-3xl`.
   - Top nav spans full width; all four elements visible with comfortable spacing.

Take screenshots at both breakpoints and attach to the walkthrough.md after
`/speckit-implement` finishes.

## Definition of Done for this phase

- All 24 functional requirements from `spec.md` (FR-001 → FR-024) satisfied.
- All 7 success criteria (SC-001 → SC-007) verified by walkthrough.
- Mobile-fit gate passed at 390 × 844 AND 360 × 800.
- `walkthrough.md` written and reviewed.
- `npm run lint` clean, `npx tsc --noEmit` clean.
