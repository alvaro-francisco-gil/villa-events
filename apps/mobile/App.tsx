import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { bootstrapFirebase } from './lib/firebaseInit';

bootstrapFirebase();

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-surface p-4">
      <Text className="text-primary text-body">cultuvilla mobile — NativeWind tokens active</Text>
      <StatusBar style="auto" />
    </View>
  );
}
