# Walkthrough: Fix Mobile Viewport Zoom on Authenticated Pages

**Feature**: 006-fix-mobile-viewport-zoom
**Branch**: `006-fix-mobile-viewport-zoom`
**Date**: 2026-05-21
**Status**: Code change applied; browser verification pending (see "Remaining work" below).

## Symptom

After signing in on a mobile device, the home dashboard (`/home`) and other
authenticated pages rendered at an effective initial zoom > 100%. The user had
to pinch-zoom out to read the page, and the right edge of the top navigation
was clipped (a tab pill was visibly cut off to the right of "Profile" in the
user-supplied screenshot).

## Root cause

`app/layout.tsx` exported an async `generateViewport()` that read `User-Agent`
via `next/headers` and emitted `initial-scale=0.9` for mobile UAs. An
`initial-scale` below 1 inflates the effective CSS viewport (a 390 px iPhone
reported ~433 px CSS-wide). Two downstream effects followed:

1. Every CSS pixel mapped to 0.9 device pixels, so content authored to fit a
   390 px viewport rendered ~11% larger than intended — the "zoomed-in"
   appearance.
2. Mobile-first breakpoints (Tailwind `sm:` at 640 px) and component-level
   "hide on mobile" rules (e.g., `DashboardNav`'s `hidden sm:inline` text
   labels) were evaluated against the inflated canvas, producing visually
   inconsistent behavior across devices.

The user's local working tree had already replaced `generateViewport()` with
a static viewport export — this feature formalizes that change and adds the
mandated mobile-fit verification.

## Fix

`app/layout.tsx`:

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
```

(Removed: the async `generateViewport()` function and the
`import { headers } from "next/headers"` line.)

No other source files required changes. `components/dashboard/DashboardNav.tsx`
was left untouched; it already uses `hidden sm:inline` to hide text labels on
mobile, which now behaves correctly because the CSS viewport is no longer
inflated.

## Files changed

| File | Change |
|---|---|
| `app/layout.tsx` | Replaced UA-sniffed `generateViewport()` with static `viewport` export. |
| `components/chrome/Wordmark.tsx` | (Pre-staged in working tree.) Switched to `w-[80px] sm:w-[160px]` with `aspectRatio` style for stable image sizing. |
| `learning.md` | Added "Mobile viewport: never UA-sniff `initial-scale`" entry. |

## Implementation checks

- `npx tsc --noEmit` — no errors.
- `npm run lint` — only a pre-existing warning unrelated to this change
  (`@next/next/google-font-display` on the Material Symbols link in
  `app/layout.tsx`). No new warnings introduced.

## Remaining work (browser verification)

Per Constitution Principle III, the fix is not complete until verified in a
real browser at the four target viewports. Tasks T006–T021 in
`tasks.md` cover this verification. The verification recipe lives in
`quickstart.md`. Summary checklist:

- [ ] 390 × 844: `/home`, `/profile` — natural scale, no overflow, no clipped nav.
- [ ] 360 × 800: `/home`, `/profile` — same checks.
- [ ] 390 × 844: `/signin`, `/signup`, `/terms`, `/reset-password` — parity with pre-fix.
- [ ] 360 × 800: four public pages — parity.
- [ ] 1280 × 800 and 1440 × 900: all six routes — visually identical to pre-fix.
- [ ] Real-device pinch-zoom check — still functional (FR-005).
- [ ] View-source check: `<meta name="viewport">` emits exactly `width=device-width, initial-scale=1, viewport-fit=cover`.

## How to verify

Follow `specs/006-fix-mobile-viewport-zoom/quickstart.md`. The recommended
path is `npm run dev` then drive Claude-in-Chrome MCP (`resize_window` →
`navigate` → screenshot) through each viewport / route combination.

## Lessons captured

See the new entry in `learning.md` under "Mobile viewport: never UA-sniff
`initial-scale`".
