# UI Contract: `/home`

The route is a Server Component. This contract describes what it produces.

## Route

- **Path**: `/home`
- **Method**: GET (Next.js page)
- **Access**: signed-in users only.
- **Unauthenticated behavior**: server-side `redirect("/signin")` (302).

## Server inputs

```ts
// app/home/page.tsx
const supabase = await createSupabaseServerClient();
const [{ data: { user } }, completion] = await Promise.all([
  supabase.auth.getUser(),
  // Below: only valid if user is non-null; the if-check happens first.
  getProfileCompletion(userId),
]);
```

If `user === null` → redirect immediately.

## Rendered structure (semantic, top to bottom)

1. **`<DashboardNav>`** — sticky top bar across the viewport. Children, left → right:
   - **Wordmark** — `<Wordmark tone="light" />` (text fallback; dark logo asset
     does not exist yet) linking to `/home`.
   - **Tabs** — Home (active, neon-blue underline/accent), Profile
     (`href="/profile"`, inactive).
   - **Spacer** — `flex-1`.
   - **`<SignOutButton>`** — client island wrapping a `<form>` whose action is
     the `signOut` Server Action.
2. **`<main>`** — centered column (`max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16`).
   1. **Greeting** — `<h1>` with text `Welcome back, {first} {last} 👋`. Whitespace
      collapsed; trailing emoji always present.
   2. **`<ProfileProgressCard completion={completion}>`** — see below.
   3. **Tagline** — `<p>` with text `News built for you. Not for the feed.` Same
      copy as `/signup` headline; reused as a single string constant.

## `<ProfileProgressCard>` contract

Input: `completion: ProfileCompletion`.

Renders a rounded card on a white surface with the following children:

1. Circular person icon at the top (Material Symbols `account_circle` or `person`)
   in neon-blue.
2. Title `<h2>Profile Progress</h2>`.
3. Subtitle paragraph — short copy explaining completion unlocks personalized
   delivery.
4. Row: `COMPLETION STATUS` label on the left, `{percent}%` on the right (neon-blue
   color).
5. Horizontal progress bar — track + fill. Fill `width: {percent}%`, background
   `var(--neon-blue-gradient)`.
6. **Conditional CTA region**:
   - If `percent < 100`: render `<Link href="/profile">` styled as a full-width
     pill button with `var(--neon-blue-gradient)`, person-with-plus icon,
     label "Complete Profile".
   - If `percent === 100`: render text "Profile complete ✓" centered on the row
     where the button would be.

The card MUST NOT render a checklist of individual completed items (FR-012).

## Sign Out — Server Action contract

```ts
// app/_actions/signout.ts
"use server";
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
```

- Always 302s to `/signin` whether or not a session existed (defense in depth).
- No return value.

## Failure modes

| Condition | Behavior |
|---|---|
| `getUser()` returns `null` | redirect `/signin`. |
| `getUser()` throws | log + redirect `/signin` (do not show stack). |
| `getProfileCompletion()` throws | render the card with `percent: 0` (graceful degrade) + console error. The user is signed in; refusing to render the page would be worse. |
| Cookie tampering / expired JWT | Supabase returns `null` user → redirect `/signin`. |

## Accessibility

- Greeting `<h1>` is the page's only `<h1>`.
- Card `<h2>` is the only `<h2>` in the main region.
- Sign Out button has accessible name "Sign out" (visible label, no icon-only on
  ≥ 360px — at the smallest width the label collapses but `aria-label="Sign out"`
  remains).
- The waving-hand emoji is decorative; wrap in `<span aria-hidden>` so screen
  readers don't say "waving hand sign".
