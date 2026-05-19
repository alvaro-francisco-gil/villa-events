/**
 * Named z-index layers. Reach for a name, never a number. Modal sits
 * above sheet because a modal can open from inside a sheet; toast sits
 * above modal because a "saved" toast should show even with a confirm
 * dialog open.
 */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  sheet: 300,
  modal: 400,
  toast: 500,
} as const;

export type ZIndexKey = keyof typeof zIndex;
