/**
 * Border-radius scale (in px). `full` is a sentinel that resolves to a
 * pill shape — Tailwind uses 9999, RN uses the same.
 */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radii;
