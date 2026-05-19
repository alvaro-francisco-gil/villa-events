import { describe, expect, it } from 'vitest';
import { spacing, type SpacingKey } from '../../src/design-system/tokens/spacing';

// The spacing scale must match Tailwind's default numeric keys for the
// subset we actually use (4-based). This keeps `p-4` in JSX and
// `spacing[4]` in TypeScript pointing at the same pixel value.

describe('spacing tokens', () => {
  it('exposes a 4-based scale: 0, 1, 2, 3, 4, 6, 8, 12, 16', () => {
    expect(spacing).toEqual({
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      6: 24,
      8: 32,
      12: 48,
      16: 64,
    });
  });

  it('SpacingKey is the union of available keys', () => {
    const k: SpacingKey = 4;
    expect(spacing[k]).toBe(16);
  });
});
