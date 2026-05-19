// Smoke test: verifies vitest is wired up in the functions package.
// Replace once functions are exercised via firebase-functions-test or the
// emulator (see functions/src/__tests__/README.md).
import { describe, it, expect } from 'vitest';

describe('functions test runner', () => {
  it('is alive', () => {
    expect(1 + 1).toBe(2);
  });
});
