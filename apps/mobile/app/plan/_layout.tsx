import { Stack } from 'expo-router';

export default function PlanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="catalog" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="setup" options={{ presentation: 'card', headerShown: false }} />
    </Stack>
  );
}
