---
name: add-firestore-collection
description: Use whenever adding a new Firestore (sub-)collection — usually under `villages/{villageId}/`. Encodes the multi-file checklist (model + service + index re-export + services map + rules + collection-group index + vitest + rules test) so the change lands complete in one commit instead of trickling in over five.
---

# Add a new Firestore collection

Adding a collection is a multi-file change that's easy to do incompletely. Every step below ships in the **same commit**.

## Decide the path

Cultuvilla nests village-scoped data under `villages/{villageId}/...`. Two questions:

1. **Is this village-scoped?** Yes → `villages/{villageId}/<collection>/{docId}`. No → top-level (`users/`, `municipalities/`, `occupations/`). The default is village-scoped; only deviate when the entity is genuinely cross-village reference data.
2. **Will it ever be queried cross-village?** Yes → collection group index in step 6. No → still safe to add the index, but not required.

## Checklist

### 1. Model

Create `packages/shared/src/models/<entity>.ts`. Export the type, the `Collections.<EntityKey>` path constant if the file maintains one, and any input shapes used at create/update time (`CreateXInput`, `UpdateXInput`). Keep fields strict — no `any`.

If the entity has subdocs (e.g. nested `images`), model the sub-shape as its own interface in the same file unless reused elsewhere.

### 2. Service

Create `packages/shared/src/services/<entity>Service.ts`. Banner-section style matching `eventService.ts` or `personService.ts`. Strict types on every export. No `any` at boundaries. No silent fallbacks.

Standard entry points to define (only those that are actually needed — YAGNI):

- `get<Entity>(villageId, id): Promise<Entity | null>`
- `get<Entity>sByVillage(villageId): Promise<Entity[]>`
- `create<Entity>(villageId, input: Create<Entity>Input): Promise<Entity>`
- `update<Entity>(villageId, id, patch: Update<Entity>Input): Promise<void>`
- `delete<Entity>(villageId, id): Promise<void>`

Cross-user writes or trust-sensitive updates DO NOT go in the client service — they go in a Cloud Function callable. See the `guardrail-enforcement` skill.

### 3. Index re-export

Add the service to `packages/shared/src/services/index.ts`. Match the style of existing entries (`export * from './<entity>Service';`).

### 4. Services map

Add a row to [`packages/shared/src/services/_services-map.md`](../../../packages/shared/src/services/_services-map.md):

```markdown
| [<entity>Service](<entity>Service.ts) | `villages/{vid}/<collection>/` | <one-sentence summary> | `get<Entity>`, `get<Entity>sByVillage`, `create<Entity>`, `update<Entity>`, `delete<Entity>` |
```

The map is the agent index. Skipping this row means future sessions won't find your service.

### 5. Rules

Open [`firestore.rules`](../../../firestore.rules). Find the existing `match /villages/{villageId} { ... }` block and add a nested match for the new sub-collection:

```
match /<collection>/{docId} {
  allow read: if isVillageMember(villageId);
  allow create: if isVillageMember(villageId);
  allow update: if isOwner(resource.data.createdBy) || isVillageAdmin(villageId);
  allow delete: if isOwner(resource.data.createdBy) || isVillageAdmin(villageId);
}
```

Adjust the predicates for the actual access model. Use the existing helper functions (`isVillageMember`, `isVillageAdmin`, `isOwner`, `isAppAdmin`) — don't redefine identity checks inline.

If the write is cross-user or trust-sensitive (only the village admin can grant a role, only the organizer can finalize an event, etc.), tighten the rule to `allow write: if false` for the affected fields and route the write through a Cloud Function — see `guardrail-enforcement`.

### 6. Collection-group index

Open [`firestore.indexes.json`](../../../firestore.indexes.json). Add an entry under `indexes` for any collection-group query you've added (or plan to add) on this collection:

```json
{
  "collectionGroup": "<collection>",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "<filterField>", "order": "ASCENDING" },
    { "fieldPath": "<sortField>", "order": "ASCENDING" }
  ]
}
```

Even if no collection-group query exists today, AGENTS.md §3 says: when you add a sub-collection, add the index in the same change. The cost of an unused index is negligible; the cost of a runtime "this query requires an index" error in front of a user is high.

### 7. Vitest

Create `packages/shared/test/services/<entity>Service.test.ts`. Cover at minimum:

- `create<Entity>` writes the expected shape (mocked Firestore or fakes — match existing tests in `packages/shared/test/services/`).
- `update<Entity>` rejects an invalid patch (e.g. missing required field) by throwing, NOT silently swallowing.
- `get<Entity>` returns `null` (not undefined) for a missing doc.

Run: `pnpm shared:test` — should pass.

### 8. Rules test

Create `packages/shared/test/e2e/<entity>Rules.test.ts` (the convention in this repo — rules tests live in `e2e/`, e.g. `villageRules.test.ts`). Cover at minimum:

- An authenticated village member CAN create a doc.
- An authenticated NON-member CANNOT create a doc.
- A doc owner CAN update; a non-owner non-admin CANNOT.

Run: `pnpm test:rules` — should pass.

### 9. Deploy notes in the PR description

If the rules or indexes file changed, the PR description must note that a deploy is needed and to which env (default dev — use the `firestore-deploy` skill). Indexes build asynchronously after deploy.

## Required outputs

- [ ] Model in `packages/shared/src/models/<entity>.ts` with strict types.
- [ ] Service in `packages/shared/src/services/<entity>Service.ts`, exported from `index.ts`.
- [ ] Row added to `_services-map.md` in the same commit.
- [ ] Rules block in `firestore.rules` using existing helper predicates.
- [ ] Index entry in `firestore.indexes.json` even if not queried cross-village today.
- [ ] Service vitest + rules e2e test.
- [ ] PR description notes the deploy needed.

## Don't

- **Don't ship the service without updating `_services-map.md`.** Stale map = blind future sessions.
- **Don't put a cross-user write in the service.** Wrong layer. Use a callable. See `guardrail-enforcement`.
- **Don't add a top-level collection when village-scoped works.** Top-level paths bloat the rules file and the security surface.
- **Don't redefine identity check predicates in the rules block.** Use the existing helpers.
- **Don't ship rules + indexes without flagging the deploy** — they don't auto-propagate from the merge.

## When this skill applies

- A user asks to "add a <thing> collection", "model <entity>", or "track <thing> per village".
- A feature spec mentions a new entity that doesn't have a service today.
- A code review flags a query that can't be expressed against existing collections.

## Companion skills

- `touch-service` — once the service file exists, every change to it follows that procedure.
- `firestore-deploy` — for actually pushing the rules + indexes to dev.
- `guardrail-enforcement` — for any write that needs to live in a Cloud Function rather than the client service.
- `denormalized-read-model` — if the new collection holds copies of fields owned elsewhere.
