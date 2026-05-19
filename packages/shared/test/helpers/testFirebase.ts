// Dedicated Firebase client app for integration tests.
// Distinct from packages/shared/src/firebase so the production app stays
// untouched. The emulator host env vars must be set before this file runs
// (handled by test/setup/integration.setup.ts).

import { initializeApp, getApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';

const APP_NAME = 'cultuvilla-test';

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

function parseHostPort(env: string | undefined, fallback: { host: string; port: number }): { host: string; port: number } {
  if (!env) return fallback;
  const [host, portStr] = env.split(':');
  const port = Number(portStr);
  return Number.isFinite(port) ? { host, port } : fallback;
}

export function getTestApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const projectId = process.env.TEST_PROJECT_ID || 'cultuvilla-test';
  cachedApp = getApps().find((a) => a.name === APP_NAME)
    ?? initializeApp({ projectId, apiKey: 'fake-api-key' }, APP_NAME);
  return cachedApp;
}

export function getTestDb(): Firestore {
  if (cachedDb) return cachedDb;
  const { host, port } = parseHostPort(process.env.FIRESTORE_EMULATOR_HOST, {
    host: '127.0.0.1',
    port: 8080,
  });
  cachedDb = getFirestore(getTestApp());
  connectFirestoreEmulator(cachedDb, host, port);
  return cachedDb;
}

export function getTestAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const { host, port } = parseHostPort(process.env.FIREBASE_AUTH_EMULATOR_HOST, {
    host: '127.0.0.1',
    port: 9099,
  });
  cachedAuth = getAuth(getTestApp());
  connectAuthEmulator(cachedAuth, `http://${host}:${port}`, { disableWarnings: true });
  return cachedAuth;
}

export async function teardownTestApp(): Promise<void> {
  const apps = getApps().filter((a) => a.name === APP_NAME);
  await Promise.all(apps.map((a) => deleteApp(a)));
  cachedApp = null;
  cachedDb = null;
  cachedAuth = null;
}

export { getApp };
