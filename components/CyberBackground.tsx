import { useMemo, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSettings } from '@/utils/settings';

export function CyberBackground() {
  const { colors, settings } = useSettings();
  const particles = useMemo(
    () => Array.from({ length: 14 }).map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 2 + Math.random() * 4, duration: 6000 + Math.random() * 6000, delay: Math.random() * 4000,
    })), []);

  if (!settings.animationsEnabled) {
    return <View style={[styles.solid, { backgroundColor: colors.bg }]} />;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.solid, { backgroundColor: colors.bg }]} />
      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.lineH, { top: `${(i + 1) * 8}%`, borderColor: colors.border }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.lineV, { left: `${(i + 1) * 11}%`, borderColor: colors.border }]} />
        ))}
      </View>
      {particles.map((p) => <Particle key={p.id} {...p} color={colors.primaryGlow} />)}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, { backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

function Particle({ x, y, size, duration, delay, color }: { x: number; y: number; size: number; duration: number; delay: number; color: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withTiming(0.6, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }), -1, true));
    translateY.value = withDelay(delay, withRepeat(withTiming(-60, { duration, easing: Easing.linear }), -1, false));
    return () => { cancelAnimation(opacity); cancelAnimation(translateY); };
  }, [opacity, translateY, duration, delay]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return (
    <Animated.View style={[styles.particle, { left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />
  );
}

const styles = StyleSheet.create({
  solid: { flex: 1 },
  grid: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  lineH: { position: 'absolute', left: 0, right: 0, height: 0, borderBottomWidth: 0.5 },
  lineV: { position: 'absolute', top: 0, bottom: 0, width: 0, borderLeftWidth: 0.5 },
  particle: { position: 'absolute' },
  glowContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: { position: 'absolute', top: '-30%', left: '50%', width: 500, height: 500, marginLeft: -250, borderRadius: 500, opacity: Platform.select({ web: 0.08, default: 0.12 }) },
});
