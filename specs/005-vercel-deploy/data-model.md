# Phase 1 — Data Model: Vercel Production Deployment

There is no application schema change in this feature. The "data" being modeled
here is operational configuration: environments, secrets, and the contracts
between Vercel and Supabase.

## Entity: Environment

A named Vercel deployment target. Three exist.

| Field | Type | Notes |
|---|---|---|
| `name` | enum | `production` \| `preview` \| `development` |
| `supabase_project_ref` | string | Project that this environment authenticates against. Production SHOULD be distinct from preview/development. |
| `vercel_env_scope` | enum | `Production` \| `Preview` \| `Development` — matches Vercel's UI labels. |
| `deployment_protection` | bool | `false` for production, `true` for preview (Vercel Authentication enabled). |
| `indexable_by_search_engines` | bool | `true` for production, `false` for preview & development. |

## Entity: Secret

A platform-managed environment variable.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Exact identifier read by the code. |
| `client_exposed` | bool | `true` only if name starts with `NEXT_PUBLIC_`. |
| `required` | bool | If true, the code raises "Server is not configured" when missing. |
| `scopes` | set<Environment.name> | Where the value is set in Vercel. |
| `source` | string | Where to copy the value from (Supabase project settings page, etc.). |
| `rotation_procedure` | string | How to rotate without downtime. |

**Instances** — see `contracts/env-vars.md` for the literal table.

## Entity: Deployment

An immutable artifact produced by a single git push.

| Field | Type | Notes |
|---|---|---|
| `commit_sha` | string | Source of truth for what shipped. |
| `url` | string | Stable per-deployment URL (`<sha>-<project>.vercel.app`). |
| `target` | enum | `production` \| `preview`. |
| `status` | enum | `building` \| `ready` \| `error` \| `canceled`. |
| `promoted_from` | string? | If this deployment was reached via "Promote to Production" rather than a direct push, the source deployment's `commit_sha`. Used for rollback audit. |

## Entity: Redirect Allow-list Entry

A URL pattern registered in Supabase Authentication → URL Configuration →
Redirect URLs.

| Field | Type | Notes |
|---|---|---|
| `pattern` | string | Fully-qualified URL. Supabase supports a single `*` in the hostname segment. |
| `purpose` | string | Human label — which flow uses this (password reset, OAuth callback, etc.). |
| `environment` | Environment.name | Which Vercel environment relies on this entry. |

**Instances** — see `contracts/supabase-auth.md`.

## Validation rules

- Every `Secret` with `client_exposed = true` MUST have its name begin with
  `NEXT_PUBLIC_`.
- Every `Secret` with `client_exposed = false` MUST never appear in any module
  reachable from a `"use client"` directive. Enforced today by
  `import "server-only"` in `lib/supabase/admin.ts`.
- For every `Redirect Allow-list Entry` whose `environment = production`, the
  pattern's host MUST equal the value of Supabase Auth's Site URL.

## State transitions

`Deployment.status`:

```
building → ready       (promoted to production if target=production and tip of main)
building → error       (build failed — does not affect current production)
building → canceled    (superseded by a newer push to the same branch)
ready    → ready       (when "Promote to Production" picks an older deployment)
```

There are no application-level state machines; everything else is read-only
configuration.
