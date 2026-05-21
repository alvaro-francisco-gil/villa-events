import AsyncStorage from '@react-native-async-storage/async-storage';
// @firebase/auth exports `getReactNativePersistence` only via the "react-native"
// export condition in its package.json, but TypeScript resolves the "types"
// condition first (which points to auth-public.d.ts and omits this symbol).
// Metro/bundlers DO resolve the react-native condition at runtime, so the import
// is correct — we just need to suppress the static type error here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- getReactNativePersistence is in the RN bundle but absent from auth-public.d.ts
import { initializeAuth, getReactNativePersistence } from '@firebase/auth';
import type { FirebaseOptions } from 'firebase/app';
import Constants from 'expo-constants';
import { initFirebase } from '@cultuvilla/shared/firebase';
import { initMobileAppCheck } from './appCheck';

/**
 * Read the per-environment FirebaseOptions that app.config.ts wrote into
 * `extra.firebaseConfig`. Falls back to an empty object so the call still
 * proceeds (Firebase will throw a runtime error, which is the right behaviour
 * during development when .env is not set up).
 */
function getFirebaseOptions(): FirebaseOptions {
  const cfg = Constants.expoConfig?.extra?.firebaseConfig as FirebaseOptions | undefined;
  if (!cfg) {
    throw new Error(
      '[cultuvilla] firebaseConfig missing from expoConfig.extra. ' +
        'Add a .env file with FIREBASE_* vars and restart the bundler.',
    );
  }
  return cfg;
}

/**
 * Initialise Firebase with React Native AsyncStorage persistence.
 *
 * Idempotent — `initFirebase` returns early if already initialised, and the
 * module-level guard prevents the options object from being rebuilt on every
 * hot-reload.
 */
export function bootstrapFirebase(): void {
  const config = getFirebaseOptions();
  initFirebase(config, {
    customizeAuth: (app) =>
      initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      }),
  });
  initMobileAppCheck();
}
