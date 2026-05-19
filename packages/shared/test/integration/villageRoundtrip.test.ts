// Integration test: write a village to the Firestore emulator and read it back.
// Demonstrates the integration test pattern — emulator-backed, factory-built,
// emulator-reset between tests.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getTestDb, teardownTestApp } from '../helpers/testFirebase';
import { resetEmulators } from '../helpers/firebaseEmulator';
import { makeVillage } from '../factories/villageFactory';

describe('village roundtrip (emulator)', () => {
  beforeEach(async () => {
    await resetEmulators();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('persists a village and reads the same data back', async () => {
    const db = getTestDb();
    const village = makeVillage({ name: 'Roundtrip Village' });
    const ref = await addDoc(collection(db, 'villages'), village);

    const snap = await getDoc(doc(db, 'villages', ref.id));
    expect(snap.exists()).toBe(true);
    const data = snap.data();
    expect(data?.name).toBe('Roundtrip Village');
    expect(data?.country).toBe('ES');
    expect(data?.adminUserId).toBe('test-admin');
  });
});
