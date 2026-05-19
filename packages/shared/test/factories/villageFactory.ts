// Test data builders for villages. Pure factory: returns a VillageData object;
// persisting it to the emulator is the test's responsibility.

import { GeoPoint } from 'firebase/firestore';
import { buildVillageData, type VillageData } from '../../src/models/village/VillageDataModel';

let counter = 0;
const nextId = () => ++counter;

export function makeVillage(overrides: Partial<Parameters<typeof buildVillageData>[0]> = {}): VillageData {
  const n = nextId();
  return buildVillageData({
    name: `Test Village ${n}`,
    description: `Generated village #${n} for tests`,
    country: 'ES',
    comunidadAutonoma: 'Castilla y León',
    provincia: 'Salamanca',
    coordinates: new GeoPoint(40.9, -5.7),
    barrios: [],
    images: [],
    adminUserId: 'test-admin',
    ...overrides,
  });
}
