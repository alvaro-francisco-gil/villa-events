# cultuvilla mobile

Expo SDK 54 React Native app. See [docs/superpowers/specs/2026-05-19-mobile-app-scaffold-design.md](../../docs/superpowers/specs/2026-05-19-mobile-app-scaffold-design.md) for design.

## Local dev

Copy `.env.example` (or create `.env`) in `apps/mobile/` with your Firebase project values:

```
FIREBASE_API_KEY_DEV=...
FIREBASE_AUTH_DOMAIN_DEV=...
FIREBASE_PROJECT_ID_DEV=...
FIREBASE_STORAGE_BUCKET_DEV=...
FIREBASE_MESSAGING_SENDER_ID_DEV=...
FIREBASE_APP_ID_DEV=...
```

These are read by `app.config.ts` at bundle time and injected into `Constants.expoConfig.extra.firebaseConfig`. **Never commit real keys** — the `.env` file is gitignored.

```bash
APP_ENV=dev pnpm --filter cultuvilla-mobile exec expo start
```

## Builds (EAS)

| Profile        | APP_ENV | Distribution | Use |
|---------------|---------|--------------|-----|
| `development` | dev     | internal     | Dev client on simulators / devices |
| `preview-dev` | dev     | internal     | Shareable dev build |
| `preview-beta`| beta    | internal     | Internal beta testing |
| `production`  | prod    | store        | App Store / Play Store |

Trigger: `eas build --profile <name> --platform <ios|android>`
