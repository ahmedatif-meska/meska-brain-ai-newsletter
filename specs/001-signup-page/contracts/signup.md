# Contract: Sign-up Interfaces

Phase 1 has no public HTTP API. The two interfaces below are the application's internal contract between the client form and the server, and between the browser and the OAuth callback route. They are documented here so reviewers can confirm shape and error semantics without reading code.

## 1. Server Action: `signupWithPassword`

**Location**: `app/(auth)/_actions/signup.ts`

**Invocation**: Called by `<SignupForm />` via the standard React 19 Server Actions mechanism (`<form action={signupWithPassword}>` or `useTransition` + direct call). Runs server-side only.

### Input

`FormData` containing:

| Key | Type | Required |
|---|---|---|
| `firstName` | string | yes |
| `lastName` | string | yes |
| `email` | string | yes |
| `password` | string | yes |

### Output

```ts
type SignupResult =
  | { ok: true; redirect: '/signin' }
  | { ok: false; errors: FieldError[] };

type FieldError = {
  field: 'firstName' | 'lastName' | 'email' | 'password' | 'form';
  message: string;
};
```

### Behavior

1. Read & trim each field. Lowercase `email` for the duplicate check; preserve original for storage.
2. Run validators from `lib/validation/signup.ts`. If any fail, return `{ ok: false, errors }` immediately. No Supabase call is made.
3. Construct a service-role Supabase client (`lib/supabase/admin.ts`) and call:
   ```ts
   supabase.auth.admin.createUser({
     email,
     password,
     email_confirm: true,
     user_metadata: {
       first_name: firstName,
       last_name: lastName,
       auth_method: 'password',
     },
   });
   ```
4. If Supabase returns a duplicate-email error (status 422 / code `email_exists`), return:
   ```ts
   { ok: false, errors: [{ field: 'email', message: 'An account with this email already exists. Sign in instead.' }] }
   ```
5. On any other Supabase error, return `{ ok: false, errors: [{ field: 'form', message: <user-safe message> }] }` and log the underlying error server-side.
6. On success, return `{ ok: true, redirect: '/signin' }`. The action MUST NOT set a session cookie (no auto-login).
7. The form component disables the submit button between submit and response to satisfy the double-click test (Scenario 8).

### Authorization

None. Endpoint is public. Uses service-role key server-side — this key MUST NOT appear in any client bundle.

## 2. Google OAuth Sign-up Flow

### 2a. Client trigger

**Location**: `components/auth/GoogleButton.tsx`

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?intent=signup`,
    queryParams: { prompt: 'consent', access_type: 'offline' },
  },
});
```

### 2b. Callback route

**Location**: `app/auth/callback/route.ts` — `GET` handler.

### Input

Query params on the callback URL set by Supabase: `code`, `next` (we set to `/signin`), `intent` (we set to `signup`).

### Behavior

1. Exchange the `code` for a session via `supabase.auth.exchangeCodeForSession(code)`.
2. Read the resulting `user`. Extract `given_name` and `family_name` from `user.identities?.[0]?.identity_data` (Google's payload).
3. If the user's `user_metadata.first_name` / `last_name` are unset (i.e., this is a first-time creation rather than a re-auth), `supabase.auth.admin.updateUserById(user.id, { user_metadata: { first_name, last_name, auth_method: 'google' } })`.
4. Whether or not the user existed previously, call `supabase.auth.signOut()` to satisfy "no auto-login after sign-up".
5. Redirect:
   - If this was a freshly-created account → `303 -> /signin`.
   - If the email matched a pre-existing user → `303 -> /signin?reason=existing` (the page surfaces the "sign in instead" guidance).
6. On any error from `exchangeCodeForSession`, redirect to `/signup?error=oauth`.

### Authorization

None. Endpoint is public (callback URL configured in Supabase Auth settings).

## Error catalogue

| Source | Surfaces as |
|---|---|
| Required field empty | Inline error under that field: `"<Field name> is required."` |
| Email regex fails | Inline error under email: `"Enter a valid email address."` |
| Password too short | Inline error under password: `"Password must be at least 8 characters."` |
| Password missing uppercase / digit / symbol | Inline error under password naming the missing class. |
| Duplicate email (password flow) | Inline error under email: `"An account with this email already exists. Sign in instead."` |
| Duplicate email (Google flow) | `/signin?reason=existing` banner: `"This email is already registered — sign in instead."` |
| OAuth exchange failure | `/signup?error=oauth` banner: `"We couldn't complete Google sign-up. Try again."` |
| Unknown server error (password flow) | Form-level error: `"Something went wrong. Try again."` |
