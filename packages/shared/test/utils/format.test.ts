import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice } from '../../src/utils/format';

describe('formatDate', () => {
  const d = new Date('2026-05-19T15:30:00.000Z');

  it('formats short (numeric date)', () => {
    expect(formatDate(d, 'short')).toMatch(/19\/05\/2026|19\/5\/2026/);
  });

  it('formats long (with weekday + month name)', () => {
    const out = formatDate(d, 'long');
    expect(out).toMatch(/martes/i);
    expect(out).toMatch(/mayo/i);
    expect(out).toMatch(/2026/);
  });

  it('formats time-only', () => {
    // Output depends on the host TZ; assert the shape, not the wall clock.
    expect(formatDate(d, 'time')).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats datetime (date + time)', () => {
    expect(formatDate(d, 'datetime')).toMatch(/2026/);
    expect(formatDate(d, 'datetime')).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatPrice', () => {
  it('formats EUR by default with the Spanish thousands separator', () => {
    expect(formatPrice(1234.5)).toMatch(/1\.234,50/);
    expect(formatPrice(1234.5)).toMatch(/€/);
  });

  it('treats zero as a real value, not a missing one', () => {
    expect(formatPrice(0)).toMatch(/0,00/);
  });

  it('honors a custom currency', () => {
    expect(formatPrice(10, 'USD')).toMatch(/10,00/);
  });
});
