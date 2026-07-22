import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SettingsProvider, useSettings } from '@/utils/settings';
import { ProgressProvider } from '@/context/ProgressContext';
import { AchievementToast } from '@/components/AchievementToast';
import { useProgress } from '@/context/ProgressContext';

function Gate() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'sign-up';
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primaryGlow} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="port/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

function ToastHost() {
  const { toastId, dismissToast } = useProgress();
  return <AchievementToast toastId={toastId} onDismiss={dismissToast} />;
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <SettingsProvider>
      <AuthProvider>
        <ProgressProvider>
          <Gate />
          <ToastHost />
        </ProgressProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
