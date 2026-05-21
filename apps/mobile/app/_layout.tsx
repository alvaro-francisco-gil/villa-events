import './../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapFirebase } from '../lib/firebaseInit';
import { AuthProvider } from '../lib/auth/AuthContext';
import { I18nProvider } from '../lib/i18n';
import { useAuth } from '../lib/auth/useAuth';
import { ActivityIndicator, View } from 'react-native';

bootstrapFirebase();

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
  const { loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }
  // Both route groups coexist. Individual screens and (tabs)/_layout.tsx
  // check useAuth and redirect to /login when user is null.
  return <Stack screenOptions={{ headerShown: false }} />;
}
