# Data Model: Dashboard Home

`/home` reads two entities. Neither is created or mutated by Phase 2.

---

## Entity: User (read-only)

Source: Supabase Auth (`auth.users` row, surfaced via
`supabase.auth.getUser()`).

| Field | Type | Source | Used by `/home` |
|---|---|---|---|
| `id` | uuid | `auth.users.id` | Pass to `getProfileCompletion`. |
| `email` | string | `auth.users.email` | Not displayed; available for debug. |
| `user_metadata.first_name` | string | written by `signup.ts` / Phase 3 Form 1 edit | Greeting. |
| `user_metadata.last_name` | string | written by `signup.ts` / Phase 3 Form 1 edit | Greeting. |
| `user_metadata.display_name` | string | written by `signup.ts` | Fallback only if first/last both empty (R8). |

**Validation on read**: `first_name` and `last_name` are treated as untrusted strings
— rendered as text (no `dangerouslySetInnerHTML`). Whitespace collapsed.

**State transitions**: none in this phase. Phase 3 Form 1 will update `first_name` /
`last_name`; the next render of `/home` MUST pick up the new values (FR-006).

---

## Entity: ProfileCompletion (derived, read-only)

Source: `lib/profile/completion.ts → getProfileCompletion(userId)`. This is the
ONLY contract Phase 2 depends on; Phase 3 will swap the implementation without
changing the UI.

### Shape

```ts
type ProfileCompletion = {
  percent: 0 | 33 | 66 | 100;
  formsCompleted: {
    identity: boolean;   // Phase 3 Form 1
    bioLink: boolean;    // Phase 3 Form 2
    finalize: boolean;   // Phase 3 Form 3
  };
};
```

### Derivation rule (when Phase 3 lands)

```
count = (identity ? 1 : 0) + (bioLink ? 1 : 0) + (finalize ? 1 : 0)
percent = [0, 33, 66, 100][count]
```

Exactly four legal values — no decimals, no other states.

### Phase 2 stub implementation

Until Phase 3 writes form completion data, return:

```ts
{ percent: 0, formsCompleted: { identity: false, bioLink: false, finalize: false } }
```

This satisfies FR-009 (the derivation rule) and FR-010 (renders the "Complete
Profile" button below the bar at 0%). All `/home` rendering paths are exercised
even before Phase 3 ships.

### Relationships

- 1 User → 1 ProfileCompletion (derived; not stored).
- No FK; the function takes `userId` and reads whatever source Phase 3 chooses
  (likely a `profiles` table with `*_saved_at` timestamps).

---

## Out of model

- The 3 profile forms themselves and any free-text Phase 3 response — owned by
  Phase 3's data model, not this one.
- Notifications, article content, channel/language fields — not surfaced on `/home`
  per spec Out-of-Scope.
