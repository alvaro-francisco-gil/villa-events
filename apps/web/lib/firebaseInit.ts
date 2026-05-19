// Side-effect module: initializes the shared Firebase singleton for the web
// app with values from `NEXT_PUBLIC_FIREBASE_*`. Import this at the top of
// any entrypoint that may run before service calls (root layout, AuthContext,
// error reporter). `initFirebase` is idempotent, so re-imports are no-ops.
import { initFirebase } from '@cultuvilla/shared/firebase';

initFirebase({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});
