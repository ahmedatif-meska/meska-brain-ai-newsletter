# Module Contract: `lib/profile/completion.ts`

The single read contract Phase 2 depends on. Phase 3 will swap the implementation
without changing the signature or any caller.

## Module location

`lib/profile/completion.ts` — server-only (`import "server-only"` at the top of
the file).

## Public API

```ts
export type FormKey = "identity" | "bioLink" | "finalize";

export type ProfileCompletion = {
  /** Exactly one of 0, 33, 66, 100. Never any other value. */
  percent: 0 | 33 | 66 | 100;
  formsCompleted: Record<FormKey, boolean>;
};

export async function getProfileCompletion(
  userId: string,
): Promise<ProfileCompletion>;
```

## Phase 2 (stub) implementation

```ts
import "server-only";

export type FormKey = "identity" | "bioLink" | "finalize";

export type ProfileCompletion = {
  percent: 0 | 33 | 66 | 100;
  formsCompleted: Record<FormKey, boolean>;
};

export async function getProfileCompletion(
  _userId: string,
): Promise<ProfileCompletion> {
  return {
    percent: 0,
    formsCompleted: { identity: false, bioLink: false, finalize: false },
  };
}
```

## Phase 3 implementation (forward-looking, NOT shipped in this phase)

When Phase 3 lands, replace the body with a Supabase read against the profile
tables it owns. The signature MUST NOT change.

```ts
// Pseudo-code — actual schema decided by Phase 3 plan.
const { data } = await supabase
  .from("profiles")
  .select("identity_saved_at, bio_link_saved_at, finalize_saved_at")
  .eq("user_id", userId)
  .single();

const formsCompleted = {
  identity: Boolean(data?.identity_saved_at),
  bioLink: Boolean(data?.bio_link_saved_at),
  finalize: Boolean(data?.finalize_saved_at),
};
const count =
  Number(formsCompleted.identity) +
  Number(formsCompleted.bioLink) +
  Number(formsCompleted.finalize);
const percent = ([0, 33, 66, 100] as const)[count];

return { percent, formsCompleted };
```

## Invariants

1. `percent` is one of `{0, 33, 66, 100}` — no other values, ever.
2. Function is read-only and side-effect-free (no writes, no auth calls).
3. Function runs in a Server Component / Server Action context only
   (`server-only` import enforces).
4. Returns within ~100ms (one Supabase query) — required to keep `/home` under
   the SC-001 2s budget.

## Errors

Throws on Supabase failure. The caller (`app/home/page.tsx`) is responsible for
catching and rendering with `percent: 0` per the home contract's "Failure modes"
table.
