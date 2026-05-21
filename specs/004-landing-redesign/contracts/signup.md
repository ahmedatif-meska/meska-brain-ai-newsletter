# Contract: Sign-up Interfaces (Landing Redesign)

This supersedes `specs/001-signup-page/contracts/signup.md`. There is only one interface contract in this revision (the Server Action). The Google OAuth callback contract from 001 is removed.

## 1. Server Action: `signupWithPassword`

**Location**: `app/(auth)/_actions/signup.ts`

**Invocation**: Called by `<SignupForm />` (`"use client"`) via `useTransition` + direct call. Server-side only.

### Input

`FormData` containing:

| Key | Type | Required |
|---|---|---|
| `email` | string | yes |
| `password` | string | yes |

Note: `firstName` and `lastName` are NOT read or required.

### Output

```ts
type SignupResult =
  | { ok: true; redirect: '/signin?signedup=1' }
  | { ok: false; errors: FieldError[] };

type FieldError = {
  field: 'email' | 'password' | 'form';
  message: string;
};
```

Note: `'firstName'` and `'lastName'` are NOT valid `field` values in this revision.

### Behaviour

1. Read & trim `email`. Lowercase for duplicate check; preserve the trimmed (still lowercased) value for storage.
2. Read `password` as-is (preserve whitespace).
3. Run `validateSignupInput({ email, password })` from `lib/validation/signup.ts`. If any error, return `{ ok: false, errors }` immediately. No Supabase call.
4. Build a service-role Supabase client (`lib/supabase/admin.ts`) and call:
   ```ts
   supabase.auth.admin.createUser({
     email,
     password,
     email_confirm: true,
     user_metadata: {
       first_name: '',
       last_name: '',
       auth_method: 'password',
     },
   });
   ```
5. If Supabase returns a duplicate-email error (code `email_exists`, status `422`, or message containing "already" / "registered"), return:
   ```ts
   { ok: false, errors: [{ field: 'email', message: 'An account with this email already exists. Sign in instead.' }] }
   ```
6. On any other Supabase error, log server-side and return `{ ok: false, errors: [{ field: 'form', message: 'Something went wrong. Try again.' }] }`.
7. On success, return `{ ok: true, redirect: '/signin?signedup=1' }`. NO session cookie is set (no auto-login).
8. The submit button is disabled by the form while the action is pending, satisfying the double-click scenario.

### Authorisation

None. Endpoint is public. Service-role key is referenced only by server-only modules and MUST NOT appear in any client bundle.

## 2. (Removed) Google OAuth callback

The Server-side route `app/auth/callback/route.ts` is **deleted** by this revision. Its previous responsibilities (exchanging the OAuth code, backfilling Google name into `user_metadata`, signing the user out, redirecting to `/signin`) are no longer needed because Google sign-up is removed from MVP.

## Error catalogue

| Source | Surfaces as |
|---|---|
| Email empty | Inline under email: `"Email is required."` |
| Email regex fails | Inline under email: `"Enter a valid email address."` |
| Password empty | Inline under password: `"Password is required."` |
| Password too short | Inline under password: `"Password must be at least 8 characters."` |
| Password missing uppercase / digit / symbol | Inline under password naming the missing class. |
| Duplicate email | Inline under email: `"An account with this email already exists. Sign in instead."` |
| Unknown server error | Form-level: `"Something went wrong. Try again."` |

## 3. (New) Root route behaviour

**Location**: `app/page.tsx`

**Contract**: GET `/` returns an HTTP 307 redirect to `/signup`, OR renders the same Server Component tree as `/signup`. Either is acceptable per FR-002. The intended implementation is `redirect('/signup')` from `next/navigation`, which is a 307.

**Acceptance**: A `curl -I http://localhost:3000/` returns `HTTP/1.1 307` with `Location: /signup`. Browsers display `/signup` with no flash of any prior `/` content.

## 4. Public route inventory

After this revision, the publicly reachable routes are:

| Path | Purpose |
|---|---|
| `/` | 307 → `/signup` |
| `/signup` | Sign-up page (RSC + 4 client islands) |
| `/signin` | Placeholder, receives the post-signup redirect and shows banner copy |

The previously existing `/auth/callback` route is removed.
