import { View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSettings } from '@/utils/settings';
import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ style?: ViewStyle; intensity?: number }>;

export function GlassCard({ children, style, intensity = 18 }: Props) {
  const { settings, colors } = useSettings();
  return (
    <View style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, overflow: 'hidden' }, style]}>
      <BlurView intensity={intensity} style={{ flex: 1 }} tint={settings.darkMode ? 'dark' : 'light'}>
        {children}
      </BlurView>
    </View>
  );
}
