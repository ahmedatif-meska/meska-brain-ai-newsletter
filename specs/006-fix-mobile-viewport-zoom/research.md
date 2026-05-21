# Phase 0 Research: Mobile Viewport Zoom Root Cause

**Feature**: 006-fix-mobile-viewport-zoom
**Date**: 2026-05-21

## Decision 1: The bug is the `generateViewport()` UA sniff in `app/layout.tsx`

### Decision

Remove `generateViewport()` and replace it with a single static `export const viewport: Viewport` that emits `width=device-width, initial-scale=1, viewportFit=cover` for every user agent.

### Evidence

Currently deployed `app/layout.tsx` (HEAD) contains:

```ts
export async function generateViewport(): Promise<Viewport> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
  return {
    width: "device-width",
    initialScale: isMobile ? 0.9 : 1,
    viewportFit: "cover",
  };
}
```

`initial-scale=0.9` instructs the browser to render at 90% scale, which expands the CSS viewport by ~11% relative to the device. A 390 px iPhone reports a CSS viewport of ~433 px. Combined with Tailwind's mobile-first breakpoint `sm:` at 640 px, this would in principle still keep `sm:` styles off — but the practical effect on the user is:

- Every element rendered at 1.0 in CSS appears physically larger than the design intended (because the device is rendering 90% of the CSS into 100% of the screen).
- Mobile Safari's "shrink-to-fit" anti-overflow heuristic interacts unpredictably with explicit `initial-scale` values < 1; on some devices, residual overflow forces a further automatic zoom-out, compounding the effect.
- The UA list omits modern mobile UA tokens (e.g., some Android browsers don't include "Mobile"); affected devices fall back to `initial-scale=1` but the layout was authored against the 0.9 assumption — making the inconsistency itself a bug.

The user's reported symptom — "page is not fitting 100%, seems as zoomed a little bit which require zoom OUT" — is precisely what the user sees when `initial-scale` mismatches the layout's mobile-first assumption.

### Rationale

A static `initial-scale=1` is the canonical, framework-agnostic answer for a mobile-first responsive site:

- It honors the device's natural CSS pixel mapping.
- It eliminates UA sniffing — which is brittle, cache-hostile, and harms SSR predictability.
- It aligns with Constitution Principle III, which mandates that pages be authored mobile-first to fit ≥ 360 px natively.
- It preserves pinch-zoom (FR-005), since `maximum-scale` / `user-scalable` are not touched.

### Alternatives Considered

1. **Keep `generateViewport()` but raise `initial-scale` to 1 on mobile.**
   Rejected: equivalent to removing the sniff but keeps the unnecessary code path. Static export is simpler and safer.

2. **Set `initial-scale=1` and add `maximum-scale=1` to prevent any user zoom.**
   Rejected: accessibility violation (FR-005). Users with low vision rely on pinch-zoom.

3. **Use a CSS-only fix (e.g., `width: 100vw` on every container).**
   Rejected: doesn't address the underlying meta-viewport mismatch; would mask one symptom while leaving others.

4. **Set `initialScale: 1` only for mobile UAs and leave desktop unchanged.**
   Rejected: desktop already correctly defaults to `1`; no benefit, retains the brittle sniff.

## Decision 2: Tailwind `sm:` breakpoint stays at 640 px

### Decision

Do not change the `sm:` breakpoint. Authenticated layouts continue to use `hidden sm:inline` for label text and `gap-1 sm:gap-6` for nav spacing — these are correct mobile-first patterns and only render "wrong" because the viewport meta tag is inflating the CSS viewport.

### Rationale

Modifying the breakpoint would be a global blast radius for a problem caused by a single meta directive. The cheapest, lowest-risk fix is at the meta layer.

### Alternatives Considered

- Lowering `sm:` to 480 px to absorb the inflated viewport — rejected; doesn't fix the root cause and risks cascading visual regressions on tablet.

## Decision 3: No changes to `DashboardNav` are pre-emptively required

### Decision

Treat `DashboardNav.tsx` as verify-only in Phase 2. Edit it only if post-viewport-fix manual verification at 360 px still shows overflow.

### Rationale

At 360 px CSS width with `initial-scale=1`, the nav comprises: logo (`w-[80px]` per the user's working-tree edit to `Wordmark.tsx`) + two icon-only tabs (≈ 36 px each) + sign-out icon-only button (≈ 36 px) + small gaps. Total ≈ 80 + 36 + 36 + 36 + 24 px of gaps + 32 px of horizontal padding ≈ 244 px. That leaves ~116 px of headroom on a 360 px viewport. No overflow is expected.

### Alternatives Considered

- Pre-emptively shrink the logo further or stack the nav vertically on mobile — rejected as premature optimization; verify first.

## Decision 4: Verification method

### Decision

Use Claude-in-Chrome MCP (`resize_window`, `navigate`, screenshot) at four viewports: 360 × 800, 390 × 844, 1280 × 800, 1440 × 900. Manually inspect each route post-fix. No automated visual regression test will be added (no test runner is installed and adding one is out of scope for this fix).

### Rationale

Matches the Constitution Principle III verification path already documented in `CLAUDE.md` and `learning.md`.

### Alternatives Considered

- Add Playwright + visual regression tooling — rejected as scope creep for a one-line meta fix.

## Open Questions

None. All Phase 0 unknowns are resolved.
