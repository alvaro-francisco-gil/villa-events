// Reset helpers for the Firebase Emulator Suite.
// Uses the emulator REST endpoints so tests start from a known-empty state.

function getProjectId(): string {
  return process.env.TEST_PROJECT_ID || process.env.GCLOUD_PROJECT || 'cultuvilla-test';
}

function getFirestoreEmulatorUrl(): string {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) throw new Error('[firebaseEmulator] FIRESTORE_EMULATOR_HOST not set');
  return `http://${host}`;
}

function getAuthEmulatorUrl(): string {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!host) throw new Error('[firebaseEmulator] FIREBASE_AUTH_EMULATOR_HOST not set');
  return `http://${host}`;
}

async function httpDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => '');
    throw new Error(`DELETE ${url} failed: ${res.status} ${res.statusText} ${body}`);
  }
}

export async function clearFirestore(): Promise<void> {
  const url = `${getFirestoreEmulatorUrl()}/emulator/v1/projects/${getProjectId()}/databases/(default)/documents`;
  await httpDelete(url);
}

export async function clearAuthAccounts(): Promise<void> {
  const url = `${getAuthEmulatorUrl()}/emulator/v1/projects/${getProjectId()}/accounts`;
  await httpDelete(url);
}

export async function resetEmulators(): Promise<void> {
  await Promise.all([clearFirestore(), clearAuthAccounts()]);
}
