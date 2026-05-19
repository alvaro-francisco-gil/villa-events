import { describe, expect, it } from 'vitest';
import { zIndex, type ZIndexKey } from '../../src/design-system/tokens/zIndex';

describe('z-index tokens', () => {
  it('exposes the named layers in ascending order', () => {
    const entries = Object.entries(zIndex);
    const sorted = [...entries].sort(([, a], [, b]) => a - b);
    expect(entries).toEqual(sorted);
  });

  it('includes base, dropdown, sticky, sheet, modal, toast', () => {
    expect(Object.keys(zIndex).sort()).toEqual(
      ['base', 'dropdown', 'modal', 'sheet', 'sticky', 'toast'].sort(),
    );
  });

  it('toast sits on top', () => {
    const values = Object.values(zIndex);
    expect(zIndex.toast).toBe(Math.max(...values));
  });

  it('ZIndexKey accepts known keys', () => {
    const k: ZIndexKey = 'modal';
    expect(zIndex[k]).toBeGreaterThan(zIndex.sheet);
  });
});
