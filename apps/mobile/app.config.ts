import type { ExpoConfig } from 'expo/config';

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
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
