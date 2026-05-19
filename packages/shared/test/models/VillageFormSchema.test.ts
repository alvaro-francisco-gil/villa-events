import { describe, it, expect } from 'vitest';
import { VillageFormSchema } from '../../src/models/village/VillageFormSchema';

const validBase = {
  name: 'Becerril',
  description: 'Pueblo de la sierra',
  country: 'España',
  comunidadAutonoma: 'Madrid' as const,
  provincia: 'Madrid',
  location: { lat: 40.7, lng: -3.9, displayName: 'Madrid' },
  barrios: [],
  images: [],
  adminUserId: 'user-1',
};

describe('VillageFormSchema', () => {
  it('parses a valid input', () => {
    const result = VillageFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe('Becerril');
    expect(result.data.barrios).toEqual([]);
    expect(result.data.images).toEqual([]);
  });

  it('rejects an empty name', () => {
    const result = VillageFormSchema.safeParse({ ...validBase, name: '   ' });
    expect(result.success).toBe(false);
    if (result.success) return;
    const err = result.error.issues.find((i) => i.path[0] === 'name');
    expect(err?.message).toBe('El nombre es obligatorio');
  });

  it('rejects an empty description', () => {
    const result = VillageFormSchema.safeParse({ ...validBase, description: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown comunidad autónoma', () => {
    const result = VillageFormSchema.safeParse({ ...validBase, comunidadAutonoma: 'Asgard' });
    expect(result.success).toBe(false);
  });

  it('rejects a provincia that does not belong to its comunidad', () => {
    const result = VillageFormSchema.safeParse({
      ...validBase,
      comunidadAutonoma: 'Madrid',
      provincia: 'Sevilla',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const err = result.error.issues.find((i) => i.path[0] === 'provincia');
    expect(err).toBeDefined();
  });

  it('accepts a valid provincia for its comunidad', () => {
    const result = VillageFormSchema.safeParse({
      ...validBase,
      comunidadAutonoma: 'Andalucía',
      provincia: 'Sevilla',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a null location', () => {
    const result = VillageFormSchema.safeParse({ ...validBase, location: null });
    expect(result.success).toBe(false);
    if (result.success) return;
    const err = result.error.issues.find((i) => i.path[0] === 'location');
    expect(err?.message).toBe('Selecciona la ubicación');
  });

  it('rejects an empty adminUserId', () => {
    const result = VillageFormSchema.safeParse({ ...validBase, adminUserId: '' });
    expect(result.success).toBe(false);
    if (result.success) return;
    const err = result.error.issues.find((i) => i.path[0] === 'adminUserId');
    expect(err?.message).toBe('Selecciona el administrador');
  });
});
