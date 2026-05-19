import { describe, expect, it } from 'vitest';
import { radii, type RadiusKey } from '../../src/design-system/tokens/radii';

describe('radii tokens', () => {
  it('exposes none, sm, md, lg, xl, full', () => {
    expect(radii).toEqual({
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    });
  });

  it('RadiusKey union accepts known keys', () => {
    const k: RadiusKey = 'md';
    expect(radii[k]).toBe(8);
  });
});
