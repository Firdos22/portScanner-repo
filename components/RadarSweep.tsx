import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { useSettings } from '@/utils/settings';

export function RadarSweep({ size = 220 }: { size?: number }) {
  const { colors, settings } = useSettings();
  const rotate = useSharedValue(0);
  useEffect(() => {
    if (settings.animationsEnabled) {
      rotate.value = withRepeat(withTiming(360, { duration: 2600, easing: Easing.linear }), -1, false);
    }
    return () => cancelAnimation(rotate);
  }, [settings.animationsEnabled, rotate]);
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const rings = [0.33, 0.66, 1];
  const center = size / 2;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {rings.map((r, i) => (
        <View key={i} style={[styles.ring, { width: size * r, height: size * r, borderRadius: (size * r) / 2, borderColor: `${colors.primaryGlow}33` }]} />
      ))}
      <View style={[styles.crossH, { width: size, borderColor: `${colors.primaryGlow}22` }]} />
      <View style={[styles.crossV, { height: size, borderColor: `${colors.primaryGlow}22` }]} />
      <View style={[styles.dot, { left: center - 3, top: center - 3, backgroundColor: colors.accentGlow }]} />
      <Animated.View style={[styles.sweep, { width: size, height: size, borderRadius: center, borderTopColor: `${colors.accentGlow}00`, borderRightColor: `${colors.accentGlow}00`, borderBottomColor: `${colors.accentGlow}00`, borderLeftColor: colors.accentGlow }, sweepStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', borderWidth: 1 },
  crossH: { position: 'absolute', borderWidth: 0.5, height: 0 },
  crossV: { position: 'absolute', borderWidth: 0.5, width: 0 },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  sweep: { position: 'absolute', borderWidth: 2 },
});
