// Firestore Rules e2e test for /villages/{villageId}.
// Verifies: anyone can read; only app admins can create.
//
// Uses @firebase/rules-unit-testing to mount the live firestore.rules file
// against the firestore emulator and execute requests under different auth
// contexts.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let env: RulesTestEnvironment;

beforeAll(async () => {
  const rules = readFileSync(resolve(__dirname, '../../../../firestore.rules'), 'utf8');
  env = await initializeTestEnvironment({
    projectId: process.env.TEST_PROJECT_ID || 'cultuvilla-rules-test',
    firestore: { rules },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe('firestore.rules — /villages/{villageId}', () => {
  it('anyone can read a village', async () => {
    // Seed a village bypassing rules.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'villages/v1'), { name: 'Salamanca' });
    });

    const anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(anon, 'villages/v1')));
  });

  it('non-admin cannot create a village', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(alice, 'villages/v1'), { name: 'Nope' }));
  });

  it('app admin can create a village', async () => {
    // Seed admins/{uid} bypassing rules so isAppAdmin() resolves true.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admins/admin-1'), { createdAt: new Date() });
    });

    const admin = env.authenticatedContext('admin-1').firestore();
    await assertSucceeds(setDoc(doc(admin, 'villages/v1'), { name: 'Salamanca' }));
  });
});
