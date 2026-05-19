import { describe, expect, it } from 'vitest';

// This test doesn't compile Tailwind — it just verifies the design-system
// shim is reachable from the web workspace, which is the actual integration
// risk. Visual verification of the classes (`bg-surface`, `shadow-sm`) is
// done in the dev server.
import {
  colors,
  elevation,
  iconSizes,
} from '@cultuvilla/shared/design-system';

describe('design-system reachable from apps/web', () => {
  it('colors.light.bg.surface is white', () => {
    expect(colors.light.bg.surface).toBe('#ffffff');
  });

  it('colors.light.fg.primary is the dark text color', () => {
    expect(colors.light.fg.primary).toBe('#0f172a');
  });

  it('elevation.sm.web is a CSS shadow string', () => {
    expect(elevation.sm.web).toContain('rgba(0, 0, 0, 0.06)');
  });

  it('iconSizes.md is 20', () => {
    expect(iconSizes.md).toBe(20);
  });
});
