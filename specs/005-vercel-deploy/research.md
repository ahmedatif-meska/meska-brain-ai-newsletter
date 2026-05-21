# Phase 0 — Research: Vercel Production Deployment

This document records the deployment-time decisions for shipping Meska Brain Phase 1
to Vercel. Each decision lists the rationale and the alternatives considered.

## 1. Hosting platform

**Decision**: Vercel (Hobby tier to launch, upgrade to Pro when team collaboration
is required).

**Rationale**:

- The user explicitly named Vercel. Next.js 16 + React 19 + the React Compiler are
  first-party supported, so no manual runtime tuning is needed.
- Preview deployments per branch are built-in and gate-able by Vercel's
  Deployment Protection.
- Server actions and the `/auth/callback` route run on Node.js by default, which is
  what `@supabase/ssr` needs (see decision 4).

**Alternatives considered**:

- **Self-hosted Node via Docker + a generic VPS**: rejected — more ops surface
  (TLS renewal, log rotation, zero-downtime restarts) for no product benefit at
  current scale.
- **Cloudflare Pages**: rejected — defaults to the Workers runtime; the
  `@supabase/ssr` cookie bridge requires more work to run correctly there.
- **Netlify**: rejected — preview-URL ergonomics are similar but Next.js 16
  App-Router + React-Compiler support lags Vercel's first-party path.

## 2. `next.config.ts` posture

**Decision**: Keep `reactCompiler: true`. Remove
`experimental.turbopackFileSystemCacheForDev` from the shipped config (or guard it
behind `process.env.NODE_ENV === "development"`). Add an `async headers()` block
that sets `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and
`Referrer-Policy: strict-origin-when-cross-origin` for all routes. Do NOT change
the build target (no `output: "standalone"`).

**Rationale**:

- `reactCompiler` is the project's standing optimization choice (Principle IV); no
  reason to remove on deploy.
- `turbopackFileSystemCacheForDev` is a `next dev` accelerator. Shipping it in the
  production config adds noise and risks future Next.js versions warning on it.
- The three headers are widely-considered baseline; HSTS in particular is required
  for HTTPS-only enforcement once a custom domain is connected.
- `output: "standalone"` is for self-hosted Docker images; Vercel doesn't need it
  and using it would disable some Vercel optimizations.

**Alternatives considered**:

- **Add a strict Content-Security-Policy**: deferred to a later spec. CSP is high
  value but requires per-page hash/nonce work for the inline Material Symbols
  styles and Next.js's RSC payload; getting it wrong breaks production. A separate
  spec will tackle CSP with proper test coverage.
- **Keep the Turbopack flag in production with no effect**: rejected — it's
  documented as dev-only; leaving it invites future deprecation warnings and
  confuses readers.

## 3. Environment scoping

**Decision**: Three separate environments in Vercel: Production, Preview,
Development. Production gets its own Supabase project ideally, Preview shares one
Supabase project keyed to the prod project's "staging" branch, and Development
points at the same Supabase that local `.env.local` uses today.

**Rationale**:

- Production and preview MUST NOT share a Supabase database — a preview-only
  migration could corrupt production data. (If a separate Supabase project is not
  yet available at launch, this is recorded as a known gap in
  `walkthrough.md` and a follow-up spec will split them.)
- The service-role key for production must never be readable by preview builds; a
  separate Vercel scope is the cleanest way to enforce that.

**Alternatives considered**:

- **One Supabase project for all environments**: simpler but unsafe. Documented as
  the launch fallback only if separating projects isn't feasible before go-live.
- **Per-PR Supabase branches**: deferred. Supabase branching exists but adds
  cost and lifecycle complexity not justified at current scale.

## 4. Runtime for auth routes (Node vs Edge)

**Decision**: Node.js runtime for everything. Do not opt any route into Edge.

**Rationale**:

- `lib/supabase/server.ts` uses `@supabase/ssr` with `next/headers` to bridge
  cookies. The session-write path requires the Node response semantics; the Edge
  runtime in Next.js currently does not give the same `cookies().set()` write
  surface in the way this code uses it.
- `lib/supabase/admin.ts` imports `server-only` and uses the service-role key —
  Edge runtime is also incompatible with the admin client.
- Vercel's default runtime is Node for App Router server components and server
  actions, so this is also the "do nothing" path. No `export const runtime =
  "edge"` directives exist anywhere in the repo; that is the correct state.

**Alternatives considered**:

- **Move `/auth/callback` to Edge for faster TTFB**: rejected — measurable benefit
  is small for an OAuth code exchange that's already a Supabase round-trip, and the
  cookie-bridge risk is real. Revisit only if a profile latency complaint surfaces.

## 5. Preview deployment indexing posture

**Decision**: Enable Vercel Deployment Protection (Vercel Authentication) for
Preview deployments only. Leave Production public.

**Rationale**:

- Preview URLs are linkable; without protection they can be indexed or shared and
  expose work-in-progress UI before the brand is ready.
- Vercel Authentication adds zero code; it's a project setting.

**Alternatives considered**:

- **`X-Robots-Tag: noindex` on previews only via `headers()` keyed on
  `process.env.VERCEL_ENV`**: rejected as the primary mechanism (it only blocks
  indexing, not casual visitors). Could be added as a defense-in-depth layer later.
- **No protection**: rejected — a competitor or journalist finding a preview URL
  before launch is a foreseeable harm.

## 6. Security headers

**Decision**: Ship these three in `next.config.ts` `async headers()`:

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS once a custom domain is connected. The 2-year max-age + preload satisfies HSTS preload-list eligibility for future submission. |
| `X-Content-Type-Options` | `nosniff` | Stop browsers from MIME-sniffing responses. Cheap, no downside. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits Referer leakage to third-party domains while keeping same-origin debugging useful. |

**Rationale**: These are the lowest-risk, highest-signal headers. Each is widely
supported and breaks no current functionality.

**Alternatives considered**:

- **`X-Frame-Options: DENY`**: deferred — once CSP `frame-ancestors` ships, this
  is redundant. Adding it now is harmless but pre-empts the CSP design.
- **`Permissions-Policy`**: deferred until a feature uses a sensitive API
  (geolocation, camera) so the policy has something to gate.

## 7. Supabase Auth URL configuration

**Decision**: Set Supabase **Site URL** to the production origin. Add the following
to the **Redirect Allow-list**:

- `https://<prod-host>/auth/callback`
- `https://<prod-host>/auth/callback?next=/update-password` (wildcards on query
  strings are not allowed by Supabase; the exact string is added)
- `https://*.vercel.app/auth/callback` (wildcard for preview deploys — Supabase
  supports a single `*` in the hostname portion)
- `http://localhost:3000/auth/callback` (dev convenience; safe because Supabase
  validates the email recipient against the calling project's user list)

**Rationale**: The `requestPasswordReset` action in
`app/(auth)/_actions/reset-password.ts` builds `redirectTo` from the request's own
`host` header. Without the allow-list entry, Supabase silently drops the
`redirectTo` and falls back to the Site URL — which is exactly the localhost bug
we want to avoid.

**Alternatives considered**:

- **Use only the production callback**: rejected — preview deployments would lose
  the ability to test password reset end-to-end.

## 8. Rollback strategy

**Decision**: Use Vercel's built-in "Promote to Production" against the
immediately-previous deployment. No code/branch-revert required for an emergency
rollback. The previous deployment's URL is recorded in `walkthrough.md` so a
fallback link is shareable in under one minute.

**Rationale**: Vercel keeps every prior deployment immutable; promoting an old one
is one click and < 30 seconds of CDN propagation. Reverting a commit on `main` and
waiting for a rebuild takes minutes longer and risks a second bad build.

**Alternatives considered**:

- **`git revert` + push**: kept as the secondary path for non-emergency rollbacks
  (when the bad commit also needs to be removed from history).
