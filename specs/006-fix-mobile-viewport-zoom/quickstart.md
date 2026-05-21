# Quickstart: Verifying the Mobile Viewport Fix

**Feature**: 006-fix-mobile-viewport-zoom
**Audience**: Developer or reviewer validating the fix locally before merge.

## Prerequisites

- `.env.local` populated with Supabase keys (see `CLAUDE.md → Environment`).
- A signed-up test user (or use `/signup` to create one).
- Claude-in-Chrome MCP available (or a real iPhone / Android device for hands-on verification).

## Run the dev server

```bash
npm run dev
```

Server listens on `http://localhost:3000` (falls back to 3001/3002 if occupied).

## Verification matrix

For each viewport × route combination below, confirm: **zero horizontal scroll, no element clipped at the right edge, natural-scale rendering (no pinch-zoom needed)**.

| Viewport | Routes to verify |
|---|---|
| 360 × 800 | `/signin`, `/signup`, `/home` (after sign-in), `/profile`, `/terms`, `/reset-password` |
| 390 × 844 | same as above |
| 1280 × 800 | same as above |
| 1440 × 900 | same as above |

## Step-by-step (Claude-in-Chrome MCP)

1. **Resize**: `resize_window` to 390 × 844.
2. **Navigate**: `navigate` to `http://localhost:3000/signin`.
3. **Sign in** with the test user. The app redirects to `/home`.
4. **Screenshot the home dashboard**. Confirm:
   - Top nav shows the M logo (left), then two icon-only tabs and the sign-out icon (right) — NO text labels visible on phone viewports.
   - No element clipped on the right edge.
   - "Welcome back, …" heading renders at natural scale (not zoomed).
   - Profile Progress card has comfortable horizontal padding.
5. **Navigate to `/profile`**. Screenshot. Same checks.
6. **Repeat** for 360 × 800 and the desktop viewports.
7. **Pinch-zoom check (manual, real device only)**: Confirm a two-finger pinch on the home dashboard still zooms the page in/out. The fix must NOT disable user scaling.

## Pass criteria (mirrors `spec.md` Success Criteria)

- **SC-001**: All authenticated pages render with zero horizontal overflow at 360 × 800 and 390 × 844.
- **SC-003**: Zero clipped elements on the right edge across the tested viewport range.
- **SC-004**: All four public pages retain pre-fix behavior at all viewports.
- **SC-005**: Desktop rendering at 1280 × 800 and 1440 × 900 is visually identical to pre-fix.
- **SC-006**: User pinch-zoom still functions.

## If verification fails

- **Still zoomed on mobile**: Check that `app/layout.tsx` actually emits `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — view source on a mobile-emulator response. A stale CDN cache may serve the old UA-sniffed response; bust the cache.
- **Horizontal overflow on `/home`**: Inspect the nav row width — likely culprit is a long element inside `DashboardNav`. Fix in `components/dashboard/DashboardNav.tsx` (icon sizes, gap, label hiding).
- **Public pages regressed**: Re-check that `initial-scale=1` is the intended value for the public hero (it should be — public pages were already authored mobile-first).

## Don't

- Don't add `maximum-scale=1` or `user-scalable=no` to "lock" the viewport — this violates FR-005 and accessibility expectations.
- Don't UA-sniff in any new code; the whole point of this fix is to remove that pattern.
- Don't claim the task complete based solely on TypeScript / ESLint passing — Constitution Principle III requires browser verification.
