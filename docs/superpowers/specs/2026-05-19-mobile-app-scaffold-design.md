# Mobile App Scaffold — Design Spec

**Date:** 2026-05-19
**Author:** Alvaro (with Claude)
**Companion plan:** TBD — `mobile-app-scaffold.md` after this design is blessed.
**Builds on:** [2026-05-19-design-system-foundations.md](../plans/2026-05-19-design-system-foundations.md) (must land first).

---

## 1. Vision

Ship a native iOS + Android app for cultuvilla that reuses the existing `@cultuvilla/shared` package (models, services, design tokens, formatters) and the hoisted `@cultuvilla/i18n` catalog. The mobile app is a peer to `apps/web`, not a port — both consume the same shared layer. The first release covers the read-mostly flows: browse feed, view event, authenticate, fill censo, register to event.

## 2. Non-goals (v1)

- Push notifications (separate plan; needs FCM/APNs setup + a Cloud Function).
- Offline mode.
- Family-tree screens, organization admin, persona management UIs — backlog.
- Native modules outside Expo's managed surface.
- Dark mode toggle (semantic tokens already dark-ready; toggle ships later).

## 3. Tech choices

| Area | Choice | Reason |
|---|---|---|
| Runtime | **Expo SDK 53 (managed workflow)** | EAS Build, OTA updates, no native toolchain locally. `expo-native-rebuild` skill already stubbed for the day we need it. |
| Routing | **Expo Router v4** (file-based) | Mirrors Next.js app-router mental model; deep linking + universal links for free; team already thinks in route folders. |
| Styling | **NativeWind v4 (stable)** + shared tokens | Consumes Tailwind tokens from `@cultuvilla/shared/design-system`. Do NOT use NativeWind v5 (still pre-release per upstream). When v5 ships GA, migrate alongside web's move to `@theme`. |
| State | React Context (auth) + service-layer hooks (same pattern as web) | No global store. Services own Firestore reads. |
| Forms | `react-hook-form` + `zod` | Same stack proposed for web in the ordago uplift; share schemas via shared. |
| Data fetching | Direct service calls + React state, same as web today | TanStack Query deferred (same note as web). |
| Auth persistence | `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` via the `customizeAuth` hook already in `initFirebase` | Already designed in the firebase init refactor (CHANGELOG 2026-05-19). |
| Image upload | `expo-image-picker` → `fetch(uri).blob()` → existing `imageService` | Already designed in the Blob-based imageService refactor. |
| i18n | `@cultuvilla/i18n` catalog + `react-i18next` (or `expo-localization` + lightweight loader) | next-intl is web-only; the catalog hoist makes the messages reusable. Loader is a thin adapter. |
| Asset registry | Typed `assets.ts` with `require()` map under `apps/mobile/assets/` | Metro requires static `require()` paths; the registry is the only place strings become required modules. |
| App Check | `@react-native-firebase/app-check` or Expo equivalent with `DeviceCheck`/`PlayIntegrity` | Pairs with the web App Check rollout plan; same per-env opt-in pattern. |
| Crash + analytics | Sentry RN + Firebase Analytics | Sentry already proposed for web. |
| Build/release | **EAS Build** + **EAS Submit** | One CI workflow per env (dev/beta/prod), matching the web env split. |

## 4. v1 screen scope

```
app/
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/
│   ├── _layout.tsx        Tab bar
│   ├── index.tsx          Feed (chronological, all villages)
│   ├── villages.tsx       Browse villages
│   └── profile.tsx        Account + my villages + censo links
├── event/[eventId].tsx    Event detail + register CTA
├── village/[villageId]/
│   ├── index.tsx          Village home
│   └── censo.tsx          Fill / edit censo
└── _layout.tsx            Root: AuthProvider, i18n, theme
```

Cuts vs web in v1: no organization admin, no event creation, no persona management. All of these are explicitly v2.

## 5. Module layout

```
apps/mobile/
├── app/                   Expo Router routes (above)
├── components/
│   ├── primitives/        Mobile twins of web primitives: Screen, HStack, VStack, Text, Pressable, Button, Card, Input
│   └── feature/           Feature components (EventCard, RegisterButton, …)
├── lib/
│   ├── firebaseInit.ts    Calls initFirebase() with mobile config + getReactNativePersistence
│   ├── i18n.ts            Loads @cultuvilla/i18n catalog
│   └── env.ts             Reads Expo config env via expo-constants
├── assets/
│   ├── assets.ts          Typed require() registry
│   └── images/
├── app.config.ts          Expo config (per-env via APP_ENV)
├── eas.json
├── package.json
└── tsconfig.json
```

Mobile primitives mirror the web primitives' prop API exactly so feature components written against the API are portable.

## 6. Env config

Reuses the existing `getFirebaseConfig(env)` from `packages/shared/src/config/environments.ts` (the same one web now consumes via `firebaseInit.ts`). Mobile reads `APP_ENV` from `expo-constants.expoConfig.extra` set per EAS profile. No `NEXT_PUBLIC_*` vars — those are baked at web build and don't exist on mobile.

## 7. Open questions to resolve before the plan

These should be decided in the plan-writing pass, not now:

1. **i18n adapter** — `react-i18next` (heavier, mature, RN-friendly) vs. a 30-line custom loader over the catalog JSON. Lean toward the custom loader since the catalog is already structured for next-intl and we don't need plurals/ICU complexity.
2. **App Check provider** — `expo-build-properties` config plugin for DeviceCheck/PlayIntegrity vs. plain `@react-native-firebase/app-check`. Probably the former (stays in managed workflow).
3. **Splash + icon assets** — design ask, blocks first EAS build. Capture in a follow-up.
4. **Testing** — Jest (Expo's default) vs. Vitest with `@testing-library/react-native`. Lean Jest — Expo + Metro alignment.
5. **CI** — add a `mobile-ci.yml` workflow that runs `eas build --profile preview --non-interactive` on PR? Or just typecheck + test on PR and gate builds to manual. Lean the second; EAS builds are slow and metered.

## 8. Sequencing

1. **Prerequisite:** `design-system-foundations` plan must land. The mobile app consumes tokens, primitives' prop contracts, and the i18n workspace from it.
2. Draft the `mobile-app-scaffold.md` implementation plan (this design becomes its reference).
3. Plan executes in a worktree branched off `main`.
4. First milestone: blank Expo app boots, hits dev Firebase via the shared init, renders the feed screen. Stop and review there.
5. Subsequent milestones fill out the v1 screen list.

## 9. Risks

- **NativeWind v4 ↔ Tailwind v4 friction.** NativeWind v4 targets Tailwind v3 config; we'd point it at the same JS-based `tailwind.config.ts` `apps/web` is using. If that proves brittle, fallback is `StyleSheet.create()` consuming the token objects directly — no Tailwind on mobile. Decide after first screen.
- **Expo Router v4 + Firebase Auth state on launch.** Need to gate the router on auth resolution to avoid flashing login → app → login. The Expo Router docs cover this; standard pattern.
- **Catalog drift.** Once mobile lands, every new string must work for both apps. The `i18n-add-string` skill will need an update; flag in the plan.

---

## Decisions captured here (so the plan doesn't re-litigate)

- Expo managed, SDK 53, EAS Build.
- Expo Router v4, file-based routes.
- NativeWind v4 over shared tokens; not v5 yet.
- v1 ships read flows + censo + register; no admin, no creation.
- Shared firebase init via `customizeAuth` for RN persistence.
- i18n catalog reused via a thin loader, not duplicated.
- One worktree, branched off `main`, single PR-per-milestone cadence.
