import { Tabs } from 'expo-router';
import { Radar, Home, BarChart3, GraduationCap, Trophy, Settings as SettingsIcon } from 'lucide-react-native';
import { useSettings } from '@/utils/settings';

export default function TabLayout() {
  const { colors } = useSettings();
  const icon = (name: 'home' | 'radar' | 'chart' | 'learn' | 'trophy' | 'settings') => {
    const props = { size: 22, color: colors.primaryGlow, strokeWidth: 2 };
    switch (name) {
      case 'home': return <Home {...props} />;
      case 'radar': return <Radar {...props} />;
      case 'chart': return <BarChart3 {...props} />;
      case 'learn': return <GraduationCap {...props} />;
      case 'trophy': return <Trophy {...props} />;
      case 'settings': return <SettingsIcon {...props} />;
    }
  };
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: 'rgba(5, 8, 22, 0.85)', borderTopColor: 'rgba(80, 120, 220, 0.22)', borderTopWidth: 1, height: 62, paddingBottom: 8, paddingTop: 8 },
      tabBarActiveTintColor: colors.primaryGlow,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => icon('home') }} />
      <Tabs.Screen name="scanner" options={{ title: 'Scan', tabBarIcon: () => icon('radar') }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', tabBarIcon: () => icon('chart') }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: () => icon('learn') }} />
      <Tabs.Screen name="achievements" options={{ title: 'Awards', tabBarIcon: () => icon('trophy') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => icon('settings') }} />
    </Tabs>
  );
}
