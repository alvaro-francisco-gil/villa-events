/**
 * Spacing scale (in px). 4-based, with the same numeric keys Tailwind uses
 * (1=4px, 2=8px, …), restricted to the subset we actually want. Use these
 * via Tailwind utilities (`p-4`, `gap-2`) in JSX, and via `spacing[N]` when
 * you need a raw pixel value (e.g. RN StyleSheet, computed inline styles).
 *
 * Do not extend this scale ad-hoc. If a screen really needs `5` or `7`,
 * that's a design conversation, not a token addition.
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
