// Integration test: write a municipality to the Firestore emulator and read
// it back. Demonstrates the integration test pattern — emulator-backed,
// factory-built, emulator-reset between tests.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getTestDb, teardownTestApp } from '../helpers/testFirebase';
import { resetEmulators } from '../helpers/firebaseEmulator';
import { makeMunicipality, makeActiveCommunity } from '../factories/villageFactory';

describe('municipality roundtrip (emulator)', () => {
  beforeEach(async () => {
    await resetEmulators();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('persists a municipality and reads the same data back', async () => {
    const db = getTestDb();
    const municipality = makeMunicipality({ name: 'Roundtrip Municipality' });
    const ref = await addDoc(collection(db, 'municipalities'), municipality);

    const snap = await getDoc(doc(db, 'municipalities', ref.id));
    expect(snap.exists()).toBe(true);
    const data = snap.data();
    expect(data?.name).toBe('Roundtrip Municipality');
    expect(data?.province).toBe('Salamanca');
    expect(data?.communityActive).toBe(false);
    expect(data?.community).toBeNull();
  });

  it('persists a municipality with an active community', async () => {
    const db = getTestDb();
    const municipality = makeActiveCommunity({ name: 'Active Community' });
    const ref = await addDoc(collection(db, 'municipalities'), municipality);

    const snap = await getDoc(doc(db, 'municipalities', ref.id));
    const data = snap.data();
    expect(data?.communityActive).toBe(true);
    expect(data?.community?.adminUserId).toBe('test-admin');
  });
});
