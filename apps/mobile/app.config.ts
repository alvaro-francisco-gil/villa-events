import type { ExpoConfig } from 'expo/config';
import type { FirebaseOptions } from 'firebase/app';

type Env = 'dev' | 'beta' | 'prod';

function resolveEnv(): Env {
  const raw = process.env.APP_ENV;
  if (raw === 'dev' || raw === 'beta' || raw === 'prod') return raw;
  return 'dev';
}

const env = resolveEnv();

const namePerEnv: Record<Env, string> = {
  dev: 'Cultuvilla (Dev)',
  beta: 'Cultuvilla (Beta)',
  prod: 'Cultuvilla',
};

const bundleIdPerEnv: Record<Env, string> = {
  dev: 'com.cultuvilla.app.dev',
  beta: 'com.cultuvilla.app.beta',
  prod: 'com.cultuvilla.app',
};

// Firebase config is injected per-environment from .env (or EAS secrets).
// DO NOT commit real keys — use a local .env file (gitignored) with these vars:
//   FIREBASE_API_KEY_DEV, FIREBASE_AUTH_DOMAIN_DEV, FIREBASE_PROJECT_ID_DEV,
//   FIREBASE_STORAGE_BUCKET_DEV, FIREBASE_MESSAGING_SENDER_ID_DEV, FIREBASE_APP_ID_DEV,
//   (same suffixes for _BETA and _PROD)
const firebaseConfigPerEnv: Record<Env, FirebaseOptions> = {
  dev: {
    apiKey: process.env['FIREBASE_API_KEY_DEV'] ?? '',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN_DEV'] ?? '',
    projectId: process.env['FIREBASE_PROJECT_ID_DEV'] ?? '',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET_DEV'] ?? '',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID_DEV'] ?? '',
    appId: process.env['FIREBASE_APP_ID_DEV'] ?? '',
  },
  beta: {
    apiKey: process.env['FIREBASE_API_KEY_BETA'] ?? '',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN_BETA'] ?? '',
    projectId: process.env['FIREBASE_PROJECT_ID_BETA'] ?? '',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET_BETA'] ?? '',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID_BETA'] ?? '',
    appId: process.env['FIREBASE_APP_ID_BETA'] ?? '',
  },
  prod: {
    apiKey: process.env['FIREBASE_API_KEY_PROD'] ?? '',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN_PROD'] ?? '',
    projectId: process.env['FIREBASE_PROJECT_ID_PROD'] ?? '',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET_PROD'] ?? '',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID_PROD'] ?? '',
    appId: process.env['FIREBASE_APP_ID_PROD'] ?? '',
  },
};

const config: ExpoConfig = {
  name: namePerEnv[env],
  slug: 'cultuvilla',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'cultuvilla',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: bundleIdPerEnv[env],
    supportsTablet: true,
  },
  android: {
    package: bundleIdPerEnv[env],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  extra: {
    APP_ENV: env,
    firebaseConfig: firebaseConfigPerEnv[env],
    eas: {
      projectId: process.env['EAS_PROJECT_ID'] ?? '',
    },
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
