# Learning Log

Lessons learned during implementation, organized by phase. Format per entry:
**Problem** → **Solution**.

---

## Phase 1 — Landing & Auth (signup / signin / reset-password)

Implements the dark "Cognitive Nexus" landing page with the animated starfield,
soft mesh glow, glass-card auth surface, and the email/password sign-up + sign-in
flows backed by Supabase.

### Problem 1: Animated starry background didn't render — stars were invisible

The DOM-based starfield (`<div id="starfield">` with 150 absolutely-positioned
`<span class="star">` children) was placed as `position: fixed; inset: 0; z-index: -1`
so it would sit behind the page content. After wiring it up, **no stars appeared at
all** — the viewport showed a flat dark background instead of the radial gradient
and the twinkling stars.

**Root cause:** both the `html` and `body` selectors had
`background: var(--background)`. In CSS, the body's background propagates to the
viewport canvas **only when `<html>` has no background of its own**. Because `<html>`
already had an opaque background, the body element painted its own background as a
normal box — and that opaque body box covered the `z-index: -1` fixed starfield
sitting underneath it.

**Solution:**

- Remove the `background` declaration from the `html` selector in `app/globals.css`.
- Keep `background-color: var(--background)` only on `body`.
- The body's background now propagates to the viewport canvas, freeing the
  `z-index: -1` layer for the fixed `<StarField />`.

```css
/* app/globals.css — fixed version */
body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-body), Inter, system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}
```

Rule of thumb: any time you want a `z-index: -1` fixed element to be visible,
make sure NEITHER the `html` element NOR any opaque ancestor paints over it.

### Problem 2: React hydration mismatch from `Math.random()` star coordinates

The first working version of `StarField.tsx` generated star positions during
component initialization with `useState(() => generateStars())`. Because
`generateStars()` calls `Math.random()`, the server-rendered HTML had one set of
coordinates and the client re-rendered with a different set — Next.js logged a
long hydration-mismatch warning showing diverging `left:` / `top:` / `--duration`
values for every star.

**Solution:**

- Initialize state with an empty array: `useState<StarSpec[]>([])`.
- Generate the stars inside `useEffect(() => { setStars(generateStars()); }, [])`
  so they only exist on the client. SSR ships an empty container; the stars
  populate one frame later — visually indistinguishable, hydration-safe.
- Add `// eslint-disable-next-line react-hooks/set-state-in-effect` with a comment
  explaining the SSR-determinism rationale.

```tsx
// components/background/StarField.tsx
const [stars, setStars] = useState<StarSpec[]>([]);
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR/CSR Math.random() mismatch
  setStars(generateStars());
  // …mousemove parallax registered here…
}, []);
```

General rule: **never call non-deterministic functions (`Math.random`, `Date.now`,
`crypto.randomUUID`) during render or initial state**. Push them into effects so
the server's output is purely deterministic.

### Problem 3: Mesh glow / mouse-parallax architecture

We wanted the starfield to shift subtly with the cursor (parallax) AND a soft
blue mesh glow centered behind the content. Naively layering both with full
re-renders would have re-mounted the 150 stars on every mousemove.

**Solution:**

- Animation primitives live in **pure CSS**, not React state:
  - `.star` uses `@keyframes twinkle` (opacity + scale).
  - `--duration` is a CSS variable set per-star via inline style so each star
    twinkles on its own cycle.
- The parallax effect mutates a single CSS `transform` on the parent
  `<div ref={fieldRef}>` directly via `field.style.transform = ...` inside the
  mousemove handler — **no React state**, no re-renders, no allocations per
  frame. Stars are positioned absolutely inside this transformed parent.
- Respect `prefers-reduced-motion: reduce` — skip the mousemove listener entirely
  when the OS asks for reduced motion.
- The mesh glow is a separate non-animated div:
  `800×800 rounded-full` with `background: rgba(174,198,255,0.1); filter: blur(120px)`,
  centered via `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
  Cheap, GPU-composited, no JS involvement.

```tsx
function onMove(e: MouseEvent) {
  const field = fieldRef.current;
  if (!field) return;
  const x = (window.innerWidth / 2 - e.pageX) / 50;
  const y = (window.innerHeight / 2 - e.pageY) / 50;
  field.style.transform = `translate(${x}px, ${y}px)`;
}
```

Lesson: for ambient/background animation, prefer CSS keyframes + direct DOM style
mutation over React state. React re-renders are too expensive for 60fps cursor
tracking with 150 children.

### Problem 4: Mobile layout broke after porting the Stitch HTML

Direct port of the Stitch export looked great at desktop but on a 390×844 iPhone
viewport: (a) the pill "AI HYPERPERSONALIZED NEWSLETTER" wrapped to 2 lines,
(b) the headline ballooned to 4 cramped lines, (c) the auth card's padding shoved
content off-screen, (d) a forced `min-height: 1024px` on `<main>` introduced an
unnecessary vertical gap on small screens.

**Solution:** strict mobile-fit gate — see Phase Standard below. Specifically:

- Pill: `text-[10px] sm:text-sm`, `px-3 sm:px-4`, `whitespace-nowrap` to lock it to
  one line on mobile.
- Pill icon: swapped `network_intelligence` → `hub` because the former isn't in
  the base Material Symbols Outlined subset and rendered as a fallback box on
  some devices.
- Headline: `fontSize: clamp(1.5rem, 6vw, 2.5rem)` with `line-height: 1.15` and a
  `<br className="hidden md:block">` so desktop keeps 2 lines, mobile flows to 3.
- Card: `p-6 sm:p-8`, `space-y-6 sm:space-y-8`, and matching negative-margin
  values on the tab strip (`-mx-6 -mt-6 mb-6 sm:-mx-8 sm:-mt-8 sm:mb-8`).
- `<main>`: removed the forced `min-height` so the page sizes to the viewport.

### Problem 5: TypeScript / lint friction after refactors

- `useState(() => generateStars())` → `useState<StarSpec[]>([])` triggered the
  new React 19 rule `react-hooks/set-state-in-effect`. Disabled inline with a
  rationale comment.
- Loading Material Symbols Outlined via a `<link>` in `<head>` triggered
  `@next/next/no-page-custom-font`. Disabled inline; using `next/font/google`
  for it would have required ejecting from the variable-font URL.
- Removing the `activeTab` prop on a page that no longer needed it caused a
  TS error elsewhere — clean up callers in the same commit as the prop change.

**Solution rule:** every targeted ESLint disable lives on a single line with a
comment explaining *why*. No file-level blanket disables, ever.

### Problem 6: Hard-coded "Meska Brain" wordmark vs. the brand logo

Phase started with a text-only wordmark. When the brand logo PNG arrived
(`Meska2026 LOGO white.png`), naively swapping it broke both the dashboard
(future light theme — white logo invisible on white) and the chrome tab favicon
(naming the file `meska.ico` in `app/` doesn't match Next.js's auto-detection
list).

**Solution:**

- Logo asset → `public/meska-logo.png`. `Wordmark.tsx` renders an `<Image>` for
  `tone="dark"` (the only tone used in Phase 1), with `h-7 sm:h-9 w-auto` for
  responsive sizing. `tone="light"` keeps the text fallback until a dark-tone
  variant ships.
- Favicon → renamed to `app/icon.ico`. Next.js App Router auto-detects ONLY:
  `favicon.ico` (root), `icon.{ico,png,svg,jpg}`, `apple-icon.png`. Arbitrary
  names like `meska.ico` are ignored.

### Problem 7: File structure — auth pages mixed with non-auth routes

Initial layout put `/signin` and `/signup` directly under `app/`. As soon as
`/reset-password` was added, the `app/` directory cluttered fast and there was no
shared place for auth-only logic.

**Solution:**

- Moved `signin/`, `signup/`, and `reset-password/` into the
  `app/(auth)/` route group. Parentheses keep the URL unchanged (still `/signin`,
  `/signup`, `/reset-password`) while organizing the filesystem.
- `app/(auth)/_actions/` holds the server actions (`signup.ts`, `signin.ts`) —
  the underscore prefix keeps the folder out of the route table.
- Root `/` continues to redirect to `/signup` for Phase 1 (no marketing home yet).

### Problem 8: Activating real sign-in via Supabase

The `/signin` route shipped initially as a stub with a "ships in a later phase"
message. To wire it up to real Supabase auth, we needed:

- A server action that calls `supabase.auth.signInWithPassword` AND persists the
  session via the SSR cookie helper.
- Inline error mapping that doesn't leak Supabase internals ("Invalid login
  credentials" → "Invalid email or password.").
- Submit-only validation (Principle VI) — no live keystroke errors.

**Solution:**

- `app/(auth)/_actions/signin.ts` uses `createSupabaseServerClient()` (the
  `@supabase/ssr` client wired to `next/headers` cookies) so the auth session
  cookie is set on the response — `signInWithPassword` on the browser client
  would NOT have persisted across navigation.
- Validation: reuse `validateEmail` from signup; require non-empty password.
  Don't enforce signup's symbol/uppercase rules on signin because legacy
  accounts may not satisfy them.
- `SignInForm.tsx` mirrors `SignupForm.tsx` styling so the two flows feel
  identical, with a "Welcome back" header and a "Forgot?" link next to the
  password label.

### Problem 9: LinkedIn button — added, then removed

LinkedIn was reintroduced briefly during the Stitch port despite the
constitution (Principle II) explicitly forbidding it. The user then asked for it
to be removed.

**Solution:**

- Removed the LinkedIn button, the OR divider, and the stub handler from
  `SignupForm.tsx`.
- Lesson: when a spec-level constraint conflicts with a design reference, ask
  before reintroducing the constraint-breaking element. The constitution is the
  governing document — design refs do not override NON-NEGOTIABLE principles.

---

## Phase 1 standard: how to make every page fit web AND mobile

Distilled from the issues above into a strict, blocking gate. Codified as
constitution **Principle III v1.2.0**.

### Problem (general): "Looks fine on my 1440px monitor" ≠ ships

Designs ported from desktop refs routinely break on 390 × 844 and 360 × 800:
horizontal scrollbars appear, content goes off-screen, single-line labels wrap
to two lines, headlines balloon to 4 lines, fixed-width containers blow out the
viewport.

### Solution: mobile-fit rules every page and every component MUST follow

1. **Zero horizontal overflow** at 390 × 844 (iPhone 14) AND 360 × 800 (small
   Android). `document.body.scrollWidth === window.innerWidth` — no horizontal
   scrollbar, ever.
2. **No clipped content** — nothing off-screen, behind the fixed nav, or
   truncated unintentionally.
3. **No awkward wraps**: pills, buttons, tab strips, badges, and single-line
   labels stay on one line on mobile. Tactics:
   - `whitespace-nowrap` on the element.
   - Smaller mobile sizing — `text-[10px] sm:text-sm`, `px-3 sm:px-4`.
   - Shorter copy variant when needed.
4. **Line-count parity** for multi-line text: if the hero is 2 lines on desktop
   it stays 2 lines on mobile (use `clamp()` font sizing + conditional `<br>`).
5. **Touch targets ≥ 44 × 44 px**.
6. **Mobile-first responsive defaults**: write base styles for mobile, scale UP
   with `sm:` / `md:` / `lg:`. Never the reverse.
7. **No fixed pixel widths on layout containers.** Use `max-w-*`, `w-full`,
   `clamp()`. Pixel widths are fine on small inline elements (icons, gaps), but
   never on top-level page containers.
8. **Verify in a real browser at ≤ 390px AND ≥ 1280px before claiming done.**
   TypeScript + ESLint passing is NOT enough. Use the Claude in Chrome extension
   (`resize_window` → `navigate` → screenshot) or a desktop browser's
   responsive mode.

### Concrete recipes that worked in Phase 1

- **Hero headlines:** `clamp(1.5rem, 6vw, 2.5rem)` with `line-height: 1.15` and
  `letter-spacing: -0.01em`. Insert `<br className="hidden md:block" />` to
  force a desktop break point while letting mobile flow naturally.
- **Pills / badges:** `inline-flex max-w-full items-center gap-2 whitespace-nowrap
  rounded-full border px-3 py-1 text-[10px] sm:px-4 sm:text-sm`.
- **Glass cards:** `max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8`. Tab strip uses
  matching negative margins to flush with the card edge:
  `-mx-6 -mt-6 mb-6 sm:-mx-8 sm:-mt-8 sm:mb-8`.
- **Pill inputs:** `rounded-full py-3.5 pl-12 pr-4` (or `pr-12` if there's a
  trailing icon button like the eye toggle). Icon absolutely positioned at
  `left-4` / `right-4`.
- **Page layout:** `flex min-h-screen flex-col items-center justify-center
  overflow-hidden px-4 pb-12 pt-24 sm:px-16` for hero pages. Never set a hard
  `min-height` in pixels.
- **Background image / logo:** `<Image>` with intrinsic `width`/`height` ratio
  preserved, sized via `className="h-7 w-auto sm:h-9"` — never set a fixed
  pixel width.

### Verification procedure (per PR touching UI)

1. `npm run dev` → load every changed route in a browser.
2. Use Claude in Chrome's `resize_window` to 390 × 844 and 360 × 800. Verify:
   no horizontal scrollbar, no clipped content, no awkward wraps, all targets
   tappable.
3. Resize to ≥ 1280 × 800. Verify desktop layout still matches the design ref
   (line counts, spacing, glow position).
4. Note the verification in the PR description / walkthrough.md.

If any of the above fails, the PR does not ship — period. This is the single
most common UI regression and the strictness is intentional.

---

## Mobile viewport: never UA-sniff `initial-scale`

**Problem**: The home dashboard rendered as if zoomed-in on iPhone — content
overflowed the right edge and the user had to pinch-zoom out. The root cause
was a `generateViewport()` async function in `app/layout.tsx` that read
`User-Agent` from `next/headers` and emitted `initial-scale=0.9` for mobile
UAs. `initial-scale` < 1 expands the effective CSS viewport (a 390 px device
reports ~433 px), so the mobile-first layout was being rendered against a
canvas it was never authored for, and elements like the `DashboardNav`
labels (`hidden sm:inline`, sm = 640 px) started leaking onto the screen.

**Solution**: Always export a static, UA-agnostic viewport:

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
```

Rules of thumb:
- Pages must be authored mobile-first to fit ≥ 360 px natively (Principle III).
  If you find yourself reaching for `initial-scale < 1`, you are masking
  a layout bug, not fixing one.
- Never set `maximum-scale=1` or `user-scalable=no` — that breaks pinch-zoom
  and is an a11y violation.
- Don't UA-sniff inside `generateViewport()` (or anywhere in layout) — it is
  cache-hostile, contradicts SSR predictability, and the UA token list is
  inconsistent across modern browsers.

See `specs/006-fix-mobile-viewport-zoom/` for the full investigation and
verification matrix.

---

*Next phase additions go below this divider.*
