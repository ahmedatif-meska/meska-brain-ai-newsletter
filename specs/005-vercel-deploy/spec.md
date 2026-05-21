# Feature Specification: Vercel Production Deployment

**Feature Branch**: `005-vercel-deploy`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "i want to deploy this app on vercel check what are the best practices read next.config.ts and check if any updates require"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Public Production URL with Working Auth (Priority: P1)

A new visitor opens the production Meska Brain URL on their phone or laptop, signs
up with email + password, then later returns and signs in. The signup card, signin
card, password reset email, and "set new password" page all behave identically to
the local dev experience — same neon-blue gradient, same dark sky background, no
broken images, no missing styles, no environment errors.

**Why this priority**: Without a reachable public URL where the existing Phase 1
auth flow works end-to-end, nothing else in the product matters. This is the
launch gate.

**Independent Test**: Visit the production URL on a clean device, complete
signup → land on signin banner, sign in → land on `/home`, log out, request a
password reset → receive the email → follow the link → set a new password →
return to signin with the success banner. All in under 5 minutes.

**Acceptance Scenarios**:

1. **Given** the production URL is shared, **When** a visitor opens it on a 390px-wide
   mobile viewport, **Then** the signup card renders with zero horizontal overflow,
   the headline keeps its two lines, and the starfield animates behind it.
2. **Given** a new visitor on the production site, **When** they submit a valid
   signup form, **Then** they are redirected to the signin page with the
   "Account created" banner and can sign in immediately.
3. **Given** an existing user on production, **When** they request a password reset,
   **Then** the email arrives within 60 seconds, the link opens the "Choose a new
   password" page in a logged-in session, and submitting a new password returns
   them to signin with the "Password updated" banner.

---

### User Story 2 - Repeatable, Safe Deploys from `main` (Priority: P1)

A maintainer merges a PR into `main`. The hosting platform automatically builds,
runs lint and type-check as part of the build, and promotes a new production
deployment only if the build passes. Preview deployments are produced for every
non-main branch so reviewers can click a link and see the change without running
anything locally.

**Why this priority**: A deploy that only one person can trigger by hand is not a
deploy strategy. Repeatable, automated promotion from `main` is what separates a
live product from a demo.

**Independent Test**: Open a PR with a trivial change, confirm a preview URL is
posted on the PR within 3 minutes and renders the change correctly; merge to
`main`, confirm the production URL reflects the change within 5 minutes; open a
PR that introduces a TypeScript error, confirm the deployment fails before any
production change is published.

**Acceptance Scenarios**:

1. **Given** a pushed feature branch, **When** the build pipeline runs, **Then** a
   unique preview URL is generated and linked from the PR.
2. **Given** a PR with a `tsc --noEmit` failure or an ESLint error, **When** the
   build runs, **Then** the deployment is rejected and production is not updated.
3. **Given** a merge to `main`, **When** the production build succeeds, **Then**
   the production URL serves the new commit within 5 minutes.

---

### User Story 3 - Secrets and Environment Configuration (Priority: P1)

The maintainer can configure platform-managed secrets (Supabase URL, anon key,
service-role key) once per environment (production, preview, development) and
update them later without touching code. The service-role key is never exposed
to the browser. If any required secret is missing, the affected auth action
returns a graceful "Server is not configured" error instead of crashing the
process.

**Why this priority**: Auth on this app depends on three secrets, one of which
(service role) is catastrophic if leaked. Getting the secret model right is
inseparable from the deploy.

**Independent Test**: In a fresh preview environment with all three secrets set,
signup, signin, and reset all work. Delete the service-role secret and redeploy:
signup fails with the configured error message and the server does not crash.
Inspect the browser bundle and confirm the service-role key string never appears.

**Acceptance Scenarios**:

1. **Given** all three Supabase secrets are configured for the production
   environment, **When** any auth action runs, **Then** it completes without
   "Server is not configured" errors.
2. **Given** the service-role secret is missing or rotated, **When** a user
   attempts to sign up, **Then** they see the configured error message and the
   server logs the underlying cause without crashing.
3. **Given** a browser inspects the deployed JavaScript bundle, **When** they
   search it for the service-role secret value, **Then** the value is not found.

---

### User Story 4 - Auth Redirect URLs Match the Deployed Origin (Priority: P1)

Password reset emails sent from the production environment contain a link that
returns the user to the production origin (not localhost), exchanges the token,
and lands on `/update-password`. Preview environments either share a single
allow-listed callback or are excluded from sending password reset emails.

**Why this priority**: Reset emails issued with the wrong `redirectTo` either
fail silently or send users to a 404. This was the most likely launch-day bug
when the flow was tested locally only.

**Independent Test**: From production, request a reset for a real test user.
Open the email on a separate device. Confirm the link points to the production
origin's `/auth/callback?next=/update-password`, that it loads `/update-password`
with a valid session, and that the success path lands on the production signin
with the success banner.

**Acceptance Scenarios**:

1. **Given** a reset is requested from the production site, **When** the email
   arrives, **Then** the link's host matches the production origin and is on the
   platform's allow-list.
2. **Given** the user clicks the link, **When** the callback runs, **Then** a
   session is established and the user lands on `/update-password`.
3. **Given** an expired or tampered link, **When** the callback runs, **Then**
   the user is redirected to signin with the `reason=reset_failed` banner.

---

### User Story 5 - Optimized Build Configuration (Priority: P2)

The build configuration is reviewed and updated so that the production build
benefits from React Compiler (already on), strict mode, image optimization for
any non-decorative imagery added later, and disables development-only options
that should not ship to production. A documented note explains each enabled
option and why it is there.

**Why this priority**: Deployment works without this — but a one-time review
prevents shipping dev-only flags (e.g., the in-memory dev filesystem cache flag
currently under `experimental`) and locks in image/font behavior before content
volume grows.

**Independent Test**: Inspect `next.config.ts` after the review. Every option is
either documented in a brief comment or listed in this spec's Assumptions /
Decisions section. A production build completes and the lighthouse performance
score on `/signup` is at least 90 on a desktop run.

**Acceptance Scenarios**:

1. **Given** the reviewed config, **When** a production build runs, **Then** it
   succeeds with no warnings about unknown or deprecated options.
2. **Given** the production deployment, **When** Lighthouse runs against
   `/signup` on a stable desktop network, **Then** the performance score is ≥ 90
   and accessibility score is ≥ 95.

---

### Edge Cases

- The Supabase email-template "Site URL" still points at `localhost:3000` after
  go-live, so reset emails send users to a dead origin.
- A maintainer rotates the service-role key but forgets to update the
  production environment variable — auth must degrade gracefully, not 500.
- A platform region/timezone difference causes the JWT `iat`/`exp` checks in
  `@supabase/ssr` to misbehave on edge runtimes; affected routes must remain on
  the Node.js runtime where the SSR cookie bridge is supported.
- A preview deployment is shared publicly and indexed by a search engine before
  launch; preview environments must not be indexed.
- A future contributor adds a `"use client"` directive to a server-only module
  that imports `lib/supabase/admin.ts`; the build must fail loudly rather than
  ship the service-role key to the browser.
- The custom domain SSL certificate fails to provision or expires — the site
  must continue to serve the platform-provided `*.vercel.app` hostname as a
  fallback that the maintainer can communicate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The production deployment MUST be reachable at a stable HTTPS URL
  on a custom domain (or, until a domain is connected, the platform-provided
  hostname), with valid SSL.
- **FR-002**: Pushing to any non-`main` branch MUST automatically produce a
  preview deployment with its own unique URL.
- **FR-003**: Merging to `main` MUST automatically promote a new production
  deployment after the build passes.
- **FR-004**: The build pipeline MUST run `npm run lint` AND `npx tsc --noEmit`
  AND `npm run build`, and MUST fail the deployment if any of the three exit
  non-zero.
- **FR-005**: The platform MUST hold three environment-scoped secrets —
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — independently for production, preview, and
  development environments.
- **FR-006**: The service-role secret MUST be marked server-only and MUST NOT
  appear in any client-bundled JavaScript or in any response body.
- **FR-007**: Supabase Authentication's allow-listed redirect URLs MUST include
  the production origin's `/auth/callback` path; preview environments MUST
  either share a single allow-listed callback or be excluded from password
  reset flows.
- **FR-008**: Supabase Authentication's "Site URL" MUST match the production
  origin so password reset emails route users to the live site.
- **FR-009**: The signup, signin, and password reset flows MUST work end-to-end
  on the production deployment without code changes between dev and prod.
- **FR-010**: The build configuration (`next.config.ts`) MUST be reviewed; any
  development-only or experimental flag that should not ship to production MUST
  be removed or guarded, and every remaining option MUST be either obviously
  named or briefly commented.
- **FR-011**: Preview deployments MUST NOT be indexed by search engines
  (e.g., via platform-provided "Deployment Protection" or an `X-Robots-Tag`).
- **FR-012**: Server actions and routes that depend on the SSR cookie bridge
  (`@supabase/ssr`) MUST run on the Node.js runtime, not the Edge runtime.
- **FR-013**: A deployment runbook MUST exist (under `specs/005-vercel-deploy/`)
  describing how to: connect the repository, set environment variables, attach a
  custom domain, configure Supabase redirect URLs and Site URL, and roll back a
  bad deploy.
- **FR-014**: Production responses for HTML pages MUST set basic security
  headers — at minimum `Strict-Transport-Security`, `X-Content-Type-Options:
  nosniff`, and a `Referrer-Policy` no looser than `strict-origin-when-cross-origin`.

### Key Entities

- **Environment**: A named target (production, preview, development) with its
  own copy of Supabase URL, anon key, and service-role key; preview shares one
  set unless per-branch overrides are needed.
- **Deployment**: An immutable build artifact tied to a specific commit, with a
  unique URL, a status (building / ready / failed), and a promotion state
  (production / preview).
- **Redirect Allow-list Entry**: A fully-qualified URL pattern registered in
  Supabase Authentication that the auth callback is permitted to return to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can complete signup → signin → password
  reset → re-signin on the production URL in under 5 minutes without
  encountering a 500 error, a CORS error, or a redirect to localhost.
- **SC-002**: Production deployments triggered by a merge to `main` go from
  green CI to a publicly reachable URL in under 5 minutes, 95% of the time.
- **SC-003**: Preview URLs are posted on a PR within 3 minutes of the push,
  100% of the time the build succeeds.
- **SC-004**: Zero deployments containing a `tsc --noEmit` or ESLint failure
  reach production over the first 30 days post-launch.
- **SC-005**: The service-role secret value does not appear in any production
  client bundle or HTML response, verified by an automated grep step in the
  runbook.
- **SC-006**: Lighthouse performance score on `/signup` is at least 90 and
  accessibility score is at least 95 on the production deployment.
- **SC-007**: At least one full rollback drill is documented in the runbook and
  completes (production reverted to the previous deployment) in under 2 minutes.

## Assumptions

- The hosting platform is Vercel (named by the user); the repository is
  connected directly to the Vercel project, not via a custom CI bridge.
- The custom domain, if any, is owned by the maintainer and DNS can be updated
  to point at the platform's name servers or CNAME target.
- Supabase remains the auth and data backend; no migration to a different
  provider is part of this work.
- Email delivery for password reset uses Supabase's built-in mailer in Phase 1;
  a custom SMTP provider can be wired in later without changing this spec.
- The existing local validation that `lib/supabase/admin.ts` is `"server-only"`
  is sufficient guard against leaking the service-role key, provided no new
  client module imports it.
- No third-party analytics, tracking, or marketing scripts are added as part of
  this deployment; if any are added later, they go through their own spec.
- Image, font, and static asset loading already work locally; the deployment
  inherits Next.js's default optimization without explicit image domain
  configuration because the app currently ships no remote imagery.
- "Best practices" review of `next.config.ts` is scoped to: confirm
  `reactCompiler: true` stays, evaluate whether
  `experimental.turbopackFileSystemCacheForDev` should be kept (it only affects
  `next dev`, not production builds), and add any production-relevant headers
  or runtime hints. No build target change (e.g., to `output: 'standalone'`) is
  in scope.
