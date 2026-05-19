---
name: expo-native-rebuild
description: STUB — inactive until `apps/mobile/` exists. Future skill for the planned cultuvilla mobile app — rebuild native projects after Expo plugin changes. Activates when the React Native + Expo app is added under `apps/mobile/`. Template below mirrors the ordago-apps procedure; fill in the TODO block before activating.
---

# Rebuild cultuvilla native projects after Expo plugin changes

> **STATUS: STUB.** Cultuvilla has no mobile app today. This skill is a forward template. Do not invoke against the current repo — there are no native projects to rebuild. When `apps/mobile/` is added, fill in the TODO block and remove the STUB banner.

## When this will apply (once mobile lands)

Run a clean prebuild whenever any of:

1. Added/removed a package that ships an Expo config plugin (`@react-native-firebase/app`, `@react-native-firebase/crashlytics`, `@sentry/react-native`, etc.).
2. Changed the `plugins` array in `apps/mobile/app.config.js` (or `app.json`).
3. Modified one of the local plugins under `apps/mobile/plugins/`.
4. App launches and immediately force-closes with a native error from `FirebaseInitProvider`, missing Crashlytics build ID, or a similar Cocoa/Gradle plugin error.

`expo run:android` / `run:ios` does **incremental** prebuild — it does NOT re-merge new Expo config plugins into existing `android/build.gradle`, `android/app/build.gradle`, or `ios/Podfile`. Result: the new plugin is in `app.config.js` but its Gradle/CocoaPods injection never lands.

## The fix (once mobile lands)

`apps/mobile/android/` and `apps/mobile/ios/` will be gitignored prebuild output, regenerated from `app.config.js` and `apps/mobile/plugins/*` on every clean prebuild. Safe to nuke.

```bash
cd <repo-root>/apps/mobile
EAS_BUILD_PROFILE=development npx expo prebuild --platform android --clean
# or --platform ios, or both with no --platform flag
```

After prebuild, rebuild + reinstall via the dev script.

## TODO — fill in before activating

- [ ] Confirm the mobile app's directory name: `apps/mobile/` vs `apps/cultuvilla-app/` vs other.
- [ ] Confirm `app.config.js` vs `app.json` as the source of truth for `plugins`.
- [ ] List the local plugins under `apps/mobile/plugins/` once they exist (e.g. `withGoogleServices.js`, `withAndroidSupportsScreens.js`).
- [ ] Document the build-profile env var name and how it maps to dev/beta/prod google-services files.
- [ ] Document the `pnpm app:build:local:*` (or equivalent) reinstall command.
- [ ] List the expected Gradle/Pods injections to verify — e.g. for Crashlytics:
  - `android/build.gradle`: `classpath 'com.google.firebase:firebase-crashlytics-gradle:...'`
  - `android/app/build.gradle`: `apply plugin: 'com.google.firebase.crashlytics'`
- [ ] Document any cultuvilla-specific package-name suffixes (e.g. `.devclient`, `.beta`) and where they're set.
- [ ] Remove the **STUB STATUS** banner.

## Don't (once activated)

- Manually edit `android/` or `ios/` files to fix plugin injections — they get blown away on the next clean prebuild. Fix the upstream `app.config.js` plugin entry instead.

## When this skill applies

When `apps/mobile/` exists AND the user is changing native modules, plugins, or seeing native init crashes.

## Reference

Template adapted from `ordago-apps/.claude/skills/expo-native-rebuild/SKILL.md`. When activating, refine against cultuvilla's actual mobile setup; the ordago version is illustrative, not authoritative.
