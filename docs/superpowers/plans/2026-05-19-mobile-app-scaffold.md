# Mobile App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `apps/mobile/` as an Expo SDK 53 / Expo Router v4 / NativeWind v4 app that reuses `@cultuvilla/shared` (services, models, tokens, formatters) and `@cultuvilla/i18n` to ship the v1 read-flows on iOS + Android: feed, event detail, auth, villages list, village home, censo, profile, register-to-event.

**Architecture:** Expo managed workflow. Routes live under `apps/mobile/app/` with Expo Router file-based routing. Firebase init reuses the config-injected `initFirebase()` from `@cultuvilla/shared` with `customizeAuth` registering `getReactNativePersistence(AsyncStorage)`. Mobile primitives in `apps/mobile/components/primitives/` mirror the web primitives' prop API and consume shared design tokens through NativeWind v4. The i18n catalog from `@cultuvilla/i18n` is loaded through a thin custom adapter (not next-intl, which is web-only). Image uploads convert `expo-image-picker` URIs to Blobs and call the existing platform-agnostic `imageService`. Three EAS Build profiles (dev/beta/prod) match the existing Firebase env split.

**Tech Stack:** Expo SDK 53 (managed), Expo Router v4, React Native 0.79, TypeScript 5.8, NativeWind v4, Tailwind CSS v3 (NativeWind's required peer), Firebase JS SDK v11, `@react-native-async-storage/async-storage`, Jest + `@testing-library/react-native`, EAS Build, pnpm workspaces.

**Scope boundary:** v1 ships read flows + censo + register. Out of scope: organization admin, event creation, persona management UIs, push notifications, offline mode, family tree, dark mode toggle. The plan creates `apps/mobile/` but does NOT migrate any existing user.

**Prerequisite:** The [Design System Foundations plan](./2026-05-19-design-system-foundations.md) MUST be merged to `main` before Task 0.1. This plan consumes its outputs (shared tokens, web primitive prop APIs, `@cultuvilla/i18n` workspace, locale formatters). If foundations is not yet merged, stop and execute it first.

---

## Pre-flight (one-time, executor reads this before Task 0.1)

The executor MUST work in an isolated worktree. Use `superpowers:using-git-worktrees` (the native `EnterWorktree` tool, if available) to create one named `mobile-app-scaffold` branched off the latest `main`. Confirm:

```bash
git fetch origin
git log --oneline main..origin/main      # expected: empty (main is current)
ls packages/i18n                          # expected: exists (foundations landed)
ls packages/shared/src/design-system      # expected: tokens/ + index.ts
ls apps/web/components/primitives          # expected: 8 primitive components
pnpm install
pnpm check                                 # expected: exit 0
```

If `packages/i18n` or `packages/shared/src/design-system` are missing, **stop** — foundations has not landed.

Conventional commit prefixes (commitlint enforced): `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`. Header ≤ 100 chars.

Companion design spec: [docs/superpowers/specs/2026-05-19-mobile-app-scaffold-design.md](../specs/2026-05-19-mobile-app-scaffold-design.md). Decisions captured there are not re-litigated here; this plan executes them.

---

## File structure (what this plan produces)

```
apps/mobile/
├── app/
│   ├── _layout.tsx                 Root: providers (Auth, i18n, theme)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx               Feed
│   │   ├── villages.tsx            Villages list
│   │   └── profile.tsx             Profile + my villages
│   ├── event/
│   │   └── [eventId].tsx           Event detail + register
│   └── village/
│       └── [villageId]/
│           ├── index.tsx           Village home
│           └── censo.tsx           Fill / edit censo
├── components/
│   ├── primitives/
│   │   ├── Screen.tsx
│   │   ├── HStack.tsx
│   │   ├── VStack.tsx
│   │   ├── Text.tsx
│   │   ├── Pressable.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── __tests__/              Component tests
│   │   └── index.ts                Barrel
│   └── feature/
│       ├── EventCard.tsx
│       ├── RegisterButton.tsx
│       ├── VillageCard.tsx
│       └── CensoForm.tsx
├── lib/
│   ├── firebaseInit.ts             initFirebase(getFirebaseConfig(env), { customizeAuth })
│   ├── env.ts                      Reads APP_ENV from expo-constants
│   ├── i18n.ts                     Thin loader over @cultuvilla/i18n
│   ├── auth/
│   │   ├── AuthContext.tsx
│   │   ├── useAuth.ts
│   │   └── __tests__/
│   ├── appCheck.ts                 Per-env App Check init
│   └── images.ts                   uriToBlob() helper
├── assets/
│   ├── assets.ts                   Typed require() registry
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── test/
│   ├── setup.ts                    @testing-library/jest-native + jest-expo preset
│   └── helpers.tsx                 renderWithProviders()
├── app.config.ts                   Expo dynamic config (env-driven)
├── babel.config.js
├── metro.config.js                 Monorepo + NativeWind transformer
├── tailwind.config.ts              Consumes @cultuvilla/shared/design-system tokens
├── global.css                      Tailwind directives
├── eas.json                        dev/beta/prod profiles
├── jest.config.js
├── tsconfig.json                   extends shared base
├── package.json
└── README.md

.github/workflows/
└── mobile-ci.yml                   Typecheck + test on PR; manual EAS build dispatch
```

---

## Phase 0: Worktree, Expo init, baseline boot

The goal of Phase 0 is a fresh Expo SDK 53 app booting locally with TypeScript and the repo's pnpm workspace recognizing it. No Firebase, no styling, no routing customizations yet — just `npx expo start` rendering "Hello World" from `apps/mobile/`.

### Task 0.1: Create the worktree

- [ ] **Step 1: Create the worktree (native tool preferred)**

If the `EnterWorktree` tool is available:

```
EnterWorktree({ name: "mobile-app-scaffold", baseBranch: "main" })
```

Otherwise fall back to git:

```bash
git fetch origin
git worktree add -b mobile-app-scaffold ../mobile-app-scaffold origin/main
cd ../mobile-app-scaffold
pnpm install
```

- [ ] **Step 2: Verify baseline check passes**

```bash
pnpm check
```

Expected: exit 0. If it fails, stop and report — do not try to fix pre-existing breakage inside this plan.

### Task 0.2: Initialize Expo SDK 53 app in `apps/mobile/`

**Files:**
- Create: `apps/mobile/` directory tree from `create-expo-app`

- [ ] **Step 1: Run the Expo CLI scaffolder**

From the repo root:

```bash
pnpm dlx create-expo-app@latest apps/mobile --template blank-typescript --no-install
```

Expected: `apps/mobile/` created with `App.tsx`, `package.json`, `app.json`, `tsconfig.json`, `index.ts`, `assets/`. The `--no-install` flag prevents an auto-install (we install at the workspace root after wiring).

- [ ] **Step 2: Pin Expo SDK + RN versions**

Open `apps/mobile/package.json` and confirm `"expo": "~53.0.0"` and `"react-native": "0.79.x"`. If the template installed a different version, change them to match SDK 53. Run `npx expo install --check` later in Task 1.1 to align all expo-* deps.

- [ ] **Step 3: Rename package**

In `apps/mobile/package.json`, set:

```json
{
  "name": "cultuvilla-mobile",
  "version": "0.1.0",
  "private": true
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile
git commit -m "chore(mobile): scaffold Expo SDK 53 app with TypeScript template"
```

### Task 0.3: Strip the template `App.tsx` to a minimal screen

**Files:**
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Replace `App.tsx` with a minimal screen**

```tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>cultuvilla mobile — bootstrap OK</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/App.tsx
git commit -m "chore(mobile): strip template App.tsx to bootstrap stub"
```

---

## Phase 1: Monorepo integration (pnpm + Metro + tsconfig)

Expo + Metro need explicit configuration to resolve symlinked workspace packages (`@cultuvilla/shared`, `@cultuvilla/i18n`). The defaults assume a single-package repo.

### Task 1.1: Add to the pnpm workspace

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `apps/mobile/package.json` (workspace deps)

- [ ] **Step 1: Confirm workspace includes `apps/*`**

```bash
cat pnpm-workspace.yaml
```

If `apps/*` is already in the `packages:` list, no change needed. Otherwise add it.

- [ ] **Step 2: Add shared workspace deps to mobile**

Edit `apps/mobile/package.json`. Add to `dependencies` (alphabetical):

```json
"@cultuvilla/i18n": "workspace:*",
"@cultuvilla/shared": "workspace:*"
```

- [ ] **Step 3: Install**

```bash
pnpm install
```

Expected: pnpm links the workspace packages into `apps/mobile/node_modules/@cultuvilla/`.

- [ ] **Step 4: Verify**

```bash
ls apps/mobile/node_modules/@cultuvilla
```

Expected: `i18n` and `shared` symlinks.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): add @cultuvilla/shared and @cultuvilla/i18n workspace deps"
```

### Task 1.2: Configure Metro for the monorepo

**Files:**
- Create: `apps/mobile/metro.config.js`

- [ ] **Step 1: Install Metro config helper**

```bash
pnpm --filter cultuvilla-mobile add -D metro-config
```

- [ ] **Step 2: Write `metro.config.js`**

`apps/mobile/metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so changes in packages/ trigger reloads
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve modules from the app's node_modules AND the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Disable hierarchical lookup (pnpm's flat node_modules layout breaks it)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

- [ ] **Step 3: Smoke test — Metro starts and resolves shared**

In one terminal:

```bash
pnpm --filter cultuvilla-mobile exec expo start --clear
```

Expected: Metro starts on `:8081`, prints QR code. Leave it running.

In another terminal, temporarily import shared to prove resolution works. Edit `apps/mobile/App.tsx`:

```tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '@cultuvilla/shared/design-system';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>cultuvilla mobile — spacing.md = {spacing.md}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
```

Reload the app (press `r` in Metro). Expected: renders the spacing token value.

- [ ] **Step 4: Revert the smoke-test import**

Restore `App.tsx` to the bootstrap stub from Task 0.3 (no shared import yet — we'll re-add it in Phase 4 with NativeWind).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/metro.config.js apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): configure Metro for pnpm monorepo workspace resolution"
```

### Task 1.3: TypeScript config extending the repo base

**Files:**
- Modify: `apps/mobile/tsconfig.json`

- [ ] **Step 1: Inspect the root tsconfig**

```bash
cat tsconfig.base.json 2>/dev/null || cat tsconfig.json
```

Note the strictness flags. Mobile must match (no `any`, `strict: true`).

- [ ] **Step 2: Replace the template tsconfig**

`apps/mobile/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
pnpm --filter cultuvilla-mobile exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Add `typecheck` script**

In `apps/mobile/package.json`, add to `scripts`:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Wire root**

In root `package.json`, add to `scripts` (after `shared:typecheck` or equivalent):

```json
"mobile:typecheck": "pnpm --filter cultuvilla-mobile typecheck"
```

And include it in the root `typecheck` aggregate.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/tsconfig.json apps/mobile/package.json package.json
git commit -m "chore(mobile): strict tsconfig + wire pnpm mobile:typecheck"
```

---

## Phase 2: Env config via expo-constants + EAS profiles

The mobile app reuses `getFirebaseConfig(env)` from `packages/shared/src/config/environments.ts`. The `env` value (`'dev' | 'beta' | 'prod'`) is selected at build time via the EAS build profile and surfaced at runtime through `expo-constants.expoConfig.extra.APP_ENV`.

### Task 2.1: Convert `app.json` to `app.config.ts`

**Files:**
- Delete: `apps/mobile/app.json` (template default)
- Create: `apps/mobile/app.config.ts`

- [ ] **Step 1: Inspect what the template wrote**

```bash
cat apps/mobile/app.json
```

Note the existing `name`, `slug`, `scheme`, `icon`, `splash` fields — we preserve them and add dynamic `extra` from env.

- [ ] **Step 2: Write `app.config.ts`**

`apps/mobile/app.config.ts`:

```ts
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
    image: './assets/splash.png',
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
```

- [ ] **Step 3: Delete the JSON config**

```bash
rm apps/mobile/app.json
```

- [ ] **Step 4: Verify Expo reads the TS config**

```bash
pnpm --filter cultuvilla-mobile exec expo config --type public
```

Expected: prints resolved config including `extra.APP_ENV: 'dev'`. No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app.config.ts apps/mobile/app.json
git commit -m "chore(mobile): convert app.json to env-driven app.config.ts"
```

### Task 2.2: `lib/env.ts` to read APP_ENV at runtime

**Files:**
- Create: `apps/mobile/lib/env.ts`
- Create: `apps/mobile/lib/__tests__/env.test.ts`

- [ ] **Step 1: Write the test first**

`apps/mobile/lib/__tests__/env.test.ts`:

```ts
import { describe, expect, it, jest } from '@jest/globals';

describe('getAppEnv', () => {
  it('returns the APP_ENV from expoConfig.extra', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: { APP_ENV: 'beta' } } },
    }));
    const { getAppEnv } = require('../env');
    expect(getAppEnv()).toBe('beta');
  });

  it('falls back to dev if APP_ENV is missing', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: {} } },
    }));
    const { getAppEnv } = require('../env');
    expect(getAppEnv()).toBe('dev');
  });

  it('throws on unrecognised values', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: { APP_ENV: 'staging' } } },
    }));
    const { getAppEnv } = require('../env');
    expect(() => getAppEnv()).toThrow(/Unknown APP_ENV/);
  });
});
```

(Jest infra arrives in Task 5.1; this test will be runnable then. It's written now so the implementation has a target.)

- [ ] **Step 2: Implementation**

`apps/mobile/lib/env.ts`:

```ts
import Constants from 'expo-constants';

export type AppEnv = 'dev' | 'beta' | 'prod';

export function getAppEnv(): AppEnv {
  const raw = Constants.expoConfig?.extra?.APP_ENV;
  if (raw === undefined) return 'dev';
  if (raw === 'dev' || raw === 'beta' || raw === 'prod') return raw;
  throw new Error(`Unknown APP_ENV: ${String(raw)}`);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/env.ts apps/mobile/lib/__tests__/env.test.ts
git commit -m "feat(mobile): add getAppEnv() reading APP_ENV from expoConfig"
```

### Task 2.3: `eas.json` with three profiles

**Files:**
- Create: `apps/mobile/eas.json`

- [ ] **Step 1: Write `eas.json`**

`apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 13.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "dev" },
      "ios": { "simulator": true }
    },
    "preview-dev": {
      "distribution": "internal",
      "env": { "APP_ENV": "dev" },
      "channel": "dev"
    },
    "preview-beta": {
      "distribution": "internal",
      "env": { "APP_ENV": "beta" },
      "channel": "beta"
    },
    "production": {
      "env": { "APP_ENV": "prod" },
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 2: Document**

Add to `apps/mobile/README.md` (create if missing):

```markdown
# cultuvilla mobile

Expo SDK 53 React Native app. See [docs/superpowers/specs/2026-05-19-mobile-app-scaffold-design.md](../../docs/superpowers/specs/2026-05-19-mobile-app-scaffold-design.md) for design.

## Local dev

```bash
pnpm --filter cultuvilla-mobile exec expo start
```

## Builds (EAS)

| Profile        | APP_ENV | Distribution | Use |
|---------------|---------|--------------|-----|
| `development` | dev     | internal     | Dev client on simulators / devices |
| `preview-dev` | dev     | internal     | Shareable dev build |
| `preview-beta`| beta    | internal     | Internal beta testing |
| `production`  | prod    | store        | App Store / Play Store |

Trigger: `eas build --profile <name> --platform <ios|android>`
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/eas.json apps/mobile/README.md
git commit -m "chore(mobile): add eas.json with dev/beta/prod build profiles"
```

---

## Phase 3: Firebase init wiring

The mobile app calls the same `initFirebase(config, opts)` from `@cultuvilla/shared/firebase` that web uses. The only mobile-specific piece is `customizeAuth` registering `getReactNativePersistence(AsyncStorage)`.

### Task 3.1: Install Firebase + AsyncStorage

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install deps via Expo (ensures version compat)**

```bash
pnpm --filter cultuvilla-mobile exec expo install firebase @react-native-async-storage/async-storage
```

Expected: pins versions Expo has tested against. `firebase` should land at the same major as `@cultuvilla/shared`'s peer dep (v11.x).

- [ ] **Step 2: Verify peer-dep match**

```bash
node -e "console.log(require('./packages/shared/package.json').peerDependencies.firebase)"
node -e "console.log(require('./apps/mobile/package.json').dependencies.firebase)"
```

If they differ, align — mobile's `firebase` version should satisfy shared's peer-dep range.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): install firebase + async-storage for shared init"
```

### Task 3.2: `lib/firebaseInit.ts`

**Files:**
- Create: `apps/mobile/lib/firebaseInit.ts`

- [ ] **Step 1: Implementation**

`apps/mobile/lib/firebaseInit.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-expect-error -- Firebase doesn't ship types for this entry point publicly,
// but it is the documented RN persistence helper.
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { initFirebase } from '@cultuvilla/shared/firebase';
import { getFirebaseConfig } from '@cultuvilla/shared/config/environments';
import { getAppEnv } from './env';

let initialized = false;

export function initMobileFirebase(): void {
  if (initialized) return;
  const env = getAppEnv();
  initFirebase(getFirebaseConfig(env), {
    customizeAuth: (app) =>
      initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      }),
  });
  initialized = true;
}
```

- [ ] **Step 2: Call it once at app startup**

Edit `apps/mobile/App.tsx` to call `initMobileFirebase()` at module top-level (above the component):

```tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { initMobileFirebase } from './lib/firebaseInit';

initMobileFirebase();

export default function App() {
  return (
    <View style={styles.container}>
      <Text>cultuvilla mobile — firebase initialized</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 3: Smoke test**

Start Metro with the dev env config:

```bash
APP_ENV=dev pnpm --filter cultuvilla-mobile exec expo start --clear
```

Open on a device/simulator. Expected: no red-screen error. The Firebase SDK silently initializes; the screen renders the text.

- [ ] **Step 4: Verify Firestore reachable**

Temporarily edit `App.tsx` to import a service and call a public read:

```tsx
import { getEventsFeed } from '@cultuvilla/shared/services/eventService';

// inside useEffect in the component:
useEffect(() => {
  getEventsFeed({ limit: 1 })
    .then(events => console.log('feed reachable', events.length))
    .catch(err => console.error('feed error', err));
}, []);
```

Expected: Metro console logs `feed reachable <n>`. If `n === 0` that's still success — connectivity is proven.

- [ ] **Step 5: Revert the smoke probe**

Restore `App.tsx` to the version from Step 2. We'll wire the real feed screen later.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/firebaseInit.ts apps/mobile/App.tsx
git commit -m "feat(mobile): initialize Firebase via shared initFirebase + RN persistence"
```

---

## Phase 4: NativeWind v4 + shared tokens

NativeWind v4 (stable) extends Tailwind for React Native. Use Tailwind v3 here (NativeWind v4's peer dep) — separate from web's Tailwind v4. Both apps consume the same TS token objects from `@cultuvilla/shared/design-system`; only the Tailwind config file format differs between them. When NativeWind v5 (Tailwind v4-aligned) ships GA, web and mobile converge on `@theme` CSS.

### Task 4.1: Install NativeWind + Tailwind v3 peer

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install**

```bash
pnpm --filter cultuvilla-mobile add nativewind@^4.0.0
pnpm --filter cultuvilla-mobile add -D tailwindcss@^3.4.0
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): add NativeWind v4 + Tailwind v3 peer"
```

### Task 4.2: Babel + Metro NativeWind integration

**Files:**
- Create: `apps/mobile/babel.config.js`
- Modify: `apps/mobile/metro.config.js`
- Create: `apps/mobile/global.css`

- [ ] **Step 1: Write `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 2: Wrap Metro config with NativeWind**

Replace `apps/mobile/metro.config.js` with:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 3: Create `global.css`**

`apps/mobile/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/babel.config.js apps/mobile/metro.config.js apps/mobile/global.css
git commit -m "chore(mobile): wire NativeWind v4 babel + metro + global.css"
```

### Task 4.3: `tailwind.config.ts` consuming shared tokens

**Files:**
- Create: `apps/mobile/tailwind.config.ts`

- [ ] **Step 1: Inspect what tokens shared exports**

```bash
cat packages/shared/src/design-system/index.ts
```

Note the exported names (e.g. `spacing`, `colors`, `radii`, `typography`, `elevation`, `zIndex`, `a11y`, `iconSizes`). The mobile config will pass the same objects to Tailwind's theme. If web's `apps/web/tailwind.config.ts` already does this mapping, copy the mapping shape verbatim; do not invent new names.

- [ ] **Step 2: Write `tailwind.config.ts`**

`apps/mobile/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
import {
  spacing,
  colors,
  radii,
  typography,
  elevation,
  zIndex as zTokens,
} from '@cultuvilla/shared/design-system';

const config: Config = {
  content: [
    './App.tsx',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      spacing,
      colors,
      borderRadius: radii,
      fontSize: typography.sizes,
      lineHeight: typography.lineHeights,
      fontWeight: typography.weights,
      boxShadow: elevation,
      zIndex: zTokens,
    },
  },
  plugins: [],
};

export default config;
```

If web's mapping uses slightly different sub-keys (e.g. `typography.size` vs `typography.sizes`), match web exactly — do not diverge.

- [ ] **Step 3: Verify tokens reachable as utilities**

Edit `apps/mobile/App.tsx` temporarily to use a token class:

```tsx
import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { initMobileFirebase } from './lib/firebaseInit';

initMobileFirebase();

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-md">
      <Text className="text-fg text-lg">NativeWind tokens reachable</Text>
      <StatusBar style="auto" />
    </View>
  );
}
```

(Adjust class names — `bg-background`, `p-md`, `text-fg`, `text-lg` — to match what foundations actually exported. Use whatever utility names web's primitives use.)

- [ ] **Step 4: Run Metro and verify rendering**

```bash
APP_ENV=dev pnpm --filter cultuvilla-mobile exec expo start --clear
```

Expected: the screen renders with token-driven spacing, background colour, font size. If classes don't apply, check `babel.config.js` (jsxImportSource) and `metro.config.js` (withNativeWind input path).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/tailwind.config.ts apps/mobile/App.tsx
git commit -m "feat(mobile): tailwind.config.ts consuming shared design tokens"
```

---

## Phase 5: Test infrastructure (Jest + RNTL)

Expo's official test runner is Jest with the `jest-expo` preset. Add `@testing-library/react-native` for component tests.

### Task 5.1: Install Jest + RNTL

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install**

```bash
pnpm --filter cultuvilla-mobile add -D \
  jest \
  jest-expo \
  @types/jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  ts-jest
```

- [ ] **Step 2: Add scripts**

In `apps/mobile/package.json`:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "test(mobile): install jest + RNTL + jest-native"
```

### Task 5.2: `jest.config.js` and test setup

**Files:**
- Create: `apps/mobile/jest.config.js`
- Create: `apps/mobile/test/setup.ts`

- [ ] **Step 1: `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@cultuvilla|nativewind))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['lib/**/*.ts', 'components/**/*.{ts,tsx}'],
};
```

- [ ] **Step 2: `test/setup.ts`**

```ts
import '@testing-library/jest-native/extend-expect';
```

- [ ] **Step 3: Smoke test**

Create `apps/mobile/lib/__tests__/sanity.test.ts`:

```ts
describe('jest', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:

```bash
pnpm --filter cultuvilla-mobile test
```

Expected: 1 test passes.

- [ ] **Step 4: Confirm the env.test from Task 2.2 now runs**

```bash
pnpm --filter cultuvilla-mobile test env
```

Expected: 3 tests pass.

- [ ] **Step 5: Delete the sanity test**

```bash
rm apps/mobile/lib/__tests__/sanity.test.ts
```

- [ ] **Step 6: Wire into root `test`**

In root `package.json`:

```json
"mobile:test": "pnpm --filter cultuvilla-mobile test",
"test": "pnpm shared:test && pnpm web:test && pnpm mobile:test && pnpm functions:test"
```

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/jest.config.js apps/mobile/test/setup.ts package.json
git commit -m "test(mobile): wire jest-expo + RNTL setup and root mobile:test script"
```

---

## Phase 6: Mobile primitives

Eight primitive components mirroring `apps/web/components/primitives/` prop APIs. Each ships with a test.

**Important:** Before writing each primitive, read its web twin to capture the prop interface verbatim. The portability promise is: a feature component written against the API works in both apps.

### Task 6.1: `<Screen>`

**Files:**
- Create: `apps/mobile/components/primitives/Screen.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Screen.test.tsx`

- [ ] **Step 1: Read web's `<Screen>`**

```bash
cat apps/web/components/primitives/Screen.tsx
```

Note the props. Common shape: `{ children, padded?, scroll? }`.

- [ ] **Step 2: Write the failing test**

`apps/mobile/components/primitives/__tests__/Screen.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '../Screen';

describe('<Screen>', () => {
  it('renders children inside a SafeAreaView', () => {
    const { getByText } = render(
      <Screen>
        <Text>hello</Text>
      </Screen>
    );
    expect(getByText('hello')).toBeTruthy();
  });

  it('applies padding by default', () => {
    const { getByTestId } = render(
      <Screen testID="screen">
        <Text>x</Text>
      </Screen>
    );
    const screen = getByTestId('screen');
    expect(screen.props.className).toMatch(/p-md|px-md/);
  });
});
```

- [ ] **Step 3: Run — expect fail**

```bash
pnpm --filter cultuvilla-mobile test Screen
```

Expected: FAIL — Screen not defined.

- [ ] **Step 4: Implement**

`apps/mobile/components/primitives/Screen.tsx`:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import type { ReactNode } from 'react';

export type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  scroll?: boolean;
  testID?: string;
};

export function Screen({ children, padded = true, scroll = false, testID }: ScreenProps) {
  const className = padded ? 'flex-1 bg-background p-md' : 'flex-1 bg-background';
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-background" testID={testID}>
      <Inner className={className} contentContainerClassName={scroll ? className : undefined}>
        {children}
      </Inner>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Install safe-area-context**

```bash
pnpm --filter cultuvilla-mobile exec expo install react-native-safe-area-context
```

- [ ] **Step 6: Run — expect pass**

```bash
pnpm --filter cultuvilla-mobile test Screen
```

Expected: 2 tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/components/primitives/Screen.tsx apps/mobile/components/primitives/__tests__/Screen.test.tsx apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): add <Screen> primitive mirroring web prop API"
```

### Task 6.2: `<HStack>` and `<VStack>`

**Files:**
- Create: `apps/mobile/components/primitives/HStack.tsx`
- Create: `apps/mobile/components/primitives/VStack.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Stack.test.tsx`

- [ ] **Step 1: Read web twins**

```bash
cat apps/web/components/primitives/HStack.tsx apps/web/components/primitives/VStack.tsx
```

Capture the gap prop name (likely a token key: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`) and the align/justify prop names.

- [ ] **Step 2: Test**

`apps/mobile/components/primitives/__tests__/Stack.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HStack } from '../HStack';
import { VStack } from '../VStack';

describe('<HStack>', () => {
  it('renders children row-wise', () => {
    const { getByTestId } = render(
      <HStack testID="row" gap="md"><Text>a</Text><Text>b</Text></HStack>
    );
    expect(getByTestId('row').props.className).toMatch(/flex-row.*gap-md|gap-md.*flex-row/);
  });
});

describe('<VStack>', () => {
  it('renders children column-wise', () => {
    const { getByTestId } = render(
      <VStack testID="col" gap="sm"><Text>a</Text></VStack>
    );
    expect(getByTestId('col').props.className).toMatch(/flex-col.*gap-sm|gap-sm.*flex-col/);
  });
});
```

- [ ] **Step 3: Implement**

`apps/mobile/components/primitives/HStack.tsx`:

```tsx
import { View } from 'react-native';
import type { ReactNode } from 'react';

export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export type HStackProps = {
  children: ReactNode;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  className?: string;
  testID?: string;
};

const alignMap: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyMap: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export function HStack({ children, gap, align, justify, className, testID }: HStackProps) {
  const parts = ['flex-row'];
  if (gap) parts.push(`gap-${gap}`);
  if (align) parts.push(alignMap[align]);
  if (justify) parts.push(justifyMap[justify]);
  if (className) parts.push(className);
  return <View className={parts.join(' ')} testID={testID}>{children}</View>;
}
```

`apps/mobile/components/primitives/VStack.tsx`: identical pattern but `flex-col` and prop type `VStackProps`. Implement by analogy.

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter cultuvilla-mobile test Stack
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/primitives/HStack.tsx apps/mobile/components/primitives/VStack.tsx apps/mobile/components/primitives/__tests__/Stack.test.tsx
git commit -m "feat(mobile): add <HStack> and <VStack> primitives"
```

### Task 6.3: `<Text>`

**Files:**
- Create: `apps/mobile/components/primitives/Text.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Text.test.tsx`

- [ ] **Step 1: Read web's `<Text>` for the variant/weight/colour prop names**

```bash
cat apps/web/components/primitives/Text.tsx
```

- [ ] **Step 2: Test**

```tsx
import { render } from '@testing-library/react-native';
import { Text } from '../Text';

describe('<Text>', () => {
  it('renders with default body variant', () => {
    const { getByText } = render(<Text>hello</Text>);
    const el = getByText('hello');
    expect(el.props.className).toMatch(/text-body|text-base/);
  });

  it('applies heading variant', () => {
    const { getByText } = render(<Text variant="heading">title</Text>);
    expect(getByText('title').props.className).toMatch(/text-heading|font-bold/);
  });
});
```

- [ ] **Step 3: Implement**

`apps/mobile/components/primitives/Text.tsx`:

```tsx
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'body' | 'caption' | 'heading' | 'title';
export type TextWeight = 'regular' | 'medium' | 'bold';
export type TextColor = 'fg' | 'muted' | 'danger' | 'inverse';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
};

const variantMap: Record<TextVariant, string> = {
  body: 'text-body',
  caption: 'text-caption',
  heading: 'text-heading font-bold',
  title: 'text-title font-bold',
};

const weightMap: Record<TextWeight, string> = {
  regular: 'font-regular',
  medium: 'font-medium',
  bold: 'font-bold',
};

const colorMap: Record<TextColor, string> = {
  fg: 'text-fg',
  muted: 'text-muted',
  danger: 'text-danger',
  inverse: 'text-inverse',
};

export function Text({
  variant = 'body',
  weight,
  color = 'fg',
  className,
  ...rest
}: TextProps) {
  const parts = [variantMap[variant], colorMap[color]];
  if (weight) parts.push(weightMap[weight]);
  if (className) parts.push(String(className));
  return <RNText className={parts.join(' ')} {...rest} />;
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter cultuvilla-mobile test Text
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/primitives/Text.tsx apps/mobile/components/primitives/__tests__/Text.test.tsx
git commit -m "feat(mobile): add <Text> primitive with variant/weight/color tokens"
```

### Task 6.4: `<Pressable>`

**Files:**
- Create: `apps/mobile/components/primitives/Pressable.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Pressable.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Pressable } from '../Pressable';

describe('<Pressable>', () => {
  it('fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Pressable onPress={onPress} testID="p"><Text>tap</Text></Pressable>
    );
    fireEvent.press(getByTestId('p'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { a11y } from '@cultuvilla/shared/design-system';

export type PressableProps = Omit<RNPressableProps, 'children'> & {
  children: ReactNode;
  className?: string;
};

export function Pressable({ children, className, ...rest }: PressableProps) {
  return (
    <RNPressable
      hitSlop={a11y.hitSlop}
      className={className}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
      {...rest}
    >
      {children}
    </RNPressable>
  );
}
```

Confirm `a11y.hitSlop` is exported by shared design-system (foundations Task 1.7). If the export name differs, match foundations.

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter cultuvilla-mobile test Pressable
git add apps/mobile/components/primitives/Pressable.tsx apps/mobile/components/primitives/__tests__/Pressable.test.tsx
git commit -m "feat(mobile): add <Pressable> primitive with hitSlop + pressed state"
```

### Task 6.5: `<Button>`

**Files:**
- Create: `apps/mobile/components/primitives/Button.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Button.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('<Button>', () => {
  it('renders label and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Save" onPress={onPress} />);
    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalled();
  });

  it('ignores press when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Save" onPress={onPress} disabled />);
    fireEvent.press(getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    const { getByTestId } = render(<Button label="x" onPress={() => {}} loading testID="b" />);
    expect(getByTestId('b-spinner')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { ActivityIndicator, View } from 'react-native';
import { Pressable } from './Pressable';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

const variantBg: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const variantFg: Record<ButtonVariant, 'inverse' | 'fg' | 'muted'> = {
  primary: 'inverse',
  secondary: 'fg',
  ghost: 'fg',
  danger: 'inverse',
};

const sizePadding: Record<ButtonSize, string> = {
  sm: 'px-sm py-xs',
  md: 'px-md py-sm',
  lg: 'px-lg py-md',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = [
    'rounded-md items-center justify-center',
    variantBg[variant],
    sizePadding[size],
    isDisabled ? 'opacity-50' : '',
  ].join(' ');
  return (
    <Pressable
      onPress={isDisabled ? () => {} : onPress}
      disabled={isDisabled}
      className={classes}
      testID={testID}
    >
      <View className="flex-row items-center gap-sm">
        {loading && <ActivityIndicator testID={`${testID ?? 'btn'}-spinner`} />}
        <Text color={variantFg[variant]} weight="medium">{label}</Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter cultuvilla-mobile test Button
git add apps/mobile/components/primitives/Button.tsx apps/mobile/components/primitives/__tests__/Button.test.tsx
git commit -m "feat(mobile): add <Button> primitive with variants + loading + disabled"
```

### Task 6.6: `<Card>`

**Files:**
- Create: `apps/mobile/components/primitives/Card.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Card.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('<Card>', () => {
  it('renders children with surface + elevation classes', () => {
    const { getByTestId } = render(<Card testID="c"><Text>x</Text></Card>);
    expect(getByTestId('c').props.className).toMatch(/bg-surface/);
    expect(getByTestId('c').props.className).toMatch(/rounded/);
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { View } from 'react-native';
import type { ReactNode } from 'react';

export type CardProps = {
  children: ReactNode;
  className?: string;
  testID?: string;
};

export function Card({ children, className, testID }: CardProps) {
  const parts = ['bg-surface rounded-md p-md shadow-sm'];
  if (className) parts.push(className);
  return <View className={parts.join(' ')} testID={testID}>{children}</View>;
}
```

Confirm the elevation utility name matches foundations (e.g. `shadow-sm` vs `elevation-sm` depending on how elevation tokens are mapped in Tailwind).

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter cultuvilla-mobile test Card
git add apps/mobile/components/primitives/Card.tsx apps/mobile/components/primitives/__tests__/Card.test.tsx
git commit -m "feat(mobile): add <Card> primitive"
```

### Task 6.7: `<Input>`

**Files:**
- Create: `apps/mobile/components/primitives/Input.tsx`
- Create: `apps/mobile/components/primitives/__tests__/Input.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('<Input>', () => {
  it('updates value on change', () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <Input value="abc" onChangeText={onChange} />
    );
    fireEvent.changeText(getByDisplayValue('abc'), 'abcd');
    expect(onChange).toHaveBeenCalledWith('abcd');
  });

  it('renders label and error', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} error="Required" />
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Required')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { TextInput, type TextInputProps, View } from 'react-native';
import { Text } from './Text';
import { VStack } from './VStack';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  value: string;
  onChangeText: (next: string) => void;
  error?: string;
};

export function Input({ label, value, onChangeText, error, ...rest }: InputProps) {
  return (
    <VStack gap="xs">
      {label && <Text variant="caption" color="muted">{label}</Text>}
      <View className="border border-muted rounded-sm px-sm py-xs bg-surface">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          className="text-fg text-body"
          {...rest}
        />
      </View>
      {error && <Text variant="caption" color="danger">{error}</Text>}
    </VStack>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter cultuvilla-mobile test Input
git add apps/mobile/components/primitives/Input.tsx apps/mobile/components/primitives/__tests__/Input.test.tsx
git commit -m "feat(mobile): add <Input> primitive with label + error"
```

### Task 6.8: Primitives barrel

**Files:**
- Create: `apps/mobile/components/primitives/index.ts`

- [ ] **Step 1: Write**

```ts
export * from './Screen';
export * from './HStack';
export * from './VStack';
export * from './Text';
export * from './Pressable';
export * from './Button';
export * from './Card';
export * from './Input';
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/components/primitives/index.ts
git commit -m "feat(mobile): export primitives barrel"
```

---

## Phase 7: i18n loader

The `@cultuvilla/i18n` workspace ships the message catalog as JSON keyed by locale. The mobile app needs a thin runtime that exposes a `t(key)` and `useT()` API matching the call sites pulled from web (or providing an equivalent).

### Task 7.1: Pick a locale at runtime + load catalog

**Files:**
- Create: `apps/mobile/lib/i18n.ts`
- Create: `apps/mobile/lib/__tests__/i18n.test.ts`

- [ ] **Step 1: Inspect the catalog shape**

```bash
ls packages/i18n/src
cat packages/i18n/src/index.ts
```

Identify how locales are exported (e.g. `export const messages = { es: {...}, en: {...} }` or `export { default as es } from './es.json'`). Use whatever shape foundations produced.

- [ ] **Step 2: Test**

`apps/mobile/lib/__tests__/i18n.test.ts`:

```ts
import { createI18n } from '../i18n';

describe('createI18n', () => {
  it('returns a value for a known key', () => {
    const messages = { es: { 'feed.title': 'Eventos' } };
    const i18n = createI18n(messages, 'es');
    expect(i18n.t('feed.title')).toBe('Eventos');
  });

  it('returns the key itself when missing', () => {
    const i18n = createI18n({ es: {} }, 'es');
    expect(i18n.t('missing.key')).toBe('missing.key');
  });

  it('falls back to default locale when active locale is missing', () => {
    const messages = { es: { 'a': 'A' }, en: {} };
    const i18n = createI18n(messages, 'en', 'es');
    expect(i18n.t('a')).toBe('A');
  });

  it('interpolates {placeholders}', () => {
    const messages = { es: { 'greet': 'Hola {name}' } };
    const i18n = createI18n(messages, 'es');
    expect(i18n.t('greet', { name: 'Alvaro' })).toBe('Hola Alvaro');
  });
});
```

- [ ] **Step 3: Implement**

`apps/mobile/lib/i18n.ts`:

```ts
import { createContext, useContext, type ReactNode } from 'react';
import * as Localization from 'expo-localization';
import { messages as bundled } from '@cultuvilla/i18n';

export type Locale = string;
export type MessageBundle = Record<Locale, Record<string, string>>;

export type I18n = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export function createI18n(
  bundle: MessageBundle,
  locale: Locale,
  fallback: Locale = 'es',
): I18n {
  function resolve(key: string): string | undefined {
    return bundle[locale]?.[key] ?? bundle[fallback]?.[key];
  }
  return {
    locale,
    t(key, vars) {
      const tpl = resolve(key);
      if (!tpl) return key;
      if (!vars) return tpl;
      return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    },
  };
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const device = Localization.getLocales()[0]?.languageCode ?? 'es';
  const value = createI18n(bundled, device, 'es');
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useT must be inside <I18nProvider>');
  return v;
}
```

- [ ] **Step 4: Install expo-localization**

```bash
pnpm --filter cultuvilla-mobile exec expo install expo-localization
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter cultuvilla-mobile test i18n
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/i18n.ts apps/mobile/lib/__tests__/i18n.test.ts apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): add thin i18n loader over @cultuvilla/i18n catalog"
```

---

## Phase 8: AuthContext

The web `AuthContext` lives in `apps/web/contexts/` (or similar). The mobile version mirrors its public API so feature components can `useAuth()` portably.

### Task 8.1: AuthContext + useAuth

**Files:**
- Create: `apps/mobile/lib/auth/AuthContext.tsx`
- Create: `apps/mobile/lib/auth/useAuth.ts`
- Create: `apps/mobile/lib/auth/__tests__/AuthContext.test.tsx`

- [ ] **Step 1: Read web's AuthContext for the public shape**

```bash
find apps/web -name "AuthContext*" -not -path "*/node_modules/*"
```

Capture the value shape (e.g. `{ user, loading, signIn, signOut, signUp }`). Match it.

- [ ] **Step 2: Test**

`apps/mobile/lib/auth/__tests__/AuthContext.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../useAuth';

jest.mock('@cultuvilla/shared/firebase', () => ({
  getAuth: () => ({
    onAuthStateChanged: (cb: (u: unknown) => void) => {
      cb(null);
      return () => {};
    },
  }),
}));

describe('AuthProvider', () => {
  it('exposes a null user before sign-in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
```

- [ ] **Step 3: Implement**

`apps/mobile/lib/auth/AuthContext.tsx`:

```tsx
import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { getAuth } from '@cultuvilla/shared/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';

export type AuthValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value: AuthValue = {
    user,
    loading,
    async signIn(email, password) {
      await signInWithEmailAndPassword(getAuth(), email, password);
    },
    async signUp(email, password) {
      await createUserWithEmailAndPassword(getAuth(), email, password);
    },
    async signOut() {
      await fbSignOut(getAuth());
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

`apps/mobile/lib/auth/useAuth.ts`:

```ts
import { useContext } from 'react';
import { AuthContext, type AuthValue } from './AuthContext';

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be inside <AuthProvider>');
  return v;
}
```

- [ ] **Step 4: Run**

```bash
pnpm --filter cultuvilla-mobile test AuthContext
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/auth
git commit -m "feat(mobile): AuthProvider + useAuth mirroring web public API"
```

---

## Phase 9: Expo Router skeleton

File-based routes under `apps/mobile/app/`. Root layout mounts providers (Auth, i18n, SafeArea). `(tabs)` is a tab group. `(auth)` is a stack for login/signup. Router gates on auth state.

### Task 9.1: Install Expo Router

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.config.ts` (already declares `plugins: ['expo-router']`)
- Create: `apps/mobile/index.ts` (replaces the template's `App.tsx` entry)

- [ ] **Step 1: Install**

```bash
pnpm --filter cultuvilla-mobile exec expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
```

- [ ] **Step 2: Replace entry point**

Delete `apps/mobile/App.tsx`. Replace `apps/mobile/index.ts` with:

```ts
import 'expo-router/entry';
```

In `apps/mobile/package.json`, set `"main": "expo-router/entry"`.

- [ ] **Step 3: Add `scheme` to app.config.ts**

Already set in Task 2.1 (`scheme: 'cultuvilla'`). Confirm.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/index.ts apps/mobile/package.json apps/mobile/App.tsx
git commit -m "chore(mobile): switch entry to expo-router and install peers"
```

### Task 9.2: Root layout with providers

**Files:**
- Create: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Write**

```tsx
import './../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initMobileFirebase } from '../lib/firebaseInit';
import { AuthProvider } from '../lib/auth/AuthContext';
import { I18nProvider } from '../lib/i18n';
import { useAuth } from '../lib/auth/useAuth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

initMobileFirebase();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  // Both groups exist; let the route resolver pick. We just need to be ready.
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Note: in Expo Router, route groups in parens (`(tabs)`, `(auth)`) coexist. We don't redirect from the root layout — individual screens (and `(tabs)/_layout.tsx`) check `useAuth` and redirect to `/login` when `user` is `null`.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): root layout with Firebase init, providers, and auth gate"
```

### Task 9.3: Auth stack and login/signup

**Files:**
- Create: `apps/mobile/app/(auth)/_layout.tsx`
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/app/(auth)/signup.tsx`

- [ ] **Step 1: Auth stack layout**

`apps/mobile/app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Login screen**

`apps/mobile/app/(auth)/login.tsx`:

```tsx
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Screen, VStack, Text, Input, Button } from '../../components/primitives';
import { useAuth } from '../../lib/auth/useAuth';
import { useT } from '../../lib/i18n';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.error.unknown'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <VStack gap="md">
        <Text variant="title">{t('auth.login.title')}</Text>
        <Input label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
        {error && <Text color="danger">{error}</Text>}
        <Button label={t('auth.login.submit')} onPress={onSubmit} loading={loading} />
        <Link href="/signup"><Text color="muted">{t('auth.login.toSignup')}</Text></Link>
      </VStack>
    </Screen>
  );
}
```

- [ ] **Step 3: Signup screen**

`apps/mobile/app/(auth)/signup.tsx`: structurally identical, calls `signUp` instead of `signIn`. Implement by analogy. The label text changes to `auth.signup.*` keys.

- [ ] **Step 4: Add missing i18n keys**

Edit `packages/i18n/src/es.json` to add (use the `i18n-add-string` skill):

```json
{
  "auth.login.title": "Iniciar sesión",
  "auth.signup.title": "Crear cuenta",
  "auth.email": "Correo electrónico",
  "auth.password": "Contraseña",
  "auth.login.submit": "Entrar",
  "auth.signup.submit": "Registrarse",
  "auth.login.toSignup": "¿No tienes cuenta? Crear una",
  "auth.signup.toLogin": "¿Ya tienes cuenta? Iniciar sesión",
  "auth.error.unknown": "Algo salió mal"
}
```

- [ ] **Step 5: Smoke test**

```bash
APP_ENV=dev pnpm --filter cultuvilla-mobile exec expo start --clear
```

Navigate to `/login` (or have AuthGate redirect there — wire up redirection in tabs layout below). Try signing in with a dev-Firebase test account.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/\(auth\) packages/i18n
git commit -m "feat(mobile): login and signup screens with auth context wiring"
```

### Task 9.4: Tabs layout with v1 tab list

**Files:**
- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx` (feed stub)
- Create: `apps/mobile/app/(tabs)/villages.tsx` (villages stub)
- Create: `apps/mobile/app/(tabs)/profile.tsx` (profile stub)

- [ ] **Step 1: Tabs layout with auth guard**

`apps/mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../lib/auth/useAuth';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="villages" options={{ title: 'Pueblos' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Stub screens (real content lands in later phases)**

`apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { Screen, Text } from '../../components/primitives';
import { useT } from '../../lib/i18n';

export default function FeedScreen() {
  const { t } = useT();
  return <Screen><Text variant="title">{t('feed.title')}</Text></Screen>;
}
```

`apps/mobile/app/(tabs)/villages.tsx` and `apps/mobile/app/(tabs)/profile.tsx`: analogous stubs.

- [ ] **Step 3: Smoke test**

Launch, sign in. Expected: lands on the feed stub with tab bar.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\)
git commit -m "feat(mobile): tabs layout with feed/villages/profile stubs and auth guard"
```

---

## Phase 10: Feed screen (first real connection)

Replace the feed stub with a real list of events, reusing `getEventsFeed` (or whatever the shared service exports) and rendering an `EventCard`.

### Task 10.1: EventCard feature component

**Files:**
- Create: `apps/mobile/components/feature/EventCard.tsx`
- Create: `apps/mobile/components/feature/__tests__/EventCard.test.tsx`

- [ ] **Step 1: Inspect web's `EventCard` for prop shape and visual reference**

```bash
find apps/web -name "EventCard*" -not -path "*/node_modules/*"
```

- [ ] **Step 2: Test**

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { EventCard } from '../EventCard';

const fixture = {
  id: 'e1',
  title: 'Fiesta del pueblo',
  startsAt: new Date('2026-06-15T18:00:00Z'),
  villageName: 'Sotos',
  confirmedCount: 12,
};

describe('<EventCard>', () => {
  it('renders title and village', () => {
    const { getByText } = render(<EventCard event={fixture} onPress={() => {}} />);
    expect(getByText('Fiesta del pueblo')).toBeTruthy();
    expect(getByText(/Sotos/)).toBeTruthy();
  });

  it('fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<EventCard event={fixture} onPress={onPress} testID="card" />);
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledWith('e1');
  });
});
```

- [ ] **Step 3: Implement**

```tsx
import { Pressable, Card, VStack, HStack, Text } from '../primitives';
import { formatDate } from '@cultuvilla/shared/utils/format';

type EventLike = {
  id: string;
  title: string;
  startsAt: Date;
  villageName: string;
  confirmedCount?: number;
};

export type EventCardProps = {
  event: EventLike;
  onPress: (id: string) => void;
  testID?: string;
};

export function EventCard({ event, onPress, testID }: EventCardProps) {
  return (
    <Pressable onPress={() => onPress(event.id)} testID={testID}>
      <Card>
        <VStack gap="xs">
          <Text variant="heading">{event.title}</Text>
          <HStack justify="between">
            <Text color="muted">{event.villageName}</Text>
            <Text color="muted">{formatDate(event.startsAt, 'long')}</Text>
          </HStack>
          {event.confirmedCount !== undefined && (
            <Text variant="caption" color="muted">{event.confirmedCount} confirmados</Text>
          )}
        </VStack>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/feature/EventCard.tsx apps/mobile/components/feature/__tests__/EventCard.test.tsx
git commit -m "feat(mobile): EventCard feature component"
```

### Task 10.2: Real feed screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Wire**

```tsx
import { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text } from '../../components/primitives';
import { EventCard } from '../../components/feature/EventCard';
import { useT } from '../../lib/i18n';
import { getEventsFeed, type EventDoc } from '@cultuvilla/shared/services/eventService';

export default function FeedScreen() {
  const { t } = useT();
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const list = await getEventsFeed({ limit: 50 });
      setEvents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }

  useEffect(() => { void load(); }, []);

  if (events === null && !error) {
    return <Screen><ActivityIndicator /></Screen>;
  }
  if (error) {
    return <Screen><Text color="danger">{error}</Text></Screen>;
  }

  return (
    <Screen padded={false}>
      <FlatList
        contentContainerClassName="p-md gap-md"
        data={events ?? []}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text color="muted">{t('feed.empty')}</Text>}
        renderItem={({ item }) => (
          <EventCard
            event={{
              id: item.id,
              title: item.title,
              startsAt: item.startsAt.toDate(),
              villageName: item.villageName,
              confirmedCount: item.confirmedCount,
            }}
            onPress={(id) => router.push(`/event/${id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          />
        }
      />
    </Screen>
  );
}
```

Confirm the exact `eventService` API name and `EventDoc` field names from `packages/shared/src/services/eventService.ts` — adjust if they differ (e.g. `getFeed`, `listEvents`, `villageDisplayName`).

- [ ] **Step 2: Add the i18n key**

```json
"feed.empty": "No hay eventos próximos"
```

- [ ] **Step 3: Smoke test against dev Firebase**

Launch, sign in, confirm feed renders dev events.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\)/index.tsx packages/i18n
git commit -m "feat(mobile): feed screen consuming shared eventService"
```

---

## Phase 11: Event detail + register

### Task 11.1: Event detail screen with register CTA

**Files:**
- Create: `apps/mobile/app/event/[eventId].tsx`
- Create: `apps/mobile/components/feature/RegisterButton.tsx`

- [ ] **Step 1: RegisterButton**

```tsx
import { Button } from '../primitives';
import { registerToEvent } from '@cultuvilla/shared/services/registrationService';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useT } from '../../lib/i18n';

export function RegisterButton({ eventId, personId, onRegistered }: {
  eventId: string;
  personId: string;
  onRegistered: () => void;
}) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  async function onPress() {
    setLoading(true);
    try {
      await registerToEvent(eventId, [{ personId }]);
      onRegistered();
    } catch (e) {
      Alert.alert(t('event.register.error'), e instanceof Error ? e.message : 'unknown');
    } finally {
      setLoading(false);
    }
  }
  return <Button label={t('event.register.cta')} onPress={onPress} loading={loading} />;
}
```

- [ ] **Step 2: Event detail screen**

```tsx
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Screen, VStack, Text } from '../../components/primitives';
import { RegisterButton } from '../../components/feature/RegisterButton';
import { useAuth } from '../../lib/auth/useAuth';
import { getEventById, type EventDoc } from '@cultuvilla/shared/services/eventService';
import { getPersonByUserId } from '@cultuvilla/shared/services/personService';
import { formatDate } from '@cultuvilla/shared/utils/format';
import { useT } from '../../lib/i18n';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const { t } = useT();
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!eventId) return;
      const e = await getEventById(eventId);
      setEvent(e);
      if (user) {
        const p = await getPersonByUserId(user.uid);
        setPersonId(p?.id ?? null);
      }
    })();
  }, [eventId, user]);

  if (!event) return <Screen><ActivityIndicator /></Screen>;

  return (
    <Screen>
      <VStack gap="md">
        <Text variant="title">{event.title}</Text>
        <Text color="muted">{event.villageName}</Text>
        <Text>{formatDate(event.startsAt.toDate(), 'long')}</Text>
        <Text>{event.description}</Text>
        <Text color="muted">{event.confirmedCount ?? 0} confirmados</Text>
        {personId && !registered && (
          <RegisterButton eventId={event.id} personId={personId} onRegistered={() => setRegistered(true)} />
        )}
        {registered && <Text color="muted">{t('event.register.done')}</Text>}
        {!personId && user && <Text color="muted">{t('event.register.needsPerson')}</Text>}
      </VStack>
    </Screen>
  );
}
```

Confirm the exact API names from `personService` and `eventService` — adjust if they differ.

- [ ] **Step 3: i18n keys**

```json
"event.register.cta": "Apuntarme",
"event.register.done": "¡Apuntado!",
"event.register.error": "No pudimos apuntarte",
"event.register.needsPerson": "Completa tu perfil para apuntarte"
```

- [ ] **Step 4: Smoke test**

Sign in, tap a feed card, register. Confirm Firestore shows the registration with the correct `isMember` denorm.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/event apps/mobile/components/feature/RegisterButton.tsx packages/i18n
git commit -m "feat(mobile): event detail screen + register flow via shared service"
```

---

## Phase 12: Villages list + village home + censo

### Task 12.1: Villages list

**Files:**
- Modify: `apps/mobile/app/(tabs)/villages.tsx`
- Create: `apps/mobile/components/feature/VillageCard.tsx`

- [ ] **Step 1: VillageCard**

```tsx
import { Card, Pressable, VStack, Text } from '../primitives';
type VillageLike = { id: string; name: string; memberCount?: number };
export function VillageCard({ village, onPress }: { village: VillageLike; onPress: (id: string) => void }) {
  return (
    <Pressable onPress={() => onPress(village.id)}>
      <Card>
        <VStack gap="xs">
          <Text variant="heading">{village.name}</Text>
          {village.memberCount !== undefined && (
            <Text color="muted">{village.memberCount} miembros</Text>
          )}
        </VStack>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 2: Villages screen**

```tsx
import { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text } from '../../components/primitives';
import { VillageCard } from '../../components/feature/VillageCard';
import { listVillages, type VillageDoc } from '@cultuvilla/shared/services/villageService';
import { useT } from '../../lib/i18n';

export default function VillagesScreen() {
  const { t } = useT();
  const [villages, setVillages] = useState<VillageDoc[] | null>(null);
  useEffect(() => { listVillages().then(setVillages); }, []);
  if (!villages) return <Screen><ActivityIndicator /></Screen>;
  return (
    <Screen padded={false}>
      <FlatList
        contentContainerClassName="p-md gap-md"
        data={villages}
        keyExtractor={(v) => v.id}
        ListEmptyComponent={<Text color="muted">{t('villages.empty')}</Text>}
        renderItem={({ item }) => (
          <VillageCard village={{ id: item.id, name: item.name, memberCount: item.memberCount }} onPress={(id) => router.push(`/village/${id}`)} />
        )}
      />
    </Screen>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(tabs\)/villages.tsx apps/mobile/components/feature/VillageCard.tsx
git commit -m "feat(mobile): villages list screen"
```

### Task 12.2: Village home

**Files:**
- Create: `apps/mobile/app/village/[villageId]/index.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Link } from 'expo-router';
import { ActivityIndicator, FlatList } from 'react-native';
import { Screen, VStack, Text } from '../../../components/primitives';
import { EventCard } from '../../../components/feature/EventCard';
import { getVillageById, type VillageDoc } from '@cultuvilla/shared/services/villageService';
import { listEventsByVillage } from '@cultuvilla/shared/services/eventService';
import { useT } from '../../../lib/i18n';

export default function VillageHome() {
  const { villageId } = useLocalSearchParams<{ villageId: string }>();
  const { t } = useT();
  const [village, setVillage] = useState<VillageDoc | null>(null);
  const [events, setEvents] = useState<unknown[]>([]);
  useEffect(() => {
    if (!villageId) return;
    getVillageById(villageId).then(setVillage);
    listEventsByVillage(villageId).then(setEvents);
  }, [villageId]);
  if (!village) return <Screen><ActivityIndicator /></Screen>;
  return (
    <Screen padded={false}>
      <VStack gap="md" className="p-md">
        <Text variant="title">{village.name}</Text>
        <Link href={`/village/${village.id}/censo`}><Text color="muted">{t('village.censo.link')}</Text></Link>
      </VStack>
      <FlatList
        contentContainerClassName="p-md gap-md"
        data={events as { id: string; title: string; startsAt: { toDate(): Date }; villageName: string }[]}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text color="muted">{t('village.events.empty')}</Text>}
        renderItem={({ item }) => (
          <EventCard event={{ id: item.id, title: item.title, startsAt: item.startsAt.toDate(), villageName: item.villageName }} onPress={() => {}} />
        )}
      />
    </Screen>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/village
git commit -m "feat(mobile): village home screen"
```

### Task 12.3: Censo form

**Files:**
- Create: `apps/mobile/app/village/[villageId]/censo.tsx`
- Create: `apps/mobile/components/feature/CensoForm.tsx`

- [ ] **Step 1: Inspect the censo data shape**

```bash
find packages/shared -name "censo*"
```

Identify the censo field types (barrio, residencyType, etc.) from the model.

- [ ] **Step 2: Form component**

`apps/mobile/components/feature/CensoForm.tsx`:

```tsx
import { useState } from 'react';
import { VStack, Input, Button, Text } from '../primitives';
import { saveCenso, type CensoData } from '@cultuvilla/shared/services/censoService';
import { useT } from '../../lib/i18n';

export function CensoForm({ villageId, userId, initial }: {
  villageId: string;
  userId: string;
  initial?: Partial<CensoData>;
}) {
  const { t } = useT();
  const [barrio, setBarrio] = useState(initial?.barrio ?? '');
  const [residencyType, setResidencyType] = useState(initial?.residencyType ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit() {
    setSaving(true);
    setError(null);
    try {
      await saveCenso(villageId, userId, { barrio, residencyType });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setSaving(false);
    }
  }
  return (
    <VStack gap="md">
      <Input label={t('censo.barrio')} value={barrio} onChangeText={setBarrio} />
      <Input label={t('censo.residencyType')} value={residencyType} onChangeText={setResidencyType} />
      {error && <Text color="danger">{error}</Text>}
      <Button label={t('censo.save')} onPress={onSubmit} loading={saving} />
    </VStack>
  );
}
```

Confirm field names against the actual censo model — adjust to match. Add additional fields as the schema requires.

- [ ] **Step 3: Censo screen**

```tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen, VStack, Text } from '../../../components/primitives';
import { CensoForm } from '../../../components/feature/CensoForm';
import { useAuth } from '../../../lib/auth/useAuth';
import { getCenso, type CensoData } from '@cultuvilla/shared/services/censoService';
import { useT } from '../../../lib/i18n';

export default function CensoScreen() {
  const { villageId } = useLocalSearchParams<{ villageId: string }>();
  const { user } = useAuth();
  const { t } = useT();
  const [initial, setInitial] = useState<CensoData | null>(null);
  useEffect(() => {
    if (!villageId || !user) return;
    getCenso(villageId, user.uid).then(setInitial);
  }, [villageId, user]);
  if (!user || !villageId) return null;
  return (
    <Screen>
      <VStack gap="md">
        <Text variant="title">{t('censo.title')}</Text>
        <CensoForm villageId={villageId} userId={user.uid} initial={initial ?? undefined} />
      </VStack>
    </Screen>
  );
}
```

- [ ] **Step 4: i18n keys**

```json
"censo.title": "Tu censo",
"censo.barrio": "Barrio",
"censo.residencyType": "Tipo de residencia",
"censo.save": "Guardar",
"village.censo.link": "Completar mi censo",
"village.events.empty": "No hay eventos en este pueblo",
"villages.empty": "Aún no hay pueblos"
```

- [ ] **Step 5: Smoke test + commit**

```bash
git add apps/mobile/app/village apps/mobile/components/feature/CensoForm.tsx packages/i18n
git commit -m "feat(mobile): censo form screen wired to shared censoService"
```

---

## Phase 13: Profile + image upload

### Task 13.1: Image upload helper

**Files:**
- Create: `apps/mobile/lib/images.ts`

- [ ] **Step 1: Install image picker**

```bash
pnpm --filter cultuvilla-mobile exec expo install expo-image-picker
```

- [ ] **Step 2: Helper**

```ts
import * as ImagePicker from 'expo-image-picker';

export async function pickImageAsBlob(): Promise<{ blob: Blob; filename: string; contentType: string } | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const res = await fetch(asset.uri);
  const blob = await res.blob();
  const filename = asset.fileName ?? `upload-${Date.now()}.jpg`;
  const contentType = asset.mimeType ?? 'image/jpeg';
  return { blob, filename, contentType };
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/images.ts apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): pickImageAsBlob helper bridging picker to imageService"
```

### Task 13.2: Profile screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useState } from 'react';
import { Image, ActivityIndicator } from 'react-native';
import { Screen, VStack, HStack, Text, Button } from '../../components/primitives';
import { useAuth } from '../../lib/auth/useAuth';
import { useT } from '../../lib/i18n';
import { pickImageAsBlob } from '../../lib/images';
import {
  getPersonByUserId,
  type PersonDoc,
} from '@cultuvilla/shared/services/personService';
import { uploadPersonImage } from '@cultuvilla/shared/services/imageService';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useT();
  const [person, setPerson] = useState<PersonDoc | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getPersonByUserId(user.uid).then(setPerson);
  }, [user]);

  async function onChangePhoto() {
    if (!person) return;
    const picked = await pickImageAsBlob();
    if (!picked) return;
    setUploading(true);
    try {
      await uploadPersonImage(person.id, picked);
      const refreshed = await getPersonByUserId(user!.uid);
      setPerson(refreshed);
    } finally {
      setUploading(false);
    }
  }

  if (!user) return null;
  return (
    <Screen>
      <VStack gap="md">
        <Text variant="title">{t('profile.title')}</Text>
        {person?.photoUrl && <Image source={{ uri: person.photoUrl }} style={{ width: 120, height: 120, borderRadius: 60 }} />}
        <Text>{person?.fullName ?? user.email}</Text>
        <HStack gap="sm">
          <Button label={t('profile.changePhoto')} onPress={onChangePhoto} loading={uploading} />
          <Button label={t('profile.signOut')} onPress={signOut} variant="ghost" />
        </HStack>
        {uploading && <ActivityIndicator />}
      </VStack>
    </Screen>
  );
}
```

Confirm field names from `PersonDoc` (e.g. `photoUrl` vs `imageUrl`) match shared.

- [ ] **Step 2: i18n keys**

```json
"profile.title": "Tu perfil",
"profile.changePhoto": "Cambiar foto",
"profile.signOut": "Cerrar sesión"
```

- [ ] **Step 3: Smoke test + commit**

```bash
git add apps/mobile/app/\(tabs\)/profile.tsx packages/i18n
git commit -m "feat(mobile): profile screen with photo upload and sign-out"
```

---

## Phase 14: App Check (per-env opt-in)

Pairs with the web App Check rollout plan. Reads `EXPO_PUBLIC_RECAPTCHA_SITE_KEY_<ENV>` style is not what mobile uses — mobile uses DeviceCheck on iOS / Play Integrity on Android via `@react-native-firebase/app-check` OR a managed-workflow-friendly community plugin. For v1 scaffold, we wire the *opt-in seam* and leave the provider config commented until product asks for it (mirroring the web plan's deferred-until-keys status).

### Task 14.1: App Check init seam

**Files:**
- Create: `apps/mobile/lib/appCheck.ts`

- [ ] **Step 1: Write a no-op-with-TODO seam**

```ts
// Mobile App Check is wired here when product is ready to roll out.
// Mirrors apps/web's per-env opt-in. Until then, this is a no-op so the
// rest of the app boots without App Check.
//
// To enable: install @react-native-firebase/app-check (or the managed
// Expo equivalent), then in initMobileAppCheck() call the provider for
// DeviceCheck (iOS) / Play Integrity (Android) when an env-specific
// site key / token provider is configured.
//
// See docs/superpowers/plans/2026-05-19-app-check-rollout.md for the
// per-env opt-in pattern.
export function initMobileAppCheck(): void {
  // intentionally empty
}
```

- [ ] **Step 2: Call from `firebaseInit`**

Modify `apps/mobile/lib/firebaseInit.ts` to call `initMobileAppCheck()` after `initFirebase`:

```ts
import { initMobileAppCheck } from './appCheck';
// ...
initFirebase(...);
initMobileAppCheck();
initialized = true;
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/appCheck.ts apps/mobile/lib/firebaseInit.ts
git commit -m "chore(mobile): add App Check init seam (no-op until product enables)"
```

---

## Phase 15: CI

### Task 15.1: GitHub workflow for typecheck + test on PR

**Files:**
- Create: `.github/workflows/mobile-ci.yml`

- [ ] **Step 1: Inspect the existing workflow**

```bash
cat .github/workflows/ci.yml 2>/dev/null || ls .github/workflows
```

Match the node + pnpm setup steps.

- [ ] **Step 2: Write**

`.github/workflows/mobile-ci.yml`:

```yaml
name: mobile-ci

on:
  pull_request:
    paths:
      - 'apps/mobile/**'
      - 'packages/shared/**'
      - 'packages/i18n/**'
      - 'pnpm-lock.yaml'
      - '.github/workflows/mobile-ci.yml'
  push:
    branches: [main]

jobs:
  typecheck-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm mobile:typecheck
      - run: pnpm mobile:test
```

EAS builds are not run automatically here — they're metered. Trigger manually via `eas build --profile <name>` or add a workflow_dispatch job in a follow-up.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/mobile-ci.yml
git commit -m "ci: add mobile typecheck + test workflow on PR"
```

---

## Phase 16: Docs + skills activation

### Task 16.1: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add a "Mobile app" section after the "Web app" section**

Document:
- Where mobile code lives (`apps/mobile/`)
- Boot command (`pnpm --filter cultuvilla-mobile exec expo start`)
- The primitive prop API is shared with web — additions must land in both
- Image uploads go through `pickImageAsBlob` → `imageService`
- New i18n strings: add to `packages/i18n` and they're available to both apps

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: AGENTS.md mobile app section"
```

### Task 16.2: Activate `expo-native-rebuild` skill

**Files:**
- Modify: `.claude/skills/expo-native-rebuild/SKILL.md`

- [ ] **Step 1: Remove the STUB marker and TODO**

The skill is a stub; mobile now exists, so fill in the TODO block with cultuvilla-specific paths (`apps/mobile/`, `apps/mobile/app.config.ts`, EAS profiles) and remove the inactive-until-mobile-lands disclaimer.

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/expo-native-rebuild
git commit -m "docs(skills): activate expo-native-rebuild for apps/mobile"
```

### Task 16.3: Update `i18n-add-string` skill

**Files:**
- Modify: `.claude/skills/i18n-add-string/SKILL.md`

- [ ] **Step 1: Document the dual-app contract**

A new key must be added to `packages/i18n` and consumed by both apps; the dev-only carve-out (hard-coded Spanish in admin surfaces) still applies on web, but mobile has no equivalent admin surface, so the carve-out doesn't apply to mobile screens.

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/i18n-add-string
git commit -m "docs(skills): i18n-add-string now covers mobile consumer too"
```

### Task 16.4: CHANGELOG entry

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add an `[Unreleased] / Added` entry**

```markdown
- **`apps/mobile/`** — Expo SDK 53 / Expo Router v4 / NativeWind v4 mobile app scaffold. Consumes `@cultuvilla/shared` (services, design tokens, formatters) and `@cultuvilla/i18n` (catalog). Firebase auth uses `getReactNativePersistence(AsyncStorage)` via the shared `customizeAuth` hook. v1 ships read flows: feed, event detail + register-to-event, villages list, village home, censo form, profile + photo upload, login/signup. EAS Build profiles dev/beta/prod match the existing Firebase env split. App Check seam wired but no-op until product opts in. See [docs/superpowers/plans/2026-05-19-mobile-app-scaffold.md](docs/superpowers/plans/2026-05-19-mobile-app-scaffold.md).
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for apps/mobile scaffold"
```

---

## Phase 17: Final verification

### Task 17.1: Full check from a fresh shell

- [ ] **Step 1: Clean install + check**

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm check                    # lint + typecheck + test + build across web + shared
pnpm mobile:typecheck
pnpm mobile:test
```

Expected: exit 0 on all.

- [ ] **Step 2: Boot mobile in dev**

```bash
APP_ENV=dev pnpm --filter cultuvilla-mobile exec expo start --clear
```

Open in a simulator / device. Manually walk:

- Sign up with a fresh email → lands on feed (empty if no events) → tab to villages → tap a village → home renders → tap "Completar mi censo" → save → back to feed → tap an event → register → confirm
- Profile tab → change photo → confirm storage write → sign out → lands on login

- [ ] **Step 3: Open the PR**

```bash
git push -u origin mobile-app-scaffold
gh pr create --title "feat(mobile): scaffold Expo SDK 53 app for v1 read flows" --body "$(cat <<'EOF'
## Summary

- Scaffolds `apps/mobile/` (Expo SDK 53 + Expo Router v4 + NativeWind v4) consuming `@cultuvilla/shared` and `@cultuvilla/i18n`.
- v1 read flows: feed, event detail + register, villages list, village home, censo, profile + photo upload, auth.
- Firebase via shared `initFirebase` + `getReactNativePersistence(AsyncStorage)`.
- EAS dev/beta/prod profiles; App Check seam (no-op).
- New CI workflow runs typecheck + test on PR.

Plan: docs/superpowers/plans/2026-05-19-mobile-app-scaffold.md
Design: docs/superpowers/specs/2026-05-19-mobile-app-scaffold-design.md

## Test plan
- [ ] `pnpm check` passes
- [ ] `pnpm mobile:typecheck` passes
- [ ] `pnpm mobile:test` passes
- [ ] Manual: sign up → feed → village → censo → register → upload photo → sign out
- [ ] EAS build (`eas build --profile development --platform ios`) produces a working dev client

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Summary

When this plan lands:

- `apps/mobile/` is a working Expo app shipping the v1 read flows on iOS + Android.
- All Firebase access goes through `@cultuvilla/shared` — no service code lives in `apps/mobile/`.
- Design tokens, primitives' prop APIs, i18n catalog, and locale formatters are shared between web and mobile.
- Three EAS profiles map to the existing Firebase env split.
- CI runs typecheck + test on every PR touching `apps/mobile/` or its shared deps.
- App Check has an opt-in seam, no-op until product chooses to roll it out.

What's explicitly NOT in scope (separate plans):

- **Organization admin, event creation, persona management UIs** — v2 mobile.
- **Push notifications** — needs FCM/APNs + Cloud Function.
- **Offline mode**, **family tree**, **dark-mode toggle** — backlog.
- **Real App Check provider config** — pairs with the [web App Check rollout plan](./2026-05-19-app-check-rollout.md).
- **Production EAS Submit pipeline** — first builds are manual; automate later.
