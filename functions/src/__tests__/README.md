# Cloud Functions tests

Two recommended approaches as functions grow:

## 1. Pure-helper unit tests (fast, no emulator)

Extract pure logic out of Cloud Function bodies into small helper modules
(e.g. `functions/src/helpers/validateProfileForm.ts`) and unit-test it
directly. No `firebase-admin` init, no emulator. This is the cheapest test
and should be the first thing you reach for.

```ts
import { describe, it, expect } from 'vitest';
import { validateProfileFormTransition } from '../helpers/validateProfileForm';

describe('validateProfileFormTransition', () => {
  it('rejects duplicate keys', () => {
    expect(() => validateProfileFormTransition([], [
      { source: 'predefined', key: 'barrio', required: true },
      { source: 'predefined', key: 'barrio', required: false },
    ], {})).toThrow(/duplicada/);
  });
});
```

## 2. Emulator-backed function invocation (heavier, runs the real handler)

Use `firebase-functions-test` to invoke a callable / trigger handler with
the Firestore + Auth emulators running. Wire it through the root
orchestrator so the emulator suite is started for you:

```bash
pnpm test:functions   # starts emulators, then runs vitest in functions/
```

A typical setup file at `functions/src/__tests__/setup.ts` would:
- set `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST`
- initialize `firebase-admin` against the emulator
- import the function under test

Bring in `firebase-functions-test` as a devDependency when you write the
first real handler test.

## File layout

```
functions/src/__tests__/
├── smoke.test.ts                       (placeholder — replace)
├── helpers/                            (pure-helper tests, no emulator)
└── handlers/                           (emulator-backed handler tests)
```
